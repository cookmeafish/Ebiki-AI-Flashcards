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
// HOW EBI ANSWERS IN CHAT (owner, 2026-11-14: teaching is fluff free and straight to the point). An independent judge
// read real replies (2026-11-15): 128 to 220 words for one-line questions, "Great question" openers, a card offer or
// a menu at the end of nearly every reply. The prompt rule plus a code strip of the openers and closers it names.
export const CHAT_STYLE_RULE = [
  'HOW TO ANSWER: answer first, in the first sentence. A direct question gets 2 to 5 sentences unless they ask for more ("explain in detail", "go deeper", a list).',
  'Never open with praise or filler ("Great question", "I\'d be happy to help", "Let me break it down"). Never close with an offer or a menu ("Want a flashcard for this?", "Does that make sense?", "Want to drill some?", "Is there anything else I can help with?", "Podemos practicar..."): offer a card only when the learner asks for one.',
  'Add no unasked sections ("Why it matters", "On the exam", extra variants), never restate the meaning twice, and never re-ask what they just told you.',
  'A word question gets its meaning and one example; the full card format is ONLY for a card they asked for. Add no unasked notes (grammar remarks, exam tips, "For Security+, know that...", a summary table of what you just said): every extra line is a chance to be wrong.',
].join('\n')

// THE CHECK (a second judge, 2026-11-15: replies still ran 6 to 9 sentences with "For Security+, know that..." and a
// table restating the prose): what is wrong with a typed reply, so it gets ONE rewrite naming it. Code, card tags and
// a list the learner asked for are not counted.
const ASKED_MORE = /\b(in detail|detailed|go deeper|explain more|step by step|list|table|compare|comparison|everything|all the|examples|tell me more)\b|en detalle|paso a paso|lista|tabla|compara|todos los|ejemplos|cu[eé]ntame m[aá]s|詳しく|一覧|表|比較|详细|列表|表格|比较/i
const EXTRA_SECTION = /^\s*(?:\*\*)?(?:for (?:the )?(?:security\+|[\w+-]+ exam\b|exam\b|test\b)|on the exam\b|exam tip\b|why it matters\b|in summary\b|to summari[sz]e\b|key takeaway|bottom line\b|para el examen\b|en resumen\b)/im
// An exam aside anywhere in a reply ("CompTIA calls this a screened subnet.", "On the exam, ..."): a third judge saw one
// repeat the first sentence's term.
const EXAM_ASIDE = /\b(?:comptia|the exam|exam objectives?)\s+(?:calls?|refers? to|names?|lists?|uses? the term)\b|\bon the (?:exam|test),/i
export function chatReplyProblems(text, { userText = '' } = {}) {
  if (ASKED_MORE.test(String(userText || ''))) return []
  const prose = String(text || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<(anki-card|sources|progress-update|offer-search)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
  const out = []
  const tableRows = prose.split('\n').filter((l) => /\S\s*\|\s*\S/.test(l)).length
  if (tableRows >= 2) out.push('it adds a table the learner did not ask for')
  if (EXTRA_SECTION.test(prose) || EXAM_ASIDE.test(prose)) out.push('it adds an unasked section or aside (exam tip, "CompTIA calls this", why it matters, summary)')
  const flat = prose.replace(/^\s*(?:[-*+]|\d+[.)])\s+/gm, '').replace(/\s+/g, ' ').trim()
  const sentences = (flat.match(/[^.!?。！？]+[.!?。！？]+/g) || []).filter((s) => /[\p{L}\p{N}]/u.test(s)).length
  const words = flat.split(' ').filter((w) => /[\p{L}\p{N}]/u.test(w)).length
  if (sentences > 6 || words > 130) out.push(`it is ${sentences} sentences and ${words} words; a direct question gets 2 to 5 sentences`)
  return out
}

const FLUFF_OPENER = /^\s*(?:(?:great|good|excellent|nice|interesting|fantastic) question[.!]+|i'?d be (?:happy|glad) to help(?: with that)?[.!]+|(?:¡\s*)?(?:buena|excelente|gran) pregunta[.!]+)\s*/i
const FLUFF_CLOSER = /^(?:(?:would you like|do you want|want) (?:me to )?(?:make|create|add)\b[^?\n]*\b(?:flash)?cards?\b[^?\n]*\?|(?:want|would you like) (?:a |me to make a )?(?:flash)?cards?\b[^?\n]*\?|does (?:that|this) (?:make sense|help)\??|(?:want|would you like) to (?:drill|practice|try)\b[^?\n]*\?|(?:let me know|feel free)\b[^\n]*[.!]?|is there anything (?:else )?(?:i can|you'?d like)\b[^\n]*\?|¿\s*(?:quieres que|te gustar[ií]a que)\b[^?\n]*tarjeta[^?\n]*\?|¿\s*hay algo (?:m[aá]s )?(?:en )?(?:lo )?que pueda ayudarte\b[^\n]*)\s*$/i
// The praise opener and the closing offers named in CHAT_STYLE_RULE, cut from a finished reply (the rest kept as it
// was, markdown and code included). A closer is cut only as a whole last line or last sentence of the last line.
export function stripChatFluff(text) {
  let s = String(text || '').replace(FLUFF_OPENER, '')
  for (let i = 0; i < 2; i++) {
    const lines = s.replace(/\s+$/, '').split('\n')
    const last = lines[lines.length - 1] || ''
    // the last sentence(s) of the last line, from the first closer on
    const m = last.match(/^(.*?[.!?:)])\s+([^.!?]*\?[\s\S]*|(?:let me know|feel free)[\s\S]*)$/i)
    if (FLUFF_CLOSER.test(last.trim())) { lines.pop(); s = lines.join('\n'); continue }
    if (m && FLUFF_CLOSER.test(m[2].trim().split(/(?<=\?)\s+/)[0])) { lines[lines.length - 1] = m[1]; s = lines.join('\n'); continue }
    break
  }
  return s.trim() || String(text || '').trim()
}

export function cleanChatReply(text) {
  return stripChatFluff(String(text || '')
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
    .trim())
}

// A chat's default title from its first message: ONE line (a multi-line first message, Shift+Enter or pasted code,
// put its line breaks in the chat list), at most `max` characters. '' when there is no text (the caller names it).
export const CHAT_TITLE_MAX = 40
export function chatTitleText(first, max = CHAT_TITLE_MAX) {
  if (typeof first !== 'string' || first === '(image)') return ''
  return first.replace(/\s+/g, ' ').trim().slice(0, max).trim()
}
