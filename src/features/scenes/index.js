// SCENES (optional, off until switched on): short stories or case studies in the Practice hub. The scene
// generator itself lives in ../kit/scene.js so other features (Legends) can tell scenes too. Remove this
// folder and its line in ../index.js to drop it.
import SceneScreen, { SCENES_FEATURE_ID } from './SceneScreen'

export default {
  id: SCENES_FEATURE_ID,
  optional: true,
  icon: '📖',
  nameKey: 'sc_name',
  descKey: 'sc_desc',
  practiceActivities: [{ id: 'scene', order: 14, icon: '📖', titleKey: 'sc_title', descKey: 'sc_tileDesc', Screen: SceneScreen }],
}
