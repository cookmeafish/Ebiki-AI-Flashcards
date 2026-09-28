// EBI CALL: a conversation that counts as a review. Lives in the Practice hub.
import CallScreen, { CALL_FEATURE_ID } from './CallScreen'

export default {
  id: CALL_FEATURE_ID,
  practiceActivities: [{ id: 'call', order: 5, icon: '📞', titleKey: 'call_title', descKey: 'call_desc', Screen: CallScreen }],
}
