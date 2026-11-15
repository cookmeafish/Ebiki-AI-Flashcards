# Full independent check: Security+ Domain 5 cards (2026-11-15)

Part of [the card full check plan](../plans/2026-11-15-card-full-check.md). Checker: an independent agent that did not write or sweep these cards.

Input: `dev/careers/sources/security-plus-sy0-701/cards/d5-cards.r3.json` (168 cards), `cards/d5-extras.r2.json` (4 extras), `knowledge/d5-knowledge.r3.md`.
Output: `cards/d5-cards.r4.json` (same 168 cards, same order, obj and path), `knowledge/d5-knowledge.r4.md`. Extras unchanged, so no `d5-extras.r3.json`.

## Totals

| | Count |
|---|---|
| Checked | 172 (168 cards + 4 extras) |
| Correct | 167 (163 cards + 4 extras) |
| Minor | 5 |
| Wrong | 0 |
| Fixed | 5 (every minor one), plus 3 matching chapter edits |

Checks on the output: valid JSON, same length, obj and path at every index, no em or en dashes, no HTML, and `dev/careers/verbatim.mjs` finds 0 runs of 12+ words shared with the outline (cards r4 and chapter r4). `build-career.mjs` was not run (other reviewers run in parallel).

## Sources read for this check

- CompTIA SY0-701 objectives (local `outline.md`) and acronym list (local `acronyms.txt`): every 5.x item list, the 4.8 process steps, MTTR = Mean Time to Recover, BPA = Business Partners Agreement, MSA, MOA, MOU, WO, SOW, DPO = Data Privacy Officer.
- GDPR Article 3: https://gdpr-info.eu/art-3-gdpr/
- GDPR Article 17: https://gdpr-info.eu/art-17-gdpr/
- GDPR Article 28 (28(3), 28(10)): https://gdpr-info.eu/art-28-gdpr/
- GDPR Article 33: https://gdpr-info.eu/art-33-gdpr/
- GDPR Article 83 (83(4), 83(5)): https://gdpr-info.eu/art-83-gdpr/
- GDPR Recital 27: https://gdpr-info.eu/recitals/no-27/
- NIST SP 800-63B-4 (15 characters alone, 8 with MFA, no composition rules, no periodic change, blocklist): https://pages.nist.gov/800-63-4/sp800-63b/authenticators/
- NIST SP 800-61 Rev. 3 (final 2025-04-03, supersedes Rev. 2, a CSF 2.0 profile): https://csrc.nist.gov/pubs/sp/800/61/r3/final
- NIST SP 800-115 section 5.2.1 (four pen test phases, planning first, no testing in planning): https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-115.pdf
- CISA ED 21-01 (SolarWinds Orion, 2020-12-13, backdoor through the build process): https://www.cisa.gov/news-events/directives/ed-21-01-mitigate-solarwinds-orion-code-compromise
- Office of the Privacy Commissioner of Canada, provincial laws that may apply instead of PIPEDA (Alberta, BC, Quebec; cross-border exception): https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/r_o_p/prov-pipeda/ (known from search result summaries of priv.gc.ca pages; the page itself returned 404 at another path and was not fetched)

