// AI check for a typed answer the local matcher couldn't settle (a synonym, a paraphrase, an open answer).
// Subject-agnostic: language questions judge the exact word or form; everything else judges meaning.
import { matchTyped } from './grade'

export const JUDGE_ROLE = 'study'
// A model's yes/no flag: true/false, but also the STRINGS "true"/"False"/"yes"/"no" models write. null = not a flag
// (unreadable). Read strictly as booleans, a stringified flag made every check fail and the answer could never be graded.
export const flagOf = (v) => {
  if (v === true || v === 1) return true
  if (v === false || v === 0) return false
  const s = String(v ?? '').trim().toLowerCase()
  return /^(true|yes|correct)$/.test(s) ? true : /^(false|no|incorrect|wrong)$/.test(s) ? false : null
}
const JUDGE_MAX_TOKENS = 300

// ── Strikes (Legends fights and raids): the TESTED thing and the REST of the answer are graded apart ────────────
// { verdict: 'clean'|'glancing'|'miss', note, accent?, attack? } where attack = { prompt, accepted, exact? } is the
// follow-up the boss throws back: the slip of a glancing answer ("el niño tomar agua" → fix "tomar"), or the word
// again with its accents. `strictAccents` (the mode's accents setting): an accent slip is glancing; relaxed, it is
// clean with a note, unless the accent makes ANOTHER word or form (té/te, hablé/hable), which is always wrong.
// A question marked `exact` (an accent attack) takes only the exact spelling.

const STRIKE_MAX_TOKENS = 500
const strikeNote = (subject) => `Write "note" in ${subject?.userLang || 'English'}: one short sentence, no dashes.`

