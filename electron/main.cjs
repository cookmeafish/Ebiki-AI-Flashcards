const { app, BrowserWindow, globalShortcut, screen, desktopCapturer, ipcMain, Menu, MenuItem, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const http = require('http')
const { spawn } = require('child_process')

const APP_ROOT = path.join(__dirname, '..')

// How this computer opens Ebiki - 'app' (this chrome-free window) or 'browser' (an ordinary tab).
// Machine-local and read straight off disk because the branch below happens BEFORE there is a dev
// server to ask. Kept in step with readLaunchMode in vite.config.js and Get-LaunchMode in
// scripts/launch.ps1; anything missing or unreadable means 'app', today's default.
function readLaunchMode() {
  try {
    const m = JSON.parse(fs.readFileSync(path.join(APP_ROOT, 'launchmode.json'), 'utf-8'))?.mode
    return m === 'browser' ? 'browser' : 'app'
  } catch { return 'app' }
}

// Hand the launch back to the real launcher (scripts/launch.ps1 / launch.sh), the ONLY thing that
// knows how to start Anki, run the update check and bring the dev server up. Used by the bare-launch
// branch below. Cannot recurse: in browser mode the launcher opens a tab and never Electron, and in
// app mode the Electron it starts carries --from-launcher and loses the single-instance lock to us.
// Tell the dev server that an app window is up (see /api/launchmode/hello in vite.config.js). The
// renderer does this on mount; the main process needs it for the focus-an-existing-window case
// below, where no page ever loads. Fail-soft in every direction: no server, no handoff, no problem.
function sayHello() {
  try {
    const body = JSON.stringify({ kind: 'app' })
    const req = http.request(VITE_URL + '/api/launchmode/hello', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, (res) => res.resume())
    req.on('error', () => {})
    req.setTimeout(2000, () => req.destroy())
    req.end(body)
  } catch { /* nothing depends on this succeeding */ }
}

function delegateToLauncher() {
  try {
    if (process.platform === 'win32') {
      // The VBS, not the .ps1 directly: it also pops the start-up splash, so a pinned-icon click
      // shows something immediately instead of looking like it did nothing.
      spawn('wscript.exe', [path.join(APP_ROOT, 'launch-ebiki.vbs')], { cwd: APP_ROOT, detached: true, stdio: 'ignore' }).unref()
    } else {
      spawn('bash', [path.join(APP_ROOT, 'scripts', 'launch.sh')], { cwd: APP_ROOT, detached: true, stdio: 'ignore' }).unref()
    }
    return true
  } catch (e) {
    console.error('[App window] could not hand off to the launcher:', e.message)
    return false
  }
}

const VITE_URL = 'http://localhost:3000'
const SCREENSHOT_FILE = path.resolve('electron/last-capture.png')
let overlayWindow = null

// ── Main app window (the DEFAULT mode) ──────────────────────────────────────
// A SEPARATE Electron process from the overlay below (the overlay is spawned
// on demand by the vite dev server itself via /api/launch-overlay and keeps
// running invisibly for Alt+Q; this one is spawned directly by
// scripts/launch.ps1 / scripts/launch.sh in place of opening a browser tab).
// It gives Ebiki its own taskbar icon/identity and a completely chrome-free
// window (no tab strip, no address bar - that chrome was the actual
// complaint that started this: a plain browser tab always carries it, no
// matter how it's launched, and hiding it isn't an option in a real
// browser). Maximized, not OS-fullscreen, so the taskbar stays visible and
// it behaves like an ordinary maximized browser window - just without the
// browser part. F11 still offers real fullscreen for anyone who wants it.
//
// DEFAULT mode, not gated behind a flag - overlay mode is what needs the
// explicit --overlay flag now (see the bottom of this file). This used to be
// backwards (app-window needed --app-window, overlay was the default) until
// a real Windows pin-to-taskbar exposed why that's wrong: "pin to taskbar"
// on a running window whose process is a bare, unpackaged Ebiki.exe (no
// registered shortcut with matching Arguments for Windows to fall back to)
// only remembers the EXE PATH, not the command-line arguments it was
// launched with - so double-clicking that pin re-invokes Ebiki.exe with NO
// arguments at all, and Electron's own fallback for "no app given" is its
// generic getting-started demo screen (reported as "still turns into
// electron picture"). package.json's "main" field means a bare, argument-
// less launch loads this same file too (Electron's own no-args behavior:
// look for an app in the launch directory's package.json) - so the fix is
// making that bare case resolve to the actually-useful mode by default.
const isOverlayMode = process.argv.includes('--overlay')
let appWindow = null

if (isOverlayMode) {
  app.whenReady().then(() => {
    createOverlay()
    registerShortcuts()
    console.log('[Overlay] Ready. Alt+Q to capture.')
  })
} else {
  // Windows taskbar grouping/pinning/jump-list identity - without this an
  // Electron app launched from node_modules can be grouped under a generic
  // "Electron" identity instead of its own. Harmless on other platforms.
  app.setAppUserModelId('com.ebiki.app')

  // Single instance for the WINDOW itself, on top of launch.ps1/launch.sh's
  // own "one dev server ever" guard: without this, clicking the shortcut
  // twice (or launching while unsure it's already open) could spawn a
  // second Electron process with its own separate window and its own
  // separate React state, silently diverging from the first - the exact
  // "multiple instances open" problem the browser-tab approach had. Whoever
  // gets the lock first wins; every later launch just focuses that window
  // and exits immediately, so there is never more than one.
  // ── BARE LAUNCH (no --from-launcher): the taskbar pin of Ebiki.exe itself ──
  // Pinning a RUNNING unpackaged Electron window pins the exe PATH and nothing else - no arguments,
  // no launcher, no dev server (see the header comment above). That has two consequences this
  // branch exists to fix:
  //   1. The user's launch-mode choice lives in launchmode.json, which only the launcher reads. A
  //      pin click would ignore it and always open the app window, so "browser mode" would silently
  //      not apply to the one shortcut people use most.
  //   2. Nothing starts `npm run dev` on this path, so the window could only ever sit on its
  //      holding page until the user happened to start a server by hand.
  // Handing back to the launcher fixes both at once, and it is what the pin was always meant to do.
  const fromLauncher = process.argv.includes('--from-launcher')
  if (!fromLauncher && readLaunchMode() === 'browser') {
    console.log('[App window] launch mode is "browser" - handing off to the launcher')
    delegateToLauncher()
    app.quit()
    return
  }

  const gotLock = app.requestSingleInstanceLock()
  if (!gotLock) {
    app.quit()
  } else {
    app.on('second-instance', () => {
      if (!appWindow) return
      if (appWindow.isMinimized()) appWindow.restore()
      appWindow.focus()
      // Also report in for a live launch-mode switch. Switching browser -> app while an app window
      // is ALREADY open ends here: the new process loses the single-instance lock and quits without
      // ever loading a page, so the renderer's own hello never fires - and the browser tab waiting
      // to hand over would sit there until it timed out, even though Ebiki is now on screen exactly
      // as asked. Focusing an existing window IS the switch completing, so say so.
      sayHello()
    })
    app.whenReady().then(() => {
      createAppWindow()
      // Same bare-launch hole, app-mode half: nothing started the dev server, so without this the
      // window would hold forever. Only when the port is genuinely not answering, and only on a
      // bare launch - a launcher-started window already has one coming. createAppWindow's retry
      // loop then picks the server up by itself the moment it answers.
      if (!fromLauncher) {
        waitForServer(VITE_URL, 1200).then((up) => {
          if (up) return
          console.log('[App window] no dev server on a bare launch - starting one via the launcher')
          delegateToLauncher()
        })
      }
      console.log('[App window] Ready.')
    })
    app.on('window-all-closed', () => app.quit())
  }
}

// Waits for the dev server to actually answer before pointing the window at
// it - this process can be spawned at the same moment as `npm run dev`
// (launch.ps1/launch.sh don't necessarily wait for the port before starting
// Electron), and loadURL against a not-yet-listening port fails immediately
// with no automatic retry.
function waitForServer(url, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs
  return new Promise((resolve) => {
    const tryOnce = () => {
      const req = http.get(url, (res) => { res.resume(); resolve(true) })
      req.on('error', () => {
        if (Date.now() > deadline) return resolve(false)
        setTimeout(tryOnce, 500)
      })
      req.setTimeout(2000, () => req.destroy())
    }
    tryOnce()
  })
}

function createAppWindow() {
  const iconPath = path.join(__dirname, '..', 'ebiki.ico')
  appWindow = new BrowserWindow({
    show: false,
    frame: false,             // no tab strip, no address bar, no browser chrome at all
    // frame:false means no native title bar - which is also what you'd normally drag to move/
    // restore the window, so a drag strip is rendered in the app itself (App.jsx, gated on
    // isElectronApp) to get that back. resizable is Electron's default already; explicit here
    // because frame:false windows losing edge-resize is an easy thing to accidentally regress.
    resizable: true,
    // The header's tab bar (Chat/Study/Deck/Discover/Picture/Stats) has no wrap or shrink
    // behavior of its own - it silently overflows the header's bounds and gets clipped by
    // body{overflow-x:hidden} below ~820px (measured live via CDP), which is how "Stats" was
    // disappearing entirely on a manually-shrunk window. 1000 gives real margin above that
    // (translated tab labels run longer than English - Spanish "Estadísticas" vs "Stats" - and
    // still leaves the window comfortably smaller than any real screen, unlike a much larger
    // minWidth chosen just to avoid the header ever wrapping to two lines at all, which App.jsx's
    // headerWrapped handles responsively instead). minHeight is a general "still usable" floor.
    minWidth: 1000,
    minHeight: 650,
    backgroundColor: '#F2F5F8', // matches the app's default light theme - avoids a white/black flash
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    title: 'Ebiki',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      // Bridges minimize/maximize/close into the renderer (App.jsx renders the actual buttons,
      // in its own header, styled to match the app - frame:false took the native ones with it).
      preload: path.join(__dirname, 'preload-app.cjs'),
    },
  })

  // Maximized (taskbar stays visible, just like a maximized browser window),
  // not OS-level fullscreen - that would cover the taskbar, which is
  // explicitly not what was asked for. F11 below still offers real
  // fullscreen for anyone who wants it.
  appWindow.once('ready-to-show', () => {
    appWindow.maximize()
    appWindow.show()
    // Retire the start-up splash (scripts/splash.hta, opened by
    // launch-ebiki.vbs the moment the shortcut is clicked). It watches for this
    // marker file, and THIS is the only moment that honestly means "the app is
    // on screen" - the launcher can only see that it spawned a process, which
    // is still seconds away from a visible window. Fail-soft: a splash that is
    // never told also closes itself, just later.
    try { fs.writeFileSync(path.join(__dirname, '..', '.app-ready'), '') } catch {}
  })

  // Window controls, driven from the renderer via preload-app.cjs - the ONLY thing this process
  // exposes to it. Push the maximized state back so App.jsx's restore/maximize icon stays correct
  // even when the state changes some other way (double-clicking the drag strip, Aero-snap, etc).
  const sendMaximizedState = () => { if (appWindow) appWindow.webContents.send('app-window:maximized-changed', appWindow.isMaximized()) }
  appWindow.on('maximize', sendMaximizedState)
  appWindow.on('unmaximize', sendMaximizedState)
  ipcMain.on('app-window:minimize', () => appWindow?.minimize())
  ipcMain.on('app-window:toggle-maximize', () => {
    if (!appWindow) return
    if (appWindow.isMaximized()) appWindow.unmaximize()
    else appWindow.maximize()
  })
  ipcMain.on('app-window:close', () => appWindow?.close())
  ipcMain.handle('app-window:is-maximized', () => (appWindow ? appWindow.isMaximized() : false))

  appWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return
    if (input.key === 'F11') {
      appWindow.setFullScreen(!appWindow.isFullScreen())
    } else if (input.key === 'Escape' && appWindow.isFullScreen()) {
      appWindow.setFullScreen(false)
    }
  })

  // ── External links go to the REAL browser, never to a window we open ────────
  // Ebiki is not a browser and must never pretend to be one. With no handler at all, Electron's
  // default for target="_blank" is to open a CHILD BrowserWindow - and every external link in the
  // app (Get an API key, chat and Discover sources, the Wiktionary audio credit) landed in a bare
  // Electron window with no address bar, no back button and no way to recover if the link
  // redirected. That is a strictly worse browser than the one the user already has, and it is the
  // opposite of what "get an API key" means: that link has to land somewhere they can log in, use
  // their password manager, and keep the tab.
  //
  // So: deny the child window, hand the URL to the OS default browser. Only http(s) is forwarded -
  // openExternal will happily launch other protocol handlers, and a page should not get to choose
  // one.
  const openExternally = (url) => {
    if (!/^https?:\/\//i.test(url || '')) return
    shell.openExternal(url).catch((e) => console.warn('[App window] openExternal failed:', e.message))
  }
  appWindow.webContents.setWindowOpenHandler(({ url }) => {
    openExternally(url)
    return { action: 'deny' }
  })
  // The same thing one level down: a plain link with no target would NAVIGATE this window off the
  // app (no chrome, so there is no way back - it would look like Ebiki had died). The app itself
  // only ever lives on the dev server, so anything else is an outbound link. The holding page is a
  // data: URL, hence the explicit allowance.
  appWindow.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith(VITE_URL) || url.startsWith('data:text/html')) return
    event.preventDefault()
    openExternally(url)
  })

  appWindow.on('closed', () => { appWindow = null })
  appWindow.webContents.on('console-message', (_, l, m) => console.log('[Renderer]', m))

  // A bare BrowserWindow has NO context menu at all by default - unlike a normal browser tab,
  // where right-click Copy/Cut/Paste is built into the browser's own chrome, not something a
  // webpage can rely on. Without this, right-clicking selected text (chat messages, card content,
  // anything) did nothing at all. Built from webContents' own edit-state per right-click
  // (params.editFlags/isEditable/selectionText) rather than a static menu, so items are only
  // offered when they'd actually do something - Cut/Paste never appear over read-only text, and
  // Select All is left out of the "just some text is selected" case to match normal OS behavior.
  appWindow.webContents.on('context-menu', (_event, params) => {
    const menu = new Menu()
    if (params.isEditable) {
      if (params.editFlags.canCut) menu.append(new MenuItem({ label: 'Cut', role: 'cut' }))
      if (params.editFlags.canCopy) menu.append(new MenuItem({ label: 'Copy', role: 'copy' }))
      if (params.editFlags.canPaste) menu.append(new MenuItem({ label: 'Paste', role: 'paste' }))
      if (params.editFlags.canSelectAll) {
        if (menu.items.length > 0) menu.append(new MenuItem({ type: 'separator' }))
        menu.append(new MenuItem({ label: 'Select All', role: 'selectAll' }))
      }
    } else if (params.selectionText) {
      menu.append(new MenuItem({ label: 'Copy', role: 'copy' }))
    }
    if (menu.items.length > 0) menu.popup()
  })

  // Load the app, and KEEP TRYING. A dev server that is not answering used to
  // leave a blank white window sitting there forever ("I opened Ebiki and it
  // was just white"): waitForServer gave up after its timeout, loadURL was
  // called once anyway, the failed load painted nothing, and nothing ever
  // retried - so even starting the server a second later did not fix the window
  // already on screen. Now a failed load shows an honest holding page and
  // retries until the server answers, so the window heals itself the moment the
  // shortcut (or a manual `npm run dev`) brings the server back.
  let loaded = false
  let retrying = false

  const HOLDING_PAGE = 'data:text/html;charset=utf-8,' + encodeURIComponent(`<!doctype html>
<meta charset="utf-8">
<style>
  html, body { height: 100%; margin: 0; }
  body { background: #F2F5F8; color: #16232E; display: flex; align-items: center;
         justify-content: center; font-family: "Segoe UI", system-ui, sans-serif; }
  .card { text-align: center; }
  .t { font-size: 20px; font-weight: 700; }
  .s { font-size: 13px; color: #62717F; margin-top: 6px; }
  .track { width: 220px; height: 6px; border-radius: 4px; background: #E2E8EE;
           overflow: hidden; margin: 16px auto 0; position: relative; }
  .bar { position: absolute; top: 0; left: -40%; width: 38%; height: 6px;
         border-radius: 4px; background: #DF2540; animation: s 1.15s ease-in-out infinite; }
  @keyframes s { from { left: -40%; } to { left: 102%; } }
</style>
<div class="card">
  <div class="t">Waiting for Ebiki's server</div>
  <div class="s">It starts a few seconds after the app. This page loads by itself.</div>
  <div class="track"><div class="bar"></div></div>
</div>`)

  // Reloading the same holding page on every failed attempt would flicker it.
  const showHolding = () => {
    if (!appWindow) return
    if (appWindow.webContents.getURL().startsWith('data:text/html')) return
    appWindow.loadURL(HOLDING_PAGE)
  }

  const tryLoad = () => {
    if (!appWindow) return
    retrying = false
    waitForServer(VITE_URL, 15000).then((up) => {
      if (!appWindow) return   // window closed while waiting
      if (up) return appWindow.loadURL(VITE_URL)
      console.warn('[App window] Server not answering at', VITE_URL, '- holding')
      if (!loaded) showHolding()
      scheduleRetry()
    })
  }

  const scheduleRetry = () => {
    if (retrying || !appWindow) return
    retrying = true
    setTimeout(tryLoad, 1500)
  }

  appWindow.webContents.on('did-finish-load', () => {
    if (appWindow && appWindow.webContents.getURL().startsWith(VITE_URL)) loaded = true
  })
  // Covers a server that dies between waitForServer answering and the load.
  appWindow.webContents.on('did-fail-load', (_e, _code, _desc, url, isMainFrame) => {
    if (!isMainFrame || !url || !url.startsWith(VITE_URL)) return
    loaded = false
    showHolding()
    scheduleRetry()
  })

  tryLoad()
}

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
