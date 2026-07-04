// Matcher tests. Every fixture below is a REAL filename captured from live probes of
// en/es/de/ja Wiktionary (2026-07-04) — not invented examples. See CLAUDE.md
// (pronunciation section) for the media-list vs wikitext discrepancy findings.
import { describe, it, expect } from 'vitest'
import { pickAudioFiles, unionCandidates, normalizeFileName, looksLikePronunciationPage, STRONG_SCORE } from './matcher'

const ES = { iso1: 'es', iso3: ['spa'] }
const DE = { iso1: 'de', iso3: ['deu', 'ger'] }
const EN = { iso1: 'en', iso3: ['eng'] }
const JA = { iso1: 'ja', iso3: ['jpn'] }

describe('normalizeFileName', () => {
  it('strips namespace prefixes from any edition and underscores', () => {
    expect(normalizeFileName('File:en-us-schedule.ogg')).toBe('en-us-schedule.ogg')
    expect(normalizeFileName('Medium:De-Haus.ogg')).toBe('De-Haus.ogg') // German edition prefix
    expect(normalizeFileName('File:LL-Q7026_(cat)-Unjoanqualsevol-hola.wav')).toBe('LL-Q7026 (cat)-Unjoanqualsevol-hola.wav')
  })
})

describe('pickAudioFiles — exact region hit (en.wiktionary/schedule fixtures)', () => {
  const files = ['en-uk-schedule.ogg', 'en-us-schedule.ogg', 'en-au-schedule.ogg']
  it('picks the requested region first', () => {
    expect(pickAudioFiles(files, { ...EN, region: 'us', word: 'schedule' })[0].file).toBe('en-us-schedule.ogg')
    expect(pickAudioFiles(files, { ...EN, region: 'uk', word: 'schedule' })[0].file).toBe('en-uk-schedule.ogg')
  })
  it('still returns audio when no region is requested', () => {
    const ranked = pickAudioFiles(files, { ...EN, region: '', word: 'schedule' })
    expect(ranked.length).toBe(3)
  })
})

describe('pickAudioFiles — region-absent degradation (de.wiktionary fixtures)', () => {
  it('bare-language file wins over another region when the requested region is missing', () => {
    // de.wiktionary/schön: no de-de file exists; De-schön.ogg must beat De-at-schön.ogg
    const files = ['De-schön.ogg', 'De-schön fcm.ogg', 'De-schön2.ogg', 'De-at-schön.ogg']
    const ranked = pickAudioFiles(files, { ...DE, region: 'de', word: 'schön' })
    expect(ranked[0].file).toBe('De-schön.ogg')
    expect(ranked.length).toBe(4) // never fail solely because the region tag is absent
  })
  it('prefers the exact word over phrase recordings', () => {
    const files = ['De-Haus.ogg', 'De-Haus2.ogg', 'De-ein benachbartes Haus.ogg', 'De-ein unerschwingliches Haus.ogg']
    expect(pickAudioFiles(files, { ...DE, region: '', word: 'Haus' })[0].file).toBe('De-Haus.ogg')
  })
  it('is accent-insensitive on the word', () => {
    const ranked = pickAudioFiles(['De-schön.ogg'], { ...DE, region: '', word: 'schon' })
    expect(ranked[0]?.file).toBe('De-schön.ogg')
  })
})

describe('pickAudioFiles — wrong-language rejection (en.wiktionary/hola fixtures)', () => {
  // The en.wiktionary "hola" page carries FIVE languages' audio — only Es-hola.oga is Spanish.
  const files = [
    'LL-Q7026 (cat)-Unjoanqualsevol-hola.wav', // Catalan
    'Nl-hola.ogg',                             // Dutch
    'LL-Q809 (pol)-Olaf-hola.wav',             // Polish
    'Hola.ogg',                                // no language info
    'Es-hola.oga',                             // Spanish ← the right one
  ]
  it('picks the Spanish file and rejects other languages', () => {
    const ranked = pickAudioFiles(files, { ...ES, region: '', word: 'hola' })
    expect(ranked[0].file).toBe('Es-hola.oga')
    const names = ranked.map((r) => r.file)
    expect(names).not.toContain('Nl-hola.ogg')
    expect(names).not.toContain('LL-Q7026 (cat)-Unjoanqualsevol-hola.wav')
    expect(names).not.toContain('LL-Q809 (pol)-Olaf-hola.wav')
  })
  it('keeps the bare-word file only as a last resort', () => {
    const ranked = pickAudioFiles(files, { ...ES, region: '', word: 'hola' })
    expect(ranked[ranked.length - 1].file).toBe('Hola.ogg')
  })
})

describe('pickAudioFiles — Lingua Libre (es.wiktionary/perro + en.wiktionary/犬 fixtures)', () => {
  it('recognizes LL files with an ISO-639-3 parenthetical', () => {
    const ranked = pickAudioFiles(['LL-Q1321 (spa)-Rodelar-perro.wav'], { ...ES, region: '', word: 'perro' })
    expect(ranked[0]?.file).toBe('LL-Q1321 (spa)-Rodelar-perro.wav')
  })
  it('keeps LL files with only a Q-id (no language parens) at low rank instead of rejecting', () => {
    const files = ['LL-Q9186-Luilui6666-犬.wav', 'Ja-inu-anglonative.oga']
    const ranked = pickAudioFiles(files, { ...JA, region: '', word: '犬' })
    expect(ranked.some((r) => r.file === 'LL-Q9186-Luilui6666-犬.wav')).toBe(true)
  })
  it('classic bare-language file outranks Lingua Libre (plan ordering)', () => {
    const files = ['LL-Q1321 (spa)-Rodelar-perro.wav', 'Es-perro.ogg']
    expect(pickAudioFiles(files, { ...ES, region: '', word: 'perro' })[0].file).toBe('Es-perro.ogg')
  })
})

