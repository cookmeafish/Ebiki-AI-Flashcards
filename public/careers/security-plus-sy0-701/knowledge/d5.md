# Domain 5: Security Program Management and Oversight
Checked as of 2026-11 for SY0-701.

## 5.1 Summarize the parts of effective security governance

Depth asked: summarize. A good answer places each document, structure or role correctly, says what it is for and tells it apart from its look-alikes; no calculations are needed.

### Policy vs standard vs procedure vs guideline (governance document hierarchy)

Security governance turns leadership intent into rules people can follow, through four kinds of document that get more specific as you go down. A policy says what the organization requires and why, a standard makes it measurable, a procedure says how to do it step by step, and a guideline gives optional advice. They are administrative (managerial) controls and support every leg of confidentiality, integrity and availability (CIA).

| Document | Mandatory? | Detail | Answers | Example |
|---|---|---|---|---|
| Policy | Yes | Broad | What and why | "Confidential data is encrypted wherever it is stored." |
| Standard | Yes | Specific, measurable | Exactly what | "Laptops use full disk encryption with an approved algorithm." |
| Procedure | Yes | Step by step | How | "1. Open the enrollment tool. 2. Turn on disk encryption. 3. Escrow the recovery key." |
| Guideline | No | Advice | A recommended way | "A passphrase of several unrelated words is easier to remember." |

How they connect:
1. Leadership approves the policy first, because every lower document must trace back to an approved intent.
2. Standards are written next, so the policy can be checked (a number, a named technology, a required setting).
3. Procedures follow, so staff carry out the standard the same way every time.
4. Guidelines fill gaps where one rigid rule would not fit every system and more than one correct way exists.
The common wrong order is writing technical standards before any approved policy: then nobody has the authority to enforce them.

**Why it matters:** auditors check that each control traces to an approved policy and is carried out as written. A rule that lives only in someone's head cannot be enforced, audited or used to discipline misuse.

**Common confusions:** A standard is not optional just because it is technical; standards are normally compulsory inside the organization. A guideline is the only one of the four that may be ignored when there is a good reason. Organizational standards are internal rules and are different from national standards bodies' documents, although an internal standard can adopt one.

**Scenario:** A document says all remote access must use multifactor authentication (MFA) with an app or hardware token, and lists the two approved products. That is a standard: it is mandatory and names specific technology. A policy is the closest wrong answer, but a policy would only say remote access must be strongly authenticated, without naming products.

Word cue: "must" with specific values points to a standard, "must" with broad intent points to a policy, numbered steps point to a procedure, and "should", "consider" or "recommended" point to a guideline.

### Guidelines (security governance)

A guideline is a recommended practice that helps people meet a policy or standard when systems differ too much for one fixed rule. It is advisory, not mandatory, and it often exists so that an important measure is not forgotten even though it can be done correctly in more than one way. It is an administrative control.

How guidelines are used:
1. A team reads the policy and standard that apply to its system.
2. Where the standard leaves room, the guideline suggests a good way to comply (a sample configuration, a checklist, a recommended tool).
3. The team may choose another method that still meets the standard, and records why.

**Why it matters:** guidelines spread good practice without forcing every system into a mold that may be impractical or too costly. They also help write system-specific procedures.

**Common confusions:** A guideline cannot be the basis for disciplining someone who did not follow it, because it was never required. If a document lists exact values that everyone must meet, it is a standard even if its title says "guide". Guidelines are not lower quality than standards; they are simply optional.

**Scenario:** The security team publishes advice suggesting developers use a particular logging library so that events are easy to search, while the logging standard only requires that security events be recorded with a timestamp and user ID. The advice is a guideline: developers may use another library as long as the standard is met. Calling it a standard fails because nothing in the advice is required.

Mini-example of wording: "Teams should prefer the central secrets vault for storing API keys" is a guideline; "API keys must be stored in the central secrets vault" is a standard.

### Policies (security governance)

A policy is a management-approved statement of what the organization requires and why. It sets direction and assigns responsibility; standards and procedures put it into practice. Policies are administrative (managerial) controls and are mandatory.

Policies come in three broad kinds:
1. A program policy creates the security program itself: purpose, scope, responsibilities and how compliance is handled. It changes rarely.
2. Issue-specific policies cover one topic of concern to users, such as internet use, email privacy, bring your own device (BYOD) or social media. They are reviewed more often because technology changes.
3. System-specific policies set the security rules for one system, such as who may change records in the payroll application.

The objective lists these policy types: acceptable use, information security, incident response, business continuity, disaster recovery, change management and the software development lifecycle (SDLC). Each has its own section in this chapter.

**Why it matters:** a policy gives the security team authority. Without an approved policy, a manager can refuse a control and there is nothing to point to. Writing a policy does not enforce it: the organization still has to apply it, check it and act on violations.

**Common confusions:** A policy does not name products, versions or settings; that is a standard. A policy usually does not list specific penalties for each infraction; it authorizes the compliance and disciplinary structures that do. A violation can be an honest mistake caused by lack of training, so policies are paired with awareness training.

**Scenario:** A new chief information security officer (CISO) finds that teams argue about whose job security is and nobody can approve exceptions. The fix is a program-level information security policy approved by leadership that defines scope, roles and authority. A new technical standard is the closest wrong answer: it would add rules, but without the policy nobody has authority to enforce them.

### Acceptable use policy (AUP)

An acceptable use policy (AUP) states what users may and may not do with the organization's systems, networks, devices and data. Users read and sign or electronically acknowledge it, usually at onboarding and again when it changes. It is an administrative, deterrent control that protects all three CIA legs by shaping behavior.

Typical content:
1. Permitted business use and limits on personal use.
2. Forbidden actions: sharing accounts, installing unapproved software, bypassing security tools, accessing data without a business need.
3. Monitoring notice: the organization may monitor use of its systems.
4. Consequences of violations.
5. Rules for personal devices, email, internet and social media, or links to those issue-specific policies.

**Why it matters:** the signed acknowledgement gives human resources (HR) and legal teams a basis for discipline or dismissal after misuse, because the user cannot claim they were never told. It also removes an expectation of privacy on company systems where the law allows.

**Common confusions:** An AUP is for users and their behavior; the information security policy is the program-level document for the whole organization. A non-disclosure agreement (NDA) protects specific confidential information, while an AUP governs how systems are used. A user agreement in an information exchange plays a similar role to an AUP for shared data.

**Scenario:** An employee installs a game on a work laptop and later says nobody told them it was forbidden. HR checks the signed AUP, which prohibits unapproved software. The AUP is the answer. An NDA is the closest wrong answer: it covers keeping information secret, not what software may be installed.

Mini-example of an AUP line: "Company devices may run only software from the approved catalog. Users may not disable endpoint protection or share their credentials with anyone, including IT staff."

### Information security policy (program policy)

The information security policy is the top policy of the security program. It states the purpose of protecting the organization's information, what the program covers, who is responsible for what, and how compliance is handled. Other security policies and standards flow from it. It is an administrative control covering confidentiality, integrity and availability (CIA).

What it usually contains:
1. Purpose and goals, for example protecting customer records or keeping critical systems available.
2. Scope: which facilities, systems, information and people it covers.
3. Roles and responsibilities, including the security team's authority and the duties of data owners and system owners.
4. Data classification levels and the rule that data is protected according to its level.
5. Compliance: who monitors adherence and the authority to create disciplinary processes.

**Why it matters:** this policy is what lets the security team act across departments. Auditors and regulators usually ask for it first, because every other control should map back to it.

**Common confusions:** It is high level; it does not list cipher suites or password lengths (those are standards). It is different from the acceptable use policy (AUP), which speaks to individual users about their behavior. The goals stressed depend on the business: a records-heavy business may stress integrity and recovery, a privacy-heavy one confidentiality.

**Scenario:** An auditor asks which document gives the security team authority to require encryption across all departments. The answer is the information security policy. The encryption standard is the closest wrong answer: it says which algorithms to use, but its authority comes from the policy above it.

### Business continuity policy vs disaster recovery policy (BCP vs DRP)

Both policies prepare the organization for a major disruption, but at different scopes. Business continuity keeps critical business functions running during and after a disruption, including manual workarounds when technology is down. Disaster recovery restores IT systems and data, often at an alternate site. Both are corrective and recovery controls that protect availability.

| | Business continuity (BCP) | Disaster recovery (DRP) |
|---|---|---|
| Focus | The whole business process | IT systems and data |
| Question | How do we keep serving customers? | How do we get the systems back? |
| Includes | People, facilities, suppliers, manual processes | Backups, failover, alternate site |
| Relationship | Broader | A part of continuity |

How they are built:
1. A business impact analysis (BIA) names critical functions and sets recovery targets such as the recovery time objective (RTO) and recovery point objective (RPO).
2. The continuity plan decides how each critical function keeps going.
3. The recovery plan decides how each supporting system is restored within those targets.
4. Both are tested before any disaster (tabletop exercises, failover tests) and updated after tests and changes.
Writing the plans during the disruption is the classic failure: the plan must exist and be tested first.

**Why it matters:** a disruption without a tested plan turns hours of outage into days, with lost revenue, broken contracts and regulatory trouble.

**Common confusions:** Disaster recovery is not the same as backup; a backup is one tool the recovery plan uses. Continuity is not only IT; paper forms and phone trees are continuity measures. The BIA sets the targets, see `### Business impact analysis (BIA)`.

**Scenario:** A hospital's records system goes offline and nurses switch to paper charts while IT restores the servers at a second data center. The paper charts are business continuity; the server restoration is disaster recovery. Calling the paper charts disaster recovery fails because no IT system is being restored by them.

### Incident response policy

The incident response policy establishes the organization's capability to handle security incidents: who is on the response team, what authority they have, when and to whom incidents are reported, and which lifecycle they follow. The detailed steps live in procedures and playbooks. It is an administrative control supporting detective and corrective work.

Typical content:
1. Definitions of an event and an incident and how severity is rated.
2. The response team, its leader and its authority (for example, to take a system offline).
3. Internal and external reporting duties, including legal and regulatory notification.
4. The lifecycle the team follows; this course uses preparation, detection, analysis, containment, eradication, recovery and lessons learned.
5. Training and testing requirements.

The full lifecycle is taught in objective 4.8. In this objective, incident response is one of the listed policy types. NIST SP 800-61 Revision 3 (April 2025) replaced Revision 2 and is written as a community profile of the NIST Cybersecurity Framework (CSF) 2.0, tying its incident response recommendations to the framework's functions; the seven steps above remain the common way to name the stages.

**Why it matters:** without a policy granting authority, responders lose time asking permission while an attacker spreads, and notification deadlines set by law can be missed.

**Common confusions:** The policy says who and what; a playbook says the exact steps for one kind of incident. Incident response handles a security incident; disaster recovery restores systems after any major disruption, and the two can run together.

**Scenario:** During a ransomware outbreak, an analyst wants to isolate a file server but the server's owner objects. The incident response policy, which grants the team authority to isolate systems, settles it. A ransomware playbook is the closest wrong answer: it lists the steps, but the authority to act comes from the policy.

### Software development lifecycle (SDLC) policy

A software development lifecycle (SDLC) policy requires security to be built into every stage of how the organization designs, builds and maintains software, from requirements to retirement. It is an administrative control that prevents vulnerabilities from reaching production, mainly protecting integrity and confidentiality.

Stages it typically governs, each with a security task:
1. Requirements: write security and privacy requirements, because what is not required is not built.
2. Design: threat model the design, since a design flaw is built into everything that follows.
3. Coding: follow secure coding standards and review code.
4. Testing: run static and dynamic testing in a separate test environment, never on live data without approval.
5. Deployment: promote through development, test, staging and production with approval.
6. Maintenance: patch, monitor and eventually retire the software securely.
A waterfall model runs these stages once, in order; an agile model repeats short cycles of them, so security tasks must fit every cycle.

**Why it matters:** a flaw caught before release never reaches customers, while a flaw found in production must be patched under pressure, possibly after it was exploited.

**Common confusions:** The SDLC policy is about how software is built; change management controls how any change, including a software release, reaches production. Secure coding techniques themselves are taught under application security in Domain 4.

**Scenario:** Developers keep testing new features against the production customer database. The control that should stop this is the SDLC policy requiring separate environments and approved test data. Change management is the closest wrong answer: it approves releases, but it does not govern where developers test during development.

### Change management: policy vs procedure (change advisory board, backout plan)

Change management controls how changes to systems are proposed, judged, approved, made and recorded, so that a change does not cause an outage or quietly weaken security. The change management POLICY states that every change must go through control; the change management PROCEDURE is the step-by-step process people follow. Both are administrative controls protecting integrity and availability. The technical side of change control (allow lists, dependencies, restarts) is taught in objective 1.3.

The procedure, in order, with the reason for each step:
1. Request: describe the change, its purpose and its scope, so reviewers know what is being touched.
2. Impact and risk analysis: judge how the change affects the system's security and operation, before approval, not after.
3. Approval: the system or business owner and a change advisory board (CAB, also called a change control board, or in NIST configuration guidance a configuration control board) approve it; the board is a cross-functional check that holds changes to agreed criteria such as scope, cost and security impact.
4. Testing: try the change outside production so failures happen where they hurt nobody.
5. Scheduling: pick a maintenance window when users are least affected.
6. Backout plan: write how to undo the change before starting, because a failed change with no way back becomes an outage.
7. Implementation, then a check that it was done as approved and had no surprise effects on security.
8. Documentation: update records, diagrams and plans so the next person sees the true state.
The common wrong order is implementing first and asking for approval later; emergency changes still get analyzed and documented, just faster.

**Why it matters:** an uncontrolled change can cause an outage or silently weaken a security setting, and nobody knows which change to undo. Controlled changes keep records, recovery plans and the real system in step.

**Common confusions:** The policy only requires control; the procedure says how. A backout plan undoes a change; it is not a backup, although the plan may use one. The goal is to KNOW what changes, not to forbid every change that lowers security; an owner may approve a reduction as an accepted risk.

**Scenario:** An administrator applies a firewall rule change on a Friday afternoon, it blocks payments, and nobody knows how to reverse it. The missing element is the backout plan from the change procedure (and the maintenance window). Pointing at the change management policy fails: the policy existed; the procedure steps were skipped.

### Standards (security governance)

Standards are mandatory, specific requirements that make a policy measurable: exact settings, approved technologies, minimum levels. They can be written internally or adopted from outside bodies such as the National Institute of Standards and Technology (NIST) or the International Organization for Standardization (ISO). They are administrative controls that drive technical configuration.

The objective lists four standards. Password and access control are covered in `### Password standard and access control standard`; physical security and encryption in `### Physical security standard and encryption standard`.

How a standard is produced and used:
1. Start from the policy statement it supports, so the standard has authority.
2. Choose values based on risk and outside guidance (for example, a password length from current NIST guidance).
3. Publish it with an owner and a review date.
4. Turn it into configuration baselines and automated checks.
5. Handle cases that cannot comply through the formal exception or exemption process (see objective 5.2).

**Why it matters:** "protect data well" cannot be audited; "encrypt laptops with an approved full disk encryption product" can. Standards give auditors and tools something concrete to test against.

**Common confusions:** A standard is more detailed than a policy and less step by step than a procedure. An internal standard is different from a published industry standard such as the Payment Card Industry Data Security Standard (PCI DSS), although an organization may adopt one. Standards change more often than policies because technology changes.

**Scenario:** A policy requires strong authentication, but every team picks its own password length. The fix is a password standard that sets one minimum length and the rules around it. A guideline is the closest wrong answer: advice would leave teams free to keep choosing their own values.

### Password standard and access control standard

A password standard sets the organization's rules for creating, storing and resetting passwords; an access control standard sets how access is requested, granted, reviewed and removed. Both are administrative controls that protect confidentiality and integrity, and both are enforced through technical settings.

What a password standard usually defines: minimum length (with a lower minimum when the password is one factor of multifactor authentication), whether composition rules apply, when a change is forced, a check of new passwords against a blocklist of breached and common passwords, how passwords are stored (salted hashes), when MFA is required, and whether devices sign in against a central directory instead of local accounts. Current NIST guidance (SP 800-63B-4) asks for at least 15 characters when a password is the only factor and at least 8 when it is part of MFA, forbids extra composition rules and forced periodic changes, and requires a change only when there is evidence of compromise. The full treatment of authentication is in objective 4.6.

