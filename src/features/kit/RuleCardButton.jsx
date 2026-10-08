// "Make a rule card": turns a mistake, slip or diagnosis into a card for the rule behind it. Shows the card
// (editable) before anything is added; Add writes it to the mode's deck. Used by Mistake Gym and others.
import { useRef, useState } from 'react'
import { C, RADIUS } from '../../config/tokens'
import { buildRuleCardPrompt, parseRuleCard, RULE_ROLE, RULE_MAX_TOKENS } from './ruleCard'
import { recordPractice } from './practiceLogStore'
import { aiErrorText } from './aiError'

// Rule cards made this app session (per mode), fed back so the model doesn't write the same rule twice.
const madeThisSession = new Map()

// `deck`: where Add writes. Legends passes the MODE's deck (never the first-deck fallback: a mode with no deck wrote
// its rule cards into another mode's deck); others default to the MODE's deck too (subject.deck falls back to Anki's first deck).
export default function RuleCardButton({ ctx, source, compact = false, deck: deckProp }) {
  const [state, setState] = useState('idle') // idle | making | preview | adding | added | skipped | failed
  const [card, setCard] = useState(null)
  const [note, setNote] = useState('')
  const busyRef = useRef(false)
  const { t, ai, subject } = ctx
  const targetDeck = deckProp !== undefined ? deckProp : (subject.modeDeck || '')
  const made = madeThisSession.get(subject.modeId) || []

  const make = async () => {
    if (busyRef.current || !ai.hasKey) return
    busyRef.current = true
    setState('making'); setNote('')
    try {
      // The live list (a card added by another button since this one rendered is avoided too).
      const { system, user } = buildRuleCardPrompt(subject, source, { avoid: madeThisSession.get(subject.modeId) || made })
      const c = parseRuleCard(ai.json(await ai.call(system, user, { role: RULE_ROLE, maxTokens: RULE_MAX_TOKENS })), ai.clean)
      if (!c) throw new Error(t('kit_ruleBad'))
      if (c.skip) { setNote(c.why || t('kit_ruleNone')); setState('skipped'); return }
      setCard({ ...c, modeId: subject.modeId }); setState('preview')
    } catch (e) { setNote(aiErrorText(t, e)); setState('failed') } finally { busyRef.current = false }
  }
  const add = async () => {
    if (busyRef.current || !card || !targetDeck) return
    // Written for another mode (a mode switch while the preview stayed open): never added to this mode's deck.
    if (String(card.modeId ?? '') !== String(subject.modeId ?? '')) { setCard(null); setState('idle'); return }
    busyRef.current = true
    setState('adding')
    try {
      await ctx.cards.addNew(targetDeck, ctx.cards.frontHtml(card.front), ctx.cards.backHtml(card.back), card.tags)
      madeThisSession.set(subject.modeId, [...(madeThisSession.get(subject.modeId) || []), card.front].slice(-30)) // live list: two buttons adding at once kept only one
      recordPractice(ctx, 'rule-card', [{ kind: 'topic', label: card.front }])
      setState('added')
    } catch (e) { setNote(aiErrorText(t, e)); setState('preview') } finally { busyRef.current = false }
  }

  const small = { padding: compact ? '3px 9px' : '5px 12px', borderRadius: RADIUS.sm, fontSize: compact ? 11.5 : 12.5, fontWeight: 800, cursor: 'pointer', background: 'transparent' }
  if (state === 'added') return <span style={{ fontSize: 12.5, fontWeight: 800, color: C.success }}>✓ {t('kit_ruleAdded', { deck: targetDeck })}</span>
  if (state === 'preview' || state === 'adding') {
    const field = { width: '100%', boxSizing: 'border-box', padding: '7px 9px', fontSize: 13, borderRadius: RADIUS.sm, border: `1px solid ${C.border}`, background: C.surfaceAlt, color: C.ink, fontFamily: 'inherit', resize: 'vertical' }
    return (
      <div style={{ display: 'grid', gap: 6, padding: 10, borderRadius: RADIUS.md, border: `2px solid ${C.purple}`, marginTop: 6 }}>
        <div style={{ fontSize: 11.5, fontWeight: 800, color: C.purple, textTransform: 'uppercase', letterSpacing: '.05em' }}>📐 {t('kit_rulePreview')}</div>
        <textarea value={card.front} rows={2} onChange={(e) => setCard({ ...card, front: e.target.value })} style={{ ...field, fontWeight: 700 }} />
        <textarea value={card.back} rows={5} onChange={(e) => setCard({ ...card, back: e.target.value })} style={field} />
        {!targetDeck && <div style={{ fontSize: 12, color: C.warning }}>{t('kit_ruleNoDeck')}</div>}
        {note && <div style={{ fontSize: 12, color: C.danger }}>{note}</div>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={add} disabled={state === 'adding' || !targetDeck || !card.front.trim() || !card.back.trim()}
            style={{ ...small, border: `1px solid ${C.success}`, color: C.success, opacity: state === 'adding' || !targetDeck ? 0.5 : 1, cursor: state === 'adding' || !targetDeck ? 'default' : 'pointer' }}>
            {state === 'adding' ? t('kit_ruleAdding') : `+ ${t('kit_ruleAdd', { deck: targetDeck || '' })}`}
          </button>
          <button onClick={() => { setCard(null); setState('idle') }} disabled={state === 'adding'} style={{ ...small, border: `1px solid ${C.border}`, color: C.inkDim }}>{t('kit_ruleCancel')}</button>
        </div>
      </div>
    )
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <button onClick={make} disabled={state === 'making' || !ai.hasKey} data-tip={t('kit_ruleTip')} className="tip"
        style={{ ...small, border: `1px solid ${C.purple}`, color: C.purple, opacity: state === 'making' || !ai.hasKey ? 0.5 : 1, cursor: state === 'making' || !ai.hasKey ? 'default' : 'pointer' }}>
        📐 {state === 'making' ? t('kit_ruleMaking') : t('kit_ruleMake')}
      </button>
      {note && <span style={{ fontSize: 12, color: state === 'skipped' ? C.inkDim : C.danger }}>{note}</span>}
    </span>
  )
}
