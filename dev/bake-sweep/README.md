# Bake sweep: does the sprite-rig bake change how any boss looks, and what does it save?

Dev tools for the Legends sprite-rig bake (`src/features/legends/bakePlan.js`, `bake/web.js`). Run with the agent dev
server up (`npm run dev:agent`: the scripts expect port 3001). Every script uses Playwright's bundled Chromium (installed
by `npm run drive` into `~/.ebiki-drive`; headless shell: `npx playwright-core install chromium-headless-shell` there),
muted, never the installed Chrome. Each page mounts one boss through `harness.jsx` (phase, ability effect, ability
state). Results go to `.scratch/bake-sweep/` (gitignored).

- `node dev/bake-sweep/compare.mjs [filter] [dpr]`: every boss, raid boss (each phase, the entrance, every ability
  effect) and banner, baked vs vector (`__ebikiNoBake`), frozen at the same moments, pixel-diffed. Set
  `FREEZE_WAIT=600` (ms after a seek before the screenshot; default 120 can catch a bitmap mid-decode). Over 0.3% of
  pixels is flagged and saved side by side. Filters: `raids/`, `raids/hydra`, `areas/`. dpr 2 = a sharper screen.
- `node dev/bake-sweep/heat.mjs <side-by-side.png>...`: an amplified difference map next to a flagged pair.
- `node dev/bake-sweep/pair-look.mjs <kind> <motif> <animated> <phase> <t,t> [waitMs] [dpr]`: vector and baked in ONE
  page, large, for a close look (defaults: waitMs 200, dpr 3).
- `node dev/bake-sweep/coverage.mjs [filter]`: how many shapes stay vector per drawing, bake and timeline times.
- `node dev/bake-sweep/perf.mjs [size] [kind/motif,...]`: raster work per second, OLD (raw SMIL), CLOCK (art clock,
  vector), NOW (clock + bake), from 3 s traces (default size 220).
