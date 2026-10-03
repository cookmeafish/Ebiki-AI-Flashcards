// Reads what the app has observed (the app-wide learner context, ctx.learning.context) and, when it is enough,
// asks the model for a level on the learner scale. Platform-neutral (only ctx). Used by Legends ("Use what Ebiki
// knows") and by the learner feature, which gives a level to a learner who never took the placement exam.
import { summarizeEvidence, buildEvidenceLevelPrompt, parseEvidenceLevel, EVIDENCE_ROLE, EVIDENCE_MAX_TOKENS } from './evidence'
import { bandsFor, LEVEL_MAX } from './learner'

// { ok, sum, snap }. ok:false only when the context could not be gathered at all; a deck that could not be read is
// ok:true with sum.deckFailed (the other evidence still counts).
export async function readEvidence(ctx, { fresh = false } = {}) {
  let snap = null
  try { snap = await ctx?.learning?.context?.({ fresh }) } catch { snap = null }
  if (!snap) return { ok: false, sum: null, snap: null, error: 'read' }
  return { ok: true, sum: summarizeEvidence(snap), snap, deck: snap.deck?.name || '' }
}

// { level, confidence, strengths, gaps, why, sum } or { error: 'read' | 'thin' | 'nokey' | 'parse' | <message>, sum }.
// `fresh` (default) gathers everything again at the moment of the call: the learner just clicked.
export async function judgeLevelFromEvidence(ctx, { selfRating = 0, fresh = true, evidence = null } = {}) {
  if (!ctx.ai?.hasKey) return { error: 'nokey', sum: evidence?.sum || null }
  const ev = evidence?.ok && evidence.snap ? evidence : await readEvidence(ctx, { fresh })
  if (!ev.ok) return { error: 'read', sum: null }
  if (!ev.sum.enough) return { error: 'thin', sum: ev.sum }
  const p = buildEvidenceLevelPrompt(ctx.subject, ev.snap, { bands: bandsFor(ctx.subject.isLanguage), levelMax: LEVEL_MAX, selfRating, sum: ev.sum })
  try {
    const text = await ctx.ai.call(p.system, p.user, { role: EVIDENCE_ROLE, maxTokens: EVIDENCE_MAX_TOKENS, silent: true })
    const r = parseEvidenceLevel(ctx.ai.json(text), ctx.ai.clean, LEVEL_MAX, { cautious: ev.sum.cautious })
    return r ? { ...r, sum: ev.sum } : { error: 'parse', sum: ev.sum }
  } catch (e) {
    return { error: String(e?.message || e), sum: ev.sum }
  }
}
