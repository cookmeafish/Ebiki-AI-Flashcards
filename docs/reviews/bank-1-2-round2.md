# Question bank 1.2, round 2: pass 1 (accuracy, CONTESTED) and pass 3 (clarity, format) on the 82 changed questions

Reviewer: an agent that did not write, edit or earlier review these questions. Scope: the 82 ids changed in the 1.2
refill (lines A and B of the changed-ids list), file `dev/careers/sources/security-plus-sy0-701/bank/1-2.json`, read
against all 360 questions of 1.2 and the 120 of 1.1 (`bank/1-1.json`) for shared scenes. No question was edited.
Related: [the plan](../plans/2026-11-16-exam-format-questions.md) (B3, B4 with CONTESTED, D2.1, checks C1 to C23),
[pass 1 part A](bank-1-2-pass1-a.md), [pass 1 part B](bank-1-2-pass1-b.md), [pass 3 part A](bank-1-2-pass3-a.md),
[pass 3 part B](bank-1-2-pass3-b.md).

Sources: the 1.2 cards in `public/careers/security-plus-sy0-701.json`; the chapter
`public/careers/security-plus-sy0-701/knowledge/d1.md` (sections CIA triad, Non-repudiation, AAA framework,
Authenticating people, Authenticating systems, Authorization models, Zero Trust architecture, control plane vs data
plane, Adaptive identity, Threat scope reduction, Policy-driven access control, Policy Engine, Policy Administrator,
Policy Enforcement Point, Implicit trust zones, Subject and system, Bollards, Access control vestibule, Fencing, Video
surveillance, Security guards, Access badges, Security lighting, the four sensor sections and their comparison, the
physical controls comparison, the four deception sections and their comparison). Primary sources were not needed
beyond those already logged in the pass 1 files (NIST SP 800-207 sec. 2 and 3, SP 800-53 Rev. 5 PE-3, PE-6, SC-26):
no key below rests on a fact the chapter does not state. Build: `node dev/careers/build-bank.mjs
security-plus-sy0-701 --preview --allow-short` prints no problems; every C10 warning on these ids was read and is a
wrong-option lure, not a key tell.

## Totals
| Result | Count |
|---|---|
| PASS (p1 and p3 stamped) | 64 |
| FAIL | 18 |
| CONTESTED | 0 |

Kinds of failure: 9 shared scenes or repeated tests, 4 key-form or option-family problems, 3 accuracy errors in why
lines or flags, 1 invalid BEST set-up (also an accuracy slip), 1 deciding detail that gives the answer away.

Heads-up for the coordinator: three FAILs still hold CURRENT p1 and p3 stamps from the earlier passes
(b6050128.7, 218c54fb.8, 2b388cf0.7). They will drop out once the writer changes them; until then they are not
blocked by these two stamps.

