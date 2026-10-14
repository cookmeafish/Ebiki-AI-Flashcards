// COMPOSITED MOTION (browser half; the why and the mapping rules: plan.js). A live drawing's SMIL animations become Web
// Animations on the same elements, so the compositor moves every part at the display's rate with no main-thread frame.
// The SVG keeps its SMIL clock API (pauseAnimations, unpauseAnimations, setCurrentTime, getCurrentTime,
// animationsPaused): its own methods also drive the new animations, so freezing (frame 0), the timeline kept across a
// bake or phase swap, the hidden-window sleep and the arena's hit-stop work unchanged. No Web Animations (an old
// browser): the SMIL plays as before.
import { planLayers, transformAttrCss, motionFrames, motionSamples, timingOf } from './plan'

const NS = 'http://www.w3.org/2000/svg'
// classes the page's own CSS reaches (fight moves, ability effects, phase layers are display only): an animated element
// carrying one keeps its transform for that CSS; its own motion goes on a wrapper group inside it
const PAGE_REACHED = /(^|\s)(lg-(?!p1\b|p2\b|p3\b|p12\b|loop\b|in\b)[\w-]+|lgfa-[\w-]+|lgo-[\w-]+|lgs-[\w-]+|lgr-[\w-]+)/
// elements whose children are drawn (a wrapper group can go inside them)
const CONTAINERS = new Set(['g', 'a', 'switch'])
const attrs = (el) => Object.fromEntries([...el.attributes].map((a) => [a.name, a.value]))

function motionOf(el, svg) {
  const a = attrs(el)
  if (!a.path || a.keyPoints || a.values || a.from || a.to || a.by || (a.calcMode && a.calcMode !== 'paced') || el.querySelector('mpath')) return null
  const timing = timingOf(a)
  if (!timing) return null
  const rot = a.rotate || '0'
  const auto = rot === 'auto' || rot === 'auto-reverse'
  if (!auto && !Number.isFinite(Number(rot))) return null
  const p = document.createElementNS(NS, 'path')
  p.setAttribute('d', a.path)
  svg.appendChild(p)
  try {
    const len = p.getTotalLength()
    if (!(len > 0)) return null
    const n = motionSamples(len)
    const pts = []
    for (let i = 0; i < n; i++) {
      const l = (len * i) / (n - 1)
      const q = p.getPointAtLength(l)
      const e = Math.min(len, l + len * 1e-3), b = Math.max(0, l - len * 1e-3)
      const q1 = p.getPointAtLength(b), q2 = p.getPointAtLength(e)
      let angle = auto ? (Math.atan2(q2.y - q1.y, q2.x - q1.x) * 180) / Math.PI : Number(rot)
      if (rot === 'auto-reverse') angle += 180
      pts.push({ x: q.x, y: q.y, angle })
    }
    const frames = motionFrames(pts, auto || Number(rot) !== 0)
    return frames ? { frames, timing } : null
  } catch { return null } finally { p.remove() }
}

// the transform reference of an element, for a wrapper that must turn about the same point
// (the DECLARED values first: "center" of a fill box stays the centre of the wrapper's own box, where a computed px
// value would pin the centre the box had at that moment)
function copyOrigin(from, to) {
  const cs = getComputedStyle(from)
  const box = from.style.transformBox || (cs.transformBox !== 'view-box' ? cs.transformBox : '')
  const origin = from.style.transformOrigin || (cs.transformOrigin !== '0px 0px' ? cs.transformOrigin : '')
  if (box) to.style.transformBox = box
  if (origin) to.style.transformOrigin = origin
}

// A SMIL `begin` is kept OUT of the Web Animation (`a.__lgDelay`, its clock shifted by it): until then the animation is
// not running at all (NOT BEGUN YET in compositeMotion), once begun it runs from the drawing's exact time.
const startAt = (a, ms) => { a.currentTime = ms - (a.__lgDelay || 0) }
const animate = (el, layer) => {
  const { delay = 0, ...timing } = layer.timing
  const a = el.animate(layer.frames, { ...timing, delay: 0, composite: 'replace' })
  a.__lgDelay = delay
  return a
}

