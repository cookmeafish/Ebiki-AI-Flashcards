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
      const choices = [...new Set(q.choices.map((c) => String(c).trim()).filter(Boolean))].slice(0, maxChoices)
      let idx = Number.isInteger(q.answer) ? q.answer : choices.findIndex((c) => normalizeAnswer(c) === normalizeAnswer(q.answer ?? typedAccepted[0]))
      if (idx < 0) idx = choices.findIndex((c) => typedAccepted.some((a) => normalizeAnswer(a) === normalizeAnswer(c)))
      const alt = idx >= 0 && idx < choices.length && choices.length >= 2 ? shuffleChoices(choices, idx) : null
      out.push({ kind: 'typed', prompt, accepted: [...new Set(typedAccepted)], explanation, target, open: !!q.open, ...(alt ? { alt } : {}), ...extra })
      continue
    }
    if (Array.isArray(q.choices) && q.choices.length >= 2) {
      const choices = [...new Set(q.choices.map((c) => String(c).trim()).filter(Boolean))].slice(0, maxChoices)
      let idx = Number.isInteger(q.answer) ? q.answer : choices.findIndex((c) => normalizeAnswer(c) === normalizeAnswer(q.answer))
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
