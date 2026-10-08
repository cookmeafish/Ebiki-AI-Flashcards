// Preload for the Alt+Q overlay. Exactly what the overlay page uses (App.jsx): dismiss, an on-demand capture and
// a resize. Nothing more: onCapture/onDismiss listened for IPC the main process never sends (it signals the page
// with DOM events), and setIgnoreMouse sent to a channel nothing handled.
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('overlayAPI', {
  dismiss: () => ipcRenderer.send('overlay-dismiss'),
  captureScreenshot: () => ipcRenderer.invoke('capture-screenshot'),
  resizeWindow: (bounds) => ipcRenderer.send('resize-overlay', bounds),
})
