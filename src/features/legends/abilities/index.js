// RAID ABILITY REGISTRY. One pure module per raid boss: abilities/<motif>.js (the motif = the raid boss, raid.js
// RAID_MOTIFS), default-exporting its descriptor. Nobody edits this file to add or change an ability: every
// abilities/*.js file is picked up by the glob below (files starting with "_", tests and this index are skipped).
// The hook interface is documented in abilities/_contract.js.
const files = import.meta.glob(['./*.js', '!./_*.js', '!./*.test.js', '!./index.js'], { eager: true })

const byMotif = {}
const byId = {}
for (const [file, mod] of Object.entries(files)) {
  const d = mod && mod.default
  if (!d || typeof d !== 'object' || !d.id) continue
  const motif = file.replace(/^\.\//, '').replace(/\.js$/, '')
  const desc = { ...d, motif }
  byMotif[motif] = desc
  byId[d.id] = desc
}

// motif -> descriptor, and ability id -> descriptor.
export const ABILITY_BY_MOTIF = byMotif
export const ABILITY_BY_ID = byId
export const abilityForMotif = (motif) => byMotif[motif] || null
export const abilityById = (id) => (id && byId[id]) || null
// Every ability id (by motif name; raid.js RAID_ABILITY gives the rotation's order).
export const ABILITY_IDS = Object.keys(byMotif).sort().map((m) => byMotif[m].id)

// Tests only: put a made-up ability into the registry (each vitest file has its own module graph, so it never leaks).
export function registerAbilityForTest(motif, descriptor) {
  const desc = { ...descriptor, motif }
  byMotif[motif] = desc
  byId[desc.id] = desc
  return desc
}
