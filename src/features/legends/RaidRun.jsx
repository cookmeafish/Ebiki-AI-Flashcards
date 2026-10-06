// A RAID RUN: the raid boss fought with the deck's DUE cards, one question per card, with the Legends rules (fight.js)
// made harder (raid.js: 3 phases, choices only in phase 1). Every card's FIRST answer is recorded in Anki as a real
// review, whether the run is won, lost or left early.
// THE SIEGE (raid.js): the boss's wounds and the player's hearts carry over between runs and days; a run starts with
// the hearts left, and with none no run starts until tomorrow.
// A RUN THAT RUNS OUT OF QUESTIONS while the boss lives and hearts are left asks "Continue?" in the arena: the next
// due cards join the SAME fight (hearts, combo, ability state and phase kept). The answers so far are recorded first,
// so nothing is ever recorded twice. "Stop for now" ends the run (wounds and hearts carry over).
// NOTHING IS FORCED AFTER THE FIGHT: a win offers the next boss (out the same day, RAID.nextBossSameDay), an optional
// Victory lap over the cards the fight never reached (a reward round, recorded like any review, bonus XP) or Done; a
// loss or a stop leaves those cards due and says so.
import { useEffect, useRef, useState } from 'react'
import { C, FONT, RADIUS } from '../../config/tokens'
import { poseFile } from '../../config/shrimp'
import { srs } from '../../cards'
import { EVENTS } from '../events'
import { featureCfg, useActivityBusy } from '../registry'
import { useHelpEntry } from '../kit/useHelp'
import { ChunkyButton, EbiSays, Card, tCount } from '../ui'
import { QuizRunner, judgeStrike, recordReviews, recordPractice, studyBlock, studyBlockText, fightCtx, generationKey, ensureLetterCue } from '../kit'
import FightSettings from './FightSettings'
import LearnItPanel from '../kit/LearnItPanel'
import { useFightCheck, useBossTaunt, TauntBubble, FightNotice, MissTools, Debrief } from './FightExtras'
import { FIGHT_EXTRAS, fightExtrasFor, expectedOf, isWrongish, learnItemFor } from './fightCheck'
import { RAID_VOICES } from './raidVoices'
import { learnerLevelLine } from '../kit/learnerStore'
import { BossIntro, BossArena, BossEnd } from './BossArena'
import { LegendsArt } from './art'
import { act, settleFight, phaseOf, raidRating, attackLivesFor, abilityState, refundRunningFight, strikeCost, fightOutcome, newFight } from './fight'
import { RAID, RAID_MOTIFS, RAID_ABILITY, todayKey, raidToday, raidStep, raidMotif, isRaidMotif, testRaidState, raidAttemptOutcome, raidHelpText, raidWhere, raidReviews, shapeRaid, siegeOf, raidAsked, raidMarkAsked, nextRaidCards, raidMinCards, raidOutOfQuestions, raidRunChoices, raidRunSize, applyBandage, applyRunPowers } from './raid'
import { raidProfile } from './raidProfiles'
import { POWERS, POWER_IDS, raidWins, unlockedPowers, bagSize, bagCount, nextUnlock, rollDrops, powerUsable, fiftyFifty, powerHint } from './powers'
import { abilityById } from './abilities'
import { buildRaidPrompt, parseQuestions, RAID_ROLE, RAID_MAX_TOKENS } from './prompt'
import { readRaid, updateRaid, LEGENDS_ID } from './store'

const INFO_BATCH = 40
const INFO_MAX = 200 // due cards read per look (the runs take RAID.maxCards of them at a time)
const GUARD_KEY = 'ebiki-raid-guards'
const LAP_SOURCE = `${LEGENDS_ID}-raid-lap` // the Victory lap's bonus: the game's generic practice XP path

// One run per mount: "Next boss" and "Fight again" start a new run from scratch (fresh read of the raid and the due
// cards), so no run's guards, answers or fight state can leak into the next.
// `test` (cheat mode's asset view): { motif } = a TEST fight against that boss (full hearts, a fresh boss). Today's due
// cards, every first answer a real review, but the stored raid (wounds, hearts, trophies, the rotation) and every
// reward are left alone (raid.js raidAttemptOutcome).
export default function RaidRun(props) {
  const [run, setRun] = useState(0)
  return <RaidRunOne key={run} {...props} onAgain={() => setRun((n) => n + 1)} />
}

