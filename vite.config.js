import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import http from 'http'
import crypto from 'crypto'
import { spawn } from 'child_process'

const ENV_FILE = path.resolve('.env')
const CONFIG_FILE = path.resolve('config.json')
const ANKI_FORMAT_FILE = path.resolve('ankiformat.json')
const MODES_DIR = path.resolve('modes')
const LOG_DIR = path.resolve('logs')

function parseEnv() {
  if (!fs.existsSync(ENV_FILE)) return {}
  const lines = fs.readFileSync(ENV_FILE, 'utf-8').split('\n')
  const keys = {}
  const providers = { ANTHROPIC: 'anthropic', OPENAI: 'openai', GEMINI: 'gemini', GROK: 'grok' }
  for (const line of lines) {
    const match = line.match(/^VITE_(\w+)_API_KEY=(.*)$/)
    if (match) {
      const provider = providers[match[1]]
      if (provider) keys[provider] = match[2].trim()
    }
  }
  return keys
}

function writeEnv(keys) {
  const providers = { anthropic: 'ANTHROPIC', openai: 'OPENAI', gemini: 'GEMINI', grok: 'GROK' }
  let existing = []
  if (fs.existsSync(ENV_FILE)) {
    existing = fs.readFileSync(ENV_FILE, 'utf-8').split('\n')
      .filter((l) => !l.match(/^VITE_\w+_API_KEY=/))
      .filter((l) => l.trim() !== '')
  }
  const keyLines = Object.entries(keys)
    .filter(([, v]) => v)
    .map(([k, v]) => `VITE_${providers[k] || k.toUpperCase()}_API_KEY=${v}`)
  const content = [...existing, ...keyLines].join('\n') + '\n'
  fs.writeFileSync(ENV_FILE, content, 'utf-8')
}

function readConfig() {
  try {
    return fs.existsSync(CONFIG_FILE) ? JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8')) : {}
  } catch { return {} }
}

function writeConfig(data) {
  const existing = readConfig()
  const merged = { ...existing, ...data }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2) + '\n', 'utf-8')
}

