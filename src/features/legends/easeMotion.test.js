import { describe, it, expect } from 'vitest'
import { easeTurns, splinesFor } from './easeMotion'

const tag = (values, extra = '') => `<animateTransform class="lg-loop" attributeName="transform" type="translate" values="${values}"${extra} dur="4s" repeatCount="indefinite"/>`
const splines = (out) => (/keySplines="([^"]*)"/.exec(out) || [])[1]?.split(';')
// the cubic each keySpline describes, as progress over time (x is linear in the parameter: x1 = 1/3, x2 = 2/3)
const speedAt = (s, u) => { const [, y1, , y2] = s.split(' ').map(Number); return 3 * (1 - u) ** 2 * y1 + 6 * (1 - u) * u * (y2 - y1) + 3 * u * u * (1 - y2) }

describe('easeTurns: SMIL motion eases where it turns', () => {
  it('a breath comes to rest at its top and at its bottom', () => {
    const s = splines(easeTurns(tag('0 0;0 -1.4;0 0', ' keyTimes="0;.5;1"')))
    expect(s).toHaveLength(2)
    for (const k of s) { expect(speedAt(k, 0)).toBeCloseTo(0); expect(speedAt(k, 1)).toBeCloseTo(0) }
  })
  it('keeps values and keyTimes exactly (frame 0 stays the rest pose)', () => {
    const out = easeTurns(tag('0 0;0 -1.4;0 0', ' keyTimes="0;.5;1"'))
    expect(out).toContain('values="0 0;0 -1.4;0 0"')
    expect(out).toContain('keyTimes="0;.5;1"')
    expect(out).toContain('calcMode="spline"')
  })
  it('adds even keyTimes when the file has none (spline needs them)', () => {
    expect(easeTurns(tag('0;5;0'))).toContain('keyTimes="0;0.5;1"')
  })
  it('leaves a spin linear', () => {
    const t = '<animateTransform type="rotate" values="0;360" dur="48s" repeatCount="indefinite"/>'
    expect(easeTurns(t)).toBe(t)
  })
  it('a step (a jump back to the path start) neither eases nor bends the path either side of it', () => {
    const t = tag('0 0;0 -10;0 -20;0 -30;0 0', ' keyTimes="0;0.333;0.666;0.999;1"')
    const out = easeTurns(t)
    // even pace up, the jump, even pace again: nothing to ease
    expect(out).toBe(t)
  })
  it('a sway that crosses its centre at a new pace changes speed smoothly (one speed both sides)', () => {
    const s = splinesFor([[0], [2.4], [0], [-1.2], [0]], true, [0, 0.3, 0.5, 0.8, 1])
    // at keyframe 2 (value 0, passing through) the speed leaving segment 1 equals the speed entering segment 2
    const T = [0.3, 0.2, 0.3, 0.2], D = [2.4, 2.4, 1.2, 1.2]
    const out1 = speedAt(s[1], 1) * D[1] / T[1], in2 = speedAt(s[2], 0) * D[2] / T[2]
    expect(out1).toBeGreaterThan(0)
    expect(Math.abs(out1 - in2) / out1).toBeLessThan(0.01)
  })
  it('a one-shot entrance starts and lands at rest', () => {
    const s = splinesFor([[0, 16], [0, -2], [0, 0]], false, [0, 0.4, 1])
    expect(speedAt(s[0], 0)).toBeCloseTo(0)
    expect(speedAt(s[1], 1)).toBeCloseTo(0)
  })
  it('an lg-in entrance keeps its beats linear: only its first start and final settle ease', () => {
    const t = '<animateTransform class="lg-in" attributeName="transform" type="translate" values="0 16;0 16;0 -2;0 0" keyTimes="0;0.08;0.4;1" dur="1.6s" fill="freeze"/>'
    const s = splines(easeTurns(t))
    expect(s).toHaveLength(3)
    expect(s[0]).toBe('0 0 1 1')                     // the hold before it moves
    expect(speedAt(s[1], 0)).toBeCloseTo(0)           // leaves from rest
    expect(speedAt(s[1], 1)).toBeCloseTo(1)           // SLAMS into the overshoot at full (linear) speed
    expect(speedAt(s[2], 0)).toBeCloseTo(1)           // and leaves it at speed
    expect(speedAt(s[2], 1)).toBeCloseTo(0)           // settles on the file's pose
  })
  it('a trailing ";" in values or keyTimes is tolerated', () => {
    const out = easeTurns(tag('0 0;0 -1.4;0 0;', ' keyTimes="0;.5;1;"'))
    expect(out).toContain('calcMode="spline"')
    expect(splines(out)).toHaveLength(2)
    expect(splines(easeTurns(tag('0;5;0;')))).toHaveLength(2)
  })
  it('never touches a tag that already has a calcMode, or a mismatched keyTimes', () => {
    const a = tag('0;1;0', ' calcMode="linear"'), b = tag('0;1;0', ' keyTimes="0;1"')
    expect(easeTurns(a)).toBe(a)
    expect(easeTurns(b)).toBe(b)
  })
  it('every control point stays inside 0..1 (a browser drops a spline outside)', () => {
    const vals = [[0], [1], [5], [5.5], [9], [0]]
    for (const k of splinesFor(vals, true, [0, 0.1, 0.2, 0.5, 0.55, 1])) for (const x of k.split(' ').map(Number)) { expect(x).toBeGreaterThanOrEqual(0); expect(x).toBeLessThanOrEqual(1) }
  })
})
