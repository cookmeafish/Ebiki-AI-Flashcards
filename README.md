# Ebiki — AI-Powered Learning & Study Platform

A multi-tab learning app with AI chat, Anki-integrated study sessions, screen translation, and progress tracking. Supports multiple learning modes — from language learning to CompTIA certifications and beyond.

> **The name & the mascot.** *Ebiki* is a play on **ebi** (海老 — Japanese for *shrimp*) and **Anki**. The app's helper is **Ebi**, a little red shrimp. Ebi's pose changes to match whatever you're doing (working, fighting a two-handed sword question, eating cheese, etc.), and the in-app assistant — opened from the **"Ask Ebi"** button in the header — speaks as Ebi.
>
> **Look & feel.** Ebiki uses an **Ocean Light** theme built around Ebi's red (`#DF2540`) as the single focus color — Duolingo-style, where the brand color flows from the mascot. Rounded friendly type (Baloo 2 + Nunito), soft white cards, and playful press/hover motion. A **dark mode** is toggleable in Settings → Appearance (CSS-variable themed, persisted, no flash on load). Design tokens live in `src/config/tokens.js`. To add a new Ebi pose, see `CLAUDE.md`.

## Features

### Tabs
- **Chat** — AI conversational assistant for learning, with inline Anki card generation, deck attachment for personalized tutoring, web search, and persistent conversation history
- **Study** — Anki study sessions with AI-generated questions, a relaxed multiple-choice practice mode, verified PBQ exercises (match/order/sort) for certification subjects, deck browser, typo correction, feedback chat, "I know this" card deletion, "I Don't Know" skip, wrap up/end now controls, and spaced repetition insights
- **Deck** — Browse/edit/search deck cards, add cards manually or with AI, analyze for ambiguous cards, scan for duplicates to merge
- **Discover** — Adaptive suggestions for new cards calibrated to your level, with a setup screen and web verification (see below)
- **Picture** — Screen capture/OCR/translation with pixel-accurate word overlays, overlay mode for games
- **Stats** — Study streaks, accuracy trends, per-deck breakdown, and recent sessions

### Core Features
- **First-run onboarding** — an Ebi-guided wizard walks new users through app language → light/dark → AI provider + key → first study mode. Re-runnable anytime from Settings → General
- **Unified Settings** — one ⚙ modal with a scoped sidebar: **App settings** (General — appearance, app language, translation · AI models) vs **Mode settings** (Study · Cards & Anki · Knowledge base · Screen overlay · Learning modes). A quick mode-switcher stays in the header
- **Light & Dark themes** — Ocean Light by default, dark mode toggle in Settings → General (persisted, no flash on load)
- **Multi-provider AI** — Claude, GPT, Gemini, and Grok
- **Configurable models per feature** — each app area (Picture, Deck, Study, Discover, Chat, Help, **Mascot**, General) has its own model, chosen from a **dropdown** of the provider's live model list, **or type a custom model id** (future-proof). Blank = the provider's default, which is shown so you always see the model in use
- **Check for new models** — a button fetches the latest models from the provider's API so new releases appear automatically; the list is cached and auto-fetched
- **Self-healing models** — if a configured model has been retired (e.g. an API 404), the app queries the provider's models API, switches to a current model, retries, saves the choice, and shows a toast
- **Ask AI to edit settings** — in Cards & Anki and Study, describe a change and the AI proposes it as a **before/after diff** you Accept / Deny / refine — nothing is applied without confirmation
- **App language** — translate the entire UI (tabs, buttons, labels) into English, Spanish, Chinese, or Japanese; flashcard content is never translated
- **Learning modes** — Create AI-configured modes for any subject (languages, Security+, Organic Chemistry, etc.)
- **Anki integration** — Generate flashcards, sync to Anki, study with AI quizzes, browse/edit decks
- **Pronunciation audio** — real native-speaker recordings (Wiktionary/Wikimedia Commons, with credit) on study cards, the deck browser, and chat cards; ↻ cycles through different speakers; native audio is embedded into the Anki card (`[sound:…]`) so it plays in Anki on any device. Falls back to an optional local TTS server, then the browser voice — see **Pronunciation audio** below
- **Knowledge base** — Upload .txt/.md/.pdf reference materials per mode; the content flows into study questions, grading, chat, card generation, Discover, and Ebi's Help. Whole books are navigated by their table of contents so only the relevant sections are used per task
- **Progress tracking** — Per-deck progress observations saved to disk, AI tracks struggles and improvements across sessions
- **Discover Mode** — Adaptive new-card suggestions calibrated to your level (CEFR / exam domains / tiers), web-verified, with cloud-synced learner profile stored as Anki media files
- **18 languages** — Spanish, French, German, Japanese, Korean, Chinese, Russian, Arabic, etc.

