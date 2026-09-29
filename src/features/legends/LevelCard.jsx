// Rail card (Study home, Stats, the map): the mode's level (a number and a band) with a way into the map.
// Without a level yet it invites the learner to find it.
import { C, FONT } from '../../config/tokens'
import { useFeatureCtx } from '../registry'
import { Card } from '../ui'
import { useLearner } from '../kit/learnerStore'
import { LevelChip } from './MapView'
import { LEGENDS_INTENT } from './LegendsScreen'

export default function LevelCard() {
  const ctx = useFeatureCtx()
  const { model, loaded } = useLearner(ctx?.subject?.modeId)
  if (!ctx || !loaded) return null
  const { t, subject } = ctx
  return (
    <Card onClick={() => ctx.open(LEGENDS_INTENT, {})}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 24 }}>🗺️</span>
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 16, color: C.ink }}>{t('lg_levelTitle')}</div>
      </div>
      {model
        ? <LevelChip t={t} learner={model} isLanguage={subject.isLanguage} />
        : <div style={{ fontSize: 13, color: C.inkDim, lineHeight: 1.45 }}>{t('lg_levelNone', { subject: subject.name })}</div>}
      <div style={{ marginTop: 10, fontSize: 12.5, fontWeight: 800, color: C.info }}>{model ? t('lg_levelOpen') : t('lg_levelFind')} →</div>
    </Card>
  )
}
