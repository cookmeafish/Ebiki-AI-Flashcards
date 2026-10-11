// THE OPTION CHECK (pure, tested by distractorCheck.test.js): one cheap, fail-soft look by the review model (role
// `qcheck`) at the FINAL options of choice questions, after utils/choicePool.js planned them: "is any wrong option also
// a correct answer here?". A wrong option that is really right marks a correct answer wrong, the worst failure of a
// choice question (the owner's "buen día" among the options for "buenos días", which also means good morning). The
// code guard (choicePool.js meaningsOverlap, sameLemma) catches what text can show; this catches the rest (a synonym
// the deck spells differently, a regional word). A flagged option is SWAPPED for a spare from the same plan, or
// dropped while 2 wrong options remain; else the set is unusable (the caller rewrites or drops the choices). Used by
// Study (App), raids (RaidRun, beside the review pass) and Legends quizzes (generate.js).
import { canonKeys } from './aiJson'

const NO_DASH = 'Never use em dashes or en dashes.'
const clip = (s, n) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n)

// items: [{ question, answer, options: [all options, the answer among them], meaning? }]
export function buildDistractorCheckPrompt(items, { isLanguage = false, learnLang = '' } = {}) {
  const rows = (items || []).map((it, i) => {
    const wrong = (it.options || []).filter((o) => o !== it.answer)
    return `${i}. Question: ${clip(it.question, 400)}\n   Correct answer: ${clip(it.answer, 120)}${it.meaning ? ` (it means: ${clip(it.meaning, 120)})` : ''}\n   Wrong options: ${wrong.map((o) => `"${clip(o, 120)}"`).join(', ')}`
  })
  return {
    system: `You check multiple-choice options before a learner sees them. For each question, list every WRONG option that a fair teacher would ALSO accept as a correct answer to that question (a synonym, another form of the answer, a regional word with the same meaning, a phrase native speakers use the same way, a value that is also right). ${isLanguage ? `Judge the ${learnLang || 'learned language'} as a native teacher of every region would.` : 'Judge as an expert in the subject.'} When unsure, list it. Reply with JSON only: {"flagged": [{"i": <question index>, "options": ["<the option exactly as written>"]}]} (an empty list when every wrong option is clearly wrong). ${NO_DASH}`,
    user: rows.join('\n'),
  }
}

// → Map(index → Set of flagged option texts), or null when the reply is not a usable verdict (fail-soft: nothing
// changes). Only options that are really among that question's WRONG options count.
export function parseDistractorCheck(raw0, items) {
  const raw = Array.isArray(raw0) ? raw0 : canonKeys(raw0, ['flagged'])
  const list = Array.isArray(raw) ? raw : Array.isArray(raw?.flagged) ? raw.flagged : null
  if (!list) return null
  const norm = (s) => String(s ?? '').normalize('NFC').trim().toLowerCase().replace(/^["'“”«»]+|["'“”«».!?]+$/g, '')
  const out = new Map()
  for (const f0 of list) {
    const f = canonKeys(f0, ['i', 'options', 'option'])
    const i = Number(f?.i)
    const it = items?.[i]
    if (!Number.isInteger(i) || !it) continue
    const wrong = new Map((it.options || []).filter((o) => o !== it.answer).map((o) => [norm(o), o]))
    const opts = (Array.isArray(f.options) ? f.options : f.option != null ? [f.option] : []).map((o) => wrong.get(norm(o))).filter(Boolean)
    if (!opts.length) continue
    out.set(i, new Set([...(out.get(i) || []), ...opts]))
  }
  return out
}

// One set with its flagged options swapped for spares (in place, so the answer keeps its slot) or dropped.
// set: { choices, answerIdx, spare? }. → { choices, answerIdx, spare } or null when fewer than `min` wrong options
// would remain.
export function swapFlagged(set, flagged, { min = 2 } = {}) {
  if (!set || !Array.isArray(set.choices) || !Number.isInteger(set.answerIdx)) return null
  const bad = flagged instanceof Set ? flagged : new Set(flagged || [])
  if (!bad.size) return set
  const right = set.choices[set.answerIdx]
  const spare = (set.spare || []).filter((o) => !bad.has(o) && !set.choices.includes(o))
  const out = []
  for (const c of set.choices) {
    if (c === right || !bad.has(c)) { out.push(c); continue }
    if (spare.length) out.push(spare.shift())
  }
  if (out.length - 1 < min) return null
  return { choices: out, answerIdx: out.indexOf(right), spare }
}
