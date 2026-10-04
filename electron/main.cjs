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
    const m = JSON.parse(fs.readFileSync(path.join(APP_ROOT, 'launchmode.json'), 'utf-8').replace(/^\uFEFF/, ''))?.mode // a BOM (hand edit in PowerShell 5.1) must not reset the choice
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

// When this process last asked the launcher for a server. The bare-launch path and the holding
// page's revive can both fire within seconds of each other; a second launcher run started a second
// splash (clearing the first one's update question) for a server that was already on its way.
let lastDelegatedAt = 0
// A launcher is still at work (its splash is up or it wrote a status recently; launch.ps1 removes both
// files when it finishes). It can legitimately take minutes on an update question plus npm install, and
// a second launcher started then cleared the first one's handshake files and covered its question with
// a buttonless splash. Recent = touched in the last 3 minutes, so a file left by a crash can't block
// the revive forever.
function launcherBusy() {
  for (const f of ['.app-status', '.app-splash']) {
    try { if (Date.now() - fs.statSync(path.join(APP_ROOT, f)).mtimeMs < 180000) return true } catch { /* absent */ }
  }
  return false
}
function delegateToLauncher() {
  lastDelegatedAt = Date.now()
  try {
    if (process.platform === 'win32') {
      // The VBS, not the .ps1 directly: it also pops the start-up splash, so a pinned-icon click
      // shows something immediately instead of looking like it did nothing.
      spawn('wscript.exe', [path.join(APP_ROOT, 'launch-ebiki.vbs')], { cwd: APP_ROOT, detached: true, stdio: 'ignore' })
        .on('error', (e) => console.error('[App window] launcher spawn failed:', e.message)).unref() // an EVENT, not a throw: unhandled it crashed the main process
    } else {
      spawn('bash', [path.join(APP_ROOT, 'scripts', 'launch.sh')], { cwd: APP_ROOT, detached: true, stdio: 'ignore' })
        .on('error', (e) => console.error('[App window] launcher spawn failed:', e.message)).unref()
    }
    return true
  } catch (e) {
    console.error('[App window] could not hand off to the launcher:', e.message)
    return false
  }
}

const VITE_URL = 'http://localhost:3000'
// Anchored to this file, never the working directory: the server reads it back from the app folder.
const SCREENSHOT_FILE = path.join(__dirname, 'last-capture.png')
let overlayWindow = null
let overlayPageOk = false // the overlay's app page really loaded (see did-fail-load)
let appQuitting = false
app.on('before-quit', () => { appQuitting = true })

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
  // Its OWN browser profile: the app window and the overlay both ran on %APPDATA%\ebiki, and Chromium locks a
  // profile's storage to ONE process, so whichever started second saved no localStorage at all (study session,
  // chat session, stats cache were silently lost after a quick reopen). The overlay stores nothing of its own.
  try { app.setPath('userData', path.join(app.getPath('userData'), 'overlay')) } catch (e) { console.warn('[Overlay] own profile:', e.message) }
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
    // Not while a launcher is busy (asking about an update, installing): a second launcher cleared the
    // first one's splash handshake files, so its question could no longer be answered and was skipped.
    // The busy launcher opens the browser itself when it is done.
    if (!launcherBusy()) {
      console.log('[App window] launch mode is "browser" - handing off to the launcher')
      delegateToLauncher()
    } else console.log('[App window] launch mode is "browser", a launcher is already busy - leaving it to that one')
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
          if (up || launcherBusy()) return // a busy launcher is already bringing the server up (see above)
          console.log('[App window] no dev server on a bare launch - starting one via the launcher')
          delegateToLauncher()
        })
      }
      console.log('[App window] Ready.')
    })
    // A moment for the main process's goodbye (sent on 'closed') to leave: quitting at once dropped it, and the
    // server then waited 150s of silence whenever the renderer was too broken to send its own.
    app.on('window-all-closed', () => setTimeout(() => app.quit(), 500))
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

// Is this URL the app itself? Compared by ORIGIN, never with startsWith: "http://localhost:3000@evil.example/"
// starts with VITE_URL (everything before "@" is a user name) and would have navigated the chrome-free
// window, which has no address bar to give it away, to someone else's page.
const isAppUrl = (url) => {
  try { return new URL(url).origin === VITE_URL } catch { return false }
}
// The app's own PAGE (the root, or the overlay's), the only thing a window may navigate to by itself. Any other
// same-origin path ("/api/keys" from an SVG link in rendered content) left the frameless window on raw JSON with
// no controls and no way back.
const isAppPage = (url) => {
  try { const u = new URL(url); return u.origin === VITE_URL && u.pathname === '/' && (u.search === '' || u.search === '?overlay=true') } catch { return false }
}

