# Security+ career mode: questions in the real-exam format

Date: 2026-11-16. Status: PLAN IN PROGRESS (user journey being gathered; nothing built yet).

The owner: every career mode question for the course should be modelled on the real exam format, so the learner is
ready for the test; and no reference example is ever used directly (not in code, prompts, tests or git).

## Scope decided by oversight
1. Career lessons, checkpoints and bosses all use this format (the career boss stops being typed only). The hint
   rules stay for other modes; in a course the options replace blind typing.
2. Every question is grounded in the reviewed cards and study guide chapters of its objective. A check pass confirms:
   exactly N right answers, each wrong option wrong for a reason the scenario gives, the deciding detail present, no
   length tell. Few-shot examples in the prompt are our own, on other topics.
3. Old saved checkpoint sets must still load (decide: regenerate or keep; test it).
4. Task items (performance style, the owner: "fully interactable and gradable"): the eight kinds of the guide's
   section 4b, graded by code. If all eight at once is too big: kinds 1, 2, 3, 6, 8 first, then 4, 5, 7. Bosses 1 or 2
   per fight, the mock exam about 5 at the start, a "Task practice" option per island, a setting to turn them off.
   The existing PBQ engine (src/pbq/engine.js: matching, ordering, categorize, graded by code) is the base.
5. A timed 90-question mock exam weighted by domain.

## Proof required before done
- The owner real setup (their provider and models, a real career save): a checkpoint and a boss played.
- Screenshots, desktop and phone.
- An independent judge, given only the style guide, on 40 generated questions: pass rate per rule.
- The error rate from an accuracy check that did not write the questions.
- A sample of 30 generated questions (stem plus options) sent to oversight for the copying check.

## User journey
(to be merged from the angle agents: two weeks from the exam; beginner after a lesson; returning learner with an old
saved checkpoint set; phone; keyboard; what can go wrong)

### Angle: what can go wrong (W1 to W56, most harmful first)
**A. Wrong taught as right**
- W1 No second defensible option (independent reviewer, 100+ single-answer questions).
- W2 Every BEST / MOST likely / NEXT stem holds the deciding detail; the explanation names it.
- W3 The key and every "why wrong" line are supported by the objective's reviewed cards or chapter.
- W4 No scenario detail (port, protocol, phase order, metric, control category) contradicts the cards.
- W5 Select TWO/THREE has exactly N right options.
- W6 A question the check rejects is rewritten or dropped, never shown.
- W7 A failed or timed-out check never stamps a set as reviewed; it is checked again before reuse.
- W8 The explanation's letter and term match the marked option after shuffling.
- W9 One "why wrong" line per wrong option shown, tied to the scenario; none says "also correct".
- W10 The learner can dispute; an upheld dispute returns the heart or score.
**B. Answer given away**
- W11 Key is the longest option no more than chance (200 questions).
- W12 Correct position spread evenly (each of A to D 20 to 30%).
- W13 Options share grammar and family; none excluded by a/an, number or verb form.
- W14 The stem never holds the key term, its expansion, or a word found in only one option.
- W15 An artifact never names the answer in plain text.
- W16 Within one boss attempt or mock exam no question reveals another's answer.
**C. Unfair at this point in the course**
- W17 Every unexpanded acronym option is one the course teaches.
- W18 A lesson quiz asks only what this and earlier lessons taught; wrong options are met terms or the same taught family.
- W19 A careful first-time reader of the lesson's cards can answer its quiz from them alone.
- W20 Lesson quizzes are visibly easier than bosses (shorter stems, fewer close neighbors).
- W21 Negative stems under 5%; never all/none of the above.
- W22 Every miss shows the answer and explanation before the next question (lessons, bosses, mock review).
**D. Scoring, hearts, select-N**
- W23 The screen says before answering how select-N is scored; the result matches.
- W24 Submitting with fewer or more than N chosen is prevented or clearly warned.
- W25 A wrong select-N costs at most one heart; a partly right one says which choice was wrong.
- W26 Task items show per-row results; heart cost stated before the item; one wrong row never costs more than one heart.
- W27 A task item with an ambiguous row is rejected by the check.
- W28 Every boss stays winnable at about 65% correct.
**E. Repeats and staleness**
- W29 No duplicate question, renamed scenario or same-fact-same-key pair within a boss attempt (20) or mock exam (90).
- W30 A second attempt does not reuse the previous attempt's questions.
- W31 Mock exam domain counts match 12/22/18/28/20 within one question; about 5 task items.
- W32 An old-format saved lesson set opens without error; never a mix of old and new in one quiz.
- W33 Progress, stars and boss wins unchanged by the format change.
**F. Failure, speed, cost, no key**
- W34 No key: plain message with the way to add one; no heart lost, no blank question.
- W35 A cut-off reply keeps the complete questions, asks again for the missing ones, shows no half question.
- W36 Total failure: clear retry, no hearts, XP or attempt lost, never stuck.
- W37 Before a mock exam the learner is told the preparation time and that it uses many AI calls on their key; first question within a stated, measured wait.
- W38 The measured token cost of one mock exam and one boss attempt is recorded in this plan; an abandoned exam is not generated again on return.
- W39 The timer does not run during generation or a "could not load" state.
**G. Mock exam: leaving, timer, accessibility**
- W40 Close, reload, lost connection or mode switch: resume with every answer kept, or told before leaving that it ends.
- W41 Reload, clock change or backgrounding neither adds time nor loses it unfairly (rule stated and tested).
- W42 Extended time or no timer can be chosen before starting and is labelled on the result; the timer is announced without stealing focus.
- W43 Warnings before time ends; time up submits what was answered; unanswered listed as unanswered.
- W44 Flag, skip, return and change an answer before submitting, by mouse, touch and keyboard alone.
- W45 A mock exam records no reviews in the learner's deck unless the screen says so.
**H. Readability**
- W46 Every artifact readable at phone width, both themes: legible monospace, long lines scroll or wrap inside their own box, no page-wide scroll.
- W47 Artifacts well formed and realistic; only documentation address ranges and invented domains.
- W48 Every task item doable by touch on a phone and by keyboard on desktop, the stem never lost.
- W49 Non-English UI: every button, label, rule, result and error translated; question text stays English and the learner is told once.
**I. Honesty and legal**
- W50 No screen claims or implies the questions come from, match or predict the real exam ("exam-style practice"; no vendor endorsement).
- W51 The result never says "you will pass" or "you are ready": score, per-domain results, weak objectives, "a practice estimate, not a prediction".
- W52 No pass line or scaled score shown as the real exam's; any threshold is labelled the app's own.
- W53 30+ generated questions pass oversight's copying check; repeated after any prompt change.
- W54 No reference text in the repository, prompts, tests or fixtures; prompt examples on other topics.
- W55 "Give me real exam questions" in Chat or Help: the app says it writes its own practice questions.
- W56 Difficulty judged by an independent reviewer on 40 boss questions against the style guide only, per-rule pass rate recorded honestly.

