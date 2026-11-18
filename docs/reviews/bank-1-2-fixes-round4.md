# Question bank 1.2: writer fixes, round 4

Writer pass, 2026-11-17. File: `dev/careers/sources/security-plus-sy0-701/bank/1-2.json`. Inputs:
[round 3](bank-1-2-round3.md) "the 5 fails", [pass 4](bank-1-2-pass4.md) "Round 2 (64 questions)", and the two
contested points found there (honeypot can be a single decoy resource; NIST SP 800-207 §2.1 treats the subject as user
plus application plus device). Nothing is stamped and nothing is committed. Every changed question has `rev` raised by
one; id, slot, card, kind, level, pick and cardSig are unchanged, and every key stays at the same letter.

Build: `node dev/careers/build-bank.mjs security-plus-sy0-701 --preview --allow-short` prints `no problems` (only C10
warnings on wrong options, which reviewers read in pass 3).

## A. The 11 listed fixes
| Id | Rev | What changed | Why |
|---|---|---|---|
| i1-2-b1e0e898.8 | 3 to 4 | Key text "Passive infrared sensor"; edge now "passive infrared sends out nothing and, unlike a mat, senses movement across the room". | Active infrared transmits, so bare "Infrared sensor" was contested where emission decides; the old edge was false (the mat also sends nothing). |
| i1-2-b241c9e1.4 | 3 to 4 | Options now concrete: "The account that made the request", "The device the request came from" (key), "The app being requested", "The gateway in front of the app"; whys and explain rewritten. | The key rested on the subject being the account alone, contested by SP 800-207 §2.1. |
| i1-2-218c54fb.2 | 2 to 3 | Stem states two requirements (each picker's actions traceable; a later change reaches all pickers at once); ask "meets these requirements"; detail and every why now name the requirement each option fails. | The old ask was met by the shared account and arguably by copied rights. |
| i1-2-14edb9e6.7 | 3 to 4 | Plane labels dropped from the options ("The Policy Engine", "The enforcement gateways", "The Policy Administrator", "The policy rule store"); the planes moved into the why lines. | The key was the only option labelled "data plane": odd one out. |
| i1-2-3fd5834e.7 | 2 to 3 | New artifact question: a draft sheet for an ultrasonic detector with one pasted claim from another kind of sensor ("Type: passive (no output)"); ask which claim is wrong; options are the four claims in parallel form, key "That it sends out nothing at all". | The old one repeated .2's identification (tone above hearing) in artifact form. Active vs passive was not yet tested on this card. |
| i1-2-f7da1d02.0 | 2 to 3 | Options C and D replaced with "A live server that runs real business services" and "A filter that blocks attackers at the network edge". | A fake document can be a honeypot (CNSSI 4009 / RFC 4949); a fake credential is arguably a "system resource" too. The new wrong options are plainly wrong for any honeypot. |
| i1-2-2b388cf0.2 | 2 to 3 | Option C "Honeypot" replaced with "File integrity monitoring" (item null). | A decoy file can be called a honeypot. |
| i1-2-2b388cf0.5 | 2 to 3 | Option C "Honeypot" replaced with "File integrity monitoring" (item null). | Same. |
| i1-2-cd158454.0 | 2 to 3 | Option B why: "Receiving heat and sending nothing is how a passive infrared sensor works." | Bare "infrared" is not always passive. |
| i1-2-1d27ddab.2 | 2 to 3 | Option B "More cameras of the same model in the yard"; why "Cameras like the existing ones still record unusable images in the dark." | Infrared or low-light cameras would make "more cameras" a second fix. |
| i1-2-16c4c6d2.4 | 1 to 2 | Option A "Honeypot: one live production server" (why: a honeypot has no real users or services); explain now "Pot = usually one decoy system ...". | "Honeypot: one fake document" is accurate under the glossary. |

## B. Sweep of all 360
**Honeypot.** Every question naming a honeypot was read (all of cards 16c4c6d2, f7da1d02, 36635eb8, 2b388cf0,
1d176e79). Beyond the ones above, two more rested on "a honeypot is a whole system" beside a single decoy resource:
| Id | Rev | What changed | Why |
|---|---|---|---|
| i1-2-1d176e79.3 | 1 to 2 | Option C "Honeypot" replaced with "Service account" (item null; a real account a program uses, while this one is never used). | The scene is one decoy account; under RFC 4949 a single decoy resource can be a honeypot, so the old why ("a whole decoy system") was contested. |
| i1-2-1d176e79.5 | 2 to 3 | Option A "Honeypot" replaced with "File integrity monitoring" (item null). | The old why said a honeypot catches contact with "a decoy system"; the replacement fails the stated need plainly. |

Left as they are, read and judged sound: honeypot as the key for a decoy server (f7da1d02.3, .6), honeypot beside a
honeynet scene (36635eb8.2, .7), and "decoy server = honeypot" whys in honeyfile and honeytoken questions where the
wrong option is a server (2b388cf0.0, .1, .3, .7; 1d176e79.0, .1, .9).

**Subject vs system.** Every question naming a subject was read. Card b241c9e1 had the label-based keys; the
"Subject/system" combined label elsewhere (planes, PEP, PE, PA questions) is uncontested and was left.
| Id | Rev | What changed | Why |
|---|---|---|---|
| i1-2-b241c9e1.5 | 1 to 2 | Options now "Only the account signing in", "The account and the laptop together" (key), "Only the laptop the request comes from", "Only the app being requested". | "Only the subject" vs "both subject and system" depends on whether the device is part of the subject. |
| i1-2-b241c9e1.8 | 1 to 2 | New ask: which input the record shows was evaluated along with the service account. Key "The state of the host it came from"; wrong options are other real decision inputs the record does not show (a person's multifactor sign-in, a threat feed verdict, network location). Mark removed. | The old key "The system" vs "The subject" for the host rested on the contested label. |
| i1-2-b241c9e1.6 | 1 to 2 | Option A why: "People and services request access as subjects too, so subjects are not only devices." | The old why said "Devices are the system", resting on the contested split. The key (services can be subjects) is uncontested. |
| i1-2-b241c9e1.3 | 1 to 2 | Option A why: "The engineer is the person requesting access, so the engineer is never the system." | The old why ("the device is the system") argued from the split; A is wrong anyway because a person is never the system. Key unchanged (the chapter's own labels; no source calls the engineer the system). |

Still a label question and worth a reviewer's look: b241c9e1.3 (key "Engineer: subject; tablet: system"). It has one
defensible answer because every other option puts the engineer or the tablet in an impossible role, but a reviewer may
prefer it rewritten to the concrete form like .4.

## C. Bare "Infrared sensor"
Every option reading bare "Infrared sensor" was read (0b16de98.7, 84be52e0.5, 1d27ddab.3, .6, 92e8e207.6, .7, .8,
b1e0e898.2, .4, 1227072e.2, .3, .5, .8, cd158454.3, .6, 3fd5834e.5). None turns on emitting nothing; they turn on heat,
sight lines, glass, walls, area or identification, which both kinds of infrared settle the same way. Only b1e0e898.8
needed "Passive" (done above).

## Changed ids (17)
i1-2-b1e0e898.8, i1-2-b241c9e1.3, i1-2-b241c9e1.4, i1-2-b241c9e1.5, i1-2-b241c9e1.6, i1-2-b241c9e1.8,
i1-2-218c54fb.2, i1-2-14edb9e6.7, i1-2-3fd5834e.7, i1-2-f7da1d02.0, i1-2-2b388cf0.2, i1-2-2b388cf0.5,
i1-2-cd158454.0, i1-2-1d27ddab.2, i1-2-16c4c6d2.4, i1-2-1d176e79.3, i1-2-1d176e79.5.

## Not done or not verified
- No stamps (reviewers stamp). No commit.
- No new web source was read this round; the fixes rest on the sources logged in round 3 and pass 4 and on d1.md.
- "Service account" (1d176e79.3) and "File integrity monitoring" (2b388cf0.2/.5, 1d176e79.5) are terms outside 1.2's
  lessons, so they carry `item: null`; the build accepts this at level 1 (C16 passes), but a reviewer should confirm
  they read as fair neighbors.

## Round 5
Writer fixes for the 5 failures in [round 4](bank-1-2-round4.md), plus a sweep of all 360 questions. Build
(`--preview --allow-short`): `no problems`. Not stamped, not committed.

### A. The five failures
- i1-2-14edb9e6.7 (rev 5): option A why no longer says the Policy Engine decides "once per request" (SP 800-207
  re-evaluates trust during a session); now "makes access decisions; no video passes through it".
- i1-2-f7da1d02.0 (rev 4): B why and explain no longer define a honeypot as only a single system; now "a decoy,
  usually one whole system" (CNSSI 4009 / RFC 4949 and d1.md allow a single decoy resource).
- i1-2-2b388cf0.2 (rev 4, level 1): option C "File integrity monitoring" (card i4-5-4e1f521b, objective 4.5, was
  `item: null`) replaced by "Decoy server" with `item: "i1-2-f7da1d02"` (honeypot, lesson 15, earlier than the
  honeyfile lesson 16). It fails plainly: the stem's thing is a single file on a share, not a server. Not "Honeypot",
  since a file can itself count as a honeypot under RFC 4949.
- i1-2-2b388cf0.5 (rev 4): option C keeps "File integrity monitoring", now `item: "i4-5-4e1f521b"` (level 2).
- i1-2-1d176e79.5 (rev 4): edge and option C why no longer say a honeyfile alerts only when opened "inside"
  (call-back content alerts wherever a copy is opened, d1.md Honeyfile step 3); they now say it alerts only on that one
  decoy file, not on the copied records. Option A `item: "i4-5-4e1f521b"`, why "watched files change inside".

### B. Sweep of all 360
- Honeypot defined as only a single system: one more hit, i1-2-f7da1d02.3 (rev 2) explain "A honeypot is one decoy
  system" now "a single decoy, usually one system as here". Lines that say a decoy SERVER or SYSTEM is a honeypot
  (that direction is true), and "a honeypot is one decoy" (36635eb8.7), were left as they are.
- Honeyfile alerting only inside the network: no other hit (searched honeyfile, decoy file, decoy document, inside).
- Policy Engine deciding once per request: no other hit; "evaluates each request" lines make no "once" claim.
- C16 (a course card's name with `item: null`): only the three FIM options above; all fixed.

### Changed ids (6)
i1-2-14edb9e6.7, i1-2-f7da1d02.0, i1-2-f7da1d02.3, i1-2-2b388cf0.2, i1-2-2b388cf0.5, i1-2-1d176e79.5.

### Still weak
- The key of i1-2-f7da1d02.0 still reads "One decoy system made to look like a real target"; it is the best of the four
  and the others are plainly wrong, but it is the common case, not the full definition.
- "Decoy server" (2b388cf0.2) is a plain description pointing at the honeypot card; a reviewer should confirm it reads
  fairly beside Honeyfile, Honeytoken and Honeynet.
