// STILL SNAPSHOT markup (pure, tested): an art FILE turned into a standalone still SVG for an <img>, by string edits
// only (no parse, no sanitize: an SVG shown as an image runs no script and loads nothing, so the page-side sanitizer is
// not needed, and parsing a 1 MB file per tile was most of the cost). Animations are dropped (an image would play them
// from their FIRST frame; the file's own attributes are the finished pose), the root gets the bitmap's pixel size, the
// page's preserveAspectRatio and, for a figure, a viewBox widened by its headroom; var()s are resolved from the box.
import { resolveVars } from '../bakePlan'

const ANIM_SELF = /<(animateTransform|animateMotion|animate|set)\b[^>]*\/>/g
const ANIM_PAIR = /<(animateTransform|animateMotion|animate|set)\b[^>]*>[\s\S]*?<\/\1\s*>/g

export function stillImageSvg(text, { width, height, grow = 0, lookup = () => '' } = {}) {
  if (!text || !/<svg[\s>]/i.test(text)) return ''
  let out = text.replace(ANIM_SELF, '').replace(ANIM_PAIR, '')
  out = out.replace(/<svg\b([^>]*)>/i, (m, attrs) => {
    let a = attrs.replace(/\s(width|height|preserveAspectRatio|overflow)\s*=\s*"[^"]*"/gi, '')
    if (grow) {
      a = a.replace(/\sviewBox\s*=\s*"\s*([-\d.eE]+)[\s,]+([-\d.eE]+)[\s,]+([-\d.eE]+)[\s,]+([-\d.eE]+)\s*"/, (v, x, y, w, h) => {
        const dx = +w * grow, dy = +h * grow
        return ` viewBox="${+x - dx} ${+y - dy} ${+w + 2 * dx} ${+h + 2 * dy}"`
      })
    }
    return `<svg${a} width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" overflow="visible">`
  })
  return resolveVars(out, lookup)
}
