import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"
import { app } from "electron"
import Database from "better-sqlite3"
import { DATABASE_DIRECTORY, DATABASE_FILENAME } from "../../shared/constants/app"
import { createSchemaSql } from "./schema"

let database: Database.Database | undefined

export function getDatabase() {
  if (database) {
    return database
  }

  const appSupport = app.getPath("appData")
  const databaseDir = path.join(appSupport, DATABASE_DIRECTORY)
  fs.mkdirSync(databaseDir, { recursive: true })

  database = new Database(path.join(databaseDir, DATABASE_FILENAME))
  database.pragma("journal_mode = WAL")
  database.pragma("foreign_keys = ON")
  database.exec(createSchemaSql)
  migrateDatabase(database)

  return database
}

function migrateDatabase(db: Database.Database) {
  const dailyColumns = db.prepare("PRAGMA table_info(dailies)").all() as Array<{ name: string }>
  const hasDailyDate = dailyColumns.some((column) => column.name === "daily_date")

  if (!hasDailyDate) {
    db.exec("ALTER TABLE dailies ADD COLUMN daily_date TEXT")
    db.exec("UPDATE dailies SET daily_date = date(created_at, 'localtime') WHERE daily_date IS NULL OR daily_date = ''")
  }

  const hasProjectId = dailyColumns.some((column) => column.name === "project_id")
  if (!hasProjectId) {
    db.exec("ALTER TABLE dailies ADD COLUMN project_id TEXT")
  }

  db.exec("CREATE INDEX IF NOT EXISTS idx_dailies_daily_date ON dailies(daily_date DESC)")
  db.exec("CREATE INDEX IF NOT EXISTS idx_dailies_project_id ON dailies(project_id)")
  migrateProjectsAndPeople(db)

  const dailyTaskColumns = db.prepare("PRAGMA table_info(daily_tasks)").all() as Array<{ name: string }>
  const hasStatus = dailyTaskColumns.some((column) => column.name === "status")

  if (!hasStatus) {
    db.exec("ALTER TABLE daily_tasks ADD COLUMN status TEXT NOT NULL DEFAULT 'todo'")
  }

  db.exec("UPDATE daily_tasks SET status = 'done' WHERE completed = 1 AND status != 'done'")
}

function migrateProjectsAndPeople(db: Database.Database) {
  const timestamp = new Date().toISOString()
  const projectRows = db.prepare("SELECT DISTINCT project FROM dailies WHERE project IS NOT NULL AND project != ''").all() as Array<{ project: string }>
  const insertProject = db.prepare("INSERT OR IGNORE INTO projects (id, name, created_at) VALUES (?, ?, ?)")
  const findProject = db.prepare("SELECT id FROM projects WHERE name = ?")
  const updateDailyProject = db.prepare("UPDATE dailies SET project_id = ? WHERE project = ? AND (project_id IS NULL OR project_id = '')")

  projectRows.forEach((row) => {
    insertProject.run(crypto.randomUUID(), row.project, timestamp)
    const project = findProject.get(row.project) as { id: string } | undefined
    if (project) {
      updateDailyProject.run(project.id, row.project)
    }
  })

  const participantRows = tableExists(db, "participants")
    ? (db.prepare("SELECT daily_id, name FROM participants").all() as Array<{ daily_id: string; name: string }>)
    : []
  const insertPerson = db.prepare("INSERT OR IGNORE INTO people (id, name, created_at) VALUES (?, ?, ?)")
  const findPerson = db.prepare("SELECT id FROM people WHERE name = ?")
  const insertDailyPerson = db.prepare("INSERT OR IGNORE INTO daily_people (daily_id, person_id) VALUES (?, ?)")
  const insertProjectPerson = db.prepare("INSERT OR IGNORE INTO project_people (project_id, person_id) VALUES (?, ?)")
  const findDailyProject = db.prepare("SELECT project_id FROM dailies WHERE id = ?")

  participantRows.forEach((row) => {
    const name = row.name.trim()
    if (!name) {
      return
    }

    insertPerson.run(crypto.randomUUID(), name, timestamp)
    const person = findPerson.get(name) as { id: string } | undefined
    if (!person) {
      return
    }

    insertDailyPerson.run(row.daily_id, person.id)
    const daily = findDailyProject.get(row.daily_id) as { project_id: string | null } | undefined
    if (daily?.project_id) {
      insertProjectPerson.run(daily.project_id, person.id)
    }
  })

  if (tableExists(db, "participants")) {
    db.exec("DROP TABLE participants")
  }
}

function tableExists(db: Database.Database, tableName: string) {
  const row = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(tableName)
  return Boolean(row)
}
