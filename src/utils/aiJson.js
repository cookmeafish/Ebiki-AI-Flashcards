// Robust JSON out of an AI reply (moved out of App.jsx so features, tests and the phone build share ONE parser).
// Pure: no DOM, no React. App.jsx imports parseAiJson; the feature context hands it to features as ctx.ai.json.

// Salvage every complete top-level {...} object from a (possibly truncated) string,
// respecting quoted strings/escapes. Lets us recover most rows even when an array was
// cut off mid-object (e.g. a long vision response that hit the token limit).
// Raw line breaks/tabs INSIDE JSON strings escaped ("back": "Pronunciación: X⏎Traducción: cat"): JSON forbids
// them, and every parse stage failed, so a chat card vanished and a Quick Add reply gave "no cards".
function escapeControlsInStrings(str) {
  let out = '', inStr = false, esc = false
  for (const ch of str) {
    if (inStr) {
      if (esc) esc = false
      else if (ch === '\\') esc = true
      else if (ch === '"') inStr = false
      else if (ch === '\n') { out += '\\n'; continue }
      else if (ch === '\r') { out += '\\r'; continue }
      else if (ch === '\t') { out += '\\t'; continue }
    } else if (ch === '"') inStr = true
    out += ch
  }
  return out
}

function salvageJsonObjects(str) {
  const out = []
  out.starts = [] // where each salvaged object began (parseAiJson reads what precedes the first)
  let depth = 0, start = -1, inStr = false, esc = false
  for (let i = 0; i < str.length; i++) {
    const ch = str[i]
    if (inStr) {
      if (esc) esc = false
      else if (ch === '\\') esc = true
      else if (ch === '"') inStr = false
      continue
    }
    if (ch === '"') { inStr = true; continue }
    if (ch === '{') { if (depth === 0) start = i; depth++ }
    else if (ch === '}') {
      // A stray '}' between rows (the model closed a row twice) never takes the depth below 0: it went negative
      // and every row after it was lost.
      if (depth === 0) continue
      depth--
      if (depth === 0 && start !== -1) {
        try { out.push(JSON.parse(str.slice(start, i + 1))); out.starts.push(start) } catch {
          try { out.push(JSON.parse(escapeControlsInStrings(str.slice(start, i + 1)))); out.starts.push(start) } catch { /* skip bad row */ }
        }
        start = -1
      }
    }
  }
  return out
}

// Double quotes INSIDE a string value the model forgot to escape ("back":"Ejemplo: "Tengo un perro."") made the
// whole card or grading row vanish. A quote counts as the string's end only when a JSON delimiter (, : } ]) or
// the end of the text follows it; any other one is escaped. Used only after the strict parses failed.
function escapeInnerQuotes(str) {
  let out = '', inStr = false, esc = false
  for (let i = 0; i < str.length; i++) {
    const ch = str[i]
    if (inStr) {
      if (esc) esc = false
      else if (ch === '\\') esc = true
      else if (ch === '"') {
        let j = i + 1
        while (j < str.length && /\s/.test(str[j])) j++
        if (j >= str.length || /[,:}\]]/.test(str[j])) inStr = false
        else { out += '\\"'; continue }
      } else if (ch === '\n') { out += '\\n'; continue }
    } else if (ch === '"') inStr = true
    out += ch
  }
  return out
}

