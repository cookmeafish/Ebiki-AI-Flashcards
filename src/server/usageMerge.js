// Adds a batch of usage reports to logs/token-usage.json's totals (the /api/usage POST in vite.config.js). Pure, tested
// (usageMerge.test.js). Besides the totals per model it keeps:
//   byJob[job]["provider|model"] = { input, output, calls, last }   so Settings can show an HONEST cost per use per
//                                                                   task from the learner's own calls
//   byDay[YYYY-MM-DD]["provider|model"] = { input, output, calls }  the last DAYS_KEPT days, for "about $X a day"
// Counts are read through n() (a hand-edited "5" + 3 once made "53"). Unknown or junk ids are skipped.

export const DAYS_KEPT = 60
const PROVIDER_RE = /^[a-z]{2,20}$/
const JOB_RE = /^[a-z]+\.[A-Za-z]+$/
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/

const n = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Math.round(Number(v)) : 0)
const add = (r, u) => ({ input: n(r?.input) + n(u.input), output: n(r?.output) + n(u.output), calls: n(r?.calls) + 1 })

// `today` = the server's local date (YYYY-MM-DD), `now` = ms, both passed in (tests, one clock per batch).
export function mergeUsage(cur, batch, { today, now = Date.now() } = {}) {
  const out = { ...cur, byModel: { ...(cur?.byModel || {}) } }
  if (cur?.byJob && typeof cur.byJob === 'object') out.byJob = { ...cur.byJob }
  if (cur?.byDay && typeof cur.byDay === 'object') out.byDay = { ...cur.byDay }
  for (const u of (Array.isArray(batch) ? batch : []).slice(0, 5000)) {
    if (!u || typeof u.provider !== 'string' || !PROVIDER_RE.test(u.provider)) continue
    const model = String(u.model || '').slice(0, 120)
    const key = `${u.provider}|${model}`
    const r = out.byModel[key] || { provider: u.provider, model, input: 0, output: 0, calls: 0 }
    out.byModel[key] = { ...r, ...add(r, u) }
    if (typeof u.job === 'string' && JOB_RE.test(u.job)) {
      out.byJob = out.byJob || {}
      const j = { ...(out.byJob[u.job] || {}) }
      j[key] = { ...add(j[key], u), last: now }
      out.byJob[u.job] = j
    }
    if (typeof today === 'string' && DAY_RE.test(today)) {
      out.byDay = out.byDay || {}
      const d = { ...(out.byDay[today] || {}) }
      d[key] = add(d[key], u)
      out.byDay[today] = d
    }
  }
  if (out.byDay) {
    const days = Object.keys(out.byDay).filter((d) => DAY_RE.test(d)).sort()
    for (const d of days.slice(0, Math.max(0, days.length - DAYS_KEPT))) delete out.byDay[d]
  }
  return out
}
