// Asset view (cheat mode only: 7 clicks on the map title). Two tabs: the Legends stages (boss + banner) and the raid
// bosses. Every drawing of ONE item at a time, in every place the app shows it: the entrance, the fight (full and
// compact), the map icon, locked, the banner on the map and whole, raid phases 1 to 3, then every palette. A strip
// picks one; ← and → step through them. Every drawing carries its file name UNDER it (ArtLabels): only here.
import { useEffect, useRef, useState } from 'react'
import { C, FONT, RADIUS } from '../../config/tokens'
import { ChunkyButton, Card } from '../ui'
import { AreaArt, ArtLabels, BossArt, LegendsArt, artUrl, BANNER, ArtMotion } from './art'
import { BossIntro, BossArena, BossStyle, BOSS, ABILITY_ICON } from './BossArena'
import { newFight } from './fight'
import { MOTIFS, PALETTES } from './map'
import { RAID, RAID_MOTIFS, RAID_ABILITY } from './raid'
import { RAID_VOICES } from './raidVoices'
import { bestiaryRows } from './abilities/_triggers'
import { floaterKeyFor, fxDemoFor } from './fx'

// Sample values for a floater that counts something ("+{n} heads"), so the asset view never shows a raw placeholder.
const demoVars = (ability, fx) => ({ n: 2, ...(fxDemoFor(ability, fx)?.fxVars || {}) })
import { SHRIMP, DEFAULT_SHRIMP, IDLE_SHRIMP, shrimpUrl } from '../../config/shrimp'
import { S } from '../../styles/theme'
import { platform } from '../../platform'
import { useNavEntry } from '../registry'
import BossFamilies from './BossFamilies' // EXPERIMENTAL boss families tab (removal list: families.js)
import { FAMILY_TREES } from './families'

// Raid bosses tab: which copies besides the entrance card and the phase demo arena animate. 'hover': the phase cells
// and fight-size copies show still and animate only while hovered or focused (each live raid boss costs about 5 ms a
// frame; the owner found copies animating after an ability Play confusing). 'always': all of them animate, as before.
const ASSET_RAID_ANIMATE_COPIES = 'hover'
const VIEW = { mapW: 620, mapH: 132, thumb: 56, paletteBoss: 72, paletteBannerW: 260, phase: 180, demoHp: 30 }
const TABS = [
  { id: 'legends', icon: '🗺️', labelKey: 'lg_assetsTabLegends', list: MOTIFS },
  { id: 'raids', icon: '⚔️', labelKey: 'lg_assetsTabRaids', list: RAID_MOTIFS },
  { id: 'ebi', icon: '🎨', labelKey: 'lg_assetsTabEbi', get list() { return EBI_DRAFTS.candidates.map((c) => c.id) } },
  { id: 'families', icon: '🌳', labelKey: 'lg_famTab', list: FAMILY_TREES.map((f) => f.id) }, // EXPERIMENTAL (families.js)
]

