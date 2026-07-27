import { describe, it, expect } from 'vitest'
import { parseModelId, compareModels, pickUpgrade, pickNewest } from './modelVersions'

// A realistic Anthropic /v1/models payload: current models, an older generation, a sibling
// family, and a preview build that must never be auto-adopted.
const ANTHROPIC = [
  'claude-opus-5', 'claude-opus-5-preview', 'claude-fable-5',
  'claude-opus-4-8', 'claude-opus-4-7', 'claude-opus-4-6',
  'claude-sonnet-5', 'claude-sonnet-4-6', 'claude-haiku-4-5',
]

describe('parseModelId', () => {
  it('splits family from version regardless of where the version sits', () => {
    // Version-after-name and version-before-name must land in the SAME family, or a legacy id
    // would look like a different product line and never upgrade.
    expect(parseModelId('claude-sonnet-4-6')).toMatchObject({ family: 'claude-sonnet', version: [4, 6] })
    expect(parseModelId('claude-3-5-sonnet-20241022')).toMatchObject({ family: 'claude-sonnet', version: [3, 5] })
  })

  it('treats an 8-digit snapshot as a date, not a version component', () => {
    expect(parseModelId('claude-haiku-4-5-20251001')).toMatchObject({
      family: 'claude-haiku', version: [4, 5], date: 20251001,
    })
  })

  it('handles digit-letter and letter-digit segments', () => {
    expect(parseModelId('gpt-4o-mini')).toMatchObject({ family: 'gpt-o-mini', version: [4] })
    expect(parseModelId('o3-mini')).toMatchObject({ family: 'o-mini', version: [3] })
  })

  it('strips the Gemini "models/" list prefix', () => {
    expect(parseModelId('models/gemini-2.5-pro')).toMatchObject({ family: 'gemini-pro', version: [2, 5] })
  })

  it('returns null for junk rather than throwing', () => {
    for (const bad of [null, undefined, '', '   ', 42, {}]) expect(parseModelId(bad)).toBeNull()
  })
})

describe('compareModels', () => {
  it('orders a shorter higher version above a longer lower one', () => {
    // The exact bug: 5 must beat 4.8. A naive string or segment-count compare gets this wrong.
    expect(compareModels('claude-opus-5', 'claude-opus-4-8')).toBe(1)
    expect(compareModels('claude-opus-4-8', 'claude-opus-5')).toBe(-1)
    expect(compareModels('claude-sonnet-5', 'claude-sonnet-4-6')).toBe(1)
  })

  it('treats a dateless alias and its dated snapshot as equal', () => {
    // Otherwise the daily check would nag users to move from a stable alias onto a pinned build.
    expect(compareModels('claude-haiku-4-5', 'claude-haiku-4-5-20251001')).toBe(0)
  })

  it('uses the date only when both ids carry one', () => {
    expect(compareModels('claude-haiku-4-5-20251001', 'claude-haiku-4-5-20240101')).toBe(1)
  })

  it('is 0 for identical ids and for unparseable input', () => {
    expect(compareModels('claude-opus-4-8', 'claude-opus-4-8')).toBe(0)
    expect(compareModels('claude-opus-5', null)).toBe(0)
  })
})

describe('pickUpgrade', () => {
  it('finds the newer model in the same family', () => {
    expect(pickUpgrade('claude-opus-4-8', ANTHROPIC)).toBe('claude-opus-5')
    expect(pickUpgrade('claude-sonnet-4-6', ANTHROPIC)).toBe('claude-sonnet-5')
  })

  it('returns null when already current', () => {
    expect(pickUpgrade('claude-opus-5', ANTHROPIC)).toBeNull()
    expect(pickUpgrade('claude-haiku-4-5', ANTHROPIC)).toBeNull()
  })

  it('never crosses families', () => {
    // claude-fable-5 is newer and more capable, but swapping the Max tier onto a different
    // product line is not something to do behind the user's back.
    expect(pickUpgrade('claude-opus-4-8', ANTHROPIC)).not.toBe('claude-fable-5')
    // And a cheap model shipping last must not hijack a strong tier.
    expect(pickUpgrade('claude-opus-4-8', ['claude-haiku-9'])).toBeNull()
  })

  it('never proposes a preview build', () => {
    expect(pickUpgrade('claude-opus-5', ANTHROPIC)).toBeNull()
    expect(pickUpgrade('claude-opus-4-8', ['claude-opus-5-preview', 'claude-opus-6-experimental'])).toBeNull()
  })

  it('remembers a rejection but still surfaces something newer than it', () => {
    // Said no to opus-5 while on 4.8: stay quiet.
    expect(pickUpgrade('claude-opus-4-8', ANTHROPIC, 'claude-opus-5')).toBeNull()
    // Said no to 4.8 while on 4.7: opus-5 is newer than the rejection, so it may still ask.
    expect(pickUpgrade('claude-opus-4-7', ANTHROPIC, 'claude-opus-4-8')).toBe('claude-opus-5')
  })

  it('picks the highest available, not merely the first newer one', () => {
    expect(pickUpgrade('claude-opus-4-6', ['claude-opus-4-7', 'claude-opus-5', 'claude-opus-4-8'])).toBe('claude-opus-5')
  })

  it('survives a missing or malformed model list', () => {
    for (const bad of [null, undefined, [], [null, 42, '']]) expect(pickUpgrade('claude-opus-4-8', bad)).toBeNull()
  })

  it('works for the other providers', () => {
    expect(pickUpgrade('gpt-4o-mini', ['gpt-4o-mini', 'gpt-5o-mini'])).toBe('gpt-5o-mini')
    expect(pickUpgrade('gemini-2.0-flash', ['gemini-2.5-flash', 'gemini-2.5-pro'])).toBe('gemini-2.5-flash')
    expect(pickUpgrade('grok-3', ['grok-4', 'grok-3'])).toBe('grok-4')
    // Embeddings/audio models in an OpenAI list are a different family and must be ignored.
    expect(pickUpgrade('gpt-4o', ['text-embedding-3-large', 'whisper-1', 'tts-1'])).toBeNull()
  })
})

describe('pickNewest', () => {
  it('ignores rejections, since onboarding has no history to respect', () => {
    expect(pickNewest('claude-opus-4-8', ANTHROPIC)).toBe('claude-opus-5')
  })
})
