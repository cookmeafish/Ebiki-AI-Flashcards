// THE QUESTION GOAL (pure, tested by questionGoal.test.js). The owner (2026-10-10): "ALWAYS KEEP IN MIND WHAT THE
// QUESTION SHOULD BE ASKING OR NEED THE USER TO REPRODUCE TO MAKE SURE THE USER UNDERSTANDS IT ... DIFFERENT CARDS AND
// SUBJECTS MIGHT NEED A DIFFERENT TREATMENT. A CHECK FOR WHAT TYPE OF QUESTION OR LEARNING EXPERIENCE IT SHOULD GIVE
// BASED ON THE GOAL IS REQUIRED." A CompTIA learner who can type "secure enclave" may still not know what it is.
//
// Before any question is written (Study, raids, Legends), the card's GOAL is decided from what the app knows (the mode
// kind, the card's fields and shape, a Legends item's kind): what the learner must REPRODUCE or UNDERSTAND. The goal
// travels into the question prompt (goalLine: what to ask at this tier of the ladder) and into the independent review
// pass (GOAL_CHECK_RULES: a question that does not serve the goal at its tier is rejected). The writer may state its
// own goal in its JSON ("goal"); shapeGoal keeps it only when it is one of GOALS, and the review sees both.
//
// Goals, by mode kind:
//   language: word (recall the word, then use it), phrase (an expression: say it and know when), rule (apply a grammar
//             or spelling rule to new cases)
//   general:  concept (understand: what it is, what it is for, when to use it, how it differs, applied), fact (a
//             value, name, date, number: exact, then its context), procedure (steps in order, when, what breaks),
//             formula (apply it, then each part and when it holds)
// Prefix hints (utils/prefixHint.js) are a LANGUAGE tool: only language goals get them (goalAllowsHint).
export const LANGUAGE_GOALS = ['word', 'phrase', 'rule']
export const GENERAL_GOALS = ['concept', 'fact', 'procedure', 'formula']
export const GOALS = [...LANGUAGE_GOALS, ...GENERAL_GOALS]

const str = (v) => String(v ?? '').replace(/\s+/g, ' ').trim()
const firstLine = (s) => String(s ?? '').split(/\r?\n/).map((l) => l.trim()).find(Boolean) || ''
const wordCount = (s) => str(s).split(' ').filter((w) => /\p{L}|\p{N}/u.test(w)).length

// Shapes that say what a card is (data, any language: never `if (lang === ...)`).
const RULE_FRONT = /\b(rule|grammar|when (?:do|does|to) (?:you )?use|cu[aá]ndo (?:se )?usa|quand (?:on )?utilise|regla|gram[aá]tica|r[eè]gle|grammaire|regel|grammatik|regola)\b|文法|语法|規則|规则/iu
const STEPS = /(^|\n)\s*(?:\d+[.)]|[-*•]|step\s*\d+|paso\s*\d+|étape\s*\d+|schritt\s*\d+)\s+\S/giu
const FORMULA = /[=≈≤≥∑√∫^×÷]|\b(?:formula|fórmula|formule|formel)\b/iu
const NUMERIC = /^[\p{N}\s.,:/%°$€£¥+\-–]+[\p{L}%°]{0,6}$/u

// What the card asks the learner to reach. input: { isLanguage, front, back, kind (a Legends item's kind: term, rule,
// skill), aiGoal (the writer's own statement, kept when valid for the mode) } → one of GOALS.
export function questionGoal({ isLanguage = false, front = '', back = '', kind = '', aiGoal = '' } = {}) {
  const ai = shapeGoal(aiGoal, isLanguage)
  if (ai) return ai
  const f = str(front)
  const b = String(back ?? '')
  if (isLanguage) {
    if (kind === 'rule' || (RULE_FRONT.test(f) && wordCount(f) >= 3)) return 'rule'
    // A word with its article ("el perro") or a reflexive particle is still one word; 3+ words is an expression.
    return wordCount(f.replace(/\s*\([^)]*\)\s*$/, '')) >= 3 ? 'phrase' : 'word'
  }
  if (kind === 'skill') return 'procedure'
  const steps = (b.match(STEPS) || []).length
  if (steps >= 2 || /\b(steps?|procedure|procedimiento|pasos|étapes|schritte)\b/iu.test(f)) return 'procedure'
  if (FORMULA.test(f) || (FORMULA.test(firstLine(b)) && /[\p{L}]\s*[=]/u.test(firstLine(b)))) return 'formula'
  const ans = firstLine(b)
  if (NUMERIC.test(ans) || (wordCount(ans) <= 3 && /\?\s*$/.test(f))) return 'fact'
  return 'concept'
}
// A goal written by a model ("Concept", " fact. ") → a known goal for this kind of mode, or ''.
export function shapeGoal(v, isLanguage = null) {
  const g = str(v).toLowerCase().replace(/[^a-z]/g, '')
  if (!GOALS.includes(g)) return ''
  if (isLanguage === true && !LANGUAGE_GOALS.includes(g)) return ''
  if (isLanguage === false && !GENERAL_GOALS.includes(g)) return ''
  return g
}
export const goalAllowsHint = (goal) => LANGUAGE_GOALS.includes(goal)

