// Merging two copies of a per-mode store (pure, tested in merge.test.js). Every blob writer REPLACES the stored
// blob, so wherever two copies meet (the local instant-paint cache and the stored ledger, a mode rename finding data
// under both names) they are merged, never "one wins".

const LEDGER_LISTS = ['offered', 'known', 'declined', 'carded']

// A ledger whose lists are real arrays (a list stored as null or an object threw on every visit), or null.
export const shapeLedger = (l) => (l && typeof l === 'object' && !Array.isArray(l)
  ? { ...l, ...Object.fromEntries(LEDGER_LISTS.map((k) => [k, Array.isArray(l[k]) ? l[k].filter((e) => e != null) : []])) }
  : null)

// Union per list: `offered` by value, the rest by term (an entry is a term string or { term, ... }). The lists only
// ever grow, so a union never revives anything. `a`'s entries (and other fields) come first.
export const mergeLedgers = (a0, b0) => {
  const a = shapeLedger(a0), b = shapeLedger(b0)
  if (!a) return b
  if (!b) return a
  const byTerm = (x, y) => {
    const seen = new Set()
    return [...x, ...y].filter((e) => { const k = String(e?.term ?? e); if (seen.has(k)) return false; seen.add(k); return true })
  }
  return {
    ...b, ...a,
    offered: [...new Set([...a.offered, ...b.offered])],
    known: byTerm(a.known, b.known),
    declined: byTerm(a.declined, b.declined),
    carded: byTerm(a.carded, b.carded),
  }
}

// Two copies of the grammar-slip log ({ t, front, n, at }), one entry per slip (keyFn folds case and spacing only:
// accents matter). The same slip in both copies is ONE history seen twice, so it keeps the larger count and the
// later time (never the sum). Ordered by last seen, newest `cap` kept.
export const mergeGrammarLogs = (a, b, keyFn, cap = 200) => {
  const byKey = new Map()
  for (const e of [...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])]) {
    if (!e || !e.t) continue
    const k = keyFn(e.t), hit = byKey.get(k)
    byKey.set(k, hit ? { ...hit, n: Math.max(hit.n || 1, e.n || 1), at: Math.max(hit.at || 0, e.at || 0) } : e)
  }
  return [...byKey.values()].sort((x, y) => (x.at || 0) - (y.at || 0)).slice(-cap)
}

// A plain object or null (a hooks blob stored as a list or a string is nothing to keep).
const plainObject = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : null)

// Two copies of a mode's memory-hook store ({ <noteId | word:...>: [hook, ...] }): per key, the union of both lists
// (`a`'s order first, exact text compared). A union cannot tell a hook DELETED on one side from one never saved
// there, so a deletion made on one computer can come back once; losing a hook made on the other is worse.
export const mergeHooks = (a0, b0) => {
  const a = plainObject(a0), b = plainObject(b0)
  if (!a) return b
  if (!b) return a
  const out = {}
  for (const src of [a, b]) {
    for (const [k, list] of Object.entries(src)) {
      if (!Array.isArray(list)) continue
      const into = out[k] || (out[k] = [])
      for (const h of list) if (h != null && !into.includes(h)) into.push(h)
    }
  }
  return out
}

// Two copies of a deck's "do not merge" list ({ pairs: [...] }): the union (decisions only ever add pairs).
export const mergeDupIgnore = (a0, b0) => {
  const a = plainObject(a0), b = plainObject(b0)
  if (!a) return b
  if (!b) return a
  const pairs = [...new Set([...(Array.isArray(a.pairs) ? a.pairs : []), ...(Array.isArray(b.pairs) ? b.pairs : [])])]
  return { ...b, ...a, pairs }
}

// The grammar log's identity of a slip (case and spacing only; accents matter). Same rule as App's grammarSlipKey.
export const slipKey = (x) => String(x || '').normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim()

// Blob kinds whose two copies can be merged without losing either side (see storage.js: read while Anki holds a
// write the shared store missed). Kinds not listed (the learner profile) keep "one copy wins".
export const BLOB_MERGERS = {
  ledger: (a, b) => mergeLedgers(a, b),
  grammar: (a, b) => {
    const la = Array.isArray(a) ? a : null, lb = Array.isArray(b) ? b : null
    if (!la) return lb
    if (!lb) return la
    return mergeGrammarLogs(la, lb, slipKey)
  },
  hooks: mergeHooks,
  dupignore: mergeDupIgnore,
}
