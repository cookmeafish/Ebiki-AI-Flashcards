// The warning bands across the top and bottom of a boss's entrance card (BossIntro). Colored by the boss: a raid boss
// takes its own two fixed colors (impact/styles.js RAID_IMPACT: `color`, `accent`), anything else the app's danger red.
// Every loop moves a strip exactly one pattern period by a PERCENTAGE transform (composited, and exact at any app zoom:
// a px distance jumped under zoom). `calm` = still. `variant` picks the look (being chosen by the owner).
import { C, FONT } from '../../config/tokens'

export const BAND_VARIANTS = ['sheen', 'chevron', 'hazard']
const PERIODS = 50 // a strip is 50 periods wide; moving it 2% moves exactly one period

export const BAND_CSS = `
@keyframes lgBandLoop { from { transform: translateX(-2%) } to { transform: translateX(0) } }
@keyframes lgBandLoopR { from { transform: translateX(0) } to { transform: translateX(-2%) } }
@keyframes lgBandSweep { 0% { transform: translateX(-120%) skewX(-20deg) } 55%, 100% { transform: translateX(520%) skewX(-20deg) } }
@keyframes lgBandGlow { 0%, 100% { opacity: .55 } 50% { opacity: 1 } }
`

export function RaidBand({ variant = 'sheen', main, deep, label, calm = false, height = 30 }) {
  const c = main || C.danger
  const d = deep || `color-mix(in srgb, ${c} 25%, black)`
  const base = { position: 'absolute', inset: 0, overflow: 'hidden' }
  const anim = (a) => (calm ? 'none' : a)
  let body = null
  if (variant === 'sheen') {
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
          ? `M${x + 14} 6 L${x + 6} ${height / 2} L${x + 14} ${height - 6}`
          : `M${x + 6} 6 L${x + 14} ${height / 2} L${x + 6} ${height - 6}`
      }).join(' ')
      return (
        <svg width={P * PERIODS} height={height} style={{ display: 'block' }}>
          <path d={pts} fill="none" stroke={c} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity=".9" />
        </svg>
      )
    }
    body = (
      <span style={base}>
        <span style={{ ...base, background: `linear-gradient(180deg, color-mix(in srgb, ${d} 80%, black), black 55%, color-mix(in srgb, ${d} 80%, black))` }} />
        <span style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '50%', overflow: 'hidden', WebkitMaskImage: 'linear-gradient(90deg, transparent, black 30%)', maskImage: 'linear-gradient(90deg, transparent, black 30%)' }}>
          <span style={{ position: 'absolute', top: 0, right: 0, animation: anim('lgBandLoopR 1.1s linear infinite') }}>{chev('out-left')}</span>
        </span>
        <span style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '50%', overflow: 'hidden', WebkitMaskImage: 'linear-gradient(270deg, transparent, black 30%)', maskImage: 'linear-gradient(270deg, transparent, black 30%)' }}>
          <span style={{ position: 'absolute', top: 0, left: 0, animation: anim('lgBandLoop 1.1s linear infinite') }}>{chev('out-right')}</span>
        </span>
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
  const plate = {
    position: 'relative', fontFamily: FONT.display, fontWeight: 900, fontSize: 14, letterSpacing: '.38em', color: C.white,
    padding: '1px 12px 1px 16px', borderRadius: 6, textTransform: 'uppercase', whiteSpace: 'nowrap',
    background: `linear-gradient(180deg, color-mix(in srgb, ${d} 60%, black), black)`,
    border: `1.5px solid ${c}`, boxShadow: `0 0 12px color-mix(in srgb, ${c} 55%, transparent), inset 0 1px 0 rgba(255,255,255,.15)`,
    textShadow: `0 0 8px ${c}`,
  }
  return (
    <>
      {body}
      <span style={plate}>{label}</span>
    </>
  )
}
