// Inline pronunciation button. Resolves LAZILY on first click (no network on card
// render — spec non-negotiable), then plays. Shows a source badge (🎙 native / from the
// Anki card vs 🤖 synthesized) and, for native Commons audio, the MANDATORY CC-BY-SA
// attribution (author · license, linked to the file page). A miss shows 🔇 but stays
// CLICKABLE — misses are often transient (rate limit, Anki closed, voices loading),
// and the orchestrator doesn't cache them, so a retry gets a fresh chance.
// Native results also get a ↻ "different speaker" button that cycles through the other
// ranked recordings of the word; picking one re-embeds it into the Anki card (replace).
import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { getPronunciation } from '../pronunciation'
import { FONT } from '../config/tokens'

let playingAudio = null // the one Audio element playing now (see playResult)

// Where a floating note goes, in LAYOUT px for a position:fixed box inside the zoomed body: above the anchor,
// below it when there is no room, always inside the viewport. `rect` is the anchor's real-px client rect.
export function floatNotePos(rect, size, viewport, zoom = 1) {
  const z = zoom > 0 ? zoom : 1
  const vw = viewport.width / z
  const vh = viewport.height / z
  const a = { left: rect.left / z, top: rect.top / z, bottom: rect.bottom / z }
  const w = Math.min(size.width, vw - 8)
  const left = Math.max(4, Math.min(a.left, vw - w - 4))
  const above = a.top - size.height - 4
  const top = above >= 4 ? above : Math.min(a.bottom + 4, Math.max(4, vh - size.height - 4))
  return { left: Math.round(left), top: Math.round(top) }
}

// A small note floating over the page, portaled out of the row: deck rows and graded study rows clip with
// overflow:hidden, so a note or the credit tooltip drawn inside them was cut off.
function FloatNote({ anchorRef, children }) {
  const ref = useRef(null)
  const [pos, setPos] = useState(null)
  // Follows its anchor when the page scrolls or resizes while it shows.
  const [, setTick] = useState(0)
  useEffect(() => {
    const on = () => setTick((n) => n + 1)
    window.addEventListener('scroll', on, true)
    window.addEventListener('resize', on)
    return () => { window.removeEventListener('scroll', on, true); window.removeEventListener('resize', on) }
  }, [])
  useLayoutEffect(() => {
    const a = anchorRef.current, n = ref.current
    if (!a || !n) return
    const zoom = parseFloat(document.body.style.zoom) || 1
    const r = n.getBoundingClientRect()
    const next = floatNotePos(a.getBoundingClientRect(), { width: r.width / zoom, height: r.height / zoom }, { width: window.innerWidth, height: window.innerHeight }, zoom)
    setPos((p) => (p && p.left === next.left && p.top === next.top ? p : next)) // same spot: no re-render loop
  })
  if (typeof document === 'undefined') return null
  return createPortal(
    <span ref={ref} role="status" style={{
      position: 'fixed', left: pos?.left ?? 0, top: pos?.top ?? 0, visibility: pos ? 'visible' : 'hidden', zIndex: 11990, // under dialogs and toasts
      fontSize: 10, fontFamily: FONT.body, whiteSpace: 'nowrap', maxWidth: 'calc(100vw / var(--app-zoom, 1) - 8px)', overflow: 'hidden', textOverflow: 'ellipsis',
      color: 'var(--c-ink-dim)', background: 'var(--c-surface)', border: '1px solid var(--c-border)',
      borderRadius: 4, padding: '2px 7px', boxShadow: '0 2px 8px rgba(0,0,0,.25)', pointerEvents: 'none',
    }}>{children}</span>,
    document.body,
  )
}

