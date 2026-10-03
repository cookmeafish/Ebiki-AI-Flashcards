// What a raid ability LOOKS like when it fires: one short effect over the boss, keyed by strike's `last.fx`
// (fight.js). Every boss draws its own in fx/<motif>.jsx (a bolt for the Thunder God, a wave for the Drowned God, a
// scythe arc for the Soul Harvester...); fx/index.js is the registry and documents the contract, fx/_kit.jsx holds
// the shared keyframes and helpers. Drawn with plain CSS animation over the boss box, about a second long, never
// blocking a click. Focus mode and "reduce motion" (unless the owner's "Always animate the art") show none: the
// floater text still says what happened.
import { FX_CSS, FX_MS } from './fx/_kit'
import { FX_BY_MOTIF, effectFor } from './fx'

// Every fx key any boss can draw.
export const ABILITY_FX_KEYS = [...new Set(Object.values(FX_BY_MOTIF).flatMap((d) => Object.keys(d.effects || {})))]

// One effect for `fx` (from `ability`'s own file). Remount it (key by the strike number) to play it again.
export function AbilityFx({ fx, ability = '' }) {
  const draw = effectFor(ability, fx)
  if (!draw) return null
  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
      <style>{FX_CSS}</style>
      {draw()}
    </div>
  )
}
export { FX_MS }
