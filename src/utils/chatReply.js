// Chat tab text helpers (pure): what goes to the model as history, and what of a reply is shown.

// Bounded history: the whole chat went to the model every turn, so cost grew quadratically and a
// long chat past the context window failed on EVERY later message (dead for good). Newest turns
// up to `budget` characters, plus the opening message (it usually sets the topic).
export const CHAT_HISTORY_BUDGET = 60000
export const CHAT_FIRST_MSG_CAP = 4000
export function boundChatHistory(msgs, { budget = CHAT_HISTORY_BUDGET, firstCap = CHAT_FIRST_MSG_CAP } = {}) {
  // Error bubbles are the app's, not Ebi's: sent back as the assistant's turn, the model read its own
  // "Ebi could not answer: API 529 ..." in every later message of that chat.
  // An assistant turn's cards ride along: they were cut out of its text, so "add an example to that card"
  // reached a model that could not see the card.
  const cardsOf = (m) => (m.role !== 'user' && Array.isArray(m.cards) && m.cards.length
    ? '\n' + m.cards.map((c) => `<anki-card>${JSON.stringify({ front: c.front, back: c.back, tags: c.tags })}</anki-card>`).join('\n') : '')
  const convoLines = (Array.isArray(msgs) ? msgs : []).filter((m) => m && !m.error)
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content ?? ''}${cardsOf(m)}`)
  let kept = [], used = 0
  for (let i = convoLines.length - 1; i >= 0; i--) {
    if (kept.length && used + convoLines[i].length > budget) break
    kept.unshift(convoLines[i]); used += convoLines[i].length
  }
  // The opening message sets the topic, so it comes back, but capped: a pasted chapter as the first message
  // rode along in full on every later send and pushed the chat past the model's limit for good.
  const first = convoLines[0] && convoLines[0].length > firstCap ? convoLines[0].slice(0, firstCap) + ' …(cut)' : convoLines[0]
  if (kept.length < convoLines.length) kept = [first, '(earlier messages omitted)', ...kept]
  return kept.join('\n\n')
}

// A reply's visible text: the machine tags (<anki-card>, <progress-update>, <sources>, <offer-search>) out,
// including one the reply was CUT OFF inside (its half-written JSON must never show), em/en dashes out
// (a digit range stays a range), and never a shrimp emoji (the mascot art shows Ebi). Whitespace is not
// collapsed: code indentation and nested lists must survive.
export function cleanChatReply(text) {
  return String(text || '')
    .replace(/<anki-card>[\s\S]*?<\/anki-card>/g, '')
    .replace(/<progress-update>[\s\S]*?<\/progress-update>/g, '')
    .replace(/<sources>[\s\S]*?<\/sources>/g, '')
    .replace(/<offer-search>[\s\S]*?<\/offer-search>/g, '')
    .replace(/<(anki-card|progress-update|sources|offer-search)>[\s\S]*$/, '')
    // Line-aware (like Help): a dash opening or ending a line is dropped ("— item" read ", item"), one inside a line
    // becomes ", ", a digit range keeps a hyphen with either dash; indentation before a dropped dash stays.
    .replace(/(\d)[ \t]*[—–][ \t]*(\d)/g, '$1-$2')
    .replace(/(^|\n)([ \t]*)[—–][ \t]*/g, '$1$2')
    .replace(/[ \t]*[—–][ \t]*(?=\r?\n|$)/g, '')
    .replace(/[ \t]*[—–][ \t]*/g, ', ')
    .replace(/([ \t]?)[🦐🦞🦀]️?([ \t]?)/gu, (m, a, b) => (b ? ' ' : ''))
    .trim()
}

// A chat's default title from its first message: ONE line (a multi-line first message, Shift+Enter or pasted code,
// put its line breaks in the chat list), at most `max` characters. '' when there is no text (the caller names it).
export const CHAT_TITLE_MAX = 40
export function chatTitleText(first, max = CHAT_TITLE_MAX) {
  if (typeof first !== 'string' || first === '(image)') return ''
  return first.replace(/\s+/g, ' ').trim().slice(0, max).trim()
}
