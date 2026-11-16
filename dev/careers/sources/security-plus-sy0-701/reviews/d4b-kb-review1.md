# d4b knowledge chapter: independent accuracy review 1

Reviewed `knowledge/d4b-knowledge.r7.md` (objectives 4.6 to 4.9, 87 sections, 212,975 characters). Corrected pass:
`knowledge/d4b-knowledge.r8.md` (87 sections, 213,865 characters, largest section under 3,700, no duplicate titles, no
heading over 110 characters, no dashes, no link text, no 12-word run shared with outline.md). r7 was not edited.

Method: every section read in full beside its course cards (`cards/d4b-cards.r5.json`, `cards/d4b-extras.r2.json`) and the
reviewed reference chapter (`d0-knowledge.r8.md`). Facts were checked against sources read in this session: web pages
fetched now, and the full texts of NIST and RFC documents already extracted in the session scratch folder (searched and
read now). Fixes: 53 lines changed.

## Sources read in this session

| Key | Source | Where |
|---|---|---|
| 63A | NIST SP 800-63A-4 | https://pages.nist.gov/800-63-4/sp800-63a.html |
| 63B | NIST SP 800-63B-4 | https://pages.nist.gov/800-63-4/sp800-63b.html |
| 61r2 | NIST SP 800-61 Rev. 2 (full text, local extract) | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-61r2.pdf |
| 61r3 | NIST SP 800-61 Rev. 3 (publication page, and PDF text extracted now) | https://csrc.nist.gov/pubs/sp/800/61/r3/final and https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-61r3.pdf |
| 84 | NIST SP 800-84 (full text, local extract) | https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-84.pdf |
| 86 | NIST SP 800-86 (full text, local extract) | https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-86.pdf |
| 92 | NIST SP 800-92 (full text, local extract) | https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-92.pdf |
| 94 | NIST SP 800-94 (full text, local extract) | https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-94.pdf |
| R3227 | RFC 3227 (local text) | https://www.rfc-editor.org/rfc/rfc3227 |
| R5321 | RFC 5321 (local text) | https://www.rfc-editor.org/rfc/rfc5321.txt |
| R9700 | RFC 9700 | https://www.rfc-editor.org/rfc/rfc9700.txt |
| OIDC | OpenID Connect Core 1.0 | https://openid.net/specs/openid-connect-core-1_0.html |
| STS | AWS STS AssumeRole | https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html |
| MS-MAX | Microsoft Learn, Maximum password age | https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/security-policy-settings/maximum-password-age |
| MS-MIN | Microsoft Learn, Minimum password age | https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/security-policy-settings/minimum-password-age |
| MS-4625 | Microsoft Learn, event 4625 (local copy of the page) | https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-4625 |
| FRCP | Federal Rules of Civil Procedure, Rule 37(e) | https://www.law.cornell.edu/rules/frcp/rule_37 |
| SEDONA | The Sedona Conference, Commentary on Legal Holds, Second Edition (2019), PDF text extracted now | https://thesedonaconference.org/sites/default/files/publications/Commentary%20on%20Legal%20Holds.pdf |
| EXIF | ExifTool GPS tag list (GPSLatitude, GPSLongitude) | https://exiftool.org/TagNames/GPS.html |
| D0 | Reference chapter `d0-knowledge.r8.md` (ports, OTP timing, 63B numbers, event IDs, logon types, order of volatility, hash status) | local |
| OUTLINE | `outline.md` (checked what the objectives do and do not list) | local |
| WS | Web searches of 2026-11-16 (crossover error rate, threat hunting hypothesis, Linux log files, password vaulting): only vendor and practitioner pages came back | secondary |

## The writer's flagged items

