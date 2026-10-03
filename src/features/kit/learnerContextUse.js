// The learner context (kit/learnerContext.js) as each CONSUMER needs it (pure, tested): which sections, how many
// characters, under which heading, and with what kept out. Consumers never gather: they take the snapshot App
// remembers (`ctx.learning.cached()`, refreshed in the background) and get '' when there is none, so a missing
// context never blocks or breaks anything.
//
// Two guards every consumer goes through:
// - MODE: a snapshot gathered for one mode never lands in another mode's prompt (`snap.modeId` must match).
// - SECRECY: what a question on screen asks for is kept out (`redactSnapshot`): cards whose front is the live card,
//   any line holding a live answer, and, while a feature quiz, fight, raid or exam runs (`secret`), every card list,
//   card meaning and feature section (a raid asks the deck's own cards).
import { formatLearnerContext, clip, LC } from './learnerContext'

// Budget = characters of the body (the heading comes on top). Section order = priority (the formatter cuts the tail).
export const CONTEXT_USES = {
  help: {
    budget: 2500,
    sections: ['deck', 'study', 'weak', 'topics', 'practice', 'discover', 'extra', 'studied'],
    header: 'WHAT EBIKI KNOWS ABOUT THE LEARNER IN THIS MODE (gathered from their deck, study sessions, chats and practice; background facts to personalize your help, never a list to read out):',
  },
  chat: {
    budget: 2000,
    sections: ['level', 'slips', 'study', 'deck', 'weak', 'topics', 'practice', 'discover', 'new'],
    header: 'WHAT EBIKI KNOWS ABOUT THIS LEARNER IN THIS SUBJECT (from their cards, study sessions, earlier chats and practice). Use it to pitch explanations and pick examples; bring it up only when it helps:',
  },
  question: {
    budget: 600,
    sections: ['level', 'study', 'slips'],
    header: 'WHAT EBIKI KNOWS ABOUT THIS LEARNER (use it ONLY to pitch the wording around the answer; it never changes what is asked or the answer, and is never mentioned in a question):',
  },
  practice: {
    budget: 800,
    sections: ['study', 'weak', 'slips', 'topics', 'practice', 'discover', 'deck'],
    header: 'What Ebiki knows about this learner (background to pitch the activity; never read it out):',
  },
}

// Accent, case and spacing blind, for comparing fronts and answers.
export const foldText = (s) => String(s ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[’‘ʼ`´]/g, "'").replace(/\s+/g, ' ').trim()
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// The headword forms of a card front: "perro (n)" → perro; "el/la estudiante" → "el/la estudiante", la estudiante.
export function headForms(front) {
  const base = foldText(String(front ?? '').replace(/\([^)]*\)/g, ' ').replace(/\[[^\]]*\]/g, ' '))
  if (!base) return []
  // Split pieces need 3+ letters ("el/la estudiante" must not hide every line holding "el"); the whole front stays.
  const pieces = base.split(/\s*[/,;]\s*/).map((x) => x.trim()).filter((x) => x.length >= 3)
  return [...new Set([base, ...pieces].filter((x) => x.length >= 2))]
}

// Does `text` hold `answer` as a whole word (or phrase)? One-letter answers never count (every text has them).
export function holdsAnswer(text, answer) {
  const a = foldText(answer)
  if (a.length < 2) return false
  // Scripts written without spaces: a substring is the only test there is.
  if (/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Thai}]/u.test(a)) return foldText(text).includes(a)
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRe(a)}($|[^\\p{L}\\p{N}])`, 'u').test(foldText(text))
}

