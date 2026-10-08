// Dev-only contact sheet of the raid impact moments, frozen at any time with window.freeze(ms):
//   ?moment=<m>            every raid boss (RAID_ORDER) playing one moment at once, its body move included
//   ?boss=<a,b,...>        those bosses, one row each, playing ALL nine moments side by side (are they all different?)
//   ?arena=<a,b,...>         the REAL fight arena (BossArena) knocked out, one row per boss: effects on, then calm
//                          (focus mode: the boss greyed with the defeated tag, nothing plays); ?replay to restart
//   ?moment=ko&times=<t,...>  a TIMELINE: one row per boss, one cell per time, each cell frozen at its own time (ms,
//                          or per boss: blow, peak, stamp, end), so a knockout cinematic reads as a strip of stills
//   ?fx=<a,b,...|all>      every raid ABILITY effect (fx/<motif>.jsx), one row per boss, one real arena per fx key, as the
//                          fight plays it (last.fx + the file's demo state); &calm=1 renders them in focus mode
//                          (nothing may play); window.replay() fires them all again
// ?only=a,b narrows the first and last views, ?size=n sets the cell size, ?light=1 the light theme (else the dark one).
import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { PALETTE_CSS } from '../../src/config/palette'
import { makeT } from '../../src/i18n'
import { LegendsArt } from '../../src/features/legends/art'
import { RAID_ORDER } from '../../src/features/legends/raid'
import StrikeFxLayer, { KoTag } from '../../src/features/legends/StrikeFxLayer'
import { impactFor, koTiming } from '../../src/features/legends/impact/styles'
import { BODY_CSS, bodyAnimation } from '../../src/features/legends/impact/body'
import { JUICE_CSS } from '../../src/features/legends/fx/_juice'
import { BossArena } from '../../src/features/legends/BossArena'
import { newFight } from '../../src/features/legends/fight'
import { RAID_ABILITY } from '../../src/features/legends/raid'
import { abilityById } from '../../src/features/legends/abilities'
import { fxDemoFor } from '../../src/features/legends/fx'

window.__ebikiArtEager = true
const q = new URLSearchParams(location.search)
const MOMENT = q.get('moment') || 'hurt'
const BOSSES = (q.get('boss') || '').split(',').filter(Boolean)
const TIMES = (q.get('times') || '').split(',').filter(Boolean)
const ARENA = (q.get('arena') || '').split(',').filter(Boolean)
const FXQ = q.get('fx') || ''
const CALM = !!q.get('calm')
const SIZE = Number(q.get('size')) || (BOSSES.length || TIMES.length ? 120 : 150)
const ONLY = (q.get('only') || '').split(',').filter(Boolean)
const MOMENTS = ['hit', 'crit', 'sharpen', 'hurt', 'hurtBig', 'block', 'shield', 'wind', 'ko']
if (q.get('light')) document.body.classList.add('light')
// the app's own dark palette (the page follows it: html, body { background: var(--c-bg) })
else document.documentElement.dataset.theme = 'dark'
const t = makeT('en')

function Cell({ motif, moment, run, label }) {
  // a knockout plays over its whole cinematic, on the arena's defeated look, with the defeated tag after it (BossArena)
  const ko = moment === 'ko'
  const anim = bodyAnimation(impactFor(motif).body, moment, koTiming(motif).ms)
  return (
    <div style={{ display: 'grid', justifyItems: 'center', gap: 4 }}>
      <div style={{ position: 'relative', width: SIZE, height: SIZE, margin: SIZE * 0.2 }}>
        <div key={`b${run}`} style={{ animation: run ? anim : undefined, filter: run && ko ? 'grayscale(.8) opacity(.6)' : undefined }}>
          <LegendsArt kind="raids" motif={motif} height={SIZE} width={SIZE} round={0} animated={false} phase={2} roomed />
        </div>
        {run > 0 && <StrikeFxLayer t={t} moment={moment} motif={motif} n={run} />}
        {run > 0 && ko && <KoTag key={`k${run}`} t={t} motif={motif} delay={koTiming(motif).ms - 200} />}
      </div>
      <div style={{ fontSize: 12, fontWeight: 800 }}>{label}</div>
    </div>
  )
}

