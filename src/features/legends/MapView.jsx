// The map: a vertical scroll of areas (the first at the bottom), each an illustrated banner over a winding
// ladder of round steps climbed bottom to top, the boss on top. Drawn by the app, never by the AI: the banner
// and the boss are the hand-made files in public/assets/legends (./art.jsx). Scrolls to the learner's current area.
import { useEffect, useRef, useState } from 'react'
import { C, FONT, RADIUS } from '../../config/tokens'
import { bandFor, bandProgress } from '../kit/learner'
import { ChunkyButton, ProgressBar, depthBorder, shade } from '../ui'
import { AreaArt, BossArt, paletteColors } from './art'
import { mapProgress } from './map'
import { CheatButton, CheatRow, useCheatToggle } from './CheatUI'
import { AreaExtras, Journey, PassportModal } from './Extras'

export const KIND_ICON = { learn: '📘', practice: '✏️', scene: '📖', rule: '📐', talk: '💬', adventure: '🧭', weak: '🎯', boss: '👑' }
const NODE = { size: 66, boss: 88, swing: 72, gap: 26 }  // px: step button, boss button, sideways swing, vertical gap
const MAX_W = 620

export function LevelChip({ t, learner, isLanguage, compact = false }) {
  if (!learner) return null
  const band = bandFor(learner.level, isLanguage)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: compact ? 0 : 180 }}>
      <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: compact ? 18 : 22, color: C.purple, lineHeight: 1 }}>{Math.round(learner.level)}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t(`lg_band_${band.key}`)}</div>
        <ProgressBar value={bandProgress(learner.level, isLanguage)} max={1} color={C.purple} height={8} />
      </div>
    </div>
  )
}

function Stars({ n, size = 14 }) {
  return (
    <span aria-hidden="true" style={{ display: 'inline-flex', gap: 1, fontSize: size, lineHeight: 1 }}>
      {[1, 2, 3].map((i) => <span key={i} style={{ filter: i <= n ? 'none' : 'grayscale(1) opacity(.35)' }}>⭐</span>)}
    </span>
  )
}

// `cheat` (cheat mode): locked steps open too, and a row of ⚡ buttons sits under the label.
function StepButton({ t, area, node, colors, onOpen, index, focusRef, cheat }) {
  const boss = node.kind === 'boss'
  const size = boss ? NODE.boss : NODE.size
  const locked = node.status === 'locked'
  const done = node.status === 'done'
  // The boss shows its picture on the area's light sky (its own colors would vanish on the deep tone).
  const face = locked ? C.surfaceSunken : done ? C.warning : boss ? colors.sky : colors.deep
  const edge = boss && !done ? colors.deep : face
  const x = boss ? 0 : Math.round(Math.sin(index * 0.95) * NODE.swing)
  const label = node.title || t(`lg_kind_${node.kind}`)
  return (
    <div ref={focusRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `translateX(${x}px)`, gap: 4 }}>
      <button type="button" disabled={locked && !cheat} onClick={() => onOpen(node)} className={locked && !cheat ? undefined : 'btn-press'}
        aria-label={`${label}${locked ? ` (${t('lg_locked')})` : done ? ` (${t('lg_done')})` : ''}`}
        style={{
          width: size, height: size, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: boss ? 36 : 28,
          background: face, ...depthBorder(locked ? C.border : edge, { width: 3, depth: 6, bottomColor: locked ? C.border : shade(edge, 30) }),
          cursor: locked && !cheat ? 'default' : 'pointer', opacity: locked ? 0.75 : 1,
          boxShadow: !locked && !done ? `0 0 0 6px color-mix(in srgb, ${face} 22%, transparent)` : undefined,
          animation: !locked && !done && !node.optional ? 'lgPulse 1.8s ease-in-out infinite' : undefined,
        }}>
        {boss
          ? <BossArt area={area} size={Math.round(size * 0.8)} locked={locked} />
          : <span style={{ filter: locked ? 'grayscale(1)' : 'none' }}>{locked ? '🔒' : KIND_ICON[node.kind] || '⭐'}</span>}
      </button>
      {done && <Stars n={node.stars} size={boss ? 16 : 13} />}
      {(node.flawless || node.allPower) && (
        <span style={{ display: 'flex', gap: 4, fontSize: 11, fontWeight: 900 }}>
          {node.flawless && <span className="tip" data-tip={t('lg_badgeFlawless')} style={{ color: C.warning }}>✨</span>}
          {node.allPower && <span className="tip" data-tip={t('lg_badgePower')} style={{ color: C.danger }}>💥</span>}
        </span>
      )}
      {node.kind === 'weak' && !locked && (
        // The reward, visible before it is earned: one extra life for this island's boss (once).
        <span className="tip" data-tip={area.bonusLife ? t('lg_weakEarnedTip') : t('lg_weakRewardTip')}
          style={{ fontSize: 12, fontWeight: 900, color: area.bonusLife ? C.success : C.warning, border: `2px solid ${area.bonusLife ? C.success : C.warning}`, borderRadius: RADIUS.pill, padding: '1px 8px', background: C.surface }}>
          💖 +1{area.bonusLife ? ' ✓' : ''}
        </span>
      )}
      <div style={{ fontSize: 12, fontWeight: 800, color: locked ? C.inkFaint : C.ink, maxWidth: 150, textAlign: 'center', lineHeight: 1.25 }}>
        {boss ? (area.bossName || t('lg_boss')) : label}{node.optional ? <span style={{ color: C.inkFaint, fontWeight: 700 }}> · {t('lg_optional')}</span> : null}
      </div>
      {cheat && (
        <CheatRow>
          {!done && <CheatButton tip={t('lg_cheatCompleteStep')} onClick={() => cheat.completeStep(area.id, node.id)}>⚡✓</CheatButton>}
          {(done || node.attempts > 0) && <CheatButton tip={t('lg_cheatResetStep')} onClick={() => cheat.resetStep(area.id, node.id)}>⚡↺</CheatButton>}
          {node.kind !== 'talk' && node.kind !== 'adventure' && <CheatButton tip={t('lg_cheatNewQuestions')} onClick={() => cheat.newQuestions(area.id, node.id)}>⚡🔄</CheatButton>}
        </CheatRow>
      )}
    </div>
  )
}

