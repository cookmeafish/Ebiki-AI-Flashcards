# TODO: finish the boss-art optimization sweep (DELETE THIS FILE WHEN DONE)

Handoff from the previous session (2026-10-08). Version 1.42.0 is committed on `app-expansion`. Everything below is
**checking and documenting**; the look and correctness work is done. Delete this file in the commit that finishes it.

## Where things stand
- **Art clock** (`src/features/legends/art.jsx` THE ART CLOCK) + **pace governor** (`artPace.js`): boss animation runs on
  real time from one shared timer, never at the monitor's rate; a page-wide redraw budget adapts to the machine.
- **Sprite-rig bake** (`bakePlan.js` pure + tests, `bake/web.js` browser half, `bakeGuard.test.js`): static parts of
  each boss are pre-drawn once at screen density; each piece is a SPRITE (invisible exact-box path + bitmap through
  its marker) so pivots never move; parts are drawn at the largest size their animation reaches; page-reachable
  classes stay live; banners use their real viewBox scale; drawings under 100 shapes stay vector; bakes are kept in
  Cache Storage; queued bakes for drawings no longer on screen are dropped. CLAUDE.md "Sprite-rig bake" documents it.
- **Verified so far**: full 1x sweep (`dev/bake-sweep/compare.mjs`): 318 of 319 cases under 0.3% pixel difference,
  the one over (Moonmaw phase 3, 0.37%) looked identical at 3x; 12 tiny drawings stay vector by design. The 2x sweep
  passed 57 of 199 raid cases before it was stopped for this handoff. Legends unit tests pass.

## Left to do (in order)
1. **Finish the 2x-density sweep**: `npm run dev`, then `FREEZE_WAIT=600 node dev/bake-sweep/compare.mjs raids/ 2`
   (and `areas/` at 2). Anything over 0.3%: `node dev/bake-sweep/heat.mjs <png>` and
   `node dev/bake-sweep/pair-look.mjs ...` to look closely (see `dev/bake-sweep/README.md`).
2. **Measure speed**: `node dev/bake-sweep/perf.mjs 220` (OLD raw SMIL vs CLOCK vs NOW, ms of work per second for
   ophanim, hydra, kitsune, chronos, inferno, forest, celestial). Put the real numbers into CLAUDE.md's "Sprite-rig
   bake" paragraph (it still quotes the older "hydra 444 → 31 ms/s") and the art clock paragraph.
3. **Sharpness while moving (not frozen)**: capture a few live, unfrozen screenshots during the entrances of the void
   and banshee (parts that grow fast), baked vs `window.__ebikiNoBake = true`, and confirm nothing looks softer in
   motion. (A screenshot right after a SEEK can catch a bitmap at its previous decode size; check this never shows
   in normal playback.)
4. **Drive the real app** with every /api write blocked (route non-GET `/api/**` to 204): asset view, Raid bosses tab,
   Next phase x3, Impact moments, stepping bosses with the arrow keys, the Legends tab, Ctrl+= (a sharper re-bake
   should follow, `window.__ebikiBakeStats` grows). No console errors except Anki-not-running lines.
5. **`node dev/legends-gallery/check-art.mjs`** (0 failures expected; the 24 ophanim overdraw warnings are old), then
   the **full `npx vitest run`** (a few 5 s timeouts under full parallel load are known flakes; rerun those files alone).
6. Bump the version (patch) if anything in app code changed, update CLAUDE.md, **delete this file**, commit (no
   assistant name or attribution anywhere in git), push to `app-expansion`.

## Rules that matter here
- Browser automation: Playwright's bundled Chromium only, muted (`--mute-audio`); never the installed Chrome.
- Never edit app files while a sweep runs (Vite reloads the page and the run dies).
- Bump `BAKE_FORMAT` in `bakePlan.js` whenever the baked output changes.
- After closing Ebiki, run `npm install` (Electron 44 upgrade; the open app window locks `node_modules/electron`).