### Angle: a learner two weeks from the exam (E1 to E44)
**Result screen**
- E1 Overall score, right of asked, time used: one phone screen, no scrolling.
- E2 A score per domain beside its exam weight, weakest first.
- E3 Any domain opens to a score per objective (number, title, questions asked).
- E4 An objective with fewer than 3 questions is labelled too few to judge, no percentage verdict.
- E5 Acronyms behind the misses are listed with tier and a link to their set.
- E6 Readiness in plain words tied to the learner's number, stated as a practice estimate, never a promise or the real scale.
- E7 Task items are their own line (score, partial credit).
- E8 Wrong, unanswered at time up, and flagged are counted separately.
- E9 Every question reviewable after: own answer, right answer, the explanation shape; filters missed / flagged / one domain.
**Misses into study**
- E10 One tap from a missed question to its lesson, and back to the same place.
- E11 Learn it from a missed question without losing the review.
- E12 Add its card to the deck; "In your deck" instead of a duplicate.
- E13 Add all cards behind the misses in one action that states the count first.
- E14 A retest of only the weak objectives, fresh questions.
- E15 That retest's result shows per objective whether it improved.
- E16 At most three ranked next steps, each a working link.
**Finding and starting**
- E17 The mock exam is at most two taps from the map and needs no islands cleared.
- E18 Before starting: question count, time, domain weights, task item count, pause rule; confirm to begin.
- E19 The wait for the first question shows progress; the timer starts when it is on screen.
- E20 The timer never runs while the learner waits on the app.
- E21 Per-domain counts match the weights within one; the result shows the actual counts.
**During the exam**
- E22 Time left and question number always visible; the timer can be hidden.
- E23 Behind pace is shown quietly, never a pop-up over the question.
- E24 No feedback, explanation, hint, Learn it, chat, hearts, health bar, taunt or game animation until submitted.
- E25 Flag, skip, move freely, change any answer before submitting.
- E26 A review grid (answered / unanswered / flagged) with jump.
- E27 Submitting with unanswered or flagged names the counts and asks once.
- E28 Time up submits, counts unanswered as wrong and says so.
- E29 Options can be struck out; strike-outs persist.
- E30 Select-N shows chosen of required and is not "answered" until N are chosen.
- E31 Close, reload or lost connection: resume with answers, flags and time by a rule stated before the start.
- E32 Leaving early asks, saying whether the attempt is scored and recorded.
**Short and focused sets**
- E33 A shorter timed set (20 or 30), same weighting, time per question and breakdown; labelled short, not in the full-exam trend.
- E34 A task-items-only set, kind selectable, per-row credit and the correct arrangement after.
- E35 A timed set for one domain or the weakest objectives over all attempts.
**Trend**
- E36 A history of mock exams and short sets (date, score, time, per domain) and a per-domain trend.
- E37 No question repeated word for word from an earlier attempt; each domain compared with the previous attempt.
**Trust**
- E38 Reporting a question (wrong, ambiguous, two right) removes it from this attempt's score at once, shows the new score, keeps it out of future sets.
- E39 Letter spread and longest-option share checked over a full mock exam.
- E40 The objective named in an explanation matches the lesson its link opens.
- E41 No game words, second person, all/none of the above, or expanded acronyms in mock exam options.
- E42 No reward that depends on score in a way that encourages rushing.
- E43 No reviews recorded in the learner's deck unless they chose to.
- E44 Everything works on a phone one-handed with no horizontal scroll; a task kind that does not work on a phone is not offered there and the learner is told its points were left out.

### Angle: a beginner after their first lessons (B1 to B38)
- B1 A lesson quiz's right answers are only terms this lesson or an earlier completed one taught.
- B2 In a lesson question at least the right option and one wrong option are taught terms (a tester can mark where each was taught).
- B3 An untaught wrong option is marked "not covered yet" in the explanation, with one line on what it is.
- B4 With too few taught terms to fill 4 options from one family, questions stay fair; none answerable only by eliminating unseen terms.
- B5 A lesson question's deciding detail (or its plain meaning) is in the card text the learner just read.
- B6 The course's first lesson quiz opens with one-sentence definition questions; scenarios only in its second half.
- B7 A lesson scenario is at most 4 sentences, with no untaught acronym or term in the stem unless explained in the same sentence.
- B8 The first BEST / MOST likely question shows a one-time dismissable note: several options may be partly true, the detail decides.
- B9 Select-N shows the required number outside the stem ("Pick 2"), tiles look multi-select, Submit is disabled until exactly N.
- B10 A partly right select-N shows which picks were right and wrong.
- B11 No select-N and no negative stem in the learner's first three lessons.
- B12 A negative stem has NOT in capitals; the explanation restates what was asked.
- B13 No artifact question in a lesson quiz unless a completed lesson showed that kind of artifact or its concept.
- B14 An artifact is a few lines, phone-readable, and its deciding part is highlighted in the explanation.
- B15 The first artifact question carries a one-line cue saying what it is, without the answer.
- B16 The explanation shows after every answer, right or wrong, and names the deciding detail in quotes.
- B17 The explanation expands every acronym from the options and stem on first mention.
- B18 One line per wrong option, tied to the scenario, in words a learner of only this lesson can follow.
- B19 One tap from the explanation to the card or Learn it for the right term and any taught wrong option, and back without losing progress.
- B20 A missed lesson concept comes back once later in that quiz with a different stem; it never counts twice.
- B21 Taught and untaught acronym options are never mixed in a lesson quiz without B3's marking afterward.
- B22 In lesson quizzes an acronym option can be tapped to see its letters spelled out (not its definition) without answering; bosses and the mock exam keep them unexpanded; the difference is stated once.
- B23 A miss caused by an untaught acronym offers the island's acronym drill (Core first) by name.
- B24 The learner can still type a lesson answer where it is a single term ("Type it instead"), remembered per device for the course.
- B25 A typed right answer is right regardless of case, spacing, or acronym versus full name, with the same explanation.
- B26 Before the first task item of each kind a short how-to shows (place, move, clear, submit; drag or tap-tap), reopenable from a "?".
- B27 Task practice (nothing at stake) exists before any task item appears in a boss; the map points to it before the first region boss.
- B28 A placed chip looks placed, moves or clears in one action; remaining chips and the reuse rule stay visible.
- B29 Submit with empty slots says how many and asks to confirm.
- B30 Graded rows show right or wrong, the answer and one line why, a score like "4 of 5"; partly right is worded as progress.
- B31 A region boss task item uses only terms from that region's or earlier lessons.
- B32 A format met for the first time inside a boss (first select-N, artifact, task kind) costs no heart on a miss, unless already met in a lesson or Task practice of that region; a partly right task item never costs more than one heart.
- B33 Difficulty ramps: lessons mostly definitions and short single-answer scenarios; region bosses add longer scenarios, BEST neighbors, select-N, artifacts, 1 to 2 task items; a first-region boss has fewer hard formats; about 65% in the lessons beats the boss within a few attempts.
- B34 Task items can be turned off from the boss intro (not only Settings); bosses stay fully playable.
- B35 Course start and the first quiz say plainly: practice questions in the exam's style from the course's own cards, not real exam questions; a score is not a predicted exam score.
- B36 A lost boss or a quiz under about 50% names the 1 to 3 most missed terms with links and offers "Review these, then try again" before "Fight again".
- B37 A question that fails its check, or that the learner reports as wrong or unfair, is replaced or not counted; no heart or score lost.
- B38 The mock exam is not pushed to a learner with only a few lessons done; opened anyway it warns and suggests island practice; no timer ever in lessons or bosses.

