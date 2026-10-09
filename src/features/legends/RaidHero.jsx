// THE RAID HERO: the Practice hub's big card for today's raid (the practiceHero slot). Today's boss in its own art,
// number, ability, the siege's health with its carried wounds, the player's carried hearts, the cards due and the runs
// they make, and a Fight button that opens the normal raid
// (RaidTile). READ ONLY: the stored raid and the due count are read once per visit (and again after a raid is saved
// or Anki comes back); nothing here ever writes raid state. The hub paints a skeleton first and never waits on it.
import { useEffect, useRef, useState } from 'react'
import { C, FONT, RADIUS } from '../../config/tokens'
import { srs } from '../../cards'
import { useFeatureCtx, featureCfg } from '../registry'
import { tCount } from '../ui'
import { LegendsArt, reducedMotion, useArtStill, useArtMotionAlways, headroomPx } from './art'
import { ABILITY_ICON } from './BossArena'
import { RaidBand, BAND_CSS } from './RaidBand'
import { impactFor } from './impact/styles'
import { RAID, todayKey, raidBossNumber, raidRunSize } from './raid'
import { raidHeroState, raidTint } from './heroState'
import { readRaid, onRaidSaved, LEGENDS_ID } from './store'

export const HERO = { art: 148, artNarrow: 120, wrapBelow: 560 } // px
const STAGE = `color-mix(in srgb, ${C.bg} 22%, black)` // the raid stage is dark in both themes (like the raid intro)

const CSS = `
@keyframes rhGlowLo { 0%,100% { opacity: 1 } 50% { opacity: 0 } }
@keyframes rhGlowHi { 0%,100% { opacity: 0 } 50% { opacity: 1 } }
@keyframes rhAura { 0%,100% { transform: scale(1); opacity: .55 } 50% { transform: scale(1.08); opacity: .9 } }
@keyframes rhShimmer { 0% { opacity: .35 } 50% { opacity: .7 } 100% { opacity: .35 } }
.rh-calm, .rh-calm * { animation: none !important }
`
// The card's ring and glow, calm and at the top of the pulse (`mix` tints a share of the boss's color).
const GLOWS = [
  [(mix) => `0 0 0 2px ${mix(35)}, 0 6px 26px ${mix(22)}`, 'rhGlowLo'],
  [(mix) => `0 0 0 2px ${mix(75)}, 0 8px 40px ${mix(55)}`, 'rhGlowHi'],
]

