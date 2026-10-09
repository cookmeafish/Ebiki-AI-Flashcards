import { describe, it, expect, vi } from 'vitest'
import { reuseSettings, questionSignature, cardTextKey, pickSavedSet, addSet, markAsked, replaceQuestion, savedQuestionCount, storableQuestion, reshuffleChoices, createQuestionReuse, updateBank } from './questionBank'

const q = (text) => ({ question: text, type: 'recall', acceptedAnswers: ['x'] })
const parts = { front: 'perro', back: 'dog', learnLang: 'Spanish', quizLang: 'English', perCard: 3 }
const key = questionSignature(parts)

describe('reuseSettings', () => {
  it('is OFF unless explicitly enabled', () => {
    expect(reuseSettings(undefined).enabled).toBe(false)
    expect(reuseSettings({ enabled: 'yes' }).enabled).toBe(false)
    expect(reuseSettings({ enabled: true }).enabled).toBe(true)
  })
  it('clamps the per-card maximum', () => {
    expect(reuseSettings({ maxPerCard: 0 }).maxPerCard).toBe(1)
    expect(reuseSettings({ maxPerCard: 999 }).maxPerCard).toBe(50)
    expect(reuseSettings({ maxPerCard: 'abc' }).maxPerCard).toBe(10)
  })
})

describe('questionSignature', () => {
  it('text follows the card, sig follows the settings', () => {
    expect(questionSignature({ ...parts, back: 'dog (animal)' }).text).not.toBe(key.text)
    for (const change of [{ choices: true }, { perCard: 4 }, { style: 'Latin American Spanish' }, { kind: 'pbq' }, { quizLang: 'Spanish' }]) {
      const k = questionSignature({ ...parts, ...change })
      expect(k.text).toBe(key.text)
      expect(k.sig).not.toBe(key.sig)
    }
  })
  it('the pronunciation Ebiki embeds on first play is not a card edit', () => {
    const embedded = 'dog\n[sound:ebiki-perro-1a2b.mp3]\n🔊 Some Speaker · CC BY-SA 4.0'
    expect(cardTextKey('perro', embedded)).toBe(cardTextKey('perro', 'dog'))
  })
})

describe('pickSavedSet / addSet', () => {
  it('generates new sets until one more would pass the cap, then reuses', () => {
    let bank = null
    expect(pickSavedSet(bank, key, 3, 10)).toBe(null)
    bank = addSet(bank, key, [q('a1'), q('a2'), q('a3')], 1)
    bank = addSet(bank, key, [q('b1'), q('b2'), q('b3')], 2)
    expect(pickSavedSet(bank, key, 3, 10)).toBe(null) // 6 + 3 = 9, still within 10
    bank = addSet(bank, key, [q('c1'), q('c2'), q('c3')], 3)
    expect(savedQuestionCount(bank, key)).toBe(9)
    expect(pickSavedSet(bank, key, 3, 10)?.questions[0].question).toBe('a1') // least recently asked
  })
  it('rotates: the set just asked goes to the back', () => {
    let bank = addSet(addSet(null, key, [q('a')], 1), key, [q('b')], 2)
    const first = pickSavedSet(bank, key, 1, 2)
    bank = markAsked(bank, first.id, 10)
    expect(pickSavedSet(bank, key, 1, 2).questions[0].question).toBe('b')
  })
  it('a cap smaller than one set still keeps (and reuses) that first set', () => {
    const bank = addSet(null, key, [q('a1'), q('a2'), q('a3')], 1)
    expect(pickSavedSet(bank, key, 3, 2)?.questions[0].question).toBe('a1')
  })
  it('an edited card drops its old sets; another mode on the same deck keeps its own', () => {
    const otherMode = questionSignature({ ...parts, quizLang: 'Spanish' })
    let bank = addSet(null, otherMode, [q('mode B')], 1)
    bank = addSet(bank, key, [q('mode A')], 2)
    expect(bank.sets.map((s) => s.questions[0].question)).toEqual(['mode B', 'mode A'])
    expect(pickSavedSet(bank, otherMode, 1, 1).questions[0].question).toBe('mode B')
    const edited = questionSignature({ ...parts, back: 'dog, hound' })
    bank = addSet(bank, edited, [q('new text')], 3)
    expect(bank.sets.map((s) => s.questions[0].question)).toEqual(['new text'])
  })
  it('a card file cannot grow without bound', () => {
    let bank = null
    for (let i = 0; i < 60; i++) bank = addSet(bank, questionSignature({ ...parts, perCard: i }), [q(String(i))], i)
    expect(bank.sets.length).toBe(40)
    expect(bank.sets[bank.sets.length - 1].questions[0].question).toBe('59')
  })
})

