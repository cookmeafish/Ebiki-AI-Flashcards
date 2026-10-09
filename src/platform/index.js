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
//   serverPings(fn)    the local server asking "anyone there?" before it acts on a silence (it exits when no page is
//                      left): the dev server's HMR socket, or the /api/alive-ws socket for the BUILT app (no HMR there).
//                      Returns a stop function. A phone build has no such server: a no-op.
//   history            the device's Back/Forward history for src/nav (window.history here): push/replace/go/onPop,
//                      plus onDeviceNav for back/forward buttons the device does not turn into history steps itself
//                      (a mouse's back button and Alt+Left inside Electron). A phone port without browser history can
//                      use src/nav/memory.js and call its press(-1) from the OS back button.
//
// Call setPlatform({...}) once at startup to override any part. Logic modules must never touch fetch('/api'),
// localStorage, window or document directly (src/platform/platform.test.js enforces it for src/features).

const hasWindow = typeof window !== 'undefined'
// THE DEVICE VOICE QUEUE (speechSynthesis). The device keeps one shared queue with no per-line remove, and
// cancel() empties ALL of it. Stopping one line used to cancel() when it started, which also silenced every
// line queued after it (another feature's line, or the next line of the same screen). Now our own lines are
// tracked here; stopping one cuts the device queue and hands back the survivors as fresh utterances (the old
// ones' cancel events are ignored), so only the stopped line goes. A stopped line still QUEUED is also muted in
// place (Chromium reads volume/rate when a line reaches the head), so even its first instant is silent.
// Exported for tests: `synth` = speechSynthesis, `Utterance` = SpeechSynthesisUtterance.
export function createDeviceVoice(getSynth, getUtterance) {
  const lines = [] // our lines handed to the device and not finished, in queue order
  const finish = (rec) => {
    const i = lines.indexOf(rec)
    if (i >= 0) lines.splice(i, 1)
    if (!rec.settled) { rec.settled = true; rec.resolve() }
  }
  const makeUtterance = (rec) => {
    const U = getUtterance()
    const u = new U(rec.text)
    if (rec.lang) u.lang = rec.lang
    u.rate = rec.rate
    if (rec.voice) u.voice = rec.voice
    rec.u = u
    u.onstart = () => {
      if (rec.u !== u) return // a replaced utterance
      rec.started = true
      if (rec.stopped) cutCurrent() // reached the head after a stop (a browser that ignored the mute)
    }
    const end = () => { if (rec.u === u) finish(rec) }
    u.onend = end
    u.onerror = end
    return u
  }
  // Cancel the device queue but keep every line of ours that is neither stopped nor already speaking.
  const cutCurrent = () => {
    const synth = getSynth()
    const gone = lines.filter((r) => r.stopped || r.started)
    const survivors = lines.filter((r) => !r.stopped && !r.started)
    // New utterances FIRST: the cancel events of the old ones then find `rec.u` changed and are ignored.
    const fresh = survivors.map((r) => makeUtterance(r))
    gone.forEach((r) => { r.u = null; finish(r) })
    try { synth.cancel() } catch { /* gone */ }
    for (const u of fresh) { try { synth.speak(u) } catch { /* the line ends silently */ } }
  }
  return {
    speak: (text, lang, { rate = 1, voiceIndex = 0, onHandle } = {}) => new Promise((resolve) => {
      try {
        const synth = getSynth()
        if (!synth || !text) return resolve()
        // A second character in a dialogue gets a different voice of the same language when one exists.
        const voices = (synth.getVoices?.() || []).filter((v) => !lang || v.lang?.toLowerCase().startsWith(String(lang).toLowerCase().slice(0, 2)))
        const rec = { text, lang, rate, voice: voices.length ? voices[voiceIndex % voices.length] : null, resolve, started: false, stopped: false, settled: false, u: null }
        const u = makeUtterance(rec)
        onHandle?.(rec) // the token for stop(token): survives a re-queue (the utterance object may change)
        lines.push(rec)
        synth.speak(u)
      } catch { resolve() }
    }),
    // stop() silences everything; stop(token) only that line.
    stop: (token) => {
      try {
        const synth = getSynth()
        if (!token) {
          const all = lines.slice()
          all.forEach((r) => { r.u = null; finish(r) })
          return synth?.cancel()
        }
        if (!lines.includes(token) || token.stopped) return // finished already, or another session's token
        token.stopped = true
        if (token.started) { cutCurrent(); return }
        // Still queued: mute it in place and settle it now; it is cut the moment it starts.
        try { token.u.volume = 0; token.u.rate = 10 } catch { /* read-only */ }
        if (!token.settled) { token.settled = true; token.resolve() }
      } catch { /* nothing playing */ }
    },
  }
}

const hasSynth = () => hasWindow && 'speechSynthesis' in window
const deviceVoice = createDeviceVoice(() => (hasSynth() ? window.speechSynthesis : null), () => window.SpeechSynthesisUtterance)

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
  serverPings: (fn) => {
    if (!hasWindow) return () => {}
    if (import.meta.hot) { import.meta.hot.on('ebiki:ping', fn); return () => import.meta.hot.off('ebiki:ping', fn) }
    // A WebSocket, never a held HTTP request: a browser has only 6 HTTP connections per host for every tab.
    if (typeof WebSocket !== 'function') return () => {}
    let ws = null
    let stopped = false
    let retry = 0
    const open = () => {
      if (stopped) return
      try { ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/alive-ws`) } catch { return }
      ws.onmessage = () => fn()
      ws.onclose = () => { if (!stopped) retry = setTimeout(open, 3000) } // a restarted server: connect again
    }
    open()
    return () => { stopped = true; clearTimeout(retry); try { ws?.close() } catch { /* already closed */ } }
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
    // The device's own (free) voice. Resolves when it finishes (or fails, or is stopped); never rejects.
    // `onHandle(token)` hands back a token for stop(token), which stops only that line (see createDeviceVoice).
    speak: (text, lang, opts) => deviceVoice.speak(text, lang, opts),
    // stop() silences everything; stop(token) only that line, never the lines queued after it.
    stop: (token) => deviceVoice.stop(token),
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
