// The sprite-rig plan: what stays live vector, how drawing order splits into baked runs, var() resolution, sizes and persistence.
import { describe, it, expect } from 'vitest'
import { markLive, planRuns, resolveVars, bitmapSize, runDensity, densityBucket, sampleTimes, strokePad, worthBaking, BAKE } from './bakePlan'

const n = (tag, children = [], cls = '') => ({ tag, cls, children })

describe('sizes', () => {
  it('draws a run with headroom, at the largest scale its part reaches', () => {
    expect(runDensity(2, 1)).toBeCloseTo(2 * BAKE.grow)
    expect(runDensity(2, 3)).toBeCloseTo(6 * BAKE.grow) // a part that grows to 3x is drawn at 3x
  })
  it('pads a bitmap exactly as far as its strokes reach', () => {
    expect(strokePad({ width: 2, join: 'round', cap: 'round' })).toBe(1)
    expect(strokePad({ width: 2, join: 'round', cap: 'square' })).toBeCloseTo(Math.SQRT2)
    expect(strokePad({ width: 2, join: 'miter', cap: 'butt' })).toBe(4) // SVG's default miter limit 4
    expect(strokePad({ width: 2, join: 'miter', miter: 1.5, cap: 'butt' })).toBe(1.5)
    expect(strokePad({ width: 0, join: 'miter' })).toBe(0)
  })
  it('bakes only drawings with enough shapes to be worth it', () => {
    expect(worthBaking('<svg>' + '<rect/>'.repeat(BAKE.minShapes - 1) + '</svg>')).toBe(false)
    expect(worthBaking('<svg>' + '<path d=""/>'.repeat(BAKE.minShapes) + '</svg>')).toBe(true)
    expect(worthBaking('<svg><radialGradient/><lineargradient/></svg>')).toBe(false) // not shapes
  })
  it('samples the whole entrance and a long stretch of the loops', () => {
    const intro = sampleTimes(null, true)
    expect(intro[0]).toBe(0)
    expect(intro[intro.length - 1]).toBeGreaterThanOrEqual(3.2)
    expect(sampleTimes(null, false).at(-1)).toBeGreaterThanOrEqual(8.9)
  })
})

describe('parts the page reaches stay live', () => {
  const tree = (cls, kids = []) => ({ tag: 'g', cls, children: kids })
  const leaf = (tag = 'path', cls = '') => ({ tag, cls, children: [] })
  it('keeps a classed part live (effect CSS moves it) but bakes its static children', () => {
    const m = markLive(tree('', [tree('lgfa-chronos-jaw', [leaf(), leaf()]), leaf()]))
    expect(m.children[0].live).toBe(true)
    expect(m.children[0].children.every((k) => !k.live)).toBe(true)
    expect(m.children[1].live).toBe(false)
  })
  it('keeps every shape of an effect layer live (its CSS selects child shapes)', () => {
    const m = markLive(tree('', [tree('lg-fx-ablaze', [leaf(), tree('', [leaf('circle')])])]))
    const all = (n) => [n, ...n.children.flatMap(all)]
    expect(all(m.children[0]).every((n) => n.live)).toBe(true)
  })
  it('leaves an unclassed static group to the run', () => {
    expect(markLive(tree('', [tree('decor', [leaf()])])).children[0].live).toBe(false)
  })
})

describe('bake plan', () => {
  it('keeps animated parts, their holders, phase and photo layers and images live', () => {
    const t = markLive(n('svg', [
      n('path'),
      n('g', [n('path'), n('g', [n('animateTransform'), n('path')])]),
      n('g', [n('path')], 'lg-p2'),
      n('g', [n('image')]),
      n('g', [n('path'), n('circle')]),
    ]))
    expect(t.live).toBe(true)
    expect(t.children.map((k) => k.live)).toEqual([false, true, true, true, false])
    expect(t.children[1].children.map((k) => k.live)).toEqual([false, true])
  })
  it('splits children into runs in drawing order, broken by live and kept elements', () => {
    const kids = [
      { tag: 'defs' }, { tag: 'path' }, { tag: 'circle' }, { tag: 'g', live: true }, { tag: 'path' },
      { tag: 'animateTransform' }, { tag: 'path', hidden: true }, { tag: 'path' },
    ]
    expect(planRuns(kids)).toEqual([{ keep: 0 }, { run: [1, 2] }, { live: 3 }, { run: [4] }, { keep: 5 }, { keep: 6 }, { run: [7] }])
  })
  it('resolves var() from the page, else its fallback, nested parentheses included', () => {
    const page = { '--lg-tint': '#ff0000', '--lg-ink': '' }
    const look = (k) => page[k] || ''
    expect(resolveVars('fill="var(--lg-tint, #00ff00)"', look)).toBe('fill="#ff0000"')
    expect(resolveVars('stroke="var(--lg-ink, #1d2230)"', look)).toBe('stroke="#1d2230"')
    expect(resolveVars('fill="var(--x, rgba(1, 2, 3, .5))" b', look)).toBe('fill="rgba(1, 2, 3, .5)" b')
    expect(resolveVars('var(--x, var(--lg-tint, #000))', look)).toBe('#ff0000')
    expect(resolveVars('no vars here', look)).toBe('no vars here')
  })
  it('sizes bitmaps at the device density, never past the cap', () => {
    expect(bitmapSize(10, 5, 4)).toEqual({ width: 40, height: 20, density: 4 })
    const big = bitmapSize(1000, 100, 8)
    expect(big.width).toBe(BAKE.maxSide)
    expect(runDensity(2, 1)).toBeCloseTo(2 * BAKE.grow)
    expect(runDensity(100, 1)).toBe(BAKE.maxDensity)
    expect(densityBucket(2.13)).toBe(2.25)
  })
})

describe('bake plan definitions', () => {
  it('copies only the definitions a run points at, and what those point at', async () => {
    const { referencedIds, neededDefs } = await import('./bakePlan')
    expect([...referencedIds('<path fill="url(#g1)" mask="url(\'#m\')"/><use href="#s"/>')]).toEqual(['g1', 'm', 's'])
    const defs = new Map([
      ['g1', '<linearGradient id="g1" href="#g0"/>'],
      ['g0', '<linearGradient id="g0"><stop/></linearGradient>'],
      ['g9', '<radialGradient id="g9"/>'],
    ])
    expect(neededDefs('<path fill="url(#g1)"/>', defs)).toEqual([defs.get('g0'), defs.get('g1')])
    expect(neededDefs('<path fill="red"/>', defs)).toEqual([])
  })
})

describe('bakes kept between sessions', () => {
  it('packs and unpacks a bake exactly, and refuses anything else', async () => {
    const { packBake, unpackBake, BAKE_SLOT, hashText } = await import('./bakePlan')
    const pngs = [new Uint8Array([1, 2, 3]).buffer, new Uint8Array([9, 8]).buffer]
    const markup = `<svg><image href="${BAKE_SLOT(0)}"/><image href="${BAKE_SLOT(1)}"/></svg>`
    const back = unpackBake(packBake(markup, pngs))
    expect(back.markup).toBe(markup)
    expect(back.pngs.map((p) => [...new Uint8Array(p)])).toEqual([[1, 2, 3], [9, 8]])
    const cut = packBake(markup, pngs).slice(0, 20)
    expect(unpackBake(cut)).toBeNull()
    expect(unpackBake(new ArrayBuffer(2))).toBeNull()
    expect(hashText('abc')).toBe(hashText('abc'))
    expect(hashText('abc')).not.toBe(hashText('abd'))
    expect(hashText('')).toMatch(/^[0-9a-f]{8}$/)
  })
})
