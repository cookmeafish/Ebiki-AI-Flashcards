// Listen & Speak: a short workout you hear and answer out loud, built from your own cards. Never touches the
// review schedule. Audio and transcription use the cheapest engines (src/speech; Settings > Speech).
import { useEffect, useRef, useState } from 'react'
import { C } from '../../config/tokens'
import { poseFile } from '../../config/shrimp'
import { speechEngines } from '../../speech'
import { useFeatureCtx, useActivityBusy } from '../registry'
import { EVENTS } from '../events'
import { ChunkyButton, EbiSays } from '../ui'
import { QuizRunner, sanitizeQuestions, pickCardItems, recordPractice } from '../kit'
import { learnerLevelLine } from '../kit/learnerStore'
import { useHelpEntry } from '../kit/useHelp'
import { settlePracticeRun } from '../kit/practiceRun'
import { buildDrillPrompt, DRILL_ROLE, DRILL_JOB, DRILL_MAX_TOKENS, DRILL_SIZE } from './prompt'

import { LISTEN_FEATURE_ID } from './featureId'
import { aiErrorText } from '../kit/aiError'
export { LISTEN_FEATURE_ID }
const MIN_QUESTIONS = 3
const KNOWLEDGE_CAP = 3000
const SLIPS = 8
const txt = (v) => (typeof v === 'string' || typeof v === 'number' ? String(v) : '')

