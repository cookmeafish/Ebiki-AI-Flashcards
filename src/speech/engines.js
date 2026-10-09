// Speech engines for every voice feature: speech to text (STT) and text to speech (TTS), on whichever
// provider keys the user has, ranked by PRICE. Portable: only fetch to the providers, no DOM.
//
// Prices are USD per minute of audio (checked Sep 2026; update COSTS when they change, the ranking follows):
//   STT  browser 0 (free, only in a browser tab) · gemini ~0.0015 · grok 0.0017 ($0.10/h) · openai 0.003
//   TTS  device 0 (the computer's own voices)     · gemini ~0.0135 · grok ~0.0135 ($15/1M chars) · openai 0.015
// Anthropic has no audio API.

export const COSTS = {
  stt: { browser: 0, gemini: 0.0015, grok: 0.0017, openai: 0.003 },
  tts: { device: 0, gemini: 0.0135, grok: 0.0135, openai: 0.015 },
}
// Every speech request gives up after this long: a stalled connection left Talk on "Hearing..." for good (TTS falls
// back to the device voice, STT shows its error and the learner can type).
export const SPEECH_TIMEOUT_MS = 60000
const timeoutSignal = () => (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(SPEECH_TIMEOUT_MS) : undefined)
// Which stored key each engine needs (null = none).
const NEEDS = { browser: null, device: null, gemini: 'gemini', grok: 'grok', openai: 'openai' }

export const MODELS = {
  stt: { openai: 'gpt-4o-mini-transcribe', grok: 'grok-voice-transcribe-2.0' },
  tts: { openai: 'gpt-4o-mini-tts', gemini: 'gemini-2.5-flash-preview-tts' },
}
// Two voices per engine, so a dialogue's characters sound different. Index 0 = Ebi.
export const VOICES = {
  openai: ['coral', 'ash'],
  grok: ['eve', 'rex'],
  gemini: ['Kore', 'Puck'],
}

const available = (engine, keys, { browser }) => (engine === 'browser' ? !!browser : !NEEDS[engine] || !!keys?.[NEEDS[engine]])
const cheapestFirst = (table) => Object.keys(table).sort((a, b) => table[a] - table[b])

// Speech to text: the preferred engine when usable, else the cheapest usable one; null = none.
export function pickStt(keys = {}, { browser = false, pref = 'auto' } = {}) {
  if (pref && pref !== 'auto' && COSTS.stt[pref] != null && available(pref, keys, { browser })) return pref
  return cheapestFirst(COSTS.stt).find((e) => available(e, keys, { browser })) || null
}

// Text to speech: 'auto' = the cheapest NATURAL (AI) voice the user has a key for, else the free device
// voice. 'device' = always the free one. A named engine without its key falls back to auto.
export function pickTts(keys = {}, { pref = 'auto' } = {}) {
  if (pref === 'device') return 'device'
  if (pref && pref !== 'auto' && COSTS.tts[pref] != null && available(pref, keys, {})) return pref
  return cheapestFirst(COSTS.tts).filter((e) => e !== 'device').find((e) => available(e, keys, {})) || 'device'
}

// ─── Speech to text ─────────────────────────────────────────────────────────────
const blobToBase64 = (blob) => blob.arrayBuffer().then((buf) => {
  let bin = ''
  const bytes = new Uint8Array(buf)
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(bin)
})
const extOf = (blob) => ((blob.type || 'audio/webm').split('/')[1] || 'webm').split(';')[0]

