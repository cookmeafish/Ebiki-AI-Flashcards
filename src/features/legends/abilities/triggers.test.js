// EVERY EFFECT DOES WHAT ITS BESTIARY LINE SAYS (the owner: "make sure that it actually does work when x thing
// happens"). For every active raid boss and every fx key (and every button), the situation its lg_fxWhen_ text names is
// played through fight.js's real strike / act / settle path and must fire that fx on its last step; a NEAR MISS (one
// answer short, the wrong kind of answer) must not fire it anywhere. The counts come from the module's K and the same
// vars the text shows (_triggers.js), so the text and the behavior cannot drift apart.
//
// Step notation: 'C' clean typed right · 'G' glancing (typed, right with a slip) · 'H' right by choice · 'M' miss ·
// 'A+' / 'A-' an attack blocked / missed · 'I+:kind' / 'I-:kind' an inserted question (minion, loop) right / missed ·
// { act: id } a button press · { arm: id, hit: 'C' } an armed toggle, then the answer · 'S' the questions ran out.
import { describe, it, expect } from 'vitest'
import { newFight, strike, act, settleFight } from '../fight'
import { ABILITY_BY_MOTIF } from './index'
import { RAID_MOTIFS } from '../raid'
import { TRIGGERS, triggerOf, bestiaryRows } from './_triggers'
import { facetAt } from './kaleido'
import en from '../../../i18n/locales/en.js'
import es from '../../../i18n/locales/es.js'
import zh from '../../../i18n/locales/zh.js'
import ja from '../../../i18n/locales/ja.js'

const rep = (n, x) => Array.from({ length: n }, () => x)
const HIT = {
  C: { verdict: 'clean', mode: 'typed' }, G: { verdict: 'glancing', mode: 'typed' }, H: { verdict: 'clean', mode: 'choice' },
  M: { verdict: 'miss', mode: 'typed' }, 'A+': { verdict: 'clean', mode: 'typed', attack: true }, 'A-': { verdict: 'miss', mode: 'typed', attack: true },
}

// Play `steps` against `motif`; returns the fx of every step, in order.
export function play(motif, steps, { total = 300, start = {} } = {}) {
  const ability = ABILITY_BY_MOTIF[motif].id
  const bar = { total, before: 0, phases: 3 }
  const opts = { ability, need: total, lives: 99, bar }
  let s = { ...newFight(), ...start }
  const fx = []
  steps.forEach((step, i) => {
    if (step === 'S') { s = settleFight(s, opts); fx.push(s.last ? s.last.fx : ''); return }
    if (step && step.act) { s = act(s, { type: step.act }, opts); fx.push(s.last ? s.last.fx : ''); return }
    let h
    if (step && step.arm) h = { ...HIT[step.hit], armed: { [step.arm]: true } }
    else if (typeof step === 'string' && step.startsWith('I')) h = { verdict: step[1] === '+' ? 'clean' : 'miss', mode: 'typed', inserted: step.slice(3) }
    else h = HIT[step]
    s = strike(s, { ...h, key: 500 + i }, opts)
    fx.push(s.last ? s.last.fx : '')
  })
  return { fx, state: s }
}

// Kaleido: a right answer on the 1st question, misses until a question shows a color already held (or not held), then a
// right answer there.
function kaleidoSteps(held) {
  const have = new Set([facetAt(0)])
  const steps = ['C']
  for (let i = 1; i < 30; i++) {
    if (have.has(facetAt(i)) === held) return [...steps, 'C']
    steps.push('M')
  }
  throw new Error('no such facet in 30 questions')
}

