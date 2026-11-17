# Bank pilot 1.1: round 3, passes 1, 3 and 4 on the 63 questions changed by the oversight fixes

Reviewer: an independent agent that did not write, edit or earlier review these questions. Date: 2026-11-17.
File: `dev/careers/sources/security-plus-sy0-701/bank/1-1.json` (not edited in this round). Scope: every question
`build-bank.mjs` lists as stale on p1, p3 or p4 after [the oversight fixes](bank-pilot-1-1-oversight-fixes.md) (63).
Judged against [the plan](../plans/2026-11-16-exam-format-questions.md) B3, B4 (including the CONTESTED rule), D2.1,
C1 to C23 and the pass 3 list (a) to (f), the style guide, the 1.1 cards in `public/careers/security-plus-sy0-701.json`
and `public/careers/security-plus-sy0-701/knowledge/d1.md` section 1.1. Earlier logs: [round 2](bank-pilot-1-1-round2.md),
[pass 4](bank-pilot-1-1-pass4.md).

## Primary sources read this round
- NIST SP 800-53 Rev. 5 control text, from NIST's own OSCAL catalog (usnistgov/oscal-content, Rev 5.2.0): AC-3 (and its
  guidance on logical vs physical access), AC-7, AC-8, AT-2, AU-6, CA-7, CM-7(5), CP-9, CP-10, IA-2, IR-4, PE-2, PE-3,
  PE-6, PE-11, PE-13, PL-4, PM-6, PM-9, PS-4, RA-3, SA-9, SC-7, SC-28, SI-2, SI-3, SI-4, SI-7.
