# d4b knowledge chapter: independent accuracy review 2

Reviewed `knowledge/d4b-knowledge.r8.md` (objectives 4.6 to 4.9). Corrected pass: `knowledge/d4b-knowledge.r9.md`. r8 was not
edited. Second reviewer; started from review 1's log (`reviews/d4b-kb-review1.md`), re-checked each of its fixes against
sources read in this session, then worked through its "could not verify" list, then read every section again as a
learner. Reference chapter for numbers: `d0-knowledge.r9.md`.

## Sources read in this session

| Key | Source | How |
|---|---|---|
| 63A | NIST SP 800-63A-4, pages.nist.gov/800-63-4/sp800-63a.html | fetched |
| 63B | NIST SP 800-63B-4, pages.nist.gov/800-63-4/sp800-63b.html | downloaded, text searched |
| 53 | NIST SP 800-53 Rev. 5 catalog (official OSCAL JSON, usnistgov/oscal-content): AC-2(2), AC-2(3), AC-6, AC-6(2), CM-2(2), CM-3(1), IR-4(1), RA-10 | downloaded, controls read |
| 218 | NIST SP 800-218 (SSDF 1.1) PDF | downloaded, text extracted |
| 61r2 | NIST SP 800-61 Rev. 2 (local full text) | searched |
| MS-MAX | Microsoft Learn, Maximum password age | fetched |
| PIM | Microsoft Learn, Assign Microsoft Entra roles in PIM | fetched |
| STS | AWS STS AssumeRole API reference | fetched |
| SG | AWS VPC user guide, security groups | fetched |
| CT | AWS Control Tower, About controls | fetched |
| OIDC | OpenID Connect Core 1.0 | downloaded, searched |
| MS-MIN, MS-HIST | Microsoft Learn, Minimum password age; Enforce password history | downloaded, searched |
| 86, 84, 61r3, SEDONA | NIST SP 800-86, SP 800-84, SP 800-61 Rev. 3 and the Sedona Commentary on Legal Holds (local full texts) | searched |
| GLOSS | NIST CSRC glossary, root cause analysis | fetched |
| FRCP | Federal Rules of Civil Procedure Rule 37(e), law.cornell.edu | fetched |
| EDRM | EDRM model page, edrm.net | fetched |
| SAML | OASIS SAML 2.0 Core and Profiles PDFs | downloaded, text extracted |
| OWASP | OWASP cheat sheets (raw markdown on GitHub): Multifactor Authentication, Credential Stuffing Prevention | downloaded, searched |
| TCPDUMP | tcpdump manual page, tcpdump.org | downloaded, searched |
| MS-4625 | Microsoft Learn, event 4625 | downloaded, searched |
| 92, 94 | NIST SP 800-92 and SP 800-94 (local full texts) | searched |
| RFC | RFC 4226, 4513, 6238, 6749, 7643, 7644, 8601, 9700 (rfc-editor.org text) | downloaded, searched |
| D0 | `d0-knowledge.r9.md` | local |

## Review 1's fixes, re-checked