// One row per fx key: `fire` ends on that fx; `near` never shows it. `opts` for play (a smaller bar for a phase line).
function scenarios(motif, K) {
  switch (motif) {
    case 'hydra': return {
      sever: { fire: ['C'], near: ['M'] },
      grow: { fire: ['M'], near: ['A-'] },
      cauterize: { fire: rep(K.base, 'C'), near: rep(K.base - 1, 'C') },
    }
    case 'titan': return {
      crack: { fire: ['C'], near: ['H', 'G'] },
      shatter: { fire: rep(K.plates, 'C'), near: [...rep(K.plates - 1, 'C'), 'G'] },
      exposedHit: { fire: [...rep(K.plates, 'C'), ...rep(K.window, 'G')], near: [...rep(K.plates, 'C'), 'M', 'A+'] },
    }
    case 'lich': return {
      raise: { fire: rep(K.every, 'C'), near: rep(K.every - 1, 'C') },
      burst: { fire: ['I+:minion'], near: ['I-:minion'] },
      escape: { fire: ['C', 'I-:minion'], near: ['C', 'I+:minion'] },
    }
    case 'chimera': {
      // 300 health: heads of 100. Felling the head in line takes ~45 clean answers; use a 30 bar (heads of 10).
      const fell = rep(5, 'C') // 2 + 2 + 3 (crit) + 2 + 2 = 11 >= 10
      return {
        maul: { fire: ['C'], near: ['M'] },
        aim: { fire: [{ act: 'aim-lion' }], near: [{ act: 'aim-goat' }] }, // the Goat is already in line
        fallGoat: { fire: fell, near: rep(4, 'C'), opts: { total: 30 } },
        fallLion: { fire: [{ act: 'aim-lion' }, ...fell], near: fell, opts: { total: 30 } },
        fallSerpent: { fire: [{ act: 'aim-serpent' }, ...fell], near: fell, opts: { total: 30 } },
        goatBlock: { fire: [...fell, 'M'], near: [...rep(4, 'C'), 'M'], opts: { total: 30 } },
      }
    }
    case 'void': return {
      absorb: { fire: ['C'], near: ['M'] },
      collapse: { fire: rep(K.every, 'C'), near: rep(K.every - 1, 'C') },
      spill: { fire: ['C', 'M'], near: ['M'] },
    }
    case 'seraph': return {
      // verdicts in phase 1: Mercy, none, Wrath, Mercy...
      wrath: { fire: ['C', 'C', 'C'], near: ['C', 'C', 'M'] },
      grace: { fire: ['C'], near: ['M'] },
      mercy: { fire: ['M'], near: ['C'] },
    }
    case 'leviathan': return {
      row: { fire: ['C'], near: ['M'] },
      crest: { fire: rep(K.max - K.start, 'C'), near: rep(K.max - K.start - 1, 'C') },
      surf: { fire: rep(K.max - K.start + 1, 'C'), near: rep(K.max - K.start, 'C') },
      pulled: { fire: ['C', 'M'], near: ['C'] },
      wipeout: { fire: [...rep(K.max - K.start, 'C'), 'M'], near: [...rep(K.max - K.start - 1, 'C'), 'M'] },
    }
    case 'inferno': return {
      heat: { fire: ['C'], near: ['M'] },
      cool: { fire: ['C', 'M'], near: ['M'] },
      vent: { fire: [...rep(K.ventMin, 'C'), { act: 'vent' }], near: [...rep(K.ventMin - 1, 'C'), { act: 'vent' }] },
      blast: { fire: [...rep(K.bigVent + 1, 'C'), { act: 'vent' }], near: [...rep(K.bigVent, 'C'), { act: 'vent' }] },
      erupt: { fire: rep(K.max, 'C'), near: rep(K.max - 1, 'C') },
    }
    case 'chronos': {
      const toFull = (K.max - K.start) * K.every // right answers that fill the glass
      return {
        rewind: { fire: ['M'], near: ['A-'] }, // an attack is never rewound
        paradox: { fire: ['I+:loop'], near: ['I-:loop'] },
        grain: { fire: rep(K.every, 'C'), near: rep(K.every - 1, 'C') },
        overflow: { fire: rep(toFull + K.every, 'C'), near: rep(toFull + K.every - 1, 'C') },
        timestop: { fire: rep(toFull + K.every + 1, 'C'), near: [...rep(toFull + K.every, 'C'), 'M'] },
      }
    }
    case 'vampire': return {
      drip: { fire: ['C'], near: ['M'] },
      ward: { fire: rep(K.streak, 'C'), near: [...rep(K.streak - 1, 'C'), 'M', 'C'] },
      burst: { fire: [...rep(K.streak, 'C'), 'M'], near: [...rep(K.streak - 1, 'C'), 'M'] },
      feast: { fire: rep(K.streak * (K.max + 1), 'C'), near: [...rep(K.streak, 'C'), 'M', ...rep(K.streak, 'C')] },
    }
    case 'tempest': return {
      drum: { fire: ['C'], near: ['M'] },
      dud: { fire: ['M'], near: ['C'] },
      thunder: { fire: ['C', 'M', 'M', 'M'], near: ['M', 'M', 'M', 'M'] },
    }
    case 'kaleido': return {
      shard: { fire: ['C'], near: ['M'] },
      prism: { fire: ['C', 'C', 'C'], near: ['C', 'C'] },
      overcharge: { fire: kaleidoSteps(true), near: kaleidoSteps(false) },
    }
    case 'puppeteer': return {
      steal: { fire: rep(K.every, 'C'), near: rep(K.every - 1, 'C') },
      kick: { fire: [...rep(K.every, 'C'), 'C'], near: [...rep(K.every - 1, 'C'), 'M', 'C'] },
      yank: { fire: [...rep(K.every, 'C'), 'M'], near: [...rep(K.every - 1, 'C'), 'M'] },
    }
    case 'berserker': return {
      cleave: { fire: [{ arm: 'swing', hit: 'C' }], near: ['C'] },
      whiff: { fire: [{ arm: 'swing', hit: 'M' }], near: ['M'] },
      taunt: { fire: rep(K.taunt, 'C'), near: [...rep(K.taunt - 1, 'C'), { arm: 'swing', hit: 'C' }] },
    }
    case 'swarmqueen': {
      const full = Math.ceil(K.cells / (1 + K.spread))
      return {
        ignite: { fire: ['C'], near: ['M'] },
        douse: { fire: ['C', 'M'], near: ['M'] },
        ablaze: { fire: rep(full, 'C'), near: rep(full - 1, 'C') },
      }
    }
    case 'gorgon': return {
      charge: { fire: ['C'], near: ['A+'] },
      reflect: { fire: rep(K.every, 'C'), near: [...rep(K.every - 1, 'C'), 'M'] },
      stoned: { fire: [...rep(K.every - 1, 'C'), 'M'], near: rep(K.every, 'C') },
    }
    case 'banshee': return {
      wail: { fire: ['M'], near: ['C'] },
      shatter: { fire: ['M', 'C'], near: ['C', 'C'] },
    }
    case 'reaper': return {
      // a 30 bar: phase 1 ends at 20 health left, the line starts there; glancing answers deal 1 and raise it 1.
      climb: { fire: ['G'], near: ['M'], opts: { total: 30 } },
      reap: { fire: rep(5, 'G'), near: rep(4, 'G'), opts: { total: 30 } },
    }
    case 'dreamer': return {
      deeper: { fire: ['C'], near: ['M'] },
      nightmare: { fire: rep(K.depth + 1, 'C'), near: rep(K.depth, 'C') },
      wake: { fire: ['M'], near: ['A-'] },
      hum: { fire: ['M', 'C'], near: ['M', 'M'] },
      lullaby: { fire: ['M', ...rep(K.need, 'C')], near: ['M', ...rep(K.need - 1, 'C'), 'M'] },
    }
    case 'moonmaw': return {
      charge: { fire: ['C'], near: ['H'] },
      launch: { fire: rep(K.every, 'C'), near: [...rep(K.every - 1, 'C'), 'H'] },
      impact: { fire: [...rep(K.every, 'C'), ...rep(K.delay, 'M')], near: [...rep(K.every, 'C'), ...rep(K.delay - 1, 'M')] },
    }
    case 'kitsune': return {
      volley: { fire: ['C'], near: ['M'] },
      starfall: { fire: rep(K.at, 'C'), near: [...rep(K.at - 1, 'C'), 'M'] },
      caught: { fire: ['C', 'M'], near: ['M'] },
    }
    case 'ophanim': return {
      open: { fire: ['C'], near: ['M'] },
      blink: { fire: ['C', 'M'], near: ['M'] },
      grace: { fire: ['M', ...rep(K.perPhase, 'C')], near: ['M', ...rep(K.perPhase - 1, 'C')] },
      beam: { fire: rep(K.perPhase, 'C'), near: ['M', ...rep(K.perPhase, 'C')] }, // a lost heart: Grace instead
    }
    case 'ratking': return {
      loot: { fire: ['C'], near: ['M'] },
      stolen: { fire: ['C', 'M'], near: ['M'] },
      bomb: { fire: [...rep(K.bomb, 'C'), { act: 'bomb' }], near: [...rep(K.bomb - 1, 'C'), { act: 'bomb' }] },
      buyTail: { fire: [...rep(K.tail, 'C'), { act: 'tail' }], near: [...rep(K.tail - 1, 'C'), { act: 'tail' }] },
      tail: { fire: [...rep(K.tail, 'C'), { act: 'tail' }, 'M'], near: [...rep(K.tail, 'C'), 'M'] },
    }
    case 'sugarqueen': return {
      cube: { fire: ['C'], near: ['M'] },
      rush: { fire: rep(K.jar, 'C'), near: rep(K.jar - 1, 'C') },
      sweet: { fire: rep(K.jar + 1, 'C'), near: [...rep(K.jar, 'C'), 'M'] },
      crash: { fire: [...rep(K.jar, 'C'), 'M'], near: [...rep(K.jar - 1, 'C'), 'M'] },
    }
    case 'showman': return {
      laugh: { fire: ['C'], near: ['M'] },
      encore: { fire: rep(K.laughs, 'C'), near: rep(K.laughs - 1, 'C') },
      tear: { fire: ['M'], near: ['C'] },
      twist: { fire: rep(K.tears, 'M'), near: rep(K.tears - 1, 'M') },
    }
    case 'cerberus': return {
      bindFire: { fire: ['H'], near: ['M'] },
      bindIron: { fire: ['C'], near: ['H', 'G'] },
      bindShadow: { fire: ['A+'], near: ['A-'] },
      bound: { fire: ['C', 'H', 'A+'], near: ['C', 'H', 'M', 'A+'] },
      snap: { fire: ['H', 'M'], near: ['M'] },
    }
    default: return {}
  }
}

