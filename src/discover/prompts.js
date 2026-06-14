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
export function buildSuggestionPrompt({ profile, modeType, modeName, modeDescription, studyLanguage, excludeList }) {
  const level = profile?.level || { scale: 'tiers', estimate: 'beginner' }
  const weak = (profile?.domains || []).filter((d) => d.status !== 'strong').map((d) => d.name)
  const isLang = modeType === 'language'

  return `You are a tutor suggesting ONE new ${isLang ? 'word or phrase' : 'concept or term'} for the learner to make a flashcard from. They are studying "${modeName}"${modeDescription ? ` (${modeDescription})` : ''}.

Learner level: ${level.scale} = ${level.estimate} (confidence ${profile?.level?.confidence ?? 'unknown'}).
${profile?.summary ? `Profile summary: ${profile.summary}` : ''}
${weak.length ? `Weak / under-covered areas to prioritize: ${weak.join(', ')}.` : ''}

RULES:
- Suggest exactly ONE item, appropriate for their level — slightly stretch them, never trivial.
- ${isLang ? `Do NOT suggest beginner vocabulary if they are intermediate or above (no "manzana" for a B1+ learner). For an advanced learner prefer nuanced/idiomatic/formal items.` : `Prefer a term from an under-covered exam domain or a gap in their knowledge.`}
- Prefer the weak/under-covered areas listed above when sensible.
- Do NOT suggest anything in this exclude list (already known, declined, or already a card):
${excludeList.length ? excludeList.map((t) => `  - ${t}`).join('\n') : '  (none yet)'}
${isLang && studyLanguage ? `- The item must be in ${studyLanguage}. Provide its English translation.` : ''}

Return ONLY a JSON object (no markdown, no commentary):
{
  "term": "<the ${isLang ? 'word/phrase in the target language' : 'concept/term'}>",
  "partOfSpeech": "<part of speech if a word, else empty string>",
  "translation": "<English translation/gloss, or short definition for non-language subjects>",
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
