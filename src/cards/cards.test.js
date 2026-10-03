// The card-backend layer: the contract, the facade's routing, and the Anki adapter's translation of
// structured queries and rating records into AnkiConnect calls.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { srs, registerBackend, selectBackend, activeBackend, hasCapability } from './index'
import { REQUIRED_METHODS, missingMethods, oneStepInterval } from './contract'
import { ankiBackend, compileQuery, deckTerm } from './anki'
import { templateBackend } from './template'

afterEach(() => { selectBackend('anki'); vi.restoreAllMocks() })

describe('contract', () => {
  it('the Anki backend and the template implement every required method', () => {
    expect(missingMethods(ankiBackend)).toEqual([])
    expect(missingMethods(templateBackend)).toEqual([])
  })
  it('names what an incomplete backend lacks, and refuses to register it', () => {
    expect(missingMethods({ id: 'x', ping: () => true })).toContain('recordRatings')
    expect(() => registerBackend({ id: 'half', ping: async () => true })).toThrow(/missing/)
  })
  it('oneStepInterval is the SM-2 step the Anki fallbacks always used', () => {
    expect(oneStepInterval(1, 30, 2500).next).toBe(0)
    expect(oneStepInterval(2, 30, 2500).next).toBe(36)
    expect(oneStepInterval(3, 30, 2500).next).toBe(75)
    expect(oneStepInterval(4, 30, 2500).next).toBe(98)
    expect(oneStepInterval(4, 1, 2500).next).toBe(4) // Easy always lands past Good (3)
    expect(oneStepInterval(3, 0, 0)).toEqual({ curIvl: 1, factor: 2500, next: 3 }) // new card, no factor
    expect(oneStepInterval(3, 30000, 2500).next).toBe(36500) // capped at 100 years
  })
})

describe('facade', () => {
  it('routes every call to the selected backend, late-bound', async () => {
    const fake = { ...templateBackend, id: 'fake', getDecks: async () => ['Mine'], capabilities: {} }
    registerBackend(fake)
    selectBackend('fake')
    expect(activeBackend().id).toBe('fake')
    expect(await srs.getDecks()).toEqual(['Mine'])
    expect(REQUIRED_METHODS.every((m) => typeof srs[m] === 'function')).toBe(true)
  })
  it('optional methods fall back to harmless defaults; files fail so readers fall back to local', async () => {
    registerBackend({ ...templateBackend, id: 'bare' })
    selectBackend('bare')
    expect(hasCapability('cloudSync')).toBe(false)
    await expect(srs.sync()).resolves.toBeUndefined()
    expect(srs.syncSoon()).toBeUndefined()
    expect(await srs.cloudAuthState()).toBe('unknown')
    expect(await srs.setupStatus()).toBe(null)
    await expect(srs.readFile('x')).rejects.toThrow()
    expect(hasCapability('suspend')).toBe(false)
    expect(await srs.suspendedCards([1, 2])).toEqual([false, false])
    await expect(srs.unsuspendCards([1])).rejects.toThrow()
  })
  it('Anki is the default and has all the optional abilities', () => {
    expect(activeBackend().id).toBe('anki')
    expect(['cloudSync', 'files', 'setup', 'suspend'].every(hasCapability)).toBe(true)
  })
  it('Anki reports and lifts suspensions', async () => {
    const calls = fakeAnki({ areSuspended: ({ cards }) => cards.map((c) => c === 2), unsuspend: () => true })
    expect(await srs.suspendedCards([1, 2])).toEqual([false, true])
    await srs.unsuspendCards([2])
    expect(calls.find(([a]) => a === 'unsuspend')[1]).toEqual({ cards: [2] })
    vi.restoreAllMocks()
  })
})

