// One step of the map. Learn and Rule steps teach their items first (with "Add to deck"), then everything
// that is a quiz runs through the shared QuizRunner; a Scene step tells a story or case study line by line,
// then asks about it; a Talk step is its own conversation (./Talk.jsx). When it ends, `onFinish(result)` gets
// { total, correct, items: [{ itemId, correct }], misses: [{ asked, answered, expected }] }.
import { ctxErrorText } from '../kit/aiError'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { C, FONT, RADIUS } from '../../config/tokens'
import { poseFile } from '../../config/shrimp'
import { speak } from '../../speech'
import { useFocusHold } from '../registry'
import { ChunkyButton, EbiSays, ProgressBar, Card, tCount } from '../ui'
import { QuizRunner, RuleCardButton, buildScenePrompt, parseScene, voiceFor, SCENE_ROLE, SCENE_MAX_TOKENS, judgeStrike, fightCtx, generationKey } from '../kit'
import FightSettings from './FightSettings'
import { featureCfg } from '../registry'
import { gradeAnswer, gradeFromStrike } from '../../config/grading'
import { learnerLevelLine } from '../kit/learnerStore'
import { makeQuiz, sceneFor, ensureBossName, KNOWLEDGE_CAP } from './generate'
import { itemIdFor } from './prompt'
import { addItemsToDeck, liveItems, isAdding } from './deck'
import Talk from './Talk'
import { BossIntro, BossArena, BossEnd, bossOdds, forgivenMisses } from './BossArena'
import { weakItems, WEAK_BONUS_LIVES, PASS, spendHelper } from './map'
import { powerHint } from './powers'
import { DAMAGE } from './abilities/_rules'
import { newFight, strike, fightOutcome, phaseOf, healthLeft, attackSlot, canAttack, weakTo, effortOf, ATTACK_LIVES, refundRunningFight, strikeCost } from './fight'
import LearnItPanel from '../kit/LearnItPanel'
import { islandVoice } from '../kit/taunt'
import { RAID_VOICE_RULES, STOCK_WORDS } from './raidVoices'
import { useFightCheck, useBossTaunt, useArenaPin, TauntBubble, FightNotice, MissTools } from './FightExtras'
import { FIGHT_EXTRAS, fightExtrasFor, expectedOf, isWrongish, learnItemFor } from './fightCheck'
import { updateMap, peekMap, LEGENDS_ID } from './store'
import { CheatButton, CheatRow } from './CheatUI'

// A new screen starts at its top: the Legends screen's scroll box kept the last one's position (a step's result
// opened scrolled down by the quiz before it). LegendsScreen renders one marker per view; a step's own phases
// (lesson, story, questions) scroll through it too.
const scrollScreenTop = (el) => { const p = scrollBoxOf(el); if (p) p.scrollTop = 0 }
// A pinned bar rests below its scroll box's top padding, and the content scrolling past showed through that band:
// the offset that pins it at the box's very top instead.
const scrollBoxOf = (el) => { let p = el?.parentElement; while (p && !/(auto|scroll)/.test(getComputedStyle(p).overflowY)) p = p.parentElement; return p }
export function ScrollTop({ on, skip = false }) {
  const ref = useRef(null)
  useLayoutEffect(() => { if (!skip) scrollScreenTop(ref.current) }, [on]) // eslint-disable-line react-hooks/exhaustive-deps
  return <span ref={ref} hidden data-lg-top="" />
}

// Every level teaches its items before asking (a story level too: its story brings in new items).
const TEACH_KINDS = new Set(['learn', 'rule', 'scene'])
const SIDE = { A: 'flex-start', B: 'flex-end', N: 'center' }

// One item's own "Add to deck" (the learner may already know some of a step's items). Shows "In your deck" once
// the map records its note id; the busy guard is shared with "Add all" through addItemsToDeck.
function AddOne({ ctx, modeId, areaId, it }) {
  const { t, subject } = ctx
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  if (it.cardNoteId) return <span style={{ fontSize: 11.5, fontWeight: 800, color: C.success, whiteSpace: 'nowrap' }}>✓ {t('lg_inDeck')}</span>
  // Anki closed: nothing can be added (the button stayed live beside "Open Anki" and failed on the click).
  const offline = ctx.ankiConnected === false
  const noDeck = !subject.modeDeck || offline
  const add = async () => {
    if (busy || noDeck || isAdding(modeId, it.id)) return
    setBusy(true); setNote('')
    const r = await addItemsToDeck(ctx, modeId, areaId, [it])
    setBusy(false)
    // Nothing added and nothing failed = another button is adding it right now (in flight): no error to show.
    if (!r.added && (r.failed || r.message)) setNote(r.message || t('lg_addFailed'))
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
      {note && <span style={{ fontSize: 11.5, color: C.warning }}>{note}</span>}
      <button type="button" onClick={add} disabled={busy || noDeck} className={noDeck ? 'tip' : undefined} data-tip={noDeck ? t(offline ? 'lg_noDeck' : 'lg_pickDeckFirst') : undefined}
        style={{ fontFamily: FONT.body, fontSize: 11.5, fontWeight: 800, padding: '4px 10px', borderRadius: RADIUS.pill, border: `1px solid color-mix(in srgb, ${C.success} 35%, transparent)`,
          background: 'transparent', color: C.success, whiteSpace: 'nowrap', cursor: busy || noDeck ? 'default' : 'pointer', opacity: busy || noDeck ? 0.5 : 1 }}>
        {busy ? t('lg_adding') : `+ ${t('lg_addItem')}`}
      </button>
    </span>
  )
}

