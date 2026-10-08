import { describe, it, expect, afterEach } from 'vitest'
import { platform } from '../platform'
import { speak } from './index'

const orig = { speak: platform.speech.speak, stop: platform.speech.stop }
afterEach(() => { platform.speech.speak = orig.speak; platform.speech.stop = orig.stop })

describe('speak (device voice)', () => {
  it('stopping one line stops only that line, never every feature\'s speech', async () => {
    const said = []
    const stops = []
    platform.speech.speak = (text, lang, opts) => {
      const token = { text }
      said.push(token)
      opts?.onHandle?.(token)
      return new Promise(() => {})
    }
    platform.speech.stop = (token) => stops.push(token)
    const a = speak({}, 'first line')
    const b = speak({}, 'second line')
    await Promise.resolve()
    a.stop()
    expect(stops).toEqual([said[0]])
    b.stop()
    expect(stops).toEqual([said[0], said[1]])
  })

  it('a stopped line resolves its done promise at once', async () => {
    platform.speech.speak = () => new Promise(() => {})
    platform.speech.stop = () => {}
    const a = speak({}, 'hello')
    await Promise.resolve()
    a.stop()
    await expect(Promise.race([a.done.then(() => 'done'), new Promise((r) => setTimeout(() => r('hung'), 50))])).resolves.toBe('done')
  })
})
