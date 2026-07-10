// Discover Mode prompt builders. Pure functions — all data is assembled in App.jsx and
// passed in. Each returns a string for providerConfig.call(). Models are told to return
// strict JSON (parsed with the same ```-stripping used elsewhere in the app).

// ─── Learner profile ────────────────────────────────────────────────────────
// Synthesizes the user's level from their cards, mastery stats, progress notes, chat
// history and knowledge base. The AI picks the right scale for the subject:
//   language  -> CEFR (A1..C2)
//   cert/exam -> domain-coverage (track exam objective areas + how covered each is)
//   other     -> generic tiers (beginner / intermediate / advanced)
export function buildProfilePrompt({ modeType, modeName, modeDescription, evidence }) {
  return `You are assessing how advanced a learner is, so a tutor can suggest NEW material at the right difficulty.

Subject mode: "${modeName}"${modeDescription ? ` — ${modeDescription}` : ''}
Mode type: ${modeType}

Choose the level scale that fits the subject:
- If this is a LANGUAGE: use "CEFR" with an estimate of A1, A2, B1, B2, C1 or C2.
- If this is a CERTIFICATION or EXAM (e.g. CompTIA Security+/Network+): use "domain-coverage" and list the real exam objective domains with a 0..1 coverage estimate for each.
- Otherwise: use "tiers" with an estimate of "beginner", "intermediate" or "advanced".

Evidence about the learner:
${evidence}

Return ONLY a JSON object (no markdown, no commentary):
{
  "updatedAt": "${new Date().toISOString().split('T')[0]}",
  "level": { "scale": "CEFR" | "domain-coverage" | "tiers", "estimate": "<value>", "confidence": 0.0-1.0 },
  "domains": [ { "name": "<topic/area>", "coverage": 0.0-1.0, "status": "weak" | "developing" | "strong" } ],
  "summary": "<2-3 sentences: what they know well and where the gaps are>",
  "evidenceCounts": { "cards": <int>, "sessions": <int>, "feedbackChats": <int> }
}

Base the estimate on real evidence. Be honest — if there is little evidence, lower the confidence. The "domains" should reflect what the learner is weak in or has not covered, so suggestions can target gaps.`
}

