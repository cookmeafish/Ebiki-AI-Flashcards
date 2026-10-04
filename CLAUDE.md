# Ebiki - project notes for Claude

Local-first AI flashcard/study app (React + Vite), grown out of "ScreenLens". Mascot **Ebi**, a red shrimp.
Brand color **#DF2540**. Themes **Ocean Light** + **Dark**. Fonts Baloo 2 (display) + Nunito (body).

## Design system (never hardcode colors)
- `src/config/tokens.js`: `C` (colors as `var(--c-*)`), `FONT`, `RADIUS`, `SHADOW`. Single source of truth.
- Palettes: CSS variables in the global `<style>` in `src/App.jsx` (`:root` = light, `[data-theme="dark"]`).
  `appTheme` → `<html data-theme>`, persisted in config + localStorage; no-flash pre-paint script in `index.html`.
- **Look and feel: `docs/ui-overhaul.md`** (2026-10 overhaul: palette roles, layered elevation `SHADOW.card/glow`,
  `TYPE`/`MOTION` scales, `.ui-card`/`.ui-lift`/`.ui-hero`/`.ui-halo`, `S.screenTitle`/`S.panel`, how to revert).
- `src/styles/theme.js`: `S.*` style objects built from tokens. Primary CTAs: className `btn-press`. Tabs: `ui-tab`.
- **NO EM DASHES in ANY user-facing text**: UI strings, i18n (all four languages), `data-tip`, `title`,
  placeholders, dialogs, toasts, errors, AI output (forbidden in prompts, stripped in code). Use `. ` / `: ` / ` · `
  (zh `，`, ja `。`). Code comments are exempt. `aiCall` turns any em dash in the SYSTEM prompt into ": " except the
  "(—)" naming the banned character (user content left as written). `stripAiDashes` (every reply, in `aiCall`) and
  the Help/Studio strips are LINE-AWARE: a dash starting or ending a line (or a `\n` escape in JSON) is dropped, one
  inside a line becomes ", " (`\s*` there joined lines). Prompt LITERALS in App.jsx are dash-free too (2026-09
  rewrite: ", " or ": " after an ALL-CAPS heading, "Q2 to Q3", "2 to 3"); left: console logs, the "(—)" naming the
  character, the palette CSS. Write new prompts so.
- **Light-mode semantic colors are DEEPER than dark mode's** (success `#0E8746`, warning `#B36A00`, danger
  `#D32F24`, purple `#7C4DEF`) so green and amber stay distinct at small sizes. Keep that when retuning.

## Settings: global vs per-mode
One **⚙ Settings** modal, `src/components/SettingsModal.jsx`:
- **App settings** (GLOBAL, `config.json` via `/api/config`), pane ids in `NAV`: `general` (appTheme, appLanguage,
  translation `language`/`targetLang`, how Ebiki opens, run setup again), `models` = **AI & cost** (provider + key,
  intelligence preset, **question reuse**, per-feature models in a collapsed `<details>` that opens itself when an
  override exists), `anki` = **Anki & audio** (auto-sync + grace window, pronunciation), `data` = **Data & updates**
  (`DataFolderCard`, `UpdatesCard`).
- **Mode settings** (PER-MODE, `modes/<name>/config.json` via `updateActiveMode`): `modes` (Learning modes, first:
  create/switch/rename/delete), `study` (`studyRules`, as cards: Session = questionsPerCard, cardsAtOnce; Languages =
  **studyLanguage** = the LEARNED language (answers + card generation), **quizLanguage** = "Ebi speaks" (phrasing;
  '' = same as learned), hookLanguage, dialect; Feedback = grammarFeedback, **wordHints**; How Ebi asks =
  questionPreferences + Ask AI + Studio; collapsed Advanced = questionPrompt, ratingRules), `cards` (Cards & Anki:
  `activeMode.ankiDeck`, fields/templates, tagRules), `knowledge`.
- Old pane ids still open the right pane (`PANE_ALIAS`: `audio` → `anki`, `overlay` → `cards`). The content column
  is keyed by pane (a new pane starts scrolled to the top). Small number inputs override `S.keyInput`'s
  `flex: 1; minWidth: 200` (`flex: 'none', minWidth: 0`) or they stretch across the row.
- Rule of thumb: can differ per mode → `activeMode`; else global.
- **Async writers use `updateModeById(modeId, updates)` with the id pinned when the task STARTS** (chat-suggestion
  backfill, Discover category generation). Never `updateActiveMode`/`saveModes` from an async completion:
  `saveModes` re-asserts `activeModeId`, so a stale closure flips the app back to the previous mode.
  `modesRef`/`activeModeIdRef` are the live mirrors.
- **Mode-list edits read `modesRef.current`, never render-time `modes`** (`deleteMode`, `renameMode`,
  `addDefaultMode`, `handleAddDeck` after its awaits): a whole-list save from a stale copy reverts async writes.
  SettingsModal's rule removal builds from `getActiveMode()` (live rules) after its confirm; Enter-renames mark the
  box so the unmount blur doesn't rename (and alert) twice.
- **Every active-mode change goes through `switchActiveMode` / `endStudyForModeSwitch`** (header switcher, Settings
  mode bar + chips via the `switchMode` prop, deleting the active mode, `createMode`, Studio create): a live study
  session is ended first (confirm → `exitStudy`), else it kept running with the other mode's rules/deck. The saved
  session snapshot carries `modeId` (restore returns to it) and `syncedIds` (written by `markSynced` at once, so a
  reload mid-sync can't answer a card twice). The study start screen follows the new mode's deck on ANY active-mode
  change (effect on `activeModeId`, skipped during a live session). `createMode`/`addDefaultMode` refuse with
  `mode_cannotSave` when the modes read failed.
- **Hooks + grammar loads wait for `configLoaded`**: before it, `activeMode` is the in-memory default (id 1), and a
  saved mode ALSO id 1 never re-ran the load, so the placeholder's blob was written over the real mode's.
- **Never auto-persist a deck default.** `refreshAnkiConnection` must NOT write `decks[0]` into the mode: it can run
  before modes load (placeholder mode, deck '') and clobber the chosen deck. Fall back non-persistently
  (`ankiDeck || decks[0]`) at session start and in pickers.
- `chatSuggestions` (3 subject-specific Chat starter chips) come from `createMode`; the Chat empty state shows them
  (generic fallback) plus an always-present "💬 Just chat with Ebi" chip. Older modes backfill lazily on first
  Chat visit (effect near `sendChatTabMessage`).
- Header: ONE split control (`src/components/ModeDeckSwitch.jsx`, the owner: mode and deck "must be set together"):
  mode segment, link glyph, then the ACTIVE MODE's deck via `setAnkiDeck` (Practice, raids, Study and Legends all
  read it); with Anki known down (`ankiConnected === false`) the deck segment stays, disabled (`hdr_deckOffline`).
  Presentation only: App passes the old handlers. Then ⚙. Switching tabs closes the modal.
- **Mode ids are repaired on load** (modes-load effect, next to the em-dash sanitize pass): duplicate ids (merged
  shared folders) are re-id'd, first wins; string ids become numbers; changes persist. A duplicate breaks the
  active highlight and turns a switch into a rename. **The saved `activeModeId` must exist**, else the first mode
  is used (a mode deleted on another computer left edits going to a missing id).

