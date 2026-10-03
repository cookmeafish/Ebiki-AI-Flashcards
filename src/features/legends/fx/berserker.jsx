// What the Berserker's All In (allin) LOOKS like. The fx contract is in fx/index.js, the juice format in fx/_juice.js.
// Fixed bright colors; BossArena skips all of it in focus mode, with Still bosses and under reduced motion. The floater
// already starts with the answer's damage, so the texts never repeat the number.
import { anim, around, ring, slash } from './_kit'

const RED = '#ff3a2e'
const EMBER = '#ffb43a'

// A huge double axe (head at the top of a long haft), drawn pointing up from its pivot at the bottom centre.
const axe = (style) => (
  <svg className="lgx" viewBox="0 0 60 120" style={{ width: 70, height: 140, marginLeft: -35, transformOrigin: '50% 100%', ...style }}>
    <rect x="27" y="18" width="6" height="102" rx="2" fill="#6b4a2b" stroke="#2a1a0e" strokeWidth="1.5" />
    <path d="M30 6 C14 2 2 14 4 34 C14 30 22 30 30 32 Z M30 6 C46 2 58 14 56 34 C46 30 38 30 30 32 Z" fill="#e8eef5" stroke="#2a1a0e" strokeWidth="2" />
    <path d="M4 34 C14 30 22 30 30 32 C38 30 46 30 56 34" fill="none" stroke={RED} strokeWidth="2.5" />
  </svg>
)

export default {
  effects: {
    // Cleave (big): the double axe swings a 270 deg arc across the arena, a red cleave line splits it, sparks fly and a
    // shockwave rolls out.
    cleave: () => <>
      {axe({ left: '50%', top: '-45%', animation: anim('lgrBerserkerSwing', 700, 0, 'cubic-bezier(.5,0,.75,0)') })}
      {slash(-35, RED, 330, '150%', 12)}
      {slash(-35, '#ffffff', 360, '120%', 4)}
      {around(14, (i, a) => <div key={i} className="lgx" style={{ left: '50%', top: '50%', width: 5, height: 14, borderRadius: 3, background: i % 2 ? EMBER : '#ffffff', boxShadow: `0 0 8px ${EMBER}`, '--a': `${a}deg`, '--d': `${-80 - (i % 3) * 18}px`, '--spin': '60deg', animation: anim('lgxShard', 650, 360 + (i % 4) * 20) }} />)}
      {ring(RED, 380, 2.4, 6, 700)}
    </>,
    // Whiff (medium): the axe slams into the ground beside the boss; a red crack runs toward your hearts, dust rises.
    whiff: () => <>
      {axe({ left: '78%', top: '-10%', animation: anim('lgrBerserkerSlam', 500, 0, 'cubic-bezier(.6,0,.9,.4)') })}
      <svg className="lgx" viewBox="0 0 100 20" preserveAspectRatio="none" style={{ left: '70%', top: '92%', width: '70%', height: 16 }}>
        <path d="M0 10 L12 6 L20 13 L33 5 L45 12 L58 7 L70 14 L84 6 L100 10" fill="none" stroke={RED} strokeWidth="3" strokeLinejoin="round" style={{ strokeDasharray: 140, animation: anim('lgrBerserkerCrack', 600, 260) }} />
      </svg>
      {around(5, (i) => <div key={i} className="lgx" style={{ left: `${72 + i * 5}%`, top: '86%', width: 16, height: 16, borderRadius: '50%', background: '#b9a48c', '--h': '-34px', animation: anim('lgxRise', 600, 260 + i * 30) }} />)}
    </>,
    // Taunt (tick, cosmetic): two angry marks pop over his head.
    taunt: () => <>{[38, 58].map((x, i) => <div key={x} className="lgx" style={{ left: `${x}%`, top: '2%', fontSize: 20, lineHeight: 1, animation: anim('lgrBerserkerVein', 330, i * 70) }}>💢</div>)}</>,
  },
  floaters: { cleave: 'lg_fx_allinCleave', whiff: 'lg_fx_allinWhiff', taunt: 'lg_fx_allinTaunt' },
  floaterTone: { cleave: 'danger', whiff: 'danger', taunt: 'warning' },
  juice: {
    cleave: { size: 'big', shake: 3, flash: 2, hitstop: 1, sfx: 'berserker.cleave' },
    whiff: { size: 'medium', shake: 2, hitstop: 1, sfx: 'berserker.whiff' },
    taunt: { size: 'tick', sfx: 'berserker.taunt' },
  },
  demo: { cleave: { damage: 5, fxVars: { n: 5 } }, whiff: { kind: 'miss', damage: 0, lives: 2 }, taunt: { damage: 1 } },
  // Reactions (body only; the face layers come with the art pass): cleave = knocked sideways with a spin, recovers
  // (heavier and shorter in phase 3, the god of war barely gives ground); whiff = two chest-pump guffaw bounces;
  // taunt = two small forward thrusts.
  css: `
@keyframes lgrBerserkerSwing { 0% { transform: rotate(-135deg); opacity: 0 } 12% { opacity: 1 } 70% { transform: rotate(135deg); opacity: 1 } 100% { transform: rotate(150deg); opacity: 0 } }
@keyframes lgrBerserkerSlam { 0% { transform: rotate(-70deg); opacity: 0 } 20% { opacity: 1 } 55% { transform: rotate(18deg); opacity: 1 } 65% { transform: rotate(12deg) } 100% { transform: rotate(14deg); opacity: 0 } }
@keyframes lgrBerserkerCrack { 0% { stroke-dashoffset: 140; opacity: 1 } 70% { stroke-dashoffset: 0; opacity: 1 } 100% { stroke-dashoffset: 0; opacity: 0 } }
@keyframes lgrBerserkerVein { 0% { transform: scale(0); opacity: 0 } 40% { transform: scale(1.3); opacity: 1 } 100% { transform: scale(1) translateY(-8px); opacity: 0 } }
@keyframes lgrBerserkerStagger { 0% { transform: none } 18% { transform: translateX(12px) rotate(15deg) } 45% { transform: translateX(6px) rotate(6deg) } 70% { transform: translateX(-2px) rotate(-2deg) } 100% { transform: none } }
@keyframes lgrBerserkerStaggerP3 { 0% { transform: none } 18% { transform: translateX(7px) rotate(8deg) } 45% { transform: translateX(2px) rotate(2deg) } 100% { transform: none } }
@keyframes lgrBerserkerGuffaw { 0%, 100% { transform: none } 18% { transform: translateY(-8px) rotate(-5deg) scale(1.05) } 34% { transform: translateY(-2px) rotate(-1deg) } 52% { transform: translateY(-8px) rotate(-5deg) scale(1.05) } 70% { transform: translateY(-2px) rotate(-1deg) } 86% { transform: translateY(-4px) rotate(-2deg) scale(1.02) } }
@keyframes lgrBerserkerChestBeat { 0%, 100% { transform: none } 22% { transform: scale(1.07) translate(-3px, -4px) } 44% { transform: scale(1.01) } 66% { transform: scale(1.07) translate(3px, -4px) } 88% { transform: scale(1.01) } }
.lgr-berserker-cleave { animation: lgrBerserkerStagger 900ms cubic-bezier(.22,1,.36,1) both; transform-origin: bottom center }
.lg-boss[data-phase="3"] .lgr-berserker-cleave { animation-name: lgrBerserkerStaggerP3 }
.lgr-berserker-whiff { animation: lgrBerserkerGuffaw 800ms ease-in-out both; transform-origin: bottom center }
.lgr-berserker-taunt { animation: lgrBerserkerChestBeat 330ms ease-in-out both }
`,
}
