// RAID POWERS (pure, tested by powers.test.js): tools the player brings into raid fights. Raids only.
// RULES (the owner's, 2026-10): a power is UNLOCKED for good by beating DIFFERENT raid bosses (beating one boss twice
// counts once) and never runs out; before a fight the player picks up to LOADOUT_MAX of the unlocked ones to bring
// (features.legends.raidLoadout), and each one brought works ONCE PER FIGHT (a fight = one run; "Continue?" keeps the
// same fight, "Fight again" starts a new one). The Bandage is used between runs, once a day. One power per question.
// Bosses are balanced WITHOUT powers, so a power only ever makes a fight easier. Anki stays honest: a power that helps
// with the QUESTION (50:50, hint) records a right answer as Hard (it is graded like a hint); the others change only
// the fight.
//   unlock   different raid bosses beaten needed to unlock it (the roster has 26: the last one unlocks with all of them)
//   kind     aid (helps with the question) | survival (hearts) | offense (damage) | siege (between runs) | passive
//            (works by being brought, no button)
//   normal   only on a raid's own question (never on an attack or a question an ability inserted)
//   window   lasts POWER_WINDOW raid questions (counted from the one it is used on), else spent by its one effect
// PROGRESSION (docs/raid-powers-guide.md): early powers save ONE heart or help ONE question; mid ones add damage or
// stop a heal; late ones last a 3-question window or change the whole fight, because late bosses are 2 to 4 times
// bigger. A window power still needs RIGHT answers to do anything (no power ever turns a wrong answer right).
import { DAMAGE } from './abilities/_rules'

export const POWERS = {
  shield: { icon: '🛡', kind: 'survival', unlock: 1, normal: false },
  fifty: { icon: '✂', kind: 'aid', unlock: 3, normal: true },
  wind: { icon: '❤️', kind: 'survival', unlock: 5, normal: false },
  sharpen: { icon: '⚔', kind: 'offense', unlock: 8, normal: true },
  hint: { icon: '📜', kind: 'aid', unlock: 11, normal: true },
  bandage: { icon: '🩹', kind: 'siege', unlock: 13, normal: false },
  focus: { icon: '🎯', kind: 'offense', unlock: 15, normal: true, window: true },
  siphon: { icon: '🩸', kind: 'survival', unlock: 17, normal: true, window: true },
  ward: { icon: '🔰', kind: 'survival', unlock: 19, normal: false },
  momentum: { icon: '🔥', kind: 'offense', unlock: 21, normal: true, window: true },
  fury: { icon: '💢', kind: 'offense', unlock: 23, normal: true, window: true },
  steadfast: { icon: '⚓', kind: 'passive', unlock: 26, normal: false },
}
export const POWER_IDS = Object.keys(POWERS)
// How many powers one fight may bring; Sharpen's extra damage; a window power's length in raid questions; Steadfast's
// extra hearts (lost first, gone after the fight); Fury's damage multiplier.
export const LOADOUT_MAX = 3
export const SHARPEN_BONUS = 2
export const POWER_WINDOW = 3
export const STEADFAST_HEARTS = 2
export const FURY_MULT = 2
// Hearts Second wind gives back at once; hearts Siphon gives back per clean answer in its window.
export const WIND_HEARTS = 1
export const SIPHON_HEARTS = 1
// Momentum's crits deal this many times the usual crit bonus.
export const MOMENTUM_CRIT_MULT = 2
// A Shield takes this many lost hearts (once); a Bandage skips this many nights of the boss's heal.
export const SHIELD_HEARTS = 1
export const BANDAGE_NIGHTS = 1

