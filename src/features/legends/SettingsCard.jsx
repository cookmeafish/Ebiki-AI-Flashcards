// Settings > General: how Legends feels. Focus mode (no entrance cinematic, floaters or combo flair; the rules stay),
// the one-time "add what you missed to your deck" nudge, and accent grading (the SAME setting as Study's accent
// drill, offered only when the learned language writes accents).
import { C, FONT } from '../../config/tokens'
import { useFeatureCtx, featureCfg } from '../registry'
import { LEGENDS_ID } from './store'

function Check({ checked, onChange, label, desc }) {
  return (
    <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', marginTop: 10 }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ marginTop: 3 }} />
      <span>
        <span style={{ display: 'block', fontFamily: FONT.body, fontWeight: 800, fontSize: 13.5, color: C.ink }}>{label}</span>
        <span style={{ display: 'block', fontSize: 12.5, color: C.inkDim, lineHeight: 1.45 }}>{desc}</span>
      </span>
    </label>
  )
}

export default function LegendsSettingsCard({ card, fieldLabel, hint }) {
  const ctx = useFeatureCtx()
  if (!ctx) return null
  const { t, subject } = ctx
  const cfg = featureCfg(ctx, LEGENDS_ID)
  const set = (patch) => ctx.setFeatureSettings(LEGENDS_ID, patch)
  return (
    <div style={card}>
      {fieldLabel(`🗺️ ${t('lg_setTitle')}`)}
      <div style={hint}>{t('lg_setDesc')}</div>
      <Check checked={cfg.focus === true} onChange={(v) => set({ focus: v })} label={t('lg_setFocus')} desc={t('lg_setFocusDesc')} />
      <Check checked={cfg.nudge !== false} onChange={(v) => set({ nudge: v })} label={t('lg_setNudge')} desc={t('lg_setNudgeDesc')} />
      {subject?.accents && (
        <Check checked={subject.strictAccents !== false} onChange={(v) => subject.setStrictAccents?.(v)} label={t('lg_setAccents', { lang: subject.learnLang })} desc={t('lg_setAccentsDesc')} />
      )}
    </div>
  )
}
