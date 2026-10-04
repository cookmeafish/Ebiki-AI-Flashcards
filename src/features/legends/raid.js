// RAIDS (pure, tested): a SIEGE against a raid boss, fought with the deck's DUE cards (Anki's own review stack, so
// every answer is recorded as a real review, win or lose). Harder than a Legends boss: typed clean strikes are needed
// to win (choices deal 1 and only before phase 2), hearts are few, and a raid boss has THREE phases.
//
// THE SIEGE (owner decision, 2026-10, "option 2"): both sides carry over. The boss's health is set ONCE when it first
// comes out (from that run's cards, capped at a typical day: RAID.typicalDay) and its wounds stay until it is beaten.
// The player's hearts (RAID.lives at most) stay lost too. Each new calendar day the player gets RAID.heartsPerDay back
// and the boss heals RAID.healPerDay of its health, applied lazily per elapsed day from the stored `siege.date`, only
// ever forward (two computers on a shared folder never heal it twice). With no hearts no raid starts until tomorrow.
// A day may hold several runs (each takes the next due cards; `day.asked` = the notes answered today). A win is a
// trophy, XP and a streak freeze, and the next boss in RAID_ORDER comes out (the same day: RAID.nextBossSameDay),
// with full hearts and a fresh health.
//
// STORED SHAPE: { boss, day: { date, hp, damage, attempts, won, ab?, asked? }, trophies, siege: { boss, hp, damage,
// hearts, date } | null }. `day.hp`/`day.damage` are written in step with the siege, so an older build (which reads
// only `day`) sees the boss as it is; an older build writes no `siege`, and siegeOf() then starts it from `day`.
import { abilityForMotif, abilityById } from './abilities'
import { strike, barPhase, canAttack, attackSlot, attackGapFor, MAX_INSERTED, raidRating } from './fight'

// THE ROSTER is append-only: a stored raid state's `boss` is an INDEX into it (older builds on a shared folder read
// the same indices), so a boss is never removed from it, only RETIRED. A retired boss is skipped by the rotation: a
// stored boss that is retired moves on to the next active one, and its old trophies are kept (shown generically).
export const RAID_ROSTER = ['hydra', 'titan', 'lich', 'chimera', 'void', 'seraph', 'leviathan', 'inferno', 'chronos', 'vampire', 'tempest', 'kaleido', 'glutton', 'puppeteer', 'berserker', 'swarmqueen', 'gorgon', 'banshee', 'reaper', 'dreamer', 'moonmaw', 'kitsune', 'ophanim', 'ratking', 'sugarqueen', 'showman', 'cerberus']
// Retired by the owner (2026-10, the Glutton: "i dont even like the concept"): no art, ability, texts or voice remain.
export const RAID_RETIRED = ['glutton']
// THE PROGRESSION (owner-approved, 2026-10): the ONE place the order lives. A win brings out the next motif here
// (wrapping); a new raid starts at RAID_ORDER[0]. Storage stays the roster INDEX (raidBossIndex), so an existing
// player keeps their boss and just continues from its place here. Every active boss once, no retired one (tested).
export const RAID_ORDER = ['chronos', 'banshee', 'seraph', 'titan', 'vampire', 'gorgon', 'chimera', 'ratking', 'showman', 'reaper', 'leviathan', 'lich', 'cerberus', 'tempest', 'dreamer', 'berserker', 'inferno', 'swarmqueen', 'moonmaw', 'hydra', 'kaleido', 'puppeteer', 'sugarqueen', 'kitsune', 'ophanim', 'void']
// The bosses that exist (art, ability, lore, voice), in progression order (= RAID_ORDER).
export const RAID_MOTIFS = RAID_ORDER
export const isRaidMotif = (m) => RAID_MOTIFS.includes(m)
// A raid boss's number in the progression (1-based), 0 for anything else (a Legends boss, a retired one).
export const raidBossNumber = (motif) => RAID_ORDER.indexOf(motif) + 1
// The roster index a motif is stored as.
export const raidBossIndex = (motif) => RAID_ROSTER.indexOf(motif)
// The first ACTIVE roster index at or after `i` (wrapping). Only for a stored RETIRED boss (it has no place in
// RAID_ORDER): it moves on to the next active roster entry, as older builds did.
export function activeBossIndex(i) {
  const n = RAID_ROSTER.length
  const start = Number.isInteger(i) && i >= 0 ? i % n : 0
  for (let k = 0; k < n; k++) { const j = (start + k) % n; if (!RAID_RETIRED.includes(RAID_ROSTER[j])) return j }
  return 0
}
// The roster index of the boss after roster index `i` in RAID_ORDER (wrapping). A retired or unknown `i` first
// resolves to its active successor.
export function nextBossIndex(i) {
  const pos = RAID_ORDER.indexOf(RAID_ROSTER[activeBossIndex(i)])
  return raidBossIndex(RAID_ORDER[(pos + 1) % RAID_ORDER.length])
}
// Each raid boss fights its own way: its ability module abilities/<motif>.js (id -> the texts lg_ability_<id>...).
export const RAID_ABILITY = Object.fromEntries(RAID_MOTIFS.map((m) => [m, abilityForMotif(m)?.id || '']))
// minHp 7 with Math.floor (design v2.1): with round + 8, a 5-card raid answered all RIGHT by choices in phase 1, then
// typed (phase 2 forbids choices), dealt 1+1+1+2+2 = 7 of 8 and could not win.
// THE SIEGE NUMBERS (one place): heartsPerDay back each new day (capped at `lives`), healPerDay = the share of its
// health the boss heals each new day, typicalDay = the most due cards a boss's health is sized for (a 60-card backlog
// does not make a 90-health boss), siegeHpDays = how many typical days of cards it takes (health = min(due,
// typicalDay) x hpPerCard x siegeHpDays: 8 due = 24, 10+ due = 30), nextBossSameDay = a win brings out the next boss
// at once, askedKeep = notes kept in day.asked. siege.test.js checks the balance this gives (SIEGE=1 prints it): a
// 75% learner with 8 due a day beats a boss in about 3 days (2 to 4 typical), 30 due in about 17 cards (one day at
// 85%, hearts run out first at 75%), and 5 due a day still beats one in about 3 days.
export const RAID = { minCards: 5, maxCards: 15, hpPerCard: 1.5, minHp: 7, maxHp: 40, lives: 3, phases: 3, heartsPerDay: 1, healPerDay: 0.2, typicalDay: 10, siegeHpDays: 2, nextBossSameDay: true, askedKeep: 400 }

