---
name: run-ebiki
description: Launch the Ebiki dev server and drive the running app in a headless browser to verify a UI change end to end. Use when asked to run/start/screenshot Ebiki, or to confirm a change works in the real app rather than only in tests.
---

# Run Ebiki

`npm test` (vitest) covers the pure modules only, so anything about layout,
modals, or a click path has to be checked in the running app. This skill is the
second half of testing: boot the dev server, drive it, look at the screenshots.

## Start

```bash
npm run dev            # background it; Vite serves on port 3000
```

Poll the port, do not sleep:

```bash
until curl -s -o /dev/null --max-time 2 http://localhost:3000/; do sleep 0.5; done
```

Stop with `lsof -ti:3000 -sTCP:LISTEN | xargs -r kill` (npm does not forward
SIGTERM to the vite child, so killing the npm wrapper leaves the port bound).
On Windows: `npx kill-port 3000`, or close the launcher window.

Edits hot-reload. `vite.config.js` is watch-ignored on purpose, so a change
there needs a manual restart.

Never point a scratch server's `EBIKI_DATA_DIR` at a throwaway folder and leave
it running: its auto-backup mirrors `DATA_DIR` into `.local-sync/` under the APP
ROOT, so a fake share will overwrite the real base snapshot (this happened - a
one-line `{}` config.json replaced the live one). Test data-folder behaviour in a
copy of the repo, or repair `.local-sync/` afterwards.

Start it with `npm run dev`, not the Ebiki shortcut. A SHORTCUT-launched server
sets `EBIKI_AUTO_EXIT=1` and shuts itself down a few seconds after the last
browser tab closes, so it will disappear when the driver's browser exits and
look like a crash. `curl localhost:3000/api/alive` reports `{autoExit,
lastBeatAgoMs}` if you need to tell the two apart. A `npm run dev` server never
auto-exits.

## Drive

```bash
npm run drive                          # smoke path, no AI calls
npm run drive -- --studio "learn negotiation"   # Ebi Studio path, SPENDS API CREDITS
npm run drive -- --shots ./out --url http://localhost:3000/
```

Works on a fresh clone with no setup: `drive.mjs` installs `playwright-core`
into `~/.ebiki-drive` on first run (outside the repo, so `package.json` gains no
dependency) and drives whatever Chrome, Chromium, or Edge the machine already
has. Nothing is downloaded beyond that one small package. Override with
`CHROME_BIN` / `EBIKI_DRIVE_DEPS` if the browser is somewhere unusual.

Screenshots land in the OS temp dir by default; the path of each is printed.
**Look at them** — a blank frame means it never launched. Console errors and any
4xx are printed at the end; a failure also screenshots the stuck state.

- **smoke** — loads the app, opens Settings > Learning modes. Proves the server,
  the config load, and the settings chrome all work.
- **`--studio`** — types a brief, opens Ebi Studio, waits for Ebi's reply, and
  reports the panel's geometry. This makes a real chat call on the user's key,
  so only run it for changes in that path.

For a different screen, copy the pattern in `drive.mjs`: `waitForSelector` on
the English UI string, click by role and name, `fill` for inputs (assigning
`.value` skips React's onChange), screenshot, read the console errors.

## Gotchas

- **`body { zoom: 1.35 }` breaks `position: fixed`.** A fixed `inset: 0`
  backdrop covers 135% of the viewport, so a centered modal lands down and to
  the right, off-screen. The convention is `width: calc(100vw / 1.35)` +
  `height: calc(100vh / 1.35)` from top-left. Assert geometry with
  `getBoundingClientRect()` against `window.innerWidth/Height` rather than
  trusting a screenshot; `panelBox()` in `drive.mjs` is the model.
- **Ready signal is "Talk to Ebi"**, the header button. The shell paints before
  config loads, so waiting on anything earlier races the first render.
- **Anki is usually not running**: `[Anki proxy] error: connect ECONNREFUSED
  127.0.0.1:8765` floods the server log and the app shows its not-connected
  banner. Expected, not a failure. Start Anki only when testing sync paths.
- **The Electron overlay cannot launch in a Linux container** ("Electron failed
  to install correctly"). The web app is unaffected; ignore that stack trace.
- The dev server writes to real user data (`config.json`, `modes/`). Driving the
  app can create modes and cards, so do not click Apply/Create in a smoke run
  unless the user asked for it.
- ESM resolves imports from the script's own directory upward, so `NODE_PATH`
  does not make the installed deps visible. `drive.mjs` imports them by absolute
  file URL instead; keep that if you move the file.
- 4xx reporting comes from a CDP `Network` feed, not `page.on('response')`:
  browser-initiated requests never reach the latter, which is how a `/favicon.ico`
  404 shows up as an anonymous console line. That one URL is filtered as known
  noise, so anything the run prints is real.
