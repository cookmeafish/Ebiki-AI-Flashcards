// THE LABEL FIT: every word a raid fight writes on the boss box (a strike moment's "HEAVY BLOW!", the knockout stamp, a
// power's cast and proc labels) is sized to the box, so it shows WHOLE at every arena size and in every language. At a
// fixed 20 px "HEAVY BLOW!" was wider than the compact arena (68 px) and its clip, so it read "EAVY BLOW" on every boss.
// Pure: a font-size in container units of the label's layer (cqw = the boss box width), capped at the old fixed size
// (a normal arena looks the same) and floored at a readable size. The labels sit OUTSIDE their layer's clip, so even a
// label at the floor is never cut, only a little wider than the room.

// The room a label may take: the boss box plus its headroom on each side (art.jsx HEADROOM_SHARE, 20%), so it stays over
// the boss's own column and never runs over the info beside it.
export const LABEL_ROOM = 1.4
// The smallest size a label shrinks to (CSS px, before the app zoom).
export const LABEL_MIN_PX = 10

// Widths in em of the display font (Baloo 2, weight 900, uppercase), measured in Chromium and rounded UP so the
// estimate is never narrower than the real text: CJK and full-width forms are one em, wide capitals (M, W) and emoji
// wider, narrow ones (I, 1, punctuation, spaces) narrower.
const WIDE_CJK = /[\u1100-\u115f\u2e80-\ua4cf\uac00-\ud7a3\uf900-\ufaff\ufe30-\ufe4f\uff00-\uff60\uffe0-\uffe6]/u
const EMOJI = /\p{Extended_Pictographic}/u
const charEm = (ch) => {
  if (WIDE_CJK.test(ch)) return 1.02
  if (EMOJI.test(ch)) return 1.1
  if (/[\uFE0F\u200D]/u.test(ch)) return 0 // a variation selector or joiner adds no width
  if (/[MW@%]/.test(ch)) return 0.88
  if (/[IJ1il|!¡.,:;'"]/.test(ch)) return 0.34
  if (/\s/.test(ch)) return 0.3
  if (/[a-z]/.test(ch)) return 0.56
  return 0.66
}

// The estimated width of `text` in em at a letter spacing of `spacing` em (every character carries it).
export function labelEm(text, spacing = 0.04) {
  const chars = [...String(text ?? '')]
  // plus 0.1 em: the outline (WebkitTextStroke) reaches past the first and last letter.
  return chars.reduce((n, ch) => n + charEm(ch) + (charEm(ch) > 0 ? spacing : 0), 0.1)
}

const r2 = (n) => Math.round(n * 100) / 100

// The font-size (a CSS string) that keeps `text` inside `room` x the box width at its animation's largest settled scale
// (`peak`). `maxPx` = the size on a normal arena; `minPx` = the floor. `pad` = horizontal padding + border the label
// box adds: `{ cqw, px }` per side summed (the knockout stamp's plate). `cap` = an extra cqw cap (the stamp: 13cqw);
// `capH` = a cap in cqh, the box HEIGHT (the strike label: its rise must stay inside the arena card).
// `floorPx` = a label's own floor above `minPx` that gives way only where the fit needs less (the stamp kept 12 px).
export function labelFontSize(text, { maxPx, minPx = LABEL_MIN_PX, floorPx = null, peak = 1, room = LABEL_ROOM, spacing = 0.04, pad = null, cap = null, capH = null } = {}) {
  const em = Math.max(1, labelEm(text, spacing))
  const roomCqw = (room * 100) / peak - (pad?.cqw || 0)
  const fit = pad?.px ? `calc((${r2(roomCqw)}cqw - ${r2(pad.px)}px) / ${r2(em)})` : `${r2(roomCqw / em)}cqw`
  const caps = [cap && `${r2(cap)}cqw`, capH && `${r2(capH)}cqh`].filter(Boolean)
  const size = caps.length ? `min(${caps.join(", ")}, ${fit})` : fit
  const low = floorPx > minPx ? `max(${minPx}px, min(${floorPx}px, ${fit}))` : `${minPx}px`
  return `clamp(${low}, ${size}, ${maxPx}px)`
}

// The same fit as a number (px) for a box `boxPx` wide: what the CSS above resolves to (tests, and anything sized in px).
export function labelFontPx(text, boxPx, { maxPx, minPx = LABEL_MIN_PX, floorPx = null, peak = 1, room = LABEL_ROOM, spacing = 0.04, pad = null, cap = null, capH = null } = {}) {
  const em = Math.max(1, labelEm(text, spacing))
  const roomPx = (boxPx * room) / peak - ((pad?.cqw || 0) * boxPx) / 100 - (pad?.px || 0)
  const fit = roomPx / em
  // boss boxes are square: cqh = cqw
  const px = Math.min(fit, cap ? (cap * boxPx) / 100 : Infinity, capH ? (capH * boxPx) / 100 : Infinity)
  const low = floorPx > minPx ? Math.max(minPx, Math.min(floorPx, fit)) : minPx
  return Math.max(low, Math.min(px, maxPx)) // CSS clamp(): max(floor, min(value, max))
}

// A label that may WRAP at the floor (the power casts and hits, low in the box with room under them): as wide as the
// room at its peak, then a second line. The tighter line height keeps two lines inside the box; LABEL_HALF_LEADING
// (em) is what the tighter line moves the first line up by (Baloo 2's own line is about 1.56 em), so a caller adds it
// to its top and a one-line label sits exactly where it did.
export const LABEL_LINE = 1.1
export const LABEL_HALF_LEADING = 0.23
// Only text with a word gap gets the cap: an unbreakable label (CJK under keep-all, one long word) capped narrower than
// itself would overflow to the RIGHT of its centered box; uncapped it stays centered.
export const labelMaxWidth = ({ peak = 1, room = LABEL_ROOM } = {}, text = ' ') => (/\s/.test(String(text)) ? `${r2((room * 100) / peak)}cqw` : undefined)

// THE ABILITY FLOATER FIT (BossArena: "-5 Bound!", "-4 Encore!" over the boss). It pops to 1.25x and rises 14 px
// (fx/_juice.js lgJuicePop), may wrap, and sat at 90% of the box at up to 26 px: two lines stood far above the arena
// card ("Bound!" 7 px out on Cerberus, "-4 アンコール！" 51 px out on the Showman, CJK broken into one letter a line).
// Now it is sized and placed in px for its box: as wide as the box and its headroom at the pop's peak, every word on
// one line where it can be (a smaller size first), its top at its highest inside the card (the box's headroom), and
// its bottom over the boss's head. It used to come down (to 62% of the box) before it got smaller: on the compact arena
// "Wail!" sat across the Banshee's brows. Now the SIZE gives way first, down to the floor, and its rise is in em
// (lgFloaterPop below: a fixed 14 px rise was most of the compact headroom); it comes lower, over the face, only when
// even the smallest size needs it (two lines at the floor on the compact arena).
export const FLOATER = {
  peak: 1.25, // lgFloaterPop 24%
  line: 1.05, // its line height
  rise: 0.5, // em it has risen while still at least half visible (lgFloaterPop ~86%)
  peakRise: 0.2, // em risen at the peak scale
  bottom: 0.9, // where it sits: its bottom at 90% of the box, over the head
  minPx: 10, // 13.5 px on screen at the default zoom; only the compact arena gets this small
  lowest: 0.77, // the lowest its bottom comes (two lines at the floor on the compact arena): below, it shows its first sentence
  margin: 1, // px kept inside the card's top edge
}
// The floater's pop (BossArena's ability floater): lgJuicePop's shape with the rise in em, so a small floater rises
// little and keeps above the head.
export const FLOATER_POP_CSS = `@keyframes lgFloaterPop { 0% { transform: translateX(-50%) translateY(0) scale(0); opacity: 0 } 8% { opacity: 1 } 24% { transform: translateX(-50%) translateY(-${FLOATER.peakRise}em) scale(${FLOATER.peak}) } 30% { transform: translateX(-50%) translateY(-0.27em) scale(1) } 72% { opacity: 1 } 100% { transform: translateX(-50%) translateY(-0.55em) scale(1); opacity: 0 } }`

// Lines `text` takes at `px` in `maxW` px: greedy at word gaps, a word never broken (the floater is `keep-all`:
// "-4 アンコール！" broke as "-4 アンコ / ール！").
// A break opportunity (a zero-width space) after full-width punctuation inside a floater: keep-all keeps CJK words
// whole, so "-3 狮头倒下！狮之心" ran one line far past the compact arena; it may now wrap after its "！".
export const floaterBreaks = (text) => String(text ?? '').replace(/([\u3001\u3002\uff01\uff0c\uff1f\uff1a\uff1b])(?=[^\s\u200b])/gu, '$1\u200b')
const floaterWords = (text) => floaterBreaks(text).split(/[\s\u200b]+/).filter(Boolean)

// A floater word's width in em: floaters are MIXED case, and the label table above is for capitals (a lowercase
// letter there is 0.56 em, measured 0.28 to 0.59 except m and w): with it a floater looked 17% wider than it is and two
// lines were planned where one fit, which brought it down over the face. Measured in Chromium (Baloo 2, 900), rounded
// up; capitals, CJK and the rest from the label table. Plus 0.1 em: the outline.
const FLOATER_LOWER = { a: 0.56, b: 0.6, c: 0.49, d: 0.6, e: 0.56, f: 0.44, g: 0.58, h: 0.6, i: 0.3, j: 0.3, k: 0.57, l: 0.3, m: 0.86, n: 0.6, o: 0.6, p: 0.6, q: 0.6, r: 0.42, s: 0.51, t: 0.41, u: 0.6, v: 0.57, w: 0.8, x: 0.54, y: 0.57, z: 0.5 }
const floaterCharEm = (ch) => {
  const base = ch.normalize('NFD')[0]
  if (FLOATER_LOWER[base] != null) return FLOATER_LOWER[base]
  if (/[0-9]/.test(ch)) return 0.63
  if (/[-'’]/.test(ch)) return 0.37
  if (/[!¡.,:;]/.test(ch)) return 0.31
  return charEm(ch)
}
export const floaterEm = (word) => [...String(word ?? '')].reduce((n, ch) => n + floaterCharEm(ch), 0.1)
// a space between words (measured 0.2 em)
const FLOATER_SPACE = 0.22

export function floaterLines(text, px, maxW) {
  const words = floaterWords(text)
  if (!words.length) return 1
  const space = FLOATER_SPACE * px // a ZWSP break counts like a space (a little more room than it takes)
  let lines = 1
  let used = 0
  for (const w of words) {
    const width = floaterEm(w) * px
    if (used && used + space + width <= maxW) { used += space + width; continue }
    if (used) { lines++; used = 0 }
    used = width
  }
  return lines
}

// The shorter forms of a floater, longest first: the text cut after each sentence it holds ("-3 Serpent falls!
// Serpent's Venom" → "-3 Serpent falls!", "-3 蛇が倒れた！蛇の毒" → "-3 蛇が倒れた！"). The first sentence carries the
// news (and the damage); the rest is its flourish.
export function floaterShorter(text) {
  const s = String(text ?? '')
  const out = []
  const re = /[!?.！？。](?=[\s​]*\S)/gu
  let m
  while ((m = re.exec(s))) out.push(s.slice(0, m.index + 1).trim())
  return out.filter((v) => /\p{L}/u.test(v.replace(/^-\d+\s*/, ''))).reverse()
}

// { fontSize, maxWidth, bottom, text } in px for a floater over a `boxPx` boss whose size would be `basePx`
// (fx/_juice.js floaterPxFor). `headPx` = the room above the box inside the card (art.jsx headroomPx). `text` = what to
// show: the whole floater, or, when even the floor size would bring it down over the face (below FLOATER.lowest of the
// box: the Chimera's "-3 Serpent falls! Serpent's Venom" in three lines on the compact arena), its first sentence.
export function floaterFit(text, boxPx, basePx, headPx = Math.round(boxPx * 0.2)) {
  const fit = fitOne(text, boxPx, basePx, headPx)
  if (fit.bottom >= FLOATER.lowest * boxPx) return fit
  for (const short of floaterShorter(text)) {
    const f = fitOne(short, boxPx, basePx, headPx)
    if (f.bottom >= FLOATER.lowest * boxPx) return f
  }
  return fit
}
function fitOne(text, boxPx, basePx, headPx) {
  const F = FLOATER
  const maxWidth = Math.floor((boxPx + 2 * headPx) / F.peak)
  const longest = Math.max(1, ...floaterWords(text).map(floaterEm))
  const place = (px) => {
    const h = floaterLines(text, px, maxWidth) * F.line * px
    const reach = Math.max(F.peak * h + F.peakRise * px, h + F.rise * px) // its top above its bottom, at its highest
    return Math.min(F.bottom * boxPx, boxPx + headPx - F.margin - reach)
  }
  // every word on one line where a size down to the floor allows it; then smaller until it sits over the head
  let px = Math.max(F.minPx, Math.min(basePx, Math.floor(maxWidth / longest)))
  while (px > F.minPx && place(px) < F.bottom * boxPx - 0.01) px--
  return { fontSize: px, maxWidth, bottom: Math.floor(Math.max(0, place(px)) * 10) / 10, text }
}
