# Question bank 1.2, pass 3 (clarity, objectivity and format), part A: the first 18 cards

Reviewer: a pass 3 agent that did not write or earlier review these questions. Date: 2026-11-17. File:
`dev/careers/sources/security-plus-sy0-701/bank/1-2.json`, cards i1-2-dddf60a9 (CIA triad) through i1-2-2dbfd6d2
(Policy Enforcement Point), 180 questions. Judged against [the plan](../plans/2026-11-16-exam-format-questions.md) B3,
B4, D2.1, C1 to C23 and the pass 3 list (a) to (f), the style guide, and what pass 3 caught on 1.1
([pass 3](bank-pilot-1-1-pass3.md), [round 2](bank-pilot-1-1-round2.md), [round 3](bank-pilot-1-1-round3.md),
[round 4](bank-pilot-1-1-round4.md)). Earlier log for this part: [pass 1](bank-1-2-pass1-a.md). Scenes compared across
all 36 cards of 1.2 and all of 1.1.

## Totals
| Result | Count |
|---|---|
| PASS (stamped p3) | 156 |
| FIXED (wording only, back through the other passes) | 10 |
| WRITER (needs a rewrite; not edited) | 14 |

- Most serious: shared scenes. Fourteen questions repeat another question's situation with names changed (two copy 1.1
  questions, the rest copy 1.2 questions, three of them on their own card), and one is too easy. The Zero Trust cards
  overlap heavily (control plane, data plane, Policy Engine, PEP), so the same "who decides, who enforces" scene came
  back several times.
