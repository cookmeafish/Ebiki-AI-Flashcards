// Checks C1 to C23 (examChecks.js): an invented passing and failing case for each. Pottery only (testFixtures.js);
// the forbidden-phrase cases use invented phrases, never the private list.
import { describe, it, expect } from 'vitest'
import { courseIndex, checkQuestion, checkSet, checkOwnWords, checkStamps, checkForbidden, phraseHit, fold, contentWords, ipv6Candidates, stemKey } from './examChecks.js'
import { cardSig } from './examQuestion.js'
import { potteryPackage, potteryExample, potteryLevel1, POTTERY_CARDS, POTTERY_HEADINGS } from './testFixtures.js'
import { outlineGrams, verbatimProblems } from '../../../../dev/careers/verbatim.mjs'

const EM = String.fromCharCode(0x2014)
const EN = String.fromCharCode(0x2013)
const ctxFor =(pkg = potteryPackage()) => ({ ...courseIndex(pkg), headingsFor: () => POTTERY_HEADINGS })
const ctx = ctxFor()
const sigOf = (key) => cardSig(POTTERY_CARDS[key])
const ex = (patch = {}) => ({ ...potteryExample(), cardSig: sigOf('crazing'), ...patch })
const l1 = (patch = {}) => ({ ...potteryLevel1(), cardSig: sigOf('crazing'), ...patch })
const found = (q, c = ctx) => checkQuestion(q, c)
const fails = (q, check, c) => found(q, c).some((f) => f.check === check && f.level === 'fail')
const clean = (q, c) => expect(found(q, c)).toEqual([])
const withOpt = (q, i, patch) => ({ ...q, options: q.options.map((o, k) => (k === i ? { ...o, ...patch } : o)) })

describe('the two invented base questions pass every check', () => {
  it('the design D2.1 example (level 2)', () => clean(ex()))
  it('a level 1 definition question', () => clean(l1()))
})

describe('fold and content words', () => {
  it('fold = NFKC, lower case, non-letters to one space', () => {
    expect(fold(`  ${String.fromCharCode(0xFF23)}razing${EM}in-the KILN!! 2x `)).toBe('crazing in the kiln 2x')
  })
  it('content words are 5+ letters and not stop words', () => {
    expect([...contentWords('Which of the following mugs show crazing after firing?')].sort()).toEqual(['crazing', 'firing'])
  })
})

describe('C1 shape', () => {
  it('fails on a shape problem and runs nothing else', () => {
    const r = found({ ...ex(), word: 'most' })
    expect(r.length).toBeGreaterThan(0)
    expect(r.every((f) => f.check === 'C1')).toBe(true)
  })
})

describe('C2 counts', () => {
  it('two options that read the same after fold', () => expect(fails(withOpt(ex(), 3, { t: 'crazing.' }), 'C2')).toBe(true))
  it('distinct options pass', () => expect(fails(ex(), 'C2')).toBe(false))
})

describe('C3 refs', () => {
  it('an unknown card', () => expect(fails(ex({ item: 'i9-2-ffffffff', id: 'i9-2-ffffffff.7' }), 'C3')).toBe(true))
  it('obj not the card section', () => expect(fails(ex({ obj: '9.3' }), 'C3')).toBe(true))
  it('id not item.slot', () => expect(fails(ex({ id: 'i9-2-4be07a13.6' }), 'C3')).toBe(true))
  it('an option naming an unknown card', () => expect(fails(withOpt(ex(), 3, { item: 'i9-2-deadbeef' }), 'C3')).toBe(true))
  it('a question on a briefing card', () => expect(fails(ex({ item: POTTERY_CARDS.brief.id, id: `${POTTERY_CARDS.brief.id}.7`, cardSig: sigOf('brief') }), 'C3')).toBe(true))
})

