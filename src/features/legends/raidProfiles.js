// RAID BOSS PROFILES (pure, tested by profiles.test.js): each raid boss's own fight, crafted like its ability.
//   hp      the boss's health (set, never from the cards due: a run is only a slice of the siege)
//   hearts  the player's hearts against it (carried across runs, full again each new day and for a new boss)
//   heal    health the boss gets back each new day (flat: a big boss never heals a huge chunk)
//   slots   powers one run may use (powers.js)
// FAIRNESS (the owner's rule): a bigger boss always comes with more hearts, or an ability that protects the player
// (Chronos' sand, the Seraph's Mercy, the Vampire's wards, the Ophanim's grace). Bosses whose ability punishes misses
// (Hydra's heads, the Berserker's axe, the Lich's minions) get more hearts. profiles.test.js simulates every boss with
// its own ability: a 65% learner beats each one in a handful of runs, a 60% learner still beats them all, and later
// bosses take more runs than earlier ones. Tune the numbers here and run that test.
export const RAID_PROFILES = {
  chronos: { hp: 30, hearts: 4, heal: 3, slots: 1 },
  banshee: { hp: 34, hearts: 4, heal: 3, slots: 1 },
  seraph: { hp: 38, hearts: 4, heal: 3, slots: 1 },
  titan: { hp: 55, hearts: 6, heal: 4, slots: 2 },
  vampire: { hp: 40, hearts: 4, heal: 4, slots: 1 },
  gorgon: { hp: 42, hearts: 4, heal: 4, slots: 2 },
  chimera: { hp: 60, hearts: 6, heal: 4, slots: 2 },
  ratking: { hp: 48, hearts: 5, heal: 4, slots: 2 },
  showman: { hp: 50, hearts: 5, heal: 4, slots: 2 },
  reaper: { hp: 60, hearts: 5, heal: 4, slots: 3 },
  leviathan: { hp: 70, hearts: 6, heal: 5, slots: 2 },
  lich: { hp: 56, hearts: 6, heal: 4, slots: 2 },
  cerberus: { hp: 64, hearts: 6, heal: 4, slots: 2 },
  tempest: { hp: 66, hearts: 6, heal: 5, slots: 2 },
  dreamer: { hp: 70, hearts: 6, heal: 3, slots: 2 },
  berserker: { hp: 50, hearts: 5, heal: 4, slots: 2 },
  inferno: { hp: 78, hearts: 7, heal: 5, slots: 2 },
  swarmqueen: { hp: 76, hearts: 7, heal: 5, slots: 2 },
  moonmaw: { hp: 80, hearts: 7, heal: 5, slots: 2 },
  hydra: { hp: 86, hearts: 8, heal: 6, slots: 3 },
  kaleido: { hp: 84, hearts: 7, heal: 5, slots: 2 },
  puppeteer: { hp: 88, hearts: 7, heal: 5, slots: 2 },
  sugarqueen: { hp: 78, hearts: 7, heal: 4, slots: 2 },
  kitsune: { hp: 94, hearts: 8, heal: 5, slots: 2 },
  ophanim: { hp: 98, hearts: 7, heal: 5, slots: 3 },
  void: { hp: 120, hearts: 9, heal: 6, slots: 3 },
}
// A boss without a profile (a newer build's boss read by this one): a middling fight.
export const DEFAULT_PROFILE = { hp: 50, hearts: 5, heal: 4, slots: 2 }
// The most hearts any profile gives (stored hearts are clamped to it before the boss's own number).
export const MAX_HEARTS = Math.max(...Object.values(RAID_PROFILES).map((p) => p.hearts))
export const raidProfile = (motif) => RAID_PROFILES[motif] || DEFAULT_PROFILE
