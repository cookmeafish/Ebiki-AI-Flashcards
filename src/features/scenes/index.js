// SCENES (optional, off until switched on): short stories or case studies in the Practice hub. The scene
// generator itself lives in ../kit/scene.js so other features (Legends) can tell scenes too. Remove this
// folder and its line in ../index.js to drop it.
import { lazyComponent } from '../registry'
import { SCENES_FEATURE_ID } from './featureId'

// The screen loads on demand (fetched in the background a few seconds after start), outside the startup bundle.
const SceneScreen = lazyComponent(() => import('./SceneScreen'), { prefetchMs: 8000 })

export default {
  id: SCENES_FEATURE_ID,
  optional: true,
  icon: '📖',
  nameKey: 'sc_name',
  descKey: 'sc_desc',
  practiceActivities: [{ id: 'scene', order: 14, icon: '📖', titleKey: 'sc_title', descKey: 'sc_tileDesc', Screen: SceneScreen }],
}
