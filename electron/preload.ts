import { contextBridge } from 'electron'

contextBridge.exposeInMainWorld('restaurantShell', {
  platform: process.platform,
})
