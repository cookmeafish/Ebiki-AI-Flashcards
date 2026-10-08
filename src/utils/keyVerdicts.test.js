import { describe, it, expect } from 'vitest'
import { createKeyVerdictCache } from './keyVerdicts'

const counter = (answer) => {
  const calls = []
  const check = async (prov, key) => { calls.push(`${prov}:${key}`); return typeof answer === 'function' ? answer(prov, key) : answer }
  return { calls, check }
}

describe('createKeyVerdictCache', () => {
  it('the save path reuses a verdict Settings already has: one key, one ping', async () => {
    const c = createKeyVerdictCache()
    const { calls, check } = counter(true)
    expect(await c.run('openai', 'sk-a', check)).toBe(true)
    expect(await c.run('openai', 'sk-a', check, { reuse: true })).toBe(true)
    expect(calls).toEqual(['openai:sk-a'])
  })

  it('keeps refused and no-credit verdicts too', async () => {
    const c = createKeyVerdictCache()
    const bad = counter(false)
    await c.run('gemini', 'k1', bad.check)
    expect(await c.run('gemini', 'k1', bad.check, { reuse: true })).toBe(false)
    const broke = counter('noCredit')
    await c.run('xai', 'k2', broke.check)
    expect(await c.run('xai', 'k2', broke.check, { reuse: true })).toBe('noCredit')
    expect(bad.calls.length + broke.calls.length).toBe(2)
  })

  it('never keeps "could not tell": an unchecked key is checked again', async () => {
    const c = createKeyVerdictCache()
    const { calls, check } = counter(null)
    expect(await c.run('openai', 'sk-a', check)).toBe(null)
    expect(c.peek('openai', 'sk-a')).toBeUndefined()
    expect(await c.run('openai', 'sk-a', check, { reuse: true })).toBe(null)
    expect(calls.length).toBe(2)
  })

  it('a check that throws reads as "could not tell"', async () => {
    const c = createKeyVerdictCache()
    expect(await c.run('openai', 'sk-a', async () => { throw new Error('net') })).toBe(null)
    expect(c.peek('openai', 'sk-a')).toBeUndefined()
  })

  it('only the EXACT key and provider reuse a verdict', async () => {
    const c = createKeyVerdictCache()
    const { calls, check } = counter(true)
    await c.run('openai', 'sk-a', check)
    await c.run('openai', 'sk-ab', check, { reuse: true })
    await c.run('xai', 'sk-a', check, { reuse: true })
    expect(calls).toEqual(['openai:sk-a', 'openai:sk-ab', 'xai:sk-a'])
  })

  it('a check in flight is shared, even by a plain caller', async () => {
    const c = createKeyVerdictCache()
    let release
    const calls = []
    const check = () => { calls.push(1); return new Promise((r) => { release = r }) }
    const a = c.run('openai', 'sk-a', check)
    const b = c.run('openai', 'sk-a', check, { reuse: true })
    await new Promise((r) => setTimeout(r, 0)); release(true)
    expect(await a).toBe(true)
    expect(await b).toBe(true)
    expect(calls.length).toBe(1)
  })

  it('a plain call always asks again and refreshes the kept verdict', async () => {
    const c = createKeyVerdictCache()
    let answer = 'noCredit'
    const { calls, check } = counter(() => answer)
    await c.run('openai', 'sk-a', check)
    answer = true
    expect(await c.run('openai', 'sk-a', check)).toBe(true)
    expect(await c.run('openai', 'sk-a', check, { reuse: true })).toBe(true)
    expect(calls.length).toBe(2)
  })

  it('a plain call with maxAgeMs takes a verdict only that fresh', async () => {
    let t = 0
    const c = createKeyVerdictCache({ now: () => t })
    const { calls, check } = counter(true)
    await c.run('openai', 'sk-a', check, { reuse: true })
    t = 3000
    await c.run('openai', 'sk-a', check, { maxAgeMs: 5000 })
    t = 9000
    await c.run('openai', 'sk-a', check, { maxAgeMs: 5000 })
    expect(calls.length).toBe(2)
  })

  it('a kept verdict expires', async () => {
    let t = 0
    const c = createKeyVerdictCache({ ttlMs: 1000, now: () => t })
    const { calls, check } = counter(true)
    await c.run('openai', 'sk-a', check)
    t = 999
    await c.run('openai', 'sk-a', check, { reuse: true })
    t = 2000
    await c.run('openai', 'sk-a', check, { reuse: true })
    expect(calls.length).toBe(2)
  })

  it('stays small: the oldest key is dropped', async () => {
    const c = createKeyVerdictCache({ max: 2 })
    const { check } = counter(true)
    await c.run('p', 'a', check); await c.run('p', 'b', check); await c.run('p', 'c', check)
    expect(c.peek('p', 'a')).toBeUndefined()
    expect(c.peek('p', 'c')).toBe(true)
  })
})
