// A RAID RUN: the raid boss fought with the deck's DUE cards, one question per card, with the Legends rules (fight.js)
// made harder (raid.js: 3 phases, choices only in phase 1). Every card's FIRST answer is recorded in Anki as a real
// review, whether the run is won, lost or left early.
// THE SIEGE (raid.js): the boss's wounds and the player's hearts carry over between runs and days; a run starts with
// the hearts left; a run that loses every heart makes the boss rally (it heals back part of that run's damage) and the
// hearts refill at once.
// A RUN THAT RUNS OUT OF QUESTIONS while the boss lives and hearts are left asks "Continue?" in the arena: the next
// due cards join the SAME fight (hearts, combo, ability state and phase kept). The answers so far are recorded first,
// so nothing is ever recorded twice. "Stop for now" ends the run (wounds and hearts carry over).
// NOTHING IS FORCED AFTER THE FIGHT: a win offers the next boss (out the same day, RAID.nextBossSameDay), an optional
// Victory lap over the cards the fight never reached (a reward round, recorded like any review, bonus XP) or Done; a
// loss or a stop leaves those cards due and says so.
import { ctxErrorText } from '../kit/aiError'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { C, FONT, RADIUS, SHADOW } from '../../config/tokens'
import { poseFile } from '../../config/shrimp'
import { srs } from '../../cards'
import { EVENTS } from '../events'
import { featureCfg, useActivityBusy } from '../registry'
import { useHelpEntry } from '../kit/useHelp'
import { ChunkyButton, EbiSays, Card, tCount } from '../ui'
import { QuizRunner, judgeStrike, recordReviews, recordPractice, studyBlock, studyBlockText, fightCtx, generationKey } from '../kit'
import FightSettings from './FightSettings'
import { PowerCastBadge } from './impact/PowerFx'
import LearnItPanel from '../kit/LearnItPanel'
import { useFightCheck, useBossTaunt, useArenaPin, TauntBubble, FightNotice, MissTools, Debrief } from './FightExtras'
import { FIGHT_EXTRAS, fightExtrasFor, expectedOf, isWrongish, learnItemFor, raidRefundOpen } from './fightCheck'
import { RAID_VOICES } from './raidVoices'
import { learnerLevelLine } from '../kit/learnerStore'
import { BossIntro, BossArena, BossEnd } from './BossArena'
import { LegendsArt } from './art'
import { act, settleFight, phaseOf, raidRating, attackLivesFor, abilityState, refundRunningFight, strikeCost, fightOutcome, newFight, tuneFight, rulesOf, abilityK } from './fight'
import { RAID, RAID_MOTIFS, RAID_ABILITY, todayKey, raidToday, raidStep, raidMotif, isRaidMotif, testRaidState, raidAttemptOutcome, raidHelpText, raidWhere, raidReviews, shapeRaid, siegeOf, raidAsked, raidMarkAsked, nextRaidCards, raidMinCards, raidOutOfQuestions, raidRunChoices, raidRunSize, applyBandage, siegeProfile } from './raid'
import { raidProfile } from './raidProfiles'
import { POWERS, POWER_IDS, POWER_DEFAULTS, powerVars, procVars, bossesBeaten, unlockedPowers, shapeLoadout, toggleLoadout, isFightPower, nextUnlock, powerUsable, powerAfterAnswer, powersHelpLine, fiftyFifty, powerHint } from './powers'
import { abilityById } from './abilities'
import { buildRaidPrompt, buildQuizCheckPrompt, parseQuizCheckWhy, RAID_ROLE, RAID_MAX_TOKENS, ROLE, MAX_TOKENS } from './prompt'
import { parseRaidQuestions, placeholderFor, reviewPlan, redoOutcome, finalQuestion, startOrder, REVIEW } from './raidQuestions'
import { tierOf } from '../../utils/questionTier'
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
  // The boss's own fight (raidProfiles.js, the one resolver): its hearts and heal, in the siege's variant (absent = normal).
  const profile = raidProfile(motif, raid?.siege?.variant)
  // The fight's rules (damage, phases...): the profile's, carried on the fight (tuneFight at load).
  const fightRules = rulesOf(fs)
  const maxHearts = Math.max(profile.hearts, raid?.siege?.hearts || 0)
  const startHearts = testMotif ? profile.hearts : raid?.siege ? raid.siege.hearts : profile.hearts
  // POWERS brought into this fight (powers.js): the loadout setting (features.legends.raidLoadout) shaped against the
  // different bosses beaten. A test fight brings every fight power and Steadfast to try.
  const beaten = testMotif ? 999 : bossesBeaten(storedRef.current)
  const loadoutRaw = featureCfg(ctx, LEGENDS_ID).raidLoadout
  // The power numbers of this fight (the profile's: a variant may weaken or strengthen powers; powers.js POWER_DEFAULTS).
  const pw = profile.powers
  const loadout = testMotif ? POWER_IDS.filter((id) => POWERS[id].kind !== 'siege') : shapeLoadout(loadoutRaw, beaten, pw.loadoutMax)
  const setLoadout = (id) => ctx.setFeatureSettings?.(LEGENDS_ID, { raidLoadout: toggleLoadout(loadoutRaw, id, beaten, pw.loadoutMax) })
  // Steadfast: extra hearts for this fight only, lost first (the siege's hearts are what is left after them).
  const extraHearts = loadout.includes('steadfast') ? pw.steadfast : 0
  const fightHearts = startHearts + extraHearts
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
  // The fight still takes a refund (fightCheck.js raidRefundOpen): its questions, the "Continue?" pause, and an ending
  // run until commit has read it after fc.settle (then refundsClosed).
  const refundsClosed = useRef(false)
  const fightLive = () => raidRefundOpen(phaseRef.current, refundsClosed.current)

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
    if (!FIGHT_EXTRAS.refund || !fightLive() || e.kind === 'aftermath') return false
    const next = refundRunningFight(fsRef.current, fightOver.current, { kind: e.kind, mode: e.mode, first: e.first, cost: e.cost }, to)
    if (!next) return false
    fsRef.current = next
    setFs(next)
    // The Shield power that took this wrongly judged answer's heart is up again.
    if (next.last?.shieldBack && powerArmedRef.current.shield === false) setPA({ ...powerArmedRef.current, shield: true })
    return true
  }
  const isOver = () => !fightLive() || !fightOver.current || !!fightOutcome(fsRef.current, fightOver.current)
  const fc = useFightCheck(ctx, { onOverturn, isOver })
  const voice = RAID_VOICES[motif] || null
  const taunt = useBossTaunt(ctx, { bossKey: `raid:${motif}`, voice: voice?.voice || '', sample: voice?.sample || '', bossName, enabled: tauntsOn })
  const [learn, setLearn] = useState(null) // the Learn-it panel's item (the fight waits under it)
  const openLearn = (e) => {
    setLearn(learnItemFor(cardsRef.current.find((c) => c.cardId === e.q?._cardId), e.q))
  }
  const learnPanel = learn && <LearnItPanel ctx={ctx} item={learn} onClose={() => setLearn(null)} closeLabel={phase === 'fight' ? t('lg_learnBackToFight') : undefined} />
  const learnOn = fightRulesNow.learnMoment !== false // the mode's Learn-it moments (one setting with Study)
  const overturnedFor = (q) => !!fc.entryFor(q)?.overturned // the strip turns green once a re-check / Appeal wins
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
  // `tier`: the question ladder's tier from Anki's schedule (utils/questionTier.js tierOf: type, queue, interval, reps,
  // all in the cardsInfo rows read here); the prompt uses it only while the ladder is on.
  const toCards = (picked) => picked.map((c) => ({ cardId: c.cardId, noteId: c.note, tier: tierOf(c), ...ctx.cards.noteText(c) })).filter((c) => c.front)
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
      // The fight runs on this boss's resolved tunables (its rules and ability K, in the siege's variant).
      const tunedFs = tuneFight(fsRef.current, siegeProfile(today.siege))
      fsRef.current = tunedFs
      setFs(tunedFs)
      if (!testMotif && today.day.won) { setPhase('beaten'); return }
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
    } catch (e) { if (alive.current) { setError(ctxErrorText(ctx, e)); setPhase('error') } }
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
    const pcards = promptCards(c, cards)
    const { system, user } = buildRaidPrompt(s, pcards, { level })
    const raw = c.ai.json(await c.ai.call(system, user, { role: RAID_ROLE, maxTokens: RAID_MAX_TOKENS }))
    if (my !== writeSeq.current) return null
    // One question per card (raidQuestions.js: parsed, typed with its choices as `alt`, the letter count, the tier).
    const { qs: got } = parseRaidQuestions(raw, pcards, { clean: c.ai.clean, isLanguage: !!s.isLanguage, speakLang: s.learnLangIso })
    if (got.length < Math.max(1, min)) throw new Error(t('lg_errQuiz'))
    // A card whose question was dropped keeps its place: the review's rewrite fills it, or the run skips it.
    const byCard = new Map(got.map((q) => [q._cardId, q]))
    const list = pcards.map((card) => byCard.get(card.cardId) || placeholderFor(card))
    runReview(list, pcards, my, level)
    return list
  }
  // THE QUESTION LADDER is on (one setting with Study): the cards keep their tiers in the prompt; off, none (today's question).
  const promptCards = (c, cards) => (c.fight?.rules?.questionLadder === false ? cards.map(({ tier, ...rest }) => rest) : cards)

  // THE REVIEW PASS (raidQuestions.js; the same check as Study and Legends, QUESTION_CHECK_RULES): one call for the batch,
  // in the BACKGROUND while the intro shows. Rejected questions (and cards with none) are written once more and reviewed
  // again; still bad = that card is not asked. Each card's state carries the write it belongs to (`w`), so a newer write
  // (a settings change on the intro) is never overwritten by an older review.
  const reviewState = useRef(new Map()) // cardId -> { s: 'pending'|'ok'|'redo'|'swap'|'drop', q?, w }
  const reviewDone = useRef(Promise.resolve())
  const runReview = (list, cards, my, level) => {
    const c = ctxRef.current
    const s = c.subject
    const st = reviewState.current
    for (const q of list) st.set(q._cardId, { s: q._redo ? 'redo' : 'pending', w: my })
    const mine = (id) => st.get(id)?.w === my
    const set = (id, v) => { if (mine(id)) st.set(id, { ...v, w: my }) }
    const check = async (qs, items) => {
      if (!qs.length) return new Map()
      try {
        const { system, user } = buildQuizCheckPrompt(s, items.map((x) => ({ kind: 'card', front: x.front, back: x.back, ...(x.tier != null ? { tier: x.tier } : {}) })), qs)
        return parseQuizCheckWhy(c.ai.json(await c.ai.call(system, user, { role: ROLE.quizCheck, maxTokens: MAX_TOKENS.quizCheck, silent: true })), qs.length)
      } catch { return null } // fail-soft: an unreviewed question still stands
    }
    reviewDone.current = (async () => {
      const real = list.filter((q) => !q._redo)
      const bad = await check(real, cards)
      // The verdict mapped back onto the whole list (placeholders are always rewritten).
      const badAt = bad ? new Map([...bad].map(([i, why]) => [list.indexOf(real[i]), why])) : null
      const plan = reviewPlan(list, badAt)
      for (const [id, v] of plan.state) set(id, v)
      const redo = plan.redo.filter((r) => mine(r.cardId))
      if (!redo.length) return
      const redoCards = redo.map((r) => cards.find((x) => x.cardId === r.cardId)).filter(Boolean)
      let fresh = []
      let bad2 = null
      try {
        const { system, user } = buildRaidPrompt(s, redoCards, { level, redo })
        fresh = parseRaidQuestions(c.ai.json(await c.ai.call(system, user, { role: RAID_ROLE, maxTokens: RAID_MAX_TOKENS, silent: true })), redoCards, { clean: c.ai.clean, isLanguage: !!s.isLanguage, speakLang: s.learnLangIso }).qs
        bad2 = await check(fresh, redoCards)
      } catch { fresh = [] }
      for (const [id, v] of redoOutcome(redo.map((r) => r.cardId), fresh, bad2)) set(id, v)
    })().catch(() => {})
    return reviewDone.current
  }
  // The questions a batch STARTS with: the review waited for (at most REVIEW.waitMs, longer only when nothing else
  // could be asked first), replacements in, rejected ones out.
  const reviewedStart = async (list) => {
    await Promise.race([reviewDone.current, new Promise((r) => setTimeout(r, REVIEW.waitMs))])
    let out = startOrder(list, reviewState.current)
    if (!out.length || finalQuestion(out[0], reviewState.current) == null) { await reviewDone.current; out = startOrder(list, reviewState.current) }
    return out.filter((q, i) => i > 0 || finalQuestion(q, reviewState.current) != null)
  }
  const [checking, setChecking] = useState(false)
  const startFight = async () => {
    if (rewriting || checking) return
    setChecking(true)
    const list = await reviewedStart(segQs || questions || [])
    if (!alive.current) return
    setChecking(false)
    if (!list.length) { setError(t('lg_errQuiz')); setPhase('error'); return }
    setSegQs(list)
    setPhase('fight')
  }
  // A question as the run reaches it: an attack's own resolution first (fightCheck), then the review's verdict.
  const resolveQ = (raw) => { const r = fc.resolveQuestion(raw); return r ? finalQuestion(r, reviewState.current) : r }
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
    }).catch((e) => { if (alive.current) { setRewriting(false); setError(ctxErrorText(ctx, e)); setPhase('error') } })
  }, [genKey, phase]) // eslint-disable-line react-hooks/exhaustive-deps
  const started = useRef(false)
  useEffect(() => { if (!started.current) { started.current = true; load() } }, []) // eslint-disable-line react-hooks/exhaustive-deps
  // The deck picked in the fight settings before the fight: the due cards come from it.
  useEffect(() => {
    if (!started.current || !deck || deck === deckRef.current || firstHit.current.size) return
    if (['intro', 'none', 'error', 'beaten'].includes(phase)) load()
  }, [deck]) // eslint-disable-line react-hooks/exhaustive-deps
  // A new run size on the intro: the run takes that many cards (read again, questions written again).
  const runSizeAt = useRef(runSize)
  useEffect(() => {
    if (runSizeAt.current === runSize) return
    runSizeAt.current = runSize
    if (started.current && !firstHit.current.size && ['intro', 'none'].includes(phase)) load()
  }, [runSize]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── POWERS (powers.js; raids only) ──
  // Each power brought works once per fight (this RaidRun; "Fight again" remounts it).
  const usedRef = useRef([]) // the powers this fight used
  const [, setUsedN] = useState(0) // re-renders the power buttons after a use
  const usedOnQ = useRef(new WeakSet()) // questions a power was used on (one per question)
  const aidedQ = useRef(new WeakSet()) // questions a 50:50 or hint helped with (recorded as Hard)
  const [powerArmed, setPowerArmed] = useState({}) // { shield, sharpen, ward } true; window powers: raid questions left
  const powerArmedRef = useRef({})
  const setPA = (v) => { powerArmedRef.current = v; setPowerArmed(v) }
  const [powerCast, setPowerCast] = useState(null) // { id, n }: the power just used, for the arena's burst
  const [powerProc, setPowerProc] = useState(null) // { id, n }: a brought power that just did something on an answer
  const proc = (id) => setPowerProc((p) => ({ id, n: (p?.n || 0) + 1, vars: procVars(id, pw, fightRules.damage) }))
  const [bandageNote, setBandageNote] = useState('')
  const [bandageDone, setBandageDone] = useState(false) // used and saved (a failed save keeps the button to retry)
  // Worth offering: brought, not used tonight, and the boss has wounds to keep (on an unhurt boss it was wasted).
  const bandageWorth = !testMotif && loadout.includes('bandage') && !!(raid?.siege && raid.siege.bandage !== todayKey() && (raid.siege.damage || 0) > 0)
  const bandageNow = async () => {
    if (testMotif) return
    const next = await updateRaid(modeId, (cur) => applyBandage(cur, todayKey()) || cur)
    if (!alive.current) return
    if (next && applyBandage(next, todayKey()) === null && next.siege?.bandage === todayKey()) {
      storedRef.current = next
      setRaid((r) => (r ? { ...r, siege: { ...r.siege, bandage: todayKey() } } : r))
      setSavedRaid((s) => (s ? next : s))
      setBandageDone(true)
      setPowerCast((p) => ({ id: 'bandage', n: (p?.n || 0) + 1, vars: powerVars('bandage', pw, fightRules.damage) }))
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
    return (questions || []).map((q) => finalQuestion(q, reviewState.current)).filter((q) => q && q._cardId != null && !firstHit.current.has(q._cardId) && !seen.has(q._cardId) && seen.add(q._cardId))
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
    refundsClosed.current = true // what is read below is what gets saved: a later overturn fixes only the grade
    // An ability holding damage (a bank, a gauge, moons in orbit) lets it go when the fight ends (abilities: settle).
    const st = settleFight(fsRef.current, { ability, need: dayNow ? Math.max(1, dayNow.hp - dayNow.damage) : 1, lives: fightHearts, bar: { total: dayNow ? dayNow.hp : 1, before: dayNow ? dayNow.damage : 0, phases: rulesOf(fsRef.current).phases }, dayAb: dayNow?.ab || null })
    fsRef.current = st
    await recordSoFar()
    const hits = reportRecorded()
    const dayAb = abMod?.dayState ? abMod.dayState(st, { K: abilityK(abMod, st), rules: rulesOf(st) }) : undefined
    // Steadfast's extra hearts go first: the siege loses only what the fight lost beyond them.
    const opts = { date, damage: st.damage, livesLost: Math.max(0, st.livesLost - extraHearts), asked: answeredNotes(), dayAb, due: dueAtStart.current, motif }
    let outcome = { won: false, firstWin: false }
    let next = null
    if (testMotif) outcome = raidAttemptOutcome(null, { ...opts, test: testMotif })
    else {
      next = await updateRaid(modeId, (cur) => {
        const res = raidAttemptOutcome(cur, opts)
        outcome = res
        return res.state
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
      hearts: testMotif ? Math.max(0, startHearts - Math.max(0, st.livesLost - extraHearts)) : won ? raidProfile(next ? raidMotif(next) : motif).hearts : after?.siege?.hearts ?? 0,
      maxHearts,
      hp: won ? 0 : (dayNow?.hp || 0),
      // The health left is the SAVED siege's (a run that lost every heart let the boss rally back part of its damage).
      left: won ? 0 : after?.siege ? Math.max(0, after.siege.hp - after.siege.damage) : Math.max(0, (dayNow?.hp || 0) - (dayNow?.damage || 0) - st.damage),
      // A rally that was not saved did not happen (the save failed: the stored siege is unchanged).
      rallied: !won && outcome.fell && (testMotif || next !== undefined) ? (outcome.rallied || 0) : null,
      unasked: unaskedQs().length, dueLeft, nextMotif: won && next ? raidMotif(next) : '',
      // Powers: different bosses beaten now (a first win may unlock one).
      beatenBefore: beaten, beaten: testMotif ? beaten : bossesBeaten(next || storedRef.current),
      bandageOk: !!(next && applyBandage(next, todayKey())),
    })
    setPhase('done')
  }
  // Leaving by the sidebar, the Practice hub or a mode switch unmounts the raid: what was answered is still saved.
  const commitRef = useRef(commit)
  commitRef.current = commit
  const lapEndRef = useRef(null)
  // Decided one tick later: a hot reload (Fast Refresh) and StrictMode run this cleanup on a raid that stays on screen
  // and mount it again at once (`alive` true again). Saving there ended a running fight after one answer: "The boss
  // won" over 14 cards never asked.
  useEffect(() => () => {
    setTimeout(() => {
      if (alive.current) return
      if (firstHit.current.size && !committed.current) commitRef.current()
      else if (lapEndRef.current) lapEndRef.current()
    }, 0)
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
    if (raidOutOfQuestions({ damage: st.damage, need, livesLost: st.livesLost, lives: fightHearts, next: 1 }) === 'over') { commit(); return }
    setMore({ cards: null, busy: false, error: '' })
    setPhase('more')
    try {
      const picked = nextRaidCards(await readDue(), { asked: askedBefore.current, inRun: cardsRef.current.map((c) => c.noteId), max: runSize })
      // Their schedule BEFORE any review (what a fallback interval and a later correction step from).
      for (const c of picked) if (!preRef.current.has(c.cardId)) preRef.current.set(c.cardId, { interval: c.interval, factor: c.factor })
      if (alive.current) setMore({ cards: toCards(picked), busy: false, error: '' })
    } catch (e) { if (alive.current) setMore({ cards: [], busy: false, error: ctxErrorText(ctx, e) }) }
  }
  const continueRun = async () => {
    const cards = more?.cards || []
    if (!cards.length || more.busy) return
    setMore({ ...more, busy: true, error: '' })
    // The answers so far go to Anki first: the next batch can never record one of them again.
    recordSoFar()
    try {
      const written = await writeQuestions(cards, 1)
      const qs = written ? await reviewedStart(written) : null
      // Ended meanwhile (a re-check during "Continue?" gave back the damage that beat the boss, and its result was taken).
      if (!alive.current || !qs || committed.current) return
      if (!qs.length) throw new Error(t('lg_errQuiz'))
      cardsRef.current = [...cardsRef.current, ...cards]
      pendingRef.current = []
      pos.current = -1
      setQuestions((all) => [...(all || []), ...written])
      setSegQs(qs)
      setSeg((n) => n + 1)
      setMore(null)
      setPhase('fight')
    } catch (e) { if (alive.current) setMore({ cards, busy: false, error: ctxErrorText(ctx, e) }) }
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
  // The arena pins to the top of the screen while the questions scroll, as much of it as fits (useArenaPin: on a short
  // or zoomed screen the taunt and notice scroll with the question, or nothing pins).
  const arenaRef = useRef(null)
  const extrasRef = useRef(null)
  const arenaShown = phase === 'fight' || phase === 'more' || phase === 'lap'
  const pin = useArenaPin(arenaRef, extrasRef, arenaShown)
  // Ebi's Help: the fight's state on screen (raid.js raidHelpText: never an answer; QuizRunner reports the question).
  const helpDay = raid?.day
  const running = phase === 'fight' || phase === 'more' || phase === 'lap'
  const helpLeft = phase === 'done' && summary ? summary.left : helpDay ? Math.max(0, helpDay.hp - helpDay.damage - (running ? fs.damage : 0)) : 0
  const helpAbility = ability ? `${t(`lg_ability_${ability}`)}: ${t(`lg_abilityDesc_${ability}`)}` : ''
  useHelpEntry(ctx, 'raid', raidHelpText({
    view: phase, boss: summary?.bossName || bossName, ability: helpAbility, test: !!testMotif, lives: phase === 'done' && summary ? maxHearts : maxHearts + extraHearts,
    powers: powersHelpLine(loadout, usedRef.current, powerArmed), powerNums: pw,
    hpLeft: helpLeft, hpMax: helpDay?.hp || 0,
    livesLeft: phase === 'done' && summary ? summary.hearts : Math.max(0, fightHearts - (running ? fs.livesLost : 0)),
    phase: helpDay ? phaseOf(helpLeft, helpDay.hp, fightRules.phases) : 1,
    asked: firstHit.current.size, total: (questions || []).filter((q) => !q._redo).length,
    lapLeft: lapQs ? lapQs.filter((q) => !firstHit.current.has(q._cardId)).length : 0,
    nextCards: more?.cards?.length || 0,
    result: summary ? { ...summary, recorded: recordedRef.current.size, failed: failedRef.current.size } : null,
  }), ctx.activeTab || 'practice', raidWhere({ view: phase, boss: summary?.bossName || bossName, test: !!testMotif }), 3)

  if (phase === 'loading') return <div style={{ maxWidth: 560, margin: '60px auto' }}><EbiSays pose={poseFile('weapon')}>{t('lg_raidLoading')}</EbiSays></div>
  if (phase === 'error' || phase === 'none' || phase === 'beaten') {
    const text = phase === 'error' ? error : phase === 'none' ? t(siegeOf(storedRef.current) ? 'lg_raidNoneLeft' : 'lg_raidTooFew', { n: RAID.minCards }) : t('lg_raidBeatenToday')
    return (
      <div style={{ maxWidth: 560, margin: '40px auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 14 }}>
        <EbiSays pose={poseFile(phase === 'beaten' ? 'party' : 'confused')}>{text}</EbiSays>
        <Trophies ctx={ctx} raid={raid} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-end' }}>
          <ChunkyButton variant="ghost" color={C.inkDim} onClick={onExit}>{t('lg_back')}</ChunkyButton>
          {phase === 'error' && studyBlocked && ctx.study?.open && <ChunkyButton variant="ghost" color={C.brand} onClick={() => ctx.study.open()}>{t('call_openStudy')}</ChunkyButton>}
          {phase === 'error' && <ChunkyButton color={C.success} onClick={load}>{t('lg_retry')}</ChunkyButton>}
        </div>
      </div>
    )
  }
  if (phase === 'intro') {
    const realCount = (questions || []).filter((q) => !q._redo).length
    return (
      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'minmax(0, 1fr)' }}>
        {testMotif && <TestTag t={t} note />}
        <BossIntro t={t} area={area} name={bossName} total={realCount} kind="raids" raidLives={maxHearts} raidLeft={startHearts} ability={ability} calm={focus} onFight={startFight} />
        {checking && <div role="status" data-raid-checking="" style={{ textAlign: 'center', fontSize: 13, fontWeight: 800, color: C.purple }}>🔎 {t('lg_raidChecking')}</div>}
        <FightSettings ctx={ctx} allowStyle busy={rewriting} runSize={runSizeOpt} />
        <PowerLoadout t={t} beaten={beaten} loadout={loadout} onToggle={testMotif ? null : setLoadout} test={!!testMotif}
          bandage={!day?.won && bandageWorth && !bandageDone ? bandageNow : null} note={bandageNote} heal={profile.heal} cast={powerCast?.id === 'bandage' ? powerCast : null} pw={pw} damage={fightRules.damage} />
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', fontSize: 13.5, color: C.inkDim, lineHeight: 1.5 }}>
          {t('lg_raidRules', { n: realCount, lives: fightHearts })}{day?.damage ? ` ${t('lg_raidWounded', { hp: day.hp - day.damage, max: day.hp })}` : ''}
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
            {summary.rallied != null && <div style={{ fontWeight: 800, color: C.warning }}>💔 {t('lg_raidRallied', { name: summary.bossName, n: summary.rallied })}</div>}
          </div>
        )}
        {summary.lap > 0 && <div style={{ fontWeight: 800, color: C.success }}>🏁 {tCount(t, 'lg_raidLapDone', summary.lap)}</div>}
        {!testMotif && <PowerUnlocks t={t} before={summary.beatenBefore} beaten={summary.beaten} />}
        {!testMotif && !summary.won && loadout.includes('bandage') && (summary.bandageOk || bandageDone) && (
          <PowerLoadout t={t} beaten={summary.beaten} loadout={loadout} compact bandage={bandageDone ? null : bandageNow} note={bandageNote} heal={profile.heal} cast={powerCast?.id === 'bandage' ? powerCast : null} pw={pw} damage={fightRules.damage} />
        )}
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
  const lives = fightHearts
  const outcome = fs.damage >= need ? 'won' : fs.livesLost >= lives ? 'lost' : ''
  // The bar and the phases follow the siege's whole health: earlier runs' wounds are already dealt.
  const dayHp = day ? day.hp : need
  // The hearts row: the siege's hearts (Steadfast's extra ones show apart, as gold hearts, and are lost first).
  const shown = { ...fs, damage: fs.damage + (day ? day.damage : 0), livesLost: Math.max(0, fs.livesLost - extraHearts) + (maxHearts - startHearts) }
  const fightPhase = phaseOf(Math.max(0, dayHp - shown.damage), dayHp, fightRules.phases)
  const bar = { total: dayHp, before: day ? day.damage : 0, phases: fightRules.phases }
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
    if (verdict === 'miss' && !info.skipped) taunt.onMiss(q, answer, expectedOf(q))
    const armedNow = armedRef.current
    if (Object.keys(armedNow).length) setArmed({})
    const pa = powerArmedRef.current
    const { next, groups, boost } = raidStep(before, q, { verdict, mode, attackQ: info.attackQ, aid, aided }, {
      ability, need, lives, dayHp, dayBefore: day ? day.damage : 0, dayAb: day?.ab || null, pos: pos.current, questions, armed: Object.keys(armedNow).length ? armedNow : null,
      shield: !!pa.shield, sharpen: !!pa.sharpen, ward: !!pa.ward && !!q._attack,
      focus: pa.focus > 0, momentum: pa.momentum > 0, fury: pa.fury > 0, siphon: pa.siphon > 0,
    })
    // What each power did on this answer, and what is left of it (powerAfterAnswer, powers.js).
    const after = powerAfterAnswer(pa, { last: next.last, kind, ward: !!q._attack })
    if (after.changed) setPA(after.armed)
    if (after.proc) proc(after.proc)
    // Steadfast's extra hearts are lost first: its flourish when one goes.
    if (extraHearts && next.livesLost > before.livesLost && before.livesLost < extraHearts) proc('steadfast')
    fsRef.current = next
    setFs(next)
    // An aided answer (50:50, Hint) was struck like a choice, so an overturn refunds it like one (1, not a clean 2).
    fc.attach(aid, { cost: { ...strikeCost(before, next), ...(boost && Object.keys(boost).length ? { boost } : {}) }, kind, mode: aided ? 'choice' : mode, cardId: q._cardId })
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
    // Only languages that write accents grade them (a general mode grades understanding: Quebec for Québec is clean).
    const j = await judgeStrike(ai, subject, q, ans, { strictAccents: !!subject.accents && subject.strictAccents !== false })
    if (j.verdict === 'error') return { error: true } // could not be checked: QuizRunner asks to try again
    // The verdict lands at once; the note (and a glancing slip's follow-up) arrive later, and a miss or glancing
    // verdict is looked at again in the background (useFightCheck).
    const aid = fc.open(q, ans, 'typed', j)
    const attackQ = q._aftermath ? null : j.attack || (j.fixLater ? { pending: aid } : null)
    return {
      correct: j.verdict !== 'miss', partial: j.verdict === 'glancing', note: j.note || '', accent: !!j.accent && j.verdict !== 'miss',
      // A 50:50 or Hint helped: struck like a choice (1) and recorded as Hard, so never called a power strike.
      title: q._aftermath ? '' : j.verdict === 'clean' ? t(aidedQ.current.has(q) ? 'lg_strikeAided' : 'lg_strikeClean') : j.verdict === 'glancing' ? t('lg_strikeGlancing') : '',
      info: { verdict: j.verdict, attackQ, aid }, later: j.later,
    }
  }
  // The ability's view of the fight, for its hint, banner and buttons (abilities/<motif>.js).
  const abCtx = { phase: fightPhase, need, lives, livesLeft: lives - fs.livesLost, damage: fs.damage, bar, dayAb: day?.ab || null, K: abilityK(abMod, fs), rules: fightRules }
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
          {mode === 'choice' ? `🛡 ${t('lg_strikeSafeHint', { n: fightRules.damage.choice })}` : aidedQ.current.has(q) ? `🤝 ${t('lg_strikeAidedHint', { n: fightRules.damage.choice })}` : `💥 ${t('lg_strikePowerHint', { n: fightRules.damage.clean })}`}
        </div>
        {tagChip(q, mode)}
      </div>
      {armedList(powerArmed).length > 0 && (
        <div data-raid-armed="" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 12, fontWeight: 900, color: C.purple }}>
          {armedList(powerArmed).map(([id, v]) => (
            <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <PowerIcon id={id} size={16} /> {v === true ? t(`lg_powUp_${id}`, powerVars(id, pw, fightRules.damage)) : tCount(t, 'lg_powLeft', v, { n: v, name: t(`lg_pow_${id}`) })}
            </span>
          ))}
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
    else if (id === 'shield' || id === 'sharpen' || id === 'ward') setPA({ ...powerArmedRef.current, [id]: true })
    else if (POWERS[id]?.window) setPA({ ...powerArmedRef.current, [id]: pw.window })
    else if (id === 'wind') {
      const cur = fsRef.current
      // A heart back, and the arena's Second wind moment (strikeFx.js 'wind'; its own counter, so no hit replays).
      const back = Math.min(cur.livesLost, pw.wind)
      const next = { ...cur, livesLost: cur.livesLost - back, last: { ...(cur.last || { n: cur.n || 0 }), kind: 'wind', heartsBack: back, damage: 0, lives: 0, crit: false, shielded: false, fx: '', wn: (cur.last?.wn || 0) + 1 } }
      fsRef.current = next
      setFs(next)
    }
    if (id !== 'wind') setPowerCast((p) => ({ id, n: (p?.n || 0) + 1, vars: powerVars(id, pw, fightRules.damage) }))
    usedOnQ.current.add(q)
    usedRef.current = [...usedRef.current, id]
    setUsedN(usedRef.current.length)
  }
  const powerCtx = (q, api) => ({ q, asChoice: api.asChoice, phase: api.phase, loadout, used: usedRef.current, usedOnQ: usedOnQ.current.has(q), livesLost: fsRef.current.livesLost, armed: powerArmedRef.current })
  // Every brought fight power, behind ONE "Powers" button (the owner: a row of a button per power crowded the answer
  // tools). The menu lists each with what it does; a used one stays greyed (once per fight), so the player sees what is left.
  const powerButtons = (q, api) => {
    const items = loadout.filter(isFightPower).map((id) => ({
      id, ok: powerUsable(id, powerCtx(q, api)), used: usedRef.current.includes(id),
      name: t(`lg_pow_${id}`), desc: t(`lg_powDesc_${id}`, powerVars(id, pw, fightRules.damage)),
    }))
    if (!items.length) return []
    return [<PowersMenu key="powers" t={t} items={items} onUse={(id) => usePower(id, q, api)} />]
  }
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
  const arenaExtras = (
    <div ref={extrasRef} data-arena-extras="" style={{ maxWidth: 680, width: '100%', margin: '0 auto' }}>
      {phase === 'fight' && <TauntBubble bubble={taunt.bubble} name={bossName} calm={focus} ctx={ctx} />}
      <FightNotice notice={fc.notice} t={t} />
    </div>
  )
  return (
    <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'minmax(0, 1fr)' }}>
      <div ref={arenaRef} data-raid-arena-pin={pin.mode} style={{ maxWidth: 680, width: '100%', margin: '0 auto', ...(pin.sticky ? { position: 'sticky', top: pin.top, zIndex: 5 } : {}), paddingTop: 4, background: C.bg }}>
        {testMotif && !pin.slim && <TestTag t={t} />}
        <BossArena t={t} area={area} name={bossName} need={dayHp} lives={maxHearts} state={shown} phases={fightRules.phases} ability={ability} dayAb={day?.ab || null} focus={focus} getZoom={ctx.getZoom} kind="raids" slim={pin.slim} questionKey={questionKey} power={powerCast?.id === 'bandage' ? null : powerCast} armed={{ ...powerArmed, ...(extraHearts ? { steadfast: Math.max(0, extraHearts - fs.livesLost) } : {}) }} proc={powerProc} />
        {pin.extrasIn && arenaExtras}
      </div>
      {testMotif && pin.slim && <TestTag t={t} />}
      {!pin.extrasIn && arenaExtras}
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
            title={`🏁 ${t('lg_raidLapTitle')}`} onAnswer={recordLap} judge={judge} feedbackExtra={missTools} overturnedFor={overturnedFor}
            onFinish={finishLap} onExit={leave} />
        </div>
      ) : phase === 'more' && !outcome ? (
        <MoreCard t={t} name={bossName} left={leftNow} more={more} onContinue={continueRun} onStop={commit} />
      ) : outcome ? <BossEnd t={t} won={outcome === 'won'} onDone={commit} lostKey={testMotif ? 'lg_bossLost' : 'lg_raidBossLost'} /> : (
        <QuizRunner key={seg} questions={segQs || questions} t={t} ai={ai} subject={subject} ctx={ctx} confirm={ctx.confirm}
          title={`⚔️ ${bossName}`} onAnswer={record} judge={judge} header={header} tools={tools}
          canUseChoices={(q) => !!q.alt}
          startChoices={() => fightRulesNow.answerStyle === 'choices'}
          onQuestion={() => { setQuestionKey((k) => k + 1); taunt.onQuestion() }}
          resolveQuestion={resolveQ} feedbackExtra={missTools} overturnedFor={overturnedFor}
          onFinish={ranOut} onExit={leave} />
      )}
    </div>
  )
}

