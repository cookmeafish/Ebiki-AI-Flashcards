// FIGHT GRADING PROMPTS (pure, tested): the fast verdict, the background explanation, and the careful second look
// (the automatic re-check and the learner's appeal). Shared by Legends boss/Legendary fights and raids (kit/judge.js
// runs them). Subject-agnostic: a language question judges the tested word or form, anything else judges meaning
// (a CompTIA port number, a pilot checklist step).
//
// Fast first (the owner: damage and hearts land at once): the blocking call returns ONLY {target, all, accentsOnly}
// with a tiny token budget. The note and a glancing answer's "fix" follow-up are written afterwards, in the
// background. A re-check (and an appeal) can only RAISE a verdict (miss -> glancing/clean, glancing -> clean), never
// lower it: a right answer is never marked wrong after the fact.

export const VERDICT_MAX_TOKENS = 120
export const EXPLAIN_MAX_TOKENS = 400
export const RECHECK_MAX_TOKENS = 300
export const VERDICT_RANK = { error: -1, miss: 0, glancing: 1, clean: 2 }
const REASON_MAX = 300

// A model's yes/no flag: true/false, but also the STRINGS "true"/"False"/"yes"/"no". null = not a flag.
export const flagOf = (v) => {
  if (v === true || v === 1) return true
  if (v === false || v === 0) return false
  const s = String(v ?? '').trim().toLowerCase()
  return /^(true|yes|correct)$/.test(s) ? true : /^(false|no|incorrect|wrong)$/.test(s) ? false : null
}

const subjectLine = (subject) => `Subject: ${subject?.name || ''}${subject?.description ? ` (the learner's own context: ${subject.description})` : ''}`
const questionLines = (q, ans) => [
  `Question: ${q.prompt}`,
  q.kind === 'choice' && Array.isArray(q.choices) ? `Options: ${q.choices.join(' / ')}` : '',
  q.target ? `The question TESTS: ${q.target}` : '',
  q.accepted?.length ? `Reference answer(s): ${q.accepted.join(' / ')}` : '',
  q.kind === 'choice' && Number.isInteger(q.answerIdx) && q.choices?.[q.answerIdx] ? `Keyed option: ${q.choices[q.answerIdx]}` : '',
  `Student answer: ${ans}`,
  q.open ? 'This is an open question: any wording that does what was asked is correct.' : '',
]
const rulesFor = (subject) => (subject?.isLanguage
  ? `"target": the tested ${subject.learnLang} word, form or rule is used correctly (a single-letter typo in it is still wrong for "all", but right for "target" when the word is clearly meant). "all": the WHOLE answer is correct ${subject.learnLang} for what was asked (grammar, agreement, spelling, accents). "accentsOnly": true when "target" is true and the ONLY mistakes are missing or wrong accents that do not turn a word into a different word or form.`
  : '"target": the answer shows the tested idea correctly (a synonym, abbreviation or paraphrase is fine). "all": nothing in it is wrong (no wrong detail, no misused term). "accentsOnly": false.')

// THE FAST VERDICT: three flags, nothing else.
export function buildVerdictPrompt(subject, q, ans) {
  return {
    system: 'You grade one answer in a learning game. Reply with JSON only, nothing else: {"target": true|false, "all": true|false, "accentsOnly": true|false}.',
    user: [subjectLine(subject), ...questionLines(q, ans), rulesFor(subject)].filter(Boolean).join('\n'),
  }
}
// → { target, all, accentsOnly } (booleans) or null when the reply holds no readable "target".
export function parseVerdict(j) {
  const target = j && typeof j === 'object' ? flagOf(j.target) : null
  if (target == null) return null
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
      subjectLine(subject), ...questionLines(q, ans),
      verdict === 'miss' ? 'The answer was judged WRONG.' : verdict === 'glancing' ? 'The answer got the tested thing right but has another mistake.' : 'The answer was judged right.',
      `Write "note" in ${subject?.userLang || 'English'}: one short, neutral sentence saying what was wrong and the right form or answer. Plain words, no dashes, no shrimp emoji.`,
      wantFix ? '"fix": a short follow-up question (in the same language as the question above) that makes the student correct that OTHER mistake, with its correct "answer". null when there is none.' : '',
    ].filter(Boolean).join('\n'),
  }
}
// → { note, attack? } (attack = { prompt, accepted }) or null.
export function parseExplain(j, clean = (s) => String(s || '').trim()) {
  if (!j || typeof j !== 'object') return null
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
      subjectLine(subject), ...questionLines(q, ans),
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
export function parseRecheck(j, prev = 'miss', clean = (s) => String(s || '').trim()) {
  if (!j || typeof j !== 'object') return null
  const right = flagOf(j.right)
  if (right == null) return null
  const seen = !right ? 'miss' : flagOf(j.all) === true ? 'clean' : 'glancing'
  const verdict = (VERDICT_RANK[seen] ?? 0) > (VERDICT_RANK[prev] ?? 0) ? seen : prev
  return { verdict, overturned: verdict !== prev, why: clean(String(j.why || '')) }
}