export const todayKey = (d = new Date()) => d.toLocaleDateString('en-CA')

// Health for `due` cards (raidHp: the old per-day rule, still used by the ability tests' simulator). A boss's SIEGE
// health (siegeHp) comes from the cards due when it first comes out, capped at RAID.typicalDay: never the backlog.
export const raidHp = (due) => Math.max(RAID.minHp, Math.min(RAID.maxHp, Math.floor(Math.max(0, due) * RAID.hpPerCard)))
export const siegeHp = (due) => Math.max(RAID.minHp, Math.floor(Math.min(Math.max(0, Number(due) || 0), RAID.typicalDay) * RAID.hpPerCard * RAID.siegeHpDays))
// What the boss heals each new day (at least 1).
export const healPerDay = (hp) => Math.max(1, Math.ceil(hp * RAID.healPerDay))

// Whole days from date `a` to date `b` (todayKey strings, 'YYYY-MM-DD'): negative when `b` is earlier. Other strings
// (tests, damaged data) only compare: equal 0, later 1, earlier -1.
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/
export function dayGap(a, b) {
  if (a === b) return 0
  const pa = DATE_RE.exec(String(a)), pb = DATE_RE.exec(String(b))
  if (!pa || !pb) return String(b) > String(a) ? 1 : -1
  const ms = (p) => Date.UTC(Number(p[1]), Number(p[2]) - 1, Number(p[3]))
  return Math.round((ms(pb) - ms(pa)) / 86400000)
}

