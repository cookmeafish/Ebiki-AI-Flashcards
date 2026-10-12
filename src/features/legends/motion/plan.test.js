import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { fnCss, transformAttrCss, clockMs, timingOf, transformFrames, planLayers, motionFrames, motionSamples } from './plan'
import { easeTurns } from '../easeMotion'

describe('composited motion plan', () => {
  it('maps every SVG transform function to CSS in user units', () => {
    expect(fnCss('translate', [0, -1.8])).toBe('translate(0px, -1.8px)')
    expect(fnCss('translate', [3])).toBe('translate(3px, 0px)')
    expect(fnCss('scale', [1.2])).toBe('scale(1.2, 1.2)')
    expect(fnCss('scale', [1, 0.08])).toBe('scale(1, 0.08)')
    expect(fnCss('rotate', [-2.4, 36, 84])).toBe('translate(36px, 84px) rotate(-2.4deg) translate(-36px, -84px)')
    expect(fnCss('rotate', [45])).toBe('rotate(45deg)')
    expect(fnCss('skewX', [-2.5])).toBe('skewX(-2.5deg)')
  })
  it('reads a transform attribute, refusing what it cannot read', () => {
    expect(transformAttrCss('translate(60 -33.6) scale(1.32) translate(-60 0)')).toBe('translate(60px, -33.6px) scale(1.32, 1.32) translate(-60px, 0px)')
    expect(transformAttrCss('')).toBe('')
    expect(transformAttrCss('rotate(4,10,20)')).toBe('translate(10px, 20px) rotate(4deg) translate(-10px, -20px)')
    expect(transformAttrCss('matrix(1 0 0 1 2 3)')).toBe('matrix(1, 0, 0, 1, 2, 3)')
    expect(transformAttrCss('wobble(3)')).toBe(null)
    expect(transformAttrCss('matrix(1 0)')).toBe(null)
  })
  it('maps SMIL timing one to one', () => {
    expect(clockMs('5.2s')).toBe(5200)
    expect(clockMs('300ms')).toBe(300)
    expect(clockMs('.9s')).toBe(900)
    expect(timingOf({ dur: '5.2s', repeatCount: 'indefinite' })).toEqual({ duration: 5200, delay: 0, iterations: Infinity, fill: 'none' })
    expect(timingOf({ dur: '1.5s', fill: 'freeze', begin: '.3s' })).toEqual({ duration: 1500, delay: 300, iterations: 1, fill: 'forwards' })
    expect(timingOf({ dur: '0s' })).toBe(null)
    expect(timingOf({ dur: '1s', end: '3s' })).toBe(null)
  })
  it('keeps keyTimes as offsets and keySplines as per-segment easing', () => {
    const f = transformFrames({ type: 'translate', values: '0 0;0 -1.8;0 0', keyTimes: '0;0.5;1', calcMode: 'spline', keySplines: '0.333 0 0.667 1;0.333 0 0.667 1' })
    expect(f.map((x) => x.offset)).toEqual([0, 0.5, 1])
    expect(f[0].easing).toBe('cubic-bezier(0.333, 0, 0.667, 1)')
    expect(f[2].easing).toBe('linear')
    // even spacing when keyTimes are missing; a mismatched list is refused (the browser drops those too)
    expect(transformFrames({ type: 'scale', values: '1;1.2;1' }).map((x) => x.offset)).toEqual([0, 0.5, 1])
    expect(transformFrames({ type: 'scale', values: '1;1.2;1', keyTimes: '0;1' })).toBe(null)
    expect(transformFrames({ type: 'scale', values: '1;1.2', calcMode: 'paced' })).toBe(null)
  })
  it('multiplies additive animations onto the transform attribute, one layer each', () => {
    const a = { type: 'rotate', values: '0 60 104;1.6 60 104;0 60 104', dur: '5.2s', repeatCount: 'indefinite' }
    const b = { type: 'skewX', values: '0;-2.5;0', dur: '5.2s', repeatCount: 'indefinite', additive: 'sum' }
    // a replacing animation drops the attribute; an additive one keeps it as a prefix
    const l1 = planLayers('translate(2px, 3px)', [a, b], null)
    expect(l1).toHaveLength(2)
    expect(l1[0].frames[1].transform).toBe('translate(60px, 104px) rotate(1.6deg) translate(-60px, -104px)')
    expect(l1[1].frames[1].transform).toBe('skewX(-2.5deg)')
    const l2 = planLayers('translate(2px, 3px)', [{ ...a, additive: 'sum' }], null)
    expect(l2[0].frames[0].transform).toBe('translate(2px, 3px) translate(60px, 104px) rotate(0deg) translate(-60px, -104px)')
  })
  it('turns an animation with no visible change into a held transform (the browser will not composite it)', () => {
    const flat = { type: 'translate', values: '0 0;0 0;0 0', dur: '3s', repeatCount: 'indefinite', additive: 'sum' }
    expect(planLayers('scale(2)', [flat], null)).toEqual([{ static: 'scale(2) translate(0px, 0px)', held: true }])
    // a delayed one still waits for its begin (before it the attribute alone shows)
    expect(planLayers('', [{ ...flat, begin: '1s' }], null)[0].frames).toHaveLength(3)
  })
  it('keeps the transform attribute on its own before a delayed begin (never folded into a layer that is not on yet)', () => {
    const late = { type: 'scale', values: '1 0.02;1 1;1 0.02', dur: '1s', begin: '0.7s', repeatCount: 'indefinite', additive: 'sum' }
    const l = planLayers('scale(1, 0.02)', [late], null)
    expect(l[0]).toEqual({ static: 'scale(1, 0.02)' })
    expect(l[1].frames[0].transform).toBe('scale(1, 0.02)')
    const once = { type: 'translate', values: '0 0;0 5', dur: '1s', additive: 'sum' }
    expect(planLayers('translate(40px, 40px)', [once], null)[0]).toEqual({ static: 'translate(40px, 40px)' })
  })
  it('keeps SMIL where a replaced animation would still show (before the replacing one begins)', () => {
    const a = { type: 'scale', values: '1;2;1', dur: '1s', repeatCount: 'indefinite' }
    expect(planLayers('', [a, { ...a, begin: '1s' }], null)).toBe(null)
    expect(planLayers('', [a, a], null)).toHaveLength(1)
  })
  it('puts a motion path outside the element transform, turning the short way round', () => {
    const fr = motionFrames([{ x: 0, y: 0, angle: 170 }, { x: 1, y: 0, angle: -170 }], true)
    expect(fr[1].fn).toBe('translate(1px, 0px) rotate(190deg)')
    const layers = planLayers('scale(2, 2)', [], { frames: fr, timing: { duration: 1000, delay: 0, iterations: Infinity, fill: 'none' } })
    expect(layers[0].frames[0].transform).toBe('translate(0px, 0px) rotate(170deg) scale(2, 2)')
    expect(motionSamples(1)).toBe(16)
    expect(motionSamples(1e6)).toBe(360)
  })
  it('maps every animation in every Legends drawing (nothing is left to tick on the main thread)', () => {
    const root = path.resolve('public/assets/legends')
    const missed = []
    for (const kind of ['raids', 'bosses', 'areas']) {
      for (const f of fs.readdirSync(path.join(root, kind)).filter((x) => x.endsWith('.svg'))) {
        const svg = easeTurns(fs.readFileSync(path.join(root, kind, f), 'utf8'))
        for (const tag of svg.match(/<animateTransform\b[^>]*>/g) || []) {
          const at = Object.fromEntries([...tag.matchAll(/\s([\w:-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]))
          if (!transformFrames(at) || !timingOf(at)) missed.push(`${kind}/${f}: ${tag.slice(0, 120)}`)
        }
      }
    }
    expect(missed).toEqual([])
  })
})
