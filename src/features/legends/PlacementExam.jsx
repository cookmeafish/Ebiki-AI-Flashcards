// The placement exam: batches of questions through the shared QuizRunner, each batch deciding the next tier
// (./placement.js). Sentence answers are graded by the AI judge (QuizRunner does that for open questions).
import { useEffect, useRef, useState } from 'react'
import { C, FONT } from '../../config/tokens'
import { poseFile } from '../../config/shrimp'
import { ChunkyButton, EbiSays } from '../ui'
import { QuizRunner } from '../kit'
import { newPlacement, afterBatch, placementLevel, placementConfidence, BATCH, MAX_QUESTIONS } from './placement'
import { makePlacementBatch } from './generate'

const TOPICS_KEPT = 5

// Topics answered mostly right / mostly wrong, from the questions' "target".
function topicsOf(results) {
  const by = new Map()
  for (const r of results) {
    const k = String(r.question?.target || '').trim()
    if (!k) continue
    const s = by.get(k) || { right: 0, n: 0 }
    s.n++; if (r.correct) s.right++
    by.set(k, s)
  }
  const strengths = []; const gaps = []
  for (const [k, s] of by) (s.right / s.n >= 0.5 ? strengths : gaps).push(k)
  return { strengths: strengths.slice(0, TOPICS_KEPT), gaps: gaps.slice(0, TOPICS_KEPT) }
}

export default function Placement({ ctx, selfRating, onDone, onQuit }) {
  const { t, ai, subject } = ctx
  const [state, setState] = useState(() => newPlacement(selfRating))
  const [questions, setQuestions] = useState(null)
  const [error, setError] = useState('')
  const [batchNo, setBatchNo] = useState(0)
  const asked = useRef([])     // question texts so far (never repeated)
  const results = useRef([])   // every answer, with its question (for topics)
  const loadSeq = useRef(0)
  const alive = useRef(false)  // set on mount too: StrictMode mounts twice
  const ran = useRef(false)    // the first batch is asked ONCE (StrictMode paid for two and threw one away)

  const load = async (s) => {
    const seq = ++loadSeq.current
    setQuestions(null); setError('')
    try {
      const n = Math.min(BATCH, MAX_QUESTIONS - s.answered.length)
      const qs = await makePlacementBatch(ctx, s.tier, n, asked.current)
      if (seq !== loadSeq.current || !alive.current) return
      asked.current = [...asked.current, ...qs.map((q) => q.prompt)]
      setQuestions(qs)
    } catch (e) { if (seq === loadSeq.current && alive.current) setError(String(e.message || e)) }
  }
  useEffect(() => {
    alive.current = true
    if (!ran.current) { ran.current = true; load(state) }
    return () => { alive.current = false }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const finishBatch = (res) => {
    results.current = [...results.current, ...res]
    const next = afterBatch(state, res)
    setState(next)
    if (next.done) {
      onDone({ answered: next.answered, level: placementLevel(next.answered), confidence: placementConfidence(next.answered), ...topicsOf(results.current) })
      return
    }
    setBatchNo((n) => n + 1)
    load(next)
  }

  if (error) {
    return (
      <div style={{ maxWidth: 560, margin: '40px auto', display: 'grid', gap: 14 }}>
        <EbiSays pose={poseFile('confused')}>{error}</EbiSays>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <ChunkyButton variant="ghost" color={C.inkDim} onClick={onQuit}>{t('lg_back')}</ChunkyButton>
          <ChunkyButton onClick={() => load(state)} color={C.success}>{t('lg_retry')}</ChunkyButton>
        </div>
      </div>
    )
  }
  if (!questions) {
    return (
      <div style={{ maxWidth: 560, margin: '60px auto', textAlign: 'center', display: 'grid', gap: 10, justifyItems: 'center' }}>
        <EbiSays pose={poseFile('book')}>{batchNo === 0 ? t('lg_placementIntro') : t('lg_placementNext')}</EbiSays>
        <div style={{ fontFamily: FONT.display, fontWeight: 800, color: C.inkDim }}>{t('lg_preparing')}</div>
      </div>
    )
  }
  return (
    <QuizRunner key={batchNo} questions={questions} t={t} ai={ai} subject={subject} ctx={ctx} confirm={ctx.confirm}
      title={t('lg_placementTitle')}
      onFinish={finishBatch}
      onExit={onQuit} />
  )
}
