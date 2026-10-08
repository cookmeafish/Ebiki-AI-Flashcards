// THE NAVIGATION SERVICE: app-wide Back and Forward (the mouse's back button, Alt+Left, a phone's back button).
// Ebiki keeps its navigation in React state (the screen, sub-views, the Settings pane...), so there was no history to
// go back through. Each place that owns navigation state declares it as a SLICE (useNavEntry in ./react.js, or
// nav.register directly): { key, value, apply(value, memo), guard?, rest?, replace?, replaceWhen? }.
//   - a user change of a slice's value PUSHES a history entry (a snapshot of every live slice, src/nav/history.js);
//     a change back to the slice's `rest` value (closing Settings, leaving a step for the map) instead UNWINDS to the
//     earlier entry that already looks like that, so closing never leaves a "reopen it" entry behind;
//     `replace` (or replaceWhen(prev, next)) changes the current entry in place instead (an index stepped with arrows)
//   - Back / Forward moves to another entry and calls apply() on every live slice whose value differs, innermost
//     (most recently registered) first. guard(to, from) may veto first: false = stay (a running fight asks to confirm
//     and the answer decides), 'skip' = that entry cannot be shown again (a finished quiz), try the next one along
//   - a slice that mounts LATER (a screen opened by Back) restores itself from the current entry when it registers
//   - setBlocker(fn): while fn() is true nothing moves (a dialog or the first-run wizard is up)
// The device side is an ADAPTER (platform.history in src/platform): push/replace/go/onPop like window.history, plus
// onDeviceNav for buttons the device does not turn into history steps. ./memory.js is an in-memory adapter (tests,
// and a phone port whose OS back button calls nav.back()).
// The first entry has a GUARD entry behind it, so Back at the root never leaves the app (it steps forward again).
import { createNavStack, same, NAV_CAP } from './history'
import { platform } from '../platform'

const AWAIT_MS = 2000  // how long a slice told to change may take to show the new value before a change counts as the user's
const EXPECT_MS = 1000 // how long a device step we asked for may take to report back

