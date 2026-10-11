// Raid boss taunts against the repeat check (kit/taunt.js): every RAID_VOICES persona mandates an opener, a signature
// and (most) a nickname, which every line uses and the sample line uses too. Those words are not a repeat: a taunt
// built in the persona's own structure must pass, against the sample AND against the boss's previous line in the same
// structure, while the line's OTHER wording is still checked.
import { describe, it, expect } from 'vitest'
import { RAID_VOICES } from './raidVoices'
import { RAID_ORDER } from './raid'
import { tauntRepeats, tauntTranslated, mandatedPhrases, sharesPhrase } from '../kit/taunt'

// A line in the persona's structure: its opener, fresh words of its own, its signature, its nickname.
const built = (v, middle) => `${v.opener} ${middle}, so ${v.signature}${v.nickname ? `, ${v.nickname}` : ''}.`
const FIRST = 'the kettle boiled dry beside the open window'
const SECOND = 'a parade marched backwards through the muddy orchard'

describe('raid taunts in each persona structure', () => {
  const motifs = Object.keys(RAID_VOICES)
  it('covers every raid boss', () => {
    for (const m of RAID_ORDER) expect(RAID_VOICES[m], m).toBeTruthy()
  })
  it('before the fix, the mandated words alone made almost every persona repeat itself (the bug)', () => {
    const vsSample = motifs.filter((m) => tauntRepeats(built(RAID_VOICES[m], FIRST), [], RAID_VOICES[m].sample))
    const vsRecent = motifs.filter((m) => tauntRepeats(built(RAID_VOICES[m], SECOND), [built(RAID_VOICES[m], FIRST)], ''))
    expect(vsSample.length).toBeGreaterThanOrEqual(20)
    expect(vsRecent.length).toBe(motifs.length)
  })
  it.each(Object.keys(RAID_VOICES))('%s: a taunt in its structure passes against its sample and its last line', (m) => {
    const v = RAID_VOICES[m]
    expect(mandatedPhrases(v).length).toBeGreaterThanOrEqual(2)
    const first = built(v, FIRST)
    const second = built(v, SECOND)
    expect(tauntRepeats(first, [], v.sample, v)).toBe(false)
    expect(tauntRepeats(second, [first], v.sample, v)).toBe(false)
    // The opener in a close variation (another case, no punctuation) is still the opener.
    expect(tauntRepeats(second.toUpperCase().replace(/[.,:!]/g, ''), [first], v.sample, v)).toBe(false)
  })
  it.each(Object.keys(RAID_VOICES))('%s: a short line of mandated words said again is a repeat', (m) => {
    const v = RAID_VOICES[m]
    const short = `${v.opener} Sloppy work${v.nickname ? `, ${v.nickname}` : ''}, ${v.signature}.`
    expect(tauntRepeats(short, [short], '', v)).toBe(true)
    expect(tauntRepeats(short, [`${v.opener} Lazy work, ${v.signature}.`], '', v)).toBe(false)
  })
  it.each(Object.keys(RAID_VOICES))('%s: the line\'s own words still may not repeat a recent line', (m) => {
    const v = RAID_VOICES[m]
    const first = built(v, FIRST)
    // Reuses "boiled dry beside" from the last line: still a repeat.
    expect(tauntRepeats(built(v, 'your soup boiled dry beside the stove'), [first], '', v)).toBe(true)
  })
})

describe('the mandated words, any language', () => {
  const v = { opener: 'Brute here.', signature: 'claiming credit', nickname: 'sailor' }
  it('a translated opener in the opener slot is not a repeat (spaced and unspaced scripts)', () => {
    expect(tauntRepeats('Aquí Brute. Tu ancla se hundió en la arena, marinero.', ['Aquí Brute. El timón giró solo hacia la roca.'], '', v)).toBe(false)
    expect(tauntRepeats('布鲁特在此。你的锚沉进了沙子里。', ['布鲁特在此。船舵自己转向了礁石。'], '', v)).toBe(false)
  })
  it('a line starting with the opener itself gets no extra slot: the words right after it are checked', () => {
    const nope = { opener: 'Nope.', signature: 'not on the list', nickname: null }
    expect(tauntRepeats('Nope. That ticket is torn in half.', [], 'Nope. That ticket is not on the list.', nope)).toBe(true)
    expect(tauntRepeats('Nope. Your coupon expired at noon.', [], 'Nope. That ticket is not on the list.', nope)).toBe(false)
  })
  it('a shared run outside the mandated words still counts', () => {
    expect(tauntRepeats('Aquí Brute. Tu ancla se hundió en la arena.', ['Aquí Brute. Otra ancla se hundió en la arena.'], '', v)).toBe(true)
    expect(tauntRepeats('布鲁特在此。你的锚沉进了沙子里。', ['布鲁特在此。他的锚沉进了沙子。'], '', v)).toBe(true)
  })
  it('an English line that skips the opener gets no slot: its first words are checked', () => {
    const recent = ['You tripped on the rope again, sailor.']
    expect(tauntRepeats('You tripped on a rake this time.', recent, '', v, { translated: false })).toBe(true)
    expect(tauntTranslated('English')).toBe(false)
    expect(tauntTranslated('')).toBe(false)
    expect(tauntTranslated('Spanish')).toBe(true)
    expect(tauntTranslated('日本語')).toBe(true)
  })
  it('an opener in capitals at the start of a CJK line is still the literal opener', () => {
    const c = { opener: 'BRUTE', signature: '', nickname: null }
    expect(tauntRepeats('BRUTE。你的锚沉进了沙子里。', ['brute。他的锚沉进了沙子。'], '', c)).toBe(true)
  })
  it('without a voice nothing is exempt (Legends island bosses, the old behavior)', () => {
    expect(sharesPhrase('Brute here. I am claiming credit now', ['Brute here. I said so'])).toBe(true)
    expect(tauntRepeats('Ladies and gentlemen, watch this', [], 'Ladies and gentlemen, watch closely')).toBe(true)
  })
})
