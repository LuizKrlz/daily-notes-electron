import { ipcMain } from "electron"
import type { DailyFilters, DailyInput, DailyUpdateInput, TaskStatus } from "../../shared/types/daily"
import { DailyService } from "../services/daily-service"

export function registerDailyIpc() {
  const service = new DailyService()

  ipcMain.handle("dailies:create", (_event, data: DailyInput) => service.createDaily(data))
  ipcMain.handle("dailies:update", (_event, id: string, data: DailyUpdateInput) => service.updateDaily(id, data))
  ipcMain.handle("dailies:delete", (_event, id: string) => service.deleteDaily(id))
  ipcMain.handle("dailies:get", (_event, id: string) => service.getDaily(id))
  ipcMain.handle("dailies:list", (_event, filters?: DailyFilters) => service.listDailies(filters))
  ipcMain.handle("dailies:search", (_event, query: string) => service.searchDailies(query))
  ipcMain.handle("tasks:updateStatus", (_event, taskId: string, status: TaskStatus) => service.updateTaskStatus(taskId, status))
}
