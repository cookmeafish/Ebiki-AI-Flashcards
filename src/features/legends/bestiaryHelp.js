// What Ebi's Help knows about the BESTIARY (pure, tested by bestiaryHelp.test.js): every raid boss (number in the
// progression, name, ability and its effects, family, lore), the player's own raid progress, and what the asset view /
// bestiary shows right now. Names, rules and lore come from the app's i18n texts (`t`), so Ebi reads them in the app
// language; the scaffolding around them is plain English facts like the rest of the Help context.
//
// No card, question or answer is ever in here: a raid's questions are the deck's cards (QuizRunner reports the one on
// screen, without its key). Published by HelpBridge.jsx (the catalog, every screen) and AssetView.jsx (the bestiary).
import { RAID, RAID_ORDER, RAID_ABILITY, raidBossNumber, shapeRaid, raidMotif, isRaidMotif, SIEGE_RULE, raidToday, siegeOf } from './raid'
import { raidProfile } from './raidProfiles'
import { POWER_IDS, LOADOUT_MAX, bossesBeaten, unlockedPowers, nextUnlock, shapeLoadout } from './powers'
import { MOTIFS } from './map'
import { bestiaryRows } from './abilities/_triggers'
import { FAMILY_TREES, FAMILY_MISFITS, familyMotifs } from './families'

export const CATALOG_MAX = 5800 // the full catalog, on the Legends screen and the bestiary (App keeps 6000 per entry)
// Everywhere else the catalog is COMPACT (Help's prompt goes out with every message; the full one cost ~1450 tokens on
// every screen): the rules in brief, the progress and powers, the current boss's ability in one line, every boss
// named with its ability and family. Practice gets it compact too: a raid run there publishes its own entry (boss,
// ability and its rule, hearts, powers), and an activity's own entry needs the room.
export const CATALOG_COMPACT_MAX = 3600
export const RAID_SCREENS = new Set(['legends', 'assets'])
export const raidCatalogMaxFor = (tab) => (RAID_SCREENS.has(tab) ? CATALOG_MAX : CATALOG_COMPACT_MAX)
export const BESTIARY_MAX = 3900 // the bestiary screen (useHelpEntry keeps 4000)
const LORE_MAX = 600

const clip = (s, n) => {
  const x = String(s ?? '').replace(/\s+/g, ' ').trim()
  return x.length > n ? x.slice(0, n - 1) + '…' : x
}
const cap = (text, n) => (text.length > n ? text.slice(0, n - 1) + '…' : text)
// t() falls back to the key itself: a missing text is left out, never shown as a key name.
const tx = (t, key, vars) => {
  if (typeof t !== 'function') return ''
  const v = t(key, vars)
  return v && v !== key ? String(v) : ''
}

export const raidBossName = (t, motif) => tx(t, `lg_raidBoss_${motif}`) || motif

// The family trees a boss is drawn in (the asset view's "Boss families"): its tree's name, and what it is made from.
export function familyOf(motif) {
  const trees = FAMILY_TREES.filter((tr) => familyMotifs(tr).includes(motif))
  const misfit = FAMILY_MISFITS.motifs.includes(motif)
  return { trees, misfit, madeFrom: trees.flatMap((tr) => tr.links[motif] || []) }
}
function familyLine(t, motif, withFrom = true) {
  const f = familyOf(motif)
  const names = f.trees.map((tr) => tx(t, `lg_famTree_${tr.id}`) || tr.id)
  if (f.misfit) names.push(tx(t, 'lg_famTree_misfits') || 'misfits')
  if (!names.length) return ''
  const from = !withFrom ? [] : f.madeFrom.map((m) => (isRaidMotif(m) ? raidBossName(t, m) : m))
  return `family: ${names.join(', ')}${from.length ? ` (made from ${from.join(' + ')})` : ''}`
}

