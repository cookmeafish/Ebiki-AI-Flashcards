// Tier 2 — local TTS (Kokoro or any OpenAI-compatible /v1/audio/speech server).
// STRICTLY OPT-IN: with no ttsUrl configured this returns null instantly, so the tier
// costs nothing on machines without a local TTS server (barebones-laptop guarantee).
// The browser never talks to the TTS server directly — /api/tts (vite middleware)
// proxies + disk-caches, avoiding CORS and keeping the server URL out of the client.
import { langInfo } from './langcodes'

// Default voice map from Kokoro-82M's published voice inventory (verified against a live
// server's /v1/audio/voices when one is configured). Keys: iso1 or iso1-region. Kokoro
// covers only these languages — anything unmapped falls through to the next tier.
export const DEFAULT_TTS_VOICES = {
  'en': 'af_heart', 'en-us': 'af_heart', 'en-gb': 'bf_emma', 'en-uk': 'bf_emma',
  'es': 'ef_dora', 'fr': 'ff_siwis', 'it': 'if_sara',
  'pt': 'pf_dora', 'pt-br': 'pf_dora',
  'ja': 'jf_alpha', 'zh': 'zf_xiaobei', 'hi': 'hf_alpha',
}

export async function resolveKokoro({ word, lang, region = '', config = {} }) {
  const ttsUrl = String(config.ttsUrl || '').trim()
  if (!ttsUrl) return null // opt-in tier: not configured → skip instantly
  const info = langInfo(lang)
  if (!info || !word) return null
  const voices = { ...DEFAULT_TTS_VOICES, ...(config.ttsVoices || {}) }
  const voice = voices[`${info.iso1}-${String(region).toLowerCase()}`] || voices[info.iso1]
  if (!voice) return null // language not covered by the local model → fall through
  try {
    const r = await fetch('/api/tts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: word, voice, lang: info.iso1 }),
    })
    if (!r.ok) return null
    const blob = await r.blob()
    if (!blob || blob.size < 200) return null // empty/error payload
    return { kind: 'url', source: 'kokoro', audioUrl: URL.createObjectURL(blob) }
  } catch { return null }
}
