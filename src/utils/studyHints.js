// Count letters, not spaces, punctuation, or combining accent marks.
export const countAnswerLetters = (answer) =>
  (String(answer).normalize('NFC').match(/\p{L}/gu) || []).length

export function answerLetterCounts(acceptedAnswers = []) {
  const counts = acceptedAnswers.flatMap((answer) => String(answer).split('/'))
    .map(countAnswerLetters).filter(Boolean)
  return [...new Set(counts)].sort((a, b) => a - b)
}

// Keep the generated hint's language, but calculate its number from real answers.
// Run when revealing the hint so previously generated questions are corrected too.
export function correctLetterHint(hint, acceptedAnswers) {
  if (typeof hint !== 'string') return hint
  const counts = answerLetterCounts(acceptedAnswers)
  if (!counts.length) return hint
  return hint.replace(/^\s*\d+(?:\s*[/,]\s*\d+)*/, counts.join('/'))
}
