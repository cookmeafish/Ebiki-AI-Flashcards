// VOICE TYPING: a microphone on every text box. Remove this folder and its line in ../index.js to drop it.
import VoiceTyping, { VOICE_FEATURE_ID } from './VoiceTyping'
import VoiceSettingsCard from './SettingsCard'

export default {
  id: VOICE_FEATURE_ID,
  defaults: { enabled: true },
  Mount: VoiceTyping,
  settingsCards: [{ id: 'voice', section: 'general', order: 50, Component: VoiceSettingsCard }],
}
