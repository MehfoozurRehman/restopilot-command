import { app, BrowserWindow, shell } from 'electron'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const isDev = !!process.env.VITE_DEV_SERVER_URL
const __dirname = fileURLToPath(new URL('.', import.meta.url))
const iconPath = join(__dirname, '../build/icon.png')

function createWindow() {
  const window = new BrowserWindow({
    width: 1480,
    height: 940,
    minWidth: 1180,
    minHeight: 760,
    title: 'RestoPilot Command',
    icon: iconPath,
    backgroundColor: '#f7f5ef',
    webPreferences: {
      preload: join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (isDev) {
    window.loadURL(process.env.VITE_DEV_SERVER_URL!)
  } else {
    window.loadFile(join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