describe('C4 text', () => {
  it('an em or en dash anywhere', () => {
    expect(fails(withOpt(ex(), 1, { why: `Crawling ${EM} bare patches.` }), 'C4')).toBe(true)
    expect(fails(ex({ explain: `Shrank ${EN} cracked.` }), 'C4')).toBe(true)
  })
  it('HTML', () => expect(fails(ex({ explain: 'It <b>cracked</b> in place.' }), 'C4')).toBe(true))
  it('"a < b" with spaces is fine', () => expect(fails(ex({ explain: 'The clay shrank by less, so 1 < 2 here.' }), 'C4')).toBe(false))
  it('second person in the stem', () => expect(fails(ex({ stem: `${ex().stem} Your kiln is new.` }), 'C4')).toBe(true))
  it('all of the above, none of these, true, false', () => {
    expect(fails(withOpt(ex(), 3, { t: 'None of the above' }), 'C4')).toBe(true)
    expect(fails(withOpt(ex(), 3, { t: 'Both of these' }), 'C4')).toBe(true)
    expect(fails(withOpt(ex(), 3, { t: 'True' }), 'C4')).toBe(true)
  })
})

describe('C5 ask', () => {
  it('the word must be upper case, once', () => expect(fails(ex({ ask: 'Which of the following faults does this most likely describe?' }), 'C5')).toBe(true))
  it('another of the five words in upper case', () => expect(fails(ex({ ask: 'Which of the following is the BEST and MOST likely fault?' }), 'C5')).toBe(true))
  it('an opener outside the list', () => expect(fails(ex({ ask: 'Name the fault this MOST likely describes?' }), 'C5')).toBe(true))
  it('a fixed opener passes', () => expect(fails(ex({ ask: 'What fault does this MOST likely describe?' }), 'C5')).toBe(false))
  it('the Select suffix on a pick 1 question', () => expect(fails(ex({ ask: 'Which of the following faults does this MOST likely describe? (Select TWO)' }), 'C1')).toBe(true))
})

describe('C6 detail', () => {
  it('must be a literal part of the stem', () => expect(fails(ex({ detail: 'a web of fine cracks' }), 'C6')).toBe(true))
  it('may be a literal part of an artifact line', () => {
    const q = ex({ kind: 'artifact', artifact: { type: 'log', lines: ['Batch 12: fine cracks, nothing flaked'], mark: [0] }, detail: 'fine cracks, nothing flaked' })
    expect(fails(q, 'C6')).toBe(false)
  })
  it('a definition question with no word needs none', () => expect(fails(l1(), 'C6')).toBe(false))
})

describe('C7 runner', () => {
  it('partly on the right answer', () => expect(fails(withOpt(withOpt(ex(), 2, { partly: true }), 0, { partly: false }), 'C7')).toBe(true))
  it('MOST with a partly true option needs a runner', () => expect(fails(ex({ runner: null, edge: null }), 'C7')).toBe(true))
  it('a runner on a question with no BEST or MOST', () => expect(fails(ex({ word: '', ask: 'Which of the following faults does this describe?' }), 'C7')).toBe(true))
  it('the runner must be a partly true wrong option', () => expect(fails(ex({ runner: 1 }), 'C7')).toBe(true))
})

describe('C8 negative', () => {
  it('neg must match word NOT', () => {
    expect(fails(ex({ neg: true }), 'C8')).toBe(true)
    expect(fails(ex(), 'C8')).toBe(false)
  })
  it('negative stems under 5% of an objective', () => {
    const neg = { ...ex(), word: 'NOT', neg: true, ask: 'Which of the following faults does this NOT describe?', runner: null, edge: null }
    const many = (n) => Array.from({ length: n }, (_, i) => ({ ...ex(), id: `x.${i}`, stem: `${ex().stem} Batch ${'abcdefghijklmnopqrstuvwxyz'[i % 26]}${i}.` }))
    expect(checkSet([neg, ...many(9)], ctx).some((f) => f.check === 'C8')).toBe(true)
    expect(checkSet([neg, ...many(39)], ctx).some((f) => f.check === 'C8')).toBe(false)
  })
})

