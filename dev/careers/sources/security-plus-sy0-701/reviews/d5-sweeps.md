# d5 sweeps (Domain 5.0, pass r3, 2026-11-15)

Files: `cards/d5-cards.r2.json` (168 cards) to `cards/d5-cards.r3.json`; `knowledge/d5-knowledge.r2.md` to `knowledge/d5-knowledge.r3.md`.
Same count, order, `obj` and `path` for every card (checked by script). 61 cards changed. Validation: JSON parses, no em or en dashes, no HTML, 0 runs of 12+ words from the outline (`dev/careers/verbatim.mjs`). Every added fact is written in my own words; nothing was removed except wording a source showed was wrong.

Owner rule applied: only fix what a source shows is wrong; add true helpful detail (including a video course's free SY0-701 notes); never delete helpful detail.

## Sources read this session
- [GDPR-M] GDPR Article 3, territorial scope: https://gdpr-info.eu/art-3-gdpr/
- [GDPR-4] GDPR Article 4 definitions: https://gdpr-info.eu/art-4-gdpr/
- [GDPR-R27] GDPR Recital 27 (deceased persons): https://gdpr-info.eu/recitals/no-27/
- [GDPR-17] GDPR Article 17: https://gdpr-info.eu/art-17-gdpr/
- [GDPR-28] GDPR Article 28: https://gdpr-info.eu/art-28-gdpr/
- [GDPR-33] GDPR Article 33: https://gdpr-info.eu/art-33-gdpr/
- [GDPR-83] GDPR Article 83: https://gdpr-info.eu/art-83-gdpr/
- [EDPB] EDPB Guidelines 3/2018 on territorial scope, the US-tourist example, via legal commentary found in search (PDF text not extractable here): https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-32018-territorial-scope-gdpr-article-3-version_en
- [HHS] HHS covered entities (45 CFR 160.103), via search results quoting the page: https://www.hhs.gov/hipaa/for-professionals/covered-entities/index.html
- [CMIA] California Civil Code section 56 (Confidentiality of Medical Information Act): https://law.justia.com/codes/california/code-civ/division-1/part-2-6/chapter-1/section-56
- [CCPA] California AG, CCPA: https://oag.ca.gov/privacy/ccpa
- [OPC] Office of the Privacy Commissioner of Canada, PIPEDA in brief: https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/pipeda_brief/
- [800-63B] NIST SP 800-63B-4, authenticators (passwords): https://pages.nist.gov/800-63-4/sp800-63b/authenticators/
- [800-61r3] NIST SP 800-61 Rev. 3 page: https://csrc.nist.gov/pubs/sp/800/61/r3/final
- [800-30] NIST SP 800-30 Rev. 1 page: https://csrc.nist.gov/pubs/sp/800/30/r1/final
- [NIST-RT] NIST glossary, risk tolerance: https://csrc.nist.gov/glossary/term/risk_tolerance
- [NIST-RA] NIST glossary, risk appetite: https://csrc.nist.gov/glossary/term/risk_appetite
- [NIST-DRP] NIST glossary, disaster recovery plan (SP 800-34): https://csrc.nist.gov/glossary/term/disaster_recovery_plan
- [NIST-BCP] NIST glossary, business continuity plan: https://csrc.nist.gov/glossary/term/business_continuity_plan
- [CISA] CISA AA20-352A, SolarWinds Orion compromise: https://www.cisa.gov/news-events/cybersecurity-advisories/aa20-352a
- [PCI] PCI SSC Quick Reference Guide scope (store, process or transmit), via search: https://listings.pcisecuritystandards.org/documents/PCIDSS_QRGv3.pdf
- [REL] MTTF vs MTBF and availability: https://help.reliasoft.com/articles/content/hotwire/issue94/relbasics94.htm and https://www.fabrico.io/blog/mtbf-vs-mttf/
- [SOC] SOC 2 Type 1 vs Type 2 periods (vendor pages, 3 to 12 months): https://drata.com/learn/soc-2/type-1-vs-type-2
- [ACR] local `acronyms.txt` (SY0-701 acronym list)
- a video course SY0-701 notes (free): [PM-POL] security-policies, [PM-STD] security-standards, [PM-PROC] security-procedures, [PM-CONS] security-considerations, [PM-ROLES] data-roles-and-responsibilities, [PM-RM] risk-management, [PM-RA] risk-analysis, [PM-RMS] risk-management-strategies, [PM-BIA] business-impact-analysis, [PM-3P] third-party-risk-assessment, [PM-AGR] agreement-types, [PM-COMP] compliance, [PM-PRIV] privacy, [PM-AUD] audits-and-assessments, [PM-PEN] penetration-tests, [PM-AW] security-awareness, [PM-UT] user-training; all at 

## Sweep 1: Facts
Checked every definition against the sources above. Checked: 168. Changed: 6.
- **External considerations (security governance)**, example. Before: "...and, for EU patients, GDPR (global)." After: names California's CMIA as the regional law, and GDPR only if the hospital offers telehealth to patients located in the EU. Why: GDPR reaches a non-EU organization only when it offers goods or services to, or monitors, people in the Union; treating an EU visitor in California does not trigger it. Sources: [GDPR-M], [EDPB], [CMIA].
- **Global (external consideration)**, keyPoint. Before: "applies to data of people in the EU". After: reaches organizations outside the EU that offer goods or services to, or monitor, people located in the EU (Article 3). Source: [GDPR-M].
- **National (external consideration)**, example. Before: "Every US healthcare provider follows HIPAA regardless of the state". After: HIPAA applies to covered providers, health plans and clearinghouses in every state. Why: only covered entities are bound. Source: [HHS].
- **National (privacy law)**, example. Before: HIPAA "across the entire United States"; PIPEDA "private sector personal data nationally". After: HIPAA covers health information held by covered entities and business associates; PIPEDA covers personal data private organizations handle in commercial activity; keyPoint added on the Alberta, BC and Quebec carve-out. Sources: [HHS], [OPC].
- **Industry (external consideration)**, example. Before: "stores or processes". After: "stores, processes or transmits". Source: [PCI].
- **Risk tolerance**, keyPoint. Before: "Tolerance is usually narrower and more concrete than appetite". After: more specific and concrete, and the outer edge of acceptable deviation, so often a wider band than the appetite target. Why: NIST defines tolerance as acceptable variance; the video course notes it is often a larger variance than appetite, so "narrower" misled. Sources: [NIST-RT], [NIST-RA], [PM-RA].
Confirmed unchanged (examples): GDPR fines 20 million euros or 4% [GDPR-83]; Article 17 right to erasure [GDPR-17]; controller and processor definitions [GDPR-4]; DR as IT recovery at an alternate facility, a subset of continuity [NIST-DRP], [NIST-BCP]; SP 800-30 is the risk assessment guide [800-30]; SLE, ARO, ALE, EF and likelihood vs probability [PM-RA]; RTO, RPO, MTTR, MTBF [PM-BIA]; agreement types [PM-AGR]; pen test teams, environments and recon [PM-PEN].

## Sweep 2: Numbers and names
Checked every port-free number, formula, standard number, acronym expansion and date. All arithmetic recomputed (SLE, ALE, ARO, MTTR, MTBF examples and the chapter's worked examples: all correct). Checked: 168. Changed: 3.
- **Software development lifecycle (SDLC) policy**, keyPoint. Before: "Software Development Life Cycle in the acronym list". After: "Software Development Lifecycle". Source: [ACR].
- **Incident response (policy)**, keyPoint added: SP 800-61 Rev. 2's four phases, and Rev. 3 (April 2025) replacing it with CSF 2.0-mapped guidance; the exam keeps the seven steps. Sources: [800-61r3], [PM-POL].
- **Password standard**, keyPoint added: SP 800-63B-4 numbers (15 characters alone, 8 with MFA, no composition rules, no forced periodic changes, blocklist), plus central directory sign-in for devices. Sources: [800-63B], [PM-STD].
Confirmed: MTTR expands as Mean Time to Recover in the acronym list while 5.2 says repair (card already says so) [ACR]; BPA, MOA, MOU, MSA, WO, SOW, RTO, RPO expansions [ACR]; 72-hour breach notice [GDPR-33]; domain weight 20%.

## Sweep 3: Examples
Checked each example is concrete and an instance of its own concept. Checked: 168. Changed: 4 (examples added as keyPoints; existing examples kept).
- **Supply chain analysis**: added SolarWinds (backdoor in the Orion build, shipped in a signed update, disclosed December 2020). Sources: [CISA], [PM-3P].
- **Conflict of interest (vendor selection)**: added vendor-side conflicts (serves your biggest competitor, employs an executive's relative, offers gifts). Source: [PM-3P].
- **Risky behavior (anomalous behavior)**: added hosts file edits, replacing system files, uploading sensitive files. Source: [PM-AW].
- **Unintentional behavior (anomalous behavior)**: added a lost USB drive, a misconfigured setting. Source: [PM-AW].
Plus the three example fixes counted in sweep 1 (External considerations, National, Industry).

## Sweep 4: Key points
Checked every keyPoint is true and useful; added true details that help understanding. Checked: 168. Changed: 35. Each line: card, what was added, source.
- Policies: writing a policy does not enforce it. [PM-POL]
- Business continuity (policy): written and tested before a disruption. [PM-POL]
- SDLC policy: waterfall vs agile. [PM-POL]
- Access control standard: conditions to get and lose access. [PM-STD]
- Physical security standard: different rules per employee, contractor, guest; lock type. [PM-STD]
- Encryption standard: password storage as salted hashes. [PM-STD]
- Change management (procedure): scope, risk level, owner sign-off. [PM-PROC]
- Onboarding/offboarding: disable rather than delete (key recovery); department transfers. [PM-PROC]
- Boards: board sets goals, committees work out how. [PM-PROC]
- Committees: subject matter experts, take direction, report back. [PM-PROC]
- Government entities: legal, administrative, political focus; public meetings. [PM-PROC]
- Centralized vs decentralized: neither right in general. [PM-PROC]
- Ad hoc risk assessment: "for this"; the group disbands after. [PM-RM]
- Recurring risk assessment: 3, 6 or 12 months; can be internal. [PM-RM]
- Continuous risk assessment: change control with a risk step. [PM-RM]
- MTBF: uptime divided by failures; availability formula. [PM-BIA], [REL]
- Penetration testing (vendor assessment): contract can require tests at intervals. [PM-3P]
- Right-to-audit clause: recurring audits, typical focus areas. [PM-3P]
- Independent assessments: outsiders spot blind spots. [PM-3P]
- Due diligence (vendor selection): verify claims, background checks, interviews. [PM-3P]
- NDA: multilateral form. [PM-AGR]
- Questionnaires: typical topics. [PM-3P]
- Rules of engagement: IP ranges, in and out of scope devices, test type, sensitive data handling. [PM-3P]
- Attestation and acknowledgement: compliance executive signs off. [PM-COMP]
- Internal and external compliance monitoring: central compliance officer. [PM-COMP]
- Data inventory and retention: owner, update frequency, format recorded. [PM-PRIV]
- Right to be forgotten: the other grounds and the exceptions. [GDPR-17]
- Phishing campaigns: in house or vendor; console tracking. [PM-AW]
- Responding to reported suspicious messages: the user-side response to clickers. [PM-AW]
- Policy/handbooks: easy to find; track completion. [PM-UT]
- Situational awareness: applies to links, attachments and texts every day. [PM-UT]
- Insider threat: multiple approvals, file monitoring. [PM-UT]
- Password management: technical enforcement (Group Policy). [PM-UT]
- Operational security: think like an attacker. [PM-UT]
- Development and Execution (security awareness program): dedicated team, tailoring, delivery, metrics. [PM-AW] (2 cards)

## Sweep 5: Confusables
Checked IDS-style look-alikes in this domain: policy/standard/procedure/guideline, BC vs DR, owner vs custodian vs steward, controller vs processor, appetite vs tolerance vs threshold, exemption vs exception, transfer vs avoid, RTO vs RPO, MTTR vs MTBF vs MTTF, MOU vs MOA, MSA vs SOW, due diligence vs due care, attestation (5.4) vs attestation (5.5), internal vs external, red/blue/purple, known/partially known/unknown, passive vs active, initial vs recurring. All told apart consistently. Checked: 168. Changed: 7.
- Exemption (risk acceptance): study shorthand, cannot be met (unpatchable device kept off the network). [PM-RMS]
- Exception (risk acceptance): study shorthand, could be met but clashes with a business need. [PM-RMS]
- Due diligence/due care: the alternative split some sources use (care inside, diligence on third parties), kept beside the standard one. [PM-COMP]
- Custodians/stewards: some sources have stewards apply labels and manage access within the owner's rules. [PM-ROLES]
- Passive reconnaissance: some sources count dumpster diving and social engineering as passive. [PM-PEN]
- Initial and Recurring (security awareness reporting): the user-level reading (first risky act vs repeat) added beside the program-baseline reading. [PM-AW] (2 cards)

## Sweep 6: Coverage
Read every 5.x line of outline.md against its card. Every line has exactly one card and each card covers everything its line names. Checked: 168. Changed: 6 (needed facts no line names).
- Regulatory (external consideration): GDPR is a regulation; GLBA for US financial institutions. [PM-COMP], [PM-CONS]
- Legal (external consideration): data sovereignty; breach notice deadlines vary. [PM-CONS]
- Industry (external consideration): utilities air-gapping, healthcare availability vs privacy. [PM-CONS]
- Controllers: the in-company department framing (payroll department vs payroll firm). [PM-ROLES], [PM-PRIV]
- Processors: written contract (Article 28) and becoming a controller (Article 28(10)). [GDPR-28]
- Data subject: deceased people excluded. [GDPR-R27]
- Controller vs. processor (privacy): 72-hour authority notice, processor tells controller. [GDPR-33]
(That is 7 lines because the Industry card is also counted in sweep 1; 6 cards newly changed here.)

## Sweep 7: Consistency
Compared every fact across cards and with the chapter. Checked: 168. Card changes: 0 new. Chapter brought in line with every card change:
- External considerations table: National row (HIPAA covered entities), Global row (GDPR Article 3 targeting or monitoring), Industry row (store, process or transmit).
- Privacy list: National and Global wording fixed the same way; "laws that follow the data subject across borders" replaced (wrong per [GDPR-M], [EDPB]).
- Risk tolerance row, exemption vs exception shorthand, MTBF math, policies, standards, procedures, boards, government, roles, assessment table, vendor sections, NDA row, rules of engagement, due care, data subject, Article 33, data inventory, passive recon, phishing, anomalous behavior, insider threat, reporting: same additions as the cards.
No contradictions remain between cards (tolerance now agrees on the appetite card, the 5.1 and 5.4 GDPR and HIPAA cards agree).

## Sweep 8: Clarity
Read every card for plain, fluff-free wording; checked no dashes, no HTML. Checked: 168. Changed: 0. New text kept to one short clause per point.

## Sweep 9: Exam fit
Checked SY0-701 wording: known/partially known/unknown environment (old box names given as "formerly"), offensive/defensive/integrated teams, the seven-step IR list from 4.8, MTTR repair vs recover, expansionary/conservative/neutral appetite, exemption/exception. Checked: 168. Changed: 0 new (the SP 800-61 Rev. 3 note in sweep 2 marks the older four-phase model as replaced). Nothing outdated left without a note.

## Sweep 10: Final adversarial pass
Tried to prove each card wrong; each claim is either confirmed by a source above or listed under Unsure. Checked: 168. Changed: 0 new.

## Totals
168 cards checked in each of 10 sweeps; 61 cards changed (6 facts fixed, 3 names/numbers, 52 additions of true helpful detail); chapter updated to match.

## Proposed new cards
1. **Inherent vs residual risk.** Several 5.2 cards use "residual risk" and no line defines it; exam questions ask what is left after controls. Source: [PM-RMS] (mitigation leaves risk), NIST glossary residual risk.
2. **SOC reports (SOC 1, SOC 2, SOC 3; Type I vs Type II).** Cards in 5.3 and 5.5 lean on "SOC 2 Type II" without explaining it; Type I is a point in time, Type II tests operation over a period (commonly 3 to 12 months). Source: [SOC] (secondary; confirm with AICPA).
3. **Data protection officer (DPO).** In the SY0-701 acronym list (as "Data Privacy Officer") but on no card; GDPR Articles 37 to 39 require one in some cases. Source: [ACR]; GDPR Articles 37 to 39 (not read this session, verify).
4. **Mean time to failure (MTTF).** In the acronym list, only mentioned inside the MTBF card. Source: [ACR], [REL].

## Unsure
- **Disaster recovery vs business continuity scope.** a video course's notes call the DR plan a broader version of the continuity plan; NIST SP 800-34 defines the DRP as recovering information systems at an alternate facility and the BCP as keeping core operations going. Cards keep the NIST view (DR is the IT subset). [PM-POL], [NIST-DRP], [NIST-BCP]
- **Initial vs recurring reporting (5.6).** Two readings exist (program baseline vs a user's first and repeat risky acts); both are now on the cards. The official guide's reading was not available to check.
- **GDPR wording elsewhere.** the video course's privacy notes say GDPR covers people living in the EU; the law says people in the Union when targeted or monitored. Other domain files may use "EU residents"; worth a check by their reviewers.
- **Unverified but left unchanged (common knowledge, no primary source read this session):** CCPA card's "no equivalent federal law" (no comprehensive US federal consumer privacy law); "reputational damage cannot be transferred by insurance"; SOC 2 Type II "12 months" in the attestation example (a valid period, not the only one).
- **PCI DSS annual risk assessment.** the video course says PCI DSS requires an annual risk assessment; that was v3.2.1 Requirement 12.2, and v4.0 changed to targeted risk analyses. Not added for that reason.
- **HIPAA penalty figures** in the video course's compliance notes were not added: their felony class labels look wrong and the statute was not read.
