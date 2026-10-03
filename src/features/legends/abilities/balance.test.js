// BALANCE HARNESS (report only; BALANCE=1 npx vitest run src/features/legends/abilities/balance.test.js prints it).
// Design target: an 85% player ends the raid between 55% and 95% of the questions. Stream 4 tunes the constants (or
// RAID.hpPerCard) from this table; it asserts only that every ability's run ends.
import { describe, it, expect } from 'vitest'
import { ABILITY_BY_MOTIF } from './index'
import { balanceOf, mixed, ALL_CLEAN } from './_sim'

describe('balance (report)', () => {
  it('every ability ends a raid for the 100% and 85% patterns', () => {
    const rows = []
    for (const [motif, a] of Object.entries(ABILITY_BY_MOTIF)) {
      for (const [label, answer] of [['100%', ALL_CLEAN], ['85%', mixed(0.15)], ['70%', mixed(0.3)]]) {
        for (const r of balanceOf(a.id, { answer, press: 'greedy' })) {
          expect(r.asked).toBeGreaterThan(0)
          rows.push(`${motif.padEnd(11)} ${label.padEnd(5)} n=${String(r.n).padEnd(3)} ended at ${String(Math.round(r.share * 100)).padStart(3)}% ${r.outcome || 'ran out'} (${r.damage}/${r.need})`)
        }
      }
    }
    if (process.env.BALANCE) process.stdout.write(`\n${rows.join('\n')}\n`)
  })
})
