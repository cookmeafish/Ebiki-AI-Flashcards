// Shaping for mode config a MODEL wrote (createMode, Ebi Studio). Pure; App.jsx can import these in place of
// its inline copies. Every function takes anything and returns the shape the app reads.

const text = (v) => {
  if (v == null) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (Array.isArray(v)) return v.map(text).filter(Boolean).join(', ')
  if (typeof v === 'object') { const s = Object.values(v).find((x) => typeof x === 'string'); return s || '' }
  return ''
}

// "language" vs "general". A model answering "Language learning", "foreign language" or "lang" meant a language
// mode (the exact-match check made those general: no letter cues, no usage tags, a language-course deck graded
// as concepts). "general", "general (not a language)" and anything else stay general.
export function shapeModeType(v) {
  const s = text(v).trim().toLowerCase()
  if (!s) return 'general'
  if (/^general\b/.test(s) || /\bnot\b/.test(s)) return 'general'
  return /^(language|lang|foreign[\s-]?language|language[\s-]?(learning|course|study))\b/.test(s) ? 'language' : 'general'
}

// 6 to 12 lowercase tag tokens, text only, no blanks or repeats (an object became "[object object]").
export function shapeTagCategories(v, max = 12) {
  const list = Array.isArray(v) ? v : typeof v === 'string' ? v.split(/[,\n]/) : []
  const seen = new Set()
  const out = []
  for (const x of list) {
    const t = text(x).trim().toLowerCase().replace(/\s+/g, '-')
    if (!t || seen.has(t)) continue
    seen.add(t); out.push(t)
    if (out.length >= max) break
  }
  return out
}

// Chat chips: 3 short texts. A model sending one string of chips (newline or semicolon separated) kept none.
export function shapeChatSuggestions(v, max = 3, clean = (s) => s) {
  const list = Array.isArray(v) ? v : typeof v === 'string' ? v.split(/\n|;/) : []
  return list.map((x) => clean(text(x).replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())).filter(Boolean).slice(0, max)
}

// Discover categories: {key, label, rule} as text, one per key, never the reserved "both" (the "Anything" chip:
// a category keyed "both" was indistinguishable from it).
export function shapeDiscoverKinds(v, max = 6, clean = (s) => s) {
  const seen = new Set(['both'])
  const out = []
  for (const k of Array.isArray(v) ? v : []) {
    if (!k || typeof k !== 'object') continue
    const key = text(k.key).trim().toLowerCase().replace(/\s+/g, '-')
    const label = clean(text(k.label)).trim()
    const rule = clean(text(k.rule)).trim()
    if (!key || !label || !rule || seen.has(key)) continue
    seen.add(key); out.push({ key, label, rule })
    if (out.length >= max) break
  }
  return out
}