describe('C9 key in stem', () => {
  it('the answer word in the stem', () => expect(fails(ex({ stem: `${ex().stem} The potter calls it crazing.` }), 'C9')).toBe(true))
  it('the answer word in an artifact line', () => {
    const q = ex({ kind: 'artifact', artifact: { type: 'log', lines: ['Batch 12: crazing on 4 mugs'], mark: [0] } })
    expect(fails(q, 'C9')).toBe(true)
  })
  it('an answer given as an acronym, spelled out in the stem', () => {
    const q = l1({ item: POTTERY_CARDS.kiln.id, id: `${POTTERY_CARDS.kiln.id}.0`, cardSig: sigOf('kiln'),
      kind: 'scenario', stem: 'A potter compares how much the coating and the clay grow when hot, the coefficient of expansion of each.',
      ask: 'Which of the following does the potter compare?',
      options: [{ t: 'COE', ok: true, item: null, why: 'x' }, { t: 'Cone', ok: false, item: null, why: 'x' }, { t: 'Grog', ok: false, item: null, why: 'x' }, { t: 'Slip', ok: false, item: null, why: 'x' }],
      detail: 'how much the coating and the clay grow when hot', source: { card: 'keyPoints', chapter: 'Kiln records' } })
    expect(fails(q, 'C9')).toBe(true)
  })
  it('a stem that only describes the fault passes', () => expect(fails(ex(), 'C9')).toBe(false))
  it('the ask is read too (a definition question has no stem)', () => {
    expect(fails(l1({ ask: 'Which of the following terms names crazing in a coating?' }), 'C9')).toBe(true)
  })
  it('an acronym answer named in the stem', () => {
    const q = l1({ kind: 'scenario', stem: 'A potter compares the COE of the clay and the coating before a firing.', detail: 'before a firing', ask: 'Which of the following does the potter compare?',
      options: [{ t: 'COE', ok: true, item: null, why: 'x' }, { t: 'Cone', ok: false, item: null, why: 'x' }, { t: 'Grog', ok: false, item: null, why: 'x' }, { t: 'Slip', ok: false, item: null, why: 'x' }] })
    expect(found(q).some((f) => f.check === 'C9' && /names the answer "COE"/.test(f.msg))).toBe(true)
  })
})

describe('C10 one-option word', () => {
  it('a stem word found only in the right answer fails (pick 1)', () => {
    const q = withOpt(ex(), 2, { t: 'Crazed coating' })
    expect(fails(q, 'C10')).toBe(true)
  })
  it('a stem word found only in one wrong option is a warning for pass 3', () => {
    const r = found(withOpt(ex(), 3, { t: 'Peeled coating' }))
    expect(r.some((f) => f.check === 'C10' && f.level === 'warn')).toBe(true)
    expect(r.some((f) => f.check === 'C10' && f.level === 'fail')).toBe(false)
  })
})

describe('C11 length tell', () => {
  it('the answer as the single, much longer option', () => expect(fails(withOpt(ex(), 2, { t: 'Crazing across the coating' }), 'C11')).toBe(true))
  it('a slightly longer answer passes the single check', () => expect(fails(withOpt(ex(), 2, { t: 'Crazings' }), 'C11')).toBe(false))
  it('per objective: the answer longest in over 35% of pick 1 questions', () => {
    const longest = (i) => ({ ...withOpt(ex(), 2, { t: 'Crazings!!' }), id: `y.${i}` })
    const plain = (i) => ({ ...ex(), id: `z.${i}` })
    expect(checkSet([longest(1), longest(2), plain(3), plain(4)], ctx).some((f) => f.check === 'C11')).toBe(true)
    expect(checkSet([longest(1), plain(2), plain(3), plain(4)], ctx).some((f) => f.check === 'C11')).toBe(false)
  })
})

