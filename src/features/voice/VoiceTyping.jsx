// Voice typing for EVERY text box in the app, with no per-field wiring: a small mic badge appears on the
// focused field (and Alt+V toggles it). Speak, stop, and the words land at the caret exactly as if typed;
// the user still presses Enter themselves. Engines and costs: src/speech.
//
// The badge is portaled to <html> (outside the body's zoom (the app zoom, --app-zoom)) in REAL px and scaled with a transform,
// like Dropdown's menu: a fixed element inside the zoomed body has a broken hit-test box.
import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { aiErrorText } from '../kit/aiError'
import { C, FONT } from '../../config/tokens'
import { useFeatureCtx, featureCfg } from '../registry'
import { listen, speechEngines } from '../../speech'
import { insertIntoField, isDictatable } from './web'
import { isVoiceShortcut } from './voiceText'
import { useHelpEntry } from '../kit/useHelp'

export const VOICE_FEATURE_ID = 'voice'
const SIZE = 26                 // badge diameter (layout px, scaled by the app zoom)
const MAX_MS = 90000            // a recording stops itself after this long
const SHORTCUT_KEY = 'v'        // Alt + this toggles recording on the focused field
const Z_INDEX = 10003           // above modals (1000) and the confirm dialog (10002)
const TIMER_TICK_MS = 250
const NOTICE_MS = 6000          // a notice beside the badge ("heard nothing", an error) fades after this long
const FOLLOW_MS = 700           // the badge follows its field frame by frame this long after something starts moving
const TYPE_FOLLOW_MS = 250      // ... and this long after a keystroke (a growing textarea) or a quiet layout shift
const SETTLE_CHECK_MS = 250     // with nothing moving, the field's box is checked this often (content loaded above it)
const OVERLAP = { x: 0.7, y: 0.45 } // how far the badge sits over the field's top-right corner (x SIZE)
const LAYER_ID = 'ebiki-voice-layer' // our element under <html>, outside the zoomed <body>
const PULSE_CSS = '@keyframes ebiki-voice-pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(229,57,46,.45) } 50% { box-shadow: 0 0 0 6px rgba(229,57,46,0) } } .ebiki-voice-rec { animation: ebiki-voice-pulse 1.2s ease-in-out infinite; }'

// One element directly under <html> (outside the body's zoom) to portal into, created on first use.
function useLayer(id) {
  return useMemo(() => {
    if (typeof document === 'undefined') return null
    let el = document.getElementById(id)
    if (!el) { el = document.createElement('div'); el.id = id; document.documentElement.appendChild(el) }
    return el
  }, [id])
}

