# Bank pilot 1.1: round 4, passes 1, 3 and 4 on the five round-3 rewrites, plus one solver flag

Reviewer: an independent agent that did not write, edit or earlier review these questions. Date: 2026-11-17.
File: `dev/careers/sources/security-plus-sy0-701/bank/1-1.json` (not edited). All 120 questions were read for the
shared-scene check. Judged against [the plan](../plans/2026-11-16-exam-format-questions.md) B3, B4 (CONTESTED rule),
D2.1, C1 to C23 and the pass 3 list (a) to (f), the style guide, the 1.1 cards in
`public/careers/security-plus-sy0-701.json` and `public/careers/security-plus-sy0-701/knowledge/d1.md` section 1.1.
Why these were rewritten: [round 3](bank-pilot-1-1-round3.md). `build-bank.mjs --preview`: no problems (C1 to C23).

## Primary sources read this round
- NIST SP 800-53 Rev. 5 control statements from NIST's OSCAL catalog (usnistgov/oscal-content, rev5 JSON): IA-3
  (device identification and authentication before a connection), IA-5(2) (PKI-based authentication: validate
  certificates "including checking certificate status information", local cache of revocation data), CM-3
  (configuration change control: "Monitor and review activities associated with configuration-controlled changes"),
  PE-3, PE-6.
- CSRC glossary, compensating controls: SP 800-53 Rev. 5 / SP 800-53B "employed in lieu of the controls in the
  baselines ... that provide equivalent or comparable protection"; SP 800-37 Rev. 2 the same with "implemented".
  Section 2.4 of SP 800-53B itself could not be read this round (the PDF did not extract); the glossary entry is
  taken from 800-53B and is what this verdict rests on.
- d1.md "Compensating controls (control type)": "It must give comparable protection against the same risk" and "A
  compensating control is not 'a weaker control we chose because it was cheaper'; it must address the same risk to a
  comparable degree."

## Verdicts

| id | pass 1 | pass 3 | pass 4 | what and why | source |
|---|---|---|---|---|---|
| i1-1-172e8ab8.7 | PASS | PASS | PASS | A VPN gateway refusing a revoked device certificate = technical; uncontested (an IA-family check by the system, no physical access involved). Detail literal; four category options; role named. Not a copy: the other firewall questions (172e8ab8.5, .8, e1ccd45a.3) filter traffic, and 02a955cb.7 revokes a certificate after an incident. | SP 800-53 IA-3, IA-5(2); d1.md "Technical controls (logical controls, control category)" |
| i1-1-867b6c50.8 | PASS | PASS | PASS | Comparing firewall changes with approved tickets by hand = operational; Managerial's why correctly says approval is not what is recorded. No longer shares 7215172d.3's alert scene. Closest neighbor 867b6c50.4 (an analyst reads login records and flags anomalies): a different record and purpose, so not a renamed copy. Line 3 of the artifact is under 100 characters. | SP 800-53 CM-3 (monitor and review configuration-controlled changes); CNSSI 4009 operational controls via CSRC (round 3); card example "staff performing regular log reviews"; d1.md "Operational controls (control category)" |
| i1-1-88dabb74.6 | PASS | FAIL | PASS | Facts right (a warning with nothing behind it deters only). FAIL (c), the writer's flag confirmed: a manager puts warning stickers on every unit of a fleet of protected things, and the stem adds that nothing else is there; that is 6e4e84fd.4 (stickers on every van, "do not lock the vans or record anything") with the asset swapped, same key, same deciding detail. The asset (customer cabinets) also repeats 17eb1a96.3 (rack locks at a data center). Two partial copies in one question. Proposed fix: a deterrent scene with no sticker, sign, banner, guard, camera, lighting or demotion (all used in 1.1), for example an HR director who publishes in the staff newsletter that an employee was dismissed for copying customer files, so that others decide not to try; options Detective, Preventive, Directive (why: it gives no instruction, it reports a consequence), Deterrent. | d1.md "Deterrent controls (control type)" |
| i1-1-55fcb3b6.9 | PASS | PASS | PASS | Policy on where returns are saved and a step guide = directive; lock preventive, log detective, prosecution notice deterrent, each uncontested. No longer copies 17eb1a96.9. Options parallel noun phrases. Note: the key reuses the card's own example, also the key of definition 55fcb3b6.1 (no scene there, so variety cost only, as ruled for e1ccd45a.1 in round 3). | d1.md "Directive controls (control type)"; card 55fcb3b6 example |
| i1-1-88dabb74.3 | PASS | PASS | PASS | Detective (unflagged and partly true for a guard) replaced by Compensating, which does not apply: (d) is now right. "The manager" fixes the repeat. Compensating and Corrective carry `item` i1-1-6e4e84fd (the control types card); that card teaches both terms in lesson 3, the same lesson as this card, so the link is defensible and C16 passes. | d1.md "Deterrent controls (control type)", "Classifying one control by category and type"; card 88dabb74 example (visible guard at reception) |
| i1-1-e28fd41b.7 (solver flag) | FAIL | PASS | FAIL | CONTESTED. The key rests on the alarm being a compensating control, but NIST (SP 800-53B via CSRC) and the chapter both make comparable protection part of the definition, and the stem gives a monitored door alarm (detects) in place of a night guard (deters, blocks and detects) with nothing saying the alarm meets the guard's purpose. A learner who knows the definition can defend "this is a weaker detective control, not a true compensating one"; the insurer's approval does not settle comparability. Proposed fix: state the purpose the missing control served so the substitute meets it, for example "The insurer requires that any after-hours entry to the records room be detected and answered within minutes and suggests a night guard, which the clinic cannot afford. With the insurer's written approval, the office manager installs a door alarm monitored by a firm that sends a responder." Keep Detective as the flagged runner; edge: the alarm detects, but it was approved in place of the required safeguard and meets the same requirement. Avoid wiring or lease wording (used by e28fd41b.6). | CSRC glossary compensating controls (SP 800-53 Rev. 5, SP 800-53B, SP 800-37 Rev. 2); d1.md "Compensating controls (control type)" |

