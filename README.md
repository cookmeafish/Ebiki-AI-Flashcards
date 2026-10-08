# Ebiki - AI Study App

A local-first study app built on Anki: AI-written study questions, an AI tutor, an adventure map, practice games, screen translation and stats, for any subject (languages, CompTIA certs, music theory, and more).

> **Name.** *Ebiki* = **ebi** (海老, Japanese for *shrimp*) + **Anki**. Its helper, **Ebi**, is a red shrimp whose pose reacts to what you do; **Talk to Ebi** in the header opens the in-app assistant.

## Screens

- **Study** - Anki sessions with AI-written questions, multiple choice, verified PBQ exercises for cert subjects, and insights. Ratings go back to Anki.
- **Legends** - an adventure map per mode. Areas of lessons, stories, rule drills and chats with Ebi, each ending in a named boss fight; clear Weak spots first for an extra life, and replay a cleared area as a Legendary challenge. A short placement test, or what Ebiki already knows about you, sets your level (A1 to C2 for languages, Beginner to Expert otherwise). Ask Ebi to change the map; areas you started never change.
- **Practice** - extra practice from your cards and mistakes:
  - **Daily raid** - your due cards as a boss fight against a roster of 26 bosses, each with its own ability; each card's first answer is a real Anki review. Bosses keep their wounds between days (healing a little overnight) and your hearts refill each day. Lose every heart and the boss rallies, healing back half that run's damage, but you can fight on at once. Each different boss you beat unlocks a **power** for good; bring up to three to a fight, each usable once.
  - **Ebi Call** - a chat that weaves your due cards into the conversation and grades each one you use.
  - **Roleplay** - act out a situation with Ebi in character, then get a scorecard, tips and cards to add.
  - **Mistake Gym** - fresh questions aimed at what you got wrong lately.
  - **Leech Doctor** - cards you keep failing, why, and a fix.
  - **Listen & Speak** and **Scenes** (optional, Settings → General → Optional features) - audio drills and short stories read aloud, built from your cards. **Voice chat with Ebi** (also optional) lets you talk out loud in Ebi Call and Roleplay.
- **Chat** - AI tutor that makes Anki cards inline, tutors from an attached deck, searches the web and saves conversations.
- **Deck** - browse, search and edit cards; add them by hand or with AI; bulk-edit, check quality, merge duplicates.
- **Discover** - suggests *new* cards at your level, web-verified.
- **Picture** - capture a screen, drop or paste an image; Ebi reads the text and translates it word by word in context.
- **Stats** - reviews per day, streak, accuracy and recent sessions, live from Anki.

The right panel (Study home, Stats, Practice) shows your XP, daily goal, streak (freezes cover a missed day), daily quests, a weekly league against your own past weeks, and other players sharing your data folder. Collapse it with its toggle.

## Highlights

- **Onboarding** - a short wizard sets app language, theme, how Ebiki opens, AI provider and key, intelligence preset and your first mode. Re-run it from Settings → General.
- **Any of four AI providers** - Claude, GPT, Gemini or Grok. Each feature can use its own model, or a preset sets them all: **Optimized** (cheap models for simple tasks, strong ones for card making), **Normal** or **More intelligent**. Retired models are replaced automatically, and Ebi offers newer ones when they appear.
- **Save tokens: reuse questions** (off unless you turn it on, in onboarding or Settings → AI & cost) - Ebi saves the questions it writes per card; once a card has your chosen number (10 by default) it asks saved ones again. Edited cards get fresh questions. **Clear saved questions** starts a deck over.
- **Token and cost counter** (off by default, Settings → AI & cost) - tokens and estimated cost per session and in total on this computer, by model. For a model without a known price, enter it with **Set price**.
- **App language** - English, Spanish, Chinese or Japanese. Card *content* is never translated.
- **Learning modes** - one per subject, each with its own card format, tag rules, study rules, Anki deck and knowledge base.
- **Ask AI to edit settings** - describe a change to your cards or study rules; Ebi shows a before/after diff to Accept, Deny or refine.
- **Knowledge base** - upload `.txt`, `.md` or `.pdf` material per mode. It feeds questions, grading, chat, card making, Discover and Help. For whole books, Ebi uses the table of contents to pick the relevant sections.
- **Voice typing** (Settings → General) - a mic on every text box; **Alt+V** starts and stops it.
- **Zoom** - Settings → General → Zoom, or **Ctrl/Cmd + =**, **-** and **0**, saved per computer.
- **Back and Forward** - the mouse's back button (or Alt+Left/Right in the app window) moves between screens, Settings panes and sessions.
- **Themes** - Ocean Light and Dark (Settings → General).