export default function VoiceTyping() {
  const ctx = useFeatureCtx()
  const enabled = !!ctx && featureCfg(ctx, VOICE_FEATURE_ID).enabled !== false
  const t = ctx?.t || ((k) => k)
  const getZoom = ctx?.getZoom
  // Live, read inside the tracking effect: a new function each app render restarted the tracking every render.
  const getZoomRef = useRef(getZoom); getZoomRef.current = getZoom
  // Ebi's Help knows dictation is available (on every screen), so "how do I talk instead of typing?" gets a real answer.
  useHelpEntry(ctx, 'voice', enabled ? t('voice_help') : '', '')
  const [field, setField] = useState(null)          // the focused dictatable element
  const [state, setState] = useState('idle')         // idle | recording | transcribing
  const [pos, setPos] = useState(null)               // { left, top, z } in real px
  const [elapsed, setElapsed] = useState(0)
  const [notice, setNotice] = useState('')
  const fieldRef = useRef(null)                      // the field a recording belongs to (survives blur)
  const recRef = useRef(null)                        // { stop, cancel }
  const stateRef = useRef('idle')
  const startingRef = useRef(false)                  // the mic is opening (state is still idle then)
  stateRef.current = state
  // Live flags for the async paths: the mic can take seconds to open (a permission prompt) and a transcript longer to
  // come back. Switched off or gone meanwhile, the recorder is closed and the text never typed.
  const liveRef = useRef({ alive: false, enabled })
  liveRef.current.enabled = enabled
  useEffect(() => { liveRef.current.alive = true; return () => { liveRef.current.alive = false } }, [])
  const usable = () => liveRef.current.alive && liveRef.current.enabled
  const engine = speechEngines(ctx).stt
  const layer = useLayer(LAYER_ID)

  // Follow focus: any dictatable field, anywhere (modals included).
  useEffect(() => {
    if (!enabled) return
    const onIn = (e) => { if (isDictatable(e.target)) { setField(e.target); setNotice('') } }
    const onOut = () => {
      // Focus moving to another element fires focusin next; a blur to nothing (click on the page) hides it.
      setTimeout(() => {
        const a = document.activeElement
        if (stateRef.current !== 'idle') return
        setField(isDictatable(a) ? a : null)
      }, 0)
    }
    document.addEventListener('focusin', onIn)
    document.addEventListener('focusout', onOut)
    return () => { document.removeEventListener('focusin', onIn); document.removeEventListener('focusout', onOut) }
  }, [enabled])

  // Keep the badge on the field's top-right corner while it moves (scroll, resize, layout shifts). Followed frame by
  // frame only WHILE something moves (a scroll, a resize, a transition or animation starting, typing that may grow the
  // field), for FOLLOW_MS after it; otherwise one cheap check every SETTLE_CHECK_MS catches a quiet layout shift. It used
  // to read the field's box on every frame for as long as any field had focus (480 layout reads a second on a 480 Hz
  // screen while the learner just typed in Chat).
  const target = state !== 'idle' ? fieldRef.current : field
  useEffect(() => {
    if (!target) { setPos(null); return }
    let raf = 0
    let last = ''
    let until = 0
    let gone = false
    const measure = () => {
      if (gone) return false
      if (!target.isConnected) {
        // The field left the screen mid-dictation: stop WITHOUT transcribing (the mic stayed open invisibly for up to
        // 90s, then a paid transcript was thrown away).
        gone = true
        if (stateRef.current === 'recording') { recRef.current?.cancel(); setNotice(t('voice_fieldGone')) }
        setPos(null); setField(null); return false
      }
      const r = target.getBoundingClientRect()
      const z = getZoomRef.current ? getZoomRef.current() : 1
      const s = SIZE * z
      const visible = r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight
      const left = Math.min(window.innerWidth - s - 2, Math.max(2, r.right - s * OVERLAP.x))
      const top = Math.max(2, r.top - s * OVERLAP.y)
      const key = visible ? `${Math.round(left)}|${Math.round(top)}|${z}` : 'hidden'
      if (key === last) return false
      last = key; setPos(visible ? { left, top, z } : null)
      return true
    }
    const frame = () => {
      raf = 0
      measure()
      if (!gone && performance.now() < until) raf = requestAnimationFrame(frame)
    }
    const follow = (ms = FOLLOW_MS) => {
      until = Math.max(until, performance.now() + ms)
      if (!raf && !gone) raf = requestAnimationFrame(frame)
    }
    const onMove = () => follow()
    const onType = () => follow(TYPE_FOLLOW_MS)
    const opts = { capture: true, passive: true }
    const MOVES = ['scroll', 'transitionrun', 'transitionend', 'animationstart', 'animationend']
    for (const ev of MOVES) document.addEventListener(ev, onMove, opts)
    document.addEventListener('input', onType, opts)
    window.addEventListener('resize', onMove)
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(onMove) : null
    ro?.observe(target)
    const slow = setInterval(() => { if (!document.hidden && measure()) follow(TYPE_FOLLOW_MS) }, SETTLE_CHECK_MS) // never in a hidden tab
    measure()
    follow()
    return () => {
      gone = true
      cancelAnimationFrame(raf)
      clearInterval(slow)
      ro?.disconnect()
      for (const ev of MOVES) document.removeEventListener(ev, onMove, opts)
      document.removeEventListener('input', onType, opts)
      window.removeEventListener('resize', onMove)
    }
  }, [target]) // eslint-disable-line react-hooks/exhaustive-deps

  // Recording timer.
  useEffect(() => {
    if (state !== 'recording') return
    const started = Date.now()
    setElapsed(0)
    const id = setInterval(() => setElapsed(Date.now() - started), TIMER_TICK_MS)
    return () => clearInterval(id)
  }, [state])

  const say = useCallback((msg) => setNotice(msg), [])
  // A notice does not sit beside the field for good (it stayed until the next focus change).
  useEffect(() => {
    if (!notice || state !== 'idle') return
    const id = setTimeout(() => setNotice(''), NOTICE_MS)
    return () => clearTimeout(id)
  }, [notice, state])

  const finish = useCallback((text) => {
    const el = fieldRef.current
    if (!usable()) { setState('idle'); return } // switched off while transcribing: nothing is typed
    setState('idle')
    // The words go into the field the recording was for. If the learner moved on to another field meanwhile, they
    // land there WITHOUT taking the focus back (the caret jumped out of what they were typing).
    const a = typeof document !== 'undefined' ? document.activeElement : null
    const movedOn = !!(a && el && a !== el && a !== document.body && (isDictatable(a) || a.isContentEditable))
    if (text && el && el.isConnected) insertIntoField(el, text, { focus: !movedOn })
    else if (!text) setNotice(t('voice_heardNothing'))
    if (el && el.isConnected && !movedOn) { el.focus(); setField(el) }
  }, [t])

  const start = useCallback(async (el) => {
    // startingRef: the state is still idle while the mic opens, and a second Alt+V there started a second recorder.
    if (!el || stateRef.current !== 'idle' || startingRef.current) return
    if (!engine) { say(t('voice_needKey')); return }
    fieldRef.current = el
    setNotice('')
    const lang = el.closest?.('[data-voice-lang]')?.getAttribute('data-voice-lang') || ''
    let session
    let handle = null
    // The recognizer died on its own (permission refused after the prompt, no mic, offline): end the recording and
    // say why now, not after the learner presses stop.
    const onFail = (code) => {
      if (!handle || recRef.current !== handle) return
      handle.cancel()
      say(code === 'nomic' ? t('voice_noMic') : t('voice_failed', { msg: String(code).slice(0, 160) }))
    }
    startingRef.current = true
    try { session = await listen(ctx, { lang, onFail }) } catch { startingRef.current = false; say(t('voice_noMic')); return }
    startingRef.current = false
    if (!usable()) { session?.cancel?.(); return } // switched off (or gone) while the mic opened: never leave it on
    let over = false
    const cap = setTimeout(() => recRef.current?.stop(), MAX_MS)
    recRef.current = {
      stop: async () => {
        if (over) return
        over = true; clearTimeout(cap)
        setState('transcribing')
        try { finish(await session.stop()) } catch (e) { setState('idle'); say(e?.code === 'nomic' ? t('voice_noMic') : t('voice_failed', { msg: aiErrorText(t, e).slice(0, 160) })) }
      },
      cancel: () => { if (over) return; over = true; clearTimeout(cap); session.cancel(); setState('idle') },
    }
    handle = recRef.current
    setState('recording')
  }, [engine, ctx, t, say, finish])

  const toggle = useCallback((el) => {
    if (stateRef.current === 'recording') recRef.current?.stop()
    else if (stateRef.current === 'idle') start(el)
  }, [start])

  // Alt+V toggles on the focused field; Esc cancels a recording.
  useEffect(() => {
    if (!enabled) return
    const onKey = (e) => {
      if (isVoiceShortcut(e, SHORTCUT_KEY)) {
        const el = stateRef.current !== 'idle' ? fieldRef.current : document.activeElement
        if (stateRef.current !== 'idle' || isDictatable(el)) { e.preventDefault(); toggle(el) }
      } else if (e.key === 'Escape' && stateRef.current === 'recording') {
        e.preventDefault(); e.stopPropagation(); recRef.current?.cancel()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [enabled, toggle])

  // A recording in progress when the component goes away must release the microphone.
  useEffect(() => () => recRef.current?.cancel?.(), [])
  // Voice typing switched off in Settings while recording: stop (the recording ran on and still typed its text).
  useEffect(() => { if (!enabled) recRef.current?.cancel?.() }, [enabled])

  if (!enabled || !pos || !layer) return null
  const rec = state === 'recording'
  const busy = state === 'transcribing'
  const secs = Math.floor(elapsed / 1000)
  const tip = rec ? t('voice_stop') : busy ? t('voice_working') : engine ? t('voice_tip') : t('voice_needKey')
  return createPortal(
    <>
    <style>{PULSE_CSS}</style>
    {/* Anchored by its RIGHT edge (the badge's), so the status label grows leftward over the field, never off screen. */}
    <div style={{ position: 'fixed', right: window.innerWidth - pos.left - SIZE * pos.z, top: pos.top, zIndex: Z_INDEX, transform: `scale(${pos.z})`, transformOrigin: 'top right', display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', gap: 5 }}>
      <button
        type="button"
        aria-label={tip}
        // The app tooltip (no bare title: its 1s delay), below and right-aligned so it stays on screen over the field.
        // While recording or transcribing the label beside the badge already says it.
        data-tip={rec || busy ? undefined : tip}
        // mousedown would move focus off the field (and hide the badge) before the click lands.
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => toggle(field || fieldRef.current)}
        disabled={busy}
        className={rec ? 'ebiki-voice-rec' : busy ? undefined : 'tip tip-b tip-l'}
        style={{
          width: SIZE, height: SIZE, borderRadius: '50%', padding: 0, display: 'grid', placeItems: 'center',
          borderStyle: 'solid', borderWidth: '2px 2px 3px', borderColor: rec ? C.danger : C.border,
          background: rec ? C.danger : C.surface, color: rec ? C.white : engine ? C.brand : C.inkDim,
          cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.7 : 1, fontSize: 13, lineHeight: 1,
        }}
      >
        {busy ? '…' : rec ? '■' : (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="9" y="2" width="6" height="12" rx="3" fill="currentColor" />
            <path d="M5 11a7 7 0 0014 0M12 18v4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        )}
      </button>
      {(rec || busy || notice) && (
        <span style={{
          background: rec ? C.danger : C.surface, color: rec ? C.white : C.ink,
          border: `1px solid ${rec ? C.danger : C.border}`, borderRadius: 999, padding: '2px 9px',
          fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis',
          fontFamily: FONT.body,
        }}>
          {rec ? t('voice_listening', { s: secs }) : busy ? t('voice_working') : notice}
        </span>
      )}
    </div>
    </>,
    layer,
  )
}
