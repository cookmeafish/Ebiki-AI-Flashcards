// Seeds a level for the ACTIVE mode once Anki answers: a learner who only reviews in Anki (no Ebiki study or practice
// yet) never triggered the seed, so Chat, Study questions and every activity ran without a level.
import { useEffect } from 'react'
import { useFeatureCtx } from '../registry'
import { seedActiveMode } from './index'

export default function LearnerMount() {
  const ctx = useFeatureCtx()
  const modeId = ctx?.subject?.modeId
  const ready = !!(ctx?.onboarded && ctx?.ankiConnected === true && ctx?.ai?.hasKey)
  useEffect(() => {
    if (!ready || modeId == null) return
    seedActiveMode(ctx)
  }, [ready, modeId]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}