// With `ctx`, the card offers its own "Add to deck".
export function ItemCard({ it, t, ctx, modeId, areaId }) {
  return (
    <div style={{ padding: '12px 14px', borderRadius: RADIUS.md, border: `2px solid ${C.border}`, background: C.surface }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        {it.kind === 'rule' && <span style={{ fontSize: 11, fontWeight: 800, color: C.purple, textTransform: 'uppercase', letterSpacing: '.05em' }}>📐 {t('lg_itemRule')}</span>}
        {it.kind === 'skill' && <span style={{ fontSize: 11, fontWeight: 800, color: C.info, textTransform: 'uppercase', letterSpacing: '.05em' }}>🛠 {t('lg_itemSkill')}</span>}
        <span style={{ marginLeft: 'auto' }}>
          {ctx ? <AddOne ctx={ctx} modeId={modeId} areaId={areaId} it={it} />
            : it.cardNoteId && <span style={{ fontSize: 11.5, fontWeight: 800, color: C.success }}>✓ {t('lg_inDeck')}</span>}
        </span>
      </div>
      <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 18, color: C.ink }}>{it.front}</div>
      <div style={{ fontSize: 14, color: C.inkDim, whiteSpace: 'pre-wrap', lineHeight: 1.5, marginTop: 4 }}>{it.back}</div>
    </div>
  )
}

// Every item of a list, each with its own add, then "Add all" for the rest (the boss result's area cards).
export function ItemAddList({ ctx, modeId, areaId, itemIds }) {
  const items = liveItems(modeId, areaId, itemIds)
  if (!items.length) return null
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'grid', gap: 6 }}>
        {items.map((it) => (
          <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: `1px solid ${C.border}` }}>
            <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 800, color: C.ink, overflowWrap: 'anywhere' }}>{it.front}</span>
            <AddOne ctx={ctx} modeId={modeId} areaId={areaId} it={it} />
          </div>
        ))}
      </div>
      <AddToDeck ctx={ctx} modeId={modeId} areaId={areaId} itemIds={itemIds} />
    </div>
  )
}

// Which deck the mode's cards go to: the mode's saved deck, chosen here (and saved on the mode, like Settings >
// Cards & Anki). With no deck chosen yet nothing is added: the first deck of the collection is no safe guess.
export function DeckPicker({ ctx }) {
  const { t, subject, cards } = ctx
  const decks = cards.decks || []
  const deck = subject.modeDeck || ''
  if (ctx.ankiConnected === false || !decks.length) return <span style={{ fontSize: 12.5, color: C.warning }}>{t('lg_noDeck')}</span>
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 12.5, fontWeight: 700, color: deck ? C.inkDim : C.warning }}>
      {deck ? t('lg_deckFor') : t('lg_pickDeckFirst')}
      <select value={decks.includes(deck) ? deck : ''} onChange={(e) => { if (e.target.value) cards.setModeDeck(e.target.value) }}
        style={{ fontFamily: FONT.body, fontSize: 12.5, fontWeight: 700, padding: '4px 8px', borderRadius: RADIUS.sm, border: `1px solid ${deck ? C.border : C.warning}`, background: C.surfaceAlt, color: C.ink, maxWidth: 260 }}>
        {!decks.includes(deck) && <option value="">{deck ? `${deck} (?)` : t('lg_deckChoose')}</option>}
        {decks.map((d) => <option key={d} value={d}>{d}</option>)}
      </select>
    </label>
  )
}

// "Add these to my deck" for a list of items; shows what happened.
export function AddToDeck({ ctx, modeId, areaId, itemIds, label }) {
  const { t, subject } = ctx
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const [, force] = useState(0)
  const items = liveItems(modeId, areaId, itemIds)
  const todo = items.filter((it) => !it.cardNoteId)
  const add = async () => {
    if (busy || !todo.length || ctx.ankiConnected === false) return
    setBusy(true); setNote('')
    const r = await addItemsToDeck(ctx, modeId, areaId, todo)
    setBusy(false)
    setNote(r.added ? t('lg_added', { n: r.added, deck: subject.modeDeck }) + (r.failed ? ` ${r.message || ''}` : '') : r.failed || r.message ? r.message || t('lg_addFailed') : '')
    force((n) => n + 1)
  }
  if (!items.length) return null
  const deck = subject.modeDeck
  const offline = ctx.ankiConnected === false
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {todo.length > 0 && <DeckPicker ctx={ctx} />}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        {todo.length ? (
          <ChunkyButton variant="ghost" color={C.success} onClick={add} disabled={busy || !deck || offline} style={{ fontSize: 12.5, padding: '8px 12px' }}>
            + {busy ? t('lg_adding') : label || (deck ? t('lg_addAll', { n: todo.length, deck }) : t('lg_addN', { n: todo.length }))}
          </ChunkyButton>
        ) : <span style={{ fontSize: 13, fontWeight: 800, color: C.success }}>✓ {t('lg_allInDeck')}</span>}
        {note && <span style={{ fontSize: 12.5, color: C.inkDim }}>{note}</span>}
      </div>
    </div>
  )
}

