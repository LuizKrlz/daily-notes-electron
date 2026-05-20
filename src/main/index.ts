import path from "node:path"
import { app, BrowserWindow } from "electron"
import { APP_NAME } from "../shared/constants/app"
import { getDatabase } from "./database/connection"
import { registerDailyIpc } from "./ipc/daily-ipc"

const isDev = !app.isPackaged

function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 980,
    minHeight: 680,
    title: APP_NAME,
    backgroundColor: "#f8fafc",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  if (isDev) {
    window.loadURL("http://127.0.0.1:5173")
    window.webContents.openDevTools({ mode: "detach" })
    return
  }

  window.loadFile(path.join(__dirname, "../renderer/index.html"))
}

app.whenReady().then(() => {
  getDatabase()
  registerDailyIpc()
  createWindow()

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})
