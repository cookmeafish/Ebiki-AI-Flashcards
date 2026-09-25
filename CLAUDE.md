# Ebiki - project notes for Claude

Local-first AI flashcard/study app (React + Vite), grown out of "ScreenLens". Mascot **Ebi**, a red
shrimp. Brand color **#DF2540**. Themes **Ocean Light** + **Dark**. Fonts Baloo 2 (display) + Nunito (body).

## Design system (never hardcode colors)
- `src/config/tokens.js`: `C` (colors as `var(--c-*)`), `FONT`, `RADIUS`, `SHADOW`. Single source of truth.
- Palettes: CSS variables in the global `<style>` in `src/App.jsx` (`:root` = light, `[data-theme="dark"]`).
  `appTheme` → `<html data-theme>`, persisted in config + localStorage; no-flash pre-paint script in `index.html`.
- `src/styles/theme.js`: `S.*` style objects built from tokens.
- Primary CTAs: className `btn-press`. Tabs: `ui-tab`.
- **NO EM DASHES in ANY user-facing text**: UI strings, i18n (all four languages), `data-tip`, `title`,
  placeholders, dialogs, toasts, errors, AI output (prompt-forbidden + code-stripped). Use `. ` / `: ` / ` · `
  (zh `，`, ja `。`). Code comments are exempt.
- **Light-mode semantic colors are DEEPER than dark mode's** (success `#0E8746`, warning `#B36A00`, danger
  `#D32F24`, purple `#7C4DEF`) so green and amber don't blend at small sizes. Keep that if retuning.

## Settings: global vs per-mode
One **⚙ Settings** modal, `src/components/SettingsModal.jsx`:
- **App settings** (GLOBAL, `config.json` via `/api/config`): General (appTheme, appLanguage, translation
  `language`/`targetLang`), AI models (provider, key, per-feature models).
- **Mode settings** (PER-MODE, `modes/<name>/config.json` via `updateActiveMode`): Study (`studyRules`:
  questionsPerCard, cardsAtOnce, **studyLanguage** = the LEARNED language (answers + card generation),
  **quizLanguage** = "Ebi speaks" (phrasing; '' = same as learned), **wordHints**, grammarFeedback,
  questionPrompt, ratingRules), Cards & Anki (`activeMode.ankiDeck`, fields/templates, tagRules), Knowledge
  base, Overlay (`areaSelectTransparent`), Learning modes (create/switch/rename/delete).
- Rule of thumb: can differ per mode → `activeMode`; otherwise global.
- **Async writers use `updateModeById(modeId, updates)` with the id pinned when the task STARTS.** Never
  `updateActiveMode`/`saveModes` from an async completion: `saveModes` re-asserts `activeModeId`, so a stale
  closure flips the app back to the previous mode. `modesRef`/`activeModeIdRef` are the live mirrors. Current
  async writers: chat-suggestion backfill, Discover category generation.
- **Never auto-persist a deck default.** `refreshAnkiConnection` must NOT write `decks[0]` into the mode: it
  can run before modes load (placeholder mode, deck '') and clobber the chosen deck. Fall back
  non-persistently (`ankiDeck || decks[0]`) at session start and in pickers.
- `chatSuggestions` (3 subject-specific Chat starter chips) come from `createMode`; Chat empty state reads
  them (generic fallback) plus an always-present "💬 Just chat with Ebi" chip. Older modes backfill lazily on
  first Chat visit (effect near `sendChatTabMessage`).
- Header: quick mode-switcher + ⚙. Switching tabs closes the modal.
- **Mode ids are de-duplicated on load** (merged shared folders can collide ids; a duplicate breaks the
  active highlight and silently turns a switch into a rename). The modes-load effect re-ids duplicates
  (first wins) and persists, next to the em-dash sanitize pass.

## i18n
- `t(key, vars)` from `src/i18n/index.js` (dicts `en`/`es`/`zh`/`ja`; falls back lang → en → key). **A
  missing key renders as the raw key name**, so add the key to ALL FOUR dicts first, then wire `t()`.
  `{placeholder}` interpolation. No em/en dashes. Count labels need singular/plural keys (`deck_countAll` /
  `deck_countAllOne`); zh/ja share one form. **No duplicate keys** in a dict: the later one silently wins.
- Still English-only: deck browser body, Picture word-detail tooltip, part of the study graded/batch surface.
- Verify with a node script that greps `t('...')` refs against the dicts (missing must be 0).

## Data folder (optional shared data directory)
All user data (`DATA_ENTRIES` = config.json, ankiformat.json, modes/, decks/, chats/, discover/, cache/,
keys.json) resolves through `DATA_DIR` in `vite.config.js`. **New server-side data paths MUST use
`dataPath()`**, never `path.resolve('…')`. Default = app root. Overridden by machine-local `datadir.json`
(gitignored) or `EBIKI_DATA_DIR`, so several computers can share ONE folder (e.g. SMB). `/api/datadir`
GET/POST switches live. **The app folder is this computer's HOME.** Both directions may answer
`{needsChoice, context:'join'|'return', sourceOnly}`; the client re-POSTs `merge:bool`.
- **JOIN a share**: if the target has data and this computer has items it lacks, prompt (client confirms
  before a merge writes to the share). `merge:true` = `deepMergeInto`, nothing dropped: one-sided files are
  added; JSON on both sides is deep-merged (`deepMergeJson`: objects by key, arrays unioned, scalar conflicts
  keep target's); differing non-JSON is kept-both as `name (from <label>).ext`. `merge:false` = adopt target.
  Joining FROM the app folder stashes local data into `.local-home/` via `moveDataEntries`. Response has
  `merged` and `keptBoth` counts.
- **RETURN** (`{dataDir:''}`): RESTORES `.local-home/`, not a copy of the share. If the share has extras,
  prompt: `merge:true` pulls them down too. No stash → copy the share down so local isn't empty.
- `moveDataEntries` NEVER deletes (collisions → `local-data-backup-<date>/`). A share is only written by an
  explicit `merge:true`. UI: self-contained `DataFolderCard` (talks to `/api/datadir` directly, NOT via the
  config autosave, since config.json lives inside the data folder). `logs/` stays machine-local.
  `/api/modes` re-derives `MODES_DIR` per request.
- **A switch RELOADS the page.** The page still holds the OLD folder's modes and settings, and one routine
  save (a deck pick, a hook) would post them into the new folder: `/api/modes` POST deletes every folder not
  named, so even after a merge it would erase the other computer's modes. On success `DataFolderCard` calls
  `onDataFolderChanged`: App sets `dataSwitchingRef` (`setAnkiDeck`, `saveModes`, `updateModeById` and the
  config autosave all bail on it), clears `configHealthyRef`, and reloads 1.5s later. New data writers must
  honor `dataSwitchingRef` too.

### API keys: local file, shared copy, self-healing backup
- `.env` path is pinned to the CODE folder (`SELF_DIR` from `import.meta.url`), never `path.resolve('.')`,
  so a launch with the share as cwd can't write a credential onto the share. `EBIKI_ENV_DIR` overrides it
  for tests only.
- **`writeEnv` MERGES.** Its argument is what the caller asserts: unmentioned providers are untouched; a
  provider is deleted ONLY when named with an empty value. (Whole-state rebuild once erased a key.) Don't
  reintroduce whole-state semantics.
- `.env.bak`: mirrored on every read and every key-storing write, and **only grows** (union of itself and
  `.env`, minus deliberate clears). If `.env` has no keys, `parseEnv` restores from it and logs it.
- `logs/keys.log`: every key write (source, stored, cleared, remaining). Provider NAMES only, never values.
- `.env.cleared` records intent to clear, so the self-heal doesn't undo it; storing any key removes it.
- `keys.json` in `DATA_DIR` is the SHARED copy, synced by `syncSharedKeys()` on `/api/keys` GET/POST and the
  backup tick. Strictly additive both ways; if both sides hold a key, the LOCAL one wins. **Exception: a key
  the user TYPED** (`setCurrentKey` sets `keyEditedRef`; save posts `?source=user`, read from
  `req.originalUrl` since connect rewrites `req.url`) replaces the shared entry, so a bad shared key can be
  corrected. Skipped when there's no share or it's unreachable.

### Auto-backup (one-way)
With a shared `DATA_DIR`, a `configureServer` timer runs `runBackup()` every 10 min (and ~20s after start):
`copyNewer` mirrors `BACKUP_ENTRIES` (`DATA_ENTRIES` minus `cache`) into `.local-sync/` (gitignored,
watch-ignored) by size+mtime. Never writes to the share; skips when the share is unreachable
(`dataEntriesPresent`). `.local-sync/` is the BASE for offline reconcile. `/api/sync-backup` GET
`{enabled, at, files, error}`, POST = back up now. UI in `DataFolderCard` (shared folder only).

### Unreachable-source guard (anti-clobber) - DO NOT REMOVE
A dead mapped drive reads as EMPTY (so autosave wrote defaults back and onboarding reappeared) and touching
it THROWS (an unwrapped `mkdirSync` became Vite's full-screen error overlay). One guard fronts every
data-backed route (`DATA_ROUTES` = config, ankiformat, modes, knowledge-sections, deck-progress,
discover-store, chats, chat-load) and branches on `dataMode()`: **`down`** (no share, no snapshot) → 503
`{unreachable:true}`; **`offline`** → serve the local copy + `X-Ebiki-Offline: 1`; **`online`** → pass
through. Deliberately NOT guarded: `/api/datadir`, `/api/keys`, `/api/log`, `/api/anki`, `/api/update`,
`/api/web-search`, `/api/tts`. The top-level `mkdirSync`s in `/api/modes` + `/api/chats` are wrapped. Client:
a failed config fetch sets `dataUnreachable`, leaves `configHealthyRef` false (autosave bails), and a red
banner replaces onboarding.

### /api is for the app only (security)
- **`apiRequestAllowed` fronts every /api route** (first middleware). Handlers parse bodies as JSON whatever
  the Content-Type, so any website could send a no-preflight text/plain POST (a `/api/modes` POST naming one
  mode deletes all others; the `/api/anki` proxy drives Anki). And plugin middlewares run BEFORE Vite's own
  `allowedHosts` check, so DNS rebinding reached them too. Rules: Host must be loopback (`localhost`,
  `127.0.0.1`, `[::1]`, port optional); an Origin, when present, must equal the Host (`null` fails). Real callers
  all pass: the page/overlay are same-origin, and Electron main, the launch scripts and curl send no Origin.
  Tests in `src/keys/api-guard.test.js`. Every new route must live under `/api` to be covered.
- **Never build a path from raw client input.** Chat ids must pass `isSafeChatId` (`[A-Za-z0-9_-]`); deck
  progress folders go through `deckDirName` (`::` → `--`, Windows-invalid chars → `_`; subdecks used to fail
  to save on Windows; a name that was already valid maps to itself).
- **Never parse untrusted HTML with `innerHTML` on an element of the live document** (even detached, an
  `<img onerror>` in a card field runs, with full /api access). `stripHtml` uses `DOMParser` (inert). Rendered
  HTML goes through DOMPurify (`Markdown.jsx`, every `dangerouslySetInnerHTML`).

### NEVER WRITE BACK WHAT YOU FAILED TO READ (the clobber family)
An autosave that posts WHOLE state must not run on state from a failed read, and a handler that treats
"absent" as "delete" must refuse an empty payload.
- **API keys.** The load tags its read (`_ok`, stripped); `keysHealthyRef` gates the autosave like
  `configHealthyRef`; typing a key (`setCurrentKey`, the single funnel for onboarding + Settings) re-enables
  it. Clearing a key posts that provider with an empty value.
- **`syncSharedKeys` reads via `parseEnv()`, never `readEnvFile()`** (it writes what it reads, so it must
  go through the `.env.bak` self-heal), and never publishes a `keys.json` smaller than the share's.
- **`aiCall` won't send one provider's request with another provider's key.** A key equal to ANOTHER
  provider's stored key is stale (closure captured before a provider switch) and is swapped for the live
  one; a freshly typed key matches nothing, so validation is unaffected.
- **Selected vs usable provider can disagree, and the app says so.** `provider` lives in the shared
  `config.json`, keys in this machine's `.env`, so joining a share can select a provider with no local key.
  An in-flow amber banner names it and offers both fixes. Deliberately NOT an auto-switch, and never
  persisted back.
- **Modes.** `/api/modes` POST deletes every folder not in the payload, so `{modes: []}` would erase all
  modes and knowledge bases. `setAnkiDeck`, `saveModes` and the server all refuse an empty list.
- **Whole-blob stores (memory hooks, grammar log, Discover ledger, dupignore) read through
  `readBlobChecked`** (`src/discover/storage.js`): `{ok, value}`, where ok:false means the blob could NOT be
  read (Anki threw AND the local store failed or was empty; a 503 share). Every writer REPLACES the blob, so:
  hooks and grammar writes persist only once the mode's read succeeded (`hooksReadyRef`/`grammarReadyRef`;
  anything made before that is MERGED into the loaded data and saved then); ledger writes need a real read
  or a cached ledger (`discoverLedgerWritableRef`); "do not merge" needs `dupIgnoreReadOkRef`. `readBlob` is
  unchanged for read-only callers. Tests: `storage-read.test.js`.
- **Deck progress notes** are read with `readDeckProgress` (`{ok, content}`; a missing file is a real empty
  read). Chat `<progress-update>` and "Generate Insights" REPLACE the file, so both write only over notes that
  were actually read (`deckProgressOkRef`, `chatTabAttachedDeck.progressOk`, `existingOk`).
- **Chat sessions** (Chat tab AND Ebi's Help): a chat that fails to load is NOT opened empty (its id would take
  the next save), including the restore-on-refresh and Help's load-on-mount; rename refuses to re-save from a
  failed read; switching or starting a chat is ignored while a reply is pending (the reply lands in the
  conversation it was asked in). A failed save keeps the old id (undefined made the next save a new chat).
- **An async result lands only where it was asked, and never writes back a whole array copied before the
  await.** Capture a token when the work starts and drop the result if it moved: `discoverGenRef` (mode or
  Discover deck switch), `scanGenRef` (Picture scan; word indices are reused across scans), `pinGenRef`
  (pinned Picture word), `stillOnQuestion` (meaning hint, Fix question), the grader's `stillGrading` ("Back"
  undid the card), `studySessionRef`. A reply that changes ONE item merges it into the live list with a
  functional update (the study feedback chat used to write back the whole card list it copied at send time,
  reverting every grade that landed meanwhile; those cards then sat on "Evaluating" forever).