describe('C12 stored position', () => {
  const at = (pos, i) => {
    const q = ex({ id: `p.${i}`, runner: null, edge: null, word: '', ask: 'Which of the following faults does this describe?' })
    const opts = q.options.map(({ partly, ...o }) => o)
    const key = opts.splice(2, 1)[0]
    opts.splice(pos, 0, key)
    return { ...q, options: opts }
  }
  it('40+ questions with the key always on one letter', () => {
    expect(checkSet(Array.from({ length: 40 }, (_, i) => at(2, i)), ctx).some((f) => f.check === 'C12')).toBe(true)
  })
  it('an even spread passes', () => {
    expect(checkSet(Array.from({ length: 40 }, (_, i) => at(i % 4, i)), ctx).some((f) => f.check === 'C12')).toBe(false)
  })
})

describe('C13 duplicates', () => {
  it('the same stem and ask, numbers aside, anywhere in the course', () => {
    const a = ex({ id: 'a.1', stem: 'After 2 firings a mug shows a network of fine cracks across the shiny coating.' })
    const b = { ...ex({ id: 'b.1', stem: 'After 3 firings a mug shows a network of fine cracks across the shiny coating.' }), item: 'other' }
    expect(stemKey(a)).toBe(stemKey(b))
    expect(checkSet([a, b], ctx).some((f) => f.check === 'C13' && f.level === 'fail')).toBe(true)
  })
  it('one card: content words overlapping 80% or more', () => {
    const a = ex({ id: 'a.1' })
    const b = ex({ id: 'a.2', stem: `${ex().stem} Truly.` })
    expect(checkSet([a, b], ctx).some((f) => f.check === 'C13' && f.level === 'fail')).toBe(true)
  })
  it('one card: different scenarios pass', () => {
    const a = ex({ id: 'a.1' })
    const b = ex({ id: 'a.2', stem: 'A studio teacher inspects bowls glazed by a student. Their surface shows a network of fine cracks across the shiny coating, still firmly attached.', detail: 'a network of fine cracks across the shiny coating' })
    expect(checkSet([a, b], ctx).filter((f) => f.check === 'C13' && f.level === 'fail')).toEqual([{ check: 'C13', level: 'fail', id: 'a.2', msg: 'same answer and deciding detail as a.1' }])
    const c = { ...b, detail: 'still firmly attached' }
    expect(checkSet([a, c], ctx).some((f) => f.check === 'C13' && f.level === 'fail')).toBe(false)
  })
})

describe('C14 acronyms', () => {
  it('an unknown acronym in an option', () => expect(fails(withOpt(ex(), 3, { t: 'QXR' }), 'C14')).toBe(true))
  it('a listed acronym or a plain capital word passes', () => {
    expect(fails(withOpt(ex(), 3, { t: 'COE' }), 'C14')).toBe(false)
    expect(fails(withOpt(ex(), 3, { t: 'USB kiln' }), 'C14')).toBe(false)
  })
  it('level 1: an acronym in the stem the card does not teach', () => {
    const q = l1({ kind: 'scenario', stem: 'A potter checks the COE before choosing a glaze.', detail: 'checks the COE' })
    expect(fails(q, 'C14')).toBe(true)
  })
  it('level 1: spelled out right after it passes', () => {
    const q = l1({ kind: 'scenario', stem: 'A potter checks the COE (coefficient of expansion) before choosing a glaze.', detail: 'checks the COE' })
    expect(fails(q, 'C14')).toBe(false)
  })
})

