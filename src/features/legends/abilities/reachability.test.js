// REACHABILITY: every effect (fx key) of every active raid boss must really happen in a NORMAL raid, not only in a
// perfect or an impossible one (the owner: "i dont want to have an ability that is impossible to ever trigger in a
// normal boss fight"). Whole raids are simulated with _sim.js (the same steps RaidRun takes), answered by a seeded
// "learner" (right with probability `acc`; right answers sometimes by choice while phase 1 allows it, sometimes
// glancing; a glancing slip comes back as an attack like in the app), and decision bosses pressed by a mix of players
// (never, sometimes, always). The test fails when an fx key fires in fewer than MIN_SHARE of TYPICAL raids.
// REACH=1 npx vitest run src/features/legends/abilities/reachability.test.js prints the full table (every condition).
import { describe, it, expect } from 'vitest'
import { ABILITY_BY_MOTIF } from './index'
import { simulateRaid } from './_sim'
import { RAID_MOTIFS } from '../raid'

// A typical raid: 10 due cards, 75% right, some choices in phase 1, some glancing answers, any button habit.
export const TYPICAL = { n: [8, 10, 12], acc: 0.75, choice: 0.3, glance: 0.15 }
const MIN_SHARE = 0.25
// A DECISION boss's effect may depend on how the player uses its buttons (Vent early or wait for the eruption): it
// passes when it fires in MIN_SHARE of typical raids over all habits, or in MIN_CHOSEN of the raids of the habit that
// goes for it (it is activatable on purpose).
const MIN_CHOSEN = 0.4
const RUNS = 160

// mulberry32: a tiny seeded generator (the test must give the same numbers every run).
function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// One learner: `acc` right; a right answer is a choice with probability `choice` where offered (the sim forces typed
// elsewhere), else glancing with probability `glance`, else clean typed.
const learner = (rand, { acc, choice, glance }) => () => {
  if (rand() >= acc) return { verdict: 'miss', mode: 'typed' }
  if (rand() < choice) return { verdict: 'clean', mode: 'choice' }
  if (rand() < glance) return { verdict: 'glancing', mode: 'typed', attackQ: { prompt: 'slip?', accepted: ['slip'] } }
  return { verdict: 'clean', mode: 'typed' }
}

// Button habits for decision bosses: never; sometimes (each enabled button with probability 1/2); greedy (every button
// the moment it lights up); patient (a button only once it has stayed lit for a question: waits for a bigger vent,
// saves coins past the cheap buy).
export const POLICIES = ['never', 'sometimes', 'greedy', 'patient']
function policyFn(name, rand) {
  if (name === 'sometimes') return (acts) => acts.filter(() => rand() < 0.5).map((x) => x.id)
  if (name === 'patient') {
    let lit = new Set()
    return (acts) => {
      const now = acts.map((x) => x.id)
      const pick = now.filter((id) => lit.has(id))
      lit = new Set(now.filter((id) => !pick.includes(id)))
      return pick
    }
  }
  return name
}

// The fx keys one raid fired (answers, button presses and the final settle).
export function firedIn(r) {
  const out = new Set()
  for (const e of r.log) if (e.after.last && e.after.last.fx && e.after.last.n !== (e.before.last && e.before.last.n)) out.add(e.after.last.fx)
  for (const a of r.acts || []) if (a.fx) out.add(a.fx)
  if (r.settled && r.settled.fx) out.add(r.settled.fx)
  return out
}

// Share of raids (0..1) in which each fx key fired, for one boss and one condition.
export function reach(motif, { n, acc, choice = 0.3, glance = 0.15, policy = 'mix', wound = 0, runs = RUNS, seed = 1 }) {
  const a = ABILITY_BY_MOTIF[motif]
  const sizes = Array.isArray(n) ? n : [n]
  const count = Object.fromEntries((a.fxKeys || []).map((k) => [k, 0]))
  let won = 0
  let phase3 = 0
  for (let i = 0; i < runs; i++) {
    const rand = rng(seed * 100003 + i * 7919 + motif.length)
    const size = sizes[i % sizes.length]
    const pol = policy === 'mix' ? POLICIES[i % POLICIES.length] : policy
    const hp = Math.max(7, Math.min(40, Math.floor(size * 1.5)))
    const r = simulateRaid(a.id, { n: size, answer: learner(rand, { acc, choice, glance }), press: a.decision ? policyFn(pol, rand) : 'never', dayBefore: Math.floor(hp * wound) })
    for (const k of firedIn(r)) if (k in count) count[k]++
    if (r.outcome === 'won') won++
    if (r.log.some((e) => e.phaseAfter >= 3)) phase3++
  }
  const share = Object.fromEntries(Object.entries(count).map(([k, v]) => [k, v / runs]))
  return { share, won: won / runs, phase3: phase3 / runs }
}

describe('reachability: every raid ability effect happens in a typical raid', () => {
  for (const motif of RAID_MOTIFS) {
    const a = ABILITY_BY_MOTIF[motif]
    it(`${motif} (${a.id}): every fx key fires in at least ${MIN_SHARE * 100}% of typical raids`, () => {
      const { share } = reach(motif, TYPICAL)
      const best = a.decision ? POLICIES.map((p) => reach(motif, { ...TYPICAL, policy: p }).share) : []
      const chosen = (k) => Math.max(0, ...best.map((b) => b[k]))
      const low = Object.entries(share).filter(([k, v]) => v < MIN_SHARE && !(a.decision && chosen(k) >= MIN_CHOSEN)).map(([k, v]) => `${k} ${Math.round(v * 100)}%`)
      expect(low, `${motif}: rare effects in a typical raid`).toEqual([])
    })
  }

  it('report (REACH=1 prints every condition)', () => {
    if (!process.env.REACH) return
    const conds = []
    for (const n of [5, 10, 15]) for (const acc of [0.4, 0.6, 0.75, 0.9]) conds.push({ label: `n${n} ${Math.round(acc * 100)}%`, n, acc })
    conds.push({ label: 'n10 75% typed', n: 10, acc: 0.75, choice: 0 })
    conds.push({ label: 'n10 75% choicy', n: 10, acc: 0.75, choice: 0.7 })
    conds.push({ label: 'n10 75% wounded', n: 10, acc: 0.75, wound: 0.5 })
    const rows = []
    for (const motif of RAID_MOTIFS) {
      const a = ABILITY_BY_MOTIF[motif]
      const typ = reach(motif, TYPICAL)
      const results = conds.map((c) => reach(motif, { ...c, runs: 120 }))
      const pols = a.decision ? POLICIES.map((p) => [p, reach(motif, { ...TYPICAL, policy: p, runs: 120 })]) : []
      rows.push(`\n## ${motif} (${a.id})${a.decision ? ' [decision]' : ''}  typical: won ${Math.round(typ.won * 100)}%, reached phase 3 ${Math.round(typ.phase3 * 100)}%`)
      rows.push(`| fx | typical | ${conds.map((c) => c.label).join(' | ')}${pols.map(([p]) => ` | ${p}`).join('')} |`)
      rows.push(`|---|---|${conds.map(() => '---').join('|')}|${pols.map(() => '---|').join('')}`)
      for (const k of a.fxKeys || []) {
        const pct = (x) => `${Math.round(x * 100)}`
        rows.push(`| ${k} | **${pct(typ.share[k])}** | ${results.map((r) => pct(r.share[k])).join(' | ')}${pols.map(([, r]) => ` | ${pct(r.share[k])}`).join('')} |`)
      }
    }
    process.stdout.write(`${rows.join('\n')}\n`)
  })
})