- Wording fixes: three key length or form tells, one key repeating a stem word C10 cannot see (no stemming), one
  odd-one-out option set, one inconsistent term, three stems with no person (pass 1's notes), one victim repeated
  across cards.
- BEST: all five kept (0a8d33e2.4, bcae1bd8.4, ffabbe55.4, b7e50561.4, 0b9395bf.4); each runner is honestly partly true
  of what the ask names, and every partly true option is flagged.
- C10 warnings: all looked at; every one in this part is a stem word in a WRONG option (a lure), none a key tell.
- Length: 45 of 162 pick 1 keys strictly longest before the fixes (28%, under 35%); no card over 5.
- `build-bank.mjs security-plus-sy0-701 --preview --allow-short` after the edits: no problems.
- Edited (rev raised to 2 where it was 1): i1-2-b6050128.3, i1-2-f3ff4328.0, i1-2-b7e50561.8, i1-2-380bde66.3, i1-2-479731d1.6, i1-2-2ba8977f.6, i1-2-2ba8977f.7, i1-2-b241c9e1.2, i1-2-2dbfd6d2.2, i1-2-2dbfd6d2.4.
  These need passes 1, 2 and 4 again (and p3 by another reviewer).
- Needs the writer: i1-2-dddf60a9.7, i1-2-dddf60a9.9, i1-2-f3ff4328.8, i1-2-bcae1bd8.2, i1-2-218c54fb.7, i1-2-d7797bd7.4, i1-2-d7797bd7.8, i1-2-b7e50561.7, i1-2-d12236b3.6, i1-2-14edb9e6.5, i1-2-14edb9e6.7, i1-2-0b9395bf.7, i1-2-b241c9e1.4, i1-2-2dbfd6d2.6.

## Still weak (passed)
- Most cards have three definition questions (two single-answer plus a select-TWO definition); the select-TWO ones were
  read as not "plain" definitions, as in 1.1.
- Some fourth options are earlier 1.2 terms or loose descriptions rather than close neighbors (14edb9e6.6, 2dbfd6d2.5,
  11f54fd8.6); fair, but worth tightening in refills.
- The "a colleague has it wrong; which corrects them" frame is used on several cards (b7e50561.6, d12236b3.5,
  b241c9e1.6); each corrects a different misconception, so it is a frame, not a copy.

## Per question
| Question | Result | What and why |
|---|---|---|
| i1-2-dddf60a9.0 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-dddf60a9.1 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-dddf60a9.2 | PASS | C10 warning ("controls" only in the wrong option "Access controls") is a lure the stem rules out ("even an employee with valid permission"), not a key tell. |
| i1-2-dddf60a9.3 | PASS | Stem "web server fails" and key "Redundant servers" share a word, but C10 (no stemming) and the plain availability reading make it fair; the other options are confidentiality and integrity controls. |
| i1-2-dddf60a9.4 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-dddf60a9.5 | PASS | Option C (Accounting) is an AAA term among CIA goals: a real 1.2 neighbor, not an off-topic attribute. |
| i1-2-dddf60a9.6 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-dddf60a9.7 | WRITER | Renamed copy of 1.1 question i1-1-e1ccd45a.6: a law office/law firm encrypts media so that a thief who steals it cannot read the files. Needs a new scene (another org, asset and reason); key may stay Encryption. |
| i1-2-dddf60a9.8 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-dddf60a9.9 | WRITER | Same scene as dddf60a9.2 on the same card: a role "must be able to detect any change" to stored records, answered by hashing. Needs a different integrity situation (for example a signed record exchanged with another party). |
| i1-2-b6050128.0 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-b6050128.1 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-b6050128.2 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-b6050128.3 | FIXED | Key "They show the files are unchanged, not who made them" was the strictly longest option (1.37 times the median) and the only one in an "X, not Y" form. Now "They prove integrity but not origin", parallel to option B "They prove both integrity and origin"; meaning unchanged. |
| i1-2-b6050128.4 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-b6050128.5 | PASS | C10 warnings (stem words "contracts manager", "public", "signed" in wrong options) are lures, not key tells. |
| i1-2-b6050128.6 | PASS | A copied private key also appears in 1.1 question i1-1-02a955cb.7, but there it leads to impersonation and revocation; here to denial of signed documents. Different situation. |
| i1-2-b6050128.7 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-b6050128.8 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-b6050128.9 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-0a8d33e2.0 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-0a8d33e2.1 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-0a8d33e2.2 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-0a8d33e2.3 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-0a8d33e2.4 | PASS | BEST kept: accounting and auditing both touch the records (two honest readings); the detail "reads through them looking for misuse" decides. Runner and partly flag right. |
| i1-2-0a8d33e2.5 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-0a8d33e2.6 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-0a8d33e2.7 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-0a8d33e2.8 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-0a8d33e2.9 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-f3ff4328.0 | FIXED | Key "Password plus a code from a phone app" was the strictly longest option (1.30 times the median). Now "Password plus a phone app code"; meaning unchanged. |
| i1-2-f3ff4328.1 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-f3ff4328.2 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-f3ff4328.3 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-f3ff4328.4 | PASS | C10 warnings ("security", "password" in wrong options) are lures. |
| i1-2-f3ff4328.5 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-f3ff4328.6 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-f3ff4328.7 | PASS | C10 warning ("password" in a wrong option) is a lure. |
| i1-2-f3ff4328.8 | WRITER | Same scene as f3ff4328.3 on the same card: a sign-in made of a password plus a personal question (first school / city of birth), key single-factor. The artifact form does not make it a new situation. Needs another single-factor or MFA case. |
| i1-2-f3ff4328.9 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-bcae1bd8.0 | PASS | C10 warnings ("device", "network" in wrong options) are lures. |
| i1-2-bcae1bd8.1 | PASS | The key is the only option about a device; that follows from the concept (the other AAA questions are about users), not a wording tell. Worth varying in a refill. |
| i1-2-bcae1bd8.2 | WRITER | Renamed copy of 1.1 question i1-1-172e8ab8.7: a network role sets the VPN gateway to accept or refuse laptops by their device certificate. Needs another device-authentication setting (Wi-Fi or NAC, a server, a non-laptop device). |
| i1-2-bcae1bd8.3 | PASS | Close to 1.1 question i1-1-172e8ab8.7 (laptops, valid password), but the situation differs: personal versus company laptops. Kept. |
| i1-2-bcae1bd8.4 | PASS | BEST kept: MAC filtering meets the first requirement (admit only owned tablets) and fails the second, so it is honestly partly true for what is asked; same rule applied to ffabbe55.4 and 0b9395bf.4. C10 warnings are lures. |
| i1-2-bcae1bd8.5 | PASS | C10 warning ("device" in a wrong option) is a lure. |
| i1-2-bcae1bd8.6 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-bcae1bd8.7 | PASS | C10 warnings are lures. |
| i1-2-bcae1bd8.8 | PASS | C10 warning is a lure. |
| i1-2-bcae1bd8.9 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-218c54fb.0 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-218c54fb.1 | PASS | C10 warning is a lure. |
| i1-2-218c54fb.2 | PASS | C10 warning ("shared") is a lure. |
| i1-2-218c54fb.3 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-218c54fb.4 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-218c54fb.5 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-218c54fb.6 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-218c54fb.7 | WRITER | Same scene as 0a8d33e2.3 (a user has already signed in successfully; which AAA function decides whether the next action is allowed) with names changed, and it tests the AAA card rather than its own card (authorization models). Needs a question about roles, groups or per-user grants. |
| i1-2-218c54fb.8 | PASS | C10 warning ("jtorres") is a lure. |
| i1-2-218c54fb.9 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-ffabbe55.0 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-ffabbe55.1 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-ffabbe55.2 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-ffabbe55.3 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-ffabbe55.4 | PASS | BEST kept: a scan and a penetration test measure part of the technology the stem names, so both are honestly partly true; the detail "covering policies, staff training and technology" decides. |
| i1-2-ffabbe55.5 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-ffabbe55.6 | PASS | C10 warning ("External audit" repeats the stem) is a deliberate lure that the detail "Months before" rules out plainly. |
| i1-2-ffabbe55.7 | PASS | Keys a neighboring term (risk assessment) at level 2; the gap analysis option is the lure. Fair. |
| i1-2-ffabbe55.8 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-ffabbe55.9 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-11f54fd8.0 | PASS | C10 warning is a lure. |
| i1-2-11f54fd8.1 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-11f54fd8.2 | PASS | C10 warning is a lure. |
| i1-2-11f54fd8.3 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-11f54fd8.4 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-11f54fd8.5 | PASS | C10 warning is a lure. |
| i1-2-11f54fd8.6 | PASS | Wrong options are earlier 1.2 terms rather than close neighbors; plausible design elements, kept. |
| i1-2-11f54fd8.7 | PASS | C10 warning is a lure. |
| i1-2-11f54fd8.8 | PASS | C10 warnings are lures. b241c9e1.4 repeats this scene and goes to the writer instead. |
| i1-2-11f54fd8.9 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-d7797bd7.0 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-d7797bd7.1 | PASS | Option B ("The gateways that carry traffic") is not a pair though the ask says "pairs"; minor. Key strictly longest at 1.29 times the median, under the 1.5 limit. |
| i1-2-d7797bd7.2 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-d7797bd7.3 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-d7797bd7.4 | WRITER | Renamed copy of 14edb9e6.4 (a securities trading firm keeps the planes apart so attackers on the user network cannot change policy). Also three wrong options are off-topic attributes (forgotten passwords, a disk failure, a mistyped address), not neighboring terms. Needs a new scene and real neighboring options. |
| i1-2-d7797bd7.5 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-d7797bd7.6 | PASS | C10 warning is a lure. |
| i1-2-d7797bd7.7 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-d7797bd7.8 | WRITER | Same artifact scene as 2ba8977f.8: a captured open-session instruction sent to the gateway in front of a payroll/ledger server, asking who sent it (here the plane, there the component; the sender line even names the policy administrator). Needs another control-plane artifact. |
| i1-2-d7797bd7.9 | PASS | C10 warning is a lure. |
| i1-2-b7e50561.0 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-b7e50561.1 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-b7e50561.2 | PASS | Shares "unknown device at night" with the b7e50561.8 artifact, but there the point is reading a policy table; kept. |
| i1-2-b7e50561.3 | PASS | C10 warnings are lures. |
| i1-2-b7e50561.4 | PASS | BEST kept: the requirement is itself a rule, so policy-driven access control is an honest second reading; "Medium risk must prompt a fresh MFA" decides. |
| i1-2-b7e50561.5 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-b7e50561.6 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-b7e50561.7 | WRITER | Same scene as d7797bd7.3: a bank's Zero Trust design work places adaptive identity in the control plane because it is a way of deciding (same key reasoning). Needs a different adaptive identity situation. |
| i1-2-b7e50561.8 | FIXED | Three wrong options began "It is allowed ..." and the key was the only "It is refused ...": an odd-one-out form tell. Options B and C reworded ("It must pass a fresh MFA prompt", "It gets read-only rights"); meanings and why lines unchanged. |
| i1-2-b7e50561.9 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-380bde66.0 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-380bde66.1 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-380bde66.2 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-380bde66.3 | FIXED | Renamed-copy fix: "the login of a sales representative ... was phished" repeated the victim of f3ff4328.7 (phished sales representative at a car dealership). Role is now an order clerk; detail and facts unchanged. |
| i1-2-380bde66.4 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-380bde66.5 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-380bde66.6 | PASS | C10 warning is a lure. |
| i1-2-380bde66.7 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-380bde66.8 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-380bde66.9 | PASS | C10 warning is a lure. |
| i1-2-479731d1.0 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-479731d1.1 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-479731d1.2 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-479731d1.3 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-479731d1.4 | PASS | C10 warnings are lures. |
| i1-2-479731d1.5 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-479731d1.6 | FIXED | The key "Auditors can see exactly why access was granted" was the only option repeating the stem's "auditor" (C10 misses it: no stemming). Now "The reason for each grant can be read"; same meaning, no longer the longest. |
| i1-2-479731d1.7 | PASS | C10 warning is a lure. |
| i1-2-479731d1.8 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-479731d1.9 | PASS | C10 warning is a lure. |
| i1-2-2ba8977f.0 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-2ba8977f.1 | PASS | C10 warning is a lure. |
| i1-2-2ba8977f.2 | PASS | C10 warning is a lure. |
| i1-2-2ba8977f.3 | PASS | C10 warnings are lures. Mid-session withdrawal also in d12236b3.4, but that asks who decided after a threat feed alert; different situation. |
| i1-2-2ba8977f.4 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-2ba8977f.5 | PASS | Shares the agent-plus-gateway layout with 2dbfd6d2.4; different ask (who configures both). Kept. |
| i1-2-2ba8977f.6 | FIXED | Option C wrote "enforcement point" in lower case while option B wrote "Policy Enforcement Point"; now "Policy Engine plus Policy Enforcement Point", parallel with the other options (and the key is no longer the longest). |
| i1-2-2ba8977f.7 | FIXED | Key "They are still two separate roles" was the only option starting with a pronoun, and "they" had no clear antecedent in the stem. Now "Deciding and acting are still two roles"; same meaning. rev stays 2 (already raised after pass 1, no p3 before). |
| i1-2-2ba8977f.8 | PASS | C10 warning is a lure. d7797bd7.8 repeats this artifact scene and goes to the writer. |
| i1-2-2ba8977f.9 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-d12236b3.0 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-d12236b3.1 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-d12236b3.2 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-d12236b3.3 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-d12236b3.4 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-d12236b3.5 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-d12236b3.6 | WRITER | Same scene as d7797bd7.7: a security architect places the component that makes access decisions and the answer is the control plane (Policy Engine). Needs a different Policy Engine situation. |
| i1-2-d12236b3.7 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-d12236b3.8 | PASS | C10 warning is a lure. Log format resembles 11f54fd8.8, but the ask (who decided a GRANT) differs. |
| i1-2-d12236b3.9 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-14edb9e6.0 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-14edb9e6.1 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-14edb9e6.2 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-14edb9e6.3 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-14edb9e6.4 | PASS | C10 warning is a lure. d7797bd7.4 repeats this scene and goes to the writer. |
| i1-2-14edb9e6.5 | WRITER | Same misconception scene as d12236b3.5 (a colleague believes the gateway/PEP decides; the fix says it applies a decision made elsewhere), with the same key idea as 2dbfd6d2.3. Needs a different data plane situation. |
| i1-2-14edb9e6.6 | PASS | Option D ("Gap analysis report") is far from the other components; a weak distractor, not a wrong one. Worth replacing in a refill. |
| i1-2-14edb9e6.7 | WRITER | A duplicate of 11f54fd8.1 (control plane decides, data plane enforces, with the reversed pair as a lure) under a thin scene, and the same trainer-sums-up-in-verbs-for-new-staff scene as 2dbfd6d2.7. Needs a new question for the data plane card. |
| i1-2-14edb9e6.8 | PASS | C10 warning is a lure. |
| i1-2-14edb9e6.9 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-0b9395bf.0 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-0b9395bf.1 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-0b9395bf.2 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-0b9395bf.3 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-0b9395bf.4 | PASS | BEST kept: a stronger edge firewall honestly improves the one gate; the detail (one gateway, 40 servers, in line with Zero Trust) decides. C10 warning is a lure. |
| i1-2-0b9395bf.5 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-0b9395bf.6 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-0b9395bf.7 | WRITER | Renamed copy of 380bde66.5 (an architect puts enforcement points in front of each system/app; which goal does it serve: threat scope reduction), and it keys another card's term. Needs a different implicit trust zone situation. |
| i1-2-0b9395bf.8 | PASS | C10 warnings are lures. |
| i1-2-0b9395bf.9 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-b241c9e1.0 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-b241c9e1.1 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-b241c9e1.2 | FIXED | No person in the stem (pass 1 note). Now "A storage administrator at a museum notes that a backup service account requests ..."; detail ("No person is involved in the request") and facts unchanged. |
| i1-2-b241c9e1.3 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-b241c9e1.4 | WRITER | Same scene as 11f54fd8.8: a user passes MFA but the device is out of date or noncompliant, access is limited, "which explains the result" with the device check as the key. Needs another subject/system situation. |
| i1-2-b241c9e1.5 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-b241c9e1.6 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-b241c9e1.7 | PASS | Same "architect draws the Zero Trust diagram" frame as other plane questions, but it places a different thing (the requester) in the data plane; a frame, not a copy. C10 warning is a lure. |
| i1-2-b241c9e1.8 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-b241c9e1.9 | PASS | C10 warning is a lure. |
| i1-2-2dbfd6d2.0 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-2dbfd6d2.1 | PASS | C10 warnings are lures. |
| i1-2-2dbfd6d2.2 | FIXED | No person in the stem (pass 1 note), and the organization (a water utility) repeated 2ba8977f.5. Now "A control systems engineer at a paper mill notes that an appliance ..."; detail and facts unchanged. New C10 warning ("control" only in the wrong option "Policy-driven access control") is a lure, not a key tell. |
| i1-2-2dbfd6d2.3 | PASS | C10 warning is a lure. |
| i1-2-2dbfd6d2.4 | FIXED | No person in the stem (pass 1 note). Now "A network architect at a consulting firm drafts a Zero Trust design in which ..." (law firm also dropped: used by four other 1.2 questions); detail and facts unchanged. Still shares the agent-plus-gateway layout with 2ba8977f.5, but asks a different thing (the shared role, not who configures them), so kept. |
| i1-2-2dbfd6d2.5 | PASS | Option D (a backup server off site) is a weak distractor; the others are fair. C10 warning is a lure. |
| i1-2-2dbfd6d2.6 | WRITER | Too easy (pass 1 note): the stem already says "the gateway cuts the connection" and asks which component cuts it. It also repeats 2dbfd6d2.3 on the same card (a gateway cuts a session mid-way after an instruction). Needs a new PEP question with a real deciding detail. |
| i1-2-2dbfd6d2.7 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
| i1-2-2dbfd6d2.8 | PASS | C10 warning is a lure. |
| i1-2-2dbfd6d2.9 | PASS | Role, organization and plain deciding detail (or a clean definition ask); parallel options from one family; no length, form or word tell; no shared scene found. |
