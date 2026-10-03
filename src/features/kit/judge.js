// AI check for a typed answer the local matcher couldn't settle (a synonym, a paraphrase, an open answer).
// Subject-agnostic: language questions judge the exact word or form; everything else judges meaning.
import { matchTyped } from './grade'
import { flagOf, buildVerdictPrompt, parseVerdict, verdictOf, buildExplainPrompt, parseExplain, buildRecheckPrompt, parseRecheck, VERDICT_MAX_TOKENS, EXPLAIN_MAX_TOKENS, RECHECK_MAX_TOKENS } from './fightJudge'

export const JUDGE_ROLE = 'study'
export { flagOf }
const strikeNote = (subject) => `Write "note" in ${subject?.userLang || 'English'}: one short sentence, no dashes.`
const JUDGE_MAX_TOKENS = 300

// ── Strikes (Legends fights and raids): the TESTED thing and the REST of the answer are graded apart ────────────
// { verdict: 'clean'|'glancing'|'miss'|'error', note, accent?, attack?, ai?, later? } where attack = { prompt,
// accepted, exact? } is the follow-up the boss throws back (the word again with its accents, decided locally).
// FAST (kit/fightJudge.js): the blocking AI call returns only the verdict flags, so damage and hearts land at once.
// `later` (AI verdicts that are not clean) = a promise of { note, attack? }: the explanation and a glancing answer's
// "fix" follow-up, written in the background (never rejects; {} when it failed). `ai: true` = the verdict came from
// the model (only those are re-checked: recheckStrike). `strictAccents` (the mode's accents setting): an accent slip
// is glancing; relaxed, it is clean with a note, unless the accent makes ANOTHER word or form (té/te, hablé/hable),
// which is always wrong. A question marked `exact` (an accent attack) takes only the exact spelling.

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
  try {
    const { system, user } = buildVerdictPrompt(subject, q, ans)
    const flags = parseVerdict(ai.json(await ai.call(system, user, { role: JUDGE_ROLE, maxTokens: VERDICT_MAX_TOKENS, silent: true })))
    // A grading that did not happen is NOT a miss (it cost a life and recorded Again in Anki): 'error' = ask again.
    if (!flags) return { verdict: 'error', note: '' }
    const verdict = verdictOf(flags, { strictAccents })
    const accent = flags.target && !flags.all && flags.accentsOnly
    if (verdict === 'clean') return { verdict, note: '', ai: true, ...(accent ? { accent: true } : {}) }
    const later = explainStrike(ai, subject, q, ans, { verdict, accentsOnly: accent })
    return { verdict, note: '', ai: true, later, ...(accent ? { accent: true } : {}), ...(verdict === 'glancing' && !accent ? { fixLater: true } : {}) }
  } catch { return { verdict: 'error', note: '' } }
}

// The background half of a strike: { note, attack? }, {} when it failed (never throws).
export async function explainStrike(ai, subject, q, answer, { verdict = 'miss', accentsOnly = false } = {}) {
  if (!ai?.hasKey) return {}
  try {
    const { system, user } = buildExplainPrompt(subject, q, String(answer || '').trim(), { verdict, accentsOnly })
    return parseExplain(ai.json(await ai.call(system, user, { role: JUDGE_ROLE, maxTokens: EXPLAIN_MAX_TOKENS, silent: true })), ai.clean) || {}
  } catch { return {} }
}

// The careful second look at a miss or glancing verdict (automatic, or the learner's appeal with `reason`):
// { verdict, overturned, why } (verdict only ever raised), or null when the check could not run.
export async function recheckStrike(ai, subject, q, answer, { verdict = 'miss', reason = '' } = {}) {
  if (!ai?.hasKey) return null
  try {
    const { system, user } = buildRecheckPrompt(subject, q, String(answer || '').trim(), { verdict, reason })
    return parseRecheck(ai.json(await ai.call(system, user, { role: JUDGE_ROLE, maxTokens: RECHECK_MAX_TOKENS, silent: true })), verdict, ai.clean)
  } catch { return null }
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
