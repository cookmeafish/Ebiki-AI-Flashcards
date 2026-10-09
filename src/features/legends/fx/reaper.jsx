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
      {/* a bone scythe blade (dark-edged, blood glint on its edge) climbs the right side, leaving a red streak */}
      <div className="lgx" style={{ left: '82%', top: '22%', width: 4, height: '50%', marginLeft: -2, transformOrigin: 'bottom', background: `linear-gradient(to top, rgba(255,74,61,0), ${BLOOD})`, borderRadius: 2, animation: anim('lgrReaperStreak', 330) }} />
      <svg className="lgx" viewBox="0 0 40 24" style={{ left: '82%', top: '64%', width: 46, height: 28, marginLeft: -23, overflow: 'visible', filter: `drop-shadow(0 0 5px ${BLOOD})`, '--h': '-64px', animation: anim('lgxRise', 330) }} aria-hidden="true">
        <path d="M2 18C10 4 28 0 38 6 28 6 18 10 12 20Z" fill={BONE} stroke="#14080a" strokeWidth="2" strokeLinejoin="round" />
        <path d="M4 17C12 6 26 2 36 6" fill="none" stroke={BLOOD} strokeWidth="1.6" />
      </svg>
      <div className="lgx" style={{ left: '82%', top: '62%', width: 6, height: 6, marginLeft: -3, borderRadius: '50%', background: '#ffffff', boxShadow: `0 0 10px ${BLOOD}`, '--h': '-70px', animation: anim('lgxRise', 330, 40) }} />
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
@keyframes lgrReaperStreak { 0% { transform: scaleY(0); opacity: 0 } 30% { opacity: 1 } 70% { transform: scaleY(1); opacity: .9 } 100% { transform: scaleY(1); opacity: 0 } }
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
/* THE DRAWING'S OWN PARTS (raids/reaper.svg lg-reaper-*): their pivots, his attack on the player, how each ability
   moment moves them, and his knockout. Ability rules carry a doubled class (.lg-boss.lg-boss) so they win over a plain
   strike moment playing on the same part at the same time. */
.lg-boss[data-motif="reaper"] [class*="lg-reaper-"] { transform-box: fill-box; transform-origin: 50% 85% }
.lg-boss[data-motif="reaper"] .lg-reaper-scythe { transform-origin: 20% 30% }
.lg-boss[data-motif="reaper"] .lg-reaper-lantern { transform-origin: 50% 0 }
.lg-boss[data-motif="reaper"] .lg-reaper-jaw { transform-origin: 50% 0 }
/* His attack on the player (impact/AssaultFx: the scythe swings across the card in an arc and leaves a gash). The
   drawing does it: he hauls the scythe back over his shoulder and leans in grinning, then the blade comes down and
   across at you in one sweep, follows through past the heart, and is drawn back. */
@keyframes lgrReaperAsScythe { 0% { transform: none } 16% { transform: rotate(-42deg) translateY(-6%) } 38% { transform: rotate(62deg) translate(6%, 6%) scale(1.08) } 50% { transform: rotate(74deg) translate(7%, 7%) scale(1.08) } 75% { transform: rotate(30deg) translate(3%, 3%) } 100% { transform: none } }
@keyframes lgrReaperAsHead { 0% { transform: none } 16% { transform: translateY(-8%) rotate(-8deg) } 40% { transform: translateY(8%) rotate(6deg) scale(1.22) } 70% { transform: translateY(4%) scale(1.1) } 100% { transform: none } }
@keyframes lgrReaperAsJaw { 0% { transform: none } 16% { transform: translateY(-6%) } 40%, 70% { transform: translateY(26%) rotate(-6deg) } 100% { transform: none } }
.lg-boss[data-motif="reaper"][data-assault-on] .lg-reaper-scythe { animation: lgrReaperAsScythe 820ms cubic-bezier(.55,0,.2,1) both }
.lg-boss[data-motif="reaper"][data-assault-on] .lg-reaper-head { animation: lgrReaperAsHead 820ms cubic-bezier(.4,0,.2,1) both }
.lg-boss[data-motif="reaper"][data-assault-on] .lg-reaper-jaw { animation: lgrReaperAsJaw 820ms ease-out both }
/* Climb: the line creeps toward his health; he glances down at it, the scythe trembles in his hand. */
@keyframes lgrReaperNervous { 0%, 100% { transform: none } 40% { transform: rotate(8deg) translateY(5%) } 75% { transform: rotate(4deg) } }
@keyframes lgrReaperTremble { 0%, 100% { transform: none } 20% { transform: rotate(3deg) } 40% { transform: rotate(-3deg) } 60% { transform: rotate(2deg) } 80% { transform: rotate(-1deg) } }
.lg-boss.lg-boss[data-fx="climb"] .lg-reaper-head { animation: lgrReaperNervous 330ms ease-out both }
.lg-boss.lg-boss[data-fx="climb"] .lg-reaper-scythe { animation: lgrReaperTremble 330ms linear both }
/* Reap: your line reaches him and he is executed in kind: the skull is struck clean up and back with the jaw hanging,
   the scythe is torn from his grip and spins away, the lantern swings wild and gutters; then he pulls himself back. */
