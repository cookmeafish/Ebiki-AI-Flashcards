// LEGENDS: the per-mode adventure map. First visit: a short questionnaire, then "I'm new" or a placement exam;
// Ebi plans the map; areas are detailed lazily as the learner climbs. This screen only orchestrates: rules in
// ./map.js and ./placement.js, AI in ./generate.js, storage in ./store.js.
import { useEffect, useRef, useState } from 'react'
import { C, FONT, RADIUS } from '../../config/tokens'
import { poseFile, shrimpUrl } from '../../config/shrimp'
import { useFeatureCtx, useIntent, featureCfg } from '../registry'
import { EVENTS } from '../events'
import { ChunkyButton, EbiSays, Card } from '../ui'
import { useLearner, updateLearner } from '../kit/learnerStore'
import { newLearner, applyLearnerDelta, deltaFor, bandFor, LEVEL_MAX } from '../kit/learner'
import { recordPractice } from '../kit'
import { useLegendsMap, updateMap, configureLegends, clearStep, claimReward, rewardKeyFor, LEGENDS_ID } from './store'
import { applyLegendaryResult, createMap, applyNodeResult, needsDetail, needsMoreAreas, starsFor, logDay, OPTIONAL_KINDS } from './map'
import { planMap, detailAreas, extendIfNeeded, detailAreaNow } from './generate'
import Questionnaire from './Questionnaire'
import Placement from './PlacementExam'
import MapView from './MapView'
import NodeRun, { ItemAddList, NewQuestionsButton } from './NodeRun'
import EditPanel from './EditPanel'
import AssetView from './AssetView'
import RaidRun from './RaidRun'
import { BossArt } from './art'
import { BossStyle } from './BossArena'
import { cheatsOn } from './CheatUI'
import { cheatCompleteNode, cheatCompleteArea, cheatUnlockTo, cheatResetNode, cheatResetArea, cheatClearArea } from './cheats'

export const LEGENDS_INTENT = 'legends' // = the nav id; payload { edit: '<request>' } opens "Change my map"
// A learner who picks "I'm new" starts near the bottom whatever they rated; the rating still nudges it.
const NEW_LEVEL = [0, 0, 3, 8, 14, 20]
const PLACEMENT_SOURCE = 'legends-placement' // the game gives the placement XP for this source

function Stars({ n }) {
  return <div aria-hidden="true" style={{ fontSize: 40, letterSpacing: 6 }}>{[1, 2, 3].map((i) => <span key={i} style={{ filter: i <= n ? 'none' : 'grayscale(1) opacity(.3)' }}>⭐</span>)}</div>
}

