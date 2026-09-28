// Which parts of the global config this page must post, and how the server merges them.
//
// Several computers can share one config.json, so the autosave posts only what changed. Diffing per
// TOP-LEVEL key was not enough for the maps below: one change anywhere inside `aiModels` posted this page's
// whole (stale) copy of it, and the server replaced the map on disk, so a model adopted or declined, a
// per-feature override or an audio region set on another computer was lost. These maps are keyed by provider
// (or model id, or setting) and then by tier/role/language, so they are diffed TWO levels down
// (aiModels.gemini.chat, pronunciation.defaultRegions.es): only changed entries are posted, removed ones are
// named in `__unset` (as paths), and the server merges them into the stored map (mergeConfigPatch). Shared by
// App.jsx and vite.config.js so the two sides can't drift.

export const NESTED_CONFIG_KEYS = ['aiModels', 'modelPresets', 'rejectedModels', 'modelPlans', 'modelCards', 'modelAvailability', 'availableModels', 'pronunciation']
const NESTED = new Set(NESTED_CONFIG_KEYS)
const DEPTH = 2 // map levels below the top-level key that are merged entry by entry
const SEP = '\u0001'
const isPlain = (v) => !!v && typeof v === 'object' && !Array.isArray(v)

// { path: json }. Path segments are joined by SEP; a path ENDING in SEP marks "this is a map".
export function flattenConfig(obj) {
  const out = {}
  const walk = (v, prefix, level) => {
    out[prefix + SEP] = '{}'
    for (const [s, sv] of Object.entries(v)) {
      if (sv === undefined) continue
      const p = prefix + SEP + s
      if (level < DEPTH && isPlain(sv)) walk(sv, p, level + 1)
      else out[p] = JSON.stringify(sv)
    }
  }
  for (const [k, v] of Object.entries(obj || {})) {
    if (v === undefined || k === '__unset') continue
    if (NESTED.has(k) && isPlain(v)) walk(v, k, 1)
    else out[k] = JSON.stringify(v)
  }
  return out
}

const segs = (p) => (p.endsWith(SEP) ? p.slice(0, -1) : p).split(SEP)
const parentMarker = (p) => { const s = segs(p); return s.slice(0, -1).join(SEP) + SEP }
const getAt = (o, s) => s.reduce((x, k) => (x == null ? undefined : x[k]), o)

// sent/cur are flattenConfig() maps. Returns null when nothing changed, else
// { body, paths } where body is the POST payload and paths lists every path it covers.
export function diffConfig(sent, cur, curObj) {
  const body = {}
  const unset = []
  const paths = []
  for (const [p, js] of Object.entries(cur)) {
    if (sent && sent[p] === js) continue
    paths.push(p)
    const s = segs(p)
    if (s.length === 1 && !p.endsWith(SEP)) { body[p] = curObj[p]; continue }
    // Build the partial map down to this entry.
    let node = body
    const last = p.endsWith(SEP) ? s.length : s.length - 1
    for (let i = 0; i < last; i++) { if (!isPlain(node[s[i]])) node[s[i]] = {} ; node = node[s[i]] }
    if (!p.endsWith(SEP)) node[s[s.length - 1]] = getAt(curObj, s)
  }
  if (sent) {
    for (const p of Object.keys(sent)) {
      if (p in cur) continue
      const s = segs(p)
      if (s.length === 1) continue // a top-level key left the state: nothing is posted for it
      // Its map went away or changed shape: covered by that change, but no longer "sent" either (kept, the same
      // value picked again posted only an empty map and the override was lost on disk).
      if (!(parentMarker(p) in cur)) { paths.push(p); continue }
      paths.push(p)
      unset.push(s)
    }
  }
  if (!paths.length) return null
  if (unset.length) body.__unset = unset
  return { body, paths }
}

const mergeAt = (e, v, level) => {
  if (level >= DEPTH || !isPlain(e) || !isPlain(v)) return v
  const out = { ...e }
  for (const [k, sv] of Object.entries(v)) out[k] = mergeAt(e[k], sv, level + 1)
  return out
}

// Server side: apply a posted patch over the stored config.
export function mergeConfigPatch(existing, data) {
  const merged = { ...(existing || {}) }
  for (const [k, v] of Object.entries(data || {})) {
    if (k === '__unset') continue
    merged[k] = NESTED.has(k) && isPlain(v) && isPlain(merged[k]) ? mergeAt(merged[k], v, 0) : v
  }
  const unset = Array.isArray(data?.__unset) ? data.__unset : []
  for (const s of unset) {
    if (!Array.isArray(s) || s.length < 2 || s.length > DEPTH + 1 || !NESTED.has(s[0]) || !isPlain(merged[s[0]])) continue
    // Copy the maps on the way down, then delete the entry.
    merged[s[0]] = { ...merged[s[0]] }
    let node = merged[s[0]]
    let ok = true
    for (let i = 1; i < s.length - 1; i++) {
      if (!isPlain(node[s[i]])) { ok = false; break }
      node[s[i]] = { ...node[s[i]] }
      node = node[s[i]]
    }
    if (ok) delete node[s[s.length - 1]]
  }
  return merged
}