// How raids work, for "how do I beat ...": the shared rules every raid boss adds its ability to.
export const RAID_RULES = `Raid rules (every raid boss): the DUE cards become the questions (each card's first answer is a real Anki review); ${RAID.phases} phases. A clean typed answer deals 2, a glancing one (tested thing right, something else wrong) 1, a choice 1 (choices are always offered, every phase, attacks included); every 3rd clean answer in a row is a critical (+1). A miss costs a heart and comes back later as the boss's attack. ${SIEGE_RULE} A win gives a trophy, XP and a streak freeze. Tips: type answers (not choices), keep clean streaks, use the boss's ability below.`
// The same rules in brief, for the compact catalog (off the raid screens; the full ones come with Legends and Practice).
export const RAID_RULES_SHORT = `Raid rules in brief: the DUE cards become the questions (each card's first answer is a real Anki review); ${RAID.phases} phases. A clean typed answer deals 2, a glancing one 1, a choice 1; every 3rd clean answer in a row is a critical. A miss costs a heart and comes back as the boss's attack. A SIEGE: wounds stay until the boss is beaten; losing every heart in a run makes the boss rally (heals half that run's damage, hearts full again); each new day the hearts refill and the boss heals a little. Powers unlock for good by beating DIFFERENT bosses; up to ${LOADOUT_MAX} are brought into a fight, each works once. A win gives a trophy, XP and a streak freeze.`

// One raid boss as facts. `full`: also every effect (what the player does, what happens) and the lore.
export function raidBossFacts(t, motif, { full = false, lore = full, ids = true, madeFrom = true, fxName } = {}) {
  const ability = RAID_ABILITY[motif] || ''
  const num = raidBossNumber(motif)
  const head = `#${num || '?'} ${raidBossName(t, motif)}${ids ? ` (${motif})` : ''}`
  const ab = ability ? `ability "${tx(t, `lg_ability_${ability}`) || ability}": ${tx(t, `lg_abilityDesc_${ability}`)}` : 'no ability'
  const fam = familyLine(t, motif, madeFrom)
  const out = [`${head}: ${ab}${fam ? ` · ${fam}` : ''}`]
  if (!full) return out[0]
  const rows = ability ? bestiaryRows(motif, ability) : []
  for (const { fx, tr } of rows) {
    const name = (typeof fxName === 'function' && fxName(ability, fx)) || fx
    out.push(`  - ${name}${tr.choice ? ' [the player\'s choice: a button]' : ''}: trigger: ${tx(t, tr.whenKey, tr.vars)} Effect: ${tx(t, tr.doesKey, tr.vars)}`)
  }
  const story = lore ? tx(t, `lg_raidLore_${motif}`) : ''
  if (story) out.push(`  Lore: ${clip(story, LORE_MAX)}`)
  return out.join('\n')
}

// The player's raid progress (stored raid state) in a line or two. `raid` may be null (never fought).
export function raidProgressText(t, raid, today = '', known = true) {
  if (!known) return "The player's raid progress could not be read right now (not loaded yet, or the data folder is unreachable)."
  if (!raid) return `The player's raid: not started in this mode (the first boss is #1 ${raidBossName(t, RAID_ORDER[0])}).`
  const r = shapeRaid(raid)
  const motif = raidMotif(r)
  const num = raidBossNumber(motif)
  const next = RAID_ORDER[num % RAID_ORDER.length]
  // The siege brought forward to today (hearts back, the daily heal), as the next fight would start it.
  const siege = siegeOf(r) ? (today ? raidToday(r, today, 0) : r) : null
  const g = siege ? siege.siege || siegeOf(siege) : null
  const runs = siege && siege.day && (!today || siege.day.date === today) ? siege.day.attempts : 0
  const beatenToday = r.day && r.day.won && (!today || r.day.date === today)
  const wins = {}
  for (const tr of r.trophies) wins[tr.motif] = (wins[tr.motif] || 0) + 1
  const hall = Object.entries(wins).map(([m, n]) => `${isRaidMotif(m) ? raidBossName(t, m) : `${m} (retired)`}${n > 1 ? ` x${n}` : ''}`)
  return [
    `The player's raid: current boss #${num} ${raidBossName(t, motif)} of ${RAID_ORDER.length}${g ? `, siege health ${Math.max(0, g.hp - g.damage)}/${g.hp} (wounds carry over), hearts ${g.hearts}/${Math.max(g.hearts, raidProfile(motif, g?.variant).hearts)}, ${runs} run(s) today` : ', not come out yet (fresh health and full hearts at its first fight)'}${beatenToday ? `; a boss was beaten today` : ''}. Next after a win: #${raidBossNumber(next)} ${raidBossName(t, next)}.`,
    `Raid trophies: ${r.trophies.length}${hall.length ? ` (${hall.join(', ')})` : ''}.`,
  ].join('\n')
}

