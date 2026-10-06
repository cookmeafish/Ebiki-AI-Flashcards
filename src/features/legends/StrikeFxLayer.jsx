// THE IMPACT LAYER of a raid strike (strikeFx.js names the moment): sparks and a shockwave on a hit, a bigger burst and
// "CRITICAL!" on a critical, claw slashes and a red vignette when the boss lands a blow, a parry on a blocked attack, a
// shield bubble, a heart rising on Second wind, and the knockout (rays, a ring, "DEFEATED!"). Tinted with the boss's
// own color (heroState.js RAID_TINT), so every raid boss's impact reads as its own. CSS only, inside the boss box,
// never over the question; BossArena mounts it only while effects may play (not in focus mode, Still bosses or
// reduced motion) and fades it with the next question.
import { FONT } from '../../config/tokens'
import { RAID_TINT } from './heroState'
import { FLOATER_OUTLINE } from './fx/_juice'

const CSS = `
@keyframes lgsSpark { 0% { transform: rotate(var(--a)) translateX(8%) scaleX(.2); opacity: 0 } 15% { opacity: 1 } 100% { transform: rotate(var(--a)) translateX(var(--r)) scaleX(1); opacity: 0 } }
@keyframes lgsRing { 0% { transform: translate(-50%, -50%) scale(.2); opacity: .95 } 100% { transform: translate(-50%, -50%) scale(var(--s, 1.6)); opacity: 0 } }
@keyframes lgsSlash { 0% { transform: translate(-50%, -50%) rotate(var(--a)) scaleX(0); opacity: 0 } 20% { opacity: 1 } 45% { transform: translate(-50%, -50%) rotate(var(--a)) scaleX(1); opacity: 1 } 100% { transform: translate(-50%, -50%) rotate(var(--a)) scaleX(1); opacity: 0 } }
@keyframes lgsVignette { 0% { opacity: 0 } 20% { opacity: 1 } 100% { opacity: 0 } }
@keyframes lgsLabel { 0% { transform: translateX(-50%) scale(2.2); opacity: 0 } 18% { transform: translateX(-50%) scale(.92); opacity: 1 } 28% { transform: translateX(-50%) scale(1.06) } 36% { transform: translateX(-50%) scale(1) } 78% { opacity: 1 } 100% { transform: translateX(-50%) translateY(-14px); opacity: 0 } }
@keyframes lgsBubble { 0% { transform: translate(-50%, -50%) scale(.3); opacity: 0 } 25% { transform: translate(-50%, -50%) scale(1.08); opacity: .9 } 45% { transform: translate(-50%, -50%) scale(.98) } 80% { opacity: .7 } 100% { transform: translate(-50%, -50%) scale(1.25); opacity: 0 } }
@keyframes lgsRise { 0% { transform: translate(-50%, 0) scale(.4); opacity: 0 } 20% { transform: translate(-50%, -8px) scale(1.3); opacity: 1 } 100% { transform: translate(-50%, -70px) scale(1); opacity: 0 } }
@keyframes lgsRays { 0% { transform: translate(-50%, -50%) rotate(0) scale(.2); opacity: 0 } 15% { opacity: .95 } 100% { transform: translate(-50%, -50%) rotate(40deg) scale(1.5); opacity: 0 } }
`
// Fixed bright colors over the art (both themes), the boss's own tint for its impact.
const COLOR = { hit: '#fff4c2', crit: '#ffd23a', hurt: '#ff3b3b', parry: '#8fe3ff', shield: '#6fc3ff', wind: '#ff6b9a', white: '#ffffff' }
const LABEL = { crit: 'lg_fxCrit', sharpen: 'lg_fxSharpen', block: 'lg_fxBlock', shield: 'lg_fxSaved', hurtBig: 'lg_fxHurtBig', wind: 'lg_fxWind', ko: 'lg_fxKo' }
const LABEL_FILL = { crit: COLOR.crit, sharpen: COLOR.crit, block: COLOR.parry, shield: COLOR.shield, hurtBig: COLOR.hurt, wind: COLOR.wind, ko: COLOR.white }

const sparks = (n, color, reach, ms, width = 3) => Array.from({ length: n }, (_, i) => (
  <div key={`s${i}`} style={{ position: 'absolute', left: '50%', top: '50%', width: '46%', height: width, marginTop: -width / 2, transformOrigin: '0 50%',
    background: `linear-gradient(90deg, transparent, ${color} 55%, #fff)`, borderRadius: width, boxShadow: `0 0 6px ${color}`, '--a': `${(360 / n) * i + (i % 2 ? 9 : 0)}deg`, '--r': reach,
    animation: `lgsSpark ${ms}ms cubic-bezier(.15,.8,.3,1) both` }} />
))
const ring = (color, ms, scale = 1.6, delay = 0, width = 3) => (
  <div key={`r${delay}`} style={{ position: 'absolute', left: '50%', top: '50%', width: '70%', height: '70%', borderRadius: '50%', border: `${width}px solid ${color}`,
    '--s': scale, animation: `lgsRing ${ms}ms ease-out ${delay}ms both` }} />
)

