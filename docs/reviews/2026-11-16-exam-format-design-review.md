# Design review: docs/plans/2026-11-16-exam-format-questions.md, "## Design" (D1 to D12)

Reviewer: independent, did not write the design. No repo file was edited. Date 2026-11-16.

What was read: the whole plan (scope, six angle lists, Design, Phase B, style guide with 4b) and the code it cites:
`src/features/legends/{generate,career,fight,store,map}.js`, `abilities/_rules.js`, `NodeRun.jsx`, `BossArena.jsx`
(bossOdds), `CareerMap.jsx` (loadCareer), `LegendsScreen.jsx` (course open effect), `src/features/kit/QuizRunner.jsx`,
`src/features/storage.js`, `storage-server.js`, `src/config/grading.js`, `src/pbq/engine.js` (exports),
`src/utils/keys.js`, `src/config/aiJobs.js`, `dev/careers/build-career.mjs`, `public/careers/` and the shipped package
(parsed and counted). Not read in full: `prompt.js`, `judge.js`, `grade.js`, `map.js` beyond the cited functions.

Verdict in one line: the design is careful and most code claims are right, but the question shape is not yet
freezable and Step 1 is far too big. NO-GO for Step 1 as written; GO for a narrowed Step 1a (shape + checks +
validator) once blockers 1 to 5 are decided in the design text.

---

## Counts (item 2)

- Ids in the angle lists: **250** (W 56, E 44, B 38, R 34, P 44, K 34). The phone heading says "P1 to P34" but the
  list runs to P44; the R and P headings are doubled. Fix the headings.
- Coverage table: **45 rows, 134 id cells, 250 ids covered, each exactly once, none missing, none extra** (counted by
  script).
- Declined or deferred: R13 (declined, sound: no bulk action exists), K31 strict mode (declined, sound), B24 and B25
  (deferred to Step 3, acceptable), P38 for fights (partly declined, acceptable and said honestly).
- Mapped to a section that does not really address them: W16 (fights), P41, W13, W19, P30, P37 (fights and tasks),
  R29, R4 (small inaccuracy), W10 (met only by auto-upholding). Details in findings 9, 12, 5, 6, 22, 21, 11, 24, 8.

## Fight balance (item 5)

Model: every question independent, right with probability p. Rules re-stated from `fight.js` lines 114 to 137 with
the proposed `COURSE_FIGHT.rules` (right = 1 damage, every 3rd right in a row +1, miss = 1 heart and combo reset,
a miss inserts an attack 3 questions later up to 5 per fight, attack right = 1 damage, attack wrong = 1 heart),
the run loop of `NodeRun.jsx` 545 to 590, and `finish` (NodeRun 473: questions running out with hearts left = win).
60,000 fights per cell. "Binomial" = the same race without the critical hit; it equals P(Bin(T, p) >= need) exactly,
because need + hearts = T + 1 and attacks only add trials.

| Fight | p = 0.40 | 0.55 | 0.65 | 0.75 | 0.65 within 3 tries |
|---|---|---|---|---|---|
| Region 15 (9 hp, 7 hearts), binomial | 9.5% | 45.2% | 75.5% | 94.3% | |
| Region, as designed (crits + attacks) | 13.6% | **51.7%** | **80.0%** | **95.7%** | 99.2% |
| Raid 25 (16, 10), binomial | 1.3% | 24.2% | 63.0% | 92.9% | |
| Raid, as designed | 3.3% | **35.2%** | **72.7%** | **95.7%** | 98.0% |
| Final 30 (20, 11), binomial | 0.3% | 13.5% | 50.8% | 89.4% | |
| Final, as designed | 1.1% | **23.9%** | **64.5%** | **93.9%** | 95.5% |
| Legendary 20 at 0.9 (18, 3), as designed | 0.0% | 0.5% | 3.8% | 17.4% | (p 0.85: 53.9%) |

With one free question and two reported misses refunded (D2.6, D4.5): region 26.7% at 0.40, 73.1% at 0.55, 92.7% at
0.65; raid 53.6% at 0.55; final 39.7% at 0.55.

