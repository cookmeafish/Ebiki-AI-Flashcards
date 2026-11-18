# Question bank 1.3, review B: pass 1 (accuracy, CONTESTED) and pass 3 (clarity, format) on the last 10 cards

Related: [the plan](../plans/2026-11-16-exam-format-questions.md) (B3, B4 with CONTESTED, D2.1, checks C1 to C23),
[1.2 round 2](bank-1-2-round2.md), [round 3](bank-1-2-round3.md), [round 4](bank-1-2-round4.md),
[1.2 pass 4](bank-1-2-pass4.md).

Scope: `dev/careers/sources/security-plus-sy0-701/bank/1-3.json`, cards i1-3-32194154 (Restricted activities) through
i1-3-1ff9c96c (Version control), 100 questions. No question was edited (a writer applies the fixes). Every question
was read against its card, `d1.md` 1.3 sections, the other 110 questions of 1.3 (incl. the umbrella card
i1-3-ba3703a5, TI.5 / TI.7 / TI.8), and every stem of 1-1.json and 1-2.json. Build
(`build-bank.mjs --preview --allow-short`): no problems; every C10 warning in this part was looked at (all are a stem
word echoed by a wrong option, a fair trap, none a tell).

## Totals

| Result | Count |
|---|---|
| PASS (p1 and p3 stamped, twice) | 70 |
| FAIL | 30 |
| of which CONTESTED | 1 (1ff9c96c.5) |
| of which factual errors | 2 (14ab29d1.7 minute count, ad3cfe62.5 time zone on an NTP server) |
| of which shared scene or repeated test | 13 |
| of which no role in the stem | 8 |
| of which key or option form / off-family options | 8 |
| needs the writer (new angle, not a wording fix) | 13 |

Several FAILs have more than one reason. Refill need: none dropped; 13 need a new question on the same card.

## Sources (primary, read this session)

