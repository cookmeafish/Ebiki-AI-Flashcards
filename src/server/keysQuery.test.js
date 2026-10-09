import { describe, it, expect } from 'vitest'
import { parseKeysQuery, QueryError } from './keysQuery'

describe('parseKeysQuery (/api/keys POST, read before any write)', () => {
  it('reads what the app sends', () => {
    expect(parseKeysQuery('/api/keys')).toEqual({ typed: false, providers: [] })
    expect(parseKeysQuery('/api/keys?source=user&providers=' + encodeURIComponent('openai,gemini'))).toEqual({ typed: true, providers: ['openai', 'gemini'] })
    expect(parseKeysQuery('/api/keys?source=user&providers=anthropic')).toEqual({ typed: true, providers: ['anthropic'] })
    expect(parseKeysQuery('/api/keys?providers=grok%2C%20openai')).toEqual({ typed: false, providers: ['grok', 'openai'] })
    expect(parseKeysQuery('/api/keys?source=autosave')).toEqual({ typed: false, providers: [] })
    expect(parseKeysQuery('/api/keys?source=user&providers=')).toEqual({ typed: true, providers: [] })
  })
  it('throws on a malformed escape (the request becomes a 400, nothing written)', () => {
    for (const u of ['/api/keys?source=user&providers=%E0%A4%A', '/api/keys?providers=%', '/api/keys?providers=open%zzai', '/api/keys?%=x']) {
      expect(() => parseKeysQuery(u), u).toThrow(QueryError)
    }
  })
  it('refuses provider names that are not plain ids', () => {
    for (const u of ['/api/keys?providers=..%2F.env', '/api/keys?providers=a%20b', '/api/keys?providers=' + 'x'.repeat(41)]) {
      expect(() => parseKeysQuery(u), u).toThrow(QueryError)
    }
  })
})
