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
      {around(3, (i) => <div key={i} className="lgx" style={{ left: '40%', top: '62%', width: 6, height: 4, background: WOOD, '--a': `${60 + i * 25}deg`, '--d': '-38px', '--spin': '200deg', animation: anim('lgxShard', 320, 120) }} />)}
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
`,
}
