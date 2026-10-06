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

import { DAMAGE, ATTACK_LIVES, MISS_LIVES, COMBO_EVERY, MAX_ATTACKS, ATTACK_GAP, RAGE_AT, WEAK_TO_MAX, MAX_INSERTED, phaseOf, barPhase, phaseFloor, hashOf } from './abilities/_rules'
import { abilityById, ABILITY_IDS } from './abilities'
import { gradeFromStrike, easeFor, isMature, GRADE_EASE } from '../../config/grading'

export { DAMAGE, ATTACK_LIVES, MISS_LIVES, COMBO_EVERY, MAX_ATTACKS, ATTACK_GAP, RAGE_AT, WEAK_TO_MAX, MAX_INSERTED, phaseOf, barPhase, phaseFloor, hashOf }

// The fight's state. `insertedN` = the ability-inserted questions put into this attempt so far (raidStep caps them at
// MAX_INSERTED). The zero counters after `chain` belong to the v1 raid abilities (ported unchanged into
// abilities/<motif>.js); a new ability keeps its state in `ab` (its module's init()).
export const newFight = () => ({ damage: 0, livesLost: 0, combo: 0, crits: 0, attacks: 0, blocked: 0, answers: 0, clean: 0, glancing: 0, safe: 0, misses: 0, shieldUsed: false, last: null, n: 0, insertedN: 0,
  chain: 0, triples: 0, bounces: 0, cuts: 0, unredeemed: [], risen: false, judged: 0, judgedRight: 0, smites: 0,
  surge: false, surfaced: 0, kindled: 0, rewound: [], pacts: 0, bolts: 0, reflects: 0, gorged: 0, snaps: 0, lastBreaths: 0,
  rights: 0, stings: 0, perfects: 0, crumbles: 0, crescendos: 0, harvests: 0, slumbers: 0, novas: [], stolen: 0, steals: 0, starfires: 0, eyes: 0, gazes: 0, coins: 0, loots: 0,
  sugar: 0, rush: 0, rushes: 0, sugared: 0, crashes: 0 })

// RAID BOSS ABILITIES live in abilities/<motif>.js: one pure module per raid boss, picked up by abilities/index.js
// (the hook contract is abilities/_contract.js). Each changes how the FIGHT plays, never how a question is asked: no
// timers, nothing hidden, a right answer is never marked wrong. strike() runs the base rules, then the module's hooks.
export const ABILITIES = ABILITY_IDS
export const abilityOf = (ability) => abilityById(ability)

// The ability's own state (fight.ab), made by its init() the first time it is needed.
export function abilityState(state, mod, ctx = {}) {
  if (!mod) return (state && state.ab) || {}
  if (state && state.ab) return state.ab
  return mod.init ? mod.init({ phase: 1, ...ctx, K: mod.K || {} }) || {} : {}
}

// A working copy of the fight for the hooks: `ab` shallow-copied, a phase change announced (onPhase).
function workCopy(state, mod, ctx) {
  const s = { ...state, n: state.n + 1, unredeemed: [...(state.unredeemed || [])], chain: state.chain || 0 }
  if (mod) {
    s.ab = { ...abilityState(state, mod, ctx) }
    const seen = state.phaseSeen
    if (seen != null && ctx.phase > seen && mod.onPhase) mod.onPhase(s, ctx.phase, ctx)
    s.phaseSeen = Math.max(seen || 0, ctx.phase)
  }
  return s
}

const newRes = () => ({ dmg: 0, lives: 0, heal: 0, gorge: 0, crit: false, fx: '', fxVars: null })

