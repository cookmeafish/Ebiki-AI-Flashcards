// Ebi Call: a conversation that counts as a review. Today's due cards are woven into the chat; each one the
// learner uses gets graded (with a notification), and at the end the grades are reviewed and saved as real
// reviews. No due cards → a practice call that saves nothing. With the optional Voice chat feature on, the
// learner talks (tap to talk) and Ebi's replies are spoken by the cheapest voice (src/speech).
import { useEffect, useRef, useState } from 'react'
import { C, FONT, RADIUS } from '../../config/tokens'
import { poseFile, shrimpUrl } from '../../config/shrimp'
import { srs } from '../../cards'
import { platform } from '../../platform'
import { speak } from '../../speech'
import { TalkButton, voiceChatOn, readPracticeLog, recordPractice, rankFresh, studyBlock, studyBlockText } from '../kit'
import { useFeatureCtx, useFocusHold, useActivityBusy } from '../registry'
import { EVENTS } from '../events'
import { ChunkyButton, EbiSays, tCount, depthBorder } from '../ui'
import { splitReply, applyGrades, ratingsFrom, onePerNote, VERDICTS, CALL_CARDS } from './grades'
import { buildCallSystem, buildCallTurn, CALL_ROLE, CALL_MAX_TOKENS } from './prompt'
import { learnerLevelLine } from '../kit/learnerStore'
import { recordCall } from './recorder'
import { useHelpEntry } from '../kit/useHelp'

export const CALL_FEATURE_ID = 'ebi-call'
const SLIPS = 8
const READ_ALOUD_KEY = 'ebiki-call-read-aloud'
const VERDICT_COLOR = { good: C.success, hard: C.warning, again: C.danger }
const INFO_BATCH = 200
const PRACTICE_SCAN_MAX = 2000 // cards looked at, at most, to find learned ones for a practice call

const shuffle = (a) => a.map((x) => [x, Math.random()]).sort((p, q) => p[1] - q[1]).map(([x]) => x)

// What a finished call tells the rest of the app (practice log, game, learner level, Mistake Gym). Shared by Save and
// by a call left unsaved (unmount), so both report the same facts. L = { ctx, t, subject, targets, grades, messages }.
function announceCall(L, n) {
  const { ctx, t, subject, targets, grades, messages } = L
  recordPractice(ctx, CALL_FEATURE_ID, targets.filter((tg) => grades[String(tg.cardId)]).map((tg) => ({ kind: 'card', label: tg.front })))
  // Only a call the learner took part in counts (End right after Ebi's opener paid XP and the daily call quest), and
  // it nudges the learner level like any practice (Legends listens to PRACTICE_DONE; the game pays CALL_DONE).
  if (messages.some((m) => m.role === 'me')) {
    ctx.emit(EVENTS.CALL_DONE, { mode: subject.modeId, cards: n })
    const vs = Object.values(grades).map((g) => g?.verdict).filter(Boolean)
    if (vs.length) ctx.emit(EVENTS.PRACTICE_DONE, { source: CALL_FEATURE_ID, mode: subject.modeId, total: vs.length, correct: vs.filter((v) => v !== 'again').length })
    // Cards the learner could not produce in the call go to the Mistake Gym (the Anki review is separate).
    const missed = targets.filter((tg) => grades[String(tg.cardId)]?.verdict === 'again')
    if (missed.length) ctx.emit(EVENTS.PRACTICE_MISSED, { source: CALL_FEATURE_ID, mode: subject.modeId, misses: missed.map((tg) => ({ front: tg.front, back: tg.back, question: t('call_missQuestion'), answer: '', expected: tg.front, feedback: grades[String(tg.cardId)]?.why || '' })) })
  }
  if (n) ctx.notify(tCount(t, 'call_saved', n))
}

// A call left mid-way (mode switch, another screen, Back) is saved like a raid: the grades it already gave become
// reviews through the same at-most-once guards (recordCall, keyed by the call id), then the call is announced.
async function saveLeftCall(L, { callId, deck, pre }) {
  const ratings = L.practice ? [] : ratingsFrom(L.targets, L.grades)
  let n = 0
  if (ratings.length) {
    try {
      const r = await recordCall({ callId, deck, ratings, preSchedule: pre })
      n = r.recorded.length
      if (r.failed.length) L.ctx.notify(tCount(L.t, 'call_failed', r.failed.length))
    } catch { L.ctx.notify(tCount(L.t, 'call_failed', ratings.length)) }
  }
  announceCall(L, n)
}