// Hand an outbound link to the OS browser. http(s) only: openExternal will launch other protocol
// handlers too, and a page must not get to choose one. Shared by the app window and the overlay.
const openExternally = (url) => {
  if (!/^https?:\/\//i.test(url || '')) return
  shell.openExternal(url).catch((e) => console.warn('[Ebiki] openExternal failed:', e.message))
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
  // The Picture tab's Capture button uses getDisplayMedia, which Electron REJECTS ("Not supported")
  // unless the main process answers the request. The same primary screen Alt+Q captures.
  try {
    appWindow.webContents.session.setDisplayMediaRequestHandler((_req, cb) => {
      desktopCapturer.getSources({ types: ['screen'] })
        .then((sources) => cb(sources.length ? { video: primaryScreenSource(sources) } : {}))
        .catch(() => cb({}))
    })
  } catch (e) { console.warn('[App window] no display-media handler:', e.message) }
  appWindow.once('ready-to-show', () => {
    appWindow.maximize()
    appWindow.show()
    // Retire the start-up splash (scripts/splash.hta, opened by
    // launch-ebiki.vbs the moment the shortcut is clicked). It watches for this
    // marker file, and THIS is the only moment that honestly means "the app is
    // on screen" - the launcher can only see that it spawned a process, which
    // is still seconds away from a visible window. Fail-soft: a splash that is
    // never told also closes itself, just later.
    // NOT written here any more: the first ready-to-show can be the "Waiting for the server"
    // holding page, and retiring the splash then closed it with the launcher's update question
    // still unanswered. did-finish-load writes it once the REAL app page is on screen.
  })

  // Window controls, driven from the renderer via preload-app.cjs - the ONLY thing this process
  // exposes to it. Push the maximized state back so App.jsx's restore/maximize icon stays correct
  // even when the state changes some other way (double-clicking the drag strip, Aero-snap, etc).
  const sendMaximizedState = () => { if (appWindow) appWindow.webContents.send('app-window:maximized-changed', appWindow.isMaximized()) }
  appWindow.on('maximize', sendMaximizedState)
  appWindow.on('unmaximize', sendMaximizedState)
  // The mouse's back/forward side buttons (and keyboard Browser Back/Forward keys) arrive on Windows as app-commands,
  // which an Electron window ignores. The PAGE owns navigation (src/nav: Back and Forward walk the app's own history
  // and never leave it), so they are handed to it; going back in the window's own history could reach the holding page.
  appWindow.on('app-command', (_event, cmd) => {
    if (cmd !== 'browser-backward' && cmd !== 'browser-forward') return
    try { appWindow?.webContents.send('app-window:nav', cmd === 'browser-forward' ? 'forward' : 'back') } catch { /* window going away */ }
  })
  ipcMain.on('app-window:minimize', () => appWindow?.minimize())
  ipcMain.on('app-window:toggle-maximize', () => {
    if (!appWindow) return
    if (appWindow.isMaximized()) appWindow.unmaximize()
    else appWindow.maximize()
  })
  ipcMain.on('app-window:close', () => appWindow?.close())
  // Restart with NOTHING running: relaunch ourselves and quit. The new process
  // starts bare (no --from-launcher), and the bare-launch path in this file starts
  // the launcher when nothing answers on 3000 - so a dead dev server is started
  // fresh, on the newly installed code, which is exactly what an update needs.
  ipcMain.on('app-window:restart', () => {
    // relaunch() with no options reuses this process's arguments, and a launcher-started window
    // carries --from-launcher, so the "bare" relaunch was not bare: it skipped the launch-mode check
    // and never started a server, leaving the window on the holding page until the retry loop's
    // own revive kicked in.
    const args = process.argv.slice(1).filter((a) => a !== '--from-launcher')
    try { app.relaunch({ args }) } catch (e) { console.warn('[Restart] relaunch failed:', e.message) }
    app.quit()
  })
  ipcMain.handle('app-window:is-maximized', () => (appWindow ? appWindow.isMaximized() : false))
  // The Picture tab's Capture button in THIS window. getDisplayMedia answered with the primary screen at
  // once, and that screen is covered by Ebiki's own maximized window, so every "capture" was a picture
  // of Ebiki (then sent for a paid vision scan). Step out of the way first: minimize, let the minimize
  // animation finish, grab the primary screen, then come back. Returns a PNG data URL, or null.
  ipcMain.handle('app-window:capture', async () => {
    if (!appWindow) return null
    const wasMax = appWindow.isMaximized()
    try {
      appWindow.minimize()
      await new Promise((r) => setTimeout(r, 450))
      const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: capturePixelSize() })
      const src = sources.length ? primaryScreenSource(sources) : null
      if (!src || src.thumbnail.isEmpty()) return null
      return src.thumbnail.toDataURL()
    } catch (e) {
      console.warn('[App window] capture failed:', e.message)
      return null
    } finally {
      try { appWindow.restore(); if (wasMax) appWindow.maximize(); appWindow.focus() } catch { /* window gone */ }
    }
  })

  appWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return
    // App zoom (src/config/zoom.js): Ctrl/Cmd + = + - _ 0 zoom the APP's UI, not the page. The default menu's
    // zoom accelerators would scale the page on top of the app zoom, so take the keys here and forward them.
    if ((input.control || input.meta) && !input.alt && !input.isComposing) {
      const k = input.key
      const action = (k === '=' || k === '+') ? 'in' : (k === '-' || k === '_') ? 'out' : k === '0' ? 'reset' : null
      if (action) {
        event.preventDefault()
        try { appWindow.webContents.send('app-window:zoom', action) } catch { /* window going away */ }
        return
      }
    }
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
  appWindow.webContents.setWindowOpenHandler(({ url }) => {
    openExternally(url)
    return { action: 'deny' }
  })
  // The same thing one level down: a plain link with no target would NAVIGATE this window off the
  // app (no chrome, so there is no way back - it would look like Ebiki had died). The app itself
  // only ever lives on the dev server, so anything else is an outbound link. No data: allowance: the
  // holding page is loaded by THIS process (loadURL fires no will-navigate), and allowing any
  // data:text/html let a link in rendered content turn this address-bar-less window into another page.
  appWindow.webContents.on('will-navigate', (event, url) => {
    if (isAppPage(url)) return
    event.preventDefault()
    if (!isAppUrl(url)) openExternally(url) // another path of the app itself: simply not followed
  })

  // ── The window itself is the heartbeat ───────────────────────────────────
  // The dev server shuts itself down when it believes the last page has gone, and
  // its only evidence was the RENDERER's heartbeat. A renderer is throttled the
  // moment its window is minimized or fully covered - that is normal Chromium
  // behaviour, not a fault - and if the HMR socket is also asleep the fallback ping
  // never lands either. So the server would exit WHILE THE APP WAS STILL OPEN,
  // leaving a window that looks completely normal and cannot save, load, check for
  // updates or reach Anki: every "Ebiki's background service didn't answer" report
  // comes from here, and no amount of clicking inside that window can fix it.
  //
  // The main process is never throttled and is the only thing that actually knows
  // whether a window exists, so it is what should be answering. It beats for as
  // long as the window is open and says goodbye once, when it closes.
  const beat = (pathname) => {
    try {
      // 'localhost', NEVER '127.0.0.1': Vite binds to whatever localhost resolves to FIRST, which on
      // current Node/Windows is IPv6 ::1 ONLY (measured: LISTENING on [::1]:3000, 127.0.0.1 refused).
      // Aimed at 127.0.0.1, every one of these beats was refused, so this heartbeat, the thing
      // that keeps a shortcut-started server alive while the window is minimized, never landed.
      const req = http.request({ hostname: 'localhost', port: 3000, path: pathname, method: 'POST', timeout: 3000 })
      req.on('error', () => {})      // server not up yet, or already gone: nothing to do
      req.on('timeout', () => req.destroy())
      req.end()
    } catch { /* never let a heartbeat take the window down */ }
  }
  const beatTimer = setInterval(() => beat('/api/alive'), 5000)
  beat('/api/alive')

  appWindow.on('closed', () => {
    appWindow = null
    clearInterval(beatTimer)
    // The renderer sends this too, but only if it was alive enough to run script.
    beat('/api/bye')
  })
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
  // .app-ready once per process: every later reload of an OPEN window (Vite reload, crash recovery) wrote it
  // too, and closed a second launch's splash in the middle of its update question.
  let readySignaled = false

  // Text from the app's locale files (scripts/launcher-i18n.cjs): applang.json -> the system language -> English.
  const { t: lt, lang: holdingLang } = require('../scripts/launcher-i18n.cjs').launcherText(app.getLocale())
  const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
  const HOLDING_PAGE = 'data:text/html;charset=utf-8,' + encodeURIComponent(`<!doctype html>
<html lang="${esc(holdingLang)}">
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
  <div class="t">${esc(lt('ln_waitServerTitle'))}</div>
  <div class="s">${esc(lt('ln_waitServerBody'))}</div>
  <div class="track"><div class="bar"></div></div>
</div>`)

  // Reloading the same holding page on every failed attempt would flicker it.
  const showHolding = () => {
    if (!appWindow) return
    if (appWindow.webContents.getURL().startsWith('data:text/html')) return
    appWindow.loadURL(HOLDING_PAGE)
  }

  // Waiting is not enough when NOBODY IS COMING. This loop used to retry forever
  // against a port that nothing would ever open again: the dev server exits on its
  // own (or an update's npm install takes it down), and from then on the window sat
  // on "Waiting for Ebiki's server" indefinitely - reported as a frozen white
  // screen, and correctly so, because no amount of waiting could fix it. The
  // launcher is what starts a server, and this process can call it, so after the
  // first failed attempt it does. Once per outage: `revived` only resets after a
  // real page load, so a genuinely broken machine cannot spawn launchers in a loop.
  let revived = false
  const tryLoad = () => {
    if (!appWindow) return
    retrying = false
    waitForServer(VITE_URL, 15000).then((up) => {
      if (!appWindow) return   // window closed while waiting
      if (up) return appWindow.loadURL(VITE_URL) // `revived` resets only on a REAL load (did-finish-load)
      console.warn('[App window] Server not answering at', VITE_URL, '- holding')
      if (!loaded) showHolding()
      if (!revived && Date.now() - lastDelegatedAt > 60000 && !launcherBusy()) {
        revived = true
        console.log('[App window] nothing is serving - asking the launcher to start one')
        try { delegateToLauncher() } catch (e) { console.warn('[App window] could not start a server:', e.message) }
      }
      scheduleRetry()
    })
  }

  const scheduleRetry = () => {
    if (retrying || !appWindow) return
    retrying = true
    setTimeout(tryLoad, 1500)
  }

  // A load that FAILED may still be followed by did-finish-load for Chromium's error page, which keeps the app's
  // URL: counting it as a real load stopped the retry loop on an error page. Cleared by the next navigation.
  let navFailed = false
  // Only a navigation TO the app clears it: showHolding's own navigation started before the error page's
  // did-finish-load arrived and cleared it too early.
  appWindow.webContents.on('did-start-navigation', (_e, url, inPlace, isMainFrame) => { if (isMainFrame && !inPlace && isAppUrl(url)) navFailed = false })
  appWindow.webContents.on('did-finish-load', () => {
    if (navFailed) return
    if (appWindow && isAppUrl(appWindow.webContents.getURL())) { // origin, never a prefix (see isAppUrl)
      loaded = true
      revived = false // a server that answers the probe but whose page never loads must not re-launch every minute
      if (!readySignaled) { readySignaled = true; try { fs.writeFileSync(path.join(__dirname, '..', '.app-ready'), '') } catch {} } // retire the start-up splash (see ready-to-show)
    }
  })
  // Covers a server that dies between waitForServer answering and the load.
  appWindow.webContents.on('did-fail-load', (_e, code, _desc, url, isMainFrame) => {
    if (!isMainFrame || !url || !isAppUrl(url)) return
    // -3 (ERR_ABORTED) is a load replaced by a newer navigation (a reload, a data-folder switch),
    // not a dead server; answering it with the holding page covered the page that was loading.
    if (code === -3) return
    navFailed = true
    loaded = false
    showHolding()
    scheduleRetry()
  })
  // A crashed renderer fires no did-fail-load: the frameless window stayed blank with its window buttons
  // gone (they are in the page), while this process kept the server alive. Reload through the same loop.
  appWindow.webContents.on('render-process-gone', (_e, details) => {
    console.warn('[App window] renderer gone:', details && details.reason)
    if (!appWindow || appQuitting || (details && details.reason === 'clean-exit')) return
    loaded = false
    showHolding()
    scheduleRetry()
  })

  tryLoad()
}