Not verified against a primary page this turn (judged CORRECT from well-established knowledge, stated honestly): the HIPAA covered entity definition (eCFR and HHS refused automated fetches), the "thousands of customers" reach of SolarWinds (CISA's page gives no count), CCPA rights wording, and the AICPA SOC definitions used in the SOC extra.

## Fixes (before, after, source)

### #41 Ad hoc risk assessment (5.2): MINOR
- Problem: a key point mixed up an ad hoc assessment with an ad hoc committee ("then the group that ran it disbands"). An ad hoc risk assessment is defined by being unscheduled and event driven, as the card's own definition says.
- Before: `Ad hoc is Latin for "for this": one purpose, then the group that ran it disbands`
- After: `Ad hoc is Latin for "for this": run for one purpose when the need comes up, not as part of a schedule`
- Source: SY0-701 objective 5.2 lists ad hoc as an assessment frequency beside recurring, one-time and continuous (local outline). The chapter was already right; no change there.

### #117 Global (privacy law) (5.4): MINOR
- Problem: the definition said a global law applies to "any organization that handles data of people in that jurisdiction". GDPR's reach outside the EU is narrower: offering goods or services to, or monitoring, people in the EU.
- Before (definition): `Privacy laws that reach beyond a country's borders, applying to any organization that handles data of people in that jurisdiction, wherever the organization is located.`
- After: `Privacy laws that reach beyond their own borders: they apply to organizations located elsewhere when those organizations offer goods or services to, or monitor the behavior of, people located in that jurisdiction.`
- Before (key point): `Applies based on the location of data subjects`
- After: `GDPR Article 3(2): a non-EU organization is covered when it offers goods or services to people in the EU (paid or free) or monitors their behavior there; merely holding some EU residents' data does not by itself trigger it`
- Source: https://gdpr-info.eu/art-3-gdpr/ . The chapter already said it correctly; no change there.

### #119 Controller vs. processor (5.4): MINOR
- Problem: the 72-hour duty was given without its exception (no notice when the breach is unlikely to put people at risk) and without the late-notice rule.
- Before: `After a breach the controller notifies the supervisory authority within 72 hours where feasible; the processor must tell the controller without undue delay (GDPR Article 33)`
- After: `After a breach the controller notifies the supervisory authority without undue delay and within 72 hours where feasible, unless the breach is unlikely to put people's rights and freedoms at risk; a late notice must explain the delay; the processor must tell the controller without undue delay (GDPR Article 33)`
- Source: https://gdpr-info.eu/art-33-gdpr/ . Chapter: same fix in the Privacy list.

### #122 Right to be forgotten (5.4): MINOR
- Problem: the list of other erasure grounds left out data collected from a child for an online service (17(1)(f)); the exceptions left out public health and archiving or research (17(3)(c), (d)).
- Before: `... an upheld objection, unlawful processing, a legal duty to erase; exceptions include free expression, public interest and legal claims`
- After: `... an upheld objection, unlawful processing, a legal duty to erase, and data collected from a child for an online service; exceptions include free expression, a legal obligation or public interest task, public health, archiving and research, and legal claims`
- Source: https://gdpr-info.eu/art-17-gdpr/ . Chapter: the Right to be forgotten line now lists the six grounds and five exceptions.

### #142 Reconnaissance (5.5): MINOR
- Problem: "First phase of a test" is imprecise. Planning (rules, approval, goals) comes first; reconnaissance is the first hands-on phase (NIST's discovery).
- Before: `First phase of a test`
- After: `First hands-on phase: it follows planning (rules, approval, goals), as in NIST SP 800-115's four phases: planning, discovery, attack, reporting`
- Source: NIST SP 800-115 section 5.2.1. Chapter: one line added under Reconnaissance.

## Checked and kept (worth noting)
- #75 MTTR: the objective says "repair", the acronym list says "Recover"; the card states both. Verified.
- #48 SLE uses AV = asset value, while the acronym list's AV is Antivirus. Asset value is the standard term in quantitative risk analysis, so the card is right.
- #12 NIST SP 800-63B-4 numbers verified (15 / 8 characters, no composition rules, change only on compromise, blocklist).
- #8 incident response: 4.8 lists seven steps; Rev. 3 is dated April 2025 and built on CSF 2.0. Verified.
- #36: Article 28(3) contract and 28(10) processor treated as controller. Verified.
- #103 GDPR fines: 20 million euros or 4%, whichever is higher, Article 83(5). Verified.
- #118 Recital 27 (deceased persons excluded). Verified.
- #116 PIPEDA and the Alberta, BC, Quebec carve-out with its cross-border exception. Verified via OPC summaries.
- #0 domain weight 20% matches the outline heading.
- Extras: inherent vs residual risk; MTTF (1,000 drives at 1.5 million hours gives about one failure per 1,500 hours; 1.5 million hours is about 171 years); DPO (Articles 37 and 38; the acronym list says Data Privacy Officer); SOC 1/2/3 and Type I/II. All CORRECT.

## Per-card verdicts

| # | Obj | Term | Verdict |
|---|---|---|---|
| 0 | 5.0 | SY0-701 Domain 5.0: Security Program Management and Oversight (20%) | CORRECT |
| 1 | 5.1 | SY0-701 5.1: Summarize elements of effective security governance | CORRECT |
| 2 | 5.1 | Guidelines (security governance) | CORRECT |
| 3 | 5.1 | Policies (security governance) | CORRECT |
| 4 | 5.1 | Acceptable use policy (AUP) | CORRECT |
| 5 | 5.1 | Information security policies | CORRECT |
| 6 | 5.1 | Business continuity (policy) | CORRECT |
| 7 | 5.1 | Disaster recovery (policy) | CORRECT |
| 8 | 5.1 | Incident response (policy) | CORRECT |
| 9 | 5.1 | Software development lifecycle (SDLC) policy | CORRECT |
| 10 | 5.1 | Change management (policy) | CORRECT |
| 11 | 5.1 | Standards (security governance) | CORRECT |
| 12 | 5.1 | Password standard | CORRECT |
| 13 | 5.1 | Access control standard | CORRECT |
| 14 | 5.1 | Physical security standard | CORRECT |
| 15 | 5.1 | Encryption standard | CORRECT |
| 16 | 5.1 | Procedures (security governance) | CORRECT |
| 17 | 5.1 | Change management (procedure) | CORRECT |
| 18 | 5.1 | Onboarding/offboarding (procedure) | CORRECT |
| 19 | 5.1 | Playbooks (security procedure) | CORRECT |
| 20 | 5.1 | External considerations (security governance) | CORRECT |
| 21 | 5.1 | Regulatory (external consideration) | CORRECT |
| 22 | 5.1 | Legal (external consideration) | CORRECT |
| 23 | 5.1 | Industry (external consideration) | CORRECT |
| 24 | 5.1 | Local/regional (external consideration) | CORRECT |
| 25 | 5.1 | National (external consideration) | CORRECT |
| 26 | 5.1 | Global (external consideration) | CORRECT |
| 27 | 5.1 | Monitoring and revision (governance documents) | CORRECT |
| 28 | 5.1 | Types of governance structures | CORRECT |
| 29 | 5.1 | Boards (governance structure) | CORRECT |
| 30 | 5.1 | Committees (governance structure) | CORRECT |
| 31 | 5.1 | Government entities (governance structure) | CORRECT |
| 32 | 5.1 | Centralized vs decentralized governance | CORRECT |
| 33 | 5.1 | Roles and responsibilities for systems and data | CORRECT |
| 34 | 5.1 | Owners (data and system roles) | CORRECT |
| 35 | 5.1 | Controllers (data and system roles) | CORRECT |
| 36 | 5.1 | Processors (data and system roles) | CORRECT |
| 37 | 5.1 | Custodians/stewards (data and system roles) | CORRECT |
| 38 | 5.2 | SY0-701 5.2: Explain elements of the risk management process | CORRECT |
| 39 | 5.2 | Risk identification | CORRECT |
| 40 | 5.2 | Risk assessment | CORRECT |
| 41 | 5.2 | Ad hoc risk assessment | MINOR |
| 42 | 5.2 | Recurring risk assessment | CORRECT |
| 43 | 5.2 | One-time risk assessment | CORRECT |
| 44 | 5.2 | Continuous risk assessment | CORRECT |
| 45 | 5.2 | Risk analysis | CORRECT |
| 46 | 5.2 | Qualitative risk analysis | CORRECT |
| 47 | 5.2 | Quantitative risk analysis | CORRECT |
| 48 | 5.2 | Single loss expectancy (SLE) | CORRECT |
| 49 | 5.2 | Annualized loss expectancy (ALE) | CORRECT |
| 50 | 5.2 | Annualized rate of occurrence (ARO) | CORRECT |
| 51 | 5.2 | Probability (risk analysis) | CORRECT |
| 52 | 5.2 | Likelihood (risk analysis) | CORRECT |
| 53 | 5.2 | Exposure factor (risk analysis) | CORRECT |
| 54 | 5.2 | Impact (risk analysis) | CORRECT |
| 55 | 5.2 | Risk register | CORRECT |
| 56 | 5.2 | Key risk indicators (KRIs) | CORRECT |
| 57 | 5.2 | Risk owners | CORRECT |
| 58 | 5.2 | Risk threshold | CORRECT |
| 59 | 5.2 | Risk tolerance | CORRECT |
| 60 | 5.2 | Risk appetite | CORRECT |
| 61 | 5.2 | Expansionary risk appetite | CORRECT |
| 62 | 5.2 | Conservative risk appetite | CORRECT |
| 63 | 5.2 | Neutral risk appetite | CORRECT |
| 64 | 5.2 | Risk management strategies | CORRECT |
| 65 | 5.2 | Transfer (risk strategy) | CORRECT |
| 66 | 5.2 | Accept (risk strategy) | CORRECT |
| 67 | 5.2 | Exemption (risk acceptance) | CORRECT |
| 68 | 5.2 | Exception (risk acceptance) | CORRECT |
| 69 | 5.2 | Avoid (risk strategy) | CORRECT |
| 70 | 5.2 | Mitigate (risk strategy) | CORRECT |
| 71 | 5.2 | Risk reporting | CORRECT |
| 72 | 5.2 | Business impact analysis (BIA) | CORRECT |
| 73 | 5.2 | Recovery time objective (RTO) | CORRECT |
| 74 | 5.2 | Recovery point objective (RPO) | CORRECT |
| 75 | 5.2 | Mean time to repair (MTTR) | CORRECT |
| 76 | 5.2 | Mean time between failures (MTBF) | CORRECT |
| 77 | 5.3 | SY0-701 5.3: Explain the processes associated with third-party risk assessment and management | CORRECT |
| 78 | 5.3 | Vendor assessment | CORRECT |
| 79 | 5.3 | Penetration testing (vendor assessment) | CORRECT |
| 80 | 5.3 | Right-to-audit clause | CORRECT |
| 81 | 5.3 | Evidence of internal audits (vendor assessment) | CORRECT |
| 82 | 5.3 | Independent assessments (vendor assessment) | CORRECT |
| 83 | 5.3 | Supply chain analysis | CORRECT |
| 84 | 5.3 | Vendor selection | CORRECT |
| 85 | 5.3 | Due diligence (vendor selection) | CORRECT |
| 86 | 5.3 | Conflict of interest (vendor selection) | CORRECT |
| 87 | 5.3 | Agreement types (third-party) | CORRECT |
| 88 | 5.3 | Service-level agreement (SLA) | CORRECT |
| 89 | 5.3 | Memorandum of agreement (MOA) | CORRECT |
| 90 | 5.3 | Memorandum of understanding (MOU) | CORRECT |
| 91 | 5.3 | Master service agreement (MSA) | CORRECT |
| 92 | 5.3 | Work order (WO)/statement of work (SOW) | CORRECT |
| 93 | 5.3 | Non-disclosure agreement (NDA) | CORRECT |
| 94 | 5.3 | Business partners agreement (BPA) | CORRECT |
| 95 | 5.3 | Vendor monitoring | CORRECT |
| 96 | 5.3 | Questionnaires (third-party risk) | CORRECT |
| 97 | 5.3 | Rules of engagement (third-party and testing) | CORRECT |
| 98 | 5.4 | SY0-701 5.4: Summarize elements of effective security compliance | CORRECT |
| 99 | 5.4 | Compliance reporting | CORRECT |
| 100 | 5.4 | Internal (compliance reporting) | CORRECT |
| 101 | 5.4 | External (compliance reporting) | CORRECT |
| 102 | 5.4 | Consequences of non-compliance | CORRECT |
| 103 | 5.4 | Fines (non-compliance) | CORRECT |
| 104 | 5.4 | Sanctions (non-compliance) | CORRECT |
| 105 | 5.4 | Reputational damage (non-compliance) | CORRECT |
| 106 | 5.4 | Loss of license (non-compliance) | CORRECT |
| 107 | 5.4 | Contractual impacts (non-compliance) | CORRECT |
| 108 | 5.4 | Compliance monitoring | CORRECT |
| 109 | 5.4 | Due diligence/due care (compliance monitoring) | CORRECT |
| 110 | 5.4 | Attestation and acknowledgement (compliance monitoring) | CORRECT |
| 111 | 5.4 | Internal and external compliance monitoring | CORRECT |
| 112 | 5.4 | Automation (compliance monitoring) | CORRECT |
| 113 | 5.4 | Privacy (security compliance) | CORRECT |
| 114 | 5.4 | Legal implications (privacy) | CORRECT |
| 115 | 5.4 | Local/regional (privacy law) | CORRECT |
| 116 | 5.4 | National (privacy law) | CORRECT |
| 117 | 5.4 | Global (privacy law) | MINOR |
| 118 | 5.4 | Data subject (privacy) | CORRECT |
| 119 | 5.4 | Controller vs. processor (privacy) | MINOR |
| 120 | 5.4 | Ownership (privacy and data) | CORRECT |
| 121 | 5.4 | Data inventory and retention | CORRECT |
| 122 | 5.4 | Right to be forgotten (privacy) | MINOR |
| 123 | 5.5 | SY0-701 5.5: Explain types and purposes of audits and assessments | CORRECT |
| 124 | 5.5 | Attestation (audits and assessments) | CORRECT |
| 125 | 5.5 | Internal audits and assessments | CORRECT |
| 126 | 5.5 | Compliance (internal audit) | CORRECT |
| 127 | 5.5 | Audit committee (internal audit) | CORRECT |
| 128 | 5.5 | Self-assessments (internal audit) | CORRECT |
| 129 | 5.5 | External audits and assessments | CORRECT |
| 130 | 5.5 | Regulatory (external audit) | CORRECT |
| 131 | 5.5 | Examinations (external audit) | CORRECT |
| 132 | 5.5 | Assessment (external) | CORRECT |
| 133 | 5.5 | Independent third-party audit | CORRECT |
| 134 | 5.5 | Penetration testing (audit and assessment) | CORRECT |
| 135 | 5.5 | Physical (penetration test) | CORRECT |
| 136 | 5.5 | Offensive (penetration testing, red team) | CORRECT |
| 137 | 5.5 | Defensive (penetration testing, blue team) | CORRECT |
| 138 | 5.5 | Integrated (penetration testing, purple team) | CORRECT |
| 139 | 5.5 | Known environment (penetration testing) | CORRECT |
| 140 | 5.5 | Partially known environment (penetration testing) | CORRECT |
| 141 | 5.5 | Unknown environment (penetration testing) | CORRECT |
| 142 | 5.5 | Reconnaissance (penetration testing) | MINOR |
| 143 | 5.5 | Passive reconnaissance | CORRECT |
| 144 | 5.5 | Active reconnaissance | CORRECT |
| 145 | 5.6 | SY0-701 5.6: Given a scenario, implement security awareness practices | CORRECT |
| 146 | 5.6 | Phishing (security awareness) | CORRECT |
| 147 | 5.6 | Phishing campaigns (security awareness) | CORRECT |
| 148 | 5.6 | Recognizing a phishing attempt | CORRECT |
| 149 | 5.6 | Responding to reported suspicious messages | CORRECT |
| 150 | 5.6 | Anomalous behavior recognition | CORRECT |
| 151 | 5.6 | Risky behavior (anomalous behavior) | CORRECT |
| 152 | 5.6 | Unexpected behavior (anomalous behavior) | CORRECT |
| 153 | 5.6 | Unintentional behavior (anomalous behavior) | CORRECT |
| 154 | 5.6 | User guidance and training | CORRECT |
| 155 | 5.6 | Policy/handbooks (user training) | CORRECT |
| 156 | 5.6 | Situational awareness (user training) | CORRECT |
| 157 | 5.6 | Insider threat (security awareness training) | CORRECT |
| 158 | 5.6 | Password management (user training) | CORRECT |
| 159 | 5.6 | Removable media and cables (user training) | CORRECT |
| 160 | 5.6 | Social engineering (user training) | CORRECT |
| 161 | 5.6 | Operational security (user training) | CORRECT |
| 162 | 5.6 | Hybrid/remote work environments (user training) | CORRECT |
| 163 | 5.6 | Reporting and monitoring (security awareness) | CORRECT |
| 164 | 5.6 | Initial (security awareness reporting) | CORRECT |
| 165 | 5.6 | Recurring (security awareness reporting) | CORRECT |
| 166 | 5.6 | Development (security awareness program) | CORRECT |
| 167 | 5.6 | Execution (security awareness program) | CORRECT |
