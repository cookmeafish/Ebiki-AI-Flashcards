// RULE CARDS (pure): turn a mistake, a recurring slip or a diagnosis into a flashcard for the RULE behind it.
// A language gets a grammar, spelling or accent rule ("When does qué carry an accent?"); any other subject a
// principle or distinction ("RAID 1 vs RAID 0: which survives a disk failure, and why?"). Cards get memorized,
// so the model must refuse (skip) when there is no real, general rule to teach.
export const RULE_ROLE = 'deck'          // cards get memorized: the strongest tier
export const RULE_MAX_TOKENS = 1200
export const RULE_TAGS = ['ebiki', 'rule']
const FRONT_MAX = 200
const BACK_MAX = 900

// source: { text (the mistake / slip / diagnosis), card?, asked?, answered?, expected? }
export function buildRuleCardPrompt(subject, source, { avoid = [] } = {}) {
  const lang = subject.isLanguage
  return {
    system: 'You write ONE flashcard that teaches the general rule behind a learner\'s mistake. Reply with JSON only: {"skip": false, "front": "...", "back": "...", "tags": ["..."]} or {"skip": true, "why": "..."}. Accuracy matters: the learner memorizes this. Never invent a rule; when the mistake is a one-off (a typo, a single fact with no rule behind it), skip. No dashes. Never write a shrimp emoji.',
    user: [
      `Subject: ${subject.name}${subject.description ? ` (${subject.description})` : ''}.`,
      lang
        ? `The learner studies ${subject.learnLang} and reads ${subject.userLang}. The rule can be grammar, orthography (spelling, accents, capitals, punctuation), agreement, word order or usage. ${subject.rules || ''}`
        : `This is ${subject.name}, never a language lesson. The rule is a principle, distinction, procedure step or rule of thumb of the subject. Keep terms, names, code and formulas as they are.`,
      'What went wrong:',
      source.text ? `- ${source.text}` : '',
      source.card ? `- card: ${source.card}` : '',
      source.asked ? `- asked: ${source.asked}` : '',
      source.answered ? `- learner answered: ${source.answered}` : '',
      source.expected ? `- expected: ${source.expected}` : '',
      avoid.length ? `Rule cards already made (never repeat one): ${avoid.join('; ')}` : '',
      `front: a question in ${subject.userLang} that makes the learner RECALL the rule (not a yes/no), under 25 words.`,
      lang
        ? `back (in ${subject.userLang}, examples in ${subject.learnLang}): the rule in one or two lines, then 2 short correct examples, then "Watch out:" with the mistake this learner made and its fix. Separate lines with \\n.`
        : `back (in ${subject.userLang}): the rule in one or two lines, then one concrete example of applying it, then "Watch out:" with the confusion this learner showed. Separate lines with \\n.`,
      'tags: 1 or 2 lowercase topic tags (for example "accents", "ser-estar", "raid").',
    ].filter(Boolean).join('\n'),
  }
}

// Model text only: an object where text belongs showed "[object Object]" on the card; a back sent as a list of lines is
// read as those lines.
const txt = (v) => (typeof v === 'string' || typeof v === 'number' ? String(v) : Array.isArray(v) ? v.filter((x) => typeof x === 'string' || typeof x === 'number').join('\n') : '')

// { front, back, tags } or { skip: true, why } or null when unreadable.
export function parseRuleCard(raw, clean = (s) => s) {
  if (!raw || typeof raw !== 'object') return null
  // Models answer the flag as text too ("yes", "True"): read as a card, it was refused as incomplete ("unreadable").
  if (raw.skip === true || /^\s*(true|yes|1)\s*$/i.test(typeof raw.skip === 'string' ? raw.skip : '')) return { skip: true, why: clean(txt(raw.why).slice(0, 200)) }
  const front = clean(txt(raw.front).replace(/\s+/g, ' ').trim()).slice(0, FRONT_MAX)
  const back = clean(txt(raw.back).replace(/\\n/g, '\n').replace(/[ \t]+/g, ' ').trim()).slice(0, BACK_MAX)
  if (!front || !back) return null
  const tags = (Array.isArray(raw.tags) ? raw.tags : typeof raw.tags === 'string' ? raw.tags.split(/[,;]/) : [])
    .map((x) => String(x).toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\p{L}\p{N}_:-]/gu, ''))
    .filter(Boolean).slice(0, 2)
  return { front, back, tags: [...new Set([...RULE_TAGS, ...tags])] }
}
