// PLACEMENT EXAM rules (pure, tested). Questions come in small batches, one difficulty tier at a time. A strong
// batch climbs a tier, a weak one steps down (the learner rated themselves too high) or ends the exam,
// and the level is read from the highest tier passed. 10 to 30 questions in all.
import { LEVEL_MAX } from '../kit/learner'

// Difficulty tiers, easiest first. `level` = the learner level a learner who passes this tier has at least;
// `brief` tells the question writer what the tier means (English, for the prompt).
export const TIERS = [
  { key: 'veryEasy', level: 8, brief: 'very easy: the first things anyone learns' },
  { key: 'easy', level: 28, brief: 'easy: everyday basics' },
  { key: 'medium', level: 52, brief: 'medium: solid working knowledge' },
  { key: 'hard', level: 80, brief: 'hard: advanced, detailed understanding' },
  { key: 'college', level: 110, brief: 'college level: expert nuance, the hardest cases' },
]
export const BATCH = 5
export const MIN_QUESTIONS = 10
export const MAX_QUESTIONS = 30
export const CLIMB_RATIO = 0.8      // a batch this good climbs a tier
export const FALL_RATIO = 0.4       // a batch this weak ends the exam (or steps down once)
export const PASS_RATIO = 0.6       // a tier counts as passed at this rate
export const MISS_RUN = 3           // this many misses in a row at one tier ends that tier

// Where the exam starts, from the questionnaire's 1..5 self-rating.
export const startTier = (selfRating) => [0, 0, 1, 2, 3, 3][Math.max(0, Math.min(5, Math.round(Number(selfRating) || 1)))]

export const newPlacement = (selfRating) => ({ tier: startTier(selfRating), answered: [], steppedDown: false, done: false })

// Per tier: { asked, correct }.
export function tierStats(answered) {
  const out = TIERS.map(() => ({ asked: 0, correct: 0 }))
  for (const a of answered || []) {
    const s = out[a.tier]
    if (!s) continue
    s.asked++
    if (a.correct) s.correct++
  }
  return out
}

// Longest run of misses at one tier.
const missRun = (answered, tier) => {
  let run = 0; let best = 0
  for (const a of answered) if (a.tier === tier) { run = a.correct ? 0 : run + 1; best = Math.max(best, run) }
  return best
}

// After a batch at `state.tier`: add its answers ([{ correct }]) and decide what comes next.
// Returns the new state; `done: true` ends the exam.
export function afterBatch(state, results) {
  const tier = state.tier
  const answered = [...state.answered, ...(results || []).map((r) => ({ tier, correct: !!r.correct }))]
  const stats = tierStats(answered)
  const s = stats[tier]
  const rate = s.asked ? s.correct / s.asked : 0
  const total = answered.length
  const asked = (i) => stats[i]?.asked > 0
  let next = { ...state, answered }
  const finish = () => ({ ...next, done: true })
  if (total >= MAX_QUESTIONS) return finish()
  const struggling = rate < FALL_RATIO || missRun(answered, tier) >= MISS_RUN
  let move = null
  if (!struggling && rate >= CLIMB_RATIO && tier < TIERS.length - 1 && !asked(tier + 1)) move = tier + 1
  // Struggling: step down until a tier holds (each tier asked once, so it never bounces back up).
  else if (struggling && tier > 0 && !asked(tier - 1)) { move = tier - 1; next = { ...next, steppedDown: true } }
  if (move == null && total < MIN_QUESTIONS) {
    // The level is not clear yet: probe the next tier up, else the one below, else ask more at this one.
    if (tier < TIERS.length - 1 && !asked(tier + 1) && !struggling) move = tier + 1
    else if (tier > 0 && !asked(tier - 1)) move = tier - 1
    else move = tier
  }
  return move == null ? finish() : { ...next, tier: move }
}

// The level the answers show (0..LEVEL_MAX): the highest tier passed, plus partial credit from the tier above.
export function placementLevel(answered) {
  const stats = tierStats(answered)
  const rate = (i) => (stats[i]?.asked ? stats[i].correct / stats[i].asked : 0)
  let passed = -1
  for (let i = 0; i < TIERS.length; i++) if (stats[i].asked && rate(i) >= PASS_RATIO) passed = i
  if (passed < 0) return Math.round(TIERS[0].level * rate(0))
  const lo = TIERS[passed].level
  const hi = TIERS[passed + 1]?.level ?? LEVEL_MAX
  const above = stats[passed + 1]?.asked ? rate(passed + 1) : 0
  return Math.round(Math.min(LEVEL_MAX, lo + (hi - lo) * above))
}

// How confident the result is (0..1): more answers, fewer tiers left unprobed.
export const placementConfidence = (answered) => Math.min(1, 0.3 + (answered?.length || 0) / MAX_QUESTIONS * 0.7)
