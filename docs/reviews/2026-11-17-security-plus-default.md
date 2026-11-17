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

## Re-check after the fix (4c690a3, 1.72.0)

Setup as before, script `scratchpad/sp2.mjs`. All writes were answered locally. On the fresh profiles the
`POST /api/modes` stub echoed success and kept the new list in memory, so the new mode appeared. The fresh Anki is a
fake one holding only "Default". No AI host was reached; the only outside request blocked was Google Fonts.
Screenshots: `sp-default\fix-<profile>-<width>-NN-<step>.png` in the same folder.

| Profile | Width | Career tile first | Button visible without scrolling | Click lands on | Course map opens | Spanish | Result |
|---|---|---|---|---|---|---|---|
| Owner (Spanish (LatAm) active) | 1280 | yes | yes | Security+ / Security+ | yes, at once (saved map) | none | PASS |
| Owner (Spanish (LatAm) active) | 390 | yes | tile heading yes, button NO (top 811 px, bottom bar from 774) | Security+ / Security+ | yes, at once | none | PASS, phone weak spot |
| Fresh, with key | 1280 | yes | yes | Security+ / "Security+ (?)" | after a 2nd click, "Start the course" | none | FAIL (2 issues below) |
| Fresh, with key | 390 | yes | tile heading yes, button NO (top 811 px) | Security+ / "Security+ (?)" | after a 2nd click | none | FAIL |
| Fresh, no key | 1280 | yes | yes, once Settings is closed | Security+ / "Security+ (?)" | after a 2nd click | none | make-mode PASS; same FAIL items |
| Fresh, no key | 390 | yes | NO (top 1008 px) | Security+ / "Security+ (?)" | after a 2nd click | none | same as above |

What passes:
- The career tile is now the first tile in every mode: Spanish (LatAm), My Studies, and the new Security+ mode.
- Owner profile: one click on "Open it in Security+" switches to mode Security+ with deck Security+ and shows the saved
  course map. The first lesson is in English.
- Fresh profile: "Make a Security+ mode and open it" posts one new mode (`Security+`, type general, deck `Security+`),
  switches to it and shows "Created the "Security+" mode and switched to it". It makes no AI call and works with no
  key. Every screen is English.