What an access control standard usually defines: the access model in use (role-based, attribute-based, mandatory, discretionary, rule-based), least privilege and separation of duties, the approval needed to get access (a manager's sign-off, a completed training course), how often access is reviewed, and the events that remove access (job change, departure, contract end, a security issue).

**Why it matters:** inconsistent password and access rules are how one weak account becomes a breach; access reviews catch privilege creep before an attacker uses it.

**Common confusions:** Forcing a password change every few months is no longer recommended; length and blocklist checks are. The access control standard names the model; it does not grant access itself, which the owner approves.

**Scenario:** An audit finds staff who moved departments still hold their old permissions. The control that should have caught it is the periodic access review required by the access control standard. The password standard is the closest wrong answer: it governs how users prove identity, not what they may reach.

### Physical security standard and encryption standard

A physical security standard sets the required protections for buildings, rooms and equipment; an encryption standard sets which cryptographic algorithms, key lengths, protocols and key management practices are approved. Physical controls protect people, facilities and hardware; encryption is a technical control protecting confidentiality and integrity of data at rest, in transit and in use.

A physical security standard typically states: badge access rules, visitor sign-in and escort, camera coverage, lock types (for example a biometric reader on the data center door), secure areas, and different rules for employees, contractors and guests. The physical controls themselves (bollards, access control vestibules, guards) are taught in objective 1.2.

An encryption standard typically states: approved and banned algorithms, minimum key sizes, approved protocol versions, how keys are generated, stored, rotated and destroyed, and how passwords are stored (salted hashes with a named algorithm). Legacy items such as the Data Encryption Standard (DES) and Message Digest 5 (MD5) appear on the banned list because they are broken. Exact key sizes live in the Reference chapter.

**Why it matters:** without a physical standard, a stolen server bypasses every network control; without an encryption standard, teams ship broken algorithms that fail an audit and expose data.

**Common confusions:** A physical security standard is a governance document; a physical penetration test (objective 5.5) checks whether it works. An encryption standard names what to use; key management procedures say how to do it day to day.

**Scenario:** A developer chooses an old hashing algorithm for a new login system because it is fast. The document that should forbid this is the encryption standard's list of approved and banned algorithms. The password standard is the closest wrong answer: it may require hashing, but the approved algorithm list belongs to the encryption standard.

### Procedures (security governance)

A procedure is a detailed, ordered set of steps for doing one task in line with a policy and its standards, so the task is done the same way no matter who does it. It is the most detailed governance document and is mandatory for the people it applies to. It is an administrative control. The objective lists three: change management, onboarding and offboarding, and playbooks.

What makes a good procedure:
1. A clear trigger (when to run it) so nobody wonders whether it applies.
2. Numbered steps in the order they must happen, because order often matters for security (disable the account before handing back the laptop, not after).
3. The role responsible for each step.
4. Records produced as evidence (a ticket, a signed form, a log entry).
5. An owner and a review date, so it stays current when tools change.

**Why it matters:** procedures make controls repeatable and provable. When a step is missed, the record shows where the process broke, which supports fixing it and, if needed, accountability.

**Common confusions:** A procedure says how; it does not decide whether something is allowed (that is the policy) or what values to use (that is the standard). A playbook is a procedure written for one kind of security event. Handbooks and manuals often mix policies, standards and procedures in one book; a clear one marks which parts are rules and which are steps.

**Scenario:** Two help desk staff reset passwords in different ways, and one never checks the caller's identity. The fix is a documented password reset procedure with an identity verification step. A new password standard is the closest wrong answer: it would set password rules, not the steps for verifying a caller before a reset.

### Onboarding and offboarding procedures

Onboarding brings a person into the organization securely; offboarding removes their access when they leave. Both apply to employees, contractors and staff moving between departments. They are administrative controls protecting confidentiality and integrity, and offboarding deserves the most study time, because one missed step leaves working access behind.

Onboarding, in order:
1. Background check where the role and law allow, before access is granted.
2. Sign the acceptable use policy (AUP) and, where needed, a non-disclosure agreement (NDA).
3. Create accounts with only the access the role needs (least privilege), approved by the data or system owner.
4. Issue equipment and a badge, recorded against the person.
5. Initial security awareness training before or soon after access starts.

Offboarding, in order:
1. Disable accounts at once (or at the planned exit time), before or as the person is told, because a departing person keeps whatever access is still open; access of someone being dismissed is cut immediately and they may be escorted out.
2. Revoke remote access, tokens, certificates and shared credentials they knew.
3. Collect laptops, phones, badges and keys.
4. Transfer ownership of their files and mailboxes to a manager.
5. Delete the accounts later, after data and encryption keys are recovered.
Disabling rather than deleting at once keeps encrypted files and keys recoverable. The common wrong order is collecting the laptop first and disabling accounts days later.

**Why it matters:** forgotten accounts of former staff (orphaned accounts) let ex-employees or attackers in with valid credentials, and a disgruntled leaver with access can sabotage systems or take data.

**Common confusions:** Offboarding is a procedure, not a technical control, even though it uses technical steps. Role changes need offboarding of the old access too, or privilege creep builds up.

**Scenario:** Two months after a contractor's project ended, their VPN account was used to copy files. The failed control is offboarding (timely deprovisioning). Account auditing is the closest wrong answer: a review would have found the account eventually, but the procedure that should have closed it on the last day was offboarding.

### Playbooks (security procedure)

A playbook is a written, step-by-step response to one specific type of security event, such as a phishing report, a ransomware alert or a lost laptop. It lets responders act quickly and the same way every time, and parts of it are often automated in a security orchestration, automation and response (SOAR) platform. It is an administrative control supporting detective and corrective work.

How a phishing playbook might run:
1. Trigger: a user reports a suspicious email or a filter flags one.
2. Analyze the headers, links and attachments in a safe sandbox, so nothing runs on a real machine.
3. Search all mailboxes for copies and remove them.
4. Block the sender domain and malicious links at the email and web gateways.
5. Identify users who clicked or entered credentials, then reset their passwords and revoke sessions.
6. Document the case and feed lessons into training.

**Why it matters:** during an incident people are stressed and time is short; a tested playbook cuts the time from alert to containment and avoids skipped steps.

**Common confusions:** A playbook covers one scenario; the incident response plan covers the overall process, roles and authority. A runbook is similar and is often more technical or fully automated; in this objective a playbook is the documented response procedure for one specific threat.

**Scenario:** The security operations center sees the same credential phishing attack several times a week, and each analyst handles it differently. The fix is a phishing playbook, ideally automated in SOAR. The incident response policy is the closest wrong answer: it sets authority and the lifecycle, not the specific steps for this one attack.

### External considerations: regulatory vs legal vs industry

External considerations are requirements that come from outside the organization and shape its security governance. The objective lists six; three are about the SOURCE of the requirement (regulatory, legal, industry) and three about its geographic REACH (see `### External considerations by scope: local/regional vs national vs global`).

| Source | Who sets it | How it is enforced | Examples |
|---|---|---|---|
| Regulatory | Government regulators and agencies | Inspections, fines, orders | Health data rules for US covered entities (HIPAA), financial reporting controls for US public companies (SOX), customer data safeguards at US financial institutions (GLBA) |
| Legal | Laws, courts and contracts | Lawsuits, liability, court orders | Breach notification laws, a legal hold during litigation, contract liability |
| Industry | Industry bodies and business partners | Contracts and compliance programs | The Payment Card Industry Data Security Standard (PCI DSS) |

Key points:
- PCI DSS is written by the PCI Security Standards Council and applies to every entity that stores, processes or transmits cardholder data; compliance programs are run by the payment card brands, not by a government, so it is an industry requirement, not a law.
- A legal hold suspends normal deletion of data that may be evidence, overriding the retention schedule.
- Data sovereignty is a legal factor: some countries require data about their people to stay inside their borders, which limits which cloud regions may be used. Breach notification deadlines differ by jurisdiction.

**Why it matters:** the organization must know every requirement that applies before it can design controls; missing one leads to fines, lawsuits or lost contracts.

**Common confusions:** Industry requirements can be just as binding as laws in practice, because a contract makes them binding. A regulation comes from a government body; a standard from an industry body.

**Scenario:** An online store must meet a set of controls to keep accepting credit cards, imposed through its agreement with its payment processor. That is an industry consideration. Regulatory is the closest wrong answer, because no government regulator issued the requirement.

### External considerations by scope: local/regional vs national vs global

These three external considerations describe how far a requirement reaches. An organization must meet every level that applies at the same time: a city or state rule, the national law and any law that reaches across borders. Which rules apply depends on where the organization operates AND where the people whose data it handles are located.

| Scope | Applies across | Examples |
|---|---|---|
| Local/regional | A city, state, province or region | The California Consumer Privacy Act (CCPA), state breach notification laws |
| National | A whole country | US health data rules (HIPAA), Canada's private sector privacy law (PIPEDA) |
| Global | Across borders, based on whose data is handled | The EU General Data Protection Regulation (GDPR) |

Key points:
- The CCPA, as amended by the California Privacy Rights Act (CPRA, approved by voters in 2020 and in effect since 2023), covers for-profit businesses that do business in California and meet a size or data-volume threshold; it gives residents rights such as knowing, deleting and correcting their data and opting out of its sale or sharing.
- A state or provincial law can be stricter than the national one, so national compliance alone is not enough.
- The GDPR reaches organizations outside the EU when they offer goods or services to people located in the EU, paid or free, or monitor their behavior there.
- Multinationals must reconcile rules that differ and sometimes conflict, for example on where data may be stored.

**Why it matters:** expanding to a new state or selling online to another country can bring new obligations overnight; ignoring them invites fines and blocked operations.

**Common confusions:** "Global" does not mean a worldwide law; it means a law whose reach crosses borders. Being headquartered outside the EU does not avoid the GDPR when the organization targets or monitors people in the EU. Merely holding a little data about someone who happens to live in the EU does not by itself trigger it.

**Scenario:** A small US company starts selling online to customers in France, shipping to their homes. The GDPR now applies to it: a global consideration. National is the closest wrong answer, because the requirement comes from another jurisdiction's law reaching across the border, not from the company's own country.

Privacy law at each level is treated again in `### Privacy legal implications: local/regional vs national vs global privacy law`.

### Monitoring and revision (governance documents)

Governance documents are not written once and filed. They are reviewed on a schedule, checked for whether they still work, and revised when something changes. This keeps policies, standards and procedures matched to current laws, threats, technology and the business. It is an administrative control and part of continuous improvement.

The cycle:
1. Set an owner and a review interval for every document, so reviews do not depend on memory.
2. Watch for triggers between reviews: a new law or regulation, an audit finding, an incident, new technology, a merger or a reorganization.
3. Measure effectiveness: audit results, incident data, exception counts and metrics show whether the document works.
4. Revise, get approval at the right level and keep version history.
5. Communicate the change and collect fresh acknowledgements from the people it applies to.
6. Retire documents that no longer apply, so staff do not follow outdated rules.

**Why it matters:** staff follow what is written; a document that describes retired tools or old laws leads them to do the wrong thing, and auditors flag documents that no longer match reality.

**Common confusions:** Monitoring here means watching whether the governance documents themselves are current and effective; it is not network monitoring. Revision is not only scheduled; an event can trigger it at any time. Policy reviews are part of the oversight work that a security framework expects leadership to do.

**Scenario:** After a breach, investigators find the remote access procedure still describes a VPN product retired two years earlier. The governance element that failed is monitoring and revision. Change management is the closest wrong answer: it controls changes to systems, while keeping the document current is the governance review cycle.

### Governance structures: boards and committees

Governance structures are the bodies that set direction for security and oversee it. A board of directors (or similar body) provides the top-level oversight; committees are smaller groups that focus on one area and do the detailed work. Under current frameworks, the organization's leaders carry the responsibility and accountability for cybersecurity risk.

| | Board | Committee |
|---|---|---|
| Level | Highest oversight | Below the board or executives |
| Members | Directors | Usually subject matter experts, sometimes with a board member |
| Job | Set strategy and risk appetite, hold executives accountable | Work out how to meet the goals, review details, recommend or decide |
| Examples | Board of directors, trustees | Security steering committee, audit committee, risk committee, change advisory board |

How they work together:
1. The board sets direction and the organization's appetite for risk.
2. Committees take that direction, study a topic in depth and propose decisions.
3. Results go back to the board or executives for approval.
4. The board reviews outcomes and adjusts strategy.

**Why it matters:** if nobody at the top owns cyber risk, security spending and priorities depend on whichever manager shouts loudest, and nobody answers for a breach.

**Common confusions:** The board does not run daily security operations; it oversees. The audit committee is a committee of the board that oversees audits (objective 5.5); it is different from a change advisory board, which approves system changes.

**Scenario:** A company wants a group of legal, IT, HR and finance experts to meet monthly, review security metrics and recommend priorities to the board. That is a committee (a security steering committee). The board is the closest wrong answer: it receives the recommendations and approves them, but does not do the detailed review.

### Government entities (governance structure)

Government entities are public bodies, such as agencies and departments, that govern security in two ways: for themselves, with formal structures set by law, and for others, as regulators and standard setters. Their decisions are shaped by legal, administrative and political concerns, and they answer to the public.

Characteristics:
1. Their authority comes from law, so their structures (who decides, who approves) are formal and often fixed.
2. Many of their meetings, decisions and records are open to the public.
3. They set rules for private organizations, as a regulator or as the author of a framework others adopt (for example, NIST publishes frameworks used by US federal agencies and adopted voluntarily by many private companies).
4. Budgets and priorities can change with elections or new laws.

**Why it matters:** a company that works with or for a government entity must meet its rules, and a government entity's own security choices can be slower because of public process.

**Common confusions:** A government entity as a governance structure is about how public bodies are organized; "regulatory" as an external consideration is about the rules a regulator imposes on you. A government agency can be both at once.

**Scenario:** A city IT department must publish its security program decisions in open meetings and follow purchasing rules set by law. That describes a government entity governance structure. A committee is the closest wrong answer: committees exist inside governments too, but the defining traits here (public accountability, legal authority) are those of a government entity.

### Centralized vs decentralized governance

These describe WHERE security decisions are made. In centralized governance one central group (often under the chief information security officer, CISO) sets and enforces security for the whole organization. In decentralized governance business units, regions or subsidiaries make their own security decisions within broad direction.

| | Centralized | Decentralized |
|---|---|---|
| Decisions made by | One central team | Each business unit or region |
| Strength | Consistent rules, easier to enforce and audit, economies of scale | Flexible, fast, fits local laws and needs |
| Weakness | Can be slow, a bottleneck, out of touch with local needs | Inconsistent controls, gaps, duplicated effort |
| Fits | Highly regulated, uniform operations | Diverse units, many countries, fast-moving business |

Many organizations use a hybrid: central policy and standards, with local teams choosing how to implement them and handling local law.

How to choose:
1. Look at how uniform the business is; identical branches favor central control.
2. Look at regulation; strict, uniform rules favor central enforcement.
3. Look at local differences in law and markets; large differences favor local decisions.
4. Decide which decisions stay central (policy, risk appetite) and which move out (tooling, local procedures).

**Why it matters:** the model decides how fast the organization can respond and how likely it is that one unit becomes the weak link an attacker uses to reach the rest.

**Common confusions:** Neither model is right in general; the fit depends on the organization. Decentralized does not mean no governance; units still answer to the board's direction. Centralized governance is about decision authority, not about where servers are located.

**Scenario:** A bank wants identical access rules and monitoring in all of its branches and one team that can prove it to regulators. Centralized governance fits. Decentralized is the closest wrong answer: it would let each branch choose its own controls, which is exactly the inconsistency the bank wants to avoid.

### Data roles: owner vs controller vs processor vs custodian vs steward

Each person or organization that touches data has a defined role, so accountability is clear. Owners and controllers DECIDE; processors, custodians and stewards CARRY OUT. These roles are administrative controls that protect confidentiality, integrity and availability by making someone answerable for each data set.

| Role | Decides or does | Typical holder | Example |
|---|---|---|---|
| Owner | Accountable; classifies data, approves access and protection | Senior business manager | Head of sales owns the customer list |
| Controller | Decides why and how personal data is processed (privacy law term) | The organization collecting the data | A retailer collecting shipping addresses |
| Processor | Processes personal data only on the controller's instructions | A service provider | A mailing house printing the retailer's labels |
| Custodian | Hands-on technical protection: access settings, backups, patching | IT or database administrator | The administrator who runs the customer database |
| Steward | Data quality, labels, metadata and correct use, within the owner's rules | Data governance analyst | Keeps customer records accurate and correctly labeled |

How they interact:
1. The owner classifies the data and sets the rules for its use.
2. The steward keeps the data accurate and correctly labeled under those rules.
3. The custodian implements the technical protections the owner requires.
4. Where personal data is involved, the controller decides purposes, and any processor acts only on its written instructions.

**Why it matters:** when a breach or an audit happens, the first question is who was accountable and who was supposed to do the work; unclear roles mean nobody fixed the problem.

**Common confusions:** The owner is accountable but not hands-on; the administrator is the custodian, not the owner. Controller and processor are privacy-law roles for personal data; owner and custodian apply to any data. The full privacy treatment is in `### Controller vs processor (privacy)`.

**Scenario:** A database administrator restores the payroll database each night and applies patches, but the head of HR decides who may see salaries. The administrator is the custodian; the head of HR is the owner. Calling the administrator the owner fails because the administrator does not decide classification or access.

### Data owner (system and data owner)

The data owner (also called the information owner) is the official with authority over a set of information who is responsible for deciding how it is classified, who may access it, and how it must be protected throughout its life, from creation to disposal. A system owner plays the same accountable role for a system. It is a governance role, not a technical one.

What the owner does:
1. Classifies the data (for example public, internal, confidential, restricted), because protection follows classification.
2. Sets the rules for appropriate use and protection.
3. Approves who gets access, and confirms access during periodic reviews.
4. Tells system owners and custodians what security controls the data needs.
5. Accepts risk for the data within the organization's appetite, or escalates.

**Why it matters:** without a named owner, access requests get approved by whoever happens to run the system, and nobody decides what "confidential" means for that data.

**Common confusions:** The owner is usually a senior business manager, not IT. Ownership inside the organization is about accountability; it does not give the organization unlimited rights over personal data, whose subjects keep legal rights (see `### Data ownership (privacy)`). An owner can delegate tasks to custodians and stewards but not the accountability.

**Scenario:** A marketing analyst asks for access to the full customer database. The person who should approve is the data owner for that database, typically the business leader responsible for customers. The database administrator is the closest wrong answer: the administrator grants the access technically once approved, as custodian, but does not decide.

### Data custodian and data steward

Both act for the data owner and neither sets policy, but they look after different things. The custodian handles the technical protection of the data day to day. The steward looks after the data's quality, meaning, labels and correct handling, and often checks that the owner's decisions are followed.

| | Custodian | Steward |
|---|---|---|
| Focus | Technical safekeeping | Quality and proper use |
| Tasks | Apply access rights, run backups, patch, encrypt, monitor | Maintain definitions and metadata, apply labels, fix data errors, check compliance with rules |
| Typical holder | System or database administrator | Data governance or business analyst |

How they work together:
1. The owner decides the data is confidential and only finance may read it.
2. The steward makes sure the data is labeled confidential and its fields are defined correctly.
3. The custodian sets the access permissions, encrypts the store and backs it up.
4. Both report problems to the owner.

**Why it matters:** clean labels and accurate data make controls such as data loss prevention work; technical safekeeping keeps the data available and protected.

**Common confusions:** Some sources describe the steward as also applying sensitivity labels and managing who gets access, always within rules the owner set; that does not make the steward the owner. Custodian and processor differ: a custodian protects data inside the organization, while a processor is usually an outside party processing personal data for a controller.

**Scenario:** Reports from the sales system show the same customer under three spellings, and some records lack a sensitivity label. The role to fix this is the data steward. The custodian is the closest wrong answer: the custodian keeps the system running and protected but is not responsible for data quality and labeling.

## 5.2 Explain the risk management process

Depth asked: explain. A good answer says what each step and term does, why it exists and how it connects to the next, and can work the loss formulas (SLE, ALE) with numbers.

### Risk management process (identify, assess, analyze, respond, monitor)

Risk management is the ongoing cycle of finding what could harm the organization, judging how likely and how bad it is, deciding what to do about it and watching it over time. Risk is the combination of how likely a harmful event is and how much harm it would cause. The process supports every leg of confidentiality, integrity and availability (CIA) and is led by governance (objective 5.1).

The steps, in order, with the reason for each:
1. Identify: list assets, threats and vulnerabilities, because you cannot treat a risk you have not found.
2. Assess: decide how likely each risk is and what its impact would be, so risks can be compared.
3. Analyze: put a size on each risk, either with ratings (qualitative) or with money and numbers (quantitative).
4. Record: enter each risk in the risk register with an owner, indicators and a threshold, so nothing is lost and someone is accountable.
5. Compare to appetite and tolerance: risks inside them may be accepted; risks outside them need action.
6. Respond: choose a strategy (transfer, accept, avoid or mitigate) and act.
7. Report: tell leaders and, where required, regulators what the risks are and how they are being treated.
8. Monitor and repeat: risks change, so track indicators and reassess.
The business impact analysis (BIA) runs alongside, setting recovery targets for critical functions.
The common wrong order is buying controls before identifying and analyzing risks, which spends money on the wrong problems.

**Why it matters:** risk management is how a limited security budget is spent where it reduces the most harm, and how leaders make informed decisions instead of guesses.

**Common confusions:** Risk assessment and risk analysis are used almost interchangeably in some sources; the SY0-701 objectives list assessment by how often it runs (ad hoc, recurring, one-time, continuous) and analysis by its method (qualitative or quantitative). Accepting a risk is a recorded decision; ignoring one is not a strategy.

**Scenario:** A company buys an expensive intrusion prevention system, then discovers its biggest exposure was unencrypted laptops. The step skipped was risk identification and analysis before choosing a response. Picking "mitigate" as the failed step is the closest wrong answer: the company did mitigate, just the wrong risk, because it never identified and ranked its risks.

### Risk identification

Risk identification is the first step of risk management: finding and describing the assets that matter, the threats that could harm them and the vulnerabilities those threats could use. Its output is a list of risk scenarios that feeds the risk register. It is an administrative activity.

How it is done:
1. List assets and their value (data, systems, people, facilities, services), because a risk is always to something.
2. List threats: attackers, insiders, natural events, failures, errors.
3. List vulnerabilities from scans, audits, penetration tests and configuration reviews.
4. Gather inputs from threat intelligence, past incidents, interviews with business owners and supplier information.
5. Write each risk as a cause and effect statement ("if X happens, then Y results"), so it can be assessed.
6. Add new risks whenever something changes (a new system, a new supplier, a new law).

**Why it matters:** every later step works only on the risks found here. A missed risk gets no owner, no budget and no control until it causes an incident.

**Common confusions:** Identification finds and names risks; it does not rate them (that is assessment and analysis). A vulnerability alone is not a risk; a risk needs a threat that could use the vulnerability and an asset that would suffer.

**Scenario:** Before moving payroll to a cloud service, a team interviews HR and finance, reviews the provider's documents and lists what could go wrong, such as an account takeover or a provider outage. That is risk identification. Risk analysis is the closest wrong answer: analysis would put ratings or dollar values on those scenarios, which has not happened yet.

Mini-example of a register line written at identification: "If an attacker phishes a payroll administrator's password, then they could change bank details and divert salaries."

### Risk assessment frequency: ad hoc vs recurring vs one-time vs continuous

A risk assessment evaluates identified risks for likelihood and impact so they can be prioritized. NIST SP 800-30 Revision 1 is the US federal guide for conducting them. The objective groups assessments by WHEN they happen.

| Type | When it runs | Trigger | Example |
|---|---|---|---|
| Ad hoc | As needed, unplanned | A specific event or question | A new zero-day is announced in the VPN product you run |
| Recurring | Repeated on a schedule | The calendar | An assessment every 3, 6 or 12 months, often required by policy or regulation |
| One-time | Once, for one purpose | A project or decision | Before a merger, or before buying a new system |
| Continuous | Always, usually automated | Ongoing monitoring | A cloud posture tool flags a storage bucket made public within minutes |

Details:
- "Ad hoc" means "for this": it is run for one purpose when the need appears.
- Continuous assessment relies on monitoring, scanning and metrics; a change process that includes a risk step for every change is also continuous.
- Recurring assessments can be run by an internal team without outside help.

**Why it matters:** risk changes between scheduled reviews; mixing a schedule with event-driven and automated assessment catches changes early.

**Common confusions:** Ad hoc reacts to an unexpected event; one-time is planned for a known project. Recurring is periodic; continuous never stops. A yearly audit is recurring even if it feels routine.

**Scenario:** A company assesses the risk of a new payment processor once, before signing the contract. That is one-time. Ad hoc is the closest wrong answer: ad hoc is triggered by an unplanned event, while this assessment is a planned step of a specific project.

### Qualitative vs quantitative risk analysis

Risk analysis puts a size on each risk so risks can be ranked and compared with the cost of controls. Qualitative analysis uses descriptive levels such as low, medium and high; quantitative analysis uses numbers and money. A middle form, semi-quantitative, uses scores or bins (1 to 5) whose meaning holds only inside that assessment.

| | Qualitative | Quantitative |
|---|---|---|
| Scale | Words or categories (low, medium, high) | Numbers and money (asset value, SLE, ARO, ALE) |
| Typical output | A heat map or risk matrix | Expected loss per event and per year |
| Speed | Fast | Slower, needs data |
| Strength | Easy to communicate, handles intangible harm such as reputation | Supports cost-benefit decisions on controls |
| Weakness | Subjective, hard to compare with prices | Only as good as the data and estimates |

How each is done:
1. Qualitative: rate likelihood and impact on a scale, combine them in a matrix, and rank the risks by the resulting level.
2. Quantitative: estimate the asset value, the share lost per event and how often the event happens per year, then compute single loss expectancy (SLE) and annualized loss expectancy (ALE). See `### Single loss expectancy (SLE) and exposure factor (EF)` and `### Annualized loss expectancy (ALE) and annualized rate of occurrence (ARO)`.
Many organizations start qualitative to find the top risks, then run quantitative analysis on the few that need a spending decision.

**Why it matters:** leaders approve budgets in money. A quantitative result lets the team show that a control costs less per year than the loss it prevents.

**Common confusions:** Anything with dollar figures is quantitative. A score of 1 to 5 looks numeric but is semi-quantitative or qualitative, because the numbers have no meaning outside that scale. Qualitative is not wrong or unprofessional; it is often the first pass.

**Scenario:** A risk committee rates "ransomware on file servers" as high likelihood and high impact on a five-by-five grid. That is qualitative analysis. Quantitative is the closest wrong answer: no money or measured frequency is involved, only ratings.

### Probability vs likelihood

Both describe how likely a risk event is, but in different forms. Probability is a measured numeric chance, usually from statistics or history, written as a percentage or decimal. Likelihood is usually a judged rating such as rare, possible or almost certain, used in qualitative risk matrices.

| | Probability | Likelihood |
|---|---|---|
| Form | Number (12% per year, 0.12) | Rating (rare, unlikely, possible, likely, almost certain) |
| Basis | Data, statistics, history | Expert judgment, sometimes informed by data |
| Used in | Quantitative analysis | Qualitative analysis, heat maps |

How they are used:
1. With good historical data (for example, how many laptops are lost per year), estimate a probability.
2. Without it, experts rate likelihood using defined descriptions so ratings are consistent.
3. Combine either one with impact to rank the risk: higher likelihood and higher impact means higher risk.

**Why it matters:** using the right form keeps the analysis honest. A precise-looking number with no data behind it misleads decision makers.

**Common confusions:** In everyday speech the two words mean the same, and some frameworks use "likelihood" for both; in this objective, probability points to numbers and likelihood to ratings. The annualized rate of occurrence (ARO) is a frequency per year, not a probability; it can be higher than 1.

**Scenario:** An analyst writes that a phishing-led account takeover is "likely" based on what peers in the industry report. That is likelihood. Probability is the closest wrong answer: it would require a numeric chance such as 30% per year.

### Impact (risk analysis)

Impact is the size of the harm if a risk event happens. Together with likelihood it decides how big a risk is. Impact can be financial, operational (downtime), legal and regulatory, life and safety, or reputational, and it can be expressed in money (quantitative) or as a rating (qualitative).

How impact is judged:
1. List what the event would affect: data, systems, processes, people.
2. Estimate each kind of harm: lost revenue, recovery cost, fines, contract penalties, harm to people, lost customers.
3. Consider time: harm often grows the longer an outage lasts (the business impact analysis measures this).
4. Rate or price the total, using the same scale as other risks so they can be compared.

Mini-example: a one-day outage of an order system might be priced as $80,000 of lost sales plus $10,000 of overtime (quantitative), or simply rated "high" on a five-level scale (qualitative).

**Why it matters:** two risks with the same likelihood can need very different responses because their impact differs; impact also sets recovery priorities.

**Common confusions:** Impact is the consequence, not the chance. Reputational damage is real impact even though it is hard to price, and it cannot be moved to an insurer. The exposure factor (EF) is impact expressed as a share of one asset's value in one event.

**Scenario:** Two servers have the same chance of failing, but one runs online sales and the other hosts an archive. The sales server's failure has the greater impact, so it gets the stronger controls. Saying likelihood decides it is the closest wrong answer: likelihood is equal here, so impact is what separates them.

### Single loss expectancy (SLE) and exposure factor (EF)

Single loss expectancy (SLE) is the expected money lost from ONE occurrence of a risk event. It is calculated from the asset value (AV) and the exposure factor (EF), which is the share of the asset's value lost in that one event, from 0 (no loss) to 1 (total loss).

Formula: SLE = AV x EF.

How to work it:
1. Find the asset value: replacement cost, revenue it supports, or the value the business assigns.
2. Estimate the exposure factor for this specific threat: a fire may destroy 60% of a server room (EF 0.6), a total theft 100% (EF 1.0).
3. Multiply.

Worked example: a warehouse system and its stock are valued at $400,000. A burst water pipe would ruin a quarter of it (EF 0.25). SLE = $400,000 x 0.25 = $100,000 per event.

Second example: a laptop worth $2,000 that is stolen is a total loss of the device (EF 1.0): SLE = $2,000, before counting the data on it, which a fuller analysis adds to the asset value.

**Why it matters:** SLE answers "how much does one bad day cost?", which is needed for the yearly figure and for sizing insurance or a control.

**Common confusions:** SLE is per event, not per year. The EF is a fraction of the asset value, not a probability of the event happening. Using EF as a percentage (25) instead of a fraction (0.25) is a common arithmetic slip.

**Scenario:** An analyst has an asset value, an exposure factor and how often the event happens per year, and must report the loss from a single event. Multiply asset value by exposure factor only. Multiplying by the yearly rate as well is the closest wrong answer: that gives the annualized loss expectancy, not the single loss.

### Annualized loss expectancy (ALE) and annualized rate of occurrence (ARO)

Annualized loss expectancy (ALE) is the money a risk is expected to cost per year. It combines the single loss expectancy (SLE, the loss from one event) with the annualized rate of occurrence (ARO, how many times the event is expected per year). ALE is the key number of quantitative risk analysis because it can be compared directly with the yearly cost of a control.

Formulas: ALE = SLE x ARO, which is the same as AV x EF x ARO (asset value times exposure factor times yearly rate).

Finding the ARO:
- Several times a year: use the count (four times a year means ARO 4).
- Once every N years: ARO = 1 / N (once every 20 years means 0.05).

How to use ALE for a control decision:
1. Compute the ALE without the control.
2. Compute the ALE with the control (the control lowers the EF, the ARO or both).
3. The difference is the yearly loss the control prevents.
4. If the control's yearly cost (purchase spread over its life plus running costs) is less than that difference, it is worth it; if it costs more, accepting or transferring the risk may be better.

Worked example: a regional office worth $600,000 would lose 50% of its value in a flood (EF 0.5), so SLE = $300,000. Floods hit once every 25 years, so ARO = 0.04. ALE = $300,000 x 0.04 = $12,000 per year. A flood barrier costing $4,000 a year that cuts the loss per flood to $100,000 brings the ALE to $4,000, saving $8,000 a year for $4,000: worth it. A barrier costing $15,000 a year would cost more than the whole ALE: not worth it.

**Why it matters:** ALE turns security spending into a business case leaders can approve or reject on numbers.

**Common confusions:** ARO can be below 1 or above 1; it is a frequency, not a probability. Do not multiply ALE by ARO again. ALE is an average over many years; in the year the flood happens the real loss is the full SLE.

**Scenario:** A control costs $20,000 a year and the risk it addresses has an ALE of $12,000. The sensible response is not to buy that control (accept or transfer instead, if within appetite). Mitigating anyway is the closest wrong answer: it would spend more each year than the loss it could ever prevent.

### Risk register

A risk register is the central record of an organization's risks and what is being done about them. It is a living document (or tool) that holds, for each risk, enough information to prioritize it, assign it and track it over time. It is also called a risk log. The objective names three of its parts: key risk indicators, risk owners and the risk threshold.

Typical columns:
1. ID and a short description, often written "if X happens, then Y results".
2. Category, so related risks can be grouped and compared across registers.
3. Likelihood, impact and the combined score (exposure or level of risk).
4. Priority.
5. Risk owner: the person accountable.
6. Key risk indicators (KRIs) and the threshold that triggers action.
7. Response type (transfer, accept, avoid, mitigate), its description and its cost.
8. Status and next steps, with dates.

How it is used:
1. New risks are added as they are identified.
2. Scores are updated after each assessment and when indicators change.
3. Leaders review the top risks and decide on responses.
4. Registers from departments are combined into an enterprise view for executives.

**Why it matters:** the register is the single source for risk reporting and audits. A risk that is not in it has no owner and no plan.

**Common confusions:** The register records risks; a vulnerability scan report records weaknesses on systems, which is only one input. Accepted risks stay in the register; acceptance is a recorded decision, reviewed later.

**Scenario:** An auditor asks for evidence that the company knows its top risks, who is responsible for each and how each is being handled. The document to show is the risk register. A business impact analysis is the closest wrong answer: it identifies critical functions and recovery targets, not every risk with its owner and response.

Mini-example of one row: "R-07 | If a supplier's support account is phished, an attacker could reach our servers | Third party | Likelihood high, impact high | Owner: IT operations director | KRI: supplier accounts without MFA, threshold 0 | Response: mitigate (require MFA, restrict hours) | Status: in progress, due next quarter."

### Key risk indicators (KRIs) vs key performance indicators (KPIs)

A key risk indicator (KRI) is a metric chosen because it gives early warning that a risk is growing or getting close to its limit, so action can be taken before an incident. A key performance indicator (KPI) measures how well a process or goal is being achieved. Executives pick a few risk indicators that best predict important risks and call them KRIs.

| | KRI | KPI |
|---|---|---|
| Measures | Rising risk | Performance against a goal |
| Looks | Forward (leading) | Usually at results achieved |
| Example | Count of internet-facing servers with critical unpatched flaws | Percentage of patches applied within the deadline |

How KRIs work:
1. Pick a metric linked to a specific risk in the register.
2. Set a threshold at which the metric demands action or escalation.
3. Collect it regularly, ideally automatically.
4. When it crosses the threshold, the risk owner acts and the register is updated.
Good KRIs lead: a rise in scanning of your external systems can warn of a coming attack, while an audit finding only tells you after the fact.

**Why it matters:** KRIs let leaders see risk moving before it turns into a loss, and show whether the organization is staying within its appetite.

**Common confusions:** A KRI is not the risk itself and not the threshold; it is the measurement compared to the threshold. KRIs can track good things too (share of critical systems with strong authentication) or bad things (number of severe customer outages in the last 90 days). A KPI can tell you a process is fast without telling you risk is low.

**Scenario:** The security team tracks the number of accounts with administrator rights each month and escalates if it rises above 25. The monthly count is a KRI and 25 is the risk threshold. Calling the count a KPI is the closest wrong answer: it is being used to warn about rising risk, not to measure how well a goal is met.

### Risk owner

A risk owner is the person accountable for a specific risk: making sure it is assessed, that the chosen response is carried out, and that it is monitored over time. Every risk in the risk register needs a named owner. The owner is usually a manager with the authority and budget to act, and may work with a risk manager who handles the day-to-day tracking.

What the owner does:
1. Confirms the risk description, likelihood and impact are right.
2. Chooses or proposes the response (transfer, accept, avoid, mitigate) within the appetite leadership set.
3. Makes sure the response is funded and carried out, often by other teams.
4. Watches the key risk indicators and acts when a threshold is crossed.
5. Formally accepts any residual risk, or escalates it if it is beyond their authority.

**Why it matters:** a risk with no owner is everybody's problem and therefore nobody's. Named ownership is what turns a register entry into action.

**Common confusions:** Ownership means accountability, not necessarily doing the technical work; the owner of a customer-data risk may be a business director while IT applies the controls. The risk owner and the data owner can be the same person but are different roles: one owns a risk, the other owns a data set. Accepting a risk is the owner's decision, documented, never a silent default.

**Scenario:** A risk register lists "ransomware disrupts order processing", but months later nothing has been done and each department says it belongs to another. The missing element is a risk owner. A key risk indicator is the closest wrong answer: an indicator would show the risk growing, but without an owner nobody is obliged to act on it.

### Risk appetite vs risk tolerance vs risk threshold

These three terms set how much risk is acceptable, at three levels of detail. Risk appetite is the broad amount and type of risk the organization is willing to take to reach its goals, set by the board and executives. Risk tolerance is the acceptable variation for a specific risk or objective: more concrete, often measurable, and the outer edge of what can be borne. A risk threshold is the specific trigger point at which a risk or indicator must be escalated or acted on.

| Term | Level | Who sets it | Example |
|---|---|---|---|
| Appetite | Whole organization, broad | Board and executives | "We take very little risk with customer payment data." |
| Tolerance | One risk or objective, specific | Executives and risk owners | "The order site may be offline at most 30 minutes a week." |
| Threshold | A trigger line on a metric | Risk owners | "Escalate when more than 10 critical findings are open over 30 days." |

How they connect:
1. Leaders state the appetite.
2. Tolerances translate it into limits for specific risks and objectives.
3. Thresholds put those limits onto key risk indicators so crossing them triggers action.
4. Risks inside tolerance may be accepted and monitored; risks outside it must be treated.
Leading frameworks expect appetite and tolerance statements to be written, communicated and kept current.

**Why it matters:** without stated limits, every team decides for itself how much risk is fine, and leaders cannot tell whether the organization is operating where they intended.

**Common confusions:** Appetite is an attitude about how much risk to pursue; tolerance is how much deviation can be absorbed for one thing. Frameworks word tolerance in different ways (the acceptable variation around an objective, or the readiness to bear the risk left after a response), and some older definitions use it almost as a synonym for appetite; frameworks that separate the two, such as NIST's guidance on enterprise risk, make tolerance the more specific one. The threshold is not the indicator; it is the value of the indicator that triggers action. In vulnerability management (objective 4.3) tolerance shows up as patch deadlines and exception rules.

**Scenario:** The board says the company will not risk its reputation for small cost savings, and the IT director turns that into "the customer portal may be unavailable at most four hours a month". The board statement is the appetite; the four-hour limit is a tolerance. Calling the four-hour limit the appetite is the closest wrong answer: it is a specific, measurable limit for one service, which is tolerance.

### Risk appetite postures: expansionary vs conservative vs neutral

The objective names three postures that describe an organization's risk appetite. The labels come from the objective; risk frameworks such as those from NIST describe appetite in written statements and do not define these three names. The posture explains which risk strategies the organization tends to choose.

| Posture | Attitude | Typical organizations | Typical choices |
|---|---|---|---|
| Expansionary | Accepts more risk in exchange for growth, speed or innovation | Startups, firms entering new markets | Launch early, accept more risks, fix later |
| Conservative | Avoids risk, prefers stability and safety even if growth is slower | Hospitals, banks, government, regulated sectors | Avoid or mitigate, strong controls before launch |
| Neutral | Balanced: takes a risk only when the expected benefit justifies it | Established firms in competitive but stable markets | Decides case by case with cost-benefit analysis |

How posture shows up:
1. In decisions about new products: an expansionary firm ships with known gaps; a conservative one waits.
2. In budgets: conservative firms spend more on controls relative to revenue.
3. In acceptance: expansionary firms accept more risks formally; conservative firms need higher approval for any acceptance.

**Why it matters:** security recommendations land better when they fit the posture; proposing slow, heavy controls to a startup racing to market will be rejected, while proposing to accept major risks at a hospital will be too.

**Common confusions:** Posture is about the whole organization's attitude, not one risk. Expansionary does not mean careless; risks are still recorded and owned. A posture can change: a startup that goes public often becomes more conservative.

**Scenario:** A fintech startup decides to release a feature quickly, accepting several medium risks in its register because winning customers first matters most. That is an expansionary appetite. Neutral is the closest wrong answer: a neutral posture would weigh each risk against its benefit, while this firm is deliberately leaning toward taking risk to grow.

### Risk management strategies: transfer vs accept vs avoid vs mitigate

Once a risk is analyzed and compared to tolerance, the organization chooses how to respond. There are four strategies for negative risks; several are often combined on one risk.

| Strategy | What it does | Effect on the risk | Example |
|---|---|---|---|
| Transfer (share) | Moves part of the consequences, usually financial, to another party | The money impact moves; accountability stays | Cyber insurance, a contract that makes a provider pay for its failures |
| Accept | Takes the risk as it is, with no further action except monitoring | Unchanged, but now a recorded decision | A low risk inside tolerance, or a control that would cost more than the loss |
| Avoid | Stops, or never starts, the activity that creates the risk | Removed, along with the activity's benefits | Stop storing card numbers; cancel a risky product feature |
| Mitigate (reduce) | Applies controls to lower likelihood or impact | Reduced; some residual risk remains | MFA, patching, backups, encryption |

How to choose:
1. Inside tolerance and cheap to live with: accept and monitor.
2. Outside tolerance and a cost-effective control exists: mitigate.
3. A large part of the harm is financial and insurable: transfer that part.
4. No cost-effective way to bring it within tolerance and the activity is not essential: avoid.
5. Whatever remains after mitigation (residual risk) is then accepted or transferred.
Accepting risk comes in two formal forms in this objective: `### Risk acceptance: exemption vs exception`.

**Why it matters:** the strategy decides where the money goes. Choosing avoid can kill a profitable activity; choosing accept without analysis leaves the organization exposed.

**Common confusions:** Paying someone else to carry the risk is transfer; stopping the activity is avoid. Outsourcing a task does not outsource accountability for the data. Accepting is a documented, approved decision by the risk owner; doing nothing without a decision is not acceptance.

**Scenario:** A company's "save my card for next time" feature would require storing card numbers, so leadership removes the feature entirely and customers type their card each time. That is avoid. Transfer is the closest wrong answer: transfer would keep the activity and shift the cost of a loss to an insurer or partner, while here the risky activity no longer exists.

### Risk transfer (cyber insurance)

Risk transfer shifts some of the consequences of a risk, mostly the financial ones, to another party. The classic example is cyber insurance; contracts that make a supplier liable for its failures and outsourcing under such contracts are others. Transfer is also called sharing.

How it is used:
1. Analyze the risk and its expected loss (SLE and ALE) so you know how much cover you need.
2. Reduce the risk first where controls are cheap, so less needs to be transferred.
3. Buy cover or sign a contract that assigns the financial loss to the other party.
4. Read what the cover excludes and caps, and record the residual risk the transfer does not cover.
5. Keep the risk in the register with its owner, because the transfer changes who pays, not who answers for it.

**Why it matters:** transfer turns an unpredictable large loss into a predictable yearly cost, protecting cash flow after an incident.

**Common confusions:** Insurance moves money, not responsibility: the organization remains accountable to customers and regulators, and loss of customer trust cannot be transferred. Transfer is not avoid: the activity continues.

**Scenario:** After a breach, a company's insurer pays for forensic investigators and notification letters, but regulators still investigate the company and customers leave. The insurance was transfer; it covered costs but not accountability or reputational harm. Thinking the company avoided the risk is the closest wrong answer: the activity continued and the event still happened.

### Risk acceptance: exemption vs exception

Acceptance means taking a risk as it is. The objective lists two formal kinds, which both release a case from meeting a rule and must be documented, approved and reviewed. The deciding difference is SCOPE: an exemption says the rule does not apply to this case; an exception says the rule still applies but a deviation is allowed for now.

| | Exemption | Exception |
|---|---|---|
| The rule | Does not apply to this case | Still applies |
| Typical length | Ongoing, reviewed periodically | Temporary, with an end date |
| Typical reason | The requirement cannot be met at all | The requirement could be met but clashes with a business need right now |
| Usual conditions | Isolation, monitoring | Compensating controls and an expiry date |
| Example | A lab instrument whose vendor forbids patching is exempted from the patch standard and kept on an isolated network | A server that runs a critical application may delay a patch for 60 days while the vendor certifies it, with extra firewall rules meanwhile |

How either is handled:
1. The system owner requests it in writing with the reason.
2. The risk is assessed, and compensating controls are proposed (a control used instead of the required one that gives comparable protection).
3. The risk owner or a higher authority approves it within the risk appetite.
4. It is recorded in the risk register with a review or expiry date.
5. It is reviewed on that date and closed, renewed or escalated.

**Why it matters:** real systems cannot always meet every rule; a formal process keeps those gaps visible and limited instead of hidden.

**Common confusions:** No public standard defines this pair, and many organizations call every approved deviation an exception (usually with an expiry date); the split used here is one consistent way to use the two words, and an organization's own policy definitions win where they differ. Duration helps but is not the test; the test is whether the rule still applies. An approved exception is not a violation; an unapproved deviation is. Both are forms of acceptance, not mitigation, even when compensating controls are added.

**Scenario:** A payroll server cannot take this month's operating system update because it breaks the payroll software; the team is allowed to wait until the vendor's fix next quarter, with the server moved behind stricter firewall rules. That is an exception. Exemption is the closest wrong answer: the patch requirement still applies to the server and will be met later.

### Inherent risk vs residual risk

Inherent risk is the risk as it would be with no management action to reduce it. Residual risk is what remains after controls and other responses are in place. Risk is never zero, so some residual risk always remains.

| | Inherent risk | Residual risk |
|---|---|---|
| When | Before controls | After controls and responses |
| Used for | Showing how big the problem is without action | Deciding whether more action is needed |
| Next step | Choose a response | Accept it if within appetite, or add controls or transfer |

How they are used:
1. Rate the inherent risk (likelihood and impact without controls).
2. Apply responses, usually mitigation.
3. Rate the residual risk with the same method, so the two can be compared.
4. If residual risk is within tolerance, the risk owner accepts it; if not, add controls, transfer part of it, or avoid the activity.

Worked example: inherent risk of ransomware on file servers is rated high/high. After offline backups, endpoint detection and MFA, likelihood is medium and impact is low, so residual risk is medium-low, inside tolerance; the owner accepts it and monitors.

**Why it matters:** the residual figure shows leaders what they are actually living with after spending money on controls, and whether that spend was enough.

**Common confusions:** Some frameworks prefer "current risk" because real systems rarely have zero controls. Insurance changes who pays, so it lowers the organization's financial exposure but does not lower the likelihood of the event.

**Scenario:** After installing a web application firewall, the team re-rates the web server risk to decide whether the board must approve further spending. They are measuring residual risk. Inherent risk is the closest wrong answer: it describes the risk before the firewall existed.

### Risk reporting

Risk reporting communicates the organization's risks, how they are changing and how they are being treated, to the people who must decide or oversee: executives, the board, risk owners and, where required, regulators. It is usually built from the risk register and is part of the governance oversight cycle.

How a useful report is built:
1. Know the audience: the board wants the top risks, business impact and whether the organization is within its appetite; technical teams want details of findings and fixes.
2. Pull current data from the register: scores, owners, key risk indicators (KRIs) against thresholds, response status.
3. Show trends, not only a snapshot: is each top risk rising or falling?
4. Highlight decisions needed: risks outside tolerance, exceptions about to expire, budget requests.
5. Report on a set schedule and also on events (a major incident or a new regulation).

**Why it matters:** leaders cannot accept, fund or avoid risks they never hear about. Clear reporting also proves to auditors and regulators that leadership oversees cyber risk.

**Common confusions:** Risk reporting is about risk status for decision makers; compliance reporting (objective 5.4) shows whether the organization meets specific requirements. A dashboard of scan counts is raw data; a risk report explains what it means for the business.

**Scenario:** The CISO prepares a quarterly one-page summary for the board showing the five largest risks, which are outside tolerance, and the funding needed to fix them. That is risk reporting. A risk register is the closest wrong answer: the register holds every risk in detail; the board summary is the report built from it.

### Business impact analysis (BIA)

A business impact analysis (BIA) studies the organization's business functions and how a disruption would affect each one over time. It identifies which functions are critical, what they depend on, and how fast and how completely they must be recovered. Its targets drive business continuity and disaster recovery planning. It supports availability.

Steps:
1. List business functions and processes, with their owners.
2. Find dependencies for each: systems, data, people, suppliers, facilities.
3. Estimate the impact of an outage at different lengths (one hour, one day, one week): lost revenue, penalties, safety, legal duties, reputation.
4. Find the maximum tolerable downtime (MTD): how long the function can be disrupted before the harm becomes serious.
5. Set recovery targets: a recovery time objective (RTO) shorter than the MTD, and a recovery point objective (RPO) for data.
6. Use reliability figures such as mean time to repair (MTTR) and mean time between failures (MTBF) to check the targets are realistic.
7. Rank functions so the most critical are restored first.

**Why it matters:** without a BIA, recovery money goes to whichever system is loudest, and the truly critical function may wait behind a nice-to-have one.

**Common confusions:** A BIA measures the impact of losing functions; a risk assessment measures the likelihood and impact of threats. The BIA sets targets; the continuity and recovery plans meet them. RTO and RPO are outputs of the BIA, not of the backup software.

**Scenario:** Before writing a disaster recovery plan, a company interviews each department to learn how long it can survive without its systems and how much recent data it can afford to lose. That is a business impact analysis. A risk assessment is the closest wrong answer: it would focus on which threats are likely, not on how long each function can be down.

### Recovery time objective (RTO) vs recovery point objective (RPO)

Both are recovery targets set in the business impact analysis. The recovery time objective (RTO) is the longest a system or process may stay down in recovery before the harm to the business becomes unacceptable: it looks FORWARD from the outage to "back up and running". The recovery point objective (RPO) is the point in time to which data must be recovered: it looks BACKWARD from the outage and sets the most data, measured in time, the business can afford to lose.

| | RTO | RPO |
|---|---|---|
| Measures | Downtime allowed | Data loss allowed, as time |
| Direction | Forward from the outage | Backward from the outage |
| Drives | Recovery site type, failover, staffing | Backup and replication frequency |
| Shorter target means | Faster (costlier) recovery options such as a hot site | More frequent backups or real-time replication |

How they are set and met:
1. The BIA finds the maximum tolerable downtime (MTD); the RTO is set below it, leaving room for the business to restart.
2. The business decides how much recent data it could re-create or lose; that sets the RPO.
3. IT chooses recovery methods that meet both: backups at least as often as the RPO, recovery sites and runbooks fast enough for the RTO.
4. Tests prove the targets can be met.

Worked example: an order system has an RTO of 4 hours and an RPO of 15 minutes. Nightly backups fail the RPO (up to 24 hours of orders could be lost), so the team adds replication every 15 minutes or faster, and keeps a warm standby that can take over within 4 hours.

**Why it matters:** RTO and RPO turn "we need to recover fast" into numbers that decide the recovery budget.

**Common confusions:** RPO is not about how long recovery takes. A backup every 4 hours meets an RPO of 4 hours or longer, not a shorter one. Memory aid: RTO is TIME to come back; RPO is the POINT you go back to.

**Scenario:** A hospital says it can lose at most 10 minutes of patient record updates. That figure is the RPO. RTO is the closest wrong answer: RTO would say how quickly the system must be running again, not how much recent data may be lost.

### Mean time to repair (MTTR) vs mean time between failures (MTBF) vs mean time to failure (MTTF)

These reliability measures describe how often things break and how fast they are fixed. The business impact analysis uses them to check that recovery targets are realistic. Mean time between failures (MTBF) is the average operating time between one failure and the next for an item that is repaired. Mean time to failure (MTTF) is the average time until failure for an item that is replaced, not repaired. Mean time to repair (MTTR) is the average time to fix a failed item and return it to service; the SY0-701 acronym list expands MTTR as mean time to recover, and both mean getting the failed item back in service.

| Measure | For | Better when | Simple calculation |
|---|---|---|---|
| MTBF | Repairable items | Higher | Total operating time / number of failures |
| MTTF | Non-repairable items | Higher | Average time to failure across many units |
| MTTR | Repairs | Lower | Total repair time / number of repairs |

Worked example: a server ran 2,000 hours in a year and failed 4 times, so MTBF = 2,000 / 4 = 500 hours. The 4 repairs took 2, 3, 1 and 2 hours, so MTTR = 8 / 4 = 2 hours. Inherent availability (the equipment itself, ignoring delays such as waiting for parts) is MTBF / (MTBF + MTTR) = 500 / 502, about 99.6%.

How they are used:
1. Compare MTTR with the RTO: if repairs take longer on average than the RTO allows, add spares, a standby system or a faster support contract.
2. Use MTBF or MTTF to plan replacements and redundancy before failures are expected.
3. Track them over time; falling MTBF signals aging equipment.

**Why it matters:** these figures show whether the recovery promises in the BIA can actually be kept, and where redundancy money is best spent.

**Common confusions:** MTBF is for repairable items; MTTF for items thrown away. A fleet average is not a promise for one unit: a drive rated for a very high MTTF can still fail in its first month. Higher MTBF is good; higher MTTR is bad.

**Scenario:** Spare power supplies are kept on site so a failed one is swapped in minutes instead of waiting days for a delivery. The measure this improves is MTTR. MTBF is the closest wrong answer: the power supplies fail just as often as before; only the repair time shrinks.

## 5.3 Explain third-party risk assessment and management

Depth asked: explain. A good answer says what each vendor check, agreement or process is for, when it is used and how it differs from its look-alikes, especially the agreement types.

### Third-party (vendor) risk management lifecycle

Third-party risk management controls the risk that comes from suppliers, service providers and partners. A vendor that holds your data, connects to your network or supplies your software extends your attack surface: its weaknesses become yours. Current frameworks expect supply chain risk to be part of governance from before a contract is signed until after it ends.

The lifecycle, in order:
1. Know your suppliers and rank them by how critical they are and how much data or access they get, so effort goes where risk is highest.
2. Assess the vendor's security (questionnaires, evidence of audits, independent assessments, penetration tests, supply chain analysis).
3. Select with due diligence and a check for conflicts of interest.
4. Contract: put security requirements, a right-to-audit clause, breach notification duties, service levels and confidentiality into the agreements.
5. Monitor during the relationship: service levels, new audit reports, incidents, financial health; reassess higher-risk vendors more often.
6. Include key suppliers in incident response planning and exercises.
7. End the relationship safely: revoke access, get data returned or destroyed, confirm in writing.
The common wrong order is signing first and assessing later, which removes the leverage to demand fixes or audit rights.

**Why it matters:** supply chain compromises reach many victims through one supplier, and regulators hold the organization accountable for data it hands to vendors.

**Common confusions:** Outsourcing a function does not outsource accountability. Vendor assessment is not one-time; risk changes during the contract. Third parties include partners and contractors, not only paid software vendors.

**Scenario:** A company discovers that a former marketing agency still has an active login to its customer portal a year after the contract ended. The missing lifecycle step is offboarding the vendor at contract end. Vendor selection is the closest wrong answer: the agency may have been a good choice, but the relationship was never closed down.

### Vendor assessment methods compared

Vendor assessment evaluates a supplier's security before and during the relationship. The objective lists five methods, which differ in who does the checking and how independent and deep it is.

| Method | Who checks | Independence | What it gives you |
|---|---|---|---|
| Evidence of internal audits | The vendor, about itself | Low | The vendor's own audit reports and proof findings were fixed |
| Independent assessments | An impartial outside party | High | A SOC 2 report, an ISO 27001 certificate, a third-party audit |
| Right-to-audit clause | You, or an auditor you choose | High, and under your control | The contractual power to inspect controls, records or facilities |
| Penetration testing | You (with permission) or a firm the vendor hires | Varies | Proof of what an attacker could actually do |
| Supply chain analysis | You | Depends on the data | A view of the vendor's own suppliers and components |

How to combine them:
1. Start with a questionnaire for every vendor, because it scales.
2. For higher-risk vendors, ask for evidence of internal audits and, better, an independent assessment.
3. For the most critical vendors, negotiate a right-to-audit clause and pen test rights or results.
4. Look past the vendor to its own suppliers and software components.
More independence costs more but deserves more trust.

**Why it matters:** a vendor's claims are not proof; matching the depth of checking to the vendor's risk keeps cost reasonable while catching the dangerous ones.

**Common confusions:** Independent assessments carry more weight than the vendor's own audit results because the assessor has no stake in the outcome. A right-to-audit clause gives you power to check; it is not itself an audit. Each method has its own section in this objective.

**Scenario:** A cloud provider sends a report written by an outside audit firm stating its controls operated effectively over the past year. That is an independent assessment. Evidence of internal audits is the closest wrong answer: those reports are produced by the vendor's own staff.

### Right-to-audit clause

A right-to-audit clause is a contract term that gives the customer the right to audit the vendor's security controls, records or facilities, or to send an independent auditor to do it. It is negotiated into the contract before signing, because a vendor rarely agrees to it afterward. It is an administrative, detective control.

What a good clause covers:
1. Who may audit: the customer, a named third-party auditor, or both.
2. What may be examined: controls, logs, policies, facilities, subcontractors.
3. When: notice period, how often, and the right to audit after an incident.
4. Who pays, and how findings must be fixed and by when.
5. Confidentiality of what auditors see.
Typical audit focus areas include access management, offboarding of the vendor's staff, how passwords are stored and remote access.

**Why it matters:** it replaces trust in the vendor's word with the ability to verify, which matters most for vendors holding sensitive data or with network access. Data protection law also expects controllers to be able to audit their processors.

**Common confusions:** The clause gives the right; the audit is a separate event. A right-to-audit clause is different from receiving the vendor's SOC 2 report: the report is someone else's audit, chosen by the vendor. Audits should recur during a long relationship, not happen once.

**Scenario:** After a breach at a payroll provider, a customer wants to send its own team to check how the provider controls administrator access, and the provider refuses. The clause that would have prevented the refusal is a right-to-audit clause. A non-disclosure agreement is the closest wrong answer: it protects shared secrets but gives no right to inspect the vendor.

### Evidence of internal audits vs independent assessments

Both are ways to learn how a vendor's controls are doing without testing them yourself. Evidence of internal audits is documentation of the vendor checking itself: internal audit reports, findings and how they were fixed. Independent assessments are reviews by an impartial outside party, such as a System and Organization Controls (SOC) 2 report or an ISO/IEC 27001 certification.

| | Evidence of internal audits | Independent assessments |
|---|---|---|
| Performed by | The vendor's own staff | An outside firm with no stake in the result |
| Credibility | Lower; the vendor grades itself | Higher |
| Strength | Shows the vendor has an audit habit and fixes findings | Objective opinion; outsiders spot blind spots insiders miss |
| Example | An internal audit memo and remediation tracker | A SOC 2 Type II report, an ISO 27001 certificate |

How to read them:
1. Check the scope: does the report cover the service you buy?
2. Check the date and period: a stale report says little about today.
3. Read the findings and exceptions, not just the summary.
4. Check remediation: were findings fixed, and how fast?
5. Ask for a newer report or an update when the covered period ended long ago.

**Why it matters:** these let you assess many vendors at a reasonable cost, as long as you understand how much each kind of evidence can be trusted.

**Common confusions:** An ISO 27001 certificate shows a management system meeting the standard; it does not prove every control is effective for your service. A SOC 2 Type II covers a period; a Type I covers design at one date (see `### SOC reports: SOC 1 vs SOC 2 vs SOC 3, Type I vs Type II`).

**Scenario:** A vendor sends a spreadsheet of findings from its own audit team, showing each fixed within 30 days. That is evidence of internal audits. Independent assessment is the closest wrong answer: no outside party was involved.

### Penetration testing of a vendor (vendor assessment)

As a vendor assessment method, penetration testing means checking a supplier's systems, product or service by simulating real attacks, either by testing it yourself with the vendor's written permission or by reviewing the results of tests the vendor commissioned. It shows what an attacker could actually do, not just what the vendor claims.

How it is done:
1. Get written permission from the vendor, and from any cloud host involved, because testing systems you do not own without consent is unauthorized access.
2. Agree rules of engagement: scope, timing, allowed techniques, contacts and how found data is handled.
3. Test, or receive the vendor's third-party test report and its remediation status.
4. Track the vendor's fixes to agreed deadlines.
5. Repeat at an interval the contract sets (for example yearly, or after major changes).
Often the vendor shares a summary of an independent test it commissioned instead of allowing customer testing.

**Why it matters:** a vendor product deployed inside your network, or a service holding your data, can be the attacker's way in; testing finds exploitable flaws before an attacker does.

**Common confusions:** This is pen testing as a vendor check; the kinds of pen test (known, partially known, unknown environment; red, blue, purple teams) are covered in objective 5.5. A vulnerability scan only lists possible weaknesses; a pen test tries to exploit them. The contract, not goodwill, should give the right to test or to see results.

**Scenario:** A hospital plans to install a vendor's patient monitoring gateway on its network and wants proof it cannot be used to reach other systems. It arranges, with the vendor's written agreement, for a security firm to attack a test unit. That is penetration testing as vendor assessment. A security questionnaire is the closest wrong answer: it would collect the vendor's own answers instead of testing what an attacker could actually do.

### Supply chain analysis (software bill of materials, SBOM)

Supply chain analysis looks past a vendor to its own suppliers and components (hardware, software libraries, services) to find risk that enters through them. Your vendor's vendors are also your risk. Supply chain risk management aims to find weaknesses and threats anywhere from manufacture to disposal and to plan how to reduce them.

What it examines:
1. Software components, using a software bill of materials (SBOM): a nested inventory, like a list of ingredients, of the components inside a software product, so known-vulnerable parts can be found.
2. Where hardware is designed and made, and whether parts could be counterfeit or tampered with.
3. The vendor's own critical subcontractors (hosting, support, development).
4. How the vendor builds, signs and ships updates, since a compromised build process poisons every customer.
5. Single points of failure: a supplier whose outage stops you.

The classic case: in the SolarWinds Orion compromise (CISA advisory December 2020; activity since at least March 2020), attackers inserted malicious code into the vendor's software build process. The tampered component was signed with the vendor's legitimate code-signing certificate and shipped in official versions of the product, so it reached customers, including US government agencies, through the vendor's own trusted channel.

**Why it matters:** one compromised supplier can reach many organizations at once, and a signed update from a trusted vendor passes most defenses.

**Common confusions:** A code signature proves who signed and that nothing changed since; it does not prove the code was safe when signed. Supply chain analysis is wider than vendor assessment: it covers the components and suppliers behind the vendor.

**Scenario:** A new critical vulnerability is announced in a widely used logging library, and a company must find out which of its purchased products contain it. The tool that answers fastest is each vendor's SBOM. A right-to-audit clause is the closest wrong answer: an audit could eventually find it, but the SBOM already lists the components.

### Vendor due diligence (vendor selection)

Due diligence in vendor selection is investigating a potential vendor before signing, to confirm it can be trusted with your data, systems or business. It is the "do your homework" step and shows the organization acted responsibly. Current frameworks expect planning and due diligence to reduce risk before any formal supplier relationship begins.

What it covers:
1. Security practices: policies, certifications, audit reports, breach history.
2. Financial health, because a vendor that goes bankrupt can strand your data.
3. Reputation and references from other customers.
4. Legal and compliance status: lawsuits, regulatory actions, where data will be stored.
5. Verification of the vendor's claims (revenue, customer numbers, certifications).
6. Background checks and interviews with key staff where the role justifies it.
7. A conflict-of-interest check (see `### Conflict of interest (vendor selection)`).

**Why it matters:** problems found before signing can be fixed in the contract or avoided by choosing another vendor; after signing, leverage is gone.

**Common confusions:** Due diligence is investigation before the decision; due care (objective 5.4) is the ongoing action taken to protect. Due diligence is not only security: finances and legal standing count too. Some sources use "due diligence" mostly for checks on third parties and "due care" for actions inside the organization.

**Scenario:** Before choosing a new backup provider, a company checks its financial statements, asks for its audit report, calls two reference customers and searches news for past breaches. That is due diligence. Vendor monitoring is the closest wrong answer: monitoring happens after the contract is signed.

### Conflict of interest (vendor selection)

A conflict of interest exists when someone involved in choosing or overseeing a vendor has a personal, financial or other interest that could bias the decision. It must be disclosed and managed, usually by removing the person from the decision. The same idea applies to auditors, who must be independent of what they audit.

How it is handled:
1. Require everyone involved in a selection to declare relevant interests (shares, family ties, past employment, gifts) before evaluating bids.
2. Remove anyone with a conflict from scoring and approval.
3. Use documented, objective selection criteria so the decision can be reviewed later.
4. Record the declarations and decisions.

Conflicts can sit on the vendor side too: a vendor that also serves your largest competitor, one that employs an executive's relative, or one offering gifts or favors for signing.

**Why it matters:** a biased choice can lock the organization into a weaker or insecure vendor, and it undermines trust in every later decision the same people make.

**Common confusions:** Having a conflict is not wrongdoing by itself; hiding it or letting it decide the outcome is. A conflict of interest is a selection and independence issue; it is different from a confidentiality issue covered by a non-disclosure agreement.

**Scenario:** The manager leading a software selection owns shares in one of the bidders and does not mention it, and that bidder wins despite weaker security answers. The problem is an undisclosed conflict of interest. Lack of due diligence is the closest wrong answer: the research may have been done; the issue is that a biased person made the decision.

### Agreement types compared: SLA vs MOU vs MOA vs MSA vs SOW vs NDA vs BPA

Third-party relationships are set out in agreements, and each type fits a different situation. The decisive question is what the document is FOR: service levels, intent to cooperate, umbrella terms, one specific job, secrecy, or a partnership.

| Agreement | Decisive purpose | Binding? | Typical clue |
|---|---|---|---|
| Service-level agreement (SLA) | Measurable service levels and remedies | Usually part of a contract | "99.9% uptime", "respond within 1 hour", service credits |
| Memorandum of understanding (MOU) | Statement of intent to work together | Usually not | "The parties intend to cooperate on..." |
| Memorandum of agreement (MOA) | Cooperation with each party's responsibilities, often including who pays for what | More formal than an MOU; can be binding | "Agency A will provide X; agency B will fund Y" |
| Master service agreement (MSA) | Umbrella terms for an ongoing relationship | Contract | Payment, liability, confidentiality for all future work |
| Work order / statement of work (WO/SOW) | Scope, deliverables, timeline and price of one job, under an MSA | Contract | "Phase 2 assessment, 3 weeks, these deliverables" |
| Non-disclosure agreement (NDA) | Keep shared information confidential | Contract | Testers or bidders receive sensitive diagrams |
| Business partners agreement (BPA) | How partners run a joint business: duties, profit and loss, decisions, shared data | Contract | Two firms jointly sell a product |

Ways to tell them apart:
1. Numbers about service quality: SLA.
2. Cooperation without money or hard duties: MOU; with defined duties and money: MOA.
3. General terms meant to cover many future projects: MSA; one project's details: SOW or work order.
4. Secrecy: NDA.
5. Sharing profits, losses and decisions in a joint venture: BPA.

**Why it matters:** the agreement decides what you can enforce. A promise in an MOU usually cannot be enforced; the same promise in an SLA comes with remedies.

**Common confusions:** An SLA is about measurable service, not secrecy (NDA) or project scope (SOW). An MOU is weaker than an MOA. An SOW sits under an MSA; it does not replace it. Several agreements are often signed together: an MSA, an SOW, an NDA and an SLA for one provider.

**Scenario:** Two universities agree in writing that one will host shared research servers and the other will pay half the running costs, with each side's duties listed. That is an MOA. An MOU is the closest wrong answer: an MOU would state intent to cooperate without setting out these specific responsibilities and costs.

### Service-level agreement (SLA)

A service-level agreement (SLA) is a commitment between a service provider and its customers that defines the service, the expected performance in measurable terms, the responsibilities of each side, and what happens when targets are missed. An SLA usually sits inside a formal contract. For security they matter most for availability.

What an SLA usually defines:
1. The service and what is excluded.
2. Measurable targets: availability (uptime percentage), response time to incidents, time to resolve, support hours.
3. How performance is measured and reported, and by whom.
4. Remedies when targets are missed: service credits, penalties, the right to end the contract.
5. Responsibilities of both sides, and how the agreement is reviewed and terminated.

Worked example: an SLA promises 99.9% monthly availability. In a 30-day month (43,200 minutes), that allows about 43 minutes of downtime; three hours of outage misses the target and triggers the agreed service credit.

**Why it matters:** the SLA is how the customer holds a provider to its promises, and it must match the customer's own recovery targets; an SLA that allows a day of downtime cannot support a four-hour recovery time objective (RTO).

**Common confusions:** An SLA sets service levels; it does not by itself keep information secret (NDA) or define a project (SOW). Service credits rarely cover the customer's real losses, so an SLA does not remove the need for continuity planning. SLAs can also exist internally, between IT and business units.

**Scenario:** A company's cloud email is down for most of a working day, and it wants compensation and a commitment that outages will be shorter. The document that defines this is the SLA. A master service agreement is the closest wrong answer: it sets general terms such as liability and payment, while the measurable uptime promise and its credits are in the SLA.

### Memorandum of understanding (MOU) vs memorandum of agreement (MOA)

Both record cooperation between two or more parties, often public bodies, and both are common where systems or information are shared. A memorandum of understanding (MOU) states the parties' intent to work together: goals, purpose and general terms. It is usually not legally binding. A memorandum of agreement (MOA) is more formal and specific: it sets out each party's responsibilities and is most often used to cover financial responsibilities between the parties.

| | MOU | MOA |
|---|---|---|
| Nature | Statement of intent, shared understanding | Agreement on specific responsibilities and conditions |
| Binding | Usually not | Can be |
| Money | Usually no payment involved | Often covers who pays for what |
| Detail | Goals and general terms | Duties, conditions, financial terms, dates |

For an information exchange, these memoranda typically cover the purpose, each organization's authority and duties, terms for acceptable use of the information, financial responsibilities and when the exchange is reviewed or ended. They do not contain the technical security details of the connection, which go in an interconnection security agreement (ISA).

**Why it matters:** an MOU is a fast way to start cooperation, but it gives little to enforce; when money or firm duties are involved, an MOA or a contract is needed.

**Common confusions:** Neither is a full commercial contract like an MSA. An MOU often comes first and is later replaced by an MOA or a contract. Some sources treat the two together as one "MOU/A" document.

**Scenario:** Two city agencies sign a short document saying they intend to share threat information with each other, with no money involved and no fixed duties. That is an MOU. An MOA is the closest wrong answer: it would set out specific responsibilities and, often, who pays.

### Master service agreement (MSA) vs work order / statement of work (WO/SOW)

These two contracts work as a pair. A master service agreement (MSA) is the umbrella contract that sets the general legal and commercial terms for a long relationship covering many projects. A statement of work (SOW), or a work order (WO), defines one specific job under those terms.

| | MSA | SOW / work order |
|---|---|---|
| Covers | The whole relationship | One project or task |
| Contains | Payment terms, liability, confidentiality, termination, dispute handling | Scope, deliverables, responsibilities, timeline, location, price, how changes affect price and dates |
| Lifetime | Long | As long as the job |
| How many | One per relationship | One per project, each referring to the MSA |

How they are used:
1. Negotiate the MSA once, so legal terms are not argued again for every project.
2. For each job, write an SOW that points to the MSA and adds the project details.
3. Change the project through a documented change to the SOW, so scope does not creep.
4. Close each SOW when its deliverables are accepted; the MSA stays in force.

**Why it matters:** the pair lets work start quickly while keeping legal protection constant; a clear SOW prevents disputes over what was promised and stops scope creep, which in security work could mean testing systems nobody approved.

**Common confusions:** The MSA does not describe any particular job; the SOW does not restate liability or confidentiality terms. An SOW is not an SLA: the SOW says what will be delivered, the SLA says how well an ongoing service must perform. For a penetration test, the SOW sets what is bought, and the rules of engagement set how the testing may be carried out.

**Scenario:** A security firm will run several assessments for a client over three years. The parties want to agree liability and payment terms once and then describe each assessment separately. The MSA holds the common terms and an SOW describes each assessment. Using an SLA is the closest wrong answer: it measures ongoing service performance, not the scope and deliverables of separate projects.

### Non-disclosure agreement (NDA)

A non-disclosure agreement (NDA) is a contract in which the signers agree not to release specific confidential information to anyone else, and to use it only for the agreed purpose. It protects confidentiality and is an administrative control. An NDA can last for a set time or indefinitely.

Forms:
1. One-way (unilateral): only one side shares secrets and the other promises to protect them, for example a company and a contractor.
2. Mutual (bilateral): both sides share and both protect, for example two firms exploring a partnership.
3. Multilateral: three or more parties, at least one of which shares.

What it defines:
1. What counts as confidential information.
2. What the receiver may do with it and who inside the receiver may see it.
3. How long the duty lasts.
4. What happens to the information at the end (return or destroy).
5. Remedies for a breach.

**Why it matters:** vendors, testers, bidders and new employees often need to see sensitive material (network diagrams, source code, customer lists); the NDA gives a legal remedy if they leak it and deters them from doing so. It is typically signed before any such material is shared, including during onboarding.

**Common confusions:** An NDA does not set service levels (SLA), scope (SOW) or acceptable system use (the acceptable use policy). An NDA discourages and punishes disclosure; it does not technically prevent it, so access controls are still needed.

**Scenario:** Before bidding on a data center project, three construction firms must receive floor plans showing where security systems are located. The agreement to sign first is an NDA. A memorandum of understanding is the closest wrong answer: it records an intent to cooperate and would not bind the firms to keep the plans secret.

### Business partners agreement (BPA)

A business partners agreement (BPA) sets out how two or more partners will run a shared business or joint venture: who contributes what, who is responsible for what, how profits and losses are shared, how decisions are made, and how a partner can leave. For security, it can also set who owns shared data and each partner's duties to protect it.

Typical content:
1. Each partner's contributions (money, equipment, staff, intellectual property) and ownership share.
2. How profits and losses are divided.
3. Roles and authority: who may sign contracts or take on debt.
4. Decision making, including how a deadlock is broken.
5. Exit terms: withdrawal, buyout, what happens to shared assets and data.
6. Security obligations for shared systems and information.

**Why it matters:** partners often connect their networks and pool customer data; without written duties, nobody is clearly responsible when shared data leaks or when the partnership ends and data must be divided.

**Common confusions:** A BPA is for an ongoing partnership between businesses, not a simple purchase of services (that is an MSA with SOWs). It is not an SLA: it is about the relationship and money, not measured service levels. Partners may still need an NDA and an interconnection agreement alongside it.

**Scenario:** Two software companies agree to build and sell a combined product, splitting revenue 60/40 and sharing a customer database. The agreement that records the split, the duties and who owns the customer data is a BPA. A master service agreement is the closest wrong answer: it fits one company buying services from another, not two companies sharing profits and losses.

### Vendor monitoring

Vendor monitoring is the ongoing oversight of a supplier after the contract is signed. It checks that the vendor still performs as agreed and that its security and stability have not slipped. Third-party risk does not end at signing: a supplier's risk should be tracked for the whole relationship.

What is monitored:
1. Performance against the service-level agreement (SLA): uptime, response times, missed targets.
2. Security posture: new audit reports and certifications, updated questionnaire answers, penetration test results.
3. Incidents: breaches at the vendor, whether you were told on time, how it responded.
4. Changes: new subcontractors, new data locations, mergers, leadership changes.
5. Financial health and reputation: signs the vendor may fail or cut corners.
6. Compliance with contract terms, using the right-to-audit clause where needed.

How it is run:
1. Tier vendors by risk; review the highest tier most often.
2. Assign an internal owner for each vendor relationship.
3. Collect evidence on a schedule and after events.
4. Record findings in the risk register and require fixes by a date.
5. Escalate or exit when a vendor stays outside tolerance.

**Why it matters:** a vendor that was secure at selection can lose staff, change hosting or be breached later; monitoring is how the customer learns before the damage reaches it.

**Common confusions:** Monitoring is after signing; due diligence is before. Monitoring is broader than SLA tracking: a vendor can meet uptime targets while its security degrades.

**Scenario:** A year into a contract, a customer notices its payment vendor's audit report has expired and news reports mention layoffs in the vendor's security team; it asks for an updated report and schedules a review. That is vendor monitoring. Due diligence is the closest wrong answer: that was the investigation before the contract was signed.

### Vendor security questionnaires

A vendor security questionnaire is a standard set of questions sent to a supplier to learn how it protects data and systems. It is used during selection and repeated periodically, often yearly, during the relationship. It is the cheapest and most scalable vendor assessment tool, and its weakness is that the answers are self-reported.

Typical topics:
1. Security governance: policies, a named security lead, staff training.
2. Access control: multifactor authentication (MFA), how leavers lose access, administrator accounts.
3. Data handling: where your data is stored, encryption, retention, deletion at contract end.
4. Incident response: how and how fast the vendor will tell you about a breach.
5. Business continuity and disaster recovery plans and tests.
6. The vendor's own suppliers, its due diligence and its conflict-of-interest process.
7. Independent audits and certifications held.

How to use it well:
1. Send the same question set to comparable vendors, so answers can be compared.
2. Scale the length to the vendor's risk tier.
3. Ask for evidence for the answers that matter most (a report, a policy, a screenshot).
4. Score the answers, record gaps in the risk register and agree fixes.
5. Repeat on a schedule and after major changes.

**Why it matters:** an organization with hundreds of vendors cannot audit each one; questionnaires sort vendors quickly so deeper checks go to the risky ones.

**Common confusions:** A questionnaire is the vendor describing itself; an independent assessment is an outsider's opinion. A perfect set of answers is not proof. A questionnaire gathers information; it is not a contract and does not bind the vendor unless the contract refers to it.

**Scenario:** A company onboarding 40 small suppliers needs a first view of each one's security within a month. Questionnaires fit. A right-to-audit clause is the closest wrong answer: on-site audits of 40 suppliers would take far too long and cost too much for a first pass.

### Rules of engagement (RoE)

Rules of engagement (RoE) are the detailed guidelines and limits for carrying out a security test, such as a penetration test or a vendor assessment. They are agreed and signed before testing starts and authorize the test team to perform the listed activities without asking permission again for each one. They protect both sides legally and operationally.

What the document contains:
1. Purpose and scope: which systems, networks, IP address ranges, applications and locations are in scope, and which are out of scope.
2. Test type and techniques allowed: external, internal, physical, social engineering; what is forbidden (for example denial of service).
3. Schedule: dates and hours, often outside business peaks.
4. People: named testers, the client's points of contact and the incident response team's contact.
5. Communication: how often the team reports, and how urgent findings are raised.
6. Incident handling: when to stop testing, what to do if testing harms a system or a real attacker is found during the test, and how to resume.
7. Data handling: how sensitive data found during the test is treated, stored and destroyed.
8. Risks and limits accepted by both sides, and signatures of the people with authority.

The common wrong order is starting to scan while the paperwork is "in progress": without signed rules, testing can be unauthorized access.

**Why it matters:** clear rules prevent outages caused by testing, keep testers out of legal trouble, and stop the defenders from treating a real attack as part of the test or the reverse.

**Common confusions:** The statement of work says what is being bought and for how much; the rules of engagement say how the testing may be done. Permission must come from someone with authority over the systems, which for hosted systems can include the hosting provider. Staying in scope is part of the rules: a tester who finds a path into an out-of-scope network stops and reports.

**Scenario:** During an authorized test, a tester discovers a server belonging to the client's parent company that was not listed. The right action is to stop, not touch it and tell the client's contact, as the rules of engagement require. Continuing because "it is on the same network" is the closest wrong answer: anything not listed in scope is not authorized.

## 5.4 Summarize the parts of effective security compliance

Depth asked: summarize. A good answer names what each compliance element is, who is involved and what happens when it fails, and tells look-alike pairs apart (due diligence and due care, attestation and acknowledgement, controller and processor).

### Compliance reporting: internal vs external

Compliance means meeting the laws, regulations, standards and contracts that apply to the organization, and being able to prove it. Compliance reporting is documenting and communicating that status. Internal reports go to people inside the organization; external reports go to outside parties.

| | Internal reporting | External reporting |
|---|---|---|
| Audience | Executives, the board, the audit committee, managers | Regulators, government agencies, auditors, customers, partners |
| Purpose | Track status, find and fix gaps early | Prove compliance, meet a legal or contractual duty |
| Form | Chosen by the organization: dashboards, summaries | Often fixed formats and deadlines |
| Examples | A quarterly compliance status report to the audit committee | A regulator filing, a customer attestation, a legally required breach notification |

How reporting works:
1. Map each requirement to the controls that meet it.
2. Collect evidence that the controls operate (logs, tickets, scan results, signed acknowledgements).
3. Report internally first, so gaps are fixed before outsiders see them.
4. Produce the external report in the required form by the deadline.
5. Keep the records; they support audits and the organization's defense after an incident.

**Why it matters:** an organization that complies but cannot show it is treated as non-compliant. Late or false external reports can bring their own penalties on top of the original issue.

**Common confusions:** Internal reporting is not optional housekeeping; it is how leadership meets its oversight duty. A breach notification is a form of external reporting. Compliance reporting shows whether specific requirements are met; risk reporting (objective 5.2) shows the state of risks.

**Scenario:** A compliance officer sends a monthly summary of open control gaps to the audit committee of the board. That is internal compliance reporting. External is the closest wrong answer: the audit committee is part of the organization's own governance, even though it oversees management.

### Non-compliance consequences: fines, sanctions, loss of license, contractual impacts, reputational damage

Failing to comply with a law, regulation, standard or contract brings one or more of five consequences. Several often arrive together.

| Consequence | What it is | Imposed by | Example |
|---|---|---|---|
| Fines | A monetary penalty | Regulators, courts | A data protection authority fines a company for unlawful processing |
| Sanctions | A penalty or restriction that enforces obedience; can be non-monetary | Governments, regulators | An order to stop processing personal data, a ban on doing business in a market |
| Reputational damage | Lost trust of customers, partners and the public | The market | Customers leave after a privacy scandal |
| Loss of license | A permit, license or certification needed to operate is suspended or revoked | Licensing bodies, card brands, certifiers | A firm loses its authorization to handle payments |
| Contractual impacts | Penalties, damages claims, lost or terminated contracts | The other party to a contract | A customer ends a contract because required security terms were not met |

Details worth knowing:
- Under the EU General Data Protection Regulation (GDPR), the top tier of administrative fine is up to 20 million euros or 4% of worldwide annual turnover, whichever is higher; a lower tier is up to 10 million euros or 2%. Supervisory authorities can also issue warnings and reprimands, order processing brought into line, and impose a temporary or permanent ban on processing.
- Reputational damage cannot be moved to an insurer and can outlast and outweigh the fine.
- Contractual impacts are separate from government penalties: the same failure can trigger both.

**Why it matters:** these consequences are the business case for compliance spending, and they are the "impact" side of compliance risk in the risk register.

**Common confusions:** A fine is always money; a sanction may be a restriction or order (some sources use "sanctions" broadly to include fines). Loss of license stops the activity itself, which can be worse than any fine. Reputational damage is a consequence nobody "imposes"; it follows from publicity.

**Scenario:** A regulator orders a company to suspend all processing of customer data until it fixes its consent process, without charging any money. That is a sanction. A fine is the closest wrong answer: no monetary penalty was imposed, only a restriction.

### Due diligence vs due care (compliance monitoring)

These two ideas together show an organization acted responsibly. Due diligence is investigating and understanding the risks and requirements: doing the homework. Due care is acting on that knowledge by putting reasonable protections in place and keeping them working: doing the right thing. In law, due care is the standard of what a reasonable person would do in the same situation; falling short of it is negligence.

| | Due diligence | Due care |
|---|---|---|
| Nature | Finding out | Acting and maintaining |
| Typical actions | Research applicable laws, assess risks, check a vendor before signing, review audit reports | Encrypt the data, patch systems, train staff, enforce policy, fix audit findings |
| Evidence | Assessments, research records, vendor reviews | Implemented controls, maintenance records, training logs |

How they work together:
1. Diligence identifies what must be protected and what the rules require.
2. Care implements and operates the protections.
3. Diligence continues (monitoring, reassessment) to check that care is still enough.

**Why it matters:** after a breach, regulators and courts ask whether the organization knew its duties and acted reasonably. Showing both reduces liability; knowing without acting looks like negligence.

**Common confusions:** Diligence without care is negligence; care without diligence is guesswork. Some sources use a different split: due care for actions inside the organization and due diligence for checks on third parties. Both readings mean acting in good faith, and the situation described shows which one applies. Due diligence in vendor selection (objective 5.3) is the same idea applied before a contract.

**Scenario:** A company researches which privacy laws cover its new app and documents the requirements, then encrypts the user database and trains its support staff. The research is due diligence; the encryption and training are due care. Calling the research due care is the closest wrong answer: nothing has been protected yet at that point, only understood.

### Attestation vs acknowledgement (compliance monitoring)

Both are sign-offs used as compliance evidence, at different levels. An attestation is a formal statement that requirements have been met, made by management or by an auditor, about the organization's controls or compliance. An acknowledgement is an individual confirming that they have read, understood and will follow a policy or requirement.

| | Attestation | Acknowledgement |
|---|---|---|
| Who signs | An executive, a compliance officer or an auditor | Each employee, contractor or user |
| About | The state of controls or compliance | The person's awareness of and agreement to rules |
| Weight | Formal, often legally significant | Creates individual accountability |
| Example | An executive signs that the organization meets a standard this year | A user ticks "I have read the acceptable use policy" each year |

How they are used:
1. Policies are published and each person acknowledges them, at hiring and when they change.
2. Controls are checked, internally or by an auditor.
3. Management or the auditor attests to the result.
4. Both records are kept as audit evidence.

**Why it matters:** acknowledgements remove the "nobody told me" defense; attestations give regulators and customers a named party answerable for the claim, and a false attestation has serious consequences for the signer.

**Common confusions:** An acknowledgement does not prove the person follows the policy, only that they were told. Attestation here is a compliance monitoring element; as an audit result (an auditor's formal opinion) it appears in `### Attestation (audits and assessments)`. Attestation in authentication hardware is a different technical meaning.

**Scenario:** Each year the chief compliance officer signs a statement to a business partner that the company's security program meets the partner's required standard. That is an attestation. Acknowledgement is the closest wrong answer: it would be an individual confirming they read a policy, not an officer vouching for the organization's compliance.

### Internal vs external compliance monitoring, and automation

Compliance monitoring is the ongoing checking that the organization still meets its requirements, because compliance on audit day says little about the rest of the year. Monitoring can be internal or external, and much of it can be automated.

| | Internal monitoring | External monitoring |
|---|---|---|
| Done by | The organization's own compliance team or internal audit, often led by a compliance officer | Regulators, outside auditors, customers |
| Frequency | Ongoing | Periodic or triggered |
| Independence | Lower | Higher, more credible |
| Purpose | Catch and fix drift early | Independent confirmation |

Automation uses tools to check compliance continuously and gather evidence without manual effort:
1. Configuration scanners compare systems to the required baseline and flag drift.
2. A security information and event management (SIEM) system applies rules that alert on violations, such as a disabled audit log.
3. Cloud posture tools flag non-compliant resources, such as unencrypted storage.
4. Dashboards show compliance status per requirement.
5. Evidence (scan results, logs, tickets) is collected and stored automatically for auditors.

**Why it matters:** manual checks are slow, sample only a few systems and miss changes between checks; automated monitoring covers everything all the time and makes audits cheaper.

**Common confusions:** Automation supports people; it does not attest or decide. Internal and external monitoring complement each other. Monitoring is the checking; reporting (see `### Compliance reporting: internal vs external`) is communicating the result.

**Scenario:** A tool scans every server nightly against the hardening standard, opens a ticket for each deviation and stores the results for the auditors. That is automation of compliance monitoring. External monitoring is the closest wrong answer: the tool is run by the organization itself.

### Privacy in security compliance (overview)

Privacy is about personal data and the rights people have over information about them. Security protects all data against unauthorized access, change and loss; privacy asks whether personal data is collected, used, shared and kept lawfully and fairly. A system can be secure and still break privacy rules, for example by keeping data longer than allowed.

The objective lists these privacy elements, each with its own section:
1. Legal implications at local or regional, national and global level.
2. The data subject: the person the data is about.
3. Controller versus processor: who decides and who processes.
4. Ownership of data.
5. Data inventory and retention: what is held and for how long.
6. The right to be forgotten: erasure on request.

Principles that sit behind most privacy law, as written in the EU General Data Protection Regulation (GDPR):
- Process personal data lawfully, fairly and openly.
- Collect it for stated purposes and do not reuse it for conflicting ones (purpose limitation).
- Collect only what is needed (data minimization).
- Keep it accurate.
- Keep it in identifiable form no longer than needed (storage limitation).
- Protect it (integrity and confidentiality).
- Be able to demonstrate all of this (accountability).

**Why it matters:** privacy failures bring fines, orders to stop processing, lawsuits and loss of customer trust, even when no attacker was involved.

**Common confusions:** Privacy is not the same as confidentiality: confidentiality is one security property, while privacy also covers purpose, consent, retention and individual rights. Encrypting data does not make an unlawful collection lawful. Privacy techniques such as masking and tokenization are covered under data protection in Domain 3.

**Scenario:** A company stores customer records in a well-protected, encrypted database, but it keeps the records of people who closed their accounts ten years ago for no stated reason. The issue is privacy (storage limitation and retention), not security. Calling it a confidentiality failure is the closest wrong answer: nobody unauthorized has seen the data.

### Privacy legal implications: local/regional vs national vs global privacy law

Privacy law exists at several levels at once, and an organization must follow every level that applies to the data it handles. What applies depends largely on where the people the data is about are located, not only on where the organization sits.

| Level | Reach | Examples |
|---|---|---|
| Local/regional | A state, province or region | The California Consumer Privacy Act (CCPA); state breach notification laws with differing deadlines |
| National | A whole country, sometimes one sector | In the US, the Health Insurance Portability and Accountability Act (HIPAA) for health information; in Canada, the Personal Information Protection and Electronic Documents Act (PIPEDA) |
| Global | Reaches organizations outside the jurisdiction | The EU General Data Protection Regulation (GDPR) |

Details:
- HIPAA applies to covered entities (health plans, health care clearinghouses and health care providers that send health information electronically for standard transactions such as claims) and to their business associates, which handle identifiable health information on their behalf.
- PIPEDA covers private sector organizations that collect, use or disclose personal information in commercial activity. Alberta, British Columbia and Quebec have their own substantially similar laws, which apply inside those provinces instead; PIPEDA still applies to federally regulated businesses and to data crossing provincial or national borders.
- The GDPR applies to organizations established in the EU and also to those outside it that offer goods or services to people in the EU, paid or free, or monitor their behavior there.
- US privacy law is largely sector by sector (health, finance) plus state laws.

**Why it matters:** one online service can fall under a state law, a national law and the GDPR at once; violations bring fines, lawsuits and notification duties under each.

**Common confusions:** A local law can be stricter than the national one. HIPAA does not cover all health-related data everywhere, only what covered entities and business associates hold. This section is the privacy view; the same three levels as external governance factors are in `### External considerations by scope: local/regional vs national vs global`.

**Scenario:** A Canadian retailer in Ontario with stores only in that province sells to walk-in customers and keeps a loyalty database. The national law PIPEDA applies. A provincial law is the closest wrong answer: only Alberta, British Columbia and Quebec have substantially similar private sector laws that replace PIPEDA inside the province, and Ontario's similar law covers only personal health information, not a loyalty database.

### Data subject

The data subject is the identified or identifiable living person that personal data is about. A person is identifiable when they can be picked out directly or indirectly, for example by a name, an ID number, location data or an online identifier. The term comes from the EU General Data Protection Regulation (GDPR), and other privacy laws use similar ideas (for example "consumer" in California).

Rights a data subject typically has under the GDPR:
1. To be informed about what is collected and why.
2. To access the data held about them.
3. To have wrong data corrected.
4. To have data erased in certain cases (the right to be forgotten).
5. To restrict or object to processing.
6. To receive their data in a portable form.

How an organization handles a request:
1. Verify the requester's identity, so data is not handed to an impostor.
2. Find all of the person's data using the data inventory.
3. Check whether an exception applies.
4. Respond within the legal deadline and record what was done.

**Why it matters:** these rights are legal duties for the organization; mishandling a request (ignoring it, or releasing data to the wrong person) is itself a violation.

**Common confusions:** The data subject is the person, not the organization holding the data and not the data owner role inside the organization. The GDPR does not cover data about deceased people, though national laws may. An employee is a data subject of their employer's HR records.

**Scenario:** A customer emails a shop asking for a copy of everything it holds about her. She is the data subject exercising her right of access. Calling her the data owner is the closest wrong answer: in governance terms the data owner is the manager inside the shop who is accountable for the customer data set.

### Controller vs processor (privacy)

In privacy law, the controller is the entity that decides why and how personal data is processed, alone or jointly with others. The processor is an entity that processes personal data on the controller's behalf. "Processing" is anything done with the data: collecting, storing, using, sharing, deleting. The controller carries the main legal responsibility and must be able to demonstrate compliance.

| | Controller | Processor |
|---|---|---|
| Role | Decides purposes and means | Acts on the controller's documented instructions |
| Example | A clinic deciding to send appointment reminders | The messaging service that sends them |
| Contract | Must choose processors that give sufficient guarantees | Bound by a written contract (a data processing agreement) |
| Breach | Notifies the supervisory authority | Notifies the controller without undue delay |

Under the EU General Data Protection Regulation (GDPR):
1. The contract obliges the processor to act only on documented instructions, keep the data confidential and secure, use sub-processors only with the controller's authorization, help with data subject requests, delete or return the data at the end, and allow audits.
2. After a personal data breach, the controller notifies the supervisory authority without undue delay and, where feasible, within 72 hours of becoming aware, unless the breach is unlikely to put people's rights and freedoms at risk; a later notice must give reasons for the delay. Affected people are told without undue delay when the risk to them is high.
3. A processor that starts deciding purposes and means itself is treated as a controller for that processing.

**Why it matters:** the role decides who must answer to regulators and data subjects. Outsourcing processing does not move the controller's accountability.

**Common confusions:** A cloud or payroll provider is usually a processor for its customers' data but a controller for its own staff's data. Inside one company the split is sometimes illustrated with departments, but legally the roles belong to organizations. For the governance view of all data roles see `### Data roles: owner vs controller vs processor vs custodian vs steward`.

**Scenario:** A marketing agency that sends emails for a retailer starts using the retailer's customer list to promote its own events. For that use the agency has become a controller, and is acting outside its instructions. Saying it remains only a processor is the closest wrong answer: it decided a new purpose itself.

### Data protection officer (DPO)

A data protection officer (DPO) is the person who oversees an organization's compliance with data protection law, advises it, and acts as the contact point for the regulator and for the people whose data is processed. The SY0-701 acronym list calls the role data privacy officer. It is a governance and compliance role, not a technical one.

When the EU General Data Protection Regulation (GDPR) requires one:
1. The organization is a public authority or body (courts acting as courts are excepted).
2. Its core activities involve regular, systematic monitoring of people on a large scale.
3. Its core activities involve large-scale processing of special category data or data on criminal convictions.
Others may appoint one voluntarily. The DPO can be a staff member or an outside provider, and is chosen for professional skill, above all a deep knowledge of data protection law and how it is applied.

What the DPO does:
1. Advises the organization and its staff on their obligations.
2. Monitors compliance, including training, awareness and related audits.
3. Advises on data protection impact assessments.
4. Cooperates with the supervisory authority and is its contact point.
5. Is available to data subjects who have questions about their data or rights.

How the role is protected: the DPO reports directly to the highest level of management, may not be told how to carry out the tasks, and may not be dismissed or penalized for doing them. Other duties are allowed only if they cause no conflict of interest.

**Why it matters:** the DPO gives privacy an independent voice at the top of the organization and gives regulators and individuals one place to go.

**Common confusions:** The DPO advises and monitors; the controller remains responsible for compliance. The DPO is not the data owner or the chief information security officer (CISO), and combining it with a role that decides how personal data is used can create a conflict of interest.

**Scenario:** A hospital group that processes health records on a large scale asks whether it must name someone to oversee data protection and deal with the regulator. Under the GDPR it must appoint a DPO. Naming the IT director as data custodian is the closest wrong answer: a custodian protects data technically and does not provide the independent oversight the law requires.

### Data ownership (privacy)

Ownership in a privacy context is the question of who has rights over data and who is accountable for it. An organization that collects personal data holds it and is accountable for it, but that does not give it unlimited rights: the people the data is about keep legal rights over it. Inside the organization, a named data owner is accountable for each data set.

Three layers to keep apart:
1. The data subject keeps rights over data about them (access, correction, erasure and others), whoever holds it.
2. The organization (as controller) is accountable for using the data lawfully and protecting it.
3. Inside the organization, the data owner role classifies the data and approves access.

Where ownership questions arise:
1. Cloud and vendor contracts: the contract should state that the customer keeps ownership of its data, that the provider may use it only as instructed, and that it is returned or deleted at the end.
2. Mergers and partnerships: who takes over which data sets and their duties.
3. Employees leaving: work data belongs to the organization, not the departing employee.
4. Derived data and analytics a vendor builds from customer data.

**Why it matters:** unclear ownership leads to data that no one protects, vendors reusing data for their own ends, and disputes over getting data back when a contract ends.

**Common confusions:** Possession is not ownership: a processor holds data it does not own or control. The "data owner" governance role is about accountability inside the organization, not about legal property rights over people's personal information.

**Scenario:** A company ends its contract with an analytics provider, which then refuses to delete the customer records it received, saying the data is now its own. The contract should have settled data ownership and return or deletion at the end. A non-disclosure agreement is the closest wrong answer: it would limit disclosure but not decide who owns the data or require its deletion.

### Data inventory and retention

A data inventory is a record of what data the organization holds: what type it is, where it is stored, why it is held, who is responsible for it and who it is shared with. Retention rules say how long each type of data is kept before it is securely disposed of. Together they are administrative controls that support both privacy and security.

A data inventory entry typically records:
1. The data type and its classification (for example personal data, financial records).
2. The purpose of holding it.
3. Where it lives: systems, locations, backups, vendors.
4. The data owner.
5. Who receives it, including transfers to other countries.
6. The retention period, how often the data is updated and its format.

How retention works:
1. Set a period per data type from legal requirements and business need.
2. Keep data no longer than needed for its purpose.
3. Dispose of it securely at the end (sanitization and destruction are covered in objective 4.2).
4. Suspend deletion for data under a legal hold: when litigation is pending or reasonably expected, the routine destruction schedule is paused for relevant records until the hold is released.

**Why it matters:** you cannot protect, find or delete data you do not know you have. Over-retention increases what a breach exposes and can violate privacy law; deleting too early can break record-keeping laws or destroy evidence.

**Common confusions:** Retention sets a maximum and often a minimum too: some records must be kept for a set number of years. A legal hold overrides the retention schedule, not the other way round. Backups are part of the inventory; data deleted from production but kept in old backups still exists.

**Scenario:** A customer asks a company to delete all her data, and the company cannot say whether copies exist in an old marketing system. The missing control is a data inventory. A retention policy is the closest wrong answer: it would say how long to keep the data, but finding every copy depends on the inventory.

### Right to be forgotten (right to erasure)

The right to be forgotten is a data subject's right to have their personal data erased in certain situations. In the EU General Data Protection Regulation (GDPR) it is the right to erasure. The controller must erase the data without undue delay when a valid ground applies and no exception overrides it.

Grounds for erasure:
1. The data is no longer needed for the purpose it was collected for.
2. The person withdraws consent and there is no other legal basis.
3. The person objects to the processing and no overriding legitimate ground exists.
4. The data was processed unlawfully.
5. A law requires erasure.
6. The data was collected from a child for an online service.

Exceptions, where the data may be kept:
1. Exercising freedom of expression and information.
2. A legal obligation to keep it, or a task in the public interest.
3. Public health reasons.
4. Archiving, scientific or historical research and statistics, where erasure would defeat the purpose.
5. Establishing, exercising or defending legal claims.

How a request is handled:
1. Verify the requester's identity.
2. Find every copy with the data inventory, including at processors.
3. Check the grounds and exceptions.
4. Erase, and if the data was made public, take reasonable steps to tell other controllers to remove links and copies.
5. Answer the person within the legal deadline (one month from receipt under the GDPR, extendable by two more months for complex or numerous requests).

**Why it matters:** refusing or botching a valid request is a violation in the highest fine tier; honoring it requires knowing where all the data is.

**Common confusions:** The right is not absolute. Erasing a customer's marketing profile does not mean deleting invoices the tax law requires the company to keep. It is the data subject's right, exercised against the controller, and processors help the controller carry it out.

**Scenario:** A former customer asks an online shop to delete everything about him. The shop deletes his profile and marketing history but keeps his invoices for the period required by tax law, and tells him so. That is a correct handling of the right to be forgotten. Deleting the invoices too is the closest wrong answer: a legal obligation to keep records overrides the erasure request for those records.

## 5.5 Explain the types and purposes of audits and assessments

Depth asked: explain. A good answer says who performs each kind of review, how independent it is and what it is for, and can identify a penetration test's team, environment and reconnaissance type from a description.

### Audit vs assessment vs attestation

All three check controls, but they differ in what they produce. An audit verifies controls against stated requirements and gives formal findings. An assessment evaluates security posture or risk and recommends improvements. An attestation is the formal statement issued at the end, declaring that requirements were shown to be met.

| | Audit | Assessment | Attestation |
|---|---|---|---|
| Question | Do the controls meet the requirement? | How good is the security, and what should improve? | Who formally vouches for the result? |
| Measured against | A law, standard, contract or policy | A framework, good practice or risk | The audit or examination evidence |
| Output | Findings: compliant or not, with evidence | Observations, ratings, recommendations | A signed statement or opinion |
| Tone | Formal, evidence-based | Advisory, improvement-focused | Formal, with accountability for the signer |

How they relate:
1. An assessment often comes first, to find gaps without formal consequences.
2. Gaps are fixed.
3. An audit then tests the controls against the requirement.
4. The auditor (or management) issues an attestation that others can rely on.

**Why it matters:** choosing the right one saves money and embarrassment: an assessment before the formal audit lets the organization fix problems privately; customers and regulators usually want the audit and its attestation.

**Common confusions:** A vulnerability assessment is a technical scan for weaknesses, one narrow kind of assessment. A penetration test is neither an audit nor a paperwork review; it actively exploits weaknesses. Any of the three can be internal or external; independence, not the name, decides how much weight it carries.

**Scenario:** A startup hires a consultant to compare its security to a well-known framework and suggest priorities before it seeks certification next year. That is an assessment. An audit is the closest wrong answer: nothing is being formally verified against a requirement with pass or fail findings yet.

### Attestation (audits and assessments)

In auditing, an attestation is a formal written statement by an auditor or other qualified party that specified requirements have been shown to be met, for example an opinion that an organization's controls are suitably designed and operated effectively. It gives customers, partners and regulators assurance they can rely on without examining the organization themselves.

How an attestation comes about:
1. The scope and the criteria are agreed (which systems, which standard).
2. The auditor gathers evidence: documents, interviews, observation, testing of samples.
3. The auditor forms an opinion on whether the criteria were met.
4. The opinion is issued in a signed report; the auditor is professionally accountable for it.
5. Readers check the report's scope, period and any exceptions noted.

The best-known example is a System and Organization Controls (SOC) 2 report, in which an independent accountant attests to a service organization's controls (see `### SOC reports: SOC 1 vs SOC 2 vs SOC 3, Type I vs Type II`).

**Why it matters:** an attestation lets one audit serve many customers, and puts a named, accountable professional behind the claim.

**Common confusions:** In objective 5.4, attestation also covers management's own formal statement of compliance, alongside users' acknowledgements (see `### Attestation vs acknowledgement (compliance monitoring)`); here it is the auditor's opinion. An attestation covers only its stated scope and period: a clean report on one service says nothing about another. Attestation in device or key hardware is an unrelated technical meaning.

**Scenario:** A cloud provider gives prospective customers a report in which an independent audit firm states that the provider's security controls operated effectively from January to December. That document is an attestation. A self-assessment is the closest wrong answer: it would be the provider's own view, with no independent opinion.

### Internal audits: compliance, audit committee and self-assessments

Internal audits and assessments are performed by the organization's own people to check that controls exist and work and that requirements are met. Internal auditing is meant to be an independent, objective activity that helps the organization improve its risk management, control and governance. The objective lists three internal elements.

| Element | What it is | Independence |
|---|---|---|
| Compliance (internal audit) | Internal staff check adherence to laws, regulations, standards and the organization's own policies | Moderate, if the auditors do not audit their own work |
| Audit committee | A committee of the board that oversees the audit process and internal controls and receives audit findings | Provides independence by sitting above management |
| Self-assessment | A team evaluates its own controls, usually with a checklist or framework | Lowest: the team grades itself |

How the pieces work together:
1. Teams run self-assessments to find obvious gaps cheaply and build awareness.
2. Internal audit plans reviews by risk and tests controls with evidence.
3. Findings go to the audit committee, not only to the managers being audited, so they cannot be buried.
4. Management fixes the findings by agreed dates; internal audit follows up.
5. The organization arrives at external audits prepared.

**Why it matters:** internal reviews are cheaper and more frequent than external ones and catch problems before a regulator or customer does.

**Common confusions:** Internal does not mean informal: internal audit follows a plan and standards. The audit committee does not perform audits; it oversees them. A self-assessment is useful preparation but weak evidence for outsiders. Internal auditors should report in a way that keeps them independent of the area they audit.

**Scenario:** A company's internal auditors find serious access control gaps in IT and worry the IT director will suppress the report. They should report to the audit committee. Reporting only to the IT director is the closest wrong answer: it would leave the audited manager in control of findings about his own area.

### External audits: regulatory, examinations, assessment and independent third-party audit

External audits and assessments are performed by parties outside the organization, which gives them more independence and credibility than internal reviews. They are often required by law, contracts or customers. The objective lists four.

| Type | Who performs it | Purpose | Clue |
|---|---|---|---|
| Regulatory | A government regulator, or an auditor acting for it | Check compliance with the laws and regulations in its area; mandatory, penalties possible | "The regulator requires..." |
| Examinations | Regulators' examiners | A formal, detailed inspection of records, operations and controls, common for banks and other financial institutions | "Examiners arrive on site" |
| Assessment | An outside consultant or assessor | Evaluate security posture against a framework and recommend improvements | "Recommendations", "gap analysis" |
| Independent third-party audit | An outside audit firm with no stake in the result | An objective opinion on controls, for customers and partners | "SOC 2", "certification audit" |

Examples of independent third-party audits: a SOC 2 examination by an accounting firm, a certification audit against ISO/IEC 27001 by a certification body (ISO itself does not certify; certificates run on a three-year cycle with yearly surveillance audits in between and a recertification audit before expiry), and a payment card security assessment.

How an external audit typically runs:
1. Scope and criteria are set by the regulation, standard or contract.
2. The organization provides evidence and access.
3. Auditors test and interview.
4. A report with findings is issued; corrective action may be required with deadlines.
5. Follow-up confirms the fixes.

**Why it matters:** external results are what regulators, customers and partners trust; failing one can bring fines, lost licenses or lost contracts.

**Common confusions:** A regulatory audit is mandatory; an independent third-party audit is often chosen by the organization to win customer trust or required by contract. An external assessment advises; an external audit verifies. External reviewers are independent, but the organization usually pays for third-party audits.

**Scenario:** Government examiners spend two weeks at a bank reviewing its records and controls in detail and then require corrective actions. That is an examination. An independent third-party audit is the closest wrong answer: that would be a firm the bank hired, not the regulator's own examiners.

### SOC reports: SOC 1 vs SOC 2 vs SOC 3, Type I vs Type II

System and Organization Controls (SOC) reports are independent auditor reports on the controls of a service organization, such as a cloud, payroll or hosting provider. Customers use them to judge the risk of outsourcing. They are the most common form of independent third-party attestation a vendor shares.

| Report | Covers | Readers |
|---|---|---|
| SOC 1 | Controls that affect customers' financial reporting | Customers and their auditors (restricted) |
| SOC 2 | Controls measured against the trust services criteria | Parties who understand the system: customers, prospective customers, business partners, regulators (restricted) |
| SOC 3 | The same ground as SOC 2, with less detail | Anyone; can be distributed freely |

The trust services criteria have five categories: security, availability, processing integrity, confidentiality and privacy. A SOC 2 report always covers security and adds whichever of the other four the service organization chooses.

| | Type I | Type II |
|---|---|---|
| Judges | Whether controls are suitably designed | Design AND whether the controls operated effectively |
| Time | One date | A review period (a span of months, not a single date) |
| Assurance | Lower | Higher; what most customers ask for |

How to read one:
1. Check which report and type it is.
2. Check the scope: which services, locations and criteria categories.
3. Check the period and how recent it is.
4. Read the auditor's opinion and every exception noted in the testing.

**Why it matters:** a SOC 2 Type II lets a customer rely on an independent opinion instead of auditing the provider itself, and customers commonly ask for a current one.

**Common confusions:** SOC here has nothing to do with a security operations center. A SOC 2 is an attestation report, not a certification. A Type I says the design looked right on one day; only a Type II says the controls actually worked over time. SOC 1 is about financial reporting, not general security.

**Scenario:** A company choosing a data hosting provider wants evidence that the provider's security controls worked throughout last year, not just that they were well designed. It should ask for a SOC 2 Type II report. A SOC 2 Type I is the closest wrong answer: it judges design at a single date and does not test operation over a period.

### Penetration testing (audits and assessments)

A penetration test is an authorized, simulated attack in which testers use the tools and techniques of real attackers to get around the security of a network, system or application. Testers often chain several weaknesses together to gain more access than any one would allow, which shows the real impact. It is a form of assessment that tests controls protecting confidentiality, integrity and availability.

The four phases (one common model):
1. Planning: agree the rules of engagement, get management approval in writing and set goals. No testing happens yet, and skipping this makes the test unauthorized.
2. Discovery: gather information and scan (reconnaissance), then compare what was found against known vulnerabilities.
3. Attack: try to exploit the suspected vulnerabilities to confirm them, gain access, escalate privileges and move to other systems; new findings loop back to more discovery.
4. Reporting: runs alongside the other phases and ends with a report of findings, their risk and how to fix them.

**Why it matters:** a penetration test proves which weaknesses can really be used and how far an attacker could get, which helps prioritize fixes and convinces decision makers.

**Common confusions:** A vulnerability scan only flags weaknesses that may be present; a penetration test exploits them to confirm they are real. A penetration test is a sample in time and scope, not proof that no other weakness exists. It always needs written authorization and rules of engagement (see `### Rules of engagement (RoE)`). The objective lists four test types (physical, offensive, defensive, integrated), three environments and two kinds of reconnaissance, each covered in its own section.

**Scenario:** A scanner reports that a web server may be open to a known flaw. Management wants to know whether an attacker could actually use it to reach customer data. That calls for a penetration test. Running another vulnerability scan is the closest wrong answer: it would list the same possible weakness without showing what can be done with it.

### Pen test types: physical vs offensive (red) vs defensive (blue) vs integrated (purple)

The objective names four penetration testing types. One is about WHAT is attacked (physical); the other three are about WHICH SIDE is exercising (offense, defense or both together).

| Type | Team | What happens | Measures |
|---|---|---|---|
| Physical | Testers on site | Try to enter buildings and secure areas: tailgating, picking locks, cloning badges, posing as staff or contractors | Locks, guards, badges, cameras, staff behavior |
| Offensive | Red team | Emulates an adversary and attacks systems to find and exploit weaknesses | What an attacker can achieve |
| Defensive | Blue team | Defends: detects, responds to and blocks the simulated attacks | Detection and response, not only prevention |
| Integrated | Purple team | Red and blue work together and share findings as they go, tuning defenses during the exercise | How fast defenses improve |

How an exercise runs:
1. Rules of engagement are agreed; for physical tests the testers carry an authorization letter and guards have a contact to verify them.
2. The red team attacks within scope.
3. The blue team (often the security operations center) tries to detect and respond; in some exercises it is not told in advance.
4. A neutral referee group (a white team) may oversee the rules.
5. In an integrated exercise, each attack step is replayed with the defenders to build or fix a detection.
6. Findings from both sides go into the report.

**Why it matters:** attack-only testing shows holes but not whether anyone would notice an intruder; defense and integrated exercises test the people and processes that must catch a real attack.

**Common confusions:** Purple is a way of working together, not necessarily a separate third team. A physical test checks physical controls and often includes social engineering; it differs from the physical security standard, which is the rulebook being tested. Blue team work during a test measures detection and response, not just whether attacks were blocked.

**Scenario:** After each technique the attackers use, they sit down with the monitoring analysts, show what they did and help write an alert that would catch it next time. That is integrated (purple team) testing. Offensive is the closest wrong answer: the red team is attacking, but the defining feature here is the real-time cooperation with the defenders.

### Pen test environments: known vs partially known vs unknown

The environment describes how much the testers are told about the target before they start. More knowledge gives wider and faster coverage; less knowledge gives a more realistic picture of an outside attacker.

| Environment | Older name | Testers receive | Simulates | Trade-off |
|---|---|---|---|---|
| Known | White box | Full details: network diagrams, source code, configurations, credentials | A thorough review, or an insider with deep knowledge | Most complete and efficient; least like an outsider's starting point |
| Partially known | Gray box | Some details: IP ranges, an ordinary user account, high-level design | An insider with limited access, or an attacker who has done research | Balance of realism and efficiency |
| Unknown | Black box | Nothing beyond the target's name | An outside attacker starting cold | Most realistic for an outsider; slowest, may miss areas |

How to choose:
1. To find as many flaws as possible in limited time, or to review code: known environment.
2. To test what a normal user or a partner with some access could do: partially known.
3. To test what the internet sees and whether defenders notice a real-style attack: unknown.
4. Budget matters: with less information, testers spend paid time on discovery.

**Why it matters:** the environment decides what the result means. An unknown-environment test that finds little does not prove the inside is safe; a known-environment test does not show how hard the first step is for an outsider.

**Common confusions:** These terms describe the testers' knowledge, not whether the defenders know a test is happening (that is overt versus covert testing). The SY0-701 objectives use known, partially known and unknown; white, gray and black box are the older names. Whatever the environment, authorization and rules of engagement are still required.

**Scenario:** Testers are given a standard employee login and the list of internal IP ranges, but no diagrams or administrator access. That is a partially known environment. Known is the closest wrong answer: it would include full documentation and privileged credentials.

### Reconnaissance: passive vs active

Reconnaissance is the information-gathering part of a penetration test (and of a real attack): learning about the target before trying to break in. It is the first hands-on step and follows planning. The deciding difference between the two kinds is whether the tester's traffic touches the target's systems.

| | Passive reconnaissance | Active reconnaissance |
|---|---|---|
| Contact with target systems | None: uses third-party and public sources | Direct: probes the target with network traffic |
| Typical sources and actions | Open-source intelligence (OSINT): the company website, job postings, social media, search engines, public DNS and WHOIS records, certificate records, code repositories | Port scans, ping sweeps, banner grabbing, vulnerability scans, wordlist scanning for hidden pages |
| Chance of detection | Very low: the target sees nothing unusual | Can be logged and detected by firewalls and intrusion detection |
| Detail gained | Broad: names, email formats, technologies, address ranges | Precise: live hosts, open ports, service versions |

How a tester proceeds:
1. Start passive, to map the organization without alerting it: domains, address ranges, staff names, technologies mentioned in job postings.
2. Use that map to plan focused active probing, which keeps noise down.
3. Run active scans only inside the scope and time windows in the rules of engagement.
4. Compare discovered services and versions against known vulnerabilities, which leads into the attack phase.

**Why it matters:** defenders can reduce what passive reconnaissance finds by limiting what the organization publishes, and can detect active reconnaissance, which makes it an early warning of an attack.

**Common confusions:** A port scan is always active, however quiet. Reading a public DNS record through a third-party service is passive; querying the target's own servers aggressively is active. Some sources also count dumpster diving and social engineering as passive because no target computer system is probed, while others treat any contact with the target's staff as active; the dependable test is whether the tester's traffic reaches the target's systems. Passive does not mean harmless: it supplies the details that make phishing convincing.

**Scenario:** A tester learns from job postings and employee profiles that a company uses a particular firewall brand and a certain email naming pattern. That is passive reconnaissance. Active is the closest wrong answer: no traffic was sent to the company's systems.

Mini-example: looking up who registered a domain in a public registry database is passive; running `nmap -sV` against the company's web server to list open ports and service versions is active.

## 5.6 Apply security awareness practices in a scenario

Depth asked: apply in a scenario. A good answer picks the right awareness activity, training topic, behavior label or program step for the situation described and says what the user or the security team should do next.

### Security awareness program (overview)

A security awareness program teaches the workforce to recognize and respond to security risks in their daily work, with the aim of changing behavior, not just passing on facts. It is an administrative, preventive control, and it supports individual accountability: people who were never taught a rule cannot fairly be held to it.

The parts named in this objective:
1. Phishing: simulated campaigns, recognizing an attempt, and responding to reported messages.
2. Anomalous behavior recognition: risky, unexpected and unintentional.
3. User guidance and training on eight topics: policies and handbooks, situational awareness, password management, insider threat, social engineering, removable media and cables, hybrid or remote work, and operational security.
4. Reporting and monitoring: initial and recurring.
5. Development and execution of the program.

How a program runs as a cycle:
1. Plan: tie the program to the organization's risks and goals.
2. Analyze and design: find who needs to learn what, by role.
3. Develop and deliver: build content and run training, exercises and campaigns.
4. Assess and improve: measure results and feed them back into the plan.

**Why it matters:** many incidents start with a person: a clicked link, a reused password, a held door. Training reduces how often that happens and how quickly it is reported when it does.

**Common confusions:** Awareness (everyone, basic behaviors) differs from role-based training (deeper skills for people with special duties such as administrators or developers). A yearly slide deck alone is not a program; a program repeats, measures and adapts. Training supports technical controls; it does not replace them.

**Scenario:** An organization's only security training is a video shown on a new hire's first day. Click rates in phishing tests stay high. The fix is a continuing program with regular simulations, role-based content and measurement. Buying a stronger email filter is the closest wrong answer: it helps, but it does not address the untrained behavior the tests revealed.

### Phishing campaigns (simulated phishing)

A phishing campaign, in the awareness sense, is an authorized exercise in which the organization sends realistic but harmless phishing emails to its own staff to measure and improve how they respond. It can be built in house or bought as a service, with a console that tracks results.

How to run one:
1. Agree goals and get approval; involve the legal team in the design, for example to avoid misusing real brands or other organizations' names as bait.
2. Tell staff in general terms that exercises happen at random and that results guide future training.
3. Take a baseline: send a first simulation to learn the starting click rate and report rate.
4. Send varied simulations over time, at different difficulty, some aimed at specific roles such as executives or administrators.
5. Track who opened, clicked, entered credentials or opened an attachment, and who reported the message.
6. Give anyone who clicked an immediate, short explanation of the clues they missed, with follow-up training for repeat clickers.
7. Compare results over time and by department, and adjust the training.

Metrics: click rate (lower is better), credential entry rate and report rate (higher is better).

**Why it matters:** simulations give safe practice against the most common way attackers get in, and give the program numbers that show whether training works.

**Common confusions:** A campaign is authorized practice, not a real attack and not a penetration test of systems. Results should be used to teach, not to punish or shame; nobody should be singled out publicly. A low click rate on an easy email does not mean staff would spot a well-crafted one, so difficulty must be considered.

**Scenario:** A company wants to know whether last quarter's training changed behavior. It sends a simulated phishing email and compares the click and report rates with the baseline from before the training. That is a phishing campaign used as measurement. Reviewing email filter logs is the closest wrong answer: it shows what the filter blocked, not how people behave when a message gets through.

### Recognizing a phishing attempt

Recognizing a phishing attempt means spotting the signs that a message is trying to trick the reader into giving up information, paying money or running malware. Phishing arrives by email, by phone (vishing) and by text message (smishing). This section is the user's view; the attack techniques themselves are covered with social engineering in Domain 2.

Warning signs:
1. Urgent or emotional language, especially a threat of bad consequences unless you act now.
2. A request for credentials, personal data, payment or a change of bank details.
3. A sender address that imitates a real one but is slightly off (an extra letter, a different domain).
4. A link whose visible text does not match where it really goes, a look-alike address or an untrusted shortened link.
5. An unexpected attachment.
6. A generic greeting or a signature without real contact details.
7. Anything out of pattern for that sender: an unusual request, time or tone.
Good spelling and grammar are no longer proof a message is genuine.

What the user should do:
1. Stop: do not click links, open attachments or reply.
2. Check the sender address and hover over links to see the real destination.
3. Verify through a separate, known channel (a phone number you already have, the official website typed by hand), never one given in the message.
4. Report it with the organization's report button or to the security team.
5. Delete it after reporting.
6. If you already clicked or entered a password, report at once and change the password.

**Why it matters:** a single stolen password or opened attachment can start a breach; a quick report can let the security team remove the same message from every mailbox before others fall for it.

**Common confusions:** Recognizing is the user's skill; a phishing campaign is the organization's practice exercise; responding to reports is the security team's process. A message from a real colleague's account can still be phishing if that account was taken over, so verify unusual requests even from known senders.

**Scenario:** An accounts clerk receives an email that appears to come from a regular supplier, saying its bank account has changed and an invoice must be paid today. The right action is to call the supplier on the number already on file before changing anything, and to report the email. Replying to the email to ask whether it is genuine is the closest wrong answer: the reply goes to the attacker.

### Responding to reported suspicious messages

This is the process that follows when a user reports a suspicious message. It has a security team side and a user side, and it is usually written as a phishing playbook. Fast, friendly handling encourages more reporting.

Security team steps, in order:
1. Acknowledge the report and thank the reporter, because people stop reporting when reports vanish into silence.
2. Analyze the message safely: headers, sender, links and attachments, in a sandbox.
3. If it is malicious, find every copy in other mailboxes and remove them.
4. Block the sender, domain, links and file hashes at the email and web gateways.
5. Find out who clicked, opened the attachment or entered credentials.
6. For those users, reset passwords, revoke sessions and check their devices and accounts for misuse.
7. Tell the reporter the outcome, and warn other staff if the campaign is wide.
8. Record the case and feed it into training and into the simulation themes.
If the message was one of the organization's own simulations, the reporter gets immediate positive feedback.

User side:
1. Report through the official button or address; do not forward the message to colleagues.
2. Do not investigate by clicking the link "to see what happens".
3. Someone who did click, in a simulation or a real attack, gets an immediate notice and short follow-up training; repeat clickers get more training or tighter settings.

**Why it matters:** the first report is often the earliest warning of an attack on the whole organization; acting on it within minutes limits how many others are caught.

**Common confusions:** Deleting a suspicious email without reporting protects one person and leaves everyone else exposed. Resetting only the reporter's password misses the point: the people at risk are those who interacted and did not report. Making reporting easy (one click) matters more than making it detailed.

**Scenario:** Three employees report the same email with a link to a fake login page, and the gateway log shows that twelve people received it. The team should analyze it, remove all twelve copies, block the link, and identify and reset the credentials of anyone who visited the page. Only thanking the three reporters and deleting their copies is the closest wrong answer: nine copies would remain and any stolen passwords would stay valid.

### Anomalous behavior recognition: risky vs unexpected vs unintentional

Anomalous behavior recognition is training people to notice and report behavior, by people, accounts or systems, that departs from what is normal or safe. The objective names three kinds, separated mainly by intent and by whether the behavior is a choice, a surprise or a mistake.

| Kind | What it is | Intent | Examples |
|---|---|---|---|
| Risky | An action that knowingly or carelessly raises risk, often against policy | Deliberate or careless choice, usually not meant to harm | Disabling endpoint protection, sharing a password, installing unapproved software, propping open a secure door, uploading work files to personal storage |
| Unexpected | Activity outside the normal pattern for that user or system | Unknown: may be an attacker using the account, an insider, or innocent | A login at 3 a.m. from another country, sudden access to files never used before, a server sending large amounts of data out |
| Unintentional | An honest mistake that creates risk | None | Emailing a file to the wrong person, losing a USB drive, mistyping a web address, misconfiguring a sharing setting |

What to do in each case:
1. Risky: correct it and retrain; repeated or serious cases go to the manager under the acceptable use policy.
2. Unexpected: report it at once so the security team can investigate; it can signal a compromised account or an insider threat.
3. Unintentional: report it immediately without fear of blame so the damage can be limited, then improve training and add guard rails such as data loss prevention.
In all cases the user reports and does not investigate alone.

**Why it matters:** people notice things tools miss, and tools flag things people must explain. Early reports of odd behavior shorten the time an attacker or a mistake goes unnoticed.

**Common confusions:** Risky versus unintentional turns on choice: the person who disables antivirus chose to; the person who mistypes an address did not. Unexpected describes the pattern, not the motive, so it needs investigation before any conclusion. A culture that punishes honest mistakes teaches people to hide them.

**Scenario:** A user turns off the endpoint protection agent because it slows down a video call. That is risky behavior. Unintentional is the closest wrong answer: the user acted on purpose, even though they did not intend harm.

### Policy and handbook training, and situational awareness training

These are two of the eight user training topics. Policy and handbook training makes sure people know the organization's security rules and where to find them. Situational awareness training teaches people to stay alert to what is happening around them, physically and online, and to report what looks wrong. Both are administrative, preventive controls.

Policy and handbook training:
1. Cover the rules that affect daily work: acceptable use, data handling, reporting incidents, clean desk, remote work.
2. Keep the documents easy to find, for example on the intranet.
3. Collect a signed or electronic acknowledgement, and track who has completed the training.
4. Repeat when policies change and at regular intervals.

Situational awareness training:
1. In the building: notice people without badges, someone following through a secure door (tailgating), someone watching a screen or keypad (shoulder surfing), unfamiliar devices plugged into ports or left on desks.
2. Online: stay suspicious of unexpected links, attachments, calls and text messages every day, not only during a training week.
3. Away from the office: be aware of who can see or hear your work in public places.
4. Know how to report: who to call and that reporting is welcome.

**Why it matters:** users cannot follow rules they have never seen, and an acknowledgement makes them accountable. Alert staff are a detection layer that covers gaps cameras and software miss.

**Common confusions:** Acknowledging a policy shows the person was told, not that they understand or comply, so training and checks are still needed. Situational awareness is not suspicion of every colleague; it is noticing what is out of place and reporting it rather than confronting it alone.

**Scenario:** An employee holds the door for a stranger carrying boxes who has no badge, because it seemed polite. The training that addresses this is situational awareness (and the physical access rules in the handbook). Password management training is the closest wrong answer: the failure was about noticing and challenging an unbadged person, not about credentials.

### Insider threat awareness training

An insider is any person who has, or once had, legitimate access to an organization's resources or inside knowledge of them: its staff, buildings, data, equipment, networks and systems. Employees, contractors and vendors all count. An insider threat is the risk that such a person uses that access or knowledge to harm the organization, on purpose or not. Awareness training teaches staff that this risk exists, what the warning signs are and how to report concerns. The threat actor itself is covered in Domain 2.

Kinds of insider threat:
1. Unintentional, negligent: knows the rules and ignores them, such as letting someone through a secure door.
2. Unintentional, accidental: an honest mistake, such as mailing a sensitive file to the wrong address or clicking a phishing link.
3. Intentional (malicious): acts deliberately for personal gain or out of a grievance, such as after a missed promotion or a dismissal.
4. Collusive or third party: an insider working with an outside attacker, or a contractor misusing granted access.

Warning signs to report:
1. Access to data or systems outside the person's role, or at unusual hours.
2. Copying or collecting large amounts of data, especially before leaving.
3. Attempts to bypass controls or to get others' credentials.
4. Open resentment, combined with any of the above.

Controls that training pairs with:
1. Least privilege and separation of duties.
2. More than one approval for critical changes.
3. Monitoring that alerts on changes to sensitive files.
4. Prompt removal of access when someone leaves.

**Why it matters:** insiders already have legitimate access and know where valuable data is, so perimeter defenses do not stop them; coworkers are often the first to notice.

**Common confusions:** Most insider incidents are mistakes or carelessness, not malice. Reporting a concern is not an accusation; the security or HR team investigates. An insider threat is different from an outside attacker using a stolen account, although both can look alike in logs.

**Scenario:** An engineer who has resigned to join a competitor starts downloading design files unrelated to his current project late at night. A colleague who notices should report it to security. Confronting him directly is the closest wrong answer: it may warn him and it puts the colleague in the role of investigator.

### Password management training

Password management training teaches users how to create, store and protect their credentials. It turns the organization's password standard into everyday habits and is a preventive control for confidentiality.

What users are taught:
1. Use long passwords or passphrases; a phrase of several unrelated words is long and easier to remember.
2. Use a different password for every account, so one breached site does not open the others (attackers replay stolen passwords on other sites, called credential stuffing).
3. Use a password manager to generate, store and fill passwords, protected by one strong master passphrase.
4. Turn on multifactor authentication (MFA) wherever offered.
5. Never share a password, including with IT staff or a manager; genuine support staff do not need it.
6. Do not write passwords on notes near the device or store them in plain files.
7. Change a password at once if it may have been exposed, and report it.

How it is reinforced: technical settings enforce what can be enforced (minimum length, blocklist checks, MFA), for example through directory group policy, so training covers the parts only people can do, such as not reusing and not sharing.

**Why it matters:** stolen and reused passwords are among the most common ways into systems; good habits plus MFA defeat most of those attempts.

**Common confusions:** Complexity rules and frequent forced changes are no longer recommended; length, uniqueness and blocklist checks are. A password manager is safer than reusing memorable passwords, even though it concentrates them. Training supports the password standard (see `### Password standard and access control standard`); it does not set the rules.

**Scenario:** A user's password for a shopping site is exposed in a breach, and the same password protects their work email. The habit that would have contained this is using a unique password per account, with a password manager. Making the password more complex is the closest wrong answer: a complex password that is reused is still exposed everywhere once one site leaks it.

### Removable media and cables training

This training teaches users that USB drives, memory cards, external disks, charging cables and similar devices can carry malware or act as attack tools, and sets the rules for using them. It is a preventive control.

The risks:
1. Malware on removable media runs when the drive is opened or through autorun, and can cross into networks that are not connected to the internet.
2. Baiting: drives left in a car park or lobby, or mailed as gifts, rely on curiosity ("Salaries", "Confidential").
3. Malicious devices: something that looks like a drive or cable can present itself as a keyboard and type commands (keystroke injection), or act as a network tap.
4. Charging cables and public charging ports can carry data as well as power.
5. Data loss: an unencrypted drive that is lost exposes everything on it.

Rules users are taught:
1. Never plug in a found, gifted or unknown drive or cable; hand it to the security team.
2. Use only organization-approved, encrypted media, and only when there is a business need.
3. Use your own charger and a wall socket; avoid unknown charging stations and borrowed cables.
4. Do not move work data to personal drives.
5. Report lost media at once.

Technical backing: disabling autorun, blocking or limiting USB storage by policy and endpoint controls that stop untrusted programs running from removable drives.

**Why it matters:** one plugged-in device bypasses the firewall and email filter entirely, because the user carries the attack past them.

**Common confusions:** The danger is not only files: a device can attack simply by being plugged in, without the user opening anything. Encryption on approved media protects data if the drive is lost; it does not make an unknown drive safe to plug in.

**Scenario:** An employee finds a USB stick labeled "Bonus list" by the office entrance. The correct action is to hand it to security without plugging it in. Plugging it into a spare computer to find the owner is the closest wrong answer: that is exactly the action baiting counts on.

### Social engineering awareness training

Social engineering is manipulating people, instead of breaking technology, to get information or access, often by posing as someone with a plausible reason to ask: a new employee, a repair worker, an executive, the help desk. This training teaches staff to recognize the manipulation and to verify before acting. The attack types themselves are detailed in Domain 2; in this objective, social engineering means the training topic.

What staff learn to recognize:
1. Pretexting and impersonation: a made-up story or identity that makes the request sound normal.
2. Phishing by email, vishing by phone and smishing by text message.
3. Pressure tactics: urgency, authority ("the director needs this now"), fear, flattery, an appeal for help.
4. In-person tricks such as tailgating through a door.
5. Requests that skip the normal process: a payment outside the system, a password over the phone, a secrecy demand.

What staff learn to do:
1. Slow down; pressure to act immediately is itself a warning sign.
2. Verify the person's identity through a separate channel you already trust, such as a known phone number.
3. Follow the process even for senior people; real executives accept verification.
4. Never give credentials or internal details to an unsolicited caller or visitor.
5. Report the attempt, successful or not, so others can be warned.

**Why it matters:** an attacker who talks a person into resetting a password or wiring money needs no malware, and technical controls rarely stop a willing, deceived user.

**Common confusions:** Social engineering is the broad category; phishing is one form of it. Verifying through the contact details in the suspicious message is not verification. Awareness training reduces success rates but never to zero, so processes such as dual approval for payments must back it up.

**Scenario:** A caller says he is from IT, sounds rushed and asks a receptionist to read out the code just sent to her phone so he can "fix her account". She should refuse, end the call, contact the help desk on the known number and report it. Reading the code because the caller knew her name and department is the closest wrong answer: such details are easy to find and are part of the pretext.

### Operational security (OPSEC) training

Operational security (OPSEC) is the practice of keeping adversaries from piecing together sensitive information out of small, individually harmless details revealed by everyday activity. As a formal process it has five steps: identify critical information, analyze threats, analyze vulnerabilities, assess risk and apply countermeasures. User training applies that thinking to daily behavior and protects confidentiality.

What users are taught:
1. Think like an attacker: what could someone learn from what I post, say, wear or leave visible?
2. Social media: do not post work details such as projects, travel plans, internal systems, badge photos or pictures with screens and whiteboards in the background.
3. Conversations: do not discuss confidential matters in lifts, trains, cafes or on calls in public.
4. Clean desk and clear screen: lock the screen when leaving, put papers away, collect printouts.
5. Dispose of documents and media securely instead of in ordinary bins.
6. Be careful with out-of-office messages and public profiles that reveal who is away and who covers what.

**Why it matters:** attackers build convincing phishing and impersonation from exactly these scraps: a job title from a profile, a project name from a post, a supplier's name from a photo.

**Common confusions:** OPSEC is not secrecy for its own sake and does not cover only classified material; it protects ordinary details that become sensitive when combined. It overlaps with situational awareness, but the focus differs: situational awareness is noticing threats around you, OPSEC is controlling what you give away.

**Scenario:** An engineer posts a photo celebrating a system launch; the picture shows a monitor with internal server names and a sticky note. The training that addresses this is operational security. Phishing recognition is the closest wrong answer: no one sent the engineer a deceptive message; he leaked information through normal behavior.

### Hybrid and remote work security training

This training covers working securely outside the office: at home, while traveling and in shared spaces. Outside the office, the organization's network and physical protections are missing, so more depends on the user and the device.

What users are taught:
1. Use the organization's virtual private network (VPN) or secure access service for work systems, especially on any network you do not control.
2. Secure home Wi-Fi: change the router's default administrator password, keep its firmware updated and use current Wi-Fi encryption (WPA3 or WPA2 with AES, never legacy WEP or TKIP).
3. Avoid public Wi-Fi for work where possible; if it must be used, confirm the network name with staff and connect the VPN at once.
4. Keep work devices for work: no family use, no personal software, and no work data on personal devices unless a policy allows it.
5. Keep devices updated and use multifactor authentication (MFA).
6. Protect the screen and conversations: privacy filters, awareness of shoulder surfing, calls where others cannot overhear.
7. Physically protect devices: never leave them in cars or unattended in public, and lock the screen at home too.
8. Report lost or stolen devices immediately so they can be locked or wiped.

**Why it matters:** a remote worker's laptop and home network are an extension of the corporate network; a compromise there can travel inward over the VPN.

**Common confusions:** A VPN protects traffic in transit across an untrusted network; it does not clean an infected device or make a phishing site safe. Home networks are not "trusted" just because they are private. Remote work rules are part of the acceptable use policy and handbook, so they are mandatory.

**Scenario:** An employee working from a hotel connects a work laptop to the hotel Wi-Fi and opens the finance system directly. The practice that was skipped is connecting through the VPN first. Using a privacy screen is the closest wrong answer: it stops people looking at the display but does nothing for traffic on an untrusted network.

### Awareness reporting and monitoring: initial vs recurring

Reporting and monitoring measure whether the awareness program is changing behavior. The objective names two kinds: initial and recurring.

| | Initial | Recurring |
|---|---|---|
| When | At the start of the program or of a new activity | At regular intervals afterward (monthly, quarterly) |
| Purpose | Set the baseline to compare against | Show trends, prove improvement, find weak spots |
| Example | A first phishing simulation shows 30% of staff click | Monthly simulations show the click rate falling to 8% and reports rising |

What is measured:
1. Phishing simulation results: click rate, credential entry rate, report rate.
2. Training completion and assessment scores.
3. Reports of real suspicious events by staff.
4. Incidents caused by user actions.
5. Behavior change over time, such as MFA adoption, and knowledge checks before, right after and some months after training.
6. Results by department or role, to target extra help.

How the numbers are used:
1. Compare recurring results with the initial baseline.
2. Report trends to management and IT, showing how the control is performing.
3. Aim extra training at groups or people who keep struggling.
4. Change content that is not working.

**Why it matters:** without a baseline nobody can show the program works, and without recurring measurement nobody notices when behavior slips back.

**Common confusions:** Track good behavior (reports) as well as failures (clicks); a falling click rate with a falling report rate may just mean easier test emails. Some sources read the two terms at the level of one user: initial is the first time a person does something risky, answered with training, and recurring is the same person repeating it, which calls for more help. The situation described shows which reading applies.

**Scenario:** Before any training begins, a security team sends a simulated phishing email to all staff purely to record the starting click rate. That is initial reporting (the baseline). Recurring is the closest wrong answer: it describes the repeated measurements that follow.

### Awareness program development vs execution

These are the two stages of running an awareness program. Development is planning and building it; execution is delivering and running it. Results from execution feed back into development, so the program keeps improving.

Development, in order:
1. Identify risks and learning needs: what do incidents, audits and simulations show people get wrong?
2. Identify audiences and roles: all staff, managers, administrators, developers, finance.
3. Match needs to audiences and check what each audience already knows.
4. Set measurable goals, for example halving the click rate in a year.
5. Choose topics and formats: short online modules, live sessions, simulations, posters, exercises.
6. Build or buy the content, tailored to job functions and compliance requirements.
7. Get leadership approval and budget.

Execution, in order:
1. Announce the program and schedule sessions.
2. Deliver training online or in person, and run campaigns and exercises.
3. Track participation and completion.
4. Collect results and feedback.
5. Report metrics to managers and IT.
6. Adjust: feed what was learned back into development.

**Why it matters:** content built without analyzing needs wastes people's time on the wrong topics; delivery without tracking cannot show who was trained or whether it worked.

**Common confusions:** Development comes first; launching ready-made videos without identifying audiences and goals skips it. Execution is not a one-off launch: it repeats. Measuring results belongs with reporting and monitoring, which links the two stages.

**Scenario:** A team interviews department heads, reviews last year's incidents and decides that finance staff need a module on payment fraud, with a goal of 100% completion in a quarter. That work is development. Execution is the closest wrong answer: nothing has been delivered to learners yet.

### Choosing the security awareness practice (decision path)

This objective is applied to situations: a description of what happened is matched to the awareness practice that fits. Work from the goal or the clue to the practice, and check the "not for" column before deciding.

| Goal or clue in the scenario | Practice to choose | When NOT to choose it |
|---|---|---|
| Measure or practice how staff react to deceptive email | Phishing campaign (simulation) | Not for a real attack in progress; that needs the response process |
| A user is looking at a suspicious message | Recognizing a phishing attempt: stop, verify by a separate channel, report | Not "reply to ask if it is real" |
| Users have reported a suspicious message | Responding to reported messages: analyze, remove all copies, block, reset affected credentials, thank reporters | Not just deleting the reporter's copy |
| Someone deliberately bypasses a control for convenience | Risky behavior: correct and retrain | Not unintentional: a choice was made |
| Activity outside the normal pattern (odd hour, odd place, new data) | Unexpected behavior: report for investigation | Not for a known honest mistake |
| An honest mistake exposed data | Unintentional behavior: report without blame, add guard rails | Not disciplinary action first |
| Staff do not know the rules | Policy and handbook training with acknowledgement | Not a technical control |
| Stranger without a badge, someone watching a screen | Situational awareness | Not password training |
| Coworker hoarding data before leaving | Insider threat awareness: report to security | Not confronting the person |
| Reused or shared passwords | Password management: unique passwords, manager, MFA | Not more complexity rules |
| Found USB drive, unknown charger | Removable media and cables: do not plug in, hand to security | Not "check it on a spare PC" |
| Caller or visitor pressures someone to skip a process | Social engineering training: verify out of band | Not verifying with contact details the requester supplied |
| Work details leaking through posts, talk, desks | Operational security | Not phishing training |
| Working from home, hotels, cafes | Hybrid and remote work training: VPN, secured Wi-Fi, device care | Not office physical security |
| Need a starting measurement | Initial reporting (baseline) | Not recurring |
| Need trends over time | Recurring reporting | Not a single baseline |
| Planning audiences, goals, content | Development | Not execution |
| Delivering, scheduling, tracking | Execution | Not development |

How to work a scenario:
1. Decide who is acting: a user (recognize, report), the security team (respond, measure) or the program owner (develop, execute).
2. Find the clue word: deliberate, unusual, mistake, found, caller, posted, remote, baseline, trend.
3. Pick the practice in the row that matches, and prefer the option that includes reporting.
4. Rule out options in which the user investigates alone, confronts someone, or verifies through the suspicious channel.

**Why it matters:** the right practice fixes the actual cause; the wrong one spends training time without changing the behavior that created the risk.

**Common confusions:** Training is rarely the best response when the situation is an attack already under way; containment comes first and training follows. When two rows seem to fit, intent usually separates them: choice (risky), mistake (unintentional), unknown (unexpected).

**Scenario:** A new starter plugs a phone charger borrowed from a conference stand into a work laptop, and the same week posts a photo of her badge online. Two topics apply: removable media and cables for the charger, and operational security for the badge photo. Choosing phishing training for both is the closest wrong answer: neither event involved a deceptive message.
