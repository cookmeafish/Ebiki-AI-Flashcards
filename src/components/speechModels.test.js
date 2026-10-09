import { describe, it, expect } from 'vitest'
import { speechModels } from './JobModelSettings'

describe('speechModels (Settings > Models per job, speech rows)', () => {
  const chat = ['gpt-4o', 'gpt-4o-mini']
  const all = ['gpt-4o', 'gpt-4o-mini', 'gpt-4o-mini-tts', 'tts-1', 'whisper-1', 'gpt-4o-transcribe']
  it('lists OpenAI speech models from the unfiltered list', () => {
    expect(speechModels({ speech: 'tts' }, 'openai', chat, all)).toEqual(['gpt-4o-mini-tts', 'tts-1'])
    expect(speechModels({ speech: 'stt' }, 'openai', chat, all)).toEqual(['whisper-1', 'gpt-4o-transcribe'])
  })
  it('without the unfiltered list it still works from the chat list (nothing found)', () => {
    expect(speechModels({ speech: 'tts' }, 'openai', chat)).toEqual([])
  })
})
