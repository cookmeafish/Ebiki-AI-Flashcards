// ONE FACT CHECK PER MISS (decided 2026-11-16; pure apart from the ai call it is given, tested by missCheck.test.js).
// A missed fight answer can produce two texts that state word facts: the grader's NOTE and the boss's TAUNT (judging
// real lines found a false word claim in each). Both are fact checked against the card BEFORE the learner reads them,
// in ONE request: the first text to arrive waits for the other (only when the other was announced, at most JOIN_MS),
// then a single check reads both, and each flagged quote is given back to the text it came from.
// FAIL CLOSED: a check that throws or cannot be read hides the note (the answer line still shows) and replaces the
// taunt with a generic one; a text that arrives too late for the shared check is checked on its own.
// Callers: kit/judge.js (the note, announced inside judgeStrike) and kit/tauntStore.js (the taunt, announced by
// fetchTaunt). The pairing key is the question OBJECT plus the answer: one miss, never two.

export const JOIN_MS = 6000

const reg = new WeakMap()
const deferred = () => { let resolve; const p = new Promise((r) => { resolve = r }); return { p, resolve } }
const fold = (s) => String(s ?? '').toLowerCase().normalize('NFC').replace(/[«»“”"'’]/g, '').replace(/\s+/g, ' ').trim()

function entry(q, answer) {
  if (!q || typeof q !== 'object') return null
  let m = reg.get(q)
  if (!m) { m = new Map(); reg.set(q, m) }
  const k = String(answer ?? '').trim()
  let e = m.get(k)
  if (!e) { e = { want: { note: false, taunt: false }, text: { note: deferred(), taunt: deferred() }, run: null }; m.set(k, e) }
  return e
}

// Say that a note or a taunt for this miss is on its way (synchronously, before any await), so the other waits for it.
export function expectMissText(q, answer, side) {
  const e = entry(q, answer)
  if (e && (side === 'note' || side === 'taunt')) e.want[side] = true
}

// What the checker is told is TRUE: the accepted answer and the card's own meaning for it.
export const missMaterial = (q) => [
  `The accepted answer is: ${(Array.isArray(q?.accepted) ? q.accepted : []).join(' / ')}`,
  q?._guard?.meaning ? `The card's meaning for it: ${q._guard.meaning}` : '',
].filter(Boolean).join('\n')

// ONE check over the given texts → { note: [flags], taunt: [flags], failed, checked: { note, taunt } }.
// No fact check available (ctx without it): nothing flagged, `unchecked` (the texts show as written, as before).
export async function checkTexts(ai, q, answer, { note = '', taunt = '' } = {}) {
  const n = String(note || '').trim(), t = String(taunt || '').trim()
  const checked = { note: n, taunt: t }
  if (!n && !t) return { note: [], taunt: [], failed: false, checked }
  if (typeof ai?.factCheck !== 'function') return { note: [], taunt: [], failed: false, unchecked: true, checked }
  let found
  try {
    found = await ai.factCheck({ reply: [n, t].filter(Boolean).join('\n\n'), question: `${q?.prompt || ''}\nThe learner answered: ${String(answer ?? '').trim()}`, context: missMaterial(q), always: true, strict: true })
  } catch { return { note: [], taunt: [], failed: true, checked } }
  if (!Array.isArray(found)) return { note: [], taunt: [], failed: true, checked }
  const out = { note: [], taunt: [], failed: false, checked }
  for (const f of found) {
    const quote = fold(f?.quote)
    if (!quote) continue
    const inNote = !!n && fold(n).includes(quote), inTaunt = !!t && fold(t).includes(quote)
    if (inNote) out.note.push(f)
    if (inTaunt) out.taunt.push(f)
    if (!inNote && !inTaunt) { if (n) out.note.push(f); if (t) out.taunt.push(f) } // unattributable: both are suspect
  }
  return out
}

// Hand over this miss's note or taunt (raw, '' when there is none) → the shared check's result. A text that missed the
// shared check (it came after JOIN_MS) is checked on its own.
export async function checkMissText(ai, q, answer, side, text) {
  const mine = String(text || '').trim()
  const e = entry(q, answer)
  if (!e) return checkTexts(ai, q, answer, { [side]: mine })
  e.want[side] = true
  e.text[side].resolve(mine)
  if (!e.run) {
    const within = (d) => Promise.race([d.p, new Promise((r) => setTimeout(() => r(''), JOIN_MS))])
    e.run = Promise.all(['note', 'taunt'].map((s) => (e.want[s] ? within(e.text[s]) : ''))).then(([note, taunt]) => checkTexts(ai, q, answer, { note, taunt }))
  }
  const res = await e.run
  return res.checked[side] === mine ? res : checkTexts(ai, q, answer, { [side]: mine })
}
