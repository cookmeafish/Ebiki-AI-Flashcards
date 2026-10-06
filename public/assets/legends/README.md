# Legends art

The Legends and raid pictures. Nothing here is generated at runtime: edit or replace a file and the app uses it. The
full art direction (what bosses and banners must look like, how to animate them) is `docs/legends-art-guide.md`; read
its "The owner's top rules, in short" before redrawing a boss, and for raid bosses its "Raid boss voices" section (a
redesign updates the boss's lore and voice too).

- `areas/<motif>.svg`: an area's banner, the boss's lair, `viewBox="0 0 400 140"` (shown wide, cropped to fit).
- `bosses/<motif>.svg`: the area's boss, square, `viewBox="0 0 120 120"`.
- `raids/<motif>.svg`: a raid boss, square, with phase layers `lg-p2`/`lg-p3` (starting `style="display:none"`),
  `lg-p1` (phase 1 only) and `lg-p12` (gone in phase 3). The `ophanim-*.webp` files are the ophanim's photo sprites.

40 Legends motifs, listed with boss, entrance and lair in `dev/legends-gallery/catalog.js` (by name in `MOTIFS` in
`src/features/legends/map.js`). When Ebi plans a map it gives every area one of them, plus a palette. A new motif
needs both files, its name in `MOTIFS`, its own entrance in `ENTRANCES` (`src/features/legends/BossArena.jsx`) and a
catalog entry.

To see and rate them all: `npm run dev`, then open `http://localhost:3000/dev/legends-gallery/`. Before committing
an art change, run `node dev/legends-gallery/check-art.mjs` with the dev server up.

## Colors

Every drawing is painted in its OWN ideal colors (fixed hex; the palette "original" shows exactly that). An area's
palette recolors only ONE part of each boss (its fire, gems, aura, a cape), chosen so the boss still looks right in
any palette. That part, in the boss file AND its banner (raid bosses: in every phase layer), uses these variables,
each with the ideal color as fallback:

| Variable | Use |
|---|---|
| `--lg-tint` | the part's main color |
| `--lg-tint-hi` | its lit side and highlights |
| `--lg-tint-lo` | its shade |

`fill="var(--lg-tint, #3fd0ff)"`: the fallback shows in "original" and when the file is opened alone. Outlines use
`var(--lg-ink, #1d2230)` (never set, dark in both themes). The old `--lg-sky/far/near/deep/accent/light` are retired
(`art.test.js` fails on them and on a file with no tinted part).

## Motion

Only `<animateTransform>` and `<animateMotion>` (translate, scale, rotate). Mark each `class="lg-in"` (entrance,
played once) or `class="lg-loop"` (idle, repeating). The file without animation must be the finished pose: the app
shows it still on the map, for locked areas and with reduced motion.

## Rules

Plain drawing only: shapes, paths, groups. No `<script>`, `<style>`, `<image>`, `<use>`, links, `url(...)` (so no
gradients or filters), `id`s, `<animate>`, `<set>` or event attributes; the app strips them, and `npm test` fails on
them.

**Realistic opt-in** (`REALISTIC_ART` in `src/features/legends/art.jsx`, today only `raids/ophanim.svg`): a listed
file may hold a `<defs>` of linear/radial gradients (also `clipPath`/`mask`) with `id`s, used through `url(#id)`.
Every reference stays inside the file, every `var()` keeps its fallback (also in `stop-color`), one part stays
tinted, and no `<filter>` (the sanitizer strips filter primitives, and an empty filter hides what uses it). The app
gives each mounted copy its own ids. Every other file keeps the rules above.
