// THE BANK BUILD (./bankBuild.mjs, ./build-bank.mjs, ./bank-stamp.mjs) on the INVENTED beekeeping fixture
// (./fixtures/beekeeping-fixture/): stamps, the shipping gate, cardSig, the lesson-order rule, revs, the manifest, and
// the private forbidden phrase list (tested only with an invented list in a temp folder).
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { execFileSync } from 'child_process'
import { fileURLToPath } from 'url'
import { buildBank, questionHash, validateShipped, headingsByDomain } from './bankBuild.mjs'
import { outlineGrams, verbatimProblems } from './verbatim.mjs'
import { cardSig } from '../../src/features/legends/exam/examQuestion.js'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const FIX = path.join(HERE, 'fixtures', 'beekeeping-fixture')
const read = (f) => JSON.parse(fs.readFileSync(path.join(FIX, f), 'utf8'))
const fixture = () => {
  const outline = fs.readFileSync(path.join(FIX, 'outline.md'), 'utf8')
  const grams = outlineGrams(outline)
  return {
    courseId: 'beekeeping-fixture', pkg: read('beekeeping-fixture.json'),
    sources: { '7-1.json': read('bank/7-1.json') }, stamps: { '7-1.json': read('bank/stamps/7-1.json') },
    chapters: fs.readdirSync(path.join(FIX, 'knowledge')).map((name) => ({ name, text: fs.readFileSync(path.join(FIX, 'knowledge', name), 'utf8') })),
    findCopies: (texts) => verbatimProblems(texts, grams), allowShort: true, shortReasons: read('bank/short.json'),
  }
}
const EXCLUDER = 'i7-1-a1c3e5f7'
const ESCAPE = 'i7-1-b2d4f6a8'
const edit = (f, id, patch) => { f.sources['7-1.json'] = f.sources['7-1.json'].map((q) => (q.id === id ? { ...q, ...patch } : q)); return f }

describe('the fixture bank builds clean', () => {
  const r = buildBank(fixture())
  it('no problems', () => expect(r.problems).toEqual([]))
  it('one compact file per objective, one question per line, sorted by card and slot', () => {
    const text = r.files['q-7-1.json']
    const body = JSON.parse(text)
    expect(body).toMatchObject({ course: 'beekeeping-fixture', format: 1, obj: '7.1', rev: 1 })
    expect(body.questions.map((q) => q.id)).toEqual([0, 1, 2, 3, 4, 5].map((s) => `${EXCLUDER}.${s}`).concat([0, 1, 2, 3, 4, 5].map((s) => `${ESCAPE}.${s}`)))
    expect(text.split('\n')).toHaveLength(12 + 3)
  })
  it('the manifest: format 1, per card its sig and slot codes', () => {
    const pkg = fixture().pkg
    const card = (id) => pkg.areas[0].items.find((x) => x.id === id)
    expect(r.manifest).toEqual({ course: 'beekeeping-fixture', format: 1, rev: 1, package: '1', objectives: {
      '7.1': { file: 'q-7-1.json', rev: 1, cards: {
        [EXCLUDER]: { sig: cardSig(card(EXCLUDER)), slots: 'd1d1s1s1S2A1--------', short: read('bank/short.json')[EXCLUDER] },
        [ESCAPE]: { sig: cardSig(card(ESCAPE)), slots: 'd1d1s1s1S2A1--------', short: read('bank/short.json')[ESCAPE] },
      } } } })
  })
  it('one review line per question for the domain', () => {
    const lines = r.reviews['bank-d7.jsonl'].trim().split('\n').map((l) => JSON.parse(l))
    expect(lines).toHaveLength(12)
    expect(Object.keys(lines[0])).toEqual(['id', 'obj', 'stem', 'bullets', 'ask', 'artifact', 'options', 'key', 'why', 'source'])
    expect(lines.find((l) => l.id === `${ESCAPE}.4`).key).toEqual([1, 3])
  })
  it('what ships passes the shipped-bank check', () => {
    expect(validateShipped({ manifest: r.manifest, files: r.files, pkg: fixture().pkg })).toEqual([])
  })
  it('without --allow-short, 6 questions per card is not enough', () => {
    expect(buildBank({ ...fixture(), allowShort: false }).problems.filter((p) => p.startsWith('C22'))).toHaveLength(2)
  })
  it('--allow-short without a recorded reason (or a token one) is still refused, per card', () => {
    const c22 = buildBank({ ...fixture(), shortReasons: { [ESCAPE]: 'too few' } }).problems.filter((p) => p.startsWith('C22'))
    expect(c22).toHaveLength(2) // one card has no reason, the other only a token one
    expect(c22.every((p) => p.includes('short.json'))).toBe(true)
  })
  it("a hand edit that drops a short card's reason from the manifest fails the shipped check", () => {
    const m = JSON.parse(JSON.stringify(r.manifest))
    delete m.objectives['7.1'].cards[ESCAPE].short
    const out = validateShipped({ manifest: m, files: r.files, pkg: fixture().pkg })
    expect(out).toEqual([expect.stringMatching(new RegExp(`^C22 ${ESCAPE}: .*6 questions, 10 needed`))])
  })
})

