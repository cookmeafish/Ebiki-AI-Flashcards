// THE OPTION CHECK for fights and quizzes (utils/distractorCheck.js; the review model, fail-soft): every question whose
// options the learner can pick (a typed question's `alt`, a choice question's own `choices`) is asked once, in one
// call: "is any wrong option also right here?". A flagged option is swapped for a spare of the same plan
// (kit/fightChoices.js keeps them in `spare`) or dropped while 2 wrong options remain. Platform-neutral (no window).
import { buildDistractorCheckPrompt, parseDistractorCheck, swapFlagged } from '../../utils/distractorCheck'

const setOf = (q) => {
  if (!q || typeof q !== 'object' || q.open) return null
  if (q.kind === 'choice' && Array.isArray(q.choices) && Number.isInteger(q.answerIdx)) return { choices: q.choices, answerIdx: q.answerIdx, spare: q.spare || [] }
  if (q.alt && Array.isArray(q.alt.choices) && Number.isInteger(q.alt.answerIdx)) return q.alt
  return null
}
const withSet = (q, set) => (q.kind === 'choice' ? { ...q, choices: set.choices, answerIdx: set.answerIdx, spare: set.spare } : { ...q, alt: { ...q.alt, choices: set.choices, answerIdx: set.answerIdx, spare: set.spare } })

// The check's items for these questions (only those with options; a meaning form asks its own question).
export function choiceCheckItems(qs) {
  const at = []
  const items = []
  ;(qs || []).forEach((q, i) => {
    const set = setOf(q)
    if (!set || set.choices.length < 3) return
    at.push(i)
    items.push({ question: q.alt?.prompt || q.prompt || '', answer: set.choices[set.answerIdx], options: set.choices })
  })
  return { at, items }
}
// The verdict applied: → Map(index in qs → the fixed question, or null = its options are unusable).
export function applyChoiceCheck(qs, at, verdict) {
  const out = new Map()
  if (!verdict) return out
  for (const [k, flagged] of verdict) {
    const i = at[k]
    const q = qs[i]
    const set = setOf(q)
    if (!set) continue
    const fixed = swapFlagged(set, flagged)
    out.set(i, fixed ? withSet(q, fixed) : null)
  }
  return out
}
// One call for the batch. ai = ctx.ai ({ call, json }); job/role: the caller's review job. → Map as above (empty when
// the check failed or found nothing: fail-soft, the questions stand).
export async function checkChoices(ai, qs, { isLanguage = false, learnLang = '', role, job, maxTokens = 600 } = {}) {
  const { at, items } = choiceCheckItems(qs)
  if (!items.length || !ai?.call) return new Map()
  try {
    const { system, user } = buildDistractorCheckPrompt(items, { isLanguage, learnLang })
    const reply = await ai.call(system, user, { role, job: job, maxTokens, silent: true }) // the caller's own review job
    return applyChoiceCheck(qs, at, parseDistractorCheck(ai.json ? ai.json(reply) : reply, items))
  } catch { return new Map() }
}