// "Continue?" under the arena: the run is out of questions, the boss lives, hearts are left.
function MoreCard({ t, name, left, more, onContinue, onStop }) {
  const n = more?.cards?.length || 0
  const looking = !more || more.cards === null
  // A dialog takes the focus once its answer is known (the quiz that had it is gone): Continue, else See the result.
  const boxRef = useRef(null)
  useEffect(() => { if (!looking) boxRef.current?.querySelector('button:not([disabled])')?.focus({ preventScroll: true }) }, [looking])
  return (
    <div ref={boxRef} data-raid-more="" role="dialog" aria-label={t('lg_raidOutTitle')} style={{ maxWidth: 560, width: '100%', margin: '0 auto', boxSizing: 'border-box', display: 'grid', gap: 10, justifyItems: 'center', textAlign: 'center',
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

// The raid hall: every raid boss beaten, the newest first.
function Trophies({ ctx, raid }) {
  const { t } = ctx
  const list = shapeRaid(raid).trophies.slice().reverse()
  if (!list.length) return null
  return (
    <Card title={`🏆 ${t('lg_raidHall')}`} style={{ width: '100%', boxSizing: 'border-box' }}>
      <div role="list" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        {list.slice(0, 20).map((x, i) => {
          // The drawing alone named nobody (only the date showed): the boss's name is the tooltip and what a screen
          // reader hears. A trophy of a retired boss (or one from a newer build) keeps its place, drawn as a plain
          // cup: no art fetch.
          const known = isRaidMotif(x.motif)
          const name = known ? t(`lg_raidBoss_${x.motif}`) : t('lg_raidRetired')
          return (
            <div key={i} role="listitem" data-trophy={x.motif} aria-label={`${name} · ${x.date}`} className="tip" data-tip={name}
              style={{ display: 'grid', justifyItems: 'center', gap: 2, fontSize: 11, fontWeight: 800, color: C.inkDim }}>
              {known
                ? <LegendsArt kind="raids" motif={x.motif} palette="night" height={48} width={48} round={0} room />
                : <div aria-hidden="true" style={{ width: 48, height: 48, display: 'grid', placeItems: 'center', fontSize: 30 }}>🏆</div>}
              <span aria-hidden="true">{x.date}</span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// A power's icon: the drawn badge (public/assets/legends/powers/<id>.svg), the emoji when it cannot load.
// The fight's powers behind one button: a small menu above it (closes on a pick, Esc or a click outside).
export function PowersMenu({ t, items, onUse }) {
  const [open, setOpen] = useState(false)
  const boxRef = useRef(null)
  const ready = items.filter((x) => x.ok).length
  // Slid left as far as needed to stay on screen (the button can sit near the right edge on a phone). Rects are real
  // px; the menu's own offset is layout px (divided by the app zoom).
  const [shift, setShift] = useState(0)
  useLayoutEffect(() => {
    if (!open || !boxRef.current) return
    const z = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--app-zoom')) || 1
    const r = boxRef.current.getBoundingClientRect()
    const w = Math.min(320, window.innerWidth / z - 32) * z
    setShift(Math.min(0, (window.innerWidth - 16 - (r.left + w)) / z))
  }, [open])
  // A list taller than the menu says so (the owner missed that it scrolls): a fade at the cut edges and a "N more"
  // bar at the bottom that scrolls on a click. `below` = powers not fully in view under the fold.
  const listRef = useRef(null)
  const [edges, setEdges] = useState({ up: false, below: 0 })
  const measure = () => {
    const el = listRef.current
    if (!el) return
    const bottom = el.getBoundingClientRect().bottom - 2
    const below = [...el.children].filter((c) => c.getBoundingClientRect().bottom > bottom).length
    const up = el.scrollTop > 2
    setEdges((e) => (e.up === up && e.below === below ? e : { up, below }))
  }
  useLayoutEffect(() => { if (open) measure() }, [open, items.length])
  useEffect(() => {
    if (!open) return undefined
    const away = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false) }
    const esc = (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setOpen(false) } }
    document.addEventListener('pointerdown', away, true)
    window.addEventListener('keydown', esc, true)
    return () => { document.removeEventListener('pointerdown', away, true); window.removeEventListener('keydown', esc, true) }
  }, [open])
  return (
    <span ref={boxRef} style={{ position: 'relative', display: 'inline-flex' }}>
      <button type="button" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((o) => !o)} data-raid-powers=""
        style={{ fontFamily: FONT.body, fontSize: 13, fontWeight: 800, padding: '7px 12px', borderRadius: RADIUS.pill, border: `1.5px solid color-mix(in srgb, ${C.purple} 55%, transparent)`, background: open ? `color-mix(in srgb, ${C.purple} 14%, transparent)` : 'transparent', color: C.purple, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        ⚡ {t('lg_powMenu')} <span style={{ fontSize: 11.5, padding: '1px 7px', borderRadius: RADIUS.pill, background: `color-mix(in srgb, ${C.purple} 22%, transparent)` }}>{ready}/{items.length}</span> {open ? '▴' : '▾'}
      </button>
      {open && (
        <div style={{ position: 'absolute', left: shift, bottom: 'calc(100% + 8px)', zIndex: 40, width: 'min(320px, calc(100vw / var(--app-zoom, 1) - 32px))',
          borderRadius: RADIUS.lg, background: C.surfaceRaised, border: `1px solid ${C.border}`, boxShadow: SHADOW.lg, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ position: 'relative', minHeight: 0 }}>
            <div ref={listRef} role="menu" onScroll={measure} className="lg-pow-list"
              style={{ maxHeight: 'min(360px, calc(60vh / var(--app-zoom, 1)))', overflowY: 'auto', padding: 6, display: 'grid', gap: 2, scrollbarGutter: 'stable' }}>
              {items.map((x) => (
                <button key={x.id} type="button" role="menuitem" data-raid-power={x.id} disabled={!x.ok} onClick={() => { onUse(x.id); setOpen(false) }}
                  style={{ display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr)', gap: 10, alignItems: 'center', textAlign: 'left', padding: '7px 9px', borderRadius: RADIUS.md, border: 'none', background: 'transparent', color: C.ink, cursor: x.ok ? 'pointer' : 'default', opacity: x.ok ? 1 : 0.5, fontFamily: FONT.body }}>
                  <PowerIcon id={x.id} size={26} />
                  <span style={{ display: 'grid', gap: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 800, color: C.purple }}>{x.name}{x.used ? ' ✓' : ''}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.inkDim, lineHeight: 1.3 }}>{x.desc}</span>
                  </span>
                </button>
              ))}
            </div>
            {edges.up && <div aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 28, pointerEvents: 'none', background: `linear-gradient(to bottom, ${C.surfaceRaised}, transparent)` }} />}
            {edges.below > 0 && <div aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 28, pointerEvents: 'none', background: `linear-gradient(to top, ${C.surfaceRaised}, transparent)` }} />}
          </div>
          {edges.below > 0 && (
            <button type="button" data-pow-more="" onClick={() => listRef.current?.scrollBy({ top: listRef.current.clientHeight * 0.7, behavior: 'smooth' })}
              style={{ flex: 'none', border: 'none', borderTop: `1px solid ${C.border}`, borderRadius: 0, background: `color-mix(in srgb, ${C.purple} 10%, transparent)`, color: C.purple, fontFamily: FONT.body, fontSize: 12.5, fontWeight: 800, padding: '7px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <span className="lg-pow-bob" aria-hidden="true">▾</span> {tCount(t, 'lg_powMore', edges.below)}
            </button>
          )}
          <style>{'.lg-pow-list::-webkit-scrollbar { width: 8px } .lg-pow-list::-webkit-scrollbar-thumb { background: color-mix(in srgb, var(--c-purple) 45%, transparent); border-radius: 8px } .lg-pow-bob { display: inline-block; animation: lgPowBob 1.1s ease-in-out infinite } @keyframes lgPowBob { 0%, 100% { transform: translateY(-1px) } 50% { transform: translateY(2px) } } @media (prefers-reduced-motion: reduce) { .lg-pow-bob { animation: none } }'}</style>
        </div>
      )}
    </span>
  )
}
function PowerIcon({ id, size = 18 }) {
  const [broken, setBroken] = useState(false)
  if (broken || !POWERS[id]) return <span aria-hidden="true" style={{ fontSize: size * 0.85, lineHeight: 1 }}>{POWERS[id]?.icon}</span>
  return <img src={`/assets/legends/powers/${id}.svg`} alt="" width={size} height={size} draggable={false} onError={() => setBroken(true)} style={{ display: 'inline-block', verticalAlign: 'middle', flex: 'none' }} />
}
// The powers armed now, in POWER_IDS order: [id, true | questions left].
const armedList = (armed = {}) => POWER_IDS.filter((id) => id !== 'steadfast' && (armed[id] === true || armed[id] > 0)).map((id) => [id, armed[id]])

// THE LOADOUT (raids only, powers.js): every power, unlocked ones as tiles to bring (up to `pw.loadoutMax`), locked ones
// with how many different bosses unlock them, and the Bandage (used between runs) when brought. `onToggle` null = read
// only (a test fight brings everything). `compact`: the result screen's Bandage-only form. `pw`/`damage`: the fight's
// power numbers and damage table (the profile's), for the numbers the tiles show.
function PowerLoadout({ t, beaten, loadout, onToggle = null, test = false, compact = false, bandage = null, note = '', heal = 0, cast = null, pw = POWER_DEFAULTS, damage = undefined }) {
  const open = unlockedPowers(beaten)
  const bandageRow = (bandage || note || cast) && (
    <div style={{ display: 'grid', gap: 6, justifyItems: 'center' }}>
      {cast && <PowerCastBadge id="bandage" n={cast.n} />}
      {bandage && <ChunkyButton variant="ghost" color={C.purple} onClick={bandage} style={{ fontSize: 13, padding: '6px 12px' }}><PowerIcon id="bandage" size={18} /> {t('lg_powBandageUse', { n: heal })}</ChunkyButton>}
      {note && <div role="status" style={{ fontSize: 12.5, fontWeight: 800, color: C.purple }}>{note}</div>}
    </div>
  )
  if (compact) return bandageRow || null
  if (!open.length && !test) {
    const nx = nextUnlock(beaten)
    return nx ? <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', fontSize: 12.5, color: C.inkDim }}>{t('lg_powLocked', { n: nx.beaten, name: t(`lg_pow_${nx.id}`) })}</div> : null
  }
  return (
    <div data-raid-loadout="" style={{ maxWidth: 640, width: '100%', margin: '0 auto', boxSizing: 'border-box', display: 'grid', gap: 8, padding: '10px 12px', borderRadius: RADIUS.md, border: `1.5px solid color-mix(in srgb, ${C.purple} 35%, ${C.border})`, background: `color-mix(in srgb, ${C.purple} 6%, ${C.surface})` }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', justifyContent: 'center', textAlign: 'center' }}>
        <span style={{ fontSize: 13.5, fontWeight: 900, color: C.ink }}>{t('lg_powLoadout', { n: test ? loadout.length : loadout.length, max: test ? loadout.length : pw.loadoutMax })}</span>
        <span style={{ fontSize: 12, color: C.inkDim }}>{test ? t('lg_powTestBag') : t('lg_powLoadoutRule')}</span>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
        {POWER_IDS.map((id) => {
          const unlocked = test || open.includes(id)
          const on = loadout.includes(id)
          const full = !on && loadout.length >= pw.loadoutMax
          const can = !!onToggle && unlocked && !full
          const tip = unlocked ? t(`lg_powDesc_${id}`, powerVars(id, pw, damage)) : t('lg_powLockedOne', { n: POWERS[id].unlock })
          // The dimming sits on the CONTENT, never the button: the house tooltip is the button's own pseudo-element, and
          // a faded or greyscaled button faded its tip too (unreadable over the rules text below). Screen readers get the
          // name + what it does (or the unlock rule): the tooltip is CSS only and a locked tile shows just "🔒 N".
          return (
            <button key={id} type="button" data-power-tile={id} aria-pressed={on} disabled={!can && !(onToggle && on)} onClick={() => onToggle && unlocked && onToggle(id)}
              className={`tip tip-b${on ? ' ui-tab-current' : ''}`} data-tip={tip} aria-label={unlocked ? `${t(`lg_pow_${id}`)}: ${tip}` : tip}
              style={{ display: 'inline-flex', alignItems: 'center', fontFamily: FONT.body, fontSize: 12.5, fontWeight: 800, padding: '5px 10px', borderRadius: RADIUS.pill,
                border: `1.5px solid ${on ? C.purple : `color-mix(in srgb, ${C.purple} ${unlocked && !full ? 30 : 16}%, transparent)`}`, background: on ? `color-mix(in srgb, ${C.purple} 18%, ${C.surface})` : 'transparent',
                color: unlocked ? (on ? C.ink : C.inkDim) : C.inkFaint || C.inkDim, cursor: onToggle && unlocked && (on || !full) ? 'pointer' : 'default',
                opacity: 1 /* beats the global button:disabled dim (it faded the tip too); the span below dims */ }}>
              <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, opacity: unlocked ? (full ? 0.55 : 1) : 0.45, filter: unlocked ? 'none' : 'grayscale(1)' }}>
                <PowerIcon id={id} size={20} /> {unlocked ? t(`lg_pow_${id}`) : `🔒 ${POWERS[id].unlock}`}
              </span>
            </button>
          )
        })}
      </div>
      {bandageRow}
    </div>
  )
}

// What a run's win unlocked (a new boss beaten), else how far the next unlock is.
function PowerUnlocks({ t, before = 0, beaten = 0 }) {
  const fresh = POWER_IDS.filter((id) => POWERS[id].unlock > before && POWERS[id].unlock <= beaten)
  const nx = nextUnlock(beaten)
  if (!fresh.length && !nx) return null
  return (
    <div data-raid-unlocks="" style={{ display: 'grid', gap: 4, justifyItems: 'center' }}>
      {fresh.map((id) => <div key={id} style={{ fontWeight: 900, color: C.purple, display: 'inline-flex', alignItems: 'center', gap: 6 }}><PowerIcon id={id} size={26} /> {t('lg_powUnlocked', { name: t(`lg_pow_${id}`) })}</div>)}
      {nx && <div style={{ fontSize: 12.5, color: C.inkDim }}>{tCount(t, 'lg_powNext', Math.max(0, nx.beaten - beaten), { n: Math.max(0, nx.beaten - beaten), name: t(`lg_pow_${nx.id}`) })}</div>}
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
