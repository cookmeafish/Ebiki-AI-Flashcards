// What the Puppeteer's Stolen Puppets (puppets) LOOK like. The fx contract is in fx/index.js, the juice format in
// fx/_juice.js. Fixed bright colors; BossArena skips all of it in focus mode, with Still bosses and under reduced
// motion. The floater already starts with the answer's damage, so the texts never repeat the number.
import { anim, around } from './_kit'

const WOOD = '#d9a066'
const GOLD = '#ffd75a'

// A wooden marionette silhouette (head, body, arms, legs), drawn at the given style.
const puppet = (style) => (
  <svg className="lgx" viewBox="0 0 30 50" style={{ width: 30, height: 50, ...style }}>
    <circle cx="15" cy="7" r="6" fill={WOOD} stroke="#5a3519" strokeWidth="1.5" />
    <rect x="10" y="14" width="10" height="16" rx="3" fill={WOOD} stroke="#5a3519" strokeWidth="1.5" />
    <path d="M10 17 L3 26 M20 17 L27 24 M12 30 L9 46 M18 30 L26 42" stroke={WOOD} strokeWidth="3.5" strokeLinecap="round" />
  </svg>
)

export default {
  effects: {
    // Kick (tick): one of your puppets hops in and kicks; three wood chips fly.
    kick: () => <>
      {puppet({ left: '8%', bottom: '2%', animation: anim('lgrPuppeteerHopKick', 340) })}
      {/* the kick connects: a cartoon impact star and wood chips */}
      <div className="lgx" style={{ left: '40%', top: '62%', width: 40, height: 40, margin: '-20px 0 0 -20px', background: GOLD, clipPath: 'polygon(50% 0, 60% 32%, 95% 20%, 70% 48%, 100% 70%, 62% 66%, 55% 100%, 42% 68%, 6% 82%, 30% 52%, 0 26%, 38% 32%)', filter: 'drop-shadow(0 0 2px #1a0006) drop-shadow(0 0 6px #ffd75a)', animation: anim('lgrPuppeteerPow', 200, 130, 'cubic-bezier(.2,1.5,.4,1)') }} />
      {around(6, (i) => <div key={i} className="lgx" style={{ left: '40%', top: '62%', width: 10, height: 6, background: WOOD, border: '1px solid #1a0006', '--a': `${20 + i * 30}deg`, '--d': '-48px', '--spin': '200deg', animation: anim('lgxShard', 320, 120) }} />)}
    </>,
    // Steal (big): three taut golden strings snap one by one and recoil, and a puppet drops to your side.
    steal: () => <>
      {[28, 50, 72].map((x, i) => <div key={x} className="lgx" style={{ left: `${x}%`, top: '-45%', width: 3, height: '95%', background: `linear-gradient(${GOLD}, #fff)`, boxShadow: `0 0 8px ${GOLD}`, transformOrigin: 'top', '--r': `${(i - 1) * 18 || 12}deg`, animation: anim('lgxSnap', 760, i * 140) }} />)}
      {[28, 50, 72].map((x, i) => <div key={`k${x}`} className="lgx" style={{ left: `${x}%`, top: '40%', width: 14, height: 14, marginLeft: -7, borderRadius: '50%', background: 'radial-gradient(circle, #fff 0 30%, rgba(255,215,90,.9) 50%, transparent 72%)', animation: anim('lgrPuppeteerSpark', 360, 200 + i * 140) }} />)}
      {puppet({ left: '6%', top: '-10%', animation: anim('lgrPuppeteerDrop', 1000, 420) })}
    </>,
    // Yank (medium): a string whips down, hooks a puppet on your side and reels it back up.
    yank: () => <>
      <div className="lgx" style={{ left: '14%', top: '-45%', width: 3, height: '100%', background: `linear-gradient(${GOLD}, #fff)`, boxShadow: `0 0 8px ${GOLD}`, transformOrigin: 'top', animation: anim('lgrPuppeteerWhip', 780) }} />
      {puppet({ left: '8%', bottom: '2%', animation: anim('lgrPuppeteerYankUp', 780, 120) })}
    </>,
  },
  floaters: { kick: 'lg_fx_puppetsKick', steal: 'lg_fx_puppetsSteal', yank: 'lg_fx_puppetsYank' },
  floaterTone: { kick: 'warning', steal: 'success', yank: 'danger' },
  juice: {
    kick: { size: 'tick', sfx: 'puppeteer.kick' },
    steal: { size: 'big', shake: 2, flash: 2, hitstop: 1, sfx: 'puppeteer.steal' },
    yank: { size: 'medium', shake: 1, flash: 1, hitstop: 1, sfx: 'puppeteer.yank' },
  },
  demo: { kick: { damage: 3, fxVars: { n: 1 } }, steal: { damage: 2, fxVars: { n: 1 } }, yank: { kind: 'hit', damage: 1, lives: 1, fxVars: { n: 0 } } },
  // Reactions (body only; the mask layers come with the art pass): steal = yanked up 12 px, then dangling like a
  // pendulum from the top; yank = reels back toward the top left; kick = a 1.5 px dip.
  css: `
@keyframes lgrPuppeteerPow { 0% { transform: scale(.2) rotate(-30deg); opacity: 0 } 50% { transform: scale(1.2) rotate(6deg); opacity: 1 } 100% { transform: scale(1.3); opacity: 0 } }
@keyframes lgrPuppeteerHopKick { 0% { transform: translate(0, 0) rotate(0); opacity: 0 } 25% { transform: translate(18px, -14px) rotate(-10deg); opacity: 1 } 55% { transform: translate(40px, -6px) rotate(25deg); opacity: 1 } 100% { transform: translate(30px, 0) rotate(0); opacity: 0 } }
@keyframes lgrPuppeteerSpark { 0% { transform: scale(.2); opacity: 0 } 30% { transform: scale(1.6); opacity: 1 } 100% { transform: scale(.6); opacity: 0 } }
@keyframes lgrPuppeteerDrop { 0% { transform: translateY(-20px) rotate(-30deg); opacity: 0 } 15% { opacity: 1 } 55% { transform: translateY(96px) rotate(8deg); opacity: 1 } 70% { transform: translateY(86px) rotate(-4deg) } 85% { transform: translateY(96px) rotate(0); opacity: 1 } 100% { transform: translateY(96px); opacity: 0 } }
@keyframes lgrPuppeteerWhip { 0% { transform: scaleY(0) rotate(-14deg); opacity: 0 } 25% { transform: scaleY(1) rotate(6deg); opacity: 1 } 45% { transform: scaleY(1) rotate(0) } 100% { transform: scaleY(.25) rotate(0); opacity: 0 } }
@keyframes lgrPuppeteerYankUp { 0%, 30% { transform: translateY(0); opacity: 1 } 75% { transform: translateY(-90px) rotate(-12deg); opacity: 1 } 100% { transform: translateY(-120px) rotate(-16deg); opacity: 0 } }
@keyframes lgrPuppeteerJerk { 0% { transform: none } 12% { transform: translateY(-12px) } 30% { transform: translateY(-4px) rotate(4deg) } 48% { transform: translateY(-2px) rotate(-4deg) } 64% { transform: rotate(3deg) } 80% { transform: rotate(-2deg) } 100% { transform: none } }
@keyframes lgrPuppeteerReel { 0%, 100% { transform: none } 40% { transform: translate(-6px, -6px) rotate(-2deg) } }
@keyframes lgrPuppeteerBob { 0%, 100% { transform: none } 40% { transform: translateY(-6px) rotate(-3deg) } 75% { transform: translateY(1px) rotate(1deg) } }
.lgr-puppeteer-steal { animation: lgrPuppeteerJerk 1100ms cubic-bezier(.22,1,.36,1) both; transform-origin: top center }
.lgr-puppeteer-yank { animation: lgrPuppeteerReel 600ms cubic-bezier(.22,1,.36,1) both }
.lgr-puppeteer-kick { animation: lgrPuppeteerBob 320ms ease-out both }
/* fx-layer motion: in phase 3 the masks titter, a quick shaking flick of each mask in place (the yank face layers) */
@keyframes lgrPuppeteerTitter { 0%, 100% { transform: none } 15% { transform: rotate(-9deg) } 30% { transform: rotate(7deg) } 45% { transform: rotate(-6deg) } 60% { transform: rotate(4deg) } 78% { transform: rotate(-2deg) } }
.lg-boss[data-phase="3"][data-fx="yank"] .lg-p3 .lg-fx-yank { transform-box: fill-box; transform-origin: center; animation: lgrPuppeteerTitter 600ms ease-in-out both }
/* THE REAL PARTS: the state layer this ability draws on the boss (its lg-ab-* group in raids/puppeteer.svg) moves with
   the moment, not only the whole figure. Played only while data-fx is set (never in focus mode, with Still bosses or
   under reduced motion). */
@keyframes lgrPuppeteerPuppetFlash { 0%, 100% { filter: none } 35% { filter: brightness(1.9) drop-shadow(0 0 3px #fff3c4) } }
.lg-boss[data-fx="kick"] [class*="lg-ab-puppets-"], .lg-boss[data-fx="steal"] [class*="lg-ab-puppets-"] { transform-box: fill-box; transform-origin: center; animation: lgrPuppeteerPuppetFlash 320ms cubic-bezier(.22,1,.36,1) both }
/* THE ATTACK ON THE PLAYER (impact/assault.js chain + drain; data-assault-on while it plays, land at about 400 ms):
   the right hand winds back, then FLINGS its strings out of the box at your heart, the left hand follows, and both reel
   it in with hard jerks (the drain) while the mask leans after it grinning. Inner wrappers (-handRA/-handLA/-maskA), so
   the strike moment's own moves on the outer ones play over it. */
@keyframes lgrPuppeteerFlingR { 0% { transform: none } 8% { transform: translate(-7%, -10%) rotate(-18deg) } 24% { transform: translate(16%, 8%) rotate(18deg) scale(1.12) } 30% { transform: translate(13%, 6%) rotate(14deg) scale(1.08) } 42% { transform: translate(3%, -2%) rotate(2deg) } 50% { transform: translate(9%, 3%) rotate(9deg) } 58% { transform: translate(1%, -3%) rotate(0) } 66% { transform: translate(7%, 2%) rotate(7deg) } 76% { transform: translate(-1%, -3%) rotate(-2deg) } 100% { transform: none } }
@keyframes lgrPuppeteerFlingL { 0% { transform: none } 12% { transform: translate(-4%, -6%) rotate(-10deg) } 28% { transform: translate(9%, 6%) rotate(12deg) } 44% { transform: translate(1%, -2%) rotate(-2deg) } 54% { transform: translate(6%, 3%) rotate(6deg) } 64% { transform: translate(0, -2%) } 74% { transform: translate(4%, 1%) rotate(3deg) } 100% { transform: none } }
@keyframes lgrPuppeteerLeer { 0% { transform: none } 8% { transform: rotate(-7deg) scale(.96) } 26% { transform: translateX(7%) rotate(9deg) scale(1.1) } 50% { transform: translateX(5%) rotate(6deg) scale(1.07) } 66% { transform: translateX(6%) rotate(8deg) scale(1.1) } 100% { transform: none } }
.lg-boss[data-motif="puppeteer"][data-assault-on] .lg-puppeteer-handRA { animation: lgrPuppeteerFlingR 1350ms cubic-bezier(.3,.7,.3,1) both }
.lg-boss[data-motif="puppeteer"][data-assault-on] .lg-puppeteer-handLA { animation: lgrPuppeteerFlingL 1350ms cubic-bezier(.3,.7,.3,1) 40ms both }
.lg-boss[data-motif="puppeteer"][data-assault-on] .lg-puppeteer-maskA { animation: lgrPuppeteerLeer 1350ms cubic-bezier(.3,.7,.3,1) both }
/* THE ABILITY ON THE REAL PARTS: kick = the marionette's shin is kicked out (it buckles sideways, the mask glares);
   steal = the left hand's strings snap and it jerks up EMPTY, clutching air, while the mask gapes; yank = the right hand
   reels a string in hard over its shoulder, the mask grinning after it. */
@keyframes lgrPuppeteerBuckle { 0% { transform: none } 18% { transform: translateX(-6%) rotate(-10deg) translateY(3%) } 40% { transform: translateX(3%) rotate(5deg) } 70% { transform: rotate(-2deg) } 100% { transform: none } }
@keyframes lgrPuppeteerGlare { 0%, 100% { transform: none } 25% { transform: rotate(-5deg) scale(1.04, .96) } }
@keyframes lgrPuppeteerSnapUp { 0% { transform: none } 12% { transform: translate(-3%, -16%) rotate(-24deg) } 22% { transform: translate(-2%, -12%) rotate(-14deg) } 30% { transform: translate(-3%, -15%) rotate(-22deg) } 40% { transform: translate(-2%, -12%) rotate(-12deg) } 70% { transform: translate(0, -4%) rotate(-4deg) } 100% { transform: none } }
@keyframes lgrPuppeteerGape { 0% { transform: none } 14% { transform: scale(.94, 1.14) translateY(-3%) } 60% { transform: scale(.97, 1.07) translateY(-1%) } 100% { transform: none } }
@keyframes lgrPuppeteerReelR { 0% { transform: none } 22% { transform: translate(6%, 6%) rotate(10deg) } 48% { transform: translate(-6%, -14%) rotate(-26deg) } 62% { transform: translate(-4%, -11%) rotate(-20deg) } 100% { transform: none } }
@keyframes lgrPuppeteerSmirk { 0% { transform: none } 40% { transform: translateX(3%) rotate(7deg) } 100% { transform: none } }
.lg-boss[data-motif="puppeteer"][data-fx="kick"] .lg-puppeteer-doll, .lg-boss[data-motif="puppeteer"][data-fx="kick"] .lg-puppeteer-spider { animation: lgrPuppeteerBuckle 420ms cubic-bezier(.2,.9,.3,1) 120ms both }
.lg-boss[data-motif="puppeteer"][data-fx="kick"] .lg-puppeteer-mask { animation: lgrPuppeteerGlare 420ms ease-out 120ms both }
.lg-boss[data-motif="puppeteer"][data-fx="steal"] .lg-puppeteer-handL { animation: lgrPuppeteerSnapUp 1100ms cubic-bezier(.2,.9,.3,1) both }
.lg-boss[data-motif="puppeteer"][data-fx="steal"] .lg-puppeteer-mask { animation: lgrPuppeteerGape 1000ms ease-out both }
.lg-boss[data-motif="puppeteer"][data-fx="yank"] .lg-puppeteer-handR { animation: lgrPuppeteerReelR 780ms cubic-bezier(.3,.8,.3,1) both }
.lg-boss[data-motif="puppeteer"][data-fx="yank"] .lg-puppeteer-mask { animation: lgrPuppeteerSmirk 780ms ease-out both }
`,
}