function AreaSection({ ctx, t, area, index, onOpen, onLegendary, preparing, refFor, stepRef, cheat }) {
  const colors = paletteColors(area.palette)
  const locked = area.status === 'locked'
  const nodes = area.nodes || []
  const done = nodes.filter((n) => !n.optional && n.status === 'done').length
  const total = nodes.filter((n) => !n.optional).length
  const nextStep = nodes.find((n) => !n.optional && n.status === 'open')
  return (
    <section ref={refFor} aria-label={area.title} style={{ display: 'flex', flexDirection: 'column-reverse', gap: 18, padding: '18px 0' }}>
      {/* column-reverse: the banner (first child) sits at the BOTTOM of the area, the boss at the top */}
      <div style={{ position: 'relative' }}>
        <AreaArt area={area} height={132} locked={locked} />
        <div style={{
          position: 'relative', margin: '-34px 16px 0', padding: '10px 14px', borderRadius: RADIUS.lg, background: C.surface,
          ...depthBorder(locked ? C.border : colors.deep, { bottomColor: locked ? C.border : shade(colors.deep) }),
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: locked ? C.inkFaint : colors.deep }}>{t('lg_areaN', { n: index + 1 })}</span>
            {area.status === 'done' && <span style={{ fontSize: 11.5, fontWeight: 800, color: C.warning }}>👑 {t('lg_areaDone')}</span>}
            {area.legendary && <span style={{ fontSize: 11.5, fontWeight: 800, color: C.purple }}>🏅 {t('lg_legendaryDone')}</span>}
            {locked && <span style={{ fontSize: 11.5, fontWeight: 800, color: C.inkFaint }}>🔒 {t('lg_locked')}</span>}
            {!locked && total > 0 && <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 800, color: C.inkDim }}>{t('lg_stepsDone', { i: done, n: total })}</span>}
          </div>
          <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 20, color: locked ? C.inkDim : C.ink, lineHeight: 1.2 }}>{area.title}</div>
          {area.theme && !locked && <div style={{ fontSize: 13, color: C.inkDim, lineHeight: 1.4 }}>{area.theme}</div>}
          {area.nemesis?.itemIds?.length > 0 && area.status !== 'done' && <div style={{ fontSize: 12.5, fontWeight: 800, color: C.danger, marginTop: 4 }}>👿 {t('lg_nemesisWaiting', { boss: area.bossName || t('lg_boss') })}</div>}
          <AreaExtras ctx={ctx} modeId={ctx.subject.modeId} area={area} />
          {area.status === 'done' && area.detailed && (
            // No key: disabled with the reason in its tip (it was active and said "needs a key" only after the click).
            <button type="button" onClick={() => onLegendary(area)} disabled={!ctx.ai.hasKey} className="tip" data-tip={ctx.ai.hasKey ? t('lg_legendaryTip') : t('lg_needKey')}
              style={{ marginTop: 8, fontFamily: FONT.body, fontWeight: 900, fontSize: 13, color: C.purple, background: 'transparent', border: `2px solid color-mix(in srgb, ${C.purple} 45%, transparent)`, borderRadius: RADIUS.pill, padding: '4px 12px', cursor: ctx.ai.hasKey ? 'pointer' : 'default', opacity: ctx.ai.hasKey ? 1 : 0.5 }}>
              🏅 {area.legendary ? t('lg_legendaryAgain') : t('lg_legendaryStart')}
            </button>
          )}
          {cheat && (
            <CheatRow style={{ justifyContent: 'flex-start', marginTop: 8 }}>
              {locked && <CheatButton onClick={() => cheat.unlockTo(area.id)}>⚡ {t('lg_cheatUnlock')}</CheatButton>}
              {area.status !== 'done' && <CheatButton onClick={() => cheat.completeArea(area.id)}>⚡ {t('lg_cheatCompleteArea')}</CheatButton>}
              {(area.frozen || area.status === 'done') && <CheatButton onClick={() => cheat.resetArea(area.id)}>⚡ {t('lg_cheatResetArea')}</CheatButton>}
              {area.detailed && <CheatButton onClick={() => cheat.regenArea(area.id)}>⚡ {t('lg_cheatRegenArea')}</CheatButton>}
              {!area.detailed && <CheatButton disabled={cheat.busy} onClick={() => cheat.detailNow(area.id)}>⚡ {t('lg_cheatDetailNow')}</CheatButton>}
            </CheatRow>
          )}
        </div>
      </div>
      {(!locked || cheat) && !area.detailed && (
        <div style={{ textAlign: 'center', color: C.inkDim, fontWeight: 700, fontSize: 14 }}>{preparing ? `⏳ ${t('lg_areaPreparing')}` : t('lg_areaWaiting')}</div>
      )}
      {(!locked || cheat) && area.detailed && nodes.map((n, i) => <StepButton key={n.id} cheat={cheat} t={t} area={area} node={n} index={i} colors={colors} onOpen={(node) => onOpen(area, node)} focusRef={stepRef && n === nextStep ? stepRef : undefined} />)}
    </section>
  )
}

