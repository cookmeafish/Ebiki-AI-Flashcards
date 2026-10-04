// What Ebi's Help knows about Legends (pure, tested): the learner's map, level, raids and what is on screen right now,
// written as plain facts for the Help prompt. Published by HelpBridge.jsx through ctx.help.set.
//
// SECRET RULE: while a quiz, a boss fight or a raid runs, nothing here may give away an answer: no item backs and no
// expected answers (the running question itself is published by QuizRunner, without its key). After a step ends, its
// result screen (asked / expected / given) is on screen anyway, so it is shared.
import { itemTier, areaCodex, mapProgress, helperCount, WEAK_RATIO } from './map'
import { RAID, RAID_ABILITY, shapeRaid, raidMotif, siegeOf, raidToday } from './raid'
import { learnerLine } from '../kit/learner'

export const HELP_MAX = 5000
const BACK_MAX = 90
const LIVE_VIEWS = new Set(['node', 'raid', 'placement'])

// The screen's live state (LegendsScreen sets it; HelpBridge listens). Not React state: Help reads it on any screen.
let live = { view: 'map' }
const listeners = new Set()
export const legendsLive = () => live
export function setLegendsLive(next) {
  live = next && typeof next === 'object' ? next : { view: 'map' }
  for (const l of listeners) l()
}
export const onLegendsLive = (fn) => { listeners.add(fn); return () => listeners.delete(fn) }
// A recall running in a modal over the map (Gold blitz, the chest): the map view stays, but its answers are live.
let holds = 0
export function holdLegendsSecret(on) {
  holds = Math.max(0, holds + (on ? 1 : -1))
  live = { ...live } // a new snapshot, so listeners re-read
  for (const l of listeners) l()
}
export const legendsSecretHeld = () => holds > 0

const short = (s, n = BACK_MAX) => {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim()
  return t.length > n ? t.slice(0, n - 1) + '…' : t
}
const KIND = { learn: 'lesson', practice: 'practice', rule: 'rule lesson', scene: 'story scene', talk: 'Talk (conversation)', adventure: 'Adventure (mission)', weak: 'Weak spots', boss: 'boss fight' }

const list = (v) => (Array.isArray(v) ? v.filter((x) => x && typeof x === 'object') : [])
function areaLine(a, i, current) {
  const steps = list(a.nodes).filter((n) => !n.optional && n.kind !== 'boss')
  const done = steps.filter((n) => n.status === 'done').length
  const boss = list(a.nodes).find((n) => n.kind === 'boss')
  const stars = list(a.nodes).reduce((s, n) => s + (n.stars || 0), 0)
  const codex = areaCodex({ ...a, items: list(a.items) })
  const bits = [
    `${a.status}${current ? ', CURRENT' : ''}`,
    a.detailed ? `${done}/${steps.length} levels done, ${stars} stars` : 'not detailed yet',
    a.bossName ? `boss "${a.bossName}"${boss?.status === 'done' ? ' beaten' : ''}` : boss?.status === 'done' ? 'boss beaten' : '',
    a.legendary ? 'Legendary challenge won' : '',
    a.bonusLife ? 'has the Weak spots extra life' : '',
    codex.total ? `codex ${codex.gold} gold, ${codex.silver} silver, ${codex.bronze} bronze, ${codex.new} new of ${codex.total}` : '',
  ].filter(Boolean)
  return `${i + 1}. "${a.title}"${a.theme ? ` (${short(a.theme, 60)})` : ''}: ${bits.join('; ')}`
}

