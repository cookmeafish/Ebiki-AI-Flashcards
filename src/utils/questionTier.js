// THE QUESTION LADDER (pure, tested by questionTier.test.js): one question per review, harder as the card matures.
// Anki's spacing replaces the old three questions per card: instead of easy, medium and hard in one sitting, each
// review asks ONE question at the card's tier, so a card climbs the ladder over its life. The SAME ladder drives Study,
// raids and Legends fights (one module, one set of instructions, one chip).
//
// Thresholds follow the vocabulary research order (recognition → receptive recall → controlled production → free
// production → generative use: Laufer & Goldstein 2004; Webb) laid over Anki's own schedule. Anki already reacts to
// a struggling card: a lapse sends it to relearning and shrinks its interval, so the tier drops with it and no lapse
// rule of ours is needed. Anki calls a card MATURE at 21 days, where free production starts.
//   0 Meet       never reviewed            taught while asked: answerable first try from the context shown
//   1 Recognize  learning / relearning, or due again within 2 days
//   2 Recall     interval 3 to 6 days
//   3 Use        interval 7 to 20 days    (Anki's young cards)
//   4 Produce    interval 21 to 89 days   (Anki's mature cards)
//   5 Master     interval 90 days or more
import { canonKeys } from './aiJson'

export const TIERS = [
  { id: 0, key: 'meet', icon: '🌱' },
  { id: 1, key: 'recognize', icon: '🌿' },
  { id: 2, key: 'recall', icon: '🧠' },
  { id: 3, key: 'use', icon: '🛠' },
  { id: 4, key: 'produce', icon: '✍️' },
  { id: 5, key: 'master', icon: '🔥' },
]
// Lowest interval (days) of tiers 2..5.
export const TIER_DAYS = { 2: 3, 3: 7, 4: 21, 5: 90 }
export const MAX_TIER = 5
export const clampTier = (t) => (Number.isFinite(Number(t)) ? Math.max(0, Math.min(MAX_TIER, Math.round(Number(t)))) : 2)

// card: an Anki cardsInfo row ({ type, queue, interval, reps }) or a relearn copy ({ _relearn: true }).
export function tierOf(card) {
  if (!card) return 2
  if (card._relearn || card.relearn) return 1
  const type = Number(card.type), queue = Number(card.queue), reps = Number(card.reps)
  if (type === 0 || queue === 0 || (Number.isFinite(reps) && reps === 0 && !(Number(card.interval) > 0))) return 0
  if (type === 1 || type === 3 || queue === 1 || queue === 3) return 1
  const ivl = Number(card.interval)
  if (!Number.isFinite(ivl) || ivl < 0) return 2 // unknown schedule: today's middle question
  if (ivl >= TIER_DAYS[5]) return 5
  if (ivl >= TIER_DAYS[4]) return 4
  if (ivl >= TIER_DAYS[3]) return 3
  if (ivl >= TIER_DAYS[2]) return 2
  return 1
}

// A Legends item has no Anki schedule; its codex tier (new → bronze → silver → gold, Extras.jsx itemTier) says how
// well it is known. Bosses sit one step up (the climax), Legendary two.
const CODEX_TIER = { new: 0, bronze: 1, silver: 2, gold: 3 }
export function tierOfItem(codex, { kind = '' } = {}) {
  const base = CODEX_TIER[codex] ?? 1
  const bump = kind === 'legendary' ? 2 : kind === 'boss' ? 1 : 0
  return clampTier(base + bump)
}

export const tierLabelKey = (t) => `qt_${TIERS[clampTier(t)].key}`
export const tierTipKey = (t) => `qt_${TIERS[clampTier(t)].key}Tip`
export const tierIcon = (t) => TIERS[clampTier(t)].icon

