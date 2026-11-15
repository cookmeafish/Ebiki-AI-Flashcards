// HOW IMPORTANT IS EACH ACRONYM (the owner: "order it by most used and known acronyms and less known. knowing most of
// the main ones is most likely enough"). Measured from the course's own sources, never guessed:
//   outline: the exam outline names it, by its letters or spelled out
//   uses:    how many course cards use it, the same way
// Tiers: 'must' = named in the outline or used in MUST_USES+ cards (nothing the outline names is ever lower);
// 'good' = used in 1 to MUST_USES-1 cards; 'rare' = used in no lesson. Pure and deterministic (acronymRank.test.js).
// Ships only `tier` and `uses`, never outline text. Design: docs/plans/2026-11-15-acronym-tiers.md.

export const MUST_USES = 3
export const TIERS = ['must', 'good', 'rare']

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const norm = (s) => String(s || '').toLowerCase().replace(/[-_/]+/g, ' ').replace(/\s+/g, ' ')

// A matcher for one acronym and its meanings: the letters case-sensitively and word-bounded, a plural or possessive
// allowed ("APs", "CA's"); a two-letter acronym only as "(XX)" or beside its spelled-out form (alone, "IR" or "AP" hit
// every second sentence); any meaning spelled out, case-insensitively, spaces and hyphens normalized, plural allowed.
export function acronymMatcher(acronym, expansions = []) {
  const letters = new RegExp(`(^|[^A-Za-z0-9])${esc(acronym)}(?:s|'s)?([^A-Za-z0-9]|$)`)
  const paren = new RegExp(`\\(${esc(acronym)}(?:s)?\\)`)
  const spelled = expansions.filter(Boolean).map((e) => new RegExp(`(^|[^a-z0-9])${esc(norm(e))}s?([^a-z0-9]|$)`))
  const short = acronym.replace(/[^A-Za-z0-9]/g, '').length <= 2
  return (text) => {
    const t = String(text || '')
    const s = spelled.some((r) => r.test(norm(t)))
    if (s) return true
    return short ? paren.test(t) : letters.test(t)
  }
}

// rank([{ acronym, expansions, at }], { outline, cards }) → the same entries with { tier, uses, outline } added, in
// TIER ORDER: tier, outline first, uses (most first), first appearance (`at`), then the letters.
// `core`: acronyms a reviewer judged foundational for the field although the cards rarely use them (TCP/IP-like basics;
// dev/careers/acronym-core.json, a reason each): they join the top tier, after the measured ones. Judgment of the field,
// never a claim about what an exam asks.
export function rankAcronyms(list, { outline = '', cards = [], core = [] } = {}) {
  const lines = String(outline).split(/\r?\n/)
  const picked = new Set(core)
  const ranked = (list || []).map((x) => {
    const hit = acronymMatcher(x.acronym, x.expansions)
    const inOutline = lines.some(hit)
    const uses = cards.filter(hit).length
    const measured = inOutline || uses >= MUST_USES
    const tier = measured || picked.has(x.acronym) ? 'must' : uses > 0 ? 'good' : 'rare'
    return { ...x, tier, uses, outline: inOutline, core: !measured && tier === 'must' }
  })
  return ranked.sort((a, b) => TIERS.indexOf(a.tier) - TIERS.indexOf(b.tier)
    || (a.core - b.core) || (b.outline - a.outline) || (b.uses - a.uses)
    || ((a.at ?? Infinity) - (b.at ?? Infinity)) || a.acronym.localeCompare(b.acronym))
}
