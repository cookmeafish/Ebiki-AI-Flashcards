import { describe, it, expect } from 'vitest'
import { studioReply } from './studioReply'

// The app's parseAiJson is more forgiving; plain JSON.parse is enough for these shapes (and a throw is handled).
const parse = (s) => JSON.parse(s)

describe('studioReply (Ebi Studio)', () => {
  it('a reply with no block keeps the previous proposal (spec undefined)', () => {
    const r = studioReply('Is this for an exam?', parse)
    expect(r).toEqual({ display: 'Is this for an exam?', spec: undefined, cutOff: false })
  })

  it('reads a full proposal and strips the block from the text', () => {
    const r = studioReply('Here is the plan.\n<mode>{"name":"Kitchen Safety","type":"general"}</mode>', parse)
    expect(r.spec).toEqual({ name: 'Kitchen Safety', type: 'general' })
    expect(r.display).toBe('Here is the plan.')
    expect(r.cutOff).toBe(false)
  })

  it('a block cut off mid JSON is never shown and drops the older proposal', () => {
    const r = studioReply('A longer one <mode>{"name":"Kitchen Saf', parse)
    expect(r.display).toBe('A longer one')
    expect(r.spec).toBeNull()
    expect(r.cutOff).toBe(true)
  })

  it('an unreadable or nameless closed block counts as cut off for a new mode', () => {
    expect(studioReply('x <mode>{oops</mode>', parse)).toMatchObject({ spec: null, cutOff: true, display: 'x' })
    expect(studioReply('x <mode>{"description":"d"}</mode>', parse)).toMatchObject({ spec: null, cutOff: true })
    expect(studioReply('x <mode>["a"]</mode>', parse)).toMatchObject({ spec: null, cutOff: true })
  })

  it('an edit proposal may leave the name out (the mode keeps its own)', () => {
    const r = studioReply('Updated.\n<mode>{"backTemplate":"{definition}"}</mode>', parse, { edit: true })
    expect(r.spec).toEqual({ backTemplate: '{definition}' })
    expect(studioReply('<mode>{"foo":1}</mode>', parse, { edit: true })).toMatchObject({ spec: null, cutOff: true })
  })

  it('removes dashes line-aware, keeps digit ranges, removes shrimp emoji', () => {
    const r = studioReply('A scenario mode — 2–3 questions per card 🦐\n— a list item\nends with a dash —', parse)
    expect(r.display).toBe('A scenario mode, 2-3 questions per card \na list item\nends with a dash')
    expect(r.display).not.toMatch(/[—–🦐]/u)
  })

  it('handles empty and non-string replies', () => {
    expect(studioReply(undefined, parse)).toEqual({ display: '', spec: undefined, cutOff: false })
    expect(studioReply('<mode>{"name":"X"}</mode>', parse)).toMatchObject({ display: '', spec: { name: 'X' } })
  })
})
