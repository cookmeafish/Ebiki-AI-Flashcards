# d5 knowledge chapter r7: source notes

Chapter: `knowledge/d5-knowledge.r7.md` (Domain 5, objectives 5.1 to 5.6). Written 2026-11-15/16 from `d5-knowledge.r4.md`,
`cards/d5-cards.r4.json` and `cards/d5-extras.r2.json`. Every source below was read during the writing session (WebFetch, or
the PDF fetched and read as text). Related: [[d5-sweeps]], `docs/plans/2026-11-15-security-plus-knowledge.md`.

## Sources

| Key | Title | URL |
|---|---|---|
| N12 | NIST SP 800-12 Rev. 1, An Introduction to Information Security (ch. 3 roles, 4 threats, 5 policy, 8.3 configuration management, 10.2 awareness) | https://doi.org/10.6028/NIST.SP.800-12r1 |
| N115 | NIST SP 800-115, Technical Guide to Information Security Testing and Assessment (2.4.2 overt/covert, 5.2 pen test phases, App. B RoE template) | https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-115.pdf |
| N8286 | NISTIR 8286, Integrating Cybersecurity and ERM (risk register elements, response types, residual risk, KRIs, qualitative/quantitative) | https://nvlpubs.nist.gov/nistpubs/ir/2020/NIST.IR.8286.pdf |
| N47 | NIST SP 800-47 Rev. 1, Managing the Security of Information Exchanges (3.1.5 MOU/MOA, SLA, user agreement, NDA) | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-47r1.pdf |
| N50 | NIST SP 800-50 Rev. 1, Building a Cybersecurity and Privacy Learning Program (life cycle, phishing exercises, metrics) | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-50r1.pdf |
| N128 | NIST SP 800-128, Security-Focused Configuration Management (2.3.3 CCB, 2.3.9 security impact analysis) | https://doi.org/10.6028/NIST.SP.800-128 |
| CSF | NIST CSF 2.0 (CSWP 29), Govern function GV.OC, GV.RM, GV.RR, GV.PO, GV.OV, GV.SC | https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.29.pdf |
| N30 | NIST SP 800-30 Rev. 1 landing page | https://csrc.nist.gov/pubs/sp/800/30/r1/final |
| N34 | NIST SP 800-34 Rev. 1 landing page | https://csrc.nist.gov/pubs/sp/800/34/r1/upd1/final |
| N61 | NIST SP 800-61 Rev. 3 landing page (April 2025, supersedes Rev. 2, CSF 2.0 profile) | https://csrc.nist.gov/pubs/sp/800/61/r3/final |
| N63 | NIST SP 800-63B-4, sec. 3.1.1.2 password verifiers | https://pages.nist.gov/800-63-4/sp800-63b.html |
| N161 | NIST SP 800-161r1 landing page | https://csrc.nist.gov/pubs/sp/800/161/r1/upd1/final |
| G-(term) | NIST CSRC glossary terms: risk_appetite, risk_tolerance, residual_risk, inherent_risk, risk_register, key_risk_indicator, risk_response, risk_assessment, quantitative_assessment, qualitative_assessment, likelihood, continuous_monitoring, recovery_point_objective, recovery_time_objective, business_impact_analysis, maximum_tolerable_downtime, business_continuity_plan, disaster_recovery_plan, rules_of_engagement, penetration_testing, red_team, blue_team, service_level_agreement, memorandum_of_understanding_or_agreement, attestation, software_development_life_cycle, data_steward, information_owner, supply_chain_risk_management, operations_security, compensating_security_control | https://csrc.nist.gov/glossary/term/(term) |
| GDPR | GDPR Articles 3, 4, 5, 12, 17, 28, 30, 33, 34, 37, 38, 39, 58, 83, Chapter 3 list, Recital 27 | https://gdpr-info.eu/ |
| CCPA | California Attorney General, CCPA page | https://oag.ca.gov/privacy/ccpa |
| HIPAA | CDC, HIPAA overview (covered entities, business associates) | https://www.cdc.gov/phlp/php/resources/health-insurance-portability-and-accountability-act-of-1996-hipaa.html |
| PIPEDA | Office of the Privacy Commissioner of Canada, PIPEDA in brief | https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/pipeda_brief/ |
| PCI | PCI SSC, standards overview | https://www.pcisecuritystandards.org/standards/ |
| GLBA | FTC, Gramm-Leach-Bliley Act | https://www.ftc.gov/business-guidance/privacy-security/gramm-leach-bliley-act |
| SOX | SEC, Sarbanes-Oxley spotlight (index of rules: internal control reporting, audit committees) | https://www.sec.gov/spotlight/sarbanes-oxley.htm |
| SOLAR | CISA advisory AA20-352A | https://www.cisa.gov/news-events/cybersecurity-advisories/aa20-352a |
| SBOM | CISA, SBOM | https://www.cisa.gov/sbom |
| SE | CISA, Avoiding Social Engineering and Phishing Attacks | https://www.cisa.gov/news-events/news/avoiding-social-engineering-and-phishing-attacks |
| PHISH | CISA, Recognize and Report Phishing | https://www.cisa.gov/secure-our-world/recognize-and-report-phishing |
| PW | CISA, Use Strong Passwords | https://www.cisa.gov/secure-our-world/use-strong-passwords |
| INS | CISA, Defining Insider Threats | https://www.cisa.gov/topics/physical-security/insider-threat-mitigation/defining-insider-threats |
| TELE | CISA home Wi-Fi and telework guidance, read as search summaries only | https://www.cisa.gov/audiences/high-risk-communities/projectupskill/module5 |
| ATT | MITRE ATT&CK: TA0043 Reconnaissance, T1595 Active Scanning, T1091 Removable Media, T1200 Hardware Additions | https://attack.mitre.org/tactics/TA0043/ |
| SOC3 | AICPA and CIMA, SOC 3 page; SOC 2 topic page (five categories) | https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc-3 |
| SOCW | Wikipedia, System and Organization Controls (SOC 1/2/3 audiences, Type 1/2) | https://en.wikipedia.org/wiki/System_and_Organization_Controls |
| SOCT | Compliance vendor article on SOC 2 Type 1 vs Type 2 (secondary; also listed in d5-sweeps) | https://drata.com/learn/soc-2/type-1-vs-type-2 |
| ISO | Wikipedia, ISO/IEC 27001 (ISMS requirements, certification bodies, three-year cycle); iso.org returned 403 | https://en.wikipedia.org/wiki/ISO/IEC_27001 |
| IIA | IIA, definition of internal auditing | https://www.theiia.org/en/standards/what-are-the-standards/definition-of-internal-audit/ |
| ALE | Wikipedia, Annualized loss expectancy (ALE = ARO x SLE, SLE from EF x value) | https://en.wikipedia.org/wiki/Annualized_loss_expectancy |
| MTBF | Wikipedia, Mean time between failures; Mean time to recovery | https://en.wikipedia.org/wiki/Mean_time_between_failures |
| REL | ReliaSoft reliability basics (MTBF, MTTF) | https://help.reliasoft.com/articles/content/hotwire/issue94/relbasics94.htm |
| AVAIL | Reliability guide: inherent availability = MTBF / (MTBF + MTTR) | https://reliamag.com/topics/guides/reliability-vs-availability |
| LII | Cornell LII Wex: due diligence, due care, conflict of interest, sanction | https://www.law.cornell.edu/wex/due_diligence |
| MSA | Law firm note on MSA vs SOW | https://hcrlaw.com/news-and-insights/distinguishing-between-a-master-services-agreement-and-a-statement-of-works |
| BPA | US Chamber of Commerce, how to write a partnership agreement | https://uschamber.com/co/start/strategy/how-to-write-a-partnership-agreement |
| NDA | Wikipedia, Non-disclosure agreement (unilateral, bilateral, multilateral) | https://en.wikipedia.org/wiki/Non-disclosure_agreement |
| HOLD | Web search summary on litigation holds (law firm and university policy pages; no single page fetched) | search: legal hold litigation hold definition |
| CARDS | Course cards d5-cards.r4.json, d5-extras.r2.json (reviewed earlier; used where a detail has no fetched source, see Uncertain) | local |