- **A grading reply must cover every question** (`complete` in `evaluateCardAnswers`): `parseAiJson` salvages
  the complete rows of a truncated array, and counting wrong answers over those rows alone rated a card Easy.
- **Bulk-edit saves re-read the cards first** (`commitAcceptedRecs`): a suggestion replaces the fields/tags it
  names as they were when the check ran, so a card edited since (deck browser or Anki) is skipped with
  `deck_changedSinceSuggest`. Fields that had bold `Label:` lines are written back through `cardBackToHtml`.
- **A config.json that EXISTS but will not parse is not "no config".** `readConfigSettled` (the GET) retries
  ~1s (another computer mid-write); an IO failure then answers 503 (client: unreachable, autosave off); a file
  that truly is not JSON is RENAMED to `config.json.corrupt-<stamp>` (kept, never deleted) and served as
  fresh, so one bad file cannot lock the app out forever. `writeConfig` writes a temp file and renames it
  over config.json (plain write only if the rename is refused), so readers never see a half-written file.
  `config.json.*` is gitignored and watch-ignored.

### Offline mode (run from local copy, reconcile on reconnect)
When the share is unreachable the app runs from `.local-offline/` (gitignored, watch-ignored), seeded once
from `.local-sync/`. **Three folders, three jobs - don't collapse them:** `DATA_DIR` = shared truth (written
only by explicit user action), `.local-sync/` = BASE (never written by offline mode), `.local-offline/` =
offline working copy. The pristine base makes reconnect a real 3-way merge (my change vs theirs).
- `dataPath()` routes through `.local-offline` while `offlineActive`, so every endpoint follows. `dataMode()`
  runs per request with a 3s `shareReachable()` cache (dead SMB probes block). A returning share flips offline
  off with no restart; `.local-offline/` stays until reconciled. `enterOffline()` returns false with no
  snapshot (the only `down` case).
- **Reconcile** (`/api/offline`: GET `{offline, pending, since, changes}`, POST reconciles, POST
  `{discard:true}` drops edits): only files differing from base; share missing or unchanged → fast-forward;
  share also moved → `deepMergeInto(..., basePath)` (non-JSON kept-both as `name (from this computer
  offline).ext`). **JSON merges against the base** (`deepMergeJson(theirs, mine, base)`): a value only this
  computer changed wins; only a value BOTH sides changed keeps the share's. Without the base, a setting changed
  offline was lost whenever another computer touched anything else in that file. Join/return merges pass no
  base (scalar conflicts keep the target, as before). Tests: `merge3.test.js`. Then `.local-offline/` is
  removed and `runBackup()` refreshes the base.
