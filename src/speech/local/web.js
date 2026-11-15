// Browser half of the on-device recognizer (./whisper.worker.js): decode a recording to 16 kHz mono and ask the worker.
// One worker for the page, made on first use. `onProgress({ loaded, total })` while the model downloads (first use).
let worker = null
let seq = 0
// Bumped by releaseLocal: a transcription that started before a release never loads the recognizer after it.
let generation = 0
const waiting = new Map()
// SAFETY NET: an idle recognizer unloads itself, so no missed path can keep it in memory (voice mode also releases it
// on close). Each use re-arms the timer.
export const IDLE_UNLOAD_MS = 15000
let idleTimer = null
const armIdle = () => { clearTimeout(idleTimer); idleTimer = setTimeout(() => { if (!waiting.size) releaseLocal(); else armIdle() }, IDLE_UNLOAD_MS) }

export const canTranscribeLocally = () => typeof Worker !== 'undefined' && typeof WebAssembly !== 'undefined' && typeof (globalThis.AudioContext || globalThis.webkitAudioContext) !== 'undefined'

function getWorker() {
  if (worker) return worker
  worker = new Worker(new URL('./whisper.worker.js', import.meta.url), { type: 'module' })
  worker.onmessage = (e) => {
    const { id, progress, text, error } = e.data || {}
    const w = waiting.get(id)
    if (!w) return
    if (progress) { try { w.onProgress?.(progress) } catch { /* caller gone */ } return }
    waiting.delete(id)
    armIdle()
    if (error) w.reject(new Error(error)); else w.resolve(text || '')
  }
  worker.onerror = (e) => { for (const w of waiting.values()) w.reject(new Error(e?.message || 'local speech worker failed')); waiting.clear(); worker = null }
  return worker
}

async function toMono16k(blob) {
  const AC = globalThis.AudioContext || globalThis.webkitAudioContext
  const ac = new AC({ sampleRate: 16000 })
  try {
    const buf = await ac.decodeAudioData(await blob.arrayBuffer())
    if (buf.numberOfChannels === 1) return new Float32Array(buf.getChannelData(0))
    const a = buf.getChannelData(0); const b = buf.getChannelData(1); const out = new Float32Array(a.length)
    for (let i = 0; i < a.length; i++) out[i] = (a[i] + b[i]) / 2
    return out
  } finally { ac.close().catch(() => {}) }
}

// Unload the recognizer (voice mode closed): the worker and its model leave memory; the next use loads it again from
// the browser's cache (no new download). A transcription still running is answered with nothing.
export function releaseLocal() {
  generation++
  clearTimeout(idleTimer)
  if (!worker) return
  try { worker.terminate() } catch { /* already gone */ }
  worker = null
  for (const w of waiting.values()) w.resolve('')
  waiting.clear()
}
// For checks: is a recognizer loaded right now?
export const localLoaded = () => !!worker

// `keep()` false = the caller closed meanwhile (voice mode ended): nothing is loaded for it.
export async function transcribeLocally(blob, { lang = '', onProgress, keep } = {}) {
  if (!blob || !blob.size) return ''
  const gen = generation
  const audio = await toMono16k(blob)
  if (audio.length < 1600 || gen !== generation || (keep && !keep())) return '' // under 0.1 s: nothing to hear
  const id = ++seq
  const w = getWorker()
  return new Promise((resolve, reject) => {
    waiting.set(id, { resolve, reject, onProgress })
    w.postMessage({ id, audio, lang: lang || '' }, [audio.buffer])
  })
}