function resume(a) {
  if (a.playState !== 'paused') return
  const end = a.effect && a.effect.getComputedTiming().endTime
  if (Number.isFinite(end) && a.currentTime >= end) return // a finished entrance stays on its last pose
  const t = a.currentTime
  a.play()
  if (t < 0) a.currentTime = t // (play() rewinds a time before 0 to 0: one not begun yet keeps waiting for its begin)
}

// THE ZOOM: Chromium composites a transform animation on an SVG element only when the element's effective CSS zoom is
// exactly 1 (CompositorAnimations: "transform related property cannot be accelerated on target"), and the app zooms the
// whole body (src/config/zoom.js, 1.35 by default). So the converted SVG takes the inverse zoom itself (it is sized by its
// box, so it still fills it at the same size) and the product is checked to be exactly 1: 1/1.7 and 1/1.15 land a float
// step off and composite nothing, so the value is nudged until the browser reports 1. Re-fit on every resize (the app
// zoom fires one; Ctrl and + changes it live).
const fitted = new Set()
const near = (x, ks) => { const f = new Float32Array(1), bits = new Int32Array(f.buffer); f[0] = x; const at = bits[0]; return ks.map((k) => { bits[0] = at + k; return f[0] }) }
const STEPS = [0, 1, -1, 2, -2, 3, -3, 4, -4]
export function unzoom(svg) {
  if (!('currentCSSZoom' in svg)) return false
  const host = svg.parentElement && svg.parentElement.childElementCount === 1 && !(svg.parentElement instanceof SVGElement) ? svg.parentElement : null
  svg.style.zoom = ''
  if (host) host.style.zoom = ''
  const z = svg.currentCSSZoom
  if (!z || z === 1) return true
  for (const v of near(1 / z, STEPS)) { svg.style.zoom = String(v); if (svg.currentCSSZoom === 1) return true }
  // no single float does it (1.7: the products land on 0.99999994 and 1.0000001): the drawing's own holder takes the
  // inverse, the SVG the last float step
  if (host) {
    for (const h of near(1 / z, STEPS)) {
      host.style.zoom = String(h)
      svg.style.zoom = ''
      const e = svg.currentCSSZoom
      if (e === 1) return true
      for (const v of near(1 / e, STEPS)) { svg.style.zoom = String(v); if (svg.currentCSSZoom === 1) return true }
    }
    host.style.zoom = ''
  }
  svg.style.zoom = String(1 / z)
  return false
}
let resizeOn = false
function refitAll() {
  for (const svg of fitted) { if (!svg.isConnected) releaseMotion(svg); else unzoom(svg) }
}
// A drawing that left the page lets its animations go: an animation on a removed element still runs on the document's
// timeline and asks for a main-thread frame on every vsync (a few removed bosses kept the whole app at 400 frames a
// second of lifecycle work for nothing). LegendsArt calls this when its drawing is replaced or unmounted; every
// conversion also sweeps drawings that left without saying so.
export function releaseMotion(svg) {
  const c = svg && svg.__lgComposited
  if (!c || svg.isConnected) return // still in the page (a kept node): it keeps playing and stays fitted
  fitted.delete(svg)
  for (const a of c.anims) { try { a.cancel() } catch { /* gone */ } }
  if (svg.__lgMo) { svg.__lgMo.disconnect(); svg.__lgMo = null }
  c.anims.length = 0
}

// The time (ms) a composited drawing SHOWS: its first running animation's time on the drawing's clock, else the SVG's.
export function shownTime(svg) {
  const c = svg && svg.__lgComposited
  const a = c && c.anims.find((x) => x.playState !== 'idle' && !x.__lgYield && !x.__lgHidden && !x.__lgWait && x.currentTime != null)
  if (a) return a.currentTime + (a.__lgDelay || 0)
  try { return svg.getCurrentTime() * 1000 } catch { return null }
}
function syncClock(svg, P) {
  if (!svg.isConnected || (svg.__lgComposited && svg.__lgComposited.leftover)) return // leftover SMIL keeps its own clock
  const t = shownTime(svg)
  if (t == null || Math.abs(t - svg.getCurrentTime() * 1000) < 1) return
  try { P.setCurrentTime.call(svg, t / 1000) } catch { /* not an SVG document */ }
}

