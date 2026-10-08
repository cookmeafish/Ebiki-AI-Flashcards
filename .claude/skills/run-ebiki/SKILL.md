---
name: run-ebiki
description: Launch the Ebiki dev server and drive the running app in a headless browser to verify a UI change end to end. Use when asked to run/start/screenshot Ebiki, or to confirm a change works in the real app rather than only in tests.
---

# Run Ebiki

`npm test` (vitest) covers only pure modules; layout, modals and click paths need the running app. Start the
server, drive it, read the screenshots.

## Start

```bash
npm run dev            # in the background; Vite serves port 3000 and never opens a tab
```

Poll the port instead of sleeping:

```bash
until curl -s -o /dev/null --max-time 2 http://localhost:3000/; do sleep 0.5; done
```

Stop with `lsof -ti:3000 -sTCP:LISTEN | xargs -r kill` (npm doesn't forward SIGTERM to vite, so killing npm
leaves the port bound). Windows: `npx kill-port 3000`.

Edits hot-reload, except `vite.config.js` (watch-ignored on purpose): restart after changing it.

Never leave a scratch server running with `EBIKI_DATA_DIR` pointed at a throwaway folder: auto-backup mirrors
`DATA_DIR` into `.local-sync/` under the APP ROOT, so the fake share overwrites the real base snapshot (it
happened: a one-line `{}` config.json replaced the live one). Test data-folder behavior in a repo copy, or repair
`.local-sync/` afterwards.

Use `npm run dev`, not the Ebiki shortcut: a shortcut server sets `EBIKI_AUTO_EXIT=1` and exits soon after the
last page closes, so it vanishes when the driver's browser exits and looks like a crash. `curl
localhost:3000/api/alive` returns `{autoExit, lastBeatAgoMs}` to tell them apart. Never launch Electron from an
agent: it opens the real app.

## Drive

```bash
npm run drive                                   # smoke path, no AI calls
npm run drive -- --studio "learn negotiation"   # Ebi Studio path, SPENDS API CREDITS
npm run drive -- --shots ./out --url http://localhost:3000/
```

Works on a fresh clone: `drive.mjs` installs `playwright-core` into `~/.ebiki-drive` on first run (outside the
repo, so `package.json` is untouched) plus Playwright's bundled Chromium, and drives ONLY that bundled browser.
**Never launch the installed Chrome or Edge (`executablePath`, `channel`, `CHROME_BIN`)**: on the owner's Windows
machine it logged failed logons (event 4625) and locked their account. `EBIKI_DRIVE_DEPS` overrides the folder.

Screenshots go to `<os temp>/ebiki-drive-shots/` by default (`--shots` or `SHOTS` overrides; `--url` or `APP_URL`
for another host); each path is printed. **Look at them**: a blank frame means the app never loaded. Console errors
and 4xx responses print at the end; a failure also screenshots the stuck state.

- **smoke** - loads the app and opens Settings > Learning modes (server, config load, settings chrome).
- **`--studio`** - types a brief (default "Learn persuasion and negotiation"), opens Ebi Studio, waits for Ebi's
  reply and reports the panel geometry. A real chat call on the user's key: run it only for changes on that path.

For another screen, copy the `drive.mjs` pattern: `waitForSelector` on the English UI string, click by role and
name, `fill` inputs (assigning `.value` skips React's onChange), screenshot, read console errors.

## Gotchas

- **The body zoom (default 1.35, user-adjustable) breaks `position: fixed`.** A fixed `inset: 0` backdrop covers
  zoom x 100% of the viewport, so a centered modal lands down-right, off-screen. Convention:
  `width: calc(100vw / var(--app-zoom))` + `height: calc(100vh / var(--app-zoom))` from top-left. Test other zooms by
  setting `localStorage['ebiki-ui-zoom']` (e.g. 1, 1.6, 2) before load. Assert geometry with `getBoundingClientRect()` against
  `window.innerWidth/Height`, not a screenshot; `panelBox()` in `drive.mjs` is the model.
- **The ready signal is "Talk to Ebi"** (header button). The shell paints before config loads, so anything earlier
  races the first render.
- **Anki is usually not running**: `[Anki proxy] error: connect ECONNREFUSED 127.0.0.1:8765` floods the log and the
  app shows its not-connected banner. Expected. Start Anki only to test sync paths.
- **The Electron overlay can't launch in a Linux container** ("Electron failed to install correctly"). The web app
  is unaffected; ignore the stack trace.
- The dev server writes real user data (`config.json`, `modes/`). Driving can create modes and cards, so don't
  click Apply/Create in a smoke run unless asked.
- ESM resolves imports upward from the script's own folder, so `NODE_PATH` can't expose the installed deps;
  `drive.mjs` imports them by absolute file URL. Keep that if you move the file.
- 4xx reporting uses a CDP `Network` feed, not `page.on('response')`, which never sees browser-initiated requests
  (a `/favicon.ico` 404 otherwise shows up as an anonymous console line). That URL is filtered as known noise, so
  everything printed is real.
