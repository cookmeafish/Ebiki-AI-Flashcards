// Crash resilience: every SHAPER of persisted or AI data the UI trusts gets seeded random junk (null, numbers,
// strings, arrays, odd nested objects, huge strings, prototype-ish keys) and must never throw and must return the
// shape its callers rely on. A throw here is a blank screen (or a dead screen) for whoever saved that data.
import { describe, it, expect } from 'vitest'
import { shapeMap, normalizeMap, parseAreaDetail, parseMapPlan } from '../features/legends/map'
import { shapeLedger, mergeLedgers, mergeGrammarLogs } from '../discover/merge'
import { shapeProfile, shapeLevel } from '../features/kit/learnerContext'
import { shapeRaid, siegeOf, regenSiege } from '../features/legends/raid'
import { shapeLoadout, bossesBeaten } from '../features/legends/powers'
import { raidHeroState } from '../features/legends/heroState'
import { shapeLearner } from '../features/kit/learner'
import { computeStreak, weekRow, leagueBoard, friendStreak, mergePlayers, dayTotals, isRestDay, tierFor, weekStart } from '../features/game/engine'
import { sanitizeQuestions } from '../features/kit/grade'
import { parseQuestions } from '../features/legends/prompt'
import { compilePbq, studentView, gradePbq } from '../pbq/engine'
import { activitySignature, lastActiveAt, isAbandoned, unsyncedInSnapshot, pendingRatings, hadProgress } from '../utils/studySession'
import { diffConfig, flattenConfig, mergeConfigPatch } from '../utils/configDiff'

const { deepMergeJson } = await import('../../vite.config.js')

// Small deterministic PRNG (mulberry32): the same seed gives the same junk, so a failure reproduces.
const rngOf = (seed) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const KEYS = ['__proto__', 'constructor', 'prototype', 'toString', 'valueOf', 'id', 'areas', 'nodes', 'items', 'status', 'kind', 'title', 'hp', 'damage', 'hearts', 'date', 'boss', 'day', 'trophies', 'siege', 'days', 'xp', 'level', 'questions', 'choices', 'answer', 'q', 'a', 'pairs', 'groups', 'steps', 'known', 'declined', 'cards', 'motif', 'raidLoadout', 'restDays', 'restDates', 'goalXp', 'summary', 'estimate', 'history', 'peak', 'band', '', '0', 'length']
const STRINGS = ['', ' ', 'x', 'NaN', '2026-10-07', 'not-a-date', '9999-99-99', '<img src=x onerror=1>', 'null', '[]', '{}', '\u0000', '😀', '名前', 'مرحبا', 'a'.repeat(5000)]

function junk(rand, depth = 0) {
  const r = rand()
  if (depth > 3 || r < 0.1) return null
  if (r < 0.15) return undefined
  if (r < 0.3) return [0, -1, 1, 1.5, NaN, Infinity, -Infinity, 1e15, 3][Math.floor(rand() * 9)]
  if (r < 0.45) return STRINGS[Math.floor(rand() * STRINGS.length)]
  if (r < 0.5) return rand() < 0.5
  if (r < 0.7) return Array.from({ length: Math.floor(rand() * 5) }, () => junk(rand, depth + 1))
  const o = {}
  const n = Math.floor(rand() * 6)
  for (let i = 0; i < n; i++) {
    const k = KEYS[Math.floor(rand() * KEYS.length)]
    // defineProperty so '__proto__' becomes an own key (JSON.parse does that too), never the prototype.
    Object.defineProperty(o, k, { value: junk(rand, depth + 1), enumerable: true, writable: true, configurable: true })
  }
  return o
}

// Also run what JSON round-tripping would produce (what really sits on disk).
const parsedJunk = (rand) => { const j = junk(rand); try { return JSON.parse(JSON.stringify(j) ?? 'null') } catch { return null } }

const RUNS = 400
function fuzz(name, fn, check = () => true) {
  it(`${name} never throws on junk`, () => {
    const fails = []
    for (let seed = 1; seed <= RUNS && fails.length < 3; seed++) {
      const rand = rngOf(seed)
      const input = seed % 2 ? junk(rand) : parsedJunk(rand)
      try {
        const out = fn(input, rand)
        if (!check(out, input)) fails.push(`seed ${seed}: bad shape ${String(JSON.stringify(out)).slice(0, 160)}`)
      } catch (e) {
        fails.push(`seed ${seed}: ${e && e.message} for ${String(JSON.stringify(input)).slice(0, 160)}`)
      }
    }
    expect(fails).toEqual([])
  })
}

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v)
const clean = (s) => s