describe('replaceQuestion / storableQuestion / reshuffleChoices', () => {
  it('fixes the saved copy of one question', () => {
    const bank = addSet(null, key, [q('a1'), q('a2')], 1)
    const id = bank.sets[0].id
    expect(replaceQuestion(bank, id, 1, q('fixed')).sets[0].questions.map((x) => x.question)).toEqual(['a1', 'fixed'])
  })
  it('keeps only what asking needs, never session state', () => {
    const s = storableQuestion({ ...q('a'), _bank: { setId: 'x' }, answer: 'typed', result: {} })
    expect(Object.keys(s)).not.toContain('_bank')
    expect(Object.keys(s)).not.toContain('answer')
  })
  it('a reused multiple-choice question keeps its right answer in a new order', () => {
    const mc = { ...q('pick'), choices: ['perro', 'gato', 'pez', 'ave'], answerIdx: 0 }
    const seq = [0.9, 0.1, 0.5]; let i = 0
    const out = reshuffleChoices(mc, () => seq[i++ % seq.length])
    expect(out.choices[out.answerIdx]).toBe('perro')
    expect([...out.choices].sort()).toEqual([...mc.choices].sort())
    expect(reshuffleChoices({ ...mc, answerIdx: 9 })).toEqual({ ...mc, answerIdx: 9 }) // invalid index: untouched
  })
})

// The wiring App uses. `settings`/`epoch` are live (read on every call), like App's refs.
const harness = (settings, bankStore = new Map()) => {
  const st = { settings, epoch: 0 }
  const load = vi.fn(async (deck, note) => ({ ok: true, bank: bankStore.get(`${deck}/${note}`) || null }))
  const save = vi.fn(async (deck, note, bank) => { bankStore.set(`${deck}/${note}`, bank); return true })
  const reuse = createQuestionReuse({ getSettings: () => st.settings, getEpoch: () => st.epoch, load, save })
  return { st, load, save, reuse, bankStore }
}
const card = { note: 42, deckName: 'Spanish::Verbs' }
const gen = (label) => vi.fn(async () => [q(`${label}1`), q(`${label}2`), q(`${label}3`)])

