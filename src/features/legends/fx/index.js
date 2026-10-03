// RAID ABILITY EFFECTS REGISTRY. One file per raid boss: fx/<motif>.jsx (the same motif as abilities/<motif>.js),
// picked up by the glob below; nobody edits this index. Files starting with "_" (the shared kit, the HUD) are skipped.
//
// THE FX CONTRACT: fx/<motif>.jsx default-exports
//   effects      { <fxKey>: () => JSX }   the overlay drawn over the boss box for about a second when the strike's
//                                         last.fx is that key (helpers and base keyframes: fx/_kit.jsx). Every key in
//                                         the ability's fxKeys needs one (abilityfx.test.js).
//   floaters     { <fxKey>: 'lg_fx_...' } the i18n key of the word that pops over the boss ("Sever!"); it gets the
//                                         strike's last.fxVars as vars. Every fxKey needs one.
//   floaterTone  { <fxKey>: 'info' }      optional floater color (a theme tone: purple when not named).
//   css          '...'                    optional CSS, always injected while this boss is in the arena:
//                                         - the character REACTION: a class `.lgr-<motif>-<fxKey>` that BossArena puts
//                                           on the boss art box while that fx plays (its juice size), e.g.
//                                           `.lgr-hydra-sever { animation: lgrHydraRecoil 700ms ease-out both }` with
//                                           its @keyframes (names start with lgr<Boss>, unique app-wide);
//                                         - CSS for parts inside the boss SVG's fx layers (`.lgfa-*` classes), keyed
//                                           on `.lg-boss[data-fx="<key>"]`, and for state layers on data-ab-*.
//                                         BossArena already shows `.lg-fx-<key>` layers (and hides `.lg-fxh-<key>`)
//                                         while data-fx="<key>", and `.lg-ab-<name>-<value>` layers (hiding
//                                         `.lg-abh-<name>-<value>`) while data-ab-<name>="<value>".
//   demo         { <fxKey>: { kind, damage, lives, ab? } }   optional: how the asset view's replay button fakes that
//                                         strike (default { kind: 'hit', damage: 3, lives: 0 }); `ab` = the ability
//                                         state right after it, so the art's data-ab-* layers show the result.
//   juice        { <fxKey>: { size, shake, flash, hitstop, sfx } }   how hard each moment hits (fx/_juice.js has the
//                                         format and the numbers). BossArena plays shake, flash and hit-stop ONCE from
//                                         this data, and `size` sets how long data-fx and the reaction class stay on:
//                                         tick 350 ms, medium 800 ms, big 1200 ms. A key with no entry plays as 'big'
//                                         with no shake, flash or hit-stop (the v1 behaviour).
//   Hud          optional React component ({ t, state, ctx, compact }) drawn after the generic HUD items, for a
//                                         widget the generic item types cannot show.
// REACTIONS PER PHASE: one reaction class `.lgr-<motif>-<fxKey>` per fx key; its CSS may be phase-qualified
//   (`.lg-boss[data-phase="3"] .lgr-titan-shatter { ... }`). Face layers (`.lg-fx-<key>` / `.lg-fxh-<key>`) live
//   INSIDE the SVG's phase groups (lg-p1, lg-p2, lg-p3 or lg-p12; art.test.js checks it), so data-phase + data-fx pick
//   the right face with the generated rules. A tick plays the body nudge only (no face layer).
// PERSISTENT IDLE REACTIONS (only IDLE_MOTIFS: the Dreamer's sleep drift): the module's
//   idle(s, ctx) returns a key and BossArena keeps `.lgr-<motif>-idle-<key>` on an inner box while it holds (slow and
//   small; off with the other reactions). artStyle goes on the innermost box, so a scale composes with the hit, the
//   lunge, the reaction and the idle drift.
// Effects and reactions are skipped in focus mode, with Still bosses and under reduced motion (unless "Always animate
// the art"); state layers (data-ab-*) always show: a static change is not an animation.
import { abilityById } from '../abilities'
import { juiceOf } from './_juice'

const files = import.meta.glob(['./*.jsx', '!./_*.jsx'], { eager: true })

const byMotif = {}
for (const [file, mod] of Object.entries(files)) {
  const d = mod && mod.default
  if (!d || typeof d !== 'object') continue
  byMotif[file.replace(/^\.\//, '').replace(/\.jsx$/, '')] = d
}

export const FX_BY_MOTIF = byMotif
export const fxForMotif = (motif) => byMotif[motif] || null
export const fxForAbility = (ability) => {
  const a = abilityById(ability)
  return a ? fxForMotif(a.motif) : null
}

// The effect for `fx`, from this ability's file first (two bosses may use the same key), else any file.
export function effectFor(ability, fx) {
  const own = fxForAbility(ability)
  if (own) return (own.effects && own.effects[fx]) || null
  for (const d of Object.values(byMotif)) if (d.effects && d.effects[fx]) return d.effects[fx]
  return null
}
export function floaterKeyFor(ability, fx) {
  const own = fxForAbility(ability)
  if (own) return (own.floaters && own.floaters[fx]) || ''
  for (const d of Object.values(byMotif)) if (d.floaters && d.floaters[fx]) return d.floaters[fx]
  return ''
}
export const floaterToneFor = (ability, fx) => fxForAbility(ability)?.floaterTone?.[fx] || ''
// How hard `fx` hits for this ability (its fx file's juice entry, normalized; see fx/_juice.js).
export const juiceFor = (ability, fx) => juiceOf(fxForAbility(ability)?.juice?.[fx])
export const fxDemoFor = (ability, fx) => fxForAbility(ability)?.demo?.[fx] || null

const safe = (v) => String(v).replace(/[^\w-]/g, '')

// The CSS the arena needs for this boss: its fx file's css, plus the generated layer rules (fx layers for every fx
// key it can fire, state layers for the data-ab-* values it shows right now).
export function abilityCss(ability, artAttrs) {
  const a = abilityById(ability)
  if (!a) return ''
  const fx = fxForMotif(a.motif)
  const out = []
  for (const k0 of a.fxKeys || []) {
    const k = safe(k0)
    out.push(`.lg-boss[data-fx="${k}"] .lg-fx-${k} { display: inline !important } .lg-boss[data-fx="${k}"] .lg-fxh-${k} { display: none !important }`)
  }
  for (const [attr, v0] of Object.entries(artAttrs || {})) {
    if (!/^data-ab-[\w-]+$/.test(attr)) continue
    const name = attr.slice('data-ab-'.length)
    const v = safe(v0)
    out.push(`.lg-boss[${attr}="${v}"] .lg-ab-${name}-${v} { display: inline !important } .lg-boss[${attr}="${v}"] .lg-abh-${name}-${v} { display: none !important }`)
  }
  if (fx && fx.css) out.push(fx.css)
  return out.join('\n')
}
