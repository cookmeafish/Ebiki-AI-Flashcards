// CAREER MODE's map body (./career.js; docs/plans/2026-11-14-career-mode.md). MapView draws the header and hands a
// career map to this instead of the long ladder of areas, which a course of ~800 items made unusable:
//   1. the ISLAND STRIP: one card per domain (number, title, exam weight, progress, crown), one tap to pick;
//   2. the ISLAND PAGE: its banner and story, then its OBJECTIVES as numbered cards, the one in progress expanded,
//      each holding its lessons (in order) and its checkpoint;
//   3. the BOSS card at the end, saying what opens it.
// Also `loadCareer` (browser half: fetches a package file).
import { useEffect, useRef, useState } from 'react'
import { C, FONT, RADIUS } from '../../config/tokens'
import { ChunkyButton, ProgressBar, depthBorder, shade } from '../ui'
import { AreaArt, BossArt, LegendsArt, paletteColors } from './art'
import { AreaExtras } from './Extras'
import { CheatButton, CheatRow } from './CheatUI'
import { careerSections, checkpointsLeft, currentSection, currentIsland, careerFor, shapePackage, nextCareerStep, CAREER, careerRegions, currentRegion, regionBossesLeft, isFinalArea } from './career'
import { itemSections } from './itemSections'
import { QUIZ_SIZE } from './prompt'

// The package file of a course, shaped (null when missing or broken).
export async function loadCareer(id) {
  const c = careerFor(id)
  if (!c) return null
  try {
    const r = await fetch(c.url, { cache: 'no-cache' })
    if (!r.ok) return null
    return shapePackage(await r.json())
  } catch { return null }
}
// Which courses are installed here (their files answer): [{ id, titleKey, match }].
export async function availableCareers(list) {
  const out = []
  for (const c of list) {
    try { const r = await fetch(c.url, { method: 'HEAD', cache: 'no-cache' }); if (r.ok) out.push(c) } catch { /* not installed */ }
  }
  return out
}

const required = (area) => (area.nodes || []).filter((n) => !n.optional)
// A region boss's name ("Region 2 Guardian"), the same on the map, the Continue card and in the fight.
export const regionBossName = (t, area, node) => t('lg_regionBossName', { n: (area?.regions || []).find((r) => r.id === node?.region)?.n || 1 })
const bossesOf = (area) => (area.nodes || []).filter((n) => n.kind === 'boss')
const islandProgress = (area) => { const r = required(area); return { done: r.filter((n) => n.status === 'done').length, total: r.length } }
// The island to show first: one in progress, else the first unfinished, else the first.
const startIsland = (areas) => currentIsland(areas)?.id

function IslandCard({ t, area, selected, onPick }) {
  const colors = paletteColors(area.palette)
  const p = islandProgress(area)
  return (
    <button type="button" onClick={onPick} aria-pressed={selected} className="btn-press" style={{
      display: 'flex', flexDirection: 'column', gap: 6, padding: 0, overflow: 'hidden', textAlign: 'left', cursor: 'pointer', minWidth: 0,
      borderRadius: RADIUS.md, background: C.surface, color: C.ink, fontFamily: FONT.body,
      ...depthBorder(selected ? colors.deep : C.border, { width: selected ? 3 : 2, bottomColor: selected ? shade(colors.deep, 30) : C.border }),
    }}>
      <AreaArt area={area} height={58} />
      <div style={{ padding: '0 10px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 900, letterSpacing: '.04em', color: colors.deep, textTransform: 'uppercase' }}>
          {t('lg_careerDomain', { n: area.number })}
          {area.status === 'done' && <span aria-label={t('lg_areaDone')}>👑</span>}
        </div>
        <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 14.5, lineHeight: 1.2 }}>{area.title}</div>
        {area.weight > 0 && <div style={{ fontSize: 12, color: C.inkDim, fontWeight: 700 }}>{t('lg_careerWeight', { p: area.weight })}</div>}
        <ProgressBar value={p.done} max={p.total} color={colors.deep} height={8} label={t('lg_stepsDone', { i: p.done, n: p.total })} />
        <div style={{ fontSize: 11.5, color: C.inkDim, fontWeight: 700 }}>{t('lg_stepsDone', { i: p.done, n: p.total })}</div>
        {bossesOf(area).length > 1 && <div style={{ fontSize: 11.5, color: C.inkDim, fontWeight: 700 }}>⚔️ {t('lg_bossesBeaten', { i: bossesOf(area).filter((n) => n.status === 'done').length, n: bossesOf(area).length })}</div>}
      </div>
    </button>
  )
}