function apiPlugin() {
  return {
    name: 'api-plugin',
    configureServer(server) {
      // API keys endpoint
      server.middlewares.use('/api/keys', (req, res) => {
        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(parseEnv()))
        } else if (req.method === 'POST') {
          let body = ''
          req.on('data', (chunk) => { body += chunk })
          req.on('end', () => {
            try {
              writeEnv(JSON.parse(body))
              res.setHeader('Content-Type', 'application/json')
              res.end('{"ok":true}')
            } catch {
              res.statusCode = 400
              res.end('{"error":"invalid json"}')
            }
          })
        } else {
          res.statusCode = 405
          res.end('')
        }
      })

      // Log endpoint — writes OCR pipeline logs to logs/ directory
      server.middlewares.use('/api/log', (req, res) => {
        if (req.method === 'POST') {
          let body = ''
          req.on('data', (chunk) => { body += chunk })
          req.on('end', () => {
            try {
              if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true })
              const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
              const logFile = path.join(LOG_DIR, `ocr-${timestamp}.log`)
              fs.writeFileSync(logFile, body, 'utf-8')
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: true, file: logFile }))
            } catch (e) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: e.message }))
            }
          })
        } else {
          res.statusCode = 405
          res.end('')
        }
      })

      // AnkiConnect proxy endpoint
      server.middlewares.use('/api/anki', (req, res) => {
        if (req.method === 'POST') {
          // Vite may have already parsed the body — check req.body first
          const forwardBody = (bodyStr) => {
            console.log('[Anki proxy] forwarding:', bodyStr.substring(0, 200))
            const ankiReq = http.request(
              { hostname: '127.0.0.1', port: 8765, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bodyStr) } },
              (ankiRes) => {
                let data = ''
                ankiRes.on('data', (chunk) => { data += chunk })
                ankiRes.on('end', () => {
                  console.log('[Anki proxy] response:', data.substring(0, 200))
                  res.setHeader('Content-Type', 'application/json')
                  res.end(data)
                })
              }
            )
            ankiReq.on('error', (err) => {
              console.log('[Anki proxy] error:', err.message)
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Anki is not running or AnkiConnect is not installed' }))
            })
            ankiReq.write(bodyStr)
            ankiReq.end()
          }
          // Handle both pre-parsed body and raw stream
          if (req.body) {
            forwardBody(typeof req.body === 'string' ? req.body : JSON.stringify(req.body))
          } else {
            let raw = ''
            req.on('data', (chunk) => { raw += chunk })
            req.on('end', () => forwardBody(raw))
          }
        } else {
          res.statusCode = 405
          res.end('')
        }
      })

      // Anki format endpoint
      server.middlewares.use('/api/ankiformat', (req, res) => {
        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          try {
            const data = fs.existsSync(ANKI_FORMAT_FILE)
              ? fs.readFileSync(ANKI_FORMAT_FILE, 'utf-8')
              : '{}'
            res.end(data)
          } catch { res.end('{}') }
        } else if (req.method === 'POST') {
          const handleBody = (bodyStr) => {
            try {
              fs.writeFileSync(ANKI_FORMAT_FILE, bodyStr, 'utf-8')
              res.setHeader('Content-Type', 'application/json')
              res.end('{"ok":true}')
            } catch {
              res.statusCode = 400
              res.end('{"error":"invalid json"}')
            }
          }
          if (req.body) {
            handleBody(typeof req.body === 'string' ? req.body : JSON.stringify(req.body))
          } else {
            let body = ''
            req.on('data', (chunk) => { body += chunk })
            req.on('end', () => handleBody(body))
          }
        } else {
          res.statusCode = 405
          res.end('')
        }
      })

      // ── Local TTS proxy + disk cache (pronunciation Tier 2) ─────────────
      // POST /api/tts {input, voice, lang} → forwards to the OpenAI-compatible TTS
      // server configured in config.json (pronunciation.ttsUrl). STRICTLY OPT-IN:
      // no URL configured → 404 and the client tier falls through instantly, so
      // machines without a local TTS server pay zero cost. The browser never talks
      // to the TTS server directly (no CORS issues, URL stays server-side).
      // Synthesized clips are disk-cached (TTS output has no redistribution limits).
      server.middlewares.use('/api/tts', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(''); return }
        let raw = ''
        req.on('data', (c) => { raw += c })
        req.on('end', async () => {
          try {
            const { input, voice, lang } = JSON.parse(raw || '{}')
            const ttsUrl = String(readConfig().pronunciation?.ttsUrl || '').trim().replace(/\/+$/, '')
            if (!ttsUrl || !input || !voice) { res.statusCode = 404; res.end('tts not configured'); return }
            const key = crypto.createHash('sha1').update(`${input}|${lang || ''}|${voice}`).digest('hex')
            const cacheDir = path.resolve('cache', 'tts')
            const cacheFile = path.join(cacheDir, key + '.mp3')
            if (fs.existsSync(cacheFile)) {
              res.setHeader('Content-Type', 'audio/mpeg')
              res.end(fs.readFileSync(cacheFile))
              return
            }
            const r = await fetch(`${ttsUrl}/v1/audio/speech`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ model: 'kokoro', input, voice, response_format: 'mp3' }),
            })
            if (!r.ok) { res.statusCode = 502; res.end('tts server error ' + r.status); return }
            const buf = Buffer.from(await r.arrayBuffer())
            try { fs.mkdirSync(cacheDir, { recursive: true }); fs.writeFileSync(cacheFile, buf) } catch { /* cache is best-effort */ }
            res.setHeader('Content-Type', 'audio/mpeg')
            res.end(buf)
          } catch (e) { res.statusCode = 500; res.end(String(e.message || e)) }
        })
      })

      // ── Knowledge outline & section slicing ─────────────────────────────
      // Huge knowledge bases (whole books) can't be prompt-stuffed, so we extract a
      // navigable OUTLINE (headings) and serve individual sections on demand. A file
      // whose NAME looks like a table of contents (toc.txt, "table of contents.md" …)
      // overrides detection: each of its lines is treated as a chapter/section title
      // and located in the other files — so a user can upload a book + its TOC and
      // the AI navigates by TOC even when the book text has no markdown headings.
      const TOC_NAME_RE = /(^|[^a-z])(toc|table[ _-]*of[ _-]*contents)([^a-z]|$)/i
      const readKnowledgeFiles = (knowledgeDir) => {
        if (!fs.existsSync(knowledgeDir)) return []
        return fs.readdirSync(knowledgeDir)
          .filter((f) => f.match(/\.(txt|md)$/i))
          .map((f) => ({ name: f, text: fs.readFileSync(path.join(knowledgeDir, f), 'utf-8') }))
      }
      const detectHeadings = (file) => {
        const out = []
        const lines = file.text.split('\n')
        let off = 0
        for (const line of lines) {
          const t = line.trim()
          let m
          if ((m = t.match(/^(#{1,6})\s+(.{2,120})$/))) {
            out.push({ file: file.name, title: m[2].trim(), level: m[1].length, start: off })
          } else if (t.match(/^(chapter|module|unit|part|section|lesson|domain|appendix)\s+\d+\b.{0,100}$/i)) {
            out.push({ file: file.name, title: t.slice(0, 120), level: 1, start: off })
          } else if (t.length <= 110 && t.match(/^\d+(\.\d+){0,3}[.)]?\s+[A-Za-z].{2,100}$/)) {
            const num = t.match(/^(\d+(?:\.\d+)*)/)
            out.push({ file: file.name, title: t.slice(0, 120), level: Math.min(4, num[1].split('.').length), start: off })
          }
          off += line.length + 1
        }
        return out
      }
      const extractOutline = (files) => {
        const tocFiles = files.filter((f) => TOC_NAME_RE.test(f.name))
        const contentFiles = files.filter((f) => !TOC_NAME_RE.test(f.name))
        let outline = []
        if (tocFiles.length && contentFiles.length) {
          const titles = tocFiles.flatMap((f) => f.text.split('\n'))
            .map((l) => l.trim()
              .replace(/\.{3,}\s*\d+$/, '')   // dotted leaders + page number ("Title .... 123")
              .replace(/\s+\d+$/, '')          // bare trailing page number
              .replace(/^[-*•>\s]+/, '')       // list bullets
              .trim())
            .filter((t) => t.length >= 3 && t.length <= 120)
          for (const title of titles) {
            const num = title.match(/^(\d+(?:\.\d+)*)/)
            const level = num ? Math.min(4, num[1].split('.').length) : 1
            // Locate the title in the content files (case-insensitive; also try without numbering).
            const needles = [title, title.replace(/^\d+(?:\.\d+)*[.)]?\s*/, '')].filter((n) => n.length >= 3)
            let found = null
            for (const f of contentFiles) {
              const hay = f.text.toLowerCase()
              for (const n of needles) {
                const idx = hay.indexOf(n.toLowerCase())
                if (idx !== -1) { found = { file: f.name, title, level, start: idx }; break }
              }
              if (found) break
            }
            if (found) outline.push(found)
          }
          outline.sort((a, b) => (a.file === b.file ? a.start - b.start : a.file.localeCompare(b.file)))
        }
        if (outline.length < 4) outline = contentFiles.flatMap(detectHeadings)
        return outline
      }
      const sliceSections = (files, outline, ids, cap) => {
        const byFile = Object.fromEntries(files.map((f) => [f.name, f.text]))
        const parts = []
        for (const id of ids) {
          const h = outline[id]
          const text = h && byFile[h.file]
          if (!text) continue
          // Section runs until the next heading in the same file at the same or higher level.
          let end = text.length
          for (let j = id + 1; j < outline.length; j++) {
            const n = outline[j]
            if (n.file !== h.file) break
            if (n.level <= h.level) { end = n.start; break }
          }
          parts.push(`### ${h.title} (${h.file})\n${text.slice(h.start, end).trim()}`)
        }
        let joined = parts.join('\n\n')
        if (joined.length > cap) joined = joined.slice(0, cap)
        return joined
      }

      // GET /api/knowledge-sections?mode=X&sections=1,4&cap=60000 → slice the requested
      // outline sections out of the mode's knowledge files. Indices match the `outline`
      // array returned by GET /api/modes/knowledge (recomputed here from the same files).
      server.middlewares.use('/api/knowledge-sections', (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        try {
          const url = new URL(req.url, 'http://x')
          const modeName = (url.searchParams.get('mode') || '').replace(/[<>:"/\\|?*]/g, '').replace(/\s+/g, ' ').trim()
          const ids = (url.searchParams.get('sections') || '').split(',').map((s) => parseInt(s, 10)).filter((n) => Number.isInteger(n) && n >= 0).slice(0, 8)
          const cap = Math.min(200000, parseInt(url.searchParams.get('cap'), 10) || 60000)
          const all = readKnowledgeFiles(path.join(MODES_DIR, modeName, 'knowledge'))
          const outline = extractOutline(all)
          const content = sliceSections(all.filter((f) => !TOC_NAME_RE.test(f.name)), outline, ids, cap)
          res.end(JSON.stringify({ content, titles: ids.map((i) => outline[i]?.title).filter(Boolean) }))
        } catch (e) { res.end(JSON.stringify({ content: '', titles: [], error: e.message })) }
      })

      // Knowledge base endpoint — MUST be before /api/modes (prefix matching)
      // GET ?mode=X → list files + content + outline (headings/TOC for big-KB navigation)
      // POST ?mode=X (JSON {filename, content}) → upload file
      // DELETE ?mode=X&file=Y → delete file
      // PATCH ?mode=X&file=Y → toggle enable/disable
      server.middlewares.use('/api/modes/knowledge', (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        const url = new URL(req.url, 'http://x')
        const modeName = url.searchParams.get('mode') || ''
        const sanitized = (modeName || '').replace(/[<>:"/\\|?*]/g, '').replace(/\s+/g, ' ').trim()
        const knowledgeDir = path.join(MODES_DIR, sanitized, 'knowledge')

        if (!sanitized) { res.end(JSON.stringify({ files: [], content: null, fileCount: 0 })); return }

        if (req.method === 'GET') {
          try {
            if (!fs.existsSync(knowledgeDir)) { res.end(JSON.stringify({ files: [], content: null, fileCount: 0 })); return }
            const allFiles = fs.readdirSync(knowledgeDir)
            const files = allFiles.filter(f => f.match(/\.(txt|md)(\.disabled)?$/i)).map(f => {
              const disabled = f.endsWith('.disabled')
              const name = disabled ? f.replace(/\.disabled$/, '') : f
              const size = fs.statSync(path.join(knowledgeDir, f)).size
              return { name, disabled, size }
            })
            const enabledFiles = allFiles.filter(f => f.match(/\.(txt|md)$/i))
            const content = enabledFiles.map(f => {
              const text = fs.readFileSync(path.join(knowledgeDir, f), 'utf-8')
              return `--- ${f} ---\n${text}`
            }).join('\n\n')
            // Outline (capped) so the client can offer TOC-guided section retrieval for big KBs.
            const outline = extractOutline(readKnowledgeFiles(knowledgeDir)).slice(0, 400)
              .map(({ file, title, level }) => ({ file, title, level }))
            res.end(JSON.stringify({ files, content: content || null, fileCount: enabledFiles.length, outline }))
          } catch { res.end(JSON.stringify({ files: [], content: null, fileCount: 0, outline: [] })) }
        } else if (req.method === 'POST') {
          const handleBody = (bodyStr) => {
            try {
              if (!fs.existsSync(knowledgeDir)) fs.mkdirSync(knowledgeDir, { recursive: true })
              const { filename, content } = JSON.parse(bodyStr)
              const safeName = (filename || 'file.txt').replace(/[<>:"/\\|?*]/g, '')
              fs.writeFileSync(path.join(knowledgeDir, safeName), content, 'utf-8')
              res.end(JSON.stringify({ ok: true, filename: safeName }))
            } catch (e) { res.statusCode = 400; res.end(JSON.stringify({ error: e.message })) }
          }
          if (req.body) { handleBody(typeof req.body === 'string' ? req.body : JSON.stringify(req.body)) }
          else { let b = ''; req.on('data', c => b += c); req.on('end', () => handleBody(b)) }
        } else if (req.method === 'DELETE') {
          try {
            const fileName = url.searchParams.get('file')
            if (!fileName) { res.statusCode = 400; res.end('{"error":"no file"}'); return }
            const safeName = fileName.replace(/[<>:"/\\|?*]/g, '')
            const filePath = path.join(knowledgeDir, safeName)
            const disabledPath = filePath + '.disabled'
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
            if (fs.existsSync(disabledPath)) fs.unlinkSync(disabledPath)
            res.end('{"ok":true}')
          } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })) }
        } else if (req.method === 'PATCH') {
          try {
            const fileName = url.searchParams.get('file')
            if (!fileName) { res.statusCode = 400; res.end('{"error":"no file"}'); return }
            const safeName = fileName.replace(/[<>:"/\\|?*]/g, '')
            const filePath = path.join(knowledgeDir, safeName)
            const disabledPath = filePath + '.disabled'
            if (fs.existsSync(disabledPath)) {
              fs.renameSync(disabledPath, filePath)
              res.end(JSON.stringify({ ok: true, disabled: false }))
            } else if (fs.existsSync(filePath)) {
              fs.renameSync(filePath, disabledPath)
              res.end(JSON.stringify({ ok: true, disabled: true }))
            } else {
              res.statusCode = 404; res.end('{"error":"file not found"}')
            }
          } catch (e) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })) }
        } else { res.statusCode = 405; res.end('') }
      })

      // Modes endpoint — per-mode named folders in modes/ directory
      // Each mode: modes/<sanitized-name>/config.json
      // Meta: modes/_meta.json
      server.middlewares.use('/api/modes', (req, res) => {
        if (!fs.existsSync(MODES_DIR)) fs.mkdirSync(MODES_DIR, { recursive: true })
        const metaFile = path.join(MODES_DIR, '_meta.json')

        // Sanitize mode name for folder: remove invalid chars, trim, fallback to id
        const sanitizeName = (name, id) => {
          const clean = (name || '').replace(/[<>:"/\\|?*]/g, '').replace(/\s+/g, ' ').trim()
          return clean || `mode-${id}`
        }

        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          try {
            const meta = fs.existsSync(metaFile) ? JSON.parse(fs.readFileSync(metaFile, 'utf-8')) : {}

            // Migrate legacy numbered folders/files
            const entries = fs.readdirSync(MODES_DIR)
            for (const entry of entries) {
              const full = path.join(MODES_DIR, entry)
              // Legacy flat file: 1.json → read, create named folder
              if (entry.match(/^\d+\.json$/)) {
                try {
                  const mode = JSON.parse(fs.readFileSync(full, 'utf-8'))
                  const folderName = sanitizeName(mode.name, mode.id)
                  const newDir = path.join(MODES_DIR, folderName)
                  if (!fs.existsSync(newDir)) fs.mkdirSync(newDir, { recursive: true })
                  fs.writeFileSync(path.join(newDir, 'config.json'), JSON.stringify(mode, null, 2), 'utf-8')
                  fs.unlinkSync(full)
                } catch {}
              }
              // Legacy numbered folder: 1/ → read config, rename to named folder
              if (entry.match(/^\d+$/) && fs.statSync(full).isDirectory()) {
                const cfgFile = path.join(full, 'config.json')
                if (fs.existsSync(cfgFile)) {
                  try {
                    const mode = JSON.parse(fs.readFileSync(cfgFile, 'utf-8'))
                    const folderName = sanitizeName(mode.name, mode.id)
                    if (folderName !== entry) {
                      const newDir = path.join(MODES_DIR, folderName)
                      if (!fs.existsSync(newDir)) fs.renameSync(full, newDir)
                    }
                  } catch {}
                }
              }
            }

            // Read all mode folders
            const allDirs = fs.readdirSync(MODES_DIR).filter((d) => {
              const full = path.join(MODES_DIR, d)
              return d !== '_meta.json' && d !== 'Default' && fs.statSync(full).isDirectory() && fs.existsSync(path.join(full, 'config.json'))
            })
            const modes = allDirs.map((d) => {
              try { return JSON.parse(fs.readFileSync(path.join(MODES_DIR, d, 'config.json'), 'utf-8')) } catch { return null }
            }).filter(Boolean)
            res.end(JSON.stringify({ modes, activeModeId: meta.activeModeId || (modes[0]?.id) || 1 }))
          } catch { res.end('{"modes":[],"activeModeId":1}') }
        } else if (req.method === 'POST') {
          const handleBody = (bodyStr) => {
            try {
              const data = JSON.parse(bodyStr)
              if (data.modes) {
                // Track which folders should exist
                const activeFolders = new Set(['_meta.json'])
                for (const mode of data.modes) {
                  const folderName = sanitizeName(mode.name, mode.id)
                  activeFolders.add(folderName)
                  const dir = path.join(MODES_DIR, folderName)
                  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
                  fs.writeFileSync(path.join(dir, 'config.json'), JSON.stringify(mode, null, 2), 'utf-8')
                }
                // Remove folders for deleted/renamed modes
                fs.readdirSync(MODES_DIR).forEach((d) => {
                  const full = path.join(MODES_DIR, d)
                  if (d !== 'Default' && fs.statSync(full).isDirectory() && !activeFolders.has(d)) {
                    fs.rmSync(full, { recursive: true, force: true })
                  }
                })
                // Save meta
                fs.writeFileSync(metaFile, JSON.stringify({ activeModeId: data.activeModeId }), 'utf-8')
              }
              res.setHeader('Content-Type', 'application/json')
              res.end('{"ok":true}')
            } catch (e) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: e.message }))
            }
          }
          if (req.body) {
            handleBody(typeof req.body === 'string' ? req.body : JSON.stringify(req.body))
          } else {
            let body = ''
            req.on('data', (chunk) => { body += chunk })
            req.on('end', () => handleBody(body))
          }
        } else {
          res.statusCode = 405
          res.end('')
        }
      })

      // (old knowledge endpoint removed — moved before /api/modes)

      // Launch overlay endpoint
      let overlayProcess = null
      server.middlewares.use('/api/launch-overlay', (req, res) => {
        console.log('[Overlay API] request:', req.method, req.url)
        if (req.method === 'POST') {
          res.setHeader('Content-Type', 'application/json')
          if (overlayProcess && !overlayProcess.killed) {
            console.log('[Overlay API] already running')
            res.end(JSON.stringify({ ok: true, status: 'already running' }))
            return
          }
          const electronCli = path.resolve('node_modules/electron/cli.js')
          console.log('[Overlay API] electron cli path:', electronCli, 'exists:', fs.existsSync(electronCli))
          if (!fs.existsSync(electronCli)) {
            res.end(JSON.stringify({ error: 'Electron not installed. Run: npm install electron --save-optional' }))
            return
          }
          try {
            const mainScript = path.resolve('electron/main.cjs')
            console.log('[Overlay API] spawning:', process.execPath, electronCli, mainScript)
            overlayProcess = spawn(process.execPath, [electronCli, mainScript], {
              stdio: 'inherit', detached: false,
            })
            overlayProcess.on('exit', (code) => { console.log('[Overlay API] process exited, code:', code); overlayProcess = null })
            overlayProcess.on('error', (err) => { console.error('[Overlay API] process error:', err.message); overlayProcess = null })
            console.log('[Overlay API] Electron process launched, pid:', overlayProcess.pid)
            res.end(JSON.stringify({ ok: true, status: 'launched' }))
          } catch (e) {
            console.error('[Overlay] Launch failed:', e.message)
            res.end(JSON.stringify({ error: 'Failed to launch: ' + e.message }))
          }
        } else if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          // Check if any electron process is running (not just tracked one)
          if (overlayProcess && !overlayProcess.killed) {
            res.end(JSON.stringify({ running: true }))
          } else if (process.platform === 'win32') {
            const check = spawn('tasklist', ['/FI', 'IMAGENAME eq electron.exe', '/NH'], { shell: true })
            let output = ''
            check.stdout.on('data', d => output += d)
            check.on('close', () => {
              const running = output.includes('electron.exe')
              res.end(JSON.stringify({ running }))
            })
          } else {
            res.end(JSON.stringify({ running: false }))
          }
        } else if (req.method === 'DELETE') {
          res.setHeader('Content-Type', 'application/json')
          console.log('[Overlay API] stopping all electron processes')
          try {
            if (overlayProcess) {
              overlayProcess.kill()
              overlayProcess = null
            }
            // Force kill ALL electron processes on Windows
            if (process.platform === 'win32') {
              spawn('taskkill', ['/F', '/IM', 'electron.exe'], { shell: true })
            }
          } catch (e) { console.error('[Overlay API] kill error:', e.message) }
          overlayProcess = null
          res.end(JSON.stringify({ ok: true, status: 'stopped' }))
        } else { res.statusCode = 405; res.end('') }
      })

      // Serve overlay screenshot
      // Hide overlay window (called by ESC in overlay mode)
      server.middlewares.use('/api/overlay-hide', (req, res) => {
        if (req.method === 'POST') {
          res.setHeader('Content-Type', 'application/json')
          // The overlay window will hide itself — Electron process stays running
          console.log('[Overlay API] hide requested')
          res.end('{"ok":true}')
        } else { res.statusCode = 405; res.end('') }
      })

      server.middlewares.use('/api/overlay-screenshot', (req, res) => {
        const file = path.resolve('electron/last-capture.png')
        if (fs.existsSync(file)) {
          res.setHeader('Content-Type', 'image/png')
          res.end(fs.readFileSync(file))
        } else {
          res.statusCode = 404
          res.end('')
        }
      })

      // Ensure directory endpoint
      server.middlewares.use('/api/ensure-dir', (req, res) => {
        if (req.method === 'POST') {
          const handleBody = (bodyStr) => {
            try {
              const { dir } = JSON.parse(bodyStr)
              const full = path.resolve(dir)
              if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true })
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: true, path: full }))
            } catch (e) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: e.message }))
            }
          }
          if (req.body) { handleBody(typeof req.body === 'string' ? req.body : JSON.stringify(req.body)) }
          else { let b = ''; req.on('data', c => b += c); req.on('end', () => handleBody(b)) }
        } else { res.statusCode = 405; res.end('') }
      })

      // Config endpoint
      server.middlewares.use('/api/config', (req, res) => {
        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(readConfig()))
        } else if (req.method === 'POST') {
          let body = ''
          req.on('data', (chunk) => { body += chunk })
          req.on('end', () => {
            try {
              writeConfig(JSON.parse(body))
              res.setHeader('Content-Type', 'application/json')
              res.end('{"ok":true}')
            } catch {
              res.statusCode = 400
              res.end('{"error":"invalid json"}')
            }
          })
        } else {
          res.statusCode = 405
          res.end('')
        }
      })
      // Deck progress observations
      server.middlewares.use('/api/deck-progress', (req, res) => {
        if (req.method === 'GET') {
          const url = new URL(req.url, 'http://localhost')
          const deck = url.searchParams.get('deck')
          if (!deck) { res.statusCode = 400; res.end(JSON.stringify({ error: 'deck required' })); return }
          const file = path.resolve('decks', deck, 'progress-observations.md')
          res.setHeader('Content-Type', 'application/json')
          if (fs.existsSync(file)) {
            res.end(JSON.stringify({ content: fs.readFileSync(file, 'utf8') }))
          } else {
            res.end(JSON.stringify({ content: '' }))
          }
        } else if (req.method === 'POST') {
          let body = ''
          req.on('data', c => body += c)
          req.on('end', () => {
            try {
              const { deck, content } = JSON.parse(body)
              const dir = path.resolve('decks', deck)
              if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
              fs.writeFileSync(path.resolve(dir, 'progress-observations.md'), content, 'utf8')
              console.log('[Deck Progress] saved for:', deck)
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: true }))
            } catch (e) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: e.message }))
            }
          })
        } else { res.statusCode = 405; res.end('') }
      })

      // Discover Mode fallback store — local cache for learner profile + ledger when Anki
      // (the cloud-synced source of truth) is offline. Stored flat under discover/.
      server.middlewares.use('/api/discover-store', (req, res) => {
        const url = new URL(req.url, 'http://localhost')
        const kind = (url.searchParams.get('kind') || '').replace(/[^a-z]/gi, '')
        const mode = (url.searchParams.get('mode') || '').replace(/[^a-zA-Z0-9._-]/g, '-')
        res.setHeader('Content-Type', 'application/json')
        if (!kind || !mode) { res.statusCode = 400; res.end(JSON.stringify({ error: 'kind and mode required' })); return }
        const file = path.resolve('discover', `${kind}__${mode}.json`)
        if (req.method === 'GET') {
          if (fs.existsSync(file)) res.end(JSON.stringify({ content: fs.readFileSync(file, 'utf8') }))
          else res.end(JSON.stringify({ content: '' }))
        } else if (req.method === 'POST') {
          let body = ''
          req.on('data', c => body += c)
          req.on('end', () => {
            try {
              const { content } = JSON.parse(body)
              const dir = path.resolve('discover')
              if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
              fs.writeFileSync(file, content, 'utf8')
              res.end(JSON.stringify({ ok: true }))
            } catch (e) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: e.message }))
            }
          })
        } else { res.statusCode = 405; res.end('') }
      })

      // Chat sessions — saved to chats/ folder
      server.middlewares.use('/api/chats', (req, res) => {
        const chatsDir = path.resolve('chats')
        if (!fs.existsSync(chatsDir)) fs.mkdirSync(chatsDir, { recursive: true })

        if (req.method === 'GET') {
          // List all chat sessions
          try {
            const files = fs.readdirSync(chatsDir).filter(f => f.endsWith('.json')).sort((a, b) => {
              return fs.statSync(path.join(chatsDir, b)).mtimeMs - fs.statSync(path.join(chatsDir, a)).mtimeMs
            })
            const sessions = files.map(f => {
              try {
                const data = JSON.parse(fs.readFileSync(path.join(chatsDir, f), 'utf8'))
                return { id: f.replace('.json', ''), ...data, messages: undefined, messageCount: data.messages?.length || 0 }
              } catch { return null }
            }).filter(Boolean)
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(sessions))
          } catch (e) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: e.message }))
          }
        } else if (req.method === 'POST') {
          // Save or update a chat session
          let body = ''
          req.on('data', c => body += c)
          req.on('end', () => {
            try {
              const { id, title, messages, type } = JSON.parse(body)
              const chatId = id || Date.now().toString()
              const file = path.join(chatsDir, `${chatId}.json`)
              fs.writeFileSync(file, JSON.stringify({ title, messages, date: new Date().toISOString(), ...(type ? { type } : {}) }, null, 2), 'utf8')
              console.log('[Chat] saved:', chatId, '-', title)
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ id: chatId, ok: true }))
            } catch (e) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: e.message }))
            }
          })
        } else if (req.method === 'DELETE') {
          const url = new URL(req.url, 'http://localhost')
          const id = url.searchParams.get('id')
          if (!id) { res.statusCode = 400; res.end(JSON.stringify({ error: 'id required' })); return }
          const file = path.join(chatsDir, `${id}.json`)
          if (fs.existsSync(file)) fs.unlinkSync(file)
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ok: true }))
        } else { res.statusCode = 405; res.end('') }
      })

      // Load a single chat session
      server.middlewares.use('/api/chat-load', (req, res) => {
        const url = new URL(req.url, 'http://localhost')
        const id = url.searchParams.get('id')
        if (!id) { res.statusCode = 400; res.end(JSON.stringify({ error: 'id required' })); return }
        const file = path.resolve('chats', `${id}.json`)
        res.setHeader('Content-Type', 'application/json')
        if (fs.existsSync(file)) {
          res.end(fs.readFileSync(file, 'utf8'))
        } else {
          res.statusCode = 404
          res.end(JSON.stringify({ error: 'not found' }))
        }
      })

      // Web search proxy — uses DuckDuckGo HTML lite
      server.middlewares.use('/api/web-search', async (req, res) => {
        const url = new URL(req.url, 'http://localhost')
        const query = url.searchParams.get('q')
        if (!query) { res.statusCode = 400; res.end(JSON.stringify({ error: 'q required' })); return }
        res.setHeader('Content-Type', 'application/json')
        try {
          const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
          const resp = await fetch(ddgUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
          })
          const html = await resp.text()
          // Parse results from DuckDuckGo HTML
          const results = []
          const resultBlocks = html.split('result__body"')
          for (let i = 1; i < resultBlocks.length && results.length < 5; i++) {
            const block = resultBlocks[i]
            const titleMatch = block.match(/class="result__a"[^>]*>(.*?)<\/a>/s)
            const snippetMatch = block.match(/class="result__snippet"[^>]*>(.*?)<\/a>/s) || block.match(/class="result__snippet"[^>]*>(.*?)<\/td>/s)
            const urlMatch = block.match(/class="result__url"[^>]*>(.*?)<\/a>/s)
            if (titleMatch) {
              results.push({
                title: titleMatch[1].replace(/<[^>]+>/g, '').trim(),
                snippet: snippetMatch ? snippetMatch[1].replace(/<[^>]+>/g, '').trim() : '',
                url: urlMatch ? urlMatch[1].replace(/<[^>]+>/g, '').trim() : '',
              })
            }
          }
          console.log('[Web Search]', query, '-', results.length, 'results')
          res.end(JSON.stringify({ results }))
        } catch (e) {
          console.error('[Web Search] error:', e.message)
          res.statusCode = 500
          res.end(JSON.stringify({ error: e.message, results: [] }))
        }
      })

    },
  }
}

export default defineConfig({
  plugins: [react(), apiPlugin()],
  server: {
    port: 3000,
    open: true,
    watch: { ignored: ['**/.env', '**/config.json', '**/ankiformat.json', '**/modes/**', '**/decks/**', '**/chats/**'] },
  },
})
