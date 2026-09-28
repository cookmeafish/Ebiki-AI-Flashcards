// The Leech Doctor prompt: why does the learner keep failing these cards, and what would fix it?
// One prompt for every subject. Cards get MEMORIZED, so the deck-quality model tier is used.
export const DOCTOR_ROLE = 'deck'
export const DOCTOR_MAX_TOKENS = 8000

export function buildDoctorPrompt(subject, patients, { others = [] } = {}) {
  const lang = subject.isLanguage
  const system = 'You are Ebi, the Leech Doctor of a flashcard app: you find out why a learner keeps failing a card and fix the card itself. Reply with JSON only. Accuracy is critical: the learner memorizes the card, so never invent facts, words or rules.'
  const list = patients.map((p) => [
    `- noteId: ${p.noteId}`,
    `  failed ${p.lapses} times in ${p.reps} reviews`,
    `  FRONT: ${p.front}`,
    `  BACK: ${p.back.slice(0, 800)}`,
  ].join('\n')).join('\n')
  const user = [
    `Subject: ${subject.name}${subject.description ? ` (${subject.description})` : ''}.`,
    lang ? `The learner studies ${subject.learnLang} and reads ${subject.userLang}. ${subject.rules || ''}` : `Not a language course: judge the subject matter itself. Write in ${subject.userLang}; keep terms, names, code and formulas as they are.`,
    others.length ? `Other cards in the same deck (fronts), to spot confusions:\n${others.slice(0, 120).join(' | ')}` : '',
    '',
    'CARDS the learner keeps failing:',
    list,
    '',
    'For EACH card decide the main cause:',
    '- "confusable": it gets mixed up with something similar (name it in "confusedWith", from the deck list if it is there).',
    '- "unpinned": the front does not say precisely which answer or sense is wanted, so several answers fit.',
    '- "thin": the back is too bare to learn from (no example, no reason, no context).',
    '- "hook": the card is fine but hard to remember: it needs a memorable angle.',
    '- "wrong": something on the card is inaccurate or misleading.',
    '',
    'Write for each:',
    `- "explanation": one or two sentences in ${subject.userLang} telling the learner why this card keeps slipping.`,
    `- "mentor": a short lesson (3 to 6 sentences, in ${subject.userLang}) that clears up the confusion for good: contrast it with what it gets confused with, give one clear example each, and one way to tell them apart.`,
    '- "fix": the improved card as plain text, {"front": "...", "back": "..."}. Keep what is good, change only what the cause needs: pin the sense on the front with a short cue, add an example or a "Not to confuse with:" line on the back, correct any error. Keep the card\'s language, format and "Label: value" lines. Use "" for a side that should not change. Omit "fix" entirely if the card needs no change.',
    '',
    'No dashes anywhere. Return exactly:',
    '{"diagnoses": [{"noteId": 123, "cause": "confusable", "confusedWith": "...", "explanation": "...", "mentor": "...", "fix": {"front": "...", "back": "..."}}]}',
  ].filter((x) => x !== '').join('\n')
  return { system, user }
}
