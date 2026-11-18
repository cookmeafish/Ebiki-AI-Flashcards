# Question bank 1.3, round 2: pass 1 (accuracy, CONTESTED) and pass 3 (clarity and format) on the 91 changed questions

Reviewer: an agent that did not write these questions or do review A or B. Date: 2026-11-17. File
`dev/careers/sources/security-plus-sy0-701/bank/1-3.json`, the 91 ids the writer changed in
[the fixes](bank-1-3-fixes.md) after [review A](bank-1-3-review-a.md) and [review B](bank-1-3-review-b.md), read against
all 210 questions of 1.3 and `bank/1-1.json`, `bank/1-2.json` for shared scenes. No question was edited. Related:
[plan](../plans/2026-11-16-exam-format-questions.md) (B3, B4 with CONTESTED, D2.1, C1 to C23).

## Totals
| Result | Count |
|---|---|
| Reviewed | 91 |
| PASS on both passes (p1 and p3 stamped, each run twice) | 88 |
| FAIL (pass 3 only; no accuracy failure) | 3: i1-3-c5ebe818.9, i1-3-e75812c9.6, i1-3-32194154.8 |
| CONTESTED | 0 |
| dropped | 0 |

Build (`node dev/careers/build-bank.mjs security-plus-sy0-701 --preview --allow-short`): exit 0, "no problems". Every C10
warning on these ids was read: each is a stem word on a wrong option (a lure), none a key tell.

## Sources read
- The 1.3 cards in `public/careers/security-plus-sy0-701.json`; the chapter `public/careers/security-plus-sy0-701/knowledge/d1.md`, section 1.3 (all headings).
- NIST SP 800-128 (https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-128.pdf), text extracted and read this
  turn: sec. 3 change control procedure contents ("Criteria to determine the types of changes that are preapproved or
  exempt from configuration control"), footnote 15 ("Preapproved changes are still tested and documented prior to
  implementation"), "Define the Types of Changes That Do Not Require Configuration Change Control" (preapproved = "not
  sent to the CCB for approval"; "updated antivirus signatures" named as an example), sec. 4.3 step iii (exempt or
  pre-approved changes made "without further analysis or approval"; documentation may still need updating), and
  "Unscheduled changes are reviewed/resolved by the CCB as soon as is practical after unscheduled changes are made".
- NIST SP 800-53 Rev. 5 CM-3 was NOT re-read this turn; its wording (boards that review and approve proposed changes)
  is taken from review A's log.

## The two lines the questions now rest on
| Line | Verdict | Why |
|---|---|---|
| Approval card key point: "Changes are approved before they are made (low-risk standard changes can be pre-approved)" | PASS | Pre-approval is approval given in advance (SP 800-128: preapproved changes are not sent to the CCB, the criteria for them are set in the procedure), so the line holds; emergency changes approved afterward are the card's next key point. Note only: SP 800-128 also lets some changes be fully exempt from configuration control (account and user-file changes); no question rests on that, so no change needed. |
| Chapter SOP line: "A pre-approved standard change is low risk partly because an SOP defines exactly how it is done; it is still tested and recorded" | PASS | "still tested and recorded" is SP 800-128 footnote 15 ("still tested and documented prior to implementation"). "partly" keeps it from claiming the SOP is the only reason. NIST does not itself tie pre-approval to an SOP; the course's link is a fair reading of "criteria ... preapproved" set in documented procedures, and not contradicted. |

## Failures and fixes (all pass 3; facts are right in all three)
1. **i1-3-c5ebe818.9: shared decision with i1-3-b51cf78e.9** (the writer's own flag). Both are "a colleague proposes
   rebooting everything; only one thing needs restarting", and a learner who solved one gets the other for free. Fix (keep
   the card fact "a service restart is not a full system reboot, though a reboot restarts all services", change the
   decision): stem "A broadcast engineer at a radio station changes the listener limit in the streaming service's settings
   file. The server also hosts the music library and the ad scheduler, and the change plan lists a full reboot of the
   server."; ask "Which of the following does the full reboot cause that a restart of only the streaming service would
   not?"; key "The library and scheduler restart too" (why: a reboot restarts every service on the server); wrong options
   "The new limit fails to load" (both load it), "The settings file is rolled back" (neither undoes the edit), "Staff lose
   unsaved desktop work" (that is an application restart, not a server service). Back through every pass.
