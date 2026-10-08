import { describe, it, expect } from 'vitest'
import { splitCardLabel } from './cardLabel'

describe('splitCardLabel', () => {
  it('finds ordinary labels in any script', () => {
    expect(splitCardLabel('Traducción: dog')).toEqual({ label: 'Traducción', sep: ':', rest: ' dog' })
    expect(splitCardLabel('发音：fā yīn')).toEqual({ label: '发音', sep: '：', rest: 'fā yīn' })
    expect(splitCardLabel('المعنى: libro')?.label).toBe('المعنى')
    expect(splitCardLabel('1: step one')?.label).toBe('1')
    expect(splitCardLabel('Método HTTP: GET')?.label).toBe('Método HTTP')
  })
  it('never bolds what is not a label', () => {
    for (const line of ['[sound:ebiki-perro.mp3]', 'https://example.com', 'see https://x.y/z: ok', '{{c1::perro}}: dog',
      'La {{c1::a:b}}', '\\(x:y\\)', '\\[a:b\\]', '10:30 de la mañana', '\u{1F50A} User:Foo · CC BY-SA 4.0', 'no label here', '']) {
      expect(splitCardLabel(line)).toBeNull()
    }
  })
  it('a label longer than 30 characters is prose', () => {
    expect(splitCardLabel('This sentence is far too long to be a label: really')).toBeNull()
  })
})
