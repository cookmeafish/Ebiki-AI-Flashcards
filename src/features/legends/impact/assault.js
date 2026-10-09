// THE BOSS'S ATTACK ON THE PLAYER (pure, tested by assault.test.js): when a raid boss takes a heart, its attack must
// visibly HIT the player (the owner: "show them actually doing something to harm the player and make it impactful").
// The player is the camera and the hearts row: the attack leaves the boss, TRAVELS across the arena card to the heart
// it takes, and LANDS on the screen (claws tear it, teeth close on it, glass cracks, fire washes over...), the heart
// shatters and the card's edges flash red. impact/AssaultFx.jsx draws it; BossArena plays it on every strike that
// costs a heart (a plain miss, a missed attack, an ability's blow), bigger on a heavy blow (two hearts or more).
//
// Every boss has its OWN pair (travel, impact): no two bosses share both. Colors and the glyph come from the boss's
// impact style (impact/styles.js); `tint` overrides the impact's color where the boss's own would read wrong.

import { BOSS_DATA } from './bosses'

export const TRAVELS = ['thrown', 'swarm', 'shards', 'orb', 'beam', 'bolt', 'lunge', 'arc', 'chain', 'wave', 'shadow']
export const IMPACTS = ['claws', 'cut', 'bite', 'crush', 'blast', 'crack', 'burn', 'frost', 'flood', 'curse', 'shock', 'poison', 'drain']

export const RAID_ASSAULT = Object.fromEntries(Object.entries(BOSS_DATA).map(([m, d]) => [m, d.assault]))

export const DEFAULT_ASSAULT = { travel: 'orb', impact: 'blast' }
export const assaultFor = (motif) => RAID_ASSAULT[motif] || DEFAULT_ASSAULT

// How it plays (ms after the arena's delay): the boss winds up (its own strike body move), the attack travels, lands.
export const ASSAULT = {
  travelAt: 120, // the attack leaves the boss
  travelMs: { thrown: 380, swarm: 420, shards: 360, orb: 400, beam: 240, bolt: 200, lunge: 320, arc: 300, chain: 280, wave: 380, shadow: 420 },
  holdMs: 900, // the impact stays this long after it lands, then fades
  fadeMs: 260,
  big: 1.3, // a heavy blow (two hearts or more): everything this much bigger, the impact twice
}
// When the attack lands (ms from the start).
export const landAt = (travel) => ASSAULT.travelAt + (ASSAULT.travelMs[travel] || 360)
// The whole attack's length (ms): the layer unmounts after it.
export const assaultMs = (travel) => landAt(travel) + ASSAULT.holdMs + ASSAULT.fadeMs
