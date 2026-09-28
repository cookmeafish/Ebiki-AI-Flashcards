# Legends mode: roadmap

Status: planned, not started. Everything else from the Duolingo-inspired plan is built on the `app-expansion`
branch (Practice hub, Mistake Gym, Leech Doctor, Ebi Call, Roleplay, Listen & Speak, Scenes, game layer, speech,
adaptive cards, rule cards, practice log). Legends is the last big piece.

**Hard rules (apply to every step below)**

- Works for ANY subject: a language, CompTIA, music theory, pilot training, communication skills. Never a
  language-only feature. A Spanish mode's map teaches Spanish; a CompTIA mode's map teaches CompTIA, never
  "CompTIA vocabulary in Spanish".
- No em or en dashes anywhere the user can see (UI, prompts' visible output, translations).
- Built as a feature plug-in: one folder `src/features/legends/`, one line in `src/features/index.js` (and one in
  `src/features/server.js` only if it needs server storage). Removing it removes nothing else.
- All text in `src/i18n/locales/<code>.js`, all four languages, key prefix `lg_`.
- Portable: logic in plain `.js` (no `window`/`document`/`fetch` to `/api`), UI in `.jsx`, storage through the
  framework store (`featureStore`), device access through `src/platform`.

---

## 1. What the user sees

1. **First visit per mode: a short questionnaire** (Duolingo style, Ebi in a speech bubble, one question per
   screen, big tiles):
   - Why are you learning this? (work, school/exam, travel, fun, a person, other) with icons.
   - How much do you already know? Five bars, from "I'm new" to "I know it well".
   - Daily goal (Relaxed / Normal / Serious / Intense, the same goals the game layer already uses).
   - "I'm new to this" (start from the basics) **or** "Find my level" (placement exam).
2. **Placement exam** (only on "Find my level"): 10 to 30 questions, adaptive, from very easy to college level,
   scoped to the mode's subject only. Mostly sentence answers (graded by the AI judge), some multiple choice.
   Covers rules too (grammar and orthography for languages; principles and procedures for other subjects).
   Ends early once the level is clear (a few misses in a row at one level).
3. **The map**: a vertical scroll of **areas** (themed regions, each with its own SVG art). Each area is a
   **ladder** of nodes climbed bottom to top, with a **boss** at the top. Unlocked areas and nodes are bright;
   locked ones are grey; finished ones glow with a crown or star.
4. **A node** is a short lesson (5 to 10 minutes). Node kinds (reusing what exists):
   - Learn: a "Learn it" style teach panel for 2 to 4 new items, then questions (QuizRunner).
   - Practice: mixed questions on the area's items (QuizRunner, adaptive: multiple choice for new or weak items).
   - Scene: a story or case study built on the area's items (`kit/scene.js`), then comprehension questions.
   - Rule: one grammar/orthography rule (languages) or principle (other subjects), taught, then drilled; offers a
     rule card (`RuleCardButton`).
   - Talk (optional, when Voice chat is on): a short Roleplay/Ebi Call style exchange on the area's topic.
5. **Boss**: a harder mixed test of the whole area (15 to 20 questions, fewer hints, sentence answers). Passing
   finishes the area and opens the next one. Failing shows what to review (a Mistake Gym style list) and lets the
   learner retry.
6. **Cards**: every Learn and Rule node offers "Add to deck" for its items (through `ctx.cards.addNew`, the mode's
   deck, tags `ebiki`, `legends`, `lg-<area-slug>`). Nothing is added without a click.
7. **Level score** (the Duolingo Score equivalent): a number per mode (for example 1 to 130, or CEFR-like bands
   A1 to C2 for languages, Beginner to Expert elsewhere), shown on the map header and in Stats. Starts from the
   placement exam and moves with study, Mistake Gym, Ebi Call, Roleplay and Legends results.

---

## 2. Data model (per mode, framework store)

Stored with `featureStore('legends')` under the data folder (`features/legends/`), key `map-<modeId>`,
`learner-<modeId>`. Same clobber rules as every store: write only after a successful read, never while the data
folder is switching.

```text
LegendsMap {
  version: 1
  modeId, subject (name + description at creation, for prompts)
  createdAt, updatedAt
  start: { reason, selfRating (1..5), goal, placement: { level, score, answered, at } | null }
  areas: Area[]                       // ordered bottom (first) to top
}
Area {
  id (stable slug), title, theme (short art brief), art: { svg?, palette, motif }
  status: 'locked' | 'open' | 'done'
  items: Item[]                       // what the area teaches (terms, rules, skills)
  nodes: Node[]                       // bottom to top; the last one is the boss
  frozen: boolean                     // true once the learner started it (see section 4)
}
Node {
  id (stable), kind: 'learn' | 'practice' | 'scene' | 'rule' | 'talk' | 'boss'
  title, itemIds: string[], status: 'locked' | 'open' | 'done', stars: 0..3, bestScore, attempts
}
Item { id (stable), kind: 'term' | 'rule' | 'skill', front, back, cardNoteId? }
LearnerModel {
  level (number), band (label), confidence (0..1)
  strengths: string[], gaps: string[]   // short topic names
  history: [{ at, source: 'placement' | 'study' | 'gym' | 'call' | 'roleplay' | 'legends', delta }]
}
```

Pure functions (tested, in `src/features/legends/map.js` and `learner.js`): unlock rules, star rules, applying a
node result, freezing, merging an AI edit (section 4), level updates.

---

## 3. Generation (AI)

All prompts in `src/features/legends/prompt.js`, parsed with `ai.json` and validated by pure `parse*` functions
(like `roleplay/scoring.js`). Roles: `general` for planning the map, `study` for questions, `deck` for items that
may become cards (they get memorized, so the strongest tier).

1. **Placement exam** (`buildPlacementPrompt`): generated in small batches by level (very easy, easy, medium,
   hard, college), scoped strictly to the subject, with the knowledge base (`subject.knowledge`) when there is one.
   Answers graded with `kit/judge.js`. The result sets `start.placement` and the first `LearnerModel`.
2. **Map plan** (`buildMapPrompt`): 6 to 12 areas from the learner's level upward (skipping what the placement
   proved known, keeping one review area). Each area: title, one-line theme (also the art brief), 6 to 12 items,
   5 to 8 nodes plus a boss. Rules and orthography areas included for languages; principles and procedures for
   other subjects.
