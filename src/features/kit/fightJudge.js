// FIGHT GRADING PROMPTS (pure, tested): the fast verdict, the background explanation, and the careful second look
// (the automatic re-check and the learner's appeal). Shared by Legends boss/Legendary fights and raids (kit/judge.js
// runs them). Subject-agnostic: a language question judges the tested word or form, anything else judges meaning
// (a CompTIA port number, a pilot checklist step).
//
// Fast first (the owner: damage and hearts land at once): the blocking call returns ONLY {target, all, accentsOnly}
// with a tiny token budget. The note and a glancing answer's "fix" follow-up are written afterwards, in the
// background. A re-check (and an appeal) can only RAISE a verdict (miss -> glancing/clean, glancing -> clean), never
// lower it: a right answer is never marked wrong after the fact.

import { clampTier, tierTeaches, tierOpen } from '../../utils/questionTier'
import { canonKeys } from '../../utils/aiJson'

export const VERDICT_MAX_TOKENS = 120
export const EXPLAIN_MAX_TOKENS = 400
export const RECHECK_MAX_TOKENS = 300
export const VERDICT_RANK = { error: -1, miss: 0, glancing: 1, clean: 2 }
const REASON_MAX = 300

// A model's yes/no flag: true/false, but also the STRINGS "true"/"False"/"yes"/"no". null = not a flag.
export const flagOf = (v) => {
  if (v === true || v === 1) return true
  if (v === false || v === 0) return false
  // "True." and "sí" happen (a reply that drifted into the learner's language): trailing punctuation off, a few languages.
  const s = String(v ?? '').trim().toLowerCase().replace(/[\s.!?。！？]+$/u, '')
  return /^(true|yes|y|correct|right|sí|si|oui|ja|vrai|verdadero|wahr|vero)$/.test(s) ? true
    : /^(false|no|n|incorrect|wrong|non|nein|faux|falso|falsch)$/.test(s) ? false : null
}

