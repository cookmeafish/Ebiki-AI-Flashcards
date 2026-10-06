// THE IMPACT GLYPHS (pure): one small shape per raid boss, flung by its hits, strikes and knockout (impact/styles.js
// names which). 24 x 24 viewBox paths, drawn with fill-rule evenodd; `inner` is a second path in the style's accent
// color (an eye's pupil, a skull's sockets). Plain shapes only: no gradients or URLs (the art rules), so they read at
// 10 to 40 px in both themes.

// A gear: `teeth` square teeth around a ring, a hole in the middle.
function gearPath(teeth = 8, r1 = 7.2, r2 = 10, hole = 3) {
  const pts = []
  for (let i = 0; i < teeth * 2; i++) {
    const a0 = (Math.PI * i) / teeth
    const r = i % 2 ? r1 : r2
    const half = (Math.PI / teeth) * 0.42
    pts.push([12 + r * Math.cos(a0 - half), 12 + r * Math.sin(a0 - half)], [12 + r * Math.cos(a0 + half), 12 + r * Math.sin(a0 + half)])
  }
  const outer = `M${pts.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join('L')}Z`
  return `${outer} M${12 + hole} 12a${hole} ${hole} 0 1 0 -${hole * 2} 0a${hole} ${hole} 0 1 0 ${hole * 2} 0Z`
}