// Convert one drawing in place. Returns { anims, leftover } (leftover = SMIL elements it had to keep), or null.
export function compositeMotion(svg) {
  if (!svg || svg.__lgComposited) return svg ? svg.__lgComposited : null
  for (const old of fitted) if (!old.isConnected) releaseMotion(old)
  if (typeof svg.animate !== 'function' || typeof svg.getCurrentTime !== 'function') return null
  // PIXEL ART STAYS SMIL: the compositor moves a layer by resampling it, which blurs pixel-exact (crispEdges) edges at
  // every sub-pixel position (the arcade boss measured 2% of its pixels off); SMIL repaints them crisp each frame
  if (svg.getAttribute('shape-rendering') === 'crispEdges' || svg.querySelector('[shape-rendering="crispEdges"]')) {
    svg.__lgComposited = { anims: [], leftover: svg.querySelectorAll('animateTransform, animateMotion').length, crisp: true }
    return svg.__lgComposited
  }
  const smil = [...svg.querySelectorAll('animateTransform, animateMotion')]
  const byTarget = new Map()
  for (const s of smil) {
    if (s.hasAttribute('href') || s.hasAttribute('xlink:href') || !s.parentElement) continue
    const t = s.parentElement
    if (!byTarget.has(t)) byTarget.set(t, { transforms: [], motions: [] })
    byTarget.get(t)[s.tagName === 'animateMotion' ? 'motions' : 'transforms'].push(s)
  }
  const plans = []
  for (const [t, { transforms, motions }] of byTarget) {
    if (motions.length > 1) continue
    const motion = motions.length ? motionOf(motions[0], svg) : null
    if (motions.length && !motion) continue
    // an element the page's CSS reaches keeps its own transform attribute (the page may animate it); its motion goes
    // on wrappers inside it, so its transform must be one the animations multiply onto (all additive, no motion)
    const wrap = PAGE_REACHED.test(t.getAttribute('class') || '')
    const base = transformAttrCss(t.getAttribute('transform'))
    if (wrap && base && (motion || transforms.some((a) => a.getAttribute('additive') !== 'sum'))) continue
    // a SHAPE (circle, path...) cannot hold a wrapper: it moves into new groups that carry all its layers, its own
    // transform folded into them (only when the page's CSS does not need it on the shape itself)
    const shape = !CONTAINERS.has(t.localName)
    if (shape && wrap && base) continue
    const layers = planLayers(wrap ? '' : base, transforms.map(attrs), motion)
    if (!layers || !layers.length) continue
    plans.push({ t, layers, wrap, shape, smil: [...transforms, ...motions] })
  }
  const time = svg.getCurrentTime() * 1000
  const paused = svg.animationsPaused()
  const anims = []
  const direct = new Map() // an original element carrying our animation itself -> its animations (it may have to yield)
  for (const { t, layers, wrap, shape, smil: own } of plans) {
    for (const s of own) s.remove()
    if (shape) {
      const holders = layers.map(() => { const g = document.createElementNS(NS, 'g'); g.setAttribute('data-lg-motion', ''); copyOrigin(t, g); return g })
      t.parentNode.insertBefore(holders[0], t)
      holders.forEach((g, i) => (i ? holders[i - 1].appendChild(g) : null))
      holders[holders.length - 1].appendChild(t)
      if (!wrap) t.removeAttribute('transform')
      layers.forEach((layer, i) => {
        if (layer.static) { holders[i].style.transform = layer.static; return }
        try { anims.push(animate(holders[i], layer)) } catch { /* a value this browser refuses: drawn still */ }
      })
      continue
    }
    let el = t
    layers.forEach((layer, i) => {
      if (i > 0 || wrap) {
        const g = document.createElementNS(NS, 'g')
        g.setAttribute('data-lg-motion', '')
        while (el.firstChild) g.appendChild(el.firstChild)
        el.appendChild(g)
        copyOrigin(t, g)
        el = g
      }
      // a static piece on the element itself is its own attribute already, unless it is a held pose (plan.js)
      if (layer.static) { if (el !== t || layer.held) el.style.transform = layer.static; return }
      try {
        const a = animate(el, layer)
        anims.push(a)
        if (el === t) direct.set(t, [...(direct.get(t) || []), a])
      } catch { /* a value this browser refuses: drawn still */ }
    })
  }
  for (const a of anims) if (time >= (a.__lgDelay || 0)) { startAt(a, time); if (paused) a.pause() }
  const P = Object.getPrototypeOf(svg)
  // a part stepped aside, not drawn or not begun yet holds no running animation at all
  const live = (a) => !a.__lgYield && !a.__lgHidden && !a.__lgWait
  // NOT BEGUN YET: an animation waiting for its SMIL `begin` asks for a main-thread frame on EVERY frame while it waits,
  // as a Web Animations delay or a negative time alike (measured: about 18 a second until the last part of a banner
  // began 7 s in; half the Legends banners and the ophanim failed check-smooth's frames check). So it is taken off
  // (cancelled: the element shows its own transform, exactly what SMIL shows before a begin) and one timer per drawing
  // brings it in at its begin, at the drawing's exact time. Pausing stops the timer; a seek or unpause re-plans.
  let wake = 0
  const begin = () => {
    clearTimeout(wake); wake = 0
    const t = svg.getCurrentTime() * 1000, still = svg.animationsPaused()
    let next = Infinity
    for (const a of anims) {
      const d = a.__lgDelay || 0
      if (t < d) { if (!a.__lgWait) { a.__lgWait = true; a.cancel() } next = Math.min(next, d); continue }
      if (!a.__lgWait) continue
      a.__lgWait = false
      if (!live(a)) continue
      startAt(a, t)
      if (still) a.pause(); else resume(a)
    }
    if (!still && next < Infinity && svg.isConnected) wake = setTimeout(begin, Math.max(0, next - t) + 1)
  }
  begin()
  // THE CLOCK FOLLOWS THE SCREEN: a Web Animation starts only once the compositor takes it, which while the page loads is
  // a frame or a few hundred ms after it was asked; the SVG's own clock ran on meanwhile. Every re-sync (a part beginning
  // late, a part shown again, a baked rig or phase swapping in) read that clock, so the parts jumped ahead by the gap
  // (the owner: "when animations start they bug out and jump a little but then fix themselves", only while loading;
  // measured 70 ms on a quiet load). Once the first animation runs, the SVG's clock is set to the time it shows.
  // (synced below, once hidden parts are taken off)
  svg.pauseAnimations = function pauseAnimations() { P.pauseAnimations.call(this); clearTimeout(wake); wake = 0; for (const a of anims) if (live(a)) a.pause() }
  svg.unpauseAnimations = function unpauseAnimations() { P.unpauseAnimations.call(this); for (const a of anims) if (live(a)) resume(a); begin(); if (this.__lgArmSync) this.__lgArmSync() }
  svg.setCurrentTime = function setCurrentTime(s) { P.setCurrentTime.call(this, s); for (const a of anims) if (live(a)) startAt(a, s * 1000); begin(); if (this.__lgArmSync) this.__lgArmSync() }
  // HIDDEN PARTS REST: an animation on an element that is not drawn (display none: an ability layer before its effect,
  // the Hydra's missing heads) never gets a start time and asks for a MAIN-thread frame on every frame while it waits
  // (the Hydra kept the page at 60 to 190 lifecycles a second). So such animations are taken off (cancelled) and rejoin
  // the drawing's time the moment their part shows. What shows a part is the page's CSS reacting to an attribute on the
  // arena or one of the drawing's holders (data-ab-*, data-fx, data-phase...), so those elements' attribute changes
  // (a handful of nodes, nothing while the fight is still) trigger the look.
  if (anims.length) {
    const byEl = new Map()
    for (const a of anims) { const el = a.effect && a.effect.target; if (el) byEl.set(el, [...(byEl.get(el) || []), a]) }
    const drawn = (el) => { for (let e = el; e && e !== svg; e = e.parentElement) if (getComputedStyle(e).display === 'none') return false; return true }
    const look = () => {
      if (!svg.isConnected) return
      for (const [el, own] of byEl) {
        const shown = drawn(el)
        for (const a of own) {
          if (!shown && !a.__lgHidden) { if (live(a)) a.cancel(); a.__lgHidden = true } else if (shown && a.__lgHidden) {
            a.__lgHidden = false
            if (!live(a)) continue
            startAt(a, svg.getCurrentTime() * 1000)
            if (!svg.animationsPaused()) resume(a)
          }
        }
      }
    }
    look()
    if (typeof MutationObserver === 'function') {
      const mo = new MutationObserver(look)
      for (let e = svg; e && e !== document.body; e = e.parentElement) mo.observe(e, { attributes: true })
      svg.__lgMo = mo
    }
  }
  // THE PAGE'S CSS WINS, as it did over SMIL: a fight move, an ability effect or a held knockout pose animating an
  // element's transform with CSS (`.lgfa-vampire-orbit > g`, the parts each boss's moments move) used to override the
  // SMIL on it; a script animation would override the CSS instead (and two animations on one element leave the
  // compositor). So while a CSS animation moves the element, ours steps aside, and comes back in step afterwards.
  if (direct.size) {
    const cssMoves = (el) => el.getAnimations().some((a) => a.animationName && a.effect && a.effect.getComputedTiming().progress !== null
      && a.effect.getKeyframes().some((k) => k.transform != null))
    const settle = (el) => {
      const own = direct.get(el)
      if (!own) return
      const busy = cssMoves(el)
      for (const a of own) {
        if (busy && !a.__lgYield) { a.__lgYield = true; a.cancel() } else if (!busy && a.__lgYield) {
          a.__lgYield = false
          startAt(a, svg.getCurrentTime() * 1000)
          if (a.__lgHidden || a.__lgWait) a.cancel(); else if (!svg.animationsPaused()) resume(a) // (resume: a finished entrance stays finished)
        }
      }
    }
    // a finished CSS animation taken off by a class or attribute change fires no event: while anything has stepped
    // aside, look again twice a second (nothing runs when nothing has)
    let timer = 0
    const recheck = () => {
      timer = 0
      if (!svg.isConnected) return
      for (const [el, own] of direct) if (own.some((a) => a.__lgYield)) settle(el)
      if ([...direct.values()].some((own) => own.some((a) => a.__lgYield))) timer = setTimeout(recheck, 500)
    }
    const settleAll = (el) => { settle(el); if (!timer && direct.get(el)?.some((a) => a.__lgYield)) timer = setTimeout(recheck, 500) }
    for (const el of direct.keys()) settleAll(el)
    const on = (e) => settleAll(e.target)
    for (const type of ['animationstart', 'animationend', 'animationcancel']) svg.addEventListener(type, on)
  }
  // (the lead is a part that is drawn and running: one cancelled for being hidden never becomes ready)
  // Every play or seek starts the animations again (pending until the compositor takes them), so each one re-arms it.
  const armSync = () => {
    const lead = anims.find((a) => live(a) && !(a.__lgDelay > 0) && a.playState !== 'idle')
    if (lead && lead.ready) lead.ready.then(() => { syncClock(svg, P) }, () => {})
  }
  armSync()
  svg.__lgArmSync = armSync
  unzoom(svg)
  fitted.add(svg)
  {
    if (!resizeOn && typeof window !== 'undefined') { resizeOn = true; window.addEventListener('resize', refitAll) }
  }
  const leftover = svg.querySelectorAll('animateTransform, animateMotion').length
  svg.__lgComposited = { anims, leftover }
  return svg.__lgComposited
}
