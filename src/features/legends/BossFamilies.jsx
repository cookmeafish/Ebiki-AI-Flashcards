// BOSS FAMILIES (EXPERIMENTAL): the asset view's "Boss families" tab. Data and the removal list: families.js.
// Each tree is drawn top-down: the raid boss on top, the bosses it is made from in a row below, joined by lines.
// Every portrait is STILL until hovered or keyboard-focused (one live drawing at a time, like AssetView's LiveCopy);
// reduced motion and Still bosses still win (LegendsArt reads them: this view turns off the asset view's forced motion).
import { useEffect, useState } from 'react'
import { C, FONT, RADIUS } from '../../config/tokens'
import { Card } from '../ui'
import { ArtLabels, ArtMotion, LegendsArt } from './art'
import { FAMILY_TREES, FAMILY_MISFITS, familyNode } from './families'
import { raidBossNumber } from './raid'

const FAM = { top: 110, raid: 90, legend: 80, line: 16, gap: 10, misfit: 80 }

// Legends boss names live in the review gallery's catalog (dev data, loaded only when this tab opens).
let catalogNames = null
function useLegendNames() {
  const [names, setNames] = useState(catalogNames)
  useEffect(() => {
    if (catalogNames) return undefined
    let live = true
    import('../../../dev/legends-gallery/catalog.js')
      .then(({ CATALOG }) => { catalogNames = Object.fromEntries(CATALOG.map((c) => [c.motif, c.boss])); if (live) setNames(catalogNames) })
      .catch(() => {})
    return () => { live = false }
  }, [])
  return names || {}
}

function Portrait({ t, motif, kind, size, name, onOpen }) {
  const [live, setLive] = useState(false)
  const raid = kind === 'raids'
  const on = () => setLive(true)
  const off = () => setLive(false)
  // The asset view keeps this tab's scroll position for Back, then opens the boss at the top.
  const open = () => onOpen(raid ? 'raids' : 'legends', motif)
  const tagColor = raid ? C.purple : C.success
  // Raid bosses have a fixed place in the progression (RAID_ORDER); a Legends boss's order depends on each map.
  const num = raid ? raidBossNumber(motif) : 0
  return (
    <div role="button" tabIndex={0} aria-label={num ? `${t('lg_famRaidNum', { n: num })} ${t('lg_famOpen', { name })}` : t('lg_famOpen', { name })} className="click-dim"
      onMouseEnter={on} onMouseLeave={off} onFocus={on} onBlur={off} onClick={open}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open() } }}
      style={{ display: 'grid', justifyItems: 'center', gap: 3, cursor: 'pointer', borderRadius: RADIUS.md, padding: 2, maxWidth: size + 40 }}>
      <div className="lg-boss" data-phase={1} data-fam-motif={motif} style={{ position: 'relative', lineHeight: 0, pointerEvents: 'none' }}>
        {num > 0 && <span data-fam-num={num} aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, zIndex: 1, lineHeight: 1.3, fontFamily: FONT.display, fontWeight: 900, fontSize: 12, color: C.white, background: C.purple, textShadow: '0 1px 1px rgba(0,0,0,.35)', borderRadius: 999, padding: '1px 7px' }}>#{num}</span>}
        <LegendsArt kind={kind} motif={motif} height={size} width={size} round={0} room animated={live ? 'idle' : false} phase={raid ? 1 : undefined} />
      </div>
      <div style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 12, color: C.ink, textAlign: 'center', lineHeight: 1.2 }}>{name}</div>
      <span style={{ fontFamily: FONT.body, fontWeight: 800, fontSize: 10, color: tagColor, border: `1.5px solid color-mix(in srgb, ${tagColor} 40%, transparent)`, borderRadius: 999, padding: '0 7px' }}>
        {num ? t('lg_famRaidNum', { n: num }) : t(raid ? 'lg_famRaid' : 'lg_famLegend')}
      </span>
    </div>
  )
}

function Branch({ t, node, depth, names, onOpen }) {
  const raid = node.kind === 'raids'
  const size = depth === 0 ? FAM.top : raid ? FAM.raid : FAM.legend
  const name = raid ? t(`lg_raidBoss_${node.motif}`) : (names[node.motif] || node.motif)
  const line = C.borderStrong
  const n = node.parents.length
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Portrait t={t} motif={node.motif} kind={node.kind} size={size} name={name} onOpen={onOpen} />
      {n > 0 && <>
        <div style={{ width: 2, height: FAM.line, background: line }} />
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          {node.parents.map((p, i) => (
            <div key={p.motif} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: `0 ${FAM.gap}px` }}>
              {n > 1 && <span style={{ position: 'absolute', top: 0, height: 2, background: line, left: i === 0 ? '50%' : 0, right: i === n - 1 ? '50%' : 0 }} />}
              <div style={{ width: 2, height: FAM.line, background: line }} />
              <Branch t={t} node={p} depth={depth + 1} names={names} onOpen={onOpen} />
            </div>
          ))}
        </div>
      </>}
    </div>
  )
}

function Heading({ t, id }) {
  return (
    <div style={{ display: 'grid', gap: 2 }}>
      <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 18, color: C.ink }}>{t(`lg_famTree_${id}`)}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.inkDim, lineHeight: 1.4 }}>{t(`lg_famWhy_${id}`)}</div>
    </div>
  )
}

export default function BossFamilies({ t, onOpen }) {
  const names = useLegendNames()
  return (
    <ArtMotion.Provider value={false}>
    <ArtLabels.Provider value={false}>
    <div data-boss-families style={{ display: 'grid', gap: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.inkDim }}>{t('lg_famIntro')}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
        {[...FAMILY_TREES].sort((a, b) => raidBossNumber(a.top) - raidBossNumber(b.top)).map((tree) => (
          <Card key={tree.id} style={{ flex: '1 1 380px', minWidth: 0, display: 'grid', gap: 12, alignContent: 'start' }}>
            <Heading t={t} id={tree.id} />
            <div style={{ display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
              <Branch t={t} node={familyNode(tree)} depth={0} names={names} onOpen={onOpen} />
            </div>
          </Card>
        ))}
      </div>
      <Card style={{ display: 'grid', gap: 12 }}>
        <Heading t={t} id={FAMILY_MISFITS.id} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
          {FAMILY_MISFITS.motifs.map((m) => <Portrait key={m} t={t} motif={m} kind="bosses" size={FAM.misfit} name={names[m] || m} onOpen={onOpen} />)}
        </div>
      </Card>
    </div>
    </ArtLabels.Provider>
    </ArtMotion.Provider>
  )
}
