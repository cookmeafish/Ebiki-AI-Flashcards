# Question bank 1.3, review A: pass 1 (accuracy, CONTESTED) and pass 3 (clarity and format), cards 1 to 11

Reviewer: an agent that did not write or earlier review these questions. Date: 2026-11-17. File
`dev/careers/sources/security-plus-sy0-701/bank/1-3.json`, the first 11 cards (i1-3-18150c04 to i1-3-e75812c9, 110
questions), read against all 210 questions of 1.3 and the 120 of `bank/1-1.json` and 360 of `bank/1-2.json` for shared
scenes. No question was edited (a writer applies the fixes); the question file had no change from reading to stamping.
Related: [plan](../plans/2026-11-16-exam-format-questions.md) (B3, B4 with CONTESTED, D2.1, C1 to C23),
[1.2 round 2](bank-1-2-round2.md), [round 3](bank-1-2-round3.md), [round 4](bank-1-2-round4.md),
[1.2 pass 4](bank-1-2-pass4.md).

## Sources read
- The 1.3 cards in `public/careers/security-plus-sy0-701.json` and the 1.3 lesson order (areas[0].lessons: lesson 0 =
  18150c04, 33e7c006, 73536b57; 1 = d1b328e1, abc0c1a4, d3624c41; 2 = f9c862ac, 8e31ede5, 388470f9; 3 = ba3703a5,
  e75812c9, 32194154, 14ab29d1; later lessons for the rest).
- The chapter `public/careers/security-plus-sy0-701/knowledge/d1.md`, section 1.3 (Change management process,
  Approval, Ownership, Stakeholders, Impact analysis, Test results, Backout plan, Maintenance window, SOP, change steps
  compared, Allow lists and deny lists, Restricted activities, Downtime).