### Chat Tab
- Full AI chatbot for explaining concepts and answering questions
- Ask the AI to create Anki flashcards inline — cards appear with preview, edit, and sync controls
- Attach an Anki deck for personalized tutoring — AI reads all cards + progress observations to focus on weak areas
- **Web search** — toggle the globe button to search the internet before AI responds, with clickable source citations and live status indicators (searching, found results, analyzing, etc.)
- **Per-mode starter prompts** — the empty state offers subject-specific suggestion chips (generated with the mode at creation, backfilled for older modes), plus an always-present "💬 Just chat with Ebi" for casual conversation
- Conversation history persisted to disk (`chats/` directory) with session management sidebar
- AI can auto-update progress observations when it discovers new struggles or improvements

### Study Tab
- **Learning vs "Ebi speaks"** — for language modes, "Learning" is the language you answer in (always), while "Ebi speaks" is just the language Ebi phrases questions and feedback in. So learning Spanish with Ebi speaking English asks *"Translate to Spanish: umbrella"* and expects `paraguas`; switch Ebi to Spanish for an immersive session. General modes (history, certs) get "Ebi speaks" too, so Ebi can quiz you in any language
- **Word hints** — an optional toggle that floats a small translation above every word you're *not* being tested on, so you can read a question in a language you're still learning. Bidirectional: it shows your language above target-language words, and target-language words above your-language words (vocabulary practice even from an English prompt). Never reveals the answer word
- **Instant answer feedback** — typed answers flash **✓ green** when they match the expected answer (checked locally, no AI wait), **⏳ amber "Ebi will check this one"** when only the AI grader can judge them (explanations, concept answers), and a **red ✗ shake** on a wrong attempt that gets a hint retry
- **✎ Fix question** — spot a badly formed question *before* answering? Tell Ebi what's wrong and it regenerates that question in place — and remembers the preference so future questions avoid the same mistake
- **Teach Ebi how to ask** — question style is steerable per mode without touching code: complain in the feedback chat under any graded card ("prefer scenario questions", "keep questions short") or ask Ebi's Help directly, and the rule is saved to the mode and injected into all future question generation. Saved rules are visible and editable in Settings → Study → Question style preferences
- **The answer never leaks into the question** — a hard guarantee, not a prompt hope: every generated question (and Meaning Hint) is checked for the answer or its close forms; violations are regenerated with the mistake named, and a last-resort scrub blanks anything that slips through
- **Progress you can see** — a session progress bar in the header ("3/6 cards", accounting for cards still waiting in the pool) plus per-card question dots showing which question of the card you're on
- **Instant start** — first card appears immediately (one AI call), remaining cards generate in the background while you answer
- **Smart question ordering** — Q1 is always blind recall (never names the target word), middle questions use guided recall/synonym contrast, last question is deep understanding (can name the subject). Scales to any questions-per-card setting
- **Unambiguous fill-in-the-blank** — when a target word has synonyms (huir/correr, recíproca/mutua), the question embeds a small cue right at the blank — the word's precise sense plus its first letter when needed — so exactly one answer fits and you're never left guessing which synonym Ebi wants. The final "depth" question tests *practical* usage (use it in a sentence, pick over a synonym, opposite) and never asks you to explain grammar or spelling rules
- **Hint system** — wrong answer on a recall question shows a letter-count hint ("9 letters"); wrong again shows a first-letter hint ("starts with 'i'"). Button changes to "Try Again". Applies to any question type with multiple possible answers
- **Back button** — undo your last answer and retry the question, as long as that card hasn't been synced to Anki yet
- **10-card continuous system** — 10 cards active at once, questions randomly interleaved. When a card completes, a new one is pulled from the pool automatically
- **Card front hidden** — questions don't reveal which card they belong to, preventing answer leakage
- **Zero-delay answers** — answers recorded instantly with no AI call. Next question appears immediately
- **Batch evaluation** — AI evaluates all answers for a card at once in the background, only after the last question is answered
- **Inline feedback** — completed card feedback appears below the active question as evaluations finish, so you can review while continuing to answer other cards
- **Previous attempts shown** — results view shows all retry attempts grayed out above the final answer
- **Smart evaluation** — for language learning, typos in the response language (e.g. English typos when studying Spanish) don't count against you. A different valid form of the *same* word is also accepted — e.g. present "huye" is correct for a tense-less sentence even if the card expected preterite "huyó" — unless the sentence actually signals the tense (a time word, explicit subject, or agreement)
- **I Don't Know** — give up on the whole card: after a confirmation prompt, all remaining questions are skipped and marked wrong and the card is rated Again (the review records in Anki via auto-sync). The confirmation guards against a misclick
- **Color-coded feedback** — each result's notes are categorized and colored: ✓ what you got right (green), ✗ incorrect/factual error (red), ✎ grammar/spelling/accents (orange), ◆ word choice/term (purple), + missing detail (teal), ➜ tip to improve (blue). Works for language *and* general modes. A **Color legend** button explains the colors
- **Feedback chat** — after feedback is revealed, chat with AI to fix typos, flag out-of-scope questions, or request card updates. AI trusts student corrections, never argues, and replies in the quiz language
- **Card updates from feedback** — AI can update Anki card content to add clarity
- **Rating sync (with a correction window + lock)** — ratings reach Anki three ways: a **"Sync now"** button during study, a per-card **grace timer** (configurable in Settings → General → Anki auto-sync, default 5 min after the card is graded), and on **Finish/Exit**. Until a card syncs you can freely correct its rating (e.g. AGAIN → EASY); once synced it **locks** (🔒) so it's answered in Anki exactly once with its final rating, never "again then easy" (which would lapse a mature card). Syncing drives Anki's real reviewer so intervals are computed by Anki itself. The graded-cards list is collapsed behind a **"Show graded cards"** toggle, newest on top, each tagged ● not synced / 🔒 Synced
- **"I know this already"** — delete cards you've mastered with AI confirmation
- **Smart Wrap Up** — immediately drops all unstarted cards (0 answers), finishes only in-progress ones. Session ends as fast as possible without abandoning cards you already started
- **End Now** — immediately end session with partial results
- **Spaced repetition insights** — AI analyzes session results and updates `decks/<deck>/progress-observations.md` with struggles, improvements, and mastered topics
- **Multiple-choice practice mode** — pick **Answer style: Multiple choice (relaxed)** on the session start screen for a laid-back session: every question comes with 4 shuffled options (keyboard 1–4 works), your pick is graded instantly with a green/red flash — no typing, no waiting on AI grading. By default nothing is recorded in Anki (cards show a PRACTICE badge); tick **Record reviews in Anki** to count them, capped at Good since recognizing an answer is easier than recalling it. If the AI fails to produce options for a question, that one gracefully falls back to typed input
- **PBQ mode (general modes)** — non-language modes (Security+, music theory, …) get a **Performance questions (PBQ)** study type: interactive matching, step-ordering, and drag-into-category exercises like the PBQs at the start of a CompTIA exam, one per card, grounded in your knowledge base. Every exercise passes a verification pipeline before you see it — structural validation, verbatim-citation checks against your reference material, and a *blind solve* where a second AI pass must independently reach the same answer key (disagreements are adjudicated, repaired once, or discarded). Answering is tap-to-place **or drag-and-drop** (arrows also work for ordering), with emoji icons on items where a standard one fits (💻 ⌨️ 🧱); after submitting, the graded exercise stays on screen with the correct answers until you hit Continue. Off-subject cards (say, a stray vocab card in a cert deck) are skipped rather than force-fitted. Same practice semantics as multiple choice: Anki recording is opt-in and capped at Good
- **Tap a word for context** — tap any word in a question (language modes) to get its meaning *as used in that question* (analyzed from the whole sentence), shown in the legend's correct-green, with other common senses in word-choice-purple, plus **text phonetics** (`/rah-soh-NAH-bleh/`) and a **🔊 audio button** to hear it. Definitions are written in your app language. This now works on the **Meaning Hint** and on the **graded-card feedback** too (the question text, the feedback line, and each note), so you can look up — and one-click make an Anki card for — any word Ebi used while explaining
- **Ebi's memory hook** — every graded card has a **🧠 Help me remember** button right on its header (no need to expand first). Ebi builds a memory aid tailored to whatever you're studying: sound-alike + imagery hooks for vocabulary (e.g. Spanish *muelle* "dock" → picture a stubborn **mule** hauling cargo down at the dock), and acronyms / associations / mini-stories for concepts in non-language modes (CompTIA, music theory, etc.). The hook appears at the top of the card, **"↻ Another hook" adds another one below** (each a different angle, they stack rather than replace), and they're written in your app language
- **Collapsible results with two toggles** — each graded card (and each end-of-session Batch Result) collapses to a one-line header with a **▸ Feedback** button and the **🧠 Help me remember** button. They're mutually exclusive: opening Feedback shows the questions/answers/feedback, opening the memory hook shows just Ebi's mnemonic, and clicking the open one collapses the card — so a long review is a clean, scannable menu. **Clear completed from list** sits at the very bottom so it's never mistaken for a continue/sync button