describe('C15 level 1', () => {
  it('never negative', () => {
    const q = l1({ kind: 'scenario', word: 'NOT', neg: true, stem: 'A mug has fine cracks in a coating that stays on.', detail: 'stays on', ask: 'Which of the following faults is NOT shown here?' })
    expect(found(q).filter((f) => f.check === 'C1')).toEqual([])
    expect(fails(q, 'C15')).toBe(true)
  })
  it('an artifact only when the card names that kind of thing', () => {
    const art = { kind: 'artifact', stem: 'A potter reads the entry below.', artifact: { type: 'log', lines: ['Firing 12: cooled in 2 hours'], mark: [0] }, detail: 'cooled in 2 hours' }
    expect(fails(l1(art), 'C15')).toBe(true)
    const kiln = l1({ ...art, item: POTTERY_CARDS.kiln.id, id: `${POTTERY_CARDS.kiln.id}.0`, cardSig: sigOf('kiln'),
      options: [{ t: 'A fast cool', ok: true, item: POTTERY_CARDS.kiln.id, why: 'x' }, { t: 'A slow cool', ok: false, item: null, why: 'x' }, { t: 'A cold kiln', ok: false, item: null, why: 'x' }, { t: 'A wet shelf', ok: false, item: null, why: 'x' }],
      ask: 'Which of the following does this entry show?', source: { card: 'example', chapter: 'Kiln records' } })
    expect(fails(kiln, 'C15')).toBe(false)
  })
})

describe('C16 lesson options', () => {
  it('a wrong option that is a card taught by a LATER lesson', () => expect(fails(withOpt(l1(), 2, { t: 'Crawling', item: POTTERY_CARDS.crawling.id }), 'C16')).toBe(true))
  it('a card of the same or an earlier lesson passes', () => expect(fails(l1(), 'C16')).toBe(false))
  it('the right answer must be this card or null', () => expect(fails(withOpt(l1(), 0, { item: POTTERY_CARDS.shivering.id }), 'C16')).toBe(true))
  it('does not apply at level 2', () => expect(fails(ex(), 'C16')).toBe(false))
  it("an option NAMED like a course card must carry that card's id (any level): null hid a later lesson's term", () => {
    const named = { t: POTTERY_CARDS.crawling.front.replace(/\s*\([^)]*\)/g, '').toUpperCase(), item: null }
    expect(fails(withOpt(ex(), 2, named), 'C16')).toBe(true)
    expect(fails(withOpt(ex(), 2, { ...named, item: POTTERY_CARDS.crawling.id }), 'C16')).toBe(false)
  })
})

describe('C17 artifact', () => {
  const art = (lines, mark = [0]) => ex({ kind: 'artifact', artifact: { type: 'log', lines, mark } })
  it('mark lines must exist', () => expect(fails(art(['ok line'], [3]), 'C17')).toBe(true))
  it('IPv4 only in the documentation ranges', () => {
    expect(fails(art(['kiln controller at 10.1.2.3']), 'C17')).toBe(true)
    expect(fails(art(['kiln controller at 192.0.2.15, 198.51.100.7, 203.0.113.9']), 'C17')).toBe(false)
    expect(fails(ex({ explain: 'The kiln controller answered from 10.1.2.3.' }), 'C17')).toBe(true)
    expect(fails(art(['kiln controller at 192.0.2.999']), 'C17')).toBe(true)
  })
  it('IPv6 only in 2001:db8::/32; clock times and MAC addresses are not addresses', () => {
    expect(fails(art(['controller fe80::1 replied']), 'C17')).toBe(true)
    expect(fails(art(['controller 2001:db8::7 replied at 08:10:22, MAC 00:1a:2b:3c:4d:5e']), 'C17')).toBe(false)
    expect(ipv6Candidates('2001:0db8:0:0:0:0:0:1 and 12:30:45')).toEqual(['2001:0db8:0:0:0:0:0:1'])
  })
  it('host names never end in a real top-level domain', () => {
    expect(fails(art(['upload to kiln.example.com failed']), 'C17')).toBe(true)
    expect(fails(art(['upload to kiln.example failed']), 'C17')).toBe(false)
  })
})

