// LEARN IT (pure, tested): the focused "explain it from zero" chat of Study's Learn-it moment, for any feature (a raid
// card or a Legends item missed mid fight, or in the debrief). Subject-agnostic. The panel is kit/LearnItPanel.jsx;
// memory hooks come from the app's one hook engine (ctx.learn.makeHook). Nothing here records a review.

export const LEARN_ROLE = 'study'
export const LEARN_MAX_TOKENS = 600
export const LEARN_HISTORY_MAX = 8
const BACK_MAX = 1500

// item: { front, back }, history: [{ role: 'user'|'assistant', content }] (the learner's newest message last)
export function buildLearnChatPrompt(subject = {}, item = {}, history = []) {
  const lang = subject.userLang || 'English'
  const system = `You are Ebi, a warm, patient study buddy. The learner just missed this in a quiz, so explain from zero: small words, concrete examples, no jargon. Reply in ${lang}, under 120 words, plain text with at most **bold** on key words. Never use dashes or a shrimp emoji.`
  const talk = (history || []).slice(-LEARN_HISTORY_MAX).map((m) => `${m.role === 'user' ? 'Learner' : 'Ebi'}: ${String(m.content || '').slice(0, 600)}`).join('\n')
  const user = [
    'What the learner is learning:',
    `Front: "${String(item.front || '').slice(0, 400)}"`,
    item.back ? `Back:\n${String(item.back).slice(0, BACK_MAX)}` : '',
    subject.isLanguage ? `They are learning ${subject.learnLang}. ${subject.rules || ''}` : `Subject: ${subject.name || ''}${subject.description ? ` (${subject.description})` : ''}. This is not a language lesson.`,
    typeof subject.knowledge === 'function' ? subject.knowledge(4000) || '' : '',
    `\nConversation so far:\n${talk}`,
    "\nAnswer the learner's last message. Be concrete and encouraging; if they ask why, give the real reason, not a restatement.",
  ].filter(Boolean).join('\n')
  return { system, user }
}

// "**bold** words" → [{ text, bold }] for a plain renderer (no HTML).
export function boldParts(text) {
  return String(text || '').split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((p) => (/^\*\*[^*]+\*\*$/.test(p) ? { text: p.slice(2, -2), bold: true } : { text: p, bold: false }))
}
