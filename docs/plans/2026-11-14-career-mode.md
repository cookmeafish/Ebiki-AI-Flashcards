# Career mode: a curated Legends map for a whole course (first package: CompTIA Security+ SY0-701)

**Owner's ask (2026-11-14):**
- "career" is a GAME MODE for whole curated packages, not a job path.
- **Islands:** one per domain.
- **Lessons:** each island holds all of its domain's content.
- **Bosses:** the tests.
- **Quality bar:** every card accuracy-checked multiple times; intuitive islands; objectives easy to reach and understand; visually easy to navigate; every progression triple-checked.

## What exists today (code read 2026-11-14)
- **AI-written maps:** a Legends map is written by the AI in two steps: a plan (8 area titles), then detail per area (8 lessons of 2 to 3 items, Weak spots, a boss).
- **The engine already takes a hand-built map:**
  - `normalizeMap` derives every status from what is done.
  - `makeQuiz` writes each step's questions from `area.items` and `node.itemIds`.
  - So no AI has to plan or detail anything.
- **Limits that do not fit a course:**
  - Areas unlock strictly in order.
  - Steps unlock strictly in order.
  - A boss sends ALL of the area's items to the model (Domain 4 has about 260).
  - The map view lists every step of every area in one long ladder.

## The design
### Content: one package per course, verified offline
- **Source:** 830 cards, exactly one per line of the official SY0-701 outline (domain, objective, item, sub-item), plus 321 acronym cards.
- **Writing:** six writers, one per domain (Domain 4 split in two), in plain words. Each card has definition, example, category and key points (the exam traps).
- **Accuracy:**
  - **Pass 1:** an independent reviewer per domain checks every card against NIST, RFCs, OWASP and vendor docs, fixes errors, and logs each change with its source.
  - **Pass 2:** a second, different reviewer checks the corrected set and the log.
  - **Pass 3:** an automated check.
    - Coverage: every outline line has one card and the counts match.
    - Fronts are unique, and every field is filled.
    - No dashes and no HTML.
    - Acronym expansions match CompTIA's list. Where CompTIA's spelling differs from the standard name, both are given.
- **Knowledge base:** one chapter per domain in `modes/Security+/knowledge/`.
  - Headings per objective and item, so Ebiki's table-of-contents retrieval finds sections.
  - Each objective links to the matching free Professor Messer video (titles and links only: his transcripts are his copyrighted work and are not copied).
- **Package file:** `careers/security-plus-sy0-701.json`.
  - It holds islands, objectives, lessons and items, all built from the reviewed cards.
  - It is built by a script; nothing is hand-copied.

### The map: islands, objectives, lessons, checkpoints, bosses

