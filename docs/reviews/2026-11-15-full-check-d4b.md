# Full independent check: d4b (objectives 4.6 to 4.9), 2026-11-15

Part of [the card full check plan](../plans/2026-11-15-card-full-check.md). Checker: an independent agent that did not write or sweep these cards.

**Input:** `cards/d4b-cards.r3.json` (103 cards), `cards/d4b-extras.r2.json` (3 extras), `knowledge/d4b-knowledge.r3.md`.
**Output:** `cards/d4b-cards.r4.json`, `knowledge/d4b-knowledge.r4.md`. The extras were all correct, so no `d4b-extras.r3.json` was written.

## Totals
| Checked | Correct | Minor | Wrong | Fixed |
|---|---|---|---|---|
| 103 cards + 3 extras (106) | 104 | 2 | 0 | 2 |

Card order, `obj` and `path` are unchanged (verified by script: 103 = 103, every obj and path equal). No em or en dashes in the r4 files. Only the two fixes below differ from r3.

## Fixes
1. **Card 75, Lessons learned (4.8), keyPoints. MINOR.**
   - Before: "Hold it soon after the incident (NIST suggested within several days)"
   - After: "Hold it soon after the incident (the older NIST SP 800-61 Rev. 2 suggested within several days)"
   - Why: the "several days" advice is from SP 800-61 Rev. 2, section 3.4.1; Rev. 3 (April 2025) superseded it and is a CSF 2.0 Community Profile, so an unqualified "NIST" reads as current guidance.
   - Source: https://csrc.nist.gov/pubs/sp/800/61/r3/final ; https://csrc.nist.gov/pubs/sp/800/61/r2/final
   - Knowledge chapter, 4.8 Process step 7: same change.
2. **Card 85, Acquisition (4.8), keyPoints. MINOR.**
   - Before: "routing table, ARP cache, process table and memory"
   - After: "routing table, ARP cache, process table, kernel statistics and memory"
   - Why: the point is presented as RFC 3227's order and left out one item of its second tier.
   - Source: https://www.rfc-editor.org/rfc/rfc3227 (section 2.1)
   - Knowledge chapter, 4.8 Digital forensics, Acquisition: same change.

