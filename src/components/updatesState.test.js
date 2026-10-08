import { describe, it, expect } from 'vitest'
import { checkStateFor, updateResultState, verifyOutcome, restartOffered, pollUntilAnswered } from './updatesState'

const base = { gitAvailable: true, reachable: true, branch: 'master', onMaster: true, current: 'abc1234' }

describe('checkStateFor', () => {
  it('maps every GET answer to its state, in priority order', () => {
    expect(checkStateFor({ gitAvailable: false })).toBe('nogit')
    expect(checkStateFor({ ...base, restartPending: true, branch: 'dev', onMaster: false, reachable: false })).toBe('done')
    expect(checkStateFor({ ...base, branch: 'dev', onMaster: false, updateAvailable: true })).toBe('branch')
    expect(checkStateFor({ ...base, reachable: false, updateAvailable: true })).toBe('offline')
    expect(checkStateFor({ ...base, remoteMissing: true, updateAvailable: false })).toBe('remoteMissing')
    expect(checkStateFor({ ...base, localCommits: true, updateAvailable: true })).toBe('localCommits')
    expect(checkStateFor({ ...base, updateAvailable: true })).toBe('available')
    expect(checkStateFor({ ...base, updateAvailable: false })).toBe('uptodate')
  })
  it('a detached or unknown branch is not "another branch"', () => {
    expect(checkStateFor({ ...base, branch: '', onMaster: false, updateAvailable: true })).toBe('available')
  })
  it('never crashes on junk', () => {
    for (const j of [null, undefined, 'x', 5, []]) expect(typeof checkStateFor(j)).toBe('string')
  })
})

describe('updateResultState', () => {
  it('maps every POST answer', () => {
    expect(updateResultState({ busy: true })).toEqual({ state: 'busy', err: null })
    expect(updateResultState({ ok: false, dirty: true })).toEqual({ state: 'dirty', err: null })
    expect(updateResultState({ ok: false, localCommits: true })).toEqual({ state: 'localCommits', err: null })
    expect(updateResultState({ ok: false, wrongBranch: 'dev' })).toEqual({ state: 'branch', err: null })
    expect(updateResultState({ ok: false, updated: true })).toEqual({ state: 'done', err: 'updatesDepsPending' })
    expect(updateResultState({ ok: false, error: 'boom' })).toEqual({ state: 'error', err: 'other' })
    expect(updateResultState({ ok: true, updated: true })).toEqual({ state: 'done', err: null })
    expect(updateResultState(null).state).toBe('error')
  })
})

describe('verifyOutcome', () => {
  it('one answer settles it', () => {
    expect(verifyOutcome('aaa1111', { current: 'bbb2222' })).toBe('done')
    expect(verifyOutcome('aaa1111', { current: 'aaa1111' })).toBe('available')
    expect(verifyOutcome(null, { current: 'aaa1111' })).toBe('recheck')
    expect(verifyOutcome('aaa1111', null)).toBe('down')
  })
})

describe('restartOffered', () => {
  it('only in the app window, never when the server said it cannot restart itself', () => {
    expect(restartOffered({ electron: true, canRestart: true })).toBe(true)
    expect(restartOffered({ electron: true, canRestart: undefined })).toBe(true)
    expect(restartOffered({ electron: true, canRestart: false })).toBe(false)
    expect(restartOffered({ electron: false, canRestart: true })).toBe(false)
  })
})

describe('pollUntilAnswered', () => {
  const clock = () => {
    let t = 0
    return { now: () => t, wait: async (n) => { t += n } }
  }
  it('returns the first answer that names a commit', async () => {
    const c = clock()
    let n = 0
    const fetchLocal = async () => { n++; if (n < 3) throw new Error('down'); return { current: 'abc1234' } }
    expect(await pollUntilAnswered({ fetchLocal, ms: 45000, ...c })).toEqual({ current: 'abc1234' })
    expect(n).toBe(3)
  })
  it('gives up at the deadline (null) and never polls past it', async () => {
    const c = clock()
    let n = 0
    const r = await pollUntilAnswered({ fetchLocal: async () => { n++; throw new Error('down') }, ms: 45000, every: 3000, ...c })
    expect(r).toBeNull()
    expect(n).toBe(15)
  })
  it('bounds each poll by the time left', async () => {
    const c = clock()
    const limits = []
    await pollUntilAnswered({ fetchLocal: async (lim) => { limits.push(lim); throw new Error('x') }, ms: 10000, every: 3000, perTry: 5000, ...c })
    expect(Math.max(...limits)).toBeLessThanOrEqual(5000)
    expect(limits.at(-1)).toBeLessThanOrEqual(1000)
  })
  it('an answer without a commit keeps polling', async () => {
    const c = clock()
    let n = 0
    const r = await pollUntilAnswered({ fetchLocal: async () => (++n < 2 ? { ok: true } : { current: 'x' }), ...c })
    expect(r).toEqual({ current: 'x' })
  })
})
