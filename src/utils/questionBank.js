// Question reuse (opt-in: config `questionReuse` = { enabled, maxPerCard }). OFF (the default) means off:
// no bank is read or written and every card gets a fresh generation, exactly as before. ON: the question
// sets generated for a card are saved with the card's DECK (/api/question-bank, one file per note under
// decks/<deck>/questions/) until the card holds `maxPerCard` questions; after that a review asks a saved set
// again instead of paying for a new one.
//
// Each saved set carries two keys:
//   text = the card's front + back (minus the pronunciation audio Ebiki embeds on first play, which is not
//          content): an EDITED card drops every old set on the next save and gets fresh questions.
//   sig  = the settings that shape the questions (kind, learned language, "Ebi speaks", typed vs multiple
//          choice, word hints, questions per card, dialect): only sets with the same sig are asked, but sets
//          under another sig are KEPT (one deck studied from two modes keeps both modes' questions).
// Question-style preferences are NOT part of sig: they are added often, and each would retire every saved
// question; "Clear saved questions" (per deck) applies them.
//
// Pure helpers here; the fetches are thin wrappers at the bottom.

export const QUESTION_REUSE_DEFAULT = { enabled: false, maxPerCard: 10 }
export const REUSE_MIN = 1
export const REUSE_MAX = 50
const MAX_SETS_PER_CARD = 40 // across every sig, newest kept: a file can't grow without bound

export function reuseSettings(raw) {
  const r = raw && typeof raw === 'object' ? raw : {}
  const n = Math.round(Number(r.maxPerCard))
  return {
    enabled: r.enabled === true,
    maxPerCard: Number.isFinite(n) ? Math.min(REUSE_MAX, Math.max(REUSE_MIN, n)) : QUESTION_REUSE_DEFAULT.maxPerCard,
  }
}

// Short, stable hash (FNV-1a, 32-bit) as hex.
export function hashText(s) {
  let h = 0x811c9dc5
  const str = String(s ?? '')
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0 }
  return h.toString(16).padStart(8, '0')
}

// The card's content as far as questions are concerned. Playing 🔊 embeds "[sound:ebiki-…]" and a
// "🔊 Author · License" credit line into the back; counted, the first play retired the card's questions.
export function cardTextKey(front = '', back = '') {
  const clean = (s) => String(s ?? '').replace(/\[sound:[^\]]*\]/g, '').split('\n').map((l) => l.trim()).filter((l) => l && !/^🔊/u.test(l)).join('\n')
  return hashText(JSON.stringify([clean(front), clean(back)]))
}

// { text, sig } for a card and the settings a generation would use. `style` = anything else that changes the
// questions' words (App passes the mode's dialect).
export function questionSignature({ kind = 'flash', front = '', back = '', learnLang = '', quizLang = '', choices = false, wordHints = false, perCard = 0, style = '' }) {
  return {
    text: cardTextKey(front, back),
    sig: hashText(JSON.stringify([kind, String(learnLang).toLowerCase(), String(quizLang).toLowerCase(), !!choices, !!wordHints, kind === 'pbq' ? 1 : Number(perCard) || 0, String(style)])),
  }
}

const setsOf = (bank) => (bank && Array.isArray(bank.sets) ? bank.sets.filter((s) => s && Array.isArray(s.questions) && s.questions.length) : [])
const matching = (bank, key) => setsOf(bank).filter((s) => s.text === key.text && s.sig === key.sig)
export const savedQuestionCount = (bank, key) => matching(bank, key).reduce((n, s) => n + s.questions.length, 0)

// The set to ask again, or null when a NEW generation is due. New ones are generated until adding one
// more set would pass the cap (so the saved total stays at or under maxPerCard; a cap below one set's
// size still keeps that first set). Among the saved sets the least recently asked goes first, so they
// rotate instead of one repeating.
export function pickSavedSet(bank, key, setSize, maxPerCard) {
  const sets = matching(bank, key)
  if (!sets.length) return null
  const have = sets.reduce((n, s) => n + s.questions.length, 0)
  if (have + Math.max(1, setSize) <= maxPerCard) return null
  return [...sets].sort((a, b) => (a.lastAsked || 0) - (b.lastAsked || 0) || (a.createdAt || 0) - (b.createdAt || 0))[0]
}

// A new bank with `questions` added as a set. Sets for an older version of the card's text are dropped
// (they can never match again); sets for other settings stay (see the header), newest MAX_SETS_PER_CARD.
export function addSet(bank, key, questions, now = Date.now()) {
  const keep = setsOf(bank).filter((s) => s.text === key.text)
  const sets = [...keep, { id: `${now.toString(36)}${Math.random().toString(36).slice(2, 6)}`, text: key.text, sig: key.sig, questions, createdAt: now, lastAsked: now }]
  return { v: 2, sets: sets.slice(-MAX_SETS_PER_CARD) }
}

export function markAsked(bank, setId, now = Date.now()) {
  return { v: 2, sets: setsOf(bank).map((s) => (s.id === setId ? { ...s, lastAsked: now } : s)) }
}

