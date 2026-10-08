import { describe, it, expect } from 'vitest'
import { boundChatHistory, cleanChatReply, chatTitleText } from './chatReply'

describe('cleanChatReply', () => {
  it('removes every machine tag and keeps the text around them', () => {
    const t = 'Here you go.\n<anki-card>{"front":"gato","back":"cat"}</anki-card>\n<progress-update>likes cats</progress-update>\nDone.<sources>A | https://a.example</sources><offer-search>gato</offer-search>'
    expect(cleanChatReply(t)).toBe('Here you go.\n\n\nDone.')
  })
  it('drops a tag the reply was cut off inside (never its half-written JSON)', () => {
    expect(cleanChatReply('Sure!\n<anki-card>{"front":"ga')).toBe('Sure!')
    expect(cleanChatReply('Notes <progress-update>half')).toBe('Notes')
  })
  it('strips dashes but keeps a digit range', () => {
    expect(cleanChatReply('Pages 10–20 — read them')).toBe('Pages 10-20, read them')
  })
  it('removes shrimp emoji without collapsing indentation', () => {
    expect(cleanChatReply('Hi 🦐 there')).toBe('Hi there')
    expect(cleanChatReply('Bye 🦐.')).toBe('Bye.')
    expect(cleanChatReply('```\nif x:\n    return 1\n```')).toBe('```\nif x:\n    return 1\n```')
  })
  it('handles empty or odd input', () => {
    expect(cleanChatReply(undefined)).toBe('')
    expect(cleanChatReply(null)).toBe('')
  })
})

describe('boundChatHistory', () => {
  it('leaves error bubbles out and labels turns', () => {
    const h = boundChatHistory([
      { role: 'user', content: 'hola' },
      { role: 'assistant', content: 'Ebi could not answer: API 529', error: true },
      { role: 'assistant', content: 'Hola!' },
    ])
    expect(h).toBe('User: hola\n\nAssistant: Hola!')
  })
  it("carries an assistant turn's cards so the model can see them", () => {
    const h = boundChatHistory([{ role: 'assistant', content: 'Made one', cards: [{ front: 'gato', back: 'cat', tags: ['ebiki'], synced: true }] }])
    expect(h).toContain('<anki-card>{"front":"gato","back":"cat","tags":["ebiki"]}</anki-card>')
    expect(h).not.toContain('synced')
  })
  it('keeps the newest turns within the budget plus a capped opening message', () => {
    const msgs = [{ role: 'user', content: 'X'.repeat(50) }]
    for (let i = 0; i < 20; i++) msgs.push({ role: i % 2 ? 'user' : 'assistant', content: `m${i} ` + 'y'.repeat(30) })
    const h = boundChatHistory(msgs, { budget: 200, firstCap: 20 })
    const parts = h.split('\n\n')
    expect(parts[0]).toBe('User: ' + 'X'.repeat(14) + ' …(cut)')
    expect(parts[1]).toBe('(earlier messages omitted)')
    expect(parts[parts.length - 1]).toContain('m19')
    expect(h).not.toContain('m0 ')
  })
  it('always keeps the newest message even when it alone is over budget', () => {
    const h = boundChatHistory([{ role: 'user', content: 'a' }, { role: 'user', content: 'b'.repeat(500) }], { budget: 100 })
    expect(h).toContain('b'.repeat(500))
  })
  it('handles an empty or missing list', () => {
    expect(boundChatHistory([])).toBe('')
    expect(boundChatHistory(null)).toBe('')
  })
})

describe('chatTitleText', () => {
  it('makes one line of a multi-line first message', () => {
    expect(chatTitleText('line one\nline two\r\n\tline three')).toBe('line one line two line three')
  })
  it('caps the length and never ends on a space', () => {
    expect(chatTitleText('a'.repeat(39) + ' bcd')).toBe('a'.repeat(39))
    expect(chatTitleText('x'.repeat(100)).length).toBe(40)
  })
  it('is empty for the image marker, blanks and non-text', () => {
    expect(chatTitleText('(image)')).toBe('')
    expect(chatTitleText('  \n ')).toBe('')
    expect(chatTitleText(undefined)).toBe('')
    expect(chatTitleText({ a: 1 })).toBe('')
  })
})