describe('Anki queries', () => {
  // The exact strings App.jsx sent before queries were structured: the compiled form must not drift.
  it('compile to the search strings the app always used', () => {
    const d = 'Spanish::Verbs'
    const D = deckTerm(d)
    expect(compileQuery({ deck: d })).toBe(D)
    expect(compileQuery({ noteId: 17 })).toBe('nid:17')
    expect(compileQuery({ deck: d, excludeSuspended: true })).toBe(`${D} -is:suspended`)
    expect(compileQuery({ deck: d, state: 'dueOrNew', excludeSuspended: true, excludeBuried: true })).toBe(`${D} (is:due OR is:new) -is:suspended -is:buried`)
    expect(compileQuery({ deck: d, state: 'due', excludeSuspended: true, excludeBuried: true })).toBe(`${D} is:due -is:suspended -is:buried`)
    expect(compileQuery({ deck: d, text: 'pretérito', ignoreAccents: true })).toBe(`${D} "nc:pretérito"`)
    expect(compileQuery({ deck: d, text: 'casa' })).toBe(`${D} "casa"`)
    expect(compileQuery({ cardId: 5, state: 'dueOrNew', excludeSuspended: true, excludeBuried: true })).toBe('cid:5 (is:due OR is:new) -is:suspended -is:buried')
    expect(compileQuery({ cardId: 5, state: 'new' })).toBe('cid:5 is:new')
  })
  it('escapes deck wildcards and strips search operators from text', () => {
    expect(deckTerm('Unit_1*')).toBe('deck:"Unit\\_1\\*"')
    expect(compileQuery({ text: 'a"b*(c):' })).toBe('"abc"')
  })
  it('never compiles to "everything"', () => {
    expect(() => compileQuery({})).toThrow(/empty/)
    expect(() => compileQuery({ text: '**' })).toThrow(/empty/)
    expect(() => compileQuery({ deck: 'x', state: 'someday' })).toThrow(/unknown/)
    expect(() => compileQuery('deck:x')).toThrow()
  })
})

// A scripted AnkiConnect behind /api/anki: `handlers[action](params)` answers each call, and every
// call is logged.
function fakeAnki(handlers) {
  const calls = []
  globalThis.fetch = vi.fn(async (url, init) => {
    const { action, params } = JSON.parse(init.body)
    calls.push([action, params])
    const h = handlers[action]
    if (!h) return { json: async () => ({ result: null, error: `unexpected ${action}` }) }
    let body
    try { body = { result: await h(params), error: null } } catch (e) { body = { result: null, error: e.message } }
    return { json: async () => body }
  })
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
  return calls
}
function hookRecorder() {
  const log = { recorded: [], uncertain: new Map(), notOurs: [] }
  return {
    log,
    hooks: {
      recorded: (cs) => log.recorded.push(cs),
      markUncertain: (id, at) => log.uncertain.set(id, at),
      clearUncertain: (id) => log.uncertain.delete(id),
      uncertainSince: (id) => log.uncertain.get(id),
      forgetUncertain: (id) => log.uncertain.delete(id),
      notOurs: (id) => log.notOurs.push(id),
    },
  }
}

