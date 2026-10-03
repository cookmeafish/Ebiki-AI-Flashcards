// BOSS FAMILIES (EXPERIMENTAL, asset view only): each raid boss is "made from" one to three other bosses (Legends
// bosses and/or another raid boss), drawn as family trees in the cheat-mode asset view's "Boss families" tab.
// Nothing outside the asset view reads this. TO REMOVE THE FEATURE, delete:
//   1. src/features/legends/families.js (this file) and src/features/legends/families.test.js
//   2. src/features/legends/BossFamilies.jsx
//   3. in src/features/legends/AssetView.jsx: the `import ... from './BossFamilies'` / `'./families'` lines, the
//      `families` entry of TABS and the `tab === 'families' ? <BossFamilies ... /> :` render branch
//   4. every key starting with `lg_fam` in src/i18n/locales/en.js, es.js, zh.js and ja.js
// Pure data + helpers (no React, no browser), tested by families.test.js.
import { MOTIFS } from './map'
import { RAID_MOTIFS } from './raid'

// `top` = the raid boss at the top of the tree; `links[child]` = the bosses it is made from (1 to 3), drawn below it.
// A child that is itself a parent in `links` (puppeteer <- showman <- stage + carnival) makes a deeper tree.
// i18n: lg_famTree_<id> (name) and lg_famWhy_<id> (one plain sentence why).
export const FAMILY_TREES = [
  { id: 'foxfire', top: 'kitsune', links: { kitsune: ['sakura'] } },
  { id: 'candyLand', top: 'sugarqueen', links: { sugarqueen: ['sweets'] } },
  { id: 'sewers', top: 'ratking', links: { ratking: ['sewer'] } },
  { id: 'theater', top: 'puppeteer', links: { puppeteer: ['showman'], showman: ['stage', 'carnival'] } },
  { id: 'heavens', top: 'ophanim', links: { ophanim: ['seraph'], seraph: ['celestial'] } },
  { id: 'deepDream', top: 'void', links: { void: ['dreamer'], dreamer: ['ocean', 'dream', 'fungal'] } },
  { id: 'livingIsle', top: 'leviathan', links: { leviathan: ['mountains', 'pirate'] } },
  { id: 'serpentTemple', top: 'gorgon', links: { gorgon: ['jungle'] } },
  { id: 'prismBrood', top: 'hydra', links: { hydra: ['crystal'] } },
  { id: 'mirrorCourt', top: 'kaleido', links: { kaleido: ['mirror', 'arena'] } },
  { id: 'eclipse', top: 'moonmaw', links: { moonmaw: ['space'] } },
  { id: 'bloodMoon', top: 'vampire', links: { vampire: ['moonlit'] } },
  { id: 'forge', top: 'titan', links: { titan: ['junkyard', 'city'] } },
  { id: 'sandsOfTime', top: 'chronos', links: { chronos: ['clockwork', 'desert'] } },
  { id: 'thunderhead', top: 'tempest', links: { tempest: ['sky'] } },
  { id: 'emberThrone', top: 'inferno', links: { inferno: ['volcano'] } },
  { id: 'warlords', top: 'berserker', links: { berserker: ['dojo', 'castle'] } },
  { id: 'crypt', top: 'lich', links: { lich: ['graveyard', 'library'] } },
  { id: 'haunting', top: 'banshee', links: { banshee: ['manor'] } },
  { id: 'paleRide', top: 'reaper', links: { reaper: ['frontier'] } },
  { id: 'beastPit', top: 'chimera', links: { chimera: ['savanna'] } },
  { id: 'lastGate', top: 'cerberus', links: { cerberus: ['underworld'] } },
  { id: 'hive', top: 'swarmqueen', links: { swarmqueen: ['hive'] } },
]

// Legends bosses with no raid boss of their own yet (no lines). i18n: lg_famTree_misfits, lg_famWhy_misfits.
export const FAMILY_MISFITS = { id: 'misfits', motifs: ['forest', 'ice', 'swamp', 'lab', 'arcade', 'garden', 'mine', 'primeval'] }

export const MAX_PARENTS = 3

// 'raids' or 'bosses' (the LegendsArt kind and the asset view tab it opens in: 'raids' / 'legends').
export const familyKind = (motif) => (RAID_MOTIFS.includes(motif) ? 'raids' : MOTIFS.includes(motif) ? 'bosses' : null)

// The tree as nested nodes: { motif, kind, parents: [node] }. `seen` stops a (tested-impossible) cycle.
export function familyNode(tree, motif = tree.top, seen = new Set()) {
  const parents = seen.has(motif) ? [] : (tree.links[motif] || [])
  const next = new Set(seen).add(motif)
  return { motif, kind: familyKind(motif), parents: parents.map((p) => familyNode(tree, p, next)) }
}

// Every motif a tree draws (top first).
export function familyMotifs(tree) {
  const out = []
  const walk = (n) => { out.push(n.motif); n.parents.forEach(walk) }
  walk(familyNode(tree))
  return out
}
