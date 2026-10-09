// The boss entrance card alone (BossIntro), for screenshots of its warning bands (BAND_STYLE in RaidBand.jsx picks the look).
import { createRoot } from 'react-dom/client'
import { BossIntro } from '../../src/features/legends/BossArena'
import { makeT } from '../../src/i18n'

let root = null
export function mount(el, { motif = 'ophanim', kind = 'raids', palette = 'night', legendary = false } = {}) {
  if (root) root.unmount()
  el.innerHTML = ''
  const host = document.createElement('div')
  el.appendChild(host)
  root = createRoot(host)
  root.render(<BossIntro t={makeT('en')} area={{ motif, palette }} legendary={legendary} name={motif} total={20} kind={kind} raidLives={7} onFight={() => {}} />)
}
