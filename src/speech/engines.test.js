import { describe, it, expect } from 'vitest'
import { pickStt, pickTts, pcmToWav, COSTS } from './engines'

describe('picking the cheapest engine', () => {
  it('speech to text: free browser recognizer first, then the cheapest paid key', () => {
    expect(pickStt({ openai: 'k', gemini: 'k', grok: 'k' }, { browser: true })).toBe('browser')
    expect(pickStt({ openai: 'k', gemini: 'k', grok: 'k' })).toBe('gemini')
    expect(pickStt({ openai: 'k', grok: 'k' })).toBe('grok')
    expect(pickStt({ openai: 'k', anthropic: 'k' })).toBe('openai')
    expect(pickStt({ anthropic: 'k' })).toBe(null)
  })
  it('speech to text: a preferred engine wins only when usable', () => {
    expect(pickStt({ openai: 'k', gemini: 'k' }, { pref: 'openai' })).toBe('openai')
    expect(pickStt({ gemini: 'k' }, { pref: 'openai' })).toBe('gemini')
  })
  it('text to speech: auto = the cheapest AI voice with a key, else the free device voice', () => {
    expect(pickTts({ openai: 'k', grok: 'k' })).toBe(COSTS.tts.grok <= COSTS.tts.openai ? 'grok' : 'openai')
    expect(pickTts({ openai: 'k' })).toBe('openai')
    expect(pickTts({ anthropic: 'k' })).toBe('device')
    expect(pickTts({ openai: 'k' }, { pref: 'device' })).toBe('device')
    expect(pickTts({ anthropic: 'k' }, { pref: 'openai' })).toBe('device')
  })
})

describe('pcmToWav', () => {
  it('wraps raw PCM in a 44-byte WAV header', async () => {
    const wav = pcmToWav(new Uint8Array(100), 24000)
    expect(wav.size).toBe(144)
    const head = new Uint8Array(await wav.arrayBuffer()).slice(0, 4)
    expect(String.fromCharCode(...head)).toBe('RIFF')
  })
})