Reading:
- "Winnable at about 65% within a few attempts" **holds**, with room: 80 / 73 / 65% per attempt, 95%+ within three.
  D4.7's own thresholds all pass (region at 0.40 is 13.6% against a 15% cap: thin).
- 75% is **too easy for the region boss and the raid** (about 96% first try) and generous for the final raid (94%).
  A region boss barely gates at 55% (52% per attempt, 89% within three). If the owner wants the final raid to mean
  something, raise `final` to 0.70 (21 hp, 10 hearts: about 50% at 0.65 by the binomial plus the crit lift) or drop
  the crit for course fights.
- The critical hit is worth +4 to +14 points and makes "9 right answers win" false (7 right in a row empty a 9 bar).
  The intro card must say "health 9", not "9 right answers".
- Two reports turn the 0.40 learner from 13.6% to 26.7%, over D4.7's own cap. See finding 8.
- Abilities and powers: no interaction. `NodeRun` calls `strike(before, hit, { shield })` with no `ability` (line
  573), and powers are raid-only (`RaidRun`). A course raid only wears raid art (`raidLook`, NodeRun 626).
- Shield: works unchanged (absorbs one heart, `fight.js` 162), so a shielded fight can run out of questions one short
  of the bar and still win (NodeRun 472 to 473 says so). The free question and each report refund do the same.
- Legendary gets much harder than today for a typed learner (today a clean typed answer deals 2 against the same 18
  bar). Say so in the notice or give Legendary its own number.

---

## Findings

### BLOCKERS (decide before the bank pilot writes a question)

**1. Lesson rule "at least one wrong option must be taught; a slot with none is not used" breaks the no-key goal and
is not an authoring rule.** (D4.1, D3.5; owner goal "works with no AI key from the bank"; B2, B4)
Evidence: bank options are fixed at authoring time, the taught set is per learner (all islands and regions are open,
`career.js` 365 to 389). 72 of 300 lessons teach one card; in the best linear path 7 lessons have fewer than 2
askable cards taught in their objective and 18 fewer than 4 (counted from the package). Nothing tells an author
which cards a learner will have met, so many level 1 slots will have zero taught wrong options, the card is
dropped, a one-card lesson falls under `MIN_SHARE`, and the step falls back to `makeQuizNow` (needs a key) or the
"not installed" screen. Also unclear whether an `item: null` option counts as taught.
Correction: make it an authoring and build rule. For every card, its two `d` and two `s` lesson slots take wrong
options only from (a) cards of the same or an earlier lesson of the same objective in package order, or (b) plain
descriptions with `item: null` that the card's own text rules out. `build-bank.mjs` checks this against the package's
lesson order. In the app the taught preference then only sorts, never excludes: a lesson-ready slot is always usable.
State that `item: null` is neutral.

