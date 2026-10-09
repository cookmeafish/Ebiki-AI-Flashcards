// PUPPETEER's own impact parts: drawers merged into impact/parts.jsx PARTS. Name each `puppeteer<Name>` (never clashes).
// A drawer is (params, ctx) => node, like the shared ones (ctx: color, accent, glyph, scale, speed); CSS keyframes it
// needs go in `css` (prefix them lgpuppeteer). Deterministic, container units, transforms and opacity only.
//
// THE DRAWING ACTS EVERY MOMENT (raids/puppeteer.svg wrappers, all transform-box: fill-box):
//   .lg-puppeteer-mask   the porcelain mask (pivot near its eyes)      .lg-puppeteer-cloak  its shadow cloak
//   .lg-puppeteer-handL / -handR   the needle hands with their control bars and strings (pivot at the wrist)
//   .lg-puppeteer-doll   the marionette, hung from the top (phases 1 and 2)
//   .lg-puppeteer-spider the string spider (phase 3)                    .lg-puppeteer-rig    hands + marionette together
//   (-maskA, -handLA, -handRA are inner wrappers the attack on the player moves: fx/puppeteer.jsx)
// hit      the marionette's strings go slack: it drops and swings like a pendulum, the mask winces
// crit     the marionette is spun a full turn on its strings, the hands are thrown apart, the mask squashes
// sharpen  the left strings are cut: the left hand jerks up empty, the marionette lurches onto its right side
// strike   (after its strings hook your heart) the mask lunges at the camera grinning, the marionette stabs forward
// heavy    both hands rise high and SLAM the control bars down: the marionette is smashed into the stage
// block    the marionette is yanked back behind its crossed swords, the hands splay out, the mask jolts back
// shield   both hands jab at you, glance off and bounce away; the marionette skids sideways
// wind     the mask tilts in disbelief, the hands go limp, the marionette sags on slack strings
// ko       it dances in jerks, the strings are cut: the hands fling up and away, the mask cracks and falls, the marionette
//          crumples into a heap of wood
const SEL = (moment, part) => `.lg-boss[data-motif="puppeteer"][data-moment="${moment}"] .lg-puppeteer-${part}`
// Written as longhands (name, duration, easing, delay): the part rules live in the global impact CSS.
const longhand = (a) => {
  const t = a.match(/cubic-bezier\([^)]*\)|\S+/g)
  const times = t.filter((x) => /^[\d.]+ms$/.test(x))
  const ease = t.find((x) => /^(cubic-bezier|ease|linear)/.test(x)) || 'ease'
  return `animation-name: ${t[0]}; animation-duration: ${times[0]}; animation-timing-function: ${ease}; animation-delay: ${times[1] || '0ms'}; animation-fill-mode: both`
}
const rule = (moment, part, anim) => `${SEL(moment, part)} { ${longhand(anim)} }`