Writer flags checked: 14edb9e6.7 vs .3 (FAIL, see row); 2dbfd6d2.6 too direct (FAIL); 218c54fb.7 rests on "roles with
groups" (the chapter states it and it is not contested, but the question FAILs on form); 4464ac34.8 crash rating
(supported by the chapter's Bollards section; the question FAILs on one why line); 0b16de98.2 vs .1 and 4810105c.5
(PASS: a definition and a scenario on one card, and 4810105c.5 runs the other way); 1d176e79.8 vs 2b388cf0.6 (PASS:
another decoy and another ask).

## Per question
| Id | Result | What and why (FAIL: problem, then proposed fix) |
|---|---|---|
| i1-2-dddf60a9.2 | PASS | Hashing detects change, even by permitted staff; access controls ruled out by the stem. |
| i1-2-dddf60a9.5 | PASS | Disclosure = confidentiality; accounting is an AAA neighbor, not a triad goal. |
| i1-2-dddf60a9.7 | PASS | Encryption in transit = confidentiality; hash, signature, redundancy each fail "unable to view". New scene, no 1.1 copy. |
| i1-2-dddf60a9.9 | PASS | Hashing and signatures detect change; three availability distractors. Same lesson as .2 but another situation (exchange between two offices, select TWO). |
| i1-2-b6050128.3 | PASS | Hash = integrity, not origin (card key point). |
| i1-2-b6050128.4 | PASS | Shared key cannot single out an officer; signature can (chapter scenario). |
| i1-2-b6050128.7 | FAIL | Renamed copy of b6050128.2: a named person sends a document, an outside party must be able to prove who sent it, key a digital signature, hash and encryption as distractors. Fix (writer): another non-repudiation situation whose deciding detail is not "prove the sender of a message", or merge into .2 and write a new question. |
| i1-2-b6050128.9 | PASS | Signature provides it; depends on the private key staying private; HMAC, hash, encryption do not. |
| i1-2-0a8d33e2.4 | PASS | Chapter: "accounting collects records; auditing reviews them"; runner Accounting honestly partly true. |
| i1-2-f3ff4328.0 | PASS | Know + have = MFA; the rest one factor type or identification. |
| i1-2-f3ff4328.8 | PASS | Two biometrics are one factor type, so single-factor. New scene, distinct from .3. |
| i1-2-bcae1bd8.2 | FAIL | Accuracy: the key why ("Checking that a device holds a certificate from the internal CA verifies the device itself") and the explain say presenting a certificate proves the device; the chapter's Common confusions and bcae1bd8.5 teach that a certificate alone proves nothing until the device shows it holds the private key. Fix: why A "A certificate from the internal CA, plus proof that the camera holds its private key, verifies the device itself"; explain likewise ("present a certificate from the organization's CA and prove they hold its private key"). |
| i1-2-218c54fb.6 | PASS | Authorization only after authentication (chapter AAA order). |
| i1-2-218c54fb.7 | FAIL | Format: the key "It is a common way to put a role in place" is the only option repeating the stem's "role" and the only judgment statement ("common") among three mechanism statements, so it stands out. "Roles implemented with groups" is in the chapter and not contested. Fix (writer, changes option meaning): four parallel mechanism options about the group and the role, e.g. key "The group carries the role's rights to its members", wrong "Each member gets the role's rights one by one", "The group proves each member's identity", "The group records what each member does"; keep clear of 218c54fb.3's removal scene. |
| i1-2-218c54fb.8 | FAIL | Renamed copy of 218c54fb.3 in artifact form: a user is removed from the group or role and loses every right at once. Fix (writer): keep the artifact but test another fact, e.g. lpatel also holds one direct per-user grant, and the ask is which rights remain after the removal (only the direct one), which shows why direct grants do not scale. |
| i1-2-11f54fd8.8 | PASS | posture=noncompliant explains the DENY; location wording fixed in pass 1 holds. |
| i1-2-d7797bd7.4 | PASS | Control plane configures enforcement points (card definition). |
| i1-2-d7797bd7.8 | PASS | Risk scoring, rule store, session broker = control plane; edge proxy = PEP. |
| i1-2-b7e50561.7 | FAIL | Format: three options read "The <thing> each person <verb>" and the key reads "Each person's tie to the company", the odd one out in form. Fix (wording only): key "The tie each person has to the company". Also see b241c9e1.4 (shared scene). |
| i1-2-b7e50561.8 | FAIL | Shares b7e50561.4's policy (low proceeds, medium fresh MFA, high blocked) and only asks to read the table, so it needs no card knowledge; the artifact form does not make it a new situation (the standard pass 3 applied to f3ff4328.8). Fix (writer): an artifact that tests adaptive identity itself, e.g. two requests identical except one signal, asking which signal raised the score. |
| i1-2-380bde66.3 | PASS | Reach limited to one app = threat scope reduction (chapter scenario). |
| i1-2-479731d1.1 | PASS | The Policy Engine evaluates the policies (card key point, chapter). |
| i1-2-479731d1.6 | FAIL | Format: the wrong options are off-topic attributes ("Fewer servers are needed for billing", "Traffic is encrypted between every system", "Users can skip verification after one login"), each failing only because "nothing in the stem concerns" it; and the scene (an auditor reads the decision log for why access was granted) repeats d12236b3.3. Fix (writer): another benefit scene, with real neighboring benefits of policy-driven access control as wrong options (the same answer everywhere, changes apply everywhere at once, no trust from network location) and a detail only one of them meets. |
| i1-2-2ba8977f.6 | PASS | PDP = PE plus PA (chapter PE and PA sections, SP 800-207). Note: `source.card` names the PA card's keyPoints, which do not state the PDP; the PA chapter section does. |
| i1-2-2ba8977f.7 | PASS | One service, still two roles (card key point). |
| i1-2-d12236b3.3 | PASS | The Policy Engine logs each decision (card, SP 800-207 sec. 3). |
| i1-2-d12236b3.6 | FAIL | Renamed copy of d12236b3.2: a request is refused and the ask is which component made the refusal decision (key Policy Engine); only the input changes (HR record instead of missing patches), and d12236b3.4 does the same with a threat feed. Fix (writer): a Policy Engine question with another ask, e.g. which component the HR feed must be connected to so a departure takes effect on the next request. |
| i1-2-14edb9e6.5 | PASS | Application traffic through the gateway is data plane; PA instructions, rules and risk scores are control plane. |
| i1-2-14edb9e6.7 | FAIL | Shared scene: placing items on the company's Zero Trust diagram with the data plane as answer repeats 14edb9e6.3 (four parts, which plane holds them), 14edb9e6.8 (component table) and b241c9e1.7 (requester and device on the diagram). Fix (writer): a data plane question not about placement, e.g. user traffic grows tenfold while policy changes stay rare: which plane must carry the extra load. |
| i1-2-0b9395bf.7 | PASS | Everything behind one PEP is one implicit trust zone; contained at the other gateways. |
| i1-2-b241c9e1.2 | PASS | A non-human service is a subject (chapter Common confusions). |
| i1-2-b241c9e1.4 | FAIL | Shared scene with b7e50561.7: two people (a permanent one and a seasonal or contract one) on one shared, managed device get different outcomes, and the ask is what explains the difference. Fix (writer): another subject/system situation, e.g. one user on two devices (a managed laptop allowed, a personal phone limited), asking what differed; keep clear of 11f54fd8.8. |
| i1-2-2dbfd6d2.2 | PASS | Holding connections until told = PEP. |
| i1-2-2dbfd6d2.4 | PASS | A PEP can be split into a client agent and a resource gateway (chapter, SP 800-207). Note: same layout as 2ba8977f.5, different ask; kept. |
| i1-2-2dbfd6d2.6 | FAIL | The detail "taken from a component that every session's traffic crosses" defines the answer and repeats the fact 14edb9e6.6 tests (what every request passes through). Fix: drop that clause so the need is "live traffic counts for every approved session to the artwork server"; the learner must then know the PEP monitors sessions in the path while the PE and PA stay off it (detail becomes "live traffic counts for every approved session"). |
| i1-2-4810105c.2 | PASS | A guard checking IDs belongs at the building entrance ring (chapter layering). |
| i1-2-4810105c.6 | PASS | A fence only delays; delay is worth something only with detection and response (chapter Fencing). Note: bbe3e8cc.5 teaches "a fence detects nothing" in another situation. |
| i1-2-4810105c.7 | PASS | Bollards inside a corridor face no vehicle; the other rings match the chapter's ring list. |
| i1-2-4810105c.8 | FAIL | Invalid BEST and an accuracy slip. The one requirement (still slowed or caught if any one control fails) is failed outright by every single control, so the three `partly` flags are wrong and runner A was picked by taste (B and C are no weaker). "Crash-rated" is a vehicle-barrier rating, not a door rating. Fix: word "" and ask "Which of the following plans meets this requirement?", remove partly, runner and edge; option A "One reinforced steel door". |
| i1-2-4464ac34.8 | FAIL | Accuracy: option D's why ("The two offers look alike, so the spacing is the same") is a false inference; spacing is set when the posts are installed, not by the product or its testing. Crash testing itself is supported (chapter Bollards). Fix: why D "Spacing is set when the posts are installed; testing tells whether a post holds, not how far apart posts stand." |
| i1-2-a47c7ca5.0 | PASS | Two interlocked doors; bollards, a sign-in desk and a single badge door fail. |
| i1-2-bbe3e8cc.9 | PASS | Cameras and sensors detect a crossing; wire, panels and height only delay or hide. |
| i1-2-0b16de98.0 | PASS | Cameras that watch and record. |
| i1-2-0b16de98.2 | PASS | Recordings serve review and evidence after an event (detective). A definition (.1) and a scenario on one card is the normal pattern; 4810105c.5 corrects the other way. |
| i1-2-84be52e0.2 | PASS | Judgment on an unlisted visitor = guard (chapter scenario). |
| i1-2-84be52e0.6 | PASS | Real-time response needs a person on site. |
| i1-2-84be52e0.8 | PASS | A reader checks the card; a guard checks the face against the photo (chapter). |
| i1-2-7daeebda.0 | PASS | An ID card that unlocks doors. |
| i1-2-7daeebda.6 | PASS | Only badges meet all three requirements; keys and cameras each meet one, runner keys with a sourced edge. |
| i1-2-7daeebda.8 | FAIL | Format: the key "The readers checked a card, not who walked in" is the only "X, not Y" contrast among plain statements, the same tell pass 3 removed from b6050128.3. Fix (wording only): "The readers checked only the card that was tapped". |
| i1-2-1d27ddab.2 | PASS | Dark footage is fixed by light, not more cameras (chapter scenario). |
| i1-2-1d27ddab.7 | FAIL | Repeats 1d27ddab.9: the proposal lines (light blocks entry, clear footage, intruders feel seen) are the same claims .9 offers as options, so both test "lighting deters and helps cameras, it blocks nothing". Fix (writer): another lighting fact for the artifact, e.g. a plan with bright but uneven light that leaves a deep shadow along the back wall, asking for its weakness (chapter: keep lighting even). |
| i1-2-1d27ddab.8 | PASS | Light helps guards and cameras at once; infrared cameras help only the recording (honest runner). |
| i1-2-1d27ddab.9 | PASS | Deters and clears footage; blocks, records and stops vehicles do not. |
| i1-2-92e8e207.3 | PASS | A floor mat senses weight. |
| i1-2-b1e0e898.0 | PASS | Infrared senses changes in heat. |
| i1-2-b1e0e898.5 | PASS | PIR coverage follows where it is aimed (chapter); microwave would reach further. |
| i1-2-b1e0e898.8 | FAIL | Pass 3 (d): the pressure sensor meets requirements 2 and 3 (no wall sensing, sends nothing), as partly true as the flagged ultrasonic option, but is not flagged `partly`. Accuracy: the key why says passive infrared "covers the room", while 3fd5834e.5 and the chapter teach that PIR zones can leave gaps an ultrasonic unit fills. Fix: mark option C `partly: true` (why "A mat sends nothing and ignores the hall, but it senses one spot, not movement anywhere in the room"); key why "Passive infrared senses movement across the room, does not sense through the wall and sends out nothing". |
| i1-2-1227072e.5 | PASS | A heavy object on a mat keeps it triggered; still objects do not change Doppler echoes. |
| i1-2-cd158454.0 | PASS | Sends microwave (radio) pulses, reads reflections. |
| i1-2-cd158454.2 | PASS | Whole-floor motion in a large hangar = microwave among these options. |
| i1-2-cd158454.5 | PASS | Moving metal reflects strongly (chapter). |
| i1-2-cd158454.6 | PASS | Microwave passes wood; PIR and ultrasonic stay in the bay. |
| i1-2-cd158454.7 | PASS | Range cut and re-aim stop motion sensed beyond the room. |
| i1-2-cd158454.8 | PASS | Metal blocks microwaves and leaves a blind area. |
| i1-2-cd158454.9 | PASS | Reflected signals; passes glass and drywall, not metal. |
| i1-2-3fd5834e.5 | PASS | Ultrasonic fills an enclosed room and stays inside plywood; microwave passes it. |
| i1-2-3fd5834e.6 | PASS | Drafts disturb ultrasonic units; seal openings (chapter). |
| i1-2-3fd5834e.8 | FAIL | Renamed copy of cd158454.4: a buyer weighs two offered motion sensors, one using sound and one radio waves; .8 asks the medium from the names, cd158454.4 the name from the medium. Fix (writer): another situation for the sound vs radio contrast that is not a purchase between two offered units. |
| i1-2-16c4c6d2.1 | PASS | Decoys have no legitimate users. |
| i1-2-16c4c6d2.8 | PASS | Planted key used from outside = honeytoken stage; the others match their decoys. |
| i1-2-f7da1d02.0 | PASS | One decoy system that looks like a real target. |
| i1-2-f7da1d02.6 | PASS | One decoy system, physical or virtual, rules out a honeynet. |
| i1-2-36635eb8.6 | PASS | Findings feed detection rules (chapter Honeynet step 5); blocking addresses is the honest runner. |
| i1-2-36635eb8.9 | PASS | Costlier to keep believable; can be virtual on one host. |
| i1-2-2b388cf0.2 | PASS | Tempting file, fake contents, alert on open = honeyfile. |
| i1-2-2b388cf0.5 | PASS | Alert on opening = honeyfile; honeytoken honestly partly (canary documents), edge settled by the chapter's comparison table. |
| i1-2-2b388cf0.7 | FAIL | Renamed copy of 16c4c6d2.7: an analyst reads one decoy alert or audit event and the ask is why it signals an intruder, key "nothing legitimate ever touches the decoy". Fix (writer): keep the audit event but ask a honeyfile fact, e.g. which watching method produced it (file auditing on the server, per the chapter's step 3). |
| i1-2-2b388cf0.8 | PASS | Bait goes where an intruder looks (chapter step 2). |
| i1-2-1d176e79.1 | PASS | A honeytoken shows where stolen data went. |
| i1-2-1d176e79.5 | PASS | Theft noticed only where the data turns up = honeytoken; honeyfile honestly partly. |
| i1-2-1d176e79.8 | PASS | Without monitoring and an alert, a honeytoken detects nothing; the stem rules out the other steps. |

Stamped p1 and p3 (each run twice) on the 64 PASS ids. The 18 FAIL ids were not stamped.
