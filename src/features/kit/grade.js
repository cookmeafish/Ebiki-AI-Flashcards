// Local grading for typed answers (no AI): exact after normalizing, or exact except for accents.
// Subject-agnostic: "accents" only matter where the text has them.
import { answerInQuestionText, leakNorm, NO_SPACE_SCRIPT, HANGUL } from '../../utils/leak'
import { clampTier, tierTeaches } from '../../utils/questionTier'

// Edge punctuation, Latin and CJK (猫。 is 猫). NFKC folds full-width letters and half-width kana (ＲＡＩＤ is RAID).
const TRAILING_PUNCT = /[\s.,;:!?¡¿"'`´“”‘’«»()[\]。、，．！？：；「」『』【】（）〈〉《》・…]+$/u
const LEADING_PUNCT = /^[\s.,;:!?¡¿"'`´“”‘’«»()[\]。、，．！？：；「」『』【】（）〈〉《》・…]+/u
export const normalizeAnswer = (s) => String(s ?? '').normalize('NFKC').toLowerCase().replace(LEADING_PUNCT, '').replace(TRAILING_PUNCT, '').replace(/\s+/g, ' ').trim()
// Only ACCENT marks: Latin/Greek/Cyrillic diacritics and Arabic/Hebrew vowel points. Kana dakuten (か/が), Indic vowel
// signs (क/का) and Thai vowels are part of the letter: dropping them made another word count as "an accent slip".
const ACCENT_MARKS = /[\u0300-\u036f\u1ab0-\u1aff\u1dc0-\u1dff\u20d0-\u20ff\ufe20-\ufe2f\u0591-\u05c7\u064b-\u065f\u0670]/gu
export const stripAccents = (s) => String(s).normalize('NFD').replace(ACCENT_MARKS, '').normalize('NFC')

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
// Scripts written without spaces (Han, kana, Thai) and Korean (particles glued to the word) use Study's guard
// (utils/leak.js): whole-word matching never fired there, so a 2-character answer shipped inside its own question.
export function leaksAnswer(question, accepted = []) {
  const q = ` ${stripAccents(normalizeAnswer(question)).replace(/[^\p{L}\p{N}]+/gu, ' ')} `
  const lq = leakNorm(question || '')
  return (Array.isArray(accepted) ? accepted : [accepted]).some((x) => {
    const w = stripAccents(normalizeAnswer(x)).replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
    if (w.length >= 3 && q.includes(` ${w} `)) return true
    const raw = String(x ?? '').trim()
    return (NO_SPACE_SCRIPT.test(raw) || HANGUL.test(raw)) && answerInQuestionText(lq, raw)
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
// `clean`: the shown-text cleaner (dashes, shrimp) for choices and accepted answers, which reach the screen too.
// An `answer` sent as the string "2" is read as the index (both prompts ask for an index or a text; read as text it
// matched no choice and the question was dropped), unless a choice IS that number ("1990").
export function sanitizeQuestions(raw, { maxChoices = 4, audioLang = '', speakLang = '', dual = false, clean = (s) => s } = {}) {
  if (!Array.isArray(raw)) return []
  const out = []
  for (const given of raw) {
    if (!given || typeof given !== 'object') continue
    const q = { ...given }
    if (Array.isArray(q.choices)) {
      q.choices = q.choices.map((c) => clean(String(c ?? '')))
      if (typeof q.answer === 'string') {
        const a = q.answer.trim()
        q.answer = /^\d+$/.test(a) && Number(a) < q.choices.length && !q.choices.some((c) => String(c).trim() === a) ? Number(a) : clean(q.answer)
      }
    }
    if (Array.isArray(q.accepted)) q.accepted = q.accepted.map((x) => clean(String(x ?? '')))
    const prompt = String(q.question || q.prompt || '').trim()
    if (!prompt) continue
    const explanation = String(q.explanation || '').trim()
    const target = q.target != null ? String(q.target) : ''
    const say = String(q.say || '').trim()
    const extra = { ...(say ? { audio: { text: say, lang: audioLang } } : {}), ...(q.speak === true ? { speak: true, speakLang } : {}) }
    // `tier` (the question ladder, utils/questionTier.js): a number on the raw question is kept (clamped). A TIER 0
    // teaching question shows its answer on purpose ("this is how you say rain: lluvia; now you"), so the leak guard
    // lets it through (tierTeaches); every other tier is guarded as before.
    const tier = q.tier != null && q.tier !== '' && Number.isFinite(Number(q.tier)) ? clampTier(q.tier) : null
    if (tier != null) extra.tier = tier
    const leaks = (list) => (tier != null && tierTeaches(tier) ? false : leaksAnswer(prompt, list))
    const typedAccepted = Array.isArray(q.accepted) ? q.accepted.map((x) => String(x).trim()).filter(Boolean) : []
    if (dual && Array.isArray(q.choices) && q.choices.length >= 2 && typedAccepted.length && !leaks(typedAccepted)) {
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
    // With no choices a number IS the answer (a port, a year: 443 came back as JSON 443 and the question was dropped).
    const accepted = [...new Set([...(Array.isArray(q.accepted) ? q.accepted : []), ...(q.answer != null && (typeof q.answer !== 'number' || !Array.isArray(q.choices)) ? [q.answer] : [])].map((x) => String(x).trim()).filter(Boolean))]
    if (!accepted.length) continue
    if (leaks(accepted)) continue
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
