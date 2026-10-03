// Listen & Speak: a short workout you hear and answer out loud, built from your own cards. Never touches the
// review schedule. Audio and transcription use the cheapest engines (src/speech; Settings > Speech).
import { useState } from 'react'
import { C } from '../../config/tokens'
import { poseFile } from '../../config/shrimp'
import { speechEngines } from '../../speech'
import { useFeatureCtx } from '../registry'
import { EVENTS } from '../events'
import { ChunkyButton, EbiSays } from '../ui'
import { QuizRunner, sanitizeQuestions, pickCardItems, recordPractice, missesFromResults } from '../kit'
import { learnerLevelLine } from '../kit/learnerStore'
import { buildDrillPrompt, DRILL_ROLE, DRILL_MAX_TOKENS, DRILL_SIZE } from './prompt'

export const LISTEN_FEATURE_ID = 'listen-speak'
const MIN_QUESTIONS = 3
const KNOWLEDGE_CAP = 3000
const SLIPS = 8

export default function ListenScreen({ onExit }) {
  const ctx = useFeatureCtx()
  const [phase, setPhase] = useState('intro') // intro | loading | run
  const [questions, setQuestions] = useState([])
  const [error, setError] = useState('')
  if (!ctx) return null
  const { t, ai, subject } = ctx
  const engines = speechEngines(ctx)
  const voiceLang = subject.isLanguage ? subject.learnLangIso : ctx.lang

  const start = async () => {
    setError(''); setPhase('loading')
    try {
      const items = await pickCardItems(ctx, DRILL_SIZE)
      const { system, user } = buildDrillPrompt(subject, items, { knowledge: subject.knowledge(KNOWLEDGE_CAP), slips: subject.isLanguage ? subject.grammarSlips(SLIPS) : '', level: await learnerLevelLine(ctx, { context: true }) })
      const j = ai.json(await ai.call(system, user, { role: DRILL_ROLE, maxTokens: DRILL_MAX_TOKENS }))
      const qs = sanitizeQuestions((Array.isArray(j) ? j : Array.isArray(j?.questions) ? j.questions : []).filter((q) => q && typeof q === 'object').map((q) => ({
        ...q, question: ai.clean(q.question), explanation: ai.clean(q.explanation), say: ai.clean(q.say || ''),
        speak: q.speak === true && !!engines.stt, // no way to listen → typed instead
        open: q.open === true && q.speak === true && !q.say, // only "explain out loud" is open; a dictation has one answer
      })), { audioLang: voiceLang, speakLang: subject.isLanguage ? subject.learnLangIso : '' })
      if (qs.length < MIN_QUESTIONS) throw new Error(t('ls_badWorkout'))
      setQuestions(qs); setPhase('run')
      recordPractice(ctx, LISTEN_FEATURE_ID, items.map((it) => ({ kind: 'card', label: it.front })))
    } catch (e) { setError(String(e.message || e)); setPhase('intro') }
  }

  if (phase === 'run') {
    return (
      <QuizRunner questions={questions} t={t} ai={ai} subject={subject} ctx={ctx} confirm={ctx.confirm} title={t('ls_title')}
        onAnswer={(q, correct, a, info) => { if (!info?.skipped) ctx.emit(EVENTS.PRACTICE_ANSWERED, { source: LISTEN_FEATURE_ID, correct, mode: subject.modeId }) }} // a Skip earns no answer XP
        onFinish={(res) => {
          ctx.emit(EVENTS.PRACTICE_DONE, { source: LISTEN_FEATURE_ID, mode: subject.modeId, total: res.length, correct: res.filter((r) => r.correct).length })
          const misses = missesFromResults(res)
          if (misses.length) ctx.emit(EVENTS.PRACTICE_MISSED, { source: LISTEN_FEATURE_ID, mode: subject.modeId, misses })
        }}
        onExit={() => { setPhase('intro'); setQuestions([]) }} />
    )
  }
  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <button onClick={onExit} style={{ border: 'none', background: 'transparent', color: C.inkDim, fontWeight: 800, cursor: 'pointer', marginBottom: 12, fontSize: 13 }}>← {t('ls_back')}</button>
      <EbiSays pose={poseFile('singer')}>{subject.isLanguage ? t('ls_introLang', { lang: subject.learnLang }) : t('ls_introGeneral', { subject: subject.name })}</EbiSays>
      <div style={{ fontSize: 13, color: C.inkDim, margin: '14px 0', lineHeight: 1.5 }}>{t('ls_how')}</div>
      {!ai.hasKey && <div style={{ color: C.warning, fontSize: 13, marginBottom: 10 }}>{t('ls_needKey')}</div>}
      {!engines.stt && <div style={{ color: C.warning, fontSize: 13, marginBottom: 10 }}>{t('ls_noStt')}</div>}
      {error && <div style={{ color: C.danger, fontSize: 13, marginBottom: 10 }}>{error}</div>}
      <ChunkyButton onClick={start} disabled={phase === 'loading' || !ai.hasKey} color={C.success}>
        🎧 {phase === 'loading' ? t('ls_loading') : t('ls_start')}
      </ChunkyButton>
    </div>
  )
}
