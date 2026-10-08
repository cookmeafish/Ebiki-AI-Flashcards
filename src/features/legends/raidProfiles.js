// RAID BOSS PROFILES (pure, tested by profiles.test.js and tuning.test.js): each raid boss's own fight, crafted like
// its ability.
//   hp      the boss's health (set, never from the cards due: a run is only a slice of the siege)
//   hearts  the player's hearts against it (carried across runs, full again each new day and for a new boss)
//   heal    health the boss gets back each new day (flat: a big boss never heals a huge chunk)
//   rules   (optional) fight-rule overrides for this boss (abilities/_rules.js FIGHT_RULES: damage, attackGap...)
//   k       (optional) overrides of its ability's tuning (abilities/<motif>.js K)
//   variants (optional) { <variant>: layer }: this boss's own changes in a variant (on top of RAID_VARIANTS)
// FAIRNESS (the owner's rule): a bigger boss always comes with more hearts, or an ability that protects the player
// (Chronos' sand, the Seraph's Mercy, the Vampire's wards, the Ophanim's grace). Bosses whose ability punishes misses
// (Hydra's heads, the Berserker's axe, the Lich's minions) get more hearts. profiles.test.js simulates every boss with
// its own ability: a 65% learner beats each one in a handful of runs, a 60% learner still beats them all, and later
// bosses take more runs than earlier ones. Tune the numbers here and run that test.
//
// THE RESOLVER: raidProfile(motif, variant = 'normal') is the ONE place a raid fight's numbers come from. It returns
// { motif, variant, ability, hp, hearts, heal, rules, k } built in layers: defaults (DEFAULT_PROFILE, FIGHT_RULES, the
// ability module's K) -> the boss's RAID_PROFILES entry -> RAID_VARIANTS[variant] -> the boss's own variants[variant].
// A layer value is a number (set), { mul: x } (multiply) or { add: n } (add), nested the same way (rules.damage.clean,
// k.grow). Integer numbers stay integers (rounded). An unknown variant reads as 'normal'. Nothing else holds per-boss
// numbers: raid.js (bossHp, siege), RaidRun, the hero card, Help and the simulator all read this.
import { FIGHT_RULES } from './abilities/_rules'
import { abilityForMotif } from './abilities'

export const RAID_PROFILES = {
  chronos: { hp: 30, hearts: 4, heal: 3 },
  banshee: { hp: 34, hearts: 4, heal: 3 },
  seraph: { hp: 38, hearts: 4, heal: 3 },
  titan: { hp: 55, hearts: 6, heal: 4 },
  vampire: { hp: 40, hearts: 4, heal: 4 },
  gorgon: { hp: 42, hearts: 4, heal: 4 },
  chimera: { hp: 60, hearts: 6, heal: 4 },
  ratking: { hp: 48, hearts: 5, heal: 4 },
  showman: { hp: 50, hearts: 5, heal: 4 },
  reaper: { hp: 60, hearts: 5, heal: 4 },
  leviathan: { hp: 70, hearts: 6, heal: 5 },
  lich: { hp: 56, hearts: 6, heal: 4 },
  cerberus: { hp: 64, hearts: 6, heal: 4 },
  tempest: { hp: 66, hearts: 6, heal: 5 },
  dreamer: { hp: 70, hearts: 6, heal: 3 },
  berserker: { hp: 50, hearts: 5, heal: 4 },
  inferno: { hp: 78, hearts: 7, heal: 5 },
  swarmqueen: { hp: 76, hearts: 7, heal: 5 },
  moonmaw: { hp: 80, hearts: 7, heal: 5 },
  hydra: { hp: 86, hearts: 8, heal: 6, variants: { nightmare: { k: { grow: 3 } } } }, // nightmare: a miss grows 3 heads
  kaleido: { hp: 84, hearts: 7, heal: 5 },
  puppeteer: { hp: 88, hearts: 7, heal: 5 },
  sugarqueen: { hp: 78, hearts: 7, heal: 4 },
  kitsune: { hp: 94, hearts: 8, heal: 5 },
  ophanim: { hp: 98, hearts: 7, heal: 5 },
  void: { hp: 120, hearts: 9, heal: 6 },
}
// A boss without a profile (a newer build's boss read by this one): a middling fight.
export const DEFAULT_PROFILE = { hp: 50, hearts: 5, heal: 4 }
// The most hearts any (normal) profile gives (stored hearts are clamped to it, or the variant's own number if higher).
export const MAX_HEARTS = Math.max(...Object.values(RAID_PROFILES).map((p) => p.hearts))

// VARIANTS: a global modifier applied to every boss (then the boss's own `variants` entry). 'normal' is the identity.
// None is wired into the UI or stored state yet: a siege may carry `variant` (absent = normal), and raidProfile reads
// it. EXAMPLE nightmare: a bigger boss that heals more, one heart fewer, misses hurt more and crits come rarer.
export const RAID_VARIANTS = {
  normal: {},
  nightmare: {
    hp: { mul: 1.5 }, heal: { mul: 1.5 }, hearts: { add: -1 },
    rules: { comboEvery: 4, attackGap: 2, rallyShare: 0.75 },
  },
}
// Floors no layer can push below (a fight must stay a fight).
const FLOOR = { hp: 1, hearts: 1, heal: 0 }

const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v)
const isOp = (v) => isObj(v) && (typeof v.mul === 'number' || typeof v.add === 'number')
function applyOp(base, v) {
  if (typeof v === 'number') return v
  const b = Number(base) || 0
  const out = typeof v.mul === 'number' ? b * v.mul : b + v.add
  return Number.isInteger(b) ? Math.round(out) : out
}
// One layer over `base` (pure: returns a new object). Keys absent from the layer keep the base.
export function applyLayer(base, layer) {
  if (!isObj(layer)) return base
  const out = { ...base }
  for (const [key, v] of Object.entries(layer)) {
    if (key === 'variants') continue
    if (typeof v === 'number' || isOp(v)) out[key] = applyOp(base ? base[key] : 0, v)
    else if (isObj(v)) out[key] = applyLayer(isObj(base && base[key]) ? base[key] : {}, v)
    else if (v !== undefined) out[key] = v
  }
  return out
}

// THE RESOLVER (see the header). The result is frozen (never mutate it).
export const raidVariant = (variant) => (typeof variant === 'string' && Object.prototype.hasOwnProperty.call(RAID_VARIANTS, variant) ? variant : 'normal')
export function raidProfile(motif, variant = 'normal') {
  const v = raidVariant(variant)
  const mod = abilityForMotif(motif)
  const own = RAID_PROFILES[motif] || null
  let p = { ...DEFAULT_PROFILE, rules: FIGHT_RULES, k: { ...((mod && mod.K) || {}) } }
  for (const layer of [own, RAID_VARIANTS[v], own && own.variants && own.variants[v]]) p = applyLayer(p, layer)
  for (const [f, min] of Object.entries(FLOOR)) p[f] = Math.max(min, Number(p[f]) || 0)
  return Object.freeze({ motif, variant: v, ability: (mod && mod.id) || '', hp: p.hp, hearts: p.hearts, heal: p.heal,
    rules: Object.freeze({ ...p.rules, damage: Object.freeze({ ...p.rules.damage }) }), k: Object.freeze({ ...p.k }) })
}
