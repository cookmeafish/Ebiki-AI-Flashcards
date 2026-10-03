// Local grading for typed answers (no AI): exact after normalizing, or exact except for accents.
// Subject-agnostic: "accents" only matter where the text has them.

const TRAILING_PUNCT = /[\s.,;:!?¡¿"'`´“”‘’«»()[\]]+$/u
const LEADING_PUNCT = /^[\s.,;:!?¡¿"'`´“”‘’«»()[\]]+/u
export const normalizeAnswer = (s) => String(s ?? '').toLowerCase().normalize('NFC').replace(LEADING_PUNCT, '').replace(TRAILING_PUNCT, '').replace(/\s+/g, ' ').trim()
export const stripAccents = (s) => String(s).normalize('NFD').replace(/\p{M}/gu, '').normalize('NFC')

// 'exact' | 'accent' (right letters, wrong or missing accents) | null (no local match; maybe ask the AI).
export function matchTyped(answer, accepted = []) {
  const a = normalizeAnswer(answer)
  if (!a) return null
  const list = (Array.isArray(accepted) ? accepted : [accepted]).map(normalizeAnswer).filter(Boolean)
  if (list.includes(a)) return 'exact'
  const bare = stripAccents(a)
  return list.some((x) => stripAccents(x) === bare) ? 'accent' : null
}

// Does a question give its own answer away? (Whole word/phrase, accent-insensitive, 3+ letters.)
export function leaksAnswer(question, accepted = []) {
  const q = ` ${stripAccents(normalizeAnswer(question)).replace(/[^\p{L}\p{N}]+/gu, ' ')} `
  return (Array.isArray(accepted) ? accepted : [accepted]).some((x) => {
    const w = stripAccents(normalizeAnswer(x)).replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
    return w.length >= 3 && q.includes(` ${w} `)
  })
}

// A model's choices, deduped by the SAME normalizer answers are matched with ("coche" and "Coche" were two tiles,
// one of them "wrong"), capped. An integer answer is resolved to its text BEFORE the dedupe (indexes shift).
function cleanChoices(rawChoices, answer, max) {
  const list = rawChoices.map((c) => String(c).trim()).filter(Boolean)
  const keyText = Number.isInteger(answer) && answer >= 0 && answer < rawChoices.length ? String(rawChoices[answer]).trim() : null
  const choices = []
  // Two options that differ only in case collapse to one, keeping the KEY's spelling: in German case is the word
  // (Essen food, essen to eat), and the first copy showed the noun as the right answer to "to eat".
  const at = new Map()
  for (const c of list) {
    const k = normalizeAnswer(c)
    if (at.has(k)) { if (keyText != null && c === keyText) choices[at.get(k)] = c; continue }
    at.set(k, choices.length); choices.push(c)
  }
  return { choices: choices.slice(0, max), keyText }
}

// Choices in a random order (models favor one slot), keeping track of the right one.
function shuffleChoices(choices, idx) {
  const order = choices.map((c, i) => [i, Math.random()]).sort((a, b) => a[1] - b[1]).map(([i]) => i)
  return { choices: order.map((i) => choices[i]), answerIdx: order.indexOf(idx) }
}

// Clean a model-written question list into the runner's shape; drops anything unusable.
// In: [{ question, type: 'choice'|'typed', choices, answer (index or text), accepted, explanation, target,
//        say (text to HEAR instead of read), speak (answer out loud) }]
// `audioLang` / `speakLang`: the language the audio is read in and the answer is spoken in.
// `dual`: a question with BOTH typed answers ("accepted") and choices stays typed and keeps the choices as `alt`
// ({ choices, answerIdx }): a fight lets the learner answer it either way (a power or a safe strike).
export function sanitizeQuestions(raw, { maxChoices = 4, audioLang = '', speakLang = '', dual = false } = {}) {
  if (!Array.isArray(raw)) return []
  const out = []
  for (const q of raw) {
    if (!q || typeof q !== 'object') continue
    const prompt = String(q.question || q.prompt || '').trim()
    if (!prompt) continue
    const explanation = String(q.explanation || '').trim()
    const target = q.target != null ? String(q.target) : ''
    const say = String(q.say || '').trim()
    const extra = { ...(say ? { audio: { text: say, lang: audioLang } } : {}), ...(q.speak === true ? { speak: true, speakLang } : {}) }
    const typedAccepted = Array.isArray(q.accepted) ? q.accepted.map((x) => String(x).trim()).filter(Boolean) : []
    if (dual && Array.isArray(q.choices) && q.choices.length >= 2 && typedAccepted.length && !leaksAnswer(prompt, typedAccepted)) {
      const { choices, keyText } = cleanChoices(q.choices, q.answer, maxChoices)
      let idx = choices.findIndex((c) => normalizeAnswer(c) === normalizeAnswer(keyText ?? q.answer ?? typedAccepted[0]))
      if (idx < 0) idx = choices.findIndex((c) => typedAccepted.some((a) => normalizeAnswer(a) === normalizeAnswer(c)))
      // A SECOND option that is also an accepted answer (a synonym) would be graded wrong when picked (a lost life, and
      // in a raid an Again in Anki): such a question is asked typed only.
      const twoRight = choices.some((c, i) => i !== idx && typedAccepted.some((a) => normalizeAnswer(a) === normalizeAnswer(c)))
      const alt = !twoRight && idx >= 0 && idx < choices.length && choices.length >= 2 ? shuffleChoices(choices, idx) : null
      out.push({ kind: 'typed', prompt, accepted: [...new Set(typedAccepted)], explanation, target, open: !!q.open, ...(alt ? { alt } : {}), ...extra })
      continue
    }
    if (Array.isArray(q.choices) && q.choices.length >= 2) {
      const { choices, keyText } = cleanChoices(q.choices, q.answer, maxChoices)
      const idx = choices.findIndex((c) => normalizeAnswer(c) === normalizeAnswer(keyText ?? q.answer))
      if (idx < 0 || idx >= choices.length || choices.length < 2) continue
      // Shuffle (models favor one slot), keeping track of the right one.
      const order = choices.map((c, i) => [i, Math.random()]).sort((a, b) => a[1] - b[1]).map(([i]) => i)
      out.push({ kind: 'choice', prompt, choices: order.map((i) => choices[i]), answerIdx: order.indexOf(idx), explanation, target, ...extra })
      continue
    }
    const accepted = [...new Set([...(Array.isArray(q.accepted) ? q.accepted : []), ...(q.answer != null && typeof q.answer !== 'number' ? [q.answer] : [])].map((x) => String(x).trim()).filter(Boolean))]
    if (!accepted.length) continue
    if (leaksAnswer(prompt, accepted)) continue
    out.push({ kind: 'typed', prompt, accepted, explanation, target, open: !!q.open, ...extra })
  }
  return out
}

// QuizRunner results → misses for EVENTS.PRACTICE_MISSED ([{ front, question, answer, expected }]). `front` = the item
// the question practiced (its "target"), else the given fallback.
export function missesFromResults(results = [], front = '') {
  return (Array.isArray(results) ? results : []).filter((r) => r && !r.correct && r.question && typeof r.question === 'object').map(({ question: q, answer }) => ({
    front: String(q.target || front || ''),
    // A listening question's prompt ("Type what you hear") means nothing later without what was heard (🔊 marks it).
    question: `${String(q.prompt || '')}${q.prompt && q.audio?.text ? ` 🔊 "${q.audio.text}"` : ''}`,
    answer: typeof answer === 'number' && Array.isArray(q.choices) ? String(q.choices[answer] ?? '') : String(answer ?? ''),
    expected: String(q.kind === 'choice' ? (q.choices?.[q.answerIdx] ?? '') : (q.accepted?.[0] ?? '')),
  })).filter((m) => m.question)
}
