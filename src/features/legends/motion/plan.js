// COMPOSITED MOTION (pure planning; motion/web.js applies it to a drawing in the page).
// The owner, 2026-10-11, after the easing pass: the Banshee's float and the Kaleido's crystals still moved at a "low
// choppy framerate", "thats the issue with a lot of the animations". Measured on his PC (RTX 4090, 480 Hz) in
// Playwright's Chromium with GPU raster: SMIL in an inline SVG runs on the MAIN thread. Every frame Blink re-ran style,
// paint and layerization for the whole page (the asset view with the arena alone: 830 ms of main-thread work a second,
// 258 frames a second for 480 vsyncs, 228 dropped; with a hovered phase cell 183 frames, 306 dropped), so each part
// held its position for one, two or three display frames at random: a stutter, worst on slow, small motions, and any
// slower machine or busier page drops more. CSS / Web Animations transform animations on SVG elements, in the same
// Chromium, run on the COMPOSITOR: no main-thread frame at all, a new position every display frame (483 of 483), the
// part rastered once and moved by the GPU. Two things push an animation back to the main thread and must never ship:
// a leftover SMIL animation anywhere in the SVG (its timeline ticks the whole document every frame) and
// `composite: 'add'`. So each animated element gets ONE replace-animation per layer: several SMIL animations on one
// element become a chain of nested wrapper groups, one animation each, multiplying to exactly the SMIL result.
// Values, keyTimes, keySplines (easeMotion.js), begin, dur, repeat and freeze map one to one; animateMotion is sampled
// along its path at even length (SMIL's paced timing), rotate="auto" from the path's direction.

const num = (s) => Number(s)
const nums = (v) => String(v).trim().split(/[\s,]+/).filter(Boolean).map(num)
const list = (s) => String(s).trim().replace(/;\s*$/, '').split(';').map((x) => x.trim())
const r = (x) => +(+x).toFixed(4)

// one SVG transform function as CSS (SVG user units are CSS px on SVG elements)
export function fnCss(type, p) {
  if (type === 'translate') return `translate(${r(p[0] || 0)}px, ${r(p[1] || 0)}px)`
  if (type === 'scale') return `scale(${r(p[0] ?? 1)}, ${r(p.length > 1 ? p[1] : p[0] ?? 1)})`
  if (type === 'rotate') {
    const a = r(p[0] || 0), cx = r(p[1] || 0), cy = r(p[2] || 0)
    return cx || cy ? `translate(${cx}px, ${cy}px) rotate(${a}deg) translate(${-cx}px, ${-cy}px)` : `rotate(${a}deg)`
  }
  if (type === 'skewX') return `skewX(${r(p[0] || 0)}deg)`
  if (type === 'skewY') return `skewY(${r(p[0] || 0)}deg)`
  if (type === 'matrix') return p.length >= 6 ? `matrix(${p.slice(0, 6).map(r).join(', ')})` : null
  return null
}

// a transform ATTRIBUTE ("translate(60 -33.6) scale(1.32) rotate(4 10 20)") as CSS; null when it can't be read
export function transformAttrCss(attr) {
  if (!attr || !attr.trim()) return ''
  const out = []
  const re = /\s*(translate|scale|rotate|skewX|skewY|matrix)\s*\(([^)]*)\)\s*,?/gy
  let m, at = 0
  while ((m = re.exec(attr))) {
    const p = nums(m[2])
    if (p.some((x) => !Number.isFinite(x))) return null
    out.push(fnCss(m[1], p))
    at = re.lastIndex
  }
  if (attr.slice(at).trim() || out.some((x) => !x)) return null
  return out.join(' ')
}

// SMIL clock value ("1.5s", "300ms", "2") in ms
export function clockMs(v) {
  if (v == null || v === '') return 0
  const s = String(v).trim()
  const m = /^(-?[\d.]+)(ms|s|min|h)?$/.exec(s)
  if (!m) return NaN
  const k = { ms: 1, s: 1000, min: 60000, h: 3600000 }[m[2] || 's']
  return +m[1] * k
}

const SPLINE = (s) => { const p = nums(s); return p.length === 4 && p.every(Number.isFinite) ? `cubic-bezier(${p.map(r).join(', ')})` : null }

// The timing of one SMIL animation element as Web Animations options; null when it is something this does not map
export function timingOf(a) {
  const duration = clockMs(a.dur)
  const delay = clockMs(a.begin || '0')
  if (!(duration > 0) || !Number.isFinite(delay)) return null
  const rc = a.repeatCount
  const iterations = rc === 'indefinite' ? Infinity : rc ? num(rc) : 1
  if (!(iterations > 0)) return null
  if (a.repeatDur || a.end || (a.accumulate && a.accumulate !== 'none')) return null
  return { duration, delay, iterations, fill: a.fill === 'freeze' ? 'forwards' : 'none' }
}

