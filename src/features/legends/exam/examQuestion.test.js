// The frozen exam question shape, grading, card signature, letter dealing and runner mapping (examQuestion.js).
// Every question here is INVENTED and on pottery, a subject no course teaches (illustrative, not a course fact).
import { describe, it, expect } from 'vitest'
import { shapeExamQuestion, canonicalQuestion, gradeExamAnswer, cardSig, balancedOrder, toRunnerQuestion, slotCode, FIELD_ORDER, sentences } from './examQuestion.js'
import { fnv } from '../hash.js'
import { potteryExample } from './testFixtures.js'

const bad = (mutate, re) => {
  const q = potteryExample()
  mutate(q)
  const r = shapeExamQuestion(q)
  expect(r.ok).toBe(false)
  if (re) expect(r.problems.join('\n')).toMatch(re)
}

describe('shapeExamQuestion (C1: the frozen v1 shape)', () => {
  it('the design example passes and comes back in the frozen key order', () => {
    const r = shapeExamQuestion(potteryExample())
    expect(r.problems).toEqual([])
    expect(Object.keys(r.q)).toEqual(FIELD_ORDER)
    expect(Object.keys(r.q.options[0])).toEqual(['t', 'ok', 'item', 'partly', 'why'])
    expect(Object.keys(r.q.options[1])).toEqual(['t', 'ok', 'item', 'why'])
  })
  it('refuses unknown and missing fields', () => {
    bad((q) => { q.by = 'bank' }, /unknown field "by"/)
    bad((q) => { delete q.source }, /missing field "source"/)
    bad((q) => { q.options[0].hint = 'x' }, /unknown field "hint"/)
    bad((q) => { q.artifact = { type: 'log', lines: ['a'], mark: [], extra: 1 } }, /unknown field "extra"/)
  })
  it('checks every type and enum', () => {
    bad((q) => { q.obj = '9' }, /obj/)
    bad((q) => { q.slot = 10 }, /slot/)
    bad((q) => { q.slot = 1.5 }, /slot/)
    bad((q) => { q.rev = 0 }, /rev/)
    bad((q) => { q.cardSig = '' }, /cardSig/)
    bad((q) => { q.kind = 'trivia' }, /kind/)
    bad((q) => { q.level = 3 }, /level/)
    bad((q) => { q.pick = 4 }, /pick/)
    bad((q) => { q.word = 'best' }, /word/)
    bad((q) => { q.neg = 'no' }, /neg/)
    bad((q) => { q.options[2].ok = 'yes' }, /ok must be a boolean/)
    bad((q) => { q.options[3].item = 7 }, /item must be a card id or null/)
    bad((q) => { q.options[0].partly = 'yes' }, /partly/)
    bad((q) => { q.source.card = 'back' }, /source.card/)
    bad((q) => { q.source.chapter = ' ' }, /source.chapter/)
  })
  it('live questions use slots 10 to 15, bank questions 0 to 9', () => {
    const q = { ...potteryExample(), slot: 12 }
    expect(shapeExamQuestion(q).ok).toBe(false)
    expect(shapeExamQuestion(q, { live: true }).ok).toBe(true)
    expect(shapeExamQuestion({ ...q, slot: 16 }, { live: true }).ok).toBe(false)
  })
  it('checks every length limit', () => {
    bad((q) => { q.stem = `${'Mugs cracked'.repeat(50)}.` }, /stem over 600/)
    bad((q) => { q.stem = '' }, /stem may be empty only/)
    bad((q) => { q.level = 1; q.word = ''; q.runner = null; q.edge = null; q.options[0].partly = undefined; q.stem = 'One. Two. Three. Four. Five.' }, /over 4 sentences/)
    bad((q) => { q.bullets = ['a', 'b'] }, /0, 3 or 4/)
    bad((q) => { q.bullets = ['a', 'b', 'x'.repeat(121)] }, /bullet 2/)
    bad((q) => { q.ask = `Which ${'x'.repeat(160)}?` }, /ask must be text/)
    bad((q) => { q.ask = 'Which of the following faults does this MOST likely describe.' }, /must end with "\?"/)
    bad((q) => { q.options[1].t = 'x'.repeat(61) }, /option 1: t/)
    bad((q) => { q.options[1].why = 'x'.repeat(201) }, /option 1: why/)
    bad((q) => { q.options[1].why = '' }, /option 1: why/)
    bad((q) => { q.edge = 'x'.repeat(201) }, /edge/)
    bad((q) => { q.explain = 'One. Two. Three. Four.' }, /explain/)
    bad((q) => { q.explain = `${'x'.repeat(401)}.` }, /explain/)
    bad((q) => { q.artifact = { type: 'log', lines: Array(9).fill('a'), mark: [] } }, /1 to 8 lines/)
    bad((q) => { q.artifact = { type: 'log', lines: ['x'.repeat(101)], mark: [] } }, /artifact line 0/)
    bad((q) => { q.kind = 'artifact'; q.artifact = { type: 'video', lines: ['a'], mark: [] } }, /artifact.type/)
    bad((q) => { q.kind = 'artifact' }, /artifact must be set exactly when kind is "artifact"/)
    bad((q) => { q.artifact = { type: 'log', lines: ['a'], mark: [] } }, /artifact must be set exactly when kind is "artifact"/)
  })
  it('checks the option counts and the number of right answers', () => {
    bad((q) => { q.options = q.options.slice(0, 3) }, /needs 4 to 7/)
    bad((q) => { q.options[2].ok = false }, /exactly 1 option/)
    bad((q) => { q.options[1].ok = true }, /exactly 1 option/)
    bad((q) => { q.pick = 2; q.ask = 'Which of the following faults are these? (Select TWO)'; q.options[1].ok = true }, /needs 5 to 7/)
  })
  it('ties detail, runner and edge together', () => {
    bad((q) => { q.detail = '' }, /detail is required/)
    bad((q) => { q.runner = 9 }, /runner/)
    bad((q) => { q.edge = null }, /edge must be set exactly/)
    const def = { ...potteryExample(), kind: 'definition', stem: '', word: '', ask: 'Which of the following faults is a network of fine cracks in a coating?', detail: '', runner: null, edge: null }
    def.options = def.options.map(({ partly, ...o }) => o)
    expect(shapeExamQuestion(def).problems).toEqual([])
  })
  it('counts sentences the way the design does', () => {
    expect(sentences('A potter fires a kiln. It cools! Why? Done')).toHaveLength(4)
    expect(sentences('')).toHaveLength(0)
  })
})

