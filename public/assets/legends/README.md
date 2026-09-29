# Legends art

The pictures of the Legends map. Nothing here is generated while the app runs: edit or replace any file and the app
uses it. The full art direction (what the bosses and banners must look like, and how to animate them) is in
`docs/legends-art-guide.md`.

- `areas/<motif>.svg`: an area's banner, the boss's lair, `viewBox="0 0 400 140"` (shown wide and cropped to fit).
- `bosses/<motif>.svg`: the area's boss, square, `viewBox="0 0 120 120"`.

There are 40 motifs, listed with their boss, entrance and lair in `dev/legends-gallery/catalog.js` (and by name in
`MOTIFS` in `src/features/legends/map.js`). When Ebi plans a map it gives every area one of them, plus a color mood.
A new motif needs both files, its name in `MOTIFS`, its own entrance in `ENTRANCES` in
`src/features/legends/BossArena.jsx`, and a catalog entry.

To look at all of them at once (and note what is good or bad): `npm run dev`, then open
`http://localhost:3000/dev/legends-gallery/`.

## Colors

A file can use fixed colors, or these variables, which the app sets from the area's color mood and the light or dark
theme, so one drawing fits every area:

| Variable | Use |
|---|---|
| `--lg-sky` | background, lightest |
| `--lg-far` | far hills, buildings in the back |
| `--lg-near` | the ground in front |
| `--lg-deep` | the strongest shade: bodies, trees, outlines |
| `--lg-accent` | a second color: sun, lights, details |
| `--lg-light` | clouds, windows, highlights (dark in dark mode) |

Always give a fallback, `fill="var(--lg-far, #9fd4ad)"`: that color shows when the file is opened on its own and for
any variable the app does not set (`--lg-ink` for outlines stays dark in both themes).

## Motion

Only `<animateTransform>` and `<animateMotion>` (translate, scale, rotate). Mark each one `class="lg-in"` (a boss's
entrance, played once) or `class="lg-loop"` (idle life, repeating). The drawing without any animation must be the
finished pose: the app shows it still on the map, for locked areas and with reduced motion.

## Rules

Plain drawing only: shapes, paths, groups. No `<script>`, `<style>`, `<image>`, `<use>`, links, `url(...)`
(so no gradients or filters), `id`s, `<animate>`, `<set>` or event attributes; the app strips them anyway, and
`npm test` fails on them. Every motif needs both files.