export default function RaidHero({ onOpen }) {
  const ctx = useFeatureCtx()
  const modeId = ctx?.subject?.modeId
  const deck = ctx?.subject?.modeDeck || ctx?.subject?.deck || ''
  const anki = ctx ? ctx.ankiConnected !== false && !!deck : false
  const [stored, setStored] = useState(undefined) // undefined = still reading; null = never fought
  const [due, setDue] = useState(null) // the due note ids; null = counting, NaN = the count failed
  const [saves, setSaves] = useState(0)
  const boxRef = useRef(null)
  const [narrow, setNarrow] = useState(false)
  useEffect(() => onRaidSaved(() => setSaves((n) => n + 1)), [])
  // The stored raid: which boss waits, today's wounds and tries. A failed read still shows the card (as a fresh raid).
  useEffect(() => {
    let live = true
    setStored(undefined)
    readRaid(modeId).then((r) => { if (live) setStored(r?.ok ? r.value || null : null) }).catch(() => { if (live) setStored(null) })
    return () => { live = false }
  }, [modeId, saves])
  // The due cards the fight would use: one per note (findNotes), like RaidRun; notes a raid answered today are left out
  // by raidHeroState. Cheap: one query, no card info.
  useEffect(() => {
    let live = true
    setDue(null)
    if (!anki) return undefined
    srs.findNotes({ deck, state: 'due', excludeSuspended: true, excludeBuried: true })
      .then((ids) => { if (live) setDue(Array.isArray(ids) ? ids : NaN) })
      .catch(() => { if (live) setDue(NaN) })
    return () => { live = false }
  }, [anki, deck, modeId, saves])
  // Stacks the art above the text when the card itself is narrow (the hub column, not the window).
  useEffect(() => {
    const el = boxRef.current
    if (!el || typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(() => setNarrow(el.clientWidth < HERO.wrapBelow))
    ro.observe(el)
    return () => ro.disconnect()
  }, [stored === undefined]) // eslint-disable-line react-hooks/exhaustive-deps

  const still = useArtStill()
  const always = useArtMotionAlways()
  if (!ctx) return null
  const { t } = ctx
  const focus = featureCfg(ctx, LEGENDS_ID).focus === true
  const calm = still || focus || (!always && reducedMotion())

  if (stored === undefined) return <Skeleton boxRef={boxRef} t={t} />

  const s = raidHeroState({ stored, date: todayKey(), dueIds: Array.isArray(due) ? due : null, due: Array.isArray(due) ? null : due, anki, hasKey: !!ctx.ai?.hasKey, runSize: raidRunSize(featureCfg(ctx, LEGENDS_ID).raidRunSize) })
  const beaten = s.kind === 'beaten'
  const shownMotif = beaten && s.beaten ? s.beaten : s.motif
  const tint = raidTint(shownMotif, C.danger)
  const ready = s.kind === 'ready' || s.kind === 'unknown'
  const pulse = s.kind === 'ready' && !calm
  const name = t(`lg_raidBoss_${shownMotif}`)
  const artSize = narrow ? HERO.artNarrow : HERO.art
  const mix = (pct, other = 'transparent') => `color-mix(in srgb, ${tint} ${pct}%, ${other})`

  const status = (() => {
    if (beaten) return { icon: '🏆', text: t('lg_raidHeroBeaten'), sub: t('lg_raidHeroNext', { n: s.num }) }
    if (s.kind === 'anki') return { icon: '🔌', text: t('lg_raidNoDeck') }
    if (s.kind === 'nokey') return { icon: '🔑', text: t('lg_raidNoKey') }
    if (s.kind === 'counting') return { icon: '⏳', text: t('lg_raidHeroCounting') }
    if (s.kind === 'unknown') return { icon: '❔', text: t('lg_raidHeroUnknown') }
    if (s.kind === 'none') return { icon: '🌙', text: t('lg_raidHeroNone') }
    if (s.kind === 'few') return { icon: '🌙', text: tCount(t, 'lg_raidHeroFew', s.due, { min: RAID.minCards }) }
    return {
      icon: '⚔️',
      text: `${tCount(t, 'lg_raidHeroDue', s.due)} · ${tCount(t, 'lg_raidHeroRuns', s.runs)}`,
      sub: s.due > s.uses ? t('lg_raidHeroUses', { n: s.uses }) : '',
    }
  })()

  return (
    <div data-practice-hero="raid" data-lg-idle="" className={calm ? 'rh-calm' : undefined} style={{ position: 'relative', marginBottom: 20 }}>
      {/* The pulse: two glow layers OUTSIDE the clipped card, the calm and the bright glow, cross-fading their opacity.
          Animating the card's own box-shadow repainted the whole card every frame (about 450 style recalcs a second
          while the Practice hub sat idle); opacity runs on the compositor. */}
      {pulse && GLOWS.map(([shadow, anim]) => (
        <div key={anim} aria-hidden="true" style={{ position: 'absolute', inset: 0, borderRadius: RADIUS.xl, pointerEvents: 'none',
          boxShadow: shadow(mix), willChange: 'opacity', animation: `${anim} 2.6s ease-in-out infinite` }} />
      ))}
    <div ref={boxRef} style={{
      position: 'relative', borderRadius: RADIUS.xl, overflow: 'hidden', color: C.white,
      background: `radial-gradient(ellipse at ${narrow ? '50% 30%' : '22% 55%'}, ${mix(beaten ? 18 : 42, STAGE)} 0%, ${STAGE} 70%)`,
      boxShadow: pulse ? 'none' : GLOWS[0][0](mix),
    }}>
      <style>{CSS}</style>
      {/* The warning band, like the raid intro's, in this boss's own colors. */}
      <style>{BAND_CSS}</style>
      <div aria-hidden="true" style={{ position: 'relative', height: 26, overflow: 'hidden', display: 'grid', placeItems: 'center' }}>
        <RaidBand main={impactFor(shownMotif).color || tint} deep={impactFor(shownMotif).accent} calm={!pulse} height={26} label={t('lg_raidTile')} />
      </div>
      <div style={{ display: 'flex', flexWrap: narrow ? 'wrap' : 'nowrap', justifyContent: 'center', alignItems: 'center', gap: narrow ? 4 : 18, padding: narrow ? '6px 16px 20px' : '6px 26px 20px 12px' }}>
        {/* The boss, in phase 1, idle (still under Still bosses, focus mode and reduced motion: LegendsArt decides). */}
        <div style={{ position: 'relative', flex: '0 0 auto', width: artSize + headroomPx(artSize) * 2, height: artSize + headroomPx(artSize) * 2, display: 'grid', placeItems: 'center' }}>
          <div aria-hidden="true" style={{ position: 'absolute', inset: headroomPx(artSize) * 0.4, borderRadius: '50%', background: `radial-gradient(circle, ${mix(beaten ? 20 : 55)} 0%, transparent 68%)`, animation: pulse ? 'rhAura 2.6s ease-in-out infinite' : 'none' }} />
          <div style={{ position: 'relative', ...(beaten ? { filter: 'grayscale(.65) brightness(.8)', transform: 'rotate(-7deg)' } : {}) }}>
            <LegendsArt kind="raids" motif={shownMotif} palette="night" height={artSize} width={artSize} round={0} room animated="idle" phase={1} />
          </div>
          {beaten && <span aria-hidden="true" style={{ position: 'absolute', right: headroomPx(artSize) * 0.6, bottom: headroomPx(artSize) * 0.6, fontSize: 40, filter: `drop-shadow(0 3px 6px ${mix(60, 'black')})` }}>🏆</span>}
        </div>
        <div style={{ flex: narrow ? '1 1 100%' : '1 1 auto', minWidth: 0, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 8, textAlign: narrow ? 'center' : 'left', justifyItems: narrow ? 'center' : 'start' }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 13, letterSpacing: '.12em', textTransform: 'uppercase', color: mix(55, C.white) }}>
            {t('lg_raidHeroNum', { n: raidBossNumber(shownMotif), total: s.total })}
          </div>
          <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: narrow ? 26 : 30, lineHeight: 1.05, color: C.white, marginTop: -4,
            textShadow: `0 0 18px ${mix(70)}, 0 3px 0 ${mix(55, 'black')}` }}>{name}</div>
          {!beaten && s.ability && (
            <div style={{ fontSize: 13.5, lineHeight: 1.4, fontWeight: 700, padding: '6px 12px', borderRadius: RADIUS.md, maxWidth: 520,
              background: mix(16, 'black'), border: `1.5px solid ${mix(45)}` }}>
              <span style={{ fontFamily: FONT.display, fontWeight: 900, color: mix(45, C.white) }}>{ABILITY_ICON[s.ability]} {t(`lg_ability_${s.ability}`)}</span>
              <span style={{ opacity: 0.92 }}>{t('ui_labelSep')}{t(`lg_abilityLine_${s.ability}`)}</span>
            </div>
          )}
          {!beaten && s.beatenToday && <div style={{ fontSize: 13, fontWeight: 800, color: mix(45, C.white) }}>🏆 {t('lg_raidHeroBeatenToday', { name: t(`lg_raidBoss_${s.beatenToday}`) })}</div>}
          {!beaten && s.healthKnown && (s.attempts > 0 || s.damage > 0 || (s.kind !== 'none' && s.kind !== 'few')) && <Health t={t} s={s} tint={tint} narrow={narrow} />}
          {!beaten && <SiegeRow t={t} s={s} narrow={narrow} />}
          <div style={{ display: 'grid', gap: 2 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.white }}>{status.icon} {status.text}</div>
            {status.sub && <div style={{ fontSize: 13, fontWeight: 700, color: `color-mix(in srgb, ${C.white} 70%, transparent)` }}>{status.sub}</div>}
          </div>
          {!beaten && s.kind !== 'none' && s.kind !== 'few' && (
            <button type="button" className="duo-cta btn-press" disabled={!ready} onClick={() => ready && onOpen?.()}
              style={{ marginTop: 4, fontSize: 17, padding: narrow ? '12px 18px' : '12px 34px', minWidth: 'min(190px, 100%)', maxWidth: '100%', overflowWrap: 'anywhere' }}>
              ⚔️ {t('lg_bossFight')}
            </button>
          )}
        </div>
      </div>
    </div>
    </div>
  )
}

