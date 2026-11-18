# Question bank 1.3: the writer's fixes after reviews A and B

Writer pass on `dev/careers/sources/security-plus-sy0-701/bank/1-3.json` (2026-11-17). It fixes every failure in
[review A](bank-1-3-review-a.md) (33) and [review B](bank-1-3-review-b.md) (30), the blind solver's finding on
i1-3-8e31ede5.4, and runs five sweeps over all 210 questions. Nothing was stamped or committed; every changed question
had its `rev` raised by one (now 2) and goes back through every pass. Related: [the plan](../plans/2026-11-16-exam-format-questions.md)
(B3, B4 with CONTESTED, D2.1, C1 to C23).

## Totals
| What | Count |
|---|---|
| Questions changed | 87 |
| from review A | 33 (all) |
| from review B | 30 (all) |
| changed only by a sweep | 24 |
| new question on the same card (new scene or fact, not a wording fix) | 26 |
| dropped | 0 |

Build (`node dev/careers/build-bank.mjs security-plus-sy0-701 --preview --allow-short`): no problems. Every C10
warning on 1.3 is a stem word on a wrong option (a fair lure). Stored key position over the 200 pick 1 questions:
A 46, B 49, C 48, D 46. Questions with a BEST, MOST, NEXT or FIRST word: 12 (4 BEST dropped: d3624c41.4, 8e31ede5.4,
14ab29d1.5, c5ebe818.9).

## The sweeps
1. **"Every change needs approval"** (SP 800-128 allows preapproved or exempt changes; emergency changes are approved
   afterward): removed from 33e7c006.0, .1, .4, .7, .9, 18150c04.1, .5 and 734d6e30.8, and the "never into a freeze"
   line of 8e31ede5.8 now speaks of this policy only. Kept: "every change needs a backout plan" (the card's own key
   point "always required"), and a fictional company's own policy text in 388470f9.7.
2. **Pre-approval**: 388470f9.5 no longer says pre-approval is safe "only because" of the SOP, and its why and
   explain say pre-approved changes are still tested and recorded. 388470f9.8 (new) tests that the pre-approval covers
   only the task the SOP describes. No question says or implies pre-approved changes skip testing.
3. **Card names with item null**: the five review A ids, ad3cfe62.4 (the build's C16), and ba3703a5.2 ("Business
   process steps", "Stakeholder concerns", "Parts of the backout plan", all lessons 0 to 2). Options that only mention
   a term inside a statement ("It skips the approval process") keep item null: their term is not that card.
4. **Repeated scenes**: every new scene was checked against all stems of 1-1.json, 1-2.json and 1.3. Four
   organizations used twice in 1.3 with close scenes were renamed (33e7c006.2, d3624c41.7, ba3703a5.6, 827980ed.3).
5. **Key odd one out by form**: a script compared each key's form with its wrong options (article, first word, gerund,
   acronym, plural); 15 keys reworded and one wrong option swapped (d1b328e1.6). On card 388470f9 the keys no longer carry "SOP" (now 0 of 10; "SOP" is in a wrong
   option of .8), and "procedure" is in wrong options of .2, .4 and .5 so it is no tell either.

