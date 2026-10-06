# UI overhaul (2026-10): design direction

The reference for how Ebiki looks. It lives in shared layers (tokens, palettes, global classes, `S.*`,
`src/features/ui.jsx`, the shell), so a screen picks it up without its own styling. When a screen needs something
new, add it to a shared layer first.

## Principles
1. **Depth, not lines.** Surfaces are separated by soft layered shadows and a 1px hairline, not 2px outlines. Thick
   borders stay only where they mean something (the selected choice, a pressable 3D CTA).
2. **One focus color.** Ebi's red (`--c-brand`) marks what is current or primary, as an accent, never a wash.
   Everything else is neutral ink on calm surfaces; semantic colors (success, warning, danger, info, purple) mean
   status, never decoration.
3. **Calm chrome, lively content.** Header, sidebar and rail are quiet glass and tints; the content and Ebi carry the
   personality. No glow, halo or colored radial behind or around Ebi.
4. **Feedback by light, never by movement.** Hover raises a shadow or tints a surface; nothing moves under the
   cursor. Only `.btn-press` moves, on `:active`.
5. **Both themes are first class.** Every value is a palette variable; light-mode semantic colors stay DEEPER than
   dark mode's (green and amber must stay distinct at small sizes).

## Palette roles (`src/config/palette.js`, `PALETTE_CSS`)
| Role | Variable | Light (Ocean Light) | Dark |
|---|---|---|---|
| Page | `--c-bg` | `#F4F6F8` | `#0A0E13` |
| Ambient tints | `--c-bg-grad1/2` | brand 2.5% / teal 3.5% | brand 3.5% / teal 4.5% |
| Card | `--c-surface` | `#FFFFFF` | `#121A21` |
| Raised (popover, active segment) | `--c-surface-raised` | `#FFFFFF` | `#18222B` |
| Inset (tracks, inputs on cards) | `--c-surface-sunken` | `#F3F5F7` | `#0D1419` |
| Segmented / chip ground | `--c-surface-alt` | `#EDF0F3` | `#19232C` |
| Hairline | `--c-border` | `#E3E7EB` | `#212D37` |
| Strong line | `--c-border-strong` | `#CBD2D9` | `#33424E` |
| Text | `--c-ink` / `-dim` / `-faint` | `#101820` / `#4A5866` / `#788693` | `#EAF0F4` / `#A6B4BF` / `#71838F` |
| Brand | `--c-brand` | `#DF2540` | `#FF4D63` |
| Brand accents | `--c-brand-tint` / `--c-brand-line` (`C.brandTint`, `C.brandRing`) | theme-tuned | theme-tuned |
| Solid ink | `--c-ink-solid` / `--c-on-ink` (`C.inkSolid`, `C.onInk`) | near black | near white |
| Hover tint | `--c-hover` | ink at 5% | white at 6% |

`ink-dim` on surface is above 6:1 in both themes; `ink-faint` (about 3.4:1) is for captions and icons, never the only
copy of important text. Solid ink is the second voice: the learner's chat bubbles, the session count pill,
Discover's level badge.

## Tokens (`src/config/tokens.js`)
- **Elevation** (`--sh-*`, `SHADOW.*`): layered, a tight contact shadow plus a wide ambient one. `sm` resting
  controls and chips · `card` resting cards (dark mode adds the inset top highlight `--sh-hi`, so cards read as lit
  from above) · `md` hovered cards, dropdowns · `lg` popovers, raised panels, heroes · `xl` modals · `brand` / `glow`
  the primary CTA and the current item (both short and faint). `SHADOW.hi` is the highlight alone, `SHADOW.ring` the
  focus ring.
- **Radius** (`RADIUS`): `sm 8` chips · `md 12` buttons and inputs · `lg 20` cards · `xl 28` heroes and modals ·
  `pill`.
- **Type** (`FONT`, `TYPE`): Baloo 2 display, Nunito body. `hero 32` · `h1 26` · `h2 20` · `h3 16` · `body 14` ·
  `small 12.5` · `micro 11`; `tight -0.01em` for display text, `eyebrow .08em` for the 11px uppercase eyebrow labels
  (the only uppercase besides the 3D CTAs; navigation and labels are sentence case).
- **Motion** (`MOTION`, CSS `--ease-out` / `--ease-spring`): `fast 140` hovers, `base 200` panels, `slow 320`
  entrances. Spring only for pops. Animate shadow, background, border color, color and opacity, never position on
  hover. `prefers-reduced-motion: reduce` turns the `.ui-*` transitions and the modal pop off; the Legends art has
  its own switches.

Icons: drawn SVG nav icons (`public/assets/nav`) at 24 to 28px, emoji as fallbacks and inside content, a 12px gap
in icon + label rows. Density: 8px grid, cards pad 16 to 20, screens 24 (16 on narrow windows), lists keep 44px rows.

## Building blocks
- **Global classes** (App.jsx `<style>`, block `UI overhaul 2026-10`): `.ui-card` (resting card surface),
  `.ui-lift` (hover elevation for a card, tile or clickable panel: `card` to `md`, stronger hairline), `.ui-hero`
  (raised 24px-corner hero panel; a `.duo-bubble` inside goes sunken), `.ui-halo` (round centering wrapper for Ebi,
  deliberately with no background), `.ui-glass`, `.ui-eyebrow`, `.ui-pop` (modal pop-in), `.ui-chunky`. Older
  shared classes: `.duo-title`, `.duo-bubble`, `.duo-cta` (+ `.green`), `.duo-tile` (+ `.brand`), `.ui-tab`,
  `.btn-press`, `.card-head`, `.click-dim`. Every button, link, `[role=button]`, `[role=radio]` and `summary` shows a
  2px brand outline on `:focus-visible`.
