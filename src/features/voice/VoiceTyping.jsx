// Voice typing for EVERY text box in the app, with no per-field wiring: a small mic badge appears on the
// focused field (and Alt+V toggles it). Speak, stop, and the words land at the caret exactly as if typed;
// the user still presses Enter themselves. Engines and costs: src/speech.
//
// The badge is portaled to <html> (outside the body's zoom:1.35) in REAL px and scaled with a transform,
// like Dropdown's menu: a fixed element inside the zoomed body has a broken hit-test box.
import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { C, FONT } from '../../config/tokens'
import { useFeatureCtx, featureCfg } from '../registry'
import { listen, speechEngines } from '../../speech'
import { insertIntoField, isDictatable } from './web'

export const VOICE_FEATURE_ID = 'voice'
const SIZE = 26                 // badge diameter (layout px, scaled by the app zoom)
const MAX_MS = 90000            // a recording stops itself after this long
const SHORTCUT_KEY = 'v'        // Alt + this toggles recording on the focused field
const Z_INDEX = 10003           // above modals (1000) and the confirm dialog (10002)
const TIMER_TICK_MS = 250
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

  // Keep the badge on the field's top-right corner while it moves (scroll, resize, layout shifts).
  const target = state !== 'idle' ? fieldRef.current : field
  useEffect(() => {
    if (!target) { setPos(null); return }
    let raf = 0
    let last = ''
    const tick = () => {
      if (!target.isConnected) {
        // The field left the screen mid-dictation: stop WITHOUT transcribing (the mic stayed open invisibly for up to
        // 90s, then a paid transcript was thrown away).
        if (stateRef.current === 'recording') { recRef.current?.cancel(); setNotice(t('voice_fieldGone')) }
        setPos(null); setField(null); return
      }
      const r = target.getBoundingClientRect()
      const z = getZoom ? getZoom() : 1
      const s = SIZE * z
      const visible = r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight
      const left = Math.min(window.innerWidth - s - 2, Math.max(2, r.right - s * OVERLAP.x))
      const top = Math.max(2, r.top - s * OVERLAP.y)
      const key = visible ? `${Math.round(left)}|${Math.round(top)}|${z}` : 'hidden'
      if (key !== last) { last = key; setPos(visible ? { left, top, z } : null) }
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [target, getZoom])

  // Recording timer.
  useEffect(() => {
    if (state !== 'recording') return
    const started = Date.now()
    setElapsed(0)
    const id = setInterval(() => setElapsed(Date.now() - started), TIMER_TICK_MS)
    return () => clearInterval(id)
  }, [state])

  const say = useCallback((msg) => setNotice(msg), [])

  const finish = useCallback((text) => {
    const el = fieldRef.current
    setState('idle')
    if (text && el && el.isConnected) { insertIntoField(el, text) }
    else if (!text) setNotice(t('voice_heardNothing'))
    if (el && el.isConnected) { el.focus(); setField(el) }
  }, [t])

  const start = useCallback(async (el) => {
    // startingRef: the state is still idle while the mic opens, and a second Alt+V there started a second recorder.
    if (!el || stateRef.current !== 'idle' || startingRef.current) return
    if (!engine) { say(t('voice_needKey')); return }
    fieldRef.current = el
    setNotice('')
    const lang = el.closest?.('[data-voice-lang]')?.getAttribute('data-voice-lang') || ''
    let session
    startingRef.current = true
    try { session = await listen(ctx, { lang }) } catch { startingRef.current = false; say(t('voice_noMic')); return }
    startingRef.current = false
    let over = false
    const cap = setTimeout(() => recRef.current?.stop(), MAX_MS)
    recRef.current = {
      stop: async () => {
        if (over) return
        over = true; clearTimeout(cap)
        setState('transcribing')
        try { finish(await session.stop()) } catch (e) { setState('idle'); say(e?.code === 'nomic' ? t('voice_noMic') : t('voice_failed', { msg: String(e.message || e).slice(0, 160) })) }
      },
      cancel: () => { if (over) return; over = true; clearTimeout(cap); session.cancel(); setState('idle') },
    }
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
      if (e.altKey && !e.ctrlKey && !e.metaKey && (e.key || '').toLowerCase() === SHORTCUT_KEY) {
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
        title={tip}
        // mousedown would move focus off the field (and hide the badge) before the click lands.
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => toggle(field || fieldRef.current)}
        disabled={busy}
        className={rec ? 'ebiki-voice-rec' : undefined}
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
