// RAIDS (pure, tested): an optional daily fight against a raid boss, made of the deck's DUE cards (Anki's own review
// stack, so every answer is recorded as a real review, win or lose). Harder than a Legends boss: health scales with
// the cards due, typed clean strikes are needed to win (choices deal 1 and only before phase 2), lives are few, and
// a raid boss has THREE phases.
//
// Why beat it: the boss keeps its wounds across the day's attempts (a loss still hurts it), a win is a trophy in the
// raid hall, XP and a streak freeze, and the next raid boss in the rotation comes out.
import { abilityForMotif, abilityById } from './abilities'
import { strike, barPhase, canAttack, attackSlot, attackGapFor, MAX_INSERTED } from './fight'

// THE ROSTER is append-only: a stored raid state's `boss` is an INDEX into it (older builds on a shared folder read
// the same indices), so a boss is never removed from it, only RETIRED. A retired boss is skipped by the rotation: a
// stored boss that is retired moves on to the next active one, and its old trophies are kept (shown generically).
export const RAID_ROSTER = ['hydra', 'titan', 'lich', 'chimera', 'void', 'seraph', 'leviathan', 'inferno', 'chronos', 'vampire', 'tempest', 'kaleido', 'glutton', 'puppeteer', 'berserker', 'swarmqueen', 'gorgon', 'banshee', 'reaper', 'dreamer', 'moonmaw', 'kitsune', 'ophanim', 'ratking', 'sugarqueen', 'showman', 'cerberus']
// Retired by the owner (2026-10, the Glutton: "i dont even like the concept"): no art, ability, texts or voice remain.
export const RAID_RETIRED = ['glutton']
// The bosses that exist (art, ability, lore, voice), in rotation order.
export const RAID_MOTIFS = RAID_ROSTER.filter((m) => !RAID_RETIRED.includes(m))
export const isRaidMotif = (m) => RAID_MOTIFS.includes(m)
// The first ACTIVE roster index at or after `i` (wrapping).
export function activeBossIndex(i) {
  const n = RAID_ROSTER.length
  const start = Number.isInteger(i) && i >= 0 ? i % n : 0
  for (let k = 0; k < n; k++) { const j = (start + k) % n; if (!RAID_RETIRED.includes(RAID_ROSTER[j])) return j }
  return 0
}
// Each raid boss fights its own way: its ability module abilities/<motif>.js (id -> the texts lg_ability_<id>...).
export const RAID_ABILITY = Object.fromEntries(RAID_MOTIFS.map((m) => [m, abilityForMotif(m)?.id || '']))
// minHp 7 with Math.floor (design v2.1): with round + 8, a 5-card raid answered all RIGHT by choices in phase 1, then
// typed (phase 2 forbids choices), dealt 1+1+1+2+2 = 7 of 8 and could not win.
export const RAID = { minCards: 5, maxCards: 15, hpPerCard: 1.5, minHp: 7, maxHp: 40, lives: 3, phases: 3 }

export const todayKey = (d = new Date()) => d.toLocaleDateString('en-CA')

// The boss's health for a day, set by the cards due at the day's first attempt (stable for the day).
export const raidHp = (due) => Math.max(RAID.minHp, Math.min(RAID.maxHp, Math.floor(Math.max(0, due) * RAID.hpPerCard)))