// The capture must be taken at the display's REAL pixel size. getPrimaryDisplay().size is in
// scaled (DIP) units, so on a 150% display a 2560x1440 screen was captured at 1707x960 and OCR
// read a blurred copy of the text. Every crop that uses this image scales by
// image-size / screen-size, so a sharper capture needs no other change.
// The overlay covers the PRIMARY display, so the capture must be of that display too. sources[0]
// is whichever screen the OS lists first, which on a multi-monitor setup can be another monitor:
// the user dragged a box over one screen and got the text from a different one.
function primaryScreenSource(sources) {
  const id = String(screen.getPrimaryDisplay().id)
  return sources.find((s) => s.display_id === id) || sources[0]
}

function capturePixelSize() {
  const d = screen.getPrimaryDisplay()
  const f = d.scaleFactor || 1
  return { width: Math.round(d.size.width * f), height: Math.round(d.size.height * f) }
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

  overlayPageOk = false
  overlayWindow.loadURL(VITE_URL + '?overlay=true')
  // Same link rules as the app window (see createAppWindow): the overlay runs the same web app, and
  // without these a link opened a bare child window from a transparent always-on-top overlay, or
  // navigated the overlay itself off the app.
  overlayWindow.webContents.setWindowOpenHandler(({ url }) => {
    openExternally(url)
    return { action: 'deny' }
  })
  overlayWindow.webContents.on('will-navigate', (event, url) => {
    if (isAppPage(url)) return
    event.preventDefault()
    if (!isAppUrl(url)) openExternally(url) // another path of the app itself: simply not followed
  })

  // ESC / window.close() → hide instead of closing. Only while the app is NOT quitting: preventing
  // every close also blocked app.quit(), a plain SIGTERM (how the server stops the overlay off
  // Windows) and a Windows shutdown/sign-out ("this app is preventing shutdown").
  overlayWindow.on('close', (e) => {
    if (appQuitting) return
    e.preventDefault()
    hideOverlay()
  })

  overlayWindow.on('blur', () => { if (globalShortcut.isRegistered('Escape')) globalShortcut.unregister('Escape') })
  overlayWindow.on('focus', () => { if (overlayWindow.isVisible()) registerOverlayEsc() })
  overlayWindow.webContents.on('console-message', (_, l, m) => console.log('[Renderer]', m))
  let overlayNavFailed = false // see navFailed in createAppWindow: an error page's did-finish-load is not a load
  overlayWindow.webContents.on('did-start-navigation', (_e, url, inPlace, isMainFrame) => { if (isMainFrame && !inPlace && isAppUrl(url)) overlayNavFailed = false })
  overlayWindow.webContents.on('did-finish-load', () => { if (overlayNavFailed) return; overlayPageOk = true; console.log('[Overlay] Web app loaded') })
  // A failed load leaves Chromium's error page, which keeps the app's URL: Alt+Q then showed a transparent,
  // click-eating window over the whole screen with nothing listening. runCapture reloads instead.
  overlayWindow.webContents.on('did-fail-load', (_e, code, _desc, _url, isMainFrame) => {
    if (isMainFrame && code !== -3) { overlayNavFailed = true; overlayPageOk = false; console.warn('[Overlay] page failed to load:', code) }
  })
  // A crashed overlay page never showed again on Alt+Q (its script ran in a dead frame). Reload it hidden.
  overlayWindow.webContents.on('render-process-gone', (_e, details) => {
    console.warn('[Overlay] renderer gone:', details && details.reason)
    overlayPageOk = false
    if (!overlayWindow || appQuitting || (details && details.reason === 'clean-exit')) return
    hideOverlay()
    try { overlayWindow.webContents.reload() } catch (e) { console.warn('[Overlay] reload failed:', e.message) }
  })
}

