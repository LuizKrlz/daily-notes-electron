import type { DailyNotesApi } from "../../main/preload"

declare global {
  interface Window {
    dailyNotes: DailyNotesApi
  }
}

export {}
