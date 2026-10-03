// The Learn-it panel for features: Study's Learn-it moment (the card back, a memory hook, a short focused chat with
// Ebi) in a modal, for a raid card or a Legends item the learner missed. Opened mid fight it PAUSES the fight (fights
// have no timers; the quiz ignores keys while it is open: data-top-overlay). It never records a review. Hooks come
// from the app's one hook engine (ctx.learn: saved hooks of the item, a new one saved like every other surface).
// item: { front, back, noteId? }, onClose(), closeLabel (the button's text).
import { useEffect, useRef, useState } from 'react'
import { C, FONT, RADIUS } from '../../config/tokens'
import { Modal, ChunkyButton } from '../ui'
import { buildLearnChatPrompt, boldParts, LEARN_ROLE, LEARN_MAX_TOKENS } from './learnIt'

const Rich = ({ text }) => boldParts(text).map((p, i) => (p.bold ? <b key={i}>{p.text}</b> : <span key={i}>{p.text}</span>))

export default function LearnItPanel({ ctx, item, onClose, closeLabel }) {
  const { t, ai, subject } = ctx
  const learn = ctx.learn || null
  const [hooks, setHooks] = useState(() => { try { return learn?.savedHooks?.(item.noteId, item.front) || [] } catch { return [] } })
  const [hookBusy, setHookBusy] = useState(false)
  const [chat, setChat] = useState([])
  const [input, setInput] = useState('')
  const [chatBusy, setChatBusy] = useState(false)
  const alive = useRef(true)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  const sid = useRef(`learnit-${Date.now().toString(36)}`).current
  const hookOnce = useRef(false)

  const moreHook = async () => {
    if (hookBusy || !ai.hasKey || !learn?.makeHook) return
    setHookBusy(true)
    try {
      const h = await learn.makeHook(item.front, item.back || '', hooks, 'auto', item.noteId)
      if (alive.current && h) setHooks((list) => (list.includes(h) ? list : [...list, h]))
    } catch { /* fail soft: the button stays */ } finally { if (alive.current) setHookBusy(false) }
  }
  // The first hook makes itself (this is the moment hooks exist for), unless the item already has some.
  useEffect(() => { if (!hookOnce.current && !hooks.length) { hookOnce.current = true; moreHook() } }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const send = async () => {
    const msg = input.trim()
    if (!msg || chatBusy || !ai.hasKey) return
    const history = [...chat, { role: 'user', content: msg }]
    setChat(history); setInput(''); setChatBusy(true)
    try {
      const { system, user } = buildLearnChatPrompt(subject, item, history)
      const reply = ai.clean(String(await ai.call(system, user, { role: LEARN_ROLE, maxTokens: LEARN_MAX_TOKENS }) || ''))
      if (!reply) throw new Error('empty')
      if (alive.current) setChat((c) => [...c, { role: 'assistant', content: reply }])
    } catch {
      if (alive.current) setChat((c) => [...c, { role: 'assistant', content: t('kit_learnChatFailed'), error: true }])
    } finally { if (alive.current) setChatBusy(false) }
  }

  const tappable = (text, key) => (subject.isLanguage && ctx.words ? ctx.words.tappable(text, `${sid}-${key}`) : text)
  const backLines = String(item.back || '').split(/\n+/).map((l) => l.trim()).filter(Boolean)
  const small = { fontFamily: FONT.body, fontSize: 12.5, fontWeight: 800, padding: '5px 12px', borderRadius: RADIUS.pill, background: 'transparent', cursor: 'pointer' }
  return (
    <Modal open onClose={onClose} zoom={ctx.getZoom?.() || 1} width={560}>
      <div data-top-overlay="" data-learn-it="" style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 900, color: C.brand }}>📖 {t('kit_learnTitle')}</span>
          <span style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 19, color: C.ink, whiteSpace: 'pre-wrap' }}>{tappable(item.front, 'front')}</span>
        </div>
        {ctx.words && subject.isLanguage && ctx.words.popup(`${sid}-front`)}
        {backLines.length > 0 && (
          <div style={{ fontSize: 14, color: C.ink, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: RADIUS.md, padding: '10px 12px', lineHeight: 1.6, maxHeight: 220, overflowY: 'auto' }}>
            {backLines.map((l, i) => <div key={i}>{tappable(l, `b${i}`)}</div>)}
          </div>
        )}
        {ctx.words && subject.isLanguage && backLines.map((_, i) => <span key={i}>{ctx.words.popup(`${sid}-b${i}`)}</span>)}
        {hooks.map((h, i) => (
          <div key={i} style={{ fontSize: 13, color: C.ink, background: `color-mix(in srgb, ${C.purple} 8%, ${C.surface})`, border: `1px solid color-mix(in srgb, ${C.purple} 30%, transparent)`, borderRadius: RADIUS.sm, padding: '8px 10px', lineHeight: 1.55, display: 'flex', gap: 6 }}>
            <span style={{ fontWeight: 800, color: C.purple }}>🧠</span><div style={{ flex: 1, minWidth: 0, whiteSpace: 'pre-wrap' }}><Rich text={h} /></div>
          </div>
        ))}
        {learn?.makeHook && (
          <div>
            {hookBusy ? <span style={{ fontSize: 12.5, color: C.purple }}>🧠 {t('kit_learnHookThinking')}</span>
              : <button type="button" onClick={moreHook} disabled={!ai.hasKey} style={{ ...small, color: C.purple, border: `1px solid color-mix(in srgb, ${C.purple} 35%, transparent)`, opacity: ai.hasKey ? 1 : 0.5, cursor: ai.hasKey ? 'pointer' : 'default' }}>
                🧠 {hooks.length ? t('kit_learnAnotherHook') : t('kit_learnHook')}
              </button>}
          </div>
        )}
        {chat.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
            {chat.map((m, i) => (
              <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '90%', fontSize: 13, lineHeight: 1.55, color: m.error ? C.danger : C.ink, whiteSpace: 'pre-wrap',
                background: m.role === 'user' ? `color-mix(in srgb, ${C.brand} 8%, ${C.surface})` : C.surfaceAlt, border: `1px solid ${m.role === 'user' ? `color-mix(in srgb, ${C.brand} 25%, transparent)` : C.border}`, borderRadius: RADIUS.sm, padding: '6px 10px' }}>
                <Rich text={m.content} />
              </div>
            ))}
            {chatBusy && <span style={{ fontSize: 12, color: C.inkDim }}>{t('kit_learnTyping')}</span>}
          </div>
        )}
        <div style={{ display: 'flex', gap: 6 }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} disabled={!ai.hasKey}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent?.isComposing) { e.preventDefault(); send() } }}
            placeholder={t('kit_learnAsk')}
            style={{ flex: 1, minWidth: 0, fontFamily: FONT.body, fontSize: 13.5, padding: '8px 10px', borderRadius: RADIUS.sm, border: `1px solid ${C.border}`, background: C.surfaceAlt, color: C.ink }} />
          <button type="button" onClick={send} disabled={!ai.hasKey || chatBusy || !input.trim()}
            style={{ ...small, color: C.brand, border: `1px solid color-mix(in srgb, ${C.brand} 35%, transparent)`, opacity: !ai.hasKey || chatBusy || !input.trim() ? 0.5 : 1, cursor: !ai.hasKey || chatBusy || !input.trim() ? 'default' : 'pointer' }}>
            {t('kit_learnSend')}
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <ChunkyButton color={C.success} onClick={onClose}>{closeLabel || t('kit_learnClose')}</ChunkyButton>
        </div>
      </div>
    </Modal>
  )
}
