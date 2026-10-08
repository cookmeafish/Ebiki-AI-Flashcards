// The answer-leak guard: an answer must never appear in its own question or hint.
// Moved verbatim out of App.jsx (pure: no React, no app state) so they can be tested; App imports them back.

// ── HARD GUARANTEE: the answer must never appear inside a question's own text ──────────────
// The model sometimes writes the target word INTO the disambiguating cue ("…rollo de papel o
// pergamino…" when the answer IS "pergamino"), which destroys the question. Detection is
// accent-insensitive and whole-word; explanation questions (no exact answer) are exempt.
// Latin accents plus Arabic harakat and Hebrew niqqud: a vowel-marked question never matched an
// unmarked answer (or the reverse), so those leaks went through unseen.
// Recomposed (NFC) at the end: NFD splits every Hangul syllable into jamo, so Korean lengths and
// prefixes were measured in jamo.
// Apostrophes folded too: a question holding "aujourd’hui" never matched an accepted "aujourd'hui".
export const leakNorm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f\u064b-\u065f\u0670\u05b0-\u05c7]/g, '').normalize('NFC').replace(/[\u2019\u2018\u02bc`\u00b4]/g, "'")
// Korean attaches particles to the word (사과를, 고양이는), so a whole-word test never fires: a token
// that STARTS WITH a 2+ syllable Hangul answer is a leak.
export const HANGUL = /\p{Script=Hangul}/u
// Length for the "too short to check" floors: Hangul counted in JAMO, as before NFC (a one-syllable
// answer like 물 is 3 jamo and must stay protected; counted as 1 it slipped into questions and hints).
export const leakLen = (na) => (HANGUL.test(na) ? na.normalize('NFD').length : na.length)
export const hangulLeak = (normText, na) => HANGUL.test(na) && [...na].length >= 2 && normText.split(/[^\p{L}\p{N}]+/u).some((tok) => tok.startsWith(na))
// Scripts written WITHOUT spaces between words. Whole-word matching can never fire there (no
// boundary precedes the answer) and most answers are 1-2 characters, below the length floor, so
// for Chinese/Japanese/Thai the guard did nothing. There: substring match from 2 characters.
export const NO_SPACE_SCRIPT = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Thai}]/u
export const noSpaceLeak = (normText, na) => NO_SPACE_SCRIPT.test(na) && [...na].length >= 2 && normText.includes(na)
export const answerInQuestionText = (text, a) => {
  const na = leakNorm(a).trim()
  if (NO_SPACE_SCRIPT.test(na)) return noSpaceLeak(text, na)
  if (hangulLeak(text, na)) return true
  if (leakLen(na) < 3) return false // 1-2 letter "answers" would false-positive on articles/particles
  return new RegExp(`(^|[^\\p{L}\\p{N}])${na.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}])`, 'u').test(text)
}
// The answers a question must not show: the accepted ones plus the CORRECT choice (buildChoices keeps the model's
// pick when it matches no accepted answer, so "Transmission Control Protocol" shipped in its own question). The
// choice counts only when no distractor is named too ("True or false: ...", "Is it A or B?" name every option).
export const leakAnswers = (q) => {
  const accepted = Array.isArray(q?.acceptedAnswers) ? q.acceptedAnswers.map(String) : []
  if (!q || !Array.isArray(q.choices) || !Number.isInteger(q.answerIdx) || !q.choices[q.answerIdx]) return accepted
  const text = leakNorm(q.question || '')
  const others = q.choices.filter((c, i) => i !== q.answerIdx && c)
  // The question names the options ("True or false: ...", "a fruit or a vegetable?"): the correct option is
  // among the accepted answers too (the prompt requires it), so it "leaked", cost two regenerations and shipped
  // blanked ("___ or false"). Accepted answers that ARE one of the choices are left out; every other word stays guarded.
  if (others.some((c) => answerInQuestionText(text, String(c)))) {
    const choiceSet = new Set(q.choices.filter(Boolean).map((c) => leakNorm(String(c)).trim()))
    return accepted.filter((a) => !choiceSet.has(leakNorm(a).trim()))
  }
  return [...accepted, String(q.choices[q.answerIdx])]
}
export const questionAnswerLeak = (q) => {
  if (!q || q.type === 'explanation') return null
  const accepted = leakAnswers(q)
  if (accepted.length === 0) return null
  const text = leakNorm(q.question || '')
  for (const a of accepted) if (answerInQuestionText(text, a)) return a
  return null
}
// Last-resort scrub (when even the regeneration leaked): blank the answer tokens out of the
// question text so a leak can NEVER reach the student. "…papel o pergamino que…" → "…papel o ___ que…".
export const scrubAnswerFromQuestion = (q) => {
  if (!questionAnswerLeak(q)) return q
  const answers = leakAnswers(q)
  const acceptedNorm = new Set(answers.map((a) => leakNorm(a).trim()).filter((a) => leakLen(a) >= 3))
  // Tokens include combining marks (\p{M}): split on letters alone, a vowel-marked Arabic/Hebrew word
  // broke into pieces and never matched the unmarked answer, so the scrub changed nothing.
  const hangulAnswers = answers.map((a) => leakNorm(a).trim()).filter((a) => HANGUL.test(a) && [...a].length >= 2)
  let question = String(q.question).split(/([\p{L}\p{M}]+)/u).map((tok) => {
    if (acceptedNorm.has(leakNorm(tok))) return '___'
    const hit = hangulAnswers.find((na) => leakNorm(tok).startsWith(na))
    return hit ? '___' + leakNorm(tok).slice(hit.length) : tok // keep the particle: 사과를 → ___를
  }).join('')
  // No-space scripts (Chinese/Japanese/Thai): the detector matches a 2+ character answer as a
  // SUBSTRING, so the scrub must too; the length floor above skipped most Chinese words entirely.
  for (const a of answers) {
    const raw = String(a).trim()
    if (NO_SPACE_SCRIPT.test(raw) && [...raw].length >= 2) {
      question = question.split(raw).join('___')
      const nfc = raw.normalize('NFC'); if (nfc !== raw) question = question.split(nfc).join('___')
    }
  }
  // Multi-word answers survive the token pass — strike them directly, case-insensitively.
  if (questionAnswerLeak({ ...q, question })) {
    for (const a of answers) {
      if (String(a).trim().length < 3) continue
      question = question.replace(new RegExp(String(a).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/'/g, "['\u2019\u2018\u02bc]"), 'gi'), '___') // any apostrophe form, like leakNorm
    }
  }
  return { ...q, question }
}

// FUZZY variant for HINTS: also catches plural/gender/derived forms ("pergaminos" when the
// answer is "pergamino"). Questions keep the exact whole-word check (a fuzzy match could
// wrongly scrub legitimate context words from a fill-in-the-blank sentence); for a HINT,
// over-scrubbing is harmless and revealing the answer is fatal.
export const hintTokenLeaks = (tok, na) =>
  tok === na || (na.length >= 6 && tok.startsWith(na.slice(0, na.length - 2)) && tok.length <= na.length + 3)
export const hintRevealsAnswer = (text, accepted) => {
  const normText = leakNorm(text)
  const toks = normText.split(/[^\p{L}\p{N}]+/u).filter(Boolean)
  const all = (accepted || []).map((a) => leakNorm(a).trim())
  if (all.some((na) => noSpaceLeak(normText, na) || hangulLeak(normText, na))) return true
  const answers = all.filter((a) => leakLen(a) >= 3 && !NO_SPACE_SCRIPT.test(a))
  // Any non-letter in the answer (a space, an apostrophe, a hyphen: "aujourd'hui", "week-end") means the token
  // split can never match it whole: the substring test decides.
  // Bounded by non-letters: "qu'il" must not match inside "puisqu'il".
  const bounded = (na) => new RegExp(`(^|[^\\p{L}\\p{N}])${na.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}])`, 'u').test(normText)
  return answers.some((na) => (/[^\p{L}\p{N}]/u.test(na) ? bounded(na) : toks.some((tok) => hintTokenLeaks(tok, na))))
}
export const scrubHint = (text, accepted) => {
  const answers = (accepted || []).map((a) => leakNorm(a).trim()).filter((a) => leakLen(a) >= 3)
  let out = String(text).split(/([\p{L}\p{M}]+)/u).map((tok) => { // marks included: see scrubAnswerFromQuestion
    if (!/\p{L}/u.test(tok)) return tok
    const nt = leakNorm(tok)
    if ((accepted || []).some((a) => hangulLeak(nt, leakNorm(a).trim()))) return '___' // Korean: answer + particle
    return answers.some((na) => !/[^\p{L}\p{N}]/u.test(na) && hintTokenLeaks(nt, na)) ? '___' : tok
  }).join('')
  for (const a of accepted || []) {
    const raw = String(a).trim()
    if (/[^\p{L}\p{N}]/u.test(raw) && raw.length >= 3) out = out.replace(new RegExp(`(^|[^\\p{L}\\p{N}])${raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/'/g, "['\u2019\u2018\u02bc]")}(?![\\p{L}\\p{N}])`, 'giu'), '$1___')
    // No-space scripts: blank the answer wherever it appears (see NO_SPACE_SCRIPT).
    if (NO_SPACE_SCRIPT.test(raw) && [...raw].length >= 2) out = out.split(raw).join('___')
  }
  return out
}
