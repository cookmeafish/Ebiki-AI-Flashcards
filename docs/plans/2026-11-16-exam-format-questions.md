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
Written 2026-11-16 from the six angle lists above and the code as it is today. Every JSON example below is invented
and on a subject the course does not teach (baking, gardening), on purpose: no example may look like a course or
reference question. Names of files and functions that exist today are real; everything marked NEW is to be built.

Facts the design rests on (checked in the code):
- The shipped package is ONE file, `public/careers/security-plus-sy0-701.json` (665 KB): 5 islands, 28 objectives,
  855 items of which 33 are briefings (`kind: 'brief'`, never quizzed), so 822 cards can be asked.
- A course fight today asks TYPED questions with optional choices (`fitQuestionsToKind`), judged by an AI call
  (`judgeStrike`). A lesson is `QuizRunner` with questions from `makeQuiz` (generate.js), which needs an AI key.
- Saved step content lives in `features/legends/step-<hash>.json` (store.js `readStep` / `saveStep`); a fight keeps
  only a `history` of prompts. Nothing of a running lesson or fight is persisted (NodeRun keeps it in memory).
- The map (`map-<modeId>.json`, `version: 2`) holds every star, tally, helper and nemesis. Older builds read it.
- `featureStore('legends')` has read and write per key, no listing, 4 MB per value, keys `[a-z0-9-]{1,64}`.

### D1. Summary and build order
One question shape (the EXAM QUESTION) serves the pre-made bank, live AI writing, lessons, checkpoints, bosses and
the mock exam. A course step asks bank questions first (no key, no internet), live AI questions only as an optional
extra, and never mixes the old typed format into one quiz. Task items are a second shape, graded by code. Everything
new lives in `src/features/legends/exam/` (pure `.js` + tests, `.jsx` screens) and `src/features/kit/tasks/`.

| Step | Ships | Tests that must be green |
|---|---|---|
| 1 | The exam question end to end: shape, `ExamQuestion.jsx` (single, select-N, artifact, explanation block, report), the bank reader and picker, the course quiz planner for lessons, checkpoints, Weak spots, region bosses, raids, the final raid and Legendary, the course fight profile, code-built acronym questions, live generation as an optional extra, the one-time notice, the build validator (`dev/careers/build-bank.mjs`) | `examQuestion.test.js`, `examChecks.test.js`, `bank.test.js`, `courseQuiz.test.js`, `courseFight.test.js` (simulation), `examGen.test.js`, `examStore.test.js`, `bank-package.test.js`, the old `fight`, `refund`, `profiles`, `balance`, `tuning`, `furycap`, `career`, `quizsave`, `quizkinds` suites untouched and green |
| 2 | Task items kinds 1, 3, 4, 6, 8: `taskEngine.js`, `firewall.js` (flow judging), `TaskItem.jsx` with the three input ways, Task practice per island, 1 or 2 per boss, the off setting, the per-kind how-to | `taskEngine.test.js`, `firewall.test.js`, `taskBoard.test.js`, drives of every kind by touch and keyboard |
| 3 | The mock exam, short sets, focused sets, resume, result, review, weak-objective retest, history and trend, "type it first" in lessons | `mockExam.test.js`, `examClock.test.js`, `examHistory.test.js`, merge tests with `deepMergeJson`, drives |
| 4 | Task kinds 2, 5, 7 (zone pictures, two platforms, build firewall rules) | `taskEngine.test.js` additions, `firewall.test.js` (rule grading), art checks for zone pictures |
| B | The bank content, in parallel once Step 1 freezes the format: the pilot objective first, then domain by domain (plan section "Phase B") | `build-bank.mjs` prints `no problems`; `bank-package.test.js` |

Each step is usable alone. Until a domain's bank ships, its steps use live questions (if allowed and a key works)
or the classic path (D3.5). Bank content never blocks a code step.

### D2. The question data model
#### D2.1 The stored shape (bank file and live questions, identical)

```json
{
  "id": "i2-3-0a1b2c3d.4", "item": "i2-3-0a1b2c3d", "obj": "2.3", "slot": 4, "rev": 1,
  "kind": "scenario", "level": 2, "pick": 1, "word": "BEST",
  "stem": "A bakery sells sourdough at a weekend market. The owner wants a crust that stays crisp for six hours on an open table.",
  "bullets": [],
  "ask": "Which of the following would BEST meet this goal?",
  "artifact": null,
  "options": [
    { "t": "Bake to a darker crust", "ok": true,  "item": "i2-3-0a1b2c3d", "why": "A darker bake drives off more surface water, and the stem asks for six hours on an open table." },
    { "t": "Wrap each loaf in plastic", "ok": false, "item": "i2-3-77aa01ff", "why": "Plastic traps steam, so the crust softens within the hour. The stem needs it crisp." },
    { "t": "Add more water to the dough", "ok": false, "item": null, "why": "Higher hydration opens the crumb. It does nothing for a crust that must stay crisp." },
    { "t": "Lower the oven temperature", "ok": false, "item": "i2-3-5d5d0c21", "why": "A cooler bake leaves more moisture in the crust, the opposite of the goal." }
  ],
  "detail": "stays crisp for six hours on an open table",
  "runner": 1, "edge": "Both protect the loaf, but only a darker bake keeps the crust crisp in open air.",
  "explain": "A crust softens when water moves back into it. Baking darker removes that water before the loaf leaves the oven.",
  "source": { "card": "keyPoints", "chapter": "Crust and moisture" },
  "by": "bank"
}
```

Field rules (all checked by `shapeExamQuestion` in NEW `exam/examQuestion.js`, and by the build):
- `kind`: `definition` (one sentence, no scenario), `scenario`, `artifact`, `multi` (select-N). `pick` = how many
  options are right: 1, or 2 or 3 with 5 to 7 options. `options.filter(ok).length === pick` always (W5).
- `level`: 1 = lesson ready (short, the deciding detail or its plain meaning is in the card text), 2 = boss level
  (longer scenario, close neighbors, BEST or MOST, select-N, artifacts).
- `word`: the capital key word in `ask` (`BEST`, `MOST`, `NEXT`, `NOT`, `FIRST`) or `""`. A `NOT` stem is `neg: true`.
- `stem` holds the scenario only; `ask` is the closing question (so a screen reader group can be named by it, and the
  key word can be marked up). `bullets`: 0, or 3 to 4 requirement lines, shown as a real list.
- `artifact`: `null` or `{ "type": "log" | "config" | "rule" | "output" | "url" | "input" | "message", "lines": ["..."],
  "mark": [0] }` (`mark`: the line numbers the explanation highlights). At most 8 lines of 100 characters.
- `options[].why`: one line for EVERY option, tied to the stem. It travels with its option, so no shuffle can pair a
  line with the wrong option (W8). `options[].item`: the course card whose term this option is, or `null`.
- `detail`: the deciding detail, a literal substring of `stem`, a bullet or an artifact line (required for every
  question whose `word` is not empty, and for every scenario).
- `runner` (index of the runner-up) and `edge` (the one detail that made the key win): required when `word` is BEST or
  MOST and any wrong option is partly true; forbidden otherwise.
- `source`: `card` = the card field that proves the key (`definition`, `example`, `keyPoints`), `chapter` = the study
  guide heading that covers it. Dev-only proof (primary source, pass log) stays in `dev/careers/sources/<id>/bank/`.
- `by`: `bank` or `live`. A live question also carries `chk` (D5.4). `rev` rises when a shipped question is fixed.
- Text rules: English, no dashes, no HTML, no "you" in the stem, no "all of the above" or "none of the above".

#### D2.2 The shape QuizRunner gets
`toRunnerQuestion(q, { order, lesson })` (pure) returns today's choice question plus an `exam` block, so every
existing reader of `q.choices[q.answerIdx]`, `q.prompt`, `q.target`, `q.explanation` keeps working:

```json
{ "kind": "choice", "prompt": "<stem>\n\n<ask>", "choices": ["..."], "answerIdx": 2, "target": "<the card's front>",
  "explanation": "<explain>", "itemId": "i2-3-0a1b2c3d", "qid": "i2-3-0a1b2c3d.4",
  "exam": { "pick": 1, "right": [2], "whys": ["...", "...", "...", "..."], "optItems": ["i2-3-...", null, "...", "..."],
            "stem": "...", "ask": "...", "word": "BEST", "bullets": [], "artifact": null, "detail": "...",
            "runner": 0, "edge": "...", "obj": "2.3", "level": 2, "format": "scenario", "by": "bank" } }
```

`order` is the option order chosen by `balancedOrder` (D2.4); `answerIdx` is the first right index (for select-N the
`exam.right` list is the truth). `NodeRun.record` uses `q.itemId` when present instead of `itemIdFor(q, area.items)`.

#### D2.3 What changes in QuizRunner, and the new component
QuizRunner (kit/QuizRunner.jsx) stays the one runner for lessons, checkpoints and fights. It gains ONE delegation: a
question with `q.exam` renders NEW `kit/ExamQuestion.jsx` in place of the choice grid, and NEW `kit/ExamExplanation.jsx`
in place of the one-line explanation inside the feedback strip. Questions without `exam` render exactly as today.

`ExamQuestion({ q, value, onChange, mode, struck, onStrike, hidden, disabled, t })` is presentational and is also the
question view of the mock exam (D7), which has its own runner because QuizRunner cannot move freely.
- `mode`: `practice` (lesson, checkpoint, fight), `exam` (mock exam: no verdict, strike-out shown), `review`.
- Options are `<label>` tiles around a visually hidden native `<input type="radio">` (single) or `<input
  type="checkbox">` (select-N) inside one `role="radiogroup"` or `role="group"` named by `ask` plus the pick line.
- `value` is always a list of chosen indexes. QuizRunner's `picked` becomes a list for exam questions; `check()`
  grades with `gradeExamAnswer(q, picks)` (pure): `{ correct, rightPicks, wrongPicks, missed }`.
