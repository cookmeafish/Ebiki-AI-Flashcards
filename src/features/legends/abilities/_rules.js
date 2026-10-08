// The base fight constants and pure helpers, shared by fight.js and every raid ability module (abilities/<motif>.js).
// They live here, not in fight.js, so an ability module never imports fight.js (fight.js imports the registry, which
// imports the modules: importing fight.js back would be a cycle). fight.js re-exports all of it.

export const DAMAGE = { clean: 2, glancing: 1, choice: 1, weak: 1, crit: 1, counter: 1 }
export const ATTACK_LIVES = 2          // a missed attack
export const MISS_LIVES = 1
export const COMBO_EVERY = 3           // every Nth clean strike in a row is a critical
export const MAX_ATTACKS = 5           // attacks one fight can throw (a missed attack never spawns another)
export const ATTACK_GAP = 3            // an attack comes this many questions after the miss that caused it
export const RAGE_AT = 0.5             // the boss enrages at half health: no more safe strikes
export const WEAK_TO_MAX = 2

// THE ATTENTION BUDGET (design v2.1: the QUESTION is the focus). Enforced by abilities/fairness.test.js and by
// raidStep / RaidRun at run time.
export const MAX_INSERTED = 4          // ability-inserted questions (minions, loops, last stands) per ATTEMPT, all kinds together
export const DECISION_MAX = 5          // modules that may declare `decision: true` (and so show buttons)
export const HINT_MAX_WORDS = 8        // a hint line, in English
export const TAG_MAX_WORDS = 3         // a per-question tag chip, in English
export const IDLE_MOTIFS = ['dreamer'] // the only boss allowed a PERSISTENT idle reaction (idle())

// THE FIGHT RULES as one object: the defaults every fight starts from (the constants above are these numbers). A raid
// fight carries its RESOLVED rules (raidProfiles.js raidProfile(motif, variant): defaults, the boss's own, a variant
// such as nightmare) as `fight.tune.rules`; the engine reads rulesOf(fight), so a Legends boss (no tune) keeps these.
//   damage       what each kind of strike deals (clean, glancing, choice, weak bonus, crit bonus, attack counter)
//   missLives    lives a missed question costs; attackLives: lives a missed ATTACK costs (an ability may change it)
//   comboEvery   every Nth clean strike in a row is a critical; maxAttacks: attacks one fight can throw
//   attackGap    questions between a miss and its returning attack; rageAt: health share where a Legends boss enrages
//   weakToMax    items a Legends boss is weak to; maxInserted: ability-inserted questions per raid attempt
//   phases       a raid boss's phases; rallyShare: share of a lost run's damage a raid boss heals back (raid.js)
export const FIGHT_RULES = Object.freeze({
  damage: Object.freeze({ ...DAMAGE }), missLives: MISS_LIVES, attackLives: ATTACK_LIVES, comboEvery: COMBO_EVERY,
  maxAttacks: MAX_ATTACKS, attackGap: ATTACK_GAP, rageAt: RAGE_AT, weakToMax: WEAK_TO_MAX, maxInserted: MAX_INSERTED,
  phases: 3, rallyShare: 0.5,
})
// The rules a fight runs on: its resolved `tune.rules` over the defaults (a partial override keeps the rest).
export function rulesOf(state) {
  const r = state && state.tune && state.tune.rules
  if (!r) return FIGHT_RULES
  return { ...FIGHT_RULES, ...r, damage: { ...FIGHT_RULES.damage, ...(r.damage || {}) } }
}
// An ability module's RESOLVED tuning for a fight: its own K (the defaults, the header spec) under the profile's `k`
// carried on the fight (`tune.k`, only when it was resolved for this ability). Hooks get it as ctx.K.
export function abilityK(mod, state) {
  if (!mod) return {}
  const t = state && state.tune
  const k = t && t.k && (!t.ability || t.ability === mod.id) ? t.k : null
  return k ? { ...(mod.K || {}), ...k } : mod.K || {}
}
// Inside a module's hook: the tuning to use. `ctx.K` (the resolved K the engine hands every hook) over the module's own
// K (a test or caller passing no ctx gets the defaults). Hooks NEVER read the module's K directly (tuning.test.js).
export const tuned = (K, ctx) => (ctx && ctx.K && ctx.K !== K ? { ...K, ...ctx.K } : K)

// Phase of a fight from the health left: a boss has 2 (rage at RAGE_AT), a raid boss 3 (at two thirds, one third).
export function phaseOf(hpLeft, need, phases = 2, rageAt = RAGE_AT) {
  if (need <= 0) return 1
  const share = hpLeft / need
  if (phases >= 3) return share <= 1 / 3 ? 3 : share <= 2 / 3 ? 2 : 1
  return share <= rageAt ? 2 : 1
}

// The phase of a raid on its whole-day bar: `bar` = { total: the day's health, before: the damage earlier attempts
// dealt today, phases }, `damage` = this attempt's damage so far.
export const barPhase = (bar, damage) => phaseOf(Math.max(0, bar.total - (bar.before + damage)), bar.total, bar.phases || 3)

// `phaseFloor(bar, p)` = the health left (on the whole-day bar) at which phase p ENDS: the next phase line, 0 for the
// last phase. 3 phases = thirds of the day's health.
export function phaseFloor(bar, p) {
  const phases = bar.phases || 3
  if (p >= phases) return 0
  return (bar.total * (phases - p)) / phases // exact: phaseOf switches at hpLeft <= this (not an integer in general)
}

// A small stable hash (FNV-1a) for deterministic "random" picks: hash a card id, the answer count, a phase.
// Never Math.random in a fight (tests replay fights, and a reload must not change what the boss does).
export function hashOf(...parts) {
  let h = 0x811c9dc5
  const s = parts.map(String).join('|')
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0 }
  return h >>> 0
}

// "Clean" for an ability's own mechanics: a clean typed answer, OR a glancing one under Focus (a raid power: it "hits
// like a clean one", fight.js marks it res.focused before onStrike). Every module that pays a clean typed answer reads
// this, never ctx.clean alone, so Focus cracks Titan's plates, charges Moonmaw's moons, chains Cerberus's iron head.
export const hitClean = (ctx, res) => !!((ctx && ctx.clean) || (res && res.focused))
