import crypto from "node:crypto"
import type { Database } from "better-sqlite3"
import { dailyFiltersSchema, dailyInputSchema, dailyUpdateSchema } from "../../shared/schemas/daily"
import type { Daily, DailyFilters, DailyInput, DailyListResult, DailyTask, DailyUpdateInput, TaskStatus } from "../../shared/types/daily"
import { getDatabase } from "../database/connection"

type DailyRow = {
  id: string
  title: string
  daily_date: string
  project: string | null
  summary: string | null
  yesterday: string | null
  today: string | null
  blockers: string | null
  discussions: string | null
  decisions: string | null
  next_steps: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

const emptyToNull = (value?: string) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

const now = () => new Date().toISOString()
const today = () => new Date().toISOString().slice(0, 10)
const id = () => crypto.randomUUID()

export class DailyService {
  private db: Database

  constructor(db = getDatabase()) {
    this.db = db
  }

  createDaily(input: DailyInput): Daily {
    const data = dailyInputSchema.parse(input)
    const dailyId = id()
    const timestamp = now()

    const transaction = this.db.transaction(() => {
      this.db
        .prepare(
          `INSERT INTO dailies (
            id, title, daily_date, project, summary, yesterday, today, blockers, discussions,
            decisions, next_steps, notes, created_at, updated_at
          ) VALUES (
            @id, @title, @dailyDate, @project, @summary, @yesterday, @today, @blockers,
            @discussions, @decisions, @nextSteps, @notes, @createdAt, @updatedAt
          )`
        )
        .run({
          id: dailyId,
          title: data.title.trim(),
          dailyDate: data.dailyDate || today(),
          project: emptyToNull(data.project),
          summary: emptyToNull(data.summary),
          yesterday: emptyToNull(data.yesterday),
          today: emptyToNull(data.today),
          blockers: emptyToNull(data.blockers),
          discussions: emptyToNull(data.discussions),
          decisions: emptyToNull(data.decisions),
          nextSteps: emptyToNull(data.nextSteps),
          notes: emptyToNull(data.notes),
          createdAt: timestamp,
          updatedAt: timestamp
        })

      this.replaceParticipants(dailyId, data.participants)
      this.replaceTags(dailyId, data.tags)
      this.replaceTasks(dailyId, data.tasks)
    })

    transaction()
    return this.getDaily(dailyId)!
  }

  updateDaily(dailyId: string, input: DailyUpdateInput): Daily {
    const existing = this.getDaily(dailyId)
    if (!existing) {
      throw new Error("Daily not found")
    }

    const data = dailyUpdateSchema.parse(input)
    const nextDaily: DailyInput = {
      title: data.title ?? existing.title,
      dailyDate: data.dailyDate ?? existing.dailyDate,
      project: data.project ?? existing.project,
      participants: data.participants ?? existing.participants,
      summary: data.summary ?? existing.summary,
      yesterday: data.yesterday ?? existing.yesterday,
      today: data.today ?? existing.today,
      blockers: data.blockers ?? existing.blockers,
      discussions: data.discussions ?? existing.discussions,
      decisions: data.decisions ?? existing.decisions,
      nextSteps: data.nextSteps ?? existing.nextSteps,
      notes: data.notes ?? existing.notes,
      tasks: data.tasks ?? existing.tasks,
      tags: data.tags ?? existing.tags
    }
    const timestamp = now()

    const transaction = this.db.transaction(() => {
      this.db
        .prepare(
          `UPDATE dailies SET
            title = @title,
            daily_date = @dailyDate,
            project = @project,
            summary = @summary,
            yesterday = @yesterday,
            today = @today,
            blockers = @blockers,
            discussions = @discussions,
            decisions = @decisions,
            next_steps = @nextSteps,
            notes = @notes,
            updated_at = @updatedAt
          WHERE id = @id`
        )
        .run({
          id: dailyId,
          title: nextDaily.title.trim(),
          dailyDate: nextDaily.dailyDate || today(),
          project: emptyToNull(nextDaily.project),
          summary: emptyToNull(nextDaily.summary),
          yesterday: emptyToNull(nextDaily.yesterday),
          today: emptyToNull(nextDaily.today),
          blockers: emptyToNull(nextDaily.blockers),
          discussions: emptyToNull(nextDaily.discussions),
          decisions: emptyToNull(nextDaily.decisions),
          nextSteps: emptyToNull(nextDaily.nextSteps),
          notes: emptyToNull(nextDaily.notes),
          updatedAt: timestamp
        })

      this.replaceParticipants(dailyId, nextDaily.participants)
      this.replaceTags(dailyId, nextDaily.tags)
      this.replaceTasks(dailyId, nextDaily.tasks)
    })

    transaction()
    return this.getDaily(dailyId)!
  }

  deleteDaily(dailyId: string) {
    this.db.prepare("DELETE FROM dailies WHERE id = ?").run(dailyId)
  }

  getDaily(dailyId: string): Daily | null {
    const row = this.db.prepare("SELECT * FROM dailies WHERE id = ?").get(dailyId) as DailyRow | undefined
    return row ? this.hydrateDaily(row) : null
  }

  listDailies(filters: DailyFilters = {}): DailyListResult {
    const parsedFilters = dailyFiltersSchema.parse(filters)
    const clauses: string[] = []
    const params: Record<string, string> = {}

    if (parsedFilters.project) {
      clauses.push("d.project = @project")
      params.project = parsedFilters.project
    }

    if (parsedFilters.tag) {
      clauses.push("EXISTS (SELECT 1 FROM daily_tags dt JOIN tags t ON t.id = dt.tag_id WHERE dt.daily_id = d.id AND t.name = @tag)")
      params.tag = parsedFilters.tag
    }

    if (parsedFilters.period === "today") {
      clauses.push("d.daily_date = date('now', 'localtime')")
    }

    if (parsedFilters.date) {
      clauses.push("d.daily_date = @date")
      params.date = parsedFilters.date
    }

    if (parsedFilters.query) {
      clauses.push(`(
        d.title LIKE @query OR d.project LIKE @query OR d.summary LIKE @query OR
        d.yesterday LIKE @query OR d.today LIKE @query OR d.blockers LIKE @query OR
        d.discussions LIKE @query OR d.decisions LIKE @query OR d.next_steps LIKE @query OR
        d.notes LIKE @query OR
        EXISTS (SELECT 1 FROM participants p WHERE p.daily_id = d.id AND p.name LIKE @query) OR
        EXISTS (SELECT 1 FROM daily_tasks task WHERE task.daily_id = d.id AND task.title LIKE @query) OR
        EXISTS (SELECT 1 FROM daily_tags dt JOIN tags t ON t.id = dt.tag_id WHERE dt.daily_id = d.id AND t.name LIKE @query)
      )`)
      params.query = `%${parsedFilters.query}%`
    }

    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""
    const rows = this.db.prepare(`SELECT d.* FROM dailies d ${where} ORDER BY d.daily_date DESC, d.created_at DESC`).all(params) as DailyRow[]

    return {
      dailies: rows.map((row) => this.hydrateDaily(row)),
      projects: this.listProjects(),
      tags: this.listTags()
    }
  }

  searchDailies(query: string): Daily[] {
    return this.listDailies({ query }).dailies
  }

  updateTaskStatus(taskId: string, status: TaskStatus): Daily | null {
    if (!["todo", "doing", "done"].includes(status)) {
      throw new Error("Invalid task status")
    }

    const task = this.db.prepare("SELECT daily_id FROM daily_tasks WHERE id = ?").get(taskId) as { daily_id: string } | undefined
    if (!task) {
      return null
    }

    this.db
      .prepare("UPDATE daily_tasks SET status = ?, completed = ? WHERE id = ?")
      .run(status, status === "done" ? 1 : 0, taskId)

    return this.getDaily(task.daily_id)
  }

  private hydrateDaily(row: DailyRow): Daily {
    return {
      id: row.id,
      title: row.title,
      dailyDate: row.daily_date,
      project: row.project ?? undefined,
      participants: this.listParticipants(row.id),
      summary: row.summary ?? undefined,
      yesterday: row.yesterday ?? undefined,
      today: row.today ?? undefined,
      blockers: row.blockers ?? undefined,
      discussions: row.discussions ?? undefined,
      decisions: row.decisions ?? undefined,
      nextSteps: row.next_steps ?? undefined,
      notes: row.notes ?? undefined,
      tasks: this.listTasks(row.id),
      tags: this.listDailyTags(row.id),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }

  private replaceParticipants(dailyId: string, participants: string[]) {
    this.db.prepare("DELETE FROM participants WHERE daily_id = ?").run(dailyId)
    const insert = this.db.prepare("INSERT INTO participants (id, daily_id, name) VALUES (?, ?, ?)")
    Array.from(new Set(participants.map((item) => item.trim()).filter(Boolean))).forEach((name) => {
      insert.run(id(), dailyId, name)
    })
  }

  private replaceTags(dailyId: string, tags: string[]) {
    this.db.prepare("DELETE FROM daily_tags WHERE daily_id = ?").run(dailyId)
    const insertTag = this.db.prepare("INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)")
    const findTag = this.db.prepare("SELECT id FROM tags WHERE name = ?")
    const insertDailyTag = this.db.prepare("INSERT OR IGNORE INTO daily_tags (daily_id, tag_id) VALUES (?, ?)")

    Array.from(new Set(tags.map((item) => item.trim().toLowerCase()).filter(Boolean))).forEach((name) => {
      insertTag.run(id(), name)
      const tag = findTag.get(name) as { id: string }
      insertDailyTag.run(dailyId, tag.id)
    })
  }

  private replaceTasks(dailyId: string, tasks: DailyInput["tasks"]) {
    this.db.prepare("DELETE FROM daily_tasks WHERE daily_id = ?").run(dailyId)
    const insert = this.db.prepare(
      "INSERT INTO daily_tasks (id, daily_id, title, status, position, completed, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    const seen = new Set<string>()

    tasks.forEach((task, index) => {
      const title = task.title.trim()
      if (!title || seen.has(title.toLowerCase())) {
        return
      }

      seen.add(title.toLowerCase())
      const status = task.status ?? "todo"
      insert.run(task.id || id(), dailyId, title, status, index, status === "done" ? 1 : 0, now())
    })
  }

  private listParticipants(dailyId: string) {
    return this.db.prepare("SELECT name FROM participants WHERE daily_id = ? ORDER BY name").all(dailyId).map((row) => (row as { name: string }).name)
  }

  private listDailyTags(dailyId: string) {
    return this.db
      .prepare("SELECT t.name FROM tags t JOIN daily_tags dt ON dt.tag_id = t.id WHERE dt.daily_id = ? ORDER BY t.name")
      .all(dailyId)
      .map((row) => (row as { name: string }).name)
  }

  private listTasks(dailyId: string): DailyTask[] {
    return this.db
      .prepare("SELECT id, title, status FROM daily_tasks WHERE daily_id = ? ORDER BY position, created_at")
      .all(dailyId)
      .map((row) => row as DailyTask)
  }

  private listProjects() {
    return this.db
      .prepare("SELECT DISTINCT project FROM dailies WHERE project IS NOT NULL AND project != '' ORDER BY project")
      .all()
      .map((row) => (row as { project: string }).project)
  }

  private listTags() {
    return this.db
      .prepare("SELECT name FROM tags ORDER BY name")
      .all()
      .map((row) => (row as { name: string }).name)
  }
}
