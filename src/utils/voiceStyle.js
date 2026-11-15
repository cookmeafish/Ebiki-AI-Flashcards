// HOW EBI TALKS OUT LOUD (voice mode, pure). The owner (2026-11-15): a spoken reply must sound like a person chatting,
// casual and short, never a robot handing out a pile of information; and it answers in the language the learner just
// spoke, so practicing a language out loud gets answers in that language. Added LAST to Chat's system prompt for a
// SPOKEN turn only (it overrides the typed-chat rules above it); typed Chat keeps its own style.
// The prompt alone was not obeyed (an independent judge, 2026-11-15: 6 of 17 real replies sounded human, Security+
// answers ran 40 to 80 words, Spanish ones kept asking "anything else I can help with?"), so the reply is CHECKED in
// code (`spokenReplyProblems`): one rewrite naming what was wrong, then `trimSpoken`.
// Design and the angle each line came from: docs/plans/2026-11-15-voice-conversation.md.
export const VOICE_TURN_RULE = [
  'THIS IS A SPOKEN CONVERSATION (voice mode). Your reply is read aloud. These rules OVERRIDE every style and format rule above (no deck menus, no numbered options, no card dumps).',
  'Talk like a friend chatting, not like an assistant or a tutor:',
  '- 1 or 2 short sentences, under 30 words in all. At most one easy question back that keeps them talking about THEIR topic.',
  '- Never open with praise or filler ("Good question", "Great", "Right on both counts, but"). Never close with assistant lines like "Is there anything else I can help you with?", "Anything you want to practice?", "¿Hay algo en lo que pueda ayudarte?", "¿Algo más que quieras practicar?", "Does that make sense?", "Make sense?", "Does that land?". Never offer a menu of options.',
  '- No lists, no headings, no markdown, no emoji.',
  '- Keep ONE form of address all through: the learner\'s own (if they say "tú", "estás", "tienes", use tú; vos only if THEY use vos; usted only if they do). When unsure, tú.',
  '- Reply in the SAME language the learner just spoke, even if one word inside was in another language. In the language they are learning, stay in it at their level with simple everyday words. If they ask how to say something, give it in one short line, then carry on with what you were talking about. If they switch to their own language to vent, answer kindly in ONE short sentence, then invite them back in the language they are learning (never offer to switch to their language).',
  '- Mistakes: EVERY time their sentence has a grammar mistake (agreement, gender, a verb form), your reply MUST use the corrected words once, naturally inside it (a recast: if they say "a mí me gusta los perros", you answer "¿Ah, te gustan los perros? ¿Cuál es tu favorito?"), never a grammar lecture. Let small slips go. Your own grammar must be flawless.',
  '- Their words come from speech recognition and may be misheard: read a garbled term by how it SOUNDS ("sea surf" is CSRF, "sock" is SOC, "sass" is SaaS, "tea pee em" is TPM). If you really cannot tell, your WHOLE reply is just "Did you say X?".',
  '- Quizzing (when they ask): ONE question in one sentence, under 20 words, then stop. No answer choices unless they ask. When they answer right: "Yes" plus at most one short line, then the next question. When wrong: say so in the first words and give the right answer in one sentence. Judge what they meant, not the exact wording. Use their own cards from the context above.',
  '- "Tell me more", "why" or "give me an example": 2 or 3 sentences for the next layer only, then back to short.',
  '- If they miss the same thing twice, offer once, in one sentence, to make it a card. Make it only when they say yes, and then say it is ready below for them to add (never that it is already saved).',
  '- Never invent what the learner did or felt ("you caught yourself", "you\'ve got it now"): only what they actually said.',
  '- A recap when they ask: 2 or 3 short sentences (each under 25 words), under 60 words in all, never one long list, in the language they were practicing: what THEY did well, the one mistake that matters most said plainly ("you said X, say Y"), one next step. Only what the learner actually said: never fill in an answer they did not give or something you said.',
  '- Pronunciation: you only see the transcript of what they said, so say that honestly if they ask how it sounded.',
  '- A role-play or topic they ask for: play your part and stay in it until they end it.',
].join('\n')

