// A mode keeps BOTH a course and its own adventure (switchMapKind), and a course in the wrong mode moves with its
// progress (moveCourse). The data folder is an in-memory store here.
import { describe, it, expect, vi, beforeEach } from 'vitest'

const disk = new Map()
vi.mock('../storage', () => ({
  featureStore: () => {
    const readOk = new Set()
    return {
      async read(key) { readOk.add(key); return { ok: true, value: disk.has(key) ? structuredClone(disk.get(key)) : null } },
      async write(key, value) { if (!readOk.has(key)) return false; if (value == null) disk.delete(key); else disk.set(key, structuredClone(value)); return true },
      canWrite: (key) => readOk.has(key),
    }
  },
}))
const { switchMapKind, moveCourse, loadMap } = await import('./store')
const { MAP_VERSION } = await import('./map')
const { CAREER_MAP_VERSION } = await import('./career')

const area = (id, done = false) => ({ id, title: id, theme: '', status: 'open', nodes: [{ id: `${id}-l1`, kind: 'learn', title: 'L1', status: done ? 'done' : 'open', items: ['x'] }], items: [{ id: 'x', front: 'f', back: 'b' }] })
const course = (modeId) => ({ version: CAREER_MAP_VERSION, modeId, career: { id: 'security-plus-sy0-701', title: 'CompTIA Security+ SY0-701', version: '1' }, areas: [area('d1', true)] })
const adventure = (modeId) => ({ version: MAP_VERSION, modeId, areas: [area('a1')] })

beforeEach(() => disk.clear())

describe('a course and an adventure in one mode', () => {
  it('switching parks the course whole and brings it back', async () => {
    disk.set('map-31', course(31))
    expect(await switchMapKind(31, 'adventure')).toBe(true)
    expect(disk.has('map-31')).toBe(false) // the start screen: build the adventure
    expect(disk.get('park-31-course').career.id).toBe('security-plus-sy0-701')
    disk.set('map-31', adventure(31)) // the adventure got built
    expect(await switchMapKind(31, 'course')).toBe(true)
    expect(disk.get('map-31').career.id).toBe('security-plus-sy0-701')
    expect(disk.get('map-31').areas[0].nodes[0].status).toBe('done') // progress kept
    expect(disk.get('park-31-adventure').areas[0].id).toBe('a1')
    expect(disk.has('park-31-course')).toBe(false)
  })
})

describe('a course in a language mode moves to its own mode', () => {
  it('moves with its progress and leaves the language mode on its start screen', async () => {
    disk.set('map-33', course(33))
    expect(await moveCourse(33, 31)).toBe(true)
    expect(disk.get('map-31')).toMatchObject({ modeId: 31, career: { id: 'security-plus-sy0-701' } })
    expect(disk.get('map-31').areas[0].nodes[0].status).toBe('done')
    expect(disk.has('map-33')).toBe(false)
    expect((await loadMap(33)).value).toBe(null)
  })
  it('an adventure already in the target mode is parked, never lost', async () => {
    disk.set('map-33', course(33)); disk.set('map-31', adventure(31))
    expect(await moveCourse(33, 31)).toBe(true)
    expect(disk.get('map-31').career.id).toBe('security-plus-sy0-701')
    expect(disk.get('park-31-adventure').areas[0].id).toBe('a1')
  })
  it('a course already in the target mode wins; the moved copy waits parked there', async () => {
    disk.set('map-33', course(33)); disk.set('map-31', { ...course(31), areas: [area('d1')] })
    expect(await moveCourse(33, 31)).toBe(true)
    expect(disk.get('map-31').areas[0].nodes[0].status).toBe('open')
    expect(disk.get('park-31-course').areas[0].nodes[0].status).toBe('done')
    expect(disk.has('map-33')).toBe(false)
  })
  it('an adventure is never moved as a course', async () => {
    disk.set('map-33', adventure(33))
    expect(await moveCourse(33, 31)).toBe(false)
    expect(disk.get('map-33').areas[0].id).toBe('a1')
  })
})
