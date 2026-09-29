// Settings > General: your name (friends see it), daily goal, rest days, switch player.
import { useEffect, useState } from 'react'
import { C, RADIUS } from '../../config/tokens'
import { useFeatureCtx } from '../registry'
import { useGame, updateProfile, initGame } from './store'
import { GOALS, DEFAULT_GOAL, REST_DATES_MAX, dateKey } from './engine'
import { weekdayLetters } from './Rail'
import { apiFetch } from '../../platform'

const NAME_MAX = 40
const NAME_SAVE_MS = 600

// Rest days: weekdays that never break the streak (every week), plus single dates (a trip, a busy day). A rest day
// keeps the streak without spending a freeze; playing on one still counts.
function RestDays({ t, lang, player }) {
  const days = Array.isArray(player.restDays) ? player.restDays : []
  const dates = (Array.isArray(player.restDates) ? player.restDates : []).filter((d) => d >= dateKey()).sort()
  const [pick, setPick] = useState('')
  const letters = weekdayLetters(lang)
  const toggle = (i) => updateProfile({ restDays: days.includes(i) ? days.filter((d) => d !== i) : [...days, i].sort() })
  const addDate = () => { if (pick && !dates.includes(pick)) updateProfile({ restDates: [...dates, pick].sort().slice(-REST_DATES_MAX) }); setPick('') }
  const btn = (on) => ({ width: 32, height: 32, borderRadius: '50%', fontSize: 12, fontWeight: 800, cursor: 'pointer', border: `1px solid ${on ? C.info : C.border}`, background: on ? `color-mix(in srgb, ${C.info} 18%, ${C.surface})` : C.surface, color: on ? C.info : C.ink })
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 12, color: C.inkDim, marginBottom: 4 }}>🌙 {t('game_restDays')}</div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {letters.map((l, i) => <button key={i} type="button" aria-pressed={days.includes(i)} onClick={() => toggle(i)} style={btn(days.includes(i))}>{l}</button>)}
      </div>
      <div style={{ fontSize: 12, color: C.inkDim, margin: '10px 0 4px' }}>{t('game_restDates')}</div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <input type="date" value={pick} min={dateKey()} onChange={(e) => setPick(e.target.value)} style={{ padding: '5px 8px', borderRadius: RADIUS.sm, border: `1px solid ${C.border}`, background: C.surfaceAlt, color: C.ink, fontSize: 12 }} />
        <button type="button" onClick={addDate} disabled={!pick} style={{ padding: '5px 10px', borderRadius: RADIUS.sm, border: `1px solid ${C.info}`, background: 'transparent', color: C.info, fontSize: 12, fontWeight: 800, cursor: pick ? 'pointer' : 'default', opacity: pick ? 1 : 0.5 }}>＋ {t('game_restAdd')}</button>
        {dates.map((d) => (
          <span key={d} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: RADIUS.pill, border: `1px solid ${C.border}`, fontSize: 12 }}>
            {d}<button type="button" aria-label={t('game_restRemove')} onClick={() => updateProfile({ restDates: dates.filter((x) => x !== d) })} style={{ border: 'none', background: 'transparent', color: C.inkDim, cursor: 'pointer', fontSize: 13 }}>×</button>
          </span>
        ))}
      </div>
      <div style={{ fontSize: 11.5, color: C.inkFaint, marginTop: 4 }}>{t('game_restHow')}</div>
    </div>
  )
}

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
      <RestDays t={t} lang={ctx.lang} player={g.player} />
      <button onClick={switchPlayer} style={{ marginTop: 10, padding: '5px 10px', borderRadius: RADIUS.sm, border: `1px solid ${C.border}`, background: C.surface, color: C.inkDim, fontSize: 12, cursor: 'pointer' }}>
        {t('game_switchPlayer')}
      </button>
    </div>
  )
}