function RaidRunOne({ ctx: rawCtx, onExit, onAgain, test = null }) {
  // The fight speaks the mode's fight language (FightSettings: the same study settings as Study): every prompt below,
  // the graders, taunts, Learn it and the debrief take `ctx.subject.userLang` from here.
  const ctx = fightCtx(rawCtx)
  const ctxRef = useRef(ctx)
  ctxRef.current = ctx
  const { t, ai, subject } = ctx
  const fightRulesNow = ctx.fight?.rules || {}
  const testMotif = test && isRaidMotif(test.motif) ? test.motif : ''
  // Pinned at mount: a screen that re-renders this raid under another mode before closing it still files it here.
  const modeId = useRef(subject.modeId).current
  const deck = subject.modeDeck || subject.deck
  // The deck the raid's cards came from: its reviews are saved THERE even if the header deck changes mid-raid.
  const deckRef = useRef('')
  const focus = featureCfg(ctx, LEGENDS_ID).focus === true
  const tauntsOn = fightExtrasFor(featureCfg(ctx, LEGENDS_ID), { focus }).taunts // off in focus mode (fightCheck.js)
  // loading | none | hearts | beaten | error | intro | fight | more | lap | saving | done
  const [phase, setPhase] = useState('loading')
  const [lapQs, setLapQs] = useState(null) // the Victory lap: the picked cards the fight never asked
  const [more, setMore] = useState(null) // "Continue?": { cards, busy, error } (cards null while looking)
  const [seg, setSeg] = useState(0) // the run's question batch (a Continue starts the next one in the same fight)
  const [segQs, setSegQs] = useState(null) // the batch QuizRunner asks now
  // Changes whenever QuizRunner shows a new question: an ability effect still playing fast-fades (BossArena).
  const [questionKey, setQuestionKey] = useState(0)
  const [error, setError] = useState('')
  const [studyBlocked, setStudyBlocked] = useState(false) // the error is a study session in the way: offer to open Study
  const [raid, setRaid] = useState(null) // the siege as this run started it (raid.js)
  const [savedRaid, setSavedRaid] = useState(null) // the raid as saved after the run (the hall; the next boss)
  const [questions, setQuestions] = useState(null) // every question of the run (all batches)
  const [fs, setFs] = useState(newFight)
  const fsRef = useRef(fs)
  const pos = useRef(-1)
  const cardsRef = useRef([]) // [{ cardId, noteId, front, back }]
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
  const committed = useRef(false) // the run's outcome written once (commit)
  const [summary, setSummary] = useState(null)
  const alive = useRef(true)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])

  // The day the raid STARTED: a run finishing after midnight is saved against the day it was fought.
  const dateRef = useRef(todayKey())
  const dueAtStart = useRef(0) // the due cards when the run started (a fresh boss's health)
  const askedBefore = useRef([]) // notes answered in raids today before this run
  const storedRef = useRef(null) // the stored raid read by load
  const day = raid?.day
  const need = day ? Math.max(1, day.hp - day.damage) : 1 // what is left of the boss's health
  const motif = raid ? raidMotif(raid) : testMotif || RAID_MOTIFS[0]
  // The boss's own fight (raidProfiles.js): its hearts, heal and power slots.
  const profile = raidProfile(motif)
  const maxHearts = Math.max(profile.hearts, raid?.siege?.hearts || 0)
  const startHearts = testMotif ? profile.hearts : raid?.siege ? raid.siege.hearts : profile.hearts
  // Questions per run (the player's setting, Fight settings on the intro).
  const runSize = raidRunSize(featureCfg(ctx, LEGENDS_ID).raidRunSize)
  const runSizeOpt = testMotif ? null : { value: runSize, options: RAID.runSizes, onChange: (n) => ctx.setFeatureSettings?.(LEGENDS_ID, { raidRunSize: n }) }
  const bossName = t(`lg_raidBoss_${motif}`)
  const ability = RAID_ABILITY[motif] || ''
  const abMod = abilityById(ability)
  const area = { id: `raid-${motif}`, title: t('lg_raidTitle'), subtitle: testMotif ? t('lg_raidTestTag') : t('lg_raidTitle'), motif, palette: 'night' }
  const phaseRef = useRef(phase)
  phaseRef.current = phase
  const fightOver = useRef(null) // { need, lives } of the running fight, for a refund landing between renders

  // RECORDING, progressive: a Continue records the answers so far, the end records the rest. recordReviews keeps
  // per-run guards (this run's id), so a card is never recorded twice. A second look that lands after its card was
  // recorded fixes the grade with a follow-up review (srs.correctRating, once per card).
  const recordedRef = useRef(new Set())
  const recordingRef = useRef(new Set())
  const failedRef = useRef(new Set())
  const emittedRef = useRef(new Set()) // cards whose CARD_GRADED was sent
  const correctedRef = useRef(new Set())
  const pendingFix = useRef([])
  const recordChain = useRef(Promise.resolve())
  const correctCard = async (cardId, hit) => {
    if (!recordedRef.current.has(cardId) || correctedRef.current.has(cardId)) return
    correctedRef.current.add(cardId)
    const pre = preRef.current.get(cardId)
    try { await srs.correctRating({ cardId, ease: raidRating(hit, pre).ease, preSchedule: pre }) } catch { correctedRef.current.delete(cardId) }
  }
  const recordSoFar = () => {
    const step = recordChain.current.then(async () => {
      const todo = [...firstHit.current].filter(([id]) => !recordedRef.current.has(id))
      if (!todo.length) return
      for (const [id] of todo) recordingRef.current.add(id)
      const ratings = raidReviews(new Map(todo), preRef.current, (id) => cardsRef.current.find((c) => c.cardId === id)?.front)
      let failed = []
      try {
        const r = await recordReviews({ guardKey: GUARD_KEY, runId, deck: deckRef.current || deck, ratings, preSchedule: preRef.current })
        for (const id of r.recorded) { recordedRef.current.add(id); failedRef.current.delete(id) }
        failed = r.failed
      } catch { failed = todo.map(([id]) => id) }
      for (const id of failed) failedRef.current.add(id)
      for (const [id] of todo) recordingRef.current.delete(id)
      // A second look that landed while these were being sent: its card gets the corrected grade now.
      for (const [cardId, hit] of pendingFix.current.splice(0)) correctCard(cardId, hit)
    })
    recordChain.current = step.catch(() => {})
    return step.catch(() => {})
  }
  // Card XP and mistakes only for the cards Anki really recorded (an unrecorded card stays due; the next run would
  // pay it again). Returns the newly reported hits.
  const reportRecorded = () => {
    const fresh = [...firstHit.current].filter(([cardId]) => recordedRef.current.has(cardId) && !emittedRef.current.has(cardId))
    for (const [cardId, hit] of fresh) {
      emittedRef.current.add(cardId)
      const c = cardsRef.current.find((x) => x.cardId === cardId)
      ctx.emit(EVENTS.CARD_GRADED, { correct: hit.verdict !== 'miss', grade: raidRating(hit, preRef.current.get(cardId)).rating, mode: modeId, front: c?.front || '', back: c?.back || '', cardId, misses: hit.verdict === 'miss' ? [{ question: hit.q?.prompt || '', answer: hit.answer || '', expected: (hit.q?.accepted || [])[0] || '' }] : [] })
    }
    return fresh
  }
  // A miss or glancing answer was right after all (the re-check or an appeal).
  const onOverturn = (e, to) => {
    const cardId = e.cardId
    const first = cardId != null ? firstHit.current.get(cardId) : null
    if (first && first.aid === e.aid) {
      const hit = { ...first, verdict: to }
      firstHit.current.set(cardId, hit)
      if (recordedRef.current.has(cardId)) correctCard(cardId, hit)
      else if (recordingRef.current.has(cardId)) pendingFix.current.push([cardId, hit])
    }
    // The fight gives back what the verdict cost, only while it still runs (after the fight a won appeal fixes the
    // grade, never the outcome).
    if (!FIGHT_EXTRAS.refund || phaseRef.current !== 'fight' || e.kind === 'aftermath') return false
    const next = refundRunningFight(fsRef.current, fightOver.current, { kind: e.kind, mode: e.mode, first: e.first, cost: e.cost }, to)
    if (!next) return false
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
    setLearn(learnItemFor(cardsRef.current.find((c) => c.cardId === e.q?._cardId), e.q))
  }
  const learnPanel = learn && <LearnItPanel ctx={ctx} item={learn} onClose={() => setLearn(null)} closeLabel={phase === 'fight' ? t('lg_learnBackToFight') : undefined} />
  const learnOn = fightRulesNow.learnMoment !== false // the mode's Learn-it moments (one setting with Study)
  const missTools = (q) => {
    const e = fc.entryFor(q)
    return e && isWrongish(e.first) ? <MissTools ctx={ctx} entry={e} onAppeal={fc.appeal} onLearn={learnOn ? () => openLearn(e) : null} /> : null
  }

  // The due cards in Anki's order, read in batches (the runs take RAID.maxCards of them at a time).
  const readDue = async () => {
    const ids = await srs.findCards({ deck: deckRef.current || deck, state: 'due', excludeSuspended: true, excludeBuried: true })
    const infos = []
    for (let i = 0; i < ids.length && infos.length < INFO_MAX; i += INFO_BATCH) infos.push(...((await srs.cardsInfo(ids.slice(i, i + INFO_BATCH))) || []))
    return infos
  }
  const toCards = (picked) => picked.map((c) => ({ cardId: c.cardId, noteId: c.note, ...ctx.cards.noteText(c) })).filter((c) => c.front)
  const answeredNotes = () => cardsRef.current.filter((c) => firstHit.current.has(c.cardId)).map((c) => c.noteId)

  const load = async () => {
    setPhase('loading'); setError(''); setStudyBlocked(false)
    // Nothing answered yet: a Retry after midnight fights today's raid, not yesterday's.
    if (!firstHit.current.size) dateRef.current = todayKey()
    const date = dateRef.current
    try {
      if (!ai.hasKey) throw new Error(t('lg_raidNoKey'))
      if (ctx.ankiConnected === false || !deck) throw new Error(t('lg_raidNoDeck'))
      // Never during a study session: its pending ratings and the raid's reviews would answer the same due card twice,
      // and two loops driving Anki's one reviewer at once could rate the wrong card.
      // A session abandoned for 8 hours is ended here first (its ratings sent); only real pending work blocks.
      const block = await studyBlock(ctx)
      if (block) { if (alive.current) setStudyBlocked(true); throw new Error(studyBlockText(t, block)) }
      deckRef.current = deck
      // A test fight never reads (or later writes) the stored raid: a fresh boss with full hearts.
      const r = testMotif ? { ok: true, value: null } : await readRaid(modeId)
      if (!r.ok) throw new Error(t('lg_raidReadFailed'))
      storedRef.current = r.value
      askedBefore.current = testMotif ? [] : raidAsked(r.value, date)
      const eligible = nextRaidCards(await readDue(), { asked: askedBefore.current, max: INFO_MAX })
      dueAtStart.current = eligible.length
      const today = testMotif ? testRaidState(testMotif, date, eligible.length) : raidToday(r.value, date, eligible.length)
      if (!alive.current) return
      setRaid(today)
      if (!testMotif && today.day.won) { setPhase('beaten'); return }
      if (!testMotif && today.siege.hearts <= 0) { setPhase('hearts'); return }
      const ongoing = !testMotif && !!siegeOf(r.value)
      const cards = toCards(eligible.slice(0, runSize))
      // Counted AFTER dropping cards with no readable front. A fresh boss needs a raid's worth; a siege any card.
      if (cards.length < raidMinCards(ongoing)) { setPhase('none'); return }
      cardsRef.current = cards
      preRef.current = new Map(eligible.map((c) => [c.cardId, { interval: c.interval, factor: c.factor }]))
      const qs = await writeQuestions(cards, raidMinCards(ongoing))
      if (!alive.current || !qs) return
      setQuestions(qs)
      setSegQs(qs)
      setPhase('intro')
    } catch (e) { if (alive.current) { setError(String(e.message || e)); setPhase('error') } }
  }
  // The questions, written with the LIVE fight settings (learned language, "Ebi speaks", dialect). null = superseded.
  const writeSeq = useRef(0)
  const genKeyRef = useRef('')
  const writeQuestions = async (cards, min = RAID.minCards) => {
    const my = ++writeSeq.current
    const c = ctxRef.current
    const s = c.subject
    genKeyRef.current = generationKey(c.fight?.rules || {})
    const level = await learnerLevelLine(c)
    const { system, user } = buildRaidPrompt(s, cards, { level })
    const raw = c.ai.json(await c.ai.call(system, user, { role: RAID_ROLE, maxTokens: RAID_MAX_TOKENS }))
    if (my !== writeSeq.current) return null
    const list = Array.isArray(raw) ? raw : Array.isArray(raw?.questions) ? raw.questions : []
    const qs = []
    const used = new Set()
    for (const q of list) {
      const i = Number(q?.card) - 1
      const card = cards[i]
      if (!card || used.has(card.cardId)) continue
      const [one] = parseQuestions([q], c.ai.clean, { speakLang: s.learnLangIso, dual: true })
      if (!one) continue
      used.add(card.cardId)
      // Study's first-letter cue guarantee for a typed language answer (kit/fightSettings.js).
      qs.push({ ...ensureLetterCue(one, { isLanguage: !!s.isLanguage }), _cardId: card.cardId, target: card.front })
    }
    if (qs.length < Math.max(1, min)) throw new Error(t('lg_errQuiz'))
    return qs
  }
  // A setting that changes what the questions are written in (FightSettings on the intro) rewrites them: same cards.
  const [rewriting, setRewriting] = useState(false)
  const genKey = generationKey(fightRulesNow)
  useEffect(() => {
    if (phase !== 'intro' || !genKeyRef.current || genKey === genKeyRef.current || !cardsRef.current.length) return
    setRewriting(true)
    writeQuestions(cardsRef.current, testMotif ? RAID.minCards : raidMinCards(!!siegeOf(storedRef.current))).then((qs) => {
      if (!alive.current) return
      if (!qs) { setRewriting(false); return } // a newer write (a deck change reloads) took over
      setQuestions(qs)
      setSegQs(qs)
      setRewriting(false)
    }).catch((e) => { if (alive.current) { setRewriting(false); setError(String(e.message || e)); setPhase('error') } })
  }, [genKey, phase]) // eslint-disable-line react-hooks/exhaustive-deps
  const started = useRef(false)
  useEffect(() => { if (!started.current) { started.current = true; load() } }, []) // eslint-disable-line react-hooks/exhaustive-deps
  // The deck picked in the fight settings before the fight: the due cards come from it.
  useEffect(() => {
    if (!started.current || !deck || deck === deckRef.current || firstHit.current.size) return
    if (['intro', 'none', 'error', 'beaten', 'hearts'].includes(phase)) load()
  }, [deck]) // eslint-disable-line react-hooks/exhaustive-deps
  // A new run size on the intro: the run takes that many cards (read again, questions written again).
  const runSizeAt = useRef(runSize)
  useEffect(() => {
    if (runSizeAt.current === runSize) return
    runSizeAt.current = runSize
    if (started.current && !firstHit.current.size && ['intro', 'none'].includes(phase)) load()
  }, [runSize]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── POWERS (powers.js; raids only) ──
  // The bag this run spends from: the stored one (a test fight gets one of each to try, and spends nothing).
  const storedBag = testMotif ? Object.fromEntries(POWER_IDS.map((id) => [id, 1])) : shapeRaid(storedRef.current).powers
  const usedRef = useRef([]) // the powers this run used (spent on save)
  const [, setUsedN] = useState(0) // re-renders the power buttons after a use
  const usedOnQ = useRef(new WeakSet()) // questions a power was used on (one per question)
  const aidedQ = useRef(new WeakSet()) // questions a 50:50 or hint helped with (recorded as Hard)
  const [powerArmed, setPowerArmed] = useState({}) // { shield, sharpen } up now
  const powerArmedRef = useRef({})
  const setPA = (v) => { powerArmedRef.current = v; setPowerArmed(v) }
  const windUsed = useRef(false)
  const streak = useRef({ now: 0, best: 0 }) // clean answers in a row (a drop at DROP.streak)
  const bagLeft = (() => { const b = { ...storedBag }; for (const id of usedRef.current) b[id] = Math.max(0, (b[id] || 0) - 1); return b })()
  const slots = testMotif ? Math.max(3, profile.slots) : profile.slots
  const [bandageNote, setBandageNote] = useState('')
  const bandageNow = async () => {
    if (testMotif) return
    const next = await updateRaid(modeId, (cur) => applyBandage(cur, todayKey()) || cur)
    if (!alive.current) return
    if (next && applyBandage(next, todayKey()) === null && next.siege?.bandage === todayKey()) {
      storedRef.current = next
      setRaid((r) => (r ? { ...r, siege: { ...r.siege, bandage: todayKey() }, powers: next.powers } : r))
      setSavedRaid((s) => (s ? next : s))
      setBandageNote(t('lg_powBandageDone', { n: profile.heal }))
    } else setBandageNote(t('lg_errSave'))
  }

  // Due notes left after this run (not answered in a raid today), for the result's choices. null = unknown.
  const countDueLeft = async (state) => {
    try {
      const ids = await srs.findNotes({ deck: deckRef.current || deck, state: 'due', excludeSuspended: true, excludeBuried: true })
      const asked = new Set([...(state ? raidAsked(state, dateRef.current) : []), ...askedBefore.current, ...answeredNotes()].map(String))
      return (ids || []).filter((id) => !asked.has(String(id))).length
    } catch { return null }
  }
  const unaskedQs = () => {
    const seen = new Set()
    return (questions || []).filter((q) => q._cardId != null && !firstHit.current.has(q._cardId) && !seen.has(q._cardId) && seen.add(q._cardId))
  }

  // THE RUN ENDS (a win, a loss, Stop for now, leaving): record every answer, then write the siege once.
  const commit = async () => {
    if (committed.current) return
    committed.current = true
    if (alive.current) setPhase('saving')
    const date = dateRef.current
    const dayNow = raid?.day
    // Re-checks and appeals still running decide the grades first (bounded: the reviews are never lost to a slow reply).
    await fc.settle()
    // An ability holding damage (a bank, a gauge, moons in orbit) lets it go when the fight ends (abilities: settle).
    const st = settleFight(fsRef.current, { ability, need: dayNow ? Math.max(1, dayNow.hp - dayNow.damage) : 1, lives: startHearts, bar: { total: dayNow ? dayNow.hp : 1, before: dayNow ? dayNow.damage : 0, phases: RAID.phases }, dayAb: dayNow?.ab || null })
    fsRef.current = st
    await recordSoFar()
    const hits = reportRecorded()
    const dayAb = abMod?.dayState ? abMod.dayState(st) : undefined
    const opts = { date, damage: st.damage, livesLost: st.livesLost, asked: answeredNotes(), dayAb, due: dueAtStart.current, motif }
    let outcome = { won: false, firstWin: false }
    let next = null
    let drops = []
    if (testMotif) outcome = raidAttemptOutcome(null, { ...opts, test: testMotif })
    else {
      // The powers this run used are spent and its random drops go into the bag, in the same write as the siege.
      next = await updateRaid(modeId, (cur) => {
        const res = raidAttemptOutcome(cur, opts)
        outcome = res
        const wins = raidWins(res.state)
        drops = rollDrops({ wins, bag: shapeRaid(res.state).powers, answered: firstHit.current.size, runSize, bestStreak: streak.current.best, won: res.won, livesLost: st.livesLost, hearts: startHearts })
        return res.state ? applyRunPowers(res.state, { used: usedRef.current, drops }) : res.state
      })
    }
    const firstWin = !testMotif && outcome.firstWin && next !== undefined // a trophy that was not saved is not paid
    if (hits.length) ctx.emit(EVENTS.PRACTICE_DONE, { source: `${LEGENDS_ID}-raid`, mode: modeId, total: hits.length, correct: hits.filter(([, h]) => h.verdict !== 'miss').length })
    if (firstWin) ctx.emit(EVENTS.BOSS_BEATEN, { mode: modeId, area: 0, raid: true })
    recordPractice(ctx, LEGENDS_ID, cardsRef.current.filter((c) => firstHit.current.has(c.cardId)).map((c) => ({ kind: 'card', label: c.front })))
    const dueLeft = await countDueLeft(next || storedRef.current)
    if (!alive.current) return
    // Kept apart from `raid`: the arena (a Victory lap) still shows the boss just fought, not the next one.
    if (next) setSavedRaid(next)
    // What carries over: the stored siege after this run (a test fight: what it would have been).
    const after = testMotif ? null : raidToday(next || storedRef.current, date, 0)
    const won = outcome.won
    setSummary({
      won, firstWin, motif, bossName, saveFailed: next === undefined,
      hearts: testMotif ? Math.max(0, startHearts - st.livesLost) : won ? raidProfile(next ? raidMotif(next) : motif).hearts : after?.siege?.hearts ?? 0,
      maxHearts,
      hp: won ? 0 : (dayNow?.hp || 0), left: won ? 0 : Math.max(0, (dayNow?.hp || 0) - (dayNow?.damage || 0) - st.damage),
      unasked: unaskedQs().length, dueLeft, nextMotif: won && next ? raidMotif(next) : '',
      // Powers: what the bag gained (only when it was saved), and the next one a win unlocks.
      drops: next ? drops : [], wins: next ? raidWins(next) : raidWins(storedRef.current), bag: next ? shapeRaid(next).powers : null,
      bandageOk: !!(next && applyBandage(next, todayKey())),
    })
    setPhase('done')
  }
  // Leaving by the sidebar, the Practice hub or a mode switch unmounts the raid: what was answered is still saved.
  const commitRef = useRef(commit)
  commitRef.current = commit
  const lapEndRef = useRef(null)
  useEffect(() => () => {
    if (firstHit.current.size && !committed.current) commitRef.current()
    else if (lapEndRef.current) lapEndRef.current()
  }, [])
  // Leaving mid-fight still records what was answered (the reviews happened).
  const leave = async () => {
    // QuizRunner already asked "quit?"; the answers given so far are still recorded.
    if ((phase === 'fight' || phase === 'more') && firstHit.current.size && !committed.current) { await commit(); return }
    if (phase === 'lap') { await finishLap(); return }
    onExit?.()
  }

  // OUT OF QUESTIONS with the boss alive and hearts left: "Continue?" in the arena, the next due cards looked up now.
  const ranOut = async () => {
    const st = fsRef.current
    if (raidOutOfQuestions({ damage: st.damage, need, livesLost: st.livesLost, lives: startHearts, next: 1 }) === 'over') { commit(); return }
    setMore({ cards: null, busy: false, error: '' })
    setPhase('more')
    try {
      const picked = nextRaidCards(await readDue(), { asked: askedBefore.current, inRun: cardsRef.current.map((c) => c.noteId), max: runSize })
      // Their schedule BEFORE any review (what a fallback interval and a later correction step from).
      for (const c of picked) if (!preRef.current.has(c.cardId)) preRef.current.set(c.cardId, { interval: c.interval, factor: c.factor })
      if (alive.current) setMore({ cards: toCards(picked), busy: false, error: '' })
    } catch (e) { if (alive.current) setMore({ cards: [], busy: false, error: String(e.message || e) }) }
  }
  const continueRun = async () => {
    const cards = more?.cards || []
    if (!cards.length || more.busy) return
    setMore({ ...more, busy: true, error: '' })
    // The answers so far go to Anki first: the next batch can never record one of them again.
    recordSoFar()
    try {
      const qs = await writeQuestions(cards, 1)
      if (!alive.current || !qs) return
      cardsRef.current = [...cardsRef.current, ...cards]
      pendingRef.current = []
      pos.current = -1
      setQuestions((all) => [...(all || []), ...qs])
      setSegQs(qs)
      setSeg((n) => n + 1)
      setMore(null)
      setPhase('fight')
    } catch (e) { if (alive.current) setMore({ cards, busy: false, error: String(e.message || e) }) }
  }

  // THE VICTORY LAP (a win's optional reward round): the cards the fight never asked, no fight math, each first answer
  // recorded like any review; finishing pays the game's practice XP once more as a bonus.
  const lapStart = () => {
    const rest = unaskedQs()
    if (!rest.length) return
    setLapQs(rest.map((q) => ({ ...q, _aftermath: true })))
    setPhase('lap')
  }
  const lapDone = useRef(false)
  const finishLap = async () => {
    if (lapDone.current) return
    lapDone.current = true
    lapEndRef.current = null
    if (alive.current) setPhase('saving')
    await recordSoFar()
    const hits = reportRecorded()
    if (hits.length) ctx.emit(EVENTS.PRACTICE_DONE, { source: LAP_SOURCE, mode: modeId, total: hits.length, correct: hits.filter(([, h]) => h.verdict !== 'miss').length })
    let next = null
    if (!testMotif && hits.length) next = await updateRaid(modeId, (cur) => raidMarkAsked(cur, dateRef.current, hits.map(([id]) => cardsRef.current.find((c) => c.cardId === id)?.noteId).filter((x) => x != null)))
    const dueLeft = await countDueLeft(next || null)
    if (!alive.current) return
    setSummary((s) => ({ ...s, lap: hits.length, unasked: unaskedQs().length, dueLeft }))
    setPhase('done')
  }
  // A Victory lap answer: recorded as the card's first answer, nothing else (no fight math).
  const recordLap = (q, correct, answer, info = {}) => {
    if (q._retry || q._cardId == null || firstHit.current.has(q._cardId)) return null
    const verdict = info.verdict || (correct ? 'clean' : 'miss')
    const aid = info.aid || fc.open(q, answer, 'typed', { verdict })
    firstHit.current.set(q._cardId, { verdict, mode: 'typed', attack: false, lastStand: false, key: q._cardId, q, answer, aid })
    fc.attach(aid, { cost: {}, kind: 'aftermath', cardId: q._cardId })
    lapEndRef.current = () => finishLap()
    return null
  }

  // Back / the Practice hub ask before leaving only while something would be lost (a fight or its lap); the intro and
  // the result screens leave at once (registry: useActivityBusy).
  useActivityBusy(phase === 'fight' || phase === 'more' || phase === 'lap')
  // Ebi's Help: the fight's state on screen (raid.js raidHelpText: never an answer; QuizRunner reports the question).
  const helpDay = raid?.day
  const running = phase === 'fight' || phase === 'more' || phase === 'lap'
  const helpLeft = phase === 'done' && summary ? summary.left : helpDay ? Math.max(0, helpDay.hp - helpDay.damage - (running ? fs.damage : 0)) : 0
  const helpAbility = ability ? `${t(`lg_ability_${ability}`)}: ${t(`lg_abilityDesc_${ability}`)}` : ''
  useHelpEntry(ctx, 'raid', raidHelpText({
    view: phase, boss: summary?.bossName || bossName, ability: helpAbility, test: !!testMotif, lives: maxHearts,
    hpLeft: helpLeft, hpMax: helpDay?.hp || 0,
    livesLeft: phase === 'done' && summary ? summary.hearts : Math.max(0, startHearts - (running ? fs.livesLost : 0)),
    phase: helpDay ? phaseOf(helpLeft, helpDay.hp, RAID.phases) : 1,
    asked: firstHit.current.size, total: questions?.length || 0,
    lapLeft: lapQs ? lapQs.filter((q) => !firstHit.current.has(q._cardId)).length : 0,
    nextCards: more?.cards?.length || 0,
    result: summary ? { ...summary, recorded: recordedRef.current.size, failed: failedRef.current.size } : null,
  }), ctx.activeTab || 'practice', raidWhere({ view: phase, boss: summary?.bossName || bossName, test: !!testMotif }), 3)

  if (phase === 'loading') return <div style={{ maxWidth: 560, margin: '60px auto' }}><EbiSays pose={poseFile('weapon')}>{t('lg_raidLoading')}</EbiSays></div>
  if (phase === 'error' || phase === 'none' || phase === 'beaten' || phase === 'hearts') {
    const text = phase === 'error' ? error : phase === 'none' ? t(siegeOf(storedRef.current) ? 'lg_raidNoneLeft' : 'lg_raidTooFew', { n: RAID.minCards }) : phase === 'hearts' ? t('lg_raidNoHearts') : t('lg_raidBeatenToday')
    return (
      <div style={{ maxWidth: 560, margin: '40px auto', display: 'grid', gap: 14 }}>
        <EbiSays pose={poseFile(phase === 'beaten' ? 'party' : phase === 'hearts' ? 'book' : 'confused')}>{text}</EbiSays>
        {phase === 'hearts' && <SiegeLine t={t} raid={raid} />}
        <Trophies ctx={ctx} raid={raid} />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <ChunkyButton variant="ghost" color={C.inkDim} onClick={onExit}>{t('lg_back')}</ChunkyButton>
          {phase === 'error' && studyBlocked && ctx.study?.open && <ChunkyButton variant="ghost" color={C.brand} onClick={() => ctx.study.open()}>{t('call_openStudy')}</ChunkyButton>}
          {phase === 'error' && <ChunkyButton color={C.success} onClick={load}>{t('lg_retry')}</ChunkyButton>}
        </div>
      </div>
    )
  }
  if (phase === 'intro') {
    return (
      <div style={{ display: 'grid', gap: 8 }}>
        {testMotif && <TestTag t={t} note />}
        <BossIntro t={t} area={area} name={bossName} total={questions.length} kind="raids" raidLives={maxHearts} raidLeft={startHearts} ability={ability} calm={focus} onFight={() => { if (!rewriting) setPhase('fight') }} />
        <FightSettings ctx={ctx} allowStyle busy={rewriting} runSize={runSizeOpt} />
        <PowerBag t={t} bag={storedBag} wins={testMotif ? 99 : raidWins(storedRef.current)} slots={slots} test={!!testMotif}
          bandage={!testMotif && raid?.siege && !day?.won && raid.siege.bandage !== todayKey() && storedBag.bandage > 0 ? bandageNow : null} note={bandageNote} heal={profile.heal} />
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', fontSize: 13.5, color: C.inkDim, lineHeight: 1.5 }}>
          {t('lg_raidRules', { n: questions.length, lives: startHearts })}{day?.damage ? ` ${t('lg_raidWounded', { hp: day.hp - day.damage, max: day.hp })}` : ''}
          {!testMotif && <div style={{ marginTop: 4, fontWeight: 800 }}>🏰 {t('lg_raidSiegeLine', { n: profile.heal })}</div>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}><ChunkyButton variant="ghost" color={C.inkDim} onClick={onExit}>{t('lg_back')}</ChunkyButton></div>
      </div>
    )
  }
  if (phase === 'saving') return <div style={{ maxWidth: 560, margin: '60px auto' }}><EbiSays pose={poseFile('work')}>{t('lg_raidSaving')}</EbiSays></div>
  if (phase === 'done' && summary) {
    const ch = raidRunChoices({ won: summary.won, unasked: summary.lap != null ? 0 : summary.unasked, dueLeft: summary.dueLeft || 0, hearts: summary.hearts })
    const recorded = recordedRef.current.size
    const failed = failedRef.current.size
    return (
      <div style={{ maxWidth: 600, margin: '24px auto', display: 'grid', gap: 14, justifyItems: 'center', textAlign: 'center' }}>
        <LegendsArt kind="raids" motif={summary.motif} palette="night" height={120} width={120} round={0} room animated={summary.won ? false : 'idle'} style={summary.won ? { filter: 'grayscale(.6) opacity(.7)', transform: 'rotate(-8deg)' } : undefined} />
        <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 28, color: summary.won ? C.success : C.warning }}>{summary.won ? `🏆 ${t('lg_raidWon', { name: summary.bossName })}` : t(testMotif ? 'lg_raidTestLost' : 'lg_raidRetreat')}</div>
        {testMotif && <TestTag t={t} note />}
        {summary.firstWin && <div style={{ fontWeight: 800, color: C.info }}>❄ {t('lg_bossFreeze')} · 🏆 {t('lg_raidTrophy')}</div>}
        {!testMotif && !summary.won && (
          <div style={{ display: 'grid', gap: 4, justifyItems: 'center' }}>
            <Hearts t={t} left={summary.hearts} max={summary.maxHearts} size={22} />
            <div style={{ fontWeight: 800, color: C.inkDim }}>{t('lg_raidCarry', { hearts: summary.hearts, max: summary.maxHearts, hp: summary.left, maxHp: summary.hp })}</div>
            <div style={{ fontSize: 13, color: C.inkDim }}>🏰 {t('lg_raidSiegeLine', { n: profile.heal })}</div>
            {summary.hearts <= 0 && <div style={{ fontWeight: 800, color: C.warning }}>{t('lg_raidNoHearts')}</div>}
          </div>
        )}
        {summary.lap > 0 && <div style={{ fontWeight: 800, color: C.success }}>🏁 {tCount(t, 'lg_raidLapDone', summary.lap)}</div>}
        {!testMotif && <PowerDrops t={t} drops={summary.drops} wins={summary.wins} />}
        {!testMotif && summary.bag && <PowerBag t={t} bag={summary.bag} wins={summary.wins} slots={0} compact
          bandage={summary.bandageOk && !summary.won && !bandageNote ? bandageNow : null} note={bandageNote} heal={profile.heal} />}
        {ch.stayDue > 0 && <div style={{ fontSize: 13.5, color: C.inkDim }}>{tCount(t, 'lg_raidStayDue', ch.stayDue)}</div>}
        <div style={{ fontSize: 14.5, fontWeight: 800, color: failed ? C.danger : C.success }}>
          {failed ? tCount(t, 'lg_raidRecordFailed', failed) : tCount(t, 'lg_raidRecorded', recorded)}
        </div>
        {summary.saveFailed && <div style={{ color: C.danger, fontWeight: 800 }}>{t('lg_errSave')}</div>}
        {/* The choices: nothing after a fight is forced. */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          {!testMotif && ch.nextBoss && summary.nextMotif && <ChunkyButton color={C.danger} onClick={onAgain}>⚔️ {t('lg_raidNextBoss', { name: t(`lg_raidBoss_${summary.nextMotif}`) })}</ChunkyButton>}
          {ch.lap > 0 && (
            <ChunkyButton color={C.success} onClick={lapStart} title={t('lg_raidLapDesc')}>🏁 {tCount(t, 'lg_raidLap', ch.lap)}</ChunkyButton>
          )}
          {!testMotif && ch.again && <ChunkyButton color={C.warning} onClick={onAgain}>⚔️ {tCount(t, 'lg_raidFightAgain', summary.dueLeft)}</ChunkyButton>}
          <ChunkyButton variant={ch.nextBoss || ch.lap || ch.again ? 'ghost' : undefined} color={ch.nextBoss || ch.lap || ch.again ? C.inkDim : C.success} onClick={onExit}>{t(summary.won ? 'lg_raidDone' : 'lg_back')}</ChunkyButton>
        </div>
        {ch.lap > 0 && <div style={{ fontSize: 12.5, color: C.inkDim, maxWidth: 440 }}>{t('lg_raidLapDesc')}</div>}
        <Debrief ctx={ctx} fc={fc} onLearn={learnOn ? openLearn : null} expectedOf={expectedOf} />
        <Trophies ctx={ctx} raid={savedRaid || raid} />
        {learnPanel}
      </div>
    )
  }

  // ── The fight (with its "Continue?" and the Victory lap) ──
  const lives = startHearts
  const outcome = fs.damage >= need ? 'won' : fs.livesLost >= lives ? 'lost' : ''
  // The bar and the phases follow the siege's whole health: earlier runs' wounds are already dealt.
  const dayHp = day ? day.hp : need
  // The hearts row shows the boss's full hearts, the ones lost in earlier runs greyed.
  const shown = { ...fs, damage: fs.damage + (day ? day.damage : 0), livesLost: fs.livesLost + (maxHearts - lives) }
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
    const aided = aidedQ.current.has(q)
    if (!q._attack && !q._inserted && !q._lastStand && q._cardId != null && !firstHit.current.has(q._cardId)) {
      firstHit.current.set(q._cardId, { verdict, mode: aided ? 'choice' : mode, attack: false, lastStand: false, key: q._cardId, q, answer, aid, ...(aided ? { aided: true } : {}) })
    }
    // The clean streak (a power drop at DROP.streak): only unaided clean typed answers count.
    if (verdict === 'clean' && mode === 'typed' && !aided) { streak.current.now++; streak.current.best = Math.max(streak.current.best, streak.current.now) } else if (verdict !== 'clean') streak.current.now = 0
    if (verdict === 'miss' && !info.skipped) taunt.onMiss(q, answer, expectedOf(q))
    const armedNow = armedRef.current
    if (Object.keys(armedNow).length) setArmed({})
    const pa = powerArmedRef.current
    const { next, groups } = raidStep(before, q, { verdict, mode, attackQ: info.attackQ, aid, aided }, {
      ability, need, lives, dayHp, dayBefore: day ? day.damage : 0, dayAb: day?.ab || null, pos: pos.current, questions, armed: Object.keys(armedNow).length ? armedNow : null,
      shield: !!pa.shield, sharpen: !!pa.sharpen,
    })
    // A Shield is spent when it takes a heart; a Sharpen when it lands.
    if ((pa.shield && next.last?.shielded) || (pa.sharpen && next.last?.sharpened)) setPA({ ...pa, ...(next.last?.shielded ? { shield: false } : {}), ...(next.last?.sharpened ? { sharpen: false } : {}) })
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
      {(powerArmed.shield || powerArmed.sharpen) && (
        <div data-raid-armed="" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12, fontWeight: 900, color: C.purple }}>
          {powerArmed.shield && <span>🛡 {t('lg_powShieldUp')}</span>}
          {powerArmed.sharpen && <span>⚔ {t('lg_powSharpenUp')}</span>}
        </div>
      )}
      {abilityHint(q, mode) && <div style={{ fontSize: 12, fontWeight: 800, color: C.purple }}>{abilityHint(q, mode)}</div>}
    </div>
  )
  // The ability's buttons beside Skip while a question waits (abilities: actions/act). A toggle arms itself for the
  // coming answer; any other button acts at once. Only a `decision: true` module has buttons (the attention budget),
  // and never on an attack or an inserted question.
  // A power used on the question on screen (powers.js decides which ones show).
  const usePower = (id, q, api) => {
    if (!powerUsable(id, powerCtx(q, api))) return
    if (id === 'fifty') { const v = fiftyFifty(q.alt); if (!v) return; api.showChoices(v); aidedQ.current.add(q) }
    else if (id === 'hint') { api.hint(`📜 ${t('lg_scrollHint', { hint: powerHint((q.accepted || [])[0]) })}`); aidedQ.current.add(q) }
    else if (id === 'shield') setPA({ ...powerArmedRef.current, shield: true })
    else if (id === 'sharpen') setPA({ ...powerArmedRef.current, sharpen: true })
    else if (id === 'wind') {
      windUsed.current = true
      const next = { ...fsRef.current, livesLost: Math.max(0, fsRef.current.livesLost - 1) }
      fsRef.current = next
      setFs(next)
    }
    usedOnQ.current.add(q)
    usedRef.current = [...usedRef.current, id]
    setUsedN(usedRef.current.length)
  }
  const powerCtx = (q, api) => ({ q, asChoice: api.asChoice, phase: api.phase, bag: bagLeft, usedRun: usedRef.current.length, slots, usedOnQ: usedOnQ.current.has(q), livesLost: fsRef.current.livesLost, armed: powerArmedRef.current, windUsed: windUsed.current })
  const powerButtons = (q, api) => POWER_IDS.filter((id) => POWERS[id].kind !== 'siege' && bagLeft[id] > 0).map((id) => {
    const ok = powerUsable(id, powerCtx(q, api))
    return (
      <button key={`pw-${id}`} type="button" data-raid-power={id} disabled={!ok} onClick={() => usePower(id, q, api)}
        className="tip tip-b" data-tip={t(`lg_powDesc_${id}`)}
        style={{ fontFamily: FONT.body, fontSize: 12.5, fontWeight: 800, padding: '6px 10px', borderRadius: RADIUS.pill, border: `1.5px solid color-mix(in srgb, ${C.purple} 45%, transparent)`, background: 'transparent', color: C.purple, cursor: ok ? 'pointer' : 'default', opacity: ok ? 1 : 0.5 }}>
        {POWERS[id].icon} {t(`lg_pow_${id}`)} ×{bagLeft[id]}
      </button>
    )
  })
  const tools = (q, api) => {
    const powers = powerButtons(q, api)
    const list = reask(q) ? [] : (abMod?.decision ? (abMod?.actions?.(abS, { ...abCtx, mode: api.asChoice ? 'choice' : 'typed', q, armed }) || []) : []).filter(Boolean)
    if (!list.length && !powers.length) return null
    return [...powers, ...list.map((a) => {
      const col = TONE[a.tone] || C.purple
      const on = !!(a.toggle && (a.on ?? armed[a.id]))
      return (
        <ChunkyButton key={a.id} variant={on ? undefined : 'ghost'} color={col}
          disabled={api.phase !== 'answer' || a.enabled === false} onClick={() => press(a)} style={{ fontSize: 13, padding: '7px 12px' }}>
          {a.icon ? `${a.icon} ` : ''}{t(a.labelKey, a.vars || {})}
        </ChunkyButton>
      )
    })]
  }
  const leftNow = Math.max(0, dayHp - shown.damage)
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ maxWidth: 680, width: '100%', margin: '0 auto', position: 'sticky', top: 0, zIndex: 5, paddingTop: 4, background: C.bg }}>
        {testMotif && <TestTag t={t} />}
        <BossArena t={t} area={area} name={bossName} need={dayHp} lives={maxHearts} state={shown} phases={RAID.phases} ability={ability} dayAb={day?.ab || null} focus={focus} getZoom={ctx.getZoom} kind="raids" questionKey={questionKey} />
        {phase === 'fight' && <TauntBubble bubble={taunt.bubble} name={bossName} calm={focus} ctx={ctx} />}
        <FightNotice notice={fc.notice} t={t} />
      </div>
      {learnPanel}
      {phase === 'lap' && lapQs ? (
        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ maxWidth: 640, width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', boxSizing: 'border-box', padding: '10px 14px', borderRadius: RADIUS.md, border: `2px solid color-mix(in srgb, ${C.success} 45%, ${C.border})`, background: `color-mix(in srgb, ${C.success} 8%, ${C.surface})` }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 17, color: C.ink }}>🏁 {t('lg_raidLapTitle')}</div>
              <div style={{ fontSize: 13.5, color: C.inkDim, lineHeight: 1.45 }}>{t('lg_raidLapDesc')}</div>
              <LapProgress done={lapQs.filter((q) => firstHit.current.has(q._cardId)).length} total={lapQs.length} />
            </div>
            <ChunkyButton variant="ghost" color={C.inkDim} onClick={finishLap} style={{ fontSize: 13, padding: '7px 12px' }}>{t('lg_aftermathLater')}</ChunkyButton>
          </div>
          <QuizRunner questions={lapQs} t={t} ai={ai} subject={subject} ctx={ctx} confirm={ctx.confirm}
            title={`🏁 ${t('lg_raidLapTitle')}`} onAnswer={recordLap} judge={judge} feedbackExtra={missTools}
            onFinish={finishLap} onExit={leave} />
        </div>
      ) : phase === 'more' ? (
        <MoreCard t={t} name={bossName} left={leftNow} more={more} onContinue={continueRun} onStop={commit} />
      ) : outcome ? <BossEnd t={t} won={outcome === 'won'} onDone={commit} /> : (
        <QuizRunner key={seg} questions={segQs || questions} t={t} ai={ai} subject={subject} ctx={ctx} confirm={ctx.confirm}
          title={`⚔️ ${bossName}`} onAnswer={record} judge={judge} header={header} tools={tools}
          canUseChoices={(q) => !q._attack && fightPhase === 1}
          startChoices={() => fightRulesNow.answerStyle === 'choices'}
          onQuestion={() => { setQuestionKey((k) => k + 1); taunt.onQuestion() }}
          resolveQuestion={fc.resolveQuestion} feedbackExtra={missTools}
          onFinish={ranOut} onExit={leave} />
      )}
    </div>
  )
}