2. **i1-3-e75812c9.6: key odd one out by form and length.** The wrong options are "The X will Y" ("The new payroll server
   will be blocked", "The firewall will deny all payroll traffic", "The database will need a restart"); the key "The
   leftover listing can become an unwanted opening" is the only "can", the only abstract wording, and 12 characters
   longer than the next option. Fix: key "The firewall will let a stranger in" (same form as C, no stem word only it
   repeats; avoid "system" and "address", which would trip C10); why unchanged.
3. **i1-3-32194154.8: key the odd one out by order.** A reads "Rule 1 is ...; rule 2 is ...", the key reads "Rule 2 is
   ...; rule 1 is ...", the only option that starts with rule 2. Fix: key "Rule 1 is acceptable use; rule 2 is restricted
   activities" (57 characters); why unchanged.

## Notes for the next passes (not failed)
- i1-3-73536b57.8 (writer flag, CONTESTED check): not contested; see its row.
- i1-3-8e31ede5.4 (writer flag): no second defensible answer; see its row.
- i1-3-388470f9.3, i1-3-734d6e30.7, i1-3-f9c862ac.1: small weaknesses written in their rows.
- e75812c9.6 and e75812c9.9 D test the same fact (stale entries become openings) in two forms; accepted.

## Per question
| id | result | P1 | P3 | note (source) |
|---|---|---|---|---|
| i1-3-18150c04.0 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-18150c04.1 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-18150c04.2 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-18150c04.5 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-18150c04.7 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-18150c04.9 | PASS | PASS | PASS | E why matches SP 800-128 (preapproved = approved in advance; unscheduled changes reviewed by the CCB after). |
| i1-3-33e7c006.0 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-33e7c006.1 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-33e7c006.2 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-33e7c006.3 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-33e7c006.4 | PASS | PASS | PASS | SP 800-128 sec. 4.3: unscheduled changes reviewed by the CCB as soon as practical after they are made. |
| i1-3-33e7c006.5 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-33e7c006.6 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-33e7c006.7 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-33e7c006.8 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-33e7c006.9 | PASS | PASS | PASS | E why treats pre-approval as approval, matching SP 800-128 sec. 3 (preapproved changes). |
| i1-3-73536b57.0 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-73536b57.8 | PASS | PASS | PASS | Writer flagged CONTESTED risk. The key rests on d1.md Ownership step 5 (owner confirms the result before close). Some processes have the change manager close after a review, but the ask is about the business need, which no board or implementer owns, so one answer stands. The requester-as-owner step comes from the card (owner requests the change). Not contested. |
| i1-3-d1b328e1.1 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-d1b328e1.3 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-d1b328e1.6 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-d1b328e1.7 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-d1b328e1.8 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-abc0c1a4.3 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-abc0c1a4.8 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-d3624c41.4 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-d3624c41.5 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-d3624c41.7 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-f9c862ac.1 | PASS | PASS | PASS | Note, not failed: C and D are opposites about backups, a mild pair tell; D is the card key point. |
| i1-3-f9c862ac.3 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-f9c862ac.7 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-8e31ede5.3 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-8e31ede5.4 | PASS | PASS | PASS | Writer flagged. d1.md Maintenance window step 4: work that cannot finish is backed out before the window closes; 03:30 + 25 min ends 03:55. No option offers a window extension, so no second defensible answer. |
| i1-3-8e31ede5.6 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-8e31ede5.8 | PASS | PASS | PASS | Dates checked: Wed Apr 9 and Sun Apr 13 agree; Apr 20 is a Sunday inside the freeze, so the first fit is a later Sunday. |
| i1-3-388470f9.0 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-388470f9.2 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-388470f9.3 | PASS | PASS | PASS | Note, not failed: the key is the only option without an of/for qualifier; it is still a plain term of the same family. |
| i1-3-388470f9.4 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-388470f9.5 | PASS | PASS | PASS | Checked against the new SOP line and SP 800-128 sec. 3 (antivirus signature updates named as an example of a preapproved change; footnote 15 preapproved changes still tested and documented). Explain says pre-approval is possible because of the SOP, not only because of it. |
| i1-3-388470f9.6 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-388470f9.7 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-388470f9.8 | PASS | PASS | PASS | A task the SOP does not describe is outside its pre-approval: SP 800-128 sec. 4.3 iii (only changes pre-approved as defined in the SecCM plan or procedures skip further analysis). C10 lures on wrong options only. |
| i1-3-ba3703a5.0 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-ba3703a5.1 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-ba3703a5.2 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-ba3703a5.6 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-e75812c9.0 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-e75812c9.2 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-e75812c9.4 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-e75812c9.6 | FAIL | PASS | FAIL | see Failures |
| i1-3-e75812c9.7 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-32194154.2 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-32194154.6 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-32194154.8 | FAIL | PASS | FAIL | see Failures |
| i1-3-32194154.9 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-14ab29d1.2 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-14ab29d1.3 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-14ab29d1.5 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-14ab29d1.7 | PASS | PASS | PASS | Minute counts checked: webA 22:00 to 22:14 (14), webB 22:15 to 22:29 (14), job 29, customer outage 0. |
| i1-3-14ab29d1.8 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-14ab29d1.9 | PASS | PASS | PASS | Checked against 1.2 availability questions (dddf60a9.6 DDoS, .8 ticket queue): different scenes. |
| i1-3-c5ebe818.3 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-c5ebe818.6 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-c5ebe818.8 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-c5ebe818.9 | FAIL | PASS | FAIL | see Failures |
| i1-3-734d6e30.0 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-734d6e30.2 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-734d6e30.7 | PASS | PASS | PASS | Note, not failed: the link between a retirement date and the network change being approved is weak (isolation or documentation would fit the stem better but are not offered); answerable from the chapter step 5 (plan replacement). |
| i1-3-734d6e30.8 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-ad3cfe62.4 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-ad3cfe62.5 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-ad3cfe62.7 | PASS | PASS | PASS | New option B is a real neighbor; its why matches d1.md process step 3. |
| i1-3-49f9d06c.4 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-49f9d06c.8 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-49f9d06c.9 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-a44608df.1 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-a44608df.7 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-a44608df.9 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-827980ed.1 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-827980ed.3 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-827980ed.4 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-827980ed.5 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-827980ed.7 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-827980ed.8 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-827980ed.9 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-1ff9c96c.3 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-1ff9c96c.4 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-1ff9c96c.5 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-1ff9c96c.8 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
| i1-3-1ff9c96c.9 | PASS | PASS | PASS | Card, chapter and why lines agree; options parallel and one family; no shared scene found. |
