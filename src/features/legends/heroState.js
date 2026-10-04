// THE RAID HERO (pure; named heroState.js, not raidHero.js: on Windows that resolves the same as RaidHero.jsx): what the Practice hub's big raid card shows, from today's stored raid and the deck's due count.
// Never writes anything: raidToday() only computes today's state the way the fight will start it (the siege brought
// forward: hearts back, the boss healed a little per day). RaidHero.jsx renders it.
import { RAID, RAID_ORDER, RAID_ABILITY, raidToday, raidMotif, raidBossNumber, isRaidMotif, siegeOf, raidAsked } from './raid'

// Each raid boss's signature color, picked from its own drawing (its fire, eyes, gold...): the hero card's stage is
// tinted with it. Art data like the drawings themselves, so fixed colors in both themes. A boss missing here uses the
// app's danger red (raidTint).
export const RAID_TINT = {
  chronos: '#d9a640', banshee: '#4fd8e8', seraph: '#f5d27a', titan: '#ff6a14', vampire: '#d0142c', gorgon: '#41b56c',
  chimera: '#ee4a18', ratking: '#c38a1e', showman: '#2fc489', reaper: '#3fd6ff', leviathan: '#ff5a2a', lich: '#4dff96',
  cerberus: '#3fe0c0', tempest: '#2f8fd0', dreamer: '#ff3df0', berserker: '#ff4318', inferno: '#ff5a14',
  swarmqueen: '#eb951a', moonmaw: '#b8a8ff', hydra: '#6fb6f0', kaleido: '#ff7a1a', puppeteer: '#ff2b3d',
  sugarqueen: '#ff3d8b', kitsune: '#e0233e', ophanim: '#ffc650', void: '#9a5cff',
}
export const raidTint = (motif, fallback) => RAID_TINT[motif] || fallback

// The cards today's fight would use: one per note, capped like RaidRun (RAID.maxCards).
export const raidUses = (dueNotes) => Math.min(Math.max(0, Number(dueNotes) || 0), RAID.maxCards)

// `stored`: the raid state as read (null = never fought), `date`: todayKey(), `due`: due NOTES in the mode deck (null =
// not counted yet, NaN = the count failed), or `dueIds` (the due note ids: notes a raid already answered today are left
// out, the next run takes other cards). `anki`: false when the card store is known closed or the mode has no deck;
// `hasKey`: an AI key exists (the fight writes its questions with it).
// Returns { kind, motif, num, total, ability, hp, left, damage, attempts, due, uses, runs, hearts, heartsMax, beaten,
// beatenToday, healthKnown }:
//   kind: 'counting' (due not known yet) | 'ready' (a fight is possible) | 'few' (a FRESH boss needs minCards due) |
//         'none' (0 due) | 'hearts' (no hearts left: tomorrow) | 'beaten' (only with RAID.nextBossSameDay off: `motif`
//         is tomorrow's boss, `beaten` today's) | 'anki' | 'nokey' | 'unknown' (count failed)
//   runs: the fights (RAID.maxCards each) today's due cards make; beatenToday: a boss beaten today (the next is out).
export function raidHeroState({ stored = null, date, due = null, dueIds = null, anki = true, hasKey = true } = {}) {
  const motif = raidMotif(stored)
  const asked = new Set(raidAsked(stored, date).map(String))
  const count = Array.isArray(dueIds) ? dueIds.filter((id) => !asked.has(String(id))).length : due
  const counted = typeof count === 'number' && Number.isFinite(count)
  const uses = counted ? raidUses(count) : 0
  const ongoing = !!siegeOf(stored) // this boss already came out: its health and wounds are known
  // Today as the fight would start it. A boss not out yet takes its health from the due cards, so it waits for the count.
  const today = raidToday(stored, date, counted ? count : 0)
  const day = today.day
  const hearts = today.siege ? today.siege.hearts : RAID.lives
  const won = [...(today.trophies || [])].reverse().find((x) => x.date === date)
  const base = {
    motif, num: raidBossNumber(motif), total: RAID_ORDER.length, ability: RAID_ABILITY[motif] || '',
    hp: day.hp, damage: day.damage, left: Math.max(0, day.hp - day.damage), attempts: day.attempts, due: counted ? count : null, uses,
    runs: counted ? Math.ceil(count / RAID.maxCards) : 0, hearts, heartsMax: RAID.lives,
    healthKnown: ongoing || counted, beaten: '', beatenToday: won && isRaidMotif(won.motif) ? won.motif : '',
  }
  if (day.won) return { ...base, kind: 'beaten', beaten: base.beatenToday }
  if (hearts <= 0) return { ...base, kind: 'hearts' }
  if (!anki) return { ...base, kind: 'anki' }
  if (!hasKey) return { ...base, kind: 'nokey' }
  if (count === null || count === undefined) return { ...base, kind: 'counting' }
  if (!counted) return { ...base, kind: 'unknown' }
  if (count <= 0) return { ...base, kind: 'none' }
  if (!ongoing && uses < RAID.minCards) return { ...base, kind: 'few' }
  return { ...base, kind: 'ready' }
}
