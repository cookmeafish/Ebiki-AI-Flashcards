// An in-memory device history with the same shape as platform.history (push / replace / go / onPop / onDeviceNav),
// for tests and for a port with no browser history (a phone build: its OS back button calls nav.back()). Like a
// browser, go() reports the move later (a microtask), never inside the call.
export function createMemoryHistory() {
  let list = [null]
  let pos = 0
  const pops = new Set()
  const devices = new Set()
  return {
    supported: () => true,
    get state() { return list[pos] },
    get position() { return pos },
    get length() { return list.length },
    push(state) { list = list.slice(0, pos + 1); list.push(state); pos = list.length - 1 },
    replace(state) { list[pos] = state },
    go(n) {
      const to = pos + n
      if (!n || to < 0 || to >= list.length) return
      pos = to
      const st = list[pos]
      Promise.resolve().then(() => { for (const f of pops) f(st) })
    },
    onPop(fn) { pops.add(fn); return () => pops.delete(fn) },
    onDeviceNav(fn) { devices.add(fn); return () => devices.delete(fn) },
    // What a device button does: the OS back button, a mouse's back button.
    press(dir) { for (const f of devices) f(dir) },
  }
}
