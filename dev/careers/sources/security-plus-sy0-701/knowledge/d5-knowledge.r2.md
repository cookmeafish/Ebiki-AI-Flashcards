# 5.0 Security Program Management and Oversight

Domain 5 is 20% of the SY0-701 exam. It is less technical than the other domains and leans on precise definitions: which document is which, which risk number means what, which agreement fits which situation, which audit or test type a scenario describes. Most questions are won by telling look-alike terms apart.

The six objectives:

- 5.1 Security governance: the documents, structures and roles that direct security.
- 5.2 Risk management: identify, assess, analyze, record, respond, report, plus the business impact analysis.
- 5.3 Third-party risk: assessing, choosing, contracting with and monitoring vendors.
- 5.4 Security compliance: reporting, consequences, monitoring and privacy.
- 5.5 Audits and assessments: internal, external, attestation and penetration testing.
- 5.6 Security awareness: phishing, anomalous behavior, training topics, metrics and running the program.

## 5.1 Summarize elements of effective security governance

Watch: Professor Messer, Security Policies (https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/security-policies-sy0-701/); Security Standards (https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/security-standards-sy0-701/); Security Procedures (https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/security-procedures-sy0-701/); Security Considerations (https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/security-considerations-sy0-701/); Data Roles and Responsibilities (https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/data-roles-and-responsibilities-sy0-701/)

What the exam expects: you can place a document in the governance hierarchy, name what each policy type covers, pick the external factor that applies, describe governance structures, and match a data role to a description.

### The document hierarchy

| Document | Mandatory? | Level of detail | Answers | Example |
|---|---|---|---|---|
| Policy | Yes | High level | Why and what, broadly | "All confidential data must be encrypted." |
| Standard | Yes | Specific, measurable | What exactly | "Use AES-256 at rest, TLS 1.2 or later in transit." |
| Procedure | Yes | Step by step | How | "1. Open the key vault. 2. Generate key. 3. ..." |
| Guideline | No | Advice | Recommended way | "Consider passphrases of four random words." |

Exam tip: "must" points to a policy or standard; "should" or "recommended" points to a guideline. Specific numbers belong in a standard.

### Guidelines

Optional recommendations that help people meet policies and standards. They give flexibility where a rigid rule would not fit.

### Policies

Management-approved statements of intent that set mandatory direction. The listed policy types:

- **Acceptable use policy (AUP):** what users may and may not do with company systems and data. Signed or acknowledged, so it supports discipline after misuse.
- **Information security policies:** the core program policy: protection of confidentiality, integrity and availability, roles, classification and the security team's authority.
- **Business continuity:** keeping critical business functions running during a disruption, including manual workarounds.
- **Disaster recovery:** restoring IT systems and data after a major disruption, often at a recovery site. A subset of continuity.
- **Incident response:** who responds, their authority, reporting duties and the response lifecycle (preparation, detection, analysis, containment, eradication, recovery, lessons learned).
- **Software development lifecycle (SDLC):** security built into every stage of development (requirements, design, coding, testing, deployment, maintenance).
- **Change management:** the requirement that changes are requested, approved, tested and documented.

### Standards

Mandatory, specific requirements that make policies measurable. They can be internal or adopted from bodies such as NIST or ISO.

- **Password:** length, complexity, breached-password checks, reuse, hashing and salting, when MFA applies.
- **Access control:** the access model (RBAC, ABAC, MAC, DAC, rule-based), least privilege, access reviews, deprovisioning timelines.
- **Physical security:** badges, visitor handling, cameras, locks, secure areas.
- **Encryption:** approved and banned algorithms, key lengths, protocols and key management.

### Procedures

Step-by-step instructions that make work repeatable.

- **Change management (procedure):** request, impact and risk analysis, approval (often a change advisory board), testing, maintenance window, backout plan, implementation, documentation. Contrast with the change management *policy*, which only requires that this happens.
- **Onboarding/offboarding:** accounts, equipment, AUP and NDA signing and training on the way in; immediate account disablement, device and badge return and access removal on the way out. Missed offboarding leaves orphaned accounts.
- **Playbooks:** a step-by-step response to one specific scenario (phishing, ransomware), often automated in a SOAR platform.

### External considerations

| Factor | Source | Example |
|---|---|---|
| Regulatory | Government regulators | HIPAA, SOX |
| Legal | Laws, contracts, courts | Legal hold, breach notification laws |
| Industry | Industry bodies, contracts | PCI DSS (card brands, not a law) |
| Local/regional | State, province, region | CCPA in California |
| National | Whole country | HIPAA across the US |
| Global | Applies across borders | GDPR for anyone handling EU residents' data |