export default function StrikeFxLayer({ t, moment, motif, n, fading = false }) {
  if (!moment) return null
  const tint = RAID_TINT[motif] || COLOR.crit
  const parts = []
  if (moment === 'hit') parts.push(...sparks(8, tint, '66%', 540), ring(COLOR.hit, 520, 1.5))
  if (moment === 'crit' || moment === 'sharpen') parts.push(...sparks(14, moment === 'crit' ? COLOR.crit : tint, '78%', 620, 4), ring(COLOR.crit, 560, 1.9), ring(tint, 640, 2.3, 90))
  if (moment === 'hurt' || moment === 'hurtBig') {
    // Claw marks: parallel slashes across the boss box (four for a missed attack), over a red glow.
    const marks = moment === 'hurtBig' ? [-1.5, -0.5, 0.5, 1.5] : [-1, 0, 1]
    parts.push(<div key="v" style={{ position: 'absolute', inset: '-6%', borderRadius: '50%', background: `radial-gradient(circle, ${COLOR.hurt}00 30%, ${COLOR.hurt}aa 75%, ${COLOR.hurt}00 100%)`, animation: 'lgsVignette 650ms ease-out both' }} />)
    marks.forEach((o, i) => parts.push(
      <div key={`c${i}`} style={{ position: 'absolute', left: `${50 + o * 13}%`, top: `${50 - o * 4}%`, width: '110%', height: moment === 'hurtBig' ? 9 : 7, borderRadius: 6, boxShadow: `0 0 8px ${COLOR.hurt}`,
        background: `linear-gradient(90deg, transparent, ${COLOR.hurt} 25%, #fff 50%, ${COLOR.hurt} 75%, transparent)`, '--a': '62deg',
        animation: `lgsSlash 520ms cubic-bezier(.2,.9,.3,1) ${i * 55}ms both` }} />))
  }
  if (moment === 'block') parts.push(
    ...[45, -45].map((a, i) => <div key={`x${i}`} style={{ position: 'absolute', left: '50%', top: '50%', width: '70%', height: 5, borderRadius: 5, background: `linear-gradient(90deg, transparent, ${COLOR.parry}, #fff, ${COLOR.parry}, transparent)`, '--a': `${a}deg`, animation: 'lgsSlash 480ms cubic-bezier(.2,.9,.3,1) both' }} />),
    ...sparks(10, COLOR.parry, '60%', 460, 3), ring(COLOR.parry, 460, 1.5))
  if (moment === 'shield') parts.push(<div key="b" style={{ position: 'absolute', left: '50%', top: '50%', width: '86%', height: '86%', borderRadius: '50%', border: `4px solid ${COLOR.shield}`, background: `radial-gradient(circle, transparent 55%, ${COLOR.shield}55 100%)`, animation: 'lgsBubble 700ms ease-out both' }} />)
  if (moment === 'wind') parts.push(<div key="h" style={{ position: 'absolute', left: '50%', bottom: '10%', fontSize: 30, animation: 'lgsRise 1100ms cubic-bezier(.22,1,.36,1) both' }}>💖</div>)
  if (moment === 'ko') {
    parts.push(<div key="rays" style={{ position: 'absolute', left: '50%', top: '50%', width: '190%', height: '190%', borderRadius: '50%',
      background: `repeating-conic-gradient(${tint}cc 0deg 7deg, transparent 7deg 22deg)`, WebkitMaskImage: 'radial-gradient(circle, #000 25%, transparent 70%)', maskImage: 'radial-gradient(circle, #000 25%, transparent 70%)',
      animation: 'lgsRays 1300ms ease-out both' }} />)
    parts.push(...sparks(18, tint, '95%', 900, 5), ring(COLOR.white, 700, 2.2), ring(tint, 900, 2.8, 120, 4))
  }
  const label = LABEL[moment]
  return (
    <div key={`sf${n}`} aria-hidden="true" data-strike-fx={moment} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1, opacity: fading ? 0 : 1, transition: 'opacity 200ms ease-in' }}>
      <style>{CSS}</style>
      {parts}
      {label && (
        <div style={{ position: 'absolute', left: '50%', top: moment === 'ko' ? '38%' : '22%', whiteSpace: 'nowrap', fontFamily: FONT.display, fontWeight: 900,
          fontSize: moment === 'ko' ? 26 : 19, letterSpacing: '.04em', color: LABEL_FILL[moment], WebkitTextStroke: `2px ${FLOATER_OUTLINE}`, paintOrder: 'stroke fill',
          animation: `lgsLabel ${moment === 'ko' ? 1500 : 950}ms cubic-bezier(.22,1,.36,1) 60ms both`, zIndex: 2 }}>
          {t(label)}
        </div>
      )}
    </div>
  )
}