### Angle: a returning learner with saved data (R)
### Angle: a returning learner with saved data (R1 to R34, most important first)

**Nothing earned is lost**
- R1 When a mid-course save opens after the update, every star, cleared step, boss win, region and island unlock, helper item, bonus life, one-time reward and "Continue" position is exactly what it was before (compare a snapshot of the map before and after).
- R2 When the course opens after the update, every item's right/wrong tally and bronze/silver/gold tier is unchanged; no item drops a tier or resets because its old answers were typed.
- R3 When the course opens after the update, no AI call is made and nothing is written to the data folder until the learner starts a step (opening the map costs nothing and changes no file).
- R4 The learner's own deck, its cards, their Anki schedule, the mode's deck setting, knowledge base and every per-mode study setting are byte-for-byte untouched by the update and by the first open.
- R5 When an old-layout course with progress (objectives and checkpoints) opens, it keeps its layout: no checkpoint disappears, none is re-locked, and a passed checkpoint stays passed.
- R6 A lost boss's nemesis list survives the update: the next attempt still draws its share of questions from those items, now in the exam format, and a win still clears it.

**First open: told once, plainly**
- R7 When the learner first opens the course after the update, a one-time notice says in plain words: questions are now exam style, progress is kept, saved lessons get new questions only when replayed, and where the task item setting is. It never shows again once dismissed (also not on the second computer for the same learner).
- R8 The notice states whether replaying a finished lesson will spend AI usage on the learner's key, before any is spent.
- R9 When no AI key works (missing, out of credit, signed out), the map, finished lessons' cards, stars and history still open; a step that needs new questions says why it cannot start and loses nothing.

**Revisiting a finished lesson**
- R10 When a finished lesson with an old-format saved set is reopened, the quiz is never a mix of old typed questions and new exam questions in one run: it is entirely one format.
- R11 When replaying needs a new exam-format set, it is written once for that lesson, at the moment the learner starts that quiz, and saved; the next revisit reuses it with no AI call (reshuffled options, correct letter still spread).
- R12 Old sets are never regenerated in bulk in the background: after opening the course and waiting ten minutes on the map, the AI usage counter has not moved.
- R13 If a "refresh all my lessons now" action exists, it states the number of lessons and asks first; it can be cancelled midway and lessons already refreshed stay usable.
- R14 When writing the new set fails (network, refusal, credit), the lesson stays completed with its stars, the old saved set is not deleted, and the learner sees a retry, never an empty quiz.
- R15 Replaying a finished lesson in the new format can raise its stars but never lowers them or un-completes it; a wrong answer there moves the item's tally exactly as a replay did before.
- R16 "New questions" on a lesson asks before spending when answers already exist, replaces only that lesson's set with a fresh exam-format one, records nothing from the abandoned run, and leaves stars and tallies alone.

**Old saved checkpoint set and boss in progress**
- R17 When an old saved checkpoint set is opened, it loads without an error screen: either it plays as saved or it is replaced by an exam-format set, and the learner is told which; the checkpoint's passed state and stars do not change either way.
- R18 A boss attempted before the update keeps its history of asked questions: the first exam-format attempt does not repeat a scenario already asked, and the old history file still reads.
- R19 A quiz or boss fight left half-finished before the update never resumes into a broken screen: it either restarts cleanly from question 1 in the new format or is discarded with a one-line note; no half-run answers are recorded as a result.
- R20 Boss rules the learner already knows still hold after the format change: the same number of questions, hearts and pass mark, the bonus life from Weak spots, the shield and hint scroll helpers still work or are plainly said not to apply (a hint scroll is never spent for nothing).

**The second computer on the older version**
- R21 When the older app version opens the same folder after new-format sets, task items and mock exam history were saved, it does not crash, shows the course it could show before (or a clear "update Ebiki on this computer" message), and deletes or rewrites none of the new data.
- R22 When the older version plays a lesson whose saved set is now exam format, it either plays it sensibly or makes its own set without destroying the new one; returning to the updated computer, the exam-format set is still there and no second charge is needed.
- R23 Progress made on the older version (a lesson cleared, a boss beaten) appears on the updated computer after a reload, and progress made on the updated one is not reverted by the older one's next save.
- R24 Mock exam attempts and their history survive a full session on the older version: after the old computer studies and saves, the count of attempts and every score on the updated computer is unchanged.

