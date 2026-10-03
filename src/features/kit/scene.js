// SCENES: a short story (language) or case study (anything else) built from the learner's own items, told
// line by line with two voices, followed by comprehension questions. Shared kit so any feature (Scenes in
// Practice, Legends later) can make one. Pure: prompt + parse only.
import { sanitizeQuestions } from './grade'

export const SCENE_ROLE = 'study'
export const SCENE_MAX_TOKENS = 5000
export const SCENE_LINES = { min: 6, max: 16 }
export const SCENE_QUESTIONS = 4
export const SPEAKERS = ['A', 'B', 'N'] // two characters and a narrator
const LINE_CHARS = 280
const BACK_CHARS = 200

export function buildScenePrompt(subject, items, { level = '', knowledge = '', theme = '', avoid = [], slips = '' } = {}) {
  const lang = subject.isLanguage
  const list = items.map((it, i) => `${i + 1}. ${it.front} = ${String(it.back || '').replace(/\s+/g, ' ').slice(0, BACK_CHARS)}`).join('\n')
  return {
    system: 'You write short scenes for a learning app. Reply with JSON only: {"title": "...", "cast": {"A": "<name>", "B": "<name>"}, "lines": [{"speaker": "A"|"B"|"N", "text": "...", "gloss": "..."}], "questions": [{"type": "choice"|"typed", "question": "...", "choices": ["..."], "answer": <index or text>, "accepted": ["..."], "explanation": "..."}]}. No dashes. Never write a shrimp emoji.',
    user: [
      `Subject: ${subject.name}${subject.description ? ` (${subject.description})` : ''}.`,
      lang
        ? `Write a lively everyday story in ${subject.learnLang} (dialogue between A and B, N narrates briefly). Keep it just above the learner's level: short sentences, mostly words they know. "gloss" = a natural ${subject.userLang} translation of the line. ${subject.rules || ''}`
        : `Write a realistic case study in ${subject.userLang} where ${subject.name} matters (dialogue between A and B, N narrates), for example a problem that gets diagnosed or a decision that gets made. The learner must APPLY ideas to follow it. Never a language lesson; leave "gloss" empty.`,
      `${SCENE_LINES.min} to ${SCENE_LINES.max} lines, each under 25 words. Work in as many of these items as fit naturally (never list them):`,
      list || '(no items: pick core ideas of the subject)',
      theme ? `Theme: ${theme}` : '',
      !theme && avoid.length ? `Scenes and topics practiced recently (pick a different situation): ${avoid.join('; ')}` : '',
      level ? `Learner level: ${level}` : '',
      slips ? `Mistakes this learner keeps making (let the story model the right form once or twice, naturally):\n${slips}` : '',
      knowledge ? `The learner's material:\n${knowledge}` : '',
      `Then ${SCENE_QUESTIONS} questions in ${subject.userLang} that check real understanding of what happened and why (not trivia about names), mixing choice (4 real options) and typed. "explanation" in ${subject.userLang}.`,
    ].filter(Boolean).join('\n'),
  }
}

// Model text only: a list or object where a string belongs showed "[object Object]" (or threw inside `clean`).
const txt = (v) => (typeof v === 'string' || typeof v === 'number' ? String(v) : '')

// { title, cast: { A, B }, lines: [{ speaker, text, gloss }], questions } or null when unusable.
export function parseScene(raw, clean = (s) => s) {
  if (!raw || typeof raw !== 'object') return null
  const lines = (Array.isArray(raw.lines) ? raw.lines : [])
    .map((l) => ({
      speaker: SPEAKERS.includes(String(l?.speaker || '').toUpperCase()) ? String(l.speaker).toUpperCase() : 'N',
      text: clean(txt(l?.text).replace(/\s+/g, ' ').trim().slice(0, LINE_CHARS)),
      gloss: clean(txt(l?.gloss).replace(/\s+/g, ' ').trim().slice(0, LINE_CHARS)),
    }))
    .filter((l) => l.text)
    .slice(0, SCENE_LINES.max)
  if (lines.length < Math.min(3, SCENE_LINES.min)) return null
  const cast = { A: clean(txt(raw.cast?.A).trim().slice(0, 30)) || 'A', B: clean(txt(raw.cast?.B).trim().slice(0, 30)) || 'B' }
  const questions = sanitizeQuestions((Array.isArray(raw.questions) ? raw.questions : []).filter((q) => q && typeof q === 'object')
    .map((q) => ({ ...q, question: clean(txt(q.question)), explanation: clean(txt(q.explanation)) })))
  return { title: clean(txt(raw.title).trim().slice(0, 80)), cast, lines, questions }
}

// Which voice reads a speaker (the speech layer's voice index): A and B differ, the narrator uses A's.
export const voiceFor = (speaker) => (speaker === 'B' ? 1 : 0)
