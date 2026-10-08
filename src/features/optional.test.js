// Optional features are fully OFF until the user switches them on, and turning them on/off is live.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { createRegistry, lazyComponent, SLOT } from './registry'
import { EVENTS } from './events'
import { registry } from './index'

const Screen = () => null
const make = () => {
  const onGraded = vi.fn()
  const reg = createRegistry([
    { id: 'core', navItems: [{ id: 'core-nav', order: 1, Screen }] },
    {
      id: 'extra', optional: true, nameKey: 'x_name', descKey: 'x_desc',
      Mount: () => null,
      navItems: [{ id: 'extra-nav', order: 2, Screen }],
      practiceActivities: [{ id: 'act', order: 1, Screen }],
      chatMenuItems: [{ id: 'menu', order: 1, onPick: () => {} }],
      settingsCards: [{ id: 'card', section: 'general', Component: Screen }],
      on: { [EVENTS.CARD_GRADED]: onGraded },
    },
  ])
  return { reg, onGraded }
}

describe('optional features', () => {
  it('contribute nothing while off: no slots, no mount, no events', () => {
    const { reg, onGraded } = make()
    expect(reg.isActive('extra')).toBe(false)
    for (const name of [SLOT.NAV, SLOT.PRACTICE, SLOT.CHAT_MENU, SLOT.SETTINGS]) {
      expect(reg.slot(name).some((i) => i.feature === 'extra'), name).toBe(false)
    }
    expect(reg.mounts().some((m) => m.id === 'extra')).toBe(false)
    reg.emit(EVENTS.CARD_GRADED, {}, {})
    expect(onGraded).not.toHaveBeenCalled()
  })

  it('switch on and off live (the switch is read on every call)', () => {
    const { reg, onGraded } = make()
    let settings = {}
    reg.setEnabled((id) => settings[id]?.enabled === true)
    settings = { extra: { enabled: true } }
    expect(reg.isActive('extra')).toBe(true)
    expect(reg.slot(SLOT.PRACTICE).map((i) => i.id)).toEqual(['act'])
    expect(reg.mounts().map((m) => m.id)).toContain('extra')
    reg.emit(EVENTS.CARD_GRADED, {}, {})
    expect(onGraded).toHaveBeenCalledTimes(1)
    settings = { extra: { enabled: false } }
    expect(reg.isActive('extra')).toBe(false)
    expect(reg.slot(SLOT.NAV).map((i) => i.id)).toEqual(['core-nav'])
  })

  it('only `enabled: true` counts (a truthy string or a stale shape never switches one on)', () => {
    const { reg } = make()
    let settings = { extra: { enabled: 'yes' } }
    reg.setEnabled((id) => settings[id]?.enabled === true)
    expect(reg.isActive('extra')).toBe(false)
    settings = { extra: true }
    expect(reg.isActive('extra')).toBe(false)
  })

  it('every installed optional feature is off by default', () => {
    const fresh = createRegistry(registry.features)
    for (const f of fresh.optional()) expect(fresh.isActive(f.id), f.id).toBe(false)
    expect(fresh.optional().map((f) => f.id).sort()).toEqual(['listen-speak', 'scenes', 'voice-chat'])
  })
})

describe('on-demand screens of an optional feature', () => {
  afterEach(() => { vi.useRealTimers(); delete globalThis.window })

  it('are not prefetched while the feature is off, and are once it is on', async () => {
    vi.useFakeTimers()
    globalThis.window = {} // lazyComponent prefetches only in a page
    const loader = vi.fn(async () => ({ default: Screen }))
    const Off = lazyComponent(loader, { prefetchMs: 100 })
    const loader2 = vi.fn(async () => ({ default: Screen }))
    const On = lazyComponent(loader2, { prefetchMs: 100 })
    const reg = createRegistry([
      { id: 'a', optional: true, practiceActivities: [{ id: 'x', Screen: Off }] },
      { id: 'b', optional: true, practiceActivities: [{ id: 'y', Screen: On }] },
    ])
    reg.setEnabled((id) => id === 'b')
    await vi.advanceTimersByTimeAsync(150)
    expect(loader).not.toHaveBeenCalled()
    expect(loader2).toHaveBeenCalledTimes(1)
  })

  it('a non-optional feature keeps its prefetch', async () => {
    vi.useFakeTimers()
    globalThis.window = {}
    const loader = vi.fn(async () => ({ default: Screen }))
    const S = lazyComponent(loader, { prefetchMs: 50 })
    createRegistry([{ id: 'c', navItems: [{ id: 'n', Screen: S }] }])
    await vi.advanceTimersByTimeAsync(60)
    expect(loader).toHaveBeenCalledTimes(1)
  })
})
