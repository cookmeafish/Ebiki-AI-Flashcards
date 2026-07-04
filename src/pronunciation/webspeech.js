// Tier 3 — browser SpeechSynthesis. Zero-infra last resort: no URL/blob exists,
// only a speak() capability (hence the result's kind:'speak'). Voice pick degrades
// exact dialect → base language → null. Single words are far below the ~15s
// utterance truncation limit, so no chunking is needed.
import { langInfo } from './langcodes'

let voicesPromise = null
const loadVoices = () => {
  if (voicesPromise) return voicesPromise
  voicesPromise = new Promise((resolve) => {
    const synth = window.speechSynthesis
    if (!synth) { resolve([]); return }
    const have = synth.getVoices()
    if (have.length) { resolve(have); return }
    // Voices load async in Chromium — race handled with the event + a timeout fallback.
    let done = false
    const finish = () => {
      if (done) return
      done = true
      const v = synth.getVoices()
      // NEVER cache an empty list — voices may simply not have loaded yet; a later
      // click should get a fresh chance instead of a permanently muted tier.
      if (!v.length) voicesPromise = null
      resolve(v)
    }
    synth.addEventListener('voiceschanged', finish, { once: true })
    setTimeout(finish, 1500)
  })
  return voicesPromise
}

export async function resolveWebSpeech({ word, lang, region = '' }) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null
  const info = langInfo(lang)
  if (!info || !word) return null
  const voices = await loadVoices()
  if (!voices.length) return null
  const base = info.bcp47.split('-')[0].toLowerCase()
  const wanted = region ? `${base}-${String(region).toUpperCase()}` : info.bcp47
  const norm = (t) => String(t || '').replace(/_/g, '-').toLowerCase()
  const voice = voices.find((v) => norm(v.lang) === wanted.toLowerCase())
    || voices.find((v) => norm(v.lang).startsWith(base + '-'))
    || voices.find((v) => norm(v.lang) === base)
  if (!voice) return null
  return {
    kind: 'speak', source: 'webspeech',
    speak: () => {
      const u = new SpeechSynthesisUtterance(word)
      u.voice = voice
      u.lang = voice.lang
      u.rate = 0.85 // slightly slow for learners
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(u)
    },
  }
}
