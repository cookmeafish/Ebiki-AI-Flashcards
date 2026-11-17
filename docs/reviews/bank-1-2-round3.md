# Question bank 1.2, round 3: passes 1, 3 and 4 on the 26 rewritten questions

Reviewer: an agent that did not write, edit or earlier review these questions. Date: 2026-11-17. File
`dev/careers/sources/security-plus-sy0-701/bank/1-2.json`, read against all 360 questions of 1.2 and the 120 of
`bank/1-1.json` for shared scenes. No question was edited. The bank file had no uncommitted change while it was read
and stamped. Related: [round 2](bank-1-2-round2.md), [pass 4](bank-1-2-pass4.md),
[the plan](../plans/2026-11-16-exam-format-questions.md) (B3, B4 with CONTESTED, D2.1, checks C1 to C23).

## Sources read this round
- The 1.2 cards in `public/careers/security-plus-sy0-701.json` and the chapter
  `public/careers/security-plus-sy0-701/knowledge/d1.md` (sections Non-repudiation, AAA, Authenticating systems,
  Authorization models, control plane vs data plane, Adaptive identity, Policy-driven access control, Policy Engine,
  Policy Administrator, PEP, Subject and system, Bollards, Access badges, Security lighting, the four sensor sections and
  their comparison, Physical access controls compared, Honeyfile).
- NIST SP 800-207 full text (https://doi.org/10.6028/NIST.SP.800-207): §2 (subjects "end users, applications and other
  non-human entities"; §2.1 "authorized and approved subjects (combination of user, application (or service), and
  device)"), §3 component descriptions (PE inputs incl. ID management system and threat intelligence; PEP "enabling,
  monitoring, and eventually terminating connections"), §3.4 and §3.4.1 items 3 to 5 (data plane carries
  application traffic, resources not reachable without a PEP).
