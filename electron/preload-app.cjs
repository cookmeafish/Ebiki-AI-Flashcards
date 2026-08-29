// Preload for the main app window (electron/main.cjs's default mode). frame:false took the native
// minimize/maximize/close buttons with it, so App.jsx renders its own in the drag strip; this is
// the ONLY bridge they have into Electron (contextIsolation is on, nodeIntegration is off), kept
// to exactly the three window actions plus maximized-state so the renderer can't do anything else.
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('ebikiWindow', {
  minimize: () => ipcRenderer.send('app-window:minimize'),
  toggleMaximize: () => ipcRenderer.send('app-window:toggle-maximize'),
  close: () => ipcRenderer.send('app-window:close'),
  // Restart the whole app. This exists because the ONE moment a restart is most
  // needed is the moment the dev server is gone: installing an update replaces
  // node_modules and can take the server down with it, and the restart endpoint
  // lives ON that server. Going through Electron instead needs nothing running.
  restart: () => ipcRenderer.send('app-window:restart'),
  isMaximized: () => ipcRenderer.invoke('app-window:is-maximized'),
  onMaximizedChange: (cb) => {
    const listener = (_event, isMaximized) => cb(isMaximized)
    ipcRenderer.on('app-window:maximized-changed', listener)
    return () => ipcRenderer.removeListener('app-window:maximized-changed', listener)
  },
})
