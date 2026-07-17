// Inline pronunciation button. Resolves LAZILY on first click (no network on card
// render — spec non-negotiable), then plays. Shows a source badge (🎙 native / from the
// Anki card vs 🤖 synthesized) and, for native Commons audio, the MANDATORY CC-BY-SA
// attribution (author · license, linked to the file page). A miss shows 🔇 but stays
// CLICKABLE — misses are often transient (rate limit, Anki closed, voices loading),
// and the orchestrator doesn't cache them, so a retry gets a fresh chance.
// Native results also get a ↻ "different speaker" button that cycles through the other
// ranked recordings of the word; picking one re-embeds it into the Anki card (replace).
import { useState, useRef } from 'react'
import { getPronunciation } from '../pronunciation'
import { FONT } from '../config/tokens'

export default function Pronunciation({ word, lang, region = '', config = {}, noteId = null, cardId = null, t = (k) => k, onNative, compact = false, style }) {
  const [state, setState] = useState('idle') // idle | loading | ready | none (none = retryable)
  const [result, setResult] = useState(null)
  const [variant, setVariant] = useState(0)
  const [noMoreVoices, setNoMoreVoices] = useState(false)
  const [notice, setNotice] = useState(null) // transient inline note ("only one recording")
  const audioRef = useRef(null)
  const noticeTimer = useRef(null)
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
    setPrevKey(propKey)
    setState('idle')
    setResult(null)
    setVariant(0)
    setNoMoreVoices(false)
  }
  const liveKeyRef = useRef(propKey)
  liveKeyRef.current = propKey

  const playResult = async (r) => {
    try {
      if (r.kind === 'speak') { r.speak() } else {
        if (!audioRef.current) audioRef.current = new Audio()
        audioRef.current.src = r.audioUrl
        await audioRef.current.play()
      }
    } catch { /* playback hiccup — icon stays enabled for retry */ }
  }

  const play = async () => {
    if (state === 'loading') return
    let r = result
    if (!r) {
      const myKey = liveKeyRef.current
      setState('loading')
      r = await getPronunciation({ word, lang, region, config, noteId, cardId })
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
    if (state === 'loading') return
    const myKey = liveKeyRef.current
    setState('loading')
    const r = await getPronunciation({ word, lang, region, config, variant: variant + 1 })
    if (liveKeyRef.current !== myKey) return
    if (!r) {
      // Likely transient (rate limit) — tell the user and KEEP the button for a retry.
      setState(result ? 'ready' : 'none')
      flashNotice(t('pronRetry'))
      return
    }
    if (r.fileName && result?.fileName === r.fileName) {
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
  const icon = state === 'loading' ? '⏳' : state === 'none' ? '🔇' : '🔊'
  const title = state === 'none' ? `${t('pronNone')} · ${t('pronRetry')}`
    : result?.source === 'anki' ? t('pronFromAnki')
    : result?.source === 'wiktionary' ? `${t('pronNative')}: ${result.attribution?.author || ''} · ${result.attribution?.license || ''}`
    : result ? t('pronTts') : t('pronPlay')
  // Offer ↻ on ANY native result until a cycle attempt proves there's nothing else —
  // the initial play may not have merged the Commons-wide search yet, so variantCount
  // can understate how many speakers actually exist.
  const showNext = isNative && !noMoreVoices

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, verticalAlign: 'middle', position: 'relative', ...style }}>
      <button onClick={(e) => { e.stopPropagation(); play() }} title={title} aria-label={t('pronPlay')}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: compact ? 13 : 15, lineHeight: 1, padding: '2px 3px',
          opacity: state === 'none' ? 0.45 : 0.85, filter: state === 'none' ? 'grayscale(1)' : 'none',
        }}>
        {icon}
      </button>
      {showNext && (
        <button onClick={(e) => { e.stopPropagation(); nextVoice() }}
          title={`${t('pronNextVoice')}${result?.variantCount > 1 ? ` (${(variant % result.variantCount) + 1}/${result.variantCount})` : ''}`}
          aria-label={t('pronNextVoice')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: compact ? 11 : 12, lineHeight: 1, padding: '2px 2px', opacity: 0.6 }}>
          ↻
        </button>
      )}
      {notice && (
        // Floating tooltip — absolutely positioned so it NEVER pushes the surrounding layout.
        <span style={{
          position: 'absolute', bottom: '100%', left: 0, marginBottom: 3, zIndex: 30,
          fontSize: 9, fontFamily: FONT.body, fontStyle: 'italic', whiteSpace: 'nowrap',
          color: 'var(--c-ink-dim)', background: 'var(--c-surface)', border: '1px solid var(--c-border)',
          borderRadius: 4, padding: '2px 7px', boxShadow: '0 2px 8px rgba(0,0,0,.25)', pointerEvents: 'none',
        }}>{notice}</span>
      )}
      {result && !compact && (
        <span style={{ fontSize: 9, color: 'var(--c-ink-faint)', fontFamily: FONT.body, lineHeight: 1.2 }}>
          {result.source === 'wiktionary' ? (
            <a href={result.attribution?.sourceUrl} target="_blank" rel="noreferrer"
              style={{ color: 'var(--c-ink-faint)', textDecoration: 'none' }}
              title={`${result.attribution?.author} · ${result.attribution?.license}`}>
              🎙 {result.attribution?.author}{result.attribution?.license ? ` · ${result.attribution.license}` : ''}
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
