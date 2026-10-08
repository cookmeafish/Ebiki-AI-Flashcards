// What a failed AI call shows. A provider error arrives as "API <status>: <body>" (or a network failure); shown raw
// it was a line of English JSON ("API 500: [api_error] {"type":"error",...}") in every language. ONE classifier for
// the whole app: App's toast (describeAiError), every feature (aiErrorText, ctx.ai.errorText). Buckets: out of
// credits, rate limited, key refused, unreachable, else a short generic line. Pure (no t of its own, no browser).

// The browser's own fetch failures and the provider call's timeout (AbortSignal.timeout throws a TimeoutError whose
// message is "signal timed out"), never words that could sit in an ordinary sentence.
const NET_RE = /^(?:typeerror: |timeouterror: )?(?:failed to fetch|networkerror when attempting to fetch|load failed|fetch failed|signal timed out|the operation timed out)\b/

// { key, vars } for a provider or network failure, null for anything else (an activity's own message, a parse error
// in the caller). "API <status>:" may sit after a caller's prefix ("Could not plan: API 429: ..."); its status decides.
export function aiErrorInfo(e) {
  const raw = String(e?.message ?? e ?? '').trim()
  const m = raw.toLowerCase()
  const at = m.search(/\bapi \d{3}\b/)
  const net = e?.name === 'TimeoutError' || NET_RE.test(m)
  if (at < 0 && !net) return null
  const status = at >= 0 ? Number(m.slice(at + 4, at + 7)) : 0
  const body = at >= 0 ? m.slice(at) : m
  // A per-minute limit worded like a quota ("You exceeded your current quota", one provider's 429) is a RATE limit:
  // it clears by itself. Real credit trouble names it.
  if (/resource_exhausted/.test(body) || (status === 429 && !/insufficient|credit|balance|payment|billing/.test(body))) return { key: 'aiErr_rateLimit' }
  if (/insufficient|credit|quota|billing|payment|balance/.test(body)) return { key: 'aiErr_credits' }
  if (status === 529 || /rate.?limit|too many requests|overloaded/.test(body)) return { key: 'aiErr_rateLimit' }
  if (status === 401 || status === 403 || /invalid.*api.*key|invalid x-api-key|unauthori|authentication/.test(body)) return { key: 'aiErr_badKey' }
  if (net || (status >= 500 && status <= 599)) return { key: 'aiErr_network' }
  // Another status (a 400 the provider explains, "API 200: blocked"): its first words, never the whole JSON body.
  const tail = raw.slice(at >= 0 ? at : 0)
  return { key: 'aiErr_generic', vars: { msg: (tail.replace(/\s*\{[\s\S]*$/, '') || tail).slice(0, 120) } }
}

const tr = (t, info) => (typeof t === 'function' ? t(info.key, info.vars) : info.key)

// The friendly text for a provider/network failure, or null when `e` isn't one (App's toast decides from that).
export function describeAiError(t, e) {
  const info = aiErrorInfo(e)
  return info ? tr(t, info) : null
}

// What an activity shows: the friendly text, or the error's own message when it isn't a provider failure.
export function aiErrorText(t, e) {
  const info = aiErrorInfo(e)
  return info ? tr(t, info) : String(e?.message ?? e ?? '').trim()
}

// The same through a feature context (ctx.ai.errorText), falling back to the feature's own t.
export const ctxErrorText = (ctx, e) => (typeof ctx?.ai?.errorText === 'function' ? ctx.ai.errorText(e) : aiErrorText(ctx?.t, e))
