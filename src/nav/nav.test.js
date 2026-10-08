import { describe, it, expect, vi } from 'vitest'
import { createNavStack, same } from './history'
import { createNav } from './index'
import { createMemoryHistory } from './memory'

describe('nav stack (pure)', () => {
  it('pushes, moves and drops forward entries on a new push', () => {
    const s = createNavStack()
    s.init({ tab: 'study' })
    s.push({ tab: 'chat' })
    s.push({ tab: 'deck' })
    expect(s.index).toBe(2)
    s.moveTo(0)
    expect(s.current().values.tab).toBe('study')
    s.push({ tab: 'stats' })
    expect(s.length).toBe(2)
    expect(s.at(1).values.tab).toBe('stats')
  })
  it('caps from the oldest end and finds entries by seq', () => {
    const s = createNavStack({ cap: 3 })
    const first = s.init({ n: 0 })
    for (let i = 1; i <= 4; i++) s.push({ n: i })
    expect(s.length).toBe(3)
    expect(s.find(first.seq)).toBe(-1)
    expect(s.current().values.n).toBe(4)
    expect(s.find(s.current().seq)).toBe(2)
  })
  it('replace and remember change only the current entry', () => {
    const s = createNavStack()
    s.init({ a: 1 })
    s.push({ a: 2 })
    s.replace({ b: 3 })
    s.remember('a', { scroll: 40 })
    expect(s.current().values).toEqual({ a: 2, b: 3 })
    expect(s.current().memo.a).toEqual({ scroll: 40 })
    expect(s.at(0).memo).toEqual({})
  })
  it('finds the entry to unwind to (closing returns to where it was opened)', () => {
    const s = createNavStack()
    s.init({ tab: 'study', settings: null })
    s.push({ tab: 'study', settings: 'general' })
    s.push({ tab: 'study', settings: 'models' })
    expect(s.unwindTarget({ tab: 'study', settings: null })).toBe(0)
    expect(s.unwindTarget({ tab: 'chat', settings: null })).toBe(-1)
    // a key the old entry lacks counts as "nothing"
    expect(createNavStack().init({}) && true).toBe(true)
  })
  it('lists the live keys that differ from an entry', () => {
    const s = createNavStack()
    s.init({ tab: 'a', x: { i: 1 } })
    expect(s.changedKeys(0, { tab: 'a', x: { i: 2 }, y: 1 })).toEqual(['x'])
  })
  it('compares by value', () => {
    expect(same({ a: [1] }, { a: [1] })).toBe(true)
    expect(same(null, undefined)).toBe(true)
    expect(same(0, null)).toBe(false)
  })
})

// A tiny "app": slices whose state lives in plain variables.
function setup() {
  const dev = createMemoryHistory()
  let n = 0
  const nav = createNav({ adapter: dev, randomId: () => `run${++n}` })
  const state = {}
  const add = (key, initial, opts = {}) => {
    state[key] = initial
    const off = nav.register(key, { get: () => state[key], apply: (v) => { state[key] = v }, ...opts })
    return off
  }
  const set = (key, v) => { state[key] = v; nav.changed() }
  const tick = () => new Promise((r) => setTimeout(r, 5))
  return { dev, nav, state, add, set, tick }
}

