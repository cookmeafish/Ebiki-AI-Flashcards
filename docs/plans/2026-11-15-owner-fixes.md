# Owner fixes, 2026-11-15

The owner tested the new features on their own setup, and much of it did not work or was hard to use. QA failed: these paths were never driven as the owner uses them. Each item below closes only with its proof: a test, an end-to-end run on a fake device or fake CLI, or screenshots from a FRESH profile played as a new user (desktop and phone, looked at).

## 1. Broken things
1. [ ] **Voice mode works.**
   - Root cause: the free browser recognizer returns nothing in most Chromium browsers.
   - Fix: free on-device Whisper, ranked before the browser recognizer.
   - A live mic-level bar.
   - "I can't hear you" when no sound arrives within 4 s.
   - Proof: real spoken audio through a fake mic, then transcript, reply and voice (`dev/voice/check-voice.mjs`).
2. [ ] **Course mode and deck.** The Security+ course runs on the Security+ mode and its default "Security+" deck: starting the course sets the mode's deck. Proof: a run on a fresh profile.
3. [ ] **Course cards can't be deleted.** Cards that belong to a course are refused in the deck browser, so a course can't break. Proof: a test plus a screenshot.

## 2. First run as a new user
4. [ ] **Start choice.** The first Legends screen chooses between "Career mode" and "Choose your own adventure"; it no longer defaults to the intro.
5. [ ] **No CompTIA in Spanish.** A course is offered only to a mode it fits; the questionnaire never offers one.
6. [ ] **Calmer map.**
   - A big "Continue: next step" button.
   - The island page lighter.
   - Played start to finish on a fresh profile: start, island, lesson, checkpoint, boss.

## 3. Readability and learning
7. [ ] **Formatted lesson cards:** 📖 meaning, 💡 example box, ⭐ key points as bullets, category tag. Few emoji, only where they help.
8. [ ] **An example on every card:** fluff free, organized, accurate. Proof: the coverage test plus a rewrite of abstract examples (separate agent).
9. [ ] **📖 Learn it and 🧠 Memory hook on every lesson card**, usable before the quiz. Proof: screenshot.
10. [ ] **Easy to understand:** an independent reviewer reads the screens and answers that question.

## 4. Performance
11. [ ] **The faint grid at the top of the map:** it is the empty practice calendar, not a slowdown. It is hidden while empty, and the map's load is measured.

## 5. Subscriptions
12. [ ] **Sign-in per company:**
    - One tab per company, each with its own subscription option if that company allows one.
    - OpenAI: "API key / ChatGPT plan".
    - Claude, Gemini, Grok: re-checked, with the companies' own words quoted.
    - Proof: screenshots, Settings and onboarding.
13. [ ] **"My Claude Code" (uses your own Claude subscription), opt-in.** Runs the user's installed, signed-in Claude Code with no tools.
    - Waits on the owner's yes: it is a gray area in Anthropic's terms, and it reverses an earlier CLAUDE.md rule.
    - Proof: a fake-CLI test (signed in, signed out, missing) plus a real run.

## Card-content fixes (separate agent, feeds 8)
- The outside fact-check's 5 issues.
- A review of the 4.2 cards.
- Every sub-item has a card.
