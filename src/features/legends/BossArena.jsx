// The boss fight's stage: the area's boss (public/assets/legends/bosses), its health bar and the learner's lives.
// The boss has as much health as right answers are needed to beat it (PASS.boss of the questions); every right
// answer is a hit, every wrong one costs a life. Lives = the misses the pass mark allows + 1, so losing the last one
// is exactly the miss that makes the boss unbeatable: the fight ends there, and at 0 health it ends in a win. The
// pass itself is still decided by applyNodeResult. Nothing moves for people who asked for reduced motion.
import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { C, FONT, RADIUS } from '../../config/tokens'
import { ChunkyButton } from '../ui'
import { BossArt, LegendsArt, headroomPx, useArtMotionAlways, useArtStill, reducedMotion, ArtMotion, useArtMarkup, artGlowMask, HEADROOM_SHARE, holdArt } from './art'
import { useFeatureCtx } from '../registry'
import { LEGENDS_ID } from './store'
import { AbilityFx } from './AbilityFx'
import { newFight, healthLeft, livesLeft, phaseOf, abilityState, abilityK, rulesOf } from './fight'
import { abilityById, ABILITY_BY_ID } from './abilities'
import { abilityCss, floaterKeyFor, floaterToneFor, fxForAbility, juiceFor } from './fx'
import { JUICE, JUICE_CSS, FLOATER_FILL, FLOATER_OUTLINE, juiceOf, floaterPxFor } from './fx/_juice'
import { strikeMoment, STRIKE_FX } from './strikeFx'
import StrikeFxLayer, { KoTag } from './StrikeFxLayer'
import { impactFor, koTiming } from './impact/styles'
import { BODY_CSS, bodyAnimation } from './impact/body'
import { PowerFx, PowerBadges, PowerProc, SteadfastHearts, wardStyle, POWER_ARMED_CSS, castMs, procMs } from './impact/PowerFx'
import { AbilityHud, BarMarks } from './fx/_Hud'
import { PASS } from './map'

// The intro card's red eye glow. true: a blurred red copy of the boss's silhouette behind it pulses its OPACITY (the
// compositor runs it; the old `filter: drop-shadow` pulse repainted and re-layerized the whole page every frame, 13 to
// 25 ms a frame in the asset view). false: the old drop-shadow pulse, exactly as before.
export const INTRO_EYES_GLOW_LAYER = false
export const BOSS = { intro: 190, arena: 120, arenaCompact: 68, arenaSlim: 40 } // px: the boss on the intro card, and above the questions
// The power stage (a cast, a power's hit): the lower part of the boss box, as a share of its height.
const POWER_STAGE = 0.5
// Below this many layout px of window height the arena shrinks (boss, bar, hearts), so the question and its choices
// fit under it without scrolling on a short laptop screen (the body zoom is taken out).
export const ARENA_COMPACT_BELOW = 900

// { need, allowed, lives, bonus }: right answers that beat the boss, misses that still leave it beatable, lives.
// `bonus`: extra lives earned in Weak spots. Each one is one more allowed miss, so the boss needs one hit less
// (applyNodeResult counts that forgiven miss as right). `pass`: the share needed (a Legendary run asks more).
export const bossOdds = (total, { bonus = 0, pass = PASS.boss } = {}) => {
  const base = Math.max(1, Math.ceil(total * pass))
  const need = Math.max(1, base - Math.max(0, bonus))
  const allowed = Math.max(0, total - need)
  return { need, allowed, lives: allowed + 1, bonus: base - need }
}
// 'won' (no health left), 'lost' (no lives left) or '' while the fight goes on.
export const bossOutcome = (total, hits, misses, opts) => {
  const { need, lives } = bossOdds(total, opts)
  return hits >= need ? 'won' : misses >= lives ? 'lost' : ''
}
// How many of the earned bonus lives a win needed (added to the right answers when the result is recorded).
export const forgivenMisses = (total, hits, opts) => {
  const { bonus } = bossOdds(total, opts)
  const base = bossOdds(total, { ...opts, bonus: 0 }).need
  return Math.max(0, Math.min(bonus, base - hits))
}

// `popFrom` (s): the hearts pop in one by one from then (the boss entrance); 0 = shown at once.
// `bonus`: the last hearts are the Weak spots reward: a gold ring and a "+1" tag, and they go first.
function Lives({ t, lives, left, last, size = 16, popFrom = 0, bonus = 0 }) {
  return (
    <div role="img" aria-label={bonus ? `${t('lg_livesAria', { n: left })}. ${t('lg_bonusLife', { n: bonus })}` : t('lg_livesAria', { n: left })} style={{ display: 'flex', gap: 4, fontSize: size, flexWrap: 'wrap', justifyContent: 'center' }}>
      {Array.from({ length: lives }, (_, i) => {
        const lost = i >= left
        const justLost = last?.kind === 'miss' && i === left
        const pop = popFrom ? `lgPopIn .35s cubic-bezier(.3,1.6,.5,1) ${popFrom + i * 0.12}s both` : undefined
        const extra = i >= lives - bonus
        const heart = <span key={`${i}-${justLost ? last.n : 0}`} aria-hidden="true" style={{ display: 'inline-block', filter: lost ? 'grayscale(1) opacity(.35)' : 'none', animation: justLost ? 'lgHeartLose .5s ease-out both' : pop }}>{extra ? '💖' : '❤️'}</span>
        if (!extra) return heart
        return (
          <span key={`x${i}`} style={{ position: 'relative', display: 'inline-flex', borderRadius: '50%', boxShadow: lost ? 'none' : `0 0 0 2px ${C.warning}, 0 0 12px color-mix(in srgb, ${C.warning} 70%, transparent)`, padding: 1 }}>
            {heart}
            <span aria-hidden="true" style={{ position: 'absolute', top: -Math.round(size * 0.45), right: -Math.round(size * 0.55), fontFamily: FONT.display, fontWeight: 900, fontSize: Math.max(10, Math.round(size * 0.5)), color: C.white, background: C.warning, borderRadius: RADIUS.pill, padding: '0 4px', lineHeight: 1.3, opacity: lost ? 0.4 : 1, animation: pop }}>+1</span>
          </span>
        )
      })}
    </div>
  )
}

