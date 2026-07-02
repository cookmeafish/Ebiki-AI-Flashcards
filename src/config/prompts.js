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
"from" is the language the user is LEARNING. "to" is the language they already speak.
(If "from" is "Auto-detect", detect the main non-"to" language in the image and use that.)

Look at the image. Extract every meaningful readable word — in EITHER language. Translation is
BIDIRECTIONAL, always toward the language the word is NOT in:
- A word in the LEARNED language ("from") → translate it into "to" (classic reading help).
- A word in the user's own language ("to") → translate it into the LEARNED language ("from"),
  so ANY screen becomes vocabulary practice for the learner.
Use the whole scene as context so each translation fits how the word is actually used.

Return ONLY a raw JSON array (no markdown, no prose). One object PER WORD, in natural
reading order (top-to-bottom, left-to-right), with EXACTLY these fields and NOTHING more —
keep the output lean; richer detail (gloss/synonyms/pronunciation) is fetched separately:
- "w": the exact word as written in the image (keep accents/punctuation-free form)
- "t": its translation into the OTHER language (per the bidirectional rule above), chosen for
  THIS context. Proper names stay as-is.
- "c": category — "foreign" (word was translated) | "name" (proper noun/character/place/brand) |
  "target" (identical in both languages / nothing to translate) | "number" (digits/stats)
- "p": part of speech — "noun"|"verb"|"adj"|"adv"|"prep"|"art"|"conj"|"pron"|"other"
- "line": integer line/sentence group. Words on the same visual line share the same number;
  increment for each new line, top to bottom.
- "box": [x0,y0,x1,y1] the word's bounding box as fractions of image size (0..1, 3 decimal
  places), x0,y0 = top-left, x1,y1 = bottom-right. Make boxes tight around the word.

RULES:
- ONE object per single word — NEVER merge several words into one object. "paste / drag-drop"
  is TWO objects ("paste" and "drag-drop"); a hyphenated compound counts as one word. If words
  form a phrase, still list each word separately and let "sense" reflect its meaning IN the phrase.
- ONLY include real readable words. Do NOT invent text for textures, shapes, logos, icons or noise.
- Skip URLs, file paths, keyboard-shortcut codes, and meaningless fragments; real words in UI
  labels/menus/buttons ARE learnable — include them.
- If the image has no readable text at all, return [].
- Output ONLY the JSON array.`

// Clean-image fast path: on visually FLAT screenshots Tesseract reads the text reliably, so
// the model never sees the image — it just translates Tesseract's word list (text-only call
// on the cheap/fast tier). Bidirectional + mode-aware like the vision prompt.
export const WORDLIST_TRANSLATE_PROMPT = `You translate a list of words OCR'd from a screen for a language learner.

You receive JSON: {"words":[{"i":0,"w":"palabra"},...],"from":"Spanish","to":"English","context":"all words in reading order"}
"from" is the language the user is LEARNING; "to" is the language they already speak.
(If "from" is "Auto-detect", detect the main non-"to" language among the words and use that.)

Translation is BIDIRECTIONAL, always toward the language the word is NOT in:
- a word in the learned language ("from") → translate it into "to"
- a word in the user's language ("to") → translate it into "from"
Use the context so each translation fits how the word is actually used.

Return ONLY a raw JSON array, one object per input word:
- "i": the SAME index from the input (MUST match)
- "t": the translation (proper names stay as-is)
- "c": "foreign" (was translated) | "name" (proper noun/place/brand) | "target" (identical in
  both languages / nothing to translate) | "number" (digits/stats) | "skip" (OCR junk: stray
  letters, garbled fragments, URLs, file paths — not a real word)
- "p": part of speech — "noun"|"verb"|"adj"|"adv"|"prep"|"art"|"conj"|"pron"|"other"
No markdown, no commentary. Every output object MUST carry its input "i".`

// Lazy per-word enrichment for the vision fast path: on text-dense screens the scan returns
// only core fields; this fetches sense/alts/synonyms/pronunciation the first time a word is
// hovered or clicked. One word per call — small, fast, cheap.
export const WORD_ENRICH_PROMPT = `You enrich ONE word from an already-translated screen for a language learner.

You receive JSON: {"word":"...","translation":"...","from":"Spanish","to":"English","context":"all text on the screen"}
"from" is the language being LEARNED; "to" is the user's own language. The word may be in either
language; its "translation" is in the other one.

Return ONLY a raw JSON object (no markdown, no prose):
- "sense": a short (2-6 word) gloss of what the word means AS USED in this context
- "alts": up to 3 other common meanings it has in OTHER contexts (a few words each; [] if none)
- "s": 2-3 synonyms of the translation, in the translation's language ([] for names/numbers/function words)
- "r": approximate pronunciation in simple English phonetics of whichever side is in the LEARNED
  "from" language — the word itself if it is a "from" word, otherwise its translation.`

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

// Language-agnostic flashcard generator — works for ANY language being learned (Spanish, German,
// Chinese, etc.). The model writes the back labels IN the learned language. Returns a JSON ARRAY.
export const LANGUAGE_CARD_PROMPT = `You generate {LEARN_LANG}-learning flashcards for someone who speaks {USER_LANG}.

You receive JSON: {"words": ["...", ...]}

For EACH input word/phrase, output one or more card objects (multiple ONLY for clearly distinct unrelated meanings, one card per meaning). Each card object:
- "front": "<headword> (<part of speech written in {LEARN_LANG}>)". For verbs use the infinitive. For languages with no spaces (e.g. Chinese), the headword is the word/characters.
- "back": the card back as plain text, each labeled line on its OWN line. Write the LABELS in {LEARN_LANG}. Include these fields in order:
   • pronunciation: simplified phonetics for a {USER_LANG} speaker, stressed syllable in CAPS (for Chinese/Japanese also give romanization/pinyin)
   • translation: the {USER_LANG} translation(s)
   • direct/literal translation: only if a meaningful one exists, otherwise OMIT this line entirely
   • synonyms: similar {USER_LANG} words
   • definition: a simple definition written IN {LEARN_LANG}
   • example: one natural {LEARN_LANG} sentence, with its {USER_LANG} translation in parentheses
- "correction": if the input is misspelled or is NOT a real {LEARN_LANG} word, set this to the correct word and base the card on it; omit otherwise.
- "tags": array including the part of speech, level, topic, and "ebiki".

ACCURACY IS CRITICAL, the student will MEMORIZE these. Only use REAL, correctly-spelled {LEARN_LANG} words; never invent one. Verify gender, pronunciation, translation, and that the example is natural and correct. All non-{LEARN_LANG} text is in {USER_LANG}.
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
