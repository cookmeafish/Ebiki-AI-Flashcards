// The warning bands across the top and bottom of a boss's entrance card (BossIntro) and the Practice raid hero.
// Colored by the boss: a raid boss takes its own two fixed colors (impact/styles.js RAID_IMPACT: `color`, `accent`), a
// Legends boss its area's palette, Legendary gold, anything else the app's danger red. Every loop moves a strip exactly
// one pattern period by a PERCENTAGE transform (composited, and exact at any app zoom: a px distance jumped under
// zoom), or animates opacity/transform only. `calm` = still. `variant` picks the look; BAND_STYLE is the one the app
// uses. Every look is on one live page for comparing: /dev/raid-band/ (dev server).
import { C, FONT } from '../../config/tokens'

export const BAND_VARIANTS = ['line', 'ribbon', 'beam', 'lightning', 'sigil', 'chevron', 'sheen', 'hazard']
export const BAND_STYLE = 'line'
const PERIODS = 50 // a strip is 50 periods wide; moving it 2% moves exactly one period

export const BAND_CSS = `
@keyframes lgBandLoop { from { transform: translateX(-2%) } to { transform: translateX(0) } }
@keyframes lgBandLoopR { from { transform: translateX(0) } to { transform: translateX(-2%) } }
@keyframes lgBandSweep { 0% { transform: translateX(-120%) skewX(-20deg) } 55%, 100% { transform: translateX(520%) skewX(-20deg) } }
@keyframes lgBandGlow { 0%, 100% { opacity: .55 } 50% { opacity: 1 } }
@keyframes lgBandFlickA { 0%, 18%, 52%, 70%, 100% { opacity: 1 } 19%, 51% { opacity: 0 } 71%, 99% { opacity: .15 } }
@keyframes lgBandFlickB { 0%, 18%, 52%, 70%, 100% { opacity: 0 } 19%, 51% { opacity: 1 } 71%, 99% { opacity: .85 } }
@keyframes lgBandWave { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-1.5px) } }
@keyframes lgBandGlint { 0% { transform: translateX(-25%); opacity: 0 } 8% { opacity: 1 } 55% { transform: translateX(100%); opacity: 0 } 100% { transform: translateX(100%); opacity: 0 } }
@keyframes lgBandPulseOut { 0% { transform: translateX(0); opacity: 0 } 15% { opacity: 1 } 100% { transform: translateX(100%); opacity: 0 } }
`

const fade = (dir) => `linear-gradient(${dir}, transparent, black 30%)`
const masked = (dir) => ({ WebkitMaskImage: fade(dir), maskImage: fade(dir) })

