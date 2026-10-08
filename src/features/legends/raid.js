// RAIDS (pure, tested): a SIEGE against a raid boss, fought with the deck's DUE cards (Anki's own review stack, so
// every answer is recorded as a real review, win or lose). Harder than a Legends boss: typed clean strikes are needed
// to win (choices deal 1 and only before phase 2), hearts are few, and a raid boss has THREE phases.
//
// THE SIEGE: both sides carry over between runs. Each boss has its OWN profile (raidProfiles.js: health, the player's
// hearts, a flat daily heal), crafted like its ability; a run (the player's run size) is only a slice of
// it. Wounds stay until the boss is beaten; lost hearts stay lost for the day. Each new calendar day the hearts are full
// again and the boss heals its profile's `heal`, applied lazily per elapsed day from the stored `siege.date`, only
// ever forward (two computers on a shared folder never heal it twice). Losing every heart in a run makes the boss
// RALLY (heals back RAID.rallyShare of that run's damage) and refills the hearts at once.
// A day may hold several runs (each takes the next due cards; `day.asked` = the notes answered today). A win is a
// trophy, XP and a streak freeze, and the next boss in RAID_ORDER comes out (the same day: RAID.nextBossSameDay),
// with full hearts and a fresh health.
//
// STORED SHAPE: { boss, day: { date, hp, damage, attempts, won, ab?, asked? }, trophies, siege: { boss, hp, damage,
// hearts, date, bandage?, variant? } | null }. `variant` (raidProfiles.js RAID_VARIANTS; absent = 'normal') picks the
// boss's tunables through raidProfile(motif, variant); an older build ignores it and fights the normal numbers. `day.hp`/`day.damage` are written in step with the siege, so an older build (which reads
// only `day`) sees the boss as it is; an older build writes no `siege`, and siegeOf() then starts it from `day`.
import { abilityForMotif, abilityById } from './abilities'
import { raidProfile, MAX_HEARTS } from './raidProfiles'
import { bossesBeaten, POWERS, POWER_IDS, POWER_DEFAULTS, powersOf, shapePowers } from './powers'
import { strike, barPhase, canAttack, attackSlot, attackGapFor, raidRating, rulesOf, abilityK, FIGHT_RULES } from './fight'

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
// THE RAID NUMBERS (one place; each boss's own fight is its profile in raidProfiles.js): runSize = questions per run
// (the default of the player's setting; runSizes = its choices), maxCards = the default run, minCards = cards a run
// needs, minHp/maxHp/hpPerCard = raidHp (the per-run health the ability tests' simulator uses), lives = that
// simulator's default hearts, nextBossSameDay = a win brings out the next boss at once, askedKeep = notes kept in
// day.asked. profiles.test.js checks the balance.
// rallyShare: losing every heart in a run lets the boss heal back this share of the damage that run dealt (the owner:
// a lost run should cost something, but never lock the player out); the hearts are then full again at once.
// phases and rallyShare are the DEFAULT fight rules (abilities/_rules.js FIGHT_RULES); a fight reads its resolved ones.
export const RAID = { runSize: 15, runSizes: [5, 10, 15, 20, 30], minCards: 1, maxCards: 15, hpPerCard: 1.5, minHp: 7, maxHp: 40, lives: 3, phases: FIGHT_RULES.phases, nextBossSameDay: true, askedKeep: 400, rallyShare: FIGHT_RULES.rallyShare }
// The run size from the setting (features.legends.raidRunSize): one of RAID.runSizes, else the default.
export const raidRunSize = (v) => (RAID.runSizes.includes(Number(v)) ? Number(v) : RAID.runSize)

