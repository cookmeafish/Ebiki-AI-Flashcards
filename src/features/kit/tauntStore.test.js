import { describe, it, expect, beforeEach } from 'vitest'
import { setPlatform } from '../../platform'
import { fetchTaunt, recentTaunts, rememberTaunt } from './tauntStore'

const mem = new Map()
setPlatform({ kv: { getJson: (k, f = null) => (mem.has(k) ? JSON.parse(mem.get(k)) : f), setJson: (k, v) => { mem.set(k, JSON.stringify(v)); return true } } })

const ai = (replies) => ({ hasKey: true, clean: (s) => String(s || '').trim(), call: async () => { const r = replies.shift(); if (r instanceof Error) throw r; return r } })
const facts = { bossKey: 'raid:titan', voice: 'v', sample: 'That weld will not hold today.', question: 'q', answer: 'a' }

describe('fetchTaunt', () => {
  beforeEach(() => mem.clear())
  it('remembers a new line', async () => {
    const r = await fetchTaunt(ai(['The seam split before it cooled.']), facts)
    expect(r).toEqual({ line: 'The seam split before it cooled.', source: 'ai' })
    expect(recentTaunts('raid:titan')[0]).toBe('The seam split before it cooled.')
  })
  it('a repeat is retried once, then nothing is shown', async () => {
    rememberTaunt('raid:titan', 'The seam split before it cooled.')
    const r = await fetchTaunt(ai(['Again the seam split before noon.', 'Look, the seam split before lunch.']), facts)
    expect(r).toBeNull()
  })
  it('a repeat fixed on the retry is kept', async () => {
    rememberTaunt('raid:titan', 'The seam split before it cooled.')
    const r = await fetchTaunt(ai(['The seam split before it cooled down.', 'A rivet popped out of your answer.']), facts)
    expect(r?.line).toBe('A rivet popped out of your answer.')
  })
  it('a failed call falls back to the sample, once per fight', async () => {
    let used = false
    const guard = { sampleUsed: () => used, markSample: () => { used = true } }
    expect((await fetchTaunt(ai([new Error('x')]), { ...facts, ...guard }))?.source).toBe('sample')
    expect(await fetchTaunt(ai([new Error('x')]), { ...facts, ...guard })).toBeNull()
  })
  it('no key: the sample (or nothing without one)', async () => {
    expect((await fetchTaunt({ hasKey: false }, facts))?.line).toBe(facts.sample)
    expect(await fetchTaunt({ hasKey: false }, { ...facts, sample: '' })).toBeNull()
  })
})
