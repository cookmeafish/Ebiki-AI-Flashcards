// Settings > General: your name (friends see it), daily goal, switch player.
import { useEffect, useState } from 'react'
import { C, RADIUS } from '../../config/tokens'
import { useFeatureCtx } from '../registry'
import { useGame, updateProfile, initGame } from './store'
import { GOALS, DEFAULT_GOAL } from './engine'
import { apiFetch } from '../../platform'

const NAME_MAX = 40
const NAME_SAVE_MS = 600

export default function GameSettingsCard({ card, fieldLabel, hint }) {
  const ctx = useFeatureCtx()
  const g = useGame()
  const [name, setName] = useState(g.player?.name || '')
  useEffect(() => { setName(g.player?.name || '') }, [g.player?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!g.player || name === (g.player.name || '')) return
    const id = setTimeout(() => updateProfile({ name: name.trim().slice(0, NAME_MAX) }), NAME_SAVE_MS)
    return () => clearTimeout(id)
  }, [name]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!ctx || !g.player) return null
  const { t } = ctx
  const goal = g.player.goalXp || DEFAULT_GOAL
  // Switching = forget this computer's choice and ask again.
  const switchPlayer = async () => {
    await apiFetch('/api/player-local', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ playerId: '' }) })
    initGame()
  }
  return (
    <div style={card}>
      {fieldLabel(t('game_settingsTitle'))}
      <div style={{ fontSize: 12, color: C.inkDim, marginBottom: 4 }}>{t('game_settingsName')}</div>
      <input value={name} onChange={(e) => setName(e.target.value)} maxLength={NAME_MAX} placeholder={t('game_namePlaceholder')}
        style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px', borderRadius: RADIUS.sm, border: `1px solid ${C.border}`, background: C.surfaceAlt, color: C.ink, fontSize: 13 }} />
      <div style={{ fontSize: 12, color: C.inkDim, margin: '12px 0 4px' }}>{t('game_goalPick')}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {GOALS.map((o) => (
          <button key={o.key} onClick={() => updateProfile({ goalXp: o.xp })} className={goal === o.xp ? 'ui-tab-current' : undefined} style={{
            padding: '6px 10px', borderRadius: RADIUS.sm, fontSize: 12, fontWeight: 700, cursor: goal === o.xp ? 'default' : 'pointer',
            border: `1px solid ${goal === o.xp ? C.brand : C.border}`, background: goal === o.xp ? C.brandTint : C.surface, color: goal === o.xp ? C.brand : C.ink,
          }}>{t(`game_goal_${o.key}`)} · {t('game_goalMinutes', { m: o.minutes })}</button>
        ))}
      </div>
      <div style={hint}>{t('game_freezeHow')}</div>
      <button onClick={switchPlayer} style={{ marginTop: 10, padding: '5px 10px', borderRadius: RADIUS.sm, border: `1px solid ${C.border}`, background: C.surface, color: C.inkDim, fontSize: 12, cursor: 'pointer' }}>
        {t('game_switchPlayer')}
      </button>
    </div>
  )
}
