// FREE ON-DEVICE SPEECH TO TEXT (Whisper, transformers.js, Apache-2.0): runs in this worker so the page never stalls.
// The model downloads once from Hugging Face (about 80 MB) and is kept in the browser's cache; after that it works
// offline. Messages: { id, audio: Float32Array (16 kHz mono), lang } → { id, progress } … { id, text } | { id, error }.
import { pipeline, env } from '@huggingface/transformers'

env.allowLocalModels = false
export const LOCAL_STT_MODEL = 'onnx-community/whisper-base'
let asr = null

async function load(id) {
  if (asr) return asr
  asr = pipeline('automatic-speech-recognition', LOCAL_STT_MODEL, {
    dtype: 'q8',
    device: 'wasm',
    progress_callback: (p) => { if (p && p.status === 'progress' && p.total) self.postMessage({ id, progress: { loaded: p.loaded, total: p.total, file: p.file } }) },
  }).catch((e) => { asr = null; throw e })
  return asr
}

self.onmessage = async (e) => {
  const { id, audio, lang } = e.data || {}
  try {
    const run = await load(id)
    const out = await run(audio, { language: lang || null, task: 'transcribe', chunk_length_s: 30, stride_length_s: 5 })
    self.postMessage({ id, text: String(out?.text || '').trim() })
  } catch (err) {
    self.postMessage({ id, error: String(err?.message || err) })
  }
}