@keyframes lgrReaperReapHead { 0% { transform: none } 12% { transform: translate(-6%, -22%) rotate(-24deg) scale(.9) } 45% { transform: translate(-4%, -16%) rotate(-18deg) scale(.92) } 62% { transform: translate(2%, 4%) rotate(6deg) } 100% { transform: none } }
@keyframes lgrReaperReapJaw { 0% { transform: none } 12%, 55% { transform: translateY(34%) rotate(12deg) } 100% { transform: none } }
@keyframes lgrReaperReapScythe { 0% { transform: none } 14% { transform: rotate(-70deg) translate(-10%, -8%) } 34% { transform: rotate(-150deg) translate(-14%, -6%) scale(.92) } 60% { transform: rotate(-40deg) } 100% { transform: none } }
@keyframes lgrReaperReapLantern { 0% { transform: none; filter: none } 12% { transform: rotate(48deg); filter: brightness(2) } 30% { transform: rotate(-36deg); filter: brightness(.4) } 50% { transform: rotate(22deg); filter: brightness(1.3) } 70% { transform: rotate(-10deg); filter: brightness(.6) } 100% { transform: none; filter: none } }
.lg-boss.lg-boss[data-fx="reap"] .lg-reaper-head { animation: lgrReaperReapHead 1150ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss.lg-boss[data-fx="reap"] .lg-reaper-jaw { animation: lgrReaperReapJaw 1150ms ease-out both }
.lg-boss.lg-boss[data-fx="reap"] .lg-reaper-scythe { animation: lgrReaperReapScythe 1150ms cubic-bezier(.2,.8,.3,1) both }
.lg-boss.lg-boss[data-fx="reap"] .lg-reaper-lantern { animation: lgrReaperReapLantern 1150ms ease-out both }
/* THE KNOCKOUT (data-moment="ko", kept here because its 2200 ms outlasts the shortest knockout and the impact layer
   style is shared by every boss): his own scythe turns on him (its swing at 150 ms), he reels, the lantern gutters
   out, and at the climax (1250) the scythe drops from his hand, the jaw falls and the skull sags as the souls flee. */
@keyframes lgrReaperKoScythe { 0% { transform: none } 10% { transform: rotate(-30deg) } 24% { transform: rotate(40deg) } 40%, 54% { transform: rotate(18deg) } 60% { transform: rotate(70deg) translate(14%, 26%) } 66% { transform: rotate(64deg) translate(14%, 24%) } 92% { transform: rotate(66deg) translate(14%, 25%) } 100% { transform: none } }
@keyframes lgrReaperKoHead { 0% { transform: none } 12% { transform: translateY(-10%) rotate(-12deg) } 40%, 54% { transform: translateY(-4%) rotate(-6deg) } 62% { transform: translateY(16%) rotate(14deg) scale(.92) } 92% { transform: translateY(14%) rotate(12deg) scale(.92) } 100% { transform: none } }
@keyframes lgrReaperKoJaw { 0% { transform: none } 12%, 54% { transform: translateY(14%) } 62%, 92% { transform: translateY(36%) rotate(14deg) } 100% { transform: none } }
@keyframes lgrReaperKoLantern { 0% { transform: none; filter: none } 14% { transform: rotate(30deg); filter: brightness(1.8) } 30% { transform: rotate(-20deg); filter: brightness(.7) } 46% { transform: rotate(10deg); filter: brightness(1.2) } 58% { transform: rotate(-4deg); filter: brightness(.25) saturate(0) } 92% { transform: none; filter: brightness(.25) saturate(0) } 100% { transform: none; filter: none } }
.lg-boss[data-motif="reaper"][data-moment="ko"] .lg-reaper-scythe { animation: lgrReaperKoScythe 2200ms linear both }
.lg-boss[data-motif="reaper"][data-moment="ko"] .lg-reaper-head { animation: lgrReaperKoHead 2200ms linear both }
.lg-boss[data-motif="reaper"][data-moment="ko"] .lg-reaper-jaw { animation: lgrReaperKoJaw 2200ms linear both }
.lg-boss[data-motif="reaper"][data-moment="ko"] .lg-reaper-lantern { animation: lgrReaperKoLantern 2200ms linear both }
`,
}