// Apply a filled `res` to the copy: damage, lives, the boss's heal (floored at what this attempt dealt), the phase
// line it may cross (onPhase), and `last` (what the arena plays).
function applyRes(s, res, mod, ctx, extra) {
  res.dmg = Math.max(0, Number(res.dmg) || 0)
  res.gorge = Math.max(0, Math.min(Number(res.gorge) || 0, s.damage + res.dmg))
  res.lives = Math.max(0, Number(res.lives) || 0)
  s.damage += res.dmg - res.gorge
  s.livesLost = Math.max(0, s.livesLost + res.lives - (res.heal || 0))
  if (mod && ctx.bar) {
    const after = barPhase(ctx.bar, s.damage)
    if (after > (s.phaseSeen || ctx.phase)) {
      if (mod.onPhase) mod.onPhase(s, after, { ...ctx, phase: after })
      s.phaseSeen = after
    }
  }
  const kind = res.dmg > 0 ? 'hit' : res.lives > 0 ? 'miss' : 'block'
  s.last = { kind, damage: res.dmg, lives: res.lives, crit: !!res.crit, shielded: !!res.shielded, attack: false, fx: res.fx || '', fxVars: res.fxVars || null,
    rise: res.fx === 'rise', n: s.n, healed: res.heal || 0, gorged: res.gorge, ...extra }
  return s
}

const baseCtx = (state, mod, opts, kind) => {
  const { shield = false, need = Infinity, lives = Infinity, bar = null } = opts
  const phase = opts.phase != null ? opts.phase : bar ? barPhase(bar, state.damage) : 1
  const livesLost = state.livesLost || 0
  return { kind, phase, need, lives, livesLost, lastLife: lives - livesLost === 1, shieldReady: shield && !state.shieldUsed, bar, dayAb: opts.dayAb || null, before: state, K: (mod && mod.K) || {} }
}

// One answer. hit = { verdict: 'clean'|'glancing'|'miss', mode: 'typed'|'choice', weak?: bool, attack?: bool,
// inserted?: kind (a question an ability put in: 'lastStand', 'minion'...), lastStand?: bool (= inserted
// 'lastStand'), key?: the card it asked, armed?: { toggleId: true } (the ability toggles armed for this answer) }.
// opts: `shield` (the learner holds a shield: it absorbs the first life a fight would take, once), `ability` (a raid
// boss's ability id), `phase` (the fight's phase BEFORE this answer), `need` (its health), `lives` (the fight's
// lives), `bar` ({ total, before, phases }: a raid's whole-day bar, so an ability sees its phase lines), `dayAb` (what
// the ability saved from today's earlier attempts: its dayState, read by init as ctx.dayAb).
export function strike(state, hit, opts = {}) {
  const mod = abilityById(opts.ability)
  const right = hit.verdict === 'clean' || hit.verdict === 'glancing'
  const inserted = hit.inserted || (hit.lastStand ? 'lastStand' : '')
  const kind = inserted ? 'inserted' : hit.attack ? 'attack' : 'normal'
  const ctx = { ...baseCtx(state, mod, opts, kind), inserted, right, clean: right && hit.mode !== 'choice' && hit.verdict === 'clean' }
  const s = workCopy(state, mod, ctx)
  const key = hit.key == null ? null : String(hit.key)
  const res = newRes()
  if (inserted) {
    // A question an ability put in (the Lich's last stand...): a miss costs one life unless the ability says otherwise.
    if (!right) res.lives = MISS_LIVES
  } else if (hit.attack) {
    // An attack: a block counters, a miss hurts twice. It never builds or breaks a combo.
    if (right) { s.blocked++; res.dmg = DAMAGE.counter } else res.lives = mod && mod.attackLives ? mod.attackLives(s, ctx) : ATTACK_LIVES
  } else {
    s.answers++
    if (!right) {
      res.lives = MISS_LIVES; s.misses++; s.combo = 0; s.chain = 0
    } else if (hit.mode === 'choice') {
      res.dmg = DAMAGE.choice; s.safe++; s.combo = 0
    } else if (hit.verdict === 'glancing') {
      res.dmg = DAMAGE.glancing; s.glancing++; s.combo = 0
    } else {
      res.dmg = DAMAGE.clean; s.clean++; s.combo++
      if (!(mod && mod.noCrit) && s.combo % COMBO_EVERY === 0) { res.dmg += DAMAGE.crit; res.crit = true; s.crits++ }
    }
    if (right && hit.weak) res.dmg += DAMAGE.weak
    if (right) { s.chain++; s.rights = (s.rights || 0) + 1 }
  }
  // A missed card stays unredeemed until it is answered right again (when it comes back as an attack or is inserted).
  if (key != null) {
    if (!right && !s.unredeemed.includes(key)) s.unredeemed.push(key)
    if (right && kind !== 'normal' && s.unredeemed.includes(key)) s.unredeemed = s.unredeemed.filter((k) => k !== key)
  }
  if (mod && mod.onStrike) mod.onStrike(s, res, hit, ctx)
  res.lives = Math.max(0, Number(res.lives) || 0)
  if (res.lives > 0 && opts.shield && !s.shieldUsed) { res.lives--; s.shieldUsed = true; res.shielded = true }
  if (res.lives > 0 && mod && mod.onLifeLoss) mod.onLifeLoss(s, res, ctx)
  return applyRes(s, res, mod, ctx, { attack: !!hit.attack, inserted })
}