describe('the shipping gate (C21)', () => {
  it('an unstamped question is refused and nothing is written', () => {
    const f = fixture()
    delete f.stamps['7-1.json'][`${EXCLUDER}.2`]
    const r = buildBank(f)
    expect(r.problems).toEqual([`C21 ${EXCLUDER}.2: not stamped by p1, p2, p3, p4, oversight`])
    expect(r.files).toEqual({})
    expect(r.manifest).toBeNull()
  })
  it('an edit after the passes drops the question until it is passed again', () => {
    const f = edit(fixture(), `${ESCAPE}.1`, { explain: 'Only the escape board is timed to the harvest.' })
    expect(buildBank(f).problems).toEqual([`C21 ${ESCAPE}.1: changed after p1, p2, p3, p4, oversight (the stamp no longer matches the text)`])
    const q = f.sources['7-1.json'].find((x) => x.id === `${ESCAPE}.1`)
    for (const p of ['p1', 'p2', 'p3', 'p4', 'oversight']) f.stamps['7-1.json'][q.id][p] = questionHash(q)
    expect(buildBank(f).problems).toEqual([])
  })
  it('BEST and MOST questions need the second solver (p2b)', () => {
    const f = fixture()
    delete f.stamps['7-1.json'][`${ESCAPE}.5`].p2b
    expect(buildBank(f).problems).toEqual([`C21 ${ESCAPE}.5: not stamped by p2b`])
  })
  it('rev is not part of the hash; key order is', () => {
    const q = fixture().sources['7-1.json'][0]
    expect(questionHash({ ...q, rev: 9 })).toBe(questionHash(q))
    expect(questionHash(Object.fromEntries(Object.entries(q).reverse()))).toBe(questionHash(q))
    expect(questionHash({ ...q, explain: `${q.explain} ` })).not.toBe(questionHash(q))
  })
  it('a preview lists every question, clean ones too, with their stamps', () => {
    const r = buildBank({ ...fixture(), preview: true })
    expect(r.preview.questions).toHaveLength(12)
    expect(r.preview.questions.every((x) => x.findings.length === 0 && Object.values(x.stamps).every((s) => s === 'ok'))).toBe(true)
    expect(r.preview.questions[0].front).toBe('Queen excluder')
  })
  it('a preview needs no stamps and reports each pass', () => {
    const f = fixture()
    f.stamps = {}
    const r = buildBank({ ...f, preview: true })
    expect(r.problems).toEqual([])
    expect(r.files).toEqual({})
    expect(r.preview.questions).toHaveLength(12)
    expect(r.preview.questions.find((x) => x.q.id === `${ESCAPE}.5`).stamps).toEqual({ p1: 'missing', p2: 'missing', p2b: 'missing', p3: 'missing', p4: 'missing', oversight: 'missing' })
  })
})