Exam trap: PCI DSS is an industry standard enforced through contracts, not a government regulation.

### Monitoring and revision

Governance documents are reviewed on a schedule and whenever something changes: a new law, new technology, an audit finding, an incident or a business change. Revised documents are re-approved and users re-acknowledge them.

### Types of governance structures

- **Boards:** top-level oversight; set direction and risk appetite, hold executives accountable.
- **Committees:** cross-functional groups focused on one area (security steering committee, audit committee, change advisory board).
- **Government entities:** public bodies with formal structures for their own security, and regulators that set rules for others.
- **Centralized/decentralized:** centralized means one group decides (consistent, easier to enforce, can be slow); decentralized means business units decide (flexible, risk of inconsistency). Hybrids are common.

### Roles and responsibilities for systems and data

| Role | Does | Example |
|---|---|---|
| Owner | Accountable; classifies data, approves access | Head of HR for employee records |
| Controller | Decides purposes and means of processing personal data | Retailer collecting shipping addresses |
| Processor | Processes personal data on the controller's instructions | Payroll service for a client |
| Custodian | Hands-on technical protection: access rights, backups, patching | Database administrator |
| Steward | Data quality, labeling, metadata, correct use | Data governance analyst |

Exam tip: the owner is accountable but not hands-on; the custodian does the daily work. The controller keeps responsibility even when it outsources processing.

### Check yourself

1. A document requires all laptops to use full disk encryption with AES-256. Policy, standard or guideline? **Standard: specific and mandatory.**
2. An employee leaves and their account is still active a month later. Which procedure failed? **Offboarding.**
3. A US store sells to customers in Spain. Which external consideration level makes GDPR apply? **Global.**
4. A cloud firm stores data only as its client instructs. Controller or processor? **Processor.**
5. A bank wants identical controls in every branch. Which governance model fits? **Centralized.**

## 5.2 Explain elements of the risk management process

Watch: Professor Messer, Risk Management (https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/risk-management-sy0-701/); Risk Analysis (https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/risk-analysis-sy0-701/); Risk Management Strategies (https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/risk-management-strategies-sy0-701/); Business Impact Analysis (https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/business-impact-analysis-sy0-701/)

What the exam expects: the process order, assessment frequencies, qualitative vs quantitative analysis, the SLE/ALE formulas with numbers, register contents, appetite vs tolerance, the four strategies including exemption vs exception, and BIA metrics.

The flow: identify, assess, analyze, record in the register, compare to appetite and tolerance, choose a strategy, report, review.

### Risk identification

Finding the assets, threats and vulnerabilities that could cause harm. Inputs include vulnerability scans, threat intelligence, audits, interviews and past incidents. The output feeds the risk register.

### Risk assessment

Evaluating identified risks for likelihood and impact. NIST SP 800-30 is the US guide for conducting risk assessments. The exam names four frequencies:

| Type | When | Example |
|---|---|---|
| Ad hoc | As needed, triggered by an event | New zero-day in your VPN product |
| Recurring | On a schedule | Annual assessment before budgeting |
| One-time | Once, for a specific project | Before an acquisition |
| Continuous | Always running, often automated | Cloud posture tool flags a public bucket instantly |

### Risk analysis

- **Qualitative:** ratings such as low, medium, high, often in a heat map. Quick, subjective, easy to communicate.
- **Quantitative:** numbers and money. Supports cost-benefit decisions.
- **Probability** is a numeric chance (10% per year). **Likelihood** is usually a qualitative rating (high, possible, rare).
- **Exposure factor (EF):** the percentage of the asset's value lost in one event (0 to 1).
- **Impact:** the consequence: money, downtime, safety, legal, reputation. Risk = likelihood x impact.

The formulas:

- **SLE (single loss expectancy)** = asset value (AV) x exposure factor (EF)
- **ARO (annualized rate of occurrence)** = events expected per year (once every N years = 1/N)
- **ALE (annualized loss expectancy)** = SLE x ARO

Worked example: a warehouse worth $500,000 would lose 40% of its value in a flood (EF 0.4). SLE = $500,000 x 0.4 = $200,000. Floods happen once every 10 years, so ARO = 0.1. ALE = $200,000 x 0.1 = $20,000 per year. A flood barrier costing $5,000 a year that removes most of that loss is worth buying; one costing $30,000 a year is not.