export async function judgeStrike(ai, subject, q, answer, { strictAccents = true } = {}) {
  const ans = String(answer || '').trim()
  if (!ans) return { verdict: 'miss', note: '' }
  const local = q.open ? null : matchTyped(ans, q.accepted)
  if (local === 'exact') return { verdict: 'clean', note: '' }
  if (local === 'accent') {
    if (q.exact) return { verdict: 'miss', note: '', accent: true }
    const accentAttack = { prompt: q.prompt, accepted: q.accepted, exact: true, accentOf: ans }
    if (strictAccents) return { verdict: 'glancing', note: '', accent: true, attack: accentAttack }
    // Relaxed accents: fine unless the accent changes the word (asked once; without AI the answer stands).
    const changes = await accentChangesWord(ai, subject, q, ans)
    return changes ? { verdict: 'miss', note: changes, accent: true } : { verdict: 'clean', note: '', accent: true }
  }
  if (q.exact) return { verdict: 'miss', note: '' }
  if (!ai?.hasKey) return { verdict: 'miss', note: '' }
  const lang = subject?.isLanguage
  const system = 'You grade one answer in a learning game. Reply with JSON only: {"target": true|false, "all": true|false, "accentsOnly": true|false, "note": "...", "fix": {"question": "...", "answer": "..."} | null}.'
  const user = [
    `Subject: ${subject?.name || ''}${subject?.description ? ` (the learner's own context: ${subject.description})` : ''}`,
    `Question: ${q.prompt}`,
    q.target ? `The question TESTS: ${q.target}` : '',
    q.accepted?.length ? `Reference answer(s): ${q.accepted.join(' / ')}` : '',
    `Student answer: ${ans}`,
    lang
      ? `"target": the tested ${subject.learnLang} word, form or rule is used correctly (a single-letter typo in it is still wrong for "all", but right for "target" when the word is clearly meant). "all": the WHOLE answer is correct ${subject.learnLang} for what was asked (grammar, agreement, spelling, accents). "accentsOnly": true when "target" is true and the ONLY mistakes are missing or wrong accents that do not turn a word into a different word or form.`
      : '"target": the answer shows the tested idea correctly. "all": nothing in it is wrong (no wrong detail, no misused term). "accentsOnly": false.',
    q.open ? 'This is an open question: any wording that does what was asked is correct.' : '',
    '"fix": ONLY when "target" is true and "all" is false and the other mistake is not only accents: a short follow-up question (in the same language as the question above) that makes the student correct that OTHER mistake, with its correct "answer". Otherwise null.',
    `${strikeNote(subject)} If not all correct, say what was wrong and the right form.`,
  ].filter(Boolean).join('\n')
  try {
    const raw = await ai.call(system, user, { role: JUDGE_ROLE, maxTokens: STRIKE_MAX_TOKENS, silent: true })
    const j = ai.json(raw)
    // A grading that did not happen is NOT a miss (it cost a life and recorded Again in Anki): 'error' = ask again.
    const target = j ? flagOf(j.target) : null
    if (target == null) return { verdict: 'error', note: '' }
    const note = ai.clean(j.note || '')
    if (!target) return { verdict: 'miss', note }
    if (flagOf(j.all) === true) return { verdict: 'clean', note: '' }
    if (flagOf(j.accentsOnly) === true) return strictAccents ? { verdict: 'glancing', note, accent: true } : { verdict: 'clean', note, accent: true }
    const fq = j.fix && typeof j.fix === 'object' ? String(j.fix.question || '').trim() : ''
    const fa = j.fix && typeof j.fix === 'object' ? String(j.fix.answer || '').trim() : ''
    return { verdict: 'glancing', note, ...(fq && fa ? { attack: { prompt: ai.clean(fq), accepted: [fa] } } : {}) }
  } catch { return { verdict: 'error', note: '' } }
}

// Does the accent slip make a different word or form? A short reason (in the user's language) when it does, else ''.
async function accentChangesWord(ai, subject, q, ans) {
  if (!ai?.hasKey || !subject?.isLanguage) return ''
  const system = 'You check one spelling for a language learner. Reply with JSON only: {"different": true|false, "note": "..."}.'
  const user = [
    `Language: ${subject.learnLang}. Question: ${q.prompt}`,
    `Expected: ${(q.accepted || []).join(' / ')}. The learner wrote: ${ans} (the same letters, other accents).`,
    `"different": true when, without the right accents, it is ANOTHER real word or form of ${subject.learnLang} (like "te" for "té", "hable" for "hablé"); false when it is only a misspelling of the same word.`,
    strikeNote(subject),
  ].join('\n')
  try {
    const j = ai.json(await ai.call(system, user, { role: JUDGE_ROLE, maxTokens: JUDGE_MAX_TOKENS, silent: true }))
    return flagOf(j?.different) === true ? (ai.clean(j.note || '') || ' ') : ''
  } catch { return '' }
}

export async function judgeAnswer(ai, subject, q, answer) {
  if (!ai?.hasKey) return null
  const lang = subject?.isLanguage
  const system = 'You grade one answer for a learning app. Reply with JSON only: {"correct": true|false, "note": "<one short sentence>"}.'
  const user = [
    `Subject: ${subject?.name || ''}${subject?.description ? ` (${subject.description})` : ''}`,
    `Question: ${q.prompt}`,
    q.accepted?.length ? `Reference answer(s): ${q.accepted.join(' / ')}` : '',
    `Student answer: ${answer}`,
    q.open
      ? 'This is an open question: mark it correct when the answer shows the understanding the question asks for, in any wording or language. Ignore spelling unless it changes the meaning.'
      : lang
        ? `This checks ${subject.learnLang}: correct only when it is an acceptable ${subject.learnLang} answer for exactly what was asked (the right word and form). Forgive a single-letter typo; accents alone are not wrong.`
        : 'Mark it correct when it means the same as a reference answer (a synonym, abbreviation or paraphrase is fine).',
    `Write "note" in ${subject?.userLang || 'English'}: if wrong, say briefly what the right answer is and why; if right, a few words of encouragement. No dashes.`,
  ].filter(Boolean).join('\n')
  try {
    const raw = await ai.call(system, user, { role: JUDGE_ROLE, maxTokens: JUDGE_MAX_TOKENS, silent: true })
    const j = ai.json(raw)
    const correct = j ? flagOf(j.correct) : null
    if (correct == null) return null
    return { correct, note: ai.clean(j.note || '') }
  } catch { return null }
}
