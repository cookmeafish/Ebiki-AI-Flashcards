// THE SHARED FX KIT: the base keyframes every raid-ability effect may use (FX_CSS, injected once by AbilityFx) and the
// small drawing helpers (slash, ring, shards, flash...). Effects are plain CSS animation over the boss box, about a
// second long, never blocking a click. Colors are FIXED bright values (C): an effect plays over boss art of any
// palette, in both themes, so it never follows the theme.

export const FX_MS = 1200 // the longest effect (each ends by itself). How long a reaction stays on comes from the fx file's juice map now (fx/_juice.js)

export const FX_CSS = `
.lgx { position: absolute; pointer-events: none; }
.lgx-full { inset: -30%; }
@keyframes lgxFade { 0% { opacity: 0 } 15% { opacity: 1 } 70% { opacity: 1 } 100% { opacity: 0 } }
@keyframes lgxSlash { 0% { transform: translate(-50%, -50%) rotate(var(--r)) scaleX(0); opacity: 1 } 35% { transform: translate(-50%, -50%) rotate(var(--r)) scaleX(1); opacity: 1 } 100% { transform: translate(-50%, -50%) rotate(var(--r)) scaleX(1.05); opacity: 0 } }
@keyframes lgxRing { 0% { transform: translate(-50%, -50%) scale(.2); opacity: 1 } 100% { transform: translate(-50%, -50%) scale(var(--s, 1.6)); opacity: 0 } }
@keyframes lgxShard { 0% { transform: translate(-50%, -50%) rotate(var(--a)) translateY(0) rotate(0); opacity: 1 } 100% { transform: translate(-50%, -50%) rotate(var(--a)) translateY(var(--d, -90px)) rotate(var(--spin, 200deg)); opacity: 0 } }
@keyframes lgxBeam { 0% { transform: translateX(-50%) scaleY(0); opacity: 0 } 20% { transform: translateX(-50%) scaleY(1); opacity: 1 } 65% { opacity: 1 } 100% { transform: translateX(-50%) scaleY(1) scaleX(.2); opacity: 0 } }
@keyframes lgxBolt { 0%, 8% { opacity: 0 } 10%, 22% { opacity: 1 } 26% { opacity: .2 } 30%, 44% { opacity: 1 } 100% { opacity: 0 } }
@keyframes lgxFlash { 0% { opacity: 0 } 12% { opacity: .85 } 100% { opacity: 0 } }
@keyframes lgxWave { 0% { transform: translateY(70%) scaleY(.4); opacity: 0 } 25% { opacity: 1 } 55% { transform: translateY(-5%) scaleY(1.1) } 75% { transform: translateY(20%) scaleY(.9); opacity: .9 } 100% { transform: translateY(60%) scaleY(.6); opacity: 0 } }
@keyframes lgxRise { 0% { transform: translateY(0) scale(.6); opacity: 0 } 20% { opacity: 1 } 100% { transform: translateY(var(--h, -110px)) scale(1.1); opacity: 0 } }
@keyframes lgxFall { 0% { transform: translateY(0) rotate(0); opacity: 1 } 100% { transform: translateY(110px) rotate(var(--spin, 160deg)); opacity: 0 } }
@keyframes lgxSpinBack { 0% { transform: translate(-50%, -50%) rotate(0) scale(.6); opacity: 0 } 15% { opacity: .95 } 100% { transform: translate(-50%, -50%) rotate(-720deg) scale(1.15); opacity: 0 } }
@keyframes lgxVortex { 0% { transform: translate(-50%, -50%) rotate(0) scale(1.6); opacity: 0 } 20% { opacity: 1 } 90% { opacity: .9 } 100% { transform: translate(-50%, -50%) rotate(540deg) scale(.05); opacity: 0 } }
@keyframes lgxSweep { 0% { transform: translateX(-140%) skewX(-20deg); opacity: 0 } 15% { opacity: 1 } 100% { transform: translateX(140%) skewX(-20deg); opacity: 0 } }
@keyframes lgxFly { 0% { transform: translate(var(--x0), var(--y0)) scale(.8); opacity: 0 } 15% { opacity: 1 } 85% { opacity: 1 } 100% { transform: translate(0, 0) scale(.4); opacity: 0 } }
@keyframes lgxToHearts { 0% { transform: translate(0, 0) scale(.6); opacity: 0 } 15% { opacity: 1 } 100% { transform: translate(var(--tx, 160px), var(--ty, 40px)) scale(1.1); opacity: 0 } }
@keyframes lgxArc { 0% { transform: translate(-50%, -50%) rotate(-150deg); opacity: 0 } 15% { opacity: 1 } 70% { transform: translate(-50%, -50%) rotate(40deg); opacity: 1 } 100% { transform: translate(-50%, -50%) rotate(60deg); opacity: 0 } }
@keyframes lgxSnap { 0% { transform: scaleY(1); opacity: 1 } 30% { transform: scaleY(1); opacity: 1 } 45% { transform: scaleY(.45) rotate(var(--r, 12deg)); opacity: 1 } 100% { transform: scaleY(.2) rotate(var(--r, 12deg)) translateY(-20px); opacity: 0 } }
@keyframes lgxVignette { 0% { opacity: 0 } 15% { opacity: 1 } 40% { opacity: .55 } 60% { opacity: 1 } 100% { opacity: 0 } }
@keyframes lgxShake { 0%, 100% { transform: none } 15% { transform: translate(-6px, 3px) } 30% { transform: translate(6px, -4px) } 45% { transform: translate(-5px, -2px) } 60% { transform: translate(4px, 3px) } 75% { transform: translate(-2px, 1px) } }
@keyframes lgxZ { 0% { transform: translate(0, 0) scale(.5); opacity: 0 } 20% { opacity: 1 } 100% { transform: translate(var(--dx, 20px), -90px) scale(1.3); opacity: 0 } }
@keyframes lgxGulp { 0% { transform: translate(-50%, -50%) scale(1.5); opacity: 0 } 30% { opacity: .9 } 100% { transform: translate(-50%, -50%) scale(.1); opacity: 0 } }
`