// Raid state per mode (see STORED SHAPE above). newRaidState = never fought.
export const newRaidState = () => ({ boss: raidBossIndex(RAID_ORDER[0]), day: null, trophies: [], siege: null })
const idList = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'number' || (typeof x === 'string' && x.length < 40)).slice(-RAID.askedKeep) : [])
const clampInt = (v, lo, hi, dflt) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : dflt }
export function shapeRaid(raw) {
  const s = raw && typeof raw === 'object' ? raw : {}
  const stored = Number.isInteger(s.boss) && s.boss >= 0 ? s.boss % RAID_ROSTER.length : raidBossIndex(RAID_ORDER[0]) // none stored: a new raid
  const boss = activeBossIndex(stored)
  const moved = boss !== stored // a retired boss: the next one takes over today's wounds, not the old ability's state
  const d = s.day && typeof s.day === 'object' && typeof s.day.date === 'string' ? s.day : null
  const asked = d ? idList(d.asked) : []
  const day = d ? { date: d.date, hp: Math.max(1, Number(d.hp) || RAID.minHp), damage: Math.max(0, Number(d.damage) || 0), attempts: Math.max(0, Number(d.attempts) || 0), won: !!d.won, ...(!moved && d.ab && typeof d.ab === 'object' && !Array.isArray(d.ab) ? { ab: d.ab } : {}), ...(asked.length ? { asked } : {}) } : null
  // Every trophy is kept, a retired (or newer build's) boss too: the hall shows those generically (isRaidMotif).
  const trophies = (Array.isArray(s.trophies) ? s.trophies : []).filter((x) => x && typeof x.motif === 'string' && /^[a-z][a-z0-9-]{0,39}$/.test(x.motif) && typeof x.date === 'string').slice(-200)
  // The siege belongs to ONE boss: a siege of another (a retired boss that moved on) is dropped.
  const g = !moved && s.siege && typeof s.siege === 'object' && typeof s.siege.date === 'string' && s.siege.boss === stored ? s.siege : null
  const hp = g ? clampInt(g.hp, 0, RAID.maxHp * 4, 0) : 0
  const siege = g && hp > 0 ? { boss, hp, damage: clampInt(g.damage, 0, hp, 0), hearts: clampInt(g.hearts, 0, RAID.lives, RAID.lives), date: g.date } : null
  return { boss, day, trophies, siege }
}
// The siege of the current boss: the stored one, else one started from the day record (an older build wrote the
// state and dropped `siege`: its day holds the boss's health and wounds, hearts start full), else null (none yet).
export function siegeOf(state) {
  const s = shapeRaid(state)
  if (s.siege) return s.siege
  if (s.day && !s.day.won) return { boss: s.boss, hp: s.day.hp, damage: Math.min(s.day.damage, s.day.hp), hearts: RAID.lives, date: s.day.date }
  return null
}
// The siege on `date`: one heart back and one heal per whole day since its date (hearts capped, wounds never below
// 0). Only forward: a siege dated `date` or later is returned unchanged (idempotent).
export function regenSiege(siege, date) {
  if (!siege) return siege
  const days = dayGap(siege.date, date)
  if (days <= 0) return siege
  return {
    ...siege, date,
    hearts: Math.min(RAID.lives, siege.hearts + days * RAID.heartsPerDay),
    damage: Math.max(0, siege.damage - days * healPerDay(siege.hp)),
  }
}
export const raidMotif = (state) => RAID_ROSTER[shapeRaid(state).boss]

// Today's raid, as a fight would start it (pure, never stored by itself): the siege brought forward to `date` (hearts
// back, the boss healed per day), or a fresh boss with health from `due` (the run's cards) and full hearts. `day`
// mirrors the siege (older builds read it). A stored state dated LATER than `date` (another computer's clock) is
// taken as it is. With RAID.nextBossSameDay off, a boss beaten today keeps the day beaten.
export function raidToday(state, date, due) {
  const s = shapeRaid(state)
  if (s.day && s.day.date === date && s.day.won && !RAID.nextBossSameDay) return s
  const had = siegeOf(s)
  const siege = had ? regenSiege(had, date) : { boss: s.boss, hp: siegeHp(due), damage: 0, hearts: RAID.lives, date }
  const same = !!(s.day && s.day.date === siege.date)
  const keep = same && !s.day.won // a day whose boss fell: the new boss starts its own tries and ability state
  const day = { date: siege.date, hp: siege.hp, damage: siege.damage, attempts: keep ? s.day.attempts : 0, won: false, ...(keep && s.day.ab ? { ab: s.day.ab } : {}), ...(same && s.day.asked ? { asked: s.day.asked } : {}) }
  return { ...s, day, siege }
}
// The notes already answered in a raid on `date` (the next run takes other due cards).
export const raidAsked = (state, date) => { const s = shapeRaid(state); return s.day && s.day.date === date ? s.day.asked || [] : [] }
const mergeIds = (a, b) => [...new Set([...(a || []), ...(b || [])])].slice(-RAID.askedKeep)