const CSS = `
@keyframes lgBossBob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
@keyframes lgBossHit { 0% { transform: translateX(0) } 15% { transform: translateX(-12px) rotate(-6deg) } 35% { transform: translateX(10px) rotate(5deg) } 55% { transform: translateX(-6px) } 75% { transform: translateX(4px) } 100% { transform: translateX(0) } }
@keyframes lgBossFlash { 0% { opacity: .75 } 100% { opacity: 0 } }
@keyframes lgBossLunge { 0% { transform: scale(1) } 35% { transform: scale(1.22) translateY(10px) } 100% { transform: scale(1) } }
@keyframes lgBossFloat { 0% { transform: translate(-50%, 0); opacity: 1 } 100% { transform: translate(-50%, -46px); opacity: 0 } }
@keyframes lgHeartLose { 0% { transform: scale(1) } 40% { transform: scale(1.5) rotate(-12deg) } 100% { transform: scale(.8); opacity: .35 } }
@keyframes lgBossDown { 0% { transform: rotate(0) } 100% { transform: rotate(-14deg) translateY(12px) } }
@keyframes lgStageIn { 0% { opacity: 0 } 100% { opacity: 1 } }
@keyframes lgStripeL { 0% { transform: translateX(-110%) } 100% { transform: translateX(0) } }
@keyframes lgStripeR { 0% { transform: translateX(110%) } 100% { transform: translateX(0) } }
@keyframes lgStripeMove { to { transform: translateX(39.598px) } } /* one stripe period across: 28px along a -45deg axis = 28 x sqrt(2); any other distance stutters at the loop */
@keyframes lgSlam { 0% { transform: translateY(-340px) scale(1.5); opacity: 0; filter: blur(6px) } 60% { opacity: 1; filter: blur(0) } 78% { transform: translateY(0) scale(1.08, .88) } 88% { transform: translateY(-10px) scale(.97, 1.04) } 100% { transform: translateY(0) scale(1) } }
@keyframes lgRootRise { 0% { transform: translateY(110%) scaleX(.7) rotate(-6deg); opacity: 0 } 45% { opacity: 1 } 65% { transform: translateY(-8%) scaleX(1.05) rotate(4deg) } 82% { transform: translateY(2%) rotate(-2deg) } 100% { transform: none } }
@keyframes lgGlitchIn { 0% { transform: translateX(-40px) skewX(30deg) scaleY(.2); opacity: 0 } 15% { transform: translateX(30px) skewX(-25deg) scaleY(1.2); opacity: 1 } 25% { transform: translateX(-18px) scaleX(1.4) scaleY(.6); opacity: .2 } 38% { transform: translateX(12px) skewX(15deg); opacity: 1 } 50% { transform: translateX(-6px) scaleY(1.1); opacity: .4 } 64% { transform: translateX(4px) skewX(-6deg); opacity: 1 } 80% { transform: scale(1.06) } 100% { transform: none } }
@keyframes lgSurge { 0% { transform: translateX(220px) skewX(-25deg) scale(.8, 1.2); opacity: 0 } 35% { opacity: 1; transform: translateX(60px) skewX(-18deg) } 60% { transform: translateX(-20px) skewX(10deg) scale(1.1, .92) } 80% { transform: translateX(6px) skewX(-4deg) } 100% { transform: none } }
@keyframes lgWarpIn { 0% { transform: scale(.03, 3); opacity: 0 } 30% { transform: scale(.03, 1.4); opacity: 1 } 55% { transform: scale(1.35, .6) } 72% { transform: scale(.9, 1.12) } 86% { transform: scale(1.04, .97) } 100% { transform: none } }
@keyframes lgSpinIn { 0% { transform: rotate(-720deg) scale(0); opacity: 0 } 50% { opacity: 1 } 80% { transform: rotate(12deg) scale(1.12) } 100% { transform: none } }
@keyframes lgSwoop { 0% { transform: translate(260px, -260px) rotate(40deg) scale(.4); opacity: 0 } 45% { opacity: 1 } 70% { transform: translate(-24px, 14px) rotate(-10deg) scale(1.1) } 86% { transform: translate(6px, -4px) rotate(3deg) } 100% { transform: none } }
@keyframes lgBurrow { 0% { transform: translateY(100%) rotate(0) scale(.6); opacity: 0 } 20% { opacity: 1; transform: translateY(70%) rotate(-10deg) } 35% { transform: translateY(55%) rotate(10deg) } 50% { transform: translateY(35%) rotate(-10deg) } 68% { transform: translateY(-12%) rotate(6deg) scale(1.1) } 84% { transform: translateY(3%) rotate(-2deg) } 100% { transform: none } }
@keyframes lgErupt { 0% { transform: translateY(120%) scale(.5); opacity: 0 } 35% { opacity: 1; transform: translateY(-60%) scale(1.15) rotate(8deg) } 55% { transform: translateY(-70%) scale(1.1) rotate(-6deg) } 80% { transform: translateY(4%) scale(1.1, .85) } 90% { transform: translateY(-4%) scale(.96, 1.05) } 100% { transform: none } }
@keyframes lgShatterIn { 0% { transform: scale(1.9) rotate(8deg); opacity: 0; filter: blur(8px) brightness(2.2) } 40% { opacity: 1 } 65% { transform: scale(.9) rotate(-3deg); filter: blur(0) brightness(1.6) } 80% { transform: scale(1.05) } 100% { transform: none; filter: none } }
@keyframes lgCroakSwell { 0% { transform: scale(.5, .28); opacity: 0 } 14% { opacity: 1 } 34% { transform: scale(.82, .6) } 46% { transform: scale(.74, .5) } 68% { transform: scale(1.24, 1.12) } 80% { transform: scale(1.05, .88) } 91% { transform: scale(.98, 1.03) rotate(-2deg) } 100% { transform: none } }
@keyframes lgMarch { 0% { transform: translateX(-70%) scale(.7); opacity: 0 } 15% { opacity: 1; transform: translateX(-52%) translateY(-10px) scale(.76) } 30% { transform: translateX(-40%) translateY(4px) scale(.82) } 45% { transform: translateX(-24%) translateY(-10px) scale(.88) } 60% { transform: translateX(-12%) translateY(4px) scale(.94) } 78% { transform: translateY(-12px) scale(1.04) } 90% { transform: translateY(3px) scale(1.02, .96) } 100% { transform: none } }
@keyframes lgPhaseIn { 0% { opacity: 0; transform: skewX(20deg) scale(1.2); filter: blur(6px) } 20% { opacity: .7; transform: skewX(-14deg) } 30% { opacity: .1 } 45% { opacity: .85; transform: skewX(8deg) scale(1.05); filter: blur(2px) } 55% { opacity: .2 } 70% { opacity: 1; transform: skewX(-3deg); filter: blur(0) } 82% { opacity: .5 } 100% { opacity: 1; transform: none; filter: none } }
@keyframes lgStrike { 0% { transform: translateX(-140%) rotate(-35deg) scale(.8); opacity: 0 } 35% { opacity: 1 } 55% { transform: translateX(12%) rotate(8deg) scale(1.12) } 72% { transform: translateX(-6%) rotate(-4deg) } 86% { transform: translateX(2%) } 100% { transform: none } }
@keyframes lgBlackHole { 0% { transform: rotate(-540deg) scale(0); opacity: 0; filter: blur(8px) brightness(.2) } 50% { opacity: 1 } 78% { transform: rotate(20deg) scale(1.15); filter: blur(0) brightness(1.4) } 100% { transform: none; filter: none } }
@keyframes lgWindUp { 0% { transform: translateY(-60%) rotate(-24deg); opacity: 0 } 12% { opacity: 1 } 25% { transform: translateY(-40%) rotate(-24deg) } 30% { transform: translateY(-40%) rotate(-12deg) } 48% { transform: translateY(-20%) rotate(-12deg) } 53% { transform: translateY(-20%) rotate(0) } 70% { transform: translateY(0) rotate(0) scale(1.08, .9) } 84% { transform: translateY(-6px) scale(.97, 1.04) } 100% { transform: none } }
@keyframes lgSpring { 0% { transform: translateY(40%) scaleY(.1); opacity: 0 } 25% { opacity: 1; transform: translateY(30%) scaleY(.25) } 50% { transform: translateY(-30%) scaleY(1.45) scaleX(.85) } 65% { transform: translateY(6%) scaleY(.8) scaleX(1.1) } 78% { transform: translateY(-6%) scaleY(1.12) rotate(4deg) } 90% { transform: rotate(-3deg) } 100% { transform: none } }
@keyframes lgCharge { 0% { transform: scale(.25) translateY(30%); opacity: 0; filter: blur(6px) brightness(.3) } 40% { opacity: 1 } 70% { transform: scale(1.28) translateY(-4%); filter: blur(0) brightness(1.5) } 78% { transform: scale(1.2) translateX(-6px) } 84% { transform: scale(1.12) translateX(6px) } 100% { transform: none; filter: none } }
@keyframes lgLeap { 0% { transform: translate(220px, 40px) rotate(20deg) scale(.7); opacity: 0 } 20% { opacity: 1 } 45% { transform: translate(90px, -140px) rotate(-10deg) scale(.9) } 72% { transform: translate(0, 14px) scale(1.1, .82) } 86% { transform: translateY(-6px) scale(.97, 1.05) } 100% { transform: none } }
@keyframes lgSporeBurst { 0% { transform: scale(.2); opacity: 0; filter: blur(12px) saturate(2) } 45% { opacity: 1; filter: blur(4px) } 70% { transform: scale(1.3); filter: blur(0) } 85% { transform: scale(.94) } 100% { transform: none; filter: none } }
@keyframes lgSwing { 0% { transform: rotate(75deg); opacity: 0 } 25% { opacity: 1 } 55% { transform: rotate(-20deg) } 72% { transform: rotate(10deg) } 86% { transform: rotate(-4deg) } 100% { transform: none } }
@keyframes lgSlash { 0% { transform: scaleX(0) skewX(-40deg); opacity: 0; filter: brightness(3) } 35% { transform: scaleX(1.3) skewX(20deg); opacity: 1 } 55% { transform: scaleX(.9) skewX(-8deg); filter: brightness(1.8) } 75% { transform: scaleX(1.04) skewX(2deg) } 100% { transform: none; filter: none } }
@keyframes lgRefract { 0% { transform: scale(.4) rotate(-30deg); opacity: 0; filter: hue-rotate(180deg) brightness(2) blur(6px) } 40% { opacity: 1 } 70% { transform: scale(1.15) rotate(6deg); filter: hue-rotate(60deg) brightness(1.4) blur(0) } 100% { transform: none; filter: none } }
@keyframes lgPixelate { 0% { transform: scale(.1); opacity: 0 } 20% { opacity: 1; transform: scale(.35) } 40% { transform: scale(.6) } 60% { transform: scale(.85) } 80% { transform: scale(1.12) } 100% { transform: none } }
@keyframes lgBookFlip { 0% { transform: perspective(400px) rotateY(-90deg) scale(.7); opacity: 0 } 45% { opacity: 1; transform: perspective(400px) rotateY(20deg) scale(1.05) } 70% { transform: perspective(400px) rotateY(-8deg) scale(1.1) } 100% { transform: none } }
@keyframes lgScurry { 0% { transform: translateX(-200px) scale(.3, .35); opacity: 0 } 25% { opacity: 1; transform: translateX(-120px) scale(.45, .4) } 45% { transform: translateX(-60px) scale(1.25, .5) } 62% { transform: translateX(0) scale(.85, 1.2) } 78% { transform: scale(1.08, .92) } 100% { transform: none } }
@keyframes lgGraveRise { 0% { transform: perspective(500px) rotateX(82deg) scale(.9); opacity: 0; filter: brightness(0) } 12% { opacity: 1 } 62% { transform: perspective(500px) rotateX(18deg) scale(.98); filter: brightness(0) } 76% { transform: perspective(500px) rotateX(-7deg) scale(1.04); filter: brightness(1.7) } 88% { transform: perspective(500px) rotateX(2deg); filter: brightness(1) } 100% { transform: none; filter: none } }
@keyframes lgBuzz { 0% { transform: translate(-180px, -60px) scale(.5); opacity: 0 } 15% { opacity: 1; transform: translate(-120px, 20px) scale(.6) rotate(10deg) } 30% { transform: translate(-60px, -40px) scale(.7) rotate(-10deg) } 45% { transform: translate(20px, 20px) scale(.85) rotate(8deg) } 60% { transform: translate(-10px, -20px) scale(.95) rotate(-6deg) } 78% { transform: translate(6px, 6px) scale(1.08) } 100% { transform: none } }
@keyframes lgBloom { 0% { transform: translateY(40%) scale(.1) rotate(-90deg); opacity: 0 } 40% { opacity: 1; transform: translateY(10%) scale(.6) rotate(-30deg) } 70% { transform: translateY(-4%) scale(1.15) rotate(8deg) } 100% { transform: none } }
@keyframes lgCurtsy { 0% { transform: translateY(14%) scale(.55); opacity: 0 } 25% { opacity: 1 } 45% { transform: scale(1.02) } 60% { transform: scale(1.06, .8) rotate(-3deg) } 72% { transform: scale(1.06, .8) rotate(-3deg) } 88% { transform: scale(.97, 1.07) rotate(1deg) } 100% { transform: none } }
@keyframes lgPounce { 0% { transform: translate(-120px, 30%) scale(1.2, .55); opacity: 0 } 20% { opacity: 1 } 50% { transform: translate(0, 30%) scale(1.25, .5) } 62% { transform: translate(0, 28%) scale(1.3, .45) } 78% { transform: translateY(-14%) scale(.85, 1.25) } 90% { transform: translateY(2%) scale(1.04, .96) } 100% { transform: none } }
@keyframes lgMirrorFlip { 0% { transform: scaleX(-1); opacity: 0; filter: brightness(3) } 12% { opacity: 1 } 20% { filter: brightness(1) } 26% { filter: brightness(3) } 34% { filter: brightness(1); transform: scaleX(-1) } 55% { transform: scaleX(.05) } 72% { transform: scaleX(1.12); filter: brightness(2.4) } 86% { transform: scaleX(.97); filter: brightness(1) } 100% { transform: none; filter: none } }
@keyframes lgHaunt { 0% { transform: scaleY(0) skewX(0); opacity: 0 } 25% { opacity: .8; transform: scaleY(.4) skewX(18deg) } 45% { transform: scaleY(.8) skewX(-14deg) } 65% { transform: scaleY(1.2) skewX(8deg); opacity: 1 } 82% { transform: scaleY(.95) skewX(-3deg) } 100% { transform: none } }
@keyframes lgAssemble { 0% { transform: rotate(-90deg); opacity: 0 } 15% { opacity: 1 } 45% { transform: rotate(-60deg) } 52% { transform: rotate(-64deg) } 72% { transform: rotate(6deg) } 80% { transform: rotate(0) scale(1.06, .9) } 90% { transform: rotate(-2deg) } 100% { transform: none } }
@keyframes lgHypno { 0% { transform: scale(.6, 2.6) skewX(20deg) translateY(-30%); opacity: 0; filter: hue-rotate(-140deg) blur(5px) } 35% { opacity: 1; transform: scale(.8, 1.8) skewX(-12deg) translateY(-8%) } 60% { transform: scale(1.1, .8) skewX(6deg); filter: hue-rotate(-50deg) blur(1px) } 80% { transform: scale(.96, 1.06) } 100% { transform: none; filter: none } }
@keyframes lgFoxfire { 0% { transform: translateX(-120px); opacity: 0 } 10% { opacity: .9; transform: translateX(-120px) } 18% { opacity: 0 } 26% { opacity: .9; transform: translateX(110px) scale(.9) } 34% { opacity: 0 } 44% { opacity: .9; transform: translateX(-50px) scale(.95) } 52% { opacity: 0 } 64% { opacity: 1; transform: scale(1.18); filter: brightness(2) } 82% { transform: scale(.96); filter: brightness(1.2) } 100% { transform: none; filter: none } }
@keyframes lgBlindLunge { 0% { transform: translateY(-70%) scale(.9); opacity: 0 } 12% { opacity: 1 } 40% { transform: translateY(-28%) scale(.92) } 47% { transform: translateY(-25%) scale(.92) rotate(-4deg) } 53% { transform: translateY(-28%) scale(.92) rotate(3deg) } 60% { transform: translateY(-26%) scale(.92) rotate(0) } 74% { transform: translateY(5%) scale(1.2) } 86% { transform: translateY(-2%) scale(.97) } 100% { transform: none } }
@keyframes lgGallop { 0% { transform: translateX(260px); opacity: 0 } 12% { opacity: 1; transform: translate(200px, -14px) } 24% { transform: translate(150px, 0) } 36% { transform: translate(100px, -14px) } 48% { transform: translate(50px, 0) } 60% { transform: translate(10px, -14px) } 74% { transform: translate(-6px, 0) rotate(-10deg) } 88% { transform: rotate(4deg) } 100% { transform: none } }
@keyframes lgRoarShake { 0% { transform: rotate(-70deg) translateX(-60px); opacity: 0 } 25% { opacity: 1 } 55% { transform: rotate(6deg) } 62% { transform: rotate(4deg) translate(-4px, 2px) } 68% { transform: rotate(3deg) translate(4px, -2px) } 74% { transform: rotate(2deg) translate(-3px, 1px) } 82% { transform: rotate(-1deg) } 100% { transform: none } }
@keyframes lgDescend { 0% { transform: translateY(-220px) scale(.8); opacity: 0; filter: brightness(3) blur(4px) } 50% { opacity: 1; filter: brightness(2) blur(0) } 75% { transform: translateY(8px) scale(1.06) } 100% { transform: none; filter: none } }
@keyframes lgHydraRise { 0% { transform: translateY(45%) scale(1.5, .12); opacity: 0 } 15% { opacity: 1; transform: translateY(42%) scale(1.45, .18) } 30% { transform: translateY(30%) scale(1.3, .3) } 48% { transform: translateY(-14%) scale(.82, 1.4) rotate(-9deg) } 60% { transform: translateY(-8%) scale(.9, 1.25) rotate(8deg) } 72% { transform: translateY(-2%) scale(.95, 1.1) rotate(-5deg) } 84% { transform: translateY(2%) scale(1.05, .95) rotate(2deg) } 100% { transform: none } }
@keyframes lgPowerUp { 0% { transform: translateY(24%) scale(.8); opacity: 0; filter: brightness(.15) } 12% { opacity: 1; transform: translateY(24%) scale(.8) } 22% { transform: translateY(14%) scale(.87); filter: brightness(1.9) } 30% { transform: translateY(14%) scale(.87); filter: brightness(.4) } 42% { transform: translateY(6%) scale(.94); filter: brightness(2.1) } 50% { transform: translateY(6%) scale(.94); filter: brightness(.5) } 64% { transform: translateY(-4%) scale(1.08); filter: brightness(2.6) } 72% { transform: translate(-5px, -2%) scale(1.06) } 78% { transform: translate(5px, -1%) scale(1.05) } 84% { transform: translate(-3px, 0) scale(1.02); filter: brightness(1.3) } 100% { transform: none; filter: none } }
@keyframes lgLevitate { 0% { transform: translateY(70%) rotate(-7deg); opacity: 0; filter: brightness(.3) blur(3px) } 25% { opacity: .9; transform: translateY(45%) rotate(6deg); filter: blur(1px) } 50% { transform: translateY(24%) rotate(-5deg) } 66% { transform: translateY(14%) rotate(3deg); filter: brightness(1) blur(0) } 76% { transform: translateY(-16%) scale(1.1); filter: brightness(2) } 88% { transform: translateY(3%) scale(.98) } 100% { transform: none; filter: none } }
@keyframes lgTripleRoar { 0% { transform: scale(.55); opacity: 0 } 10% { opacity: 1 } 20% { transform: scale(.7) rotate(-5deg) } 26% { transform: scale(.66) rotate(3deg) } 44% { transform: scale(.88) rotate(5deg) } 50% { transform: scale(.84) rotate(-3deg) } 70% { transform: scale(1.18) rotate(-6deg) } 76% { transform: scale(1.12) rotate(5deg) } 82% { transform: scale(1.1) rotate(-3deg) } 90% { transform: scale(.97) } 100% { transform: none } }
@keyframes lgHolyUnfold { 0% { transform: translateY(-70px) rotate(-120deg) scale(.04); opacity: 0; filter: brightness(6) } 12% { opacity: 1 } 34% { transform: translateY(-62px) rotate(-60deg) scale(.1); filter: brightness(5) } 62% { transform: translateY(-6px) rotate(8deg) scale(1.16); filter: brightness(2.4) } 76% { transform: translateY(2px) rotate(-3deg) scale(.95) } 88% { transform: rotate(1deg) scale(1.02) } 100% { transform: none; filter: none } }
@keyframes lgAbyssBreach { 0% { transform: translateY(120%) scale(.9, 1.2); opacity: 0 } 10% { opacity: 1 } 40% { transform: translateY(-18%) scale(.92, 1.14) } 52% { transform: translateY(-22%) rotate(-4deg) } 66% { transform: translateY(10%) scale(1.06, .9) rotate(3deg) } 80% { transform: translateY(-4%) rotate(-1deg) } 100% { transform: none } }
@keyframes lgFlareBurst { 0% { transform: scale(.08); opacity: 0; filter: brightness(5) saturate(2) } 12% { opacity: 1 } 38% { transform: scale(1.26) translateY(-4%); filter: brightness(2.6) saturate(1.6) } 54% { transform: scale(1.18) translateY(-3%) } 70% { transform: scale(.9) translateY(4%); filter: brightness(1.3) } 84% { transform: scale(1.04) } 100% { transform: none; filter: none } }
@keyframes lgTimeReverse { 0% { transform: rotate(540deg) scale(.2); opacity: 0 } 12% { opacity: 1 } 30% { transform: rotate(300deg) scale(.5) } 34% { transform: rotate(320deg) scale(.48) } 52% { transform: rotate(120deg) scale(.8) } 56% { transform: rotate(140deg) scale(.78) } 72% { transform: rotate(-20deg) scale(1.08) } 76% { transform: rotate(-8deg) scale(1.04) } 88% { transform: rotate(4deg) } 100% { transform: none } }
@keyframes lgBatAssemble { 0% { transform: scale(2.2, .3); opacity: 0 } 10% { opacity: .5 } 22% { transform: scale(1.7, .6) skewX(18deg); opacity: .9 } 30% { opacity: .4 } 38% { transform: scale(1.3, .8) skewX(-14deg); opacity: 1 } 46% { opacity: .55 } 56% { transform: scale(.86, 1.16) skewX(6deg); opacity: 1 } 72% { transform: scale(1.06, .95) } 100% { transform: none } }
@keyframes lgBoltDrop { 0% { transform: translateY(-160%) scaleY(2.4) scaleX(.25); opacity: 0 } 7% { opacity: 1; filter: brightness(6) } 14% { transform: translateY(6%) scaleY(.8) scaleX(1.16); filter: brightness(3.5) } 20% { transform: translateY(0) scale(1.18, .88); filter: brightness(1) } 24% { filter: brightness(4) } 28% { filter: brightness(1) } 46% { transform: scale(.96, 1.05) } 64% { transform: scale(1.03) } 100% { transform: none; filter: none } }
@keyframes lgShardFocus { 0% { transform: rotate(-180deg) scale(1.8); opacity: 0; filter: hue-rotate(160deg) brightness(2) } 14% { opacity: .7 } 30% { transform: rotate(-120deg) scale(1.5); filter: hue-rotate(110deg) } 33% { transform: rotate(-90deg) scale(1.5) } 50% { transform: rotate(-60deg) scale(1.25); filter: hue-rotate(60deg) } 53% { transform: rotate(-30deg) scale(1.2); opacity: 1 } 70% { transform: rotate(-10deg) scale(1.06); filter: hue-rotate(20deg) } 73% { transform: rotate(0deg) scale(1.04) } 100% { transform: none; filter: none } }
@keyframes lgStringDrop { 0% { transform: translateY(-140%) rotate(0); opacity: 0 } 8% { opacity: 1 } 30% { transform: translateY(12%) rotate(-8deg) } 40% { transform: translateY(-14%) rotate(10deg) } 52% { transform: translateY(6%) rotate(-12deg) } 62% { transform: translateY(-4%) rotate(9deg) } 72% { transform: translateY(2%) rotate(-5deg) } 80% { transform: translateY(-6%) rotate(0) scale(1.05, .95) } 88% { transform: translateY(0) scale(.98, 1.03) } 100% { transform: none } }
@keyframes lgWarCharge { 0% { transform: translateX(-160%) skewX(-18deg); opacity: 0 } 8% { opacity: 1 } 38% { transform: translateX(14%) skewX(-12deg) scale(1.04, .96) } 50% { transform: translateX(8%) skewX(10deg) rotate(4deg) } 60% { transform: translateX(-4%) skewX(-4deg) rotate(-3deg) } 70% { transform: translateY(-10%) } 78% { transform: translateY(4%) scale(1.1, .88) } 88% { transform: scale(.98, 1.03) } 100% { transform: none } }
@keyframes lgHiveRumble { 0% { transform: translateY(45%) scale(.9); opacity: 0 } 6% { opacity: 1 } 10% { transform: translateY(45%) translateX(-3px) } 14% { transform: translateY(44%) translateX(3px) } 18% { transform: translateY(45%) translateX(-3px) } 22% { transform: translateY(44%) translateX(3px) } 26% { transform: translateY(45%) translateX(-2px) } 30% { transform: translateY(43%) translateX(2px) } 56% { transform: translateY(-8%) scale(1.04) } 70% { transform: translateY(3%) scale(.98) } 84% { transform: translateY(-1%) } 100% { transform: none } }
@keyframes lgSerpentRear { 0% { transform: translateX(130%) translateY(18%) skewX(20deg) scaleY(.7); opacity: 0 } 8% { opacity: 1 } 22% { transform: translateX(80%) translateY(12%) skewX(-18deg) scaleY(.72) } 36% { transform: translateX(40%) translateY(14%) skewX(18deg) scaleY(.75) } 50% { transform: translateX(8%) translateY(10%) skewX(-12deg) scaleY(.8) } 66% { transform: translateY(-10%) scaleY(1.16) scaleX(.94) } 80% { transform: translateY(2%) scaleY(.96) } 100% { transform: none } }
@keyframes lgWailPulse { 0% { transform: scale(.4); opacity: 0 } 10% { transform: scale(.7); opacity: .4 } 16% { transform: scale(.6); opacity: .3 } 28% { transform: scale(.92); opacity: .7 } 34% { transform: scale(.82); opacity: .55 } 48% { transform: scale(1.12); opacity: 1 } 54% { transform: scale(1.02) } 66% { transform: scale(1.22) } 72% { transform: scale(1.08) } 86% { transform: scale(.98) } 100% { transform: none } }
@keyframes lgScytheSwoop { 0% { transform: translate(120%, -120%) rotate(70deg) scale(.6); opacity: 0 } 10% { opacity: 1 } 34% { transform: translate(60%, -10%) rotate(30deg) scale(.85) } 52% { transform: translate(-14%, 8%) rotate(-12deg) scale(1.05) } 66% { transform: translate(4%, -4%) rotate(5deg) } 80% { transform: translate(0, 2%) rotate(-2deg) } 100% { transform: none } }
@keyframes lgEldritchUnfold { 0% { transform: scale(.06, .002); opacity: 0 } 10% { opacity: 1; transform: scale(.06, .02) } 26% { transform: scale(.08, .2) } 34% { transform: scale(.1, .18) } 56% { transform: scale(1.22, .86) } 66% { transform: scale(.86, 1.14) } 76% { transform: scale(1.08, .94) } 86% { transform: scale(.97, 1.03) } 100% { transform: none } }
@keyframes lgMoonrise { 0% { transform: translate(-70%, 30%) scale(.32); opacity: 0; filter: brightness(.15) } 8% { opacity: 1 } 22% { transform: translate(-30%, 52%) scale(.46); filter: brightness(.3) } 36% { transform: translate(28%, 50%) scale(.6); filter: brightness(.5) } 50% { transform: translate(58%, 18%) scale(.74); filter: brightness(.75) } 62% { transform: translate(30%, -22%) scale(.88); filter: brightness(1.2) } 72% { transform: translate(0, -10%) scale(1.24); filter: brightness(2.2) } 80% { transform: translate(0, 2%) scale(.92); filter: brightness(1.1) } 90% { transform: scale(1.05) } 100% { transform: none; filter: none } }
@keyframes lgGyroAlign { 0% { transform: perspective(520px) rotateX(84deg) scale(.12); opacity: 0; filter: brightness(4) } 8% { opacity: 1 } 24% { transform: perspective(520px) rotateX(-62deg) rotateY(38deg) scale(.3); filter: brightness(3.2) } 40% { transform: perspective(520px) rotateX(48deg) rotateY(-72deg) scale(.52); filter: brightness(2.6) } 54% { transform: perspective(520px) rotateX(-26deg) rotateY(30deg) scale(.78); filter: brightness(2) } 64% { transform: perspective(520px) rotateX(8deg) rotateY(-8deg) scale(.94) } 72% { transform: perspective(520px) rotateX(0) rotateY(0) scale(1.2); filter: brightness(2.8) } 82% { transform: scale(.95); filter: brightness(1.2) } 92% { transform: scale(1.03) } 100% { transform: none; filter: none } }
@keyframes lgPetalFall { 0% { transform: translate(-30%, -150%) rotate(-26deg) scale(.22); opacity: 0 } 8% { opacity: 1 } 20% { transform: translate(28%, -114%) rotate(22deg) scale(.24) } 34% { transform: translate(-24%, -78%) rotate(-20deg) scale(.26) } 48% { transform: translate(20%, -44%) rotate(15deg) scale(.28) } 60% { transform: translate(-8%, -14%) rotate(-8deg) scale(.3) } 70% { transform: translate(0, 0) scale(.32); filter: brightness(1.5) } 80% { transform: scale(1.2); filter: brightness(1.8) saturate(1.3) } 90% { transform: scale(.95); filter: brightness(1.1) } 100% { transform: none; filter: none } }
@keyframes lgCoinToss { 0% { transform: perspective(600px) translateY(120%) rotateX(0deg) scale(.3); opacity: 0 } 6% { opacity: 1 } 22% { transform: perspective(600px) translateY(-40%) rotateX(360deg) scale(.34); filter: brightness(1.6) } 36% { transform: perspective(600px) translateY(-70%) rotateX(720deg) scale(.4); filter: brightness(2) sepia(.6) } 50% { transform: perspective(600px) translateY(-42%) rotateX(1080deg) scale(.6); filter: brightness(1.6) sepia(.4) } 64% { transform: perspective(600px) translateY(0) rotateX(1440deg) scale(.9); filter: brightness(1.4) } 72% { transform: translateY(4%) scale(1.16, .8); filter: brightness(2.4) sepia(.5) } 80% { transform: translateY(-3%) scale(.94, 1.08); filter: brightness(1.3) } 90% { transform: scale(1.02, .98) } 100% { transform: none; filter: none } }
@keyframes lgSugarDrop { 0% { transform: translateY(-170%) scale(.62, .78); opacity: 0 } 6% { opacity: 1 } 30% { transform: translateY(0) scale(1.38, .58) } 40% { transform: translateY(-30%) scale(.8, 1.24) } 52% { transform: translateY(0) scale(1.24, .74) } 60% { transform: translateY(-11%) scale(.9, 1.12) } 68% { transform: translateY(0) scale(1.08, .9) } 72% { transform: translateY(0) scale(1.16, .84); filter: brightness(1.7) saturate(1.5) } 78% { transform: scale(.9, 1.12); filter: brightness(1.2) } 84% { transform: scale(1.07, .94) } 90% { transform: scale(.97, 1.04) } 95% { transform: scale(1.01, .99) } 100% { transform: none; filter: none } }
@keyframes lgCurtainPart { 0% { clip-path: inset(-60% 50% -60% 50%); transform: scale(1.06); filter: brightness(.12) saturate(0); opacity: 0 } 6% { opacity: 1 } 38% { clip-path: inset(-60% -60% -60% -60%); transform: scale(1.06); filter: brightness(.14) saturate(0) } 50% { transform: scale(1.02); filter: brightness(2.8) saturate(1.4) } 60% { transform: none; filter: brightness(1.15) } 72% { transform: rotate(-8deg) translateY(5%) scale(.97, .93) } 84% { transform: rotate(2.5deg) translateY(-3%) scale(1.02, 1.05) } 93% { transform: rotate(-.8deg) translateY(.5%) } 100% { clip-path: inset(-60% -60% -60% -60%); transform: none; filter: none } }
@keyframes lgHoundPace { 0% { transform: translateX(-22%) scale(.78); filter: brightness(.12) saturate(.2); opacity: 0 } 6% { opacity: 1 } 16% { transform: translateX(-4%) scale(.78) rotate(1.5deg); filter: brightness(.14) saturate(.2) } 26% { transform: translateX(20%) scale(.78) rotate(-1.5deg) } 36% { transform: translateX(4%) scale(.78) rotate(1.5deg) } 46% { transform: translateX(-16%) scale(.78) rotate(-1deg) } 56% { transform: translateX(0) scale(.8, .7); filter: brightness(.2) saturate(.3) } 64% { transform: translateY(4%) scale(.86, .62); filter: brightness(.3) } 72% { transform: translateY(-6%) scale(1.34, 1.24); filter: brightness(1.9) saturate(1.4) } 80% { transform: translateY(3%) scale(1.06, .9); filter: brightness(1.2) } 88% { transform: translateY(-1%) scale(.98, 1.04) } 94% { transform: scale(1.01, .99) } 100% { transform: none; filter: none } }
@keyframes lgRealityTear { 0% { transform: scale(1.3, .02); opacity: 0; filter: brightness(3) } 14% { opacity: 1; transform: scale(1.3, .03) } 28% { transform: scale(1.1, .05) } 46% { transform: scale(.94, 1.28); filter: brightness(2) hue-rotate(40deg) } 54% { transform: translateX(-9px) scale(1.04, .94) } 60% { transform: translateX(8px) scale(.98, 1.04); filter: hue-rotate(-30deg) } 66% { transform: translateX(-5px) } 72% { transform: translateX(3px) scale(1.02) } 100% { transform: none; filter: none } }
@keyframes lgPhaseShift { 0% { transform: none; filter: none } 10% { transform: scale(1.3); filter: brightness(3) saturate(0) } 22% { transform: scale(.9) translateX(-7px) rotate(-4deg); filter: brightness(1.2) } 32% { transform: scale(1.22) translateX(7px) rotate(4deg); filter: brightness(2.4) } 44% { transform: scale(.96) translateX(-4px) } 58% { transform: scale(1.14); filter: brightness(1.7) saturate(1.6) } 100% { transform: none; filter: none } }
@keyframes lgPhaseTag { 0% { transform: translate(-50%, -6px); opacity: 0 } 15% { transform: translate(-50%, 0); opacity: 1 } 75% { opacity: 1 } 100% { transform: translate(-50%, 0); opacity: 0 } }
@keyframes lgPhaseRing { 0% { transform: translate(-50%, -50%) scale(.3); opacity: .95 } 100% { transform: translate(-50%, -50%) scale(2.4); opacity: 0 } }
@keyframes lgQuake { 0%,100% { transform: translate(0, 0) } 12% { transform: translate(-9px, 5px) } 25% { transform: translate(8px, -6px) } 38% { transform: translate(-7px, -3px) } 52% { transform: translate(6px, 4px) } 66% { transform: translate(-4px, 2px) } 80% { transform: translate(3px, -2px) } }
@keyframes lgShock { 0% { transform: translate(-50%, -50%) scale(.2); opacity: 0 } 6% { opacity: .9 } 100% { transform: translate(-50%, -50%) scale(2.6); opacity: 0 } }
@keyframes lgDust { 0% { transform: translate(0, 0) scale(.6); opacity: 0 } 8% { opacity: .9 } 100% { transform: translate(var(--dx), -26px) scale(1.4); opacity: 0 } }
@keyframes lgHeartbeat { 0%,100% { transform: scale(1); opacity: .55 } 14% { transform: scale(1.12); opacity: .9 } 28% { transform: scale(1); opacity: .6 } 42% { transform: scale(1.08); opacity: .85 } }
@keyframes lgEyes { 0%,100% { filter: drop-shadow(0 0 0 transparent) } 50% { filter: drop-shadow(0 0 14px var(--c-danger)) brightness(1.15) } }
@keyframes lgEyesGlow { 0%,100% { opacity: 0 } 50% { opacity: 1 } }
@keyframes lgEyesLift { 0%,100% { filter: brightness(1) } 50% { filter: brightness(1.15) } }
@keyframes lgStamp { 0% { transform: scale(2.4); opacity: 0; letter-spacing: .3em } 70% { transform: scale(.94); opacity: 1 } 100% { transform: scale(1); letter-spacing: normal } }
@keyframes lgPopIn { 0% { transform: scale(0) } 70% { transform: scale(1.35) } 100% { transform: scale(1) } }
@keyframes lgRise { 0% { transform: translateY(24px); opacity: 0 } 100% { transform: translateY(0); opacity: 1 } }
@keyframes lgCall { 0%,100% { transform: scale(1) } 50% { transform: scale(1.06) } }
/* The intro card off screen (scrolled away in the asset view): its endless loops hold still, so they stop repainting
   the page; on screen nothing changes. lg-loop1 = the loop is the element's only animation, lg-loop2 = its second. */
.lg-intro-off .lg-loop1 { animation-play-state: paused !important }
.lg-intro-off .lg-loop2 { animation-play-state: running, paused !important }
@media (prefers-reduced-motion: reduce) { .lg-boss:not(.lg-motion), .lg-boss:not(.lg-motion) *:not(svg):not(svg *) { animation: none !important; opacity: 1 !important } }
.lg-calm, .lg-calm *:not(svg):not(svg *) { animation: none !important }
@media (prefers-reduced-motion: reduce) { .lg-boss:not(.lg-motion) [class*="lgfa-"], .lg-boss:not(.lg-motion) [class*="lgr-"] { animation: none !important } }
.lg-calm [class*="lgfa-"], .lg-calm [class*="lgr-"] { animation: none !important }
/* fx-layer motion (fx/<motif>.jsx css on lgfa-* parts and lg-fx-* layers) is off with the other reactions: focus mode, Still bosses, reduced motion */
.lg-fx-off [class*="lgfa-"], .lg-fx-off [class*="lgfa-"] *, .lg-fx-off [class*="lg-fx-"], .lg-fx-off [class*="lg-fx-"] * { animation: none !important }
.lg-boss[data-phase="2"] .lg-p2, .lg-boss[data-phase="3"] .lg-p2, .lg-boss[data-phase="3"] .lg-p3 { display: inline !important }
.lg-boss[data-phase="2"] .lg-p1, .lg-boss[data-phase="3"] .lg-p1, .lg-boss[data-phase="3"] .lg-p12 { display: none !important }
`
export const BossStyle = () => <style>{CSS}</style>

