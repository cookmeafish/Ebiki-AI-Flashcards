// Every Legends drawing's SMIL motion EASES where it turns (pure; art.jsx loadArt runs it on the sanitized markup).
// The owner, 2026-10-11: idle motion on many bosses was "so subtle and choppy and little that it looks like the svg
// is glitching up and down", the Seraph's breath "so choppy and low frame rate that it looks buggy". The sanitizer
// drops calcMode, so every animateTransform played LINEARLY: a breath (0 → -1.4 → 0) ran at a constant speed and
// reversed in a single frame, a sway hit its end like a wall, a hold-then-twitch started at full speed. A bob or sway
// whose velocity jumps reads as a stutter, the slower and smaller the worse. So here, after sanitizing (our own fixed
// strings, never file text), each animateTransform gets calcMode="spline" with one keySpline per segment, chosen so the
// SPEED is continuous: zero at a turning point (a segment leaving one starts from rest, one reaching it comes to rest),
// and where the motion carries on through a keyframe at a new pace, one shared speed on both sides (a cubic Hermite
// in time); evenly paced runs (a sampled path, a spin, a fall) stay linear. A turning point = a keyframe where the
// motion reverses or holds (the direction between the segments before and after it is 90 degrees or more, or one of
// them does not move), plus a loop's ends when the loop closes on itself and turns there, and a one-shot's ends (an
// entrance starts and lands at rest). Values and keyTimes are untouched, so every pose (frame 0 = the file's rest
// pose, an entrance's last frame, the extremes the checks measure) is exactly what the file says; only the speed
// between them changes. A step (two keyframes a hair apart, a part parked off canvas) stays a step.
const LINEAR = '0 0 1 1'

const nums = (v) => v.trim().split(/[\s,]+/).filter(Boolean).map(Number)
const sub = (a, b) => a.map((x, i) => x - (b[i] || 0))
const still = (d) => d.every((x) => Math.abs(x) < 1e-9)
const dot = (a, b) => a.reduce((s, x, i) => s + x * (b[i] || 0), 0)
// does the motion turn (reverse or hold) between segment d1 and the next, d2?
const turns = (d1, d2) => still(d1) || still(d2) || dot(d1, d2) <= 0

// the keySplines for one animateTransform's values (list of number lists) and keyTimes; closed = the loop repeats.
// A STEP (a segment shorter than STEP of the loop that moves: a part jumping back to the start of its path, parked off
// canvas) is instant whatever its spline, and never makes a turn: the motion on either side of it is compared instead
// (a coin flying up the same way before and after its jump back keeps its even speed).
const STEP = 0.01
export function splinesFor(values, closed, keyTimes) {
  const n = values.length
  if (n < 2) return null
  const kt = keyTimes && keyTimes.length === n ? keyTimes : values.map((_, i) => i / (n - 1))
  const seg = values.slice(1).map((v, i) => sub(v, values[i]))
  const step = seg.map((d, i) => kt[i + 1] - kt[i] < STEP && !still(d))
  const before = (j) => { let a = j - 1; while (a >= 0 && step[a]) a--; return a }   // the last real segment ending at or before keyframe j
  const after = (j) => { let b = j; while (b < n - 1 && step[b]) b++; return b < n - 1 ? b : -1 } // the first real one from j on
  const loops = closed && still(sub(values[n - 1], values[0]))
  const turn = new Array(n).fill(false)
  for (let j = 0; j < n; j++) {
    let a = before(j), b = after(j)
    if (a < 0 || b < 0) {
      if (!closed) { turn[j] = true; continue }   // a one-shot starts and lands at rest
      if (!loops) continue                         // a spin or an open path wraps: no turn at its ends
      if (a < 0) a = before(n - 1)                 // a closed loop: its end meets its start
      if (b < 0) b = after(0)
      if (a < 0 || b < 0) { turn[j] = true; continue }
    }
    turn[j] = turns(seg[a], seg[b])
  }
  // the speed AT each keyframe: 0 at a turn; elsewhere the harmonic mean of the speeds of the real segments either
  // side (never above twice the slower one, so the curve stays inside the segment: no overshoot), so a sway passing
  // its centre at a new pace changes speed smoothly instead of in one frame
  const len = seg.map((d) => Math.hypot(...d))
  const speed = seg.map((d, i) => (step[i] || kt[i + 1] <= kt[i] ? 0 : len[i] / (kt[i + 1] - kt[i])))
  const v = turn.map((t, j) => {
    if (t) return 0
    let a = before(j), b = after(j)
    if (a < 0) a = before(n - 1)
    if (b < 0) b = after(0)
    if (a < 0 || b < 0 || !speed[a] || !speed[b]) return 0
    return (2 * speed[a] * speed[b]) / (speed[a] + speed[b])
  })
  const f = (x) => +Math.min(1, Math.max(0, x)).toFixed(3)
  return seg.map((_, i) => {
    if (step[i] || !speed[i]) return LINEAR
    const y1 = f(v[i] / (3 * speed[i])), y2 = f(1 - v[i + 1] / (3 * speed[i]))
    if (Math.abs(y1 - 1 / 3) < 0.01 && Math.abs(y2 - 2 / 3) < 0.01) return LINEAR
    return `0.333 ${y1} 0.667 ${y2}`
  })
}

