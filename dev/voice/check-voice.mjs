// VOICE MODE END TO END, the way a user with only an Anthropic key and default settings has it (the path that once
// failed with "I didn't catch that"). Run after ANY change to voice mode, speech or the mic:
//   npm run dev:agent   (port 3001)   then   node dev/voice/check-voice.mjs [outDir]
// Chromium's FAKE MICROPHONE plays a real spoken sentence (speech-pause.wav: "How do I say good morning in Spanish?"
// then 3 s of silence), so the whole chain runs for real: mic level, turn end by silence, the free on-device
// recognizer (downloads its model the first time), Chat's reply (Anthropic stubbed, nothing paid), Ebi speaking
// (device voice, muted). Every data write is stubbed. Exit 1 on any failure.
// Part 1 probes the browser's own recognizer on the same audio and prints what it returns (the root cause: in
// Chromium builds other than Google Chrome it hears nothing). Part 3: a silent mic must say so.
import os from 'os'
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const DEPS = process.env.EBIKI_DRIVE_DEPS || path.join(os.homedir(), '.ebiki-drive')
const { chromium } = await import(pathToFileURL(path.join(DEPS, 'node_modules', 'playwright-core', 'index.mjs')).href)
const OUT = process.argv[2] || path.join(os.tmpdir(), 'ebiki-voice-check')
fs.mkdirSync(OUT, { recursive: true })
const APP = process.env.APP_URL || 'http://localhost:3001/'
const SAID = /good morning/i
const REPLY = 'In Spanish you say **buenos días**. Try it back to me!'
const FAKE_KEY = ['sk', 'ant', 'test', 'x'.repeat(24)].join('-') // a fake key, never sent anywhere real
const failures = []
const check = (ok, what) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}`); if (!ok) failures.push(what) }
const launch = (wav) => chromium.launch({ args: ['--mute-audio', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-audio-capture=${path.join(HERE, wav)}`, '--autoplay-policy=no-user-gesture-required'] })

async function appPage(browser, onAnthropic) {
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 860 }, permissions: ['microphone'] })).newPage()
  await page.addInitScript(() => {
    try {
      window.__spoken = []; window.speechSynthesis.speak = (u) => { window.__spoken.push(u.text); setTimeout(() => u.onend && u.onend(), 300) }
      // Track every mic stream and worker, to prove nothing keeps running after voice mode closes.
      window.__tracks = []; window.__workers = 0
      const gum = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices)
      navigator.mediaDevices.getUserMedia = async (c) => { const st = await gum(c); window.__tracks.push(...st.getTracks()); return st }
      const W = window.Worker
      window.__workerUrls = []; window.Worker = class extends W { constructor(u, ...a) { super(u, ...a); this.__u = String(u); if (/whisper/i.test(this.__u)) { window.__workers++; window.__workerUrls.push(new Error().stack.split(String.fromCharCode(10)).slice(2, 9).map((l) => l.trim().replace(/https?:\/\/[^/]+/, '').replace(/\?[^:)]*/, '')).join(' < ')) } } terminate() { if (/whisper/i.test(this.__u)) window.__workers--; return super.terminate() } } // only the speech recognizer's worker counts
    } catch {}
  })
  await page.route('https://api.anthropic.com/**', onAnthropic)
  for (const host of ['https://api.openai.com/**', 'https://generativelanguage.googleapis.com/**', 'https://api.x.ai/**']) await page.route(host, (r) => r.fulfill({ status: 500, body: 'not used' }))
  await page.route('**/api/**', async (r) => {
    const u = new URL(r.request().url()); const m = r.request().method()
    if (u.pathname === '/api/keys' && m === 'GET') return r.fulfill({ json: { anthropic: FAKE_KEY } })
    if (u.pathname === '/api/chatgpt/status') return r.fulfill({ json: { signedIn: false } })
    if (u.pathname === '/api/config' && m === 'GET') {
      const res = await r.fetch(); const j = await res.json()
      Object.assign(j, { provider: 'anthropic', lastModelCheck: Date.now(), activeTab: 'chat', appLanguage: 'en', onboarded: true })
      if (j.features) delete j.features.speech // default speech settings ("auto")
      return r.fulfill({ response: res, json: j })
    }
    if (u.pathname.startsWith('/api/chat') && m === 'GET' && !u.pathname.startsWith('/api/chatgpt')) return r.fulfill({ json: u.pathname === '/api/chats' ? [] : {} })
    if (m !== 'GET') return r.fulfill({ status: 200, json: { ok: true, id: 'voice-check' } })
    return r.continue()
  })
  await page.goto(APP)
  await page.waitForTimeout(4500)
  for (let i = 0; i < 3 && await page.locator('[data-app-dialog] button').count(); i++) { await page.locator('[data-app-dialog] button').last().click(); await page.waitForTimeout(300) }
  const nav = page.getByRole('button', { name: /^Chat$/ }).first()
  if (await nav.count()) await nav.click().catch(() => {})
  await page.waitForTimeout(1000)
  await page.getByRole('button', { name: /Voice mode/ }).first().click()
  return page
}