## Totals
- Reviewed: 6 (5 rewrites, 1 already stamped). All three passes: 4 (172e8ab8.7, 867b6c50.8, 55fcb3b6.9, 88dabb74.3).
- Stamped p1, p3 and p4 on those 4, text unchanged since read.
- FAIL, not fixed (left for the writer, then every pass again):
  - i1-1-88dabb74.6: pass 3 (c), sticker scene copies 6e4e84fd.4; cabinet asset repeats 17eb1a96.3.
  - i1-1-e28fd41b.7: contested key (pass 1 and pass 4). Its round-3 p1, p3 and p4 stamps still match its text, so the
    build will still treat it as passed: those stamps must be withdrawn (or the question rewritten, which voids them)
    before 1.1 ships. This reviewer did not touch the stamps file beyond adding the four stamps above.
- Pass 4 error rate this round: 1 of 6 (the contested key).
- Edited questions: none.

## Still weak (passed)
- 88dabb74.3: Compensating and Corrective link to the control types card, not their own cards; correct for level 1,
  but a learner tapping the option lands on the overview, not the term's own card.
- 867b6c50.8 and 867b6c50.4: both a person reading records and querying what looks wrong; different enough today,
  worth keeping apart in refills.
- 55fcb3b6.1 and .9: the same card example as the key twice.

## Round 5: passes 1, 3 and 4 on the two round-4 rewrites

Reviewer: an independent agent that did not write, edit or earlier review these two texts. Date: 2026-11-17. File
`dev/careers/sources/security-plus-sy0-701/bank/1-1.json` (not edited); all 120 stems, asks and artifacts read for the
shared-scene check. `build-bank.mjs security-plus-sy0-701 --preview --allow-short`: no problems.

### Primary sources read this round
- CSRC glossary, compensating controls (read again this round): SP 800-53 Rev. 5 "employed in lieu of the controls in
  the baselines ... that provide equivalent or comparable protection for a system or organization"; SP 800-37 Rev. 2
  the same with "implemented".
