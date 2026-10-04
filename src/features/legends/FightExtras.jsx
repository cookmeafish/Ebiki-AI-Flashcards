// FIGHT EXTRAS, shared by Legends boss/Legendary fights (NodeRun.jsx) and raids (RaidRun.jsx):
//   useFightCheck  every answer's second look: the background note, the automatic re-check of a miss or glancing
//                  verdict, the learner's appeal (one per answer), and what a won one gives back (the feature's
//                  onOverturn: refund the fight while it runs, fix the Anki grade or the item tally after).
//   useBossTaunt   a boss line after a miss (kit/taunt.js + kit/tauntStore.js), dropped when a newer question came.
//   MissTools      the row under a miss: re-check status, Appeal, Learn it, Make a rule card.
//   TauntBubble, FightNotice, Debrief   what the screens draw.
// Async results land only where they were asked: every answer has its own id (aid), a taunt its question token.
// The DECISIONS (who is re-checked, when an appeal may start, which rows the debrief lists, how a question resolves)
// and the on/off switch of every piece (FIGHT_EXTRAS) live in fightCheck.js (pure, tested); this file draws them.
import { useCallback, useEffect, useRef, useState } from 'react'
import { C, FONT, RADIUS } from '../../config/tokens'
import { ChunkyButton, Card } from '../ui'
import { recheckStrike, RuleCardButton } from '../kit'
import { fetchTaunt } from '../kit/tauntStore'
import { useHelpEntry } from '../kit/useHelp'
import { FIGHT_EXTRAS, isWrongish, expectedOf, needsRecheck, appealOpen, appealOffered, debriefEntries, resolveFightQuestion } from './fightCheck'

export { isWrongish, expectedOf } // older imports of these from here keep working

// How long a fight's end waits for re-checks and appeals still running before it records anyway.
export const SETTLE_MS = 12000
const NOTICE_MS = 6000
const REASON_MAX = 300

let aidSeq = 0
const newAid = () => `a${Date.now().toString(36)}${(++aidSeq).toString(36)}`

