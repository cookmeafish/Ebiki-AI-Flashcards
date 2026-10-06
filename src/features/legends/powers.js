// RAID POWERS (pure, tested by powers.test.js): tools the player earns in raids and spends in raid runs. Raids only.
// RULES (the owner's, 2026-10): earned by effort, never bought; random drops; a small bag (no hoarding to flatten a
// boss); each boss's profile caps how many one run may use (raidProfiles.js `slots`), one per question; bosses are
// balanced WITHOUT powers, so a power only ever makes a fight easier. Anki stays honest: a power that helps with the
// QUESTION (50:50, hint) records a right answer as Hard (it is graded like a hint); the others change only the fight.
//   unlock   raid bosses beaten (trophies) needed before it can drop
//   kind     aid (helps with the question) | survival (hearts) | offense (damage) | siege (between runs)
//   normal   only on a raid's own question (never on an attack or a question an ability inserted)
export const POWERS = {
  shield: { icon: '🛡', kind: 'survival', unlock: 1, normal: false },
  fifty: { icon: '✂', kind: 'aid', unlock: 3, normal: true },
  wind: { icon: '❤️', kind: 'survival', unlock: 5, normal: false },
  sharpen: { icon: '⚔', kind: 'offense', unlock: 8, normal: true },
  hint: { icon: '📜', kind: 'aid', unlock: 11, normal: true },
  bandage: { icon: '🩹', kind: 'siege', unlock: 13, normal: false },
}
export const POWER_IDS = Object.keys(POWERS)
// Bag size by raid bosses beaten; drops; Sharpen's extra damage.
export const BAG = { base: 3, steps: [{ wins: 13, size: 4 }, { wins: 20, size: 5 }] }
export const DROP = { runCards: 10, streak: 5, survivalWeight: 3 }
export const SHARPEN_BONUS = 2

export const raidWins = (state) => (Array.isArray(state?.trophies) ? state.trophies.length : 0)
export const unlockedPowers = (wins) => POWER_IDS.filter((id) => wins >= POWERS[id].unlock)
export const bagSize = (wins) => BAG.steps.reduce((n, s) => (wins >= s.wins ? s.size : n), BAG.base)
// The next power a win unlocks (for the result screen): { id, wins } or null.
export const nextUnlock = (wins) => { const id = POWER_IDS.find((x) => POWERS[x].unlock > wins); return id ? { id, wins: POWERS[id].unlock } : null }

// A stored bag: { [id]: count } with known ids and whole counts only.
export function shapeBag(raw) {
  const out = {}
  if (!raw || typeof raw !== 'object') return out
  for (const id of POWER_IDS) { const n = Math.floor(Number(raw[id])); if (Number.isFinite(n) && n > 0) out[id] = Math.min(n, 9) }
  return out
}
export const bagCount = (bag) => POWER_IDS.reduce((n, id) => n + (bag?.[id] || 0), 0)
export const bagList = (bag) => POWER_IDS.flatMap((id) => Array.from({ length: bag?.[id] || 0 }, () => id))

// THE DROPS of one run (random; `rnd` is injectable for tests). One for a run of at least DROP.runCards cards (or the
// whole run size when that is smaller), one for DROP.streak clean answers in a row, one for a win. A run that cost
// half the hearts or more leans toward survival powers (the bone for a bad day). A full bag drops nothing.
//   wins: bosses beaten (after this run), bag: the bag now, answered: the run's raid cards answered, runSize: the
//   setting, bestStreak: the run's longest clean streak, won, livesLost, hearts: the hearts the run started with.
export function rollDrops({ wins = 0, bag = {}, answered = 0, runSize = 15, bestStreak = 0, won = false, livesLost = 0, hearts = 1, rnd = Math.random } = {}) {
  const pool = unlockedPowers(wins)
  if (!pool.length) return []
  const earned = (answered >= Math.min(DROP.runCards, runSize) ? 1 : 0) + (bestStreak >= DROP.streak ? 1 : 0) + (won ? 1 : 0)
  const room = Math.max(0, bagSize(wins) - bagCount(bag))
  const rough = livesLost * 2 >= Math.max(1, hearts)
  const weight = (id) => (rough && POWERS[id].kind === 'survival' ? DROP.survivalWeight : 1)
  const total = pool.reduce((n, id) => n + weight(id), 0)
  const out = []
  for (let i = 0; i < Math.min(earned, room); i++) {
    let r = rnd() * total
    out.push(pool.find((id) => (r -= weight(id)) < 0) || pool[pool.length - 1])
  }
  return out
}
// The bag after spending `used` ({ id: n } or [ids]) and adding `drops` ([ids]): counts never below 0, never above
// the bag size (the drops that do not fit are dropped).
export function updateBag(bag, { used = {}, drops = [], wins = 0 } = {}) {
  const out = { ...shapeBag(bag) }
  const spent = Array.isArray(used) ? used.reduce((m, id) => ({ ...m, [id]: (m[id] || 0) + 1 }), {}) : used
  for (const [id, n] of Object.entries(spent || {})) if (POWERS[id]) { const left = (out[id] || 0) - n; if (left > 0) out[id] = left; else delete out[id] }
  for (const id of drops) if (POWERS[id] && bagCount(out) < bagSize(wins)) out[id] = (out[id] || 0) + 1
  return out
}

// WHEN A POWER CAN BE USED on the question on screen (RaidRun shows only these). `q`: the question (its flags),
// `asChoice`: it is shown as choices, `phase`: QuizRunner's ('answer' only), `bag`, `usedRun`: powers used this run,
// `slots`: the boss's per-run cap, `usedOnQ`: a power already used on this question, `livesLost`: this run's, `armed`:
// the powers armed now ({ shield, sharpen }), `windUsed`: Second wind already used this run.
export function powerUsable(id, { q = {}, asChoice = false, phase = 'answer', bag = {}, usedRun = 0, slots = 0, usedOnQ = false, livesLost = 0, armed = {}, windUsed = false } = {}) {
  const p = POWERS[id]
  if (!p || p.kind === 'siege' || phase !== 'answer' || !(bag[id] > 0) || usedRun >= slots || usedOnQ) return false
  const reask = !!(q._attack || q._inserted || q._lastStand)
  if (p.normal && reask) return false
  if (id === 'fifty') return !asChoice && !!q.alt && Array.isArray(q.alt.choices) && q.alt.choices.length > 2
  if (id === 'hint') return !asChoice && q.kind !== 'choice' && !q.open && Array.isArray(q.accepted) && !!q.accepted[0]
  if (id === 'shield') return !armed.shield
  if (id === 'sharpen') return !armed.sharpen && !asChoice
  if (id === 'wind') return livesLost > 0 && !windUsed
  return false
}

// 50:50: the right choice and ONE wrong one (picked by `rnd`), in their original order.
export function fiftyFifty(alt, rnd = Math.random) {
  const choices = alt?.choices || []
  const right = alt?.answerIdx
  const wrong = choices.map((_, i) => i).filter((i) => i !== right)
  if (right == null || !wrong.length) return null
  const keep = [right, wrong[Math.floor(rnd() * wrong.length) % wrong.length]].sort((a, b) => a - b)
  return { choices: keep.map((i) => choices[i]), answerIdx: keep.indexOf(right) }
}
// The hint: the first letter of every word of the answer, the rest as dots ("buenos días" → "b····· d···").
export const powerHint = (ans) => String(ans || '').split(/(\s+)/).map((w) => (/^\s+$/.test(w) ? w : [...w].map((ch, i) => (i === 0 || !/\p{L}/u.test(ch) ? ch : '·')).join(''))).join('')
