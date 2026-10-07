// Dev-only contact sheet of the raid impact moments, frozen at any time with window.freeze(ms):
//   ?moment=<m>            every raid boss (RAID_ORDER) playing one moment at once, its body move included
//   ?boss=<a,b,...>        those bosses, one row each, playing ALL nine moments side by side (are they all different?)
// ?only=a,b narrows the first view, ?size=n sets the cell size, ?light=1 a light page.
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
const BOSSES = (q.get('boss') || '').split(',').filter(Boolean)
const SIZE = Number(q.get('size')) || (BOSSES.length ? 120 : 150)
const ONLY = (q.get('only') || '').split(',').filter(Boolean)
const MOMENTS = ['hit', 'crit', 'sharpen', 'hurt', 'hurtBig', 'block', 'shield', 'wind', 'ko']
if (q.get('light')) document.body.classList.add('light')
const t = makeT('en')

function Cell({ motif, moment, run, label }) {
  const anim = bodyAnimation(impactFor(motif).body, moment)
  return (
    <div style={{ display: 'grid', justifyItems: 'center', gap: 4 }}>
      <div style={{ position: 'relative', width: SIZE, height: SIZE, margin: SIZE * 0.2 }}>
        <div key={`b${run}`} style={{ animation: run ? anim : undefined }}>
          <LegendsArt kind="raids" motif={motif} height={SIZE} width={SIZE} round={0} animated={false} phase={2} roomed />
        </div>
        {run > 0 && <StrikeFxLayer t={t} moment={moment} motif={motif} n={run} />}
      </div>
      <div style={{ fontSize: 12, fontWeight: 800 }}>{label}</div>
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
      <div style={{ marginBottom: 8, fontWeight: 800 }}>{BOSSES.length ? `bosses: ${BOSSES.join(', ')}` : `moment: ${MOMENT}`} <button onClick={() => setRun((r) => r + 1)}>play</button></div>
      {BOSSES.length ? BOSSES.map((m) => (
        <div key={m} className="row" style={{ display: 'flex', flexWrap: 'nowrap', gap: 2, alignItems: 'flex-start' }}>
          {MOMENTS.map((mo) => <Cell key={mo} motif={m} moment={mo} run={run} label={`${m} · ${mo}`} />)}
        </div>
      )) : (
        <div id="sheet" style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {list.map((m) => <Cell key={m} motif={m} moment={MOMENT} run={run} label={m} />)}
        </div>
      )}
    </div>
  )
}
createRoot(document.getElementById('root')).render(<Sheet />)