### Risk register

The central list of risks with description, likelihood, impact, score, owner, KRIs, threshold, chosen response and status.

- **Key risk indicators (KRIs):** early-warning metrics that a risk is rising (number of unpatched critical vulnerabilities). KPIs measure performance; KRIs warn about risk.
- **Risk owners:** the accountable person for each risk, with authority and budget to act.
- **Risk threshold:** the line at which a risk or KRI must be escalated or acted on.

### Risk tolerance and risk appetite

| Term | Meaning | Example |
|---|---|---|
| Risk appetite | Overall willingness to take risk to reach goals, set by leadership | "We take low risk with patient data." |
| Risk tolerance | Acceptable deviation for a specific risk | "Critical patches may take up to 7 days." |
| Risk threshold | Trigger point for action | "Escalate if expected loss exceeds $25,000." |

Appetite postures:

- **Expansionary:** accepts more risk for growth (a startup racing to market).
- **Conservative:** avoids risk, favors stability (hospitals, banks, government).
- **Neutral:** balanced, decided by cost-benefit analysis.

### Risk management strategies

| Strategy | What it does | Example |
|---|---|---|
| Transfer | Shifts the financial impact to another party | Cyber insurance, outsourcing under contract |
| Accept | Takes the risk as is, documented and approved | Cost of control exceeds the ALE |
| Avoid | Stops or never starts the risky activity | Stop storing card numbers at all |
| Mitigate | Reduces likelihood or impact with controls | MFA, patching, firewalls |

Acceptance has two forms on the exam:

- **Exemption:** the requirement does not apply to this case, formally approved (a legacy system exempted from a standard it cannot meet).
- **Exception:** the requirement still applies, but a temporary, approved deviation is allowed, usually with compensating controls and an expiry date.

The deciding test is scope: an exemption removes the rule for this case; an exception keeps the rule but allows a deviation. Both must be documented, approved and reviewed.

Exam traps: insurance transfers money, not accountability or reputational harm. What remains after mitigation is residual risk, which is then accepted or transferred.

### Risk reporting

Communicating risks, trends and treatment status to executives, the board, and regulators where required. Tailor it: business impact for leaders, technical detail for teams. Often generated from the register.

### Business impact analysis

The BIA identifies critical functions, their dependencies and the cost of downtime over time, and sets recovery targets.

| Metric | Measures | Better when | Drives |
|---|---|---|---|
| RTO (recovery time objective) | Maximum acceptable downtime | Shorter (stricter) | Recovery site choice, failover |
| RPO (recovery point objective) | Maximum acceptable data loss, measured in time | Shorter (stricter) | Backup and replication frequency |
| MTTR (mean time to repair) | Average time to fix and restore | Lower | Spares, support contracts |
| MTBF (mean time between failures) | Average run time between failures of a repairable item | Higher | Hardware choice, redundancy |

Note: objective 5.2 says "mean time to repair"; the SY0-701 acronym list expands MTTR as "Mean Time to Recover". Both mean the average time to get a failed item back in service. MTTF (mean time to failure) is the non-repairable cousin of MTBF.

Memory aid: RTO is about *time* to be back up; RPO is about the *point* in the past you can restore to.

### Check yourself

1. A $80,000 server cluster would lose 25% of its value in a power surge that happens twice a year. What are SLE and ALE? **SLE = $80,000 x 0.25 = $20,000; ALE = $20,000 x 2 = $40,000.**
2. Backups run every 4 hours. Which metric does that interval satisfy? **An RPO of 4 hours or more.**
3. A company stops offering a risky online service entirely. Which strategy? **Avoid.**
4. A server may skip the patch deadline for 60 days with extra isolation. Exemption or exception? **Exception: temporary deviation with compensating controls.**
5. A metric rising past 20 open critical findings triggers escalation. What is the metric, and what is the 20? **A KRI; the 20 is the risk threshold.**

## 5.3 Explain the processes associated with third-party risk assessment and management

Watch: Professor Messer, Third-party Risk Assessment (https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/third-party-risk-assessment-sy0-701/); Agreement Types (https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/agreement-types-sy0-701/)

What the exam expects: how to verify a vendor's security, what to check before choosing one, which agreement fits a scenario, and how vendors are watched after signing.

Why it matters: a vendor with access to your data or network extends your attack surface. Supply chain compromises reach many victims through one supplier.

