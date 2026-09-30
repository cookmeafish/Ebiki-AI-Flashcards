// The boss fight's stage: the area's boss (public/assets/legends/bosses), its health bar and the learner's lives.
// The boss has as much health as right answers are needed to beat it (PASS.boss of the questions); every right
// answer is a hit, every wrong one costs a life. Lives = the misses the pass mark allows + 1, so losing the last one
// is exactly the miss that makes the boss unbeatable: the fight ends there, and at 0 health it ends in a win. The
// pass itself is still decided by applyNodeResult. Nothing moves for people who asked for reduced motion.
import { useEffect, useRef, useState } from 'react'
import { C, FONT, RADIUS } from '../../config/tokens'
import { ChunkyButton } from '../ui'
import { BossArt, LegendsArt } from './art'
import { newFight, healthLeft, livesLeft, phaseOf } from './fight'
import { PASS } from './map'

export const BOSS = { intro: 190, arena: 120, arenaCompact: 68 } // px: the boss on the intro card, and above the questions
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
    <div role="img" aria-label={bonus ? `${t('lg_livesAria', { n: left })}. ${t('lg_bonusLife')}` : t('lg_livesAria', { n: left })} style={{ display: 'flex', gap: 4, fontSize: size, flexWrap: 'wrap', justifyContent: 'center' }}>
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
@keyframes lgStripeMove { to { background-position: 56px 0 } }
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
@keyframes lgBogRise { 0% { transform: translateY(65%); opacity: 0 } 20% { opacity: 1; transform: translateY(45%) } 55% { transform: translateY(42%) } 72% { transform: translateY(-6%) scale(1.3) } 86% { transform: scale(.97) } 100% { transform: none } }
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
@keyframes lgRiseLift { 0% { transform: translateX(-260px) rotate(-360deg) scale(.7); opacity: 0 } 20% { opacity: 1 } 65% { transform: translateX(10px) rotate(8deg) scale(1.05) } 80% { transform: translateX(-4px) rotate(-3deg) scale(.98, 1.03) } 100% { transform: none } }
@keyframes lgBuzz { 0% { transform: translate(-180px, -60px) scale(.5); opacity: 0 } 15% { opacity: 1; transform: translate(-120px, 20px) scale(.6) rotate(10deg) } 30% { transform: translate(-60px, -40px) scale(.7) rotate(-10deg) } 45% { transform: translate(20px, 20px) scale(.85) rotate(8deg) } 60% { transform: translate(-10px, -20px) scale(.95) rotate(-6deg) } 78% { transform: translate(6px, 6px) scale(1.08) } 100% { transform: none } }
@keyframes lgBloom { 0% { transform: translateY(40%) scale(.1) rotate(-90deg); opacity: 0 } 40% { opacity: 1; transform: translateY(10%) scale(.6) rotate(-30deg) } 70% { transform: translateY(-4%) scale(1.15) rotate(8deg) } 100% { transform: none } }
@keyframes lgJelly { 0% { transform: translateY(-200px); opacity: 0 } 30% { opacity: 1; transform: translateY(0) scale(1, 1) } 45% { transform: scale(1.3, .7) } 58% { transform: scale(.8, 1.22) } 70% { transform: scale(1.14, .88) } 82% { transform: scale(.95, 1.05) } 100% { transform: none } }
@keyframes lgPounce { 0% { transform: translate(-120px, 30%) scale(1.2, .55); opacity: 0 } 20% { opacity: 1 } 50% { transform: translate(0, 30%) scale(1.25, .5) } 62% { transform: translate(0, 28%) scale(1.3, .45) } 78% { transform: translateY(-14%) scale(.85, 1.25) } 90% { transform: translateY(2%) scale(1.04, .96) } 100% { transform: none } }
@keyframes lgMirrorFlip { 0% { transform: scaleX(-1); opacity: 0; filter: brightness(3) } 12% { opacity: 1 } 20% { filter: brightness(1) } 26% { filter: brightness(3) } 34% { filter: brightness(1); transform: scaleX(-1) } 55% { transform: scaleX(.05) } 72% { transform: scaleX(1.12); filter: brightness(2.4) } 86% { transform: scaleX(.97); filter: brightness(1) } 100% { transform: none; filter: none } }
@keyframes lgHaunt { 0% { transform: scaleY(0) skewX(0); opacity: 0 } 25% { opacity: .8; transform: scaleY(.4) skewX(18deg) } 45% { transform: scaleY(.8) skewX(-14deg) } 65% { transform: scaleY(1.2) skewX(8deg); opacity: 1 } 82% { transform: scaleY(.95) skewX(-3deg) } 100% { transform: none } }
@keyframes lgAssemble { 0% { transform: rotate(-90deg); opacity: 0 } 15% { opacity: 1 } 45% { transform: rotate(-60deg) } 52% { transform: rotate(-64deg) } 72% { transform: rotate(6deg) } 80% { transform: rotate(0) scale(1.06, .9) } 90% { transform: rotate(-2deg) } 100% { transform: none } }
@keyframes lgHypno { 0% { transform: scale(.6, 2.6) skewX(20deg) translateY(-30%); opacity: 0; filter: hue-rotate(-140deg) blur(5px) } 35% { opacity: 1; transform: scale(.8, 1.8) skewX(-12deg) translateY(-8%) } 60% { transform: scale(1.1, .8) skewX(6deg); filter: hue-rotate(-50deg) blur(1px) } 80% { transform: scale(.96, 1.06) } 100% { transform: none; filter: none } }
@keyframes lgFoxfire { 0% { transform: translateX(-120px); opacity: 0 } 10% { opacity: .9; transform: translateX(-120px) } 18% { opacity: 0 } 26% { opacity: .9; transform: translateX(110px) scale(.9) } 34% { opacity: 0 } 44% { opacity: .9; transform: translateX(-50px) scale(.95) } 52% { opacity: 0 } 64% { opacity: 1; transform: scale(1.18); filter: brightness(2) } 82% { transform: scale(.96); filter: brightness(1.2) } 100% { transform: none; filter: none } }
@keyframes lgDrill { 0% { transform: translateY(100%) rotate(0); opacity: 0 } 15% { opacity: 1 } 30% { transform: translateY(70%) rotate(180deg) } 50% { transform: translateY(30%) rotate(360deg) } 68% { transform: translateY(-10%) rotate(540deg) scale(1.08) } 84% { transform: translateY(3%) rotate(720deg) } 100% { transform: rotate(720deg) } }
@keyframes lgGallop { 0% { transform: translateX(260px); opacity: 0 } 12% { opacity: 1; transform: translate(200px, -14px) } 24% { transform: translate(150px, 0) } 36% { transform: translate(100px, -14px) } 48% { transform: translate(50px, 0) } 60% { transform: translate(10px, -14px) } 74% { transform: translate(-6px, 0) rotate(-10deg) } 88% { transform: rotate(4deg) } 100% { transform: none } }
@keyframes lgRoarShake { 0% { transform: rotate(-70deg) translateX(-60px); opacity: 0 } 25% { opacity: 1 } 55% { transform: rotate(6deg) } 62% { transform: rotate(4deg) translate(-4px, 2px) } 68% { transform: rotate(3deg) translate(4px, -2px) } 74% { transform: rotate(2deg) translate(-3px, 1px) } 82% { transform: rotate(-1deg) } 100% { transform: none } }
@keyframes lgDescend { 0% { transform: translateY(-220px) scale(.8); opacity: 0; filter: brightness(3) blur(4px) } 50% { opacity: 1; filter: brightness(2) blur(0) } 75% { transform: translateY(8px) scale(1.06) } 100% { transform: none; filter: none } }
@keyframes lgHydraRise { 0% { transform: translateY(45%) scale(1.5, .12); opacity: 0 } 15% { opacity: 1; transform: translateY(42%) scale(1.45, .18) } 30% { transform: translateY(30%) scale(1.3, .3) } 48% { transform: translateY(-14%) scale(.82, 1.4) rotate(-9deg) } 60% { transform: translateY(-8%) scale(.9, 1.25) rotate(8deg) } 72% { transform: translateY(-2%) scale(.95, 1.1) rotate(-5deg) } 84% { transform: translateY(2%) scale(1.05, .95) rotate(2deg) } 100% { transform: none } }
@keyframes lgPowerUp { 0% { transform: translateY(24%) scale(.8); opacity: 0; filter: brightness(.15) } 12% { opacity: 1; transform: translateY(24%) scale(.8) } 22% { transform: translateY(14%) scale(.87); filter: brightness(1.9) } 30% { transform: translateY(14%) scale(.87); filter: brightness(.4) } 42% { transform: translateY(6%) scale(.94); filter: brightness(2.1) } 50% { transform: translateY(6%) scale(.94); filter: brightness(.5) } 64% { transform: translateY(-4%) scale(1.08); filter: brightness(2.6) } 72% { transform: translate(-5px, -2%) scale(1.06) } 78% { transform: translate(5px, -1%) scale(1.05) } 84% { transform: translate(-3px, 0) scale(1.02); filter: brightness(1.3) } 100% { transform: none; filter: none } }
@keyframes lgLevitate { 0% { transform: translateY(70%) rotate(-7deg); opacity: 0; filter: brightness(.3) blur(3px) } 25% { opacity: .9; transform: translateY(45%) rotate(6deg); filter: blur(1px) } 50% { transform: translateY(24%) rotate(-5deg) } 66% { transform: translateY(14%) rotate(3deg); filter: brightness(1) blur(0) } 76% { transform: translateY(-16%) scale(1.1); filter: brightness(2) } 88% { transform: translateY(3%) scale(.98) } 100% { transform: none; filter: none } }
@keyframes lgTripleRoar { 0% { transform: scale(.55); opacity: 0 } 10% { opacity: 1 } 20% { transform: scale(.7) rotate(-5deg) } 26% { transform: scale(.66) rotate(3deg) } 44% { transform: scale(.88) rotate(5deg) } 50% { transform: scale(.84) rotate(-3deg) } 70% { transform: scale(1.18) rotate(-6deg) } 76% { transform: scale(1.12) rotate(5deg) } 82% { transform: scale(1.1) rotate(-3deg) } 90% { transform: scale(.97) } 100% { transform: none } }
@keyframes lgRealityTear { 0% { transform: scale(1.3, .02); opacity: 0; filter: brightness(3) } 14% { opacity: 1; transform: scale(1.3, .03) } 28% { transform: scale(1.1, .05) } 46% { transform: scale(.94, 1.28); filter: brightness(2) hue-rotate(40deg) } 54% { transform: translateX(-9px) scale(1.04, .94) } 60% { transform: translateX(8px) scale(.98, 1.04); filter: hue-rotate(-30deg) } 66% { transform: translateX(-5px) } 72% { transform: translateX(3px) scale(1.02) } 100% { transform: none; filter: none } }
@keyframes lgPhaseShift { 0% { transform: none; filter: none } 10% { transform: scale(1.3); filter: brightness(3) saturate(0) } 22% { transform: scale(.9) translateX(-7px) rotate(-4deg); filter: brightness(1.2) } 32% { transform: scale(1.22) translateX(7px) rotate(4deg); filter: brightness(2.4) } 44% { transform: scale(.96) translateX(-4px) } 58% { transform: scale(1.14); filter: brightness(1.7) saturate(1.6) } 100% { transform: none; filter: none } }
@keyframes lgPhaseStamp { 0% { transform: translate(-50%, -50%) scale(2.6) rotate(-8deg); opacity: 0 } 18% { transform: translate(-50%, -50%) scale(.92) rotate(-8deg); opacity: 1 } 26% { transform: translate(-50%, -50%) scale(1.05) rotate(-8deg) } 75% { opacity: 1 } 100% { transform: translate(-50%, -62%) scale(1) rotate(-8deg); opacity: 0 } }
@keyframes lgPhaseRing { 0% { transform: translate(-50%, -50%) scale(.3); opacity: .95 } 100% { transform: translate(-50%, -50%) scale(2.4); opacity: 0 } }
@keyframes lgQuake { 0%,100% { transform: translate(0, 0) } 12% { transform: translate(-9px, 5px) } 25% { transform: translate(8px, -6px) } 38% { transform: translate(-7px, -3px) } 52% { transform: translate(6px, 4px) } 66% { transform: translate(-4px, 2px) } 80% { transform: translate(3px, -2px) } }
@keyframes lgShock { 0% { transform: translate(-50%, -50%) scale(.2); opacity: 0 } 6% { opacity: .9 } 100% { transform: translate(-50%, -50%) scale(2.6); opacity: 0 } }
@keyframes lgDust { 0% { transform: translate(0, 0) scale(.6); opacity: 0 } 8% { opacity: .9 } 100% { transform: translate(var(--dx), -26px) scale(1.4); opacity: 0 } }
@keyframes lgHeartbeat { 0%,100% { transform: scale(1); opacity: .55 } 14% { transform: scale(1.12); opacity: .9 } 28% { transform: scale(1); opacity: .6 } 42% { transform: scale(1.08); opacity: .85 } }
@keyframes lgEyes { 0%,100% { filter: drop-shadow(0 0 0 transparent) } 50% { filter: drop-shadow(0 0 14px var(--c-danger)) brightness(1.15) } }
@keyframes lgStamp { 0% { transform: scale(2.4); opacity: 0; letter-spacing: .3em } 70% { transform: scale(.94); opacity: 1 } 100% { transform: scale(1); letter-spacing: normal } }
@keyframes lgPopIn { 0% { transform: scale(0) } 70% { transform: scale(1.35) } 100% { transform: scale(1) } }
@keyframes lgRise { 0% { transform: translateY(24px); opacity: 0 } 100% { transform: translateY(0); opacity: 1 } }
@keyframes lgCall { 0%,100% { transform: scale(1) } 50% { transform: scale(1.06) } }
@media (prefers-reduced-motion: reduce) { .lg-boss, .lg-boss *:not(svg):not(svg *) { animation: none !important; opacity: 1 !important } }
.lg-calm, .lg-calm *:not(svg):not(svg *) { animation: none !important }
.lg-boss[data-phase="2"] .lg-p2, .lg-boss[data-phase="3"] .lg-p2, .lg-boss[data-phase="3"] .lg-p3 { display: inline !important }
.lg-boss[data-phase="2"] .lg-p1, .lg-boss[data-phase="3"] .lg-p1, .lg-boss[data-phase="3"] .lg-p12 { display: none !important }
`
export const BossStyle = () => <style>{CSS}</style>

// The entrance: the stage darkens, hazard stripes close in, the boss slams down (the stage quakes, a shockwave and
// dust), its eyes flash, the title stamps in, the lives pop in one by one and the Fight button rises. ~2s, CSS only.
export const ENTRANCE = { stripes: 0.15, slam: 0.45, impact: 0.95, title: 1.15, lives: 1.45, fight: 1.9 } // s
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
  swamp: { name: 'lgBogRise', ease: 'cubic-bezier(.4,0,.3,1)' }, // eyes surface, a pause, then it lunges at you
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
  arena: { name: 'lgRiseLift', ease: 'cubic-bezier(.2,.7,.3,1)' }, // tumbles in rolling like a thrown champion
  hive: { name: 'lgBuzz', ease: 'linear' }, // buzzes in on a zigzag
  garden: { name: 'lgBloom', ease: 'cubic-bezier(.3,.8,.4,1)' }, // blooms out of the soil
  sweets: { name: 'lgJelly', ease: 'cubic-bezier(.3,.7,.4,1)' }, // drops in and wobbles like jelly
  savanna: { name: 'lgPounce', ease: 'cubic-bezier(.3,.7,.4,1)', origin: 'bottom center' }, // stalks in low, crouches, then springs up tall
  mirror: { name: 'lgMirrorFlip', ease: 'linear' }, // flips over like its own reflection, glass flashing
  manor: { name: 'lgHaunt', ease: 'cubic-bezier(.3,.7,.4,1)', origin: 'bottom center' }, // billows up out of the floor like a sheet
  junkyard: { name: 'lgAssemble', ease: 'linear', origin: 'bottom left' }, // heaves itself up from lying on its side
  dream: { name: 'lgHypno', ease: 'cubic-bezier(.3,.7,.4,1)', origin: 'top center' }, // melts into shape like a dripping dream
  sakura: { name: 'lgFoxfire', ease: 'linear' }, // blinks in and out like a trickster before it appears
  mine: { name: 'lgDrill', ease: 'cubic-bezier(.3,.7,.4,1)' }, // drills up out of the ground, spinning
  frontier: { name: 'lgGallop', ease: 'linear' }, // gallops in from the side
  primeval: { name: 'lgRoarShake', ease: 'cubic-bezier(.3,.7,.4,1)', origin: 'bottom right' }, // leans into frame head first and roars
  celestial: { name: 'lgDescend', ease: 'cubic-bezier(.3,.7,.4,1)' }, // descends in a blaze of light
  // Raid bosses (raids/<motif>.svg)
  hydra: { name: 'lgHydraRise', ease: 'cubic-bezier(.3,.8,.4,1)', origin: 'bottom center' }, // crushed flat at the waterline, then the necks whip up tall
  titan: { name: 'lgPowerUp', ease: 'linear', origin: 'bottom center' }, // rises in three hydraulic jerks with power surges, then shudders
  lich: { name: 'lgLevitate', ease: 'cubic-bezier(.3,.6,.4,1)' }, // drifts up swaying, then snaps upward as the power takes hold
  chimera: { name: 'lgTripleRoar', ease: 'cubic-bezier(.3,.8,.4,1)', origin: 'bottom center' }, // three roars, each a bigger lunge
  void: { name: 'lgRealityTear', ease: 'cubic-bezier(.3,.8,.4,1)' }, // a slit in reality tears open, jitters and holds
}
export const entranceFor = (motif) => ENTRANCES[motif] || ENTRANCES.mountains
// `odds`: bossOdds options ({ bonus, pass }); `legendary`: the harder replay of a cleared area.
// `calm` (focus mode): the card shows at once, still (no stripes sliding, slam, quake or entrance animation).
// `kind`: 'raids' shows a raid boss (its own art folder and its own lives count, `raidLives`).
export function BossIntro({ t, area, name = '', total, onFight, odds, legendary = false, calm = false, kind = 'bosses', raidLives = 0, ability = '' }) {
  const odds0 = bossOdds(total, odds)
  const lives = kind === 'raids' ? raidLives : odds0.lives
  const bonus = kind === 'raids' ? 0 : odds0.bonus
  const E = ENTRANCE
  const entrance = entranceFor(area?.motif)
  const NIGHT = `color-mix(in srgb, ${C.bg} 25%, black)` // the stage is dark in both themes
  const stripe = `repeating-linear-gradient(-45deg, ${C.danger} 0 14px, color-mix(in srgb, ${C.danger} 20%, black) 14px 28px)`
  const band = (side) => ({
    position: 'absolute', left: 0, right: 0, height: 30, [side]: 18, display: 'grid', placeItems: 'center', overflow: 'hidden',
    background: stripe, backgroundSize: '56px 56px', boxShadow: `0 0 18px color-mix(in srgb, ${C.danger} 60%, transparent)`,
    animation: `${side === 'top' ? 'lgStripeL' : 'lgStripeR'} .4s cubic-bezier(.2,.9,.3,1) ${E.stripes}s both, lgStripeMove 1.2s linear infinite`,
  })
  const label = { fontFamily: FONT.display, fontWeight: 900, fontSize: 15, letterSpacing: '.35em', color: C.white, padding: '0 14px', background: `color-mix(in srgb, ${C.danger} 20%, black)`, borderRadius: 4, textTransform: 'uppercase' }
  return (
    <div className={calm ? 'lg-boss lg-calm' : 'lg-boss'} style={{ maxWidth: 640, margin: '12px auto', position: 'relative', borderRadius: RADIUS.xl, overflow: 'hidden', animation: `lgStageIn .3s ease-out both, lgQuake .45s ease-out ${E.impact}s` }}>
      <BossStyle />
      <div style={{ position: 'relative', padding: '64px 20px 76px', display: 'grid', gap: 14, justifyItems: 'center', textAlign: 'center',
        background: `radial-gradient(ellipse at 50% 42%, color-mix(in srgb, ${C.danger} 30%, ${NIGHT}) 0%, ${NIGHT} 72%)` }}>
        <div aria-hidden="true" style={band('top')}><span style={label}>⚠ {kind === 'raids' ? t('lg_raid') : legendary ? t('lg_legendary') : t('lg_boss')} ⚠</span></div>
        <div aria-hidden="true" style={band('bottom')}><span style={label}>⚠ {kind === 'raids' ? t('lg_raid') : legendary ? t('lg_legendary') : t('lg_boss')} ⚠</span></div>
        <div style={{ position: 'relative', width: BOSS.intro, height: BOSS.intro }}>
          <div aria-hidden="true" style={{ position: 'absolute', inset: -40, borderRadius: '50%', background: `radial-gradient(circle, color-mix(in srgb, ${C.danger} 55%, transparent) 0%, transparent 65%)`, animation: `lgStageIn .2s ease-out ${E.impact}s both, lgHeartbeat 1.3s ease-in-out ${E.impact}s infinite` }} />
          <div aria-hidden="true" style={{ position: 'absolute', left: '50%', top: '88%', width: BOSS.intro, height: BOSS.intro * 0.35, borderRadius: '50%', border: `4px solid ${C.danger}`, animation: `lgShock .6s ease-out ${E.impact}s both` }} />
          {Array.from({ length: 8 }, (_, i) => (
            <span key={i} aria-hidden="true" style={{ position: 'absolute', left: `${20 + i * 8.5}%`, bottom: 2, width: 14, height: 14, borderRadius: '50%', background: `color-mix(in srgb, ${C.inkDim} 60%, transparent)`, '--dx': `${(i - 3.5) * 14}px`, animation: `lgDust .7s ease-out ${E.impact}s both`, opacity: 0 }} />
          ))}
          <div style={{ position: 'relative', transformOrigin: entrance.origin || '50% 50%', animation: `${entrance.name} ${(E.impact - E.slam).toFixed(2)}s ${entrance.ease} ${E.slam}s both` }}>
            <div style={{ animation: `lgEyes 1.3s ease-in-out ${E.impact + 0.2}s infinite, lgBossBob 2.4s ease-in-out ${E.impact + 0.4}s infinite` }}>
              {kind === 'bosses' ? <BossArt area={area} size={BOSS.intro} animated={calm ? 'idle' : 'intro'} /> : <LegendsArt kind={kind} motif={area.motif} palette={area.palette} height={BOSS.intro} width={BOSS.intro} round={0} animated={calm ? 'idle' : 'intro'} />}
            </div>
          </div>
        </div>
        <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 30, color: C.white, lineHeight: 1.1, textShadow: `0 0 18px color-mix(in srgb, ${C.danger} 80%, transparent), 0 3px 0 color-mix(in srgb, ${C.danger} 60%, black)`, animation: `lgStamp .45s cubic-bezier(.3,1.4,.5,1) ${E.title}s both` }}>
          {name ? t('lg_bossNamed', { name }) : t('lg_bossBlocks', { area: area.title })}
        </div>
        {name && <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 15, letterSpacing: '.08em', textTransform: 'uppercase', color: `color-mix(in srgb, ${C.danger} 55%, ${C.white})`, marginTop: -6, animation: `lgStamp .45s cubic-bezier(.3,1.4,.5,1) ${E.title + 0.15}s both` }}>{t('lg_bossGuards', { area: area.title })}</div>}
        <Lives t={t} lives={lives} left={lives} size={28} popFrom={E.lives} bonus={bonus} />
        {bonus > 0 && <div style={{ fontSize: 14, fontWeight: 800, color: C.warning, marginTop: -4, animation: `lgRise .4s ease-out ${E.lives + lives * 0.12}s both` }}>💖 {t('lg_bonusLife')}</div>}
        {legendary && <div style={{ fontSize: 14, fontWeight: 800, color: `color-mix(in srgb, ${C.warning} 70%, ${C.white})`, marginTop: -4 }}>{t('lg_legendaryRules')}</div>}
        {ability && (
          <div style={{ maxWidth: 460, padding: '8px 14px', borderRadius: RADIUS.md, border: `2px solid color-mix(in srgb, ${C.purple} 70%, ${C.white})`, background: `color-mix(in srgb, ${C.purple} 22%, black)`, color: C.white, animation: `lgRise .4s ease-out ${E.lives + lives * 0.12 + 0.1}s both` }}>
            <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 15, letterSpacing: '.06em', textTransform: 'uppercase', color: `color-mix(in srgb, ${C.purple} 35%, ${C.white})` }}>{ABILITY_ICON[ability]} {t('lg_abilityIs', { name: t(`lg_ability_${ability}`) })}</div>
            <div style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.45, marginTop: 2 }}>{t(`lg_abilityDesc_${ability}`)}</div>
          </div>
        )}
        <div style={{ animation: `lgRise .4s ease-out ${E.fight}s both` }}>
          <div style={{ animation: `lgCall 1.1s ease-in-out ${E.fight + 0.4}s infinite` }}>
            <ChunkyButton color={C.danger} onClick={onFight} style={{ minWidth: 200, fontSize: 18 }}>⚔️ {t('lg_bossFight')}</ChunkyButton>
          </div>
        </div>
      </div>
    </div>
  )
}

// `hits`/`misses` so far; `last` = { kind: 'hit' | 'miss', n } (n changes per answer, so the animation replays).
// The end of the fight, under the arena: the win, or out of lives. `onDone` goes to the result.
export function BossEnd({ t, won, onDone }) {
  return (
    <div className="lg-boss" style={{ display: 'grid', gap: 12, justifyItems: 'center', textAlign: 'center', padding: '10px 0' }}>
      <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 24, color: won ? C.success : C.danger, animation: 'lgBossBob 1.6s ease-in-out 2' }}>
        {won ? `🏆 ${t('lg_bossWon')}` : `💔 ${t('lg_bossLost')}`}
      </div>
      <ChunkyButton color={won ? C.success : C.warning} onClick={onDone}>{t('lg_bossSeeResult')}</ChunkyButton>
    </div>
  )
}

// Icons and floater texts for the raid abilities (fight.js ABILITIES, strike's last.fx).
export const ABILITY_ICON = { regrowth: '🐍', plating: '🛡', phylactery: '☠', heads: '🔥', singularity: '🌀' }
const FX_KEY = { cut: 'lg_fx_cut', bounce: 'lg_fx_bounce', triple: 'lg_fx_triple', rise: 'lg_fx_rise', shatter: 'lg_fx_shatter', singularity: 'lg_fx_singularity' }

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
export function BossArena({ t, area, name = '', need, lives, bonus = 0, state, phases = 2, weak = [], shield = false, focus = false, getZoom, kind = 'bosses', ability = '' }) {
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
  // A raid boss changing phase: it flashes, shakes and swells, and "PHASE N" stamps over it (once per change).
  const shift = usePhaseShift(phases > 2 && !down ? phase : 0)
  const hpColor = hp / need > 0.5 ? C.danger : hp / need > 0.25 ? C.warning : C.success
  const heartsLast = missNow || (last?.lives > 0) ? { kind: 'miss', n: last.n } : null
  const chip = (color, text, key) => (
    <span key={key} style={{ fontSize: 11.5, fontWeight: 800, color, border: `1.5px solid color-mix(in srgb, ${color} 45%, transparent)`, borderRadius: RADIUS.pill, padding: '1px 8px', whiteSpace: 'nowrap' }}>{text}</span>
  )
  return (
    <div className="lg-boss" data-phase={phase} style={{ display: 'flex', alignItems: 'center', gap: compact ? 10 : 16, padding: compact ? '6px 12px' : '10px 14px', borderRadius: RADIUS.lg,
      background: `color-mix(in srgb, ${C.danger} ${rage ? 14 : 7}%, ${C.surface})`, border: `2px solid color-mix(in srgb, ${C.danger} ${rage ? 60 : 30}%, ${C.border})`, transition: 'background .4s, border-color .4s' }}>
      <BossStyle />
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div key={`s${shift}`} style={{ animation: shift && !focus ? 'lgPhaseShift 1s ease-out both' : 'none' }}>
        <div key={`b${last?.n || 0}`} style={{ animation: down ? 'lgBossDown .6s ease-out both' : focus ? 'none' : hitNow ? 'lgBossHit .5s ease-out' : missNow ? 'lgBossLunge .45s ease-out' : `lgBossBob ${rage ? 1.2 : 2.4}s ease-in-out infinite`,
          filter: down ? 'grayscale(.8) opacity(.6)' : rage ? `drop-shadow(0 0 10px ${C.danger}) saturate(1.3)` : 'none' }}>
          {kind === 'bosses'
            ? <BossArt area={area} size={compact ? BOSS.arenaCompact : BOSS.arena} animated={down ? false : 'idle'} />
            : <LegendsArt kind={kind} motif={area.motif} palette={area.palette} height={compact ? BOSS.arenaCompact : BOSS.arena} width={compact ? BOSS.arenaCompact : BOSS.arena} round={0} animated={down ? false : 'idle'} phase={phase} />}
        </div>
        </div>
        {shift > 0 && !focus && <>
          <div key={`r${shift}`} aria-hidden="true" style={{ position: 'absolute', left: '50%', top: '50%', width: '100%', height: '100%', borderRadius: '50%', border: `4px solid ${C.purple}`, transform: 'translate(-50%, -50%)', animation: 'lgPhaseRing .8s ease-out both', pointerEvents: 'none' }} />
          <div key={`p${shift}`} aria-hidden="true" style={{ position: 'absolute', left: '50%', top: '50%', whiteSpace: 'nowrap', fontFamily: FONT.display, fontWeight: 900, fontSize: compact ? 18 : 24, letterSpacing: '.08em', textTransform: 'uppercase', color: C.white, padding: '0 8px', borderRadius: 6, background: `color-mix(in srgb, ${C.danger} 80%, black)`, border: `2px solid ${C.white}`, boxShadow: `0 0 16px ${C.danger}`, transform: 'translate(-50%, -50%) rotate(-8deg)', animation: 'lgPhaseStamp 1.6s cubic-bezier(.3,1.3,.5,1) both', pointerEvents: 'none', zIndex: 2 }}>{t('lg_fightPhase', { n: shift })}</div>
        </>}
        {!focus && hitNow && <div key={`f${last.n}`} aria-hidden="true" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: C.danger, mixBlendMode: 'screen', animation: 'lgBossFlash .35s ease-out both', pointerEvents: 'none' }} />}
        {!focus && last && (hitNow || last.shielded || last.kind === 'block' || last.fx) && (
          <div key={`d${last.n}`} aria-hidden="true" style={{ position: 'absolute', left: '50%', top: 0, whiteSpace: 'nowrap', fontFamily: FONT.display, fontWeight: 900, fontSize: last.crit || last.fx ? 26 : 22, color: last.shielded || last.fx === 'bounce' ? C.info : last.fx ? C.purple : last.crit ? C.warning : C.danger, animation: 'lgBossFloat .9s ease-out both', pointerEvents: 'none' }}>
            {last.shielded ? '🛡' : last.fx && FX_KEY[last.fx] ? `${last.damage ? `-${last.damage} ` : ''}${t(FX_KEY[last.fx])}` : `-${last.damage}${last.crit ? '!' : ''}`}
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'grid', gap: compact ? 4 : 8 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: compact ? 15 : 17, color: C.ink }}>{down ? `🏆 ${t('lg_bossDown')}` : `${rage ? '😡' : '👑'} ${name || area.title}`}</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 800, color: C.inkDim }}>{t('lg_bossHp', { hp, max: need })}</span>
        </div>
        <div role="progressbar" aria-valuemin={0} aria-valuemax={need} aria-valuenow={hp} aria-label={t('lg_bossHpLabel')}
          style={{ height: compact ? 12 : 16, borderRadius: RADIUS.pill, background: C.surfaceSunken, overflow: 'hidden', border: `2px solid color-mix(in srgb, ${C.danger} 35%, transparent)` }}>
          <div style={{ width: `${(hp / need) * 100}%`, height: '100%', background: `linear-gradient(90deg, ${hpColor}, color-mix(in srgb, ${hpColor} 70%, white))`, transition: 'width .45s cubic-bezier(.3,1.3,.5,1), background .3s' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Lives t={t} lives={lives} left={left} last={heartsLast} bonus={bonus} size={16} />
          {shield && chip(st.shieldUsed ? C.inkFaint : C.info, `🛡 ${st.shieldUsed ? t('lg_fightShieldUsed') : t('lg_fightShield')}`, 'sh')}
          {!down && ability && chip(C.purple, `${ABILITY_ICON[ability]} ${t(`lg_ability_${ability}`)}${ability === 'phylactery' && st.risen ? ` · ${t('lg_fx_rise')}` : ''}`, 'ab')}
          {!down && rage && chip(C.danger, `😡 ${phases > 2 ? t('lg_fightPhase', { n: phase }) : t('lg_fightRage')}`, 'rg')}
          {!focus && st.combo >= 2 && chip(C.warning, `🔥 ${t('lg_fightCombo', { n: st.combo })}`, 'cb')}
          {weak.length > 0 && !compact && chip(C.success, `🎯 ${t('lg_fightWeak', { items: weak.join(', ') })}`, 'wk')}
        </div>
      </div>
    </div>
  )
}
