// Legends art: hand-made SVG FILES shipped with the app (public/assets/legends/), never generated per user.
//   areas/<motif>.svg   the banner of an area (400 x 140)
//   bosses/<motif>.svg  the boss of an area (120 x 120)
// One file per motif (map.js MOTIFS). A file colors itself with the variables below, set here from the area's
// palette and the app theme, so one drawing fits every area and both light and dark mode; a variable the app does
// not set (or a file opened on its own) uses the fallback written in the file: var(--lg-far, #9fd4ad).
//   --lg-sky --lg-far --lg-near --lg-deep --lg-accent --lg-light
// The files are inlined (an <img> could not see the theme's variables) through the app's one sanitizer, loaded
// lazily (it needs a DOM). Edit or replace a file to change the art; public/assets/legends/README.md says how.
// Motion is SVG animation inside the file (<animateTransform>/<animateMotion>; the sanitizer drops <animate>/<set>):
// class="lg-in" = the entrance (played once when the file appears), class="lg-loop" = idle life (breathing, fire,
// waves). `animated` picks what plays: 'intro' = both, 'idle' = loops only, false = none (the file's own attributes
// are its resting pose, so a still file shows the finished boss). Reduced motion always gets false.
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useFeatureCtx, featureCfg } from '../registry'
import { LEGENDS_ID } from './store'
import { RADIUS } from '../../config/tokens'
import { MOTIFS } from './map'
import { RAID_MOTIFS } from './raid'

export const ART_BASE = '/assets/legends'
export const BANNER = { w: 400, h: 140 }
// Raid bosses have their own list (raid.js); areas and bosses share the map's motifs.
export const artUrl = (kind, motif) => { const list = kind === 'raids' ? RAID_MOTIFS : MOTIFS; return `${ART_BASE}/${kind}/${list.includes(motif) ? motif : list[0]}.svg` }

const mix = (token, pct, base = 'var(--c-surface)') => `color-mix(in srgb, ${token} ${pct}%, ${base})`

