# Ebiki - AI-Powered Learning & Study Platform

A local-first study app with an AI tutor, Anki-integrated study sessions, screen translation, and progress tracking. Works for any subject: language learning, CompTIA certs, music theory, and beyond.

> **Name & mascot.** *Ebiki* blends **ebi** (海老, Japanese for *shrimp*) and **Anki**. The helper is **Ebi**, a red shrimp whose pose reacts to what you're doing; the in-app assistant (the **"Talk to Ebi"** button in the header) speaks as Ebi.
>
> **Look & feel.** An **Ocean Light** theme built around Ebi's red (`#DF2540`), with a toggleable **dark mode** (Settings → General). Rounded friendly type (Baloo 2 + Nunito) and Duolingo-style press motion.

## Tabs

- **Chat** - AI tutor with inline Anki-card generation, deck attachment for personalized tutoring, web search, and saved conversation history.
- **Study** - Anki study sessions with AI-generated questions, a relaxed multiple-choice mode, verified PBQ exercises for cert subjects, spaced-repetition insights, and a full deck browser.
- **Deck** - Browse, search, and edit cards; add cards manually or with AI; bulk-edit, analyze for ambiguity, and merge duplicates.
- **Discover** - Adaptive suggestions for *new* cards, calibrated to your level and web-verified.
- **Picture** - Screen capture, OCR, and in-context translation with pixel-accurate word overlays; plus a game overlay mode.
- **Stats** - Streaks, accuracy trends, and per-deck breakdowns pulled live from Anki.

## Highlights

- **First-run onboarding** - a short wizard sets app language, theme, AI provider + key, and your first mode. Re-runnable from Settings.
- **Multi-provider AI** - Claude, GPT, Gemini, or Grok. Each feature (Picture, Deck, Study, Discover, Chat, Help, Mascot, General) can use its own model, or an **intelligence preset** (Normal / More intelligent) sets them all at once. The Mascot (pose) role stays on the cheapest model since it fires on every message. Retired models auto-heal to a current one; **Check for new models** refreshes the list.
- **App language** - translate the whole UI into English, Spanish, Chinese, or Japanese. Flashcard *content* is never translated; catered content (suggestions, questions) is generated in your app language.
- **Learning modes** - one app, many subjects. Each mode has its own card format, tag rules, study rules, Anki deck, and knowledge base, fully independent of the others.
- **Ask AI to edit settings** - describe a change to your cards or study rules and Ebi proposes it as a before/after diff you Accept, Deny, or refine. Nothing applies without confirmation.
- **Knowledge base** - upload `.txt`/`.md`/`.pdf` reference material per mode; it feeds study questions, grading, chat, card generation, Discover, and Help. Whole books are navigated by their table of contents so only relevant sections are used.
- **Pronunciation audio** - real native-speaker recordings on study cards, deck rows, and chat cards, embedded into Anki so they play on any device.

## Setup

**Easiest (Windows):** clone the repo, then double-click **`Install Ebiki.bat`** (the only file you run). It installs Node.js, Anki and the AnkiConnect add-on if they are missing, runs `npm install`, and puts an **Ebiki** shortcut on your Desktop that launches the app (and Anki with it). See [INSTALL.md](INSTALL.md).

