// LEGENDS: an adventure map per mode. A short questionnaire and an optional placement exam set the learner's
// level; Ebi plans themed areas, each a ladder of steps (learn, practice, rule, scene, talk) with a boss on top.
// Works for ANY subject. The learner level it sets lives in the kit (kit/learner.js) so other features read it.
// Remove this folder and its line in ../index.js to drop it (the game then never offers the Legends quest).
import LegendsScreen from './LegendsScreen'
import LevelCard from './LevelCard'
import { LEGENDS_ID } from './store'
import { CheatSettingsCard } from './CheatUI'
import LegendsSettingsCard from './SettingsCard'
import RaidTile from './RaidTile'
import HelpBridge from './HelpBridge'
import { EVENTS } from '../events'
import { peekMap, updateMap, configureLegends } from './store'
import { tallyStudiedCard } from './map'

// Other features' results move the level through the learner feature (../learner); Legends applies its own.

export default {
  id: LEGENDS_ID,
  // focus: calm fights (no cinematic or flair); nudge: offer first-time misses as cards once.
  defaults: { focus: false, nudge: true, motion: false, still: false },
  // Tells Ebi's Help what the learner does in Legends, on every screen (helpContext.js).
  Mount: HelpBridge,
  navItems: [{ id: 'legends', icon: '🗺️', art: 'legends', labelKey: 'lg_nav', order: 15, Screen: LegendsScreen }],
  railCards: [{ id: 'level', order: 25, Component: LevelCard }],
  // The daily raid: the deck's due cards as a boss fight (every answer is a real Anki review).
  practiceActivities: [{ id: 'raid', order: 3, icon: '⚔️', titleKey: 'lg_raidTile', descKey: 'lg_raidTileDesc', Screen: RaidTile }],
  // Hidden: renders nothing until cheat mode is on (7 quick clicks on the map's title).
  settingsCards: [
    { id: 'legends-settings', section: 'general', order: 85, Component: LegendsSettingsCard },
    { id: 'legends-cheats', section: 'general', order: 90, Component: CheatSettingsCard },
  ],
  on: {
    // A Legends item's card answered in Study counts for the item (codex, Weak spots). Only when the map is already
    // loaded and holds that card: no store read per graded card.
    [EVENTS.CARD_GRADED]: ({ noteId, correct, mode }, ctx) => {
      if (noteId == null || mode == null) return
      if (ctx) configureLegends(ctx) // the writer freeze, even when the Legends screen was never opened
      const m = peekMap(mode)
      if (!m || tallyStudiedCard(m, noteId, correct) === m) return
      updateMap(mode, (cur) => tallyStudiedCard(cur, noteId, correct))
    },
  },
}