// Fixed bright colors: an effect plays over boss art of any palette, in both themes, so it never follows the theme.
export const C = { info: '#6fc3ff', success: '#5dff9a', danger: '#ff4a3d', warning: '#ffb43a', purple: '#b48cff' }

export const center = { left: '50%', top: '50%' }
export const anim = (name, ms, delay = 0, ease = 'ease-out') => `${name} ${ms}ms ${ease} ${delay}ms both`

// A list of `n` items around a circle, for shards, bees and sparks.
export const around = (n, f) => Array.from({ length: n }, (_, i) => f(i, (360 / n) * i))

export const slash = (r, color, delay = 0, w = '125%', h = 9) => (
  <div className="lgx" style={{ ...center, width: w, height: h, borderRadius: h, background: color, boxShadow: `0 0 12px ${color}`, '--r': `${r}deg`, transformOrigin: 'center', animation: anim('lgxSlash', 750, delay) }} />
)
export const ring = (color, delay = 0, s = 1.6, w = 4, ms = 700) => (
  <div className="lgx" style={{ ...center, width: '80%', height: '80%', borderRadius: '50%', border: `${w}px solid ${color}`, '--s': s, animation: anim('lgxRing', ms, delay) }} />
)
export const shards = (n, color, dist = -95, size = 12, round = false) => around(n, (i, a) => (
  <div key={i} className="lgx" style={{ ...center, width: size, height: round ? size : size * 1.6, background: color, borderRadius: round ? '50%' : 2, clipPath: round ? 'none' : 'polygon(50% 0, 100% 100%, 0 100%)', '--a': `${a + 13 * i}deg`, '--d': `${dist - (i % 3) * 14}px`, '--spin': `${(i % 2 ? 1 : -1) * 220}deg`, animation: anim('lgxShard', 800 + (i % 3) * 120, i * 15) }} />
))
export const flash = (color) => <div className="lgx lgx-full" style={{ background: color, borderRadius: '50%', mixBlendMode: 'screen', animation: anim('lgxFlash', 450) }} />
