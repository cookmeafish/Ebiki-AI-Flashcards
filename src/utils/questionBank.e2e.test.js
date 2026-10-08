// Question reuse end to end: the client decision (createQuestionReuse) wired to the REAL /api/question-bank
// handler on a temp data folder, plus rotation properties. See questionBank.js for the rules.
import { describe, it, expect, vi, afterAll, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { EventEmitter } from 'events'
import { createQuestionBankRoute } from '../server/questionBankRoute.js'
import { createQuestionReuse, reuseSettings, pickSavedSet, addSet, markAsked, questionSignature } from './questionBank'
import { rng as seeded } from './testRng'

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'ebiki-qbank-'))
process.env.EBIKI_DATA_DIR = DIR
process.env.EBIKI_ENV_DIR = DIR
const { deckDirName, folderKey } = await import('../../vite.config.js')
afterAll(() => fs.rmSync(DIR, { recursive: true, force: true }))
beforeEach(() => fs.rmSync(path.join(DIR, 'decks'), { recursive: true, force: true }))

const writeFileAtomic = (file, text) => { const tmp = `${file}.${process.pid}.tmp`; fs.writeFileSync(tmp, text); fs.renameSync(tmp, file) }
const readUtf8 = (file) => fs.readFileSync(file, 'utf8').replace(/^﻿/, '')
const route = createQuestionBankRoute({ dataPath: (...s) => path.join(DIR, ...s), deckDirName, folderKey, readUtf8, writeFileAtomic, fs, path })

// One request through the real handler: { status, body }.
const call = (method, query, body) => new Promise((resolve) => {
  const req = new EventEmitter(); req.method = method; req.url = `/?${query}`
  const res = { statusCode: 200, headers: {}, setHeader(k, v) { this.headers[k] = v }, end(t) { resolve({ status: this.statusCode, body: t ? JSON.parse(t) : null }) } }
  route(req, res)
  if (method === 'POST') { req.emit('data', body == null ? '' : JSON.stringify(body)); req.emit('end') }
})
const qs = (deck, note) => `deck=${encodeURIComponent(deck)}${note != null ? `&note=${note}` : ''}`
// What loadBank/saveBank do over HTTP, minus the fetch.
const load = async (deck, note) => { const r = await call('GET', qs(deck, note)); return r.status === 200 ? { ok: true, bank: r.body.bank && typeof r.body.bank === 'object' ? r.body.bank : null } : { ok: false, bank: null } }
const save = async (deck, note, bank) => (await call('POST', qs(deck, note), { bank })).status === 200
const decksDir = () => path.join(DIR, 'decks')
const q = (text) => ({ question: text, type: 'recall', acceptedAnswers: ['x'], _session: 'drop me' })
const parts = { front: 'perro', back: 'dog', learnLang: 'Spanish', quizLang: 'English', perCard: 3 }
const settle = () => new Promise((r) => setTimeout(r, 20))

