import { describe, it, expect, vi } from 'vitest'
import { buildLearnerSnapshot, formatLearnerContext, ALL_SECTIONS } from './learnerContext'
import { CONTEXT_USES, learnerContextFor, learnerContextText, redactSnapshot, snapshotForMode, discoverEvidence, holdsAnswer, headForms, foldText } from './learnerContextUse'

const card = (front, back, interval, lapses = 0) => ({ front, back, interval, reps: interval ? 5 : 0, lapses, factor: 2500, type: interval ? 2 : 0 })

const snapFor = (modeId = 7) => buildLearnerSnapshot({
  modeId, modeName: 'Spanish', isLanguage: true,
  deck: {
    ok: true, name: 'Español', total: 40, newTotal: 10,
    studied: [card('perro (n)', 'dog', 30), card('gato', 'cat', 2, 4), card('casa', 'house', 25, 5), card('mañana', 'tomorrow', 10, 3)],
    fresh: [card('sombrero', 'hat', 0), card('perro', 'dog (again)', 0)],
  },
  study: { ok: true, sessions: [{ date: '2026-09-30', cardsStudied: 12, totalQuestions: 36, correct: 27, accuracy: 75 }] },
  slips: { ok: true, items: [{ text: 'write mañana with ñ', n: 3 }, { text: 'ser vs estar', n: 2 }] },
  chats: { ok: true, total: 2, items: [
    { title: 'Pets', messages: [{ role: 'user', content: 'how do I say dog? is it perro?' }, { role: 'assistant', content: 'Yes, el perro.' }] },
    { title: 'Weather', messages: [{ role: 'user', content: 'what about tomorrow' }, { role: 'assistant', content: 'Use mañana.' }] },
  ] },
  discover: { ok: true, profile: { summary: 'Knows basic nouns', level: 'A2' } },
  level: { ok: true, value: 30, line: 'level 30 of 130, A2' },
  practice: { ok: true, items: [{ label: 'gato', src: 'roleplay', at: 2 }, { label: 'restaurant talk', src: 'ebi-call', at: 1 }] },
  extra: [{ id: 'legends', ok: true, title: 'Legends', text: 'Area 1 "Pets": perro = dog taught\nArea 2 "Home": 2/8 levels' }],
})

describe('helpers', () => {
  it('folds and finds whole-word answers, never a single letter, CJK by substring', () => {
    expect(foldText('  Mañana ')).toBe('manana')
    expect(holdsAnswer('Use mañana.', 'manana')).toBe(true)
    expect(holdsAnswer('mañanas', 'mañana')).toBe(false)
    expect(holdsAnswer('a b c', 'a')).toBe(false)
    expect(holdsAnswer('今日は雨です', '雨')).toBe(false) // one character: never
    expect(holdsAnswer('今日は雨天です', '雨天')).toBe(true)
  })
  it('reads headword forms of a front', () => {
    expect(headForms('perro (n)')).toEqual(['perro'])
    expect(headForms('el/la estudiante')).toEqual(['el/la estudiante', 'la estudiante'])
    expect(headForms('té')).toEqual(['te'])
  })
})

describe('mode guard', () => {
  it('a snapshot gathered for another mode is ignored', () => {
    const s = snapFor(7)
    expect(snapshotForMode(s, 7)).toBe(s)
    expect(snapshotForMode(s, '7')).toBe(s) // ids compare as strings
    expect(snapshotForMode(s, 8)).toBe(null)
    expect(snapshotForMode(s, null)).toBe(null)
    for (const use of Object.keys(CONTEXT_USES)) {
      expect(learnerContextFor(s, 8, use)).toBe('')
      expect(learnerContextFor(s, 7, use)).not.toBe('')
    }
  })
  it('through ctx: uses only the cached snapshot of ctx.subject.modeId', () => {
    const s = snapFor(7)
    const cached = vi.fn(() => s)
    expect(learnerContextText({ learning: { cached }, subject: { modeId: 7 } })).toContain('What Ebiki knows')
    expect(learnerContextText({ learning: { cached }, subject: { modeId: 9 } })).toBe('')
    expect(learnerContextText({ learning: { cached: () => { throw new Error('x') } }, subject: { modeId: 7 } })).toBe('')
    expect(learnerContextText(null)).toBe('')
  })
})