**Offline and two computers**
- R25 When two computers each finish a mock exam (one online, one offline), after reconnect and merge the history shows both attempts, each once, with its own date, score and per-domain breakdown; neither overwrites the other.
- R26 When the share is unreachable, a mock exam, Task practice and exam-format lessons already saved still run from the local copy, and their results merge on reconnect without a duplicate attempt or a lost one.
- R27 The same mock exam attempt opened on both computers at once never yields two finished results for one sitting, and never mixes one computer's answers into the other's.

**Mock exam in progress across interruptions**
- R28 When the app is closed, crashes, reloads or updates during a mock exam, reopening offers to resume with the answers given, flags and time remaining as left (the clock does not run while closed, or the learner is told it did), or to discard it; no unfinished attempt appears in the history as a score.
- R29 When the data folder is switched, or the share drops, during a mock exam, the attempt is not written into the other folder and is not silently lost: the learner is told what happened to it.
- R30 Before a mock exam starts, the learner sees roughly how many questions must be written and that it uses their AI key, and starts it with an explicit confirm; a mock exam that fails to assemble 90 items says so before the timer starts and records no attempt.
- R31 A mock exam changes no lesson stars, boss wins or unlocks; whether its answers move per-item tallies is stated on its start screen and matches what happens.

**Settings and going back**
- R32 The "task items off" setting is found from the boss intro, the mock exam start and Settings; it is on by default only as announced, applies at the next fight (not mid-fight), follows the learner to the second computer, and with it off a boss and mock exam still have their full question count.
- R33 The learner's question-reuse setting and cap keep the meaning they had: an existing choice is neither switched on nor off by the update, and the notice or Settings says plainly whether course lessons obey it.
- R34 A learner who prefers typed recall has a stated way to get it: course cards they added to their deck still get typed questions with hints in Study, raids and practice outside the course behave as before, and if the course itself offers no typed option the notice says so instead of leaving them to search.

### Angle: phone, one hand, touch only (P)
### Angle: a phone, one hand, touch only (P1 to P34, most important first)

Test widths for every item unless it says otherwise: 360, 390 and 430 px portrait; 740 x 360 and 932 x 430 landscape;
app zoom 100% and 200%; light and dark; a device with a notch and a home indicator.

**Every question screen (lesson, checkpoint, boss, mock exam)**
- P1 No horizontal page scroll at any test width or zoom: the page's scroll width equals its visible width on every
  question, task item, explanation, review grid and result screen. Only an artifact block or a table may scroll
  sideways, inside its own box.
- P2 The answer action (Submit / Check / Next) is always reachable without hunting: either fixed above the bottom bar
  and the home indicator, or reached in at most one screen height of scrolling from the last option. It is never
  under the bottom bar, the home indicator, a toast or the docked Help panel.
- P3 Under a boss header, the first line of the stem is visible without scrolling at 360 x 640 portrait, and the boss
  art, health bar and hearts together take at most 35% of the screen height (at most 25% in landscape, or collapse to
  one row of health and hearts). The art never covers the stem or the options.
- P4 A 4-sentence stem plus a 6-line artifact plus 4 options scrolls as ONE column (no nested vertical scroll areas),
  and after scrolling down to the options, hearts and health stay visible or return within one swipe up.
- P5 Every option tile is at least 48 px tall, full width, with at least 8 px between tiles; a tap anywhere on the
  tile selects it. A tap that ends a scroll (finger moved more than 10 px) never selects an option.
- P6 Selecting an option never submits it: single-answer questions need a second, separate tap on Submit, and the
  chosen option can be changed any number of times before that. (One slip of the thumb must not cost a heart.)
- P7 Option text wraps to as many lines as it needs (no ellipsis, no clipping) at 360 px and 200% zoom; the letter
  (A to G) stays visible on the first line.
- P8 Nothing important sits in the notch, the rounded corners or the home-indicator strip in portrait or either
  landscape direction: stem, options, timer, Submit and the bottom bar all keep at least the device's safe inset.

**Artifacts (log line, config listing, rule entry, URL) and tables**
- P9 An artifact block is readable at 360 px: monospace text at least 12 px (CSS), either wrapped with a visible
  continuation mark or scrollable sideways inside its own box with a visible cue that more exists (a fade or a
  scrollbar). The deciding detail is never only reachable by a sideways scroll the learner cannot tell exists.
- P10 Scrolling an artifact sideways never scrolls the page sideways, never triggers the system back swipe from
  inside the block (the block starts at least 16 px from the screen edge), and never selects an option.
- P11 A given rule table (kind 8) of 5 columns and 6 rows fits 360 px without sideways scroll, by stacking each rule
  as a labelled card or by a table whose first column (rule number) stays in view while the rest scrolls.

**Select TWO / Select THREE (5 to 7 options)**
- P12 The required count is shown next to the options and stays in view while choosing ("2 of 2 chosen"), not only in
  the stem that has scrolled away. Submit is disabled, with the reason shown, until exactly N are chosen.
- P13 Tapping a chosen option un-chooses it. Tapping an extra option past N does not silently drop an earlier pick:
  it is refused with a short visible note, or the learner is told which one was replaced.
- P14 With 7 options at 360 x 640, getting from the last option to Submit takes at most one swipe, and the chosen
  state is clear without color alone (a check mark as well as the tint) in both themes.

**The explanation after an answer**
- P15 The verdict (right or wrong) and the correct letter and term are visible without scrolling right after Submit
  at 360 x 640; the "why the others are wrong" lines (up to 6) follow under it, each starting with its letter.
- P16 Next / Continue is reachable without scrolling the whole explanation: fixed at the bottom, or shown both above
  and below a long explanation. The focus never jumps the page so the verdict scrolls out of view.
- P17 The "link to the lesson" opens without losing the fight or the exam: coming back (Back gesture or button)
  returns to the same question with the same state, and in the timed mock exam the link is only offered on the
  review after the exam ends.

**Task items by tap-to-place (all eight kinds)**
- P18 Tap a chip, then tap a slot, places it. The picked-up chip shows a clear selected state (outline plus a label
  such as "Placing: X") that stays visible while the page scrolls, in both themes, and every free slot shows that it
  can take it.
- P19 The pool stays reachable while filling far-away slots: with 8 chips and 6 rows at 360 x 640, placing any chip
  into any slot needs at most one scroll gesture and no scrolling back to find the place (for example the pool or
  the held chip sticks to the bottom of the screen above Submit).
- P20 Scrolling with a chip held never places it, never drops the selection and never changes any slot. Tapping the
  held chip again, or tapping empty space, cancels the hold and changes nothing.
