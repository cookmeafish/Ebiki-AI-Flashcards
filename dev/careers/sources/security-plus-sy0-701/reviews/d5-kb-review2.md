# d5 knowledge chapter: accuracy review 2 (r8 -> r9)

Reviewed: `knowledge/d5-knowledge.r8.md`. Corrected pass: `knowledge/d5-knowledge.r9.md`. Second, independent reviewer
(did not write the chapter or review 1). Date: 2026-11-16. Related: [[d5-kb-review1]], [[d5-kb-r7-sources]],
`docs/plans/2026-11-15-security-plus-knowledge.md`.

Sections read in full: 99 of 99, as a learner would. Changed: 8 sections. Every other section PASS (facts unchanged).
Format checks on r9: first two lines correct, 99 sections, largest 3,851 characters, no duplicate titles, no heading over
110 characters, no em or en dashes, no "http://" or "https://" text, no HTML, no question-and-answer blocks, no exam
wording.

## 1. Review 1's fixes, re-checked against sources read in this review

| Review 1 fix | Verdict | Source read this review |
|---|---|---|
| GDPR response: one month, extendable by two more months for complex or numerous requests | CONFIRMED | GDPR Art. 12(3) (gdpr-info.eu art-12) |
| CCPA as amended by CPRA, approved by voters 2020, in effect 2023; thresholds and rights | CONFIRMED (Proposition 24, November 2020; in effect 1 January 2023; $25 million, 100,000 residents or households, 50% of revenue) | oag.ca.gov/privacy/ccpa |
| HIPAA providers: those that send health information electronically for standard transactions | CONFIRMED (45 CFR 160.103: a provider "who transmits any health information in electronic form in connection with a transaction covered by this subchapter"; hhs.gov still 403) | law.cornell.edu/cfr/text/45/160.103 |
| SolarWinds: build-process insertion, legitimate signing certificate, shipped in official versions, March 2020, advisory December 2020 | CONFIRMED. CISA AA20-352A says activity began at least as early as March 2020 and the malicious DLL was signed with the legitimate certificate; it says the code entered the "software lifecycle". The build-server mechanism is from the vendor-side forensic analysis (SUNSPOT, CrowdStrike), secondary but consistent. Wording kept. | cisa.gov aa20-352a; CrowdStrike SUNSPOT analysis via search |
| Risk tolerance: "frameworks word it differently, but all make it more specific than appetite" | CORRECTED. The NIST glossary lists ten definitions; several (SP 800-137, SP 800-53 from SP 800-39, NISTIR 8183) define tolerance almost as appetite ("the level of risk an entity is willing to assume"). "All make it more specific" was not true. Now: some older definitions use it almost as a synonym; frameworks that separate the two (NIST's enterprise risk guidance, NISTIR 8286) make tolerance the more specific one. | csrc.nist.gov glossary risk_tolerance and risk_appetite |
| SOC 2 Type II period "a span of months", not a fixed length | CONFIRMED. The AICPA comparison table (reproduced as Appendix A of a US Department of Labor statement) describes type 1 "as of a specified date" and type 2 as an opinion on design and operating effectiveness "throughout the specified period"; no length is set. | dol.gov EBSA 2022 cybersecurity statement, Appendix A (PDF read as text) |
| Inherent availability = MTBF / (MTBF + MTTR) | CONFIRMED against the reference chapter d0-knowledge.r9.md (same name and formula). | d0 |
| Probability vs likelihood: some frameworks use likelihood for both | CONFIRMED in spirit (NISTIR 8286 and SP 800-30 use likelihood for rated and numeric values). | ir8286 PDF |
| Exemption vs exception softened | KEPT and tightened (see below). | web search, no authoritative definition |
| Copied-run rewordings (GDPR 37(5), SP 800-115, CISA insider) | CONFIRMED, no 8-word run left in those sentences. | gdpr-info art-37; CISA insider page wording per review 1 |

## 2. Review 1's "still uncertain" list, worked now

| Item | Result | Source |
|---|---|---|
| Exemption vs exception | Still no authoritative definition. One practitioner blog uses the words the other way round; vendor and university pages call any approved deviation an exception, usually time-limited. CHANGED the confusion line from "the common reading" (an unsupported claim) to "one consistent way to use the two words, and an organization's own policy definitions win". Definitions still match the cards. | web search (UCSB, vendor GRC pages, secawareblog) |
| Risk threshold | No NIST glossary entry (404). NISTIR 8286 uses thresholds for ranges of exposure and KRIs against tolerance, consistent with the chapter's plain definition. Kept. | ir8286 PDF; csrc glossary 404 |
| Expansionary, conservative, neutral | Confirmed as objective terms (outline.md lines 755 on); the chapter already says they are not NIST terms. Kept. | outline.md |
| Purple team | No NIST or CISA definition. Red team (review 1), blue team and white team now read in CNSSI 4009-2022 via the NIST glossary (blue defends against mock attackers; a neutral white team referees). Purple as red and blue working together and sharing findings in real time: consistent across several security firm glossaries (secondary). Kept, wording already says purple is a way of working. | csrc glossary blue_team; search results |
| Known, partially known, unknown environment names | Confirmed as the objective's names (outline.md lines 836 to 838). White, gray and black box as older names: SP 800-115 uses them for application testing (review 1). Kept. | outline.md |
| SOC 2 and SOC 3 readers, Type I and II | NOW PRIMARY: AICPA SOC 3 page ("do not provide the same level of detail", shared broadly); the AICPA comparison table (DOL appendix): SOC 1 restricted to service organization management, user entities and their auditors; SOC 2 restricted to parties with sufficient knowledge of the system (user entities, business partners, prospective users, regulators). CHANGED the SOC 2 readers cell to name them. | aicpa-cima.com SOC 3 page; DOL appendix A |
| SOC 2 always includes security | ADDED "always covers security and adds whichever of the other four it chooses", matching d0's "Security (always)". Consistent across CPA-firm sources; no AICPA text read states it, so this rests on d0 plus secondary sources. | search results (Linford, Keiter and others); d0 |
| ISO/IEC 27001 three-year cycle | NOW SUPPORTED by an accreditation body: European Accreditation's answer (March 2026) says the three-year certification cycle must be shown on the certificate (ISO/IEC 17021-1 clause 8.2.2 c) and refers to annual surveillance audits. CHANGED to "three-year cycle with yearly surveillance audits in between and a recertification audit before expiry". | european-accreditation.org Q&A |
| Legal hold | NOW PRIMARY: Federal Rule of Civil Procedure 37(e) ("should have been preserved in the anticipation or conduct of litigation") and its committee notes (a duty to preserve when litigation is reasonably foreseeable; the 2006 note calls intervening in routine operations a "litigation hold"). Chapter wording (pending or reasonably expected; routine destruction paused) agrees. No change. | law.cornell.edu/rules/frcp/rule_37 |
| DPO expanded as data privacy officer; MTTR as mean time to recover | CONFIRMED in the vendor's public acronym list kept in the repo (`acronyms.txt`: "DPO Data Privacy Officer", "MTTR Mean Time to Recover"); `dev/careers/acronym-fixes.json` already records that the course teaches Data Protection Officer and accepts the listed name. | acronyms.txt |

## 3. Sections review 1 passed without a primary source (NISTIR 8286, SP 800-12, 800-47, 800-50, 800-128, CSF 2.0)

All six PDFs were downloaded this review (curl, converted to text) and the chapter's claims checked against them.

| Claim in the chapter | Result | Source |
|---|---|---|
| Program, issue-specific and system-specific policies | CONFIRMED | SP 800-12r1 sec. 5.2 to 5.4 |
| Password standard: 15 characters single factor, 8 within MFA, no composition rules, no periodic change, forced change on evidence of compromise | CONFIRMED | SP 800-63B-4 sec. 3.1.1.2 items 1, 5, 6 |
| Leadership responsible and accountable for cybersecurity risk | CONFIRMED (GV.RR-01) | CSF 2.0 |
| Appetite and tolerance statements established, communicated and maintained | CONFIRMED (GV.RM-02) | CSF 2.0 |
| Planning and due diligence before supplier relationships; suppliers in incident planning; provisions after the relationship ends | CONFIRMED (GV.SC-06, -08, -10) | CSF 2.0 |
| KRIs: executives designate a subset of risk indicators; leading metrics such as rising external scanning; positive and negative KRIs (strong authentication, severe customer disruptions in 90 days); KPIs measure how well a process enables a goal | CONFIRMED, no 8-word copied run | NISTIR 8286 sec. 3.6.2 |
| "Some frameworks prefer current risk" over inherent risk | CONFIRMED | NISTIR 8286 sec. 2 (OMB A-123 discussion) |
| Risk register columns | CONFIRMED (ID, priority, description, category, likelihood, impact, exposure, response type, cost, description, owner, status); KRIs and threshold come from the objective | NISTIR 8286 Table 2 |
| MOU = statement of intent; MOA most often covers financial responsibilities; neither holds the technical details, which go in the ISA | CONFIRMED, no 8-word copied run | SP 800-47r1 sec. 3.1.5.2 |
| Awareness program cycle (plan, analyze and design, develop and deliver, assess and improve); role-based training | CONFIRMED (Plan and Strategy, Analysis and Design, Development and Implementation, Assessment and Improvement) | SP 800-50r1 sec. 1.3 |
| Change approval board | CONFIRMED; SP 800-128 calls it a configuration control board (CCB), also change control board. ADDED that name to the CAB line. | SP 800-128 |
| SP 800-61r3 April 2025, supersedes Rev. 2 | CONFIRMED. "Organizes response guidance around the functions of CSF 2.0" was stronger than the page shows; CHANGED to "written as a community profile of CSF 2.0, tying its recommendations to the framework's functions". | csrc.nist.gov sp 800-61 r3 |
| PCI DSS compliance programs run by the payment brands, not the Council or a government | CONFIRMED | PCI SSC FAQ "does the council enforce compliance" |
| GDPR reaches non-EU organizations offering goods or services (paid or free) or monitoring behavior in the EU | CONFIRMED | GDPR Art. 3(2) |
| PIPEDA: Alberta, British Columbia, Quebec substantially similar; still applies to federally regulated organizations and data crossing borders | CONFIRMED. ADDED to the Ontario scenario that Ontario's similar law covers only personal health information, so the answer cannot be misread. | priv.gc.ca PIPEDA brief |

## 4. Changes made in r9 (8)

1. Incident response policy: SP 800-61r3 described as a CSF 2.0 community profile (was "organizes ... around the functions").
2. Change management: CAB line adds "or in NIST configuration guidance a configuration control board".
3. Risk appetite vs tolerance vs threshold: "all make it more specific than appetite" -> some older definitions treat tolerance almost as appetite; frameworks that separate them make tolerance more specific. (Most serious: the old line was false against the NIST glossary.)
4. Risk acceptance: exemption vs exception: "the common reading" -> "one consistent way to use the two words; an organization's own policy definitions win".
5. SOC reports: SOC 2 readers named (customers, prospective customers, business partners, regulators; restricted).
6. SOC reports: "covers one or more of them" -> "always covers security and adds whichever of the other four the organization chooses" (matches d0).
7. Privacy legal implications: Ontario scenario notes Ontario's similar law covers only personal health information.
8. External audits: ISO/IEC 27001 cycle now "yearly surveillance audits in between and a recertification audit before expiry".

## 5. Numbers compared with the reference chapter (d0-knowledge.r9.md)
SLE = AV x EF; ALE = SLE x ARO; ARO as events per year (1/N for once in N years): same. RTO forward, RPO backward, RTO
below MTD: same. MTBF = running time / failures; MTTR average repair time (acronym list: recover); MTTF for replaced
parts; inherent availability MTBF / (MTBF + MTTR): same. GDPR 72 hours where feasible and 20 million euros or 4%: same.
SOC 2 Type 1 one date, Type 2 a review period of months; five categories with security always: same after change 6.
ISO/IEC 27001 certified by outside bodies: same. Worked arithmetic rechecked: 400,000 x 0.25 = 100,000; 300,000 x 0.04 =
12,000; 100,000 x 0.04 = 4,000; 2,000 / 4 = 500; 8 / 4 = 2; 500 / 502 = 99.6%; 0.1% of 43,200 minutes = 43.2. No error
found in d0.

## 6. Cards
No card found wrong. Notes carried from review 1 still stand (exemption/exception split has no public standard; the
`Supply chain analysis` card's "thousands of customers" is not in the CISA pages read; the chapter gives no count).

## 7. Still not verified (kept, worded cautiously)
- Exemption vs exception: no authoritative source exists; the chapter says so.
- Risk threshold: no primary definition; plain meaning, consistent with NISTIR 8286's use of thresholds.
- Purple team: security-firm glossaries only (consistent with each other); red, blue and white teams are primary.
- SOC 2 "security always included": CPA-firm sources and d0, no AICPA text read.
- That ISO itself does not certify: iso.org returned 403 again; well established and consistent with the accreditation
  body's description of certification bodies.
- SolarWinds build-server mechanism: vendor forensic analysis (secondary), CISA says "software lifecycle".
- Everyday practice lists (AUP contents, onboarding order, questionnaire topics, phishing signs): plain practice, no
  single source, left as written.

## Sources read in this review
- gdpr-info.eu: Art. 3, Art. 12
- oag.ca.gov/privacy/ccpa
- law.cornell.edu/cfr/text/45/160.103; law.cornell.edu/rules/frcp/rule_37
- cisa.gov advisory aa20-352a
- csrc.nist.gov glossary: risk_tolerance, risk_appetite, key_risk_indicator, blue_team (risk_threshold and purple_team 404)
- csrc.nist.gov pubs sp 800-61 r3 final
- NIST PDFs (nvlpubs): CSWP 29 (CSF 2.0), SP 800-12r1, SP 800-47r1, NISTIR 8286, SP 800-50r1, SP 800-128, SP 800-63B-4
- aicpa-cima.com SOC 2 and SOC 3 pages, SOC 1 page
- dol.gov EBSA 2022 statement, Appendix A (AICPA comparison of SOC 1, SOC 2 and SOC for Cybersecurity)
- european-accreditation.org Q&A on certification cycle
- pcisecuritystandards.org FAQ on enforcement
- priv.gc.ca PIPEDA brief
- Web searches (secondary, used only for consensus): exemption vs exception, purple team, SOC 2 security category,
  SUNSPOT build implant, litigation hold case law
- Failed: hhs.gov covered entities (403), ecfr.gov (redirect to a bot check), govinfo XML (not found)