// A BRIEFING (the domain's or an objective's overview, kind 'brief'): background to read first, laid out like a
// mission briefing, never like a flashcard (the owner: "make sure it looks like a briefer"): no card front, no Add to
// deck, no hook, never quizzed. Collapsible; `open` = shown open at first.
function Briefing({ t, item, colors, label, open: startOpen = false }) {
  const [open, setOpen] = useState(startOpen)
  if (!item) return null
  const secs = itemSections(item.back)
  const what = secs.find((x) => x.role === 'meaning')?.text || ''
  const example = secs.find((x) => x.role === 'example')?.text || ''
  const points = secs.find((x) => x.role === 'points')?.points || []
  return (
    <div data-briefing="" style={{ borderRadius: RADIUS.md, background: C.surface, border: `2px dashed color-mix(in srgb, ${colors.deep} 60%, ${C.border})` }}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="card-head" style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: FONT.body, color: C.ink }}>
        <span aria-hidden="true" style={{ fontSize: 18 }}>📋</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 11, fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase', color: colors.deep }}>{label}</span>
          <span style={{ display: 'block', fontSize: 12.5, color: C.inkDim }}>{t('lg_briefingSub')}</span>
        </span>
        <span aria-hidden="true" style={{ fontSize: 13, color: C.inkDim, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}>▸</span>
      </button>
      {open && (
        <div style={{ padding: '0 16px 14px', fontSize: 14, lineHeight: 1.6, color: C.ink, display: 'grid', gap: 8 }}>
          {what && <div>{what}</div>}
          {points.length > 0 && <ul style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 2 }}>{points.map((x, i) => <li key={i}>{x}</li>)}</ul>}
          {example && <div><b>{t('lg_briefingInPractice')}</b> {example}</div>}
        </div>
      )}
    </div>
  )
}

// THE NEXT STEP, one obvious button (the owner found the course map overwhelming).
function ContinueCard({ t, map, onOpen, onShow }) {
  const next = nextCareerStep(map.areas)
  if (!next) return null
  const { area, node, section, region } = next
  const colors = paletteColors(area.palette)
  const label = node.stage === 'region' ? `⚔️ ${t('lg_regionBoss')}: ${regionBossName(t, area, node)}`
    : node.stage === 'final' ? `👑 ${t('lg_finalRaid')}: ${t('lg_finalRaidName')}`
    : node.kind === 'boss' ? `🐉 ${node.stage === 'raid' ? t('lg_careerRaid') : t('lg_careerBoss')}: ${area.bossName || t('lg_boss')}`
    : node.kind === 'checkpoint' ? `🚩 ${t('lg_careerCheckpoint')}: ${section?.short || ''}` : `📘 ${t('lg_continueLesson', { title: node.title })}`
  return (
    <div data-continue="" style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', padding: '14px 16px', borderRadius: RADIUS.lg, background: C.surface, ...depthBorder(C.success, { bottomColor: shade(C.success, 30) }) }}>
      <div style={{ flex: '1 1 220px', minWidth: 0 }}>
        <div style={{ fontSize: 11.5, fontWeight: 900, letterSpacing: '.06em', textTransform: 'uppercase', color: C.success }}>{t('lg_continueNext')}</div>
        <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 18, color: C.ink, lineHeight: 1.25, overflowWrap: 'anywhere' }}>{label}</div>
        <div style={{ fontSize: 12.5, color: C.inkDim, fontWeight: 700 }}>
          {isFinalArea(area) ? <span style={{ color: colors.deep }}>{t('lg_finalRaidAll')}</span> : <span style={{ color: colors.deep }}>{t('lg_careerDomain', { n: area.number })}</span>}{region ? ` · ${t('lg_region', { n: region.n })}` : ''}{section ? ` · ${section.id} ${section.short}` : ''}
        </div>
      </div>
      <ChunkyButton color={C.success} onClick={() => { onShow(area.id); onOpen(area, node) }}>▶ {t('lg_continue')}</ChunkyButton>
    </div>
  )
}