- P21 Undo is always one tap: tapping a filled slot offers Clear and Move (or returns the chip to the pool) and a
  filled slot tapped with another chip held swaps or replaces with the displaced chip back in the pool, never lost.
  A "used once" chip returns to the pool the moment it is cleared.
- P22 Chips and slots are at least 44 x 44 px with at least 8 px between them; a long chip (up to 40 characters) wraps
  inside the chip and inside the slot at 360 px and 200% zoom without clipping or overlapping the next row.
- P23 The description rows' text is fully readable at 360 px with the slot under or beside it (never a slot squeezed
  to under 120 px wide), and a row's icon never pushes its text off screen.
- P24 Put in order (kind 6): each position is numbered, a placed chip can be moved to another position in at most 2
  taps, and no drag is ever required. Reordering 7 chips is possible with the thumb only.
- P25 Place by location (kind 2) and pick per platform (kind 5): zone pictures and the two platform columns stack or
  shrink so every zone label, picture and slot is visible at 360 px; a zone picture is at most 30% of the screen
  height, and the item is fully solvable with the pictures failing to load (zone names are text).
- P26 Submit on a task item is disabled, or asks to confirm, while slots are empty, and says how many are left
  ("2 slots empty"). A learner can never submit a half-filled item by a stray tap.
- P27 Graded rows show right or wrong per row with a mark and not color alone, the correct answer under each wrong
  row, and the one-line reason, all readable without sideways scroll; the score ("4 of 5") is visible at the top
  without scrolling.

**Firewall items (kinds 7 and 8)**
- P28 The network picture is legible at 360 px: every host name and address is real text at least 12 px (or repeated
  as a text list under the picture), the picture fits the width without sideways scroll, and it stays one tap or one
  short scroll away while filling any rule (for example a "Show network" control that returns to the same rule).
- P29 The rule table (source, destination, protocol, port, allow or block, up to 4 rules) is fillable at 360 px with no
  sideways scroll: each rule is a stacked card with labelled fields, every select and the port field at least 44 px
  tall.
- P30 The port field opens the numeric keypad, accepts digits only (1 to 65535), and when the on-screen keyboard is
  up the field being typed in and its label stay visible above the keyboard; closing the keyboard returns the page
  to where it was. Select boxes use the phone's native picker, and the requirements text stays reachable while one
  is open or right after it closes.
- P31 Judge flows (kind 8): each flow has two targets, Allowed and Blocked, each at least 44 px tall and at least
  12 px apart; the chosen one can be switched before Submit; the rule table stays reachable from every flow within
  one scroll gesture.

**The mock exam (90 questions, timed)**
- P32 The exam bar (time left, "Question 37 of 90", flag, open grid) is one row at most 56 px tall in portrait and
  landscape, always visible, clear of the notch, with every control at least 44 px wide; the time stays readable at
  200% zoom without wrapping into a second row that hides the stem.
- P33 Strike-out works by touch without answering by accident: a separate, clearly labelled control per option (or a
  strike mode toggle), at least 44 px, placed so it is not hit when choosing the option; a struck option can be
  un-struck in one tap and can still be chosen; no long-press or swipe is the only way to do it.
- P34 The review grid shows all 90 numbers reachable at 360 px (cells at least 40 px, the grid scrolling vertically
  only), with answered, unanswered and flagged told apart by a mark and not color alone; tapping a number opens that
  question and Back returns to the grid at the same scroll position.
- P35 Skip, Previous and Next are reachable by the thumb at the bottom of the screen; an accidental "End exam" is
  impossible: it asks to confirm and states how many questions are unanswered and flagged.
- P36 The result screen shows the overall score and the five per-domain scores as a stacked list readable at 360 px
  (no chart that needs sideways scroll or hover), and each missed question opens its explanation by tap.

**Interruptions, rotation, zoom, connection**
- P37 Rotating the phone mid-question or mid-task keeps everything: chosen options, struck options, placed chips, the
  held chip, typed port numbers, the scroll position near the same content, and the exam clock. Tested on a choice
  question, each task kind and the review grid.
- P38 Backgrounding the app (a call, the app switcher, the screen locking) and returning within 30 minutes restores
  the same question and every answer given so far, in a boss fight and in the mock exam. If the system killed the
  page, reopening the app offers to resume the mock exam where it stopped, with all answers and flags kept.
- P39 The mock exam clock rule on interruption is stated to the learner before the exam starts (it pauses when the
  app is hidden, or it keeps running) and behaves exactly as stated: after 5 minutes in the background the shown
  time left matches the rule to within 2 seconds. An exam never auto-submits while the app is hidden without the
  learner seeing why on return.
- P40 A lost connection mid-exam loses no answer: every answer is kept on the phone the moment it is tapped, the exam
  goes on for questions already loaded, and a visible in-flow note (not one covering Submit) says the connection is
  down. Grading of choice and task items works with no connection.
- P41 Slow generation on mobile data: a visible progress state appears within 1 second of asking for a quiz, boss or
  exam; the first question is answerable before all 90 are ready; the exam clock does not run while the learner
  waits for a question to arrive; after 30 seconds without progress there is a clear Retry and a way out that keeps
  what was already answered.
- P42 At 200% app zoom and at the phone's largest system text size, at 360 px, every screen above still passes P1,
  P2, P5, P22 and P32: nothing overlaps, nothing is clipped, and every control keeps its minimum size.
- P43 Dark mode at night: the selected option, the held chip, struck-out options, flagged cells, right and wrong
  rows, and artifact blocks each keep at least 4.5:1 text contrast and stay told apart from each other in both
  themes; zone and network pictures are legible on a dark background (no black lines on dark).
- P44 The system Back gesture during a boss fight or the mock exam never leaves silently: it asks first, and choosing
  to stay returns to the same question with nothing changed. Back from an open picker, the review grid or the
  "Show network" view closes only that layer.

### Angle: keyboard, screen reader, low vision (K)
### Angle: keyboard only, screen reader, low vision, extra time (K1 to K34, most important first)

