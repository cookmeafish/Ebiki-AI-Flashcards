// What the Dreamer's raid ability (sleep: Deep Sleep) LOOKS like. The fx contract is in fx/index.js, the juice numbers
// in fx/_juice.js, the design in design-v2.md section 20. Fixed colors: nightmare purple-black, wake red, lullaby
// pastels (never theme tokens). Also the one persistent idle reaction it is allowed: the slow sleep drift.
import { center, anim, around, flash } from './_kit'

const POP = 'cubic-bezier(.34,1.56,.64,1)'
const SETTLE = 'cubic-bezier(.22,1,.36,1)'
const DREAM = '#b48cff'
const NIGHT = '#2a0f3d'
const RED = '#ff3355'

// A giant eye over the arena: white, an iris of `iris`, a slit pupil.
const eye = (iris, name, ms, delay = 0) => (
  <div className="lgx" style={{ ...center, width: '96%', height: '46%', transform: 'translate(-50%, -50%)', borderRadius: '50%', background: `radial-gradient(circle, #0b0410 0 11%, ${iris} 13%, ${iris} 30%, #fff6fb 33%, #f4e6ff 62%, ${NIGHT} 70%)`, border: `3px solid ${NIGHT}`, boxShadow: `0 0 18px ${iris}`, animation: anim(name, ms, delay, 'linear') }} />
)

