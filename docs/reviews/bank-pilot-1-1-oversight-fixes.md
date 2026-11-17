# Question bank pilot 1.1: oversight fixes

Report: [bank-pilot-1-1-report.md](bank-pilot-1-1-report.md). File:
`dev/careers/sources/security-plus-sy0-701/bank/1-1.json`. 63 of 120 questions changed, each `rev` one higher; id, slot,
card, kind (except the three conversions below), level, pick and cardSig kept. Preview build: no problems besides the
expected "not stamped". Not stamped, not committed.

## KEY / FACT changes (14): need every pass again

| Id | What changed |
|---|---|
| i1-1-e1ccd45a.5 | Contested key replaced: patching before exploitation (called corrective by many) became account lockout after five wrong passwords, nothing attempted yet. New stem, ask, detail, all why lines, explain; source card now "example". Key still D Preventive. |
| i1-1-867b6c50.7 | Contested key replaced: quarterly access review by department heads became a night operator reading the backup report and rerunning failed jobs by hand. New stem, ask, detail, all four options (system / person* / written policy / barrier), why lines, explain. |
| i1-1-867b6c50.8 | Artifact 07:00 line (admin group compared with approved list) became "Overnight alert queue read, 2 alerts passed to the network team"; detail and the Technical, Physical and Operational why lines follow. |
| i1-1-3aa6b30b.4 | Register upkeep by a junior analyst became the chief risk officer's risk register listing each risk, owner and the board's decision. New stem, detail, two why lines, explain; source card "definition". |
| i1-1-55fcb3b6.9 | Key option E (two-nurse sign-out, widely called preventive) became "A written instruction on recording each dose"; explain follows; role added (nursing director). |
| i1-1-867b6c50.9 | Found in the scan: key option A "Guards checking driver IDs" (guards are also listed as physical security) became "Shift leads counting scanners back in nightly"; explain follows. |
| i1-1-17eb1a96.9 | Found in the scan: key option E "A camera covering the room entrance" (cameras placed as technical by some) became "A steel grille over the room window"; explain follows; role added (practice manager). |
| i1-1-55fcb3b6.6 | Found in the scan: a breach-reporting clause (arguably detective) became a clause keeping the bank's data in in-country data centers; new stem with role (vendor manager), detail, three why lines. Key still Directive. |
| i1-1-172e8ab8.6 | Found in the scan: wrong option D "Monthly access reviews by managers" (its why called it operational, contested) became "Security awareness training for staff"; role added (compliance officer). |
| i1-1-7215172d.0 | Off-family options C/D ("who paid", "when last tested") became "How much risk the control leaves" and "How likely the threat is to occur", with why lines. |
| i1-1-6e4e84fd.0 | Off-family options B/C ("which vendor", "where installed") became "How severe the threat it faces is" and "Which assets the control protects", with why lines. |
| i1-1-7215172d.9 | Third plain definition on the card: now a scenario (a security analyst drafts notes for a briefing). Stem, ask, detail added; options unchanged. |
| i1-1-6e4e84fd.9 | Third plain definition on the card: now a scenario (a security trainer checks a slide). Stem, ask, detail added; options unchanged. |
| i1-1-e28fd41b.9 | Third plain definition on the card: now a scenario (a risk analyst reviews a colleague's summary). Stem, ask, detail added; options unchanged. |

## WORDING only (49): a role added to the stem

Nothing else in the scenario, options or key changed. Where the deciding detail string held the old subject or verb it
was updated to stay a literal part of the stem: 3aa6b30b.2 (detail now "approves an offboarding policy"), 3aa6b30b.8,
3ded6b7b.3, 172e8ab8.7 ("reject"). Asks or why/explain lines naming the old subject were aligned: 3aa6b30b.5 (board to
chief executive), 3ded6b7b.9 (audit to auditor), 02a955cb.3 (response team to lead).

i1-1-7215172d.2, .3, .4, .5; i1-1-172e8ab8.2, .4, .7; i1-1-3aa6b30b.2, .3, .5, .8, .9; i1-1-17eb1a96.2, .3, .6, .7, .8;
i1-1-6e4e84fd.5, .6, .7, .8; i1-1-e1ccd45a.2, .3, .4, .6, .7; i1-1-88dabb74.2, .3, .5, .6, .7, .8, .9;
i1-1-3ded6b7b.3, .5, .6, .7, .9; i1-1-02a955cb.3, .4, .8; i1-1-e28fd41b.2, .4, .5, .7; i1-1-55fcb3b6.2, .4, .5, .8.

## Checks
- Every scenario and artifact stem now names a person with a job; stems already naming one (a guard, trader, reporters,
  auditors, help desk agent, owner) were left alone.
- Plain definition questions: exactly 2 per card on all 12 cards; C22 holds (level 1 keeps 2 definition and 2
  scenario per card).
- Preview build `node dev/careers/build-bank.mjs security-plus-sy0-701 --preview --allow-short`: no problems. Fixed on
  the way: C6 on 172e8ab8.7 (detail verb), C10 and C11 on 867b6c50.7 (stem word in one wrong option; key longest on its
  card too often).
- No em or en dashes.

## Still weak
- i1-1-867b6c50.8's new 07:00 line (a person reading alerts) is close in idea to i1-1-7215172d.3 (staff watching
  alerts around the clock); different form and organization, but pass 3 should judge it against the "no shared scene"
  rule.
- i1-1-e1ccd45a.5 now tests account lockout, which is also the key of the definition question i1-1-e1ccd45a.1.
- The role-only edits were not re-read by anyone else; since the stamps cover exact text, all 63 need fresh stamps.