// An animateTransform's keyframes: [{ offset, fn (CSS), easing }]; null when it can't be mapped exactly
export function transformFrames(a) {
  if (!a.values || !['translate', 'scale', 'rotate', 'skewX', 'skewY'].includes(a.type)) return null
  const vals = list(a.values).map(nums)
  const n = vals.length
  if (n < 1 || vals.some((v) => !v.length || v.some((x) => !Number.isFinite(x)))) return null
  const mode = a.calcMode || 'linear'
  if (mode !== 'linear' && mode !== 'spline' && mode !== 'discrete') return null
  let kt = a.keyTimes ? list(a.keyTimes).map(num) : null
  if (kt && (kt.length !== n || kt.some((x) => !Number.isFinite(x)) || kt[0] !== 0)) return null
  if (!kt) kt = vals.map((_, i) => (n === 1 ? 0 : i / (n - 1)))
  if (mode !== 'discrete' && n > 1 && kt[n - 1] !== 1) return null
  const ks = mode === 'spline' ? list(a.keySplines || '').map(SPLINE) : null
  if (ks && (ks.length !== n - 1 || ks.some((x) => !x))) return null
  if (n === 1) return [{ offset: 0, fn: fnCss(a.type, vals[0]), easing: 'linear' }, { offset: 1, fn: fnCss(a.type, vals[0]), easing: 'linear' }]
  if (mode === 'discrete') {
    // each value holds for its interval: a step at every keyTime
    const out = []
    vals.forEach((v, i) => {
      const end = i + 1 < n ? kt[i + 1] : 1
      out.push({ offset: kt[i], fn: fnCss(a.type, v), easing: 'linear' })
      if (end > kt[i]) out.push({ offset: Math.max(kt[i], end - 1e-6), fn: fnCss(a.type, v), easing: 'linear' })
    })
    return out
  }
  return vals.map((v, i) => ({ offset: kt[i], fn: fnCss(a.type, v), easing: ks && i < n - 1 ? ks[i] : 'linear' }))
}

// Same transform functions in every keyframe, so the browser interpolates each number (a rotate about a centre keeps
// its translate pair fixed): every frame of a layer is prefix + own fn + suffix.
const frameOf = (f, prefix, suffix) => ({ offset: f.offset, easing: f.easing, transform: [prefix, f.fn, suffix].filter(Boolean).join(' ') })

// The LAYERS for one element, outermost first: [{ frames: [{offset, transform, easing}], timing }].
// `base` = the element's transform attribute as CSS ('' none, null unreadable); `anims` = its animateTransform
// attribute objects in document order; `motion` = its animateMotion as { frames, timing } (frames carry `fn`) or null.
// Returns null when the element can't be composited exactly (it keeps its SMIL).
export function planLayers(base, anims, motion) {
  if (base === null) return null
  // the effective chain: an additive animation multiplies onto what is below it, a replacing one starts over
  let chain = base ? [{ static: base }] : []
  const dropped = []
  for (const a of anims) {
    const frames = transformFrames(a)
    const timing = timingOf(a)
    if (!frames || !timing) return null
    const item = { frames, timing }
    if (a.additive === 'sum') chain.push(item)
    else { dropped.push(...chain.filter((c) => !c.static)); chain = [item] }
  }
  // a replaced animation only matters before the replacing one begins or after it ends: keep SMIL then
  if (dropped.length) {
    const first = chain[0]
    if (!first || first.static || first.timing.delay > 0 || first.timing.iterations !== Infinity) return null
  }
  if (motion) chain.unshift(motion)
  // fold static pieces into the neighbouring animated layer (prefix of the next one, else suffix of the previous), but
  // only into one that is in effect all the time: before a delayed begin, or after a one-shot ends without freeze, SMIL
  // shows the transform attribute alone, so the piece stays a layer of its own then ({ static }: a plain transform)
  const always = (t) => t.delay <= 0 && (t.iterations === Infinity || t.fill === 'forwards')
  const layers = []
  let pending = ''
  for (const c of chain) {
    if (c.static) { pending += (pending ? ' ' : '') + c.static; continue }
    if (pending && !always(c.timing)) { layers.push({ static: pending }); pending = '' }
    layers.push({ frames: c.frames, timing: c.timing, prefix: pending, suffix: '' })
    pending = ''
  }
  if (pending) {
    const last = layers[layers.length - 1]
    if (last && !last.static && always(last.timing)) last.suffix += (last.suffix ? ' ' : '') + pending
    else layers.push({ static: pending })
  }
  if (!layers.some((l) => !l.static)) return []
  // an animation that never changes the transform (every keyframe the same: a held pose, a placeholder loop) is a plain
  // transform: the browser refuses to composite one with no visible change, so it would tick the main thread for nothing
  const out = layers.map((l) => (l.static ? { static: l.static } : { timing: l.timing, frames: l.frames.map((f) => frameOf(f, l.prefix, l.suffix)) }))
    .map((l) => (!l.static && always(l.timing) && l.frames.every((f) => f.transform === l.frames[0].transform) ? { static: l.frames[0].transform, held: true } : l))
  return out
}

// animateMotion sampled at even LENGTH along its path (SMIL's default paced timing): `pts` = [{x, y, angle}] from
// the start to the end of the path (angle in degrees, the path's direction there), `auto` = rotate="auto".
export function motionFrames(pts, auto) {
  if (!pts || pts.length < 2) return null
  let prev = null
  return pts.map((p, i) => {
    let a = p.angle
    if (prev != null) { while (a - prev > 180) a -= 360; while (a - prev < -180) a += 360 } // turn the short way round
    prev = a
    return { offset: i / (pts.length - 1), easing: 'linear', fn: `translate(${r(p.x)}px, ${r(p.y)}px)${auto ? ` rotate(${r(a)}deg)` : ''}` }
  })
}
// how many points to sample along a path of `length` user units: dense enough that the straight pieces between them
// never show (a turn of a circle of radius 2 is still round), never thousands
export const motionSamples = (length) => Math.max(16, Math.min(360, Math.ceil(length / 0.5) + 1))