// `cheat`: cheat mode's actions (LegendsScreen), or null when it is off.
export default function MapView({ ctx, map, learner, busy, error, onRetry, onOpen, onLegendary, onEdit, onRestart, onRaid, cheat = null }) {
  const { t, subject } = ctx
  const [passport, setPassport] = useState(false)
  const titleClick = useCheatToggle(ctx)
  const currentRef = useRef(null)
  const stepRef = useRef(null)
  const scrolled = useRef(false)
  const current = map.areas.findIndex((a) => a.status === 'open')
  // Center the current area inside the SCREEN's own scroll box: scrollIntoView also scrolled the page root
  // (the header left the window and a blank band stayed at the bottom).
  useEffect(() => {
    const el = stepRef.current || currentRef.current // the next step to take, else its area
    // Once per visit: to the area while its steps are still being made, then once more to the step itself.
    if (!el || scrolled.current === 'step' || (scrolled.current === 'area' && !stepRef.current)) return
    scrolled.current = stepRef.current ? 'step' : 'area'
    let box = el.parentElement
    while (box && !(/(auto|scroll)/.test(getComputedStyle(box).overflowY) && box.scrollHeight > box.clientHeight)) box = box.parentElement
    if (!box) return
    const z = (typeof ctx.getZoom === 'function' && ctx.getZoom()) || 1
    const r = el.getBoundingClientRect(); const b = box.getBoundingClientRect()
    box.scrollTop += (r.top - b.top - (b.height - Math.min(r.height, b.height)) / 2) / z
  })
  const p = mapProgress(map)
  const reversed = map.areas.map((a, i) => ({ a, i })).reverse()
  return (
    <div style={{ maxWidth: MAX_W, margin: '0 auto' }}>
      <style>{'@keyframes lgPulse { 0%,100% { transform: scale(1) } 50% { transform: scale(1.06) } } @media (prefers-reduced-motion: reduce) { [style*="lgPulse"] { animation: none !important } }'}</style>
      <div style={{ position: 'sticky', top: 0, zIndex: 2, padding: '8px 12px 10px', margin: '0 -12px', borderRadius: 16, background: `color-mix(in srgb, ${C.bg} 86%, transparent)`, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px', minWidth: 0 }}>
            <div onClick={titleClick} style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 26, color: C.ink, lineHeight: 1.1, userSelect: 'none' }}>🗺️ {t('lg_title')}{cheat ? ' ⚡' : ''}</div>
            <div style={{ fontSize: 13, color: C.inkDim, fontWeight: 700 }}>{subject.name} · {t('lg_progress', { a: p.areasDone, n: p.areasTotal })} · ⭐ {p.stars}</div>
          </div>
          <div style={{ flex: '0 1 220px' }}><LevelChip t={t} learner={learner} isLanguage={subject.isLanguage} /></div>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <Journey t={t} days={map.days} />
          {(map.helpers?.scroll > 0 || map.helpers?.shield > 0) && (
            <span className="tip" data-tip={t('lg_helpersTip')} style={{ fontSize: 13, fontWeight: 900, color: C.purple }}>
              {map.helpers.scroll > 0 ? `📜 ${map.helpers.scroll} ` : ''}{map.helpers.shield > 0 ? `🛡 ${map.helpers.shield}` : ''}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <ChunkyButton variant="ghost" color={C.purple} onClick={onEdit} disabled={!ctx.ai.hasKey} style={{ fontSize: 12, padding: '7px 12px' }}>✏️ {t('lg_changeMap')}</ChunkyButton>
          <ChunkyButton variant="ghost" color={C.success} onClick={() => setPassport(true)} style={{ fontSize: 12, padding: '7px 12px' }}>🛂 {t('lg_passport')}</ChunkyButton>
          {onRaid && <ChunkyButton variant="ghost" color={C.warning} onClick={onRaid} style={{ fontSize: 12, padding: '7px 12px' }}>⚔️ {t('lg_raid')}</ChunkyButton>}
          <ChunkyButton variant="ghost" color={C.danger} onClick={onRestart} style={{ fontSize: 12, padding: '7px 12px' }}>↺ {t('lg_restart')}</ChunkyButton>
        </div>
        {cheat && (
          <CheatRow style={{ justifyContent: 'flex-start', marginTop: 8 }}>
            <CheatButton onClick={cheat.setLevel}>⚡ {t('lg_cheatLevel')}</CheatButton>
            <CheatButton disabled={!ctx.ai.hasKey} onClick={cheat.placement}>⚡ {t('lg_cheatPlacement')}</CheatButton>
            <CheatButton onClick={cheat.assets}>⚡ {t('lg_cheatAssets')}</CheatButton>
          </CheatRow>
        )}
        {busy && <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: C.info }}>⏳ {busy}</div>}
        {error && (
          <div style={{ marginTop: 8, fontSize: 13, color: C.danger, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {error}<button onClick={onRetry} style={{ fontFamily: FONT.body, border: `1px solid ${C.danger}`, background: 'transparent', color: C.danger, borderRadius: RADIUS.sm, padding: '3px 10px', fontWeight: 800, cursor: 'pointer' }}>{t('lg_retry')}</button>
          </div>
        )}
      </div>
      {p.finished && (
        <div style={{ textAlign: 'center', padding: 16, fontFamily: FONT.display, fontWeight: 900, fontSize: 18, color: C.warning }}>🏆 {t('lg_mapFinished')}</div>
      )}
      {reversed.map(({ a, i }) => (
        <AreaSection key={a.id} ctx={ctx} cheat={cheat} t={t} area={a} index={i} onOpen={onOpen} onLegendary={(area) => onLegendary?.(area, { id: `${area.id}-legendary`, kind: 'legendary', title: '', itemIds: (area.items || []).map((x) => x.id) })} preparing={!!busy}
          refFor={i === current ? currentRef : undefined} stepRef={i === current ? stepRef : undefined} />
      ))}
      <div style={{ height: NODE.gap }} />
      {passport && <PassportModal ctx={ctx} map={map} onClose={() => setPassport(false)} />}
    </div>
  )
}