1. **Crossover error rate = equal error rate:** no primary definition found (searches returned vendor glossaries only, all agreeing). Kept: the card uses CER, and the equivalence is common, long-established usage. Listed under "could not verify" below.
2. **Legal hold workflow:** VERIFIED against SEDONA (trigger on reasonable anticipation; notice to custodians; auto-delete suspended; release procedure; holds also for government investigations and audits). Three details added from it (see 4.8).
3. **"A hunt starts from a hypothesis":** no primary source reached (a MITRE paper refused the fetch). The chapter already says "a hypothesis or lead", which matches the card and NIST's "proactive search" (RA-10 as cited by the writer). Kept unchanged.
4. **SHA-256 for evidence hashing:** VERIFIED and reworded. 86 names MD5 and SHA-1 but its own footnote tells agencies to plan a move from SHA-1 to stronger SHA forms such as SHA-256; D0 lists MD5 and SHA-1 as broken for collisions.
5. **Linux log file names:** common knowledge, confirmed only by secondary pages (all agree: auth.log on Debian and Ubuntu, secure on Red Hat family, or the journal). The usual file paths were added.
6. **EXIF:** GPS tags confirmed (EXIF). Camera model and date fields are common knowledge; unchanged.
7. **Password vaulting:** no primary standard found; the section stays within the card's facts. Unchanged.
8. **Knowledge-based verification:** VERIFIED (63A: must not be used for identity verification; may be used inside fraud management). The chapter's NIST statement is right. But the chapter also claimed the exam objectives mention credit-history questions under attestation: OUTLINE lists only the word "Attestation". Fixed (see 4.6).
9. **Three cross-references:** replaced with exact titles from d4a-knowledge.r8 and d5-knowledge.r8 (see 4.7, 4.8, 4.9).

## Per section

### 4.6
- Account provisioning and de-provisioning: PASS.
- Permission assignments and privilege creep: PASS.
- Identity proofing: FIXED. "though the exam objectives still mention credit-history questions under attestation" -> "though older practice, and much study material for this objective, still gives credit-history questions as an example". The objectives list only "Attestation" (OUTLINE). Steps, IAL1 to IAL3, proofing types and the KBV rule VERIFIED (63A).
- Attestation in identity management: FIXED (wording). "The exam uses it ..." -> "In identity management, where this objective lists it ..."; "an exam example" -> "a traditional example".
- Federation: PASS.
- Single sign-on (SSO): FIXED (wording). "The exam lists" -> "The SY0-701 objectives list".
- LDAP and LDAPS: PASS (ports match D0).
- OAuth 2.0: PASS. PKCE must, implicit should not, password grant must not: VERIFIED (R9700).
- OpenID Connect: FIXED. "A nonce sent in step 1 must come back unchanged" -> "If a nonce was sent in step 1, the token must carry the same value back" (the nonce is optional in the code flow; OIDC 3.1.3.7). Required claims and signing VERIFIED (OIDC).
- SAML: FIXED (wording). "the exam objectives write" -> "the SY0-701 objectives write".
- SAML vs OAuth vs OpenID Connect vs LDAP: FIXED (wording). Scenario no longer framed as an exam question or "trap".
- Federation vs single sign-on: FIXED (wording). "questions often offer both as answers" removed.
- Interoperability (SCIM): PASS.
- Mandatory access control: PASS.
- Discretionary access control: PASS.
- Role-based access control: FIXED (wording, "in a question").
- Rule-based access control: FIXED (wording: "exam server" in the scenario -> "grading server", so the word cannot be misread).
- Attribute-based access control: PASS.
- MAC vs DAC vs RBAC vs rule-based vs ABAC: FIXED (wording). "the exam usually spells out ..." removed; "question" -> "scenario".
- Time-of-day restrictions: PASS. Status 0xC000006F and logon type 2 VERIFIED (MS-4625, D0).
- Least privilege: PASS.
- MFA and factors: FIXED (wording). "The factors the exam lists" and "counts as a factor on this exam" -> the SY0-701 objectives list it. Phishing resistance and restricted status of phone-network codes VERIFIED (63B).
- Biometrics: PASS. Five attempts, ten with presentation attack detection: VERIFIED (63B). CER = EER kept (see above).
- Hard and soft tokens: PASS. 30-second step matches D0; worked example recomputed (1763200015 / 30 = step 58773333, ends at 1763200020): correct.
- Security keys: PASS.
- Password length and complexity: FIXED (wording). Two "the exam ..." sentences reworded. All 63B numbers VERIFIED (63B) and match D0.
- Password reuse, expiration and minimum age: FIXED (fact). "Windows guidance has suggested 60 to 90 days" -> "Microsoft's documentation for the Windows setting suggests 30 to 90 days, with a default of 42 days, and notes that Microsoft's own security baseline no longer includes password expiration" (MS-MAX). Minimum age 0 to 998, 1 day recommended, the cycling example: VERIFIED (MS-MIN). "The exam still expects" reworded.
- Password expiration vs minimum age vs history: FIXED (wording). "tested as a group", "distractor", "the exam's older answer", "in an exam question", "the exam tests" all reworded to what the objectives list.
- Password managers: PASS (63B: must allow managers and autofill, should allow paste).
- Passwordless authentication: FIXED (card alignment). The card lists a push approval on a trusted device as a passwordless method; the chapter did not mention it. Added one sentence, with NIST's view that push approvals are not phishing resistant (63B). Syncable keys barred at AAL3: VERIFIED (63B).
- PAM tools: PASS.
- Just-in-time permissions: PASS.
- Password vaulting: PASS (card facts only; no primary source exists to check against).
- Ephemeral credentials: PASS. 15 minutes, 1 to 12 hours, default 1 hour, role chaining 1 hour, session policy cannot widen: VERIFIED (STS).
- JIT vs vaulting vs ephemeral: PASS.
- Choosing an identity and access control: FIXED (wording). "Scenario questions ... offer controls", "How to work a question", "distractors" reworded.

