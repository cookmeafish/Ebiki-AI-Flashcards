// Token and cost tracking. providers.js reports every successful request's token counts (setUsageListener);
// this module keeps the running totals for THIS window's session, and batches each report to the dev server
// (/api/usage), which keeps the all-time totals for this computer in one file, so the app window, a browser tab
// and the capture overlay all add to the same numbers.

// List prices in US dollars per MILLION tokens, [input, output]. Estimates only: providers change prices, bill
// cached input and long prompts differently, and the provider's own bill is the real number. A model that
// matches nothing here has NO price: its tokens are counted and shown as unpriced, never guessed.
// Order matters: the first pattern that matches wins (specific ids before the family).
export const PRICE_TABLE = [
  // Anthropic
  // Opus prices changed between versions: only the versions whose price is known (a newer one stays unpriced).
  { provider: 'anthropic', re: /claude-opus-4-5/, price: [5, 25] },
  { provider: 'anthropic', re: /claude-opus-4-1|claude-opus-4-0|claude-opus-4-2025|claude-opus-4$|claude-3-opus/, price: [15, 75] },
  { provider: 'anthropic', re: /claude-sonnet-4|claude-3-7-sonnet|claude-3-5-sonnet/, price: [3, 15] },
  { provider: 'anthropic', re: /claude-haiku-4/, price: [1, 5] },
  { provider: 'anthropic', re: /claude-3-5-haiku/, price: [0.8, 4] },
  { provider: 'anthropic', re: /claude-3-haiku/, price: [0.25, 1.25] },
  // OpenAI
  { provider: 'openai', re: /^gpt-5-nano(-\d{4}-\d\d-\d\d)?$/, price: [0.05, 0.4] },
  { provider: 'openai', re: /^gpt-5-mini(-\d{4}-\d\d-\d\d)?$/, price: [0.25, 2] },
  { provider: 'openai', re: /^gpt-5(-\d{4}-\d\d-\d\d)?$/, price: [1.25, 10] },
  { provider: 'openai', re: /^gpt-4\.1-nano/, price: [0.1, 0.4] },
  { provider: 'openai', re: /^gpt-4\.1-mini/, price: [0.4, 1.6] },
  { provider: 'openai', re: /^gpt-4\.1/, price: [2, 8] },
  { provider: 'openai', re: /^gpt-4o-mini/, price: [0.15, 0.6] },
  { provider: 'openai', re: /^(gpt-4o|chatgpt-4o)/, price: [2.5, 10] },
  { provider: 'openai', re: /^gpt-4-turbo/, price: [10, 30] },
  { provider: 'openai', re: /^gpt-4(-\d{4})?$/, price: [30, 60] },
  { provider: 'openai', re: /^gpt-3\.5-turbo/, price: [0.5, 1.5] },
  { provider: 'openai', re: /^o4-mini/, price: [1.1, 4.4] },
  { provider: 'openai', re: /^o3-mini/, price: [1.1, 4.4] },
  { provider: 'openai', re: /^o3(-\d{4}-\d\d-\d\d)?$/, price: [2, 8] },
  { provider: 'openai', re: /^o1-mini/, price: [1.1, 4.4] },
  { provider: 'openai', re: /^o1(-\d{4}-\d\d-\d\d)?$/, price: [15, 60] },
  // Google
  { provider: 'gemini', re: /^gemini-2\.5-flash-lite/, price: [0.1, 0.4] },
  { provider: 'gemini', re: /^gemini-2\.5-flash/, price: [0.3, 2.5] },
  { provider: 'gemini', re: /^gemini-2\.5-pro/, price: [1.25, 10] },
  { provider: 'gemini', re: /^gemini-2\.0-flash-lite/, price: [0.075, 0.3] },
  { provider: 'gemini', re: /^gemini-2\.0-flash/, price: [0.1, 0.4] },
  { provider: 'gemini', re: /^gemini-1\.5-flash/, price: [0.075, 0.3] },
  { provider: 'gemini', re: /^gemini-1\.5-pro/, price: [1.25, 5] },
  // xAI
  { provider: 'grok', re: /^grok-4-fast|^grok-4-1-fast/, price: [0.2, 0.5] },
  { provider: 'grok', re: /^grok-code-fast/, price: [0.2, 1.5] },
  { provider: 'grok', re: /^grok-3-mini-fast/, price: [0.6, 4] },
  { provider: 'grok', re: /^grok-3-mini/, price: [0.3, 0.5] },
  { provider: 'grok', re: /^grok-3-fast/, price: [5, 25] },
  { provider: 'grok', re: /^grok-(3|4)(-\d{4})?$|^grok-4-\d{4}/, price: [3, 15] },
]

