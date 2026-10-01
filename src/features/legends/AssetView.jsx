// Asset view (cheat mode only: 7 clicks on the map title). Two tabs: the Legends stages (boss + banner) and the raid
// bosses. Every drawing of ONE item at a time, in every place the app shows it: the entrance, the fight (full and
// compact), the map icon, locked, the banner on the map and whole, raid phases 1 to 3, then every palette. A strip
// picks one; ← and → step through them. Every drawing carries its file name UNDER it (ArtLabels): only here.
import { useEffect, useRef, useState } from 'react'
import { C, FONT, RADIUS } from '../../config/tokens'
import { ChunkyButton, Card } from '../ui'
import { AreaArt, ArtLabels, BossArt, LegendsArt, artUrl, BANNER } from './art'
import { BossIntro, BossArena, BossStyle, BOSS, ABILITY_ICON } from './BossArena'
import { newFight } from './fight'
import { MOTIFS, PALETTES } from './map'
import { RAID, RAID_MOTIFS, RAID_ABILITY } from './raid'
import { ABILITY } from './fight'

const VIEW = { mapW: 620, mapH: 132, thumb: 56, paletteBoss: 72, paletteBannerW: 260, phase: 180, demoHp: 30 }
const TABS = [
  { id: 'legends', icon: '🗺️', labelKey: 'lg_assetsTabLegends', list: MOTIFS },
  { id: 'raids', icon: '⚔️', labelKey: 'lg_assetsTabRaids', list: RAID_MOTIFS },
]

const Label = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: C.inkFaint }}>{children}</div>
)
const Cell = ({ label, children }) => <div style={{ display: 'grid', gap: 6, justifyItems: 'center' }}>{children}<Label>{label}</Label></div>
// A raid boss as the fight shows it in a phase: the arena's own rules switch the lg-p1/p2/p3/p12 layers.
const RaidPhase = ({ motif, palette, phase, size }) => (
  <div className="lg-boss" data-phase={phase}><LegendsArt kind="raids" motif={motif} palette={palette} height={size} width={size} round={0} animated="idle" /></div>
)
// The fight arena with a button that deals a third of the health: every press plays the phase change (flash, shake,
// "PHASE N" tag) the real raid shows. After the last phase it starts over at full health.
function PhaseDemo({ t, area, motif, getZoom }) {
  const [step, setStep] = useState(0)
  const third = VIEW.demoHp / RAID.phases
  const damage = Math.min(VIEW.demoHp - 1, Math.round(step * third))
  const state = { ...newFight(), damage, last: step ? { kind: 'hit', damage: Math.round(third), lives: 0, n: step } : null }
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <BossArena key={motif} t={t} area={area} name={motif} need={VIEW.demoHp} lives={RAID.lives} state={state} phases={RAID.phases} ability={RAID_ABILITY[motif]} getZoom={getZoom} kind="raids" />
      <div><ChunkyButton variant="ghost" color={C.danger} onClick={() => setStep((n) => (n + 1) % RAID.phases)} style={{ fontSize: 12, padding: '6px 10px' }}>⚔️ {t('lg_assetsNextPhase')}</ChunkyButton></div>
    </div>
  )
}

// A raid boss's ability, in full, at the top of its page: the rule, the hint the fight shows when it applies, and the
// words that pop over the boss when it triggers (the same texts the real fight uses).
const ABILITY_HINT = { plating: {}, regrowth: { n: ABILITY.regrowthCut }, singularity: { n: ABILITY.singularityLives }, heads: {}, judgment: { n: ABILITY.judgmentSmite },
  maelstrom: { n: ABILITY.maelstromBonus }, kindling: { n: ABILITY.kindlingBonus }, rewind: {}, bloodpact: {}, tempest: { n: ABILITY.tempestFactor },
  reflection: {}, devour: { n: ABILITY.devourChoke }, marionette: { n: ABILITY.marionetteCounter }, lastbreath: { n: ABILITY.lastbreathFactor },
  swarm: { n: ABILITY.swarmSting }, petrify: { n: ABILITY.petrifyShatter }, crescendo: { n: 2 }, harvest: { n: ABILITY.harvestMax }, slumber: { n: ABILITY.slumberBonus } }