### Vendor assessment

- **Penetration testing:** testing the vendor's systems or product, only with its written permission and rules of engagement, or reviewing the vendor's own third-party pen test results.
- **Right-to-audit clause:** a contract term letting you (or an auditor you choose) audit the vendor. Must be negotiated before signing.
- **Evidence of internal audits:** the vendor's own audit reports and proof findings were fixed. Useful, but not independent.
- **Independent assessments:** impartial outside reviews such as a SOC 2 Type II report or ISO 27001 certification. More credible than self-reporting.
- **Supply chain analysis:** looking at the vendor's suppliers and components, for example a software bill of materials (SBOM) or where hardware is made.

### Vendor selection

- **Due diligence:** investigating a vendor before signing: security practices, breach history, finances, reputation, legal and compliance status.
- **Conflict of interest:** a selector with a personal or financial stake in a bidder must disclose it and step aside.

### Agreement types

| Agreement | Purpose | Formality | Typical scenario |
|---|---|---|---|
| SLA (service-level agreement) | Measurable service levels and penalties | Contract | 99.9% uptime, 4-hour response |
| MOU (memorandum of understanding) | Statement of intent to cooperate | Informal, usually not binding | Two agencies plan to share threat intel |
| MOA (memorandum of agreement) | Cooperation with defined responsibilities | More formal than MOU | Two universities split duties on shared research systems |
| MSA (master service agreement) | General terms for an ongoing relationship | Contract, umbrella | Payment, liability, confidentiality terms for all future work |
| WO/SOW (work order/statement of work) | Scope, deliverables, timeline, cost of one job | Contract, under an MSA | A specific pen test engagement |
| NDA (non-disclosure agreement) | Keep shared information confidential | Contract | Testers receive network diagrams |
| BPA (business partners agreement) | How partners work together: duties, profit and loss sharing, data handling | Contract | Two firms jointly sell a product |

Exam tips: MSA is the umbrella and the SOW is the specific job under it. MOU is weaker than MOA. An SLA is about measurable service, not secrecy (NDA) or scope (SOW).

### Vendor monitoring

Ongoing oversight after signing: SLA performance, fresh audit reports, questionnaires, breach news, financial health. Higher-risk vendors are reviewed more often.

### Questionnaires

Standard security question sets sent to vendors during selection and periodically after. Scalable but self-reported, so verify high-risk answers with evidence or audits.

### Rules of engagement

The boundaries of an engagement such as a pen test: in-scope and out-of-scope systems, allowed techniques, time windows, contacts, data handling, and how to stop or escalate. Required before testing starts.

### Check yourself

1. You want to inspect a vendor's controls yourself after an incident. What must the contract contain? **A right-to-audit clause.**
2. A consulting firm will do many projects over three years. Which document sets the common terms, and which defines each project? **MSA for terms; SOW (or work order) per project.**
3. Two agencies sign a non-binding document stating they intend to cooperate. Which type? **MOU.**
4. A vendor's answers to a security questionnaire look perfect. What is the weakness of relying on them? **They are self-reported; verify with independent assessments such as a SOC 2 report.**
5. Which agreement defines guaranteed uptime with service credits? **SLA.**

## 5.4 Summarize elements of effective security compliance

Watch: Professor Messer, Compliance (https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/compliance-sy0-701/); Privacy (https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/privacy-sy0-701/)

What the exam expects: who compliance reports go to, what happens when you fail, how compliance is monitored, and the privacy concepts and roles.

### Compliance reporting

- **Internal:** reports to management, the board or the audit committee to track status and fix gaps before outsiders find them.
- **External:** reports to regulators, auditors, partners or customers, often mandatory with fixed formats and deadlines (including legally required breach notifications).

### Consequences of non-compliance

| Consequence | What it is | Example |
|---|---|---|
| Fines | Monetary penalties | GDPR: up to 20 million euros or 4% of worldwide annual turnover, whichever is higher, for the most serious violations |
| Sanctions | Restrictions or orders from an authority | Ordered to stop processing personal data |
| Reputational damage | Loss of trust and business | Customers leave after a privacy scandal |
| Loss of license | Permit or certification revoked | Merchant can no longer accept cards |
| Contractual impacts | Penalties or termination under contracts | Customer ends a contract for failed security terms |

Reputational damage cannot be transferred by insurance and often costs more than the fine.

### Compliance monitoring