// "Fix question" rewrote one question: the saved copy is fixed too, or the broken one would come back.
export function replaceQuestion(bank, setId, qi, question) {
  return { v: 2, sets: setsOf(bank).map((s) => (s.id === setId && qi >= 0 && qi < s.questions.length ? { ...s, questions: s.questions.map((q, i) => (i === qi ? question : q)) } : s)) }
}

// Saved copies carry what the card state needs to ask them again, never session state (answers, grades).
export const storableQuestion = (q) => {
  if (!q || typeof q !== 'object') return q
  const { question, type, hint1, hint2, acceptedAnswers, glosses, pose, choices, answerIdx, pbq } = q
  return { question, type, hint1, hint2, acceptedAnswers, glosses, pose, choices, answerIdx, ...(pbq ? { pbq } : {}) }
}

// A reused multiple-choice question gets its options in a new order (the right answer must not sit in
// the same slot every time it comes back). Anything without a valid answerIdx is returned unchanged.
export function reshuffleChoices(q, rng = Math.random) {
  if (!q || !Array.isArray(q.choices) || q.choices.length < 2) return q
  const ai = q.answerIdx
  if (!Number.isInteger(ai) || ai < 0 || ai >= q.choices.length) return q
  const order = q.choices.map((_, i) => i)
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [order[i], order[j]] = [order[j], order[i]] }
  return { ...q, choices: order.map((i) => q.choices[i]), answerIdx: order.indexOf(ai) }
}

// ── Server ─────────────────────────────────────────────────────────────────────────────────────────
const qs = (deck, noteId) => `deck=${encodeURIComponent(deck)}${noteId != null ? `&note=${encodeURIComponent(noteId)}` : ''}`

// { ok, bank }: ok:false = could not read (a save would then replace sets we never saw, so callers skip it).
export async function loadBank(deck, noteId) {
  try {
    const r = await fetch(`/api/question-bank?${qs(deck, noteId)}`)
    if (!r.ok) return { ok: false, bank: null }
    const d = await r.json()
    return { ok: true, bank: d && d.bank && typeof d.bank === 'object' ? d.bank : null }
  } catch { return { ok: false, bank: null } }
}

export async function saveBank(deck, noteId, bank) {
  try {
    const r = await fetch(`/api/question-bank?${qs(deck, noteId)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bank }),
    })
    return r.ok
  } catch { return false }
}

// One deck's saved questions, its subdecks included. { ok, removed }.
export async function clearBank(deck) {
  try {
    const r = await fetch(`/api/question-bank?${qs(deck)}`, { method: 'DELETE' })
    const d = await r.json().catch(() => null)
    return r.ok && d ? { ok: true, removed: d.removed || 0 } : { ok: false }
  } catch { return { ok: false } }
}

// ── The decision, with its I/O injected (App wires the live setting + clear counter; tests pass fakes) ──
// OFF means off: with the setting off (or the card has no note/deck, or it is a relearn copy) this calls
// generate() and NOTHING else, no read and no write. Every write re-checks the live setting (switched off
// mid-generation = nothing saved) and the clear counter (a clear during generation must not write back the
// sets read before it). A failed read never saves: it would replace sets it never saw. The give-up fallback
// set (`_fallback`) is never saved. Returned questions carry `_bank` for "Fix question".
export function createQuestionReuse({ getSettings, getEpoch = () => 0, load = loadBank, save = saveBank, log = () => {} }) {
  const on = () => reuseSettings(getSettings()).enabled
  return async function withQuestionReuse(card, sigParts, setSize, generate) {
    const cfg = reuseSettings(getSettings())
    const noteId = card?.note
    const deck = typeof card?.deckName === 'string' ? card.deckName : ''
    if (!cfg.enabled || noteId == null || !deck || card?._relearn) return generate()
    const key = questionSignature(sigParts)
    const epoch = getEpoch()
    const mayWrite = () => on() && getEpoch() === epoch
    const isPbq = sigParts?.kind === 'pbq'
    const read = await load(deck, noteId)
    if (read.ok && on()) {
      const set = pickSavedSet(read.bank, key, setSize, cfg.maxPerCard)
      if (set) {
        if (mayWrite()) save(deck, noteId, markAsked(read.bank, set.id)) // rotation only; fail-soft
        log('reuse', noteId)
        return set.questions.map((q, qi) => ({ ...(isPbq ? q : reshuffleChoices(q)), _bank: { noteId, deck, setId: set.id, qi } }))
      }
    }
    const fresh = await generate()
    if (!read.ok || !Array.isArray(fresh) || !fresh.length || fresh.some((q) => q?._fallback) || !mayWrite()) return fresh
    const bank = addSet(read.bank, key, isPbq ? fresh : fresh.map(storableQuestion)) // a PBQ is saved whole
    const setId = bank.sets[bank.sets.length - 1].id
    save(deck, noteId, bank)
    return fresh.map((q, qi) => ({ ...q, _bank: { noteId, deck, setId, qi } }))
  }
}
