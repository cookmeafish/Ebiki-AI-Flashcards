# Ebiki - AI Study App

A local-first study app: an AI tutor, Anki study sessions, screen translation and progress stats, for any subject (languages, CompTIA certs, music theory, and more).

> **Name.** *Ebiki* = **ebi** (海老, Japanese for *shrimp*) + **Anki**. Its helper, **Ebi**, is a red shrimp whose pose reacts to what you do; **Talk to Ebi** in the header opens the in-app assistant.
>
> **Look.** An **Ocean Light** theme in Ebi's red (`#DF2540`), a **dark mode** (Settings → General), rounded type (Baloo 2 + Nunito) and press animations.

## Tabs

- **Chat** - AI tutor that makes Anki cards inline, tutors from an attached deck, searches the web and saves conversations.
- **Study** - Anki sessions with AI-written questions, a multiple-choice mode, verified PBQ exercises for cert subjects, and spaced-repetition insights.
- **Deck** - browse, search and edit cards; add them by hand or with AI; bulk-edit, check quality, merge duplicates.
- **Discover** - suggests *new* cards at your level, web-verified.
- **Picture** - screen capture, OCR and in-context translation with word overlays, plus a game overlay.
- **Stats** - streaks, accuracy and per-deck numbers, live from Anki.

## Highlights

- **Onboarding** - a short wizard sets app language, theme, how Ebiki opens, AI provider and key, intelligence preset, and your first mode. Re-run it from Settings.
- **Save tokens: reuse questions** (off unless you turn it on, in onboarding or Settings → AI & cost) - Ebi saves the study questions it writes for each card, with that card's deck, and once a card has your chosen number (10 by default) asks saved ones again instead of writing new ones. Edited cards get fresh questions. **Clear saved questions** starts a deck over. Turning it off stops all saving and reusing.
- **Token and cost counter** (off unless you turn it on, in Settings → AI & cost) - a small counter at the bottom right shows the tokens Ebi used and an estimated cost, for this session and in total on this computer, with a breakdown by model. Works with every provider. Costs are estimates from list prices; for a model without a known price, type its price with **Set price** (otherwise it is counted in tokens only).
- **Any of four AI providers** - Claude, GPT, Gemini or Grok. Each feature (Picture, Deck, Study, Discover, Chat, Help, Mascot, General) can use its own model, or a preset sets them all: **Optimized** (cheap models for simple tasks, strong ones for card making), **Normal** or **More intelligent**. Retired models are replaced automatically; **Check for new models** refreshes the list.
- **App language** - English, Spanish, Chinese or Japanese. Card *content* is never translated; generated suggestions and questions use your app language.
- **Learning modes** - one mode per subject, each with its own card format, tag rules, study rules, Anki deck and knowledge base.
- **Ask AI to edit settings** - describe a change to your cards or study rules; Ebi shows it as a before/after diff to Accept, Deny or refine.
- **Knowledge base** - upload `.txt`, `.md` or `.pdf` material per mode. It feeds questions, grading, chat, card making, Discover and Help. For whole books, Ebi uses the table of contents to pick only the relevant sections.
- **Pronunciation audio** - native-speaker recordings on study cards, deck rows and chat cards, embedded into Anki so they play on every device.

## Setup

**Windows:** clone the repo and double-click **`Install Ebiki.bat`** (the only file you run). It installs Node.js, Git, Anki and AnkiConnect if missing, runs `npm install`, and adds an **Ebiki** Desktop shortcut that starts the app and Anki. See [INSTALL.md](INSTALL.md).

**Linux:** clone the repo and run `./install.sh`. It runs `npm install` and adds **Ebiki** to your applications menu (Desktop icon optional). Install Anki and AnkiConnect yourself.

