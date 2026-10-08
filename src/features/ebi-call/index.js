// EBI CALL: a conversation that counts as a review. Lives in the Practice hub.
import { lazyComponent } from '../registry'
import { CALL_FEATURE_ID } from './featureId'

// The screen loads on demand (fetched in the background a few seconds after start), outside the startup bundle.
const CallScreen = lazyComponent(() => import('./CallScreen'), { prefetchMs: 8000 })

export default {
  id: CALL_FEATURE_ID,
  practiceActivities: [{ id: 'call', order: 5, icon: '📞', titleKey: 'call_title', descKey: 'call_desc', Screen: CallScreen }],
}