// THE POWER NUMBERS AS ONE OBJECT (the constants above are these numbers), so a raid variant can weaken or strengthen
// powers like it changes a boss: raidProfiles.js raidProfile(motif, variant) resolves `powers` in the same layers
// (defaults here -> the boss -> RAID_VARIANTS[variant] -> the boss's own variant), and the fight carries the result
// as `fight.tune.powers` (fight.js tuneFight). The engine reads powersOf(fight); the screens and Help read the
// profile's `powers`, so every number shown follows the variant. Keys:
//   loadoutMax  powers one fight may bring; window: a window power's length in raid questions
//   sharpen     Sharpen's extra damage; fury: Fury's damage multiplier; momentumCrit: Momentum's crit multiplier
//   siphon      hearts Siphon gives back per clean answer; wind: hearts Second wind gives back
//   steadfast   Steadfast's extra hearts; shield: hearts a Shield takes; bandage: nights of heal a Bandage skips
export const POWER_DEFAULTS = Object.freeze({
  loadoutMax: LOADOUT_MAX, window: POWER_WINDOW, sharpen: SHARPEN_BONUS, fury: FURY_MULT, momentumCrit: MOMENTUM_CRIT_MULT,
  siphon: SIPHON_HEARTS, wind: WIND_HEARTS, steadfast: STEADFAST_HEARTS, shield: SHIELD_HEARTS, bandage: BANDAGE_NIGHTS,
})
// Floors no variant can push below (a window lasts at least one question, Fury never shrinks a hit).
export const POWER_FLOORS = Object.freeze({ loadoutMax: 0, window: 1, sharpen: 0, fury: 1, momentumCrit: 0, siphon: 0, wind: 0, steadfast: 0, shield: 0, bandage: 0 })
// Power numbers shaped: known keys only, numbers only, floors held, missing ones from the defaults.
export function shapePowers(raw) {
  const out = { ...POWER_DEFAULTS }
  if (raw && typeof raw === 'object') {
    for (const k of Object.keys(POWER_DEFAULTS)) {
      const v = Number(raw[k])
      if (raw[k] != null && Number.isFinite(v)) out[k] = Math.max(POWER_FLOORS[k], v)
    }
  }
  return out
}
// The power numbers a fight runs on: its resolved `tune.powers` over the defaults (no tune = the defaults).
export function powersOf(state) {
  const p = state && state.tune && state.tune.powers
  return p ? shapePowers(p) : POWER_DEFAULTS
}
// THE NUMBERS A POWER'S TEXT SHOWS, from the power numbers (`P`: a profile's resolved `powers`, default the normal
// ones) and the fight's own damage table (`D`), never typed into a locale (the owner: change a number here or in a
// variant and every description, armed line and label follows). `{n}` in lg_powDesc_<id> / lg_powUp_<id> /
// lg_fxCast_<id> / lg_fxProc_<id> is filled from here.
export function powerVars(id, P = POWER_DEFAULTS, D = DAMAGE) {
  const p = P === POWER_DEFAULTS ? P : shapePowers(P)
  switch (id) {
    case 'fifty': case 'hint': return { n: D.choice }
    case 'wind': return { n: p.wind }
    case 'sharpen': return { n: p.sharpen }
    case 'focus': return { n: p.window }
    case 'siphon': return { n: p.window, hearts: p.siphon }
    case 'momentum': return { n: p.window, crit: D.crit * p.momentumCrit }
    case 'fury': return { n: p.window, mult: p.fury }
    case 'steadfast': return { n: p.steadfast }
    default: return {}
  }
}
// The numbers a power HIT's label shows (lg_fxProc_<id>): Siphon names the hearts it gave back.
export const procVars = (id, P = POWER_DEFAULTS, D = DAMAGE) => (id === 'siphon' ? { n: shapePowers(P).siphon } : powerVars(id, P, D))
// The powers pressed with a button during a fight (the rest work between runs or by being brought).
export const isFightPower = (id) => !!POWERS[id] && POWERS[id].kind !== 'siege' && POWERS[id].kind !== 'passive'

// Different raid bosses beaten (trophies by motif; a boss beaten twice counts once).
export const bossesBeaten = (state) => new Set((Array.isArray(state?.trophies) ? state.trophies : []).map((x) => x?.motif).filter((m) => typeof m === 'string' && m)).size
export const unlockedPowers = (beaten) => POWER_IDS.filter((id) => beaten >= POWERS[id].unlock)
// The next power to unlock (for the intro and the result screen): { id, beaten } or null.
export const nextUnlock = (beaten) => { const id = POWER_IDS.find((x) => POWERS[x].unlock > beaten); return id ? { id, beaten: POWERS[id].unlock } : null }

// THE LOADOUT: the powers brought into fights. From the setting (known, unlocked, no repeats, at most LOADOUT_MAX);
// no setting yet = the first LOADOUT_MAX unlocked. An explicit empty list stays empty (bringing none is a choice).
// `max`: the resolved loadoutMax (a variant may change it).
export function shapeLoadout(raw, beaten, max = LOADOUT_MAX) {
  const open = unlockedPowers(beaten)
  if (!Array.isArray(raw)) return open.slice(0, max)
  return [...new Set(raw)].filter((id) => open.includes(id)).slice(0, max)
}
// The loadout with one power toggled: removed when in it, added when there is room (else unchanged).
export function toggleLoadout(loadout, id, beaten, max = LOADOUT_MAX) {
  const cur = shapeLoadout(loadout, beaten, max)
  if (cur.includes(id)) return cur.filter((x) => x !== id)
  if (!unlockedPowers(beaten).includes(id) || cur.length >= max) return cur
  return [...cur, id]
}

