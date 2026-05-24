export type TaskStatus = "todo" | "doing" | "done"

export interface DailyTask {
  id: string
  title: string
  status: TaskStatus
}

export interface DailyTaskInput {
  id?: string
  title: string
  status?: TaskStatus
}

export interface Daily {
  id: string
  title: string
  dailyDate: string
  project?: string
  participants: string[]
  summary?: string
  yesterday?: string
  today?: string
  blockers?: string
  discussions?: string
  decisions?: string
  nextSteps?: string
  notes?: string
  tasks: DailyTask[]
  tags: string[]
  createdAt: string
  updatedAt: string
}

export type DailyInput = Omit<Daily, "id" | "createdAt" | "updatedAt" | "tasks"> & {
  tasks: DailyTaskInput[]
}

export type DailyUpdateInput = Partial<DailyInput>

export interface DailyFilters {
  query?: string
  project?: string
  tag?: string
  period?: "today"
  date?: string
}

export interface DailyListResult {
  dailies: Daily[]
  projects: string[]
  people: string[]
  projectParticipants: Record<string, string[]>
  tags: string[]
}