// opts.onOverturn(entry, to): an answer judged wrong (or glancing) was right after all; `entry.by` = 'recheck' |
// 'appeal'. Called once per answer; returns true when it gave something back to the fight (the notice says so). The
// hook never touches the fight itself. opts.isOver(): the fight is decided (a win then fixes only the grade).
export function useFightCheck(ctx, { onOverturn, isOver } = {}) {
  const { ai, subject, t } = ctx
  const store = useRef(new Map()) // aid -> entry (mutable copy; `entries` state is what renders)
  const byQ = useRef(new WeakMap()) // question object -> aid (feedback rows find their answer)
  const fixes = useRef(new Map()) // aid -> a glancing answer's follow-up, once written
  const cancelled = useRef(new Set()) // aids whose attack must not come (overturned)
  const [entries, setEntries] = useState([])
  const [notice, setNotice] = useState(null) // { aid, text, n }
  const alive = useRef(true)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  const overturnRef = useRef(onOverturn)
  overturnRef.current = onOverturn
  const overRef = useRef(isOver)
  overRef.current = isOver
  const noticeTimer = useRef(null)
  useEffect(() => () => clearTimeout(noticeTimer.current), [])

  const publish = () => { if (alive.current) setEntries([...store.current.values()]) }
  const patch = (aid, p) => { const e = store.current.get(aid); if (!e) return null; Object.assign(e, p); publish(); return e }

  const overturn = (aid, to, why, by) => {
    const e = store.current.get(aid)
    if (!e || e.overturned) return
    const from = e.verdict
    let afterFight = false
    try { afterFight = !!overRef.current?.() } catch { /* treat as running */ }
    Object.assign(e, { overturned: true, from, verdict: to, why: why || e.why || '', by, afterFight })
    cancelled.current.add(aid)
    publish()
    let refunded = false
    if (e.attached) { try { refunded = !!overturnRef.current?.(e, to) } catch { /* the feature's problem */ } } else e.overturnWaiting = true
    if (alive.current) {
      setNotice((prev) => ({ aid, text: t('lg_recheckRight'), refunded, n: (prev?.n || 0) + 1 }))
      clearTimeout(noticeTimer.current)
      noticeTimer.current = setTimeout(() => { if (alive.current) setNotice(null) }, NOTICE_MS)
    }
  }

  // A new answer. j = the judge's result ({ verdict, ai?, later? }) or { verdict } for a choice / local answer.
  const open = useCallback((q, answer, mode, j = {}) => {
    const aid = newAid()
    const verdict = j.verdict || 'miss'
    const e = { aid, q, answer: String(answer || ''), mode: mode === 'choice' ? 'choice' : 'typed', verdict, first: verdict, note: j.note || '', why: '',
      status: needsRecheck({ viaAi: !!j.ai, verdict, answer, hasKey: ai.hasKey }) ? 'checking' : 'idle', appeal: null, attached: false, at: Date.now() }
    store.current.set(aid, e)
    if (q && typeof q === 'object') byQ.current.set(q, aid)
    publish()
    if (j.later && typeof j.later.then === 'function') {
      j.later.then((r) => {
        if (r?.note) patch(aid, { note: store.current.get(aid)?.note || r.note })
        if (r?.attack) fixes.current.set(aid, r.attack)
      }).catch(() => {})
    }
    if (e.status === 'checking') {
      recheckStrike(ai, subject, q, answer, { verdict }).then((r) => {
        const cur = store.current.get(aid)
        if (!cur || cur.overturned) return
        if (r?.overturned) { cur.status = 'overturned'; overturn(aid, r.verdict, r.why, 'recheck') } else patch(aid, { status: r ? 'upheld' : 'failed', why: r?.why || '' })
      })
    }
    return aid
  }, [ai, subject]) // eslint-disable-line react-hooks/exhaustive-deps

  // What the answer did to the fight (cost, kind, weak, the card or item it was about), once the feature applied it.
  const attach = useCallback((aid, info = {}) => {
    const e = store.current.get(aid)
    if (!e) return
    Object.assign(e, info, { attached: true })
    publish()
    if (e.overturnWaiting) { e.overturnWaiting = false; try { overturnRef.current?.(e, e.verdict) } catch { /* the feature's problem */ } }
  }, [])

  const appeal = useCallback(async (aid, reason) => {
    const e = store.current.get(aid)
    if (!appealOpen(e) || !ai.hasKey) return
    patch(aid, { appeal: 'pending', reason: String(reason || '').slice(0, REASON_MAX) })
    const r = await recheckStrike(ai, subject, e.q, e.answer, { verdict: e.verdict, reason })
    const cur = store.current.get(aid)
    if (!cur) return
    if (!r) { patch(aid, { appeal: 'failed' }); return }
    if (r.overturned) { cur.appeal = 'won'; cur.appealWhy = r.why; overturn(aid, r.verdict, r.why, 'appeal') } else patch(aid, { appeal: 'lost', appealWhy: r.why })
  }, [ai, subject]) // eslint-disable-line react-hooks/exhaustive-deps

  // A run of questions asks this when it reaches one: a follow-up written later replaces its placeholder, an attack
  // that was cancelled (the answer was right) or is still unwritten is skipped.
  const resolveQuestion = useCallback((q) => resolveFightQuestion(q, cancelled.current, fixes.current), [])

  // Resolves once no re-check or appeal is running (or after `ms`).
  const settle = useCallback((ms = SETTLE_MS) => new Promise((resolve) => {
    const started = Date.now()
    const tick = () => {
      const busy = [...store.current.values()].some((e) => e.status === 'checking' || e.appeal === 'pending')
      if (!busy || Date.now() - started >= ms) resolve()
      else setTimeout(tick, 250)
    }
    tick()
  }), [])

  return { entries, open, attach, appeal, resolveQuestion, settle, notice,
    get: (aid) => store.current.get(aid) || null,
    entryFor: (q) => { const aid = q && typeof q === 'object' ? byQ.current.get(q) : null; return aid ? store.current.get(aid) || null : null } }
}

// THE TAUNT. opts: { bossKey, voice, rules, avoidWords, sample, bossName, enabled }. onMiss(q, answer, expected) asks for
// one line in the background; a line that arrives after the next question appeared is dropped, and the bubble clears
// at the next answer.
export function useBossTaunt(ctx, { bossKey, voice, rules, avoidWords, sample = '', bossName = '', enabled = true } = {}) {
  const { ai, subject } = ctx
  const [bubble, setBubble] = useState(null) // { text, n }
  const qToken = useRef(0)
  const sampleUsed = useRef(false) // the sample line falls back at most once per fight
  const alive = useRef(true)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  const onQuestion = useCallback(() => { qToken.current++ }, [])
  const onAnswer = useCallback(() => setBubble(null), [])
  const onMiss = useCallback((q, answer, expected) => {
    if (!enabled || !voice) return
    const my = qToken.current
    fetchTaunt(ai, {
      bossKey, voice, rules, avoidWords, sample, bossName,
      sampleUsed: () => sampleUsed.current, markSample: () => { sampleUsed.current = true },
      isLanguage: !!subject.isLanguage, subjectName: subject.name, learnLang: subject.learnLang, userLang: subject.userLang,
      question: q?.prompt || '', expected, answer,
    }).then((r) => {
      if (!r || !alive.current || my !== qToken.current) return // a newer question came first
      setBubble((b) => ({ text: r.line, n: (b?.n || 0) + 1 }))
    }).catch(() => {})
  }, [enabled, voice, rules, avoidWords, sample, bossName, bossKey, ai, subject])
  // Ebi's Help hears what the boss said (about a question already answered; never the live one's answer).
  useHelpEntry(ctx, 'boss-taunt', bubble?.text ? `${bossName || 'The boss'} just taunted the learner about a question they already answered wrong: "${bubble.text}"` : '', ctx.activeTab || 'legends')
  return { bubble, onMiss, onQuestion, onAnswer }
}