describe('Anki recordRatings', () => {
  it('answers each presented card once through the reviewer, capped to its buttons', async () => {
    const queue = [{ cardId: 1, buttons: [1, 2, 3] }, { cardId: 2, buttons: [1, 2, 3, 4] }]
    const calls = fakeAnki({
      guiDeckReview: () => true, guiCurrentCard: () => queue[0] || null, guiShowAnswer: () => true,
      guiAnswerCard: () => { queue.shift(); return true }, guiDeckBrowser: () => true,
    })
    const { log, hooks } = hookRecorder()
    const r = await srs.recordRatings({ deck: 'D', ratings: [{ cardId: 1, ease: 4, rating: 'easy' }, { cardId: 2, ease: 3, rating: 'good' }], hooks })
    expect(r.failed).toEqual([])
    expect(log.recorded.map((c) => c.cardId)).toEqual([1, 2])
    expect(calls.filter(([a]) => a === 'guiAnswerCard').map(([, p]) => p.ease)).toEqual([3, 3]) // Easy capped to a 3-button card
    expect(log.uncertain.size).toBe(2) // marked before each call; the app's recorded hook (markSynced) clears it
  })
  it('a card Anki no longer considers due is not answered again', async () => {
    const calls = fakeAnki({ guiDeckReview: () => true, guiCurrentCard: () => null, guiDeckBrowser: () => true, findCards: () => [] })
    const { log, hooks } = hookRecorder()
    await srs.recordRatings({ deck: 'D', ratings: [{ cardId: 9, ease: 3, rating: 'good' }], hooks })
    expect(log.notOurs).toEqual([9])
    expect(log.recorded.map((c) => c.cardId)).toEqual([9])
    expect(calls.some(([a]) => a === 'answerCards' || a === 'setDueDate')).toBe(false)
  })
  it('a new card the reviewer never shows gets a first interval with "!" and a revlog row', async () => {
    const calls = fakeAnki({
      guiDeckReview: () => true, guiCurrentCard: () => null, guiDeckBrowser: () => true,
      findCards: ({ query }) => (/is:new$/.test(query) || /is:due OR is:new/.test(query) ? [7] : []),
      answerCards: () => { throw new Error('card 7 not at top of queue') },
      setDueDate: () => true, insertReviews: () => true,
    })
    const { log, hooks } = hookRecorder()
    const r = await srs.recordRatings({ deck: 'D', ratings: [{ cardId: 7, ease: 3, rating: 'good' }], hooks })
    expect(r.failed).toEqual([])
    expect(calls.find(([a]) => a === 'setDueDate')[1]).toEqual({ cards: [7], days: '2!' })
    const rev = calls.find(([a]) => a === 'insertReviews')[1].reviews[0]
    expect(rev.slice(1, 7)).toEqual([7, -1, 3, 2, 0, 2500])
    expect(log.recorded.map((c) => c.cardId)).toEqual([7])
  })
  it('settles an earlier lost answer from the review log with the grade Anki kept', async () => {
    fakeAnki({
      getReviewsOfCards: () => ({ 4: [{ id: 5000, ease: 2 }] }),
      guiDeckReview: () => true, guiCurrentCard: () => null, guiDeckBrowser: () => true,
    })
    const { log, hooks } = hookRecorder()
    log.uncertain.set(4, 4500)
    await srs.recordRatings({ deck: 'D', ratings: [{ cardId: 4, ease: 3, rating: 'good' }], hooks })
    expect(log.recorded).toEqual([{ cardId: 4, ease: 2, rating: 'hard' }])
    expect(log.uncertain.has(4)).toBe(false)
  })
})

describe('Anki correctRating', () => {
  it('adds one follow-up step from the pre-review schedule', async () => {
    const calls = fakeAnki({ setDueDate: () => true, insertReviews: () => true })
    const ivl = await srs.correctRating({ cardId: 3, ease: 3, preSchedule: { interval: 10, factor: 2500 } })
    expect(ivl).toBe(25)
    expect(calls[0]).toEqual(['setDueDate', { cards: [3], days: '25!' }])
    expect(calls[1][1].reviews[0].slice(1, 9)).toEqual([3, -1, 3, 25, 10, 2500, 0, 1])
  })
})