describe('refusals', () => {
  it('a cardSig that no longer matches the card (the card changed after the passes)', () => {
    const f = fixture()
    const card = f.pkg.areas[0].items.find((x) => x.id === EXCLUDER)
    card.back = card.back.replace('all season', 'the whole season')
    const p = buildBank(f).problems
    expect(p.filter((x) => x.startsWith('C18'))).toHaveLength(6)
  })
  it('a key not among the options', () => {
    const f = fixture()
    const q = f.sources['7-1.json'][0]
    q.options = q.options.map((o) => ({ ...o, ok: false }))
    expect(buildBank(f).problems).toContain(`C1 ${EXCLUDER}.0: exactly 1 option(s) must have ok true`)
  })
  it('a stem that gives the answer away', () => {
    const f = edit(fixture(), `${ESCAPE}.2`, { stem: 'On harvest morning, a beekeeper wants to lift off the full honey boxes without carrying thousands of bees to the kitchen. A bee escape board would do it.' })
    expect(buildBank(f).problems).toContain(`C9 ${ESCAPE}.2: the stem gives away the answer "A bee escape board"`)
  })
  it('a question in the wrong objective file', () => {
    const f = fixture()
    f.sources['7-2.json'] = [f.sources['7-1.json'].pop()]
    expect(buildBank(f).problems.some((p) => /in 7-2\.json, but obj is 7\.1/.test(p))).toBe(true)
  })
  it('no outline: the own-words check cannot run, so the build fails', () => {
    expect(buildBank({ ...fixture(), findCopies: null }).problems[0]).toMatch(/C19 own words: the outline is missing/)
  })
})

describe('C16 against the package lesson order', () => {
  it('a level 1 wrong option taught by a LATER lesson of the objective is refused', () => {
    const f = fixture()
    // Split the one lesson in two: the escape board is now taught AFTER the excluder.
    f.pkg.areas[0].lessons = [{ section: '7.1', title: 'Grids', itemIds: [EXCLUDER] }, { section: '7.1', title: 'Exits', itemIds: [ESCAPE] }]
    const p = buildBank(f).problems.filter((x) => x.startsWith('C16'))
    // The excluder's level 1 questions name the escape board as a wrong option (slots 0 to 3).
    expect(p.map((x) => x.split(':')[0]).sort()).toEqual([0, 1, 2, 3].map((s) => `C16 ${EXCLUDER}.${s}`))
  })
})

describe('revs', () => {
  it('stay the same on an unchanged rebuild and rise when an objective changes', () => {
    const first = buildBank(fixture())
    const again = buildBank({ ...fixture(), previous: { manifest: first.manifest, files: first.files } })
    expect(again.manifest.rev).toBe(1)
    expect(again.files['q-7-1.json']).toBe(first.files['q-7-1.json'])
    const f = edit(fixture(), `${ESCAPE}.1`, { rev: 2, explain: 'Only the escape board is timed to the harvest.' })
    const q = f.sources['7-1.json'].find((x) => x.id === `${ESCAPE}.1`)
    for (const p of ['p1', 'p2', 'p3', 'p4', 'oversight']) f.stamps['7-1.json'][q.id][p] = questionHash(q)
    const changed = buildBank({ ...f, previous: { manifest: first.manifest, files: first.files } })
    expect(changed.problems).toEqual([])
    expect(changed.manifest.rev).toBe(2)
    expect(changed.manifest.objectives['7.1'].rev).toBe(2)
  })
  it('a shipped question whose text changed must raise its rev', () => {
    const first = buildBank(fixture())
    const f = edit(fixture(), `${ESCAPE}.1`, { explain: 'Only the escape board is timed to the harvest.' })
    const q = f.sources['7-1.json'].find((x) => x.id === `${ESCAPE}.1`)
    for (const p of ['p1', 'p2', 'p3', 'p4', 'oversight']) f.stamps['7-1.json'][q.id][p] = questionHash(q)
    expect(buildBank({ ...f, previous: { manifest: first.manifest, files: first.files } }).problems).toEqual([`rev ${ESCAPE}.1: the text changed since it shipped, raise rev above 1`])
  })
})

