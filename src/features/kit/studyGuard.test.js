import { describe, it, expect } from 'vitest'
import { studyBlock, studyBlockText } from './studyGuard.js'

const t = (k, v) => `${k}${v ? JSON.stringify(v) : ''}`

describe('studyBlock', () => {
  it('is free when the app says no session is live (an abandoned one was ended)', async () => {
    expect(await studyBlock({ studyActive: true, study: { status: async () => ({ active: false, unsynced: 0 }) } })).toBe(null)
  })
  it('names unsynced ratings', async () => {
    expect(await studyBlock({ study: { status: async () => ({ active: true, unsynced: 3 }) } })).toEqual({ unsynced: 3 })
  })
  it('falls back to studyActive without the service, or when it throws', async () => {
    expect(await studyBlock({ studyActive: true })).toEqual({ unsynced: 0 })
    expect(await studyBlock({ studyActive: false, study: { status: async () => { throw new Error('x') } } })).toBe(null)
    expect(await studyBlock(null)).toBe(null)
  })
})

describe('studyBlockText', () => {
  it('picks the key', () => {
    expect(studyBlockText(t, null)).toBe('')
    expect(studyBlockText(t, { unsynced: 0 })).toBe('call_studyActive')
    expect(studyBlockText(t, { unsynced: 1 })).toBe('call_studyUnsyncedOne{"n":1}')
    expect(studyBlockText(t, { unsynced: 4 })).toBe('call_studyUnsynced{"n":4}')
  })
})