describe('each consumer', () => {
  it('stays within its budget plus the heading, and has no dashes', () => {
    const big = buildLearnerSnapshot({
      modeId: 1,
      deck: { ok: true, name: 'D', total: 900, newTotal: 300, studied: Array.from({ length: 300 }, (_, i) => card(`word${i}`, `meaning ${i}`, 30, i % 5)), fresh: Array.from({ length: 60 }, (_, i) => card(`new${i}`, 'x', 0)) },
      slips: { ok: true, items: Array.from({ length: 20 }, (_, i) => ({ text: `slip number ${i} about something long enough`, n: 2 })) },
      chats: { ok: true, total: 8, items: Array.from({ length: 8 }, (_, i) => ({ title: `topic ${i}`, messages: [{ role: 'user', content: 'x'.repeat(300) }] })) },
      study: { ok: true, sessions: Array.from({ length: 8 }, () => ({ date: '2026-09-01', cardsStudied: 10, totalQuestions: 30, correct: 20 })) },
    })
    for (const [use, u] of Object.entries(CONTEXT_USES)) {
      const t = learnerContextFor(big, 1, use)
      expect(t.startsWith(u.header)).toBe(true)
      expect(t.length).toBeLessThanOrEqual(u.header.length + 1 + u.budget)
      expect(t).not.toMatch(/[—–]/)
      expect(u.header).not.toMatch(/[—–]/)
    }
  })
  it('knows every section a consumer asks for', () => {
    for (const u of Object.values(CONTEXT_USES)) for (const sec of u.sections) expect(ALL_SECTIONS).toContain(sec)
  })
  it('the compact sections: forgotten cards and chat topics', () => {
    const t = formatLearnerContext(snapFor(), { budget: 5000, sections: ['weak', 'topics'] })
    expect(t).toContain('CARDS THE LEARNER KEEPS FORGETTING')
    expect(t).toContain('"casa" = "house" (forgotten 5x)')
    expect(t).not.toContain('"perro')
    expect(t).toContain('RECENT CHAT TOPICS WITH EBI (2 chats')
  })
  it('the question block is wording only: level, accuracy, slips; no cards', () => {
    const t = learnerContextFor(snapFor(), 7, 'question')
    expect(t).toContain('75% right')
    expect(t).toContain('ser vs estar')
    expect(t).not.toContain('sombrero')
    expect(t).not.toContain('DECK')
  })
  it('omit drops sections the prompt already has', () => {
    const t = learnerContextFor(snapFor(), 7, 'chat', { omit: ['level', 'slips'] })
    expect(t).not.toContain('CURRENT EBIKI LEVEL')
    expect(t).not.toContain('RECURRING MISTAKES')
  })
})

describe('Help secrecy', () => {
  const live = { hideFronts: ['mañana'], hideAnswers: ['mañana', 'manana'] }
  it('leaves out the live question card front and its answers everywhere', () => {
    const t = learnerContextFor(snapFor(), 7, 'help', { ...live, sections: [...CONTEXT_USES.help.sections, 'new', 'slips', 'chats'], budget: 100000 })
    expect(foldText(t)).not.toContain('manana')
    expect(t).toContain('"gato"') // other cards stay
    expect(t).toContain('ser vs estar')
    // Without the guard the same block does name it (so the test above means something).
    expect(foldText(learnerContextFor(snapFor(), 7, 'help', { sections: [...CONTEXT_USES.help.sections, 'new', 'slips', 'chats'], budget: 100000 }))).toContain('manana')
  })
  it('a live card with the same headword is dropped from every card list', () => {
    const r = redactSnapshot(snapFor(), { hideFronts: ['perro'] })
    expect(r.deck.sampleStudied.map((c) => c.front)).not.toContain('perro (n)')
    expect(r.deck.sampleNew.map((c) => c.front)).not.toContain('perro')
  })
  it('the app fuzzy check removes inflected answers too', () => {
    const r = redactSnapshot(snapFor(), { reveals: (text) => /gat/i.test(text) })
    expect(r.deck.sampleStudied.map((c) => c.front)).not.toContain('gato')
    expect(r.practice.recent.join(' ')).not.toContain('gato')
  })
  it('while a feature quiz, fight or raid runs: no card lists, meanings or feature sections', () => {
    const t = learnerContextFor(snapFor(), 7, 'help', { secret: true, budget: 100000, sections: [...CONTEXT_USES.help.sections, 'new'] })
    expect(t).not.toContain('= "dog"')
    expect(t).not.toContain('house')
    expect(t).not.toContain('LEGENDS')
    expect(t).toContain('DECK "Español"') // counts are not secret
  })
  it('while secret, the practice log keeps topics but drops the CARD fronts practiced (a raid asks those cards)', () => {
    const s = buildLearnerSnapshot({ modeId: 7, practice: { ok: true, items: [{ kind: 'card', label: 'perro', src: 'ebi-call', at: 3 }, { kind: 'topic', label: 'restaurant talk', src: 'roleplay', at: 2 }] } })
    const r = redactSnapshot(s, { secret: true })
    expect(r.practice.recent.join(' ')).not.toContain('perro')
    expect(r.practice.recent.join(' ')).toContain('restaurant talk')
    expect(redactSnapshot(s, { hideAnswers: ['xyz'] }).practice.recent.join(' ')).toContain('perro')
  })
  it('does not touch the original snapshot', () => {
    const s = snapFor()
    redactSnapshot(s, { secret: true, hideAnswers: ['perro'] })
    expect(s.deck.sampleStudied.length).toBe(4)
    expect(s.extra.length).toBe(1)
  })
})

describe('discoverEvidence', () => {
  it('uses the snapshot only for the same mode and deck, read OK', () => {
    const s = snapFor(7)
    const ev = discoverEvidence(s, { modeId: 7, deck: 'Español' })
    expect(ev.mastery).toMatch(/^Scheduling: 40 cards/)
    expect(ev.chatCount).toBe(2)
    expect(ev.chatTitles).toEqual(['Pets', 'Weather'])
    expect(ev.study).toContain('75% right')
    expect(ev.slips).toContain('ser vs estar')
    expect(discoverEvidence(s, { modeId: 8, deck: 'Español' })).toBe(null)
    expect(discoverEvidence(s, { modeId: 7, deck: 'Other' })).toBe(null)
    expect(discoverEvidence(buildLearnerSnapshot({ modeId: 7, deck: { ok: false, name: 'Español' } }), { modeId: 7, deck: 'Español' })).toBe(null)
  })
  it('a failed chat read leaves the chats to Discover', () => {
    const s = buildLearnerSnapshot({ modeId: 7, deck: { ok: true, name: 'D', total: 1, studied: [card('a', 'b', 3)] }, chats: { ok: false } })
    expect(discoverEvidence(s, { modeId: 7, deck: 'D' }).chatCount).toBe(null)
  })
})