- **The offline copy belongs to one data folder** (`.offline.json` `dataDir`, `offlineCopyDataDir()`):
  `enterOffline` won't serve another folder's copy, reconcile refuses to merge it into another folder (409),
  and a data-folder switch resets `offlineActive` + `reachCache` (dataPath kept routing the new folder
  through the old share's offline copy for up to 15s).
  **Offline deletions are NOT replayed** (indistinguishable from never-synced; re-deleting shared data is
  unrecoverable).
- Client: config fetch reads `X-Ebiki-Offline`; a 30s `/api/offline` poll drives an amber dismissable banner
  and, once the share is back, an "N offline changes waiting · Merge / Discard" bar. Never an automatic push.
  `offlineBusy` holds `'merge'`/`'discard'` so the bar names what it's doing (SMB reconcile can take seconds).

**Banners render IN FLOW above `<header>`, never `position:fixed`** (a fixed bar covers the header and eats
its clicks).

**A banner's button and its handler must be deleted together - and a handler's banner with it.** Removing
the update banner once took `resolveOffline` with it (buttons stayed, every click threw a silent
`ReferenceError`) and, separately, deleted the AnkiWeb banner JSX while its handlers and probe stayed. JSX has
no compile step to catch either, and these banners only render in rare states. Before removing UI, grep every
handler it names for other callers, and every nearby block for what it renders.

## How Ebiki opens: app window vs browser tab (per computer)
Users can pick the Electron window or a browser tab (tabs make it easy to research a word and come back).
- **Machine-local** (`launchmode.json`, gitignored, `{mode:'app'|'browser'}`), not `config.json`: computers on
  one share may differ, and the launcher reads it before the dev server exists. Missing/unreadable = `'app'`.
  **FOUR readers must stay in sync**: `readLaunchMode` (`vite.config.js`), `Get-LaunchMode`
  (`scripts/launch.ps1`), `launch_mode` (`scripts/launch.sh`), `readLaunchMode` (`electron/main.cjs`).
- `/api/launchmode` GET/POST is NOT in `DATA_ROUTES` (must work with the share down). UI: `LaunchModeCard`
  (Settings > General) + an onboarding step, both rendering `LaunchModeOptions` from
  `src/components/LaunchModeChoice.jsx`.
- **A live switch is a HANDOFF.** POST `{switchNow:true}` spawns the other front end; the old page polls until
  the new one reports via `/api/launchmode/hello` (`{kind}`, sent by every page on mount), THEN closes (closing
  first would trip the server's auto-exit). A browser tab can't close itself, so it says so. `main.cjs` also
  says hello from `second-instance` (switching to an already-open window only focuses it). A page that handed
  over retires its Switch button (`handedOver`); re-picking a tile clears it.
- **Every entry path honors the choice, including the taskbar pin** (which pins the bare exe path).
  `main.cjs` treats a launch without `--from-launcher` as bare: in `browser` mode it hands off to the launcher,
  and it starts the launcher when nothing answers on 3000. `launch.ps1`/`launch.sh` and the switch-now spawn
  pass `--from-launcher`. No recursion: browser mode never starts Electron, and a launcher-started duplicate
  loses the single-instance lock.

**External links open the REAL browser.** `setWindowOpenHandler` denies child windows and calls
`shell.openExternal`; a `will-navigate` guard does the same for plain links. Both are on the app window AND
the overlay (shared module-level `openExternally`). "Is this the app?" is `isAppUrl` (ORIGIN equality),
never `startsWith(VITE_URL)`: `http://localhost:3000@evil.example/` passes a prefix test. The overlay's
`close` handler hides instead of closing ONLY while `!appQuitting` (set on `before-quit`), or it blocks
app.quit, SIGTERM and Windows shutdown. **http(s) only** (other schemes
would launch arbitrary protocol handlers).

## Windows installer & launch
- **Exactly ONE user-runnable file in the root: `Install Ebiki.bat`.** Scripts live in `scripts/`
  (`setup.ps1`, `launch.ps1`) and resolve the app folder as `Split-Path $PSScriptRoot -Parent`.
  `launch-ebiki.vbs` + `ebiki.ico` MUST stay in the root (existing shortcuts point at them by absolute path).
- `Install Ebiki.bat` → `scripts/setup.ps1`: winget-installs Node.js, Git, **Anki** if missing; installs
  **AnkiConnect**; `npm install`; Desktop + Start Menu shortcuts to `launch-ebiki.vbs` with `ebiki.ico`.
  `launch-ebiki.vbs` → `scripts/launch.ps1` starts the dev server hidden (if 3000 already serves, just opens
  the app). Everything is path-relative (`$PSScriptRoot` / `%~dp0` / `APP_ROOT`); never hardcode a path.

### Start-up splash (the click must show something immediately)
Every launch step is invisible, so `launch-ebiki.vbs` shows `scripts/splash.hta` via `mshta.exe` BEFORE
starting `launch.ps1`.
- `showintaskbar="no"` is deliberate: mshta is its own process, so "yes" adds a second Ebiki taskbar button
  (grouping needs an AppUserModelID an HTA can't set).
- Every `<hta:application>` attribute must be a bare attribute; a comment inside that tag silently disables
  the whole block (title bar returns).
- **Stay in LEGACY rendering mode**: `x-ua-compatible ie=edge` breaks `caption="no"`/`border="none"`. So the
  progress bar is stepped in JS (no `@keyframes`) and `xmlns:hta` stays on `<html>`.
- Text is a COLUMN (`.col`, `margin-left:116px`), not text wrapping a float, so long launcher messages don't
  wrap under Ebi. `fitWindow()` measures content and sizes/centers the window. Ebi is 221x126 (fixed width,
  free height).
- **Closes on a file handshake**: polls `<app>\.app-ready`, touched by `electron/main.cjs` on `ready-to-show`.
  `launch.ps1` (`Signal-AppReady`/`Wait-AppReady`) signals on every other path (browser fallback, missing
  Node, early return, crash via `finally`), and `Wait-AppReady` stops if the Electron it started exits. 3 min
  HTA cap as last resort; the VBS deletes a stale marker first.

### The app window heals itself
A white window = the dev server isn't answering. `main.cjs` loads in a loop: 15s per `waitForServer`
attempt, a themed "Waiting for Ebiki's server" holding page between attempts (`showHolding`, guarded against
reload flicker), main-frame `did-fail-load` feeds back into the retry, `did-finish-load` marks success.

## Updates (track `origin master`; the offer must be impossible to miss)
This design is a bug fix (an update popup opened UNDER the splash, froze launch for 60s, then snoozed for a
week, so a user ran a fixed bug for weeks). Don't simplify it back.
- **Launch-time check on EVERY shortcut launch**: `launch.ps1` compares `git ls-remote origin master` (6s
  timeout job, never blocks offline) with HEAD. No snooze: saying no just opens the app. Both launchers
  delete any `.update-snooze` left by older versions.
- **Asked INSIDE the splash** (`Ask-InSplash` in `launch.ps1` ↔ `showPrompt`/`answer` in
  `scripts/splash.hta`). Handshake files (gitignored, cleared by `launch-ebiki.vbs` + launch.ps1's `finally`):
  `.app-splash` (HTA is up; without it `Ask-InSplash` returns `nosplash` and falls back to a topmost
  `MB_SYSTEMMODAL|MB_SETFOREGROUND` popup), `.app-status` (`PROMPT|<question>`), `.app-answer` (`yes`/`no`).
  The splash ignores a `PROMPT|` it already answered (`answeredPrompt`).
- **The splash says what the launcher is doing** (`Set-Status` → `.app-status` → `sub` line). Its 3-minute cap
  measures SILENCE (any new status resets it); a pending question holds it open indefinitely.
- **No in-app update banner** (removed on purpose: the launcher already asks every launch). Settings >
  General > Updates (`UpdatesCard`) is the only in-app surface and carries the RESTART.
- **The app can restart itself.** `POST /api/update/restart` spawns detached `scripts/relaunch.ps1` (waits
  for port 3000 to go quiet, then runs `launch-ebiki.vbs`); the client closes its window
  (`window.ebikiWindow.close()`) so the auto-exit server frees the port. Offered only when `canRestart`
  (win32 + `EBIKI_AUTO_EXIT` + launcher files) AND `isElectronApp`; a tab gets "close and reopen" wording.
  **It must work with NO server running**: fallback `window.ebikiWindow.restart()` (preload →
  `app-window:restart` → `app.relaunch()`); the new bare process starts the launcher. Order: server endpoint,
  then Electron, then manual wording.
- **Every update path targets `origin master` explicitly** (both launchers, both `/api/update` methods,
  `Link-ToGit`). A clone on another branch is never offered an update (would never fast-forward): all
  surfaces check `rev-parse --abbrev-ref HEAD` first; `/api/update` GET returns `branch`/`onMaster` and
  Settings names the branch.
- **MATCH master, don't just move toward it (a release can be RETRACTED).** A force-pushed-backwards master
  makes `pull --ff-only` exit 0 "Already up to date" while changing nothing, forever. All update paths (POST,
  `launch.ps1`, `launch.sh`): `fetch origin master`, then `merge-base --is-ancestor HEAD FETCH_HEAD` → ancestor:
  `merge --ff-only FETCH_HEAD`; else `reset --hard FETCH_HEAD`. **The reset is refused if any TRACKED file is
  modified** (`status --porcelain --untracked-files=no`, reported `dirty`); user data is untracked so normal
  installs are clean. Empty `ls-remote` = master deleted upstream → `remoteMissing`.
- **The already-running launch path checks too** (`Check-Update -AlreadyRunning`). Closing the window doesn't
  stop the server immediately (`/api/bye` + grace ping, up to 150s), so a quick reopen hits the
  already-running branch. After updating it says "close Ebiki and open it again to finish" (the running server
  still has old code). `launch.ps1` also `fetch --unshallow`s a shallow clone once.
- **ORDER in `launch.ps1`: resolve PATH (`Ensure-OnPath`) BEFORE the already-running branch.** Shortcut
  launches inherit Explorer's stale PATH after an install, so `git` wasn't found and the check silently
  returned. Every skip in `Check-Update` logs its reason (no git, not a checkout, wrong branch, unreachable,
  already latest).
- **Every update decision is logged to `logs/update.log`** (who asked, answer, whether HEAD moved). Tested:
  only `'yes'` moves HEAD. A Yes that did NOT move HEAD (fetch failed, a hand-edited tracked file, a refused
  merge) says so in the splash and logs `update FAILED`, and skips npm install (it used to say "Update
  installed" and log "applied"). The only path that changes code without a Yes is the installer's `Link-ToGit`, which
  warns first.
- **`/api/update` robustness** (each was a real bug): GET has a `send()` watchdog so it ALWAYS answers (the
  timeout reply still carries the local facts); git runs with `GIT_TERMINAL_PROMPT=0` + `GCM_INTERACTIVE=never`;
  POST holds an `updateRunning` lock with its own watchdog; the client retries a network failure ONCE then
  shows `updatesServerDown`; `UpdatesCard` has an in-flight guard + sequence number (StrictMode double
  effects).
- `UpdatesCard` (Settings > General): GET = `ls-remote` vs HEAD → `gitAvailable`/`reachable`/`updateAvailable`/
  `canRestart`/`current`/`currentDate`/`build`; POST = update + `npm install` → `restartRequired`, clears
  `.update-snooze`. Checks on open.
- **A dropped connection during an update is not a failure.** `npm install` inside the request can take the
  server down after the update applied ("Failed to fetch"). `confirmUpdateApplied()` polls
  **`/api/update?local=1`** (local-only, skips `ls-remote`: 0.1s vs up to 25s) and compares the commit sha.
  ONE server answer settles it either way; the 45s deadline only covers "never came back" (→ restart offer).

## Dev server lifetime (one server per shortcut; the page owns it)
The shortcut starts the server hidden, and `vite.config.js` is watch-ignored (a phantom change event on the
share caused a restart loop), so a forgotten server keeps serving stale config. Scoped to SHORTCUT launches:
- `launch.ps1` runs "already running?" through "start it" under the mutex `Ebiki.Launcher.SingleInstance`, and
  sets **`EBIKI_AUTO_EXIT=1`**, which also enables `strictPort` (own 3000 or fail, never a hidden 3001).
- The page POSTs `/api/alive` every 5s and `sendBeacon('/api/bye')` on `pagehide` (skipped when `e.persisted`).
  A bye without later beats, or 150s of silence, is only a suspicion: the server pings `ebiki:ping` over the
  HMR socket and waits 4s (throttled background tabs still answer sockets). No answer → kill the overlay
  process TREE (`taskkill /F /T /PID`, never `/IM electron.exe`) and exit. The overlay page never beats
  (`isOverlay` returns early).
  `GET /api/alive` → `{autoExit, lastBeatAgoMs}` (check this first when the server exits unexpectedly).
- **The Electron MAIN process also heartbeats** (every 5s while `appWindow` exists, goodbye on `closed`): a
  minimized/covered renderer is throttled and the server used to exit while the app was open.
- **Talk to the dev server as `localhost`, NEVER `127.0.0.1`**: Vite binds whatever `localhost` resolves to
  first, which is IPv6 `::1` on current Node/Windows (and macOS for `launch.sh`).
- Manual `npm run dev` sets no flag: endpoints answer 204, no timer. That's how to run a second copy.
- **The app notices its own server dying**: 3 missed `/api/alive` beats (~15s) show a QUIET amber line whose
  button opens Settings > General, where `UpdatesCard` shows the `down` state (via `serverDown` prop) and
  offers **Restart now** (same two-path restart). A beat that succeeds again reloads the page (it may be an
  old build).
- **The holding page must REVIVE the server, not just wait**: `createAppWindow`'s retry loop calls
  `delegateToLauncher()` after the first failed attempt, once per outage (`revived` resets only on a real page
  load).

## Version (bump it; the build identity is derived)
- **Declared** `package.json` `version` is the headline in Settings. **Bump it in every commit that changes
  what the app does** (patch = fix, minor = feature); docs/comment-only commits don't need it.
- **Derived** line `<date> · build <n> · <sha>` from `git log -1 --date=format:%Y.%m.%d --format=%H|%cI|%cd`
  + `git rev-list --count HEAD`, so a forgotten bump is still visible. `--date=format:` uses the COMMIT's
  timezone so every machine shows the same date; never `--date=format-local:` or client-side local-time Date
  methods. Build count only when `.git/shallow` is absent. `setInfo` runs BEFORE the early returns in
  `UpdatesCard.check` so the version shows even when the check fails.

## ZIP installs become real clones
- GitHub "Download ZIP" has no `.git`, so updates silently no-op. `setup.ps1` → `Link-ToGit`: `init` →
  `remote add` → `fetch master` → `checkout -B master` → `branch --set-upstream-to` → **`git clean -fd`**.
  Full history, not `--depth 1` (a shallow clone can't diff/log/revert; costs ~8.7 MB). Existing shallow
  clones get `fetch --unshallow`. The clean removes files the release renamed away AND leaves the tree clean
  for fast-forwards. No `-x`, so gitignored user data survives. Prints the short SHA.
- **Trigger is `Test-GitHealthy`, not `Test-Path .git`**: healthy = checked-out commit + `origin` remote +
  upstream tracking (a half-linked `.git` must be able to repair itself).
- **Re-exec after linking**: the running script is still the old ZIP copy, so `setup.ps1` re-execs once from
  the fresh files, guarded by the env var `EBIKI_SETUP_RELINKED` (an env var, because an older script ignores
  it; an unknown `-Switch` would stop it starting).

## The shortcut starts Anki (`Start-AnkiIfNeeded`, before the port-3000 check)
- Skipped when an `anki` process exists. Exe via usual folders → PATH → Start Menu `Anki.lnk` (the MSI records
  no path). Fail-soft.
- **Starts MINIMIZED, in two steps.** `-WindowStyle Minimized` doesn't reach the real window (the website
  install is a launcher that starts Anki from a venv), so `scripts/minimize-anki.ps1` runs DETACHED as a
  fallback. **One window, one time, 25s cap**: it enumerates Anki's visible top-level windows, acts only on the
  MAIN one (title `* - Anki`), and exits at the first sighting. **Never `Process.MainWindowHandle`** (returns a
  transient `Syncing...`/`Anki` window; minimizing those flashed the screen). **Never keep watching** (it
  would re-minimize an Anki the user opened on purpose). Uses `ShowWindow(hwnd, SW_SHOWMINNOACTIVE)` (7), not
  `SW_MINIMIZE` (steals focus from Ebiki).
- **Never give that `Start-Process` no window style**: children of the hidden PowerShell inherit HIDDEN, so
  Anki runs with no window at all. Same reason for `-WindowStyle Normal` on the already-running branch's
  `Start-Process 'http://localhost:3000'`.
- **First-run Anki starts NORMAL**, not minimized (the minimizer would hide the dialog the user must answer).
- **Anki boot watcher** (App.jsx): while `ankiConnected === false`, ping every 4s for a minute then every 20s;
  `refreshAnkiConnection` the moment AnkiConnect answers. (Separate from the study reconnect watcher, which
  covers a live session with unsynced ratings and clears `studySyncError`.)

## Anki + AnkiConnect install (setup, fail-soft, never throws)
- Anki: `winget install -e --id Anki.Anki`. **"Is it installed" (`Test-AnkiInstalled`, via the Uninstall
  `DisplayName`) and "where is it" (`Find-Anki`: usual folders → PATH → registry) are separate**: the MSI records
  no `InstallLocation`/`DisplayIcon`/App Paths. Every step is skip-if-present.
- **`scripts/install-ankiconnect.ps1` is the ONE implementation**: dot-sourced by `setup.ps1`, run with
  `-Install` by the server (prints one JSON line). Sources: AnkiWeb
  (`https://ankiweb.net/shared/download/2055492159?v=2.1&p=<numeric point version>`; bare
  `/shared/downloadFile/<id>` 404s) then the GitHub repo zip (payload folder LOCATED under
  `<repo>-master/plugin/`). Staged in TEMP, copied into `%APPDATA%\Anki2\addons21\2055492159` (honors
  `ANKI_BASE`) only after the `webBindPort` signature verifies. Seeds `meta.json` with no `config` key so
  AnkiConnect's 127.0.0.1:8765 defaults win (the `/api/anki` proxy is server-side, so CORS is irrelevant).
  Idempotent: never overwrites an existing add-on.
- **Detection is by SIGNATURE** (`Find-AnkiConnect`: any `addons21/*` whose `config.json` mentions
  `webBindPort`), not add-on code: forks like "Anki Connect Plus" (2036732292) conflict with 2055492159.

## Anki setup states and the AnkiWeb account
`/api/ankiconnect` GET reports `{installed, addon, base, canInstall, configured, ankiRunning, ankiMainWindow,
ankiAwaitingInput, ankiDialogs, ankiLauncherStuck}`; POST installs. `renderAnkiOfflineBanner` branches on it,
in this priority:
1. **Launcher stuck** (`ankiLauncherStuck`, see Anki updates).
2. **Anki waiting on a dialog** (`scripts/anki-state.ps1`): the main window is titled `"<profile> - Anki"` and
   exists only once a profile is open; first-run dialogs are plain `"Anki"`. Running + plain-"Anki" window + no
   main window = stopped on a question. Names the dialog.
3. **Anki not set up**: no `<profile>/collection.anki2` under the Anki base (`configured:false`). **Not
   `prefs21.db`**: Anki creates that at the very start of first run (`profiles.py` `_loadMeta`). Shown as
   numbered steps ending on signing in to AnkiWeb.
4. **Add-on states, each with its own sentence**: missing → "Install it for me"; on disk + Anki running but
   not answering → "close Anki completely and reopen" (add-ons load at startup); on disk + Anki not running →
   "start Anki"; disabled in `meta.json` → "enable under Tools > Add-ons".
Every state has **Open Anki** (`/api/anki-focus`; when there's no window it STARTS Anki via `/api/anki-start`,
detached) and an install that doubles as a repair.
- **AnkiWeb account** (optional; until signed in, cards exist on one computer). `ankiSyncAuthState()`:
  AnkiConnect's `sync` checks `mw.pm.sync_auth()` first and raises `"sync: auth not configured"`, so the probe
  is free when signed out and a normal sync when signed in. Probed ONCE per machine (`signed-in` remembered in
  `localStorage('ebiki-ankiweb')`). The in-flow banner is an offer: create an account (real browser), **Sign in
  inside Anki**, I've signed in, Not now (`ebiki-ankiweb-later`).
- **Ebiki NEVER handles an AnkiWeb password** (AnkiConnect has no login action; adding one would route a
  password through Ebiki). It only raises Anki's window (`scripts/focus-anki.ps1`: main window only, SW_RESTORE
  + SetForegroundWindow) and says which button to press. The banner states this.
- Neither route is in `DATA_ROUTES`.
- **The `/api/anki` proxy times out** (2 min; 15 min for `sync`). AnkiConnect answers on Anki's UI thread, so a
  modal dialog in Anki means NO answer at all; without the timeout callers waited forever and boot-watcher
  pings piled up. The timeout reply tells the user to answer the window Anki is showing.

## Anki updates are Ebiki's job (`scripts/anki-update.ps1`)
The website install (`%LOCALAPPDATA%\Programs\Anki\anki.exe`) is a LAUNCHER; real Anki is a uv venv in
`%LOCALAPPDATA%\AnkiProgramFiles` pinned by its `pyproject.toml`. When an install is pending (no
`.sync_complete`, or a `.want-launcher` trigger from Anki's own update dialog) the launcher opens a terminal
menu that dead-ends: "Latest" pins `anki-release` to the newest `aqt` version, which may not exist (2026-09:
aqt 26.9.3, anki-release 26.5), and older launchers write `requires-python = ">=3.9"` though anki 26.x needs
3.10+. So `Start-AnkiIfNeeded` runs `Update-AnkiIfOffered` BEFORE starting Anki:
- **Target = newest INSTALLABLE**: newest stable `anki-release` on PyPI that also exists for `aqt`. No betas/rc.
- **Asked in the splash**: `Ask-InSplash $text $timeout $title $yesStatus` → status form `ASK|title|yes
  status|question` (`PROMPT|` stays the Ebiki-update form). "Update now" is focused. A declined version goes in
  `.anki-update-declined` (gitignored) until a newer one ships; a timeout records nothing.
- **Installs silently** with the launcher's command: `uv sync --upgrade --no-config --managed-python --python
  <.python-version>`, cwd = root, `UV_CACHE_DIR`/`UV_PYTHON_INSTALL_DIR` = root's `cache`/`python`. pyproject
  written UTF-8 without BOM, `requires-python` from `.python-version`. Status every 10s, 15 min cap. uv output
  → `logs/anki-update-uv.*.log`, decisions → `logs/anki-update.log`.
- **Never leaves Anki broken**: success = `aqt-<ver>.dist-info` exists, then touch `.sync_complete` AFTER the
  pyproject. Any failure re-pins the installed version, re-syncs, and sets the marker. A stuck launcher (marker
  missing, OR a `.want-launcher` trigger left by Anki's own update dialog) is repaired the same way when
  nothing is offered or the user declines.
- Skipped: classic installs (no `uv.exe`), no venv yet, a `mirror` file, offline.
- Anki's own in-app update still restarts into the launcher console; the next Ebiki launch repairs failures.
- **Stuck launcher console** (`scripts/anki-start.ps1`, dot-sourced by `launch.ps1`, run with `-Start` by
  `/api/anki-start`): `Get-StuckAnkiLauncher` = an `anki-console` ≥15s old, AnkiConnect not listening, no real
  Anki (python under `*Anki*`), no `uv` running. `Start-AnkiIfNeeded` closes it, updates/repairs, starts Anki.
  Reported as `launcherStuck` → `ankiLauncherStuck`.
- **One at a time**: `Start-AnkiIfNeeded` holds mutex `Ebiki.Anki.Start` (body `Start-AnkiIfNeededLocked`),
  taken BEFORE launch.ps1's server mutex; wait capped at 20 min. (Two simultaneous launches both ran `uv sync`
  and both started Anki.)

## "Ask AI" mode edits (review flow)
Cards and Study panes have an **Ask AI** box. `proposeModeEdit(instruction, scope)` returns a proposal shown as
a before/after word diff (`diffWords`) with ✓ Accept / ✗ Deny (or refine). `acceptModeEdit()` applies via
`updateActiveMode`. Scopes: `cards` (fields/templates/tagRules), `study` (questionPrompt/ratingRules).

## Anki's "Collection sync complete." toast
From Anki's source (checked on 25.09.4; this machine runs 26.5): `aqt/sync.py` calls
`tooltip(parent=mw, ...)` after a no-changes collection sync; `aqt/utils.py::tooltip()` sets
`Qt.WindowType.ToolTip`, which is **always-on-top** (native class `Qt6xxQWindowToolTipSaveBits`, ex
`WS_EX_TOOLWINDOW|WS_EX_TOPMOST`), 3s, positioned at the bottom of Anki's MAIN window. **Both Anki and Ebiki
trigger it**: Anki auto-syncs on profile open/close (`maybe_auto_sync_on_open_close`), and AnkiConnect's
`sync` is `onSync()`. The 5-minute periodic sync is media-only (no toast). Upstream bug `ankitects/anki#4188`;
no setting disables it. Two fixes:
- **Fewer syncs.** `ankiSyncSoon()` (`src/utils/anki.js`) COALESCES: each call restarts an 8s quiet timer,
  90s max-wait. Fire-and-forget, never throws. **Call `ankiSync()` directly ONLY when the result is needed
  before continuing**: the awaited pre-session pull (`syncFromAnkiWeb`) and the post-ratings sync that re-reads
  Anki.
- **Demote what still appears.** `scripts/anki-toast-behind.ps1`, spawned by the dev server on Windows (covers
  both launch modes), killed with it. `SetWindowPos(toast, ankiMainWindow, SWP_NOACTIVATE)`: a non-topmost
  `hWndInsertAfter` strips `WS_EX_TOPMOST` (`HWND_BOTTOM` wouldn't) and keeps Anki's own position. <30ms,
  0.6% of a core at 100ms polls. **Three load-bearing rules**: (1) only windows whose class contains
  `QWindowToolTip` AND are topmost; (2) do NOTHING while Anki is the foreground app (same class = Anki's hover
  tooltips); (3) demote, never minimize/hide. Match the version-independent substring (`Qt691` changes per
  Anki release). **Skipped under `VITEST`** and `unref()`'d (a live child blocks the test runner exiting).

## Ebi Studio (conversational mode create / edit / deck prompt)
`src/components/ModeStudio.jsx`, opened via SettingsModal's `openModeStudio(cfg)` prop (App holds `modeStudio`,
renders `<ModeStudio>` near HelpChat):
- `kind:'create'` (Learning modes, "Design in depth with Ebi"); `kind:'edit', focus:'all'` ("Edit this mode with
  Ebi"); `focus:'cards'` (Cards pane, "Design the deck prompt with Ebi"); `focus:'study'` (Study pane).
- `askAI` = `aiCall(..., resolveModel('chat'), {maxTokens:2000})`. Ebi asks 1-3 follow-ups, then replies with a
  summary plus a hidden `<mode>{json}</mode>` block, parsed (`parseAiJson`) into a review card. Only **Apply**
  persists, via `applyStudioSpec(spec)`.
- `buildModeFromSpec(spec, existing)` (next to `createMode`) mirrors createMode's fallbacks and merges
  field-by-field, so an EDIT keeps unchanged values and never flips `type`. CREATE mints an id then
  `saveModes([...modes, built], id)`; EDIT does `updateModeById` + `setActiveModeId`. Spec = full mode config
  (name/type/description/fields/templates/tagRules/studyRules/chatSuggestions/mnemonicHints/tagCategories/
  discoverKinds).
- vs `proposeModeEdit`: that's a one-shot field diff; Studio is the multi-turn superset.

## Onboarding
No `onboarded` flag → `src/components/OnboardingWizard.jsx`: welcome → app language → light/dark → how Ebiki
opens → AI provider + key ("Advanced" custom model) → intelligence preset → first mode (`createMode`) → finish.
Re-runnable from Settings → General. The step body is CALLED (`{Body()}` in a Fragment keyed by step), never
rendered as `<Body />`: a component declared inside another is a new type every render, so React remounted
the step on each keystroke and the key field lost focus. Same rule anywhere: no components declared inside
components.

## Modes & knowledge base (per mode, gitignored)
- `modes/<name>/config.json`; knowledge in `modes/<name>/knowledge/`, served by `/api/modes/knowledge`
  (always `?mode=<activeMode.name>`). The whole `modes/` folder is gitignored. Missing folders never break:
  `mkdirSync(MODES_DIR, {recursive})` on demand; App falls back to an in-memory `defaultMode`.
- **Mode folders: `modeFolderName` + `writeModeFolders` (vite.config.js), used by `/api/modes` AND the
  knowledge endpoints.** The POST removes every folder the list does not name, so: a RENAME moves the old
  folder (found by id among the folders about to be removed; writing the new name and sweeping the old one
  deleted the knowledge base); names compare case-insensitively on Windows/macOS (a case-only rename deleted
  the mode); trailing dots/spaces are stripped (Windows drops them, so "Intro to C." was swept), "."/".."
  can't escape (".." wrote a mode over config.json), device names get "_". Tests: `mode-folders.test.js`.
- **Mode names are unique** (`uniqueModeName`, " 2" suffix on create/Studio; rename refuses a clash via
  `modeNameKey`): two modes with one name share one folder. **Name-keyed stores follow a rename**
  (`migrateModeStores`: hooks, grammar, profile, ledger, instant cache; only into an empty store, only from a
  real read). **Modes POSTs are serialized** (`postModes`, whole-list writes could land out of order) and
  knowledge reads await `modesSaveRef` (a rename's folder move must land first). Every modes write goes
  through the live refs, never the render-time `modes` (`setAnkiDeck`, `createMode` after its AI call).
  Config saves are serialized the same way (`configSaveRef`). `createMode` returns true/false (onboarding
  stays on its step on false).
- **The knowledge base flows APP-WIDE**: `modeKnowledge` (loaded on mode switch, refreshed on
  upload/delete/toggle) + `knowledgeBlock(cap)` inject it into Chat, `generateCards`, `evaluateCardAnswers`,
  Discover (profile + suggestions), Help (12k cap), Picture click-to-explain (4k cap). Default
  `KNOWLEDGE_CAP` = 60,000 chars (~15k tokens).
- **Whole-book KBs: TOC-guided retrieval.** Above the cap the server extracts an `outline` (GET
  `/api/modes/knowledge`; sections via GET `/api/knowledge-sections?sections=i,j`) from markdown headings,
  "Chapter N" lines, numbered "1.2 Title" lines, OR a file NAMED like a TOC (`toc.txt`, "table of
  contents.md") whose lines (page numbers stripped) are located in the other files. Client
  `getKnowledgeContext(task, cap, cacheKey)`: selector call (`resolveModel('general')`) picks 1-4 sections,
  cached in `knowledgeSelectRef` (question-gen and grading share `card:<front>` keys). Small KBs bypass it.
  Big TOC-less KBs truncate and Settings → Knowledge shows a ⚠️ (`knowledgeStatus`,
  `knowledgeBigNoToc`/`knowledgeBigToc`). Sync callers (`knowledgeBlock`/`knowledgeRaw`) get the TOC text for
  big navigable KBs instead of blind truncation.
- **`downscaleDataUrl` paints white before drawing to JPEG** (JPEG has no alpha; transparent PNGs turned
  black and vision OCR read nothing). Opaque images are unchanged.
- **PDF upload**: text extracted CLIENT-side (`src/utils/pdf.js`, `pdfjs-dist` lazy-imported), stored as
  `.txt`; the server stays plain-text. Lines are rebuilt from y-positions + `hasEOL` so headings land on their
  own line. Progress via `knowledgeBusy`/`pdfExtracting`; image-only PDFs rejected (`pdfNoText`). No space is inserted
  between two Chinese/Japanese items (`CJK_END`/`CJK_START`); Hangul keeps the space rule.

## Discover tab (adaptive new-card engine)
- **Learner profile is scoped to the current mode.** Chats are tagged with `mode` on save
  (`chatTabSaveCurrent`; the server persists it; rename keeps it); `buildLearnerProfile` reads only
  `s.mode === activeMode.name` chats (untagged legacy chats excluded).
- **Free text is in the APP language and dash-stripped**: `buildProfilePrompt`/`buildSuggestionPrompt` take
  `userLanguage` (`userLangName()`) for `summary`/domains/`why`/`draftMeaning`/`translation`. Never hardcode
  English. **Adjust** (`onAdjust`) is a brand-colored `← Adjust` back button.
- **Suggestion kinds for every mode.** Language: word/phrase/idiom/verb/grammar/both (rules in
  `buildSuggestionPrompt`, `src/discover/prompts.js`). General: AI-generated `activeMode.discoverKinds`
  (`[{key,label,rule}]`), made once by `ensureDiscoverKinds` on first visit (in-flight guard per mode id, retry
  only on failure, `updateModeById`); static term/acronym/comparison/scenario fallback. The kind's `rule`
  overrides the static table (`customKind`). `discoverConfig.difficulty` = `easier|level|stretch`.
- **Deck switcher** (`discoverDeck`, `''` = mode deck): re-profiles against that deck
  (`buildLearnerProfile(deckArg)`), rebuilds exclusions, and `saveDiscoverCard` saves there. Resets on mode
  switch.
- **Instant-paint cache** (`localStorage('ebiki-discover-cache')`, last profile+ledger per mode): the real
  blobs live in Anki media (async). **The mode-switch reset effect and the init effect must BOTH be
  `useLayoutEffect`** in one pre-paint flush (reset → cached paint → init); making only one a layout effect
  brings back the blink and breaks re-init (`discoverInitRef`). Cache writes skip `null`/`DEFAULT_LEDGER`.
  Doubles as the offline fallback.
- **`writeBlob` (`src/discover/storage.js`) does NOT sync.** Storing the media file already persists it
  locally; the ledger is written on every `fetchNextSuggestion`. Pass `{ sync: true }` only when worth pushing
  now. Anki syncs when the user actually adds a card (`saveDiscoverCard`).
- **Actions**: Make Card / I Know This (`known`) / Skip (`declined`: excluded forever) / Next (advance without
  recording). All via `discoverExcludeList`.
- **Dialect + mode language**: `fetchNextSuggestion` appends `dialectRule()`; `buildCardFields` (Discover +
  Picture card generator) injects `dialectRule()` and derives `srcLang` from `learnLangName()` for language
  modes (not the global translation `language`). Verify pass parses with `parseAiJson`; `saveDiscoverCard`
  formats the back with `cardBackToHtml`.

## Ebi the mascot & poses
- Poses in `public/assets/shrimp/`, registered in `src/config/shrimp.js` (`SHRIMP`). `DEFAULT_SHRIMP =
  'shrimp.png'` (neutral; the AI's `"default"`). `IDLE_SHRIMP = '6820-holeshrimp.png'` (Help panel's resting
  pose).
- **`choosePose(text)` (App.jsx) is the ONLY thing that sets a pose**, exactly once per call (no flicker):
  with a key → the "Mascot" AI role (`resolveModel('pose')`, user-configurable) returns a pose name; without
  a key / on error → `pickShrimp(text)` (whole-word keyword match, never substrings). Used by chat, study
  question, feedback, Help (`onAiReply`), Picture word, Discover. Ebi reacts only to ASSISTANT messages.
- Empty-state defaults: Picture → camera, Study → book, Chat → singer (`poseFile('…')`), bare PNG, no glow.
- Study companion: big Ebi beside the question with **Ask Ebi** (`askEbiSignal` → HelpChat). Pose precomputed
  per question (`q.pose`) so it changes once, with the question.
- **Help mascot (`helpMascot`) is decoupled from the study pose (`studyMascot`).**

## Ebi's Help chat (`src/components/HelpChat.jsx`)
- **Screen context is GATED BY `activeTab`.** `buildSystemPrompt` opens with ">>> RIGHT NOW the user is
  looking at THE <tab> SCREEN <<<" and emits only that screen's detail. `studyActive` stays true across tabs,
  so the live question is "ON SCREEN" only when `tab==='study'`; elsewhere it's a "Background only" note.
  `appContext` (bottom of App.jsx) must stay CURRENT: live study question (from `currentQuestion` +
  `studyCardState`, NEVER the legacy always-empty `studyQueue`), `studySession`, `deckBrowser`, `discover`,
  `stats`. **New tab → add its `SCREEN[...]` label AND a tab-gated detail block.** Expected answers are SECRET
  unless the user explicitly asks.
- **Help can ACT**: `<action>{...}</action>` tags are parsed/stripped in `sendMessage` → `onAction` prop → App
  applies via pinned refs (`activeModeIdRef` + `updateModeById`). Types: `question_preference` (save a
  question-style rule), `set_dialect` (`studyRules.dialect`, language modes), `deck_edit` (opens Deck, prefills
  ✨ Ebi bulk edit, `pendingDeckEditRef` runs the PREVIEW once notes load; writes nothing itself). New action =
  CAPABILITIES text in `buildSystemPrompt` + `onAction` branch + a receipt. Keep composer wording action-y.
- **Verified receipts**: `onAction` returns an app-authored "what changed + what it affects" string only when
  the change applied (else null); `sendMessage` appends a "✅ Confirmed changes (applied by the app)" block.
  New actions MUST return a receipt.
- Opened by the header's **"Talk to Ebi"** button (after the Stats tab), which bumps `askEbiSignal`. With no button the panel docks bottom-left (`getChatStyle`). Rendered
  with `hideButton={true}` (the old floating button path still exists behind `!hideButton`). Header shows Ebi
  (~46px, negative margins) to the right of the title, using `helpMascot` (default `IDLE_SHRIMP`).
- **In character**: `HELP_BASE` speaks as Ebi; never calls itself a "mascot".
- **HARD RULE: Ebi NEVER emits a shrimp emoji.** Forbidden in prompts (HELP_BASE + Chat `systemPrompt`) AND
  code-stripped (`[🦐🦞🦀]️?` alongside the em-dash strip in HelpChat `sendMessage` and Chat `cleanText`).
  Other emoji are fine.
- Scrolls to bottom on open.
- **Docking**: drag the header (⠿) or click ◣ to pick **Dock left** / **Dock right** / **Under the question**;
  previews come from one shared `ZONE_RECTS`. Sizes are viewport-relative (`clamp(250px, 24vw/1.35, 380px)`;
  /1.35 undoes the body zoom). Esc cancels; dropping in open space floats. `snapZone` = `null` | `left` |
  `right` | `bottom` | `free`.

## ⭐ HOW TO ADD A BUTTON
1. **Base style** from `S` (`src/styles/theme.js`), spread then override:
   - Ghost/action (most buttons): `{ ...S.ghostBtn, fontSize: 10-12, color: <accent>, borderColor: <accent
     ~.3 alpha> }`. Accent is a CSS var, never hex: `--c-danger` destructive · `--c-warning` caution/session ·
     `--c-brand` primary-ish · `--c-purple` AI/insight · `--c-success` Anki/save · `--c-ink-dim` neutral.
   - Solid CTA (max one per screen): `{ ...S.captureBtn, borderRadius: 6-8 }` + `className="btn-press"`.
2. **Hover is AUTOMATIC** (global rule darkens non-disabled `<button>`, `<select>`, checkboxes). Only add:
   `click-dim` on clickable `<div>`s; `ui-btn` to also deepen a ghost border; `ui-tab` for nav tabs with
   `ui-tab-current` on the active one; `card-head` for clickable card headers (controls inside need
   `stopPropagation`). `.hover-dim` is a legacy no-op.
3. **Never animate position on hover.** Only `.btn-press` moves, on `:active`.
4. **Disabled** = `opacity: .5` + `cursor: 'default'` + the real `disabled` attr.
5. **Labels** via `t('key')` in all four languages where the surface is localized. Leading emoji OK.
   Explanations: `className="tip" data-tip="…"` on a ⓘ span, NEVER a bare `title` (1s delay); no
   `overflow:hidden` on ancestors.
6. **Never `boxShadow: 'none'` on a hoverable control** (an inline shadow overrides the inset-shadow hover).
   Only `...(active ? { boxShadow: SHADOW.sm } : {})`.
7. **Segmented controls**: the selected segment gets `ui-tab-current` + `cursor: 'default'`.

## ⭐ HOW TO ADD A NEW EBI EMOTE
1. Put the image in `public/assets/shrimp/` (`.png`/`.webp`).
2. Add one `SHRIMP` entry in `src/config/shrimp.js`:
   ```js
   { name: 'ninja', file: '12345-ninjashrimp.png',
     keywords: ['ninja', 'stealth', 'shuriken', 'martial arts', 'sneak'] },
   ```
   `name` (unique, lowercase) is auto-added to `POSE_NAMES` so the Mascot AI can pick it; `keywords` drive the
   fallback (add synonyms + some Spanish). `poseFile` and the pose prompt derive from `SHRIMP` too.
3. Keep entries non-overlapping (ties break by a stable text hash). Sanity-check by importing `pickShrimp` in
   node, or `npx vite build`.

## Picture tab (vision OCR, Tesseract for boxes)
- With a key, `analyzeImage` → `analyzeImageVision`: one `aiCall(..., VISION_OCR_PROMPT, payload,
  resolveModel('picture'), { images:[part], maxTokens:8000 })` returning each word with in-context
  `t`/`sense`/`alts`/`s`/`c`/`p`/`r`, a reading-order `line`, and a normalized `box`. Without a key:
  `analyzeImageTesseract` (offline fallback).
- **Multimodal plumbing**: `aiCall` takes `opts.images` (`[{mediaType,base64}]`) + `opts.maxTokens`, passed to
  every provider `call()` (Anthropic image blocks, OpenAI/Grok `image_url`, Gemini `inline_data`). Helpers in
  `src/utils/image.js` (`dataUrlToImagePart`, `downscaleDataUrl` ≤1500px).
- **Boxes come from Tesseract**: `getTesseractBoxes` runs in parallel; vision words snap to the matching box
  (normalized text, nearest center) → `_snapped`; unmatched get `_approxBox` and aren't drawn by `renderWordOverlays` (still in
  the reading panel).
- **Reading panel** (`ocrLines`, grouped by `line`) below the image; chips share `hoveredIdx`/`pinnedIdx` with
  the overlay. Click shows `sense` (green) + `alts` (purple). JSON via `parseAiJson` (+ `salvageJsonObjects`).
- UX: inline **Ask Ebi** + **✕ Exit** in the toolbar when done; Esc exits; switching tabs clears
  pinned/hovered/expanded.
- **Overlay status** (`GET /api/launch-overlay`, polled every 3s): the tracked process, else an overlay found by
  its COMMAND LINE (`electron.exe … main.cjs --overlay`, cached 15s). Never "any electron.exe": the app window
  and apps like VS Code are Electron too, which lit the header's overlay indicator while it was off.
- **Empty state centers on any screen**: `S.emptyState` uses `flex:1` + `minHeight:'min-content'`, and the
  Picture `<main>` is a flex column only while `stage==='idle'`. `emptyState` is used only here.
- **Zoom-aware tooltips**: body has `zoom:1.35` (non-overlay); rects/`clientX` are real px, `left/top` are
  layout px, so divide by `getZoom()` and clamp pinned popups to the zoom-adjusted viewport.

## State persistence across refresh
- **No-flicker first paint**: a blank themed `<div>` until `configLoaded` (just before the main `return`).
- Persisted: `activeTab` + settings → `config.json`; `activeModeId` + modes → `modes/_meta.json`; open chat →
  `localStorage('ebiki-chat-session')`; deck browser deck → `localStorage('ebiki-deck')`; study session →
  `localStorage('ebiki-study-session')`.
- **Study resume**: snapshot written on change, gated by `studyHydrated` (so it can't clobber before the
  one-shot restore). Cleared when `studyActive` ends. **Expires** after `STUDY_SESSION_MAX_AGE_MS` (8h; missing
  `savedAt` = stale). A valid restore SANITIZES: unsynced `gradedAt` re-stamped to now; cards stuck
  `evaluating: true` re-graded via `resumeReEvalRef` → `evaluateCard`; `currentQuestion` validated or nulled.
  A **stall-rescue effect** (near `startBatch`, guarded by the `pullsInFlightRef` counter around
  `pullNewCardInner`) pulls a card whenever the question phase has nothing to show, nothing evaluating, no pull
  in flight, and cards left.
- `overlayEnabled` (config, default ON, auto-launches once).
- **Capture shortcut is `Alt+Q` only** (`electron/main.cjs` + a web keydown handler): opens the overlay, drag to
  select, Esc dismisses. There is no `Ctrl+Shift+A` binding.

## Card generator (shared, language-agnostic) + Quick Add
- `generateCards(words)` works for any language/subject. **Language modes** → `LANGUAGE_CARD_PROMPT` with
  `learnLangName()` (from `studyRules.studyLanguage` / app `language` / mode name) and `userLangName()`
  (`APP_LANG_NAME[appLanguage]`); back labels are written IN the learned language (Pronunciación, Aussprache,
  发音). **Other modes** → `GENERIC_CARD_PROMPT` with the mode's `description`, `backTemplate` (fixed format
  when it has `{placeholders}`) and `tagRules`. Returns `{ front, back, tags, correction }`. `cardBackToHtml`
  bolds each line's leading `Label:` in any script (`^([^:\n]{1,30}):`). Added via `ankiAddNote`
  (allowDuplicate for Quick Add) + sync; `ankiCanAddNote` pre-check only warns.
- **General modes write card content in the APP language** (`{USER_LANG}` in `GENERIC_CARD_PROMPT`,
  `contentLangRule` in `buildCardFields`, the Chat `<anki-card>` general format). Front term, proper nouns,
  code, formulas and tag tokens stay original. `createMode` also writes `chatSuggestions` and the
  `questionPrompt`/`mnemonicHints` instructions in `userLangName()`.
- **An empty template placeholder must not ship its punctuation** (`frontTemplate` default `{word} ({partOfSpeech})` → `word ()`).
  `buildCardFields` asks for `partOfSpeech` when a template needs it and the caller left it blank (in the
  learned language for language modes), and `cleanTemplateGaps` strips EMPTY bracket pairs from front and back
  (only empty ones).
- **Accuracy guardrail (cards get MEMORIZED)**: `verifyCards` is a second pass that fixes nonexistent/misspelled
  words, wrong gender/translation/example, dishonest usage tags. Card + chat prompts say "never invent words,
  verify, admit uncertainty".

### Usage tags (`src/tags/usage.js`): where, how often, in what context
A definition alone teaches the wrong thing ("anegada = flooded" but natives say "inundada"; a Mexico-only word).
Three families on every language card and the tapped-word lookup, in this order:
- `region-*`: `region-global` if natives everywhere use/understand it in the card's sense, else
  `region-<place>` (`region-spain`, `region-mexico`, `region-latam`, …).
- `freq-*`: MANDATORY, exactly one of `FREQ_SCALE`: `freq-core` / `freq-common` / `freq-uncommon` (known,
  rarely said) / `freq-rare` (literature, specialized, old).
- `register-*`: only when genuinely restricted, from the CLOSED `REGISTERS` list (literary, political, legal,
  medical, technical, academic, slang, archaic, …). Neutral words get none. Closed so Anki's tag tree stays
  clean.

Where the rule lives (keep in sync): inline in `LANGUAGE_CARD_PROMPT`'s tags line (Quick Add, tapped-word
cards, conjugation add); `usageTagsRule()` next to `dialectRule()` (Chat `<anki-card>`, `buildCardFields`,
bulk-edit framing, appended even over custom `tagRules`); `usageTagsContract()` + `usageTagsVocab()` (JSON
contract for lookup + check). Every prompt makes the model state `usageEvidence` BEFORE the tags. Distinct
from the DIALECT (which variant content is written in).
- **Over-claiming is the harmful direction** (a false "everyday/universal" makes the learner SAY it). Unsure →
  name only regions it can back, pick the LESS common frequency. `verifyCards`/`verifyDeckRecs` demote doubtful
  claims and delete unbackable tags.
- **Double-check on the lookup path**: `checkUsageTags` answers from scratch WITHOUT seeing the first pass's
  tags; `reconcileUsageTags` (pure, vitest-covered) merges in code: freq → less common (flagged if ≥2 steps
  apart); region → intersection (`global` vs specific → specific; disjoint → union, flagged); register only if
  both named it. Unconfirmed tags still render, gray-dashed with "?" and a tooltip. Fail-soft.
  `deriveUsageTags` (two parallel reads) covers untagged legacy cards; `resolveCardUsageTags` prefers the
  card's own Anki tags, cached per session in `usageTagCacheRef`. `studyWordMakeCard` carries the CONFIRMED tags
  onto the new card.
- **Region sets spanning the language collapse to `region-global`**: `collapseSpanningRegions` + the
  `REGION_SPANS` data table (spanish = spain+latam, portuguese = portugal+brazil, english = uk+us, …; data, never
  `if (lang === …)`). Prompts forbid spelling global the long way, and `foldUsageTags` (normalize + collapse)
  is the funnel every tag producer goes through. `analyzeDeck` collapses PROPOSED tag lists (only when tags were
  proposed).
- **🏷 Tag audit** (deck browser, language modes): `usageTagAuditInstruction()` runs through the full bulk-edit
  pipeline (batched, verified, chip diff, accept per card). TAGS-ONLY (no `recommendedFields`) and must carry
  over every non-usage tag (`recommendedTags` replaces the whole list).
- **Rendering**: `renderUsageTagChips` (App.jsx) using `sortTagsUsageFirst` (region → freq → register first),
  `usageTagStyle` (green = safe: `region-global`/`freq-core`/`freq-common`; amber = heads-up; gray-dashed =
  unconfirmed), `usageTagTip`. Used by chat `<anki-card>`, Quick Add tray, deck rows, Picture widget,
  tapped-word popup (lookup chips + card preview), Learn-it moment, Discover preview (`DiscoverPanel.jsx`
  imports the helpers). **New tag-chip surfaces must use these.** The popup and Learn-it panel show the FULL
  tag row (`otherTags`: part of speech, level, topic, ebiki), kept separate because only usage families are
  double-checked.
- **Tooltips are i18n'd** (`tag_*` keys, all four dicts). `usageTagTip(tag, {unverified, t})` returns '' with
  no `t`. `usage.test.js` asserts every tag resolves in en/es/zh/ja.
- **The live study question shows usage tags** (left of the progress dots), filtered by `isUsageTag` so a topic
  tag can't leak the answer. `cardsInfo` has no tags, so `loadStudyCardTags` reads them with ONE batched
  `notesInfo` per session (also warms `usageTagCacheRef`). No derivation fallback here (would stall the
  question); the Tag audit fixes untagged cards.
- `normalizeUsageTags` folds invented spellings (`region-usa` → `region-us`, `register-politics` →
  `register-political`) and drops junk from `generateCards` output and bulk-edit recs, but NEVER touches a tag a
  card already carries.

### Preferred-term honesty
A card must never teach the headword as the everyday word for a meaning a synonym dominates in the studied
variant ("barro = mud": LatAm says "lodo"; barro leans clay). Distinct from usage tags (where) and dialect
(which variant). Per translation: is this what a speaker actually says for THIS meaning?
- `LANGUAGE_CARD_PROMPT`: translations ordered by which senses the headword owns; the usage line is REQUIRED
  when a listed sense is synonym-dominated, naming the preferred word.
- `preferredTermRule()` (next to `dialectRule()`, dialect-aware) in `generateCards`, `buildCardFields`, Chat
  `<anki-card>`, and `lookupStudyWord` (`usage` required when a more common word exists for the in-context
  sense).
- `verifyCards` enforces it ("technically true but misleading" = wrong); the question generator never quizzes a
  synonym-dominated sense as the word's identity.
- Existing decks: **🌎 Dialect audit** (deck browser, language modes) = `analyzeDeck('custom',
  dialectAuditInstruction())` through the bulk-edit review; most cards are skipped.

### Quick Add and chat cards
- **Deck → ⚡ Quick Add** (`quickAdd*`): paste words → `generateCards` → review tray (editable front/back/tags,
  one include ✓/○ toggle, "Add N to {deck}", dup/correction badges). Header shows Mode and target Deck.
- **Chat cards**: the chat prompt gives the format and splits multi-meaning words; rendered as `<anki-card>`
  widgets; `chatTabSyncCard` formats + syncs. Button names the target deck (`chatCardDeck()` = composer "Attach
  deck" → `activeMode.ankiDeck` → first deck → `Default`): "+ Add to Anki → deck «name»", then "✓ Added to
  «name»".
- The composer's **"Attach deck…" dropdown is ALWAYS rendered** (disabled with an "Anki isn't open" note when
  disconnected). Once attached, the "Attached: <deck> (<n> cards)" chip replaces it IN PLACE (not at the top
  of the pane). i18n `chat_attached`/`chat_attachedOne`.

## Chat
- **"+" menu**: attach photo, web search, per-mode **Focus** (Tutor/Translator/Card-maker/Quiz-master/Free),
  **Level**, **Explain-in** language, **Chat model**. Focus/Level/Explain live on `activeMode.chatPrefs`
  (`setChatPref`) and go into the system prompt in `sendChatTabMessage`. The model picker writes
  `aiModels[provider].chat` (same override as Settings → AI models); "Default (…)" names
  `ROLE_DEFAULTS(pc).chat`.
- **Images**: `chatTabImage` (photo menu, or drop/paste while on Chat; `handleDrop`/paste route there). On send,
  images from the last 4 user messages ride along as `opts.images` (downscaled).
- **Layout**: bubbles capped ~620px with `overflow-wrap:anywhere`; assistant replies show a 96px Ebi (`m.mascot`)
  to the right. Only assistant content renders markdown.
- **Scroll**: sending pins the latest USER message to the top (`scrollChatToLatestTurn`), sizing
  `chatSpacerRef` to `clientHeight − turnHeight` via `offsetTop`; recomputed after paint (double rAF) and on
  resize. The composer is never disabled while loading (would blur); refocused after send.
- `choosePose` is awaited so pose and text appear together. Dashes stripped from output.
- **Offer-to-search**: with web search OFF the model emits `<offer-search>query</offer-search>` instead of
  guessing; Yes (`chatOfferSearchAccept` → `/api/web-search`) / No (`chatOfferSearchDecline`).
- **A search that never ran is a FAILURE, not "no results".** `/api/web-search` scrapes DuckDuckGo's HTML
  (entities decoded); when DuckDuckGo answers a bot check instead (HTTP 202, "anomaly" page) it returns 502
  `{error}`, and both chat paths tell the user the search failed rather than that the web had no answer.
- **Markdown**: `src/components/Markdown.jsx` (`marked` + `DOMPurify`), themed by `.md-body`. Assistant only;
  user text literal (`pre-wrap`). `<anki-card>`/`<sources>`/`<progress-update>` are stripped first.

## Study → Anki sync
### Driving Anki's real reviewer (`doSyncRatings`)
Not `answerCards` (it throws "not at top of queue" for out-of-order or new cards). Instead
`ankiGuiDeckReview(deck)` → loop `ankiGuiCurrentCard()` → `ankiGuiShowAnswer()` → `ankiGuiAnswerCard(ease)`,
matched by `cardId`. Anki computes the interval. `guiCurrentCard().buttons` is an ARRAY of valid eases: cap to
`Math.max(...buttons)`. `ankiGuiDeckBrowser()` returns Anki to the deck list. Syncs are serialized
(`syncChainRef`); each card is answered EXACTLY ONCE with its FINAL rating.
**Integrity guarantees** (duplicates once compounded 1d → 3.3y):
1. `studySyncedIdsRef` (only `markSynced` writes; only session start/exit clears) filters every sync. The
   `synced` flags are UI-only and can be clobbered; never rely on them.
2. A card the reviewer never presented: ask Anki first (`cid:X (is:due OR is:new)`); not due → already
   recorded, `markSynced` + skip.
3. Unreachable card fallback: NEW → `setDueDate <days>!` + `insertReviews`. REVIEW → a bare `setDueDate "0"`
   nudge (no `!`, interval preserved) and answer via the real reviewer. If still blocked (unrelated due card
   ahead, daily limit), record a **one-step SM-2 interval from the card's own `interval × factor`**
   (`ankiCardsInfo`; Easy +30%, Hard ×1.2, Again 0) via `setDueDate <newIvl>!` + `insertReviews`. At most once
   per card per session.
**The `!` suffix is REQUIRED on recording paths** (sets the interval, not just the due date); the `"0"` nudge
deliberately omits it.

### Grace window + lock
- `gradedAt` stamped at grading. Grace window `studyAutoSyncMinutes` (default 5), then auto-sync and **lock**
  (`🔒 Synced` badge replaces the rating control). Triggers, all `syncGradedNow()` → `syncRatingsToAnki()`:
  auto-timer (armed to the oldest pending deadline; full flush), manual "Sync N to Anki now", Finish/Exit.
- Global settings `studyAutoSync` + `studyAutoSyncMinutes` (config.json, default ON / 5, Settings → General →
  "Anki auto-sync"); OFF = manual/Finish only, no auto-lock. 1s ticker `studyNow` drives "locks in M:SS".
- Graded cards live behind "▸ Show graded cards (N)" (`studyShowGraded`), newest first, each `● not synced` or
  `🔒 Synced`.
- **Post-lock correction (`correctSyncedRating`)**: when the feedback chat overturns a synced grade, `synced`
  is never flipped back (it would never re-sync). Instead a FOLLOW-UP review is added: one SM-2 step from the
  card's **pre-sync interval** (`preSyncInfoRef`, snapshotted at the top of `doSyncRatings` via one batched
  `ankiCardsInfo`, cleared with `studySyncedIdsRef`), via `setDueDate '<ivl>!'` + `insertReviews`. Once per
  card (`cs.ankiCorrected` → "🔒 Synced ✎"), on `syncChainRef`, only for real ease changes on
  non-noSync/non-conjugation cards. The app appends a factual receipt ("✅ Anki corrected: …" / "⚠ … could not
  be updated"); the model must never claim it changed Anki. MC Good-cap applies.

## Study modes
### Multiple choice (`studyAnswerStyle` = `'typed' | 'choices'`)
- Start screen "Answer style" (hidden for conjugations), `localStorage('ebiki-study-style')`. "Record reviews
  in Anki" (`studyPracticeSync`, `localStorage('ebiki-study-practice-sync')`) defaults CHECKED (`!== '0'`).
- `generateQuestionsForCard(..., wantChoices)` adds 4 options + `answerIdx`, no open "explain" questions, NO
  letter cues. Options validated/deduped and SHUFFLED client-side (models bias the correct slot).
- Card states carry `mc` (+ `noSync` when not recording). Fully-MC cards grade locally
  (`evaluateCardLocally`, no AI); any question without usable choices falls back to the AI grader.
- **Ease capped at Good** for synced MC cards (recognition < recall). `noSync` cards are excluded from EVERY
  sync path (`!cs.noSync` in doSyncRatings/auto-sync/ticker/exitStudy/pending) and show a purple PRACTICE badge.
- `submitStudyChoice` advances state immediately and leaves a frozen `studyChoiceFlash` snapshot for the
  green/red beat. Keys 1-4 answer; meaning-hint hidden.

### PBQs (`studyMode = 'pbq'`, GENERAL modes only)
- Start screen: general modes get Flashcards|PBQ, language modes Flashcards|Conjugations; a stale type falls
  back to flashcards (`beginStudy` sanitizes). Formats: **matching**, **ordering**, **categorize**; one per card.
- `src/pbq/engine.js` (pure, `engine.test.js`): the model authors INDEX-FREE (`pairs`/`steps`/`groups`);
  `compilePbq` validates and shuffles into `{left,right,items,categories,answer[]}`; `gradePbq` is
  deterministic; `studentView` strips the key; `parseSolverAnswer` maps a text reply to indices.
- **Verification (`generatePbqForCard`)**: RELEVANCE GATE (`{"kind":"skip"}` for off-subject cards, discarded,
  no retry) → generate → compile-validate → citation check (with a KB: 2-4 VERBATIM quotes, `checkCitations`)
  → BLIND SOLVE on `studentView` (`compareToKey`) → judge (`solver_wrong` keeps key; `key_wrong`/`ambiguous` →
  ONE regeneration, then DISCARD). `pullNewCard` tries up to 3 pool cards per slot (`pbqPullRef`). ~3-5 calls
  per exercise, all at generation.
- UI `src/components/PbqQuestion.jsx`: select-then-place (no HTML5 drag; robust under zoom), ▲▼ for ordering;
  `review` prop = graded read-only. `submitPbqAnswer` grades locally, advances underneath, holds the result
  (`studyPbqReview`) until **Continue**. Rating from fraction (1 → easy, ≥.7 good, ≥.4 hard, else again); same
  Good-cap/`noSync`/`practiceGradeAnki` semantics as MC; "I don't know" → `evaluatePbqSkipped` (again).
- Optional emoji icons (`raw.icons` → `pbq.icons`, `iconFor`): validated, excluded from `studentView`, never
  graded, must not hint at the answer.

### Question-style preferences (`studyRules.questionPreferences`, per mode, max 12)
The feedback chat's `question_preference` action distills "ask this differently" into one generalized
imperative rule on the mode (async → pinned `feedbackModeId` + `updateModeById`). All rules go into
`generateQuestionsForCard` as a USER'S QUESTION-STYLE PREFERENCES block, subordinate to the ambiguity/leak
rules. Editable in Settings → Study. Also fed by the **✎ Fix question** button on the live question
(`studyFixQ` + `fixCurrentQuestion`): regenerates that ONE question in place (same slot type, MC options
regenerated, leak-checked, `glossFetchRef` key deleted so hints refetch) and saves a preference unless the model
judges it one-off. Auto-closes on question change; hidden for PBQs.

### Answer-leak guard (question + hint)
`questionAnswerLeak` (exact, accent-insensitive, whole-word, ≥3 chars; explanation type exempt; general modes
exempt the final deep question) and `hintRevealsAnswer` (FUZZY: plurals/inflections). Both REGENERATE first (up
to two rewrites naming the violation); `scrubAnswerFromQuestion`/`scrubHint` (blank to `___`) are the last-resort
net. The prompt also says the answer must never appear in the question (incl. the sense cue).

### Typed-answer feedback (`studyTypedFlash`), three states
Green ✓ = matched `acceptedAnswers` locally; amber ⏳ "Ebi will check" = explanation questions, general modes,
hint-exhausted answers (inflection tolerance may still accept); red ✗ + `.study-shake` = wrong with a hint
retry (no advance). Frozen-snapshot pattern like `studyChoiceFlash`. **The batchFeedback layout-effect gates on
all overlays** (`studyChoiceFlash || studyPbqReview || studyTypedFlash`, plus the Learn-it moment) so the last
answer's feedback paints. **The shake is TRANSIENT** (`studyShaking` via `triggerShake()`, cleared on
`onAnimationEnd`); the `studyInputShake` counter only changes the element `key` (keying off its truthiness
re-shook every remount).

### "Learn it" moment (`studyLearnMoment`)
I-Don't-Know on Q1 records an honest Again, then `openLearnMoment(cs)` holds the card with a teach panel: back
(`cardBackToHtml`), pronunciation, an auto memory hook (more via `learnMomentAnotherHook`), and a focused Ebi
chat (`sendLearnChat`: explains from zero in the app language, `knowledgeBlock(4000)` + `dialectRule`,
dash/shrimp stripped).
- **Exit gate = typing it once** (`learnMomentTypedOk`): LANGUAGE = the headword, exact incl. accents, any
  "/"-form. GENERAL = a short KEY TERM (fronts can be paragraphs): derived instantly (front text before the
  first `:.?!`, capped), then a silent AI call picks a better term (fail-soft; `keyTermAlt` keeps the fallback
  accepted). General typing forgives case/spacing/trailing punctuation. Headline shows `headWord`; general modes
  show the full front as a paragraph.
- Re-queued ~2 cards ahead (`requeueForRelearn` inserts `{...card, _relearn:true}` into `studyAllCards` at `studyBatchIdx+2`;
  `pullNewCard` maps it to `noSync: true, relearn: true`) so the Again stays the card's only Anki review.
- Holds the screen like the flashes (layout-effect gate + first branch of the question-card render chain).
  Cleared on exitStudy + session start. Flashcards only.
- **Per-mode `studyRules.learnMoment`, default ON** (`!== false`); "Learn-it moments" checkbox for ALL modes
  (grammar/word-hints/accents toggles in that row stay language-only). i18n
  `studyLearnMoment`/`studyLearnMomentDesc`.

### "I Don't Know" (`skipStudyQuestion`)
Card-level ONLY on the first question (confirm → every question '(skipped)', rated Again). Once any question
is answered (`cs.questionIdx > 0`) it fails only the current question and advances like a submit (no confirm),
so a correct Q1 isn't forfeited. On a reviewed earlier question (via a dot) it replaces that answer with
'(skipped)' and returns to the frontier. PBQ/conjugation skips are separate (`evaluatePbqSkipped`,
`skipConjugationWord`).

### Accent drill
Any typed answer (incl. explanation / deepQ sentences) triggers a retype drill when it CONTAINS a target word
with the right base letters but missing/misplaced accents ("muy calida" → retype cálida). Different
inflections, different words, or answers without the word continue normally. Candidates = `acceptedAnswers` ∪
the card's own headword forms (front split on "/", "(…)" stripped). After the retype the ORIGINAL answer is
graded unchanged (`cameFromRetype`); the slip caps the card at Good (`accentSlips`).

### Question-phase chrome
- Header progress bar: total = completed + active + not-yet-pulled pool cards (denominator never moves);
  "N/M cards". Per-card question dots (hidden for 1 question).
- **Dots are clickable for non-destructive review** (`viewCardQuestion`): answered dots and the current one;
  answered ones show the previous answer prefilled (ring marks the viewed one); can't go past the frontier.
  Submitting an edited earlier answer hits the EDIT branch at the top of `submitStudyAnswer` (`questionIdx <
  cs.questionIdx`): replaces `answers[qi]` (attempts reset) and returns to the frontier; grading reads
  `cs.answers`.
- Wrap Up / End Now live in the header with Exit Study. Question text 15.5px.

### Graded / batch feedback views
- The card HEADER toggles its body (`card-head`; inner controls `stopPropagation`). `studyGradedView` =
  `{ [cardIdx]: 'feedback' | 'mnemonic' }` (absent = collapsed): **▸ Feedback** (`renderFeedbackToggle`) and
  **🧠 Help me remember** (`renderMnemonicButton`) are mutually exclusive. Same for the in-session graded list
  and end-of-session Batch Results (both collapsed by default).
- Each question is a collapsed row (`renderQaRow`, keyed `studyQaOpen[src]`): ✓ green = correct, no non-praise
  notes; ✓✎ amber = correct with feedback; ✗ red = incorrect. Expanded detail 13.5px with hanging note icons.
- "Clear completed from list" sits at the very BOTTOM of the in-session list.

## Memory hooks (one engine: `generateMemoryHook(front, back, prior, method)`)
Subject-agnostic; hook language = `studyRules.hookLanguage` ('' = APP language; not "Ebi speaks", since a
mnemonic must be instantly understood), consumed only here via `explainLang`. Written in that language, never
hardcoded.
- **Methods (`METHODS`)**: `meaning` (decompose → one vivid image ending at the meaning); `sound` (language:
  sound-alike bridge from the REAL pronunciation that echoes EVERY syllable IN ORDER, last one included, with a
  genuine sound-alike, never a meaning word posing as a sound; recap must be PAIRWISE `syllable=BRIDGE` so
  mismatches are visible. General: acronym/anchor that reconstructs the exact term); `parts` ("Break it down":
  real morphology step by step, e.g. dar → darse → dárselo; ≤60 words); `confuse` ("Don't confuse it": 1-2
  real confusables + one sharp discriminator each; ≤50 words); `story` (2-4 sentences ending at the answer;
  ≤70 words). Others ≤35 words. Language cards get sound-alike/imagery/cognate hooks; general modes get
  acronyms/associations/stories for the CONCEPT, never a translation.
- **`auto`** (default "🧠 Memory hook"): the model picks the best method and prefixes it in **bold**. Excludes
  `confuse` (manual only). With prior hooks, prefers a method none of them used (prior hooks are fed in so each
  is different; every click APPENDS).
- **Every hook gets a VERIFY-AND-IMPROVE pass** (hooks get memorized): re-runs the reconstruction test, says
  sound pairs aloud, checks truth and clarity, and improves wording/imagery even when nothing failed (never a
  rewrite for taste; same method/language/format/length; keeps the bold label). Fail-soft + `silent: true`. ~2
  calls per hook, on demand only.
- **UI: one shared row `renderHookButtons(surfaceKey, onPick, disabled, compact)`**: primary "🧠 Memory hook"
  + the five styles behind "Styles ▸" (`hookStylesOpen` per surface). Labels/tooltips from `hookMethodList()`;
  the row uses `tip-r` (left-anchored tooltip).
- **Rendering**: hooks use `renderTappableRich` (bold + line breaks, tappable words; `.hook-md strong` styles
  it), NEVER `<Markdown>`. Improve the prompt in ONE place.
- **Surfaces**: study graded cards (`generateMnemonic(ci, cs, method)` → `cs.mnemonics` + `mnemonicLoading`/`mnemonicError`, rendered at the TOP of the card body by `renderMnemonic`; opening the toggle
  hydrates saved hooks, doesn't auto-generate), deck rows (`generateDeckMnemonic(note, method)`,
  `deckBrowserMnemonics` by noteId), tapped-word popup (`studyWordMemoryHook(method)`, compact), Learn-it moment
  (seeds saved hooks; auto-generates only when none exist).
- **One per-mode store, visible everywhere** (`modeHooks`, blob `hooks` → Anki media + local fallback, loaded on
  mode switch). Keys: Anki noteId, or `word:<folded word>` for tapped words without a card. Save via
  `addNoteHook(hookSaveKey(noteId, front), hook)`; read via `hooksForItem(noteId, front)`, which unions the
  note's hooks with word-key hooks for each headword form. The popup hydrates word-key hooks synchronously, then
  resolves the note async (`studyWordFindExisting`) and records `hookNoteId`. `deleteNoteHook(noteId, hook,
  front)` deletes by VALUE across noteId + word keys. Writes are functional (`writeModeHooks`).
  **A write goes to the mode the in-memory list belongs to** (`hooksModeIdRef` / `grammarModeIdRef`, name
  resolved by id at write time), never the caller's `activeMode.name`: a hook finishing after a mode switch
  saved the new mode's hooks over the old mode's blob. Hooks/slips started in another mode are not filed
  under the new one (`hookModeId`, `gradeModeId`).

## Study start screen and Dropdown
- **One sectioned card** (What to study / Language / Session format), label-above-control fields in
  `repeat(auto-fit, minmax(180px,1fr))` grids; legends are `.tip` tooltips. Compact spacing so it fits without
  scrolling at 1.35 zoom. `Dropdown` applies `style.width` to its wrapper.
- **`Dropdown` menu is portaled to `<html>` (outside the body zoom), `position:fixed` in REAL px, scaled with
  `transform: scale(z)`.** A fixed element inside the zoomed body has a broken Chromium hit-test box (lower items
  unclickable / clicks land higher). Intrinsic sizes = available room ÷ z; `transformOrigin` flips to `bottom
  left` when opening upward; opens toward the roomier side, caps height to the viewport, **closes on any
  scroll or resize**.

## Per-mode dialect (`studyRules.dialect`, language modes)
Free text ("Latin American Spanish"). `dialectName()`/`dialectRule()` (next to `learnLangName`) build ONE line
injected into EVERY generator: card generation + `verifyCards`, memory hooks, `lookupStudyWord` phonetics,
`generateQuestionsForCard`, Chat card format, bulk-edit framing, Discover. **Governs every regional convention,
language-agnostically**: phonetics, spelling, **punctuation/quotes** (LatAm `"..."` vs Spain `«...»`),
vocabulary, grammar, register (`ustedes` vs `vosotros`). A form that exists in only one region keeps that
region's norms; otherwise the studied variant wins. Audio region is separate (`pronunciation.defaultRegions`).
Help can set it (`set_dialect`); it rides in `appContext.activeMode.dialect`.

## Deck browser
### ✨ Ebi bulk edit (`analyzeDeck(kind, instruction)`)
- `kind='custom'` = "apply the owner's request; skip cards it doesn't cover; change only what it covers",
  reusing the whole analyze pipeline (JSON contract, noteId+front integrity guard, before/after accept/deny
  review, commit). Nothing writes to Anki until each card is accepted. UI: toolbar button → panel
  (`deckCustomEditOpen`/`deckCustomEditText`) → "Preview changes". The review header echoes the exact request
  (`deckAnalyzeInstruction`).
- **Tags as well as fields**: payload includes each note's `tags`; optional `recommendedTags` is the COMPLETE
  replacement list (tags-only recs valid). Language decks embed `usageTagsRule()`. Review: editable Tags input
  (`recommendedTagsText`, `parseRecTags`) + chip diff (removed red struck-through, added green, kept gray).
  **Every new editable thing Ebi gains needs this before/after review.** Refine can change tags too. Commit:
  fields via `ankiUpdateNote` (diff-only), tags via `ankiSetNoteTags(noteId, currentTags, finalTags)` only when
  changed; refuses a no-op and wiping ALL tags.
- **Verify-and-improve pass** (`verifyDeckRecs`): truth (incl. regional/preferred-term honesty; never a
  "slang-only" framing for a word some region uses literally), scope, tag completeness, clarity; can DROP a
  pointless rec. Merges back strictly BY noteId; a rec reverted to the current card is removed. Refine verifies
  too (`refineRequest`, `allowDrop: false`). Fail-soft.
- **BATCHED, 20 cards per call - don't collapse it.** One whole-deck call hit the output limit and
  `parseAiJson` salvaged a truncated array that looked complete. Sequential batches, `maxTokens: 8000`, recs
  stream in, `deckAnalyzeProgress` {done,total} → "Checking N of M cards", a failed batch doesn't discard others
  (partial run → `deck_analyzePartial`). Covers Check card quality, Dialect audit, Tag audit, bulk edit, and
  Help's `deck_edit`. The duplicate scanner is NOT batched (finds candidates locally first, sends only
  clusters).
- `deckAnalyzeKind` keeps labels straight. Help's `deck_edit` prefills + opens the panel, switches to Deck, and
  `pendingDeckEditRef` runs the preview once notes load. **Call as `onClick={() => analyzeDeck()}`** (a raw
  event would become `kind`).

### Other deck browser behavior
- **+ Add Deck → "⚡ Make it for this mode: <name>"** (`handleAddDeckForMode`): creates the deck (typed name or
  the active mode's name) and links it via `updateModeById(pinned id, { ankiDeck })`, id pinned before the
  awaits. Plain quotes, not «guillemets», in its strings (user preference). The typed-purpose path
  (`handleAddDeck`) fuzzy-matches a mode or `createMode`s one.
- **Rows**: one-line preview via `backPreviewText` (breaks → " · "); click to expand (`deckBrowserExpanded`):
  bold-labeled back lines, tag chips, studied/lapses/interval footer. Badges from `note.stats`: NEW / learn /
  interval (green when ≥21d), ⚠ when lapses ≥4. **Copy to / Move**: `ankiCopyNote` (allowDuplicate on purpose)
  or `ankiChangeDeck` (scheduling travels), with an inline "New deck…" creator. **⟲ Reset progress** (red,
  confirm-gated): `ankiForgetCards` (card becomes NEW, content untouched).
- **Check card quality** judges EVERY card in the batch (`buildPrompt` states the count) for: unpinned sense,
  misspelled/nonexistent headword, back too thin to learn from, wrong/unnatural content. General decks look for
  underspecified concepts. **Scan for duplicates** is framed per mode kind (general: term vs abbreviation; never
  merge distinct look-alike concepts).
- **Persists across tab switches.** Leaving no longer calls `closeDeckBrowser()` (teardown); it only runs `syncDeckEditsToStudy()`; returning does a SILENT refresh
  (`loadDeckNotes(deck, {quiet:true})` + quiet `ankiGetDecks`). `openDeckBrowser` keeps the persisted
  `deckBrowserDeck` (`ebiki-deck`) when it still exists. Scroll is stashed (`deckScrollTopRef`) and restored
  before paint (`useLayoutEffect` on `deckMainRef`), expiring after 3 min away (`deckLeftAtRef`).
- **Card search is accent-insensitive** (query and fields folded with
  `toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')`).

## Tap-a-word lookup
- Works on the question AND feedback surfaces: `renderTappableText(text, sentence, source)` +
  `renderWordLookupPopup(source)` (near `renderFeedbackNotes`). `lookupStudyWord(word, sentence, source)` stores
  `source` so the popup renders beside the clicked word. Wired into the 💡 Meaning Hint, graded cards
  (`graded-<ci>-<qi>`), Batch Results (`batch-<ci>-<qi>`). Language modes only.
- **Hooks and the Learn-it panel are tappable** via `renderTappableRich(text, source)` (bold + line breaks) and
  `renderTappableBack(back, source)` (tappable `cardBackToHtml`). Sources: `mnemonic-<ci>`,
  `deck-hook-<noteId>`, the popup's own source (re-looks-up in place), `learn-back`/`learn-hook`/`learn-chat`,
  each with its own popup mount. **New hook/teach surfaces must use these, not `<Markdown>`.**
- **`getCardBack` preserves line breaks** (`<br>`/block closers → `\n` BEFORE `stripHtml`).
- Explains in the APP language (`APP_LANG_NAME`), context-aware: in-context meaning (green) + other senses
  (purple).
- **Bidirectional (language modes), never pair-specific**: if the tapped word isn't in the learned language, it
  flips and teaches the learned-language side ("sound" → sonido). JSON field **`target`** (= the learned-language
  word; the tapped word in the normal direction); everything downstream keys on `wl.target || wl.word` (header
  "sound → sonido", `Pronunciation` keyed remount, Make Anki card, hooks under `wordHookKey(target)`). A
  post-parse step merges the target's hooks + note (`studyWordFindExisting(target)`, fail-soft). Output
  dash-stripped (`deDash`).
- **"Make Anki card" is duplicate-aware**: `studyWordFindExisting` searches the target deck first; a note whose
  HEADWORD matches (accent/case-insensitive; front split on "/", "(…)" stripped; accent-variant search fallback
  since Anki search is accent-sensitive) shows "✓ Already in «deck»" (`wl.existing`) with NO add button. Anki
  offline or search errors fall through to generation.

## Stats
- **Live from Anki** when connected (effect on `activeTab==='stats'` → `ankiStats`): Cards Today
  (`getNumCardsReviewedToday`), 14-day chart + streak (`getNumCardsReviewedByDay`), accuracy = today's review-log
  pass rate (`ankiGetTodayReviewStats`, cumulative). Persisted to `localStorage('ebiki-anki-stats')` and
  hydrated on mount; offline falls back to `screenlens-study-history`. Dates are LOCAL `YYYY-MM-DD`
  (`toLocaleDateString('en-CA')`) to match Anki days.
- **Recent Sessions**: FIXED grid (82px | 1fr | 84px | 48px), rows grouped by (date, deck); cards summed,
  accuracy card-weighted. **One history entry per session** (`runId` = `studyRunIdRef`, minted in
  `beginStudy`, carried through a resume, upserted): the summary effect re-runs on every change (re-rate, hook,
  sync) and used to ADD an entry each time, multiplying the offline numbers.

## Grammar-slip log (`modeGrammarLog`, per-mode blob `grammar`, language modes)
Every `grammar` note the grader writes (penalized or not) is saved via `addGrammarSlips(front, notes)` in
`evaluateCardAnswers`: `{t, front, n, at}`, deduped by folded text (repeats bump `n`/`at`), capped at 200.
`grammarSlipBlock(limit)` (most frequent first) feeds the Chat system prompt, the Learn-it chat, and Help
(`appContext.grammarSlips`). Same store pattern as `modeHooks`.

## Question generation (`generateQuestionsForCard`)
- Non-language modes hide language-only controls and quiz on concepts.
- **Pin exactly one answer with an INLINE cue, ALWAYS** (not "if a synonym might fit"): a compact parenthetical
  in `quizLang` at the blank giving the precise sense, PLUS the first letter. It's part of the question text;
  hint1/hint2 don't count.
- **The first-letter cue is a deterministic guarantee** (helpers near `scrubHint`): every typed (non-MC)
  language recall/fill_blank goes through `needsLetterCue`; a miss is regenerated (same 3-attempt loop as the
  leak check), and as a last resort `appendLetterCue` adds a language-neutral skeleton (`sombrero` →
  `(s·······)`). `hasLetterCue` detects a cue by FORM (a single `\p{L}` in any quote style, or a skeleton), never
  by English phrases. MC is exempt (a cue would leak). `fixCurrentQuestion` has the same guarantee.
  `generateConjugationQuestions` needs none (tense + subject pin the form).
- **Deep/usage question** (`deepQ`, last question on a language card) tests practical command (use in a
  sentence, pick over a synonym, right form for a stated subject/time, opposite, collocation). Never asks to
  EXPLAIN grammar/spelling/etymology or use metalinguistic terms.
- **The cue renders visually distinct**: text split on `/(\([^)]*\))/`; `(...)` segments muted + italic. Cue words
  are still tappable and glossed. Their muted color lives in `.study-word-cue` (CSS), NOT inline, so
  `.study-word:hover` can still turn them red; italic/weight/opacity stay inline (`cueStyleNoColor`). The
  non-tappable general render uses inline `cueStyle`.

## Learned language vs "Ebi speaks" (don't conflate)
- `learnLang` (`studyRules.studyLanguage`) is ALWAYS the answer language; `quizLang` (`quizLanguage ||
  studyLanguage`) is only phrasing. "Learning Spanish + Ebi speaks English" → "Translate to Spanish: umbrella" →
  `paraguas` (a fill-in-blank sentence holding the answer stays in `learnLang`). `evaluateCardAnswers` uses
  `learnLang` for typo tolerance + answer side, `quizLang` for feedback; meaning hint + feedback chat use
  `quizLang`. Card generation uses `learnLang`.
- **Start-screen pickers default like the GENERATOR**: unset `studyLanguage` → `learnLangName()` (mode name),
  never a hardcoded `'English'`. **General modes: unset "Ebi speaks" → the APP language** (`userLangName()`,
  what `interactionLangName` uses) in both the start screen and Settings → Study (`appLangLabel`). Picking any
  value writes `quizLanguage` per mode. Both pickers show for every mode (general: "Ebi speaks" only). Labels
  are `study*` i18n keys.
- **"Ebi speaks" in general modes**: `interactionLangName`/`generateQuestionsForCard` use `quizLanguage || app
  language`; only phrasing changes. The general block still forbids language-course questions, terms stay
  untranslated, and answers in ANY language are graded on understanding. `lookupStudyWord` treats the general
  question language as `quizLanguage`.
- **Inflection tolerance** (fill_blank): a different form of the SAME lemma (tense/mood/person, gender/number)
  is accepted unless the sentence has a marker forcing one (time adverb, explicit subject, agreement).
  Generation adds that marker when it wants a specific form, else lists every valid form.
- **Gender/article**: the article encodes gender, so a correct article fully answers "gender and article"; no
  "state the gender" note (and "masculine" answers the article too).

## Word hints (`studyRules.wordHints`, ruby-style glosses)
Small translations above each non-tested word (language modes). The question model rarely returns `glosses`,
so `fetchGlossesForQuestion` fills them lazily (effect after `studyCardStateRef`, gated on
`currentQuestion`/`wordHints`, fires when missing OR empty, `glossFetchRef` de-dupes). **Bidirectional**:
`learnLang` word → `userLang`, `userLang` word → `learnLang`. Excludes the answer and anything revealing it.
Every word gets the same stacked column (blank slot when unglossed) so the baseline stays even.

## Notices and dialogs
- AI failures (credits / rate limit / bad key) show a toast; the secondary pose call is `silent`.
- **Three bottom-center toasts** (`position:fixed`, z 10001, above the settings modal at z 1000):
  `modelHealNotice` (model auto-switch, 7s), `aiErrorNotice` (red, until dismissed), `successNotice` (green ✅,
  6s; reuse it for any "done" feedback instead of adding a toast). `createMode` runs on App, so closing Settings
  mid-create doesn't cancel it.
- **NEVER `window.confirm` or `window.alert`; use `confirmDialog(message)` / `alertDialog(message)`** (App.jsx, next to the toasts): promise-based themed
  modal (`appConfirm`, z 10002). `if (!(await confirmDialog('…'))) return` (callers async). Backdrop/Esc cancel,
  OK auto-focused. `alertDialog` is the same modal with `notice: true` (OK only); `promptDialog` adds a text field
  (`window.prompt` throws in Electron).
- **Answer submits are claimed once per question state** (`claimSubmit`: session, card, question, answers
  and attempts count, answer text; cleared by "Back"): a double Enter or double tap on a card's last question
  graded it twice. PBQ submits use `pbqSubmittedRef`.
- **Adding cards is guarded against double clicks with REFS, not state** (a state flag read from the
  render-time closure lets two quick clicks both pass): `chatCardsAddingRef` (chat cards),
  `quickAddInFlightRef` + `quickAddBatchRef` (Quick Add), `pictureAddingRef` (Picture), `discoverSavingRef` +
  `discoverActedRef` (Discover), `modeCreatingRef` and Studio's `applyingRef` (modes). Card paths allow
  duplicates, so Anki does not catch it.
- **Exiting study warns about cards still being graded** (`study_exitGrading`): they have no rating yet, so the
  unsynced check never saw them and they were dropped silently.
- Images are non-draggable globally (`img { -webkit-user-drag: none }`) and `handleDragOver` requires
  `dataTransfer.types` to include `'Files'` (a dragged `<img>` tripped the drop overlay).

## Pronunciation audio (`src/pronunciation/`, 4 tiers, language-agnostic)
- `getPronunciation({word,lang,region,config,noteId?,cardId?})` tries: **0) Anki media** (`ankimedia.js`, the
  card's own `[sound:…]` via `retrieveMediaFile`; pass `noteId`/`cardId` when known) → **1) Wiktionary/Commons**
  → **2) local TTS** (opt-in) → **3) browser SpeechSynthesis**. Returns `{kind:'url'|'speak', audioUrl?/speak?(),
  source, attribution?, fileName?}` or null. Never throws. Cache key includes the card (`noteId || cardId`), and a ↻ pick drops the word's cached first
  choices so the card's newly embedded voice is used. **Cache SUCCESSES only** (nulls are usually
  transient); 🔇 stays clickable to retry. Wikimedia calls use `politeFetch` (~350ms spacing, one 2.5s retry on
  429); `webspeech.js` never caches an empty voice list.
- `src/components/Pronunciation.jsx` resolves lazily on FIRST CLICK (no network on render), 🎙/🤖 badge. The
  tapped-word popup mounts one too.
- **Tier 1 (`wiktionary.js`)**: per edition, REST `media-list` ∪ `action=parse` wikitext regex (both are
  load-bearing: es media-list returns 0; CJK filenames need media-list). Edition priority
  `config.editions[iso1] || [iso1,'en']`. **Commons search fallback** (`searchCommonsFiles`, `intitle:<word>
  filetype:audio`) when no edition links audio. **Noise gate**: no language-convention evidence → below
  `STRONG_SCORE`; "Perro ladrando.ogg" dropped; bare "Perro.ogg" only if its categories prove a pronunciation
  recording (`looksLikePronunciationPage`). Long recordings merely containing the word are rejected.
- **Matcher** (`matcher.js`, vitest with REAL filenames) ranks: exact region (`en-us-…`) > bare language
  (`De-Haus.ogg`) > Lingua Libre (`LL-Q1321 (spa)-user-word.wav`; Q-id-only kept low) > wrong region > bare
  word; rejects files identifiably in ANOTHER language. Also knows `(spa)-Speaker-word`.
- **Attribution is mandatory** (CC-BY-SA, via Commons `imageinfo extmetadata`); no license → skipped. All
  `w/api.php` calls need `origin=*` + `Api-User-Agent`; every fetch fails soft to [].
- **Tier 2 (`kokoro.js`) is strictly opt-in**: empty `pronunciation.ttsUrl` (default) returns null instantly.
  When set: browser → `/api/tts` middleware → OpenAI-compatible `/v1/audio/speech`, cached in `cache/tts/`.
  Voices = `DEFAULT_TTS_VOICES` (Kokoro-82M) + overrides.
- **Tier 3 (`webspeech.js`)**: handles the `onvoiceschanged` race; exact dialect → base language → null.
- **↻ Different speaker** on every native result: cycles the ranked list (`resolveWiktionary({variant})`, wraps;
  variant>0 merges Commons search; `candidateCache`), using only language-confirmed files when possible.
  Picking calls `onNative(r, {replace: true})`, which swaps OUR previous `[sound:ebiki-…]` + credit (never other
  audio). A wrap to the same file doesn't replay: it flashes an absolutely-positioned "only one recording
  exists" tooltip and retires. A null result keeps the button.
- **Anki embed (native audio only, never TTS)**: `embedPronunciationInNote` on first play from Study/Deck:
  fetch → `ankiStoreMediaFile('ebiki-…')` → append `[sound:…]` + credit via `ankiUpdateNote`. Idempotent (skips
  if the back has `[sound:`); toggle `pronunciation.embedInAnki` (default ON). Chat widgets never embed.
- **Surfaces** (language modes): study graded rows, deck rows, chat `<anki-card>` widgets. `pronWord()` strips
  "(pos)". Region = `pronunciation.defaultRegions[iso1]` (Settings → Audio, global; also editions/ttsUrl/
  ttsVoices/embed). Language data in `langcodes.js`; per-language tuning is data, never `if (lang === …)`.

## AI providers (`src/config/providers.js`): everything works on every provider
- **Everything routes through `aiCall`** → `PROVIDERS[provider].call(...)`: Chat, Study, Deck, Discover,
  Picture (vision), pose, and Help (`askAI` prop = `aiCall(..., resolveModel('help'))`), on Anthropic / OpenAI /
  Gemini / Grok. No feature hardcodes a provider.
- **Intelligence preset** (global `intelligence` = `optimized` | `normal` | `max`): each provider has
  `presets: { cheap, normal, max }` (all vision-capable). `ROLE_DEFAULTS(pc, intel, prov)`: `normal`/`max` put
  every role on that preset (pose always `normal`); `optimized` is per role via `ROLE_TIER`. Per-feature
  overrides in Settings win. Chosen in onboarding, switchable in Settings → AI models.
- **Never read `pc.presets[tier]` directly; use `presetModel(pc, prov, tier)`** (next to `resolveModel`), so the
  live-model layer can shadow the constant. providers.js values are a FLOOR.
- **`ROLE_TIER` (optimized preset) = stakes × frequency. Load-bearing: keep this table and the code in sync.**

  | Role | Tier | Why |
  |---|---|---|
  | `pose` | cheap | Trivial classifier on every message; biggest saving. |
  | `help` | cheap | Short Q&A, low stakes. |
  | `discover` | cheap | User reviews suggestions; verify pass catches errors. |
  | `chat` | normal | Tutoring quality is felt on "why" answers. |
  | `picture` | normal | Vision on busy screens needs a capable model. |
  | `study` | normal | Deterministic guards (leak, letter cue); grading fine at mid. |
  | `general` | normal | Mode creation matters but is rare. |
  | `deck` | max | Cards get MEMORIZED; never cheap out here. |

- **How to add an AI role**: add it to `AI_ROLE_META` (label + hint) and `ROLE_DEFAULTS`'s uniform map; add a
  `ROLE_TIER` tier (memorized/graded → `max`, conversational/reviewed → `normal`, trivial/every-message →
  `cheap`); call `resolveModel('role')` (or `resolveModelFast` for latency-sensitive read/translate).
- **Model Advisor** (`src/config/modelAdvisor.js` + App.jsx): `selectIntelligence(preset)` applies a CACHED plan
  instantly (`modelPlans[prov][preset].plan`), then `ensurePresetPlan(prov, preset)` in the background re-lists
  models; only if new models appeared (or never decided) it researches them (web search + strongest model →
  `modelCards[id]`), has the strongest model decide a role→model map over ALL available models, then PROBES
  the picks (`probeModel`, 1-token call; 403/404 = down, but a KEY error, incl. a 400 saying API_KEY_INVALID,
  is unknown, never down: it used to cache every model as down for a day) and re-decides without dead ones. Any failure keeps
  tier `ROLE_DEFAULTS`. Persisted: `modelPlans`/`modelCards`/`modelAvailability`. `planDeciding` drives "Ebi is
  choosing models". **Test connections** (`runConnectionTest`) probes the whole catalog; if NOTHING answers it
  reports one connection error.
- **Runtime failover**: in `aiCall`'s catch (after the retired-model heal), `tryModelFailover(prov, model, msg)`
  on 403/404/429/5xx/overload picks a probed-working alternative, registers `sessionSubs[prov][downId] = altId`
  (in-memory; `aiCall` routes through it everywhere), retries the call, and shows `modelFailover` (with Retry
  now). A 1-minute effect re-probes; on recovery the sub is dropped and `fo_restored` shows. Can never throw.
- **Cross-provider request compatibility** lives ONLY in this layer. **OpenAI and Grok share
  `openAiCompatibleCall`.** Self-healing, not table-driven:
  1. **Token parameter**: send `max_completion_tokens` (accepted by every OpenAI model tested; `max_tokens` fails
     on o-series and gpt-5+). A 400 naming the new parameter falls back to `max_tokens` (xAI, local endpoints).
  2. **Reasoning budget exhausted, ERROR form**: with a system message (every Ebiki call) o4-mini returns 400
     "output limit was reached". Retry with a larger budget.
  3. **Reasoning budget exhausted, SILENT form**: 200 + empty content + `finish_reason:"length"`; Gemini 2.5+
     does the same with `finishReason:"MAX_TOKENS"`. Same retry. Handle BOTH forms.
  4. **Anthropic per-model output cap**: "max_tokens: 8000 > 4096 … for claude-3-haiku" → retry at the number
     the error names (goes DOWN).
  **`MIN_CONTENT_BUDGET` (64) keeps `probeModel` (`maxTokens: 4`) out of every retry** (Test connections probes
  ~70 models). Errors keep the `API <status>: <body>` shape (`healRetiredModel`, `tryModelFailover`,
  `probeModel` parse it). Covered by `providers.test.js` (stubbed fetch). **Add a case there when adding a
  provider or touching a request body.**
- **No forced JSON** (`response_format`/`responseMimeType` would break free-form chat; OpenAI errors unless the
  prompt says "json").
- **ALWAYS parse AI JSON with `parseAiJson(text)`, never bare `JSON.parse`** (strips noise, repairs slop,
  salvages complete objects from truncated arrays).
- **Staying current: two different mechanisms.** A model that still works never errors, so the heal alone never
  upgrades.
  1. **Retirement heal (reactive)**: `healRetiredModel`, only from `aiCall`'s catch on `isRetiredModelError`
     (404/not-found), via `discoverCurrentModel` (`listModels()` + tier family preference). Heals at PRESET
     scope when the dead id was a tier.
  2. **Daily currency check (proactive)**: `findModelUpgrades` polls the active provider's `listModels()` at
     most once per 24h (`lastModelCheck`), compared via `src/config/modelVersions.js`
     (`parseModelId`/`compareModels`/`pickUpgrade`, `modelVersions.test.js`). A strictly newer model in the
     SAME family (never cross-family, never `-preview`) raises a Yes/No modal. Yes → `adoptModel` writes
     `modelPresets[prov][tier]` (shadows providers.js everywhere). No → `declineModel` records the model ID in
     `rejectedModels` (a newer one may still ask). Gated behind `onboarded`.
  - **Onboarding never asks**: once the key is entered it silently adopts the newest per tier (`pickNewest`).
  - `modelVersions.js` is pure and provider-agnostic (classifies id segments, so `claude-3-5-sonnet` and
    `claude-sonnet-4-6` share a family). Versions compare left to right (`[5]` > `[4,8]`); a dateless alias and
    its dated snapshot compare EQUAL. Extend the tests for new id shapes.

## Testing (two halves; `npm test` is only the first)
- `npm test` (vitest) covers pure modules: pronunciation matcher, PBQ engine, usage tags, modelVersions,
  providers, env/keys, discover storage, study hints. Nothing about layout or click paths.
- **run-ebiki skill** (`.claude/skills/run-ebiki/`, committed tooling, never bundled): `npm run dev`, then
  `npm run drive` drives the app in headless Chrome/Chromium/Edge, printing screenshots + console errors.
  `drive.mjs` installs `playwright-core` into `~/.ebiki-drive` (outside the repo). `npm run drive -- --studio
  "brief"` exercises Ebi Studio and **spends API credits**; the bare smoke path makes no AI calls.
- Verify UI changes THERE, not by reading JSX. Modal/overflow bugs come from `body { zoom: 1.35 }` scaling
  `position: fixed` boxes; only measuring catches them (`panelBox()`). SKILL.md holds the other traps.

## README style
- User-facing: what the app is, what each tab does, setup and use. Tight, no filler or hype; cut words, not
  information.
- No developer internals (prompt/function names, algorithm walkthroughs, file trees); those live here.
- Describe each feature once. Keep it accurate (shortcuts, model versions, renamed/removed features).

## Commits
- **Bump `package.json` `version` in every commit that changes app behavior** (see Version).
- **NEVER name the AI assistant that wrote the code anywhere that reaches git or GitHub** (the repo is PUBLIC):
  not in commit subjects/bodies, PRs, issues, branch names, or new code comments, and no attribution trailers
  (`Co-Authored-By`, `Generated with ...`). Describing a provider bug: "another provider" / "one provider".
  **Grep every commit message for `claude|anthropic|co-authored|generated with` before committing.**
- **The ban is on ATTRIBUTION, not the PRODUCT.** Anthropic is one of the app's four providers, so functional
  mentions stay: the `Anthropic (Claude)` label, `api.anthropic.com`, `claude-*` model ids, family parsing in
  `modelVersions.js`, and the `.claude/skills/run-ebiki` path used by `package.json`'s `drive` script. Test:
  does the text describe a provider the app talks to (keep) or who wrote the commit (remove)?
- Don't commit to `master` unless asked; the user asks for pushes to `master` explicitly.
