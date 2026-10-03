// A RAID: today's raid boss made of the deck's DUE cards, one question per card, fought with the Legends rules
// (fight.js) but harder (raid.js: health from the cards due, 3 lives, 3 phases, choices only in phase 1). Every
// card's FIRST answer is recorded in Anki as a real review (Good, Hard or Again; never Easy), whether the fight is
// won, lost or left early. The boss keeps its wounds for the rest of the day.
// THE AFTERMATH (design v2.1, change 1): a fight often ends before every picked card was asked (the boss fell, the
// hearts ran out). The cards not yet asked then continue as a short review with no fight math (no abilities, attacks
// or lives), each first answer recorded in Anki through the same recordReviews guards; "Finish later" leaves them due.
import { useEffect, useRef, useState } from 'react'
import { C, FONT, RADIUS } from '../../config/tokens'
import { poseFile } from '../../config/shrimp'
import { srs } from '../../cards'
import { EVENTS } from '../events'
import { featureCfg } from '../registry'
import { ChunkyButton, EbiSays, Card, tCount } from '../ui'
import { QuizRunner, judgeStrike, recordReviews, recordPractice } from '../kit'
import LearnItPanel from '../kit/LearnItPanel'
import { useFightCheck, useBossTaunt, TauntBubble, FightNotice, MissTools, Debrief, expectedOf, isWrongish } from './FightExtras'
import { RAID_VOICES } from './raidVoices'
import { learnerLevelLine } from '../kit/learnerStore'
import { BossIntro, BossArena, BossEnd } from './BossArena'
import { LegendsArt } from './art'
import { newFight, act, settleFight, phaseOf, raidRating, attackLivesFor, abilityState, refundFor, applyRefund, strikeCost, fightOutcome } from './fight'
import { RAID, RAID_MOTIFS, RAID_ABILITY, todayKey, raidToday, applyRaidAttempt, raidOrder, shapeRaid, raidStep, raidMotif, isRaidMotif } from './raid'
import { abilityById } from './abilities'
import { buildRaidPrompt, parseQuestions, RAID_ROLE, RAID_MAX_TOKENS } from './prompt'
import { readRaid, updateRaid, LEGENDS_ID } from './store'

const INFO_BATCH = 40
const GUARD_KEY = 'ebiki-raid-guards'