**Answering choice questions by keyboard**
- K1 A single-answer question can be answered start to finish with no mouse: Tab or arrow keys reach the options, keys 1 to 4 (and A to D) pick one, Enter submits. Picking by number does not submit by itself in the mock exam (an answer can still be changed there).
- K2 A "Select TWO/THREE" question with 5 to 7 options: number keys 1 to 7 (and A to G) TOGGLE an option on and off; Space toggles the focused one; nothing is submitted until Enter. Every option is reachable; no option is beyond the shortcut range without also being reachable by Tab or arrows.
- K3 Select-N options are announced as checkboxes ("checkbox, checked/not checked, C, option text"), single-answer options as a radio group ("radio, 2 of 4"), and the group's name includes the question's closing line and "Select TWO".
- K4 A live count is shown as text and announced politely after each toggle: "1 of 2 chosen", "2 of 2 chosen". Picking a third when two are wanted is either refused with an announced message ("2 already chosen, clear one first") or allowed and blocked at submit with a stated reason; never silently swapping out an earlier pick.
- K5 Submitting with too few picks does not grade: focus stays on the question and a message is announced ("Choose 1 more").
- K6 Number and letter shortcuts never fire while focus is in a text field, a number field, a select box, a modal, or while voice typing (Alt+V) is listening; typing "2" in the firewall port field never picks option 2.
- K7 No shortcut uses a bare single letter that screen readers use for quick navigation in a way that cannot be avoided: every action with a shortcut (pick, flag, strike out, next, previous, open review grid) is also a visible, focusable, named button, and a shortcut list is reachable from the question screen.

**Focus order and where focus lands**
- K8 When a new question appears, focus moves to the question (its heading or stem), not to the page top and not left on a removed button; the screen reader reads position first ("Question 14 of 90"), then the stem, then any artifact, then the options, in that order, matching the visual order.
- K9 After an answer is graded, focus moves to the result and it is announced once: "Correct" or "Incorrect, the answer is B, <term>", followed by the explanation. The Continue/Next button is the next Tab stop and Enter activates it.
- K10 The explanation is readable line by line: the answer, then a list with one item per wrong option, each starting with its letter and term, then the objective number and a lesson link that is a real link with a name saying where it goes ("Open lesson: <title>"). Following the link and returning (Back/Alt+Left) lands on the same question with focus on that link.
- K11 Focus is never lost to the document body: not when a question is swapped for a rewritten one, not when options finish loading, not when a task item is graded, not when a dialog closes (focus returns to the control that opened it).
- K12 A question replaced or still loading is announced ("Loading question", then "Question ready"); if a question is replaced after the learner already focused an option, the change is announced and no keystroke already in flight answers the new question.

**Reading the stem and artifacts**
- K13 A log line, config listing, command output, URL or input string is exposed as one labelled block ("Log entry", "Firewall rule", "Command output") that a screen reader can read line by line and character by character; it is real text, never an image, and can be selected and copied.
- K14 Bullet requirements in a stem are a real list (announced "list, 3 items"). The capitalised key word (BEST, MOST, NEXT, NOT) is still recognisable when spoken or when capitals are not voiced (for example it is also emphasised in a way the reader exposes), and it stays visibly distinct at 200% zoom.
- K15 A long artifact line scrolls or wraps inside its own block at 200% zoom and on a narrow window, reachable by keyboard (the block takes focus and arrow keys scroll it); it never pushes the options off screen or hides under them.

**Task items without a mouse**
- K16 Every one of the eight kinds can be completed, changed, cleared, submitted and reviewed with the keyboard alone and with a screen reader; drag and drop is never the only way, and the keyboard way needs no hidden mode to switch on.
- K17 Each slot's select box has a name that says what it is for, including its row text or zone: "Row 3, <description>: choose a term", "Lobby, slot 2 of 2", "Step 4 of 6", "Rule 2, protocol". A zone or row picture or icon has a short text name or is hidden from the reader when it adds nothing.
- K18 In "used once" items, a chip already placed is still listed in other slots' select boxes but marked "used in row 2" (or is clearly unavailable), and choosing it elsewhere either moves it and announces "moved from row 2 to row 4" or is refused with a spoken reason. A text line always states how many chips remain: "3 of 7 terms left", and whether "not all will be used".
- K19 Every slot has a "clear" choice (an empty option or a Clear button reachable by Tab, plus Delete/Backspace on the slot), announced "Row 2 cleared".
- K20 The order item works by keyboard in both natural ways: choosing a step for each numbered position, or moving a focused step up and down with a named control or key; each move is announced with the new position ("<step>, now 3 of 6").
- K21 The firewall table is a real table: each cell's control is announced with its column header and rule number; Tab order goes left to right, row by row; the port field accepts typed digits, states its allowed range, and reports a bad value in words next to the field and to the reader. The network picture has a full text equivalent listing zones, hosts and addresses, placed before the table.
- K22 The flows item: each flow row is a labelled pair of choices ("Flow 3, <source> to <destination>, port 443: allowed or blocked"), and the given rule table is readable as a table with headers, with the implied final deny written out as a row of text.
- K23 Submitting a task item with empty slots asks first, naming how many are empty, and focus goes to the first empty slot if the learner goes back.
- K24 After grading, the score is announced once ("4 of 5 correct"), focus moves to the results, and each row reads as text: "Row 2: incorrect. You chose <x>. Correct answer: <y>. <one line why>". Right and wrong rows carry a word and an icon, not only green and red.

**Never by color alone, contrast, zoom, motion**
- K25 Right, wrong, chosen, struck out, flagged, answered, unanswered and current are each told apart by text or shape as well as color (check mark and "Correct", cross and "Incorrect", a flag icon, a line through plus "struck out", an outline for current). A greyscale screenshot of every state still reads.
- K26 All text, option borders, slot outlines, chip states and the focus ring meet contrast in both themes (text 4.5:1, control boundaries and focus ring 3:1), and the keyboard focus ring is always visible, including on chips, slots, grid cells and struck-out options.
- K27 At 200% zoom, desktop and narrow window, in both themes: no control overlaps or is cut off; the timer, flag, Next/Previous, Submit and the review grid stay reachable; a 7-option question, a 10-statement categorize item and the firewall table need no horizontal page scroll (a table may scroll inside itself, by keyboard); the focused control is never hidden behind a fixed bar.
- K28 With reduced motion on, nothing flies, shakes or flashes when answering, grading or finishing; chips move to their slot at once; results simply appear. No information is given only by an animation.