// Ebi drafts: original redrawn mascot candidates (public/assets/ebi-drafts/<candidate>/<emote>.svg), shown ONLY here so
// the owner can compare them with the current Ebi before deciding. Nothing else in the app reads these files.
const EBI_DRAFTS = {
  dir: '/assets/ebi-drafts',
  emote: 96,
  sizes: [46, 64, 128],
  emotes: ['default', 'happy', 'laughing', 'sad', 'crying', 'surprised', 'confused', 'idea', 'love', 'cool', 'sleep', 'book', 'camera', 'singer'],
  candidates: [
    { id: 'true-rim', nameKey: 'lg_ebiDraftName_trueRim', descKey: 'lg_ebiDraftDesc_trueRim', tone: 'green' },
    { id: 'true-gloss', nameKey: 'lg_ebiDraftName_trueGloss', descKey: 'lg_ebiDraftDesc_trueGloss', tone: 'green' },
    { id: 'true-depth', nameKey: 'lg_ebiDraftName_trueDepth', descKey: 'lg_ebiDraftDesc_trueDepth', tone: 'green' },
    { id: 'true-warm', nameKey: 'lg_ebiDraftName_trueWarm', descKey: 'lg_ebiDraftDesc_trueWarm', tone: 'green' },
    { id: 'true-soft', nameKey: 'lg_ebiDraftName_trueSoft', descKey: 'lg_ebiDraftDesc_trueSoft', tone: 'green' },
    { id: 'ebi-pop', nameKey: 'lg_ebiDraftName_ebiPop', descKey: 'lg_ebiDraftDesc_ebiPop', tone: 'red' },
    { id: 'ebi-swoop', nameKey: 'lg_ebiDraftName_ebiSwoop', descKey: 'lg_ebiDraftDesc_ebiSwoop', tone: 'red' },
    { id: 'ebi-bean', nameKey: 'lg_ebiDraftName_ebiBean', descKey: 'lg_ebiDraftDesc_ebiBean', tone: 'red' },
    { id: 'ebi-arc', nameKey: 'lg_ebiDraftName_ebiArc', descKey: 'lg_ebiDraftDesc_ebiArc', tone: 'red' },
    { id: 'ebi-spark', nameKey: 'lg_ebiDraftName_ebiSpark', descKey: 'lg_ebiDraftDesc_ebiSpark', tone: 'red' },
    { id: 'ebi-plum', nameKey: 'lg_ebiDraftName_ebiPlum', descKey: 'lg_ebiDraftDesc_ebiPlum', tone: 'yellow' },
    { id: 'ebi-comet', nameKey: 'lg_ebiDraftName_ebiComet', descKey: 'lg_ebiDraftDesc_ebiComet', tone: 'yellow' },
    { id: 'ebi-hop', nameKey: 'lg_ebiDraftName_ebiHop', descKey: 'lg_ebiDraftDesc_ebiHop', tone: 'yellow' },
    { id: 'ebi-mochi', nameKey: 'lg_ebiDraftName_ebiMochi', descKey: 'lg_ebiDraftDesc_ebiMochi', tone: 'yellow' },
    { id: 'ebi-knight', nameKey: 'lg_ebiDraftName_ebiKnight', descKey: 'lg_ebiDraftDesc_ebiKnight', tone: 'yellow' },
    { id: 'classic', nameKey: 'lg_ebiDraftName_classic', descKey: 'lg_ebiDraftDesc_classic' },
    { id: 'refined', nameKey: 'lg_ebiDraftName_refined', descKey: 'lg_ebiDraftDesc_refined' },
    { id: 'coral-belly', nameKey: 'lg_ebiDraftName_coralBelly', descKey: 'lg_ebiDraftDesc_coralBelly' },
    { id: 'cutie', nameKey: 'lg_ebiDraftName_cutie', descKey: 'lg_ebiDraftDesc_cutie' },
    { id: 'graceful', nameKey: 'lg_ebiDraftName_graceful', descKey: 'lg_ebiDraftDesc_graceful' },
    { id: 'sunset', nameKey: 'lg_ebiDraftName_sunset', descKey: 'lg_ebiDraftDesc_sunset' },
    { id: 'classic-round', nameKey: 'lg_ebiDraftName_classicRound', descKey: 'lg_ebiDraftDesc_classicRound' },
    { id: 'classic-sleek', nameKey: 'lg_ebiDraftName_classicSleek', descKey: 'lg_ebiDraftDesc_classicSleek' },
    { id: 'classic-soft', nameKey: 'lg_ebiDraftName_classicSoft', descKey: 'lg_ebiDraftDesc_classicSoft' },
    { id: 'classic-bold', nameKey: 'lg_ebiDraftName_classicBold', descKey: 'lg_ebiDraftDesc_classicBold' },
    { id: 'classic-glossy', nameKey: 'lg_ebiDraftName_classicGlossy', descKey: 'lg_ebiDraftDesc_classicGlossy' },
    { id: 'classic-warm', nameKey: 'lg_ebiDraftName_classicWarm', descKey: 'lg_ebiDraftDesc_classicWarm' },
    { id: 'classic-legs', nameKey: 'lg_ebiDraftName_classicLegs', descKey: 'lg_ebiDraftDesc_classicLegs' },
    { id: 'classic-expressive', nameKey: 'lg_ebiDraftName_classicExpressive', descKey: 'lg_ebiDraftDesc_classicExpressive' },
    { id: 'classic-banded', nameKey: 'lg_ebiDraftName_classicBanded', descKey: 'lg_ebiDraftDesc_classicBanded' },
    { id: 'chubby', nameKey: 'lg_ebiDraftName_chubby', descKey: 'lg_ebiDraftDesc_chubby' },
    { id: 'sleek', nameKey: 'lg_ebiDraftName_sleek', descKey: 'lg_ebiDraftDesc_sleek' },
    { id: 'sticker', nameKey: 'lg_ebiDraftName_sticker', descKey: 'lg_ebiDraftDesc_sticker' },
    { id: 'chibi', nameKey: 'lg_ebiDraftName_chibi', descKey: 'lg_ebiDraftDesc_chibi' },
    { id: 'mochi', nameKey: 'lg_ebiDraftName_mochi', descKey: 'lg_ebiDraftDesc_mochi' },
    { id: 'tall', nameKey: 'lg_ebiDraftName_tall', descKey: 'lg_ebiDraftDesc_tall' },
    { id: 'longtail', nameKey: 'lg_ebiDraftName_longtail', descKey: 'lg_ebiDraftDesc_longtail' },
    { id: 'bold', nameKey: 'lg_ebiDraftName_bold', descKey: 'lg_ebiDraftDesc_bold' },
    { id: 'geo', nameKey: 'lg_ebiDraftName_geo', descKey: 'lg_ebiDraftDesc_geo' },
    { id: 'cel', nameKey: 'lg_ebiDraftName_cel', descKey: 'lg_ebiDraftDesc_cel' },
    { id: 'pixel', nameKey: 'lg_ebiDraftName_pixel', descKey: 'lg_ebiDraftDesc_pixel' },
    { id: 'watercolor', nameKey: 'lg_ebiDraftName_watercolor', descKey: 'lg_ebiDraftDesc_watercolor' },
    { id: 'kawaii', nameKey: 'lg_ebiDraftName_kawaii', descKey: 'lg_ebiDraftDesc_kawaii' },
    { id: 'plush', nameKey: 'lg_ebiDraftName_plush', descKey: 'lg_ebiDraftDesc_plush' },
    { id: 'anime', nameKey: 'lg_ebiDraftName_anime', descKey: 'lg_ebiDraftDesc_anime' },
    { id: 'storybook', nameKey: 'lg_ebiDraftName_storybook', descKey: 'lg_ebiDraftDesc_storybook' },
    { id: 'tempura', nameKey: 'lg_ebiDraftName_tempura', descKey: 'lg_ebiDraftDesc_tempura' },
    { id: 'chef', nameKey: 'lg_ebiDraftName_chef', descKey: 'lg_ebiDraftDesc_chef' },
    { id: 'explorer', nameKey: 'lg_ebiDraftName_explorer', descKey: 'lg_ebiDraftDesc_explorer' },
    { id: 'lineart', nameKey: 'lg_ebiDraftName_lineart', descKey: 'lg_ebiDraftDesc_lineart' },
    { id: 'papercut', nameKey: 'lg_ebiDraftName_papercut', descKey: 'lg_ebiDraftDesc_papercut' },
    { id: 'gummy', nameKey: 'lg_ebiDraftName_gummy', descKey: 'lg_ebiDraftDesc_gummy' },
    { id: 'sumi', nameKey: 'lg_ebiDraftName_sumi', descKey: 'lg_ebiDraftDesc_sumi' },
  ],
}
const ebiDraftUrl = (c, e) => `${EBI_DRAFTS.dir}/${c}/${e}.svg`
// The picker: one button per variation ("Current", every draft set, then "All side by side"). One variation shows at a
// time; the choice is remembered per browser and falls back to Current when the stored set no longer exists.
const EBI_PICK_KEY = 'ebiki-ebi-draft-pick'
const EBI_CURRENT = 'current'
const EBI_ALL = 'all'
const ebiChoices = () => [EBI_CURRENT, ...EBI_DRAFTS.candidates.map((c) => c.id), EBI_ALL]
function readEbiPick() {
  const v = platform.kv.get(EBI_PICK_KEY)
  return v && ebiChoices().includes(v) ? v : EBI_CURRENT
}
function EbiDrafts({ t, stepRef }) {
  const [pick, setPickState] = useState(readEbiPick)
  const setPick = (id) => { setPickState(id); platform.kv.set(EBI_PICK_KEY, id) }
  // ← and → in the asset view step through the variations on this tab.
  if (stepRef) stepRef.current = (d) => {
    const list = ebiChoices()
    const i = Math.max(0, list.indexOf(pick))
    setPick(list[(i + d + list.length) % list.length])
  }
  const file = { fontSize: 11, color: C.inkFaint, fontFamily: 'monospace' }
  const h = { fontFamily: FONT.display, fontWeight: 900, fontSize: 16, color: C.ink }
  // An SVG shown as an <img> never runs scripts or loads anything else.
  const img = (c, e, px) => <img src={ebiDraftUrl(c, e)} alt="" width={px} height={px} draggable={false} style={{ display: 'block', width: px, height: px }} />
  const current = (f, px) => <img src={shrimpUrl(f)} alt="" width={px} height={px} draggable={false} style={{ display: 'block', width: px, height: px, objectFit: 'contain' }} />
  const head = (name, desc, path) => (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
      <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 22, color: C.brand }}>{name}</div>
      <div style={{ fontSize: 13.5, color: C.inkDim, fontWeight: 600, marginRight: 'auto' }}>{desc}</div>
      <span style={file}>{path}</span>
    </div>
  )
  const sizes = (render) => (
    <div style={{ display: 'grid', gap: 8 }}>
      <div style={h}>{t('lg_ebiDraftsSizes')}</div>
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        {EBI_DRAFTS.sizes.map((px) => (
          <div key={px} style={{ display: 'grid', gap: 4, justifyItems: 'center' }}>{render(px)}<span style={file}>{px} px</span></div>
        ))}
      </div>
    </div>
  )
  const tile = { display: 'grid', gap: 4, justifyItems: 'center', padding: 6, borderRadius: RADIUS.md, border: `2px solid ${C.border}`, background: C.surface }
  const grid = { display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${EBI_DRAFTS.emote + 16}px, 1fr))`, gap: 10 }
  // The Ebi the app uses today, at the same sizes, so every draft can be compared with it.
  const currentCard = () => (
    <Card key={EBI_CURRENT} style={{ display: 'grid', gap: 14, borderColor: C.brand }}>
      {head(t('lg_ebiCurrentName'), t('lg_ebiCurrentDesc'), '/assets/shrimp/')}
      {sizes((px) => current(DEFAULT_SHRIMP, px))}
      <div style={{ display: 'grid', gap: 8 }}>
        <div style={h}>{t('lg_ebiDraftsEmotes')}</div>
        <div style={grid}>
          {[{ name: 'default', file: DEFAULT_SHRIMP }, ...SHRIMP.filter((s, i, all) => all.findIndex((x) => x.file === s.file) === i)].map((s) => (
            <div key={s.name} style={tile}>
              {current(s.file, EBI_DRAFTS.emote)}
              <span style={file}>{s.name}{s.file === IDLE_SHRIMP ? ' (idle)' : ''}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
  const draftCard = (c) => (
    <Card key={c.id} style={{ display: 'grid', gap: 14 }}>
      {head(t(c.nameKey), t(c.descKey), `${EBI_DRAFTS.dir}/${c.id}/`)}
      {sizes((px) => img(c.id, 'default', px))}
      <div style={{ display: 'grid', gap: 8 }}>
        <div style={h}>{t('lg_ebiDraftsEmotes')}</div>
        <div style={grid}>
          {EBI_DRAFTS.emotes.map((e) => (
            <div key={e} style={tile}>
              {img(c.id, e, EBI_DRAFTS.emote)}
              <span style={file}>{e}.svg</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
  const label = (id) => id === EBI_CURRENT ? t('lg_ebiDraftsCurrent') : id === EBI_ALL ? t('lg_ebiDraftsAll') : t(EBI_DRAFTS.candidates.find((c) => c.id === id).nameKey)
  const chosen = EBI_DRAFTS.candidates.find((c) => c.id === pick)
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ fontSize: 13.5, color: C.inkDim, fontWeight: 600 }}>{t('lg_ebiDraftsIntro')}</div>
      <div role="radiogroup" aria-label={t('lg_ebiDraftsPick')} style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {ebiChoices().map((id) => {
          const on = id === pick
          // Newer drafts carry a tone (green, red, yellow) so they stand out; chosen, they get a stronger tint and a ring.
          const tone = EBI_DRAFTS.candidates.find((c) => c.id === id)?.tone
          const fresh = !!tone
          const accent = tone === 'green' ? C.success : tone === 'yellow' ? C.warning : C.brand
          return (
            <button key={id} type="button" role="radio" aria-checked={on} onClick={() => { if (!on) setPick(id) }}
              className={`ui-btn${on ? ' ui-tab-current' : ''}`}
              style={{ ...S.ghostBtn, fontSize: 12, padding: '6px 11px', cursor: on ? 'default' : 'pointer',
                color: on || fresh ? accent : C.inkDim, borderColor: on || fresh ? accent : C.border, fontWeight: on ? 800 : 700,
                background: on ? `color-mix(in srgb, ${accent} ${fresh ? 26 : 12}%, ${C.surface})`
                  : fresh ? `color-mix(in srgb, ${accent} 9%, ${C.surface})` : C.surface,
                ...(on && fresh ? { boxShadow: `0 0 0 2px ${accent}` } : {}) }}>
              {label(id)}
            </button>
          )
        })}
      </div>
      {pick === EBI_ALL ? <>{currentCard()}{EBI_DRAFTS.candidates.map((c) => draftCard(c))}</>
        : chosen ? draftCard(chosen) : currentCard()}
    </div>
  )
}

const Label = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: C.inkFaint }}>{children}</div>
)
const Cell = ({ label, children }) => <div style={{ display: 'grid', gap: 6, justifyItems: 'center' }}>{children}<Label>{label}</Label></div>
// A raid boss's story (lg_raidLore_<motif>) and its voice for a future boss dialogue (raidVoices.js: the sample line
// as a quote, the English persona prompt below it, labeled as text for the AI).
function RaidLore({ t, motif }) {
  const label = { fontSize: 11.5, fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase', color: C.inkDim }
  const quote = { margin: 0, paddingLeft: 12, borderLeft: `3px solid ${C.borderStrong}`, fontStyle: 'italic', lineHeight: 1.6, color: C.ink, overflowWrap: 'anywhere' }
  const voice = RAID_VOICES[motif]
  return (
    <section aria-label={t('lg_raidLoreTitle')} style={{ maxWidth: 640, minWidth: 0, display: 'grid', gap: 10 }}>
      <div>
        <div style={label}>{t('lg_raidLoreTitle')}</div>
        <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 20, color: C.ink }}>{t(`lg_raidBoss_${motif}`)}</div>
      </div>
      <p style={{ ...quote, fontSize: 14.5 }}>{t(`lg_raidLore_${motif}`)}</p>
      {voice && (
        <div style={{ display: 'grid', gap: 6 }}>
          <div style={label}>{t('lg_raidVoiceTitle')}</div>
          <blockquote aria-label={t('lg_raidVoiceSample')} style={{ ...quote, fontSize: 15, fontWeight: 700, borderLeftColor: C.purple }}>“{voice.sample}”</blockquote>
          <div style={{ fontSize: 11, fontWeight: 800, color: C.inkFaint }}>{t('lg_raidVoiceNote')}</div>
          <div style={{ fontSize: 12.5, lineHeight: 1.5, color: C.inkDim, overflowWrap: 'anywhere' }}>{voice.persona}</div>
        </div>
      )}
    </section>
  )
}

// A raid boss as the fight shows it in a phase: the arena's own rules switch the lg-p1/p2/p3/p12 layers.
const RaidPhase = ({ motif, palette, phase, size, animate = true }) => (
  <div className="lg-boss" data-phase={phase}><LegendsArt kind="raids" motif={motif} palette={palette} height={size} width={size} round={0} animated={animate ? 'idle' : false} phase={phase} /></div>
)
// A still copy that animates while hovered or focused (ASSET_RAID_ANIMATE_COPIES).
function LiveCopy({ children }) {
  const [live, setLive] = useState(false)
  if (ASSET_RAID_ANIMATE_COPIES === 'always') return children(true)
  const on = () => setLive(true)
  const off = () => setLive(false)
  return <div tabIndex={0} onMouseEnter={on} onMouseLeave={off} onFocus={on} onBlur={off} style={{ lineHeight: 0 }}>{children(live)}</div>
}
// The fight arena with a button that deals a third of the health: every press plays the phase change (flash, shake,
// "PHASE N" tag) the real raid shows. After the last phase it starts over at full health.
// The ability card's "Try it" buttons play that ability's effect and floater on this same arena (`shot`, held by the
// page: { motif, fx, n }), to check them without a real fight.
function PhaseDemo({ t, area, motif, getZoom, shot, onClearShot }) {
  const [step, setStep] = useState(0)
  const third = VIEW.demoHp / RAID.phases
  const damage = Math.min(VIEW.demoHp - 1, Math.round(step * third))
  const ability = RAID_ABILITY[motif]
  const mine = shot && shot.motif === motif ? shot : null
  const fxLast = mine && { kind: 'hit', damage: 3, lives: 0, ...(fxDemoFor(ability, mine.fx) || {}), fx: mine.fx, n: mine.n }
  const state = { ...newFight(), damage, last: fxLast || (step ? { kind: 'hit', damage: Math.round(third), lives: 0, n: step } : null) }
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <BossArena key={motif} t={t} area={area} name={motif} need={VIEW.demoHp} lives={RAID.lives} state={state} phases={RAID.phases} ability={ability} getZoom={getZoom} kind="raids" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <ChunkyButton variant="ghost" color={C.danger} onClick={() => { onClearShot(); setStep((n) => (n + 1) % RAID.phases) }} style={{ fontSize: 12, padding: '6px 10px' }}>⚔️ {t('lg_assetsNextPhase')}</ChunkyButton>
      </div>
    </div>
  )
}

// A raid boss's ability as a BESTIARY entry (the owner: "think about asset viewer like a potential future bestiary"):
// name and icon, the one-line rule, then "How it works", one row per effect: the words that pop over the boss, what
// the player does to set it off, what it does, a "your choice" tag on a button effect, and "Try it" (plays it on the
// demo arena above). The texts come from abilities/_triggers.js with the module's own numbers; triggers.test.js proves
// every row does what it says; the rows come from bestiaryRows (pure). Each ability module names its own effects (fxKeys),
// so boss agents never edit this file.
function AbilityCard({ t, motif, ability, onTry }) {
  if (!ability) return <div style={{ fontSize: 13.5, color: C.inkDim }}>{t('lg_assetsNoAbility')}</div>
  const label = { fontSize: 11.5, fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase', color: C.purple }
  const rows = bestiaryRows(motif, ability)
  return (
    <section aria-label={t('lg_assetsAbility')} style={{ maxWidth: 640, minWidth: 0, padding: '14px 18px', borderRadius: RADIUS.lg, display: 'grid', gap: 12,
      border: `3px solid ${C.purple}`, background: `color-mix(in srgb, ${C.purple} 12%, ${C.surface})` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 34, lineHeight: 1 }}>{ABILITY_ICON[ability]}</span>
        <div>
          <div style={label}>{t('lg_assetsAbility')}</div>
          <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 22, color: C.ink }}>{t(`lg_ability_${ability}`)}</div>
        </div>
      </div>
      <div style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.5, color: C.ink }}>{t(`lg_abilityDesc_${ability}`)}</div>
      <div style={{ display: 'grid', gap: 6 }}>
        <div style={label}>{t('lg_bestiaryHow')}</div>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
          {rows.map(({ fx, tr }) => (
            <li key={fx} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '8px 10px', borderRadius: RADIUS.md, background: C.surface, border: `1px solid ${C.border}` }}>
              <div style={{ flex: '0 0 128px', minWidth: 0, display: 'grid', gap: 3, justifyItems: 'start', overflowWrap: 'anywhere' }}>
                <span style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 15, color: C.purple, lineHeight: 1.15 }}>{t(floaterKeyFor(ability, fx) || `lg_fx_${fx}`, demoVars(ability, fx))}</span>
                {tr.choice && <span style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: '.04em', textTransform: 'uppercase', color: C.warning, padding: '1px 6px', borderRadius: RADIUS.sm, border: `1px solid color-mix(in srgb, ${C.warning} 45%, transparent)` }}>{t('lg_bestiaryYourChoice')}</span>}
              </div>
              <div style={{ flex: '1 1 220px', minWidth: 0, fontSize: 13.5, lineHeight: 1.45 }}>
                <div style={{ fontWeight: 800, color: C.ink }}>{t(tr.whenKey, tr.vars)}</div>
                <div style={{ fontWeight: 600, color: C.inkDim }}>{t(tr.doesKey, tr.vars)}</div>
              </div>
              <ChunkyButton variant="ghost" color={C.purple} onClick={() => onTry(fx)} style={{ flex: '0 0 auto', fontSize: 12, padding: '5px 10px' }}>▶ {t('lg_bestiaryTry')}</ChunkyButton>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

const ASSET_SCROLL_SETTLE_MS = 250 // a restored scroll position is set again once the tab's drawings are laid out

export default function AssetView({ ctx, onBack }) {
  const { t } = ctx
  const [tab, setTab] = useState('legends')
  const [idx, setIdx] = useState(0)
  const [shot, setShot] = useState(null) // the ability effect last played on the demo arena: { motif, fx, n }
  const [palette, setPalette] = useState(PALETTES[0])
  const [replay, setReplay] = useState(0)
  const { list } = TABS.find((x) => x.id === tab)
  const raids = tab === 'raids'
  const motif = list[Math.min(idx, list.length - 1)]
  const area = { id: motif, title: motif, motif, palette }
  const ebiStepRef = useRef(null)
  const go = (d) => tab === 'ebi' ? ebiStepRef.current?.(d) : setIdx((i) => (i + d + list.length) % list.length)
  // Opens at the top: the screen's scroll box still held the map's position.
  const rootRef = useRef(null)
  const scrollBox = () => {
    let box = rootRef.current?.parentElement
    while (box && !/(auto|scroll)/.test(getComputedStyle(box).overflowY)) box = box.parentElement
    return box
  }
  useEffect(() => {
    const box = scrollBox()
    if (box) box.scrollTop = 0
  }, [])
  // Back / Forward (src/nav): every tab change is an entry (Boss families → a boss → Back = the families again, at the
  // same scroll position); stepping through one tab's list only updates the entry.
  const pendingScroll = useRef(null)
  const { remember } = useNavEntry('legends.assetsTab', tab, (to, memo) => {
    setTab(to); setReplay(0)
    pendingScroll.current = typeof memo?.scroll === 'number' ? memo.scroll : null
  }, { guard: (to) => (TABS.some((x) => x.id === to) ? true : 'skip') })
  useNavEntry('legends.assetsIdx', idx, (to) => setIdx(Number(to) || 0), { replace: true })
  const keepScroll = () => { const box = scrollBox(); if (box) remember({ scroll: box.scrollTop }) }
  useEffect(() => {
    const y = pendingScroll.current
    if (y == null) return
    pendingScroll.current = null
    // The tab's drawings mount over a few frames: set it now and again once they are laid out.
    const put = () => { const box = scrollBox(); if (box) box.scrollTop = y }
    put()
    const raf = requestAnimationFrame(() => requestAnimationFrame(put))
    const late = setTimeout(put, ASSET_SCROLL_SETTLE_MS)
    return () => { cancelAnimationFrame(raf); clearTimeout(late) }
  }, [tab])
  const pickTab = (id) => { keepScroll(); setTab(id); setIdx(0); setReplay(0) }

  // The key handler is installed once; it calls the CURRENT step function (the list changes with the tab).
  const goRef = useRef(go)
  goRef.current = go
  useEffect(() => {
    const on = (e) => {
      if (e.defaultPrevented || e.altKey || /input|textarea|select/i.test(e.target?.tagName || '')) return // Alt+Left is Back
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
    <ArtMotion.Provider value>
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

      {tab === 'families' ? <BossFamilies t={t} onOpen={(to, m) => { keepScroll(); setTab(to); setIdx(Math.max(0, TABS.find((x) => x.id === to).list.indexOf(m))); setReplay(0); const box = scrollBox(); if (box) box.scrollTop = 0 }} /> : tab === 'ebi' ? <EbiDrafts t={t} stepRef={ebiStepRef} /> : <>
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

        {raids && (
          <div style={section}>
            <div style={h}>{t('lg_assetsPhases')}</div>
            <div style={{ maxWidth: 640 }}><PhaseDemo t={t} area={area} motif={motif} getZoom={ctx.getZoom} shot={shot} onClearShot={() => setShot(null)} /></div>
          </div>
        )}
        {raids && <AbilityCard t={t} motif={motif} ability={RAID_ABILITY[motif]} onTry={(fx) => setShot((x) => ({ motif, fx, n: 1000 + ((x && x.n) || 0) + 1 }))} />}
        {raids && <RaidLore t={t} motif={motif} />}

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
            <div style={row}>
              {Array.from({ length: RAID.phases }, (_, i) => (
                <Cell key={i} label={t('lg_assetsPhase', { n: i + 1 })}><LiveCopy>{(on) => <RaidPhase motif={motif} palette={palette} phase={i + 1} size={VIEW.phase} animate={on} />}</LiveCopy></Cell>
              ))}
            </div>
            <div style={row}>
              <Cell label={t('lg_assetsFight', { px: BOSS.arena })}><LiveCopy>{(on) => <RaidPhase motif={motif} palette={palette} phase={1} size={BOSS.arena} animate={on} />}</LiveCopy></Cell>
              <Cell label={t('lg_assetsFight', { px: BOSS.arenaCompact })}><LiveCopy>{(on) => <RaidPhase motif={motif} palette={palette} phase={1} size={BOSS.arenaCompact} animate={on} />}</LiveCopy></Cell>
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
      </>}
    </div>
    </ArtLabels.Provider>
    </ArtMotion.Provider>
  )
}
