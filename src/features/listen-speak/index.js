// LISTEN & SPEAK (optional, off until switched on): an audio workout in the Practice hub. Optional because
// every question costs a little speech (TTS + transcription) on the user's key. Remove this folder and its
// line in ../index.js to drop it.
import ListenScreen, { LISTEN_FEATURE_ID } from './ListenScreen'

export default {
  id: LISTEN_FEATURE_ID,
  optional: true,
  icon: '🎧',
  nameKey: 'ls_name',
  descKey: 'ls_desc',
  practiceActivities: [{ id: 'listen', order: 12, icon: '🎧', titleKey: 'ls_title', descKey: 'ls_tileDesc', Screen: ListenScreen }],
}
