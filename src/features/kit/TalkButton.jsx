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
  useEffect(() => () => { clearTimeout(capRef.current); sessionRef.current?.cancel?.() }, [])
  const { t } = ctx
  const engine = speechEngines(ctx).stt

  const stop = async () => {
    const s = sessionRef.current
    if (!s) return
    sessionRef.current = null
    clearTimeout(capRef.current)
    setState('hearing')
    try { const text = (await s.stop())?.trim(); if (text) onText?.(text) } catch (e) { setNote(String(e.message || e).slice(0, 140)) }
    setState('idle')
  }
  const start = async () => {
    setNote('')
    onStart?.() // e.g. stop Ebi talking
    if (!engine) { setNote(t('kit_noEngine')); return }
    try { sessionRef.current = await listen(ctx, { lang }) } catch { setNote(t('kit_noMic')); return }
    capRef.current = setTimeout(stop, MAX_MS)
    setState('listening')
  }
  const live = state === 'listening'
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <button type="button" disabled={disabled || state === 'hearing'} onClick={live ? stop : start}
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
