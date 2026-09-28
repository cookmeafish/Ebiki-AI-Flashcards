// The Practice hub: a tile per activity other features contribute (practiceActivities slot). Opening a tile
// shows its Screen here; nothing in the hub knows what the activities are.
import { useState } from 'react'
import { C, FONT, RADIUS } from '../../config/tokens'
import { poseFile, shrimpUrl } from '../../config/shrimp'
import { useFeatureCtx, useIntent, SLOT } from '../registry'
import { depthBorder } from '../ui'

const MAX_W = 920
const TILE_MIN = 260
const HEADER_POSE = 'work'
export const PRACTICE_INTENT = 'practice' // = the nav id

export default function PracticeScreen() {
  const ctx = useFeatureCtx()
  const [open, setOpen] = useState(null)
  const [params, setParams] = useState(null)
  // Another surface asked for an activity (e.g. Chat's "+" menu → Roleplay): { activity: '<feature>:<id>', params }
  useIntent(PRACTICE_INTENT, (p) => { if (p.activity) { setParams(p.params || null); setOpen(p.activity) } })
  if (!ctx) return null
  const { t, registry, subject } = ctx
  const acts = registry.slot(SLOT.PRACTICE)
  const current = acts.find((a) => `${a.feature}:${a.id}` === open)
  if (current?.Screen) {
    return (
      <div style={{ maxWidth: MAX_W, margin: '0 auto', height: '100%' }}>
        <current.Screen key={open} params={params} onExit={() => { setOpen(null); setParams(null) }} />
      </div>
    )
  }
  return (
    <div style={{ maxWidth: MAX_W, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <img src={shrimpUrl(poseFile(HEADER_POSE))} alt="" width={84} />
        <div>
          <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 28, color: C.ink }}>{t('practice_title')}</div>
          <div style={{ fontSize: 14, color: C.inkDim, fontWeight: 600 }}>{t('practice_sub', { mode: subject?.name || '' })}</div>
        </div>
      </div>
      {!acts.length && <div style={{ color: C.inkDim }}>{t('practice_empty')}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${TILE_MIN}px, 1fr))`, gap: 14 }}>
        {acts.map((a) => (
          <button key={`${a.feature}:${a.id}`} onClick={() => { setParams(null); setOpen(`${a.feature}:${a.id}`) }} className="btn-press" style={{
            textAlign: 'left', padding: 18, borderRadius: RADIUS.lg, background: C.surface, cursor: 'pointer',
            ...depthBorder(C.border, { bottomColor: C.border }), display: 'flex', gap: 14, alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: 34, lineHeight: 1 }}>{a.icon}</span>
            <span style={{ flex: 1 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 18, color: C.ink }}>{t(a.titleKey)}</span>
                {a.Badge && <a.Badge />}
              </span>
              <span style={{ display: 'block', fontSize: 13, color: C.inkDim, marginTop: 4, lineHeight: 1.45 }}>{t(a.descKey)}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