// An attempt (one run) ended with `damage` dealt and `livesLost` hearts lost. The wounds and the lost hearts carry
// over; a win (health gone) adds a trophy and brings out the next boss (its siege starts fresh, full hearts).
// Overkill does not spill onto the next boss. `asked`: the notes this run answered. Returns { state, won, firstWin }.
// `dayAb`: the raid ability's state to keep for today's next attempt (its dayState: the Chimera's wounded heads).
export function applyRaidAttempt(state, date, damage, dayAb, { livesLost = 0, asked = [] } = {}) {
  const s = shapeRaid(state)
  if (!s.day || s.day.date !== date || s.day.won) return { state: s, won: false, firstWin: false }
  const siege = siegeOf(s)
  const dealt = Math.max(0, Number(damage) || 0)
  const dmg = Math.min(siege.hp, siege.damage + dealt)
  const hearts = Math.max(0, Math.min(RAID.lives, siege.hearts - Math.max(0, Number(livesLost) || 0)))
  const askedAll = mergeIds(s.day.asked, asked)
  const day = { ...s.day, hp: siege.hp, damage: dmg, attempts: s.day.attempts + 1, ...(dayAb && typeof dayAb === 'object' ? { ab: dayAb } : {}), ...(askedAll.length ? { asked: askedAll } : {}) }
  const won = dmg >= siege.hp
  if (!won) return { state: { ...s, day, siege: { ...siege, damage: dmg, hearts, date: day.date } }, won: false, firstWin: false }
  const motif = RAID_ROSTER[s.boss]
  return {
    state: { boss: nextBossIndex(s.boss), day: { ...day, won: true }, trophies: [...s.trophies, { motif, date }], siege: null },
    won: true, firstWin: true,
  }
}
// The notes a Victory lap answered after the run was saved: added to the day's list, nothing else changes.
export function raidMarkAsked(state, date, asked = []) {
  const s = shapeRaid(state)
  if (!s.day || s.day.date !== date || !asked.length) return s
  return { ...s, day: { ...s.day, asked: mergeIds(s.day.asked, asked) } }
}

// Due cards in Anki's order: learning cards first (they are due soonest), then reviews by due day, then the rest.
export function raidOrder(cards) {
  const rank = (c) => (Number(c.queue) === 1 || Number(c.queue) === 3 ? 0 : Number(c.queue) === 2 ? 1 : 2)
  return [...cards].sort((a, b) => rank(a) - rank(b) || (Number(a.due) || 0) - (Number(b.due) || 0))
}

// THE NEXT CARDS of a run (the first ones, and each "Continue?"): due cards in Anki's order, one per note, never a
// note answered in a raid today (`asked`) or already in this run (`inRun`), at most `max`.
export function nextRaidCards(infos, { asked = [], inRun = [], max = RAID.maxCards } = {}) {
  const skip = new Set([...asked, ...inRun].map(String))
  const seen = new Set()
  return raidOrder(infos || []).filter((c) => {
    const k = String(c.note)
    if (skip.has(k) || seen.has(k)) return false
    seen.add(k)
    return true
  }).slice(0, max)
}
// The cards a run needs: a FRESH boss needs RAID.minCards (its health comes from them); an ongoing siege can be
// fought with any number (a 3-card day still lands blows).
export const raidMinCards = (ongoing) => (ongoing ? 1 : RAID.minCards)

// THE RUN RAN OUT OF QUESTIONS (RaidRun's "Continue?" in the arena): 'over' = the fight is decided (no prompt),
// 'continue' = the boss lives, hearts are left and `next` due cards wait, 'empty' = the same, but no due card is left.
export function raidOutOfQuestions({ damage = 0, need = 1, livesLost = 0, lives = RAID.lives, next = 0 } = {}) {
  if (damage >= need || livesLost >= lives) return 'over'
  return next > 0 ? 'continue' : 'empty'
}

