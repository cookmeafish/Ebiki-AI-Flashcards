# Bank 1.2: independent review of the 7 questions oversight held (2026-11-17)

Reviewer: an agent that did not write these questions or their fixes. Passes: 1 (accuracy, CONTESTED), 3 (clarity and
format), 4 (fact check against primary sources). File: `dev/careers/sources/security-plus-sy0-701/bank/1-2.json`.
Related: [fixes](bank-1-2-oversight-fixes.md), [pass 4](bank-1-2-pass4.md), [plan](../plans/2026-11-16-exam-format-questions.md).

Lines held: bollards can be used indoors; log review is folded into accounting by several texts; a device certificate
proves the device holds an issued credential, not that it is managed or compliant; passive infrared is never keyed on
covering a whole room; SP 800-207 says implicit trust zones are "as small as possible", not one resource per zone.

Sources read this turn: chapter `public/careers/security-plus-sy0-701/knowledge/d1.md` (AAA, Authenticating systems,
Infrared, Ultrasonic, Microwave, sensors compared, Implicit trust zones, physical layering at "How layering works", control
types table); NIST SP 800-207 §2 (local text: "the implicit trust zone must be as small as possible") and §2.2
assumption 3 ("Subject credentials alone are insufficient for device authentication"); RFC 2866 §2, §5.1, §5.7
(https://www.rfc-editor.org/rfc/rfc2866: start and stop records, Acct-Session-Time, octet counts);
https://en.wikipedia.org/wiki/Passive_infrared_sensor (PIR does not radiate energy; its wavelength "does not penetrate
glass very well"; zones with angles receiving almost no energy).

Build: `node dev/careers/build-bank.mjs security-plus-sy0-701 --preview --allow-short` shows no problem on these ids
(the 6 problems are C16 on objective 1.3). Only C10 warning: 3fd5834e.5 ("infrared" in the stem and the wrong option
Infrared sensor), acceptable: the stem names the failed sensor, which the option rejects for a stated technical reason.

| Id | P1 | P3 | P4 | Notes |
|---|---|---|---|---|
| i1-2-4810105c.7 | PASS | PASS | PASS | Only ring 4 (locked cabinets) has no detective control; d1.md types table (motion sensor, camera detective; guard and badge records detective). No bollard claim. Explain matches d1.md "deterring, then delaying, then detecting, and finally a timely response". Overlaps in theme with 4810105c.6 (fence with nothing watching) but a different scene and decision. |
| i1-2-0a8d33e2.4 | PASS | PASS | PASS | Options are AAA plus identification only, so the auditing vs accounting dispute is out of play. Session time and activity records are accounting (RFC 2866 §5.7, d1.md AAA step 4). Same key and option set as 0a8d33e2.2 but a different scene (file share, diagnosis) and decision. |
| i1-2-bcae1bd8.6 | PASS | PASS | PASS | Key no longer claims "managed"; explain says a certificate alone does not show patched or compliant. SP 800-207 §2.2 assumption 3 separates device from subject authentication. "Network team" is a role the style guide names. |
| i1-2-92e8e207.6 | PASS | PASS | PASS | PIR blocked by glass (Wikipedia PIR), ultrasonic stays in the room and microwave passes glass (d1.md table and step 2 "PIR or ultrasonic, not microwave"). No whole-room claim. Cleaners beyond a partition also appear in cd158454.3, but there drywall and a "which behaves this way" diagnosis: not the same scene. |
| i1-2-b1e0e898.8 | PASS | PASS | PASS | Third bullet ("send out no signal") decides PIR over ultrasonic; PIR "does not radiate energy" (Wikipedia). No whole-room claim. BEST justified: ultrasonic and the mat each meet two bullets, flagged partly. |
| i1-2-3fd5834e.5 | PASS | PASS | PASS | Ultrasonic keyed on filling the room and staying inside the plywood wall; d1.md "fill an enclosed space evenly, including areas a PIR detector's zones might miss"; Wikipedia PIR confirms zone gaps. Infrared why is now technical. |
| i1-2-0b9395bf.1 | PASS | PASS | PASS | Key matches SP 800-207 §2 verbatim in sense; option D why says "as small as possible", nothing about one resource per zone. |

## Totals
Checked 7. PASS all three passes: 7. Fixed: 0. Writer needed: 0. Dropped: 0. Stamped p1, p3 and p4 on all 7 (each
run twice).

## Heads-up outside scope
- i1-2-bcae1bd8.8 (not under review) keys "Proving the hardware is trusted". "Trusted" is vaguer than the held line
  (holds an issued credential); worth a look by the writer for consistency with bcae1bd8.6.

## bcae1bd8.8 (2026-11-17)

Reviewed after the fix for the heads-up above (rev 2): key now "Proving which machine is connecting", wrong option
"Proving which cashier is signing in". Same reviewer setup (did not write it).

| Id | P1 | P3 | P4 | Notes |
|---|---|---|---|---|
| i1-2-bcae1bd8.8 | PASS | PASS | PASS | Artifact (device CN, internal device CA, EKU Client Authentication, key in TPM) supports only device identity; key why says it does not show patched or compliant, matching the line held on bcae1bd8.6 (SP 800-207 §2.2 assumption 3; d1.md "Authenticating systems" steps 1 to 4). Cashier option fails on the CN naming a device; sales secrecy fails on the EKU; refunds is authorization. Options parallel, key not the odd one out. Only C10 warning: "stored" (artifact's "stored in TPM") echoed by a wrong option, a lure, acceptable. Scene (grocery POS terminal) shared with no other 1.1 or 1.2 question; distinct from .2 (toll camera), .3 (bank laptops), .6 (hospital MFA). |

Stamped p1, p3, p4 (each run twice).
