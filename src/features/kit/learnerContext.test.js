import { describe, it, expect, vi } from 'vitest'
import { buildLearnerSnapshot, formatLearnerContext, contextSources, createLearnerContextCache, shapeDeck, shapeChats, batches, spread, registerLearnerContextSource, readFeatureSources, LC, SECTIONS } from './learnerContext'
import { gatherLearnerContext } from './learnerContextGather'

const info = (cardId, front, interval, extra = {}) => ({ cardId, front, back: `${front} back`, interval, reps: interval ? 4 : 0, lapses: 0, factor: 2500, type: interval ? 2 : 0, ...extra })

describe('snapshot parts', () => {
  it('splits studied and new cards and scales the counts to the whole deck', () => {
    const d = shapeDeck({ ok: true, name: 'D', total: 1000, newTotal: 400, studied: [info(1, 'a', 30), info(2, 'b', 3), info(3, 'c', 40, { lapses: 5 })], fresh: [info(4, 'd', 0)] })
    expect(d).toMatchObject({ ok: true, total: 1000, studied: 600, new: 400, mature: 400, struggling: 200, young: 200 })
    expect(d.sampleStudied[0]).toEqual({ front: 'c', back: 'c back', interval: 40, lapses: 5, reps: 4, ease: 250 })
    expect(d.sampleNew).toEqual([{ front: 'd', back: 'd back' }])
  })

  it('a failed deck read is marked, never an empty deck', () => {
    expect(shapeDeck({ ok: false, name: 'D', error: 'x', unreachable: true })).toMatchObject({ ok: false, unreachable: true, total: 0 })
  })

  it('chats keep the learner lines and short Ebi replies, without machine tags or error bubbles', () => {
    const c = shapeChats({ ok: true, total: 3, items: [{ title: 'T', messages: [
      { role: 'user', content: 'Yo tengo hambre ahora' },
      { role: 'assistant', content: 'Bien! <anki-card>{"front":"x"}</anki-card> Say "tengo".' },
      { role: 'assistant', content: 'boom', error: true },
    ] }] })
    expect(c).toMatchObject({ ok: true, count: 3, learnerMessages: 1, learnerWords: 4 })
    expect(c.items[0].ebi).toEqual(['Bien! Say "tengo".'])
  })

  it('lists which sources hold anything', () => {
    const s = buildLearnerSnapshot({ deck: { ok: true, name: 'D', total: 5, newTotal: 5, fresh: [info(1, 'a', 0)] }, chats: { ok: true, items: [{ title: 't', messages: [{ role: 'user', content: 'hi' }] }] } })
    expect(contextSources(s)).toEqual(['newCards', 'chats'])
    expect(contextSources(buildLearnerSnapshot({}))).toEqual([])
  })

  it('batches and spreads ids', () => {
    expect(batches([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
    expect(spread([1, 2, 3, 4, 5, 6], 3)).toEqual([1, 3, 5])
  })
})

describe('formatLearnerContext', () => {
  const big = buildLearnerSnapshot({
    deck: { ok: true, name: 'D', total: 800, newTotal: 400, studied: Array.from({ length: 400 }, (_, i) => info(i, `word${i}`, 30)), fresh: Array.from({ length: 400 }, (_, i) => info(1000 + i, `new${i}`, 0)) },
    study: { ok: true, sessions: [{ date: '2026-09-01', cardsStudied: 20, totalQuestions: 60, correct: 50 }] },
    slips: { ok: true, items: [{ text: 'ser vs estar', n: 2 }] },
    level: { ok: true, value: 42, line: 'level 42 of 130, B1' },
  })

  it('keeps to the budget', () => {
    for (const budget of [0, 50, 300, 2000, 6000]) expect(formatLearnerContext(big, { budget }).length).toBeLessThanOrEqual(budget)
    expect(formatLearnerContext(big, { budget: 300 })).toMatch(/…$/)
  })

  it('formats only the sections asked for, in that order', () => {
    const t = formatLearnerContext(big, { budget: 5000, sections: ['slips', 'level'] })
    expect(t.indexOf('RECURRING MISTAKES')).toBe(0)
    expect(t).toContain('CURRENT EBIKI LEVEL: level 42 of 130, B1')
    expect(t).not.toContain('DECK')
    expect(formatLearnerContext(big, { sections: ['nope'] })).toBe('')
    expect(formatLearnerContext(null)).toBe('')
  })

  it('labels new cards as scope, never as known', () => {
    const t = formatLearnerContext(big, { budget: 100000, sections: ['new'] })
    expect(t).toMatch(/^NEW CARDS THE LEARNER CHOSE TO STUDY NEXT .*NOT what they know/)
    expect(t.split('\n').length - 1).toBe(LC.sampleNew)
  })

  it('says when the deck could not be read', () => {
    const t = formatLearnerContext(buildLearnerSnapshot({ deck: { ok: false, name: 'D', unreachable: true } }), { sections: ['deck'] })
    expect(t).toContain('could not be read (the card app is not answering)')
  })

  it('has no dashes and knows every section', () => {
    expect(formatLearnerContext(big, { budget: 100000 })).not.toMatch(/[—–]/)
    expect(SECTIONS).toContain('chats')
  })
})

describe('cache', () => {
  it('reuses a snapshot within the TTL, reads again on fresh, on invalidate and after the TTL', async () => {
    let now = 0
    const c = createLearnerContextCache({ ttlMs: 1000, now: () => now })
    const load = vi.fn(async () => ({ n: load.mock.calls.length }))
    expect(await c.get(1, load)).toEqual({ n: 1 })
    expect(await c.get(1, load)).toEqual({ n: 1 })
    expect(await c.get(2, load)).toEqual({ n: 2 }) // per mode
    expect(await c.get(1, load, { fresh: true })).toEqual({ n: 3 })
    c.invalidate()
    expect(await c.get(1, load)).toEqual({ n: 4 })
    now = 2000
    expect(await c.get(1, load)).toEqual({ n: 5 })
  })
  it('drops a failed read', async () => {
    const c = createLearnerContextCache()
    await expect(c.get(1, async () => { throw new Error('x') })).rejects.toThrow('x')
    expect(await c.get(1, async () => 'ok')).toBe('ok')
  })
})

describe('feature sources', () => {
  it('collects what features register; a throwing one is marked, never fatal', async () => {
    registerLearnerContextSource('t-good', async (_ctx, modeId) => ({ title: 'Good', text: `mode ${modeId}` }))
    registerLearnerContextSource('t-bad', async () => { throw new Error('no') })
    const out = await readFeatureSources({}, 7)
    expect(out).toEqual(expect.arrayContaining([{ id: 't-good', ok: true, title: 'Good', text: 'mode 7' }, { id: 't-bad', ok: false, title: 't-bad', text: '' }]))
  })
})

// The gatherer with mocked card store, history and chats (mirrors AnkiConnect's findCards/cardsInfo shapes).
describe('gatherLearnerContext', () => {
  const ids = Array.from({ length: 2000 }, (_, i) => i + 1)
  const newIds = ids.filter((i) => i % 4 === 0)
  const anki = () => {
    const calls = []
    return {
      calls,
      findCards: vi.fn(async (q) => { calls.push(['find', q]); return q.state === 'new' ? newIds : ids }),
      cardsInfo: vi.fn(async (b) => { calls.push(['info', b.length]); return b.map((id) => ({ cardId: id, fields: { Front: { value: `f${id}`, order: 0 }, Back: { value: `b${id}`, order: 1 } }, interval: id % 4 === 0 ? 0 : 25, reps: id % 4 === 0 ? 0 : 3, lapses: 0, factor: 2500, type: id % 4 === 0 ? 0 : 2 })) }),
      text: (c) => ({ front: c.fields.Front.value, back: c.fields.Back.value }),
    }
  }
  const base = (over = {}) => ({
    modeId: 3, modeName: 'Spanish', isLanguage: true, deck: 'Español::Básico',
    history: () => [{ date: '2026-09-30', cardsStudied: 10, totalQuestions: 30, correct: 24 }],
    slips: () => [{ text: 'ser vs estar', n: 2 }],
    chats: {
      list: async () => [{ id: 'a', mode: 'Spanish', title: 'Food' }, { id: 'b', mode: 'Other', title: 'x' }, { id: 'c', mode: 'Spanish', title: 'Bad' }],
      load: async (id) => (id === 'c' ? null : { title: 'Food', messages: [{ role: 'user', content: 'Quiero comer tacos' }, { role: 'assistant', content: 'Muy bien' }] }),
    },
    profile: () => ({ summary: 'Knows basics', level: 'A2' }),
    level: async () => ({ ok: true, value: 30, line: 'level 30' }),
    practice: async () => ({ ok: true, items: [{ kind: 'card', label: 'tacos', src: 'roleplay', at: 1 }] }),
    ...over,
  })

  it('samples a big deck in bounded batches, and keeps every other part', async () => {
    const cards = anki()
    const s = await gatherLearnerContext(base({ cards }))
    expect(cards.findCards).toHaveBeenCalledWith({ deck: 'Español::Básico' })
    expect(cards.findCards).toHaveBeenCalledWith({ deck: 'Español::Básico', state: 'new' })
    const infoCalls = cards.calls.filter((c) => c[0] === 'info')
    expect(infoCalls.every((c) => c[1] <= LC.infoBatch)).toBe(true)
    expect(infoCalls.reduce((n, c) => n + c[1], 0)).toBe(LC.sampleStudied + LC.sampleNew)
    expect(s.deck).toMatchObject({ ok: true, total: 2000, new: 500, studied: 1500 })
    expect(s.deck.sampleNew.length).toBe(LC.sampleNew)
    expect(s.study).toMatchObject({ ok: true, sessions: 1, answers: 30, accuracy: 80 })
    expect(s.chats).toMatchObject({ ok: true, count: 2, learnerMessages: 1 }) // only this mode's chats; one failed to load
    expect(s.discover.profile.level).toBe('A2')
    expect(s.level).toMatchObject({ ok: true, value: 30 })
    expect(s.practice.recent).toEqual(['tacos (roleplay)'])
  })

  it('a card store that is down marks ONLY the deck, and says it is unreachable', async () => {
    const down = { findCards: async () => { const e = new Error('Anki is not running'); e.code = 'notRunning'; throw e }, cardsInfo: async () => [], text: () => ({}) }
    const s = await gatherLearnerContext(base({ cards: down }))
    expect(s.deck).toMatchObject({ ok: false, unreachable: true })
    expect(s.study.ok && s.chats.ok && s.slips.ok).toBe(true)
    expect(contextSources(s)).toEqual(expect.arrayContaining(['sessions', 'chats', 'slips', 'discover', 'practice']))
    expect(contextSources(s)).not.toContain('cards')
  })

  it('an error with no code counts as unreachable only when the app already knows the card store is down', async () => {
    const odd = { findCards: async () => { throw new Error('weird') }, cardsInfo: async () => [], text: () => ({}) }
    expect((await gatherLearnerContext(base({ cards: odd }))).deck).toMatchObject({ ok: false, unreachable: false })
    expect((await gatherLearnerContext(base({ cards: odd, cardsDown: () => true }))).deck.unreachable).toBe(true)
  })

  it('a failed chat list or history is marked on its own part', async () => {
    const s = await gatherLearnerContext(base({ cards: anki(), chats: { list: async () => { throw new Error('503') }, load: async () => null }, history: () => { throw new Error('bad json') } }))
    expect(s.chats.ok).toBe(false)
    expect(s.study.ok).toBe(false)
    expect(s.deck.ok).toBe(true)
  })

  it('no deck chosen is a real empty deck', async () => {
    const s = await gatherLearnerContext(base({ cards: anki(), deck: '' }))
    expect(s.deck).toMatchObject({ ok: true, name: '', total: 0 })
  })
})