export default {
  effects: {
    // Deeper (tick): a dream bubble floats up out of it.
    deeper: () => <>
      {/* a thought bubble chain swells up out of its head, the last one holding a sleepy z */}
      {[0, 1, 2].map((i) => <div key={`t${i}`} className="lgx" style={{ left: `${58 + i * 9}%`, top: `${30 - i * 10}%`, width: 8 + i * 9, height: 8 + i * 9, marginLeft: -(4 + i * 4.5), borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #ffffff 0 20%, #e9dcff 55%, #c9b0ff)', border: `2px solid ${NIGHT}`, boxShadow: `0 0 8px ${DREAM}`, display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 14, color: NIGHT, animation: anim('lgrDreamerBubble', 330, i * 60, POP) }}>{i === 2 ? 'z' : ''}</div>)}
      {[0, 1].map((i) => <div key={i} className="lgx" style={{ left: `${44 + i * 14}%`, top: '40%', width: 16 - i * 5, height: 16 - i * 5, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #ffffff 0 18%, rgba(214,190,255,.55) 45%, rgba(180,140,255,.25) 100%)', border: '1.5px solid #e9dcff', '--h': `${-46 - i * 10}px`, animation: anim('lgxRise', 340, i * 70) }} />)}
    </>,
    // Hum (tick, awake): a first lullaby note drifts up.
    hum: () => <>
      {/* a soft sound arc, and three notes bob up from its mouth */}
      <div className="lgx" style={{ left: '56%', top: '44%', width: 50, height: 50, borderRadius: '50%', border: '3px solid #9fe2ff', borderLeftColor: 'transparent', borderBottomColor: 'transparent', filter: 'drop-shadow(0 0 4px #9fe2ff)', '--s': 1.6, animation: anim('lgxRing', 330) }} />
      {['♪', '♫', '♪'].map((n, i) => <div key={i} className="lgx" style={{ left: `${52 + i * 9}%`, top: '42%', fontSize: 22 + (i % 2) * 6, fontWeight: 900, color: ['#9fe2ff', '#ffc4e8', '#fff3a8'][i], WebkitTextStroke: '1.5px #1a1020', '--h': `${-40 - i * 10}px`, animation: anim('lgxRise', 330, i * 50) }}>{n}</div>)}
    </>,
    // Nightmare (big): a purple-black ripple wipes in, giant eyelids snap open and shut, tendrils lash from the corners.
    nightmare: () => <>
      {flash(DREAM)}
      <div className="lgx" style={{ ...center, width: '140%', height: '140%', borderRadius: '50%', background: `radial-gradient(circle, rgba(42,15,61,.92) 0 38%, rgba(120,60,200,.55) 52%, transparent 68%)`, animation: anim('lgrDreamerRipple', 1150, 0, SETTLE) }} />
      {eye(DREAM, 'lgrDreamerLidSnap', 900, 150)}
      {[[-8, -8, 0, 'top left'], [108, -8, 90, 'top right'], [108, 108, 180, 'bottom right'], [-8, 108, 270, 'bottom left']].map(([x, y, r, o], i) => (
        <div key={i} className="lgx" style={{ left: `${x}%`, top: `${y}%`, width: '58%', height: '58%', transformOrigin: '0 0', '--r': `${r}deg`, animation: anim('lgrDreamerLash', 800, 120 + i * 70, 'ease-in-out') }}>
          <div style={{ width: '100%', height: '100%', borderTop: `7px solid ${NIGHT}`, borderRight: `4px solid ${DREAM}`, borderRadius: '0 100% 0 0', filter: `drop-shadow(0 0 4px ${DREAM})` }} />
        </div>
      ))}
    </>,
    // Wake (big): one huge red eye opens over the arena and blinks.
    wake: () => <>
      <div className="lgx lgx-full" style={{ borderRadius: '50%', background: `radial-gradient(circle, transparent 35%, rgba(255,51,85,.45) 70%)`, animation: anim('lgxVignette', 1100) }} />
      {eye(RED, 'lgrDreamerWakeEye', 1150)}
    </>,
    // Lullaby (medium): pastel stars and Zs spiral down over it.
    lullaby: () => <>{around(8, (i) => (
      <div key={i} className="lgx" style={{ left: `${18 + i * 9}%`, top: '18%', fontWeight: 900, fontSize: 20 + (i % 3) * 5, filter: 'drop-shadow(0 0 4px #d9c8ff)', color: ['#ffc4e8', '#bfe6ff', '#fff3a8', '#d9c8ff'][i % 4], WebkitTextStroke: '1px #3a2a55', '--x': `${(i % 2 ? 1 : -1) * (10 + (i % 3) * 6)}px`, animation: anim('lgrDreamerSpiral', 760, i * 55, SETTLE) }}>{i % 2 ? 'z' : '✦'}</div>
    ))}
      {/* a crescent-moon cradle rocks above it */}
      <svg className="lgx" viewBox="0 0 40 40" style={{ left: '50%', top: '0%', width: 52, height: 52, marginLeft: -26, overflow: 'visible', transformOrigin: '50% 0', filter: 'drop-shadow(0 0 8px #fff3a8)', animation: anim('lgrDreamerCradle', 760, 0, 'ease-in-out') }} aria-hidden="true">
        <path d="M26 4A16 16 0 1 0 36 30 13 13 0 1 1 26 4Z" fill="#fff3a8" stroke="#3a2a55" strokeWidth="2" />
      </svg>
    </>,
  },
  floaters: { deeper: 'lg_fx_sleepDeeper', hum: 'lg_fx_sleepHum', nightmare: 'lg_fx_sleepNightmare', wake: 'lg_fx_sleepWake', lullaby: 'lg_fx_sleepLullaby' },
  floaterTone: { deeper: 'purple', hum: 'info', nightmare: 'purple', wake: 'danger', lullaby: 'info' },
  demo: { deeper: { kind: 'hit', damage: 2, lives: 0 }, hum: { kind: 'hit', damage: 2, lives: 0 }, nightmare: { kind: 'hit', damage: 5, lives: 0 }, wake: { kind: 'miss', damage: 0, lives: 1 }, lullaby: { kind: 'hit', damage: 4, lives: 0 } },
  juice: {
    deeper: { size: 'tick', sfx: 'dreamer.deeper' },
    hum: { size: 'tick', sfx: 'dreamer.hum' },
    nightmare: { size: 'big', shake: 2, flash: 2, hitstop: 1, sfx: 'dreamer.nightmare' },
    wake: { size: 'big', shake: 1, flash: 1, hitstop: 1, sfx: 'dreamer.wake' },
    lullaby: { size: 'medium', hitstop: 1, sfx: 'dreamer.lullaby' },
  },
  // Reactions on the boss art box. Writhe: a skewY ripple through the body. Startle: a jump-scare jolt up with a
  // swell, quick settle. Settle: a slow contented sink. Sink / hum: tiny nudges. Drift: the persistent sleep breath
  // (the idle reaction, kept on while it sleeps).
  css: `
@keyframes lgrDreamerBubble { 0% { transform: scale(0); opacity: 0 } 50% { transform: scale(1.15); opacity: 1 } 75% { transform: scale(1) translateY(-4px); opacity: 1 } 100% { transform: scale(1.05) translateY(-10px); opacity: 0 } }
@keyframes lgrDreamerCradle { 0% { transform: rotate(-20deg) scale(.6); opacity: 0 } 20% { opacity: 1 } 40% { transform: rotate(16deg) scale(1) } 65% { transform: rotate(-12deg) } 85% { transform: rotate(6deg); opacity: 1 } 100% { transform: rotate(0); opacity: 0 } }
.lgr-dreamer-deeper { animation: lgrDreamerSink 300ms ease-out both; transform-origin: 50% 100% }
.lgr-dreamer-hum { animation: lgrDreamerHum 300ms ease-out both; transform-origin: 50% 100% }
.lgr-dreamer-nightmare { animation: lgrDreamerWrithe 1000ms ease-in-out both; transform-origin: 50% 100% }
.lg-boss[data-phase="3"] .lgr-dreamer-nightmare { animation-name: lgrDreamerWritheP3 }
.lgr-dreamer-wake { animation: lgrDreamerStartle 600ms ${SETTLE} both; transform-origin: 50% 100% }
.lgr-dreamer-lullaby { animation: lgrDreamerSettle 780ms ease-in-out both; transform-origin: 50% 100% }
.lgr-dreamer-idle-asleep { animation: lgrDreamerDrift 4s ease-in-out infinite; transform-origin: 50% 100% }
@keyframes lgrDreamerSink { 0%, 100% { transform: none } 50% { transform: translateY(6px) scale(1.03, .96) } }
@keyframes lgrDreamerHum { 0%, 100% { transform: none } 30% { transform: rotate(-5deg) translateY(1px) } 65% { transform: rotate(4deg) } 88% { transform: rotate(-1deg) } }
@keyframes lgrDreamerWrithe { 0%, 100% { transform: none } 15% { transform: skewY(7deg) } 32% { transform: skewY(-7deg) } 50% { transform: skewY(5deg) } 68% { transform: skewY(-4deg) } 84% { transform: skewY(1.5deg) } }
@keyframes lgrDreamerWritheP3 { 0%, 100% { transform: none } 12% { transform: skewY(9deg) scale(1.05) } 28% { transform: skewY(-9deg) } 44% { transform: skewY(7deg) scale(1.04) } 60% { transform: skewY(-5deg) } 76% { transform: skewY(3deg) } 90% { transform: skewY(-1deg) } }
@keyframes lgrDreamerStartle { 0% { transform: none } 18% { transform: translateY(-10px) scale(1.12) } 35% { transform: translateY(-7px) scale(1.08) } 60% { transform: translateY(1px) scale(.99) } 100% { transform: none } }
@keyframes lgrDreamerSettle { 0% { transform: none } 55% { transform: translateY(6px) } 80% { transform: translateY(5px) } 100% { transform: none } }
@keyframes lgrDreamerDrift { 0%, 100% { transform: none } 50% { transform: scaleY(1.015) } }
@keyframes lgrDreamerRipple { 0% { transform: translate(-50%, -50%) scale(.1); opacity: 0 } 25% { opacity: 1 } 70% { transform: translate(-50%, -50%) scale(1); opacity: .95 } 100% { transform: translate(-50%, -50%) scale(1.1); opacity: 0 } }
@keyframes lgrDreamerLidSnap { 0% { transform: translate(-50%, -50%) scaleY(0); opacity: 0 } 12% { transform: translate(-50%, -50%) scaleY(1.05); opacity: 1 } 30% { transform: translate(-50%, -50%) scaleY(1) } 38% { transform: translate(-50%, -50%) scaleY(.03) } 46% { transform: translate(-50%, -50%) scaleY(1.05) } 54% { transform: translate(-50%, -50%) scaleY(.03) } 62% { transform: translate(-50%, -50%) scaleY(1) } 85% { opacity: 1 } 100% { transform: translate(-50%, -50%) scaleY(0); opacity: 0 } }
@keyframes lgrDreamerWakeEye { 0% { transform: translate(-50%, -50%) scaleY(0); opacity: 0 } 18% { transform: translate(-50%, -50%) scaleY(1.06); opacity: 1 } 30% { transform: translate(-50%, -50%) scaleY(1) } 52% { transform: translate(-50%, -50%) scaleY(1) } 58% { transform: translate(-50%, -50%) scaleY(.04) } 66% { transform: translate(-50%, -50%) scaleY(1) } 85% { opacity: 1 } 100% { transform: translate(-50%, -50%) scaleY(.9); opacity: 0 } }
@keyframes lgrDreamerLash { 0% { transform: rotate(var(--r)) scale(.4) rotate(-35deg); opacity: 0 } 25% { opacity: 1 } 45% { transform: rotate(var(--r)) scale(1) rotate(12deg) } 70% { transform: rotate(var(--r)) scale(.9) rotate(-8deg); opacity: 1 } 100% { transform: rotate(var(--r)) scale(.5) rotate(-30deg); opacity: 0 } }
@keyframes lgrDreamerSpiral { 0% { transform: translate(var(--x), -30px) rotate(0) scale(.6); opacity: 0 } 20% { opacity: 1 } 100% { transform: translate(calc(var(--x) * -1), 70px) rotate(300deg) scale(1); opacity: 0 } }
/* fx-layer motion: on the lullaby, the lids of the phase 2 eyes and the phase 3 ringed eyes slide down shut from
   their top edge (all together: the lids are separate groups with no order a CSS delay could follow). */
@keyframes lgrDreamerLidDrop { 0% { transform: scaleY(.15) } 60% { transform: scaleY(1.06) } 100% { transform: none } }
.lg-boss[data-fx="lullaby"] .lg-p2 .lg-fx-lullaby, .lg-boss[data-phase="3"][data-fx="lullaby"] .lg-p3 .lg-fx-lullaby { transform-box: fill-box; transform-origin: 50% 0%; animation: lgrDreamerLidDrop 520ms cubic-bezier(.4,0,.3,1) both }
`,
}