| Fix | Verdict | Evidence |
|---|---|---|
| Identity proofing: KBV must not be used for identity verification; objectives list only "Attestation" | CONFIRMED | 63A: KBV "SHALL NOT be used for identity verification"; CSPs MAY use it for fraud management. IAL3 = on-site attended, trained proofing agent, at least one biometric (63A) matches the chapter. |
| Password age: 30 to 90 days, default 42, baseline drops expiration | CONFIRMED | MS-MAX: best practice 30 to 90 days; default domain policy 42 days; the Microsoft security baseline "doesn't contain the password-expiration policy". Range 0 to 999, minimum must be below maximum, matches. |
| OIDC nonce optional in code flow | CONFIRMED | OIDC Core (openid.net, text searched): "If a nonce value was sent in the Authentication Request, a nonce Claim MUST be present"; ID tokens MUST be signed (JWS), optionally encrypted. |
| Evidence hashing: SHA-256 current; MD5 and SHA-1 legacy; SP 800-86 told agencies to move from SHA-1 to SHA-224/SHA-256 | CONFIRMED | SP 800-86 local text: "should use SHA-1 instead of MD5", footnote "should plan to transition from SHA-1 to stronger forms of SHA (e.g., SHA-224, SHA-256) by 2010". D0 lists MD5 broken, SHA-2 current. |
| Legal hold: backup recycling stops only when backups hold relevant data found nowhere else; notice with acknowledgment and reminders; release after checking other holds | CONFIRMED | Sedona Commentary on Legal Holds (local PDF text): a hold generally does not apply to inaccessible backup tapes, which may keep being recycled, except tapes holding key custodians' documents not otherwise available. |
| Minimum password age 0 to 998, 1 day; history 0 to 24, set 24 | CONFIRMED | Microsoft Learn, Minimum password age and Enforce password history pages (fetched with curl). |

## Per section

### 4.6
- Biometrics: FIXED (two). (1) "CER is the number used to compare products" -> "a common single figure for comparing products" (no primary source makes it THE comparison number). (2) "allows five failed biometric attempts in a row (ten with PAD) before forcing a delay" -> no more than five (ten with PAD), then a delay of at least 30 seconds per try, and after 50 (100 with PAD) the biometric is disabled and another factor offered; added that NIST allows a biometric only as part of MFA with a physical authenticator (63B 3.2.3, quoted text read).
- Password length and complexity: FIXED. "accept at least 64 characters, spaces and Unicode" was listed under what 63B "requires"; 63B says verifiers SHOULD permit at least 64 and SHOULD accept spaces and Unicode -> "should accept". Matches D0 ("should accept").
- Passwordless authentication: FIXED (precision). Added that 63B no longer accepts an out-of-band prompt the user merely approves; the secret must be carried between the devices (63B note on the third out-of-band method and authentication fatigue). Needed because the card lists push approval as a passwordless method.
- Least privilege: PASS. Non-privileged accounts for nonsecurity functions VERIFIED (53 AC-6(2)); disabling expired, inactive, unowned accounts VERIFIED (53 AC-2(3)).
- PAM tools: PASS. Review 1 asked for a spot check: "refuses to remove the last active Global Administrator" VERIFIED (PIM: "You can't remove the last active role assignment for Global Administrators"; time-bound last assignments also stay at expiry).
- Just-in-time permissions: PASS. Eligible vs active, permanent vs time-bound VERIFIED (PIM).
- Ephemeral credentials: PASS. 900 s minimum, maximum session setting 1 to 12 hours, default 3600 s, role chaining one hour, session policies cannot grant more than the role VERIFIED (STS).
- Hard and soft tokens: PASS. 30-second step recommended, at most one step of network delay recommended, a second use of the same code must be refused VERIFIED (RFC 6238); HOTP resynchronization window VERIFIED (RFC 4226). Step matches D0.
- LDAP: PASS. Servers SHOULD by default fail unauthenticated binds (unwillingToPerform); simple bind not suitable without confidentiality VERIFIED (RFC 4513).
- OAuth 2.0: PASS. PKCE MUST for public clients, implicit SHOULD NOT, password grant MUST NOT VERIFIED (RFC 9700).
- Interoperability (SCIM): PASS. PUT replaces, PATCH modifies, PUT must not create; `active` attribute VERIFIED (RFC 7644, 7643).
- Password reuse, expiration and minimum age: PASS (see re-check table).
- SAML: FIXED (precision). "authorization decision ... rarely used in practice" -> adds that SAML 2.0 froze the authorization decision statement with no further work planned and points to XACML (expanded) for richer authorization (SAML 2.0 Core, OASIS PDF text: "has been frozen as of SAML V2.0").
- MFA and factors: PASS. OWASP sentence VERIFIED (OWASP Multifactor Authentication and Credential Stuffing cheat sheets: MFA "is by far the best defense against the majority of password-related attacks").
- All other 4.6 sections: PASS on a learner read.