- Fresh with no key: Settings > AI & cost opens by itself at start (the app's existing no-key behavior); after Close
  the button works. The map opens; Continue then says "Legends needs an AI key", which is expected (lessons quiz with AI).

What fails or is weak:
1. **"...and open it" does not open the course** (fresh profile). The new mode lands on its own first-choice screen
   and needs a second click, "Start the course". The button text promises one step.
   Source: the button in `LegendsScreen.jsx` (about line 536) only calls `createForCourse` and does not start the
   course. Fix: after the switch, start the course in the new mode (`saveStart({ path: 'career', career: c.id })`
   pinned to the new mode id), or carry a "start this course" intent that the new mode's screen runs once.
2. **The Security+ deck is never created in Anki** (fresh profile). The header shows "Security+ (?)" (App.jsx about
   line 16164: the deck is not in Anki's list) before and after Start. No `createDeck` reached Anki.
   - Source: `createCourseMode` (App.jsx about line 14925) saves `ankiDeck: 'Security+'` on the mode. On Start,
     `chooseCourseDeck` (deck.js) returns early because `subject.modeDeck` is already set, so it never runs
     `pickCourseDeck` / `createDeck`.
   - Not run, from the code: the first "Add to deck" would then go to a missing deck; AnkiConnect normally refuses that.
   - Fix: make the mode with no deck and let `chooseCourseDeck` create or pick it. That also keeps the "(my cards)"
     rule when a full "Security+" deck already exists. Or have `createForCourse` create the deck when Anki answers.
3. **Phone (390 x 844): the tile's button is below the fold** in every profile. The tile heading "Career mode" shows,
   but the button sits under the Ebi picture, the question bubble and the description. On desktop it is in view.
   Fix: put the course name and button at the top of the tile, or shorten the description and the picture on phones.

## Re-check 2 (5f5c9e8, 1.72.1)

Same script, `scratchpad/sp2.mjs`, plus a case with Anki down: every `/api/anki` call answered
`{code:'notRunning'}`, as the real proxy does. Button position is measured against the top of the phone bottom bar,
766 px at 390 x 844. Screenshots: `sp-default\fix-<case>-<width>-NN-<step>.png` (this run replaced the previous fix-*
set).

| Case | Width | Button top / bottom vs bar top | One click to the course map | Mode / deck after | createDeck "Security+" | Spanish | Result |
|---|---|---|---|---|---|---|---|
| Fresh, with key | 1280 | 472 / 558 (viewport 800) | yes | Security+ / Security+ | yes, before the mode save | none | PASS |
| Fresh, with key | 390 | 663 / 748 vs 766 | yes | Security+ / Security+ | yes | none | PASS |
| Fresh, no key | 1280 | 570 / 655 after closing the Settings that open by themselves | yes | Security+ / Security+ | yes | none | PASS |
| Fresh, no key | 390 | **851 / 937 vs 766** | yes, after scrolling | Security+ / Security+ | yes | none | FAIL on visibility only |
| Fresh, Anki down | 1280 | 472 / 558 | yes | Security+ / "Anki not connected"; mode saved with deck `Security+` | not possible (Anki down) | none | PASS |
| Fresh, Anki down | 390 | 663 / 748 vs 766 | yes | same | not possible | none | PASS |
| Owner, Spanish (LatAm) active | 390 | 663 / 748 vs 766 | yes ("Open it in Security+") | Security+ / Security+ | not needed (deck exists) | none | PASS |

Order of requests on the fresh profile: `createDeck Security+` → `POST /api/modes` (new mode `Security+`, general,
deck `Security+`, old mode still active) → `POST feature-data map-<new id>` (the course) → `POST /api/modes` (switch)
→ study guide install. With a key, Continue opens the first lesson in English. With no key, Continue shows "Legends
needs an AI key" (expected).

Still weak:
1. **No key on a phone: the button is below the fold (top 851 px, bar at 766 px).** Two extra rows push it down: the
   amber "no Anthropic key" banner above the header and the "Legends needs an AI key" line. Fix: on narrow widths
   put the needs-key line under the tiles (or drop it, since the banner already says so), or shrink the Ebi picture.
2. **Wrong wording in the toast after the click:** "Created the "Security+" mode and switched to it. It is saved, so
   you can close Settings anytime." This shows on the Legends screen, where no Settings is open. `createCourseMode`
   reuses `mode_createdNotice`, which is written for Settings. Fix: its own string without the Settings sentence, in
   all four locales.

## Re-check 3 (c39d883, 1.72.2)

Same script (`scratchpad/sp2.mjs`, now also reading the toast), 390 x 844. The phone bottom bar's top is at 766 px.

| Case | Button top / bottom vs bar top | Toast after the click | Mode / deck | Spanish | Result |
|---|---|---|---|---|---|
| Fresh, with key | 663 / 748 vs 766: visible | Made the "Security+" mode for the course. | Security+ / Security+ | none | PASS |
| Fresh, no key | **789 / 875 vs 766**: hidden by 23 px | Made the "Security+" mode for the course. | Security+ / Security+ | none | FAIL on visibility |

- The needs-key line now sits under the tiles (fix-fresh-nokey-390-02-settings-closed.png): that part works.
- With no key the button is still 23 px under the bar. On its own, the app-level amber banner ("Settings is set to
  Anthropic (Claude), but this computer has no Anthropic (Claude) key saved" + "Add a key", about 126 px) pushes the
  tile down. The screenshot shows only the tile's heading and the course name above the bar.
  - Fix, either is enough: shrink the Ebi picture or the top margin of the choice screen on phones, or make the
    banner one line on narrow widths.
- The toast text is right in both cases. Minor: on a phone it covers part of the "Continue" button on the course map
  for a few seconds (fix-fresh-390-02-after-click.png).
- One click still lands on the course map in mode Security+ with deck Security+ in both cases. With a key, the first
  lesson opens in English.

## Re-check 4 (47e3cd8, 1.72.3)

390 x 844, bottom bar top at 766 px. Same script.

| Case | Button top / bottom vs bar top | Result |
|---|---|---|
| Fresh, with key | 619 / 705: fully visible | PASS |
| Fresh, no key | 746 / 832: only the top 20 px show, the label is hidden | FAIL (66 px short) |

Looking at the screenshots (fix-fresh-390-01-legends-first.png, fix-fresh-nokey-390-02-settings-closed.png):
- Ebi is smaller, but he is still on his own row ABOVE the bubble, not beside it. The bubble keeps the full width.
  The layout gained only the picture's height difference.
- The bubble reads well: "How do you want to play Legends in My Studies?" on two lines, not squeezed.
- With no key, the amber key banner (about 126 px) still pushes the button under the bar. The visible part is a
  green strip with no text.
- To fix it: actually put Ebi beside the bubble on phones (his row is about 125 px tall). That alone moves the
  button to about 620 px, above the bar. Or move the course name and button above the "Career mode" heading.
- The toast reads `Made the "Security+" mode for the course.` One click still lands on the course map in mode
  Security+ with deck Security+. No Spanish anywhere.


