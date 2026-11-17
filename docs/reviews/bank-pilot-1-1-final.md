# Bank pilot 1.1: final review (passes 1, 3 and 4)

Reviewer: the final reviewer, which did not write, review or edit any of these questions before. Date: 2026-11-16.
No question was edited. File: `dev/careers/sources/security-plus-sy0-701/bank/1-1.json` (unchanged against HEAD while
reviewed and when stamped). Related: [plan](../plans/2026-11-16-exam-format-questions.md) (B3, B4, D2.1, C1 to C23, the
pass 3 list, the style guide), [pass 1](bank-pilot-1-1-pass1.md), [pass 3](bank-pilot-1-1-pass3.md),
[pass 4](bank-pilot-1-1-pass4.md), [round 2](bank-pilot-1-1-round2.md), [recheck of 8](bank-pilot-1-1-recheck8.md).

## Scope
- A. Passes 1 and 3 on the 4 questions the coordinator corrected after earlier passes: i1-1-172e8ab8.1,
  i1-1-55fcb3b6.7, i1-1-55fcb3b6.0, i1-1-02a955cb.7.
- B. Pass 4 (fact check of the key, every why line, the explain) on every question missing p4: the 17 round 2
  questions minus the two already counted in A (i1-1-02a955cb.7, i1-1-55fcb3b6.0), plus the 4 in A = 19.