### Picture Tab
- **Screen capture** — `Ctrl+Shift+S` for full screen, `Ctrl+Shift+A` for area selection
- **Area selection** — transparent drawing window, screen not frozen during selection, only selected area captured
- **Paste / Upload / Drag-drop** — Alternative image input methods
- **Vision reading** — a vision model reads the image directly (accurate on busy/stylized game screens), translating each word in context; Tesseract runs alongside only to pin precise word boxes
- **Pixel-accurate overlays + reading panel** — hover any word for translation, in-context meaning, pronunciation, synonyms, part of speech; a reading panel lists the transcribed text for tap-to-define
- **Anki card generation** — Click a word, generate a card, edit/refine with AI, sync to Anki
- **Draggable tooltip** — Pinned word tooltip can be dragged anywhere, position saved across sessions
- **Overlay mode** — Fullscreen overlay on top of games/apps via Electron

## Architecture

```
screenlens/
  src/                 ← React web app (single App.jsx with tab routing)
  electron/            ← Optional Electron overlay companion
    main.cjs           ← Electron main process (overlay + area select)
    preload.cjs        ← IPC bridge
  modes/               ← All modes (gitignored, auto-generated per user)
    <your modes>/      ← Each mode: config.json + knowledge/ (created on demand)
  chats/               ← Persistent chat sessions (gitignored)
  decks/               ← Per-deck progress tracking (auto-created)
    <deck-name>/
      progress-observations.md  ← AI-maintained struggle/improvement log
  vite.config.js       ← Dev server + API endpoints
```

