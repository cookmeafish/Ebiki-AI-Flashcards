// What a one-mode save CHANGED, and how the server applies it to the mode's config on disk.
//
// Computers on a shared folder each hold their own copy of every mode. A one-mode save used to post this page's
// whole copy of that mode, so a field another computer had changed in the SAME mode since this page loaded (its
// description, one study rule, a deck picked there, Discover kinds written in the background) was put back to
// this page's stale value. A save now carries the difference: top-level keys, and one level down inside plain
// objects (`studyRules.cardsAtOnce`, `chatPrefs.focus`), as `{ set: [{ path, value }], unset: [path] }`. The
// server applies it over the config it reads (applyModePatch). Shared by App.jsx and vite.config.js.

const isPlain = (v) => !!v && typeof v === 'object' && !Array.isArray(v)
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)

export function modePatch(before, after) {
  const set = []
  const unset = []
  const b = isPlain(before) ? before : {}
  const a = isPlain(after) ? after : {}
  for (const k of new Set([...Object.keys(b), ...Object.keys(a)])) {
    const bv = b[k]; const av = a[k]
    if (av === undefined) { if (bv !== undefined) unset.push([k]); continue }
    if (isPlain(av) && isPlain(bv)) {
      for (const s of new Set([...Object.keys(bv), ...Object.keys(av)])) {
        if (av[s] === undefined) { if (bv[s] !== undefined) unset.push([k, s]) }
        else if (!same(av[s], bv[s])) set.push({ path: [k, s], value: av[s] })
      }
    } else if (!same(av, bv)) set.push({ path: [k], value: av })
  }
  return { set, unset }
}

const okPath = (p) => Array.isArray(p) && (p.length === 1 || p.length === 2) && p.every((s) => typeof s === 'string' && s && s !== '__proto__' && s !== 'constructor' && s !== 'prototype')

export function isModePatch(p) {
  return isPlain(p) && Array.isArray(p.set) && Array.isArray(p.unset)
    && p.set.every((e) => isPlain(e) && okPath(e.path)) && p.unset.every(okPath)
}

// `base` is never changed; a key that held a plain value where the patch writes inside it becomes an object.
export function applyModePatch(base, patch) {
  const out = isPlain(base) ? { ...base } : {}
  for (const k of Object.keys(out)) if (isPlain(out[k])) out[k] = { ...out[k] }
  for (const { path: [k, s], value } of patch.set) {
    if (s === undefined) out[k] = value
    else { if (!isPlain(out[k])) out[k] = {}; out[k][s] = value }
  }
  for (const [k, s] of patch.unset) {
    if (s === undefined) delete out[k]
    else if (isPlain(out[k])) delete out[k][s]
  }
  return out
}
