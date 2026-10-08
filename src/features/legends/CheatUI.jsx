// Cheat mode UI (hidden, for testing Legends). Turned on by clicking the map's title, or the Legends heading in Settings >
// General (works with no key and no map, e.g. to show the asset view), CHEAT_CLICKS times quickly;
// while on, the map and the steps show small ⚡ buttons and Settings > General shows a card to turn it off.
// Stored in the feature settings (config.json `features.legends.cheats`).
import { useRef } from 'react'
import { C, FONT, RADIUS } from '../../config/tokens'
import { useFeatureCtx, featureCfg } from '../registry'
import { LEGENDS_ID } from './store'

export const CHEAT_CLICKS = 7
export const CHEAT_WINDOW_MS = 3000

export const cheatsOn = (ctx) => !!ctx && featureCfg(ctx, LEGENDS_ID).cheats === true

// Count quick clicks on the map title; the CHEAT_CLICKS-th one flips cheat mode.
export function useCheatToggle(ctx) {
  const clicks = useRef([])
  return () => {
    const now = Date.now()
    clicks.current = [...clicks.current.filter((at) => now - at < CHEAT_WINDOW_MS), now]
    if (clicks.current.length < CHEAT_CLICKS) return
    clicks.current = []
    const on = !cheatsOn(ctx)
    ctx.setFeatureSettings(LEGENDS_ID, { cheats: on })
    ctx.notify?.(on ? ctx.t('lg_cheatOn') : ctx.t('lg_cheatOff'))
  }
}

export function CheatButton({ onClick, children, tip, disabled }) {
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); onClick() }} disabled={disabled} className={tip ? 'tip' : undefined} data-tip={tip}
      style={{
        fontFamily: FONT.body, fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: RADIUS.pill, whiteSpace: 'nowrap',
        border: `1px dashed color-mix(in srgb, ${C.purple} 55%, transparent)`, background: `color-mix(in srgb, ${C.purple} 10%, transparent)`,
        color: C.purple, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1,
      }}>{children}</button>
  )
}

export const CheatRow = ({ children, style }) => (
  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'center', ...style }}>{children}</div>
)

// Settings > General: only there while cheat mode is on (so it stays hidden), to explain it and turn it off.
export function CheatSettingsCard({ card, fieldLabel, hint }) {
  const ctx = useFeatureCtx()
  if (!cheatsOn(ctx)) return null
  const { t } = ctx
  return (
    <div style={card}>
      {fieldLabel(`⚡ ${t('lg_cheatTitle')}`)}
      <div style={hint}>{t('lg_cheatDesc', { n: CHEAT_CLICKS })}</div>
      <button type="button" onClick={() => { ctx.setFeatureSettings(LEGENDS_ID, { cheats: false }); ctx.notify?.(t('lg_cheatOff')) }}
        style={{ fontFamily: FONT.body, marginTop: 10, padding: '5px 12px', borderRadius: RADIUS.sm, border: `1px solid ${C.purple}`, background: 'transparent', color: C.purple, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
        {t('lg_cheatTurnOff')}
      </button>
    </div>
  )
}
