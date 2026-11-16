# d4b knowledge chapter r7: source notes

Chapter: `knowledge/d4b-knowledge.r7.md` (objectives 4.6 to 4.9). Written 2026-11-15/16 from `d4b-knowledge.r4.md`, `cards/d4b-cards.r4.json` and
`cards/d4b-extras.r2.json`. Every source below was read during this pass (web fetch, or the PDF text extracted locally). The chapter itself holds no links.

## Sources

| Key | Title | URL |
|---|---|---|
| 63B | NIST SP 800-63B-4, Authentication and Authenticator Management | https://pages.nist.gov/800-63-4/sp800-63b.html |
| 63A | NIST SP 800-63A-4, Identity Proofing and Enrollment | https://pages.nist.gov/800-63-4/sp800-63a.html |
| GLOSS | NIST CSRC glossary (mandatory access control, discretionary access control, role-based access control, least privilege, federation, identity proofing, single sign-on, attestation, chain of custody, root cause analysis, metadata, false accept rate, false reject rate) | https://csrc.nist.gov/glossary |
| 162 | NIST SP 800-162, Guide to ABAC (abstract page and PDF text) | https://csrc.nist.gov/pubs/sp/800/162/upd2/final |
| 53 | NIST SP 800-53 Rev. 5 catalog (OSCAL JSON): AC-2 and enhancements, AC-3(3), AC-3(4), AC-3(7), AC-3(13), AC-5, AC-6 and enhancements, AU-8, CM-2(2), CM-3(1), IR-2, IR-3, IR-4(1), RA-10 | https://raw.githubusercontent.com/usnistgov/oscal-content/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json |
| 61r2 | NIST SP 800-61 Rev. 2, Computer Security Incident Handling Guide (superseded; PDF text) | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-61r2.pdf |
| 61r3 | NIST SP 800-61 Rev. 3 (publication page and PDF text) | https://csrc.nist.gov/pubs/sp/800/61/r3/final |
| 84 | NIST SP 800-84, Guide to Test, Training, and Exercise Programs (PDF text) | https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-84.pdf |
| 86 | NIST SP 800-86, Guide to Integrating Forensic Techniques into Incident Response (PDF text) | https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-86.pdf |
| 92 | NIST SP 800-92, Guide to Computer Security Log Management (PDF text) | https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-92.pdf |
| 94 | NIST SP 800-94, Guide to Intrusion Detection and Prevention Systems (local text from an earlier pass, re-read) | https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-94.pdf |
| 41 | NIST SP 800-41 Rev. 1, Guidelines on Firewalls and Firewall Policy (local text, re-read) | https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-41r1.pdf |
| 218 | NIST SP 800-218, Secure Software Development Framework (local text, re-read) | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-218.pdf |
| 204C | NIST SP 800-204C, DevSecOps for microservices (publication page) | https://csrc.nist.gov/pubs/sp/800/204/c/final |
| R4513 | RFC 4513, LDAP Authentication Methods and Security Mechanisms | https://www.rfc-editor.org/rfc/rfc4513 |
| IANA | IANA service name and port number registry (ldap, ldaps) | https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.xhtml?search=ldap |
| R6749 | RFC 6749, The OAuth 2.0 Authorization Framework | https://www.rfc-editor.org/rfc/rfc6749 |
| R9700 | RFC 9700, Best Current Practice for OAuth 2.0 Security | https://www.rfc-editor.org/rfc/rfc9700 |
| OIDC | OpenID Connect Core 1.0 | https://openid.net/specs/openid-connect-core-1_0.html |
| SAML | OASIS SAML 2.0 Technical Overview | https://docs.oasis-open.org/security/saml/Post2.0/sstc-saml-tech-overview-2.0.html |
| R7644 | RFC 7644, SCIM Protocol (names RFC 7643 as the schema) | https://www.rfc-editor.org/rfc/rfc7644 |
| R6238 | RFC 6238, TOTP (also describes its relation to RFC 4226 HOTP) | https://www.rfc-editor.org/rfc/rfc6238 |
| WAUTHN | W3C Web Authentication Level 2 | https://www.w3.org/TR/webauthn-2/ |
| FIDO | FIDO Alliance, Passkeys | https://fidoalliance.org/passkeys/ |
| CISA-NM | CISA fact sheet, Implementing Number Matching in MFA Applications (PDF text) | https://www.cisa.gov/sites/default/files/publications/fact-sheet-implement-number-matching-in-mfa-applications-508c.pdf |
| OWASP-CS | OWASP Credential Stuffing Prevention Cheat Sheet | https://cheatsheetseries.owasp.org/cheatsheets/Credential_Stuffing_Prevention_Cheat_Sheet.html |
| OWASP-LI | OWASP LDAP Injection Prevention Cheat Sheet | https://cheatsheetseries.owasp.org/cheatsheets/LDAP_Injection_Prevention_Cheat_Sheet.html |
| MS-MIN | Microsoft Learn, Minimum password age | https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/security-policy-settings/minimum-password-age |
| MS-HIST | Microsoft Learn, Enforce password history | https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/security-policy-settings/enforce-password-history |
| MS-4625 | Microsoft Learn, event 4625 An account failed to log on (logon types, status codes, mention of 4624) | https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-4625 |
| MS-4720 | Microsoft Learn, event 4720 A user account was created | https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-4720 |
| MS-PIM | Microsoft Learn, What is Privileged Identity Management? | https://learn.microsoft.com/en-us/entra/id-governance/privileged-identity-management/pim-configure |
| MS-SOAR | Microsoft Learn, Automation in Microsoft Sentinel (SOAR, automation rules, playbooks) | https://learn.microsoft.com/en-us/azure/sentinel/automation/automation |
| AWS-STS | AWS STS API reference, AssumeRole | https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html |
| AWS-CT | AWS Control Tower, About controls | https://docs.aws.amazon.com/controltower/latest/controlreference/controls.html |
| AWS-SG | Amazon VPC user guide, security groups | https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html |
| R3227 | RFC 3227, Guidelines for Evidence Collection and Archiving | https://www.rfc-editor.org/rfc/rfc3227 |
| FRCP37 | Federal Rules of Civil Procedure, Rule 37(e) (Cornell LII) | https://www.law.cornell.edu/rules/frcp/rule_37 |
| EDRM | EDRM model | https://edrm.net/resources/frameworks-and-standards/edrm-model/ |
| R3954 | RFC 3954, Cisco NetFlow Version 9 | https://www.rfc-editor.org/rfc/rfc3954 |
| TCPD | tcpdump manual page | https://www.tcpdump.org/manpages/tcpdump.1.html |
| R5321 | RFC 5321, SMTP (Received trace lines are prepended) | https://www.rfc-editor.org/rfc/rfc5321.txt |
| R8601 | RFC 8601, Authentication-Results header field (spf, dkim results) | https://www.rfc-editor.org/rfc/rfc8601.txt |
| CMS-5W | CMS, Five Whys Tool for Root Cause Analysis (PDF text) | https://www.cms.gov/medicare/provider-enrollment-and-certification/qapi/downloads/fivewhys.pdf |
| CMS-FB | CMS, How to Use the Fishbone Tool for Root Cause Analysis (PDF text) | https://www.cms.gov/medicare/provider-enrollment-and-certification/qapi/downloads/fishbonerevised.pdf |
| FOWLER | Martin Fowler, Technical Debt (the debt and interest metaphor) | https://martinfowler.com/bliki/TechnicalDebt.html |
| EER | Innovatrics glossary, Equal Error Rate; Signzy glossary, FAR and FRR (CER is another name for EER; threshold trade-off). Secondary, vendor glossaries | https://www.innovatrics.com/glossary/equal-error-rate-eer/ and https://www.signzy.com/general-glossary/far-frr-biometric-error-rates |
| WS-HOLD | Web search summary of practitioner guides on litigation holds (trigger, notice to custodians, IT suspends deletion, release). Secondary | search of 2026-11-15, results listed in the session |
| WS-HUNT | Web search summary of guides on threat hunting (hypothesis-driven, starts without an alert). Secondary | search of 2026-11-15 |
| CARDS | The reviewed course cards for 4.6 to 4.9 (`cards/d4b-cards.r4.json`, `cards/d4b-extras.r2.json`) | local |

