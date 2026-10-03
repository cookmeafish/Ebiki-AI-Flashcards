import { describe, it, expect } from 'vitest'
import { knownTile, knownThinText, sourcesText } from './knownReason'
import { summarizeEvidence } from '../kit/evidence'
import { buildLearnerSnapshot } from '../kit/learnerContext'
import { makeT, APP_LANGUAGES } from '../../i18n'

const t = makeT('en')
const card = (front, interval) => ({ front, back: 'b', interval, reps: interval ? 3 : 0, lapses: 0 })
const ready = (parts) => ({ status: 'ready', ok: true, sum: summarizeEvidence(buildLearnerSnapshot(parts)) })
const sessions = { ok: true, sessions: [{ cardsStudied: 10, totalQuestions: 20, correct: 15 }] }
const down = { ok: false, name: 'Spanish', unreachable: true }

describe('the "Use what Ebiki knows" tile', () => {
  it('waits while reading', () => {
    expect(knownTile(t, null)).toMatchObject({ key: 'lg_startKnownChecking', enabled: false })
    expect(knownTile(t, { status: 'loading' }).enabled).toBe(false)
  })

  it('Anki down but study sessions known: offered, and says what it will use', () => {
    const r = knownTile(t, ready({ deck: down, study: sessions }))
    expect(r).toMatchObject({ key: 'lg_startKnownNoAnkiPartial', enabled: true, recheck: true })
    expect(t(r.key, r.vars)).toBe('Anki is not answering, so Ebiki will use your study sessions only.')
  })

  it('Anki down and nothing else: not offered, says Anki is not answering (never "is Anki open?" when it is)', () => {
    const r = knownTile(t, ready({ deck: down }))
    expect(r).toMatchObject({ key: 'lg_startKnownNoAnki', enabled: false, recheck: true })
  })

  it('a deck of only new cards is offered (decided after the click)', () => {
    const r = knownTile(t, ready({ deck: { ok: true, name: 'D', total: 50, newTotal: 50, fresh: [card('a', 0)] } }))
    expect(r).toMatchObject({ key: 'lg_startKnownMaybe', enabled: true })
    expect(t(r.key, r.vars)).toContain('the new cards in your deck')
  })

  it('enough: names every source', () => {
    const studied = Array.from({ length: 50 }, (_, i) => card(`w${i}`, 30))
    const r = knownTile(t, ready({ deck: { ok: true, name: 'D', total: 50, newTotal: 0, studied }, study: sessions }))
    expect(r.key).toBe('lg_startKnownDesc')
    expect(t(r.key, r.vars)).toBe('Ebiki reads your level from what it has seen (your studied cards, your study sessions). No test.')
  })

  it('nothing at all with Anki fine: not offered, can check again', () => {
    expect(knownTile(t, ready({ deck: { ok: true, name: 'D' } }))).toMatchObject({ key: 'lg_startKnownNone', enabled: false, recheck: true })
  })
})

describe('after the click', () => {
  it('says what is missing in plain words', () => {
    const sum = summarizeEvidence(buildLearnerSnapshot({ deck: { ok: true, name: 'D', total: 25, studied: Array.from({ length: 25 }, (_, i) => card(`w${i}`, 5)) } }))
    expect(knownThinText(t, 'thin', sum)).toBe('Ebiki needs a bit more to go on. Study about 15 more cards or chat with Ebi a bit, then try again. Or take the test.')
  })
  it('Anki down: says so, and what it had', () => {
    const sum = summarizeEvidence(buildLearnerSnapshot({ deck: down, study: sessions }))
    expect(knownThinText(t, 'thin', sum)).toBe('Anki is not answering, so Ebiki only had your study sessions, and that is not enough yet. Open Anki and try again, or take the test.')
  })
  it('nothing found', () => {
    expect(knownThinText(t, 'thin', summarizeEvidence(buildLearnerSnapshot({})))).toContain('found nothing')
  })
})

describe('source names', () => {
  it('exist in every language', () => {
    const sum = { sources: ['cards', 'newCards', 'sessions', 'chats', 'slips', 'discover', 'practice', 'features'] }
    for (const { code } of APP_LANGUAGES) {
      const tt = makeT(code)
      const text = sourcesText(tt, sum)
      expect(text).not.toMatch(/lg_src/)
      expect(text).not.toMatch(/[—–]/)
    }
  })
})
