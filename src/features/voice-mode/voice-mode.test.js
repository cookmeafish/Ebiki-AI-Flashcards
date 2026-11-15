// Chat's voice mode: what Ebi says out loud (speakable.js) and hands-free turn taking (turnDetector.js).
import { describe, it, expect } from 'vitest'
import { speakableText, speechChunks, chunkLang, speechCostPerHour } from './speakable'
import { createTurnDetector, TURN } from './turnDetector'

describe('speakableText', () => {
  it('never reads markdown symbols, links, tags or emoji aloud', () => {
    const s = speakableText('## Hola\n**Buenos días** means *good morning* 🌞. See [the guide](https://x.y/z) or https://a.b/c\n- one\n- two')
    expect(s).toBe('Hola. Buenos días means good morning. See the guide. one. two.')
    expect(s).not.toMatch(/[*#_[\]]|https?:/)
  })
  it('drops card widgets, sources and other app tags, and names the cards instead', () => {
    const s = speakableText('Here you go!\n<anki-card>{"front":"perro","back":"dog"}</anki-card>\n<sources>[1] x</sources>',
      { cards: [{ front: 'perro' }, { front: 'gato' }], cardsPhrase: (f) => `I made cards for ${f.join(' and ')}.` })
    expect(s).toBe('Here you go! I made cards for perro and gato.')
  })
  it('says a short phrase for a code block, and turns dashes into pauses', () => {
    expect(speakableText('Try this:\n```js\nconst a = 1\n```\nIt works — mostly.', { codePhrase: 'the code is on screen' })).toBe('Try this: the code is on screen. It works, mostly.')
  })
  it('reads a table row by row, never its pipes', () => {
    expect(speakableText('| Word | Meaning |\n|---|---|\n| perro | dog |\n| gato | cat |')).toBe('Word, Meaning. perro, dog. gato, cat.')
  })
  it('keeps underscores and asterisks inside words and numbers', () => {
    expect(speakableText('Set first_name and compute 2*3*4.')).toBe('Set first_name and compute 2*3*4.')
  })
  it('keeps the words of any language', () => {
    expect(speakableText('「おはよう」は good morning です。')).toBe('「おはよう」は good morning です。')
  })
})

describe('speechChunks', () => {
  it('splits into sentences and joins very short ones', () => {
    expect(speechChunks('Hi! This is a sentence that is long enough. And another one here, also long.')).toEqual(['Hi! This is a sentence that is long enough.', 'And another one here, also long.'])
  })
  it('never splits a version, an address, a standard or an abbreviation inside a word', () => {
    const s = 'Use TLS 1.2 or 1.3 on 192.168.1.1 with 802.11ac, e.g. at home. The value is 3.5 percent.'
    const parts = speechChunks(s)
    expect(parts.join(' ')).toBe(s)
    for (const keep of ['TLS 1.2', '192.168.1.1', '802.11ac', '3.5 percent', 'e.g. at']) expect(parts.some((p) => p.includes(keep)), keep).toBe(true)
  })
  it('cuts a sentence over the limit at a comma or space, never mid-word', () => {
    const long = `${'word '.repeat(80)}end.`
    const parts = speechChunks(long, { max: 100 })
    expect(parts.every((p) => p.length <= 100)).toBe(true)
    expect(parts.join(' ').replace(/\s+/g, ' ')).toBe(long.replace(/\s+/g, ' ').trim())
  })
  it('handles CJK stops without adding spaces', () => {
    const parts = speechChunks('今日はいい天気ですね。散歩に行きましょうか？はい、行きましょう。', { min: 5 })
    expect(parts).toHaveLength(3)
    expect(parts.join('')).toBe('今日はいい天気ですね。散歩に行きましょうか？はい、行きましょう。')
  })
  it('nothing to say = nothing', () => { expect(speechChunks('')).toEqual([]) })
})

describe('chunkLang (the device voice\'s language per sentence)', () => {
  it('by script first, then the learned language\'s own letters, else the user\'s language', () => {
    expect(chunkLang('おはようございます', { learnIso: 'es', userIso: 'en' })).toBe('ja')
    expect(chunkLang('你好', { learnIso: 'ja', userIso: 'en' })).toBe('ja')
    expect(chunkLang('你好', { learnIso: 'es', userIso: 'en' })).toBe('zh')
    expect(chunkLang('¿Cómo estás?', { learnIso: 'es', userIso: 'en' })).toBe('es')
    expect(chunkLang('That means how are you.', { learnIso: 'es', userIso: 'en' })).toBe('en')
    expect(chunkLang('Привет', { userIso: 'en' })).toBe('ru')
  })
})

describe('speech cost per hour', () => {
  it('each side talks half the hour; free engines cost nothing', () => {
    const COSTS = { stt: { browser: 0, openai: 0.003 }, tts: { device: 0, openai: 0.015 } }
    expect(speechCostPerHour(COSTS, 'openai', 'openai')).toBeCloseTo(0.54, 5)
    expect(speechCostPerHour(COSTS, 'browser', 'device')).toBe(0)
    expect(speechCostPerHour(COSTS, null, 'unknown')).toBe(0)
  })
})

describe('turn detector', () => {
  const run = (det, pattern) => { const out = []; let t = 0; for (const [level, ms] of pattern) { for (let x = 0; x < ms; x += 50) { const r = det.feed(level, t); if (r) out.push([r, t]); t += 50 } } return out }
  it('starts after real speech and ends after a pause', () => {
    const ev = run(createTurnDetector(), [[0.004, 1000], [0.08, 1500], [0.004, 2000]])
    expect(ev[0][0]).toBe('start')
    expect(ev[1][0]).toBe('end')
    expect(ev[1][1] - 2500).toBeGreaterThanOrEqual(TURN.silenceMs - 50) // the pause, not sooner
  })
  it('hears a learner who is ALREADY talking when the mic opens (right after Interrupt)', () => {
    const ev = run(createTurnDetector(), [[0.08, 3000], [0.004, 2000]])
    expect(ev[0]).toEqual(['start', TURN.minSpeechMs])
    expect(ev.some((e) => e[0] === 'end')).toBe(true)
  })
  it('a short click or cough never starts a turn', () => {
    const ev = run(createTurnDetector(), [[0.004, 1000], [0.2, 150], [0.004, 3000]])
    expect(ev.filter((e) => e[0] === 'start')).toHaveLength(0)
  })
  it('a natural pause mid-sentence does not end the turn', () => {
    const ev = run(createTurnDetector(), [[0.004, 800], [0.08, 800], [0.004, 700], [0.08, 800], [0.004, 1500]])
    expect(ev.filter((e) => e[0] === 'start')).toHaveLength(1)
    const end = ev.find((e) => e[0] === 'end')
    expect(end[1]).toBeGreaterThan(3100) // after the second stretch
  })
  it('follows a noisy room: steady fan noise is the floor, speech above it still counts', () => {
    const ev = run(createTurnDetector(), [[0.03, 4000], [0.15, 800], [0.03, 1500]])
    expect(ev.find((e) => e[0] === 'start')).toBeTruthy()
    expect(ev.some((e) => e[0] === 'end')).toBe(true)
    // The fan alone: maybe one false start while the floor learns, then it is quiet for good (and ends that turn).
    const fan = run(createTurnDetector(), [[0.03, 6000]])
    expect(fan.filter((e) => e[0] === 'start').length).toBeLessThanOrEqual(1)
  })
  it('gives up after a long silence (timeout); the talk cap counts from when talking began', () => {
    expect(run(createTurnDetector(), [[0.004, TURN.noSpeechMs + 100]]).some((e) => e[0] === 'timeout')).toBe(true)
    const capped = run(createTurnDetector({ maxSpeechMs: 3000, noSpeechMs: 60000 }), [[0.004, 8000], [0.1, 4000]])
    const end = capped.find((e) => e[0] === 'end')
    expect(end[1]).toBeGreaterThanOrEqual(8000 + 3000) // 8 s of waiting did not eat into the 3 s of talking
  })
  it('acts the same whether levels come every 20 ms or every 100 ms (time, never frames)', () => {
    const at = (step) => { const d = createTurnDetector(); let t = 0; let end = null; while (t < 6000 && end == null) { const lvl = t < 1000 ? 0.004 : t < 2500 ? 0.08 : 0.004; if (d.feed(lvl, t) === 'end') end = t; t += step } return end }
    expect(Math.abs(at(20) - at(100))).toBeLessThanOrEqual(100)
  })
})
