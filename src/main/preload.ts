import { contextBridge, ipcRenderer } from "electron"
import type { DailyFilters, DailyInput, DailyUpdateInput, TaskStatus } from "../shared/types/daily"

const dailyNotesApi = {
  createDaily: (data: DailyInput) => ipcRenderer.invoke("dailies:create", data),
  updateDaily: (id: string, data: DailyUpdateInput) => ipcRenderer.invoke("dailies:update", id, data),
  deleteDaily: (id: string) => ipcRenderer.invoke("dailies:delete", id),
  getDaily: (id: string) => ipcRenderer.invoke("dailies:get", id),
  listDailies: (filters?: DailyFilters) => ipcRenderer.invoke("dailies:list", filters),
  searchDailies: (query: string) => ipcRenderer.invoke("dailies:search", query),
  updateTaskStatus: (taskId: string, status: TaskStatus) => ipcRenderer.invoke("tasks:updateStatus", taskId, status)
}

contextBridge.exposeInMainWorld("dailyNotes", dailyNotesApi)

export type DailyNotesApi = typeof dailyNotesApi