// A copy of the snapshot with the secret parts left out.
//   hideFronts: fronts of the live card(s) (a card with the same headword is dropped from every list)
//   hideAnswers: the live question's answers (any card, slip, chat line or note holding one is dropped)
//   reveals(text): the app's own fuzzy check (inflections), on top of the whole-word one
//   secret: a feature question runs (quiz, boss, raid, placement): no card lists, meanings or feature sections
export function redactSnapshot(snap, { hideFronts = [], hideAnswers = [], reveals = null, secret = false } = {}) {
  if (!snap) return snap
  const fronts = new Set(hideFronts.flatMap(headForms))
  const answers = hideAnswers.map((a) => String(a ?? '')).filter((a) => foldText(a).length >= 2)
  const leaks = (text) => {
    const t = String(text ?? '')
    if (!t) return false
    if (answers.some((a) => holdsAnswer(t, a))) return true
    try { return typeof reveals === 'function' && !!reveals(t) } catch { return false }
  }
  if (!fronts.size && !answers.length && !reveals && !secret) return snap
  const cardOk = (c) => !headForms(c.front).some((f) => fronts.has(f)) && !leaks(c.front) && !leaks(c.back)
  const deck = snap.deck?.ok
    ? { ...snap.deck, sampleStudied: secret ? [] : snap.deck.sampleStudied.filter(cardOk), sampleNew: secret ? [] : snap.deck.sampleNew.filter(cardOk) }
    : snap.deck
  const profile = snap.discover?.profile
  return {
    ...snap,
    deck,
    slips: { ...snap.slips, items: (snap.slips?.items || []).filter((x) => !leaks(x)) },
    chats: {
      ...snap.chats,
      items: (snap.chats?.items || []).map((c) => ({ ...c, title: leaks(c.title) ? '' : c.title, learner: c.learner.filter((l) => !leaks(l)), ebi: c.ebi.filter((l) => !leaks(l)) })),
    },
    discover: { ...snap.discover, profile: profile && !leaks(profile.summary) ? profile : null },
    practice: { ...snap.practice, recent: (snap.practice?.recent || []).filter((x) => !leaks(x)) },
    extra: secret ? [] : (snap.extra || []).map((x) => ({ ...x, text: String(x.text || '').split('\n').filter((l) => !leaks(l)).join('\n') })),
  }
}

// Is this snapshot for that mode? (Ids compare as strings: one saved as "5" is still mode 5.)
export const snapshotForMode = (snap, modeId) => (snap && modeId != null && String(snap.modeId ?? '') === String(modeId) ? snap : null)

// The block for one consumer ('' when there is no snapshot for that mode, or nothing to say).
// opts: the redaction options above, plus `omit` (sections the prompt already has), `budget`, `sections`.
export function learnerContextFor(snap, modeId, use, opts = {}) {
  const s = snapshotForMode(snap, modeId)
  const u = CONTEXT_USES[use]
  if (!s || !u) return ''
  try {
    const omit = new Set(opts.omit || [])
    const sections = (opts.sections || u.sections).filter((x) => !omit.has(x))
    const body = formatLearnerContext(redactSnapshot(s, opts), { budget: opts.budget ?? u.budget, sections })
    return body ? `${u.header}\n${body}` : ''
  } catch { return '' }
}

// Through the feature context (practice features, anything with `ctx`): the remembered snapshot of the ACTIVE mode,
// never waited for. '' when there is none yet (the first call starts the background read).
export function learnerContextText(ctx, use = 'practice', opts = {}) {
  try { return learnerContextFor(ctx?.learning?.cached?.(), ctx?.subject?.modeId, use, opts) } catch { return '' }
}

// Discover's profile evidence from the snapshot, for the parts it used to read itself (scheduling, chat topics),
// plus what it never had (study sessions, slips). null when the snapshot is not for this mode AND this deck, or the
// deck could not be read (Discover then reads on its own, as before).
export function discoverEvidence(snap, { modeId, deck } = {}) {
  const s = snapshotForMode(snap, modeId)
  if (!s || !s.deck?.ok || !deck || s.deck.name !== deck) return null
  const d = s.deck
  const mastery = d.total
    ? `Scheduling: ${d.total} cards: about ${d.mature} mature (interval>=21d), about ${d.young} learning, ${d.new} new. About ${d.struggling} have lapsed ${LC.struggleLapses}+ times (struggle).`
    : ''
  const chats = s.chats.ok ? s.chats.items.map((c) => c.title).filter(Boolean) : null
  const study = s.study.ok && s.study.sessions
    ? `Study sessions in Ebiki: ${s.study.sessions} (${s.study.cards} cards, ${s.study.answers} graded answers${s.study.accuracy != null ? `, ${s.study.accuracy}% right` : ''}).`
    : ''
  const slips = s.slips.items.length ? `Recurring mistakes logged while studying:\n${s.slips.items.slice(0, 8).map((x) => `- ${clip(x, 120)}`).join('\n')}` : ''
  return { mastery, chatCount: chats ? s.chats.count : null, chatTitles: chats || [], study, slips }
}
