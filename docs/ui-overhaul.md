# UI overhaul (2026-10): design direction

The reference for how Ebiki looks. Everything here is implemented in shared layers (tokens, palettes, global
classes, `S.*`, `src/features/ui.jsx`, the shell), so a screen picks it up without its own styling. When a screen
needs something new, add it to a shared layer first.

## Principles
1. **Depth, not lines.** Surfaces are separated by soft layered shadows and a 1px hairline, not by thick 2px
   outlines. Thick borders stay only where they mean something (the selected choice, a pressable 3D CTA).
2. **One focus color.** Ebi's red (`--c-brand`) marks what is current or primary. Everything else is neutral ink on
   calm surfaces; semantic colors (success, warning, danger, info, purple) mean status, never decoration.
3. **Calm chrome, lively content.** Header, sidebar and rail are quiet glass and tints so the screen's content and
   Ebi carry the personality.
4. **Feedback by light, never by movement.** Hover raises a shadow or tints a surface; nothing moves under the
   cursor. Only `.btn-press` moves, on `:active`.
5. **Both themes are first class.** Every value is a palette variable; light-mode semantic colors stay DEEPER than
   dark mode's (green and amber must stay distinct at small sizes).

## Palette roles (`src/config/palette.js`)
| Role | Variable | Light (Ocean Light) | Dark (Deep Sea) |
|---|---|---|---|
| Page | `--c-bg` | cool off white `#F3F6FA` | blue black `#0A0F14` |
| Ambient tints | `--c-bg-grad1/2` | brand / teal at 7% | brand / teal at 10% / 8% |
| Card | `--c-surface` | `#FFFFFF` | `#121A21` |
| Raised (popover, active segment) | `--c-surface-raised` | `#FFFFFF` | `#18222B` |
| Inset (tracks, inputs on cards) | `--c-surface-sunken` | `#F1F5F8` | `#0D1419` |
| Segmented / chip ground | `--c-surface-alt` | `#ECF0F5` | `#19232C` |
| Hairline | `--c-border` | `#E2E8EE` | `#212D37` |
| Strong line | `--c-border-strong` | `#C9D3DC` | `#33424E` |
| Text | `--c-ink` / `-dim` / `-faint` | `#111C24` / `#4B5C68` / `#7A8B98` | `#EAF0F4` / `#A6B4BF` / `#6F8290` |
| Brand | `--c-brand` | `#DF2540` | `#FF4D63` |
| Hover tint | `--c-hover` | ink at 5% | white at 6% (dark lightens, never muddies) |

Contrast: `ink-dim` on surface is above 6:1 in both themes; `ink-faint` (about 3.4:1) is for captions and icons,
never for the only copy of important text.

## Elevation (`--sh-*`, `SHADOW.*`)
Layered: a tight contact shadow plus a wide ambient one, tinted with the page ink (light) or pure black (dark).
- `sm` resting controls and chips · `card` resting cards (sm + a top highlight `--sh-hi`) · `md` hovered cards,
  dropdowns · `lg` popovers, raised panels · `xl` modals · `brand` / `glow` colored CTAs and the current item.
- Dark mode adds an inset top highlight (`--sh-hi`) so cards read as lit from above instead of as flat holes.
- Hover elevation: a card or tile with `.ui-lift` goes from `card` to `md` and tints its hairline toward brand.

## Radius (`RADIUS`)
`sm 8` chips and small controls · `md 12` buttons and inputs · `lg 18` cards · `xl 24` modals and hero panels ·
`pill` segmented controls, badges.

## Typography (`FONT`, `TYPE`)
Baloo 2 for display, Nunito for everything else. Display text is tight (`letter-spacing: -0.01em`).
Scale (`TYPE` in tokens.js): `hero 32` · `h1 26` · `h2 20` · `h3 16` · `body 14` · `small 12.5` · `micro 11`.
Navigation and labels are sentence case (no shouting uppercase); uppercase is kept for tiny eyebrow labels (11px,
`letter-spacing .08em`) and the 3D CTAs.

## Motion (`MOTION`, CSS `--ease-*`)
- `fast 140ms` hovers, `base 200ms` panels, `slow 320ms` screen entrances. Ease out `cubic-bezier(.2,.8,.2,1)`;
  spring `cubic-bezier(.34,1.56,.64,1)` only for pops.
