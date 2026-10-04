// Header chip: streak flame + today's XP toward the goal, with a "+XP" pop when points land.
import { useEffect, useState } from 'react'
import { C, FONT, RADIUS } from '../../config/tokens'
import { useFeatureCtx } from '../registry'
import { tCount } from '../ui'
import { useGame, openGamePanel, todayTotals } from './store'
import { computeStreak, DEFAULT_GOAL } from './engine'

const POP_MS = 1400 // how long "+XP" floats

export function StreakChip() {
  const ctx = useFeatureCtx()
  const g = useGame()
  const [pop, setPop] = useState(null)
  useEffect(() => {
    if (!g.lastXp) return
    setPop(g.lastXp)
    const id = setTimeout(() => setPop(null), POP_MS)
    return () => clearTimeout(id)
  }, [g.lastXp])
  if (!ctx || !g.player) return null
  const { t } = ctx
  const s = computeStreak(g.player)
  const xp = todayTotals(g.player).xp
  const goal = g.player.goalXp || DEFAULT_GOAL
  const lit = s.todayDone
  return (
    <button onClick={() => openGamePanel('streak')} className="ui-btn tip tip-b"
      data-tip={`${tCount(t, 'game_streakChip', s.streak)} · ${t('game_goalProgress', { xp, goal })}`}
      style={{
        position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: '5px 12px', marginLeft: 8,
        border: `1px solid ${C.border}`, borderRadius: RADIUS.pill, background: C.surface, cursor: 'pointer',
        fontFamily: FONT.display, fontWeight: 800, fontSize: 15, lineHeight: 1,
      }}>
      <span style={{ color: lit ? C.warning : C.inkFaint, filter: lit ? 'none' : 'grayscale(1)' }}>🔥 {s.streak}</span>
      <span style={{ color: xp >= goal ? C.success : C.inkDim }}>⚡ {xp}/{goal}</span>
      {pop && (
        <span key={pop.at} style={{
          position: 'absolute', right: 6, top: -4, color: C.success, fontSize: 13, fontWeight: 800, pointerEvents: 'none',
          animation: `ebiki-xp-pop ${POP_MS}ms ease-out forwards`,
        }}>{t('game_xpPop', { xp: pop.xp })}</span>
      )}
      <style>{'@keyframes ebiki-xp-pop { 0% { opacity: 0; transform: translateY(4px) } 15% { opacity: 1 } 100% { opacity: 0; transform: translateY(-22px) } }'}</style>
    </button>
  )
}
