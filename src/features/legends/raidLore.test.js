// Every raid boss has lore (lg_raidLore_<motif>, shown in the asset view) in every language, and a voice for a
// future boss dialogue (raidVoices.js). The keys are built from a template, so the i18n coverage test cannot see them.
import { describe, it, expect } from 'vitest'
import { RAID_MOTIFS } from './raid'
import { RAID_VOICES } from './raidVoices'
import { LANGUAGES } from '../../i18n/languages'

const DASHES = /[–—]/
const SHRIMP = /[\u{1F990}\u{1F99E}\u{1F980}]/u

describe('raid boss lore', () => {
  it('every raid boss has lore in every language, with no dashes', () => {
    for (const { code, strings } of LANGUAGES) {
      for (const m of RAID_MOTIFS) {
        const s = strings[`lg_raidLore_${m}`]
        expect(typeof s === 'string' && s.trim().length > 20, `${code}: lg_raidLore_${m}`).toBe(true)
        expect(DASHES.test(s), `${code}: dash in lg_raidLore_${m}`).toBe(false)
      }
      for (const k of ['lg_raidLoreTitle', 'lg_raidVoiceTitle', 'lg_raidVoiceNote', 'lg_raidVoiceSample']) {
        expect(strings[k], `${code}: ${k}`).toBeTruthy()
      }
    }
  })
  it('no lore for a boss that does not exist', () => {
    const en = LANGUAGES.find((l) => l.code === 'en').strings
    const extra = Object.keys(en).filter((k) => k.startsWith('lg_raidLore_')).map((k) => k.slice('lg_raidLore_'.length))
    expect(extra.filter((m) => !RAID_MOTIFS.includes(m))).toEqual([])
  })
})

describe('raid boss voices', () => {
  it('every raid boss has a voice and a sample line, with no dashes or shrimp', () => {
    expect(Object.keys(RAID_VOICES).sort()).toEqual([...RAID_MOTIFS].sort())
    for (const m of RAID_MOTIFS) {
      const { voice, sample } = RAID_VOICES[m]
      expect(voice.trim().length > 100, `${m}: voice`).toBe(true)
      expect(sample.trim().length > 0, `${m}: sample`).toBe(true)
      for (const s of [voice, sample]) {
        expect(DASHES.test(s), `${m}: dash`).toBe(false)
        expect(SHRIMP.test(s), `${m}: shrimp`).toBe(false)
      }
    }
  })
})