- **`S.*`** (`src/styles/theme.js`): `S.screenTitle` (30px display heading) and `S.panel` (surface, hairline,
  `RADIUS.lg`, `SHADOW.card`, 18 x 20 padding) are the screen title and the card.
- **`src/features/ui.jsx`**: `Card` (`.ui-card`, `.ui-lift` when clickable), `ChunkyButton` (flat face, pressable
  bottom edge, its shadow from `.ui-chunky`), `ProgressBar` (inset track, gradient fill), `Modal` (blurred backdrop,
  `.ui-pop`), `EbiSays`.
- **Shell**: glass header with a hairline; sidebar rows in sentence case, the current one a raised row with a 3px red
  marker (`inset 3px 0 0 var(--c-brand)`, also the current Settings pane and the open chat); rail without a divider.

## Second pass: a layout per screen
Each core screen got its own layout; every handler, ref, guard and i18n key is unchanged (elements were moved and
restyled, never re-implemented). The layouts live in ONE class block in App.jsx's `<style>` (marked `UI second
pass`), so a screen reverts by deleting its classes.

- **Page head** (`.ui-page-head`, `.ui-page-title`, `.ui-page-sub`, `.ui-eyebrow-brand`, `.ui-page`): a brand eyebrow
  (the mode name) over a big left-aligned title. Study pick, Deck, Discover, Stats, Batch results.
- **CTAs** (`.duo-cta`, `ChunkyButton`, `S.captureBtn`): flat faces with the pressable edge, no gradient or glow.
- **Rating colors**: Easy green, Good BLUE (`--c-info`; red read as "wrong"), Hard amber, Again red, shared by the
  summary tiles, graded stripes and `.rate-chip` (`--tone`).
- Feature screens (Ebi Call, Roleplay, Scenes, game) use 1px hairlines; 2px only means "selected".

| Screen | Layout | Classes |
|---|---|---|
| Study home | Split hero: eyebrow, title, tagline, CTA left; big Ebi right; stacks under 640px | `.sh-hero`, `.sh-art`, container `shome` |
| Live question | Slim progress bar, a session bar (count pill, state pills, quiet tools), then the question card (hero answer field with the submit inside, hairline toolbar) beside Ebi's companion card (a row above the card under 700px) | `.st-stage` (container `ststage`), `.st-bar`, `.st-progress`, `.st-pill`, `.st-grid`, `.st-card`, `.st-q`, `.st-answer`, `.st-submit`, `.st-tools`, `.st-tool`, `.st-companion`, `.st-keys`, `.ui-kbd` |
| Learn it | Same card; 28px headword; the gate uses the hero answer field | `.st-answer` |
| Graded list / Batch results | Cards with a rating stripe and a rating chip | `.gr-card[data-rating]`, `.rate-chip` |
| Summary | Reward card: Ebi celebrates (unless a third or more were Again), the count as hero, a split bar of the four ratings, four tiles | `.sum-wrap`, `.sum-hero`, `.sum-count`, `.sum-split`, `.sum-tiles`, `.sum-tile` |
| Chat | Slim session drawer, messages centered at 880px, ink user bubbles, card-style replies, a floating composer | `.ch-composer`, `.ch-mascot`, container `chcol` |
| Deck | Page head; picker, search, filters and tools in one sticky blurred strip; ONE list with hairline rows | `.dk-sticky`, `.dk-list` |
| Discover | The suggestion is the top card of a stack, the term in 36px display type | `.dc-stack`, `.dc-card` |
| Picture (idle) | One dashed drop zone, three ways in as tiles | `.pc-drop`, `.pc-methods`, `.pc-method` |
| Picture (analysis) | The picture with the reading panel as a sticky side inspector; stacked under 760px | `.pc-stage`, `.pc-split`, `.pc-reading` |
| Stats | Dashboard grid: KPI tiles, the 14-day chart beside the per-deck list, sessions full width | `.stx-grid`, `.stx-kpi`, `.stx-span*`, container `stx` |
| Onboarding | Full-screen flow on the app canvas, a segmented step bar, footer with a step count | inline |
| Settings | 220px nav with raised current row | inline |

### Layout rules
- Media queries see the REAL viewport, but content is laid out at viewport / app zoom (`--app-zoom`, user-set) minus
  the sidebar: use container queries (`container: name / inline-size`) for screen layouts. `getBoundingClientRect()`
  answers in real px.
- `.duo-cta` carries `max-width: 100%` (a `minWidth` CTA overflowed narrow heroes).
- The header's left group wraps (`S.headerLeft`), so a narrow window never scrolls sideways.

### Not restyled yet
Legends and the fight screens, the Quick Add tray rows, the duplicate and bulk-edit review cards, the Picture word
tooltip and Help's header. The question dots and usage chips keep their old sizes.

## How to revert
The overhaul is one change set (the 1.32.0 commit). The main lever is the palette and token block:
1. `src/config/palette.js` (`PALETTE_CSS`): every color and shadow value; restoring it restores most of the look.
2. `src/config/tokens.js`: `RADIUS`, `SHADOW` (`card`, `glow`, `hi`), `TYPE`, `MOTION`.
3. App.jsx global `<style>`: the `UI overhaul 2026-10` block (`.ui-*` classes, focus ring), the `UI second pass`
   block, the hover tint and the `.duo-*` rules.
4. `src/styles/theme.js`, `src/features/ui.jsx`, `src/shell/Sidebar.jsx`, `src/shell/Rail.jsx`.
`git diff` of that commit against its parent lists every other touched line.