// Classifying is cheap, but every prompt, review and choice asks for it: one answer per card (front + back), kept.
const CACHE_MAX = 500
const cache = new Map()
export function cardGoal(input = {}) {
  const key = [input.isLanguage ? 1 : 0, input.kind || '', input.aiGoal || '', str(input.front), str(input.back).slice(0, 400)].join('|')
  if (cache.has(key)) return cache.get(key)
  const g = questionGoal(input)
  cache.set(key, g)
  if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value)
  return g
}

// What a question must make the learner reproduce or understand, for this goal, at this tier of the ladder (0..5).
const clamp = (t) => (Number.isFinite(Number(t)) ? Math.max(0, Math.min(5, Math.round(Number(t)))) : 2)
const GOAL_TEXT = {
  word: (t) => `THE GOAL (a word): the learner can PRODUCE this word and then USE it. ${t <= 2 ? 'At this tier: produce the word itself from its meaning or context.' : 'At this tier: use it, in a sentence, a situation, a collocation, or against a close synonym (naming it from its translation alone is too easy now).'}`,
  phrase: (t) => `THE GOAL (an expression): the learner can SAY the whole expression and knows WHEN it is said. ${t <= 2 ? 'At this tier: produce it from the situation or meaning.' : 'At this tier: use it in a short situation, or pick the right register or moment for it.'}`,
  rule: () => 'THE GOAL (a rule): the learner can APPLY the rule to new cases (produce the right form in a new sentence). Never ask to recite or explain the rule\'s theory.',
  concept: (t) => `THE GOAL (a concept): the learner UNDERSTANDS it: what it is, what it is for, when to use it, how it differs from its look-alikes, and can apply it to a scenario. Typing its name is never enough beyond the lowest tiers. ${t <= 1 ? 'At this tier: a supported question may ask for the term from a clear description of what it does.' : t === 2 ? 'At this tier: the clue must need understanding (what it protects or solves, a symptom it fixes, a situation where it applies), never its definition restated so the name comes back.' : t === 3 ? 'At this tier: a realistic scenario where the learner must know what it does to choose it, or to say what it would do there.' : 'At this tier: explain why or how it works, compare it with the closest look-alike, or troubleshoot a case.'}`,
  fact: (t) => `THE GOAL (a fact): the learner can reproduce the exact fact (the value, name, number or date) ${t <= 2 ? 'when asked for it in context' : 'and knows its context: why it is so, when it applies, what it is easily confused with'}.`,
  procedure: (t) => `THE GOAL (a procedure): the learner can reproduce the steps in the right order and knows when to use it. ${t <= 2 ? 'At this tier: a step, the next step, or the order.' : 'At this tier: what goes wrong if a step is skipped or swapped, or the procedure applied to a case.'}`,
  formula: (t) => `THE GOAL (a formula): the learner can APPLY it ${t <= 2 ? 'to simple numbers or a case' : 'and explain what each part means and when it holds'}.`,
}
export function goalLine(goal, tier = 2) {
  const fn = GOAL_TEXT[goal]
  return fn ? fn(clamp(tier)) : ''
}
// The JSON field the writer may add (Study's question prompt): its own statement of the goal.
export const goalField = (isLanguage) => `"goal": "${(isLanguage ? LANGUAGE_GOALS : GENERAL_GOALS).join('" | "')}" (what this card needs the learner to reproduce or understand)`

// THE REVIEW PASS's goal rules (join QUESTION_CHECK_RULES in utils/questionTier.js).
export const GOAL_CHECK_RULES = [
  '- It does not serve the card\'s GOAL at its tier: e.g. a CONCEPT card at TIER 2 or above asked only to name the term from its definition (typing a name proves recall, not understanding); a RULE card asked to recite the rule instead of applying it; a mature WORD card asked only for its translation.',
  '- It shows a letter, prefix or length hint of the answer on a card that is not in a language course.',
].join('\n')