// The siege's health: what is left of the boss's full health, the wounds of earlier runs and days as the missing part.
function Health({ t, s, tint, narrow }) {
  const pct = s.hp > 0 ? Math.max(0, Math.min(100, (s.left / s.hp) * 100)) : 0
  return (
    <div style={{ width: '100%', maxWidth: narrow ? 360 : 420, display: 'grid', gap: 4 }}>
      <div role="meter" aria-valuemin={0} aria-valuemax={s.hp} aria-valuenow={s.left} aria-label={t('lg_raidHeroHealth', { left: s.left, max: s.hp })}
        style={{ height: 12, borderRadius: RADIUS.pill, background: `color-mix(in srgb, ${C.white} 14%, transparent)`, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: RADIUS.pill, transition: 'width .4s ease',
          background: `linear-gradient(90deg, ${C.danger}, color-mix(in srgb, ${tint} 60%, ${C.danger}))` }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12.5, fontWeight: 700, color: `color-mix(in srgb, ${C.white} 78%, transparent)` }}>
        <span>🩸 {t('lg_raidHeroHealth', { left: s.left, max: s.hp })}</span>
        <span>{s.attempts > 0 ? tCount(t, 'lg_raidHeroTries', s.attempts) : s.damage > 0 ? t('lg_raidHeroCarried') : t('lg_raidHeroFresh')}</span>
      </div>
    </div>
  )
}