// palette → [main color, accent], from theme colors (so both themes work). Every palette has its OWN main color: night
// and candy were both purple (sunset and sand both amber) and drew the same sky, hills and ground.
const tone = (a, pct, b) => `color-mix(in srgb, ${a} ${pct}%, ${b})`
const BASE = {
  brand: ['var(--c-brand)', 'var(--c-warning)'],
  ocean: ['var(--c-info)', 'var(--c-teal)'],
  forest: ['var(--c-success)', 'var(--c-warning)'],
  sunset: [tone('var(--c-warning)', 60, 'var(--c-brand)'), 'var(--c-purple)'],   // orange, a violet dusk
  night: [tone('var(--c-info)', 50, 'var(--c-purple)'), 'var(--c-warning)'],     // indigo, gold stars
  sand: [tone('var(--c-warning)', 55, 'var(--c-ink-dim)'), 'var(--c-teal)'],     // khaki, an oasis
  candy: [tone('var(--c-brand)', 55, 'var(--c-purple)'), 'var(--c-info)'],       // pink, sky blue sprinkles
  steel: [tone('var(--c-ink-dim)', 70, 'var(--c-info)'), 'var(--c-warning)'],    // blue grey, a warm light
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

const ANIM_TAGS = new Set(['animatetransform', 'animatemotion'])
export const reducedMotion = () => { try { return !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches } catch { return false } }
// The system's "reduce motion" (Windows: Animation effects off) stills every drawing. Two things override it: the
// Legends setting "Always animate the art" (features.legends.motion) and the asset view (ArtMotion), which is there
// to look at the motion. useArtMotionAlways() also lets BossArena keep its card entrances (the lg-motion class).
// The owner's "Still bosses" (features.legends.still, toggled on the fight screen and in Settings) stills them all
// for a learner who wants no distraction, and wins over "Always animate"; only the asset view ignores it.
export const ArtMotion = createContext(false)
export function useArtStill() {
  const forced = useContext(ArtMotion)
  const ctx = useFeatureCtx()
  return !forced && !!ctx && featureCfg(ctx, LEGENDS_ID).still === true
}
export function useArtMotionAlways() {
  const forced = useContext(ArtMotion)
  const ctx = useFeatureCtx()
  return forced || (!!ctx && featureCfg(ctx, LEGENDS_ID).motion === true && featureCfg(ctx, LEGENDS_ID).still !== true)
}
// Sanitized markup with only the motion `mode` allows (parsed inertly; nothing here runs the file).
export function withMotion(svg, mode) {
  if (!svg || mode === 'intro') return svg
  const doc = new DOMParser().parseFromString(svg, 'text/html')
  for (const n of [...doc.body.querySelectorAll('*')]) {
    if (!ANIM_TAGS.has(n.localName.toLowerCase())) continue
    if (mode === 'idle' && !n.classList.contains('lg-in')) continue
    n.remove()
  }
  return doc.body.innerHTML
}

// The asset viewer names every drawing: a tag UNDER it with its file ("areas/frontier.svg"), so a screenshot says
// which file to open (under, never on the art). ONLY the asset view (AssetView.jsx) and the dev gallery provide it.
export const ArtLabels = createContext(false)
const LABEL_MIN_PX = 100 // smaller drawings (map icons, the stage strip) are too small for a readable tag

// A boss (or raid boss) is a figure on a backdrop, not a picture with edges: a flame or a wing that grows past the
// 120 x 120 frame was sliced flat, a visible invisible box. So a figure may draw up to BOSS_HEADROOM past its frame
// (the SVG overflows, the box clips at that wider edge). Parts parked far off canvas to hide them (a translate of
// 200) stay hidden. Banners are pictures: they clip at their own edge.
export const HEADROOM_SHARE = 0.2
// The space a figure of `size` px may draw past its frame: give it as margin wherever text or controls sit next to one.
export const headroomPx = (size) => Math.round(size * HEADROOM_SHARE)
const BOSS_HEADROOM = `${HEADROOM_SHARE * 100}%`
const freeFigure = (svg) => svg.replace(/<svg\b/, '<svg overflow="visible"')

// One art file, colored for `palette`. While it loads (or if it is missing) the frame shows the palette's sky.
// `room`: a figure wrapped in its headroom as real space (margin on every side), for places where text, buttons or
// other drawings sit next to it. The asset view and gallery (ArtLabels) always give it.
export function LegendsArt({ kind, motif, palette, height, width = '100%', locked = false, round = RADIUS.lg, animated = false, style, room = false, roomed = false }) {
  const url = artUrl(kind, motif)
  const [html, setHtml] = useState({ url: '', svg: '' })
  useEffect(() => {
    let live = true
    loadArt(url).then((svg) => { if (live) setHtml({ url, svg }) })
    return () => { live = false }
  }, [url])
  const always = useArtMotionAlways()
  const still = useArtStill()
  const mode = locked || still || (!always && reducedMotion()) ? false : animated
  const raw = html.url === url ? html.svg : ''
  const figure = kind !== 'areas'
  const svg = useMemo(() => { const out = withMotion(raw, mode); return figure ? freeFigure(out) : out }, [raw, mode, figure])
  const labels = useContext(ArtLabels)
  const big = (typeof height !== 'number' || height >= LABEL_MIN_PX) && (typeof width !== 'number' || width >= LABEL_MIN_PX)
  const art = (
    <div style={{
      width: labels && big ? '100%' : width, height, borderRadius: round, flexShrink: 0, ...artVars(palette),
      ...(figure ? { overflow: 'visible', clipPath: `inset(-${BOSS_HEADROOM})` } : { overflow: 'hidden' }),
      background: figure ? 'transparent' : 'var(--lg-sky)', filter: locked ? 'grayscale(1) opacity(.55)' : 'none', ...style,
    }}>
      {svg && <div style={{ width: '100%', height: '100%' }} dangerouslySetInnerHTML={{ __html: svg }} />}
    </div>
  )
  // A figure keeps its headroom as real space on every side, so what it draws past its frame never runs under its
  // file tag, a caption, a button, a title or the next drawing.
  const size = Math.max(typeof height === 'number' ? height : 0, typeof width === 'number' ? width : 0)
  const pad = figure && size && (room || labels) ? headroomPx(size) : 0
  // `roomed`: the parent already keeps the headroom around a box of exactly this size (boss card, fight arena), so the
  // art stays in that box and the tag sits in the reserved space below it (padding again pushed the boss off center).
  if (labels && big && roomed) {
    return (
      <div style={{ position: 'relative', width, height, flexShrink: 0 }}>
        {art}
        <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: `calc(100% + ${Math.max(0, pad - 18)}px)`, padding: '1px 6px', borderRadius: 4,
          background: 'rgba(0,0,0,.72)', color: '#fff', font: '700 10px/1.4 monospace', textTransform: 'none', letterSpacing: 'normal', whiteSpace: 'nowrap' }}>
          {url.slice(ART_BASE.length + 1)}
        </span>
      </div>
    )
  }
  if (!labels || !big) return pad && !roomed ? <div style={{ padding: pad, flexShrink: 0, lineHeight: 0 }}>{art}</div> : art
  return (
    <div style={{ width: typeof width === 'number' ? width + pad * 2 : width, padding: pad, boxSizing: 'border-box', display: 'grid', gap: 4, justifyItems: 'start', flexShrink: 0 }}>
      {art}
      <span style={{ marginTop: pad, padding: '1px 6px', borderRadius: 4, background: 'rgba(0,0,0,.72)', color: '#fff',
        font: '700 10px/1.4 monospace', textTransform: 'none', letterSpacing: 'normal', whiteSpace: 'nowrap' }}>
        {url.slice(ART_BASE.length + 1)}
      </span>
    </div>
  )
}

export const AreaArt = ({ area, height = 120, width = '100%', locked = false, animated = 'idle', style }) => (
  <LegendsArt kind="areas" motif={area?.motif} palette={area?.palette} height={height} width={width} locked={locked} animated={animated} style={style} />
)
export const BossArt = ({ area, size = 64, locked = false, animated = false, style, room = false, roomed = false }) => (
  <LegendsArt kind="bosses" motif={area?.motif} palette={area?.palette} height={size} width={size} round={0} locked={locked} animated={animated} style={style} room={room} roomed={roomed} />
)