describe('chapters for C20', () => {
  it('an objective reads its domain chapters (latest pass per prefix) and the reference chapter d0', () => {
    const h = headingsByDomain([
      { name: 'd7-knowledge.r1.md', text: '# A\n### Old heading\n' },
      { name: 'd7-knowledge.r2.md', text: '# A\n### New heading\n' },
      { name: 'd7b-knowledge.md', text: '### Second part\n' },
      { name: 'd0-knowledge.r3.md', text: '### Exact numbers\n' },
      { name: 'd8-knowledge.r2.md', text: '### Other domain\n' },
    ])
    expect([...h('7.1')].sort()).toEqual(['A', 'Exact numbers', 'New heading', 'Second part'])
  })
})

// THE COMMAND LINE: the real scripts on a temp copy of the fixture, never on public/ or the private list.
describe('build-bank.mjs and bank-stamp.mjs from the command line', () => {
  const run = (script, args) => {
    try { return { code: 0, out: execFileSync(process.execPath, [path.join(HERE, script), ...args], { encoding: 'utf8' }) } }
    catch (e) { return { code: e.status, out: `${e.stdout || ''}${e.stderr || ''}` } }
  }
  const tempCopy = () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ebiki-bank-'))
    fs.cpSync(FIX, path.join(dir, 'src'), { recursive: true })
    return dir
  }
  const args = (dir, extra = []) => ['beekeeping-fixture', '--src', path.join(dir, 'src'), '--package', path.join(dir, 'src', 'beekeeping-fixture.json'),
    '--out', path.join(dir, 'bank'), '--reviews', path.join(dir, 'reviews'), '--allow-short', ...extra]

  it('prints "no problems" and writes the bank; a missing phrase list is one warning', () => {
    const dir = tempCopy()
    const r = run('build-bank.mjs', args(dir, ['--phrases', path.join(dir, 'none.json')]))
    expect(r.code).toBe(0)
    expect(r.out).toMatch(/warning: no forbidden phrase list/)
    expect(r.out.trim().split('\n').pop()).toBe('no problems')
    expect(fs.readdirSync(path.join(dir, 'bank')).sort()).toEqual(['manifest.json', 'q-7-1.json'])
    expect(fs.existsSync(path.join(dir, 'reviews', 'bank-d7.jsonl'))).toBe(true)
  }, 30000)
  it('refuses a question near-matching an (invented) forbidden phrase, without printing the phrase', () => {
    const dir = tempCopy()
    const list = path.join(dir, 'phrases.json')
    fs.writeFileSync(list, JSON.stringify({ phrases: ['a drowsy swarm hums beside the meadow gate at noon', 'thousands of bees to the kitchen'] }))
    const r = run('build-bank.mjs', args(dir, ['--phrases', list]))
    expect(r.code).toBe(1)
    expect(r.out).toMatch(new RegExp(`CF ${ESCAPE}\\.2: stem near-matches forbidden phrase #2`))
    expect(r.out).not.toMatch(/kitchen/)
    expect(fs.existsSync(path.join(dir, 'bank'))).toBe(false)
  }, 30000)
  it('bank-stamp stamps the text as it is, and an edit afterwards is refused', () => {
    const dir = tempCopy()
    const qf = path.join(dir, 'src', 'bank', '7-1.json')
    const qs = JSON.parse(fs.readFileSync(qf, 'utf8'))
    qs[0].explain = 'A queen excluder lets workers through and keeps the queen below.'
    fs.writeFileSync(qf, JSON.stringify(qs, null, 1))
    expect(run('build-bank.mjs', args(dir, ['--phrases', path.join(dir, 'none.json')])).out).toMatch(/C21 i7-1-a1c3e5f7\.0: changed after p1, p2, p3, p4, oversight/)
    for (const p of ['p1', 'p2', 'p3', 'p4', 'oversight']) expect(run('bank-stamp.mjs', [p, '7.1', 'i7-1-a1c3e5f7.0', '--src', path.join(dir, 'src')]).out).toMatch(/stamped .* on 1 question/)
    expect(run('build-bank.mjs', args(dir, ['--phrases', path.join(dir, 'none.json')])).code).toBe(0)
  }, 60000)
})