- Animated: shadow, background, border color, color, opacity. Never position on hover.
- `prefers-reduced-motion: reduce` turns the overhaul's own transitions and entrance animations off (`.ui-*`
  classes, the modal pop). The Legends art has its own switches and is untouched.

## Iconography
Drawn SVG nav icons (`public/assets/nav`) at 24 to 28px; emoji stay as fallbacks and inside content. Icon plus
label rows align on a 12px gap.

## Density
8px grid. Cards pad 16 to 20, screens 24 (16 on narrow windows, the phone gutter). Lists keep 44px rows.

## Building blocks
- **Global classes** (App.jsx `<style>`): `.ui-card` (resting card surface), `.ui-lift` (hover elevation for a
  card, tile or clickable panel; buttons with it skip the generic hover tint), `.ui-glass`, `.duo-title`,
  `.duo-bubble`, `.duo-cta` (+ `.green`), `.duo-tile` (+ `.brand`), `.ui-tab`, `.btn-press`, `.card-head`,
  `.click-dim`. Focus: every button, link and `[role=button]` shows a 2px brand ring on `:focus-visible`.
- **`src/features/ui.jsx`**: `Card` (`.ui-card`, `.ui-lift` when clickable), `ChunkyButton` (gradient face, 3D
  edge, colored glow), `ProgressBar` (inset track, gradient fill), `Modal` (blurred backdrop, pop-in), `EbiSays`.
- **Shell**: glass header with a hairline, sidebar rows in sentence case with a brand pill for the current screen,
  rail without a divider (its cards float).

## How to revert
The overhaul is one change set. The main lever is the palette and token block:
1. `src/config/palette.js` (`PALETTE_CSS`): every color and shadow value. Restoring the old block restores most of
   the look by itself.
2. `src/config/tokens.js`: `RADIUS`, `SHADOW` (new `card`, `glow`, `hi` keys), `TYPE`, `MOTION`.
3. App.jsx global `<style>`: the block marked `UI overhaul` (classes `.ui-card`, `.ui-lift`, focus ring, hover
   tint) and the restyled `.duo-*` rules.
4. `src/styles/theme.js`, `src/features/ui.jsx`, `src/shell/Sidebar.jsx`, `src/shell/Rail.jsx`.
`git diff` of the overhaul commit against its parent lists every other touched line (a handful of screen fixes).

## Second pass (2026-10): new layouts, red as an accent
The first pass made the same Duolingo-style layout cleaner. The second pass gives each core screen its own layout and
turns Ebi's red from a wash into an accent. Every handler, ref, guard and i18n key is unchanged: elements were moved
and restyled, never re-implemented. The new layouts live in ONE block of classes in App.jsx's global `<style>`
(marked `UI second pass`), so a screen can be reverted by deleting its classes.

### Identity
- **Red is an accent, not a wash.** No pink gradients or colored glows on surfaces: the current sidebar row, the
  current Settings pane and the open chat are a raised white (dark: lifted) row with a 3px red marker
  (`inset 3px 0 0 var(--c-brand)`). `--sh-brand` / `--sh-glow` are short and faint; `.duo-cta`, `ChunkyButton` and
  `S.captureBtn` are flat faces with the pressable bottom edge (no gradient, no glow).
- **Ink as the second voice.** New tokens `--c-ink-solid` / `--c-on-ink` (`C.inkSolid`, `C.onInk`): near black in
  light, near white in dark. Used for the learner's own chat bubbles (Chat tab and Help), the session counter pill and
  Discover's level badge. `--c-brand-tint` / `--c-brand-line` (`C.brandTint`, `C.brandRing`) are theme-tuned.
- **Corners:** one family, `RADIUS` 8 / 12 / 20 / 28 (cards 20, heroes and modals 28). Neutral 2px borders on feature
  screens (Ebi Call, Roleplay, Scenes, game) are 1px hairlines now; 2px stays only where it means "selected".
- **Page head** (`.ui-page-head`, `.ui-page-title`, `.ui-eyebrow-brand`): a brand eyebrow (the mode name) over a big
  Baloo title, left aligned. Used by Study pick, Deck, Discover, Stats, Batch results.