describe('gradeExamAnswer', () => {
  const q = potteryExample()
  it('pick 1', () => {
    expect(gradeExamAnswer(q, [2])).toEqual({ correct: true, rightPicks: [2], wrongPicks: [], missed: [] })
    expect(gradeExamAnswer(q, [0])).toEqual({ correct: false, rightPicks: [], wrongPicks: [0], missed: [2] })
    expect(gradeExamAnswer(q, 2).correct).toBe(true)
    expect(gradeExamAnswer(q, []).correct).toBe(false)
  })
  it('select-N: all right picks and nothing else', () => {
    const s = { options: [{ ok: true }, { ok: false }, { ok: true }, { ok: false }, { ok: false }] }
    expect(gradeExamAnswer(s, [2, 0]).correct).toBe(true)
    expect(gradeExamAnswer(s, [0, 0, 2]).correct).toBe(true)
    expect(gradeExamAnswer(s, [0, 1])).toEqual({ correct: false, rightPicks: [0], wrongPicks: [1], missed: [2] })
    expect(gradeExamAnswer(s, [0])).toEqual({ correct: false, rightPicks: [0], wrongPicks: [], missed: [2] })
    expect(gradeExamAnswer(s, [0, 1, 2]).correct).toBe(false)
  })
  it('grades a runner question by its exam.right', () => {
    const r = toRunnerQuestion(q, { order: [3, 2, 1, 0] })
    expect(gradeExamAnswer(r, [1]).correct).toBe(true)
    expect(gradeExamAnswer(r, [2]).correct).toBe(false)
  })
})

describe('cardSig', () => {
  const card = { front: 'Crazing', back: 'Definition: Fine cracks in a fired coating.' }
  it('is FNV-1a of front, U+0001, back (the shared Legends hash)', () => {
    expect(cardSig(card)).toBe(fnv('Crazing\u0001Definition: Fine cracks in a fired coating.'))
    expect(cardSig(card)).toMatch(/^[0-9a-z]+$/)
  })
  it('changes with the back or the front, not with other fields', () => {
    expect(cardSig({ ...card, back: `${card.back} More.` })).not.toBe(cardSig(card))
    expect(cardSig({ ...card, front: 'Crawling' })).not.toBe(cardSig(card))
    expect(cardSig({ ...card, id: 'x', section: '9.2' })).toBe(cardSig(card))
  })
})

describe('canonicalQuestion', () => {
  it('drops rev only for the hash form and keeps partly only when true', () => {
    const q = potteryExample()
    q.options[1].partly = false
    expect(canonicalQuestion(q, { withRev: false }).rev).toBeUndefined()
    expect(canonicalQuestion(q).rev).toBe(1)
    expect('partly' in canonicalQuestion(q).options[1]).toBe(false)
    const shuffled = Object.fromEntries(Object.entries(potteryExample()).reverse())
    expect(JSON.stringify(canonicalQuestion(shuffled))).toBe(JSON.stringify(canonicalQuestion(potteryExample())))
  })
})

// A seeded generator, so the 2,000-run statistics are the same on every machine.
const seeded = (seed) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32 }
const fourOption = () => ({ options: [{ ok: false }, { ok: true }, { ok: false }, { ok: false }] })