**Manual:** install [Node.js](https://nodejs.org) (LTS / v18+), then:

```bash
git clone https://github.com/cookmeafish/Ebiki-AI-Flashcards.git
cd Ebiki-AI-Flashcards
npm install
npm run dev
```

Opens at `http://localhost:3000`. Then open **AI Settings**, pick a provider, and enter your API key.

> The UI applies a 1.35× zoom for comfortable reading on typical displays. View at 100% browser zoom. (Overlay mode stays 1:1 so OCR boxes line up.)

## Learning modes

Each mode is fully independent - changing Security+ settings never touches Language Learning. Configs live in `modes/<mode-name>/config.json` (per-user, gitignored).

**Create a mode** (Settings → Learning modes):
- **Quick** - type what you want to learn ("CompTIA Security+", "Organic Chemistry") and click **Create**. The AI builds the whole config in one shot.
- **Design with Ebi** (recommended) - a short chat where you describe a rough idea; Ebi asks one to three quick questions to tailor the mode to your level, goal, and how you want to be quizzed, then saves once you approve the plan.

**Edit with Ebi** - the same conversational designer edits an existing mode, shapes how it builds cards (Cards & Anki pane), or changes how it quizzes you (Study pane), all in plain language with a review step before anything saves.

## Anki integration

1. Install [Anki](https://apps.ankiweb.net/) and the **[AnkiConnect](https://ankiweb.net/shared/info/2055492159)** add-on (code `2055492159`), then restart Anki.
2. Generate cards from Chat, the Picture tab, Quick Add, or Discover. Card format is AI-generated per mode and customizable in settings.
3. Study from the **Study** tab; ratings sync back to Anki (which computes the intervals).

### Studying

- **Instant start** - the first card appears after one AI call; the rest generate in the background while you answer.
- **10-card pool** - ten cards stay active, questions interleaved and never the same card twice in a row, so spacing feels natural.
- **Answer styles** - typed, **multiple choice** (relaxed, instant local grading), or **PBQ** (for general modes: verified match/order/categorize exercises like a CompTIA exam). Practice modes make Anki recording opt-in.
- **Smart grading** - typos in your own language don't count against you, and a different valid form of the same word is accepted unless the sentence forces one. Feedback is color-coded (right / wrong / grammar / word-choice / missing / tip).
- **Learning vs "Ebi speaks"** - you always answer in the learned language; "Ebi speaks" just sets the language Ebi phrases questions and feedback in (switch it for an immersive session).
- **Steerable questions** - tell Ebi "prefer scenario questions" or "keep them short" (in feedback chat or Help) and the rule saves to the mode. Spot a bad question first? **✎ Fix question** regenerates it in place. The answer is guaranteed never to appear in the question.
- **Word hints & tap-a-word** - optional glosses float above words you aren't tested on; tap any word for its in-context meaning, pronunciation, audio, and a one-click Anki card. Both are bidirectional.
- **Memory hooks** - a **🧠 Help me remember** button on any graded card, deck row, or tapped word, with five styles (meaning image, sound-alike/recall, break-it-down, don't-confuse-it, story). Written in your app language (per-mode override in Settings → Study).
- **"Learn it" moments** - giving up on a card's first question opens a teach panel (card back, audio, a memory hook, a focused Ebi chat); type the word once and the card returns later as practice.
- **Rating sync with a correction window** - ratings reach Anki via a **Sync now** button, a per-card grace timer (default 5 min, configurable), or on Finish. Until synced you can freely correct a rating; once synced it **locks** so each card is reviewed in Anki exactly once. Anki closed? A calm note replaces the error and a watcher auto-flushes when it reconnects.
- **Sessions survive a refresh** - an in-progress session snapshots continuously and resumes where you left off (sessions older than 8 hours start fresh).
- **Wrap Up / End Now** - finish only started cards, or end immediately with partial results. **View Summary → Generate Insights** writes an AI analysis to each deck's progress log.

### Deck browser

Study tab → **Browse Deck**:

- **Add / Copy / Move** cards between decks (Copy keeps an independent duplicate; Move keeps review history).
- **Expand any row** for the full back, tags, and scheduling (interval, lapses, last studied). **⟲ Reset progress** wipes a card's scheduling so it's new again, content intact.
- **✨ Ebi bulk edit** - describe one change ("rewrite every pronunciation line to Latin American Spanish") and Ebi proposes it card by card; you accept or dismiss each before anything is written.
- **Analyze / Scan** - find ambiguous cards or duplicate concepts (with a card-identity guard so one card's content is never written onto another), each as a reviewable before/after.
- **Dialect-aware** - set a per-mode variant (e.g. Latin American Spanish) and every generator follows it; or just tell Ebi.
- Sort by date, alphabetical, recently studied, most lapses, or longest interval. Search is accent-insensitive.

## Discover

An adaptive engine for finding **new** cards, calibrated to how advanced you already are (it never quizzes you on existing cards).

1. **Level analysis** - estimates your proficiency from your cards, Anki scheduling, progress notes, and same-mode chat history. The scale adapts: CEFR for languages, exam-domain coverage for certs, tiers otherwise.
2. **Setup** - pick a suggestion type (language modes: words / phrases / idioms / verbs / grammar; other subjects get AI-generated categories), a difficulty bias, and an optional focus. A deck switcher points Discover at any deck.
3. **Suggestions** - one new item at a time, biased toward your weak areas, with optional web verification (✓ verified / ⚠ unverified). Actions: **Make Card**, **I Know This**, **Skip**, **Next**.

Your learner profile and made/known/declined ledger are stored as Anki media files, so they sync across machines (with a local fallback when Anki is offline).

## Pronunciation audio

A 4-tier, language-agnostic chain (no accounts, no paid APIs):

1. **Your Anki card** - once embedded, plays offline from Anki on any device.
2. **Wiktionary / Wikimedia Commons** - real native-speaker recordings with mandatory attribution.
3. **Local TTS** (optional) - point Settings → Audio at an OpenAI-compatible server (e.g. Kokoro).
4. **Browser voice** - last resort.

The 🔊 button appears on study cards, deck rows, chat cards, and tapped words. **↻ cycles speakers**; the voice you pick replaces the card's embedded audio. Preferred accents per language are set in Settings → Audio.

## Overlay mode (optional)

A fullscreen overlay for translating games and apps in place - the same web app, all features working.

```bash
npm install electron --save-optional   # one-time
```

1. Run `npm run dev`, then Picture tab → **Overlay** (or `npm run overlay`).
2. Switch to your game and press **Alt+Q** to capture. Drag to select just an area (the rest of the desktop stays interactive); press **ESC** to dismiss.
3. Hover words for translations, click to pin, make Anki cards.

Fullscreen-exclusive games may need borderless windowed mode. The overlay is purely optional - the app works fine in the browser.

## Ebi's Help

The **"Talk to Ebi"** button in the header opens a context-aware assistant that knows your current tab, mode, the exact study question on screen (it won't reveal the answer unless asked), and recent activity. It can also *act* - ask it mid-session to change how questions are asked and it saves the preference to your mode. Dock it left, right, or under the question, or let it float. Help chats are saved alongside your Chat history.

## Sharing data between computers (optional)

By default all your data lives in the app folder on the computer you run it on. **One computer? Nothing to set up.**

To share across machines, point them at one **shared data folder** (e.g. a network drive):

1. Run the app locally on each computer (the app runs from local disk; only data is shared).
2. Settings → General → **Data folder**, enter the shared path, click **Use this folder**. Repeat per computer.

- Applies immediately, no restart.
- Joining a folder that already has data asks whether to add your items or use only the folder's; the folder's existing items are never overwritten.
- Each computer's own data is set aside safely and restored via **Back to the app folder**.
- API keys (`.env`) and logs stay local to each machine.
- **Nothing is ever deleted** - collisions are parked in a dated backup folder. Avoid editing the same item on two computers simultaneously (saves are whole-file).
- **Automatic local backup.** While you use a shared folder, each computer also mirrors it to a local `.local-sync/` copy every 10 minutes (one-way, so it never conflicts). If the shared folder goes offline you always have a recent snapshot on this machine. The Data folder settings show the last backup time and a **Back up now** button.

## Requirements

- Node.js 18+
- An API key for at least one supported provider
- Chrome / Edge / Brave recommended (Firefox works, but screen capture may be limited)
- Anki + AnkiConnect (for flashcard and study features)
- Electron (optional, overlay mode only)

## Project layout

```
src/            React app (App.jsx + components, config, i18n, discover, pbq, pronunciation, styles, utils)
electron/       Optional overlay companion (main + preload)
modes/          Per-user modes: config.json + knowledge/ (gitignored)
decks/          Per-deck progress logs (auto-created)
chats/          Saved chat sessions (gitignored)
vite.config.js  Dev server + API endpoints
```

Design tokens live in `src/config/tokens.js`; developer notes are in `CLAUDE.md`.