function StepChip({ t, node, onOpen, colors, cheat, area }) {
  const locked = node.status === 'locked'
  const done = node.status === 'done'
  const check = node.kind === 'checkpoint'
  const icon = locked ? '🔒' : check ? '🚩' : done ? '✅' : '📘'
  const label = check ? t('lg_careerCheckpoint') : node.title || t(`lg_kind_${node.kind}`)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: check ? '1 1 100%' : '1 1 170px', minWidth: 0 }}>
      <button type="button" disabled={locked && !cheat} onClick={() => onOpen(node)} className={locked && !cheat ? undefined : 'btn-press'}
        aria-label={`${label}${locked ? ` (${t('lg_locked')})` : done ? ` (${t('lg_done')})` : ''}`}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: check ? '12px 14px' : '10px 12px', borderRadius: RADIUS.md, textAlign: 'left', minWidth: 0,
          background: locked ? C.surfaceSunken : check ? `color-mix(in srgb, ${colors.deep} 14%, ${C.surface})` : C.surface, color: locked ? C.inkFaint : C.ink,
          ...depthBorder(locked ? C.border : done ? C.warning : colors.deep, { width: 2, depth: 4, bottomColor: locked ? C.border : shade(done ? C.warning : colors.deep, 30) }),
          cursor: locked && !cheat ? 'default' : 'pointer', fontFamily: FONT.body,
        }}>
        <span aria-hidden="true" style={{ fontSize: check ? 22 : 18, filter: locked ? 'grayscale(1)' : 'none' }}>{icon}</span>
        <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
          <span style={{ fontWeight: 800, fontSize: check ? 14.5 : 13.5, lineHeight: 1.25, overflowWrap: 'anywhere' }}>{label}</span>
          {check && <span style={{ fontSize: 12, color: C.inkDim, fontWeight: 600 }}>{t('lg_careerCheckpointDesc', { n: Math.min(QUIZ_SIZE.checkpoint, (node.itemIds || []).length * 3), p: 70 })}</span>}
        </span>
        {done && <span aria-hidden="true" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{'⭐'.repeat(Math.max(1, node.stars || 1))}</span>}
      </button>
      {cheat && (
        <CheatRow>
          {!done && <CheatButton tip={t('lg_cheatCompleteStep')} onClick={() => cheat.completeStep(area.id, node.id)}>⚡✓</CheatButton>}
          {(done || node.attempts > 0) && <CheatButton tip={t('lg_cheatResetStep')} onClick={() => cheat.resetStep(area.id, node.id)}>⚡↺</CheatButton>}
        </CheatRow>
      )}
    </div>
  )
}

function ObjectiveCard({ t, area, section, open, onToggle, onOpen, colors, cheat }) {
  const frac = section.lessons ? section.lessonsDone / section.lessons : 0
  const cp = section.checkpoint
  const status = section.done ? `✅ ${t('lg_careerCleared')}` : cp && cp.status === 'open' ? `🚩 ${t('lg_careerCheckpointReady')}` : t('lg_careerLessons', { i: section.lessonsDone, n: section.lessons })
  return (
    <div style={{ borderRadius: RADIUS.lg, background: C.surface, ...depthBorder(section.done ? C.warning : open ? colors.deep : C.border, { bottomColor: section.done ? shade(C.warning, 30) : open ? shade(colors.deep, 30) : C.border }) }}>
      <button type="button" onClick={onToggle} aria-expanded={open} className="card-head" style={{
        display: 'flex', gap: 12, alignItems: 'center', width: '100%', padding: '12px 14px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: FONT.body, color: C.ink,
      }}>
        <span style={{ flex: 'none', minWidth: 44, padding: '6px 8px', borderRadius: RADIUS.sm, background: colors.deep, color: '#fff', fontWeight: 900, fontSize: 14, textAlign: 'center' }}>{section.id}</span>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, flex: 1 }}>
          <span style={{ fontWeight: 900, fontSize: 15, lineHeight: 1.25 }}>{section.short}</span>
          <span style={{ fontSize: 12.5, color: C.inkDim, lineHeight: 1.35 }}>{section.title}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ flex: 1, minWidth: 60 }}><ProgressBar value={section.done ? 1 : frac} max={1} color={section.done ? C.warning : colors.deep} height={7} /></span>
            <span style={{ fontSize: 12, fontWeight: 800, color: section.done ? C.warning : C.inkDim, whiteSpace: 'nowrap' }}>{status}</span>
          </span>
        </span>
        <span aria-hidden="true" style={{ fontSize: 14, color: C.inkDim, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}>▸</span>
      </button>
      {open && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, padding: '0 14px 14px' }}>
          {section.brief && <div style={{ flex: '1 1 100%' }}><Briefing t={t} colors={colors} label={t('lg_briefingObjective', { id: section.id })} item={(area.items || []).find((it) => it.id === section.brief)} /></div>}
          {section.nodes.map((n) => <StepChip key={n.id} t={t} node={n} area={area} colors={colors} cheat={cheat} onOpen={(node) => onOpen(area, node)} />)}
        </div>
      )}
    </div>
  )
}

