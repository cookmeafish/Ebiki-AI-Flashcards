// Pronunciation orchestrator — 4-tier fallback chain, language-agnostic by design:
//   0. anki        → audio already embedded in the card ([sound:…]) — instant, offline
//   1. wiktionary  → real native-speaker recording (with mandatory CC-BY-SA attribution)
//   2. kokoro      → local TTS, opt-in via config.ttsUrl ('' ⇒ skipped instantly)
//   3. webspeech   → browser SpeechSynthesis, zero infra
// Result: { kind:'url'|'speak', audioUrl?, speak?(), source, attribution?, fileName? }
// or null when every tier declines. NEVER throws — a broken tier just falls through.
import { resolveAnkiMedia } from './ankimedia'
import { resolveWiktionary } from './wiktionary'
import { resolveKokoro } from './kokoro'
import { resolveWebSpeech } from './webspeech'

const PROVIDERS = [resolveAnkiMedia, resolveWiktionary, resolveKokoro, resolveWebSpeech]

// Session cache of SUCCESSES only, so replays are instant. Misses are NOT cached —
// a null is often transient (Wikimedia 429 on a click burst, Anki closed, voices not
// loaded yet), and caching it would turn a hiccup into a permanent muted icon.
const cache = new Map()

export async function getPronunciation({ word, lang, region = '', config = {}, noteId = null, cardId = null, variant = 0 }) {
  const w = String(word || '').trim()
  if (!w || !lang) return null
  const key = `${w.toLowerCase()}|${lang}|${region}|v${variant}`.toLowerCase()
  if (cache.has(key)) return cache.get(key)
  let result = null
  if (variant > 0) {
    // Alternate-voice requests only make sense for real recordings — cycle the ranked
    // Wiktionary/Commons candidate list (Tier 0's embedded file IS variant we started from,
    // and TTS/webspeech have one voice each).
    try { result = await resolveWiktionary({ word: w, lang, region, config, variant }) } catch { /* fall through */ }
  } else {
    for (const provider of PROVIDERS) {
      try {
        result = await provider({ word: w, lang, region, config, noteId, cardId })
        if (result) break
      } catch { /* graceful degradation: a failing tier never breaks the chain */ }
    }
  }
  if (result) {
    if (cache.size > 500) cache.clear()
    cache.set(key, result)
  }
  return result
}
