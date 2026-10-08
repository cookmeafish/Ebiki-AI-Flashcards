// POST /api/tts { input, voice, lang } → audio/mpeg from the OpenAI-compatible TTS server in config.json
// (pronunciation.ttsUrl, e.g. a local Kokoro). STRICTLY OPT-IN: no URL → 404 and the client falls through to
// browser speech at once. The browser never talks to the TTS server (no CORS, the URL stays server-side).
//   200 audio/mpeg          synthesized or cached clip
//   404                     not configured / data folder unreachable (the client tier falls through)
//   502                     the TTS server failed or answered something that is not audio (falls through too)
//   400 / 405 / 500         bad body / wrong method / unexpected error
// Clips are cached in <data>/cache/tts/<sha1>.mp3 (TTS output has no redistribution limits); the file name is a
// hash, never anything from the request. Pure of the dev server: the caller passes its helpers.
export const TTS_TIMEOUT_MS = 20000
export const TTS_MIN_BYTES = 200 // smaller = a failed synthesis an older build cached
export const TTS_MAX_INPUT = 2000

export const ttsCacheKey = (crypto, input, lang, voice) => crypto.createHash('sha1').update(`${input}|${lang || ''}|${voice}`).digest('hex')

// The configured base URL, or '' when TTS is off. Only http(s) counts: anything else would be fetched as is.
export function ttsBaseUrl(config) {
  const raw = String((config && config.pronunciation && config.pronunciation.ttsUrl) || '').trim().replace(/\/+$/, '')
  return /^https?:\/\/[^\s/]/i.test(raw) ? raw : ''
}

export function createTtsRoute({ dataMode, readConfig, dataPath, writeFileAtomic, fs, path, crypto, fetch: doFetch = globalThis.fetch, timeoutMs = TTS_TIMEOUT_MS }) {
  return (req, res) => {
    const fail = (status, msg) => { if (res.writableEnded) return; res.statusCode = status; res.end(msg) }
    if (req.method !== 'POST') { fail(405, ''); return }
    let raw = ''
    req.on('data', (c) => { raw += c })
    req.on('end', async () => {
      try {
        let body
        try { body = JSON.parse(raw || '{}') } catch { fail(400, 'invalid json'); return }
        const { input, voice, lang } = body && typeof body === 'object' ? body : {}
        // Not behind the data guard, but it reads config.json and the cache on the data folder with SYNC calls: a
        // hung share froze the whole server. The async probe first; without the data folder, browser speech runs.
        if ((await dataMode()) === 'down') { fail(404, 'data folder unreachable'); return }
        const ttsUrl = ttsBaseUrl(readConfig())
        const text = typeof input === 'string' ? input.trim() : ''
        const v = typeof voice === 'string' ? voice.trim() : ''
        if (!ttsUrl || !text || !v) { fail(404, 'tts not configured'); return }
        if (text.length > TTS_MAX_INPUT || v.length > 120) { fail(400, 'input too long'); return }
        const l = typeof lang === 'string' ? lang.slice(0, 40) : ''
        const cacheDir = dataPath('cache', 'tts')
        const cacheFile = path.join(cacheDir, ttsCacheKey(crypto, text, l, v) + '.mp3')
        try {
          if (fs.statSync(cacheFile).size >= TTS_MIN_BYTES) {
            const buf = fs.readFileSync(cacheFile)
            res.setHeader('Content-Type', 'audio/mpeg')
            res.end(buf)
            return
          }
        } catch { /* not cached (or unreadable): synthesize */ }
        let r
        try {
          r = await doFetch(`${ttsUrl}/v1/audio/speech`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'kokoro', input: text, voice: v, response_format: 'mp3' }),
            signal: AbortSignal.timeout(timeoutMs), // a hung local TTS server must not hold the 🔊 button forever
          })
        } catch (e) { fail(502, 'tts server unreachable: ' + ((e && e.message) || e)); return }
        if (!r.ok) { fail(502, 'tts server error ' + r.status); return }
        const buf = Buffer.from(await r.arrayBuffer())
        // Only real audio: a 200 with an empty body or a JSON error (a server still loading its model) was cached for
        // good, and answered as audio it was an unplayable "success" that never fell through to browser speech.
        const type = r.headers && typeof r.headers.get === 'function' ? (r.headers.get('content-type') || 'audio/mpeg') : 'audio/mpeg'
        if (buf.length < TTS_MIN_BYTES || !/^audio\//i.test(type)) { fail(502, 'tts server returned no audio'); return }
        // Atomic: a play of the same word while this was writing read a half-written file that counted as cached.
        try { fs.mkdirSync(cacheDir, { recursive: true }); writeFileAtomic(cacheFile, buf) } catch { /* cache is best-effort */ }
        res.setHeader('Content-Type', 'audio/mpeg')
        res.end(buf)
      } catch (e) { fail(500, String((e && e.message) || e)) }
    })
  }
}