## Sources read this pass
- NIST SP 800-53 Rev. 5 (OSCAL catalog 5.2.0, https://raw.githubusercontent.com/usnistgov/oscal-content/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json):
  AC-8, AT-2, CP-9, CP-10, IA-5(1), IA-5(2), IR-4, PE-3, PE-6, PL-4, SA-9, SC-26, SI-3, SI-4, SR-6.
- NIST CSRC glossary: https://csrc.nist.gov/glossary/term/technical_controls, https://csrc.nist.gov/glossary/term/management_controls,
  https://csrc.nist.gov/glossary/term/operational_controls (FIPS 200 definitions),
  https://csrc.nist.gov/glossary/term/compensating_controls (SP 800-53 Rev. 5 / SP 800-53B definition).
- The 1.1 cards in `public/careers/security-plus-sy0-701.json` and `public/careers/security-plus-sy0-701/knowledge/d1.md` section 1.1.
- NIST defines no six-type list (preventive, deterrent, detective, corrective, directive). For types the source is the
  chapter, backed by a specific control where one exists (as in the earlier pass 4).

## A. Passes 1 and 3

| id | pass 1 | pass 3 | notes | source |
|---|---|---|---|---|
| i1-1-172e8ab8.1 | PASS | PASS | Corrected D why ("Logical is another name for the technical category") drops the unsupported "older"; true per the card definition ("Also called a logical control"). Four category names, one family; Administrative's why matches the managerial card. | card 172e8ab8 definition; d1.md "Technical vs managerial vs operational vs physical" |
| i1-1-55fcb3b6.7 | PASS | PASS | Explain no longer says "relatively weak type". One defensible answer: "Nothing in its systems blocks sharing" rules out enforcement; B, C, D each name another type's job. Options parallel ("It [verb] ..."), key 38 characters tied with C, not single longest. Role present (auditors). | card 55fcb3b6 definition; d1.md "Directive controls"; SP 800-53 PL-4 (rules of behavior rest on acknowledgment) |
| i1-1-55fcb3b6.0 | PASS | PASS | Deterrent's why is now plain and matches d1.md ("deterrent warns of consequences"). Parallel "It ..." options; key not the longest. | card 55fcb3b6; d1.md "Deterrent controls", "Directive controls" common confusions |
| i1-1-02a955cb.7 | PASS | PASS | The recheck's fix is in: "impersonate the customer's site" (no look-alike domain claim). Detail is a literal substring. Revoking after misuse is corrective by the timing rule; the chapter lists "revoking a stolen certificate". Role (security engineer) and organization (web host); not a copy of 02a955cb.4. | d1.md "Corrective controls" examples |

## B. Pass 4

| id | verdict | source | note |
|---|---|---|---|
| i1-1-172e8ab8.1 | PASS | glossary technical_controls (FIPS 200); card 172e8ab8 ("Also called a logical control"); d1.md categories compared ("administrative equals managerial") | Key and every why line true. |
| i1-1-55fcb3b6.7 | PASS | d1.md "Directive controls"; SP 800-53 PL-4 | B's "not a policy" is broad but true of this stem's policy. |
| i1-1-55fcb3b6.0 | PASS | d1.md "Directive", "Deterrent", "Preventive", "Corrective"; SP 800-53 AC-8 (warning banner) | |
| i1-1-02a955cb.7 | PASS | d1.md "Corrective controls"; SP 800-53 IA-5(2) (relying parties check certificate status: CRL or status protocol, so revocation ends trust in the certificate) | Optional precision: the explain says "a stolen certificate" while the stem has the private key copied; the chapter uses the same shorthand, not an error. Possible wording if ever revised: "Revoking a certificate whose private key was stolen is a corrective control: ..." |
| i1-1-3aa6b30b.0 | PASS | glossary management, technical, operational controls (FIPS 200); SP 800-53 PE-3 | |
| i1-1-3aa6b30b.5 | PASS | glossary management_controls; SP 800-53 AT-2 (training delivered to users); d1.md "Managerial controls" common confusions | |
| i1-1-3aa6b30b.6 | PASS | glossary management_controls; SP 800-53 SA-9 (providers comply with organizational security requirements), SR-6; d1.md "a vendor security requirement" | |
| i1-1-867b6c50.3 | PASS | glossary operational_controls ("implemented and executed by people"); SP 800-53 PE-3 (verifying authorizations; procedural logs) | |
| i1-1-17eb1a96.0 | PASS | glossary technical, operational, management controls; SP 800-53 PE-3 (barriers, locks) | Key narrower than the card (no cameras), but the only option describing physical. |
| i1-1-17eb1a96.4 | PASS | SP 800-53 PE-3 ("physical access devices and barriers"); d1.md "Physical controls" | |
| i1-1-17eb1a96.5 | PASS | SP 800-53 PE-3 (guards, barriers); card 17eb1a96 key points (barrier vs person) | |
| i1-1-6e4e84fd.4 | PASS | d1.md "Deterrent controls" (more effort than the target is worth); card 6e4e84fd key points | Data note (not learner-facing): Corrective's `item` is the overview card. |
| i1-1-3ded6b7b.0 | PASS | SP 800-53 SI-4 (monitor to detect); card 3ded6b7b | Same data note on D's `item`. |
| i1-1-3ded6b7b.2 | PASS | SP 800-53 SC-26 (decoys "for detecting, deflecting, and analyzing" attacks); d1.md "Detective controls" (honeytokens) | The stem has the read complete, so no preventive reading. |
| i1-1-02a955cb.4 | PASS | SP 800-53 IR-4 (containment, eradication, recovery), IA-5(1)(a) (compromised passwords); d1.md lists "resetting a compromised password" as corrective | |
| i1-1-02a955cb.5 | PASS | SP 800-53 SI-3 ("detect and eradicate malicious code"), IR-4; glossary compensating_controls | |
| i1-1-02a955cb.9 | PASS | SP 800-53 IR-4 (eradication), CP-9 and CP-10 (restore from backup to a known state), AC-8 (banner), SI-4 (alerts); d1.md "Directive" (policy) | Exactly two corrective options. |
| i1-1-e28fd41b.6 | PASS | glossary compensating_controls (in lieu of the baseline control, comparable protection); SP 800-53 PE-3 ("Secure keys") | |
| i1-1-e28fd41b.8 | PASS | glossary compensating_controls; d1.md "Compensating controls" (exception record example) | |

## Totals
- Pass 1: 4 PASS, 0 FAIL. Pass 3: 4 PASS, 0 FAIL. Stamped p1 and p3 on all 4.
- Pass 4: 19 checked, 19 PASS, 0 FAIL. Error rate of pass 4 for these: 0 / 19 = 0%. Stamped p4 on all 19.
- Pilot pass 4 overall (with [pass 4](bank-pilot-1-1-pass4.md), 2 of 103): 2 failures in 122 checks = 1.6%.
- `build-bank.mjs --preview --allow-short`: no problems. Real build (`--allow-short`): 120 problems, every one
  "not stamped by oversight"; no question is missing p1, p2, p3 or p4 any more (p2 on i1-1-02a955cb.7 was present).

## Not done or still weak
- No NIST definition exists for preventive, deterrent, detective, corrective or directive; those keys rest on the
  chapter plus the nearest 800-53 control, as in the earlier pass 4.
- Optional wording note on i1-1-02a955cb.7's explain (above); not a fact error, not stamped as a failure.
- Oversight stamps are outside this review.
