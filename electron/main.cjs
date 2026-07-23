const { app, BrowserWindow, globalShortcut, screen, desktopCapturer, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')

const VITE_URL = 'http://localhost:3000'
const SCREENSHOT_FILE = path.resolve('electron/last-capture.png')
let overlayWindow = null

app.whenReady().then(() => {
  createOverlay()
  registerShortcuts()
  console.log('[Overlay] Ready. Alt+Q to capture.')
})

function createOverlay() {
  const { width, height } = screen.getPrimaryDisplay().bounds
  overlayWindow = new BrowserWindow({
    width, height, x: 0, y: 0,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
    },
  })

  overlayWindow.loadURL(VITE_URL + '?overlay=true')

  // ESC / window.close() → hide instead of closing
  overlayWindow.on('close', (e) => {
    e.preventDefault()
    hideOverlay()
  })

  overlayWindow.webContents.on('console-message', (_, l, m) => console.log('[Renderer]', m))
  overlayWindow.webContents.on('did-finish-load', () => console.log('[Overlay] Web app loaded'))
}

function showOverlay() {
  const bounds = screen.getPrimaryDisplay().bounds
  overlayWindow.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height })
  overlayWindow.show()
  overlayWindow.setAlwaysOnTop(true, 'screen-saver')
  overlayWindow.focus()
  // Register ESC only while overlay is visible so it doesn't steal ESC from other apps
  globalShortcut.register('Escape', () => {
    console.log('[Overlay] ESC — hiding')
    hideOverlay()
  })
}

function hideOverlay() {
  if (globalShortcut.isRegistered('Escape')) globalShortcut.unregister('Escape')
  if (overlayWindow) overlayWindow.hide()
}

function registerShortcuts() {
  globalShortcut.register('Alt+Q', async () => {
    console.log('[Overlay] Capture triggered')
    if (overlayWindow.isVisible()) {
      hideOverlay()
      await new Promise(r => setTimeout(r, 200))
    }
    await new Promise(r => setTimeout(r, 300))

    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen'], thumbnailSize: screen.getPrimaryDisplay().size,
      })
      if (!sources.length) return

      fs.writeFileSync(SCREENSHOT_FILE, sources[0].thumbnail.toPNG())
      console.log('[Overlay] Screenshot saved')

      // Hide page content so old screenshot doesn't flash, then show overlay
      await overlayWindow.webContents.executeJavaScript(`
        document.body.style.opacity = '0';
        window.dispatchEvent(new CustomEvent('overlay-reset'));
      `)

      showOverlay()

      overlayWindow.webContents.executeJavaScript(`
        window.__overlayScreenshot = '/api/overlay-screenshot?' + Date.now();
        window.dispatchEvent(new CustomEvent('overlay-capture'));
      `)
    } catch (e) { console.error('[Overlay] Error:', e) }
  })
}

ipcMain.on('overlay-dismiss', () => {
  hideOverlay()
})

ipcMain.on('resize-overlay', (_, bounds) => {
  if (overlayWindow) {
    overlayWindow.setBounds(bounds)
    overlayWindow.setAlwaysOnTop(true, 'screen-saver')
  }
})

// React requests a screenshot capture (for area-select: capture after drawing)
ipcMain.handle('capture-screenshot', async () => {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'], thumbnailSize: screen.getPrimaryDisplay().size,
    })
    if (!sources.length) return null
    fs.writeFileSync(SCREENSHOT_FILE, sources[0].thumbnail.toPNG())
    console.log('[Overlay] Screenshot captured on demand')
    return '/api/overlay-screenshot?' + Date.now()
  } catch (e) {
    console.error('[Overlay] Capture error:', e)
    return null
  }
})

app.on('will-quit', () => globalShortcut.unregisterAll())
