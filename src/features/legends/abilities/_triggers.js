// WHEN DOES EACH EFFECT HAPPEN (the bestiary text of every raid ability, pure). One entry per fx key of every active
// raid boss: `vars(K)` fills the {placeholders} of its two texts from the module's own tuning constants, so the numbers
// on screen are always the ones the fight uses; `choice: true` marks an effect the PLAYER sets off with a button.
//   lg_fxWhen_<motif>_<fx>  what the player does (or what happens to them), first
//   lg_fxDoes_<motif>_<fx>  what it does to the fight
// abilities/triggers.test.js drives every entry through fight.js with the exact situation the text names (and a near
// miss that must NOT fire it), and fails when a module gains an fx key without an entry here.
import { ABILITY_BY_MOTIF, abilityById } from './index'

const none = () => ({})

export const TRIGGERS = {
  hydra: {
    sever: { vars: none },
    grow: { vars: (K) => ({ n: K.grow, max: K.max }) },
    cauterize: { vars: (K) => ({ n: K.burn, base: K.base }) },
  },
  titan: {
    crack: { vars: (K) => ({ n: K.plates }) },
    shatter: { vars: (K) => ({ n: K.shatter }) },
    exposedHit: { vars: (K) => ({ n: K.exposed, w: K.window }) },
  },
  lich: {
    raise: { vars: (K) => ({ n: K.every, max: K.max }) },
    burst: { vars: (K) => ({ n: K.burst }) },
    escape: { vars: (K) => ({ n: K.heal }) },
  },
  chimera: {
    maul: { vars: none },
    aim: { vars: none, choice: true },
    fallGoat: { vars: (K) => ({ n: K.fall }) },
    fallLion: { vars: (K) => ({ n: K.fall, b: K.lion }) },
    fallSerpent: { vars: (K) => ({ n: K.fall, b: K.serpent }) },
    goatBlock: { vars: none },
  },
  void: {
    absorb: { vars: none },
    collapse: { vars: (K) => ({ n: K.every }) },
    spill: { vars: none },
  },
  seraph: {
    wrath: { vars: (K) => ({ n: K.wrath }) },
    grace: { vars: (K) => ({ n: K.grace }) },
    mercy: { vars: none },
  },
  leviathan: {
    row: { vars: none },
    crest: { vars: (K) => ({ n: K.crest }) },
    surf: { vars: (K) => ({ n: K.crest }) },
    pulled: { vars: (K) => ({ n: K.drop }) },
    wipeout: { vars: (K) => ({ n: K.drop }) },
  },
  inferno: {
    heat: { vars: none },
    cool: { vars: (K) => ({ n: K.cool }) },
    vent: { vars: (K) => ({ h: K.ventMin, n: K.ventMin - 1 }), choice: true },
    blast: { vars: (K) => ({ h: K.bigVent + 1 }), choice: true },
    erupt: { vars: (K) => ({ h: K.max, n: K.erupt }) },
  },
  chronos: {
    rewind: { vars: (K) => ({ n: K.gap }) },
    paradox: { vars: (K) => ({ n: K.paradox }) },
    grain: { vars: (K) => ({ n: K.every, max: K.max }) },
    overflow: { vars: none },
    timestop: { vars: none },
  },
  vampire: {
    drip: { vars: (K) => ({ n: K.streak }) },
    ward: { vars: (K) => ({ n: K.streak, max: K.max }) },
    burst: { vars: (K) => ({ n: K.burst }) },
    feast: { vars: (K) => ({ n: K.streak, d: K.feast }) },
  },
  tempest: {
    drum: { vars: none },
    dud: { vars: none },
    thunder: { vars: (K) => ({ n: K.per }) },
  },
  kaleido: {
    shard: { vars: none },
    prism: { vars: (K) => ({ n: K.burst }) },
    overcharge: { vars: (K) => ({ n: K.over }) },
  },
  puppeteer: {
    steal: { vars: (K) => ({ n: K.every, max: K.max }) },
    kick: { vars: (K) => ({ n: K.kick }) },
    yank: { vars: none },
  },
  berserker: {
    cleave: { vars: (K) => ({ n: K.cleave, r: K.rest }), choice: true },
    whiff: { vars: (K) => ({ n: K.extra, r: K.rest }), choice: true },
    taunt: { vars: (K) => ({ n: K.taunt }) },
  },
  swarmqueen: {
    ignite: { vars: (K) => ({ n: 1 + K.spread }) },
    douse: { vars: none },
    ablaze: { vars: (K) => ({ n: K.cells, d: K.blaze }) },
  },
  gorgon: {
    charge: { vars: (K) => ({ n: K.every, m: K.every3 }) },
    reflect: { vars: (K) => ({ n: K.reflect, h: K.half }) },
    stoned: { vars: none },
  },
  banshee: {
    wail: { vars: none },
    shatter: { vars: (K) => ({ n: K.shatter }) },
  },
  reaper: {
    climb: { vars: (K) => ({ n: K.climb }) },
    reap: { vars: none },
  },
  dreamer: {
    deeper: { vars: (K) => ({ n: K.depth }) },
    nightmare: { vars: (K) => ({ n: K.depth, d: K.nightmare }) },
    wake: { vars: none },
    hum: { vars: none },
    lullaby: { vars: (K) => ({ n: K.need, d: K.lull }) },
  },
  moonmaw: {
    charge: { vars: (K) => ({ n: K.every }) },
    launch: { vars: (K) => ({ n: K.every }) },
    impact: { vars: (K) => ({ n: K.delay, d: K.hit }) },
  },
  kitsune: {
    volley: { vars: none },
    starfall: { vars: (K) => ({ n: K.at, d: K.starfall }) },
    caught: { vars: none },
  },
  ophanim: {
    open: { vars: (K) => ({ a: K.perPhase, b: K.perPhase * 2, c: K.perPhase * 3 }) },
    blink: { vars: none },
    grace: { vars: none },
    beam: { vars: (K) => ({ n: K.beam }) },
  },
  ratking: {
    loot: { vars: none },
    stolen: { vars: none },
    bomb: { vars: (K) => ({ n: K.bomb, cap: K.cap, d: K.bombDmg }), choice: true },
    buyTail: { vars: (K) => ({ n: K.tail }), choice: true },
    tail: { vars: none },
  },
  sugarqueen: {
    cube: { vars: none },
    rush: { vars: (K) => ({ n: K.jar, r: K.rush }) },
    sweet: { vars: (K) => ({ n: K.bonus }) },
    crash: { vars: none },
  },
  showman: {
    laugh: { vars: none },
    encore: { vars: (K) => ({ n: K.laughs, d: K.encore }) },
    tear: { vars: none },
    twist: { vars: (K) => ({ n: K.tears }) },
  },
}

// What the bestiary shows for one effect: its two text keys, their vars (from the live K) and whether it is a choice.
export function triggerOf(motif, fx) {
  const entry = TRIGGERS[motif] && TRIGGERS[motif][fx]
  if (!entry) return null
  const mod = ABILITY_BY_MOTIF[motif]
  return { whenKey: `lg_fxWhen_${motif}_${fx}`, doesKey: `lg_fxDoes_${motif}_${fx}`, vars: entry.vars((mod && mod.K) || {}), choice: !!entry.choice }
}

// The bestiary card's "How it works" rows for a raid boss (AssetView.jsx AbilityCard draws them): one per effect the
// ability module names (its fxKeys, in its order) that has an entry here. → [{ fx, tr }] (tr = triggerOf).
export function bestiaryRows(motif, ability) {
  const keys = abilityById(ability)?.fxKeys || []
  return keys.map((fx) => ({ fx, tr: triggerOf(motif, fx) })).filter((r) => r.tr)
}