| Level | What it is |
|---|---|
| **Island** = domain | Five islands: 1.0 General Security Concepts (12%), 2.0 Threats, Vulnerabilities, and Mitigations (22%), 3.0 Security Architecture (18%), 4.0 Security Operations (28%), 5.0 Security Program Management and Oversight (20%). Each shows its exam weight and progress. |
| **Objective** (a section of the island) | e.g. "2.4 Analyze indicators of malicious activity". It holds its lessons and ends in a checkpoint. |
| **Lesson** (`learn` step) | One outline bullet with its sub-items, at most 4 items per lesson. A long bullet such as "Malware attacks" (10 items) is split into parts ("Malware attacks 1/3"). Lessons teach first (the cards), then quiz only what they taught. |
| **Checkpoint** (new `checkpoint` step, per objective) | A 12-question test across the objective's items, weakest first. Pass at 70%. |
| **Weak spots** | As today: the island's shakiest items, which earn a bonus life for the boss. |
| **Island boss** = domain test | A fight of 20 fresh questions spread across every objective, weighted by objective size, weakest items first. Pass at 70% (the fight's lives rule). |
| **Legendary** | As today, after the island is cleared: 20 harder typed questions, 90% to win. |

### Progression rules (career maps only, `map.career`)
- **Islands:** all five are open from the start. CompTIA domains do not depend on each other, and the learner can study any domain first.
- **Objectives:** all are open, so any topic is one tap away.
- **Lessons:** in order inside an objective. The checkpoint opens after the objective's last lesson.
- **Island boss:** opens once every checkpoint on the island is cleared. Weak spots open with it.
- **Never in a career map:**
  - Change my map.
  - Extra areas.
  - Area regeneration.
  - AI boss naming (names come with the package).
  - The AI plan and detail calls.

### The screen (easy to navigate)
1. **Island strip:** five island cards in a row (two rows on phones), showing:
   - the banner art;
   - "Domain 2.0", the title and "22% of exam";
   - a progress bar;
   - a crown when the boss is beaten.
   One tap picks the island; the current island is selected on open.
2. **Island page:** the banner, then the domain's objectives as numbered cards.
   - Each card shows its number and title, a progress bar ("3 of 7 lessons"), and its checkpoint status.
   - The objective in progress is expanded; the others expand on tap.
   - Inside: its lesson steps, then its checkpoint.
3. **Island boss card** at the end of the page: the boss, its name, "20 questions across all objectives", and what unlocks it ("Clear every checkpoint: 3 of 5").
4. **Header:** as the map today (level, journey, passport, raid, start over), without "Change my map".

### Starting a career
- **Start screen:** "Start from a course" is offered on the Legends start screen for every mode, as one tile per installed package. For a mode whose name or description mentions it ("Security+", "SY0-701"), it is the recommended first tile.
- **Picking it:** builds the map from the package and opens the island strip. There is no placement test: every lesson is open to the learner.
- **Start over:** works as today.
- **Onboarding** (CLAUDE.md "Onboarding"): career mode needs no setup beyond picking it, so it lives on the Legends start screen, which is Legends' own onboarding step. No wizard step is added.

### Where the content lives (copyright)
- **Code (in git):** the engine, the package loader and the package format.
- **Content:**
  - The cards and chapters are written in our own words.
  - The outline's objective titles and item names are CompTIA's, and its document says it may not be reproduced without consent.
  - So the Security+ package and knowledge chapters stay in the user's data, not in the public repo, until the owner decides otherwise:
    - `careers/` is gitignored;
    - the knowledge base is under `modes/`, which is already gitignored.

## The owner's asks, one by one (with evidence)
- [x] **Every module and objective as a flashcard:** 830 cards, one per line of the SY0-701 outline (5 domain cards, 28 objective cards, every item and sub-item), plus 321 acronym cards.
  - Evidence: `build-career.mjs` prints `830 outline lines, 830 cards ... no problems`.
  - 1,115 new notes were added to Anki (36 already there) under `Security+::<domain>` and `Security+::Acronyms`.
- [x] **A knowledge base for every domain and objective:** six chapters in `modes/Security+/knowledge/`, with free Professor Messer video links per objective. No transcripts were copied (copyright).
- [x] **Accuracy checked multiple times:** writer self-check, then 2 independent review passes per domain, each with a change log and sources (`dev/careers/sources/.../cards/*.r2.json`). The build refuses a domain without a second pass.
  - Pass 1 corrected 33 cards, among them RSA vs AES strength, WPA3 ciphers, NIST SP 800-88, NIST SP 800-61 Rev 3, EOL vs EOSL, attestation, parallel processing and IPSec tunnel mode.
  - Pass 2 corrected 18 more and reverted none.
- [x] **One island per domain, all of its content as lessons, bosses as the tests:** 5 islands; every objective's items in lessons of 4 or fewer, then a checkpoint test; an island boss over every objective.
  - Evidence: the `career.test.js` "shipped Security+ course" block (domains, weights, objectives, 830 items each in exactly one lesson, checkpoints, boss).
- [x] **Islands intuitive, topics easy to reach and understand:**
  - Domain number, title and exam weight on each island.
  - Objectives as numbered cards with a short name, the official title and progress.
  - All islands and objectives open from the start.
  - The course is offered on the Legends welcome screen.
- [x] **Visually easy to navigate:** a GUI test (Playwright on port 3001) covering welcome offer, island strip, island page, open objective and boss card; desktop and phone, light and dark, zoom 1.7. Two defects fixed:
  - progress bars were empty;
  - on phones, a picked island did not scroll into view.
- [x] **Every progression triple-checked:**
  1. Unit tests: career ladder, checkpoint gating, boss gating, sampling, versions, old saves.
  2. A seeded map driven in the real app.
  3. An independent code review.
- [x] **Independent review fixed:** 16 findings in all. Each fix below has a test or a screenshot.
  1. A new course showed every step locked; it is now open as built.
  2. A failed or racing course load turned into a paid AI map; the course is now loaded first and written in one go.
  3. Help's map edit could rewrite a course; it is now refused, with a note.
  4. Legendary sent every item; it now samples.
  5. Practice log flooding; only asked items are logged.
  6. Help named the wrong island and listed about 100 steps; it now picks the current island and gives one line per objective.
  7. `scrollIntoView` scrolled the page root; the page now scrolls inside its own scroll box.
  8. A boss read about 100 step files; it now reads only the checkpoints.
  9. The boss spread could skip an objective; a negative slice also returned 229 items. Both fixed, with a test.
  10. The checkpoint prompt is now framed as an objective test.
  11. Islands no longer pay XP by their position.
  12. The map is keyed by mode.
  13. The build script now handles paths with spaces, bad indentation and stray bullets.
  - **Known gap, documented:** a started course keeps its card text, so a later package fix reaches it only after Start over.
- [x] **Old saves keep working:** test "saves from before career mode". A career map is version 2, which older builds leave alone.

## Checks (Done when)
- [ ] Cards: 3 accuracy passes done; coverage 830/830; acronyms 321.
- [ ] Anki import file written; added to the "Security+" deck tree when Anki is open.
- [ ] Knowledge chapters in `modes/Security+/knowledge/`.
- [ ] Engine tests:
  - career progression (islands open, sections, checkpoint gating, boss gating);
  - item sampling for checkpoint and boss;
  - package → map shape;
  - an older build reads a career map safely.
- [ ] GUI driven in Playwright's bundled Chromium on port 3001, with AI stubbed:
  - island strip, island page, an expanded objective, a lesson, a checkpoint, the boss card;
  - desktop and phone, light and dark;
  - screenshots looked at.
- [ ] An independent review of the diff and screenshots.
- [ ] i18n in four locales.
- [ ] Version bump.
