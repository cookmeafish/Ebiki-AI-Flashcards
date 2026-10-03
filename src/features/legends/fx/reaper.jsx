// What the Reaper's raid ability (execute: Reaper's Line) LOOKS like. The fx contract is in fx/index.js, the juice
// numbers in fx/_juice.js, the design in design-v2.md section 19. Fixed colors: bone, black, blood red, soul white.
import { anim, around, flash } from './_kit'

const SETTLE = 'cubic-bezier(.22,1,.36,1)'
const BONE = '#f1e9d2'
const BLOOD = '#ff4a3d'

export default {
  effects: {
    // Climb (tick): a red scythe glint slides up the right side, toward his health.
    climb: () => <>
      <div className="lgx" style={{ left: '80%', top: '64%', width: 26, height: 12, marginLeft: -13, borderTop: `3px solid ${BLOOD}`, borderRadius: '50%', filter: `drop-shadow(0 0 4px ${BLOOD})`, '--h': '-52px', animation: anim('lgxRise', 330) }} />
      <div className="lgx" style={{ left: '80%', top: '62%', width: 5, height: 5, borderRadius: '50%', background: '#ffffff', boxShadow: `0 0 8px ${BLOOD}`, '--h': '-56px', animation: anim('lgxRise', 330, 40) }} />
    </>,
    // Reaped (big): a colossal bone scythe sweeps a 300 deg arc, everything below the arc goes dark, a white cut splits
    // the arena, and ghost wisps flee upward.
    reap: () => <>
      {flash('#ffffff')}
      <div className="lgx" style={{ left: '-25%', right: '-25%', top: '48%', bottom: '-25%', background: 'linear-gradient(180deg, rgba(10,6,14,.0), rgba(10,6,14,.78) 30%, rgba(10,6,14,.85))', animation: anim('lgrReaperDark', 1150, 250) }} />
      <div className="lgx" style={{ left: '50%', top: '50%', width: '150%', height: '150%', borderRadius: '50%', background: 'conic-gradient(from 0deg, transparent 0deg, rgba(241,233,210,.0) 200deg, rgba(241,233,210,.55) 300deg, transparent 301deg)', animation: anim('lgrReaperSwing', 640, 0, 'cubic-bezier(.5,0,.3,1)') }} />
      <svg className="lgx" viewBox="-60 -60 120 120" style={{ left: '50%', top: '50%', width: '150%', height: '150%', overflow: 'visible', animation: anim('lgrReaperSwing', 640, 0, 'cubic-bezier(.5,0,.3,1)') }}>
        <path d="M0 0 L0 -54" stroke="#1a1214" strokeWidth="4" strokeLinecap="round" />
        <path d="M0 -54 C 18 -60, 42 -50, 54 -30 C 40 -42, 20 -46, 2 -44 Z" fill={BONE} stroke="#1a1214" strokeWidth="2" />
        <path d="M6 -50 C 22 -54, 38 -48, 48 -36" fill="none" stroke="#ffffff" strokeWidth="1.2" />
      </svg>
      <div className="lgx" style={{ left: '-20%', right: '-20%', top: '50%', height: 4, marginTop: -2, background: '#ffffff', boxShadow: `0 0 10px #ffffff, 0 0 18px ${BLOOD}`, transformOrigin: '0 50%', animation: anim('lgrReaperCut', 700, 430, SETTLE) }} />
      {around(7, (i) => <div key={i} className="lgx" style={{ left: `${14 + i * 12}%`, top: '58%', width: 12, height: 20, borderRadius: '50% 50% 45% 45% / 60% 60% 40% 40%', background: 'radial-gradient(circle at 50% 35%, #ffffff 0 30%, rgba(200,230,255,.7) 60%, transparent 100%)', '--h': `${-90 - (i % 3) * 18}px`, animation: anim('lgxRise', 620, 560 + (i % 4) * 60) }} />)}
    </>,
  },
  floaters: { climb: 'lg_fx_executeClimb', reap: 'lg_fx_executeReap' },
  floaterTone: { climb: 'danger', reap: 'ink' },
  demo: { climb: { kind: 'hit', damage: 2, lives: 0 }, reap: { kind: 'hit', damage: 6, lives: 0 } },
  juice: {
    climb: { size: 'tick', sfx: 'reaper.climb' },
    reap: { size: 'big', shake: 3, flash: 2, hitstop: 1, sfx: 'reaper.reap' },
  },
  // Reactions on the boss art box. Sever: a diagonal slit opens through him (the two halves part along it) and closes
  // again with a shudder. Lean: a 2 deg lean as the scythe line climbs.
  // The clip polygon is two triangles split along the box's anti-diagonal, drawn 30% past the box so the boss's
  // headroom (parts past his frame) is never cut; --g is the slit's width.
  css: `
.lgr-reaper-climb { animation: lgrReaperLean 300ms ease-out both; transform-origin: 50% 100% }
.lgr-reaper-reap { animation: lgrReaperSever 1000ms ${SETTLE} both }
.lg-boss[data-phase="3"] .lgr-reaper-reap { animation-name: lgrReaperSeverP3 }
@keyframes lgrReaperLean { 0%, 100% { transform: none } 45% { transform: rotate(6deg) translateY(2px) } 80% { transform: rotate(2deg) } }
@keyframes lgrReaperSever {
  0%, 100% { clip-path: polygon(-30% -30%, 130% -30%, -30% 130%, -30% 130%, -30% 130%, 130% -30%, 130% 130%, -30% 130%); transform: none }
  20%, 55% { clip-path: polygon(-30% -30%, 124% -30%, -30% 124%, -30% 130%, -24% 130%, 130% -24%, 130% 130%, -30% 130%); transform: translate(0, 0) }
  62% { transform: translate(-2px, 1px) } 68% { transform: translate(2px, -1px) } 74% { transform: translate(-1px, 0) }
  80% { clip-path: polygon(-30% -30%, 130% -30%, -30% 130%, -30% 130%, -30% 130%, 130% -30%, 130% 130%, -30% 130%); transform: none }
}
@keyframes lgrReaperSeverP3 {
  0%, 100% { clip-path: polygon(-30% -30%, 130% -30%, -30% 130%, -30% 130%, -30% 130%, 130% -30%, 130% 130%, -30% 130%); transform: none }
  20%, 58% { clip-path: polygon(-30% -30%, 121% -30%, -30% 121%, -30% 130%, -21% 130%, 130% -21%, 130% 130%, -30% 130%); transform: translate(0, 0) }
  64% { transform: translate(-3px, 1px) } 70% { transform: translate(3px, -1px) } 76% { transform: translate(-1.5px, 0) }
  84% { clip-path: polygon(-30% -30%, 130% -30%, -30% 130%, -30% 130%, -30% 130%, 130% -30%, 130% 130%, -30% 130%); transform: none }
}
@keyframes lgrReaperSwing { 0% { transform: translate(-50%, -50%) rotate(-200deg); opacity: 0 } 12% { opacity: 1 } 80% { opacity: 1 } 100% { transform: translate(-50%, -50%) rotate(100deg); opacity: 0 } }
@keyframes lgrReaperDark { 0% { opacity: 0 } 25% { opacity: 1 } 70% { opacity: .9 } 100% { opacity: 0 } }
@keyframes lgrReaperCut { 0% { transform: scaleX(0); opacity: 1 } 40% { transform: scaleX(1); opacity: 1 } 100% { transform: scaleX(1) scaleY(.2); opacity: 0 } }
/* fx-layer motion: in phase 3 the soul in its throat flickers out (opacity only, the soul wisp of the reap face) */
@keyframes lgrReaperSoulFlicker { 0% { opacity: 1 } 12% { opacity: .25 } 22% { opacity: .9 } 34% { opacity: .15 } 46% { opacity: .7 } 60% { opacity: .1 } 72% { opacity: .45 } 86% { opacity: .05 } 100% { opacity: .2 } }
.lg-boss[data-phase="3"][data-fx="reap"] .lg-p3 .lg-fx-reap > g[transform="translate(0 17.4)"] { animation: lgrReaperSoulFlicker 1100ms steps(1, end) both }
/* THE REAL PARTS: the state layer this ability draws on the boss (its lg-ab-* group in raids/reaper.svg) moves with
   the moment, not only the whole figure. Played only while data-fx is set (never in focus mode, with Still bosses or
   under reduced motion). */
@keyframes lgrReaperLineClimb { 0% { transform: translateY(5px) } 55% { transform: translateY(-2px) } 100% { transform: none } }
.lg-boss[data-fx="climb"] [class*="lg-ab-line-"] { transform-box: fill-box; transform-origin: center; animation: lgrReaperLineClimb 320ms cubic-bezier(.22,1,.36,1) both }
`,
}
