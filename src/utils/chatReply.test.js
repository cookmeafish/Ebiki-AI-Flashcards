import { describe, it, expect } from 'vitest'
import { boundChatHistory, cleanChatReply, chatTitleText, stripChatFluff, CHAT_STYLE_RULE } from './chatReply'

describe('Chat replies are fluff free (an independent judge read real ones, 2026-11-15)', () => {
  it('the rule says answer first, no openers, no closing offers or menus', () => {
    expect(CHAT_STYLE_RULE).toMatch(/answer first/)
    expect(CHAT_STYLE_RULE).toMatch(/Never open with praise/)
    expect(CHAT_STYLE_RULE).toMatch(/offer a card only when the learner asks/)
    expect(CHAT_STYLE_RULE).not.toMatch(/[—–]/)
  })
  it('a praise opener and a closing offer are cut, the answer kept', () => {
    expect(stripChatFluff('Great question. A VLAN splits one switch into separate networks.\n\nWant a flashcard for this?')).toBe('A VLAN splits one switch into separate networks.')
    expect(stripChatFluff("I'd be happy to help! Hashing is one way.\n\nDoes that make sense?")).toBe('Hashing is one way.')
    expect(stripChatFluff('Un "atardecer" es la tarde que cae. ¿Quieres que te haga una tarjeta de esta palabra?')).toBe('Un "atardecer" es la tarde que cae.')
    expect(stripChatFluff('Port 22 is SSH. Would you like me to create a flashcard for it?')).toBe('Port 22 is SSH.')
    expect(stripChatFluff('Es correcto.\n\n¿Hay algo en lo que pueda ayudarte hoy? Podemos practicar vocabulario.')).toBe('Es correcto.')
  })
  it('a real teaching question at the end stays, and so does everything else', () => {
    expect(stripChatFluff('Try it: how would you say "I ate" in the past?')).toBe('Try it: how would you say "I ate" in the past?')
    expect(stripChatFluff('Use **ser** for identity.\n\n- Soy alto.\n- Es lunes.')).toBe('Use **ser** for identity.\n\n- Soy alto.\n- Es lunes.')
    expect(stripChatFluff('Want a flashcard?')).toBe('Want a flashcard?') // never empties a reply
  })
  it('a typed reply too long for a direct question, or with an exam tip or a restating table, gets a rewrite', async () => {
    const { chatReplyProblems } = await import('./chatReply')
    const long = 'A proxy forwards requests. It hides the client. It can cache pages. It can filter content. It logs traffic. It can terminate TLS. It can balance load.'
    expect(chatReplyProblems(long, { userText: 'what is a proxy?' }).join(' ')).toMatch(/sentences/)
    expect(chatReplyProblems('A proxy forwards requests for clients.\n\nFor Security+, know that it works at layer 7.', { userText: 'what is a proxy?' }).join(' ')).toMatch(/unasked section/)
    expect(chatReplyProblems('Hashing is one way.\n\nHash | Cipher\nOne way | Two way', { userText: 'hash vs cipher' }).join(' ')).toMatch(/table/)
    expect(chatReplyProblems('A proxy forwards requests for clients and can filter them.', { userText: 'what is a proxy?' })).toEqual([])
    expect(chatReplyProblems(long, { userText: 'explain proxies in detail' })).toEqual([])
    expect(chatReplyProblems('```\n' + 'x = 1;\n'.repeat(80) + '```\nThat sets x.', { userText: 'show code' })).toEqual([])
  })
  it('cleanChatReply applies it after the machine tags are out', () => {
    expect(cleanChatReply('Done, it is below.\n<anki-card>{"front":"x","back":"y"}</anki-card>\nWant me to make another card?')).toBe('Done, it is below.')
  })
})

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
    expect(cleanChatReply('Pages 10—20')).toBe('Pages 10-20')
  })
  it('never turns a dash at a line start or end into a comma', () => {
    expect(cleanChatReply('Words:\n— gato\n  — perro\nMore —\nend')).toBe('Words:\ngato\n  perro\nMore\nend')
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