## Setup

**Windows:** clone the repo and double-click **`Install Ebiki.bat`** (the only file you run). It installs Node.js, Git, Anki and AnkiConnect if missing, runs `npm install`, and adds an **Ebiki** shortcut that starts the app and Anki. See [INSTALL.md](INSTALL.md).

**Linux:** clone the repo and run `./install.sh`. It runs `npm install` and adds **Ebiki** to your applications menu. Install Anki and AnkiConnect yourself.

**Manual:** install [Node.js](https://nodejs.org) 18+, then:

```bash
git clone https://github.com/cookmeafish/Ebiki-AI-Flashcards.git
cd Ebiki-AI-Flashcards
npm install
npm run dev
```

Open `http://localhost:3000`; the wizard asks for an AI provider and key.

**Updates** - each shortcut launch checks for a new version and asks before installing it; you can also check in Settings → Data & updates.

**The shortcut** opens Ebiki as its own window (no tabs or address bar, maximized; F11 for fullscreen) or as a browser tab, handy for looking words up in other tabs. Pick per computer in onboarding or Settings → General. The window needs the optional `electron` dependency; without it Ebiki opens in a tab.

## Learning modes

Modes are independent: changing Security+ never touches Language Learning.

**Create one** (Settings → Learning modes):
- **Quick** - type a subject ("CompTIA Security+", "Organic Chemistry") and click **Create**; the AI writes the whole config.
- **Design with Ebi** (recommended) - describe a rough idea; Ebi asks one to three questions about your level, goal and quiz style, then saves the plan you approve.

**Edit with Ebi** - the same chat edits an existing mode, how it builds cards (Cards & Anki) or how it quizzes you (Study), with a review before anything saves.

## Anki

1. Install [Anki](https://apps.ankiweb.net/) and the **[AnkiConnect](https://ankiweb.net/shared/info/2055492159)** add-on (code `2055492159`), then restart Anki. The Windows installer does this for you.
2. Make cards from Chat, Picture, Quick Add or Discover. Each mode's card format is AI-generated and editable.
3. Study in **Study**, raids or Ebi Call; Anki schedules the intervals.

### Studying

- **Instant start** - the first question needs one AI call; the rest generate while you answer.
- **Question depth** - a card you are reviewing gets one question where you produce the answer; new, relearning and missed cards get the full set. **Thorough** (Settings → Study) asks every card all its questions.
- **Answer styles** - typed, **multiple choice** (graded instantly) or **PBQ** (general modes: verified match, order and categorize exercises, CompTIA style). In practice styles, recording to Anki is optional.
- **Fair grading** - typos in your own language don't count; another valid form of the word is accepted unless the sentence requires one. Feedback is color-coded (right, wrong, grammar, word choice, missing, tip).
- **Learned language vs "Ebi speaks"** - you always answer in the language you're learning; "Ebi speaks" sets the language of questions and feedback (match them for full immersion).
- **Steerable questions** - tell Ebi "prefer scenario questions" or "keep them short" and the rule is saved to the mode. **✎ Fix question** rewrites a bad question in place. The answer never appears in the question.
- **Word hints and tap-a-word** - optional glosses above untested words; tap any word for its meaning in context, audio and a one-click Anki card, in either language direction.
- **Memory hooks** - **🧠 Help me remember** on graded cards, deck rows and tapped words, in five styles (meaning image, sound-alike, break it down, don't confuse it, story).
- **"Learn it" moments** - giving up on a card's first question opens a teach panel (card back, audio, memory hook, Ebi chat). Type the word once and the card returns later as practice.
- **Rating sync with a correction window** - ratings reach Anki on **Sync now**, after a per-card timer (5 min by default) or on Finish. Until then you can change a rating; once synced it **locks**, so Anki records each card once. If Anki is closed, pending ratings sync when it reconnects.
- **Refresh-proof sessions** - a session resumes after a refresh; one idle for 8 hours ends quietly.
- **Wrap Up / End Now** - finish only started cards, or stop now. **View Summary → Generate Insights** adds an AI analysis to the deck's progress notes.

### Deck browser

- **Add, Copy or Move** cards between decks (Move keeps review history). **⚡ Quick Add** turns a pasted word list into cards to review before adding.
- **Expand a row** for the full back, tags and scheduling. **⟲ Reset progress** makes a card new again without touching its content.
- **✨ Ebi bulk edit** - describe one change ("rewrite every pronunciation line to Latin American Spanish"); Ebi proposes it card by card and nothing is written until you accept.
- **Check card quality / Scan for duplicates** - flags ambiguous, misspelled, thin or wrong cards and duplicate concepts, each as a before/after to review. Language decks also get a **Dialect audit** and a **Tag audit** (where, how often and in what register a word is used).
- **Dialects** - set a variant per mode (e.g. Latin American Spanish), or tell Ebi; every generator follows it.
- Sort by date, alphabet, recently studied, most lapses or longest interval. Search ignores accents.

## Discover

Finds **new** cards at your level (never quizzes existing ones).

1. **Level analysis** - estimates your level from your cards, Anki scheduling, progress notes and this mode's chats: CEFR for languages, exam-domain coverage for certs, tiers otherwise.
2. **Setup** - pick a suggestion type (language modes: words, phrases, idioms, verbs, grammar; other subjects get AI-made categories), a difficulty and an optional focus, and the deck to save to.
3. **Suggestions** - one at a time, weighted toward weak areas, optionally web-verified. **Make Card**, **I Know This**, **Skip** or **Next**.

## Pronunciation audio

Four sources, tried in order, for any language (no accounts, no paid APIs):

1. **The Anki card** - once embedded, plays offline on any device.
2. **Wiktionary / Wikimedia Commons** - native-speaker recordings, always credited.
3. **Local TTS** (optional) - an OpenAI-compatible server such as Kokoro, set in Settings → Anki & audio.
4. **Browser voice** - last resort.

🔊 appears on study cards, deck rows, chat cards and tapped words. **↻** switches speaker; the voice you pick replaces the card's embedded audio. Set preferred accents per language in Settings → Anki & audio.

## Overlay (optional)

A fullscreen overlay that translates games and apps in place. It starts with the app; the Picture screen's **Overlay** button turns it on or off.

1. Press **Alt+Q** to capture the screen; **Esc** dismisses.
2. Hover words for translations, click to pin, make Anki cards.

Fullscreen-exclusive games may need borderless windowed mode.

## Ebi's Help

**Talk to Ebi** opens an assistant that knows your screen, mode, the study question on screen (it won't reveal the answer unless asked) and what you have been doing. It can act too: change how questions are asked, set a dialect, start a deck bulk edit or edit your Legends map. Dock it left, right or under the question, or let it float. Help chats are saved with your Chat history.

## Sharing data between computers (optional)

Data lives in the app folder. **One computer? Nothing to set up.**

To share, point each computer at one **shared data folder** (e.g. a network drive):

1. Install and run the app locally on each computer; only the data is shared.
2. Settings → Data & updates → **Data folder**: enter the path, click **Use this folder**.

- The app reloads onto the new folder at once.
- Joining a folder that has data asks whether to add your items or use only the folder's; its existing items are never overwritten.
- Your own data is set aside and comes back with **Back to the app folder**.
- API keys and logs stay on each computer.
- **Nothing is deleted**: collisions go to a dated backup folder.
- **Local backup** - each computer copies the shared folder every 10 minutes. If the share goes offline, Ebiki keeps working from that copy and merges your changes when it returns.

## Requirements

- Node.js 18+
- An API key for one supported provider
- Anki + AnkiConnect (cards and studying)
- Chrome, Edge or Brave for a browser tab (Firefox may limit screen capture)
- Electron (optional dependency: app window and overlay)

## Project layout

```
src/            React app (App.jsx, components, features, shell, config, i18n, ...)
electron/       App window and overlay
scripts/        Installer, launcher and Anki helper scripts
modes/          Your modes: config + knowledge base (gitignored)
vite.config.js  Dev server + API endpoints
```

Developer notes: `CLAUDE.md`.
