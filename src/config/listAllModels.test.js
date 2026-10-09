import { describe, it, expect } from 'vitest'
import { listAllModels, PROVIDERS } from './providers'

const reply = (body, ok = true, status = 200) => async () => ({ ok, status, json: async () => body, text: async () => JSON.stringify(body) })

describe('listAllModels', () => {
  it('keeps OpenAI speech models the chat list drops', async () => {
    const ids = await listAllModels('openai', 'sk-x', reply({ data: [{ id: 'gpt-4o' }, { id: 'gpt-4o-mini-tts' }, { id: 'whisper-1' }, { id: 'gpt-4o-transcribe' }, { id: 'gpt-4o' }, {}] }))
    expect(ids).toEqual(['gpt-4o', 'gpt-4o-mini-tts', 'gpt-4o-transcribe', 'whisper-1'])
  })
  it('throws the usual API error shape on a refused list', async () => {
    await expect(listAllModels('openai', 'sk-x', reply({ error: 'bad key' }, false, 401))).rejects.toThrow(/^API 401/)
  })
  it('other providers give their normal list', async () => {
    const orig = PROVIDERS.gemini.listModels
    PROVIDERS.gemini.listModels = async () => ['gemini-2.5-flash']
    try { expect(await listAllModels('gemini', 'k')).toEqual(['gemini-2.5-flash']) } finally { PROVIDERS.gemini.listModels = orig }
    expect(await listAllModels('nope', 'k')).toEqual([])
  })
})
