// PRACTICE HUB: a sidebar screen listing practice activities (Mistake Gym, Leech Doctor, Ebi Call, ...),
// each contributed by its own feature through the practiceActivities slot. Removing the hub hides the tiles
// (the activity features keep working wherever else they plug in).
import PracticeScreen from './PracticeScreen'

export const PRACTICE_FEATURE_ID = 'practice'

export default {
  id: PRACTICE_FEATURE_ID,
  navItems: [{ id: 'practice', icon: '🏋️', art: 'practice', labelKey: 'practice_nav', order: 20, Screen: PracticeScreen, rail: true }],
}