## Per question
| id | rev | what and why |
|---|---|---|
| i1-3-18150c04.0 | 2 | Key reworded as a gerund like the three wrong options (review A: key was the only noun phrase). |
| i1-3-18150c04.1 | 2 | A why no longer says review is "never" skipped (sweep 1: pre-approved changes are not reviewed one by one). |
| i1-3-18150c04.2 | 2 | Off-topic option B (hardware) replaced by a neighboring measure, a test lab (review A). |
| i1-3-18150c04.5 | 2 | Explain no longer says the board approves each change (sweep 1). |
| i1-3-18150c04.7 | 2 | New scene and fact: teams handle changes their own way, the process adds repeatable steps (review A: shared the backout scene of f9c862ac.3 and tested another card); key starts with "A" like the others (sweep 5). |
| i1-3-18150c04.9 | 2 | Select TWO now tests other key points (CAB oversight, a way back) with new wrong options (review A: repeated .1). |
| i1-3-33e7c006.0 | 2 | Key reworded as a gerund (review A); key why and explain describe the sign-off without saying every change must get it first (sweep 1). |
| i1-3-33e7c006.1 | 2 | B why and explain no longer say every change needs approval (review A, pass 1). |
| i1-3-33e7c006.2 | 2 | Stem no longer states the answer: the request waits for the change advisory board meeting (review A); organization renamed (sweep 4). |
| i1-3-33e7c006.4 | 2 | A why no longer says no change skips approval (review A, pass 1). |
| i1-3-33e7c006.7 | 2 | Explain drops "no change should go ahead without approval" (review A, pass 1). |
| i1-3-33e7c006.9 | 2 | B why speaks of a normal change (sweep 1). |
| i1-3-73536b57.0 | 2 | Grammar in B why (review A). |
| i1-3-73536b57.8 | 2 | Record kept, new ownership fact: who confirms the result meets the business need before the change closes (review A: artifact copy of .3). |
| i1-3-d1b328e1.1 | 2 | Key no longer the only option starting with an article (sweep 5). |
| i1-3-d1b328e1.3 | 2 | New stakeholder gap: the update moved a button the packing team uses and nobody asked them (review A: shared scene with 14ab29d1.2). |
| i1-3-d1b328e1.6 | 2 | Key no longer the only plural term: Backout plan swapped for Test results (sweep 5). |
| i1-3-d1b328e1.7 | 2 | New setting: a change to the company email sender address several departments rely on (review A: shared the database scene of .4). |
| i1-3-d1b328e1.8 | 2 | Key starts with "The" like the wrong options (sweep 5). |
| i1-3-abc0c1a4.3 | 2 | New impact fact (effect on business operations) with noun-phrase options (review A: same identification as .2; key odd one out by form). |
| i1-3-abc0c1a4.8 | 2 | Impact section kept, now tests completeness: the risk of not changing is missing (review A: artifact copy of .2). |
| i1-3-d3624c41.4 | 2 | BEST dropped; new test-results fact: the clone ran a different build than planned (review A: forced runner, same identification as .2). |
| i1-3-d3624c41.5 | 2 | Key starts with "The" like the wrong options (sweep 5). |
| i1-3-d3624c41.7 | 2 | New test-results fact: staging shows the change drops a password check (review A: stem defined the answer; shared frame with 18150c04.7); organization renamed (sweep 4). |
| i1-3-f9c862ac.1 | 2 | Key is now a statement about the plan like the wrong options (review A). |
| i1-3-f9c862ac.3 | 2 | Options are named change management elements, so the learner maps "how to return" to the term (review A: key restated the stem). |
| i1-3-f9c862ac.7 | 2 | Key starts with "The" like the wrong options (sweep 5). |
| i1-3-8e31ede5.3 | 2 | Items set on options naming course cards (review A, C16). |
| i1-3-8e31ede5.4 | 2 | New fact: work that cannot finish is backed out before the window closes; no outage for the whole slot, so Downtime is no longer defensible; distinct from 14ab29d1.8 (review A and the blind solver). |
| i1-3-8e31ede5.6 | 2 | Ask no longer uses "flaw", a word the stem never set up (review A). |
| i1-3-8e31ede5.8 | 2 | Explain ties "never into a freeze" to this policy (sweep 1); key starts with "Run it" like the others (sweep 5). |
| i1-3-388470f9.0 | 2 | Key takes an article like the others; grammar in D why (review A). |
| i1-3-388470f9.2 | 2 | Four named elements with articles, the key spelled out, so it is no longer the only acronym; a wrong option names a procedure too (review A note, sweep 5). |
| i1-3-388470f9.3 | 2 | Items set on options naming course cards (review A, C16); key spelled out (sweep 5). |
| i1-3-388470f9.4 | 2 | Key no longer the only acronym: four documents of one form, one wrong option a procedure (sweep 5). |
| i1-3-388470f9.5 | 2 | Stem no longer states the condition; key without "SOP"; why says pre-approved changes are still tested and recorded (review A, pass 1 and 3; sweeps 2 and 5). |
| i1-3-388470f9.6 | 2 | New routine task (restoring a deleted folder); key without "SOP" or "procedure" (review A: shared the password-reset setting of 827980ed.4; sweep 5). |
| i1-3-388470f9.7 | 2 | Four documents of one form, the key no longer the only acronym (sweep 5). |
| i1-3-388470f9.8 | 2 | New SOP fact: a task the pre-approved SOP does not describe goes through normal review (review A: artifact copy of .3; sweep 5: "SOP" now in a wrong option). |
| i1-3-ba3703a5.0 | 2 | Key takes an article and no examples, like the others (review A). |
| i1-3-ba3703a5.1 | 2 | C now says "only after", so it is plainly false (review A, pass 1: checking after go-live is also done). |
| i1-3-ba3703a5.2 | 2 | Items set on options naming course cards (sweep 3; lessons 0 to 2, C16 passes at level 1). |
| i1-3-ba3703a5.6 | 2 | New umbrella-card fact: the board asks for a review of technical side effects before approving (review A: shared scene with b51cf78e.3, tested another card); organization renamed (sweep 4). |
| i1-3-e75812c9.0 | 2 | Key starts with "Listed items" like the wrong options (sweep 5). |
| i1-3-e75812c9.2 | 2 | Item set: option names the maintenance window card (review A, C16). |
| i1-3-e75812c9.4 | 2 | Item set: option names this card (review A, C16). |
| i1-3-e75812c9.6 | 2 | Key starts with "The" like the wrong options (sweep 5). |
| i1-3-e75812c9.7 | 2 | Item set: option names the maintenance window card (review A, C16). |
| i1-3-32194154.2 | 2 | Wrong options no longer share a "Tighten its access" opening the key lacks (review B). |
| i1-3-32194154.6 | 2 | Key no longer repeats the stem ("approved patch", "order server") (review B). |
| i1-3-32194154.8 | 2 | New stem that does not define the term: two handbook rules, one acceptable use, one change scope (review B: repeated .1). |
| i1-3-32194154.9 | 2 | Key starts with "The" like the wrong options (sweep 5). |
| i1-3-14ab29d1.2 | 2 | New downtime angle: unannounced downtime taken for an attack (review B: shared scene with d1b328e1.3; "told no one" stated the key). |
| i1-3-14ab29d1.3 | 2 | Off-family option B replaced by a change step (review B). |
| i1-3-14ab29d1.5 | 2 | New downtime fact with a role: failover must be tested before a change relies on it; BEST dropped (review B: no role; repeated ba3703a5.5). |
| i1-3-14ab29d1.7 | 2 | Minute counts corrected (22:15 to 22:29 is 14 minutes) and options in one form (review B: factual error; key the only one without "About"). |
| i1-3-14ab29d1.8 | 2 | Stem names a role (review B). |
| i1-3-14ab29d1.9 | 2 | New setting (county library) and items set on the CIA options (review B). |
| i1-3-c5ebe818.3 | 2 | New fact: a restart interrupts what uses the service (review B: same decision as .5). |
| i1-3-c5ebe818.6 | 2 | Stem names a role (review B). |
| i1-3-c5ebe818.8 | 2 | Stem names a role (review B). |
| i1-3-c5ebe818.9 | 2 | New fact: restart the one service instead of rebooting the whole server; BEST dropped (review B: renamed copy of .4). |
| i1-3-734d6e30.0 | 2 | Key takes the "A program that" form of the wrong options (sweep 5). |
| i1-3-734d6e30.2 | 2 | Ask no longer names the key's definition (review B). |
| i1-3-734d6e30.7 | 2 | Record kept, new legacy fact: no replacement is planned (review B: artifact copy of .2). |
| i1-3-734d6e30.8 | 2 | D why no longer says every change gets an impact analysis (sweep 1). |
| i1-3-ad3cfe62.4 | 2 | Item set: option names the maintenance window card (build C16). |
| i1-3-ad3cfe62.5 | 2 | New dependency-forced restart with a role: a message queue server moves (review B: NTP carries no time zone; no role). |
| i1-3-ad3cfe62.7 | 2 | Off-topic option B replaced by a real neighbor, the pre-approved path (review B). |
| i1-3-49f9d06c.4 | 2 | Stem names a role (review B). |
| i1-3-49f9d06c.8 | 2 | New angle: the change request record is not all the documentation a change needs (review B: renamed copy of .1). |
| i1-3-49f9d06c.9 | 2 | New situation and real options: finding records that drifted from the environment (review B: shared a44608df.2 scene and the card example; weak options). |
| i1-3-a44608df.1 | 2 | Key starts with "They" like the wrong options (sweep 5). |
| i1-3-a44608df.7 | 2 | The map's revision date now decides: the April change is already on it (review B: copy of .6, date decided nothing). |
| i1-3-a44608df.9 | 2 | Key takes an article like the wrong options (sweep 5). |
| i1-3-827980ed.1 | 2 | Key starts with "The" like the wrong options (sweep 5). |
| i1-3-827980ed.3 | 2 | Key takes an article and singular form like the others (review B); organization renamed, a ski resort is in ad3cfe62.9 (sweep 4). |
| i1-3-827980ed.4 | 2 | Same finding on another process: laptop setup steps after a cloud enrollment service arrived (review B: shared scene with 388470f9.6 and .8). |
| i1-3-827980ed.5 | 2 | Off-family options A and B replaced by document steps (review B). |
| i1-3-827980ed.7 | 2 | Key starts with "The" like the wrong options (sweep 5). |
| i1-3-827980ed.8 | 2 | Stem names a role and a new process, badge printing (review B: no role; shared the reset scene with .4). |
| i1-3-827980ed.9 | 2 | Stem names the role (review B). |
| i1-3-1ff9c96c.3 | 2 | New device and organization (review B: shared the firewall-rules scene of 1-1 867b6c50.8). |
| i1-3-1ff9c96c.4 | 2 | Stem no longer names the key ("revision history") and names a role (review B). |
| i1-3-1ff9c96c.5 | 2 | Key no longer says "not full copies" (review B, CONTESTED: every distributed clone is a full copy); D no longer repeats .9. |
| i1-3-1ff9c96c.8 | 2 | Stem names a role (review B). |
| i1-3-1ff9c96c.9 | 2 | Key is a "The repository" statement like the wrong options (sweep 5). |

## For the next passes (still weak or worth a second look)
- c5ebe818.9 (new, reviewer B's proposal): "restart one service, not reboot the server" shares its frame with
  b51cf78e.9 ("restart one program, not reboot every laptop"), on another card. Pass 3 should judge whether that counts
  as a shared decision.
- 73536b57.8 (new): the key rests on d1.md Ownership step 5 (the owner confirms the result before close). Some
  processes also have a change manager review before closing; the ask names the business need to keep the owner
  the one answer. Pass 1 should check it under CONTESTED.
- 8e31ede5.4 (new): the key rests on d1.md Maintenance window step 4. No option offers asking for a longer window,
  which would be a second defensible answer.
- The chapter itself still says "Pre-approved standard changes are only safe because an SOP defines exactly how they
  are done" (d1.md, SOP "Why it matters") and the approval card's key point reads "No change without approval". The
  questions no longer repeat either absolute; the study guide and card were not changed here (out of scope).
- Card d1b328e1 still has "Stakeholders" in 5 keys: all are term-identification questions whose wrong options are
  other terms, so it is the card's name, not a tell.