**Mock exam: timer and extra time**
- K29 The timer is not announced every second. Remaining time is announced politely only at set points (for example half time, 30, 10, 5 and 1 minute left) and on demand through a named control or key that reads "X minutes left". The 5 and 1 minute warnings also appear as visible text that does not steal focus.
- K30 The timer can be hidden and shown again (a named toggle, announced "Timer hidden"); hidden, the set-point warnings still arrive.
- K31 Before starting, the learner can choose standard time, extended time (at least 1.5x and 2x) or untimed, with the setting remembered; the result screen states which was used. The exam can be paused or left and resumed later without losing answers, flags or time already spent, unless a clearly labelled strict mode was chosen.
- K32 When time runs out, the exam does not vanish mid-keystroke: it is announced ("Time is up"), the answers given so far are kept and graded, and focus lands on the result heading.

**Mock exam: navigation, flag, strike out, review grid, leaving**
- K33 Flag, skip, previous, next and strike out all work by keyboard and say their state: the flag is a toggle button announced "Flag question 14, pressed/not pressed"; each option has a strike-out toggle reachable by Tab (and a shortcut on the focused option), announced "B struck out"; a struck-out option can still be chosen and un-struck, and striking out never changes the answer. The review grid is a real navigable structure: one Tab stop, arrow keys move between questions, Enter opens one, and each cell reads in full ("Question 14, answered, flagged", "Question 15, not answered", "Question 3, task item, 2 of 5 slots filled"); a text summary gives counts of answered, unanswered and flagged, and filters ("unanswered", "flagged") are named buttons announcing how many match. Opening a question from the grid puts focus on that question, and going back returns to the same cell.
- K34 Esc, Back and Alt+Left during a mock exam, a boss or a task item never abandon silently: a dialog asks, names what would be lost or kept ("12 of 90 answered, your progress is saved / will be lost"), traps Tab, has its safe choice focused first, closes on Esc as "stay", and returns focus to where it was. Submit asks once too and names unanswered and flagged counts. Errors (a question failed to load, an answer could not be saved, the connection dropped) are announced as alerts with a focusable Retry, the timer does not run while a question cannot be shown, and the result screen reads as headings, a per-domain score table with headers ("Domain 4, Security Operations, 18 of 25, 72%") and a review list whose filters and items are all reachable by keyboard.

## Design
(after the journey)

## Phase B: the pre-made question bank (owner, 2026-11-16)

The owner: ten questions pre-made per flashcard, accurate and in this plan's format, so someone with no AI account
or no internet still gets a variety; one picked at random, and on the next encounter another not asked yet; three
passes on each so they are accurate and comfortably answerable; everything objective truth, nothing subjective; MOST
and BEST questions are allowed with partly true options, but the key must be provably the most fitting, never a
guess; and every single question is fact checked for the accuracy of its answer.

Scale: 855 items in the shipped package (121 / 162 / 136 / 264 / 172 per domain), so about 8,550 questions. Written
at development time by agents (no owner API credits, works offline). Expect several days of usage windows.

### B1. Bank format
- Per card `questions: [10]`, shipped as a per-domain file loaded on demand (measure the package size first).
- Each question: kind, stem, options, key (keys for select-N), why (one line per option), obj, source (the card
  field or chapter line that proves the answer).
- Typical mix per card: about 6 scenario, 2 definition, 1 artifact when the topic fits, 1 select-TWO.
- Task items are made per objective, not per card.

### B2. Picking
- Random without replacement per card, per learner, saved in their progress. All 10 used: reshuffle, never one of
  the last 3 asked. One quiz never holds two questions from the same card.
- Works with no key and no internet. Live AI-written questions become an optional extra when a key exists.

### B3. Objective truth rules (reviewers, and code where possible)
- Exactly one defensible answer (exactly N for select-N).
- Every wrong option fails a requirement stated in the stem, and the reviewer can name which.
- BEST / MOST only when the stem holds a detail that only the key fully meets; each partly true option's why line
  names exactly what it misses ("true in general, but the stem says X and this does not do X"). The key's edge over
  the runner-up traces to a primary source or to the card and its chapter, never to taste; no source settles it =
  the question is dropped. The explanation shows the runner-up and the one detail that made the key win.
- No "usually / often" judgment call as the deciding point.
- Answerable from the card plus its chapter, nothing outside the course.
- The deciding detail is plain enough that a learner who knows the card answers comfortably. No tricks.

### B4. Four passes, each by an agent that did not write (or earlier review) the question
1. Accuracy: every fact against the card, the chapter and a primary source. Fix or drop, reason logged.
2. Blind solve, key hidden. A mismatch, a "two could fit" or a guess = rewritten, back to pass 1. MOST and BEST
   questions get TWO separate solvers; both must pick the key for the same deciding detail. Agreement rate recorded
   (MOST/BEST separately).
3. Clarity, objectivity and format against the style guide and B3, plus the length and position tells across the 10.
4. Fact check of every key and every why line against a primary source (every question, not a sample).
A question ships only after passing all of them unchanged in the last pass. A card under 10 survivors gets refills,
which go through every pass.

### B5. Code validator in the build
10 per card; valid keys; option count; no duplicate stem within a card or across the course; right answers spread
evenly over A to D; the right answer not systematically the longest; no dashes or HTML; the own-words overlap check
against the outline.

### B6. Pilot, then domains
- Pilot: one objective, about 10 cards and 100 questions through every pass. Report the drop rate per pass, the
  blind-solve agreement (MOST/BEST separately), the fourth-pass error rate, the agent calls it took. 30 pilot
  questions go to oversight for its copy check.
- Then domain by domain, 3 agents at most, a commit after each domain, a resume point so a usage-limit cut loses
  nothing.
- After the pilot and after each domain: `docs/reviews/bank-<domain>.jsonl`, one line per question (id, obj, stem,
  options, key, why, source), committed, and oversight told. Oversight fact-checks every question with its own
  agents and sends back what is wrong or arguable; those are pulled from the shipped bank until fixed and re-passed.
- Nothing in a domain ships to learners until both checks are clean for it.

Order: the exam-format design first (the bank uses its format), then the pilot, then the domains.

## Judge table
(after the build)

---

## The style guide (from oversight, copied whole)


