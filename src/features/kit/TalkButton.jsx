// Tap to talk, tap to send: records through src/speech (cheapest engine) and hands back the text.
import { useEffect, useRef, useState } from 'react'
import { C, RADIUS, fillFor } from '../../config/tokens'
import { listen, speechEngines } from '../../speech'
import { depthBorder } from '../ui'
import { aiErrorText } from './aiError'

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
    try { const text = (await s.stop())?.trim(); if (text && aliveRef.current) onTextRef.current?.(text) } catch (e) { if (aliveRef.current) setNote(e?.code === 'nomic' ? t('kit_noMic') : aiErrorText(t, e).slice(0, 140)) }
    if (aliveRef.current) setState('idle')
  }
  const start = async () => {
    if (startingRef.current || sessionRef.current) return // a second tap while the mic opens started a second recorder
    setNote('')
    onStart?.() // e.g. stop Ebi talking
    if (!engine) { setNote(t('kit_noEngine')); return }
    startingRef.current = true
    let s
    let failed = false
    // The browser recognizer died on its own (mic refused after the prompt, no mic, offline): end this turn and say
    // so now, else the button showed "Listening" over a dead recognizer until the learner pressed stop.
    // Only codes come from the recognizer: 'nomic' reads as the mic note, anything else (offline...) as a plain stop.
    let failNote = 'kit_noMic'
    const onFail = (code) => {
      failed = true
      failNote = !code || code === 'nomic' ? 'kit_noMic' : 'kit_listenFailed'
      if (!s || sessionRef.current !== s) return // not started yet (handled below) or already ended
      sessionRef.current = null
      clearTimeout(capRef.current)
      s.cancel?.()
      if (aliveRef.current) { setNote(t(failNote)); setState('idle') }
    }
    try { s = await listen(ctx, { lang, onFail }) } catch { startingRef.current = false; if (aliveRef.current) setNote(t('kit_noMic')); return }
    startingRef.current = false
    if (!aliveRef.current) { s?.cancel?.(); return } // left the screen while the mic opened: never leave it on
    if (failed) { s?.cancel?.(); setNote(t(failNote)); return } // died before this turn even began
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
          ...depthBorder(live ? C.dangerFill : C.infoFill), background: live ? C.dangerFill : C.infoFill, color: C.white,
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