// True while the element is fully off screen (no observer: never).
function useOffscreen(ref) {
  const [off, setOff] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return undefined
    const io = new IntersectionObserver(([e]) => setOff(!e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [ref])
  return off
}

// INTRO_EYES_GLOW_LAYER: the drop-shadow's look (14px red glow around the silhouette, 1.3s ease-in-out pulse) as a
// static blurred, masked layer whose opacity pulses. Inset by the figure's headroom, like the mask's viewBox.
function EyesGlow({ kind, motif, delay }) {
  const raw = useArtMarkup(kind, motif)
  const url = useMemo(() => {
    const svg = artGlowMask(raw)
    return svg && typeof URL !== 'undefined' && URL.createObjectURL ? URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })) : ''
  }, [raw])
  useEffect(() => () => { if (url) URL.revokeObjectURL(url) }, [url])
  if (!url) return null
  const m = `url(${url})`
  // The blur sits on the OUTER box: CSS applies a filter before the mask, so on one box the mask cut the glow back to a
  // crisp silhouette hidden under the boss.
  return (
    <div aria-hidden="true" className="lg-loop1" style={{ position: 'absolute', inset: `-${HEADROOM_SHARE * 100}%`, pointerEvents: 'none',
      filter: 'blur(7px)', opacity: 0, willChange: 'opacity', animation: `lgEyesGlow 1.3s ease-in-out ${delay}s infinite` }}>
      <div style={{ width: '100%', height: '100%', background: C.danger, maskImage: m, WebkitMaskImage: m, maskSize: '100% 100%', WebkitMaskSize: '100% 100%', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat' }} />
    </div>
  )
}

// The entrance: the stage darkens, hazard stripes close in, the boss slams down (the stage quakes, a shockwave and
// dust), its eyes flash, the title stamps in, the lives pop in one by one and the Fight button rises. ~2s, CSS only.
export const ENTRANCE = { stripes: 0.15, slam: 0.45, impact: 0.95, title: 1.15, lives: 1.45, fight: 1.9 } // s
// How many times the Fight! button pulses after it appears, then it rests.
export const FIGHT_CALL_PULSES = 4
// Every boss arrives its own way (keyed by the area's motif; the file's own lg-in animations add the rest: eyes
// open, a roar). Each lands at ENTRANCE.impact (starts at `slam`, lasts `dur`), where the quake and shockwave hit.
// Every motif moves in a COMPLETELY different way (owner's rule: no two entrances alike, not even the same move from
// another side). `origin` = the pivot for that move (a swing from above, a topple from a corner).
export const ENTRANCES = {
  forest: { name: 'lgRootRise', ease: 'cubic-bezier(.3,.8,.4,1)' }, // bursts up out of the ground
  city: { name: 'lgGlitchIn', ease: 'linear' }, // glitches in like a broken screen
  ocean: { name: 'lgSurge', ease: 'cubic-bezier(.3,.7,.4,1)' }, // crashes in like a wave from the right
  mountains: { name: 'lgSlam', ease: 'cubic-bezier(.5,0,.7,1)' }, // drops from the sky and slams down
  lab: { name: 'lgWarpIn', ease: 'cubic-bezier(.3,.9,.4,1)' }, // teleports in on a beam
  stage: { name: 'lgSpinIn', ease: 'cubic-bezier(.2,.8,.3,1)' }, // spins in under the spotlight
  sky: { name: 'lgSwoop', ease: 'cubic-bezier(.3,.7,.4,1)' }, // swoops down from the clouds
  desert: { name: 'lgBurrow', ease: 'cubic-bezier(.3,.8,.4,1)' }, // tunnels up out of the sand
  volcano: { name: 'lgErupt', ease: 'cubic-bezier(.2,.8,.4,1)' }, // erupts out of the lava
  ice: { name: 'lgShatterIn', ease: 'cubic-bezier(.3,.9,.4,1)' }, // freezes into being in a flash
  swamp: { name: 'lgCroakSwell', ease: 'cubic-bezier(.3,.7,.4,1)', origin: 'bottom center' }, // puffs up like a balloon, sighs half flat, swells huge with a croak, sags back
  castle: { name: 'lgMarch', ease: 'linear' }, // marches in with heavy stomps
  graveyard: { name: 'lgPhaseIn', ease: 'linear' }, // phases in like a ghost, flickering
  jungle: { name: 'lgStrike', ease: 'cubic-bezier(.2,.9,.3,1)' }, // strikes in from the side
  space: { name: 'lgBlackHole', ease: 'cubic-bezier(.3,.7,.3,1)' }, // spirals out of a black hole
  clockwork: { name: 'lgWindUp', ease: 'linear' }, // ratchets up jerk by jerk
  carnival: { name: 'lgSpring', ease: 'cubic-bezier(.3,.8,.4,1)' }, // springs out of its box
  underworld: { name: 'lgCharge', ease: 'cubic-bezier(.3,.8,.3,1)' }, // charges up out of the dark
  moonlit: { name: 'lgLeap', ease: 'cubic-bezier(.3,.6,.4,1)' }, // leaps in on a high arc
  fungal: { name: 'lgSporeBurst', ease: 'cubic-bezier(.3,.8,.4,1)' }, // bursts out of a spore cloud
  pirate: { name: 'lgSwing', ease: 'cubic-bezier(.3,.6,.5,1)', origin: '50% -80%' }, // swings in on a rope like a pendulum
  dojo: { name: 'lgSlash', ease: 'cubic-bezier(.2,.9,.3,1)' }, // cut into view by a blade slash
  crystal: { name: 'lgRefract', ease: 'cubic-bezier(.3,.8,.4,1)' }, // refracts into being
  arcade: { name: 'lgPixelate', ease: 'steps(6, end)' }, // assembles pixel by pixel
  library: { name: 'lgBookFlip', ease: 'cubic-bezier(.3,.8,.4,1)' }, // flips open with a slam
  sewer: { name: 'lgScurry', ease: 'cubic-bezier(.3,.7,.4,1)', origin: 'left center' }, // squeezes out of a drain pipe
  arena: { name: 'lgGraveRise', ease: 'cubic-bezier(.4,.1,.5,1)', origin: 'bottom center' }, // a black silhouette tips up from flat on its back like a raised drawbridge, then the light catches him and he stops dead
  hive: { name: 'lgBuzz', ease: 'linear' }, // buzzes in on a zigzag
  garden: { name: 'lgBloom', ease: 'cubic-bezier(.3,.8,.4,1)' }, // blooms out of the soil
  sweets: { name: 'lgCurtsy', ease: 'cubic-bezier(.3,.7,.4,1)', origin: 'bottom center' }, // grows into view, sinks into a slow regal curtsy, rises tall
  savanna: { name: 'lgPounce', ease: 'cubic-bezier(.3,.7,.4,1)', origin: 'bottom center' }, // stalks in low, crouches, then springs up tall
  mirror: { name: 'lgMirrorFlip', ease: 'linear' }, // flips over like its own reflection, glass flashing
  manor: { name: 'lgHaunt', ease: 'cubic-bezier(.3,.7,.4,1)', origin: 'bottom center' }, // billows up out of the floor like a sheet
  junkyard: { name: 'lgAssemble', ease: 'linear', origin: 'bottom left' }, // heaves itself up from lying on its side
  dream: { name: 'lgHypno', ease: 'cubic-bezier(.3,.7,.4,1)', origin: 'top center' }, // melts into shape like a dripping dream
  sakura: { name: 'lgFoxfire', ease: 'linear' }, // blinks in and out like a trickster before it appears
  mine: { name: 'lgBlindLunge', ease: 'linear', origin: 'top center' }, // creeps down out of the shaft, sniffs twice, then lunges at you
  frontier: { name: 'lgGallop', ease: 'linear' }, // gallops in from the side
  primeval: { name: 'lgRoarShake', ease: 'cubic-bezier(.3,.7,.4,1)', origin: 'bottom right' }, // leans into frame head first and roars
  celestial: { name: 'lgDescend', ease: 'cubic-bezier(.3,.7,.4,1)' }, // descends in a blaze of light
  // Raid bosses (raids/<motif>.svg)
  hydra: { name: 'lgHydraRise', ease: 'cubic-bezier(.3,.8,.4,1)', origin: 'bottom center' }, // crushed flat at the waterline, then the necks whip up tall
  titan: { name: 'lgPowerUp', ease: 'linear', origin: 'bottom center' }, // rises in three hydraulic jerks with power surges, then shudders
  lich: { name: 'lgLevitate', ease: 'cubic-bezier(.3,.6,.4,1)' }, // drifts up swaying, then snaps upward as the power takes hold
  chimera: { name: 'lgTripleRoar', ease: 'cubic-bezier(.3,.8,.4,1)', origin: 'bottom center' }, // three roars, each a bigger lunge
  void: { name: 'lgRealityTear', ease: 'cubic-bezier(.3,.8,.4,1)' }, // a slit in reality tears open, jitters and holds
  seraph: { name: 'lgHolyUnfold', ease: 'cubic-bezier(.25,.8,.35,1)' }, // a point of light high above spins open and descends
  leviathan: { name: 'lgAbyssBreach', ease: 'cubic-bezier(.3,.8,.4,1)', origin: 'bottom center' }, // breaches up from the deep, lurches, settles
  inferno: { name: 'lgFlareBurst', ease: 'cubic-bezier(.3,.8,.4,1)' }, // bursts out of a flare far too big, then crashes down
  chronos: { name: 'lgTimeReverse', ease: 'linear' }, // plays backwards: rewinds into place in stuttering steps
  vampire: { name: 'lgBatAssemble', ease: 'cubic-bezier(.3,.7,.4,1)' }, // a flickering cloud of bats pulls together into her
  tempest: { name: 'lgBoltDrop', ease: 'cubic-bezier(.2,.9,.3,1)' }, // a lightning strike: it is suddenly there, then billows
  kaleido: { name: 'lgShardFocus', ease: 'linear' }, // a kaleidoscope clicking into focus
  puppeteer: { name: 'lgStringDrop', ease: 'cubic-bezier(.3,.7,.4,1)', origin: 'top center' }, // dropped on strings, dangles, jerked upright
  berserker: { name: 'lgWarCharge', ease: 'cubic-bezier(.3,.8,.4,1)', origin: 'bottom center' }, // charges in from the side, skids, stomps
  swarmqueen: { name: 'lgHiveRumble', ease: 'cubic-bezier(.3,.7,.4,1)', origin: 'bottom center' }, // the comb shivers, she pushes up out of it
  gorgon: { name: 'lgSerpentRear', ease: 'cubic-bezier(.3,.7,.4,1)', origin: 'bottom center' }, // slithers in on an S-curve, rears up
  banshee: { name: 'lgWailPulse', ease: 'cubic-bezier(.3,.7,.4,1)' }, // fades in on swelling waves of a scream
  reaper: { name: 'lgScytheSwoop', ease: 'cubic-bezier(.3,.8,.4,1)' }, // swoops down from the corner on a scythe arc
  dreamer: { name: 'lgEldritchUnfold', ease: 'cubic-bezier(.3,.8,.4,1)' }, // one eye opens, then it unfolds with a jelly wobble
  moonmaw: { name: 'lgMoonrise', ease: 'cubic-bezier(.35,.6,.4,1)' }, // swings around a full orbit in eclipse, waxing to full, then a gravity pulse
  ophanim: { name: 'lgGyroAlign', ease: 'cubic-bezier(.3,.7,.4,1)' }, // tumbles in on two axes like a gyroscope of wheels, then locks upright in a blaze
  kitsune: { name: 'lgPetalFall', ease: 'cubic-bezier(.3,.6,.4,1)' }, // drifts down like a falling sakura petal, side to side, then blooms to full size
  ratking: { name: 'lgCoinToss', ease: 'cubic-bezier(.3,.7,.4,1)' }, // tossed up from below like a coin, flipping end over end, then lands with a heavy squash in a flash of gold
  sugarqueen: { name: 'lgSugarDrop', ease: 'cubic-bezier(.4,.1,.5,1)', origin: 'bottom center' }, // dropped onto her cake platter from above, splats and bounces twice like jelly, then wobbles still
  showman: { name: 'lgCurtainPart', ease: 'cubic-bezier(.3,.6,.4,1)', origin: 'bottom center' }, // the curtains part on a dark silhouette, the spotlight hits him in a blaze, he sweeps a deep bow and snaps upright
  cerberus: { name: 'lgHoundPace', ease: 'linear', origin: 'bottom center' }, // paces left and right in the dark behind the gate, stops dead, crouches, then rams through at you and plants
}
export const entranceFor = (motif) => ENTRANCES[motif] || ENTRANCES.mountains
// `odds`: bossOdds options ({ bonus, pass }); `legendary`: the harder replay of a cleared area.
// `calm` (focus mode): the card shows at once, still (no stripes sliding, slam, quake or entrance animation).
// `kind`: 'raids' shows a raid boss (its own art folder and its own lives count, `raidLives`; `raidLeft` = the siege's
// hearts left, the lost ones greyed).
export function BossIntro({ t, area, name = '', total, onFight, odds, legendary = false, calm: focusCalm = false, kind = 'bosses', raidLives = 0, raidLeft = null, ability = '' }) {
  const motion = useArtMotionAlways()
  const stillArt = useArtStill()
  const calm = focusCalm || stillArt
  const odds0 = bossOdds(total, odds)
  const lives = kind === 'raids' ? raidLives : odds0.lives
  const bonus = kind === 'raids' ? 0 : odds0.bonus
  const E = ENTRANCE
  const cardRef = useRef(null)
  const entrance = entranceFor(area?.motif)
  const NIGHT = `color-mix(in srgb, ${C.bg} 25%, black)` // the stage is dark in both themes
  const stripe = `repeating-linear-gradient(-45deg, ${C.danger} 0 14px, color-mix(in srgb, ${C.danger} 20%, black) 14px 28px)`
  const band = (side) => ({
    position: 'absolute', left: 0, right: 0, height: 30, [side]: 18, display: 'grid', placeItems: 'center', overflow: 'hidden',
    boxShadow: `0 0 18px color-mix(in srgb, ${C.danger} 60%, transparent)`,
    animation: `${side === 'top' ? 'lgStripeL' : 'lgStripeR'} .4s cubic-bezier(.2,.9,.3,1) ${E.stripes}s both`,
  })
  // The stripes slide on their own layer, one tile wider on the left, moved by transform (composited) instead of
  // background-position (a full repaint every frame); the tiles line up with the band's left edge as before.
  const stripes = <span aria-hidden="true" className="lg-loop1" style={{ position: 'absolute', top: 0, bottom: 0, left: -40, right: 0, background: stripe, animation: 'lgStripeMove 1.2s linear infinite' }} />
  const off = useOffscreen(cardRef)
  // The glow layer exists only while it would pulse (like the shockwave): stilled, the old filter showed no glow.
  const glowLayer = INTRO_EYES_GLOW_LAYER && !calm && (motion || !reducedMotion())
  const label = { position: 'relative', fontFamily: FONT.display, fontWeight: 900, fontSize: 15, letterSpacing: '.35em', color: C.white, padding: '0 14px', background: `color-mix(in srgb, ${C.danger} 20%, black)`, borderRadius: 4, textTransform: 'uppercase' }
  return (
    <div ref={cardRef} className={(calm ? 'lg-boss lg-calm' : 'lg-boss') + (motion ? ' lg-motion' : '') + (off ? ' lg-intro-off' : '')} style={{ maxWidth: 640, margin: '12px auto', position: 'relative', borderRadius: RADIUS.xl, overflow: 'hidden', animation: `lgStageIn .3s ease-out both, lgQuake .45s ease-out ${E.impact}s` }}>
      <BossStyle />
      <div style={{ position: 'relative', padding: '64px 20px 76px', display: 'grid', gap: 14, justifyItems: 'center', textAlign: 'center',
        background: `radial-gradient(ellipse at 50% 42%, color-mix(in srgb, ${C.danger} 30%, ${NIGHT}) 0%, ${NIGHT} 72%)` }}>
        <div aria-hidden="true" style={band('top')}>{stripes}<span style={label}>⚠ {kind === 'raids' ? t('lg_raid') : legendary ? t('lg_legendary') : t('lg_boss')} ⚠</span></div>
        <div aria-hidden="true" style={band('bottom')}>{stripes}<span style={label}>⚠ {kind === 'raids' ? t('lg_raid') : legendary ? t('lg_legendary') : t('lg_boss')} ⚠</span></div>
        <div style={{ position: 'relative', width: BOSS.intro, height: BOSS.intro, margin: `${headroomPx(BOSS.intro)}px 0` }}>
          <div aria-hidden="true" className="lg-loop2" style={{ position: 'absolute', inset: -40, borderRadius: '50%', background: `radial-gradient(circle, color-mix(in srgb, ${C.danger} 55%, transparent) 0%, transparent 65%)`, animation: `lgStageIn .2s ease-out ${E.impact}s both, lgHeartbeat 1.3s ease-in-out ${E.impact}s infinite` }} />
          {/* Shockwave and dust exist ONLY as animation (invisible at both ends): stilled, they stuck on screen as a stray ring
              and grey dots. */}
          {!calm && (motion || !reducedMotion()) && <>
          <div aria-hidden="true" style={{ position: 'absolute', left: '50%', top: '88%', width: BOSS.intro, height: BOSS.intro * 0.35, borderRadius: '50%', border: `4px solid ${C.danger}`, animation: `lgShock .6s ease-out ${E.impact}s both` }} />
          {Array.from({ length: 8 }, (_, i) => (
            <span key={i} aria-hidden="true" style={{ position: 'absolute', left: `${20 + i * 8.5}%`, bottom: 2, width: 14, height: 14, borderRadius: '50%', background: `color-mix(in srgb, ${C.inkDim} 60%, transparent)`, '--dx': `${(i - 3.5) * 14}px`, animation: `lgDust .7s ease-out ${E.impact}s both`, opacity: 0 }} />
          ))}
          </>}
          <div style={{ position: 'relative', transformOrigin: entrance.origin || '50% 50%', animation: `${entrance.name} ${(E.impact - E.slam).toFixed(2)}s ${entrance.ease} ${E.slam}s both` }}>
            {glowLayer && <EyesGlow kind={kind} motif={area?.motif} delay={E.impact + 0.2} />}
            <div className="lg-loop1" style={glowLayer ? { position: 'relative', animation: `lgEyesLift 1.3s ease-in-out ${E.impact + 0.2}s infinite` } : { animation: `lgEyes 1.3s ease-in-out ${E.impact + 0.2}s infinite` }}>
              {kind === 'bosses' ? <BossArt area={area} size={BOSS.intro} animated={calm ? 'idle' : 'intro'} roomed /> : <LegendsArt kind={kind} motif={area.motif} palette={area.palette} height={BOSS.intro} width={BOSS.intro} round={0} animated={calm ? 'idle' : 'intro'} roomed />}
            </div>
          </div>
        </div>
        <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 30, color: C.white, lineHeight: 1.1, textShadow: `0 0 18px color-mix(in srgb, ${C.danger} 80%, transparent), 0 3px 0 color-mix(in srgb, ${C.danger} 60%, black)`, animation: `lgStamp .45s cubic-bezier(.3,1.4,.5,1) ${E.title}s both` }}>
          {name ? t('lg_bossNamed', { name }) : t('lg_bossBlocks', { area: area.title })}
        </div>
        {name && <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 15, letterSpacing: '.08em', textTransform: 'uppercase', color: `color-mix(in srgb, ${C.danger} 55%, ${C.white})`, marginTop: -6, animation: `lgStamp .45s cubic-bezier(.3,1.4,.5,1) ${E.title + 0.15}s both` }}>{area.subtitle || t('lg_bossGuards', { area: area.title })}</div>}
        <Lives t={t} lives={lives} left={kind === 'raids' && raidLeft != null ? Math.max(0, Math.min(lives, raidLeft)) : lives} size={28} popFrom={E.lives} bonus={bonus} />
        {bonus > 0 && <div style={{ fontSize: 14, fontWeight: 800, color: C.warning, marginTop: -4, animation: `lgRise .4s ease-out ${E.lives + lives * 0.12}s both` }}>💖 {t('lg_bonusLife', { n: bonus })}</div>}
        {legendary && <div style={{ fontSize: 14, fontWeight: 800, color: `color-mix(in srgb, ${C.warning} 70%, ${C.white})`, marginTop: -4 }}>{t('lg_legendaryRules')}</div>}
        {ability && (
          <div style={{ maxWidth: 460, padding: '8px 14px', borderRadius: RADIUS.md, border: `2px solid color-mix(in srgb, ${C.purple} 70%, ${C.white})`, background: `color-mix(in srgb, ${C.purple} 22%, black)`, color: C.white, animation: `lgRise .4s ease-out ${E.lives + lives * 0.12 + 0.1}s both` }}>
            <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 15, letterSpacing: '.06em', textTransform: 'uppercase', color: `color-mix(in srgb, ${C.purple} 35%, ${C.white})` }}>{ABILITY_ICON[ability]} {t('lg_abilityIs', { name: t(`lg_ability_${ability}`) })}</div>
            <div style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.45, marginTop: 2 }}>{t(`lg_abilityDesc_${ability}`)}</div>
          </div>
        )}
        <div style={{ animation: `lgRise .4s ease-out ${E.fight}s both` }}>
          {/* The call to fight pulses a few times, then rests (it pulsed forever: a button that never holds still is hard
              to aim at, and drew the eye away from the boss long after the learner saw it). Calm modes never pulse. */}
          <div className="lg-loop1" style={{ animation: `lgCall 1.1s ease-in-out ${E.fight + 0.4}s ${FIGHT_CALL_PULSES}` }}>
            <ChunkyButton color={C.danger} onClick={onFight} style={{ minWidth: 200, fontSize: 18 }}>⚔️ {t('lg_bossFight')}</ChunkyButton>
          </div>
        </div>
        <MotionToggle t={t} dark />
      </div>
    </div>
  )
}