// Every question of the step with the learner's answer: the right ones too (only the misses were listed before).
function AllAnswers({ t, answers }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ width: '100%', textAlign: 'left' }}>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open}
        style={{ fontFamily: FONT.body, border: 'none', background: 'transparent', color: C.info, fontWeight: 800, fontSize: 14, cursor: 'pointer', padding: 0 }}>
        {open ? '▾' : '▸'} {t('lg_allAnswers', { n: answers.length })}
      </button>
      {open && (
        <Card style={{ marginTop: 8, boxSizing: 'border-box' }}>
          <div style={{ display: 'grid', gap: 10 }}>
            {answers.map((a, i) => (
              <div key={i} style={{ fontSize: 13.5, lineHeight: 1.45, borderBottom: `1px solid ${C.border}`, paddingBottom: 8 }}>
                <div style={{ fontWeight: 800, color: C.ink, whiteSpace: 'pre-wrap' }}>{a.correct ? '✅' : '❌'} {a.asked}</div>
                {a.answered && <div style={{ color: a.correct ? C.success : C.danger }}>{a.correct ? '✓' : '✗'} {a.answered}</div>}
                {!a.correct && a.expected && <div style={{ color: C.success }}>✓ {a.expected}</div>}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

function Result({ ctx, modeId, result, onBack, onRetry, onNewQuestions }) {
  const { t } = ctx
  const { node, area, res, passed, stars, areaDone, nextTitle, earnedLife, firstLegend, helper, flawless, nudgeIds = [] } = result
  const fight = node.kind === 'boss' || node.kind === 'legendary'
  const pose = areaDone ? 'party' : passed ? 'happy' : 'confused'
  return (
    <div style={{ maxWidth: 600, margin: '24px auto', display: 'grid', gap: 16, justifyItems: 'center', textAlign: 'center' }}>
      {node.kind === 'boss' ? (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18 }}>
          <img src={shrimpUrl(poseFile(pose))} alt="" width={120} />
          <BossArt area={area} size={110} room style={passed ? { filter: 'grayscale(.6) opacity(.7)', transform: 'rotate(-8deg)' } : undefined} />
        </div>
      ) : <img src={shrimpUrl(poseFile(pose))} alt="" width={130} />}
      <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 30, color: passed ? C.success : C.warning, lineHeight: 1.1 }}>
        {areaDone ? `🏆 ${t('lg_areaCleared', { area: area.title })}` : passed ? t('lg_stepCleared') : t('lg_stepFailed')}
      </div>
      {passed && <Stars n={stars} />}
      {res.total > 0 && <div style={{ fontSize: 16, fontWeight: 800, color: C.inkDim }}>{t('lg_score', { c: res.correct, n: res.total })}</div>}
      {(flawless || (fight && passed && res.power)) && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {flawless && !OPTIONAL_KINDS.has(node.kind) && <span style={{ fontWeight: 900, color: C.warning, fontSize: 14 }}>✨ {t('lg_badgeFlawless')}</span>}
          {fight && passed && res.power && <span style={{ fontWeight: 900, color: C.danger, fontSize: 14 }}>💥 {t('lg_badgePower')}</span>}
        </div>
      )}
      {helper && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: RADIUS.lg, border: `2px solid ${C.purple}`, background: `color-mix(in srgb, ${C.purple} 10%, ${C.surface})` }}>
          <span style={{ fontSize: 30 }}>{helper === 'shield' ? '🛡' : '📜'}</span>
          <span style={{ textAlign: 'left', fontSize: 14, fontWeight: 800, color: C.ink }}>{helper === 'shield' ? t('lg_helperShield') : t('lg_helperScroll')}</span>
        </div>
      )}
      {node.kind === 'boss' && !passed && area.nemesis?.itemIds?.length > 0 && <div style={{ fontSize: 14, fontWeight: 800, color: C.danger }}>👿 {t('lg_nemesisSet')}</div>}
      {nudgeIds.length > 0 && (
        <Card style={{ width: '100%', boxSizing: 'border-box', textAlign: 'left', display: 'grid', gap: 10 }}>
          <EbiSays pose={poseFile('book')}>{t('lg_nudgeMissed')}</EbiSays>
          <ItemAddList ctx={ctx} modeId={modeId} areaId={area.id} itemIds={nudgeIds} />
        </Card>
      )}
      {areaDone && result.bossPaid !== false && <div style={{ fontSize: 15, fontWeight: 800, color: C.info }}>❄ {t('lg_bossFreeze')}</div>}
      {earnedLife && <BossStyle />}
      {earnedLife && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: RADIUS.lg, border: `2px solid ${C.warning}`, background: `color-mix(in srgb, ${C.warning} 10%, ${C.surface})`, animation: 'lgPopIn .5s cubic-bezier(.3,1.6,.5,1) both' }}>
          <span style={{ fontSize: 34 }}>💖</span>
          <span style={{ textAlign: 'left' }}>
            <span style={{ display: 'block', fontFamily: FONT.display, fontWeight: 900, fontSize: 20, color: C.warning }}>{t('lg_weakEarned')}</span>
            <span style={{ fontSize: 13.5, color: C.inkDim, fontWeight: 700 }}>{t('lg_weakEarnedSub')}</span>
          </span>
        </div>
      )}
      {node.kind === 'weak' && passed && !earnedLife && area.bonusLife && <div style={{ fontSize: 13.5, fontWeight: 700, color: C.inkDim }}>💖 {t('lg_weakAlready')}</div>}
      {node.kind === 'legendary' && passed && <div style={{ fontFamily: FONT.display, fontSize: 20, fontWeight: 900, color: C.purple }}>🏅 {firstLegend ? t('lg_legendaryWon') : t('lg_legendaryAgainWon')}</div>}
      {areaDone && nextTitle && <div style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>{t('lg_nextArea', { area: nextTitle })}</div>}
      {node.kind === 'boss' && passed && (
        <Card style={{ width: '100%', boxSizing: 'border-box', textAlign: 'left' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 8 }}>{t('lg_bossCards')}</div>
          <ItemAddList ctx={ctx} modeId={modeId} areaId={area.id} itemIds={area.items.map((it) => it.id)} />
        </Card>
      )}
      {res.answers?.length > 0 && <AllAnswers t={t} answers={res.answers} />}
      {!passed && res.misses?.length > 0 && (
        <Card title={t('lg_review')} style={{ width: '100%', boxSizing: 'border-box', textAlign: 'left' }}>
          <div style={{ display: 'grid', gap: 10 }}>
            {res.misses.slice(0, 12).map((m, i) => (
              <div key={i} style={{ fontSize: 13.5, lineHeight: 1.45, borderBottom: `1px solid ${C.border}`, paddingBottom: 8 }}>
                <div style={{ fontWeight: 800, color: C.ink, whiteSpace: 'pre-wrap' }}>{m.asked}</div>
                {m.answered && <div style={{ color: C.danger }}>✗ {m.answered}</div>}
                {m.expected && <div style={{ color: C.success }}>✓ {m.expected}</div>}
              </div>
            ))}
          </div>
        </Card>
      )}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        {!passed && <ChunkyButton onClick={onRetry} color={C.warning}>↻ {t('lg_tryAgain')}</ChunkyButton>}
        <ChunkyButton onClick={onBack} color={C.success}>{t('lg_toMap')}</ChunkyButton>
      </div>
      {node.kind !== 'talk' && node.kind !== 'adventure' && <NewQuestionsButton t={t} onClick={onNewQuestions} />}
    </div>
  )
}