export function createNav({ adapter, cap = NAV_CAP, now = () => Date.now(), randomId = () => Math.random().toString(36).slice(2) } = {}) {
  const dev = () => (typeof adapter === 'function' ? adapter() : adapter)
  const stack = createNavStack({ cap })
  const slices = new Map()
  const layers = new Set() // keys registered by layer(): an entry holding one that is no longer open is a dead step
  let regOrder = 0
  let started = false
  let sid = ''
  let deviceSeq = null // the entry the device (browser) is on
  let busy = false     // a Back/Forward is being applied (a guard may be waiting on a dialog)
  let expecting = null // a device step we asked for, not yet reported: { seq, timer }
  let dirty = false    // a change arrived while busy/expecting: look again afterwards
  let blocker = null
  let unsubs = []

  const live = () => { const v = {}; for (const [k, s] of slices) v[k] = s.get(); return v }
  const innermostFirst = () => [...slices.entries()].sort((a, b) => b[1].order - a[1].order).map(([k]) => k)
  const stateFor = (seq) => ({ ebikiNav: { sid, seq } })
  const blockedNow = () => { try { return !!blocker?.() } catch { return false } }
  const warn = (what, e) => { try { console.warn(`[nav] ${what}:`, e?.message || e) } catch { /* no console */ } }

  // A slice that was just TOLD to change does not count as changed by the user until it shows that value (or gives up).
  const awaiting = (s, value) => {
    if (!s?.awaiting) return false
    if (same(value, s.awaiting.value) || now() > s.awaiting.until) { s.awaiting = null; return false }
    return true
  }
  const told = (s, value) => { s.awaiting = { value, until: now() + AWAIT_MS } }

  function settle() {
    if (!dirty) return
    dirty = false
    setTimeout(flush, 0)
  }
  function expect(seq) {
    clearTimeout(expecting?.timer)
    expecting = { seq, timer: setTimeout(() => { expecting = null; settle() }, EXPECT_MS) }
  }
  // Put the device on the app's current entry.
  function syncDevice() {
    const cur = stack.current()
    if (!cur || cur.seq === deviceSeq) return
    const from = stack.find(deviceSeq)
    const to = stack.index
    if (from < 0) { dev().push(stateFor(cur.seq)); deviceSeq = cur.seq; return }
    expect(cur.seq)
    dev().go(to - from)
  }

  // Look at every live slice against the current entry: push, unwind or replace.
  function flush() {
    if (!started) return
    if (busy || expecting) { dirty = true; return }
    const cur = stack.current()
    if (!cur) return
    const vals = live()
    const snap = { ...vals }
    const diff = []
    for (const k of Object.keys(vals)) {
      const was = k in cur.values ? cur.values[k] : null
      const held = awaiting(slices.get(k), vals[k]) // run first: showing the told value is what clears it
      if (same(was, vals[k])) continue
      if (held) { snap[k] = was; continue }
      diff.push(k)
    }
    if (!diff.length) return
    const quiet = (k) => { const s = slices.get(k); return s.replace === true || !!s.replaceWhen?.(cur.values[k] ?? null, vals[k]) }
    if (diff.every(quiet)) { stack.replace(Object.fromEntries(diff.map((k) => [k, vals[k]]))); return }
    const closing = diff.every((k) => { const s = slices.get(k); return s.hasRest && same(vals[k], s.rest) })
    if (closing) {
      const j = stack.unwindTarget(snap)
      if (j >= 0) { stack.moveTo(j); syncDevice(); return }
    }
    const e = stack.push(snap)
    dev().push(stateFor(e.seq))
    deviceSeq = e.seq
  }

  // Try to show entry t: every guard first (any refusal changes nothing), then every apply.
  async function attempt(t) {
    const target = stack.at(t)
    const vals = live()
    // A layer (a closed Modal) cannot be shown again: its entry is passed over, never parked on as a dead step.
    for (const [k, v] of Object.entries(target.values)) if (v === 'open' && layers.has(k) && vals[k] !== 'open') return 'skip'
    const keys = innermostFirst().filter((k) => k in target.values && !same(target.values[k], vals[k]))
    for (const k of keys) {
      const s = slices.get(k)
      if (!s) continue
      let r = true
      try { r = await s.guard(target.values[k], vals[k]) } catch (e) { warn(`guard ${k}`, e); r = false }
      if (r === 'skip') return 'skip'
      if (r === false) return 'refuse'
    }
    stack.moveTo(t)
    for (const k of keys) {
      const s = slices.get(k) // a slice can unmount while a guard waits
      if (!s) continue
      told(s, target.values[k])
      try { s.apply(target.values[k], target.memo[k]) } catch (e) { warn(`apply ${k}`, e) }
    }
    return 'ok'
  }

  // The device moved (Back/Forward): follow it, or put it back.
  async function follow() {
    if (busy) return // one at a time: a press during a guard's dialog is undone below
    const cur = stack.index
    const found = stack.find(deviceSeq)
    const first = found < 0 ? 0 : found // an entry dropped by the cap: the oldest we still have
    if (first === cur) { if (found >= 0) return; syncDevice(); return }
    if (blockedNow()) { syncDevice(); return }
    const dir = first > cur ? 1 : -1
    busy = true
    try {
      for (let t = first; t >= 0 && t < stack.length; t += dir) {
        const r = await attempt(t)
        if (r !== 'skip') break
      }
    } catch (e) { warn('follow', e) } finally { busy = false }
    syncDevice()
    settle()
  }

  function onPop(state) {
    const s = state && state.ebikiNav
    // The guard behind the first entry, or an entry of an earlier run of the page (a reload): never leave the app.
    if (!s || s.sid !== sid || s.guard) { dev().go(1); return }
    deviceSeq = s.seq
    if (expecting) {
      const ours = expecting.seq === s.seq
      clearTimeout(expecting.timer)
      expecting = null
      if (ours) { settle(); return }
    }
    follow()
  }

  // A slice joins. Mounting while its key is in the current entry with another value = a screen reopened by Back.
  function restoreOne(key, s) {
    const cur = stack.current()
    if (!cur) return
    const v = s.get()
    if (!(key in cur.values)) { stack.setKey(key, v); return }
    const want = cur.values[key]
    if (same(want, v)) return
    let r = false
    try { r = s.guard(want, v) } catch { r = false }
    if (r && typeof r.then === 'function') { r.catch?.(() => {}); r = false } // never a dialog while a screen mounts
    if (r === true) {
      told(s, want)
      try { s.apply(want, cur.memo[key]) } catch (e) { warn(`restore ${key}`, e) }
    } else stack.setKey(key, v) // cannot be shown again: the entry takes what is there
  }

  const api = {
    get started() { return started },
    // Begin following the device. Idempotent (StrictMode). Without a device history nothing happens.
    start() {
      const d = dev()
      if (started || !d || (d.supported && !d.supported())) return false
      started = true
      sid = randomId()
      const base = stack.init(live())
      d.replace({ ebikiNav: { sid, guard: true } })
      d.push(stateFor(base.seq))
      deviceSeq = base.seq
      unsubs = [d.onPop(onPop), d.onDeviceNav?.((dir) => (dir < 0 ? api.back() : api.forward()))].filter((f) => typeof f === 'function')
      return true
    },
    stop() { for (const u of unsubs) { try { u() } catch { /* gone */ } } unsubs = []; started = false; clearTimeout(expecting?.timer); expecting = null },
    register(key, slice) {
      const s = {
        get: slice.get,
        apply: slice.apply || (() => {}),
        guard: slice.guard || (() => true),
        replace: slice.replace === true,
        replaceWhen: slice.replaceWhen,
        hasRest: !!slice.hasRest || 'rest' in slice,
        rest: slice.rest,
        order: ++regOrder,
        awaiting: null,
      }
      slices.set(key, s)
      if (started) restoreOne(key, s)
      return () => { if (slices.get(key) === s) slices.delete(key) }
    },
    // A LAYER over the screen (a feature Modal): open while registered. Opening is an entry, so Back closes it
    // (opts.onClose) instead of changing the screen underneath it; Forward never reopens it; one that cannot be
    // dismissed (opts.closable() === false) refuses Back. Returns off(): closing it any other way (its ✕, Esc, a
    // parent unmounting it) steps back, so no dead entry is left for the next Back to waste.
    layer(key, opts = {}) {
      const st = { open: false }
      layers.add(key)
      const off = api.register(key, {
        get: () => (st.open ? 'open' : null),
        apply: (v) => {
          if (v != null || !st.open) return
          st.open = false
          try { opts.onClose?.() } catch (e) { warn(`layer ${key}`, e) }
        },
        guard: (to) => (to === 'open' ? 'skip' : (opts.closable?.() === false ? false : true)),
        rest: null,
      })
      st.open = true
      flush()
      return () => {
        if (st.open) { st.open = false; flush() }
        off()
      }
    },
    changed: () => flush(),
    // Side data for the CURRENT entry (e.g. a scroll position, taken before the view changes); apply() gets it back.
    remember: (key, data) => stack.remember(key, data),
    back: () => { if (started) dev().go(-1) },
    forward: () => { if (started) dev().go(1) },
    canGoBack: () => started && stack.index > 0,
    setBlocker: (fn) => { blocker = typeof fn === 'function' ? fn : null },
    _stack: stack,
  }
  return api
}

// The app's one navigation history, on the platform's device history (a browser tab / Electron: window.history).
export const nav = createNav({ adapter: () => platform.history, randomId: () => platform.randomId() })