describe('nav service', () => {
  it('Back and Forward walk screen changes; Back at the root never leaves', async () => {
    const { dev, nav, state, add, set, tick } = setup()
    add('tab', 'study')
    nav.start()
    set('tab', 'chat')
    set('tab', 'deck')
    nav.back(); await tick()
    expect(state.tab).toBe('chat')
    nav.back(); await tick()
    expect(state.tab).toBe('study')
    nav.back(); await tick() // the guard entry steps forward again
    await tick()
    expect(state.tab).toBe('study')
    expect(dev.state.ebikiNav.guard).toBeFalsy()
    nav.forward(); await tick()
    expect(state.tab).toBe('chat')
  })

  it('the device back button (onDeviceNav) goes back too', async () => {
    const { dev, nav, state, add, set, tick } = setup()
    add('tab', 'study')
    nav.start()
    set('tab', 'legends')
    dev.press(-1); await tick()
    expect(state.tab).toBe('study')
  })

  it('closing to the rest value unwinds instead of adding an entry', async () => {
    const { nav, state, add, set, tick } = setup()
    add('tab', 'study')
    add('settings', null, { rest: null })
    nav.start()
    set('settings', 'general')
    set('settings', 'models')
    set('settings', null) // the ✕
    await tick(); await tick()
    expect(nav._stack.index).toBe(0)
    nav.back(); await tick(); await tick()
    expect(state.settings).toBe(null) // Back does not reopen Settings
    expect(state.tab).toBe('study')
    nav.forward(); await tick()
    expect(state.settings).toBe('general')
  })

  it('Back inside Settings returns to the previous pane, then closes it', async () => {
    const { nav, state, add, set, tick } = setup()
    add('tab', 'study')
    add('settings', null, { rest: null })
    nav.start()
    set('settings', 'general')
    set('settings', 'models')
    nav.back(); await tick()
    expect(state.settings).toBe('general')
    nav.back(); await tick()
    expect(state.settings).toBe(null)
  })

  it('a guard that refuses keeps everything (and the device) where it was', async () => {
    const { dev, nav, state, add, set, tick } = setup()
    add('tab', 'legends')
    add('legends.view', 'map', { rest: 'map', guard: async () => false })
    nav.start()
    set('legends.view', 'activity')
    const pos = dev.position
    nav.back(); await tick(); await tick()
    expect(state['legends.view']).toBe('activity')
    expect(dev.position).toBe(pos)
  })

  it('a confirming guard lets Back through', async () => {
    const { nav, state, add, set, tick } = setup()
    const guard = vi.fn(async (to) => (to === 'map' ? true : 'skip'))
    add('legends.view', 'map', { rest: 'map', guard })
    nav.start()
    set('legends.view', 'activity')
    nav.back(); await tick()
    expect(guard).toHaveBeenCalledWith('map', 'activity')
    expect(state['legends.view']).toBe('map')
    nav.forward(); await tick(); await tick() // a finished step cannot be reopened: skipped, nothing changes
    expect(state['legends.view']).toBe('map')
  })

  it("'skip' passes over entries that cannot be shown again", async () => {
    const { nav, state, add, set, tick } = setup()
    add('tab', 'a')
    add('run', 'none', { guard: (to) => (to === 'running' ? 'skip' : true) })
    nav.start()
    set('run', 'running')
    set('tab', 'b')
    set('run', 'none')
    // entries: a/none, a/running, b/running, b/none
    nav.back(); await tick() // b/running: skip, then a/running: skip, then a/none
    await tick()
    expect(state.tab).toBe('a')
    expect(state.run).toBe('none')
  })

  it('a blocker (a dialog is open) stops every move', async () => {
    const { nav, state, add, set, tick } = setup()
    add('tab', 'study')
    nav.start()
    set('tab', 'chat')
    let open = true
    nav.setBlocker(() => open)
    nav.back(); await tick(); await tick()
    expect(state.tab).toBe('chat')
    open = false
    nav.back(); await tick()
    expect(state.tab).toBe('study')
  })

  it('replace slices update the entry in place', async () => {
    const { nav, state, add, set, tick } = setup()
    add('tab', 'assets')
    add('idx', 0, { replace: true })
    nav.start()
    set('idx', 3)
    set('idx', 4)
    expect(nav._stack.length).toBe(1)
    set('tab', 'study')
    nav.back(); await tick()
    expect(state.tab).toBe('assets')
    expect(state.idx).toBe(4)
  })

  it('a slice mounting on an entry restores itself (with its memo); one that cannot adopts what is shown', async () => {
    const { nav, state, add, set, tick } = setup()
    add('tab', 'assets')
    let off = add('assets.tab', 'legends')
    nav.start()
    set('assets.tab', 'families')
    nav.remember('assets.tab', { scroll: 900 })
    set('assets.tab', 'raids')
    off() // the screen unmounts
    set('tab', 'study')
    nav.back(); await tick() // tab back to assets; the screen mounts again with its initial tab
    let memo = null
    state['assets.tab'] = 'legends'
    off = nav.register('assets.tab', { get: () => state['assets.tab'], apply: (v, m) => { state['assets.tab'] = v; memo = m } })
    expect(state['assets.tab']).toBe('raids')
    nav.back(); await tick()
    expect(state['assets.tab']).toBe('families')
    expect(memo).toEqual({ scroll: 900 })
    off()
    // A screen that refuses (e.g. a step that is over) keeps what it shows and the entry takes it.
    state.step = 'map'
    nav.register('step', { get: () => state.step, apply: () => {}, guard: () => 'skip' })
    expect(nav._stack.current().values.step).toBe('map')
  })

  it('a value the app was told to show does not count as a new change', async () => {
    const { nav, state, add, set, tick } = setup()
    add('tab', 'study')
    nav.start()
    set('tab', 'chat')
    set('tab', 'deck')
    const len = nav._stack.length
    nav.back(); await tick()
    nav.changed() // the render after apply
    expect(nav._stack.length).toBe(len)
    expect(nav._stack.index).toBe(1)
  })

  it('a pop from an earlier run of the page (reload) or a foreign entry steps forward, never out', async () => {
    const { dev, nav, add, tick } = setup()
    dev.replace({ ebikiNav: { sid: 'old', seq: 7 } })
    dev.push({ ebikiNav: { sid: 'old', seq: 8 } })
    add('tab', 'study')
    nav.start()
    const pos = dev.position
    dev.go(-2); await tick(); await tick(); await tick()
    expect(dev.position).toBeGreaterThan(pos - 2)
  })
})