function showOverlay() {
  const bounds = screen.getPrimaryDisplay().bounds
  overlayWindow.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height })
  overlayWindow.show()
  overlayWindow.setAlwaysOnTop(true, 'screen-saver')
  overlayWindow.focus()
  registerOverlayEsc()
}

// The global Esc is held only while the overlay is visible AND focused: after a selection the overlay shrinks
// and stays on top, the user clicks into another app, and every Esc pressed there was swallowed (and hid the
// overlay). The page's own Esc handler covers the focused case too.
function registerOverlayEsc() {
  if (globalShortcut.isRegistered('Escape')) return
  globalShortcut.register('Escape', () => {
    console.log('[Overlay] ESC, hiding')
    hideOverlay()
  })
}

function hideOverlay() {
  if (globalShortcut.isRegistered('Escape')) globalShortcut.unregister('Escape')
  if (overlayWindow) {
    overlayWindow.hide()
    // Tell the page: a scan still running stops its follow-up calls (translations, enrichments) in a hidden window.
    try { overlayWindow.webContents.executeJavaScript("window.dispatchEvent(new CustomEvent('overlay-hidden'))").catch(() => {}) } catch { /* page gone */ }
  }
}

// One capture at a time: a held Alt+Q auto-repeats, and overlapping captures raced on the same screenshot
// file and showed the overlay twice.
let captureRunning = false
function registerShortcuts() {
  const ok = globalShortcut.register('Alt+Q', async () => {
    if (captureRunning || !overlayWindow || overlayWindow.isDestroyed()) return
    captureRunning = true
    try { await runCapture() } finally { captureRunning = false }
  })
  // Another program holding Alt+Q made this fail silently while the overlay kept running (the header showed
  // it on, and Alt+Q did nothing). Exiting lets the server report it as not running.
  if (!ok) { console.error('[Overlay] Alt+Q is taken by another program; overlay not started'); app.exit(2) }
}