// A REGION of an island (career.js cutRegions: about 30 new things): its objectives' lessons in order, then its boss.
// An objective's name in a region, with "(part 2 of 3)" when regions share it (a big objective is split evenly).
const partLabel = (t, sec, region, regions) => {
  const holders = regions.filter((r) => r.sections.some((s) => s.id === sec.id))
  return holders.length > 1 ? `${sec.short} ${t('lg_regionPart', { i: holders.indexOf(region) + 1, n: holders.length })}` : sec.short
}

function RegionCard({ t, area, region, regions, open, onToggle, onOpen, colors, cheat }) {
  const boss = region.boss
  const frac = region.lessons ? region.lessonsDone / region.lessons : 0
  const status = region.done ? `✅ ${t('lg_careerCleared')}` : boss && boss.status === 'open' ? `⚔️ ${t('lg_regionReady')}` : t('lg_careerLessons', { i: region.lessonsDone, n: region.lessons })
  const items = new Set(region.nodes.filter((n) => n.kind !== 'boss').flatMap((n) => n.itemIds || [])).size
  return (
    <div data-region={region.id} style={{ borderRadius: RADIUS.lg, background: C.surface, ...depthBorder(region.done ? C.warning : open ? colors.deep : C.border, { bottomColor: region.done ? shade(C.warning, 30) : open ? shade(colors.deep, 30) : C.border }) }}>
      <button type="button" onClick={onToggle} aria-expanded={open} className="card-head" style={{
        display: 'flex', gap: 12, alignItems: 'center', width: '100%', padding: '12px 14px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: FONT.body, color: C.ink,
      }}>
        <span style={{ flex: 'none', minWidth: 44, padding: '6px 8px', borderRadius: RADIUS.sm, background: colors.deep, color: '#fff', fontWeight: 900, fontSize: 13, textAlign: 'center', lineHeight: 1.15 }}>{t('lg_regionShort', { n: region.n })}</span>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, flex: 1 }}>
          <span style={{ fontWeight: 900, fontSize: 15, lineHeight: 1.25 }}>{region.sections.map((s) => partLabel(t, s, region, regions)).join(' · ')}</span>
          <span style={{ fontSize: 12.5, color: C.inkDim, lineHeight: 1.35 }}>{t('lg_regionSummary', { ids: region.sections.map((s) => s.id).join(', '), k: items, l: region.lessons })}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ flex: 1, minWidth: 60 }}><ProgressBar value={region.done ? 1 : frac} max={1} color={region.done ? C.warning : colors.deep} height={7} /></span>
            <span style={{ fontSize: 12, fontWeight: 800, color: region.done ? C.warning : C.inkDim, whiteSpace: 'nowrap' }}>{status}</span>
          </span>
        </span>
        <span aria-hidden="true" style={{ fontSize: 14, color: C.inkDim, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}>▸</span>
      </button>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 14px 14px' }}>
          {region.sections.map((s) => {
            const own = region.nodes.filter((n) => n.section === s.id && n.kind !== 'boss')
            const startsHere = own.some((n) => /-l1$/.test(n.id))
            return (
              <div key={s.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: colors.deep, letterSpacing: '.03em' }}>{s.id} · {s.short}</div>
                {startsHere && s.brief && <Briefing t={t} colors={colors} label={t('lg_briefingObjective', { id: s.id })} item={(area.items || []).find((it) => it.id === s.brief)} />}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {own.map((n) => <StepChip key={n.id} t={t} node={n} area={area} colors={colors} cheat={cheat} onOpen={(node) => onOpen(area, node)} />)}
                </div>
              </div>
            )
          })}
          {boss && <RegionBossRow t={t} area={area} region={region} node={boss} colors={colors} cheat={cheat} onOpen={() => onOpen(area, boss)} />}
        </div>
      )}
    </div>
  )
}