// "Continue?" under the arena: the run is out of questions, the boss lives, hearts are left.
function MoreCard({ t, name, left, more, onContinue, onStop }) {
  const n = more?.cards?.length || 0
  const looking = !more || more.cards === null
  return (
    <div data-raid-more="" role="dialog" aria-label={t('lg_raidOutTitle')} style={{ maxWidth: 560, width: '100%', margin: '0 auto', boxSizing: 'border-box', display: 'grid', gap: 10, justifyItems: 'center', textAlign: 'center',
      padding: '16px 18px', borderRadius: RADIUS.lg, border: `2px solid color-mix(in srgb, ${C.warning} 55%, ${C.border})`, background: `color-mix(in srgb, ${C.warning} 8%, ${C.surface})` }}>
      <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 20, color: C.ink }}>⏳ {t('lg_raidOutTitle')}</div>
      <div style={{ fontSize: 15, color: C.ink, lineHeight: 1.45 }}>
        {looking ? t('lg_raidOutLooking') : n ? tCount(t, 'lg_raidOutBody', n, { name, hp: left }) : t('lg_raidOutEmpty', { name, hp: left })}
      </div>
      {more?.busy && <div style={{ fontSize: 13, color: C.inkDim }}>{t('lg_raidOutWriting')}</div>}
      {more?.error && <div style={{ fontSize: 13, color: C.danger, fontWeight: 800 }}>{more.error}</div>}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        {n > 0 && <ChunkyButton color={C.danger} disabled={more.busy} onClick={onContinue}>⚔️ {t('lg_raidContinue')}</ChunkyButton>}
        <ChunkyButton variant={n > 0 ? 'ghost' : undefined} color={n > 0 ? C.inkDim : C.success} disabled={!!more?.busy} onClick={onStop}>{n > 0 ? t('lg_raidStop') : t('lg_bossSeeResult')}</ChunkyButton>
      </div>
    </div>
  )
}

