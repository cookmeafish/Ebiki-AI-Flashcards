---
name: run-ebiki
description: Launch the Ebiki dev server and drive the running app in headless Chromium to verify a UI change end to end. Use when asked to run/start/screenshot Ebiki, or to confirm a change works in the real app rather than only in tests.
---

# Run Ebiki

Vite dev server plus a headless-Chromium driver. `npm test` (vitest) covers the
pure modules only, so anything about layout, modals, or a click path has to be
checked in the running app.

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
Vite's config sets `open: true`, which is harmless headless.

Edits hot-reload. `vite.config.js` is watch-ignored on purpose, so a change
there needs a manual restart.

## Drive

`drive.mjs` in this folder is the driver. It needs `playwright-core` plus a
chromium binary. Install outside the repo so `package.json` stays clean, and
copy the driver in beside those modules: ESM resolves imports from the script's
own directory upward, so `NODE_PATH` does not work here.

```bash
mkdir -p /tmp/ebiki-run && cd /tmp/ebiki-run && npm init -y >/dev/null && npm i playwright-core
cp .claude/skills/run-ebiki/drive.mjs /tmp/ebiki-run/ && node /tmp/ebiki-run/drive.mjs
```

`/usr/bin/chromium` is the default binary (override with `CHROME_BIN`).
Screenshots land in `/tmp/ebiki-run/shots` (override with `SHOTS`).
**Look at the screenshots** — a blank frame means it never launched.

- `node drive.mjs` — loads the app, opens Settings > Learning modes, shots each
  step, reports console errors and any 4xx. No AI calls.
- `node drive.mjs --studio "learn negotiation"` — also opens Ebi Studio with
  that brief and waits for Ebi's reply. **This spends the user's API credits**
  (one chat call), so only run it when the change is in that path.

For a different screen, copy the pattern: `waitForSelector` on the English UI
string, click by role and name, `fill` for inputs (setting `.value` skips
React's onChange), screenshot, then read the console errors.

## Gotchas

- **`body { zoom: 1.35 }` breaks `position: fixed`.** A fixed `inset: 0`
  backdrop covers 135% of the viewport, so a centered modal lands down and to
  the right, off-screen. The convention is `width: calc(100vw / 1.35)` +
  `height: calc(100vh / 1.35)` from top-left. Assert geometry with
  `getBoundingClientRect()` against `window.innerWidth/Height` rather than
  trusting a screenshot; `drive.mjs` has `panelBox()` as the model.
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