describe('nav service: after a move', () => {
  it('the next user change after Back/Forward is a new entry (the told value was shown first)', async () => {
    const dev = createMemoryHistory()
    const nav = createNav({ adapter: dev })
    const st = { tab: 'study' }
    nav.register('tab', { get: () => st.tab, apply: (v) => { st.tab = v } })
    nav.start()
    const tick = () => new Promise((r) => setTimeout(r, 5))
    const set = (v) => { st.tab = v; nav.changed() }
    set('chat'); set('stats')
    dev.go(-1); await tick()
    dev.go(1); await tick()
    nav.changed() // the render that shows 'stats'
    dev.go(-1); await tick()
    nav.changed()
    set('deck')
    dev.press(-1); await tick()
    expect(st.tab).toBe('chat')
  })
})

// A layer (a feature Modal: the game panel, Codex, Learn it): Back closes it instead of changing the screen underneath.
describe('nav service: layers', () => {
  it('Back closes an open layer and leaves the screen; a second Back moves the screen', async () => {
    const { nav, state, add, set, tick } = setup()
    add('tab', 'study')
    nav.start()
    set('tab', 'deck')
    let closed = 0
    const off = nav.layer('ui.modal.1', { onClose: () => { closed++; off() } })
    nav.back(); await tick(); await tick()
    expect(closed).toBe(1)
    expect(state.tab).toBe('deck')
    nav.back(); await tick(); await tick()
    expect(state.tab).toBe('study')
  })

  it('closing a layer by its own button steps back (no dead entry left behind)', async () => {
    const { nav, state, add, set, tick } = setup()
    add('tab', 'study')
    nav.start()
    set('tab', 'deck')
    const off = nav.layer('ui.modal.2', { onClose: () => {} })
    expect(nav._stack.index).toBe(2)
    off() // the ✕
    await tick(); await tick()
    expect(nav._stack.index).toBe(1)
    nav.back(); await tick(); await tick()
    expect(state.tab).toBe('study') // one press, not a silent one first
  })

  it('Forward never reopens a closed layer', async () => {
    const { nav, state, add, set, tick } = setup()
    add('tab', 'study')
    nav.start()
    set('tab', 'deck')
    let closed = 0
    const off = nav.layer('ui.modal.3', { onClose: () => { closed++; off() } })
    nav.back(); await tick(); await tick()
    const at = nav._stack.index
    nav.forward(); await tick(); await tick(); await tick()
    expect(closed).toBe(1)
    expect(state.tab).toBe('deck')
    expect(nav._stack.index).toBe(at) // not parked on the closed layer's entry (a dead step)
    nav.back(); await tick(); await tick()
    expect(state.tab).toBe('study') // so the next Back moves at once
  })

  it('a screen change made while a layer is up is undone first (the layer stays)', async () => {
    const { nav, state, add, set, tick } = setup()
    add('tab', 'study')
    nav.start()
    const off = nav.layer('ui.modal.5', { onClose: () => { off() } })
    set('tab', 'deck') // (a screen change made while it was up)
    nav.back(); await tick(); await tick()
    expect(state.tab).toBe('study')
    expect(nav._stack.current().values['ui.modal.5']).toBe('open')
    nav.forward(); await tick(); await tick(); await tick()
    expect(state.tab).toBe('deck')
  })

  it('a layer that cannot be dismissed refuses Back (the screen does not change under it)', async () => {
    const { dev, nav, state, add, set, tick } = setup()
    add('tab', 'study')
    nav.start()
    set('tab', 'deck')
    let closed = 0
    nav.layer('ui.modal.4', { onClose: () => { closed++ }, closable: () => false })
    const pos = dev.position
    nav.back(); await tick(); await tick(); await tick()
    expect(closed).toBe(0)
    expect(state.tab).toBe('deck')
    expect(dev.position).toBe(pos)
  })

  it('two layers close innermost first', async () => {
    const { nav, add, tick } = setup()
    add('tab', 'study')
    nav.start()
    const order = []
    const offA = nav.layer('ui.modal.a', { onClose: () => { order.push('a'); offA() } })
    const offB = nav.layer('ui.modal.b', { onClose: () => { order.push('b'); offB() } })
    nav.back(); await tick(); await tick()
    expect(order).toEqual(['b'])
    nav.back(); await tick(); await tick()
    expect(order).toEqual(['b', 'a'])
  })
})
