// A sample of the learner's own cards for a practice activity: cards already seen (new cards belong to
// Study), plus a few due ones for a light extra touch, freshest first: cards another activity (Mistake Gym,
// Scenes, ...) practiced in the last days come last (practiceLog.js). [] when there is no card store or deck
// (the activity then works from the subject alone).
import { srs } from '../../cards'
import { readPracticeLog } from './practiceLogStore'
import { rankFresh } from './practiceLog'

const POOL_FACTOR = 4
const INFO_BATCH = 200
const SCAN_MAX = 2000 // cards looked at, at most, to find seen ones

const shuffle = (a) => a.map((x) => [x, Math.random()]).sort((p, q) => p[1] - q[1]).map(([x]) => x)

export async function pickCardItems(ctx, n, opts = {}) {
  const deck = ctx?.subject?.deck
  if (!ctx?.ankiConnected || !deck || n <= 0) return []
  // Anki closed since the app checked (ankiConnected is not re-checked while true): the activity still works from
  // the subject alone instead of failing on the card store's error.
  try { return await pickFrom(ctx, deck, n, opts) } catch { return [] }
}

async function pickFrom(ctx, deck, n, { due = 0 }) {
  const dueIds = due > 0 ? shuffle(await srs.findCards({ deck, state: 'due', excludeSuspended: true })).slice(0, due) : []
  const dueKeys = new Set(dueIds.map(String))
  const pool = shuffle(await srs.findCards({ deck, excludeSuspended: true })).filter((id) => !dueKeys.has(String(id))).slice(0, SCAN_MAX)
  const isSeen = (c) => Number(c.type) >= 1
  const infos = []
  for (let i = 0; i < dueIds.length; i += INFO_BATCH) infos.push(...((await srs.cardsInfo(dueIds.slice(i, i + INFO_BATCH))) || []))
  // The rest in batches until enough SEEN cards turned up: a fixed n * POOL_FACTOR sample of a mostly-new deck held
  // only new cards, and the activity got none of the learner's cards with plenty of studied ones in the deck.
  const want = n * POOL_FACTOR
  let found = 0
  for (let i = 0, size = want; i < pool.length && found < want; i += size, size = INFO_BATCH) {
    const got = (await srs.cardsInfo(pool.slice(i, i + size))) || []
    found += got.filter(isSeen).length
    infos.push(...got)
  }
  const seen = infos.filter(isSeen)
  const dueSet = new Set(dueIds.map(String))
  const log = await readPracticeLog(ctx)
  const withText = seen.map((c) => ({ c, ...ctx.cards.noteText(c) })).filter((x) => x.front)
  const dueFirst = rankFresh(withText.filter((x) => dueSet.has(String(x.c.cardId))), log)
  const rest = rankFresh(shuffle(withText.filter((x) => !dueSet.has(String(x.c.cardId)))), log)
  // One card per note (and per front): a reversed note's two cards carry the same fields, and the activity drilled
  // the same word twice in one run.
  const seenNotes = new Set()
  const once = [...dueFirst, ...rest].filter(({ c, front }) => {
    const keys = [c.note != null ? `n:${c.note}` : null, `f:${front.trim().toLowerCase()}`].filter(Boolean)
    if (keys.some((k) => seenNotes.has(k))) return false
    keys.forEach((k) => seenNotes.add(k))
    return true
  })
  return shuffle(once.slice(0, n)).map(({ c, front, back, fieldNames }) => ({ cardId: c.cardId, front, back, fieldNames }))
}