// Raid state per mode: { boss: index in RAID_ROSTER (never a retired one after shaping), day: { date, hp, damage, attempts } | null, trophies: [{ motif, date }] }
export const newRaidState = () => ({ boss: 0, day: null, trophies: [] })
export function shapeRaid(raw) {
  const s = raw && typeof raw === 'object' ? raw : {}
  const stored = Number.isInteger(s.boss) && s.boss >= 0 ? s.boss % RAID_ROSTER.length : 0
  const boss = activeBossIndex(stored)
  const moved = boss !== stored // a retired boss: the next one takes over today's wounds, not the old ability's state
  const d = s.day && typeof s.day === 'object' && typeof s.day.date === 'string' ? s.day : null
  const day = d ? { date: d.date, hp: Math.max(1, Number(d.hp) || RAID.minHp), damage: Math.max(0, Number(d.damage) || 0), attempts: Math.max(0, Number(d.attempts) || 0), won: !!d.won, ...(!moved && d.ab && typeof d.ab === 'object' && !Array.isArray(d.ab) ? { ab: d.ab } : {}) } : null
  // Every trophy is kept, a retired (or newer build's) boss too: the hall shows those generically (isRaidMotif).
  const trophies = (Array.isArray(s.trophies) ? s.trophies : []).filter((x) => x && typeof x.motif === 'string' && /^[a-z][a-z0-9-]{0,39}$/.test(x.motif) && typeof x.date === 'string').slice(-200)
  return { boss, day, trophies }
}
export const raidMotif = (state) => RAID_ROSTER[shapeRaid(state).boss]

// Today's fight: yesterday's wounds heal (a new day, a fresh boss at full health for today's due cards).
export function raidToday(state, date, due) {
  const s = shapeRaid(state)
  if (s.day && s.day.date === date) return s
  return { ...s, day: { date, hp: raidHp(due), damage: 0, attempts: 0, won: false } }
}

// An attempt ended with `damage` dealt. The wounds stay for the day; a win (health gone) adds a trophy and brings
// out the next boss (tomorrow). Returns { state, won, firstWin }.
// `dayAb`: the raid ability's state to keep for today's next attempt (its dayState: the Chimera's wounded heads).
export function applyRaidAttempt(state, date, damage, dayAb) {
  const s = shapeRaid(state)
  if (!s.day || s.day.date !== date) return { state: s, won: false, firstWin: false }
  const dealt = Math.max(0, Number(damage) || 0)
  const day = { ...s.day, damage: Math.min(s.day.hp, s.day.damage + dealt), attempts: s.day.attempts + 1, ...(dayAb && typeof dayAb === 'object' ? { ab: dayAb } : {}) }
  const won = day.damage >= day.hp
  if (!won || s.day.won) return { state: { ...s, day: { ...day, won: s.day.won || won } }, won, firstWin: false }
  const motif = RAID_ROSTER[s.boss]
  return {
    state: { boss: activeBossIndex(s.boss + 1), day: { ...day, won: true }, trophies: [...s.trophies, { motif, date }] },
    won: true, firstWin: true,
  }
}

// Due cards in Anki's order: learning cards first (they are due soonest), then reviews by due day, then the rest.
export function raidOrder(cards) {
  const rank = (c) => (Number(c.queue) === 1 || Number(c.queue) === 3 ? 0 : Number(c.queue) === 2 ? 1 : 2)
  return [...cards].sort((a, b) => rank(a) - rank(b) || (Number(a.due) || 0) - (Number(b.due) || 0))
}

