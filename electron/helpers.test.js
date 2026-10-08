import { describe, it, expect } from 'vitest'
import helpers from './helpers.cjs'

const { makeUrlChecks, isExternalHttpUrl, parseLaunchMode, pickPrimarySource, cleanBounds, relaunchArgs } = helpers
const { isAppUrl, isAppPage } = makeUrlChecks('http://localhost:3000')

describe('isAppUrl: origin equality, never a prefix', () => {
  it('accepts the app origin, any path', () => {
    expect(isAppUrl('http://localhost:3000')).toBe(true)
    expect(isAppUrl('http://localhost:3000/')).toBe(true)
    expect(isAppUrl('http://localhost:3000/api/keys')).toBe(true)
    expect(isAppUrl('http://LOCALHOST:3000/?overlay=true')).toBe(true)
  })
  it('refuses look-alikes', () => {
    expect(isAppUrl('http://localhost:3000@evil.example/')).toBe(false)
    expect(isAppUrl('http://localhost:30000/')).toBe(false)
    expect(isAppUrl('http://localhost:3000.evil.example/')).toBe(false)
    expect(isAppUrl('https://localhost:3000/')).toBe(false)
    expect(isAppUrl('http://127.0.0.1:3000/')).toBe(false)
    expect(isAppUrl('data:text/html,hi')).toBe(false)
    expect(isAppUrl('')).toBe(false)
    expect(isAppUrl(undefined)).toBe(false)
  })
})

describe('isAppPage: only the root or the overlay page', () => {
  it('accepts the two pages', () => {
    expect(isAppPage('http://localhost:3000/')).toBe(true)
    expect(isAppPage('http://localhost:3000')).toBe(true)
    expect(isAppPage('http://localhost:3000/?overlay=true')).toBe(true)
    expect(isAppPage('http://localhost:3000/#x')).toBe(true)
  })
  it('refuses other paths and queries', () => {
    expect(isAppPage('http://localhost:3000/api/keys')).toBe(false)
    expect(isAppPage('http://localhost:3000/?overlay=true&x=1')).toBe(false)
    expect(isAppPage('http://localhost:3000/dev/legends-gallery/')).toBe(false)
    expect(isAppPage('http://localhost:3000@evil.example/')).toBe(false)
  })
})

describe('isExternalHttpUrl: http(s) only', () => {
  it('accepts web links', () => {
    expect(isExternalHttpUrl('https://console.anthropic.com/settings/keys')).toBe(true)
    expect(isExternalHttpUrl('HTTP://example.com')).toBe(true)
  })
  it('refuses every other scheme and junk', () => {
    for (const u of ['file:///C:/Windows/system32/calc.exe', 'ms-settings:', 'javascript:alert(1)', 'mailto:a@b.c',
      'data:text/html,x', ' https://example.com', 'https://', '', null, undefined, 42]) {
      expect(isExternalHttpUrl(u)).toBe(false)
    }
  })
})

describe('parseLaunchMode', () => {
  it('reads browser, BOM or not', () => {
    expect(parseLaunchMode('{"mode":"browser"}')).toBe('browser')
    expect(parseLaunchMode('\uFEFF{"mode":"browser"}')).toBe('browser')
  })
  it('defaults to app', () => {
    for (const t of ['{"mode":"app"}', '{"mode":"tab"}', '{}', 'null', '', 'not json', '[]']) expect(parseLaunchMode(t)).toBe('app')
  })
})

describe('pickPrimarySource', () => {
  const a = { display_id: '1' }, b = { display_id: '2' }
  it('picks the primary display by id (number or string)', () => {
    expect(pickPrimarySource([a, b], 2)).toBe(b)
    expect(pickPrimarySource([a, b], '1')).toBe(a)
  })
  it('falls back to the first, and to null with nothing', () => {
    expect(pickPrimarySource([a, b], 9)).toBe(a)
    expect(pickPrimarySource([], 1)).toBe(null)
    expect(pickPrimarySource(null, 1)).toBe(null)
  })
})

describe('cleanBounds', () => {
  it('rounds and keeps only real numbers', () => {
    expect(cleanBounds({ x: 10.6, y: '20', width: 300.2, height: 200 })).toEqual({ x: 11, y: 20, width: 300, height: 200 })
    expect(cleanBounds({ x: NaN, y: null, width: 'abc', height: undefined })).toEqual({})
    expect(cleanBounds(null)).toEqual({})
    expect(cleanBounds('x')).toEqual({})
  })
  it('never passes a zero or negative size', () => {
    expect(cleanBounds({ x: -5, y: 0, width: 0, height: -3 })).toEqual({ x: -5, y: 0 })
    expect(cleanBounds({ width: 0.4 })).toEqual({})
  })
})

describe('relaunchArgs', () => {
  it('drops --from-launcher and the executable', () => {
    expect(relaunchArgs(['electron.exe', 'electron/main.cjs', '--from-launcher'])).toEqual(['electron/main.cjs'])
    expect(relaunchArgs(['electron.exe'])).toEqual([])
    expect(relaunchArgs(undefined)).toEqual([])
  })
})