async function runCapture() {
  console.log('[Overlay] Capture triggered')
  // An overlay whose server is gone (a crash left it orphaned) showed an empty full-screen window that ate
  // every click: with no server answering, nothing is shown (never quit on one slow answer: Alt+Q would be gone).
  if (!(await waitForServer(VITE_URL, 5000))) { console.warn('[Overlay] the server is not answering; capture skipped'); return }
  if (!overlayPageOk) {
    console.warn('[Overlay] page not loaded; reloading instead of showing an empty overlay')
    try { overlayWindow.webContents.loadURL(VITE_URL + '?overlay=true').catch(() => {}) } catch (e) { console.warn('[Overlay] reload failed:', e.message) }
    return
  }
  if (overlayWindow.isVisible()) {
    hideOverlay()
    await new Promise(r => setTimeout(r, 200))
  }
  await new Promise(r => setTimeout(r, 300))

  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'], thumbnailSize: capturePixelSize(),
    })
    if (!sources.length) return
    // An EMPTY thumbnail (it happens) wrote a 0-byte PNG the overlay could not decode, leaving the
    // invisible full-screen overlay swallowing every click. Never show the overlay for one.
    const shot = primaryScreenSource(sources).thumbnail
    if (!shot || shot.isEmpty()) { console.warn('[Overlay] empty capture, overlay not shown'); return }

    fs.writeFileSync(SCREENSHOT_FILE, shot.toPNG())
    console.log('[Overlay] Screenshot saved')

    // Hide page content so old screenshot doesn't flash, then show overlay
    await overlayWindow.webContents.executeJavaScript(`
      document.body.style.opacity = '0';
      window.dispatchEvent(new CustomEvent('overlay-reset'));
    `)

    showOverlay()

    await overlayWindow.webContents.executeJavaScript(`
      window.__overlayScreenshot = '/api/overlay-screenshot?' + Date.now();
      window.dispatchEvent(new CustomEvent('overlay-capture'));
    `)
  } catch (e) { console.error('[Overlay] Error:', e) }
}

