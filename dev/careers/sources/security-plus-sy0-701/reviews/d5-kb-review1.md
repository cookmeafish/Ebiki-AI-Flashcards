# d5 knowledge chapter: accuracy review 1 (r7 -> r8)

Reviewed: `knowledge/d5-knowledge.r7.md`. Corrected pass: `knowledge/d5-knowledge.r8.md`. Reviewer did not write the chapter.
Date: 2026-11-16. Related: [[d5-kb-r7-sources]], [[d0-kb-review1]], `docs/plans/2026-11-15-security-plus-knowledge.md`.

Sections checked: 99 (all read in full). FIXED: 28. PASS: 71.
Format checks on r8: 99 sections, largest 3,852 characters, smallest 1,558, no duplicate titles (also none shared with the
other chapters' newest passes), every heading 110 characters or less, no em or en dashes, no links or URL text, no HTML, no
question-and-answer blocks, no "exam" wording left, no 8-word run shared with outline.md.

How sources were read: every URL below was fetched by the reviewer in this review (SP 800-115 as the PDF converted to
text). Sections marked PASS without a URL were compared with the cards and with the writer's source notes only; their
primary sources (NISTIR 8286, SP 800-12, SP 800-47, SP 800-50, SP 800-128, CSF 2.0) were not downloaded a second time.

## Fixes by kind
- Facts corrected or made exact: 9 (CCPA amendment date, HIPAA provider condition, GDPR response extension, SOC Type II
  period, inherent availability, SolarWinds delivery wording, risk tolerance "wider band" claim, probability vs
  likelihood claim, exemption vs exception stated as settled).
- Copied runs of 8 or more words from a source page reworded: 3 (GDPR Article 37(5), SP 800-115, CISA insider definition).
- Wording that implied knowledge of the real exam or named "study sources": 22 places in 18 sections.

## Result per section

### 5.1 Summarize the parts of effective security governance

| Section | Result | What changed (before -> after) and source |
|---|---|---|
| Policy vs standard vs procedure vs guideline (governance document hierarchy) | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Guidelines (security governance) | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Policies (security governance) | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Acceptable use policy (AUP) | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Information security policy (program policy) | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Business continuity policy vs disaster recovery policy (BCP vs DRP) | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Incident response policy | FIXED | Rule wording: "exam questions still use the seven-step list above" -> "the seven steps above remain the common way to name the stages". SP 800-61r3 date (April 2025, supersedes Rev. 2) verified (https://csrc.nist.gov/pubs/sp/800/61/r3/final). |
| Software development lifecycle (SDLC) policy | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Change management: policy vs procedure (change advisory board, backout plan) | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Standards (security governance) | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Password standard and access control standard | PASS | 15 characters single factor, 8 as part of MFA, no composition rules, no periodic change, forced change on evidence of compromise, blocklist: all verified in SP 800-63B-4 sec. 3.1.1.2 (https://pages.nist.gov/800-63-4/sp800-63b.html). |
| Physical security standard and encryption standard | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Procedures (security governance) | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Onboarding and offboarding procedures | FIXED | Rule wording: "offboarding is one of the most tested governance procedures" -> "deserves the most study time, because one missed step leaves working access behind". |
| Playbooks (security procedure) | FIXED | Rule wording: "exam answers treat a playbook as ..." -> "in this objective a playbook is ...". |
| External considerations: regulatory vs legal vs industry | PASS | Legal hold (preserve when litigation is pending or reasonably anticipated; routine destruction suspended) now read on one page (https://definitions.uslegal.com/l/litigation-hold/, a legal dictionary, secondary). HIPAA covered entities per https://www.cdc.gov/phlp/php/resources/health-insurance-portability-and-accountability-act-of-1996-hipaa.html. |
| External considerations by scope: local/regional vs national vs global | FIXED | "The CCPA, as amended in 2020 by the CPRA" -> "as amended by the CPRA (approved by voters in 2020 and in effect since 2023)": the amendments took effect 1 January 2023 (https://oag.ca.gov/privacy/ccpa). Thresholds and rights verified on the same page. PIPEDA per https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/pipeda_brief/. |
| Monitoring and revision (governance documents) | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Governance structures: boards and committees | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Government entities (governance structure) | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Centralized vs decentralized governance | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Data roles: owner vs controller vs processor vs custodian vs steward | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Data owner (system and data owner) | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Data custodian and data steward | FIXED | Rule wording: "Some study sources" -> "Some sources". |

### 5.2 Explain the risk management process

| Section | Result | What changed (before -> after) and source |
|---|---|---|
| Risk management process (identify, assess, analyze, respond, monitor) | FIXED | Rule wording: "on this exam, assessment is described by ..." -> "the SY0-701 objectives list assessment by ...". |
| Risk identification | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Risk assessment frequency: ad hoc vs recurring vs one-time vs continuous | FIXED | Rule wording: "The exam describes assessments by WHEN" -> "The objective groups assessments by WHEN". |
| Qualitative vs quantitative risk analysis | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Probability vs likelihood | FIXED | Rule wording and accuracy: "on this exam, probability points to numbers and likelihood to ratings" -> "some frameworks use likelihood for both; in this objective, probability points to numbers and likelihood to ratings" (NIST uses "likelihood" for numeric and rated values alike). |
| Impact (risk analysis) | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Single loss expectancy (SLE) and exposure factor (EF) | FIXED | Scenario was framed as an exam question ("A question gives ... and asks") -> an analyst who must report the loss from one event. Formula SLE = AV x EF matches d0. |
| Annualized loss expectancy (ALE) and annualized rate of occurrence (ARO) | PASS | ALE = SLE x ARO and the ARO rule match d0; worked arithmetic rechecked (300,000 x 0.04 = 12,000; 100,000 x 0.04 = 4,000). |
| Risk register | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Key risk indicators (KRIs) vs key performance indicators (KPIs) | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Risk owner | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Risk appetite vs risk tolerance vs risk threshold | FIXED | "Because tolerance marks the outer edge, it is often a wider band than the appetite target itself" (no source) -> "Frameworks word tolerance in different ways (acceptable variation around an objective, or readiness to bear the risk left after a response), but all make it more specific than appetite" (https://csrc.nist.gov/glossary/term/risk_tolerance; appetite per https://csrc.nist.gov/glossary/term/risk_appetite). Risk threshold stays as the cards define it (no primary definition found). |
| Risk appetite postures: expansionary vs conservative vs neutral | FIXED | Rule wording: "The exam names three postures" -> "The objective names three postures", plus one sentence saying the three labels come from the objective and are not defined in NIST risk publications (none found in the NIST glossary pages read). |
| Risk management strategies: transfer vs accept vs avoid vs mitigate | FIXED | Rule wording: "on this exam" -> "in this objective". |
| Risk transfer (cyber insurance) | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Risk acceptance: exemption vs exception | FIXED | Rule wording: "The exam lists" -> "The objective lists". Added to Common confusions: no public standard defines the pair and many organizations call every approved deviation an exception; the split taught is the common reading. A web search this session found no authoritative definition and one practitioner source that uses the words the other way round, so the absolute tone was softened. Definitions still match the cards. |
| Inherent risk vs residual risk | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Risk reporting | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Business impact analysis (BIA) | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Recovery time objective (RTO) vs recovery point objective (RPO) | PASS | Matches d0 and the NIST definitions (https://csrc.nist.gov/glossary/term/recovery_time_objective; MTD https://csrc.nist.gov/glossary/term/maximum_tolerable_downtime). |
| Mean time to repair (MTTR) vs mean time between failures (MTBF) vs mean time to failure (MTTF) | FIXED | "Availability, estimated as MTBF / (MTBF + MTTR)" -> "Inherent availability (the equipment itself, ignoring delays such as waiting for parts) is MTBF / (MTBF + MTTR)", to match the reviewed reference chapter d0. Arithmetic rechecked (500 / 502 = 99.6%). |

### 5.3 Explain third-party risk assessment and management

| Section | Result | What changed (before -> after) and source |
|---|---|---|
| Third-party (vendor) risk management lifecycle | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Vendor assessment methods compared | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Right-to-audit clause | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Evidence of internal audits vs independent assessments | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Penetration testing of a vendor (vendor assessment) | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Supply chain analysis (software bill of materials, SBOM) | FIXED | "reached customers as a normal update" -> "shipped in official versions of the product, so it reached customers ... through the vendor's own trusted channel": the CISA advisory and directive read (https://www.cisa.gov/news-events/cybersecurity-advisories/aa20-352a, https://www.cisa.gov/news-events/directives/ed-21-01-mitigate-solarwinds-orion-code-compromise) confirm the build-process insertion, the legitimate signing certificate, December 2020 and March 2020, but do not use the word update. |
| Vendor due diligence (vendor selection) | FIXED | Rule wording: "Some study sources" -> "Some sources". |
| Conflict of interest (vendor selection) | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Agreement types compared: SLA vs MOU vs MOA vs MSA vs SOW vs NDA vs BPA | FIXED | Rule wording: "the exam often asks which one fits a situation" -> "each type fits a different situation". |
| Service-level agreement (SLA) | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Memorandum of understanding (MOU) vs memorandum of agreement (MOA) | PASS | MOU has no expectation of payment; MOA covers support with or without reimbursement; SP 800-47r1 statement of intent (https://csrc.nist.gov/glossary/term/memorandum_of_understanding_or_agreement). |
| Master service agreement (MSA) vs work order / statement of work (WO/SOW) | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Non-disclosure agreement (NDA) | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Business partners agreement (BPA) | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Vendor monitoring | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Vendor security questionnaires | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Rules of engagement (RoE) | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |

### 5.4 Summarize the parts of effective security compliance

| Section | Result | What changed (before -> after) and source |
|---|---|---|
| Compliance reporting: internal vs external | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Non-compliance consequences: fines, sanctions, loss of license, contractual impacts, reputational damage | PASS | Fine tiers (20 million euros or 4%, 10 million or 2%, whichever is higher) verified (https://gdpr-info.eu/art-83-gdpr/). Fine kept separate from sanction as the cards do; the section already says some sources use "sanctions" broadly. |
| Due diligence vs due care (compliance monitoring) | FIXED | Rule wording: "Some study sources ... a scenario's wording decides" -> "Some sources ... the situation described shows which one applies". |
| Attestation vs acknowledgement (compliance monitoring) | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Internal vs external compliance monitoring, and automation | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Privacy in security compliance (overview) | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Privacy legal implications: local/regional vs national vs global privacy law | FIXED | HIPAA providers: "that transmit health information electronically" -> "that send health information electronically for standard transactions such as claims" (https://www.cdc.gov/phlp/php/resources/health-insurance-portability-and-accountability-act-of-1996-hipaa.html; hhs.gov returned 403 again). PIPEDA facts and the Ontario scenario verified (https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/pipeda_brief/). |
| Data subject | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Controller vs processor (privacy) | PASS | 72 hours where feasible, the low-risk exception, reasons for delay, processor notifies the controller without undue delay: verified (https://gdpr-info.eu/art-33-gdpr/). |
| Data protection officer (DPO) | FIXED | Copied run of 8 words from Article 37(5) ("expert knowledge of data protection law and practice") reworded. Triggers, staff or contractor, reporting line and protection verified (https://gdpr-info.eu/art-37-gdpr/, https://gdpr-info.eu/art-38-gdpr/). |
| Data ownership (privacy) | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Data inventory and retention | PASS | Legal hold wording agrees with https://definitions.uslegal.com/l/litigation-hold/. |
| Right to be forgotten (right to erasure) | FIXED | "extendable for complex requests" -> "one month from receipt, extendable by two more months for complex or numerous requests" (https://gdpr-info.eu/art-12-gdpr/). Six grounds and five exceptions verified (https://gdpr-info.eu/art-17-gdpr/); highest fine tier for data subject rights verified (https://gdpr-info.eu/art-83-gdpr/). |

### 5.5 Explain the types and purposes of audits and assessments

| Section | Result | What changed (before -> after) and source |
|---|---|---|
| Audit vs assessment vs attestation | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Attestation (audits and assessments) | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Internal audits: compliance, audit committee and self-assessments | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| External audits: regulatory, examinations, assessment and independent third-party audit | PASS | ISO does not certify; three-year cycle with surveillance audits (https://en.wikipedia.org/wiki/ISO/IEC_27001, secondary; iso.org returned 403). |
| SOC reports: SOC 1 vs SOC 2 vs SOC 3, Type I vs Type II | FIXED | Type II time: "A period, commonly several months to a year" -> "A review period (a span of months, not a single date)" to match d0 (no AICPA text read states a length). "many contracts require one each year" -> "customers commonly ask for a current one". SOC 1 purpose and readers verified (https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc-1); SOC 2 and SOC 3 readers only from secondary summaries. |
| Penetration testing (audits and assessments) | FIXED | Copied run of 8 words from SP 800-115 ("check only for the possible existence of a") reworded. Four phases, no testing in planning, reporting alongside: verified in SP 800-115 sec. 5.2.1 (https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-115.pdf). |
| Pen test types: physical vs offensive (red) vs defensive (blue) vs integrated (purple) | PASS | Red team definition and blue team as defenders (https://csrc.nist.gov/glossary/term/red_team). Physical testing and the guards' contact point per SP 800-115 sec. 5.2. Purple team: cards only. |
| Pen test environments: known vs partially known vs unknown | FIXED | Rule wording: "Current exam wording uses" -> "The SY0-701 objectives use". Overt versus covert per SP 800-115 sec. 2.4.2; white, gray and black box appear there for application testing. |
| Reconnaissance: passive vs active | FIXED | Rule wording: "a question's wording decides" removed; now says some sources count dumpster diving and social engineering as passive while others treat contact with staff as active, and gives the traffic test. SP 800-115 lists dumpster diving among discovery techniques. Does not contradict the card. |

### 5.6 Apply security awareness practices in a scenario

| Section | Result | What changed (before -> after) and source |
|---|---|---|
| Security awareness program (overview) | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Phishing campaigns (simulated phishing) | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Recognizing a phishing attempt | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Responding to reported suspicious messages | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Anomalous behavior recognition: risky vs unexpected vs unintentional | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Policy and handbook training, and situational awareness training | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Insider threat awareness training | FIXED | Copied run of 9 words from the CISA definition of an insider reworded. Types (negligent, accidental, intentional, collusive, third party) verified (https://www.cisa.gov/topics/physical-security/insider-threat-mitigation/defining-insider-threats). |
| Password management training | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Removable media and cables training | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Social engineering awareness training | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Operational security (OPSEC) training | PASS | Five steps verified (https://csrc.nist.gov/glossary/term/operations_security). |
| Hybrid and remote work security training | PASS | Now read on the pages themselves, not search summaries: change router login, keep firmware updated, WPA3 Personal or WPA2 AES, avoid WEP, WPA and TKIP (https://www.cisa.gov/audiences/high-risk-communities/projectupskill/module5; https://www.cisa.gov/tips/st15-002). |
| Awareness reporting and monitoring: initial vs recurring | FIXED | Rule wording: "Some study sources ... A scenario's wording shows which reading is meant" -> "Some sources ... The situation described shows which reading applies". |
| Awareness program development vs execution | PASS | Read in full; facts agree with the cards and the writer's cited sources; teaching and rules checks passed. |
| Choosing the security awareness practice (decision path) | FIXED | Rule wording: "Scenario questions in this objective describe a situation and ask ..." and "answer / answers" reworded so the section describes situations, not exam questions. |

## Numbers compared with the reference chapter (d0-knowledge.r8.md)
SLE = AV x EF, ALE = SLE x ARO, ARO as events per year: same. RTO forward, RPO backward, RTO below MTD: same. MTBF = running
time / failures, MTTR average repair time, MTTF for replaced parts: same. Availability formula: d5 now names it inherent
availability as d0 does. GDPR 72 hours and 20 million euros or 4%: same. SOC 2 Type I and II and the five categories: same
after the period fix. ISO/IEC 27001 certification by outside bodies: same. No d0 error found.

## Cards believed wrong
None. Notes only:
- `Exemption (risk acceptance)` and `Exception (risk acceptance)`: not wrong, but no public standard backs the split; the
  chapter now says so.
- `Passive reconnaissance` key point ("Some study sources also list dumpster diving and social engineering as passive"):
  kept consistent; SP 800-115 places dumpster diving in discovery without calling it passive or active.
- `Supply chain analysis` ("thousands of customers"): the CISA pages read give no count; the chapter gives none.

## Sources read in this review
- https://pages.nist.gov/800-63-4/sp800-63b.html
- https://gdpr-info.eu/art-83-gdpr/
- https://gdpr-info.eu/art-33-gdpr/
- https://gdpr-info.eu/art-12-gdpr/
- https://gdpr-info.eu/art-17-gdpr/
- https://gdpr-info.eu/art-37-gdpr/
- https://gdpr-info.eu/art-38-gdpr/
- https://csrc.nist.gov/glossary/term/risk_tolerance
- https://csrc.nist.gov/glossary/term/risk_appetite
- https://www.cisa.gov/topics/physical-security/insider-threat-mitigation/defining-insider-threats
- https://www.cdc.gov/phlp/php/resources/health-insurance-portability-and-accountability-act-of-1996-hipaa.html
- https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/pipeda_brief/
- https://csrc.nist.gov/pubs/sp/800/61/r3/final
- https://oag.ca.gov/privacy/ccpa
- https://www.cisa.gov/audiences/high-risk-communities/projectupskill/module5
- https://www.cisa.gov/tips/st15-002
- https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-115.pdf
- https://www.cisa.gov/news-events/cybersecurity-advisories/aa20-352a
- https://www.cisa.gov/news-events/directives/ed-21-01-mitigate-solarwinds-orion-code-compromise
- https://csrc.nist.gov/glossary/term/memorandum_of_understanding_or_agreement
- https://csrc.nist.gov/glossary/term/recovery_time_objective
- https://csrc.nist.gov/glossary/term/maximum_tolerable_downtime
- https://csrc.nist.gov/glossary/term/operations_security
- https://csrc.nist.gov/glossary/term/red_team
- https://en.wikipedia.org/wiki/ISO/IEC_27001
- https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc-1
- https://definitions.uslegal.com/l/litigation-hold/
- Failed: hhs.gov HIPAA covered entities page (403), iso.org certification page (403), Cornell LII litigation hold pages (404),
  NIST glossary purple_team (404), NOAA litigation hold paper (moved), two AICPA SOC pages (no detail on types or readers).

## Could not verify (kept, worded cautiously)
- Exemption vs exception; risk threshold; the expansionary, conservative and neutral labels: cards only.
- Purple team; known, partially known and unknown as names: cards only (SP 800-115 gives overt and covert, and white, gray
  and black box for application testing).
- SOC 2 and SOC 3 intended readers and the Type I and II definitions: secondary summaries only; AICPA pages confirm SOC 1
  and the five categories.
- ISO/IEC 27001 three-year cycle: Wikipedia only.
- Legal hold: one legal dictionary page, not a court rule or statute.
- That the SY0-701 acronym list expands DPO as data privacy officer and MTTR as mean time to recover: the local outline.md
  has no acronym list; d0 states the MTTR expansion too.
- SolarWinds delivery by software update: widely reported, but not stated in the two CISA pages read; reworded.
- Everyday practice lists with no single source (AUP contents, onboarding order, questionnaire topics, phishing warning
  signs beyond the CISA pages the writer cited): plain practice, left as written.