describe('Legends map shapers', () => {
  fuzz('shapeMap', (x) => shapeMap(x), (o) => o === null || isObj(o))
  // normalizeMap passes a non-map through (it only ever sees shapeMap's output); it must still not throw.
  fuzz('normalizeMap', (x) => normalizeMap(x))
  fuzz('normalizeMap on a shaped map', (x) => normalizeMap(shapeMap(x)), (o) => o === null || isObj(o))
  fuzz('parseMapPlan', (x) => parseMapPlan(x, clean), (o) => o == null || isObj(o) || Array.isArray(o))
  fuzz('parseAreaDetail', (x) => parseAreaDetail(x, clean), (o) => o == null || isObj(o))
  fuzz('parseQuestions', (x) => parseQuestions(x, clean), (o) => Array.isArray(o))
  fuzz('parseQuestions from text', (x) => parseQuestions(JSON.stringify(x) ?? '', clean), (o) => Array.isArray(o))
})

describe('Discover and learner shapers', () => {
  fuzz('shapeLedger', (x) => shapeLedger(x), (o) => o == null || isObj(o))
  fuzz('mergeLedgers', (x, r) => mergeLedgers(x, junk(r)))
  fuzz('mergeGrammarLogs', (x, r) => mergeGrammarLogs(x, junk(r), (s) => String(s?.t ?? '')), (o) => o == null || Array.isArray(o))
  fuzz('learnerContext shapeProfile', (x) => shapeProfile(x))
  fuzz('learnerContext shapeLevel', (x) => shapeLevel(x))
  fuzz('shapeLearner', (x) => shapeLearner(x), (o) => o == null || isObj(o))
})

describe('Raid and power shapers', () => {
  fuzz('shapeRaid', (x) => shapeRaid(x), (o) => isObj(o))
  fuzz('siegeOf', (x) => siegeOf(x), (o) => o == null || isObj(o))
  fuzz('regenSiege on a shaped siege', (x, r) => regenSiege(siegeOf(shapeRaid(x)), [null, '2026-10-07', 'junk', 5][Math.floor(r() * 4)]))
  fuzz('shapeLoadout', (x, r) => shapeLoadout(x, bossesBeaten(junk(r))), (o) => Array.isArray(o))
  fuzz('bossesBeaten', (x) => bossesBeaten(x), (o) => Number.isFinite(o))
  fuzz('raidHeroState', (x, r) => raidHeroState({ stored: x, date: '2026-10-07', due: [null, 0, 3, NaN, 40][Math.floor(r() * 5)], dueIds: r() < 0.5 ? null : [1, 2, '3', 4] }), (o) => isObj(o))
})

describe('Game engine on junk players', () => {
  const today = '2026-10-07'
  fuzz('computeStreak', (x) => computeStreak(x, today), (o) => isObj(o))
  fuzz('weekRow', (x) => weekRow(x, today), (o) => Array.isArray(o))
  fuzz('leagueBoard', (x, r) => leagueBoard(x, [junk(r), junk(r)], today), (o) => o == null || isObj(o) || Array.isArray(o))
  fuzz('friendStreak', (x, r) => friendStreak(x, junk(r), today))
  fuzz('mergePlayers', (x, r) => mergePlayers(x, junk(r)), (o) => o == null || isObj(o))
  fuzz('dayTotals', (x) => dayTotals(x, today), (o) => isObj(o))
  fuzz('isRestDay', (x) => isRestDay(x, today), (o) => typeof o === 'boolean')
  fuzz('tierFor', (x) => tierFor(x, weekStart(today)))
})

describe('Quiz and PBQ shapers', () => {
  fuzz('sanitizeQuestions', (x) => sanitizeQuestions(x), (o) => Array.isArray(o))
  fuzz('sanitizeQuestions dual', (x) => sanitizeQuestions(x, { dual: true }), (o) => Array.isArray(o))
  fuzz('compilePbq + studentView + gradePbq', (x, r) => {
    const p = compilePbq(x, r)
    if (p?.ok) { studentView(p.pbq); gradePbq(p.pbq, junk(r)) }
    return p
  }, (o) => o == null || isObj(o))
})

describe('Study session and config shapers', () => {
  fuzz('studySession helpers', (x, r) => {
    activitySignature(isObj(x) ? x : {}); lastActiveAt(x); isAbandoned(x); unsyncedInSnapshot(x)
    pendingRatings(junk(r), junk(r)); hadProgress(junk(r))
    return true
  })
  fuzz('flattenConfig', (x) => flattenConfig(x))
  fuzz('diffConfig', (x, r) => { const cur = isObj(x) ? x : {}; return diffConfig(r() < 0.3 ? null : flattenConfig(junk(r)), flattenConfig(cur), cur) })
  fuzz('mergeConfigPatch', (x, r) => mergeConfigPatch(junk(r), x))
  fuzz('deepMergeJson', (x, r) => deepMergeJson(x, junk(r), r() < 0.5 ? undefined : junk(r)))
  it('deepMergeJson never pollutes Object.prototype', () => {
    const evil = JSON.parse('{"__proto__": {"polluted": 1}, "constructor": {"prototype": {"polluted2": 1}}}')
    deepMergeJson({}, evil); deepMergeJson(evil, {}); deepMergeJson({ a: 1 }, evil, {})
    mergeConfigPatch({}, evil)
    expect({}.polluted).toBeUndefined()
    expect({}.polluted2).toBeUndefined()
  })
})