// One cell held at `at` ms of its own play (re-held while the art and late parts mount).
const timeOf = (motif, x) => {
  const k = koTiming(motif)
  return { blow: 120, peak: k.peak + 60, stamp: k.land + 120, end: k.ms - 40 }[x] ?? Number(x)
}
function Frozen({ motif, moment, at }) {
  const ref = useRef(null)
  useEffect(() => {
    const hold = () => ref.current?.getAnimations({ subtree: true }).forEach((a) => { a.pause(); a.currentTime = at })
    hold()
    const id = setInterval(hold, 250)
    return () => clearInterval(id)
  }, [at])
  return <div ref={ref} data-frozen={at}><Cell motif={motif} moment={moment} run={1} label={`${motif} · ${at}ms`} /></div>
}

function Sheet() {
  const [run, setRun] = useState(0)
  window.replay = () => setRun((r) => r + 1)
  window.freeze = (ms) => document.getAnimations().forEach((a) => { a.pause(); a.currentTime = ms })
  const list = ONLY.length ? ONLY : RAID_ORDER
  if (FXQ) {
    const bosses = FXQ === 'all' ? list : FXQ.split(',').filter(Boolean)
    return (
      <div style={{ padding: 16, display: 'grid', gap: 14 }}>
        <style>{PALETTE_CSS}</style>
        {bosses.map((m) => {
          const ability = RAID_ABILITY[m]
          const keys = abilityById(ability)?.fxKeys || []
          return (
            <div key={m} className="row" data-boss={m} style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {keys.map((fx) => {
                const demo = fxDemoFor(ability, fx) || {}
                const state = { ...newFight(), ...(demo.ab ? { ab: demo.ab } : {}), damage: 10, last: run ? { kind: 'hit', damage: 3, lives: 0, ...demo, fx, n: run } : null }
                return (
                  <div key={fx} data-fx-cell={`${m}:${fx}`} style={{ width: 420, display: 'grid', gap: 4 }}>
                    <div style={{ fontSize: 12, fontWeight: 800 }}>{m} · {fx}</div>
                    <BossArena t={t} area={{ motif: m, palette: 'original' }} name={m} need={30} lives={4} state={state} phases={3} kind="raids" ability={ability} focus={CALM} questionKey={0} />
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    )
  }
  if (ARENA.length) {
    // the killing blow: the boss's whole health in one strike
    const state = { ...newFight(), damage: 30, last: { kind: 'hit', damage: 5, lives: 0, n: run + 1 } }
    return (
      <div style={{ padding: 16, display: 'grid', gap: 18 }}>
        <style>{PALETTE_CSS}</style>
        {ARENA.map((m) => (
          <div key={m} style={{ display: 'flex', gap: 18 }}>
            {[false, true].map((calm) => (
              <div key={String(calm)} data-arena={calm ? 'calm' : 'fx'} style={{ width: 460 }}>
                <BossArena key={run} t={t} area={{ motif: m, palette: 'original' }} name={m} need={30} lives={3} state={state} phases={3} kind="raids" focus={calm} questionKey={0} />
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }
  if (TIMES.length) {
    return (
      <div style={{ padding: 16 }}>
        <style>{PALETTE_CSS + JUICE_CSS + BODY_CSS}</style>
        {/* one time: a contact sheet (the bosses wrap); several: one strip per boss */}
        <div style={{ display: TIMES.length === 1 ? 'flex' : 'block', flexWrap: 'wrap', gap: 2 }}>
        {list.map((m) => (
          <div key={m} className="row" data-boss={m} style={{ display: 'flex', flexWrap: 'nowrap', gap: 2, alignItems: 'flex-start' }}>
            {TIMES.map((x) => <Frozen key={x} motif={m} moment={MOMENT} at={timeOf(m, x)} />)}
          </div>
        ))}
        </div>
      </div>
    )
  }
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