describe('C18 cardSig', () => {
  it('a question reviewed against older card text', () => expect(fails(ex({ cardSig: '1r8k2mz' }), 'C18')).toBe(true))
  it('the card as it is now passes', () => expect(fails(ex(), 'C18')).toBe(false))
})

describe('C19 own words', () => {
  const outline = '# 9.0 Invented outline\n## 9.2 Tell faults apart.\n- a network of fine cracks across the shiny coating of a fired mug after the kiln cools\n'
  const grams = outlineGrams(outline)
  const find = (texts) => verbatimProblems(texts, grams)
  it('a 12-word run shared with the outline', () => {
    const q = ex({ stem: 'A mug shows a network of fine cracks across the shiny coating of a fired mug after the kiln cools.' })
    expect(checkOwnWords(q, find).map((f) => f.check)).toEqual(['C19'])
  })
  it('our own words pass', () => expect(checkOwnWords(ex(), find)).toEqual([]))
})

describe('C20 source', () => {
  it('a chapter heading that does not exist', () => expect(fails(ex({ source: { card: 'keyPoints', chapter: 'Faults of glass' } }), 'C20')).toBe(true))
  it('a card part the card does not have', () => {
    const pkg = potteryPackage()
    const it0 = pkg.areas[0].items.find((x) => x.id === POTTERY_CARDS.crazing.id)
    it0.back = it0.back.replace(/^Example:.*\n/m, '')
    const q = ex({ cardSig: cardSig(it0), source: { card: 'example', chapter: 'Faults after the final firing' } })
    expect(fails(q, 'C20', ctxFor(pkg))).toBe(true)
    expect(fails({ ...q, source: { card: 'definition', chapter: 'Faults after the final firing' } }, 'C20', ctxFor(pkg))).toBe(false)
  })
})

describe('C21 stamps', () => {
  const hash = (q) => fold(JSON.stringify(q)).length.toString(36) + fold(q.stem).slice(0, 8)
  const q = ex()
  const all = { p1: hash(q), p2: hash(q), p2b: hash(q), p3: hash(q), p4: hash(q), oversight: hash(q) }
  it('every required pass on the text as it is', () => expect(checkStamps(q, all, hash)).toEqual([]))
  it('a question nobody stamped', () => expect(checkStamps(q, undefined, hash).map((f) => f.check)).toEqual(['C21']))
  it('BEST and MOST need the second solver (p2b)', () => {
    const { p2b, ...rest } = all
    expect(checkStamps(q, rest, hash)[0].msg).toMatch(/p2b/)
    const plain = ex({ word: '', ask: 'Which of the following faults does this describe?', runner: null, edge: null })
    const h = hash(plain)
    expect(checkStamps(plain, { p1: h, p2: h, p3: h, p4: h, oversight: h }, hash)).toEqual([])
  })
  it('a recorded blind-solve mismatch on this exact text fails, even with every pass stamped', () => {
    expect(checkStamps(q, { ...all, miss: [hash(q)] }, hash).map((f) => f.msg)).toEqual(['a blind solver picked another answer on this exact text: rewrite it'])
    expect(checkStamps(q, { ...all, miss: ['older-text'] }, hash)).toEqual([])
  })
  it('an edit after a pass', () => {
    const edited = ex({ explain: 'The coating shrank more than the clay, so it cracked.' })
    expect(checkStamps(edited, all, hash)[0].msg).toMatch(/changed after/)
  })
})