// Fight text with tappable words (ctx.words) when it is not in the app language; plain otherwise. An answered
// question's text is never guarded (its answer is already on screen).
export function useFightWords(ctx) {
  const lang = ctx?.subject?.userLang || ''
  const on = !!ctx?.words?.canTap?.(lang)
  return {
    on,
    text: (text, source) => (on && text ? ctx.words.tappable(String(text), source, String(text), { lang }) : text),
    popup: (source) => (on ? ctx.words.popup(source) : null),
  }
}

// The boss's speech bubble, right under the arena, its tail pointing up at the boss. With `ctx`, its words are tappable.
export function TauntBubble({ bubble, name, calm, ctx = null }) {
  const w = useFightWords(ctx)
  if (!bubble?.text) return null
  return (
    <div key={bubble.n} role="status" aria-live="polite" data-boss-taunt="" style={{ position: 'relative', margin: '10px 0 0 22px', maxWidth: 520, padding: '9px 14px', borderRadius: RADIUS.lg, background: C.surface, border: `2px solid color-mix(in srgb, ${C.danger} 45%, ${C.border})`, color: C.ink, fontSize: 14.5, fontWeight: 700, lineHeight: 1.4, animation: calm ? 'none' : 'lgTauntIn .35s cubic-bezier(.3,1.5,.5,1) both' }}>
      <style>{'@keyframes lgTauntIn { 0% { transform: scale(.6); opacity: 0 } 100% { transform: scale(1); opacity: 1 } }'}</style>
      <span aria-hidden="true" style={{ position: 'absolute', top: -9, left: 26, width: 14, height: 14, background: C.surface, borderLeft: `2px solid color-mix(in srgb, ${C.danger} 45%, ${C.border})`, borderTop: `2px solid color-mix(in srgb, ${C.danger} 45%, ${C.border})`, transform: 'rotate(45deg)' }} />
      {name && <span style={{ display: 'block', fontSize: 11.5, fontWeight: 900, color: C.danger, letterSpacing: '.03em' }}>{name}</span>}
      <span dir="auto">💬 {w.text(bubble.text, `taunt-${bubble.n}`)}</span>
      {w.popup(`taunt-${bubble.n}`)}
    </div>
  )
}

// "Ebi checked again: you were right!" (a re-check or an appeal gave something back).
export function FightNotice({ notice, t }) {
  if (!notice?.text) return null
  return (
    <div key={notice.n} role="status" data-refund-notice="" style={{ margin: '8px auto 0', maxWidth: 640, padding: '9px 14px', borderRadius: RADIUS.md, border: `2px solid ${C.success}`, background: `color-mix(in srgb, ${C.success} 12%, ${C.surface})`, color: C.success, fontWeight: 900, fontSize: 14.5, display: 'flex', gap: 8, alignItems: 'center' }}>
      ✅ {notice.text} {notice.refunded && <span style={{ fontWeight: 700, fontSize: 13, color: C.ink }}>{t('lg_recheckRefund')}</span>}
    </div>
  )
}