- **Due diligence/care:** due diligence is investigating and understanding the risks and requirements; due care is acting on them by putting reasonable protections in place and keeping them working. Knowing without acting is negligence.
- **Attestation and acknowledgement:** attestation is a formal statement (by management or an auditor) that controls or compliance are in place; acknowledgement is individuals confirming they read and will follow a policy.
- **Internal and external:** internal monitoring by your own compliance team; external monitoring by regulators, auditors or customers, more independent.
- **Automation:** scanners, SIEM rules and dashboards that check compliance continuously and collect evidence automatically.

### Privacy

- **Legal implications:** privacy law exists at every level, and all applicable levels apply at once.
  - **Local/regional:** state or provincial laws such as CCPA (California).
  - **National:** countrywide laws such as HIPAA (US health data) or PIPEDA (Canada).
  - **Global:** laws that follow the data subject across borders, chiefly GDPR.
- **Data subject:** the identifiable living person the data is about.
- **Controller vs. processor:** the controller decides why and how personal data is processed and stays accountable; the processor acts only on the controller's instructions, usually bound by a data processing agreement.
- **Ownership:** holding data does not give unlimited rights over it; data subjects keep rights, and internally a data owner is accountable.
- **Data inventory and retention:** know what data you hold, where and why; keep it only as long as needed or legally required, then dispose of it securely. A legal hold overrides normal deletion.
- **Right to be forgotten:** GDPR's right to erasure (Article 17). The data subject can ask for deletion when data is no longer needed or consent is withdrawn; it is not absolute (for example, a legal duty to keep records can override it).

### Check yourself

1. A company researches which privacy laws apply, then encrypts data and trains staff. Which part is due diligence and which is due care? **Research is due diligence; encrypting and training is due care.**
2. Employees sign each year that they have read the AUP. What compliance monitoring element is this? **Acknowledgement.**
3. A regulator orders a company to suspend data processing. Fine or sanction? **Sanction.**
4. A former customer asks for all their data to be deleted. Which right? **Right to be forgotten (right to erasure).**
5. Why does a data inventory matter for erasure requests? **You cannot delete every copy of data you do not know you have.**

## 5.5 Explain types and purposes of audits and assessments

Watch: Professor Messer, Audits and Assessments (https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/audits-and-assessments-sy0-701/); Penetration Tests (https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/penetration-tests-sy0-701/)

What the exam expects: tell internal from external reviews, know what an attestation is, and identify pen test types, environments and reconnaissance from a scenario.

### Attestation

A formal written opinion from an auditor or qualified party that information or controls are accurate and effective. A SOC 2 Type II report is the classic example: an independent auditor attests that controls worked over a period. (Compare 5.4, where attestation also covers management statements, and acknowledgement is users confirming policies.)

### Internal

- **Compliance:** your own team checks adherence to laws, standards and internal policies.
- **Audit committee:** a board subcommittee that oversees audits and receives findings, keeping auditors independent of the management being audited.
- **Self-assessments:** a team rates its own controls with a checklist. Cheap and quick, least independent.

### External

- **Regulatory:** an audit by or for a regulator, mandatory, with penalties possible.
- **Examinations:** formal, detailed regulator inspections, common in banking.
- **Assessment:** an outside evaluation of security posture against a framework, focused on improvement and recommendations.
- **Independent third-party audit:** an outside firm with no stake in the result gives an objective opinion (SOC 2, ISO 27001, PCI DSS).

| | Internal | External |
|---|---|---|
| Performed by | Own staff | Regulators, examiners, outside firms |
| Independence | Lower | Higher |
| Cost and frequency | Cheaper, more often | Costlier, periodic |
| Main use | Find and fix gaps early | Independent proof for regulators and customers |

Audit vs assessment: an audit verifies against requirements and produces formal findings; an assessment evaluates and recommends.

### Penetration testing

Authorized simulated attacks that exploit vulnerabilities to show real impact. A vulnerability scan only finds weaknesses; a pen test tries to use them. Always requires written authorization and rules of engagement.

**Test focus and teams:**

| Type | Team | What it does |
|---|---|---|
| Physical | Testers on site | Tailgating, lock picking, badge cloning, posing as staff |
| Offensive | Red team | Attacks to find and exploit weaknesses |
| Defensive | Blue team | Detects and responds to the attacks |
| Integrated | Purple team | Red and blue work together and tune defenses during the test |

**Environment (how much testers know):**

