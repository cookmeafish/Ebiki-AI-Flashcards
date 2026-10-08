import { describe, it, expect } from 'vitest'
import { editorTagTarget } from './deckTags'

describe('editorTagTarget', () => {
  it('keeps a tag added elsewhere since the editor opened', () => {
    expect(editorTagTarget(['noun'], ['noun', 'food'], ['noun', 'leech'])).toEqual(['noun', 'leech', 'food'])
  })
  it('removes only what the user removed', () => {
    expect(editorTagTarget(['noun', 'food'], ['noun'], ['noun', 'food', 'leech'])).toEqual(['noun', 'leech'])
  })
  it('a case-only rename replaces the old spelling', () => {
    expect(editorTagTarget(['Verb'], ['verb'], ['Verb', 'leech'])).toEqual(['leech', 'verb'])
  })
  it('a removal matches the current tag case-insensitively', () => {
    expect(editorTagTarget(['food'], [], ['Food', 'noun'])).toEqual(['noun'])
  })
  it('no change in the editor leaves the current tags as they are', () => {
    expect(editorTagTarget(['a'], ['a'], ['a', 'b'])).toEqual(['a', 'b'])
  })
  it('odd input is safe', () => {
    expect(editorTagTarget(null, ['x'], undefined)).toEqual(['x'])
  })
})
