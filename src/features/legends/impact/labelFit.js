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
// box adds: `{ cqw, px }` per side summed (the knockout stamp's plate). `cap` = an extra cqw cap (the stamp: 13cqw).
// `floorPx` = a label's own floor above `minPx` that gives way only where the fit needs less (the stamp kept 12 px).
export function labelFontSize(text, { maxPx, minPx = LABEL_MIN_PX, floorPx = null, peak = 1, room = LABEL_ROOM, spacing = 0.04, pad = null, cap = null } = {}) {
  const em = Math.max(1, labelEm(text, spacing))
  const roomCqw = (room * 100) / peak - (pad?.cqw || 0)
  const fit = pad?.px ? `calc((${r2(roomCqw)}cqw - ${r2(pad.px)}px) / ${r2(em)})` : `${r2(roomCqw / em)}cqw`
  const size = cap ? `min(${r2(cap)}cqw, ${fit})` : fit
  const low = floorPx > minPx ? `max(${minPx}px, min(${floorPx}px, ${fit}))` : `${minPx}px`
  return `clamp(${low}, ${size}, ${maxPx}px)`
}

// The same fit as a number (px) for a box `boxPx` wide: what the CSS above resolves to (tests, and anything sized in px).
export function labelFontPx(text, boxPx, { maxPx, minPx = LABEL_MIN_PX, floorPx = null, peak = 1, room = LABEL_ROOM, spacing = 0.04, pad = null, cap = null } = {}) {
  const em = Math.max(1, labelEm(text, spacing))
  const roomPx = (boxPx * room) / peak - ((pad?.cqw || 0) * boxPx) / 100 - (pad?.px || 0)
  const fit = roomPx / em
  const px = cap ? Math.min(fit, (cap * boxPx) / 100) : fit
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