const ABILITY_FX = { regrowth: ['cut'], plating: ['bounce'], phylactery: ['rise', 'shatter'], heads: ['triple'], singularity: ['singularity'], judgment: ['smite'],
  maelstrom: ['surface'], kindling: ['kindle'], rewind: ['rewind'], bloodpact: ['pact'], tempest: ['bolt'], reflection: ['reflect'], devour: ['choke', 'gorge'], marionette: ['snap'], lastbreath: ['lastbreath'],
  swarm: ['sting'], petrify: ['crumble'], crescendo: ['crescendo'], harvest: ['harvest'], slumber: ['slumber'] }
function AbilityCard({ t, ability }) {
  if (!ability) return <div style={{ fontSize: 13.5, color: C.inkDim }}>{t('lg_assetsNoAbility')}</div>
  const label = { fontSize: 11.5, fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase', color: C.purple }
  return (
    <section aria-label={t('lg_assetsAbility')} style={{ maxWidth: 640, padding: '14px 18px', borderRadius: RADIUS.lg, display: 'grid', gap: 10,
      border: `3px solid ${C.purple}`, background: `color-mix(in srgb, ${C.purple} 12%, ${C.surface})` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 34, lineHeight: 1 }}>{ABILITY_ICON[ability]}</span>
        <div>
          <div style={label}>{t('lg_assetsAbility')}</div>
          <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 22, color: C.ink }}>{t(`lg_ability_${ability}`)}</div>
        </div>
      </div>
      <div style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.5, color: C.ink }}>{t(`lg_abilityDesc_${ability}`)}</div>
      {ABILITY_HINT[ability] && (
        <div><div style={label}>{t('lg_assetsAbilityHint')}</div><div style={{ fontSize: 13.5, color: C.inkDim, fontWeight: 600 }}>{t(`lg_hint_${ability}`, ABILITY_HINT[ability])}</div></div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={label}>{t('lg_assetsAbilityFx')}</span>
        {(ABILITY_FX[ability] || []).map((k) => (
          <span key={k} style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 16, color: C.purple, padding: '0 8px', borderRadius: RADIUS.sm, background: C.surface }}>{t(`lg_fx_${k}`)}</span>
        ))}
      </div>
    </section>
  )
}

