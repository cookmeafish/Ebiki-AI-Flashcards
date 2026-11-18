# Question bank 1.2, round 4: passes 1, 3 and 4 on the 17 rewritten questions

Reviewer: an agent that did not write, edit or earlier review these questions. Date: 2026-11-17. File
`dev/careers/sources/security-plus-sy0-701/bank/1-2.json`, read against all 360 questions of 1.2 and the 120 of
`bank/1-1.json` for shared scenes. No question was edited; the question file had no change while it was read and
stamped. Related: [writer fixes round 4](bank-1-2-fixes-round4.md), [round 3](bank-1-2-round3.md),
[pass 4](bank-1-2-pass4.md), [the plan](../plans/2026-11-16-exam-format-questions.md) (B3, B4 with CONTESTED, D2.1,
C1 to C23).

## Sources read this round
- The 1.2 cards in `public/careers/security-plus-sy0-701.json`, the 1.2 lesson order (areas[0].lessons), and the
  chapter `public/careers/security-plus-sy0-701/knowledge/d1.md` (Authorization models, control plane vs data plane,
  Subject and system, Security lighting, the four sensor sections and their comparison, Honeypot, Honeyfile,
  Honeytoken, deception compared).
- NIST SP 800-207 full text (https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-207.pdf): §2 subjects
  are "end users, applications and other non-human entities"; §2.1 "authorized and approved subjects (combination of
  user, application (or service), and device)"; §3 PA "establishing and/or shutting down the communication path ...
  (via commands to relevant PEPs)", PEP "enabling, monitoring, and eventually terminating connections"; "the data
  plane is used for actual communication between software components"; the ZTA cycle includes "continually
  reevaluating trust in ongoing communication".
