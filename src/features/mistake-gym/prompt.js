// The Mistake Gym workout prompt. ONE prompt for every subject: `subject.isLanguage` only changes what
// "using the knowledge" means (a language is used by producing it; CompTIA, music theory or pilot training by
// applying the concept). The model diagnoses the pattern behind the misses and tests THAT, freshly.
export const WORKOUT_ROLE = 'study'
export const WORKOUT_MAX_TOKENS = 6000
export const QUESTIONS = 8

export function buildWorkoutPrompt(subject, mistakes, { slips = '', count = QUESTIONS, level = '' } = {}) {
  const lang = subject.isLanguage
  const system = 'You are Ebi, the coach of a learning app\'s Mistake Gym. You reply with JSON only. Accuracy matters: the learner memorizes what you write, so never invent facts, words or rules.'
  const list = mistakes.map((m) => [
    `- id: ${m.id}`,
    `  card: ${m.front}${m.back ? ` = ${m.back.slice(0, 300)}` : ''}`,
    `  asked: ${m.question}`,
    `  learner answered: ${m.answer}`,
    m.expected ? `  expected: ${m.expected}` : '',
    m.feedback ? `  grader said: ${m.feedback}` : '',
    m.n > 1 ? `  missed ${m.n} times` : '',
  ].filter(Boolean).join('\n')).join('\n')
  const user = [
    `Subject: ${subject.name}${subject.description ? ` (${subject.description})` : ''}.`,
    lang
      ? `The learner studies ${subject.learnLang}; they read ${subject.userLang}. ${subject.rules || ''}`
      : `This is NOT a language course: test understanding and application of the subject itself, never vocabulary or grammar of any language. Write in ${subject.userLang}; keep technical terms, names, code and formulas as they are.`,
    '',
    'MISTAKES the learner made in recent study sessions:',
    list || '(none recorded)',
    slips ? `\nRecurring slips noticed in their writing:\n${slips}` : '',
    level ? `\nLearner level: ${level}. Pitch the new questions there (never easier than the mistake itself).` : '',
    '',
    `Write ${count} NEW practice questions. For each one:`,
    '- Target one listed mistake (put its id in "target"; spread them so the most repeated ones get more).',
    '- Diagnose WHY it was missed (a confusion between two things, a rule not yet understood, a sense not pinned) and test that underlying point with a fresh question. Never repeat the original question.',
    '- About half multiple choice: 4 options, exactly one correct, the wrong options are the confusions this learner actually showed. Every option must be real and correctly spelled (accents included): a wrong option is wrong because of meaning or usage, never because of a typo. "answer" = index of the correct option.',
    '- The rest typed short answers: exactly one correct answer, "accepted" lists every acceptable form. The question must pin down what is asked (a short cue in parentheses when needed) and must never contain its own answer.',
    lang
      ? `- Language questions make the learner USE ${subject.learnLang} (produce the word or form in a sentence, pick the right one for the context), not explain grammar terms. Phrase the question in ${subject.userLang} unless it is a sentence in ${subject.learnLang}.`
      : '- Prefer scenario questions: "which would you choose here, and what is the key reason".',
    `- "explanation": one or two sentences in ${subject.userLang} teaching the rule or distinction behind the answer.`,
    '',
    `Also give "diagnosis": one sentence in ${subject.userLang} naming the main pattern you see (for example which two things get mixed up).`,
    'No dashes anywhere. Return exactly:',
    '{"diagnosis": "...", "questions": [{"question": "...", "choices": ["..."], "answer": 0, "explanation": "...", "target": "<id>"}, {"question": "...", "accepted": ["..."], "explanation": "...", "target": "<id>"}]}',
  ].filter((x) => x !== '').join('\n')
  return { system, user }
}