## Sources per section (in chapter order)

### 4.6
- Account provisioning and de-provisioning: 53 (AC-2, AC-2(2), AC-2(3)), CARDS
- Permission assignments and privilege creep: 53 (AC-6(7), AC-3(7)), CARDS
- Identity proofing: 63A, GLOSS, CARDS
- Attestation in identity management: GLOSS (attestation), 63A (no knowledge-based verification), 53 (AC-6(7)), CARDS
- Federation: GLOSS (federation), SAML, OIDC, CARDS
- Single sign-on (SSO): GLOSS (single sign-on), SAML (single logout), CARDS
- LDAP and LDAPS: R4513, IANA, OWASP-LI, CARDS
- OAuth 2.0: R6749, R9700, CARDS
- OpenID Connect: OIDC, CARDS
- SAML: SAML, CARDS
- SAML vs OAuth vs OIDC vs LDAP: SAML, R6749, OIDC, R4513
- Federation vs single sign-on: GLOSS, SAML, CARDS
- Interoperability (SCIM): R7644, CARDS
- Mandatory access control: GLOSS, 53 (AC-3(3))
- Discretionary access control: GLOSS, 53 (AC-3(4)), CARDS
- Role-based access control: GLOSS, 53 (AC-3(7), AC-5), CARDS
- Rule-based access control: 41 (deny by default, rulesets), CARDS
- Attribute-based access control: 162, 53 (AC-3(13), AC-2(6))
- MAC vs DAC vs RBAC vs rule-based vs ABAC: the five sections above
- Time-of-day restrictions: 53 (AC-2(11)), MS-4625 (status 0xC000006F, logon type 2), CARDS
- Least privilege: GLOSS, 53 (AC-6, AC-6(2), AC-6(7), AC-2(3)), 41 (deny by default), CARDS
- MFA and factors: 63B (phishing resistance, restricted PSTN), OWASP-CS, CARDS
- Biometrics: GLOSS (FAR, FRR), EER, 63B (attempt limits), CARDS
- Hard and soft tokens: R6238, 63B, CISA-NM, CARDS
- Security keys: WAUTHN, 63B, FIDO, CARDS
- Password length and complexity: 63B, CARDS
- Password reuse, expiration and minimum age: MS-MIN, MS-HIST, 63B, OWASP-CS, CARDS
- Password expiration vs minimum age vs history: MS-MIN, MS-HIST, 63B
- Password managers: 63B, CARDS
- Passwordless: FIDO, WAUTHN, 63B (syncable keys not at AAL3), CARDS
- PAM tools: MS-PIM, CARDS
- Just-in-time permissions: MS-PIM, CARDS
- Password vaulting: CARDS (no primary source located; kept to the cards' facts)
- Ephemeral credentials: AWS-STS, CARDS
- JIT vs vaulting vs ephemeral: MS-PIM, AWS-STS, CARDS
- Choosing an identity and access control: sections above

### 4.7
- Automation, scripting and orchestration (SOAR): MS-SOAR, CARDS
- User provisioning automation: 53 (AC-2(2)), R7644, CARDS
- Resource provisioning automation: 204C (infrastructure as code), CARDS
- Guard rails: AWS-CT, AWS-SG, CARDS
- Security group automation: AWS-SG, CARDS
- Ticket creation and escalation: 61r2 (escalation process, about 15 minutes), CARDS
- Enabling and disabling services and access: CARDS, 61r2 (containment)
- Continuous integration and testing: 218 (PW.7, PW.8, PO.3), 204C, CARDS
- Integrations and APIs: MS-SOAR, CARDS
- Benefits: efficiency, time saving, reaction time: 53 (IR-4(1), CM-2(2)), MS-SOAR, CARDS
- Benefits: enforcing baselines and standard configurations: 53 (CM-2(2), CM-3(1)), CARDS
- Enforcing baselines vs standard configurations vs guard rails: AWS-CT, 53, CARDS
- Benefits: scaling, workforce multiplier, retention: MS-SOAR (alert volume, freeing analysts), CARDS
- Considerations: complexity and cost: CARDS
- Considerations: single point of failure, technical debt, supportability: FOWLER, CARDS
- Benefits vs considerations: CARDS

### 4.8
- Incident response process: 61r2, 61r3, CARDS
- Preparation: 61r2 (jump kit, analysis resources, communication)
- Detection: 61r2 (precursors, indicators, events vs incidents), 94 (false positive and negative)
- Analysis: 61r2 (validation, correlation, prioritization factors, NTP, log retention)
- Containment: 61r2 (strategy criteria, sandbox, delayed containment), R3227
- Eradication: 61r2, 61r3
- Recovery: 61r2, 61r3
- Lessons learned: 61r2 (timing, questions, evidence retention), 61r3 (after-action report)
- Containment vs eradication vs recovery: 61r2
- Incident response training: 53 (IR-2)
- Incident response testing (tabletop, simulation): 84, 53 (IR-3), CARDS
- Root cause analysis: GLOSS, CMS-5W, CMS-FB, 61r3
- Threat hunting: 53 (RA-10), WS-HUNT, CARDS
- Digital forensics process: 86, 61r2
- Legal hold: FRCP37, EDRM, WS-HOLD, CARDS
- Chain of custody: GLOSS, 61r2 (evidence log), R3227
- Forensic acquisition and order of volatility: R3227, 86
- Evidence preservation: 86, 61r2 (evidence retention)
- Forensic reporting: 86, R3227
- E-discovery: EDRM, CARDS
- Legal hold vs chain of custody vs preservation vs e-discovery: the sections above

### 4.9
- Log data in investigations: 92, 61r2, 53 (AU-8)
- Firewall logs: 92, 61r2, CARDS (beaconing example)
- Application logs: 92
- Endpoint logs: CARDS, 92 (antimalware logs)
- OS-specific security logs: 92, MS-4625, MS-4720
- IPS/IDS logs: 94, 92 (sample alert format)
- Network logs: 92 (routers, authentication servers), R3954, CARDS
- Metadata: GLOSS, R5321, R8601, CARDS (EXIF, call records)
- Vulnerability scans: 61r2 (scanner in web logs as a precursor), CARDS
- Automated reports and dashboards: CARDS
- Packet captures: TCPD, CARDS
- Logs vs flow records vs packet captures vs metadata: R3954, TCPD, 92
- Firewall vs IDS/IPS vs endpoint vs OS vs application logs: 92, 94, CARDS
- Choosing a data source: sections above

## Cards that may need a second look
None found plainly wrong. Three notes for the reviewers:
1. `Attestation (identity and access management)` and `Identity proofing`: the cards give "questions drawn from credit history" as an identity check. NIST SP 800-63A-4 now says knowledge-based verification must not be used for identity verification. The chapter keeps the exam example and states the NIST position beside it; the card could carry the same caution.
2. `Hard and soft authentication tokens`: correct. The chapter adds that NIST counts typed one-time codes as not phishing resistant (63B).
3. `Acquisition (digital forensics)`: correct. NIST SP 800-86 (2006) still names MD5 and SHA-1 for evidence hashing; the chapter says to use a current hash such as SHA-256 and labels MD5 legacy. The SHA-256 recommendation was not traced to a source read in this pass (it relies on the Reference chapter).

## Left uncertain or thinly sourced
- Crossover error rate as another name for equal error rate: vendor glossaries only (EER); the NIST glossary pages for equal or crossover error rate returned 404.
- Legal hold workflow (notice to custodians, IT suspends deletion, release): secondary practitioner summaries (WS-HOLD); the primary sources read were FRCP 37(e) and the EDRM preservation stage.
- "Hypothesis" as the start of a threat hunt: secondary (WS-HUNT) plus the course card; the primary source (53 RA-10) says proactive search for indicators of compromise.
- Password vaulting, automated reports, dashboards, cost and complexity: no primary standard defines these; kept to the reviewed cards' facts and plain consequences.
- Examples and log lines in the chapter are invented for teaching (documentation address ranges, made-up hostnames); the event IDs, status codes, logon types and field names in them come from MS-4625 and MS-4720.
- The Linux log file names ("auth or secure log file, or the systemd journal") come from the course card, not from a source read in this pass.
- A web fetch limit stopped two planned checks (MITRE ATT&CK page, ASQ root cause page); nothing in the chapter depends on them.