- git-scm, "About Version Control" (https://git-scm.com/book/en/v2/Getting-Started-About-Version-Control): "Every
  clone is really a full backup of all the data"; centralized server = single point of failure.
- RFC 5905 (https://www.rfc-editor.org/rfc/rfc5905.html) §4 and §6: NTP timestamps are UTC; NTP carries no time zone.
- systemctl(1) (https://www.freedesktop.org/software/systemd/man/latest/systemctl.html): `is-active` prints the
  current unit state (active, inactive, failed).
- NIST SP 800-53 Rev. 5 CM-5 (https://csf.tools/reference/nist-sp-800-53/r5/cm/cm-5/): access restrictions associated
  with changes; CM-3 (https://csf.tools/reference/nist-sp-800-53/r5/cm/cm-3/): document change decisions, retain
  records, security impact analysis.
- Course: the cards and `public/careers/security-plus-sy0-701/knowledge/d1.md` sections "Restricted activities"
  through "Version control" and "Technical implications of a change compared".

## Rows

| Id | Result | What and why (FAIL: problem, then proposed fix) |
|---|---|---|
| i1-3-32194154.0 | PASS | Definition; four parallel gerund phrases, each a neighbor step. |
| i1-3-32194154.1 | PASS | Term from description; neighbors from earlier lessons (build C16 clean). |
| i1-3-32194154.2 | FAIL | Key odd one out: A, B, C all start "Tighten its access ...", the key alone starts "Raise ...". Fix (wording): A "Tighten its access while she is logged in", B "List it in this change's backout plan", C "Widen this change's scope to cover it" (why: widening scope needs new approval; she cannot do it herself), D key unchanged. |
| i1-3-32194154.3 | PASS | Extra unapproved fix during a firmware change; card example angle. Distinct from TI.7 (which names the implication about people). |
| i1-3-32194154.4 | PASS | Policy exception (small extra step when the task cannot finish, recorded); card key point; options parallel. |
| i1-3-32194154.5 | PASS | Risk reduced = unanalyzed side effects (card key point). |
| i1-3-32194154.6 | FAIL | Key A "Installing the approved patch on the order server" restates the stem; it is the only option repeating "approved patch" and "order server", so half the answer is free. Fix: A "Restarting the order server as the patch required" (why: a restart the approved patch needs is part of the approved work), parallel with B "Restarting the warehouse server to clear a fault". |
| i1-3-32194154.7 | PASS | Artifact; scope line decides; 21:06 restart correctly in scope (d1.md Service restart). |
| i1-3-32194154.8 | FAIL | Repeats .1: the stem phrase "limits what an implementer may do while carrying out an approved change" is .1's definition, and the key restates it ("Implementers do only the work named in the approval"). Fix (writer): keep the AUP contrast (d1.md Common confusions) with a stem that does not define the term, e.g. an auditor reads two handbook rules, one on everyday laptop use and one on change work, and asks which one is restricted activities. |
| i1-3-32194154.9 | PASS | Unrecorded extra edit misleads investigators (d1.md Why it matters). |
| i1-3-14ab29d1.0 | PASS | Definition; change freeze, window, approval record as neighbors. |
| i1-3-14ab29d1.1 | PASS | Term from description; window why correctly says not unusable for all of it. |
| i1-3-14ab29d1.2 | FAIL | Shared scene with i1-3-d1b328e1.3 (approved work done as planned, the affected people were never told, complaints follow); and "told no one" states the key. Fix (writer): another downtime angle, e.g. the window must hold time for the backout so downtime never runs past the agreed end (d1.md Downtime step 5), or an unannounced outage being taken for an attack. |
| i1-3-14ab29d1.3 | FAIL | Option B "Blocking attackers during the work" is off-family (no change step or implication). Fix: B "Limiting the work to the approved scope" (why: a page shown to visitors does not limit what the developer changes). |
| i1-3-14ab29d1.4 | PASS | Failover to standby reduces downtime (card key point). Note: "online grocer" is also d3624c41.7's organization; a rename would be tidy, not required. |
| i1-3-14ab29d1.5 | FAIL | No role (only "a city's parking payment site"); and it repeats TI.5 (ba3703a5.5): both test "downtime is the result, the restart the cause". Fix (writer): another downtime fact (see .2), with a role. |
| i1-3-14ab29d1.6 | PASS | Select TWO: failover and rolling one node at a time; distractors fail the stated goal. |
| i1-3-14ab29d1.7 | FAIL | Accuracy: B "About 15 minutes ... roughly how long webB was out" is wrong, 22:15 to 22:29 is 14 minutes (same as webA). Form: the key "0 minutes" is the only option without "About". Fix: options "14 minutes", "28 minutes", "29 minutes", "0 minutes"; B why "That adds both servers' time out of the pool, but the other server served customers each time." |
| i1-3-14ab29d1.8 | FAIL | No role ("A change request ... reads"). BEST otherwise sound (window vs downtime, d1.md). Fix (wording): "A change coordinator at a ferry operator files a request for the booking system that reads: ..." |
| i1-3-14ab29d1.9 | FAIL | Setting shared with ad3cfe62.4 (hospital lab, results to the patient portal). Items: Confidentiality and Integrity have `item: null` though card i1-2-dddf60a9 (CIA triad) names them, while Availability points at the 3.1 card. Fix: org "a county library", "the catalog site offline for an hour"; items of A, B, C = "i1-2-dddf60a9". |
| i1-3-c5ebe818.0 | PASS | Definition. |
| i1-3-c5ebe818.1 | PASS | Term from description (daemon). |
| i1-3-c5ebe818.2 | PASS | Daemon reads config only at start (stated in the stem). |
| i1-3-c5ebe818.3 | FAIL | Repeated test: same decision and key as .5 (after the restart, confirm the service is running; .8 C again). Fix (writer): test the card's "can interrupt anything using it" (card definition and example: active connections drop), e.g. what users of the directory notice during the restart; options a brief interruption of sign-ins / loss of unsaved documents / no effect since it runs in the background / a change to their rights. |
| i1-3-c5ebe818.4 | PASS | Background engine nobody opens: service restart. |
| i1-3-c5ebe818.5 | PASS | Security agent fails silently after restart (d1.md step 5). |
| i1-3-c5ebe818.6 | FAIL | No role ("An upgrade of a payroll firm's database engine requires ..."). Facts right (d1.md step 3). Fix (wording): "A database administrator at a payroll firm plans an upgrade of the database engine that requires restarting it." |
| i1-3-c5ebe818.7 | PASS | Artifact; `is-active` prints the unit state incl. failed (systemctl(1)); invented journal line is fine. |
| i1-3-c5ebe818.8 | FAIL | No role ("A change plan at a hotel chain will restart ..."). Fix (wording): "A systems administrator at a hotel chain writes a change plan to restart ..." |
| i1-3-c5ebe818.9 | FAIL | Renamed copy of .4: a background process nobody opens needs a restart for a setting, service vs application restart, same deciding detail ("no one has it open" = "Staff never open the engine"); the BEST runner is not an honest second reading. Fix (writer): another service restart fact, e.g. service restart vs full reboot (d1.md Common confusions): an admin proposes rebooting the whole streaming server; what smaller step applies the setting. |
| i1-3-b51cf78e.0 | PASS | Definition. |
| i1-3-b51cf78e.1 | PASS | Term from description (card example). |
| i1-3-b51cf78e.2 | PASS | Warn users to save before the close. |
| i1-3-b51cf78e.3 | PASS | Identify application restart. Note for the coordinator: close to TI.6 (ba3703a5.6, an update closes a user program and loses unsaved work); TI.6 keys the umbrella term, so the decisions differ, but one of the two could move to another situation. |
| i1-3-b51cf78e.4 | PASS | Restart between calls avoids loss of unsaved work. Note: call center also in 8e31ede5.7 (restart timing, window); different decision. |
| i1-3-b51cf78e.5 | PASS | Users restart within a deadline (d1.md step 3). |
| i1-3-b51cf78e.6 | PASS | Settings reverted on restart (d1.md step 5). |
| i1-3-b51cf78e.7 | PASS | BEST honest: notice is both downtime and app restart; "save open entries" decides (d1.md table clue). |
| i1-3-b51cf78e.8 | PASS | Sorting. Note: "email client on staff laptops" also appears in .3; another program would be tidier. |
| i1-3-b51cf78e.9 | PASS | Reboot disrupts more than an app restart. |
| i1-3-734d6e30.0 | PASS | Definition. |
| i1-3-734d6e30.1 | PASS | Why legacy is risky. |
| i1-3-734d6e30.2 | FAIL | The ask names the key's definition ("the program's age and lack of support"), so no card knowledge is needed. Fix (wording): ask "Which technical implication makes this move riskier than usual?"; C why "Reopening a program after a move is routine; it is not what makes this move riskier." |
| i1-3-734d6e30.3 | PASS | Document how it works first (card key point). |
| i1-3-734d6e30.4 | PASS | Not changing it leaves known flaws open (d1.md Common confusions). |
| i1-3-734d6e30.5 | PASS | BEST legacy vs dependencies, settled by d1.md Scenario (age stressed). Not contested: the course table names "old, unsupported" as the legacy clue. |
| i1-3-734d6e30.6 | PASS | Select TWO: faithful copy, tested way back. |
| i1-3-734d6e30.7 | FAIL | Artifact copy of .2 (no updates, no maker, no documentation, so legacy); round 2 rule (an artifact form of the same identification is a copy). Fix (writer): keep the record but test another legacy fact, e.g. a line "Replacement: none planned" and ask what the record lacks (a replacement plan, d1.md step 5). Avoid compensating controls (1.1 e28fd41b.2/.5 and 02a955cb.5 use that scene). |
| i1-3-734d6e30.8 | PASS | Indirect change near legacy rated higher risk. |
| i1-3-734d6e30.9 | PASS | Legacy is often critical. |
| i1-3-ad3cfe62.0 | PASS | Definition. |
| i1-3-ad3cfe62.1 | PASS | Map before approval (card key point). |
| i1-3-ad3cfe62.2 | PASS | Order: relied-on part first (card example angle). |
| i1-3-ad3cfe62.3 | PASS | Hidden dependency broke an import job. |
| i1-3-ad3cfe62.4 | PASS | Test the whole chain. Change board as the actor accepted (a group with a job, like "network team"). |
| i1-3-ad3cfe62.5 | FAIL | Accuracy: NTP serves UTC and carries no time zone (RFC 5905), so a time zone setting on the central time server does not change the clients' clock or force restarts. Also no role, and a time server again (c5ebe818.2). Fix (writer): another dependency-forced restart, e.g. a message queue server moves to a new address that the scanners' sync agent and the billing job read only at start; add a role. Keep BEST and the runner. |
| i1-3-ad3cfe62.6 | PASS | Artifact; cascade read correctly. |
| i1-3-ad3cfe62.7 | FAIL | Option B "Turn off logging during the replacement" is an off-topic attribute (its why can only say it has nothing to do with it). Fix: B "Treat it as a pre-approved standard change" (why: a replacement three other systems rely on needs full review, not the routine pre-approved path; d1.md Change management process step 3). |
| i1-3-ad3cfe62.8 | PASS | Operational dependency (partner). |
| i1-3-ad3cfe62.9 | PASS | Mapping would have caught the service account use. |
| i1-3-49f9d06c.0 | PASS | Definition. |
| i1-3-49f9d06c.1 | PASS | Updates as a step of the change. |
| i1-3-49f9d06c.2 | PASS | Checklist missing the documentation step. |
| i1-3-49f9d06c.3 | PASS | Responders misled by stale records. |
| i1-3-49f9d06c.4 | FAIL | No role ("After a data center move at a law firm, the network map still shows ..."). Partly flags right (umbrella vs its two parts). Fix (wording): "A network manager at a law firm finds that, after the data center move, the network map still shows ..." |
| i1-3-49f9d06c.5 | PASS | Version control working, procedure stale. |
| i1-3-49f9d06c.6 | PASS | Select TWO, card key point. |
| i1-3-49f9d06c.7 | PASS | Artifact; unchecked boxes yet closed. |
| i1-3-49f9d06c.8 | FAIL | Renamed copy of .1: same fact (updates built into the change) and the same distractors (when they have time ~ spare time; every five years ~ once a year). Fix (writer): another documentation angle, e.g. an engineer argues the change request record itself is all the documentation a change needs. |
| i1-3-49f9d06c.9 | FAIL | Shares a44608df.2's scene (a wireless network added or moved; which records to update) and uses the diagrams card's own example (a new network for smart devices); options A to C ("Only the change request", "Only records older than one year", "No records") are not real neighbors and make the universal key stand out. Fix (writer): new situation and four real neighboring options. |
| i1-3-a44608df.0 | PASS | Definition. |
| i1-3-a44608df.1 | PASS | Why diagrams matter. |
| i1-3-a44608df.2 | PASS | Layout change, work unchanged: diagrams. |
| i1-3-a44608df.3 | PASS | Skipped diagram update found while troubleshooting (competitors: procedures, SOP). |
| i1-3-a44608df.4 | PASS | Never revised vs version control (d1.md Scenario). Distinct from .3 by its deciding contrast. |
| i1-3-a44608df.5 | PASS | Data flow diagrams too. |
| i1-3-a44608df.6 | PASS | Select TWO, layout vs non-layout changes. |
| i1-3-a44608df.7 | FAIL | Copy of .6 in artifact form (layout changes vs a certificate renewal), and the map's revision date decides nothing because all three changes come after it. Fix (writer, key changes): make the date matter, e.g. map "last revised 2026-05-01", so the April firewall change is already on it; key "Only the June change"; options "Only the June change", "The April and June changes", "All three changes", "Only the August change". |
| i1-3-a44608df.8 | PASS | Responders need the current layout. |
| i1-3-a44608df.9 | PASS | Diagram is not an inventory (d1.md Common confusions). |
| i1-3-827980ed.0 | PASS | Definition. |
| i1-3-827980ed.1 | PASS | Stale steps: errors or improvising. |
| i1-3-827980ed.2 | PASS | Checklist points at the old server. (Mirrors d1.md's own scenario shape; course material, not another question.) |
| i1-3-827980ed.3 | FAIL | Key odd one out: three options "A revised drawing ...", "A restored copy ...", "A list ...", the key "Revised call-out instructions" (no article, plural). Fix (wording): key "A revised call-out procedure". Optional: a third hospital in this part (32194154.3 nurse call server); another organization would help. |
| i1-3-827980ed.4 | FAIL | Shared scene with i1-3-388470f9.6 (an auditor compares how staff reset passwords with what is written) and with .8 (help desk reset steps after a new identity system). Fix (writer): same finding on another process, e.g. how night operators rotate backup media vs written steps that still describe the removed tape library. |
| i1-3-827980ed.5 | FAIL | Options A "The old VPN gateway is restarted" and B "The network map is rolled back" are off-family; the stem gives no family of document steps. Fix: A "The old steps are deleted from version control" (why: old versions are kept for audit history), B "The steps skip review since the engineer wrote them" (why: revised procedures go through the normal document review, whoever wrote them). |
| i1-3-827980ed.6 | PASS | Select TWO, changes to how staff work. |
| i1-3-827980ed.7 | PASS | Runbook names a retired server (d1.md Why it matters). |
| i1-3-827980ed.8 | FAIL | No role ("A university replaces ..."); shares the help desk reset scene with .4. Fix: "The security office manager at a university replaces the badge printing software. The rule that every badge shows a photo stays the same." Key "The front desk's guide for printing badges", B "The rule that badges show a photo", detail the new rule sentence. |
| i1-3-827980ed.9 | FAIL | The stem has no role (it appears only in the ask). Fix (wording): "The warehouse manager at a distribution center replaces ..."; ask "What should the manager do so the change takes hold?" |
| i1-3-1ff9c96c.0 | PASS | Definition. |
| i1-3-1ff9c96c.1 | PASS | Term from description. |
| i1-3-1ff9c96c.2 | PASS | See what each edit changed and who. |
| i1-3-1ff9c96c.3 | FAIL | Shares a scene with 1.1 i1-1-867b6c50.8 (firewall rule changes compared with the approved records, an unrecorded change found). Fix (wording): another device and org, e.g. "A network analyst at a county court compares a core router's running configuration with the last approved copy in the repository. She finds two lines that appear in no approved version or change record." Option A why: "Drawings show how the network connects, not the router's exact lines." |
| i1-3-1ff9c96c.4 | FAIL | The stem names the key: "from its revision history" is version control's own description (d1.md heading "revision history for code, configurations and documents"). Fix (wording): "pulls the settings file from before the change out of the team's repository and puts it back"; detail "out of the team's repository"; key why "The repository that held the earlier file is version control." |
| i1-3-1ff9c96c.5 | FAIL (CONTESTED) | Key "It tracks deliberate edits, not full copies of data": git-scm says "Every clone is really a full backup of all the data" and Git stores snapshots, so "not full copies" is contradicted as written. The point the chapter makes (it holds only what is deliberately committed, not a server's whole contents) is sound. Fix: key "It keeps only what someone deliberately commits"; why "Version control stores the revisions people commit; it does not copy everything on the server the way a backup does." |
| i1-3-1ff9c96c.6 | PASS | Select TWO: who/when record, quick restore. |
| i1-3-1ff9c96c.7 | PASS | Artifact; log order and diff consistent; revert c7d21aa (d1.md example). |
| i1-3-1ff9c96c.8 | FAIL | No role (the server "fails"; engineers appear only as laptop owners). Facts right (git-scm: every clone a full backup). Fix (wording): "A network lead at a gas utility learns that the server holding the configuration history failed beyond repair." |
| i1-3-1ff9c96c.9 | PASS | Version control does not replace change approval. Note: distractor "can store only network drawings" also in .5. |

## Stamps

p1 and p3 stamped (each run twice) on the 70 PASS ids, in `dev/careers/sources/security-plus-sy0-701/bank/stamps/1-3.json`.
The 30 FAIL ids are not stamped; after the writer's fixes they go back through every pass.
