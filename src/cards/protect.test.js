import { describe, it, expect } from 'vitest'
import { isCourseNote, splitProtected, COURSE_TAG } from './protect'
import { srs, registerBackend, selectBackend } from './index'
import { REQUIRED_METHODS } from './contract'

describe('course cards are protected', () => {
  it('a note with the course tag, or an older course tag, is a course note', () => {
    expect(isCourseNote({ tags: ['ebiki', COURSE_TAG] })).toBe(true)
    expect(isCourseNote({ tags: ['ebiki', 'secplus', 'SY0-701'] })).toBe(true)
    expect(isCourseNote({ tags: ['ebiki', 'greeting'] })).toBe(false)
  })
  it('splitProtected keeps course notes and lets the rest go', () => {
    const r = splitProtected([1, 2, 3], [{ noteId: 1, tags: [COURSE_TAG] }, { noteId: 2, tags: [] }])
    expect(r).toEqual({ allowed: [2, 3], kept: [1] })
  })
  it('srs.deleteNotes refuses a course card on every path and deletes the others', async () => {
    const deleted = []
    const fake = Object.fromEntries(REQUIRED_METHODS.map((m) => [m, async () => null]))
    Object.assign(fake, { id: 'fake-protect', notesInfo: async (ids) => ids.map((id) => ({ noteId: id, tags: id === 7 ? ['ebiki-course'] : [] })), deleteNotes: async (ids) => { deleted.push(...ids) } })
    registerBackend(fake); selectBackend('fake-protect')
    await expect(srs.deleteNotes([7])).rejects.toMatchObject({ code: 'courseCard' })
    // All or nothing: a mixed delete is refused whole, so a merge or a session update never half-applies.
    await expect(srs.deleteNotes([7, 8])).rejects.toMatchObject({ code: 'courseCard' })
    expect(deleted).toEqual([])
    await srs.deleteNotes([8])
    expect(deleted).toEqual([8])
    selectBackend('anki')
  })
})