// THE CLEAR-ANSWER RULE, for every question at every tier, in every surface (Study, raids, Legends): the learner must
// be able to tell exactly which ONE answer is wanted. Shared wording so every prompt says it the same way.
export const CLEAR_ANSWER_RULE = 'ONE CLEAR ANSWER: before finalizing EVERY question, try 2 to 3 plausible alternatives (synonyms, related terms, other forms). If any of them would also be a fair answer, the question is INVALID until fixed: add a compact cue in the question (the precise sense, the register, the context, or for a typed word in a language course the first letter in quotes) that rules them out, or list every fair answer as accepted. Never a question with two defensible answers.'

// THE REVIEW PASS (the second, independent look at every question before the learner sees it; Study, raids and
// Legends all run it with these words). The reviewer sees the card(s) and the questions, never as their author.
export const QUESTION_CHECK_RULES = [
  'Reject a question when ANY of these holds:',
  '- A second answer is defensible (a synonym, another form, another term) and is neither excluded by a cue nor listed as accepted.',
  '- The key is wrong, or an accepted answer is not actually correct.',
  '- The answer (or a giveaway form of it) appears in the question, EXCEPT a TIER 0 teaching question, which shows it on purpose.',
  '- A TIER 0 question cannot be answered correctly on the first try from what it shows.',
  '- Its choices hold two defensible options, or the right option is missing.',
  '- It asks about something the card does not contain, or needs knowledge the learner cannot have.',
  '- Its tier does not match what it asks (a TIER 4 question that is only a translation, a TIER 1 question with no support).',
].join('\n')

// What a question at this tier asks. isLanguage: a language course (learned language L, phrasing language Q).
// Returns one instruction paragraph; callers add their own JSON shape and safety rules.
export function tierInstruction(tier, { isLanguage = false, learnLang = 'the learned language', quizLang = 'the learner\'s language' } = {}) {
  const t = clampTier(tier)
  const L = learnLang, Q = quizLang
  const lang = [
    // 0 Meet
    `TIER 0 (MEET: this card has NEVER been studied; the learner may never have seen this word). TEACH WHILE ASKING: the question itself must give everything needed to answer correctly on the FIRST try. Write 1 to 2 short sentences in ${Q} that introduce the ${L} word's meaning and show it in a natural ${L} example sentence, THEN ask for the word in a way the context makes obvious (e.g. "This is how you say '<meaning>' in ${L}: '<example sentence with the word>'. Now you: how do you say '<meaning>'?"). It is fine and EXPECTED that the word appears in the teaching part: the goal is a first successful retrieval, not a test. Keep it short and friendly. Type "recall".`,
    // 1 Recognize
    `TIER 1 (RECOGNIZE: the card is still being learned). Easy, well-supported recall: give the meaning in ${Q} plus a short ${L} context sentence with the word blanked out, AND a sense cue, so a learner who has seen the word once or twice can produce it. Type "fill_blank" or "recall".`,
    // 2 Recall
    `TIER 2 (RECALL: reviewed a few times). PRODUCE the ${L} word from its meaning: ask in ${Q} for the ${L} word for the card's meaning, pinned by a compact sense cue (and for a typed answer its first letter in quotes). Type "recall".`,
    // 3 Use
    `TIER 3 (USE: a young card). Test USING the word in context: a natural ${L} sentence with the word blanked (the sentence supplies tense, person and agreement so exactly one form is right, or every valid form is accepted), OR choosing it over a close synonym for a stated situation. Type "fill_blank".`,
    // 4 Produce
    `TIER 4 (PRODUCE: a mature card). Free production: describe a short everyday situation in ${Q} (never naming the word) and ask the learner to write ONE short ${L} sentence that uses the card's word to express it, or to give the right form for a stated subject and time. Grading accepts any sentence that uses the card's word correctly with the card's meaning. acceptedAnswers: the word and its forms (the grader looks for them). Type "explanation" for the sentence (graded on correct use), "recall" for a form.`,
    // 5 Master
    `TIER 5 (MASTER: a long-known card). Generative use and nuance: a common collocation, the register (formal or casual), its opposite, which of two phrasings a native would say, or fixing a short sentence that misuses it. Still exactly one fair answer (or every fair answer accepted). Type "recall" or "fill_blank" (or "explanation" for a corrected sentence).`,
  ]
  const gen = [
    `TIER 0 (MEET: this card has NEVER been studied). TEACH WHILE ASKING: in 1 to 2 short sentences explain what the card's term or fact IS (from the card) with a concrete example, THEN ask for it in a way that text makes obvious, so the learner answers correctly on the FIRST try. The term may appear in the teaching part. Type "recall".`,
    `TIER 1 (RECOGNIZE: still being learned). Easy recall with support: give the definition or the key clue plus a short context, ask for the term or fact. Type "recall".`,
    `TIER 2 (RECALL: reviewed a few times). Blind recall: a definition, scenario or usage context that forces the exact term or fact, never naming it. Type "recall".`,
    `TIER 3 (USE: a young card). Application: a short realistic scenario; ask which term, step, value or technique from this card applies. Type "recall".`,
    `TIER 4 (PRODUCE: a mature card). Explain or compare: why or how it works, what distinguishes it from the closest look-alike, or the order of its steps. Open answer graded on understanding. Type "explanation".`,
    `TIER 5 (MASTER: a long-known card). Edge cases and troubleshooting: what goes wrong if it is missing or misapplied, when NOT to use it, or a tricky exam-style case. Exactly one fair answer, or open and graded on understanding. Type "recall" or "explanation".`,
  ]
  return (isLanguage ? lang : gen)[t]
}

