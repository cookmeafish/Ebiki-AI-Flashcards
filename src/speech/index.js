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
    stt: pickStt(ctx?.apiKeys || {}, { browser: platform.speech.canRecognize(), pref: prefs.stt || 'auto' }),
    tts: pickTts(ctx?.apiKeys || {}, { pref: prefs.tts || 'auto' }),
  }
}

// Start listening. Returns { stop(): Promise<text>, cancel() }; throws when there is no engine or no mic.
// `onFail(code)`: the browser recognizer died on its own mid-session ('nomic' = permission refused).
export async function listen(ctx, { lang = '', onFail } = {}) {
  const { stt } = speechEngines(ctx)
  if (!stt) throw new Error('no-engine')
  if (stt === 'browser') return platform.speech.recognize({ lang, onFail })
  const rec = await platform.speech.record()
  return {
    stop: async () => {
      const blob = await rec.stop()
      return transcribe(blob, { engine: stt, keys: ctx.apiKeys, lang, geminiModel: ctx.presetModel?.('gemini', 'cheap') })
    },
    cancel: () => rec.cancel(),
  }
}

// Say `text`. `voice` picks a character's voice (0 = Ebi). Returns { done: Promise, stop() }.
// An AI voice that fails falls back to the free device voice, so speech never just goes silent.
export function speak(ctx, text, { lang = '', voice = 0 } = {}) {
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
    handle = { stop: () => { platform.speech.stop(token); release?.() } }
    return new Promise((resolve) => {
      release = resolve
      platform.speech.speak(clean, lang, { voiceIndex: voice, onHandle: (u) => { token = u } }).then(resolve, resolve)
    })
  }
  // stop() settles `done` at once on EVERY path: an AI voice stopped while its clip was still being made kept `done`
  // pending until the request came back (up to SPEECH_TIMEOUT_MS), so a stopped line still read as playing.
  let settleStopped = () => {}
  const stoppedNow = new Promise((resolve) => { settleStopped = resolve })
  const work = (async () => {
    if (tts === 'device') return device()
    const key = `${tts}|${voice}|${lang}|${clean}`
    try {
      let blob = cache.get(key)
      if (!blob) {
        blob = await synthesize(clean, { engine: tts, keys: ctx.apiKeys, lang, voice })
        cache.set(key, blob)
        if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value)
      }
      if (stopped) return
      handle = platform.audio.play(blob)
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
