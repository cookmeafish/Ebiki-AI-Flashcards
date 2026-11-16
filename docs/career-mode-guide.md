# Career mode: how to make a course (runbook)

Career mode is a Legends GAME MODE for a whole curated course (an exam, a certification, a syllabus). It is not a job path. The first course is CompTIA Security+ SY0-701.

The owner asked for:
- **Islands:** one island per domain.
- **Lessons:** each island holds all of its domain's content.
- **Bosses:** the tests.
- **Accuracy:** every card checked more than once.
- **Navigation:** intuitive islands, and objectives easy to reach and understand.
- **Progression:** every progression triple-checked.

Design and reasoning: `docs/plans/2026-11-14-career-mode.md`.

## How it fits together
| Piece | Where | What it does |
|---|---|---|
| Engine (pure, tested) | `src/features/legends/career.js` | Package shape. Builds the map: islands, objectives, lessons, checkpoint, weak spots, boss. Has the career ladder and the quiz item sampling. Lists the courses this build knows (`CAREERS`). |
| Screen | `src/features/legends/CareerMap.jsx` | Island strip, island page with objective cards, boss card. Also `loadCareer`. |
| Hooks into Legends | `map.js` (`normalizeMap` career branch, `MAP_VERSION_READ`, `checkpoint` kind, `PASS.checkpoint`, no `needsMoreAreas`), `generate.js` (checkpoint and boss sample items, objective-scoped review and avoid list), `MapView.jsx` (renders `CareerMap`, hides Change my map), `LegendsScreen.jsx` (welcome offer, `path: 'career'` in `saveStart`), `Questionnaire.jsx` (course tiles) | |
| Builder and validator | `dev/careers/build-career.mjs` | Fails unless every outline line has exactly one card reviewed twice. Writes the package, the Anki import, and the knowledge chapters. |
| Course sources | `dev/careers/sources/<id>/` | `course.json` and `cards/` and `knowledge/` are in git. `outline.md` and `acronyms.txt` (the vendor's own text) are gitignored and stay local. |
| Shipped package | `public/careers/<id>.json` | In git, so every clone gets the course. The app offers a course when this file answers. |
| Tests | `src/features/legends/career.test.js` | Ladder, sampling, versions, old saves still load, and the shipped package's coverage. |

Rules the engine keeps (do not break them):
- **All islands are open.** Inside an island every objective is open. An objective's lessons go in order, then its checkpoint (`PASS.checkpoint` 70%).
- **The boss opens after EVERY checkpoint of its island.** Weak spots open with the boss.
- **Bounded quizzes.** A checkpoint is written from at most `CAREER.checkpointItems` items, shakiest first, the same sample each visit (its question set is saved). A boss uses `CAREER.bossItems` items spread over every objective, fresh each attempt. A domain has up to about 260 items; sending them all broke the prompt.
- **The map version.** A career map is `version: 2` (`CAREER_MAP_VERSION`). A build from before career mode reads it as "newer" and never rewrites it. Plain maps keep version 1.
- **Never AI-planned.** A career map is never re-planned, extended, edited by Ebi, or given AI boss names. Boss names come from `course.json`.

## Own words only (legal rule, 2026-11-14)
The owner wants the course AND its flashcards in git, legally. So:
- **Course content in git is in our own words.** That covers cards, chapters and the built package.
- **The vendor's own documents stay local.** `outline.md` and `acronyms.txt` are gitignored.
- **What may match the outline:**
  - an objective's own title, as its section label;
  - official term names, one at a time.
- **What may not:** a run of 12 or more consecutive words from the outline. That includes a whole official list copied in its order: group and explain the terms instead.
- **Enforced** by `dev/careers/verbatim.mjs`:
  - `build-career.mjs` refuses to build;
  - `dev/careers/verbatim.test.js` fails, wherever the outline is present.
- **The exam is named only to describe the course.** Every course carries a trademark line (`noticeKey` in `CAREERS`, e.g. "Not affiliated with or endorsed by CompTIA...") shown on its welcome offer and island screen, and in the README.

This is a cautious standard, not legal advice.

## Steps: a new course
1. **Get the outline.**
   - Save the official objectives as `dev/careers/sources/<id>/outline.md`:
     - `# 1.0 <domain> (NN%)`
     - `## 1.1 <objective>.`
     - then `- item` and `  - sub-item` (2 spaces per level).
   - Optional: the vendor's acronym list as `acronyms.txt`, one `ACR|Expansion` per line.
   - Both stay local (gitignored). Never copy anyone's course videos or transcripts; link to free videos instead.
2. **Write the cards: one per outline line**, the domain line and each objective line included.
   - **Writers:** one per domain (split a big domain), each writing `cards/<prefix>-cards.json`.
   - **Card fields:** `{ obj, path, term, definition, example, category, keyPoints }`.
     - Plain and fluff free (`TEACHING_STYLE_RULE`), no dashes, no HTML.
     - `keyPoints` holds common mix-ups and how to tell things apart. Never wording that implies knowledge of what the real exam asks ("frequently tested", "exam trap"): nobody may know the questions.
     - When the vendor's wording differs from the standard name, the card gives both.
   - **The study guide** (the chapters Ebi reads as the mode's knowledge base): see "The study guide" below.
3. **Review twice, independently** (the reviewer briefs used for Security+ are reproduced in the plan's checklist):
   - **Pass 1:** an agent that did not write the cards checks every card against primary sources (standards bodies, RFCs, vendor docs, a well-known course's free notes). It fixes errors and writes `<prefix>-cards.r1.json` and `-knowledge.r1.md`, plus a change log with the source for each change.
   - **Pass 2:** a different agent re-checks every pass-1 change (and reverts wrong ones), then reads every card again from scratch. It writes `.r2` files.
   - **Output contract for both passes:** the same array length, the same obj, path and order, valid JSON, no dashes.
4. **Fill `course.json`.**
   - Fields: `id`, `title`, `version`, `deck` (the Anki deck root), `tagPrefix`, and `standardNames` for acronyms.
   - One `areas[]` entry per domain, in order, each with:
     - `motif`: one of `MOTIFS` in map.js, a different one per island, fitting the domain;
     - `palette`, `bossName`, `theme`;
     - `story` (up to 3 lines) and `canDo` (up to 4).
5. **Build:**
   ```
   node dev/careers/build-career.mjs <id> --knowledge "<mode name>"
   ```
   - It must print `no problems`. Missing, extra or duplicate cards, a card without a field, dashes, HTML, or a domain not reviewed twice each stop the build.
   - Nothing pushes the course into Anki: the course is a library inside Legends, and the learner's deck holds only the cards they add with "Add to deck" (which recognizes a card already there). Starting a course gives the mode an EMPTY deck named after the course when it has none (`pickCourseDeck`).
6. **Register the course.** Add one `CAREERS` entry in `career.js`:
   - `id`, `titleKey`, `url: '/careers/<id>.json'`;
   - `match`: a regex on the mode's name or description, so the welcome screen recommends it.

   Add the `titleKey` string to all four locales.
7. **Test the package.** Copy the "shipped Security+ course" block in `career.test.js` for the new course, with its own domain, objective and weight table and its card count.
8. **Check the GUI** in Playwright's bundled Chromium on port 3001, with every write stubbed and `/api/feature-data` in memory.
   - The welcome offer, Start the course, the island strip, an island page, an expanded objective, the checkpoint and the boss card.
   - Desktop and phone, light and dark, and a high zoom.
   - Seed progress by importing `/src/features/legends/map.js` in the page and calling `normalizeMap` first. A raw built map is all locked until normalized.
   - Look at every screenshot.
9. **Independent review** of the diff and the screenshots. Then `npx vitest run` and `npx vite build`. Bump the version and commit.

## The study guide (the course's knowledge base)
A course ships a guide that Ebi reads everywhere (Chat, Help, question writing, grading, Learn it). Design and the three
user angles: `docs/plans/2026-11-15-security-plus-knowledge.md`.
1. **Write** one chapter per domain part plus a reference chapter (`d0`: the one home of exact numbers), as
   `knowledge/<prefix>-knowledge.rN.md`. One agent per chapter, at most three at a time (more drains the usage limit).
   The writer's brief used for Security+ is the model: every `###` section names its term, stands alone, is 1,500 to
   4,000 characters, and holds a core, how it works, why it matters, common confusions and a self-written scenario;
   "X vs Y" tables for confusable clusters; no question-and-answer blocks; every heading unique and at most 110
   characters; every fact traced to a source read that session, with source notes in `reviews/<prefix>-kb-rN-sources.md`.
2. **Review twice, independently**: each reviewer checks every fact against primary sources, compares with the cards,
   and writes the next pass plus `reviews/<prefix>-kb-review<K>.md`. Review the reference chapter first: the others
   are compared against it.
3. **List the chapters** in `course.json`: `"knowledge": [{ "prefix": "d1", "title": "Domain 1: ..." }]`. Only listed
   prefixes ship; an unlisted one is retired.
4. **Build.** The build checks the guide's shape (first two lines, unique titles, heading and section size, no dashes
   or links) and both overlap checks, then writes `public/careers/<id>/knowledge/<prefix>.md` and `manifest.json`.
5. **Delivery is automatic**: opening the course installs or updates the guide in the mode's knowledge base
   (`src/server/courseKnowledge.js`: files named `course-<id>-*`, the learner's notes untouched, a deleted chapter
   stays deleted, Settings > Knowledge shows one group with Restore).
6. **Judge on real replies**: an independent agent asks Chat and Learn it real questions and grades real answers with
   the guide installed, on the owner's own setup, and checks the section picker finds the right section.

## Done when
- [ ] `node dev/careers/build-career.mjs <id>` prints `no problems`. Coverage is one card per outline line, every domain reviewed twice (`.r2` files).
- [ ] `public/careers/<id>.json`, the cards, the chapters and `course.json` are in git. The outline and acronym list are not.
- [ ] `career.test.js` has a block for the course (domains, objectives, weights, card count, lessons, checkpoints, boss), and `npx vitest run` is green.
- [ ] Screenshots taken and looked at: desktop and phone, both themes, a high zoom, each career screen.
- [ ] An independent review found nothing left to fix.

## Pitfalls (dated)
- 2026-11-14: `ProgressBar` needs `max`. Without it every bar showed empty.
- 2026-11-14: on a phone at high zoom the island cards stack, and picking one changed the page out of sight. The island page scrolls into view on a pick.
- 2026-11-14: the start tile alone sat 5 questionnaire steps deep. A matching course is offered on the welcome screen.
- 2026-11-14: a whole domain sent to the boss prompt (about 260 items) was far too big. Quizzes sample items (`careerQuizItems`).
- 2026-11-14: reviewers changed a meaning only where a well-known course teaches it differently (attestation, parallel processing, blocked content). Keep the exam's sense first and name the other one.
- 2026-11-15: a reviewer's change log named and linked a banned third-party course creator. Every writer and reviewer brief says: never name, quote or link a third-party course or its creator, in cards, chapters OR logs; describe it generically. `src/config/bannedNames.test.js` catches it in tracked files.
- 2026-11-15: an independent coverage check found two acronyms differing only in case ("SoC", "SOC") sharing one item id, so the final raid could ask only one. Acronym ids keep a mixed-case pattern; the build and `career.test.js` fail on a shared id.