- NIST SP 800-128 (https://doi.org/10.6028/NIST.SP.800-128): §2.3.8 configuration change control (emergency/unscheduled
  changes are within it); §2.3.9 security impact analysis ("preferably before they are approved and implemented" and,
  once implemented and tested, a further analysis "to determine if there are any unanticipated effects"); §3 change
  control procedure contents ("Criteria to determine the types of changes that are preapproved or exempt from
  configuration control", "Establishment of a group that approves changes", "test results" for the CCB, "Requirements
  for rollback of changes", "retroactive analysis, testing, and approval"; footnote 15 "Preapproved changes are still
  tested and documented prior to implementation"); "Unscheduled or Unauthorized Changes" ("Unscheduled changes are
  reviewed/resolved by the CCB as soon as is practical after unscheduled changes are made").
- NIST SP 800-53 Rev. 5 (https://doi.org/10.6028/NIST.SP.800-53r5): CM-3 a to g and discussion ("Configuration Control
  Boards or Change Advisory Boards that review and approve proposed changes"); CM-3(1)(d) prohibit changes until
  approvals are received; CM-3(2) test, validate and document changes before finalizing; CM-7(4) and CM-7(5) titles
  ("deny-by-exception", "allow-by-exception").
- Not read: ITIL publications (paid); no question was failed on an ITIL reading.

## Totals
| Result | Count |
|---|---|
| PASS on both passes (p1 and p3 stamped, each run twice) | 77 |
| FAIL | 33 |
| of which pass 1 (accuracy or CONTESTED) | 5 (33e7c006.1, 33e7c006.4, 33e7c006.7, 388470f9.5, ba3703a5.1) |
| of which pass 3 (clarity, format, shared scene) | 29 (388470f9.5 fails both) |
| dropped | 0 |

Build (`node dev/careers/build-bank.mjs security-plus-sy0-701 --preview --allow-short`): exit 0, no hard failure in
this part. Every C10 warning on these ids was read: each is a lure on a wrong option, none a key tell.

## Patterns, most serious first
1. **Absolute "every change needs approval"** (pass 1): why lines and explains of 33e7c006.1, .4, .7 say no change goes
   ahead without approval; SP 800-128 lets organizations define changes "preapproved or exempt from configuration
   control". The keys (emergency changes still approved, sometimes afterward) are right and supported by SP 800-128.
   388470f9.5 says pre-approval is safe "only because" of the SOP; SP 800-128 also requires testing. Worth a sweep of
   the other half of 1.3 for the same absolute.
2. **A second defensible answer** (ba3703a5.1): "They are checked after the change is live" is true per SP 800-128
   §2.3.9 and the chapter's post-change verification.
3. **Renamed scenes and artifact copies** (12): 18150c04.7 vs f9c862ac.3; 73536b57.8, abc0c1a4.8, 388470f9.8 (artifact
   forms of an identification another question already makes); d1b328e1.3 vs 14ab29d1.2; d1b328e1.7 vs .4; 8e31ede5.4
   vs .2 and 14ab29d1.8; ba3703a5.6 vs b51cf78e.3; abc0c1a4.3 vs .2; d3624c41.4 vs .2; 388470f9.6 vs 827980ed.4; and
   18150c04.9 repeating .1.
4. **Options naming a course card with item null** (5): 8e31ede5.3, 388470f9.3, e75812c9.2, .4, .7 (all data-only fixes;
   C16 still passes once set, checked against the lesson order). The build's C16 name check missed them because the
   option text carries an article or a modifier ("A backout plan", "A longer maintenance window") or names one half of
   a card ("Deny list").
5. **Stem states the answer** (4): 33e7c006.2, d3624c41.7, f9c862ac.3, 388470f9.5.
6. **Key odd one out by form** (6): 18150c04.0, 33e7c006.0, 388470f9.0, ba3703a5.0, f9c862ac.1, abc0c1a4.3.
7. Smaller: BEST without two honest readings (d3624c41.4); off-topic distractor (18150c04.2); grammar in shown why
   lines (73536b57.0, 388470f9.0); a word never set up (8e31ede5.6).

Noted, not failed: on card 388470f9 the key is the only acronym ("SOP") in .2, .4, .7, .8 and the key contains "SOP" in
7 of 10 questions while no wrong option does; the style guide keeps acronyms unexpanded and a quiz never shows two
questions of one card, so it was not failed, but a writer could spell the term out where C11 allows. 33e7c006.1 and .4
test the same emergency-approval fact (definition and scenario) with near-identical option sets; acceptable as two
forms, worth varying. "All steps but one were done; which was skipped" is the frame of 33e7c006.7, abc0c1a4.7,
ba3703a5.4 and others: different scenes, not failed.

## Per question (P1 = accuracy and CONTESTED, P3 = clarity and format)
| id | result | P1 | P3 | problem or note (source) | proposed fix |
|---|---|---|---|---|---|
| i1-3-18150c04.0 | FAIL | PASS | FAIL | Format: the key "Formal steps a change passes before release" is the only noun phrase among three gerund options (Tracking, Restarting, Searching), so it stands out by form. | Wording only: key "Taking each change through set steps before release" (why unchanged). |
| i1-3-18150c04.1 | PASS | PASS | PASS | Card key points (backout for every change; approval for urgent changes). Statements parallel. Overlaps .9 (see .9). | none |
| i1-3-18150c04.2 | FAIL | PASS | FAIL | Option B "Faster test machines for engineers" is an off-topic attribute (hardware), not a neighboring measure, the pattern failed in 1.2 (479731d1.6). | B "A test lab for trying changes", why "A test lab adds testing, but no review, no record and no way back." |
| i1-3-18150c04.3 | PASS | PASS | PASS | Steps before production are the card definition. B to D are other security activities, each failing the stem (nothing has happened, nothing lost, nothing scanned). | none |
| i1-3-18150c04.4 | PASS | PASS | PASS | Each bullet maps to one business step; version control, patch management and incident response each fail a named bullet. | none |
| i1-3-18150c04.5 | PASS | PASS | PASS | CAB is in this card's key points; SP 800-53 CM-3 discussion names Change Advisory Boards that review and approve. C10 lure on the SOC option only. | none |
| i1-3-18150c04.6 | PASS | PASS | PASS | Card definition lists impact analysis among the business steps; restarts, downtime, dependencies are technical implications (d1.md). | none |
| i1-3-18150c04.7 | FAIL | PASS | FAIL | Shared scene with f9c862ac.3: a change has every element (impact, tests, window or approval) except an undo plan and someone refuses to go ahead until it is added; both keys are the backout plan. The question also tests the backout card rather than its own. | Writer: another business-process fact, e.g. stem: each team at the recycling company handles changes its own way (one emails a manager, one posts in chat, one just makes the change); ask "Which of the following does a change management business process add?"; key "The same repeatable steps for every change"; wrong "A copy of every file version" (version control), "A list of programs allowed to run" (allow list), "A restart of each changed service" (service restart). |
| i1-3-18150c04.8 | PASS | PASS | PASS | Record shows no impact analysis, tests or approval: change management bypassed. Distinct from 33e7c006.7 (one step missing). | none |
| i1-3-18150c04.9 | FAIL | PASS | FAIL | Repeats .1: the same statements (way back for every change, urgent changes skipped/unrecorded, testing in production first, implementer) with one more key; a learner meets the same question twice. | Writer: keep the select-TWO but test other key points, e.g. keys "A change advisory board usually oversees it" and "Each change carries a way to undo it"; wrong "Only security changes go through it", "The owner always performs the work", "Approval follows the work for routine changes". |
| i1-3-33e7c006.0 | FAIL | PASS | FAIL | Format: key "Formal sign-off before the change is made" is the only noun phrase among three gerund options (Naming, Undoing, Running). | Wording only: key "Signing off the change before it is made". |
| i1-3-33e7c006.1 | FAIL | FAIL | PASS | Absolute contradicted by a primary source: B why "No change goes ahead without approval" and the explain "Every change needs approval": SP 800-128 §3 lets procedures define changes "preapproved or exempt from configuration control". The key itself (emergency change still approved, sometimes afterward) is right: SP 800-128 "Unscheduled changes are reviewed/resolved by the CCB as soon as is practical". | B why "An emergency change still needs approval, even when it comes after the work."; explain "An emergency change still needs approval. It may come after the work, but it is never simply skipped." |
| i1-3-33e7c006.2 | FAIL | PASS | FAIL | The stem states the answer: "a review group weighs its purpose, scope and risk and then signs it" and the key "Formal sign-off from the reviewers" restates it, so the question tests reading, not the card (the 2dbfd6d2.6 lesson). | Stem: "... The request is on hold until the change advisory board meets on Thursday."; key "Formal sign-off from the board"; detail "until the change advisory board meets"; whys A, B, C re-tied to the board meeting. |
| i1-3-33e7c006.3 | PASS | PASS | PASS | Owner (director) vs approver (board); options parallel gerunds. | none |
| i1-3-33e7c006.4 | FAIL | FAIL | PASS | Key right (SP 800-128: unscheduled changes reviewed by the CCB as soon as practical after they are made). A why "No change skips approval" is the absolute SP 800-128 contradicts (preapproved or exempt changes). | A why "An urgent change made to stop an attack still needs approval, even if it comes afterward." |
| i1-3-33e7c006.5 | PASS | PASS | PASS | Approve with conditions is in the chapter (board approves, rejects, defers, or approves with conditions). | none |
| i1-3-33e7c006.6 | PASS | PASS | PASS | Testing produces evidence, the panel decides: approval. NIST SP 800-128 test results presented to the CCB. | none |
| i1-3-33e7c006.7 | FAIL | FAIL | PASS | Key right. Explain ends "no change should go ahead without approval", the absolute SP 800-128 contradicts (exempt changes). | Explain "Every other step was present. Nobody reviewed or signed off the change, so it skipped the approval process." |
| i1-3-33e7c006.8 | PASS | PASS | PASS | Minutes with defer and approve decisions = approval process. Each wrong option is an input the board weighs. | none |
| i1-3-33e7c006.9 | PASS | PASS | PASS | Two card facts (sign-off before work, emergency approval afterward); E why correctly treats pre-approval as approval. | none |
| i1-3-73536b57.0 | FAIL | PASS | FAIL | Grammar in a shown line: B why "Everyone affected by a change are its stakeholders". | B why "The people a change affects are its stakeholders, a wider group than the owner." |
| i1-3-73536b57.1 | PASS | PASS | PASS | Owner kept informed (card key points). | none |
| i1-3-73536b57.2 | PASS | PASS | PASS | Owner who does not do the work (card example pattern). L1, plain. | none |
| i1-3-73536b57.3 | PASS | PASS | PASS | Picks the accountable party among contractor, board and users; close to .2 but the decision includes board and users. | none |
| i1-3-73536b57.4 | PASS | PASS | PASS | BEST justified: she is both a stakeholder (affected) and the owner (accountable); the edge rests on the chapter's owner vs stakeholder line. | none |
| i1-3-73536b57.5 | PASS | PASS | PASS | No one requested or answers for the change: ownership missing. | none |
| i1-3-73536b57.6 | PASS | PASS | PASS | Owner kept informed of a delay (chapter Ownership step 4). | none |
| i1-3-73536b57.7 | PASS | PASS | PASS | Auditor wants who answers for the system, not who did the work: ownership; version control lure flagged by the stem. | none |
| i1-3-73536b57.8 | FAIL | PASS | FAIL | Artifact copy of .3 (and .2): a department requests, IT performs, a board signs off, and the ask is the requester's role (owner). Round 2 of 1.2 set that an artifact form of the same identification is a copy (b7e50561.8, 218c54fb.8). | Writer: keep the record but test another ownership fact, e.g. add the line "Close requires: result accepted by ____" and ask who should accept the result before CHG-3307 is closed (the owner, d1.md Ownership step 5); options Fulfillment director / Desktop Support / Change board / Help desk. |
| i1-3-73536b57.9 | PASS | PASS | PASS | Owner duties: accountable and kept informed (card key points). | none |
| i1-3-d1b328e1.0 | PASS | PASS | PASS | Card definition; parallel gerunds. | none |
| i1-3-d1b328e1.1 | PASS | PASS | PASS | Card key point (small change, many departments). | none |
| i1-3-d1b328e1.2 | PASS | PASS | PASS | Listing and consulting affected groups = stakeholders. | none |
| i1-3-d1b328e1.3 | FAIL | PASS | FAIL | Shared scene with 14ab29d1.2: an approved change takes a system down and the people who rely on it were never told; the ask is what was missed. Same deciding detail ("nobody had told her team the server would be down"). | Writer: another stakeholder gap, e.g. the patch worked but changed the order screen the packing team uses and nobody consulted them, so the next morning they cannot find the reprint function; keep key Stakeholders and the three "the stem says" wrong options. |
| i1-3-d1b328e1.4 | PASS | PASS | PASS | BEST justified (groups vs component relationships); matches d1.md Stakeholders "Why it matters". | none |
| i1-3-d1b328e1.5 | PASS | PASS | PASS | Users consulted surface a risk (d1.md: stakeholders often know risks implementers do not). | none |
| i1-3-d1b328e1.6 | PASS | PASS | PASS | BEST justified: notice mentions the window time but also the new sign-in screen; only stakeholder communication covers both. | none |
| i1-3-d1b328e1.7 | FAIL | PASS | FAIL | Shared scene with .4: a schema change to one shared database table feeding sales reports and an outside party (dealers vs agency), several departments affected. | Writer: keep "small change, many groups" but leave the database, e.g. changing the sender address of all outgoing company email, which billing, marketing and support filters rely on. |
| i1-3-d1b328e1.8 | PASS | PASS | PASS | Legal missing from the stakeholder list. Once .3 is rewritten no other question shares this identification. | none |
| i1-3-d1b328e1.9 | PASS | PASS | PASS | Consult while planning, tell before interruption (card key points). | none |
| i1-3-abc0c1a4.0 | PASS | PASS | PASS | Card definition; parallel gerunds. | none |
| i1-3-abc0c1a4.1 | PASS | PASS | PASS | Both impact questions (card key points). | none |
| i1-3-abc0c1a4.2 | PASS | PASS | PASS | Side effect plus risk of not changing, before approval = impact analysis. | none |
| i1-3-abc0c1a4.3 | FAIL | PASS | FAIL | (1) Same identification as .2 (a person notes the risk of the change and the risk of not changing, before approval). (2) Form: key "The risk of changing and of not changing" is the only noun phrase among three clauses (Who is, Which groups, Whether). | Writer: an L1 scene on another card fact, e.g. the effect on business operations: the administrator notes the patch would take card payments offline for two hours on the busiest day and rates it medium before the board meets; options as noun phrases ("The owner accountable for the terminals", "The groups to tell about the patch", "The lab results for the patch", key "The effects the patch could have"). |
| i1-3-abc0c1a4.4 | PASS | PASS | PASS | BEST justified (dependencies are what is listed; assessing what could break is the analysis). | none |
| i1-3-abc0c1a4.5 | PASS | PASS | PASS | Impact analysis vs BIA (d1.md Common confusions). | none |
| i1-3-abc0c1a4.6 | PASS | PASS | PASS | Risk of not changing (card example). | none |
| i1-3-abc0c1a4.7 | PASS | PASS | PASS | Nobody predicted effects: impact analysis skipped; A why explains the test gap. | none |
| i1-3-abc0c1a4.8 | FAIL | PASS | FAIL | Artifact copy of .2 (and .3): risk if done (medium) and risk if not done (high) identify impact analysis; same identification in artifact form (1.2 rule). | Writer: keep an impact section but test completeness, e.g. it lists affected systems and the risk if done but no line on the risk if not done; ask which part the board should send back as missing (the risk of not making the change). |
| i1-3-abc0c1a4.9 | PASS | PASS | PASS | Possible failures and risk of not changing belong; others are separate parts. | none |
| i1-3-d3624c41.0 | PASS | PASS | PASS | Card definition; parallel noun phrases. | none |
| i1-3-d3624c41.1 | PASS | PASS | PASS | Results support approval (card key points; SP 800-128 test results to the CCB). | none |
| i1-3-d3624c41.2 | PASS | PASS | PASS | Change applied on lab terminals and observed = test results. | none |
| i1-3-d3624c41.3 | PASS | PASS | PASS | Testing in production is the one gap. | none |
| i1-3-d3624c41.4 | FAIL | PASS | FAIL | (1) BEST without two honest readings: output from running the patch on a clone has no honest reading as impact analysis (the chapter: impact analysis predicts, testing proves), so the partly flag and runner are forced. (2) Same identification as .2 (change applied outside production and observed -> test results). | Writer: drop BEST (word "", no partly, runner, edge) and test another test-results fact, e.g. the clone ran a different patch build than the one planned for production; ask what is wrong with the evidence (the change was not applied exactly as planned, d1.md Test results step 2). |
| i1-3-d3624c41.5 | PASS | PASS | PASS | Staging not matching production gives false confidence (d1.md Common confusions). | none |
| i1-3-d3624c41.6 | PASS | PASS | PASS | Testing the backout (card key points; SP 800-128 requirements for rollback). | none |
| i1-3-d3624c41.7 | FAIL | PASS | FAIL | The stem defines the answer: "evidence that the change already worked on the staging pair" is the card definition of test results, so the question tests reading. It also shares 18150c04.7's frame (the board refuses until one element is attached). | Writer: another test-results fact, e.g. the staging run shows the balancer's admin page now answers without a password; ask what the result shows (the change weakens a security control, d1.md Test results step 3) or what the board should do. |
| i1-3-d3624c41.8 | PASS | PASS | PASS | Open failure in staging: hold approval. | none |
| i1-3-d3624c41.9 | PASS | PASS | PASS | Works for users and no harmful side effects (card definition). | none |
| i1-3-f9c862ac.0 | PASS | PASS | PASS | Card definition; parallel. | none |
| i1-3-f9c862ac.1 | FAIL | PASS | FAIL | Form: the key "Some changes are hard to reverse" is a statement about changes, while the three wrong options are statements about the plan ("Only large changes need one", "It is written...", "Backups make it unnecessary"); it answers a different question than the ask ("statements about backout plans"). | Key "It usually depends on good backups" (card key point), why "A backout plan usually relies on backups or snapshots of the earlier state."; C why stays. |
| i1-3-f9c862ac.2 | PASS | PASS | PASS | Saved state plus restore commands = backout plan. | none |
| i1-3-f9c862ac.3 | FAIL | PASS | FAIL | The stem states the answer ("writes down how to return to the current version if the upgrade fails") and the key restates it ("A documented way back"). Also shares 18150c04.7's scene (see there). | Ask "Which change management element is the IT lead asking for?" with named options from earlier lessons ("Stakeholders", "Impact analysis", "Backout plan", "Test results" with their items), so the learner maps "how to return" to the term. |
| i1-3-f9c862ac.4 | PASS | PASS | PASS | BEST justified (backout vs DR, d1.md Backout Common confusions and Scenario). | none |
| i1-3-f9c862ac.5 | PASS | PASS | PASS | Backups are a tool, the plan is the steps (d1.md). | none |
| i1-3-f9c862ac.6 | PASS | PASS | PASS | Hard-to-reverse change still needs a plan (card key points); B why gives an alternative way back. | none |
| i1-3-f9c862ac.7 | PASS | PASS | PASS | Backout must fit inside the window (d1.md Backout step 3, Maintenance window step 4); arithmetic sound. | none |
| i1-3-f9c862ac.8 | PASS | PASS | PASS | Trigger met, so back out (d1.md Backout step 2 and 4). | none |
| i1-3-f9c862ac.9 | PASS | PASS | PASS | Saved state and undo steps (d1.md Backout step 1 and 2). | none |
| i1-3-8e31ede5.0 | PASS | PASS | PASS | When (d1.md Common confusions). | none |
| i1-3-8e31ede5.1 | PASS | PASS | PASS | Change freeze (card key points). | none |
| i1-3-8e31ede5.2 | PASS | PASS | PASS | Pre-scheduled low-activity time. | none |
| i1-3-8e31ede5.3 | FAIL | PASS | FAIL | C "A backout plan" and D "An impact analysis" name course cards (i1-3-f9c862ac, i1-3-abc0c1a4) with item null (the 1.2 rule; both are lesson 1 or 2, so C16 still passes once set). | Data only: C item "i1-3-f9c862ac", D item "i1-3-abc0c1a4". |
| i1-3-8e31ede5.4 | FAIL | PASS | FAIL | Renamed scene of .2 (a Sunday early-morning slot chosen because use is lowest; which is it) and the mirror of 14ab29d1.8 (window plus site offline; one asks the window, the other the outage), which the 1.2 rounds count as a copy (3fd5834e.8). | Writer: another maintenance-window fact, e.g. at 03:40 in a 01:00 to 04:00 window the upgrade is half done and cannot finish; ask what should happen before the window closes (the backout runs, d1.md Maintenance window step 4). |
| i1-3-8e31ede5.5 | PASS | PASS | PASS | Per-region windows (d1.md Common confusions). | none |
| i1-3-8e31ede5.6 | FAIL | PASS | FAIL | Wording: the ask says "fixing the flaw now" but the stem describes a failing disk array and a firmware fix; the word flaw is never set up. | Ask "Which of the following is true of applying the fix now?" |
| i1-3-8e31ede5.7 | PASS | PASS | PASS | Same work and risk, only time changes = window; impact analysis excluded by the stem. | none |
| i1-3-8e31ede5.8 | PASS | PASS | PASS | Routine change waits out the freeze into a standard window; dates consistent (Apr 9 Wednesday, Apr 13 Sunday). | none |
| i1-3-8e31ede5.9 | PASS | PASS | PASS | Card key points. | none |
| i1-3-388470f9.0 | FAIL | PASS | FAIL | (1) Grammar in a shown line: D why "Everyone a change affects are its stakeholders". (2) Form: the key is the only option without an article ("Written steps ..." vs "A scheduled ...", "A documented ...", "A list ..."). | Key "A written set of steps for a routine task"; D why "The people a change affects are its stakeholders." |
| i1-3-388470f9.1 | PASS | PASS | PASS | Card key point (updated when processes change). | none |
| i1-3-388470f9.2 | PASS | PASS | PASS | Numbered written checklist for a routine task. Note: key is the only acronym option (style keeps acronyms unexpanded). | none |
| i1-3-388470f9.3 | FAIL | PASS | FAIL | A "A backout plan for one change", B "An impact analysis of a change", C "A schedule of maintenance windows" name course cards with item null (1.2 rule). | Data only: A item "i1-3-f9c862ac", B "i1-3-abc0c1a4", C "i1-3-8e31ede5" (lessons 1 and 2, C16 passes). |
| i1-3-388470f9.4 | PASS | PASS | PASS | SOP vs guideline (d1.md SOP Common confusions; card i5-1-5b946034). | none |
| i1-3-388470f9.5 | FAIL | FAIL | FAIL | (1) The stem gives the answer: the condition "follow the same written steps every time" is the SOP definition and the ask is what the board relies on. (2) Key why "Pre-approval is safe only because a written SOP ...": SP 800-128 footnote 15 says preapproved changes are still tested and documented, so the SOP is not the only safeguard. | Stem ends "The board agrees." (condition removed); ask "Which of the following makes pre-approving these routine updates safe?"; key "A documented SOP for the updates"; why "Pre-approval is safe because a written SOP defines exactly how each update is done." |
| i1-3-388470f9.6 | FAIL | PASS | FAIL | Shared setting with 827980ed.4: an auditor compares how staff reset account passwords against written reset steps. Also .2 and .9 use account tasks. | Writer: another routine task, e.g. restoring a deleted folder from backup or renewing web certificates; keep the three-methods detail and the options. |
| i1-3-388470f9.7 | PASS | PASS | PASS | BEST justified: the policy is partly true (states the rule and why), the SOP has the steps (d1.md SOP Common confusions; card i5-1-41fc83ad). | none |
| i1-3-388470f9.8 | FAIL | PASS | FAIL | Artifact copy of .3 (and .7): numbered steps to submit a change request, get it approved and record the outcome, ask what the document is (SOP). | Writer: keep the wiki SOP but test the "must be updated" key point, e.g. step 3 still says to submit to a board that was replaced by an online approval queue last month; ask what should happen to CM-02 (it is revised as part of that change). |
| i1-3-388470f9.9 | PASS | PASS | PASS | Steps in order and who does each (d1.md SOP step 2). | none |
| i1-3-ba3703a5.0 | FAIL | PASS | FAIL | Form: three options are "The ... " noun phrases about one thing (sign-off, people, steps) and the key "Side effects such as restarts and downtime" is the only one without an article and the only one giving examples, which points at it. | Key "The side effects a change has on systems". |
| i1-3-ba3703a5.1 | FAIL | FAIL | PASS | Second defensible option: C "They are checked after the change is live" is true too. SP 800-128 §2.3.9: once changes are implemented and tested, a security impact analysis checks for unanticipated effects; d1.md: verify after the change, verify after a restart. | C "They are checked only after the change is live", why "They are planned and checked before approval; checking only afterward finds them too late." |
| i1-3-ba3703a5.2 | PASS | PASS | PASS | Downtime, restart, legacy program = technical implications. | none |
| i1-3-ba3703a5.3 | PASS | PASS | PASS | Checking dependencies and legacy before approval (card key points). | none |
| i1-3-ba3703a5.4 | PASS | PASS | PASS | Nothing looked beyond the web server. Minor: "The ownership" reads oddly; not failed. | none |
| i1-3-ba3703a5.5 | PASS | PASS | PASS | Restart and dependency cause the downtime. | none |
| i1-3-ba3703a5.6 | FAIL | PASS | FAIL | Shared scene with b51cf78e.3 (and b51cf78e.2): an update closes a desktop program and unsaved work is lost; the answer is the restart. It also tests the application restart card instead of its own. | Writer: an umbrella-card fact, e.g. a change request reaches the board listing owner, tests and window but nothing on restarts, dependencies or list updates; ask what the board should require before approval (a review of technical implications). |
| i1-3-ba3703a5.7 | PASS | PASS | PASS | Restricted activities limit the implementers (d1.md: managerial and directive). | none |
| i1-3-ba3703a5.8 | PASS | PASS | PASS | Only dependencies unchecked. | none |
| i1-3-ba3703a5.9 | PASS | PASS | PASS | Restart and old relaying system are technical; the rest business steps. | none |
| i1-3-e75812c9.0 | PASS | PASS | PASS | Allow list = default deny (SP 800-53 CM-7(5) "allow-by-exception"). | none |
| i1-3-e75812c9.1 | PASS | PASS | PASS | Deny list = default allow (CM-7(4) "deny-by-exception"). | none |
| i1-3-e75812c9.2 | FAIL | PASS | FAIL | B "A longer maintenance window" names the maintenance window card with item null; 388470f9.6 gives the same text item i1-3-8e31ede5. | Data only: B item "i1-3-8e31ede5" (lesson 2, C16 passes). |
| i1-3-e75812c9.3 | PASS | PASS | PASS | Broad list edit opens unreviewed access (d1.md Why it matters). | none |
| i1-3-e75812c9.4 | FAIL | PASS | FAIL | A "Deny list" names this card's own term with item null. Note: the scene resembles 1-1 e1ccd45a.7 (only approved programs may start) but asks a different thing. | Data only: A item "i1-3-e75812c9". |
| i1-3-e75812c9.5 | PASS | PASS | PASS | Deny list misses anything new. | none |
| i1-3-e75812c9.6 | PASS | PASS | PASS | Stale entry becomes an opening (d1.md step 3). Address in 203.0.113.0/24. | none |
| i1-3-e75812c9.7 | FAIL | PASS | FAIL | B "A longer maintenance window" names the maintenance window card with item null. | Data only: B item "i1-3-8e31ede5". |
| i1-3-e75812c9.8 | PASS | PASS | PASS | Hash changed, no allow entry (card example). | none |
| i1-3-e75812c9.9 | PASS | PASS | PASS | Add new entries, remove retired ones (d1.md steps 2 and 3). | none |

## Stamped
p1 and p3 (each run twice) on the 77 PASS ids. The 33 FAIL ids were not stamped and go back to the writer, then through every pass.

## Not done or not verified
- No edits, no commit. ITIL texts not read. The other half of 1.3 was read only for shared scenes, not reviewed.