// JSON-ish → JSON, outside strings only (a last resort after the strict parses failed). What real models send:
// single-quoted strings and keys ({'front': 'gato'}, Python style), bare keys ({front: "gato"}), Python literals
// (True/False/None), // and /* */ comments, curly quotes used AS the JSON quotes (“front”: “gato”) and no-break
// spaces in the indentation. An apostrophe inside a single- or curly-quoted value ('l'eau') does not end it: a
// closing quote must be followed by a JSON delimiter (, : } ]) or the end. Double-quoted strings are copied as is.
const LITERALS = { true: 'true', True: 'true', TRUE: 'true', false: 'false', False: 'false', FALSE: 'false', null: 'null', None: 'null', NULL: 'null', undefined: 'null', NaN: 'null' }
const nextSolid = (str, i) => { while (i < str.length && /\s/.test(str[i])) i++; return i }
const endsValue = (str, i) => { const j = nextSolid(str, i); return j >= str.length || /[,:}\]]/.test(str[j]) }
function jsonishRepair(str) {
  let out = ''
  for (let i = 0; i < str.length; i++) {
    const ch = str[i]
    if (ch === '"') { // a normal string: copied through its closing quote
      let j = i + 1
      for (; j < str.length; j++) { if (str[j] === '\\') { j++; continue } if (str[j] === '"') break }
      out += str.slice(i, j + 1); i = j; continue
    }
    if (ch === "'" || ch === '“' || ch === '”' || ch === '„') { // single or curly quotes as delimiters
      const curly = ch !== "'"
      let j = i + 1, body = ''
      for (; j < str.length; j++) {
        const c = str[j]
        if (c === '\\' && j + 1 < str.length) { body += str[j + 1] === "'" ? "'" : c + str[j + 1]; j++; continue }
        if ((curly ? (c === '“' || c === '”' || c === '"') : c === "'") && endsValue(str, j + 1)) break
        body += c === '"' ? '\\"' : c
      }
      out += `"${body}"`; i = j; continue
    }
    if (ch === '/' && str[i + 1] === '/') { while (i < str.length && str[i] !== '\n') i++; out += '\n'; continue }
    if (ch === '/' && str[i + 1] === '*') { const e = str.indexOf('*/', i + 2); i = e < 0 ? str.length : e + 1; continue }
    if (/[A-Za-z_$]/.test(ch) && !/[\w$.]/.test(str[i - 1] || '')) {
      let j = i + 1
      while (j < str.length && /[\w$]/.test(str[j])) j++
      const word = str.slice(i, j)
      const k = nextSolid(str, j)
      if (str[k] === ':') out += `"${word}"`
      else out += Object.prototype.hasOwnProperty.call(LITERALS, word) ? LITERALS[word] : word
      i = j - 1; continue
    }
    out += /[  -​　﻿]/.test(ch) ? ' ' : ch
  }
  return out
}

const noTrailingCommas = (s) => s.replace(/,\s*([}\]])/g, '$1')
// One JSON text, strict first, then the repairs in order of how little they change. undefined = none parsed.
function tryParse(t) {
  try { return JSON.parse(t) } catch { /* next */ }
  try { return JSON.parse(noTrailingCommas(t)) } catch { /* next */ }
  try { return JSON.parse(noTrailingCommas(escapeControlsInStrings(t))) } catch { /* next */ }
  try { return JSON.parse(noTrailingCommas(escapeControlsInStrings(jsonishRepair(t)))) } catch { /* next */ }
  try { return JSON.parse(noTrailingCommas(escapeInnerQuotes(t))) } catch { /* next */ }
  return undefined
}