Written by oversight on 2026-11-16 from the owner's reference practice exams (about 270 questions with answers).
This is an abstract description of the format. It holds NO question, option, log or explanation from the reference.
Never copy one, never paraphrase one, never put the reference text into a prompt, a test or git (owner's rule).

## 1. The mix
- A full exam: about 90 items. About 5 are task items (see 4), the rest multiple choice.
- Domain weights follow the public objectives: 1 = 12%, 2 = 22%, 3 = 18%, 4 = 28%, 5 = 20%.
- Multiple choice breaks down roughly like this:
  - about 70% short work scenarios (2 to 4 sentences) ending in a question;
  - about 15% direct definition questions in one sentence ("Which of these describes ...?");
  - about 10% questions built on a short artifact: a log line, a firewall or IPS entry, an error message, a config
    listing, command output, a URL or an input string;
  - about 8% "Select TWO" or "Select THREE", with 5 to 7 options.

## 2. The question stem
- **A person with a job and a situation.** A role (security administrator, system administrator, network team,
  help desk, a user in some department, a business manager), an organization type (bank, factory, hospital, city,
  shipping firm, insurer, retailer) and what happened or what is required.
- **One or two deciding details.** The stem carries the clue that separates the answer from its close neighbors:
  "without new hardware", "the same key both ways", "before it goes to production", "from thousands of addresses",
  "the user never clicked anything". Difficulty comes from telling neighbors apart, never from tricks or trivia.
- **Requirement lists.** Some stems give 3 or 4 bullet requirements; one tool or control meets all of them, or the
  learner picks the N options that meet them.
- **The closing question uses fixed exam phrases**, with the key word in capitals:
  "Which of the following would BEST describe ...?", "... BEST way to ...?", "... MOST likely ...?",
  "What should the technician do NEXT?", "Which of the following should be configured ...?", "(Select TWO)".
- **Tone:** neutral and corporate, American spelling, no jokes, no game words, no second person ("you") in the
  stem. Characters are roles, rarely a first name.
- **Never** "all of the above", "none of the above", negative stems ("which is NOT") are rare (under 5%).

## 3. The options
- 4 options (A to D) for single answers; 5 to 7 for select-N and for "which control type" lists.
- **Same family.** All options come from one group of real objective terms: four incident response phases, four
  threat actors, four email protections, four agreement types, four recovery metrics. Each wrong option is a real
  term a half-prepared learner would pick, and is wrong for a reason the stem gives.
- **Short and parallel.** Mostly an acronym or 1 to 3 words; action options are short verb phrases with the same
  grammar. The right answer is not the longest, not the most specific, and its letter is spread evenly.
- **Acronyms are not expanded in the options.** The explanation expands them. The learner must know them (this is
  why the acronym section matters).
- **"BEST" questions** may have more than one partly true option; the explanation says why the chosen one is better
  for this exact scenario.

## 4. Task items (performance style), for bosses and the mock exam
Kinds seen (build only the ones the app can show well; the rest go to a later step):
- match each description to a term from a pool (some terms unused, or each used once);
- put steps in order (for example incident response phases);
- sort statements into categories (control categories, data states), categories reused;
- place controls on a small floor plan or by location;
- fill a firewall rule table (source, destination, protocol, port, allow or block) from a small network diagram,
  or mark traffic flows as allowed or blocked against a given rule table.
Partial credit per row is fine.

## 4b. Task items in detail (owner asked 2026-11-16: an option, fully interactive and graded)
From the owner's reference pages (layouts only; no content reused). Eight kinds:
1. **Match from a pool:** a bank of 6 to 8 term chips and 4 to 6 description rows, each row with a slot; "not all
   will be used" or "each used once". Rows may carry a small icon (phone, laptop, browser, server, person).
2. **Place by location:** 3 to 4 zones (for example outside, lobby, a secured door, a console), each with 1 to 2 slots,
   with a picture per zone; every chip used exactly once.
3. **Categorize:** 3 to 4 category chips, 5 to 10 statements, categories reused.
4. **Each used once:** 4 chips to 4 rows, a one-to-one match.
5. **Pick per platform:** 2 columns (for example a mobile device and a desktop), each with N slots, a chip pool with
   extras that fit neither.
6. **Put in order:** 5 to 7 chips placed into a numbered sequence.
7. **Build firewall rules:** a small network picture (two or three zones, named hosts with addresses, a firewall
   between) plus 2 to 4 plain requirements; the learner fills a rule table: source, destination, protocol, port,
   allow or block.
8. **Judge flows against rules:** a given rule table (with an implied deny at the end) and 5 to 7 traffic flows to
   mark allowed or blocked.

How they must work:
- **Interaction:** drag a chip into a slot on desktop; on phone, tap a chip then tap a slot; with a keyboard, every
  slot is also a select box. A placed chip can be moved or cleared. A chip marked "used once" leaves the pool when
  placed. The firewall table uses select boxes for hosts, protocol and allow or block, and a number field for port.
- **Grading by code, never by the model:** each slot is scored on its own (partial credit, for example 4 of 5), shown
  per row as right or wrong, then the correct answer for each wrong row with one line why. Firewall rules: rule order
  does not matter unless the requirement needs it, protocol case does not matter, a stateful firewall needs no return
  rule.
- **Built to be solvable:** the generator writes structured data (pool, rows, key, constraint "each used once" or
  "reuse allowed"). Code then checks there is exactly one valid solution, every key term is a real objective term,
  and the counts fit the constraint. Firewall and flow items are built by code from a fixed table of well-known
  ports and invented addresses, so the answer key is always right; the model only words the requirements.
- **Where they appear:** bosses (1 or 2 per fight), the mock exam (about 5 at the start, like the real exam), and a
  "Task practice" option per island. A setting can turn them off for a learner who wants choice questions only.
- **Explanation after grading:** per row, one line why, plus the objective number and a link to the lesson.

## 5. After an answer: the explanation
Always this shape, short:
1. **The answer:** the letter and term, then 1 to 3 sentences on why it fits the deciding detail.
2. **Why the others are wrong:** one line per wrong option, each tied to the scenario ("no traffic left the
   network here, so ..."), not a generic definition only.
3. **Where it lives:** the objective number and title, and a link to the lesson in the app.

## 6. Rules for our generator
- Each question is grounded in the reviewed cards and knowledge chapters of the objective it tests. The right answer
  and every "why wrong" line must be supported there.
- Scenarios, organizations, logs, addresses and wording are invented fresh. Few-shot examples in the prompt are our
  own, on different topics than any reference question.
- A check pass confirms: exactly the stated number of right answers, every distractor wrong for a stated reason, no
  answer leaked by length or wording, the deciding detail present.
- The reference text never enters the project. Oversight holds it and checks samples of generated questions against
  it: no run of 8 or more words in common outside of official term names, and no reference scenario reused with new
  names.