### 4.7
- User provisioning automation: PASS. Temporary and emergency accounts removed or disabled automatically, "more consistent" VERIFIED (53 AC-2(2)).
- Guard rails: PASS. "guardrail" and "control" synonymous; preventive, detective and proactive; a control applies to every account in an OU VERIFIED (CT).
- Security group automation: PASS. Stateful; only allowed traffic reaches the instance; SSH and RDP only from specific ranges; no large port ranges; network ACLs as an added layer VERIFIED (SG).
- Ticket creation and escalation: PASS. "perhaps 15 minutes" VERIFIED (61r2).
- Continuous integration and testing: PASS. Review 1 asked for a spot check of the SSDF sentence: VERIFIED. 218 RV.1.2 Example 1 (configure the toolchain to perform automated code analysis and testing on a regular or continuous basis) and PW.8.2 Example 3 (incorporate tests for previously reported vulnerabilities so errors are not reintroduced).
- Automation benefits (efficiency, reaction time): PASS. IR-4(1) list (online incident management, live response data, full packet capture, forensic analysis) VERIFIED (53).
- Automation benefits (baselines, standard configurations): FIXED. "use automation to document, approve and block unapproved changes" -> "document proposed changes, ask the approvers, and block changes until they are approved". CM-3(1) automates documenting, notifying approvers and prohibiting changes until approval; the approval itself stays with people. CM-2(2) wording VERIFIED (53).
- Cross-reference to `### Security information and event management (SIEM)`: title exists in d4a-knowledge.r9.md.
- All other 4.7 sections: PASS on a learner read.

### 4.8
- Incident response process: PASS. Rev. 3 date April 2025 VERIFIED (61r3 text).
- Containment: PASS. Strategy criteria and the sandbox caution VERIFIED (61r2).
- Lessons learned: FIXED (precision). "no more than a few days after the incident ends" -> "within several days after the incident ends" (61r2: "should be held within several days of the end of the incident"; reworded so no 8-word run is copied). "Most often omitted" VERIFIED.
- Incident response training: PASS. Role-based content, timing (on assuming a role or gaining system access, on system changes, then periodically) VERIFIED (53 IR-2).
- Incident response testing: PASS. Checklists, walk-through or tabletop exercises, and simulations VERIFIED (53 IR-3); tabletops two to eight hours (operational level; senior level two to four) and functional exercise definition VERIFIED (84).
- Root cause analysis: PASS. NIST definition VERIFIED (GLOSS, from SP 800-30 Rev. 1 and SP 800-39); "underlying or systemic root causes" (RS.AN-03) and "remediate the root causes of the incident before production use" (RC.RP) VERIFIED (61r3). Five whys and fishbone: well-established quality methods, described generically; not checked against the CMS page.
- Threat hunting: PASS. Every NIST claim in the section VERIFIED word for word against RA-10 (53): active defense contrasted with firewalls, IDS/IPS and SIEM; search for indicators of compromise; detect, track and disrupt threats that evade controls; as early as possible; sharing with ISACs. "Hypothesis or lead" kept: RA-10 does not name hypotheses, so the wording stays as a common method, not a NIST claim.
- Digital forensics process: PASS (86).
- Legal hold: FIXED (precision, Rule 37(e)). Added the two conditions the rule sets that the summary left out: the information cannot be restored or replaced through other means, and curative measures follow a finding of prejudice and are "no greater than necessary" (FRCP). Sedona fixes from review 1 confirmed (table above).
- Forensic acquisition: PASS. Order matches RFC 3227 and D0; hash wording confirmed (table above).
- E-discovery: FIXED (completeness). EDRM stage names and descriptions VERIFIED (EDRM), but the page also lists disposition as a core phase and says the model is a conceptual view, not a strict sequence. Added one sentence saying so.
- All other 4.8 sections: PASS on a learner read.