export default function ListenScreen({ onExit }) {
  const ctx = useFeatureCtx()
  const [phase, setPhase] = useState('intro') // intro | loading | run
  const [questions, setQuestions] = useState([])
  const [error, setError] = useState('')
  const [quizDone, setQuizDone] = useState(false) // QuizRunner shows its results: nothing left to lose
  // The running workout, settled ONCE (finished, quit midway or closed under it), under the mode it started in.
  const runRef = useRef(null)
  // Set on mount too (StrictMode mounts twice): a workout landing after the learner went back is dropped, not logged.
  const aliveRef = useRef(false)
  useActivityBusy(phase !== 'intro' && !(phase === 'run' && quizDone)) // a workout being built or answered would be lost
  useEffect(() => { aliveRef.current = true; return () => { aliveRef.current = false; settleRun(runRef.current, runRef.current?.answers) } }, [])
  // What Ebi's Help knows (like the other activities): where the learner is, and why answers are typed when no
  // speech-to-text engine is set up. A running drill's question is reported by the quiz itself.
  const noStt = !!ctx && !speechEngines(ctx).stt
  useHelpEntry(ctx, LISTEN_FEATURE_ID, !ctx ? '' : [
    `Activity open: Listen & Speak (${phase === 'run' ? 'a drill is running' : phase === 'loading' ? 'a drill is being written' : 'the intro'}).`,
    noStt ? 'No speech-to-text engine is available, so answers meant to be spoken are typed instead (Settings > General > Voice and speech).' : '',
  ].filter(Boolean).join(' '))
  if (!ctx) return null
  const { t, ai, subject } = ctx
  const engines = speechEngines(ctx)
  const voiceLang = subject.isLanguage ? subject.learnLangIso : ctx.lang

  const start = async () => {
    setError(''); setPhase('loading')
    try {
      const items = await pickCardItems(ctx, DRILL_SIZE)
      const { system, user } = buildDrillPrompt(subject, items, { knowledge: subject.knowledge(KNOWLEDGE_CAP), slips: subject.isLanguage ? subject.grammarSlips(SLIPS) : '', level: await learnerLevelLine(ctx, { context: true }) })
      const j = ai.json(await ai.call(system, user, { role: DRILL_ROLE, job: DRILL_JOB, maxTokens: DRILL_MAX_TOKENS }))
      const qs = sanitizeQuestions((Array.isArray(j) ? j : Array.isArray(j?.questions) ? j.questions : []).filter((q) => q && typeof q === 'object').map((q) => ({
        // Text fields only as text: a list or object there was read aloud and shown as "[object Object]".
        ...q, question: ai.clean(txt(q.question)), explanation: ai.clean(txt(q.explanation)), say: ai.clean(txt(q.say)),
        speak: q.speak === true && !!engines.stt, // no way to listen → typed instead
        open: q.open === true && q.speak === true && !q.say, // only "explain out loud" is open; a dictation has one answer
      // A general subject is explained out loud in the app language: the recognizer must listen for it, not the browser's.
      })), { audioLang: voiceLang, speakLang: voiceLang, clean: ai.clean })
      if (qs.length < MIN_QUESTIONS) throw new Error(t('ls_badWorkout'))
      if (!aliveRef.current) return
      // The practice log gets the cards the learner actually answered about, when the run settles.
      runRef.current = { source: LISTEN_FEATURE_ID, modeId: subject.modeId, ctx, items, answers: [], settled: false }
      setQuestions(qs); setQuizDone(false); setPhase('run')
    } catch (e) { if (aliveRef.current) { setError(aiErrorText(t, e)); setPhase('intro') } }
  }

  if (phase === 'run') {
    return (
      <QuizRunner questions={questions} t={t} ai={ai} subject={subject} ctx={ctx} confirm={ctx.confirm} title={t('ls_title')}
        onAnswer={(q, correct, a, info) => {
          if (runRef.current && !q?._retry) runRef.current.answers.push({ question: q, correct, answer: a })
          if (!info?.skipped) ctx.emit(EVENTS.PRACTICE_ANSWERED, { source: LISTEN_FEATURE_ID, correct, mode: subject.modeId }) // a Skip earns no answer XP
        }}
        onFinish={(res) => { settleRun(runRef.current, res, true); setQuizDone(true) }}
        onExit={(partial) => { settleRun(runRef.current, Array.isArray(partial) ? partial : runRef.current?.answers); runRef.current = null; setQuizDone(false); setPhase('intro'); setQuestions([]) }} />
    )
  }
  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <button onClick={onExit} style={{ border: 'none', background: 'transparent', color: C.inkDim, fontWeight: 800, cursor: 'pointer', marginBottom: 12, fontSize: 13 }}>← {t('ls_back')}</button>
      <EbiSays pose={poseFile('singer')}>{subject.isLanguage ? t('ls_introLang', { lang: subject.learnLang }) : t('ls_introGeneral', { subject: subject.name })}</EbiSays>
      <div style={{ fontSize: 13, color: C.inkDim, margin: '14px 0', lineHeight: 1.5 }}>{t('ls_how')}</div>
      {!ai.hasKey && <div style={{ color: C.warning, fontSize: 13, marginBottom: 10 }}>{t('ls_needKey')}</div>}
      {!engines.stt && <div style={{ color: C.warning, fontSize: 13, marginBottom: 10 }}>{t('ls_noStt')}</div>}
      {error && <div role="alert" style={{ color: C.danger, fontSize: 13, marginBottom: 10 }}>{error}</div>}
      <ChunkyButton onClick={start} disabled={phase === 'loading' || !ai.hasKey} color={C.success}>
        🎧 {phase === 'loading' ? t('ls_loading') : t('ls_start')}
      </ChunkyButton>
    </div>
  )
}

// A workout settled once: misses to the Mistake Gym always, PRACTICE_DONE only when finished (kit/practiceRun.js),
// and the cards it practiced to the practice log (all of them when finished, else those the answers were about).
function settleRun(run, results, done = false) {
  const r = settlePracticeRun(run, results, { done })
  if (!r) return
  for (const [event, payload] of r.events) run.ctx.emit(event, payload)
  const asked = new Set(r.targets.map((x) => x.toLowerCase()))
  const items = (run.items || []).filter((it) => done || asked.has(String(it.front || '').trim().toLowerCase()))
  if (items.length) recordPractice({ ...run.ctx, subject: { ...run.ctx.subject, modeId: run.modeId } }, LISTEN_FEATURE_ID, items.map((it) => ({ kind: 'card', label: it.front })))
}
