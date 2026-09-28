// GAME: XP, daily goal, streak + freezes, daily quests, ghost league, friends. Works the same for every
// subject (a card is a card). Remove this folder, its line in ../index.js and its line in ../server.js to
// drop it; the app's EVENTS then simply go unheard.
import { EVENTS } from '../events'
import GameMount from './GameMount'
import { StreakChip } from './Header'
import { StreakCard, GoalCard, QuestsCard, LeagueCard, FriendsCard } from './Rail'
import GameSettingsCard from './SettingsCard'
import { award } from './store'

export const GAME_FEATURE_ID = 'game'
// Which finished practice session counts for which quest counter (by the source feature's id).
// Anything not listed still earns the generic practiceDone XP, so a new activity needs no change here.
const DONE_AWARD = { 'mistake-gym': 'gymDone', legends: 'legends', roleplay: 'roleplay' }

export default {
  id: GAME_FEATURE_ID,
  Mount: GameMount,
  headerItems: [{ id: 'streak', order: 10, Component: StreakChip }],
  railCards: [
    { id: 'streak', order: 10, Component: StreakCard },
    { id: 'goal', order: 20, Component: GoalCard },
    { id: 'quests', order: 30, Component: QuestsCard },
    { id: 'league', order: 40, Component: LeagueCard },
    { id: 'friends', order: 50, Component: FriendsCard },
  ],
  settingsCards: [{ id: 'game', section: 'general', order: 10, Component: GameSettingsCard }],
  // App facts → XP and quest counters.
  on: {
    [EVENTS.CARD_GRADED]: ({ correct }) => award('card', { correct }),
    [EVENTS.LEARN_DONE]: () => award('learn'),
    [EVENTS.CARDS_ADDED]: ({ n }) => award('cardAdded', { n }),
    [EVENTS.CHAT_SENT]: () => award('chat'),
    [EVENTS.PRACTICE_ANSWERED]: () => award('gym'),
    [EVENTS.PRACTICE_DONE]: ({ source }) => award(DONE_AWARD[source] || 'practiceDone'),
    [EVENTS.CALL_DONE]: ({ cards }) => award('call', { cards }),
  },
}
