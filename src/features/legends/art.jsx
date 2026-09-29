// Legends art: hand-made SVG FILES shipped with the app (public/assets/legends/), never generated per user.
//   areas/<motif>.svg   the banner of an area (400 x 140)
//   bosses/<motif>.svg  the boss of an area (120 x 120)
// One file per motif (map.js MOTIFS). A file colors itself with the variables below, set here from the area's
// palette and the app theme, so one drawing fits every area and both light and dark mode; a variable the app does
// not set (or a file opened on its own) uses the fallback written in the file: var(--lg-far, #9fd4ad).
//   --lg-sky --lg-far --lg-near --lg-deep --lg-accent --lg-light
// The files are inlined (an <img> could not see the theme's variables) through the app's one sanitizer, loaded
// lazily (it needs a DOM). Edit or replace a file to change the art; public/assets/legends/README.md says how.
import { useEffect, useState } from 'react'
import { RADIUS } from '../../config/tokens'
import { MOTIFS } from './map'

export const ART_BASE = '/assets/legends'
export const BANNER = { w: 400, h: 140 }
export const artUrl = (kind, motif) => `${ART_BASE}/${kind}/${MOTIFS.includes(motif) ? motif : MOTIFS[0]}.svg`

const mix = (token, pct, base = 'var(--c-surface)') => `color-mix(in srgb, ${token} ${pct}%, ${base})`

// palette → the two theme colors it is built from
const BASE = {
  brand: ['var(--c-brand)', 'var(--c-warning)'], ocean: ['var(--c-info)', 'var(--c-teal)'], forest: ['var(--c-success)', 'var(--c-warning)'],
  sunset: ['var(--c-warning)', 'var(--c-brand)'], night: ['var(--c-purple)', 'var(--c-info)'], sand: ['var(--c-warning)', 'var(--c-teal)'],
  candy: ['var(--c-purple)', 'var(--c-brand)'], steel: ['var(--c-ink-dim)', 'var(--c-info)'],
}
export function paletteColors(name) {
  const [main, accent] = BASE[name] || BASE.brand
  return { sky: mix(main, 14), far: mix(main, 38), near: mix(main, 70), deep: main, accent, light: 'var(--c-surface)' }
}
export const artVars = (palette) => {
  const c = paletteColors(palette)
  return { '--lg-sky': c.sky, '--lg-far': c.far, '--lg-near': c.near, '--lg-deep': c.deep, '--lg-accent': c.accent, '--lg-light': c.light }
}

// url → sanitized markup ('' = unusable), shared by every banner on the map.
const cache = new Map()
function loadArt(url) {
  if (!cache.has(url)) {
    cache.set(url, Promise.all([fetch(url).then((r) => (r.ok ? r.text() : '')), import('../../components/Markdown')])
      .then(([text, m]) => {
        const out = text ? m.sanitizeHtml(text, { USE_PROFILES: { svg: true } }) : ''
        return /<svg[\s>]/i.test(out) ? out.replace(/<svg\b/i, '<svg preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-hidden="true"') : ''
      })
      .catch(() => { cache.delete(url); return '' })) // a failed fetch is tried again next time
  }
  return cache.get(url)
}

// One art file, colored for `palette`. While it loads (or if it is missing) the frame shows the palette's sky.
export function LegendsArt({ kind, motif, palette, height, width = '100%', locked = false, round = RADIUS.lg, style }) {
  const url = artUrl(kind, motif)
  const [html, setHtml] = useState({ url: '', svg: '' })
  useEffect(() => {
    let live = true
    loadArt(url).then((svg) => { if (live) setHtml({ url, svg }) })
    return () => { live = false }
  }, [url])
  const svg = html.url === url ? html.svg : ''
  return (
    <div style={{
      width, height, borderRadius: round, overflow: 'hidden', flexShrink: 0, ...artVars(palette),
      background: kind === 'areas' ? 'var(--lg-sky)' : 'transparent', filter: locked ? 'grayscale(1) opacity(.55)' : 'none', ...style,
    }}>
      {svg && <div style={{ width: '100%', height: '100%' }} dangerouslySetInnerHTML={{ __html: svg }} />}
    </div>
  )
}

export const AreaArt = ({ area, height = 120, locked = false, style }) => (
  <LegendsArt kind="areas" motif={area?.motif} palette={area?.palette} height={height} locked={locked} style={style} />
)
export const BossArt = ({ area, size = 64, locked = false, style }) => (
  <LegendsArt kind="bosses" motif={area?.motif} palette={area?.palette} height={size} width={size} round={0} locked={locked} style={style} />
)
