import { describe, it, expect } from 'vitest'
import { shapeLegacyModes } from './legacyModes'

const DEF = { tagRules: 'Include: ebiki', fields: { definition: true } }

describe('shapeLegacyModes', () => {
  it('keeps the legacy active mode when it exists (the save recorded the first one)', () => {
    const r = shapeLegacyModes({ modes: [{ id: 1, name: 'A' }, { id: 2, name: 'B' }], activeModeId: 2 }, DEF)
    expect(r.activeId).toBe(2)
    expect(r.modes.map((m) => m.id)).toEqual([1, 2])
  })

  it('falls back to the first mode for a missing or unknown active id', () => {
    expect(shapeLegacyModes({ modes: [{ id: 5, name: 'A' }], activeModeId: 9 }, DEF).activeId).toBe(5)
    expect(shapeLegacyModes({ modes: [{ id: 5, name: 'A' }] }, DEF).activeId).toBe(5)
  })

  it('turns string ids into numbers and re-ids duplicates and missing ids', () => {
    const r = shapeLegacyModes({ modes: [{ id: '3', name: 'A' }, { id: 3, name: 'B' }, { name: 'C' }, { id: '', name: 'D' }], activeModeId: '3' }, DEF)
    const ids = r.modes.map((m) => m.id)
    expect(ids[0]).toBe(3)
    expect(new Set(ids).size).toBe(4)
    expect(ids.every((id) => typeof id === 'number')).toBe(true)
    expect(r.activeId).toBe(3) // a string active id still names the mode
  })

  it('drops entries that are not mode objects, and gives up on an empty list', () => {
    const r = shapeLegacyModes({ modes: [null, 'x', [1], { id: 1, name: 'A' }] }, DEF)
    expect(r.modes).toHaveLength(1)
    expect(shapeLegacyModes({ modes: [null] }, DEF)).toBeNull()
    expect(shapeLegacyModes({ modes: [] }, DEF)).toBeNull()
  })

  it('migrates old profiles as language modes with the profile active', () => {
    const r = shapeLegacyModes({ profiles: [{ id: 1, name: 'Spanish' }, { id: 2, name: 'French' }], activeProfileId: 2 }, DEF)
    expect(r.modes.every((m) => m.type === 'language' && m.tagRules === DEF.tagRules)).toBe(true)
    expect(r.activeId).toBe(2)
  })

  it('migrates a single field format as one mode, and ignores anything else', () => {
    const r = shapeLegacyModes({ fields: { word: true } }, DEF)
    expect(r.modes).toHaveLength(1)
    expect(r.modes[0]).toMatchObject({ id: 1, name: 'Language Learning', type: 'language', fields: { word: true } })
    expect(shapeLegacyModes({ something: 1 }, DEF)).toBeNull()
    expect(shapeLegacyModes(null, DEF)).toBeNull()
    expect(shapeLegacyModes({ modes: 'nope' }, DEF)).toBeNull()
  })
})
