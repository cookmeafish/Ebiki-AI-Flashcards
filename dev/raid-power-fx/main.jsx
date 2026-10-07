// Dev-only sheet of the raid power animations (impact/PowerFx.jsx), frozen at any time with window.freeze(ms):
//   ?view=cast   every power's cast over the boss          ?view=armed   every armed look (window powers at 3, 2, 1)
//   ?view=proc   every proc                                ?boss=<motif> the boss behind them, ?light=1, ?size=n
//   ?view=arena  the REAL BossArena per power: its cast, then its armed look, then its proc (as in a raid)
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { PALETTE_CSS } from '../../src/config/palette'
import { makeT } from '../../src/i18n'
import { LegendsArt } from '../../src/features/legends/art'
import { POWER_IDS } from '../../src/features/legends/powers'
import { BossArena } from '../../src/features/legends/BossArena'
import { RAID, RAID_ABILITY } from '../../src/features/legends/raid'
import { raidProfile } from '../../src/features/legends/raidProfiles'
import { newFight } from '../../src/features/legends/fight'
import { PowerFx, PowerArmed, PowerProc, SteadfastHearts, POWER_ARMED, POWER_PROC, POWER_ARMED_CSS, wardStyle } from '../../src/features/legends/impact/PowerFx'

window.__ebikiArtEager = true
const q = new URLSearchParams(location.search)
const VIEW = q.get('view') || 'cast'
const BOSS = q.get('boss') || 'chronos'
const SIZE = Number(q.get('size')) || 150
if (q.get('light')) document.body.classList.add('light')
const t = makeT('en')

function Cell({ label, children, foot }) {
  return (
    <div style={{ display: 'grid', justifyItems: 'center', gap: 4 }}>
      <div style={{ position: 'relative', width: SIZE, height: SIZE, margin: SIZE * 0.2 }}>
        <LegendsArt kind="raids" motif={BOSS} height={SIZE} width={SIZE} round={0} animated={false} phase={1} roomed />
        {children}
      </div>
      {foot}
      <div style={{ fontSize: 12, fontWeight: 800 }}>{label}</div>
    </div>
  )
}

function Sheet() {
  const [run, setRun] = useState(1)
  window.replay = () => setRun((r) => r + 1)
  window.freeze = (ms) => document.getAnimations().forEach((a) => { a.pause(); a.currentTime = ms })
  let cells = []
  if (VIEW === 'cast') cells = POWER_IDS.map((id) => <Cell key={id} label={id}><PowerFx t={t} power={{ id, n: run }} /></Cell>)
  if (VIEW === 'proc') cells = Object.keys(POWER_PROC).map((id) => <Cell key={id} label={id}><PowerProc t={t} proc={{ id, n: run }} /></Cell>)
  if (VIEW === 'arena') {
    cells = POWER_IDS.map((id) => {
      const arm = POWER_ARMED[id] ? { [id]: POWER_ARMED[id].window ? 2 : id === 'steadfast' ? 2 : true } : {}
      return (
        <div key={id} style={{ width: 640, display: 'grid', gap: 2 }}>
          <div style={{ fontSize: 12, fontWeight: 800 }}>{id}</div>
          <BossArena t={t} area={{ motif: BOSS, palette: 'night' }} name={BOSS} need={60} lives={raidProfile(BOSS).hearts} state={{ ...newFight(), damage: 12 }} phases={RAID.phases} ability={RAID_ABILITY[BOSS]} kind="raids"
            power={q.get('show') === 'proc' ? null : { id, n: run }} armed={arm} proc={q.get('show') === 'proc' && POWER_PROC[id] ? { id, n: run } : null} />
        </div>
      )
    })
  }
  if (VIEW === 'armed') {
    cells = Object.keys(POWER_ARMED).flatMap((id) => {
      const counts = POWER_ARMED[id].window ? [3, 2, 1] : id === 'steadfast' ? [2, 1] : [true]
      return counts.map((v) => {
        const foot = id === 'shield'
          ? <span style={{ display: 'inline-flex', gap: 4, ...wardStyle(true) }}>🛡️ ❤️❤️❤️</span>
          : id === 'steadfast' ? <SteadfastHearts n={v} /> : null
        return <Cell key={`${id}${v}`} label={`${id} ${v === true ? '' : v}`} foot={foot}><PowerArmed armed={{ [id]: v }} anim /></Cell>
      })
    })
  }
  return (
    <div style={{ padding: 16, minHeight: '100vh', background: q.get('light') ? '#f4f1ea' : '#15121c', color: q.get('light') ? '#222' : '#eee' }}>
      <style>{PALETTE_CSS + POWER_ARMED_CSS}</style>
      <div style={{ marginBottom: 8, fontWeight: 800 }}>view: {VIEW} · boss: {BOSS} <button onClick={() => setRun((r) => r + 1)}>play</button></div>
      <div id="sheet" style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>{cells}</div>
    </div>
  )
}
createRoot(document.getElementById('root')).render(<Sheet />)
