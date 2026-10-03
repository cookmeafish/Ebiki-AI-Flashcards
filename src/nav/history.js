// THE NAVIGATION HISTORY, as pure data (no browser, no React): what Back and Forward walk through.
//
// An entry is a SNAPSHOT of every live "slice" of navigation state at one moment: { seq, values, memo }.
//   values  { [sliceKey]: value }  e.g. { tab: 'legends', 'legends.view': 'map', settings: null }
//   memo    { [sliceKey]: data }   side data a slice wants back with the entry (a scroll position); never compared
//   seq     a number unique for this run, what the device history (browser entries) points at
// The stack keeps entries in order with a cursor (`index`). A push drops every forward entry (like a browser) and the
// oldest ones beyond `cap`. Values compare by JSON (slices hold plain data only).
//
// Used by src/nav/index.js (the service that ties it to the device). Tests: history.test.js.

export const same = (a, b) => {
  if (a === b) return true
  if (a == null || b == null) return a == null && b == null
  try { return JSON.stringify(a) === JSON.stringify(b) } catch { return false }
}

export const NAV_CAP = 100

export function createNavStack({ cap = NAV_CAP } = {}) {
  let entries = []
  let index = -1
  let seq = 0
  const make = (values) => ({ seq: ++seq, values: { ...(values || {}) }, memo: {} })
  const api = {
    get length() { return entries.length },
    get index() { return index },
    current: () => entries[index] || null,
    at: (i) => entries[i] || null,
    // Where the entry with this seq is now (-1: never existed, or dropped by the cap).
    find: (s) => entries.findIndex((e) => e.seq === s),
    // A fresh history holding one entry (the app's base).
    init(values) {
      entries = [make(values)]
      index = 0
      return entries[0]
    },
    // A new entry after the current one; forward entries are gone, the oldest beyond the cap too.
    push(values) {
      if (index < 0) return api.init(values)
      entries = entries.slice(0, index + 1)
      entries.push(make(values))
      if (entries.length > cap) entries = entries.slice(entries.length - cap)
      index = entries.length - 1
      return entries[index]
    },
    // Change some keys of the CURRENT entry (no new entry).
    replace(values) {
      const e = entries[index]
      if (!e) return api.init(values)
      e.values = { ...e.values, ...(values || {}) }
      return e
    },
    setKey(key, value) { return api.replace({ [key]: value }) },
    remember(key, data) {
      const e = entries[index]
      if (e) e.memo = { ...e.memo, [key]: data }
    },
    moveTo(i) {
      if (i >= 0 && i < entries.length) index = i
      return entries[index] || null
    },
    // The keys whose LIVE value differs from entry i (only keys entry i knows: a slice that was not on screen then has
    // nothing to restore).
    changedKeys(i, live) {
      const e = entries[i]
      if (!e) return []
      return Object.keys(live || {}).filter((k) => k in e.values && !same(e.values[k], live[k]))
    },
    // Closing something (a modal, a sub-view) should be a step BACK, not a new entry: the latest earlier entry that
    // already looks exactly like the live state (every live key equal; a key the entry lacks counts only as "nothing").
    // -1 when there is none.
    unwindTarget(live) {
      for (let i = index - 1; i >= 0; i--) {
        const v = entries[i].values
        if (Object.keys(live || {}).every((k) => same(k in v ? v[k] : null, live[k]))) return i
      }
      return -1
    },
  }
  return api
}