// The Victory lap's progress: a small bar.
function LapProgress({ done, total }) {
  const pct = total ? Math.round((done / total) * 100) : 0
  return (
    <div aria-hidden="true" style={{ marginTop: 6, height: 8, borderRadius: RADIUS.pill, background: `color-mix(in srgb, ${C.success} 15%, ${C.surface})`, overflow: 'hidden', maxWidth: 260 }}>
      <div style={{ width: `${pct}%`, height: '100%', background: C.success, transition: 'width .3s ease' }} />
    </div>
  )
}

// The carried hearts: the boss's hearts (`max`), the lost ones greyed.
export function Hearts({ t, left, max = RAID.lives, size = 18 }) {
  return (
    <div role="img" aria-label={t('lg_livesAria', { n: left })} style={{ display: 'flex', gap: 3, fontSize: size }}>
      {Array.from({ length: max }, (_, i) => <span key={i} aria-hidden="true" style={{ filter: i >= left ? 'grayscale(1) opacity(.35)' : 'none' }}>❤️</span>)}
    </div>
  )
}

// The siege's carried state for the "no hearts" screen: hearts, the boss's health, when the next heart comes.
function SiegeLine({ t, raid }) {
  const s = raid?.siege
  if (!s) return null
  return (
    <div style={{ display: 'grid', gap: 4, justifyItems: 'center', textAlign: 'center', color: C.inkDim, fontWeight: 800 }}>
      <Hearts t={t} left={s.hearts} max={Math.max(s.hearts, raidProfile(raidMotif(raid)).hearts)} size={22} />
      <div>{t('lg_raidCarry', { hearts: s.hearts, max: Math.max(s.hearts, raidProfile(raidMotif(raid)).hearts), hp: Math.max(0, s.hp - s.damage), maxHp: s.hp })}</div>
      <div style={{ fontSize: 13, fontWeight: 700 }}>🏰 {t('lg_raidSiegeLine', { n: raidProfile(raidMotif(raid)).heal })}</div>
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

// THE POWER BAG (raids only, powers.js): what is in it, how many this boss allows per run, and the Bandage (used
// between runs). Before the first unlock it says how to earn powers. `compact`: the result screen's one-line form.
function PowerBag({ t, bag, wins, slots, test = false, compact = false, bandage = null, note = '', heal = 0 }) {
  const open = unlockedPowers(wins)
  const items = POWER_IDS.filter((id) => bag?.[id] > 0)
  if (!open.length && !test) {
    const nx = nextUnlock(wins)
    return nx ? <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', fontSize: 12.5, color: C.inkDim }}>🎒 {t('lg_powLocked', { n: nx.wins, name: t(`lg_pow_${nx.id}`) })}</div> : null
  }
  return (
    <div data-raid-bag="" style={{ maxWidth: 640, width: '100%', margin: '0 auto', boxSizing: 'border-box', display: 'grid', gap: 6, justifyItems: 'center', textAlign: 'center', padding: compact ? 0 : '8px 12px', borderRadius: RADIUS.md, border: compact ? 'none' : `1.5px solid color-mix(in srgb, ${C.purple} 35%, ${C.border})`, background: compact ? 'transparent' : `color-mix(in srgb, ${C.purple} 6%, ${C.surface})` }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: C.ink }}>
        🎒 {t('lg_powBag', { n: bagCount(bag), max: test ? POWER_IDS.length : bagSize(wins) })}{items.length ? ': ' : ''}
        {items.map((id) => <span key={id} className="tip tip-b" data-tip={t(`lg_powDesc_${id}`)} style={{ marginLeft: 6, whiteSpace: 'nowrap' }}>{POWERS[id].icon} {t(`lg_pow_${id}`)} ×{bag[id]}</span>)}
      </div>
      {!compact && <div style={{ fontSize: 12, color: C.inkDim }}>{t(slots === 1 ? 'lg_powSlotsOne' : 'lg_powSlots', { n: slots })}{test ? ` · ${t('lg_powTestBag')}` : ''}</div>}
      {bandage && <ChunkyButton variant="ghost" color={C.purple} onClick={bandage} style={{ fontSize: 13, padding: '6px 12px' }}>🩹 {t('lg_powBandageUse', { n: heal })}</ChunkyButton>}
      {note && <div role="status" style={{ fontSize: 12.5, fontWeight: 800, color: C.purple }}>{note}</div>}
    </div>
  )
}

// The powers a run found (random drops) and the next unlock.
function PowerDrops({ t, drops = [], wins = 0 }) {
  const nx = nextUnlock(wins)
  if (!drops.length && !nx) return null
  return (
    <div data-raid-drops="" style={{ display: 'grid', gap: 4, justifyItems: 'center' }}>
      {drops.length > 0 && <div style={{ fontWeight: 900, color: C.purple }}>🎁 {t('lg_powFound', { list: drops.map((id) => `${POWERS[id].icon} ${t(`lg_pow_${id}`)}`).join(', ') })}</div>}
      {nx && <div style={{ fontSize: 12.5, color: C.inkDim }}>{t('lg_powNext', { n: Math.max(0, nx.wins - wins), name: t(`lg_pow_${nx.id}`) })}</div>}
    </div>
  )
}

// A test fight's tag (cheat mode): `note` adds what it does and does not change.
function TestTag({ t, note = false }) {
  return (
    <div style={{ maxWidth: 640, width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
      <span data-raid-test="" style={{ fontSize: 12, fontWeight: 900, color: C.purple, border: `1.5px solid color-mix(in srgb, ${C.purple} 50%, transparent)`, background: `color-mix(in srgb, ${C.purple} 10%, ${C.surface})`, borderRadius: RADIUS.pill, padding: '1px 10px' }}>⚡ {t('lg_raidTestTag')}</span>
      {note && <span style={{ fontSize: 12.5, color: C.inkDim, lineHeight: 1.4 }}>{t('lg_raidTestNote')}</span>}
    </div>
  )
}
