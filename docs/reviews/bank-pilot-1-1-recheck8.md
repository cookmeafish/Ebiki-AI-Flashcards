# Bank pilot 1.1: independent recheck of the 8 questions edited in round 2

Reviewer: an agent that did not write these questions and did not review or edit them in any earlier pass. Date:
2026-11-16. No edits made, no stamps written. File: `dev/careers/sources/security-plus-sy0-701/bank/1-1.json`.
Judged against [the plan](../plans/2026-11-16-exam-format-questions.md) B3, B4, D2.1, C1 to C23, the pass 3 list (a)
to (f) and the style guide; the 1.1 cards in `public/careers/security-plus-sy0-701.json`; section 1.1 of
`public/careers/security-plus-sy0-701/knowledge/d1.md`; what changed per [round 2](bank-pilot-1-1-round2.md). All 120
stems of 1.1 were read for copies. `node dev/careers/build-bank.mjs security-plus-sy0-701 --preview --allow-short`:
no problems.

## Verdicts

| id | verdict | reasons |
|---|---|---|
| i1-1-3aa6b30b.6 | PASS | Chapter "Managerial controls" lists "requirements for vendors" and "a vendor security requirement"; the card definition names standards. One defensible category. Every wrong why names what the ask (the director's standard) lacks. Role (procurement director), organization (logistics firm), plain detail. Distinct from 55fcb3b6.6 (a contract clause, a type question) and 3aa6b30b.7 (a message). Optional: Operational's why could say "The ask is about the director's standard, not checks staff might run on each supplier", since someone will check suppliers in practice. |
| i1-1-17eb1a96.0 | PASS | All four options "[actor] [verb] [object]"; key 35 characters against 36, 30 and 36, not a length tell. Each wrong option is exactly the card definition of another category. The key is narrower than the card ("barrier" leaves out cameras and fire suppression) but is the only option describing a physical control. |
| i1-1-17eb1a96.4 | PASS | Bars over windows are physical (chapter: "putting something tangible in the way"). Why lines tie to the stem; no person, software or policy in the scene. Role and organization present. Note: shares "steel ... so that no ... can ... windows" with i1-1-17eb1a96.2 (stadium bollards keeping vehicles off the ticket windows); different control and threat, so not a copy, but a future refill should avoid the same pattern. Easy for level 2 (already noted in round 2). |
| i1-1-17eb1a96.5 | PASS | Card key points: a guard is physical or operational depending on barrier vs person; the ask names the booth and arm, so Physical is the one answer and Operational's why says exactly that. Explain matches the card ("guard shacks"). Technical holds: the arm is raised by the guard, not by software. Role (security manager), organization (car plant). |
| i1-1-6e4e84fd.4 | PASS | A sticker saying no cash is inside discourages without stopping (overview card key points; chapter "Deterrent controls": "more effort than the target is worth"). The second sentence rules out Preventive and Detective plainly; Corrective fails on timing. Not a warning-of-consequences sign, so not a renamed copy of 88dabb74.5, 88dabb74.9 or 6e4e84fd.6. Answerable from the overview card alone (level 1). Data note, not learner-facing: Corrective's `item` is `i1-1-6e4e84fd` (the overview card, as in 6e4e84fd.2) while Preventive and Detective point at their own cards; defensible because the overview card defines all six, and probably needed for C16 lesson order. |
| i1-1-02a955cb.5 | PASS | Chapter: "noticing the infection is detective, cleaning it is corrective"; isolating a controller that cannot take the control is compensating (chapter example). The ask names the cleaning, Compensating's why says so. Role added (control engineer); detail is a literal substring. The "cannot run security software, isolated segment" clause echoes e28fd41b.4, but this scene adds an outbreak and asks about the cleanup, so it is not a copy. |
| i1-1-02a955cb.7 | FAIL | Key and options are right (chapter lists "revoking a stolen certificate" as corrective; timing rule rules out Preventive). Problem: "used to run a look-alike site". In this course a look-alike site means a different, similar-looking domain (typosquatting), and a certificate's private key only lets an attacker pose as the domain the certificate names, so a learner who knows certificates can object that the stolen key cannot run a look-alike domain. Fix: stem "... was copied last week and has since been used to impersonate the customer's site and collect visitors' passwords. The engineer revokes the site's certificate that afternoon."; detail "has since been used to impersonate the customer's site". Options, why lines and explain unchanged. Needs pass 1, 2 and 3 again after the edit. |
| i1-1-55fcb3b6.0 | PASS | Key restates the card definition; Deterrent's why now says it outright, which matches the card ("a warning of consequences leans deterrent") and the chapter (deterrent "warns of consequences"). All four "It [verb] ..."; key 44 characters, the longest is a wrong option (50). |

## Totals
- 7 PASS, 1 FAIL (i1-1-02a955cb.7, one wording fix proposed above).
- Checked for each: facts against the card and chapter, one defensible answer, each wrong option failing a stated
  requirement with its why line naming it, parallel form, no scene copied in 1.1, role + organization + plain detail,
  style guide format (no "you", fixed ask phrases, no dashes, short options).

## Not done or still weak
- No source outside the course was read; every judgment traces to the 1.1 cards and d1.md section 1.1.
- Blind solves (pass 2) for these 8 were not part of this recheck.