### 4.7
- Automation, scripting and orchestration (SOAR): FIXED (cross-reference). Now points to `### Security information and event management (SIEM)` (exact title in d4a-knowledge.r8).
- User provisioning automation: PASS.
- Resource provisioning automation: PASS.
- Guard rails: PASS.
- Security group automation: FIXED (wording, "a question may mean either").
- Ticket creation and escalation: PASS. "about 15 minutes" VERIFIED (61r2).
- Enabling and disabling services and access: PASS.
- Continuous integration and testing: PASS.
- Integrations and APIs: PASS.
- Benefits: efficiency, time saving, reaction time: PASS.
- Benefits: enforcing baselines and standard configurations: PASS.
- Enforcing baselines vs standard configurations vs guard rails: FIXED (wording, two "question" phrases).
- Benefits: scaling, workforce multiplier, retention: PASS.
- Considerations: complexity and cost: PASS.
- Considerations: single point of failure, technical debt, supportability: PASS.
- Automation benefits vs considerations: FIXED (wording). "Questions on this objective usually describe ..." and "A question that says 'which use case' wants ..." reworded.

### 4.8
- Incident response process: FIXED (wording). "The exam's list" / "The exam uses" -> "The SY0-701 objectives list / use". Rev. 3 date (April 2025), CSF 2.0 basis and "use the model that suits" VERIFIED (61r3). Phases match D0.
- Preparation: PASS.
- Detection: PASS. Precursors rare, indicators common: VERIFIED (61r2).
- Analysis: PASS. Three prioritization factors VERIFIED (61r2).
- Containment: PASS. Sandbox and delayed-containment liability VERIFIED (61r2).
- Eradication: PASS (61r2: sometimes not needed or done during recovery).
- Recovery: FIXED (cross-reference). Now points to `### Recovery time objective (RTO) vs recovery point objective (RPO)` (exact title in d5-knowledge.r8).
- Lessons learned: PASS. "within several days", "most often omitted" VERIFIED (61r2); after-action report VERIFIED (61r3).
- Containment vs eradication vs recovery: FIXED (wording). "the exam usually labels" -> "by convention"; "questions follow" reworded.
- Incident response training: PASS.
- Incident response testing: PASS. Two to eight hours VERIFIED (84).
- Root cause analysis: PASS. "underlying or systemic root causes" VERIFIED (61r3).
- Threat hunting: PASS (hypothesis point kept as "hypothesis or lead"; see flagged item 3).
- Digital forensics process: PASS. Four phases, master and working copy, the legal meaning of "evidence", and "most malware incidents do not merit evidence acquisition" VERIFIED (86, 61r2).
- Legal hold: FIXED (precision, from SEDONA). (1) "backup tape rotation ... stop for the data in scope" -> backup media recycling stops "when the backups hold relevant data that exists nowhere else" (courts do not require keeping every backup tape). (2) Notice step: added that it explains how to preserve, and that recipients acknowledge it and get reminders. (3) Release step: added the check that no other hold covers the same data. Rule 37(e) summary VERIFIED (FRCP).
- Chain of custody: PASS.
- Forensic acquisition and order of volatility: FIXED (fact). "Use a current algorithm such as SHA-256; MD5 is legacy and should not be relied on alone" -> SHA-256 current; MD5 and SHA-1 both legacy with known collision attacks; 86 names them but already told agencies to plan a move to SHA-2 (86 footnote; D0). The old sentence left SHA-1 unlabelled and implied MD5 is fine beside another hash. Order of volatility VERIFIED (R3227) and matches D0 and the card.
- Evidence preservation: PASS (61r2: months or years; until legal action ends).
- Forensic reporting: PASS (86: alternative explanations).
- E-discovery: PASS.
- Legal hold vs chain of custody vs preservation vs e-discovery: PASS.