describe('/api/question-bank handler', () => {
  it('GET of a note with nothing saved is null; POST then GET round-trips', async () => {
    expect((await call('GET', qs('Spanish', 5))).body).toEqual({ bank: null })
    const bank = { v: 2, sets: [{ id: 'a', text: 't', sig: 's', questions: [q('one')] }] }
    expect((await call('POST', qs('Spanish', 5), { bank })).body).toEqual({ ok: true })
    expect((await call('GET', qs('Spanish', 5))).body.bank).toEqual(bank)
  })
  it('refuses a missing deck, a non-numeric note and a body without sets', async () => {
    expect((await call('GET', qs('  ', 5))).status).toBe(400)
    expect((await call('GET', qs('Spanish', '../x'))).status).toBe(400)
    expect((await call('POST', qs('Spanish', 5), { bank: { sets: 'no' } })).status).toBe(400)
    expect((await call('POST', qs('Spanish', 5), null)).status).toBe(400)
  })
  it('never leaves decks/: subdecks and hostile names map to one safe folder', async () => {
    for (const deck of ['Spanish::Verbs', '../../evil', 'a/b\\c', 'Vol. 1.', '..']) {
      await call('POST', qs(deck, 1), { bank: { v: 2, sets: [] } })
    }
    const made = fs.readdirSync(decksDir()).sort()
    expect(made).toEqual(['Spanish--Verbs', 'Vol. 1', '_', '.._.._evil', 'a_b_c'].sort())
    expect(fs.readdirSync(DIR).filter((d) => d !== 'decks')).toEqual([])
  })
  it('only a missing or damaged file reads as nothing saved; any other read error is a 500', async () => {
    const dir = path.join(decksDir(), 'Spanish', 'questions')
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, '7.json'), '{"sets": [ truncated')
    expect((await call('GET', qs('Spanish', 7))).body).toEqual({ bank: null })
    fs.mkdirSync(path.join(dir, '8.json')) // EISDIR: unreadable, not absent
    expect((await call('GET', qs('Spanish', 8))).status).toBe(500)
  })
  it('DELETE with exact=1 clears the deck and the subdecks Anki named, never a look-alike deck', async () => {
    for (const deck of ['Grammar', 'Grammar::Verbs', 'Grammar--Advanced', 'Other']) await call('POST', qs(deck, 1), { bank: { v: 2, sets: [] } })
    const r = await call('DELETE', `${qs('Grammar')}&exact=1&also=${encodeURIComponent('Grammar::Verbs')}`)
    expect(r.body).toEqual({ ok: true, removed: 2 })
    expect((await load('Grammar--Advanced', 1)).bank).toEqual({ v: 2, sets: [] })
    expect((await load('Other', 1)).bank).toEqual({ v: 2, sets: [] })
  })
  it('DELETE without Anki\'s list falls back to folder prefixes', async () => {
    for (const deck of ['Grammar', 'Grammar::Verbs', 'Grammarian']) await call('POST', qs(deck, 1), { bank: { v: 2, sets: [] } })
    expect((await call('DELETE', qs('Grammar'))).body).toEqual({ ok: true, removed: 2 })
    expect((await load('Grammarian', 1)).bank).not.toBe(null)
  })
})

describe('question reuse, client + real handler', () => {
  const harness = (settings) => {
    const st = { settings, epoch: 0 }
    const reuse = createQuestionReuse({ getSettings: () => st.settings, getEpoch: () => st.epoch, load, save })
    return { st, reuse }
  }
  const card = { note: 42, deckName: 'Spanish::Verbs' }
  let n = 0
  const gen = () => vi.fn(async () => { n++; return [q(`g${n}a`), q(`g${n}b`), q(`g${n}c`)] })

  it('OFF means off: no folder is ever created', async () => {
    const h = harness({ enabled: false, maxPerCard: 3 })
    for (let i = 0; i < 3; i++) await h.reuse(card, parts, 3, gen())
    await settle()
    expect(fs.existsSync(decksDir())).toBe(false)
  })
  it('saves sets until the cap, then rotates the saved sets on disk, least recently asked first', async () => {
    const h = harness({ enabled: true, maxPerCard: 6 })
    const g = gen()
    const a = await h.reuse(card, parts, 3, g); await settle()
    const b = await h.reuse(card, parts, 3, g); await settle()
    expect(g).toHaveBeenCalledTimes(2)
    const disk = (await load(card.deckName, card.note)).bank
    expect(disk.sets).toHaveLength(2)
    expect(disk.sets[0].questions[0]).not.toHaveProperty('_session') // session state never saved
    const seen = []
    for (let i = 0; i < 4; i++) { seen.push((await h.reuse(card, parts, 3, g))[0].question); await settle() }
    expect(g).toHaveBeenCalledTimes(2)
    expect(seen).toEqual([a[0].question, b[0].question, a[0].question, b[0].question])
  })
  it('a clear during a generation is not written back', async () => {
    const h = harness({ enabled: true, maxPerCard: 10 })
    const g = vi.fn(async () => { await call('DELETE', qs(card.deckName)); h.st.epoch++; return [q('x')] })
    await h.reuse(card, parts, 1, g); await settle()
    expect((await load(card.deckName, card.note)).bank).toBe(null)
  })
  it('a damaged saved set is skipped and replaced by a fresh one', async () => {
    const key = questionSignature(parts)
    await save(card.deckName, card.note, addSet(null, key, [{ type: 'recall' }, { question: '' }, null], 1))
    const h = harness({ enabled: true, maxPerCard: 3 })
    const g = gen()
    const out = await h.reuse(card, parts, 3, g)
    expect(g).toHaveBeenCalledTimes(1)
    expect(out[0].question).toMatch(/^g\d+a$/)
  })
  it('the next ask waits for a save still in flight (up to 3s), then reuses it', async () => {
    let release
    const slowSave = vi.fn(async (d, nn, bank) => { await new Promise((r) => { release = r }); return save(d, nn, bank) })
    const st = { settings: { enabled: true, maxPerCard: 3 } }
    const reuse = createQuestionReuse({ getSettings: () => st.settings, load, save: slowSave })
    const g = gen()
    await reuse(card, parts, 3, g)
    const second = reuse(card, parts, 3, g)
    await settle(); release(); await settle(); release?.()
    await second
    expect(g).toHaveBeenCalledTimes(1)
  })
  it('a hung save holds the next ask for at most 3 seconds', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout'] })
    try {
      const st = { settings: { enabled: true, maxPerCard: 10 } }
      const reuse = createQuestionReuse({ getSettings: () => st.settings, load, save: () => new Promise(() => {}) })
      const other = { note: 99, deckName: 'Hung' }
      await reuse(other, parts, 1, async () => [q('first')])
      let done = false
      const p = reuse(other, parts, 1, async () => [q('second')]).then(() => { done = true })
      await vi.advanceTimersByTimeAsync(2900); expect(done).toBe(false)
      await vi.advanceTimersByTimeAsync(200); await p
      expect(done).toBe(true)
    } finally { vi.useRealTimers() }
  })
  it('rotation of a set that was cleared meanwhile writes nothing', async () => {
    const key = questionSignature(parts)
    await save(card.deckName, card.note, addSet(null, key, [q('s1'), q('s2'), q('s3')], 1))
    let calls = 0
    const loadThenClear = async (d, nn) => { const r = await load(d, nn); if (++calls === 1) await call('DELETE', qs(d)); return r }
    const st = { settings: { enabled: true, maxPerCard: 3 } }
    const spySave = vi.fn(save)
    const reuse = createQuestionReuse({ getSettings: () => st.settings, load: loadThenClear, save: spySave })
    const out = await reuse(card, parts, 3, async () => { throw new Error('should reuse') })
    await settle()
    expect(out[0].question).toBe('s1')
    expect(spySave).not.toHaveBeenCalled()
  })
})