export default function CallScreen({ onExit }) {
  const ctx = useFeatureCtx()
  const [phase, setPhase] = useState('intro')     // intro | loading | call | review | saving | done
  const [targets, setTargets] = useState([])      // [{ cardId, front, back }]
  const [practice, setPractice] = useState(false)
  const [messages, setMessages] = useState([])    // [{ role: 'ebi'|'me', text }]
  const [grades, setGrades] = useState({})        // cardId -> { verdict, why }
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [readAloud, setReadAloud] = useState(() => platform.kv.get(READ_ALOUD_KEY) === '1')
  const preRef = useRef(new Map())
  const callIdRef = useRef('')
  const startingRef = useRef(false)
  const callDeckRef = useRef('') // the deck the call's cards came from: reviews are saved there even if the header deck changes
  const listRef = useRef(null)
  const speakingRef = useRef(null)
  // aliveRef: set on mount too (StrictMode mounts twice). A reply landing after the screen closed is never spoken.
  const aliveRef = useRef(false)
  useEffect(() => { aliveRef.current = true; return () => { aliveRef.current = false; speakingRef.current?.stop() } }, [])
  // Leaving with graded, unsaved cards saves them (like a raid); settledRef = saved, being saved, or announced.
  const settledRef = useRef(false)
  const liveRef = useRef(null) // the latest render's call state, for the unmount save
  useEffect(() => () => {
    const L = liveRef.current
    if (!L || settledRef.current || (L.phase !== 'call' && L.phase !== 'review')) return // StrictMode's test unmount: still 'intro'
    settledRef.current = true
    saveLeftCall(L, { callId: callIdRef.current, deck: callDeckRef.current || L.subject.deck, pre: preRef.current })
  }, [])
  // The hub asks before Back only while a call is connecting, running or waiting for its review.
  useActivityBusy(phase !== 'intro' && phase !== 'done')
  // A study session in the way (see kit/studyGuard). Asked on open: a session abandoned for 8 hours is ended then.
  const [block, setBlock] = useState(() => (ctx?.studyActive ? { unsynced: 0 } : null))
  useEffect(() => {
    if (phase !== 'intro') return
    let live = true
    studyBlock(ctx).then((b) => { if (live && aliveRef.current) setBlock(b) })
    return () => { live = false }
  }, [phase, ctx?.studyActive]) // eslint-disable-line react-hooks/exhaustive-deps
  useFocusHold(phase === 'call') // no pop-ups mid-conversation (the graded-card toasts are the exception)
  useEffect(() => { listRef.current?.scrollTo?.({ top: 1e9, behavior: 'smooth' }) }, [messages])
  // What Ebi's Help knows about this call. The cards it checks stay SECRET while the call runs (they are the answers).
  useHelpEntry(ctx, 'ebi-call', phase === 'intro' || phase === 'loading' ? '' : [
    `Activity open: Ebi Call (${practice ? 'a practice call: nothing is recorded in Anki' : 'a review call: each card it checks becomes an Anki review'}). Phase: ${phase}.`,
    phase === 'call'
      ? `The call checks ${targets.length} cards; they are SECRET while it runs (the learner must produce them).`
      : targets.length ? `Cards checked: ${targets.map((tg) => { const g = grades[tg.cardId]; return `"${tg.front}" ${g ? `${g.verdict}${g.why ? ` (${g.why})` : ''}` : 'not reached'}` }).join('; ')}` : '',
    messages.length ? `Conversation (latest turns):\n${messages.slice(-8).map((m) => `${m.role === 'ebi' ? 'Ebi' : 'Learner'}: ${String(m.text || '').slice(0, 220)}`).join('\n')}` : '',
  ].filter(Boolean).join('\n'))
  // The first line of the call, once the targets are in state. (Declared before any early return: hook order.)
  const openedRef = useRef('')
  useEffect(() => {
    if (!ctx || phase !== 'call' || messages.length || openedRef.current === callIdRef.current) return
    openedRef.current = callIdRef.current
    setBusy(true)
    // The opener grades nothing: the learner has not said a word yet (a stray grade there became a real review).
    say([]).then((r) => land({ ...r, grades: [] }, [], {})).catch((e) => setError(String(e.message || e))).finally(() => setBusy(false))
  }, [phase, targets]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!ctx) return null
  const { t, ai, subject } = ctx
  // Pinned to the call's own mode: a mode switch renders this once more with the NEW mode before the hub closes it, and
  // the unmount save must file the call under the mode it ran in.
  if (!liveRef.current || phase === 'intro' || phase === 'loading' || liveRef.current.subject?.modeId === subject?.modeId) {
    liveRef.current = { ctx, t, subject, phase, practice, targets, grades, messages }
  }
  const voiceOn = voiceChatOn(ctx) // optional feature: talk out loud, hear replies

  const say = async (history, done = {}) => {
    const system = buildCallSystem(subject, targets, { practice, done: Object.keys(done), slips: subject.isLanguage ? subject.grammarSlips(SLIPS) : '', level: await learnerLevelLine(ctx, { context: true }) })
    const raw = await ai.call(system, buildCallTurn(history), { role: CALL_ROLE, maxTokens: CALL_MAX_TOKENS })
    return splitReply(raw, targets.map((tg) => tg.cardId), ai.json)
  }

  const land = (reply, history, cur) => {
    if (!aliveRef.current) return // the call was left while Ebi was answering: no toasts, no speech
    const text = ai.clean(reply.say) || '...'
    const { state, fresh } = applyGrades(cur, reply.grades)
    setGrades(state)
    setMessages([...history, { role: 'ebi', text }])
    for (const g of fresh) {
      const tg = targets.find((x) => String(x.cardId) === g.id)
      if (tg) ctx.notify(t('call_graded', { card: tg.front, verdict: t(`call_v_${g.verdict}`) }))
    }
    if (readAloud || voiceOn) { speakingRef.current?.stop(); speakingRef.current = speak(ctx, text, { lang: subject.isLanguage ? subject.learnLangIso : ctx.lang }) }
  }

  const start = async () => {
    // Claimed before the await: Start stays enabled until 'loading', and a double click opened two calls (two openers).
    if (startingRef.current || phase !== 'intro') return
    startingRef.current = true
    setError('')
    const b = await studyBlock(ctx).finally(() => { startingRef.current = false }) // never two loops answering the same due card
    setBlock(b)
    if (b) return
    setPhase('loading')
    try {
      let infos = []
      let isPractice = false
      callDeckRef.current = subject.deck || ''
      // Card details in batches, keeping those `keep` accepts, until `enough` are kept.
      const infoOf = async (ids, keep, enough) => {
        const out = []
        for (let i = 0; i < ids.length && out.length < enough; i += INFO_BATCH) out.push(...((await srs.cardsInfo(ids.slice(i, i + INFO_BATCH))) || []).filter(keep))
        return out
      }
      if (ctx.ankiConnected && subject.deck) {
        const due = await srs.findCards({ deck: subject.deck, state: 'due', excludeSuspended: true, excludeBuried: true })
        // extra: siblings of one note are cut below (onePerNote)
        infos = onePerNote(await infoOf(shuffle(due).slice(0, CALL_CARDS * 3), () => true, Infinity)).slice(0, CALL_CARDS)
        if (!infos.length) { // nothing due: a practice call over cards already learned
          // Scan the shuffled deck until enough LEARNED cards turn up: a fixed sample of the whole deck held only new
          // cards in a mostly-new deck, and the call said "no cards to talk about" with reviewed cards right there.
          const all = shuffle(await srs.findCards({ deck: subject.deck, excludeSuspended: true })).slice(0, PRACTICE_SCAN_MAX)
          infos = onePerNote(await infoOf(all, (c) => Number(c.type) >= 2, CALL_CARDS * 4))
          // A practice call prefers cards no other activity practiced lately.
          infos = rankFresh(infos, await readPracticeLog(ctx), { labelOf: (c) => ctx.cards.noteText(c).front }).slice(0, CALL_CARDS)
          isPractice = true
        }
      }
      const tg = infos.map((c) => ({ cardId: c.cardId, ...ctx.cards.noteText(c) })).filter((x) => x.front)
      if (!tg.length) throw new Error(t('call_noCards'))
      preRef.current = new Map(infos.map((c) => [c.cardId, { interval: c.interval, factor: c.factor }]))
      callIdRef.current = `call-${Date.now()}`
      setTargets(tg); setPractice(isPractice); setGrades({}); setMessages([])
      setPhase('call')
    } catch (e) { setError(String(e.message || e)); setPhase('intro') }
  }

  const send = async (spoken) => {
    speakingRef.current?.stop()
    const text = (typeof spoken === 'string' ? spoken : input).trim()
    // phase: a spoken answer still being transcribed when the learner pressed End landed in the review and added grades.
    if (!text || busy || phase !== 'call') return
    const history = [...messages, { role: 'me', text }]
    setMessages(history); setInput(''); setBusy(true); setError('')
    ctx.emit(EVENTS.CHAT_SENT, { mode: subject.modeId })
    try { land(await say(history, grades), history, grades) } catch (e) { setError(String(e.message || e)) } finally { setBusy(false) }
  }

  const save = async () => {
    const ratings = ratingsFrom(targets, grades)
    if (practice || !ratings.length) { finish(0); return }
    setPhase('saving')
    settledRef.current = true // leaving while this saves must not save again on unmount
    try {
      const r = await recordCall({ callId: callIdRef.current, deck: callDeckRef.current || subject.deck, ratings, preSchedule: preRef.current })
      finish(r.recorded.length, r.failed.length)
    } catch (e) {
      settledRef.current = false
      if (!aliveRef.current) { ctx.notify(tCount(t, 'call_failed', ratings.length)); return } // left while saving: say so
      setError(String(e.message || e)); setPhase('review')
    }
  }
  const finish = (n, failed = 0) => {
    settledRef.current = true
    announceCall({ ctx, t, subject, targets, grades, messages }, n)
    setResult({ n, failed }); setPhase('done')
  }

  const chips = (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {targets.map((tg) => {
        const g = grades[String(tg.cardId)]
        const col = g ? VERDICT_COLOR[g.verdict] : C.border
        return (
          <span key={tg.cardId} className={g?.why ? 'tip' : undefined} data-tip={g?.why || undefined} style={{
            fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: RADIUS.pill, border: `2px solid ${col}`,
            color: g ? C.white : C.inkDim, background: g ? col : 'transparent',
          }}>{g ? '✓ ' : ''}{phase === 'call' && !g ? '?' : tg.front}</span>
        )
      })}
    </div>
  )

  if (phase === 'intro' || phase === 'loading') {
    return (
      <div>
        <button onClick={onExit} style={{ border: 'none', background: 'transparent', color: C.inkDim, fontWeight: 800, cursor: 'pointer', marginBottom: 12, fontSize: 13 }}>← {t('call_back')}</button>
        <EbiSays pose={poseFile('singer')}>{subject.isLanguage ? t('call_introLang', { lang: subject.learnLang }) : t('call_introGeneral')}</EbiSays>
        <div style={{ fontSize: 13, color: C.inkDim, margin: '14px 0', lineHeight: 1.5 }}>{t('call_how')}</div>
        {block && (
          <div style={{ color: C.warning, fontSize: 13, marginBottom: 10 }}>
            {studyBlockText(t, block)}
            {ctx.study?.open && <button onClick={() => ctx.study.open()} style={{ marginLeft: 8, border: 'none', background: 'transparent', color: C.brand, fontWeight: 800, cursor: 'pointer', fontSize: 13, padding: 0 }}>{t('call_openStudy')}</button>}
          </div>
        )}
        {!ai.hasKey && <div style={{ color: C.warning, fontSize: 13, marginBottom: 10 }}>{t('call_needKey')}</div>}
        {!ctx.ankiConnected && <div style={{ color: C.warning, fontSize: 13, marginBottom: 10 }}>{t('call_needAnki')}</div>}
        {error && <div style={{ color: C.danger, fontSize: 13, marginBottom: 10 }}>{error}</div>}
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: C.ink, marginBottom: 16, cursor: 'pointer' }}>
          <input type="checkbox" checked={readAloud} onChange={(e) => { setReadAloud(e.target.checked); platform.kv.set(READ_ALOUD_KEY, e.target.checked ? '1' : '0') }} style={{ accentColor: C.brand }} />
          🔊 {t('call_readAloud')}
        </label>
        <ChunkyButton onClick={start} disabled={phase === 'loading' || !ai.hasKey || !!block || !ctx.ankiConnected} color={C.success}>
          📞 {phase === 'loading' ? t('call_connecting') : t('call_start')}
        </ChunkyButton>
      </div>
    )
  }

  if (phase === 'review' || phase === 'saving') {
    const graded = targets.filter((tg) => grades[String(tg.cardId)])
    return (
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <EbiSays pose={poseFile('happy')}>{practice ? t('call_reviewPractice') : graded.length ? tCount(t, 'call_reviewIntro', graded.length) : t('call_reviewNone')}</EbiSays>
        <div style={{ display: 'grid', gap: 8, margin: '16px 0' }}>
          {graded.map((tg) => {
            const g = grades[String(tg.cardId)]
            return (
              <div key={tg.cardId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: RADIUS.md, border: `1px solid ${C.border}` }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, color: C.ink }}>{tg.front}</div>
                  {g.why && <div style={{ fontSize: 12.5, color: C.inkDim }}>{g.why}</div>}
                </div>
                {!practice && VERDICTS.map((v) => (
                  // Locked while saving: the reviews already sent are what Anki gets.
                  <button key={v} disabled={phase === 'saving'} onClick={() => setGrades((s) => ({ ...s, [String(tg.cardId)]: { ...g, verdict: v } }))} className={g.verdict === v ? 'ui-tab-current' : undefined}
                    style={{ padding: '4px 10px', borderRadius: RADIUS.sm, fontSize: 12, fontWeight: 800, cursor: g.verdict === v || phase === 'saving' ? 'default' : 'pointer', opacity: phase === 'saving' && g.verdict !== v ? 0.5 : 1,
                      border: `2px solid ${VERDICT_COLOR[v]}`, background: g.verdict === v ? VERDICT_COLOR[v] : 'transparent', color: g.verdict === v ? C.white : VERDICT_COLOR[v] }}>
                    {t(`call_v_${v}`)}
                  </button>
                ))}
              </div>
            )
          })}
        </div>
        {error && <div style={{ color: C.danger, fontSize: 13, marginBottom: 10 }}>{error}</div>}
        <ChunkyButton onClick={save} disabled={phase === 'saving'} color={C.success}>
          {phase === 'saving' ? t('call_saving') : practice || !graded.length ? t('call_finish') : tCount(t, 'call_save', graded.length)}
        </ChunkyButton>
      </div>
    )
  }

  if (phase === 'done') {
    return (
      <div style={{ maxWidth: 520, margin: '40px auto', textAlign: 'center' }}>
        <img src={shrimpUrl(poseFile('party'))} alt="" width={120} />
        <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 24, color: C.ink, margin: '10px 0' }}>
          {result?.n ? tCount(t, 'call_saved', result.n) : t('call_doneNoSave')}
        </div>
        {result?.failed > 0 && <div style={{ color: C.danger, fontSize: 13, marginBottom: 10 }}>{tCount(t, 'call_failed', result.failed)}</div>}
        <ChunkyButton onClick={onExit} color={C.success}>{t('call_back')}</ChunkyButton>
      </div>
    )
  }

  // The call itself.
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 420, gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <img src={shrimpUrl(poseFile('singer'))} alt="" width={48} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 18, color: C.ink }}>{practice ? t('call_practiceTitle') : t('call_title')}</div>
          {chips}
        </div>
        <ChunkyButton onClick={() => { speakingRef.current?.stop(); setPhase('review') }} color={C.danger} disabled={busy}>{t('call_end')}</ChunkyButton>
      </div>
      <div ref={listRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, padding: 4 }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === 'me' ? 'flex-end' : 'flex-start', maxWidth: '80%', padding: '10px 14px', borderRadius: RADIUS.lg,
            background: m.role === 'me' ? C.brandTint : C.surface, border: `1px solid ${m.role === 'me' ? C.brandRing : C.border}`,
            color: C.ink, fontSize: 15, lineHeight: 1.45, whiteSpace: 'pre-wrap',
          }}>{m.text}</div>
        ))}
        {busy && <div style={{ color: C.inkFaint, fontSize: 14 }}>{t('call_typing')}</div>}
      </div>
      {error && <div style={{ color: C.danger, fontSize: 13 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        {voiceOn && <TalkButton ctx={ctx} lang={subject.isLanguage ? subject.learnLangIso : ''} onText={send} onStart={() => speakingRef.current?.stop()} disabled={busy} compact />}
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t('call_placeholder')}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent?.isComposing) send() }}
          style={{ flex: 1, padding: '12px 14px', fontSize: 15, borderRadius: RADIUS.md, border: `1px solid ${C.border}`, background: C.surfaceAlt, color: C.ink }} />
        <button onClick={send} disabled={busy || !input.trim()} className="btn-press" style={{
          padding: '0 18px', borderRadius: RADIUS.md, ...depthBorder(C.success), background: C.success, color: C.white,
          fontWeight: 800, cursor: busy || !input.trim() ? 'default' : 'pointer', opacity: busy || !input.trim() ? 0.5 : 1,
        }}>{t('call_send')}</button>
      </div>
    </div>
  )
}
