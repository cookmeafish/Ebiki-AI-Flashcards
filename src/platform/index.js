// THE PLATFORM SEAM. Everything that differs between the desktop app (Electron / browser tab + the local
// dev server) and a future phone build (Capacitor WebView, or React Native reusing the logic) goes through
// here, so a port replaces THIS file's adapters instead of hunting through the app:
//
//   api(path, init)    every call to Ebiki's own /api routes. Desktop: the local server. A phone build installs
//                      an on-device router answering the same paths (see CLAUDE.md "Porting to phones").
//   beacon(path, body) a fire-and-forget request that survives the page closing.
//   kv                 small per-device key/value storage (localStorage here; AsyncStorage/Preferences there).
//   onPageHide(fn)     "the app is going away": pagehide here; app background/terminate on phones.
//   isHidden()         the app is in the background (skip background polling).
//   randomId()         a random lowercase id.
//   speech             device voice: speak(text, lang) (free text to speech), record() (the microphone).
//   audio              play(blob) an audio clip.
//   kind               'electron' | 'browser' | whatever a port sets ('ios', 'android').
//   onDeviceZoom(fn)   zoom keys the device took before the page (Electron forwards Ctrl + = - 0).
//   history            the device's Back/Forward history for src/nav (window.history here): push/replace/go/onPop,
//                      plus onDeviceNav for back/forward buttons the device does not turn into history steps itself
//                      (a mouse's back button and Alt+Left inside Electron). A phone port without browser history can
//                      use src/nav/memory.js and call its press(-1) from the OS back button.
//
// Call setPlatform({...}) once at startup to override any part. Logic modules must never touch fetch('/api'),
// localStorage, window or document directly (src/platform/platform.test.js enforces it for src/features).

const hasWindow = typeof window !== 'undefined'
// The device voice line now speaking, and queued lines stopped before they started (skipped when they start).
let speakingLine = null
const cancelledLines = new WeakSet()