// The reminder added to the END of the learner's spoken turn (the last thing the model reads; a rule far up the
// prompt lost to the chat's own habits).
export const VOICE_TURN_REMINDER = '(Spoken reply: 1 or 2 short casual sentences, under 30 words, in the language I just used, with the same form of address I use. If my sentence had a grammar mistake, use the corrected words once in your reply. No praise opener, no "anything else" closer, no menu.)'

// A turn asking for MORE (tell me more, why, an example, a recap): a little more room.
const DEEPER = /\b(tell me more|more detail|go deeper|explain more|why|example|recap|summary|how did i do)\b|por qu[eé]|m[aá]s detalle|cu[eé]ntame m[aá]s|ejemplo|resumen|pourquoi|exemple|warum|beispiel|perch[eé]|esempio|なぜ|どうして|例|为什么|例子|总结|まとめ/i
export const wantsMore = (userText) => DEEPER.test(String(userText || ''))

// The assistant habits a spoken reply must not have (openers, closers, menus). Matched on the start or end.
const BAD_OPENER = /^\s*(good|great|excellent|nice|interesting) question\b|^\s*(¡?buena pregunta|¡?excelente pregunta|bonne question|gute frage|ottima domanda)\b|^\s*right on both counts\b/i
const BAD_CLOSER = /(anything else (i can|you('d| would)? like)|is there anything (else )?(i can|you('d| would)? like)|something else you('d| would) like|(does that|did that) (make sense|land|help)\??|make sense\?|hay algo (más )?en (lo )?que (te )?pueda ayudar|algo m[aá]s (en lo )?que (quieras|te gustar[ií]a)|hay alg[uú]n?[a-z]* (que )?quieras practicar|quieres practicar algo m[aá]s|tiene(s)? (alguna )?(otra )?pregunta|(?:qu[eé]|de qu[eé]|en qu[eé])\s[^?]{0,30}\b(?:practic\w*|habl\w*|repas\w*|estudi\w*|aprend\w*|ayud\w*)\b[^?]{0,20}\?|practicamos algo|what (?:should|shall|do|would|could) (?:we|you)\b[^?]{0,25}\b(?:practice|work on|study|talk about)\b|(?:jump|get|go|come) back (?:in)?to (?:spanish|french|german|italian|portuguese|japanese|chinese|korean|english|practic\w*)|anything (else )?(you want|to practice))/i
const MENU = /\b(we|you) (can|could)\b[^.?!]*\bor\b[^.?!]*\b((we|you) (can|could)|just)\b|\b(podemos|puedes)\b[^.?!]*\bo\b[^.?!]*\b(podemos|puedes|solo)\b|\bwhat (do|would) you (feel like|like|want) (doing|to do)\b/i

// Text the voice will say: outside the reply's tags (cards, sources...).
const spokenPart = (text) => String(text || '').replace(/<(anki-card|sources|progress-update|offer-search|mode|action|think)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
const SENTENCE = /[^.!?。！？…]+(?:[.!?。！？…]+["')\]]*|$)/g
export const sentencesOf = (text) => (spokenPart(text).match(SENTENCE) || []).map((s) => s.trim()).filter((s) => /[\p{L}\p{N}]/u.test(s))
const wordCount = (s) => {
  const t = spokenPart(s)
  const cjk = (t.match(/[぀-ヿ一-鿿가-힯]/g) || []).length
  return t.replace(/[぀-ヿ一-鿿가-힯]/g, ' ').split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length + Math.ceil(cjk / 2)
}
export const SPOKEN_LIMITS = { words: 35, sentences: 2, moreWords: 70, moreSentences: 3 }

// Spanish voseo (vos and its verb forms): a judge heard "¿Y tú, qué tal?" then "¿Qué tal estás vos?" in one talk.
const VOSEO_STRICT = /\bvos\b|\b(?:sos|contame|decime|escuchame|tenés|querés|podés|sabés|llegás|acordás|venís|hacés|decís)\b/i
export const usesVoseo = (text) => VOSEO_STRICT.test(String(text || ''))

// What is wrong with a spoken reply (empty = fine): too long, too many sentences, an assistant opener or closer, a menu,
// and (`learnerVoseo === false`: the learner never used vos) a switch to vos.
// A reply with no Spanish at all (`spanishTalk`: a Spanish practice talk): an English vent got an English pep talk with
// no way back into Spanish (a judge).
const SPANISH_WORDS = /[ñ¿¡áéíóú]|\b(?:y|el|la|los|las|que|qué|de|en|es|vamos|sigamos|seguimos|dime|cuéntame|bueno|bien|pero|para|con|un|una)\b/i
export function spokenReplyProblems(text, { more = false, learnerVoseo, spanishTalk = false } = {}) {
  const k = SPOKEN_LIMITS
  const out = []
  const said = spokenPart(text)
  if (!said) return out
  const words = wordCount(said)
  const sents = sentencesOf(said).length
  const maxW = more ? k.moreWords : k.words
  const maxS = more ? k.moreSentences : k.sentences
  if (words > maxW) out.push(`it is ${words} words; the limit is ${maxW}`)
  if (sents > maxS) out.push(`it is ${sents} sentences; the limit is ${maxS}`)
  if (BAD_OPENER.test(said)) out.push('it opens with praise or filler')
  const last = sentencesOf(said).slice(-1)[0] || ''
  if (BAD_CLOSER.test(last)) out.push(`it ends with an assistant line ("${last.slice(0, 60)}")`)
  if (MENU.test(said)) out.push('it offers a menu of options')
  if (learnerVoseo === false && usesVoseo(said)) out.push('it uses vos (vos, querés, tenés...) but the learner uses tú: use tú')
  // A run-on dodging the sentence limit (a judge: a recap squeezed into one 48-word comma-spliced sentence).
  const longest = Math.max(0, ...sentencesOf(said).map((s) => wordCount(s)))
  if (longest > (more ? 28 : 26)) out.push(`one sentence is ${longest} words: split it, keep each sentence short`)
  // A correction said as a correction ("no 'me dice'") instead of a recast inside the talk.
  if (/(?:^|[\s,.;])(?:no|not|instead of|en lugar de|en vez de)\s+["“'«][^"”'»]{1,40}["”'»]/i.test(said) && !more) out.push('it corrects them out loud ("no X"): just use the right words naturally in your reply')
  if (spanishTalk && !SPANISH_WORDS.test(said)) out.push('it is all in their own language: answer kindly, then end with ONE short line in Spanish inviting them back')
  return out
}

// The last resort when a rewrite still broke the limits: the first sentences that fit, tags (cards) kept as they were.
export function trimSpoken(text, { more = false } = {}) {
  const raw = String(text || '')
  const tags = (raw.match(/<(anki-card|sources|progress-update|offer-search|mode|action|think)\b[^>]*>[\s\S]*?<\/\1>/gi) || []).join('\n')
  let sents = sentencesOf(raw).filter((s) => !BAD_CLOSER.test(s))
  if (sents.length && BAD_OPENER.test(sents[0]) && sents.length > 1) sents = sents.slice(1)
  const maxS = more ? SPOKEN_LIMITS.moreSentences : SPOKEN_LIMITS.sentences
  const kept = []
  for (const s of sents) {
    if (kept.length >= maxS) break
    if (kept.length && wordCount([...kept, s].join(' ')) > (more ? SPOKEN_LIMITS.moreWords : SPOKEN_LIMITS.words)) break
    kept.push(s)
  }
  const prose = kept.join(' ') || sents[0] || spokenPart(raw)
  return tags ? `${prose}\n${tags}` : prose
}

// The language the recognizer should expect: in a language mode the one being learned (short phrases spoken with a
// learner's accent were auto-detected as English and came out translated), else the app's own; `choice` is the
// panel's "I'm speaking" pick ('' = that default, 'auto' = let the recognizer guess).
export function hearingLang({ isLanguage = false, learnIso = '', appIso = '', choice = '' } = {}) {
  if (choice === 'auto') return ''
  if (choice) return choice
  return (isLanguage && learnIso) || appIso || ''
}
