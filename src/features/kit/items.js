// A sample of the learner's own cards for a practice activity: cards already seen (new cards belong to
// Study), plus a few due ones for a light extra touch, freshest first: cards another activity (Mistake Gym,
// Scenes, ...) practiced in the last days come last (practiceLog.js). [] when there is no card store or deck
// (the activity then works from the subject alone).
import { srs } from '../../cards'
import { readPracticeLog } from './practiceLogStore'
import { rankFresh } from './practiceLog'

const POOL_FACTOR = 4
const INFO_BATCH = 200

const shuffle = (a) => a.map((x) => [x, Math.random()]).sort((p, q) => p[1] - q[1]).map(([x]) => x)

export async function pickCardItems(ctx, n, { due = 0 } = {}) {
  const deck = ctx?.subject?.deck
  if (!ctx?.ankiConnected || !deck || n <= 0) return []
  const ids = shuffle(await srs.findCards({ deck, excludeSuspended: true })).slice(0, n * POOL_FACTOR)
  const dueIds = due > 0 ? shuffle(await srs.findCards({ deck, state: 'due', excludeSuspended: true })).slice(0, due) : []
  const all = [...new Set([...dueIds, ...ids])]
  const infos = []
  for (let i = 0; i < all.length; i += INFO_BATCH) infos.push(...((await srs.cardsInfo(all.slice(i, i + INFO_BATCH))) || []))
  const seen = infos.filter((c) => Number(c.type) >= 1)
  const dueSet = new Set(dueIds.map(String))
  const log = await readPracticeLog(ctx)
  const withText = seen.map((c) => ({ c, ...ctx.cards.noteText(c) })).filter((x) => x.front)
  const dueFirst = rankFresh(withText.filter((x) => dueSet.has(String(x.c.cardId))), log)
  const rest = rankFresh(shuffle(withText.filter((x) => !dueSet.has(String(x.c.cardId)))), log)
  return shuffle([...dueFirst, ...rest].slice(0, n)).map(({ c, front, back, fieldNames }) => ({ cardId: c.cardId, front, back, fieldNames }))
}
