// withDelay (a staged knockout part): static JSX children come back as an array prop, which React checks as a list.
// Every element in it must carry a key, or the arena logs "Each child in a list should have a unique key" (seen live in
// the Lich's knockout: its gem part has three static paths and is staged with `at`).
import { describe, it, expect } from 'vitest'
import { createElement as h, isValidElement } from 'react'
import { withDelay, PARTS } from './parts.jsx'

const walk = (node, visit) => {
  if (Array.isArray(node)) { visit(node); node.forEach((n) => walk(n, visit)); return }
  if (!isValidElement(node)) return
  walk(node.props.children, visit)
}

describe('withDelay keys', () => {
  it('keys every element of a children array it rebuilds', () => {
    const node = h('div', { style: { animation: 'x 100ms ease 0ms both' } },
      h('svg', null, h('path', { d: 'M0 0', style: { animation: 'a 10ms linear 0ms both' } }), h('path', { d: 'M1 1' })))
    const out = withDelay(node, 150)
    const lists = []
    walk(out, (arr) => lists.push(arr))
    expect(lists.length).toBeGreaterThan(0)
    for (const arr of lists) for (const n of arr) if (isValidElement(n)) expect(n.key).not.toBeNull()
  })
  it('shifts the animation delay and keeps existing keys', () => {
    const node = [h('div', { key: 'a', style: { animation: 'x 100ms ease 20ms both' } }), h('div', { key: 'b' })]
    const out = withDelay(node, 150)
    expect(out.map((n) => n.key)).toEqual(['a', 'b'])
    expect(out[0].props.style.animation).toContain('170ms')
  })
  it('the gem part (several static children) staged with at comes back fully keyed', () => {
    const out = withDelay(PARTS.gem({ at: 150 }, { color: '#5dff9e', accent: '#062a14', glyph: 'skull', scale: 1, speed: 1 }), 150)
    walk(out, (arr) => { for (const n of arr) if (isValidElement(n)) expect(n.key).not.toBeNull() })
  })
})
