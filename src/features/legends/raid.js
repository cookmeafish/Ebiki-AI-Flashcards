// RAIDS (pure, tested): an optional daily fight against a raid boss, made of the deck's DUE cards (Anki's own review
// stack, so every answer is recorded as a real review, win or lose). Harder than a Legends boss: health scales with
// the cards due, typed clean strikes are needed to win (choices deal 1 and only before phase 2), lives are few, and
// a raid boss has THREE phases.
//
// Why beat it: the boss keeps its wounds across the day's attempts (a loss still hurts it), a win is a trophy in the
// raid hall, XP and a streak freeze, and the next raid boss in the rotation comes out.
export const RAID_MOTIFS = ['hydra', 'titan', 'lich', 'chimera', 'void', 'seraph', 'leviathan', 'inferno', 'chronos', 'vampire', 'tempest', 'kaleido', 'glutton', 'puppeteer', 'berserker']
// Each raid boss fights its own way (fight.js ABILITIES: the rules live there).
export const RAID_ABILITY = { hydra: 'regrowth', titan: 'plating', lich: 'phylactery', chimera: 'heads', void: 'singularity', seraph: 'judgment', leviathan: 'maelstrom', inferno: 'kindling', chronos: 'rewind', vampire: 'bloodpact', tempest: 'tempest', kaleido: 'reflection', glutton: 'devour', puppeteer: 'marionette', berserker: 'lastbreath' }
export const RAID = { minCards: 5, maxCards: 15, hpPerCard: 1.5, minHp: 8, maxHp: 40, lives: 3, phases: 3 }

export const todayKey = (d = new Date()) => d.toLocaleDateString('en-CA')

// The boss's health for a day, set by the cards due at the day's first attempt (stable for the day).
export const raidHp = (due) => Math.max(RAID.minHp, Math.min(RAID.maxHp, Math.round(Math.max(0, due) * RAID.hpPerCard)))

// Raid state per mode: { boss: index in RAID_MOTIFS, day: { date, hp, damage, attempts } | null, trophies: [{ motif, date }] }
export const newRaidState = () => ({ boss: 0, day: null, trophies: [] })
export function shapeRaid(raw) {
  const s = raw && typeof raw === 'object' ? raw : {}
  const boss = Number.isInteger(s.boss) && s.boss >= 0 ? s.boss % RAID_MOTIFS.length : 0
  const d = s.day && typeof s.day === 'object' && typeof s.day.date === 'string' ? s.day : null
  const day = d ? { date: d.date, hp: Math.max(1, Number(d.hp) || RAID.minHp), damage: Math.max(0, Number(d.damage) || 0), attempts: Math.max(0, Number(d.attempts) || 0), won: !!d.won } : null
  const trophies = (Array.isArray(s.trophies) ? s.trophies : []).filter((x) => x && RAID_MOTIFS.includes(x.motif) && typeof x.date === 'string').slice(-200)
  return { boss, day, trophies }
}
export const raidMotif = (state) => RAID_MOTIFS[shapeRaid(state).boss]

// Today's fight: yesterday's wounds heal (a new day, a fresh boss at full health for today's due cards).
export function raidToday(state, date, due) {
  const s = shapeRaid(state)
  if (s.day && s.day.date === date) return s
  return { ...s, day: { date, hp: raidHp(due), damage: 0, attempts: 0, won: false } }
}

// An attempt ended with `damage` dealt. The wounds stay for the day; a win (health gone) adds a trophy and brings
// out the next boss (tomorrow). Returns { state, won, firstWin }.
export function applyRaidAttempt(state, date, damage) {
  const s = shapeRaid(state)
  if (!s.day || s.day.date !== date) return { state: s, won: false, firstWin: false }
  const dealt = Math.max(0, Number(damage) || 0)
  const day = { ...s.day, damage: Math.min(s.day.hp, s.day.damage + dealt), attempts: s.day.attempts + 1 }
  const won = day.damage >= day.hp
  if (!won || s.day.won) return { state: { ...s, day: { ...day, won: s.day.won || won } }, won, firstWin: false }
  const motif = RAID_MOTIFS[s.boss]
  return {
    state: { boss: (s.boss + 1) % RAID_MOTIFS.length, day: { ...day, won: true }, trophies: [...s.trophies, { motif, date }] },
    won: true, firstWin: true,
  }
}

// Due cards in Anki's order: learning cards first (they are due soonest), then reviews by due day, then the rest.
export function raidOrder(cards) {
  const rank = (c) => (Number(c.queue) === 1 || Number(c.queue) === 3 ? 0 : Number(c.queue) === 2 ? 1 : 2)
  return [...cards].sort((a, b) => rank(a) - rank(b) || (Number(a.due) || 0) - (Number(b.due) || 0))
}