describe('createQuestionReuse', () => {
  it('OFF means off: no read, no write, a fresh generation every time', async () => {
    const h = harness({ enabled: false, maxPerCard: 3 })
    const g = gen('f')
    for (let i = 0; i < 3; i++) await h.reuse(card, parts, 3, g)
    expect(g).toHaveBeenCalledTimes(3)
    expect(h.load).not.toHaveBeenCalled()
    expect(h.save).not.toHaveBeenCalled()
  })
  it('ON: saves until the cap, then asks saved questions with no generation', async () => {
    const h = harness({ enabled: true, maxPerCard: 3 })
    const g = gen('a')
    const first = await h.reuse(card, parts, 3, g)
    expect(first[0]._bank).toMatchObject({ noteId: 42, deck: 'Spanish::Verbs', qi: 0 })
    const again = await h.reuse(card, parts, 3, g)
    expect(g).toHaveBeenCalledTimes(1)
    expect(again.map((x) => x.question)).toEqual(['a1', 'a2', 'a3'])
  })
  it('turning it OFF takes effect at once, even for a card that has saved questions', async () => {
    const h = harness({ enabled: true, maxPerCard: 3 })
    await h.reuse(card, parts, 3, gen('a'))
    h.st.settings = { enabled: false, maxPerCard: 3 }
    h.load.mockClear(); h.save.mockClear()
    const g = gen('b')
    const out = await h.reuse(card, parts, 3, g)
    expect(out[0].question).toBe('b1')
    expect(h.load).not.toHaveBeenCalled()
    expect(h.save).not.toHaveBeenCalled()
  })
  it('switched OFF while a generation runs: nothing is saved', async () => {
    const h = harness({ enabled: true, maxPerCard: 10 })
    const g = vi.fn(async () => { h.st.settings = { enabled: false }; return [q('x')] })
    await h.reuse(card, parts, 1, g)
    expect(h.save).not.toHaveBeenCalled()
  })
  it('a clear during a generation is not undone by that generation', async () => {
    const h = harness({ enabled: true, maxPerCard: 10 })
    const g = vi.fn(async () => { h.st.epoch++; return [q('x')] })
    await h.reuse(card, parts, 1, g)
    expect(h.save).not.toHaveBeenCalled()
  })
  it('a failed read generates fresh and never saves', async () => {
    const h = harness({ enabled: true, maxPerCard: 10 })
    h.load.mockImplementation(async () => ({ ok: false, bank: null }))
    await h.reuse(card, parts, 3, gen('a'))
    expect(h.save).not.toHaveBeenCalled()
  })
  it('never saves the give-up fallback, relearn copies, or cards without a deck', async () => {
    const h = harness({ enabled: true, maxPerCard: 10 })
    await h.reuse(card, parts, 1, async () => [{ ...q('fallback'), _fallback: true }])
    await h.reuse({ ...card, _relearn: true }, parts, 1, gen('r'))
    await h.reuse({ note: 7 }, parts, 1, gen('d'))
    expect(h.save).not.toHaveBeenCalled()
  })
  it('keeps each deck separate', async () => {
    const h = harness({ enabled: true, maxPerCard: 1 })
    await h.reuse(card, parts, 1, async () => [q('verbs')])
    const g = vi.fn(async () => [q('other deck')])
    const out = await h.reuse({ note: 42, deckName: 'French' }, parts, 1, g)
    expect(out[0].question).toBe('other deck')
    expect(g).toHaveBeenCalledTimes(1)
  })
  it('a new set is stamped above a saved set asked under a clock running ahead', async () => {
    const h = harness({ enabled: true, maxPerCard: 6 })
    const key = questionSignature(parts)
    const ahead = Date.now() + 10 * 24 * 3600 * 1000
    h.bankStore.set('Spanish::Verbs/42', { v: 2, sets: [{ id: 'old', text: key.text, sig: key.sig, questions: [q('o1'), q('o2'), q('o3')], createdAt: 1, lastAsked: ahead }] })
    await h.reuse(card, parts, 3, gen('n'))
    await new Promise((r) => setTimeout(r, 0))
    const sets = h.bankStore.get('Spanish::Verbs/42').sets
    const fresh = sets.find((s) => s.id !== 'old')
    expect(fresh.lastAsked).toBeGreaterThan(ahead)
    // At the cap the LEAST recently asked goes first: the old set, not the one just asked.
    expect(pickSavedSet({ sets }, key, 3, 6).id).toBe('old')
  })
  it('saves a PBQ exercise whole and returns it as one', async () => {
    const h = harness({ enabled: true, maxPerCard: 1 })
    const pbq = { title: 'Order the steps', kind: 'ordering', items: ['a', 'b'], answer: [1, 0] }
    await h.reuse(card, { ...parts, kind: 'pbq' }, 1, async () => [pbq])
    const again = await h.reuse(card, { ...parts, kind: 'pbq' }, 1, async () => { throw new Error('should reuse') })
    expect(again[0]).toMatchObject(pbq)
  })
})

describe('mergeGlosses', () => {
  it('adds fetched glosses to the saved question with the same text only', async () => {
    const { mergeGlosses } = await import('./questionBank')
    const bank = addSet(null, key, [q('El perro ___ (s)'), q('b')], 1)
    const id = bank.sets[0].id
    const next = mergeGlosses(bank, id, 0, ' El  perro ___ (s) ', { perro: 'dog' })
    expect(next.sets[0].questions[0].glosses).toEqual({ perro: 'dog' })
    expect(mergeGlosses(bank, id, 0, 'a different question', { perro: 'dog' })).toBe(null)
    expect(mergeGlosses(bank, id, 0, 'El perro ___ (s)', {})).toBe(null)
  })
})

describe('updateBank', () => {
  it('two edits to one card land one after the other, neither lost', async () => {
    let disk = { sets: [{ id: 's', questions: ['a', 'b'] }] }
    const load = async () => { const copy = JSON.parse(JSON.stringify(disk)); await new Promise((r) => setTimeout(r, 5)); return { ok: true, bank: copy } }
    const save = async (d, n, bank) => { await new Promise((r) => setTimeout(r, 5)); disk = bank; return true }
    const edit = (qi, v) => (bank) => ({ ...bank, sets: bank.sets.map((st) => ({ ...st, questions: st.questions.map((q, i) => (i === qi ? v : q)) })) })
    await Promise.all([updateBank('D', 1, edit(0, 'A'), { load, save }), updateBank('D', 1, edit(1, 'B'), { load, save })])
    expect(disk.sets[0].questions).toEqual(['A', 'B'])
  })
  it('a failed read or a null result writes nothing', async () => {
    const save = vi.fn(async () => true)
    expect(await updateBank('D', 2, () => ({ sets: [] }), { load: async () => ({ ok: false }), save })).toBe(false)
    expect(await updateBank('D', 2, () => null, { load: async () => ({ ok: true, bank: { sets: [] } }), save })).toBe(false)
    expect(save).not.toHaveBeenCalled()
  })
})
