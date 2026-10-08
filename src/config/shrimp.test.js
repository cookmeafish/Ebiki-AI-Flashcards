import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { SHRIMP, POSE_NAMES, DEFAULT_SHRIMP, IDLE_SHRIMP, poseFile, pickShrimp } from './shrimp.js'

const DIR = path.resolve('public', 'assets', 'shrimp')

describe('Ebi poses', () => {
  it('every pose file exists, including the default and idle pictures', () => {
    for (const f of [DEFAULT_SHRIMP, IDLE_SHRIMP, ...SHRIMP.map((s) => s.file)]) {
      expect(fs.existsSync(path.join(DIR, f)), f).toBe(true)
    }
  })

  it('names and files are unique, lowercase names', () => {
    const names = SHRIMP.map((s) => s.name)
    expect(new Set(names).size).toBe(names.length)
    expect(new Set(SHRIMP.map((s) => s.file)).size).toBe(SHRIMP.length)
    for (const n of names) expect(n).toBe(n.toLowerCase())
    expect(POSE_NAMES).toContain('default')
  })

  it('no keyword belongs to two poses (a shared keyword makes the pose a coin flip)', () => {
    const owner = new Map()
    for (const s of SHRIMP) {
      for (const k of s.keywords) {
        const key = k.toLowerCase()
        expect(owner.get(key) ?? s.name, `"${k}" is in ${owner.get(key)} and ${s.name}`).toBe(s.name)
        owner.set(key, s.name)
      }
    }
  })

  it('matches whole words only and falls back to the plain shrimp', () => {
    expect(pickShrimp('a particular case')).toBe(DEFAULT_SHRIMP)
    expect(pickShrimp('')).toBe(DEFAULT_SHRIMP)
    expect(pickShrimp('let me cut the onion')).toBe(poseFile('knife'))
    expect(pickShrimp('time to relax on the couch')).toBe(poseFile('chill'))
    expect(pickShrimp('a sleepy dream')).toBe(poseFile('sleep'))
    expect(poseFile('DEFAULT')).toBe(DEFAULT_SHRIMP)
    expect(poseFile('nope')).toBe(null)
  })
})