3. **Areas are generated lazily**: only the next 2 areas are fully detailed (items and node content); later ones
   stay as titles and themes until the learner gets close. Cheaper, and the plan can adapt to how the learner is
   doing.
4. **Node content** is generated when a node opens (questions, scene), cached with the question-reuse store when
   that setting is on, and verified like study questions (leak guard, one correct answer, real options).

---

## 4. Modular edits by Ebi (without breaking progress)

The user can ask Ebi (Help chat or a "Change my map" box) to restyle or reshape Legends, for example "more
listening", "add an area about subnetting", "make the art spooky".

- A new Help action `legends_edit` (CAPABILITIES text in HelpChat + an `onAction` branch + a receipt, like
  `deck_edit`) sends the request to `buildMapEditPrompt`, which returns a proposal.
- **Frozen areas are never changed**: an area the learner started (`frozen: true`) keeps its items, nodes, stars
  and art. Edits apply only to areas not yet started. Finished areas never gain nodes or cards.
- The proposal is shown as a before/after review (like bulk edit), applied only on Accept, merged by stable ids.
- Map `version` lets a future format change migrate old maps instead of discarding them.

---

## 5. Area art (SVG)

- Each area gets a small illustrated banner, generated as **inline SVG** from its theme (a simple style guide in
  the prompt: flat shapes, the app palette tokens, a few landmarks, Ebi optional), sanitized like every rendered
  SVG (no scripts, no external URLs, see the DOMPurify rules in the project notes), and cached in the map.
- Fallback when generation fails or is off: a set of hand-made SVG templates in `src/features/legends/art/`
  (forest, city, ocean, mountains, lab, stage, sky, desert) tinted by the area's palette.
- The ladder itself is drawn by the app (not the AI): nodes as round chunky buttons on a winding path, the boss as
  a larger node with a crown.

---

## 6. How it plugs into what exists

| Piece | Reused from |
| --- | --- |
| Screen in the sidebar | `navItems` slot (`legends`, icon, `rail: true`) |
| Questions and grading | `kit/QuizRunner`, `kit/judge.js`, `kit/grade.js` (audio/speak kinds when Voice chat is on) |
| Stories and case studies | `kit/scene.js` |
| Rule nodes | `kit/ruleCard.js`, `RuleCardButton` |
| Not repeating recent practice | `kit/practiceLog` (record Legends items; prefer fresh ones) |
| XP, quests, streak | `EVENTS.PRACTICE_DONE` with `source: 'legends'` (already mapped to the `legends` quest and XP) |
| Adaptive difficulty | same rule as adaptive cards: new or weak items get multiple choice |
| Cards | `ctx.cards.addNew` (fires `CARDS_ADDED`) |
| Level score everywhere | a small `learner` service other features read (Ebi Call and Roleplay prompts already accept a `level` line) |
| Text | `src/i18n/locales/*.js`, prefix `lg_` |
| Storage | `featureStore('legends')` |

---

## 7. Build order

1. **Data and rules**: `map.js`, `learner.js` (pure, with tests): unlock, stars, freezing, merge of edits, level
   updates.
2. **Questionnaire** screen (4 steps) and storage of `start`.
3. **Placement exam**: prompt, batching by level, early stop, grading, first learner model. Tests on parsing and
   the stop rule.
4. **Map plan + lazy areas**: prompts, parsers, validation; map screen with the ladder (template art first).
5. **Nodes**: learn, practice, rule, scene, boss, each through QuizRunner/scene; results update stars, unlocks and
   the learner model; `PRACTICE_DONE` for XP and quests; "Add to deck".
6. **Level score**: shown on the map, in Stats, and fed to Ebi Call / Roleplay / Discover prompts.
7. **Ebi edits** (`legends_edit` action with review) and **generated SVG art** with sanitizing and fallbacks.
8. **Polish**: celebrations on area and boss completion (game layer), translations check, the drive script for
   the map, project notes section.

Each step ends with `npm test`, `npx vite build`, a drive of the screen, a version bump and a commit.

---

## 8. Open questions for the owner

- Level scale: one number (like Duolingo Score) for every subject, or bands (A1 to C2 for languages, Beginner to
  Expert otherwise), or both?
- Should finishing a boss suggest adding the whole area's items as cards in one click?
- Talk nodes: only when Voice chat is on, or typed conversations too?
- How many areas to plan at once (cost vs a map that feels complete from day one)?
