// Asset view (cheat mode only: 7 clicks on the map title). Every drawing of ONE stage at a time, in every place the
// app shows it: the boss entrance, the fight (full and compact), the map icon, locked, the banner on the map and the
// whole drawing, then the stage in every palette. A strip of all stages picks one; ← and → step through them.
import { useEffect, useRef, useState } from 'react'
import { C, FONT, RADIUS } from '../../config/tokens'
import { ChunkyButton, Card } from '../ui'
import { AreaArt, BossArt, artUrl, BANNER } from './art'
import { BossIntro, BOSS } from './BossArena'
import { MOTIFS, PALETTES } from './map'

const VIEW = { mapW: 620, mapH: 132, thumb: 56, paletteBoss: 72, paletteBannerW: 260 }

const Label = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: C.inkFaint }}>{children}</div>
)
const Cell = ({ label, children }) => <div style={{ display: 'grid', gap: 6, justifyItems: 'center' }}>{children}<Label>{label}</Label></div>

export default function AssetView({ ctx, onBack }) {
  const { t } = ctx
  const [idx, setIdx] = useState(0)
  const [palette, setPalette] = useState(PALETTES[0])
  const [replay, setReplay] = useState(0)
  const motif = MOTIFS[idx]
  const area = { id: motif, title: motif, motif, palette }
  const go = (d) => setIdx((i) => (i + d + MOTIFS.length) % MOTIFS.length)
  // Opens at the top: the screen's scroll box still held the map's position.
  const rootRef = useRef(null)
  useEffect(() => {
    let box = rootRef.current?.parentElement
    while (box && !/(auto|scroll)/.test(getComputedStyle(box).overflowY)) box = box.parentElement
    if (box) box.scrollTop = 0
  }, [])

  useEffect(() => {
    const on = (e) => {
      if (e.defaultPrevented || /input|textarea|select/i.test(e.target?.tagName || '')) return
      if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === 'ArrowRight') go(1)
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [])

  const section = { display: 'grid', gap: 12 }
  const h = { fontFamily: FONT.display, fontWeight: 900, fontSize: 18, color: C.ink }
  return (
    <div ref={rootRef} style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <ChunkyButton variant="ghost" color={C.inkDim} onClick={onBack} style={{ fontSize: 12, padding: '7px 12px' }}>← {t('lg_back')}</ChunkyButton>
        <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 24, color: C.ink, marginRight: 'auto' }}>⚡ {t('lg_assetsTitle', { n: MOTIFS.length })}</div>
        <select value={palette} onChange={(e) => setPalette(e.target.value)} aria-label={t('lg_assetsPalette')}
          style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 13, padding: '6px 8px', borderRadius: RADIUS.sm, border: `2px solid ${C.borderStrong}`, background: C.surface, color: C.ink }}>
          {PALETTES.map((p) => <option key={p} value={p}>{t('lg_assetsPalette')}: {p}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6 }}>
        {MOTIFS.map((m, i) => (
          <button key={m} type="button" onClick={() => setIdx(i)} className={i === idx ? 'ui-tab-current' : undefined}
            style={{ flex: '0 0 auto', display: 'grid', justifyItems: 'center', gap: 2, padding: 4, borderRadius: RADIUS.md, cursor: i === idx ? 'default' : 'pointer',
              border: `2px solid ${i === idx ? C.brand : C.border}`, background: i === idx ? `color-mix(in srgb, ${C.brand} 12%, ${C.surface})` : C.surface,
              fontFamily: FONT.body, fontSize: 10, fontWeight: 800, color: i === idx ? C.brand : C.inkDim }}>
            <BossArt area={{ motif: m, palette }} size={VIEW.thumb} />
            {i + 1}. {m}
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
            <span>{artUrl('bosses', motif)}</span><span>{artUrl('areas', motif)}</span>
          </div>
        </div>

        <div style={section}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={h}>{t('lg_assetsEntrance')}</div>
            <ChunkyButton variant="ghost" color={C.brand} onClick={() => setReplay((n) => n + 1)} style={{ fontSize: 12, padding: '6px 10px' }}>▶ {t('lg_assetsReplay')}</ChunkyButton>
          </div>
          <div style={{ maxWidth: 560 }}>
            <BossIntro key={`${motif}-${palette}-${replay}`} t={t} area={area} name={motif} total={20} onFight={() => setReplay((n) => n + 1)} />
          </div>
        </div>

        <div style={section}>
          <div style={h}>{t('lg_assetsBoss')}</div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-end' }}>
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

        <div style={section}>
          <div style={h}>{t('lg_assetsPalettes')}</div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {PALETTES.map((p) => (
              <div key={p} style={{ display: 'grid', gap: 6, justifyItems: 'center', padding: 8, borderRadius: RADIUS.md, border: `2px solid ${p === palette ? C.brand : C.border}` }}>
                <AreaArt area={{ motif, palette: p }} height={Math.round(VIEW.paletteBannerW * BANNER.h / BANNER.w)} width={VIEW.paletteBannerW} animated={false} />
                <BossArt area={{ motif, palette: p }} size={VIEW.paletteBoss} />
                <Label>{p}</Label>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