// ONE RAID ANSWER, pure (RaidRun.record runs it, and so do the fairness tests in abilities/). `q` = the question
// answered (its flags: _attack, _inserted, _lastStand, _cardId), `info` = { verdict, mode, attackQ, aid } (attackQ: the
// judge's follow-up for a glancing answer's slip, or { pending: aid } while it is still being written). Returns { next, groups }: the new fight state and the questions to
// put into the run, each group { insert: [questions], at } (RaidRun hands QuizRunner one group per answer).
//   need: this attempt's health (the day's health left), dayHp: the whole day's health, dayBefore: the damage earlier
//   attempts dealt today, dayAb: the ability's saved day state (raid day.ab), pos: the index of the question answered, questions: the raid's own questions (an ability's
//   inserted card is asked with its question), armed: the ability toggles armed for this answer (only a module that
//   declares `decision: true` has buttons; armed toggles are ignored for any other, and on attacks and inserted
//   questions). Ability inserts share MAX_INSERTED per attempt (fight.insertedN counts them).
export function raidStep(before, q, info, { ability = '', need, lives, dayHp, dayBefore = 0, dayAb = null, pos = 0, questions = [], armed = null } = {}) {
  const mod = abilityById(ability)
  const verdict = info.verdict
  const inserted = q._inserted || (q._lastStand ? 'lastStand' : '')
  const useArmed = armed && mod?.decision && !q._attack && !inserted ? armed : null
  const hit = { verdict, mode: info.mode === 'choice' ? 'choice' : 'typed', attack: !!q._attack, inserted, lastStand: inserted === 'lastStand', key: q._cardId, ...(useArmed ? { armed: useArmed } : {}) }
  const bar = { total: dayHp, before: dayBefore, phases: RAID.phases }
  const phaseNow = barPhase(bar, before.damage)
  let next = strike(before, hit, { ability, phase: phaseNow, need, lives, bar, dayAb })
  // A boss heal never crosses a phase line backwards (choices came back and the PHASE flash replayed).
  if (next.last?.gorged > 0 && barPhase(bar, next.damage) < phaseNow) {
    next = { ...next, ab: next.ab ? { ...next.ab } : next.ab, damage: next.damage + next.last.gorged, last: { ...next.last, gorged: 0, fx: '' } }
    if (mod?.cancelHeal) mod.cancelHeal(next)
  }
  const over = next.damage >= need || next.livesLost >= lives
  const normal = !q._attack && !inserted
  // A miss (or a glancing answer's slip) comes back later as the boss's attack.
  let attack = null
  if (normal && !over && canAttack(next)) {
    const a = info.attackQ
    // `info.aid` tags the attack with the answer it came from (a re-check that finds the answer right cancels it); a
    // glancing slip whose follow-up is still being written goes in as a placeholder (`_pending`: the run skips it if
    // the text is not there in time).
    const tag = info.aid ? { _attackOf: info.aid } : {}
    const base = verdict === 'miss' ? { ...q, alt: undefined, ...tag }
      : a ? (a.pending ? { kind: 'typed', prompt: '', accepted: [], target: q.target, _cardId: q._cardId, _pending: a.pending }
        : { kind: 'typed', prompt: a.prompt, accepted: a.accepted, exact: !!a.exact, target: q.target, _cardId: q._cardId, ...tag }) : null
    if (base) attack = { ...base, _attack: true }
  }
  // The shared insert budget (MAX_INSERTED per attempt, every ability insert together): `room` tells the module what
  // still fits. A plan whose inserts no longer fit at all is dropped WHOLE (its `ab` and `attack: false` too: a loop
  // that never comes back must not cancel the attack); one that partly fits keeps its first inserts.
  const room = Math.max(0, MAX_INSERTED - (next.insertedN || 0))
  let plan = mod?.afterStrike ? mod.afterStrike(next, { q, hit, over, attack: !!attack, normal, pos, room }) : null
  if (plan && Array.isArray(plan.insert) && plan.insert.length && room === 0) plan = null
  if (plan && plan.attack === false) attack = null
  // The plan may update the ability's own state with what it decided (a minion raised, a card looped).
  if (plan && plan.ab && typeof plan.ab === 'object') next = { ...next, ab: { ...(next.ab || {}), ...plan.ab } }
  const groups = []
  const cardQ = (x) => {
    const found = questions.find((y) => String(y._cardId) === String(x.key))
    return found ? { ...found, alt: undefined, _inserted: x.kind || 'inserted', ...(x.kind === 'lastStand' ? { _lastStand: true } : {}) } : null
  }
  const added = plan && Array.isArray(plan.insert) ? plan.insert.map(cardQ).filter(Boolean).slice(0, room) : []
  if (added.length) {
    next = { ...next, insertedN: (next.insertedN || 0) + added.length }
    groups.push({ insert: added, at: pos + Math.max(1, Number(plan.at) || 1) })
  }
  if (attack) {
    next = { ...next, attacks: next.attacks + 1 }
    groups.push({ insert: [attack], at: attackSlot(pos, Number.MAX_SAFE_INTEGER, attackGapFor(ability, next)) })
  }
  return { next, groups }
}
