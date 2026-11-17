# Bank pilot 1.1: round 2, passes 1 and 3 on 17 rewritten questions

Reviewer: a round 2 reviewer that did not write these questions or review them earlier. Date: 2026-11-16.
File: `dev/careers/sources/security-plus-sy0-701/bank/1-1.json`. Judged against plan B3, D2.1, checks C1 to C23 and
the pass 3 list (a) to (f) in [the plan](../plans/2026-11-16-exam-format-questions.md), the style guide, the 1.1 cards
in `public/careers/security-plus-sy0-701.json` and `public/careers/security-plus-sy0-701/knowledge/d1.md` section 1.1.
Earlier logs: [pass 1](bank-pilot-1-1-pass1.md), [pass 3](bank-pilot-1-1-pass3.md).

Extra pass 3 rule applied in this round: a role in every scenario stem (the coordinator's brief), and "no copy of
another question's scene anywhere in 1.1" read strictly (a scene with only the organization renamed is still a copy).

## Questions

| id | pass 1 | pass 3 | what and why | source |
|---|---|---|---|---|
| i1-1-3aa6b30b.0 | PASS | PASS | Key and three category descriptions match the cards; parallel "a thing doing something" options; key not a length tell. | card 3aa6b30b definition; d1.md "Managerial controls" |
| i1-1-3aa6b30b.5 | PASS | PASS | The decision to require training is managerial, delivering it operational; Operational's why names the axis the ask excludes. Role: the board. | d1.md "Managerial controls" common confusions |
| i1-1-3aa6b30b.6 | PASS | FIXED | Scene was still a renamed copy of i1-1-55fcb3b6.6 (an organization puts a clause in its vendor contract). Now a procurement director issues a standard that no supplier is signed until it meets security requirements (role added, no contract). Key unchanged; why lines and detail rewritten to match. | d1.md "Managerial controls" examples (a vendor security requirement) |
| i1-1-867b6c50.3 | PASS | PASS | Receptionists checking ID by hand is operational; no guard or barrier, so no physical reading. The phone call shares a mechanism with i1-1-867b6c50.5 but the scene (visitor sign-in vs an access request) differs; kept. | card 867b6c50 example; d1.md "Operational controls" |
| i1-1-17eb1a96.0 | PASS | FIXED | Form tell: the three wrong options were "[actor] [verb] it ..." and only the key lacked "it". All four are now "[actor] [verb] [object]" ("Software enforces a rule on a system", "Staff carry out a routine task", "Leadership approves a written policy"); key unchanged, tied for longest, not single longest. | card 17eb1a96 definition |
| i1-1-17eb1a96.4 | PASS | FIXED | No role, and "so that no one can climb in" repeated i1-1-17eb1a96.7's wording. Now "The owner of a pawn shop ... so that no one can get in through the glass"; Operational why says "routine task" (the owner's one-time fitting is not one). | card 17eb1a96 definition |
| i1-1-17eb1a96.5 | FIXED | FIXED | Operational's why named "the person working in the booth", who was not in the stem (a why must tie to the stem). The stem now has the security manager and "until a guard clears each vehicle", so Operational is a real lure that fails because the ask names the booth and arm. | card 17eb1a96 key points (guard shacks; barrier vs person); d1.md "Operational controls" common confusions |
| i1-1-6e4e84fd.4 | PASS | FIXED | The pass 3 fix only renamed the organization (storage company to lumber yard), which leaves a renamed copy of the warning-sign scenes in i1-1-88dabb74.5 and .9. New scene: a courier fleet manager's van stickers saying no cash is kept inside, which neither lock nor record. Key Deterrent, same options and item tags. | card 6e4e84fd key points (deterrent discourages, does not stop); d1.md "Deterrent controls" (more effort than the target is worth) |
| i1-1-3ded6b7b.0 | PASS | PASS | Parallel "It [verb] ..." options; key matches the card definition. | card 3ded6b7b definition |
| i1-1-3ded6b7b.2 | PASS | PASS | Refill. A decoy record that alerts but lets the read complete is detective; the chapter lists honeytokens as detective. Kept secret, so no deterrent reading. Answerable from the card alone (level 1). No copy in 1.1. | d1.md "Detective controls" examples |
| i1-1-02a955cb.4 | PASS | PASS | Resetting a compromised password after it was used is corrective; the timing rule rules out preventive. | d1.md "Corrective controls" examples and common confusions |
| i1-1-02a955cb.5 | PASS | FIXED | Facts fine. No role ("The team"): now "The plant's control engineer"; detail updated to the new substring. | d1.md "Corrective controls"; "Compensating controls" |
| i1-1-02a955cb.7 | PASS | FIXED | Same sentence template as i1-1-02a955cb.4 ("[org] learns that an intruder has already used [a secret] ... and [cancels it]") with near-identical Preventive why lines. Rewritten with a role (security engineer), its own shape and detail ("has since been used to run a look-alike site"); key and option set unchanged. | d1.md "Corrective controls" examples (revoking a stolen certificate) |
| i1-1-02a955cb.9 | PASS | PASS | Exactly two options both limit damage and bring the server back; the other three deter, direct or detect. All five are parallel "-ing" phrases. | card 02a955cb example |
| i1-1-e28fd41b.6 | PASS | PASS | Refill. Badge readers required, the lease forbids wiring, an approved exception puts the servers in locked cabinets with logged keys: compensating. Preventive (the cabinets' method) is not an option, so one defensible answer. Role present. | card e28fd41b definition; d1.md "Compensating controls" |
| i1-1-e28fd41b.8 | PASS | PASS | Exception record, marked line is the stand-in: compensating. The field name "in_place_instead" is the plain deciding cue, like "cannot" in the chapter; not a trick. | d1.md "Compensating controls" example (exception record) |
| i1-1-55fcb3b6.0 | PASS | FIXED | Hedged why line ("leans deterrent", flagged by pass 3 for pass 4). A warning of consequences to discourage misuse is deterrent outright, so the line now says so. | card 88dabb74 definition; d1.md "Deterrent controls" |

## Totals
- Pass 1: 16 PASS, 1 FIXED, 0 DROPPED. Pass 3: 9 PASS, 8 FIXED, 0 DROPPED.
- Edited (8): i1-1-3aa6b30b.6, i1-1-17eb1a96.0, i1-1-17eb1a96.4, i1-1-17eb1a96.5, i1-1-6e4e84fd.4,
  i1-1-02a955cb.5, i1-1-02a955cb.7, i1-1-55fcb3b6.0. Each keeps `rev` 2 and needs a fresh blind solve (pass 2).
- `node dev/careers/build-bank.mjs security-plus-sy0-701 --preview --allow-short`: no problems, no warnings.
- Stamped p1 and p3 on all 17.

## Not done or still weak
- No primary source outside the course was needed; every fact traces to the 1.1 cards or d1.md section 1.1.
- i1-1-867b6c50.3 and i1-1-867b6c50.5 both use a phone call to confirm; judged different scenes, kept.
- Several level 2 physical questions (17eb1a96.4, .5) are easy for level 2; level is the writer's call and was not changed.
