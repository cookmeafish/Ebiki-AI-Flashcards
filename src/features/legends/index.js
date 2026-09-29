// LEGENDS: an adventure map per mode. A short questionnaire and an optional placement exam set the learner's
// level; Ebi plans themed areas, each a ladder of steps (learn, practice, rule, scene, talk) with a boss on top.
// Works for ANY subject. The learner level it sets lives in the kit (kit/learner.js) so other features read it.
// Remove this folder and its line in ../index.js to drop it (the game then never offers the Legends quest).
import { EVENTS } from '../events'
import { updateLearner } from '../kit/learnerStore'
import { applyLearnerDelta, deltaFor } from '../kit/learner'
import LegendsScreen from './LegendsScreen'
import LevelCard from './LevelCard'
import { LEGENDS_ID } from './store'
import { CheatSettingsCard } from './CheatUI'

// Other features' finished sessions nudge the level (Legends applies its own results directly).
const STEP_OF = { 'mistake-gym': 'gym', roleplay: 'roleplay', 'ebi-call': 'call' }

// Only an EXISTING level moves: nobody gets a level from outside events before placing themselves.
const nudge = (ctx, modeId, source, total, correct) => {
  const d = deltaFor(source, total, correct)
  if (!d || modeId == null) return
  updateLearner(ctx, modeId, (m) => (m ? applyLearnerDelta(m, d, source) : m))
}

export default {
  id: LEGENDS_ID,
  navItems: [{ id: 'legends', icon: '🗺️', labelKey: 'lg_nav', order: 15, Screen: LegendsScreen }],
  railCards: [{ id: 'level', order: 25, Component: LevelCard }],
  // Hidden: renders nothing until cheat mode is on (7 quick clicks on the map's title).
  settingsCards: [{ id: 'legends-cheats', section: 'general', order: 90, Component: CheatSettingsCard }],
  on: {
    [EVENTS.CARD_GRADED]: ({ correct, mode }, ctx) => nudge(ctx, mode, 'study', 1, correct ? 1 : 0),
    [EVENTS.PRACTICE_DONE]: ({ source, mode, total, correct }, ctx) => {
      if (String(source || '').startsWith(LEGENDS_ID)) return
      nudge(ctx, mode, STEP_OF[source] || 'practice', total, correct)
    },
  },
}
