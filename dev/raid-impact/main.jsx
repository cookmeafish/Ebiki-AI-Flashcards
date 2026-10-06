// Dev-only contact sheet: every raid boss (RAID_ORDER) playing one impact moment at once, its body move included, so
// the 26 looks can be compared side by side and frozen at any moment (window.freeze(ms)).
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { PALETTE_CSS } from '../../src/config/palette'
import { makeT } from '../../src/i18n'
import { LegendsArt } from '../../src/features/legends/art'
import { RAID_ORDER } from '../../src/features/legends/raid'
import StrikeFxLayer from '../../src/features/legends/StrikeFxLayer'
import { impactFor } from '../../src/features/legends/impact/styles'
import { BODY_CSS, bodyAnimation } from '../../src/features/legends/impact/body'
import { JUICE_CSS } from '../../src/features/legends/fx/_juice'

window.__ebikiArtEager = true
const q = new URLSearchParams(location.search)
const MOMENT = q.get('moment') || 'hurt'
const SIZE = Number(q.get('size')) || 150
const ONLY = (q.get('only') || '').split(',').filter(Boolean)
if (q.get('light')) document.body.classList.add('light')
const t = makeT('en')
const BODY_OF = { hit: 'hit', crit: 'hit', sharpen: 'hit', hurt: 'strike', hurtBig: 'strike', block: 'strike', shield: 'strike', ko: 'ko' }

function Cell({ motif, run }) {
  const anim = BODY_OF[MOMENT] ? bodyAnimation(impactFor(motif).body, BODY_OF[MOMENT]) : ''
  return (
    <div style={{ display: 'grid', justifyItems: 'center', gap: 4 }}>
      <div style={{ position: 'relative', width: SIZE, height: SIZE, margin: SIZE * 0.2 }}>
        <div key={`b${run}`} style={{ animation: run ? anim : undefined }}>
          <LegendsArt kind="raids" motif={motif} height={SIZE} width={SIZE} round={0} animated={false} phase={2} roomed />
        </div>
        {run > 0 && <StrikeFxLayer t={t} moment={MOMENT} motif={motif} n={run} />}
      </div>
      <div style={{ fontSize: 12, fontWeight: 800 }}>{motif}</div>
    </div>
  )
}

function Sheet() {
  const [run, setRun] = useState(0)
  window.replay = () => setRun((r) => r + 1)
  window.freeze = (ms) => document.getAnimations().forEach((a) => { a.pause(); a.currentTime = ms })
  const list = ONLY.length ? ONLY : RAID_ORDER
  return (
    <div style={{ padding: 16 }}>
      <style>{PALETTE_CSS + JUICE_CSS + BODY_CSS}</style>
      <div style={{ marginBottom: 8, fontWeight: 800 }}>moment: {MOMENT} <button onClick={() => setRun((r) => r + 1)}>play</button></div>
      <div id="sheet" style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {list.map((m) => <Cell key={m} motif={m} run={run} />)}
      </div>
    </div>
  )
}
createRoot(document.getElementById('root')).render(<Sheet />)