export default function Pronunciation({ word, lang, region = '', config = {}, noteId = null, cardId = null, t = (k) => k, onNative, compact = false, style }) {
  const [state, setState] = useState('idle') // idle | loading | ready | none (none = retryable)
  const [result, setResult] = useState(null)
  const [variant, setVariant] = useState(0)
  const [noMoreVoices, setNoMoreVoices] = useState(false)
  const [notice, setNotice] = useState(null) // transient inline note ("only one recording")
  const audioRef = useRef(null)
  const anchorRef = useRef(null)
  const [showCredit, setShowCredit] = useState(false)
  const noticeTimer = useRef(null)
  // Browser speech too: it kept talking over the next word, or over a recording started elsewhere.
  const stopSpeech = () => { try { window.speechSynthesis?.cancel() } catch { /* no speech */ } }
  // Only speech THIS player started is stopped on a word change or close: mounting a word popup cut off a Legends
  // scene line or Talk reply being read aloud (speechSynthesis.cancel stops every voice in the page).
  const spokeRef = useRef(false)
  const stopOwnSpeech = () => { if (spokeRef.current) { spokeRef.current = false; stopSpeech() } }
  // A fetch still running when the popup closed played its audio afterwards (nothing left to stop it): playback
  // happens only while mounted. The Anki embed still goes through (the user asked for that voice).
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      try { audioRef.current?.pause() } catch { /* nothing playing */ }
      stopOwnSpeech()
      if (noticeTimer.current) clearTimeout(noticeTimer.current)
    }
  }, []) // closing a popup / leaving a card stops it
  const flashNotice = (text) => {
    setNotice(text)
    if (noticeTimer.current) clearTimeout(noticeTimer.current)
    noticeTimer.current = setTimeout(() => setNotice(null), 3000)
  }

  // Reset when the word changes: surfaces like the tapped-word popup REUSE this component
  // instance for different words, and without this the previous word's audio would replay
  // (tap "precio" → play → tap "alcance" → still hears "precio").
  const [prevKey, setPrevKey] = useState(null)
  const propKey = `${word}|${lang}|${region}|${noteId}|${cardId}`
  if (propKey !== prevKey) {
    try { audioRef.current?.pause() } catch { /* nothing playing */ } // the old word stops with it
    stopOwnSpeech()
    setPrevKey(propKey)
    setState('idle')
    setResult(null)
    setVariant(0)
    setNoMoreVoices(false)
  }
  const liveKeyRef = useRef(propKey)
  liveKeyRef.current = propKey
  // One fetch at a time, decided by a REF: `state === 'loading'` is read from the render-time closure,
  // so two quick ↻ clicks both passed, both fetched, and both swapped their recording into the card
  // (one file with the other's credit line, or two recordings). Released on any exit.
  const busyRef = useRef(null) // the word key being fetched; another word is not blocked

  const playResult = async (r) => {
    if (!mountedRef.current) return
    try {
      if (r.kind === 'speak') {
        if (playingAudio) { try { playingAudio.pause() } catch { /* gone */ } } // one voice at a time, speech included
        // Cleared when the utterance ends: a later close must not cancel speech some other part of the app started.
        const mine = {}
        spokeRef.current = mine
        r.speak(() => { if (spokeRef.current === mine) spokeRef.current = false })
      } else {
        stopSpeech()
        if (!audioRef.current) audioRef.current = new Audio()
        // One recording at a time across the app: two rows' 🔊 overlapped, and a long clip played on into the next card.
        if (playingAudio && playingAudio !== audioRef.current) { try { playingAudio.pause() } catch { /* gone */ } }
        playingAudio = audioRef.current
        audioRef.current.src = r.audioUrl
        await audioRef.current.play()
      }
    } catch { /* playback hiccup — icon stays enabled for retry */ }
  }

  const play = async () => {
    if (state === 'loading' || busyRef.current === liveKeyRef.current) return
    let r = result
    if (!r) {
      const myKey = liveKeyRef.current
      setState('loading')
      busyRef.current = myKey
      try { r = await getPronunciation({ word, lang, region, config, noteId, cardId }) } finally { if (busyRef.current === myKey) busyRef.current = null }
      if (liveKeyRef.current !== myKey) return // word changed mid-fetch — drop the stale result
      if (!r) { setState('none'); return }
      setResult(r)
      setVariant(r.variant || 0)
      setState('ready')
      if (r.source === 'wiktionary') onNative?.(r) // let the surface embed it into Anki
    }
    playResult(r)
  }

  // Cycle to the next available RECORDING of this word (different speaker). Wraps around.
  // The first ↻ click also widens the candidate pool (merges the Commons-wide search in),
  // so more voices can APPEAR here than the initial play knew about.
  const nextVoice = async () => {
    if (state === 'loading' || busyRef.current === liveKeyRef.current) return
    const myKey = liveKeyRef.current
    setState('loading')
    busyRef.current = myKey
    let r
    try { r = await getPronunciation({ word, lang, region, config, variant: variant + 1 }) } finally { if (busyRef.current === myKey) busyRef.current = null }
    if (liveKeyRef.current !== myKey) return
    if (!r) {
      // Likely transient (rate limit) — tell the user and KEEP the button for a retry.
      setState(result ? 'ready' : 'none')
      flashNotice(t('pronRetry'))
      return
    }
    // Card audio Ebiki embedded (`ebiki-…`) IS a Commons recording under another name: with only one
    // recording in existence, the wrap lands on that same voice, and swapping it in rewrote the card for nothing.
    const sameAsEmbedded = result?.source === 'anki' && /^ebiki-/.test(result.fileName || '') && (r.variantCount || 1) <= 1
    if ((r.fileName && result?.fileName === r.fileName) || sameAsEmbedded) {
      // Wrapped straight back to the same recording — this word has only one voice.
      // Just say so; do NOT replay the audio the user was trying to get away from.
      setNoMoreVoices(true)
      setState('ready')
      flashNotice(t('pronOnlyOne'))
      return
    }
    if ((r.variantCount || 1) <= 1) setNoMoreVoices(true)
    setVariant(r.variant ?? variant + 1)
    setResult(r)
    setState('ready')
    // The user actively chose this voice — swap it into the Anki card too.
    onNative?.(r, { replace: true })
    playResult(r)
  }

  if (!word || !lang) return null
  const isNative = result?.source === 'wiktionary' || result?.source === 'anki'
  // The CC-BY-SA credit, in the app language when Commons named no author.
  const attr = result?.source === 'wiktionary' ? result.attribution : null
  const author = attr && (attr.authorUnknown || !attr.author ? t('pronUnknownAuthor') : attr.author)
  const credit = attr ? `🎙 ${author}${attr.license ? ` · ${attr.license}` : ''}` : ''
  const icon = state === 'loading' ? '⏳' : state === 'none' ? '🔇' : '🔊'
  const title = state === 'none' ? `${t('pronNone')} · ${t('pronRetry')}`
    : result?.source === 'anki' ? t('pronFromAnki')
    : result?.source === 'wiktionary' ? `${t('pronNative')}: ${credit.replace(/^🎙 /, '')}`
    : result ? t('pronTts') : t('pronPlay')
  // Offer ↻ on ANY native result until a cycle attempt proves there's nothing else —
  // the initial play may not have merged the Commons-wide search yet, so variantCount
  // can understate how many speakers actually exist.
  const showNext = isNative && !noMoreVoices

  return (
    <span ref={anchorRef} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, verticalAlign: 'middle', position: 'relative', ...style }}>
      {/* The label follows the state (a screen reader heard "Play" on a muted 🔇 too). */}
      <button type="button" onClick={(e) => { e.stopPropagation(); play() }} title={title}
        aria-label={state === 'none' ? title : t('pronPlay')} aria-busy={state === 'loading' || undefined}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: compact ? 13 : 15, lineHeight: 1, padding: '2px 3px',
          opacity: state === 'none' ? 0.45 : 0.85, filter: state === 'none' ? 'grayscale(1)' : 'none',
        }}>
        {icon}
      </button>
      {showNext && (
        <button type="button" onClick={(e) => { e.stopPropagation(); nextVoice() }}
          title={`${t('pronNextVoice')}${result?.variantCount > 1 ? ` (${(variant % result.variantCount) + 1}/${result.variantCount})` : ''}`}
          aria-label={t('pronNextVoice')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: compact ? 11 : 12, lineHeight: 1, padding: '2px 2px', opacity: 0.6 }}>
          ↻
        </button>
      )}
      {/* Floating notes: portaled, so a clipping row can't cut them off, and they never push the layout. */}
      {notice ? <FloatNote anchorRef={anchorRef}><i>{notice}</i></FloatNote>
        : showCredit && credit ? <FloatNote anchorRef={anchorRef}>{credit}</FloatNote> : null}
      {/* Compact surfaces (every one in the app) showed the CC-BY-SA credit only in a bare title with no link. */}
      {result && compact && result.source === 'wiktionary' && result.attribution?.sourceUrl && (
        <a href={result.attribution.sourceUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
          onMouseEnter={() => setShowCredit(true)} onMouseLeave={() => setShowCredit(false)}
          onFocus={() => setShowCredit(true)} onBlur={() => setShowCredit(false)}
          aria-label={credit}
          style={{ fontSize: 9, color: 'var(--c-ink-faint)', textDecoration: 'none', lineHeight: 1 }}>ⓘ</a>
      )}
      {result && !compact && (
        <span style={{ fontSize: 9, color: 'var(--c-ink-faint)', fontFamily: FONT.body, lineHeight: 1.2 }}>
          {result.source === 'wiktionary' ? (
            <a href={result.attribution?.sourceUrl} target="_blank" rel="noreferrer"
              style={{ color: 'var(--c-ink-faint)', textDecoration: 'none' }}
              title={credit}>
              {credit}
            </a>
          ) : isNative ? (
            <span title={t('pronFromAnki')}>🎙 {t('pronFromAnki')}</span>
          ) : (
            <span title={t('pronTts')}>🤖 {t('pronTts')}</span>
          )}
        </span>
      )}
    </span>
  )
}