// The row under a miss (or glancing answer): what the second look found, Appeal, Learn it, Make a rule card.
// `after`: the fight is over (an appeal then fixes only the grade, and says so).
export function MissTools({ ctx, entry, onAppeal, onLearn, rule = false, after = false, expected = '' }) {
  const { t, ai } = ctx
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  if (!entry) return null
  const wrongish = isWrongish(entry.first)
  if (!wrongish) return null
  const small = { fontFamily: FONT.body, fontSize: 12, fontWeight: 800, padding: '4px 11px', borderRadius: RADIUS.pill, background: 'transparent', cursor: 'pointer' }
  const canAppeal = !!onAppeal && appealOffered(entry, { hasKey: ai.hasKey })
  const send = () => { setOpen(false); onAppeal?.(entry.aid, reason) }
  return (
    <div data-miss-tools="" style={{ display: 'grid', gap: 6 }}>
      {entry.status === 'checking' && !entry.overturned && <div role="status" style={{ fontSize: 12.5, fontWeight: 700, color: C.inkDim }}>🔎 {t('lg_recheckChecking')}</div>}
      {entry.overturned && (
        <div role="status" style={{ fontSize: 13, fontWeight: 800, color: C.success }}>
          ✅ {entry.by === 'appeal' ? t('lg_appealWon') : t('lg_recheckRight')}{entry.why || entry.appealWhy ? ` ${entry.appealWhy || entry.why}` : ''}
          {entry.afterFight && <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.inkDim }}>{t('lg_appealAfterNote')}</span>}
        </div>
      )}
      {entry.appeal === 'pending' && <div role="status" style={{ fontSize: 12.5, fontWeight: 700, color: C.purple }}>⚖ {t('lg_appealPending')}</div>}
      {entry.appeal === 'lost' && <div style={{ fontSize: 12.5, fontWeight: 700, color: C.inkDim }}>⚖ {t('lg_appealLost')}{entry.appealWhy ? ` ${entry.appealWhy}` : ''}</div>}
      {entry.appeal === 'failed' && <div style={{ fontSize: 12.5, fontWeight: 700, color: C.danger }}>{t('lg_appealFailed')}</div>}
      {open ? (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={reason} autoFocus maxLength={REASON_MAX} onChange={(e) => setReason(e.target.value)} placeholder={t('lg_appealPlaceholder')}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent?.isComposing) { e.preventDefault(); send() } else if (e.key === 'Escape') { e.preventDefault(); setOpen(false) } }}
            style={{ flex: '1 1 220px', minWidth: 0, fontFamily: FONT.body, fontSize: 13, padding: '6px 9px', borderRadius: RADIUS.sm, border: `1px solid ${C.border}`, background: C.surfaceAlt, color: C.ink }} />
          <button type="button" onClick={send} style={{ ...small, color: C.purple, border: `1px solid color-mix(in srgb, ${C.purple} 40%, transparent)` }}>⚖ {t('lg_appealSend')}</button>
          <button type="button" onClick={() => setOpen(false)} style={{ ...small, color: C.inkDim, border: `1px solid ${C.border}` }}>{t('lg_appealCancel')}</button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {canAppeal && (
            <button type="button" onClick={() => setOpen(true)} className="tip" data-tip={after ? t('lg_appealTipAfter') : t('lg_appealTip')}
              style={{ ...small, color: C.purple, border: `1px solid color-mix(in srgb, ${C.purple} 40%, transparent)` }}>⚖ {t('lg_appeal')}</button>
          )}
          {onLearn && FIGHT_EXTRAS.learnIt && (
            <button type="button" onClick={onLearn} className="tip" data-tip={t('lg_learnItTip')}
              style={{ ...small, color: C.brand, border: `1px solid color-mix(in srgb, ${C.brand} 40%, transparent)` }}>📖 {t('lg_learnIt')}</button>
          )}
          {rule && ai.hasKey && <RuleCardButton ctx={ctx} compact deck={ctx.subject?.modeDeck || ''} source={{ asked: entry.q?.prompt || '', answered: entry.answer, expected }} />}
        </div>
      )}
    </div>
  )
}

// RAIDS: "What tripped you up" after the fight (Legends extends its own all-answers list instead).
export function Debrief({ ctx, fc, onLearn, expectedOf }) {
  const { t } = ctx
  const w = useFightWords(ctx)
  const list = debriefEntries(fc.entries)
  if (!list.length) return null
  return (
    <Card title={`🧩 ${t('lg_debriefTitle')}`} style={{ width: '100%', boxSizing: 'border-box', textAlign: 'left' }}>
      <div data-debrief="" style={{ display: 'grid', gap: 12 }}>
        {list.map((e) => {
          const expected = expectedOf(e.q)
          return (
            <div key={e.aid} style={{ fontSize: 13.5, lineHeight: 1.45, borderBottom: `1px solid ${C.border}`, paddingBottom: 10, display: 'grid', gap: 4 }}>
              <div dir="auto" style={{ fontWeight: 800, color: C.ink, whiteSpace: 'pre-wrap' }}>{e.overturned ? '✅' : e.first === 'glancing' ? '🟠' : '❌'} {w.text(e.q?.prompt, `debrief-${e.aid}-q`)}</div>
              {w.popup(`debrief-${e.aid}-q`)}
              <div dir="auto" style={{ color: e.overturned ? C.success : C.danger }}>{e.overturned ? '✓' : '✗'} {e.answer || t('lg_debriefNoAnswer')}</div>
              {expected && <div dir="auto" style={{ color: C.success }}>✓ {w.text(expected, `debrief-${e.aid}-x`)}</div>}
              {expected && w.popup(`debrief-${e.aid}-x`)}
              {e.note && <div dir="auto" style={{ color: C.inkDim }}>{w.text(e.note, `debrief-${e.aid}-n`)}</div>}
              {e.note && w.popup(`debrief-${e.aid}-n`)}
              <MissTools ctx={ctx} entry={e} onAppeal={fc.appeal} after rule onLearn={onLearn ? () => onLearn(e) : null} expected={expected} />
            </div>
          )
        })}
      </div>
    </Card>
  )
}

