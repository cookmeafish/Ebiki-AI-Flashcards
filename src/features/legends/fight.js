// FIGHT RULES (pure, tested): damage, attacks, combos, rage phases and the end of a fight. Shared by the Legends
// boss, Legendary runs and raids. The screens (BossArena.jsx, NodeRun.jsx, RaidRun.jsx) only draw what this says.
//
// Health = the right answers a fight needs (bossOdds: PASS of the questions). Every answer is a strike:
//   power strike (typed): a CLEAN answer (the tested thing AND the rest right) deals 2, a GLANCING one (the tested
//   thing right, something else wrong) deals 1 and its slip comes back as an attack; a MISS deals nothing.
//   safe strike (choices): a right answer deals 1.
// A miss costs a life. A missed item comes back later as the boss's ATTACK (telegraphed): answered right it is
// blocked and counters for 1 damage, missed it costs 2 lives. Every third clean strike in a row is a critical (+1),
// and an item the boss is weak to deals +1. A fight ends at 0 health (won) or 0 lives (lost); the outcome decides the
// pass on its own (applyNodeResult), so a win can never read as a fail and a loss never as a pass.

export const DAMAGE = { clean: 2, glancing: 1, choice: 1, weak: 1, crit: 1, counter: 1 }
export const ATTACK_LIVES = 2          // a missed attack
export const MISS_LIVES = 1
export const COMBO_EVERY = 3           // every Nth clean strike in a row is a critical
export const MAX_ATTACKS = 5           // attacks one fight can throw (a missed attack never spawns another)
export const ATTACK_GAP = 3            // an attack comes this many questions after the miss that caused it
export const RAGE_AT = 0.5             // the boss enrages at half health: no more safe strikes
export const WEAK_TO_MAX = 2

export const newFight = () => ({ damage: 0, livesLost: 0, combo: 0, crits: 0, attacks: 0, blocked: 0, answers: 0, clean: 0, glancing: 0, safe: 0, misses: 0, shieldUsed: false, last: null, n: 0 })

// One answer. hit = { verdict: 'clean'|'glancing'|'miss', mode: 'typed'|'choice', weak?: bool, attack?: bool }.
// `shield`: the learner holds a shield (it absorbs the first life a fight would take, once).
export function strike(state, hit, { shield = false } = {}) {
  const s = { ...state, n: state.n + 1 }
  const right = hit.verdict === 'clean' || hit.verdict === 'glancing'
  let dmg = 0
  let lives = 0
  let crit = false
  if (hit.attack) {
    // An attack: a block counters, a miss hurts twice. It never builds or breaks a combo.
    if (right) { dmg = DAMAGE.counter; s.blocked++ } else lives = ATTACK_LIVES
  } else {
    s.answers++
    if (!right) {
      lives = MISS_LIVES; s.misses++; s.combo = 0
    } else if (hit.mode === 'choice') {
      dmg = DAMAGE.choice; s.safe++; s.combo = 0
    } else if (hit.verdict === 'glancing') {
      dmg = DAMAGE.glancing; s.glancing++; s.combo = 0
    } else {
      dmg = DAMAGE.clean; s.clean++; s.combo++
      if (s.combo % COMBO_EVERY === 0) { dmg += DAMAGE.crit; crit = true; s.crits++ }
    }
    if (right && hit.weak) dmg += DAMAGE.weak
  }
  let shielded = false
  if (lives > 0 && shield && !s.shieldUsed) { lives--; s.shieldUsed = true; shielded = true }
  s.damage += dmg
  s.livesLost += lives
  s.last = { kind: dmg > 0 ? 'hit' : lives > 0 ? 'miss' : 'block', damage: dmg, lives, crit, shielded, attack: !!hit.attack, n: s.n }
  return s
}

// 'won' | 'lost' | '' for health `need` and `lives`.
export const fightOutcome = (state, { need, lives }) => (state.damage >= need ? 'won' : state.livesLost >= lives ? 'lost' : '')
export const healthLeft = (state, need) => Math.max(0, need - state.damage)
export const livesLeft = (state, lives) => Math.max(0, lives - state.livesLost)

// Phase of a fight from the health left: a boss has 2 (rage at RAGE_AT), a raid boss 3 (at two thirds, one third).
export function phaseOf(hpLeft, need, phases = 2) {
  if (need <= 0) return 1
  const share = hpLeft / need
  if (phases >= 3) return share <= 1 / 3 ? 3 : share <= 2 / 3 ? 2 : 1
  return share <= RAGE_AT ? 2 : 1
}

// Where an attack goes: ATTACK_GAP questions after `idx` (or the end), never beyond the list.
export const attackSlot = (idx, total) => Math.min(total, idx + 1 + ATTACK_GAP)
export const canAttack = (state) => state.attacks < MAX_ATTACKS

// The items a boss is weak to: the area's rule items first (the core of an area), then its first items. Stable.
export function weakTo(area, max = WEAK_TO_MAX) {
  const items = area?.items || []
  const rules = items.filter((it) => it.kind === 'rule')
  const rest = items.filter((it) => it.kind !== 'rule')
  return [...rules, ...rest].slice(0, max).map((it) => it.id)
}

// How much effort the answers show, for XP: clean power strikes most, safe choices least. 0.5 .. 1.3.
export const EFFORT = { clean: 1.3, glancing: 1, typed: 1.1, choice: 0.8, miss: 0, min: 0.5, max: 1.3 }
export function effortOf({ clean = 0, glancing = 0, typed = 0, choice = 0, misses = 0 } = {}) {
  const n = clean + glancing + typed + choice + misses
  if (!n) return 1
  const e = (clean * EFFORT.clean + glancing * EFFORT.glancing + typed * EFFORT.typed + choice * EFFORT.choice) / n
  return Math.round(Math.max(EFFORT.min, Math.min(EFFORT.max, e)) * 100) / 100
}

// A raid card's Anki rating from its FIRST answer: a clean or safe right answer is Good (a choice is recognition,
// never above Good; one question is never Easy), a glancing one Hard, a miss Again.
export const RAID_EASE = { again: 1, hard: 2, good: 3 }
export function raidRating(hit) {
  if (!hit || hit.verdict === 'miss') return { ease: RAID_EASE.again, rating: 'again' }
  if (hit.verdict === 'glancing') return { ease: RAID_EASE.hard, rating: 'hard' }
  return { ease: RAID_EASE.good, rating: 'good' }
}
