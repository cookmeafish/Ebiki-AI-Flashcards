// What the Vampire's Blood Wards (abilities/vampire.js) LOOK like. The fx contract is in fx/index.js, the juice in
// fx/_juice.js. Fixed crimson with a white-hot glint, so it reads over any palette.
//   drip (tick): one blood drop falls.
//   ward (big): crimson droplets swirl and harden into a glassy red hex shield that settles toward your hearts.
//   burst (big): the shield explodes and its shards fly AT the boss.
//   feast (big): bat silhouettes swarm and dive into the boss under a pulsing crimson vignette.
// Boss reactions (body only; faces are the art pass's lg-fx-<key> layers): Recoil, Cower, Swoon, Flick.
import { anim, around, ring } from './_kit'

const BLOOD = '#e0102f'
const BLOOD_HOT = '#ff4d6a'
const GLINT = '#ffd6de'
const HEX = 'polygon(25% 3%, 75% 3%, 100% 50%, 75% 97%, 25% 97%, 0 50%)'

const bat = (key, style) => (
  <div key={key} className="lgx" style={{ width: 30, height: 14, background: '#2a0008', clipPath: 'polygon(0 20%, 18% 0, 30% 35%, 42% 20%, 50% 40%, 58% 20%, 70% 35%, 82% 0, 100% 20%, 86% 55%, 70% 50%, 58% 90%, 50% 70%, 42% 90%, 30% 50%, 14% 55%)', filter: `drop-shadow(0 0 3px ${BLOOD_HOT})`, ...style }} />
)