// `hits`/`misses` so far; `last` = { kind: 'hit' | 'miss', n } (n changes per answer, so the animation replays).
// The end of the fight, under the arena: the win, or out of lives. `onDone` goes to the result. `lostKey` = the loss line
// (a raid loss is not the end: the boss rallies and the siege goes on).
export function BossEnd({ t, won, onDone, lostKey = 'lg_bossLost' }) {
  const motion = useArtMotionAlways()
  const still = useArtStill()
  return (
    <div className={motion ? 'lg-boss lg-motion' : 'lg-boss'} style={{ display: 'grid', gap: 12, justifyItems: 'center', textAlign: 'center', padding: '10px 0' }}>
      <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 24, color: won ? C.success : C.danger, animation: still ? 'none' : 'lgBossBob 1.6s ease-in-out 2' }}>
        {won ? `🏆 ${t('lg_bossWon')}` : `💔 ${t(lostKey)}`}
      </div>
      <ChunkyButton color={won ? C.success : C.warning} onClick={onDone}>{t('lg_bossSeeResult')}</ChunkyButton>
    </div>
  )
}

// The obvious on/off for boss animations (features.legends.still), on the intro card and the fight itself, for a
// learner who wants the fight without the motion. Settings > General > Legends has the same switch.
// `small`: the icon alone (the slim strip), its words in the tooltip and the accessible name.
export function MotionToggle({ t, dark = false, small = false }) {
  const ctx = useFeatureCtx()
  const forced = useContext(ArtMotion) // the asset view always animates: the switch would do nothing there
  if (!ctx || forced) return null
  const still = ctx.featureSettings?.[LEGENDS_ID]?.still === true
  const color = dark ? C.white : C.inkDim
  const label = still ? t('lg_animPlay') : t('lg_animStop')
  return (
    <button type="button" aria-pressed={still} onClick={() => ctx.setFeatureSettings(LEGENDS_ID, { still: !still })}
      {...(small ? { 'aria-label': label, className: 'tip tip-b', 'data-tip': label } : {})}
      style={{ fontFamily: FONT.body, fontSize: small ? 11 : 12, fontWeight: 800, color, background: dark ? 'rgba(0,0,0,.35)' : C.surface, border: `1.5px solid color-mix(in srgb, ${color} 40%, transparent)`, borderRadius: RADIUS.pill, padding: small ? '1px 7px' : '3px 10px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
      {still ? '▶' : '⏸'}{small ? '' : ` ${label}`}
    </button>
  )
}

// Icons of the raid abilities (abilities/<motif>.js); their floater texts and effects live in fx/<motif>.jsx.
export const ABILITY_ICON = Object.fromEntries(Object.values(ABILITY_BY_ID).map((a) => [a.id, a.icon]))

// THE JUICE PLAYER (design v2.1, 1.2 and 1.3; the data is each fx file's `juice` map, fx/_juice.js). After a strike
// that fires `last.fx`, JUICE.delay later: hit-stop (the boss's idle paused), flash, the arena shake, data-fx + the
// reaction class for the fx key's size (tick 350 / medium 800 / big 1200 ms), and the overlay + floater (mounted until
// they end, JUICE.linger). A new strike cancels the older one (it never queues). When the next question appears
// (`questionKey` changes) everything still playing fades out over JUICE.fade and is gone: the next question is never
// delayed and a floater never sits over it. `on` false (focus mode, Still bosses, reduced motion) plays nothing.
const FLOAT_TONE = { purple: C.purple, danger: C.danger, warning: C.warning, success: C.success, info: C.info, brand: C.brand }
// `ofx`: the fx key whose FLOATER still plays. data-fx, the reaction class and the effect end with the moment's size
// (`fx`), but the floater keeps its full pop until JUICE.linger: tied to `fx`, a tick's word showed for about 200 ms.
const IDLE_JUICE = { fx: '', ofx: '', moment: '', show: false, fading: false, shake: 0, flash: 0, stop: 0, n: 0, size: 'big' }
// `moment`: a plain strike moment (strikeFx.js: a hit, a critical, the boss landing a blow, the knockout...) that plays
// with the same rules when the strike fired no ability fx (the knockout plays either way).
// `ko`: the knockout's clock (impact/styles.js koTiming) when `moment` is the knockout.
// The knockout's hit-stop is longer than any other: the killing blow freezes the boss (its body move holds it too).
const KO_HITSTOP = 180
function useJuice(last, on, ability, questionKey, moment = '', ko = null) {
  const [st, setSt] = useState(IDLE_JUICE)
  const key = last?.fx || moment ? `${last?.n}:${last?.wn || 0}:${last?.fx || ''}:${moment}` : ''
  const timers = useRef([])
  const lastFlashAt = useRef(-Infinity)
  useEffect(() => {
    const clear = () => { timers.current.forEach(clearTimeout); timers.current = [] }
    const later = (ms, f) => { timers.current.push(setTimeout(f, ms)) }
    clear()
    setSt(IDLE_JUICE)
    if (!on || !key) return clear
    const fx = last.fx || ''
    const n = last.n
    const j = moment === 'ko' || !fx ? juiceOf(STRIKE_FX[moment]) : juiceFor(ability, fx)
    later(JUICE.delay, () => {
      const now = Date.now()
      // Photosensitivity: at most 2 flashes a second, whatever the data asks.
      const flash = j.flash && now - lastFlashAt.current >= JUICE.flashGap ? j.flash : 0
      if (flash) lastFlashAt.current = now
      const stop = moment === 'ko' ? KO_HITSTOP : j.hitstop ? JUICE.hitstop[j.size] : 0
      setSt({ fx, ofx: fx, moment, show: true, fading: false, shake: j.shake, flash, stop, n, size: j.size })
      if (stop) later(stop, () => setSt((x) => (x.n === n ? { ...x, stop: 0 } : x)))
      if (moment !== 'ko' || !ko) {
        later(Math.min(JUICE.maxMs, j.ms), () => setSt((x) => (x.n === n ? { ...x, fx: '', shake: 0, flash: 0 } : x)))
        later(moment === 'ko' ? JUICE.linger + 300 : JUICE.linger, () => setSt((x) => (x.n === n ? IDLE_JUICE : x)))
        return
      }
      // THE KNOCKOUT CINEMATIC (impact/styles.js koTiming): the killing blow above, then at the climax the arena shakes
      // and flashes once more (the flash only if the photosensitivity gap allows it), a smaller jolt as the DEFEATED
      // stamp lands, and the layer stays until the whole cinematic has played.
      const set = (patch) => setSt((x) => (x.n === n ? { ...x, ...patch } : x))
      later(500, () => set({ fx: '', ofx: '', shake: 0, flash: 0 }))
      later(ko.peak, () => {
        const at = Date.now()
        const again = at - lastFlashAt.current >= JUICE.flashGap ? 1 : 0
        if (again) lastFlashAt.current = at
        set({ shake: 2, flash: again })
      })
      later(ko.land, () => set({ shake: 1, flash: 0 }))
      later(ko.land + 400, () => set({ shake: 0 }))
      later(ko.ms + 250, () => setSt((x) => (x.n === n ? IDLE_JUICE : x)))
    })
    return clear
  }, [key, on]) // eslint-disable-line react-hooks/exhaustive-deps
  // The next question appeared: fast-fade whatever still plays, then drop it.
  const seenQ = useRef(questionKey)
  useEffect(() => {
    if (seenQ.current === questionKey) return undefined
    seenQ.current = questionKey
    setSt((x) => (x.show || x.fx ? { ...x, fading: true, shake: 0, flash: 0, stop: 0 } : x))
    const id = setTimeout(() => setSt((x) => (x.fading ? IDLE_JUICE : x)), JUICE.fade)
    return () => clearTimeout(id)
  }, [questionKey])
  return st
}

// Hit-stop also pauses the boss's SMIL idle (CSS play-state cannot reach it); only the drawings it paused itself are
// resumed (art.jsx takes off-screen drawings out of the page on its own).
function useHitStop(ref, stop) {
  useEffect(() => {
    if (!stop || !ref.current || typeof ref.current.querySelectorAll !== 'function') return undefined
    const who = {}
    const paused = []
    const held = [...ref.current.querySelectorAll('svg')]
    for (const svg of held) {
      holdArt(svg, who, true) // a drawing on the art clock
      try { if (svg.animationsPaused && !svg.animationsPaused()) { svg.pauseAnimations(); paused.push(svg) } } catch { /* not an SVG document */ }
    }
    return () => {
      for (const svg of held) holdArt(svg, who, false)
      for (const svg of paused) { try { svg.unpauseAnimations() } catch { /* gone */ } }
    }
  }, [ref, stop])
}

// The phase to stamp while a phase change plays (0 otherwise). Only a RISE counts, never the first render.
function usePhaseShift(phase) {
  const prev = useRef(phase)
  const [shift, setShift] = useState(0)
  useEffect(() => {
    const was = prev.current
    prev.current = phase
    if (!phase || !was || phase <= was) return undefined
    setShift(phase)
    const id = setTimeout(() => setShift(0), 1700)
    return () => clearTimeout(id)
  }, [phase])
  return shift
}

function useShortWindow(getZoom) {
  const measure = () => (typeof window === 'undefined' ? false : window.innerHeight / ((getZoom && getZoom()) || 1) < ARENA_COMPACT_BELOW)
  const [short, setShort] = useState(measure)
  useEffect(() => {
    const on = () => setShort(measure())
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return short
}

// The fight above the questions. `state` = the fight (fight.js: damage, lives lost, combo, the last strike), `need`
// = the boss's health, `lives` the learner's hearts. `phases`: 2 for a boss (it enrages at half health), 3 for a
// raid boss (`data-phase` lets a raid drawing show its lg-p2 / lg-p3 layers). `weak`: names of the items the boss
// is weak to. `shield`: the learner brought a shield. `focus`: focus mode, no floaters or combo flair (the numbers stay).
// `questionKey`: changes when the next question appears (RaidRun), so an ability effect still playing fast-fades.
// A refund's motion (fight.js applyRefund): a sweat drop by the sheepish boss, the heart floating back up.
const REFUND_CSS = '@keyframes lgRefundSweat { 0% { transform: translateY(-6px) scale(.4); opacity: 0 } 20% { transform: translateY(0) scale(1.1); opacity: 1 } 80% { transform: translateY(6px) scale(1); opacity: 1 } 100% { transform: translateY(10px) scale(.9); opacity: 0 } }'
  + ' @keyframes lgRefundHeart { 0% { transform: translate(-50%, 0) scale(.5); opacity: 0 } 25% { transform: translate(-50%, -10px) scale(1.25); opacity: 1 } 100% { transform: translate(120%, -90px) scale(.7); opacity: 0 } }'

export function BossArena({ t, area, name = '', need, lives, bonus = 0, state, phases = 2, weak = [], shield = false, focus = false, getZoom, kind = 'bosses', ability = '', dayAb = null, questionKey, power = null, armed = null, proc = null, slim = false }) {
  const motion = useArtMotionAlways()
  const still = useArtStill()
  const quiet = focus || still // no shake, bob, flash or ability effect (still: the owner's no-animation switch)
  const compact = useShortWindow(getZoom)
  const st = state || newFight()
  const hp = healthLeft(st, need)
  const down = hp === 0
  const left = livesLeft(st, lives)
  const last = st.last
  const hitNow = last?.kind === 'hit'
  const missNow = last?.kind === 'miss'
  const phase = down ? phases : phaseOf(hp, need, phases)
  const rage = phase > 1
  // A raid boss changing phase: it flashes, shakes and swells, and a small "PHASE N" tag fades in UNDER it (once per change; over the boss it hid the change itself).
  const shift = usePhaseShift(phases > 2 && !down ? phase : 0)
  // The raid ability (abilities/<motif>.js): its visible state, health-bar marks, art state and the effect playing.
  // `st.damage` here is what the bar shows (a raid's whole day), so ctx.bar starts at 0.
  const abMod = abilityById(ability)
  const abCtx = { phase, need, lives, livesLeft: left, damage: st.damage, bar: { total: need, before: 0, phases }, dayAb, K: abilityK(abMod, st), rules: rulesOf(st) }
  const abS = abMod ? { ...st, ab: abilityState(st, abMod, abCtx) } : st
  const abHud = (!down && abMod?.hud?.(abS, abCtx)) || null
  const abMarks = (!down && abMod?.barMarks?.(abS, abCtx)) || null
  const abAttrs = (abMod?.artState?.(abS, abCtx)) || {}
  const abStyle = (!down && abMod?.artStyle?.(abS, abCtx)) || undefined
  const abNote = abMod?.chipNote?.(abS, abCtx)
  const AbHud = fxForAbility(ability)?.Hud
  const animOk = !quiet && (motion || !reducedMotion())
  // A raid's plain strike moments (strikeFx.js): every raid boss hits, gets hit and falls with weight.
  const moment = kind === 'raids' ? strikeMoment(last, { down }) : ''
  const koClock = kind === 'raids' ? koTiming(area.motif) : null
  const juice = useJuice(last, animOk, ability, questionKey, moment, koClock)
  // How a raid boss's own body moves when hit, when it strikes and when it falls (impact/body.js); null = the shared moves.
  const raidBody = kind === 'raids' && animOk ? impactFor(area.motif).body : null
  // A raid power just used (impact/PowerFx.jsx): its burst plays once per use, then clears.
  // A use made before this arena mounted (a remount, the next boss in the asset view) never replays.
  const [powerShow, setPowerShow] = useState(null)
  const powerSeen = useRef(power?.n || 0)
  useEffect(() => {
    if (!power?.n || power.n === powerSeen.current) return undefined
    powerSeen.current = power.n
    if (!animOk) return undefined
    setPowerShow(power)
    const id = setTimeout(() => setPowerShow((x) => (x?.n === power.n ? null : x)), castMs(power.id) + 100)
    return () => clearTimeout(id)
  }, [power?.n]) // eslint-disable-line react-hooks/exhaustive-deps
  // A window power (or Ward, Steadfast) doing its thing on an answer (`proc` = { id, n }): its own short flourish.
  const [procShow, setProcShow] = useState(null)
  const procSeen = useRef(proc?.n || 0)
  useEffect(() => {
    if (!proc?.n || proc.n === procSeen.current) return undefined
    procSeen.current = proc.n
    if (!animOk) return undefined
    setProcShow(proc)
    const id = setTimeout(() => setProcShow((x) => (x?.n === proc.n ? null : x)), procMs(proc.id) + 100)
    return () => clearTimeout(id)
  }, [proc?.n]) // eslint-disable-line react-hooks/exhaustive-deps
  const fxNow = juice.fx
  const artRef = useRef(null)
  useHitStop(artRef, juice.stop)
  // A persistent idle reaction (only IDLE_MOTIFS: abilities/_rules.js), off with every other reaction.
  const idleKey = !down && animOk && abMod?.idle ? abMod.idle(abS, abCtx) : ''
  const fxSize = juice.size
  const abFloater = last?.fx && floaterKeyFor(ability, last.fx) ? `${last.damage ? `-${last.damage} ` : ''}${t(floaterKeyFor(ability, last.fx), last.fxVars || {})}` : ''
  const shakeSpec = juice.shake ? JUICE.shake[juice.shake] : null
  const flashSpec = juice.flash ? JUICE.flash[juice.flash] : null
  const abCssText = abMod ? abilityCss(ability, abAttrs) : ''
  const hpColor = hp / need > 0.5 ? C.danger : hp / need > 0.25 ? C.warning : C.success
  const heartsLast = missNow || (last?.lives > 0) ? { kind: 'miss', n: last.n } : null
  // `wrap`: a chip with a list in it (the weak items) wraps instead of running past the arena on a narrow window.
  const chip = (color, text, key, wrap = false) => (
    <span key={key} style={{ fontSize: 11.5, fontWeight: 800, color, border: `1.5px solid color-mix(in srgb, ${color} 45%, transparent)`, borderRadius: RADIUS.pill, padding: '1px 8px', ...(wrap ? { whiteSpace: 'normal', overflowWrap: 'anywhere', minWidth: 0 } : { whiteSpace: 'nowrap' }) }}>{text}</span>
  )
  // THE SLIM STRIP (useArenaPin 'slim': even the compact arena took over 40% of a short, zoomed window, so it would
  // scroll away): a small boss tile, the health bar, hearts, the phase and armed powers, pinned while the question
  // scrolls. The arena box still shakes and flashes and the boss tile still flinches and lunges; the strike moments,
  // ability effects, power casts and phase ring are skipped (no room to read them), the numbers say what happened.
  if (slim) {
    const thumb = BOSS.arenaSlim
    return (
      <div data-arena-slim="" className={(motion ? 'lg-boss lg-motion' : 'lg-boss') + (animOk ? '' : ' lg-fx-off')} data-phase={phase} {...abAttrs} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8, padding: '3px 8px 3px 3px', borderRadius: RADIUS.lg, minWidth: 0,
        background: `color-mix(in srgb, ${C.danger} ${rage ? 14 : 7}%, ${C.surface})`, border: `2px solid color-mix(in srgb, ${C.danger} ${rage ? 60 : 30}%, ${C.border})`, transition: 'background .4s, border-color .4s',
        animation: shakeSpec ? `lgJuiceShake${juice.shake} ${shakeSpec.ms}ms linear` : undefined }}>
        <BossStyle />
        {(abMod || kind === 'raids') && <style>{JUICE_CSS}</style>}
        {kind === 'raids' && <style>{BODY_CSS}</style>}
        {abCssText && <style>{abCssText}</style>}
        {flashSpec?.veil && <div key={`v${juice.n}`} aria-hidden="true" style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', background: '#fff', opacity: 0, animation: `lgJuiceVeil ${flashSpec.veilMs}ms steps(1, end)`, pointerEvents: 'none', zIndex: 3 }} />}
        <div style={{ position: 'relative', flexShrink: 0, width: thumb, height: thumb, borderRadius: RADIUS.md, overflow: 'hidden', background: C.surfaceSunken }}>
          <div key={`b${last?.n || 0}`} style={{ animation: down || quiet ? 'none' : hitNow ? 'lgBossHit .5s ease-out' : missNow ? 'lgBossLunge .45s ease-out' : 'none',
            filter: down ? 'grayscale(.8) opacity(.6)' : rage ? 'saturate(1.3)' : 'none' }}>
            <div ref={artRef} className={juice.stop ? 'lg-hitstop' : undefined} style={{ animation: flashSpec ? `lgJuiceFlash${juice.flash} ${flashSpec.ms}ms steps(1, end)` : undefined }}>
              {kind === 'bosses'
                ? <BossArt area={area} size={thumb} animated={down ? false : 'idle'} roomed />
                : <LegendsArt kind={kind} motif={area.motif} palette={area.palette} height={thumb} width={thumb} round={0} animated={down ? false : 'idle'} phase={phase} roomed />}
            </div>
          </div>
          {!focus && (motion || !reducedMotion()) && last && (hitNow || last.shielded || last.kind === 'block' || last.fx || (last.kind === 'refund' && last.damage > 0)) && (
            <div key={`d${last.n}-${last.rn || 0}`} aria-hidden="true" style={{ position: 'absolute', left: '50%', top: 2, whiteSpace: 'nowrap', fontFamily: FONT.display, fontWeight: 900, fontSize: 15, color: last.shielded ? C.info : last.kind === 'refund' ? C.success : last.crit ? C.warning : C.danger, WebkitTextStroke: `2px ${FLOATER_OUTLINE}`, paintOrder: 'stroke fill', animation: 'lgBossFloat .9s ease-out both', pointerEvents: 'none' }}>
              {last.shielded ? '🛡' : `-${last.damage || 0}${last.crit ? '!' : ''}`}
            </div>
          )}
        </div>
        <div style={{ flex: '1 1 0', minWidth: 0, display: 'grid', gap: 3 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: FONT.display, fontWeight: 900, fontSize: 13.5, color: C.ink }}>{down ? `🏆 ${t('lg_bossDown')}` : `${rage ? '😡' : '👑'} ${name || area.title}`}</span>
            {!down && rage && <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 900, color: C.danger }}>{phases > 2 ? t('lg_fightPhase', { n: phase }) : t('lg_fightRage')}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <div role="progressbar" aria-valuemin={0} aria-valuemax={need} aria-valuenow={hp} aria-label={t('lg_bossHpLabel')}
            style={{ flex: 1, minWidth: 24, position: 'relative', height: 9, borderRadius: RADIUS.pill, background: C.surfaceSunken, overflow: 'hidden', border: `1.5px solid color-mix(in srgb, ${C.danger} 35%, transparent)` }}>
            <div style={{ width: `${(hp / need) * 100}%`, height: '100%', background: `linear-gradient(90deg, ${hpColor}, color-mix(in srgb, ${hpColor} 70%, white))`, transition: 'width .45s cubic-bezier(.3,1.3,.5,1), background .3s' }} />
            <BarMarks marks={abMarks} need={need} />
          </div>
          <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 800, color: C.inkDim, whiteSpace: 'nowrap' }}>{t('lg_bossHp', { hp, max: need })}</span>
          </div>
        </div>
        {/* the hearts and what is armed, beside the bar (a third row made the strip too tall for a 900x700 window at zoom 2) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, flexWrap: 'wrap', flexShrink: 1, minWidth: 0, maxWidth: '40%' }}>
            {armed?.shield && !down ? (
              <span data-power-armed="shield" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, borderRadius: 999, padding: '0 5px', boxShadow: '0 0 0 2px #6fc3ff' }}>
                <span aria-hidden="true" style={{ fontSize: 11 }}>🛡️</span>
                <Lives t={t} lives={lives} left={left} last={heartsLast} bonus={bonus} size={12} />
              </span>
            ) : <Lives t={t} lives={lives} left={left} last={heartsLast} bonus={bonus} size={12} />}
            {!down && armed?.steadfast > 0 && <SteadfastHearts n={armed.steadfast} size={12} />}
            {!down && armed && <PowerBadges armed={armed} anim={animOk} />}
            {shield && !st.shieldUsed && <span role="img" style={{ fontSize: 11 }} aria-label={t('lg_fightShield')}>🛡</span>}
            {!focus && st.combo >= 2 && <span style={{ fontSize: 11, fontWeight: 800, color: C.warning, whiteSpace: 'nowrap' }}>🔥 {st.combo}</span>}
            <MotionToggle t={t} small />
        </div>
      </div>
    )
  }
  return (
    <div className={(motion ? 'lg-boss lg-motion' : 'lg-boss') + (animOk ? '' : ' lg-fx-off')} data-phase={phase} data-fx={fxNow || undefined} data-fx-size={fxNow ? fxSize : undefined} {...abAttrs} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: compact ? 10 : 16, padding: compact ? '0 12px 0 0' : '0 14px 0 0', borderRadius: RADIUS.lg,
      background: `color-mix(in srgb, ${C.danger} ${rage ? 14 : 7}%, ${C.surface})`, border: `2px solid color-mix(in srgb, ${C.danger} ${rage ? 60 : 30}%, ${C.border})`, transition: 'background .4s, border-color .4s',
      // The shake moves the ARENA box only (the question card below never moves).
      animation: shakeSpec ? `lgJuiceShake${juice.shake} ${shakeSpec.ms}ms linear` : undefined }}>
      <BossStyle />
      {(abMod || kind === 'raids') && <style>{JUICE_CSS}</style>}
      {kind === 'raids' && <style>{BODY_CSS}</style>}
      {abCssText && <style>{abCssText}</style>}
      {/* F2 flash: a 25% white veil over the arena for one frame */}
      {flashSpec?.veil && <div key={`v${juice.n}`} aria-hidden="true" style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', background: '#fff', opacity: 0, animation: `lgJuiceVeil ${flashSpec.veilMs}ms steps(1, end)`, pointerEvents: 'none', zIndex: 3 }} />}
      <div style={{ position: 'relative', flexShrink: 0, margin: headroomPx(compact ? BOSS.arenaCompact : BOSS.arena) }}>
        <div key={`s${shift}`} style={{ animation: shift && !quiet ? 'lgPhaseShift 1s ease-out both' : 'none' }}>
        <div key={`b${last?.n || 0}`} style={{ animation: down ? ((raidBody && bodyAnimation(raidBody, 'ko', koClock.ms, JUICE.delay)) || (kind === 'raids' ? 'none' : 'lgBossDown .6s ease-out both')) : quiet ? 'none' : (raidBody && moment && bodyAnimation(raidBody, moment)) || (hitNow ?((raidBody && bodyAnimation(raidBody, 'hit')) || 'lgBossHit .5s ease-out') : missNow ? ((raidBody && bodyAnimation(raidBody, 'strike')) || 'lgBossLunge .45s ease-out') : 'none'),
          filter: down ? 'grayscale(.8) opacity(.6)' : rage ? `drop-shadow(0 0 10px ${C.danger}) saturate(1.3)` : 'none' }}>
          {/* the boss's own reaction to its ability (fx/<motif>.jsx css: .lgr-<motif>-<fx>), then its persistent idle
              reaction (.lgr-<motif>-idle-<key>), then its persistent look (artStyle) on the INNERMOST box, so a scale
              composes with the hit, the lunge and the reaction instead of fighting them for `transform` */}
          <div ref={artRef} className={juice.stop ? 'lg-hitstop' : undefined} style={{ animation: flashSpec ? `lgJuiceFlash${juice.flash} ${flashSpec.ms}ms steps(1, end)` : undefined }}>
          <div className={fxNow ? `lgr-${area.motif}-${fxNow}` : undefined}>
          <div className={idleKey ? `lgr-${area.motif}-idle-${idleKey}` : undefined}>
          <div style={abStyle}>
          {kind === 'bosses'
            ? <BossArt area={area} size={compact ? BOSS.arenaCompact : BOSS.arena} animated={down ? false : 'idle'} roomed />
            : <LegendsArt kind={kind} motif={area.motif} palette={area.palette} height={compact ? BOSS.arenaCompact : BOSS.arena} width={compact ? BOSS.arenaCompact : BOSS.arena} round={0} animated={down ? false : 'idle'} phase={phase} roomed />}
          </div>
          </div>
          </div>
          </div>
        </div>
        </div>
        {shift > 0 && !quiet && <>
          <div key={`r${shift}`} aria-hidden="true" style={{ position: 'absolute', left: '50%', top: '50%', width: '100%', height: '100%', borderRadius: '50%', border: `2px solid ${C.purple}`, transform: 'translate(-50%, -50%)', animation: 'lgPhaseRing .8s ease-out both', pointerEvents: 'none' }} />
          <div key={`p${shift}`} aria-hidden="true" style={{ position: 'absolute', left: '50%', top: compact ? 'calc(100% - 3px)' : 'calc(100% + 4px)', whiteSpace: 'nowrap', fontFamily: FONT.display, fontWeight: 800, fontSize: compact ? 11 : 13, letterSpacing: '.06em', textTransform: 'uppercase', color: C.white, padding: '1px 9px', borderRadius: 999, background: `color-mix(in srgb, ${C.danger} 70%, transparent)`, transform: 'translateX(-50%)', animation: 'lgPhaseTag 1.8s ease-out both', pointerEvents: 'none', zIndex: 2 }}>{t('lg_fightPhase', { n: shift })}</div>
        </>}
        {/* the raid ability's own effect (a bolt, a wave, a scythe arc...) and its floater, once per strike that fires
            it, inside the boss box; they fade out the moment the next question appears */}
        {/* THE POWER STAGE: a power's cast and its hits play in the LOWER HALF of the boss box (the owner: the best mix
            of visibility and position; the face and the strike labels at the top stay clear). Not once the boss is down:
            the knockout cinematic owns the killing blow (a Fury proc on it played over the death). */}
        {!down && (powerShow || procShow) && (
          <div aria-hidden="true" data-power-stage="" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${POWER_STAGE * 100}%`, pointerEvents: 'none', zIndex: 2 }}>
            {powerShow && <PowerFx t={t} power={powerShow} />}
            {procShow && <PowerProc t={t} proc={procShow} />}
          </div>
        )}
        {juice.show && juice.moment && <StrikeFxLayer t={t} moment={juice.moment} motif={area.motif} n={juice.n} fading={juice.fading} last={last} />}
        {/* a beaten raid boss: the defeated tag under it (after its knockout cinematic; at once and still when effects are off) */}
        {down && kind === 'raids' && <KoTag key={`k${last?.n || 0}`} t={t} motif={area.motif} delay={animOk ? JUICE.delay + koClock.ms - 200 : null} />}
        {juice.show && juice.ofx && (
          <div key={`x${juice.n}`} aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1, opacity: juice.fading ? 0 : 1, transition: `opacity ${JUICE.fade}ms ease-in` }}>
            {juice.fx && <AbilityFx fx={last?.fx || ''} ability={ability} />}
            {!focus && floaterKeyFor(ability, last?.fx) && (
              <div style={{ position: 'absolute', left: '50%', top: 0, width: 'max-content', maxWidth: 'calc(100% + 40px)', whiteSpace: 'normal', textAlign: 'center', lineHeight: 1.05, fontFamily: FONT.display, fontWeight: 900, fontSize: floaterPxFor(fxSize, abFloater),
                color: FLOATER_FILL[floaterToneFor(ability, last.fx)] || FLOATER_FILL.purple, WebkitTextStroke: `2px ${FLOATER_OUTLINE}`, paintOrder: 'stroke fill', zIndex: 2,
                animation: `lgJuicePop 900ms cubic-bezier(.22,1,.36,1) ${JUICE.floaterDelay}ms both` }}>
                {abFloater}
              </div>
            )}
          </div>
        )}
        {/* Flash and floater only where they can animate: under the system's reduce-motion their fade was removed and a
            red disc covered the boss after every hit. */}
        {!quiet && hitNow && kind !== 'raids' && (motion || !reducedMotion()) && <div key={`f${last.n}`} aria-hidden="true" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: C.danger, mixBlendMode: 'screen', animation: 'lgBossFlash .35s ease-out both', pointerEvents: 'none' }} />}
        {/* the plain damage floater. An ability's own floater plays with its effect (above) while effects are on; with
            them off (Still bosses) its text still shows here, so the numbers say what happened */}
        {!focus && (motion || !reducedMotion()) && last && (hitNow || last.shielded || last.kind === 'block' || last.fx) && !(animOk && !last.shielded && last.fx && floaterKeyFor(ability, last.fx)) && (
          <div key={`d${last.n}`} aria-hidden="true" style={{ position: 'absolute', left: '50%', top: 0, whiteSpace: 'nowrap', fontFamily: FONT.display, fontWeight: 900, fontSize: last.crit || last.fx ? 26 : 22, color: last.shielded ? C.info : last.fx ? (FLOAT_TONE[floaterToneFor(ability, last.fx)] || C.purple) : last.crit ? C.warning : C.danger, animation: 'lgBossFloat .9s ease-out both', pointerEvents: 'none' }}>
            {last.shielded ? '🛡' : last.fx && floaterKeyFor(ability, last.fx) ? `${last.damage ? `-${last.damage} ` : ''}${t(floaterKeyFor(ability, last.fx), last.fxVars || {})}` : `-${last.damage}${last.crit ? '!' : ''}`}
          </div>
        )}
        {/* A REFUND (a re-check or an appeal found the answer right, fight.js applyRefund): the boss looks sheepish (a
            sweat drop, a small shrink), the lost heart floats back up and the damage it was owed lands. Its own
            counter (rn), so the boss's hit / lunge animations never replay. Skipped in focus mode and Still bosses
            (the notice under the arena still says it). */}
        {!quiet && last?.kind === 'refund' && (motion || !reducedMotion()) && (
          <div key={`rf${last.rn}`} aria-hidden="true" data-refund-fx="" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2 }}>
            <style>{REFUND_CSS}</style>
            <div style={{ position: 'absolute', right: '6%', top: '4%', fontSize: 26, animation: 'lgRefundSweat 1.6s ease-out both' }}>😅</div>
            {last.healedLives > 0 && <div style={{ position: 'absolute', left: '50%', bottom: '8%', fontSize: 24, animation: 'lgRefundHeart 1.4s cubic-bezier(.22,1,.36,1) both' }}>💖</div>}
            {last.damage > 0 && <div style={{ position: 'absolute', left: '50%', top: 0, whiteSpace: 'nowrap', fontFamily: FONT.display, fontWeight: 900, fontSize: 22, color: C.success, animation: 'lgBossFloat 1.1s ease-out .25s both' }}>-{last.damage}</div>}
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'grid', gap: compact ? 4 : 8 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: compact ? 15 : 17, color: C.ink }}>{down ? `🏆 ${t('lg_bossDown')}` : `${rage ? '😡' : '👑'} ${name || area.title}`}</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 800, color: C.inkDim }}>{t('lg_bossHp', { hp, max: need })}</span>
          <MotionToggle t={t} />
        </div>
        <div role="progressbar" aria-valuemin={0} aria-valuemax={need} aria-valuenow={hp} aria-label={t('lg_bossHpLabel')}
          style={{ position: 'relative', height: compact ? 12 : 16, borderRadius: RADIUS.pill, background: C.surfaceSunken, overflow: 'hidden', border: `2px solid color-mix(in srgb, ${C.danger} 35%, transparent)` }}>
          <div style={{ width: `${(hp / need) * 100}%`, height: '100%', background: `linear-gradient(90deg, ${hpColor}, color-mix(in srgb, ${hpColor} 70%, white))`, transition: 'width .45s cubic-bezier(.3,1.3,.5,1), background .3s' }} />
          <BarMarks marks={abMarks} need={need} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {armed?.shield && !down ? (
            <span data-power-armed="shield" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, ...(animOk ? wardStyle(true) : { borderRadius: 999, padding: '1px 6px', boxShadow: '0 0 0 2px #6fc3ff' }) }}>
              {animOk && <style>{POWER_ARMED_CSS}</style>}
              <span aria-hidden="true" style={{ fontSize: 14 }}>🛡️</span>
              <Lives t={t} lives={lives} left={left} last={heartsLast} bonus={bonus} size={16} />
            </span>
          ) : <Lives t={t} lives={lives} left={left} last={heartsLast} bonus={bonus} size={16} />}
          {!down && armed?.steadfast > 0 && <SteadfastHearts n={armed.steadfast} />}
          {!down && armed && <PowerBadges armed={armed} anim={animOk} />}
          {shield && chip(st.shieldUsed ? C.inkFaint : C.info, `🛡 ${st.shieldUsed ? t('lg_fightShieldUsed') : t('lg_fightShield')}`, 'sh')}
          {!down && ability && chip(C.purple, `${ABILITY_ICON[ability] || ''} ${t(`lg_ability_${ability}`)}${abNote ? ` · ${t(abNote)}` : ''}`, 'ab')}
          {!down && rage && chip(C.danger, `😡 ${phases > 2 ? t('lg_fightPhase', { n: phase }) : t('lg_fightRage')}`, 'rg')}
          {!focus && st.combo >= 2 && chip(C.warning, `🔥 ${t('lg_fightCombo', { n: st.combo })}`, 'cb')}
          {weak.length > 0 && !compact && chip(C.success, `🎯 ${t('lg_fightWeak', { items: weak.join(', ') })}`, 'wk', true)}
        </div>
        {!down && (abHud || AbHud) && <AbilityHud t={t} items={abHud} compact={compact} calm={!animOk}>{AbHud && <AbHud t={t} state={abS} ctx={abCtx} compact={compact} />}</AbilityHud>}
      </div>
    </div>
  )
}