// ── Part 1: the browser's own recognizer on the same audio (diagnosis only).
{
  const browser = await launch('speech-pause.wav')
  const page = await (await browser.newContext({ permissions: ['microphone'] })).newPage()
  await page.route('**/*', (r) => r.fulfill({ contentType: 'text/html', body: '<!doctype html><title>probe</title>' }))
  await page.goto(APP)
  const r = await page.evaluate(() => new Promise((resolve) => {
    const R = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!R) return resolve({ exists: false })
    const rec = new R(); rec.lang = 'en-US'; const log = []
    rec.onresult = (e) => log.push('result:' + [...e.results].map((x) => x[0].transcript).join(' '))
    rec.onerror = (e) => log.push('error:' + e.error)
    rec.onend = () => resolve({ exists: true, log })
    try { rec.start() } catch (e) { resolve({ exists: true, log: ['throw:' + e.message] }) }
    setTimeout(() => { try { rec.stop() } catch {} }, 9000)
  }))
  console.log('Browser recognizer on the same audio (diagnosis):', JSON.stringify(r))
  await browser.close()
}

// ── Part 2: voice mode in the real app, default settings, Anthropic key only.
{
  const browser = await launch('speech-pause.wav')
  let asked = ''
  const errors = []
  const page = await appPage(browser, async (r) => {
    if (/messages/.test(r.request().url())) { asked += r.request().postData() || ''; return r.fulfill({ json: { id: 'x', type: 'message', role: 'assistant', content: [{ type: 'text', text: REPLY }], stop_reason: 'end_turn', usage: { input_tokens: 5, output_tokens: 5 } } }) }
    return r.fulfill({ json: { data: [] } })
  })
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => { if (process.env.VOICE_DEBUG && /voice|whisper|speech/i.test(m.text())) console.log('  [page]', m.text().slice(0, 300)) })
  const state = () => page.locator('[data-voice-panel]').getAttribute('data-voice-panel').catch(() => 'none')
  const panel = await page.locator('[data-voice-panel]').innerText().catch(() => '')
  check(/On this computer/.test(panel), 'the free on-device recognizer is chosen by default')
  let peak = 0; const t0 = Date.now()
  while (Date.now() - t0 < 4000) { peak = Math.max(peak, Number(await page.locator('[data-mic-level]').getAttribute('data-mic-level').catch(() => 0)) || 0); await page.waitForTimeout(80) }
  check(peak > 20, `the mic level bar moves with the voice (peak ${peak})`)
  await page.screenshot({ path: path.join(OUT, '1-hearing.png') })
  const seen = new Set(); const t1 = Date.now()
  while (Date.now() - t1 < 240000) {
    const s = await state(); seen.add(s)
    if (/speaking/.test(s) || (s === 'idle' && seen.has('thinking'))) break
    if (seen.has('transcribing') && s === 'listening' && Date.now() - t1 > 30000 && !seen.has('thinking')) break
    await page.waitForTimeout(250)
  }
  console.log('States seen:', [...seen].join(' > '))
  await page.waitForTimeout(1500)
  await page.screenshot({ path: path.join(OUT, '2-after-turn.png') })
  check(SAID.test(asked), `the spoken sentence reached Chat as text (${(asked.match(/[^"\\]{0,20}good morning[^"\\]{0,30}/i) || ['nothing sent'])[0]})`)
  const spoken = await page.evaluate(() => window.__spoken.join(' | '))
  check(/buenos días/i.test(spoken) && !/\*\*/.test(spoken), `Ebi spoke the reply without markdown (${spoken.slice(0, 80) || 'nothing'})`)
  const chatText = await page.locator('main').innerText()
  check(SAID.test(chatText) && /buenos días/i.test(chatText), 'the turn shows in the chat')
  // ONLY WHILE ACTIVE: End closes it; then no live mic track, no recognizer worker, no new AI call or speech.
  await page.getByRole('button', { name: /End/ }).first().click().catch(() => {})
  await page.waitForTimeout(1500)
  const before = { asked: asked.length, spoken: (await page.evaluate(() => window.__spoken.length)) }
  await page.waitForTimeout(6000)
  const after = await page.evaluate(() => ({ live: window.__tracks.filter((x) => x.readyState === 'live').length, workers: window.__workers, spoken: window.__spoken.length, panel: !!document.querySelector('[data-voice-panel]') }))
  check(!after.panel && after.live === 0, `after End: panel closed, mic released (live tracks ${after.live})`)
  check(after.workers === 0, `after End: the on-device recognizer is unloaded (workers ${after.workers})`)
  check(asked.length === before.asked && after.spoken === before.spoken, 'after End: no more AI calls or speech')
  // Leaving Chat closes it too.
  await page.screenshot({ path: path.join(OUT, '2b-after-end.png') })
  // The day-streak celebration may show now (held while voice mode ran): dismiss it like a learner would.
  const cont = page.getByRole('button', { name: /^Continue$/i })
  if (await cont.count()) { await cont.first().click(); await page.waitForTimeout(600) }
  const cover = await page.evaluate(() => { const b = [...document.querySelectorAll('button[aria-label^="Voice mode"]')][0]; if (!b) return 'no button'; const r = b.getBoundingClientRect(); const el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return el === b || b.contains(el) ? 'free' : (el?.outerHTML || '').slice(0, 300) })
  check(cover === 'free', `after End nothing covers the voice button (${cover.slice(0, 160)})`)
  await page.getByRole('button', { name: /Voice mode/ }).first().click({ force: true })
  await page.waitForTimeout(3000)
  const openNow = await page.evaluate(() => ({ live: window.__tracks.filter((x) => x.readyState === 'live').length, panel: !!document.querySelector('[data-voice-panel]') }))
  check(openNow.panel && openNow.live > 0, `reopened: listening again (live tracks ${openNow.live})`)
  // The ways a learner leaves: Esc, and the mouse's Back button / Alt+Left.
  for (const [how, act] of [['Esc', () => page.keyboard.press('Escape')], ['Back', () => page.goBack({ timeout: 3000 }).catch(() => {})]]) { // Back = history back, like the mouse's Back button (headless has no Alt+Left: that is browser UI)) {
    if (how === 'Back') {
      await page.getByRole('button', { name: /Voice mode/ }).first().click({ force: true })
      await page.waitForTimeout(3000)
      check(await page.locator('[data-voice-panel]').count() > 0, 'reopened right after Esc: voice mode stays open')
    }
    await page.evaluate(() => {
      window.__sameDoc = true; window.__gone = 0
      new MutationObserver(() => { if (!window.__gone && !document.querySelector('[data-voice-panel]')) window.__gone = performance.now() }).observe(document.documentElement, { childList: true, subtree: true })
      const W2 = window.Worker
      window.Worker = class extends W2 { constructor(...a) { super(...a); window.__madeAt = performance.now() } }
    })
    const urlBefore = page.url()
    if (process.env.VOICE_DEBUG) await page.screenshot({ path: path.join(OUT, `9-before-${how}.png`) })
    await act()
    if (process.env.VOICE_DEBUG) { await page.waitForTimeout(300); await page.screenshot({ path: path.join(OUT, `9-after-${how}.png`) }) }
    await page.waitForTimeout(4000)
    if (process.env.VOICE_DEBUG) console.log('   ', how, 'url', urlBefore, '->', page.url(), '| same document:', await page.evaluate(() => !!window.__sameDoc), '| panel gone at', await page.evaluate(() => Math.round(window.__gone)), '| worker made at', await page.evaluate(() => Math.round(window.__madeAt || 0)))
    const away = await page.evaluate(() => ({ live: window.__tracks.filter((x) => x.readyState === 'live').length, workers: window.__workers, panel: !!document.querySelector('[data-voice-panel]') }))
    check(!away.panel && away.live === 0, `${how} closes voice mode and releases the mic at once (live tracks ${away.live})`)
    if (process.env.VOICE_DEBUG && away.workers) console.log('   worker made by:', (await page.evaluate(() => window.__workerUrls.at(-1))))
  }
  // THE GUARANTEE: some seconds after leaving, nothing of voice mode is left: no mic, no recognizer, no AI call.
  const askedAtLeave = asked.length
  await page.waitForTimeout(17000)
  const gone = await page.evaluate(() => ({ live: window.__tracks.filter((x) => x.readyState === 'live').length, workers: window.__workers }))
  check(gone.live === 0 && gone.workers === 0 && asked.length === askedAtLeave, `17 s after leaving: nothing left running (mic tracks ${gone.live}, recognizer ${gone.workers}, new AI calls ${asked.length === askedAtLeave ? 0 : 'yes'})`)
  check(!errors.length, `no page errors${errors.length ? ': ' + errors.join(' / ') : ''}`)
  await browser.close()
}

// ── Part 3: a SILENT mic says so.
{
  const browser = await launch('silence.wav')
  const page = await appPage(browser, (r) => r.fulfill({ json: { data: [] } }))
  await page.waitForTimeout(6000)
  const txt = await page.locator('[data-voice-panel]').innerText().catch(() => '')
  check(/can't hear anything/i.test(txt), 'a silent mic shows "I can\'t hear anything"')
  await page.screenshot({ path: path.join(OUT, '3-silent-mic.png') })
  await browser.close()
}

console.log(`\nScreenshots: ${OUT}`)
console.log(failures.length ? `FAILED: ${failures.length}` : 'ALL PASS')
process.exit(failures.length ? 1 : 0)
