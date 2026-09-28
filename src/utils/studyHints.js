// Count letters, not spaces, punctuation, or combining accent marks.
export const countAnswerLetters = (answer) =>
  (String(answer).normalize('NFC').match(/\p{L}/gu) || []).length

export function answerLetterCounts(acceptedAnswers = []) {
  // The expanded forms when there are any: the raw "nosotros/as" kept beside its expansions counted "as" (2)
  // and "bueno/a" counted "a" (1), so the hint said "2/8 letters" and a wrong 2-letter answer "satisfied" it.
  const list = acceptedAnswers.map((a) => String(a))
  const plain = list.filter((a) => !a.includes('/'))
  // Whole answers keep 1-character words (雨, y, a); only SPLIT pieces drop 1-letter endings.
  // Split alternatives (actor/actriz) drop 1-letter endings, unless every piece is that short ("y/o").
  const split = list.flatMap((a) => a.split('/')).map(countAnswerLetters).filter(Boolean)
  const counts = plain.length ? plain.map(countAnswerLetters).filter(Boolean)
    : (split.some((n) => n >= 2) ? split.filter((n) => n >= 2) : split)
  return [...new Set(counts)].sort((a, b) => a - b)
}

// Keep the generated hint's language, but calculate its number from real answers.
// Run when revealing the hint so previously generated questions are corrected too.
export function correctLetterHint(hint, acceptedAnswers) {
  if (typeof hint !== 'string') return hint
  const counts = answerLetterCounts(acceptedAnswers)
  if (!counts.length) return hint
  // The number group wherever it stands ("Tiene 5 letras", "有5个字母"), but only when there is exactly
  // one: a hint holding two separate numbers is not a plain count and is left alone.
  const groups = hint.match(/\d+(?:\s*[/,]\s*\d+)*/g) || []
  if (groups.length !== 1) return hint
  return hint.replace(/\d+(?:\s*[/,]\s*\d+)*/, counts.join('/'))
}