| Environment | Old name | Testers get | Simulates |
|---|---|---|---|
| Known | White box | Full details: diagrams, code, credentials | Thorough review |
| Partially known | Gray box | Some details: IP ranges, a user account | Insider or researched attacker |
| Unknown | Black box | Nothing but the target name | Outside attacker |

**Reconnaissance:**

- **Passive:** no direct contact with target systems: OSINT, websites, social media, public DNS records, search engines. Hard to detect.
- **Active:** touches the target: port scans, ping sweeps, banner grabbing, vulnerability scans. Can be logged and detected.

Exam trap: a port scan is always active reconnaissance.

### Check yourself

1. Testers receive the full source code and network diagrams. Which environment? **Known environment.**
2. A tester reads the company's job postings to learn which firewall it uses. Passive or active? **Passive.**
3. Attackers and defenders share findings in real time to improve detection. Which team type? **Integrated (purple team).**
4. Who should internal auditors report findings to, to stay independent of IT management? **The audit committee.**
5. A cloud provider shares a SOC 2 Type II report written by an outside auditor. What is this document? **An attestation from an independent third-party audit.**

## 5.6 Given a scenario, implement security awareness practices

Watch: Professor Messer, Security Awareness (https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/security-awareness-sy0-701/); User Training (https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/user-training-sy0-701/)

What the exam expects: given a situation, choose the right awareness activity, identify the type of anomalous behavior, pick the right training topic, and know how a program is measured, developed and run.

### Phishing

- **Campaigns:** authorized simulated phishing emails that measure clicks, credential entry and reports. The goal is education, not punishment.
- **Recognizing a phishing attempt:** urgency or threats, unexpected attachments or links, look-alike sender domains, requests for credentials or payment, links whose real destination differs from the text, unusual tone or errors. Verify through a separate known channel.
- **Responding to reported suspicious messages:** analyze, pull copies from all mailboxes, block senders and URLs, reset credentials of anyone who clicked, thank the reporter. A one-click report button increases reporting.

### Anomalous behavior recognition

| Type | Intent | Example |
|---|---|---|
| Risky | Deliberate or careless | Disabling antivirus, sharing a password, installing unapproved software |
| Unexpected | Out of the normal pattern | A 3 a.m. login from another country accessing unusual files |
| Unintentional | Honest mistake | Emailing customer data to the wrong address |

Users report what they notice; they do not investigate on their own.

### User guidance and training

- **Policy/handbooks:** know the rules and where they are; acknowledge them.
- **Situational awareness:** notice tailgating, shoulder surfing, unbadged people, strange devices.
- **Insider threat:** threats can come from inside; warning signs include unusual access, data hoarding, disgruntlement before leaving.
- **Password management:** unique passwords or passphrases, a password manager, MFA, never share credentials.
- **Removable media and cables:** never plug in found USB drives or unknown cables and chargers; they can carry malware or act as malicious keyboards. Use approved, encrypted media.
- **Social engineering:** pretexting, impersonation, phishing, vishing, smishing, tailgating, false urgency and authority. Verify requests out of band.
- **Operational security:** do not leak information through daily behavior: social media posts, unlocked screens, public conversations, cluttered desks.
- **Hybrid/remote work environments:** VPN, secure home Wi-Fi, avoid untrusted public networks, privacy screens, keep work devices for work.

### Reporting and monitoring

- **Initial:** the baseline at program start (for example, a 30% click rate on the first simulation).
- **Recurring:** ongoing measurement (monthly click rates, report rates, training completion) to show trends and target weak areas.

Track good behavior (reports) as well as failures (clicks).

### Development and execution

- **Development:** assess needs and risks, set measurable goals, identify audiences and roles, choose topics and formats, build content.
- **Execution:** roll out training and campaigns, schedule sessions, track participation and results, adjust the program.

### Check yourself

1. An employee finds a USB stick labeled "Bonuses" in the lobby. Which training topic covers this? **Removable media and cables (baiting).**
2. A user turns off the endpoint agent because it slows their computer. Which type of anomalous behavior? **Risky.**
3. Before launching training, the team runs a phishing test to measure the click rate. Which kind of reporting is this? **Initial (baseline).**
4. A caller claiming to be the CFO demands an urgent wire transfer. What should the employee do? **Verify through a separate, known channel before acting (social engineering).**
5. Three users report the same suspicious email. What should the security team do first? **Analyze the message. If it is malicious, remove copies from all mailboxes, block the sender and links, and reset credentials for anyone who interacted.**