**Manual:** install [Node.js](https://nodejs.org) 18+, then:

```bash
git clone https://github.com/cookmeafish/Ebiki-AI-Flashcards.git
cd Ebiki-AI-Flashcards
npm install
npm run dev
```

Open `http://localhost:3000`; the wizard asks for an AI provider and key.

**The shortcut** (not `npm run dev`) opens Ebiki as its own window (no tabs or address bar, own taskbar icon, maximized; F11 for fullscreen) or as a browser tab, handy for looking words up in other tabs. Pick per computer in onboarding or Settings → General. The window needs the optional `electron` dependency; without it Ebiki opens in a tab.

> The UI is zoomed 1.35×; keep the browser at 100%. The overlay stays 1:1 so OCR boxes line up.

## Learning modes

Modes are independent: changing Security+ never touches Language Learning. Each lives in `modes/<mode-name>/config.json` (per user, gitignored).

**Create one** (Settings → Learning modes):
- **Quick** - type a subject ("CompTIA Security+", "Organic Chemistry") and click **Create**; the AI writes the whole config.
- **Design with Ebi** (recommended) - describe a rough idea; Ebi asks one to three questions about your level, goal and quiz style, then saves the plan you approve.

**Edit with Ebi** - the same chat edits an existing mode, how it builds cards (Cards & Anki) or how it quizzes you (Study), with a review before anything saves.

## Anki

1. Install [Anki](https://apps.ankiweb.net/) and the **[AnkiConnect](https://ankiweb.net/shared/info/2055492159)** add-on (code `2055492159`), then restart Anki.
2. Make cards from Chat, Picture, Quick Add or Discover. Each mode's card format is AI-generated and editable.
3. Study in **Study**; ratings go back to Anki, which schedules the intervals.

### Studying

- **Instant start** - the first card needs one AI call; the rest generate while you answer.
- **10-card pool** - ten cards stay active and interleave, never the same card twice in a row.
- **Answer styles** - typed, **multiple choice** (graded instantly on your computer) or **PBQ** (general modes: verified match, order and categorize exercises, CompTIA style). In practice styles, recording to Anki is optional.
- **Fair grading** - typos in your own language don't count; another valid form of the word is accepted unless the sentence requires one. Feedback is color-coded (right, wrong, grammar, word choice, missing, tip).
- **Learned language vs "Ebi speaks"** - you always answer in the language you're learning; "Ebi speaks" only sets the language of questions and feedback (switch it for immersion).
- **Steerable questions** - tell Ebi "prefer scenario questions" or "keep them short" (feedback chat or Help) and the rule is saved to the mode. **✎ Fix question** rewrites a bad question in place. The answer never appears in the question.
- **Word hints and tap-a-word** - optional glosses above untested words; tap any word for its meaning in context, pronunciation, audio and a one-click Anki card. Both work in either language direction.
- **Memory hooks** - **🧠 Help me remember** on graded cards, deck rows and tapped words, in five styles (meaning image, sound-alike, break it down, don't confuse it, story). Written in your app language unless the mode sets another (Settings → Study).
- **"Learn it" moments** - giving up on a card's first question opens a teach panel (card back, audio, memory hook, Ebi chat). Type the word once and the card returns later as practice.
- **Rating sync with a correction window** - ratings reach Anki on **Sync now**, after a per-card timer (5 min by default) or on Finish. Until then you can change a rating; after syncing it **locks**, so Anki records each card once. If Anki is closed, a note replaces the error and pending ratings sync when it reconnects.
- **Refresh-proof sessions** - a session in progress resumes after a refresh (sessions older than 8 hours start fresh).
- **Wrap Up / End Now** - finish only started cards, or stop now with partial results. **View Summary → Generate Insights** adds an AI analysis to each deck's progress notes.

### Deck browser

- **Add, Copy or Move** cards between decks (Copy makes an independent duplicate; Move keeps review history).
- **Expand a row** for the full back, tags and scheduling (interval, lapses, last studied). **⟲ Reset progress** makes a card new again without touching its content.
- **✨ Ebi bulk edit** - describe one change ("rewrite every pronunciation line to Latin American Spanish"); Ebi proposes it card by card and nothing is written until you accept.
- **Check card quality / Scan for duplicates** - flags ambiguous, misspelled, thin or wrong cards and duplicate concepts, each as a before/after to review. Language decks also get a **Dialect audit** and a **Tag audit** (where, how often and in what register a word is used).
- **Dialects** - set a variant per mode (e.g. Latin American Spanish), or tell Ebi, and every generator follows it.
- Sort by date, alphabet, recently studied, most lapses or longest interval. Search ignores accents.

## Discover

Finds **new** cards at your level (it never quizzes existing ones).

1. **Level analysis** - estimates your level from your cards, Anki scheduling, progress notes and this mode's chats, on a fitting scale: CEFR for languages, exam-domain coverage for certs, tiers otherwise.
2. **Setup** - pick a suggestion type (language modes: words, phrases, idioms, verbs, grammar; other subjects get AI-made categories), a difficulty and an optional focus. A deck switcher points Discover at any deck.
3. **Suggestions** - one item at a time, weighted toward weak areas, optionally web-verified (✓ verified / ⚠ unverified). **Make Card**, **I Know This**, **Skip** or **Next**.

Your learner profile and made/known/skipped lists are stored as Anki media, so they sync across computers (with a local copy when Anki is closed).

## Pronunciation audio

Four sources, tried in order, for any language (no accounts, no paid APIs):

1. **The Anki card** - once embedded, plays offline on any device.
2. **Wiktionary / Wikimedia Commons** - native-speaker recordings, always credited.
3. **Local TTS** (optional) - an OpenAI-compatible server such as Kokoro, set in Settings → Anki & audio.
4. **Browser voice** - last resort.

🔊 appears on study cards, deck rows, chat cards and tapped words. **↻** switches speaker, and the voice you pick replaces the card's embedded audio. Set preferred accents per language in Settings → Anki & audio.

## Overlay (optional)

A fullscreen overlay that translates games and apps in place, with every app feature. It starts with the app; the Picture tab's **Overlay** button turns it on or off (`npm run overlay` starts it by hand).

1. In your game, press **Alt+Q** to capture. Drag to select an area (the rest of the desktop stays usable); **Esc** dismisses.
2. Hover words for translations, click to pin, make Anki cards.

Fullscreen-exclusive games may need borderless windowed mode.

## Ebi's Help

**Talk to Ebi** opens an assistant that knows your tab, mode, the study question on screen (it won't reveal the answer unless asked) and recent activity. It can also act: ask it mid-session to change how questions are asked and it saves that to your mode. Dock it left, right or under the question, or let it float. Help chats are saved with your Chat history.

## Sharing data between computers (optional)

Data lives in the app folder. **One computer? Nothing to set up.**

To share, point each computer at one **shared data folder** (e.g. a network drive):

1. Install and run the app locally on each computer; only the data is shared.
2. Settings → Data & updates → **Data folder**: enter the path, click **Use this folder**.

- The app reloads onto the new folder at once.
- Joining a folder that has data asks whether to add your items or use only the folder's; its existing items are never overwritten.
- Your own data is set aside and comes back with **Back to the app folder**.
- API keys (`.env`) and logs stay on each computer.
- **Nothing is deleted**: collisions go to a dated backup folder. Don't edit the same item on two computers at once (saves replace whole files).
- **Local backup** - each computer mirrors the shared folder to `.local-sync/` every 10 minutes (one-way, never conflicts), so a recent copy survives the share going offline. Data folder settings show the last backup and a **Back up now** button.

## Requirements

- Node.js 18+
- An API key for one supported provider
- Chrome, Edge or Brave recommended (Firefox may limit screen capture)
- Anki + AnkiConnect (cards and studying)
- Electron (optional dependency: app window and overlay)

## Project layout

```
src/            React app (App.jsx + components, config, i18n, discover, pbq, pronunciation, styles, utils)
electron/       App window and overlay (main + preloads)
scripts/        Installer, launcher and Anki helper scripts
modes/          Per-user modes: config.json + knowledge/ (gitignored)
decks/          Per-deck progress notes (created as needed)
chats/          Saved chats (gitignored)
vite.config.js  Dev server + API endpoints
```

Design tokens: `src/config/tokens.js`. Developer notes: `CLAUDE.md`.
