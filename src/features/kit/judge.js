// AI check for a typed answer the local matcher couldn't settle (a synonym, a paraphrase, an open answer).
// Subject-agnostic: language questions judge the exact word or form; everything else judges meaning.
export const JUDGE_ROLE = 'study'
const JUDGE_MAX_TOKENS = 300

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
    if (!j || typeof j.correct !== 'boolean') return null
    return { correct: j.correct, note: ai.clean(j.note || '') }
  } catch { return null }
}