// `phrasing` (a fight's language line, kit/fightSettings.js) tells the grader which language the learner reads, and in
// a general mode that answers in any language count.
const subjectLine = (subject) => `Subject: ${subject?.name || ''}${subject?.description ? ` (the learner's own context: ${subject.description})` : ''}${subject?.phrasing ? `\n${subject.phrasing}` : ''}`
// THE QUESTION LADDER (utils/questionTier.js): the grader knows what KIND of answer the question asked for, so an open
// answer (a sentence the learner wrote, an explanation) is never matched as one exact word, and a teaching question's
// shown answer is expected (a right answer there is simply right). Shared by every fight grader and judgeAnswer.
export function tierJudgeLine(q, subject) {
  if (!q || q.tier == null || !Number.isFinite(Number(q.tier))) return ''
  const tier = clampTier(q.tier)
  const lang = !!subject?.isLanguage
  if (tierTeaches(tier)) return `This is a TIER 0 teaching question (the card is new): the question shows the answer on purpose. Grade it like any other: the expected answer is right.`
  if (q.open && tierOpen(tier, lang)) {
    return lang
      ? `This is a TIER ${tier} OPEN production question: the learner writes their OWN ${subject.learnLang || ''} sentence. "target" = the sentence uses the card's word (any correct form) with the card's meaning, correctly, and is understandable; NEVER compare it to one exact word or to the reference sentence. Grammar elsewhere in the sentence only matters for "all".`
      : `This is a TIER ${tier} OPEN question: judge the understanding it shows (any wording, any language), never an exact phrase.`
  }
  return `Question tier: ${tier} of 5 (how mature the card is).`
}
const questionLines = (q, ans, subject) => [
  `Question: ${q.prompt}`,
  tierJudgeLine(q, subject),
  q.kind === 'choice' && Array.isArray(q.choices) ? `Options: ${q.choices.join(' / ')}` : '',
  q.target ? `The question TESTS: ${q.target}` : '',
  q.accepted?.length ? `Reference answer(s): ${q.accepted.join(' / ')}` : '',
  q.kind === 'choice' && Number.isInteger(q.answerIdx) && q.choices?.[q.answerIdx] ? `Keyed option: ${q.choices[q.answerIdx]}` : '',
  `Student answer: ${ans}`,
  q.open ? 'This is an open question: any wording that does what was asked is correct.' : '',
]
// Grammar feedback (Study's setting, `subject.grammarFeedback` in a fight): off, grammar and agreement OUTSIDE the
// tested word or form do not count (Study grades them only with the setting on).
const rulesFor = (subject) => (subject?.isLanguage
  ? `"target": the tested ${subject.learnLang} word, form or rule is used correctly (a single-letter typo in it is still wrong for "all", but right for "target" when the word is clearly meant). "all": the WHOLE answer is correct ${subject.learnLang} for what was asked (${subject.grammarFeedback === false ? 'spelling and accents; grammar and agreement outside the tested word or form do NOT count' : 'grammar, agreement, spelling, accents'}). "accentsOnly": true when "target" is true and the ONLY mistakes are missing or wrong accents that do not turn a word into a different word or form.`
  : '"target": the answer shows the tested idea correctly (a synonym, abbreviation or paraphrase is fine). "all": nothing in it is wrong (no wrong detail, no misused term). "accentsOnly": false.')

// The one object a grading reply holds, however the model wrapped it: a list of one ([{"target": true, ...}]) or a
// wrapper key ({"verdict": {...}}, {"result": {...}}). Read as nothing, the grading "did not happen" and the learner
// had to answer again on every provider that wraps. `keys`: the fields that mark the real object.
// Keys in another case or spelling ({"Target": true, "accents_only": false}) are read as the ones asked for.
const GRADE_KEYS = ['target', 'all', 'accentsOnly', 'correct', 'right', 'note', 'fix', 'why', 'different', 'question', 'answer']
export const gradeObject = (j, keys) => {
  const canon = (o) => canonKeys(o, [...new Set([...keys, ...GRADE_KEYS])])
  const has = (o) => o && typeof o === 'object' && !Array.isArray(o) && keys.some((k) => k in canon(o))
  const pick = (o) => (has(o) ? canon(o) : null)
  if (Array.isArray(j)) return pick(j.find(has))
  if (!j || typeof j !== 'object') return null
  if (has(j)) return canon(j)
  const inner = Object.values(j).filter((v) => v && typeof v === 'object')
  return inner.length === 1 ? (Array.isArray(inner[0]) ? pick(inner[0].find(has)) : pick(inner[0])) : null
}

// THE FAST VERDICT: three flags, nothing else.
export function buildVerdictPrompt(subject, q, ans) {
  return {
    system: 'You grade one answer in a learning game. Reply with JSON only, nothing else: {"target": true|false, "all": true|false, "accentsOnly": true|false}.',
    user: [subjectLine(subject), ...questionLines(q, ans, subject), rulesFor(subject)].filter(Boolean).join('\n'),
  }
}
// → { target, all, accentsOnly } (booleans) or null when the reply holds no readable "target".
// A reply that answered the plain question instead ({"correct": true}) is read as a whole verdict: right = clean.
export function parseVerdict(raw) {
  const j = gradeObject(raw, ['target', 'correct', 'right'])
  if (!j) return null
  if (flagOf(j.target) == null) {
    const c = flagOf(j.correct ?? j.right)
    return c == null ? null : { target: c, all: c, accentsOnly: false }
  }
  const target = flagOf(j.target)
  return { target, all: flagOf(j.all) === true, accentsOnly: flagOf(j.accentsOnly) === true }
}
// The verdict the flags mean, under the mode's accent setting.
export function verdictOf(flags, { strictAccents = true } = {}) {
  if (!flags) return 'error'
  if (!flags.target) return 'miss'
  if (flags.all) return 'clean'
  if (flags.accentsOnly) return strictAccents ? 'glancing' : 'clean'
  return 'glancing'
}

// THE EXPLANATION (background): a short neutral note in the learner's language, and for a glancing answer whose other
// slip is not only accents, the follow-up question the boss throws back ("fix").
export function buildExplainPrompt(subject, q, ans, { verdict = 'miss', accentsOnly = false } = {}) {
  const wantFix = verdict === 'glancing' && !accentsOnly
  return {
    system: `You explain one graded answer to a learner. Reply with JSON only: {"note": "..."${wantFix ? ', "fix": {"question": "...", "answer": "..."} | null' : ''}}.`,
    user: [
      subjectLine(subject), ...questionLines(q, ans, subject),
      verdict === 'miss' ? 'The answer was judged WRONG.' : verdict === 'glancing' ? 'The answer got the tested thing right but has another mistake.' : 'The answer was judged right.',
      `Write "note" in ${subject?.userLang || 'English'}: one short, neutral sentence saying what was wrong and the right form or answer. Plain words, no dashes, no shrimp emoji.`,
      wantFix ? '"fix": a short follow-up question (in the same language as the question above) that makes the student correct that OTHER mistake, with its correct "answer". null when there is none.' : '',
    ].filter(Boolean).join('\n'),
  }
}
// → { note, attack? } (attack = { prompt, accepted }) or null.
export function parseExplain(raw, clean = (s) => String(s || '').trim()) {
  const j = gradeObject(raw, ['note', 'fix'])
  if (!j) return null
  const note = clean(String(j.note || ''))
  const fq = j.fix && typeof j.fix === 'object' ? String(j.fix.question || '').trim() : ''
  const fa = j.fix && typeof j.fix === 'object' ? String(j.fix.answer || '').trim() : ''
  return { note, ...(fq && fa ? { attack: { prompt: clean(fq), accepted: [fa] } } : {}) }
}

// THE CAREFUL SECOND LOOK: the automatic re-check of a miss or glancing verdict, and the learner's appeal (`reason`,
// optional, what they say in their defence). Strict about being FAIR to the learner: synonyms, accepted variants,
// another valid answer the question allows, a typo that changes nothing all count.
export function buildRecheckPrompt(subject, q, ans, { verdict = 'miss', reason = '' } = {}) {
  const why = String(reason || '').trim().slice(0, REASON_MAX)
  return {
    system: 'You are a careful, fair second grader in a learning game. A first grader may have been too strict. Reply with JSON only: {"right": true|false, "all": true|false, "why": "..."}.',
    user: [
      subjectLine(subject), ...questionLines(q, ans, subject),
      `The first grader said: ${verdict === 'glancing' ? 'the tested thing is right but something else is wrong' : 'wrong'}.`,
      why ? `The student appeals and says: "${why}". Weigh it honestly; never just agree because they asked.` : '',
      'Look again, carefully. Is the student actually right? Consider synonyms, equivalent wordings, accepted variants and abbreviations, another answer the question really allows, and typos that do not change the meaning or turn it into another word or form.',
      subject?.isLanguage ? `For ${subject.learnLang}, the tested word or form must still be the right one; a wrong form is still wrong.` : 'Judge the idea, not the wording.',
      '"right": the tested thing is correct. "all": nothing else in the answer is wrong either.',
      `Write "why" in ${subject?.userLang || 'English'}: one short, kind sentence with the reason. Plain words, no dashes, no shrimp emoji.`,
    ].filter(Boolean).join('\n'),
  }
}
// → { verdict, overturned, why } or null (unreadable). Only ever RAISES the first verdict.
export function parseRecheck(raw, prev = 'miss', clean = (s) => String(s || '').trim()) {
  const j = gradeObject(raw, ['right'])
  if (!j) return null
  const right = flagOf(j.right)
  if (right == null) return null
  const seen = !right ? 'miss' : flagOf(j.all) === true ? 'clean' : 'glancing'
  const verdict = (VERDICT_RANK[seen] ?? 0) > (VERDICT_RANK[prev] ?? 0) ? seen : prev
  return { verdict, overturned: verdict !== prev, why: clean(String(j.why || '')) }
}
