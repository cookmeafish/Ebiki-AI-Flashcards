// The boss fight's stage: the area's boss (public/assets/legends/bosses), its health bar and the learner's lives.
// The boss has as much health as right answers are needed to beat it (PASS.boss of the questions); every right
// answer is a hit, every wrong one costs a life. Lives = the misses the pass mark allows + 1, so losing the last one
// is exactly the miss that makes the boss unbeatable: the fight ends there, and at 0 health it ends in a win. The
// pass itself is still decided by applyNodeResult. Nothing moves for people who asked for reduced motion.
import { C, FONT, RADIUS } from '../../config/tokens'
import { ChunkyButton } from '../ui'
import { BossArt } from './art'
import { PASS } from './map'

export const BOSS = { intro: 190, arena: 120 } // px: the boss on the intro card, and above the questions

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
@keyframes lgQuake { 0%,100% { transform: translate(0, 0) } 12% { transform: translate(-9px, 5px) } 25% { transform: translate(8px, -6px) } 38% { transform: translate(-7px, -3px) } 52% { transform: translate(6px, 4px) } 66% { transform: translate(-4px, 2px) } 80% { transform: translate(3px, -2px) } }
@keyframes lgShock { 0% { transform: translate(-50%, -50%) scale(.2); opacity: 0 } 6% { opacity: .9 } 100% { transform: translate(-50%, -50%) scale(2.6); opacity: 0 } }
@keyframes lgDust { 0% { transform: translate(0, 0) scale(.6); opacity: 0 } 8% { opacity: .9 } 100% { transform: translate(var(--dx), -26px) scale(1.4); opacity: 0 } }
@keyframes lgHeartbeat { 0%,100% { transform: scale(1); opacity: .55 } 14% { transform: scale(1.12); opacity: .9 } 28% { transform: scale(1); opacity: .6 } 42% { transform: scale(1.08); opacity: .85 } }
@keyframes lgEyes { 0%,100% { filter: drop-shadow(0 0 0 transparent) } 50% { filter: drop-shadow(0 0 14px var(--c-danger)) brightness(1.15) } }
@keyframes lgStamp { 0% { transform: scale(2.4); opacity: 0; letter-spacing: .3em } 70% { transform: scale(.94); opacity: 1 } 100% { transform: scale(1); letter-spacing: normal } }
@keyframes lgPopIn { 0% { transform: scale(0) } 70% { transform: scale(1.35) } 100% { transform: scale(1) } }
@keyframes lgRise { 0% { transform: translateY(24px); opacity: 0 } 100% { transform: translateY(0); opacity: 1 } }
@keyframes lgCall { 0%,100% { transform: scale(1) } 50% { transform: scale(1.06) } }
@media (prefers-reduced-motion: reduce) { .lg-boss, .lg-boss * { animation: none !important; opacity: 1 !important } }
`
export const BossStyle = () => <style>{CSS}</style>

// The entrance: the stage darkens, hazard stripes close in, the boss slams down (the stage quakes, a shockwave and
// dust), its eyes flash, the title stamps in, the lives pop in one by one and the Fight button rises. ~2s, CSS only.
export const ENTRANCE = { stripes: 0.15, slam: 0.45, impact: 0.95, title: 1.15, lives: 1.45, fight: 1.9 } // s
// `odds`: bossOdds options ({ bonus, pass }); `legendary`: the harder replay of a cleared area.
export function BossIntro({ t, area, name = '', total, onFight, odds, legendary = false }) {
  const { lives, bonus } = bossOdds(total, odds)
  const E = ENTRANCE
  const NIGHT = `color-mix(in srgb, ${C.bg} 25%, black)` // the stage is dark in both themes
  const stripe = `repeating-linear-gradient(-45deg, ${C.danger} 0 14px, color-mix(in srgb, ${C.danger} 20%, black) 14px 28px)`
  const band = (side) => ({
    position: 'absolute', left: 0, right: 0, height: 30, [side]: 18, display: 'grid', placeItems: 'center', overflow: 'hidden',
    background: stripe, backgroundSize: '56px 56px', boxShadow: `0 0 18px color-mix(in srgb, ${C.danger} 60%, transparent)`,
    animation: `${side === 'top' ? 'lgStripeL' : 'lgStripeR'} .4s cubic-bezier(.2,.9,.3,1) ${E.stripes}s both, lgStripeMove 1.2s linear infinite`,
  })
  const label = { fontFamily: FONT.display, fontWeight: 900, fontSize: 15, letterSpacing: '.35em', color: C.white, padding: '0 14px', background: `color-mix(in srgb, ${C.danger} 20%, black)`, borderRadius: 4, textTransform: 'uppercase' }
  return (
    <div className="lg-boss" style={{ maxWidth: 640, margin: '12px auto', position: 'relative', borderRadius: RADIUS.xl, overflow: 'hidden', animation: `lgStageIn .3s ease-out both, lgQuake .45s ease-out ${E.impact}s` }}>
      <BossStyle />
      <div style={{ position: 'relative', padding: '64px 20px 76px', display: 'grid', gap: 14, justifyItems: 'center', textAlign: 'center',
        background: `radial-gradient(ellipse at 50% 42%, color-mix(in srgb, ${C.danger} 30%, ${NIGHT}) 0%, ${NIGHT} 72%)` }}>
        <div aria-hidden="true" style={band('top')}><span style={label}>⚠ {legendary ? t('lg_legendary') : t('lg_boss')} ⚠</span></div>
        <div aria-hidden="true" style={band('bottom')}><span style={label}>⚠ {legendary ? t('lg_legendary') : t('lg_boss')} ⚠</span></div>
        <div style={{ position: 'relative', width: BOSS.intro, height: BOSS.intro }}>
          <div aria-hidden="true" style={{ position: 'absolute', inset: -40, borderRadius: '50%', background: `radial-gradient(circle, color-mix(in srgb, ${C.danger} 55%, transparent) 0%, transparent 65%)`, animation: `lgStageIn .2s ease-out ${E.impact}s both, lgHeartbeat 1.3s ease-in-out ${E.impact}s infinite` }} />
          <div aria-hidden="true" style={{ position: 'absolute', left: '50%', top: '88%', width: BOSS.intro, height: BOSS.intro * 0.35, borderRadius: '50%', border: `4px solid ${C.danger}`, animation: `lgShock .6s ease-out ${E.impact}s both` }} />
          {Array.from({ length: 8 }, (_, i) => (
            <span key={i} aria-hidden="true" style={{ position: 'absolute', left: `${20 + i * 8.5}%`, bottom: 2, width: 14, height: 14, borderRadius: '50%', background: `color-mix(in srgb, ${C.inkDim} 60%, transparent)`, '--dx': `${(i - 3.5) * 14}px`, animation: `lgDust .7s ease-out ${E.impact}s both`, opacity: 0 }} />
          ))}
          <div style={{ position: 'relative', animation: `lgSlam .55s cubic-bezier(.5,0,.7,1) ${E.slam}s both` }}>
            <div style={{ animation: `lgEyes 1.3s ease-in-out ${E.impact + 0.2}s infinite, lgBossBob 2.4s ease-in-out ${E.impact + 0.4}s infinite` }}>
              <BossArt area={area} size={BOSS.intro} />
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

export function BossArena({ t, area, name = '', total, hits, misses, last, odds }) {
  const { need, lives, bonus } = bossOdds(total, odds)
  const hp = Math.max(0, need - hits)
  const down = hp === 0
  const livesLeft = Math.max(0, lives - misses)
  const hitNow = last?.kind === 'hit'
  const missNow = last?.kind === 'miss'
  const hpColor = hp / need > 0.5 ? C.danger : hp / need > 0.25 ? C.warning : C.success
  return (
    <div className="lg-boss" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 14px', borderRadius: RADIUS.lg, background: `color-mix(in srgb, ${C.danger} 7%, ${C.surface})`, border: `2px solid color-mix(in srgb, ${C.danger} 30%, ${C.border})` }}>
      <BossStyle />
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div key={`b${last?.n || 0}`} style={{ animation: down ? 'lgBossDown .6s ease-out both' : hitNow ? 'lgBossHit .5s ease-out' : missNow ? 'lgBossLunge .45s ease-out' : 'lgBossBob 2.4s ease-in-out infinite', filter: down ? 'grayscale(.8) opacity(.6)' : 'none' }}>
          <BossArt area={area} size={BOSS.arena} />
        </div>
        {hitNow && <div key={`f${last.n}`} aria-hidden="true" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: C.danger, mixBlendMode: 'screen', animation: 'lgBossFlash .35s ease-out both', pointerEvents: 'none' }} />}
        {hitNow && <div key={`d${last.n}`} aria-hidden="true" style={{ position: 'absolute', left: '50%', top: 0, fontFamily: FONT.display, fontWeight: 900, fontSize: 22, color: C.danger, animation: 'lgBossFloat .8s ease-out both', pointerEvents: 'none' }}>-1</div>}
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'grid', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 17, color: C.ink }}>{down ? `🏆 ${t('lg_bossDown')}` : `👑 ${name || area.title}`}</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 800, color: C.inkDim }}>{t('lg_bossHp', { hp, max: need })}</span>
        </div>
        <div role="progressbar" aria-valuemin={0} aria-valuemax={need} aria-valuenow={hp} aria-label={t('lg_bossHpLabel')}
          style={{ height: 16, borderRadius: RADIUS.pill, background: C.surfaceSunken, overflow: 'hidden', border: `2px solid color-mix(in srgb, ${C.danger} 35%, transparent)` }}>
          <div style={{ width: `${(hp / need) * 100}%`, height: '100%', background: `linear-gradient(90deg, ${hpColor}, color-mix(in srgb, ${hpColor} 70%, white))`, transition: 'width .45s cubic-bezier(.3,1.3,.5,1), background .3s' }} />
        </div>
        <div style={{ display: 'flex' }}><Lives t={t} lives={lives} left={livesLeft} last={last} bonus={bonus} /></div>
      </div>
    </div>
  )
}