describe('pickAudioFiles — Commons direct-search fixtures (source B, live 2026-07-04)', () => {
  // es.wiktionary "paraguas" links NO audio; these came from Commons file search instead.
  const files = [
    '(spa)-Saviourofthe-paraguas.flac',
    'LL-Q1321 (spa)-Eavqwiki-paraguas.wav',
    'Fundación Joaquín Díaz - ATO 00631 03 - Chiste (Uno inventa un avión con un paraguas).ogg', // folk tale CONTAINING the word
  ]
  it('accepts both LL and bare "(spa)-speaker-word" recordings', () => {
    const ranked = pickAudioFiles(files, { ...ES, region: '', word: 'paraguas' })
    const names = ranked.map((r) => r.file)
    expect(names).toContain('LL-Q1321 (spa)-Eavqwiki-paraguas.wav')
    expect(names).toContain('(spa)-Saviourofthe-paraguas.flac')
  })
  it('rejects unrelated recordings that merely contain the word', () => {
    const ranked = pickAudioFiles(files, { ...ES, region: '', word: 'paraguas' })
    expect(ranked.map((r) => r.file)).not.toContain('Fundación Joaquín Díaz - ATO 00631 03 - Chiste (Uno inventa un avión con un paraguas).ogg')
  })
})

describe('pickAudioFiles — animal-noise / junk-audio rejection', () => {
  it('rejects recordings of the ANIMAL rather than the word (dog barking)', () => {
    const files = ['Perro ladrando.ogg', 'Ladrido de perro.wav', 'Es-perro.ogg', 'LL-Q1321 (spa)-Rodelar-perro.wav']
    const names = pickAudioFiles(files, { ...ES, region: '', word: 'perro' }).map((r) => r.file)
    expect(names).not.toContain('Perro ladrando.ogg')
    expect(names).not.toContain('Ladrido de perro.wav')
    expect(names[0]).toBe('Es-perro.ogg')
  })
  it('bare word-only files score below STRONG_SCORE (must pass the category gate)', () => {
    const ranked = pickAudioFiles(['Perro.ogg'], { ...ES, region: '', word: 'perro' })
    expect(ranked.length).toBe(1)
    expect(ranked[0].score).toBeLessThan(STRONG_SCORE)
  })
  it('language-convention files score at or above STRONG_SCORE (no category gate needed)', () => {
    const ranked = pickAudioFiles(['Es-perro.ogg', 'LL-Q1321 (spa)-Rodelar-perro.wav'], { ...ES, region: '', word: 'perro' })
    for (const r of ranked) expect(r.score).toBeGreaterThanOrEqual(STRONG_SCORE)
  })
})

describe('looksLikePronunciationPage — Commons category gate for weak candidates', () => {
  it('accepts pronunciation/Lingua Libre categories', () => {
    expect(looksLikePronunciationPage(['Category:Spanish pronunciation'])).toBe(true)
    expect(looksLikePronunciationPage(['Category:Lingua Libre pronunciation-spa'])).toBe(true)
  })
  it('rejects animal-sound and unrelated categories', () => {
    expect(looksLikePronunciationPage(['Category:Audio files of dogs', 'Category:Dog barks'])).toBe(false)
    expect(looksLikePronunciationPage([])).toBe(false)
  })
})

describe('pickAudioFiles — hyphenated-word parse ambiguity', () => {
  it('does not mistake word syllables for a region code', () => {
    // 'va' would parse as a region; the bare-language reading must still match the word.
    const ranked = pickAudioFiles(['Fr-va-t-en.ogg'], { iso1: 'fr', iso3: ['fra', 'fre'], region: '', word: 'va-t-en' })
    expect(ranked[0]?.file).toBe('Fr-va-t-en.ogg')
  })
})

describe('pickAudioFiles — no-audio and junk cases', () => {
  it('returns empty for unrelated files', () => {
    expect(pickAudioFiles(['Es-gato.ogg', 'diagram.png', 'Es-hola-audio.txt'], { ...ES, region: '', word: 'perro' })).toEqual([])
  })
  it('returns empty for an empty candidate list', () => {
    expect(pickAudioFiles([], { ...ES, region: '', word: 'hola' })).toEqual([])
  })
})

describe('unionCandidates — media-list ∪ wikitext (live discrepancy both directions)', () => {
  it('unions es fixtures where media-list returned NOTHING', () => {
    // es.wiktionary media-list: [] ; wikitext: found the audio (confirmed live)
    expect(unionCandidates([], ['Es-hola.oga'])).toEqual(['Es-hola.oga'])
  })
  it('unions en/犬 fixtures where wikitext regex missed a file media-list had', () => {
    const u = unionCandidates(['File:LL-Q9186-Luilui6666-犬.wav', 'File:Ja-inu-anglonative.oga'], ['Ja-inu-anglonative.oga'])
    expect(u).toEqual(['LL-Q9186-Luilui6666-犬.wav', 'Ja-inu-anglonative.oga'])
  })
  it('dedupes case/underscore/namespace variants', () => {
    // media-list returns "File:LL-Q7026_(cat)-…" (underscores), wikitext has spaces — same file.
    const u = unionCandidates(
      ['Medium:De-Haus.ogg', 'File:LL-Q7026_(cat)-Unjoanqualsevol-hola.wav'],
      ['De-Haus.ogg', 'LL-Q7026 (cat)-Unjoanqualsevol-hola.wav'])
    expect(u).toEqual(['De-Haus.ogg', 'LL-Q7026 (cat)-Unjoanqualsevol-hola.wav'])
  })
})