function Story({ ctx, scene, onDone, onQuit }) {
  const { t, subject } = ctx
  const [shown, setShown] = useState(1)
  const [gloss, setGloss] = useState(false)
  const sid = useRef(`lg-scene-${Date.now().toString(36)}`).current // tapped-word popups belong to this story
  const audioRef = useRef(null)
  const listRef = useRef(null)
  useFocusHold(true)
  useEffect(() => () => audioRef.current?.stop(), [])
  useEffect(() => { listRef.current?.scrollTo?.({ top: 1e9, behavior: 'smooth' }) }, [shown])
  const lang = subject.isLanguage ? subject.learnLangIso : ctx.lang
  const say = (line) => { audioRef.current?.stop(); audioRef.current = speak(ctx, line.text, { lang, voice: voiceFor(line.speaker) }) }
  const last = shown >= scene.lines.length
  const who = (sp) => (sp === 'N' ? '' : scene.cast[sp])
  return (
    <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 420, gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, fontFamily: FONT.display, fontWeight: 900, fontSize: 20, color: C.ink }}>📖 {scene.title}</div>
        {subject.isLanguage && (
          <label style={{ fontSize: 12.5, color: C.inkDim, display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
            <input type="checkbox" checked={gloss} onChange={(e) => setGloss(e.target.checked)} style={{ accentColor: C.brand }} />{t('lg_gloss')}
          </label>
        )}
      </div>
      <ProgressBar value={shown} max={scene.lines.length} color={C.success} style={{ height: 12 }} label={t('ui_progress')} />
      <div ref={listRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, padding: 4 }}>
        {scene.lines.slice(0, shown).map((l, i) => (
          <div key={i} style={{ alignSelf: SIDE[l.speaker], maxWidth: l.speaker === 'N' ? '90%' : '80%', textAlign: l.speaker === 'N' ? 'center' : 'left' }}>
            {who(l.speaker) && <div style={{ fontSize: 11.5, fontWeight: 800, color: l.speaker === 'A' ? C.info : C.purple, margin: '0 4px 2px' }}>{who(l.speaker)}</div>}
            {/* The line's words are tappable like Study's (ctx.words), so the replay is its own small button. */}
            <div style={{
              fontFamily: FONT.body, textAlign: 'inherit', padding: l.speaker === 'N' ? '4px 8px' : '10px 14px', borderRadius: RADIUS.lg,
              background: l.speaker === 'N' ? 'transparent' : C.surface, border: l.speaker === 'N' ? 'none' : `2px solid ${C.border}`,
              color: l.speaker === 'N' ? C.inkDim : C.ink, fontStyle: l.speaker === 'N' ? 'italic' : 'normal', fontSize: 15.5, lineHeight: 1.45,
            }}>
              {ctx.words ? ctx.words.tappable(l.text, `${sid}-${i}`) : l.text}
              <button type="button" onClick={() => say(l)} aria-label={t('lg_replay')} data-tip={t('lg_replay')} className="tip"
                style={{ marginLeft: 6, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, padding: 0, verticalAlign: 'middle' }}>🔊</button>
              {gloss && l.gloss && <div style={{ fontSize: 12.5, color: C.inkFaint, marginTop: 4, fontStyle: 'normal' }}>{l.gloss}</div>}
            </div>
            {ctx.words && ctx.words.popup(`${sid}-${i}`)}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
        <ChunkyButton variant="ghost" color={C.inkDim} onClick={() => { audioRef.current?.stop(); onQuit() }}>{t('lg_leave')}</ChunkyButton>
        <ChunkyButton onClick={() => (last ? (audioRef.current?.stop(), onDone()) : setShown(shown + 1))} color={C.success}>{last ? t('lg_toQuestions') : t('lg_continue')}</ChunkyButton>
      </div>
    </div>
  )
}

// Cheat mode puts "Win now" / "Fail now" above any step; both finish it through the normal path (rewards included,
// so they can be tested).
// "These questions are bad": a quiet link under the result and above a running quiz.
export function NewQuestionsButton({ t, onClick }) {
  return (
    <button type="button" onClick={onClick} className="tip" data-tip={t('lg_newQuestionsTip')}
      style={{ fontFamily: FONT.body, border: 'none', background: 'transparent', color: C.inkDim, fontWeight: 800, fontSize: 13, cursor: 'pointer', padding: 4 }}>
      🔄 {t('lg_newQuestions')}
    </button>
  )
}

export default function NodeRun(props) {
  const { ctx, node, area, cheat, onFinish } = props
  if (!cheat) return <NodeRunBody {...props} />
  const ids = (node.itemIds || []).filter((id) => area.items.some((it) => it.id === id))
  const n = Math.max(1, ids.length)
  const end = (win) => onFinish({ total: n, correct: win ? n : 0, items: ids.map((itemId) => ({ itemId, correct: win })), misses: [] })
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <CheatRow>
        <CheatButton onClick={() => end(true)}>⚡ {ctx.t('lg_cheatWin')}</CheatButton>
        <CheatButton onClick={() => end(false)}>⚡ {ctx.t('lg_cheatLose')}</CheatButton>
      </CheatRow>
      <div><NodeRunBody {...props} /></div>
    </div>
  )
}

// The scroll's hint is the raid Hint's (powers.js): half of each word, since the cue already gives the first letter.
const scrollHint = powerHint

function NodeRunBody({ ctx: rawCtx, modeId, area, node, misses = [], onFinish, onQuit, onNewQuestions }) {
  // A boss or Legendary fight speaks the mode's fight language (FightSettings, the same study settings as Study): its
  // questions, graders, taunts and Learn it all read `ctx.subject` from here. Other steps are unchanged.
  const isFight = node.kind === 'boss' || node.kind === 'legendary'
  const ctx = isFight ? fightCtx(rawCtx) : rawCtx
  const fightRulesNow = ctx.fight?.rules || {}
  const { t, ai, subject } = ctx
  const teaches = TEACH_KINDS.has(node.kind)
  const [phase, setPhase] = useState(node.kind === 'talk' || node.kind === 'adventure' ? 'talk' : teaches ? 'teach' : 'loading') // teach | loading | quiz | story | talk | error
  const [questions, setQuestions] = useState(null)
  const [scene, setScene] = useState(null)
  const [error, setError] = useState('')
  const seq = useRef(0)
  const answers = useRef([]) // [{ itemId, correct, asked, answered, expected }]
  // The boss's character name (older areas get one made while the questions load).
  const [bossName, setBossName] = useState(area.bossName || '')
  useEffect(() => {
    if ((node.kind !== 'boss' && node.kind !== 'legendary') || area.bossName || !ai.hasKey) return
    let live = true
    ensureBossName(ctx, modeId, area.id).then((n) => { if (live && n) setBossName(n) })
    return () => { live = false }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  // The boss fight: an intro card first, then every answer is a hit on the boss or a lost heart (BossArena.jsx).
  const [fighting, setFighting] = useState(false)
  const arenaRef = useRef(null)
  const extrasRef = useRef(null)
  const pin = useArenaPin(arenaRef, extrasRef, node.kind === 'boss' || node.kind === 'legendary')
  // A new phase (and the fight starting after the boss entrance) opens at the top: the fight began scrolled down to
  // where the entrance's Fight button was, the question hidden under the pinned arena.
  const firstPhase = useRef(true)
  useLayoutEffect(() => {
    if (firstPhase.current) { firstPhase.current = false; return }
    scrollScreenTop(document.querySelector('[data-lg-top]'))
  }, [phase, fighting])
  // The fight (fight.js). A ref mirrors it: onAnswer must read the state the previous answer left, not a render's.
  const [fs, setFs] = useState(newFight)
  const fsRef = useRef(fs)
  const pos = useRef(-1) // index of the question on screen in the run (inserted attacks included)
  const effort = useRef({ typed: 0, choice: 0, misses: 0 }) // answers of a non-fight step, for XP
  const cfg = featureCfg(ctx, LEGENDS_ID)
  const focus = cfg.focus === true
  // A shield (a helper earned in Weak spots) is taken into the fight when one is held; it absorbs one lost life.
  const [shield] = useState(() => node.kind === 'boss' && (peekMap(modeId)?.helpers?.shield || 0) > 0)
  // Hint scrolls (earned by a first flawless level, held at most HELPERS_MAX): one shows the first half of each word
  // of the answer on a typed question (scrollHint).
  const [scrolls, setScrolls] = useState(() => peekMap(modeId)?.helpers?.scroll || 0)
  // One scroll per question: the button stays on screen after use, and each click spent another scroll.
  const scrolledFor = useRef(new Set())
  const spendScroll = (q, api) => {
    if (scrolledFor.current.has(q)) return
    const ans = String((q.accepted || [])[0] || '')
    if (!ans || scrolls < 1) return
    scrolledFor.current.add(q)
    setScrolls((n) => n - 1)
    updateMap(modeId, (m) => (m ? spendHelper(m, 'scroll') : m))
    api.hint(`📜 ${t('lg_scrollHint', { hint: scrollHint(ans) })}`)
  }
  // A fight: the boss, or a Legendary run over a cleared area (harder pass, no bonus life).
  const fight = node.kind === 'boss' || node.kind === 'legendary'
  const odds = node.kind === 'legendary' ? { pass: PASS.legendary } : { bonus: area.bonusLife ? WEAK_BONUS_LIVES : 0 }
  // The items this boss is weak to (answered right, they deal +1).
  const weakIds = fight ? weakTo(area) : []
  const weakNames = weakIds.map((id) => area.items.find((it) => it.id === id)?.front).filter(Boolean)
  // Weak spots practices the island's shakiest items right now; every other step its own.
  const items = node.kind === 'weak' ? weakItems(area) : area.items.filter((it) => node.itemIds.includes(it.id))
  const teachItems = node.kind === 'rule' ? [...items.filter((it) => it.kind === 'rule'), ...items.filter((it) => it.kind !== 'rule')] : items

  // ── Second looks, appeals, Learn it and taunts (fights only; FightExtras.jsx) ──
  const alive = useRef(true)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  const oddsRef = useRef(null) // { need, lives } of the running fight
  const finished = useRef(false)
  // A miss or glancing answer was right after all: the answer counts right (its grade goes into the item tally at
  // the finish), and while the fight runs the lost heart comes back and the damage it should have dealt lands.
  const onOverturn = (e, to) => {
    const grade = gradeFromStrike(to, { choice: e.mode === 'choice', hintUsed: !!e.hintUsed })
    answers.current = answers.current.map((x) => (x.aid === e.aid ? { ...x, correct: true, grade, verdict: to, overturned: true } : x))
    if (!FIGHT_EXTRAS.refund || finished.current || !fight) return false
    const next = refundRunningFight(fsRef.current, oddsRef.current, { kind: e.kind, mode: e.mode, weak: !!e.weak, first: e.first, cost: e.cost }, to)
    if (!next) return false
    fsRef.current = next
    setFs(next)
    return true
  }
  const isOver = () => finished.current || !oddsRef.current || !!fightOutcome(fsRef.current, oddsRef.current)
  const fc = useFightCheck(ctx, { onOverturn, isOver })
  const learnOn = fightRulesNow.learnMoment !== false // the mode's Learn-it moments (one setting with Study)
  const tauntsOn = fight && fightExtrasFor(cfg, { focus }).taunts // fightCheck.js
  const voice = fight ? islandVoice({ bossName: bossName || area.bossName || '', areaTitle: area.title, theme: area.theme }) : ''
  const taunt = useBossTaunt(ctx, { bossKey: `boss:${modeId}:${String(area.title || area.id).slice(0, 60)}`, voice, rules: RAID_VOICE_RULES, avoidWords: STOCK_WORDS, bossName: bossName || area.bossName || '', enabled: tauntsOn })
  const [learn, setLearn] = useState(null) // the Learn-it panel's item (the fight waits under it)
  const openLearn = (e) => {
    setLearn(learnItemFor(area.items.find((x) => x.id === itemIdFor(e.q, area.items)), e.q, { noteKey: 'cardNoteId' }))
  }
  const [settling, setSettling] = useState(false)

  const load = async () => {
    const my = ++seq.current
    setPhase('loading'); setError('')
    try {
      if (node.kind === 'scene') {
        const s = await sceneFor(modeId, area, node, async () => {
          const level = await learnerLevelLine(ctx)
          const { system, user } = buildScenePrompt(subject, items.map((it) => ({ front: it.front, back: it.back })), { level, theme: `${area.title}: ${area.theme}`, knowledge: subject.knowledge(KNOWLEDGE_CAP.quiz) })
          const made = parseScene(ai.json(await ai.call(system, user, { role: SCENE_ROLE, maxTokens: SCENE_MAX_TOKENS })), ai.clean)
          if (!made || !made.questions.length) throw new Error(t('lg_errQuiz'))
          return made
        })
        if (my !== seq.current) return
        setScene(s); setPhase('story')
      } else {
        genAt.current = generationKey(fightRulesNow)
        const qs = await makeQuiz(ctx, modeId, area, node, { misses })
        if (my !== seq.current) return
        setQuestions(qs); setPhase('quiz')
      }
    } catch (e) { if (my === seq.current) { setError(ctxErrorText(ctx, e)); setPhase('error') } }
  }
  useEffect(() => { if (phase === 'loading') load(); return () => { seq.current++ } }, []) // eslint-disable-line react-hooks/exhaustive-deps
  // A fight setting that changes what the questions are written in (learned language, "Ebi speaks", dialect), changed
  // on the entrance before the fight: the boss writes a new set (nothing was answered, nothing is recorded).
  const genAt = useRef('')
  const genKey = isFight ? generationKey(fightRulesNow) : ''
  const asked = useRef(false)
  useEffect(() => {
    if (!isFight || fighting || phase !== 'quiz' || !genAt.current || genKey === genAt.current || asked.current) return
    asked.current = true
    if (onNewQuestions) onNewQuestions()
    else load()
  }, [genKey, phase, fighting]) // eslint-disable-line react-hooks/exhaustive-deps

  // `total`: the fight ended early out of lives, so the questions never asked count as not answered right.
  const finish = async (total) => {
    if (finished.current) return
    finished.current = true
    if (fight) {
      // Re-checks and appeals still running decide the grades first (bounded).
      setSettling(true)
      await fc.settle()
      if (!alive.current) return
    }
    const a = answers.current
    const st = fsRef.current
    const o = fight ? bossOdds(questions?.length || 0, odds) : null
    // Questions run out with lives left = a win (fight.js: that can only happen with the boss beaten or a shield used).
    const outcome = fight ? (fightOutcome(st, o) || 'won') : ''
    const won = outcome === 'won'
    const hits = a.filter((x) => x.correct).length
    onFinish({
      outcome, power: fight && won && st.safe === 0 && st.answers > 0,
      effort: fight ? effortOf({ clean: st.clean, glancing: st.glancing, choice: st.safe, misses: st.misses }) : effortOf(effort.current),
      forgiven: won && node.kind === 'boss' ? forgivenMisses(questions.length, hits, odds) : 0,
      total: Math.max(a.length, Number(total) || 0), correct: a.filter((x) => x.correct).length,
      items: a.filter((x) => x.itemId).map((x) => ({ itemId: x.itemId, correct: x.correct, grade: x.grade })),
      misses: a.filter((x) => !x.correct).map(({ asked, answered, expected }) => ({ asked, answered, expected })),
      // for "See all answers" (and, after a fight, its debrief: the second look, the note, the appeal). A look still
      // running past the settle wait never reaches this copy (the step is gone): it shows as not checked, open to appeal.
      answers: a.map(({ asked, answered, expected, correct, aid, itemId, grade, verdict, q: aq }) => {
        const e = aid ? fc.get(aid) : null
        return { asked, answered, expected, correct, ...(e ? { aid, itemId, grade, verdict, first: e.first, mode: e.mode, note: e.note || '', why: e.why || '', overturned: !!e.overturned, afterFight: !!e.afterFight, by: e.by || '', appeal: e.appeal === 'pending' ? 'failed' : e.appeal || null, appealWhy: e.appealWhy || '', status: e.status === 'checking' ? 'failed' : e.status, q: aq } : {}) }
      }),
    })
  }

  // Throws this attempt away (nothing is recorded) and asks for a new set. On every screen of a quiz-like step:
  // the lesson, the scene story, the boss entrance and the questions (it was only on the questions and results).
  const renew = onNewQuestions && node.kind !== 'talk' && node.kind !== 'adventure' && (async () => {
    if (answers.current.length && !(await ctx.confirm(t('lg_newQuestionsConfirm')))) return
    onNewQuestions()
  })
  const renewRow = renew && <div style={{ display: 'flex', justifyContent: 'flex-end', maxWidth: 640, width: '100%', margin: '0 auto' }}><NewQuestionsButton t={t} onClick={renew} /></div>

  if (phase === 'talk') return <Talk ctx={ctx} area={area} node={node} items={items} onFinish={onFinish} onQuit={onQuit} />

  if (phase === 'teach') {
    return (
      <div style={{ maxWidth: 680, margin: '0 auto', display: 'grid', gap: 14 }}>
        <button onClick={onQuit} style={{ fontFamily: FONT.body, justifySelf: 'start', border: 'none', background: 'transparent', color: C.inkDim, fontWeight: 800, cursor: 'pointer', fontSize: 13 }}>← {t('lg_toMap')}</button>
        <EbiSays pose={poseFile(node.kind === 'rule' ? 'science' : 'book')}>{node.kind === 'rule' ? t('lg_teachRule') : tCount(t, 'lg_teachLearn', teachItems.length)}</EbiSays>
        <div style={{ display: 'grid', gap: 10 }}>{liveItems(modeId, area.id, teachItems.map((it) => it.id)).map((it) => <ItemCard key={it.id} it={it} t={t} ctx={ctx} modeId={modeId} areaId={area.id} />)}</div>
        <AddToDeck ctx={ctx} modeId={modeId} areaId={area.id} itemIds={teachItems.map((it) => it.id)} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {renew && <NewQuestionsButton t={t} onClick={renew} />}
          <ChunkyButton onClick={load} color={C.success} disabled={!ai.hasKey}>{t('lg_startQuestions')}</ChunkyButton>
        </div>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div style={{ maxWidth: 560, margin: '40px auto', display: 'grid', gap: 14 }}>
        <EbiSays pose={poseFile('confused')}>{error}</EbiSays>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <ChunkyButton variant="ghost" color={C.inkDim} onClick={onQuit}>{t('lg_toMap')}</ChunkyButton>
          <ChunkyButton onClick={load} color={C.success}>{t('lg_retry')}</ChunkyButton>
        </div>
      </div>
    )
  }

  if (phase === 'loading') {
    return (
      <div style={{ maxWidth: 560, margin: '60px auto', display: 'grid', gap: 10, justifyItems: 'center' }}>
        <EbiSays pose={poseFile(fight ? 'weapon' : 'work')}>{fight ? t('lg_bossIntro', { area: area.title }) : node.kind === 'scene' ? t('lg_sceneIntro') : t('lg_quizIntro')}</EbiSays>
        <div style={{ fontFamily: FONT.display, fontWeight: 800, color: C.inkDim }}>{t('lg_preparing')}</div>
      </div>
    )
  }

  if (phase === 'story' && scene) return <div style={{ display: 'grid', gap: 4 }}>{renewRow}<Story ctx={ctx} scene={scene} onQuit={onQuit} onDone={() => { setQuestions(scene.questions); setPhase('quiz') }} /></div>

  if (phase === 'quiz' && questions) {
    const o = fight ? bossOdds(questions.length, odds) : null
    const fightPhase = fight ? phaseOf(healthLeft(fs, o.need), o.need) : 1
    const record = (q, correct, answer, info = {}) => {
      pos.current = Number.isInteger(info.at) ? info.at : pos.current + 1
      if (q._retry) return // a missed question asked again at the end is practice: it never changes the score
      const choice = info.mode === 'choice'
      const itemId = itemIdFor(q, area.items)
      // The shared one-answer grade (config/grading.js): a fight's verdict, else right/wrong with the near misses
      // (a hint scroll, an accent slip, a partly right answer). Items move toward gold only on Good or better.
      const hintUsed = scrolledFor.current.has(q)
      const grade = fight
        ? gradeFromStrike(info.verdict || (correct ? 'clean' : 'miss'), { choice, hintUsed })
        : gradeAnswer({ correct, choice, hintUsed, accentSlip: !!info.accent, corrected: !!info.partial })
      const fverdict = info.verdict || (correct ? 'clean' : 'miss')
      const aid = fight ? (info.aid || fc.open(q, answer, choice ? 'choice' : 'typed', { verdict: fverdict })) : null
      if (fight) { taunt.onAnswer(); if (fverdict === 'miss' && !info.skipped) taunt.onMiss(q, answer, expectedOf(q)) }
      if (!q._extra) {
        const expected = q.kind === 'choice' ? q.choices?.[q.answerIdx] : (q.accepted || [])[0]
        answers.current = [...answers.current, { itemId, correct, grade, asked: q.prompt, answered: answer, expected: expected || '', ...(aid ? { aid, verdict: fverdict, q: { prompt: q.prompt, kind: q.kind, accepted: q.accepted, choices: q.choices, answerIdx: q.answerIdx, target: q.target, open: q.open } } : {}) }]
      }
      if (!fight) {
        const e = effort.current
        effort.current = correct ? (choice ? { ...e, choice: e.choice + 1 } : { ...e, typed: e.typed + 1 }) : { ...e, misses: e.misses + 1 }
        return null
      }
      const before = fsRef.current
      const fkind = q._attack ? 'attack' : 'normal'
      const weakHit = weakIds.includes(itemId)
      if (fightOutcome(before, o)) { fc.attach(aid, { cost: {}, kind: fkind, mode: choice ? 'choice' : 'typed', itemId, hintUsed }); return null } // decided: the rest is not a fight any more
      const verdict = fverdict
      let next = strike(before, { verdict, mode: choice ? 'choice' : 'typed', weak: weakHit, attack: !!q._attack }, { shield })
      if (next.last?.shielded && !before.shieldUsed) updateMap(modeId, (m) => (m ? spendHelper(m, 'shield') : m))
      // The boss strikes back with what went wrong: the missed question itself, or the other slip of a glancing
      // hit (judgeStrike's follow-up). Never from an attack, never once the fight is decided, at most MAX_ATTACKS.
      let insert = null
      if (!q._attack && !fightOutcome(next, o) && canAttack(next)) {
        // `_attackOf`: a re-check that finds the answer right cancels its attack; a glancing slip's follow-up still being
        // written goes in as a placeholder (`_pending`), skipped when it is not there in time.
        const a = info.attackQ
        const base = verdict === 'miss' ? { ...q, alt: undefined, _attackOf: aid }
          : a ? (a.pending ? { kind: 'typed', prompt: '', accepted: [], target: q.target, _pending: a.pending } : { kind: 'typed', prompt: a.prompt, accepted: a.accepted, exact: !!a.exact, target: q.target, _attackOf: aid }) : null
        if (base) { insert = { ...base, _attack: true }; next = { ...next, attacks: next.attacks + 1 } }
      }
      fsRef.current = next
      setFs(next)
      fc.attach(aid, { cost: strikeCost(before, next), kind: fkind, mode: choice ? 'choice' : 'typed', weak: weakHit, itemId, hintUsed })
      return insert ? { insert, at: attackSlot(pos.current, Number.MAX_SAFE_INTEGER) } : null
    }
    // Typed answers in a fight are strikes: clean (all right) 2, glancing (the tested thing right, something else
    // wrong) 1, and the slip comes back as an attack. Choices are a safe strike, only before the boss enrages.
    const judge = fight ? async (q, ans) => {
      // Only languages that write accents grade them (a general mode grades understanding: Quebec for Québec is clean).
      const j = await judgeStrike(ai, subject, q, ans, { strictAccents: !!subject.accents && subject.strictAccents !== false })
      if (j.verdict === 'error') return { error: true } // could not be checked: QuizRunner asks to try again
      // The verdict lands at once; the note and a glancing slip's follow-up come later, and a miss or glancing verdict
      // is looked at again in the background (useFightCheck).
      const aid = fc.open(q, ans, 'typed', j)
      return {
        correct: j.verdict !== 'miss', partial: j.verdict === 'glancing', note: j.note || '', accent: !!j.accent && j.verdict !== 'miss',
        title: j.verdict === 'clean' ? t('lg_strikeClean') : j.verdict === 'glancing' ? t('lg_strikeGlancing') : '',
        info: { verdict: j.verdict, attackQ: j.attack || (j.fixLater ? { pending: aid } : null), aid }, later: j.later,
      }
    } : undefined
    const header = fight ? (q, mode) => (
      <div style={{ display: 'grid', gap: 6 }}>
        {q._attack && (
          <div role="alert" className="lg-boss" style={{ padding: '8px 12px', borderRadius: RADIUS.md, background: `color-mix(in srgb, ${C.danger} 14%, ${C.surface})`, border: `2px solid ${C.danger}`, color: C.danger, fontWeight: 900, fontSize: 14, animation: focus || cfg.still === true ? 'none' : 'lgCall .9s ease-in-out infinite' }}>
            ⚔️ {t('lg_attackIncoming', { n: ATTACK_LIVES })}
          </div>
        )}
        <div style={{ fontSize: 12, fontWeight: 800, color: mode === 'choice' ? C.info : C.warning }}>
          {mode === 'choice' ? `🛡 ${t('lg_strikeSafeHint', { n: DAMAGE.choice })}` : `💥 ${t('lg_strikePowerHint', { n: DAMAGE.clean })}`}{fightPhase > 1 && node.kind === 'boss' ? ` · 😡 ${t('lg_rageNoSafe')}` : ''}
        </div>
      </div>
    ) : undefined
    const canUseChoices = node.kind === 'boss' ? (q) => !q._attack && fightPhase === 1 : undefined
    const tools = scrolls > 0 ? (q, api) => (!api.asChoice && q.kind !== 'choice' && !q.open && (q.accepted || []).length && api.phase === 'answer' && !scrolledFor.current.has(q)
      ? <ChunkyButton variant="ghost" color={C.purple} onClick={() => spendScroll(q, api)} style={{ fontSize: 12, padding: '6px 10px' }}>📜 {t('lg_useScroll', { n: scrolls })}</ChunkyButton>
      : null) : undefined
    const boss = fight
    if (boss && !fighting) return <div style={{ display: 'grid', gap: 4 }}><BossIntro t={t} area={area} name={bossName} total={questions.length} odds={odds} legendary={node.kind === 'legendary'} calm={focus} onFight={() => setFighting(true)} /><FightSettings ctx={ctx} allowStyle={node.kind === 'boss'} />{renewRow}</div>
    const runner = (
      <QuizRunner questions={questions} t={t} ai={ai} subject={subject} ctx={ctx} confirm={ctx.confirm}
        title={node.kind === 'boss' ? `👑 ${bossName || t('lg_boss')}` : node.kind === 'legendary' ? `🏅 ${bossName || t('lg_legendary')}` : node.title || t(`lg_kind_${node.kind}`)}
        retryMisses={!fight}
        onAnswer={record} judge={judge} header={header} canUseChoices={canUseChoices} tools={tools}
        startChoices={node.kind === 'boss' ? () => fightRulesNow.answerStyle === 'choices' : undefined}
        onQuestion={fight ? () => taunt.onQuestion() : undefined} resolveQuestion={fight ? fc.resolveQuestion : undefined}
        overturnedFor={fight ? (q) => !!fc.entryFor(q)?.overturned : undefined}
        feedbackExtra={(q, correct, answer) => fight ? (() => {
          const e = fc.entryFor(q)
          return e && isWrongish(e.first) ? <MissTools ctx={ctx} entry={e} onAppeal={fc.appeal} onLearn={learnOn ? () => openLearn(e) : null} rule expected={expectedOf(q)} /> : null
        })() : (!correct && node.kind === 'rule' && ai.hasKey
          ? <RuleCardButton ctx={ctx} compact deck={ctx.subject?.modeDeck || ''} source={{ asked: q.prompt, answered: answer, expected: q.kind === 'choice' ? q.choices?.[q.answerIdx] : (q.accepted || [])[0] }} />
          : null)}
        onFinish={() => finish()}
        // Once the step is finishing (its result is being saved and will open), the quiz's own Finish button waits for it:
        // leaving here showed the map and then the result popped up over it.
        onExit={(...args) => { if (!finished.current) onQuit(...args) }} />
    )
    // The runner sits in a plain block: as a grid item its auto margins shrank it to its content (a short question made
    // a narrow quiz, and the column changed width from question to question).
    if (!boss) return <div style={{ display: 'grid', gap: 4 }}>{renewRow}<div>{runner}</div></div>
    // The fight ends when the boss has no health left (a win: stars count the answers given) or the learner no
    // lives (the rest of the questions count as missed).
    const outcome = fightOutcome(fs, o)
    oddsRef.current = o
    const extras = (
      <div ref={extrasRef} data-arena-extras="" style={{ maxWidth: 680, width: '100%', margin: '0 auto' }}>
        {!outcome && <TauntBubble bubble={taunt.bubble} name={bossName || area.bossName || area.title || ''} calm={focus} ctx={ctx} />}
        <FightNotice notice={fc.notice} t={t} />
      </div>
    )
    if (settling) return <div style={{ maxWidth: 560, margin: '60px auto' }}><EbiSays pose={poseFile('work')}>{t('lg_recheckSettling')}</EbiSays></div>
    return (
      <div style={{ display: 'grid', gap: 12 }}>
        {/* Sticky: a long question or four tall choices scroll UNDER the boss instead of pushing it off screen. */}
        <div ref={arenaRef} data-arena-pin={pin.mode} style={{ maxWidth: 680, width: '100%', margin: '0 auto', ...(pin.sticky ? { position: 'sticky', top: pin.top, zIndex: 5 } : {}), paddingTop: 4, background: C.bg }}>
          <BossArena t={t} area={area} name={bossName} need={o.need} lives={o.lives} bonus={o.bonus} state={fs} weak={weakNames} shield={shield} focus={focus} getZoom={ctx.getZoom} slim={pin.slim} />
          {pin.extrasIn && extras}
        </div>
        {!pin.extrasIn && extras}
        {learn && <LearnItPanel ctx={ctx} item={learn} onClose={() => setLearn(null)} closeLabel={t('lg_learnBackToFight')} />}
        {outcome ? <BossEnd t={t} won={outcome === 'won'} onDone={() => finish(outcome === 'lost' ? questions.length : 0)} /> : <div style={{ display: 'grid', gap: 4 }}>{renewRow}<div>{runner}</div></div>}
      </div>
    )
  }
  return <Card>{t('lg_preparing')}</Card>
}
