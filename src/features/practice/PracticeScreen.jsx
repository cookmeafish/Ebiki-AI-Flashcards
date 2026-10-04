// The Practice hub: a tile per activity other features contribute (practiceActivities slot). Opening a tile
// shows its Screen here; nothing in the hub knows what the activities are.
import { useEffect, useRef, useState } from 'react'
import { C, FONT, RADIUS, SHADOW } from '../../config/tokens'
import { poseFile, shrimpUrl } from '../../config/shrimp'
import { useFeatureCtx, useIntent, useNavEntry, activityIdle, SLOT } from '../registry'
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
  // The hero (practiceHero slot): one big card on top, the lowest order wins; its activity's tile leaves the grid.
  const hero = ctx ? ctx.registry.slot(SLOT.PRACTICE_HERO).find((h) => acts.some((a) => a.feature === h.feature && a.id === h.activity)) : null
  const heroKey = hero ? `${hero.feature}:${hero.activity}` : ''
  const tiles = acts.filter((a) => `${a.feature}:${a.id}` !== heroKey)
  // Its feature was switched off while it was open: forget it (switching it back on reopened it, unasked).
  useEffect(() => { if (open && !current) { setOpen(null); setParams(null) } }, [open, current])
  // Back / Forward (src/nav): opening an activity is an entry; Back asks before leaving it (it may be mid-call or
  // mid-workout) and returns to the hub. A closed activity is not reopened by Forward (its params are gone).
  useNavEntry('practice.open', open, () => { setOpen(null); setParams(null) }, {
    enabled: !!ctx, rest: null,
    // Asked only while the activity has something running (useActivityBusy); one that does not report is always asked.
    guard: async (to) => (to ? 'skip' : activityIdle() || !!(await ctx.confirm(ctx.t('nav_leaveActivity')))),
  })
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
      {hero && <hero.Component key={`${heroKey}:${subject?.modeId ?? ''}`} onOpen={(p) => { setParams(p || null); setOpen(heroKey) }} />}
      {!acts.length && <div style={{ color: C.inkDim }}>{t('practice_empty')}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${TILE_MIN}px, 1fr))`, gap: 14 }}>
        {tiles.map((a) => (
          <button key={`${a.feature}:${a.id}`} onClick={() => { setParams(null); setOpen(`${a.feature}:${a.id}`) }} className="btn-press ui-card ui-lift" style={{
            textAlign: 'left', padding: 18, borderRadius: RADIUS.lg, background: C.surface, cursor: 'pointer',
            display: 'flex', gap: 14, alignItems: 'flex-start', // surface, hairline and shadow: .ui-card
          }}>
            <span aria-hidden="true" style={{ fontSize: 28, lineHeight: 1, width: 52, height: 52, flexShrink: 0, display: 'grid', placeItems: 'center', borderRadius: RADIUS.md, background: C.surfaceAlt, boxShadow: SHADOW.hi }}>{a.icon}</span>
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
