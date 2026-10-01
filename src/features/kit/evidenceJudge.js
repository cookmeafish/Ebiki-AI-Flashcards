// Reads what the app has observed (ctx.learning.evidence) and, when it is enough, asks the model for a level on the
// learner scale. Platform-neutral (only ctx). Used by Legends ("Use what Ebiki knows") and by the learner feature,
// which gives a level to a learner who never took the placement exam.
import { summarizeEvidence, buildEvidenceLevelPrompt, parseEvidenceLevel, EVIDENCE_ROLE, EVIDENCE_MAX_TOKENS } from './evidence'
import { bandsFor, LEVEL_MAX } from './learner'

// { ok, sum } (sum = summarizeEvidence) or { ok:false } when the deck could not be read.
export async function readEvidence(ctx) {
  const raw = await ctx.learning?.evidence?.()
  if (!raw || raw.ok === false) return { ok: false, sum: null, error: raw?.error || 'read' }
  return { ok: true, sum: summarizeEvidence(raw), deck: raw.deck }
}

// { level, confidence, strengths, gaps, why, sum } or { error: 'read' | 'thin' | 'nokey' | 'parse' | <message>, sum }.
export async function judgeLevelFromEvidence(ctx, { selfRating = 0, evidence = null } = {}) {
  if (!ctx.ai?.hasKey) return { error: 'nokey', sum: evidence?.sum || null }
  const ev = evidence?.ok ? evidence : await readEvidence(ctx)
  if (!ev.ok) return { error: 'read', sum: null }
  if (!ev.sum.enough) return { error: 'thin', sum: ev.sum }
  const p = buildEvidenceLevelPrompt(ctx.subject, ev.sum, { bands: bandsFor(ctx.subject.isLanguage), levelMax: LEVEL_MAX, selfRating })
  try {
    const text = await ctx.ai.call(p.system, p.user, { role: EVIDENCE_ROLE, maxTokens: EVIDENCE_MAX_TOKENS, silent: true })
    const r = parseEvidenceLevel(ctx.ai.json(text), ctx.ai.clean, LEVEL_MAX)
    return r ? { ...r, sum: ev.sum } : { error: 'parse', sum: ev.sum }
  } catch (e) {
    return { error: String(e?.message || e), sum: ev.sum }
  }
}
