// React side of the navigation service (src/nav/index.js). One hook per piece of navigation state:
//
//   const { remember } = useNavEntry(key, value, apply, { enabled, rest, guard, replace, replaceWhen })
//
//   key       unique, dotted by owner ('tab', 'settings', 'legends.view')
//   value     plain data (compared by JSON); a user change of it is a new history entry
//   apply     (value, memo) => show that value (set your state); called on Back/Forward and when the screen
//             remounts on an entry it was part of
//   rest      the "home" value (Settings closed, the Legends map): changing TO it steps back instead of adding an entry
//   guard     (to, from) => true | false | 'skip' | Promise of those: veto a move (ask before abandoning a fight;
//             'skip' = that entry cannot be shown again). While a screen mounts, only a plain true restores
//   replace   true: changes rewrite the current entry (no new entry); replaceWhen(prev, next) decides per change
//   enabled   false = not part of navigation right now
//   remember  (data) => keep data with the CURRENT entry (a scroll position before leaving); apply gets it back
import { useEffect, useMemo, useRef } from 'react'
import { nav } from './index'

export function useNavEntry(key, value, apply, opts = {}) {
  const enabled = opts.enabled !== false && !!key
  const ref = useRef(null)
  ref.current = { value, apply, opts }
  useEffect(() => {
    if (!enabled) return undefined
    const o = ref.current.opts
    return nav.register(key, {
      get: () => ref.current.value ?? null,
      apply: (v, memo) => ref.current.apply?.(v, memo),
      guard: (to, from) => (ref.current.opts.guard ? ref.current.opts.guard(to, from) : true),
      replace: o.replace === true,
      replaceWhen: (a, b) => !!ref.current.opts.replaceWhen?.(a, b),
      hasRest: 'rest' in o,
      rest: o.rest ?? null,
    })
  }, [key, enabled])
  let sig = ''
  try { sig = JSON.stringify(value ?? null) } catch { sig = String(value) }
  useEffect(() => { if (enabled) nav.changed() }, [sig, enabled, key])
  return useMemo(() => ({ remember: (data) => nav.remember(key, data) }), [key])
}