// The player's POWERS (powers.js), for "which powers do I have", "what unlocks next", "what am I bringing": unlocked by
// DIFFERENT raid bosses beaten (trophies), the loadout picked for the next fight (features.legends.raidLoadout, shaped
// like the raid intro shapes it), and the next unlock. Unknown progress says so.
export function raidPowersText(t, raid, loadout, known = true) {
  if (!known) return ''
  const name = (id) => tx(t, `lg_pow_${id}`) || id
  const beaten = bossesBeaten(raid ? shapeRaid(raid) : null)
  const open = unlockedPowers(beaten)
  // The current siege's power numbers (a variant may change how many powers come along), else the normal ones.
  const g = raid ? siegeOf(raid) : null
  const max = g ? raidProfile(raidMotif(raid), g.variant).powers.loadoutMax : LOADOUT_MAX
  const bring = shapeLoadout(loadout, beaten, max)
  const next = nextUnlock(beaten)
  return [
    `The player's powers: ${beaten} different raid boss(es) beaten; unlocked ${open.length} of ${POWER_IDS.length}${open.length ? ` (${open.map(name).join(', ')})` : ' (none yet: the first unlocks at 1 boss beaten)'}.`,
    open.length ? `Brought into the next fight (up to ${max}, picked on the raid intro): ${bring.length ? bring.map(name).join(', ') : 'none'}.` : '',
    next ? `Next unlock: ${name(next.id)} at ${next.beaten} different bosses beaten (${next.beaten - beaten} to go).` : 'Every power is unlocked.',
  ].filter(Boolean).join(' ')
}

// THE CATALOG (every screen): the rules, the player's progress, the current boss in full, then every raid boss in
// progression order, one line each. Lines carry the ability's rule; when the budget runs out, the bosses FARTHEST
// ahead of the player's current boss lose their rule first (name, ability name and family stay). `max` below
// CATALOG_MAX (off the raid screens, raidCatalogMaxFor) = COMPACT: the current boss's ability in one line instead of
// every effect, every other boss short; never so small that a boss loses its line.
export function raidCatalogText({ t, raid = null, known = true, today = '', fxName, loadout, max = CATALOG_MAX } = {}) {
  const cur = raid ? raidMotif(raid) : RAID_ORDER[0]
  const compact = (Number(max) || CATALOG_MAX) < CATALOG_MAX
  const top = [
    'RAID BOSSES AND THE BESTIARY (facts for questions like "which raid boss is next", "what does the Lich do", "how do I beat the Hydra", "what family is X in"). The bestiary is the asset view (cheat mode): every boss with its ability, effects, lore and family.',
    compact ? RAID_RULES_SHORT : RAID_RULES,
    raidProgressText(t, raid, today, known),
    raidPowersText(t, raid, loadout, known),
    compact ? `Current boss: ${raidBossFacts(t, cur, { madeFrom: false })}` : `Current boss in full:\n${raidBossFacts(t, cur, { full: true, lore: false, fxName })}`,
    'All raid bosses in progression order (a win brings out the next):',
  ].filter(Boolean).join('\n')
  const longLine = (m) => `- ${raidBossFacts(t, m, { ids: false, madeFrom: false })}`
  const shortLine = (m) => {
    const ab = RAID_ABILITY[m]
    const fam = familyLine(t, m, false)
    return `- #${raidBossNumber(m)} ${raidBossName(t, m)}: ${tx(t, `lg_ability_${ab}`) || ab}${fam ? ` · ${fam}` : ''}`
  }
  const lines = RAID_ORDER.map(compact ? shortLine : longLine)
  const n = RAID_ORDER.length
  const at = Math.max(0, RAID_ORDER.indexOf(cur))
  const size = () => top.length + lines.reduce((s, l) => s + l.length + 1, 0)
  // Farthest ahead first (the bosses just behind the current one were beaten already: also far).
  // Every boss stays named: a budget below the rules plus one short line per boss grows to fit them.
  const floor = top.length + RAID_ORDER.reduce((s, m) => s + shortLine(m).length + 1, 0) + 1
  const limit = Math.min(CATALOG_MAX, Math.max(floor, Number(max) || CATALOG_MAX))
  for (let d = n - 1; d > 0 && size() > limit; d--) {
    const i = (at + d) % n
    lines[i] = shortLine(RAID_ORDER[i])
  }
  return cap([top, ...lines].join('\n'), limit)
}