// WHEN A POWER CAN BE USED on the question on screen (RaidRun shows only these). `q`: the question (its flags),
// `asChoice`: it is shown as choices, `phase`: QuizRunner's ('answer' only), `loadout`: the powers brought, `used`:
// the ones this fight already used, `usedOnQ`: a power already used on this question, `livesLost`: this fight's,
// `armed`: the powers armed now ({ shield, sharpen, ward } true, window powers: questions left).
export function powerUsable(id, { q = {}, asChoice = false, phase = 'answer', loadout = [], used = [], usedOnQ = false, livesLost = 0, armed = {} } = {}) {
  const p = POWERS[id]
  if (!p || !isFightPower(id) || phase !== 'answer' || !loadout.includes(id) || used.includes(id) || usedOnQ) return false
  const reask = !!(q._attack || q._inserted || q._lastStand)
  if (p.normal && reask) return false
  // On the typed question it opens two choices; with the choices already on screen it narrows them to two (it was
  // greyed out on every question for a player who answers with choices).
  if (id === 'fifty') return !!q.alt && Array.isArray(q.alt.choices) && q.alt.choices.length > 2
  if (id === 'hint') return !asChoice && q.kind !== 'choice' && !q.open && Array.isArray(q.accepted) && !!q.accepted[0]
  if (id === 'shield') return !armed.shield
  if (id === 'sharpen') return !armed.sharpen && !asChoice
  if (id === 'wind') return livesLost > 0
  // Ward is raised against the attack on screen (it would be wasted on anything else).
  if (id === 'ward') return !!q._attack && !armed.ward
  // A window power opens on a raid question; Fury pays only on typed answers, so not with choices on screen.
  if (id === 'fury') return !(armed.fury > 0) && !asChoice
  if (p.window) return !(armed[id] > 0)
  return false
}

// AFTER AN ANSWER: what the armed powers became and which one visibly did something (`proc`, for its flourish).
// `armed`: before the answer; `last`: the fight's last strike (its power flags); `kind`: 'normal' | 'attack' |
// 'inserted'. A Shield is spent when it takes a heart, a Sharpen when it lands, a Ward on the attack it was raised
// against; a window power counts down on every raid question (normal), whatever the answer.
export function powerAfterAnswer(armed = {}, { last = {}, kind = 'normal' } = {}) {
  const out = { ...armed }
  if (armed.shield && last?.shielded) out.shield = false
  if (armed.sharpen && last?.sharpened) out.sharpen = false
  if (armed.ward && kind === 'attack') out.ward = false
  if (kind === 'normal') for (const id of POWER_IDS) if (POWERS[id].window && armed[id] > 0) out[id] = armed[id] - 1
  const procs = [['fury', last?.fury], ['momentum', last?.momentum], ['focus', last?.focused], ['siphon', last?.siphoned], ['ward', last?.warded]]
  const hit = procs.find(([id, on]) => on && (armed[id] === true || armed[id] > 0))
  const changed = POWER_IDS.some((id) => (out[id] || false) !== (armed[id] || false))
  return { armed: out, changed, proc: hit ? hit[0] : null }
}

// THE POWERS FOR EBI'S HELP (plain English facts, raidHelpText): what was brought, what is used up this fight, what is
// up now (a window with its questions left). '' when nothing was brought.
export function powersHelpLine(loadout = [], used = [], armed = {}) {
  if (!loadout.length) return ''
  const one = (id) => {
    if (POWERS[id]?.kind === 'passive') return `${id} (always on this fight)`
    if (POWERS[id]?.kind === 'siege') return `${id} (between runs)`
    const up = armed[id] === true ? 'up now' : armed[id] > 0 ? `up now, ${armed[id]} question(s) left` : ''
    return `${id} (${up || (used.includes(id) ? 'used this fight' : 'ready')})`
  }
  return `Powers brought: ${loadout.map(one).join(', ')}.`
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
// The hint: the first HALF of every word of the answer, the rest as dots ("buenos días" → "bue··· dí··"). Never only
// the first letter: every typed question already carries that in its cue. A word of 2+ letters keeps one hidden.
export const powerHint = (ans) => String(ans || '').split(/(\s+)/).map((w) => {
  if (/^\s+$/.test(w)) return w
  const chars = [...w]
  const letters = chars.filter((ch) => /\p{L}/u.test(ch)).length
  const show = letters < 2 ? letters : Math.min(letters - 1, Math.max(2, Math.ceil(letters / 2)))
  let seen = 0
  return chars.map((ch) => (!/\p{L}/u.test(ch) ? ch : seen++ < show ? ch : '·')).join('')
}).join('')
