# Question bank 1.2: fixes for the 7 questions oversight held (2026-11-17)

File: `dev/careers/sources/security-plus-sy0-701/bank/1-2.json`. Each changed question had `rev` raised by one; id,
slot, card, kind, level, pick and cardSig are unchanged. None is stamped. `node dev/careers/build-bank.mjs
security-plus-sy0-701 --preview --allow-short` prints `no problems` (only C10 "look at it in pass 3" warnings, none
new on these questions except the existing one on 3fd5834e.5).

| Id | Held because | What changed |
|---|---|---|
| i1-2-4810105c.7 (rev 3) | Contested: the key said no vehicle reaches an indoor corridor, but bollards are used indoors (this bank keys foot-traffic guidance as a bollard purpose). | New decision on the same artifact: the manager wants every ring to hold at least one control that reveals an intrusion. Ring 3 is now motion sensors along the vault corridor; the key is Ring 4 (locked cabinets only), letter D. Per the chapter's table, cameras, guards, badge logs and sensors are detective and locks are preventive, so only ring 4 falls short. No bollard claim remains. |
| i1-2-0a8d33e2.4 (rev 3) | Contested: Auditing keyed over Accounting for a log review; many texts fold log review into accounting. | Replaced the scene: an incident responder finds an account that signed in and was allowed into a share, but nothing records what it opened or how long it stayed. Ask: which AAA function was not working. Key Accounting (letter C); the options are the four AAA steps only, so auditing is no longer in play. No BEST, no runner. Different decision from 0a8d33e2.2 (which asks what provides a session record): this one diagnoses the missing function. |
| i1-2-bcae1bd8.6 (rev 2) | Inaccurate: the key claimed the certificate proves the hardware is managed. | Key now "Proof the hardware holds an issued credential", why: the CA-signed certificate shows the device holds a credential the hospital issued. Explain adds that a certificate alone does not show the device is patched or compliant. |
| i1-2-92e8e207.6 (rev 2) | Inconsistent: required "movement anywhere in the dispensary" and keyed infrared on covering the room. | Requirement is now motion detection along the dispensary's aisles, plus the glass wall the cleaners work behind. Infrared is keyed on sensing body heat and not sensing through glass; ultrasonic on echoes that stay inside the glass. Door contact and mat fail as single points; microwave passes through glass. No whole-room claim. |
| i1-2-b1e0e898.8 (rev 5) | Inconsistent: bullet "detect a person moving anywhere in the room" keyed PIR; explain said PIR "covers a room". | Bullet 1 is now "Detect a person walking between the instrument benches". PIR is keyed on body heat, not sensing through the wall, and sending nothing out (the deciding third bullet). Mat, edge and explain reworded to match; no whole-room claim. |
| i1-2-3fd5834e.5 (rev 3) | Inconsistent with the two above (it says PIR can miss gaps between zones). | Kept as the one PIR-gap question, which matches chapter d1.md ("areas a PIR detector's zones might miss"). The Infrared option's why now gives a technical reason ("watches separate zones and can miss a gap between them") instead of "the officer wants a different kind". |
| i1-2-0b9395bf.1 (rev 2) | Option D's why said "ideally one resource per zone"; NIST SP 800-207 says only "as small as possible". | Why now: "A department-wide zone is still large; Zero Trust keeps each zone as small as possible." |

## Sweep of all 360 questions

Searched every question for "anywhere in", "whole room", "entire room", "covers a/the room", "fills the room", "one
resource per" and similar, and read every question that mentions infrared or PIR. After the fixes above, no question
claims PIR covers a whole room and none says "one resource per zone". Remaining room-coverage wording is about
ultrasonic (1227072e.3, 3fd5834e.5, 3fd5834e.7), which chapter d1.md supports ("fill an enclosed space evenly").
