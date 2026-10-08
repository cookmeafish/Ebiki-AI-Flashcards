// LEGENDS: an adventure map per mode. A short questionnaire and an optional placement exam set the learner's
// level; Ebi plans themed areas, each a ladder of steps (learn, practice, rule, scene, talk) with a boss on top.
// Works for ANY subject. The learner level it sets lives in the kit (kit/learner.js) so other features read it.
// Remove this folder and its line in ../index.js to drop it (the game then never offers the Legends quest).
import { lazyComponent } from '../registry'
import { cheatsOn } from './CheatUI'
import LevelCard from './LevelCard'
import { LEGENDS_ID } from './store'
import { CheatSettingsCard } from './CheatUI'
import LegendsSettingsCard from './SettingsCard'
import HelpBridge from './HelpBridge'
import { EVENTS } from '../events'
import { peekMap, updateMap, configureLegends } from './store'
import { tallyStudiedCard } from './map'
import './learnerSource' // map progress and raids in the app-wide learner context (kit/learnerContext.js)

// The screens, the raid fight and the asset view load ON DEMAND (most of Legends' code: the map, every boss's art,
// effects and impact moments), so they stay out of the startup bundle. They are fetched in the background a few
// seconds after start (the hub's raid hero must paint at once when Practice opens); the asset view only when opened.
const PREFETCH_MS = 6000
const LegendsScreen = lazyComponent(() => import('./LegendsScreen'), { prefetchMs: PREFETCH_MS })
const AssetScreen = lazyComponent(() => import('./AssetScreen'))
const RaidTile = lazyComponent(() => import('./RaidTile'), { prefetchMs: PREFETCH_MS })
const RaidHero = lazyComponent(() => import('./RaidHero'), { prefetchMs: PREFETCH_MS })

// Other features' results move the level through the learner feature (../learner); Legends applies its own.

export default {
  id: LEGENDS_ID,
  // focus: calm fights (no cinematic or flair); nudge: offer first-time misses as cards once; taunts: bosses tease a
  // miss in their own voice (off in focus mode too).
  defaults: { focus: false, nudge: true, motion: false, still: false, taunts: true, raidRunSize: 15 },
  // Tells Ebi's Help what the learner does in Legends, on every screen (helpContext.js).
  Mount: HelpBridge,
  navItems: [
    { id: 'legends', icon: '🗺️', art: 'legends', labelKey: 'lg_nav', descKey: 'lg_navDesc', order: 15, Screen: LegendsScreen },
    // Cheat mode only: every boss, raid boss, banner and Ebi draft (AssetView.jsx), straight from the sidebar.
    { id: 'assets', icon: '🎨', labelKey: 'lg_cheatAssets', descKey: 'lg_cheatAssetsDesc', order: 95, Screen: AssetScreen, visible: (ctx) => cheatsOn(ctx) },
  ],
  railCards: [{ id: 'level', order: 25, Component: LevelCard }],
  // The daily raid: the deck's due cards as a boss fight (every answer is a real Anki review).
  practiceActivities: [{ id: 'raid', order: 3, icon: '⚔️', titleKey: 'lg_raidTile', descKey: 'lg_raidTileDesc', Screen: RaidTile }],
  // ...and its hero card at the top of the hub: today's boss, its health and the cards due (RaidHero.jsx, read only).
  practiceHero: [{ id: 'raid', order: 10, activity: 'raid', Component: RaidHero }],
  // Hidden: renders nothing until cheat mode is on (7 quick clicks on the map's title).
  settingsCards: [
    { id: 'legends-settings', section: 'general', order: 85, Component: LegendsSettingsCard },
    { id: 'legends-cheats', section: 'general', order: 90, Component: CheatSettingsCard },
  ],
  on: {
    // A Legends item's card answered in Study counts for the item (codex, Weak spots). Only when the map is already
    // loaded and holds that card: no store read per graded card.
    [EVENTS.CARD_GRADED]: ({ noteId, correct, grade, mode }, ctx) => {
      if (noteId == null || mode == null) return
      if (ctx) configureLegends(ctx) // the writer freeze, even when the Legends screen was never opened
      const m = peekMap(mode)
      // `grade`: Study's rating under the shared rule (config/grading.js); anything but Again counts right.
      if (!m || tallyStudiedCard(m, noteId, correct, grade) === m) return
      updateMap(mode, (cur) => tallyStudiedCard(cur, noteId, correct, grade))
    },
  },
}