// A player action between questions (an ability's button: Vent, Buy...). Never costs lives. Same opts as strike.
export function act(state, action, opts = {}) {
  const mod = abilityById(opts.ability)
  if (!mod || !mod.act) return state
  const ctx = baseCtx(state, mod, opts, 'action')
  const s = workCopy(state, mod, ctx)
  const res = newRes()
  mod.act(s, res, action || {}, ctx)
  res.lives = 0
  return applyRes(s, res, mod, ctx, { action: (action && action.type) || '' })
}

// The questions ran out (or the raid was left): an ability holding damage (a bank, a gauge, moons in orbit) lets it
// go. The state comes back unchanged when nothing is held.
export function settleFight(state, opts = {}) {
  const mod = abilityById(opts.ability)
  if (!mod || !mod.settle) return state
  const ctx = baseCtx(state, mod, opts, 'settle')
  const s = workCopy(state, mod, ctx)
  const res = newRes()
  mod.settle(s, res, ctx)
  if (!(res.dmg > 0) && !res.fx) return state
  res.lives = 0
  return applyRes(s, res, mod, ctx, { settle: true })
}

// 'won' | 'lost' | '' for health `need` and `lives`.
export const fightOutcome = (state, { need, lives }) => (state.damage >= need ? 'won' : state.livesLost >= lives ? 'lost' : '')
export const healthLeft = (state, need) => Math.max(0, need - state.damage)
export const livesLeft = (state, lives) => Math.max(0, lives - state.livesLost)

// Where an attack goes: `gap` (ATTACK_GAP) questions after `idx` (or the end), never beyond the list.
export const attackSlot = (idx, total, gap = ATTACK_GAP) => Math.min(total, idx + 1 + gap)
// The questions between a miss and its returning attack against this ability (its module's attackGap).
export function attackGapFor(ability, state) {
  const mod = abilityById(ability)
  if (!mod || !mod.attackGap) return ATTACK_GAP
  return mod.attackGap({ ...(state || {}), ab: abilityState(state, mod) }, { K: mod.K || {} })
}
// The lives a missed attack costs against this ability (its banner says so).
export function attackLivesFor(ability, state) {
  const mod = abilityById(ability)
  if (!mod || !mod.attackLives) return ATTACK_LIVES
  return mod.attackLives({ ...(state || {}), ab: abilityState(state, mod) }, { K: mod.K || {} })
}
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

// A raid card's Anki rating from its FIRST answer, by the shared one-answer rule (config/grading.js): a miss Again, a
// glancing strike Hard, a clean typed strike Good (Easy when the card is already mature: Anki interval >= 21 days),
// a choice (the safe strike) at most Good. `sched` = the card's pre-review schedule ({ interval } in days).
export const RAID_EASE = GRADE_EASE
export function raidRating(hit, sched = null) {
  if (!hit) return { ease: RAID_EASE.again, rating: 'again' }
  // `aided`: a raid power (50:50, hint) helped with the question: graded like a hint (a right answer is Hard).
  const rating = gradeFromStrike(hit.verdict, { choice: hit.mode === 'choice', mature: isMature(sched?.interval), hintUsed: !!hit.aided })
  return { ease: easeFor(rating), rating }
}

