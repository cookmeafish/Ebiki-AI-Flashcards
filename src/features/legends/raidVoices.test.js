// Every raid boss has its OWN voice (the owner: "make sure that all raid bosses have its own personality and not
// generic", "don't all sound like the same cheesy thing", "no reused words or phrases or templates").
import { describe, it, expect } from 'vitest'
import { RAID_MOTIFS } from './raid'
import { RAID_VOICES, PERSONAS, STOCK_WORDS } from './raidVoices'

// Function words two lines may share.
const STOPWORDS = new Set(['the', 'a', 'an', 'you', 'i', 'it', 'is', 'to', 'of', 'and', 'that', 'this', 'my',
  'your', 'in', 'on', 'at', 'for', 'with', 'me', 'we', 'be', 'was', 'are', 'so'])
// Common words that carry no personality, allowed in more than one sample.
const ALLOWED_COMMON = new Set(['not', 'no', 'one', 'all', 'have', 'has', 'had', 'now', 'just', 'can', 'will',
  'would', 'could', 'here', 'there', 'as', 'but', 'or', 'its', 'our', 'us', 'he', 'she', 'they', 'from', 'by', 'up',
  'out', 'off', 'what', 'who', 'how', 'too', 'very', 'more', 'than', 'then', 'like', 'if', 'do', 'does', 'did', 'got',
  'been', 'am', 'were', 'only', 'some', 'any', 'own', 'yet', 'right', 'one\'s', 'into', 'every', 'never'])

const words = (s) => s.toLowerCase().replace(/’/g, '\'').replace(/[^\p{L}\p{N}' ]+/gu, ' ').trim().split(/\s+/).filter(Boolean)
// Two-word phrases with no stopword in them.
const pairs = (s) => {
  const w = words(s).filter((x) => !STOPWORDS.has(x))
  return w.slice(1).map((x, i) => `${w[i]} ${x}`)
}
const fieldText = (m) => [PERSONAS[m].sample, PERSONAS[m].signature, PERSONAS[m].nickname || '', PERSONAS[m].opener].join(' . ')
const fieldPairs = (m) => [PERSONAS[m].sample, PERSONAS[m].signature, PERSONAS[m].nickname || '', PERSONAS[m].opener].flatMap(pairs)

// owner map: item -> first boss that used it; returns the clashes.
function clashes(itemsOf) {
  const owner = {}
  const out = []
  for (const m of RAID_MOTIFS) {
    for (const it of new Set(itemsOf(m))) {
      if (owner[it] && owner[it] !== m) out.push(`${it} (${owner[it]}, ${m})`)
      else owner[it] = m
    }
  }
  return out
}

describe('raid boss voices are distinct', () => {
  it('every boss has the structured fields', () => {
    for (const m of RAID_MOTIFS) {
      const p = PERSONAS[m]
      for (const k of ['persona', 'sample', 'register', 'opener', 'mistakeNoun', 'signature', 'structure', 'never']) {
        expect(typeof p[k] === 'string' && p[k].length > 0, `${m}: ${k}`).toBe(true)
      }
      expect(p.nickname === null || (typeof p.nickname === 'string' && p.nickname.length > 0), `${m}: nickname`).toBe(true)
    }
  })
  it('no two samples share their first word', () => {
    expect(clashes((m) => [words(PERSONAS[m].sample)[0]])).toEqual([])
  })
  it('no two bosses share a two-word phrase in their sample, signature, nickname or opener', () => {
    expect(clashes(fieldPairs)).toEqual([])
  })
  it('no two samples share a distinctive content word', () => {
    expect(clashes((m) => words(PERSONAS[m].sample).filter((w) => !STOPWORDS.has(w) && !ALLOWED_COMMON.has(w)))).toEqual([])
  })
  it('nickname head words, mistake nouns and signatures are unique', () => {
    expect(clashes((m) => (PERSONAS[m].nickname ? words(PERSONAS[m].nickname).filter((w) => !STOPWORDS.has(w)) : []))).toEqual([])
    expect(clashes((m) => [PERSONAS[m].mistakeNoun.toLowerCase()])).toEqual([])
    expect(clashes((m) => [PERSONAS[m].signature.toLowerCase()])).toEqual([])
    expect(clashes((m) => [PERSONAS[m].structure.toLowerCase()])).toEqual([])
  })
  it('no register is used by more than three bosses', () => {
    const count = {}
    for (const m of RAID_MOTIFS) count[PERSONAS[m].register] = (count[PERSONAS[m].register] || 0) + 1
    for (const [r, n] of Object.entries(count)) expect(n, `register "${r}"`).toBeLessThanOrEqual(3)
  })
  it('no sample or signature uses a stock cartoon-villain phrase', () => {
    for (const m of RAID_MOTIFS) {
      const s = fieldText(m).toLowerCase()
      for (const w of STOCK_WORDS) expect(s.includes(w), `${m} uses "${w}"`).toBe(false)
    }
  })
  it('the voice names the nickname and the mistake noun', () => {
    for (const m of RAID_MOTIFS) {
      const { voice, nickname, mistakeNoun } = RAID_VOICES[m]
      if (nickname) expect(voice.includes(`"${nickname}"`), m).toBe(true)
      expect(voice.includes(`"${mistakeNoun}"`), m).toBe(true)
    }
  })
})