// The LOCAL day as 'YYYY-MM-DD', from the date's own fields (toLocaleDateString('en-CA') is ICU data and has changed
// format between browser builds, which would split stored day keys from today's).
export const todayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// Health for `due` cards: the per-run rule the ability tests' simulator uses (abilities/_sim.js). A siege's health is
// the boss's profile (bossHp), never the cards due.
export const raidHp = (due) => Math.max(RAID.minHp, Math.min(RAID.maxHp, Math.floor(Math.max(0, due) * RAID.hpPerCard)))
// A boss's profile numbers, by roster index (a retired boss reads its successor's) and variant (absent = normal): all
// through the ONE resolver, raidProfiles.js raidProfile(motif, variant).
const motifAt = (boss) => RAID_ROSTER[activeBossIndex(boss)]
export const bossProfile = (boss, variant) => raidProfile(motifAt(boss), variant)
export const bossHp = (boss, variant) => bossProfile(boss, variant).hp
export const bossHearts = (boss, variant) => bossProfile(boss, variant).hearts
export const bossHeal = (boss, variant) => bossProfile(boss, variant).heal
// The tunables of a siege's fight (its boss and variant): what RaidRun puts on the fight (fight.js tuneFight).
export const siegeProfile = (siege) => (siege ? bossProfile(siege.boss, siege.variant) : null)
const variantOf = (g) => (g && typeof g.variant === 'string' && /^[a-z][a-z0-9-]{0,23}$/.test(g.variant) ? g.variant : '')

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
  const variant = variantOf(g)
  const hp = g ? clampInt(g.hp, 0, Math.max(RAID.maxHp * 4, bossHp(boss, variant)), 0) : 0
  const siege = g && hp > 0 ? { boss, hp, damage: clampInt(g.damage, 0, hp, 0), hearts: clampInt(g.hearts, 0, Math.max(MAX_HEARTS, bossHearts(boss, variant)), bossHearts(boss, variant)), date: g.date, ...(typeof g.bandage === 'string' ? { bandage: g.bandage } : {}), ...(variant ? { variant } : {}) } : null
  return { boss, day, trophies, siege }
}
// The siege of the current boss: the stored one, else one started from the day record (an older build wrote the
// state and dropped `siege`: its day holds the boss's health and wounds, hearts start full), else null (none yet).
export function siegeOf(state) {
  const s = shapeRaid(state)
  if (s.siege) return s.siege
  if (s.day && !s.day.won) return { boss: s.boss, hp: s.day.hp, damage: Math.min(s.day.damage, s.day.hp), hearts: bossHearts(s.boss), date: s.day.date }
  return null
}
// The siege on `date`: hearts full again and the boss's heal once per whole day since its date (wounds never below 0;
// a Bandage dated the siege's day skips that first night's heal, or the variant's `powers.bandage` nights). Only forward: a siege dated `date` or later is
// returned unchanged (idempotent).
export function regenSiege(siege, date) {
  if (!siege) return siege
  const days = dayGap(siege.date, date)
  if (days <= 0) return siege
  const { bandage, ...rest } = siege
  const nights = Math.max(0, days - (bandage === siege.date ? bossProfile(siege.boss, siege.variant).powers.bandage : 0))
  return {
    ...rest, date,
    hearts: Math.max(siege.hearts, bossHearts(siege.boss, siege.variant)),
    damage: Math.max(0, siege.damage - nights * bossHeal(siege.boss, siege.variant)),
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
  const regen = had ? regenSiege(had, date) : null
  // A siege an older build left at 0 hearts (it locked the raid until the next day) is full again: a fall now rallies.
  const siege = regen ? (regen.hearts > 0 ? regen : { ...regen, hearts: bossHearts(regen.boss, regen.variant) }) : { boss: s.boss, hp: bossHp(s.boss), damage: 0, hearts: bossHearts(s.boss), date }
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
  const won = siege.damage + dealt >= siege.hp
  const left = Math.max(0, siege.hearts - Math.max(0, Number(livesLost) || 0))
  // Out of hearts without the win: the boss RALLIES (heals back RAID.rallyShare of this run's damage, rounded down) and
  // the hearts are full again, so the player may try again at once. A run that was stopped keeps all its damage.
  const prof = siegeProfile(siege)
  const rallied = !won && left <= 0 ? Math.floor(dealt * prof.rules.rallyShare) : 0
  const dmg = Math.min(siege.hp, siege.damage + dealt - rallied)
  const hearts = !won && left <= 0 ? prof.hearts : left
  // A rally lowers the wounds: the ability's saved day state (a split of those wounds) is told, so it never says the
  // boss is more hurt than the bar (onRally, abilities/_contract.js).
  if (rallied > 0 && dayAb && typeof dayAb === 'object') {
    const mod = abilityById(RAID_ABILITY[RAID_ROSTER[siege.boss]])
    if (mod?.onRally) { const fixed = mod.onRally(dayAb, { healed: rallied, damage: dmg, hp: siege.hp, K: abilityK(mod, { tune: prof }) }); if (fixed && typeof fixed === 'object') dayAb = fixed }
  }
  const askedAll = mergeIds(s.day.asked, asked)
  const day = { ...s.day, hp: siege.hp, damage: dmg, attempts: s.day.attempts + 1, ...(dayAb && typeof dayAb === 'object' ? { ab: dayAb } : {}), ...(askedAll.length ? { asked: askedAll } : {}) }
  if (!won) return { state: { ...s, day, siege: { ...siege, damage: dmg, hearts, date: day.date } }, won: false, firstWin: false, rallied, fell: left <= 0 }
  const motif = RAID_ROSTER[s.boss]
  return {
    state: { boss: nextBossIndex(s.boss), day: { ...day, won: true }, trophies: [...s.trophies, { motif, date }], siege: null },
    won: true, firstWin: true,
  }
}
// The notes a Victory lap answered after the run was saved: added to the day's list, nothing else changes.
// A BANDAGE (a siege power, used between runs, once a day): the boss does not heal tonight. Marks the siege; null when
// it cannot be used (not unlocked, no boss out, already bandaged today). Whether it was brought is the caller's check.
export function applyBandage(state, date) {
  const s = raidToday(state, date, 0)
  if (!s.siege || s.day.won || s.siege.bandage === date || bossesBeaten(s) < POWERS.bandage.unlock) return null
  return { ...s, siege: { ...s.siege, bandage: date } }
}

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
// The cards a run needs: any (the boss's health is its profile, never the cards; a 3-card day still lands blows).
export const raidMinCards = () => RAID.minCards

// THE RUN RAN OUT OF QUESTIONS (RaidRun's "Continue?" in the arena): 'over' = the fight is decided (no prompt),
// 'continue' = the boss lives, hearts are left and `next` due cards wait, 'empty' = the same, but no due card is left.
export function raidOutOfQuestions({ damage = 0, need = 1, livesLost = 0, lives = 1, next = 0 } = {}) {
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
// judge's follow-up for a glancing answer's slip, or { pending: aid } while it is still being written). Returns { next, groups, boost }: the new fight state, the questions to
// put into the run, each group { insert: [questions], at } (RaidRun hands QuizRunner one group per answer), and the
// power windows up on this answer (`boost`, for a refund if the verdict is overturned).
//   need: this attempt's health (the day's health left), dayHp: the whole day's health, dayBefore: the damage earlier
//   attempts dealt today, dayAb: the ability's saved day state (raid day.ab), pos: the index of the question answered, questions: the raid's own questions (an ability's
//   inserted card is asked with its question), armed: the ability toggles armed for this answer (only a module that
//   declares `decision: true` has buttons; armed toggles are ignored for any other, and on attacks and inserted
//   questions). Ability inserts share MAX_INSERTED per attempt (fight.insertedN counts them).
// POWERS (powers.js): `info.aided` = a 50:50 or hint helped with this question (struck like a choice: 1 damage, never
// a clean typed answer; recorded as Hard); `shield` = a Shield is up (it takes the next lost heart); `sharpen` = a
// Sharpen is armed (a clean typed answer to a raid question deals the power's `sharpen` more); `ward` = raised against this
// attack (it costs no hearts); window powers in their window: `focus` (a glancing answer hits like a clean one),
// `momentum` (every clean answer crits), `fury` (a clean typed answer deals `fury` times), `siphon` (a clean
// answer to a raid question gives back `siphon` lost hearts). None of them changes a verdict or an Anki grade. The
// numbers are the fight's (powersOf(before): its tune's resolved powers, else the defaults).
export function raidStep(before, q, info, { ability = '', need, lives, dayHp, dayBefore = 0, dayAb = null, pos = 0, questions = [], armed = null, shield = false, sharpen = false, ward = false, focus = false, momentum = false, fury = false, siphon = false } = {}) {
  const mod = abilityById(ability)
  const verdict = info.verdict
  const inserted = q._inserted || (q._lastStand ? 'lastStand' : '')
  const useArmed = armed && mod?.decision && !q._attack && !inserted ? armed : null
  const hit = { verdict, mode: info.mode === 'choice' || info.aided ? 'choice' : 'typed', attack: !!q._attack, inserted, lastStand: inserted === 'lastStand', key: q._cardId, ...(useArmed ? { armed: useArmed } : {}) }
  const R = rulesOf(before)
  const P = powersOf(before)
  const bar = { total: dayHp, before: dayBefore, phases: R.phases }
  const phaseNow = barPhase(bar, before.damage)
  // A Shield raised now takes the next lost heart even when an earlier one was already used up in this fight.
  // Sharpen pays on a clean typed hit, or a slip Focus makes hit clean (else it stays armed for the next one).
  const bonus = sharpen && (verdict === 'clean' || (verdict === 'glancing' && focus)) && hit.mode === 'typed' && !q._attack && !inserted ? P.sharpen : 0
  const own = !q._attack && !inserted
  let next = strike(shield ? { ...before, shieldUsed: false } : before, hit, { ability, phase: phaseNow, need, lives, bar, dayAb, shield, bonus,
    ward: ward && !!q._attack, focus: focus && own && hit.mode === 'typed', momentum: momentum && own, fury: fury && own ? P.fury : 0 })
  if (bonus) next = { ...next, last: { ...(next.last || {}), sharpened: true } }
  // Siphon: a clean answer (or a slip Focus made hit clean) to a raid question in its window gives back one heart this fight lost (never past full,
  // never after the fight is decided).
  if (siphon && own && (verdict === 'clean' || !!next.last?.focused) && next.livesLost > 0 && next.livesLost < lives && next.damage < need) {
    const back = Math.min(next.livesLost, P.siphon)
    next = { ...next, livesLost: next.livesLost - back, last: { ...(next.last || {}), siphoned: back } }
  }
  // A boss heal never crosses a phase line backwards (choices came back and the PHASE flash replayed).
  if (next.last?.gorged > 0 && barPhase(bar, next.damage) < phaseNow) {
    next = { ...next, ab: next.ab ? { ...next.ab } : next.ab, damage: next.damage + next.last.gorged, last: { ...next.last, gorged: 0, fx: '' } }
    if (mod?.cancelHeal) mod.cancelHeal(next, { K: abilityK(mod, next), rules: R })
  }
  const over = next.damage >= need || next.livesLost >= lives
  const normal = !q._attack && !inserted
  // A miss (or a glancing answer's slip) comes back later as the boss's attack.
  let attack = null
  // Focus: a glancing answer in its window hit like a clean one, so its slip does not come back as an attack either
  // (the debrief still shows the slip, and Anki still gets the real grade).
  const focusedSlip = verdict === 'glancing' && !!next.last?.focused
  if (normal && !over && !focusedSlip && canAttack(next)) {
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
  const room = Math.max(0, R.maxInserted - (next.insertedN || 0))
  let plan = mod?.afterStrike ? mod.afterStrike(next, { q, hit, over, attack: !!attack, normal, pos, room, K: abilityK(mod, next), rules: R }) : null
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
  // What a power window up on THIS answer would have given a right answer (an overturn refunds it: fight.refundFor).
  const boost = own ? {
    ...(fury && hit.mode === 'typed' ? { fury: P.fury } : {}),
    ...(momentum && !(mod && mod.noCrit) && hit.mode === 'typed' ? { momentum: true } : {}),
    ...(focus && hit.mode === 'typed' ? { focus: true } : {}),
  } : {}
  return { next, groups, boost }
}

// A TEST FIGHT (cheat mode's asset view, "Fight this boss"): a fresh siege of THIS boss (full hearts, full health
// for the run's cards), through the normal raid (RaidRun). It is never stored: the answers are real reviews (they
// count like any review), but the raid's progress (wounds, hearts, trophies, the rotation, the boss-win reward) stays
// as it is (raidAttemptOutcome with `test`).
// `variant` (optional, raidProfiles.js RAID_VARIANTS): try the boss in a variant.
export function testRaidState(motif, date, due, variant = '') {
  const i = RAID_ROSTER.indexOf(motif)
  const boss = i >= 0 ? activeBossIndex(i) : raidBossIndex(RAID_ORDER[0])
  const v = variantOf({ variant })
  const hp = bossHp(boss, v)
  return { boss, day: { date, hp, damage: 0, attempts: 0, won: false }, trophies: [], siege: { boss, hp, damage: 0, hearts: bossHearts(boss, v), date, ...(v ? { variant: v } : {}) } }
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
    return { state: null, won: r.won, firstWin: false, rallied: r.rallied || 0, fell: !!r.fell }
  }
  const cur = shapeRaid(stored)
  // The boss fought is gone (beaten on another computer meanwhile): only the answered notes are kept.
  if (motif && RAID_ROSTER[cur.boss] !== motif) return { state: raidMarkAsked(cur, date, asked), won: false, firstWin: false }
  const base = raidToday(stored, date, due)
  // A run started before midnight and saved after another window already began the NEXT day: its damage and hearts
  // go onto that newer day as it is (no heal backwards, no ability state of the old day).
  const at = base.day.date
  const r = applyRaidAttempt(base, at, damage, at === date ? dayAb : undefined, { livesLost, asked })
  return { state: r.state, won: r.won, firstWin: r.firstWin, rallied: r.rallied || 0, fell: !!r.fell }
}

// The siege rules in one line (Help, the bestiary catalog).
// The power facts in SIEGE_RULE come from powers.js (names Help knows them by), so a retune never leaves Help wrong.
const POWER_HELP_NAME = { shield: 'shield', fifty: '50:50', wind: 'second wind', sharpen: 'sharpen', hint: 'hint', bandage: 'bandage', focus: 'focus', siphon: 'siphon', ward: 'ward', momentum: 'momentum', fury: 'fury', steadfast: 'steadfast' }
const powerHelpName = (id) => POWER_HELP_NAME[id] || id
const POWER_UNLOCK_LINE = POWER_IDS.map((id) => `${powerHelpName(id)} ${POWERS[id].unlock}`).join(', ')
const WINDOW_IDS = POWER_IDS.filter((id) => POWERS[id].window).map(powerHelpName)
const WINDOW_LINE = WINDOW_IDS.length > 1 ? `${WINDOW_IDS.slice(0, -1).join(', ')} and ${WINDOW_IDS[WINDOW_IDS.length - 1]}` : WINDOW_IDS.join('')
// `powers`: a profile's resolved power numbers (a variant's), default the normal ones. SIEGE_RULE = the normal text.
export function siegeRule(powers = POWER_DEFAULTS) {
  const P = powers === POWER_DEFAULTS ? powers : shapePowers(powers)
  return `The raid is a SIEGE: each raid boss has its own fixed health, and the player gets a fixed number of hearts against that boss (later bosses are bigger, and the player gets more hearts against them or the boss has an ability that protects the player). A run is a few questions (the player picks how many in the fight settings); the boss's wounds stay until it is beaten and lost hearts stay lost for the day. Losing every heart in a run makes the boss rally: it heals back half the damage that run dealt, and the hearts are full again at once, so the player can try again right away. Each new day the hearts are full again and the boss heals a little. Several runs a day are fine; each takes the next due cards, and a run that runs out of questions can continue with the next ones. A win brings out the next boss ${RAID.nextBossSameDay ? 'right away' : 'the next day'} with full hearts; the unasked cards can be answered in an optional Victory lap or stay due. POWERS: beating DIFFERENT raid bosses unlocks powers for good (${POWER_UNLOCK_LINE} different bosses); before a fight the player picks up to ${P.loadoutMax} to bring, and each brought power works once per fight (${WINDOW_LINE} last ${P.window} questions; ward is raised on an incoming attack; steadfast gives ${P.steadfast} extra hearts that are lost first; bandage is used between runs, once a day). A 50:50 or hint makes that card's review count as Hard; no power changes whether an answer is right.`
}
export const SIEGE_RULE = siegeRule()

// What Ebi's Help hears about a raid on screen (plain facts, never a question's answer).
//   view: loading | intro | fight | more | lap | saving | done | hearts | other; boss: its name; hpLeft/hpMax: the
//   siege's health; livesLeft: hearts left now; lives: the most hearts; phase: 1..3; asked/total: cards answered of
//   the cards picked; lapLeft: Victory lap cards left; nextCards: the cards a Continue would bring; result: { won,
//   recorded, failed } on the result screen; test: a cheat-mode test fight; powerNums: the fight's resolved power
//   numbers (raidProfile(...).powers; absent = the normal ones) for the siege rule's power facts.
export function raidHelpText({ view = '', boss = '', ability = '', hpLeft = 0, hpMax = 0, livesLeft = 0, lives = 0, phase = 1, asked = 0, total = 0, lapLeft = 0, aftermathLeft = 0, nextCards = 0, result = null, test = false, powers = '', powerNums = null } = {}) {
  const who = `${boss || 'the raid boss'}${ability ? ` (ability: ${ability})` : ''}${test ? ' [a TEST fight from the asset view: full hearts, a fresh boss, and the stored raid (wounds, hearts, trophies, boss rotation) is not changed; answers are real Anki reviews]' : ''}`
  const hearts = `${livesLeft}/${lives} hearts`
  const pw = powers ? ` ${powers}` : ''
  const lap = lapLeft || aftermathLeft
  if (view === 'loading') return `Daily raid: Ebi is gathering the due cards and writing the questions for ${who}.`
  if (view === 'intro') return `Daily raid: the intro card of ${who}, health ${hpLeft}/${hpMax}, ${hearts}, ${total} due cards to fight with. Not started yet.${pw} ${powerNums ? siegeRule(powerNums) : SIEGE_RULE}`
  if (view === 'fight') return `Daily raid RUNNING against ${who}: boss health ${hpLeft}/${hpMax}, phase ${phase} of ${RAID.phases}, ${hearts} left, ${asked} of ${total} due cards answered.${pw} Each card's first answer is a real Anki review: never give the answer to the question on screen unless they explicitly ask.`
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
  const stage = { loading: 'loading', intro: 'intro card', fight: 'fight running', more: 'out of questions, continue or stop', aftermath: 'victory lap running', lap: 'victory lap running', saving: 'saving', done: 'result' }[view]
  return stage ? `${what}: ${stage}` : what
}

// The card a model's raid question points at: its `card` field is the 1-based number from the prompt, written as 2,
// "2", "Card 2" or "#2"; the first whole number in it counts. -1 when there is none.
export function raidCardIndex(card) {
  if (typeof card === 'number') return Number.isInteger(card) && card > 0 ? card - 1 : -1
  const m = String(card ?? '').match(/\d+/)
  const n = m ? parseInt(m[0], 10) : 0
  return n > 0 ? n - 1 : -1
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