// THE RESULT SCREEN'S CHOICES after a run (nothing is forced): `won`, `unasked` = cards this run picked and never
// asked, `dueLeft` = due notes not answered today (the unasked ones included), `hearts` = hearts left after the run.
//   nextBoss: the next boss is out (RAID.nextBossSameDay) and due cards remain to fight it
//   lap:      a Victory lap over the unasked cards (a win only, optional, a reward round)
//   again:    "Fight again" (the boss lives, hearts are left, due cards remain)
//   stayDue:  the unasked cards that simply stay due (said in one line)
export function raidRunChoices({ won = false, unasked = 0, dueLeft = 0, hearts = 0 } = {}) {
  return {
    nextBoss: !!(won && RAID.nextBossSameDay && dueLeft > 0),
    lap: won ? Math.max(0, unasked) : 0,
    again: !won && hearts > 0 && dueLeft > 0,
    stayDue: won ? 0 : Math.max(0, unasked),
  }
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

// A TEST FIGHT (cheat mode's asset view, "Fight this boss"): a fresh siege of THIS boss (full hearts, full health
// for the run's cards), through the normal raid (RaidRun). It is never stored: the answers are real reviews (they
// count like any review), but the raid's progress (wounds, hearts, trophies, the rotation, the boss-win reward) stays
// as it is (raidAttemptOutcome with `test`).
export function testRaidState(motif, date, due) {
  const i = RAID_ROSTER.indexOf(motif)
  const boss = i >= 0 ? activeBossIndex(i) : raidBossIndex(RAID_ORDER[0])
  const hp = siegeHp(due)
  return { boss, day: { date, hp, damage: 0, attempts: 0, won: false }, trophies: [], siege: { boss, hp, damage: 0, hearts: RAID.lives, date } }
}

// What an ended run does to the stored raid (RaidRun's save): `state` = what to write (null = write nothing, a test
// fight), `won`, `firstWin` (the trophy, XP and freeze: never for a test fight).
//   stored: the raid state read just now, date: the day the run started, damage: what it dealt, livesLost: the hearts
//   it cost, asked: the notes it answered, dayAb: the ability's day state, due: the run's questions (a fresh boss's
//   health), motif: the boss fought (a boss beaten meanwhile on another computer takes no damage meant for it),
//   test: the test fight's motif or ''.
export function raidAttemptOutcome(stored, { date, damage, livesLost = 0, asked = [], dayAb, due, motif = '', test = '' } = {}) {
  if (test) {
    const r = applyRaidAttempt(testRaidState(test, date, due), date, damage, dayAb, { livesLost })
    return { state: null, won: r.won, firstWin: false }
  }
  const cur = shapeRaid(stored)
  // The boss fought is gone (beaten on another computer meanwhile): only the answered notes are kept.
  if (motif && RAID_ROSTER[cur.boss] !== motif) return { state: raidMarkAsked(cur, date, asked), won: false, firstWin: false }
  const base = raidToday(stored, date, due)
  // A run started before midnight and saved after another window already began the NEXT day: its damage and hearts
  // go onto that newer day as it is (no heal backwards, no ability state of the old day).
  const at = base.day.date
  const r = applyRaidAttempt(base, at, damage, at === date ? dayAb : undefined, { livesLost, asked })
  return { state: r.state, won: r.won, firstWin: r.firstWin }
}

// The siege rules in one line (Help, the bestiary catalog).
export const SIEGE_RULE = `The raid is a SIEGE: the boss's health is set once when it comes out and its wounds stay until it is beaten; the player's ${RAID.lives} hearts carry over too (lost hearts stay lost). Each new day the player gets ${RAID.heartsPerDay} heart back and the boss heals ${Math.round(RAID.healPerDay * 100)}% of its health. With no hearts, no raid until tomorrow (Study still works). Several runs a day are fine; each takes the next due cards. A run that runs out of questions can continue with the next due cards. A win brings out the next boss ${RAID.nextBossSameDay ? 'right away' : 'the next day'} with full hearts; the unasked cards can be answered in an optional Victory lap or stay due.`

// What Ebi's Help hears about a raid on screen (plain facts, never a question's answer).
//   view: loading | intro | fight | more | lap | saving | done | hearts | other; boss: its name; hpLeft/hpMax: the
//   siege's health; livesLeft: hearts left now; lives: the most hearts; phase: 1..3; asked/total: cards answered of
//   the cards picked; lapLeft: Victory lap cards left; nextCards: the cards a Continue would bring; result: { won,
//   recorded, failed } on the result screen; test: a cheat-mode test fight.
export function raidHelpText({ view = '', boss = '', ability = '', hpLeft = 0, hpMax = 0, livesLeft = 0, lives = RAID.lives, phase = 1, asked = 0, total = 0, lapLeft = 0, aftermathLeft = 0, nextCards = 0, result = null, test = false } = {}) {
  const who = `${boss || 'the raid boss'}${ability ? ` (ability: ${ability})` : ''}${test ? ' [a TEST fight from the asset view: full hearts, a fresh boss, and the stored raid (wounds, hearts, trophies, boss rotation) is not changed; answers are real Anki reviews]' : ''}`
  const hearts = `${livesLeft}/${lives} hearts`
  const lap = lapLeft || aftermathLeft
  if (view === 'loading') return `Daily raid: Ebi is gathering the due cards and writing the questions for ${who}.`
  if (view === 'intro') return `Daily raid: the intro card of ${who}, health ${hpLeft}/${hpMax}, ${hearts}, ${total} due cards to fight with. Not started yet. ${SIEGE_RULE}`
  if (view === 'hearts') return `Daily raid against ${who}: no hearts left, so no raid until tomorrow (${RAID.heartsPerDay} heart comes back each day; Study still works). Boss health ${hpLeft}/${hpMax}.`
  if (view === 'fight') return `Daily raid RUNNING against ${who}: boss health ${hpLeft}/${hpMax}, phase ${phase} of ${RAID.phases}, ${hearts} left, ${asked} of ${total} due cards answered. Each card's first answer is a real Anki review: never give the answer to the question on screen unless they explicitly ask.`
  if (view === 'more') return `Daily raid against ${who}: this run is out of questions, the boss lives (health ${hpLeft}/${hpMax}) and the player has ${hearts}. ${nextCards ? `Continue brings the next ${nextCards} due cards into the same fight; Stop for now keeps the wounds and hearts for later.` : 'No due cards are left today.'}`
  if (view === 'aftermath' || view === 'lap') return `Victory lap after beating ${who}: an optional reward round over ${lap} due card(s) the fight never asked (no fight rules; each first answer is a real Anki review; "Finish later" leaves them due). Never give the answer on screen unless asked.`
  if (view === 'saving') return `Raid run against ${who} ended: saving the reviews in Anki.`
  if (view === 'done' && result) return `Raid result against ${who}: ${result.won ? 'the boss was beaten' : `the boss survived with ${hpLeft}/${hpMax} health (its wounds carry over)`}; ${hearts} left; ${result.recorded || 0} review(s) saved in Anki${result.failed ? `, ${result.failed} could NOT be saved (those cards stay due)` : ''}.`
  return ''
}

// The raid's part of the screen in a few words, for Help's "the user is looking at ... and on it: ..." (kit/useHelp.js
// `where`). A test fight says so (it is not the daily raid).
export function raidWhere({ view = '', boss = '', test = false } = {}) {
  const who = boss || 'the raid boss'
  const what = test ? `a raid TEST fight against ${who} (started from the bestiary, cheat mode)` : `the daily raid against ${who}`
  const stage = { loading: 'loading', intro: 'intro card', fight: 'fight running', more: 'out of questions, continue or stop', aftermath: 'victory lap running', lap: 'victory lap running', hearts: 'no hearts left today', saving: 'saving', done: 'result' }[view]
  return stage ? `${what}: ${stage}` : what
}

// THE REVIEWS a raid sends to the card store (RaidRun's save), the same for a normal raid and a test fight: one per
// card, its FIRST answer only (`firstHits`: Map cardId -> hit), graded by the shared one-answer rule (raidRating: a
// clean typed answer on a mature card is Easy, a choice at most Good, a glancing answer Hard, a miss Again).
//   pre: Map cardId -> { interval, factor } (the schedule before the raid), frontOf(cardId) -> the card's front.
export function raidReviews(firstHits, pre, frontOf = () => '') {
  return [...(firstHits || new Map()).entries()].map(([cardId, hit]) => {
    const r = raidRating(hit, pre?.get?.(cardId))
    return { cardId, ease: r.ease, rating: r.rating, front: frontOf(cardId) || '' }
  })
}