const LOCALES = { en, es, zh, ja }

describe('every raid ability effect fires when its bestiary line says, and not one step before', () => {
  for (const motif of RAID_MOTIFS) {
    const mod = ABILITY_BY_MOTIF[motif]
    describe(`${motif} (${mod.id})`, () => {
      const rows = scenarios(motif, mod.K || {})
      it('has a trigger entry and a scenario for every fx key, and nothing more', () => {
        expect(Object.keys(TRIGGERS[motif] || {}).sort()).toEqual([...mod.fxKeys].sort())
        expect(Object.keys(rows).sort()).toEqual([...mod.fxKeys].sort())
      })
      for (const fx of mod.fxKeys) {
        it(`${fx}: fires in its situation, never in the near miss`, () => {
          const row = rows[fx]
          const fire = play(motif, row.fire, row.opts)
          expect(fire.fx[fire.fx.length - 1], `${motif} ${fx} fire: ${fire.fx.join(',')}`).toBe(fx)
          const near = play(motif, row.near, row.opts)
          expect(near.fx, `${motif} ${fx} near miss`).not.toContain(fx)
        })
      }
      it('decision buttons: every button id the module offers is named by a choice effect', () => {
        const choices = mod.fxKeys.filter((fx) => triggerOf(motif, fx).choice)
        expect(choices.length > 0).toBe(!!mod.decision)
      })
      it('every effect has its two texts in all four languages, with the same placeholders filled', () => {
        for (const fx of mod.fxKeys) {
          const tr = triggerOf(motif, fx)
          for (const [lang, dict] of Object.entries(LOCALES)) {
            for (const key of [tr.whenKey, tr.doesKey]) {
              expect(typeof dict[key], `${lang} ${key}`).toBe('string')
              const used = [...dict[key].matchAll(/\{(\w+)\}/g)].map((m) => m[1])
              for (const v of used) expect(tr.vars[v], `${lang} ${key} {${v}}`).not.toBe(undefined)
            }
          }
        }
      })
    })
  }
})

describe('bestiaryRows (the asset view ability card)', () => {
  it('one row per effect of the module, in its order, each with its texts', () => {
    for (const motif of RAID_MOTIFS) {
      const mod = ABILITY_BY_MOTIF[motif]
      if (!mod) continue
      const rows = bestiaryRows(motif, mod.id)
      expect(rows.map((r) => r.fx), motif).toEqual((mod.fxKeys || []).filter((fx) => triggerOf(motif, fx)))
      for (const r of rows) expect(r.tr.whenKey).toBe(`lg_fxWhen_${motif}_${r.fx}`)
    }
    expect(bestiaryRows('hydra', '')).toEqual([])
  })
})