const web = {
  kind: hasWindow && /Electron/i.test(navigator.userAgent || '') ? 'electron' : 'browser',
  api: (path, init) => fetch(path, init),
  beacon: (path, body) => {
    try { return !!(hasWindow && navigator.sendBeacon && navigator.sendBeacon(path, body)) } catch { return false }
  },
  kv: {
    get: (key) => { try { return localStorage.getItem(key) } catch { return null } },
    set: (key, value) => { try { localStorage.setItem(key, String(value)); return true } catch { return false } },
    remove: (key) => { try { localStorage.removeItem(key) } catch { /* private window */ } },
    getJson: (key, fallback = null) => { try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v) } catch { return fallback } },
    setJson: (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true } catch { return false } },
  },
  isHidden: () => hasWindow && typeof document !== 'undefined' && !!document.hidden,
  randomId: () => (globalThis.crypto?.randomUUID?.() || `${Date.now()}${Math.random()}`).replace(/[^a-z0-9]/gi, '').toLowerCase(),
  onPageHide: (fn) => {
    if (!hasWindow) return () => {}
    const h = (e) => { if (!e.persisted) fn() }
    window.addEventListener('pagehide', h)
    return () => window.removeEventListener('pagehide', h)
  },
  speech: {
    canSpeak: () => hasWindow && 'speechSynthesis' in window,
    // The device's own (free) voice. Resolves when it finishes (or fails); never rejects.
    // `onHandle(u)` hands back a token for stop(u), which stops only that line.
    speak: (text, lang, { rate = 1, voiceIndex = 0, onHandle } = {}) => new Promise((resolve) => {
      try {
        if (!hasWindow || !('speechSynthesis' in window) || !text) return resolve()
        const u = new SpeechSynthesisUtterance(text)
        onHandle?.(u)
        u.onstart = () => { if (cancelledLines.has(u)) { try { window.speechSynthesis.cancel() } catch { /* gone */ } } else speakingLine = u }
        if (lang) u.lang = lang
        u.rate = rate
        // A second character in a dialogue gets a different voice of the same language when one exists.
        const voices = window.speechSynthesis.getVoices().filter((v) => !lang || v.lang?.toLowerCase().startsWith(String(lang).toLowerCase().slice(0, 2)))
        if (voices.length) u.voice = voices[voiceIndex % voices.length]
        const end = () => { if (speakingLine === u) speakingLine = null; resolve() }
        u.onend = end
        u.onerror = end
        window.speechSynthesis.speak(u)
      } catch { resolve() }
    }),
    // stop() silences everything; stop(u) only that line: cancelled now if it is speaking, skipped when it starts if
    // still queued (the device queue has no per-line remove).
    stop: (u) => {
      try {
        if (!u) return window.speechSynthesis?.cancel()
        if (speakingLine === u) { speakingLine = null; window.speechSynthesis?.cancel() } else cancelledLines.add(u)
      } catch { /* nothing playing */ }
    },
    // A FREE built-in recognizer (Chrome/Edge tabs; never inside Electron, where it always fails "network").
    canRecognize: () => hasWindow && !!(window.SpeechRecognition || window.webkitSpeechRecognition) && !/Electron/i.test(navigator.userAgent || ''),
    // Live recognition: { stop(): Promise<text>, cancel() }. `onFail(code)` reports a recognizer that died on its
    // own ('nomic' = permission refused or no microphone, else the browser's error name), so the caller can say so at
    // once instead of showing "Listening" over a dead recognizer until the learner presses stop.
    recognize: ({ lang = '', onFail } = {}) => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition
      const rec = new SR()
      rec.continuous = true
      rec.interimResults = false
      if (lang) rec.lang = lang
      let text = ''
      let finish = null
      let wanted = true   // until stop() or cancel(): Chrome ends a session on its own after a silence
      let denied = false
      const ended = new Promise((resolve) => { finish = resolve })
      rec.onresult = (e) => { for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) text += `${e.results[i][0].transcript} ` }
      rec.onerror = (e) => {
        // Only a silence is worth a restart: any other error repeats forever, and an abort we did not ask for (our own
        // stop/cancel already cleared `wanted`) is another recognizer taking the mic: restarting ping-ponged the two.
        const ours = !wanted // our own stop/cancel: not a failure
        if (e.error !== 'no-speech') wanted = false
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed' || e.error === 'audio-capture') { denied = true; text = '' }
        if (!ours && e.error !== 'no-speech' && e.error !== 'aborted') { try { onFail?.(denied ? 'nomic' : String(e.error || 'error')) } catch { /* caller gone */ } }
      }
      // Ended by itself (a pause, Chrome's session limit) while the learner is still talking: listen again, or
      // everything said after the pause was lost while the badge kept saying "Listening".
      rec.onend = () => { if (wanted) { try { rec.start(); return } catch { /* cannot restart */ } } finish() }
      rec.start()
      return {
        stop: async () => {
          wanted = false
          try { rec.stop() } catch { /* stopped */ }
          await ended
          if (denied) { const e = new Error('no microphone'); e.code = 'nomic'; throw e }
          return text.replace(/\s+/g, ' ').trim()
        },
        cancel: () => { wanted = false; text = ''; try { rec.abort() } catch { /* stopped */ } },
      }
    },
    // Microphone recording. Resolves to { stop(): Promise<Blob>, cancel() } or rejects when there is no mic.
    record: async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'].find((m) => window.MediaRecorder?.isTypeSupported?.(m)) || ''
      const release = () => stream.getTracks().forEach((tr) => tr.stop())
      let mr
      try {
        mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
        mr.start()
      } catch (e) { release(); throw e } // else the mic stayed open (the browser's recording dot) with nothing recording
      const chunks = []
      mr.ondataavailable = (e) => { if (e.data?.size) chunks.push(e.data) }
      return {
        stop: () => new Promise((resolve) => {
          mr.onstop = () => { release(); resolve(new Blob(chunks, { type: mr.mimeType || mime || 'audio/webm' })) }
          try { mr.stop() } catch { release(); resolve(new Blob(chunks)) }
        }),
        cancel: () => { mr.onstop = release; try { mr.stop() } catch { release() } },
      }
    },
  },
  // Play an audio clip (Blob). Resolves when it ends; `stop()` on the returned handle cuts it short.
  audio: {
    play: (blob) => {
      let el = null
      let url = ''
      let finish = () => {}
      const done = new Promise((resolve) => {
        finish = resolve // stop() settles it too: a paused clip fires no 'ended' (awaiting callers hung, the URL leaked)
        try {
          url = URL.createObjectURL(blob)
          el = new Audio(url)
          el.onended = () => resolve()
          el.onerror = () => resolve()
          el.play().catch(() => resolve())
        } catch { resolve() }
      }).finally(() => { try { if (url) URL.revokeObjectURL(url) } catch { /* gone */ } })
      return { done, stop: () => { try { el?.pause() } catch { /* gone */ } finish() } }
    },
  },
}

