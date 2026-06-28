# Discover Mode — Adaptive Card Discovery (Design Plan)

> Status: **Implemented** (all phases). Last updated: 2026-06-14.
> Files: `src/discover/storage.js`, `src/discover/prompts.js`, `src/components/DiscoverPanel.jsx`,
> wiring + logic in `src/App.jsx`, media wrappers in `src/utils/anki.js`, fallback endpoint
> `/api/discover-store` in `vite.config.js`.
>
> Purpose: a new sub-mode in the **Deck panel** that helps the user **discover and create
> *new* flashcards** to expand what they're learning — calibrated to how advanced they
> already are. It is NOT a quiz over existing cards. Every suggestion is a *new* item the
> user does not already have.

## 1. Concept

Inside the Deck panel, add a **Browser / Discover** toggle. Discover runs an interactive loop:

1. The app builds/loads a **Learner Profile** for the active mode (estimated level, known
   concepts, gaps, declined items).
2. The AI proposes **one new candidate at a time** — a word/concept calibrated to that level.
   - Advanced Spanish learner → `no obstante`, not `manzana`.
   - Beginner → `manzana`, not the imperfect subjunctive.
   - CompTIA/general → a term from the user's least-covered topic area.
3. The candidate is optionally **web-grounded** (reusing `/api/web-search`) so its facts are
   verified before being shown — guards against hallucination.
4. The user picks an action:
   - **Make Card** → runs the existing card generator, lets them refine, syncs to Anki.
   - **I Know This** → "I already know this word, don't card it." Recorded so it's never
     suggested again; nudges the level estimate up. (Not a test — just a skip.)
   - **Skip / Not Interested** → recorded as declined; never suggested again; no level change.
   - **Next** → advance to the next suggestion.
5. Every action updates the profile/ledger, so suggestions sharpen over the session.

**Defining idea:** a single persistent **Learner Profile** is the "brain." Everything
(cards, Anki scheduling stats, feedback chats, progress observations, knowledge base) feeds
*into* it; the suggestion engine reads *from* it.

## 2. Decisions (confirmed with user)

- **Placement:** its own top-level **Discover** tab (Chat · Study · Deck · Discover · Picture · Stats). (Originally a toggle inside the Deck tab; promoted to a full tab.)
- **Level model:** **smart per-subject** (see §5). Languages are the primary use case, but the
  design must let a user learn **any** subject, so the scale is chosen dynamically by the AI
  per mode, with a generic beginner/intermediate/advanced fallback for arbitrary subjects.
- **Scope:** generating NEW cards only. Never quizzes existing cards.

## 3. What already exists (build on this, don't rebuild)

| Capability | Where |
|---|---|
| One AI call helper for all 4 providers | `providerConfig.call(apiKey, system, user, modelOverride)` — `src/config/providers.js` |
| Web search proxy (DuckDuckGo) + citation parsing | `/api/web-search` `vite.config.js:592`; pattern in `sendChatTabMessage` `src/App.jsx:2786` |
| Per-deck proficiency record (`progress-observations.md`) | `/api/deck-progress` `vite.config.js:492`; written by `generateStudyInsights` `src/App.jsx:2499` and deck-chat `<progress-update>` tags `src/App.jsx:2828` |
| Card generator (term → templated card) | `src/App.jsx:~1335-1425` → `syncToAnki` → `ankiAddNote` |
| Per-card mastery signal (interval/ease/lapses) | `ankiFindCards` + `ankiCardsInfo` — `src/utils/anki.js:58,65` |
| Deck cards + progress load for context | `chatTabAttachDeck` `src/App.jsx:2736` |
| Chat history (study/feedback) | `/api/chats` `src/App.jsx:243`, `vite.config.js:525` |
| Knowledge base files | `/api/modes/knowledge` `vite.config.js:187` |
| Existing "Analyze deck" sub-feature in Deck tab | `analyzeDeck` `src/App.jsx:1636`, UI `~3843` |

## 4. New data model (per mode)

**Storage = Anki media files (cloud-synced), with a local-file fallback.** See §6 for the
storage layer. Each mode gets two JSON blobs stored as Anki media with a leading `_` so Anki
never garbage-collects them, and they ride the media-sync channel to AnkiWeb (officially
documented AnkiConnect behavior for config files):

```
_screenlens/profile__<Mode>.json     <- learner profile (synthesized)
_screenlens/ledger__<Mode>.json      <- discover ledger  (event log)
```

When Anki is offline we read/write the same JSON to `modes/<Mode>/learner-profile.json` and
`modes/<Mode>/discover-ledger.json` as a fallback cache; on next connect, the Anki copy is the
source of truth (write-through to both when Anki is up).

### profile blob (`_screenlens/profile__<Mode>.json`)
Synthesized judgment of the user's level. Regenerated on demand / periodically; can be shown
to (and edited by) the user.