ipcMain.on('overlay-dismiss', () => {
  hideOverlay()
})

ipcMain.on('resize-overlay', (_, bounds) => {
  if (!overlayWindow || overlayWindow.isDestroyed()) return
  // Whole numbers only: setBounds THROWS on a fractional or missing value (a zoomed page measures in
  // fractions), and a throw in an IPC listener is an uncaught exception in the main process.
  const b = bounds && typeof bounds === 'object' ? bounds : {}
  const n = (v) => (Number.isFinite(Number(v)) ? Math.round(Number(v)) : undefined)
  const clean = Object.fromEntries(['x', 'y', 'width', 'height'].map((k) => [k, n(b[k])]).filter(([, v]) => v !== undefined))
  try {
    overlayWindow.setBounds(clean)
    overlayWindow.setAlwaysOnTop(true, 'screen-saver')
  } catch (e) { console.error('[Overlay] resize failed:', e.message) }
})

// React requests a screenshot capture (for area-select: capture after drawing)
ipcMain.handle('capture-screenshot', async () => {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'], thumbnailSize: capturePixelSize(),
    })
    if (!sources.length) return null
    const shot = primaryScreenSource(sources).thumbnail
    if (!shot || shot.isEmpty()) return null // see the Alt+Q path: never an undecodable file
    fs.writeFileSync(SCREENSHOT_FILE, shot.toPNG())
    console.log('[Overlay] Screenshot captured on demand')
    return '/api/overlay-screenshot?' + Date.now()
  } catch (e) {
    console.error('[Overlay] Capture error:', e)
    return null
  }
})

app.on('will-quit', () => globalShortcut.unregisterAll())