**2. The shape in D2.1 cannot be frozen as written.** (D2.1, D3.2)
- a. The design's own example fails its own stem-leak check: the stem has "crust", and exactly one option (the key,
  "Bake to a darker crust") contains it. Either the rule ("a content word of 5 or more letters that appears in
  exactly one option") is too strict for natural scenarios or the example is wrong. Decide which, and test the rule
  on the pilot before it becomes a hard fail (suggest: fail only when the single option is the KEY, warn otherwise).
- b. `runner` and `edge` are "required when any wrong option is partly true". Code cannot know that. Add
  `options[].partly: true` (set by the author, confirmed by pass 3); then "present exactly when required" is checkable.
- c. Pick 1 is forced to exactly 4 options. Style guide section 3 says 5 to 7 options also for single-answer "which
  control type" lists. A frozen format must allow 4 to 7 for pick 1 (`balancedOrder` and the key map 1 to 7 follow).
- d. `kind: "multi"` mixes the stem type with the answer count (a select-N can be a scenario or an artifact). Freeze
  `kind` as `definition | scenario | artifact` and let `pick` say N. The manifest code derives from both.
- e. `neg` is in the rules but not in the example; no length limits are given (stem, option, why, explain, ask).
  The validator needs numbers.
- f. `source.chapter` is "the study guide heading", but no study guide ships on this branch (`public/careers/` holds
  only the package file; `course.json` has no `knowledge` list). The build must check the heading against the latest
  chapter file in `dev/careers/sources/<id>/knowledge/`.
The shape I would approve is at the end.

**3. Nothing binds a bank question to the card text it was reviewed against.** (D3.1, D8; item 4 "package update
mid-course")
Evidence: `career.js` line 18: "a started course keeps the card text it started with; a package fix reaches it only
after Start over". Item ids hash the term, not the back (`build-career.mjs` 106), so a rewritten card keeps its id.
A learner mid-course reads the OLD card in the lesson and then gets a question proved against the NEW card (W19, B5
fail silently). The manifest has `course`, `format`, `rev` and no package version.
Correction: add `cardSig` (the hash `stepSig` uses over front and back) per question or per card in the manifest;
the build fails when a question's `cardSig` differs from the package's card (the question must be re-passed). In the
app, a card whose map text differs from the package gets its text refreshed from the package (front and back only,
tallies untouched; a new pure function beside `addAcronymTrack`, tested), or its slots are treated as unfilled.
Pick one and write it down.

**4. "Nothing shipped until clean" is not enforceable by the build as designed.** (D3.2; plan B4, B6; owner goal)
Evidence: D3.2 gates on `passes.json` per OBJECTIVE and `pulled.json`. A refill or a hand edit after pass 4 ships
unreviewed, and an objective with four stamps ships before oversight has answered (B6: "nothing in a domain ships to
learners until both checks are clean").
Correction: per question, each pass and oversight records the hash of the content it passed
(`passes: { p1, p2, p2b (BEST or MOST), p3, p4, oversight }`, dev-only file). The build ships a question only when
every required stamp equals the hash of the text being shipped. This is cheap and makes the owner's rule mechanical.

**5. Several D3.2 checks have no deterministic definition, and Step 1 is not small.** (D1, D3.2; item 6)
- Not buildable as written: "parallel options: one grammatical shape" (no parser in the repo), `stemSkeleton`
  "names of roles and organizations folded" (needs word lists), "detail or a card sentence sharing its content words",
  "an artifact only when the card's text names that kind of artifact", "`ask` uses a known closing form" (the list is
  not given). Each needs an exact rule and an invented passing and failing case, or it moves to reviewer pass 3 with
  a named checklist line. For W19 add to plan B4 pass 2: level 1 questions are blind solved with ONLY the card text.
- Step 1 as listed is the shape, two components, report, bank reader, picker, the planner for seven step kinds, the
  fight profile, acronym questions, live generation with two AI jobs, the notice and the validator. That is four
  deliverables. Split:
  - **1a (unblocks the pilot):** `exam/examQuestion.js` (`shapeExamQuestion`, `gradeExamAnswer`), `exam/examChecks.js`,
    `dev/careers/build-bank.mjs`, the manifest format, `bank-package.test.js`, `examQuestion.test.js`,
    `examChecks.test.js`, plus a dev-only preview page so reviewers and the owner can read pilot questions rendered.
  - **1b:** `ExamQuestion.jsx`, `ExamExplanation.jsx`, bank source and picker, pick state, lessons, Weak spots,
    checkpoints, acronym questions, report, notice, classic fallback, the no-key gates.
  - **1c:** course fights (profile, simulation, attacks, free question, hint scroll, Legendary).
  - **1d (after the pilot is in):** live generation. It is the "optional extra", carries the AI checks, the copying
    proof and the cost proof, and nothing else waits on it. Until then the fallback is the classic path.

### SHOULD FIX

**6. Wrong or incomplete claims about the code.**
- D2.6 / D4.3: "`refundRunningFight` gives the heart back". It also deals the damage a right answer would have dealt
  and moves the miss to the clean counter (`fight.js` 254 to 303; `refundFor` returns `damage: due - cost.damage`).
  A reported miss would count as a hit. Add a hearts-only path (`applyRefund` with `damage: 0`, counters untouched)
  and say whether a reported question leaves `answers.current` (it should carry no `itemId`, so no tally moves;
  `onOverturn` at NodeRun 402 to 404 marks it correct, which is wrong for a report).
- D4.3 "branches in four small places". There are at least twelve in `NodeRun.jsx`: line 513 (the lesson's start
  button is `disabled={!ai.hasKey}`: no lesson starts without a key today), 387 and 471 and 543 (odds need `pass`),
  389 and 666 (`weakTo` names still shown; `weakToMax` in the profile is read by nothing, `fight.js` 216 uses the
  constant), 477 (`power` = `st.safe === 0` is always true on the clean branch, so every course win sets `allPower`),
  478 (`effortOf` pays clean typed effort 1.3 for a 4-option pick; XP inflates), 561 (the answer snapshot has no
  `exam` block, so "See all answers" cannot show options or why lines), 594 (`judge`), 611 (`lg_attackIncoming` prints
  the constant `ATTACK_LIVES` = 2, the course costs 1), 615 (strike hint), 622 (scroll tool), 634, 637 to 642
  (`MissTools`). List them, and move `bossOdds` out of `BossArena.jsx` (line 44) into a pure module so
  `courseFight.test.js` does not import a screen.
- D4.5 "a one-line change in `strike`": it must sit before the Shield line (`fight.js` 162) or a free miss spends the
  shield; `applyRes` then plays `kind: 'block'`; `s.misses++` and the combo reset still run; and NodeRun 578 still
  inserts an attack for that miss (an attack born from a free question can cost a heart). Specify all four.
- D6.1 "imports the engine's pure helpers (`itemKey`, `norm`, the shuffle)": `norm` and `itemKey` are exported
  (`engine.js` 59, 84); the shuffle (`shuffledIndices`, line 95) is not.
- D3.1 largest objective: 2.4 has 53 items in the package (the design says 52 cards; fine if one is a briefing).
- D5.5 key `xq-live-<mode>-<obj>`: `obj` is "2.3" and the store accepts only `^[a-z0-9][a-z0-9-]{0,63}$`
  (`storage-server.js` 7). Write `2-3`, and run the mode id through the same cleaning as `keyFor` (`store.js` 19).

**7. The picker's cycle is ambiguous and can break the owner's rule.** (D3.3, D3.4; owner: another not asked yet,
never one of the last 3)
One `a` string per card is shared by every kind of step, but eligibility differs (a lesson can use 2 `d` slots, a
boss 4 to 6 level 2 slots). "When every eligible slot was asked: start a new cycle" either wipes the record of boss
slots asked (they can repeat before all 10 were seen) or is undefined. Also undefined: where the attack's and the
retry's "another slot" comes from (QuizRunner's `record` and NodeRun's `record` are synchronous, lines 186 to 204
and 545 to 590), and whether it is noted as picked.
Correction: keep one last-asked ORDER per card (least recently asked first). Pick at random among eligible slots
never asked; when none, among eligible slots outside the 3 most recently asked of the card (outside the last 1 when
3 or fewer are eligible). No reset ever. Plan a spare slot per card when the quiz is built (for the retry and the
attack) and note it only when shown. Store `a` and `p` as one string so a 3-way merge cannot mix two computers'
halves.

**8. Report is a free heart, twice a fight, with no check.** (D2.6, conflict 9; W10)
Any miss can be reported and refunded; see the balance table (0.40 learner: 13.6% to 26.7%). It also removes a good
question from that learner for good. Correction: a report never refunds on the spot in a fight; it removes the
question from the future and from lesson scores, and the heart comes back only when the miss is the fight's deciding
one, or cap at 1 and add the reports to the D4.7 simulation with its own threshold. In lessons and review it is
harmless as designed.

**9. W16 is not met in fights.** (D4.3 points to `revealsAnother`, defined in D7.2 for the exam)
In a fight the explanation shows after every answer with a why line for each option, and options come from one
family, so an earlier explanation routinely describes a later question's key. `revealsAnother` as written ("why lines
visible during the exam") does not cover this, and applied literally it would reject most same-objective pairs.
Decide: either accept it in fights and say so (explanations teach), or check stems, artifacts and option texts only
and order questions so a card's own question comes before any question that lists it as a wrong option.

**10. Live questions get a weaker truth check than the owner asked for, and are the default before the bank ships.**
(D5.3, D12.3; owner goal "objective truth")
Bank BEST and MOST questions need two blind solvers and a primary-source fact check; live ones get one blind solve
and no fact check, and look the same on screen. Correction: live writing never produces BEST or MOST with a partly
true option unless two blind solves agree on the same detail; a live question carries a small visible mark
("Written by AI just now"); keep D12.3 as an owner decision but recommend `off` until the pilot's live error rate is
measured.

**11. The mock exam's device-local run can cross data folders.** (D7.5, D7.8; R29)
D7.5 says a folder switch "cannot move it into another folder". The run and the pending result are keyed
`ebiki-exam-run-<modeId>` in `platform.kv` only. After a folder switch the page reloads, and a mode with the same id
in the other folder (a joined copy of the same data, the default id) is offered Resume, and a pending result is
written into the other folder's history. Correction: store the map's `createdAt` and `career.id` in the run and in the
pending result; resume or flush only when the open map matches; otherwise keep it and say where it belongs. Also
note that the app window, a browser tab and the overlay have separate storage, so "this device" really means "this
window type" (CLAUDE.md, "How Ebiki opens").

**12. P41 and R30 contradict each other and the table hides it.** (D7.1, D7.5, D5.4)
The table says P41 is met because "the first question is shown as soon as its batch is checked". No section
describes a streaming exam; D7.1 and D7.5 assemble all 90 before the clock starts and store them whole, and R30 wants
"cannot assemble 90" known before the timer. Add it to "Conflicts decided": the exam assembles fully first, with
progress and Retry (P41's other parts), and P41's "answerable before all 90 are ready" is declined with that reason.

**13. Keys that cannot work.** (D9, D7.3; K1, K2, K33)
- In the mock exam F is both "option F" and Flag, and G is both "option G" and Grid (select-N has up to 7 options).
- "X strikes the focused option" with native radios: arrow keys move focus AND select in a radio group, and Tab
  reaches only the checked radio, so focusing an option to strike it changes the answer.
Correction: letters A to G pick; other actions use non-letter keys or a modifier (for example Shift+1 to 7 strikes
option n; Flag and Grid are buttons with Alt shortcuts or none). `choiceIndex` (`utils/keys.js` 15) handles digits
only and `CHOICE_KEYS` stops at 6 (QuizRunner 62); both need the extension named.

**14. Task slot anatomy.** (D6.4)
"Every slot contains a native `<select>`" and "tap a slot to place the held chip" fight for the same tap on a phone.
Specify: the slot is a button (the tap and drop target) with a separate 44 px select trigger beside it, both always
present; the select also serves mobile screen readers. Sizes must be stated in real pixels under the body zoom
(layout px = real px / `getZoom()`), or the 200% zoom case of P42 (a 360 px phone has 180 layout px) cannot pass with
a sticky arena, a sticky answer bar and a sticky "Placing" bar at once. Give the toast column a `data-composer` on
the sticky answer bar so toasts clear it.

**15. Code-built acronym questions give the answer away by initials.** (D4.2; W13, W14 in spirit)
"What does <ACR> stand for?" with three expansions of other acronyms is solved by matching first letters. Acronyms
with two listed expansions (`career.js` 203 to 206) need a rule too. Correction: wrong expansions must share the
initials (authored near misses in the bank, one small file) or the question is asked only in the reverse direction
with acronyms of the same length. The English templates should go through `t()` or be marked as course content.

**16. Honesty lines that claim to know the real exam.** (D10, D7.6, D7.1)
- "Course questions are in English, like the exam." This states a fact about the real exam that the app cannot back
  and that is probably wrong for some locales. Say "Course questions are in English."
- "(28% of the exam)" on the result: say "weight in the public exam objectives".
- The start screen should not say the count or the time match the real exam. Add these phrases to the banned-phrase
  test of D10 ("like the exam", "of the exam", "as on the exam").

**17. Two computers, one older: what the design should add.** (D8.4)
Mostly sound (the map shape is unchanged, the old build never reads `xq-*`, the store has no sweep). Add: the two
builds fight the same boss with different rules (11 hp and 5 hearts typed against 9 and 7 choice), so the same node
is easier on one computer; say so in D8.4. `PRACTICE_DONE` with source `legends-mock` and its once-a-day cap need a
rule in the game feature (features do not import each other), and an older game engine will pay generic XP every
time. `machine` in an attempt needs a generic ctx value.

**18. The bank arriving domain by domain, and updates.** (D3.1, D3.5)
- A bank update while the page is open: the manifest is re-checked by ETag but objective files sit in the LRU; a new
  manifest `rev` must drop the cache.
- When a domain's bank lands, saved live questions stay eligible under `mix`. Say that bank slots always win once an
  objective ships and live slots of that objective are retired.
- A trend that compares an exam made of live questions with one made of bank questions should be labelled.

### NOTES

19. Onboarding: CLAUDE.md asks every plan for a feature with settings to name its onboarding step or say why none is
    needed. The design has `liveQuestions` and `taskItems`; add one line ("no setup is required to use the course; both
    are optional switches, shown in the one-time notice").
20. Lessons hold up to three questions of one card (definition, scenario, the miss's return). D12.2 puts this to the
    owner, which is right; it contradicts the owner's written rule, so it needs an explicit yes, not a default.
21. P37 for fights and task items rests on "state stays in memory through rotation". Not checked: a rotation can cross
    `SHELL.phoneBelow`. Add a rotate-mid-fight and rotate-mid-task drive to D11.3.
22. P30 (the field stays above the on-screen keyboard; closing it restores the scroll position) is not addressed in
    D6.4. Add the rule or decline it.
23. Scope item 4 says the first task batch is kinds 1, 2, 3, 6, 8; the design builds 1, 3, 4, 6, 8 (conflict 12).
    Reasonable, but it changes an oversight decision: get the OK.
24. R4's table text ("nothing outside `features/legends/xq-*` is written") is not exact: `features.legends.*` settings
    go to config.json and "Add cards" writes the deck, both only on a learner action. Reword.
25. D6.2's firewall example and D6.3's port table are course subject matter, while the Design header says every JSON
    example is on a subject the course does not teach. Unavoidable for kinds 7 and 8, but correct the header, and have
    oversight confirm the quoted "deciding detail" fragments in style guide section 2 are invented, since the plan is
    in a public repo.
26. `FightSettings` in a course: its rows write `studyRules` through `ctx.study.setRules`, which `courseCtx` turns into
    a no-op (`career.js` 158). The task switch must be a feature setting row, and the typed, accent and language rows
    should be hidden for course fights.
27. "No shortcut fires while voice typing listens (a check of the voice layer)": the kit cannot import the voice
    feature; it needs a generic flag on ctx.
28. Missing tests in D11: the lesson-order distractor rule (blocker 1); `cardSig` mismatch (blocker 3); pass-stamp
    hashes (blocker 4); a course lesson and fight with the AI hosts blocked making zero calls (automated, not only the
    owner proof); reports in the fight simulation; `free` before Shield; StrictMode double mount of `makeCourseQuiz`
    (pick state written once); the picker under mixed eligibility (finding 7); manifest `rev` change dropping the
    cache; resume refused for another folder's map (finding 11); the honesty scan with the phrases of finding 16.
29. Missing i18n families in D10: Settings labels for the two switches; the shortcut list; "Loading question" and
    "Question ready"; the one-time English line; the connection-down note (P40); the new hint scroll text; the acronym
    stems if translated; the game feature's label for `legends-mock`; the `modelPlan.js` task name for the two jobs;
    the AI-written mark of finding 10.
30. Size: 10 MB of bank plus about 10 MB of review lines in a repo whose updates are a git fetch (D12.5 asks the
    owner; fine). The mock exam parses all 28 files (about 10 MB of JSON) on a phone during preparing: measure it.
31. The manifest's one character per slot cannot say pick 2 against pick 3, or the level of a negative stem. Two
    characters per slot costs 8 KB more and removes the guessing.

---

## The question shape I would approve for the pilot (fields and types)

```
id        string   "<item>.<slot>"
item      string   the course card this question belongs to (must exist in the package)
obj       string   "N.N", must equal the card's section
slot      integer  0..9
rev       integer  >= 1, raised when a shipped question changes
cardSig   string   hash of the card's front and back the passes were run against
kind      "definition" | "scenario" | "artifact"
level     1 | 2    1 = lesson ready, 2 = boss level
pick      1 | 2 | 3
word      "" | "BEST" | "MOST" | "NEXT" | "FIRST" | "NOT"
neg       boolean  true exactly when word is "NOT"
stem      string   scenario only; "" allowed for kind "definition"; max 600 chars; level 1: max 4 sentences
bullets   string[] length 0, 3 or 4; each max 120 chars
ask       string   the closing question, ends with "?", max 160 chars
artifact  null | { type: "log"|"config"|"rule"|"output"|"url"|"input"|"message", lines: string[1..8] (each max 100), mark: integer[] }
options   array    pick 1: 4..7 entries; pick 2 or 3: 5..7 entries; exactly `pick` entries with ok true
  .t      string   max 60 chars
  .ok     boolean
  .item   string | null   the card whose term this option is; null = no card (neutral for the taught rule)
  .partly boolean  optional; true = partly true for this stem (only on ok false)
  .why    string   one line tied to the stem, max 200 chars; required on every option
detail    string   literal substring of stem, a bullet or an artifact line; required unless kind is "definition" and word is ""
runner    integer | null   index into options; required exactly when word is BEST or MOST and some option has partly true
edge      string | null    required exactly when runner is set, max 200 chars
explain   string   1 to 3 sentences, max 400 chars
source    { card: "definition"|"example"|"keyPoints", chapter: string }   chapter = a heading that exists in the guide
```

Not in the shipped question: `by` (the reader adds it), pass stamps and primary sources (dev-only, blocker 4).

Invented example (beekeeping; illustrative only, not checked as fact, unrelated to any certification):

```json
{ "id": "i9-1-0c4e2a71.6", "item": "i9-1-0c4e2a71", "obj": "9.1", "slot": 6, "rev": 1, "cardSig": "1k3f9zq",
  "kind": "scenario", "level": 2, "pick": 1, "word": "MOST", "neg": false,
  "stem": "A beekeeper opens a crowded hive in early summer. The old queen is still laying well, and several capped queen cells hang along the bottom edges of the frames.",
  "bullets": [],
  "ask": "Which of the following is the colony MOST likely preparing for?",
  "artifact": null,
  "options": [
    { "t": "Swarming", "ok": true, "item": "i9-1-0c4e2a71", "why": "A crowded colony with a laying queen that builds cells along the bottom edges is getting ready to split." },
    { "t": "Supersedure", "ok": false, "partly": true, "item": "i9-1-5b7d0e12", "why": "A colony also raises new queens to replace a failing one, but this queen is laying well and the cells are along the bottom edges." },
    { "t": "Absconding", "ok": false, "item": "i9-1-a01c33f8", "why": "A colony that leaves altogether raises no new queens first." },
    { "t": "Robbing", "ok": false, "item": null, "why": "Robbing is bees taking honey from another hive. It involves no queen cells." }
  ],
  "detail": "along the bottom edges of the frames",
  "runner": 1, "edge": "Both raise new queens. Cells along the bottom edges of a crowded hive with a healthy queen point to a split, not a replacement.",
  "explain": "A strong, crowded colony divides itself. It raises new queens in cells along the frame bottoms before the old queen leaves with part of the bees.",
  "source": { "card": "keyPoints", "chapter": "How a colony reproduces" } }
```

(It passes the stem-leak rule as written: no stem word of 5 or more letters appears in exactly one option.)

## Go / no-go

- **NO-GO** for Step 1 as scoped in D1.
- **GO for Step 1a** (the shape, `examChecks.js`, `build-bank.mjs`, the manifest, `bank-package.test.js`, a dev
  preview page) as soon as the design text settles blockers 1 to 5: the lesson distractor rule as an authoring and
  build rule, the shape fixes (`partly`, 4 to 7 options, `kind` without `multi`, `neg`, limits, the stem-leak rule
  re-decided), `cardSig`, per-question pass stamps with the oversight stamp, and exact definitions for the fuzzy
  checks. These are decisions on paper, about a day of design work, and none needs code first. The bank pilot can
  start the moment 1a prints `no problems` on a handful of invented questions.
