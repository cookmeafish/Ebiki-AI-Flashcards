import { describe, it, expect } from 'vitest'
import { flattenConfig, diffConfig, mergeConfigPatch } from './configDiff'

const post = (sentObj, mine) => diffConfig(flattenConfig(sentObj), flattenConfig(mine), mine)

describe('config diff (shared config.json)', () => {
  it('posts only the changed entry, two levels down, and the server keeps the rest', () => {
    // This page loaded gemini {cheap:a, normal:n} and regions {es:x}. Another computer since set normal=b, fr=ca.
    const loaded = { modelPresets: { gemini: { cheap: 'a', normal: 'n' } }, pronunciation: { defaultRegions: { es: 'x' }, embedInAnki: true } }
    const disk = { modelPresets: { gemini: { cheap: 'a', normal: 'b' } }, pronunciation: { defaultRegions: { es: 'x', fr: 'ca' }, embedInAnki: true } }
    const mine = { modelPresets: { gemini: { cheap: 'a2', normal: 'n' } }, pronunciation: { defaultRegions: { es: 'mx' }, embedInAnki: true } }
    const d = post(loaded, mine)
    expect(d.body).toEqual({ modelPresets: { gemini: { cheap: 'a2' } }, pronunciation: { defaultRegions: { es: 'mx' } } })
    expect(mergeConfigPatch(disk, d.body)).toEqual({ modelPresets: { gemini: { cheap: 'a2', normal: 'b' } }, pronunciation: { defaultRegions: { es: 'mx', fr: 'ca' }, embedInAnki: true } })
  })

  it('a whole map removed forgets its entries, so the same value picked again is posted', () => {
    // App-style bookkeeping: nowSent = sent + diff.paths (present in cur) - diff.paths (absent).
    const step = (sent, mine) => {
      const cur = flattenConfig(mine), d = diffConfig(sent, cur, mine)
      const next = { ...sent }
      for (const p of d.paths) { if (p in cur) next[p] = cur[p]; else delete next[p] }
      return { d, next }
    }
    const loaded = flattenConfig({ aiModels: { openai: { chat: 'gpt-4o' } } })
    const a = step(loaded, { aiModels: {} }) // a preset click deletes the provider's overrides
    const b = step(a.next, { aiModels: { openai: { chat: 'gpt-4o' } } }) // the same model picked again
    expect(b.d.body).toEqual({ aiModels: { openai: { chat: 'gpt-4o' } } })
  })

  it('names removed entries and maps in __unset and the server deletes only those', () => {
    const d = post({ modelPlans: { gemini: { normal: 1 }, openai: { max: 2 } }, aiModels: { gemini: { chat: 'x', deck: 'y' } } },
      { modelPlans: { gemini: { normal: 1 } }, aiModels: { gemini: { chat: 'x' } } })
    expect(d.body).toEqual({ __unset: [['modelPlans', 'openai'], ['aiModels', 'gemini', 'deck']] })
    expect(mergeConfigPatch({ modelPlans: { gemini: { normal: 1 }, openai: { max: 2 }, grok: 3 }, aiModels: { gemini: { chat: 'x', deck: 'y', pose: 'z' } } }, d.body))
      .toEqual({ modelPlans: { gemini: { normal: 1 }, grok: 3 }, aiModels: { gemini: { chat: 'x', pose: 'z' } } })
  })

  it('returns null when nothing changed, and posts everything on a first save', () => {
    const cfg = { provider: 'gemini', pronunciation: { embedInAnki: true, defaultRegions: { es: 'mx' } } }
    expect(post(cfg, cfg)).toBeNull()
    expect(diffConfig(null, flattenConfig(cfg), cfg).body).toEqual(cfg)
  })

  it('a map posted empty stays a map; a new provider map is posted whole', () => {
    const d = post({ aiModels: {} }, { aiModels: { grok: {} } })
    expect(d.body).toEqual({ aiModels: { grok: {} } })
    expect(mergeConfigPatch({ aiModels: { gemini: { chat: 'x' } } }, d.body)).toEqual({ aiModels: { gemini: { chat: 'x' }, grok: {} } })
  })

  it('replaces scalars, arrays and a map that was not an object', () => {
    expect(mergeConfigPatch({ aiModels: null, list: [1] }, { aiModels: { a: 1 }, list: [2] })).toEqual({ aiModels: { a: 1 }, list: [2] })
    expect(mergeConfigPatch({ appTheme: 'dark' }, { appTheme: 'light' })).toEqual({ appTheme: 'light' })
    expect(mergeConfigPatch({ aiModels: { g: 'old' } }, { aiModels: { g: { chat: 'x' } } })).toEqual({ aiModels: { g: { chat: 'x' } } })
  })

  it('ignores malformed __unset entries', () => {
    expect(mergeConfigPatch({ appTheme: 'd', aiModels: { g: { c: 1 } } }, { __unset: [['appTheme'], 'x', ['aiModels'], ['nope', 'a']] }))
      .toEqual({ appTheme: 'd', aiModels: { g: { c: 1 } } })
  })
})

describe('feature settings (config.json features[id]) are merged per entry', () => {
  it('two computers changing different features keep both', () => {
    const loaded = { features: { legends: { focus: false } } }
    // Computer A turns on an optional feature; computer B (still holding the old copy) changes Legends focus.
    const a = post(loaded, { features: { legends: { focus: false }, 'voice-chat': { enabled: true } } })
    const b = post(loaded, { features: { legends: { focus: true } } })
    const disk = mergeConfigPatch(mergeConfigPatch(loaded, a.body), b.body)
    expect(disk.features).toEqual({ legends: { focus: true }, 'voice-chat': { enabled: true } })
  })
  it('an entry that turns from a map into a value (or back) is posted, not also deleted', () => {
    const disk1 = mergeConfigPatch({ modelAvailability: { openai: { chat: 'a' } } }, post({ modelAvailability: { openai: { chat: 'a' } } }, { modelAvailability: { openai: 'x' } }).body)
    expect(disk1.modelAvailability).toEqual({ openai: 'x' })
    const disk2 = mergeConfigPatch({ modelAvailability: { openai: 'x' } }, post({ modelAvailability: { openai: 'x' } }, { modelAvailability: { openai: { chat: 'a' } } }).body)
    expect(disk2.modelAvailability).toEqual({ openai: { chat: 'a' } })
  })
})
