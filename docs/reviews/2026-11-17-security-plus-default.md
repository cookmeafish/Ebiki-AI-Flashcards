# Security+ course: does it default to the Security+ mode and deck? (2026-11-17)

The requirement: opening the Security+ course should land on the Security+ mode with its Security+ deck, never run in a
language mode (it once ran in Spanish). On a profile with no such mode, the app should create or offer exactly that in
one obvious step.

**Result: owner profile PASS (one click, with two weak spots). Fresh profile FAIL (no way to start the course).**

## How it works in the code

- `CAREERS` (src/features/legends/career.js) lists the course with `deck: 'Security+'` and
  `match: /security\s*\+|security\s*plus|sy0-?701/i`.
- `careerMatches(career, subject)` fits the course only to a NON-language mode whose name or description matches.
- The first Legends screen (`LegendsScreen.jsx`, `if (!map)` block, about line 496):
  - mode fits: a "Career mode" tile with "Start" (`saveStart({ path: 'career' })`); the deck comes from
    `chooseCourseDeck` (deck.js → `pickCourseDeck`): the mode's own deck if it has one, else a new empty "Security+".
  - mode does not fit but another mode does (`courseModes`): a small ghost button "<course> in <mode>" under the
    adventure tile, which calls `ctx.modes.switchTo(mode.id)`.
  - no mode fits anywhere: only the line `lg_pickCareerNone` ("Ready-made courses (...) live in their own mode.
    Switch modes in the header to take one."). No button.
- A course map already saved in a language mode shows `data-misplaced` with `moveCourse` to a fitting mode.
- `courseCtx` forces a general subject in the app language whatever mode holds a course map.

## How it was run

Agent server on port 3001, Playwright's bundled Chromium (muted), every outside host blocked (no AI calls), script
`scratchpad/sp.mjs`. Every non-GET `/api` request answered `{ok:true}` without forwarding; for `/api/anki` only
read-only actions (deckNames, findCards, cardsInfo, ...) reached Anki, every other action (sync, createDeck...) was
answered locally. Nothing was written to the owner's data or Anki. Widths 1280 x 800 and 390 x 844.

Screenshots: `C:\Users\User\AppData\Local\Temp\claude\2a0b332a35f80abc\0f540200-c71b-4d96-bca7-5172cee217a4\scratchpad\sp-default\`

## 1. Fresh profile (one general mode "My Studies", no deck, app language English)

| Step | Screenshot | Mode / deck | Language |
|---|---|---|---|
| Open Legends | fresh-1280-01-legends-first.png, fresh-390-01-legends-first.png, fresh-390-00-legends-first-fullpage.png | My Studies / Pick a deck | English |
| Open the header mode switcher | fresh-1280-02-mode-switcher-open.png, fresh-390-02-mode-switcher-open.png | My Studies / Pick a deck | English |

What happens: there is no Career mode tile and no button for the course. The only hint is "Ready-made courses
(CompTIA Security+ (SY0-701)) live in their own mode. Switch modes in the header to take one." The mode switcher holds
only "My Studies" and "Add mode...", so the hint points nowhere. Starting the course means: Add mode, name it so it
matches the regex, make it general, then come back to Legends. Several steps, none of them explained. On a phone the
hint is below the fold.

The text is also wrong for this case: `lg_courseNoMode` ("No mode fits {course} yet: make one named after it...")
exists but this screen uses `lg_pickCareerNone`, which assumes a fitting mode exists.

Not run, from the code: a fresh profile whose first mode is a language mode ends the same way.

**FAIL**: the course cannot be started from Legends, and nothing creates or offers a Security+ mode.

## 2. Owner's saved profile, read only (Spanish (LatAm) made active in memory; real config, modes, maps and Anki decks)

| Step | Screenshot | Mode / deck | Language |
|---|---|---|---|
| Open Legends in Spanish (LatAm) | owner-1280-01-legends-first.png, owner-390-01-legends-first.png, owner-390-00-legends-first-fullpage.png | Spanish (LatAm) / Español | English UI; course not run here |
| Click "CompTIA Security+ (SY0-701) in Security+" | owner-1280-02-after-goto.png, owner-390-02-after-goto.png | Security+ / Security+ | English |
| Course map | owner-1280-03-course-map.png, owner-1280-04-course-map-scrolled.png, owner-390-03-course-map.png, owner-390-04-course-map-scrolled.png | Security+ / Security+ | English |
| Continue to the first lesson | owner-1280-05-first-lesson.png, owner-390-05-first-lesson.png | Security+ / Security+ | English ("Security control categories", "Technical control", ...) |

The Spanish mode shows no course tile and does not run the course (the saved `park-13-course` course from before is
ignored, correct). One click switches to the Security+ mode with the Security+ deck in the header, the course map
shows "Your deck: Security+", and the lesson is in English. No Spanish words were found on any screen after the
switch (text scan plus looking at every screenshot). The switch tried to save the active mode (`POST /api/modes`) and
install the study guide (`POST /api/modes/knowledge/course?mode=Security+`); both were answered locally.

**PASS**, with two weak spots:
- It is not a default: from a language mode the course is a small ghost button under a large "Build my map" tile. On a
  phone it sits below the fold (owner-390-01 shows no course at all until you scroll).
- It relies on the owner having made a "Security+" mode by hand.

## What a fix at the source would be (not made)

In `LegendsScreen.jsx`, first-choice screen:
1. When no mode fits (`!fit.length && !goTo.length`), show a real Career mode tile whose button creates the course's
   mode in one step (general type, name "Security+", deck `career.deck`, description from the course), switches to
   it and starts the course (`saveStart({ path: 'career' })` after the switch). That needs a generic
   `ctx.modes.create(spec)` service in the feature context (App's `createMode` / `uniqueModeName`, honoring
   `dataSwitchingRef`), plus an onboarding mention if this counts as a big feature.
2. When another mode fits (`goTo`), show the same Career mode tile (with "Open in Security+") at the top instead of a
   small link under the adventure tile, so it is visible on a phone without scrolling.
3. Use `lg_courseNoMode`-style wording only where it is true.
