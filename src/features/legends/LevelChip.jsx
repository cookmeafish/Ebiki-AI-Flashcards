// The learner's level as a number and a band bar (rail LevelCard, map header). Its own file so the rail card does not
// pull the map (and its art) into the startup bundle.
import { C, FONT } from '../../config/tokens'
import { bandFor, bandProgress } from '../kit/learner'
import { ProgressBar } from '../ui'

export function LevelChip({ t, learner, isLanguage, compact = false }) {
  if (!learner) return null
  const band = bandFor(learner.level, isLanguage)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: compact ? 0 : 180 }}>
      <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: compact ? 18 : 22, color: C.purple, lineHeight: 1 }}>{Math.round(learner.level)}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t(`lg_band_${band.key}`)}</div>
        <ProgressBar value={bandProgress(learner.level, isLanguage)} max={1} color={C.purple} height={8} label={t(`lg_band_${band.key}`)} />
      </div>
    </div>
  )
}