export default function AssetView({ ctx, onBack }) {
  const { t } = ctx
  const [tab, setTab] = useState('legends')
  const [idx, setIdx] = useState(0)
  const [palette, setPalette] = useState(PALETTES[0])
  const [replay, setReplay] = useState(0)
  const { list } = TABS.find((x) => x.id === tab)
  const raids = tab === 'raids'
  const motif = list[Math.min(idx, list.length - 1)]
  const area = { id: motif, title: motif, motif, palette }
  const go = (d) => setIdx((i) => (i + d + list.length) % list.length)
  const pickTab = (id) => { setTab(id); setIdx(0); setReplay(0) }
  // Opens at the top: the screen's scroll box still held the map's position.
  const rootRef = useRef(null)
  useEffect(() => {
    let box = rootRef.current?.parentElement
    while (box && !/(auto|scroll)/.test(getComputedStyle(box).overflowY)) box = box.parentElement
    if (box) box.scrollTop = 0
  }, [])

  // The key handler is installed once; it calls the CURRENT step function (the list changes with the tab).
  const goRef = useRef(go)
  goRef.current = go
  useEffect(() => {
    const on = (e) => {
      if (e.defaultPrevented || /input|textarea|select/i.test(e.target?.tagName || '')) return
      if (e.key === 'ArrowLeft') goRef.current(-1)
      else if (e.key === 'ArrowRight') goRef.current(1)
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [])

  const section = { display: 'grid', gap: 12 }
  const h = { fontFamily: FONT.display, fontWeight: 900, fontSize: 18, color: C.ink }
  const row = { display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-end' }
  const thumb = (m) => raids
    ? <LegendsArt kind="raids" motif={m} palette={palette} height={VIEW.thumb} width={VIEW.thumb} round={0} />
    : <BossArt area={{ motif: m, palette }} size={VIEW.thumb} />
  return (
    <ArtLabels.Provider value>
    <BossStyle />
    <div ref={rootRef} style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <ChunkyButton variant="ghost" color={C.inkDim} onClick={onBack} style={{ fontSize: 12, padding: '7px 12px' }}>← {t('lg_back')}</ChunkyButton>
        <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 24, color: C.ink, marginRight: 'auto' }}>⚡ {t('lg_cheatAssets')}</div>
        <select value={palette} onChange={(e) => setPalette(e.target.value)} aria-label={t('lg_assetsPalette')}
          style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 13, padding: '6px 8px', borderRadius: RADIUS.sm, border: `2px solid ${C.borderStrong}`, background: C.surface, color: C.ink }}>
          {PALETTES.map((p) => <option key={p} value={p}>{t('lg_assetsPalette')}: {p}</option>)}
        </select>
      </div>

      <div role="tablist" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {TABS.map((x) => {
          const on = tab === x.id
          return (
            <button key={x.id} type="button" role="tab" aria-selected={on} onClick={() => pickTab(x.id)} className={`ui-tab${on ? ' ui-tab-current' : ''}`}
              style={{ padding: '8px 14px', borderRadius: RADIUS.md, cursor: on ? 'default' : 'pointer', fontFamily: FONT.display, fontWeight: 900, fontSize: 15,
                border: `2px solid ${on ? C.brand : C.border}`, background: on ? `color-mix(in srgb, ${C.brand} 12%, ${C.surface})` : C.surface, color: on ? C.brand : C.inkDim }}>
              {x.icon} {t(x.labelKey, { n: x.list.length })}
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6 }}>
        {list.map((m, i) => (
          <button key={m} type="button" onClick={() => setIdx(i)} className={i === idx ? 'ui-tab-current' : undefined}
            style={{ flex: '0 0 auto', display: 'grid', justifyItems: 'center', gap: 2, padding: 4, borderRadius: RADIUS.md, cursor: i === idx ? 'default' : 'pointer',
              border: `2px solid ${i === idx ? C.brand : C.border}`, background: i === idx ? `color-mix(in srgb, ${C.brand} 12%, ${C.surface})` : C.surface,
              fontFamily: FONT.body, fontSize: 10, fontWeight: 800, color: i === idx ? C.brand : C.inkDim }}>
            {thumb(m)}
            <span>{i + 1}. {m}{raids && RAID_ABILITY[m] ? ` ${ABILITY_ICON[RAID_ABILITY[m]]}` : ''}</span>
          </button>
        ))}
      </div>

      <Card style={{ display: 'grid', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <ChunkyButton variant="ghost" color={C.inkDim} onClick={() => go(-1)} style={{ fontSize: 12, padding: '6px 10px' }}>◀</ChunkyButton>
          <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 26, color: C.brand }}>#{idx + 1}</div>
          <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 24, color: C.ink }}>{motif}</div>
          <ChunkyButton variant="ghost" color={C.inkDim} onClick={() => go(1)} style={{ fontSize: 12, padding: '6px 10px' }}>▶</ChunkyButton>
          <div style={{ marginLeft: 'auto', fontSize: 12, color: C.inkFaint, fontFamily: 'monospace', display: 'grid', textAlign: 'right' }}>
            {raids ? <span>{artUrl('raids', motif)}</span> : <><span>{artUrl('bosses', motif)}</span><span>{artUrl('areas', motif)}</span></>}
          </div>
        </div>

        {raids && <AbilityCard t={t} ability={RAID_ABILITY[motif]} />}

        <div style={section}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={h}>{t('lg_assetsEntrance')}</div>
            <ChunkyButton variant="ghost" color={C.brand} onClick={() => setReplay((n) => n + 1)} style={{ fontSize: 12, padding: '6px 10px' }}>▶ {t('lg_assetsReplay')}</ChunkyButton>
          </div>
          <div style={{ maxWidth: 560 }}>
            <BossIntro key={`${tab}-${motif}-${palette}-${replay}`} t={t} area={area} name={motif} total={20} onFight={() => setReplay((n) => n + 1)}
              {...(raids ? { kind: 'raids', raidLives: RAID.lives, ability: RAID_ABILITY[motif] } : {})} />
          </div>
        </div>

        {raids ? (
          <div style={section}>
            <div style={h}>{t('lg_assetsPhases')}</div>
            <div style={{ maxWidth: 640 }}><PhaseDemo t={t} area={area} motif={motif} getZoom={ctx.getZoom} /></div>
            <div style={row}>
              {Array.from({ length: RAID.phases }, (_, i) => (
                <Cell key={i} label={t('lg_assetsPhase', { n: i + 1 })}><RaidPhase motif={motif} palette={palette} phase={i + 1} size={VIEW.phase} /></Cell>
              ))}
            </div>
            <div style={row}>
              <Cell label={t('lg_assetsFight', { px: BOSS.arena })}><RaidPhase motif={motif} palette={palette} phase={1} size={BOSS.arena} /></Cell>
              <Cell label={t('lg_assetsFight', { px: BOSS.arenaCompact })}><RaidPhase motif={motif} palette={palette} phase={1} size={BOSS.arenaCompact} /></Cell>
            </div>
          </div>
        ) : (
          <>
            <div style={section}>
              <div style={h}>{t('lg_assetsBoss')}</div>
              <div style={row}>
                <Cell label={t('lg_assetsFight', { px: BOSS.arena })}><BossArt area={area} size={BOSS.arena} animated="idle" /></Cell>
                <Cell label={t('lg_assetsFight', { px: BOSS.arenaCompact })}><BossArt area={area} size={BOSS.arenaCompact} animated="idle" /></Cell>
                <Cell label={t('lg_assetsMapIcon')}><BossArt area={area} size={64} /></Cell>
                <Cell label={t('lg_assetsLocked')}><BossArt area={area} size={64} locked /></Cell>
              </div>
            </div>

            <div style={section}>
              <div style={h}>{t('lg_assetsBanner')}</div>
              <Cell label={t('lg_assetsBannerMap', { w: VIEW.mapW, h: VIEW.mapH })}><AreaArt area={area} height={VIEW.mapH} width={Math.min(VIEW.mapW, 1000)} /></Cell>
              <Cell label={t('lg_assetsBannerWhole')}><AreaArt area={area} height={Math.round(VIEW.mapW * BANNER.h / BANNER.w)} width={VIEW.mapW} animated={false} /></Cell>
              <Cell label={t('lg_assetsLocked')}><AreaArt area={area} height={VIEW.mapH} width={VIEW.mapW} locked /></Cell>
            </div>
          </>
        )}

        <div style={section}>
          <div style={h}>{t('lg_assetsPalettes')}</div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {PALETTES.map((p) => (
              <div key={p} style={{ display: 'grid', gap: 6, justifyItems: 'center', padding: 8, borderRadius: RADIUS.md, border: `2px solid ${p === palette ? C.brand : C.border}` }}>
                {raids
                  ? <LegendsArt kind="raids" motif={motif} palette={p} height={VIEW.paletteBoss} width={VIEW.paletteBoss} round={0} />
                  : <>
                    <AreaArt area={{ motif, palette: p }} height={Math.round(VIEW.paletteBannerW * BANNER.h / BANNER.w)} width={VIEW.paletteBannerW} animated={false} />
                    <BossArt area={{ motif, palette: p }} size={VIEW.paletteBoss} />
                  </>}
                <Label>{p}</Label>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
    </ArtLabels.Provider>
  )
}