// THE DRAWING ACTS EVERY MOMENT (impact/bosses/README.md): the hook classes in raids/vampire.svg move with the arena's
// data-moment (a plain strike moment), data-assault-on (her bite on the player) and data-fx (her ability). The head (the
// countess, then the bat-beast), its jaw, the eyes, the wings, the chalice hand and the claw hand are wrapped parts
// (fill-box pivots: the head at its neck, the jaw at its hinge, the wings from the shoulders, the hands at the wrist).
// She is predatory and theatrical: a slow lean, then a strike too fast to follow. Every move ends on the drawn pose.
const P = '.lg-boss[data-motif="vampire"]'
const PARTS_CSS = `
${P} .lg-vampire-head { transform-box: fill-box; transform-origin: 50% 92% }
${P} .lg-vampire-jaw { transform-box: fill-box; transform-origin: 50% 0% }
${P} .lg-vampire-eyes { transform-box: fill-box; transform-origin: 50% 50% }
${P} .lg-vampire-wings { transform-box: fill-box; transform-origin: 50% 70% }
${P} .lg-vampire-chalice { transform-box: fill-box; transform-origin: 50% 100% }
${P} .lg-vampire-claw { transform-box: fill-box; transform-origin: 20% 100% }
${P}[data-phase="2"] .lg-vampire-claw { transform-origin: 50% 100% }
/* HIT: she recoils with a hiss: the head snaps back, the jaw bares its fangs, the wings twitch, the chalice sloshes. */
@keyframes lgrVampireMHitHead { 0% { transform: none } 12% { transform: translate(-2px, -2px) rotate(-7deg) } 36% { transform: rotate(3deg) } 62% { transform: rotate(-1deg) } 100% { transform: none } }
@keyframes lgrVampireMHitJaw { 0%, 100% { transform: none } 12%, 44% { transform: scaleY(1.3) } }
@keyframes lgrVampireMHitWings { 0%, 100% { transform: none } 12% { transform: scale(.95, 1.03) } 36% { transform: scale(1.02) } }
@keyframes lgrVampireMSlosh { 0%, 100% { transform: none } 14% { transform: rotate(12deg) } 36% { transform: rotate(-7deg) } 60% { transform: rotate(3deg) } }
${P}[data-moment="hit"] .lg-vampire-head { animation: lgrVampireMHitHead 520ms cubic-bezier(.2,.9,.3,1) both }
${P}[data-moment="hit"] .lg-vampire-jaw { animation: lgrVampireMHitJaw 520ms ease-out both }
${P}[data-moment="hit"] .lg-vampire-wings { animation: lgrVampireMHitWings 520ms ease-out both }
${P}[data-moment="hit"] .lg-vampire-chalice { animation: lgrVampireMSlosh 600ms ease-out both }
/* CRITICAL: a shriek: the head whips round, the jaw gapes, the wings burst open, the chalice tips and the claw
   clenches. */
@keyframes lgrVampireMCritHead { 0% { transform: none } 12% { transform: translate(3px, -1px) rotate(15deg) scale(.95) } 34% { transform: rotate(-7deg) } 58% { transform: rotate(3deg) } 100% { transform: none } }
@keyframes lgrVampireMCritJaw { 0%, 100% { transform: none } 10%, 46% { transform: scaleY(1.55) } }
@keyframes lgrVampireMCritWings { 0%, 100% { transform: none } 12% { transform: scale(1.16, 1.1) } 40% { transform: scale(.98) } 62% { transform: scale(1.02) } }
@keyframes lgrVampireMCritChalice { 0%, 100% { transform: none } 14% { transform: rotate(-26deg) translateX(-2px) } 46% { transform: rotate(8deg) } }
@keyframes lgrVampireMClench { 0%, 100% { transform: none } 12%, 40% { transform: rotate(-14deg) scale(.88) } }
${P}[data-moment="crit"] .lg-vampire-head { animation: lgrVampireMCritHead 640ms cubic-bezier(.2,.9,.3,1) both }
${P}[data-moment="crit"] .lg-vampire-jaw { animation: lgrVampireMCritJaw 640ms ease-out both }
${P}[data-moment="crit"] .lg-vampire-wings { animation: lgrVampireMCritWings 640ms ease-out both }
${P}[data-moment="crit"] .lg-vampire-chalice { animation: lgrVampireMCritChalice 640ms ease-out both }
${P}[data-moment="crit"] .lg-vampire-claw { animation: lgrVampireMClench 640ms ease-out both }
/* SHARPENED: a gash: the head shears along the cut, one wing is clipped short, the claw jerks back. */
@keyframes lgrVampireMCutHead { 0% { transform: none } 10% { transform: skewX(10deg) translateX(-2px) } 28% { transform: skewX(-6deg) } 48% { transform: skewX(2deg) } 100% { transform: none } }
@keyframes lgrVampireMCutWings { 0% { transform: none } 10% { transform: skewY(-8deg) scale(.96) } 34% { transform: skewY(4deg) } 100% { transform: none } }
@keyframes lgrVampireMCutClaw { 0%, 100% { transform: none } 12% { transform: rotate(18deg) translateY(3px) } 46% { transform: rotate(5deg) } }
${P}[data-moment="sharpen"] .lg-vampire-head { animation: lgrVampireMCutHead 600ms cubic-bezier(.2,.9,.3,1) both }
${P}[data-moment="sharpen"] .lg-vampire-wings { animation: lgrVampireMCutWings 600ms ease-out both }
${P}[data-moment="sharpen"] .lg-vampire-claw { animation: lgrVampireMCutClaw 600ms ease-out both }
/* HER BITE ON THE PLAYER (data-assault-on): she draws back, lips closing and wings folding (anticipation), then as the
   bats pour out (impact/assault.js travelAt) she LUNGES at the camera: the head swells toward you with the jaw at full
   gape, the wings flare wide, the claw rakes forward, she holds the bite and draws back. */
@keyframes lgrVampireMBlowHead { 0% { transform: none } 12% { transform: translateY(-3px) rotate(-4deg) scale(.93) } 22% { transform: translateY(4px) rotate(3deg) scale(1.24) } 50% { transform: translateY(3px) rotate(2deg) scale(1.18) } 100% { transform: none } }
@keyframes lgrVampireMBlowJaw { 0% { transform: none } 12% { transform: scaleY(.75) } 22%, 52% { transform: scaleY(1.6) } 100% { transform: none } }
@keyframes lgrVampireMBlowWings { 0% { transform: none } 12% { transform: scale(.9, 1.02) } 22% { transform: scale(1.16, 1.08) } 52% { transform: scale(1.1, 1.05) } 100% { transform: none } }
@keyframes lgrVampireMBlowClaw { 0% { transform: none } 12% { transform: rotate(-16deg) translateY(-3px) } 24% { transform: rotate(14deg) scale(1.38) } 52% { transform: rotate(10deg) scale(1.28) } 100% { transform: none } }
@keyframes lgrVampireMBlowEyes { 0% { transform: none } 12% { transform: scaleY(.4) } 22%, 52% { transform: scale(1.35) } 100% { transform: none } }
${P}[data-assault-on] .lg-vampire-head { animation: lgrVampireMBlowHead 820ms cubic-bezier(.3,.7,.3,1) both }
${P}[data-assault-on] .lg-vampire-jaw { animation: lgrVampireMBlowJaw 820ms cubic-bezier(.3,.7,.3,1) both }
${P}[data-assault-on] .lg-vampire-wings { animation: lgrVampireMBlowWings 820ms cubic-bezier(.3,.7,.3,1) both }
${P}[data-assault-on] .lg-vampire-claw { animation: lgrVampireMBlowClaw 820ms cubic-bezier(.3,.7,.3,1) both }
${P}[data-assault-on] .lg-vampire-eyes { animation: lgrVampireMBlowEyes 820ms cubic-bezier(.3,.7,.3,1) both }
/* HER STRIKE (hurt, with the bite above): she raises the chalice to the blood she just drew. */
@keyframes lgrVampireMToast { 0%, 100% { transform: none } 22%, 58% { transform: rotate(-14deg) translateY(-4px) scale(1.06) } }
${P}[data-moment="hurt"] .lg-vampire-chalice { animation: lgrVampireMToast 900ms ease-in-out both }
/* HER HEAVY BLOW (hurtBig): the pounce: the wings mantle up high, then she dives, head driving in deeper and tilted for
   the throat, the claw raking across, the chalice flung up. */
@keyframes lgrVampireMHeavyHead { 0% { transform: none } 18% { transform: translateY(-5px) rotate(-8deg) scale(.9) } 30% { transform: translateY(6px) rotate(9deg) scale(1.32) } 56% { transform: translateY(4px) rotate(6deg) scale(1.22) } 100% { transform: none } }
@keyframes lgrVampireMHeavyWings { 0% { transform: none } 18% { transform: scale(1.08, 1.22) translateY(-4px) } 30% { transform: scale(1.2, .96) translateY(2px) } 56% { transform: scale(1.12, 1) } 100% { transform: none } }
@keyframes lgrVampireMHeavyClaw { 0% { transform: none } 18% { transform: rotate(-26deg) translateY(-4px) } 30% { transform: rotate(24deg) scale(1.45) } 56% { transform: rotate(16deg) scale(1.3) } 100% { transform: none } }
${P}[data-moment="hurtBig"] .lg-vampire-head, ${P}[data-assault-on][data-moment="hurtBig"] .lg-vampire-head { animation: lgrVampireMHeavyHead 920ms cubic-bezier(.3,.7,.3,1) both }
${P}[data-moment="hurtBig"] .lg-vampire-jaw, ${P}[data-assault-on][data-moment="hurtBig"] .lg-vampire-jaw { animation: lgrVampireMBlowJaw 920ms cubic-bezier(.3,.7,.3,1) both }
${P}[data-moment="hurtBig"] .lg-vampire-wings, ${P}[data-assault-on][data-moment="hurtBig"] .lg-vampire-wings { animation: lgrVampireMHeavyWings 920ms cubic-bezier(.3,.7,.3,1) both }
${P}[data-moment="hurtBig"] .lg-vampire-claw, ${P}[data-assault-on][data-moment="hurtBig"] .lg-vampire-claw { animation: lgrVampireMHeavyClaw 920ms cubic-bezier(.3,.7,.3,1) both }
${P}[data-moment="hurtBig"] .lg-vampire-chalice { animation: lgrVampireMCritChalice 920ms ease-out both }
/* BLOCKED: her bite is stopped at the throat: the head darts in, is knocked back, the jaw snaps shut on nothing, the
   claw comes up to guard and the wings flinch. */
@keyframes lgrVampireMBlockHead { 0% { transform: none } 10% { transform: translateY(2px) scale(1.12) } 26% { transform: translate(-2px, -4px) rotate(-9deg) scale(.92) } 52% { transform: rotate(2deg) } 100% { transform: none } }
@keyframes lgrVampireMBlockJaw { 0% { transform: none } 10% { transform: scaleY(1.4) } 22%, 46% { transform: scaleY(.7) } 100% { transform: none } }
@keyframes lgrVampireMBlockClaw { 0%, 100% { transform: none } 24%, 56% { transform: rotate(-24deg) translateY(-5px) } }
${P}[data-moment="block"] .lg-vampire-head { animation: lgrVampireMBlockHead 640ms cubic-bezier(.2,.9,.3,1) both }
${P}[data-moment="block"] .lg-vampire-jaw { animation: lgrVampireMBlockJaw 640ms ease-out both }
${P}[data-moment="block"] .lg-vampire-claw { animation: lgrVampireMBlockClaw 640ms ease-in-out both }
${P}[data-moment="block"] .lg-vampire-wings { animation: lgrVampireMHitWings 640ms ease-out both }
/* SAVED: her bite ricochets off the shield: the head is flung aside, the wings beat once to catch her, the chalice
   spills. */
@keyframes lgrVampireMShieldHead { 0% { transform: none } 14% { transform: scale(1.1) } 32% { transform: translateX(4px) rotate(16deg) scale(.95) } 56% { transform: translateX(2px) rotate(8deg) } 100% { transform: none } }
@keyframes lgrVampireMShieldWings { 0%, 100% { transform: none } 30% { transform: scale(1.12, .9) } 46% { transform: scale(.94, 1.06) } 62% { transform: scale(1.04, .98) } }
@keyframes lgrVampireMSpill { 0%, 100% { transform: none } 30%, 60% { transform: rotate(-34deg) translateX(-3px) } }
${P}[data-moment="shield"] .lg-vampire-head { animation: lgrVampireMShieldHead 760ms cubic-bezier(.2,.9,.3,1) both }
${P}[data-moment="shield"] .lg-vampire-wings { animation: lgrVampireMShieldWings 760ms ease-out both }
${P}[data-moment="shield"] .lg-vampire-chalice { animation: lgrVampireMSpill 760ms ease-in-out both }
/* SECOND WIND: she sulks: the head lowers, lips closed, the wings sag, the chalice drops to her side. */
@keyframes lgrVampireMWindHead { 0%, 100% { transform: none } 35%, 70% { transform: translateY(3px) rotate(4deg) scale(.96) } }
@keyframes lgrVampireMWindJaw { 0%, 100% { transform: none } 35%, 70% { transform: scaleY(.8) } }
@keyframes lgrVampireMWindWings { 0%, 100% { transform: none } 35%, 70% { transform: scale(.94, .88) translateY(3px) } }
@keyframes lgrVampireMWindChalice { 0%, 100% { transform: none } 35%, 70% { transform: rotate(10deg) translateY(4px) } }
${P}[data-moment="wind"] .lg-vampire-head { animation: lgrVampireMWindHead 1000ms ease-in-out both }
${P}[data-moment="wind"] .lg-vampire-jaw { animation: lgrVampireMWindJaw 1000ms ease-in-out both }
${P}[data-moment="wind"] .lg-vampire-wings { animation: lgrVampireMWindWings 1000ms ease-in-out both }
${P}[data-moment="wind"] .lg-vampire-chalice { animation: lgrVampireMWindChalice 1000ms ease-in-out both }
/* KNOCKOUT (she bursts into bats): a last shriek, head thrown back with the jaw at full gape and the wings flung wide,
   shaking, then the wings fold in on her and the head sinks; the parts settle as the box bursts apart. */
@keyframes lgrVampireMKoHead { 0% { transform: none } 14% { transform: translateY(-3px) rotate(-10deg) scale(1.06) } 18% { transform: translate(-1px, -3px) rotate(-10deg) scale(1.06) } 22% { transform: translate(1px, -3px) rotate(-10deg) scale(1.06) } 26% { transform: translate(-1px, -3px) rotate(-10deg) scale(1.06) } 32% { transform: translateY(-2px) rotate(-8deg) } 58% { transform: translateY(5px) rotate(7deg) scale(.92) } 82% { transform: translateY(3px) rotate(4deg) } 100% { transform: none } }
@keyframes lgrVampireMKoJaw { 0% { transform: none } 12%, 34% { transform: scaleY(1.7) } 58% { transform: scaleY(.6) } 100% { transform: none } }
@keyframes lgrVampireMKoWings { 0% { transform: none } 14%, 34% { transform: scale(1.2, 1.14) } 60% { transform: scale(.78, .9) translateY(4px) } 84% { transform: scale(.9, .95) } 100% { transform: none } }
@keyframes lgrVampireMKoChalice { 0%, 30% { transform: none } 56% { transform: rotate(-60deg) translate(-4px, 6px) } 80% { transform: rotate(-40deg) translate(-3px, 4px) } 100% { transform: none } }
${P}[data-moment="ko"] .lg-vampire-head { animation: lgrVampireMKoHead 2100ms ease-in-out both }
${P}[data-moment="ko"] .lg-vampire-jaw { animation: lgrVampireMKoJaw 2100ms ease-in-out both }
${P}[data-moment="ko"] .lg-vampire-wings { animation: lgrVampireMKoWings 2100ms ease-in-out both }
${P}[data-moment="ko"] .lg-vampire-chalice { animation: lgrVampireMKoChalice 2100ms ease-in-out both }
${P}[data-moment="ko"] .lg-vampire-eyes { animation: lgrVampireMBlowEyes 2100ms ease-in-out both }
/* HER ABILITY, acted by the drawing.
   Drip (a drop of blood falls to her): the chalice tips to catch it. */
@keyframes lgrVampireMDrip { 0%, 100% { transform: none } 30%, 60% { transform: rotate(-9deg) } }
${P}[data-fx="drip"] .lg-vampire-chalice { animation: lgrVampireMDrip 340ms ease-in-out both }
/* Ward (a blood ward rises): she conjures it: the claw lifts palm-up, the wings mantle, the head tilts proud. */
@keyframes lgrVampireMWardClaw { 0%, 100% { transform: none } 25%, 70% { transform: rotate(-20deg) translateY(-5px) scale(1.1) } }
@keyframes lgrVampireMWardWings { 0%, 100% { transform: none } 25%, 70% { transform: scale(1.08, 1.12) translateY(-2px) } }
@keyframes lgrVampireMWardHead { 0%, 100% { transform: none } 25%, 70% { transform: translateY(-2px) rotate(-5deg) } }
${P}[data-fx="ward"] .lg-vampire-claw { animation: lgrVampireMWardClaw 700ms ease-in-out both }
${P}[data-fx="ward"] .lg-vampire-wings { animation: lgrVampireMWardWings 700ms ease-in-out both }
${P}[data-fx="ward"] .lg-vampire-head { animation: lgrVampireMWardHead 700ms ease-in-out both }
/* Burst (a ward is broken): she cowers: the wings wrap in around her, the head ducks, the claw shields her face. */
@keyframes lgrVampireMBurstWings { 0%, 100% { transform: none } 14%, 60% { transform: scale(.8, .95) translateY(3px) } }
@keyframes lgrVampireMBurstHead { 0%, 100% { transform: none } 14%, 60% { transform: translateY(4px) rotate(8deg) scale(.92) } }
${P}[data-fx="burst"] .lg-vampire-wings { animation: lgrVampireMBurstWings 900ms ease-in-out both }
${P}[data-fx="burst"] .lg-vampire-head { animation: lgrVampireMBurstHead 900ms ease-in-out both }
${P}[data-fx="burst"] .lg-vampire-claw { animation: lgrVampireMBlockClaw 900ms ease-in-out both }
/* Feast (she drinks): the chalice rises to her lips, the head tips forward into it and the jaw works twice, the wings
   shiver with pleasure. */
@keyframes lgrVampireMFeastChalice { 0%, 100% { transform: none } 25%, 75% { transform: rotate(-22deg) translate(-6px, -8px) scale(1.08) } }
@keyframes lgrVampireMFeastHead { 0%, 100% { transform: none } 25%, 75% { transform: translateY(2px) rotate(8deg) } }
@keyframes lgrVampireMFeastJaw { 0%, 100% { transform: none } 30% { transform: scaleY(1.3) } 42% { transform: scaleY(.85) } 54% { transform: scaleY(1.3) } 66% { transform: scaleY(.85) } }
@keyframes lgrVampireMFeastWings { 0%, 100% { transform: none } 40% { transform: scale(1.03, .98) } 50% { transform: scale(.98, 1.03) } 60% { transform: scale(1.03, .98) } }
${P}[data-fx="feast"] .lg-vampire-chalice { animation: lgrVampireMFeastChalice 1100ms ease-in-out both }
${P}[data-fx="feast"] .lg-vampire-head { animation: lgrVampireMFeastHead 1100ms ease-in-out both }
${P}[data-fx="feast"] .lg-vampire-jaw { animation: lgrVampireMFeastJaw 1100ms ease-in-out both }
${P}[data-fx="feast"] .lg-vampire-wings { animation: lgrVampireMFeastWings 1100ms ease-in-out both }
`