- CSRC glossary: technical controls (FIPS 200, CNSSI 4009), operational controls (FIPS 200, CNSSI 4009: "implemented
  and executed by people"), management controls (FIPS 200: "focus on the management of risk"), compensating controls
  (SP 800-53 Rev. 5 / SP 800-53B: "employed in lieu of" baseline controls, comparable protection), intrusion prevention
  system (SP 800-82r3).
- NIST defines no six-type list (preventive, deterrent, detective, corrective, compensating, directive); for types the
  source is the chapter, backed by the specific control named in each row.

## How "shared scene" was read (pass 3 (c))
The select-N frame "a manager must add two controls of kind X" is a format, used by several cards, and is not a copy by
itself. A copy is the same situation with names swapped: the same place or asset protected, the same people doing the
same thing, or the same purpose (for example, a visible measure that sends car thieves to another lot).

## Questions

| id | pass 1 | pass 3 | pass 4 | what and why | source |
|---|---|---|---|---|---|
| i1-1-7215172d.0 | PASS | PASS | PASS | Key = how implemented; C/D are risk-analysis terms (risk left, likelihood), off the category axis. Weak spot: risk terms are near, not the closest neighbors. | FIPS 200 via CSRC glossary (technical, management, operational controls); d1.md "control categories compared" |
| i1-1-7215172d.2 | PASS | PASS | PASS | Approved written rule = managerial; the badge item and staff checks are named as the lures. | FIPS 200 via CSRC glossary (technical, management, operational controls); d1.md "Managerial controls" |
| i1-1-7215172d.3 | PASS | PASS | PASS | Staff watching alerts and phoning = operational. Its scene is now shared by 867b6c50.8 (failed there, not here). | CNSSI 4009 operational controls (implemented by people) via CSRC; SP 800-53 AU-6; d1.md "Technical controls" common confusions |
| i1-1-7215172d.4 | PASS | PASS | PASS | Fence = physical. | SP 800-53 PE-3; d1.md "Physical controls" examples |
| i1-1-7215172d.5 | PASS | PASS | PASS | Standard managerial, encryption technical; the role reads naturally. | SP 800-53 SC-28; FIPS 200 via CSRC glossary (technical, management, operational controls); d1.md "Managerial controls" example |
| i1-1-7215172d.9 | PASS | PASS | PASS | New scenario; detail literal; options unchanged and true or false as their whys say. | d1.md "control categories compared" ("administrative equals managerial"); FIPS 200 via CSRC glossary (technical, management, operational controls) |
| i1-1-172e8ab8.2 | PASS | PASS | PASS | OS permissions = technical. | SP 800-53 AC-3; CSRC technical controls (FIPS 200, CNSSI 4009) |
| i1-1-172e8ab8.4 | PASS | PASS | PASS | Antivirus acting alone = technical. "has the district's laptops run" is a little stiff, acceptable. | SP 800-53 SI-3; CSRC technical controls |
| i1-1-172e8ab8.6 | PASS | PASS | PASS | Logical = technical; the training option is now uncontested operational. | SP 800-53 AC-3 guidance (logical access controls within the system vs the PE family); d1.md ("Logical equals technical") |
| i1-1-172e8ab8.7 | FAIL | PASS | FAIL | CONTESTED. NIST puts verifying physical access authorizations (a badge system refusing a revoked credential before granting facility access) in the Physical and Environmental family: PE-3 a.1 "Verifying individual access authorizations before granting access to the facility", PE-2 d (remove individuals from the facility access list), and AC-3 guidance names the PE family for physical access controls "in contrast to logical access controls". The chapter only says the database rules "can be described as technical". Proposed fix: rewrite to an uncontested technical case with no physical-access credential (for example a VPN gateway rejecting a revoked certificate, with a different partly-true neighbor), or drop. Also tell the chapter owner: d1.md 1.1 worked mini-example ("Badge server rejects revoked badges" = technical) carries the same contest. | SP 800-53 Rev. 5 PE-3, PE-2, AC-3 guidance; d1.md "Physical controls" common confusions |
| i1-1-3aa6b30b.2 | PASS | PASS | PASS | Offboarding policy approved by leadership = managerial; the detail is short but literal and decisive. | CSRC management controls (FIPS 200); SP 800-53 PS-4 (the act, not the policy); card example |
| i1-1-3aa6b30b.3 | PASS | PASS | PASS | Risk assessment informing leadership = managerial. Note: same role (chief risk officer) and the board as 3aa6b30b.4 on the same card; the activities differ (outside rating vs a register), so not a copy, but another title on one would add variety. | SP 800-53 RA-3; CSRC management controls |
| i1-1-3aa6b30b.4 | PASS | PASS | PASS | A register of each risk, owner and board decision = managerial; uncontested now that no analyst upkeep is in the stem. | SP 800-53 PM-9; d1.md "Managerial controls" (risk register; who owns a risk) |
| i1-1-3aa6b30b.5 | PASS | PASS | PASS | The decision to require training = managerial; delivery is operational; ask and explain aligned to the chief executive. | SP 800-53 AT-2; d1.md "Managerial controls" common confusions |
| i1-1-3aa6b30b.8 | PASS | PASS | PASS | Reviewing program results against goals and funding = managerial oversight. | SP 800-53 PM-6 (measures of performance); d1.md "Managerial controls" how it works, step 4 |
| i1-1-3aa6b30b.9 | PASS | PASS | PASS | Classification standard and risk assessment managerial; the other three belong to other categories. | SP 800-53 RA-3; d1.md "Managerial controls" examples |
| i1-1-867b6c50.7 | PASS | PASS | PASS | An operator reading the report and rerunning failures by hand = operational; four parallel category descriptions. | CNSSI 4009 operational controls via CSRC; SP 800-53 CP-9; d1.md "Operational controls" examples (backup rotation) |
| i1-1-867b6c50.8 | PASS | FAIL | PASS | Facts right (a person reading alerts and handing them on is operational). FAIL (c): the 07:00 line is the scene of 7215172d.3 (people reading network alerts and passing the real ones on), and option A's why nearly repeats 7215172d.3's Technical why. Proposed fix: a different routine person-performed check at 07:00 that no other 1.1 question uses (not alerts, backups, scanner counts, badges or footage), with the detail and the A, B and C why lines updated. | CNSSI 4009 operational controls via CSRC; SP 800-53 AU-6; d1.md "Technical controls" common confusions |
| i1-1-867b6c50.9 | PASS | PASS | PASS | Counting scanners back in and supervisors reviewing footage = operational; badge reader physical, AUP managerial, lockout technical. New key option uncontested. Watch: the same "add two X controls before an audit" frame as 172e8ab8.9, different setting. | SP 800-53 PE-6 (people reviewing); d1.md "Operational controls" |
| i1-1-17eb1a96.2 | PASS | PASS | PASS | Bollards = physical. | d1.md "Bollards"; "Physical controls" examples |
| i1-1-17eb1a96.3 | PASS | PASS | PASS | Rack locks = physical. | SP 800-53 PE-3 (secure keys); d1.md "Physical controls" examples |
| i1-1-17eb1a96.6 | PASS | PASS | PASS | Fire suppression and backup power = physical environment. | SP 800-53 PE-13, PE-11 (Physical and Environmental family); d1.md "Physical controls" how it works, step 4 |
| i1-1-17eb1a96.7 | PASS | PASS | PASS | Physical category, preventive type; no "physical, deterrent" option, so one answer. | d1.md "Physical controls" common confusions |
| i1-1-17eb1a96.8 | PASS | PASS | PASS | Lighting = physical. Close to 88dabb74.6 (failed there). | d1.md "Physical controls" examples (lighting) |
| i1-1-17eb1a96.9 | PASS | PASS | PASS | Locked door with a badge reader and a window grille = physical; new key option uncontested. Its scene is copied by 55fcb3b6.9 (failed there). | SP 800-53 PE-3; d1.md "Physical controls" examples |
| i1-1-6e4e84fd.0 | PASS | PASS | PASS | Key = goal; B and C are risk and asset terms. Weak spot: "Which assets the control protects" is the least neighbor-like option; acceptable. | d1.md "control types compared"; card 6e4e84fd definition |
| i1-1-6e4e84fd.5 | PASS | PASS | PASS | Missing reveal after the fact = detective. | SP 800-53 SI-4; d1.md "Detective controls" |
| i1-1-6e4e84fd.6 | PASS | PASS | PASS | Stated reason to discourage = deterrent BEST; detective flagged partly; the edge traces to the chapter ("a visible camera is deterrent and detective at once"). | d1.md "Deterrent controls" common confusions |
| i1-1-6e4e84fd.7 | PASS | PASS | PASS | Handbook rule with nothing blocking = directive. | SP 800-53 PL-4; d1.md "Directive controls" |
| i1-1-6e4e84fd.8 | PASS | PASS | PASS | Sensor = detective. | SP 800-53 PE-6 guidance (sensor devices); d1.md "Detective controls" |
| i1-1-6e4e84fd.9 | PASS | PASS | PASS | New scenario; statements B and C true, the others false as their whys say. | d1.md "control types compared"; card key points |
| i1-1-e1ccd45a.2 | PASS | PASS | PASS | Coded lock = preventive. | SP 800-53 PE-3; d1.md "Preventive controls" examples |
| i1-1-e1ccd45a.3 | PASS | PASS | PASS | Firewall dropping inbound = preventive. | SP 800-53 SC-7; d1.md "Preventive controls" |
| i1-1-e1ccd45a.4 | PASS | PASS | PASS | Inline sensor that drops = IPS, preventive BEST; detective flagged partly; the edge comes from the card (IDS detective, IPS preventive). | CSRC glossary IPS (SP 800-82r3: detects and also attempts to stop); d1.md "Detective controls" |
| i1-1-e1ccd45a.5 | PASS | PASS | PASS | Lockout before any attempt = preventive; uncontested (the chapter scenario says exactly this). Note: account lockout is also the key of definition question e1ccd45a.1; .1 has no scene, so no shared scene, but the card reuses one example twice. | SP 800-53 AC-7; d1.md "Preventive controls" scenario |
| i1-1-e1ccd45a.6 | PASS | PASS | PASS | Full-disk encryption = preventive (prevents disclosure). | SP 800-53 SC-28; d1.md "Preventive controls" examples |
| i1-1-e1ccd45a.7 | PASS | PASS | PASS | Allow list = preventive. | SP 800-53 CM-7(5); d1.md "Preventive controls" examples |
| i1-1-88dabb74.2 | PASS | PASS | PASS | Login notice warning of dismissal, sign-in unaffected = deterrent. | SP 800-53 AC-8; d1.md "Deterrent controls" scenario |
| i1-1-88dabb74.3 | PASS | FAIL | PASS | Facts right. FAIL (d): a guard at reception is also detective (card i1-1-ed14b52b and the d1.md worked-method table: guard = preventive, deterrent, detective), so option B Detective is partly true like A Preventive but not flagged; its why only says the stated reason does not mention it. Proposed fix: flag B partly with a why naming what it misses ("A guard can also notice and report intruders, but the stated reason is to make people decide not to try"), or replace B with a type that does not apply (Compensating or Directive). Minor: "The office manager" twice in two sentences. | d1.md "Deterrent controls" examples; d1.md "Classifying one control" table |
| i1-1-88dabb74.5 | PASS | PASS | PASS | Warning of the police = deterrent BEST; directive flagged partly; the edge traces to the chapter (directive instructs, deterrent warns). | d1.md "Deterrent controls" and "Directive controls" common confusions |
| i1-1-88dabb74.6 | PASS | FAIL | PASS | Facts right (bright lighting is a listed deterrent). FAIL (c): renamed copy of 6e4e84fd.6 (a car lot, thieves, a visible measure meant to send them elsewhere) and close to 17eb1a96.8 (an owner lighting a vehicle site at night). Proposed fix: a different deterrent scene, for example the card's unused "threat of demotion for policy violations" in a staff setting, with options and whys rewritten. | d1.md "Deterrent controls" examples |
| i1-1-88dabb74.7 | PASS | PASS | PASS | Only a preventive control would have stopped the sign-in. | SP 800-53 AC-8, IA-2; d1.md "Deterrent controls" |
| i1-1-88dabb74.8 | PASS | PASS | PASS | Banner warning of prosecution = deterrent; the logging behind it is detective, said in C's why. | SP 800-53 AC-8; d1.md "Deterrent controls" scenario |
| i1-1-88dabb74.9 | PASS | PASS | PASS | Warning signs and lighting deter without blocking or recording. | d1.md "Deterrent controls" examples |
| i1-1-3ded6b7b.3 | PASS | PASS | PASS | Motion sensor alarm = detective. | SP 800-53 PE-6 guidance (sensor devices); d1.md "Detective controls" |
| i1-1-3ded6b7b.5 | PASS | PASS | PASS | A passive sensor that only alerts = IDS, detective. | SP 800-53 SI-4; CSRC glossary IPS (contrast); d1.md "Detective controls" |
| i1-1-3ded6b7b.6 | PASS | PASS | PASS | The report = detective, the removal corrective. | SP 800-53 SI-3 (detect, then eradicate); d1.md "Corrective controls" common confusions |
| i1-1-3ded6b7b.7 | PASS | PASS | PASS | File integrity monitoring = detective. | SP 800-53 SI-7; d1.md "Detective controls" scenario |
| i1-1-3ded6b7b.9 | PASS | PASS | PASS | Motion sensor and a reviewed access log = detective. | SP 800-53 PE-6 (review physical access logs; sensors); d1.md "Detective controls" |
| i1-1-02a955cb.3 | PASS | PASS | PASS | Removing files and patching after exploitation = corrective; uncontested in this after-the-event form (the chapter lists "applying an emergency patch after exploitation"). | SP 800-53 SI-2 ("correct system flaws"), IR-4 (eradication, recovery); d1.md "Corrective controls" examples |
| i1-1-02a955cb.4 | PASS | PASS | PASS | Reset after compromise = corrective. | SP 800-53 IR-4; d1.md "Corrective controls" examples |
| i1-1-02a955cb.8 | PASS | PASS | PASS | Restore from snapshot = corrective; the 09:12 detection is named. | SP 800-53 CP-10; d1.md "Corrective controls" examples |
| i1-1-e28fd41b.2 | PASS | PASS | PASS | Firewall in place of updates = compensating BEST; preventive flagged partly; edge = in lieu of the required control. | CSRC glossary compensating controls (SP 800-53B: "employed in lieu of"); d1.md "Compensating controls" examples |
| i1-1-e28fd41b.4 | PASS | PASS | PASS | Isolation for a machine that cannot run antivirus = compensating; preventive is not offered. | CSRC compensating controls (SP 800-53B); d1.md "Compensating controls" |
| i1-1-e28fd41b.5 | PASS | PASS | PASS | MFA gateway for an app that cannot support MFA = compensating. | CSRC compensating controls (SP 800-53B); d1.md "Compensating controls" examples (jump server with MFA) |
| i1-1-e28fd41b.7 | PASS | PASS | PASS | An approved alarm in place of a guard = compensating BEST; detective flagged partly. | CSRC compensating controls (SP 800-53B, comparable protection); SP 800-53 PE-6 (guards and sensors both monitor) |
| i1-1-e28fd41b.9 | PASS | PASS | PASS | New scenario; B and D true. Minor: statements say "It" while the stem says "controls"; reads acceptably. | CSRC compensating controls (SP 800-53B); d1.md "Compensating controls" |
| i1-1-55fcb3b6.2 | PASS | PASS | PASS | Instructional sign, unlocked door = directive. | d1.md "Directive controls" common confusions |
| i1-1-55fcb3b6.4 | PASS | PASS | PASS | First sign directive, second deterrent. | d1.md "Deterrent controls" and "Directive controls" |
| i1-1-55fcb3b6.5 | PASS | PASS | PASS | AUP = directive; the allow-list tool is the preventive contrast (the idea of e1ccd45a.7 used as a contrast, not a copied scene). | SP 800-53 PL-4 (acceptable use agreements); d1.md "Directive controls" scenario |
| i1-1-55fcb3b6.6 | PASS | PASS | PASS | Data-location clause = directive; an uncontested replacement for the breach-reporting clause. | SP 800-53 SA-9 (require providers to comply); d1.md "Directive controls" how it works, step 1 |
| i1-1-55fcb3b6.8 | PASS | PASS | PASS | A notice stating required behavior = directive. | d1.md "Directive controls" examples |
| i1-1-55fcb3b6.9 | PASS | FAIL | PASS | Facts right (the new key, a written instruction on recording each dose, is directive). FAIL (c): renamed copy of 17eb1a96.9 (a manager adds two controls of one kind to protect a medicine room; clinic to hospital, physical to directive), and option B echoes 3ded6b7b.4's drug-room camera. Proposed fix: a different protected place and setting, with options A, B and C rewritten to fit. | d1.md "Directive controls" examples |

## Totals
- Reviewed: 63. Pass 1: 62 PASS, 1 FAIL. Pass 3: 59 PASS, 4 FAIL. Pass 4: 62 PASS, 1 FAIL. All three passed: 58.
- Pass 4 error rate: 1 / 63 (1.6%), the contested key below.
- FAIL, not fixed (key, option, flag or deciding detail would change; left for the writer):
  - i1-1-172e8ab8.7: contested key (pass 1 and pass 4). NIST SP 800-53 PE-3 and PE-2 place the badge system's check
    of revoked credentials under physical access control.
  - i1-1-867b6c50.8: shares its 07:00 scene with i1-1-7215172d.3 (the writer's flag, confirmed).
  - i1-1-88dabb74.6: renamed copy of i1-1-6e4e84fd.6 (car lot, thieves sent elsewhere), close to i1-1-17eb1a96.8.
  - i1-1-55fcb3b6.9: renamed copy of i1-1-17eb1a96.9 (two controls of one kind for a medicine room).
  - i1-1-88dabb74.3: option B (Detective) is partly true for a guard and not flagged.
- The writer's second flag, i1-1-e1ccd45a.5 vs i1-1-e1ccd45a.1: PASS. .1 is a definition question with no scene;
  the card does reuse account lockout as a key twice, which costs variety, not correctness.
- Edited: none. No blind solve is needed because of this round.
- Stamped p1, p3 and p4 on the 58 that passed all three, with the text unchanged since it was read.

## Still weak (passed, worth a look in the next rewrite)
- i1-1-3aa6b30b.3 and .4: both the chief risk officer and the board, on one card.
- i1-1-7215172d.0 and i1-1-6e4e84fd.0: the risk and asset distractors are near terms, not the closest neighbors.
- i1-1-867b6c50.9 and i1-1-172e8ab8.9: the same "add or list two controls before an audit" frame.
- d1.md 1.1 worked mini-example ("Badge server rejects revoked badges", technical) carries the same contest as
  i1-1-172e8ab8.7; the chapter owner should hedge or replace it.