- NIST CSRC glossary, honeypot (https://csrc.nist.gov/glossary/term/honeypot): CNSSI 4009-2022 from RFC 4949, "A system
  (e.g., a web server) or system resource (e.g., a file on a server) that is designed to be attractive ...".
- https://en.wikipedia.org/wiki/Honeytoken: "honeytokens are honeypots that are not computer systems"; examples are
  records, accounts and email addresses, no file or document.
- https://en.wikipedia.org/wiki/Motion_detector: passive infrared "No energy is emitted from the sensor"; an active
  detector "contains ... a transmitter"; ultrasonic sound "higher than a human ear can hear".
- Not read: Spitzner's 2003 honeytoken article (it may count a spreadsheet as a honeytoken); not used to fail anything.

Build: `node dev/careers/build-bank.mjs security-plus-sy0-701 --preview --allow-short` prints `no problems`. Every C10
warning on these ids (218c54fb.2, b241c9e1.4/.5/.8, 1d27ddab.2, 3fd5834e.7, 1d176e79.3) was read: each is a lure in a
wrong option, none a key tell.

## Totals
| Result | Count |
|---|---|
| PASS on all three passes (p1, p3, p4 stamped, each run twice) | 12 |
| FAIL | 5 |

Error rate this round: 5 / 17 = 29%. Two of the five are the same issue: a term from a later objective (File
integrity monitoring, card i4-5-4e1f521b) given `item: null`.

## The two contested points (held)
- Honeypot can be a single decoy resource (CNSSI 4009 / RFC 4949; d1.md "or a single decoy resource on a system"). No
  remaining option among the 17 calls a file or an account a honeypot. One why line and one explain still state the
  definition as exclusive: f7da1d02.0 (FAIL below).
- SP 800-207 §2.1 treats the authorized subject as user plus application plus device. The b241c9e1 questions now ask
  about concrete things (account, device, host state) except .3, which keeps the card's own labels; there every other
  option puts the engineer as the system or the tablet as the resource, which no source does, so one defensible
  answer remains (PASS, see the row).

## Writer's "still weak" notes, judged
- b241c9e1.3 (label question): acceptable. The labels are the card definition's; the wrong options are impossible under
  both readings of "subject".
- "Service account" (1d176e79.3, level 1, `item: null`): fair. It is no card in the package, and the chapter teaches it
  in the Subject and system section (lesson 7, before the honeytoken lesson); it fails the stem plainly (never used).
- "File integrity monitoring" (`item: null`): NOT fair as set. It is a real card, i4-5-4e1f521b (objective 4.5), so
  `null` ("no card") is wrong data everywhere it appears, and at level 1 (2b388cf0.2) it puts a later objective's term
  in a lesson-ready question, which C16 exists to stop (C16 cannot see it because of the `null`).

## Per question (P1 accuracy and CONTESTED, P3 clarity and format, P4 primary source)
| Id | P1 | P3 | P4 | What and why | Source |
|---|---|---|---|---|---|
| i1-2-218c54fb.2 | PASS | PASS | PASS | Two stated requirements; each wrong option fails one (A, C: change per picker; B: traceability). IBAC contest gone: per-user grants now fail a stated need, not "not a model". Key is slightly the longest (46 vs median 42), under C11. | d1.md Authorization models; CSRC IBAC (pass 4) |
| i1-2-14edb9e6.7 | FAIL | PASS | FAIL | Option A why "decides once per request" conflicts with SP 800-207 ("continually reevaluating trust in ongoing communication"). Key and the rest are right; options now parallel. Fix: A why "The Policy Engine sits on the control plane and makes access decisions; no video passes through it, and the number of sessions stays the same." | SP 800-207 §2.1, §3 (PA, PEP, data plane) |
| i1-2-b241c9e1.3 | PASS | PASS | PASS | Card's own labels; A (engineer as system), B (tablet as resource), C (engineer as resource) are impossible under every reading, so one answer. One-sentence stem with role, organization, detail. | Card b241c9e1 definition; SP 800-207 §2, §2.1 |
| i1-2-b241c9e1.4 | PASS | PASS | PASS | Concrete options; same account, same app, gateway enforces only, so the device explains the difference. Uncontested under the user+device reading. | SP 800-207 §2.1, §3 (PEP); d1.md Subject and system |
| i1-2-b241c9e1.5 | PASS | PASS | PASS | Each "Only" option fails the half of the warning it ignores. Easy for level 2 (the stem nearly states it) but fair. | d1.md Subject and system (Why it matters) |
| i1-2-b241c9e1.6 | PASS | PASS | PASS | A why no longer rests on the subject/system split. C (control plane) false per the chapter table. | SP 800-207 §2 (non-human subjects); d1.md control plane vs data plane |
| i1-2-b241c9e1.8 | PASS | PASS | PASS | Record shows host state; A, B, D are real decision inputs the record does not show. Related to .2 (a service account requesting write) but asks another thing. | d1.md Subject and system (How it works step 2, Example) |
| i1-2-1d27ddab.2 | PASS | PASS | PASS | "Same model" closes the infrared-camera loophole. Lighting improves camera images; fence and badges do not. | Card 1d27ddab key points; d1.md Security lighting |
| i1-2-b1e0e898.8 | PASS | PASS | PASS | Key "Passive infrared sensor"; edge now true (the mat is distinguished by area). Every partly flag right. BEST wording is borderline (only one option meets all three) but the runner meets two of three and the edge is settled by the chapter. | Motion detector article; d1.md sensors comparison table |
| i1-2-cd158454.0 | PASS | PASS | PASS | B why now says passive infrared. Microwaves are radio waves. Key a little longer than the median (54 vs 43), under C11. | Card cd158454 definition; Motion detector article |
| i1-2-3fd5834e.7 | PASS | PASS | PASS | New fact (active vs passive), not .2's identification. Each wrong claim is true of ultrasonic per the chapter. Note: artifact type "output" for a product sheet is loose ("config" would read better); not misleading. | d1.md Ultrasonic sensors, comparison table; Motion detector article |
| i1-2-16c4c6d2.4 | PASS | PASS | PASS | Explain says "usually one decoy system". Honeyfile and honeytoken have `item: null` at level 1, but this card's own definition and key points teach them, so fair. Same flash-card / cheat-sheet template as 92e8e207.8 on another card and content; not a renamed scene. | CSRC honeypot (CNSSI 4009); card 16c4c6d2; d1.md deception compared |
| i1-2-f7da1d02.0 | PASS | PASS | FAIL | Key is the only defensible option. But B's why ("A honeypot is a single decoy system ...") and the explain ("A honeypot is a single decoy system ...") state the definition as exclusive, which CNSSI 4009 / RFC 4949 and d1.md contradict (a single decoy resource can be one); 16c4c6d2.4 was hedged for exactly this. Fix: B why "A honeypot is a decoy, usually one whole system, that looks valuable and is built to attract and study attackers."; explain "A honeypot is a decoy, usually a single system, that looks like a real, valuable target, so attackers who touch it can be watched and studied." | CSRC honeypot; d1.md Honeypot (Common confusions) |
| i1-2-2b388cf0.2 | FAIL | FAIL | PASS | Honeypot contest gone. But option C "File integrity monitoring" is card i4-5-4e1f521b (objective 4.5), marked `item: null`: at level 1 this puts a term no 1.2 lesson teaches into a lesson-ready question (the C16 rule, bypassed by the null). Needs the writer: replace C with a wrong option from this or an earlier 1.2 lesson that plainly fails (e.g. "Deception and disruption technology" is NOT usable: it is right too), or a plain description in the same form; or move the question to level 2 with `item: "i4-5-4e1f521b"` if the card keeps 2 d and 2 s at level 1. | Package lesson order; card i4-5-4e1f521b; d1.md Honeyfile |
| i1-2-2b388cf0.5 | PASS | FAIL | PASS | Facts and edge right; BEST justified (honeytoken partly). Option C "File integrity monitoring" has `item: null` though it is card i4-5-4e1f521b. Fix: `item: "i4-5-4e1f521b"` (level 2, so C16 does not apply). | d1.md Honeyfile, Honeytoken; card i4-5-4e1f521b |
| i1-2-1d176e79.3 | PASS | PASS | PASS | Decoy account = fake credential = honeytoken. "Service account" is a fair level 1 neighbor (taught in the 1.2 chapter, no card), fails plainly. | Card 1d176e79; Honeytoken article (fake accounts); d1.md Honeytoken |
| i1-2-1d176e79.5 | FAIL | FAIL | FAIL | (1) Edge "A honeyfile can also point to theft, but only when it is opened inside" and C's why "alerts when it is opened inside" are false per d1.md Honeyfile step 3: content inside the file that calls back when opened alerts wherever the copy is opened. (2) A "File integrity monitoring" has `item: null` though it is card i4-5-4e1f521b, and "when the records change" is loose (FIM watches files). Fix: C why "A honeyfile alerts when that one decoy file is opened, not when copied employee records are used or seen elsewhere."; edge "A honeyfile alerts only on that one decoy file; fake records planted among the real ones are noticed wherever the copied data turns up."; A `item: "i4-5-4e1f521b"`, why "File integrity monitoring alerts when watched files change inside, not when copies turn up somewhere else." | d1.md Honeyfile (How it works step 3), Honeytoken; card i4-5-4e1f521b |

## Stamped
p1, p3 and p4 (each run twice) on the 12 PASS ids: i1-2-218c54fb.2, i1-2-b241c9e1.3, i1-2-b241c9e1.4,
i1-2-b241c9e1.5, i1-2-b241c9e1.6, i1-2-b241c9e1.8, i1-2-1d27ddab.2, i1-2-b1e0e898.8, i1-2-cd158454.0,
i1-2-3fd5834e.7, i1-2-16c4c6d2.4, i1-2-1d176e79.3.
Not stamped: i1-2-14edb9e6.7, i1-2-f7da1d02.0, i1-2-2b388cf0.2, i1-2-2b388cf0.5, i1-2-1d176e79.5.

## Outside this round's scope, worth a sweep
- Any other option across the bank carrying a real card's term with `item: null` (FIM was introduced this round in
  three places; others were not searched).
- Other why lines or explains stating "a honeypot is a single decoy system" as the definition (the writer kept
  "decoy server = honeypot" whys, which are fine, but an exclusive definition line would fail like f7da1d02.0).
- Other honeyfile whys claiming a honeyfile alerts "only inside", against d1.md's call-back content.

## Not done or not verified
- No edits, no commit. Spitzner's honeytoken article was not read.