function RegionBossRow({ t, area, region, node, colors, cheat, onOpen }) {
  const locked = node.status === 'locked'
  const done = node.status === 'done'
  return (
    <div data-region-boss={region.id} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', padding: 12, borderRadius: RADIUS.md, background: `color-mix(in srgb, ${colors.deep} 12%, ${C.surface})`, ...depthBorder(locked ? C.border : colors.deep, { width: 2, bottomColor: locked ? C.border : shade(colors.deep, 30) }) }}>
      <BossArt area={area} size={56} locked={locked} />
      <div style={{ flex: '1 1 180px', minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '.05em', textTransform: 'uppercase', color: colors.deep }}>⚔️ {t('lg_regionBoss')}</div>
        <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 16, color: C.ink }}>{regionBossName(t, area, node)} {done ? '👑' : ''}</div>
        <div style={{ fontSize: 12.5, color: C.inkDim, fontWeight: 600 }}>{locked ? `🔒 ${t('lg_regionBossLocked')}` : t('lg_regionBossDesc', { q: node.count || CAREER.regionQuestions })}</div>
      </div>
      <ChunkyButton color={C.danger} disabled={locked && !cheat} onClick={onOpen} style={{ fontSize: 13, padding: '8px 14px' }}>⚔️ {done ? t('lg_careerBossAgain') : t('lg_careerBossFight')}</ChunkyButton>
      {cheat && !done && <CheatButton tip={t('lg_cheatCompleteStep')} onClick={() => cheat.completeStep(area.id, node.id)}>⚡✓</CheatButton>}
    </div>
  )
}

// The FINAL RAID (every island in one fight): locked until every island's raid is beaten, then the course's last step.
export function FinalRaidCard({ t, map, onOpen, cheat }) {
  const area = (map.areas || []).find(isFinalArea)
  const node = area?.nodes?.[0]
  if (!area || !node) return null
  const islands = map.areas.filter((a) => !isFinalArea(a))
  const cleared = islands.filter((a) => a.status === 'done').length
  const locked = node.status === 'locked'
  const done = node.status === 'done'
  return (
    <div data-final-raid="" style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', padding: 14, borderRadius: RADIUS.lg, background: C.surface, ...depthBorder(locked ? C.border : C.warning, { bottomColor: locked ? C.border : shade(C.warning, 30) }) }}>
      <LegendsArt kind="raids" motif={node.motif} height={84} width={84} round={RADIUS.md} locked={locked} />
      <div style={{ flex: '1 1 220px', minWidth: 0 }}>
        <div style={{ fontSize: 11.5, fontWeight: 900, letterSpacing: '.05em', textTransform: 'uppercase', color: C.warning }}>👑 {t('lg_finalRaid')}</div>
        <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 19, color: C.ink }}>{t('lg_finalRaidName')} {done ? '🏆' : ''}</div>
        <div style={{ fontSize: 13, color: C.inkDim, fontWeight: 600 }}>{locked ? `🔒 ${t('lg_finalRaidLocked', { i: cleared, n: islands.length })}` : done ? t('lg_finalRaidDone') : t('lg_finalRaidDesc', { q: node.count || CAREER.finalQuestions, n: islands.length })}</div>
      </div>
      <ChunkyButton color={C.warning} disabled={locked && !cheat} onClick={() => onOpen(area, node)}>👑 {done ? t('lg_careerBossAgain') : t('lg_careerBossFight')}</ChunkyButton>
    </div>
  )
}

