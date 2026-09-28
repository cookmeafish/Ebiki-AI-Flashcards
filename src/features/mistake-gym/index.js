// MISTAKE GYM: every study question you miss is kept (per mode), and a workout of fresh questions aimed at
// the pattern behind them is one click away in the Practice hub. Never touches the review schedule.
import { EVENTS } from '../events'
import GymScreen, { GymBadge } from './GymScreen'
import { updateMistakes, configureGym, GYM_FEATURE_ID } from './store'
import { addMisses } from './mistakes'

export default {
  id: GYM_FEATURE_ID,
  practiceActivities: [{ id: 'gym', order: 10, icon: '💪', titleKey: 'gym_title', descKey: 'gym_desc', Screen: GymScreen, Badge: GymBadge }],
  on: {
    [EVENTS.CARD_GRADED]: (p, ctx) => {
      if (!p?.misses?.length) return
      configureGym({ isBlocked: () => !!ctx?.isDataSwitching?.() })
      updateMistakes(p.mode, (list) => addMisses(list, p))
    },
  },
}
