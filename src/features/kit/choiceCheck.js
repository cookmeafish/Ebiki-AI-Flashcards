// THE OPTION CHECK for fights and quizzes (utils/distractorCheck.js; the review model, fail-soft): every question whose
// options the learner can pick (a typed question's `alt`, a choice question's own `choices`) is asked once, in one
// call: "is any wrong option also right here?". A flagged option is swapped for a spare of the same plan
// (kit/fightChoices.js keeps them in `spare`) or dropped while 2 wrong options remain. Platform-neutral (no window).
import { buildDistractorCheckPrompt, parseDistractorCheck, swapFlagged, buildFreshOptionsPrompt, parseFreshOptions } from '../../utils/distractorCheck'
import { optionGuard, shuffleChoices, sharesPrefix } from '../../utils/choicePool'
import { prefixHint, hintTokens, choicePromptText } from '../../utils/prefixHint'

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
    if (!set || set.choices.length < 2) return
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
    // Two wrong options kept where possible; else one (choices stay offered, never with an option that is also right).
    const fixed = swapFlagged(set, flagged) || swapFlagged(set, flagged, { min: 1 })
    if (fixed) { out.set(i, withSet(q, fixed)); continue }
    // Every wrong option flagged: marked for fresh options (checkChoices asks once). A TYPED question stays typed
    // meanwhile; a choice-only one that gets none is unusable (null).
    const { alt: _gone, ...typed } = q
    const right = set.choices[set.answerIdx]
    out.set(i, { ...typed, ...(q.kind === 'choice' ? { choices: null, answerIdx: null } : {}), needChoices: { answer: right, rejected: set.choices.filter((c) => c !== right).map((option) => ({ option, why: flagged.has(option) ? 'a teacher would also accept it' : 'too few options left' })) } })
  }
  return out
}
// One call for the batch, then FRESH OPTIONS for every typed question left without any (`needChoices`: marked by
// kit/fightChoices.js or above): one more call for all of them, told what was rejected and why, the same code guard
// (choicePool.js optionGuard, with the question's `_guard` meanings) and the same check over the new sets. Only what still has no fair option goes typed only
// (`typedOnly: true`). ai = ctx.ai ({ call, json }); job/role: the caller's review job. → Map(index in qs → the fixed
// question, or null = a choice-only question whose options are unusable); empty when nothing changed (fail-soft).
export async function checkChoices(ai, qs, { isLanguage = false, learnLang = '', role, job, maxTokens = 600, fresh = true } = {}) {
  let out = new Map()
  if (!ai?.call || !Array.isArray(qs)) return out
  const { at, items } = choiceCheckItems(qs)
  if (items.length) {
    try {
      const { system, user } = buildDistractorCheckPrompt(items, { isLanguage, learnLang })
      const reply = await ai.call(system, user, { role, job: job, maxTokens, silent: true }) // the caller's own review job
      out = applyChoiceCheck(qs, at, parseDistractorCheck(ai.json ? ai.json(reply) : reply, items))
    } catch { out = new Map() }
  }
  if (!fresh) return out
  const need = []
  qs.forEach((q, i) => {
    const cur = out.has(i) ? out.get(i) : q
    if (cur && typeof cur === 'object' && cur.needChoices && !cur.alt && !cur.open) need.push(i)
  })
  if (!need.length) return out
  const given = need.map((i) => (out.has(i) ? out.get(i) : qs[i]))
  const refilled = await freshOptions(ai, given, { isLanguage, learnLang, role, job })
  need.forEach((i, k) => {
    const { needChoices: _n, ...q } = given[k]
    out.set(i, refilled[k] || (q.kind === 'choice' ? null : { ...q, typedOnly: true }))
  })
  return out
}
// The fresh-options call (one for the batch) → per question the question with its new `alt`, or null.
async function freshOptions(ai, qs, { isLanguage, learnLang, role, job }) {
  const none = qs.map(() => null)
  const items = qs.map((q) => {
    const answer = String(q.needChoices?.answer || (q.kind === 'choice' && Array.isArray(q.choices) ? q.choices[q.answerIdx] : (q.accepted || [])[0]) || '').trim()
    // The prefix hint a typed language question shows first: the new wrong options must start the same way.
    const hint = isLanguage && q.kind !== 'choice' && !q.noHint ? prefixHint(answer) : ''
    return { question: q.prompt || '', answer, accepted: (q.accepted || []).map(String), rejected: q.needChoices?.rejected || [], prefix: hint ? hint.replace(/^\(|\)$/g, '') : '' }
  })
  let got = null
  try {
    const { system, user } = buildFreshOptionsPrompt(items, { isLanguage, learnLang })
    const reply = await ai.call(system, user, { role, job: job, maxTokens: 400 + 120 * items.length, silent: true })
    got = parseFreshOptions(ai.json ? ai.json(reply) : reply, items.length)
  } catch { got = null }
  if (!got || !got.size) return none
  const key = (s) => String(s ?? '').normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim()
  const words = (s) => String(s ?? '').trim().split(/\s+/).filter(Boolean).length
  const built = qs.map((q, k) => {
    const it = items[k]
    if (!it.answer) return null
    const rejected = new Set(it.rejected.map((r) => key(r.option)))
    // The SAME code guard as the first plan (choicePool.js optionGuard): the accepted answers, and the card's and the
    // pool's meanings the question carries (`_guard`, kit/fightChoices.js).
    const g = q._guard || {}
    const fairOne = optionGuard({ answer: it.answer, accepted: it.accepted, meaning: g.meaning || '', entries: g.entries || [], head: g.head || '', isLanguage })
    const fair = (got.get(k) || []).filter((c) => !!key(c) && !rejected.has(key(c)) && fairOne(c))
    // In a language mode the answer's number of words where enough keep it (a lone two-word option stands out).
    const shaped = isLanguage ? fair.filter((c) => words(c) === words(it.answer)) : fair
    const fit = shaped.length >= 2 ? shaped : fair
    // Options sharing the shown prefix keep the hint; else the question shows NO hint (`noHint`) and takes the fair
    // ones (never options the hint would give away).
    const tokens = it.prefix ? hintTokens(it.prefix) : null
    const keep = tokens ? fit.filter((c) => sharesPrefix(c, tokens)) : fit
    const hide = !!tokens && !keep.length
    const pick = (hide ? fit : keep).slice(0, 3)
    if (!pick.length) return null
    const { needChoices: _n, ...q0 } = q
    const rest = hide ? { ...q0, noHint: true, prompt: choicePromptText(String(q0.prompt || ''), [it.answer, ...it.accepted]) } : q0
    const sh = shuffleChoices([it.answer, ...pick], 0)
    if (q.kind === 'choice') return { ...rest, choices: sh.choices, answerIdx: sh.answerIdx, spare: [], from: 'fresh' }
    return { ...rest, alt: { choices: sh.choices, answerIdx: sh.answerIdx, from: 'fresh', spare: [] } }
  })
  // The same check over the new sets (no second fresh round): a flagged one is dropped while 1 wrong one remains.
  const sets = built.filter(Boolean)
  if (!sets.length) return none
  const fixes = await checkChoices(ai, sets, { isLanguage, learnLang, role, job, fresh: false }).catch(() => new Map())
  let n = 0
  return built.map((q) => {
    if (!q) return null
    const i = n++
    if (!fixes.has(i)) return q
    const f = fixes.get(i)
    return f && !f.needChoices && (f.kind === 'choice' ? Array.isArray(f.choices) : f.alt) ? f : null
  })
}
