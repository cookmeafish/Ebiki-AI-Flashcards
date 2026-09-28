// ROLEPLAY: act out a scene with Ebi in character (any subject), scored at the end. A Practice activity, also
// reachable from the Chat "+" menu. Remove this folder and its line in ../index.js to drop it.
import RoleplayScreen, { ROLEPLAY_FEATURE_ID } from './RoleplayScreen'

const ACTIVITY_ID = 'roleplay'
const PRACTICE_NAV = 'practice' // the Practice hub (feature id = its sidebar id); without it the menu entry hides

export default {
  id: ROLEPLAY_FEATURE_ID,
  practiceActivities: [{ id: ACTIVITY_ID, order: 8, icon: '🎭', titleKey: 'rp_title', descKey: 'rp_desc', Screen: RoleplayScreen }],
  chatMenuItems: [{
    id: ACTIVITY_ID, order: 10, icon: '🎭', labelKey: 'rp_menu',
    visible: (ctx) => !!ctx?.registry?.isActive(PRACTICE_NAV),
    onPick: (ctx) => ctx.open(PRACTICE_NAV, { activity: `${ROLEPLAY_FEATURE_ID}:${ACTIVITY_ID}` }),
  }],
}
