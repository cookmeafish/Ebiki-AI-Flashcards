// What a raid ability LOOKS like when it fires: one short effect over the boss, keyed by strike's `last.fx`
// (fight.js). Every ability has its own (a bolt for the Storm Tyrant, a wave for the Drowned God, a scythe arc for
// the Soul Harvester...). Drawn with plain CSS animation over the boss box, about a second long, never blocking a
// click. Focus mode and "reduce motion" (unless the owner's "Always animate the art") show none: the floater text
// still says what happened.

const FX_MS = 1200 // the longest effect; each one ends by itself (animation fill both, opacity 0)

const CSS = `
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
const C = { info: '#6fc3ff', success: '#5dff9a', danger: '#ff4a3d', warning: '#ffb43a', purple: '#b48cff' }

const center = { left: '50%', top: '50%' }
const anim = (name, ms, delay = 0, ease = 'ease-out') => `${name} ${ms}ms ${ease} ${delay}ms both`

// A list of `n` items around a circle, for shards, bees and sparks.
const around = (n, f) => Array.from({ length: n }, (_, i) => f(i, (360 / n) * i))

const slash = (r, color, delay = 0, w = '125%', h = 9) => (
  <div className="lgx" style={{ ...center, width: w, height: h, borderRadius: h, background: color, boxShadow: `0 0 12px ${color}`, '--r': `${r}deg`, transformOrigin: 'center', animation: anim('lgxSlash', 750, delay) }} />
)
const ring = (color, delay = 0, s = 1.6, w = 4, ms = 700) => (
  <div className="lgx" style={{ ...center, width: '80%', height: '80%', borderRadius: '50%', border: `${w}px solid ${color}`, '--s': s, animation: anim('lgxRing', ms, delay) }} />
)
const shards = (n, color, dist = -95, size = 12, round = false) => around(n, (i, a) => (
  <div key={i} className="lgx" style={{ ...center, width: size, height: round ? size : size * 1.6, background: color, borderRadius: round ? '50%' : 2, clipPath: round ? 'none' : 'polygon(50% 0, 100% 100%, 0 100%)', '--a': `${a + 13 * i}deg`, '--d': `${dist - (i % 3) * 14}px`, '--spin': `${(i % 2 ? 1 : -1) * 220}deg`, animation: anim('lgxShard', 800 + (i % 3) * 120, i * 15) }} />
))
const flash = (color) => <div className="lgx lgx-full" style={{ background: color, borderRadius: '50%', mixBlendMode: 'screen', animation: anim('lgxFlash', 450) }} />

// fx key (strike's last.fx) -> what it looks like.
const EFFECTS = {
  // Hydra: a head cut clean off, two crossing blade strokes.
  cut: () => <>{slash(-35, '#e8fbff')}{slash(30, C.info, 140)}</>,
  // Titan: the choice bounces off its plating: a hexagon of armor flashes and sparks ricochet.
  bounce: () => <>
    <div className="lgx" style={{ ...center, width: '70%', height: '70%', transform: 'translate(-50%, -50%)', clipPath: 'polygon(25% 3%, 75% 3%, 100% 50%, 75% 97%, 25% 97%, 0 50%)', background: `color-mix(in srgb, ${C.info} 45%, transparent)`, border: `4px solid ${C.info}`, boxShadow: `0 0 18px ${C.info}`, animation: anim('lgxFade', 900) }} />
    {shards(10, '#ffd36b', -85, 9, true)}
  </>,
  // Lich: it rises: a pillar of green soulfire through it, souls climbing.
  rise: () => <>
    <div className="lgx" style={{ left: '50%', bottom: '-10%', width: '46%', height: '130%', transformOrigin: 'bottom', background: 'linear-gradient(to top, #5dff9a, rgba(93,255,154,0))', borderRadius: '50% 50% 0 0', animation: anim('lgxBeam', 1000) }} />
    {around(6, (i) => <div key={i} className="lgx" style={{ left: `${22 + i * 11}%`, bottom: '5%', fontSize: 18, '--h': `${-90 - (i % 3) * 20}px`, animation: anim('lgxRise', 900, i * 70) }}>👻</div>)}
  </>,
  // Lich: its phylactery breaks: green crystal shards everywhere.
  shatter: () => <>{flash('#5dff9a')}{shards(14, '#5dff9a', -110, 10)}{ring('#5dff9a', 0, 2.2, 5)}</>,
  // Chimera: three heads, three claw marks, one after another.
  triple: () => <>{slash(-60, C.warning, 0, '105%', 9)}{slash(-60, C.danger, 120, '105%', 9)}{slash(-60, C.warning, 240, '105%', 9)}</>,
  // Void: the singularity swallows the hit: a spinning dark disc collapsing to a point.
  singularity: () => <>
    <div className="lgx" style={{ ...center, width: '90%', height: '90%', borderRadius: '50%', background: 'radial-gradient(circle, #000 0 22%, #7c4def 36%, transparent 70%)', animation: anim('lgxVortex', 950) }} />
    {ring(C.purple, 300, 0.2, 3, 600)}
  </>,
  // Seraph: judgment: a beam of gold light slams down from above.
  smite: () => <>
    <div className="lgx" style={{ left: '50%', top: '-60%', width: '40%', height: '160%', transformOrigin: 'top', background: 'linear-gradient(to bottom, rgba(255,240,176,0), #fff6c8 40%, #ffd36b)', borderRadius: '0 0 50% 50%', animation: anim('lgxBeam', 950) }} />
    {flash('#fff0b0')}{ring('#ffd36b', 250, 1.8, 5)}
  </>,
  // Leviathan: it breaks the surface: a wave surges up and crashes over it.
  surface: () => <div className="lgx" style={{ left: '-20%', right: '-20%', bottom: '-10%', height: '75%', transformOrigin: 'bottom', borderRadius: '45% 55% 0 0', background: `linear-gradient(to top, color-mix(in srgb, ${C.info} 85%, transparent), color-mix(in srgb, ${C.info} 20%, white))`, boxShadow: '0 -6px 0 rgba(255,255,255,.85)', animation: anim('lgxWave', 1000) }} />,
  // Inferno: the kindling catches: flames lick up all around it.
  kindle: () => <>{around(7, (i) => <div key={i} className="lgx" style={{ left: `${8 + i * 13}%`, bottom: '0%', fontSize: 22 + (i % 3) * 6, '--h': `${-60 - (i % 3) * 25}px`, animation: anim('lgxRise', 800, i * 50) }}>🔥</div>)}</>,
  // Chronos: rewound: a clock face spins backwards over it.
  rewind: () => (
    <div className="lgx" style={{ ...center, width: '85%', height: '85%', borderRadius: '50%', border: `6px solid ${C.info}`, boxShadow: `0 0 18px ${C.info}`, background: `color-mix(in srgb, ${C.info} 18%, transparent)`, animation: anim('lgxSpinBack', 1000) }}>
      <div style={{ position: 'absolute', left: '50%', top: '12%', width: 6, height: '38%', marginLeft: -3, background: C.info, borderRadius: 2 }} />
      <div style={{ position: 'absolute', left: '50%', top: '50%', width: '30%', height: 6, marginTop: -3, background: C.info, borderRadius: 2 }} />
    </div>
  ),
  // Vampire: the blood pact: drops fly from it toward your hearts.
  pact: () => <>{around(6, (i) => <div key={i} className="lgx" style={{ left: '50%', top: `${35 + (i % 3) * 10}%`, fontSize: 21, '--tx': `${150 + i * 10}px`, '--ty': `${30 + (i % 3) * 12}px`, animation: anim('lgxToHearts', 900, i * 60) }}>🩸</div>)}</>,
  // Tempest: lightning: a bolt cracks down onto it and the sky flashes.
  bolt: () => <>
    {flash('#e9f6ff')}
    <svg className="lgx" viewBox="0 0 40 100" preserveAspectRatio="none" style={{ left: '30%', top: '-55%', width: '40%', height: '120%', animation: anim('lgxBolt', 900, 0, 'linear') }}>
      <path d="M24 0 L10 46 L22 46 L8 100 L34 38 L21 38 L32 0Z" fill="#fff8a8" stroke="#6fc3ff" strokeWidth="2" strokeLinejoin="round" />
    </svg>
    {ring('#9fe0ff', 120, 1.7, 4)}
  </>,
  // Kaleido: reflected: a prism streak sweeps across the mirror.
  reflect: () => <div className="lgx" style={{ top: '-10%', bottom: '-10%', left: '20%', width: '45%', background: 'linear-gradient(90deg, transparent, rgba(255,90,200,.55), rgba(255,255,255,.95), rgba(90,220,255,.55), transparent)', animation: anim('lgxSweep', 700) }} />,
  // Glutton: choked on a full answer: a gulp ring pulls in, crumbs spit out.
  choke: () => <>
    <div className="lgx" style={{ ...center, width: '90%', height: '90%', borderRadius: '50%', border: `7px solid ${C.warning}`, boxShadow: `0 0 16px ${C.warning}`, animation: anim('lgxGulp', 800) }} />
    {shards(9, '#e0a35f', -95, 12, true)}
  </>,
  // Glutton: it gorges on your miss: green healing motes sink into it.
  gorge: () => <>{around(8, (i, a) => <div key={i} className="lgx" style={{ ...center, width: 15, height: 15, borderRadius: '50%', background: C.success, boxShadow: `0 0 14px ${C.success}`, '--x0': `${Math.round(Math.cos((a * Math.PI) / 180) * 90)}px`, '--y0': `${Math.round(Math.sin((a * Math.PI) / 180) * 90)}px`, animation: anim('lgxFly', 950, i * 40) }} />)}{ring(C.success, 700, 0.3, 4, 600)}</>,
  // Puppeteer: a string snaps: three strings from above break and recoil.
  snap: () => <>{[30, 50, 70].map((x, i) => <div key={x} className="lgx" style={{ left: `${x}%`, top: '-40%', width: 2, height: '90%', background: '#f2e2b8', transformOrigin: 'top', '--r': `${(i - 1) * 14 || 10}deg`, animation: anim('lgxSnap', 800, i * 90) }} />)}{flash('#f2e2b8')}</>,
  // Berserker: last breath: the screen pulses red and the blow lands with a shake.
  lastbreath: () => <>
    <div className="lgx" style={{ inset: '-45%', borderRadius: '50%', background: `radial-gradient(circle, transparent 35%, color-mix(in srgb, ${C.danger} 70%, transparent) 75%)`, animation: anim('lgxVignette', 1000) }} />
    <div className="lgx" style={{ inset: 0, animation: anim('lgxShake', 500, 0, 'linear') }}>{slash(-20, C.danger, 0, '130%', 10)}</div>
  </>,
  // Hive Empress: the swarm stings: bees zip in from every side.
  sting: () => <>{around(9, (i, a) => <div key={i} className="lgx" style={{ ...center, fontSize: 21, '--x0': `${Math.round(Math.cos((a * Math.PI) / 180) * 110)}px`, '--y0': `${Math.round(Math.sin((a * Math.PI) / 180) * 110)}px`, animation: anim('lgxFly', 650, i * 35) }}>🐝</div>)}</>,
  // Gorgon: her stone cracks: chunks break off and tumble.
  crumble: () => <>{around(8, (i) => <div key={i} className="lgx" style={{ left: `${15 + i * 10}%`, top: `${20 + (i % 3) * 18}%`, width: 10 + (i % 3) * 4, height: 9 + (i % 2) * 5, background: '#a7a29a', border: '2px solid #5f5a52', borderRadius: 3, '--spin': `${(i % 2 ? 1 : -1) * 150}deg`, animation: anim('lgxFall', 900, i * 45, 'ease-in') }} />)}</>,
  // Banshee: the crescendo: rings of sound burst out of it.
  crescendo: () => <>{ring('#bdf3ff', 0, 1.5, 3)}{ring('#7fe3ff', 150, 1.9, 3)}{ring('#bdf3ff', 300, 2.3, 3)}</>,
  // Reaper: harvest: a scythe arc sweeps through it.
  harvest: () => (
    <div className="lgx" style={{ ...center, width: '115%', height: '115%', borderRadius: '50%', borderTop: '6px solid #e9f2ff', borderRight: '3px solid transparent', boxShadow: '0 -6px 14px -6px #9fd0ff', animation: anim('lgxArc', 700) }} />
  ),
  // Dreamer: it still sleeps: a soft bubble pops and Zzz drift up.
  slumber: () => <>{ring(C.purple, 0, 1.4, 4, 1000)}{['Z', 'z', 'Z'].map((z, i) => <div key={i} className="lgx" style={{ left: `${40 + i * 12}%`, top: '30%', fontWeight: 900, fontSize: 20 - i * 3, color: C.purple, '--dx': `${10 + i * 8}px`, animation: anim('lgxZ', 1000, i * 150) }}>{z}</div>)}</>,
}

export const ABILITY_FX_KEYS = Object.keys(EFFECTS)

// One effect for `fx`. Remount it (key by the strike number) to play it again.
export function AbilityFx({ fx }) {
  const draw = EFFECTS[fx]
  if (!draw) return null
  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
      <style>{CSS}</style>
      {draw()}
    </div>
  )
}
export { FX_MS }