- NIST CSRC glossary, private key (https://csrc.nist.gov/glossary/term/private_key): FIPS 186-5 "uniquely associated
  with the owner and is not made public"; FIPS 205 "kept secret by the holder".
- https://en.wikipedia.org/wiki/Motion_detector: passive infrared "No energy is emitted from the sensor"; an active
  detector has a transmitter; ultrasonic emits sound "higher than a human ear can hear" and reads reflections.
- https://en.wikipedia.org/wiki/Traffic_bollard: high-security bollards are impact-tested to vehicle barrier crash
  ratings (PAS 68, IWA 14, ASTM F2656); low-security ones are not crash-resistant. The test vehicle weight and speed
  rest on the chapter's Bollards section (the ASTM page refused automated reading).
- The pass 4 sources logged in [pass 4](bank-1-2-pass4.md) for the same cards (RFC 2865/2866/8907, SP 800-63B,
  identity-based access control in the CSRC glossary).

Build: `node dev/careers/build-bank.mjs security-plus-sy0-701 --preview --allow-short` prints no problems. Every C10
warning on these ids was read: all are lures in wrong options, none a key tell.

## Totals
| Result | Count |
|---|---|
| PASS on all three passes (p1, p3, p4 stamped, each run twice) | 21 |
| FAIL | 5: 2 CONTESTED (b241c9e1.4; b1e0e898.8, which also has a false edge line), 1 more than one defensible answer (218c54fb.2), 1 shared scene (3fd5834e.7), 1 key odd one out (14edb9e6.7) |

Error rate this round: 5 / 26 = 19%.

## Coordinator's extra point: bare "Infrared sensor"
b1e0e898.8 FAILS under CONTESTED: its requirement "send out no signal" decides the answer and the key reads bare
"Infrared sensor"; active infrared beam sensors transmit (Motion detector article: active detectors have a
transmitter; passive infrared emits no energy). Fix: key text "Passive infrared sensor". A scan of all 360 questions of
1.2 found no other bare "Infrared sensor" option whose answer turns on emission: the other bare uses (for example
92e8e207.6, b1e0e898.2/.4, cd158454.3/.6, 3fd5834e.5, 1227072e.2/.3) turn on heat, glass, area or spot, which the
chapter and both kinds of infrared settle the same way.

## Per question (P1 accuracy and CONTESTED, P3 clarity and format, P4 primary source)
| Id | P1 | P3 | P4 | What and why | Source |
|---|---|---|---|---|---|
| i1-2-b6050128.7 | PASS | PASS | PASS | Key on one scientist's own smart card; shared folder, team key and an extra copy each let the signer blame someone else. New ask (where to keep the key), not a copy of .2 or .6. | d1.md Non-repudiation (key protection: smart cards, TPM, HSM); CSRC glossary private key (FIPS 186-5, FIPS 205) |
| i1-2-bcae1bd8.2 | PASS | PASS | PASS | Round 2 fix holds: certificate plus proof of the private key = authenticating systems. Authorization option fails on the deciding detail (proof of identity). | d1.md Authenticating systems steps 3 to 5, Common confusions; SP 800-207 §3.4.1 item 2 |
| i1-2-218c54fb.0 | PASS | PASS | PASS | Per-user grants option removed, so the IBAC contest is gone. Note: "A key that encrypts stored files" is the weakest lure (a CIA neighbor, not AAA); acceptable. | d1.md Authorization models; CSRC IBAC (pass 4) |
| i1-2-218c54fb.2 | FAIL | FAIL | PASS | The new ask "gives every new picker the same access with one change" is met by B (one shared account gives every new picker the same access with no change at all) and arguably by C (one copy action per picker). B and C fail no requirement stated in the stem; their why lines argue from "not a model" and "per-user", which the ask no longer asks. Fix (writer): state the requirements, e.g. stem "... the same access to the inventory app and two shared folders. Each picker's actions must stay traceable, and a later change to the pickers' access must reach all of them at once.", ask "Which of the following approaches meets these requirements?", detail "a later change to the pickers' access must reach all of them at once"; whys A "Per-user grants must be changed for each picker one by one", B "A shared account hides which picker did what", C "Copied rights are separate per-user grants, so a later change must be repeated for each picker", D "Rights held by the role change once for every member". | d1.md Authorization models (Why it matters) |
| i1-2-218c54fb.7 | PASS | PASS | PASS | Round 2 option fix applied: four parallel mechanism statements, key not the odd one out. Low difficulty (stem says the rights go to the group), still a fair test of AAA neighbors. | d1.md Authorization models ("many systems implement roles with groups") |
| i1-2-218c54fb.8 | PASS | PASS | PASS | New fact (a direct grant survives removal from the role), not a copy of .3. | d1.md Authorization models (Why it matters; removing one membership removes all of it) |
| i1-2-b7e50561.7 | PASS | PASS | PASS | Key reworded to parallel form. Relationship to the organization is a card key point. Same "one differing signal" pattern as .8 but another signal and another scene. | Card b7e50561 key points; d1.md Adaptive identity step 1; SP 800-207 §2.1 tenet 4 (pass 4) |
| i1-2-b7e50561.8 | PASS | PASS | PASS | Now tests a signal (network) rather than reading .4's policy table. Minor realism note: "net=203.0.113.0/24" shows a range where a single address would be usual; not misleading. | d1.md Adaptive identity (Example: hosting provider IP range scores higher) |
| i1-2-479731d1.6 | PASS | PASS | PASS | Writer's flag vs d7797bd7.4 checked: that one asks how a rule reached the gateways (control plane configured them); this asks which PDAC benefit allows it. Wrong options are real neighboring benefits (location, audit) and adaptive identity. Distinct from .5 (consistency) and d12236b3.4 (who revoked). | d1.md Policy-driven access control (Why it matters) |
| i1-2-d12236b3.6 | PASS | PASS | PASS | New ask (where the HR feed goes). PE takes identity data. | SP 800-207 §3 (ID management system among the data sources used by the policy engine); d1.md Policy Engine step 2 |
| i1-2-14edb9e6.7 | PASS | FAIL | PASS | Fact correct (more traffic per session loads the enforcement gateways). Format: the key is the only option labelled "on the data plane"; the other three all say "on the control plane", so the key is the odd one out and a guesser picks it. Fix (wording only): drop the plane labels from the options: "The Policy Engine", "The enforcement gateways", "The Policy Administrator", "The policy rule store"; the why lines keep the planes. | SP 800-207 §3.4, §3.4.1 items 4 and 5; d1.md control plane vs data plane |
| i1-2-b241c9e1.4 | FAIL (CONTESTED) | PASS | FAIL | The key "The systems differed; the subject was the same" depends on the subject being the account alone. SP 800-207 §2.1 defines authorized subjects as a "combination of user, application (or service), and device", and the chapter repeats it; on that reading the subject did differ, so option A ("The subjects differed; the system was the same") is defensible too. Fix (writer): keep the scene, drop the subject/system framing from the options: ask "Which of the following explains the different results?", options "The device the request came from" (key), "The account that made the request", "The app being requested", "The gateway in front of the app"; whys: same account both times; same app; the gateway enforces and does not decide. Explain names the system as the device. | SP 800-207 §2 and §2.1 (two readings of "subject"); d1.md Subject and system |
| i1-2-2dbfd6d2.6 | PASS | PASS | PASS | Round 2 fix applied: the detail no longer defines the answer. PEP monitors sessions in the traffic path. Overlaps in topic with 14edb9e6.6/.7 (traffic passes the PEP) but each is its own situation. | SP 800-207 §3 (PEP enabling, monitoring, terminating); d1.md PEP |
| i1-2-4810105c.5 | PASS | PASS | PASS | Pass 4 fix applied to option C's why; key true (sensors and cameras are detective). | d1.md Physical access controls compared (table types); card key points |
| i1-2-4810105c.8 | PASS | PASS | PASS | Round 2 fix applied: no BEST, no partly, no runner; "One reinforced steel door". Each single control fails "if any one control fails". Related to .1 and .3 (layering), but here the learner picks the plan for a stated need. | d1.md "How layering works" |
| i1-2-4464ac34.8 | PASS | PASS | PASS | Round 2 fix to D's why applied. | d1.md Bollards step 2 (crash-rated, set weight and speed); Traffic bollard article (impact-tested to crash ratings; low-security ones not crash-resistant) |
| i1-2-7daeebda.8 | PASS | PASS | PASS | Key reworded, no "X, not Y" tell. Badges do not stop tailgating. No tailgating scene elsewhere in 1.1 or 1.2 asks this. | d1.md Access badges (Common confusions) |
| i1-2-1d27ddab.7 | PASS | PASS | PASS | New lighting fact (even lighting, no deep shadow), not a copy of .9. Empty `mark` is allowed. | d1.md Security lighting step 2 and Example |
| i1-2-92e8e207.4 | PASS | PASS | PASS | Pass 4 fix applied (passive infrared). | Motion detector article (passive infrared emits no energy); d1.md sensors comparison |
| i1-2-92e8e207.9 | PASS | PASS | PASS | Pass 4 fix applied: "Passive infrared sensor". The word "Passive" makes that option easy to drop, but nothing is wrong or misleading. | Motion detector article; d1.md sensors comparison (active vs passive column) |
| i1-2-b1e0e898.8 | FAIL (CONTESTED) | FAIL | FAIL | (1) Key text bare "Infrared sensor" while emission decides; active infrared sensors transmit. (2) The edge says "only passive infrared sends out nothing", but option C (pressure mat) also sends out nothing (its own why says so): false as written. Fix: key text "Passive infrared sensor"; edge "Ultrasonic also stays inside the room, but it works by sending out sound; passive infrared sends out nothing and, unlike a mat, senses movement across the room." | Motion detector article; d1.md Infrared sensors, Pressure sensors, comparison table |
| i1-2-cd158454.4 | PASS | PASS | PASS | Pass 4 fix applied. 3fd5834e.8 no longer copies it. | d1.md Microwave and Ultrasonic sections; Motion detector article |
| i1-2-3fd5834e.2 | PASS | PASS | PASS | Pass 4 fix applied. | Motion detector article (ultrasonic above human hearing, reflections); d1.md Ultrasonic sensors |
| i1-2-3fd5834e.7 | PASS | FAIL | PASS | Facts right (pass 4 fix applied). Shared scene: the same deciding detail as 3fd5834e.2 ("sends out a tone above human hearing" + echo change, ask "which sensor") in artifact form; round 2 set the rule that an artifact form of the same identification is a copy (b7e50561.8, 218c54fb.8). Fix (writer): keep the product sheet but test another ultrasonic fact, e.g. the buyer must place it in a room with a glass wall onto a busy corridor and the ask is whether the corridor will set it off (no: its sound does not pass glass), or a sheet line that is wrong for an ultrasonic unit. | d1.md Ultrasonic sensors |
| i1-2-3fd5834e.8 | PASS | PASS | PASS | New situation (two offices, glass wall, guard in the corridor) for the sound vs radio contrast; options are parallel mechanisms. Close in lesson to cd158454.3 (drywall) but compares both units and asks for the mechanism. | d1.md Microwave and Ultrasonic sections, comparison table |
| i1-2-2b388cf0.7 | PASS | PASS | PASS | New ask (which watching method recorded it), not a copy of 16c4c6d2.7. The artifact borrows the chapter example's `svc-print` account, which is shipped course text, not a source. | d1.md Honeyfile step 3 and Example |

## Stamped
p1, p3 and p4 (each run twice) on the 21 PASS ids. Not stamped: i1-2-218c54fb.2, i1-2-14edb9e6.7, i1-2-b241c9e1.4,
i1-2-b1e0e898.8, i1-2-3fd5834e.7.