### 4.9
- Log data in investigations: PASS.
- Firewall logs: PASS.
- Application logs: PASS. Four categories VERIFIED (92).
- Endpoint logs: PASS.
- OS-specific security logs: FIXED (precision). Linux: "an auth or secure log file" -> the usual paths /var/log/auth.log (Debian, Ubuntu) and /var/log/secure (Red Hat family), or the systemd journal. Event IDs, logon types and status codes 0xC000006A and 0xC0000064 VERIFIED (MS-4625) and match D0.
- IPS/IDS logs: PASS. False positives and negatives trade off; tuning: VERIFIED (94).
- Network logs: PASS.
- Metadata: PASS. Received lines are prepended: VERIFIED (R5321). EXIF GPS: VERIFIED (EXIF).
- Vulnerability scans: FIXED (cross-reference). Now points to `### Vulnerability scan (identification method)` and `### Vulnerability management life cycle (identify, analyze, respond, validate, report)` (exact titles in d4a-knowledge.r8).
- Automated reports and dashboards: PASS.
- Packet captures: PASS.
- Logs vs flow records vs packet captures vs metadata: PASS.
- Firewall vs IDS/IPS vs endpoint vs OS vs application logs: FIXED (wording). "Five log types are offered together in most questions" (the table has six rows) and "the exam still treats ..." reworded.
- Choosing a data source: FIXED (wording). "Scenario questions give ...", "How to work a question", "never the best answer when ... offered" reworded.

## Cards that may be wrong or need a caution (cards not edited)

1. `Attestation (identity and access management)`: gives "questions drawn from credit history" as an identity check, and its example has a new hire answering questions from a credit report. NIST SP 800-63A-4 says knowledge-based verification must not be used for identity verification. The card describes a traditional practice without saying it is no longer accepted; it should carry that caution.
2. `Identity proofing`: "confirming known personal details" as a proofing method has the same problem, more mildly.
3. `Passwordless authentication`: lists "a push approval on a trusted device" beside passkeys and security keys with no note that push approvals are not phishing resistant (63B) and are open to MFA fatigue. Not wrong, but it reads as equal strength.
No card was found plainly wrong on a number, port, order or definition.

## Could not verify against a primary source

- Crossover error rate as another name for equal error rate (vendor glossaries only).
- "Hypothesis" as the usual start of a threat hunt (vendor and practitioner pages only; chapter says "hypothesis or lead").
- Password vaulting details (check-out, rotation after use, session opening without showing the password): product behavior, no standard; consistent with the card.
- Linux log file paths: secondary pages only, all in agreement. Newer Debian installs may have only the journal, which the sentence allows for.
- Not re-read in this session, relying on the writer's source notes: the NIST SP 800-53 control texts (AC-2, AC-3, AC-6, IR-2, IR-3, IR-4, CM-2, CM-3, RA-10), NIST SP 800-162, RFC 4513, RFC 6749, RFC 7644, the SAML overview, WebAuthn, the Microsoft Entra PIM page, AWS Control Tower and security group pages, the EDRM stages, the CMS root cause tools, the tcpdump manual, RFC 8601, the Enforce password history page. Nothing in them contradicted what I know of those documents, but a second reviewer should spot-check the PIM claim (last Global Administrator cannot be removed) and the SSDF sentence on tests for previously reported vulnerabilities.
- Angle brackets appear inside two code spans in the email header example (addresses in `From:` and `Return-Path:`). They are not HTML and were left; if the build's HTML check objects, drop the brackets.