// The carried hearts (lost ones greyed) and the daily rule of the siege.
function SiegeRow({ t, s, narrow }) {
  const dim = `color-mix(in srgb, ${C.white} 78%, transparent)`
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 12px', justifyContent: narrow ? 'center' : 'flex-start', fontSize: 12.5, fontWeight: 700, color: dim }}>
      <span role="img" aria-label={t('lg_raidHeroHearts', { n: s.hearts, max: s.heartsMax })} style={{ display: 'inline-flex', gap: 2, fontSize: 16 }}>
        {Array.from({ length: s.heartsMax }, (_, i) => <span key={i} aria-hidden="true" style={{ filter: i >= s.hearts ? 'grayscale(1) opacity(.35)' : 'none' }}>❤️</span>)}
      </span>
      <span>🏰 {t('lg_raidSiegeLine', { n: s.heal })}</span>
    </div>
  )
}

// While the stored raid is read: the card's frame, so the hub never jumps.
function Skeleton({ boxRef, t }) {
  const bar = (w, h = 14) => <div style={{ width: w, maxWidth: '100%', height: h, borderRadius: RADIUS.pill, background: `color-mix(in srgb, ${C.white} 14%, transparent)`, animation: 'rhShimmer 1.4s ease-in-out infinite' }} />
  return (
    <div ref={boxRef} aria-busy="true" aria-label={t('lg_raidTile')} style={{ borderRadius: RADIUS.xl, overflow: 'hidden', marginBottom: 20, background: STAGE, minHeight: 236 }}>
      <style>{CSS}</style>
      <div style={{ height: 26, background: `color-mix(in srgb, ${C.danger} 25%, black)` }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 24, padding: '22px 26px' }}>
        <div style={{ width: HERO.artNarrow, height: HERO.artNarrow, borderRadius: '50%', background: `color-mix(in srgb, ${C.white} 10%, transparent)`, animation: 'rhShimmer 1.4s ease-in-out infinite' }} />
        <div style={{ flex: '1 1 220px', display: 'grid', gap: 12 }}>{bar(140, 12)}{bar(260, 26)}{bar(340)}{bar(200, 40)}</div>
      </div>
    </div>
  )
}
