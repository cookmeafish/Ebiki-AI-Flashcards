// A WHOLE RAID, simulated without a screen (pure): the same steps RaidRun takes (raidStep, the ability's buttons, the
// questions it inserts, settleFight at the end). Used by fairness.test.js and free for any ability's own tests.
//
//   simulateRaid(abilityId, { n, answer, press, dayBefore, dayHp }) -> { state, need, lives, hp, outcome, log, acts, settled, asked }
//     acts: the button presses that changed the fight ({ idx, action, fx }); settled: { fx } when settleFight let held damage go
//     n        the raid's cards (one question each)
//     answer   (q, info) -> { verdict: 'clean'|'glancing'|'miss', mode: 'typed'|'choice' }   info = { idx, phase, state,
//              normal, kind }: how the learner answers each question (attacks and inserted ones too)
//     press    'never' | 'greedy' (arm every toggle and press every enabled button until nothing changes) |
//              (actions, info) -> [ids to press / arm]: a custom policy
//     dayBefore  damage earlier attempts dealt today (a wounded boss); dayHp the day's health (default raidHp(n))
//   log: one entry per answer { q, hit, before, after, phaseBefore, phaseAfter }
import { newFight, act, settleFight, fightOutcome, abilityState, barPhase } from '../fight'
import { raidStep, raidHp, RAID } from '../raid'
import { abilityById } from './index'

export const SIM_MAX_ASKED = 400

const stamp = (s) => JSON.stringify({ d: s.damage, l: s.livesLost, ab: s.ab || null })

export function simulateRaid(ability, { n = 10, answer = () => ({ verdict: 'clean', mode: 'typed' }), press = 'never', dayBefore = 0, dayHp } = {}) {
  const mod = abilityById(ability)
  const hp = dayHp != null ? dayHp : raidHp(n)
  const need = Math.max(1, hp - dayBefore)
  const lives = RAID.lives
  const bar = { total: hp, before: dayBefore, phases: RAID.phases }
  const opts = { ability, need, lives, bar }
  const questions = Array.from({ length: n }, (_, i) => ({ kind: 'typed', prompt: `Card ${i}?`, accepted: [`a${i}`], alt: { choices: [`a${i}`, 'x'], answerIdx: 0 }, target: `card ${i}`, _cardId: 1000 + i }))
  const list = [...questions]
  const pending = []
  const log = []
  const pressed = [] // every button press that changed the fight: { idx, action, fx }
  let s = newFight()
  const over = () => s.damage >= need || s.livesLost >= lives
  let idx = 0
  for (; idx < list.length && idx < SIM_MAX_ASKED && !over(); idx++) {
    const q = list[idx]
    const phase = barPhase(bar, s.damage)
    const normal = !q._attack && !q._inserted && !q._lastStand
    const kind = q._attack ? 'attack' : normal ? 'normal' : 'inserted'
    const a = answer(q, { idx, phase, state: s, normal, kind }) || { verdict: 'miss', mode: 'typed' }
    // Choices only where RaidRun offers them: a normal question in phase 1.
    const mode = a.mode === 'choice' && normal && phase === 1 ? 'choice' : 'typed'
    // The ability's buttons before answering: only a `decision: true` module has any, and never on an attack or an
    // inserted question (RaidRun hides them there too).
    let armed = null
    if (mod && mod.decision && mod.actions && press !== 'never' && normal) {
      for (let guard = 0; guard < 24 && !over(); guard++) {
        const ctx = { phase: barPhase(bar, s.damage), need, lives, livesLeft: lives - s.livesLost, damage: s.damage, bar, mode, q, armed: armed || {}, K: mod.K || {} }
        const acts = (mod.actions({ ...s, ab: abilityState(s, mod, ctx) }, ctx) || []).filter((x) => x && x.enabled !== false)
        const pick = typeof press === 'function' ? press(acts, { idx, phase, state: s, q, mode }) || [] : acts.map((x) => x.id)
        let changed = false
        for (const x of acts.filter((y) => pick.includes(y.id))) {
          if (x.toggle) { if (!(armed && armed[x.id])) { armed = { ...(armed || {}), [x.id]: true } } continue }
          const before = stamp(s)
          s = act(s, { type: x.id }, opts)
          if (stamp(s) !== before) { changed = true; pressed.push({ idx, action: x.id, fx: (s.last && s.last.fx) || '' }) }
          if (over()) break
        }
        if (!changed || typeof press === 'function') break
      }
      if (over()) break
    }
    const before = s
    const r = raidStep(s, q, { verdict: a.verdict, mode, attackQ: a.attackQ }, { ability, need, lives, dayHp: hp, dayBefore, pos: idx, questions, armed })
    s = r.next
    log.push({ q, hit: { verdict: a.verdict, mode }, before, after: s, phaseBefore: phase, phaseAfter: barPhase(bar, s.damage) })
    pending.push(...r.groups)
    const g = pending.shift()
    if (g && g.insert.length) list.splice(Math.max(idx + 1, Math.min(g.at, list.length)), 0, ...g.insert.map((x) => ({ ...x, _extra: true })))
  }
  let settled = null
  if (!over()) { const t = settleFight(s, opts); if (t !== s) settled = { fx: (t.last && t.last.fx) || '' }; s = t }
  return { state: s, need, lives, hp, outcome: fightOutcome(s, { need, lives }), log, acts: pressed, settled, asked: idx }
}

// Answer patterns for the tests.
export const ALL_CLEAN = () => ({ verdict: 'clean', mode: 'typed' })
export const ALL_MISS = () => ({ verdict: 'miss', mode: 'typed' })
// Choices whenever they are offered (phase 1), clean typed after ("choices while allowed, then typed, all right").
export const CHOICE_HEAVY = () => ({ verdict: 'clean', mode: 'choice' })
export const CHOICES_THEN_TYPED = CHOICE_HEAVY
// HARSH all wrong: every question missed, attacks and ability-inserted re-asks too (an ability that pays on a re-ask
// must not win a run whose every answer was wrong).
export const ALL_MISS_HARSH = () => ({ verdict: 'miss', mode: 'typed' })
// Raid questions all wrong but every re-ask (attack, inserted question) answered RIGHT: a lenient pattern for reports.
export const MISS_BUT_REASKS = (q, { normal }) => (normal ? { verdict: 'miss', mode: 'typed' } : { verdict: 'clean', mode: 'typed' })
// A fixed mixed pattern (about `missShare` misses, some glancing answers), the same every run.
export const mixed = (missShare = 0.3) => (q, { idx }) => {
  const r = ((idx * 37 + 11) % 100) / 100
  if (r < missShare) return { verdict: 'miss', mode: 'typed' }
  if (r > 0.9) return { verdict: 'glancing', mode: 'typed' }
  return { verdict: 'clean', mode: r > 0.75 ? 'choice' : 'typed' }
}

// BALANCE: how far into the questions a run ends, for an answer pattern (design: an 85% player should finish the
// boss between 55% and 95% of the questions). Returns { n, asked, share, outcome, damage, need } per size.
export function balanceOf(ability, { sizes = [8, 15], answer = mixed(0.15), press = 'never' } = {}) {
  return sizes.map((n) => {
    const r = simulateRaid(ability, { n, answer, press })
    return { n, asked: r.asked, share: Math.round((r.asked / n) * 100) / 100, outcome: r.outcome, damage: r.state.damage, need: r.need }
  })
}