// ─── Next suggestion ────────────────────────────────────────────────────────
// Proposes ONE new item to learn, calibrated to the profile and never repeating
// anything the learner already has / knows / declined.
export function buildSuggestionPrompt({ profile, modeType, modeName, modeDescription, studyLanguage, excludeList, itemType, focus, knowledge, difficulty, customKind, userLanguage = 'English' }) {
  const level = profile?.level || { scale: 'tiers', estimate: 'beginner' }
  const weak = (profile?.domains || []).filter((d) => d.status !== 'strong').map((d) => d.name)
  const isLang = modeType === 'language'

  // What kind of item to suggest. [itemKind for the intro sentence, the concrete rule].
  // 'both' = anything goes; unknown values fall back to it.
  const LANG_TYPES = {
    word: ['single word', '- Suggest a SINGLE WORD (one token), not a multi-word phrase.'],
    phrase: ['phrase or expression', '- Suggest a multi-word PHRASE or everyday expression — not a single word.'],
    idiom: ['idiom or saying', '- Suggest an IDIOM, proverb or colloquial expression native speakers actually use. The explanation gives its literal reading AND its real meaning.'],
    verb: ['verb', '- Suggest a VERB in its infinitive/dictionary form — pick verbs with real everyday utility (irregular or pattern-defining verbs are welcome).'],
    grammar: ['grammar pattern', '- Suggest a GRAMMAR PATTERN or construction (a tense use, connector, or structure). "term" is the pattern as a short skeleton (e.g. "si + imperfecto de subjuntivo"), and the explanation shows how to build it with ONE example sentence.'],
    both: ['word or phrase', '- It may be a word, phrase, idiom, verb, or grammar pattern — whichever is most useful right now.'],
  }
  const GEN_TYPES = {
    term: ['key term or concept', '- Suggest a KEY TERM or concept from the subject.'],
    acronym: ['acronym', '- Suggest an ACRONYM or abbreviation from the subject. "term" is the acronym itself, "translation" is its expansion, and the explanation says what it is and why it matters.'],
    comparison: ['commonly-confused pair', '- Suggest a COMMONLY-CONFUSED PAIR as "X vs Y" (e.g. "symmetric vs asymmetric encryption"). The explanation contrasts them in one or two crisp sentences.'],
    scenario: ['applied concept', '- Suggest a concept via an APPLIED SCENARIO: the explanation opens with a short realistic situation, then names the concept that answers it (exam-style application, not bare recall).'],
    both: ['concept or term', '- It may be a term, acronym, commonly-confused pair, or applied-scenario concept — whichever is most useful right now.'],
  }
  const table = isLang ? LANG_TYPES : GEN_TYPES
  let [itemKind, itemTypeRule] = table[itemType] || table.both
  // Subject-specific category (AI-generated per mode) overrides the static table.
  if (customKind?.rule) {
    itemKind = customKind.label || itemKind
    itemTypeRule = `- ${customKind.rule}`
  }

  // How hard to aim, relative to the assessed level.
  const difficultyRule = difficulty === 'easier'
    ? 'Aim slightly BELOW their assessed level — consolidation material they can win with quickly.'
    : difficulty === 'level'
      ? 'Aim squarely AT their assessed level — comfortable but not trivial.'
      : 'Aim appropriate for their level — slightly stretch them, never trivial.'

  return `You are a tutor suggesting ONE new ${itemKind} for the learner to make a flashcard from. They are studying "${modeName}"${modeDescription ? ` (${modeDescription})` : ''}.

Learner level: ${level.scale} = ${level.estimate} (confidence ${profile?.level?.confidence ?? 'unknown'}).
${profile?.summary ? `Profile summary: ${profile.summary}` : ''}
${weak.length ? `Weak / under-covered areas to prioritize: ${weak.join(', ')}.` : ''}
${focus ? `\nThe learner specifically asked you to focus on: "${focus}". Honor this above all else — every suggestion must fit this request.` : ''}
${knowledge ? `\nREFERENCE MATERIAL (the learner's own study material for this mode — prefer terms/concepts that appear in or align with it):\n${knowledge}\n` : ''}

RULES:
- Suggest exactly ONE item. ${difficultyRule}
${itemTypeRule ? itemTypeRule + '\n' : ''}- ${isLang ? `${difficulty === 'easier' ? 'Even easier items must still be worth carding — no absolute-beginner filler unless they truly are a beginner.' : 'Do NOT suggest beginner vocabulary if they are intermediate or above (no "manzana" for a B1+ learner). For an advanced learner prefer nuanced/idiomatic/formal items.'}` : `Prefer a term from an under-covered exam domain or a gap in their knowledge.`}
- ${focus ? 'Match the focus request above.' : 'Prefer the weak/under-covered areas listed above when sensible.'}
- Do NOT suggest anything in this exclude list (already known, declined, or already a card):
${excludeList.length ? excludeList.map((t) => `  - ${t}`).join('\n') : '  (none yet)'}
${isLang && studyLanguage ? `- The item must be in ${studyLanguage}. Provide its ${userLanguage} translation.` : ''}

Return ONLY a JSON object (no markdown, no commentary):
{
  "term": "<the ${isLang ? 'word/phrase in the target language' : 'concept/term'}>",
  "partOfSpeech": "<part of speech if a word, else empty string>",
  "translation": "<${userLanguage} translation/gloss, or short definition for non-language subjects>",
  "difficulty": "<level label, e.g. ${level.estimate}>",
  "domain": "<which topic/area this belongs to>",
  "why": "<one sentence: why this is a good next item for THIS learner>",
  "draftMeaning": "<1-2 sentence explanation of the item's meaning/usage>"
}`
}

// ─── Web verification ───────────────────────────────────────────────────────
// Given a draft suggestion + search results, confirm or correct the facts so we
// don't card a hallucination.
export function buildVerifyPrompt({ suggestion, searchResults }) {
  return `Verify the facts of this proposed flashcard item against the web search results. Correct it if wrong.

Proposed item:
- term: ${suggestion.term}
- translation/meaning: ${suggestion.translation}
- explanation: ${suggestion.draftMeaning}

Web search results:
${searchResults.map((r, i) => `${i + 1}. ${r.title}\n   ${r.url}\n   ${r.snippet}`).join('\n\n')}

Return ONLY a JSON object (no markdown):
{
  "verified": true | false,
  "translation": "<corrected translation/meaning if needed, else keep>",
  "draftMeaning": "<corrected explanation if needed, else keep>",
  "note": "<short note on any correction, or empty string>"
}`
}