export const css = `
@keyframes lgpuppeteerSlack { 0% { transform: none } 12% { transform: translateY(6%) rotate(-9deg) } 34% { transform: translateY(3%) rotate(8deg) } 54% { transform: translateY(1%) rotate(-5deg) } 74% { transform: rotate(2.5deg) } 100% { transform: none } }
@keyframes lgpuppeteerWince { 0% { transform: none } 14% { transform: translateY(-3%) rotate(7deg) scale(.96) } 46% { transform: rotate(-2deg) } 100% { transform: none } }
@keyframes lgpuppeteerSpinDoll { 0% { transform: none } 12% { transform: rotate(-24deg) scale(.94) } 58% { transform: rotate(385deg) scale(1.04) } 76% { transform: rotate(352deg) } 90% { transform: rotate(363deg) } 100% { transform: rotate(360deg) } }
@keyframes lgpuppeteerThrowL { 0% { transform: none } 14% { transform: translate(-7%, -9%) rotate(-16deg) } 46% { transform: translate(-2%, -3%) rotate(-5deg) } 100% { transform: none } }
@keyframes lgpuppeteerThrowR { 0% { transform: none } 14% { transform: translate(7%, -9%) rotate(16deg) } 46% { transform: translate(2%, -3%) rotate(5deg) } 100% { transform: none } }
@keyframes lgpuppeteerSquash { 0% { transform: none } 12% { transform: scale(1.12, .8) } 30% { transform: scale(.93, 1.08) } 50% { transform: scale(1.03, .97) } 100% { transform: none } }
@keyframes lgpuppeteerCutL { 0% { transform: none } 9% { transform: translateY(-16%) rotate(-28deg) } 30% { transform: translateY(-11%) rotate(-20deg) } 60% { transform: translateY(-3%) rotate(-6deg) } 100% { transform: none } }
@keyframes lgpuppeteerLurch { 0% { transform: none } 12% { transform: translateY(5%) rotate(17deg) } 36% { transform: translateY(3%) rotate(11deg) } 62% { transform: rotate(-4deg) } 82% { transform: rotate(2deg) } 100% { transform: none } }
@keyframes lgpuppeteerSnarl { 0%, 100% { transform: none } 12% { transform: translateX(-3%) rotate(-4deg) } 24% { transform: translateX(3%) rotate(4deg) } 36% { transform: translateX(-2%) rotate(-2deg) } 50% { transform: none } }
@keyframes lgpuppeteerLungeMask { 0% { transform: none } 18% { transform: translateY(-5%) scale(.95) } 40% { transform: translateY(12%) scale(1.26) } 62% { transform: translateY(5%) scale(1.1) } 100% { transform: none } }
@keyframes lgpuppeteerStab { 0% { transform: none } 22% { transform: translateY(-7%) scale(.96) } 42% { transform: translateY(7%) scale(1.16) } 64% { transform: translateY(2%) scale(1.04) } 100% { transform: none } }
@keyframes lgpuppeteerSlamL { 0% { transform: none } 30% { transform: translate(-5%, -20%) rotate(-22deg) } 44% { transform: translate(1%, 16%) rotate(12deg) } 54% { transform: translate(0, 10%) rotate(7deg) } 100% { transform: none } }
@keyframes lgpuppeteerSlamR { 0% { transform: none } 30% { transform: translate(5%, -20%) rotate(22deg) } 44% { transform: translate(-1%, 16%) rotate(-12deg) } 54% { transform: translate(0, 10%) rotate(-7deg) } 100% { transform: none } }
@keyframes lgpuppeteerSmash { 0% { transform: none } 30% { transform: translateY(-15%) scale(.95, 1.06) } 44% { transform: translateY(11%) scale(1.18, .78) } 56% { transform: translateY(6%) scale(.96, 1.06) } 70% { transform: translateY(2%) scale(1.02, .98) } 100% { transform: none } }
@keyframes lgpuppeteerRear { 0% { transform: none } 30% { transform: translateY(-7%) rotate(-5deg) } 44% { transform: translateY(9%) scale(1.14) } 100% { transform: none } }
@keyframes lgpuppeteerYankBack { 0% { transform: none } 14% { transform: translateY(-8%) scale(.9) } 38% { transform: translateY(-4%) scale(.95) rotate(-3deg) } 60% { transform: rotate(2deg) } 100% { transform: none } }
@keyframes lgpuppeteerSplayL { 0% { transform: none } 16% { transform: translate(-5%, 2%) rotate(-13deg) } 50% { transform: rotate(-4deg) } 100% { transform: none } }
@keyframes lgpuppeteerSplayR { 0% { transform: none } 16% { transform: translate(5%, 2%) rotate(13deg) } 50% { transform: rotate(4deg) } 100% { transform: none } }
@keyframes lgpuppeteerJolt { 0% { transform: none } 14% { transform: translateY(-4%) scale(.93) } 40% { transform: translateY(1%) scale(1.02) } 100% { transform: none } }
@keyframes lgpuppeteerJabL { 0% { transform: none } 24% { transform: translate(9%, 7%) rotate(11deg) scale(1.06) } 38% { transform: translate(-6%, -5%) rotate(-12deg) } 60% { transform: translate(-2%, -1%) rotate(-3deg) } 100% { transform: none } }
@keyframes lgpuppeteerJabR { 0% { transform: none } 24% { transform: translate(-9%, 7%) rotate(-11deg) scale(1.06) } 38% { transform: translate(6%, -5%) rotate(12deg) } 60% { transform: translate(2%, -1%) rotate(3deg) } 100% { transform: none } }
@keyframes lgpuppeteerSkid { 0% { transform: none } 30% { transform: none } 42% { transform: translateX(9%) rotate(8deg) } 64% { transform: translateX(4%) rotate(-3deg) } 100% { transform: none } }
@keyframes lgpuppeteerDisbelief { 0% { transform: none } 30% { transform: rotate(-11deg) translateY(3%) } 70% { transform: rotate(-9deg) translateY(2%) } 100% { transform: none } }
@keyframes lgpuppeteerLimpL { 0% { transform: none } 30% { transform: translateY(6%) rotate(16deg) } 72% { transform: translateY(5%) rotate(13deg) } 100% { transform: none } }
@keyframes lgpuppeteerLimpR { 0% { transform: none } 30% { transform: translateY(6%) rotate(-16deg) } 72% { transform: translateY(5%) rotate(-13deg) } 100% { transform: none } }
@keyframes lgpuppeteerSag { 0% { transform: none } 34% { transform: translateY(9%) scale(1, .94) rotate(3deg) } 72% { transform: translateY(7%) scale(1, .95) rotate(-2deg) } 100% { transform: none } }
@keyframes lgpuppeteerKoHandL { 0% { transform: none } 10% { transform: translate(-3%, -8%) rotate(-12deg) } 20% { transform: translate(2%, 4%) rotate(6deg) } 30% { transform: translate(-3%, -6%) rotate(-10deg) } 46% { transform: translate(0, 2%) rotate(3deg) } 50% { transform: translate(-6%, -12%) rotate(-24deg) } 100% { transform: translate(-34%, -58%) rotate(-70deg) } }
@keyframes lgpuppeteerKoHandR { 0% { transform: none } 10% { transform: translate(3%, -8%) rotate(12deg) } 20% { transform: translate(-2%, 4%) rotate(-6deg) } 30% { transform: translate(3%, -6%) rotate(10deg) } 46% { transform: translate(0, 2%) rotate(-3deg) } 50% { transform: translate(6%, -12%) rotate(24deg) } 100% { transform: translate(34%, -58%) rotate(70deg) } }
@keyframes lgpuppeteerKoDoll { 0% { transform: none } 8% { transform: rotate(-12deg) translateY(-3%) } 16% { transform: rotate(10deg) } 24% { transform: rotate(-8deg) translateY(-4%) } 34% { transform: rotate(9deg) } 44% { transform: rotate(-4deg) translateY(-2%) } 49% { transform: translateY(-5%) } 58% { transform: translateY(30%) scale(1.08, .55) rotate(14deg); animation-timing-function: ease-out } 66% { transform: translateY(24%) scale(.95, .66) rotate(19deg) } 74% { transform: translateY(30%) scale(1.04, .58) rotate(17deg) } 100% { transform: translateY(30%) scale(1.04, .58) rotate(18deg) } }
@keyframes lgpuppeteerKoMask { 0% { transform: none } 10% { transform: translateX(-2%) rotate(-3deg) } 20% { transform: translateX(2%) rotate(3deg) } 30% { transform: translateX(-2%) rotate(-3deg) } 46% { transform: scale(1.08) } 58% { transform: translateY(6%) rotate(10deg) scale(1.02) } 64% { transform: translateY(4%) rotate(7deg) } 100% { transform: translateY(16%) rotate(17deg) scale(.96) } }
@keyframes lgpuppeteerKoCloak { 0% { transform: none } 55% { transform: none } 100% { transform: translateY(10%) scale(1, .82) } }
@keyframes lgpuppeteerKoSpider { 0% { transform: none } 12% { transform: rotate(-6deg) } 24% { transform: rotate(6deg) } 36% { transform: rotate(-4deg) } 50% { transform: translateY(-4%) } 60% { transform: translateY(26%) scale(1.12, .55) } 70% { transform: translateY(20%) scale(.96, .66) } 100% { transform: translateY(26%) scale(1.06, .58) } }
@keyframes lgpuppeteerSpiderHit { 0% { transform: none } 14% { transform: translateY(5%) scale(1.08, .9) } 40% { transform: translateY(-2%) scale(.96, 1.05) } 100% { transform: none } }
@keyframes lgpuppeteerSpiderPounce { 0% { transform: none } 26% { transform: translateY(-10%) scale(.92, 1.1) } 44% { transform: translateY(10%) scale(1.22, .82) } 66% { transform: translateY(2%) scale(1.04) } 100% { transform: none } }
@keyframes lgpuppeteerHookFall { 0% { transform: translate(-50%, -140%) rotate(-30deg); opacity: 0 } 22% { opacity: 1 } 46% { transform: translate(-50%, -8%) rotate(8deg) scale(1.15); opacity: 1 } 54% { transform: translate(-50%, -14%) rotate(-4deg) scale(1.3) } 66% { transform: translate(-50%, 6%) rotate(0) scale(1.9); opacity: 1 } 100% { transform: translate(-50%, 30%) scale(2.4); opacity: 0 } }
@keyframes lgpuppeteerHookLine { 0% { transform: scaleY(0); opacity: 0 } 20% { opacity: 1 } 46% { transform: scaleY(1) } 100% { transform: scaleY(1.2); opacity: 0 } }
@keyframes lgpuppeteerBar { 0% { transform: translate(-50%, -260%) rotate(-14deg); opacity: 0 } 30% { transform: translate(-50%, -200%) rotate(-18deg); opacity: 1 } 44% { transform: translate(-50%, -30%) rotate(4deg) scale(1.15, .9) } 52% { transform: translate(-50%, -44%) rotate(-2deg) } 62% { transform: translate(-50%, -36%) rotate(0) } 86% { opacity: 1 } 100% { transform: translate(-50%, -30%); opacity: 0 } }
${rule('hit', 'doll', 'lgpuppeteerSlack 640ms cubic-bezier(.2,.8,.3,1) both')}
${rule('hit', 'mask', 'lgpuppeteerWince 520ms ease-out both')}
${rule('hit', 'spider', 'lgpuppeteerSpiderHit 520ms ease-out both')}
${rule('crit', 'doll', 'lgpuppeteerSpinDoll 760ms cubic-bezier(.3,.9,.3,1) both')}
${rule('crit', 'handL', 'lgpuppeteerThrowL 640ms cubic-bezier(.2,.9,.3,1) both')}
${rule('crit', 'handR', 'lgpuppeteerThrowR 640ms cubic-bezier(.2,.9,.3,1) both')}
${rule('crit', 'mask', 'lgpuppeteerSquash 620ms ease-out both')}
${rule('crit', 'spider', 'lgpuppeteerSquash 620ms ease-out both')}
${rule('sharpen', 'handL', 'lgpuppeteerCutL 720ms cubic-bezier(.15,.9,.3,1) both')}
${rule('sharpen', 'doll', 'lgpuppeteerLurch 760ms cubic-bezier(.2,.8,.3,1) both')}
${rule('sharpen', 'mask', 'lgpuppeteerSnarl 560ms linear both')}
${rule('sharpen', 'spider', 'lgpuppeteerLurch 760ms cubic-bezier(.2,.8,.3,1) both')}
${rule('hurt', 'mask', 'lgpuppeteerLungeMask 640ms cubic-bezier(.3,.7,.3,1) 220ms both')}
${rule('hurt', 'doll', 'lgpuppeteerStab 600ms cubic-bezier(.3,.7,.3,1) 160ms both')}
${rule('hurt', 'spider', 'lgpuppeteerSpiderPounce 620ms cubic-bezier(.3,.7,.3,1) 160ms both')}
${rule('hurtBig', 'handL', 'lgpuppeteerSlamL 820ms cubic-bezier(.4,0,.2,1) both')}
${rule('hurtBig', 'handR', 'lgpuppeteerSlamR 820ms cubic-bezier(.4,0,.2,1) both')}
${rule('hurtBig', 'doll', 'lgpuppeteerSmash 820ms cubic-bezier(.4,0,.2,1) both')}
${rule('hurtBig', 'mask', 'lgpuppeteerRear 820ms cubic-bezier(.4,0,.2,1) both')}
${rule('hurtBig', 'spider', 'lgpuppeteerSmash 820ms cubic-bezier(.4,0,.2,1) both')}
${rule('block', 'doll', 'lgpuppeteerYankBack 640ms cubic-bezier(.2,.9,.3,1) both')}
${rule('block', 'handL', 'lgpuppeteerSplayL 600ms ease-out both')}
${rule('block', 'handR', 'lgpuppeteerSplayR 600ms ease-out both')}
${rule('block', 'mask', 'lgpuppeteerJolt 560ms ease-out both')}
${rule('block', 'spider', 'lgpuppeteerYankBack 640ms cubic-bezier(.2,.9,.3,1) both')}
${rule('shield', 'handL', 'lgpuppeteerJabL 700ms cubic-bezier(.3,.8,.3,1) both')}
${rule('shield', 'handR', 'lgpuppeteerJabR 700ms cubic-bezier(.3,.8,.3,1) both')}
${rule('shield', 'doll', 'lgpuppeteerSkid 700ms ease-out both')}
${rule('shield', 'spider', 'lgpuppeteerSkid 700ms ease-out both')}
${rule('wind', 'mask', 'lgpuppeteerDisbelief 1000ms ease-in-out both')}
${rule('wind', 'handL', 'lgpuppeteerLimpL 1000ms ease-in-out both')}
${rule('wind', 'handR', 'lgpuppeteerLimpR 1000ms ease-in-out both')}
${rule('wind', 'doll', 'lgpuppeteerSag 1000ms ease-in-out both')}
${rule('wind', 'spider', 'lgpuppeteerSag 1000ms ease-in-out both')}
${rule('ko', 'handL', 'lgpuppeteerKoHandL 2200ms cubic-bezier(.4,0,.6,1) both')}
${rule('ko', 'handR', 'lgpuppeteerKoHandR 2200ms cubic-bezier(.4,0,.6,1) both')}
${rule('ko', 'doll', 'lgpuppeteerKoDoll 2200ms linear both')}
${rule('ko', 'mask', 'lgpuppeteerKoMask 2200ms ease-in both')}
${rule('ko', 'cloak', 'lgpuppeteerKoCloak 2200ms ease-in both')}
${rule('ko', 'spider', 'lgpuppeteerKoSpider 2200ms linear both')}
`