// The bestiary's tabs as Help names them (AssetView.jsx TABS ids).
export const BESTIARY_TABS = { legends: 'Legends bosses', raids: 'Raid bosses', families: 'Boss families', ebi: 'Ebi drafts' }

// THE BESTIARY ON SCREEN: which tab, which boss, the phase shown, a test fight. `map`: the player's Legends map (to name
// the areas a Legends boss guards). `ebiPick`: the Ebi draft on screen. `phase`: the raid phase the demo arena shows.
export function bestiaryHelpText({ t, tab = 'legends', motif = '', phase = 1, shot = '', testFight = '', map = null, ebiPick = '', fxName } = {}) {
  const out = [`The BESTIARY (asset view, cheat mode) is open on the "${BESTIARY_TABS[tab] || tab}" tab. Tabs: Legends bosses (${MOTIFS.length}), Raid bosses (${RAID_ORDER.length}), Boss families (${FAMILY_TREES.length}), Ebi drafts. The arrow keys step through the list.`]
  if (testFight) {
    out.push(`A TEST FIGHT against raid boss #${raidBossNumber(testFight)} ${raidBossName(t, testFight)} is running (started with "Fight this boss"): a real raid on today's due cards whose answers are real Anki reviews, but the stored raid (wounds, trophies, which boss is next) does not change and it pays no boss reward. Never give the answer of the question on screen unless asked.`)
    out.push(raidBossFacts(t, testFight, { full: true, fxName }))
  } else if (tab === 'raids' && motif) {
    out.push(`On screen: raid boss ${raidBossFacts(t, motif, { full: true, fxName })}`)
    out.push(`The phase demo arena shows phase ${phase} of ${RAID.phases}${shot ? `; the effect "${(typeof fxName === 'function' && fxName(RAID_ABILITY[motif], shot)) || shot}" was just played with "Try it"` : ''}. The page also shows its entrance, its phases 1 to ${RAID.phases}, its fight sizes, its palettes, its lore and its voice (the line it taunts with), and "Fight this boss" (a test fight).`)
  } else if (tab === 'legends' && motif) {
    const i = MOTIFS.indexOf(motif)
    const areas = (Array.isArray(map?.areas) ? map.areas : []).filter((a) => a && a.motif === motif)
    const fam = familyLine(t, motif)
    out.push(`On screen: Legends stage #${i + 1} "${motif}" (a Legends area boss and its banner, the lair it lives in; Legends bosses get a name from what their area teaches).${fam ? ` Its ${fam}.` : ''}`)
    out.push(areas.length
      ? `On the player's map it guards: ${areas.map((a) => `"${clip(a.title, 60)}"${a.bossName ? ` (boss "${clip(a.bossName, 40)}")` : ''}${a.status ? `, ${a.status}` : ''}`).join('; ')}.`
      : 'No area of the player\'s current map uses it.')
    out.push('The page shows its entrance, its boss at fight and map sizes, locked, its banner and every palette.')
  } else if (tab === 'families') {
    out.push('On screen: the boss family trees (each raid boss is "made from" one to three Legends or raid bosses):')
    for (const tr of FAMILY_TREES) {
      const name = tx(t, `lg_famTree_${tr.id}`) || tr.id
      const why = tx(t, `lg_famWhy_${tr.id}`)
      const from = Object.entries(tr.links).map(([c, ps]) => `${isRaidMotif(c) ? raidBossName(t, c) : c} <- ${ps.map((p) => (isRaidMotif(p) ? raidBossName(t, p) : p)).join(' + ')}`).join('; ')
      out.push(`- ${name}: ${from}${why ? `. ${why}` : ''}`)
    }
    out.push(`- ${tx(t, 'lg_famTree_misfits') || 'Misfits'}: ${FAMILY_MISFITS.motifs.join(', ')}. ${tx(t, 'lg_famWhy_misfits')}`)
  } else if (tab === 'ebi') {
    out.push(`On screen: Ebi drafts, redrawn candidates of Ebi (the app's shrimp) shown only here so they can be compared with the current Ebi; nothing else uses them.${ebiPick ? ` Showing: ${ebiPick}.` : ''}`)
  }
  return cap(out.join('\n'), BESTIARY_MAX)
}
