// The streak's flame and number. Opened from the header it just burns quietly; when the day's first XP extends
// the streak (`celebrate`) it plays the show: a glow burst, the flame popping in and flickering, embers, the number
// rolling from yesterday's count to today's, and confetti. CSS only, and nothing moves for people who asked their
// system for reduced motion.
import { C, FONT } from '../../config/tokens'
import { shade } from '../ui'

export const FX = {
  box: 150,              // px, the flame area
  confetti: 28,          // pieces
  embers: 7,
  rollAt: 0.55,          // s: the number rolls once the flame has popped in
  confettiAt: 0.35,      // s
}
const CONFETTI_COLORS = [C.brand, C.warning, C.success, C.info, C.purple, C.teal]

// Stable pseudo-random numbers, so a re-render never reshuffles the confetti mid-flight.
const rand = (i, salt) => { const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453; return x - Math.floor(x) }

const CSS = `
@keyframes gmGlowIn { 0% { transform: scale(.2); opacity: 0 } 45% { transform: scale(1.35); opacity: 1 } 100% { transform: scale(1); opacity: .85 } }
@keyframes gmGlow { 0%,100% { transform: scale(1); opacity: .75 } 50% { transform: scale(1.12); opacity: 1 } }
@keyframes gmSpin { to { transform: rotate(360deg) } }
@keyframes gmFlameIn { 0% { transform: scale(0) rotate(-25deg); opacity: 0 } 55% { transform: scale(1.25) rotate(6deg); opacity: 1 } 75% { transform: scale(.92) rotate(-3deg) } 100% { transform: scale(1) rotate(0) } }
@keyframes gmFlicker { 0%,100% { transform: scale(1, 1) skewX(0) } 25% { transform: scale(1.03, .97) skewX(-2deg) } 50% { transform: scale(.98, 1.05) skewX(1.5deg) } 75% { transform: scale(1.02, .99) skewX(-1deg) } }
@keyframes gmEmber { 0% { transform: translate(0, 0) scale(1); opacity: 0 } 15% { opacity: 1 } 100% { transform: translate(var(--dx), -95px) scale(.2); opacity: 0 } }
@keyframes gmRollOut { 0% { transform: translateY(0); opacity: 1 } 100% { transform: translateY(-60%); opacity: 0 } }
@keyframes gmRollIn { 0% { transform: translateY(60%) scale(.6); opacity: 0 } 60% { transform: translateY(-8%) scale(1.25); opacity: 1 } 100% { transform: translateY(0) scale(1); opacity: 1 } }
@keyframes gmConfetti { 0% { transform: translate(0, 0) rotate(0) scale(.4); opacity: 1 } 70% { opacity: 1 } 100% { transform: translate(var(--dx), var(--dy)) rotate(var(--rot)) scale(1); opacity: 0 } }
@keyframes gmRise { 0% { transform: translateY(14px); opacity: 0 } 100% { transform: translateY(0); opacity: 1 } }
@keyframes gmDotPop { 0% { transform: scale(.2) } 60% { transform: scale(1.35) } 100% { transform: scale(1) } }
@keyframes gmHop { 0%,100% { transform: translateY(0) rotate(0) } 30% { transform: translateY(-14px) rotate(-8deg) } 55% { transform: translateY(0) rotate(5deg) } 75% { transform: translateY(-5px) rotate(-2deg) } }
@media (prefers-reduced-motion: reduce) { .gm-fx, .gm-fx * { animation: none !important } .gm-fx .gm-once { opacity: 0 } }
`
export const StreakFxStyle = () => <style>{CSS}</style>

function StreakNumber({ value, from, celebrate }) {
  const num = { fontFamily: FONT.display, fontWeight: 900, fontSize: 44, lineHeight: 1, color: C.white }
  // A ring of shadows, not -webkit-text-stroke: the stroke ate into thin digits ("1" read as "!").
  const ring = shade(C.warning, 25)
  const outline = { textShadow: [[0, 3], [3, 0], [0, -3], [-3, 0], [2, 2], [-2, 2], [2, -2], [-2, -2]].map(([x, y]) => `${x}px ${y}px 0 ${ring}`).join(', ') + `, 0 4px 10px ${shade(C.warning, 50)}` }
  const box = { position: 'absolute', left: 0, right: 0, bottom: 20, height: 48, overflow: 'hidden', textAlign: 'center' }
  if (!celebrate || from === value) return <div style={box}><div style={{ ...num, ...outline }}>{value}</div></div>
  return (
    <div style={box}>
      <div className="gm-once" style={{ ...num, ...outline, position: 'absolute', left: 0, right: 0, animation: `gmRollOut .3s ease-in ${FX.rollAt}s both` }}>{from}</div>
      <div style={{ ...num, ...outline, position: 'absolute', left: 0, right: 0, animation: `gmRollIn .55s cubic-bezier(.3,1.5,.5,1) ${FX.rollAt + 0.2}s both` }}>{value}</div>
    </div>
  )
}