export function RaidBand({ variant = BAND_STYLE, main, deep, label, calm = false, height = 30 }) {
  const c = main || C.danger
  const d = deep || `color-mix(in srgb, ${c} 25%, black)`
  const h = height
  const base = { position: 'absolute', inset: 0, overflow: 'hidden' }
  const anim = (a) => (calm ? 'none' : a)
  const halves = (left, right) => (
    <>
      <span style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '50%', overflow: 'hidden', ...masked('90deg') }}>{left}</span>
      <span style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '50%', overflow: 'hidden', ...masked('270deg') }}>{right}</span>
    </>
  )
  let body = null
  let plate = {
    position: 'relative', fontFamily: FONT.display, fontWeight: 900, fontSize: Math.round(h * 0.47), letterSpacing: '.38em', color: C.white,
    padding: '1px 12px 1px 16px', borderRadius: 6, textTransform: 'uppercase', whiteSpace: 'nowrap',
    background: `linear-gradient(180deg, color-mix(in srgb, ${d} 60%, black), black)`,
    border: `1.5px solid ${c}`, boxShadow: `0 0 12px color-mix(in srgb, ${c} 55%, transparent), inset 0 1px 0 rgba(255,255,255,.15)`,
    textShadow: `0 0 8px ${c}`,
  }
  let plateExtra = null

  if (variant === 'line') {
    // A title rule: no strip behind it. Two thin glowing lines fade out from the label, a hairline under each, a small
    // diamond at each side of the label, and a glint that runs outward along the lines now and then.
    const side = (dir) => (
      <span style={{ position: 'relative', flex: '1 1 0', minWidth: 0, height: h, transform: dir === 'left' ? 'scaleX(-1)' : 'none' }}>
        <span style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 2, marginTop: -1, borderRadius: 2, background: `linear-gradient(90deg, ${c}, color-mix(in srgb, ${c} 45%, transparent) 55%, transparent)`, boxShadow: `0 0 6px color-mix(in srgb, ${c} 70%, transparent)` }} />
        <span style={{ position: 'absolute', left: 0, width: '62%', top: '50%', height: 1, marginTop: 4, background: `linear-gradient(90deg, color-mix(in srgb, ${c} 55%, transparent), transparent)` }} />
        <span style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <span style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '100%', animation: anim('lgBandGlint 3.4s cubic-bezier(.3,.6,.4,1) infinite') }}>
            <span style={{ position: 'absolute', top: '50%', height: 4, marginTop: -2, left: 0, width: '22%', borderRadius: 4, background: `linear-gradient(90deg, transparent, white 60%, transparent)`, filter: `drop-shadow(0 0 4px ${c})` }} />
          </span>
        </span>
      </span>
    )
    const gem = <span aria-hidden="true" style={{ flex: 'none', width: Math.round(h * 0.22), height: Math.round(h * 0.22), transform: 'rotate(45deg)', background: c, boxShadow: `0 0 8px ${c}` }} />
    return (
      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: Math.round(h * 0.3), padding: '0 6%' }}>
        {side('left')}
        {gem}
        <span style={{ flex: 'none', fontFamily: FONT.display, fontWeight: 900, fontSize: Math.round(h * 0.46), letterSpacing: '.5em', marginRight: '-.5em', color: C.white, textTransform: 'uppercase', whiteSpace: 'nowrap', textShadow: `0 0 10px ${c}, 0 1px 2px rgba(0,0,0,.8)` }}>{label}</span>
        {gem}
        {side('right')}
      </span>
    )
  } else if (variant === 'ribbon') {
    // A heraldic ribbon: a cloth banner in the boss's color with swallowtail ends and light trim, the name stitched
    // on it, a slow shimmer across the cloth and a gentle sway.
    const W = 400
    const tail = 26
    const ribbon = `M${tail} 3 H${W - tail} L${W - 4} 3 L${W - tail + 8} ${h / 2} L${W - 4} ${h - 3} H${tail} L4 ${h - 3} L${tail - 8} ${h / 2} L4 3 Z`
    body = (
      <span style={{ ...base, display: 'grid', placeItems: 'center', overflow: 'visible' }}>
        <span style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, background: `linear-gradient(90deg, transparent, color-mix(in srgb, ${c} 60%, transparent), transparent)` }} />
        <span style={{ position: 'relative', width: 'min(400px, 92%)', height: h, animation: anim('lgBandWave 3.6s ease-in-out infinite') }}>
          <svg viewBox={`0 0 ${W} ${h}`} preserveAspectRatio="none" width="100%" height={h} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
            <path d={ribbon} fill={d} transform={`translate(0 2)`} opacity=".7" />
            <path d={ribbon} fill={c} />
            <path d={ribbon} fill="black" opacity=".25" style={{ clipPath: `inset(50% 0 0 0)` }} />
            <path d={`M${tail} 6 H${W - tail}`} stroke="rgba(255,255,255,.55)" strokeWidth="1" strokeDasharray="3 3" fill="none" />
            <path d={`M${tail} ${h - 6} H${W - tail}`} stroke="rgba(255,255,255,.35)" strokeWidth="1" strokeDasharray="3 3" fill="none" />
          </svg>
          <span style={{ position: 'absolute', inset: '3px 26px', overflow: 'hidden' }}>
            <span style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '22%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.45), transparent)', animation: anim('lgBandSweep 4s ease-in-out infinite') }} />
          </span>
        </span>
      </span>
    )
    plate = { ...plate, background: 'none', border: 'none', boxShadow: 'none', textShadow: `0 1px 0 ${d}, 0 0 6px rgba(0,0,0,.6)`, color: C.white, animation: anim('lgBandWave 3.6s ease-in-out infinite') }
  } else if (variant === 'beam') {
    // An energy barrier: one bright beam across the card, sparks streaming OUT from the plate along it, a soft haze,
    // and a sci-fi plate with corner brackets.
    const P = 34
    const sparks = (out) => (
      <svg width={P * PERIODS} height={h} style={{ display: 'block' }}>
        {Array.from({ length: PERIODS }, (_, i) => {
          const x = i * P
          return <g key={i}><rect x={x + (out ? 4 : 14)} y={h / 2 - 1} width="16" height="2" rx="1" fill="white" opacity=".85" /><circle cx={x + (out ? 22 : 12)} cy={h / 2} r="1.6" fill="white" /></g>
        })}
      </svg>
    )
    body = (
      <span style={base}>
        <span style={{ ...base, background: `radial-gradient(ellipse 60% 100% at 50% 50%, color-mix(in srgb, ${c} 30%, transparent), transparent 75%)`, animation: anim('lgBandGlow 1.8s ease-in-out infinite') }} />
        <span style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 3, marginTop: -1.5, background: `linear-gradient(90deg, transparent, ${c} 12%, white 50%, ${c} 88%, transparent)`, boxShadow: `0 0 10px ${c}, 0 0 22px ${c}` }} />
        {halves(
          <span style={{ position: 'absolute', top: 0, right: 0, filter: `drop-shadow(0 0 3px ${c})`, animation: anim('lgBandLoopR .7s linear infinite') }}>{sparks(false)}</span>,
          <span style={{ position: 'absolute', top: 0, left: 0, filter: `drop-shadow(0 0 3px ${c})`, animation: anim('lgBandLoop .7s linear infinite') }}>{sparks(true)}</span>,
        )}
      </span>
    )
    plate = { ...plate, borderRadius: 2, border: `1px solid color-mix(in srgb, ${c} 70%, white)`, background: 'rgba(0,0,0,.82)', letterSpacing: '.45em' }
    const corner = (pos) => <span aria-hidden="true" style={{ position: 'absolute', width: 7, height: 7, borderColor: 'white', borderStyle: 'solid', borderWidth: 0, ...pos }} />
    plateExtra = <>{corner({ left: -5, top: -4, borderLeftWidth: 2, borderTopWidth: 2 })}{corner({ right: -5, top: -4, borderRightWidth: 2, borderTopWidth: 2 })}{corner({ left: -5, bottom: -4, borderLeftWidth: 2, borderBottomWidth: 2 })}{corner({ right: -5, bottom: -4, borderRightWidth: 2, borderBottomWidth: 2 })}</>
  } else if (variant === 'lightning') {
    // A crackling arc: two jagged bolts across the card that swap (a flicker, never a smooth slide), a hot core line,
    // and a glow that pulses with it.
    const W = 600
    const bolt = (seed) => {
      let pts = `M0 ${h / 2}`
      for (let x = 12; x <= W; x += 12) {
        const j = Math.sin(x * 0.37 + seed * 2.1) * 0.5 + Math.sin(x * 0.11 + seed) * 0.5
        pts += ` L${x} ${(h / 2 + j * (h * 0.34)).toFixed(1)}`
      }
      return pts
    }
    const boltSvg = (seed, a) => (
      <svg viewBox={`0 0 ${W} ${h}`} preserveAspectRatio="none" width="100%" height={h} style={{ position: 'absolute', inset: 0, animation: anim(a), filter: `drop-shadow(0 0 4px ${c}) drop-shadow(0 0 8px ${c})` }}>
        <path d={bolt(seed)} fill="none" stroke={c} strokeWidth="3" strokeLinejoin="round" />
        <path d={bolt(seed)} fill="none" stroke="white" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
    )
    body = (
      <span style={{ ...base, WebkitMaskImage: 'linear-gradient(90deg, transparent, black 10%, black 90%, transparent)', maskImage: 'linear-gradient(90deg, transparent, black 10%, black 90%, transparent)' }}>
        <span style={{ ...base, background: `linear-gradient(180deg, transparent, color-mix(in srgb, ${c} 22%, transparent) 50%, transparent)`, animation: anim('lgBandGlow 0.9s ease-in-out infinite') }} />
        {boltSvg(1, 'lgBandFlickA 0.42s steps(1, end) infinite')}
        {boltSvg(4, 'lgBandFlickB 0.42s steps(1, end) infinite')}
      </span>
    )
    plate = { ...plate, background: 'black', boxShadow: `0 0 16px ${c}, 0 0 4px white inset`, border: `1.5px solid white` }
  } else if (variant === 'sigil') {
    // A chain of gems: linked diamonds running out from the plate on both sides, a pulse of light travelling outward
    // through them.
    const P = 26
    const gems = (
      <svg width={P * PERIODS} height={h} style={{ display: 'block' }}>
        <path d={`M0 ${h / 2} H${P * PERIODS}`} stroke={`color-mix(in srgb, ${c} 55%, transparent)`} strokeWidth="1.5" />
        {Array.from({ length: PERIODS }, (_, i) => {
          const x = i * P + P / 2, r = h * 0.24
          return (
            <g key={i}>
              <path d={`M${x} ${h / 2 - r} L${x + r * 0.8} ${h / 2} L${x} ${h / 2 + r} L${x - r * 0.8} ${h / 2} Z`} fill={d} stroke={c} strokeWidth="1.5" />
              <path d={`M${x} ${h / 2 - r * 0.55} L${x + r * 0.42} ${h / 2} L${x} ${h / 2} Z`} fill="white" opacity=".55" />
            </g>
          )
        })}
      </svg>
    )
    const pulse = (dir) => (
      <span style={{ position: 'absolute', top: 0, bottom: 0, [dir === 'left' ? 'right' : 'left']: 0, width: '100%', overflow: 'hidden' }}>
        <span style={{ position: 'absolute', top: 0, bottom: 0, [dir === 'left' ? 'right' : 'left']: 0, width: '100%', transform: dir === 'left' ? 'scaleX(-1)' : 'none' }}>
          <span style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '30%', background: `radial-gradient(ellipse 50% 70% at 50% 50%, ${c}, transparent 70%)`, mixBlendMode: 'screen', animation: anim('lgBandPulseOut 1.8s ease-out infinite') }} />
        </span>
      </span>
    )
    body = (
      <span style={base}>
        <span style={{ ...base, background: `linear-gradient(180deg, transparent, rgba(0,0,0,.55) 50%, transparent)` }} />
        {halves(
          <><span style={{ position: 'absolute', top: 0, right: 0 }}>{gems}</span>{pulse('left')}</>,
          <><span style={{ position: 'absolute', top: 0, left: 0 }}>{gems}</span>{pulse('right')}</>,
        )}
      </span>
    )
    plate = { ...plate, borderRadius: 999, padding: '1px 14px 1px 18px' }
  } else if (variant === 'sheen') {
    // A dark glass band, a fine hatch, glowing edge lines and a soft light sweeping across.
    const hatch = `repeating-linear-gradient(-60deg, color-mix(in srgb, ${c} 16%, transparent) 0 2px, transparent 2px 9px)`
    body = (
      <span style={base}>
        <span style={{ ...base, background: `linear-gradient(180deg, color-mix(in srgb, ${c} 30%, black) 0%, color-mix(in srgb, ${d} 70%, black) 50%, color-mix(in srgb, ${c} 22%, black) 100%)` }} />
        <span style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${9 * PERIODS / Math.sin(Math.PI / 3)}px`, background: hatch, animation: anim('lgBandLoop 3s linear infinite') }} />
        <span style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '22%', background: `linear-gradient(90deg, transparent, color-mix(in srgb, ${c} 55%, white) 50%, transparent)`, opacity: 0.55, mixBlendMode: 'screen', animation: anim('lgBandSweep 3.2s ease-in-out infinite') }} />
        <span style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 2, background: c, boxShadow: `0 0 8px ${c}`, animation: anim('lgBandGlow 2.4s ease-in-out infinite') }} />
        <span style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, background: c, boxShadow: `0 0 8px ${c}`, animation: anim('lgBandGlow 2.4s ease-in-out infinite') }} />
      </span>
    )
  } else if (variant === 'chevron') {
    // Chevrons flowing OUT from the label on both sides, on a dark band with lit edges.
    const P = 22
    const chev = (dir) => {
      const pts = Array.from({ length: PERIODS }, (_, i) => {
        const x = i * P
        return dir === 'out-left'
          ? `M${x + 14} 6 L${x + 6} ${h / 2} L${x + 14} ${h - 6}`
          : `M${x + 6} 6 L${x + 14} ${h / 2} L${x + 6} ${h - 6}`
      }).join(' ')
      return (
        <svg width={P * PERIODS} height={h} style={{ display: 'block' }}>
          <path d={pts} fill="none" stroke={c} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity=".9" />
        </svg>
      )
    }
    body = (
      <span style={base}>
        <span style={{ ...base, background: `linear-gradient(180deg, color-mix(in srgb, ${d} 80%, black), black 55%, color-mix(in srgb, ${d} 80%, black))` }} />
        {halves(
          <span style={{ position: 'absolute', top: 0, right: 0, animation: anim('lgBandLoopR 1.1s linear infinite') }}>{chev('out-left')}</span>,
          <span style={{ position: 'absolute', top: 0, left: 0, animation: anim('lgBandLoop 1.1s linear infinite') }}>{chev('out-right')}</span>,
        )}
        <span style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 1.5, background: c, opacity: 0.7 }} />
        <span style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 1.5, background: c, opacity: 0.7 }} />
      </span>
    )
  } else {
    // The hazard tape, refined: thinner two-tone stripes in the boss's colors, a glossy top light, faded ends.
    const stripe = `repeating-linear-gradient(-45deg, ${c} 0 10px, color-mix(in srgb, ${d} 60%, black) 10px 20px)`
    body = (
      <span style={{ ...base, WebkitMaskImage: 'linear-gradient(90deg, transparent, black 12%, black 88%, transparent)', maskImage: 'linear-gradient(90deg, transparent, black 12%, black 88%, transparent)' }}>
        <span style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${(20 * Math.SQRT2 * PERIODS).toFixed(3)}px`, background: stripe, animation: anim('lgBandLoop 2s linear infinite') }} />
        <span style={{ ...base, background: 'linear-gradient(180deg, rgba(255,255,255,.28), rgba(255,255,255,0) 45%, rgba(0,0,0,.35))' }} />
      </span>
    )
  }
  return (
    <>
      {body}
      <span style={plate}>{plateExtra}{label}</span>
    </>
  )
}
