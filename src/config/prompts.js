export const TRANSLATE_PROMPT = `Translate words from one language to another. Classify each word by category and part of speech. Detect OCR fragments.

You receive JSON: {"words": [{"i":0,"w":"word1"},...], "from": "Spanish", "to": "English", "context": "..."}

Return a JSON array. For each input word, return an object:
- "i": the SAME index number from the input (MUST match)
- "w": the SAME original word from the input (MUST match)
- "t": translation in the TARGET language. If a name, keep the original. If already in target language, keep as-is.
- "s": 2-3 synonyms in the target language (empty array for articles/prepositions/names/numbers)
- "c": category — one of: "foreign" (needs translation), "name" (proper noun/character/place/brand), "target" (already in target language), "number" (digits/stats)
- "p": part of speech — one of: "noun", "verb", "adj", "adv", "prep", "art", "conj", "pron", "other"
- "r": approximate pronunciation guide for the original word (e.g. "kreh-EE-ahn" for "creían"). Use simple English phonetics.

OCR FRAGMENT DETECTION: The input comes from OCR which sometimes splits one word into fragments (e.g. "Sobre" + "guardia" = "Sobreguardia", or "Hab" + "ilidad" = "Habilidad"). If you detect that consecutive words are fragments of a single word, add "m" (merge) to the FIRST fragment's object:
- "m": array of indices to merge together (e.g. [3,4] means words at index 3 and 4 are one word)
Only the first fragment gets "m". The other fragments should still be returned normally but will be merged.

CRITICAL: Every output object MUST include "i" and "w" copied exactly from the input. Always return valid JSON array. Never add commentary.

Words with punctuation attached (e.g. "púas,") — translate the word part, ignore punctuation.

Output ONLY the raw JSON array. No markdown, no backticks, no explanation.

Example:
Input: {"words":[{"i":0,"w":"Aventura"},{"i":1,"w":"en"},{"i":2,"w":"Naramon"}],"from":"Spanish","to":"English","context":"Aventura en Naramon"}
Output: [{"i":0,"w":"Aventura","t":"Adventure","s":["quest","journey"],"c":"foreign","p":"noun","r":"ah-ven-TOO-rah"},{"i":1,"w":"en","t":"in","s":[],"c":"foreign","p":"prep","r":"en"},{"i":2,"w":"Naramon","t":"Naramon","s":[],"c":"name","p":"noun","r":"nah-rah-MOHN"}]

Fragment example:
Input: {"words":[{"i":0,"w":"Sobre"},{"i":1,"w":"guardia"}],"from":"Spanish","to":"English","context":"Sobreguardia"}
Output: [{"i":0,"w":"Sobre","t":"Overguard","s":["shield"],"c":"foreign","p":"noun","r":"soh-breh-GWAR-dee-ah","m":[0,1]},{"i":1,"w":"guardia","t":"guard","s":[],"c":"foreign","p":"noun","r":"GWAR-dee-ah"}]`

// Part-of-speech color map. Translucent tinted pills + accent-variable text so they read
// on both Ocean Light and Dark (text colors flip with the theme via CSS variables).
export const POS_COLORS = {
  noun: { bg: 'rgba(223,37,64,.12)', border: 'rgba(223,37,64,.28)', text: 'var(--c-brand)', label: 'Noun' },
  verb: { bg: 'rgba(139,92,246,.14)', border: 'rgba(139,92,246,.30)', text: 'var(--c-purple)', label: 'Verb' },
  adj:  { bg: 'rgba(232,147,12,.16)', border: 'rgba(232,147,12,.32)', text: 'var(--c-warning)', label: 'Adjective' },
  adv:  { bg: 'rgba(17,168,160,.16)', border: 'rgba(17,168,160,.32)', text: 'var(--c-teal)', label: 'Adverb' },
  pron: { bg: 'rgba(45,134,201,.16)', border: 'rgba(45,134,201,.32)', text: 'var(--c-info)', label: 'Pronoun' },
  prep: { bg: 'rgba(81,98,108,.10)', border: 'rgba(81,98,108,.20)', text: 'var(--c-ink-dim)', label: 'Preposition' },
  art:  { bg: 'rgba(81,98,108,.10)', border: 'rgba(81,98,108,.20)', text: 'var(--c-ink-dim)', label: 'Article' },
  conj: { bg: 'rgba(81,98,108,.10)', border: 'rgba(81,98,108,.20)', text: 'var(--c-ink-dim)', label: 'Conjunction' },
  other:{ bg: 'rgba(81,98,108,.12)', border: 'rgba(81,98,108,.22)', text: 'var(--c-ink-dim)', label: 'Other' },
}

export const CATEGORY_COLORS = {
  name:   { bg: 'rgba(24,169,87,.16)', border: 'rgba(24,169,87,.32)', text: 'var(--c-success)', label: 'Name' },
  target: { bg: 'rgba(24,169,87,.10)', border: 'rgba(24,169,87,.18)', text: 'var(--c-success)', label: null },
  number: { bg: 'transparent', border: 'transparent', text: 'var(--c-ink-dim)', label: 'Number' },
}