describe('reuseSettings', () => {
  it('a cleared cap means the default, not 1', () => {
    expect(reuseSettings({ enabled: true, maxPerCard: null }).maxPerCard).toBe(10)
    expect(reuseSettings({ enabled: true, maxPerCard: '' }).maxPerCard).toBe(10)
    expect(reuseSettings({ enabled: true, maxPerCard: '4' }).maxPerCard).toBe(4)
  })
})

describe('rotation properties', () => {
  const key = questionSignature(parts)
  it('every saved set is asked equally often, and no set repeats before the others had a turn', () => {
    const rng = seeded(20261007).next
    for (let trial = 0; trial < 200; trial++) {
      const nSets = 1 + Math.floor(rng() * 8)
      let bank = null
      for (let i = 0; i < nSets; i++) bank = addSet(bank, key, [q(`s${i}`)], Math.floor(rng() * 1000))
      const rounds = 1 + Math.floor(rng() * 5)
      const counts = new Map()
      const order = []
      let now = 10_000
      for (let i = 0; i < nSets * rounds; i++) {
        const set = pickSavedSet(bank, key, 1, nSets) // cap reached: always reuse
        expect(set).not.toBe(null)
        order.push(set.id)
        counts.set(set.id, (counts.get(set.id) || 0) + 1)
        bank = markAsked(bank, set.id, (now += 1 + Math.floor(rng() * 50)))
      }
      expect([...counts.values()].every((c) => c === rounds)).toBe(true)
      for (let i = 0; i + nSets <= order.length; i++) expect(new Set(order.slice(i, i + nSets)).size).toBe(nSets)
    }
  })
  it('a new set is generated exactly while one more would fit under the cap', () => {
    const rng = seeded(77).next
    for (let trial = 0; trial < 300; trial++) {
      const setSize = 1 + Math.floor(rng() * 5)
      const cap = 1 + Math.floor(rng() * 20)
      let bank = null
      const nSets = Math.floor(rng() * 6)
      for (let i = 0; i < nSets; i++) bank = addSet(bank, key, Array.from({ length: setSize }, (_, j) => q(`${i}.${j}`)), i)
      const have = nSets * setSize
      const pick = pickSavedSet(bank, key, setSize, cap)
      expect(pick === null).toBe(nSets === 0 || have + setSize <= cap)
    }
  })
})

afterEach(() => vi.useRealTimers())
