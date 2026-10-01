// A RAID: today's raid boss made of the deck's DUE cards, one question per card, fought with the Legends rules
// (fight.js) but harder (raid.js: health from the cards due, 3 lives, 3 phases, choices only in phase 1). Every
// card's FIRST answer is recorded in Anki as a real review (Good, Hard or Again; never Easy), whether the fight is
// won, lost or left early. The boss keeps its wounds for the rest of the day.
import { useEffect, useRef, useState } from 'react'
import { C, FONT, RADIUS } from '../../config/tokens'
import { poseFile } from '../../config/shrimp'
import { srs } from '../../cards'
import { EVENTS } from '../events'
import { featureCfg } from '../registry'
import { ChunkyButton, EbiSays, Card } from '../ui'
import { QuizRunner, judgeStrike, recordReviews, recordPractice } from '../kit'
import { learnerLevelLine } from '../kit/learnerStore'
import { BossIntro, BossArena, BossEnd } from './BossArena'
import { LegendsArt } from './art'
import { newFight, strike, phaseOf, attackSlot, attackGapFor, canAttack, raidRating, ATTACK_LIVES, ABILITY } from './fight'
import { RAID, RAID_MOTIFS, RAID_ABILITY, todayKey, raidToday, applyRaidAttempt, raidOrder, shapeRaid } from './raid'
import { buildRaidPrompt, parseQuestions, RAID_ROLE, RAID_MAX_TOKENS } from './prompt'
import { readRaid, updateRaid, LEGENDS_ID } from './store'

const INFO_BATCH = 40
const GUARD_KEY = 'ebiki-raid-guards'