// Prices the user typed (the counter panel, "Set price"), keyed "provider|model": a model newer than this table
// has no built-in price, and guessing one would be worse than asking. They win over the table.
export const priceKey = (provider, model) => `${provider}|${model}`
export const validPrice = (p) => Array.isArray(p) && p.length === 2 && p.every((v) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v < 10000)

// [input, output] per million tokens, or null when the model's price is not known.
export function priceFor(provider, model, prices = null) {
  const own = prices && prices[priceKey(provider, model)]
  if (validPrice(own)) return own
  const id = String(model || '').toLowerCase().replace(/^models\//, '')
  const hit = PRICE_TABLE.find((p) => p.provider === provider && p.re.test(id))
  return hit ? hit.price : null
}

// Dollars for one model's counts, or null when it has no known price.
export function costOf(provider, model, input, output, prices = null) {
  const p = priceFor(provider, model, prices)
  if (!p) return null
  return (Number(input) || 0) / 1e6 * p[0] + (Number(output) || 0) / 1e6 * p[1]
}

// { byModel: { "provider|model": { provider, model, input, output, calls } } } -> totals.
export function summarize(byModel, prices = null) {
  let input = 0, output = 0, calls = 0, cost = 0, unpricedTokens = 0
  const rows = []
  for (const r of Object.values(byModel || {})) {
    if (!r || typeof r !== 'object') continue
    const i = Number(r.input) || 0, o = Number(r.output) || 0
    const c = costOf(r.provider, r.model, i, o, prices)
    input += i; output += o; calls += Number(r.calls) || 0
    if (c === null) unpricedTokens += i + o; else cost += c
    rows.push({ provider: r.provider, model: r.model, input: i, output: o, calls: Number(r.calls) || 0, cost: c, ownPrice: !!(prices && validPrice(prices[priceKey(r.provider, r.model)])) })
  }
  rows.sort((a, b) => (b.input + b.output) - (a.input + a.output))
  return { input, output, tokens: input + output, calls, cost, unpricedTokens, rows }
}

export const addUsage = (byModel, u) => {
  const key = `${u.provider}|${u.model}`
  const cur = byModel[key] || { provider: u.provider, model: u.model, input: 0, output: 0, calls: 0 }
  byModel[key] = { ...cur, input: cur.input + (Number(u.input) || 0), output: cur.output + (Number(u.output) || 0), calls: cur.calls + 1 }
  return byModel
}

export const formatTokens = (n) => {
  const v = Number(n) || 0
  if (v >= 1e6) return `${(v / 1e6).toFixed(v >= 1e7 ? 1 : 2)}M`
  if (v >= 1e3) return `${(v / 1e3).toFixed(v >= 1e4 ? 0 : 1)}k`
  return String(v)
}
export const formatCost = (usd) => {
  const v = Number(usd) || 0
  if (v === 0) return '$0.00'
  if (v < 0.01) return `$${v.toFixed(4)}`
  if (v < 1) return `$${v.toFixed(3)}`
  return `$${v.toFixed(2)}`
}

// ── The running tracker (one per window) ──
const session = {}          // this window's usage since it opened
let pending = []            // reports not yet sent to the server
let flushTimer = null
const subscribers = new Set()
const notify = () => { for (const fn of subscribers) { try { fn() } catch { /* a listener never breaks tracking */ } } }

async function flush() {
  flushTimer = null
  if (!pending.length) return
  const batch = pending
  pending = []
  try {
    const r = await fetch('/api/usage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ add: batch }) })
    if (!r.ok) throw new Error(String(r.status))
    notify()
  } catch {
    pending = [...batch, ...pending].slice(-2000) // kept for the next flush (the server was restarting)
    if (!flushTimer) flushTimer = setTimeout(flush, 15000)
  }
}

// The listener providers.js calls for every successful request.
export function recordUsage(u) {
  if (!u || !u.provider) return
  addUsage(session, u)
  pending.push({ provider: u.provider, model: u.model, input: u.input, output: u.output })
  if (!flushTimer) flushTimer = setTimeout(flush, 3000)
  notify()
}
export const sessionUsage = () => session
export const subscribeUsage = (fn) => { subscribers.add(fn); return () => subscribers.delete(fn) }
export const flushUsageNow = () => { if (flushTimer) { clearTimeout(flushTimer); flushTimer = null } return flush() }