// Tiers whose question may show the word in its teaching text (the leak guard must not drop them).
export const tierTeaches = (tier) => clampTier(tier) === 0
// Tiers whose question is OPEN (graded on use or understanding, not one exact word): no letter cue there.
export const tierOpen = (tier, isLanguage) => (isLanguage ? clampTier(tier) === 4 : clampTier(tier) >= 4)

// THE REVIEW PASS, its prompt and its reply (Study builds its call with these; raids and Legends may too). The reviewer
// is a second, independent model call: it sees the card and the questions, applies QUESTION_CHECK_RULES, and names what
// fails. card: { front, back }; questions: [{ question, type, tier, acceptedAnswers, choices, answerIdx }].
export function buildQuestionReviewPrompt({ front = '', back = '', questions = [], isLanguage = false, learnLang = '', subject = '' } = {}) {
  const rows = questions.map((q, i) => {
    const choices = Array.isArray(q?.choices) && q.choices.length
      ? `\n   choices: ${q.choices.map((c, ci) => `${ci === q.answerIdx ? '[correct] ' : ''}${c}`).join(' | ')}`
      : ''
    const acc = Array.isArray(q?.acceptedAnswers) && q.acceptedAnswers.length ? q.acceptedAnswers.join(' / ') : '(open: graded on understanding or correct use)'
    return `${i}. TIER ${clampTier(q?.tier ?? 2)} (${TIERS[clampTier(q?.tier ?? 2)].key}), type ${q?.type || 'recall'}\n   question: ${String(q?.question || '')}\n   accepted: ${acc}${choices}`
  }).join('\n')
  return [
    `Card front: "${front}"`,
    `Card back: "${back}"`,
    isLanguage ? `This is a ${learnLang || 'language'} course: the answer is the ${learnLang || 'learned'} word or phrase on the card.` : `Subject: ${subject || 'general study'}. Not a language course.`,
    '',
    'You did NOT write these questions. Check each one independently, as a strict reviewer.',
    QUESTION_CHECK_RULES,
    '',
    'Questions:',
    rows,
    '',
    'Return ONLY JSON: {"verdicts":[{"i":0,"ok":true,"reason":""}]} with one verdict per question, in order. "reason" (when ok is false) names the exact problem in one short sentence, in English.',
  ].join('\n')
}
const okFlag = (v) => v === true || v === 1 || /^(true|yes|1|ok|pass|valid)$/i.test(String(v ?? '').trim())
// parsed: the reply through parseAiJson. → { complete, fails: [{ i, reason }] }. complete = every question got a
// verdict; a question without one is NOT a pass (the caller treats it as unreviewed).
export function parseQuestionReview(parsed, count) {
  // The list under another key ({"results": [...]}), or ONE verdict object for a one-question card.
  const isRow = (v) => v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).some((k) => /^ok$/i.test(k))
  const other = parsed && typeof parsed === 'object' && !Array.isArray(parsed)
    ? Object.values(parsed).find((v) => Array.isArray(v) && v.some(isRow)) : null
  const list = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.verdicts) ? parsed.verdicts : other || (count === 1 && isRow(parsed) ? [parsed] : null)
  const seen = new Set()
  const fails = []
  if (list) list.forEach((row, pos) => {
    const v = canonKeys(row, ['i', 'ok', 'reason'])
    if (!v || typeof v !== 'object') return
    const i = Number.isInteger(Number(v.i)) && v.i !== '' && v.i !== null && v.i !== undefined ? Number(v.i) : pos
    if (i < 0 || i >= count || seen.has(i)) return
    seen.add(i)
    if (!okFlag(v.ok)) fails.push({ i, reason: String(v.reason || 'rejected by the review').slice(0, 300) })
  })
  return { complete: seen.size === count, reviewed: [...seen], fails }
}