## Source keys per section

### 5.1
- Policy vs standard vs procedure vs guideline; Guidelines; Policies; Standards; Procedures: N12, CARDS
- Acceptable use policy (AUP): N12, N47 (user agreement), CARDS
- Information security policy (program policy): N12
- Business continuity policy vs disaster recovery policy: G-business_continuity_plan, G-disaster_recovery_plan, N34, CARDS
- Incident response policy: N61, CARDS
- Software development lifecycle (SDLC) policy: G-software_development_life_cycle, CARDS
- Change management: policy vs procedure: N128, N12 (8.3), CARDS
- Password standard and access control standard: N63, CARDS
- Physical security standard and encryption standard: CARDS, N12
- Onboarding and offboarding procedures: N12 (4.1.2, disable access at termination), CARDS
- Playbooks: CARDS, N61
- External considerations: regulatory vs legal vs industry: PCI, GLBA, SOX, HIPAA, HOLD, CARDS
- External considerations by scope: CCPA, GDPR art. 3, PIPEDA, HIPAA
- Monitoring and revision: CSF (GV.PO-02, GV.OV), CARDS
- Governance structures: boards and committees; Government entities; Centralized vs decentralized: CSF (GV.RR-01), CARDS
- Data roles; Data owner; Data custodian and data steward: N12 (3.4, 3.10), G-information_owner, G-data_steward, GDPR art. 4 and 28, CARDS