- **Rating colors:** Easy green, Good BLUE (`--c-info`; it was brand red, which read as "wrong"), Hard amber, Again
  red. Shared by the summary tiles, graded stripes and rating chips (`.rate-chip`, `--tone`).

### Screens
| Screen | Layout | Classes |
|---|---|---|
| Study home | Split hero: eyebrow, 48px title, tagline, CTA left; big Ebi right; stacks under 640px | `.sh-hero`, container `shome` |
| Study pick | Left page head with Ebi, one sectioned card, actions right-aligned under it | inline |
| Live question | Slim progress bar on top, a session bar (ink count pill, active, new/learn/due pills, quiet tool buttons), then a grid: the question card (22px question, the answer field as a hero with the submit inside it, a hairline toolbar) and Ebi's companion card (Ebi on a soft disc, Ask Ebi, keyboard hints). Under 700px the companion becomes a row above the card | `.st-stage` (container `ststage`), `.st-bar`, `.st-progress`, `.st-pill`, `.st-grid`, `.st-card`, `.st-q`, `.st-answer`, `.st-submit`, `.st-tools`, `.st-tool`, `.st-companion`, `.st-keys`, `.ui-kbd` |
| Learn it | Same card; the headword is a 28px display line; the gate uses the hero answer field (green when typed right) | `.st-answer` |
| Graded list / Batch results | Cards with a rating stripe on the left and a rating chip (the select is a chip too) | `.gr-card[data-rating]`, `.rate-chip` |
| Summary | Reward card: Ebi celebrates (`party` pose unless a third or more were Again), the count as the hero, a split bar of the four ratings, "N% remembered", four tinted tiles; insights and Done under it | `.sum-wrap`, `.sum-hero`, `.sum-count`, `.sum-split`, `.sum-tiles`, `.sum-tile` |
| Chat | Slim session drawer (`clamp(168px, 24%, 240px)`), messages centred at 880px, ink user bubbles, card-style replies, a floating composer with round + and search buttons; Ebi beside replies shrinks under 600px | `.ch-composer`, `.ch-mascot`, container `chcol` |
| Deck | Page head; picker, search, filters and the tool row ride in one sticky blurred strip; tools are neutral chips with colored labels; the cards are ONE list with hairline rows | `.dk-sticky`, `.dk-list` |
| Discover | Page head with Ebi; the suggestion is the top card of a stack (two ghost cards behind), the term in 36px display type, Make card as the solid action | `.dc-stack`, `.dc-card` |
| Picture (idle) | One dashed drop zone, three ways in as tiles with tinted icon squares (keyboard operable) | `.pc-drop`, `.pc-methods`, `.pc-method` |
| Picture (analysis) | The picture with the reading panel as a sticky side inspector; stacked under 760px. Reading lines wrap (`dir="auto"` keeps RTL order) | `.pc-stage`, `.pc-split`, `.pc-reading` |
| Stats | Dashboard grid: three KPI tiles, the 14-day chart (neutral bars, today in red) beside the per-deck list, sessions full width | `.stx-grid`, `.stx-kpi`, `.stx-span*`, container `stx` |
| Onboarding | Full-screen flow on the app canvas (opaque, no blurred app), a segmented step bar on top, footer with a hairline and a step count | inline |
| Settings | 220px nav with raised current row, roomier content column | inline |

### Layout rules learned here
- Media queries see the REAL viewport, but content is laid out at `vw / 1.35` (body zoom) minus the sidebar: use
  container queries (`container: name / inline-size`) for screen layouts, and remember `getBoundingClientRect()`
  answers in real px (a 1105px box is 818 CSS px).
- `.duo-cta` carries `max-width: 100%`: a `minWidth` CTA overflowed narrow heroes.
- The header's left group wraps (`S.headerLeft`), so a narrow window no longer scrolls sideways.

### Still untouched (next candidates)
The Practice hub, Legends and every fight screen (owned elsewhere), the Quick Add review tray rows (the panel itself
is restyled), the duplicate and bulk-edit review cards, the Picture word tooltip and Help's header. The question
card's per-question dots and usage chips kept their old sizes. Deck row actions are now quiet text buttons (Del in
red).