// ANKI LIVES IN ONE PLACE. Only the Anki adapter (src/cards/anki) knows AnkiConnect: its routes, its search syntax,
// its action names, its media naming. Everything else talks to the card store through `srs` (./index.js) and the
// contract (./contract.js), so a replacement backend is ./template.js filled in plus one selectBackend call.
// Anki-NAMED state and text stay on purpose (ankiConnected, ankiDeck, i18n strings, the AnkiWeb banner): this checks
// the CODE that would break with another store, not names.
describe('Anki stays behind the facade', () => {
  it('no file outside src/cards/anki imports it, calls its routes, or speaks Anki', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const SRC = path.resolve(__dirname, '..')
    const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]))
    const rel = (f) => path.relative(SRC, f).split(path.sep).join('/')
    // The adapter itself, the facade that registers it, and the desktop server halves.
    const ALLOWED = /^(cards\/anki\/|cards\/index\.js$|.*server\.js$)/
    const RULES = [
      [/from\s+['"][^'"]*cards\/anki['"/]/, 'imports the Anki adapter (use srs from src/cards)'],
      // (/api/ankiformat is Ebiki's own legacy data file, not AnkiConnect.)
      [/['"`]\/api\/anki(?!format)/, "calls an /api/anki route (the adapter's server half)"],
      // Anki search syntax: queries are structured objects (contract.js Query), compiled only by the adapter.
      [/['"`][^'"`\n]*(?:\b(?:deck|cid|nid|prop|rated|introduced|added):["\w(*]|\bis:(?:due|new|review|learn|suspended|buried)\b)/, 'writes Anki search syntax'],
      // AnkiConnect action names (the contract has its own names: recordRatings, readFile, ...).
      [/['"`](?:gui[A-Z]\w+|setDueDate|insertReviews|storeMediaFile|retrieveMediaFile|answerCards|getNumCardsReviewed\w*|cardReviews|canAddNotes|forgetCards|changeDeck|deckNamesAndIds|getDeckStats|areDue|areSuspended|unsuspend|multi)['"`]/, 'names an AnkiConnect action'],
      // The app's own blob names in Anki's media folder belong to the adapter (blobFileName).
      [/_ebiki_|_screenlens\//, "uses the adapter's media naming"],
    ]
    const bad = []
    for (const f of walk(SRC).filter((x) => /\.(js|jsx)$/.test(x) && !/\.test\.js$/.test(x))) {
      const r = rel(f)
      if (ALLOWED.test(r) || r.startsWith('i18n/locales/')) continue
      fs.readFileSync(f, 'utf8').split(/\r?\n/).forEach((line, i) => {
        if (/^\s*(\/\/|\*)/.test(line)) return // comments may explain Anki
        for (const [re, why] of RULES) if (re.test(line)) bad.push(`${r}:${i + 1} ${why}`)
      })
    }
    expect(bad).toEqual([])
  })
  it('the facade gives a store without files harmless blob names', async () => {
    const fake = { ...templateBackend, id: 'nofiles', capabilities: {} }
    registerBackend(fake)
    selectBackend('nofiles')
    expect(srs.blobFileName('hooks', 'spanish')).toBe('ebiki-hooks__spanish.json')
    expect(srs.legacyBlobFileName('hooks', 'spanish')).toBe(null)
    selectBackend('anki')
    expect(srs.blobFileName('hooks', 'spanish')).toBe('_ebiki_hooks__spanish.json')
  })
})

describe('rating writes are serialized', () => {
  it('a second recordRatings / correctRating waits for the first, and a failure never blocks the next', async () => {
    const order = []
    let release
    const gate = new Promise((r) => { release = r })
    const fake = { ...templateBackend, id: 'serial-test',
      recordRatings: async ({ deck }) => { order.push(`start ${deck}`); if (deck === 'A') await gate; if (deck === 'B') throw new Error('boom'); order.push(`end ${deck}`); return { failed: [] } },
      correctRating: async () => { order.push('correct'); return 1 } }
    registerBackend(fake); selectBackend('serial-test')
    const a = srs.recordRatings({ deck: 'A', ratings: [] })
    const b = srs.recordRatings({ deck: 'B', ratings: [] })
    const c = srs.correctRating({ cardId: 1, ease: 3 })
    await Promise.resolve(); await Promise.resolve()
    expect(order).toEqual(['start A'])
    release()
    await a; await expect(b).rejects.toThrow('boom'); await c
    expect(order).toEqual(['start A', 'end A', 'start B', 'correct'])
  })
})
