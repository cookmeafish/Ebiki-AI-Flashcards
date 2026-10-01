// Tap to talk, tap to send: records through src/speech (cheapest engine) and hands back the text.
import { useEffect, useRef, useState } from 'react'
import { C, RADIUS } from '../../config/tokens'
import { listen, speechEngines } from '../../speech'
import { depthBorder } from '../ui'

const MAX_MS = 60000 // one turn stops itself after this long

export default function TalkButton({ ctx, lang = '', onText, onStart, disabled, compact = false }) {
  const [state, setState] = useState('idle') // idle | listening | hearing
  const [note, setNote] = useState('')
  const sessionRef = useRef(null)
  const capRef = useRef(null)
  const startingRef = useRef(false) // the mic is being opened (a permission prompt can take seconds)
  const aliveRef = useRef(false)    // set on mount too: StrictMode mounts twice
  useEffect(() => { aliveRef.current = true; return () => { aliveRef.current = false; clearTimeout(capRef.current); sessionRef.current?.cancel?.(); sessionRef.current = null } }, [])
  const { t } = ctx
  const engine = speechEngines(ctx).stt

  const onTextRef = useRef(onText); onTextRef.current = onText
  const stop = async () => {
    const s = sessionRef.current
    if (!s) return
    sessionRef.current = null
    clearTimeout(capRef.current)
    setState('hearing')
    // The LIVE onText: the 60s cap's timer held the render that opened the mic, and its old send() wrote back an old
    // message list over a typed turn and Ebi's reply (a grade in it was lost).
    try { const text = (await s.stop())?.trim(); if (text && aliveRef.current) onTextRef.current?.(text) } catch (e) { if (aliveRef.current) setNote(e?.code === 'nomic' ? t('kit_noMic') : String(e.message || e).slice(0, 140)) }
    if (aliveRef.current) setState('idle')
  }
  const start = async () => {
    if (startingRef.current || sessionRef.current) return // a second tap while the mic opens started a second recorder
    setNote('')
    onStart?.() // e.g. stop Ebi talking
    if (!engine) { setNote(t('kit_noEngine')); return }
    startingRef.current = true
    let s
    try { s = await listen(ctx, { lang }) } catch { startingRef.current = false; if (aliveRef.current) setNote(t('kit_noMic')); return }
    startingRef.current = false
    if (!aliveRef.current) { s?.cancel?.(); return } // left the screen while the mic opened: never leave it on
    sessionRef.current = s
    capRef.current = setTimeout(stop, MAX_MS)
    setState('listening')
  }
  const live = state === 'listening'
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <button type="button" disabled={(disabled && !live) || state === 'hearing'} onClick={live ? stop : start}
        className={`btn-press${live ? ' ebiki-talk-live' : ''}`} aria-label={live ? t('kit_tapStop') : t('kit_tapTalk')}
        style={{
          padding: compact ? '8px 14px' : '12px 20px', borderRadius: RADIUS.pill, fontWeight: 800, fontSize: compact ? 13 : 15,
          ...depthBorder(live ? C.danger : C.info), background: live ? C.danger : C.info, color: C.white,
          cursor: disabled || state === 'hearing' ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1, whiteSpace: 'nowrap',
        }}>
        {state === 'hearing' ? `⏳ ${t('kit_hearing')}` : live ? `■ ${t('kit_tapStop')}` : `🎙️ ${t('kit_tapTalk')}`}
      </button>
      {live && <span style={{ fontSize: 11.5, color: C.danger, fontWeight: 700 }}>{t('kit_listening')}</span>}
      {note && <span style={{ fontSize: 11.5, color: C.danger, maxWidth: 260, textAlign: 'center' }}>{note}</span>}
      <style>{'@keyframes ebiki-talk-pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(229,57,46,.45) } 50% { box-shadow: 0 0 0 8px rgba(229,57,46,0) } } .ebiki-talk-live { animation: ebiki-talk-pulse 1.2s ease-in-out infinite; }'}</style>
    </span>
  )
}
