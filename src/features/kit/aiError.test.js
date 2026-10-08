import { describe, it, expect } from 'vitest'
import { aiErrorText, describeAiError, ctxErrorText } from './aiError'

const t = (k, v) => (v ? `${k}:${JSON.stringify(v)}` : k)

describe('aiErrorText', () => {
  it('turns provider errors into the app\'s plain explanations', () => {
    expect(aiErrorText(t, new Error('API 500: [api_error] {"type":"error","error":{"type":"api_error","message":"Internal server error"}}'))).toBe('aiErr_network')
    expect(aiErrorText(t, new Error('API 529: overloaded_error'))).toBe('aiErr_rateLimit')
    expect(aiErrorText(t, new Error('API 429: Too many requests'))).toBe('aiErr_rateLimit')
    expect(aiErrorText(t, new Error('API 429: insufficient_quota, check your billing'))).toBe('aiErr_credits')
    expect(aiErrorText(t, new Error('API 400: Your credit balance is too low'))).toBe('aiErr_credits')
    expect(aiErrorText(t, new Error('API 401: invalid x-api-key'))).toBe('aiErr_badKey')
    expect(aiErrorText(t, new Error('API 403: permission denied'))).toBe('aiErr_badKey')
    expect(aiErrorText(t, new TypeError('Failed to fetch'))).toBe('aiErr_network')
    const timeout = new Error('signal timed out'); timeout.name = 'TimeoutError'
    expect(aiErrorText(t, timeout)).toBe('aiErr_network')
  })
  it('never shows a JSON body', () => {
    const s = aiErrorText(t, new Error('API 400: [invalid_request_error] {"type":"error","error":{"message":"bad"}}'))
    expect(s).toBe('aiErr_generic:{"msg":"API 400: [invalid_request_error]"}')
  })
  it('passes an activity\'s own message through', () => {
    expect(aiErrorText(t, new Error('Ebi could not build a usable workout this time. Try again.'))).toBe('Ebi could not build a usable workout this time. Try again.')
    expect(aiErrorText(t, 'This deck has no cards to talk about yet.')).toBe('This deck has no cards to talk about yet.')
    expect(aiErrorText(t, null)).toBe('')
    // Anki's own messages mention answers and time, never mistaken for a provider failure.
    expect(aiErrorText(t, new Error('Anki did not answer in time. The change may still be applied.'))).toBe('Anki did not answer in time. The change may still be applied.')
  })
})

describe('describeAiError (the app toast) and ctxErrorText', () => {
  it('answers null for anything that is not a provider or network failure', () => {
    expect(describeAiError(t, new Error('Unexpected token < in JSON'))).toBe(null)
    expect(describeAiError(t, 'The request timed out while Anki was busy')).toBe(null)
    expect(describeAiError(t, 'You are out of hearts')).toBe(null)
    expect(describeAiError(t, '')).toBe(null)
  })
  it('reads the status after a caller prefix and plain strings', () => {
    expect(describeAiError(t, 'Could not plan the map: API 429: slow down')).toBe('aiErr_rateLimit')
    expect(describeAiError(t, 'API 503: The model is overloaded')).toBe('aiErr_rateLimit')
    expect(describeAiError(t, 'API 502: bad gateway')).toBe('aiErr_network')
    expect(describeAiError(t, 'TimeoutError: signal timed out')).toBe('aiErr_network')
    expect(describeAiError(t, 'API 200: blocked (content_filter)')).toBe('aiErr_generic:{"msg":"API 200: blocked (content_filter)"}')
  })
  it('a 5xx body naming a quota is credits, a 401 is the key even without key words', () => {
    expect(describeAiError(t, 'API 500: insufficient credit balance')).toBe('aiErr_credits')
    expect(describeAiError(t, 'API 401: {"error":"nope"}')).toBe('aiErr_badKey')
  })
  it('ctxErrorText prefers the context, else the context t', () => {
    expect(ctxErrorText({ ai: { errorText: () => 'from ctx' } }, new Error('API 500: x'))).toBe('from ctx')
    expect(ctxErrorText({ t }, new Error('API 500: x'))).toBe('aiErr_network')
    expect(ctxErrorText(null, new Error('plain'))).toBe('plain')
  })
})
