// THE RAID HERO (pure; named heroState.js, not raidHero.js: on Windows that resolves the same as RaidHero.jsx): what the Practice hub's big raid card shows, from today's stored raid and the deck's due count.
// Never writes anything: raidToday() only computes today's state the way the fight will start it (yesterday's wounds
// healed, health from the cards due). RaidHero.jsx renders it.
import { RAID, RAID_ORDER, RAID_ABILITY, raidToday, raidMotif, raidBossNumber, isRaidMotif } from './raid'

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
// not counted yet, NaN = the count failed). `anki`: false when the card store is known closed or the mode has no deck;
// `hasKey`: an AI key exists (the fight writes its questions with it).
// Returns { kind, motif, num, total, ability, hp, left, damage, attempts, due, uses, beaten }:
//   kind: 'counting' (due not known yet) | 'ready' (a fight is possible) | 'few' (1 to minCards - 1 due) | 'none' (0 due)
//         | 'beaten' (won today: `motif` is tomorrow's boss, `beaten` today's) | 'anki' | 'nokey' | 'unknown' (count failed)
export function raidHeroState({ stored = null, date, due = null, anki = true, hasKey = true } = {}) {
  const motif = raidMotif(stored)
  const counted = typeof due === 'number' && Number.isFinite(due)
  const uses = counted ? raidUses(due) : 0
  // Today as the fight would start it. With no count yet, the health of an untouched day is unknown (it comes from
  // the due cards), so it waits for the count; a day already fought keeps its stored health.
  const today = raidToday(stored, date, uses)
  const day = today.day
  const fought = !!(stored && stored.day && stored.day.date === date)
  const base = {
    motif, num: raidBossNumber(motif), total: RAID_ORDER.length, ability: RAID_ABILITY[motif] || '',
    hp: day.hp, damage: day.damage, left: Math.max(0, day.hp - day.damage), attempts: day.attempts, due: counted ? due : null, uses,
    healthKnown: fought || counted, beaten: '',
  }
  if (fought && day.won) {
    const won = [...(today.trophies || [])].reverse().find((x) => x.date === date)
    return { ...base, kind: 'beaten', beaten: won && isRaidMotif(won.motif) ? won.motif : '' }
  }
  if (!anki) return { ...base, kind: 'anki' }
  if (!hasKey) return { ...base, kind: 'nokey' }
  if (due === null || due === undefined) return { ...base, kind: 'counting' }
  if (!counted) return { ...base, kind: 'unknown' }
  if (due <= 0) return { ...base, kind: 'none' }
  if (uses < RAID.minCards) return { ...base, kind: 'few' }
  return { ...base, kind: 'ready' }
}