async function multipartStt(url, key, blob, fields) {
  const form = new FormData()
  for (const [k, v] of Object.entries(fields)) if (v) form.append(k, v)
  form.append('file', blob, `speech.${extOf(blob)}`) // last: one API requires it
  const r = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${key}` }, body: form, signal: timeoutSignal() })
  const body = await r.text()
  if (!r.ok) throw new Error(`API ${r.status}: ${body.slice(0, 300)}`)
  try { return String(JSON.parse(body).text || '').trim() } catch { return body.trim() }
}

async function geminiStt(blob, key, model, lang) {
  const data = await blobToBase64(blob)
  const mimeType = (blob.type || 'audio/webm').split(';')[0]
  const ask = 'Transcribe this recording exactly as spoken, in the language it is spoken in'
    + (lang ? ` (most likely ${lang})` : '') + '. Output ONLY the transcript: no quotes, labels or commentary. If nothing is said, output nothing.'
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: timeoutSignal(),
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: ask }, { inline_data: { mime_type: mimeType, data } }] }], generationConfig: { temperature: 0 } }),
  })
  const body = await r.text()
  if (!r.ok) throw new Error(`API ${r.status}: ${body.slice(0, 300)}`)
  return (JSON.parse(body).candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim()
}

// `lang` = optional ISO 639-1 hint. `geminiModel` = the cheap Gemini text model (audio in, text out).
// `model` = the model picked in Settings for this engine (the speech.stt job; '' = the built-in MODELS one).
export async function transcribe(blob, { engine, keys = {}, geminiModel = 'gemini-2.5-flash', lang = '', model = '' } = {}) {
  if (!blob || !blob.size) return ''
  if (engine === 'openai') return multipartStt('https://api.openai.com/v1/audio/transcriptions', keys.openai, blob, { model: model || MODELS.stt.openai, language: lang })
  if (engine === 'grok') return multipartStt('https://api.x.ai/v1/stt', keys.grok, blob, { model: model || MODELS.stt.grok, language: lang, format: 'true' })
  if (engine === 'gemini') return geminiStt(blob, keys.gemini, model || geminiModel, lang)
  throw new Error('no speech-to-text engine')
}

// ─── Text to speech ─────────────────────────────────────────────────────────────
// Gemini returns raw 16-bit PCM at 24 kHz: wrapped in a WAV header so any player can play it.
export function pcmToWav(pcm, sampleRate = 24000) {
  const header = new ArrayBuffer(44)
  const v = new DataView(header)
  const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)) }
  str(0, 'RIFF'); v.setUint32(4, 36 + pcm.length, true); str(8, 'WAVE'); str(12, 'fmt ')
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, sampleRate, true)
  v.setUint32(28, sampleRate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); str(36, 'data'); v.setUint32(40, pcm.length, true)
  return new Blob([header, pcm], { type: 'audio/wav' })
}
const b64ToBytes = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))

// Audio (Blob) for `text`. `voice` = index into VOICES[engine]. Throws on failure (callers fall back to device).
// `model` = the model picked in Settings (the speech.tts job; '' = the built-in MODELS one; xAI takes no model).
export async function synthesize(text, { engine, keys = {}, lang = '', voice = 0, model = '' } = {}) {
  const name = VOICES[engine]?.[voice % (VOICES[engine]?.length || 1)]
  let r
  if (engine === 'openai') {
    r = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST', headers: { Authorization: `Bearer ${keys.openai}`, 'Content-Type': 'application/json' }, signal: timeoutSignal(),
      body: JSON.stringify({ model: model || MODELS.tts.openai, input: text, voice: name, response_format: 'mp3' }),
    })
  } else if (engine === 'grok') {
    r = await fetch('https://api.x.ai/v1/tts', {
      method: 'POST', headers: { Authorization: `Bearer ${keys.grok}`, 'Content-Type': 'application/json' }, signal: timeoutSignal(),
      body: JSON.stringify({ text, voice_id: name, language: lang || 'auto' }),
    })
  } else if (engine === 'gemini') {
    r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model || MODELS.tts.gemini}:generateContent?key=${keys.gemini}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: timeoutSignal(),
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
        generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: name } } } },
      }),
    })
    const body = await r.text()
    if (!r.ok) throw new Error(`API ${r.status}: ${body.slice(0, 300)}`)
    const data = JSON.parse(body).candidates?.[0]?.content?.parts?.find((p) => p.inlineData || p.inline_data)
    const b64 = (data?.inlineData || data?.inline_data)?.data
    if (!b64) throw new Error('no audio returned')
    return pcmToWav(b64ToBytes(b64))
  } else {
    throw new Error('no text-to-speech engine')
  }
  if (!r.ok) throw new Error(`API ${r.status}: ${(await r.text()).slice(0, 300)}`)
  return r.blob()
}
