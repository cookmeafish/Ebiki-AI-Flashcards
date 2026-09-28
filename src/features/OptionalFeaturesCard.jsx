// Settings > General: switch optional features on or off. Lists every feature marked `optional` in the
// registry, so a new optional feature shows up here with no extra wiring.
import { C } from '../config/tokens'
import { useFeatureCtx } from './registry'

export default function OptionalFeaturesCard({ card, fieldLabel, hint }) {
  const ctx = useFeatureCtx()
  const list = ctx?.registry?.optional?.() || []
  if (!ctx || !list.length) return null
  const { t } = ctx
  return (
    <div style={card}>
      {fieldLabel(t('feat_optionalTitle'))}
      <div style={{ display: 'grid', gap: 10 }}>
        {list.map((f) => {
          const on = ctx.featureSettings?.[f.id]?.enabled === true
          return (
            <label key={f.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
              <input type="checkbox" checked={on} onChange={(e) => ctx.setFeatureSettings(f.id, { enabled: e.target.checked })}
                style={{ width: 16, height: 16, marginTop: 2, accentColor: C.brand, cursor: 'pointer' }} />
              <span>
                <span style={{ display: 'block', fontSize: 12.5, color: C.ink, fontWeight: 700 }}>{f.icon ? `${f.icon} ` : ''}{t(f.nameKey)}</span>
                <span style={{ display: 'block', fontSize: 11.5, color: C.inkDim, lineHeight: 1.45 }}>{t(f.descKey)}</span>
              </span>
            </label>
          )
        })}
      </div>
      <div style={hint}>{t('feat_optionalHint')}</div>
    </div>
  )
}