const attr = (tag, name) => { const m = new RegExp(`\\s${name}="([^"]*)"`).exec(tag); return m ? m[1] : null }

// An ENTRANCE (lg-in) keeps its beats LINEAR: an overshoot that slams in must arrive at full speed (eased at every
// turn, impacts went soft). Only its very first start and its final settle ease: the first moving segment leaves from
// rest, the last one comes to rest on the file's pose.
export function entranceSplines(values, keyTimes) {
  const n = values.length
  if (n < 2) return null
  const kt = keyTimes && keyTimes.length === n ? keyTimes : values.map((_, i) => i / (n - 1))
  const moves = values.slice(1).map((v, i) => !still(sub(v, values[i])) && kt[i + 1] - kt[i] >= STEP)
  const first = moves.indexOf(true), last = moves.lastIndexOf(true)
  if (first < 0) return null
  return moves.map((m, i) => {
    if (!m) return LINEAR
    const y1 = i === first ? 0 : 1 / 3, y2 = i === last ? 1 : 2 / 3
    return y1 === 1 / 3 && y2 === 2 / 3 ? LINEAR : `0.333 ${+y1.toFixed(3)} 0.667 ${+y2.toFixed(3)}`
  })
}

// a list attribute split on ";", a trailing ";" (allowed by SMIL) dropped
const list = (s) => s.trim().replace(/;\s*$/, '').split(';')

// The markup with every animateTransform eased at its turns (a tag that already has a calcMode is left alone).
export function easeTurns(svg) {
  if (!svg || !svg.includes('<animateTransform')) return svg
  return svg.replace(/<animateTransform\b[^>]*>/g, (tag) => {
    if (/\scalcMode=/.test(tag)) return tag
    const v = attr(tag, 'values')
    if (!v) return tag
    const values = list(v).map(nums)
    if (values.length < 2 || values.some((x) => !x.length || x.some((n) => !Number.isFinite(n)))) return tag
    const closed = attr(tag, 'repeatCount') === 'indefinite'
    const ktRaw = attr(tag, 'keyTimes')
    const kts = ktRaw == null ? null : list(ktRaw).map(Number)
    if (kts && (kts.length !== values.length || kts.some((x) => !Number.isFinite(x)))) return tag // a mismatched file the browser drops anyway
    const entrance = /\sclass="[^"]*\blg-in\b/.test(tag) && !closed
    const splines = entrance ? entranceSplines(values, kts) : splinesFor(values, closed, kts)
    if (!splines || splines.every((s) => s === LINEAR)) return tag
    let add = ` calcMode="spline" keySplines="${splines.join(';')}"`
    if (ktRaw == null) add += ` keyTimes="${values.map((_, i) => +(i / (values.length - 1)).toFixed(4)).join(';')}"`
    return tag.replace(/<animateTransform\b/, `<animateTransform${add}`)
  })
}
