// Listen & Speak drills, for ANY subject. A language is heard and spoken (dictation, comprehension, repeat,
// say it in the language); any other subject is heard as a situation or definition to recognize, and
// explained out loud like a short oral exam. Items come from the learner's own cards.
export const DRILL_ROLE = 'study'
export const DRILL_JOB = 'practice.listenSpeak'
export const DRILL_MAX_TOKENS = 5000
export const DRILL_SIZE = 8
const BACK_CHARS = 240

const itemList = (items) => items.map((it, i) => `${i + 1}. ${it.front} = ${String(it.back || '').replace(/\s+/g, ' ').slice(0, BACK_CHARS)}`).join('\n')

export function buildDrillPrompt(subject, items, { knowledge = '', slips = '', level = '' } = {}) {
  const lang = subject.isLanguage
  const Q = '{"type": "choice"|"typed", "question": "...", "say": "<text the learner HEARS, never shown before answering>", "speak": true|false, "choices": ["..."], "answer": <index or text>, "accepted": ["..."], "open": true|false, "explanation": "...", "target": "<the item it practices>"}'
  const kinds = lang
    ? [
      `DICTATION: "say" = a short natural ${subject.learnLang} sentence using the item; question "Type what you hear" (in ${subject.userLang}); type typed; accepted = [the exact sentence].`,
      `LISTENING: "say" = a ${subject.learnLang} sentence or mini exchange using the item; question in ${subject.userLang} about what was said; type choice with 4 ${subject.userLang} options.`,
      `REPEAT: "say" = a short ${subject.learnLang} phrase with the item; question "Say what you hear" (in ${subject.userLang}); speak true; type typed; accepted = [the phrase].`,
      `SAY IT: no "say"; question in ${subject.userLang} asking them to say a short sentence in ${subject.learnLang} (give the meaning to express); speak true; type typed; accepted = natural ${subject.learnLang} versions.`,
    ]
    : [
      `RECOGNIZE: "say" = a short spoken situation, symptom or definition (two sentences, in ${subject.userLang}) that points to one item; question "Which is it?"; type choice with 4 options (real, plausible terms from the subject).`,
      `LISTEN AND ANSWER: "say" = a short spoken question or scenario (in ${subject.userLang}); question "Answer what you heard"; type typed; accepted = the key answer(s).`,
      `EXPLAIN OUT LOUD: no "say"; question asks them to explain or apply an item out loud in their own words; speak true; open true; type typed; accepted = the key points a good answer must contain.`,
    ]
  return {
    system: `You write a short listening and speaking workout for a learning app. Reply with JSON only: {"questions": [${Q}, ...]}. No dashes. Never write a shrimp emoji.`,
    user: [
      `Subject: ${subject.name}${subject.description ? ` (${subject.description})` : ''}.`,
      lang ? subject.rules || '' : `This is ${subject.name}, never a language lesson: keep terms, names, code and formulas as they are.`,
      level ? `Learner level: ${level}. Sentences, speed of ideas and vocabulary around the items fit this level.` : '',
      `Write ${DRILL_SIZE} questions, one per item where possible, mixing these kinds (at least two of each):`,
      ...kinds.map((k) => `- ${k}`),
      'Items (from the learner\'s cards):',
      itemList(items) || '(no cards to draw from: use core ideas of the subject)',
      knowledge ? `The learner's material:\n${knowledge}` : '',
      slips ? `Slips the learner tends to make (work some in):\n${slips}` : '',
      `Rules: the "say" text must NEVER appear in "question" or "choices" of a listening question; spoken sentences stay short (under 15 words) and natural; every option real and correctly spelled; "explanation" (in ${subject.userLang}) says briefly why the answer is right.`,
    ].filter(Boolean).join('\n'),
  }
}
