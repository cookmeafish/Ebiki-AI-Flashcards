// THE TEACHING FACT CHECK (Settings > AI & cost, "Double-check Ebi's explanations", on by default). Pure, tested
// (factCheck.test.js). After a teaching reply is SHOWN (Chat typed or spoken, Learn it), one background call on the
// review model reads it and names up to 2 real mistakes, each quoting the reply's exact words. Independent judges found
// confident wrong facts in replies that passed every style check (docs/reviews/2026-11-15-accuracy-regressions.md).
// A false correction is worse than none, so a note survives only when its quote is really in the reply, and style,
// dialect, register, emphasis and omissions are never "mistakes". Design: docs/plans/2026-11-15-model-plan-settings.md B.

export const FACT_CHECK_MAX_TOKENS = 500
export const FACT_CHECK_MAX_NOTES = 2
export const QUOTE_MAX_WORDS = 25
// A reply this short teaches nothing checkable ("¡Claro! ¿Y tú?").
export const MIN_REPLY_WORDS = 8

const fold = (s) => String(s || '').normalize('NFC').toLowerCase()
  .replace(/[‘’ʼ`´]/g, "'").replace(/[“”«»„]/g, '"').replace(/\*\*|__|`/g, '').replace(/\s+/g, ' ').trim()

// Style, not a mistake: a "fix" that only asks for clarity, nuance, naturalness or more detail is dropped.
const STYLE_ONLY = /\b(could be (clearer|more|better)|more natural|consider (adding|mentioning|saying)|might (want|be better)|for clarity|it would help|also worth|you could also|more precise wording|slightly (awkward|unclear))\b/i

export function shouldFactCheck(reply) {
  const words = String(reply || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean)
  return words.length >= MIN_REPLY_WORDS
}

// `subject`: { language: 'Spanish' } for a language mode (its sentences are checked too), else { topic: 'Security+' }.
// `context`: what Ebi was given as TRUE (a card's text, a checked explanation): a reply agreeing with it is right.
export function buildFactCheckPrompt({ reply, question = '', context = '', subject = {}, userLang = 'English' }) {
  const lang = subject.language
  const system = [
    'You check a tutor\'s reply for MISTAKES that would teach the learner something false. You are careful: a wrong correction is worse than none.',
    'A mistake is: a false fact or definition; a wrong rule or a rule stated as always true when common cases break it; a wrong example or synonym; a claim with no basis stated as fact; a WRONG REASON given for a conclusion (the learner will reuse the reason); a "correct" verdict for an answer that does not answer what was asked.',
    lang ? `The learner studies ${lang}. Ebi's own ${lang} sentences count too: a grammar error in them (a wrong verb form, agreement, person, mood) is a mistake, since the learner copies them.` : '',
    'NOT mistakes (never report these): style, wording, tone, length, register, a regional variant or dialect that is correct somewhere, a simplification that stays true, something left out, an opinion, a choice of example.',
    context ? 'The CHECKED MATERIAL below is correct. A reply that agrees with it is right on that point; a reply contradicting it is wrong.' : '',
    `For each mistake (at most ${FACT_CHECK_MAX_NOTES}), copy the reply's EXACT words that are wrong (at most ${QUOTE_MAX_WORDS} words, copied character for character) and write the correction in ${userLang}: one short plain sentence saying what is true. No dashes.`,
    'If you are not sure something is wrong, it is not a mistake. Most replies have none.',
    'Return ONLY JSON: {"mistakes": [{"quote": "...", "fix": "..."}]} or {"mistakes": []}.',
  ].filter(Boolean).join('\n')
  const user = [
    context ? `CHECKED MATERIAL:\n${String(context).slice(0, 4000)}` : '',
    question ? `THE LEARNER ASKED:\n${String(question).slice(0, 1500)}` : '',
    `THE TUTOR'S REPLY:\n${String(reply).slice(0, 6000)}`,
  ].filter(Boolean).join('\n\n')
  return { system, user }
}

// Did the checker give a real answer (a list of mistakes, empty or not)? A reply that cannot be read is NOT "no
// mistakes": callers that must fail closed (fight notes and taunts) ask this first.
export function factCheckReadable(text, parse) {
  let data
  try { data = typeof text === 'string' ? parse(text) : text } catch { return false }
  return Array.isArray(data) || Array.isArray(data?.mistakes) || Array.isArray(data?.errors)
}

// The model's answer → [{ quote, fix }] that are safe to show. `parse` = parseAiJson.
export function parseFactCheck(text, reply, parse) {
  let data
  try { data = typeof text === 'string' ? parse(text) : text } catch { return [] }
  const list = Array.isArray(data) ? data
    : Array.isArray(data?.mistakes) ? data.mistakes
    : Array.isArray(data?.errors) ? data.errors : []
  const hay = fold(reply)
  const out = []
  for (const m of list) {
    const quote = typeof m?.quote === 'string' ? m.quote.trim().replace(/^["'“«]+|["'”»]+$/g, '') : ''
    const fix = typeof m?.fix === 'string' ? m.fix.trim() : typeof m?.correction === 'string' ? m.correction.trim() : ''
    if (!quote || !fix) continue
    if (quote.split(/\s+/).length > QUOTE_MAX_WORDS + 5) continue
    if (fold(quote).length < 3 || !hay.includes(fold(quote))) continue // it must point at words really in the reply
    if (STYLE_ONLY.test(fix)) continue
    if (out.some((o) => fold(o.quote) === fold(quote))) continue
    out.push({ quote, fix })
    if (out.length >= FACT_CHECK_MAX_NOTES) break
  }
  return out
}
