import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { ABILITY_FX_KEYS } from './AbilityFx'
import { ABILITIES } from './fight'
import { RAID_MOTIFS, RAID_ABILITY } from './raid'

// Every effect the fight can fire (strike's last.fx) has a picture (AbilityFx), a floater text (BossArena FX_KEY) and
// a button in the asset view; every raid boss's ability is a known one.
describe('raid ability effects', () => {
  const dir = path.dirname(fileURLToPath(import.meta.url))
  const read = (f) => fs.readFileSync(path.join(dir, f), 'utf8')
  const fight = read('fight.js')
  const arena = read('BossArena.jsx')
  const asset = read('AssetView.jsx')
  const fired = [...new Set([...fight.matchAll(/fx = (?:fx \|\| )?'([a-z]+)'/g)].map((m) => m[1]))]
  it('every fired effect is drawn and has its floater text', () => {
    expect(fired.length).toBeGreaterThan(15)
    for (const fx of fired) {
      expect(ABILITY_FX_KEYS, fx).toContain(fx)
      expect(arena.includes(`${fx}: 'lg_fx_${fx}'`), `FX_KEY.${fx}`).toBe(true)
    }
  })
  it('every raid ability lists the effects it fires for the asset view', () => {
    for (const m of RAID_MOTIFS) expect(ABILITIES).toContain(RAID_ABILITY[m])
    const start = asset.indexOf('const ABILITY_FX = {')
    const map = asset.slice(start, asset.indexOf('}\n', start) + 1)
    for (const a of ABILITIES) {
      const m = map.match(new RegExp(`\\b${a}: \\[([^\\]]*)\\]`))
      expect(m, a).toBeTruthy()
      for (const fx of m[1].match(/[a-z]+/g)) expect(fired, `${a} -> ${fx}`).toContain(fx)
    }
  })
})
