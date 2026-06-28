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

// Vision OCR + in-context translation in a single pass. The model READS the image
// directly (far more accurate than Tesseract on stylized/busy game screens) and returns
// every learnable word with an in-context translation, sense, alternatives, POS,
// pronunciation, synonyms, a reading-order line group, and a normalized bounding box.
export const VISION_OCR_PROMPT = `You read text from an image for a language learner and translate it IN CONTEXT.

You receive JSON: {"from":"Spanish","to":"English","context":"optional note"}

Look at the image. Extract every meaningful word written in the SOURCE language ("from").
Use the whole scene as context so each translation fits how the word is actually used.

Return ONLY a raw JSON array (no markdown, no prose). One object PER WORD, in natural
reading order (top-to-bottom, left-to-right):
- "w": the exact word as written in the image (keep accents/punctuation-free form)
- "t": its translation into the TARGET language ("to"), chosen for THIS context. If it is a
  proper name keep it; if already in the target language keep it as-is.
- "sense": a short (2-6 word) gloss of what the word means AS USED here
- "alts": up to 3 other common meanings it has in OTHER contexts (a few words each; [] if none)
- "s": 2-3 synonyms in the target language ([] for names/numbers/function words)
- "c": category — "foreign" (needs translation) | "name" (proper noun/character/place/brand) |
  "target" (already in the target language) | "number" (digits/stats)
- "p": part of speech — "noun"|"verb"|"adj"|"adv"|"prep"|"art"|"conj"|"pron"|"other"
- "r": approximate pronunciation of the original word in simple English phonetics (e.g. "soor-KAR")
- "line": integer line/sentence group. Words on the same visual line share the same number;
  increment for each new line, top to bottom.
- "box": [x0,y0,x1,y1] the word's bounding box as fractions of image size (0..1), where x0,y0 is
  the top-left and x1,y1 the bottom-right. Make boxes tight around the word.

RULES:
- ONLY include real readable words. Do NOT invent text for textures, shapes, logos, icons or noise.
- Skip pure UI chrome / HUD numbers / menu labels unless they are learnable source-language words.
- If the image has no readable source-language text, return [].
- Output ONLY the JSON array.`

// Spanish flashcard generator — produces the user's exact Frente/Dorso format. Returns a
// JSON ARRAY of card objects (one per distinct meaning; multiple = multi-meaning word).
export const SPANISH_CARD_PROMPT = `You generate Spanish-learning flashcards for an American English speaker.

You receive JSON: {"words": ["surcar", ...], "deck": "Español"}

For EACH input word/phrase, output one or more card objects (multiple ONLY if it has clearly
distinct unrelated meanings — one card per meaning). Each card object:
- "word": the headword shown on the front. For verbs use the INFINITIVE.
- "pos": part of speech in SPANISH (e.g. "sustantivo masculino", "sustantivo femenino", "verbo",
  "adjetivo", "adverbio", "expresión").
- "pronunciation": simplified phonetics for an American English speaker, stressed syllable in CAPS
  (e.g. "soor-KAR").
- "translation": main English translation(s).
- "directTranslation": literal translation or cognate if a meaningful one exists; OMIT this key
  entirely (or set "") if there is none.
- "synonyms": similar ENGLISH words (comma-separated string), or "" if none.
- "definition": a simple definition IN SPANISH.
- "example": one natural Spanish example sentence followed by its English translation in parentheses.
- "note": optional short note (e.g. "forma conjugada de 'surcar'" when a conjugated form was given);
  OMIT or "" if not needed.
- "correction": if the input looks misspelled, set this to the suggested correct spelling and base the
  card on the corrected word; OMIT or "" otherwise.
- "tags": array of useful tags (part of speech, level, topic). Always include "ebiki".

ACCURACY IS CRITICAL — the student will MEMORIZE these. Only use REAL, correctly-spelled Spanish words; never invent a word. Verify the gender, pronunciation, translation, and that the example sentence is natural and correct before outputting. If the input word does not exist, use the closest correct real word and set "correction".

All English is American English. Definitions stay concise and in Spanish; examples natural.
Output ONLY the raw JSON array. No markdown, no backticks, no commentary.`

// Generic flashcard generator for NON-language modes — lets the model design a format that
// actually helps the learner for that subject (chemistry ≠ vocabulary). Returns a JSON ARRAY.
export const GENERIC_CARD_PROMPT = `You generate study flashcards. Subject/mode: "{MODE}" ({TYPE}).

You receive JSON: {"words": ["term", ...]}

For EACH input term output one card object designed to best teach THAT subject (you choose which
fields belong on the back — definition, key points, formula, example, etc.):
- "word": the term shown on the front
- "back": the back content as plain text. Put each labeled line as "Label: value" on its own line
  (newline-separated) so labels can be bolded. Use whatever labels suit the subject.
- "tags": array of relevant tags. Always include "ebiki".
Output ONLY the raw JSON array. No markdown, no backticks, no commentary.`

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