// Zoom keys the device intercepts before the page sees them (Electron: main.cjs takes Ctrl + = - 0 away from its
// menu and forwards them). fn('in' | 'out' | 'reset'). The page's own keydown handles a browser tab. On `web` itself,
// where App reads it (inside web.history it was never found, and the app window's zoom keys did nothing).
web.onDeviceZoom = (fn) => {
  if (!hasWindow) return () => {}
  try { return window.ebikiWindow?.onZoom?.((a) => { if (a === 'in' || a === 'out' || a === 'reset') fn(a) }) || (() => {}) } catch { return () => {} }
}

// Mouse button 3/4 = back/forward. A browser tab may already step its own history for that click (Chrome does,
// Firefox too), Electron never does, so a click steps here only when no history step came within this long.
const NAV_NATIVE_WAIT_MS = 150
const NAV_REPEAT_MS = 400 // one physical press can arrive twice (the mouse event AND Electron's app-command)
web.history = {
  supported: () => hasWindow && !!window.history?.pushState,
  push: (state) => { try { window.history.pushState(state, '') } catch { /* sandboxed */ } },
  replace: (state) => { try { window.history.replaceState(state, '') } catch { /* sandboxed */ } },
  go: (n) => { try { window.history.go(n) } catch { /* sandboxed */ } },
  onPop: (fn) => {
    if (!hasWindow) return () => {}
    const h = (e) => fn(e.state)
    window.addEventListener('popstate', h)
    return () => window.removeEventListener('popstate', h)
  },
  onDeviceNav: (fn) => {
    if (!hasWindow) return () => {}
    let last = 0
    let popAt = 0
    const fire = (dir) => { const t = Date.now(); if (t - last < NAV_REPEAT_MS) return; last = t; fn(dir) }
    const onPop = () => { popAt = Date.now() }
    const onMouse = (e) => {
      if (e.button !== 3 && e.button !== 4) return
      e.preventDefault() // Chrome: a cancelled mouseup is no native step, so ours is the only one
      if (e.type !== 'mouseup') return
      const at = Date.now()
      const dir = e.button === 3 ? -1 : 1
      setTimeout(() => { if (popAt < at) fire(dir) }, NAV_NATIVE_WAIT_MS)
    }
    const electron = /Electron/i.test(navigator.userAgent || '')
    // Electron has no browser shortcuts: Alt+Left / Alt+Right do nothing there unless handled here.
    const onKey = (e) => {
      if (!electron || !e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.defaultPrevented) return
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      e.preventDefault()
      fire(e.key === 'ArrowLeft' ? -1 : 1)
    }
    window.addEventListener('popstate', onPop, true)
    window.addEventListener('mousedown', onMouse, true)
    window.addEventListener('mouseup', onMouse, true)
    window.addEventListener('keydown', onKey)
    // Windows sends the mouse's side buttons to Electron as app-commands too (electron/main.cjs forwards them).
    let offIpc = null
    try { offIpc = window.ebikiWindow?.onNav?.((cmd) => fire(cmd === 'forward' ? 1 : -1)) || null } catch { offIpc = null }
    return () => {
      window.removeEventListener('popstate', onPop, true)
      window.removeEventListener('mousedown', onMouse, true)
      window.removeEventListener('mouseup', onMouse, true)
      window.removeEventListener('keydown', onKey)
      try { offIpc?.() } catch { /* gone */ }
    }
  },
}

export const platform = { ...web, kv: { ...web.kv }, speech: { ...web.speech }, audio: { ...web.audio }, history: { ...web.history } }

// Override adapters (a phone build, or tests). Nested objects merge, so a port can replace just kv.get.
export function setPlatform(overrides = {}) {
  for (const [k, v] of Object.entries(overrides)) {
    platform[k] = v && typeof v === 'object' && !Array.isArray(v) && typeof platform[k] === 'object' ? { ...platform[k], ...v } : v
  }
  return platform
}

// Shorthand for the most common call.
export const apiFetch = (path, init) => platform.api(path, init)