// The facts block. Item lists (fronts) only while the LEGENDS screen is the tab (`onLegends`): on another screen a
// front can be the answer of the question there (a raid from the Practice tile asks the deck's cards, and Legends items
// become cards); their meanings only when nothing runs there either (`secret`: a step, fight, raid, exam, blitz).
export function buildLegendsHelpText({ map: rawMap, learner, raid, live: lv = { view: 'map' }, isLanguage = false, today = '', onLegends = true, held = false } = {}) {
  const out = []
  // A damaged or merged map (null areas, a string where a list belongs) is read as far as it is sound.
  const map = rawMap && typeof rawMap === 'object'
    ? { ...rawMap, areas: list(rawMap.areas).map((a) => ({ ...a, nodes: list(a.nodes), items: list(a.items) })), days: rawMap.days && typeof rawMap.days === 'object' ? rawMap.days : {} }
    : null
  const secret = LIVE_VIEWS.has(lv.view) || held
  const level = learner ? learnerLine(learner, isLanguage) : ''
  out.push(`Legends learner level: ${level || 'not set yet (no placement exam, no reading of their study history, no "I am new" choice)'}.`)
  if (!map?.areas?.length) {
    out.push('Legends map: none yet for this mode (the learner has not started Legends, or started over).')
  } else {
    const p = mapProgress(map)
    const cur = (map.areas || []).find((a) => a.status === 'open') || null
    out.push(`Legends map: ${p.areasDone}/${p.areasTotal} areas cleared, ${p.nodesDone}/${p.nodesTotal} steps done, ${p.stars} stars${p.finished ? ', whole map finished' : ''}.`)
    if (map.start?.goal || map.start?.reason) out.push(`Why they started: ${short([map.start.reason, map.start.goal].filter(Boolean).join('; '), 200)}.`)
    if (map.start?.placement?.level != null) out.push(map.start.placement.from === 'evidence' ? `Starting level ${Math.round(map.start.placement.level)}, read from what Ebiki had seen of the learner's studying (no exam).` : `Placement exam result: level ${Math.round(map.start.placement.level)}.`)
    const h = map.helpers || {}
    if (helperCount(map)) out.push(`Helpers held: ${h.scroll || 0} hint scroll(s), ${h.shield || 0} shield(s).`)
    const days = Object.entries(map.days || {}).sort(([a], [b]) => (a < b ? 1 : -1)).slice(0, 7)
    if (days.length) out.push(`Recent Legends days (steps finished): ${days.map(([d, n]) => `${d}: ${n}`).join(', ')}.`)
    out.push('Areas (bottom of the map first):')
    list(map.areas).slice(0, 24).forEach((a, i) => out.push(areaLine(a, i, a === cur)))
    // The current area in detail: its levels and what they teach (fronts always; backs only when nothing is running).
    if (cur?.detailed && onLegends) {
      out.push(`Current area "${cur.title}" levels:`)
      for (const n of list(cur.nodes)) {
        out.push(`- ${KIND[n.kind] || n.kind}${n.title ? ` "${n.title}"` : ''}: ${n.status}${n.stars ? `, ${n.stars} stars` : ''}${n.attempts ? `, ${n.attempts} tries` : ''}${n.goal ? `, mission: ${short(n.goal, 120)}` : ''}`)
      }
      const items = list(cur.items).filter((it) => it.front).slice(0, 24)
      if (items.length && secret) {
        // A question is running: on a language card the front IS the answer ("How do you say 'one'?" = uno).
        out.push(`"${cur.title}" teaches ${items.length} items (not listed while a question is running).`)
      } else if (items.length) {
        out.push(`What "${cur.title}" teaches (${secret ? 'fronts only while a question is running' : 'front: meaning'}; codex tier, answered right/seen):`)
        for (const it of items) out.push(`- ${short(it.front, 60)}${secret ? '' : `: ${short(it.back)}`} [${itemTier(it)}, ${it.right || 0}/${it.seen || 0}]`)
      }
      if (cur.nemesis?.itemIds?.length && !secret) {
        const byId = new Map(list(cur.items).map((it) => [it.id, it]))
        out.push(`Lost the boss fight last time; missed items the rematch asks again: ${cur.nemesis.itemIds.map((id) => byId.get(id)?.front).filter(Boolean).map((f) => short(f, 40)).join(', ')}.`)
      }
      if (Array.isArray(cur.canDo) && cur.canDo.length) out.push(`Passport (what they can do after this area): ${cur.canDo.map((c) => short(c, 80)).join(' | ')}.`)
    }
    // Weak items across the map (fronts only: a weak item can be the answer to the next question).
    const weak = !onLegends || secret ? [] : map.areas.flatMap((a) => list(a.items).filter((it) => it.front && (it.seen || 0) >= 2 && (it.right || 0) / it.seen < WEAK_RATIO).map((it) => ({ it, r: (it.right || 0) / it.seen })))
      .sort((x, y) => x.r - y.r).slice(0, 12)
    if (weak.length) out.push(`Weakest Legends items (right/seen): ${weak.map(({ it }) => `${short(it.front, 40)} (${it.right || 0}/${it.seen})`).join(', ')}.`)
  }
  if (raid) {
    const r = shapeRaid(raid)
    const motif = raidMotif(r)
    // The siege brought forward to today (hearts back, the daily heal): wounds and hearts carry over between days.
    const g = siegeOf(r) ? (today ? raidToday(r, today, 0).siege : siegeOf(r)) : null
    const runs = r.day && (!today || r.day.date === today) && !r.day.won ? r.day.attempts : 0
    out.push(`Daily raid (due Anki cards as a boss fight; each card's first answer is a real review; a siege: the boss's wounds and the player's hearts carry over, each new day +1 heart and the boss heals ${Math.round(RAID.healPerDay * 100)}%): the boss now is the ${motif} (ability: ${RAID_ABILITY[motif]})${g ? `, health ${Math.max(0, g.hp - g.damage)}/${g.hp}, hearts ${g.hearts}/${RAID.lives}, ${runs} run(s) today` : ', not come out yet'}; ${r.trophies.length} raid trophies won.`)
  }
  // What is on the Legends screen right now.
  const where = {
    map: 'the map', intro: 'the Legends welcome screen', questionnaire: 'the start questionnaire', placement: 'the placement exam (running: no answers)',
    edit: 'Change my map (a before/after preview of a map edit)', raid: 'a RAID fight (running: no answers)', assets: 'the asset viewer (cheat mode)', placed: 'the starting level result', inferring: 'Ebiki reading the learner study history to set a level',
  }
  if (!onLegends) {
    // Not on screen: no "On screen: the map" on another tab (it contradicted the real screen).
  } else if (lv.view === 'node' && lv.node) {
    out.push(`On screen: ${KIND[lv.node.kind] || lv.node.kind}${lv.node.title ? ` "${lv.node.title}"` : ''} in area "${lv.area?.title || ''}" (running: never give its answers unless asked explicitly).`)
  } else if (lv.view === 'result' && lv.result) {
    const r = lv.result
    const res = r.res || {}
    out.push(`On screen: the result of ${KIND[r.node?.kind] || r.node?.kind || 'a step'}${r.node?.title ? ` "${r.node.title}"` : ''} in "${r.area?.title || ''}": ${r.passed ? 'cleared' : 'not cleared'}, ${res.correct ?? 0}/${res.total ?? 0} right, ${r.stars || 0} stars${r.areaDone ? ', area cleared' : ''}.`)
    const misses = (res.misses || []).slice(0, 10)
    if (misses.length) out.push(`Missed there: ${misses.map((m) => `"${short(m.asked, 80)}" expected "${short(m.expected, 60)}"${m.answered ? `, they wrote "${short(m.answered, 40)}"` : ''}`).join('; ')}.`)
  } else {
    out.push(`On screen: ${where[lv.view] || 'the map'}.`)
  }
  const text = out.join('\n')
  return text.length > HELP_MAX ? text.slice(0, HELP_MAX - 1) + '…' : text
}

// What part of the Legends screen is shown (Help names it next to the screen: kit/useHelp.js `where`, depth 1; a raid
// or the bestiary opened inside Legends report themselves deeper). Plain words, never an answer.
export function legendsWhere(lv = { view: 'map' }) {
  const v = lv?.view || 'map'
  if (v === 'node' && lv.node) return `a Legends step running: ${KIND[lv.node.kind] || lv.node.kind}${lv.node.title ? ` "${short(lv.node.title, 60)}"` : ''}${lv.area?.title ? ` in area "${short(lv.area.title, 60)}"` : ''}`
  if (v === 'result') return `the result screen of a Legends step${lv.result?.node?.title ? ` ("${short(lv.result.node.title, 60)}")` : ''}`
  return {
    map: 'the Legends map', intro: 'the Legends welcome screen', questionnaire: 'the Legends start questionnaire', placement: 'the Legends placement exam (running)',
    edit: 'Change my map (a map edit preview)', raid: 'a daily raid fight', assets: 'the bestiary (asset view)', placed: 'the starting level result', inferring: 'Ebiki reading the study history to set a level',
  }[v] || 'the Legends map'
}
