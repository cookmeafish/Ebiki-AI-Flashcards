// Settings > General: turn voice typing on/off and see which engine (and cost) it will use.
import { C } from '../../config/tokens'
import { useFeatureCtx, featureCfg } from '../registry'
import { speechEngines } from '../../speech'
import { VOICE_FEATURE_ID } from './VoiceTyping'

const ENGINE_HINT = { openai: 'voice_engineOpenai', gemini: 'voice_engineGemini', grok: 'voice_engineGrok', browser: 'voice_engineBrowser' }
const NO_ENGINE_HINT = 'voice_needKey'

export default function VoiceSettingsCard({ card, fieldLabel, hint }) {
  const ctx = useFeatureCtx()
  if (!ctx) return null
  const { t } = ctx
  const cfg = featureCfg(ctx, VOICE_FEATURE_ID)
  const engine = speechEngines(ctx).stt
  return (
    <div style={card}>
      {fieldLabel(t('voice_setting'))}
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
        <input type="checkbox" checked={cfg.enabled !== false} onChange={(e) => ctx.setFeatureSettings(VOICE_FEATURE_ID, { enabled: e.target.checked })}
          style={{ width: 16, height: 16, accentColor: C.brand, cursor: 'pointer' }} />
        <span style={{ fontSize: 12, color: C.ink, fontWeight: 600 }}>{t('voice_settingLabel')}</span>
      </label>
      <div style={hint}>{t(ENGINE_HINT[engine] || NO_ENGINE_HINT)}</div>
    </div>
  )
}
