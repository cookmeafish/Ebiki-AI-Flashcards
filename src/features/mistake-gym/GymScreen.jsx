// Mistake Gym: your recent misses, a diagnosis, and a fresh workout aimed at them. Never touches Anki.
import { useEffect, useRef, useState } from 'react'
import { C, FONT, RADIUS } from '../../config/tokens'
import { useFeatureCtx, useActivityBusy } from '../registry'
import { ChunkyButton, Card, EbiSays, tCount } from '../ui'
import { poseFile } from '../../config/shrimp'
import { QuizRunner, sanitizeQuestions, RuleCardButton, readPracticeLog, recordPractice } from '../kit'
import { learnerLevelLine } from '../kit/learnerStore'
import { EVENTS } from '../events'
import { useHelpEntry } from '../kit/useHelp'
import { useMistakes, updateMistakes, configureGym, GYM_FEATURE_ID } from './store'
import { pickForWorkout, applyPractice, WORKOUT_SIZE, GYM_SRC } from './mistakes'
import { buildWorkoutPrompt, workoutQuestions, WORKOUT_ROLE, WORKOUT_MAX_TOKENS } from './prompt'

const PREVIEW = 6          // mistakes listed on the overview
const SLIPS = 10           // grammar slips fed to the workout
const MIN_QUESTIONS = 3    // fewer usable questions than this = the workout failed
const SLIP_ROWS = 5        // recurring slips listed with a rule-card button

