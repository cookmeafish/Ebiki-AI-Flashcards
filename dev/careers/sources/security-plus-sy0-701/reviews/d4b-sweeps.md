# d4b sweeps (objectives 4.6 to 4.9), pass r2 to r3

Files: `cards/d4b-cards.r3.json` (103 cards, same order, obj and path as r2) and `knowledge/d4b-knowledge.r3.md`.
Every card was read in every sweep. Owner rule kept: no true, helpful detail was removed; changes only fix what a source showed wrong or add what was missing, in our own words. A 12-word copy check ran on every new text against the outline and against each source document read (0 runs found).

Totals: 103 cards checked in each of the 10 sweeps; 20 field changes on 18 cards; the knowledge chapter got the same 14 fixes. Sources are listed per card at the end.

## Sweep 1: Facts
Checked every definition against NIST glossary entries, NIST SP 800-63A/B-4, SP 800-61 Rev. 2 and Rev. 3, SP 800-84, SP 800-86, SP 800-92, RFCs 3227, 4226, 4511, 4513, 6238, 6749, OpenID Connect Core, OASIS SAML overview, W3C WebAuthn, and vendor docs (Microsoft, AWS).
Checked 103, changed 4.
- **LDAP** keyPoints. Before: "Plain LDAP binds can send credentials in cleartext". After: "... in cleartext, so protect them with LDAPS or StartTLS". Source: RFC 4513 section 5.1.3 (name and password binds must be protectable with TLS via StartTLS and should be refused without it) https://www.rfc-editor.org/rfc/rfc4513
- **SAML** keyPoints. Before: "Built for web browsers, not designed for native mobile apps". After: "Built mainly for browser-based SSO; native mobile apps and APIs usually use OAuth 2.0 with OpenID Connect instead". Why: SAML 2.0 also defines non-browser profiles, so "not designed for" overstated it. Sources: OASIS SAML 2.0 Technical Overview https://docs.oasis-open.org/security/saml/Post2.0/sstc-saml-tech-overview-2.0.html, OpenID Connect Core https://openid.net/specs/openid-connect-core-1_0.html
- **Legal hold** definition. Before: "preserve all data related to a case or expected lawsuit". After: "... a case, an expected lawsuit, a government investigation or an audit". Source: Wikipedia "Legal hold" summary (holds also follow audits and government investigations).
- **Containment** keyPoints. Before: "Sandboxing a sample is also a containment technique". After: "Sandboxing is also a containment technique: isolate a sample to study it, or redirect an attacker into a sandbox to watch them (only with legal approval)". Source: NIST SP 800-61 Rev. 2 section 3.3 (redirecting an attacker to a sandbox is a form of containment, discuss with legal first) https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-61r2.pdf