describe('balancedOrder (letter dealing)', () => {
  it('every order is a permutation of the options', () => {
    const qs = [fourOption(), { options: Array.from({ length: 6 }, (_, i) => ({ ok: i === 5 })) }, { options: Array.from({ length: 7 }, (_, i) => ({ ok: i < 3 })) }]
    for (const [k, o] of balancedOrder(qs, seeded(1)).entries()) expect([...o].sort((a, b) => a - b)).toEqual(qs[k].options.map((_, i) => i))
  })
  it('a 20-question quiz of 4-option questions has exactly 5 right answers on each letter', () => {
    for (let run = 0; run < 200; run++) {
      const qs = Array.from({ length: 20 }, fourOption)
      const counts = [0, 0, 0, 0]
      balancedOrder(qs, seeded(run + 1)).forEach((o) => { counts[o.indexOf(1)]++ })
      expect(counts).toEqual([5, 5, 5, 5])
    }
  })
  it('over 2,000 runs any 200 questions land within 20 to 30% per letter', () => {
    for (let run = 0; run < 2000; run++) {
      const qs = Array.from({ length: 200 }, fourOption)
      const counts = [0, 0, 0, 0]
      balancedOrder(qs, seeded(run * 7 + 3)).forEach((o) => { counts[o.indexOf(1)]++ })
      for (const c of counts) { expect(c).toBeGreaterThanOrEqual(40); expect(c).toBeLessThanOrEqual(60) }
    }
  })
  it('select-N right answers take distinct letters and spread evenly too', () => {
    const qs = Array.from({ length: 50 }, () => ({ options: [{ ok: true }, { ok: true }, { ok: false }, { ok: false }, { ok: false }] }))
    const counts = [0, 0, 0, 0, 0]
    for (const o of balancedOrder(qs, seeded(9))) {
      const pos = [o.indexOf(0), o.indexOf(1)]
      expect(pos[0]).not.toBe(pos[1])
      pos.forEach((p) => counts[p]++)
    }
    for (const c of counts) expect(c).toBe(20)
  })
  it('ignores the stored position of the key', () => {
    const qs = Array.from({ length: 40 }, () => ({ options: [{ ok: true }, { ok: false }, { ok: false }, { ok: false }] }))
    const counts = [0, 0, 0, 0]
    balancedOrder(qs, seeded(4)).forEach((o) => { counts[o.indexOf(0)]++ })
    expect(counts).toEqual([10, 10, 10, 10])
  })
})

describe('toRunnerQuestion', () => {
  it('maps to today\'s choice question in display order, why lines travelling with their option', () => {
    const q = potteryExample()
    const r = toRunnerQuestion(q, { order: [3, 0, 2, 1], front: 'Crazing' })
    expect(r.kind).toBe('choice')
    expect(r.choices).toEqual(['Pinholing', 'Shivering', 'Crazing', 'Crawling'])
    expect(r.answerIdx).toBe(2)
    expect(r.exam.right).toEqual([2])
    expect(r.exam.whys[2]).toBe(q.options[2].why)
    expect(r.exam.whys[0]).toBe(q.options[3].why)
    expect(r.exam.optItems).toEqual([null, 'i9-2-90c1d2e4', 'i9-2-4be07a13', 'i9-2-17f3a6b0'])
    expect(r.exam.partly).toEqual([1])
    expect(r.exam.runner).toBe(1)
    expect(r.prompt).toBe(`${q.stem}\n\n${q.ask}`)
    expect(r).toMatchObject({ target: 'Crazing', itemId: q.item, qid: q.id, explanation: q.explain })
    expect(r.exam).toMatchObject({ pick: 1, word: 'MOST', neg: false, obj: '9.2', level: 2, kind: 'scenario', by: 'bank', detail: q.detail })
  })
  it('a definition question with no stem prompts with the ask alone; select-N lists every right index', () => {
    const q = { ...potteryExample(), stem: '', pick: 2, options: [...potteryExample().options, { t: 'Blistering', ok: true, item: null, why: 'x' }] }
    const r = toRunnerQuestion(q)
    expect(r.prompt).toBe(q.ask)
    expect(r.exam.right).toEqual([2, 4])
    expect(r.answerIdx).toBe(2)
  })
})

describe('slotCode', () => {
  it('kind letter, upper case for level 2, then pick or n', () => {
    expect(slotCode(potteryExample())).toBe('S1')
    expect(slotCode({ kind: 'definition', level: 1, pick: 1, neg: false })).toBe('d1')
    expect(slotCode({ kind: 'artifact', level: 1, pick: 3, neg: false })).toBe('a3')
    expect(slotCode({ kind: 'scenario', level: 2, pick: 1, neg: true })).toBe('Sn')
    expect(slotCode(null)).toBe('--')
  })
})
