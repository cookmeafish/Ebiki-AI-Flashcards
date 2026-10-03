// What the Kaleido's Prism (prism) LOOKS like. The fx contract is in fx/index.js, the juice format in fx/_juice.js.
// Fixed bright colors; BossArena skips all of it in focus mode, with Still bosses and under reduced motion. The floater
// already starts with the answer's damage, so the texts never repeat the number.
import { anim, around, ring } from './_kit'

const RGB = ['#ff3b5c', '#3dff8a', '#3aa8ff']

// A beam from a corner converging on the boss's heart (rotation r, delay d): it shoots in, then narrows to nothing.
const beam = (color, r, d) => (
  <div key={r} className="lgx" style={{ left: '50%', top: '50%', width: '95%', height: 9, marginTop: -4.5, transformOrigin: '0 50%', '--r': `${r}deg`, borderRadius: 9,
    background: `linear-gradient(90deg, #ffffff, ${color} 35%, ${color})`, boxShadow: `0 0 12px ${color}`, animation: anim('lgrKaleidoBeam', 700, d) }} />
)

export default {
  effects: {
    // Shard (tick): a glass shard flies from the color chip (up right) into its slot in the boss.
    shard: () => <div className="lgx" style={{ left: '50%', top: '45%', width: 14, height: 22, background: 'linear-gradient(135deg, #ffffff, #ff3b5c 40%, #3dff8a 70%, #3aa8ff)', clipPath: 'polygon(50% 0, 100% 60%, 50% 100%, 0 60%)', '--x0': '110px', '--y0': '-90px', animation: anim('lgxFly', 340) }} />,
    // Overcharge (tick): a color it already held flares hot.
    overcharge: () => <div className="lgx" style={{ left: '50%', top: '45%', width: 40, height: 40, marginLeft: -20, marginTop: -20, borderRadius: '50%', background: 'radial-gradient(circle, #fff 0 25%, rgba(255,214,90,.9) 45%, transparent 70%)', animation: anim('lgrKaleidoFlare', 340) }} />,
    // Prism (big): red, green and blue beams converge from three corners, fuse white, then fan into a rainbow spray.
    prism: () => <>
      {beam(RGB[0], 215, 0)}{beam(RGB[1], 325, 60)}{beam(RGB[2], 90, 120)}
      <div className="lgx" style={{ left: '50%', top: '50%', width: 70, height: 70, marginLeft: -35, marginTop: -35, borderRadius: '50%', background: 'radial-gradient(circle, #fff 0 35%, rgba(255,255,255,.6) 50%, transparent 72%)', animation: anim('lgrKaleidoFuse', 900, 300) }} />
      {around(18, (i, a) => <div key={i} className="lgx" style={{ left: '50%', top: '50%', width: 10, height: 16, background: `hsl(${i * 20}, 100%, 62%)`, clipPath: 'polygon(50% 0, 100% 100%, 0 100%)', '--a': `${a}deg`, '--d': `${-90 - (i % 3) * 16}px`, '--spin': `${(i % 2 ? 1 : -1) * 240}deg`, animation: anim('lgxShard', 800, 420 + (i % 3) * 40) }} />)}
      {ring('#ffffff', 380, 2.1, 4, 700)}
    </>,
  },
  floaters: { shard: 'lg_fx_prismShard', overcharge: 'lg_fx_prismOver', prism: 'lg_fx_prismBurst' },
  floaterTone: { shard: 'info', overcharge: 'warning', prism: 'purple' },
  juice: {
    shard: { size: 'tick', sfx: 'kaleido.shard' },
    overcharge: { size: 'tick', sfx: 'kaleido.overcharge' },
    prism: { size: 'big', shake: 2, flash: 2, hitstop: 1, sfx: 'kaleido.prism' },
  },
  demo: { shard: { damage: 2 }, overcharge: { damage: 3, fxVars: { n: 1 } }, prism: { damage: 4, fxVars: { n: 2 } } },
  // Reactions (body only; face layers come with the art pass): prism = the art splits into red/green/blue copies 6 px
  // apart and snaps back; shard = a 1 deg turn with a glint; overcharge = a hue flinch.
  css: `
@keyframes lgrKaleidoBeam { 0% { transform: rotate(var(--r)) translateX(100%) scaleX(.3); opacity: 0 } 15% { opacity: 1 } 45% { transform: rotate(var(--r)) translateX(0) scaleX(1); opacity: 1 } 70% { transform: rotate(var(--r)) translateX(0) scaleX(.15); opacity: .9 } 100% { transform: rotate(var(--r)) translateX(0) scaleX(0); opacity: 0 } }
@keyframes lgrKaleidoFuse { 0% { transform: scale(.1); opacity: 0 } 25% { transform: scale(1.4); opacity: 1 } 100% { transform: scale(2.2); opacity: 0 } }
@keyframes lgrKaleidoFlare { 0% { transform: scale(.3); opacity: 0 } 35% { transform: scale(1.3); opacity: 1 } 100% { transform: scale(1.6); opacity: 0 } }
@keyframes lgrKaleidoSplit { 0% { filter: none; transform: none } 15% { filter: drop-shadow(-6px 0 0 rgba(255,59,92,.85)) drop-shadow(6px 0 0 rgba(58,168,255,.85)) drop-shadow(0 -6px 0 rgba(61,255,138,.75)); transform: scale(1.1) } 55% { filter: drop-shadow(-6px 0 0 rgba(255,59,92,.7)) drop-shadow(6px 0 0 rgba(58,168,255,.7)) drop-shadow(0 -6px 0 rgba(61,255,138,.6)); transform: scale(1.06) } 70% { filter: none; transform: scale(.95) } 100% { filter: none; transform: none } }
@keyframes lgrKaleidoGlint { 0%, 100% { transform: none; filter: none } 40% { transform: rotate(5deg) scale(1.04); filter: brightness(1.3) } 75% { transform: rotate(-2deg); filter: brightness(1.1) } }
@keyframes lgrKaleidoFlinch { 0%, 100% { transform: none; filter: none } 35% { transform: scale(1.02); filter: hue-rotate(40deg) brightness(1.2) } }
.lgr-kaleido-prism { animation: lgrKaleidoSplit 800ms cubic-bezier(.22,1,.36,1) both }
.lgr-kaleido-shard { animation: lgrKaleidoGlint 320ms ease-out both }
.lgr-kaleido-overcharge { animation: lgrKaleidoFlinch 300ms ease-out both }
/* fx-layer motion: in phase 2 the slit eyes dart left, right, centre at the burning reflections (jumps, not slides);
   in phase 3 the fanged maw drops from its top edge with a bounce. Both keep the part's own transform. */
@keyframes lgrKaleidoEyeDart { 0%, 26% { transform: translate(-2.4px, .5px) } 27%, 54% { transform: translate(2.4px, .5px) } 55%, 100% { transform: translate(0, .5px) } }
@keyframes lgrKaleidoMawDrop { 0% { transform: translate(0, 1.6px) translate(0, 8px) scale(1.06, .95) translate(0, -8px) } 35% { transform: translate(0, 1.6px) translate(0, 8px) scale(1.06, 1.52) translate(0, -8px) } 55% { transform: translate(0, 1.6px) translate(0, 8px) scale(1.06, 1.3) translate(0, -8px) } 75%, 100% { transform: translate(0, 1.6px) translate(0, 8px) scale(1.06, 1.38) translate(0, -8px) } }
.lg-boss[data-fx="prism"] .lgfa-kaleido-eye { animation: lgrKaleidoEyeDart 900ms linear both }
.lg-boss[data-fx="prism"] .lgfa-kaleido-maw { transform-box: view-box; transform-origin: 0 0; animation: lgrKaleidoMawDrop 700ms cubic-bezier(.3,.8,.4,1) both }
/* THE REAL PARTS: the state layer this ability draws on the boss (its lg-ab-* group in raids/kaleido.svg) moves with
   the moment, not only the whole figure. Played only while data-fx is set (never in focus mode, with Still bosses or
   under reduced motion). */
@keyframes lgrKaleidoPrismGlint { 0%, 100% { transform: none; filter: none } 40% { transform: scale(1.18); filter: brightness(1.7) saturate(1.3) } }
.lg-boss[data-fx="shard"] [class*="lg-ab-prism-"], .lg-boss[data-fx="overcharge"] [class*="lg-ab-prism-"] { transform-box: fill-box; transform-origin: center; animation: lgrKaleidoPrismGlint 320ms cubic-bezier(.22,1,.36,1) both }
`,
}
