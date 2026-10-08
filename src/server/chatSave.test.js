import { describe, it, expect } from 'vitest'
import { planChatSave } from './chatSave.js'

const u = (t) => ({ role: 'user', content: t })
const a = (t, extra = {}) => ({ role: 'assistant', content: t, ...extra })
const err = (t) => ({ role: 'assistant', content: t, error: true })

describe('planChatSave', () => {
  it('a new chat never saves error bubbles', () => {
    const p = planChatSave({ messages: [u('hi'), err('API 500'), a('hello')], title: 'hi' }, null)
    expect(p.fork).toBe(false)
    expect(p.messages).toEqual([u('hi'), a('hello')])
  })

  it('a forked copy never saves error bubbles either', () => {
    const disk = { messages: [u('one'), a('other computer')] }
    const p = planChatSave({ hasId: true, messages: [u('one'), a('mine'), err('timeout')] }, disk)
    expect(p.fork).toBe(true)
    expect(p.messages.some((m) => m.error)).toBe(false)
  })

  it('an error bubble saved by an older build does not make the next save fork', () => {
    const disk = { messages: [u('hi'), err('old error'), a('hello')] }
    const p = planChatSave({ hasId: true, messages: [u('hi'), a('hello'), u('more')] }, disk)
    expect(p.fork).toBe(false)
    expect(p.messages).toHaveLength(3)
  })

  it('forks when the disk copy is not a prefix of what was sent', () => {
    expect(planChatSave({ hasId: true, messages: [u('a')] }, { messages: [u('a'), a('b')] }).fork).toBe(true)
    expect(planChatSave({ hasId: true, messages: [u('x'), a('b')] }, { messages: [u('a')] }).fork).toBe(true)
    expect(planChatSave({ hasId: true, messages: [u('a'), a('b')] }, { messages: [u('a')] }).fork).toBe(false)
  })

  it('the same turns keep a card another window added to Anki (same position, front and back only)', () => {
    const card = { front: 'perro', back: 'dog' }
    const disk = { messages: [u('w'), a('r', { cards: [{ ...card, synced: true, addedTo: 'Spanish' }, { front: 'perro', back: 'canine' }] })] }
    const p = planChatSave({ hasId: true, messages: [u('w'), a('r', { cards: [card, { front: 'perro', back: 'mutt' }] })] }, disk)
    expect(p.messages[1].cards[0]).toEqual({ ...card, synced: true, addedTo: 'Spanish' })
    expect(p.messages[1].cards[1].synced).toBeUndefined()
  })

  it('keepTitle: the title, type and mode on disk win', () => {
    const disk = { title: 'Renamed', type: 'help', mode: 'Spanish', messages: [u('a')] }
    const p = planChatSave({ hasId: true, keepTitle: true, title: 'a', mode: 'CompTIA', messages: [u('a'), a('b')] }, disk)
    expect(p.title).toBe('Renamed')
    expect(p.type).toBe('help')
    expect(p.mode).toBeUndefined() // a Help chat belongs to no mode
    const q = planChatSave({ hasId: true, keepTitle: true, title: 'a', mode: 'CompTIA', messages: [u('a'), a('b')] }, { ...disk, type: undefined })
    expect(q.mode).toBe('Spanish')
  })

  it('a non-string title becomes empty, and an odd disk shape saves as sent', () => {
    expect(planChatSave({ messages: [], title: 5 }, null).title).toBe('')
    const p = planChatSave({ hasId: true, messages: [u('a')] }, { messages: 'broken' })
    expect(p.fork).toBe(false)
    expect(p.messages).toEqual([u('a')])
  })
})
