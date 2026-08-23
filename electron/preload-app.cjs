// Preload for the main app window (electron/main.cjs --app-window). frame:false took the native
// minimize/maximize/close buttons with it, so App.jsx renders its own in the drag strip; this is
// the ONLY bridge they have into Electron (contextIsolation is on, nodeIntegration is off), kept
// to exactly the three window actions plus maximized-state so the renderer can't do anything else.
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('ebikiWindow', {
  minimize: () => ipcRenderer.send('app-window:minimize'),
  toggleMaximize: () => ipcRenderer.send('app-window:toggle-maximize'),
  close: () => ipcRenderer.send('app-window:close'),
  isMaximized: () => ipcRenderer.invoke('app-window:is-maximized'),
  onMaximizedChange: (cb) => {
    const listener = (_event, isMaximized) => cb(isMaximized)
    ipcRenderer.on('app-window:maximized-changed', listener)
    return () => ipcRenderer.removeListener('app-window:maximized-changed', listener)
  },
})