## Sources read for this check
- NIST SP 800-63B-4: https://pages.nist.gov/800-63-4/sp800-63b.html (password length 15/8, blocklist, no composition rules, no periodic change, password managers and autofill SHALL, paste SHOULD, PSTN restricted)
- RFC 6238 section 5.2 (30-second time step): https://www.rfc-editor.org/rfc/rfc6238
- RFC 3227 section 2.1 (order of volatility): https://www.rfc-editor.org/rfc/rfc3227
- AWS STS AssumeRole: https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html (900 s to the role maximum, 1 to 12 h)
- AWS STS GetSessionToken: https://docs.aws.amazon.com/STS/latest/APIReference/API_GetSessionToken.html (up to 129,600 s = 36 h)
- AWS Control Tower controls: https://docs.aws.amazon.com/controltower/latest/userguide/controls.html (guardrail and control synonymous)
- NIST SP 800-61 Rev. 3: https://csrc.nist.gov/pubs/sp/800/61/r3/final
- NIST SP 800-84 summary in the NIST ITL bulletin of Dec 2006 (archived): https://webarchive.library.unt.edu/eot2008/20080916003911/http:/www.itl.nist.gov/lab/bulletns/bltndec06.pdf (the PDF itself could not be rendered here)
- Extras: OpenID Connect Core 1.0 (https://openid.net/specs/openid-connect-core-1_0.html), RFC 7643 and RFC 7644 (SCIM). Claims checked from knowledge of those specs: required ID token claims iss, sub, aud, exp, iat; the `openid` scope; SCIM schema and protocol RFC numbers.

## What is still weak (honest)
- **Card 10, Attestation:** no CompTIA primary text defines it. The card gives the identity-evidence sense first and names access and device attestation; third-party study material is split between these senses. Left as is (it already covers all three).
- **SP 800-84 and SP 800-61 Rev. 2 wording** was confirmed through a NIST bulletin and secondary summaries, not by reading the PDFs page by page.
- Port numbers, access models, MFA factors, the CompTIA phase list and the 4.7 and 4.9 lists were checked against standard references and the objective structure in `path`; the vendor outline file itself was not opened.

## Per-card verdicts
| # | Obj | Term | Verdict | Note |
|---|---|---|---|---|
| 0 | 4.6 | SY0-701 4.6: Given a scenario, implement and maintain identity and access management | CORRECT |  |
| 1 | 4.6 | Provisioning and de-provisioning user accounts | CORRECT |  |
| 2 | 4.6 | Permission assignments and implications (IAM) | CORRECT |  |
| 3 | 4.6 | Identity proofing | CORRECT |  |
| 4 | 4.6 | Federation (identity) | CORRECT |  |
| 5 | 4.6 | Single sign-on (SSO) | CORRECT |  |
| 6 | 4.6 | Lightweight Directory Access Protocol (LDAP) | CORRECT |  |
| 7 | 4.6 | Open Authorization (OAuth) | CORRECT |  |
| 8 | 4.6 | Security Assertions Markup Language (SAML) | CORRECT | Outline spelling Assertions kept as term; card already names the OASIS singular form. |
| 9 | 4.6 | Interoperability (identity and access management) | CORRECT |  |
| 10 | 4.6 | Attestation (identity and access management) | CORRECT | No primary CompTIA definition exists; card gives the identity sense first and names access and device attestation (matches the guide pitfall rule). |
| 11 | 4.6 | Access controls (access control models) | CORRECT |  |
| 12 | 4.6 | Mandatory access control (MAC) | CORRECT |  |
| 13 | 4.6 | Discretionary access control (DAC) | CORRECT |  |
| 14 | 4.6 | Role-based access control (RBAC) | CORRECT |  |
| 15 | 4.6 | Rule-based access control | CORRECT |  |
| 16 | 4.6 | Attribute-based access control (ABAC) | CORRECT |  |
| 17 | 4.6 | Time-of-day restrictions (access control) | CORRECT |  |
| 18 | 4.6 | Least privilege (access control) | CORRECT |  |
| 19 | 4.6 | Multifactor authentication (MFA) | CORRECT |  |
| 20 | 4.6 | Implementations (multifactor authentication) | CORRECT |  |
| 21 | 4.6 | Biometrics (MFA implementation) | CORRECT |  |
| 22 | 4.6 | Hard and soft authentication tokens | CORRECT | RFC 6238 sec 5.2 recommends a 30-second step; NIST SP 800-63B-4 restricts PSTN out-of-band. |
| 23 | 4.6 | Security keys (MFA implementation) | CORRECT |  |
| 24 | 4.6 | Factors (multifactor authentication) | CORRECT |  |
| 25 | 4.6 | Something you know (authentication factor) | CORRECT |  |
| 26 | 4.6 | Something you have (authentication factor) | CORRECT |  |
| 27 | 4.6 | Something you are (authentication factor) | CORRECT |  |
| 28 | 4.6 | Somewhere you are (authentication factor) | CORRECT |  |
| 29 | 4.6 | Password concepts (SY0-701) | CORRECT |  |
| 30 | 4.6 | Password best practices (policy settings) | CORRECT | NIST SP 800-63B-4: 15 chars single-factor, 8 with MFA, blocklist, no composition rules, no periodic change. |
| 31 | 4.6 | Length (password best practice) | CORRECT |  |
| 32 | 4.6 | Complexity (password best practice) | CORRECT |  |
| 33 | 4.6 | Reuse (password best practice) | CORRECT |  |
| 34 | 4.6 | Expiration (password best practice) | CORRECT |  |
| 35 | 4.6 | Age (password best practice) | CORRECT |  |
| 36 | 4.6 | Password managers | CORRECT | NIST SP 800-63B-4: SHALL allow password managers and autofill, SHOULD permit paste. |
| 37 | 4.6 | Passwordless authentication | CORRECT |  |
| 38 | 4.6 | Privileged access management (PAM) tools | CORRECT |  |
| 39 | 4.6 | Just-in-time (JIT) permissions | CORRECT |  |
| 40 | 4.6 | Password vaulting (privileged access management) | CORRECT |  |
| 41 | 4.6 | Ephemeral credentials | CORRECT | AWS STS: AssumeRole 900 s to 12 h; GetSessionToken up to 36 h. |
| 42 | 4.7 | SY0-701 4.7: Explain the importance of automation and orchestration related to secure operations | CORRECT |  |
| 43 | 4.7 | Use cases of automation and scripting (security operations) | CORRECT |  |
| 44 | 4.7 | User provisioning (automation use case) | CORRECT |  |
| 45 | 4.7 | Resource provisioning (automation use case) | CORRECT |  |
| 46 | 4.7 | Guard rails (automation use case) | CORRECT | AWS Control Tower docs: guardrail and control are synonymous during the terminology change. |
| 47 | 4.7 | Security groups (automation use case) | CORRECT |  |
| 48 | 4.7 | Ticket creation (automation use case) | CORRECT |  |
| 49 | 4.7 | Escalation (automation use case) | CORRECT |  |
| 50 | 4.7 | Enabling and disabling services and access (automation use case) | CORRECT |  |
| 51 | 4.7 | Continuous integration and testing (automation use case) | CORRECT |  |
| 52 | 4.7 | Integrations and application programming interfaces (APIs) (automation use case) | CORRECT |  |
| 53 | 4.7 | Benefits of security automation and orchestration | CORRECT |  |
| 54 | 4.7 | Efficiency and time saving (automation benefit) | CORRECT |  |
| 55 | 4.7 | Enforcing baselines (automation benefit) | CORRECT |  |
| 56 | 4.7 | Standard infrastructure configurations (automation benefit) | CORRECT |  |
| 57 | 4.7 | Scaling in a secure manner (automation benefit) | CORRECT |  |
| 58 | 4.7 | Employee retention (automation benefit) | CORRECT |  |
| 59 | 4.7 | Reaction time (automation benefit) | CORRECT |  |
| 60 | 4.7 | Workforce multiplier (automation benefit) | CORRECT |  |
| 61 | 4.7 | Other considerations (automation and orchestration) | CORRECT |  |
| 62 | 4.7 | Complexity (automation consideration) | CORRECT |  |
| 63 | 4.7 | Cost (automation consideration) | CORRECT |  |
| 64 | 4.7 | Single point of failure (automation consideration) | CORRECT |  |
| 65 | 4.7 | Technical debt (automation consideration) | CORRECT |  |
| 66 | 4.7 | Ongoing supportability (automation consideration) | CORRECT |  |
| 67 | 4.8 | SY0-701 4.8: Explain appropriate incident response activities | CORRECT |  |
| 68 | 4.8 | Incident response process (SY0-701) | CORRECT | SP 800-61 Rev. 3 final 2025-04-03, a CSF 2.0 Community Profile. |
| 69 | 4.8 | Preparation (incident response process) | CORRECT |  |
| 70 | 4.8 | Detection (incident response process) | CORRECT |  |
| 71 | 4.8 | Analysis (incident response process) | CORRECT |  |
| 72 | 4.8 | Containment (incident response process) | CORRECT |  |
| 73 | 4.8 | Eradication (incident response process) | CORRECT |  |
| 74 | 4.8 | Recovery (incident response process) | CORRECT |  |
| 75 | 4.8 | Lessons learned (incident response process) | MINOR (fixed) |  |
| 76 | 4.8 | Training (incident response) | CORRECT |  |
| 77 | 4.8 | Testing (incident response plan) | CORRECT |  |
| 78 | 4.8 | Tabletop exercise (incident response testing) | CORRECT | SP 800-84 (via NIST ITL bulletin Dec 2006): tabletop discussion-based; functional exercise in a simulated operational environment. |
| 79 | 4.8 | Simulation (incident response testing) | CORRECT |  |
| 80 | 4.8 | Root cause analysis (incident response) | CORRECT |  |
| 81 | 4.8 | Threat hunting | CORRECT |  |
| 82 | 4.8 | Digital forensics | CORRECT |  |
| 83 | 4.8 | Legal hold (digital forensics) | CORRECT |  |
| 84 | 4.8 | Chain of custody (digital forensics) | CORRECT |  |
| 85 | 4.8 | Acquisition (digital forensics) | MINOR (fixed) |  |
| 86 | 4.8 | Reporting (digital forensics) | CORRECT |  |
| 87 | 4.8 | Preservation (digital forensics) | CORRECT |  |
| 88 | 4.8 | E-discovery (electronic discovery) | CORRECT |  |
| 89 | 4.9 | SY0-701 4.9: Given a scenario, use data sources to support an investigation | CORRECT |  |
| 90 | 4.9 | Log data (investigation source) | CORRECT |  |
| 91 | 4.9 | Firewall logs | CORRECT |  |
| 92 | 4.9 | Application logs | CORRECT |  |
| 93 | 4.9 | Endpoint logs | CORRECT |  |
| 94 | 4.9 | OS-specific security logs | CORRECT |  |
| 95 | 4.9 | Intrusion prevention system / intrusion detection system (IPS/IDS) logs | CORRECT |  |
| 96 | 4.9 | Network logs | CORRECT |  |
| 97 | 4.9 | Metadata (log data) | CORRECT |  |
| 98 | 4.9 | Data sources (investigation, other than logs) | CORRECT |  |
| 99 | 4.9 | Vulnerability scans (investigation data source) | CORRECT |  |
| 100 | 4.9 | Automated reports (investigation data source) | CORRECT |  |
| 101 | 4.9 | Dashboards (investigation data source) | CORRECT |  |
| 102 | 4.9 | Packet captures (investigation data source) | CORRECT |  |

| Extra | Obj | Term | Verdict |
|---|---|---|---|
| E1 | 4.6 | OpenID Connect (OIDC) | CORRECT |
| E2 | 4.6 | SCIM | CORRECT |
| E3 | 4.7 | SOAR | CORRECT |
