# Bake sweep: does the sprite-rig bake change how any boss looks, and what does it save?

Dev tools for the Legends sprite-rig bake (`src/features/legends/bakePlan.js`, `bake/web.js`). Run with the dev
server up (`npm run dev`). Every script uses Playwright's bundled Chromium (installed by `npm run drive` into
`~/.ebiki-drive`; headless shell: `npx playwright-core install chromium-headless-shell` there), muted, never the
installed Chrome. Results go to `.scratch/bake-sweep/` (gitignored).

- `node dev/bake-sweep/compare.mjs [filter] [dpr]`: every boss, raid boss (each phase, the entrance, every ability
  effect) and banner, baked vs vector (`__ebikiNoBake`), frozen at the same moments, pixel-diffed. Set
  `FREEZE_WAIT=600` (ms after a seek before the screenshot). Over 0.3% of pixels is flagged and saved side by side.
  Filter examples: `raids/`, `raids/hydra`, `areas/`. dpr 2 = a sharper screen.
- `node dev/bake-sweep/heat.mjs <side-by-side.png>...`: an amplified difference map next to a flagged pair.
- `node dev/bake-sweep/pair-look.mjs <kind> <motif> <animated> <phase> <t,t> [waitMs] [dpr]`: vector and baked in ONE
  page, large, for a close look.
- `node dev/bake-sweep/coverage.mjs [filter]`: how many shapes stay vector per drawing, bake and timeline times.
- `node dev/bake-sweep/perf.mjs [size] [kind/motif,...]`: work per second: OLD (raw SMIL), CLOCK (art clock, vector),
  NOW (clock + bake), from 3 s traces.
