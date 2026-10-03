// Boss taunts at run time: asks the model for one line (kit/taunt.js builds the prompt and checks the reply) and keeps
// each boss's last lines on this device (platform.kv), so no boss says the same thing twice.
import { platform } from '../../platform'
import { buildTauntPrompt, parseTaunt, tauntRepeats, pushRecent, TAUNT_ROLE, TAUNT_MAX_TOKENS } from './taunt'

const KEY = 'ebiki-boss-taunts'
const MAX_BOSSES = 80

export function recentTaunts(bossKey) {
  const all = platform.kv.getJson(KEY, {}) || {}
  return Array.isArray(all[bossKey]) ? all[bossKey].filter((x) => typeof x === 'string') : []
}
export function rememberTaunt(bossKey, line) {
  if (!bossKey || !line) return
  const all = platform.kv.getJson(KEY, {}) || {}
  const next = pushRecent(all[bossKey], line)
  delete all[bossKey] // re-added last: the oldest bosses are the first keys
  all[bossKey] = next
  const keys = Object.keys(all)
  if (keys.length > MAX_BOSSES) for (const k of keys.slice(0, keys.length - MAX_BOSSES)) delete all[k]
  platform.kv.setJson(KEY, all) // storage full: the line is just not remembered
}

// → { line, source: 'ai' | 'sample' } or null (nothing to say). `sampleUsed()` / `markSample()`: the caller's
// once-per-fight guard for the sample-line fallback (used only when the model could not answer, never after a
// rejected repeat).
export async function fetchTaunt(ai, { bossKey, voice, rules, avoidWords, sample = '', sampleUsed, markSample, ...facts }) {
  const recent = recentTaunts(bossKey)
  const fallback = () => {
    if (!sample || sampleUsed?.()) return null
    markSample?.()
    return { line: sample, source: 'sample' }
  }
  if (!ai?.hasKey) return fallback()
  let retry = ''
  for (let attempt = 0; attempt < 2; attempt++) {
    let line = ''
    try {
      const { system, user } = buildTauntPrompt({ ...facts, voice, rules, avoidWords, recent, retry })
      line = parseTaunt(await ai.call(system, user, { role: TAUNT_ROLE, maxTokens: TAUNT_MAX_TOKENS, silent: true }), ai.clean)
    } catch { return fallback() }
    if (!line) return fallback()
    if (!tauntRepeats(line, recent, sample)) { rememberTaunt(bossKey, line); return { line, source: 'ai' } }
    retry = line
  }
  return null // it kept repeating itself: nothing beats a repeat
}