export default {
  effects: {
    // Drip (tick): two fang marks stab in beside the boss's mouth and three outlined blood drops run down from them.
    drip: () => <>
      {[-1, 1].map((s) => <div key={s} className="lgx" style={{ left: `calc(56% + ${s * 7}px)`, top: '30%', width: 8, height: 16, marginLeft: -4, clipPath: 'polygon(0 0, 100% 0, 50% 100%)', background: `linear-gradient(#ffffff, ${GLINT} 50%, ${BLOOD_HOT})`, filter: 'drop-shadow(0 0 2px #2a0008)', animation: anim('lgrVampireStab', 300, s > 0 ? 30 : 0, 'cubic-bezier(.5,0,.3,1)') }} />)}
      {[0, 1, 2].map((i) => <div key={i} className="lgx" style={{ left: `calc(56% + ${(i - 1) * 7}px)`, top: '38%', width: 10, height: 14, marginLeft: -5, borderRadius: '50% 50% 50% 50% / 65% 65% 35% 35%', background: `radial-gradient(circle at 40% 35%, ${GLINT}, ${BLOOD} 55%)`, boxShadow: '0 0 0 1.5px #2a0008', '--spin': '0deg', animation: anim('lgxFall', 320, 90 + i * 50, 'ease-in') }} />)}
    </>,
    ward: () => <>
      {/* droplets swirl in */}
      {around(10, (i, a) => (
        <div key={i} className="lgx" style={{ left: '50%', top: '50%', width: 10, height: 10, marginLeft: -5, marginTop: -5, borderRadius: '50%', background: `radial-gradient(circle at 35% 35%, ${GLINT}, ${BLOOD})`, '--a': `${a}deg`, animation: anim('lgrVampireSwirl', 560, i * 20, 'cubic-bezier(.55,0,1,.45)') }} />
      ))}
      {/* the glass hex shield hardens, then settles toward the hearts (right of the boss) */}
      <div className="lgx" style={{ left: '50%', top: '50%', width: '58%', height: '58%', marginLeft: '-29%', marginTop: '-29%', clipPath: HEX, background: `linear-gradient(135deg, rgba(255,214,222,.85), rgba(224,16,47,.55) 40%, rgba(120,0,20,.65))`, animation: anim('lgrVampireHex', 1150, 420, 'cubic-bezier(.34,1.56,.64,1)') }}>
        <div style={{ position: 'absolute', inset: '12%', clipPath: HEX, border: `2px solid ${GLINT}`, background: 'linear-gradient(160deg, rgba(255,255,255,.55), rgba(255,255,255,0) 45%)' }} />
      </div>
      {ring(BLOOD_HOT, 420, 1.5, 4, 600)}
    </>,
    burst: () => <>
      <div className="lgx" style={{ left: '50%', top: '50%', width: '58%', height: '58%', marginLeft: '-29%', marginTop: '-29%', clipPath: HEX, background: `linear-gradient(135deg, rgba(255,214,222,.9), rgba(224,16,47,.7))`, animation: anim('lgrVampireShatter', 260, 0, 'ease-in') }} />
      {/* shards fly from the hearts' side and around, converging on the boss */}
      {around(14, (i, a) => (
        <div key={i} className="lgx" style={{ left: '50%', top: '50%', width: 10, height: 16, background: `linear-gradient(${GLINT}, ${BLOOD})`, clipPath: 'polygon(50% 0, 100% 100%, 0 100%)', '--x0': `${Math.round(Math.cos((a * Math.PI) / 180) * 130) + 40}px`, '--y0': `${Math.round(Math.sin((a * Math.PI) / 180) * 90)}px`, animation: anim('lgxFly', 520, 160 + i * 18, 'cubic-bezier(.55,0,1,.45)') }} />
      ))}
      {ring(BLOOD, 620, 1.9, 7, 560)}
      {ring('#ffffff', 660, 1.2, 3, 420)}
    </>,
    feast: () => <>
      <div className="lgx lgx-full" style={{ background: 'radial-gradient(closest-side, rgba(224,16,47,0) 55%, rgba(224,16,47,.5) 82%, rgba(90,0,16,0))', borderRadius: '50%', animation: anim('lgxVignette', 1150) }} />
      {around(9, (i, a) => bat(i, { left: '50%', top: '50%', marginLeft: -15, marginTop: -7, '--x0': `${Math.round(Math.cos((a * Math.PI) / 180) * 150)}px`, '--y0': `${Math.round(Math.sin((a * Math.PI) / 180) * 110) - 30}px`, animation: anim('lgxFly', 700, 80 + i * 55, 'cubic-bezier(.55,0,1,.45)') }))}
      {ring(BLOOD_HOT, 700, 1.7, 5, 500)}
    </>,
  },
  floaters: { drip: 'lg_fx_bloodDrip', ward: 'lg_fx_bloodWard', burst: 'lg_fx_wardBurst', feast: 'lg_fx_bloodFeast' },
  floaterTone: { drip: 'danger', ward: 'danger', burst: 'danger', feast: 'danger' },
  demo: { drip: { kind: 'hit', damage: 2, lives: 0 }, ward: { kind: 'hit', damage: 2, lives: 0 }, burst: { kind: 'hit', damage: 2, lives: 0 }, feast: { kind: 'hit', damage: 5, lives: 0 } },
  juice: {
    drip: { size: 'tick' },
    ward: { size: 'big', shake: 1, flash: 1, hitstop: 1, sfx: 'vampire.ward' },
    burst: { size: 'big', shake: 2, flash: 2, hitstop: 1, sfx: 'vampire.burst' },
    feast: { size: 'big', shake: 2, flash: 2, hitstop: 1, sfx: 'vampire.feast' },
  },
  css: `
@keyframes lgrVampireStab { 0% { transform: translateY(-22px) scaleY(1.4); opacity: 0 } 40% { transform: translateY(0) scaleY(1); opacity: 1 } 70% { transform: translateY(2px); opacity: 1 } 100% { transform: translateY(-6px); opacity: 0 } }
@keyframes lgrVampireSwirl { 0% { transform: rotate(var(--a)) translateY(-90px) rotate(0); opacity: 0 } 20% { opacity: 1 } 100% { transform: rotate(calc(var(--a) + 220deg)) translateY(-8px) rotate(220deg); opacity: .2 } }
@keyframes lgrVampireHex { 0% { transform: scale(.2) rotate(-30deg); opacity: 0 } 25% { transform: scale(1.1) rotate(0); opacity: 1 } 40% { transform: scale(1) } 70% { transform: scale(1) translate(0, 0); opacity: 1 } 100% { transform: scale(.35) translate(170px, 60px); opacity: 0 } }
@keyframes lgrVampireShatter { 0% { transform: scale(1); opacity: 1 } 60% { transform: scale(1.12); opacity: 1 } 100% { transform: scale(1.3); opacity: 0 } }

@keyframes lgrVampireRecoil { 0% { transform: none } 30% { transform: translateX(-8px) scale(.94) } 70% { transform: translateX(-5px) scale(.96) } 100% { transform: none } }
@keyframes lgrVampireCower { 0% { transform: none } 18% { transform: translateY(6px) scaleY(.9) } 30% { transform: translate(-1.5px, 6px) scaleY(.9) } 42% { transform: translate(1.5px, 6px) scaleY(.9) } 54% { transform: translate(-1px, 5px) scaleY(.92) } 100% { transform: none } }
@keyframes lgrVampireSwoon { 0% { transform: none } 30% { transform: rotate(-7deg) } 55% { transform: rotate(-4deg) translateX(2px) } 78% { transform: rotate(-6deg) } 100% { transform: none } }
@keyframes lgrVampireFlick { 0%, 100% { transform: none } 45% { transform: translateY(-5px) rotate(-3deg) } 80% { transform: translateY(-1px) } }
.lgr-vampire-ward { transform-origin: 50% 90%; animation: lgrVampireRecoil 700ms cubic-bezier(.22,1,.36,1) both }
.lgr-vampire-burst { transform-origin: 50% 100%; animation: lgrVampireCower 900ms ease-out both }
.lgr-vampire-feast { transform-origin: 50% 85%; animation: lgrVampireSwoon 1100ms ease-in-out both }
.lgr-vampire-drip { animation: lgrVampireFlick 320ms ease-out both }
/* State-layer motion: the ward droplets circle her on the dotted orbit (one or two, opposite each other), a 6 s loop
   along the ellipse (cx 60, cy 44, rx 34, ry 9; the droplet's own rotate and scale kept), dimmed on the far side
   so it reads as passing behind her head. BossArena's lg-fx-off turns
   it off with the reactions (focus mode, Still bosses, reduced motion). */
@keyframes lgrVampireOrbit { 0% { transform: translate(26.6px, 46.6px) rotate(-70deg) scale(1.7); opacity: 1 } 6.25% { transform: translate(26.2px, 43.1px) rotate(-65deg) scale(1.7); opacity: 1 } 12.5% { transform: translate(30px, 39.8px) rotate(-49deg) scale(1.7); opacity: 0.55 } 18.75% { transform: translate(38.4px, 37.1px) rotate(-27deg) scale(1.7); opacity: 0.3 } 25% { transform: translate(50.1px, 35.4px) rotate(0deg) scale(1.7); opacity: 0.25 } 31.25% { transform: translate(63.3px, 35px) rotate(27deg) scale(1.7); opacity: 0.25 } 37.5% { transform: translate(76px, 36.1px) rotate(49deg) scale(1.7); opacity: 0.3 } 43.75% { transform: translate(86.2px, 38.3px) rotate(65deg) scale(1.7); opacity: 0.55 } 50% { transform: translate(93.4px, 41.4px) rotate(70deg) scale(1.7); opacity: 1 } 56.25% { transform: translate(93.8px, 44.9px) rotate(65deg) scale(1.7); opacity: 1 } 62.5% { transform: translate(90px, 48.2px) rotate(49deg) scale(1.7); opacity: 1 } 68.75% { transform: translate(81.6px, 50.9px) rotate(27deg) scale(1.7); opacity: 1 } 75% { transform: translate(69.9px, 52.6px) rotate(0deg) scale(1.7); opacity: 1 } 81.25% { transform: translate(56.7px, 53px) rotate(-27deg) scale(1.7); opacity: 1 } 87.5% { transform: translate(44px, 51.9px) rotate(-49deg) scale(1.7); opacity: 1 } 93.75% { transform: translate(33.8px, 49.7px) rotate(-65deg) scale(1.7); opacity: 1 } 100% { transform: translate(26.6px, 46.6px) rotate(-70deg) scale(1.7); opacity: 1 } }
.lgfa-vampire-orbit > g { transform-box: view-box; transform-origin: 0 0; animation: lgrVampireOrbit 6s linear infinite }
.lgfa-vampire-orbit > g + g { animation-delay: -3s }
/* THE REAL PARTS: the state layer this ability draws on the boss (its lg-ab-* group in raids/vampire.svg) moves with
   the moment, not only the whole figure. Played only while data-fx is set (never in focus mode, with Still bosses or
   under reduced motion). */
@keyframes lgrVampireWardRise { 0% { transform: translateY(6px) scale(.6) } 45% { transform: translateY(-2px) scale(1.15) } 100% { transform: none } }
.lg-boss[data-fx="ward"] [class*="lg-ab-wards-"] { transform-box: fill-box; transform-origin: center bottom; animation: lgrVampireWardRise 700ms cubic-bezier(.22,1,.36,1) both }
${PARTS_CSS}
`,
}
