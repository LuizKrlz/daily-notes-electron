import fs from "node:fs"
import path from "node:path"
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
  db.exec("CREATE INDEX IF NOT EXISTS idx_dailies_daily_date ON dailies(daily_date DESC)")

  const dailyTaskColumns = db.prepare("PRAGMA table_info(daily_tasks)").all() as Array<{ name: string }>
  const hasStatus = dailyTaskColumns.some((column) => column.name === "status")

  if (!hasStatus) {
    db.exec("ALTER TABLE daily_tasks ADD COLUMN status TEXT NOT NULL DEFAULT 'todo'")
  }

  db.exec("UPDATE daily_tasks SET status = 'done' WHERE completed = 1 AND status != 'done'")
}
