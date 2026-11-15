import { describe, it, expect } from 'vitest'
import { voiceCommand, isEmptyTurn, nextSpeed } from './voiceCommands'

describe('spoken commands are handled on the device', () => {
  it('a whole turn that is a command, in several languages', () => {
    expect(voiceCommand('Repeat that, please.')).toBe('repeat')
    expect(voiceCommand('¿Puedes repetir?')).toBe('repeat')
    expect(voiceCommand('Otra vez, por favor')).toBe('repeat')
    expect(voiceCommand('Más despacio, por favor.')).toBe('slower')
    expect(voiceCommand('Plus lentement')).toBe('slower')
    expect(voiceCommand('slow down a bit')).toBe('slower')
    expect(voiceCommand('faster')).toBe('faster')
    expect(voiceCommand('Wait.')).toBe('pause')
    expect(voiceCommand('End session')).toBe('end')
    expect(voiceCommand('Terminar la sesión')).toBe('end')
    expect(voiceCommand('Recap please')).toBe('recap')
    expect(voiceCommand('もう一度ください')).toBe('repeat')
    expect(voiceCommand('请慢一点')).toBe('slower')
  })
  it('a sentence that only contains the word is a normal turn', () => {
    expect(voiceCommand('Repite conmigo la palabra mesa')).toBe('')
    expect(voiceCommand('I want to stop smoking')).toBe('')
    expect(voiceCommand('Fine, thanks')).toBe('')
    expect(voiceCommand('Para mí, un café')).toBe('')
    expect(voiceCommand('What is a firewall?')).toBe('')
    expect(voiceCommand('')).toBe('')
  })
})

describe('empty turns never reach the AI', () => {
  it('silence, noise, filler and the recognizer silence phrases', () => {
    for (const s of ['', '   ', '[MUSIC]', '(silence)', '♪♪', 'Uh...', 'Hmm.', 'Thank you for watching!', 'Subtítulos realizados por la comunidad de Amara.org', 'x', '...'])
      expect(isEmptyTurn(s), s).toBe(true)
  })
  it('a real short answer is a turn', () => {
    for (const s of ['Sí.', 'No', 'OK', 'Vale', 'Hola', '是', 'TPM']) expect(isEmptyTurn(s), s).toBe(false)
  })
})

describe('speech speed steps', () => {
  it('moves one step and stops at the ends', () => {
    expect(nextSpeed(1, 'slower')).toBe(0.75)
    expect(nextSpeed(0.75, 'slower')).toBe(0.75)
    expect(nextSpeed(1, 'faster')).toBe(1.25)
    expect(nextSpeed(1.25, 'faster')).toBe(1.25)
  })
})
