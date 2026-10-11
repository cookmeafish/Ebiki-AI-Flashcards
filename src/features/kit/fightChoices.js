// FIGHT CHOICES FROM THE DECK (pure, tested by fightChoices.test.js): a raid's or a Legends quiz's typed question gets
// its "Show choices" options from the learner's OWN studied material (utils/choicePool.js planChoices), so neither the
// prefix hint nor "the one I know is in my deck" picks the tile: other studied cards sharing the hint's first letters,
// filled up with the model's options that share them too. Never the meaning form (the typed question the learner read
// first names the meaning). Nothing fitting the hint: the question shows no hint (`noHint`) and gets options planned
// for that. Choice-only questions (Legends) go through the same pool and guard. Raids pass the deck's
// studied cards (the due cards they read plus the learner context's studied sample); Legends the map's taught items.
import { planChoices, poolEntry, poolEntries, shuffleChoices, wordOnBack, cardWord, cardMeaning, posOf, fairModelOptions } from '../../utils/choicePool'
import { prefixHint, choicePromptText } from '../../utils/prefixHint'

const firstLine = (s) => String(s ?? '').split(/\r?\n| · /).map((l) => l.trim()).find(Boolean) || ''

// q: a typed question ({ kind, prompt, accepted, open, alt? }) or a choice question ({ kind: 'choice', choices,
// answerIdx }); card: its card or item ({ front, back }); pool: other studied cards or items ({ front, back }); t: the
// app's translator; rnd: the shuffle. → the question with its options replaced (`alt.from` says by what; `spare` = more
// fitting options for the option check's swaps), or unchanged.
// `meaningLabel`: the mode's meaning label (utils/choicePool.js meaningLabel of its back template), when known.
export function withPoolChoices(q, { card = null, pool = [], isLanguage = false, t = (k) => k, rnd = Math.random, meaningLabel = '' } = {}) {
  if (!q || typeof q !== 'object' || q.open || !card) return q
  if (q.kind === 'choice') return choiceFromPool(q, { card, pool, isLanguage, rnd, label: meaningLabel })
  if (q.kind !== 'typed') return q
  const accepted = (Array.isArray(q.accepted) ? q.accepted : []).map((a) => String(a ?? '').trim()).filter(Boolean)
  if (!accepted.length) return q
  const { entries, head, meaning } = readCard(card, accepted, pool, isLanguage, meaningLabel)
  // `_guard`: what the code guard knows about this question (the card's meaning, the pool's meanings), carried along so
  // the fresh-options retry (kit/choiceCheck.js) runs the SAME guard ("buen día" for "buenos días" got through without it).
  const guarded = (r) => ({ ...r, _guard: guardOf(meaning, head, entries) })
  const ai = q.alt && Array.isArray(q.alt.choices) && Number.isInteger(q.alt.answerIdx) ? { choices: q.alt.choices, answerIdx: q.alt.answerIdx } : null
  const base = { answer: accepted[0], accepted, isLanguage, entries, head, meaning, pos: posOf(card.front, card.back), ai, typedSeen: true }
  // Never the meaning form in a fight: the typed question (always seen first) names the meaning.
  let plan = planChoices(base)
  let noHint = false
  // Nothing keeps to the hint: the question shows NO prefix hint (`noHint`, read by ensurePrefixHint), and its options
  // are planned for a question without one (deck words of its kind, else the model's fair options). Never options
  // the hint would give away.
  if (isLanguage && prefixHint(accepted[0]) && (!plan || plan.loose)) {
    noHint = true
    plan = planChoices({ ...base, hintSeen: false })
  }
  const bare = noHint ? { ...q, noHint: true, prompt: choicePromptText(String(q.prompt || ''), accepted) } : q
  // A fight question keeps its choices (the owner, in capitals: questions can be ambiguous). Without a fair set of 3+
  // the model's own options stay, but ONLY those passing the code guard (fairModelOptions: never "perro" beside "el
  // perro"); two options are still a choice. The question then shows no hint, so they cannot beat one. Only when no
  // wrong option is fair at all does the question go typed-only (an option that is also right marks a right answer wrong).
  if (!plan || plan.raw || plan.choices.length < 3) {
    if (!q.alt) return guarded(bare)
    const fair = fairModelOptions({ ai, accepted, meaning, entries, head, isLanguage })
    const hide = isLanguage && !!prefixHint(accepted[0])
    const out = hide ? { ...q, noHint: true, prompt: choicePromptText(String(q.prompt || ''), accepted) } : q
    // No fair wrong option: typed for now, marked `needChoices` so THE OPTION CHECK (kit/choiceCheck.js checkChoices)
    // asks the model ONCE for fresh ones (told what was rejected); typed only is the last resort.
    if (!fair.length) {
      const { alt: _drop, ...typed } = out
      const right = ai ? String(ai.choices[ai.answerIdx] ?? '').trim() : accepted[0]
      const rejected = ai ? ai.choices.map((c) => String(c ?? '').trim()).filter((c, i) => c && i !== ai.answerIdx).map((option) => ({ option, why: 'also right, or another form of the answer' })) : []
      return guarded({ ...typed, needChoices: { answer: right || accepted[0], rejected } })
    }
    const sh = shuffleChoices([String(ai.choices[ai.answerIdx]).trim(), ...fair], 0, rnd)
    return guarded({ ...out, alt: { ...q.alt, choices: sh.choices, answerIdx: sh.answerIdx, from: 'ai', spare: [] } })
  }
  const sh = shuffleChoices(plan.choices, plan.answerIdx, rnd)
  return guarded({ ...bare, alt: { choices: sh.choices, answerIdx: sh.answerIdx, from: plan.kind, spare: plan.spare || [] } })
}
// A card read for the pool: its learned word, its meaning and the pool, each pool card on its own sides.
function readCard(card, accepted, pool, isLanguage, label = '') {
  const swap = isLanguage && wordOnBack(card, accepted)
  const head = cardWord(swap ? firstLine(card.back) : card.front)
  const meaning = cardMeaning(swap ? card.front : card.back, { head, label })
  const list = (pool || []).filter(Boolean).map((c) => ({ front: c.front, back: c.back, studied: c.studied !== false }))
  const entries = isLanguage ? poolEntries(list, { card, swap, label }) : list.map((c) => poolEntry({ ...c, label })).filter(Boolean)
  return { entries, head, meaning }
}
// A CHOICE-ONLY question (Legends' choice kind): it shows no hint, so its options need no shared prefix, but they come
// from the same studied pool and the same guard when its right option IS the item's word ("Which word means 'dog'?");
// any other choice question (a sentence, a fact) keeps the model's options, run through the guard.
function choiceFromPool(q, { card, pool, isLanguage, rnd, label = '' }) {
  if (!Array.isArray(q.choices) || !Number.isInteger(q.answerIdx) || q.choices[q.answerIdx] == null) return q
  const right = String(q.choices[q.answerIdx]).trim()
  const { entries, head, meaning } = readCard(card, [right], pool, isLanguage, label)
  const isWord = !!head && sameText(head, right)
  const plan = planChoices({ answer: right, accepted: [right], isLanguage, entries: isWord ? entries : [], head: isWord ? head : '', meaning: isWord ? meaning : '', pos: isWord ? posOf(card.front, card.back) : '', ai: { choices: q.choices, answerIdx: q.answerIdx }, hintSeen: false, typedSeen: true })
  const g = isWord ? { _guard: guardOf(meaning, head, entries) } : {}
  if (!plan || plan.loose) return isWord ? { ...q, ...g } : q
  const sh = shuffleChoices(plan.choices, plan.answerIdx, rnd)
  return { ...q, choices: sh.choices, answerIdx: sh.answerIdx, spare: plan.spare || [], from: plan.kind, ...g }
}
// Only what the guard reads (word and meaning per pool card).
const guardOf = (meaning, head, entries) => ({ meaning, head, entries: (entries || []).filter((e) => e && e.word && e.meaning).map((e) => ({ word: e.word, meaning: e.meaning })) })
const sameText = (a, b) => String(a).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim() === String(b).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()
// Every question of a run, each with its own card (`cardOf(q)`).
export const withPoolChoicesAll = (qs, { cardOf, ...opts }) => (Array.isArray(qs) ? qs.map((q) => withPoolChoices(q, { ...opts, card: cardOf ? cardOf(q) : null })) : qs)