// How long a mode switch keeps the previous screen while the new mode's map is read, before "Loading" shows.
const HOLD_MS = 400

const BUSY_VIEWS = new Set(['node', 'placement', 'questionnaire', 'raid', 'edit'])
export default function LegendsScreen() {
  const ctx = useFeatureCtx()
  const modeId = ctx?.subject?.modeId
  const { map, loaded, failed, retry } = useLegendsMap(modeId)
  const { model: learner } = useLearner(modeId)
  const [view, setView] = useState('map') // map | intro | questionnaire | placement | node | result | edit
  const [openStep, setOpenStep] = useState(null) // { area, node, misses }
  const [result, setResult] = useState(null)
  const [edit, setEdit] = useState({ text: '', auto: false })
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [startAnswers, setStartAnswers] = useState(null)
  const workSeq = useRef(0)
  const held = useRef(null) // the last screen shown (see the end)
  // The live mode (an await that finishes after a mode switch must not show its screen under the new mode) and a
  // claim on finishing a step (a double click on "See the result" recorded the step and paid its XP twice).
  const modeIdRef = useRef(modeId)
  modeIdRef.current = modeId
  const finishingRef = useRef(false)
  const [slow, setSlow] = useState(false)
  if (ctx) configureLegends(ctx)
  useEffect(() => {
    setSlow(false)
    if (loaded) return undefined
    const id = setTimeout(() => setSlow(true), HOLD_MS)
    return () => clearTimeout(id)
  }, [loaded, modeId])

  // A mode switch starts this screen over (the map and learner hooks follow the new mode by themselves).
  useEffect(() => { setView('map'); setOpenStep(null); setResult(null); setError(''); setBusy(''); setPendingEdit(null) }, [modeId])
  // Help's "change my map" waits until there IS a map (on a first visit it was dropped) and until no step, exam or
  // fight is running (it used to throw a boss fight away without asking).
  const [pendingEdit, setPendingEdit] = useState(null)
  useIntent(LEGENDS_INTENT, (p) => { if (p?.edit) setPendingEdit(String(p.edit)) })
  useEffect(() => {
    if (pendingEdit == null || !map?.areas?.length || BUSY_VIEWS.has(view)) return
    setEdit({ text: pendingEdit, auto: true }); setView('edit'); setPendingEdit(null)
  }, [pendingEdit, map, view])

  const ready = !!map?.areas?.length

  // Background work while the map is on screen: plan the map when it has no areas, detail the next areas,
  // plan more near the end, draw banners. One pass at a time; the mode id is pinned for every write.
  useEffect(() => {
    if (!ctx || !loaded || !map || view !== 'map' || !ctx.ai.hasKey) return
    const placementPending = map.start?.path === 'place' && !map.start?.placement
    if (placementPending) return
    const my = ++workSeq.current
    const pinned = modeId
    const live = () => my === workSeq.current
    const run = async () => {
      try {
        if (!map.areas.length) { setBusy(ctx.t('lg_planning')); await planMap(ctx, pinned) }
        if (!live()) return
        setBusy(needsDetail(map).length || !map.areas.length ? ctx.t('lg_preparingArea') : '')
        await detailAreas(ctx, pinned)
        if (!live()) return
        if (needsMoreAreas(map)) { setBusy(ctx.t('lg_planningMore')); await extendIfNeeded(ctx, pinned) }
        if (live()) { setBusy(''); setError('') }
      } catch (e) { if (live()) { setBusy(''); setError(String(e.message || e)) } }
    }
    run()
  }, [loaded, map?.updatedAt, map?.areas?.length, view, modeId]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { workSeq.current++ }, [])

  if (!ctx) return null
  const { t, ai, subject } = ctx

  const screen = () => {
    if (failed && !map) {
      return (
        <div style={{ maxWidth: 520, margin: '40px auto', display: 'grid', gap: 14 }}>
          <EbiSays pose={poseFile('confused')}>{t('lg_readFailed')}</EbiSays>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}><ChunkyButton onClick={retry} color={C.success}>{t('lg_retry')}</ChunkyButton></div>
        </div>
      )
    }

    // ── First visit ──
    const saveStart = async (a) => {
      const start = { reason: a.reason, selfRating: a.selfRating, goal: a.goal, path: a.path, placement: null }
      const saved = await updateMap(modeId, (m) => (m ? { ...m, start } : createMap({ modeId, subject, start, plan: [] })))
      const pinned = modeId
      // A failed save leaves the questionnaire (it shows no errors: its buttons just did nothing) for the map
      // screen, which shows the error with its retry.
      if (!saved) { if (pinned === modeIdRef.current) { setError(t('lg_errSave')); setView('map') } return }
      if (pinned !== modeIdRef.current) return
      if (a.path === 'place') { setStartAnswers(a); setView('placement'); return }
      await updateLearner(ctx, pinned, (m) => m || newLearner({ level: NEW_LEVEL[a.selfRating] || 0, confidence: 0.2, source: 'self' }))
      if (pinned === modeIdRef.current) setView('map')
    }
    const placementDone = async (r) => {
      const pinned = modeId
      await updateMap(pinned, (m) => (m ? { ...m, start: { ...(m.start || {}), placement: { level: r.level, answered: r.answered.length, at: Date.now() } } } : m))
      await updateLearner(ctx, pinned, () => newLearner({ level: r.level, confidence: r.confidence, strengths: r.strengths, gaps: r.gaps, source: 'placement' }))
      // The placement XP is paid once per mode (a retake after Start over pays nothing more).
      if (await claimReward(pinned, rewardKeyFor('placement'))) ctx.emit(EVENTS.PRACTICE_DONE, { source: PLACEMENT_SOURCE, mode: pinned, total: r.answered.length, correct: r.answered.filter((x) => x.correct).length })
      if (pinned !== modeIdRef.current) return
      setResult({ placement: r })
      setView('placed')
    }

    if (view === 'questionnaire') {
      // The style step's answers are settings (focus mode, accent grading), saved as soon as the questionnaire ends.
      const done = (answers) => {
        ctx.setFeatureSettings(LEGENDS_ID, { focus: answers.style === 'focus' })
        if (subject.accents && typeof answers.accents === 'boolean' && answers.accents !== (subject.strictAccents !== false)) subject.setStrictAccents?.(answers.accents)
        return saveStart(answers)
      }
      return <Questionnaire t={t} subject={subject} focus={featureCfg(ctx, LEGENDS_ID).focus === true} onBack={() => setView('map')} onDone={done} />
    }
    if (view === 'placement') {
      return <Placement ctx={ctx} selfRating={startAnswers?.selfRating || map?.start?.selfRating || 1} onDone={placementDone} onQuit={() => setView('map')} />
    }
    if (view === 'placed' && result?.placement) {
      const band = bandFor(result.placement.level, subject.isLanguage)
      return (
        <div style={{ maxWidth: 560, margin: '30px auto', display: 'grid', gap: 16, justifyItems: 'center', textAlign: 'center' }}>
          <img src={shrimpUrl(poseFile('party'))} alt="" width={130} />
          <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 28, color: C.ink }}>{t('lg_placedTitle')}</div>
          <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 44, color: C.purple, lineHeight: 1 }}>{result.placement.level}</div>
          <div style={{ fontSize: 17, fontWeight: 800, color: C.ink }}>{t(`lg_band_${band.key}`)}</div>
          <div style={{ fontSize: 14, color: C.inkDim }}>{t('lg_placedBody')}</div>
          <ChunkyButton color={C.success} onClick={() => { setResult(null); setView('map') }}>{t('lg_seeMap')}</ChunkyButton>
        </div>
      )
    }

    if (!map) {
      return (
        <div style={{ maxWidth: 600, margin: '30px auto', display: 'grid', gap: 18 }}>
          <EbiSays pose={poseFile('king')}>{t('lg_welcome', { subject: subject.name })}</EbiSays>
          <div style={{ fontSize: 14.5, color: C.inkDim, lineHeight: 1.55 }}>{t('lg_welcomeBody')}</div>
          {!ai.hasKey && <div style={{ color: C.warning, fontSize: 13 }}>{t('lg_needKey')}</div>}
          {error && <div style={{ color: C.danger, fontSize: 13 }}>{error}</div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <ChunkyButton color={C.success} onClick={() => setView('questionnaire')} disabled={!ai.hasKey}>{t('lg_begin')}</ChunkyButton>
          </div>
        </div>
      )
    }

    // Answers saved, "Find my level" chosen, exam not finished (left midway, or the app closed).
    if (!ready && map.start?.path === 'place' && !map.start?.placement) {
      return (
        <div style={{ maxWidth: 600, margin: '30px auto', display: 'grid', gap: 18 }}>
          <EbiSays pose={poseFile('book')}>{t('lg_resumePlacement')}</EbiSays>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <ChunkyButton variant="ghost" color={C.inkDim} onClick={() => saveStart({ ...map.start, path: 'new' })}>🌱 {t('lg_startNew')}</ChunkyButton>
            <ChunkyButton color={C.success} onClick={() => setView('placement')} disabled={!ai.hasKey}>🧭 {t('lg_startPlace')}</ChunkyButton>
          </div>
        </div>
      )
    }

    if (!ready) {
      return (
        <div style={{ maxWidth: 560, margin: '50px auto', display: 'grid', gap: 14, justifyItems: 'center' }}>
          <EbiSays pose={poseFile('artist')}>{error ? error : busy || t('lg_planning')}</EbiSays>
          {error && <ChunkyButton color={C.success} onClick={() => { setError(''); updateMap(modeId, (m) => (m ? { ...m, updatedAt: Date.now() } : m)) }}>{t('lg_retry')}</ChunkyButton>}
          {!ai.hasKey && <div style={{ color: C.warning, fontSize: 13 }}>{t('lg_needKey')}</div>}
        </div>
      )
    }

    // ── A step ──
    const finishStep = async (res) => {
      if (finishingRef.current) return
      finishingRef.current = true
      try { await finishStepNow(res) } finally { finishingRef.current = false }
    }
    const finishStepNow = async (res) => {
      const { area, node } = openStep
      const pinned = modeId
      let outcome = null
      const cheating = cheatsOn(ctx)
      let hadLife = false
      let replays = 0
      let nudgeIds = []
      const nudgeOn = featureCfg(ctx, LEGENDS_ID).nudge !== false
      const today = new Date().toLocaleDateString('en-CA')
      // After the result lands: the day goes on the journey heatmap, and items missed for the FIRST time (not in the
      // deck yet) are offered as cards once on the result screen (then marked, so it never nags about them again).
      const after = (m) => {
        let next = logDay(m, today)
        const missed = [...new Set((res.items || []).filter((x) => !x.correct).map((x) => x.itemId))]
        const la = next.areas.find((a) => a.id === area.id)
        nudgeIds = nudgeOn ? missed.filter((id) => { const it = la?.items?.find((x) => x.id === id); return it && !it.missNudged && !it.cardNoteId }) : []
        if (nudgeIds.length) next = { ...next, areas: next.areas.map((a) => (a.id !== area.id ? a : { ...a, items: a.items.map((it) => (nudgeIds.includes(it.id) ? { ...it, missNudged: true } : it)) })) }
        return next
      }
      await updateMap(pinned, (m) => {
        if (!m) return m
        const live = m.areas.find((a) => a.id === area.id)
        hadLife = !!live?.bonusLife
        const before = live?.nodes?.find((n) => n.id === node.id)
        // Replays of a step already cleared pay less XP each time (game engine replayFactor).
        replays = before?.status === 'done' ? Math.max(1, before.attempts || 1) : node.kind === 'legendary' && live?.legendary ? 1 : 0
        // A Legendary run is not a node of the map: a pass marks the area legendary.
        if (node.kind === 'legendary') { outcome = applyLegendaryResult(m, area.id, res); outcome.map = after(outcome.map); return outcome.map }
        const liveNode = live?.nodes?.find((n) => n.id === node.id)
        if (cheating && liveNode?.status === 'locked') {
          // Cheat mode opened a locked step: a win still counts (the normal rules refuse a locked step).
          const stars = res.total ? starsFor(Math.min(1, res.correct / res.total), node.kind) : 0
          if (!stars) { outcome = { map: m, passed: false, stars: 0, areaDone: false, nextAreaId: null }; return m }
          let next = cheatCompleteNode(m, area.id, node.id)
          // A Weak spots win pays its life here too (the screen says so).
          if (node.kind === 'weak') next = { ...next, areas: next.areas.map((a) => (a.id === area.id ? { ...a, bonusLife: true } : a)) }
          const i = next.areas.findIndex((a) => a.id === area.id)
          const areaDone = node.kind === 'boss' && live.status !== 'done'
          outcome = { map: after(next), passed: true, stars, areaDone, nextAreaId: areaDone ? next.areas[i + 1]?.id || null : null }
          return outcome.map
        }
        outcome = applyNodeResult(m, area.id, node.id, res)
        outcome.map = after(outcome.map)
        return outcome.map
      })
      if (!outcome) { setError(t('lg_errSave')); setView('map'); return }
      const { passed, stars, areaDone, nextAreaId } = outcome
      const earnedLife = node.kind === 'weak' && passed && !hadLife // the Weak spots heart, once per island
      const source = node.kind === 'boss' ? 'boss' : 'legends'
      const bossTopics = node.kind === 'boss' ? (passed ? { strengths: [area.title] } : { gaps: [area.title] }) : {}
      await updateLearner(ctx, pinned, (m) => (m ? applyLearnerDelta(m, deltaFor(source, res.total, res.correct), 'legends', { strengths: res.strengths || bossTopics.strengths, gaps: res.gaps || bossTopics.gaps }) : m))
      // Clearing a step counts for the "Legends" quest (XP grows with the area); a failed try still earns practice
      // XP. The FIRST win over an area's boss also earns a streak freeze (replays never do).
      ctx.emit(EVENTS.PRACTICE_DONE, { source: passed ? LEGENDS_ID : `${LEGENDS_ID}-try`, mode: pinned, total: res.total, correct: res.correct })
      const areaNo = Math.max(0, outcome.map.areas.findIndex((a) => a.id === area.id))
      if (passed) ctx.emit(EVENTS.LEGENDS_STEP, { mode: pinned, kind: node.kind, area: areaNo, effort: res.effort ?? 1, replays })
      // A boss's first-win reward (XP + a streak freeze) is paid once per island topic, even across Start over.
      const bossPaid = areaDone && (await claimReward(pinned, rewardKeyFor('boss', area.title)))
      if (bossPaid) ctx.emit(EVENTS.BOSS_BEATEN, { mode: pinned, area: areaNo })
      recordPractice(ctx, LEGENDS_ID, [{ kind: 'topic', label: area.title }])
      const liveArea = outcome.map.areas.find((a) => a.id === area.id) || area
      if (pinned !== modeIdRef.current) return // recorded for its own mode; the screen now shows another one
      setResult({ node, area: liveArea, res, passed, stars, areaDone, bossPaid, earnedLife, firstLegend: !!outcome.firstLegend, helper: outcome.helper || '', flawless: !!outcome.flawless, nudgeIds, nextTitle: nextAreaId ? outcome.map.areas.find((a) => a.id === nextAreaId)?.title : '' })
      setView('result')
    }

    // Bad questions: forget the step's saved set and open it again (a new set is made). For everyone, not a cheat.
    const newQuestions = async (area, node) => {
      // A fight is written fresh every time and its step file holds the questions already asked (never repeated):
      // it is only reopened, never cleared.
      const fight = node.kind === 'boss' || node.kind === 'legendary'
      if (!fight && !(await clearStep(modeId, area.id, node.id))) { ctx.notify?.(t('lg_errSave')); return }
      ctx.notify?.(t('lg_newQuestionsDone'))
      const liveArea = map.areas.find((a) => a.id === area.id) || area
      const liveNode = liveArea.nodes.find((n) => n.id === node.id) || node
      setResult(null)
      setOpenStep({ area: liveArea, node: liveNode, misses: [], try: (openStep?.try || 0) + 1 })
      setView('node')
    }

    if (view === 'node' && openStep) {
      return (
        <NodeRun key={`${openStep.area.id}:${openStep.node.id}:${openStep.try || 0}`} cheat={cheatsOn(ctx)} ctx={ctx} modeId={modeId} area={openStep.area} node={openStep.node} misses={openStep.misses || []}
          onFinish={finishStep} onQuit={() => { setOpenStep(null); setView('map') }}
          onNewQuestions={() => newQuestions(openStep.area, openStep.node)} />
      )
    }
    if (view === 'result' && result?.node) {
      return (
        <Result ctx={ctx} modeId={modeId} result={result} onNewQuestions={() => newQuestions(result.area, result.node)}
          onBack={() => { setResult(null); setOpenStep(null); setView('map') }}
          onRetry={() => { const area = map.areas.find((a) => a.id === result.area.id) || result.area; const node = area.nodes.find((n) => n.id === result.node.id) || result.node; setOpenStep({ area, node, misses: (result.res.misses || []).map((m) => m.expected || m.asked).filter(Boolean), try: (openStep?.try || 0) + 1 }); setResult(null); setView('node') }} />
      )
    }
    if (view === 'raid') return <RaidRun key={modeId} ctx={ctx} onExit={() => setView('map')} />
    // Cheat mode only: every stage's drawings (AssetView.jsx). Turning cheats off while it is open goes back to the map.
    if (view === 'assets' && cheatsOn(ctx)) return <AssetView ctx={ctx} onBack={() => setView('map')} />
    if (view === 'edit') {
      return <EditPanel key={edit.text} ctx={ctx} modeId={modeId} initial={edit.text} autoRun={edit.auto} onClose={(saved) => { setEdit({ text: '', auto: false }); setView('map'); if (saved) ctx.notify?.(t('lg_editSaved')) }} />
    }

    const restart = async () => {
      if (!(await ctx.confirm(t('lg_restartConfirm')))) return
      workSeq.current++
      const ok = await updateMap(modeId, () => null)
      if (ok === undefined) setError(t('lg_errSave'))
      setView('map')
    }
    // Cheat mode (hidden; CheatUI.jsx): skip, unlock and regenerate, for testing. Map changes here pay no rewards.
    const saveCheat = async (fn) => { if ((await updateMap(modeId, (m) => (m ? fn(m) : m))) === undefined) setError(t('lg_errSave')) }
    const cheat = !cheatsOn(ctx) ? null : {
      busy: !!busy,
      completeStep: (a, n) => saveCheat((m) => cheatCompleteNode(m, a, n)),
      resetStep: (a, n) => saveCheat((m) => cheatResetNode(m, a, n)),
      newQuestions: async (a, n) => { ctx.notify?.((await clearStep(modeId, a, n)) ? t('lg_cheatNewQsDone') : t('lg_errSave')) },
      completeArea: (a) => saveCheat((m) => cheatCompleteArea(m, a)),
      resetArea: (a) => saveCheat((m) => cheatResetArea(m, a)),
      unlockTo: (a) => saveCheat((m) => cheatUnlockTo(m, a)),
      regenArea: async (a) => {
        if (!(await ctx.confirm(t('lg_cheatRegenConfirm')))) return
        await saveCheat((m) => cheatClearArea(m, a))
        cheat.detailNow(a)
      },
      detailNow: async (a) => {
        const pinned = modeId
        setBusy(t('lg_preparingArea')); setError('')
        try { await detailAreaNow(ctx, pinned, a) } catch (e) { setError(String(e.message || e)) } finally { setBusy('') }
      },
      assets: () => setView('assets'),
      setLevel: async () => {
        const v = await ctx.prompt?.(t('lg_cheatLevelAsk', { max: LEVEL_MAX }))
        const n = Number(String(v ?? '').replace(',', '.'))
        if (v == null || String(v).trim() === '' || !Number.isFinite(n)) return
        const level = Math.max(0, Math.min(LEVEL_MAX, n))
        await updateLearner(ctx, modeId, (m) => (m ? { ...m, level, peak: Math.max(m.peak ?? m.level, level) } : newLearner({ level, source: 'cheat' })), { quiet: true })
      },
      placement: () => { setStartAnswers(null); setView('placement') },
    }
    return (
      <MapView ctx={ctx} map={map} learner={learner} busy={busy} error={error} cheat={cheat} onRaid={() => setView('raid')}
        onRetry={() => { setError(''); updateMap(modeId, (m) => (m ? { ...m, updatedAt: Date.now() } : m)) }}
        onOpen={(area, node) => { if (!ai.hasKey) { setError(t('lg_needKey')); return } setOpenStep({ area, node }); setView('node') }}
        onLegendary={(area, node) => { if (!ai.hasKey) { setError(t('lg_needKey')); return } setOpenStep({ area, node }); setView('node') }}
        onEdit={() => { setEdit({ text: '', auto: false }); setView('edit') }}
        onRestart={restart} />
    )
  }

  // Switching to a mode whose map is not read yet: keep what was on screen (the SAME elements, so nothing
  // remounts or restarts) instead of flashing "Loading" for the few milliseconds a read takes. A slow read
  // (a shared folder) shows the loading line after HOLD_MS. A failed read is not "loading": it shows its retry.
  if (!loaded && !failed) {
    if (held.current && !slow) return held.current
    return <div style={{ padding: 30, color: C.inkDim, fontWeight: 700 }}>{t('lg_loading')}</div>
  }
  const out = screen()
  held.current = out
  return out
}

