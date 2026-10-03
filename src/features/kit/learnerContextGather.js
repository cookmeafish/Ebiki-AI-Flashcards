// Gathers the raw parts of the learner context (kit/learnerContext.js) through readers the app passes in, so it is
// platform-neutral and tested with mocks. App wires it to the card store, its study history, the chat list and the
// stores (`ctx.learning.context`). Every part is read on its own: one that fails is marked ok:false and the others
// still count (a closed Anki never hides the study sessions and chats).
import { LC, batches, spread, buildLearnerSnapshot, readFeatureSources } from './learnerContext'

const settle = async (fn, fallback) => { try { return await fn() } catch (e) { return { ...fallback, ok: false, error: String(e?.message || e), code: e?.code || '' } } }
// The card store's own "not reachable" codes (src/cards/anki: notRunning, timeout, closed) or no local service at all.
const DOWN_CODES = new Set(['notRunning', 'timeout', 'timeoutChange', 'closed'])

// r = {
//   modeId, modeName, isLanguage, deck,
//   cards: { findCards(query) → ids, cardsInfo(ids) → infos, text(info) → { front, back } } | null,
//   cardsDown?: () => bool (the app already knows the card store is not answering),
//   history: () → [entry] (this mode's study sessions, newest first),
//   slips: () → [{ text, n }],
//   chats: { list() → [{ id, title, mode, date }], load(id) → { title, messages, date } },
//   profile: () → { summary, level } | null,
//   level: async () → { ok, value, line },
//   practice: async () → { ok, items },
//   ctx (for the feature sources),
// }
export async function gatherLearnerContext(r) {
  const deckName = String(r.deck || '')
  const deck = await settle(async () => {
    if (!deckName || !r.cards) return { ok: true, name: deckName, total: 0, newTotal: 0, studied: [], fresh: [] }
    const all = (await r.cards.findCards({ deck: deckName })) || []
    const newIds = (await r.cards.findCards({ deck: deckName, state: 'new' })) || []
    const isNew = new Set(newIds)
    const studiedIds = all.filter((id) => !isNew.has(id))
    // Bounded on any deck size: a spread sample of each kind, read in batches.
    const pick = [...spread(studiedIds, LC.sampleStudied), ...spread(newIds, LC.sampleNew)]
    const infos = []
    for (const b of batches(pick)) infos.push(...((await r.cards.cardsInfo(b)) || []))
    const card = (c) => {
      const { front, back } = r.cards.text(c)
      return { front, back, interval: c?.interval, lapses: c?.lapses, reps: c?.reps, factor: c?.factor, type: c?.type }
    }
    const studied = []
    const fresh = []
    for (const c of infos) (isNew.has(c?.cardId) ? fresh : studied).push(card(c))
    return { ok: true, name: deckName, total: all.length, newTotal: newIds.length, studied, fresh }
  }, { name: deckName })
  if (deck.ok === false) {
    const code = String(deck.code || '')
    deck.unreachable = !!(r.cardsDown?.() || DOWN_CODES.has(code))
  }
  const study = await settle(async () => ({ ok: true, sessions: (await r.history?.()) || [] }), {})
  const slips = await settle(async () => ({ ok: true, items: (await r.slips?.()) || [] }), {})
  const chats = await settle(async () => {
    if (!r.chats) return { ok: true, total: 0, items: [] }
    const list = ((await r.chats.list()) || []).filter((s) => s && s.mode === r.modeName)
    const recent = list.slice(0, LC.chats)
    const loaded = await Promise.all(recent.map(async (s) => {
      try { const c = await r.chats.load(s.id); return c ? { title: c.title || s.title, date: c.date || s.date, messages: c.messages } : null } catch { return null }
    }))
    return { ok: true, total: list.length, items: loaded.filter(Boolean) }
  }, {})
  const discover = await settle(async () => ({ ok: true, profile: (await r.profile?.()) || null }), {})
  const level = await settle(async () => (await r.level?.()) || { ok: true, value: null }, {})
  const practice = await settle(async () => (await r.practice?.()) || { ok: true, items: [] }, {})
  const extra = await settle(async () => ({ ok: true, list: await readFeatureSources(r.ctx, r.modeId) }), { list: [] })
  return buildLearnerSnapshot({ modeId: r.modeId, modeName: r.modeName, isLanguage: r.isLanguage, deck, study, slips, chats, discover, level, practice, extra: extra.list || [] })
}