## Sweep 2: Numbers and names
Checked ports (LDAP 389, LDAPS 636 in the IANA registry), RFC numbers, NIST document numbers and dates (SP 800-61 Rev. 3 published April 2025; Rev. 2 withdrawn April 3, 2025), TOTP/HOTP, Windows password policy ranges, AWS STS durations, acronym expansions (SAML's OASIS name is singular "Assertion", already noted on the card).
Checked 103, changed 6.
- **Password best practices** keyPoints. Before: "Current NIST SP 800-63B guidance favors length and breached-password checks over forced complexity and routine expiration". After: "NIST SP 800-63B-4 (2025): at least 15 characters when the password is the only factor (8 when part of MFA), check new passwords against a blocklist of common or breached ones, no character-mix rules, no forced periodic changes". Source: NIST SP 800-63B-4 section 3.1.1.2 https://pages.nist.gov/800-63-4/sp800-63b.html
- **Length** keyPoints: added "NIST SP 800-63B-4 sets a minimum of 15 characters for a password used alone and 8 for one used with another factor". Same source.
- **Hard and soft authentication tokens** keyPoints: added "RFC 6238 recommends a 30-second time step for TOTP". Source: RFC 6238 https://www.rfc-editor.org/rfc/rfc6238
- **Acquisition** keyPoints. Before: "Order of volatility: CPU registers and cache, then memory, then temporary files, then disk, then remote logs, then archives". After: the full RFC 3227 list (registers and cache; routing table, ARP cache, process table and memory; temporary file systems; disk; remote logs and monitoring data; physical configuration and network topology; archival media). Source: RFC 3227 section 2.1 https://www.rfc-editor.org/rfc/rfc3227
- **Ephemeral credentials** keyPoints: added "Example: AWS STS temporary credentials last from 15 minutes up to 12 hours". Source: AWS STS AssumeRole DurationSeconds 900 to 43200 https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html
- **Lessons learned** keyPoints. Before: "Hold it soon after the incident". After: "... (NIST suggested within several days)". Source: NIST SP 800-61 Rev. 2 section 3.4.1.

## Sweep 3: Examples
Checked each example is concrete and an instance of its own concept (not a neighbour): e.g. the rule-based example is a rule for everyone (firewall ACL, lab logins after 6 p.m.), the ABAC example combines several attributes, the minimum-age example is about cycling past history, the tabletop example touches no systems, the e-discovery example is producing data, not analysing an attack. Port 4444 (firewall log example) and "last 24 passwords" (Windows history maximum, Microsoft Learn) checked.
Checked 103, changed 0.

## Sweep 4: Key points
Checked each key point is true and useful; added missing exam-useful facts.
Checked 103, changed 5.
- **Complexity** keyPoints: added "NIST SP 800-63B-4 says verifiers shall not require a mix of character types; the exam still lists complexity as a policy setting". Source: SP 800-63B-4 section 3.1.1.2.
- **Password managers** keyPoints: added "NIST SP 800-63B-4 requires sites to allow password managers and autofill, and recommends allowing paste". Same source.
- **Just-in-time (JIT) permissions** keyPoints: added the Microsoft Entra Privileged Identity Management example (eligible role activated for a set time). Source: https://learn.microsoft.com/en-us/entra/id-governance/privileged-identity-management/pim-configure
- **Guard rails** keyPoints: added "AWS Control Tower used the name guardrails for these rules and now calls them controls". Source: https://docs.aws.amazon.com/controltower/latest/userguide/controls.html
- **Incident response process** keyPoints: added that phases loop in practice (back to detection and analysis while eradicating). Source: NIST SP 800-61 Rev. 2 section 3.

## Sweep 5: Confusables
Checked across cards: IDS vs IPS, JIT vs ephemeral credentials, password manager vs PAM vaulting, expiration (maximum age) vs age (minimum age), legal hold vs chain of custody vs e-discovery, containment vs eradication vs recovery, tabletop vs simulation, rule-based vs role-based vs ABAC, federation vs SSO, OAuth vs SAML vs LDAP, forensic reporting vs automated reports, two "complexity" cards (password vs automation), somewhere you are vs something you are, logs vs packet captures vs flow data.
Checked 103, changed 2.
- **Passwordless authentication** keyPoints: added synced vs device-bound passkeys, so it does not clash with the Security keys card's "the private key never leaves the device". Source: NIST SP 800-63B-4 Appendix B (syncable authenticators export the private key) and W3C WebAuthn.
- **Tabletop exercise** keyPoints: added NIST SP 800-84's terms (tabletop = discussion-based; functional exercise = staff perform duties in a simulated setting) so the learner can map NIST wording to "simulation". Source: https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-84.pdf

## Sweep 6: Coverage
Checked every outline line of 4.6 to 4.9 against the cards: each line has exactly one card with the same path, and each card names everything its line lists (MFA implementations and the four factors; five password settings; three PAM features; nine automation use cases, seven benefits, five considerations; seven IR phases; six forensic activities; seven log types and four data sources).
Checked 103, changed 0. Missing concepts are under "Proposed new cards".

## Sweep 7: Consistency
Checked the same fact reads the same on every card and in the chapter: NIST password guidance now names SP 800-63B-4 everywhere (cards 30, 31, 32, 34, 36 and the chapter note); expiration = maximum age and age = minimum age everywhere; LDAP ports; containment before eradication before recovery; order of volatility identical on the card and in the chapter.
Checked 103, changed 3.
- **Expiration** keyPoints. Before: "NIST SP 800-63B now advises changing only on evidence of compromise". After: "NIST SP 800-63B-4 forbids forced periodic changes but requires a change when there is evidence of compromise" (matches the Password best practices card). Source: SP 800-63B-4 section 3.1.1.2.
- **Hard and soft authentication tokens** keyPoints. Before: "SMS codes are weaker (SIM swapping)". After: adds "NIST SP 800-63B-4 lists codes sent by SMS or voice call as a restricted authenticator" (same NIST version as the password cards). Source: SP 800-63B-4 sections 3.1.3.3 and 3.2.9.
- **Legal hold** keyPoints: trigger list now matches the corrected definition (litigation, expected litigation, an investigation or an audit).
- Knowledge chapter r3: the same 14 fixes applied (LDAP bind protection, SAML and mobile, TOTP step and SMS status, the NIST 800-63B-4 note, password managers, synced passkeys, PIM example, STS durations, Control Tower, lessons-learned timing and the phase loop, sandbox containment, NIST 800-84 exercise terms, legal hold triggers, full order of volatility).

## Sweep 8: Clarity
Checked every field is plain, short and readable on first pass, no em or en dashes, no HTML (validated by script on both r3 files). Added text was written to the same style.
Checked 103, changed 0.

## Sweep 9: Exam fit
Checked wording against how SY0-701 frames each topic: somewhere you are counted as a factor; the seven-phase IR list (with NIST Rev. 2 and Rev. 3 marked as background); attestation in CompTIA's identity sense plus access and device senses; password settings still taught for the exam while NIST's current advice is marked (complexity and expiration are flagged as discouraged by NIST, not removed).
Checked 103, changed 0 (the outdated-guidance flags were added in sweeps 2, 4 and 7).

## Sweep 10: Final adversarial pass
Tried to prove each card wrong, and re-checked every change above against its source text read this session. Specific attacks: "length is the strongest defense" (NIST makes length the primary password factor: holds); "LDAP uses TCP 389" (IANA lists 389 TCP and UDP; the card's TCP claim is true); "TOTP changes every 30 seconds" (RFC 6238 recommends 30 as default: holds); MAC "only administrators set labels" (NIST: a central authority, users cannot change rights: holds); DAC (NIST: owner decides: holds); chain of custody (NIST SP 800-72/800-101: who, when, purpose: holds); FAR/FRR meanings (ISO/IEC 19795-1 via NIST glossary: hold).
Checked 103, changed 0; nothing reverted.

## Proposed new cards
1. **OpenID Connect (OIDC)**: an identity layer on OAuth 2.0 that adds authentication (ID token). Why: four d4b cards contrast it with OAuth and SAML, and modern SSO and "Sign in with" buttons use it, but no outline line covers it. Source: https://openid.net/specs/openid-connect-core-1_0.html
2. **SOAR (security orchestration, automation and response)**: the platform that runs playbooks across tools. Why: it is in CompTIA's acronym list and 4.7 cards rely on it, but no 4.7 line names it. Source: https://learn.microsoft.com/en-us/azure/sentinel/automation/automation
3. **Order of volatility**: collect the most short-lived evidence first. Why: an exam staple taught only inside the Acquisition card; a standalone card would let it be quizzed directly. Source: RFC 3227 section 2.1.
4. **SCIM (System for Cross-domain Identity Management)**: the standard for automated account provisioning between an IdP and cloud apps. Why: ties 4.6 provisioning and 4.7 user provisioning to a real standard (named in the Interoperability example). Source to confirm by the coordinator: RFC 7643/7644 (not read this session).

## Unsure
- **Attestation (identity sense)**: the "extra details such as passport, in-person meeting, credit-history questions" meaning comes from CompTIA study material, which could not be read this session; NIST uses attestation for authenticators and devices (glossary, SP 800-63-4). Kept as is, since the card already gives both senses.
- **4.7 benefits and considerations** (employee retention, workforce multiplier, technical debt, ongoing supportability and the rest) have no primary standard; they were checked for internal sense and against Microsoft Sentinel's automation page, not against a standards document.
- **"Something you do" not on the list**: matches the outline's four factors; not re-checked against CompTIA's own exam objectives PDF.

## Sources per card

Keys:

- **B4**: NIST SP 800-63B-4 https://pages.nist.gov/800-63-4/sp800-63b.html
- **A4**: NIST SP 800-63A-4 https://pages.nist.gov/800-63-4/sp800-63a.html
- **GL**: NIST CSRC glossary https://csrc.nist.gov/glossary (terms: ABAC, MAC, DAC, RBAC, least privilege, federation, single sign-on, attestation, FAR, FRR, chain of custody, metadata, root cause analysis)
- **R3227**: RFC 3227 https://www.rfc-editor.org/rfc/rfc3227
- **R6238**: RFC 6238 https://www.rfc-editor.org/rfc/rfc6238
- **R4226**: RFC 4226 https://www.rfc-editor.org/rfc/rfc4226
- **R6749**: RFC 6749 https://www.rfc-editor.org/rfc/rfc6749
- **R4513**: RFC 4513 https://www.rfc-editor.org/rfc/rfc4513
- **R4511**: RFC 4511 https://www.rfc-editor.org/rfc/rfc4511
- **IANA**: IANA port registry https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.csv
- **OIDC**: OpenID Connect Core 1.0 https://openid.net/specs/openid-connect-core-1_0.html
- **SAML**: OASIS SAML 2.0 Technical Overview https://docs.oasis-open.org/security/saml/Post2.0/sstc-saml-tech-overview-2.0.html; Wikipedia SAML 2.0 summary
- **WA**: W3C WebAuthn Level 2 https://www.w3.org/TR/webauthn-2/
- **MSH**: Microsoft Learn, Enforce password history https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/security-policy-settings/enforce-password-history
- **MSMIN**: Microsoft Learn, Minimum password age https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/security-policy-settings/minimum-password-age
- **MSMAX**: Microsoft Learn, Maximum password age https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/security-policy-settings/maximum-password-age
- **PIM**: Microsoft Entra PIM https://learn.microsoft.com/en-us/entra/id-governance/privileged-identity-management/pim-configure
- **STS**: AWS STS AssumeRole https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html
- **CT**: AWS Control Tower controls https://docs.aws.amazon.com/controltower/latest/userguide/controls.html
- **SG**: AWS VPC security groups https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html
- **SOAR**: Microsoft Sentinel automation https://learn.microsoft.com/en-us/azure/sentinel/automation/automation
- **IAC**: Wikipedia, Infrastructure as code (summary)
- **R2**: NIST SP 800-61 Rev. 2 (withdrawn) https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-61r2.pdf
- **R3**: NIST SP 800-61 Rev. 3 https://csrc.nist.gov/pubs/sp/800/61/r3/final
- **N84**: NIST SP 800-84 https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-84.pdf
- **N86**: NIST SP 800-86 https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-86.pdf
- **N92**: NIST SP 800-92 https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-92.pdf
- **LH**: Wikipedia, Legal hold (summary)
- **ED**: Wikipedia, Electronic discovery (summary)
- **TH**: Wikipedia, Cyber threat hunting (summary)
- **W5**: Wikipedia, Five whys (summary)
- **WB**: Wikipedia, Forensic disk controller (write blocker) (summary)
- **NF**: Wikipedia, NetFlow (summary)
- **BIO**: Wikipedia, Biometrics (summary)
- **PK**: Wikipedia, Passkey (summary)
- **OUT**: the objective list in outline.md (coverage only)

| # | Card | Sources |
|---|---|---|
| 0 | SY0-701 4.6: Given a scenario, implement and maintain identity and access management | OUT, GL |
| 1 | Provisioning and de-provisioning user accounts | GL, A4 |
| 2 | Permission assignments and implications (IAM) | GL |
| 3 | Identity proofing | A4 |
| 4 | Federation (identity) | GL, SAML, OIDC |
| 5 | Single sign-on (SSO) | GL, SAML, R6749 |
| 6 | Lightweight Directory Access Protocol (LDAP) | R4511, R4513, IANA |
| 7 | Open Authorization (OAuth) | R6749, OIDC |
| 8 | Security Assertions Markup Language (SAML) | SAML, OIDC |
| 9 | Interoperability (identity and access management) | SAML, OIDC, R4511 |
| 10 | Attestation (identity and access management) | GL, A4 |
| 11 | Access controls (access control models) | GL |
| 12 | Mandatory access control (MAC) | GL |
| 13 | Discretionary access control (DAC) | GL |
| 14 | Role-based access control (RBAC) | GL |
| 15 | Rule-based access control | GL |
| 16 | Attribute-based access control (ABAC) | GL |
| 17 | Time-of-day restrictions (access control) | GL |
| 18 | Least privilege (access control) | GL |
| 19 | Multifactor authentication (MFA) | B4 |
| 20 | Implementations (multifactor authentication) | B4, WA |
| 21 | Biometrics (MFA implementation) | GL, BIO |
| 22 | Hard and soft authentication tokens | R6238, R4226, B4 |
| 23 | Security keys (MFA implementation) | WA, B4, PK |
| 24 | Factors (multifactor authentication) | B4, OUT |
| 25 | Something you know (authentication factor) | B4 |
| 26 | Something you have (authentication factor) | B4 |
| 27 | Something you are (authentication factor) | BIO, GL |
| 28 | Somewhere you are (authentication factor) | OUT, B4 |
| 29 | Password concepts (SY0-701) | B4, MSH |
| 30 | Password best practices (policy settings) | B4, MSH, MSMIN, MSMAX |
| 31 | Length (password best practice) | B4 |
| 32 | Complexity (password best practice) | B4 |
| 33 | Reuse (password best practice) | MSH, MSMIN, B4 |
| 34 | Expiration (password best practice) | MSMAX, B4 |
| 35 | Age (password best practice) | MSMIN, MSH |
| 36 | Password managers | B4 |
| 37 | Passwordless authentication | B4, PK, WA |
| 38 | Privileged access management (PAM) tools | PIM, GL |
| 39 | Just-in-time (JIT) permissions | PIM |
| 40 | Password vaulting (privileged access management) | PIM, GL |
| 41 | Ephemeral credentials | STS |
| 42 | SY0-701 4.7: Explain the importance of automation and orchestration related to secure operations | SOAR, OUT |
| 43 | Use cases of automation and scripting (security operations) | SOAR, OUT |
| 44 | User provisioning (automation use case) | SOAR |
| 45 | Resource provisioning (automation use case) | IAC |
| 46 | Guard rails (automation use case) | CT |
| 47 | Security groups (automation use case) | SG |
| 48 | Ticket creation (automation use case) | SOAR |
| 49 | Escalation (automation use case) | SOAR |
| 50 | Enabling and disabling services and access (automation use case) | SOAR |
| 51 | Continuous integration and testing (automation use case) | IAC, OUT |
| 52 | Integrations and application programming interfaces (APIs) (automation use case) | SOAR |
| 53 | Benefits of security automation and orchestration | SOAR, OUT |
| 54 | Efficiency and time saving (automation benefit) | SOAR |
| 55 | Enforcing baselines (automation benefit) | IAC |
| 56 | Standard infrastructure configurations (automation benefit) | IAC |
| 57 | Scaling in a secure manner (automation benefit) | IAC |
| 58 | Employee retention (automation benefit) | OUT |
| 59 | Reaction time (automation benefit) | SOAR |
| 60 | Workforce multiplier (automation benefit) | SOAR |
| 61 | Other considerations (automation and orchestration) | OUT |
| 62 | Complexity (automation consideration) | OUT |
| 63 | Cost (automation consideration) | OUT |
| 64 | Single point of failure (automation consideration) | OUT |
| 65 | Technical debt (automation consideration) | OUT |
| 66 | Ongoing supportability (automation consideration) | OUT |
| 67 | SY0-701 4.8: Explain appropriate incident response activities | R2, R3, OUT |
| 68 | Incident response process (SY0-701) | R2, R3 |
| 69 | Preparation (incident response process) | R2 |
| 70 | Detection (incident response process) | R2 |
| 71 | Analysis (incident response process) | R2 |
| 72 | Containment (incident response process) | R2 |
| 73 | Eradication (incident response process) | R2 |
| 74 | Recovery (incident response process) | R2 |
| 75 | Lessons learned (incident response process) | R2 |
| 76 | Training (incident response) | R2, N84 |
| 77 | Testing (incident response plan) | N84 |
| 78 | Tabletop exercise (incident response testing) | N84 |
| 79 | Simulation (incident response testing) | N84 |
| 80 | Root cause analysis (incident response) | GL, W5 |
| 81 | Threat hunting | TH |
| 82 | Digital forensics | N86, GL, R3227 |
| 83 | Legal hold (digital forensics) | LH |
| 84 | Chain of custody (digital forensics) | GL |
| 85 | Acquisition (digital forensics) | R3227, N86, WB |
| 86 | Reporting (digital forensics) | N86 |
| 87 | Preservation (digital forensics) | N86, WB |
| 88 | E-discovery (electronic discovery) | ED, LH |
| 89 | SY0-701 4.9: Given a scenario, use data sources to support an investigation | N92, N86 |
| 90 | Log data (investigation source) | N92 |
| 91 | Firewall logs | N92 |
| 92 | Application logs | N92 |
| 93 | Endpoint logs | N92 |
| 94 | OS-specific security logs | N92 |
| 95 | Intrusion prevention system / intrusion detection system (IPS/IDS) logs | N92 |
| 96 | Network logs | N92, NF |
| 97 | Metadata (log data) | GL, N86 |
| 98 | Data sources (investigation, other than logs) | N92, N86 |
| 99 | Vulnerability scans (investigation data source) | N92 |
| 100 | Automated reports (investigation data source) | N92 |
| 101 | Dashboards (investigation data source) | N92 |
| 102 | Packet captures (investigation data source) | N86 |