export default function GymScreen({ onExit }) {
  const ctx = useFeatureCtx()
  const modeId = ctx?.subject?.modeId
  const { list, failed } = useMistakes(modeId)
  const [phase, setPhase] = useState('overview') // overview | loading | run
  const [workout, setWorkout] = useState(null)   // { diagnosis, questions, targets }
  const [error, setError] = useState('')
  const [quizDone, setQuizDone] = useState(false) // the result screen: nothing left to lose
  // The running workout's first answers, its mode and the context it started in. Left by Back, a mode switch (the hub
  // closes the activity) or a tab change, the answers given still count (they were lost: no progress, no log).
  const runRef = useRef(null) // { answers, settled, modeId, ctx, workout }
  useEffect(() => () => { const r = runRef.current; if (r && !r.settled) settleRun(r, r.answers) }, [])
  // What Ebi's Help knows: the mistakes collected, and the workout's diagnosis. While a workout runs only the
  // fronts are named (the quiz itself reports its question; its answers stay secret).
  // Every listed mistake (`cleared` counts right answers; one right answer leaves it on the list, so Help sees it too).
  const top = (list?.items || []).slice(0, 10)
  useHelpEntry(ctx, 'mistake-gym', [
    `Activity open: Mistake Gym (${phase === 'run' ? 'a workout is running' : 'the overview'}). ${(list?.items || []).length} mistakes collected from studying.`,
    phase !== 'run' && top.length ? `Most recent mistakes: ${top.map((m) => `"${m.front}" (asked "${String(m.question || '').slice(0, 100)}", answered "${String(m.answer || '').slice(0, 60)}"${m.expected ? `, expected "${String(m.expected).slice(0, 60)}"` : ''}${m.n > 1 ? `, missed ${m.n} times` : ''})`).join('; ')}` : '',
    phase !== 'run' && workout?.diagnosis ? `The workout's diagnosis: ${String(workout.diagnosis).slice(0, 500)}` : '',
  ].filter(Boolean).join('\n'))
  useActivityBusy(phase === 'loading' || (phase === 'run' && !quizDone)) // Back asks only mid-workout
  if (!ctx) return null
  const { t, subject, ai } = ctx
  configureGym({ isBlocked: () => !!ctx.isDataSwitching?.() })
  const items = list?.items || []
  const slips = subject.isLanguage ? subject.grammarSlips(SLIPS) : ''
  const canTrain = ai.hasKey && (items.length > 0 || !!slips)
  const slipList = subject.grammarSlipList ? subject.grammarSlipList(SLIP_ROWS) : []

  const start = async () => {
    setError(''); setQuizDone(false); setPhase('loading')
    try {
      // Inside the try: a store or level read that throws left the screen on "building" for good.
      const targets = pickForWorkout(list, WORKOUT_SIZE, { log: await readPracticeLog(ctx) })
      const { system, user } = buildWorkoutPrompt(subject, targets, { slips, level: await learnerLevelLine(ctx, { context: true }) })
      const raw = await ai.call(system, user, { role: WORKOUT_ROLE, maxTokens: WORKOUT_MAX_TOKENS })
      const j = ai.json(raw)
      const questions = sanitizeQuestions(workoutQuestions(j, ai.clean), { clean: ai.clean })
      if (questions.length < MIN_QUESTIONS) throw new Error(t('gym_badWorkout'))
      const w = { diagnosis: ai.clean(typeof j?.diagnosis === 'string' ? j.diagnosis : ''), questions, targets }
      runRef.current = { answers: [], settled: false, modeId, ctx, workout: w }
      setWorkout(w)
      setPhase('run')
    } catch (e) { setError(String(e.message || e)); setPhase('overview') }
  }

  // The mistake a question targets (for the rule card and the practice log).
  const mistakeOf = (q) => (workout?.targets || []).find((m) => m.id === q?.target) || null
  const finish = (results, done = false) => settleRun(runRef.current, results, done)

  if (phase === 'run' && workout) {
    return (
      <div style={{ height: '100%' }}>
        {workout.diagnosis && (
          <div style={{ maxWidth: 640, margin: '0 auto 14px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13.5, color: C.purple, fontWeight: 700 }}>🧠 {workout.diagnosis}</span>
            <RuleCardButton ctx={ctx} compact source={{ text: workout.diagnosis }} />
          </div>
        )}
        <QuizRunner questions={workout.questions} t={t} ai={ai} subject={subject} ctx={ctx} confirm={ctx.confirm} title={t('gym_title')}
          onAnswer={(q, correct, a, info) => {
            if (runRef.current && !q?._retry && !q?._extra) runRef.current.answers.push({ question: q, correct })
            if (!info?.skipped) ctx.emit(EVENTS.PRACTICE_ANSWERED, { source: GYM_FEATURE_ID, correct, mode: modeId }) }}
          onFinish={(r) => { finish(r, true); setQuizDone(true) }}
          feedbackExtra={(q, correct, answer) => (correct ? null : (
            <RuleCardButton ctx={ctx} compact source={{ text: q.explanation, card: mistakeOf(q)?.front, asked: q.prompt, answered: answer, expected: q.kind === 'choice' ? q.choices[q.answerIdx] : (q.accepted || [])[0] }} />
          ))}
          onExit={(partial) => { if (Array.isArray(partial) && partial.length) finish(partial); setPhase('overview'); setWorkout(null) }} />
      </div>
    )
  }

  return (
    <div>
      <button onClick={onExit} style={{ border: 'none', background: 'transparent', color: C.inkDim, fontWeight: 800, cursor: 'pointer', marginBottom: 12, fontSize: 13 }}>← {t('gym_back')}</button>
      <EbiSays pose={poseFile('work')}>
        {phase === 'loading' ? t('gym_building') : items.length ? tCount(t, 'gym_intro', items.length) : slips ? t('gym_introSlips') : t('gym_empty')}
      </EbiSays>
      {failed && <div style={{ color: C.danger, fontSize: 13, marginTop: 12 }}>{t('gym_unreadable')}</div>}
      {error && <div style={{ color: C.danger, fontSize: 13, marginTop: 12 }}>{error}</div>}
      {!ai.hasKey && <div style={{ color: C.warning, fontSize: 13, marginTop: 12 }}>{t('gym_needKey')}</div>}
      <div style={{ margin: '18px 0' }}>
        <ChunkyButton onClick={start} disabled={!canTrain || phase === 'loading'} color={C.success}>{phase === 'loading' ? t('gym_building') : t('gym_start')}</ChunkyButton>
      </div>
      {items.length > 0 && (
        <Card title={t('gym_recent')}>
          {pickForWorkout(list, PREVIEW).map((m) => (
            <div key={m.id} style={{ padding: '8px 0', borderTop: `1px solid ${C.border}`, fontSize: 13.5 }}>
              <div style={{ fontWeight: 800, color: C.ink }}>{m.front}{m.n > 1 && <span style={{ marginLeft: 8, color: C.danger, fontSize: 12 }}>×{m.n}</span>}</div>
              <div style={{ color: C.inkDim }}>{m.question}</div>
              {/* No ✗ without an answer (an Ebi Call card the learner could not produce, a skip): it showed an empty cross. */}
              <div>{m.answer && <span style={{ color: C.danger }}>✗ {m.answer}</span>}{m.expected && <span style={{ color: C.success }}>{m.answer ? '  ' : ''}✓ {m.expected}</span>}</div>
              <div style={{ marginTop: 4 }}><RuleCardButton ctx={ctx} compact source={{ text: m.feedback, card: m.front, asked: m.question, answered: m.answer, expected: m.expected }} /></div>
            </div>
          ))}
          <div style={{ fontSize: 12, color: C.inkFaint, marginTop: 8 }}>{t('gym_howClear')}</div>
        </Card>
      )}
      {slipList.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <Card title={t('gym_slips')}>
            {slipList.map((s, i) => (
              <div key={i} style={{ padding: '8px 0', borderTop: `1px solid ${C.border}`, fontSize: 13.5 }}>
                <div style={{ color: C.ink }}>{s.text}{s.n > 1 && <span style={{ marginLeft: 8, color: C.danger, fontSize: 12 }}>×{s.n}</span>}</div>
                {s.front && <div style={{ color: C.inkFaint, fontSize: 12 }}>{s.front}</div>}
                <div style={{ marginTop: 4 }}><RuleCardButton ctx={ctx} compact source={{ text: s.text, card: s.front }} /></div>
              </div>
            ))}
            <div style={{ fontSize: 12, color: C.inkFaint, marginTop: 8 }}>{t('gym_slipsHint')}</div>
          </Card>
        </div>
      )}
    </div>
  )
}

// Saves a workout's answers ONCE, under the mode and context it STARTED in: progress toward retiring each mistake, the
// practice log, and (finished only) PRACTICE_DONE. Only a FINISHED workout pays and counts for the quest and the level
// (a quit after one skip paid both).
function settleRun(run, results, done = false) {
  if (!run || run.settled || !Array.isArray(results) || !results.length) return
  run.settled = true
  const { ctx, modeId, workout } = run
  updateMistakes(modeId, (l) => applyPractice(l, results.map((r) => ({ target: r.question?.target, correct: r.correct }))))
  // Tell the other activities what was drilled, so they pick other cards and topics for a while.
  const front = (q) => (workout?.targets || []).find((m) => m.id === q?.target)?.front
  const fronts = [...new Set(results.map((r) => front(r.question)).filter(Boolean))]
  recordPractice(ctx, GYM_SRC, [...fronts.map((f) => ({ kind: 'card', label: f })), ...(workout?.diagnosis ? [{ kind: 'topic', label: workout.diagnosis }] : [])])
  if (done) ctx.emit(EVENTS.PRACTICE_DONE, { source: GYM_FEATURE_ID, mode: modeId, total: results.length, correct: results.filter((r) => r.correct).length })
}

export function GymBadge() {
  const ctx = useFeatureCtx()
  const { list } = useMistakes(ctx?.subject?.modeId)
  const n = list?.items?.length || 0
  if (!n) return null
  return <span style={{ background: C.danger, color: C.white, borderRadius: RADIUS.pill, padding: '1px 8px', fontSize: 12, fontWeight: 800, fontFamily: FONT.body }}>{n}</span>
}