### 4.9
- OS-specific security logs: PASS. Status 0xC000006A (bad password), 0xC0000064 (user name does not exist; repeated = enumeration) and 0xC000006F (outside authorized hours, used in 4.6) VERIFIED (MS-4625). Logon types 2, 3 and 10 match D0. The chapter never mentions logon type 8, so the D0 note about it does not apply. System events vs audit records VERIFIED (92).
- IPS/IDS logs: PASS. Not possible to eliminate all false positives and negatives; reducing one increases the other; tuning VERIFIED (94).
- Packet captures: PASS. tcpdump `-w` writes raw packets to a file; a smaller snapshot length discards data above the transport layer VERIFIED (TCPDUMP).
- Metadata: FIXED (example accuracy and format). (1) The angle brackets around the two addresses in code spans were dropped, as the brief asked, with a note that real headers carry them. (2) The `Authentication-Results` line had no authserv-id; RFC 8601 starts the field with the identity of the server that ran the checks: added `mx.company.example;`. (3) The old line read `spf=fail` for a message whose return path and sending server were both the outside host; SPF checks the envelope sender's domain, so that host's own mail would normally pass SPF for its own domain. Rewritten to `spf=pass smtp.mailfrom=mailer.badhost.example; dkim=none; dmarc=fail header.from=company.example`, and the explanation now says the spoof shows because nothing verified the company domain in From (RFC 8601 example layout read).
- All other 4.9 sections: PASS on a learner read (each stands alone; every scenario has one answer).

## Format checks on r9

First line "# ...", second line "Checked as of 2026-11 for SY0-701."; no em or en dash; no "http://" or "https://"; nothing matching an HTML tag; no heading over 110 characters; largest section 3,518 characters; no title duplicated within d4b or against the latest pass of every other chapter; no 12-word run and no 8-word prose phrase shared with outline.md (checked with `dev/careers/verbatim.mjs`). New wording was also compared with the sources it came from: one 8-word run from SP 800-61 Rev. 2 was reworded.

## Reference chapter (d0)

All numbers used here agree with `d0-knowledge.r9.md`: 30-second TOTP step, 63B password numbers (15 / 8 / should accept at least 64 / 100 attempts), event IDs, logon types, RFC 3227 order, MD5 broken and SHA-256 current. No error found in d0 on these points.

## Cards (not edited)

Review 1's three card cautions still stand (Attestation and Identity proofing give credit-history or "known personal details" checks without NIST's ban on knowledge-based verification; Passwordless lists push approval with no note that NIST does not count it as phishing resistant and no longer accepts an approve-only prompt). One more, minor: the card "Incident response process (SY0-701)" says "The ordered phases CompTIA lists"; if the course's naming rule covers the exam vendor, it should say "the SY0-701 objectives list". No card contradicts r9 on a number, order or definition; the Lessons learned card already says "within several days", which r9 now matches.

## Still not verified against a primary source

- Crossover error rate as another name for equal error rate: searched again; only vendor and training glossaries (all agree). Kept as established usage; "the number used to compare products" was softened.
- "Hypothesis" as the start of a hunt: RA-10 (read) does not mention it; the chapter keeps "hypothesis or lead" as a method, not a NIST statement.
- Password vaulting behavior (check-out, rotation after use, session brokering): product behavior with no standard; consistent with the card.
- Linux log paths (/var/log/auth.log on Debian and Ubuntu, /var/log/secure on the Red Hat family, or the journal): not re-checked against distribution documentation this session; widely known, and "or the systemd journal" covers systems without the files.
- Not re-read this session: NIST SP 800-162 (ABAC can be implemented in a mandatory or discretionary way), the NIST glossary entries for RBAC and for MAC as nondiscretionary, the WebAuthn and FIDO specifications (relying party ID, user presence vs verification), RFC 5321 (Received lines prepended; review 1 verified it), the CMS five whys and fishbone pages, and the ExifTool tag list. Each claim is generic or attributed in hedged terms, and none conflicts with those documents as commonly described.
