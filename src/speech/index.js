// The one speech service features use: listen() for speech to text, speak() for text to speech, picking the
// cheapest engine the user can use (see ./engines.js for prices) unless Settings names one. Portable: the
// microphone, the device voice and audio playback all come from src/platform.
import { platform } from '../platform'
import { pickStt, pickTts, transcribe, synthesize, COSTS } from './engines'

export { COSTS, pickStt, pickTts } from './engines'
export const SPEECH_SETTINGS_ID = 'speech'     // featureSettings key holding { stt, tts } preferences
const CACHE_MAX = 80                           // synthesized clips kept in memory (a sentence is never paid twice)
const cache = new Map()

// The engines this user gets right now. `ctx` = the feature context (keys + settings).
export function speechEngines(ctx) {
  const prefs = ctx?.featureSettings?.[SPEECH_SETTINGS_ID] || {}
  return {
    stt: pickStt(ctx?.apiKeys || {}, { browser: platform.speech.canRecognize(), local: !!platform.speech.canTranscribeLocally?.(), pref: prefs.stt || 'auto' }),
    tts: pickTts(ctx?.apiKeys || {}, { pref: prefs.tts || 'auto' }),
  }
}

// Start listening. Returns { stop(): Promise<text>, cancel() }; throws when there is no engine or no mic.
// `onFail(code)`: the browser recognizer died on its own mid-session ('nomic' = permission refused).
// `onLevel(level, ms)`: microphone loudness for hands-free turn taking (recorded engines only; the browser recognizer
// ends its own turns). The returned handle says which: `levels: true` when onLevel will be called.
// `onProgress({ loaded, total })`: the on-device model downloading (its first use only).
// `lang` may be a function: read when the recording is transcribed, so a language switched mid-turn still counts.
export async function listen(ctx, { lang: langIn = '', onFail, onLevel, onProgress } = {}) {
  const langNow = () => String((typeof langIn === 'function' ? langIn() : langIn) || '')
  const { stt } = speechEngines(ctx)
  if (!stt) throw new Error('no-engine')
  if (stt === 'browser') return { ...(await platform.speech.recognize({ lang: langNow(), onFail })), levels: false, engine: stt }
  const rec = await platform.speech.record(onLevel ? { onLevel } : undefined)
  return {
    // `keep()`: asked after the recording ends; false = the caller no longer wants it (closed): nothing is paid.
    stop: async ({ keep } = {}) => {
      const blob = await rec.stop()
      if (keep && !keep()) return ''
      const lang = langNow()
      if (stt === 'local') return platform.speech.transcribeLocally(blob, { lang, onProgress, keep })
      return transcribe(blob, { engine: stt, keys: ctx.apiKeys, lang, geminiModel: ctx.presetModel?.('gemini', 'cheap'), model: ctx.speechModel?.('stt', stt) || '' })
    },
    cancel: () => rec.cancel(),
    levels: !!rec.levels, // true only when the level meter really started (Web Audio can fail)
    engine: stt,
  }
}

// One synthesized clip per engine, model, voice, language and text: kept (CACHE_MAX) and shared while being made, so
// prepare() then speak() of the same line pays once.
const making = new Map()
function clipFor(ctx, clean, { tts, model, voice, lang }) {
  const key = `${tts}|${model}|${voice}|${lang}|${clean}`
  if (cache.has(key)) return Promise.resolve(cache.get(key))
  if (making.has(key)) return making.get(key)
  const p = synthesize(clean, { engine: tts, keys: ctx.apiKeys, lang, voice, model })
    .then((blob) => { cache.set(key, blob); if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value); return blob })
    .finally(() => making.delete(key))
  making.set(key, p)
  return p
}
// Make a line's clip ahead of time (the next sentence while one plays). Device voices need nothing. Never throws.
export function prepare(ctx, text, { lang = '', voice = 0 } = {}) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim()
  const { tts } = speechEngines(ctx)
  if (!clean || !tts || tts === 'device') return
  clipFor(ctx, clean, { tts, model: ctx.speechModel?.('tts', tts) || '', voice, lang }).catch(() => {})
}

// Say `text`. `voice` picks a character's voice (0 = Ebi); `rate` the speed (1 = normal). Returns { done: Promise, stop() }.
// An AI voice that fails falls back to the free device voice, so speech never just goes silent.
export function speak(ctx, text, { lang = '', voice = 0, rate = 1 } = {}) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim()
  if (!clean) return { done: Promise.resolve(), stop: () => {} }
  const { tts } = speechEngines(ctx)
  let stopped = false
  let handle = null
  let release = null
  // The device voice is ONE shared queue: stop only THIS line (its own token), never every feature's speech, and
  // settle `done` at once (a cancelled line's end event may never come).
  const device = () => {
    let token = null
    // No token = the device never queued this line: nothing to stop (a bare stop() would silence every voice).
    handle = { stop: () => { if (token) platform.speech.stop(token); release?.() } }
    return new Promise((resolve) => {
      release = resolve
      platform.speech.speak(clean, lang, { voiceIndex: voice, rate, onHandle: (u) => { token = u } }).then(resolve, resolve)
    })
  }
  // stop() settles `done` at once on EVERY path: an AI voice stopped while its clip was still being made kept `done`
  // pending until the request came back (up to SPEECH_TIMEOUT_MS), so a stopped line still read as playing.
  let settleStopped = () => {}
  const stoppedNow = new Promise((resolve) => { settleStopped = resolve })
  const work = (async () => {
    if (tts === 'device') return device()
    const model = ctx.speechModel?.('tts', tts) || '' // Settings > AI & cost > speech job ('' = built in)
    try {
      const blob = await clipFor(ctx, clean, { tts, model, voice, lang })
      if (stopped) return
      handle = platform.audio.play(blob, { rate })
      return handle.done
    } catch {
      if (!stopped) return device()
    }
  })()
  const done = Promise.race([work, stoppedNow])
  return { done, stop: () => { stopped = true; handle?.stop?.(); settleStopped() } }
}

// Rough cost of `minutes` of audio with an engine, for Settings hints.
export const costPerMinute = (kind, engine) => COSTS[kind]?.[engine] ?? 0
