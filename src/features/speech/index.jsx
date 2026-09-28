// SPEECH SETTINGS: which engine turns speech into text and text into speech, with prices. Every voice
// feature (voice typing, voice chat, listening drills, scenes) reads these through src/speech.
// VOICE CHAT (optional): talk to Ebi out loud in Ebi Call and Roleplay (speech in, spoken replies out).
import { useState } from 'react'
import { C, RADIUS } from '../../config/tokens'
import { useFeatureCtx, featureCfg } from '../registry'
import { speechEngines, speak, COSTS, SPEECH_SETTINGS_ID } from '../../speech'
import { platform } from '../../platform'
import { VOICE_CHAT_ID } from '../kit'

const KEY_OF = { gemini: 'gemini', grok: 'grok', openai: 'openai' }
const NAME = { browser: 'speech_browser', device: 'speech_device', gemini: 'Gemini', grok: 'Grok', openai: 'OpenAI' }
const perMin = (usd) => (usd === 0 ? null : `$${usd.toFixed(4).replace(/0+$/, '')}`)

function EngineSelect({ kind, value, onChange, t, keys }) {
  const usable = (e) => (e === 'browser' ? platform.speech.canRecognize() : e === 'device' ? true : !!keys?.[KEY_OF[e]])
  const label = (e) => {
    const name = NAME[e].startsWith('speech_') ? t(NAME[e]) : NAME[e]
    const price = perMin(COSTS[kind][e])
    return `${name} · ${price ? t('speech_perMin', { p: price }) : t('speech_free')}${usable(e) ? '' : ` (${t('speech_noKey')})`}`
  }
  const engines = Object.keys(COSTS[kind]).sort((a, b) => COSTS[kind][a] - COSTS[kind][b])
  return (
    <select value={value || 'auto'} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', padding: '7px 8px', borderRadius: RADIUS.sm, border: `1px solid ${C.border}`, background: C.surfaceAlt, color: C.ink, fontSize: 12.5 }}>
      <option value="auto">{t(kind === 'stt' ? 'speech_autoStt' : 'speech_autoTts')}</option>
      {engines.map((e) => <option key={e} value={e} disabled={!usable(e)}>{label(e)}</option>)}
    </select>
  )
}

function SpeechSettingsCard({ card, fieldLabel, hint }) {
  const ctx = useFeatureCtx()
  const [trying, setTrying] = useState(false)
  if (!ctx) return null
  const { t } = ctx
  const cfg = featureCfg(ctx, SPEECH_SETTINGS_ID)
  const using = speechEngines(ctx)
  const set = (patch) => ctx.setFeatureSettings(SPEECH_SETTINGS_ID, patch)
  const nameOf = (e) => (!e ? t('speech_none') : NAME[e].startsWith('speech_') ? t(NAME[e]) : NAME[e])
  const tryIt = async () => { setTrying(true); try { await speak(ctx, t('speech_sample'), { lang: ctx.lang }).done } finally { setTrying(false) } }
  return (
    <div style={card}>
      {fieldLabel(t('speech_title'))}
      <div style={{ fontSize: 12, color: C.inkDim, margin: '4px 0' }}>{t('speech_sttLabel')}</div>
      <EngineSelect kind="stt" value={cfg.stt} onChange={(v) => set({ stt: v })} t={t} keys={ctx.apiKeys} />
      <div style={{ fontSize: 11.5, color: C.inkFaint, marginTop: 3 }}>{t('speech_using', { e: nameOf(using.stt) })}</div>
      <div style={{ fontSize: 12, color: C.inkDim, margin: '12px 0 4px' }}>{t('speech_ttsLabel')}</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}><EngineSelect kind="tts" value={cfg.tts} onChange={(v) => set({ tts: v })} t={t} keys={ctx.apiKeys} /></div>
        <button onClick={tryIt} disabled={trying} style={{ padding: '5px 12px', borderRadius: RADIUS.sm, border: `1px solid ${C.border}`, background: C.surface, color: C.ink, fontSize: 12, cursor: trying ? 'default' : 'pointer', opacity: trying ? 0.5 : 1 }}>🔊 {t('speech_try')}</button>
      </div>
      <div style={{ fontSize: 11.5, color: C.inkFaint, marginTop: 3 }}>{t('speech_using', { e: nameOf(using.tts) })}</div>
      <div style={hint}>{t('speech_hint')}</div>
    </div>
  )
}

export const speechFeature = {
  id: SPEECH_SETTINGS_ID,
  defaults: { stt: 'auto', tts: 'auto' },
  settingsCards: [{ id: 'speech', section: 'general', order: 45, Component: SpeechSettingsCard }],
}

// A switch only: Ebi Call and Roleplay show their talk button and speak replies when it is on.
export const voiceChatFeature = {
  id: VOICE_CHAT_ID,
  optional: true,
  icon: '🎙️',
  nameKey: 'vchat_name',
  descKey: 'vchat_desc',
}

