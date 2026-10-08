// Pure helpers for electron/main.cjs: no Electron, no file system, no network, so they can be tested with
// plain node (helpers.test.js). main.cjs keeps every side effect; this file only decides.

// "Is this URL the app?" helpers for one app origin. Compared by ORIGIN, never with startsWith:
// "http://localhost:3000@evil.example/" starts with the app URL (everything before "@" is a user name) and
// would have navigated the chrome-free window, which has no address bar to give it away, to someone else's page.
function makeUrlChecks(appUrl) {
  const origin = new URL(appUrl).origin
  const isAppUrl = (url) => {
    try { return new URL(url).origin === origin } catch { return false }
  }
  // The app's own PAGE (the root, or the overlay's), the only thing a window may navigate to by itself. Any other
  // same-origin path ("/api/keys" from an SVG link in rendered content) left the frameless window on raw JSON with
  // no controls and no way back.
  const isAppPage = (url) => {
    try {
      const u = new URL(url)
      return u.origin === origin && u.pathname === '/' && (u.search === '' || u.search === '?overlay=true')
    } catch { return false }
  }
  return { isAppUrl, isAppPage }
}

// May this link go to the OS browser? http(s) only: shell.openExternal launches other protocol handlers too
// (file:, ms-settings:, custom app schemes), and a page must not get to choose one. Parsed, not just
// prefix-matched, so a malformed "https://" with nothing after it is refused too.
function isExternalHttpUrl(url) {
  if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) return false
  try { const u = new URL(url); return (u.protocol === 'http:' || u.protocol === 'https:') && !!u.hostname } catch { return false }
}

// launchmode.json's text -> 'app' | 'browser'. A BOM (a hand edit in PowerShell 5.1) must not reset the choice;
// anything missing, unreadable or unknown means 'app', today's default.
function parseLaunchMode(text) {
  try {
    const m = JSON.parse(String(text).replace(/^﻿/, ''))?.mode
    return m === 'browser' ? 'browser' : 'app'
  } catch { return 'app' }
}

// The PRIMARY display's capture source. sources[0] is whichever screen the OS lists first, which on a
// multi-monitor setup can be another monitor: the user dragged a box over one screen and got another's text.
function pickPrimarySource(sources, primaryId) {
  if (!Array.isArray(sources) || !sources.length) return null
  const id = String(primaryId)
  return sources.find((s) => s && String(s.display_id) === id) || sources[0]
}

// The overlay page's resize request -> bounds setBounds accepts. Whole numbers only: setBounds THROWS on a
// fractional or missing value (a zoomed page measures in fractions), and a throw in an IPC listener is an
// uncaught exception in the main process. Width and height must be positive.
function cleanBounds(bounds) {
  const b = bounds && typeof bounds === 'object' ? bounds : {}
  const out = {}
  for (const k of ['x', 'y', 'width', 'height']) {
    const v = Number(b[k])
    if (b[k] === null || b[k] === undefined || b[k] === '' || !Number.isFinite(v)) continue
    const r = Math.round(v)
    if ((k === 'width' || k === 'height') && r < 1) continue
    out[k] = r
  }
  return out
}

// A restart's arguments: this process's own minus --from-launcher, so the relaunch is BARE and the bare-launch
// path starts the launcher (and with it a fresh server) when nothing answers.
function relaunchArgs(argv) {
  return (Array.isArray(argv) ? argv.slice(1) : []).filter((a) => a !== '--from-launcher')
}

module.exports = { makeUrlChecks, isExternalHttpUrl, parseLaunchMode, pickPrimarySource, cleanBounds, relaunchArgs }