- NIST has no definition of a deterrent control type: CSRC glossary pages for "deterrent" and "deterrence" return 404,
  and SP 800-53 PS-8 (personnel sanctions, read via csf.tools) requires a sanctions process but says nothing about
  deterrence. The deterrent verdict therefore rests on the exam objectives (1.1 lists Deterrent as a control type), the
  card (example "threat of demotion for policy violations") and d1.md "Deterrent controls (control type)" step 2 ("It
  signals a consequence (being seen, recorded, prosecuted, disciplined)"). No reputable source found placing a
  publicized sanction under another type, so not contested.

### Verdicts

| id | pass 1 | pass 3 | pass 4 | what and why | source |
|---|---|---|---|---|---|
| i1-1-88dabb74.6 | PASS | PASS | PASS | An HR director announces a dismissal so others decide not to try; nothing about access changes. Deterrent is the one defensible answer: Preventive fails "Nothing about file access changes", Detective finds nothing, Directive gives no instruction (d1.md: a directive tells what to do, a deterrent warns of what happens). Every why true to the stem. Detail literal. Role named; four single-word types, parallel. Shared-scene check: no sticker, sign, banner, guard, camera or lighting; the nearest are 88dabb74.2 (login notice threatening dismissal: a warning of a possible consequence on a screen, not a reported case in a newsletter) and e1ccd45a.7 / 172e8ab8.3 (payroll as the business only, different scenes). Not a renamed copy. | Exam objectives 1.1 (Deterrent); card 88dabb74 example; d1.md "Deterrent controls (control type)" How it works step 2 and Common confusions |
| i1-1-e28fd41b.7 | FAIL | FAIL | FAIL | CONTESTED point now settled: the stem states the requirement (after-hours entry detected and answered within minutes) and the alarm with a responder meets it, approved in writing, so comparable protection is established as SP 800-53 Rev. 5 and d1.md require. BEST is warranted: Detective is truly partly true, flagged as runner, and the edge names the deciding detail. Two problems remain. (1) Pass 1 and 4, why line not true to the stem: Detective's why says "instead of the required guard", but the stem says the insurer requires the outcome and only SUGGESTS the guard. (2) Pass 3 (c), shared scene: 3ded6b7b.9 is an insurer, a break-in at the records room, and an alarm that detects it; this question repeats insurer + records room + after-hours alarm (clinics also appear in 3ded6b7b.4, 17eb1a96.9, e1ccd45a.5, 88dabb74.7). | CSRC glossary compensating controls (SP 800-53 Rev. 5, SP 800-37 Rev. 2); d1.md "Compensating controls (control type)" ("used in place of a recommended control while offering equivalent or comparable protection") |

### Proposed fix for i1-1-e28fd41b.7 (writer to apply, then every pass again)
- Stem: "A jeweler's insurer requires that any after-hours entry to the stock room be detected and answered within
  minutes, and recommends a night guard, which the shop cannot afford. With the insurer's written approval, the store
  manager instead installs a door alarm monitored by a firm that sends a responder within minutes." (Jeweler and stock
  room appear nowhere else in 1.1; "recommends" matches the chapter's "recommended control".)
- Detective why: "The alarm detects entry, but it was put in place instead of the guard the insurer recommended and
  meets the same requirement."
- `detail`: "which the shop cannot afford". Key, runner, edge and explain can stay (edge: "the guard the shop cannot
  afford").

### Totals
- Reviewed 2. Passed all three: 1 (88dabb74.6), stamped p1, p3, p4 on the text as read.
- Failed: 1 (e28fd41b.7). Its stored p1, p3, p4 hashes are from round 3 and do NOT match the current text (only p2,
  from the round-4 solves, matches), so it is not counted as passed; no stamp withdrawal needed.
- Pass 4 error rate this round: 1 of 2 (a why line).

### Still weak (passed)
- 88dabb74.6 and 88dabb74.2 both use dismissal as the consequence; keep refills away from job-loss deterrents.
