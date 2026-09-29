# Legends art

The pictures of the Legends map. Nothing here is generated: edit or replace any file and the app uses it.

- `areas/<motif>.svg`: an area's banner, `viewBox="0 0 400 140"` (shown wide and cropped to fit).
- `bosses/<motif>.svg`: the area's boss, square, `viewBox="0 0 120 120"`.

The motifs are `forest`, `city`, `ocean`, `mountains`, `lab`, `stage`, `sky`, `desert`. When Ebi plans a map it
gives every area one of them, plus a color mood. A new motif needs both files and its name in `MOTIFS` in
`src/features/legends/map.js`.

## Colors

A file can use fixed colors, or these variables, which the app sets from the area's color mood and the light or dark
theme, so one drawing fits every area:

| Variable | Use |
|---|---|
| `--lg-sky` | background, lightest |
| `--lg-far` | far hills, buildings in the back |
| `--lg-near` | the ground in front |
| `--lg-deep` | the strongest shade: trees, outlines |
| `--lg-accent` | a second color: sun, lights, details |
| `--lg-light` | clouds, windows, highlights |

Always give a fallback, `fill="var(--lg-far, #9fd4ad)"`: that color shows when the file is opened on its own and for
any variable the app does not set (the bosses use `--lg-ink` for eyes that stay dark in both themes).

## Rules

Plain drawing only: shapes, paths, groups. No `<script>`, `<style>`, `<image>`, `<use>`, links, `url(...)` or event
attributes; the app strips them anyway, and `npm test` fails on them. Every motif needs both files.
