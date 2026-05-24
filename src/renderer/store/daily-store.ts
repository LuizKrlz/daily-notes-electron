import { create } from "zustand"
import type { Daily, DailyFilters, DailyInput, TaskStatus } from "@shared/types/daily"

interface DailyState {
  dailies: Daily[]
  selectedDaily?: Daily
  projects: string[]
  people: string[]
  projectParticipants: Record<string, string[]>
  tags: string[]
  filters: DailyFilters
  isLoading: boolean
  loadDailies: (filters?: DailyFilters) => Promise<void>
  selectDaily: (daily?: Daily) => void
  createDaily: (daily: DailyInput) => Promise<Daily>
  updateDaily: (id: string, daily: DailyInput) => Promise<Daily>
  deleteDaily: (id: string) => Promise<void>
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>
}

export const useDailyStore = create<DailyState>((set, get) => ({
  dailies: [],
  projects: [],
  people: [],
  projectParticipants: {},
  tags: [],
  filters: {},
  isLoading: false,
  loadDailies: async (filters = get().filters) => {
    set({ isLoading: true, filters })
    const result = await window.dailyNotes.listDailies(filters)
    set({
      dailies: result.dailies,
      projects: result.projects,
      people: result.people,
      projectParticipants: result.projectParticipants,
      tags: result.tags,
      selectedDaily: get().selectedDaily ?? result.dailies[0],
      isLoading: false
    })
  },
  selectDaily: (daily) => set({ selectedDaily: daily }),
  createDaily: async (daily) => {
    const created = await window.dailyNotes.createDaily(daily)
    await get().loadDailies()
    set({ selectedDaily: created })
    return created
  },
  updateDaily: async (id, daily) => {
    const updated = await window.dailyNotes.updateDaily(id, daily)
    await get().loadDailies()
    set({ selectedDaily: updated })
    return updated
  },
  deleteDaily: async (id) => {
    await window.dailyNotes.deleteDaily(id)
    const nextSelected = get().dailies.find((daily) => daily.id !== id)
    await get().loadDailies()
    set({ selectedDaily: nextSelected })
  },
  updateTaskStatus: async (taskId, status) => {
    const updatedDaily = await window.dailyNotes.updateTaskStatus(taskId, status)
    await get().loadDailies()
    if (updatedDaily) {
      set({ selectedDaily: updatedDaily })
    }
  }
}))