// The balanced top-level [...] / {...} values in a reply, in order, with prose between them ignored. null when a
// bracket never closes (a reply cut off mid-list): the salvage below handles that, never this.
function topLevelValues(str, max = 40) {
  const out = []
  for (let pos = 0; out.length < max;) {
    const s = str.slice(pos).search(/[[{]/)
    if (s < 0) break
    const start = pos + s
    const stack = []
    let inStr = false, esc = false, end = -1
    for (let i = start; i < str.length; i++) {
      const ch = str[i]
      if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inStr = false; continue }
      if (ch === '"') inStr = true
      else if (ch === '[' || ch === '{') stack.push(ch === '[' ? ']' : '}')
      // A closer of the wrong kind ("[{...}}") is a malformed reply: the row salvage below reads it, not this.
      else if (ch === ']' || ch === '}') { if (stack.pop() !== ch) return null; if (!stack.length) { end = i; break } }
    }
    if (end < 0) return null
    out.push({ start, end, text: str.slice(start, end + 1) })
    pos = end + 1
  }
  return out
}

// A model's thinking written INTO the reply (<think>, <thinking>, <reasoning>, <scratchpad> blocks; models served
// through compatible endpoints, or prompted to reason first): a JSON draft inside it was read as the answer.
const THINK_BLOCK = /<(think|thinking|reasoning|scratchpad|analysis)>[\s\S]*?<\/\1>/gi

// ─── Robust JSON extraction from an AI response ──────────────────────────────
// Strips markdown fences/preamble, isolates the outermost array/object, repairs common
// LLM JSON glitches, and as a last resort salvages whatever complete objects it can
// (so a truncated array still yields most of its rows). Returns parsed value or null.
export function parseAiJson(text) {
  if (!text) return null
  let raw = String(text).replace(THINK_BLOCK, '')
  // A reply that is a JSON STRING holding the JSON ("\"[{\\\"front\\\": ...}]\""): the inner value.
  const lead = raw.trim()
  if (lead[0] === '"') {
    try { const inner = JSON.parse(lead); if (typeof inner === 'string' && /^\s*[[{]/.test(inner)) return parseAiJson(inner) } catch { /* not one */ }
  }
  let cleaned = raw.replace(/```(?:json)?\s*/gi, '').replace(/```\s*/g, '')
  const jsonStart = cleaned.search(/[[{]/)
  if (jsonStart > 0) cleaned = cleaned.slice(jsonStart)
  const wasArray = cleaned[0] === '['
  let trimmed = cleaned
  const lastBracket = Math.max(cleaned.lastIndexOf(']'), cleaned.lastIndexOf('}'))
  if (lastBracket > 0) trimmed = cleaned.slice(0, lastBracket + 1)
  trimmed = trimmed.trim()
  // 1) Straight parse.
  try { return JSON.parse(trimmed) } catch { /* fall through */ }
  // 1b) Trailing commas ONLY. The broader repair below also turns every ' into ", which breaks any
  // apostrophe in the content ("don't", "l'eau"), so a reply whose only fault was a trailing comma
  // came back null (a lost card) whenever its text contained an apostrophe.
  try { return JSON.parse(noTrailingCommas(trimmed)) } catch { /* fall through */ }
  // 1c) Raw line breaks inside strings (see escapeControlsInStrings), trailing commas too.
  try { return JSON.parse(noTrailingCommas(escapeControlsInStrings(trimmed))) } catch { /* fall through */ }
  // 1d) Prose AROUND the JSON holding brackets of its own ("Rules (see [1]) ... [ {...} ] Note: {rules}"): the
  // balanced top-level values, each parsed alone. Several bare objects one after another (one per line, no list
  // brackets) are the rows of a list; otherwise the LONGEST value is the answer (prose brackets are short).
  const tops = topLevelValues(cleaned)
  if (tops && tops.length) {
    const parsed = tops.map((v) => ({ ...v, value: tryParse(v.text) })).filter((v) => v.value !== undefined && v.value !== null && typeof v.value === 'object')
    if (parsed.length) {
      const rows = parsed.length > 1 && parsed.every((v, i) => !Array.isArray(v.value)
        && (i === 0 || /^[\s,]*$/.test(cleaned.slice(parsed[i - 1].end + 1, v.start))))
      if (rows) return parsed.map((v) => v.value)
      return parsed.reduce((a, b) => (b.text.length > a.text.length ? b : a)).value
    }
  }
  // 2) JSON-ish repair: single/curly quotes as delimiters, bare keys, Python literals, comments (see jsonishRepair).
  try { return JSON.parse(noTrailingCommas(escapeControlsInStrings(jsonishRepair(trimmed)))) } catch { /* fall through */ }
  // 2b) Unescaped quotes inside a value (see escapeInnerQuotes), trailing commas too.
  try { return JSON.parse(noTrailingCommas(escapeInnerQuotes(trimmed))) } catch { /* fall through */ }
  // 3) Salvage complete objects (handles truncation). For an array, return the rows.
  let objs = salvageJsonObjects(cleaned)
  // A cut-off reply written with single or curly quotes: the same salvage over its repaired text.
  if (!objs.length && /['“”]/.test(cleaned)) { const fixed = jsonishRepair(cleaned); const again = salvageJsonObjects(fixed); if (again.length) { objs = again; cleaned = fixed } }
  if (!objs.length) {
    // A wrapper object cut off mid-list ({"questions": [{...}, {...}, {"quest) never closes, so no row stood at the
    // top level and every question was lost: salvage the rows of its first list instead.
    const list = cleaned[0] === '{' ? cleaned.indexOf('[') : -1
    const rows = list > 0 ? salvageJsonObjects(cleaned.slice(list + 1)) : []
    return rows.length ? rows.slice() : null
  }
  // Array or object by what directly precedes the first real object ("[" or "," = a row of a list), not by
  // the reply's first bracket: a preamble like "Using the format {front, back}:" made a list of 3 cards
  // come back as ONE object, and "[Note] {...}" made an object come back as a list.
  let k = (objs.starts?.[0] ?? 0) - 1
  while (k >= 0 && /\s/.test(cleaned[k])) k--
  const inList = k >= 0 ? (cleaned[k] === '[' || cleaned[k] === ',') : wasArray
  return inList ? objs.slice() : objs[0] // a plain list (the salvage keeps its row offsets on the array)
}

// A model's row with the right keys in another case or spelling ({"Question": ...}, {"accents_only": true}): the keys a
// parser reads, filled from their look-alikes (case, "_", "-" and spaces ignored). Shallow; the row is returned as is
// when nothing differs, and a key already present is never overwritten. Per parser (it names its own keys): a global
// rename would rewrite DATA keys (a mode's Anki field names, "Front"/"Back").
const keyNorm = (k) => String(k).toLowerCase().replace(/[\s_-]/g, '')
export function canonKeys(o, names) {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return o
  let out = null
  for (const k of Object.keys(o)) {
    if (names.includes(k)) continue
    const n = names.find((x) => keyNorm(x) === keyNorm(k))
    if (n && !Object.prototype.hasOwnProperty.call(o, n) && !(out && Object.prototype.hasOwnProperty.call(out, n))) { out = out || { ...o }; out[n] = o[k] }
  }
  return out || o
}

// THE OBJECT a reply holds, however the model wrapped it: the object itself, a list of one ([{...}]) or one wrapper key
// ({"result": {...}}, {"scene": {...}}). `marks`: keys that identify it (any one, case-insensitive); `keys`: every key the
// parser reads (filled from look-alikes, see canonKeys). null when no object carries a mark.
export function pickObject(raw, marks, keys = marks) {
  const names = [...new Set([...marks, ...keys])]
  const has = (o) => !!o && typeof o === 'object' && !Array.isArray(o) && marks.some((m) => m in canonKeys(o, names))
  const pick = (o) => (has(o) ? canonKeys(o, names) : null)
  if (Array.isArray(raw)) return pick(raw.find(has))
  if (!raw || typeof raw !== 'object') return null
  if (has(raw)) return canonKeys(raw, names)
  const inner = Object.values(raw).filter((v) => v && typeof v === 'object')
  if (inner.length !== 1) return null
  return Array.isArray(inner[0]) ? pick(inner[0].find(has)) : pick(inner[0])
}

// THE ROWS a reply holds: a bare list, the list under `listKey` (any case) or under any other key whose items carry a
// mark ({"items": [...]} for {"questions": [...]}), or ONE row sent alone. Rows get canonKeys(row, keys). [] when none.
export function pickList(raw, listKey, marks, keys = marks) {
  const names = [...new Set([...marks, ...keys])]
  const isRow = (o) => !!o && typeof o === 'object' && !Array.isArray(o) && marks.some((m) => m in canonKeys(o, names))
  let list = null
  if (Array.isArray(raw)) list = raw
  else if (raw && typeof raw === 'object') {
    const top = canonKeys(raw, [listKey])
    if (Array.isArray(top[listKey])) list = top[listKey]
    else list = Object.values(raw).find((v) => Array.isArray(v) && v.some(isRow)) || (isRow(raw) ? [raw] : null)
  }
  return (list || []).filter((o) => o && typeof o === 'object' && !Array.isArray(o)).map((o) => canonKeys(o, names))
}

// A reply that should be a LIST, as a list: a list wrapped in one key ({"questions": [...]}, {"cards": [...]}) is that
// list, and ONE row sent alone (an object carrying one of `marks`, case-insensitive) is a list of one. Anything else
// comes back unchanged, so the caller's own "not a list" handling still runs.
export function asList(v, marks = []) {
  if (Array.isArray(v) || !v || typeof v !== 'object') return v
  const lists = Object.values(v).filter(Array.isArray)
  if (lists.length === 1 && Object.keys(v).length <= 3) return lists[0]
  if (marks.length && marks.some((m) => m in canonKeys(v, marks))) return [canonKeys(v, marks)]
  return v
}