describe('C22 mix per card', () => {
  const kinds = ['definition', 'definition', 'scenario', 'scenario', 'scenario', 'scenario', 'scenario', 'scenario', 'artifact', 'artifact']
  const card = (k = kinds) => k.map((kind, i) => ({ ...l1(), id: `i9-2-4be07a13.${i}`, slot: i, kind, level: i < 4 ? 1 : 2, stem: `Batch ${'abcdefghij'[i]} stem words${'x'.repeat(i)}.` }))
  const c22 = (qs, opts) => checkSet(qs, ctx, opts).filter((f) => f.check === 'C22' && f.id === POTTERY_CARDS.crazing.id)
  it('10 questions, 2 definition and 2 scenario at level 1, at most 2 artifact', () => expect(c22(card())).toEqual([]))
  it('too few level 1 definition questions', () => expect(c22(card(['definition', 'scenario', ...kinds.slice(2)]))).toHaveLength(1))
  it('three artifact questions', () => expect(c22(card([...kinds.slice(0, 7), 'artifact', 'artifact', 'artifact']))).toHaveLength(1))
  it('three select-N questions', () => {
    const qs = card().map((q, i) => (i >= 7 ? { ...q, pick: 2 } : q))
    expect(c22(qs)).toHaveLength(1)
  })
  it('fewer than 10 questions; 6 is enough with --allow-short', () => {
    expect(c22(card().slice(0, 6))).toHaveLength(1)
    expect(c22(card().slice(0, 6), { allowShort: true })).toEqual([])
  })
  it('a quizzable card of the objective with no questions', () => {
    const r = checkSet(card(), ctx).filter((f) => f.check === 'C22')
    expect(r.map((f) => f.id).sort()).toEqual([POTTERY_CARDS.crawling.id, POTTERY_CARDS.kiln.id, POTTERY_CARDS.shivering.id].sort())
  })
})

describe('C23 article', () => {
  const art = (opts) => ex({ word: '', runner: null, edge: null, ask: 'Which of the following completes the label, an ____?', options: opts })
  const o = (t, ok = false) => ({ t, ok, item: null, why: 'x' })
  it('"an" before the blank with options of mixed first letters', () => expect(fails(art([o('Crazing', true), o('Ice crackle'), o('Shivering'), o('Crawling')]), 'C23')).toBe(true))
  it('all consonants pass', () => expect(fails(art([o('Crazing', true), o('Pinholing'), o('Shivering'), o('Crawling')]), 'C23')).toBe(false))
})

describe('forbidden phrases (invented phrases only)', () => {
  const PHRASE = 'the kiln sighed softly before the dawn firing began'
  it('the whole phrase, any case and punctuation', () => expect(phraseHit('The KILN, sighed softly before the dawn-firing began!', PHRASE)).toBe('the whole phrase'))
  it('a run of 3+ consecutive phrase words with a content word', () => {
    expect(phraseHit('Before dawn the kiln sighed softly again.', PHRASE)).toMatch(/\d-word run/)
    expect(phraseHit('A potter saw the dawn firing glow.', PHRASE)).toMatch(/3-word run/)
  })
  it('a run of small words alone is not a match', () => expect(phraseHit('It was before the noon bell.', PHRASE)).toBeNull())
  it('70% of the content words inside 12 words', () => {
    expect(phraseHit('At dawn a firing began as the kiln softly sighed.', PHRASE)).toMatch(/content words/)
    expect(phraseHit('The kiln was cold at dawn.', PHRASE)).toBeNull()
  })
  it('checkForbidden looks at stem, ask, options and why lines and never prints the phrase', () => {
    const q = withOpt(ex(), 1, { why: 'Before dawn the kiln sighed softly, but crawling is bare patches.' })
    const r = checkForbidden(q, ['an unrelated invented phrase about glass beads', PHRASE])
    expect(r).toHaveLength(1)
    expect(r[0]).toMatchObject({ check: 'CF', level: 'fail' })
    expect(r[0].msg).toMatch(/why 1 .*#2/)
    expect(r[0].msg).not.toMatch(/sighed|softly/)
    expect(checkForbidden(ex(), [PHRASE])).toEqual([])
    expect(checkForbidden(ex({ explain: 'The kiln sighed softly before the dawn firing began.' }), [PHRASE])[0].msg).toMatch(/^explain /)
  })
})