```jsonc
{
  "updatedAt": "2026-06-14",
  "level": { "scale": "CEFR", "estimate": "B1", "confidence": 0.6 },
  "domains": [ { "name": "Subjunctive mood", "coverage": 0.3, "status": "weak" } ],
  "summary": "Comfortable with present/preterite; weak on subjunctive and idioms.",
  "evidenceCounts": { "cards": 142, "sessions": 9, "feedbackChats": 3 }
}
```
- `level.scale` is chosen by the AI from the mode type (see §5).

### ledger blob (`_screenlens/ledger__<Mode>.json`)
Append-only event log. Cheap to update on every click; never needs the AI. Prevents repeats
and feeds difficulty.

```jsonc
{
  "known":    [ { "term": "manzana", "ts": "..." } ],
  "declined": [ { "term": "verbigracia", "reason": "not interested", "ts": "..." } ],
  "carded":   [ { "term": "no obstante", "noteId": 1699, "ts": "..." } ],
  "offered":  [ "manzana", "no obstante" ]   // dedupe set fed into every suggestion prompt
}
```

Two blobs because the profile is a *synthesized judgment* (expensive, occasional) while the
ledger is a *fast event log* (every click).

## 5. Level model — "smart per-subject"

The level model = how the app represents "how advanced you are" so suggestions aren't too
easy/hard. The app derives it automatically from cards + feedback + history; the user never
sets it manually.

The AI picks the right `scale` based on `activeMode.type` / `activeMode.description`:

- **Language modes** (`type: "language"`) → **CEFR** (A1 → C2). Suggestions target
  `level ± one notch`, biased toward weak domains.
- **Cert/exam modes** (e.g. CompTIA) → **domain-coverage**: track the exam's objective
  domains and how covered each is; suggest from the least-covered domain. Web search can
  confirm the current objective list (e.g. Security+ SY0-701 domains) so it isn't hallucinated.
- **Any other subject** → **generic tiers** (beginner / intermediate / advanced) plus a freeform
  topic list. This is the fallback that makes "learn anything" work.

The suggestion prompt always says, in effect: *"Learner is `<level>`. Do not suggest items at
or below `<level-1>`. Exclude this list: `<offered/known/declined>`. Prefer weak/under-covered
areas."*

## 6. Storage layer (Anki media files + local fallback)

**Primary store = Anki media files, synced to AnkiWeb.** This makes the metrics follow the
user across machines for free, with no fake decks/cards polluting the deck list or study counts.

Verified viable (researched 2026-06-14):
- AnkiConnect's `storeMediaFile` docs explicitly support this: *"files stored via storeMediaFile
  are still synchronized to AnkiWeb. To prevent Anki from removing files not used by any cards
  (e.g. for configuration files), prefix the filename with an underscore."*
- Anki manual: leading-`_` media is intentionally ignored by **Tools → Check Media**, so it's
  never reported as unused or auto-deleted. **Check Database** / **Empty Cards** only touch
  notes/cards, not media — also safe.
- Caveat: media is a separate sync channel; a forced one-way "download" sync follows normal
  Anki rules. Fine for single-user. AnkiConnect is desktop-only, so phones/AnkiWeb receive the
  synced data but don't write it (non-issue — Ebiki is desktop).

Add two thin wrappers to `src/utils/anki.js` (alongside the existing `ankiAddNote` etc.):
- `ankiStoreMediaFile(filename, base64Data)` → AnkiConnect `storeMediaFile`.
- `ankiRetrieveMediaFile(filename)` → AnkiConnect `retrieveMediaFile` (returns base64 or false).

Read/write helpers (in `App.jsx` or a `src/discover/` module):
- `readBlob(name)` → `ankiRetrieveMediaFile` → base64-decode → `JSON.parse`; on Anki-offline or
  `false`, fall back to the local `modes/<Mode>/*.json` cache.
- `writeBlob(name, obj)` → `ankiStoreMediaFile` (base64 of JSON) **and** write the local cache;
  trigger `ankiSync()` (already called after card creation) so it reaches the cloud.

**Local fallback endpoints** (only needed for the offline cache — mirror existing
`/api/deck-progress` middleware, which already does safe path resolution + JSON I/O):
- `GET/POST /api/learner-profile?mode=<name>`
- `GET/POST /api/discover-ledger?mode=<name>`

No new dependencies. Web-search and existing Anki proxies unchanged. Exclude any `_screenlens/*`
artifacts from user-facing deck pickers (none expected, since this uses media not decks).

## 7. Profile builder (`buildLearnerProfile`)

New function in `App.jsx`, modeled on `generateStudyInsights` (`src/App.jsx:2499`). Runs on
first open of Discover, or via a **"Re-analyze my level"** button. Cheap-skips if `updatedAt` is
recent and there's no new evidence. Aggregates:

- Card text — `ankiFindNotes` + `ankiNotesInfo` (as in `chatTabAttachDeck`).
- **Per-card mastery** — `ankiFindCards` + `ankiCardsInfo` (interval/ease/lapses).
- Progress observations — `/api/deck-progress`.
- Feedback/study chats — `/api/chats`.
- Knowledge base — `/api/modes/knowledge`.

Summarize → one AI call → returns strict `learner-profile.json` (reuse the
``JSON.parse(text.trim().replace(/```/...))`` hardening used throughout). Cap deck size like
`analyzeDeck` does (`>200` cards → confirm, `src/App.jsx:1639`).

## 8. Suggestion engine (`fetchNextSuggestion`)

Input: profile + ledger. Output: one candidate:

```jsonc
{ "term": "no obstante", "partOfSpeech": "conjunction", "translation": "nevertheless",
  "why": "you're solid on basics but light on formal connectors",
  "difficulty": "B1", "domain": "connectors", "draftMeaning": "..." }
```

- Targets `level ± one notch`; biased to weak/under-covered areas; excludes the ledger lists.
- **Web grounding (optional toggle):** before showing, `GET /api/web-search?q=<term + meaning>`,
  pass results back to reconcile/correct `draftMeaning`, render source chips (reuse
  `sendChatTabMessage` pattern `src/App.jsx:2792-2799`). Only the *draft* is AI; the shown
  meaning is reconciled with sources.
- **Prefetch the next suggestion** in the background while the user reads the current one
  (same "stream first, generate rest in background" idea used in study sessions).

## 9. UI (Deck panel)

New state `deckMode: 'browser' | 'discover'`; toggle near the `analyzeDeck` button (`~3843`).

```
+- Discover . Espanol . Level B1 ----------------- [Re-analyze] -+
|  Suggestion                                                 |
|  +-------------------------------------------------------+  |
|  |  "no obstante"  (conjunction)                         |  |
|  |  -> "nevertheless / however"                          |  |
|  |  Why: solid on basics, light on formal connectors.    |  |
|  |  verified . [source chips]                            |  |
|  +-------------------------------------------------------+  |
|  [ Make Card ]  [ I Know This ]  [ Skip ]  [ Next > ]       |
+------------------------------------------------------------+
```

- **Make Card** → reuse the extracted `generateCardFor(...)` helper (§10) → editable card
  preview + refine box (already built) → `syncToAnki`. On success: ledger `carded` + `offered`.
- **I Know This** → ledger `known` + `offered`; bump level confidence; fetch next.
- **Skip / Not Interested** → ledger `declined` + `offered`; fetch next.
- Light local profile nudge per action; full `buildLearnerProfile` re-run only on demand / every
  N actions.

New state (next to `deckAnalyze*`, `src/App.jsx:210`): `discoverActive`, `discoverProfile`,
`discoverSuggestion`, `discoverLoading`, `discoverLedger`, `discoverWebVerify`, `discoverNextPrefetch`.

## 10. Card-generation refactor (small, low-risk)

The current generator is keyed off an OCR `word` object inline at `src/App.jsx:~1335-1425`.
Extract a `generateCardFor(term, { partOfSpeech, translation })` helper so both the picture
flow and Discover mode call the same code path — keeping card formatting/tags identical to today.

## 11. Phased milestones (each independently shippable)

- **Phase 1 — Profile foundation.** Storage layer (Anki media wrappers + local fallback);
  `buildLearnerProfile`; read-only profile card in the Deck tab.
- **Phase 2 — Suggestion loop (no web).** Discover toggle + UI; `fetchNextSuggestion`; ledger
  writes; 4 action buttons; reuse card generator.
- **Phase 3 — Web grounding.** Verify toggle + source chips; prefetch next.
- **Phase 4 — Feedback into profile + non-language polish.** Ledger deltas + periodic
  re-analyze; "level went B1 -> B1+" nudges; domain-coverage view for cert/general modes.

## 12. Risks & mitigations

- **Cost/latency** (profile build reads whole deck + chats): gate behind explicit open/refresh,
  cache via `updatedAt`, cap card count (`>200` confirm).
- **Repeats / already-known suggestions:** ledger `offered` exclude-list + "I Know This"; pass
  the list into every suggestion prompt.
- **Hallucinated facts:** web-verify toggle + citations; shown meaning reconciled with sources.
- **Anki offline:** Discover degrades gracefully — profile still builds from chats/observations/
  knowledge; card text just won't be available (same fallback `chatTabAttachDeck` tolerates).
- **Monolith size:** `App.jsx` is ~5,400 lines. Keep Discover logic cohesive; consider a
  `src/discover/` module for prompts + the builder to avoid further bloat.
