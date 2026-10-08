// LISTEN & SPEAK (optional, off until switched on): an audio workout in the Practice hub. Optional because
// every question costs a little speech (TTS + transcription) on the user's key. Remove this folder and its
// line in ../index.js to drop it.
import { lazyComponent } from '../registry'
import { LISTEN_FEATURE_ID } from './featureId'

// The screen loads on demand (fetched in the background a few seconds after start), outside the startup bundle.
const ListenScreen = lazyComponent(() => import('./ListenScreen'), { prefetchMs: 8000 })

export default {
  id: LISTEN_FEATURE_ID,
  optional: true,
  icon: '🎧',
  nameKey: 'ls_name',
  descKey: 'ls_desc',
  practiceActivities: [{ id: 'listen', order: 12, icon: '🎧', titleKey: 'ls_title', descKey: 'ls_tileDesc', Screen: ListenScreen }],
}
