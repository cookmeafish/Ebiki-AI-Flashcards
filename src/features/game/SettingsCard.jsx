// Settings > General: your name (friends see it), daily goal, rest days, switch player.
import { useEffect, useRef, useState } from 'react'
import { C, RADIUS } from '../../config/tokens'
import { useFeatureCtx } from '../registry'
import { useGame, updateProfile, initGame, saveGameNow } from './store'
import { GOALS, DEFAULT_GOAL, dateKey, restDaysPatch, addRestDate, MAX_FREEZES } from './engine'
import { weekdayLetters } from './Rail'
import { apiFetch } from '../../platform'

const NAME_MAX = 40
const NAME_SAVE_MS = 600

// A planned rest date in the app language ("Oct 12, 2026"), not the stored key ("2026-10-12"). Noon: no time zone or
// DST shift moves it to the day before.
function restDateLabel(key, lang) {
  const [y, m, d] = String(key).split('-').map(Number)
  if (!y || !m || !d) return key
  try { return new Intl.DateTimeFormat(lang || 'en', { dateStyle: 'medium' }).format(new Date(y, m - 1, d, 12)) } catch { return key }
}

// Rest days: weekdays that never break the streak (every week), plus single dates (a trip, a busy day). A rest day
// keeps the streak without spending a freeze; playing on one still counts.
function RestDays({ t, lang, player }) {
  const days = Array.isArray(player.restDays) ? player.restDays : []
  // Only future dates are LISTED, but every write keeps the past ones: they bridged days already gone (written from
  // the filtered list, a past day off became a missed day and the streak broke after the fact).
  const all = Array.isArray(player.restDates) ? player.restDates : []
  const dates = all.filter((d) => d >= dateKey()).sort()
  const [pick, setPick] = useState('')
  const letters = weekdayLetters(lang)
  const names = weekdayLetters(lang, 'long') // spoken: two T's and two S's are ambiguous
  const toggle = (i) => updateProfile(restDaysPatch(player, days.includes(i) ? days.filter((d) => d !== i) : [...days, i].sort(), dateKey()))
  // A PAST date (typed: min only limits the picker) revived a broken streak, and the list could not show it to undo.
  const addDate = () => { const next = addRestDate(player, pick, dateKey()); if (next) updateProfile({ restDates: next }); setPick('') }
  const btn = (on) => ({ width: 32, height: 32, borderRadius: '50%', fontSize: 12, fontWeight: 800, cursor: 'pointer', border: `1px solid ${on ? C.info : C.border}`, background: on ? `color-mix(in srgb, ${C.info} 18%, ${C.surface})` : C.surface, color: on ? C.info : C.ink })
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 12, color: C.inkDim, marginBottom: 4 }}>🌙 {t('game_restDays')}</div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {letters.map((l, i) => <button key={i} type="button" aria-label={names[i]} aria-pressed={days.includes(i)} onClick={() => toggle(i)} style={btn(days.includes(i))}>{l}</button>)}
      </div>
      <div style={{ fontSize: 12, color: C.inkDim, margin: '10px 0 4px' }}>{t('game_restDates')}</div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <input type="date" aria-label={t('game_restDates')} value={pick} min={dateKey()} onChange={(e) => setPick(e.target.value)} style={{ padding: '5px 8px', borderRadius: RADIUS.sm, border: `1px solid ${C.border}`, background: C.surfaceAlt, color: C.ink, fontSize: 12 }} />
        <button type="button" onClick={addDate} disabled={!pick} style={{ padding: '5px 10px', borderRadius: RADIUS.sm, border: `1px solid ${C.info}`, background: 'transparent', color: C.info, fontSize: 12, fontWeight: 800, cursor: pick ? 'pointer' : 'default', opacity: pick ? 1 : 0.5 }}>＋ {t('game_restAdd')}</button>
        {dates.map((d) => (
          <span key={d} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: RADIUS.pill, border: `1px solid ${C.border}`, fontSize: 12 }}>
            {restDateLabel(d, lang)}<button type="button" aria-label={t('game_restRemove')} onClick={() => updateProfile({ restDates: all.filter((x) => x !== d) })} style={{ border: 'none', background: 'transparent', color: C.inkDim, cursor: 'pointer', fontSize: 13 }}>×</button>
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
  // Leaving the pane or closing Settings within the debounce cancelled the save: flush the typed name on unmount.
  const nameRef = useRef(name); nameRef.current = name
  const savedNameRef = useRef(g.player?.name || ''); savedNameRef.current = g.player?.name || ''
  useEffect(() => () => {
    const n = nameRef.current.trim().slice(0, NAME_MAX)
    if (nameRef.current !== savedNameRef.current && n !== savedNameRef.current) updateProfile({ name: n })
  }, [])
  if (!ctx || !g.player) return null
  const { t } = ctx
  const goal = g.player.goalXp || DEFAULT_GOAL
  // Switching = forget this computer's choice and ask again.
  // A refused or failed request leaves this player picked (initGame reads the choice back), never an unhandled error.
  const switchPlayer = async () => {
    try {
      await saveGameNow()
      await apiFetch('/api/player-local', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ playerId: '' }) })
    } catch { /* still this player */ }
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
          <button key={o.key} type="button" aria-pressed={goal === o.xp} onClick={() => updateProfile({ goalXp: o.xp })} className={goal === o.xp ? 'ui-tab-current' : undefined} style={{
            padding: '6px 10px', borderRadius: RADIUS.sm, fontSize: 12, fontWeight: 700, cursor: goal === o.xp ? 'default' : 'pointer',
            border: `1px solid ${goal === o.xp ? C.brand : C.border}`, background: goal === o.xp ? C.brandTint : C.surface, color: goal === o.xp ? C.brandText : C.ink,
          }}>{t(`game_goal_${o.key}`)} · {t('game_goalMinutes', { m: o.minutes })}</button>
        ))}
      </div>
      <div style={hint}>{t('game_freezeHow', { max: MAX_FREEZES })}</div>
      <RestDays t={t} lang={ctx.lang} player={g.player} />
      <button onClick={switchPlayer} style={{ marginTop: 10, padding: '5px 10px', borderRadius: RADIUS.sm, border: `1px solid ${C.border}`, background: C.surface, color: C.inkDim, fontSize: 12, cursor: 'pointer' }}>
        {t('game_switchPlayer')}
      </button>
    </div>
  )
}
