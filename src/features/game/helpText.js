// What Ebi's Help knows about the game (pure): today's XP and goal, the Ebiki streak and freezes, today's quests,
// the league and friends. Plain English facts for the model. Not secret: everything here is on screen somewhere.
import { computeStreak, dayTotals, dateKey, dayMeta, questProgress, leagueBoard, TIERS, DEFAULT_GOAL } from './engine'

export function gameHelpText(player, others = [], today = dateKey()) {
  if (!player) return ''
  // The goal the header and the rail show (the CURRENT setting): today's record keeps the goal of the day's first award,
  // so after a goal change Help named the old one beside a header showing the new one.
  const goal = player.goalXp || dayMeta(player, today).goal || DEFAULT_GOAL
  const totals = dayTotals(player, today)
  const s = computeStreak(player, today)
  const quests = (dayMeta(player, today).quests || []).map((q) => questProgress(q, totals)).filter((q) => !q.unknown)
  const board = leagueBoard(player, others, today, player.goalXp || DEFAULT_GOAL)
  const rank = board.rows.findIndex((r) => r.kind === 'me') + 1
  const lines = [
    `Ebiki game (XP and the Ebiki activity streak; NOT Anki's review streak, which the Stats tab shows):${player.name ? ` player "${player.name}".` : ''}`,
    `Today: ${totals.xp} XP of a daily goal of ${goal} XP${totals.xp >= goal ? ' (goal reached)' : ` (${goal - totals.xp} XP to go)`}; ${totals.cards || 0} cards studied, ${totals.added || 0} cards added.`,
    `Streak: ${s.streak} day${s.streak === 1 ? '' : 's'}${s.todayDone ? ' (today already counts)' : ' (earn any XP today to keep it)'}; longest ${s.longest}; ${s.freezes} streak freeze${s.freezes === 1 ? '' : 's'} held (a missed day uses one automatically; finishing all of a day's quests or beating a Legends boss earns one).`,
    quests.length ? `Today's quests: ${quests.map((q) => `${q.kind} ${q.value}/${q.target}${q.done ? ' done' : ''}`).join(', ')}.` : '',
    `League this week: tier ${TIERS[board.tier] || board.tier}, rank ${rank} of ${board.rows.length} (racing their own past weeks${others.length ? ' and friends' : ''}); ${board.daysLeft} day${board.daysLeft === 1 ? '' : 's'} left.`,
    others.length ? `Friends on this data folder: ${others.slice(0, 6).map((o) => `${o.name || 'unnamed'} (streak ${computeStreak(o, today).streak})`).join(', ')}.` : '',
  ]
  return lines.filter(Boolean).join('\n')
}
