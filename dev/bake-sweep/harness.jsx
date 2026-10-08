// One boss as the arena shows it (phase, an ability effect, ability state), for baked-vs-vector comparisons.
import { createRoot } from 'react-dom/client'
import { LegendsArt } from '../../src/features/legends/art'
import { BossStyle } from '../../src/features/legends/BossArena'
import { abilityCss } from '../../src/features/legends/fx/index.js'

let root = null
export function mount(el, { phase = 1, size = 200, motif, kind = 'raids', animated = 'idle', ability = '', fx = '', ab = {} } = {}) {
  if (root) root.unmount()
  el.innerHTML = ''
  const host = document.createElement('div')
  el.appendChild(host)
  root = createRoot(host)
  const attrs = Object.fromEntries(Object.entries(ab).map(([k, v]) => [`data-ab-${k}`, String(v)]))
  root.render(
    <div className="lg-boss lg-motion" data-phase={phase} data-fx={fx || undefined} {...attrs} style={{ display: 'inline-block', margin: 60 }}>
      <BossStyle />
      {ability ? <style>{abilityCss(ability, attrs)}</style> : null}
      <LegendsArt kind={kind} motif={motif} palette="original" height={size} width={size} round={0} animated={animated} phase={phase} />
    </div>)
}