export default function RaidRun({ ctx, onExit }) {
  const { t, ai, subject } = ctx
  const modeId = subject.modeId
  const deck = subject.modeDeck || subject.deck
  // The deck the raid's cards came from: its reviews are saved THERE even if the header deck changes mid-raid
  // (saved to the new deck, every card missed Anki's reviewer and fell to a hand-made interval).
  const deckRef = useRef('')
  const focus = featureCfg(ctx, LEGENDS_ID).focus === true
  const tauntsOn = featureCfg(ctx, LEGENDS_ID).taunts !== false && !focus // off in focus mode
  const [phase, setPhase] = useState('loading') // loading | none | intro | fight | aftermath | saving | done | error
  const [afterQs, setAfterQs] = useState(null) // the Aftermath: the picked cards the fight never asked
  // Changes whenever QuizRunner shows a new question: an ability effect still playing fast-fades (BossArena).
  const [questionKey, setQuestionKey] = useState(0)
  const [error, setError] = useState('')
  const [raid, setRaid] = useState(null) // today's state (raid.js)
  const [questions, setQuestions] = useState(null)
  const [fs, setFs] = useState(newFight)
  const fsRef = useRef(fs)
  const pos = useRef(-1)
  const cardsRef = useRef([]) // [{ cardId, front, back }]
  const preRef = useRef(new Map())
  const firstHit = useRef(new Map()) // cardId -> the first answer's hit (what Anki records)
  // Questions waiting to go into the run: raidStep may ask for more than one group at once, QuizRunner takes one group
  // per answer, so the rest wait for the next answers.
  const pendingRef = useRef([])
  // The ability toggles armed for the coming answer (a Berserker swing...): cleared after every answer.
  const [armed, setArmedState] = useState({})
  const armedRef = useRef({})
  const setArmed = (v) => { armedRef.current = v; setArmedState(v) }
  const runId = useRef(`raid-${Date.now()}`).current
  const saved = useRef(false)
  const [summary, setSummary] = useState(null)
  const alive = useRef(true)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])

  // The day the raid STARTED: a fight finishing after midnight is saved against the day it was fought (a new day
  // started at full health and turned the win into a retreat).
  const dateRef = useRef(todayKey())
  const date = dateRef.current
  const qCountRef = useRef(0) // the questions really asked: today's health comes from them
  const day = raid?.day
  const need = day ? Math.max(1, day.hp - day.damage) : 1 // what is left of today's health
  const motif = raid ? raidMotif(raid) : RAID_MOTIFS[0]
  const bossName = t(`lg_raidBoss_${motif}`)
  const ability = RAID_ABILITY[motif] || ''
  const abMod = abilityById(ability)
  const area = { id: `raid-${motif}`, title: t('lg_raidTitle'), motif, palette: 'night' }
  const phaseRef = useRef(phase)
  phaseRef.current = phase
  const fightOver = useRef(null) // { need, lives } of the running fight, for a refund landing between renders
  // ANKI after the fight: a second look that lands once the reviews were sent fixes the card's grade with a follow-up
  // review (srs.correctRating, once per card); before that it simply changes the first answer that will be recorded.
  const ratingsBuilt = useRef(false)
  const recordsDone = useRef(false)
  const recordedRef = useRef(new Set())
  const correctedRef = useRef(new Set())
  const pendingFix = useRef([])
  const correctCard = async (cardId, hit) => {
    if (!recordedRef.current.has(cardId) || correctedRef.current.has(cardId)) return
    correctedRef.current.add(cardId)
    const pre = preRef.current.get(cardId)
    try { await srs.correctRating({ cardId, ease: raidRating(hit, pre).ease, preSchedule: pre }) } catch { correctedRef.current.delete(cardId) }
  }
  // A miss or glancing answer was right after all (the re-check or an appeal).
  const onOverturn = (e, to) => {
    const cardId = e.cardId
    const first = cardId != null ? firstHit.current.get(cardId) : null
    if (first && first.aid === e.aid) {
      const hit = { ...first, verdict: to }
      firstHit.current.set(cardId, hit)
      if (ratingsBuilt.current) { if (recordsDone.current) correctCard(cardId, hit); else pendingFix.current.push([cardId, hit]) }
    }
    // The fight gives back what the verdict cost, only while it still runs (after the fight a won appeal fixes the
    // grade, never the outcome).
    const o = fightOver.current
    if (phaseRef.current !== 'fight' || !o || e.kind === 'aftermath') return false
    const cur = fsRef.current
    if (fightOutcome(cur, o)) return false
    const r = refundFor({ kind: e.kind, to, mode: e.mode }, e.cost || {})
    if (!r.lives && !r.damage) return false
    const next = applyRefund(cur, { ...r, from: e.first, to, kind: e.kind })
    fsRef.current = next
    setFs(next)
    return true
  }
  const isOver = () => phaseRef.current !== 'fight' || !fightOver.current || !!fightOutcome(fsRef.current, fightOver.current)
  const fc = useFightCheck(ctx, { onOverturn, isOver })
  const voice = RAID_VOICES[motif] || null
  const taunt = useBossTaunt(ctx, { bossKey: `raid:${motif}`, voice: voice?.voice || '', sample: voice?.sample || '', bossName, enabled: tauntsOn })
  const [learn, setLearn] = useState(null) // the Learn-it panel's item (the fight waits under it)
  const openLearn = (e) => {
    const card = cardsRef.current.find((c) => c.cardId === e.q?._cardId)
    setLearn(card ? { front: card.front, back: card.back, noteId: card.noteId } : { front: e.q?.prompt || '', back: expectedOf(e.q) })
  }
  const learnPanel = learn && <LearnItPanel ctx={ctx} item={learn} onClose={() => setLearn(null)} closeLabel={phase === 'fight' ? t('lg_learnBackToFight') : undefined} />
  const missTools = (q) => {
    const e = fc.entryFor(q)
    return e && isWrongish(e.first) ? <MissTools ctx={ctx} entry={e} onAppeal={fc.appeal} onLearn={() => openLearn(e)} /> : null
  }

  const load = async () => {
    setPhase('loading'); setError('')
    try {
      if (!ai.hasKey) throw new Error(t('lg_raidNoKey'))
      if (ctx.ankiConnected === false || !deck) throw new Error(t('lg_noDeck'))
      // Never during a study session: its pending ratings and the raid's reviews would answer the same due card twice,
      // and two loops driving Anki's one reviewer at once could rate the wrong card.
      if (ctx.studyActive) throw new Error(t('call_studyActive'))
      deckRef.current = deck
      const ids = await srs.findCards({ deck, state: 'due', excludeSuspended: true, excludeBuried: true })
      const infos = []
      for (let i = 0; i < ids.length && infos.length < 200; i += INFO_BATCH) infos.push(...((await srs.cardsInfo(ids.slice(i, i + INFO_BATCH))) || []))
      // One card per note (reversed siblings read the same), in Anki's order, capped.
      const seenNotes = new Set()
      const picked = raidOrder(infos).filter((c) => (seenNotes.has(c.note) ? false : (seenNotes.add(c.note), true))).slice(0, RAID.maxCards)
      const r = await readRaid(modeId)
      if (!r.ok) throw new Error(t('lg_errSave'))
      const today = raidToday(r.value, date, picked.length)
      if (!alive.current) return
      setRaid(today)
      if (today.day.won) { setPhase('beaten'); return }
      if (picked.length < RAID.minCards) { setPhase('none'); return }
      const cards = picked.map((c) => ({ cardId: c.cardId, noteId: c.note, ...ctx.cards.noteText(c) })).filter((c) => c.front)
      cardsRef.current = cards
      preRef.current = new Map(picked.map((c) => [c.cardId, { interval: c.interval, factor: c.factor }]))
      const level = await learnerLevelLine(ctx)
      const { system, user } = buildRaidPrompt(subject, cards, { level })
      const raw = ai.json(await ai.call(system, user, { role: RAID_ROLE, maxTokens: RAID_MAX_TOKENS }))
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.questions) ? raw.questions : []
      const qs = []
      const used = new Set()
      for (const q of list) {
        const i = Number(q?.card) - 1
        const card = cards[i]
        if (!card || used.has(card.cardId)) continue
        const [one] = parseQuestions([q], ai.clean, { speakLang: subject.learnLangIso, dual: true })
        if (!one) continue
        used.add(card.cardId)
        qs.push({ ...one, _cardId: card.cardId, target: card.front })
      }
      if (qs.length < Math.min(RAID.minCards, cards.length)) throw new Error(t('lg_errQuiz'))
      if (!alive.current) return
      // Health from the questions the fight really has (fewer than the cards when some could not be asked): from the
      // cards picked, a perfect run could fall short of the health and the raid was unwinnable.
      qCountRef.current = qs.length
      setRaid(raidToday(r.value, date, qs.length))
      setQuestions(qs)
      setPhase('intro')
    } catch (e) { if (alive.current) { setError(String(e.message || e)); setPhase('error') } }
  }
  const started = useRef(false)
  useEffect(() => { if (!started.current) { started.current = true; load() } }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Record every card answered so far (first answers only), then the day's wounds. Runs once per raid.
  const save = async () => {
    if (saved.current) return
    saved.current = true
    if (alive.current) setPhase('saving')
    // An ability holding damage (a bank, a gauge, moons in orbit) lets it go when the fight ends (abilities: settle).
    const dayNow = raid?.day
    // Re-checks and appeals still running decide the grades first (bounded: the reviews are never lost to a slow reply).
    await fc.settle()
    ratingsBuilt.current = true
    const st = settleFight(fsRef.current, { ability, need: dayNow ? Math.max(1, dayNow.hp - dayNow.damage) : 1, lives: RAID.lives, bar: { total: dayNow ? dayNow.hp : 1, before: dayNow ? dayNow.damage : 0, phases: RAID.phases }, dayAb: dayNow?.ab || null })
    fsRef.current = st
    const ratings = [...firstHit.current.entries()].map(([cardId, hit]) => {
      const r = raidRating(hit, preRef.current.get(cardId)) // the card's interval decides Easy (mature) vs Good
      return { cardId, ease: r.ease, rating: r.rating, front: cardsRef.current.find((c) => c.cardId === cardId)?.front || '' }
    })
    let recorded = 0, failed = 0
    let recordedIds = new Set()
    if (ratings.length) {
      try { const r = await recordReviews({ guardKey: GUARD_KEY, runId, deck: deckRef.current || deck, ratings, preSchedule: preRef.current }); recordedIds = new Set(r.recorded); recorded = r.recorded.length; failed = r.failed.length } catch { failed = ratings.length }
    }
    recordedRef.current = recordedIds
    recordsDone.current = true
    // A second look that landed while the reviews were being sent: its card gets the corrected grade now.
    for (const [cardId, hit] of pendingFix.current.splice(0)) correctCard(cardId, hit)
    // Card XP and mistakes only for the cards Anki really recorded: an unrecorded card stays due, and the next raid
    // today would have paid and logged it again.
    for (const [cardId, hit] of firstHit.current) {
      if (!recordedIds.has(cardId)) continue
      const c = cardsRef.current.find((x) => x.cardId === cardId)
      ctx.emit(EVENTS.CARD_GRADED, { correct: hit.verdict !== 'miss', grade: raidRating(hit, preRef.current.get(cardId)).rating, mode: modeId, front: c?.front || '', back: c?.back || '', cardId, misses: hit.verdict === 'miss' ? [{ question: hit.q?.prompt || '', answer: hit.answer || '', expected: (hit.q?.accepted || [])[0] || '' }] : [] })
    }
    let outcome = { won: false, firstWin: false }
    const next = await updateRaid(modeId, (cur) => { const res = applyRaidAttempt(raidToday(cur, date, qCountRef.current || cardsRef.current.length), date, st.damage, abMod?.dayState ? abMod.dayState(st) : undefined); outcome = res; return res.state })
    const answered = firstHit.current.size
    ctx.emit(EVENTS.PRACTICE_DONE, { source: `${LEGENDS_ID}-raid`, mode: modeId, total: answered, correct: [...firstHit.current.values()].filter((h) => h.verdict !== 'miss').length })
    if (outcome.firstWin && next !== undefined) ctx.emit(EVENTS.BOSS_BEATEN, { mode: modeId, area: 0, raid: true })
    recordPractice(ctx, LEGENDS_ID, cardsRef.current.filter((c) => firstHit.current.has(c.cardId)).map((c) => ({ kind: 'card', label: c.front })))
    if (!alive.current) return
    if (next) setRaid(next)
    setSummary({ recorded, failed, won: outcome.won, firstWin: outcome.firstWin, damage: st.damage, saveFailed: next === undefined })
    setPhase('done')
  }
  // Leaving by the sidebar, the Practice hub or a mode switch unmounts the raid: what was answered is still saved.
  const saveRef = useRef(save)
  saveRef.current = save
  useEffect(() => () => { if (firstHit.current.size && !saved.current) saveRef.current() }, [])
  // Leaving mid-fight still records what was answered (the reviews happened).
  const leave = async () => {
    // QuizRunner already asked "quit?"; the answers given so far are still recorded.
    if ((phase === 'fight' || phase === 'aftermath') && firstHit.current.size && !saved.current) { await save(); return }
    onExit?.()
  }
  // The fight is over (won or lost): the cards it never asked go to the Aftermath, else straight to the result.
  const endFight = () => {
    const rest = (questions || []).filter((q) => q._cardId != null && !firstHit.current.has(q._cardId))
    if (!rest.length) { save(); return }
    setAfterQs(rest.map((q) => ({ ...q, _aftermath: true })))
    setPhase('aftermath')
  }
  // An Aftermath answer: recorded as the card's first answer, nothing else (no fight math).
  const recordAfter = (q, correct, answer, info = {}) => {
    if (q._retry || q._cardId == null || firstHit.current.has(q._cardId)) return null
    const verdict = info.verdict || (correct ? 'clean' : 'miss')
    const aid = info.aid || fc.open(q, answer, 'typed', { verdict })
    firstHit.current.set(q._cardId, { verdict, mode: 'typed', attack: false, lastStand: false, key: q._cardId, q, answer, aid })
    fc.attach(aid, { cost: {}, kind: 'aftermath', cardId: q._cardId })
    return null
  }

  if (phase === 'loading') return <div style={{ maxWidth: 560, margin: '60px auto' }}><EbiSays pose={poseFile('weapon')}>{t('lg_raidLoading')}</EbiSays></div>
  if (phase === 'error' || phase === 'none' || phase === 'beaten') {
    const text = phase === 'error' ? error : phase === 'none' ? t('lg_raidTooFew', { n: RAID.minCards }) : t('lg_raidBeatenToday')
    return (
      <div style={{ maxWidth: 560, margin: '40px auto', display: 'grid', gap: 14 }}>
        <EbiSays pose={poseFile(phase === 'beaten' ? 'party' : 'confused')}>{text}</EbiSays>
        <Trophies ctx={ctx} raid={raid} />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <ChunkyButton variant="ghost" color={C.inkDim} onClick={onExit}>{t('lg_back')}</ChunkyButton>
          {phase === 'error' && <ChunkyButton color={C.success} onClick={load}>{t('lg_retry')}</ChunkyButton>}
        </div>
      </div>
    )
  }
  if (phase === 'intro') {
    return (
      <div style={{ display: 'grid', gap: 8 }}>
        <BossIntro t={t} area={area} name={bossName} total={questions.length} kind="raids" raidLives={RAID.lives} ability={ability} calm={focus} onFight={() => setPhase('fight')} />
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', fontSize: 13.5, color: C.inkDim, lineHeight: 1.5 }}>
          {t('lg_raidRules', { n: questions.length, lives: RAID.lives })}{day?.damage ? ` ${t('lg_raidWounded', { hp: day.hp - day.damage, max: day.hp })}` : ''}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}><ChunkyButton variant="ghost" color={C.inkDim} onClick={onExit}>{t('lg_back')}</ChunkyButton></div>
      </div>
    )
  }
  if (phase === 'saving') return <div style={{ maxWidth: 560, margin: '60px auto' }}><EbiSays pose={poseFile('work')}>{t('lg_raidSaving')}</EbiSays></div>
  if (phase === 'done' && summary) {
    return (
      <div style={{ maxWidth: 600, margin: '24px auto', display: 'grid', gap: 14, justifyItems: 'center', textAlign: 'center' }}>
        <LegendsArt kind="raids" motif={motif} palette="night" height={120} width={120} round={0} room animated={summary.won ? false : 'idle'} style={summary.won ? { filter: 'grayscale(.6) opacity(.7)', transform: 'rotate(-8deg)' } : undefined} />
        <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 28, color: summary.won ? C.success : C.warning }}>{summary.won ? `🏆 ${t('lg_raidWon', { name: bossName })}` : t('lg_raidRetreat')}</div>
        {summary.firstWin && <div style={{ fontWeight: 800, color: C.info }}>❄ {t('lg_bossFreeze')} · 🏆 {t('lg_raidTrophy')}</div>}
        {!summary.won && raid?.day && <div style={{ fontWeight: 800, color: C.inkDim }}>{t('lg_raidWounded', { hp: Math.max(0, raid.day.hp - raid.day.damage), max: raid.day.hp })}</div>}
        <div style={{ fontSize: 14.5, fontWeight: 800, color: summary.failed ? C.danger : C.success }}>
          {summary.failed ? tCount(t, 'lg_raidRecordFailed', summary.failed) : tCount(t, 'lg_raidRecorded', summary.recorded)}
        </div>
        {summary.saveFailed && <div style={{ color: C.danger, fontWeight: 800 }}>{t('lg_errSave')}</div>}
        <Debrief ctx={ctx} fc={fc} onLearn={openLearn} expectedOf={expectedOf} />
        <Trophies ctx={ctx} raid={raid} />
        {learnPanel}
        <ChunkyButton color={C.success} onClick={onExit}>{t('lg_back')}</ChunkyButton>
      </div>
    )
  }

  // ── The fight (and its Aftermath) ──
  const lives = RAID.lives
  const o = { need, lives }
  const outcome = fs.damage >= need ? 'won' : fs.livesLost >= lives ? 'lost' : ''
  // The bar and the phases follow the whole day's health: earlier attempts' wounds are already dealt.
  const dayHp = day ? day.hp : need
  const shown = { ...fs, damage: fs.damage + (day ? day.damage : 0) }
  const fightPhase = phaseOf(Math.max(0, dayHp - shown.damage), dayHp, RAID.phases)
  const bar = { total: dayHp, before: day ? day.damage : 0, phases: RAID.phases }
  const fightOpts = { ability, need, lives, bar, dayAb: day?.ab || null }
  fightOver.current = { need, lives }
  const record = (q, correct, answer, info = {}) => {
    pos.current = Number.isInteger(info.at) ? info.at : pos.current + 1
    if (q._retry) return null
    taunt.onAnswer()
    const before = fsRef.current
    const verdict = info.verdict || (correct ? 'clean' : 'miss')
    const mode = info.mode === 'choice' ? 'choice' : 'typed'
    const aid = info.aid || fc.open(q, answer, mode, { verdict })
    const kind = q._attack ? 'attack' : (q._inserted || q._lastStand) ? 'inserted' : 'normal'
    if (before.damage >= need || before.livesLost >= lives) { fc.attach(aid, { cost: {}, kind, mode, cardId: q._cardId }); return null }
    // Only a card's FIRST answer to its own question is recorded (never an attack or an ability's inserted question).
    if (!q._attack && !q._inserted && !q._lastStand && q._cardId != null && !firstHit.current.has(q._cardId)) {
      firstHit.current.set(q._cardId, { verdict, mode, attack: false, lastStand: false, key: q._cardId, q, answer, aid })
    }
    if (verdict === 'miss' && !info.skipped) taunt.onMiss(q, answer, expectedOf(q))
    const armedNow = armedRef.current
    if (Object.keys(armedNow).length) setArmed({})
    const { next, groups } = raidStep(before, q, { verdict, mode, attackQ: info.attackQ, aid }, {
      ability, need, lives, dayHp, dayBefore: day ? day.damage : 0, dayAb: day?.ab || null, pos: pos.current, questions, armed: Object.keys(armedNow).length ? armedNow : null,
    })
    fsRef.current = next
    setFs(next)
    fc.attach(aid, { cost: strikeCost(before, next), kind, mode, cardId: q._cardId })
    pendingRef.current.push(...groups)
    const g = pendingRef.current.shift()
    return g ? { insert: g.insert, at: g.at } : null
  }
  // An ability's button between questions (Vent, Buy...): applied at once, never costs a life.
  const press = (a) => {
    if (a.toggle) { setArmed({ ...armedRef.current, [a.id]: !armedRef.current[a.id] }); return }
    const before = fsRef.current
    if (before.damage >= need || before.livesLost >= lives) return
    const next = act(before, { type: a.id }, fightOpts)
    if (next === before) return
    fsRef.current = next
    setFs(next)
  }
  const judge = async (q, ans) => {
    const j = await judgeStrike(ai, subject, q, ans, { strictAccents: !subject.accents || subject.strictAccents !== false })
    if (j.verdict === 'error') return { error: true } // could not be checked: QuizRunner asks to try again
    // The verdict lands at once; the note (and a glancing slip's follow-up) arrive later, and a miss or glancing
    // verdict is looked at again in the background (useFightCheck).
    const aid = fc.open(q, ans, 'typed', j)
    const attackQ = q._aftermath ? null : j.attack || (j.fixLater ? { pending: aid } : null)
    return {
      correct: j.verdict !== 'miss', partial: j.verdict === 'glancing', note: j.note || '', accent: !!j.accent && j.verdict !== 'miss',
      title: q._aftermath ? '' : j.verdict === 'clean' ? t('lg_strikeClean') : j.verdict === 'glancing' ? t('lg_strikeGlancing') : '',
      info: { verdict: j.verdict, attackQ, aid }, later: j.later,
    }
  }
  // The ability's view of the fight, for its hint, banner and buttons (abilities/<motif>.js).
  const abCtx = { phase: fightPhase, need, lives, livesLeft: lives - fs.livesLost, damage: fs.damage, bar, dayAb: day?.ab || null, K: abMod?.K || {} }
  const abS = abMod ? { ...fs, ab: abilityState(fs, abMod, abCtx) } : fs
  // One line under the strike label when the boss's ability applies to THIS question.
  const abilityHint = (q, mode) => {
    const h = abMod?.hint?.(abS, q, mode, { ...abCtx, mode, q })
    return h ? `${h.icon ? `${h.icon} ` : ''}${t(h.key || `lg_hint_${ability}`, h.vars || {})}` : ''
  }
  const TONE = { purple: C.purple, danger: C.danger, warning: C.warning, success: C.success, info: C.info, brand: C.brand, ink: C.inkDim }
  const attackCost = attackLivesFor(ability, fs)
  const reask = (q) => !!(q._attack || q._inserted || q._lastStand)
  // The compact per-question tag (a verdict, a facet color, a gaze): icon + at most 3 words, in the header's corner.
  const tagChip = (q, mode) => {
    const g = abMod?.tag?.(abS, q, { ...abCtx, mode, q })
    if (!g || !g.key) return null
    const col = TONE[g.tone] || C.purple
    return <span data-ability-tag="" style={{ marginLeft: 'auto', whiteSpace: 'nowrap', fontSize: 12, fontWeight: 900, color: col, border: `1.5px solid color-mix(in srgb, ${col} 50%, transparent)`, background: `color-mix(in srgb, ${col} 10%, ${C.surface})`, borderRadius: RADIUS.pill, padding: '1px 9px' }}>{g.icon ? `${g.icon} ` : ''}{t(g.key, g.vars || {})}</span>
  }
  const header = (q, mode) => (
    <div style={{ display: 'grid', gap: 6 }}>
      {(() => {
        // The ability's banner for this question (a last stand, a gaze, a minion...).
        const b = abMod?.banner?.(abS, q, { ...abCtx, mode, q })
        if (!b) return null
        const col = TONE[b.tone] || C.purple
        return <div role="alert" style={{ padding: '8px 12px', borderRadius: RADIUS.md, background: `color-mix(in srgb, ${col} 14%, ${C.surface})`, border: `2px solid ${col}`, color: col, fontWeight: 900, fontSize: 14 }}>{b.icon ? `${b.icon} ` : ''}{t(b.key, b.vars || {})}</div>
      })()}
      {q._attack && <div role="alert" style={{ padding: '8px 12px', borderRadius: RADIUS.md, background: `color-mix(in srgb, ${C.danger} 14%, ${C.surface})`, border: `2px solid ${C.danger}`, color: C.danger, fontWeight: 900, fontSize: 14 }}>⚔️ {t(attackCost === 1 ? 'lg_attackIncomingOne' : 'lg_attackIncoming', { n: attackCost })}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: mode === 'choice' ? C.info : C.warning }}>
          {mode === 'choice' ? `🛡 ${t('lg_strikeSafeHint')}` : `💥 ${t('lg_strikePowerHint')}`}{fightPhase > 1 ? ` · 😡 ${t('lg_rageNoSafe')}` : ''}
        </div>
        {tagChip(q, mode)}
      </div>
      {abilityHint(q, mode) && <div style={{ fontSize: 12, fontWeight: 800, color: C.purple }}>{abilityHint(q, mode)}</div>}
    </div>
  )
  // The ability's buttons beside Skip while a question waits (abilities: actions/act). A toggle arms itself for the
  // coming answer; any other button acts at once. Only a `decision: true` module has buttons (the attention budget),
  // and never on an attack or an inserted question.
  const tools = (q, api) => {
    if (reask(q)) return null
    const list = (abMod?.actions?.(abS, { ...abCtx, mode: api.asChoice ? 'choice' : 'typed', q, armed }) || []).filter(Boolean)
    if (!list.length) return null
    return list.map((a) => {
      const col = TONE[a.tone] || C.purple
      const on = !!(a.toggle && (a.on ?? armed[a.id]))
      return (
        <ChunkyButton key={a.id} variant={on ? undefined : 'ghost'} color={col}
          disabled={api.phase !== 'answer' || a.enabled === false} onClick={() => press(a)} style={{ fontSize: 13, padding: '7px 12px' }}>
          {a.icon ? `${a.icon} ` : ''}{t(a.labelKey, a.vars || {})}
        </ChunkyButton>
      )
    })
  }
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ maxWidth: 680, width: '100%', margin: '0 auto', position: 'sticky', top: 0, zIndex: 5, paddingTop: 4, background: C.bg }}>
        <BossArena t={t} area={area} name={bossName} need={dayHp} lives={lives} state={shown} phases={RAID.phases} ability={ability} dayAb={day?.ab || null} focus={focus} getZoom={ctx.getZoom} kind="raids" questionKey={questionKey} />
        {phase === 'fight' && <TauntBubble bubble={taunt.bubble} name={bossName} calm={focus} />}
        <FightNotice notice={fc.notice} t={t} />
      </div>
      {learnPanel}
      {phase === 'aftermath' && afterQs ? (
        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ maxWidth: 640, width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', boxSizing: 'border-box', padding: '10px 14px', borderRadius: RADIUS.md, border: `2px solid color-mix(in srgb, ${C.info} 45%, ${C.border})`, background: `color-mix(in srgb, ${C.info} 8%, ${C.surface})` }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 17, color: C.ink }}>🌙 {t('lg_aftermathTitle')}</div>
              <div style={{ fontSize: 13.5, color: C.inkDim, lineHeight: 1.45 }}>{tCount(t, 'lg_aftermathIntro', afterQs.length)}</div>
            </div>
            <ChunkyButton variant="ghost" color={C.inkDim} onClick={save} style={{ fontSize: 13, padding: '7px 12px' }}>{t('lg_aftermathLater')}</ChunkyButton>
          </div>
          <QuizRunner questions={afterQs} t={t} ai={ai} subject={subject} ctx={ctx} confirm={ctx.confirm}
            title={`🌙 ${t('lg_aftermathTitle')}`} onAnswer={recordAfter} judge={judge} feedbackExtra={missTools}
            onFinish={save} onExit={leave} />
        </div>
      ) : outcome ? <BossEnd t={t} won={outcome === 'won'} onDone={endFight} /> : (
        <QuizRunner questions={questions} t={t} ai={ai} subject={subject} ctx={ctx} confirm={ctx.confirm}
          title={`⚔️ ${bossName}`} onAnswer={record} judge={judge} header={header} tools={abMod?.decision && abMod?.actions ? tools : undefined}
          canUseChoices={(q) => !q._attack && fightPhase === 1}
          onQuestion={() => { setQuestionKey((k) => k + 1); taunt.onQuestion() }}
          resolveQuestion={fc.resolveQuestion} feedbackExtra={missTools}
          onFinish={save} onExit={leave} />
      )}
    </div>
  )
}

// The raid hall: every raid boss beaten, the newest first.
function Trophies({ ctx, raid }) {
  const { t } = ctx
  const list = shapeRaid(raid).trophies.slice().reverse()
  if (!list.length) return null
  return (
    <Card title={`🏆 ${t('lg_raidHall')}`} style={{ width: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {list.slice(0, 20).map((x, i) => (
          <div key={i} style={{ display: 'grid', justifyItems: 'center', gap: 2, fontSize: 11, fontWeight: 800, color: C.inkDim }}>
            {/* A trophy of a retired boss (or one from a newer build) keeps its place, drawn as a plain cup: no art fetch. */}
            {isRaidMotif(x.motif)
              ? <LegendsArt kind="raids" motif={x.motif} palette="night" height={48} width={48} round={0} room />
              : <div title={t('lg_raidRetired')} style={{ width: 48, height: 48, display: 'grid', placeItems: 'center', fontSize: 30 }}>🏆</div>}
            {x.date}
          </div>
        ))}
      </div>
    </Card>
  )
}
