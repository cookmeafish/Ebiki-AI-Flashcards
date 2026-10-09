// Dev-only comparison of the boss card's warning bands (RaidBand.jsx): every style live on three boss colors, and one
// real entrance card that takes whichever style is picked. Not part of the app build.
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { PALETTE_CSS } from '../../src/config/palette'
import { makeT } from '../../src/i18n'
import { BossIntro } from '../../src/features/legends/BossArena'
import { RaidBand, BAND_CSS, BAND_VARIANTS, BAND_STYLE } from '../../src/features/legends/RaidBand'
import { impactFor } from '../../src/features/legends/impact/styles'
import { paletteTint } from '../../src/features/legends/art'

const t = makeT('en')
const NAMES = { ribbon: 'Ribbon', beam: 'Energy beam', lightning: 'Lightning', sigil: 'Sigil chain', chevron: 'Chevrons (current)', sheen: 'Sheen', hazard: 'Refined hazard' }
const forest = paletteTint('forest')
const SAMPLES = [
  { label: t('lg_raid'), main: impactFor('ophanim').color, deep: impactFor('ophanim').accent, who: 'Raid: Ophanim' },
  { label: t('lg_boss'), main: forest[0], deep: forest[2], who: 'Legends boss: forest palette' },
  { label: t('lg_raid'), main: impactFor('vampire').color, deep: impactFor('vampire').accent, who: 'Raid: Vampire' },
]
const CARD = { position: 'relative', height: 64, borderRadius: 14, overflow: 'hidden', background: 'radial-gradient(ellipse at 50% 120%, #2a0d12, #050507 70%)' }
const BAND = { position: 'absolute', left: 0, right: 0, top: 17, height: 30, display: 'grid', placeItems: 'center', overflow: 'hidden' }

function Page() {
  const [style, setStyle] = useState(BAND_STYLE)
  const [boss, setBoss] = useState('ophanim')
  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e6edf3', padding: 24, display: 'grid', gap: 22 }}>
      <style>{PALETTE_CSS + BAND_CSS}</style>
      <h1 style={{ fontFamily: "'Baloo 2'", fontSize: 26 }}>Boss banner styles</h1>
      <div style={{ display: 'grid', gap: 18 }}>
        {BAND_VARIANTS.map((v) => (
          <div key={v} style={{ display: 'grid', gap: 8 }}>
            <button onClick={() => setStyle(v)} style={{ justifySelf: 'start', font: "800 15px 'Nunito'", color: style === v ? '#fff' : '#9aa4b2', background: 'none', border: 'none', cursor: 'pointer' }}>{style === v ? '▶ ' : ''}{NAMES[v] || v}</button>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
              {SAMPLES.map((s) => (
                <div key={s.who} title={s.who} style={CARD}><div style={BAND}><RaidBand variant={v} main={s.main} deep={s.deep} label={s.label} /></div></div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <b>On a real card:</b>
        <select value={style} onChange={(e) => setStyle(e.target.value)}>{BAND_VARIANTS.map((v) => <option key={v} value={v}>{NAMES[v] || v}</option>)}</select>
        <select value={boss} onChange={(e) => setBoss(e.target.value)}>{['ophanim', 'vampire', 'dreamer', 'kitsune', 'chronos'].map((m) => <option key={m}>{m}</option>)}</select>
      </div>
      <div style={{ maxWidth: 680 }}>
        <BossIntro key={`${style}-${boss}`} t={t} area={{ motif: boss, palette: 'night', title: boss }} name={boss} total={20} kind="raids" raidLives={7} onFight={() => {}} bandStyle={style} />
      </div>
    </div>
  )
}
createRoot(document.getElementById('root')).render(<Page />)