export default function StreakFlame({ streak, lit, celebrate }) {
  const glow = `radial-gradient(circle, color-mix(in srgb, ${C.warning} 55%, transparent) 0%, color-mix(in srgb, ${C.brand} 22%, transparent) 45%, transparent 70%)`
  const rays = `repeating-conic-gradient(color-mix(in srgb, ${C.warning} 26%, transparent) 0deg 9deg, transparent 9deg 30deg)`
  return (
    <div className="gm-fx" style={{ position: 'relative', width: FX.box, height: FX.box, margin: '6px auto 4px' }}>
      {lit && (
        <>
          {celebrate && <div aria-hidden="true" style={{ position: 'absolute', inset: -30, borderRadius: '50%', background: rays, WebkitMaskImage: 'radial-gradient(circle, black 30%, transparent 70%)', maskImage: 'radial-gradient(circle, black 30%, transparent 70%)', animation: 'gmSpin 14s linear infinite, gmGlowIn .8s ease-out both' }} />}
          <div aria-hidden="true" style={{ position: 'absolute', inset: -6, borderRadius: '50%', background: glow, animation: celebrate ? 'gmGlowIn .8s ease-out both, gmGlow 2.4s ease-in-out .8s infinite' : 'gmGlow 3s ease-in-out infinite' }} />
        </>
      )}
      <div style={{ position: 'relative', animation: celebrate ? 'gmFlameIn .7s cubic-bezier(.3,1.4,.5,1) both' : undefined }}>
        <div style={{
          fontSize: 120, lineHeight: `${FX.box}px`, textAlign: 'center', transformOrigin: '50% 85%', filter: lit ? 'none' : 'grayscale(1)',
          animation: lit ? `gmFlicker 1.7s ease-in-out ${celebrate ? 0.7 : 0}s infinite` : undefined,
        }}>🔥</div>
      </div>
      {lit && celebrate && Array.from({ length: FX.embers }, (_, i) => (
        <span key={`e${i}`} aria-hidden="true" style={{
          position: 'absolute', left: `${38 + rand(i, 1) * 24}%`, top: '38%', width: 5 + rand(i, 2) * 4, height: 5 + rand(i, 2) * 4, borderRadius: '50%',
          background: i % 2 ? C.warning : C.brand, '--dx': `${(rand(i, 3) - 0.5) * 50}px`,
          animation: `gmEmber ${1.3 + rand(i, 4)}s ease-out ${0.6 + rand(i, 5) * 1.4}s infinite`, opacity: 0,
        }} />
      ))}
      <StreakNumber value={streak} from={Math.max(0, streak - 1)} celebrate={celebrate && lit} />
      {celebrate && lit && Array.from({ length: FX.confetti }, (_, i) => {
        const angle = (i / FX.confetti) * Math.PI * 2 + rand(i, 6) * 0.4
        const dist = 90 + rand(i, 7) * 80
        return (
          <span key={`c${i}`} aria-hidden="true" className="gm-once" style={{
            position: 'absolute', left: '50%', top: '45%', width: 7 + rand(i, 8) * 5, height: 10 + rand(i, 9) * 6, marginLeft: -5, marginTop: -6,
            borderRadius: i % 3 === 0 ? '50%' : 2, background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            '--dx': `${Math.cos(angle) * dist}px`, '--dy': `${Math.sin(angle) * dist * 0.8 + 50}px`, '--rot': `${(rand(i, 10) - 0.5) * 720}deg`,
            animation: `gmConfetti ${1.1 + rand(i, 11) * 0.6}s cubic-bezier(.15,.7,.4,1) ${FX.confettiAt}s both`,
          }} />
        )
      })}
    </div>
  )
}