// GRADING THE OPEN TIERS (shared wording; Study's grader, raids and Legends judges say it the same way).
// Language TIER 4 (write a sentence): correct when the sentence uses the card's word (any form) correctly with the
// card's meaning and is understandable; other grammar is only a note (never makes it wrong) unless grammar feedback is
// on. General TIER 4 and 5 explanations: graded on understanding, any wording.
export function openTierGradingRule({ isLanguage = false, grammarOn = false } = {}) {
  return isLanguage
    ? `- TIER 4 open sentence ("write a sentence that uses ..."): CORRECT when the sentence uses the card's word (any form of it) correctly, with the card's meaning, and is understandable. Mistakes elsewhere in the sentence are ${grammarOn ? 'noted (they may count against it only when they make the sentence wrong or unclear)' : 'at most a short note and never make it wrong'}. WRONG when the word is missing, replaced by a synonym, or used with another meaning.`
    : '- TIER 4 and TIER 5 open questions (explain, compare, troubleshoot): grade on understanding. CORRECT when the answer shows the right idea in any wording, even short; WRONG only when it is factually wrong, misses the point asked, or is empty.'
}

// CHOICES FROM THE DECK, for a word-answer question that arrived without usable ones (the give-up question, a reply
// that left them out): its answer plus 3 OTHER cards' answers as distractors (the same kind of thing: words of the
// same deck), closest in length first so none stands out. A candidate equal to any accepted answer (case, accents and
// punctuation aside) or to another candidate is skipped. → { choices, answerIdx } (answer first; the caller's
// buildChoices verifies and shuffles) or null when the deck has too few others. Open questions get none.
const choiceKey = (s) => String(s ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
// `fill`: a second, weaker pool used only for the options `pool` could not supply (App: other cards' ANSWERS first, the
// same kind of thing as this answer, then the deck's fronts, which may be in the learner's own language).
export function choicesFromPool(q, pool = [], { need = 3, maxLen = 40, fill = [] } = {}) {
  if (!q || typeof q !== 'object' || q.type === 'explanation') return null
  const accepted = (Array.isArray(q.acceptedAnswers) ? q.acceptedAnswers : []).map((a) => String(a ?? '').trim()).filter(Boolean)
  const answer = accepted[0]
  if (!answer) return null
  const taken = new Set(accepted.map(choiceKey))
  const picks = []
  const rank = (list) => (Array.isArray(list) ? list : []).map((c) => String(c ?? '').trim()).filter((c) => c && c.length <= maxLen)
    .map((c, i) => ({ c, i, d: Math.abs([...c].length - [...answer].length) })).sort((a, b) => a.d - b.d || a.i - b.i)
  for (const { c } of [...rank(pool), ...rank(fill)]) {
    if (picks.length >= need) break
    const k = choiceKey(c)
    if (!k || taken.has(k)) continue
    taken.add(k)
    picks.push(c)
  }
  if (picks.length < need) return null
  return { choices: [answer, ...picks], answerIdx: 0 }
}

// CHOICES FOR AN OPEN QUESTION (the owner: multiple choice must ALWAYS be available). A tier 4 sentence task or a general
// "explain" question that arrived without options gets them from one small extra call: 4 short options, exactly one
// correct. For a sentence task: one sentence using the card's word correctly with its meaning, three that misuse it or
// use a wrong word.
// `answer`: a WORD question (it has an accepted answer) that neither the model nor the deck's other answers could give
// options (a long general-mode term, a small deck): the correct option is that answer, word for word, and the other
// three are the same kind of term (the caller's buildChoices checks the right one against the accepted answers).
export function buildOpenChoicesPrompt({ front = '', back = '', question = '', isLanguage = false, learnLang = '', quizLang = '', answer = '' } = {}) {
  const word = String(answer || '').trim()
  return [
    `Card front: "${front}"`,
    `Card back: "${String(back).slice(0, 600)}"`,
    `${word ? 'Question' : 'Open question'} shown to the learner: "${question}"`,
    '',
    'Write 4 answer options for this question so the learner can pick instead of typing. EXACTLY ONE is correct; the other three are clearly WRONG (never defensible), the same kind of thing, similar length, and tempting only to someone who half-knows it.',
    word
      ? `The correct option is exactly "${word}" (word for word). The three wrong options are other ${isLanguage ? `${learnLang || 'learned-language'} words or phrases` : 'terms from the same subject'} of the same kind (same part of speech or category), never a synonym or another form of "${word}".`
      : isLanguage
      ? `If the question asks for a ${learnLang || 'learned-language'} sentence: the correct option is one short natural ${learnLang || ''} sentence that uses the card's word correctly with the card's meaning; the wrong ones misuse it (wrong meaning or impossible use) or use a different word. Options in ${learnLang || 'the learned language'}.`
      : `Options are short statements in ${quizLang || 'the learner\'s language'}: one states the right idea, three state common misconceptions.`,
    'Return ONLY JSON: {"choices":["...","...","...","..."],"answerIdx":0}',
  ].join('\n')
}
// parsed: the reply through parseAiJson → { choices, answerIdx } or null (exactly 4 distinct non-empty options and a
// valid index, "2" read as 2).
export function parseOpenChoices(parsed) {
  // Index under another name ("answerIndex", "answer_idx", "correctIndex", a numeric "answer"), and options written as
  // objects ([{"text": "...", "correct": true}]): read as the same thing.
  const p = canonKeys(parsed, ['choices', 'answerIdx', 'answerIndex', 'correctIndex', 'answer'])
  const raw = Array.isArray(p?.choices) ? p.choices : Array.isArray(p?.options) ? p.options : null
  if (!raw || raw.length !== 4) return null
  const list = raw.map((c) => (c && typeof c === 'object' ? (c.text ?? c.option ?? c.choice ?? '') : c))
  const choices = list.map((c) => String(c ?? '').trim())
  if (choices.some((c) => !c) || new Set(choices.map((c) => c.toLowerCase())).size !== 4) return null
  const flagged = raw.findIndex((c) => c && typeof c === 'object' && /^(true|yes|1)$/i.test(String(c.correct ?? c.isCorrect ?? '')))
  const given = [p.answerIdx, p.answerIndex, p.correctIndex].find((v) => v != null && v !== '')
    ?? (p.answer != null && /^\s*\d\s*$/.test(String(p.answer)) ? p.answer : undefined)
  const idx = given != null ? Number(given) : flagged
  if (!Number.isInteger(idx) || idx < 0 || idx > 3) return null
  return { choices, answerIdx: idx }
}
