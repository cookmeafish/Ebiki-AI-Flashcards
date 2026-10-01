// The Practice hub: a tile per activity other features contribute (practiceActivities slot). Opening a tile
// shows its Screen here; nothing in the hub knows what the activities are.
import { useEffect, useRef, useState } from 'react'
import { C, FONT, RADIUS } from '../../config/tokens'
import { poseFile, shrimpUrl } from '../../config/shrimp'
import { useFeatureCtx, useIntent, SLOT } from '../registry'
import { depthBorder } from '../ui'
import { useHelpEntry } from '../kit/useHelp'

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
  // A mode switch closes the open activity: every activity reads the LIVE subject, so a workout, scene or call
  // started in one mode filed its results, level change and new cards under the other.
  const modeId = ctx?.subject?.modeId
  const modeSeen = useRef(modeId)
  useEffect(() => {
    if (modeSeen.current === modeId) return
    modeSeen.current = modeId
    setOpen(null); setParams(null)
  }, [modeId])
  const acts = ctx ? ctx.registry.slot(SLOT.PRACTICE) : []
  const current = acts.find((a) => `${a.feature}:${a.id}` === open)
  // Its feature was switched off while it was open: forget it (switching it back on reopened it, unasked).
  useEffect(() => { if (open && !current) { setOpen(null); setParams(null) } }, [open, current])
  // Ebi's Help: which activity is open (each activity reports its own details), or the hub's tiles.
  useHelpEntry(ctx, 'practice', !ctx ? '' : current
    ? `Practice hub: the activity "${ctx.t(current.titleKey)}" is open.`
    : `Practice hub (no activity open). Activities offered: ${acts.map((a) => `${ctx.t(a.titleKey)} (${ctx.t(a.descKey)})`).join('; ')}`)
  if (!ctx) return null
  const { t, subject } = ctx
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