## i18n
- **All UI text lives in ONE place: `src/i18n/`.** `locales/<code>.js` = every string of one language (app AND
  features; feature sections are commented with their folder and use the feature's key prefix). `languages.js` =
  THE list of languages (`code`, own-name `label`, English `name` for prompts, `pickerName` for the study-language
  lists, `ocr` Tesseract code). `index.js` is only the engine (`t`/`makeT`, `APP_LANGUAGES`, `langMeta`). **Never
  hardcode a language map elsewhere** (`APP_LANG_NAME`, OCR defaults, Settings labels, Chat "Explain in" all read
  `LANGUAGES`). Features carry NO strings (`features.test.js` enforces it).
- **Adding a language**: copy `locales/en.js` to `locales/<code>.js`, translate the values, import it in
  `languages.js` and add one entry. `src/i18n/locales.test.js` checks: same keys as English, same `{placeholders}`
  (a zh/ja-style singular may keep `{n}`), no dashes, no duplicate keys, count pairs.
- **The launcher, installer, splash and app window are translated too**, from the same locale files (the `ln_*`
  section). They cannot read JS, so `npm run i18n:launcher` (`scripts/build-launcher-strings.mjs`) copies those keys
  into `scripts/launcher-strings.json`; `locales.test.js` fails while that copy is stale. Readers:
  `scripts/launcher-i18n.ps1` (`Tr 'key' @{ name = value }`: launch.ps1, anki-start/-update, setup.ps1,
  install-ankiconnect.ps1), `scripts/launcher-i18n.cjs` (electron/main.cjs holding page; `t key name=value` in
  launch.sh / setup.sh), and splash.hta itself (ADODB.Stream + eval: legacy mode has no JSON). Language:
  `applang.json` (machine-local, gitignored, written by the server on every config read/save that names
  `appLanguage`) -> the system language -> English. `.app-status` is **UTF-8** (the splash reads it with
  ADODB.Stream and strips the BOM PowerShell 5.1 writes); a status starting with `@` is a message KEY (the VBS
  writes `@ln_starting` before any translation is loaded). Only the "no Node.js" messages of launch.sh/setup.sh
  stay English (node reads the translations). Log files (`logs/*.log`) stay English on purpose.
- `t(key, vars)` falls back lang → English → key. **A missing key renders as the raw key name**: add it to EVERY
  locale file. No em/en dashes. Count labels need singular/plural keys (`deck_countAll` / `deck_countAllOne`);
  zh/ja share one form. **No duplicate keys** in a locale: the later one silently wins.
- Nothing on screen is English-only any more (a 2026-09 scan). Screens shown BEFORE the config loads (slow start,
  failed settings read) and the crash screen (`ErrorBoundary`) use the last language this browser saw
  (`localStorage('ebiki-app-language')`, written whenever `appLanguage` changes). Keep it so: new text goes through
  `t()` from day one, including app-written messages (errors, receipts, tooltips). Inside memoized callbacks use
  `tLiveRef.current` (a callback holds the `t` of the render that created it).
- Verify with a node script that greps `t('...')` refs against the dicts (missing must be 0).

## Data folder (optional shared data directory)
All user data (`DATA_ENTRIES` = config.json, ankiformat.json, modes/, decks/, chats/, discover/, cache/,
keys.json) resolves through `DATA_DIR` in `vite.config.js`. **New server-side data paths MUST use `dataPath()`**,
never `path.resolve('…')`. Default = app root; overridden by machine-local `datadir.json` (gitignored) or
`EBIKI_DATA_DIR`, so several computers can share ONE folder (e.g. SMB). `/api/datadir` GET/POST switches live.
**The app folder is this computer's HOME.** Both directions may answer
`{needsChoice, context:'join'|'return', sourceOnly}`; the client re-POSTs `merge:bool`.
- **JOIN a share**: if the target has data and this computer has items it lacks, prompt (the client confirms
  before a merge writes to the share). `merge:true` = `deepMergeInto`, nothing dropped: one-sided files added;
  JSON on both sides deep-merged (`deepMergeJson`: objects by key, arrays unioned, scalar conflicts keep the
  target's); differing non-JSON kept as both, `name (from <label>).ext`. `merge:false` = adopt the target. Joining
  FROM the app folder stashes local data in `.local-home/` via `moveDataEntries`. Response has `merged` and
  `keptBoth` counts.
- **RETURN** (`{dataDir:''}`): RESTORES `.local-home/`, not a copy of the share. Share has extras → prompt;
  `merge:true` pulls them too. No stash → copy the share down so local isn't empty.
- `moveDataEntries` NEVER deletes (collisions → `local-data-backup-<date>/`). A share is written only by an
  explicit `merge:true`. UI: self-contained `DataFolderCard`, talking to `/api/datadir` directly, NOT via the
  config autosave (config.json lives inside the data folder). `logs/` stays machine-local. `/api/modes`
  re-derives `MODES_DIR` per request.
- **A switch RELOADS the page.** The page still holds the OLD folder's modes and settings; one routine save (deck
  pick, hook) would post them into the new folder, and `/api/modes` POST deletes every folder not named (even
  after a merge, erasing the other computer's modes). On success `DataFolderCard` calls `onDataFolderChanged`: App
  sets `dataSwitchingRef` (`setAnkiDeck`, `saveModes`, `updateModeById` and the config autosave bail on it),
  clears `configHealthyRef`, and reloads 1.5s later. New data writers must honor `dataSwitchingRef`; chat delete
  (after its dialog), knowledge delete/toggle (after `modesSaveRef`) and the knowledge upload POST check it too.
  The server refuses non-GET `DATA_ROUTES` writes for 3s after a switch (`datadirSwitchedAt`).

### API keys: local file, shared copy, self-healing backup
- `.env` is pinned to the CODE folder (`SELF_DIR` from `import.meta.url`), never `path.resolve('.')`, so a launch
  with the share as cwd can't write a credential onto the share. `EBIKI_ENV_DIR` overrides it (tests only).
  It is read line by line on `/\r?\n/` (a CRLF file saved from Notepad read as having no keys).
- **`writeEnv` MERGES.** Its argument is what the caller asserts: unmentioned providers are untouched; a provider
  is deleted ONLY when named with an empty value (a whole-state rebuild once erased a key). Keep it that way.
- `.env.bak`: mirrored on every read and every key-storing write; **only grows** (union of itself and `.env`, minus
  deliberate clears). If `.env` has no keys, `parseEnv` restores from it and logs it.
- `logs/keys.log`: every key write (source, stored, cleared, remaining). Provider NAMES only, never values.
- `.env.cleared` records intent to clear, so the self-heal doesn't undo it; storing any key removes it.
- `.env.declined` (machine-local JSON list) records a PER-PROVIDER clear: `writeEnv` adds a cleared provider and
  drops it once a key is stored again; the `syncSharedKeys` pull skips declined providers (else a key cleared on a
  share came straight back from `keys.json`, which is never shrunk).
- `keys.json` in `DATA_DIR` is the SHARED copy, synced by `syncSharedKeys()` on `/api/keys` GET/POST and the backup
  tick; skipped with no share or an unreachable one. Strictly additive both ways; when both sides hold a key, LOCAL
  wins. **Exception: a key the user TYPED** (`setCurrentKey` sets `keyEditedRef`; the save posts `?source=user`,
  read from `req.originalUrl` since connect rewrites `req.url`) replaces the shared entry, so a bad shared key can be
  corrected. Authority is PER PROVIDER: `keyEditedRef` holds the typed providers, sent as `&providers=`, and only
  those may overwrite (typing one key used to push every stale local key over another computer's fix).
  **A typed key gets that authority only after `validateKey` says it works** (true or 'noCredit'); a refused key is
  saved locally only, an unchecked one is re-queued (`keyCheckRetryRef`, 5 x 30s). A clear (empty value) keeps its
  authority. The save takes the typed providers PLUS any re-queued since its effect ran. A superseded save
  (`keySaveSeqRef`) yields to the newer one, re-arms a save (`setKeySaveRetry`) and sets `keyYieldedRef` (one
  follow-up after the newest save gets past its checks, `keySaveDoneSeqRef`); it never starts a save itself (two
  chains superseded each other forever). `keyMisfits` (wrong prefix / another provider's longer prefix) makes
  `validateKey` answer false and `refreshModels`/`findModelUpgrades` skip, WITHOUT sending the key.

### Auto-backup (one-way)
With a shared `DATA_DIR`, a `configureServer` timer runs `runBackup()` every 10 min (and ~20s after start):
`copyNewer` mirrors `BACKUP_ENTRIES` (`DATA_ENTRIES` minus `cache`) into `.local-sync/` (gitignored,
watch-ignored) by size+mtime. Never writes to the share; skips an unreachable share (`dataEntriesPresent`).
`.local-sync/` is the BASE for offline reconcile. `copyNewer` MIRRORS (a folder listing with entries removes what
the share no longer has; an empty listing never empties the base); a file it can't copy is skipped and counted
(`lastBackup.error`), never rethrown. `runBackup` reads `DATA_DIR` once (a switch mid-probe skips the run). A switch
stamps `.source.json` right after parking (else a failed run deleted the parked snapshot). JOIN of an EMPTY folder
while the old share is dead creates `modes/` so the new folder counts as reachable. `/api/sync-backup` GET
`{enabled, at, files, error}`, POST = back up now. UI in `DataFolderCard` (shared folder only).

### Unreachable-source guard (anti-clobber) - DO NOT REMOVE
A dead mapped drive reads as EMPTY (autosave wrote defaults back; onboarding reappeared), and touching it THROWS
(an unwrapped `mkdirSync` became Vite's full-screen error overlay). One guard fronts every data-backed route
(`DATA_ROUTES` = config, ankiformat, modes, knowledge-sections, deck-progress, discover-store, question-bank, chats,
chat-load), branching on `dataMode()`: **`down`** (no share, no snapshot) → 503 `{unreachable:true}`; **`offline`**
→ serve the local copy + `X-Ebiki-Offline: 1`; **`online`** → pass through. Deliberately NOT guarded:
`/api/datadir`, `/api/keys`, `/api/log`, `/api/anki`, `/api/update`, `/api/web-search`, `/api/tts`. The top-level
`mkdirSync`s in `/api/modes` + `/api/chats` are wrapped. Client: a failed config fetch sets `dataUnreachable`,
leaves `configHealthyRef` false (autosave bails), and a red banner replaces onboarding.

### /api is for the app only (security)
- **`apiRequestAllowed` fronts every /api route** (first middleware). Handlers parse bodies as JSON whatever the
  Content-Type, so any website could send a no-preflight text/plain POST (a `/api/modes` POST naming one mode
  deletes all others; `/api/anki` drives Anki). Plugin middlewares also run BEFORE Vite's `allowedHosts` check, so
  DNS rebinding reached them. Rules: Host must be loopback (`localhost`, `127.0.0.1`, `[::1]`, port optional); an
  Origin, when present, must equal the Host (`null` fails); `Sec-Fetch-Dest`, when present, must be `empty` or
  `document` (an `<img src=/api/...>` in rendered content is same-origin and sends no Origin). The server also sets
  `cors:false`, `X-Frame-Options: DENY` and `frame-ancestors 'none'`. (No `fs.deny` globs: `**/discover/**` would
  block `src/discover`.) Real callers pass: the page/overlay are same-origin; Electron main, the launch scripts and
  curl send no Origin. Tests: `src/keys/api-guard.test.js`. Every new route must live under `/api`.
- **Never build a path from raw client input.** Chat ids must pass `isSafeChatId` (`[A-Za-z0-9_-]`); deck progress
  folders go through `deckDirName` (`::` → `--`, Windows-invalid chars → `_`, so subdecks save on Windows; a valid
  name maps to itself). Knowledge uploads accept only `.txt`/`.md` names, never `.`/`..`.
- **Never parse untrusted HTML with `innerHTML` on an element of the live document** (even detached, an
  `<img onerror>` in a card field runs with full /api access). `stripHtml` uses `DOMParser` (inert). Rendered HTML
  goes through DOMPurify (`Markdown.jsx`, every `dangerouslySetInnerHTML`). `sanitizeHtml` forbids MEDIA too
  (`img`, `video`, `audio`, `source`, SVG `image`/`use`, `srcset`/`poster`/`background`/`ping`): nothing rendered
  may load a URL by itself (a reply's `![](https://evil/?d=...)` exfiltrated with no click). Render-only;
  `sanitizeCardHtml` keeps images in cards written to Anki. Also forbidden: `dialog` (`<dialog open>` is positioned
  by the browser's own stylesheet) and the popover attributes. The inline-style hook drops any style with a
  backslash or `/*` (escapes and comments disguise the rest) or `url(`, `image-set`, `@import`, `expression(`,
  `position: fixed|absolute|sticky`. Every OTHER attribute holding `url(`/`image-set` is dropped unless it is a
  local `url(#id)` (SVG filter, mask, fill, marker...), and `href` survives only on `<a>` or as `#id` (gradients,
  patterns, textPath loaded remote URLs). `renderTappableBack` strips `[sound:]` (the Learn-it panel showed it as
  text).

### NEVER WRITE BACK WHAT YOU FAILED TO READ (the clobber family)
An autosave that posts WHOLE state must not run on state from a failed read; a handler that treats "absent" as
"delete" must refuse an empty payload.
- **API keys.** The load tags its read (`_ok`, stripped); `keysHealthyRef` gates the autosave like
  `configHealthyRef`; typing a key (`setCurrentKey`, the one funnel for onboarding + Settings) re-enables it.
  Clearing a key posts that provider with an empty value.
- **`syncSharedKeys` reads via `parseEnv()`, never `readEnvFile()`** (it writes what it reads, so it must pass the
  `.env.bak` self-heal), and never publishes a `keys.json` smaller than the share's.
- **`aiCall` never sends one provider's request with another's key.** A key equal to ANOTHER provider's stored key
  is stale (closure from before a provider switch) and is swapped for the live one; a freshly typed key matches
  nothing, so validation is unaffected.
- **Selected vs usable provider can disagree, and the app says so.** `provider` lives in the shared `config.json`,
  keys in this machine's `.env`, so joining a share can select a provider with no local key. An in-flow amber
  banner names it and offers both fixes. Deliberately NOT an auto-switch; never persisted.
- **Modes.** `/api/modes` POST deletes every folder not in the payload, so `{modes: []}` would erase all modes and
  knowledge bases. `setAnkiDeck`, `saveModes` and the server all refuse an empty list.
- **Whole-blob stores (memory hooks, grammar log, Discover ledger, dupignore) read through `readBlobChecked`**
  (`src/discover/storage.js`): `{ok, value}`; ok:false = NOT readable (Anki threw AND the local store failed or
  was empty; a 503 share). Every writer REPLACES the blob, so: hooks and grammar persist only after the mode's read
  succeeded (`hooksReadyRef`/`grammarReadyRef`; earlier items are MERGED into the loaded data, then saved); ledger
  writes need a real read or a cached ledger (`discoverLedgerWritableRef`); "do not merge" needs
  `dupIgnoreReadOkRef`. `readBlob` is unchanged for read-only callers. Tests: `storage-read.test.js`.
  A write that reached the local store but NOT Anki marks the key "local is newer" (localStorage
  `ebiki-blob-local-newer:*`): reads prefer the local copy while it stands and push it back to Anki (Anki's older
  copy used to win the next read, and the next write lost the newer data); the push-back clears the mark only if no
  write happened meanwhile (`writeSeq`). With the mark set, a REFUSED local read (503) is a failed read, never Anki's
  older copy. Writes of one blob (and the push-back) are QUEUED per key (`blobChains`), newest content wins
  (`blobLatest`): parallel writes landed out of order and stored the older copy. `writeBlob` returns false while
  `setBlobWritesPaused(true)` (set with every `dataSwitchingRef.current = true`); the pause is re-checked inside the
  queued run, before the Anki store and before the local-store fetch (a write queued or waiting on Anki before the
  freeze went out after it). Mode names whose blob key (`storageKey`) collides clash (`modeNamesClash`:
  "Spanish 1" vs "Spanish-1").
  **With a SHARED data folder the store is read FIRST** (`/api/discover-store` GET answers `shared`): every computer
  writes it on every write, while each Anki only catches up through AnkiWeb (a lagging Anki copy won the read and
  the next write dropped the other computer's items). Anki is the fallback, and first again while the per-browser
  `ebiki-blob-anki-newer:*` mark says the store write failed. App-folder installs keep Anki first.
- **Deck progress notes** are read with `readDeckProgress` (`{ok, content}`; a missing file is a real empty read).
  Chat `<progress-update>` and "Generate Insights" REPLACE the file, so both write only over notes actually read
  (`deckProgressOkRef`, `chatTabAttachedDeck.progressOk`, `existingOk`), RE-READ before writing and write only if the
  file still equals what the prompt saw (`progressDocAtSend`, `existingProgress`); Insights honors
  `dataSwitchingRef`. The deck-progress and discover-store GETs treat only ENOENT as empty (any other read error is
  a 500).
- **`ankiSetNoteTags` moves only the difference, adds first.** It removed every old tag, then added the new set, so
  a failure between the calls left no tags. Case-only changes are remove + re-add (Anki matches tags
  case-insensitively); wanted children of a removed tag (`a::b` under `a`) are re-added afterwards.
- **A failed config save retries** (`cfgSaveRetry`, like `keySaveRetry`). "Run setup again" is LOCAL
  (`rerunSetup`), never `onboarded:false` in the shared config. A TYPED key in Settings is validated (debounced).
- **The config autosave posts only CHANGED keys** (`lastSentCfgRef`; a failed save un-marks only ITS keys, never
  the whole ref, or the next save posted everything): a whole-config post from one computer reverted settings
  another computer had just changed in the shared `config.json`. The per-provider / per-model maps
  (`NESTED_CONFIG_KEYS`: aiModels, modelPresets, rejectedModels, modelPlans, modelCards, modelAvailability,
  availableModels, pronunciation) are diffed TWO LEVELS DOWN (`aiModels.gemini.chat`,
  `pronunciation.defaultRegions.es`; `src/utils/configDiff.js`, shared by App and `writeConfig`): only changed
  entries post, removed ones go in `__unset` as paths, the server merges. The load SEEDS `lastSentCfgRef` with what
  the file holds (an ignored unknown provider seeds the local default), so the first autosave after launch posts
  only real changes (it used to post everything). An entry under a map that went away is still returned in `paths`
  (not `__unset`), so the App forgets it: kept as "sent", the same value picked again posted an empty map.
- **The chat save reads the disk copy STRICTLY**: only ENOENT is "new"; a locked/torn read retries once, then
  503 (it overwrote the other computer's turns). A same-turns save keeps `synced`/`addedTo` of chat cards already
  on disk (a stale window reset "Added" and invited a duplicate note), carried over by POSITION + front + back
  (one-meaning-per-card fronts repeat). Error bubbles (`error: true`) are left out of the prefix compare and the
  saved copy (the Chat tab kept them, Help dropped them: forks).
- **A chat save whose disk copy is not a prefix of the incoming messages FORKS** (server returns a new id +
  `forked:true`; the client adopts it only while that chat is still open): two windows continuing one chat used to
  overwrite each other. Help re-reads its chat (`/api/chat-load`) before sending.
- **Chat sessions** (Chat tab AND Ebi's Help): a chat that fails to load is NOT opened empty (its id would take the
  next save), including restore-on-refresh and Help's load-on-mount; rename refuses to re-save from a failed read;
  switching, starting, or deleting the open chat is ignored while a reply is pending (the reply lands and saves
  where it was asked). A failed save keeps the old id (undefined made the next save a new chat). Ordinary saves
  send `keepTitle` (Chat tab and Help): the server keeps the title on disk, so a rename survives the next message,
  and a save that sends no `type` keeps the file's (a Help chat continued in the Chat tab stays a Help chat).
  Switching / New chat re-saves the open chat only when its list differs from the last saved or loaded one
  (`chatSavedMsgsRef`): an unchanged stale copy forked a truncated duplicate. If that save FAILS
  (`chatLastSaveOkRef`), leaving asks first (`chat_leaveUnsaved`). A send WAITS for a photo still being read or
  re-encoded (`chatImagePendingRef`, counted from before the FileReader via `attachChatImageFile`), then reads
  it from `chatTabImageRef`.
- **An async result lands only where it was asked, and never writes back a whole array copied before the await.**
  Capture a token at the start; drop the result if it moved: `discoverGenRef` (mode or Discover deck switch),
  `scanGenRef` (Picture scan; indices are reused across scans), `pinGenRef` (pinned Picture word),
  `stillOnQuestion` (meaning hint, Fix question), the grader's `stillGrading` ("Back" undid the card),
  `studySessionRef`, `knowledgeFilesSeqRef`/`modeKnowledgeSeqRef` (a slow load after a mode switch fed the previous
  mode's knowledge base to every AI call). A tapped-word lookup lands only on its own popup (`lookupId` token from
  `lookupSeqRef`; the same word tapped on the next question is a NEW popup; a closed popup stays closed), glosses
  only on a question with the SAME text, Learn-it replies only on the same front, the Chat "Attach deck" pick by
  sequence (`chatAttachSeqRef`). A reply changing ONE item merges into the live list with a functional update (the
  study feedback chat once wrote back the card list copied at send time, reverting grades that landed meanwhile;
  those cards sat on "Evaluating" forever). A list copied for write-back must also drop what the action just
  cleared (accepting a search offer re-added its buttons). A mode switch closes the lookup popup and bumps
  `pinGenRef` + `resetPinBusy()`. `startStudySession` takes the LIVE mode's deck after its read. `markDeckEdited`
  off the Deck tab syncs to study at once (`syncDeckEditsToStudyRef`).
- **Memoized callbacks list what their prompt reads.** `useCallback` deps include the mode and knowledge they use
  (`autoExplain` explained in the previous mode's subject) and every language (`lazyTranslate` ignored a new
  `targetLang`). Models are safe: `resolveModel`/`aiCall` read `aiStateRef`.
- **Grader flags are parsed with `aiFlag`** (`correct`, notes' `penalize`; `fix_typo`'s `shouldBeCorrect` too): the
  model also answers them as the STRINGS "false"/"False"/"no". Question hints go through `hintText` (strings only).
  The feedback chat's `mark_all_correct`/`fix_typo` apply only while the card is still GRADED with the same answers
  (`stillGraded`: after Back, "all correct" over zero results rated it Easy); marking correct also clears
  `penalize` and sets a PBQ's `score` to 1. End Now clears rating/ease on the cards it skips. A study memory hook
  lands only on the same card in the same session. The feedback chat's `update_card` re-reads the note, keeps
  images, `[sound:]` and its credit, and refuses a field with `hasUnkeepableMarkup` (`fbr_cardKeepsMarkup`); after
  it succeeds the session takes the note's NEW fields (a second edit wrote over the first). A failed post-lock
  correction puts the OLD rating/ease back (else the retry saw no change), and stats move only after it succeeds
  and never for `relearn` copies (also in `rateGradedCard`).
- **Answer handlers write ONE card into the live list** (`commitCard(states, cardIdx)`), never the render-time
  array: a grade or pull landing in between was reverted. A post-lock correction needs `preSyncInfoRef` (no
  live-interval or 1-day guess; `fbr_noPreSchedule`).
- **Only the NEWEST grading of a card lands** (`evalTokenRef`, keyed session:card, checked in `stillGrading`
  AND the catch): Back + the same answers started a second grading, and the first one's failure wiped it.
  Accent slips are per question (`accentSlipQs`); Back and an abandoned drill remove them
  (`dropQuestionAttempts`); Back to ANOTHER card also cleans the drill's card (the question on screen), not only the
  undone one. Answer matching composes to NFC first.
- **A grading reply must cover every question** (`complete` in `evaluateCardAnswers`): `parseAiJson` salvages the
  complete rows of a truncated array, and counting wrong answers over those alone rated a card Easy. One question:
  a lone ROW object (`correct` in it; wrapped as the one row) or a wrapper's single list counts; any other object is
  unreadable. A wrapper's list counts only when every entry is a row with `correct`.
- **Bulk-edit saves re-read the cards first** (`commitAcceptedRecs`): a suggestion replaces the fields/tags it names
  as they were when the check ran, so a card edited since (deck browser or Anki) is skipped with
  `deck_changedSinceSuggest`. Fields that had bold `Label:` lines go back through `cardBackToHtml`.
- **A config.json that EXISTS but won't parse is not "no config".** `readConfigSettled` (the GET) retries ~1s
  (another computer mid-write); an IO failure then answers 503 (client: unreachable, autosave off); a file that
  truly isn't JSON is RENAMED to `config.json.corrupt-<stamp>` (kept) and served as fresh, so one bad file can't
  lock the app out. `config.json.*` is gitignored and watch-ignored. **Every whole-file data write uses
  `writeFileAtomic`** (temp file + rename; plain write only if the rename is refused) for `writeConfig`, chats,
  mode configs, deck progress and Discover blobs: readers never see a half-written file, and an interrupted write
  can't truncate one. A failed TEMP write throws and leaves the real file alone (falling back on a full disk
  truncated config.json to 0 bytes).
- **Every parsed text read in vite.config.js goes through `readUtf8`** (strips a UTF-8 BOM, which PowerShell
  5.1 and older Notepad write): with one, a valid config.json was renamed `.corrupt-*` (back to onboarding) and
  a `.env`'s first key was never found. `electron/main.cjs` strips it for launchmode.json too.
- **Every `spawn()` in vite.config.js has an `'error'` listener**: ENOENT/EACCES arrive as an event, and an
  unhandled one is an uncaught exception that kills the dev server.

### Offline mode (run from local copy, reconcile on reconnect)
With the share unreachable the app runs from `.local-offline/` (gitignored, watch-ignored), seeded once from
`.local-sync/`. **Three folders, three jobs - don't collapse them:** `DATA_DIR` = shared truth (written only by
explicit user action), `.local-sync/` = BASE (never written by offline mode), `.local-offline/` = offline working
copy. The pristine base makes reconnect a real 3-way merge.
- `dataPath()` routes through `.local-offline` while `offlineActive`, so every endpoint follows. `dataMode()` runs
  per request with a 3s `shareReachable()` cache (dead SMB probes block); a probe that finishes after `DATA_DIR`
  changed is not cached (it answered for the old folder). A returning share ends offline mode without a restart;
  `.local-offline/` stays until reconciled. `enterOffline()` returns false with no snapshot (the only `down` case).
- **Reconcile** (`/api/offline`: GET `{offline, pending, since, changes}`, POST reconciles, POST `{discard:true}`
  drops edits): only files differing from base; share missing or unchanged → fast-forward; share also moved →
  `deepMergeInto(..., basePath)` (non-JSON kept as both, `name (from this computer offline).ext`). **JSON merges
  against the base** (`deepMergeJson(theirs, mine, base)`): a value only this computer changed wins; only a value
  BOTH sides changed keeps the share's (without the base, an offline setting was lost whenever another computer
  touched anything else in the file). Key DELETIONS merge the same way: a key one side deleted and the other left
  equal to the base stays deleted. A LIST only one side changed is taken from that side (the union revived deleted
  items). Join/return merges pass no base (scalar conflicts keep the target). Tests: `merge3.test.js`.
  `offlineChangedFiles` skips `cache/` and `*.<pid>.tmp` and counts an unstat-able entry as a change;
  `deepMergeInto` and the join/return `cpSync`s skip `*.<pid>.tmp`. Reconcile and `deepMergeInto` write with
  `writeFileAtomic`. Chats whose messages are a PREFIX of the other side's (continued, or only re-saved) merge into
  the longer one (target's title/type/mode); only diverged histories are kept, as `<id>-copy.json` (its file name is
  its id and must pass `isSafeChatId`); "a chat" = a file DIRECTLY in `chats/` (not a path merely containing that
  word). Reconcile goes PER FILE: failures are collected, the rest is merged, and the offline copy stays (the error
  names the files) until all went through. Merged files are recorded in `.offline.json` `applied` (path -> content
  hash); a retry merges only the rest (re-merging duplicated kept copies and reverted online edits).
  `offlinePendingFiles()` is the pending count. The `/api/offline` GET removes an offline copy with ZERO changes
  once the share is back (it paused backups forever and the bar offers nothing for 0 changes). Then
  `.local-offline/` is removed and `runBackup()` refreshes the base. `runBackup` re-checks offline state AFTER its
  reachability probe; Discard and the zero-change cleanup trigger a backup.
- **`.local-sync` records its folder** (`.local-sync/.source.json`, `backupIsForOtherFolder`): a backup of a
  different folder first parks the old snapshot in `.local-sync/.previous`; `enterOffline` refuses a snapshot of
  another folder; a folder switch starts a backup 2s later. RETURN with the share down and no stash seeds the app
  folder from the offline copy (if it is that share's) or `.local-sync`.
- **The offline copy belongs to one data folder** (`.offline.json` `dataDir`, `offlineCopyDataDir()`):
  `enterOffline` won't serve another folder's copy, reconcile refuses to merge it elsewhere (409), and a
  data-folder switch resets `offlineActive` + `reachCache` (else the new folder routed through the old share's
  offline copy for up to 15s).
- **A wake from sleep is not an outage**: the first failed probe after being online waits up to
  `SHARE_WAKE_WAIT_MS` (20s, re-probing every 2s, one shared wait) before offline mode starts, so a drive that is
  only reconnecting never trips it (a folder switch clears `shareWasOnline`).
- **The share coming back is handled WITHOUT asking** (the owner hated the red "reload now" box after every sleep):
  no offline edits = nothing to do (routine saves post only changes); offline edits are merged in the background
  with the normal 3-way merge and a green toast says so. Only a merge that FAILS falls back to the old path: freeze
  writers (`dataSwitchingRef` + `configHealthyRef` off) and the `shareBackReload` banner. Never an automatic reload
  (it threw away in-flight work). The manual Merge and Discard buttons still reload. A copy parked for another
  folder shows `offlineOtherFolder`; backups stay paused for it (refreshing `.local-sync` would destroy that copy's
  merge base). Folder identity is `sameFolder` (case-insensitive on Windows/macOS). JOIN with `merge:false` copies
  NOTHING onto the share.
- **Offline deletions are NOT replayed** (indistinguishable from never-synced; re-deleting shared data is
  unrecoverable). Deletions made ELSEWHERE are honored: an offline edit of a mode tombstoned in the share's
  `modes/.deleted.json` is skipped (recorded as applied). A share folder of the same name holding ANOTHER id is
  never merged into: the offline mode goes to `<name> N` (`clashDir`) and its config takes that name. `redirect`
  order for every offline `modes/<dir>/` file: the id's current share folder (`homeOf`), then the tombstone (skip),
  then a same-name clash (`freeClashName`), else as is. The `modes/<dir>/` patterns take BOTH separators (`[\\/]`):
  `rel` comes from `path.join` (backslashes on Windows); a `[\/]` class matched only "/" and none of these rules ran
  on Windows.
- Client: the config fetch reads `X-Ebiki-Offline`; a 30s `/api/offline` poll drives an amber dismissable banner
  and, once the share is back, an "N offline changes waiting · Merge / Discard" bar, shown only when the automatic
  merge failed. `offlineBusy` holds `'merge'`/`'discard'` so the bar names what it's doing (SMB reconcile can take
  seconds). The poll acts only on a real status (`typeof d.offline === 'boolean'`): a 500 read as "share back" and
  froze writers.

**Banners render IN FLOW above `<header>`, never `position:fixed`** (a fixed bar covers the header and eats its
clicks).

**Delete a banner's button and its handler together, and a handler's banner with it.** Removing the update banner
once took `resolveOffline` with it (buttons stayed; every click threw a silent `ReferenceError`), and separately
deleted the AnkiWeb banner JSX but left its handlers and probe. JSX has no compile step to catch either, and these
banners render only in rare states. Before removing UI, grep every handler it names for other callers, and every
nearby block for what it renders.
## How Ebiki opens: app window vs browser tab (per computer)
Users pick the Electron window or a browser tab (tabs make it easy to research a word and come back).
- **Machine-local** (`launchmode.json`, gitignored, `{mode:'app'|'browser'}`), not `config.json`: computers on one
  share may differ, and the launcher reads it before the dev server exists. Missing/unreadable = `'app'`. **FOUR
  readers must stay in sync**: `readLaunchMode` (`vite.config.js`), `Get-LaunchMode` (`scripts/launch.ps1`),
  `launch_mode` (`scripts/launch.sh`), `readLaunchMode` (`electron/main.cjs`).
- `/api/launchmode` GET/POST is NOT in `DATA_ROUTES` (must work with the share down). UI: `LaunchModeCard`
  (Settings > General) + an onboarding step, both rendering `LaunchModeOptions` (`src/components/LaunchModeChoice.jsx`).
- **A live switch is a HANDOFF.** POST `{switchNow:true}` spawns the other front end; the old page polls until the
  new one reports via `/api/launchmode/hello` (`{kind}`, sent by every page on mount), THEN closes (closing first
  trips the server's auto-exit). A browser tab can't close itself, so it says so. `main.cjs` also says hello from
  `second-instance` (switching to an open window only focuses it). A page that handed over retires its Switch
  button (`handedOver`); re-picking a tile clears it.
- **Every entry path honors the choice, including the taskbar pin** (which pins the bare exe path). `main.cjs`
  treats a launch without `--from-launcher` as bare: in `browser` mode it hands off to the launcher, and it starts
  the launcher when nothing answers on 3000. `launch.ps1`/`launch.sh` and the switch-now spawn pass
  `--from-launcher`. No recursion: browser mode never starts Electron; a launcher-started duplicate loses the
  single-instance lock.

**External links open the REAL browser**, http(s) only (other schemes launch arbitrary protocol handlers).
`setWindowOpenHandler` denies child windows and calls `shell.openExternal`; a `will-navigate` guard does the same
for plain links; both on the app window AND the overlay (shared `openExternally`). "Is this the app?" is
`isAppUrl` (ORIGIN equality), never `startsWith(VITE_URL)`: `http://localhost:3000@evil.example/` passes a prefix
test. Both windows' `will-navigate` follow only `isAppPage` (the root, or `?overlay=true`); another app path is
blocked. The Markdown hook gives SVG `<a>` (lowercase tagName) `target=_blank` too. The overlay's `close` handler
hides instead of closing ONLY while `!appQuitting` (set on `before-quit`), else it blocks app.quit, SIGTERM and
Windows shutdown.

**The overlay's global Esc is held only while it is visible AND focused** (`registerOverlayEsc`, dropped on
`blur`): a shrunken overlay beside another app swallowed that app's Esc. A failed `Alt+Q` registration exits the
overlay (`app.exit(2)`) so it isn't reported as running; a failed page load (`overlayPageOk`) makes Alt+Q
reload instead of showing an invisible full-screen window. Every `spawn` in main.cjs has an `'error'` listener.
The overlay runs on its OWN profile (`userData/overlay`): Chromium locks a profile's storage to one process, and
the second of the two lost all localStorage. A capture with no server answering shows nothing. The launcher
revive guard (`revived`) resets only on `did-finish-load`; `window-all-closed` waits 500ms so the goodbye leaves.
A `did-fail-load` sets `navFailed`/`overlayNavFailed`, and `did-finish-load` is ignored until a main-frame
navigation TO the app (`isAppUrl`) starts: the error page keeps the app URL, and the holding page's own
navigation must not clear the flag.

**Captures use the PRIMARY display's source** (`primaryScreenSource`, by `display_id`), which the overlay covers;
`sources[0]` could be another monitor.

## Windows installer & launch
- **Exactly ONE user-runnable file in the root: `Install Ebiki.bat`.** Scripts live in `scripts/` (`setup.ps1`,
  `launch.ps1`) and resolve the app folder as `Split-Path $PSScriptRoot -Parent`. `launch-ebiki.vbs` + `ebiki.ico`
  MUST stay in the root (existing shortcuts point at them by absolute path).
- `Install Ebiki.bat` → `scripts/setup.ps1`: winget-installs Node.js, Git, **Anki** if missing; installs
  **AnkiConnect**; `npm install`; Desktop + Start Menu shortcuts to `launch-ebiki.vbs` with `ebiki.ico`.
  `launch-ebiki.vbs` → `scripts/launch.ps1` starts the dev server hidden (if 3000 already serves, it just opens the
  app). Everything is path-relative (`$PSScriptRoot` / `%~dp0` / `APP_ROOT`); never hardcode a path.

### Start-up splash (the click must show something immediately)
Launch steps are invisible, so `launch-ebiki.vbs` shows `scripts/splash.hta` via `mshta.exe` BEFORE `launch.ps1`.
- `showintaskbar="no"` is deliberate: mshta is its own process, so "yes" adds a second Ebiki taskbar button
  (grouping needs an AppUserModelID an HTA can't set).
- Every `<hta:application>` attribute must be bare; a comment inside that tag silently disables the whole block
  (the title bar returns).
- **Stay in LEGACY rendering mode**: `x-ua-compatible ie=edge` breaks `caption="no"`/`border="none"`. So the
  progress bar is stepped in JS (no `@keyframes`) and `xmlns:hta` stays on `<html>`.
- Text is a COLUMN (`.col`, `margin-left:116px`), not text wrapping a float, so long messages don't wrap under Ebi.
  `fitWindow()` measures content and sizes/centers the window. Ebi is 221x126 (fixed width, free height).
- **Closes on a file handshake**: polls `<app>\.app-ready`, touched by `electron/main.cjs` on `ready-to-show`.
  `launch.ps1` (`Signal-AppReady`/`Wait-AppReady`) signals on every other path (browser fallback, missing Node,
  early return, crash via `finally`); `Wait-AppReady` stops if its Electron exits. 3-min HTA cap as last resort;
  the VBS deletes a stale marker first.

### The app window heals itself
`.app-ready` is written ONCE per process (`readySignaled`): a reload of an open window closed a second launch's splash.
A white window = the dev server isn't answering. `main.cjs` loads in a loop: 15s per `waitForServer` attempt, a
themed "Waiting for Ebiki's server" holding page between attempts (`showHolding`, guarded against reload flicker),
main-frame `did-fail-load` feeds the retry (except `-3`/ERR_ABORTED: a load replaced by a newer navigation, not a
dead server), `did-finish-load` marks success.

## Updates (track `origin master`; the offer must be impossible to miss)
This design is a bug fix (an update popup opened UNDER the splash, froze launch 60s, then snoozed a week, so a user
ran a fixed bug for weeks). Don't simplify it back.
- **Checked on EVERY shortcut launch**: `launch.ps1` compares `git ls-remote origin master` (6s timeout job, never
  blocks offline) with HEAD. No snooze: "no" just opens the app. Both launchers delete any old `.update-snooze`.
- **Asked INSIDE the splash** (`Ask-InSplash` in `launch.ps1` ↔ `showPrompt`/`answer` in `scripts/splash.hta`).
  Handshake files (gitignored, cleared by `launch-ebiki.vbs` + launch.ps1's `finally`): `.app-splash` (HTA is up;
  without it `Ask-InSplash` returns `nosplash` and falls back to a topmost `MB_SYSTEMMODAL|MB_SETFOREGROUND`
  popup), `.app-status` (`PROMPT|<question>`), `.app-answer` (`yes`/`no`). The splash ignores a `PROMPT|` it
  already answered (`answeredPrompt`).
- **A second launch while one is busy is a FOLLOWER** (a second launcher cleared the first one's update question,
  and the update was skipped). `launch-ebiki.vbs` sees `.app-splash`/`.app-status` touched in the last 3 min, keeps
  those files, opens no splash and sets `EBIKI_LAUNCH_FOLLOWER=1`; in `launch.ps1` that makes
  `Set-Status`/`Clear-Status`/`Signal-AppReady` no-ops, `Ask-InSplash` answer `nosplash` and the `finally` keep the
  handshake files. `main.cjs` bare launches don't delegate while `launcherBusy()`. The flag is for ONE launch:
  `launch.ps1` removes it from its environment, and the VBS sets it to "0" for a leader (inherited, it made a
  relaunch a silent follower under its own splash).
- **The VBS leader writes `.app-status` itself** before starting mshta (a double click made two leaders, and the
  second re-asked the update). The splash deletes `.app-splash` whenever it closes (`dropSplashMarker`,
  `onbeforeunload`), and `Ask-InSplash` returns `nosplash` when the marker vanishes mid-question. Every
  launcher popup that can happen with the splash up takes it down first and uses `4096 + 65536`.
- **The splash says what the launcher is doing** (`Set-Status` → `.app-status` → `sub` line). Its 3-minute cap
  measures SILENCE (any new status resets it); a pending question holds it open indefinitely. Long `npm install`s
  go through `Invoke-NpmInstall`, re-posting a status with elapsed seconds every 10s so the cap never closes the
  splash mid-install.
- **No in-app update banner** (the launcher asks every launch). Settings > Data & updates (`UpdatesCard`) is the
  only in-app surface and carries the RESTART.
- **The app can restart itself.** `POST /api/update/restart` spawns detached `scripts/relaunch.ps1` (waits for port
  3000 to go quiet, then runs `launch-ebiki.vbs`); the client closes its window (`window.ebikiWindow.close()`) so
  the auto-exit server frees the port. Offered only when `canRestart` (win32 + `EBIKI_AUTO_EXIT` + launcher files)
  AND `isElectronApp`; a tab gets "close and reopen" wording. **It must work with NO server**: fallback
  `window.ebikiWindow.restart()` (preload → `app-window:restart` → `app.relaunch()` with `--from-launcher`
  STRIPPED, so the new process is truly bare and starts the launcher). Order: server endpoint, Electron, manual
  wording.
- **Every update path targets `origin master` explicitly** (both launchers, both `/api/update` methods,
  `Link-ToGit`). A clone on another branch is never offered an update (it would never fast-forward): all surfaces
  check `rev-parse --abbrev-ref HEAD` first; `/api/update` GET returns `branch`/`onMaster`, and Settings names the
  branch.
- **MATCH master, don't just move toward it (a release can be RETRACTED).** After a backwards force-push,
  `pull --ff-only` exits 0 "Already up to date" forever. All update paths (POST, `launch.ps1`, `launch.sh`):
  `fetch origin master`, then `merge-base --is-ancestor HEAD FETCH_HEAD` → ancestor: `merge --ff-only FETCH_HEAD`;
  else `reset --hard FETCH_HEAD`. **The reset is refused if any TRACKED file is modified**
  (`status --porcelain --untracked-files=no`, reported `dirty`); user data is untracked, so normal installs are
  clean. Empty `ls-remote` = master deleted upstream → `remoteMissing`.
  **A reset only for a checkout on PUBLISHED history**: HEAD must be an ancestor of some value origin/master HAD
  (its reflog, plus its value read before the fetch) or of a commit HEAD took FROM the remote (HEAD reflog entries
  `clone:`, `reset: moving to FETCH_HEAD`, `pull...: Fast-forward` or `merge <sha>: Fast-forward` (git logs the sha,
  not FETCH_HEAD); a merging or rebasing pull records LOCAL commits); a clone does not log origin/master's first
  value, and any earlier fetch moves the ref. Commits made on master and never published are kept and the update
  refused (`localCommits` → `updatesLocalCommits`; launchers log it). Fetches carry `http.lowSpeedLimit/Time`; the
  launcher's unshallow runs only after `ls-remote` answered; `Invoke-NpmInstall` tree-kills after 15 min.
- **The already-running launch path checks too** (`Check-Update -AlreadyRunning`): closing the window doesn't stop
  the server at once (`/api/bye` + grace ping, up to 150s), so a quick reopen lands here. After updating it says
  "close Ebiki and open it again to finish" (the running server has old code). It skips its check while
  `/api/alive` says `updateRunning`. `launch.ps1` also `fetch --unshallow`s a shallow clone once.
- **`launch.sh` mirrors this** (macOS too): `run_with_timeout` (`timeout` → `gtimeout` → a portable fallback;
  macOS has no `timeout`, so the check silently never ran), decisions logged to `logs/update.log`, a Yes that
  didn't move HEAD is reported and skips `npm install`, and the tab fallback uses `open` where there's no
  `xdg-open`. The question uses zenity → kdialog → `osascript` (macOS has neither of the first two, so updates
  were skipped silently); none of them = logged skip. `open_app` also finds macOS's
  `dist/Electron.app/Contents/MacOS/Electron`. Without `flock` (stock macOS) it takes a `mkdir` lock
  (`.launcher.lock.d`, stale after 20 min or a dead owner pid; `release_lock`, which also clears the EXIT trap). A
  launch that WAITED on the lock skips the question; npm install runs under `run_with_timeout 900`. The
  already-running branch runs `check_update` too. `APP` is `pwd -P` (the server's command line holds the physical
  path), Anki starts from an argv ARRAY, every update skip is logged, and `launch_mode` greps the `"mode"` key only.
- **Updates only touch Ebiki's OWN checkout, never prompt, never twice.** `Check-Update` requires an EMPTY
  `rev-parse --show-cdup` (never a path compare: git prints UTF-8, the hidden 5.1 console decodes OEM, so an
  accented user folder never matched and never updated) (`launch.sh`/`/api/update`: `.git` in the app folder): a
  ZIP copy inside another repository updated THAT one. Git runs with `GIT_TERMINAL_PROMPT=0`/`GCM_INTERACTIVE=never`
  (a sign-in window hung the launch). A FOLLOWER launch skips `Check-Update` (it re-asked right after "Not now").
- **In `launch.ps1`, resolve PATH (`Ensure-OnPath`) BEFORE the already-running branch.** Shortcut launches inherit
  Explorer's stale PATH after an install, so `git` wasn't found and the check silently returned. Every skip in
  `Check-Update` logs its reason (no git, not a checkout, wrong branch, unreachable, already latest).
- **Every update decision is logged to `logs/update.log`** (who asked, answer, whether HEAD moved). Tested: only
  `'yes'` moves HEAD. A Yes that did NOT move HEAD (fetch failed, hand-edited tracked file, refused merge) says so in
  the splash, logs `update FAILED` and skips npm install (it used to say "Update installed"). The only path that
  changes code without a Yes is the installer's `Link-ToGit`, which warns first.
  ANY unpublished HEAD (ahead of origin or diverged) is not offered an update (`Test-HeadPublished` /
  `head_published` / `headPublished`, one rule in three places, with the current origin/master as the extra
  candidate); `/api/update` GET answers `localCommits` and UpdatesCard shows it. A failed install inside
  `Check-Update`/`check_update` is not retried in the same launch (`npmTriedThisRun` / `NPM_TRIED`).
- **Dependencies are checked at every start, not only after an update** (`scripts/deps-fingerprint.mjs`): code can
  change without an update path (a manual `git pull`, a branch switch, a synced copy), and then ran on the old
  node_modules (a missing package). Every successful install stamps `.deps-installed` (machine-local, gitignored)
  with a hash of package.json's dependency sections + the lockfile's package list + the Node ABI/platform (NOT the
  app version, so a release does not force an install): the `postinstall` hook, and again after each install in
  `launch.ps1`, `launch.sh`, `/api/update` and both setups (npm may write the lockfile after postinstall). Before
  starting the server both launchers run `--check` (exit 1 = install needed) and, when stale, drop
  `.npm-install-pending` so the existing pending-install block runs. It compares the code AS IT IS NOW, so several
  skipped updates are covered. A check that cannot tell (exit 2, no node) never blocks the start. Tests:
  `scripts/deps-fingerprint.test.js`.
- **Never `execFile` a `.cmd`/`.bat` without a shell**: current Node throws EINVAL synchronously (CVE-2024-27980),
  and inside a callback that kills the server. `/api/update` runs `cmd /d /s /c "npm install ..."` on Windows.
- **A failed post-update `npm install` leaves `.npm-install-pending`** (gitignored; written by `launch.ps1`,
  `launch.sh` and `/api/update`); the next fresh start installs before `npm run dev`. HEAD already matches master,
  so nothing else would ever retry it.
- **The launchers only ever stop EBIKI's server**: any HTTP reply (even a 404, which PS 5.1 throws on) counts as
  alive, and `Stop-StaleServer`/`stop_stale_server` kill only a port-3000 owner whose command line names the app
  folder. The launcher lock waits up to 20 min (an update question + npm install), then starts nothing. The app
  window's revive skips while `.app-status`/`.app-splash` were touched in the last 3 min (a launcher is busy).
- **`/api/update` robustness** (each was a real bug): GET has a `send()` watchdog so it ALWAYS answers (the timeout
  reply still carries local facts); git runs with `GIT_TERMINAL_PROMPT=0` + `GCM_INTERACTIVE=never`; POST holds an
  `updateRunning` lock with its own watchdog; the client retries a network failure ONCE, then shows
  `updatesServerDown`; `UpdatesCard` has an in-flight guard + sequence number (StrictMode double effects).
- `UpdatesCard` (Settings > Data & updates) checks on open: GET = `ls-remote` vs HEAD →
  `gitAvailable`/`reachable`/`updateAvailable`/`canRestart`/`current`/`currentDate`/`build`; POST = update +
  `npm install` → `restartRequired`, clears `.update-snooze`.
- **`.npm-install-pending` is written BEFORE `npm install` and removed on success** (`/api/update`, `launch.ps1`,
  `launch.sh`): an install cut off midway (window closed, reboot) otherwise left no marker. The POST watchdog
  (`guard2`, 660s) stays above the sum of its step timeouts. `/api/update` writes the install's `pid` into the
  marker; both launchers wait (15 min cap) while that process lives before their own pending install (an install
  that took the server down keeps running), but only for a node/npm process that STARTED before the marker (a
  reused PID held the launch 15 minutes). launch.sh reads `etimes`, else parses `etime` (macOS has no `etimes`: the
  wait never ran there). The name check takes the basename's first word (npm sets its title to "npm install").
  `findModelUpgrades` returns `null` when the model list can't be read (never "you are on the latest"). The
  auto-sync minutes box commits on blur (`ClampedNumber commitOnBlur`) and the timer re-arms on a new grace window.
- **`{ok:false, updated:true}` (code moved, npm install failed) is `done` + `updatesDepsPending`**: the restart runs
  the pending install; a Retry would say "up to date". `doUpdate` bumps `checkSeq`, and Check is disabled while
  verifying/restarting (a late check replaced the restart offer). Offline-merge refusals carry `code`
  (`busy`/`unreachable`/`otherFolder`) mapped to `offlineErr*` keys; `DataFolderCard` stays locked after a
  successful switch until the reload.
- **A dropped connection during an update is not a failure.** `npm install` inside the request can take the server
  down after the update applied ("Failed to fetch"). `confirmUpdateApplied()` polls **`/api/update?local=1`**
  (local-only, skips `ls-remote`: 0.1s vs up to 25s) and compares the commit sha. ONE answer settles it; the 45s
  deadline only covers "never came back" (→ restart offer).

## Dev server lifetime (one server per shortcut; the page owns it)
The shortcut starts the server hidden, and `vite.config.js` is watch-ignored (a phantom change event on the share
caused a restart loop), so a forgotten server keeps serving stale config. SHORTCUT launches only:
- `launch.ps1` runs "already running?" through "start it" under mutex `Ebiki.Launcher.SingleInstance` and sets
  **`EBIKI_AUTO_EXIT=1`**, which also enables `strictPort` (own 3000 or fail, never a hidden 3001).
- The page POSTs `/api/alive` every 5s and `sendBeacon('/api/bye')` on `pagehide` (skipped when `e.persisted`). A
  bye without later beats, or 150s of silence, is only a suspicion: the server pings `ebiki:ping` over the HMR
  socket and waits 4s (throttled background tabs still answer sockets). No answer → kill the overlay process TREE
  (`taskkill /F /T /PID`, never `/IM electron.exe`) and exit. The overlay page never beats (`isOverlay` returns
  early). `GET /api/alive` → `{autoExit, lastBeatAgoMs}` (check first when the server exits unexpectedly).
- **The Electron MAIN process heartbeats too** (every 5s while `appWindow` exists, goodbye on `closed`): a
  minimized/covered renderer is throttled, and the server used to exit with the app open.
- **Talk to the dev server as `localhost`, NEVER `127.0.0.1`**: Vite binds what `localhost` resolves to first, IPv6
  `::1` on current Node/Windows (and macOS for `launch.sh`).
- Manual `npm run dev` sets no flag: the endpoints answer 204, no timer. That's how to run a second copy.
- **No auto-exit while `updateRunning`** (a killed git left `index.lock`). The update's npm install has its own
  300s timer that tree-kills (`taskkill /T`), never execFile's timeout (it killed only cmd.exe). A restart POST
  calls `requestShutdown` itself 1.5s after answering (another open tab kept the old server alive). The overlay
  sweep is killed at its 10s cap. Update checks use `ls-remote origin refs/heads/master` (all three paths).
- **The app notices its server dying**: 3 missed `/api/alive` beats (~15s) show a QUIET amber line whose button
  opens Settings > Data & updates (`openConnectionSettings`), where `UpdatesCard` shows the `down` state
  (`serverDown` prop) and offers **Restart now** (same two-path restart). A beat that succeeds again reloads the
  page (it may be an old build).
- **The holding page must REVIVE the server, not just wait**: `createAppWindow`'s retry loop calls
  `delegateToLauncher()` after the first failed attempt, once per outage (`revived` resets only on a real load).

## Version (bump it; the build identity is derived)
- **Declared** `package.json` `version` is the headline in Settings. **Bump it in every commit that changes what the
  app does** (patch = fix, minor = feature); docs/comment-only commits don't.
- **Derived** line `<date> · build <n> · <sha>` from `git log -1 --date=format:%Y.%m.%d --format=%H|%cI|%cd` +
  `git rev-list --count HEAD`, so a forgotten bump still shows. `--date=format:` uses the COMMIT's timezone so every
  machine shows the same date; never `--date=format-local:` or client-side local-time Date methods. Build count only
  without `.git/shallow`. `setInfo` runs BEFORE the early returns in `UpdatesCard.check` so the version shows even
  when the check fails.

## ZIP installs become real clones
- A GitHub "Download ZIP" has no `.git`, so updates silently no-op. `setup.ps1` → `Link-ToGit`: `init` →
  `remote add` → `fetch master` → `checkout -B master` → `branch --set-upstream-to` → **`git clean -fd`**. Full
  history, not `--depth 1` (a shallow clone can't diff/log/revert; costs ~8.7 MB). Existing shallow clones get
  `fetch --unshallow`. The clean removes files the release renamed away and leaves the tree clean for
  fast-forwards; no `-x`, so gitignored user data survives. Prints the short SHA.
- **Trigger is `Test-GitHealthy`, not `Test-Path .git`**: healthy = checked-out commit + `origin` remote + upstream
  tracking (a half-linked `.git` must repair itself). **But a REAL clone is never linked** (`Test-RealClone`: e.g.
  a developer's local branch with no upstream): `Link-ToGit`'s `checkout -f` + `clean -fd` would destroy uncommitted
  and untracked work, so it is left alone (upstream repaired in place when on master). **ANY checked-out commit is a
  real clone** (`Test-RealClone` no longer needs `origin`): a clone whose remote had another name was sent to
  `Link-ToGit` and lost its work (reproduced). Both functions return false with no git on PATH: calling a missing
  `git` inside setup's main `try` is a TERMINATING error and used to abort the whole install.
- Setup requires Node 18+ (vite) and upgrades an older one; the seeded AnkiConnect `meta.json` carries `mod` =
  install time (0 looked outdated).
- **"Has a commit" = `rev-parse --verify -q HEAD`** (prints nothing on an unborn HEAD); plain `rev-parse HEAD`
  echoes "HEAD", so an interrupted `Link-ToGit` looked healthy and was never repaired.
- **Re-exec after linking**: the running script is the old ZIP copy, so `setup.ps1` re-execs once from the fresh
  files, guarded by env var `EBIKI_SETUP_RELINKED` (an env var because an older script ignores it; an unknown
  `-Switch` would stop it starting).

## The shortcut starts Anki (`Start-AnkiIfNeeded`, before the port-3000 check)
- Skipped when an `anki` process exists. Exe via usual folders → PATH → Start Menu `Anki.lnk` (the MSI records no
  path). Fail-soft.
- **Starts MINIMIZED, in two steps.** `-WindowStyle Minimized` doesn't reach the real window (the website install is
  a launcher that starts Anki from a venv), so `scripts/minimize-anki.ps1` runs DETACHED as a fallback. **One
  window, one time, 25s cap**: it acts only on Anki's MAIN visible top-level window (title `* - Anki`) and exits at
  the first sighting. **Never `Process.MainWindowHandle`** (returns a transient `Syncing...`/`Anki` window;
  minimizing those flashed the screen). **Never keep watching** (it would re-minimize an Anki the user opened on
  purpose). `ShowWindow(hwnd, SW_SHOWMINNOACTIVE)` (7), not `SW_MINIMIZE` (steals focus from Ebiki).
- **Always give that `Start-Process` a window style**: children of the hidden PowerShell inherit HIDDEN, so Anki
  ran with no window. Same reason for `-WindowStyle Normal` on the already-running branch's
  `Start-Process 'http://localhost:3000'`.
- **First-run Anki starts NORMAL** (the minimizer would hide the dialog the user must answer).
- **Anki boot watcher** (App.jsx): while `ankiConnected === false`, ping every 4s for a minute, then every 20s;
  `refreshAnkiConnection` once AnkiConnect answers. (Separate from the study reconnect watcher, which covers a live
  session with unsynced ratings and clears `studySyncError`.) It also re-fetches `/api/ankiconnect` every other
  tick (not in the overlay), else the banner stayed on a state (dialog open) the user had already fixed. Its
  one-ping guard is a ref (`reconnectPingBusyRef`): the effect re-runs on every card change.

## Anki + AnkiConnect install (setup, fail-soft, never throws)
- Anki: `winget install -e --id Anki.Anki`. **"Is it installed" (`Test-AnkiInstalled`, Uninstall `DisplayName`) and
  "where is it" (`Find-Anki`: usual folders → PATH → registry) are separate**: the MSI records no
  `InstallLocation`/`DisplayIcon`/App Paths. Every step is skip-if-present.
- **`scripts/install-ankiconnect.ps1` is the ONE implementation**: dot-sourced by `setup.ps1`, run with `-Install`
  by the server (prints one JSON line). Sources: AnkiWeb
  (`https://ankiweb.net/shared/download/2055492159?v=2.1&p=<numeric point version>`; bare
  `/shared/downloadFile/<id>` 404s), then the GitHub repo zip (payload folder LOCATED under
  `<repo>-master/plugin/`). Staged in TEMP; copied into `%APPDATA%\Anki2\addons21\2055492159` (honors `ANKI_BASE`)
  only after the `webBindPort` signature verifies. Seeds `meta.json` with no `config` key, so AnkiConnect's
  127.0.0.1:8765 defaults win (the `/api/anki` proxy is server-side, so CORS is irrelevant); written WITHOUT a BOM
  (Anki's `json.load` rejects one). Idempotent: never overwrites an existing add-on.
- **Detection is by SIGNATURE** (`Find-AnkiConnect`: any `addons21/*` whose `config.json` mentions `webBindPort`),
  not add-on code: forks like "Anki Connect Plus" (2036732292) conflict with 2055492159.

## Anki setup states and the AnkiWeb account
`/api/ankiconnect` GET reports `{installed, addon, base, canInstall, configured, ankiRunning, ankiMainWindow,
ankiAwaitingInput, ankiDialogs, ankiLauncherStuck}`; POST installs. `renderAnkiOfflineBanner` branches on it, in
priority:
1. **Launcher stuck** (`ankiLauncherStuck`, see Anki updates).
2. **Anki waiting on a dialog** (`scripts/anki-state.ps1`): the main window is titled `"<profile> - Anki"` and exists
   only once a profile is open; first-run dialogs are plain `"Anki"`. Running + plain-"Anki" window + no main window
   = stopped on a question. Names the dialog.
3. **Anki not set up**: no `<profile>/collection.anki2` under the Anki base (`configured:false`). **Not
   `prefs21.db`**: Anki creates that at the very start of first run (`profiles.py` `_loadMeta`). Shown as numbered
   steps ending on signing in to AnkiWeb.
4. **Add-on states, each with its own sentence**: missing → "Install it for me"; on disk + Anki running but not
   answering → "close Anki completely and reopen" (add-ons load at startup); on disk + Anki not running → "start
   Anki"; disabled in `meta.json` → "enable under Tools > Add-ons".

`ankiListening` (8765 open but silent) + running = `waiting` (a modal dialog), before `notLoaded`; an UNKNOWN
`ankiRunning` (non-Windows, failed probe) shows the neutral `ankiNotConnected`. Linux base honors `XDG_DATA_HOME`.
Every state has **Open Anki** (`/api/anki-focus`; with no window it STARTS Anki via `/api/anki-start`, detached);
`openAnkiWindow` never calls `/api/anki-start` while `ankiAwaitingInput`; `focus-anki.ps1` raises Anki's first
visible dialog when there is no main window. `installAnkiAddon` shows `ankiAddonAlready` for `alreadyInstalled`
(an install that doubles as a repair). `ankiSyncAuthState` counts a "Sync status ..." error as signed in (first
full sync pending).
- **AnkiWeb account** (optional; until signed in, cards live on one computer). `ankiSyncAuthState()`: AnkiConnect's
  `sync` checks `mw.pm.sync_auth()` first and raises `"sync: auth not configured"`, so the probe is free when
  signed out and a normal sync when signed in. Probed ONCE per machine (`signed-in` kept in
  `localStorage('ebiki-ankiweb')`). The in-flow banner offers: create an account (real browser), **Sign in inside
  Anki**, I've signed in, Not now (`ebiki-ankiweb-later`).
- **Ebiki NEVER handles an AnkiWeb password** (AnkiConnect has no login action; adding one would route a password
  through Ebiki). It only raises Anki's window (`scripts/focus-anki.ps1`: main window only, SW_RESTORE +
  SetForegroundWindow) and says which button to press. The banner says so.
- Neither route is in `DATA_ROUTES`.
- **Duplicate checks are scoped to the target deck** (`duplicateScope: 'deck'` + `checkChildren` in `ankiAddNote`
  and `ankiCanAddNote`; unscoped, Anki checks the whole collection). `ankiSetNoteTags` escapes `\ * _` in
  removals (Anki matches them as patterns). The audio embed writes the name `storeMediaFile` RETURNS.
- **The `/api/anki` proxy times out** (2 min; 15 min for `sync`). AnkiConnect answers on Anki's UI thread, so a
  modal dialog in Anki means NO answer; without the timeout, callers waited forever and boot-watcher pings piled
  up. The timeout reply tells the user to answer Anki's window; a timed-out CHANGE is still queued in Anki, so its
  reply says to check before retrying (`timedOut: true`). Proxy errors carry `code`
  (`notRunning`/`timeout`/`timeoutChange`/`closed`); `ankiRequest` shows them in the app language (`anki_err*`; a
  failed fetch is `anki_errNoServer`), turns a cut-off (non-JSON) reply into a readable error, and puts the `code`
  on the Error (`timeoutChange` = still queued): Quick Add stops its batch and unticks that card; Copy/Move shows
  the reason. A failed `ankiGetDecks` never empties `ankiDecks` (null, not []).

## Anki updates are Ebiki's job (`scripts/anki-update.ps1`)
The website install (`%LOCALAPPDATA%\Programs\Anki\anki.exe`) is a LAUNCHER; real Anki is a uv venv in
`%LOCALAPPDATA%\AnkiProgramFiles` pinned by its `pyproject.toml`. With an install pending (no `.sync_complete`, or
a `.want-launcher` trigger from Anki's own update dialog) the launcher opens a terminal menu that dead-ends:
"Latest" pins `anki-release` to the newest `aqt` version, which may not exist (2026-09: aqt 26.9.3, anki-release
26.5), and older launchers write `requires-python = ">=3.9"` though anki 26.x needs 3.10+. So
`Start-AnkiIfNeeded` runs `Update-AnkiIfOffered` BEFORE starting Anki:
- **Target = newest INSTALLABLE**: the newest stable `anki-release` on PyPI that also exists for `aqt`. No
  betas/rc.
- **Asked in the splash**: `Ask-InSplash $text $timeout $title $yesStatus` → status `ASK|title|yes
  status|question` (`PROMPT|` stays the Ebiki-update form). "Update now" is focused. A declined version goes in
  `.anki-update-declined` (gitignored) until a newer one ships; a timeout records nothing.
- **Installs silently** with the launcher's command: `uv sync --upgrade --no-config --managed-python --python
  <.python-version>`, cwd = root, `UV_CACHE_DIR`/`UV_PYTHON_INSTALL_DIR` = root's `cache`/`python`. pyproject
  written UTF-8 without BOM, `requires-python` from `.python-version`. Status every 10s, 15-min cap. uv output →
  `logs/anki-update-uv.*.log`, decisions → `logs/anki-update.log`.
- **Mirrors the launcher's own rules** (checked against `qt/launcher/src/main.rs`): stuck also = pyproject NEWER
  than `.sync_complete` (whole seconds); `Set-AnkiPin` deletes the marker first; uv runs with every inherited
  `UV_*`/`VIRTUAL_ENV` cleared and `UV_NATIVE_TLS=1` (no `UV_CACHE_DIR` with `nocache`); an update uses the
  LAUNCHER's `.python-version` (a pre-25.6 root says 3.9) and records it on success; a pre-25.6 restore writes
  the original files back (no `anki-release` exists for it). No update or repair while Anki is up
  (`Test-AnkiUp`). `.want-launcher` overrides a previous decline.
- **Never leaves Anki broken**: success = `aqt-<ver>.dist-info` exists; then touch `.sync_complete` AFTER the
  pyproject. A restore sets the marker only when the installed version's dist-info really exists. Any failure
  re-pins the installed version, re-syncs and sets the marker. A stuck launcher (marker missing, OR a leftover
  `.want-launcher`) is repaired the same way when nothing is offered or the user declines.
- Skipped: classic installs (no `uv.exe`), no venv yet, a `mirror` file, offline.
- Anki's own in-app update still restarts into the launcher console; the next Ebiki launch repairs failures.
- **Stuck launcher console** (`scripts/anki-start.ps1`, dot-sourced by `launch.ps1`, run with `-Start` by
  `/api/anki-start`): `Get-StuckAnkiLauncher` = an `anki-console` ≥15s old, AnkiConnect not listening, no real Anki
  (python under `*Anki*`), no `uv` running. `Start-AnkiIfNeeded` closes it, updates/repairs, starts Anki. Reported
  as `launcherStuck` → `ankiLauncherStuck`.
- **One at a time**: `Start-AnkiIfNeeded` holds mutex `Ebiki.Anki.Start` (body `Start-AnkiIfNeededLocked`), taken
  BEFORE launch.ps1's server mutex; wait capped at 20 min. (Two simultaneous launches both ran `uv sync` and both
  started Anki.)

## "Ask AI" mode edits (review flow)
Cards and Study panes have an **Ask AI** box. `proposeModeEdit(instruction, scope)` returns a proposal shown as a
before/after word diff (`diffWords`) with ✓ Accept / ✗ Deny (or refine). `acceptModeEdit()` applies via
`updateActiveMode`. Scopes: `cards` (fields/templates/tagRules), `study` (questionPrompt/ratingRules).
Proposals are shaped (`shapeModeEditValue`) before they are shown, so the review is exactly what Accept saves.

## Anki's "Collection sync complete." toast
From Anki's source (checked on 25.09.4; this machine runs 26.5): after a no-changes collection sync `aqt/sync.py`
calls `tooltip(parent=mw, ...)`; `aqt/utils.py::tooltip()` sets `Qt.WindowType.ToolTip`, which is
**always-on-top** (native class `Qt6xxQWindowToolTipSaveBits`, ex `WS_EX_TOOLWINDOW|WS_EX_TOPMOST`), 3s, at the
bottom of Anki's MAIN window. **Both Anki and Ebiki trigger it**: Anki auto-syncs on profile open/close
(`maybe_auto_sync_on_open_close`), and AnkiConnect's `sync` is `onSync()`. The 5-minute periodic sync is
media-only (no toast). Upstream bug `ankitects/anki#4188`; no setting disables it. Two fixes:
- **Fewer syncs.** `srs.syncSoon()` (`ankiSyncSoon` in `src/cards/anki`) COALESCES: each call restarts an 8s quiet
  timer, 90s max-wait. Fire-and-forget, never throws. **Call `srs.sync()` directly ONLY when the result is needed
  before continuing**: the awaited pre-session pull (`syncFromAnkiWeb`) and the post-ratings sync that re-reads Anki.
- **Demote what still appears.** `scripts/anki-toast-behind.ps1`, spawned by the dev server on Windows (both launch
  modes), killed with it. `SetWindowPos(toast, ankiMainWindow, SWP_NOACTIVATE)`: a non-topmost `hWndInsertAfter`
  strips `WS_EX_TOPMOST` (`HWND_BOTTOM` wouldn't) and keeps Anki's own position. <30ms, 0.6% of a core at 100ms
  polls. **Three load-bearing rules**: (1) only windows whose class contains `QWindowToolTip` AND are topmost; (2)
  do NOTHING while Anki is the foreground app (same class = Anki's hover tooltips); (3) demote, never
  minimize/hide. Match the version-independent substring (`Qt691` changes per Anki release). **Skipped under
  `VITEST`** and `unref()`'d (a live child blocks the test runner exiting).

## Ebi Studio (conversational mode create / edit / deck prompt)
`src/components/ModeStudio.jsx`, opened via SettingsModal's `openModeStudio(cfg)` prop (App holds `modeStudio`,
renders `<ModeStudio>` near HelpChat):
- `kind:'create'` (Learning modes, "Design in depth with Ebi"); `kind:'edit', focus:'all'` ("Edit this mode with
  Ebi"); `focus:'cards'` (Cards pane, "Design the deck prompt with Ebi"); `focus:'study'` (Study pane).
- `askAI` = `aiCall(..., resolveModel('chat'), {maxTokens:2000})`. Ebi asks 1-3 follow-ups, then replies with a
  summary plus a hidden `<mode>{json}</mode>` block, parsed (`parseAiJson`) into a review card. Only **Apply**
  persists, via `applyStudioSpec(spec)`.
- `buildModeFromSpec(spec, existing)` (next to `createMode`) mirrors createMode's fallbacks and merges field by
  field, so an EDIT keeps unchanged values and never flips `type`. CREATE mints an id, then
  `saveModes([...modes, built], id)`, awaited, rolling back on `saveOk === false` (like `createMode`) and returning
  the saved name; EDIT does `updateModeById` + `setActiveModeId`. Spec = full mode config
  (name/type/description/fields/templates/tagRules/studyRules/chatSuggestions/mnemonicHints/tagCategories/
  discoverKinds).
- vs `proposeModeEdit`: that's a one-shot field diff; Studio is the multi-turn superset.
- **Rating is fixed in code** (0 wrong Easy, 1 Good, more Hard, all Again; MC capped at Good; a ONE-question card
  uses the shared one-answer rule, see "Grading (shared)"). `ratingRules` is not
  editable anywhere (Settings shows `set_ratingFixed`; not in `MODE_EDIT_SCOPES` or the Studio prompt): a box nothing
  reads is a lie. Knowledge Enable/Disable PATCHes `&disabled=1|0` (idempotent), one request per file
  (`knowledgeBusyRef`); a failed list read keeps the list.
- An EDIT keeps the mode's name unless the spec names a different one (`modeNameKey`); creates refuse while
  `dataSwitchingRef` is set. Callers that await an AI call use `endStudyForModeSwitchRef.current` (a stale
  closure missed a session started meanwhile).

## Onboarding
No `onboarded` flag → `src/components/OnboardingWizard.jsx`: welcome → app language → light/dark → how Ebiki
opens → AI provider + key ("Advanced" custom model) → intelligence preset → first mode (`createMode`) → finish.
Re-runnable from Settings → General ("Run setup again" with an unchanged provider/key adopts no models).
- `createMode` AWAITS `saveModes` (postModes' result carries `saveOk`); a failed first-run save returns false and
  removes the unsaved mode. It saves `studyRules.studyLanguage` for language modes (else it was guessed from the
  NAME). `validateKey` answers `'noCredit'` (own message `keyNoCredit`) and confirms a key through `listModels`
  when the model 404s. Finish stamps `lastModelCheck`.
- While `wizardShown` the header is `inert` and Alt+Q waits; the panel takes focus per step; the wizard traps Tab
  (capture keydown); a re-run closes on Esc/✕. The overlay auto-launch waits for `onboarded`.
- A startup load that THREW is not a first run (`startupFailed` keeps the wizard shut; `modesLoadedRef` drops while
  the list is still the placeholder). A failed or unreachable start still opens a tab; theme and `lang` are applied
  in `useLayoutEffect`.
- A first run's placeholder mode is replaced by the first real mode (`modesReadEmptyRef`/`modesToAddTo`), not saved
  beside it. That identity check needs ONE `defaultMode` object: `defaultMode`/`defaultStudyRules`/
  `defaultGeneralStudyRules` live at MODULE scope (inside App they were rebuilt every render and the placeholder was
  saved). `uniqueModeName` ignores the placeholder, and a mode replacing it is always made active.
- Choice tiles use `choiceProps` (role radio, Tab + Enter/Space). The step body is CALLED (`{Body()}` in a Fragment
  keyed by step), never rendered as `<Body />`: a component declared inside another is a new type every render, so
  React remounted the step on each keystroke and the key field lost focus. Same rule everywhere: no components
  declared inside components.

## Modes & knowledge base (per mode, gitignored)
- `modes/<name>/config.json`; knowledge in `modes/<name>/knowledge/`, served by `/api/modes/knowledge` (always
  `?mode=<activeMode.name>`). `modes/` is gitignored. Missing folders never break:
  `mkdirSync(MODES_DIR, {recursive})` on demand; App falls back to an in-memory `defaultMode`.
- **Mode saves require a successful modes READ** (`modesLoadedRef`, checked in `postModes`): after a failed read the
  app runs on its in-memory default, and saving that overwrote the real mode with id 1. The server answers a failed
  read with 500, never `{modes: []}`; the legacy ankiformat.json migration runs only after a successful empty read.
  `_meta.json` is written atomically and a broken copy is ignored. A mode config that fails to READ is retried once,
  then the GET answers 500 (never a partial list); one that still fails to PARSE after the retry is renamed
  `config.json.corrupt-<stamp>` and skipped (500 only for IO errors; ENOENT = folder gone, folders re-listed on the
  retry).
- **`/api` refuses `Sec-Fetch-Site: cross-site|same-site`** (`apiRequestAllowed`): an `<img>` on another site sends
  no Origin and could make the server spawn a PowerShell/git process per tag.
- **Study completion counts in-flight generations** (`pullsInFlightRef` + the `studyPullTick` state): pulls AND the
  cards `beginStudy` generates in the background (`trackStudyGen`). Completion waits for 0; the tick re-runs the
  completion and stall-rescue effects when a generation ends without adding a card. The count is PER SESSION:
  `exitStudy` zeroes it; a pull decrements only while `studySessionRef` is unchanged. Every pull (flashcards,
  conjugations, PBQ) reserves its pool index from `pbqPullRef` synchronously (set at every cursor reset); relearn
  copies insert relative to it, none queued during Wrap Up. A failed grading sets `gradeFailed` (its placeholder
  "wrong" results are left out of accuracy and insights). A give-up or skipped conjugation word clears
  `studyAnswerHistory` (Back reopened the previous card).
- **One-mode edits write ONE mode** (`changedIds` in the modes POST; `updateModeById` and `setAnkiDeck` send it;
  `writeModeFolders` writes, moves and re-tags only those; the rest of the list is context): a whole-list save from
  a stale copy undid another computer's rename or edits on every Settings keystroke. `saveModes` (create, delete,
  rename, repair) still writes the whole list. **Create/delete send `changedIds` too** (only the new mode; `[]` +
  `deletedIds` for a delete): as whole-list saves from a stale list they moved another computer's renamed folder back.
- **Explicit mode deletes.** The client ALWAYS sends `deletedIds` (usually empty) with a modes save; `writeModeFolders`
  removes ONLY those modes' folders, a mode merely missing from the list is kept (a second computer on a shared
  folder with an older list deleted modes it had not seen). No `deletedIds` (older build) keeps the old "absent =
  deleted" rule. The modes LOAD must `setModes(cleanedModes)`: 1.5.3 lost that line and ran every launch on the
  in-memory default mode. Deleted ids are tombstoned in `modes/.deleted.json`: `writeModeFolders` never re-creates
  a missing folder for one (a second computer's stale save of that mode) and reports `deletedElsewhere`; the client
  drops it (not the active one) with `mode_deletedElsewhere`. Real creates use clock ids (`mintModeId`), so never
  hit a tombstone. `.deleted.json` is read strictly: only ENOENT (or a damaged file) is empty; any other read error
  is retried once, then no tombstone is written that time.
- **Mode folders: `modeFolderName` + `writeModeFolders` (vite.config.js), used by `/api/modes` AND the knowledge
  endpoints.** The POST removes every folder the list doesn't name, so: a RENAME moves the old folder (found by id
  among the folders about to be removed; writing the new name and sweeping the old deleted the knowledge base);
  names compare case-insensitively on Windows/macOS (a case-only rename deleted the mode); trailing dots/spaces
  are stripped (Windows drops them, so "Intro to C." was swept); "."/".." can't escape (".." wrote a mode over
  config.json); device names get "_". A rename (case-only too) also re-tags `chats/*.json` whose `mode` is the old
  name (chats keep their tag on save; the Discover profile reads only the current name). Only an id-less `Default`
  folder (the old template) is hidden (`isDefaultTemplate`, only on ENOENT or an id-less config: a locked read hid
  a real mode); a mode NAMED Default is real. A parked id-less Default folder's `config.json` becomes
  `config.json.parked` (only when it READ as id-less), else it was listed as a ghost mode on every launch.
  Tests: `mode-folders.test.js`.
  **Ids compare as strings (`idKey`)**: a mode whose id was saved as "5" was taken for another computer's mode.
  In a WHOLE-list save any other mode's folder is foreign (only a save changing both may swap; a folder whose id
  is held TWICE is the load repair's own); a mode whose id already lives in another kept folder is reported with
  that folder's name (`suggested`), never re-created; a rename into an id-less folder parks it first; duplicate
  targets in one payload conflict. `modeNameKey` (client) applies the same device-name rule as `modeFolderName`.
  Offline reconcile redirects `modes/<old>/` edits to the share folder holding the same id, only when the BASE had
  `<old>` (else it is a rename made offline).
- **A rename whose folder move FAILS (Windows: a file inside is open) leaves that mode untouched** and answers
  `renameFailed`; `postModes` puts the old name back (`mode_renameFailed`). Writing on left two folders with one id.
  Any non-OK modes save shows `mode_saveFailed`. The legacy `<n>.json` migration never overwrites an existing mode
  (kept aside as `.migrated`). Knowledge endpoints resolve a name with no usable characters to its `mode-<id>`
  folder (`modeFolderForName`).
- **`writeModeFolders` never writes into a folder owned by a mode the payload doesn't know** (another computer's,
  made after this one loaded): it returns `conflicts` with a free `suggested` name, the POST passes them on, and
  `postModes` renames ours via `updateModeById` + `mode_nameTakenElsewhere`. Refused (conflict) modes are left out
  of the chat re-tag. **`renamedIds`** (renameMode, and `updateModeById` when the name changes; `postModes` ALWAYS
  sends it, default `[]`: a missing list is an older client and moved folders back): a missing folder is MOVED from
  its same-id folder only for those ids; otherwise the server reports the folder's current name (`suggested`) and
  the client adopts it. A conflict for this same mode renamed elsewhere carries `adopt: true` and shows
  `mode_renamedElsewhere`. A folder whose own config already names the target is only MISNAMED and is moved (no
  adopt: that looped forever); the client also skips an adopt equal to the live name.
- **New mode ids come from `mintModeId(list)`** (max of `Date.now()` and the largest id + 1): two creates in one
  millisecond, or a list holding a future id from another computer, collided.
- **Model-written mode config goes through `modeText`/`modeFields`/`modeType`/`clampRule`** (top of App.jsx) in
  `createMode` and `buildModeFromSpec`: a list/object where a string belongs broke card generation for that mode
  for good, and a string "3" for `cardsAtOnce` started 11 generations.
- **Async mode writes resolve the NAME at write time from a pinned ID** (knowledge upload: a rename during a PDF
  extraction wrote to a new config-less folder). The chat re-tag on rename ignores ids held by two folders.
- **Mode names are unique** (`uniqueModeName`, " 2" suffix on create/Studio; rename refuses a clash via
  `modeNameKey`): two modes with one name share one folder. **Name-keyed stores follow a rename**
  (`migrateModeStores`: hooks, grammar, profile, ledger, instant cache; only into an empty store, only from a real
  read). `migrateModeStores` MERGES into a destination that already has data (`mergeModeStore`: hooks per key,
  grammar by folded text, ledger union, newer profile), so renaming back to an old name keeps what was added since.
  **Modes POSTs are serialized** (`postModes`; whole-list writes could land out of order), and knowledge reads AND
  uploads await `modesSaveRef` (a rename's folder move must land first); knowledge delete/toggle go through
  `knowledgeFileRequest` (awaits `modesSaveRef`, name resolved by id). Every modes write uses the live refs, never
  render-time `modes` (`setAnkiDeck`, `createMode` after its AI call). Config saves are serialized the same way
  (`configSaveRef`). `createMode` returns true/false (onboarding stays on its step on false).
  **A rename migrates stores only after `postModes` resolves**, to the server's `suggested` name when it answered a
  conflict; conflict renames call `updateModeById(..., {migrate:false})`.
  **Every rename (Settings, Ebi Studio) moves stores through `migrateAfterSave`**: after the save answers, only if
  the live name is still the target; `storesAtRef` keeps the name the stores really live under across quick double
  renames. A save that FAILED (`saveOk === false`) moves nothing (`storesAtRef` keeps the saved name) and puts the
  name on disk back on screen (local only; it kept showing the unsaved name).
- **An upload never silently replaces a file**: the POST answers 409 `{exists}` for a name already there (any case,
  or its `.disabled` copy) unless `replace:true`; the client asks (`kb_replaceConfirm`). A PDF becomes `<name>.txt`,
  so it collided with the user's own file. A `replace` removes a case-different old copy only when it is another
  file (inode), for Linux. With Settings > Knowledge open, `handleDrop` hands the whole drop to `handleKnowledgeDrop`
  (any spot in the pane).
- **Outline**: a bare "CHAPTER N" line keeps its number in `headKey` (else every chapter folded into one running
  head); markdown mode (`hasMarkdown`) is trusted in `.md` files, and in `.txt` only with 3+ `#` lines and no
  chapter-word/CJK chapter lines (one "# comment" in PDF text dropped the book's outline).
- **Knowledge uploads report failure** (`!res.ok || !data.ok` → error toast; it looked like success). The server
  takes only `.txt`/`.md` names, and an upload replaces a switched-off `<name>.disabled` copy (both used to exist:
  listed twice, and re-enabling the old one renamed it over the upload).
- **The knowledge base flows APP-WIDE**: `modeKnowledge` (loaded on mode switch, refreshed on upload/delete/toggle)
  + `knowledgeBlock(cap)` feed Chat, `generateCards`, `evaluateCardAnswers`, Discover (profile + suggestions), Help
  (12k cap), Picture click-to-explain (4k cap). Default `KNOWLEDGE_CAP` = 60,000 chars (~15k tokens). An
  `activeModeId` change clears `modeKnowledge` at once (the reload waits for the switch's mode save). The knowledge
  GET skips files that vanished mid-read (ENOENT) and answers 500 on any other failure; the client keeps what it
  has on a non-OK answer. Section picks are cached by the WHOLE task; an empty answer drops the pick and re-reads
  the outline.
- **Whole-book KBs: TOC-guided retrieval.** Above the cap the server extracts an `outline` (GET
  `/api/modes/knowledge`; sections via GET `/api/knowledge-sections?sections=i,j`) from markdown headings, "Chapter
  N" lines, numbered "1.2 Title" lines, OR a file NAMED like a TOC (`toc.txt`, "table of contents.md") whose lines
  (page numbers stripped) are located in the other files. Client `getKnowledgeContext(task, cap, cacheKey)`: a
  selector call (`resolveModel('general')`) picks 1-4 sections, cached in `knowledgeSelectRef` (question generation
  and grading share `card:<front>` keys). Small KBs bypass it. Big TOC-less KBs truncate, and Settings → Knowledge
  shows a ⚠️ (`knowledgeStatus`, `knowledgeBigNoToc`/`knowledgeBigToc`). Sync callers
  (`knowledgeBlock`/`knowledgeRaw`) get the TOC text for big navigable KBs instead of blind truncation.
- **`downscaleDataUrl` paints white before drawing to JPEG** (no alpha: transparent PNGs turned black and vision
  OCR read nothing). Opaque images are unchanged.
- **`TOC_LEADER_RE` must stay linear**: each whitespace run has ONE owner (`\s*(?:[.·…_]\s*){2,}`); the old
  `(?:\s*[.]\s*){2,}` backtracked 2^n on "Preface . . . . xi" and froze the server on every knowledge load. It also
  strips roman page numbers. Test any regex that runs over whole books against a 5000-char adversarial line.
  Each alternative carries a lookbehind so a match STARTS only where a leader run starts (quadratic otherwise).
  toc.txt matching looks lines up in an index (`candidatesFrom`), never a scan per entry. Chapter-word/CJK lines
  ending in a PERIOD (not an ellipsis), with no separator and a LOWERCASE start after the number, are prose
  (questions and "Chapter 1: ..." stay titles); a heading seen twice with and without a page number keeps the plain
  copy; fences close only on their own marker. Text uploads decode UTF-16 by BOM. A toc line is a contents-page line
  only with a dotted leader or when it AND the next end in numbers; number-stripped forms compare only when one side
  had a number ("Chapter 1" matched "Chapter 2"). `detectHeadings` computes `headKey` once and groups by key (it
  was titles x entries per knowledge read). Numbers the toc entries THEMSELVES end in ("1.1 Installing Windows 11")
  are titles, not page numbers (`titleNums`). The page-number strips use `(?<!\s)\s+\d+$` (unanchored, a long space
  run inside a line was quadratic).
- **Outline heuristics** (`detectHeadings`): PDF text has no paragraph breaks, so a numbered or chapter-word line
  whose text after the number starts lowercase is wrapped PROSE (`proseAfterNumber`), never a heading. Running
  heads: the copy without a trailing page number wins; a title whose every copy has a different LEADING page number
  is the book's running head and is dropped. Levels: chapter words (`chapterLevel`), CJK units (`cjkLevel`: 部 0,
  章 1, 节 2), numbering depth, and in toc.txt the indentation step (`tocLevel`). Leader strip (`TOC_LEADER_RE`): a
  roman page number counts only after 4+ leader characters ("Ready, Set... Mix" lost "Mix").
  Content files are walked in NATURAL order (ch2 before ch10). A capitalised wrapped line is prose when it starts
  with a unit (`UNIT_WORDS`: GHz, MB...), has a sentence break (lowercase word + "." + capital, not `ABBREV_WORDS`),
  or ENDS on a lowercase function word (Title Case "Logging In" stays a heading). `getKnowledgeContext` checks the
  server's `titles` against its outline and re-reads it on a mismatch (another computer renumbered it).
- **PDF upload**: text extracted CLIENT-side (`src/utils/pdf.js`, `pdfjs-dist` lazy-imported), stored as `.txt`;
  the server stays plain-text. Lines are rebuilt from y-positions + `hasEOL` so headings get their own line.
  Progress via `knowledgeBusy`/`pdfExtracting`; image-only PDFs rejected (`pdfNoText`). No space between two
  Chinese/Japanese items (`CJK_END`/`CJK_START`); Hangul keeps spaces. `extractPdfText` passes
  `cMapUrl`/`standardFontDataUrl` (`/node_modules/pdfjs-dist/...`, served by the dev server) so CJK PDFs with
  predefined CMaps have text. A space goes between runs only when they are APART (past the previous run's end, or
  ending before its start: `prevStart`); both sides count: right-to-left runs apart are separate words, a run back
  over the previous one (an accent) is glued. A new line needs `|dy| > max(2, 0.7 * size)` (superscripts stay
  inline).

## Discover tab (adaptive new-card engine)
- **The learner profile is per mode.** Chats are tagged with `mode` on save (`chatTabSaveCurrent`; the server
  persists it; rename keeps it); `buildLearnerProfile` reads only `s.mode === activeMode.name` chats (untagged
  legacy chats excluded).
- **Free text is in the APP language and dash-stripped**: `buildProfilePrompt`/`buildSuggestionPrompt` take
  `userLanguage` (`userLangName()`) for `summary`/domains/`why`/`draftMeaning`/`translation`. Never hardcode
  English. partOfSpeech/difficulty/domain-coverage estimates are asked in the app language too. **Adjust**
  (`onAdjust`) is a brand-colored `← Adjust` back button.
- **Suggestion kinds for every mode.** Language: word/phrase/idiom/verb/grammar/both (rules in
  `buildSuggestionPrompt`, `src/discover/prompts.js`). General: AI-generated `activeMode.discoverKinds`
  (`[{key,label,rule}]`), made once by `ensureDiscoverKinds` on first visit (in-flight guard per mode id, retry
  only on failure, `updateModeById`); static term/acronym/comparison/scenario fallback. A kind's `rule` overrides
  the static table (`customKind`). `discoverConfig.difficulty` = `easier|level|stretch`.
- **Deck switcher** (`discoverDeck`, `''` = mode deck): re-profiles against that deck
  (`buildLearnerProfile(deckArg)`), rebuilds exclusions, and `saveDiscoverCard` saves there. Resets on mode switch.
  `discoverDeckRef` is the live switched deck (reset and init share a commit).
- **Profiles are shaped on EVERY read** (`shapeProfile`: build, cache paint, blob pick): an older stored profile
  with object `summary`/`level` crashed Discover on every visit. `shapeProfile` also forces `domains` to a list of
  `{name, status}`. `discoverKinds` are text (Studio + the load-time repair). ModeStudio's review card renders values
  through `asText` (it shows the proposal before Apply shapes it). A stored profile counts only for the deck it was
  built for (`profileFitsModeDeck`); changing the MODE deck resets Discover (layout effect on `ankiDeck`).
  `buildLearnerProfile` reads `deckKey || ankiDecks[0]` (a mode with no deck saves into the first deck) but stores
  the profile under `deckKey`.
- **Instant-paint cache** (`localStorage('ebiki-discover-cache')`, last profile+ledger per mode): the real blobs
  live in Anki media (async). **The mode-switch reset effect and the init effect must BOTH be `useLayoutEffect`**
  in one pre-paint flush (reset → cached paint → init); only one brings back the blink and breaks re-init
  (`discoverInitRef`). Cache writes skip `null`/`DEFAULT_LEDGER`. Doubles as the offline fallback. A cached ledger
  enables ledger WRITES only when `ledgerVerified` (cached while this session could write): a ledger kept after a
  failed read held only that session's entries and later replaced the stored history. A cache-painted ledger keeps
  its `ledgerVerified` (`discoverCachedLedgerRef`). Ledgers are shape-checked on read (`shapeLedger`).
- **Anki media names are FLAT: `_ebiki_<kind>__<key>.json`** (the adapter's `blobFileName`; storage.js asks `srs`). A name with "/" (the old `_screenlens/...`) is
  unwritable in place: AnkiConnect reads the basename but its delete-before-store matches nothing, so every write
  became a hash-suffixed copy and every read returned the FIRST version. The legacy name is read once as a
  migration source (after the local copy, which is fresher).
- **`writeBlob` (`src/discover/storage.js`) does NOT sync.** Storing the media file already persists it locally;
  the ledger is written on every `fetchNextSuggestion`. Pass `{ sync: true }` only when worth pushing now. Anki
  syncs when the user adds a card (`saveDiscoverCard`).
- **Saving** goes to `discoverDeck || ankiDeck || ankiDecks[0] || 'Default'` (non-persistent fallback; an unset deck
  made the add fail). Errors are i18n'd (`d_err*`). The final dup check includes `discoverDeckTermsRef`.
- `ankiDecksRef` is the live deck list (init runs on the render Anki connected, before `ankiDecks` arrived); init
  awaits `ankiGetDecks` for a deckless mode.
- **Discover async guards**: the full duplicate set loads under a MODE + DECK-SWITCH token (Adjust bumping
  `discoverGenRef` left it empty); the cache paint runs only on the mode deck; a save retired by Adjust says so
  (`d_saveCancelled`); the web-verify search checks `live()` after its await.
- **Legends level, opt-in per mode** (`activeMode.discoverUseLevel`, default OFF; checkbox under Difficulty, shown
  only when the mode HAS a level): App reads it live with `useLearner(activeModeId)` (the shared kit store, no
  Legends import) and passes `learnerLine(...)` to `buildSuggestionPrompt` as `learnerLevel` ("MEASURED LEVEL ...
  outranks the estimate"). Tests: `src/discover/prompts.test.js`.
- **Actions**: Make Card / I Know This (`known`) / Skip (`declined`: excluded forever) / Next (advance, nothing
  recorded). All via `discoverExcludeList`.
- **Dialect + mode language**: `fetchNextSuggestion` appends `dialectRule()`; `buildCardFields` (Discover + Picture
  card generator) injects `dialectRule()` and, in language modes, derives `srcLang` from `learnLangName()` (not the
  global translation `language`). The verify pass parses with `parseAiJson`; `saveDiscoverCard` formats the back
  with `cardBackToHtml`.

## Ebi the mascot & poses
- Poses in `public/assets/shrimp/`, registered in `src/config/shrimp.js` (`SHRIMP`). `DEFAULT_SHRIMP = 'shrimp.png'`
  (neutral; the AI's `"default"`). `IDLE_SHRIMP = '6820-holeshrimp.png'` (Help panel's resting pose).
- **`choosePose(text)` (App.jsx) is the ONLY thing that sets a pose**, exactly once per call (no flicker): with a
  key → the "Mascot" AI role (`resolveModel('pose')`, user-configurable) returns a pose name; without a key / on
  error → `pickShrimp(text)` (whole-word keyword match, never substrings). Used by chat, study question, feedback,
  Help (`onAiReply`), Picture word, Discover. Ebi reacts only to ASSISTANT messages.
- Empty-state defaults: Picture → camera, Study → book, Chat → singer (`poseFile('…')`), bare PNG, no glow.
- Study companion: big Ebi beside the question with **Ask Ebi** (`askEbiSignal` → HelpChat). The pose is
  precomputed per question (`q.pose`), so it changes once, with the question.
- **The Help mascot (`helpMascot`) is independent of the study pose (`studyMascot`).**

## Ebi's Help chat (`src/components/HelpChat.jsx`)
- **Screen context is GATED BY `activeTab`.** `buildSystemPrompt` opens with ">>> RIGHT NOW the user is looking at
  THE <tab> SCREEN <<<" and emits only that screen's detail. The live question's card FRONT is SECRET like its
  answer (on a language card it IS the answer). Expected answers are SECRET unless the user explicitly asks.
  `questionPreferences` and the Picture direction (`pictureFrom`/`pictureTo`) are top-level in `appContext`
  (preferences used to exist only mid-session). `studyActive` stays true across tabs, so the live question is "ON
  SCREEN" only when `tab==='study'`; elsewhere it's a "Background only" note. `appContext` (bottom of App.jsx) must
  stay CURRENT: live study question (from `currentQuestion` + `studyCardState`, NEVER the legacy always-empty
  `studyQueue`), `studySession`, `deckBrowser`, `discover`, `stats`. **New tab → add its `SCREEN[...]` label AND a
  tab-gated detail block.**
- **Help can ACT**: `<action>{...}</action>` tags are parsed/stripped in `sendMessage` → `onAction` prop → App
  applies via pinned refs (`activeModeIdRef` + `updateModeById`). HelpChat calls the LIVE `onAction`
  (`onActionRef`). Types: `question_preference` (save a question-style rule), `set_dialect` (`studyRules.dialect`,
  language modes), `deck_edit` (opens Deck, prefills ✨ Ebi bulk edit, `pendingDeckEditRef` runs the PREVIEW once
  notes load; writes nothing itself). New action = CAPABILITIES text in `buildSystemPrompt` + an `onAction` branch
  + a receipt. Keep composer wording action-y. Action values must be STRINGS (`question_preference`, `deck_edit`,
  like `set_dialect`): an object became "[object Object]". Action values the app saves or echoes go through
  `helpText` (dash + shrimp strip). A Help `deck_edit` records `deckNotesReqRef` and runs only on a note load that
  started after it (`deckNotesLoadedReqRef`); an empty fresh load drops the pending edit; its receipt names the
  deck `openDeckBrowser` will open (mode deck only if it exists).
- **Verified receipts**: `onAction` returns an app-authored string saying what really happened: the change and what
  it affects, or plainly that it was NOT applied (mode deleted, Anki not connected, mode switched). `sendMessage`
  appends them under "✅ Checked by the app (what really happened)" (`hr_header`). Every `<action>` yields a
  receipt: one that applied nothing adds `hr_notApplied`. Receipts are i18n keys (`hr_*`; the study feedback chat's
  are `fbr_*`), never hardcoded English. Gate "saved" wording on `updateModeById`'s return (false when it bailed,
  e.g. when the modes read failed: nothing is saved; Studio Apply then throws `mode_cannotSave`). New actions MUST
  return a receipt. `deck_edit` bumps `pendingDeckEditTick` (already on the Deck tab, nothing else re-ran the
  pending-edit effect). A Studio reply cut off inside `<mode>` shows `studioCutOff` and clears the old proposal
  (maxTokens 4000).
- Opened by the header's **"Talk to Ebi"** button (after the Stats tab), which bumps `askEbiSignal`; without the
  button the panel docks bottom-left (`getChatStyle`). Rendered with `hideButton={true}` (the old floating button
  remains behind `!hideButton`). The header shows Ebi (~46px, negative margins) right of the title, using
  `helpMascot` (default `IDLE_SHRIMP`).
- **In character**: `HELP_BASE` speaks as Ebi; never calls itself a "mascot".
- A Learn-it lesson or PBQ result on screen sends `learnMoment` and NO `currentQuestion` (it was already the next
  card's); `currentQuestion` is also null off the question phase (summary), during a choice/typed flash, and for a
  done card. `gradedRecent` leaves out the live card's front; `grammarSlips` leave out slips logged on the live
  question's card (or revealing its answers). A send after a FAILED save keeps the panel's turns when the disk copy
  is only their prefix.
- Help's saves honor `dataSwitchingRef` through the `canSave` prop (and skip the pre-send re-read while frozen).
- **THE LEARNER CONTEXT is the one way to get learner context anywhere** (the owner: "context should be accessible
  throughout the whole app"): `ctx.learning.context({ fresh })` (App, cached a minute per mode, cleared by every
  app event) gathers through `kit/learnerContextGather.js` and shapes with `kit/learnerContext.js` (pure, tested):
  the mode deck's studied cards (spread sample, batched info calls, real stats) and NEW cards (scope), study
  history, slips, chats tagged with the mode (recent 8: learner lines + short Ebi replies), Discover, level,
  practice log, and feature sources (`registerLearnerContextSource`; Legends adds map progress and raids in
  `legends/learnerSource.js`). Every part carries `ok` (a failed part is never "knows nothing").
  `formatLearnerContext(snap, { budget, sections })` makes a bounded prompt block. Never write a second gatherer.
  **Consumers go through `kit/learnerContextUse.js`** (pure, tested): `CONTEXT_USES` = sections + body budget +
  heading per consumer: `help` 2500 (Help, every screen, `appContext.learnerContext()`), `chat` 2000
  (`sendChatTabMessage`), `question` 600 (`generateQuestionsFresh`, wording only, NOT in the question-reuse
  signature), `practice` 800 (Ebi Call, Roleplay, Scenes, Listen & Speak, Mistake Gym via
  `learnerLevelLine(ctx, { context: true })`). Discover's profile takes scheduling, chat topics, sessions and slips
  from `discoverEvidence` (same mode AND deck, else it reads as before). Prompts NEVER wait for a gather: they read
  `ctx.learning.cached()` (App's `learnerSnapsRef`, last snapshot per mode; stale after `LC.staleMs` or a failed
  deck read = a throttled background refresh; warmed 5s after a mode switch) through `learnerBlock(use, opts)`.
  `snapshotForMode` drops a snapshot of another mode. `redactSnapshot` is the secrecy guard:
  `hideFronts`/`hideAnswers`/`reveals` (Help: the live study card's front and every answer of its questions;
  question generation: the card's own headword) and `secret` (a feature `quiz` Help entry exists: no card lists,
  meanings or feature sections). Evidence/level judging consumes the raw snapshot.
- **Features tell Help what the learner does** (the owner: "Ebi is supposed to have context of anything the user
  does"): `ctx.help.set(id, { text, screen })` (null clears) → App's `featureHelp` → `appContext.featureContext` →
  `buildSystemPrompt`, on EVERY screen ("ON SCREEN NOW" when `screen` is the tab, else "BACKGROUND"). The text is
  plain facts and must never hold the answer of a question being answered. Legends: `HelpBridge.jsx` (its `Mount`)
  + `helpContext.js` (pure, tested: map, areas, current area's levels and items, weak items, nemesis, level, raid,
  helpers, journey, what the Legends screen shows; item meanings left out while a step, raid or placement runs;
  `LegendsScreen` feeds `setLegendsLive`). Every `QuizRunner` with `ctx` publishes its question as `quiz` (the
  answer only once the feedback shows it). **A new feature or screen reports here too**:
  `useHelpEntry(ctx, id, text, screen)` (`kit/useHelp.js`, clears on unmount). Reporting now: Legends, `quiz`,
  `game` (XP, goal, Ebiki streak vs Anki's, quests, league; `game/helpText.js`, pure, tested), `practice` (hub /
  open activity), `ebi-call` (targets SECRET while the call runs), `roleplay` (scene, turns, scorecard),
  `mistake-gym` (no items or diagnosis during a workout: a language card's front IS the answer), `leech-doctor`,
  `scenes` (lines revealed so far; none during its quiz, the story is the answer source). `appContext` also carries
  `learnerLevel` (every screen), `studyReview` (what this session got wrong, finished cards only, never the live
  one), `pbqReview`, `studyStart`, `chatSettings`, a richer `deckBrowser` (search, Quick Add tray, open review,
  duplicate groups) and `discover` (profile summary, the suggestion on screen).
  **Sub-screens**: `useHelpEntry(..., screen, where, depth)` names the part of the screen shown; Help's "RIGHT NOW"
  line adds the deepest `where` on the tab in view (`screenWhere`, HelpChat): Legends map/step 1 (`legendsWhere`),
  bestiary 2, raid / test fight 3 (`raidWhere`). The asset view's tab is `assets` (its own SCREEN label).
  **Bestiary + raid bosses** (`legends/bestiaryHelp.js`, pure, tested): `raid-bosses` (HelpBridge, EVERY screen,
  `CATALOG_MAX`) = raid rules, the player's raid progress (current boss, today's wounds, trophies; "could not be read"
  when the read failed), the current boss's effects, every boss in `RAID_ORDER` with ability and family (rules of the
  bosses farthest ahead drop first); `bestiary` (AssetView) = tab, boss on screen with effects/lore, demo phase,
  effect just tried, map areas a Legends motif guards, family trees, Ebi draft, a test fight. Names and rules come from
  i18n (app language); never a card.
- **HARD RULE: Ebi NEVER emits a shrimp emoji.** Forbidden in prompts (HELP_BASE + Chat `systemPrompt`) AND
  code-stripped (`[🦐🦞🦀]️?` next to the em-dash strip in HelpChat `sendMessage`, Chat `cleanText`, and the
  search-offer answer). Other emoji are fine.
- Scrolls to the bottom on open. Esc closes the panel when focus is inside it. `newChat` sets `userStartedRef`.
- The dock (`snapZone`, `chatPos`) is remembered in localStorage (`ebiki-help-dock`/`ebiki-help-pos`) and kept on
  close; docking/undocking re-scrolls to the bottom; a drag out of an edge zone clamps the grab offset to the free
  size; the chooser overlay is above the panel while choosing.
- **Docking**: drag the header (⠿) or click ◣ to pick **Dock left** / **Dock right** / **Under the question**;
  previews come from one shared `ZONE_RECTS`. Sizes are viewport-relative (`clamp(250px, 24vw/1.35, 380px)`; /1.35
  undoes the body zoom). Esc cancels; dropping in open space floats. `snapZone` = `null` | `left` | `right` |
  `bottom` | `free`.

## ⭐ HOW TO ADD A BUTTON
1. **Base style** from `S` (`src/styles/theme.js`), spread then override:
   - Ghost/action (most buttons): `{ ...S.ghostBtn, fontSize: 10-12, color: <accent>, borderColor: <accent ~.3
     alpha> }`. Accent is a CSS var, never hex: `--c-danger` destructive · `--c-warning` caution/session ·
     `--c-brand` primary-ish · `--c-purple` AI/insight · `--c-success` Anki/save · `--c-ink-dim` neutral.
   - Solid CTA (max one per screen): `{ ...S.captureBtn, borderRadius: 6-8 }` + `className="btn-press"`.
2. **Hover is AUTOMATIC** (a global rule tints non-disabled `<button>`, `<select>`, checkboxes with `--c-hover`:
   ink in light, white in dark). Cards and tiles use `.ui-card` + `.ui-lift` (hover raises the shadow instead). Only add:
   `click-dim` on clickable `<div>`s; `ui-btn` to also deepen a ghost border; `ui-tab` for nav tabs, with
   `ui-tab-current` on the active one; `card-head` for clickable card headers (controls inside need
   `stopPropagation`). `.hover-dim` is a legacy no-op.
3. **Never animate position on hover.** Only `.btn-press` moves, on `:active`.
4. **Disabled** = `opacity: .5` + `cursor: 'default'` + the real `disabled` attr.
5. **Labels** via `t('key')` in all four languages where the surface is localized. Leading emoji OK. Explanations:
   `className="tip" data-tip="…"` on a ⓘ span, NEVER a bare `title` (1s delay); no `overflow:hidden` on ancestors.
6. **Never `boxShadow: 'none'` on a hoverable control** (an inline shadow overrides the inset-shadow hover). Only
   `...(active ? { boxShadow: SHADOW.sm } : {})`.
7. **Segmented controls**: the selected segment gets `ui-tab-current` + `cursor: 'default'`.

## ⭐ HOW TO ADD A NEW EBI EMOTE
1. Put the image in `public/assets/shrimp/`, any size and any common format (PNG, JPEG, WebP, GIF, AVIF, TIFF, SVG).
   Keep the ORIGINAL there; never shrink it by hand. The app loads Ebi through `shrimpUrl` → `/assets/ebi/<file>`,
   served by `src/server/ebi-images.js` (wired in `vite.config.js`): a copy at most `EBI_MAX_PX` (512) on its long
   side, WebP with transparency, made on first request (and warmed 15s after start) in the machine-local
   `.cache/ebi/` (gitignored, watch-ignored), remade when the original is newer. Never enlarges; SVG as is; without
   the optional `sharp` package (or on any resize error) the original is served. sharp's file cache is OFF (it held
   originals open on Windows). Names are plain file names only (no paths). `splash.hta` still reads the original.
2. Add one `SHRIMP` entry in `src/config/shrimp.js`:
   ```js
   { name: 'ninja', file: '12345-ninjashrimp.png',
     keywords: ['ninja', 'stealth', 'shuriken', 'martial arts', 'sneak'] },
   ```
   `name` (unique, lowercase) joins `POSE_NAMES` automatically, so the Mascot AI can pick it; `keywords` drive the
   fallback (add synonyms + some Spanish). `poseFile` and the pose prompt derive from `SHRIMP` too.
3. Keep entries non-overlapping (ties break by a stable text hash). Sanity-check by importing `pickShrimp` in node,
   or `npx vite build`.

## Picture tab (vision OCR, Tesseract for boxes)
- With a key, `analyzeImage` → `analyzeImageVision`: one `aiCall(..., VISION_OCR_PROMPT, payload,
  resolveModel('picture'), { images:[part], maxTokens:8000 })` returns each word with in-context
  `t`/`sense`/`alts`/`s`/`c`/`p`/`r`, a reading-order `line` and a normalized `box`. No key:
  `analyzeImageTesseract` (offline fallback).
- **Multimodal**: `aiCall` passes `opts.images` (`[{mediaType,base64}]`) + `opts.maxTokens` to every provider
  `call()` (Anthropic image blocks, OpenAI/Grok `image_url`, Gemini `inline_data`). Helpers: `src/utils/image.js`
  (`dataUrlToImagePart`, `downscaleDataUrl` ≤1500px).
- **Boxes come from Tesseract**: `getTesseractBoxes` runs in parallel; vision words snap to the matching box
  (normalized text, nearest center) → `_snapped`; unmatched words get `_approxBox`, aren't drawn by
  `renderWordOverlays`, still appear in the reading panel. The overlap clamp skips `_approxBox` words.
- **Untranslated words** (`_untranslated`) go through `lazyTranslate(idx, words)`: in the background after a
  Tesseract scan (by POSITION in the final list, passed in: the callback's own `ocrWords` is the previous scan's)
  and again on hover. A failed or unreadable answer frees the index for retry (it stayed "in flight": "Loading…"
  forever). The clean fast path keeps words missing from a cut-off reply as `_untranslated`.
  Language modes translate learned → user language on EVERY path (vision, OCR fallback, `lazyTranslate`);
  `buildCardFields` explains in `userLangName()`. Vision/word-list rows carry `o: true` for a word in the user's own
  language (`_own`): its card is made for the TRANSLATION. "Generate card" is disabled on an untranslated word in
  language modes (direction unknown). An unsaved `targetLang` defaults to the APP language (general modes translate
  into it) and follows an app-language change while it still equals the old language's default
  (`targetLangAppRef`; onboarding picks the language after load). The config load sets `targetLangAppRef` first, so
  the load's own language change is not a switch.
- **Reading panel** (`ocrLines`, grouped by `line`) below the image; chips share `hoveredIdx`/`pinnedIdx` with the
  overlay. A click shows `sense` (green) + `alts` (purple). JSON via `parseAiJson` (+ `salvageJsonObjects`).
- UX: inline **Ask Ebi** + **✕ Exit** in the toolbar when done; Esc exits; switching tabs clears
  pinned/hovered/expanded.
- **Overlay status** (`GET /api/launch-overlay`, polled every 3s): the tracked process, else an overlay found by
  COMMAND LINE (`electron.exe … main.cjs --overlay`, cached 15s). Never "any electron.exe": the app window and apps
  like VS Code are Electron too (it lit the header's overlay indicator while off).
- **Empty state centers on any screen**: `S.emptyState` uses `flex:1` + `minHeight:'min-content'`; the Picture
  `<main>` is a flex column only while `stage==='idle'`. `emptyState` is used only here.
- **A new scan clears index-keyed state**: `analyzeImageVision` (and a standalone Tesseract scan) resets
  `ankiSynced` and bumps `pinGenRef`. Drop/paste of an image on another tab switches to Picture first (like Alt+Q).
  Overlay auto-analyze timers are gated on `scanGenRef`; `overlay-reset` clears `window.__autoAnalyze`.
  Progress lines are i18n'd (`pic_prog*`) through `tLiveRef` (memoized callbacks hold an old `t`).
- **Every `pinGenRef` bump calls `resetPinBusy()`** and each word action's `finally` clears its busy flag only
  while its pin is current: word A's in-flight card/explain/conjugation/chat kept word B's buttons busy.
  "Add to Anki" and Refine use the EDITOR's text while it is open (Add dropped unsaved edits; Save reverted a
  refinement).
- **OCR input is opaque**: `preprocessForOCR` paints white first and forces alpha 255 (a transparent background
  read as black and was inverted with its text); it resolves the ORIGINAL when the canvas can't be read (tainted
  SVG, 0x0): it hung forever. The clean fast path is taken only when few words fell below 70% confidence (they were
  silently left out). An untranslated word's `translation` is `''`, never a stored "Loading…". Stats labels are
  `pic_toTranslate`/`pic_ownWords` (no language names).
- **Tesseract fallback translation** parses with `parseAiJson` (`maxTokens: 8000`), checks `stale()` around every
  chunk, retries at most 12 missed words in the background. Popup fields and Picture cards go through
  `dashText`/`stripDashes`. Reading-panel lines keep the model's order (never sorted by x0: RTL). `imageLoadSeqRef`:
  newest picture wins. A refine lands only if `ankiCardVerRef` is unchanged.
  `loadImageFromDataUrl` retires the running scan only in `onload` (an undecodable HEIC killed it); drops use the
  first IMAGE file and never switch tabs for a non-image; the overlay ignores paste (it has no Analyze button).
- **Zoom-aware tooltips**: body has `zoom:1.35` (non-overlay); rects/`clientX` are real px, `left/top` layout px, so
  divide by `getZoom()` and clamp pinned popups to the zoom-adjusted viewport.

## State persistence across refresh
- **No-flicker first paint**: a blank themed `<div>` until `configLoaded` (just before the main `return`).
- Persisted: `activeTab` + settings → `config.json`; `activeModeId` + modes → `modes/_meta.json`; open chat →
  `localStorage('ebiki-chat-session')`; deck browser deck → `localStorage('ebiki-deck')`; study session →
  `localStorage('ebiki-study-session')`.
- **`beginStudy` touches `studyLoading`/`ankiError` only while its session is current** (`mine()`); `exitStudy`
  clears `studyLoading` (a mode switch mid-start left Start stuck on "Loading…").
- **Restore re-queues cards the cursor passed before they got a state** (flashcards only): the cursor moves before
  a card's questions exist; a reload in that window skipped them for good. A starting session (`studyLoading`)
  counts as live for `endStudyForModeSwitch`. "Back" never reopens a `rating: 'deleted'` card; "Yes, delete" is
  claimed once (`studyDeletingRef`). The post-sync refresh reads `deckBrowserDeckRef` / `studyDeckLiveRef`, never
  the queuing render's deck.
- **The Study START screen is not a live session**: the deck-follow effect runs for `studyPhase === 'pick'`, the
  snapshot re-saves on `activeModeId`, a restored pick screen never switches the mode back. A snapshot write that
  FAILS removes the stored one (a stale copy re-answered cards in Anki after a reload).
- **Study resume** (only after a SUCCESSFUL modes read, `modesLoadedRef`; else the snapshot is left untouched):
  snapshot written on change, gated by `studyHydrated` (can't clobber before the one-shot restore), cleared when
  `studyActive` ends. **Expires** after `STUDY_SESSION_MAX_AGE_MS` (8h) WITHOUT PROGRESS: the
  clock is `activeAt` (`src/utils/studySession.js`, bumped only when `activitySignature` changes), never `savedAt`
  (the restore re-saves, so each launch kept a weeks-old session alive and raids/Ebi Call refused). A live session
  idle 8h (checked on state change, focus/visibility, every 5 min, `ctx.study.status()`) and an expired snapshot with
  unsynced ratings (reopened on its summary; `studyAbandonedRef` keeps it abandoned) end QUIETLY (`endAbandonedStudy`:
  sync first, then `teardownStudy` = exitStudy without prompts, plus a dismissable Study home note
  `study_closedIdle`); while ratings can't reach Anki it stays and blocks (`call_studyUnsynced`). Features ask via
  `kit/studyGuard.js` (`studyBlock`); `ctx.studyActive` is false on the start screen. The snapshot
  stores `studyAllCards` through `snapshotCard` (no css/nextReviews/<style>): full cardsInfo blew the storage quota.
  A valid restore SANITIZES: unsynced `gradedAt` re-stamped to now; cards stuck `evaluating: true` re-graded via
  `resumeReEvalRef` → `evaluateCard`; `currentQuestion` validated or nulled. A **stall-rescue effect** (near
  `startBatch`, guarded by the `pullsInFlightRef` counter around `pullNewCardInner`) pulls a card whenever the
  question phase has nothing to show, nothing evaluating, no pull in flight, and cards left; it also runs when the
  restore was skipped (`configLoaded && !modesLoadedRef.current`).
- `overlayEnabled` (config, default ON, auto-launches once).
- **Capture shortcut: `Alt+Q` only** (`electron/main.cjs` + a web keydown handler): opens the overlay over a
  screenshot of the screen (no drag-to-select any more), Esc dismisses. No `Ctrl+Shift+A`. It switches to the
  Picture tab first (a capture on another tab was never shown). `/api/launch-overlay` tracks its child by identity
  (`overlayProcess === p`), refuses a second one while an untracked overlay runs, and waits for a pending DELETE's
  orphan sweep; server `shutdown()` sweeps too. Launch POSTs are serialized (`overlayLaunchChain`); the toggle sets
  `overlayAutoLaunchedRef`. Both windows reload on `render-process-gone`.
  The overlay page re-reads keys, config, modes and the deck list on every `overlay-reset`
  (`refreshOverlaySettings`, read-only): it loads once at startup, often before onboarding set a key. The
  auto-analyze waits for that refresh (`overlaySettingsReadyRef`, 5s cap).
  The header toggle acts on `overlayRunning` (what the dot shows), not the saved preference.

## Back / Forward (`src/nav/`): the mouse's back button, Alt+Left, a phone's back button
Navigation lives in React state, so the app keeps its OWN history. `history.js` (pure stack: entries = snapshots of
every live slice, push/replace/unwind, cap 100; tested in `nav.test.js` with `memory.js`), `index.js` (the service
`nav`), `react.js` (`useNavEntry(key, value, apply, { enabled, rest, guard, replace, replaceWhen })`, re-exported by
`src/features/registry.jsx`; `ctx.nav` = back/forward/canGoBack). Device side = `platform.history` (window.history +
popstate; `onDeviceNav` = mouse buttons 3/4, Electron's `app-command` forwarded by main.cjs as `app-window:nav`, and
Alt+Left/Right in Electron only). Rules:
- **A user change of a slice is an entry; changing TO its `rest` value UNWINDS** to the earlier entry that looks like
  the live state (closing Settings, leaving a step for the map), so closing never leaves a "reopen" entry.
- **Back never abandons something running silently**: `guard(to, from)` returns false (stay), true, or `'skip'`
  (that entry cannot be shown again, e.g. Forward into a finished quiz). Study asks (`nav_leaveStudy`) then runs
  the normal `exitStudy`; Legends steps/raids/placement ask (`nav_leaveRun`), `inferring` refuses; Practice activities ask
  (`nav_leaveActivity`). A blocker stops every move while a dialog, Ebi Studio, the wizard or a data switch is up.
- Slices now: `tab` (every screen), `settings` (pane, rest null), `study` (session, rest pick), `chat` (open chat, Chat
  screen only; a new chat's first id replaces), `legends.view` (map/assets/edit/activity), `legends.assetsTab` (+ scroll
  memo via `remember`) and `legends.assetsIdx` (replace), `practice.open`. A screen mounting on an entry restores itself
  (only on a plain `true` guard: never a dialog while mounting).
- A guard entry sits behind the first entry: Back at the root steps forward again, never out of the app (also over a
  reload's old entries). Never in the overlay. Electron: never `webContents.goBack()` (could reach the holding page).
- New screen or sub-view: one `useNavEntry` with a `<feature>.<what>` key; plain-data values only.

## Card generator (shared, language-agnostic) + Quick Add
- `generateCards(words)` works for any language/subject. **Language modes** → `LANGUAGE_CARD_PROMPT` with
  `learnLangName()` (from `studyRules.studyLanguage` / app `language` / mode name) and `userLangName()`
  (`APP_LANG_NAME[appLanguage]`); back labels are IN the learned language (Pronunciación, Aussprache, 发音). **Other
  modes** → `GENERIC_CARD_PROMPT` with the mode's `description`, `backTemplate` (fixed format when it has
  `{placeholders}`) and `tagRules`. Returns `{ front, back, tags, correction }`. `cardBackToHtml` bolds each line's
  leading `Label:` in any script (`^([^:\n]{1,30}):`). Added via `ankiAddNote` (allowDuplicate for Quick Add) +
  sync; the `ankiCanAddNote` pre-check only warns.
- **General modes write card content in the APP language** (`{USER_LANG}` in `GENERIC_CARD_PROMPT`,
  `contentLangRule` in `buildCardFields`, the Chat `<anki-card>` general format). Front term, proper nouns, code,
  formulas and tag tokens stay original. `createMode` also writes `chatSuggestions` and the
  `questionPrompt`/`mnemonicHints` instructions in `userLangName()`.
- **Language modes always ask the model for `partOfSpeech`** when a template uses it, in the learned language; a
  caller's code (Picture's "adj"/"other", conjugation's "verb") is only a hint. `withBasicModel` uses the "Basic"
  type's REAL first two field names (`basicFieldNames`, cached): a renamed Basic made every add "empty".
- **An empty template placeholder must not ship its punctuation** (default `frontTemplate`
  `{word} ({partOfSpeech})` → `word ()`). `buildCardFields` asks for `partOfSpeech` when a template needs it and the
  caller left it blank (in the learned language for language modes); `cleanTemplateGaps` strips EMPTY bracket pairs
  (only empty ones) from front and back.
- **`generateCards` is BATCHED** (8 words per call, `maxTokens: 8000`, each batch proofread): 30 pasted words hit
  the output limit and the salvaged reply silently lost cards. A failed or unreadable batch is counted
  (`missedWords` on the result, `deck_genPartial`), never fatal unless every batch failed. A reply cut off mid-list
  (not ending in `]`/`}`) re-queues, once, each batch word no card covers, but only the words AFTER the last batch
  word a card visibly covers (earlier ones were answered, maybe under another headword); a second miss counts.
  Cards are kept once per run by their FULL front (`madeFronts`, sense label kept). A short `verifyCards` reply is
  a cut-off prefix (unreached cards stay unverified); its tail keeps only rows whose headword is still
  under-represented (never a checked card twice).
  Quick Add: "Add N" stops when a new tray arrives (`quickAddTrayRef`); drops a result after a mode switch or Close
  (errors too); disables Generate while "Add N" runs (`quickAddBatching`); added/adding tray cards are read-only;
  the duplicate check uses `deckBrowserDeckRef` after the generation and drops the tray if the deck changed.
- **Accuracy guardrail (cards get MEMORIZED)**: `verifyCards`, a second pass, fixes nonexistent/misspelled words,
  wrong gender/translation/example, dishonest usage tags. Card + chat prompts say "never invent words, verify,
  admit uncertainty". `verifyCards(cards, label, isLang)`: general modes get a facts/definitions proofread that
  keeps tags (usage-tag, preferred-term and gender checks are language-only). The question prompt's AMBIGUITY
  SELF-CHECK asks general modes for a sense cue, never a letter.

### Usage tags (`src/tags/usage.js`): where, how often, in what context
A definition alone teaches the wrong thing ("anegada = flooded", but natives say "inundada"; a Mexico-only word).
Three families on every language card and the tapped-word lookup, in this order:
- `region-*`: `region-global` if natives everywhere use/understand it in the card's sense, else `region-<place>`
  (`region-spain`, `region-mexico`, `region-latam`, …).
- `freq-*`: MANDATORY, exactly one of `FREQ_SCALE`: `freq-core` / `freq-common` / `freq-uncommon` (known, rarely
  said) / `freq-rare` (literature, specialized, old).
- `register-*`: only when genuinely restricted, from the CLOSED `REGISTERS` list (literary, political, legal,
  medical, technical, academic, slang, archaic, …). Neutral words get none. Closed so Anki's tag tree stays clean.

Where the rule lives (keep in sync): inline in `LANGUAGE_CARD_PROMPT`'s tags line (Quick Add, tapped-word cards,
conjugation add); `usageTagsRule()` next to `dialectRule()` (Chat `<anki-card>`, `buildCardFields`, bulk-edit
framing, appended even over custom `tagRules`); `usageTagsContract()` + `usageTagsVocab()` (JSON contract for
lookup + check). Every prompt makes the model state `usageEvidence` BEFORE the tags. Distinct from the DIALECT
(which variant content is written in).
- **Over-claiming is the harmful direction** (a false "everyday/universal" makes the learner SAY it). Unsure → name
  only regions it can back, pick the LESS common frequency. `verifyCards`/`verifyDeckRecs` demote doubtful claims
  and delete unbackable tags.
- **A usage-tag check that did not run returns `failed: true` and is never cached** (lookup cache, per-note
  `usageTagCacheRef`), so it is retried next time instead of staying "unconfirmed" all session.
- **Double-check on the lookup path**: `checkUsageTags` answers from scratch WITHOUT seeing the first pass's tags;
  `reconcileUsageTags` (pure, vitest-covered) merges in code: freq → less common (flagged if ≥2 steps apart);
  region → intersection (`global` vs specific → specific; disjoint → union, flagged); register only if both named
  it. Unconfirmed tags still render, gray-dashed with "?" and a tooltip. Fail-soft. `deriveUsageTags` (two parallel
  reads) covers untagged legacy cards; `resolveCardUsageTags` prefers the card's own Anki tags, cached per session
  in `usageTagCacheRef`. `studyWordMakeCard` carries the CONFIRMED tags onto the new card.
- **Region sets spanning the language collapse to `region-global`**: `collapseSpanningRegions` + the
  `REGION_SPANS` data table (spanish = spain+latam, portuguese = portugal+brazil, english = uk+us, …; data, never
  `if (lang === …)`). Prompts forbid spelling global the long way; `foldUsageTags` (normalize + collapse) is the
  funnel for every tag producer. `analyzeDeck` collapses PROPOSED tag lists (only when tags were proposed).
- **🏷 Tag audit** (deck browser, language modes): `usageTagAuditInstruction()` through the full bulk-edit pipeline
  (batched, verified, chip diff, accept per card). TAGS-ONLY (no `recommendedFields`); must carry over every
  non-usage tag (`recommendedTags` replaces the whole list), enforced in code (`keepAuditContract` in
  `analyzeDeck`): non-usage tags always kept, fields never change. Refine reads `deckAnalyzeTagsOnly` (recorded at
  run time), never a rebuilt `usageTagAuditInstruction()` (it changes with the dialect/learned language).
- **Rendering**: `renderUsageTagChips` (App.jsx) with `sortTagsUsageFirst` (region → freq → register first),
  `usageTagStyle` (green = safe: `region-global`/`freq-core`/`freq-common`; amber = heads-up; gray-dashed =
  unconfirmed), `usageTagTip`. Used by chat `<anki-card>`, the Quick Add tray, deck rows, the Picture widget, the
  tapped-word popup (lookup chips + card preview), the Learn-it moment, the Discover preview (`DiscoverPanel.jsx`
  imports the helpers). **New tag-chip surfaces must use these.** The popup and Learn-it panel show the FULL tag row
  (`otherTags`: part of speech, level, topic, ebiki), kept separate since only usage families are double-checked.
- **Tooltips are i18n'd** (`tag_*` keys, all four dicts). `usageTagTip(tag, {unverified, t})` returns '' without
  `t`. `usage.test.js` asserts every tag resolves in en/es/zh/ja.
- **The live study question shows usage tags** (left of the progress dots), filtered by `isUsageTag` so a topic tag
  can't leak the answer. Language modes only (general decks use region-/freq- tags as subject content).
  `cardsInfo` has no tags, so `loadStudyCardTags` reads them with ONE batched `notesInfo` per session (also warms
  `usageTagCacheRef`, which is cleared at session start and always refreshed from the batch read; a derived guess
  is cached only after a successful read). No derivation fallback here (it would stall the question); the Tag
  audit fixes untagged cards.
- `normalizeUsageTags` folds invented spellings (`region-usa` → `region-us`, `register-politics` →
  `register-political`) and drops junk from `generateCards` output and bulk-edit recs, but NEVER touches a tag a
  card already carries. `mapRecs`/`verifyDeckRecs` fold and collapse only in LANGUAGE modes; Refine folds its AI
  tags itself (its reviewer is fail-soft).

### Preferred-term honesty
A card must never teach the headword as the everyday word for a meaning a synonym dominates in the studied variant
("barro = mud": LatAm says "lodo"; barro leans clay). Distinct from usage tags (where) and dialect (which variant).
Per translation: is this what a speaker actually says for THIS meaning?
- `LANGUAGE_CARD_PROMPT`: translations ordered by which senses the headword owns; the usage line is REQUIRED when a
  listed sense is synonym-dominated, naming the preferred word.
- `preferredTermRule()` (next to `dialectRule()`, dialect-aware) in `generateCards`, `buildCardFields`, Chat
  `<anki-card>`, and `lookupStudyWord` (`usage` required when a more common word exists for the in-context sense).
- `verifyCards` enforces it ("technically true but misleading" = wrong); the question generator never quizzes a
  synonym-dominated sense as the word's identity.
- Existing decks: **🌎 Dialect audit** (deck browser, language modes) = `analyzeDeck('custom',
  dialectAuditInstruction())` through the bulk-edit review; most cards are skipped.

### Quick Add and chat cards
- **Deck → ⚡ Quick Add** (`quickAdd*`; a new generation is refused while "Add N" runs, since that loop walks its
  tray by index): paste words → `generateCards` → review tray (editable front/back/tags, one include ✓/○ toggle,
  "Add N to {deck}", dup/correction badges). Header shows Mode and target Deck. Adds use the deck on screen
  (`deckBrowserDeckRef`), "Add N" stops on a deck switch, and a tray id (`quickAddTrayRef`, bumped by a new tray and
  Close) keeps a late add off the next tray.
- **Chat cards**: the chat prompt gives the format and splits multi-meaning words; rendered as `<anki-card>`
  widgets; `chatTabSyncCard` formats + syncs. The button names the target deck (`chatCardDeck()` = composer
  "Attach deck" → `activeMode.ankiDeck` → first deck → `Default`): "+ Add to Anki → deck «name»", then "✓ Added to
  «name»".
- The composer's **"Attach deck…" dropdown is ALWAYS rendered** (disabled with an "Anki isn't open" note when
  disconnected). Once attached, the "Attached: <deck> (<n> cards)" chip replaces it IN PLACE (not at the top of the
  pane). i18n `chat_attached`/`chat_attachedOne`.

## Chat
- **"+" menu**: attach photo, web search, per-mode **Focus** (Tutor/Translator/Card-maker/Quiz-master/Free),
  **Level**, **Explain-in** language, **Chat model**. Focus/Level/Explain live on `activeMode.chatPrefs`
  (`setChatPref`) and go into the system prompt in `sendChatTabMessage`. The model picker writes
  `aiModels[provider].chat` (same override as Settings → AI & cost); "Default (…)" names `ROLE_DEFAULTS(pc).chat`.
  The menu closes on Esc and on a tab change.
- **Images**: `chatTabImage` (photo menu, or drop/paste on Chat; `handleDrop`/paste route there). On send, photos
  from the last 4 USER messages ride along as `opts.images` (downscaled). All attaches go through
  `attachChatImage` (refuses what can't become jpeg/png/gif/webp: HEIC/TIFF); the send drops any part outside
  `PORTABLE_IMAGE_TYPES` (one bad image used to fail every later message). Portable = JPEG/PNG ONLY (Gemini has no
  GIF, xAI takes jpg/png, OpenAI refuses animated GIF); `downscaleDataUrl` re-encodes everything else. The last
  photo picked wins (`chatImageSeqRef`). A paste into a text field on Chat keeps its TEXT when the clipboard has
  `text/plain` (Excel/Word add a PNG).
- **Chat honors the writer freeze** (`dataSwitchingRef`: saves, progress notes, rename, delete). Delete asks
  (`chat_deleteConfirm`), waits for card-add saves (`chatCardSavesRef`) and compares with `chatTabSessionIdRef`.
  Re-clicking the open chat does nothing (it reloaded over unsaved turns). `chatTabMsgsRef` is set the moment a
  reply lands. `stripDashes` (module scope) keeps digit ranges and cleans chat cards too.
- **Chat switches block sends** (`chatSwitchingRef` during New chat / open; `chatSendingRef` during a send; the
  restore-on-mount yields to a chat already started). History for every AI call goes through `boundChatHistory`
  (60k chars), incl. the search-offer answer. An EMPTY `<progress-update>` is ignored (it erased the notes).
- **Layout**: bubbles capped ~620px with `overflow-wrap:anywhere`; assistant replies show a 96px Ebi (`m.mascot`) on
  the right. Only assistant content renders markdown.
- **Scroll**: sending pins the latest USER message to the top (`scrollChatToLatestTurn`), sizing `chatSpacerRef` to
  `clientHeight − turnHeight` via `offsetTop`; recomputed after paint (double rAF) and on resize. The composer is
  never disabled while loading (it would blur); refocused after send.
- `choosePose` is awaited so pose and text appear together. Dashes stripped from output.
- **Offer-to-search**: with web search OFF, the model emits `<offer-search>query</offer-search>` instead of guessing;
  Yes (`chatOfferSearchAccept` → `/api/web-search`) / No (`chatOfferSearchDecline`).
- **Chat reply parsing**: `<sources>` lines go through `parseCitedSources` (URL = the last http(s) part; titles
  hold pipes) and keep only URLs the search returned (`keepRealSources`). A reply cut off mid-tag has the trailing
  unclosed block stripped. Chat cards go to Anki as PLAIN text (`escapePlainHtml` on front and each back line), like
  the widget shows them; card tags render through `normalizeChatCard`.
- **Web search skips DuckDuckGo ads** (`result--ad` before the block, or a `duckduckgo.com/y.js` link): they came
  back as the top "sources" with made-up URLs. The dev server logs an unhandled rejection instead of exiting
  (`__ebikiRejectionGuard`): an async middleware that throws outside its try killed the backend.
- **The "cite the results below" rule is added only WITH results** (a failed or empty search made the model invent
  citations). A failed or empty search keeps its status line. A mode switch clears the attached deck
  (`chatAttachSeqRef` bumped). Older modes' chip backfill writes text only (`cardText`) and only while the live mode
  still has no chips.
- **A search that never ran is a FAILURE, not "no results".** `/api/web-search` scrapes DuckDuckGo's HTML (entities
  decoded; each result's real URL from the `uddg` redirect param, else `https://` + the display address). A bot
  check instead of results (HTTP 202, "anomaly" page) returns 502 `{error}`, and both chat paths say the search
  failed, not that the web had no answer.
- **Chat history carries the assistant's cards** (`<anki-card>` JSON appended per turn in `boundChatHistory`).
  The reply cleanup never collapses whitespace (code indentation) and never lets a dash join lines. The send builds
  on `chatTabMsgsRef.current` after the photo wait. A progress update over changed notes is skipped and the chat
  ADOPTS the current notes.
- Renames ignore empty/unchanged titles (`chatRenamingRef`); renaming the OPEN chat waits while a reply or card add
  is in flight (`chat_renameBusy`). A chat tagged with ANOTHER mode (`chatOwnMode`) adds cards to that mode's deck
  and shows no audio. A card-add save that FORKS adds a list row for the new id with the original's mode
  (`chatOwnMode` looks the id up).
- **Markdown**: `src/components/Markdown.jsx` (`marked` + `DOMPurify`), themed by `.md-body`. Assistant only; user
  text is literal (`pre-wrap`). `<anki-card>`/`<sources>`/`<progress-update>` are stripped first.
## Features are plug-ins (`src/features/`): build every new feature this way
Each feature is ONE folder (`src/features/<id>/`: logic, components, `strings.js`, tests) registered in ONE line of
`src/features/index.js` (+ `src/features/server.js` for a server half). Deleting a feature = its folder + those lines.
**Never thread feature logic through App.jsx**; App only provides context, renders slots, emits facts.
- **Descriptor** (documented in the `registry.jsx` header): `id` (a feature's TEXT lives in `src/i18n/locales/*.js`,
  never in the feature), `defaults` (settings under config.json `features[id]`), `Mount` (rendered once app-wide),
  `headerItems`, `railCards`, `navItems` (whole sidebar screens: `{id, icon, labelKey, order, Screen, rail?}`),
  `settingsCards` (`section: 'general'`), `on` (event handlers).
- **`subject.rules` is a STRING** (prompts write `${subject.rules || ''}`); as a function its source code went into
  seven feature prompts.
- **Context**: components call `useFeatureCtx()`: `t`, `lang`, `apiKeys`, `getZoom`, `onboarded`,
  `presetModel(prov, tier)`, `activeMode`, `activeTab`/`setActiveTab`, `busy` (mid-question: hold popups),
  `isDataSwitching()` (writers must honor it), `featureSettings`/`setFeatureSettings(id, patch)`, `notify`,
  `learn` (`savedHooks(noteId, front)`, `makeHook(front, back, prior, method, noteId)`: Study's hook engine). A feature
  needing a service gets a GENERIC one added here; never pass feature-specific props.
- **Events** (`events.js`): App announces FACTS (`study.cardGraded`, `study.learnDone`, `cards.added`, `chat.sent`);
  features react. All new cards go through `addNewCard` (App), graded cards through `emitOnce` (keyed by run + card,
  persisted, so re-rates and restored sessions don't repeat). A throwing handler is isolated.
- **Server half** (`src/features/server.js`): `dataEntries` join `DATA_ENTRIES` (backups, merges, offline copy),
  `dataRoutes` join the unreachable-share guard, `localFiles` are watch-ignored (add them to `.gitignore`). Data
  entries and local files are ignored ANCHORED to the app root (as `**/features/**` the data folder also ignored
  `src/features` and no feature edit hot-reloaded). `register(server, helpers)` adds routes after the guard. Helpers:
  `dataPath`, `readUtf8`, `writeFileAtomic`, `appRoot`, `fs`, `path`, `crypto`.
- **Shared UI** (`src/features/ui.jsx`): `Card`, `ChunkyButton` (3D bottom edge), `ProgressBar`, `Modal` (zoom-safe),
  `EbiSays`, `tCount` (key/keyOne), `depthBorder` (longhand borders: never mix `border` with `borderBottomWidth`).
  Tunables are named constants at the top of each module (the `UI`, `SHELL`, `GOALS`, `XP` objects), never literals.
- `features.test.js` checks every feature: no own strings, labels translated in every language, slot components,
  known events, distinct server data entries, and NO imports of App internals (`App`, `components/`, `shell/`,
  `dev/`; listed exceptions: art.jsx's lazy Markdown sanitizer, the experimental BossFamilies catalog names).

### App shell (`src/shell/`)
Sidebar (core screens `CORE_NAV` + feature `navItems`) | screen | rail (feature `railCards`, only on `railWanted`
screens: Study home, Stats; feature screens opt in with `rail: true`). Sizes/breakpoints in `SHELL` (CSS px after the
body zoom; `useViewportWidth`): icon-only sidebar below `collapseBelow`, no rail below `railHideBelow`. In the overlay
the wrappers are `display: contents`. Sidebar icons are drawn SVGs (`public/assets/nav/<art>.svg`, `art` on
`CORE_NAV` entries and feature `navItems`; the emoji `icon` stays as fallback and for the Chat "+" menu). A saved
`activeTab` that no longer exists falls back to Study.
**Core screens share the Duolingo-style look through global classes** (App.jsx global `<style>`, same design as
`src/features/ui.jsx`): `.duo-title` (display heading), `.duo-bubble` (Ebi speech bubble), `.duo-cta` (+ `.green`;
chunky 3D button, pair with `btn-press`), `.duo-tile` (+ `.brand`; chunky choice tile). Used by the Study home, the
Chat empty state and the Deck header. Tiles in a flex column WRAP (`flex: 1 1 170px; minWidth: 0`), never an auto-fit
grid: its min-content width widened the Chat column and pushed Send off screen.

### Voice typing (`src/features/voice/`)
A mic badge on the focused text field (any `input[type=text|search]`, `textarea`, contenteditable); Alt+V toggles, Esc
cancels. Engines (`stt.js`, `pickEngine`): stored OpenAI key → `gpt-4o-mini-transcribe` (~$0.003/min); Gemini key →
generateContent with audio; else the browser recognizer ONLY in a tab (Electron's always fails "network"). Text goes in
via the native value setter + `input` event (React-controlled fields). Never on secrets: key fields carry
`data-no-voice`. The badge portals into `#ebiki-voice-layer` under `<html>` (not `<html>` itself).

### Game (`src/features/game/`): XP, goal, streak, freezes, quests, league, friends
- **Only raw counters are stored**: `players/<id>.json` in the DATA folder, `days[date][machineId] = {xp, cards, …,
  goal, quests}`. Everything shown is DERIVED (`engine.js`, pure, tested). Merges take the MAX per machine per counter
  (`mergePlayers`, run by the server on every write), so computers on one share never lose or double count.
- `player.json` in the APP folder = this computer's `{machineId, playerId}` (`/api/player-local`, not guarded).
  Several players in the folder and none picked → "Who is studying?" chooser (family vs one person, two PCs).
- Streak: any XP keeps the day. Freezes: start with 1; finishing all 3 of a day's quests earns one (max 2); a missed
  day spends one automatically. Quests: always "earn XP" + 2 seeded picks, stored in the day record; a quest kind
  needing another feature (`mistake-gym`, `legends`, `ebi-call`) appears only once that feature id is installed.
- League: race your own past 4 weeks by the same weekday (ghosts); beat all → up a tier, fall below all → down.
  Friends = other players in the folder (shown, never affect your tier). Saves send only the last 14 days.
- The Stats tab's streak is ANKI's review streak ("Review Streak"); the game streak is Ebiki activity.

### Practice activities, speech and the shared kit
- **`practiceHero`** (`{id, order, activity, Component}`): the Practice hub shows the lowest-order hero full width above the tiles and hides that activity's tile; the Daily raid's is `legends/RaidHero.jsx` (state in `heroState.js`, pure, tested; read-only, never writes raid state). **Never give a .js and a .jsx the same name ignoring case** (Windows resolved `./RaidHero` to `raidHero.js`). Sidebar rows show a hover/focus flyout (`NavFlyout`, portaled like Dropdown) with `nav_desc_<id>` / a nav item's `descKey` (required, tested).
- **Slots added**: `practiceActivities` (Practice hub tiles; Screen gets `{ onExit, params }`), `chatMenuItems`
  (`{id, icon, labelKey, onPick(ctx), visible?(ctx)}` in the Chat "+" menu). **Intents**: `ctx.open(navId, payload)`
  switches screens and leaves a payload the screen takes with `useIntent` (Chat → Practice → Roleplay). Features never
  import each other; shared code lives in `src/features/kit/`.
- **Optional features** (`optional: true`, off until Settings > General > Optional features): `voice-chat` (talk
  button + spoken replies in Ebi Call and Roleplay; read with `voiceChatOn(ctx)` from the kit), `listen-speak`,
  `scenes`. Opt-in because they cost speech on the user's key.
- **Speech** (`src/speech/`): `listen(ctx)` / `speak(ctx, text, {lang, voice})`, cheapest engine first (browser/device
  free, then Gemini < Grok < OpenAI); Settings card "Voice and speech" (`speech` feature). QuizRunner questions can
  carry `audio: {text, lang}` (heard, not shown) and `speak: true` (answer out loud).
- **Roleplay**: scenes suggested from the subject, typed, or built from a photo (vision); Ebi plays the OTHER part;
  end = scorecard (language: accuracy/complexity/vocabulary; else correctness/reasoning/communication) with tips and
  addable cards. **Scenes**: `kit/scene.js` (reusable by Legends). **Listen & Speak**: audio drills from the cards.
- **Practice log** (`kit/practiceLog.js` pure + `practiceLogStore.js`, store `features/practice-log/log-<modeId>`):
  every activity records the cards and topics it practiced (`recordPractice(ctx, src, entries)`); `pickCardItems` and
  Ebi Call's practice call rank cards another activity practiced in the last 2 days LAST (`rankFresh`); topic prompts
  get `recentTopics` as "pick something else". Mistake Gym rotates (`practicedAt`, 12h rest) and ignores its own log
  entries. **Study reviews are never filtered by it** (Anki's schedule decides; skipping a due card breaks spacing).
- **Rule cards** (`kit/ruleCard.js` + `RuleCardButton`): a mistake, recurring slip or gym diagnosis becomes a card for
  the RULE behind it (grammar/orthography in language modes, a principle elsewhere), role `deck`, editable preview
  before Add; the model skips one-offs. In Mistake Gym: each mistake row, the slips list (`subject.grammarSlipList`),
  the diagnosis, and wrong answers (`QuizRunner feedbackExtra`).
- **Translations are tested**: `src/features/i18n-coverage.test.js` fails when any `t('key')`, `tCount(t, 'key')` or
  `*Key: 'key'` anywhere in `src/` is missing in any language. It can't see template keys (`` t(`rp_axis_${a}`) ``)
  or prefixes (`t('tab_' + id)`): add those to every locale by hand.

### Legends (`src/features/legends/`): the adventure map per mode
Works for ANY subject (a CompTIA map teaches CompTIA). Discover can use the level (opt-in, see Discover). Sidebar
screen `legends` (order 15, no rail: the map header shows the level), rail card `LevelCard` (Study home, Stats).
- **Pure, tested**: `map.js` (map model; `normalizeMap` recomputes every status from what is DONE: areas open in
  order, steps one by one, optional Talk steps never block, the boss last; `applyNodeResult` stars/passes and FREEZES
  the area; `needsDetail`/`applyAreaDetail` = lazy detail of `LOOKAHEAD` areas; `mergeEdit` keeps started and finished
  areas exactly, first, and takes the proposal for the rest), `placement.js` (batches of 5 per tier, climb on 80%,
  step down while struggling, 10 to 30 questions, `placementLevel`), `prompt.js` (every prompt + parser). Tests:
  `map.test.js`, `placement.test.js`, `prompt.test.js`, `art.test.js`.
- **Storage**: `store.js` = `featureStore('legends')`, key `map-<modeId>`, serialized `updateMap(modeId, fn)` that
  never writes after a failed read; every async writer passes the mode id pinned when it STARTED. Start over writes
  null. `shapeMap` refuses a map from a newer `MAP_VERSION`.
- **Levels for everyone, from evidence** (the owner: "if the app has enough context for the user's understanding of a
  topic then it uses that instead" of the test). `kit/evidence.js` (pure, tested) turns the LEARNER CONTEXT snapshot
  (below) into points and an `enough` verdict (`EVIDENCE`: studied card 1, graded study answer 1/3, the learner's chat
  words 1 per 15 (capped), slips, Discover; 40 points, or 15 when the deck shows 30+ NEW cards as its scope, giving a
  CAUTIOUS level, confidence capped 0.45, else 0.7). New cards are never points ("what the learner chose to study
  next", sent as scope only). Studied cards go in with real stats; mature and young count alike. An unreadable deck is
  `deckFailed`/`deckUnreachable` and the rest still counts. `kit/evidenceJudge.js` runs it. Used by:
  - Legends' third start tile **"Use what Ebiki knows"** (Questionnaire + `knownReason.js`, tested): OFFERED whenever
    the mode has anything (studied or new cards, sessions, chats, slips...); the click reads everything AGAIN
    (`fresh`) and decides; too little says what is missing ("study about N more cards or chat with Ebi"), a closed
    Anki is named with what else was used. The screen re-reads when `ankiConnected` turns true and on "Check again"
    (the 2026-10 bug: one read at questionnaire open, before Anki answered, and ANY failure shown as "is Anki
    open?"). Path `known`, `map.start.placement.from = 'evidence'`, the result shows the model's `why`; thin falls
    back to the resume screen with the reason and the test.
  - The **learner feature** (`features/learner/`): owns level NUDGES now (Legends no longer does; study cards batched
    per burst, `STUDY_FLUSH_MS`, not a store write per card) and seeds a level for a mode with none once evidence is
    enough (one silent AI call per mode per app session, active mode only, quiet: no LEVEL_UP; also tried by its
    `Mount` when a mode becomes active with Anki connected, for Anki-only reviewers). Unapplied study batches are kept
    in `localStorage('ebiki-learner-pending')` PER PAGE (owner + `seenAt`; another tab's entries adopted only after
    60s of silence), flushed on page hide. Evidence uses the mode deck or the first deck (never none).
  A damaged `features/<id>/<key>.json` is retried after 1s, then kept aside as `.corrupt-<stamp>` and read as empty.
  The level reaches Study question generation (`levelBlock`, wording only), Chat (when no manual Chat level is set),
  Mistake Gym, Listen & Speak, Scenes, Roleplay, Ebi Call, Legends and Help.
- **Practice wrong answers reach the Mistake Gym**: `EVENTS.PRACTICE_MISSED { source, mode, misses }` from Ebi Call
  (cards it could not elicit), Legends steps (`res.misses`), Scenes and Listen & Speak (`missesFromResults`,
  kit/grade.js). Never the gym's own workouts. Study cards made from Legends items move the item's tally
  (`tallyStudiedCard`, map.js; only when the map is cached, never gold). Legends steps log their items in the practice
  log. Roleplay's strengths go into the level's "strong at".
- **Learner level is in the KIT** (`kit/learner.js` pure, `kit/learnerStore.js`, store
  `features/learner/level-<modeId>`) so others read it without importing Legends: Ebi Call, Roleplay, Scenes and every
  Legends prompt pass `level: await learnerLevelLine(ctx)`. 0..130 plus a band (A1..C2 for languages,
  Beginner..Expert otherwise; `lg_band_*`). Set by placement (or "I'm new"); nudged by
  `deltaFor(source, total, correct)` from Legends results and, through the feature's `on`, CARD_GRADED and other
  features' PRACTICE_DONE. Only an EXISTING level moves. `peak` = highest level reached: `LEVEL_UP` (whole level above
  the peak) is emitted once, never on a re-climb.
- **Generation** (`generate.js`, one run per task via `once`): plan (role general) → detail (role deck: items become
  cards) → quiz per step (role study, `adaptiveSplit`: new or weak items asked as multiple choice).
- **An area is `LESSONS` (8) levels, then Weak spots, then the boss** (a 2026-09 comparison with Duolingo: a Learn
  step plus a Practice step over the SAME items read as one level twice). Every level teaches `PER_LESSON` (2 to 3)
  NEW items and quizzes them (`QUIZ_SIZE.learn` 10: each new item two ways, plus up to `QUIZ_REVIEW_ITEMS` items of
  EARLIER levels, shakiest first, as spaced review). `parseAreaDetail` enforces it: a 'practice' node is dropped, an
  item is taught by ONE level (a repeat is removed), untaught items get their own level (else join the last). A story
  level teaches its items first too (`TEACH_KINDS`). Older maps keep their practice steps.
- **Missed questions come back once at the end** (`QuizRunner retryMisses`, Duolingo style; not in fights). The retry
  is practice: never changes the score (`_retry`, NodeRun's `record` ignores it).
- **Weak spots** (node kind `weak`, optional, opens with the boss, never blocks it; `ensureWeakNodes` adds it to older
  maps on load): 10 questions over `weakItems(area)` (lowest share right, then least seen). Clearing it ONCE sets
  `area.bonusLife`: the boss starts with one extra life, a gold 💖 with a "+1" tag (`Lives bonus`); a replay never
  adds another. The life is one more allowed miss: `bossOdds(total, {bonus})` needs one hit less, and
  `forgivenMisses` goes into the result as `forgiven`, which `applyNodeResult` counts as right (boss only, capped by
  what the area earned). The cheat path for a locked Weak spots step pays the life too.
- **The boss is always 20 questions and written FRESH every attempt** (`FRESH_KINDS`: never a saved set; the step file
  keeps only `history`, the prompts already asked, fed back as `avoid`). Its prompt pushes to the limit: new sentences
  and situations, combined items, production, close distractors, never unfair.
- **Legendary** (a cleared area's "Legendary challenge"): a fight that is not a map node (`{kind: 'legendary'}`), 20
  fresh questions, all typed, 90% to win (`PASS.legendary`), no bonus life; `applyLegendaryResult` marks
  `area.legendary` (🏅 on the map).
- **Quizzes ask ONLY about what the step taught.** `buildQuizPrompt` sends the items' full text as the one source
  ("LEARNING MATERIAL THE LEARNER WAS SHOWN"), the knowledge base only as background for accuracy, at most
  `QUIZ_PER_ITEM_MAX` questions per item, wrong options clearly wrong. `makeQuiz` drops every question whose `target`
  is not a taught item (`itemIdFor`) and asks once more (`strict`) when fewer than `QUIZ_MIN_KEPT` remain (a Learn step
  taught three greetings, then quizzed on things it never showed).
  What is ASKED comes only from the material. The mode DESCRIPTION is the learner's own context, in their words, and
  quizzes, the grader and raids SEE it: situations may draw on it ("moving to Texas with my uncle" gives a shop in
  Texas, the uncle in a Talk step). That is personalization, not a hallucination (a 2026-09 attempt to hide the
  description was reverted at the owner's request). A REVIEW PASS (`buildQuizCheckPrompt` / `parseQuizCheck`, role
  study) then drops questions with a second defensible option ("I am Carlos" vs the key "I'm Carlos"), a missing
  accepted answer, a wrong key, or untaught content; fail-soft (a failed review keeps the set). A saved set carries
  `checked: QUIZ_CHECK_VERSION`; an older one is reviewed ONCE on its next visit (kept and re-saved if enough questions
  survive, else a new set is made): sets saved before the review asked "most natural in Texas".
  **🔄 New questions is for everyone, not a cheat** (`NewQuestionsButton`, NodeRun): beside Start questions on the
  lesson, above the scene story, under the boss entrance, above a running quiz (boss too; asks first once answers
  exist, nothing recorded) and under the result. `newQuestions` in LegendsScreen = `clearStep` + reopen with
  `try + 1`.
  **A set the review shrank is TOPPED UP** (`QUIZ_TOPUP_BELOW`: under 85% of the target, one more call for exactly the
  missing count, avoiding the kept prompts, reviewed too): a boss of 14 came back with 8. Old sets refill the same way.
- **Bosses have names** from what the area teaches ("El Relojero Tic-Tac" guards numbers and time): `boss` in the
  area-detail JSON (`bossLine`, user's language) → `area.bossName`; areas detailed before names existed get one from
  `ensureBossName` (role help, once; `setBossName` fills only a missing name, frozen areas too). Shown on the entrance
  (`lg_bossNamed` + `lg_bossGuards`), the arena, the quiz title and the map; no name = the old wording. The result
  screen lists EVERY answer (`AllAnswers`, `res.answers`), not only the misses.
- **Art is hand-made FILES, never generated** (`public/assets/legends/areas|bosses/<motif>.svg`, one per `MOTIFS`
  entry; the map's AI only picks motif and palette). `art.jsx` fetches a file once, sanitizes it with the app's
  `sanitizeHtml` (loaded LAZILY: Markdown.jsx needs a DOM; a top-level import broke `features.test.js`) and inlines it
  in a box that sets the palette variables. **Every drawing is painted in its OWN ideal fixed colors** (palette
  `original`, first in `PALETTES`); a palette recolors only ONE chosen part per boss (its fire, gems, aura, cape),
  using `--lg-tint`/`-hi`/`-lo` with the ideal colors as fallbacks, in the boss, its banner and every raid phase (the
  owner: palettes repainting whole bosses made some unrecognizable). `art.test.js` fails on the retired
  `--lg-sky/far/near/deep/accent/light`, on a file with no tinted part, on a `var()` without its own fallback, and
  checks one file per motif and no scripts/links/url(). A new motif = a `MOTIFS` entry + both files + an `ENTRANCES`
  entry. How to edit: `public/assets/legends/README.md`.
- **Asked to make or redraw Legends art (a boss, a RAID boss, a banner)? Read `docs/legends-art-guide.md` FIRST (start
  with "The owner's top rules, in short": big in frame always, a new camera/pose/face per raid phase, personality
  constant, kitsune quality, phase 3 the climax with the most motion, anatomy and held objects readable at a glance,
  sleek not blocky shapes, abilities that move the boss's real parts and never cover or hide it, light files; and,
  for any raid boss voice or lore, its "Raid boss voices" section: unique, not cheesy, plain, never technical, any
  subject) and follow it** (the owner's art direction; its "owner's vision" section lists what was
  approved and rejected; `raids/kitsune.svg` is the gold standard of quality, `raids/void.svg` next; its "2026-10
  review rounds" list holds the newest lessons: badass over cute, one creature's features shared across heads and
  phases, mouths never in eye positions, no ring maws, a different POSE per raid phase, raid variations of loved
  Legends bosses go all out while staying recognizable). Every new or redrawn asset gets the guide's TRIPLE CHECK
  (each drawing alone, the whole set side by side, then the real app screens + tests + check-art) before the owner
  sees it. **Its "boss recipe" is the bar for EVERY new boss** (from the raid redesign the owner loved): a written plan
  per boss first; fill and bleed past the frame, seen from below; a backdrop that is part of the boss; angry brows
  over slit glowing eyes, angular cel-shaded skulls, too many teeth; materials that read (gauntlets, real chain links,
  lit wing membranes); contrast checked against the backdrop in both themes; every phase a transformation that reads
  at 120 px; then a second pass at 420 px. Bosses super detailed (never cute); RAID bosses all terrifying, LEGENDS
  bosses a VARIETY of moods (mean where the design calls for it, others smug, playful, eerie, proud: the owner's
  2026-10 rule, details in the guide's "Mood" bullet); every boss and banner truly unique (different silhouette, pose,
  backdrop, eyes, mouth and entrance, not a recolor); each banner is its boss's lair with the boss present; each boss
  has its OWN animated entrance (no two share a MOVEMENT, not only a keyframe name; `ENTRANCES` entries can set a
  pivot `origin`); everything has idle life. 40 motifs now; `dev/legends-gallery/catalog.js` is the one list of them
  (boss, idea, entrance, lair; a test keeps it equal to `MOTIFS`). The owner reviews ALL art at
  `/dev/legends-gallery/` (dev server only; Good/Change/Bad + notes, "Copy my feedback"). `keyTimes` must match
  `values` one to one and end at 1, or the browser silently drops the animation (tested). The app palette CSS lives in
  `src/config/palette.js` (`PALETTE_CSS`, shared by App and the gallery).
  Motion is in-file SVG (`<animateTransform>`/`<animateMotion>` only: the sanitizer drops
  `<animate>`/`<set>`/`calcMode`), tagged `class="lg-in"` (entrance) or `lg-loop` (idle); `art.jsx` `withMotion`
  strips per `animated` mode ('intro' on the intro card, 'idle' in the arena and on banners, still on map icons,
  locked areas and reduced motion), so a file's own attributes must be the finished pose. The card motion per motif is
  `ENTRANCES` (BossArena.jsx CSS keyframes, landing at `ENTRANCE.impact`). No `url()` = no gradients: depth is layered
  opacity shapes. Always render the art in headless Chrome (light + dark palette, a few moments of the entrance) and
  look before committing. Old maps may still carry an `art.svg` from the AI-art days; nothing reads it.
- **Step content is made ONCE and saved** (`store.js` `readStep`/`saveStep`, one `features/legends/step-<hash>.json`
  per step, keyed by mode + area + node, `sig` = the step's items): a revisit or retry reuses it (`reshuffleQuiz`: new
  question and choice order), scenes too (`sceneFor`). A changed area (Change my map) no longer matches `sig` and gets
  a new set. A new set is written with the area's other steps' questions as `avoid` (Learn and Practice repeated each
  other) and exact repeats are dropped (`normQ`). Talk steps are live conversation (always new).
- **Talk steps**: Ebi plays the step's scene (`buildTalkSystem` `scene` = node title: "Conversation with your uncle"
  makes Ebi the uncle) and never re-asks what the learner said. **💡 Hint** (`buildTalkHintPrompt`, role `help`): ONE
  sentence in the user's language saying WHAT to say next, never the learned-language words; `hintGivesAway` rejects a
  hint quoting a practice phrase (asked again once, then `lg_hintFallback`); hints used go to the score prompt.
- **Ebi's words are tappable like Study** (`ctx.words.tappable(text, source)` + `ctx.words.popup(source)` = App's
  `renderTappableText`/`renderWordLookupPopup`): Talk messages and Scene lines (replay is now its own 🔊 button, since
  the line was one big button). Sources are unique per chat/story (`sid`); only 'question'/'hint' are guarded as a live
  answer. Language modes only.
- **Fight settings + Study formatting in every quiz** (owner: "the user may want to fully immerse in a language").
  `legends/FightSettings.jsx` = one collapsible row under a raid's / boss's / Legendary's intro: mode deck, learned
  language, "Ebi speaks", word hints, grammar feedback, strict accents, Learn it, answer style (typed vs choices first,
  raids and bosses). The values ARE the mode's studyRules (ONE setting with Study) through the generic
  `ctx.study.rules()` / `ctx.study.setRules(patch)` (`updateModeById`, live copy); shaping is `kit/fightSettings.js`
  (pure, tested). `fightCtx(ctx)` gives the fight a subject whose `userLang` is "Ebi speaks" ('' keeps the app
  language, as fights always did) plus `phrasing` (FULL IMMERSION when it equals the learned language; a general mode
  in another language keeps terms untranslated and grades understanding in any language), so EVERY fight prompt
  (questions, verdict/explain/recheck, taunts, Learn it, rule cards) follows without knowing. A change of learned
  language / Ebi speaks / dialect on the intro rewrites the questions (`generationKey`). Grammar feedback off: grammar
  outside the tested word does not make a strike glancing (Study's rule). Raid questions get Study's cue (parentheses
  + first letter, romanization initial for Han/kana; `ensureLetterCue` adds a skeleton when missing).
  **`ctx.words.tappable(text, source, sentence, opts)`** with `opts` ({ answers, glosses, lang }) = Study's question
  formatting for any text (muted "(...)" cues, the word-hint slot, answer words untappable), tappable when
  `tapAllowed` (a language mode, or text in a language other than the app's; `src/utils/tapTokens.js`, the ONE tap
  tokenizer: Intl.Segmenter for no-space scripts, per-character Han/kana fallback; tested in zh/ja/ko/ar/th).
  `answers` guards the LIVE question (`questionAnswersOf`: accepted + correct choice + alt's): a revealing lookup shows
  `lookup_wouldReveal`, never cached; pass [] once the answer shows. `ctx.words.canTap(lang)`, `ctx.words.glosses(text,
  { answers })` (Study's gloss prompt, readings for Han/kanji). QuizRunner uses them for the question, choices (a word
  tap never picks the tile), hint, answer, note and explanation, each with its own source; `startChoices(q)` opens a
  dual question on its choices ("⌨ Type it instead" switches back). Taunts, the raid debrief, Legends' all-answers list
  and the Learn-it panel (card, hooks, chat) are tappable too. General-mode lookups explain in the app language and
  offer no card or hook.
- **The boss is a fight** (`BossArena.jsx`): a dramatic entrance (`BossIntro`, timings in `ENTRANCE`: hazard stripes,
  the boss slams down, quake, shockwave, stamped title, lives popping in; static under reduced motion), then the boss
  above the questions with a health bar = right answers needed (`bossOdds`: `PASS.boss`) and LIVES = misses allowed
  + 1. No rule text: the hearts say it. `bossOutcome` ends the fight at 0 health (a win; stars count the answers given)
  or 0 lives (unasked questions count as missed: `finish(total)`); the test proves losing every life can never pass and
  emptying the bar always does. `applyNodeResult` still decides the pass.
- **Adding cards needs the MODE's deck** (`subject.modeDeck`, never the first-deck fallback `subject.deck`): a
  `DeckPicker` beside the add buttons saves it on the mode (`ctx.cards.setModeDeck` = `setAnkiDeck`;
  `ctx.cards.decks`).
- **Mount flags are SET on mount, not only cleared**
  (`useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])`): `main.jsx` runs
  React.StrictMode (mount, unmount, mount again). A flag only cleared on unmount, paired with a run-once guard
  (`opened`/`ran` refs), dropped the first (and only) answer: the Talk step sat on "Ebi is thinking" forever, and
  Help's auto-run map edit on "thinking". Never pair a one-shot guard with a cleanup-only flag.
- **`/features/` (feature data in the data folder) is GITIGNORED**: maps, saved questions, learner levels and the
  practice log are personal and were one `git add` away from a public push.
- **Cheat mode (hidden, for testing)**: 7 quick clicks on the map title (`CheatUI.jsx` `useCheatToggle`) flip
  `features.legends.cheats`; while on, ⚡ buttons complete/reset/unlock/regenerate areas and steps (`cheats.js`, pure,
  `cheats.test.js`), open locked steps (a win there records through `cheatCompleteNode`), set the level
  (`updateLearner(..., { quiet: true })`: no LEVEL_UP XP) and retake placement; "Win now"/"Fail now" in a step finish
  it through the NORMAL path (rewards included, to test them). Map cheats pay nothing. Settings > General shows its
  card (`CheatSettingsCard`) only while on. `ctx.prompt` (= `promptDialog`) exists for it.
- **Screens**: `LegendsScreen` orchestrates; `Questionnaire`, `PlacementExam` (NOT `Placement.jsx`: on Windows
  `./Placement` resolved to `placement.js`), `MapView` (areas bottom to top, steps as a winding ladder; centers the
  next step inside the screen's scroll box: `scrollIntoView` also scrolled the page root), `NodeRun` (learn/rule teach
  first; everything quiz-like through `QuizRunner`), `Talk`, `EditPanel` (kept/changed/added/removed review, Accept
  re-merges over the LIVE map).
  A mode switch keeps the previous screen (the SAME element objects, so nothing remounts or restarts) while the new
  map is read (`held`), showing `lg_loading` only after `HOLD_MS` (it flashed on every switch). A failed read shows the
  retry screen (it used to sit on "Loading" for good).
- **Shared-folder safety (a 2026-09 review)**: `updateMap` and `updateLearner` READ AGAIN before every write
  (`ensure(key, { fresh: true })`): computers on one share wrote the whole map or level from the copy they loaded hours
  earlier. The learner level is cached only after its write succeeds. A stored map this build cannot shape (newer
  `MAP_VERSION`, damaged) is a FAILED read, never "no map" (a new plan was written over it). `shapeMap` collapses areas
  a merge listed twice (`dedupeAreas`: the more finished copy, in the first place). Area detail lands only while the
  area keeps its title/theme (Change my map can repurpose the id mid-call).
- **One-time rewards live OUTSIDE the map** (`claimReward(modeId, rewardKeyFor(kind, title))`, store key
  `rewards-<mode>`): the placement XP and each boss's first win (by island title) are paid once per mode, even after
  Start over (it writes a null map). Failed tries and Blitz pay `legendsTry` (5 XP, `LEGENDS_TRY_XP_CAP` 6 a day).
- **Guards**: `finishingRef` (a double "See the result" recorded and paid twice), `modeIdRef` (a result finishing
  after a mode switch shows nothing), Help's map edit waits in `pendingEdit` until a map exists and no
  step/exam/fight/raid runs (`BUSY_VIEWS`), a raid left by navigation saves on unmount, card XP goes only to cards Anki
  recorded, one hint scroll per question, Blitz claims answers and the finish with refs, QuizRunner ignores a judge
  reply after ✕ (`exited`), `itemIdFor` needs 3+ characters for a partial match, `addItemsToDeck` remembers this
  session's adds (`addedNow`) when the map save fails.
- **Cards only on a click** (`deck.js`, `ctx.cards.addNew`, tags `ebiki legends lg-<area>`); a beaten boss offers the
  whole area.
- **Rewards** (game): PRACTICE_DONE `legends` (quest counter, paid through `LEGENDS_STEP`: 20 XP + 5 per area up the
  map, cap 6), `legends-try` (generic practice XP), `legends-placement` (placement XP); `BOSS_BEATEN` (first win of an
  area only) = 50 XP + a streak freeze (`bossWins` counter, `computeStreak`, still capped at `MAX_FREEZES`);
  `LEVEL_UP` = 10 XP per new whole level (cap 3 per event).
- **Fights are strikes** (`fight.js`, pure, `fight.test.js`; boss, Legendary and raids). A typed answer is judged by
  `judgeStrike` (kit/judge.js): CLEAN (the tested thing and everything else right) deals 2, GLANCING (tested thing
  right, something else wrong) deals 1 and its other slip comes back as an attack, a MISS costs a life. A choice (the
  typed question's `alt`, "🛡 Show choices", phase 1 only) is a SAFE strike of 1. Every 3rd clean strike in a row is a
  critical (+1); items the boss is weak to (`weakTo`: rule items first) deal +1. A missed question returns
  `ATTACK_GAP` questions later as the boss's ATTACK (telegraphed banner; blocked = counter 1, missed = 2 lives; at
  most `MAX_ATTACKS`, never from an attack). The boss enrages at half health (no more choices). A shield (helper)
  absorbs one life. The OUTCOME decides the pass (`fightStars`): questions running out with lives left is a win.
  Boss/Legendary questions are generated DUAL (`sanitizeQuestions(..., {dual})`: typed with `alt` choices).
- **Fight grading is FAST, then looked at again** (boss, Legendary, raids; `kit/fightJudge.js` pure + tested,
  `kit/judge.js`, `FightExtras.jsx` `useFightCheck`). The decisions (who is re-checked, when an appeal may start,
  debrief rows, question resolution, Learn-it items) are `fightCheck.js` (pure, tested); the refund is ONE path,
  `refundRunningFight` (fight.js). **Off switches, one place**: `FIGHT_EXTRAS` in `fightCheck.js` (`recheck`,
  `refund`, `appeal`, `learnIt`, `debrief`, `taunts`); taunts also follow the user setting via `fightExtrasFor`. Any subject: prompts branch on `isLanguage`, never assume it.
  - A. `judgeStrike` blocks only on a VERDICT call (`{target, all, accentsOnly}`, `VERDICT_MAX_TOKENS` 120), so
    damage and hearts land at once; `later` (background) brings the note (QuizRunner fills it into the SAME answer's
    feedback, `verdictSeq`) and a glancing slip's "fix". That attack goes in as a `_pending` placeholder and the run
    skips it when the text is not there in time (QuizRunner `resolveQuestion`: a question, a replacement or null).
    Local exact/accent matches and choices stay instant; a failed verdict call is still 'error' (ask again).
  - B. Every AI miss/glancing gets a careful background `recheckStrike` (synonyms, variants, harmless typos). It only
    RAISES a verdict. Overturned: "Ebi checked again: you were right!" (`FightNotice`), and while the fight runs
    `refundFor` + `applyRefund` (fight.js, `refund.test.js`) give back the hearts it cost (`strikeCost`) and deal what
    it should have dealt; `last.kind: 'refund'` (own counter `refundN`) plays a sweat drop and the heart flying back,
    never a hit or lunge (skipped in focus mode / Still bosses). Its attack is cancelled (`_attackOf`). An ability's
    own state is not rewound. A decided fight is never refunded: a later win fixes only the grade/tally (`afterFight`).
    Raids: the reviews are recorded at the end as before, after `fc.settle()` (re-checks and appeals, `SETTLE_MS` cap);
    an overturn changes the card's first answer before that, or `srs.correctRating` once per card after.
    Legends: NodeRun's finish waits the same way, so `items[].grade` is already corrected.
  - C. **Appeal** (`MissTools`, on every miss/glancing with an answer): an optional reason, the same careful judge
    with it, one per answer (a failed check may retry), disabled while the re-check runs; shows the judge's `why`
    either way; a win refunds exactly like B.
  - D. **📖 Learn it** mid fight (the fight has no timers; the modal carries `data-top-overlay` so the quiz ignores
    keys): `kit/LearnItPanel.jsx` = the card back (raid card / the Legends item's taught text), a memory hook from the
    app's ONE engine (`ctx.learn.makeHook`, saved like every surface; `ctx.learn.savedHooks`) and a short chat
    (`kit/learnIt.js`). Records no review.
  - E. **Debrief "What tripped you up"**: raids after the aftermath on the result (`Debrief`); Legends inside the
    result's `AllAnswers` (opens itself when a fight had misses; rows carry the entry's note, second look and appeal).
    Buttons: Learn it, Make a rule card, Appeal (after the fight a win fixes the Anki grade or `regradeItem`, map.js,
    never the outcome).
  - F. **Boss taunts** on a miss (setting `features.legends.taunts`, default on, off in focus mode, Settings >
    General > Legends): `kit/taunt.js` (pure: prompt, `parseTaunt`, the overlap check `sharesPhrase`, `islandVoice`
    for Legends bosses) + `kit/tauntStore.js` (role `help` = cheap tier; each boss's last `RECENT_MAX` 12 lines kept
    per device in `platform.kv` and sent as "never repeat"; a reply sharing a 3+ word phrase (4 characters in CJK) with
    them or the sample is retried once, then NOTHING is shown; the persona's sample is the fallback only when the model
    could not answer, at most once per fight). Raid voices are `RAID_VOICES` (raidVoices.js), Legends bosses
    `islandVoice` + `RAID_VOICE_RULES`/`STOCK_WORDS`. `TauntBubble` under the arena; a line arriving after the next
    question appeared is dropped; Help hears it (`boss-taunt` entry).
- **Accent grading is ONE setting** with Study's accent drill (`studyRules.accentDrill`; `subject.accents`,
  `subject.strictAccents`, `subject.setStrictAccents`), offered only for languages that write accents. Relaxed: an
  accent slip counts clean unless it makes another word or form (`accentChangesWord`).
- **XP rewards effort**: `LEGENDS_STEP` carries `effort` (`effortOf`: clean strikes most, choices least) and `replays`
  (each replay of a cleared step pays less, `replayFactor`); `legendsXp` in game/engine.js.
- **Codex** (`Extras.jsx`, `itemTier`/`areaCodex` in map.js): an AREA's items only (Study and raids are the whole
  deck): new → bronze → silver → gold (gold needs a Good-or-better answer in a fight); tiers are computed, so gold fades.
  Every Legends answer is graded by the shared rule (NodeRun `record`: `gradeFromStrike` in fights, `gradeAnswer`
  elsewhere; a hint scroll = `hintUsed`) and sent as `items[].grade`: Again = a miss, Hard counts right but not toward
  gold (`bossRight` counts Good+ only), Good/Easy right. Results without `grade` (cheats, blitz) count by `correct`.
  `tallyStudiedCard` takes Study's `grade` from `CARD_GRADED` (anything but Again counts right). One
  constellation per level. **Gold blitz**: timed local recall of gold items (no AI), fed back into the tallies.
- **Area extras** from the area-detail prompt (`parseAreaExtras`): `story` (opening story at the learner's level,
  tappable; open until "Got it", `storySeen`), `canDo` (the **passport**: stamped when the area is cleared), `bonus`
  (the **chest** of a cleared area: one right recall opens it, `chestOpened`; its phrase can go to the deck). Areas
  detailed before this have none. One optional **Adventure** step per area (`goal`: an open mission in the Talk
  screen; Ebi ends a reply with `GOAL_TAG` when reached; `ADVENTURE_TURNS`).
- **Helpers** (`map.helpers`, at most `HELPERS_MAX`): a first flawless level earns a 📜 hint scroll (first letters on a
  typed question), a first flawless Weak spots a 🛡 shield (taken into the next boss fight). Never bought.
- **Nemesis rematch**: a lost boss fight stores its missed items (`area.nemesis`); the next boss prompt asks
  `NEMESIS_SHARE` % of questions about them, the rest the whole area; a win clears it.
- **Journey heatmap** (`map.days`, `logDay`, map header). **First-miss nudge**: the result screen offers items missed
  for the FIRST time (`missNudged`, not in the deck) as cards once; off in Settings > General > Legends.
- **Focus mode** (`features.legends.focus`, asked in the questionnaire's style step, Settings card
  `SettingsCard.jsx`): no entrance cinematic (`BossIntro calm`), floaters or combo flair; same rules.
- **Boss motion switches** (art.jsx): the system's reduce-motion (Windows "Animation effects" off) stills every
  drawing, which looked like "no boss animates". **Always animate the art** (`features.legends.motion`) overrides it;
  **Still bosses** (`features.legends.still`, the owner: a learner who wants the fight without distraction) stills
  every boss and raid boss, the card entrance, shake, flash and ability effects, and wins over `motion`. It must stay
  OBVIOUS: `MotionToggle` (BossArena.jsx) under Fight on the intro card and in the arena header, plus Settings >
  General > Legends. The asset view (`ArtMotion` context) always animates and hides the toggle. Read them through
  `useArtMotionAlways` / `useArtStill`, never the settings directly.
- **Raids** (`raid.js` pure + `raid.test.js`, `RaidRun.jsx`; Practice tile and the map header): today's DUE cards in
  Anki's order (`raidOrder`, one per note, `RAID.maxCards`), one dual question per card (`buildRaidPrompt`). Health
  from the cards due (`raidHp`), 3 lives, THREE phases. Every card's FIRST answer is recorded as a real review
  (`raidRating`: the shared one-answer rule, see Study modes > "Grading (shared)": miss Again, glancing Hard, clean Good,
  clean typed on a mature card (pre-review interval >= 21 days, `preRef`) Easy, a choice at most Good) through `kit/reviews.js` `recordReviews` (guards per run), win, lose or
  quit; `CARD_GRADED` per card. The boss keeps its wounds for the day (`applyRaidAttempt`); a win adds a trophy (raid
  hall), `BOSS_BEATEN {raid: true}` (XP + a freeze) and brings out the next boss (`RAID_MOTIFS`).
  The review list is ONE function, `raidReviews` (no boss, no test flag); `raidAttemptOutcome` decides the state write; trophy, freeze and `BOSS_BEATEN` pay only after the raid state really saved, practice XP only for answers Anki recorded. `srs.recordRatings`/`correctRating` are serialized app-wide (src/cards/index.js): Study sync, raids and Ebi Call never drive the reviewer at once. **Test fight** (asset view, cheat mode, `RaidRun test={{ motif }}`): the SAME raid and the SAME grading (real Anki reviews, XP, level), only the stored raid state (wounds, trophy, rotation, BOSS_BEATEN) is never read or written. Help gets a live raid line (`raidHelpText`). **The progression is `RAID_ORDER`** (raid.js, the ONE place: chronos first, void last; `RAID_MOTIFS` = it; `raidBossNumber` = 1-based place, shown in the asset view and as "#N" in Boss families): a new raid starts at its first boss, a win brings out the next (wrapping, `nextBossIndex`), an existing player continues from their boss's place. **The stored `boss` stays an index into the APPEND-ONLY `RAID_ROSTER`** (never renumbered; older builds on a share read the same
  indices): a removed boss is RETIRED (`RAID_RETIRED`, skipped by `activeBossIndex`; a stored retired boss moves to
  the next one, keeping the day's wounds, not its ability state), never deleted from the roster; its old trophies stay
  and the raid hall draws them as a plain cup (`isRaidMotif`, `lg_raidRetired`). Retired: the Glutton (2026-10, the
  owner disliked the concept; do not recreate it). Raid art: `public/assets/legends/raids/<motif>.svg` with phase
  layers `lg-p2`/`lg-p3` (start `style="display:none"`), `lg-p1` (phase 1 only) and `lg-p12` (gone in phase 3),
  switched by the arena's `data-phase` (BossArena CSS).
  **Photo ophanim (experiment, ophanim only)**: `withPhotoEye` (art.jsx PHOTO LAYERS) fills the file's empty
  `lg-photo-*` groups (eye, wings, wheel halves, clouds, light) with the app's fixed sprites
  `raids/ophanim-{eye,wings,rings,cloud,light}.webp` after sanitizing (the file holds no URL); painted parts it
  replaces are `lg-photo-hide`. The great eye's gaze loops (P2 only, P3 slow stare; P1 keeps a still copy) and the
  cloud shadow are plain SVG in the file. Its sky and light are HTML layers (art.jsx PHOTO LIGHT: real
  `mix-blend-mode: screen` + `blur`, isolated box, ophanim only); the painted backdrop is `lg-photo-hide`. The great
  eye is MASKED to an almond (thin lid rims, no plate or bezel: the owner rejected one; P1 half-closed and opening
  during beam/grace, P2 open, P3 widest with gold light), plain SVG in the file. Revert = delete both blocks + their
  uses (loadArt call, `photo` in LegendsArt) + the five webps, restore `ophanim.svg` from the painted backup
  (ophanim-backup-before-photo-eye).
  **The twenty-six raid bosses are the plan in `docs/raid-bosses-plan.md`** (the owner found the first set "boring,
  uninspired and weak"): each fills its frame, has a backdrop that is part of it, and every phase is a TRANSFORMATION
  (armor breaks, heads regrow, a wraith looms), not a sticker. They were generated by scripts kept outside the repo;
  edit the SVGs directly now. **Every raid boss has lore and a voice**, shown in the asset view's Raid bosses tab:
  `lg_raidLore_<motif>` (2 to 4 sentences, all four locales) and a `RAID_VOICES` entry in `raidVoices.js` (English
  persona prompt + sample line, used by the boss taunts, F above). A new raid boss needs both
  (`raidLore.test.js`). Each has its own card entrance in `ENTRANCES` (hydra `lgHydraRise`, titan `lgPowerUp`, lich
  `lgLevitate`, chimera `lgTripleRoar`, void `lgRealityTear`, seraph `lgHolyUnfold`, leviathan `lgAbyssBreach`,
  inferno `lgFlareBurst`, chronos `lgTimeReverse`, vampire `lgBatAssemble`, tempest `lgBoltDrop`, kaleido
  `lgShardFocus`, puppeteer `lgStringDrop`, berserker `lgWarCharge`, swarmqueen `lgHiveRumble`, gorgon
  `lgSerpentRear`, banshee `lgWailPulse`, reaper `lgScytheSwoop`, dreamer `lgEldritchUnfold`, moonmaw `lgMoonrise`,
  kitsune `lgPetalFall`, ophanim `lgGyroAlign`, ratking `lgCoinToss`, sugarqueen `lgSugarDrop`, showman
  `lgCurtainPart`, cerberus `lgHoundPace`; a test keeps all Legends + raid entrance names distinct). A phase change in the arena
  (`usePhaseShift`, rises only) flashes and shakes the boss (`lgPhaseShift`) and fades a small "PHASE N" tag in UNDER
  the boss (`lgPhaseTag`; a stamp over the boss hid the change itself); focus mode skips it. Each phase should also
  change the boss's FACE (lich: calm, furious brows, screaming; titan: sealed visor, molten snarl, split skull). Phase
  layers never add flat colored blobs behind the boss (they read as stains).
- **Raid abilities (v2.1)** (owner's rule: they change how the FIGHT plays, never how a question is asked: no timers,
  nothing hidden, a right answer never marked wrong). ONE module per boss, `abilities/<motif>.js` (hooks contract in
  `abilities/_contract.js`, shared limits in `_rules.js`; `RAID_ABILITY` in `raid.js` and `ABILITIES` in `fight.js`
  are built from the modules), each with its own tests, plus `fairness.test.js` (F1 to F4, hint diet: a hint is at
  most 8 English words, a tag chip at most 3), `balance.test.js` (`_sim.js`) and `hooks.test.js`:
  hydra `heads` (right answers and blocked attacks cut heads; the 3rd cut burns for +2 and three regrow; a missed raid
  answer grows 2, max 6), titan `plates` (clean typed answers crack 2 plates; both broken = +2, then he stays exposed
  for the next 3 right answers (+1 each) and forges new plates; a phase line re-forges only cracked plates, never
  during an opening), lich `minions` (every 3 answers raises an earlier right card as an
  extra typed question: destroyed = 3, escaped = he heals 2, no heart lost; max 3), chimera `threeheads` (decision:
  three head bars, Goat first in line, then Lion, Serpent, auto-aimed or tap to aim; the Goat's horn blocks the next
  lost heart and regrows at each phase line; a wound that fells no head fires `maul`; overkill spills; a fallen head deals +1 and gives its
  power), void `horizon` (right answers bank in a disk, the 3rd collapses it for 1.5x, a miss spills it at 1x), seraph
  `verdicts` (questions cycle Wrath / Mercy / none as a tag chip: Wrath right +2, a Mercy miss costs no heart, Mercy
  right +1), leviathan `current` (current 0 to 3: right +1, miss -2, phase lines leave it alone; on the crest every right answer
  +1), inferno
  `vent` (decision: heat builds on right answers, a Vent button deals heat - 1 ("Big Vent!" floater
  `lg_fx_ventBlast` for a big one), at 4 it erupts for 3), chronos `loop`
  (sand: a miss with sand costs no heart and loops the card 2 questions later; a full glass = Time Stop, the next
  right answer doubles), vampire `wards` (3 right in a row raise a ward, max 1, that takes one lost heart and bursts
  for +2; a ward held at the next streak is Feast +3), tempest `drums` (measures of 4: right answers on beats 1 to 3 light drums,
  beat 4 deals 1 per lit drum), kaleido `prism` (each question shows a color chip; collecting red, green and blue +2),
  puppeteer `puppets` (every 4th right answer steals a puppet, max 2, each kicking for 1 per answer; a miss yanks one
  back), berserker `allin` (decision: arm on a typed question, right +3, wrong one extra heart but never the last; the
  axe rests 3 answers), swarmqueen `wildfire` (right answers light 2 of 6 comb cells, a miss douses one; all 6 = +2),
  gorgon `mirror` (every 4th question, 3rd in phase 3, is her gaze as a tag chip: right typed +3, choice +2), banshee
  `scream` (she screams at each phase line and after a miss; the next right answer silences her for +2), reaper
  `execute` (a scythe line climbs on right answers; a right answer that leaves him under it drops him to the phase
  floor), dreamer `sleep` (asleep, the 4th right answer is a Nightmare +3; a miss wakes him, two rights sing a Lullaby
  +2), moonmaw `moons` (every 3rd clean typed answer flings a moon that crashes 2 answers later for 2), kitsune
  `rally` (4 right in a row = Starfall +3; a miss resets), ophanim `grace` (right answers light eyes, a miss darkens
  one; all lit = a heart back once per phase, else a Holy Beam), ratking `hoard` (decision: coins from right answers
  buy a Lucky Tail (2) or a Cheese Bomb (3); at 5 the rats throw a bomb), sugarqueen `sugarrush` (3 right fill the jar, the next
  2 answers +2; a miss crashes it), showman `encore` (Comedy and Tragedy: right answers win applause, the 4th = Encore
  +3; every 2nd miss is a Plot Twist that sets applause one short of an Encore; masks on his arch show it), cerberus `shackles` (each head is chained by its own deed: Fire any right answer, Iron a clean typed answer, Shadow the first right answer after a miss or a blocked attack; all three chained = Bound +4, then they tear free; a miss frees the Fire head).
  **Every effect is reachable and documented**: `abilities/_triggers.js` holds each effect's numbers (from the
  module constants) and whether it is a button; `lg_fxWhen_<motif>_<fx>` (what the player does) and
  `lg_fxDoes_<motif>_<fx>` (what happens) in four locales feed the asset view's bestiary card (rows from `bestiaryRows`, pure; "How it works", one
  row per effect with Try it). `triggers.test.js` plays each trigger line through fight.js and checks the effect fires
  (and not one step short); `reachability.test.js` (seeded `_sim`) fails an effect seen in under 25% of typical
  raids (8 to 12 due cards, 75% right; button effects: 40% under one button habit). `REACH=1` prints the table.
  **Decision cap**: only `decision: true` modules show buttons (`DECISION_MAX` 5, now chimera, inferno, berserker,
  ratking), enforced in RaidRun, `_sim` and `raidStep`; never on attacks or inserted questions. Inserted questions
  (minions, loops, last stands) share `MAX_INSERTED` (4) per attempt. Shown on the intro (`BossIntro ability`), as an
  arena chip, HUD items (`fx/_Hud.jsx`), tag chips, floaters (`last.fx`) and a short hint when it matters NOW.
  **Aftermath review**: when the fight ends, win or lose, every picked card never asked is asked typed with no fight
  math (`RaidRun`, `lg_aftermath*`; "Finish later" leaves the rest due), so a raid never costs a due card its review.
  Anki still gets only each card's FIRST answer (inserted and attack answers are never recorded). The asset view's raid
  tab opens each boss with a big ABILITY card and a live arena with "Next phase". **Every fx key has its own EFFECT and
  juice** (`fx/<motif>.jsx`: `effects`, `floaters`, a `juice` map
  `{size: tick|medium|big, shake, flash, hitstop, sfx}` read by `BossArena.useJuice` through `fx/_juice.js`, and
  `.lgr-<motif>-<key>` body reactions, phase-qualified allowed), with FIXED bright colors, skipped in focus mode, Still
  bosses and reduced motion; a new question fades what is still playing, a new strike cancels the old one, at most 2
  flashes a second. `abilityfx.test.js` fails when a fired `fx` has no effect, no floater text or no asset-view
  button. Art layers the modules drive (faces per phase, state layers) are still to draw.
  **How the owner wants raid bosses made** (detail, true-form phase 3, the signature kept through every phase, the
  ability in the art): `docs/legends-art-guide.md`, read it first.
- **Asset view** (cheat mode only: `AssetView.jsx`, map header ⚡ button, and its own sidebar entry `assets` through
  `AssetScreen.jsx`; a feature `navItems` entry may carry `visible({ registry, featureSettings })`): three tabs,
  **Legends** (the 40 stages: entrance, boss sizes, banners), **Raid bosses** (entrance, phases 1 to 3 through the
  arena's own phase CSS, fight sizes) and **Ebi drafts** (`public/assets/ebi-drafts/`, nothing else reads them; the
  CURRENT Ebi from `SHRIMP` comes first at the same sizes, so all compare on one screen); every palette; ← and → step
  through the list. **File names are shown ONLY there** (and in the dev gallery): `ArtLabels` (art.jsx) puts a tag
  UNDER each drawing of 100px or more, never on it and never in gameplay, cheat mode or not (the owner: "solely for
  viewing assets in the asset viewer").
- **Art loads near the screen and pauses off it** (art.jsx `useArtInView`, `ART_NEAR`): a drawing is fetched and
  sanitized only within 400px of the viewport, files are sanitized one per task (`sanitizeQueue`), and an off-screen
  drawing's SMIL is paused (`pauseAnimations`). The asset view mounted ~37 raid bosses (~3000 shapes, hundreds of
  animations each) at once and lagged the owner's computer. The dev gallery sets `window.__ebikiArtEager = true`
  (check-art measures every drawing at fixed moments); keep that line.
- **Boss figures breathe past their frame** (art.jsx `BOSS_HEADROOM` 20%): a boss or raid boss SVG renders
  `overflow="visible"` and its box clips at `inset(-20%)`, so a flame, wing or aura growing past the 120 x 120 viewBox
  is not sliced flat (a flame looked boxy, as if behind glass). **That headroom is real LAYOUT space wherever something
  sits next to a figure** (`room` prop / `headroomPx(size)`: the asset view and gallery always, the intro card, the
  fight arena, result screens, the raid hall): tags, captions, titles, stripes and the next drawing were drawn over
  (the owner: "make sure asset names and anything else don't collide with the svgs"). Parts hidden by a far off-canvas
  translate (200) stay hidden. Banners are pictures and clip at their own edge; keep their animated parts inside it.
- **Run `node dev/legends-gallery/check-art.mjs` (dev server up) before committing ANY art change.** It FAILS on a
  boss part moving past frame + headroom, and on an idle scale/skew whose part slides instead of pulsing in place; it
  WARNS on banner parts cut mid-motion. Travellers (a bat crossing the frame) and deliberate collapses (a lightning
  flash, a tongue flick) are allowed. It also WARNS on OVERDRAW: a decorative stroke (strata, cracks, seams,
  scratches, finger lines) must END inside the fill of the shape it decorates, never past its outline (it reads as
  drawing past the lines: the frontier mesas' strata started outside their slanted edge). Lines meant to leave a shape
  (branches, legs, reeds, fur tufts) go in its `REVIEWED` list only after looking. Write edit scripts that hold regex
  backslashes with the Write tool: a heredoc turned `\b` into a raw backspace and `\s` into `s` (both passed a syntax
  check).
- **SVG pivots**: a scale or rotate pivots on the element's local (0,0). A part drawn elsewhere needs
  `style="transform-box:fill-box;transform-origin:center"` (the sanitizer keeps it) or it slides across the picture (a
  2026-09 sweep fixed 19). A looping translate that ends away from its start snaps back: particles get a sibling
  additive scale `0;1;1;0`, drifters run there and back. Reduced motion and focus mode never force `opacity` on SVG (it
  turned every shadow and glow solid). Flames pivot at `center bottom`, drips at `center top`. Skews pivot too (a
  skewY on a door drawn at x=130 moved it 18 units up and down): flags on the pole side, capes, sails and hanging
  banners at the top, plants at the base. Check with a measured centre drift, not a pivot-distance threshold (the
  skull flame sat just under one).
  More rules from the second sweep (`.scratch`-style checks: lint, measured pivots, followers): an ENTRANCE must END
  at the file's own pose (the arena strips `lg-in`: a jaw left open snapped shut, rubble jumped back into the hole,
  the dream eyelids closed again), so a part ending elsewhere is wrapped in `<g transform="<end pose>">` with the
  values shifted; two NON-additive animateTransforms on one element override each other (the idle loop killed the
  entrance): the loop gets `additive="sum"`; a part copying another part's idle loop (claws on a wing) must copy its
  entrance too; "hide" by an off-canvas jump is instant (step keyTimes), never a slide back across the scene.
- **Help** can open a map edit: `legends_edit` action (capability text only when `appContext.legendsAvailable`),
  receipts `hr_legends*`, opened through `featureCtx.open('legends', { edit })` (`useIntent`).
- Drive it with every AI host stubbed and `/api/feature-data` in memory (the real stores and credits untouched).
## Porting to phones (iOS / Android): keep these seams clean
Two paths: **Capacitor** (web UI as-is in a phone WebView) or **React Native** (UI rebuilt, logic reused). Both
need:
- **`src/platform/` is the ONLY door to the device and the local server** (incl. `platform.history`, the Back/Forward device): `apiFetch(path, init)` for every
  `/api` call (a phone build installs an on-device router answering the same paths), `platform.beacon`,
  `platform.kv` (localStorage here), `platform.onPageHide`, `platform.isHidden`, `platform.speech`,
  `platform.randomId`. `setPlatform({...})` overrides any part (nested objects merge). **Never write
  `fetch('/api…')` or `sendBeacon('/api…')` anywhere** (enforced by `src/platform/platform.test.js`).
- **Feature logic is platform-neutral**: plain `.js` in `src/features/**` may not touch `window`, `document`,
  `localStorage`, `sessionStorage`, `navigator`, or `fetch` except to an outside `https://` service (enforced).
  UI in `.jsx`; browser-only helpers in a file named `web.js` (e.g. `voice/web.js`); desktop server halves in
  `server.js`. Pure engines (`game/engine.js`, `kit/grade.js`, `mistake-gym/mistakes.js`, `ebi-call/grades.js`,
  `leech-doctor/leeches.js`, every `prompt.js`) port unchanged, tests included. The same scan covers the app-level
  modules feature logic imports (`config/grading.js`, `cards`, `i18n`...) and the pure study rules
  (`utils/studyDepth.js`, `config/study.js`).
- **Cards**: `src/cards/` already abstracts Anki. Phones have no AnkiConnect: Android can use AnkiDroid's content
  API, iOS needs Ebiki's own backend (`src/cards/template.js`). `hasCapability('setup')` hides the Anki
  install/diagnosis UI for backends without it.
- **Features are chosen per platform** by the list in `src/features/index.js`: a phone build can drop `voice` (the
  OS keyboard has a dictation mic) without touching anything else.
- **The routes an on-device router must answer** (data): `config`, `modes`, `modes/knowledge`,
  `knowledge-sections`, `ankiformat`, `deck-progress`, `discover-store`, `question-bank`, `chats`, `chat-load`,
  `keys`, `players`, `player-local`, `feature-data`, `usage`, `log`, `web-search` (needs a CORS-free fetch), `tts`,
  `anki` (only with an AnkiConnect-like backend). **Desktop-only** (answer "not available"): `alive`, `bye`,
  `datadir`, `offline`, `sync-backup`, `update`, `launchmode`, `launch-overlay`, `overlay-hide`,
  `overlay-screenshot`, `ankiconnect`, `anki-focus`, `anki-start`. Keep this list current when adding a route.
- Desktop-only by nature: Electron (`electron/`), the launcher scripts, the Alt+Q screen overlay, the Windows Anki
  updater. All AI goes straight to the providers (`src/config/providers.js`), which works on phones as is.

## Card backend: Anki is swappable (`src/cards/`)
App code talks to the card store ONLY through `srs.*` from `src/cards` (the facade). Anki is one backend
(`src/cards/anki`, AnkiConnect via `/api/anki`); `src/cards/contract.js` is the interface (every method, the
Note/Card/DeckStats/Query shapes, the at-most-once rules), `src/cards/template.js` a starting point. Swap with
`registerBackend(b)` + `selectBackend(id)`. Tests: `src/cards/cards.test.js`.
- **Never import `src/cards/anki` from app code, and never write Anki search syntax outside it.** Queries are
  structured (`{ deck, noteId, cardId, text, ignoreAccents, state: 'due'|'new'|'dueOrNew', excludeSuspended,
  excludeBuried }`); `compileQuery` turns them into the exact strings the app always sent (tested). Empty = error.
- **Rating writes are backend-owned**: `recordRatings({deck, ratings, preSchedule, hooks})` and
  `correctRating({cardId, ease, preSchedule})`. The reviewer dance, `setDueDate` "!" and revlog tuples live in the
  adapter; App keeps its guards (`studySyncedIdsRef`, `uncertainSyncRef`, `preSyncInfoRef`) and passes them as
  hooks (`recorded` = `markSynced`, `markUncertain`/`clearUncertain`, `uncertainSince`/`forgetUncertain`,
  `notOurs`). `oneStepInterval` (contract.js) is the shared SM-2 step.
- **Optional abilities are capabilities** (`cloudSync`, `files`, `setup`; `hasCapability`). A missing one falls
  back to a harmless default in the facade (`readFile`/`storeFile` THROW so blob readers fall back to local).
  `renderAnkiOfflineBanner` shows its Anki diagnosis and Open Anki only with `setup`; else `cardStoreOffline` +
  Refresh. The `/api/anki*` routes are the Anki backend's server half.
- Card content safety (`sanitizeCardHtml`, `escapeStrayLt`, `isHtmlTagName`) is backend-agnostic
  (`src/cards/html.js`).
- Still Anki-named, deliberately: state (`ankiConnected`, `ankiDeck`, `activeMode.ankiDeck`), i18n text, the
  AnkiWeb banner. Function names elsewhere in this file (`ankiAddNote`, `ankiSetNoteTags`, …) are the Anki
  adapter's internals behind `srs.addNote`, `srs.setNoteTags`, ….
- **Enforced** (`cards.test.js` "Anki stays behind the facade"): outside `src/cards/anki`, `src/cards/index.js` and
  `server.js` files, no code line imports the adapter, calls `/api/anki*` (`/api/ankiformat` is Ebiki's own data
  file), writes Anki search syntax (`deck:`, `cid:`, `is:due`...), names an AnkiConnect action (`gui*`,
  `setDueDate`, `storeMediaFile`...) or uses its media naming. Also in the contract now: error codes
  (`STORE_DOWN_CODES`, `CHANGE_MAYBE_APPLIED` = a write that may still land; `isStoreDown`), the blob file names
  (`blobFileName`/`legacyBlobFileName`, capability `files`; Anki's are `_ebiki_<kind>__<key>.json` /
  `_screenlens/...`), and the field format (HTML, audio as `[sound:<file>]`).
- **A replacement backend implements exactly**: (1) a backend object (`src/cards/<id>/index.js`, start from
  `template.js`) with every `REQUIRED_METHODS` entry and the optional methods of the capabilities it declares;
  (2) `registerBackend` + `selectBackend` in `src/cards/index.js` (replacing the Anki lines); (3) a server half only
  if it needs a local service. Nothing else changes. Anki-only and harmless to leave or delete: the `/api/anki*`
  routes in `vite.config.js`, `scripts/*anki*` (install, start, update, toast demoter), the setup diagnosis UI (shown
  only with `setup`), the AnkiWeb banner (only with `cloudSync`) and Help's one prompt line about AnkiConnect.

## Study → Anki sync
### Driving Anki's real reviewer (`doSyncRatings` → `srs.recordRatings`, in `src/cards/anki`)
Not `answerCards` (throws "not at top of queue" for out-of-order or new cards). Instead `ankiGuiDeckReview(deck)` →
loop `ankiGuiCurrentCard()` → `ankiGuiShowAnswer()` → `ankiGuiAnswerCard(ease)`, matched by `cardId`. Anki
computes the interval. `guiCurrentCard().buttons` is an ARRAY of valid eases: cap to `Math.max(...buttons)`.
`ankiGuiDeckBrowser()` returns Anki to the deck list. Syncs are serialized (`syncChainRef`); each card is answered
EXACTLY ONCE with its FINAL rating.
**Integrity guarantees** (duplicates once compounded 1d → 3.3y):
1. `studySyncedIdsRef` (only `markSynced` writes; only session start/exit clears) filters every sync. The `synced`
   flags are UI-only and can be clobbered; never rely on them.
2. A card the reviewer never presented: ask Anki first (`cid:X (is:due OR is:new)`); not due → already recorded,
   `markSynced` + skip. A card skipped as not-due loses its `preSyncInfoRef` entry (a later correction would add a
   review to it).
3. Unreachable card fallback: NEW → `setDueDate <days>!` + `insertReviews`. REVIEW → a bare `setDueDate "0"` nudge
   (no `!`, interval preserved) and answer via the real reviewer. If still blocked (an unrelated due card ahead,
   daily limit), record a **one-step SM-2 interval from the card's own `interval × factor`** (`ankiCardsInfo`;
   Easy +30%, Hard ×1.2, Again 0) via `setDueDate <newIvl>!` + `insertReviews`. At most once per card per session.
**A reviewer answer call that THROWS is not retried by the fallback in that run** (`uncertain` → `failed`): Anki may
have recorded it, and a fresh learning card still reads as due. Same rule for the fallback's `answerCards` (any
throw but "not at top of queue") and the nudge's reviewer answer.
   Every answer call is marked uncertain BEFORE it is sent (`markUncertain(id, Date.now())`) and cleared on a definite
   outcome (`markSynced` deletes it; a clean refusal calls `clearUncertain`): a page closed mid-call left Anki's
   recorded answer invisible to the restored session. `uncertainSyncRef` is saved in the session snapshot
   (`uncertainSync`), written at once by `markUncertain` → `persistSyncGuards` (like `markSynced`).
   The uncertain-answer re-check counts only real answers (`ease >= 1`): the nudge's setDueDate writes a button-0 row.
   A card it finds recorded is locked with ANKI's grade (the row's ease). Re-rate, Back, `rateGradedCard` and the
   feedback chat's re-grade (`fbr_ankiPending`) refuse a card in `uncertainSyncRef`; `rateGradedCard` also refuses
   cards in `syncInFlightIdsRef`.
An EXPIRED snapshot with unsynced ratings reopens on its summary instead of being dropped. A correction loops on
`syncChainRef` until it stops growing and `syncInFlightIdsRef` lacks the card. Finish uses `syncGradedNow`. A
second overturn of an already corrected card keeps Anki's grade (`fbr_alreadyCorrected`). A failed run backs the
auto-sync off 60s (`lastSyncFailAtRef`, re-armed via `studyPullTick`).
**The `!` suffix is REQUIRED on recording paths** (it sets the interval, not just the due date); the `"0"` nudge
deliberately omits it.

**The computed-interval fallback and post-lock corrections step from `preSyncInfoRef`** (the pre-review schedule,
also saved in the session snapshot as `preSyncInfo`); with no schedule at all the fallback THROWS (retry later),
never assumes interval 1. End Now marks unfinished cards `skipped`, never an unsyncable Again.

**Stats count ANSWERS**: "Cards Today" comes from `ankiGetTodayReviewStats` (button ≥ 1; the chart keeps Anki's own
per-day counts, which follow its rollover hour). It returns the `day` it measured (a read across midnight is
dropped) and null when any deck read fails (last-known numbers stay). A post-lock correction's inserted row is
recorded (`markCorrectionReview`, localStorage) and REPLACES that card's earlier outcome there instead of adding a
review. Session history accuracy skips `relearn` copies. `statFix` after a sync skips `noSync` copies; Help's
`recentSessions` are the NEWEST (history is newest-first).

### Grace window + lock
- `gradedAt` is stamped at grading. Grace window `studyAutoSyncMinutes` (default 5), then auto-sync and **lock**
  (a `🔒 Synced` badge replaces the rating control). Triggers, all `syncGradedNow()` → `syncRatingsToAnki()`:
  auto-timer (armed to the oldest pending deadline; full flush; also runs on the summary screen), manual "Sync N to
  Anki now", Finish/Exit, End Now.
- Global settings `studyAutoSync` + `studyAutoSyncMinutes` (config.json, default ON / 5, Settings → Anki & audio →
  "Anki auto-sync"); OFF = manual/Finish only, no auto-lock. A 1s ticker `studyNow` drives "locks in M:SS".
- Graded cards live behind "▸ Show graded cards (N)" (`studyShowGraded`), newest first, each `● not synced` or
  `🔒 Synced`.
- **A rating can't change under a sync.** `rateGradedCard` refuses a card that is synced or in `studySyncedIdsRef`
  (a re-rate as it locked set synced:false forever); a finished sync sets each card's rating/ease to what was SENT
  (a mid-sync change locked showing a rating Anki never got). "Back" also refuses a card a running sync picked up
  (`syncInFlightIdsRef`, filled by `doSyncRatings`).
- **Post-lock correction (`correctSyncedRating`)**: when the feedback chat overturns a synced grade, `synced` is
  never flipped back (the card would never re-sync). Instead a FOLLOW-UP review is added: one SM-2 step from the
  card's **pre-sync interval** (`preSyncInfoRef`, snapshotted at the top of `doSyncRatings` via one batched
  `ankiCardsInfo`, cleared with `studySyncedIdsRef`), via `setDueDate '<ivl>!'` + `insertReviews`. Once per card
  (`cs.ankiCorrected` → "🔒 Synced ✎"), on `syncChainRef`, only for real ease changes on non-noSync,
  non-conjugation cards. The app appends a factual receipt ("✅ Anki corrected: …" / "⚠ … could not be
  updated"); the model must never claim it changed Anki. The MC Good-cap applies. The feedback-chat merge
  re-checks `sameCard() && stillGraded()` after its Anki awaits and after waiting on `syncChainRef`.

## Study modes
### Grading (shared): ONE rule for one answer (`src/config/grading.js`, pure, `grading.test.js`)
`gradeAnswer({correct, clean, hintUsed, accentSlip, retried, corrected, choice, mature})` → again|hard|good|easy;
`gradeFromStrike(verdict, {choice, mature, hintUsed})` (miss/glancing/clean); `easeFor`, `isMature` (interval >= 21
days), `gradeIsRight` (not Again), `gradeIsSolid` (Good+). Again = wrong / I don't know; Hard = right with a hint, a
retry, a near miss (accent slip, partial, a grader's penalizing note, a glancing strike); Good = clean; Easy = clean,
TYPED, no hint, on a MATURE card. A choice is never above Good. Subject-neutral: no signal is language-only (an accent
slip is one kind of near miss). Used by Study's one-question cards, raids (`raidRating`) and Legends (item tallies).
Multi-question Study cards keep the count rule (`rateStudyCard`, `utils/studyDepth.js`; outcomes unchanged).
### Question depth (`studyRules.questionDepth`, per mode: `'adaptive'` default, `'thorough'`; `utils/studyDepth.js`)
`questionCountFor(card, rules, {kind})`: adaptive = a due REVIEW (Anki type 2) gets ONE question; new, learning,
relearning (type/queue 3), struggling (`ADAPTIVE_STRUGGLE_LAPSES`) cards and relearn copies get `questionsPerCard`;
thorough (and conjugations/PBQs) = always `questionsPerCard`. `depthPlan` (`utils/studyDepth.js`; App's wrapper beside `adaptivePlan` adds the session type) runs at
every card-state creation and passes `{...rules, questionsPerCard: 1}` to generation, so the prompt asks ONE
PRODUCTION question (language: produce the word/form; general: the term, value or step, never explain/translate),
the split-first-card path is skipped and the reuse signature (`perCard`) keeps 1- and n-question sets apart. Such
cards carry `oneQ` + `ivl` (interval) and `rateStudyCard` rates them with `oneQuestionRating` (the shared rule; hint =
`hintQs` set by a shown meaning hint, retry = 2+ attempts, near miss = accent slip or a penalizing note, grammar ones
only with grammar feedback on; MC capped at Good unless noSync). A missed one-question review (Again, recorded once)
is re-queued as a noSync relearn copy with the full count (`oneQMissNeedsRequeue` decides, App's `requeueOneQMiss`
re-queues; a give-up with the Learn-it moment on is re-queued by the moment). App keeps only state wiring; the rules
are tested in `studyDepth.test.js`. Off switch: per mode `questionDepth: 'thorough'`; app-wide default
`DEFAULT_QUESTION_DEPTH`. Thorough mode never sets `oneQ`. UI: Settings > Study > Session ("Question depth") and
the start screen's "One question per review" box; Help sees `questionDepth` in `studySession`/`studyStart`.
### Multiple choice (`studyAnswerStyle` = `'typed' | 'choices'`)
- Start screen "Answer style" (hidden for conjugations), `localStorage('ebiki-study-style')`. "Record reviews in
  Anki" (`studyPracticeSync`, `localStorage('ebiki-study-practice-sync')`) defaults CHECKED (`!== '0'`).
- `generateQuestionsForCard(..., wantChoices)` adds 4 options + `answerIdx`, no open "explain" questions, NO letter
  cues. Options go through `buildChoices` (also used by `fixCurrentQuestion`): deduped by the same `norm()` they are
  matched with (the model's correct option survives), SHUFFLED (models bias the correct slot), and the correct
  option is CHECKED against `acceptedAnswers` (exactly one match wins over a miscounted `answerIdx`; two matches
  that are one word up to accents, "él"/"el", keep the model's pick since the accent is the test; two different
  words → asked typed; none → the model's pick). Rows with no question text are dropped (here and in
  `generateConjugationQuestions`).
- Card states carry `mc` (+ `noSync` when not recording). Fully-MC cards grade locally (`evaluateCardLocally`, no
  AI); a question without usable choices falls back to the AI grader.
- **Ease capped at Good** for synced MC cards (recognition < recall). `noSync` cards are excluded from EVERY sync
  path (`!cs.noSync` in doSyncRatings/auto-sync/ticker/exitStudy/pending) and show a purple PRACTICE badge.
- `submitStudyChoice` advances state immediately and leaves a frozen `studyChoiceFlash` snapshot for the green/red
  beat. Keys 1-4 answer (they wait while "delete this card?" (`studyDeleteConfirm`) is open); the meaning hint is
  hidden.

### PBQs (`studyMode = 'pbq'`, GENERAL modes only)
- Start screen: general modes get Flashcards|PBQ, language modes Flashcards|Conjugations; a stale type falls back
  to flashcards (`beginStudy` sanitizes). Formats: **matching**, **ordering**, **categorize**; one per card.
- `src/pbq/engine.js` (pure, `engine.test.js`): the model authors INDEX-FREE (`pairs`/`steps`/`groups`);
  `compilePbq` validates and shuffles into `{left,right,items,categories,answer[]}`; `gradePbq` is deterministic;
  `studentView` strips the key; `parseSolverAnswer` maps a text reply to indices. `compilePbq` rejects a
  categorize whose largest group holds >60% of items; real-use ordering reshuffles until <40% of steps sit in
  place (an untouched Submit stays below Hard).
- **Verification (`generatePbqForCard`)**: RELEVANCE GATE (`{"kind":"skip"}` for off-subject cards, discarded, no
  retry) → generate → compile-validate → citation check (with a KB: 2-4 VERBATIM quotes, `checkCitations`) →
  BLIND SOLVE on `studentView` (`compareToKey`) → judge (`solver_wrong` keeps the key; `key_wrong`/`ambiguous` →
  ONE regeneration, then DISCARD). An unusable blind solve (unparseable, nothing matched) is retried once, then the
  attempt is dropped, never sent to the judge. `pullNewCard` tries up to 3 pool cards per slot (`pbqPullRef`).
  ~3-5 calls per exercise, all at generation. A verified exercise goes through `strippedPbqOk`: after the dash
  strip an empty or duplicate item rebuilds it.
- UI `src/components/PbqQuestion.jsx`: select-then-place (robust under zoom) plus drag-and-drop, ▲▼ for ordering
  (`aria-disabled` so focus stays); targets are keyboard-operable (Enter/Space); matching boxes are one-to-one; a
  real shuffle is never the identity (an ordering would show pre-solved); `review` prop = graded read-only.
  `submitPbqAnswer` grades locally, advances underneath, and holds the result (`studyPbqReview`) until
  **Continue**. Rating from the fraction (1 → easy, ≥.7 good, ≥.4 hard, else again) via `pbqRatingScore`
  (engine): categorize is CHANCE-CORRECTED against dumping every item in the biggest group (that alone scored
  40-60%, a passing Hard). Same Good-cap/`noSync`/`practiceGradeAnki` semantics as MC; "I don't know" →
  `evaluatePbqSkipped` (again). A reused exercise gets `reshufflePbq` (new layout, same key). With a pull in flight
  the empty question area says `study_preparingNext` and hides View summary.
- Item identity (`itemKey`) keeps symbols ("C++" ≠ "C"); `norm` is only the loose fallback. Numbered steps are
  stripped (`STEP_MARK`) when nearly all carry a marker, CJK/full-width forms too ("1、", "１．", "①", "第一步："),
  never a decimal ("1.5") or "e.g.".
- Optional emoji icons (`raw.icons` → `pbq.icons`, `iconFor`): validated, excluded from `studentView`, never
  graded, must not hint at the answer.

### Question-style preferences (`studyRules.questionPreferences`, per mode, max 12)
The feedback chat's `question_preference` action distills "ask this differently" into one generalized imperative
rule on the mode (async → pinned `feedbackModeId` + `updateModeById`). All rules go into
`generateQuestionsForCard` as a USER'S QUESTION-STYLE PREFERENCES block, subordinate to the ambiguity/leak rules.
Editable in Settings → Study. Also fed by the **✎ Fix question** button on the live question (`studyFixQ` +
`fixCurrentQuestion`): regenerates that ONE question in place (same slot type, MC options regenerated,
leak-checked, `glossFetchRef` key deleted so hints refetch) and saves a preference unless the model judges it
one-off. Auto-closes on question change; hidden for PBQs.

### Slash answers (`expandSlashAnswers`)
- One-letter endings expand ("bonito/-a" → bonito, bonita; "niño/a" → niña). `isSlashEnding` also takes a
  one-letter a/o ending after a 3-letter vowel-final base (tío/a) and a plural "/s" after a vowel. An accented
  final vowel keeps its accent and the ending is appended (fatigué/e = fatiguée).
- An article slash beside a phrase expands on its side: before the phrase it replaces the FIRST word ("el/la
  estudiante" → la estudiante), after it the LAST ("hace frío/sol" → hace sol); a bare article never passes. An
  unslashed gendered article (`GENDERED_ARTICLES`) fixes the gender: "el médico/a" expands to "el médico" only.
- A slash ENDING inside a phrase expands word by word, genders aligned ("compañero/a de clase" -> compañero de
  clase, compañera de clase; "los/las alumnos/as" -> los alumnos, las alumnas); never a phrase starting with a bare
  ending. The Learn-it gate adds `expandSlashAnswers([head])` (the ONLY source for an ending inside a phrase).
- Spelled endings are a table (`SLASH_SPELLED`): heureux/se, lavar/se, actif/ve, bon/ne, gentil/le, aquel/la,
  premier/ère, chanteur/euse, acteur/rice; each needs its base shape, so a bare "se"/"la" never passes alone.
  French bases ending in i/u keep the vowel (ami/e = amie, "un/une ami/e" = un ami, une amie).
- A plural ending beside another slash ("el/la joven/es") keeps only the singular (it made "la jovenes"). A
  fraction ("1/2 taza") is never split.
- `answerLetterCounts` counts the expanded forms (split pieces only as a fallback, minus 1-letter endings; whole
  1-character answers like 雨 still count).

### Answer-leak guard (question + hint)
`questionAnswerLeak` (exact, accent-insensitive, whole-word, ≥3 chars; explanation type exempt; general modes
exempt the final deep question) and `hintRevealsAnswer` (FUZZY: plurals/inflections). Both REGENERATE first (up to
two rewrites naming the violation); `scrubAnswerFromQuestion`/`scrubHint` (blank to `___`) are the last-resort
net. The prompt also says the answer must never appear in the question (incl. the sense cue).
- `leakNorm` folds apostrophe forms; the scrubs accept any apostrophe form. An answer holding any non-letter
  ("aujourd'hui", "week-end") is matched as a BOUNDED substring in hints (never inside "puisqu'il").
- A question still leaking after its scrub is DROPPED (never shipped) and Fix question refuses it.
  `blankedSubject` is component-level (only a blank the scrub made counts): Fix question refuses a scrub that
  blanked the subject.
- `letterSkeleton` never builds from a Han-first answer (it showed half the word); a quoted LATIN letter cues a Han
  answer only through a pinyin/romaji answer.
- The guard's answers are `leakAnswers(q)`: accepted + the CORRECT choice, unless a distractor is named in the
  question too ("True or false"); then accepted answers that ARE a choice are left out too ("True or false"
  shipped blanked).

### Typed-answer feedback (`studyTypedFlash`), three states
Green ✓ = matched `acceptedAnswers` locally; amber ⏳ "Ebi will check" = explanation questions, general modes,
hint-exhausted answers (inflection tolerance may still accept); red ✗ + `.study-shake` = wrong with a hint retry
(no advance). Frozen-snapshot pattern like `studyChoiceFlash`. **The batchFeedback layout-effect gates on all
overlays** (`studyChoiceFlash || studyPbqReview || studyTypedFlash`, plus the Learn-it moment) so the last answer's
feedback paints. **The shake is TRANSIENT** (`studyShaking` via `triggerShake()`, cleared on `onAnimationEnd`); the
`studyInputShake` counter only changes the element `key` (keying off its truthiness re-shook every remount).

### "Learn it" moment (`studyLearnMoment`)
I-Don't-Know on Q1 records an honest Again, then `openLearnMoment(cs)` holds the card with a teach panel: back
(`cardBackToHtml`), pronunciation, an auto memory hook (more via `learnMomentAnotherHook`), and a focused Ebi chat
(`sendLearnChat`: explains from zero in the app language, `knowledgeBlock(4000)` + `dialectRule`, dash/shrimp
stripped).
- **Exit gate = typing it once** (`learnMomentTypedOk`): LANGUAGE = the headword, exact incl. accents, any
  "/"-form. GENERAL = a short KEY TERM (fronts can be paragraphs): derived instantly (front text before the first
  `:.?!`, capped), then a silent AI call picks a better term (fail-soft; `keyTermAlt` keeps the fallback
  accepted). General typing forgives case, spacing and trailing punctuation. The headline shows `headWord`;
  general modes show the full front as a paragraph. No key term at all = the gate is open.
- **Apostrophes are folded** in the gate (`’‘ʼ\`´` → `'`): a curly-apostrophe front could never be typed. Spaces
  incl. NBSP are normalized.
- The give-up dialog SHOWS the card front (`study_giveUpCard`): the owner wants to peek before deciding, even
  though on a language card it is the answer; meaning-hint words are tap-checked like question words
  (`source === 'hint'`).
- **Gate forms**: a short piece is a FRAGMENT, expanded against its neighbour ("el/la estudiante" → "el
  estudiante"; "niño/a" → "niña"); a single letter never passes alone; 2+ letter words still do when no phrase is
  involved ("ir/ser"). A single-letter ending anywhere (bueno/a/os/as) makes EVERY short later piece an ending:
  "os" alone never passes; it expands against the nearest full word ("buenos").
  Multi-letter endings share ONE helper with `expandSlashAnswers` (`isSlashEnding`/`expandSlashEnding`, top of
  App.jsx): "nosotros/as" → nosotras, "trabajador/ora" → trabajadora, "bonito/-a" → bonita; the ending never
  passes (or grades) alone. Needs a 4+ letter base, so "nos/os" stays two words. Endings include
  `esa(s)`/`ana(s)`/`ona(s)`/`ina(s)`, overlap is compared without accents, and an appended ending drops the
  base's final-syllable accent (alemán/a = alemana). A 3+ letter ending must echo the base's last two letters
  (`isSlashEnding`): "esta/esa", "hermano/ana" are two words.
- Re-queued ~2 cards ahead (`requeueForRelearn` inserts `{...card, _relearn:true}` into `studyAllCards` at
  `studyBatchIdx+2`; `pullNewCard` maps it to `noSync: true, relearn: true`), so the Again stays the card's only
  Anki review.
- Holds the screen like the flashes (layout-effect gate + first branch of the question-card render chain). Cleared
  on exitStudy + session start. Flashcards only.
- **Per-mode `studyRules.learnMoment`, default ON** (`!== false`); the "Learn-it moments" checkbox shows for ALL
  modes (the grammar/word-hints/accents toggles in that row stay language-only). i18n
  `studyLearnMoment`/`studyLearnMomentDesc`.

### Session end
The summary shows unsynced ratings + `studySyncError` with a "Sync N now" button. "Clear completed" never dismisses
a card still waiting for Anki. End Now sets `studyEndedRef` (pulls and background generations stop; grading still
lands; `beginStudy`/`exitStudy` clear it) and clears `studyLearnMoment` and `studyPbqReview` (Help kept describing
them). `exitStudy` resets `studyQaOpen`/`studyShowGraded`; the study TYPE is remembered (`ebiki-study-type`).
`startStudySession` refuses only `ankiConnected === false` and keeps the deck list when the read fails (error shown
on the Study home).

### Session start (`beginStudy`)
DUE cards first, then new cards capped at Anki's `new_count` for today, each group shuffled, ONLY when the session
records reviews (not conjugations, not unrecorded MC/PBQ practice); no deck stats = the old single shuffled pool.
One card per NOTE (reversed siblings read the same fields). `startStudySession` and `switchActiveMode` pick a deck
that still exists in Anki. The knowledge fetch starts before the AnkiWeb pull, and deck stats + due cards are read
together.
**Split first card** (flashcards, `questionsPerCard > 1`): `generateQuestionsForCard(..., onFirst)` generates Q1
ALONE (`generateQuestionsFresh(..., {part:'first'})`), hands it over, then the rest with Q1 in the prompt
(`part:'rest'`, `firstQuestion`: no repeat, Q2 to Qn order) and returns the whole set (question reuse saves it
whole). The session opens on Q1; the card carries `pendingRest` + `expectedCount` until the rest lands
(`cardQuestionCount` counts the expected total, the done checks skip a pending card, dots past the written ones
are not clickable). The merge (in `trackStudyGen`) keeps the on-screen Q1 (Fix question), decides "finished" from
`studyCardStateRef.current` (an updater may run later), and a card whose rest failed with Q1 answered is graded
then. The next question stays random (`getNextStudyQuestion`), so Q2 may come from card 2. A restore drops the
flag. Not live-tested with a real deck (needs Anki and spends credits): verify on first real use.

### Adaptive cards (`studyRules.adaptive`, per mode, default OFF, flashcards only)
`adaptivePlan(card, rules, mcSession)` (next to `needsLetterCue`) runs at every card-state creation (first card,
start-up pool, `pullNewCardInner`). NEW cards (`type`/`queue` 0) get `learnFirst`: an effect opens
`openLearnMoment(cs, { intro: true })` the first time their Q1 comes up (no requeue, heading `learnIt_newTitle`,
marks `introShown`). New and STRUGGLING cards (`lapses >= ADAPTIVE_STRUGGLE_LAPSES`, `src/config/study.js`) are
generated multiple choice in a typed session (`mc` + `adaptiveMc`): graded locally, recorded in Anki, capped at
Good like every synced MC card. Relearn copies are left alone. Toggles: study start screen and Settings > Study >
Session. Help sees `learnMoment.intro`.

### "I Don't Know" (`skipStudyQuestion`)
Card-level ONLY on the first question (confirm → every question '(skipped)', rated Again). Once any question is
answered (`cs.questionIdx > 0`) it fails only the current question and advances like a submit (no confirm), so a
correct Q1 isn't forfeited. On a reviewed earlier question (via a dot) it replaces that answer with '(skipped)'
and returns to the frontier. PBQ/conjugation skips are separate (`evaluatePbqSkipped`, `skipConjugationWord`).

### Accent drill
Any typed answer (incl. explanation / deepQ sentences) triggers a retype drill when it CONTAINS a target word with
the right base letters but missing/misplaced accents ("muy calida" → retype cálida). Other inflections, other
words, or answers without the word continue normally. Candidates = `acceptedAnswers` ∪ the card's own headword
forms (front split on "/", "(…)" stripped); the front forms only when the question has no `acceptedAnswers` or is
an explanation. The canonical is the matched variant with the MOST accent marks (a half-accented "ñandu" listed
first was taught); the drill shows the card's own spelling of it (answers are stored lowercase; German nouns).
After the retype the ORIGINAL answer is graded unchanged (`cameFromRetype`); the slip caps the card at Good
(`accentSlips`).
**Conjugation drills skip it and match EXACTLY** (`matchesExact` only, stripping no articles/pronouns: "lo hablo" is
the drilled form; the grader gets `conjugationGradeRule`): an accent can be the tense ("hable" vs "hablé"). Fix
question is hidden for them; a restore re-queues unasked `conjWords`. Conjugation sessions read the deck's
non-suspended cards (not only due ones: nothing is recorded), grade and add words in `studyConjugationLanguage`
(the deck's language; `buildCardFields({language})`), and the fallback pool is headwords once each.

### Question-phase chrome
- Header progress bar: total = completed + active + not-yet-pulled pool cards (the denominator never moves);
  "N/M cards". Per-card question dots (hidden for 1 question).
- **Dots are clickable for non-destructive review** (`viewCardQuestion`): answered dots and the current one;
  answered ones show the previous answer prefilled (a ring marks the viewed one); can't go past the frontier.
  Submitting an edited earlier answer hits the EDIT branch at the top of `submitStudyAnswer` (`questionIdx <
  cs.questionIdx`): replaces `answers[qi]` (attempts reset) and returns to the frontier; grading reads `cs.answers`.
- Wrap Up / End Now live in the header with Exit Study. Question text 15.5px.

### Graded / batch feedback views
- The card HEADER toggles its body (`card-head`; inner controls `stopPropagation`). `studyGradedView` =
  `{ [cardIdx]: 'feedback' | 'mnemonic' }` (absent = collapsed): **▸ Feedback** (`renderFeedbackToggle`) and **🧠
  Help me remember** (`renderMnemonicButton`) are mutually exclusive. Same for the in-session graded list and the
  end-of-session Batch Results (both collapsed by default).
- Each question is a collapsed row (`renderQaRow`, keyed `studyQaOpen[src]`): ✓ green = correct, no non-praise
  notes; ✓✎ amber = correct with feedback; ✗ red = incorrect. Expanded detail 13.5px with hanging note icons.
- "Clear completed from list" sits at the very BOTTOM of the in-session list.
## Memory hooks (one engine: `generateMemoryHook(front, back, prior, method)`)
Subject-agnostic. Hook language = `studyRules.hookLanguage` ('' = APP language; not "Ebi speaks": a mnemonic must be
understood instantly), consumed only here via `explainLang`. Never hardcoded.
- **Methods (`METHODS`)**: `meaning` (decompose → one vivid image ending at the meaning); `sound` (language: a
  sound-alike bridge from the REAL pronunciation echoing EVERY syllable IN ORDER, the last included, each a genuine
  sound-alike, never a meaning word posing as a sound; recap PAIRWISE `syllable=BRIDGE` so mismatches show. General: an
  acronym/anchor that reconstructs the exact term); `parts` ("Break it down": real morphology step by step, e.g. dar →
  darse → dárselo; ≤60 words); `confuse` ("Don't confuse it": 1-2 real confusables + one sharp discriminator each;
  ≤50 words); `story` (2-4 sentences ending at the answer; ≤70 words). Others ≤35 words. Language cards get
  sound-alike/imagery/cognate hooks; general modes get acronyms/associations/stories for the CONCEPT, never a
  translation.
- **`auto`** (default "🧠 Memory hook"): the model picks the best method and prefixes it in **bold**. Excludes
  `confuse` (manual only). With prior hooks (fed in so each differs; every click APPENDS) it prefers an unused method.
- **Every hook gets a VERIFY-AND-IMPROVE pass** (hooks get memorized): re-runs the reconstruction test, says sound
  pairs aloud, checks truth and clarity, improves wording/imagery even when nothing failed (never a rewrite for taste;
  same method/language/format/length; keeps the bold label). Fail-soft + `silent: true`. ~2 calls per hook, on demand
  only. **The verify pass can answer ABOUT the draft**: its "Improved version:"/fence wrappers are stripped, and a
  verdict ("no changes needed"), a lost bold label or a 2.5x longer rewrite falls back to the draft.
- **Hooks survive reloads and deletes**: a restore clears `mnemonicLoading`; saved hooks hydrate at the START of a
  generation and the completion adds only the new hook. `deDash` keeps digit ranges as hyphens. Grammar slips dedupe
  on `grammarSlipKey` (case/space only; accents are the point), in the rename merge too.
- **UI: one shared row `renderHookButtons(surfaceKey, onPick, disabled, compact)`**: primary "🧠 Memory hook" + the
  five styles behind "Styles ▸" (`hookStylesOpen` per surface). Labels/tooltips from `hookMethodList()`; the row uses
  `tip-r` (left-anchored tooltip).
- **Rendering**: hooks use `renderTappableRich` (bold + line breaks, tappable words; `.hook-md strong` styles it),
  NEVER `<Markdown>`. Improve the prompt in ONE place.
- **Surfaces**: study graded cards (`generateMnemonic(ci, cs, method)` → `cs.mnemonics` +
  `mnemonicLoading`/`mnemonicError`, rendered at the TOP of the card body by `renderMnemonic`; opening the toggle
  hydrates saved hooks, doesn't auto-generate), deck rows (`generateDeckMnemonic(note, method)`,
  `deckBrowserMnemonics` by noteId), the tapped-word popup (`studyWordMemoryHook(method)`, compact), the Learn-it
  moment (seeds saved hooks; auto-generates only when none exist). A failed word lookup (`failed`) offers no hook
  buttons (the hook was built from the error text) and no "Make Anki card" (its front or correction could show the
  live answer).
- **One per-mode store, visible everywhere** (`modeHooks`, blob `hooks` → Anki media + local fallback, loaded on mode
  switch). Keys: Anki noteId, or `word:<folded word>` for tapped words without a card. Save via
  `addNoteHook(hookSaveKey(noteId, front), hook)`; read via `hooksForItem(noteId, front)` (unions the note's hooks with
  word-key hooks for each headword form). The popup hydrates word-key hooks synchronously, then resolves the note
  async (`studyWordFindExisting`) and records `hookNoteId`. `deleteNoteHook(noteId, hook, front)` deletes by VALUE
  across noteId + word keys. Writes are functional (`writeModeHooks`). **A write goes to the mode the in-memory list
  belongs to** (`hooksModeIdRef` / `grammarModeIdRef`, name resolved by id at write time), never the caller's
  `activeMode.name`: a hook finishing after a mode switch saved the new mode's hooks over the old mode's blob.
  Hooks/slips started in another mode are not filed under the new one (`hookModeId`, `gradeModeId`). The owner name
  is `storeOwnerName(id)` (`storesAtRef` first: during a rename, the old name until the save answers); the
  hooks/grammar LOADS read from `storeOwnerName` too (reading the new name and writing the old one lost hooks).

## Study start screen and Dropdown
- **One sectioned card** (What to study / Language / Session format), label-above-control fields in
  `repeat(auto-fit, minmax(180px,1fr))` grids; legends are `.tip` tooltips. Fits without scrolling at 1.35 zoom.
  `Dropdown` applies `style.width` to its wrapper.
- **The `Dropdown` menu is portaled to `<html>` (outside the body zoom), `position:fixed` in REAL px, scaled with
  `transform: scale(z)`.** A fixed element inside the zoomed body has a broken Chromium hit-test box (lower items
  unclickable, clicks land higher). Intrinsic sizes = available room ÷ z; `transformOrigin` flips to `bottom left`
  when opening upward; opens toward the roomier side, caps height to the viewport, **closes on any scroll or
  resize**.

## Per-mode dialect (`studyRules.dialect`, language modes)
Free text ("Latin American Spanish"). `dialectName()`/`dialectRule()` (next to `learnLangName`) build ONE line
injected into EVERY generator: card generation + `verifyCards`, memory hooks, `lookupStudyWord` phonetics,
`generateQuestionsForCard`, Chat card format, bulk-edit framing, Discover. **It governs every regional convention,
language-agnostically**: phonetics, spelling, **punctuation/quotes** (LatAm `"..."` vs Spain `«...»`), vocabulary,
grammar, register (`ustedes` vs `vosotros`). A form existing in only one region keeps that region's norms; otherwise
the studied variant wins. Audio region is separate (`pronunciation.defaultRegions`). Help can set it
(`set_dialect`); it rides in `appContext.activeMode.dialect`.

## Deck browser
### ✨ Ebi bulk edit (`analyzeDeck(kind, instruction)`)
- `kind='custom'` = "apply the owner's request; skip cards it doesn't cover; change only what it covers", reusing the
  whole analyze pipeline (JSON contract, noteId+front integrity guard, before/after accept/deny review, commit).
  Nothing writes to Anki until each card is accepted. UI: toolbar button → panel
  (`deckCustomEditOpen`/`deckCustomEditText`) → "Preview changes". The review header echoes the exact request
  (`deckAnalyzeInstruction`); the Dialect/Tag audit header names the audit, never the raw English instruction.
- **Tags as well as fields**: the payload includes each note's `tags`; optional `recommendedTags` is the COMPLETE
  replacement list (tags-only recs are valid). Language decks embed `usageTagsRule()`. Review: an editable Tags input
  (`recommendedTagsText`, `parseRecTags`) + chip diff (removed red struck-through, added green, kept gray). **Every
  new editable thing Ebi gains needs this before/after review.** Refine can change tags too. Commit: fields via
  `ankiUpdateNote` (diff-only), tags via `ankiSetNoteTags(noteId, currentTags, finalTags)` only when changed; refuses
  a no-op and wiping ALL tags. Rec inputs are disabled while `refining`; a landed Refine clears `accepted` and falls
  back to `parseRecTags(rec)`; the Tag-audit contract is re-applied after a Refine. Duplicate merges refuse a group
  where a deleted note has a non-empty field the survivor lacks (another note type, `deck_mergeOtherType`).
- **Verify-and-improve pass** (`verifyDeckRecs`): truth (incl. regional/preferred-term honesty; never a "slang-only"
  framing for a word some region uses literally), scope, tag completeness, clarity; can DROP a pointless rec. Merges
  back strictly BY noteId; a rec reverted to the current card is removed. Refine verifies too (`refineRequest`,
  `allowDrop: false`). Fail-soft.
- **Run tokens** (`deckAnalyzeRunRef`, `dupScanRunRef`, bumped by `resetDeckReview()` on deck switch/add, and by
  `clearAnalyze`/`clearDup`): a discarded run stops between batches and its results never land under another deck.
  Merges re-read the notes (`noteById` from the fresh read) before touching tags. Recs are deduped by noteId; the
  reviewer may change tags only when the first pass proposed tags or a refine asked; a Refine lands only on a rec
  still `refining`. Every AI field value (first pass, verify, Refine, merges) goes through `cardText`.
  Dup scan: a new scan clears the old groups first; a fuzzy dup set must lie in one cluster (`clusterOf`) and an AI
  merge must echo the headword; bare fronts beside 2+ senses form their own group; a fuzzy set holding two different
  senses of one key is dropped, checked again on the groups `unionGroups` joined (two sets bridged by a bare front).
  The front echo matches as plain text too (`echoedPlain`): parsed as HTML, "<div> element" matched nothing.
- **BATCHED, 20 cards per call - don't collapse it.** One whole-deck call hit the output limit and `parseAiJson`
  salvaged a truncated array that looked complete. Sequential batches, `maxTokens: 8000`, recs stream in,
  `deckAnalyzeProgress` {done,total} → "Checking N of M cards"; a failed batch doesn't discard the others (partial run
  → `deck_analyzePartial`). Covers Check card quality, Dialect audit, Tag audit, bulk edit, and Help's `deck_edit`.
  The duplicate scanner is NOT batched (finds candidates locally first, sends only clusters).
- `deckAnalyzeKind` keeps labels straight. Help's `deck_edit` prefills + opens the panel, switches to Deck, and
  `pendingDeckEditRef` runs the preview once notes load. **Call as `onClick={() => analyzeDeck()}`** (a raw event
  would become `kind`).

### Other deck browser behavior
- **+ Add Deck → "⚡ Make it for this mode: <name>"** (`handleAddDeckForMode`): creates the deck (typed name or the
  active mode's name) and links it via `updateModeById(pinned id, { ankiDeck })`, id pinned before the awaits. Plain
  quotes, not «guillemets», in its strings (user preference). The typed-purpose path (`handleAddDeck`) fuzzy-matches a
  mode or `createMode`s one; it links an existing mode only on an EXACT normalized name. Both add paths use Anki's
  spelling of the deck.
- **Rows**: one-line preview via `backPreviewText` (breaks → " · "); click to expand (`deckBrowserExpanded`):
  bold-labeled back lines, tag chips, studied/lapses/interval footer. Badges from `note.stats`: NEW / learn / interval
  (green when ≥21d), ⚠ when lapses ≥4. Row text drops `[sound:]` (`SOUND_TAG_RE`) and bolds `:`/`：` labels; card text
  strips dashes with `stripDashesInline` (never across lines). **Copy to / Move**: `ankiCopyNote` (allowDuplicate on
  purpose) or `ankiChangeDeck` (scheduling travels), with an inline "New deck…" creator; compares deck names
  case-insensitively, like Anki; results land only on their own panel (`deckBrowserCopyingRef`). **⟲ Reset progress**
  (red, confirm-gated): `ankiForgetCards` (card becomes NEW, content untouched).
- Rows of a deck owned by ANOTHER mode (`deckOwnedElsewhere`, per row by `note.deckName`: a parent deck lists its
  subdecks' notes) get no audio and no memory hooks (`noteOwnedElsewhere(note)`: the row says `deck_hookOtherMode`;
  `generateDeckMnemonic` refuses). Anki helper errors are translated via `setAnkiTranslator`. PBQs carry
  `iconKeys: 'item'`.
- **The card editor is plain text, line-aware**: `startEditNote` turns `<br>` AND block ends (`</div>`, `</p>`, …)
  into newlines (Anki's editor writes lines as `<div>`s; stripping them fused the lines, and a save wrote that back).
  Only changed fields are written. One converter, `fieldHtmlToPlain` (App.jsx top), serves the editor, the AI payloads
  and the changed-since checks: breaks lines at block STARTS after text too, folds runs of block tags (lists, nested
  divs) into one break, removes only real tags (`isHtmlTagName`, anki.js: "<stdio.h>" survives), decodes every entity
  through an inert DOMParser (`decodeEntities`). Label checks accept `:` and `：`.
- **The card editor re-reads the note before saving**: a changed field whose Anki copy moved since the editor opened
  (audio embedded by a 🔊 play) is refused with `deck_changedSinceEdit` (the refusal reloads the list); a field whose
  fresh copy already equals the edited text is skipped (`already`), never "moved". `saveEditNote` snapshots
  `deckEditOrigRef`/`deckEditOrigTagsRef` BEFORE its awaits (another card may open). The save builds the written HTML
  from the FRESH re-read (`buildHtml(fresh)`), so an image added in Anki after the list loaded survives. The editor
  applies only the user's tag additions/removals (`deckEditOrigTagsRef`) onto the re-read tags. The audio embed
  patches `deckBrowserNotes` (the editor opened on a stale back and every save was refused). Refine lands on the
  LIVE editor fields. Reloads after an await pass `deckBrowserDeckRef.current`, never the render-time deck.
- **Deck commits and merges reload QUIETLY** (`{ quiet: true }`): a normal load closes the card editor and lost its
  unsaved text.
- **Duplicate merges** write a field through `cardBackToHtml` when the originals had bold `Label:` lines; re-read
  their notes first and skip a changed group; write only fields whose text changes (never emptying one) and carry
  images that live only on a duplicate. Dup scan: exact groups are split by "(sense)"; dup actions go by
  `dupGroupKey`, never list index; a save/merge removes ONLY what it wrote from the suggestion list. "Do not merge"
  lists of ancestor and sub decks are read (read-only) and also filter the scan.
- **A duplicate merge moves the deleted notes' memory hooks onto the survivor** (hooks are keyed by note id): COPIED
  to the survivor before `ankiDeleteNotes`; the old keys go only after it succeeds.
- **Plain-text writes keep what plain text can't hold** (`fieldImages`/`keepFieldImages`/`hasUnkeepableMarkup`,
  App.jsx top): the editor, bulk-edit commit and merges re-append a field's `<img>` tags and REFUSE a changed field
  holding `<ruby>`/`<svg>`/`<math>`/`<table>` (`deck_keepsMarkup`); `hasUnkeepableMarkup` also refuses a link (`<a>`)
  other than the audio credit. **`keepFieldImages` also keeps audio**: a `[sound:...]` the new text lacks comes back
  with its credit `<div>` link; a flattened "[sound:x]🔊 credit" (same or next line) is restored IN PLACE as the
  original sound + credit link, only from an original that HAS its link; real HTML stays byte-identical (an untouched
  field is never rewritten); collapses to one recording only with `{oneSound}` (merge, changed field). Credit markup
  is matched loosely (`&nbsp;` after the speaker, a trailing `<br>`) in `fieldSounds` and the refusal.
- **Text vs HTML on the way into Anki.** Plain text such as `#include <stdio.h>` lost its `<...>` to Anki's HTML
  parser. `ankiAddNote` runs `escapeStrayLt` (a `<` that does not open a real HTML element, a hyphenated custom
  element or a comment is escaped) and hyphenates spaces in tags. `ankiUpdateNote` writes fields AS GIVEN, because the
  audio embed re-sends a card's existing HTML (escaping there garbled `<rb>`/SVG/MathML on cards nobody edited); so
  every caller writing plain text escapes it first: the editor save, bulk-edit commit and merges use `escapePlainHtml`
  (they hold decoded plain text, so a card about `&lt;div&gt;` stays text), and the feedback chat's AI `update_card`
  runs `escapeStrayLt`. EVERY add path writes plain text through `plainFrontHtml` / `plainBackHtml` (escape per line,
  then `cardBackToHtml`); `ankiCanAddNote` gets the same and checks the sanitized fields `ankiAddNote` stores.
  Picture stores the deck it added to in `ankiSynced[idx]`.
- **`escapeStrayLt` keeps markup only for a real tag**: a known name followed by whitespace, `/`, `>` or the end, with
  attribute-shaped text up to `>`, never a lone uppercase letter (generics), and `<!` only as a comment. A real tag
  must CLOSE: `>` or `/>` right after the name, or attributes up to `>`; a name at the end of the text or before a
  bare `/` is text ("a<b").
- Template values go through `cardText` (lists joined with ", "), missing `{placeholders}` fill with nothing, and a
  back line that is only `Label: {empty}` is left out. A back template's literal `\n` separators become real line
  breaks (`buildCardFields`, `generateCards`). `cardBackToHtml` never bolds a `[sound:` line, a cloze (`{{`), MathJax,
  a clock time, a URL or a `🔊` credit line. `parseAiJson`/salvage escape raw control characters inside strings.
- **A render crash shows a recovery screen, not a blank window**: `src/components/ErrorBoundary.jsx` wraps `<App/>` in
  `main.jsx`. Self-contained colours (App's `<style>` unmounts with it), Reload and "Reload without the saved session"
  (clears `ebiki-study-session` + `ebiki-chat-session`, the usual re-crash source); keeps App's heartbeat contract
  (`/api/alive` beats, answers `ebiki:ping`, `/api/bye` on `pagehide`) so a shortcut-started server doesn't exit under
  it. Still guard AI and persisted data at the source (`cardText`, results normalized in `evaluateCardAnswers`): the
  boundary is the last resort.
- A failed load of ANOTHER deck clears the list (`deckNotesDeckRef`, `deck_loadFailed`); a deck SWITCH clears the
  listed notes at once (a scan started during the load filed the old deck's groups and "do not merge" pairs under the
  new deck). Quick Add's loop reads `quickAddCardsRef`.
- **Check card quality** judges EVERY card in the batch (`buildPrompt` states the count) for: unpinned sense,
  misspelled/nonexistent headword, a back too thin to learn from, wrong/unnatural content. General decks look for
  underspecified concepts. **Scan for duplicates** is framed per mode kind (general: term vs abbreviation; never merge
  distinct look-alike concepts).
- **Persists across tab switches.** Leaving only runs `syncDeckEditsToStudy()` (no `closeDeckBrowser()` teardown);
  returning does a SILENT refresh (`loadDeckNotes(deck, {quiet:true})` + quiet `ankiGetDecks`). `openDeckBrowser`
  keeps the persisted `deckBrowserDeck` (`ebiki-deck`) when it still exists. Scroll is stashed (`deckScrollTopRef`)
  and restored before paint (`useLayoutEffect` on `deckMainRef`), expiring after 3 min away (`deckLeftAtRef`).
- **Leaving the Deck tab pushes only notes SAVED there** (`deckEditedIdsRef`: editor, bulk commit, merge) into a live
  session, with functional setters. "Select a deck" bumps `deckNotesReqRef`.
- **Card search is accent-insensitive** (query and fields folded with
  `toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')`).

## Tap-a-word lookup
- Works on the question AND feedback surfaces: `renderTappableText(text, sentence, source)` +
  `renderWordLookupPopup(source)` (near `renderFeedbackNotes`). `lookupStudyWord(word, sentence, source)` stores
  `source` so the popup renders beside the clicked word. Wired into the 💡 Meaning Hint, graded cards
  (`graded-<ci>-<qi>`), Batch Results (`batch-<ci>-<qi>`). Language modes only.
- **Hooks and the Learn-it panel are tappable** via `renderTappableRich(text, source)` (bold + line breaks) and
  `renderTappableBack(back, source)` (tappable `cardBackToHtml`). Sources: `mnemonic-<ci>`, `deck-hook-<noteId>`, the
  popup's own source (re-looks-up in place), `learn-back`/`learn-hook`/`learn-chat`, each with its own popup mount.
  **New hook/teach surfaces must use these, not `<Markdown>`.**
- **`getCardBack` preserves line breaks** (`<br>`/block closers → `\n` BEFORE `stripHtml`).
- Explains in the APP language (`APP_LANG_NAME`), context-aware: in-context meaning (green) + other senses (purple).
- **On the LIVE question a lookup never shows the answer**: target/meaning/alternatives/`usage` are checked with
  `hintRevealsAnswer` against "the answers" = `questionAnswers(q)` (accepted + the correct MC choice, everywhere, also
  for word hints, which use the same fuzzy check); a hit shows `lookup_wouldReveal` (`blocked`: no audio, no card row)
  and is never cached. Saved hooks are filtered (`safeHooks`) and never merged into a blocked popup; the popup render
  hides card backs and hooks that leak (`leaks`).
- **Bidirectional (language modes), never pair-specific**: if the tapped word isn't in the learned language, it flips
  and teaches the learned-language side ("sound" → sonido). JSON field **`target`** (= the learned-language word; the
  tapped word in the normal direction); everything downstream keys on `wl.target || wl.word` (header "sound →
  sonido", the `Pronunciation` keyed remount, Make Anki card, hooks under `wordHookKey(target)`). A post-parse step
  merges the target's hooks + note (`studyWordFindExisting(target)`, fail-soft). Output dash-stripped (`deDash`).
- **"Make Anki card" is duplicate-aware**: `studyWordFindExisting` searches the target deck first; a note whose
  HEADWORD matches (case-insensitive but keeps ACCENTS: té is not te; front split on "/", "(…)" stripped;
  accent-variant search fallback since Anki search is accent-sensitive) shows "✓ Already in «deck»" (`wl.existing`)
  with NO add button. Anki offline or search errors fall through to generation. Word hook keys (`wordHookKey`) keep
  accents too.

## Stats
- **Live from Anki** when connected (effect on `activeTab==='stats'` → `ankiStats`): Cards Today
  (`getNumCardsReviewedToday`), 14-day chart + streak (`getNumCardsReviewedByDay`), accuracy = today's review-log pass
  rate (`ankiGetTodayReviewStats`, cumulative). Persisted to `localStorage('ebiki-anki-stats')`, hydrated on mount;
  offline falls back to `screenlens-study-history`. Dates are LOCAL `YYYY-MM-DD` (`toLocaleDateString('en-CA')`) to
  match Anki days. Chart weekday labels use the app language.
- **Every session reaches history**: `recordSessionHistory` runs from the summary effect AND `exitStudy` (Exit Study /
  a mode switch never reached the summary). Cards Wrap Up / End Now set aside unasked (`skipped`, no rating) are not
  listed in Batch Results and `rateGradedCard` refuses them (a rating was sent to Anki). "Generate Insights" needs a
  rated card and skips `gradeFailed` cards; its failure is `studyInsightsError`, so the button stays.
- Stats refreshes are sequenced (`ankiStatsSeqRef`); a failed read keeps today's earlier count. Chart and streak take
  the per-day MAX of Anki's count and local history; Cards Today (tile and Help) likewise is the larger of Anki's
  answers and today's history (practice-only days). Unknown accuracy is `null` (local history shown); no graded answer
  (a session, or today with 0 reviews) is accuracy `null`, never 0: the tile and Help's `accuracyToday` stay null
  (shown `·`), and Recent Sessions weights only entries that have one (`accW`). PBQ results carry `score` (fraction)
  for history accuracy; history rows need a string `date`. A chat `<progress-update>` written to the mode deck sets
  `deckProgressOkRef` (the file now holds exactly that).
- **Recent Sessions**: FIXED grid (82px | 1fr | 84px | 48px), rows grouped by (date, deck); cards summed, accuracy
  card-weighted. **One history entry per session** (`runId` = `studyRunIdRef`, minted in `beginStudy`, carried through
  a resume, upserted): the summary effect re-runs on every change (re-rate, hook, sync) and used to ADD an entry each
  time, multiplying the offline numbers. An upserted entry keeps its FIRST `date` (the effect re-runs after midnight).
  Progress notes are dated with the local date.

## Grammar-slip log (`modeGrammarLog`, per-mode blob `grammar`, language modes)
Every `grammar` note the grader writes (penalized or not) is saved via `addGrammarSlips(front, notes)` in
`evaluateCardAnswers`: `{t, front, n, at}`, deduped by folded text (repeats bump `n`/`at`), capped at 200 by LAST SEEN
(sorted on `at` first; a repeat kept its early array slot and was cut first). `grammarSlipBlock(limit)` (most frequent
first) feeds the Chat system prompt, the Learn-it chat, and Help (`appContext.grammarSlips`). Same store pattern as
`modeHooks`.

## Question reuse (opt-in token saver; `src/utils/questionBank.js`, `questionBank.test.js`)
Global `questionReuse = { enabled, maxPerCard }` (config.json, **default OFF**; `reuseSettings` clamps 1..50). Turned
on only by the user: Settings > AI & cost, or an UNTICKED checkbox on onboarding's intelligence step. **OFF means
off**: `createQuestionReuse` calls `generate()` and nothing else (no read, no write; tested). Never enable it from
code.
- **Saved per DECK** (the card's own `deckName`), one file per note: `decks/<deckDirName>/questions/<noteId>.json`
  (same per-deck folder as progress notes). `/api/question-bank` GET/POST `?deck=&note=` (note must be digits); the
  GET treats only ENOENT (or a damaged file) as "nothing saved" (`existsSync` was false on any stat error). DELETE
  `?deck=` clears that deck AND its subdecks (`Deck--Sub` folders): a clear sends `exact=1` plus each real subdeck
  name from Anki (`also=`); only with Anki's list unknown does the server fall back to folder prefixes. Clearing is
  per deck in Settings (deck picker, default = the mode's deck), confirm-gated, bumps `questionBankEpochRef`.
- `generateQuestionsForCard` / `generatePbqForCard` wrap `generateQuestionsFresh` / `generatePbqFresh` through
  `withQuestionReuse` (= `createQuestionReuse` fed the LIVE setting + clear counter via refs), so every caller gets
  it. New sets are generated and saved until one more would pass `maxPerCard`; then saved sets are asked again (least
  recently asked first, MC options reshuffled). Reusing skips every AI call for that card.
- Each set has `text` (card front + back, **ignoring the `[sound:]` tag and 🔊 credit line the audio embed adds**, or
  the first play retired the card's questions) and `sig` (kind, learned language, "Ebi speaks", typed vs MC, word
  hints, questions per card, dialect). Only same text + sig is asked. A different `text` (edited card) drops old sets
  on the next save; other `sig`s are KEPT (one deck studied from two modes), newest 40 sets per card. **Question-style
  preferences are deliberately NOT in the signature** (added often; each would retire every saved question); clearing
  a deck applies them. A language mode learning the APP language uses kind `flash-lang` (else it matched a general
  mode's signature).
- Writes re-check the live setting (turned off mid-generation = not saved) and the clear counter (a clear during a
  generation isn't undone by it). Never saved: after a FAILED read, the give-up fallback (`_fallback`), relearn copies,
  cards without a deck, or while `dataSwitchingRef` is set (`getEpoch` answers NaN). PBQs are saved whole (one
  exercise = one question). New sets and the asked-rotation are written through `updateBank` (fresh re-read;
  `allowMissing` for a first set); a reuse read first waits (3s cap) for that card's pending write.
- Returned questions carry `_bank {noteId, deck, setId, qi}`; **✎ Fix question** writes the fix into the saved set
  (only while reuse is on). `storableQuestion` strips session state. Fix and the word-hint save go through `updateBank`
  (read-modify-write serialized per card; two whole-file writes at once lost one of them).

## Question generation (`generateQuestionsForCard`)
- Non-language modes hide language-only controls and quiz on concepts.
- **Pin exactly one answer with an INLINE cue, ALWAYS** (not "if a synonym might fit"): a compact parenthetical in
  `quizLang` at the blank giving the precise sense, PLUS the first letter. Part of the question text; hint1/hint2
  don't count.
- **The first-letter cue is a deterministic guarantee** (helpers near `scrubHint`): every typed (non-MC) language
  recall/fill_blank goes through `needsLetterCue`; a miss is regenerated (same 3-attempt loop as the leak check), and
  as a last resort `appendLetterCue` adds a language-neutral skeleton (`sombrero` → `(s·······)`). `hasLetterCue`
  detects a cue by FORM (a single `\p{L}` in any quote style, incl. German/Polish `„“` and `‚‘`, or a skeleton), never
  by English phrases, AND only when that letter starts an accepted answer (or one of its words, split on spaces, "/"
  and apostrophes: "l'arbre" is cued by a; a Han answer also takes a quoted kana or Latin pinyin initial): a quoted
  one-character meaning (“雨”) or kana before a blank (で___) read as a cue. MC is exempt (a cue would leak).
  `fixCurrentQuestion` has the same guarantee. `generateConjugationQuestions` needs none (tense + subject pin the
  form).
- The general-mode leak exemption (`leakExempt`) covers the last question only when all `n` came back and `n > 1`; a
  last-resort scrub that blanks a whole quoted subject ("Translate: '___'", same-spelling words) drops that question.
  The give-up set's answers go through `expandSlashAnswers`; when the final attempt throws, the last parsed set gets
  the last-resort pass (`lastResort`) instead of the give-up set.
- **Deep/usage question** (`deepQ`, the last question on a language card) tests practical command (use in a sentence,
  pick over a synonym, the right form for a stated subject/time, opposite, collocation). Never asks to EXPLAIN
  grammar/spelling/etymology or use metalinguistic terms.
- **The cue renders visually distinct**: text split on `/(\([^)]*\))/`; `(...)` segments muted + italic. Cue words are
  still tappable and glossed. Their muted color lives in `.study-word-cue` (CSS), NOT inline, so `.study-word:hover`
  can still turn them red; italic/weight/opacity stay inline (`cueStyleNoColor`). The non-tappable general render uses
  inline `cueStyle`.

## Learned language vs "Ebi speaks" (don't conflate)
- `learnLang` (`studyRules.studyLanguage`) is ALWAYS the answer language; `quizLang` (`quizLanguage ||
  studyLanguage`) is only phrasing. "Learning Spanish + Ebi speaks English" → "Translate to Spanish: umbrella" →
  `paraguas` (a fill-in-blank sentence holding the answer stays in `learnLang`). `evaluateCardAnswers` uses
  `learnLang` for typo tolerance + the answer side, `quizLang` for feedback; the meaning hint + feedback chat use
  `quizLang`. Card generation uses `learnLang`.
- **Language names resolve through `langFromName`** (`src/config/languages.js`: exact label, whole-word label, then the
  `LANG_ALIASES` data table: "Mandarin", "Chinese", "Inglés", "日本語"...). Used by `learnLangName`, the
  Settings/start-screen pickers (shown as OPTION labels; zh app language = "Chinese (Simplified)") and
  `tesseractLang()` (LANGS codes are Tesseract codes; a language mode OCRs its learned language + eng). **Spoken
  varieties that share a script stay themselves** (`isDistinctSpoken`: Cantonese, Hokkien...): never folded into
  "Chinese (Traditional)" by `learnLangName`, `langInfo`, `createMode`/`buildModeFromSpec` or the pickers (Mandarin
  audio went onto Cantonese cards). OCR still maps them through `langFromName`. The defaults' `studyLanguage` is `''`
  (derived): 'English' there was written into any mode on its first study edit. Ask AI Accept (`acceptModeEdit`)
  shapes values with `modeFields`/`modeText` like createMode.
- **Start-screen pickers default like the GENERATOR**: unset `studyLanguage` → `learnLangName()` (mode name), never a
  hardcoded `'English'`. **General modes: unset "Ebi speaks" → the APP language** (`userLangName()`, what
  `interactionLangName` uses) on the start screen and in Settings → Study (`appLangLabel`). Picking any value writes
  `quizLanguage` per mode. Both pickers show for every mode (general: "Ebi speaks" only). Labels are `study*` i18n
  keys.
- **"Ebi speaks" in general modes**: `interactionLangName`/`generateQuestionsForCard` use `quizLanguage || app
  language`; only phrasing changes. The general block still forbids language-course questions, terms stay
  untranslated, and answers in ANY language are graded on understanding. `lookupStudyWord` treats the general question
  language as `quizLanguage`.
- **Inflection tolerance** (fill_blank): another form of the SAME lemma (tense/mood/person, gender/number) is accepted
  unless the sentence has a marker forcing one (time adverb, explicit subject, agreement). Generation adds that marker
  when it wants a specific form, else lists every valid form.
- The local matcher's `normalize` drops Arabic/Hebrew vowel marks and a leading French/Italian elided article (`l'`,
  `un'` only: `all'`/`dell'` are prepositions a blank tests), never in `stripAccents` (the accent drill must not demand
  harakat).
- **Gender/article**: the article encodes gender, so a correct article fully answers "gender and article"; no "state
  the gender" note (and "masculine" answers the article too). AGREEMENT WITH NO FIXED REFERENT (grader rule): with no
  stated person/thing ("alguien", a generic "you"), any agreeing form is correct and no agreement note is written (it
  also landed in the grammar-slip log).

## Word hints (`studyRules.wordHints`, ruby-style glosses)
Small translations above each non-tested word (language modes). The question model rarely returns `glosses`, so
`fetchGlossesForQuestion` fills them lazily (effect after `studyCardStateRef`, gated on `currentQuestion`/`wordHints`,
fires when missing OR empty, `glossFetchRef` de-dupes). **Bidirectional**: `learnLang` word → `userLang`, `userLang`
word → `learnLang`. Excludes the answer and anything revealing it (filtered with the fuzzy `hintRevealsAnswer` too);
`glossesNeedFetch` measures coverage on the UNFILTERED map (a withheld gloss is answered, else it re-fetched forever).
Every word gets the same stacked column (a blank slot when unglossed) so the baseline stays even.

## Notices and dialogs
- AI failures (credits / rate limit / bad key) show a toast; the secondary pose call is `silent`.
- **Three bottom-center toasts** (z 12001: above the settings modal and Ebi Studio 12000, under the dialog 12002):
  `modelHealNotice` (model auto-switch, 7s), `aiErrorNotice` (red, until dismissed), `successNotice` (green ✅, 6s;
  reuse it for any "done" feedback instead of adding a toast). **They share ONE `position:fixed` bottom-center flex
  column** (`pointerEvents:'none'`, each toast `'auto'`); a new toast goes inside it, never at its own fixed position
  (they covered each other). `createMode` runs on App, so closing Settings mid-create doesn't cancel it.
- **Esc handlers of nested popups call `preventDefault()`; outer handlers (SettingsModal) skip `defaultPrevented`**
  (respect `e.defaultPrevented`), so Esc in a dropdown closes only the dropdown, and a nested Esc (Help's dock
  chooser, capture phase) doesn't also close Settings.
- **NEVER `window.confirm` or `window.alert`; use `confirmDialog(message)` / `alertDialog(message)`** (App.jsx, next to
  the toasts): a promise-based themed modal (`appConfirm`, z 10002). `if (!(await confirmDialog('…'))) return`
  (callers async). Backdrop/Esc cancel, OK auto-focused. `alertDialog` is the same modal with `notice: true` (OK only);
  `promptDialog` adds a text field (`window.prompt` throws in Electron). **Dialogs QUEUE** (`openDialog` +
  `confirmQueueRef`): a second one used to replace the first, whose promise never resolved. The modal sits at z 12002,
  above ModeStudio (12000). It handles Esc/Enter in a WINDOW CAPTURE listener (Enter only when focus is outside it) and
  carries `data-app-dialog`; Ebi Studio carries `data-top-overlay`. SettingsModal ignores Esc while either exists;
  Studio ignores Esc while a dialog is up and marks its own Esc handled. Every Enter handler skips IME composition
  (`e.nativeEvent?.isComposing`); Settings' Esc (close, rename cancel) too (`isComposing` / keyCode 229).
- **Answer submits are claimed once per question state** (`claimSubmit`: session, card, question, answers and attempts
  count, answer text; cleared by "Back"): a double Enter or double tap on a card's last question graded it twice. PBQ
  submits use `pbqSubmittedRef`.
- **Adding cards is guarded against double clicks with REFS, not state** (a state flag read from the render-time
  closure lets two quick clicks both pass): `chatCardsAddingRef` (chat cards), `quickAddInFlightRef` +
  `quickAddBatchRef` (Quick Add), `pictureAddingRef` (Picture), `discoverSavingRef` + `discoverActedRef` (Discover),
  `conjAddingRef` (conjugation words), `modeCreatingRef` and Studio's `applyingRef` (modes). Card paths allow
  duplicates, so Anki doesn't catch it.
- **Exiting study warns about cards still being graded** (`study_exitGrading`): they have no rating yet, so the
  unsynced check never saw them and they were dropped silently.
- Images are non-draggable globally (`img { -webkit-user-drag: none }`), and `handleDragOver` requires
  `dataTransfer.types` to include `'Files'` (a dragged `<img>` tripped the drop overlay).
## Pronunciation audio (`src/pronunciation/`, 4 tiers, language-agnostic)
- **Embed**: download FIRST, then re-read the note and write (an edit saved during the download was overwritten);
  audio fetch times out (20s). An accented word matched only without its accents is `approximate`: plays, never
  embeds. Tier 0 prefers `[sound:ebiki-...]`, then the back field. One `Audio` plays at a time (`playingAudio`),
  paused on word change/unmount. `langInfo` falls back to `langFromName` (free-text names). A fetch still running
  when the popup closes never plays (`mountedRef`); its Anki embed still happens.
- `getPronunciation({word,lang,region,config,noteId?,cardId?})` tries: **0) Anki media** (`ankimedia.js`, the
  card's own `[sound:…]` via `retrieveMediaFile`; pass `noteId`/`cardId` when known) → **1) Wiktionary/Commons** →
  **2) local TTS** (opt-in) → **3) browser SpeechSynthesis**. Returns `{kind:'url'|'speak', audioUrl?/speak?(),
  source, attribution?, fileName?}` or null. Never throws. Cache key includes the card (`noteId || cardId`); a ↻
  pick drops the word's cached first choices so the card's newly embedded voice is used. **Cache SUCCESSES
  only** (nulls are usually transient), and only recordings (anki/wiktionary) enter the `getPronunciation` cache;
  🔇 stays clickable to retry.
  Wikimedia calls use `politeFetch` (~350ms spacing, one 2.5s retry on 429); `webspeech.js` never caches an empty
  voice list. Embeds are serialized per note (`embedChainRef`).
- `src/components/Pronunciation.jsx` resolves lazily on FIRST CLICK (no network on render), 🎙/🤖 badge. The
  tapped-word popup mounts one too.
- **Tier 1 (`wiktionary.js`)**: per edition, REST `media-list` ∪ `action=parse` wikitext regex (both load-bearing:
  es media-list returns 0; CJK filenames need media-list). Edition priority `config.editions[iso1] || [iso1,'en']`;
  editions are skipped until one has audio that RANKS. **Commons search fallback** (`searchCommonsFiles`,
  `intitle:<word> filetype:audio`) when no edition links audio. **Noise gate**: no language-convention evidence →
  below `STRONG_SCORE`; "Perro ladrando.ogg" dropped; bare "Perro.ogg" only if its categories prove a
  pronunciation recording (`looksLikePronunciationPage`). Long recordings merely containing the word are rejected.
  Empty candidate lists are never cached (a rate limit is not a miss).
- **Matcher** (`matcher.js`, vitest with REAL filenames) ranks: exact region (`en-us-…`) > bare language
  (`De-Haus.ogg`) > Lingua Libre (`LL-Q1321 (spa)-user-word.wav`; Q-id-only kept low) > wrong region > bare word;
  rejects files identifiably in ANOTHER language. Also knows `(spa)-Speaker-word`.
- **Attribution is mandatory** (CC-BY-SA, via Commons `imageinfo extmetadata`); no license → skipped (a file needs
  a LICENSE to play); compact players show a linked ⓘ credit. All `w/api.php` calls need `origin=*` +
  `Api-User-Agent`; every fetch fails soft to [].
- **Matcher word boundaries** count combining MARKS as part of a word (`[\p{L}\p{M}]`); a variant suffix may not
  start with a letter; a phrase match needs the whole word ("sol" never takes soldado/girasol). `approx` is set for
  ANY accent-only match (either direction). Accent-exactness is a WORD-bounded test (`exactRe`): a substring found
  "e" in a Lingua Libre speaker's name. One voice at a time includes browser speech (`stopSpeech`).
- **Tier 2 (`kokoro.js`) is strictly opt-in**: an empty `pronunciation.ttsUrl` (default) returns null instantly.
  When set: browser → `/api/tts` middleware → OpenAI-compatible `/v1/audio/speech`, cached in `cache/tts/` (only
  audio of 200+ bytes). `/api/tts` answers 502 for a non-audio reply so the browser-speech tier runs. Voices =
  `DEFAULT_TTS_VOICES` (Kokoro-82M) + overrides.
- **Tier 3 (`webspeech.js`)**: handles the `onvoiceschanged` race; exact dialect → base language → null.
  `VOICE_NOT_BASE` (zh-HK/zh-MO/yue) never stands in for the base on the fallback (Mandarin read in Cantonese).
- **↻ Different speaker** on every native result: cycles the ranked list (`resolveWiktionary({variant})`, wraps;
  variant>0 merges the Commons search; `candidateCache`), using only language-confirmed files when possible.
  Widening the list keeps already-ranked voices in place and appends new ones (a re-rank made variant 1 the file
  already playing). Picking calls `onNative(r, {replace: true})`, which swaps OUR previous `[sound:ebiki-…]` +
  credit (never other audio), removing the credit as loosely as `fieldSounds` (`&nbsp;`, trailing `<br>`). A wrap
  to the same file doesn't replay: it flashes an absolutely-positioned "only one recording exists" tooltip and
  retires. A null result keeps the button.
- **Anki embed (native audio only, never TTS)**: `embedPronunciationInNote` on first play from Study/Deck: fetch →
  `ankiStoreMediaFile('ebiki-…')` → append `[sound:…]` + credit via `ankiUpdateNote`. Idempotent (skips if the back
  has `[sound:`); toggle `pronunciation.embedInAnki` (default ON). Chat widgets never embed.
- **Surfaces** (language modes): study graded rows, deck rows, chat `<anki-card>` widgets. Region =
  `pronunciation.defaultRegions[iso1]` (Settings → Anki & audio, global; also editions/ttsUrl/ttsVoices/embed).
  Language data lives in `langcodes.js`; per-language tuning is data, never `if (lang === …)`. `pronWord()` strips
  "(pos)" and goes through `expandSlashAnswers` ("el/la estudiante" -> "el estudiante", never "el"); its fallback
  keeps a front whole only for a one-letter UNIT after a word (`km/h`), never an ending (tío/a, mi/s). Two or more
  different sense suffixes (`en-us-live-verb`/`-adj`) make those files `approx` (play, never embed).

## AI providers (`src/config/providers.js`): everything works on every provider
- **Everything routes through `aiCall`** → `PROVIDERS[provider].call(...)`: Chat, Study, Deck, Discover, Picture
  (vision), pose, and Help (`askAI` prop = `aiCall(..., resolveModel('help'))`), on Anthropic / OpenAI / Gemini /
  Grok. No feature hardcodes a provider.
- **Intelligence preset** (global `intelligence` = `optimized` | `normal` | `max`): each provider has
  `presets: { cheap, normal, max }` (all vision-capable). `ROLE_DEFAULTS(pc, intel, prov)`: `normal`/`max` put
  every role on that preset (pose always `normal`); `optimized` goes per role via `ROLE_TIER`. Per-feature
  overrides in Settings win. Chosen in onboarding, switchable in Settings → AI & cost.
- **Settings key and model inputs**: typed/pasted keys lose ALL whitespace (Gemini's key is in the URL); a paste
  cancels a pending typing check. A custom model id commits on blur/Enter (every keystroke was used by background
  calls). The per-feature `<details>` opens itself only on mount (bound to `hasModelOverrides` it snapped shut on
  the last reset). Model-list requests triggered by a typed key are debounced (700ms). `keyOfOtherProvider`
  (providers.js) marks a key with another provider's longer prefix invalid.
- **A `config.provider` this build doesn't know is ignored** (`PROVIDERS[...]` check at load and in the overlay
  refresh): a newer computer on the share crashed every screen. "Custom" preset = an override on a REAL role
  (`AI_ROLE_META`), not any key in `aiModels[prov]`.
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
  `ROLE_TIER` tier (memorized/graded → `max`, conversational/reviewed → `normal`, trivial/every-message → `cheap`);
  call `resolveModel('role')` (or `resolveModelFast` for latency-sensitive read/translate).
- **Model Advisor** (`src/config/modelAdvisor.js` + App.jsx): `selectIntelligence(preset)` applies a CACHED plan
  instantly (`modelPlans[prov][preset].plan`), then `ensurePresetPlan(prov, preset)` re-lists models in the
  background; only if new models appeared (or nothing was decided) does it research them (web search + strongest
  model → `modelCards[id]`), have the strongest model decide a role→model map over ALL available models, then PROBE
  the picks (`probeModel`, 1-token call; 403/404 = down, but a KEY error, incl. a 400 saying API_KEY_INVALID, is
  unknown, never down: it used to cache every model as down for a day) and re-decide without dead ones (probing the
  re-decided picks too). Any failure keeps tier `ROLE_DEFAULTS`. `probeModel` treats billing/credit text as unknown
  (not down); an empty model plan is never saved or treated as decided. Persisted:
  `modelPlans`/`modelCards`/`modelAvailability`; the overlay refresh also reads `modelPlans`/`rejectedModels`.
  `planDeciding` drives "Ebi is choosing models". **Test connections** (`runConnectionTest`) probes the whole
  catalog; if NOTHING answers it reports one connection error.
- **`visionTier`** (xAI: `max`): a provider whose cheaper presets are text-only; `aiCall` moves an image request that
  resolved to one of those presets onto that tier. **Image requests never land on a text-only model**
  (`textOnlyModels(prov)`): `aiCall` ignores a session sub pointing at one, and `tryModelFailover(..., hasImages)`
  excludes them.
- **Runtime failover**: in `aiCall`'s catch (after the retired-model heal), `tryModelFailover(prov, model, msg)` on
  403/404/429/5xx/overload picks a probed-working alternative (the pool excludes models that are themselves
  substitutes), registers `sessionSubs[prov][downId] = altId` (in-memory; `aiCall` routes through it everywhere,
  following the sub CHAIN A→B→C, max 3 hops), retries the call, and shows `modelFailover` (with Retry now). A
  1-minute effect re-probes; on recovery the sub is dropped and `fo_restored` shows. Can never throw. A
  reasoning-budget retry that fails or is still empty THROWS (`API <status>` / `API 200: empty`), never returns "".
- **Cross-provider request compatibility** lives ONLY in this layer. **OpenAI and Grok share
  `openAiCompatibleCall`.** Self-healing, not table-driven:
  1. **Token parameter**: send `max_completion_tokens` (accepted by every OpenAI model tested; `max_tokens` fails on
     o-series and gpt-5+). A 400 naming the new parameter falls back to `max_tokens` (xAI, local endpoints).
  2. **Reasoning budget exhausted, ERROR form**: with a system message (every Ebiki call) o4-mini returns 400
     "output limit was reached". Retry with a larger budget.
  3. **Reasoning budget exhausted, SILENT form**: 200 + empty content + `finish_reason:"length"`; Gemini 2.5+ does
     the same with `finishReason:"MAX_TOKENS"`. Same retry. Handle BOTH forms.
  4. **Anthropic per-model output cap**: "max_tokens: 8000 > 4096 … for claude-3-haiku" → retry at the number the
     error names (goes DOWN).
  **`MIN_CONTENT_BUDGET` (64) keeps `probeModel` (`maxTokens: 4`) out of every retry** (Test connections probes ~70
  models). Errors keep the `API <status>: <body>` shape (`healRetiredModel`, `tryModelFailover`, `probeModel` parse
  it). Covered by `providers.test.js` (stubbed fetch). **Add a case there when adding a provider or touching a
  request body.**
- **Every provider request carries a timeout** (`CALL_TIMEOUT_MS` 5 min, `LIST_TIMEOUT_MS` 30s; Wiktionary 15s):
  a stalled connection left Chat "typing" forever with its send lock held. Tested in `providers.test.js`.
- **A blocked/refused reply THROWS `API 200: blocked (<reason>)`** (OpenAI/xAI `content_filter`, Anthropic
  `stop_reason: refusal`, Gemini `promptFeedback.blockReason` or a SAFETY-family `finishReason`, each only with no
  text): as "" it became a saved blank chat bubble. Status 200 keeps it out of the heal and failover;
  `probeModel` counts it as reachable. Tests in `providers.test.js`.
- **No forced JSON** (`response_format`/`responseMimeType` would break free-form chat; OpenAI errors unless the
  prompt says "json").
- **ALWAYS parse AI JSON with `parseAiJson(text)`, never bare `JSON.parse`** (strips noise, repairs slop, salvages
  complete objects from truncated arrays). Stage 2b, after the strict stages and before salvage, escapes unescaped
  quotes inside values (`escapeInnerQuotes`: a quote closes a string only before `, : } ]` or the end).
- **Staying current: two different mechanisms.** A model that still works never errors, so the heal alone never
  upgrades.
  1. **Retirement heal (reactive)**: `healRetiredModel`, only from `aiCall`'s catch on `isRetiredModelError`
     (404/not-found; never true for a 429/5xx: an "overloaded" 503 with status UNAVAILABLE matched the words), via
     `discoverCurrentModel` (`listModels()` + tier family preference; skips preview/tts/image/audio/embedding ids).
     Runs for the FAILING call's provider (`healRetiredModel(..., prov)`), tries the dead model's own family first
     (newest listed, below any higher tier's model: `ceiling`), saves a replacement only if `probeModel` did not
     say false, and repoints `sessionSubs` that targeted it. Heals at PRESET scope when the dead id was a tier; a
     retired model PINNED for a role heals at that role's `ROLE_TIER`, never at the strongest tier.
  2. **Daily currency check (proactive)**: `findModelUpgrades` polls the active provider's `listModels()` at most
     once per 24h (`lastModelCheck`), compared via `src/config/modelVersions.js`
     (`parseModelId`/`compareModels`/`pickUpgrade`, `modelVersions.test.js`). A strictly newer model in the SAME
     family (never cross-family, never `-preview`) raises a Yes/No modal. Yes → `adoptModel` writes
     `modelPresets[prov][tier]` (shadows providers.js everywhere). No → `declineModel` records the model ID in
     `rejectedModels` (a newer one may still ask). Gated behind `onboarded`.
  - **An upgrade never climbs INTO a higher tier**: families span tiers (gemini-2.0-flash cheap, 2.5-flash normal),
    so a candidate equal to or newer than a higher tier's model in the same family is skipped.
  - **Onboarding never asks**: once the key is entered it silently adopts the newest per tier (`pickNewest`).
  - `modelVersions.js` is pure and provider-agnostic (it classifies id segments, so `claude-3-5-sonnet` and
    `claude-sonnet-4-6` share a family). Versions compare left to right (`[5]` > `[4,8]`); a dateless alias and its
    dated snapshot compare EQUAL. Extend the tests for new id shapes.

## Token and cost counter (`src/utils/tokenUsage.js`, `src/components/TokenUsageMeter.jsx`)
- **Counting lives in the provider layer**: `setUsageListener` (providers.js) receives every SUCCESSFUL request's
  usage (`readUsage`: Anthropic `usage` incl. cache tokens, OpenAI/xAI `usage`, Gemini `usageMetadata` with
  `thoughtsTokenCount` as output), retries and probes included. App registers `recordUsage` once; tracking always
  runs, the setting only shows the counter. A new provider must call `reportUsage` in its request helper.
- Totals are MACHINE-LOCAL: `/api/usage` (GET, POST `{add:[...]}` / `{reset:true}`) keeps `logs/token-usage.json`
  (gitignored, not in `DATA_ROUTES`), so the app window, a browser tab and the overlay add to one total. The client
  batches reports (3s) and keeps a failed batch for the next flush. The pill shows this window's session.
- Global `showTokenUsage` (config.json, default OFF), toggle in Settings > AI & cost. The counter is portaled to its
  own host under `<html>` (outside the body zoom, scaled by transform like Dropdown); never in the overlay.
- **Prices are estimates and never guessed**: `PRICE_TABLE` (USD per million, first match wins, specific before
  family). An unknown model shows tokens only and is listed as unpriced. Opus prices changed between versions, so
  only known Opus versions are priced. Tests: `tokenUsage.test.js` (all four providers).
- **"Set price"** (by-model rows in the panel): the user types a model's price (USD per million, in and out);
  stored in `token-usage.json` `prices` (`{setPrice:{provider, model, price|null}}`, kept across a reset), winning
  over `PRICE_TABLE` (`priceFor(..., prices)`). This is how the newest models get a cost: never add a table price
  that isn't published.


## Testing (two halves; `npm test` is only the first)
- `npm test` (vitest) covers pure modules: pronunciation matcher, PBQ engine, usage tags, modelVersions,
  providers, env/keys, discover storage, study hints. Nothing about layout or click paths.
- **run-ebiki skill** (`.claude/skills/run-ebiki/`, committed tooling, never bundled): `npm run dev`, then
  `npm run drive` (headless Chrome/Chromium/Edge; screenshots + console errors; no AI calls). `--studio "brief"`
  exercises Ebi Studio and **spends API credits**. Details and traps: its SKILL.md.
- Verify UI changes THERE, not by reading JSX: `body { zoom: 1.35 }` breaks `position: fixed` boxes, and only
  measuring catches it (`panelBox()`).

## README style
- User-facing: what the app is, what each tab does, setup and use. Tight, no filler or hype; cut words, not
  information.
- No developer internals (prompt/function names, algorithm walkthroughs, file trees); those live here.
- Describe each feature once. Keep it accurate (shortcuts, model versions, renamed/removed features).

## Commits
- **Bump `package.json` `version` in every commit that changes app behavior** (see Version).
- **NEVER name the AI assistant that wrote the code anywhere that reaches git or GitHub** (the repo is PUBLIC): not
  in commit subjects/bodies, PRs, issues, branch names or new code comments, and no attribution trailers
  (`Co-Authored-By`, `Generated with ...`). Describing a provider bug: "another provider" / "one provider". **Grep
  every commit message for `claude|anthropic|co-authored|generated with` before committing.**
- **The ban is on ATTRIBUTION, not the PRODUCT.** Anthropic is one of the app's four providers, so functional
  mentions stay: the `Anthropic (Claude)` label, `api.anthropic.com`, `claude-*` model ids, family parsing in
  `modelVersions.js`, and the `.claude/skills/run-ebiki` path used by `package.json`'s `drive` script. Test: does
  the text describe a provider the app talks to (keep) or who wrote the commit (remove)?
- Don't commit to `master` unless asked; the user asks for pushes to `master` explicitly.