export default {
  // Its strike: a hooked needle on a string drops out of the dark straight at you (the hook catches the screen).
  puppeteerHook: (p, ctx) => <div key="phk" style={{ position: 'absolute', left: '50%', top: '30%', width: '22cqw', height: '40cqw', animation: `lgpuppeteerHookFall ${760 * ctx.speed}ms cubic-bezier(.5,0,.4,1) both`, filter: `drop-shadow(0 0 1.5cqw ${ctx.color})` }}>
    <div style={{ position: 'absolute', left: '50%', bottom: '70%', width: '0.8cqw', height: '120cqw', marginLeft: '-0.4cqw', background: 'linear-gradient(transparent, #fff 40%, #ffb0bc)', transformOrigin: '50% 100%', animation: `lgpuppeteerHookLine ${760 * ctx.speed}ms ease-out both` }} />
    <svg viewBox="0 0 20 40" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
      <path d="M10 0 L10 26 C10 34 3 36 2 30 C1 27 3 25 5 26" fill="none" stroke="#1a0006" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M10 0 L10 26 C10 34 3 36 2 30 C1 27 3 25 5 26" fill="none" stroke="#e8e8f0" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M4 25 L1 22" stroke="#e8e8f0" strokeWidth="2" strokeLinecap="round" />
      <circle cx="10" cy="1" r="2.4" fill={ctx.color} stroke="#1a0006" strokeWidth="1" />
    </svg>
  </div>,
  // Its heavy blow: the wooden control bar itself slams down into the camera, bells flying.
  puppeteerBar: (p, ctx) => <div key="pbr" style={{ position: 'absolute', left: '50%', top: '48%', width: '96cqw', height: '12cqw', animation: `lgpuppeteerBar ${820 * ctx.speed}ms cubic-bezier(.4,0,.2,1) both`, filter: 'drop-shadow(0 1cqw 0 #1a0006)' }}>
    <svg viewBox="0 0 100 12" preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
      <rect x="0" y="2" width="100" height="8" rx="3" fill="#b0763a" stroke="#1a0006" strokeWidth="1.4" />
      <rect x="2" y="3.5" width="96" height="2" rx="1" fill="#e3ad44" opacity=".7" />
      {[8, 30, 50, 70, 92].map((x) => <circle key={x} cx={x} cy="6" r="1.6" fill="#e3ad44" stroke="#1a0006" strokeWidth=".6" />)}
    </svg>
  </div>,
}