export default function RaidRun({ ctx, onExit }) {
  const { t, ai, subject } = ctx
  const modeId = subject.modeId
  const deck = subject.modeDeck || subject.deck
  const focus = featureCfg(ctx, LEGENDS_ID).focus === true
  const [phase, setPhase] = useState('loading') // loading | none | intro | fight | end | saving | done | error
  const [error, setError] = useState('')
  const [raid, setRaid] = useState(null) // today's state (raid.js)
  const [questions, setQuestions] = useState(null)
  const [fs, setFs] = useState(newFight)
  const fsRef = useRef(fs)
  const pos = useRef(-1)
  const cardsRef = useRef([]) // [{ cardId, front, back }]
  const preRef = useRef(new Map())
  const firstHit = useRef(new Map()) // cardId -> the first answer's hit (what Anki records)
  const runId = useRef(`raid-${Date.now()}`).current
  const saved = useRef(false)
  const [summary, setSummary] = useState(null)
  const alive = useRef(true)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])

  const date = todayKey()
  const day = raid?.day
  const need = day ? Math.max(1, day.hp - day.damage) : 1 // what is left of today's health
  const motif = raid ? RAID_MOTIFS[shapeRaid(raid).boss] : RAID_MOTIFS[0]
  const bossName = t(`lg_raidBoss_${motif}`)
  const ability = RAID_ABILITY[motif] || ''
  const area = { id: `raid-${motif}`, title: t('lg_raidTitle'), motif, palette: 'night' }

  const load = async () => {
    setPhase('loading'); setError('')
    try {
      if (!ai.hasKey) throw new Error(t('lg_raidNoKey'))
      if (ctx.ankiConnected === false || !deck) throw new Error(t('lg_noDeck'))
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
      const cards = picked.map((c) => ({ cardId: c.cardId, ...ctx.cards.noteText(c) })).filter((c) => c.front)
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
    const st = fsRef.current
    const ratings = [...firstHit.current.entries()].map(([cardId, hit]) => {
      const r = raidRating(hit)
      return { cardId, ease: r.ease, rating: r.rating, front: cardsRef.current.find((c) => c.cardId === cardId)?.front || '' }
    })
    let recorded = 0, failed = 0
    let recordedIds = new Set()
    if (ratings.length) {
      try { const r = await recordReviews({ guardKey: GUARD_KEY, runId, deck, ratings, preSchedule: preRef.current }); recordedIds = new Set(r.recorded); recorded = r.recorded.length; failed = r.failed.length } catch { failed = ratings.length }
    }
    // Card XP and mistakes only for the cards Anki really recorded: an unrecorded card stays due, and the next raid
    // today would have paid and logged it again.
    for (const [cardId, hit] of firstHit.current) {
      if (!recordedIds.has(cardId)) continue
      const c = cardsRef.current.find((x) => x.cardId === cardId)
      ctx.emit(EVENTS.CARD_GRADED, { correct: hit.verdict !== 'miss', mode: modeId, front: c?.front || '', back: c?.back || '', cardId, misses: hit.verdict === 'miss' ? [{ question: hit.q?.prompt || '', answer: hit.answer || '', expected: (hit.q?.accepted || [])[0] || '' }] : [] })
    }
    let outcome = { won: false, firstWin: false }
    const next = await updateRaid(modeId, (cur) => { const res = applyRaidAttempt(raidToday(cur, date, cardsRef.current.length), date, st.damage); outcome = res; return res.state })
    const answered = firstHit.current.size
    ctx.emit(EVENTS.PRACTICE_DONE, { source: `${LEGENDS_ID}-raid`, mode: modeId, total: answered, correct: [...firstHit.current.values()].filter((h) => h.verdict !== 'miss').length })
    if (outcome.firstWin) ctx.emit(EVENTS.BOSS_BEATEN, { mode: modeId, area: 0, raid: true })
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
    if (phase === 'fight' && firstHit.current.size && !saved.current) { await save(); return }
    onExit?.()
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
          {summary.failed ? t('lg_raidRecordFailed', { n: summary.failed }) : t('lg_raidRecorded', { n: summary.recorded })}
        </div>
        {summary.saveFailed && <div style={{ color: C.danger, fontWeight: 800 }}>{t('lg_errSave')}</div>}
        <Trophies ctx={ctx} raid={raid} />
        <ChunkyButton color={C.success} onClick={onExit}>{t('lg_back')}</ChunkyButton>
      </div>
    )
  }

  // ── The fight ──
  const lives = RAID.lives
  const o = { need, lives }
  const outcome = fs.damage >= need ? 'won' : fs.livesLost >= lives ? 'lost' : ''
  // The bar and the phases follow the whole day's health: earlier attempts' wounds are already dealt.
  const dayHp = day ? day.hp : need
  const shown = { ...fs, damage: fs.damage + (day ? day.damage : 0) }
  const fightPhase = phaseOf(Math.max(0, dayHp - shown.damage), dayHp, RAID.phases)
  const record = (q, correct, answer, info = {}) => {
    pos.current++
    if (q._retry) return null
    const before = fsRef.current
    if (before.damage >= need || before.livesLost >= lives) return null
    const verdict = info.verdict || (correct ? 'clean' : 'miss')
    const hit = { verdict, mode: info.mode === 'choice' ? 'choice' : 'typed', attack: !!q._attack, lastStand: !!q._lastStand, key: q._cardId }
    if (!q._attack && !q._lastStand && q._cardId != null && !firstHit.current.has(q._cardId)) firstHit.current.set(q._cardId, { ...hit, q, answer })
    // The phase BEFORE this answer, from the whole day's health (earlier attempts' wounds count).
    const phaseNow = phaseOf(Math.max(0, dayHp - (before.damage + (day ? day.damage : 0))), dayHp, RAID.phases)
    let next = strike(before, hit, { ability, phase: phaseNow, need, lives })
    const over = next.damage >= need || next.livesLost >= lives
    // The Lich rises: every card still missed comes back, typed, right now (the last stand).
    if (next.last?.rise && !over) {
      const back = next.unredeemed.map((k) => questions.find((x) => String(x._cardId) === k)).filter(Boolean)
      fsRef.current = next
      setFs(next)
      return back.length ? { insert: back.map((x) => ({ ...x, alt: undefined, _lastStand: true })), at: pos.current + 1 } : null
    }
    let insert = null
    let at = attackSlot(pos.current, Number.MAX_SAFE_INTEGER, attackGapFor(ability))
    if (q._lastStand) {
      // A missed last-stand card comes back once more (each miss costs a life, so this ends).
      if (verdict === 'miss' && !over) { insert = { ...q }; at = pos.current + 2 }
    } else if (!q._attack && !over && canAttack(next)) {
      const base = verdict === 'miss' ? { ...q, alt: undefined } : info.attackQ ? { kind: 'typed', prompt: info.attackQ.prompt, accepted: info.attackQ.accepted, exact: !!info.attackQ.exact, target: q.target, _cardId: q._cardId } : null
      if (base) { insert = { ...base, _attack: true }; next = { ...next, attacks: next.attacks + 1 } }
    }
    fsRef.current = next
    setFs(next)
    return insert ? { insert, at } : null
  }
  const judge = async (q, ans) => {
    const j = await judgeStrike(ai, subject, q, ans, { strictAccents: !subject.accents || subject.strictAccents !== false })
    return {
      correct: j.verdict !== 'miss', partial: j.verdict === 'glancing', note: j.note || '', accent: !!j.accent && j.verdict !== 'miss',
      title: j.verdict === 'clean' ? t('lg_strikeClean') : j.verdict === 'glancing' ? t('lg_strikeGlancing') : '',
      info: { verdict: j.verdict, attackQ: j.attack || null },
    }
  }
  // One line under the strike label when the boss's ability applies to THIS question.
  const abilityHint = (q, mode) => {
    if (ability === 'plating' && fightPhase === 1 && mode === 'choice') return `🛡 ${t('lg_hint_plating')}`
    if (ability === 'regrowth' && q._attack) return `✂ ${t('lg_hint_regrowth', { n: ABILITY.regrowthCut })}`
    if (ability === 'singularity' && fightPhase >= 3) return `🌀 ${t('lg_hint_singularity', { n: ABILITY.singularityLives })}`
    if (ability === 'heads' && !q._attack && fs.chain % ABILITY.tripleEvery === ABILITY.tripleEvery - 1) return `🔥 ${t('lg_hint_heads')}`
    if (ability === 'judgment' && !q._attack && !q._lastStand) {
      const into = (fs.judged || 0) % ABILITY.judgmentEvery
      if (into === ABILITY.judgmentEvery - 1 && (fs.judgedRight || 0) === into) return `⚖️ ${t('lg_hint_judgment', { n: ABILITY.judgmentSmite })}`
    }
    const normal = !q._attack && !q._lastStand
    if (ability === 'maelstrom' && normal && fs.surge) return `🌊 ${t('lg_hint_maelstrom', { n: ABILITY.maelstromBonus })}`
    if (ability === 'kindling' && normal && (fs.chain || 0) + 1 >= ABILITY.kindlingFrom) return `🔥 ${t('lg_hint_kindling', { n: ABILITY.kindlingBonus })}`
    if (ability === 'rewind' && !(fs.rewound || []).includes(fightPhase)) return `⏳ ${t('lg_hint_rewind')}`
    if (ability === 'bloodpact' && normal && fs.livesLost > 0 && ((fs.chain || 0) + 1) % ABILITY.bloodpactEvery === 0) return `🩸 ${t('lg_hint_bloodpact')}`
    if (ability === 'tempest' && normal && ((fs.answers || 0) + 1) % ABILITY.tempestEvery === 0) return `⚡ ${t('lg_hint_tempest', { n: ABILITY.tempestFactor })}`
    if (ability === 'reflection' && normal && mode !== 'choice') return `🪞 ${t('lg_hint_reflection')}`
    if (ability === 'devour' && normal && mode !== 'choice') return `👄 ${t('lg_hint_devour', { n: ABILITY.devourChoke })}`
    if (ability === 'marionette' && q._attack) return `🎭 ${t('lg_hint_marionette', { n: ABILITY.marionetteCounter })}`
    if (ability === 'lastbreath' && lives - fs.livesLost === 1) return `🪓 ${t('lg_hint_lastbreath', { n: ABILITY.lastbreathFactor })}`
    return ''
  }
  const header = (q, mode) => (
    <div style={{ display: 'grid', gap: 6 }}>
      {q._lastStand && <div role="alert" style={{ padding: '8px 12px', borderRadius: RADIUS.md, background: `color-mix(in srgb, ${C.purple} 14%, ${C.surface})`, border: `2px solid ${C.purple}`, color: C.purple, fontWeight: 900, fontSize: 14 }}>☠ {t('lg_lastStandQ')}</div>}
      {q._attack && <div role="alert" style={{ padding: '8px 12px', borderRadius: RADIUS.md, background: `color-mix(in srgb, ${C.danger} 14%, ${C.surface})`, border: `2px solid ${C.danger}`, color: C.danger, fontWeight: 900, fontSize: 14 }}>⚔️ {t('lg_attackIncoming', { n: ATTACK_LIVES })}</div>}
      <div style={{ fontSize: 12, fontWeight: 800, color: mode === 'choice' ? C.info : C.warning }}>
        {mode === 'choice' ? `🛡 ${t('lg_strikeSafeHint')}` : `💥 ${t('lg_strikePowerHint')}`}{fightPhase > 1 ? ` · 😡 ${t('lg_rageNoSafe')}` : ''}
      </div>
      {abilityHint(q, mode) && <div style={{ fontSize: 12, fontWeight: 800, color: C.purple }}>{abilityHint(q, mode)}</div>}
    </div>
  )
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ maxWidth: 680, width: '100%', margin: '0 auto', position: 'sticky', top: 0, zIndex: 5, paddingTop: 4, background: C.bg }}>
        <BossArena t={t} area={area} name={bossName} need={dayHp} lives={lives} state={shown} phases={RAID.phases} ability={ability} focus={focus} getZoom={ctx.getZoom} kind="raids" />
      </div>
      {outcome ? <BossEnd t={t} won={outcome === 'won'} onDone={save} /> : (
        <QuizRunner questions={questions} t={t} ai={ai} subject={subject} ctx={ctx} confirm={ctx.confirm}
          title={`⚔️ ${bossName}`} onAnswer={record} judge={judge} header={header}
          canUseChoices={(q) => !q._attack && fightPhase === 1}
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
            <LegendsArt kind="raids" motif={x.motif} palette="night" height={48} width={48} round={0} room />
            {x.date}
          </div>
        ))}
      </div>
    </Card>
  )
}