**Vision OCR pipeline (with Tesseract for localization):**
1. **Vision read** — the image is sent to a vision model (`VISION_OCR_PROMPT`) which returns each learnable word with its in-context translation, sense, alternatives, pronunciation, part of speech and a normalized box. Far more accurate than OCR on stylized/cluttered game UI.
2. **Tesseract localization** — runs in parallel purely to get pixel-accurate word boxes.
3. **Snap** — each vision word is matched onto its Tesseract box; unmatched words show in the reading panel only (so a misplaced box is never drawn).
4. **Fallback** — with no API key (or on a vision failure) the legacy Tesseract OCR + translation path still runs.

## Setup

**Prerequisite — install Node.js first.** This app runs on [Node.js](https://nodejs.org) (which includes `npm`). Install the **LTS** build (Node 18 or newer) before running anything below — `git`, `npm install`, and `npm run dev` all require it. Verify with `node -v` and `npm -v`.

```bash
git clone https://github.com/cookmeafish/Ebiki-AI-Flashcards.git
cd Ebiki-AI-Flashcards   # the clone creates this folder — run everything from inside it
npm install
npm run dev
```

Opens at `http://localhost:3000`. (Run the commands **inside** the `Ebiki-AI-Flashcards` folder — `npm run dev` fails with a "no package.json" error if you run it in the parent directory.)

## Configuration

1. Click the **AI provider button** in the toolbar to open **AI Settings**
2. Select your provider and enter your API key
3. Pick a model per feature from the dropdowns (or leave "Provider default"); press **Check for new models** to pull the latest list from the provider
4. Set the **App Language** to translate the interface
5. Click the **gear icon** to configure language settings, Anki, and knowledge base
6. Navigate between tabs: **Chat** for AI conversation, **Study** for Anki quizzes, **Deck** for browsing/editing, **Discover** for new-card suggestions, **Picture** for screen translation, **Stats** for progress

> **Display sizing:** the UI applies a default 1.35× zoom so the fixed pixel layout reads comfortably on typical Windows displays — view at 100% browser zoom. Overlay mode is exempt (it stays 1:1 with screen pixels so OCR boxes line up).

## Supported AI Providers

Models below are the **defaults**; each feature (Picture / Deck / Study / Discover / Chat / Help / **Mascot** / General) is overridable per provider via dropdowns in AI Settings — or type a custom model id. The **Mascot** role picks Ebi's pose from each AI response and defaults to the cheapest model. Use **Check for new models** to refresh the list from the provider's API, and retired models auto-switch to a current one.

| Provider | Default model | JSON Mode |
|---|---|---|
| **Anthropic (Claude)** | Claude Haiku 4.5 (general/mascot), Claude Sonnet 4.6 (questions/help) | Prompt-based |
| **OpenAI (GPT)** | GPT-4o-mini | `response_format: json_object` |
| **Google (Gemini)** | Gemini 2.0 Flash | `responseMimeType: application/json` |
| **xAI (Grok)** | Grok 3 Mini Fast | Prompt-based |

## Learning Modes

Ebiki supports multiple learning modes. Each mode has its own:
- Anki card format (front/back templates, fields)
- Tag generation rules
- Study rules (question prompt, quiz language, grammar feedback, cards at once)
- Connected Anki deck
- Knowledge base (reference materials)

All settings are **per-mode** — changing Security+ settings doesn't affect Language Learning.

### Creating a mode

1. Click the mode button in the toolbar (e.g., "Language Learning")
2. Type what you want to learn (e.g., "CompTIA Security+", "Organic Chemistry")
3. Click **Create** — AI generates the full mode configuration (card format, tags, study questions)
4. Click the **gear icon** to customize any settings
5. Or click **+ Default Mode** to create a new Language Learning mode with defaults

### Mode settings

Click the **gear icon** next to the mode name. Use the dropdown to select which mode to configure:

- **Anki Settings** — connection status, deck selection, card format, tag rules, study rules
  - **Card Format** — AI edit input, field toggles, front/back templates with placeholders
  - **Tag Rules** — instructions for AI tag generation per card
  - **Study Rules** — questions per card, cards at once, quiz language, grammar feedback toggle, AI question generation prompt
- **Knowledge Base** — drag & drop .txt/.md files, enable/disable/delete individual files

Mode configurations are saved in `modes/<mode-name>/config.json`.

### Mode storage

```
modes/                  ← gitignored; created on demand, never breaks if missing
  Language Learning/    ← Your modes (per-user, local only)
    config.json
    knowledge/          ← Reference materials (optional)
      vocab.txt
  Security+/
    config.json
    knowledge/
      chapter1.md
```

## Anki Integration

### Setup

1. Install [Anki](https://apps.ankiweb.net/) desktop app
2. Open Anki → **Tools → Add-ons → Get Add-ons...**
3. Paste the addon code: **`2055492159`** ([AnkiConnect](https://ankiweb.net/shared/info/2055492159))
4. Click **OK** and restart Anki

### Flashcard generation

1. Click a translated word to pin it
2. Click **Explain** for a brief explanation
3. Click **Generate Anki Card** — AI creates a rich flashcard with pronunciation, definition, synonyms, and example sentence
4. Select target deck from dropdown in card preview
5. Click **Sync to Anki** — pushes to Anki and syncs to AnkiWeb automatically

Card format is AI-generated per mode and fully customizable via the Card Format settings.

### Study sessions

1. Go to the **Study** tab and click **Study Now**
2. Select mode, deck, quiz language — the first card appears immediately, rest generate in background. Enable Grammar feedback to get accent/spelling notes written in the quiz language
3. Answer questions — Q1 is always blind recall (no target word in question). Wrong answers trigger progressive hints
4. Use **← Back** to undo your last answer and retry (available until the card syncs to Anki)
5. As each card completes, AI evaluates in the background and feedback appears inline
6. Review feedback while continuing to answer other cards. Use the feedback chat to fix typos, dispute answers, or clarify cards
7. New cards are pulled automatically as you complete them, keeping 10 active
8. When done, click **View Summary** → **Generate Insights** for AI analysis + progress tracking
9. Ratings sync to Anki via **Sync now**, an auto-sync grace timer (default 5 min after grading, configurable in Settings → General), or on finish — and lock once synced so each card is reviewed in Anki exactly once with its final rating

Study features:
- **Instant start** — only one AI call before the first question appears; rest load in background
- **Ordered questions** — blind recall first, deep explanation last, guided recall in between
- **Progressive hints** — letter count hint, then first-letter hint, then "Try Again"
- **Back / undo** — undo last answer on any unsynced card
- **10-card pool** — questions randomly interleaved across 10 active cards for natural spacing
- **Hidden card fronts** — prevents answer leakage
- **Smart language evaluation** — typos in your native language don't penalize you when studying a foreign language
- **I Don't Know** — one-click skip marks the question wrong without typing; card rating still adjustable at the end
- **Meaning Hint** — ask for a context hint at any time; AI describes what the answer means without revealing the word, any conjugations, or spelling
- **Tap-a-word lookup (language modes)** — in a language study session, tap any underlined word in the question to see its contextual meaning, so you can decode an unfamiliar word in the sentence. The blank placeholder and the answer word itself are never tappable, so it can't reveal the answer
- **Grammar feedback** — when enabled, grammar and accent notes appear inline with each result, written in the quiz language
- **Feedback chat** — dispute answers, fix typos, flag out-of-scope questions, update Anki cards. Use Reply to send corrections or context to the AI
- **Smart Wrap Up** — drops unstarted cards immediately, finishes only what you've started
- **End Now** — immediate session end with partial results
- **"I know this"** — delete mastered cards with confirmation
- **Progress observations** — AI maintains `decks/<deck>/progress-observations.md` tracking struggles, improvements, and mastery
- **Knowledge base context** — AI uses your uploaded reference materials for targeted questions
- **Multiple choice practice** — optional relaxed answer style: 4 options per question, instant local grading, Anki recording opt-in (capped at Good)
- **PBQ exercises** — general modes can study via verified match/order/sort exercises instead of typed questions

### Deck browser

Go to the **Study** tab and click **Browse Deck** to:
- View all flashcards in any deck — each row shows a clean one-line preview of the back, plus **scheduling badges**: `NEW`, `learn`, the review interval (green once the card is mature), and a ⚠ lapse warning for problem cards
- **Click any row to expand it** — the full card back with bold labels, tag chips, and a scheduling footer (times studied, lapses, interval, last activity)
- **Copy to / Move** — send any card to another deck (or create a new deck inline): Copy makes an independent duplicate (e.g. to build a dedicated PBQ practice deck), Move relocates the card with its review history intact
- Search cards by content
- **Sort cards** — order the list by Newest/Oldest (creation date), A→Z / Z→A (alphabetical), Recently / Least-recently studied, New-unstudied-first, Problem cards (most lapses), or Mastered (longest interval). Stat-based sorts use per-card Anki scheduling data loaded with the deck
- **Add card** — create a new card manually (front/back/tags) or type a word and let the AI generate it from your mode's template, then save straight to the deck
- Edit card fields inline with AI refine input ("Say football instead of soccer")
- Delete cards with confirmation
- **Analyze for ambiguous cards** — AI scans every card for words with multiple meanings and proposes clarifications to accept/edit/commit. Each suggestion shows an inline **before/after word diff** (removed text in red strikethrough, added text in green) that updates live as you edit. A card-identity guard verifies the AI's suggestion matches the exact card by both note id and headword — mismatches are discarded (shown as "⚠ N discarded (card mismatch)"), never displayed or saved, so one card's content can never be written onto another
- **Scan for duplicates** — two-stage detection so unrelated words are never grouped: (1) code groups cards with the same headword ignoring accents/articles/parentheticals (catches `Oración` vs `Oracion`) and flags close spellings by edit distance; (2) the AI only *confirms* which close candidates are truly the same word (rejecting look-alikes like `casa`/`caza`), then merges the backs into one card combining all unique info. Expand any card in a group to inspect its full content before deciding. Review/edit the merge, then commit: the kept card is updated and the duplicates are deleted. A **Do not merge** button permanently remembers that a group is *not* a duplicate (stored per-deck, cloud-synced) so it's never suggested again
- Save button shows live status (Saving → Saved / Save failed — is Anki open?)
- Closing the browser syncs any edits back into your active study session immediately — no tab refresh needed
- Changes auto-sync to AnkiWeb

## Discover Mode

The **Discover** tab is an adaptive engine for finding **new** cards to make — calibrated to how advanced you already are. It never quizzes you on existing cards; every suggestion is something new.

How it works:
1. **Level analysis** — on open, the AI estimates your proficiency from your cards, Anki scheduling stats (mature/learning/lapsed counts, ease), progress observations, and study/feedback chat history. The scale adapts to the subject: **CEFR** (A1–C2) for languages, **exam-domain coverage** for certifications (e.g. Security+), and **beginner/intermediate/advanced** tiers for anything else.
2. **Setup screen** — before suggesting anything, you choose what to look for. Every mode picks a **suggestion type**: language modes offer **Words / Phrases / Idioms / Verbs / Grammar patterns / Anything**, while other subjects get **AI-generated categories specific to that subject** (created once per mode — e.g. Security+ might offer acronyms, attack types, ports & protocols; falls back to Terms / Acronyms / X vs Y / Scenarios until generated). Every mode also picks a **difficulty bias** (Easier wins / At my level / Stretch me) and gets a **Focus** box (free text) for topics or the kind of cards you want. Hit **Start discovering** (and **⚙ Adjust** later to change it — your current type, difficulty, and focus show as chips while suggesting).
   **Deck switcher:** the header's deck is a dropdown — point Discover at any deck (suggestions exclude that deck's cards, the learner profile re-analyzes against it, and Make Card saves there), not just the mode's default deck.
3. **Suggestions** — it proposes one new word/concept at a time, honoring your focus, targeted slightly above your level and biased toward your weak areas. Nothing already in your deck, known, or declined is ever suggested again.
4. **Web verification** (toggle, on by default) — confirms the facts of each suggestion via web search before showing it, with clickable source citations and a ✓ verified / ⚠ unverified badge, so you don't card a hallucination.
5. **Actions** — **Make Card** (generates a card from your mode's template, editable, then saves to Anki), **I Know This** (skip + remember), **Skip**, **Not Interested**, or **Next**.
6. **Re-analyze level** — recomputes your profile on demand.

**Cloud-synced metrics.** Your learner profile and the ledger of made/known/declined items are stored as Anki **media files** (`_screenlens/profile__<mode>.json`, `_screenlens/ledger__<mode>.json`), which sync to AnkiWeb and follow you across machines. When Anki is offline they fall back to a local `discover/` cache. The `_` prefix keeps them from being touched by Anki's Check Media.

## Knowledge Base

Each mode can have reference materials that the AI uses **app-wide**: study question generation, answer grading, chat, card generation, Discover's learner profile, and Ebi's Help all receive it as context.

1. Click the gear icon → expand **Knowledge Base**
2. Drag & drop `.txt`, `.md`, or `.pdf` files into the drop zone, or click to browse (PDF text is extracted on upload and stored as `.txt`; scanned/image-only PDFs are rejected with a hint to OCR them first)
3. Files are listed with size, enable/disable toggle, and delete button
4. Enabled files are loaded automatically when starting a study session

**Whole books.** When the knowledge base exceeds ~60k characters, Ebiki navigates it by its **table of contents** instead of truncating: headings are auto-detected (markdown `#`, "Chapter N", "1.2 Title"), or upload the book's TOC as its own file named `toc.txt` (one chapter/section title per line — page numbers are fine). A quick selector call then pulls only the sections relevant to each question, card, or chat message. A banner in Settings → Knowledge tells you whether the TOC was found (📖) or the base is too big with no headings (⚠️, with fixes).

Files are stored in `modes/<mode-name>/knowledge/` and can be managed entirely from the settings UI.

## Pronunciation audio

Flashcards get real spoken pronunciation via a 4-tier, language-agnostic chain — no accounts, no paid APIs:

1. **Your Anki card** — once a recording is embedded, it plays straight from Anki's media folder: instant, offline, works on every device your Anki syncs to
2. **Wiktionary / Wikimedia Commons** — real native-speaker recordings (including Lingua Libre's), found via the word's dictionary pages **and** a Commons-wide search. Attribution (author · license) is mandatory and always shown; recordings of the *thing* rather than the word (a dog barking for "perro") are filtered out
3. **Local TTS (optional, off by default)** — point Settings → Audio at an OpenAI-compatible server (e.g. Kokoro) on your own machine for near-human synthesized audio; leave empty and this tier costs nothing
4. **Browser voice** — the built-in system voice as the last resort

The 🔊 button appears on study graded cards, deck browser rows, chat card widgets, and the tap-a-word popup (language modes). **↻ cycles through different speakers** of the same word; the voice you pick replaces the card's embedded audio. Native recordings are automatically embedded into the Anki card (`[sound:…]` + a credit line, toggleable) — synthesized voices never are. Preferred accents per language (e.g. `en → us`, `es → mx`) are configurable in **Settings → Audio**.

## Overlay Mode (Optional)

A fullscreen overlay that sits on top of games and apps for seamless screen translation. The overlay loads the same web app — all features (hover, pin, explain, Anki) work identically.

### Setup

```bash
# Install Electron (one-time, optional)
npm install electron --save-optional
```

### Usage

1. Start the web app: `npm run dev`
2. Go to the **Picture** tab and click **Overlay** (or run `npm run overlay`)
3. Switch to your game or app
4. **Ctrl+Shift+S** — full screen capture, overlay appears with frozen screenshot
5. **Ctrl+Shift+A** — area selection: transparent drawing window appears, draw a rectangle, only that area is captured and frozen while the rest of the desktop stays interactive
6. Hover words for translations, click to pin, all features available
7. Press **ESC** to dismiss the overlay
8. Click the green Overlay button to stop Electron

### How it works

- Electron captures a screenshot via `desktopCapturer` and saves it as a PNG
- The overlay window loads `localhost:3000?overlay=true` — the same web app with the header hidden
- The web app auto-loads the screenshot and runs the full OCR/translation pipeline
- The overlay covers the entire screen (including taskbar area) for a seamless frozen-screen illusion
- ESC hides the overlay but Electron stays running for the next capture

### Notes

- The overlay shares the same Vite dev server — API keys, modes, Anki connection are all shared
- The web app works independently in the browser — the overlay is purely optional
- Fullscreen exclusive games may not work; use borderless windowed mode
- The Overlay button toggles on/off and auto-detects if Electron is running

## Ebi's Help (AI assistant)

A floating **Ebi** in the bottom-left opens a context-aware AI assistant that knows the app and your current state. It's the transparent mascot with a soft red glow (no circle), facing right, with a little pop on hover.

- Click **Ebi** to open the help chat; drag the button anywhere on screen
- **Context-aware** — always knows what you're doing: current tab, active mode, OCR words, selected word details, the **exact study question on screen** (it won't reveal the answer unless you explicitly ask), session progress, deck browser and Discover state, and recent chat messages
- **Can make adjustments** — ask it mid-session to change how study questions are asked ("make them shorter", "use scenarios") and it saves the preference to your mode on the spot
- **Opens at the bottom** so the most recent message is visible
- **Dock anywhere (FancyZones-style)** — drag the chat header to snap it, or click the dock button to be asked where: three labeled targets light up — **Dock left**, **Dock right**, or **Under the question** — and the preview shows exactly where it lands. Drop in open space to free-float. Esc cancels; **×** restores the floating button
- **Persistent history** — help chat sessions are saved to disk and appear in the Chat tab sidebar (marked with a blue ?)
- **New chat** — click + to start a fresh help conversation; old ones remain accessible in the Chat tab
- Ask anything: "What does this word mean?", "Help me with this study question", "How do I use the overlay?"
- Uses your configured AI provider and API key
- Hidden in overlay mode to avoid interfering with gameplay

## Requirements

- Node.js 18+
- API key for at least one supported provider
- Chrome/Edge/Brave recommended (Firefox works but screen capture may be limited)
- Anki + AnkiConnect addon (for flashcard and study features)
- Electron (optional, for overlay mode only)

## Project Structure

```
src/
  App.jsx              ← Main application component
  components/
    FormattedText.jsx   ← Rich text formatting for AI explanations
    HelpChat.jsx        ← Context-aware floating/docked help assistant
    DiscoverPanel.jsx   ← Discover Mode UI (profile header, suggestion card, actions)
    Pronunciation.jsx   ← 🔊 audio button (lazy resolve, source badge, attribution, ↻ speakers)
    PbqQuestion.jsx     ← interactive PBQ renderer (tap-to-place matching/categorize, ▲▼ ordering, graded review)
  config/
    languages.js       ← 18 supported languages
    prompts.js         ← Translation prompt + POS/category color maps
    providers.js       ← AI provider implementations + model listing (Anthropic, OpenAI, Gemini, Grok)
  i18n/
    index.js           ← App-language dictionaries (en/es/zh/ja) + t() lookup
  discover/
    storage.js         ← Discover profile/ledger store (Anki media files + local fallback)
    prompts.js         ← Discover prompt builders (profile, suggestion, web verify)
  pbq/
    engine.js          ← pure PBQ logic: compile/validate/shuffle, deterministic grading, blind-solve comparison, prompts
    engine.test.js     ← vitest suite for the engine (compile, citations, grading, solver parsing)
  pronunciation/
    index.js           ← 4-tier resolver chain (Anki media → Wiktionary/Commons → local TTS → browser voice)
    wiktionary.js      ← native recordings: edition pages ∪ Commons search, attribution, ↻ variants
    matcher.js         ← pure filename ranking/rejection (vitest-tested with live-captured fixtures)
    ankimedia.js       ← plays audio already embedded in the Anki card (offline)
    kokoro.js          ← opt-in local TTS tier (via the /api/tts proxy)
    webspeech.js       ← browser SpeechSynthesis last resort
    langcodes.js       ← language label → ISO code data
  styles/
    theme.js           ← GitHub Dark design system (~100 style objects)
  utils/
    anki.js            ← AnkiConnect API wrapper (ping, decks, cards, notes, sync, media files)
    pdf.js             ← client-side PDF → text extraction for the knowledge base (lazy-loaded)
    logger.js          ← OCR pipeline logging
electron/
  main.cjs             ← Electron main process (window, shortcuts, screenshot capture)
  preload.cjs          ← IPC bridge (contextBridge)
modes/
  Default/             ← Default Language Learning config template (committed)
    config.json
  <user modes>/        ← Custom modes with per-mode configs + knowledge (gitignored)
vite.config.js         ← Vite dev server + API endpoints (keys, config, modes, knowledge, anki proxy, overlay, chats, web search, discover-store)
```