// ── Second looks: the background re-check and the learner's appeal (kit/fightJudge.js) ─────────────────────────
// An answer judged a miss or glancing is looked at again; when it was right after all, the fight gives back what the
// verdict cost and deals what the answer should have dealt. `cost` = what the first verdict really did to the fight:
// { lives: the lives it took (after a shield or an ability), damage: what it dealt }. `kind` = 'normal' | 'attack' |
// 'inserted' (the question asked), `mode` = 'typed' | 'choice', `weak` = an item the boss is weak to.
// → { lives: lives to give back, damage: damage still due } (both >= 0). An ability's own state (a hydra's new heads,
// a crashed sugar jar) is left as it is: only hearts and damage are put right, never a combo or a critical.
export function refundFor({ kind = 'normal', to = 'clean', mode = 'typed', weak = false } = {}, cost = {}) {
  const right = to === 'clean' || to === 'glancing'
  const lives = Math.max(0, Number(cost.lives) || 0)
  if (!right) return { lives: 0, damage: 0 }
  let due = 0
  if (kind === 'attack') due = DAMAGE.counter
  else if (kind === 'normal') due = (mode === 'choice' ? DAMAGE.choice : to === 'clean' ? DAMAGE.clean : DAMAGE.glancing) + (weak ? DAMAGE.weak : 0)
  return { lives, damage: Math.max(0, due - Math.max(0, Number(cost.damage) || 0)) }
}

// Apply a refund to a running fight (the caller checks it is still running: fightOutcome ''). `from`/`to` = the
// verdicts, so the counters (misses, clean, glancing) tell the truth. `last` becomes { kind: 'refund' } with its own
// counter (refundN): the arena plays the heart flying back and a sheepish boss, never a new hit or lunge.
export function applyRefund(state, { lives = 0, damage = 0, from = 'miss', to = 'clean', kind = 'normal' } = {}) {
  const s = { ...state }
  const back = Math.max(0, Math.min(Number(lives) || 0, s.livesLost || 0))
  const dealt = Math.max(0, Number(damage) || 0)
  s.livesLost = (s.livesLost || 0) - back
  s.damage = (s.damage || 0) + dealt
  if (kind === 'normal') {
    if (from === 'miss') s.misses = Math.max(0, (s.misses || 0) - 1)
    if (from === 'glancing') s.glancing = Math.max(0, (s.glancing || 0) - 1)
    if (to === 'clean') s.clean = (s.clean || 0) + 1
    else if (to === 'glancing' && from !== 'glancing') s.glancing = (s.glancing || 0) + 1
  }
  s.refunds = (s.refunds || 0) + 1
  s.refundN = (s.refundN || 0) + 1
  s.last = { kind: 'refund', refund: true, damage: dealt, lives: 0, healedLives: back, n: s.n, rn: s.refundN, fx: '', fxVars: null, crit: false, shielded: false, attack: false }
  return s
}

// An overturned answer (entry: { kind, mode, weak, first, cost }) against the RUNNING fight `state` with its odds
// ({ need, lives }): the fight with the refund applied, or null when nothing changes (the fight is decided, or the
// verdict cost nothing). Callers check the fight is still running at all (their phase) and the refund switch
// (fightCheck.js FIGHT_EXTRAS.refund).
export function refundRunningFight(state, odds, entry = {}, to = 'clean') {
  if (!state || !odds || fightOutcome(state, odds)) return null
  const r = refundFor({ kind: entry.kind, to, mode: entry.mode, weak: !!entry.weak }, entry.cost || {})
  if (!r.lives && !r.damage) return null
  return applyRefund(state, { ...r, from: entry.first, to, kind: entry.kind })
}

// What a verdict did to the fight, from the states around the strike (for refundFor).
export const strikeCost = (before, after) => ({ lives: Math.max(0, (after?.livesLost || 0) - (before?.livesLost || 0)), damage: Math.max(0, (after?.damage || 0) - (before?.damage || 0)) })
