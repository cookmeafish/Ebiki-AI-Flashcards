// The render sanitizer's OPTIONS (vitest has no DOM, so DOMPurify itself is stubbed and only what sanitizeHtml asks
// it to do is checked; the vectors themselves were run in Chrome against the real DOMPurify).
import { describe, it, expect, vi, beforeEach } from 'vitest'

const calls = []
const hooks = {}
vi.mock('dompurify', () => ({
  default: {
    addHook: (name, fn) => { hooks[name] = fn },
    sanitize: (html, opts) => { calls.push(opts); return html },
  },
}))
const { sanitizeHtml } = await import('./Markdown.jsx')

describe('sanitizeHtml', () => {
  beforeEach(() => { calls.length = 0 })

  it('clobber-proofs ids and names by default', () => {
    // A shared-deck card back rendered in the lookup popup with id="ebikiWindow" became window.ebikiWindow.
    sanitizeHtml('<i id="ebikiWindow">x</i>')
    expect(calls[0].SANITIZE_NAMED_PROPS).toBe(true)
  })

  it('lets a first-party caller turn the id prefix off, never the forbidden lists', () => {
    sanitizeHtml('<svg/>', { SANITIZE_NAMED_PROPS: false, FORBID_TAGS: [], FORBID_ATTR: [] })
    expect(calls[0].SANITIZE_NAMED_PROPS).toBe(false)
    for (const tag of ['style', 'img', 'iframe', 'form', 'base', 'meta', 'link', 'dialog', 'image', 'use', 'feimage', 'video', 'audio', 'source', 'object', 'embed'])
      expect(calls[0].FORBID_TAGS).toContain(tag)
    for (const attr of ['srcset', 'background', 'poster', 'ping', 'formaction', 'xlink:href', 'popover', 'popovertarget'])
      expect(calls[0].FORBID_ATTR).toContain(attr)
  })

  it('turns anything into a string first', () => {
    expect(sanitizeHtml(null)).toBe('')
    expect(sanitizeHtml(undefined)).toBe('')
    expect(sanitizeHtml(42)).toBe('42')
  })

  it('drops an inline style that positions over the app, the -webkit- alias too', () => {
    const keep = (style) => { const data = { attrName: 'style', attrValue: style, keepAttr: true }; hooks.uponSanitizeAttribute({ nodeName: 'DIV' }, data); return data.keepAttr }
    expect(keep('color: red')).toBe(true)
    expect(keep('position: fixed; inset: 0')).toBe(false)
    expect(keep('position:-webkit-sticky; top:0')).toBe(false)
    expect(keep('position: relative')).toBe(true)
  })
})