export const GLYPHS = {
  gear: { d: gearPath() },
  note: { d: 'M9 18.5a3 3 0 1 1-2-2.8V4.6l12-2.4v12.9a3 3 0 1 1-2-2.8V6.2l-8 1.6Z' },
  feather: { d: 'M19 2C11 4 6 10 5.5 18.5L4 21l1.4.8 1.6-2.6C14 18 18.5 11 19 2Z', inner: 'M17.5 4.2 6.6 19.2l-.8-.5L16.8 3.7Z' },
  fist: { d: 'M6.5 9.5V6.8a1.6 1.6 0 0 1 3.2 0V5.6a1.6 1.6 0 0 1 3.2 0v.6a1.6 1.6 0 0 1 3.2 0v1a1.6 1.6 0 0 1 3.2 0v6.3c0 4.4-3.1 8.5-7.6 8.5h-1.6c-3 0-5.6-2.4-5.6-5.4v-3.2c0-.7.4-1.3 1-1.6Z' },
  bat: { d: 'M12 9.2c-.9-1.9-2.8-2.3-4-1.3C7 5.8 4.2 5.6 2 7.8c2 0 3.1 2 3.1 4.2 2-.8 4.1.3 5.1 2.2L12 16.4l1.8-2.2c1-1.9 3.1-3 5.1-2.2 0-2.2 1.1-4.2 3.1-4.2-2.2-2.2-5-2-6 .1-1.2-1-3.1-.6-4 1.3Z' },
  scale: { d: 'M12 1.8 20.6 12 12 22.2 3.4 12Z', inner: 'M12 6.2 16.9 12 12 17.8 7.1 12Z' },
  claw: { d: 'M4.6 2.5c4.2 5 5.3 11 3 18.6 3.8-6 4.2-12.4.3-18.6Z M10.7 1.8c4.4 5.6 5 11.8 2.6 19.6 3.9-6.3 4.3-13.2.3-19.6Z M16.8 2.8c3.8 4.8 4.6 10.2 2.6 16.8 3.4-5.5 3.7-11.3.3-16.8Z' },
  coin: { d: 'M12 2a10 10 0 1 0 .01 0Z M12 5.3a6.7 6.7 0 1 1-.01 0Z', inner: 'M11 7.5h2v9h-2Z' },
  card: { d: 'M6.5 2h11a2.3 2.3 0 0 1 2.3 2.3v15.4A2.3 2.3 0 0 1 17.5 22h-11a2.3 2.3 0 0 1-2.3-2.3V4.3A2.3 2.3 0 0 1 6.5 2Z', inner: 'M12 6.5c2.6 2.7 4.6 4.2 4.6 6.3 0 1.6-1.6 2.6-3.2 1.9l.9 2.8H9.7l.9-2.8c-1.6.7-3.2-.3-3.2-1.9 0-2.1 2-3.6 4.6-6.3Z' },
  wisp: { d: 'M12 22.2a6.2 6.2 0 0 1-6.2-6.2c0-5.8 7.6-7.6 3.8-14.2 6.4 2.8 8.6 8 8.6 14.2a6.2 6.2 0 0 1-6.2 6.2Z', inner: 'M10 14.5a1.2 1.6 0 1 0 .01 0Z M14 14.5a1.2 1.6 0 1 0 .01 0Z' },
  drop: { d: 'M12 1.8S4.8 10 4.8 15a7.2 7.2 0 0 0 14.4 0C19.2 10 12 1.8 12 1.8Z', inner: 'M9.2 14.5a2.2 3 0 0 0 1.4 3.6l.5-1.1a1.6 2 0 0 1-.8-2.5Z' },
  skull: { d: 'M12 2a8.2 8.2 0 0 0-8.2 8.2c0 2.9 1.2 5.1 3.2 6.3V21h10v-4.5c2-1.2 3.2-3.4 3.2-6.3A8.2 8.2 0 0 0 12 2Z', inner: 'M8.8 8.2a2 2.2 0 1 0 .01 0Z M15.2 8.2a2 2.2 0 1 0 .01 0Z M11 14h2l-1 2.2Z' },
  chain: { d: 'M7.5 6.5h9a5.5 5.5 0 0 1 0 11h-9a5.5 5.5 0 0 1 0-11Z M7.5 9.3a2.7 2.7 0 0 0 0 5.4h9a2.7 2.7 0 0 0 0-5.4Z' },
  bolt: { d: 'M13.6 1.5 3.8 14h7l-2.4 8.5L20.2 9.6h-7.1Z' },
  bubble: { d: 'M12 2.6a9.4 9.4 0 1 0 .01 0Z M12 4.6a7.4 7.4 0 1 1-.01 0Z', inner: 'M7.6 8.4a2.6 1.6 -40 1 0 .01 0Z' },
  axe: { d: 'M10.6 1.5h2.2v21h-2.2Z M12.8 3c5.4.2 8.7 3.6 8.7 8.4s-3.3 8.2-8.7 8.4c2-2.2 3-5 3-8.4S14.8 5.2 12.8 3Z' },
  flame: { d: 'M12 1.5c2.2 4.2 6.6 6.4 5.4 12.6.9-1.7 1-3.1.1-5 3.2 3.4 3.4 8.4.4 11.4-2.4 2.3-9.4 2.3-11.6 0-3.2-3.2-2.4-8.4.8-11.5.1 2 .9 3.3 2.1 4.4C8.5 9.5 10.6 5.4 12 1.5Z', inner: 'M12 11.5c1.5 2.3 3.2 3.6 2.6 6.2-.5 2.1-4.7 2.1-5.2 0-.5-2.4 1.4-3.6 2.6-6.2Z' },
  hex: { d: 'M12 1.6 21 6.8v10.4L12 22.4 3 17.2V6.8Z', inner: 'M12 6.2l5 2.9v5.8l-5 2.9-5-2.9V9.1Z' },
  crescent: { d: 'M15.2 1.8a10.2 10.2 0 1 0 7 17.6A8.1 8.1 0 0 1 15.2 1.8Z' },
  fang: { d: 'M5.2 2h13.6c-.6 7.4-3 14.2-6.8 20C8.2 16.2 5.8 9.4 5.2 2Z', inner: 'M8.4 4.4h7.2c-.6 4.4-1.8 8.2-3.6 11.6-1.8-3.4-3-7.2-3.6-11.6Z' },
  shard: { d: 'M12 1.5 18.4 9.6 12 22.5 5.6 9.6Z', inner: 'M12 1.5 18.4 9.6H5.6Z' },
  needle: { d: 'M11 1.5h2l1.2 16.5L12 22.5 9.8 18Z', inner: 'M11.4 3.4h1.2v3.4h-1.2Z' },
  candy: { d: 'M1.8 7.4l5.6 4.6-5.6 4.6Z M22.2 7.4 16.6 12l5.6 4.6Z M12 6.4a5.6 5.6 0 1 0 .01 0Z', inner: 'M9 9.2c1.8-.9 4.4-.9 6 0l-.9 1.4c-1.2-.6-3-.6-4.2 0Z M9 13.4c1.8.9 4.4.9 6 0l-.9-1.4c-1.2.6-3 .6-4.2 0Z' },
  petal: { d: 'M12 22.2C6.6 15.8 5.6 8.6 9 2.2l3 2.8 3-2.8c3.4 6.4 2.4 13.6-3 20Z', inner: 'M11.4 8h1.2v10h-1.2Z' },
  eye: { d: 'M1.8 12C5.6 5.2 18.4 5.2 22.2 12 18.4 18.8 5.6 18.8 1.8 12Z', inner: 'M12 7.6a4.4 4.4 0 1 0 .01 0Z' },
  star4: { d: 'M12 1.5c.8 6.6 3.3 9.6 10.5 10.5-7.2.9-9.7 3.9-10.5 10.5-.8-6.6-3.3-9.6-10.5-10.5 7.2-.9 9.7-3.9 10.5-10.5Z' },
  // Shared secondary particles (never a boss's own glyph): sand, bolts, rubble, bones, embers.
  grain: { d: 'M12 6a6 6 0 1 0 .01 0Z' },
  nut: { d: 'M12 2.5 20.2 7.2v9.6L12 21.5l-8.2-4.7V7.2Z M12 8.2a3.8 3.8 0 1 0 .01 0Z' },
  rubble: { d: 'M5 9.5 9.2 4.2l7.4 1.2 4.2 6.1-2.6 7.6-8.4 1.4-5.6-4.4Z' },
  bone: { d: 'M6.2 3.2a2.6 2.6 0 0 1 4.4 2.2l3.9 3.9a2.6 2.6 0 1 1 2.2 4.4 2.6 2.6 0 1 1-2.2 4.4l-3.9-3.9a2.6 2.6 0 1 1-4.4-2.2 2.6 2.6 0 1 1 0-4.4L6.2 3.2Z' },
  ember: { d: 'M12 2.5 15.5 12 12 21.5 8.5 12Z' },
}
// The secondary particles above are shared; a boss's own glyph is one of these.
export const BOSS_GLYPHS = ['gear', 'note', 'feather', 'fist', 'bat', 'scale', 'claw', 'coin', 'card', 'wisp', 'drop', 'skull', 'chain', 'bolt', 'bubble', 'axe', 'flame', 'hex', 'crescent', 'fang', 'shard', 'needle', 'candy', 'petal', 'eye', 'star4']
export const GLYPH_NAMES = Object.keys(GLYPHS)

// One glyph as inline SVG (fill = color, inner = accent), with a thin dark outline so it reads over art of its own color.
export function Glyph({ name, color, accent, size = '100%', outline = true }) {
  const g = GLYPHS[name]
  if (!g) return null
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ display: 'block', overflow: 'visible' }} aria-hidden="true">
      <path d={g.d} fill={color} fillRule="evenodd" {...(outline ? { stroke: '#0009', strokeWidth: 0.9, strokeLinejoin: 'round', paintOrder: 'stroke' } : {})} />
      {g.inner && <path d={g.inner} fill={accent || '#1a1020'} fillRule="evenodd" />}
    </svg>
  )
}