function BossCard({ t, area, colors, onOpen, onLegendary, ctx, cheat }) {
  const boss = (area.nodes || []).find((n) => n.kind === 'boss' && n.stage !== 'region')
  const weak = (area.nodes || []).find((n) => n.kind === 'weak')
  if (!boss) return null
  const raid = boss.stage === 'raid'
  const left = raid ? regionBossesLeft(area) : checkpointsLeft(area)
  const locked = boss.status === 'locked'
  return (
    <div style={{ borderRadius: RADIUS.lg, padding: 14, background: `color-mix(in srgb, ${colors.sky} 35%, ${C.surface})`, ...depthBorder(colors.deep, { bottomColor: shade(colors.deep, 30) }), display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        {raid ? <LegendsArt kind="raids" motif={boss.motif} height={84} width={84} round={RADIUS.md} locked={locked} /> : <BossArt area={area} size={76} locked={locked} />}
        <div data-raid-card={raid ? '' : undefined} style={{ flex: '1 1 200px', minWidth: 0 }}>
          <div style={{ fontSize: 11.5, fontWeight: 900, letterSpacing: '.05em', textTransform: 'uppercase', color: colors.deep }}>{raid ? `🐉 ${t('lg_careerRaid')}` : `👑 ${t('lg_careerBoss')}`}</div>
          <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 19, color: C.ink }}>{area.bossName || t('lg_boss')}</div>
          <div style={{ fontSize: 13, color: C.inkDim, fontWeight: 600 }}>{raid ? t('lg_careerRaidDesc', { q: boss.count || CAREER.raidQuestions }) : t('lg_careerBossDesc', { n: QUIZ_SIZE.boss, k: CAREER.bossItems })}</div>
          {locked && <div style={{ fontSize: 13, color: C.ink, fontWeight: 800, marginTop: 4 }}>🔒 {raid ? t('lg_careerRaidLocked', { n: left }) : t('lg_careerBossLocked', { n: left })}</div>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {weak && <ChunkyButton variant="ghost" color={C.warning} disabled={weak.status === 'locked' && !cheat} onClick={() => onOpen(area, weak)}>🎯 {t('lg_kind_weak')}{area.bonusLife ? ' 💖' : ''}</ChunkyButton>}
        <ChunkyButton color={C.danger} disabled={locked && !cheat} onClick={() => onOpen(area, boss)}>⚔️ {boss.status === 'done' ? t('lg_careerBossAgain') : t('lg_careerBossFight')}</ChunkyButton>
        {area.status === 'done' && (
          <ChunkyButton variant="ghost" color={C.purple} disabled={!ctx.ai.hasKey} onClick={() => onLegendary(area)}>🏅 {area.legendary ? t('lg_legendaryAgain') : t('lg_legendaryStart')}</ChunkyButton>
        )}
      </div>
      {cheat && (
        <CheatRow style={{ justifyContent: 'flex-start' }}>
          {area.status !== 'done' && <CheatButton onClick={() => cheat.completeArea(area.id)}>⚡ {t('lg_cheatCompleteArea')}</CheatButton>}
          {(area.frozen || area.status === 'done') && <CheatButton onClick={() => cheat.resetArea(area.id)}>⚡ {t('lg_cheatResetArea')}</CheatButton>}
        </CheatRow>
      )}
    </div>
  )
}

export default function CareerMap({ ctx, map, onOpen, onLegendary, cheat }) {
  const { t } = ctx
  const [islandId, setIslandId] = useState(() => startIsland(map.areas))
  // A picked island scrolls into view (on a phone the five cards stack, and the page changed out of sight).
  const pageRef = useRef(null)
  const picked = useRef(false)
  // Inside the SCREEN's own scroll box, never scrollIntoView (it also scrolled the page root: header out of the window).
  useEffect(() => {
    const el = pageRef.current
    if (!picked.current || !el) return
    let box = el.parentElement
    while (box && !(/(auto|scroll)/.test(getComputedStyle(box).overflowY) && box.scrollHeight > box.clientHeight)) box = box.parentElement
    if (!box) return
    const z = (typeof ctx.getZoom === 'function' && ctx.getZoom()) || 1
    box.scrollTo({ top: box.scrollTop + (el.getBoundingClientRect().top - box.getBoundingClientRect().top) / z - 12, behavior: 'smooth' })
  }, [islandId]) // eslint-disable-line react-hooks/exhaustive-deps
  const islands = map.areas.filter((a) => !isFinalArea(a))
  const area = islands.find((a) => a.id === islandId) || islands[0]
  const byRegion = !!area?.regions?.length // a course built with regions (older courses: objectives + checkpoints)
  const openFor = (a) => (a?.regions?.length ? currentRegion(a) : currentSection(a))
  const [openId, setOpenId] = useState(() => openFor(area))
  // A new island shows its region (or objective) in progress (never the last island's open card).
  // (Also when the island's layout changes under it: an older course rebuilt into regions had no region open.)
  useEffect(() => { setOpenId(openFor(area)) }, [area?.id, byRegion]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!area) return null
  const colors = paletteColors(area.palette)
  const sections = careerSections(area)
  const p = islandProgress(area)
  const legendary = (a) => onLegendary?.(a, { id: `${a.id}-legendary`, kind: 'legendary', title: '', itemIds: (a.items || []).map((x) => x.id) })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '12px 0 24px' }}>
      <ContinueCard t={t} map={map} onOpen={onOpen} onShow={(id) => setIslandId(id)} />
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 900, color: C.inkDim, letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 8 }}>🏝️ {t('lg_careerIslands', { course: map.career?.title || '' })}</div>
        <div role="group" aria-label={t('lg_careerIslandsAria')} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
          {map.areas.filter((a) => !isFinalArea(a)).map((a) => <IslandCard key={a.id} t={t} area={a} selected={a.id === area.id} onPick={() => { picked.current = true; setIslandId(a.id) }} />)}
        </div>
        <div style={{ marginTop: 10 }}><FinalRaidCard t={t} map={map} onOpen={onOpen} cheat={cheat} /></div>
        {careerFor(map.career?.id)?.noticeKey && <div style={{ fontSize: 11.5, color: C.inkFaint, marginTop: 8 }}>{t(careerFor(map.career.id).noticeKey)}</div>}
      </div>

      <section ref={pageRef} aria-label={area.title} style={{ scrollMarginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ position: 'relative' }}>
          <AreaArt area={area} height={120} />
          <div style={{ position: 'relative', margin: '-30px 14px 0', padding: '10px 14px', borderRadius: RADIUS.lg, background: C.surface, ...depthBorder(colors.deep, { bottomColor: shade(colors.deep) }) }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11.5, fontWeight: 900, letterSpacing: '.05em', textTransform: 'uppercase', color: colors.deep }}>{t('lg_careerDomain', { n: area.number })}{area.weight ? ` · ${t('lg_careerWeight', { p: area.weight })}` : ''}</span>
              {area.status === 'done' && <span style={{ fontSize: 11.5, fontWeight: 800, color: C.warning }}>👑 {t('lg_areaDone')}</span>}
              {area.legendary && <span style={{ fontSize: 11.5, fontWeight: 800, color: C.purple }}>🏅 {t('lg_legendaryDone')}</span>}
              <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 800, color: C.inkDim }}>{t('lg_stepsDone', { i: p.done, n: p.total })}</span>
            </div>
            <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 21, color: C.ink, lineHeight: 1.2 }}>{area.title}</div>
            {area.theme && <div style={{ fontSize: 13, color: C.inkDim, lineHeight: 1.4 }}>{area.theme}</div>}
            <AreaExtras ctx={ctx} modeId={ctx.subject.modeId} area={area} />
          </div>
        </div>
        {area.brief && <Briefing key={area.id} t={t} colors={colors} label={t('lg_briefingDomain', { n: area.number })} item={(area.items || []).find((it) => it.id === area.brief)} open={!(area.nodes || []).some((n) => n.status === 'done')} />}
        {byRegion ? (<>
          <div style={{ fontSize: 12.5, fontWeight: 900, color: C.inkDim, letterSpacing: '.05em', textTransform: 'uppercase' }}>{t('lg_careerRegions', { n: area.regions.length })}</div>
          <div style={{ fontSize: 13, color: C.inkDim, marginTop: -6 }}>{t('lg_careerRegionsHow')}</div>
          {careerRegions(area).map((r, _i, regions) => (
            <RegionCard key={r.id} t={t} area={area} region={r} regions={regions} colors={colors} cheat={cheat} open={openId === r.id}
              onToggle={() => setOpenId((cur) => (cur === r.id ? null : r.id))} onOpen={onOpen} />
          ))}
        </>) : (<>
          <div style={{ fontSize: 12.5, fontWeight: 900, color: C.inkDim, letterSpacing: '.05em', textTransform: 'uppercase' }}>{t('lg_careerObjectives', { n: sections.length })}</div>
          {sections.map((s) => (
            <ObjectiveCard key={s.id} t={t} area={area} section={s} colors={colors} cheat={cheat} open={openId === s.id}
              onToggle={() => setOpenId((cur) => (cur === s.id ? null : s.id))} onOpen={onOpen} />
          ))}
        </>)}
        <BossCard t={t} ctx={ctx} area={area} colors={colors} cheat={cheat} onOpen={onOpen} onLegendary={legendary} />
      </section>
    </div>
  )
}