### 5.2
- Risk management process; Risk identification: N8286, G-risk_assessment, CARDS
- Risk assessment frequency: N30, G-continuous_monitoring, CARDS
- Qualitative vs quantitative; Probability vs likelihood; Impact: N8286, G-qualitative_assessment, G-quantitative_assessment, G-likelihood
- SLE and EF; ALE and ARO: ALE, CARDS (worked numbers are our own arithmetic)
- Risk register; KRIs vs KPIs; Risk owner: N8286 (Table 2, sec. 3.6.2), G-risk_register, G-key_risk_indicator
- Appetite vs tolerance vs threshold; postures: G-risk_appetite, G-risk_tolerance, N8286, CSF (GV.RM-02), CARDS (postures, threshold)
- Risk strategies; Risk transfer; Inherent vs residual: N8286 (Table 3, sec. 3.5.2), G-risk_response, G-residual_risk, G-inherent_risk
- Exemption vs exception: CARDS, G-compensating_security_control
- Risk reporting: N8286, CSF (GV.OV), CARDS
- BIA; RTO vs RPO: G-business_impact_analysis, G-recovery_time_objective, G-recovery_point_objective, G-maximum_tolerable_downtime
- MTTR vs MTBF vs MTTF: MTBF, REL, AVAIL, CARDS

### 5.3
- Vendor risk lifecycle; Vendor monitoring; Vendor due diligence: CSF (GV.SC-04 to GV.SC-10), LII, CARDS
- Vendor assessment methods; Right-to-audit clause; internal audits vs independent assessments; questionnaires: CARDS, GDPR art. 28 (audits), SOCW, SOC3, ISO
- Penetration testing of a vendor: N115, CARDS
- Supply chain analysis: SOLAR, SBOM, G-supply_chain_risk_management, N161
- Conflict of interest: LII, CARDS
- Agreement types; SLA; MOU vs MOA; NDA: N47, G-service_level_agreement, G-memorandum_of_understanding_or_agreement, NDA
- MSA vs WO/SOW: MSA, CARDS
- BPA: BPA, CARDS
- Rules of engagement: N115 (App. B), G-rules_of_engagement

### 5.4
- Compliance reporting; monitoring and automation: CARDS, GDPR art. 33
- Non-compliance consequences: GDPR art. 58 and 83, LII (sanction), CARDS
- Due diligence vs due care: LII, CARDS
- Attestation vs acknowledgement: G-attestation, N47 (acknowledgement of user agreements), CARDS
- Privacy overview: GDPR art. 5
- Privacy legal implications: CCPA, HIPAA, PIPEDA, GDPR art. 3
- Data subject: GDPR art. 4 and 12, Chapter 3 list, Recital 27
- Controller vs processor: GDPR art. 4, 28, 33, 34
- Data protection officer: GDPR art. 37, 38, 39
- Data ownership: GDPR art. 28, CARDS
- Data inventory and retention: GDPR art. 5 and 30, HOLD, CARDS
- Right to be forgotten: GDPR art. 12, 17, 83

### 5.5
- Audit vs assessment vs attestation; Attestation: G-attestation, CARDS
- Internal audits: IIA, SOX, CARDS
- External audits: ISO, SOCW, CARDS
- SOC reports: SOC3, SOCW, SOCT
- Penetration testing; Pen test types; Pen test environments: N115, G-penetration_testing, G-red_team, G-blue_team, CARDS (purple team; known, partially known, unknown naming)
- Reconnaissance: N115 (5.2.1), ATT

### 5.6
- Awareness program overview; development vs execution; reporting and monitoring; phishing campaigns: N50, N12 (10.2), CARDS
- Recognizing a phishing attempt; responding to reports: PHISH, SE, N50, CARDS
- Anomalous behavior: INS, CARDS
- Policy and handbook training, situational awareness: CARDS, N47
- Insider threat training: INS, N12 (4.1.2), CARDS
- Password management training: PW, N63, CARDS
- Removable media and cables: ATT (T1091, T1200), CARDS
- Social engineering training: SE
- OPSEC: G-operations_security, CARDS
- Hybrid and remote work: TELE, CARDS
- Decision path: built from the sections above

## Cards that look wrong or need a note
None found wrong. Notes only:
- `Memorandum of agreement (MOA)`: the card is right; NIST SP 800-47r1 adds that an MOA is most often used for financial responsibilities, and the CNSSI definition of an MOU says no payment is expected. The chapter adds both.
- `Supply chain analysis`: the card says the SolarWinds update reached "thousands of customers"; the CISA advisory read this session gives no count, so the chapter gives none.
- `Fines` vs `Sanctions`: legal dictionaries treat a fine as one kind of sanction; the chapter keeps the cards' split and says so.

## Uncertain (traced only to the reviewed cards or a secondary source)
- Exemption vs exception: cards only (no primary source defines the pair).
- Risk threshold and the three appetite postures: cards only (exam terms).
- Known / partially known / unknown environment and purple team: cards; NIST SP 800-115 only describes overt vs covert.
- Legal hold: search summaries of law firm and university pages, no single page fetched.
- Hybrid and remote Wi-Fi advice: CISA pages read only as search summaries.
- SOC Type II period ("several months to a year"): secondary sources (SOCW, SOCT); the AICPA pages fetched gave no detail on types.
- HIPAA: hhs.gov returned 403, the CDC overview was used. ISO/IEC 27001: iso.org returned 403, Wikipedia was used.
- Everyday practice details with no fetched source, kept from the cards or written as plain consequence: AUP content list, onboarding step order, clean desk items, vendor questionnaire topics, the SLA downtime arithmetic (our own).
- Section titles were checked for uniqueness only against the r7 chapters present at writing time.
