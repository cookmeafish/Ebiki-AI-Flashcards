// Rules every installed feature must follow, checked for all of them at once.
import { describe, it, expect, vi } from 'vitest'
import { registry } from './index'
import { createRegistry, SLOT } from './registry'
import { SERVER_FEATURES } from './server'
import { EVENTS } from './events'
import { I18N_LANGS, makeT } from '../i18n'

describe('installed features', () => {
  it('have unique lowercase ids', () => {
    const ids = registry.features.map((f) => f.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z][a-z0-9-]*$/)
  })

  for (const f of registry.features) {
    describe(f.id, () => {
      it('carries no text of its own (all UI text lives in src/i18n/locales)', () => {
        expect(f.strings, f.id).toBeUndefined()
      })
      it('fills its slots with components', () => {
        for (const slot of [SLOT.HEADER, SLOT.RAIL, SLOT.SETTINGS]) {
          for (const item of f[slot] || []) {
            expect(item.id, `${f.id}.${slot}`).toBeTruthy()
            expect(typeof item.Component, `${f.id}.${slot}.${item.id}`).toBe('function')
          }
        }
        // Screens (sidebar and Practice tiles) need a Screen and a label that exists in every language.
        for (const slot of [SLOT.NAV, SLOT.PRACTICE]) {
          for (const item of f[slot] || []) {
            expect(typeof item.Screen, `${f.id}.${slot}.${item.id}`).toBe('function')
            for (const key of [item.labelKey, item.titleKey, item.descKey].filter(Boolean)) {
              for (const l of I18N_LANGS) expect(makeT(l)(key), `${f.id}: ${key} (${l})`).not.toBe(key)
            }
          }
        }
      })
      it('gives every Chat menu entry an action and a label in every language', () => {
        for (const item of f[SLOT.CHAT_MENU] || []) {
          expect(typeof item.onPick, `${f.id}.${item.id}`).toBe('function')
          for (const l of I18N_LANGS) expect(makeT(l)(item.labelKey), `${f.id}: ${item.labelKey} (${l})`).not.toBe(item.labelKey)
        }
      })
      it('an optional feature names and explains itself in every language', () => {
        if (!f.optional) return
        for (const key of [f.nameKey, f.descKey]) {
          expect(key, f.id).toBeTruthy()
          for (const l of I18N_LANGS) expect(makeT(l)(key), `${f.id}: ${key} (${l})`).not.toBe(key)
        }
      })
      it('only listens to known app events', () => {
        const known = new Set(Object.values(EVENTS))
        for (const ev of Object.keys(f.on || {})) expect(known.has(ev), ev).toBe(true)
      })
    })
  }

  it('server parts claim distinct data folders and routes', () => {
    const entries = SERVER_FEATURES.flatMap((f) => f.dataEntries || [])
    const routes = SERVER_FEATURES.flatMap((f) => f.dataRoutes || [])
    expect(new Set(entries).size).toBe(entries.length)
    expect(new Set(routes).size).toBe(routes.length)
    for (const r of routes) expect(r.startsWith('/')).toBe(true)
  })
})

describe('registry', () => {
  it('orders a slot across features and tags each entry', () => {
    const A = () => null
    const r = createRegistry([
      { id: 'a', railCards: [{ id: 'late', order: 90, Component: A }] },
      { id: 'b', railCards: [{ id: 'early', order: 5, Component: A }] },
    ])
    expect(r.slot(SLOT.RAIL).map((i) => `${i.feature}:${i.id}`)).toEqual(['b:early', 'a:late'])
  })
  it('refuses duplicate or malformed ids', () => {
    expect(() => createRegistry([{ id: 'x' }, { id: 'x' }])).toThrow(/duplicate/)
    expect(() => createRegistry([{ id: 'Bad Id' }])).toThrow()
  })
  it('a failing listener never breaks the app or the other listeners', () => {
    const seen = []
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const r = createRegistry([
      { id: 'boom', on: { [EVENTS.CHAT_SENT]: () => { throw new Error('x') } } },
      { id: 'ok', on: { [EVENTS.CHAT_SENT]: (p) => seen.push(p.mode) } },
    ])
    expect(() => r.emit(EVENTS.CHAT_SENT, { mode: 7 })).not.toThrow()
    expect(seen).toEqual([7])
  })
})

// Features never reach into App internals: no App.jsx, app components, shell or dev data. The listed exceptions are
// deliberate and documented where they live.
describe('feature isolation', () => {
  const ALLOWED = new Map([
    ['legends/art.jsx', /components\/Markdown/],            // the app's sanitizeHtml, loaded lazily (Markdown needs a DOM)
    ['legends/BossFamilies.jsx', /dev\/legends-gallery\/catalog/], // EXPERIMENTAL tab (removal list: families.js)
  ])
  it('imports no App internals', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const root = path.resolve(__dirname)
    const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]))
    const bad = []
    for (const f of walk(root).filter((x) => /\.(js|jsx)$/.test(x) && !/\.test\.js$/.test(x))) {
      const r = path.relative(root, f).split(path.sep).join('/')
      for (const m of fs.readFileSync(f, 'utf8').matchAll(/(?:from|import\()\s*['"]((?:\.\.\/)+(?:App|components|shell|dev)\b[^'"]*)['"]/g)) {
        if (ALLOWED.get(r)?.test(m[1])) continue
        bad.push(`${r}: ${m[1]}`)
      }
    }
    expect(bad).toEqual([])
  })
})