- Select-N: a count line ("1 of 2 chosen") sits under the options, in a polite live region. Check is disabled until
  exactly N are chosen and says why ("Choose 1 more"). A pick past N is refused with a visible, announced note
  ("2 already chosen. Clear one first"); it never replaces an earlier pick.
- Picking never submits. Check is a second, separate action (already QuizRunner's pattern).
- Strike-out exists only in `mode="exam"`: a separate labelled toggle per option (D7.3).
- `hidden`: option indexes removed by a hint scroll (D4.6).
- New optional QuizRunner props: `retryQuestion(q)` (the question a missed one comes back as; default the same
  question) and `explainExtra(q, verdict)` (the links row: lesson, Learn it, Add to deck, Report).
- QuizRunner records `info.mode = 'choice'`, `info.picks`, `info.partial` (select-N with some right picks) and
  `info.format`.
- Help (`ctx.help.set('quiz', ...)`) already hides the answer while a question is live; for exam questions it lists
  the options and, after the answer, the key and its why line.

#### D2.4 Option order and letter spread
The stored order is never shown. `balancedOrder(questions, rand)` (pure) gives every question of one quiz or exam its
option order so that, over the quiz, the right answer's position is spread evenly: positions are dealt from a
shuffled bag of A to D repeated, so a 20-question fight has 5 of each letter, and any 200 questions land within 20
to 30% per letter by construction. Select-N right positions are dealt the same way. Tested over 2,000 runs.

#### D2.5 The explanation block (`ExamExplanation.jsx`)
Shown after EVERY answer in lessons, checkpoints and fights, right or wrong, and in mock exam review. Never during a
mock exam. Order, top to bottom:
1. Verdict with a mark and a word ("Correct", "Incorrect"), then "The answer: B, <term>" (for select-N: both, and
   which of the learner's picks were right and which wrong).
2. `explain` (1 to 3 sentences) with `detail` shown in quotes and bold. For BEST or MOST: the runner-up line, "Close:
   C, <term>. <edge>". An artifact is shown again with its `mark` lines highlighted.
3. "Why the others are wrong": a real list, one item per wrong option, each starting with its letter and term.
4. Acronyms: `expandAcronyms(text, courseAcronyms)` (pure, from the package's acronym list) adds the expansion in
   parentheses at the first mention of every acronym used in the stem or options. Authors do not have to.
5. In a lesson only: an option whose `item` is not taught yet (D4.1) gets the tag "Not covered yet" and one line on
   what it is (the first sentence of that card's definition, from the package).
6. "Where it lives": objective number and title, then the links row: "Open lesson: <title>" (a real link), Learn it
   (the existing `LearnItPanel`), Add to deck (the existing `AddOne`, which shows "In your deck"), Report.

The lesson link opens a `Modal` layer (`useNavLayer`) with that lesson's `ItemCard`s. Back or Esc closes only the
layer; the quiz or fight under it is untouched and focus returns to the link. The objective shown is `q.exam.obj`
and the lesson is found by `q.itemId`, so the two always agree.

#### D2.6 Report a question (the dispute path that needs no AI)
"Report" asks for a reason (wrong answer marked right, two answers fit, unclear, other) and writes
`{ qid: { reason, at, rev } }` to `xq-report-<mode>` (D8.3). Effects, all by code:
- The question is never picked again for this learner (while its `rev` is unchanged).
- In a lesson or checkpoint a reported miss is taken out of the result (not counted in the score or the tallies).
- In a fight a reported miss is treated like an overturned answer: `refundRunningFight` (fight.js) gives the heart
  back, at most `REPORT_REFUNDS = 2` per fight (later reports still remove the question for the future).
- In mock exam review the question leaves the score at once; the result shows both ("84 of 89, 1 reported").
- Settings > General > Legends shows the count and "Copy reported questions" (ids and reasons), so the owner can
  feed them back to the bank review. The AI Appeal (`MissTools`) is not offered on course questions.

### D3. The bank
#### D3.1 Files and size

```
public/careers/security-plus-sy0-701.json          the course package, unchanged
public/careers/security-plus-sy0-701/bank/manifest.json
public/careers/security-plus-sy0-701/bank/q-1-1.json ... q-5-6.json     one per objective (28)
public/careers/security-plus-sy0-701/bank/t-1-1.json ...                task items per objective (Step 2)
```

`manifest.json` (about 30 KB, fetched once per session, re-checked by ETag):

```json
{ "course": "security-plus-sy0-701", "format": 1, "rev": 7,
  "objectives": { "2.3": { "file": "q-2-3.json", "rev": 3, "tasks": "t-2-3.json",
      "cards": { "i2-3-0a1b2c3d": "ddssSSSSam", "i2-3-77aa01ff": "ddssSSS-am" } } } }
```

One character per slot: `d` definition, `s` scenario level 1, `S` scenario level 2, `a` artifact, `m` select-N, `n`
negative stem, `-` pulled. Lower case `a` or `m` = lesson ready, upper case = boss level. The picker plans a whole
quiz from the manifest alone and then loads only the objective files it needs. An objective missing from the
manifest has not shipped.

Size estimate (stem 350, four options 90, four why lines 450, explain 180, the rest 180 characters): about 1.25 KB a
question. 822 cards x 10 = 8,220 questions = about 10.3 MB (the plan's 8,550 counts the 33 briefings, which are never
asked; with them 10.7 MB). Per domain 1.5, 2.0, 1.7, 3.2 and 2.1 MB: too much to load for a 3-card lesson on a
phone. So: ONE FILE PER OBJECTIVE, 28 files, average 370 KB, largest (52 cards) about 650 KB. A lesson loads 1 file,
a region boss 1 to 3, a raid 4 to 9, the mock exam all 28 during its preparing screen (clock not running). Files are
kept in a small in-memory LRU (`BANK_CACHE = 12`). NEW `exam/web.js` holds the only `fetch` (static files, like
`loadCareer` in CareerMap.jsx); `exam/bankSource.js` takes it injected (`createBankSource({ fetchJson })`), so a
phone build reads the same files from its bundle.

#### D3.2 The build validator (`dev/careers/build-bank.mjs`, NEW)
Sources: `dev/careers/sources/<id>/bank/<obj>.rN.json` (the highest pass per objective), `bank/pulled.json` (ids
oversight pulled), `bank/passes.json` (which of the four passes each objective finished). It writes the public files
and FAILS (exit 1) on any of these, using the SAME pure functions as the app (`exam/examChecks.js`), so the live
check and the build can never disagree:

- Count: 10 unpulled questions per card (fewer only with `--allow-short`, printed), at least 2 `d` and 2 `s` slots
  per card (a lesson asks a new card twice, D4.1), and an objective ships only when all four passes are stamped.
- Shape: `shapeExamQuestion` passes; `ok` count equals `pick`; 4 options for pick 1, 5 to 7 for pick 2 or 3; a why
  line on every option; `detail` is a literal substring; `runner` and `edge` present exactly when required.
- Every `options[].item` and the question's `item` exist in the package; `obj` matches the card's section.
- Text: no dashes, no HTML, no "you" in a stem, no "all of the above" or "none of the above", `ask` ends in "?" and
  uses a known closing form, the key word in capitals.
- Negative stems: under 5% of an objective's questions, `NOT` in capitals.
- Duplicates: no two stems equal after `stemSkeleton` (lower case, numbers and names of roles and organizations
  folded) within a card or across the course; no two questions of one card with the same key and the same detail.
- Length tell: over each card's 10 and over each objective, the key is the longest option in at most 30% of
  single-answer questions (chance is 25%), and never the only option over 1.5 times the median length.
- Position: stored right answers spread over A to D (each 20 to 30% per objective). The app re-deals anyway (D2.4).
- Parallel options: one grammatical shape (all noun phrases, or all verb phrases starting with a base verb); an `ask`
  ending in "a" or "an" must fit every option; singular or plural must not single one out.
- Stem leak: the stem, bullets and artifact never contain the key text, its acronym or its expansion (from the
  package's acronym list), nor a content word of 5 or more letters that appears in exactly one option.
- Acronyms: every unexpanded acronym in an option is in the course's acronym list or is a card front.
- Lesson ready (lower case slots): at most 4 sentences in the stem; `detail` or a card sentence sharing its content
  words is in the card's own text; no acronym in the stem that the card does not contain, unless expanded in the same
  sentence; an artifact only when the card's text names that kind of artifact.
- Artifacts: at most 8 lines of 100 characters; addresses only from 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24
  and 2001:db8::/32; host names only under `.example`, `.test` or `.invalid`.
- Own words: the existing `verbatim.mjs` overlap checks against the outline, run over every stem, option and why
  line (12 word runs and the shorter prose phrase check).
- Task items (Step 2): `compileTask` passes and `countSolutions(task) === 1` (D6.3).

It also writes `docs/reviews/bank-<domain>.jsonl` (plan B6). `bank-package.test.js` re-runs the shape and count
checks on whatever bank is in `public/`, so a hand edit cannot ship a broken file.

#### D3.3 The picker (`exam/bank.js`, pure)
- `eligibleSlots(cardCode, want)`: the slot numbers of a card that fit `want` (`{ kinds, level, neg, pick }`).
- `pickSlot(slots, asked, rand)`: a random slot not in this card's `asked` cycle. When every eligible slot was asked:
  start a new cycle and never pick one of the last 3 asked (the last 1 when 3 or fewer are eligible).
- One quiz or exam never holds two first-pass questions of the same card. The only second question of a card is a
  lesson's planned second look at a NEW card and a missed question's return (D4.1), always from another slot.
- `notePicked(state, picks)` returns the new state. It is saved when the quiz STARTS, so an abandoned quiz or exam
  does not see the same questions on return.
- Reported questions (D2.6) and pulled slots are never eligible.

#### D3.4 Picker state: where it lives and how two computers merge it
`features/legends/xq-pick-<mode>-d<n>.json`, one per domain, an OBJECT keyed by card id (never a list, so the
offline 3-way merge `deepMergeJson` merges card by card):

```json
{ "v": 1, "cards": { "i2-3-0a1b2c3d": { "a": "3817", "p": "26" }, "i2-3-77aa01ff": { "a": "0" } } }
```

`a` = the slots asked in the current cycle, oldest first (one character per slot, `0` to `9` for bank slots, `a` to
`f` for live slots); `p` = the tail of the previous cycle (for the last-3 rule). `updatePick(modeId, domain, fn)` in
NEW `exam/examStore.js` follows `updateMap`: serialized, re-reads the file before every write, never writes after a
failed read, refuses while `isDataSwitching()`, mode id pinned by the caller when its task STARTED. When both
computers changed the same card, one side's string wins; the worst case is one repeated question, never lost
progress. A failed read or write never blocks the quiz: it is asked without saving, and that is all that is lost.

#### D3.5 Which questions a step gets (never a mix of old and new formats)
`planCourseQuiz` (D4) asks for N cards. For each card, in this order:
1. A bank slot (shipped objective, eligible slot).
2. A saved live question for the card (`xq-live-<mode>-<obj>`, D5.5).
3. A NEW live question, only when the course's live setting allows it and a key works (D5).

If every card got a question, the quiz is an exam-format quiz. If some did not, those cards are dropped while at
least `MIN_SHARE = 0.7` of the planned questions remain (a fight keeps its full count by sampling other cards of the
same pool). Otherwise the WHOLE step falls back, in this order: the old saved set of the step if one exists (played
exactly as saved, no AI call), then today's `makeQuizNow` when a key works, then a plain screen: "Exam-style
questions for this domain are not installed yet, and no AI key is set", with the way to add a key or switch live
writing on, nothing lost and nothing recorded. A fallback quiz carries a small "Classic questions" label.

The per-course setting `features.legends.liveQuestions` (config.json, so it follows the learner):
- `gaps` (default): AI writes only for cards with no bank question yet.
- `mix`: also adds live questions for variety (at most 1 in 4 of a quiz).
- `off`: never an AI call for course questions.
It is shown in Settings > General > Legends and named in the one-time notice.

### D4. Lessons, checkpoints, bosses, raids
All planning is in NEW `exam/courseQuiz.js` (pure `planCourseQuiz(map, area, node, { manifest, pick, reports, met,
rand })` returning `[{ item, want, role }]`, plus `makeCourseQuiz(ctx, modeId, area, node)` which loads files, fills
gaps and saves the pick state). `makeQuiz` (generate.js) gets one branch at its top: a career map goes to
`makeCourseQuiz`; everything else is unchanged. `adaptiveSplit`, the ladder, `fitQuestionsToKind`, the prefix hint
and the choice pool are not used for course questions (a course is a general subject; D-conflict 1).

#### D4.1 Lessons (kind `learn`; 1 to 4 new cards)
- TAUGHT SET = the lesson's own cards + the cards of every completed lesson of the course (`status === 'done'`).
- Each NEW card is asked twice: a `d` slot first, an `s` slot in the second half of the quiz. Up to 4 REVIEW cards
  from earlier lessons of the same objective (shakiest first, `weakItems`) are asked once each, level 1, between
  them. Size = 2 x new + reviews, at most 10. So a quiz opens with one-sentence definitions and scenarios come in its
  second half, in every lesson and not only the first.
- A slot is preferred when all its options are taught (`options[].item` in the taught set). The right option is
  always the lesson's or an earlier card (it is the card's own question). At least one wrong option must be taught;
  a slot with none is not used in a lesson. Any untaught option gets "Not covered yet" in the explanation (D2.5).
- Format gates, from the map alone: while fewer than 3 lessons of the course are done, no select-N and no negative
  stem. An artifact slot is used only when it is lesson ready (the card names that kind of artifact) or its card was
  taught by a completed lesson. Lessons never use level 2 slots.
- A missed question comes back once at the end (`retryMisses`, as today) as ANOTHER slot of the same card
  (`retryQuestion`), never counted twice.
- First-time helps, each shown once per learner (D8.3 `hints`): before the first BEST or MOST question a
  dismissable note ("Several options can be partly true. One detail in the question decides."); before the first
  artifact question a one-line cue ("This is a log entry. Read it before the options."); select-N always shows
  "Pick 2" outside the stem.
- Acronym options in a lesson: a small "Spell out" control beside an acronym option shows its letters spelled out
  (from the package's acronym list, never a definition). Using it marks the answer `aided` (graded at most Hard by
  `gradeAnswer({ hintUsed: true })`). Bosses and the mock exam never offer it; the first use says so once.
- A miss whose right option, or the picked wrong one, is an acronym the track holds names the island's acronym
  drill ("Core acronyms") with a link.
- Result: `PASS.node` (0.6) and stars as today. Under 50%, the result names the 1 to 3 most missed terms with lesson
  links and puts "Review these, then try again" before "Try again".
- No hearts and no timer in lessons, ever.

#### D4.2 Checkpoints, Weak spots, acronym track, Legendary
- Checkpoint (layout 1 courses only): `careerQuizItems(area, node, { max: CAREER.checkpointItems })` picks the cards
  as today; 12 questions, one per card, levels 1 and 2 half and half; `PASS.checkpoint` unchanged.
- Weak spots: one question per `weakItems(area)` card, any level; the bonus life rule is unchanged.
- Acronym lessons and drills: built by CODE, no bank and no AI (`acronymQuestions(item, pool, rand)` in
  `exam/acronymQuiz.js`): "What does <ACR> stand for?" with three expansions of the same tier as wrong options, and
  the reverse form. Same exam shape, kind `definition`. The acronym track works with no key and no internet.
- Legendary: 20 questions, level 2, the course fight profile with `pass: PASS.legendary`.

#### D4.3 Fights: region boss (15), island raid (25), final raid (30)
Question counts stay (`node.count`). Cards come from `careerQuizItems` as today (shakiest first, spread over the
objectives), with the nemesis share (`NEMESIS_SHARE`, 30%) taken from `area.nemesis.itemIds` first. Levels: a first
region's boss 40% level 1 and 60% level 2, later regions 20 / 80, raids and the final raid any level. Formats a boss
may use: every format the learner has met (D4.5), plus at most ONE not met yet (free on a miss). Within a fight no
question may give away another's answer (`revealsAnother`, D7.2).

Every course question is a choice question, so "typed = power strike, choices = safe strike" has no meaning there.
A course fight runs on its own profile (NEW `exam/courseFight.js`), passed through the tune layer that raids already
use (`newFight({ variant: 'course', rules })`, `rulesOf`), so fight.js keeps one engine and raid numbers do not move:

```js
export const COURSE_FIGHT = {
  pass: { region: 0.6, raid: 0.64, final: 0.66, legendary: 0.9 },   // share of right answers that empties the bar
  rules: { damage: { clean: 1, glancing: 1, choice: 1, crit: 1, weak: 0, counter: 1 }, attackLives: 1, missLives: 1, weakToMax: 0 },
  taskPass: 0.6, taskBonus: 1, reportRefunds: 2,
}
```

- A right exam answer is a full strike: `strike(state, { verdict: 'clean', mode: 'exam' })`. `mode: 'exam'` takes the
  clean branch of `strike` (only `'choice'` takes the safe branch), deals 1, and every third in a row is a critical
  (+1). A wrong answer is a miss: 1 heart.
- Health and hearts: `bossOdds(total, { pass, bonus })` as today. Region boss: 9 right answers win, 7 hearts. Raid
  (25): 16 and 10. Final (30): 20 and 11. The intro card states these numbers; the outcome decides the pass
  (`fightStars`), as today.
- The boss strikes back as today: a missed card returns `ATTACK_GAP` questions later as an attack, but as ANOTHER
  slot of that card (a new stem). Blocked = counter 1. A missed attack costs 1 heart here (not 2): no single question
  in a course fight may cost more than one heart. No other slot available = no attack.
- `judge` is not passed (no AI call in a course fight). `canUseChoices`, `startChoices`, the strike hint header, the
  re-check, the Appeal and glancing follow-ups are off for course fights. Taunts stay (they are optional, need a key,
  and show nothing without one). Learn it and the explanation show after every answer.
- Item tallies: `gradeFromStrike(verdict, { choice: true })`, so a right answer is Good (it counts toward gold as a
  fight answer does today) and no item can drop a tier from the change.
- `NodeRun` gets `course = isCareerMap(map)` from LegendsScreen and branches in four small places: the profile for
  `newFight` and `bossOdds`, the verdict mapping in `record`, the attack question, the tools row.

#### D4.4 Select-N and task items: scoring said before, matched after
- Select-N is right only when exactly the N right options are chosen. The line under the options says so before
  answering: "Pick 2. Both must be right to count." A wrong one costs one heart in a fight (never more), and the
  explanation says which picks were right and which wrong.
- A task item in a fight (Step 2) shows before it starts: "All rows right: 2 damage. 60% or more: 1 damage. Less:
  1 heart." Mapping: all right = `clean` with `opts.bonus = 1`; fraction at or above `taskPass` = `glancing` (1 damage,
  no heart); below = miss, 1 heart. Categorize uses the chance-corrected fraction (the rule of `pbqRatingScore`).
  Results are per row. Task items never move item tallies; their progress is in `xq-tasks-<mode>`.

#### D4.5 A format met for the first time inside a fight costs no heart
`xq-state-<mode>.met` (D8.3) records each format the learner has answered in a lesson, a checkpoint or Task
practice: `multi`, `artifact`, `neg`, `task-match`, `task-order`, `task-sort`, `task-pairs`, `task-flows`, ... A
fight question whose format is not in `met` carries `free: true`: a miss on it costs no heart (a one-line change in
`strike`: `if (hit.free && res.lives > 0) { res.lives = 0; res.freed = true }`, tested), the screen says "New kind
of question: no heart at stake", and the format is then recorded as met. At most one such question per fight.

#### D4.6 Rules the learner already knows
- Shield: unchanged (absorbs one heart). Bonus life from Weak spots: unchanged (`bossOdds` `bonus`).
- Hint scroll: today it shows half of a typed answer. In a course it removes one wrong option of a single-answer
  question (`hidden`), marks the answer `aided`, and its button shows only on a question where it can be used, so a
  scroll is never spent for nothing.
- Nemesis: unchanged in the map; the rematch draws its share in the new format; a win clears it.
- Task items can be switched off on the boss intro (a row in `FightSettings`), on the mock exam start and in
  Settings (`features.legends.taskItems`, default on, read when a fight is PLANNED, so never mid-fight). Off = the
  fight keeps its full question count with choice questions.
- A lost boss names the 1 to 3 most missed terms with lesson links and offers "Review these, then try again" before
  "Fight again".

#### D4.7 Still winnable at about 65%: the simulation that sets the numbers
`courseFight.test.js` simulates 20,000 fights per case with `strike` itself (answers right with probability p,
attacks included, one free question, no task items and with 2): at p = 0.65 a region boss is won at least 60% of
the time per attempt and at least 90% within 3 attempts; at p = 0.40 at most 15%; raids and the final raid at least
50% per attempt at p = 0.65 and at least 85% at p = 0.75. The numbers in `COURSE_FIGHT` are the starting values;
the test decides, never feel (`PROFILES=1` style table printed with `COURSE=1`). Suites to rerun unchanged:
`fight.test.js`, `refund.test.js`, `profiles.test.js`, `balance.test.js`, `tuning.test.js`, `furycap.test.js`,
`siege.test.js` (a course profile must not change any raid result).

### D5. Live generation (the optional extra)
Files: `exam/examGen.js` (pure: prompts, parsers), `exam/examChecks.js` (pure: the code checks of D3.2),
`exam/examples.js` (our own few-shot examples), `exam/examLive.js` (the calls, through `ctx.ai.call`).

#### D5.1 When and how much
Only for cards D3.5 could not fill, in batches of 6 cards per call, 2 questions per card (one `d` or `s` level 1,
one level 2), so the second visit already has variety. New AI jobs in `src/config/aiJobs.js`: `legends.exam` (role
`study`) and `legends.examCheck` (role `qcheck`), with their `aiJob_*` keys in four locales and a task in
`modelPlan.js`. A boss of 15 with no bank costs about 3 writing calls and 3 check calls.

#### D5.2 The prompt (outline)
System: "You write practice questions for a certification course. Reply with JSON only: {"questions": [<the D2.1
shape without id, slot, rev, by>]}." Then, in order:
1. The format rules of the style guide sections 2 and 3, as rules (never as examples from any source).
2. `TEACHING_STYLE_RULE` (utils/questionTier.js), so the prompt joins `teachingStyle.test.js`.
3. THE MATERIAL: for each card its number, front and full back; then the study guide sections for the objective,
   from NEW generic `ctx.subject.knowledgeFor(task, cap, cacheKey)` (a thin wrapper of App's `getKnowledgeContext`,
   which already picks sections by the guide's outline; added to the feature context as a generic service).
4. "The right answer and every why line must be supported by this material. If the material does not settle which
   option is best, do not write that question."
5. THE OPTION FAMILY: the fronts of the same objective's other cards, marked taught or not for a lesson ("wrong
   options come from this list; for a lesson at least one wrong option is marked taught").
6. Requirements per question: `detail` copied from the stem; one why line per option tied to the stem; `runner` and
   `edge` for BEST or MOST; invented organizations; documentation addresses only; no real names.
7. Two examples from `exam/examples.js`, on baking and gardening. A test fails if any example shares a card front or
   an acronym with any shipped course.
8. What to avoid: the stems this card was already asked with (bank and live).

#### D5.3 Checks before anything is shown
1. `shapeExamQuestion`, then every code check of D3.2 that applies to one question or one batch (count of right
   options, detail substring, stem leak, acronyms taught, parallel shape, length tell over the batch, lesson-ready
   rules, artifact rules, duplicates against the avoid list).
2. THE CHECK PASS, one call per batch with the `qcheck` model, as a BLIND SOLVE: it gets the material and each
   question WITHOUT the key and returns `{ "i": 0, "picks": [2], "also": [], "detail": "...", "fact": true }`. A
   question passes only when `picks` equals the key, `also` (other options that could be defended) is empty,
   `detail` names the same deciding detail, and `fact` (nothing in the stem contradicts the material) is true.
3. A question failing 1 or 2 is rewritten ONCE in a call that names the reason, checked again, then dropped.

#### D5.4 Failure handling
- No key, a signed-out plan or no credit: no call is made; D3.5's fallback applies; the screen says how to add a key.
  No heart, XP or attempt is lost, and there is never a blank question.
- A cut-off reply: `parseAiJson` salvages the complete questions; only the cards still missing are asked again once.
- The check pass failed or timed out: one retry. Still no verdict: those questions are NOT shown and NOT saved (a
  set is never stamped as checked without a check); the cards count as unfilled (D3.5).
- Total failure: an error screen with Retry and "Back to the map", the same as today's `lg_errQuiz`; the step is
  not marked attempted.
- Every result is discarded if the mode changed or the data folder is switching (`modeId` pinned, `once` keyed by
  mode, area and node as `makeQuiz` does).

#### D5.5 Where live questions are kept
`features/legends/xq-live-<mode>-<obj>.json`: `{ "v": 1, "cards": { "<item>": { "a": { ...question, "chk": 1 } } } }`,
slots `a` to `f` (at most 6 per card, oldest replaced). Written once, reused with no AI call, picked by the same
picker as bank slots. `chk` = `EXAM_CHECK_VERSION`; a question with an older `chk` is checked again before reuse.

### D6. Task items
#### D6.1 A new kit module, not a change to `src/pbq/engine.js`
`src/pbq/engine.js` stays as it is. Its compiled shape (one `assign` list aligned with the left items) cannot hold
unused chips, a zone with two slots, two platform columns or a rule table, and it carries Study's authoring
prompts, rating and saved question-bank PBQs, with 460 lines of tests and App.jsx wiring. NEW
`src/features/kit/tasks/` holds one general "chips into slots" model for kinds 1 to 6 and a separate firewall model
for 7 and 8. It imports the engine's pure helpers (`itemKey`, `norm`, the shuffle) instead of copying them, and
`fromPbq(pbq)` adapts a compiled Study PBQ to the new board so Study can adopt `TaskItem.jsx` later. Study's PBQ mode
is not touched in this plan.

#### D6.2 Data shapes
Kinds 1 to 6, one shape (`kind`: `match`, `place`, `sort`, `pairs`, `platform`, `order`):

```json
{ "id": "t-2-3.02", "obj": "2.3", "kind": "match", "title": "Match each bread fault to its cause",
  "scenario": "A baker lists four faults seen this week.",
  "chips": [ { "id": "c1", "t": "Underproofed", "item": "i2-3-0a1b2c3d" }, { "id": "c2", "t": "Oven too cool" },
             { "id": "c3", "t": "Too much flour" }, { "id": "c4", "t": "Overproofed" }, { "id": "c5", "t": "Old yeast" },
             { "id": "c6", "t": "Too much salt" } ],
  "rows":  [ { "id": "r1", "t": "The loaf tears open along one side", "icon": "none", "slots": 1 },
             { "id": "r2", "t": "The loaf collapses when scored", "slots": 1 },
             { "id": "r3", "t": "The crust is pale after the full time", "slots": 1 },
             { "id": "r4", "t": "The dough never rises", "slots": 1 } ],
  "use": "once", "all": false,
  "key":  { "r1": ["c1"], "r2": ["c4"], "r3": ["c2"], "r4": ["c5"] },
  "fits": { "r1": ["c1"], "r2": ["c4"], "r3": ["c2"], "r4": ["c5"] },
  "why":  { "r1": "A tear means the dough still had rise left when it met the heat.", "r2": "...", "r3": "...", "r4": "..." } }
```

| Kind | chips | rows | `use` | `all` | Sizes |
|---|---|---|---|---|---|
| 1 `match` | terms | descriptions, 1 slot | `once` or `reuse` | false ("not all will be used") | 6 to 8 chips, 4 to 6 rows |
| 2 `place` | controls | zones, 1 to 2 slots, `img` | `once` | true | 3 to 4 zones |
| 3 `sort` | categories | statements, 1 slot | `reuse` | false | 3 to 4 chips, 5 to 10 rows |
| 4 `pairs` | terms | descriptions, 1 slot | `once` | true | 4 and 4 |
| 5 `platform` | features | 2 columns, N slots | `once` | false (extras fit neither) | 2 rows |
| 6 `order` | steps | positions 1 to n, 1 slot | `once` | true | 5 to 7 |

Kinds 7 and 8 (`kit/tasks/firewall.js`):

```json
{ "id": "t-3-2.f01", "obj": "3.2", "kind": "flows",
  "net": { "zones": [ { "id": "out", "name": "Internet" }, { "id": "dmz", "name": "DMZ" }, { "id": "in", "name": "Office" } ],
           "hosts": [ { "id": "h1", "name": "Web server", "zone": "dmz", "ip": "203.0.113.10" },
                      { "id": "h2", "name": "Mail server", "zone": "dmz", "ip": "203.0.113.25" },
                      { "id": "h3", "name": "Admin PC", "zone": "in", "ip": "192.0.2.20" } ] },
  "rules": [ { "src": "any", "dst": "h1", "proto": "tcp", "port": 443, "act": "allow" },
             { "src": "h3", "dst": "h1", "proto": "tcp", "port": 22, "act": "allow" },
             { "src": "any", "dst": "h2", "proto": "tcp", "port": 25, "act": "allow" } ],
  "flows": [ { "id": "f1", "src": "out", "dst": "h1", "proto": "tcp", "port": 443 },
             { "id": "f2", "src": "out", "dst": "h1", "proto": "tcp", "port": 22 } ],
  "seed": 48213 }
```

A `flows` item stores no key: `evalFlow(rules, flow)` (first match wins, an implied "deny all" last, written out as
a text row) IS the key, so it can never be wrong. A `rules` item (kind 7) stores `reqs`: `[{ "t": "<requirement in
plain words>", "must": [flow, ...], "mustNot": [flow, ...] }]` and `guards` (flows that must stay blocked).

#### D6.3 Grading by code, and the one-solution check
- Kinds 1 to 6: `gradeTask(task, board)` scores every slot on its own: a row with 2 slots is compared as a set.
  Result: `{ rows: [{ id, right, chosen, key, why }], right, total, fraction }`. `sort` also returns the
  chance-corrected fraction.
- `countSolutions(task)` (brute force over at most 8 chips): the number of complete boards that respect `use`, `all`
  and every row's `fits`. It must be exactly 1 and equal `key`. `fits` is what the author AND the blind solver list
  per row ("every chip that would be right for this row on its own"), so two interchangeable steps, or a chip that
  fits two rows of a `once` item with no other way to tell, show up as 2 or more solutions and the item is rejected.
- Every key chip of kinds 1 to 6 names a course card (`item`) or is a term of the acronym list.
- Kind 8 `flows`: per flow right or wrong against `evalFlow`. `buildFlowsTask(seed, objective)` builds the network,
  the rules and 5 to 7 flows by code and keeps only sets with at least 2 allowed, 2 blocked, 1 caught by the implied
  deny and 1 where rule order decides. No model call, endless variety, works offline.
- Kind 7 `rules`: the learner's table is run through `evalFlow`. A requirement is met when all its `must` flows are
  allowed and all its `mustNot` flows blocked; a broken guard marks the rule that opened it as "too broad". So rule
  order only matters when a requirement needs it, protocol case cannot matter (a select), and no return rule is
  needed (the evaluator is stateful by definition: only the first packet of a flow is judged). The stored key rule
  set must meet every requirement and guard, and removing any key rule must break one (no spare rule). Only the
  requirement wording comes from an agent at build time.

The port table (`PORTS` in `firewall.js`; public well-known assignments, the only ports an item may use):

| Service | Protocol | Port | Service | Protocol | Port |
|---|---|---|---|---|---|
| FTP control | tcp | 21 | LDAP | tcp | 389 |
| SSH, SFTP | tcp | 22 | HTTPS | tcp | 443 |
| Telnet | tcp | 23 | SMB | tcp | 445 |
| SMTP | tcp | 25 | Syslog | udp | 514 |
| DNS | udp and tcp | 53 | SMTP submission | tcp | 587 |
| DHCP | udp | 67, 68 | LDAPS | tcp | 636 |
| TFTP | udp | 69 | IMAPS | tcp | 993 |
| HTTP | tcp | 80 | POP3S | tcp | 995 |
| Kerberos | tcp and udp | 88 | SQL Server | tcp | 1433 |
| POP3 | tcp | 110 | RADIUS | udp | 1812 |
| NTP | udp | 123 | MySQL | tcp | 3306 |
| IMAP | tcp | 143 | RDP | tcp | 3389 |
| SNMP | udp | 161 | SIP | tcp and udp | 5060 |

A `firewall.test.js` case fails when an item uses a port outside the table or an address outside the three
documentation ranges. Each row of the table is checked against the IANA registry before Step 2 ships.

#### D6.4 Three ways to answer, one board (`TaskItem.jsx`)
State is a pure reducer `boardReducer(board, action)` in `taskEngine.js`: `hold(chip)`, `cancel`, `place(chip, slot)`,
`clear(slot)`, `move(fromSlot, toSlot)`, `swap`, `up(slot)`, `down(slot)`. All three ways dispatch the same actions
and all are always available (no mode to switch on):
1. DRAG (mouse): pointer events with `pointerType === 'mouse'` only. Never the only way.
2. TAP, TAP (touch and click): tap a chip to hold it. A bar pinned to the bottom of the column, above Submit, shows
   "Placing: <chip>" and the remaining chips; free slots show a dashed outline. Tap a slot to place. Tap the held
   chip or empty space to cancel. Scrolling never places (a tap that moved more than 10 px is ignored). Tapping a
   filled slot with a chip held swaps, and the displaced chip returns to the pool. Tapping a filled slot with nothing
   held offers Clear and Move.
3. SELECT (keyboard and screen reader): every slot contains a native `<select>` named by its row ("Row 3,
   <description>: choose a term", "Step 4 of 6", "Lobby, slot 2 of 2"), with an empty "Clear" choice. In a `once`
   item a chip used elsewhere is listed as "<chip> (used in row 2)"; choosing it moves it and announces "moved from
   row 2 to row 4". Delete or Backspace on a slot clears it. `order` adds "Move up" and "Move down" buttons per
   placed step, announcing "<step>, now 3 of 6".
- A text line always says what is left and the rule: "3 of 7 terms left. Not all will be used."
- Submit with empty slots asks once: "2 slots are empty. Submit anyway?" and focus returns to the first empty slot.
- After grading: the score first ("4 of 5 correct"), then each row with a mark and a word, the learner's choice, the
  correct answer under a wrong row and its one-line why, then the objective and lesson link. Partly right is worded
  as progress ("4 of 5. One to fix.").
- Kind 8 on a phone: each given rule is a stacked card with labels; each flow has two buttons, Allowed and Blocked,
  44 px tall and 12 px apart. Kind 7: each rule is a stacked card of labelled native selects and a port field
  (`inputMode="numeric"`, digits only, 1 to 65535, the error in words beside it); "Show network" opens the network as
  a layer and returns to the same rule. The network is always also a text list (zones, hosts, addresses).
- The how-to: before the first item of each kind a short card (place, move, clear, submit; drag or tap, tap), stored
  in `xq-state-<mode>.howto`, reopenable from a "?" button on every task item.

#### D6.5 Where they appear
- Task practice: a card on each island page (`CareerMap.jsx`), listing that island's task items by kind with the
  best score. Nothing at stake. Before the first region boss the Continue card points to it once.
- Fights: 1 item in a region boss, 2 in a raid or the final raid, placed after question 2 and near the middle, only
  kinds the learner has met in Task practice or one new kind (free, D4.5), only objectives of that fight, only when
  the setting is on. A region boss task uses chips whose `item` is in that region's or an earlier lesson.
- The mock exam: about 5 at the start (D7.2).
- A kind that cannot be shown well at the current width (kind 2 or 7 below 360 px of usable width) is not offered
  there; the mock exam replaces it with a choice question and says "1 task item was left out on this screen".
- Sources: bank task files per objective (`t-<obj>.json`, made in Phase B with the same four passes plus the blind
  solve as `fits`). Kind 8 is also built at run time by code. Live AI authoring of kinds 1, 3, 4 and 6 for an
  objective without bank tasks follows the `gaps` setting and the Study PBQ pipeline's order (write, compile, blind
  solve, one rewrite, drop).

### D7. The mock exam and the short sets (Step 3)
Files: `exam/mockExam.js` (pure: compose, score, breakdown, next steps), `exam/examClock.js` (pure),
`exam/ExamStart.jsx`, `exam/ExamRun.jsx`, `exam/ExamResult.jsx`, `exam/ExamReview.jsx`, `exam/ExamHistory.jsx`.
Opened from an "Exam practice" card in the course map's header (one tap to the card, one to Start: no island needs
to be cleared). `LegendsScreen` gets a view `exam` with `useNavEntry('legends.exam', ...)`.

#### D7.1 The start screen (nothing starts before Confirm)
It states, from real values: the question count and time; the domain split (table: domain, weight, questions); the
task item count and the task on or off switch; the time choice (standard, 1.5x, 2x, no timer; remembered per
device, `ebiki-exam-time`); the pause rule in one sentence ("The clock runs only while a question is on screen. It
pauses when you leave or when the app is loading."); "Resumes on this device only"; "A mock exam changes nothing on
your map and records no reviews in your deck"; where the questions come from: "From the built-in question bank: no
AI, ready at once" or "37 questions must be written with your AI key: about 14 calls, about 2 minutes"; and the
honesty line (D10). A learner with under 20% of the course's lessons done sees a warning and "Practice an island
instead" first; the exam can still be started. If 90 items cannot be assembled it says which domains are missing,
offers the largest set it can make (labelled as a short set) and records nothing.

#### D7.2 Composition (`composeExam`)
- Size 90: 5 task items + 85 choice questions; with tasks off, 90 choice questions. Domain counts by the largest
  remainder method on the package's `weight` values (12, 22, 18, 28, 20): 11, 20, 16, 25, 18. A task item counts
  toward its domain. Inside a domain, objectives get shares by their card counts, every objective at least 1 when
  the domain's count allows. The result screen shows the actual counts.
- Kind targets over the choice questions: about 15% definition, 10% artifact, 8% select-N, the rest scenarios;
  negative stems at most 4. One question per card. Task items come first, then the rest in random order.
- No slot that an earlier attempt of this learner used (`xq-exams` keeps each attempt's qids) while an unused slot
  exists; the pick state is updated at start.
- `revealsAnother(a, b)`: a question's key term (4 or more letters) must not appear in the stem, artifact or why
  lines visible during the exam of another question of the same objective; a clash replaces the later one. The
  `stemSkeleton` check also runs across the 90.
- `balancedOrder` deals the letters; a test checks one composed exam for letter spread and the longest-option share.
- Short sets: 20 or 30 questions, the same weighting, one minute per question, labelled "Short set" everywhere and
  kept out of the full-exam trend. Focused sets: one domain; the weakest objectives over all attempts (a retest);
  task items only (kind selectable, untimed by default).

#### D7.3 The runner (`ExamRun.jsx`)
- One bar, one row, at most 56 px: time left (hideable; "Timer hidden" announced), "Question 37 of 90", Flag (a
  toggle button), Grid. A quiet "behind pace" text appears in the bar, never a pop-up.
- Nothing game-like and no feedback: no verdict, explanation, hint, Learn it, hearts, taunt, animation or Help answer
  until the exam is submitted. Help gets a `quiz` entry that says a timed exam is running (the existing `secret`
  redaction applies), so it will not discuss the questions.
- Free movement: Previous, Skip and Next at the bottom; any answer can be changed until Submit. Picking by key or
  tap never moves on by itself.
- Strike-out: a separate labelled toggle at the right of each option ("Strike out B"), 44 px, also the X key on the
  focused option. A struck option shows a line through and the words "struck out", can still be chosen, and is
  saved with the attempt.
- Select-N shows "1 of 2 chosen" and counts as answered only with exactly N chosen.
- The grid: all numbers in a vertical-scrolling grid of 40 px cells, each with a mark for answered, unanswered,
  flagged and current (shape and text, not color alone), a text summary with counts, and filter buttons
  ("Unanswered (12)", "Flagged (3)"). One Tab stop, arrow keys move, Enter opens; Back returns to the same cell.
  It is a layer (`useNavLayer`).
- Submit asks once and names the counts ("12 unanswered, 3 flagged"). Leaving (the exit button, Back, Esc, a mode
  switch) asks once: "Your answers are saved on this device. You can resume later, or end the exam now."

#### D7.4 The clock (`examClock.js`, pure; the caller passes `now`)
`{ budgetMs, usedMs, runningSince, pauses, awayMs }`. Time is added only from `performance.now()` deltas while the
question view is mounted, the page is visible and nothing is loading (`tick(clock, now)`); the wall clock is never
used for the budget, so changing the system clock neither adds nor removes time. It stops on `platform.onPageHide`,
on a hidden tab, while a question or file loads and in any "could not load" state. `usedMs` is saved with every
answer and every 5 seconds; after a crash at most 5 seconds are lost, in the learner's favor. Warnings at half time
and at 30, 10, 5 and 1 minute: visible text in the bar plus a polite announcement, never a focus change; "Time left"
on demand from a named button. At zero: "Time is up" is announced, what was answered is graded, unanswered
questions are counted as wrong and listed as unanswered, focus lands on the result heading. An exam never submits
while hidden: time cannot run out there. The result states the time mode and how often and how long it was paused.

#### D7.5 Resume
The running attempt is saved on THIS DEVICE only: `platform.kv` key `ebiki-exam-run-<modeId>`, written on every
answer, flag, strike and move (and flushed on page hide): `{ v, id, course, modeId, kind, opts, items: [the full
questions and tasks, in order, with their option orders], answers, struck, flags, at, clock }`. Full questions are
stored (about 120 KB), so a resume needs no network, no bank file and no AI call, and a bank update cannot change a
running exam. If the write fails the start screen says the exam cannot be resumed after closing. On opening Exam
practice with a saved run: "Resume (37 of 90 answered, 51 minutes left)" or "Discard"; an unfinished run is never in
the history. Because the run is device-local, one sitting can never be finished on two computers, and a data folder
switch or a dropped share cannot move it into another folder. Rotation, backgrounding and a reload restore the same
question, picks, strikes, board and scroll position from this record.

#### D7.6 The result (`ExamResult.jsx`)
One phone screen without scrolling: the score ("68 of 90, 76%"), time used and mode, and three separate counts:
wrong, unanswered at time up, flagged. Then, scrolling:
- Per domain, weakest first, a stacked list (no chart): "Domain 4, Security Operations (28% of the exam): 18 of 25,
  72%". A domain opens to its objectives: number, title, asked, right. An objective with fewer than 3 questions
  says "too few questions to judge" and shows no percentage.
- Task items on their own line: rows right of rows, per item.
- "Acronyms behind your misses": the acronyms in the options of missed questions, each with its tier and a link to
  its set.
- Plain words tied to the number, from the app's own three bands (under 60%, 60 to 79%, 80% and over), always
  followed by "This is a practice estimate from Ebiki's own questions. It does not predict a real exam score." No
  pass line, no scaled score, never "you will pass" or "you are ready".
- At most three next steps, each a working link, from `nextSteps(result, map)`: the weakest objective's first
  unfinished lesson; "Retest your weak objectives" (fresh questions; its result shows per objective whether it
  improved); the core acronym set behind the most misses.
- "Add the cards behind your misses to your deck (14 cards)": one action that states the count first, through
  `addItemsToDeck`, which already links cards that exist.

#### D7.7 Review (`ExamReview.jsx`)
Every question with the learner's answer, the right answer and the full explanation block (D2.5); filters: missed,
flagged, unanswered, one domain. From a question: the lesson link (a layer; Back returns to the same question),
Learn it, Add to deck, Report (D2.6: the score is recomputed at once).

#### D7.8 History, trend, rewards, and what an exam does not touch
- `xq-exams-<mode>.json`: `{ "v": 1, "attempts": { "<id>": { kind, at, timeMode, usedMs, pauses, total, right,
  unanswered, flagged, reported, byDomain: { "1.0": { asked, right } }, byObj: { "1.1": { asked, right } },
  tasks: { rows, right }, qids: ["..."], machine } } }`: an object keyed by attempt id (`<time in base 36>-<4 random
  characters>`), so two computers that each finish an exam merge to both attempts, each once. Details for review are
  in `xq-exam-<mode>-<id>.json` (the newest 10 kept). `saveAttempt` re-reads before writing and is idempotent by id.
  If the save fails (share down, folder switching) the finished result stays in `platform.kv` as pending, the learner
  is told "Saved on this device. It will be added to your history when your data folder is reachable", and it is
  written on the next open.
- History screen: date, kind, score, time, per domain; a per-domain trend against the previous full exam as text
  ("Domain 2: 70%, up 8"). Short and focused sets are listed and labelled, and are not in the full-exam trend.
- A mock exam or set changes no star, unlock, boss win or item tally, and records no review in the learner's deck.
  The start screen says so.
- Reward: a flat `PRACTICE_DONE` with source `legends-mock` (the same XP whatever the score or the time, at most
  once a day), so nothing rewards rushing.

### D8. Saved data and migration
#### D8.1 Old saved lesson and checkpoint sets: kept, not converted, never mixed
Decision: KEEP every old `step-<hash>.json` file exactly as it is, and never read it into an exam-format quiz.
- A course step first tries the exam format (D3.5). If it can be built, the old saved set is simply not used. It is
  not deleted, so the older app on another computer still plays it, and nothing is lost if writing a live question
  fails.
- If the exam format cannot be built for that step (no bank yet, no key or live writing off), the old saved set
  loads and plays exactly as it did, whole, with the "Classic questions" label. `quizsave.test.js` gets a case with
  a real old-shape set (typed questions with `alt`, `ladder`, `checked`) proving it still opens.
- A quiz is therefore all one format, always. An old boss `history` file is still read (it only feeds the live
  writer's avoid list) and never rewritten.
- The first time a step that has an old saved set is played in the new format, a one-line note says: "This step now
  uses exam-style questions. Your progress is unchanged."
- "New questions" on a lesson: asks first when answers exist; for an exam-format quiz it only re-plans (other
  slots); it calls `clearStep` only for a classic quiz, as today. Stars and tallies are left alone.
- No bulk refresh exists and nothing runs in the background: opening the course makes no AI call and writes no file.

#### D8.2 Progress
The map file's shape does not change: no new field, node kind or version. Stars, cleared steps, unlocks, helpers,
bonus lives, nemesis lists, tallies and tiers are read and written by the same functions (`applyNodeResult`,
`tallyItems`). Replaying a finished lesson can raise stars and never lowers them (already `Math.max`). The mock
exam and Task practice are NOT map nodes. A `career.test.js` case snapshots a mid-course map, runs it through
`shapeMap` and one exam-format lesson result, and compares everything except that lesson's own counters.

#### D8.3 New files (all under `features/legends/` in the data folder; none is read by an older build)

| Key | Holds | Shape rule |
|---|---|---|
| `xq-state-<mode>` | `{ v, notice: { examFormat }, met: {}, hints: {}, howto: {} }` | objects only; written only on a learner action |
| `xq-pick-<mode>-d<n>` | picker state per domain (D3.4) | object keyed by card |
| `xq-live-<mode>-<obj>` | saved live questions (D5.5) | object keyed by card, then slot |
| `xq-report-<mode>` | reported questions (D2.6) | object keyed by question id |
| `xq-tasks-<mode>` | Task practice bests | object keyed by task id |
| `xq-exams-<mode>` | exam summaries (D7.8) | object keyed by attempt id |
| `xq-exam-<mode>-<id>` | one attempt's detail | written once, never edited |

Every file carries `v`. A reader that meets a higher `v` treats the file as unreadable (never as empty), so it is
never written over, the same rule `shapeMap` follows. Every writer: mode id pinned at task start, re-read before
write, no write after a failed read, no write while `isDataSwitching()`, serialized per key.

#### D8.4 The older app on the same folder
It never reads an `xq-*` key or the bank, so it cannot crash on them, and the feature-data store has no sweep, so it
cannot delete them. It keeps playing its own step files, which the new build never rewrites. Map progress flows
both ways because the map shape is unchanged. No "update Ebiki" message is needed.

#### D8.5 Offline and two computers
All new files are objects keyed by stable ids, so `deepMergeJson(theirs, mine, base)` merges entry by entry: two
exam attempts become two entries; pick state and reports union; a detail file exists on one side only and is
fast-forwarded. A test feeds real shapes through `deepMergeJson` and through the join merge (no base). Bank files
are part of the app, not the data folder, so they work with the share down. The one-time notice is dismissed in
`xq-state` (shared), so it does not show again on the second computer.

#### D8.6 The one-time notice (first open of a course after the update)
A dismissable card on the course map (not a dialog), shown while `xq-state.notice.examFormat` is unset: questions
are now exam style with options; progress is kept; finished lessons get exam-style questions when replayed; whether
that uses the AI key for this course right now ("No AI is used for domains 1 and 2: their questions are built in.
Other domains use your AI key until their questions arrive. You can turn that off in Settings."); boss hearts and
health now count answers (the numbers); where the task item switch is; question reuse (a Study setting) does not
apply to course lessons; typed recall stays in Study for cards added to the deck, and raids and practice outside
the course are unchanged. Showing it writes nothing; dismissing it writes `xq-state`.

### D9. Accessibility and phone: decisions that shape the components
- LAYOUT: one scrolling column (the screen's own scroller), no nested vertical scroll. The answer bar (Check,
  Continue, Submit, Previous, Skip, Next) is `position: sticky; bottom: 0` inside that column with
  `padding-bottom: env(safe-area-inset-bottom)`: never `position: fixed` (the body zoom), so it sits above the phone
  bottom bar, the home indicator, toasts and a docked Help. Side padding at least 16 px plus the safe insets.
- OPTION TILES: full width, at least 48 px tall, 8 px apart, text wraps without clipping, the letter stays on the
  first line; the whole tile is the label of a native input. A tap that ends a scroll (moved over 10 px) is ignored.
  Chosen = tint + check mark + thicker border. Right, wrong, struck, flagged, current: always a mark and a word.
- ARTIFACTS: a labelled block (`role="group"`, `aria-label` "Log entry", "Firewall rule", "Command output" ...,
  `tabIndex=0`) of real, selectable monospace text, at least 12 px. Each source line is its own block with a line
  number in a gutter and wraps inside the box (`overflow-wrap: anywhere`), so a wrapped line is recognisable by its
  missing number, there is NO sideways scroll anywhere, and the deciding part can never hide off screen. In the
  explanation the `mark` lines get a border and the word "key line".
- STEM: bullets are a real `<ul>`. The key word is `<strong>` with a visually hidden "(key word)" after it, so it
  survives a reader that does not voice capitals.
- BOSS HEADER ON A PHONE: the arena's existing slim pin mode; the drives measure that art, health and hearts take
  at most 35% of the height in portrait and 25% in landscape, and that the first stem line is visible at 360 x 640.
- KEYS: 1 to 7 and A to G pick (toggle for select-N), Space toggles the focused option, Enter checks or continues,
  arrows move inside the group (native). In the mock exam also F flag, X strike the focused option, G grid; every
  one of these is also a visible named button, and a "?" button lists the shortcuts. No shortcut fires while focus
  is in an input, textarea, select or contenteditable, while a dialog or layer is open (`data-app-dialog`,
  `data-top-overlay`), during IME composition, or while voice typing listens (the existing QuizRunner guards plus a
  check of the voice layer).
- FOCUS: a new question moves focus to its heading ("Question 14 of 90", `tabIndex=-1`), then the reading order is
  stem, artifact, options. After grading, focus moves to the verdict, announced once; Continue is the next Tab stop.
  A question that is replaced or still loading announces "Loading question" then "Question ready", and keys are
  ignored until it is ready. Closing a layer or dialog returns focus to the control that opened it.
- ANNOUNCEMENTS: one polite live region per runner for counts ("2 of 2 chosen"), moves ("moved from row 2 to row
  4"), timer set points and results; `role="alert"` for errors, with a focusable Retry.
- MOTION: nothing in the exam components animates position; under reduced motion, focus mode or Still bosses chips
  move at once and results simply appear.
- CONTRAST AND ZOOM: only tokens (`C.*`, `*Fill` under white text); new states are added to `contrast.test.js`.
  Every screen is driven at 360, 390 and 430 px portrait, 740 x 360 and 932 x 430 landscape, app zoom 100% and 200%,
  both themes, with `scrollWidth === clientWidth` asserted on the page.
- BACK: a fight, a task item and a running exam use `useNavEntry` guards that ASK (never leave silently); the
  grid, the lesson peek, "Show network" and pickers are layers, so Back closes only them.

### D10. i18n and honesty text
All UI text goes through `t()` in `src/i18n/locales/{en,es,zh,ja}.js`, no em dashes. Question text (stems, options,
explanations, task content) is course content in English; when the app language is not English a one-time line
says so ("Course questions are in English, like the exam."). New key families (prefix `lgx_`):
- `lgx_pick*` (Pick 2, both must be right, 1 of 2 chosen, choose 1 more, clear one first)
- `lgx_exp*` (the answer, close, why the others are wrong, not covered yet, where it lives, open lesson, key line)
- `lgx_art_*` (artifact labels), `lgx_word*` (key word), `lgx_spell*` (spell out)
- `lgx_report*`, `lgx_classic*`, `lgx_notReady*`, `lgx_live*` (setting names and hints), `lgx_notice*`
- `lgx_fight*` (course fight intro numbers, new kind no heart, task damage line, review these then try again)
- `lgx_task*` (titles per kind, placing, terms left, not all used, used in row, moved, cleared, slots empty, how-to
  per kind, score, row right or wrong, left out on this screen), `lgx_fw*` (rule table headers, allowed, blocked,
  implied deny, show network, port range error)
- `lgx_exam*` (start screen lines, time modes, pause rule, bar, flag, strike out, grid, filters, submit and leave
  dialogs, time warnings, time is up, resume, discard, pending save), `lgx_res*` (result, bands, estimate line,
  too few to judge, next steps, add cards), `lgx_hist*`
- `nav_leaveExam`, `aiJob_legends_exam`, `aiJob_legends_examCheck` and their hints
Counted strings get singular and plural keys; template families go into `src/i18n/templateKeys.test.js`.

Honesty rules, written into the keys and checked by a test that scans the four locales for banned phrases:
- Always "exam-style practice questions written by Ebiki from this course's own cards". Never "real exam
  questions", "from the exam", "official", "you will pass", "you are ready", "passing score".
- The course start, the first quiz, the mock exam start and every result carry the estimate line; the course's
  existing trademark line (`noticeKey`) stays on its screens.
- Help and Chat: a Help entry (`useHelpEntry`) and a learner-context source for a course mode state that Ebiki
  writes its own practice questions and has no real exam questions; asked for real ones, Ebi says so.

### D11. Test plan and proof plan
1. UNIT TESTS (vitest, pure modules): `examQuestion` (shape, grade, select-N, mapping, `balancedOrder` spread over
   2,000 runs), `examChecks` (every check with a passing and a failing invented case), `bank` (picker: no repeat in
   a cycle, last-3 rule, one per card, gates), `courseQuiz` (lesson composition, taught set, format gates, fallback
   order, never mixed), `courseFight` (the simulation of D4.7, `free`, task mapping, report refund cap),
   `acronymQuiz`, `examGen` (prompt holds the rules and no course term in examples; parsers through
   `aiReplyVariants.test.js`), `examStore` (re-read before write, pinned mode, blocked while switching, higher `v`
   is unreadable, merges), `taskEngine` (compile, grade, `countSolutions`, reducer), `firewall` (evaluator, builder
   guarantees, rule grading, port table), `mockExam` (weights within one, kinds, no earlier slot, `revealsAnother`),
   `examClock` (pause, resume, clock change, time up), history merge. Plus `features.test.js`, the platform-neutral
   scan, `i18n-coverage`, `locales`, `contrast`, `teachingStyle`, `aiJobs`.
2. BUILD: `node dev/careers/build-bank.mjs security-plus-sy0-701` prints `no problems` on the pilot objective.
3. IN-APP DRIVES (Playwright's bundled Chromium, port 3001, muted, AI hosts stubbed, `/api/feature-data` in
   memory): a first lesson (definitions first, explanation, lesson link and back, report); a lesson with select-N
   and an artifact; an old-layout course with an old saved checkpoint set (loads, labelled, passed state kept); a
   region boss won and lost (hearts, attack, free question, review-then-retry); a raid; no key and no bank (the
   plain screen, nothing lost); each task kind by tap and by keyboard only; the mock exam: start, flag, strike,
   grid, reload and resume, hide for a while (clock rule), time up, result, review, retest, history; all at the
   widths, zooms and themes of D9, every screenshot looked at, greyscale copies for the state marks.
4. OWNER-SETUP PROOF (at most 150 model calls in total, counted from `logs/token-usage.json` before and after): the
   owner's provider and models, a real mid-course save copied to a scratch data folder. Played: one lesson and one
   checkpoint or region boss from the bank (0 calls expected), one region boss on a domain with no bank (live), one
   short set of 20 with live questions. Recorded in the judge table: calls and tokens per boss attempt and per
   exam, the wait to the first question, and a before and after snapshot diff of the map file.
5. JUDGES AND SAMPLES: an independent judge that gets ONLY the style guide rates 40 questions (20 live, 20 pilot
   bank; boss level) rule by rule, pass rate per rule recorded honestly. An accuracy checker that did not write the
   questions fact checks the same 40 against cards and chapters; the error rate is recorded. A 30-question sample
   (stems and options only) is written to `docs/reviews/exam-sample-<date>.jsonl` by NEW
   `dev/careers/sample-questions.mjs` and sent to oversight for the copying check; repeated after any prompt change.
6. INDEPENDENT REVIEW of the diff and screenshots against this design and the six lists, item by item, before each
   step is called done (the project's triple check).

### D12. Open questions for the owner (each with the default that will be built)
1. Boss numbers. With options on every question, a right answer deals 1 and a region boss needs 9 right of 15 with
   7 hearts (today 11 health and 5 hearts, where a typed clean answer deals 2). Default: the numbers of D4.3, tuned
   by the simulation. The alternative keeps 11 and 5 and lets a right answer deal 2, so a fight can end after 5
   questions.
2. A new card twice in its lesson. The bank rule says one quiz never holds two questions of one card. Default:
   bosses, checkpoints and exams follow it strictly; a LESSON asks each new card twice (a definition, later a
   scenario), because a lesson of 1 to 4 cards would otherwise be a quiz of 1 to 4 questions.
3. Before a domain's bank ships. Default: `gaps` (AI writes exam-style questions for that domain when a key works,
   said in the notice). The alternative is `off` by default, which leaves those domains on classic questions.
4. Briefing cards. 33 of the 855 cards are briefings that are never quizzed. Default: the bank covers the 822
   others (8,220 questions).
5. Size in git. The bank adds about 10 MB to the repository and the install, and `docs/reviews/bank-*.jsonl` about
   as much again. Default: both in git, as the plan says.
6. Mock exam time. Default: 90 minutes for 90 questions, one minute a question for short sets, the clock pausing
   whenever the exam is not on screen, no strict mode.

### Conflicts decided
1. Language hint rules against a course: a course is a general subject. No prefix hint, no choice pool, no ladder
   chip, no typed default on course questions. Other modes keep all of them.
2. B22 (spell out acronyms in lessons) against the exam format (acronyms unexpanded): spelled out on request in
   LESSONS only, marked as an aided answer; bosses and the mock exam never. The owner's goal is the exam format where
   it counts, and the acronym track exists for learning them.
3. B24 and B25 (typed recall) against "the options replace blind typing" (scope 1): course quizzes are choice
   questions. A safe "type it first" lesson option is deferred to Step 3: a typed exact match (the key term, its
   acronym or its expansion) is right; anything else is NOT a miss, the options simply appear. No AI judge, so no
   right answer can be marked wrong.
4. B32 (a first-time format costs no heart) against plain fight rules: built (D4.5), one per fight, said on screen.
5. R20 (same hearts and pass mark) against W28 and B33 (winnable at 65% when every answer is a choice): the question
   counts stay, hearts and health change, said in the notice and on the intro. Open question 1.
6. The bank rule "one per card per quiz" against lessons of 1 to 4 cards and B20: see open question 2.
7. R11 (one saved set, reused) against the bank's "another one next time": bank questions rotate at no cost; live
   questions are written once per card, saved and rotated the same way. No visit pays twice.
8. W22 and B16 (an explanation after every answer) against E24 (no feedback in the mock exam): by surface.
   Lessons, checkpoints and fights always explain; the mock exam explains only in review.
9. W10 (a dispute judged) against "works with no key": a report is upheld by rule, with a cap of 2 refunds a fight.
10. W37 and R30 (say the AI cost before a mock exam) against the bank (no cost): the start screen states whichever
    is true for this attempt.
11. K31 (an optional strict timer): declined. One clock rule is easier to state and to trust.
12. Scope 4's first task batch (1, 2, 3, 6, 8) against this build order (1, 3, 4, 6, 8): kind 2 needs zone pictures
    (art with its own QA) and moves to Step 4; kind 4 is kind 1's simplest case and comes for free.
13. E38 (report during the exam) against E24: Report is offered in review; during the exam the learner flags.

### Requirement coverage
Every id of the six lists, read down each pair of columns (W, E, B, R, P, K in order). "D" numbers are sections above; "S2", "S3", "S4" = ships with that step.

| Ids | Met by | Ids | Met by | Ids | Met by |
|---|---|---|---|---|---|
| W1 | D3.2 gates + plan B4 passes; D5.3 blind solve | E17 | D7 intro (S3) | R16 | D8.1 |
| W2 | D2.1 `detail`, D2.5, D3.2 | E18, E19, E20, E21 | D7.1, D7.2, D7.4 (S3) | R17 | D8.1 |
| W3 | D2.1 `source`, D5.2 item 4, plan B4 pass 4 | E22, E23, E24, E25, E26, E27 | D7.3 (S3) | R18 | D8.1 (history read), D3.3 |
| W4 | D5.3 `fact`, plan B4 pass 1 | E28 | D7.4 (S3) | R19 | nothing of a running quiz or fight is persisted today (NodeRun keeps it in memory), so nothing can resume broken; no change |
| W5 | D2.1, D3.2 (`ok` count equals `pick`) | E29, E30 | D7.3, D2.3 (S3) | R20 | D4.6, D4.3 (hearts and health change, said in D8.6; conflict 5) |
| W6, W7 | D5.3, D5.4 | E31, E32 | D7.3, D7.5 (S3) | R21, R22, R23, R24 | D8.4 |
| W8 | D2.1 (why travels with its option), D2.4 | E33, E34, E35 | D7.2 (S3) | R25, R26 | D8.5, D7.8 |
| W9 | D2.1, D2.5, D3.2 | E36, E37 | D7.8, D7.2 (S3) | R27, R28, R29 | D7.5, D7.8 |
| W10 | D2.6 | E38 | D2.6, D7.7 (S3) | R30, R31 | D7.1, D7.8 |
| W11 | D3.2 length tell, D5.3 | E39 | D7.2 test, D2.4 | R32 | D4.6 |
| W12 | D2.4 | E40 | D2.5 | R33, R34 | D8.6 |
| W13, W14, W15 | D3.2 (parallel options, stem leak, artifact), D5.3 | E41 | D2.1 text rules, D3.2, D4.1 (spell out is lessons only) | P1, P2 | D9 layout |
| W16 | D4.3, D7.2 `revealsAnother` | E42, E43 | D7.8 (S3) | P3, P4 | D9 boss header, layout |
| W17 | D3.2 acronyms | E44 | D9, D6.5 (S3) | P5, P6, P7, P8 | D9 option tiles, layout; D2.3 |
| W18, W19, W20 | D4.1, D3.2 lesson ready | B1, B2, B3, B4 | D4.1 | P9, P10 | D9 artifacts (no sideways scroll exists) |
| W21 | D2.1, D3.2 | B5 | D3.2 lesson ready | P11 | D6.4 (rules as stacked cards) (S2) |
| W22 | D2.5 | B6, B7 | D4.1, D3.2 lesson ready | P12, P13, P14 | D2.3, D9 |
| W23, W24, W25 | D2.3, D4.4 | B8 | D4.1 first-time helps | P15, P16 | D2.5, D9 layout |
| W26 | D4.4, D6.4 (S2) | B9, B10 | D2.3, D2.5 | P17 | D2.5 layer; D7.7 (S3) |
| W27 | D6.3 (S2) | B11, B12, B13 | D4.1 gates, D2.1 (`NOT` in capitals; D2.5 restates the ask) | P18, P19, P20, P21, P22, P23, P24 | D6.4 (S2) |
| W28 | D4.3, D4.7 | B14, B15 | D2.1 artifact, D2.5, D4.1 | P25 | D6.2 kinds 2 and 5, D6.5 (S4) |
| W29 | D3.2 duplicates, D3.3, D7.2 | B16, B17, B18, B19 | D2.5 | P26, P27 | D6.4 (S2) |
| W30 | D3.3, D3.4 | B20 | D4.1 (`retryQuestion`) | P28, P29, P30 | D6.4 kind 7 (S4) |
| W31 | D7.2 (S3) | B21 | D4.1 ("Not covered yet") | P31 | D6.4 kind 8 (S2) |
| W32 | D8.1 | B22 | D4.1 (lessons only; conflict 2) | P32, P33, P34, P35 | D7.3 (S3) |
| W33 | D8.2 | B23 | D4.1 | P36 | D7.6 (S3) |
| W34, W35, W36 | D3.5, D5.4 | B24, B25 | deferred to step 3 ("type it first", conflict 3): Step 1 must first fix the choice format; the safe design needs the acronym aliases wired | P37, P38 | D7.5 (exam, S3); a fight keeps its state in memory through rotation and backgrounding as today, and a page the system killed restarts the fight from its intro (not persisted: declined, a fight is 15 to 30 questions and costs nothing to restart) |
| W37 | D7.1 (S3) | B26, B27, B28, B29, B30 | D6.4, D6.5 (S2) | P39 | D7.1, D7.4 (S3) |
| W38 | D11.4 (measured, recorded in the judge table); D3.3 (an abandoned exam is not written again) | B31 | D6.5 (S2) | P40 | D7.5 (S3); grading is by code everywhere (D2.3, D6.3) |
| W39 | D7.4 (S3) | B32 | D4.5 | P41 | D7.1, D7.4, D5.4 (the first question is shown as soon as its batch is checked) |
| W40 | D7.3, D7.5 (S3) | B33 | D4.3, D4.7 | P42, P43 | D9 contrast and zoom |
| W41, W42, W43 | D7.4 (S3) | B34 | D4.6 | P44 | D9 back |
| W44 | D7.3, D9 keys (S3) | B35 | D10, D8.6 | K1, K2, K6, K7 | D9 keys |
| W45 | D7.8 (S3) | B36 | D4.1, D4.6 | K3, K4, K5 | D2.3, D9 announcements |
| W46 | D9 artifacts | B37 | D2.6, D5.3 | K8, K9, K10, K11, K12 | D9 focus, D2.5 |
| W47 | D3.2 artifacts, D6.3 | B38 | D7.1; no timer in lessons or fights (D4.1) | K13, K14, K15 | D9 artifacts, stem |
| W48 | D6.4 (S2, S4) | R1, R2, R5, R6 | D8.2, D4.6 | K16, K17, K18, K19, K20 | D6.4 (S2) |
| W49 | D10 | R3, R12 | D8.1 (no call, no write on open) | K21 | D6.4 kind 7 (S4) |
| W50, W51, W52 | D10, D7.6 | R4 | D8.2 (nothing outside `features/legends/xq-*` is written; the deck is never touched) | K22 | D6.4 kind 8, D6.2 (S2) |
| W53, W56 | D11.5 | R7, R8 | D8.6 | K23, K24 | D6.4 (S2) |
| W54 | D5.2 item 7, D11.1 | R9 | D3.5, D5.4 | K25, K26, K27, K28 | D9 |
| W55 | D10 | R10, R11 | D8.1, D3.5, D5.5 | K29, K30, K32 | D7.4, D7.3 (S3) |
| E1, E2, E3, E4, E5, E6, E7, E8 | D7.6 (S3) | R13 | declined: no bulk refresh action exists (D8.1), so nothing can be spent in bulk | K31 | D7.1, D7.4 (extended time, no timer, pause and resume); the strict mode is declined (conflict 11) |
| E9, E10, E11, E12 | D7.7, D2.5 (S3) | R14 | D5.4, D8.1 (the old set is never deleted) | K33, K34 | D7.3, D9 back (S3) |
| E13, E14, E15, E16 | D7.6 (S3) | R15 | D8.2 |  |  |

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
