# Domain 1: General Security Concepts
Checked as of 2026-11 for SY0-701.

## 1.1 Comparing the categories and types of security controls

Depth asked: compare and contrast. A good answer places a control on BOTH axes (category = how it is carried out, type = what job it does) and names the one feature that separates it from the look-alike answer.

### Technical controls (logical controls, control category)

A technical control is a safeguard that a system enforces by itself through hardware, software or firmware, with no person deciding each case. It answers the question "does a machine apply this rule?" It can protect any leg of the CIA triad (confidentiality, integrity, availability), and the same control can serve several control types.

**How it works:**
1. Someone writes the rule once (a firewall rule, a permission, an encryption setting). Writing the rule is a managerial or operational act.
2. The system then applies the rule automatically to every request, every time.
3. Results are usually logged by the system, which feeds detective work later.

**Examples:** firewall and router access control lists, antivirus and endpoint detection, operating system file permissions, account lockout after failed logins, disk and transport encryption, multifactor authentication prompts, intrusion detection and prevention systems.

**Why it matters:** technical controls scale. One rule protects thousands of users without extra staff, and it never gets tired or skips a check on a busy day. Their weakness is that they only enforce what they were configured to enforce, so a wrong rule is applied perfectly, everywhere.

**Common confusions:** A written firewall policy is managerial, while the firewall applying it is technical. A person reviewing firewall logs each morning is operational, even though the logs come from a technical control. Encryption is technical even when a policy requires it. "Logical control" is another name for the same category.

**Scenario:** A clue says "the server rejects any connection that does not present a valid client certificate." The answer is a technical control, because the server decides each connection with no human involved. Operational is the closest wrong answer: it fails because no person performs the check.

**Example:** a host firewall rule such as `deny inbound tcp any -> 10.0.5.20 port 3389` is a technical, preventive control. The same firewall's log line `DENY 203.0.113.9 -> 10.0.5.20:3389` is the raw material for a detective control.

### Managerial controls (administrative controls, control category)

A managerial control is a safeguard that works by deciding, directing and overseeing security: policies, standards, risk assessments, security plans and governance decisions. It shapes what everyone else does rather than blocking anything itself. NIST (the US National Institute of Standards and Technology) older publications group controls as management, operational and technical, and the SY0-701 term "managerial" maps to that "management" group.

**How it works:**
1. Leadership assesses risk and sets direction (a risk assessment, a security program plan).
2. The direction becomes documents: policies, standards, procedures and requirements for vendors and staff.
3. Other controls (technical, operational, physical) are chosen and funded to carry the direction out.
4. Management reviews results and adjusts, which is why audits and assessments also sit here.

**Examples:** an information security policy, an acceptable use policy, a data classification standard, a risk assessment, a vendor security requirement, a change management policy, a security awareness program plan (the plan, not the training session).

**Why it matters:** without managerial controls, technical tools are bought and configured with no agreed goal, and nobody can show an auditor or a court what the organization required. They also set accountability: who owns a risk and who approves exceptions.

**Common confusions:** "Administrative control" is another name for the same category. A policy is managerial in category and usually directive in type. A training session delivered to staff is operational because people carry it out day to day, while the decision to require training is managerial. Managerial does not mean "done by managers": a risk register maintained by an analyst is still managerial.

**Scenario:** A clue says "the company performs an annual risk assessment and updates its security plan." The answer is managerial. Operational is the closest wrong answer: it fails because nothing here is a routine task performed by people to protect systems day to day; it is oversight and planning.

**Example:** a policy line "All laptops storing customer data must use full-disk encryption" is managerial (category) and directive (type). The encryption itself, once turned on, is a separate technical control.

### Operational controls (control category)

An operational control is a safeguard carried out mainly by people as part of their daily work, rather than by a machine or by a governing document. It covers the routine security tasks that keep the program running: guards checking badges, staff reviewing logs, administrators following a hardening checklist, and awareness training being delivered.

**How it works:**
1. A managerial decision says the task must happen (for example, "review privileged access monthly").
2. Named people perform the task on a schedule or when an event occurs.
3. The result is recorded so the task can be audited and improved.

**Examples:** security guards checking identification, delivering security awareness training, reviewing logs and alerts by hand, configuration and patch procedures performed by administrators, incident response activities, media handling and backup rotation done by staff, user access reviews.

**Why it matters:** many threats need human judgment: a stranger with a convincing story, an alert that looks odd but is not yet malicious. Operational controls catch what a rule cannot express. Their cost is people's time, and their weakness is human error and inconsistency.

**Common confusions:** A guard is the classic case of two categories. The guard as a person doing checks is operational; the guard booth, fence and gate are physical. NIST also lists guards among physical access controls, so a guard can fairly be called physical when the focus is on protecting the site and operational when the focus is on the work the person does. Accept either and follow what the clue stresses. Log review by an analyst is operational; an automated alert rule is technical. Training content approved by leadership is managerial; delivering it is operational.

**Scenario:** A clue says "help desk staff must call the employee back on the number in the HR system before resetting a password." The answer is operational: people perform a verification step in their daily work. Technical is the closest wrong answer and fails because no system enforces the call back.

**Example:** a weekly checklist "review the list of accounts added to the Domain Admins group and confirm each with its owner" is an operational, detective control.

### Physical controls (control category)

A physical control protects the physical environment: buildings, rooms, equipment and the people in them. It works by putting something tangible in the way, watching an area, or keeping power and climate safe. NIST groups these under physical and environmental protection: access to facilities, monitoring of physical access, and supporting utilities such as power and cooling.

**How it works:**
1. Define the protected areas and their entry points (perimeter, building, server room, rack).
2. Place barriers and entry controls at each point (fence, locked door, badge reader, vestibule).
3. Watch and record access (cameras, sensors, access logs) so violations are detected.
4. Protect the supporting environment (fire suppression, backup power, climate control).

**Examples:** fences, bollards, locks, badge readers, access control vestibules, security cameras, motion and pressure sensors, lighting, locked server racks, fire suppression.

**Why it matters:** an attacker standing next to the server can bypass most technical controls: pull a drive, plug in a device, or simply carry equipment out. Physical controls also protect availability against fire, flood and power loss.

**Common confusions:** Physical is a category, not a type: a fence is physical in category and preventive or deterrent in type. A camera is physical in category and detective (and deterrent when visible) in type. A badge reader is physical even though it contains electronics, because it controls entry to a space; the badge system's database rules can be described as technical. Do not answer "physical" when the question asks for the control type.

**Scenario:** A clue says "concrete posts were installed in front of the lobby glass." The answer for the category is physical; for the type it is preventive (vehicles are stopped). Technical is the wrong category because nothing is enforced by software.

**Example:** "Server room door: badge plus PIN, door held open alarm after 30 seconds, camera covering the door" is three physical controls with three types: preventive (lock), detective (alarm), detective and deterrent (camera).

### Technical vs managerial vs operational vs physical controls (control categories compared)

The four categories answer one question: how is the control carried out? A system enforces a technical control; leadership decides and documents a managerial control; people perform an operational control in daily work; a physical control protects a space or equipment. Category is independent of type (preventive, detective and so on), so every control gets one of each.

| Category | Carried out by | Decisive clue | Typical example |
|---|---|---|---|
| Technical | A system, automatically | "the system blocks, encrypts, logs" | Firewall rule, MFA prompt |
| Managerial | Governance and documents | "policy, risk assessment, plan" | Security policy, risk register |
| Operational | People doing routine work | "staff check, review, train" | Guard checking IDs, log review |
| Physical | Tangible barriers and monitoring of spaces | "fence, lock, camera, door" | Bollards, badge reader |

**How to classify, step by step:**
1. Ask who or what acts at the moment the control works: a machine (technical), a person (operational), or a tangible object in a space (physical).
2. If nothing acts in the moment and the control is a decision, rule or assessment, it is managerial.
3. Then, separately, decide the type from its purpose (see the control types comparison).

**Why it matters:** audits and frameworks expect a mix. Relying only on technical controls leaves no policy to enforce; relying only on policy leaves nothing that actually stops an attacker.

**Common confusions:** A policy that says "use encryption" and the encryption itself are two controls in two categories. Training is operational when delivered, managerial when it is the program decision. A guard's work is operational (guards also count as a physical security measure), the guard shack physical. "Logical" equals technical and "administrative" equals managerial.

**Scenario:** A clue lists "a clean desk policy, a shredder in every office and a cleaning crew that checks desks at night." The policy is managerial, the shredder physical, the nightly check operational. Picking "physical" for the policy is the common mistake: a document is not a barrier.

**Worked mini-example:** "Requirement: badge in to the data center" (managerial, directive). "Badge reader on the door" (physical, preventive). "VPN gateway rejects a revoked user certificate" (technical, preventive). "Guard reviews the badge log each shift" (operational, detective).

### Preventive controls (control type)

A preventive control stops an unwanted event before it happens by blocking it, not just by discouraging it. It is the most common type and acts before an incident. It can belong to any category: a firewall rule (technical), a lock (physical), separation of duties written into a policy and enforced in workflow (managerial with technical support).

**How it works:**
1. The control sits in the path of the action (a network packet, a door, a login).
2. It checks the action against a rule (allowed address, valid badge, correct password).
3. It refuses the action when the rule is not met, so the harm never starts.

**Examples:** firewall deny rules, account lockout, multifactor authentication, door locks, bollards, an access control vestibule, encryption (it prevents disclosure of stolen data), least privilege permissions, application allow lists.

**Why it matters:** an event that never happens costs nothing to clean up. Preventive controls are cheaper than incident response. No preventive control is perfect, so they are paired with detective and corrective controls at each layer (defense in depth).

**Common confusions:** Preventive blocks; deterrent only discourages. A locked gate is preventive, a "No trespassing" sign is deterrent. An intrusion prevention system (IPS) is preventive because it drops traffic, while an intrusion detection system (IDS) is detective because it only alerts. Encryption is often called preventive because it prevents unauthorized reading of data, even though the data can still be stolen.

**Scenario:** A clue says "after five wrong passwords, the account is locked for 30 minutes." The answer is preventive: further guessing is blocked. Deterrent is the closest wrong answer and fails because the lockout does not depend on the attacker's choice to stop; it simply refuses.

**Example:** web server rule `allow tcp any -> 10.0.8.10:443; deny ip any -> 10.0.8.10` is a preventive technical control: everything except HTTPS to that server is blocked before it reaches it.

### Deterrent controls (control type)

A deterrent control discourages an attacker from trying, usually by raising the perceived risk or effort, but it does not physically or technically stop the attempt. It works on the attacker's decision. A determined attacker can ignore it.

**How it works:**
1. The control is made visible or known to potential attackers.
2. It signals a consequence (being seen, recorded, prosecuted, disciplined) or more effort than the target is worth.
3. Some attackers choose another target or give up; the rest are unaffected.

**Examples:** warning signs, a login banner stating that use is monitored and misuse may be prosecuted, visible cameras, a visible guard at reception, bright lighting, a threat of disciplinary action in a policy, a fence that is easy to climb but signals a boundary.

**Why it matters:** deterrence is cheap and reduces the volume of opportunistic attempts, which lowers the load on detective and response controls. Physical security guidance often puts deterrence first because an attack that never starts needs no response.

**Common confusions:** Deterrent vs preventive: if the attempt is physically or technically impossible, the control is preventive; if it is only discouraged, deterrent. Deterrent vs directive: a directive control tells people what to do ("Authorized personnel only"), a deterrent warns of what happens if they do not ("Trespassers will be prosecuted"). Many controls are both; answer with the type the clue stresses. A visible camera is deterrent and detective at once.

**Scenario:** A clue says "every login screen shows a notice that activity is monitored and unauthorized use is subject to criminal penalties." The answer is deterrent. Preventive is the closest wrong answer and fails because the banner does not stop anyone from logging in. (US federal systems must show such a system use notification before access, NIST control AC-8.)

**Example:** a sticker on a server cabinet "This equipment is alarmed and monitored by CCTV" is a physical, deterrent control; the alarm behind it is a separate detective control.

### Detective controls (control type)

A detective control identifies and records that something happened, or is happening, so people can respond. It does not stop the event. Detective controls operate during or after the event and feed corrective action.

**How it works:**
1. The control watches a source: logs, network traffic, a door, a camera view, file hashes.
2. It compares what it sees with a rule or a normal baseline.
3. It raises an alert or creates a record when something does not match.
4. A person or process responds; detection without response achieves little.

**Examples:** an intrusion detection system (IDS), log review, security information and event management (SIEM) alerts, motion sensors, cameras that are monitored or reviewed, file integrity monitoring, audits, honeypots and honeytokens, a door left open alarm.

**Why it matters:** attackers sometimes get past every preventive layer. Detection limits how long they stay unnoticed, and the records it keeps are what investigators and auditors rely on afterwards. NIST's guidance on monitoring physical access gives access outside normal working hours and out-of-sequence access as examples of suspicious events to look for in access logs, and the same idea applies to systems.

**Common confusions:** IDS is detective, IPS is preventive. A camera that records but is never reviewed is still detective in design, but its value depends on review. An audit is detective even though it is a managerial or operational activity. Detective is not corrective: discovering malware is detective, removing it is corrective.

**Scenario:** A clue says "an alert fires when a file on the web server changes outside the approved release window." The answer is detective: the change already happened and was recorded. Preventive is the closest wrong answer and fails because nothing blocked the change.

**Example:** SIEM alert `5 failed logins for admin from 198.51.100.7 in 60 s, then 1 success` is a detective control at work; locking the account afterwards would be a corrective step.

### Corrective controls (control type)

A corrective control acts after an incident to limit the damage and return things to a working, secure state. It repairs, removes or restores. Some frameworks split off a separate "recovery" type for restoring normal operation; SY0-701 folds that into corrective.

**How it works:**
1. A detective control or a report reveals the incident.
2. The corrective control contains the harm (isolate a host, kill a process, disable an account).
3. It removes the cause (delete malware, patch the flaw, close the misconfiguration).
4. It restores service and data (reimage, restore from backup), then lessons feed back into preventive controls.

**Examples:** restoring files from backup after ransomware, reimaging an infected laptop, applying an emergency patch after exploitation, an endpoint tool quarantining a malicious file, fire suppression activating, revoking a stolen certificate, resetting a compromised password.

**Why it matters:** corrective controls decide how long an outage lasts and how much data is lost. A backup that has never been restore-tested is a corrective control that may not work when needed.

**Common confusions:** Corrective and compensating are the pair most often mixed up. Corrective acts after an incident; compensating replaces a control you cannot put in place, before anything has happened. Corrective vs detective: noticing the infection is detective, cleaning it is corrective. Patching is preventive when done before exploitation and corrective when done to fix an exploited system; the timing in the clue decides.

**Scenario:** A clue says "after the ransomware outbreak, the team rebuilt the file server and restored last night's backup." The answer is corrective. Compensating is the closest wrong answer and fails because nothing was substituted for a missing control; damage was repaired after the event.

**Example:** incident ticket "Host WS-2231 quarantined by endpoint agent, malicious file removed, user password reset" lists three corrective actions in order: contain, eradicate, restore trust.

### Compensating controls (control type)

A compensating control is an alternative safeguard used when the control that a standard or baseline expects cannot be put in place, for cost, technical or business reasons. It must give comparable protection against the same risk. NIST defines it as a management, operational or technical safeguard used in place of a recommended control while offering equivalent or comparable protection.

**How it works:**
1. Identify the required control and why it cannot be used (a legacy system cannot run an agent, a vendor forbids patching).
2. Identify the risk the missing control was meant to reduce.
3. Choose one or more substitutes that reduce that same risk (isolation, extra monitoring, stricter access).
4. Document the exception, get it approved, and review it until the original control becomes possible.

**Examples:** putting an unpatchable industrial controller on its own network segment with strict access lists, adding extra logging and review where separation of duties is impossible in a two-person office, requiring a jump server with MFA for a system that cannot support MFA itself, using a host IPS on one critical server to back up a missing network IPS.

**Why it matters:** real organizations always have exceptions. Compensating controls let them stay protected and keep a documented, approved answer for auditors instead of an unmanaged gap.

**Common confusions:** Compensating is about substitution, corrective is about repair after an incident. A compensating control is not "a weaker control we chose because it was cheaper"; it must address the same risk to a comparable degree. Cue words: "cannot", "unable", "not supported", "legacy", "vendor will not allow".

**Scenario:** A clue says "the lab's imaging machine runs an old operating system that cannot be patched, so it was moved to an isolated VLAN reachable only from one workstation." The answer is compensating. Corrective is the closest wrong answer and fails because no incident happened; the isolation stands in for patching.

**Example:** exception record: "Required: endpoint agent on all hosts. Not possible on SCADA-HMI-02 (vendor support). Compensating: dedicated VLAN, allow list of two IP addresses, daily log review. Review date: quarterly."

### Directive controls (control type)

A directive control tells people what they must or must not do and relies on them to comply. It guides behavior through instructions, policies and signs, and it is usually backed by other controls that check compliance. It acts before an incident, by setting expectations.

**How it works:**
1. The organization states a required behavior (in a policy, a procedure, a contract, a sign).
2. People are told about it (onboarding, training, acknowledgement forms).
3. Compliance is checked by other controls (audits, monitoring), and violations have consequences.

**Examples:** an acceptable use policy, a requirement that staff lock their screens, a "Visitors must sign in at reception" sign, a procedure requiring two approvals for wire transfers, a contract clause requiring a vendor to report breaches within a set time, a standard naming approved encryption algorithms.

**Why it matters:** every other control needs a stated rule behind it. Directive controls also create accountability: a person who signed the policy cannot claim they did not know.

**Common confusions:** Directive vs deterrent: directive instructs ("Authorized personnel only"), deterrent warns of consequences ("Violators will be prosecuted"). Directive vs preventive: a sign saying "Do not prop this door open" is directive, a door that closes and locks by itself is preventive. Most policies are managerial in category and directive in type, but a sign is physical in category and directive in type.

**Scenario:** A clue says "new hires sign a document agreeing not to install unapproved software." The answer is directive: it states required behavior and relies on compliance. Preventive is the closest wrong answer and fails because nothing technically blocks an installation; an application allow list would be the preventive version.

**Example:** policy line "Employees must report a lost badge to security within one hour" is directive. The badge system disabling the badge when the report arrives is a separate technical, corrective control.

### Preventive vs deterrent vs detective vs corrective vs compensating vs directive (control types compared)

The six types answer one question: what is the control meant to achieve? Each control has one category (how it is carried out) and one or more types. Timing is the quickest sorter: directive, deterrent and preventive act before an incident, detective during or after, corrective after, and compensating whenever a required control is missing.

| Type | Job | Decisive clue | Example |
|---|---|---|---|
| Preventive | Blocks the event | "stops, blocks, denies" | Firewall deny rule, lock |
| Deterrent | Discourages the attempt | "warns, discourages, visible" | Warning banner, visible camera |
| Detective | Identifies and records | "alerts, logs, discovers" | IDS, log review, motion sensor |
| Corrective | Repairs after the event | "after the attack, restore" | Backup restore, reimage |
| Compensating | Substitutes for a missing control | "cannot, legacy, unable" | Isolated VLAN for unpatchable host |
| Directive | Instructs people | "must, policy, sign telling" | Acceptable use policy |

**How to decide, step by step:**
1. Did an incident already happen in the clue? Then corrective (repair) or detective (discovery).
2. Is the control standing in for one that cannot be used? Then compensating.
3. Does it physically or technically make the act impossible? Then preventive.
4. Does it only discourage? Then deterrent. Does it only instruct? Then directive.

**Why it matters:** a sound design covers every stage: something to discourage, something to block, something to notice, something to recover. A program with only preventive controls has no way to know when they fail.

**Common confusions:** One control can be several types: a visible camera is deterrent and detective; a guard can be preventive, deterrent and detective. Pick the type the scenario emphasizes. IDS vs IPS is the pair most often mixed up: detect vs prevent.

**Scenario:** A clue says "a sign at the data center door reads: Cameras in use, trespassers will be prosecuted." The best answer is deterrent; directive would fit "Authorized staff only", and detective would fit the cameras themselves, not the sign.

### Classifying one control by category and type (worked method)

Every control gets two labels that do not depend on each other: a category (technical, managerial, operational, physical) for how it is carried out, and one or more types (preventive, deterrent, detective, corrective, compensating, directive) for what it achieves. Most classification errors come from answering the wrong axis or from forcing one label when the clue stresses another.

**How to do it:**
1. Read what the question asks for: "category" or "type". Answer only that axis.
2. For category, ask who or what acts at the moment the control works: a system (technical), a person in routine work (operational), a tangible barrier or monitored space (physical), a decision or document (managerial).
3. For type, ask what the control is FOR, using the timing of the clue: before (directive, deterrent, preventive), during or after (detective), after (corrective), or instead of something missing (compensating).
4. If several types fit, choose the one the scenario's wording stresses ("discourage" points to deterrent even if the camera also records).

**Worked examples:**

| Control | Category | Type(s) |
|---|---|---|
| Firewall blocking a known bad address | Technical | Preventive |
| Login banner warning of prosecution | Technical (shown by the system) | Deterrent |
| Acceptable use policy | Managerial | Directive |
| Guard checking badges at a desk | Operational (a guard is also a physical security measure) | Preventive, deterrent, detective |
| Visible security camera | Physical | Detective, deterrent |
| Restoring a database from backup | Operational or technical | Corrective |
| Isolating an unpatchable device on its own VLAN | Technical | Compensating |
| Annual risk assessment | Managerial | Detective fits best (finds weaknesses) |

**Why it matters:** frameworks and auditors ask for coverage on both axes. Mapping each control this way exposes gaps, for example no detective control on a system that has strong preventive ones.

**Common confusions:** A login banner is shown by a system but its purpose is to warn, so its type is deterrent, not preventive. Awareness training is operational (people deliver and follow it) and preventive or directive (it aims to stop mistakes and tells people what to do). A risk assessment is managerial; if a type is asked for, detective fits best because it discovers weaknesses rather than blocking anything.

**Scenario:** A clue asks "Which control CATEGORY is a security awareness training program?" and the answer options include "preventive". Preventive is a type, so it cannot be right; operational is the expected category for training delivered to staff, and managerial would fit only if the clue stressed the program decision itself.

## 1.2 Fundamental security concepts

Depth asked: summarize. A good answer defines each concept in one or two sentences, names what it protects or who does what, and gives the tool or control that delivers it.

### Confidentiality, Integrity, and Availability (CIA triad)

The CIA triad names the three goals that security protects. Confidentiality keeps information away from people and systems not authorized to see it. Integrity keeps information and systems from being changed in an unauthorized way, and makes changes detectable. Availability keeps information and services reachable and usable when authorized users need them. NIST defines information security as protecting these three goals.

**How each is delivered:**
1. Confidentiality: access controls and permissions, authentication (including MFA), encryption at rest and in transit, data classification, physical security of media.
2. Integrity: hashing to detect change, digital signatures and HMAC (hash-based message authentication code) to detect change and prove origin, version control, change management, input validation, write permissions.
3. Availability: redundancy (clustered servers, RAID, multiple network links), backups, patching, capacity planning, DDoS (distributed denial of service) protection, backup power and cooling.

**Why it matters:** every control can be traced to at least one leg, and every incident damages at least one: a leak hurts confidentiality, tampered records hurt integrity, an outage hurts availability. Business impact is usually stated in these terms, so risk and incident reports use them.

**Common confusions:** Encryption mainly serves confidentiality; hashing serves integrity, not confidentiality. A digital signature gives integrity, authentication and non-repudiation, but no confidentiality. Ransomware attacks availability (and, when data is stolen first, confidentiality too). NIST's integrity definition also includes authenticity and non-repudiation, which is why signatures sit under integrity. The legs can conflict: stronger confidentiality (more locks) can reduce availability if users are locked out.

**Scenario:** A clue says "an attacker changed the payee bank account in pending invoices but the data was never disclosed." The answer is integrity. Confidentiality is the closest wrong answer and fails because nothing was revealed; the harm is unauthorized modification.

**Worked mini-example:**

| Event | Leg harmed | Control that addresses it |
|---|---|---|
| Customer list emailed to a personal account | Confidentiality | Data loss prevention, access control |
| Log entries deleted to hide activity | Integrity | Write-once log storage, hashing |
| Web shop down under traffic flood | Availability | DDoS protection, redundancy |

### Non-repudiation

Non-repudiation is assurance that a specific party performed an action (sent, signed, approved) such that they cannot credibly deny it later, and a third party can verify it. In cryptography it comes from digital signatures: only the holder of a private key could have produced a signature that verifies with the matching public key. It supports the integrity leg of the CIA triad and provides accountability.

**How it works with a digital signature:**
1. The signer hashes the message and creates a signature with their private key, which only they hold.
2. The recipient, or any third party, verifies the signature with the signer's public key, usually taken from a certificate issued by a trusted certificate authority.
3. A valid signature shows the message is unchanged and came from that key holder. Because the key is not shared, the signer cannot claim someone else produced it.

**Why it matters:** contracts, payment approvals, code releases and legal evidence need proof of who did what. Without non-repudiation, a disputed approval comes down to one person's word against another's.

**Common confusions:** A plain hash proves integrity only: anyone can compute a hash, so it proves nothing about who made it. Symmetric methods such as HMAC cannot give non-repudiation, because both parties hold the same key and either could have produced the tag. Non-repudiation depends on the private key staying private: if the key is stolen, the signer can credibly deny the signature, so key protection (smart cards, TPM, HSM) matters. In a wider sense, logs that reliably tie actions to authenticated user accounts also support non-repudiation of actions.

**Scenario:** A clue says "a manager claims she never approved a payment; the company must prove she did." The answer is a digital signature on the approval (non-repudiation). HMAC is the closest wrong answer and fails because the server shares the HMAC key and could have produced the tag itself.

**Example:** an email signed with the sender's certificate shows in the mail client as "Signed by: a.rivera@example.org, verified". The recipient can show any third party that only the holder of that private key could have produced it.

### Authentication, Authorization, and Accounting (AAA framework)

AAA is the framework for controlling and recording access: authentication proves an identity, authorization decides what that identity may do, and accounting records what it actually did. It is preceded by identification, the claim of an identity (typing a username). AAA servers such as RADIUS (Remote Authentication Dial-In User Service) and TACACS+ (Terminal Access Controller Access-Control System Plus) centralize it for networks and devices.

**How it works, in order:**
1. Identification: the subject claims an identity (username, certificate subject, device name). A claim alone proves nothing.
2. Authentication: the subject proves the claim with one or more factors (password, token, biometric with a token, certificate).
3. Authorization: the system checks policy and grants specific rights (read this share, run these commands, join this VLAN). Authenticated does not mean authorized.
4. Accounting: the system logs the session: who, when, from where, what was done, how much data, when it ended.
The common wrong order puts authorization before authentication; a system cannot decide rights for an identity it has not verified.

**Why it matters:** central AAA means one place to disable a departing employee, one policy for every switch and VPN, and one audit trail for investigations, billing and compliance. Accounting records are what prove later who changed a configuration.

**Common confusions:** Identification is not authentication: a username is public. Authorization is not authentication: a contractor may log in successfully and still be denied the finance share. Accounting is not auditing: accounting collects records; auditing reviews them. RADIUS combines authentication and authorization in one reply and hides only the password; TACACS+ separates all three functions and obfuscates the whole packet body (see the RADIUS vs TACACS+ section).

**Scenario:** A clue says "the network team needs a record of which administrator entered each command on the core switches." The answer is accounting. Authorization is the closest wrong answer and fails because it decides which commands are allowed, not which were run.

**Example:** accounting record `2026-11-03 09:14:22 user=jlee nas=core-sw1 task=start cmd="configure terminal"` followed by a stop record when the session ends.

### Authenticating people (authentication factors and MFA)

Authenticating people means proving that a human user is who they claim to be, using authentication factors. The classic factor types are something you know (a password or PIN), something you have (a phone, token or smart card) and something you are (a biometric). SY0-701 also lists somewhere you are (location) as an attribute. Multifactor authentication (MFA) combines two or more DIFFERENT factor types.

**How it works:**
1. The user claims an identity.
2. The verifier asks for one or more authenticators bound to that account.
3. Each authenticator is checked (password against a stored hash, a one-time code against the expected value, a signed challenge against the registered public key).
4. Risk signals (unusual location, new device) can raise the bar and ask for more.

**Why it matters:** a password can be guessed, reused or phished. A second factor of a different type means a phished password alone is not enough. NIST's digital identity guidance requires two distinct factors for its middle and high assurance levels.

**Common confusions:** Two passwords, or a password plus a security question, is still one factor type (both are something you know), so it is not MFA. NIST does not accept a biometric as an authenticator on its own: it must be paired with a physical authenticator, which then counts as something you have. NIST treats location as a fraud signal that can trigger extra checks, not as a factor that replaces one. One-time codes sent by text message are restricted in NIST guidance because the phone network can be redirected. Details of MFA methods, passwordless and tokens belong to objective 4.6.

**Scenario:** A clue says "users enter a password and then answer a question about their first pet." The answer is single-factor authentication (two knowledge items). Calling it MFA is the mistake: the second item is the same type as the first.

**Example:** password (know) plus a code from an authenticator app on a registered phone (have) is MFA. Fingerprint unlock on a hardware security key that then signs a challenge combines are and have.

### Authenticating systems (device authentication with certificates)

Authenticating systems means proving that a device, server or service is the one it claims to be, and often that it is owned and managed by the organization. Devices cannot type passwords, so they usually present a digital certificate and prove they hold its private key. It supports confidentiality and integrity by keeping unknown devices off the network and keeping traffic from going to impostors.

**How it works:**
1. The organization's certificate authority (CA) issues a certificate to each managed device; the private key ideally lives in hardware such as a TPM (Trusted Platform Module).
2. When the device connects (to enterprise Wi-Fi, a VPN, a network access control check, a management server), it presents its certificate.
3. The server checks that the certificate chains to the trusted CA, is in date and is not revoked.
4. The device signs a challenge with its private key, proving it holds the key and not just a copy of the certificate.
5. Only then is the device authorized onto the network or service.

**Why it matters:** a stolen user password typed on a personal laptop should not reach internal systems. Device certificates let the network admit only company-managed devices. Servers prove their identity the same way in TLS, which stops users from sending data to a fake site.

**Common confusions:** A certificate alone proves nothing until the device shows it holds the matching private key. Device authentication is not user authentication; many networks require both (device certificate, then user MFA). A MAC (media access control) address is an identifier, not proof: it can be copied.

**Scenario:** A clue says "only laptops issued by the company may join the corporate wireless network, even with valid user passwords." The answer is device certificates issued by the company CA (authenticating systems). MAC address filtering is the closest wrong answer and fails because a MAC address can be spoofed and proves no ownership.

**Example:** certificate on a laptop: `Subject: CN=LT-04412.corp.example.org`, `Issuer: CN=Example Corp Device CA`, `Extended key usage: Client Authentication`, private key marked non-exportable in the TPM.

### Authorization models (in AAA)

In this objective, authorization models mean the structured ways a system decides what an authenticated subject may do, placing a layer such as roles, groups, attributes or rules between users and resources so permissions stay manageable. The full treatment of the models (role-based, attribute-based, mandatory, discretionary, rule-based, time-of-day) is in objective 4.6 under access control models.

**How a model works in general:**
1. Resources are labeled or grouped (a share, an application function, a record type).
2. Subjects are placed into the abstraction: a role, a group, a clearance, a set of attributes.
3. Rights are granted to the abstraction, not to each person.
4. At each request, the system evaluates the subject's abstraction against the resource and grants or denies.

**Why it matters:** granting every user rights to every resource one by one does not scale and cannot be audited: with 2,000 users and 500 shares, nobody can say who has what. With roles, a new accountant gets the "Accounts Payable" role and every right comes with it; when they leave, removing one membership removes all of it.

**Common confusions:** Authorization is not authentication: the model only runs after identity is proven. A group is a container for users; a role is a set of job rights; many systems implement roles with groups. Least privilege is a principle that any model should follow, not a model itself.

**Scenario:** A clue says "permissions are assigned to job functions such as nurse and pharmacist, and staff inherit them by job." The answer is role-based access control (see objective 4.6). Assigning rights to each user directly is the closest wrong answer and fails the clue's "inherit by job".

**Example:** role `HR-Viewer` granted read on `\\fs01\hr\policies`; user mlopez added to `HR-Viewer`; access check: mlopez requests read on that share, role match, granted.

### RADIUS vs TACACS+ (AAA protocols compared)

RADIUS (Remote Authentication Dial-In User Service) and TACACS+ (Terminal Access Controller Access-Control System Plus) are the two common protocols that carry AAA between a network device and a central server. RADIUS is typical for users gaining network access (VPN, enterprise Wi-Fi, remote access servers); TACACS+ is typical for administering network devices, where per-command authorization and command logging matter. Port numbers are in the Reference chapter.

| Feature | RADIUS | TACACS+ |
|---|---|---|
| Transport | UDP | TCP |
| AAA handling | Authentication and authorization combined in one Accept reply; accounting separate | All three are separate exchanges |
| What is protected | Only the user password is hidden, using the shared secret | Whole packet body obfuscated with the shared secret; header in clear |
| Typical use | Users joining the network | Admins running commands on switches and routers |

**How a TACACS+ admin session flows:**
1. Admin logs in to a switch; the switch sends an authentication request to the TACACS+ server.
2. Each command the admin enters is sent for authorization and allowed or refused.
3. Accounting records mark the start and stop of tasks, including commands entered.

**Why it matters:** per-command control and logging limit what a compromised or careless admin account can do, and they create the record needed after an outage.

**Common confusions:** TACACS+ "encrypting the whole packet" is common study wording; its standard (RFC 8907) states the obfuscation is not real encryption and requires running it over a protected management network. RADIUS is not obsolete; it remains standard for network access. Neither protocol is the authorization MODEL; they carry the decisions.

**Scenario:** A clue says "the company must allow junior admins to run show commands but not configuration commands on routers, and log every command." The answer is TACACS+. RADIUS is the closest wrong answer and fails because its authorization arrives once in the Accept reply, without per-command checks.

### Gap analysis (security gap assessment)

A gap analysis compares an organization's current security state with a desired target state, lists the differences (gaps), and produces a prioritized plan to close them. The target is usually a framework or standard: NIST Cybersecurity Framework (CSF), ISO/IEC 27001, an industry regulation, or the organization's own policy. It is a managerial activity and is detective in nature, because it discovers weaknesses rather than fixing them.

**How it works:**
1. Set the scope and the baseline to measure against (whole company, one business unit, one regulation). Choosing the framework first matters: without a target there is nothing to measure a gap against.
2. Gather evidence of the current state: policies, configurations, interviews, existing assessments, covering people, processes and technology.
3. Compare current against target, item by item. NIST CSF 2.0 calls these the Current Profile and the Target Profile.
4. Record each gap and rate it (often green, yellow, red, or by risk) so the worst gaps come first.
5. Write the action plan (owners, budget, deadlines). CSF suggests outputs such as a risk register or a plan of action and milestones (POA&M).
6. Implement, then repeat the analysis to show progress.
The common wrong order jumps from evidence straight to buying tools without the comparison and ranking steps.

**Why it matters:** leaders need to know where money does the most good. A gap analysis turns "are we secure?" into a costed list, and the same document shows auditors and customers that weaknesses are known and being addressed. A full analysis can take weeks or months.

**Common confusions:** A gap analysis is not a vulnerability scan: the scan finds technical flaws on hosts, the gap analysis compares the whole program to a standard. It is not a risk assessment, though it feeds one: the risk assessment rates threats and impact, the gap analysis measures distance from a target. It is not an audit, which checks compliance formally and usually independently; a gap analysis is often done before an audit to prepare.

**Scenario:** A clue says "before seeking ISO/IEC 27001 certification, the company compares its current controls with the standard's requirements to see what is missing." The answer is gap analysis. A penetration test is the closest wrong answer and fails because it tests whether attacks succeed, not how controls compare with a standard.

**Worked mini-example:**

| Requirement (target) | Current state | Gap | Rating |
|---|---|---|---|
| MFA for all remote access | VPN has MFA, webmail does not | Webmail lacks MFA | Red |
| Security awareness training yearly | Done for staff, not contractors | Contractors untrained | Yellow |
| Backups tested quarterly | Tested quarterly | None | Green |

### Zero Trust architecture (ZTA)

Zero Trust is a security model in which no subject, device or network location is trusted by default; every access request to a resource is authenticated, authorized and evaluated against policy, per session, before it is allowed. The idea is described by NIST SP 800-207. It replaces the older perimeter model, where anything inside the corporate network was trusted.

**How it works (the core ideas from NIST's tenets, paraphrased):**
1. Every data source and service counts as a resource that needs protection.
2. Being on the corporate network grants nothing; all communication is secured as if on a hostile network.
3. Access is granted per session, with the least privilege the task needs; access to one resource does not open another.
4. Decisions use dynamic policy built from identity, device state, the application and other signals such as time and location.
5. The organization monitors the security posture of every device it owns or allows, and treats unhealthy devices differently.
6. Authentication and authorization are strictly enforced before access and re-checked during sessions.
7. Telemetry about assets, traffic and requests is collected and used to improve policy.
Architecturally, decisions happen in the control plane (Policy Engine and Policy Administrator) and are enforced in the data plane (Policy Enforcement Point).

**Why it matters:** remote work, cloud services and stolen credentials made the "trusted inside" idea dangerous: one phished laptop inside the perimeter could reach everything. Zero Trust limits what any single compromise can reach (lateral movement) and moves checks close to each resource.

**Common confusions:** Zero Trust is a model and a set of principles, not a product you buy. It does not mean "trust no user ever"; it means trust is earned per request and never assumed from location. It still uses firewalls, VPNs and segmentation; they just stop being the only gate. Micro-segmentation is one way to implement it, not the definition.

**Scenario:** A clue says "a user who already logged in to the corporate VPN must still be re-authorized, with device health checked, before opening the HR application." The answer is Zero Trust. Perimeter (castle and moat) security is the closest wrong answer and fails because it would trust the user once inside the VPN.

**Example:** an access decision log: `subject=dkim@corp device=LT-0931 posture=compliant mfa=yes resource=hr-app action=read decision=ALLOW session=30m`.

### Zero Trust control plane vs data plane

NIST SP 800-207 splits a Zero Trust deployment into two logically separate planes. The control plane is where access decisions are made and communication paths are set up; the data plane is where the actual application traffic flows and where decisions are enforced. Separating them means attackers who reach the data plane cannot directly change the policy that governs it.

| Plane | Purpose | Components (SY0-701 list) |
|---|---|---|
| Control plane | Decide and configure | Policy Engine, Policy Administrator, policy-driven access control, adaptive identity, threat scope reduction |
| Data plane | Carry traffic and enforce | Subject/system, Policy Enforcement Point, implicit trust zones |

**How the planes work together:**
1. A subject in the data plane asks to reach a resource; the request hits a Policy Enforcement Point (PEP).
2. The PEP forwards the request over the control plane to the Policy Administrator (PA).
3. The Policy Engine (PE) evaluates the request and decides; the PA acts on the decision.
4. The PA tells the PEP over the control plane to open (or refuse) a path.
5. The subject's traffic then flows over the data plane to the resource, through the PEP.
NIST notes that a PEP has to be able to exchange messages on both planes.

**Why it matters:** if decision-making traffic and user traffic shared one channel, a compromised workstation could tamper with policy. Keeping the control plane separate, and not directly reachable by ordinary assets, protects the brain of the system.

**Common confusions:** The PEP sits in the data plane even though it receives instructions from the control plane. Adaptive identity and threat scope reduction are listed under the control plane because they are ways of DECIDING, not traffic paths. "Control plane" and "data plane" are also networking terms for routers; the idea is the same (decide vs forward), but here they name the Zero Trust components.

**Scenario:** A clue asks "In Zero Trust, in which plane does the component that grants or denies access reside?" The answer is the control plane (the Policy Engine). Data plane is the closest wrong answer and fails because it only enforces the decision.

**Example:** a gateway in front of a payroll server (PEP, data plane) receives `allow session 7f3a for subject alee to payroll:443 for 20 minutes` from the policy administrator (control plane).

### Adaptive identity (Zero Trust)

Adaptive identity means the amount of verification asked of a subject changes with context and risk, instead of being fixed. The decision considers who the user is, the device used, where and when the request comes from, and how normal the behavior looks. It sits in the Zero Trust control plane and feeds the access decision.

**How it works:**
1. Gather context for the request: user and role, device type and health, network and geolocation, time, the sensitivity of the resource, recent behavior.
2. Compute a risk level (low, medium, high) for this particular request.
3. Match the requirement to the risk: low risk proceeds with existing authentication, medium risk asks for a fresh MFA prompt, high risk is denied or limited to read-only.
4. Keep watching during the session; a change (new location, unusual download volume) can trigger re-authentication.
This follows NIST's tenet that access decisions use dynamic policy built from identity, device state and behavioral and environmental attributes.

**Why it matters:** the same login can be safe from a managed laptop in the office at 10:00 and suspicious from an unknown device abroad at 03:00. Fixed rules either annoy every user with constant prompts or wave through risky requests. Adaptive identity applies friction only where risk is.

**Common confusions:** Adaptive identity is not a fourth authentication factor; location and behavior are risk signals that decide WHEN to ask for factors (NIST treats geolocation as a fraud indicator, not a factor). It is not the same as federation or single sign-on, which share identity across systems. It is related to "risk-based" or "conditional" access, the names vendors often use.

**Scenario:** A clue says "a sign-in from a new country at an unusual hour triggers an extra verification step, while the same user from the office is not prompted." The answer is adaptive identity. Policy-driven access control is the closest wrong answer: it is the broader rule framework, while the clue stresses verification that adapts to context.

**Example:** policy table: `risk low: allow` / `risk medium: require MFA` / `risk high: block and alert`. A request from a known laptop on the office network scores low; the same account from an unmanaged device on a hosting provider's IP range scores high.

### Threat scope reduction (Zero Trust)

Threat scope reduction means shrinking how much an attacker could reach or damage if any one account, device or session were compromised. It works by limiting access to the minimum needed, cutting unnecessary entry points and dividing the environment into small zones. It is listed in the Zero Trust control plane because it is a design goal that shapes every access decision.

**How it works:**
1. Grant least privilege: each subject gets only the resources and actions its task needs, per session (a NIST Zero Trust tenet).
2. Segment: put resources behind their own enforcement points so reaching one does not reach others.
3. Shrink implicit trust zones so fewer things are trusted after passing one gate.
4. Remove unused services, ports, accounts and interfaces (attack surface reduction).
5. Make access temporary: time-limited sessions and just-in-time elevation instead of standing admin rights.

**Why it matters:** breaches are measured by blast radius. If a phished sales account can reach only the CRM for its own region, the incident is small; if it can reach every file share, it is a company-wide breach. It also limits lateral movement, the step where an attacker hops from the first foothold to more valuable systems.

**Common confusions:** Threat scope reduction is not threat intelligence (learning about attackers) and not threat hunting (searching for them); it limits what they could touch. It overlaps with least privilege and segmentation, which are its main tools. It does not remove threats; it limits their effect.

**Scenario:** A clue says "after a contractor's laptop was compromised, the attacker could reach only the single project server the contractor was allowed to use." The answer is threat scope reduction. Adaptive identity is the closest wrong answer and fails because the clue is about limiting reach, not about how much verification was asked.

**Example:** before: `contractor-vpn -> 10.0.0.0/8 any`. After: `contractor-vpn -> 10.20.4.15:443 only, session 8h`. The same stolen credential now reaches one service instead of the whole network.

### Policy-driven access control (Zero Trust)

Policy-driven access control means every access decision comes from written, centrally managed rules that combine identity with context, rather than from network location or ad hoc exceptions. The rules state which subjects, under which conditions, may perform which actions on which resources. It sits in the Zero Trust control plane, and the Policy Engine evaluates it.

**How it works:**
1. Administrators define policies from business needs: roles, data sensitivity, required device posture, allowed times and locations.
2. Policies are stored centrally (NIST lists data access policies among the inputs the Policy Engine uses).
3. For each request, the Policy Engine combines the policy with live signals (identity, device health from monitoring tools, threat intelligence) in a trust algorithm.
4. The result (allow, deny, allow with limits) goes to the Policy Administrator and then the enforcement point.
5. Policies are reviewed and tuned from the logs of past decisions.

**Why it matters:** consistent rules in one place mean the same request gets the same answer everywhere, changes take effect across the environment at once, and auditors can read exactly why access was granted.

**Common confusions:** Policy-driven access control is the rule set and its consistent use; adaptive identity is the part that adjusts verification to risk; the Policy Engine is the component that evaluates the rules. Attribute-based access control (ABAC, objective 4.6) is a common way to express such policies but is not the only one. A written security policy document is a managerial control; here "policy" means machine-evaluated access rules.

**Scenario:** A clue says "access to the finance app is allowed only for the Finance role, from compliant company devices, during business hours, as defined in a central rule set." The answer is policy-driven access control. Threat scope reduction is the closest wrong answer: the rule does limit reach, but the clue stresses centrally defined rules combining identity and context.

**Example:** rule `IF role=Finance AND device.compliant=true AND time in 07:00-19:00 THEN allow finance-app:read,write ELSE deny`.

### Policy Engine (PE, Zero Trust)

The Policy Engine is the Zero Trust component that makes the final decision to grant, deny or revoke a subject's access to a resource. It sits in the control plane. Together with the Policy Administrator it forms what NIST calls the Policy Decision Point (PDP). Memory aid: the Engine decides.

**How it works:**
1. It receives an access request relayed from a Policy Enforcement Point through the Policy Administrator.
2. It gathers inputs: enterprise access policies, identity data (directory, roles), device posture from a continuous diagnostics and mitigation (CDM) system, threat intelligence feeds, activity logs, PKI (public key infrastructure) data and compliance rules.
3. It runs these through a trust algorithm and reaches a verdict for this subject, this resource, this session.
4. It logs the decision (approved or denied), and the Policy Administrator carries it out.
5. It can later revoke access if new information arrives (the device falls out of compliance, a threat feed flags the user's address).

**Why it matters:** one decision point applying all available evidence is what lets Zero Trust be consistent and dynamic. Its logged decisions are the audit trail for "why was this allowed?"

**Common confusions:** The Engine decides; it does not open or close connections itself. The Policy Administrator is the one that tells enforcement points what to do. The PEP enforces but never decides. Some products run the PE and PA as one service; they remain two logical roles. NIST's PDP name covers PE plus PA, so "PDP" in a question means the decision side as a whole.

**Scenario:** A clue says "which component evaluates the user's identity, device health and threat intelligence to grant or deny the session?" The answer is the Policy Engine. Policy Administrator is the closest wrong answer and fails because it executes the decision rather than making it.

**Example:** PE log entry: `req=88213 subject=pnair device=LT-2290 cdm=patched threat=none policy=eng-git-rw trust=0.91 decision=GRANT`.

### Policy Administrator (PA, Zero Trust)

The Policy Administrator is the Zero Trust component that carries out the Policy Engine's decision by opening or closing the connection that links a subject to a resource. It sits in the control plane, works closely with the Policy Engine, and commands the Policy Enforcement Points. Memory aid: the Administrator acts on the decision.

**How it works:**
1. The Policy Engine returns a decision for a request.
2. If allowed, the PA creates any session-specific credential or token the client will need (NIST notes it generates session authentication tokens or credentials).
3. The PA configures the relevant Policy Enforcement Point, over the control plane, to let that session start.
4. If denied, or if an earlier approval is withdrawn, the PA signals the PEP to block or tear down the connection.

**Why it matters:** separating "decide" from "set up" keeps the decision logic clean and lets one decision drive many enforcement points (an agent on the laptop and a gateway in front of the server). The PA is also what makes revocation take effect quickly across the environment.

**Common confusions:** The PA does not decide; if a question asks "which component grants or denies", the answer is the Policy Engine. The PA is not the enforcement point either; the PEP physically passes or blocks traffic. The PE and PA together make up the Policy Decision Point in NIST's model.

**Scenario:** A clue says "after access is approved, which component issues the session token and instructs the gateway to allow the connection?" The answer is the Policy Administrator. Policy Enforcement Point is the closest wrong answer and fails because it receives the instruction instead of issuing it.

**Example:** PA to gateway message: `open session id=c19e subject=pnair resource=git.corp:443 ttl=3600 token=...`, followed an hour later by `close session id=c19e`.

### Policy Enforcement Point (PEP, Zero Trust)

The Policy Enforcement Point is the Zero Trust gatekeeper that enables, monitors and finally terminates connections between a subject and a resource, as instructed by the Policy Administrator. It sits in the data plane, directly in the path of traffic, and it must be able to communicate on both the data plane and the control plane. Memory aid: the Enforcement Point enforces.

**How it works:**
1. A subject's request reaches the PEP before it can reach the resource.
2. The PEP forwards the request to the Policy Administrator and waits for instructions.
3. When told to allow, it opens the path for that session only; otherwise it blocks.
4. During the session it monitors the connection and can cut it when told (policy change, revoked trust, timeout).
NIST notes a PEP can be a single gateway or portal, or be split into a client part (an agent on the laptop) and a resource part (a gateway in front of the server). Beyond the PEP lies the trust zone that hosts the resource.

**Why it matters:** decisions mean nothing unless something in the traffic path applies them. Placing PEPs close to each resource is how Zero Trust shrinks implicit trust zones.

**Common confusions:** The PEP enforces but does not decide; the Policy Engine decides. In real deployments the PEP role is played by a gateway in front of a resource, a portal, or an agent on the client device. The PEP is in the data plane even though its instructions come from the control plane.

**Scenario:** A clue says "which component sits in front of the application and allows or blocks the user's traffic according to instructions it receives?" The answer is the Policy Enforcement Point. Policy Engine is the closest wrong answer and fails because it never sits in the traffic path.

**Example:** gateway log: `PEP gw-hr-01 session c22b subject=ttan action=terminate reason=PA_revoke device_noncompliant`.

### Policy Engine vs Policy Administrator vs Policy Enforcement Point (Zero Trust components compared)

The three logical components divide one access decision into deciding, setting up and enforcing. NIST SP 800-207 groups the first two as the Policy Decision Point (PDP).

| Component | Plane | One-word job | Decisive clue |
|---|---|---|---|
| Policy Engine (PE) | Control | Decides | "grants, denies or revokes using policy and inputs" |
| Policy Administrator (PA) | Control | Executes | "creates session tokens, tells the gateway to open or close" |
| Policy Enforcement Point (PEP) | Data | Enforces | "sits in the traffic path, allows or blocks, monitors" |

**How one request flows:**
1. Subject sends a request; the PEP intercepts it.
2. The PEP passes it to the PA, which asks the PE.
3. The PE evaluates policy plus inputs and decides.
4. The PA turns the decision into action: credentials for the client, instructions to the PEP.
5. The PEP opens the session, watches it, and closes it when told.
The common wrong order has the PEP deciding on its own, which is how the old perimeter firewall worked.

**Why it matters:** the three names are easy to swap. Mapping the verb in a description (decide, execute, enforce) to the component settles which one is meant.

**Common confusions:** "Gatekeeper" means PEP, not PE. "Policy Decision Point" means PE plus PA, not PEP. "Revoke" is decided by the PE but executed by the PA and enforced by the PEP; read which step the clue describes.

**Scenario:** A clue says "a laptop falls out of compliance mid-session; the system decides to end access, a component instructs the gateway, and the gateway drops the connection." Decide = Policy Engine, instruct = Policy Administrator, drop = Policy Enforcement Point. Naming the PEP for the decision is the usual mistake.

### Implicit trust zones (Zero Trust)

An implicit trust zone is the area behind a Policy Enforcement Point where every entity is trusted at least to the level of the last check it passed, with no further checks inside. NIST compares it to an airport: once passengers clear the security checkpoint, everyone in the boarding area is treated as trusted. Zero Trust tries to make these zones as small as possible. It belongs to the data plane.

**How it works:**
1. A PEP admits a subject after a decision.
2. Inside the zone behind that PEP, entities can talk to each other without new checks.
3. The PEP cannot apply any policy beyond its own position in the traffic path.
4. Therefore Zero Trust moves PEPs closer to each resource, so each implicit trust zone is made as small as possible.

**Why it matters:** a large implicit trust zone (a flat internal network) means one compromised device can reach everything inside it. Small zones contain an intruder to the one resource that was granted.

**Common confusions:** An implicit trust zone is not a "trusted zone" in the old sense of the whole internal network; in Zero Trust the whole enterprise network is explicitly NOT an implicit trust zone. Shrinking zones is how threat scope reduction is carried out in the architecture. A screened subnet (DMZ) is a network zone concept from objective 4.5, not this.

**Scenario:** A clue says "after passing the gateway, a workstation could freely reach every server in the data center segment; the architects want to fix this in line with Zero Trust." The answer is to shrink the implicit trust zone by placing enforcement points in front of each server or small group. Adding a stronger perimeter firewall is the closest wrong answer and fails because it keeps the large zone behind it.

**Example:** before: one PEP in front of `10.30.0.0/16`, every server trusted after it. After: one PEP per application (`hr-app`, `payroll`, `git`), each zone holding one service.

### Subject and system (Zero Trust)

In Zero Trust, the subject is whoever or whatever requests access: an end user, an application or service, or another non-human entity such as an automated process. The system is the device or asset the request comes from, such as a laptop, phone or server. NIST treats authorized subjects as a combination of user, application and device. Both live in the data plane and both are evaluated before access.

**How it works:**
1. The subject identifies itself (user account, service account, workload identity).
2. The system (device) is identified and its state checked: managed or not, patched, encrypted, free of known threats.
3. The Policy Engine evaluates both together; a trusted user on an untrusted device can be denied or limited.
4. Access is granted to that subject on that system for that session only.

**Why it matters:** checking only the user ignores a compromised device; checking only the device ignores a stolen account. NIST's tenets require the organization to monitor the posture of all owned and associated devices and to treat unmanaged or subverted ones differently.

**Common confusions:** Subject is not only a human: a backup service calling an API is a subject. The resource is the thing being accessed, not the subject. Personal devices can be allowed limited access as associated assets. "Subject/System" in the outline is one item meaning "the requester and its device".

**Scenario:** A clue says "a valid employee account requesting access from a personal tablet with an outdated operating system is given read-only access to email only." The decision reflects evaluation of the subject AND the system. Answering "adaptive identity" alone misses that the device itself was assessed as a separate input.

**Example:** request record: `subject=svc-backup (service account) system=srv-bk-02 (managed, patched) resource=storage-api action=write`.

### Bollards (vehicle barriers)

Bollards are short, sturdy posts placed in a row to stop vehicles while letting people walk between them. They protect building entrances, glass lobbies, storefronts and equipment from vehicles driven into them on purpose (ramming) or by accident. They are physical in category and preventive in type, with some deterrent effect. NIST SP 800-53 names bollards among the physical barriers used to limit access (PE-3(7)).

**How they work:**
1. They are spaced so that a car cannot pass between them but pedestrians and wheelchairs can.
2. They are anchored deep enough, or rated for impact, to stop a vehicle of a given weight at a given speed. Crash-rated barriers are tested against a defined vehicle weight and speed; an unrated decorative post may stop little.
3. Fixed bollards are permanent; retractable or removable ones can be lowered to let authorized vehicles through.

**Why it matters:** a vehicle can breach a wall or glass front in seconds, bypassing every door lock and badge reader. Bollards protect people in lobbies and keep critical equipment (generators, fuel tanks, transformers) from being hit.

**Common confusions:** Bollards stop vehicles, not people; to stop people following each other through a door, the answer is an access control vestibule. Fencing controls people along a perimeter; bollards control vehicles at a specific frontage.

**Scenario:** A clue says "the company wants to keep vehicles from reaching the glass entrance while still letting staff walk in freely." The answer is bollards. A fence is the closest wrong answer and fails because it would also block pedestrians and is not designed to stop a vehicle.

**Example:** site plan note: "Install a row of steel bollards 1.2 m apart along the main entrance plaza; one retractable bollard at the delivery lane, lowered only by the security desk."

### Access control vestibule (mantrap)

An access control vestibule is a small space between two sets of interlocking doors where only one door can be open at a time, so each person is held and checked before entering the secure area. NIST SP 800-53 calls it an access control vestibule (control PE-3(8)), and the older name is mantrap. Its main job is to stop tailgating and piggybacking. It is physical in category and preventive in type.

**How it works:**
1. A person badges or is admitted through the outer door into the vestibule.
2. The outer door must close and lock before the inner door can open (the doors are interlocked).
3. The person's authorization is checked again (badge, PIN, biometric, guard view, sometimes a weight or occupancy sensor to confirm only one person).
4. Only then does the inner door unlock. If the check fails, the person can be held or sent back out.
Vestibules can be fully automated (the controller opens doors) or partly automated (a guard decides who moves on).

**Why it matters:** a badge reader on a single door lets anyone walk in behind an authorized employee, which is easy to do socially ("can you hold the door?"). A vestibule enforces one entry per authorization physically, without relying on people to refuse.

**Common confusions:** Tailgating (following without the employee's consent or knowledge) and piggybacking (following with the employee's consent) are both stopped by a vestibule. Many sources, NIST included, use the two words for the same act, so either word is correct unless a clue separates them by consent. A turnstile limits passage too but is easier to bypass and does not hold a person for checking. Bollards stop vehicles, not people. "Mantrap" and "access control vestibule" are the same thing; the SY0-701 objectives use the newer name.

**Scenario:** A clue says "auditors observed staff letting others through the data center door behind them; management wants entry limited to one authorized person at a time." The answer is an access control vestibule. More cameras is the closest wrong answer and fails because cameras record the tailgating but do not prevent it.

**Example:** door controller rule: `outer_door.open allowed only if inner_door.closed AND vestibule.occupancy == 0`; `inner_door.unlock only if badge.valid AND occupancy == 1`.

### Fencing (perimeter barriers)

Fencing marks and protects a perimeter, controlling where people (and sometimes vehicles) can enter a property. It is physical in category, and it works as a deterrent (it clearly signals a boundary) and as a preventive control (it delays or blocks entry), depending on height and build.

**How it works:**
1. It defines the boundary so anyone inside without permission is clearly trespassing.
2. It channels people to controlled gates where guards, badges or cameras check them.
3. It delays an intruder; taller fences, anti-climb mesh and razor or barbed wire add delay and make climbing visibly hostile.
4. Its line can be watched by cameras, lighting and sensors so a breach is detected.

**Choices:**
- Transparent fences (chain link, mesh) let guards and cameras see through.
- Opaque fences (solid panels, walls) hide what is inside from observers.
- Height and topping set how hard it is to climb.

**Why it matters:** the perimeter is the first layer of physical defense in depth. Making intruders cross a clear boundary and a barrier buys time for detection and response; physical security guidance stresses that delay is valuable only if someone can respond in time.

**Common confusions:** A fence alone does not detect anything; it needs cameras, sensors or patrols. A low fence is mostly deterrent, a high anti-climb fence mostly preventive (it still only delays a determined intruder). Fences control people; bollards control vehicles; vestibules control single-person entry at a door.

**Scenario:** A clue says "the company wants to clearly mark the edge of the campus, keep casual visitors out, and still let cameras see the grounds from outside the boundary." The answer is a transparent fence (such as chain link). An opaque wall is the closest wrong answer and fails the "cameras see through" requirement.

**Example:** perimeter spec: "2.4 m anti-climb mesh fence with topping, two gated entrances with badge readers, cameras every 50 m covering the fence line, lighting on the inside face."

### Video surveillance (CCTV, security cameras)

Video surveillance uses cameras, often called CCTV (closed-circuit television), to watch and record areas so events can be seen live, found later and used as evidence. It is physical in category, detective in type (it records and alerts), and deterrent when the cameras are visible. NIST lists video surveillance as part of monitoring physical access (PE-6), including reviewing and keeping recordings.

**How it works:**
1. Cameras cover entrances, perimeters, server rooms and other key areas, ideally with overlapping views.
2. Recordings are stored centrally (on-site recorders or cloud) for a set retention period.
3. Analytics can flag events: motion detection, object detection (a package left behind, a person in a restricted zone), facial recognition, license plate reading.
4. Guards watch live feeds or are alerted by analytics; footage is reviewed after incidents.

**Why it matters:** cameras let a small team watch a large site, prove what happened during an investigation, and discourage casual wrongdoing. Without review or alerting, though, a camera only records history.

**Common confusions:** A camera does not prevent entry; it detects and deters. Lighting matters: poor lighting can make footage useless, which is why lighting and cameras are planned together. Cameras raise privacy obligations (signage, retention limits, where they may point). A camera system is still physical in category even though it is networked; securing the camera network itself is a technical matter.

**Scenario:** A clue says "the company needs evidence of who entered the warehouse at night and a deterrent to theft, but cannot afford guards." The answer is video surveillance. A pressure sensor is the closest wrong answer and fails because it detects someone but provides no identification or evidence.

**Example:** event list: `02:14:07 cam-07 motion zone=loading-dock`, `02:14:09 cam-07 object=person`, `02:14:30 alert sent to on-call guard` with a clip saved under the case number.

### Security guards

A security guard is a trained person who protects a site by checking access, patrolling, watching monitors and responding to incidents. Guards are the most flexible physical security measure because they can judge unusual situations no device was programmed for. In category a guard is operational when the focus is the work the person performs, and guards are also counted among physical security controls (SY0-701 lists them under physical security); in type a guard is preventive, deterrent and detective at once, and can act correctively by responding.

**How guards work:**
1. Control entry: check badges and identification, sign in and escort visitors.
2. Monitor: watch camera feeds and alarm panels, and patrol the grounds.
3. Respond: investigate alarms, stop or detain intruders where lawful, call police or emergency services.
4. Record: log incidents, visitors and patrol results.
NIST SP 800-53 includes an option for guards at access points around the clock (PE-3(3)), noting that guards give a faster response and human watch over areas cameras do not cover. Physical security guidance adds that barriers and alarms only delay or warn; protection comes from trained people who respond in time.

**Why it matters:** sensors and cameras produce alerts, but someone has to act on them. A visible guard also deters social engineering at the front desk ("I forgot my badge") far better than a sign.

**Common confusions:** Two-person integrity (or the two-person rule) means at least two authorized people must be present for a sensitive task or area, each able to notice a wrong or unauthorized step, so no single guard can act alone; it reduces insider risk and is not just "two guards for coverage". Guards are expensive and can be tricked or make mistakes, so they are combined with technical and physical controls. A guard booth is physical; the guard's work is operational.

**Scenario:** A clue says "the facility needs a control that can recognize an unusual situation, such as a delivery that does not match any order, and decide what to do." The answer is a security guard. A camera with object detection is the closest wrong answer and fails because it can flag the event but cannot judge context or act.

**Example:** post orders: "Check every badge photo against the person; sign in and escort all visitors; respond to any door-held alarm within 2 minutes; record each patrol in the guard log."

### Access badges (ID badges, proximity cards)

An access badge is a card or token that identifies a person and, when presented to a reader, unlocks doors they are authorized to use. Most combine a printed photo ID with a contactless chip using RFID (radio frequency identification) or NFC (near field communication). It is physical in category and preventive in type, and the badge system's records make it detective as well.

**How it works:**
1. The organization enrolls the person and issues a badge tied to their record and access rights.
2. At a door, the person taps the badge; the reader sends its identifier to the access control system.
3. The system checks whether that badge may open that door at that time and unlocks or refuses.
4. Every attempt is logged (who, which door, when, granted or denied).
5. When someone leaves or loses the badge, it is disabled centrally, and lost badges must be reported.

**Why it matters:** badges replace keys that cannot be revoked or tracked. Access can differ per door and time, and the logs show who was where, which supports investigations and detects odd patterns (NIST suggests looking for access outside normal hours or to areas a person does not usually visit).

**Common confusions:** A badge alone is something you have; anyone holding a stolen badge can use it, so sensitive doors add a PIN or biometric. Badges do not stop tailgating; an access control vestibule does. The photo on the badge is for human checking by guards and staff.

**Scenario:** A clue says "the company must be able to remove one former employee's access to every door immediately and see which doors she used last month." The answer is an access badge system. Changing door locks is the closest wrong answer and fails because it affects everyone and gives no history.

**Example:** badge log: `2026-11-02 22:41 badge=10432 door=ServerRoom-B result=DENIED reason=outside_schedule`.

### Security lighting

Security lighting illuminates grounds, entrances, parking areas and building edges so that intruders are more likely to be seen and recorded. It is physical in category and mainly deterrent in type, with a detective role because it makes cameras and guards effective at night. It also supports people's safety around the site.

**How it works:**
1. Light the places attackers would use: perimeter, doors, loading docks, parking, walkways.
2. Keep lighting even, so there are no deep shadows to hide in and cameras do not struggle with sharp changes between bright and dark.
3. Coordinate with camera positions and types so footage is usable (faces and plates readable).
4. Use motion-activated lights where constant light is not needed; a light switching on draws attention to movement.
5. Point fixtures to light the area without blinding guards or cameras.

**Why it matters:** an intruder who feels exposed is more likely to give up, and recorded footage is only useful if the image is clear. Lighting is one of the cheapest controls that improves several others at once.

**Common confusions:** Lighting does not stop entry; it deters and supports detection. Too much glare can blind cameras and observers, so more light is not always better. Lighting is often named as part of crime prevention through environmental design (CPTED), the practice of shaping a site so activity is easy to see.

**Scenario:** A clue says "cameras cover the rear parking lot, but footage after dark is too poor to identify anyone." The answer is improving security lighting in the lot. Adding more cameras is the closest wrong answer and fails because more cameras in the dark still record unusable images.

**Example:** site review note: "Loading dock: one fixture out, dark gap of 15 m between camera 7 and camera 8; replace fixture and add a motion-activated light at the side door."

### Infrared sensors (passive infrared, PIR motion detectors)

An infrared motion sensor, usually a passive infrared (PIR) detector, raises an alarm when it senses a change in the heat pattern in its field of view, such as a warm body moving through a room. It is passive: it gives off no energy of its own and only receives infrared (heat) radiation. Physical in category, detective in type.

**How it works:**
1. A lens (often a plastic Fresnel lens, since glass blocks infrared) focuses heat from several zones, or "fingers", onto a sensing element.
2. A person moving from one zone to the next changes the heat reaching the element.
3. The detector counts these changes; designs with two sensing elements and pulse counting ignore slow changes like room temperature drifting.
4. When the pattern matches movement, it signals the alarm panel.

**Strengths and limits:**
- Most sensitive to movement ACROSS its zones; movement straight toward or away from it is detected less well.
- Does not see through glass, walls, wood or metal, so it stays within the room it watches (few alarms from outside).
- Coverage depends mostly on where it is mounted and aimed (many units also have a sensitivity or range adjustment).

**Why it matters:** PIR sensors are cheap, low power and good at detecting people in rooms and corridors after hours, which is why they are a standard choice for indoor intrusion zones.

**Common confusions:** "Infrared" here means detecting body heat; it is not an infrared camera and does not record images. A PIR sensor does not sense through a window, unlike microwave. Microwave and ultrasonic sensors are active (they transmit and listen for echoes); PIR is passive. Dual-technology detectors pair PIR with microwave or ultrasonic and alarm only when both trigger, which cuts false alarms at a small cost in detection.

**Scenario:** A clue says "a sensor must detect a person walking across a dark storage room by their body heat, without detecting movement in the corridor behind the glass wall." The answer is a passive infrared sensor. Microwave is the closest wrong answer and fails because microwave energy passes through glass and could trigger on corridor movement.

**Example:** alarm panel event: `zone 4 PIR storeroom ACTIVE 01:12:55`, `zone 4 restored 01:13:20`; with the system armed, this triggers a dispatch.

### Pressure sensors (pressure mats)

A pressure sensor detects weight or force applied to a surface, most often a mat hidden under carpet or flooring that triggers when someone steps on it. Related versions sit under an object and trigger when the object is lifted. Physical in category, detective in type.

**How it works:**
1. A thin switch mat (or a pressure switch under an object) is placed where an intruder must step or reach: inside a doorway, at the foot of stairs, in front of a safe or display.
2. When enough weight presses the mat, internal contacts close (or open, for a lifted object) and the circuit changes.
3. The alarm panel receives the change and raises an alarm when the system is armed.
4. Some installations add tamper detection so that a cut cable is also reported.

**Strengths and limits:**
- Very specific: it reports a person at an exact spot, not general motion in a room.
- Works in darkness and is not affected by heat sources or air movement.
- Must be well hidden, because an intruder who knows where it is can step over it or bridge it.
- Furniture or heavy objects placed on it can cause constant alarms.

**Why it matters:** pressure sensors protect the last steps to a valuable target (a vault door, a server cage, a stairwell) where false alarms from general motion would be a problem.

**Common confusions:** A pressure sensor detects weight, not motion through the air or body heat. It does not identify who stepped on it; a camera does. Do not confuse with a door contact (magnetic switch), which detects a door or window opening.

**Scenario:** A clue says "a museum wants an alarm when anyone steps on the floor directly in front of a display case, but not when people walk elsewhere in the hall." The answer is a pressure sensor (mat). An infrared sensor is the closest wrong answer and fails because its zones would cover much more of the hall than the exact spot.

**Example:** panel configuration: `zone 9 type=pressure-mat location="vault antechamber" armed=after-hours tamper=24h`.

### Microwave sensors (microwave motion detectors)

A microwave motion sensor transmits microwave energy and listens to what bounces back; a moving object changes the frequency of the reflection (the Doppler effect), and the sensor raises an alarm. It is an active, volumetric sensor that can cover large areas. Physical in category, detective in type.

**How it works:**
1. A transceiver sends a microwave signal into the protected space.
2. Reflections return from walls, objects and anything moving.
3. Movement shifts the returned frequency; the sensor compares sent and received signals.
4. A large enough shift triggers an alarm. Better models use range gating to ignore movement beyond a set distance.

**Strengths and limits:**
- Most sensitive to motion directly toward or away from the sensor.
- Covers a large volume; range can be adjusted.
- Passes through glass and light materials (plywood, plastic, drywall, fiberboard) but not metal, so it can see movement outside the intended room. That is its main cause of false alarms, along with metal objects that move (a roll-up door shaking in wind reflects strongly).

**Why it matters:** microwave sensors suit warehouses, large rooms and areas where heat-based sensing struggles. Their reach is a strength and a risk; placement and range setting decide whether they are reliable.

**Common confusions:** Microwave and ultrasonic both use echoes and the Doppler effect; microwave uses radio energy that passes through light walls, ultrasonic uses sound that stays in the room. PIR is passive and sees heat crossing its zones.

**Scenario:** A clue says "a large open warehouse needs motion detection over its whole floor area, including movement behind thin plywood partitions." The answer is a microwave sensor. A pressure mat is the closest wrong answer and fails because it covers only the spot where it lies.

**Example:** installer note: "Microwave unit MW-3 range reduced from 25 m to 15 m and aimed away from the steel loading door to stop wind-driven false alarms."

### Ultrasonic sensors (ultrasonic motion detectors)

An ultrasonic motion sensor sends out high-frequency sound above human hearing (above about 20 kHz) and listens to the echoes; movement changes the echo's frequency (the Doppler effect) and triggers an alarm. It is an active sensor that fills an enclosed room. Physical in category, detective in type.

**How it works:**
1. A transducer emits ultrasonic sound into the room.
2. Sound reflects off walls, furniture and people back to a receiver.
3. A moving person shifts the frequency of the echo.
4. The sensor compares sent and received sound and signals an alarm on a large enough change.

**Strengths and limits:**
- Most sensitive to movement toward or away from the unit.
- Sound does not pass through glass, wood, drywall or metal, so detection stays inside the room (fewer alarms from outside than microwave).
- Strong drafts can disturb motion detectors, so openings near the unit should be sealed.
- Seldom used in current installations compared with PIR and microwave units.

**Why it matters:** ultrasonic sensors fill an enclosed space evenly, including areas a PIR detector's zones might miss, and they will not see through a window into a busy corridor.

**Common confusions:** Ultrasonic uses SOUND; microwave uses radio waves; infrared senses HEAT. Ultrasonic and microwave both use the Doppler effect and are both active. If a clue mentions "echoes of high-frequency sound", the answer is ultrasonic.

**Scenario:** A clue says "the sensor must detect motion inside a small, enclosed records room using reflected sound, and must not react to people walking past the room's glass door." The answer is an ultrasonic sensor. Microwave is the closest wrong answer and fails because microwave energy passes through the glass door.

**Example:** panel listing: `zone 6 type=ultrasonic location="records room" sensitivity=medium`.

### Infrared vs pressure vs microwave vs ultrasonic sensors (physical sensors compared)

The four SY0-701 sensors all detect an intruder, but each senses something different. Picking one means matching what it senses to the space and to what must NOT trigger it.

| Sensor | Senses | Active or passive | Passes through glass and light walls? | Best at |
|---|---|---|---|---|
| Infrared (PIR) | Change in heat pattern | Passive | No | Movement across a room |
| Pressure | Weight on a surface | Passive switch | Not applicable | An exact spot (doorway, in front of a safe) |
| Microwave | Doppler shift of reflected radio energy | Active | Yes (not metal) | Large areas, sees through thin walls |
| Ultrasonic | Doppler shift of reflected high-frequency sound | Active | No | Filling an enclosed room |

**How to choose, step by step:**
1. Is there one exact spot to protect? Pressure.
2. Must detection stay inside a room with glass walls or windows? PIR or ultrasonic, not microwave.
3. Is the area large and open, or must the sensor see through thin partitions? Microwave.
4. Is the clue about body heat? Infrared. About sound echoes? Ultrasonic. About radio waves or "through walls"? Microwave.
5. Are false alarms the main problem? A dual-technology detector (PIR plus microwave or ultrasonic, both must trigger).

**Why it matters:** the wrong sensor either misses intruders or floods guards with false alarms until they stop responding, which defeats the point of detection.

**Common confusions:** All four are detective, not preventive. Microwave and ultrasonic are both Doppler-based and both best at movement toward the sensor; the medium (radio vs sound) is the difference. PIR is the only one of the three motion sensors that is passive.

**Scenario:** A clue says "the alarm keeps going off at night because the sensor detects people in the hallway outside the office's glass wall." The likely fault is a microwave sensor; replacing it with PIR or ultrasonic (or reducing range and re-aiming) fixes it. Adding cameras does not address the false alarms.

### Physical access controls compared (bollards vs fencing vs access control vestibule vs guards vs badges)

Choosing a physical control starts from the threat. Each common control answers a different one.

| Control | Main threat addressed | Type | Decisive clue |
|---|---|---|---|
| Bollards | Vehicles reaching a building or equipment | Preventive | "vehicle, ramming, storefront" |
| Fencing | People crossing a perimeter | Deterrent, preventive (delay) | "boundary, perimeter, campus edge" |
| Access control vestibule | Tailgating and piggybacking at a door | Preventive | "one person at a time, followed in" |
| Security guard | Situations needing judgment, visitors | Preventive, deterrent, detective | "verify, escort, decide" |
| Access badge | Entry by unauthorized people; need for audit trail | Preventive, detective (logs) | "per-door rights, revoke, history" |
| Video surveillance | Need to see and prove what happened | Detective, deterrent | "evidence, record, monitor" |
| Lighting | Darkness hiding intruders, poor footage | Deterrent, supports detection | "night, shadows, unusable footage" |
| Sensors | Intrusion when nobody is watching | Detective | "after hours, alarm" |

**How layering works:** physical defense in depth places these in rings: perimeter (fence, lighting, cameras, bollards), building entrance (guards, badges), inner rooms (vestibules, sensors), equipment (locked racks). Physical security guidance describes the goals as deterring, then delaying, then detecting, and finally a timely response by trained people.

**Why it matters:** budget goes further when each control is placed against the threat it actually stops, rather than buying more of one control.

**Common confusions:** "Stop people following through the door" is the vestibule, not a guard or camera (those detect or discourage). "Stop a car" is bollards, not a fence. Badges authenticate a credential, not a person; the photo and a guard check the person.

**Scenario:** A clue lists three needs: "keep delivery trucks away from the lobby glass, prevent staff from letting others follow them into the server room, and identify night-time intruders in the parking lot." Answers in order: bollards, access control vestibule, lighting plus video surveillance.

### Honeypot (decoy system)

A honeypot is a decoy system, or a single decoy resource on a system, set up to look attractive to attackers so that any interaction with it can be detected and studied. Legitimate users have no reason to touch it, so every connection is suspicious. It is a deception and disruption technology: detective in type, and it can also divert attackers away from real systems. NIST SP 800-53 lists decoys such as honeypots under control SC-26.

**How it works:**
1. Build a system that resembles something valuable (a file server, a database, an exposed login page), with no real data.
2. Place it where an attacker would find it (inside the network to catch lateral movement, or facing the internet to study attack traffic).
3. Isolate it so an attacker who takes it over cannot use it to reach real systems.
4. Log and alert on every interaction: scans, logins, commands, uploaded tools.
5. Use what is captured (attacker addresses, tools, techniques) to tune real defenses.

**Why it matters:** honeypots give high-confidence alerts with few false positives, because normal traffic never goes there. They also show how attackers behave against your environment, which no vendor report can.

**Common confusions:** A honeypot is usually a whole decoy system (some glossaries also call a single decoy resource, even one file, a honeypot); a honeynet is a network of decoy systems. A honeyfile is the specific name for a decoy file; a honeytoken is a decoy piece of data (credential, key, record). A honeypot does not prevent attacks on real systems; it detects and diverts. Poor isolation can turn it into a launch point, and NIST notes legal counsel may need to review its use.

**Scenario:** A clue says "the team deploys a fake database server with no business purpose and alerts on any login attempt to it." The answer is a honeypot. Honeytoken is the closest wrong answer and fails because the decoy is a whole system, not a planted piece of data.

**Example:** alert: `honeypot db-fin-07: SSH login attempt from 10.4.12.33 user=root (3 tries)`. Since nobody should ever connect to db-fin-07, host 10.4.12.33 is investigated at once.

### Honeynet (decoy network)

A honeynet is a network of decoys: several honeypots plus supporting systems (servers, workstations, routers, sometimes fake services and traffic) built to look like a real environment. It lets defenders watch an attacker move between systems, not just touch one. Detective in type, part of deception and disruption technology (NIST SC-26 names honeynets alongside honeypots).

**How it works:**
1. Build a believable segment: a few servers, workstations and services with realistic names and fake data.
2. Connect them so an attacker can move from one to another, as in a real network.
3. Isolate the whole honeynet from production, so that malicious code an attacker brings in cannot spread from the decoys to real systems.
4. Capture everything: network traffic, logins, commands, files dropped, lateral movement.
5. Analyze to learn tools, techniques and goals, and feed findings into detection rules.
A honeynet can also be virtual, with the whole fake network running on one physical host.

**Why it matters:** single honeypots show first contact; a honeynet shows the full attack path (discovery, credential theft, lateral movement), which is what defenders most need to detect in their real network.

**Common confusions:** Honeynet = many decoy systems; honeypot = one. A honeynet is not a screened subnet (DMZ): a DMZ holds real public services, a honeynet holds only decoys. A honeynet is costlier to build and keep believable than a single honeypot.

**Scenario:** A clue says "researchers want to observe how an intruder moves from a web server to a database server and then to a domain controller, without risking real systems." The answer is a honeynet. A single honeypot is the closest wrong answer and fails because one decoy cannot show movement between systems.

**Example:** honeynet design: `decoy-web01 -> decoy-app01 -> decoy-dc01`, all on an isolated segment with no route to production, full packet capture and command logging on every decoy.

### Honeyfile (decoy file)

A honeyfile is a decoy file placed among real files with a tempting name (such as "passwords.xlsx" or "salary-review-2026.docx") whose only purpose is to raise an alert when someone opens, copies or moves it. No legitimate task needs it, so any access is a strong sign of an intruder or a curious insider. Detective in type, part of deception and disruption technology.

**How it works:**
1. Create a believable file with fake content and an attractive name.
2. Place it where an attacker would look: file shares, admin desktops, backup folders.
3. Watch it: file auditing on the server, a monitoring agent, or content inside the file that calls back when opened (a remote image or link).
4. Alert security when the file is accessed, and record who, from where and when.

**Why it matters:** an intruder hunting for valuables has to browse folders and open files to find them. A honeyfile flags that browsing before real data leaves, with very few false alarms because staff never need the file.

**Common confusions:** A honeyfile is a FILE that alerts on access; a honeytoken is a piece of DATA (a fake credential, key or record) that alerts when it is USED or appears somewhere it should not, which can be outside your network. A honeyfile can contain honeytokens. A honeyfile does not protect the real files; it detects someone browsing.

**Scenario:** A clue says "an alert fired when someone opened a spreadsheet named 'admin_passwords' on a file share; the spreadsheet contains no real passwords." The answer is a honeyfile. Honeytoken is the closest wrong answer: it would fit if the alert came from someone trying to USE one of the fake passwords.

**Example:** file server audit event: `\\fs02\it\admin_passwords.xlsx opened by CORP\svc-print from 10.9.3.41`. A print service account opening that file is clearly malicious.

### Honeytoken (decoy data, canary token)

A honeytoken is a piece of fake, traceable data planted where an attacker might find it, such as a fake user account, API key, database record, credit card number or email address. It has no legitimate use, so any attempt to use it, or any sighting of it outside where it was planted, reveals a breach and often shows where the data went. Detective in type, part of deception and disruption technology. "Canary token" is a common name for one that calls home automatically.

**How it works:**
1. Create the fake item and make it look real (a believable account name, a key in the right format).
2. Plant it where real items live: a code repository, a configuration file, a customer table, a password vault.
3. Monitor for its use: logins with the fake account, API calls with the fake key, mail sent to the fake address, the fake record appearing in a leaked data set.
4. Alert immediately; the alert shows which planted copy was taken, which narrows down how the leak happened.

**Why it matters:** honeytokens detect theft of data, not just intrusion, and they work even after the data leaves your network. A single failed login with a honeytoken account is already a high-confidence signal.

**Common confusions:** Honeytoken = data used or seen; honeyfile = file opened; honeypot = system contacted; honeynet = network of systems. A honeytoken that looks obviously fake (named "do_not_use_honeytoken") will be skipped by a skilled attacker. A honeytoken is not encryption or tokenization: tokenization replaces real data for protection, a honeytoken is fake data for detection.

**Scenario:** A clue says "fake cloud access keys were placed in an internal code repository; an alert fired when someone tried to use one from an overseas IP address." The answer is a honeytoken. Honeyfile is the closest wrong answer and fails because the alert came from use of the key, not from opening a file.

**Example:** cloud alert: `Access attempt with key AKIAEXAMPLEDECOY01 (decoy, planted in repo payments-api, branch main) from 203.0.113.50: denied, incident opened`.

### Honeypot vs honeynet vs honeyfile vs honeytoken (deception technologies compared)

All four are decoys that legitimate users never need, so any interaction is suspicious. They differ in what the decoy is and what triggers the alert.

| Decoy | What it is | Alert fires when | Best for |
|---|---|---|---|
| Honeypot | One fake system or service | Someone connects to or attacks it | Detecting scans and intrusion attempts |
| Honeynet | A network of fake systems | Someone moves around inside it | Studying full attack paths, lateral movement |
| Honeyfile | One fake file with a tempting name | Someone opens, copies or moves it | Detecting browsing of file shares |
| Honeytoken | Fake data: credential, key, record, address | Someone uses it, or it appears elsewhere | Detecting data theft, tracing leaks, even off-network |

**How to choose, step by step:**
1. Want to know if someone is probing or attacking systems? Honeypot.
2. Want to watch what they do across several systems? Honeynet.
3. Want to know if someone is reading sensitive folders? Honeyfile.
4. Want to know if data or credentials were stolen and used, wherever that happens? Honeytoken.

**Why it matters:** deception tools give unusually reliable alerts, because no legitimate activity should ever touch a decoy. Choosing the right one matches the alert to the stage of attack you most need to see.

**Common confusions:** "Disruption" in the outline's heading means these tools also waste attackers' time and steer them away from real targets. Deception tools are detective, not preventive. Isolation matters for honeypots and honeynets so a captured decoy cannot attack production.

**Scenario:** A clue says "the security team wants to know if their customer database is ever stolen and sold, even if the theft is never noticed internally." The answer is honeytokens (fake customer records that are monitored for use or appearance). A honeypot is the closest wrong answer and fails because it only shows contact with a decoy system, not where real data ends up.

## 1.3 Change management and its effect on security

Depth asked: explain. A good answer says why a change step exists (what goes wrong without it) and how it protects security, not only what the step is called.

### Change management process (change control)

Change management is the formal process for proposing, assessing, approving, testing, carrying out and recording changes to systems, so changes happen deliberately and can be undone. NIST calls the core of it configuration change control and treats a security impact analysis as part of it. It protects integrity and availability, and it is a managerial control carried out operationally.

**How it works (a typical order, based on NIST's steps):**
1. Request: anyone (user, help desk, vendor patch notice, scan result) raises a change request.
2. Record: the request is logged in the change system so it can be tracked.
3. Classify: decide whether it needs full review or is a pre-approved standard change (for example routine antivirus signature updates).
4. Analyze impact, including security impact.
5. Test in a non-production environment, including the backout.
6. Approve: usually a change advisory board (CAB), which may require extra controls before saying yes.
7. Implement in the agreed window, notify stakeholders, update documentation.
8. Verify the change works and did not weaken security (scans, checks of affected controls).
9. Close the request.
The common wrong order is "implement, then ask approval" or testing after production.

**Why it matters:** unplanned changes cause outages and open holes: a firewall rule added in a hurry, a service left running after a test, a patch that breaks authentication. Change records also tell investigators what changed just before an incident, and they show auditors that changes are controlled.

**Common confusions:** Change management is not patch management; patching is one kind of change that goes through it. Version control tracks file versions; change management governs whether a change may happen. Emergency changes are still managed: they get a faster path and are reviewed and documented afterwards, not skipped.

**Scenario:** A clue says "an administrator changed a firewall rule on a Friday without telling anyone; Monday the payment site was unreachable and nobody knew why." The missing control is change management. Version control is the closest wrong answer: it might show the old rule, but the problem is that the change was never requested, assessed or approved.

**Example:** change record: `CHG-4471 | Owner: Network team | Change: open TCP 443 from partner range to api-gw | Risk: medium | Tested: staging 11/04 | Backout: remove rule 2210 | Window: Sat 22:00-23:00 | CAB approved 11/06`.

### Approval process (change advisory board, CAB)

The approval process is the formal review and sign-off a change must pass before it may be carried out. It is usually run by a change advisory board (CAB), which NIST calls a configuration control board (CCB) or change control board: a group of two or more people from different areas who weigh the change's purpose, scope, risk, cost, schedule and security impact. Managerial in category, preventive and directive in type.

**How it works:**
1. The requester submits the change with its purpose, scope, impact analysis, test results, backout plan and proposed window.
2. The board reviews it against set criteria (scope, cost, risk, effect on security).
3. The board approves, rejects, defers, or approves with conditions (extra monitoring, a different window, an added control).
4. The decision is recorded; only then may implementers act.
5. Routine low-risk changes can be pre-approved as standard changes, and urgent ones follow an expedited emergency path with review afterwards.
NIST describes the board as a check and balance that holds changes to agreed criteria before they are implemented.

**Why it matters:** one person rarely sees every effect of a change. A board with networking, application, security and business members catches conflicts ("that window overlaps month-end close") and risky shortcuts before they reach production. Approvals also create accountability.

**Common confusions:** Approval is not ownership: the owner requests and is accountable; the board approves. Approval is not testing: the board reviews test results but does not run tests. A small organization may have a light process, but some recorded approval is still expected.

**Scenario:** A clue says "a change to the VPN configuration must be reviewed by representatives from network, security and the business before it is scheduled." The answer is the approval process (CAB). Impact analysis is the closest wrong answer and fails because it is the input the board reviews, not the sign-off itself.

**Example:** CAB minutes: `CHG-4471 approved with condition: security team to monitor api-gw logs for 48 h after change. CHG-4480 deferred: no backout plan provided.`

### Ownership (change owner)

Ownership in change management means a named person or group is accountable for the change and for the system it affects. The owner requests the change, answers for its business need and outcome, and is kept informed throughout, even when another team (often IT) does the technical work. Managerial control.

**How it works:**
1. Every system or process has an owner, recorded in the inventory or change system.
2. The owner (or someone acting for them) raises or sponsors the change request.
3. The owner accepts the risk described in the impact analysis and confirms the timing suits the business.
4. Implementers carry out the work; the owner is notified of progress and problems.
5. The owner confirms the result is acceptable before the change is closed.

**Why it matters:** without an owner, nobody can decide trade-offs (accept a short outage? delay the fix?), and failed changes become everybody's and nobody's problem. Ownership also means someone is responsible for the system's security after the change.

**Common confusions:** The owner is not always the person doing the work: the shipping department may own a label-printing application while IT installs the update. Owner is not the same as stakeholder: stakeholders are everyone affected; the owner is the one accountable. Owner is not the approver; the approval body signs off.

**Scenario:** A clue says "the HR department asks IT to upgrade the payroll application; HR is accountable for the change and must be told of any delay." HR is the owner. Stakeholders is the closest wrong answer and fails because the clue stresses accountability, not merely being affected.

**Example:** change record fields: `Owner: Director of Payroll (business) | Implementer: Application Support (IT) | Notify owner on: start, failure, backout, completion`.

### Stakeholders (change management)

Stakeholders are all the people, teams and outside parties affected by a change or with a say in it: users, departments that depend on the system, support teams, customers, vendors and sometimes regulators. Identifying and informing them is part of planning a change. Managerial and operational in nature.

**How it works:**
1. List everyone who uses, supports, depends on or is responsible for the system, including other departments that consume its data.
2. Consult them early about timing, risk and expected effects.
3. Tell them when the change happens, especially if service will be interrupted or will work differently afterwards (NIST notes users and help desks may need training when behavior changes).
4. Gather feedback after the change, and include them in the impact analysis.

**Why it matters:** a change that looks small to IT can reach many departments. Updating a shared database may change reports used by finance, sales and an outside partner. Missing a stakeholder causes surprise outages and lost trust, and stakeholders often know the risks implementers do not.

**Common confusions:** Stakeholders are not the same as the owner (accountable) or the approval board (decides). A stakeholder may have no technical role at all. Communication with stakeholders is part of the process, not a courtesy.

**Scenario:** A clue says "IT patched the inventory server; the next morning the warehouse could not print shipping labels because nobody told them about the downtime or the new printer driver." The failure was not involving stakeholders. Approval process is the closest wrong answer: the change may well have been approved; the warehouse simply was not consulted or informed.

**Example:** stakeholder list for CHG-4490: `Warehouse operations (users), Finance (monthly reports), Carrier partner (label API), Help desk (support calls), Security (log changes)`.

### Impact analysis (change impact and security impact analysis)

Impact analysis examines what a proposed change could affect, including the risks of making it and the risks of NOT making it, and rates the result (often high, medium or low). NIST names a security impact analysis: qualified staff decide how far the change could alter the system's security posture before it is approved. Managerial control, preventive in purpose.

**How it works:**
1. Describe the change and list the systems, data, users and controls it touches.
2. Identify possible side effects: outages, broken integrations, permissions changed, logging lost, controls weakened.
3. Assess the risk of not changing: an unpatched flaw left open, a failing component left in place.
4. Rate the overall risk and note what would reduce it (extra testing, a quieter window, monitoring).
5. Give the analysis to the approval board; after implementation, check again that security controls still work as expected.

**Why it matters:** a change can quietly disable a safeguard: an update that reset firewall rules, a new service with a default password, an integration that turned off logging. Impact analysis is where these are caught on paper before they happen in production.

**Common confusions:** Impact analysis predicts effects; test results confirm them. It is not a business impact analysis (BIA), which belongs to continuity planning and measures the effect of losing a business function. "What could break?" and "what if we do nothing?" are both impact analysis questions.

**Scenario:** A clue says "before approving an operating system upgrade, the team assesses whether it could break the backup agent and what risk remains if the old version stays unpatched." The answer is impact analysis. Test results is the closest wrong answer and fails because nothing has been tested yet; this is a forward-looking assessment.

**Example:** impact section: `Affects: 12 file servers, backup agent v7 (compatibility unknown). Risk if done: backup failure (medium). Risk if not done: critical remote code execution flaw stays open (high). Overall: approve with backup test in staging first.`

### Test results (change testing)

Test results are the evidence, gathered in a sandbox, lab or staging environment that mirrors production, that a proposed change works as intended, does not break other things, and does not weaken security. NIST's process tests a change for both security and functional effects before approval and presents the results to the approval board. Operational activity supporting a managerial decision.

**How it works:**
1. Build or refresh a test environment that matches production as closely as possible (same versions, configurations, integrations).
2. Apply the change exactly as planned for production.
3. Test functions users depend on, integrations, performance, and security controls (authentication still required, logging still on, ports not opened by accident).
4. Test the backout: undo the change and confirm the system returns to its earlier state.
5. Record results and attach them to the change request for approval.
6. After the real change, verify again in production (scans, checks of affected controls).

**Why it matters:** testing turns "it should work" into evidence. Problems found in a sandbox cost minutes; the same problems found in production cost outages and sometimes breaches. A backout that was never tested may fail exactly when it is needed.

**Common confusions:** Test results confirm what impact analysis predicted, or reveal effects it missed. A test environment that differs from production (older data, missing integrations) gives false confidence. Testing is not approval; the board decides using the results.

**Scenario:** A clue says "before installing the new VPN client on 3,000 laptops, the team installs it on ten lab machines and confirms users can still connect and that the client logs to the SIEM." The answer is testing (test results). Impact analysis is the closest wrong answer and fails because the change was actually applied and observed, not just assessed.

**Example:** test log attached to the change: `Staging: login OK (10/10), MFA prompt OK, SIEM events received OK, backout to v5.2 OK in 6 min. Result: PASS.`

### Backout plan (rollback plan)

A backout plan is the prepared, tested set of steps to return a system to its previous working state if a change fails or causes unexpected problems. It usually relies on backups, snapshots, saved configurations or the previous software version. It is a corrective safeguard planned in advance, required before approval.

**How it works:**
1. Before the change, capture the current state: full backup, virtual machine snapshot, exported configuration, or the previous release kept ready.
2. Write the exact undo steps and decide the trigger (for example "if users cannot log in within 15 minutes after the change, back out").
3. Test the backout in the test environment and time it, so it fits inside the maintenance window.
4. During the change, if the trigger is met, follow the steps, then verify the system works as before.
5. Record what happened so the change can be fixed and tried again.
NIST lists requirements for rolling back changes among the contents of a change control procedure.

**Why it matters:** some changes cannot simply be "undone" by reversing a setting (database schema changes, firmware updates, data migrations). Without a plan, a failed change can turn a one-hour window into a multi-day outage.

**Common confusions:** A backout plan is not the same as a disaster recovery plan, which handles losing a whole site or system from any cause. Version control helps a backout (it holds the earlier configuration), but the backout plan is the procedure and decision to use it. Backups are a tool; the plan is the steps, timing and trigger.

**Scenario:** A clue says "the database upgrade failed halfway; the team restored the snapshot taken just before the change and the application worked again within 20 minutes." The answer is the backout plan. Disaster recovery is the closest wrong answer and fails because this was a planned rollback of one change, not recovery from a disaster.

**Example:** backout section: `Trigger: login failures > 5% for 10 min after cutover. Steps: 1) stop app service 2) revert VM snapshot snap-pre-chg4471 3) start service 4) run login test. Expected time: 15 min. Tested in staging 11/04.`

### Maintenance window (change window)

A maintenance window is a pre-agreed period, usually when the business is quiet (nights, weekends), during which approved changes may be made because any disruption will affect the fewest people. Many organizations also declare change freezes during critical business periods, when only emergency changes are allowed. Managerial and operational control.

**How it works:**
1. The organization defines standard windows per system or region, based on when usage is lowest.
2. Each change is scheduled into a window long enough for the work, testing in production and the backout.
3. Stakeholders are told in advance about any expected downtime.
4. Work starts and ends inside the window; if it cannot finish, the backout runs before the window closes.
5. Freezes (for example year-end close for finance, peak shopping season for retail) block non-emergency changes for a period.

**Why it matters:** the same change can be harmless at 02:00 on Sunday and costly at 10:00 on Monday. Windows also give staff a predictable time to be ready and on call.

**Common confusions:** A maintenance window is about WHEN; the backout plan is about HOW TO UNDO; the approval process is about WHETHER. For a global company there is rarely a time when nobody is working, so windows are chosen per region or system. An emergency change can happen outside the window but must still be recorded and reviewed.

**Scenario:** A clue says "the web store's database upgrade is scheduled for Sunday between 01:00 and 04:00, when orders are lowest." The answer is a maintenance window. Downtime is the closest wrong answer and fails because downtime is the interruption itself; the window is the scheduled time chosen to limit its effect.

**Example:** policy line: `Standard window: Sun 01:00-05:00 local. Change freeze: Nov 20 to Jan 5 (peak season), emergency changes only with CISO approval.`

### Standard operating procedure (SOP)

A standard operating procedure is a written, step-by-step instruction for carrying out a routine task the same way every time. In change management, SOPs describe how the change process itself works and how routine (standard) changes are performed. Managerial in category (it is documentation), directive in type.

**How it works:**
1. Identify a task that recurs: submitting a change, deploying a patch, rotating a certificate, adding a firewall rule.
2. Write the steps, inputs, approvals needed, checks and expected results, plus who does each step.
3. Approve and publish the SOP so staff can find it.
4. Staff follow it; deviations are recorded.
5. Update the SOP whenever the systems or process change (a change itself can require an SOP update).

**Why it matters:** consistent steps reduce mistakes, make changes predictable, help new staff work correctly, and give auditors something to compare actual practice against. Pre-approved standard changes are only safe because an SOP defines exactly how they are done.

**Common confusions:** An SOP (procedure) is more detailed than a policy (which states WHAT must happen and WHY) and more binding than a guideline (a recommendation). Policies, standards, procedures and guidelines are compared in objective 5.1. An SOP is not a backout plan, though an SOP can describe how to write one.

**Scenario:** A clue says "a new technician performs certificate renewals exactly like senior staff by following a documented step-by-step checklist." The answer is a standard operating procedure. A policy is the closest wrong answer and fails because a policy would not list the detailed steps.

**Example:** SOP excerpt: `SOP-NET-07 Add firewall rule: 1) open change request 2) attach business justification 3) security review for any rule allowing inbound from internet 4) apply in window 5) verify with test connection 6) update rule register and diagram.`

### Impact analysis vs test results vs backout plan vs maintenance window (change steps compared)

These four parts of a change request answer different questions, and a scenario usually contains one of those questions in disguise.

| Step | Question it answers | Decisive clue |
|---|---|---|
| Impact analysis | What could this affect, and what if we do not change? | "assess risk, side effects, rate high/medium/low" |
| Test results | Does it actually work, safely? | "sandbox, staging, lab, confirmed" |
| Approval process | May we do it? | "sign off, CAB, review board" |
| Maintenance window | When should we do it? | "low-usage time, scheduled, freeze" |
| Backout plan | How do we undo it if it fails? | "revert, rollback, restore snapshot" |
| Ownership | Who is accountable? | "accountable, requests, informed" |
| Stakeholders | Who is affected and must be told? | "departments affected, communicate" |
| SOP | How is this routine task done step by step? | "documented steps, checklist" |

**How they fit in order:** request, impact analysis, testing (including the backout), approval, scheduling in a window, implementation, verification, documentation updates, closure.

**Why it matters:** a change request missing one of these is a predictable source of failure; a board can reject a change simply because a part is missing (for example, no backout plan).

**Common confusions:** Impact analysis predicts, testing proves. The window is time, not a plan. The backout is planned before the change, used only if needed.

**Scenario:** A clue says "the team asks: if this upgrade fails at 03:00, how do we get back to yesterday's version?" The answer is the backout plan. Maintenance window is the closest wrong answer: 03:00 is the window, but the question asked is how to undo.

### Allow lists and deny lists in change management

An allow list (formerly called a whitelist) permits only the listed items and blocks everything else; a deny list (formerly blacklist) blocks only the listed items and permits everything else. They govern applications, network addresses, ports, websites and devices. In change management they matter because a change can be blocked by a list, or can need a list updated, and a careless list edit can open unintended access.

**How they interact with a change:**
1. During impact analysis, check whether the change adds or renames software, files, ports, addresses or certificates that a list controls.
2. Plan the list update as part of the same change: add the new application hash or publisher, new server address, new port.
3. Remove entries the change makes obsolete (the old server's address), so lists do not grow into permanent holes.
4. Test that the new version runs and that nothing else became allowed by accident.
NIST describes an allow list approach for software as deny all, permit by exception, with the authorized list reviewed regularly; integrity checks such as hashes or signatures can confirm the listed program is the real one.

**Why it matters:** an allow list is strict and safe but brittle: an approved update with a new file hash may simply refuse to run, causing an outage. A deny list is easy to live with but misses anything new; antivirus works much like a very large deny list. Either way, an unreviewed edit (allowing "any" to fix a broken app) can quietly remove protection.

**Common confusions:** Allow list = default deny; deny list = default allow. Updating a list is a change in its own right and should be reviewed. Allow lists are stronger against unknown malware; deny lists are easier to maintain.

**Scenario:** A clue says "after an approved upgrade, the accounting application will not start; logs show the application control tool blocked the new executable." The technical implication is that the allow list needed updating as part of the change. Dependencies is the closest wrong answer and fails because nothing the application relies on broke; the security list blocked it.

**Example:** application control rule after the change: `allow publisher="Example Accounting Ltd" product="LedgerPro" version>=12.4` replacing the old `allow hash=9f2c...` for version 12.3.

### Restricted activities (change scope)

Restricted activities means the people doing a change may do only what was approved, within the approved scope, systems and time; anything else, even a helpful fix, needs its own change request. It keeps the real change identical to the one that was analyzed, tested and approved. Managerial and directive in nature.

**How it works:**
1. The approved change states exactly what will be done, on which systems, by whom, in which window.
2. Implementers follow that scope; access may be limited to the systems in scope for the duration (NIST lists access restrictions for change as part of change control).
3. If they discover another problem, they record it and raise a separate change rather than fixing it on the spot.
4. Some policies allow a small extra step only when the approved task cannot be completed without it, and that must be documented.

**Why it matters:** an unapproved "while I'm in there" fix has had no impact analysis, no testing and no backout plan. If it breaks something, the change record points investigators at the wrong cause, and the backout plan may not undo it.

**Common confusions:** Restricted activities is about staying inside the approved scope, not about forbidden activities in general (like an acceptable use policy). It is not the same as least privilege, though limiting access during a change supports it.

**Scenario:** A clue says "while installing an approved patch, a technician also changed the server's DNS settings to fix a problem he noticed; that night replication failed." The violated principle is restricted activities (scope). Backout plan is the closest wrong answer: the backout covered the patch, but the real problem is the unapproved extra change.

**Example:** change notes: `Scope: install KB-2026-11 on SRV-APP01..03 only. Out of scope: DNS, firewall, other servers. Issue found: SRV-APP02 DNS suffix wrong, raised as CHG-4502.`

### Downtime (planned outage)

Downtime is the time a system or service is unavailable, either planned (for a change) or unplanned (from a failure). In change management, planned downtime must be identified, minimized, scheduled and communicated. It is the availability leg of the CIA triad.

**How it is handled:**
1. Impact analysis states whether the change requires downtime and for how long.
2. Engineers look for ways to avoid it: failing over to a second server or site, rolling the change through one node at a time behind a load balancer.
3. Unavoidable downtime is scheduled into a maintenance window.
4. Stakeholders and customers are told in advance (status page, email).
5. The window includes time for the backout so downtime never runs past the agreed end.

**Why it matters:** downtime costs revenue, productivity and sometimes contractual penalties if a service level agreement is missed. Unannounced downtime also floods the help desk and can look like an attack.

**Common confusions:** Downtime is the outage itself; the maintenance window is when it is scheduled. Restarts are a common cause of downtime but are listed separately (service restart, application restart). Failover reduces downtime but must itself be tested.

**Scenario:** A clue says "the team plans to patch both web servers one at a time while the load balancer sends traffic to the other, so customers see no outage." The concern being addressed is downtime. Maintenance window is the closest wrong answer and fails because the clue is about avoiding the outage, not choosing the time.

**Example:** change plan: `Node A drained 22:00, patched, returned 22:20; Node B drained 22:20, patched, returned 22:40. Expected customer-facing downtime: none.`

### Service restart (change management)

A service restart means stopping and starting a background service or daemon (a web server, database, directory service, logging agent) so that a change takes effect. Many configuration changes and patches only apply after the service restarts, and the restart can interrupt users or fail to come back cleanly. A technical implication that affects availability.

**How it is handled:**
1. Identify during planning which services must restart and which other systems depend on them.
2. Schedule the restart inside the maintenance window and warn stakeholders.
3. Restart in the right order when services depend on each other (database before application service).
4. Check that the service started and is healthy: process running, port listening, health check passing, logs normal.
5. Check that security services restarted too: a logging or antivirus agent that fails to start leaves a silent gap.

**Why it matters:** a service that does not come back after a restart turns a small configuration change into an outage. A security agent that fails silently after a restart means attacks go unseen.

**Common confusions:** A service restart concerns background processes users do not interact with directly; an application restart concerns programs users have open. A service restart is not a full system reboot, though a reboot restarts all services.

**Scenario:** A clue says "after a certificate was replaced on the web server, the site still showed the old certificate until the web service was restarted." The technical implication is a service restart. Application restart is the closest wrong answer and fails because the web server is a background service, not a program a user has open.

**Example:** post-change check: `systemctl restart nginx` then `systemctl is-active nginx` returns `active`, a test request to the shop site returns status `200`, and the new certificate's serial is shown.

### Application restart (change management)

An application restart means closing and reopening a program that users interact with so that an update or configuration change takes effect. Users may be interrupted, lose unsaved work, or need to sign in again. A technical implication that affects availability and user productivity.

**How it is handled:**
1. Note in the change plan which applications must restart and who uses them.
2. Warn users ahead of time and give them time to save work.
3. Restart during low use, or let users restart at their convenience within a deadline.
4. Check afterwards that the application opens, connects to its back end and keeps its settings.
5. Watch for applications that fail to restart, or restart with default settings that weaken security (for example a plug-in disabled).

**Why it matters:** an unexpected forced restart in the middle of work destroys trust in IT and causes data loss. A badly managed restart can also leave some users on the old, vulnerable version.

**Common confusions:** Application restart is the user-facing counterpart of a service restart. Some updates need the whole operating system rebooted, which restarts both. "Application" here means the program, not a web application server process (that is a service).

**Scenario:** A clue says "the update to the desktop accounting program takes effect only after users close and reopen it, and unsaved work will be lost." The technical implication is an application restart. Service restart is the closest wrong answer and fails because the program is something users have open, not a background service.

**Example:** user notice: `The spreadsheet add-in update installs at 18:00. Save your work; the program will close and reopen automatically. Expected interruption: 2 minutes.`

### Legacy applications (change management)

Legacy applications are older programs or systems still in use, often no longer supported by the vendor, poorly documented, and fragile: they may break when anything around them changes. In change management they need extra care, and they often need compensating controls because they cannot be patched or updated in the normal way.

**How they are handled:**
1. Inventory legacy systems and record what they depend on and what depends on them; documentation may have to be rebuilt from observation.
2. Treat changes that touch them, even indirectly (an operating system patch, a new TLS setting, a database driver update), as higher risk in the impact analysis.
3. Test in a faithful copy if one can be built; keep a solid backout plan.
4. Where updates are impossible, add compensating controls: isolate on its own network segment, restrict access to a few addresses, add monitoring.
5. Plan replacement, since the risk grows over time.

**Why it matters:** legacy systems often run critical business processes (billing, manufacturing) that nobody dares touch. A well-meant upgrade elsewhere (disabling an old protocol) can stop them working, and an unpatched legacy system is an easy entry point.

**Common confusions:** Legacy does not mean unimportant; it often means critical and irreplaceable. Isolating a legacy system is a compensating control, not a fix. The risk is in both directions: changing it can break it, and NOT changing it leaves known flaws open.

**Scenario:** A clue says "a company disabled an old encryption protocol across its network; the next day a 15-year-old inventory system could no longer talk to its database." The technical implication is a legacy application. Dependencies is the closest wrong answer: dependencies is involved, but the clue stresses an old, fragile system that could not handle the change.

**Example:** risk register entry: `LEG-03 Inventory system v4 (vendor support ended). Only supports an old protocol version. Compensating: VLAN 40 isolated, ACL allows DB host only. Replacement target: Q3.`

### Dependencies (change management)

A dependency is a relationship where one component needs another to work: an application needs a database, a service needs a certificate, a server needs DNS, a script needs a library version. Changing one component can force changes or restarts in others, sometimes far away. Mapping dependencies is part of impact analysis.

**How it is handled:**
1. Map dependencies before the change: what does this component need, and what needs it? Configuration management databases and diagrams help.
2. Identify the order of changes and restarts (upgrade the database driver before the application that uses it).
3. Include dependent systems' owners as stakeholders and test the whole chain, not only the changed part.
4. Plan the backout across all affected components, not just the first one.

**Why it matters:** the most surprising outages come from hidden dependencies: renewing one certificate breaks an integration that pinned the old one; restarting an authentication server logs out every application. A security change (stricter cipher settings, a firewall rule) can cut off a dependency nobody documented.

**Common confusions:** Dependencies are about relationships; legacy applications are about old fragile components (often with undocumented dependencies). Dependencies can be technical (software) or operational (a partner's system that consumes your file every night).

**Scenario:** A clue says "upgrading the directory service required the email server and the VPN to be restarted, because both rely on it for authentication." The technical implication is dependencies. Service restart is the closest wrong answer: restarts happened, but the clue explains them by the relationship between systems.

**Example:** dependency map entry: `auth-dir01 -> required by: mail01 (LDAP bind), vpn-gw (RADIUS backend), hr-app (SSO). Change to auth-dir01 requires: notify 3 owners, restart order dir -> vpn -> mail -> hr-app.`

### Technical implications of a change compared (allow lists, scope, downtime, restarts, legacy, dependencies)

The technical implications are the side effects a change can have on running systems. Each one is a different reason a correctly approved change can still cause an outage or a security gap.

| Implication | What goes wrong | Decisive clue |
|---|---|---|
| Allow lists and deny lists | A security list blocks the new version, or a list edit opens access | "blocked by application control, rule updated" |
| Restricted activities | Someone does more than was approved | "also fixed, outside scope, while he was there" |
| Downtime | The service is unavailable during the change | "outage, unavailable, failover to avoid" |
| Service restart | A background service must restart and may not return | "daemon, web service, agent did not start" |
| Application restart | A user-facing program must close and reopen | "users lose unsaved work, reopen the program" |
| Legacy applications | An old, unsupported system breaks or cannot be changed | "old, unsupported, vendor gone" |
| Dependencies | A change in one place forces changes elsewhere | "relies on, required restarting other systems" |

**How to use the table:** find the cause the clue stresses. Several implications often appear together (a dependency causes a service restart that causes downtime), so answer with the one the question's wording points at.

**Why it matters:** impact analysis is only as good as its list of side effects to look for. Walking this list for each change catches most surprises before production.

**Common confusions:** Downtime is the result; restarts and dependencies are common causes. Legacy and dependencies overlap, since old systems often have undocumented dependencies; "old and unsupported" points to legacy, "relies on another system" to dependencies. Restricted activities is about people's actions, the rest are about system behavior.

**Scenario:** A clue says "a new endpoint agent was approved and deployed, but on the factory floor an old control workstation froze because it could not run the agent." The stressed implication is legacy applications. Allow list is the closest wrong answer and fails because nothing was blocked by a list; the old system could not cope with the new software.

### Updating diagrams (change documentation)

Updating diagrams means revising network, system, data flow and rack diagrams as part of every change that alters what they show, so the documentation matches reality. Diagrams are configuration items in their own right: NIST lists network diagrams among the things placed under configuration management. Managerial and operational control supporting detection and response.

**How it works:**
1. During planning, note which diagrams the change affects (a new server, a new firewall rule path, a moved VLAN, a new cloud connection).
2. Update the diagrams as a required step of closing the change, not later "when there is time".
3. Store diagrams under version control so earlier versions can be compared.
4. Review them periodically against the real environment (discovery scans, cloud inventory) to catch drift.

**Why it matters:** during an incident, responders use diagrams to decide what to isolate and where an attacker could move. A diagram missing last month's new connection sends them the wrong way. Outdated diagrams also hide forgotten systems that never get patched, and they slow every later impact analysis.

**Common confusions:** Updating diagrams is not optional cleanup; a change is not complete until documentation is current (NIST's implementation step includes updating system documentation). A diagram is not an inventory: the inventory lists assets, the diagram shows how they connect and where data flows.

**Scenario:** A clue says "during an incident, the team isolated the wrong network segment because the network map did not show a link added during a project six months ago." The failure is not updating diagrams. Version control is the closest wrong answer and fails because the diagram was never revised at all; there was no newer version to find.

**Example:** change closure checklist: `[x] Network diagram NET-CORE v14 -> v15 (added partner link, firewall fw-ext-02) [x] Data flow diagram updated [x] Rack elevation updated`.

### Updating policies and procedures (change documentation)

Updating policies and procedures means revising the written rules and step-by-step instructions whenever a change alters how work is done or what is required, so staff follow documents that match the systems. A new system, a retired one, or a changed process each can make existing documents wrong. Managerial control.

**How it works:**
1. During impact analysis, ask which policies, standards, SOPs (standard operating procedures), runbooks and training materials mention the thing being changed.
2. Draft the revisions alongside the technical work.
3. Have the document owners approve them through the normal document review.
4. Publish the new versions when the change goes live, and tell affected staff (and train them if behavior changes).
5. Keep old versions in version control for audit history.

**Why it matters:** a procedure that describes the old system makes staff either fail or improvise, and improvised steps skip security checks. An incident runbook pointing at a decommissioned logging server costs precious time. Auditors compare practice with written procedure, so stale documents become findings.

**Common confusions:** Policies change less often than procedures: a policy states the rule, the procedure states the steps, and most technical changes affect procedures first. Updating documents is part of the change, not a separate project. This is different from updating diagrams, which show structure rather than instructions.

**Scenario:** A clue says "after the company moved from on-site backups to a cloud backup service, the restore instructions still told staff to fetch tapes from the safe." The missing step is updating policies and procedures. Updating diagrams is the closest wrong answer and fails because the stale item was a set of instructions, not a picture of the environment.

**Example:** change task: `Revise SOP-BKP-02 "Restore a file server" for the cloud backup console; retire SOP-BKP-01 "Tape rotation"; update the backup policy's retention section; brief the help desk.`

### Version control (revision history for code, configurations and documents)

Version control records every change to a file or set of files over time: what changed, who changed it and when, so any earlier version can be compared or restored. It is used for source code, device configurations, scripts, infrastructure definitions and documents. It supports integrity and accountability and makes backouts possible.

**How it works:**
1. Files live in a repository; each saved change (commit) is stored with author, time and a message, ideally naming the change request.
2. Anyone authorized can see the history and compare any two versions to find exactly what differs.
3. A bad change is reverted by restoring the earlier version.
4. Access controls and reviews (a second person approves before a change merges) add separation of duties.
Systems can be centralized (one server holds the history, a single point of failure) or distributed (every copy holds the full history, so any copy can restore the server).

**Why it matters:** when a firewall or router misbehaves after a change, version control answers "what changed?" in seconds and gives the exact previous configuration to restore. It also detects unauthorized changes: a running configuration that differs from the last approved version is a warning sign. NIST notes that older approved baseline configurations are kept available for review or rollback.

**Common confusions:** Version control records and restores versions; change management decides whether a change may be made. Version control is not a backup of data: it tracks deliberate revisions of files, not a full copy of a system's contents. The backout plan is the procedure; version control is one of its tools.

**Scenario:** A clue says "a router began dropping traffic after an edit; the engineer needs to see exactly which lines changed and restore last week's configuration." The answer is version control. Backout plan is the closest wrong answer: restoring is a backout, but the ability to see the differences and retrieve the old version comes from version control.

**Example:** `git log --oneline fw-edge.conf` shows `a41c9e2 CHG-4471 allow partner range to api-gw`; `git diff 7be02d1 a41c9e2` shows the single added rule; `git revert a41c9e2` restores the earlier configuration.

## 1.4 Choosing appropriate cryptographic solutions

Depth asked: explain. A good answer names the right tool for the goal (confidentiality, integrity, proof of origin, key protection), says why it fits, and says why the nearest alternative does not.

### Public key infrastructure (PKI)

Public key infrastructure is the whole system of policies, roles, hardware, software and procedures that creates, distributes, manages, stores and revokes digital certificates. A certificate binds a public key to an identity (a person, server or device), and PKI is what makes that binding trustworthy at scale. It underpins authentication, confidentiality (through key exchange) and non-repudiation.

**How it works:**
1. An entity generates a key pair and keeps the private key.
2. It sends the public key and its identity details to a certificate authority (CA) in a certificate signing request (CSR).
3. A registration authority (RA), if used, or the CA itself checks the identity.
4. The CA signs and issues a certificate. Trust flows from a root CA through intermediate CAs to the end certificate (the chain of trust).
5. Relying parties (browsers, servers, VPN gateways) validate the chain, the dates and the revocation status before trusting the key.
6. The CA revokes certificates that should no longer be trusted and publishes that status (CRL, the certificate revocation list, or OCSP, the Online Certificate Status Protocol).
7. Certificates expire and are renewed; keys are rotated.

**Why it matters:** without PKI, anyone could hand you a public key and claim to be your bank. PKI lets strangers trust each other's keys through a shared trusted third party, which is what makes HTTPS, signed software, secure email and certificate-based network access possible.

**Common confusions:** PKI is not one product or one server; a CA is only one part of it. PKI is built on asymmetric cryptography but mostly exists to manage trust in public keys, not to encrypt bulk data. A key management system manages keys of all kinds through their lifecycle; PKI specifically manages certificates and the identities bound to them.

**Scenario:** A clue says "a company wants every laptop, server and employee to have a verifiable digital identity it can issue and revoke centrally." The answer is a PKI with an internal CA. A key management system is the closest wrong answer and fails because it manages keys but does not bind them to verified identities in certificates.

**Example:** chain shown by a browser: `Example Root CA -> Example Issuing CA 2 -> www.example.org`, each certificate signed by the one above it, the root already in the device's trust store.

### Public key and private key (asymmetric key pair)

A public key and a private key are the two mathematically linked halves of an asymmetric key pair. The public key is shared with anyone; the private key is held only by its owner. What one key does, only the other can undo or check, and the private key cannot practically be worked out from the public key.

| Goal | Key used | Whose key |
|---|---|---|
| Send someone confidential data | Encrypt with the public key | Recipient's |
| Read data sent to you | Decrypt with the private key | Your own |
| Sign data | Sign with the private key | Sender's (signer's) |
| Verify a signature | Verify with the public key | Sender's (signer's) |

**How to reason it out:**
1. Ask what is wanted: secrecy or proof of origin.
2. For secrecy, the key that must stay exclusive is the one that DEcrypts, so encrypt with the recipient's public key; only their private key opens it.
3. For proof of origin, the key that must stay exclusive is the one that SIGNS, so sign with the sender's private key; anyone can verify with the sender's public key.
4. Never share a private key; share public keys freely, normally inside a certificate.

**Why it matters:** using the wrong key gives no protection: "encrypting" with your own private key hides nothing, since everyone has your public key. If a private key is exposed, an attacker can read data meant for the owner and sign as the owner, so the certificate must be revoked and the pair replaced.

**Common confusions:** The public key is not secret and does not need protecting from disclosure, only from being swapped for a fake (certificates solve that). A certificate contains the public key, never the private key. Signing does not hide the message.

**Scenario:** A clue says "Dana wants only Omar to be able to read a file she sends." The answer is to encrypt with Omar's public key. Dana's private key is the closest wrong answer and fails because anyone with Dana's public key could then read it.

**Example:** Dana's mail client fetches Omar's certificate, encrypts the message key with the public key inside it, and sends the result; only the private key on Omar's smart card can open it.

### Key escrow

Key escrow means keeping a copy of a decryption key with a trusted third party or in a protected, controlled store, so encrypted data can be recovered if the original key is lost, the owner leaves, or lawful access is required. The CNSS glossary used by NIST defines it as retaining the private part of the key pair tied to a subscriber's encryption certificate. It protects availability of encrypted data.

**How it works:**
1. When an encryption key pair is created, a copy of the private (decryption) key is sent securely to the escrow holder.
2. The escrow store is strongly protected and access needs strict, recorded approval.
3. When recovery is needed (lost smart card, departed employee, legal order), an authorized request releases the key or decrypts the data.
4. Every release is logged and reviewed.

**Why it matters:** encryption without recovery turns one lost key into permanently lost business data. Escrow lets an organization keep access to its own information. It also concentrates risk: whoever controls the escrow can read everything, so the holder must be highly trusted and tightly controlled.

**Common confusions:** Escrow is about ENCRYPTION keys (the definition names the encryption certificate). A second copy of a signing key would let someone else sign as the owner, which undermines non-repudiation. Key escrow is not a key management system: escrow is one recovery function, while a key management system handles the whole lifecycle. A recovery agent (for example in Windows Encrypting File System) is a related idea: a designated account that can decrypt users' files.

**Scenario:** A clue says "an employee left the company and her encrypted project files must still be opened." The answer is key escrow (or a recovery agent). Certificate revocation is the closest wrong answer and fails because revoking stops future trust in the certificate but does nothing to decrypt existing files.

**Example:** escrow log: `2026-10-12 key recovery for user kpatel encryption cert serial 4A:19 approved by: HR director, security officer; released to: IT recovery agent; reason: employee departure`.

### Full-disk encryption (FDE)

Full-disk encryption encrypts everything on the drive a computer boots from, including the operating system, swap and temporary files, and allows access only after successful authentication. It protects confidentiality of data at rest, above all on lost, stolen or discarded devices.

**How it works (software FDE):**
1. The whole drive is encrypted with a symmetric key.
2. At power on, a small pre-boot environment asks for authentication (PIN, password, token) or a TPM (Trusted Platform Module) releases the key after checking that the boot components were not tampered with.
3. The operating system loads; the FDE software decrypts and encrypts disk sectors transparently as they are read and written.
4. When the device is powered off, everything on the drive is ciphertext.
Hardware FDE does the same inside the drive itself (a self-encrypting drive), with little performance cost and keys that never enter the computer's memory.

**Why it matters:** a stolen laptop without FDE gives up every file by moving the drive to another machine. With FDE the thief gets only ciphertext.

**Common confusions:** FDE protects a device that is OFF or locked at pre-boot. Once the system is unlocked and running, data is readable to any logged-in user or malware, so FDE does not replace access controls. NIST warns that sleep modes which do not write memory to disk leave data unprotected. FDE does not protect a file after it is copied to a USB stick or emailed. BitLocker and FileVault are the usual examples; Microsoft describes BitLocker as encrypting entire volumes, and it gives the strongest protection with a TPM.

**Scenario:** A clue says "sales staff carry laptops with customer data; the company must make sure a stolen laptop exposes nothing." The answer is full-disk encryption. File encryption is the closest wrong answer and fails because users would have to remember to encrypt each file, and temporary files and swap would stay exposed.

**Example:** laptop build standard: `OS drive: encrypted, protector = TPM plus startup PIN; recovery key backed up to the directory; encryption verified before the device is handed to the user`.

### Partition encryption and volume encryption

Partition encryption encrypts one partition (a fixed section of a single physical disk) and leaves others as they are. Volume encryption encrypts a logical volume, a storage unit the operating system presents with one file system, which may be one partition, part of a disk or a span across several disks. Both protect confidentiality of data at rest at a scope narrower or more flexible than a whole boot drive.

**How it works:**
1. Choose the partition or volume to protect (a data partition, a removable USB volume, a storage volume spanning disks).
2. The encryption software, running in the operating system, handles every read and write to it.
3. After the user or system authenticates, the volume is mounted (unlocked) and sectors are decrypted and encrypted on the fly.
4. When unmounted or powered off, its contents are ciphertext; other partitions stay as they were.
A related option is virtual disk encryption: an encrypted container file that mounts as a drive and can be copied elsewhere with its encryption intact, which a volume cannot.

**Why it matters:** not every case needs or allows whole-drive encryption. A server can keep an unencrypted system partition and an encrypted data volume; a USB drive can be encrypted as a volume and carried between machines (BitLocker To Go is the common example).

**Common confusions:** A partition is a physical division of one disk; a volume is a logical unit that can be a partition or span disks. NIST notes that encrypting the boot and system volumes is in effect full-disk encryption. The levels are not a strict ladder: "larger to smaller" is only a rough guide. As with FDE, a mounted volume is readable by whoever is logged in.

**Scenario:** A clue says "a file server has storage spread over four disks presented as a single drive letter; only that logical drive must be encrypted." The answer is volume encryption. Partition encryption is the closest wrong answer and fails because the storage spans several disks, not one section of one disk.

**Example:** disk layout: `Disk 0: Partition 1 EFI (clear), Partition 2 OS (clear), Partition 3 DATA (encrypted)` is partition-level; `Volume D: spanning Disk 1 + Disk 2 (encrypted)` is volume-level.

### File encryption (file and folder level)

File encryption encrypts individual files, or marks folders so every file placed in them is encrypted, and allows access only to authorized users. It protects confidentiality of specific data at rest, per user, even on a running, shared system.

**How it works (Windows Encrypting File System, EFS, as the example):**
1. For each file, the system generates a random symmetric file encryption key and encrypts the file with it.
2. That file key is encrypted with the user's public key and stored in the file's header.
3. To open the file, the user's private key decrypts the file key, which decrypts the file. Other users on the same computer cannot.
4. A copy of the file key encrypted for a recovery agent allows recovery if the user's key is lost.
This is hybrid encryption: fast symmetric encryption for the data, asymmetric for the small key.

**Why it matters:** full-disk encryption stops a thief with a powered-off laptop but not a second user, an administrator browsing, or malware on a running system. File encryption keeps chosen files protected per user and can use different keys for different data.

**Common confusions:** File-level encryption does not hide everything: NIST notes it cannot protect file names and other file metadata, which can themselves reveal information. EFS works only on NTFS volumes, so a copy placed on a drive with another file system (such as a FAT32 USB stick) is no longer protected by it, and a file opened from or saved to an ordinary network file share crosses the network decrypted, so transport protection is still needed. Microsoft's documents use both Encrypting File System and Encrypted File System for this feature; the SY0-701 acronym list uses Encrypted File System. Encrypting a folder is safer than single files, because temporary plaintext copies are avoided.

**Scenario:** A clue says "several staff share one workstation, and only the HR officer may open the salary spreadsheet stored on it." The answer is file encryption. Full-disk encryption is the closest wrong answer and fails because once the workstation is unlocked, every logged-in user could read the file.

**Example:** the HR officer marks the folder `C:\HR\Reviews` for encryption; every file saved there is encrypted with its own file key, and another local user who tries to open one is refused.

### Database encryption (transparent data encryption, TDE)

Database encryption at this level encrypts a whole database at rest: its data files, its log files and its backups. The database engine does it automatically, so applications need no changes; the best-known form is transparent data encryption (TDE). It protects confidentiality against someone who steals the files, disks or backup media.

**How it works (Microsoft SQL Server TDE as the example):**
1. A symmetric database encryption key is created for the database.
2. That key is protected by a certificate or an asymmetric key held outside the database (in the server's master database or an external key manager such as a hardware security module).
3. Pages are encrypted before being written to disk and decrypted when read into memory, in real time.
4. Backups are encrypted with the same key, so restoring them needs the protecting certificate.
5. Authorized queries see normal data; the encryption is invisible to them.

**Why it matters:** without it, anyone who copies the database files or takes a backup tape can attach the database elsewhere and browse it. TDE closes that route and helps meet rules that require encryption of stored data. Losing the protecting certificate means losing the database, so its backup is critical.

**Common confusions:** TDE protects data at rest only. Microsoft states it does not encrypt communication channels, so connections still need TLS. It does not hide data from users or administrators who can query the database; record-level (column) encryption is the tool for that. Database encryption is narrower than full-disk encryption (one database, not the drive) and broader than record encryption (everything in the database, not chosen fields).

**Scenario:** A clue says "auditors require that if the database server's backup tapes are stolen, the data on them is unreadable, with no application changes." The answer is database encryption (TDE). Record encryption is the closest wrong answer and fails because it protects only selected fields and usually needs application changes.

**Example:** `CREATE DATABASE ENCRYPTION KEY WITH ALGORITHM = AES_256 ENCRYPTION BY SERVER CERTIFICATE MyServerCert;` then `ALTER DATABASE Sales SET ENCRYPTION ON;`.

### Record encryption (column-level and field-level encryption)

Record encryption encrypts individual records or, more often, individual fields (columns) inside a database, so only the sensitive values are ciphertext and the rest stays readable. It is the most granular encryption level on the SY0-701 list and can use different keys for different data. It protects confidentiality even from people who can query the table.

**How it works:**
1. Identify the sensitive fields (card number, national ID, diagnosis).
2. Encrypt those values with a key held by the application or a key management system, not by ordinary database users.
3. Store ciphertext in the column; other columns remain in the clear for searching, sorting and reporting.
4. Only applications or users with access to the key can decrypt the field; a database administrator running a query sees ciphertext.

**Why it matters:** whole-database encryption does nothing against an insider or attacker with a valid database login, because the engine decrypts for every authorized query. Record encryption keeps the most sensitive values protected inside the database and limits what one stolen account exposes.

**Common confusions:** Record encryption is not data masking: masking changes what is DISPLAYED and leaves the stored value intact, while record encryption changes what is STORED. It is not tokenization, which swaps the value for a substitute kept in a vault. It costs more to build than TDE, because applications must handle keys and encrypted fields cannot easily be searched or indexed.

**Scenario:** A clue says "only the Social Security number column must be protected so that even database administrators cannot read it, while names and cities stay searchable." The answer is record (column-level) encryption. Database encryption (TDE) is the closest wrong answer and fails because administrators' queries would still return the numbers in the clear.

**Example:** table as seen by a DBA: `id=1041 | name=R. Alvarez | city=Tucson | ssn=0x8F3A...C21E (ciphertext)`.

### Full-disk vs partition vs volume vs file vs database vs record encryption (encryption levels compared)

The six levels describe how much data one encryption mechanism covers at rest. The right level is the smallest scope that still covers the threat in the scenario.

| Level | Covers | Typical threat answered | Example |
|---|---|---|---|
| Full-disk | The entire boot drive, including the OS | Lost or stolen device | BitLocker, FileVault |
| Partition | One section of one disk | Protect a data partition only | Encrypted data partition |
| Volume | A logical volume, possibly spanning disks | Removable drive, storage volume | BitLocker To Go |
| File | Chosen files or folders, per user | Other users of a shared system | EFS |
| Database | A whole database: data files, logs, backups | Stolen database files or backups | TDE |
| Record | Selected fields or rows | Insiders and stolen database logins | Encrypted card-number column |

**How to choose, step by step:**
1. Is the worry a lost laptop or a discarded drive? Full-disk.
2. Is it a removable drive or one logical drive on a server? Volume (or partition if it is one section of one disk).
3. Is it other users on the same running machine? File.
4. Is it stolen database files or backups, with no application changes allowed? Database.
5. Is it specific sensitive fields that even administrators should not read? Record.

**Why it matters:** broader levels are simple but stop protecting once the system is unlocked; finer levels keep protecting on a running system but cost more to manage. Layering is normal: a server can use full-disk, database and record encryption together.

**Common confusions:** The list is not a strict size order (a volume can be bigger than a disk). All six are data-at-rest protections; none protects data moving over a network. "Transparent" database encryption does not hide data from authorized queries.

**Scenario:** A clue says "a stolen backup of the customer database must be useless, and separately the card number field must be unreadable to support staff who query the live database." Two answers: database encryption for the backup, record encryption for the field. Full-disk encryption fails both, because backups leave the disk and live queries see plaintext.

### Transport encryption (communication encryption, data in transit)

Transport or communication encryption protects data while it moves across a network, so anyone who intercepts the traffic sees only ciphertext. It serves confidentiality, and the protocols that provide it normally add integrity checks and authentication of the endpoints. Protocol port numbers are in the Reference chapter.

**How it works (TLS, Transport Layer Security, as the model):**
1. The client connects and the two sides agree on algorithms.
2. The server proves its identity with a certificate; the client validates it.
3. The two sides perform a key exchange (ephemeral Diffie-Hellman in TLS 1.3) to create shared session keys.
4. All application data is then encrypted and integrity-protected with fast symmetric keys.
5. Keys are discarded when the session ends.

**Common forms:**
- TLS protects web traffic (HTTPS), mail and many other application protocols.
- IPsec (Internet Protocol Security) protects IP packets, typically in site-to-site and remote access VPNs (virtual private networks).
- SSH (Secure Shell) protects remote administration and file transfer.

**Why it matters:** networks between two endpoints are not under your control: public Wi-Fi, internet providers, shared office networks. Without transport encryption, passwords and data can be read or altered on the way (an on-path attack).

**Common confusions:** Transport encryption protects data in transit, not at rest: once delivered, the data is plaintext at the endpoint unless something else encrypts it. Full-disk or database encryption does not protect traffic. SSL (Secure Sockets Layer) is the legacy, broken predecessor of TLS and must not be used, although people still say "SSL certificate". A VPN encrypts between its two ends only; beyond the VPN gateway the traffic may travel in the clear.

**Scenario:** A clue says "users at coffee shops submit orders to the company's web application; an attacker on the same Wi-Fi must not be able to read them." The answer is transport encryption with TLS (HTTPS). Database encryption is the closest wrong answer and fails because it protects stored data on the server, not data crossing the Wi-Fi.

**Example:** a packet capture of an HTTPS session shows the handshake and then only `Application Data` records of ciphertext; the same site over plain HTTP would show `POST /login user=...&password=...` in readable text.

### Symmetric encryption (shared secret key)

Symmetric encryption uses one secret key for both encrypting and decrypting. It is fast and suits large amounts of data, so it does the bulk work in disk encryption, databases, VPNs and TLS sessions. Its problem is getting the same key to both sides safely. AES (Advanced Encryption Standard) is the current standard algorithm.

**How it works:**
1. Both parties hold the same secret key.
2. The sender runs the plaintext and key through the algorithm (with an initialization vector where the mode needs one) to produce ciphertext.
3. The receiver runs the ciphertext and the same key through the algorithm to recover the plaintext.
4. Anyone without the key sees only ciphertext; anyone WITH the key can both read and create messages.

**Why it matters:** speed. Symmetric algorithms are far faster than asymmetric ones, which is why real systems use asymmetric methods only to set up a symmetric key and then switch. The costs are key distribution and scale: each pair of parties that needs private communication needs its own shared key.

**Common confusions:** Symmetric encryption cannot give non-repudiation, because at least two parties hold the key and either could have produced a message. "Secret key" and "shared key" cryptography are other names for it. A symmetric key is much shorter than an asymmetric key of similar strength (see key length). DES (Data Encryption Standard) and RC4 are outdated legacy ciphers, and NIST has withdrawn approval of triple DES (3DES) for new protection; none should be chosen today.

**Scenario:** A clue says "a backup system must encrypt several terabytes every night as quickly as possible." The answer is symmetric encryption (AES). Asymmetric encryption is the closest wrong answer and fails because it is far too slow for bulk data.

**Example:** `AES-256 key K` encrypts a backup file; the same `K`, stored in a key management system, decrypts it during a restore.

### Asymmetric encryption (public key cryptography)

Asymmetric encryption uses a mathematically linked key pair: a public key that anyone may have and a private key only the owner holds. Data encrypted with the public key can be decrypted only with the private key, and a signature made with the private key can be verified with the public key. It solves key distribution and enables digital signatures. RSA and elliptic curve cryptography (ECC) are the main algorithm families.

**How it works:**
1. The owner generates a key pair and publishes the public key, usually in a certificate.
2. For confidentiality, a sender encrypts with the recipient's public key; only the recipient's private key decrypts.
3. For signatures, the owner signs with the private key; anyone verifies with the public key.
4. For key agreement, two parties exchange public values (Diffie-Hellman) and each derives the same shared secret.

**Why it matters:** two parties who have never met can communicate securely without first sharing a secret, and one party can prove authorship to everyone. This is the basis of PKI, TLS, secure email and code signing.

**Common confusions:** Asymmetric operations are slow, so they are used for small items (a session key, a hash) and not for bulk data; real systems are hybrid. Diffie-Hellman is asymmetric key AGREEMENT: NIST describes it as a way to establish secret keys over an insecure network; it does not encrypt data or sign anything. ECC reaches the same strength as RSA with much shorter keys. "Public key cryptography" is the same thing as asymmetric cryptography.

**Scenario:** A clue says "two companies with no prior contact need to set up encrypted communication over the internet without sending a shared secret by courier." The answer is asymmetric cryptography (for key exchange). Symmetric encryption alone is the closest wrong answer and fails because it would need the secret delivered safely first.

**Example:** in a TLS handshake the server's certificate carries an ECC or RSA public key used to check the server's signature, while an ephemeral Diffie-Hellman exchange produces the symmetric session key.

### Symmetric vs asymmetric encryption

Symmetric and asymmetric cryptography solve different problems and are almost always used together (hybrid encryption): asymmetric to authenticate and establish a key, symmetric to protect the data.

| Feature | Symmetric | Asymmetric |
|---|---|---|
| Keys | One shared secret key | Public and private key pair |
| Speed | Fast, suits bulk data | Slow, suits small data |
| Main weakness | Getting the key to the other side | Performance, and trust in public keys (solved by certificates) |
| Non-repudiation | No | Yes, through digital signatures |
| Typical use | Disk, database, VPN and session encryption | Key exchange, digital signatures, certificates |
| Examples | AES | RSA, ECC; Diffie-Hellman for key agreement only |
| Key length for similar strength | Short | Much longer (ECC shorter than RSA) |

**How hybrid encryption works:**
1. The sender creates a random symmetric key for this message or session.
2. The bulk data is encrypted with that symmetric key.
3. The symmetric key is protected asymmetrically: encrypted with the recipient's public key, or agreed with Diffie-Hellman.
4. The recipient recovers the symmetric key with the private key and decrypts the data.
EFS file encryption, secure email and TLS all follow this pattern.

**Why it matters:** choosing only one family fails in practice: symmetric alone cannot bootstrap trust between strangers, asymmetric alone is too slow for real volumes.

**Common confusions:** "More bits" does not compare across families: a 2048-bit RSA key is weaker than a 256-bit AES key. Asymmetric is not "more secure" than symmetric; it does a different job. Hashing is neither: it has no key and cannot be reversed.

**Scenario:** A clue says "a secure email system encrypts each message with a random AES key and then encrypts that key with the recipient's public key." This is hybrid encryption using both families. Answering "asymmetric encryption" alone misses that the message body is protected symmetrically.

### Key exchange (in-band, out-of-band, Diffie-Hellman)

Key exchange is how two parties come to hold the same symmetric key without an eavesdropper learning it. It solves the main weakness of symmetric encryption: distribution. It can happen out-of-band (over a different channel) or in-band (over the same network, protected by asymmetric cryptography).

**How it works:**
1. Out-of-band: the key travels by another route, such as in person, by courier or by phone. Simple and safe from network attackers, but slow and impractical at scale.
2. In-band with key transport: one side creates a symmetric key, encrypts it with the other side's public key and sends it; only the private key holder can recover it.
3. In-band with key agreement: both sides exchange Diffie-Hellman public values and each computes the same shared secret, which is never sent at all.
4. The result is a temporary session key used for fast symmetric encryption, then discarded.
The exchange must be authenticated (for example by a certificate and signature), or an on-path attacker can run a separate exchange with each side.

**Why it matters:** every encrypted web session, VPN tunnel and secure message depends on this step. If the exchange is weak or unauthenticated, the strongest cipher afterwards protects nothing.

**Common confusions:** Diffie-Hellman establishes a shared secret; it does not encrypt data or authenticate anyone by itself. A session key is temporary, unlike the long-term key in a certificate. TLS 1.3 removed static RSA and static Diffie-Hellman key exchange, so every full handshake uses fresh (ephemeral) keys and has forward secrecy; a session resumed with only a pre-shared key does not (see perfect forward secrecy). Out-of-band also describes authentication prompts on a second channel, a different use of the term.

**Scenario:** A clue says "two branch firewalls must build an encrypted tunnel over the internet and agree on a session key without ever transmitting that key." The answer is Diffie-Hellman key exchange. Encrypting the key with a symmetric algorithm is the closest wrong answer and fails because that would need a shared key already in place.

**Example:** handshake summary: `key exchange: ECDHE (ephemeral elliptic curve Diffie-Hellman), authentication: server certificate signature, session cipher: AES-GCM`.

### Perfect forward secrecy (PFS, ephemeral keys, DHE and ECDHE)

Perfect forward secrecy is a property of a key exchange in which every session gets its own fresh, short-lived keys, so stealing a long-term private key later cannot unlock sessions recorded earlier. It comes from ephemeral Diffie-Hellman: DHE (Diffie-Hellman ephemeral) or ECDHE (the elliptic curve version). The E means ephemeral: a new key pair per session, then thrown away.

**How it works:**
1. For each session, both sides generate a new temporary Diffie-Hellman key pair.
2. They exchange the public values and derive the session key.
3. The server's long-term private key is used only to SIGN the exchange (proving identity), never to protect the session key itself.
4. When the session ends, the temporary keys are deleted. Nothing stored later can rebuild that session key.

**Why it matters:** attackers can record encrypted traffic today and wait. Without forward secrecy (the old static RSA key exchange), one stolen server key decrypts every recorded session at once. With it, each session would have to be broken separately.

**Common confusions:** Forward secrecy protects PAST sessions from a FUTURE key theft; it does not protect future sessions if the attacker can now impersonate the server. TLS 1.3 gives forward secrecy for all its public-key key exchanges; resuming a session with only a pre-shared key, and early (0-RTT) data, do not have it. In IPsec, PFS is an option meaning a new Diffie-Hellman exchange for each security association. Static Diffie-Hellman reuses the same key pair and so has no forward secrecy.

**Scenario:** A clue says "an attacker captured a year of encrypted traffic and then stole the web server's private key, yet could not decrypt any of the recordings." The answer is perfect forward secrecy (ephemeral key exchange). A longer RSA key is the closest wrong answer and fails because key length does not help once the key itself is stolen.

**Example:** cipher suite `TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384`: ECDHE supplies forward secrecy, RSA signs the exchange, AES-GCM encrypts the data.

### Encryption algorithms (ciphers)

An encryption algorithm, or cipher, is the public mathematical procedure that turns plaintext into ciphertext and back, controlled by a key. Security rests on the secrecy of the key, never on hiding the algorithm. Choosing an appropriate solution means choosing current, publicly tested algorithms and avoiding deprecated ones.

**How to choose:**
1. Decide the job: bulk confidentiality (symmetric), key exchange or signatures (asymmetric), integrity (hash).
2. Pick a current, standardized algorithm for that job: AES for symmetric encryption; RSA or ECC for asymmetric work; a current hash such as SHA-256 for integrity.
3. Pick an adequate key length for the algorithm.
4. Use well-reviewed implementations and protocols (TLS, IPsec) instead of inventing a scheme.
5. Plan to replace algorithms when standards bodies withdraw them, as happened to DES, 3DES and MD5.

**Why it matters:** an obsolete algorithm can make encryption worthless even with a well-kept key. Proprietary "secret" algorithms have not had public scrutiny and tend to fail when examined; published standards have survived years of attack.

**Common confusions:** A cipher is not a hash: ciphers are reversible with the key, hashes are one-way. Legacy or broken items must be recognized as such: DES, 3DES (NIST allowed it only as deprecated through 2023 and disallows it afterwards), RC4, the MD5 hash (collisions; RFC 6151 says it must not be used for digital signatures), and the SSL protocol. The algorithm and the protocol are different layers: TLS is a protocol that uses AES, ECDHE and SHA-2 as building blocks. Exact key sizes and algorithm tables are in the Reference chapter.

**Scenario:** A clue says "a vendor claims its product is secure because its encryption algorithm is a company secret." The right response is to prefer a public, vetted algorithm such as AES. Trusting the secret algorithm is the wrong answer: secrecy of the method is security through obscurity, and the key is what must be secret.

**Example:** configuration review finding: `VPN profile uses 3DES and MD5: replace with AES-256 and SHA-256`.

### Key length (key size and strength)

Key length is the size of a cryptographic key in bits. Each extra bit doubles the number of possible keys, so longer keys resist brute-force guessing far better. Key lengths compare only within the same kind of algorithm: symmetric and asymmetric keys of equal strength have very different sizes.

**How to reason about it:**
1. Strength is expressed as "bits of security": the work an attacker needs.
2. Symmetric keys give roughly their full length in security (AES-128 gives about 128 bits).
3. RSA keys must be far longer for the same strength (see the table).
4. ECC keys reach the same strength at much shorter lengths than RSA.
5. Longer keys cost more processing, so choose the length the data's lifetime and sensitivity require.

**NIST's comparable strengths (SP 800-57):**

| Security strength | Symmetric | RSA | ECC |
|---|---|---|---|
| 112 bits | 3DES (legacy) | 2048 | 224 to 255 |
| 128 bits | AES-128 | 3072 | 256 to 383 |
| 192 bits | AES-192 | 7680 | 384 to 511 |
| 256 bits | AES-256 | 15360 | 512 or more |

**Why it matters:** a key that is too short can be brute forced as computers improve, exposing data that was meant to stay secret for years. A key far longer than needed slows every connection, especially on small devices.

**Common confusions:** RSA-2048 is not stronger than AES-256; it is about as strong as a 112-bit symmetric key. Doubling RSA length does not double strength. Key length does not help if the algorithm is broken or the key is stolen.

**Scenario:** A clue says "a mobile app needs public key strength equal to RSA-3072 but with the smallest possible keys." The answer is ECC with a 256-bit key. RSA-4096 is the closest wrong answer and fails the "smallest keys" requirement.

**Example:** certificate field `Public Key Algorithm: id-ecPublicKey, 256 bit` gives about the same strength as `rsaEncryption, 3072 bit`.

### Initialization vector (IV) and nonce

An initialization vector is an extra starting value fed into an encryption operation along with the key, so that encrypting the same plaintext twice with the same key produces different ciphertext. It adds variety, not secrecy: NIST states the IV need not be secret. A nonce is a value used only once; in several modes the IV is a nonce.

**How it works:**
1. For each message (or each encryption run), a new IV is generated.
2. The cipher mode mixes the IV into the encryption, so the output differs even for identical input.
3. The IV is sent or stored with the ciphertext in the clear; the receiver needs it to decrypt.
4. The key stays secret and can be reused for many messages; the IV must change.

**Rules that matter:**
- The IV is not a key and does not need to be hidden.
- It must not be reused with the same key. In counter-based modes it must be unique for every run under a given key.
- For CBC (cipher block chaining) and CFB (cipher feedback) modes, NIST additionally requires the IV to be unpredictable, for example random.

**Why it matters:** without an IV, identical records encrypt to identical ciphertext and patterns leak. Reusing an IV with the same key can let an attacker relate or recover messages.

**Common confusions:** A salt does for password hashing what an IV does for encryption: it makes equal inputs give different outputs, and neither is secret. An IV is not a second key. A nonce is defined by "used once"; some IVs must also be unpredictable, which is a stronger demand.

**Scenario:** A clue says "two identical files encrypted with the same AES key produce identical ciphertext, revealing that they match." The fix is a unique initialization vector per encryption. A longer key is the closest wrong answer and fails because the same key and input would still give the same output.

**Example:** stored record: `iv=5f1c...9a (clear) | ciphertext=e2a7...` and for the same plaintext next time: `iv=b803...4d | ciphertext=17c9...`.

### Trusted Platform Module (TPM)

A Trusted Platform Module is a tamper-resistant security chip built into one computer (on the motherboard, or as a firmware TPM inside the processor) that generates, stores and limits the use of cryptographic keys and records measurements of the boot process. It is a hardware root of trust for that single device. Specifications come from the Trusted Computing Group.

**How it works:**
1. The TPM creates keys inside itself; a key can be made unusable outside the TPM, so malware cannot copy it.
2. During startup, each piece of boot code (firmware, boot loader, operating system components) is measured and the measurements are recorded in the TPM (measured boot).
3. A key can be sealed so the TPM releases it only when the measurements match the expected values. Full-disk encryption uses this: BitLocker's key is released only if the boot chain is unmodified.
4. The measurements can be reported to a remote service to prove how the device started (attestation), which supports device health checks.
5. If too many wrong authorization guesses are made, the TPM's dictionary attack protection blocks further tries.

**Why it matters:** keys stored in files can be copied by anyone who gets disk access. Keys bound to a TPM stay with the hardware, so a drive moved to another computer will not unlock, and a certificate's private key cannot be exported. Microsoft notes BitLocker gives its strongest protection when paired with a TPM.

**Common confusions:** A TPM serves ONE device; a hardware security module (HSM) is a separate appliance serving many systems. The TPM records boot measurements; it is not the same feature as UEFI Secure Boot, which Windows checks separately. A TPM is not removable like a smart card, though it can replace one for holding a user's key. It also provides a random number generator.

**Scenario:** A clue says "a laptop's disk encryption key must be released automatically at startup, but only if the boot files have not been altered, and must be useless if the drive is moved to another computer." The answer is a TPM. An HSM is the closest wrong answer and fails because it is enterprise key hardware, not a chip inside each laptop.

**Example:** device inventory line: `LT-0931 TPM 2.0 present, ready; BitLocker protector: TPM plus PIN; device certificate key: non-exportable (TPM)`.

### Hardware security module (HSM)

A hardware security module is a dedicated, tamper-resistant physical device that safeguards and manages cryptographic keys and performs cryptographic operations (signing, decrypting, key generation) inside its protected boundary. It comes as a network appliance or a plug-in card, and it serves many applications and servers. US federal standard FIPS 140 sets the security requirements such modules are validated against.

**How it works:**
1. Keys are generated inside the HSM and marked non-exportable.
2. Applications send requests ("sign this", "decrypt this") over an authenticated interface; the HSM performs the operation and returns only the result.
3. The key never leaves the device in usable form, and the hardware is built to resist tampering and intrusion.
4. Only authenticated, authorized callers and administrators can use or manage keys.
5. HSMs are clustered for high availability and add hardware acceleration for heavy cryptographic loads.

**Why it matters:** some keys are catastrophic to lose: a certificate authority's root key, payment processing keys, code-signing keys. If such a key sits in a file on a server, one server compromise copies it forever. In an HSM, an attacker who takes over the application can misuse the key only while they hold access, and cannot walk away with it.

**Common confusions:** HSM vs TPM: an HSM is a separate, high-capacity device shared by many systems; a TPM is a small chip that protects one computer's keys. HSM vs key management system: the HSM is the secure hardware where keys live and operate; the key management system is the lifecycle and policy layer, which often stores its master keys in an HSM. A secure enclave is isolated hardware inside a consumer device's processor.

**Scenario:** A clue says "a certificate authority must keep its root private key in tamper-resistant hardware so the key can sign but can never be exported." The answer is an HSM. A TPM is the closest wrong answer and fails because it is tied to one computer and is not built for enterprise-scale key custody and availability.

**Example:** audit entry: `HSM cluster hsm-a/hsm-b: key "IssuingCA-2026" generated on device, exportable=false, sign operations today: 1,204`.

### Key management system (KMS)

A key management system is a centralized system for managing cryptographic keys and their metadata through the whole lifecycle: generation, distribution, storage, backup, archive, recovery, use, rotation, revocation and destruction. It applies policy and logging to keys the way an identity system does to accounts. It is software or a service, usually backed by hardware security modules.

**How it works:**
1. Keys are created centrally (or imported) with attributes: owner, purpose, algorithm, expiry.
2. Applications and services authenticate to the KMS and are authorized to use specific keys for specific operations.
3. The KMS distributes keys or, better, performs operations on the caller's behalf so keys are not scattered.
4. Keys are rotated on schedule, old versions kept only as long as needed to decrypt old data.
5. Compromised or retired keys are revoked and destroyed.
6. Every use and administrative action is logged for audit.

**Why it matters:** encryption is only as strong as key handling. Keys pasted into configuration files, never rotated, and known to departed staff defeat good algorithms. A KMS keeps keys separate from the data they protect, makes rotation routine and shows who used which key when.

**Common confusions:** KMS vs HSM: the KMS is management and policy; the HSM is tamper-resistant hardware. KMS vs key escrow: escrow is only the recovery copy; a KMS covers the whole lifecycle. KMS vs PKI: PKI manages certificates and identity binding; a KMS manages keys of all kinds, especially symmetric data-encryption keys. Cloud providers offer key management as a service for the keys that encrypt storage.

**Scenario:** A clue says "a company uses dozens of encryption keys across cloud storage and databases and must rotate them yearly, restrict which services can use each, and audit every use." The answer is a key management system. An HSM alone is the closest wrong answer and fails because secure storage does not by itself provide lifecycle rotation, per-service policy and central audit.

**Example:** KMS key record: `key-id=storage-prod-01 type=AES-256 rotation=365d last-rotated=2026-03-01 allowed: svc-backup (encrypt, decrypt) state=enabled`.

### Secure enclave (isolated security processor)

A secure enclave is a hardware-isolated security subsystem inside a device's main chip that handles keys and other sensitive data separately from the main processor and operating system. Apple's Secure Enclave is the best-known example: it is designed to keep sensitive user data protected even if the main operating system kernel is compromised.

**How it works (Apple's design as the model):**
1. The enclave has its own boot ROM, an unchangeable piece of code that forms its root of trust and verifies the enclave's software before running it.
2. It has its own cryptographic hardware: an AES engine for fast encryption, a true random number generator, and a public key accelerator for asymmetric operations. A unique device key is fused into the chip when it is made.
3. Its memory is encrypted and authenticated, so the main processor cannot read it.
4. The main operating system asks the enclave to perform operations (check a fingerprint, unwrap a key) and receives only the result.
5. Protected data is tied to that device's unique hardware identifier and cannot be used on other hardware.

**Why it matters:** phones hold payment credentials, biometric templates and the keys that encrypt all user data. If the main operating system could read them, one exploit would expose everything. The enclave keeps them out of reach.

**Common confusions:** Secure enclave vs TPM: both give one device a hardware root of trust; a TPM is a standardized module common in PCs, while a secure enclave is a processor-integrated subsystem common in phones and modern chips. Secure enclave vs HSM: an HSM is a shared enterprise device. Biometric data in the enclave is stored as a mathematical representation, not as a plain image.

**Scenario:** A clue says "a phone must store fingerprint data and payment keys so that even malware with kernel access cannot read them." The answer is a secure enclave. Full-disk encryption is the closest wrong answer and fails because, on a running unlocked phone, the operating system (and kernel malware) can read decrypted storage.

**Example:** unlock flow: sensor reads a fingerprint, the enclave compares it with the stored template and answers only `match` or `no match`; on a match the enclave releases the key that unlocks the user's data.

### TPM vs HSM vs key management system vs secure enclave (cryptographic tools compared)

All four protect keys, but at different scales and with different jobs.

| Tool | What it is | Scale | Decisive clue |
|---|---|---|---|
| TPM | Security chip or firmware module in a computer | One device | "laptop, BitLocker key, boot measurements" |
| HSM | Dedicated tamper-resistant appliance or card | Many servers and applications | "CA root key, payment keys, never exportable, clustered" |
| Key management system | Central lifecycle and policy service for keys | Whole organization | "rotate, expire, revoke, audit, distribute" |
| Secure enclave | Isolated security subsystem inside a device's main chip | One device, typically phone or modern CPU | "biometrics, isolated from the OS" |

**How to choose, step by step:**
1. Is the key for one PC's disk encryption or device identity? TPM.
2. Is it a high-value key used by servers that must never leave hardware? HSM.
3. Is the need about managing many keys over time (rotation, access, audit)? Key management system.
4. Is it phone or processor-level isolation for biometrics and device keys? Secure enclave.

**Why it matters:** the tools stack. A realistic design uses a KMS for policy, an HSM to hold the KMS's master keys, and TPMs or enclaves to protect keys on each endpoint.

**Common confusions:** TPM and secure enclave both serve a single device; HSM serves many. A KMS is not hardware. Any of TPM, HSM or enclave can act as a hardware root of trust.

**Scenario:** A clue says "the organization wants every database encryption key rotated automatically each quarter, with the master key kept in tamper-resistant hardware." Two tools: a key management system for the rotation, an HSM for the master key. Answering only "TPM" fails because a TPM serves one machine's own keys.

### Steganography (hiding data inside other data)

Steganography hides data inside other, ordinary-looking data so that the very existence of the message is concealed. NIST's glossary describes it as a way of communicating that conceals the fact that any communication is taking place, with the hidden content placed inside other files such as images or audio. It is an obfuscation technique; it is not encryption.

**How it works:**
1. Choose a cover file: an image, audio clip, video or even network traffic.
2. Embed the secret data in parts of the cover that people will not notice, for example the least significant bits of pixel values.
3. Send or store the cover file normally; it looks and behaves like any other.
4. The receiver, knowing the method, extracts the hidden data.

**Why it matters:** attackers use it to smuggle stolen data out or commands in, past filters that only look for obvious secrets. Forensic examiners therefore check ordinary-looking files, and NIST's forensic guidance treats embedded data as something to look for.

**Common confusions:** Encryption hides what a message SAYS but not that it exists; steganography hides that it EXISTS but, alone, does not protect its content if found. The two can be combined (encrypt, then hide). It is security through obscurity: once the method is suspected, the data can be extracted, so it is not strong protection by itself. It differs from tokenization and masking, which replace or hide values in a controlled, reversible-by-design business process.

**Scenario:** A clue says "an employee emailed vacation photos to a personal account; later analysis found design documents embedded in the image files." The answer is steganography. Encryption is the closest wrong answer and fails because the photos looked normal and nothing appeared to be encrypted; the data's existence was hidden.

**Example:** two copies of `beach.png` look identical, yet differ in size or hash: `beach.png SHA-256 3a9f...` vs the original `77c2...`, a hint that something was embedded.

### Tokenization (token vault, data obfuscation)

Tokenization replaces a sensitive value, classically a payment card number (PAN, primary account number), with a substitute value called a token. The token is useless to an attacker; the real value is kept in a separate, heavily protected store called the token vault (or card data vault). De-tokenization is the controlled reverse lookup. In the vault model taught for SY0-701 the token has no mathematical relationship to the original.

**How it works:**
1. An application submits the sensitive value to the tokenization system.
2. The system generates a token, for example a random number in the same format, and records the token and the original together in the vault.
3. The application stores and uses the token in place of the real value (order history, analytics, receipts).
4. When the real value is truly needed, an authorized system presents the token and the vault returns the original.
5. Systems that hold only tokens hold nothing worth stealing.

**Why it matters:** every system that stores card numbers must meet the full payment card security standard (PCI DSS). PCI guidance says tokenization can reduce the number of system components those requirements apply to, though it does not remove the need to maintain and validate compliance. The vault becomes the prime target and needs the strongest protection.

**Common confusions:** Tokenization is not encryption: a vault token cannot be decrypted with a key, only looked up. PCI guidance does also describe tokens produced by reversible cryptographic functions, and notes that such a token is in effect an encrypted card number; the form to learn first is the vault kind. It is not masking: masking hides part of the real value on display, tokenization substitutes the whole value. It is not hashing: there is an intended way back, through the vault. Tokens here are unrelated to authentication tokens or honeytokens. Phone wallets use the idea: Apple Pay sends a device-specific account number plus a one-time security code, never the real card number.

**Scenario:** A clue says "an online store wants to keep customers' cards on file for repeat purchases without storing card numbers in its own database." The answer is tokenization. Encryption is the closest wrong answer and fails because encrypted card numbers and their keys would still sit in the store's environment and stay in audit scope.

**Example:** orders table: `customer=4471 | card_token=tok_8f3b2c91d0 | last4=4321`; the payment provider's vault maps `tok_8f3b2c91d0` to the real number.

### Data masking (obfuscation of displayed data)

Data masking hides all or part of a value by replacing characters with placeholders, so people and systems see only what they need. The familiar form shows a card number as asterisks plus the last four digits. It limits exposure (confidentiality) while keeping data usable for a task such as confirming an account.

**How it works:**
- Dynamic masking: the stored data is unchanged; a rule masks it in query results for users without permission to see the full value. Privileged users see the real data.
- Static masking: a copy of the data is permanently altered (for a test or training database), and the original cannot be recovered from that copy.
Typical steps for dynamic masking: define a masking rule on a column (full, partial such as "show last 4", random number, email format); grant an unmask permission only to roles that need it; everyone else receives masked results.

**Why it matters:** most staff need to recognize a record, not read the secret in it. Masking lets a support agent confirm "card ending 4321" without being able to copy the number, and lets developers test with realistic-looking data that is not real.

**Common confusions:** Dynamic masking is not encryption: the real value is still stored in the clear underneath, and Microsoft warns that users who can run their own queries may infer masked values by guessing (for example filtering on a salary range), so it complements access control and encryption and does not replace them. Masking vs tokenization: masking hides part of the real value; tokenization replaces the whole value and keeps the original elsewhere. Masking vs record encryption: masking changes what is shown, encryption changes what is stored.

**Scenario:** A clue says "call center agents must see only the last four digits of a customer's account number on screen, while the billing system uses the full number." The answer is data masking. Tokenization is the closest wrong answer and fails because the clue is about limiting what is displayed, not replacing the stored value with a substitute.

**Example:** `ALTER TABLE Customers ALTER COLUMN Phone ADD MASKED WITH (FUNCTION = 'partial(0,"XXX-XXX-",4)')` makes an unprivileged query return `XXX-XXX-1234`.

### Encryption vs hashing vs encoding vs obfuscation (tokenization, masking, steganography)

These techniques all transform data, but for different goals, and only some can be reversed.

| Technique | Goal | Reversible? | Needs a key? | Decisive clue |
|---|---|---|---|---|
| Encryption | Confidentiality | Yes, with the key | Yes | "only key holders can read" |
| Hashing | Integrity, password storage | No (one-way) | No | "fingerprint, digest, verify unchanged" |
| Encoding (for example Base64) | Compatibility between systems | Yes, by anyone | No | "represent binary as text" |
| Tokenization | Remove sensitive data from systems | Only via the vault | No (lookup) | "substitute value, vault" |
| Data masking | Limit what is displayed | Dynamic: real value still stored; static: no | No | "last four digits, asterisks" |
| Steganography | Hide that data exists | Yes, knowing the method | No | "hidden inside an image" |

**How to choose, step by step:**
1. Must authorized parties get the original back and nobody else? Encryption.
2. Must you only detect change or check a password without storing it? Hashing.
3. Must systems that do not need the real value stop holding it? Tokenization.
4. Must people see only part of a value? Masking.
5. Is someone hiding the existence of data? Steganography.
6. Is the data merely being converted to another format? Encoding, which is not a security control.

**Why it matters:** mistaking one for another creates real exposure. The Base64 standard itself warns that encoding gives no real confidentiality and that sharing encoded protocol traces has leaked passwords.

**Common confusions:** Encoded is not encrypted: Base64 text decodes with no secret. Hashing is not encryption because nothing can be decrypted. Obfuscation in general makes data harder to understand but is weaker than encryption. In software, obfuscation also means making code hard to read, a different use covered with application security.

**Scenario:** A clue says "a developer stored API passwords in a configuration file as Base64 and called them encrypted." The finding is that encoding is not encryption; anyone can decode it. The fix is real encryption with a managed key, or a secrets vault.

**Example:** the text `Pa55word` in Base64 is `UGE1NXdvcmQ=`, reversible by any decoder; its SHA-256 hash is a fixed-length digest that cannot be turned back; its AES ciphertext is readable again only with the key.

### Hashing (cryptographic hash functions)

Hashing runs data of any size through a one-way function that produces a fixed-length output called a hash or digest. The same input always gives the same digest, and any change to the input gives a different one. It provides integrity checking and is the basis of password storage, digital signatures and blockchains. It uses no key and cannot be reversed.

**Properties (as NIST defines an approved hash function):**
- Fixed-length output for any input length.
- One-way (preimage resistance): given a digest, it is infeasible to find an input that produces it.
- Second preimage resistance: given one input, it is infeasible to find a different input with the same digest.
- Collision resistance: it is infeasible to find any two different inputs with the same digest.

**How it is used for integrity:**
1. The publisher computes the digest of a file and publishes it through a trusted channel.
2. The recipient computes the digest of the file received.
3. If the two match, the file is unchanged; a single altered bit produces a different digest.

**Why it matters:** hashing lets anyone detect accidental or malicious change in downloads, logs, forensic evidence and backups without comparing the full data. It also lets systems verify passwords without storing them.

**Common confusions:** Hashing is not encryption: there is no key and no way to get the input back. A plain hash proves integrity only, not who made it: an attacker who can change the file can also recompute the hash, so the digest must come from a trusted source or be protected with a key (HMAC) or a signature. A collision means two inputs share a digest. MD5 is broken for collision resistance and, per RFC 6151, must not be used for digital signatures; SHA-256 is a current choice for integrity. A fast hash alone is too quick for password storage: use a slow password hashing function with a salt (see salting and key stretching). Digest sizes are in the Reference chapter.

**Scenario:** A clue says "an administrator wants to confirm that a firmware image downloaded from the vendor has not been modified in transit." The answer is to compare its hash with the vendor's published hash. Encryption is the closest wrong answer and fails because it hides content but does not by itself show whether the file changed.

**Example:** vendor page: `firmware-4.2.bin SHA-256: 9b74c9...e3f1`; local check `sha256sum firmware-4.2.bin` prints the same value, so the file is intact.

### Salting (password hashing with a salt)

Salting adds a unique random value, the salt, to each password before it is hashed, so identical passwords produce different stored hashes and precomputed attacks stop working. The salt is stored next to the hash and is not secret. It protects stored passwords (confidentiality of credentials) after a database theft.

**How it works:**
1. When a user sets a password, the system generates a new random salt for that user.
2. It hashes the salt together with the password, using a password hashing function.
3. It stores the salt and the resulting hash in the user's record.
4. At login, it takes the stored salt, repeats the calculation with the typed password and compares results.

**What the salt achieves:**
- Two users with the same password get different hashes, so one cracked hash does not reveal the others.
- Precomputed lookup tables (rainbow tables) become useless, since a table would be needed for every possible salt.
- An attacker must attack each hash separately.

**Why it matters:** password databases get stolen. Without salts, an attacker cracks every copy of a common password at once and looks up many hashes instantly in a precomputed table. Salts force per-account work. Most password hashing libraries generate salts automatically.

**Common confusions:** A salt does not slow down guessing against a single hash; key stretching does that, and the two are used together. A salt is not secret and not a key. A pepper is different: one secret value shared across all passwords and kept outside the database (for example in a hardware security module), so a database-only theft is not enough. A salt is to hashing roughly what an initialization vector is to encryption.

**Scenario:** A clue says "after a breach, analysts notice that 300 users with the same password all have different stored hashes." The answer is salting. Key stretching is the closest wrong answer and fails because stretching makes each hash slow to compute but, without a salt, equal passwords would still give equal hashes.

**Example:** stored records: `ana | salt=7f3a91 | hash=5d2c...` and `raj | salt=c04e12 | hash=a91b...`, both for the password `Autumn2026!`.

### Key stretching (PBKDF2, bcrypt, Argon2)

Key stretching makes a password or other weak secret harder to brute force by passing it through a deliberately slow function many times, so each guess costs the attacker far more work. It is also how a password is turned into a cryptographic key (a key derivation function). The standard functions are PBKDF2 (Password-Based Key Derivation Function 2), bcrypt, scrypt and Argon2id.

**How it works:**
1. Take the password and a salt.
2. Apply the underlying function repeatedly: PBKDF2 runs a keyed hash for a set iteration count; bcrypt uses a tunable cost factor; scrypt and Argon2id also demand a lot of memory per guess.
3. Store the result with the salt and the parameters.
4. A legitimate login pays the cost once; an attacker pays it for every one of billions of guesses.
5. Raise the work factor over time as hardware gets faster, re-hashing at the user's next login.
The PBKDF2 standard (RFC 8018) states that an iteration count of c adds log2(c) bits of strength against guessing attacks, which is another way of saying each guess costs c times more work.

**Current guidance (OWASP Password Storage Cheat Sheet):** prefer Argon2id; use scrypt if it is unavailable; bcrypt for legacy systems; PBKDF2 where FIPS 140 compliance is required, with at least 600,000 iterations of HMAC-SHA-256. Most bcrypt implementations read only the first 72 bytes of a password.

**Why it matters:** fast hashes can be tried at enormous speed on modern hardware. Stretching turns a stolen hash file from a quick win into a long, costly job, buying time to reset passwords. The work factor is a balance: too high slows logins and can be abused to overload the server.

**Common confusions:** Salting and stretching do different jobs and belong together.

| | Salting | Key stretching |
|---|---|---|
| What it adds | A unique random value per password | Many rounds of computation (and memory) |
| Attack defeated | Precomputed tables, cracking equal passwords together | Fast brute force and dictionary guessing |
| Secret? | No | No (parameters are stored) |

Stretching does not fix a truly weak password; it only slows the guessing. It is not encryption.

**Scenario:** A clue says "the company wants each password guess against a stolen hash database to take an attacker much longer, even though the hashes are already salted." The answer is key stretching. Salting is the closest wrong answer and fails because salts stop precomputation but leave each single guess just as fast.

**Example:** stored value `$argon2id$v=19$m=19456,t=2,p=1$SALT$HASH` records the function, memory, iterations and parallelism (OWASP's minimum Argon2id settings) beside the salt and hash.

### HMAC (hash-based message authentication code)

An HMAC is a short tag computed from a message and a secret key using a hash function. A receiver who holds the same key recomputes the tag; a match proves the message was not altered and came from someone who knows the key. It gives integrity and authenticity, with a symmetric (shared) key. It is defined in RFC 2104.

**How it works:**
1. Sender and receiver share a secret key in advance.
2. The sender computes the tag: the key is mixed with the message and hashed, then mixed again and hashed a second time (inner and outer hash).
3. The sender transmits the message and the tag.
4. The receiver computes the tag over the received message with the same key and compares.
5. A mismatch means the message or tag was changed, or the sender did not have the key.

**Why it matters:** a plain hash can be recomputed by anyone, so an attacker who alters a message simply attaches a new hash. Without the key, an attacker cannot produce a valid HMAC. It is fast, so it suits checking every message between two parties that already share a key, such as an API client and server.

**Common confusions:** HMAC gives no confidentiality; the message is still readable. HMAC gives no non-repudiation: both parties hold the same key, so either could have made the tag, and a third party cannot tell which. A digital signature (private key) is the tool for that. HMAC works with any suitable hash, for example HMAC-SHA-256. RFC 6151 notes HMAC-MD5 is not urgently broken as a MAC but should not be chosen for new designs. The SY0-701 acronym list expands HMAC as hashed message authentication code; same thing.

**Scenario:** A clue says "a server and a client app share a secret; each API request must prove it was not modified and came from the app." The answer is HMAC. A plain SHA-256 hash is the closest wrong answer and fails because an attacker could change the request and recompute the hash.

**Example:** request header `X-Signature: HMAC-SHA256(key, "POST/orders{...}") = 4f8a...c2`; the server recomputes it and rejects the request if the values differ.

### Digital signatures

A digital signature is a value produced from a message with the signer's private key that anyone can check with the signer's public key. It proves the message has not changed (integrity), that it came from the holder of that private key (authentication of origin), and that the signer cannot credibly deny it (non-repudiation). It does not provide confidentiality.

**How it works (the usual teaching model):**
1. The signer hashes the message.
2. The signer applies the private key to the hash; the result is the signature. This is commonly described as encrypting the hash with the private key.
3. The message and signature are sent together, usually with the signer's certificate.
4. The verifier hashes the received message.
5. The verifier applies the signer's public key to the signature and compares the outcome with their own hash.
6. A match means the message is unchanged and was signed with that private key. A mismatch means alteration or the wrong key.
The common wrong order is signing with the recipient's key or verifying with a private key.

**Why it matters:** signed software updates, signed email, signed documents and certificates themselves all depend on this. It is how a device decides an update really comes from the vendor before installing it.

**Common confusions:** Signing does not hide the message; to get both secrecy and proof, sign and also encrypt. NIST describes signing as its own private-key operation, a cryptographic transformation of data, and "encrypt the hash" is a simplified picture that fits RSA best. Trust in a signature depends on trusting the public key, which is what certificates provide, and on the private key staying private. Hash = integrity only; HMAC = integrity plus authenticity between key holders; signature = integrity, authenticity and non-repudiation toward anyone. NIST also notes signatures give no protection against replay.

**Scenario:** A clue says "a vendor wants customers to verify that a software update really came from the vendor and was not altered, without sharing any secret with customers." The answer is a digital signature. HMAC is the closest wrong answer and fails because it would require every customer to hold the vendor's secret key.

**Example:** `Signature: sha256WithRSAEncryption`, `Signer: CN=Example Software Publishing`, `Status: signature valid, certificate chains to a trusted root`.

### Hash vs HMAC vs digital signature (integrity mechanisms compared)

All three detect change in data. They differ in whether a key is involved and what they prove about the sender.

| Mechanism | Key | Integrity | Proves sender | Non-repudiation | Speed |
|---|---|---|---|---|---|
| Hash | None | Yes (if the digest is trusted) | No | No | Fastest |
| HMAC | Shared secret key | Yes | Yes, to the other key holder | No | Fast |
| Digital signature | Signer's private key, verified with public key | Yes | Yes, to anyone | Yes | Slowest |

**How to choose, step by step:**
1. Only need to detect accidental or casual change, with the digest from a trusted place? Hash.
2. Two parties that already share a secret need to authenticate each message quickly? HMAC.
3. Many verifiers, no shared secret, or proof that will stand up to a third party? Digital signature.

**Why it matters:** picking a hash where a signature is needed lets an attacker swap both file and hash; picking HMAC where non-repudiation is needed leaves no proof of who sent what.

**Common confusions:** None of the three hides the data. "Message authentication code" (MAC) here is unrelated to MAC addresses or mandatory access control.

**Scenario:** A clue says "a download site was hacked; the attacker replaced the installer and the SHA-256 value shown beside it." A hash on the same site failed because the attacker could change both. A digital signature from the vendor would have exposed the swap, since the attacker lacks the vendor's private key.

### Blockchain (hash-chained distributed ledger)

A blockchain is a shared digital ledger in which signed transactions are collected into blocks, and every block is tied to its predecessor by storing a hash of that predecessor's header. Copies are kept by many participants, usually with no central authority. NIST describes blockchains as tamper evident and tamper resistant. The security goal is integrity.

**How it works:**
1. Users create transactions and sign them with their private keys.
2. Participating nodes collect valid transactions into a candidate block.
3. The network agrees on the next block through a consensus model (for example proof of work or proof of stake), which makes publishing blocks costly for a cheater.
4. The new block stores the hash of its predecessor's header, forming the chain.
5. The block is copied to every node's ledger; conflicts are resolved by agreed rules.
6. Changing an old transaction would change that block's hash and break every later link, so the change is evident, and it grows harder as more blocks are added on top.

**Why it matters:** it lets parties who do not trust each other share one record without a bank or other central keeper. Uses include cryptocurrencies, supply chain tracking and other shared audit trails.

**Common confusions:** Blockchain provides integrity and transparency, not confidentiality: on a public chain everyone can read the data. NIST cautions that "immutable" is not strictly true: the newest blocks can be replaced by a longer competing chain, and an attacker controlling most of the block-producing power (a 51% attack) could rewrite recent history. Permissionless chains let anyone read and publish; permissioned chains restrict who may publish and sometimes who may read. The hashes link blocks; digital signatures authorize transactions. Two different mechanisms.

**Scenario:** A clue says "several competing shipping companies need a shared record of container handoffs that none of them can secretly alter and that no single company controls." The answer is a blockchain. A central database with encryption is the closest wrong answer and fails because one party would control it and could change records.

**Example:** `Block 1041: prev_hash=00a9...7c, transactions=[...], hash=03f1...2e` then `Block 1042: prev_hash=03f1...2e`. Editing block 1041 changes its hash, so block 1042's stored `prev_hash` no longer matches.

### Open public ledger

An open public ledger is the shared record of all transactions on a public (permissionless) blockchain, visible to anyone and copied in full to the participating nodes. "Open" means anyone can read it and take part; "public" means no single owner holds it. Its purpose is transparency and independent verification, which serve integrity.

**How it works:**
1. Every participant node holds a copy of the whole ledger.
2. A new transaction is broadcast to the network and checked by nodes against the ledger (for example, that the sender actually holds the funds).
3. Once included in an accepted block, the transaction appears in every copy.
4. Anyone can inspect the ledger and verify any transaction independently, without asking an authority.

**Why it matters:** because everyone can check the record, nobody has to trust a single bookkeeper, and a false entry would be rejected by the other copies. The Bitcoin blockchain, for example, records transfers publicly so that all participants can verify them.

**Common confusions:** The ledger is the DATA (the record); blockchain is the hash-chaining TECHNOLOGY that protects it. An open public ledger gives no confidentiality: amounts and addresses are visible to all, even if real names are not attached. Not every blockchain ledger is open: permissioned blockchains may restrict who can read or write.

**Scenario:** A clue says "any person can download the complete transaction history of the currency and confirm a given payment took place." The answer is the open public ledger. Blockchain is the closest wrong answer: it is the mechanism underneath, but the clue stresses the publicly viewable shared record.

**Example:** a public block explorer lookup: `tx 7b2e...91: from addr1... to addr9..., amount 0.5, included in block 845,112, confirmations 6`.

### Digital certificates (X.509)

A digital certificate is a signed data structure that binds a public key to an identity: a person, server, device or organization. A certificate authority (CA) signs it, so anyone who trusts the CA can trust that the public key belongs to the named subject. The standard format is X.509, profiled for the internet in RFC 5280.

**Main fields:**
- Version and serial number (unique per issuing CA; the serial is what revocation lists refer to).
- Signature algorithm.
- Issuer: the CA that signed it.
- Validity: not before and not after dates.
- Subject: who the certificate identifies.
- Subject public key information: the public key and its algorithm.
- Extensions (version 3), such as Subject Alternative Name, key usage and where to check revocation.
- The CA's signature over all of the above.

**How validation works:**
1. Build the chain from the presented certificate up through intermediate CAs to a trusted root.
2. Verify each signature in the chain.
3. Check each certificate is within its validity dates.
4. Check the name matches what you connected to.
5. Check revocation status (CRL, the certificate revocation list, or OCSP, the Online Certificate Status Protocol).
6. Check the certificate is allowed for this use.
Any failure produces a warning or a refused connection.

**Why it matters:** certificates are how browsers know a site is genuine, how devices prove they belong on a network, and how signatures are tied to real identities. An expired certificate is a classic cause of sudden outages.

**Common confusions:** A certificate holds the PUBLIC key only; the private key stays with the owner and is never in the certificate. A certificate is not encryption by itself; it distributes a trusted public key. Expired is not revoked: expiry is scheduled, revocation is an early cancellation. Public TLS certificate lifetimes are being shortened by the CA/Browser Forum (from a 398-day maximum to 200 days for certificates issued from 15 March 2026, 100 days from 15 March 2027 and 47 days from 15 March 2029; the Reference chapter has the table), which makes automated renewal essential.

**Scenario:** A clue says "users see a browser warning that the site's certificate was issued for a different host name." The failed check is the name match (subject or Subject Alternative Name). Revocation is the closest wrong answer and fails because the certificate is valid, just for another name.

**Example:** `Subject: CN=www.example.org`, `Issuer: CN=Example Issuing CA 2`, `Serial: 4A:19:C0:7E`, `Not Before: 2026-09-01`, `Not After: 2027-03-19`, `SAN: DNS:www.example.org, DNS:example.org`.

### Certificate authority (CA) and the chain of trust

A certificate authority is the trusted entity that verifies identities and issues, signs and revokes digital certificates. Trust is arranged as a hierarchy: a root CA at the top, intermediate (subordinate, issuing) CAs below it, and end-entity certificates at the bottom. Following the signatures from an end certificate up to a trusted root is the chain of trust.

**How it works:**
1. The root CA has a self-signed certificate. Operating systems and browsers ship with a store of trusted roots; organizations add their own internal root.
2. The root signs intermediate CA certificates and is then kept offline and heavily protected, typically with its key in a hardware security module.
3. Intermediate CAs issue the day-to-day certificates after validating each requester.
4. A server presents its certificate plus the intermediates; the client verifies each signature up to a root it already trusts.
5. The CA publishes revocation information for certificates it cancels.

**Why it matters:** the whole system's trust rests on CA keys. Keeping the root offline means that if an intermediate is compromised, only that intermediate is revoked and replaced; the root, and everything else under it, survives. A compromised root would invalidate every certificate beneath it.

**Common confusions:** The CA signs; a registration authority (RA) only verifies identities for it. A public (third-party) CA is trusted by default everywhere; a private (internal) CA is trusted only by devices configured to trust it. Missing intermediate certificates on a server cause "untrusted" errors even when the certificate is fine. The root certificate is self-signed by design; that is different from an ordinary self-signed server certificate that no one has chosen to trust.

**Scenario:** A clue says "an organization wants to limit the damage if the CA that issues its user certificates is ever compromised." The answer is an offline root CA with online intermediate (issuing) CAs. A single online root CA is the wrong design because its compromise would break every certificate.

**Example:** `Example Root CA (offline, self-signed)` signs `Example Issuing CA 2 (online)`, which signs `www.example.org` and `vpn.example.org`.

### Registration authority (RA)

A registration authority is an optional part of a PKI (public key infrastructure) that a certificate authority (CA) can delegate management tasks to, most importantly checking the identity of people or devices that request certificates. The RA approves or rejects requests and passes approved ones to the CA, which issues and signs. RFC 5280 describes it as an optional component that takes over some management functions from the CA.

**How it works:**
1. A person or device submits a certificate request.
2. The RA verifies identity according to policy: checking HR records, an ID document, device ownership, or control of a domain.
3. The RA approves the request and forwards it to the CA (or rejects it).
4. The CA signs and issues the certificate.
5. The RA may also handle revocation requests and renewals on the CA's behalf.

**Why it matters:** identity checking is the slow, human part of issuing certificates. Putting it in an RA lets it happen close to the users (a local office, a help desk) while keeping the CA's signing key isolated and touched by as few processes as possible.

**Common confusions:** An RA never signs certificates; the signer is always the CA. An RA can be a person, a team or software. It is not the OCSP responder, which answers certificate status queries.

**Scenario:** A clue says "the help desk confirms each employee's identity against HR records before a smart card certificate is issued by the central system." The help desk is acting as the registration authority. Certificate authority is the closest wrong answer and fails because the help desk verifies but does not sign.

**Example:** workflow log: `request #882 from kpatel: RA check (badge + HR record) = approved by helpdesk-03; forwarded to Issuing CA 2; certificate serial 5C:22 issued`.

### Certificate revocation list (CRL)

A certificate revocation list is a signed, time-stamped list, published by a certificate authority (CA) or a delegated CRL issuer, of certificates that were revoked before their expiry date and must no longer be trusted. Each entry identifies a certificate by serial number, with the revocation date and possibly a reason. Clients download the list and check whether the certificate in front of them is on it.

**How it works:**
1. Something makes a certificate untrustworthy early: its private key was stolen, the owner left, the details changed, or it was replaced.
2. The owner or an administrator asks the CA to revoke it.
3. The CA adds the serial number to its next CRL, signs the list and publishes it at the address named in its certificates (the CRL distribution point).
4. Clients fetch the CRL periodically and cache it until its next-update time.
5. During validation, a client looks for the certificate's serial number on the list; if present, the certificate is rejected.

**Why it matters:** expiry alone would leave a stolen key usable for months. Revocation is the emergency brake. If clients do not actually check revocation, a stolen certificate keeps working.

**Common confusions:** A CRL is periodic, not real time: a certificate revoked just after a client downloaded the list is still accepted by that client until the next refresh. CRLs can grow large, because they list every revoked, unexpired certificate; CAs may split them into partitions. Revoked is not expired. Real-world note: since 15 March 2024 the CA/Browser Forum rules require public TLS CAs to publish CRLs and make OCSP (Online Certificate Status Protocol) optional; for study purposes the CRL remains the periodic, list-based method.

**Scenario:** A clue says "a web server's private key was exposed on a public code repository; the certificate does not expire for eight months." The answer is to revoke the certificate so it appears on the CRL (and in OCSP answers), then issue a new one with a new key pair. Waiting for expiry is wrong because the key could be abused the whole time; renewing with the same key is wrong because the stolen key would stay valid.

**Example:** `Certificate Revocation List: Issuer: CN=Example Issuing CA 2, This Update: Nov 10 2026, Next Update: Nov 14 2026, Revoked: Serial 4A:19:C0:7E, Revocation Date: Nov 09 2026, Reason: keyCompromise`.

### Online Certificate Status Protocol (OCSP) and OCSP stapling

The Online Certificate Status Protocol lets a client ask a CA's OCSP responder for the current status of one specific certificate and get a signed answer, without downloading a whole revocation list. It is defined in RFC 6960. OCSP stapling lets the web server fetch that signed answer itself and deliver it inside the TLS handshake.

**How OCSP works:**
1. The client reads the responder's address from the certificate.
2. It sends a request naming the certificate's serial number.
3. The responder returns a signed status: good, revoked or unknown. "Good" means not revoked within its validity period; "unknown" usually means the responder does not serve that issuer.
4. The response is signed by the CA or by a responder the CA authorized, and carries times showing how fresh it is; an optional nonce guards against replayed answers.
5. The client accepts or rejects the certificate accordingly.

**How stapling works:**
1. The client asks for certificate status in its TLS hello message.
2. The server, which has already obtained a recent signed OCSP response, sends it right after its certificate.
3. The client verifies the CA-signed response without contacting the CA.

**Why it matters:** OCSP gives fresher answers than a periodically downloaded CRL and costs less bandwidth. Stapling removes the extra lookup (faster) and stops the CA from learning which sites a user visits (privacy), since a plain OCSP query reveals the visitor's address and the site checked.

**Common confusions:** OCSP checks ONE certificate on demand; a CRL is a whole list fetched periodically. A stapled response cannot be forged by the server, because it is signed by the CA side. RFC 6960 notes a client that cannot reach the OCSP service may fall back to CRL processing. Real-world note: public CAs may now treat OCSP as optional, and Let's Encrypt shut down its OCSP responders on 6 August 2025, citing privacy, and relies on CRLs; in the SY0-701 objectives OCSP remains the real-time method.

**Scenario:** A clue says "a browser must learn immediately whether one certificate has been revoked, without downloading a large list, and the site owner wants to avoid an extra connection from each visitor to the CA." The answer is OCSP with stapling. A CRL is the closest wrong answer and fails the "immediately" and "without a large list" requirements.

**Example:** `OCSP Response: Cert Status: revoked, Revocation Time: Nov 09 2026 14:02 GMT, This Update: Nov 10 2026, Next Update: Nov 11 2026`.

### CRL vs OCSP vs OCSP stapling (revocation checking compared)

All three tell a client whether a certificate was cancelled early. They differ in who fetches what, and how fresh the answer is.

| Method | What the client gets | Freshness | Who contacts the CA | Main drawback |
|---|---|---|---|---|
| CRL | Whole signed list of revoked serial numbers | Periodic; can be stale until next update | Client downloads the list | Size, delay |
| OCSP | Signed status of one certificate: good, revoked, unknown | Near real time | Client queries the responder | Extra lookup; CA sees what the client visits |
| OCSP stapling | The same signed status, delivered by the server in the TLS handshake | Recent, refreshed by the server | Server | Server must support and refresh it |

**How to choose from a clue:**
1. "List", "downloaded", "periodically published": CRL.
2. "Real time", "single certificate", "responder": OCSP.
3. "Server includes the status in the handshake", "privacy", "no extra client connection": OCSP stapling.

**Why it matters:** revocation only protects anyone if clients check it quickly and reliably. Each method trades freshness, performance and privacy differently.

**Common confusions:** Stapling is still OCSP; only the delivery changes. All three answers are signed by the CA side, so neither the server nor a network attacker can fake "good". None of them replaces expiry; short certificate lifetimes reduce reliance on revocation altogether.

**Scenario:** A clue says "clients on a slow satellite link cannot afford to download large revocation files, yet must verify the server certificate's status." The answer is OCSP (ideally stapled). A CRL fails because of its size.

### Self-signed vs third-party (public CA) certificates

A self-signed certificate is signed with its own private key instead of by a certificate authority, so its signature can be checked with the public key inside the same certificate. A third-party certificate is issued and signed by an external, publicly trusted CA whose root is already in browsers' and operating systems' trust stores. The difference is who vouches for the identity.

| | Self-signed | Internal (private) CA | Third-party (public CA) |
|---|---|---|---|
| Signed by | Itself | The organization's own CA | External public CA |
| Trusted by default | No one | Devices the organization configures | Almost every browser and device |
| Cost and speed | Free, instant | No per-certificate fee after setup | Validation by the CA needed, often a fee |
| Revocation | None practical | Yes, by the internal CA | Yes, by the public CA |
| Fits | Labs, tests, a root CA's own certificate | Internal servers, devices, users | Public websites and services |

**How trust works for each:**
1. Self-signed: the signature proves the certificate was not altered, but nothing proves the name in it is true. NIST notes that trust in a self-signed certificate depends entirely on the secure procedure used to distribute it. Each client must be told manually to trust it.
2. Internal CA: the organization installs its root on its own devices once; every certificate it issues is then trusted internally.
3. Third-party: the public CA validates the requester and outsiders trust the result automatically.

**Why it matters:** users trained to click through warnings for a self-signed internal site will click through a real attacker's fake certificate too. Using the right kind of certificate keeps warnings meaningful.

**Common confusions:** Self-signed certificates encrypt traffic just as strongly; what they lack is verified identity. A root CA certificate is self-signed by design and trusted because it was deliberately placed in the trust store. A public CA does not make a site "safe"; it confirms who controls the name.

**Scenario:** A clue says "a company launches a public online store and customers must not see certificate warnings." The answer is a third-party certificate from a public CA. A self-signed certificate is the closest wrong answer and fails because no customer's browser trusts it.

**Example:** self-signed: `Subject: CN=test01.lab.local`, `Issuer: CN=test01.lab.local` (subject and issuer identical); the browser reports an untrusted issuer.

### Root of trust

A root of trust is a starting point that is trusted implicitly, without being verified by anything else, and on which the trust of everything else is built. NIST describes roots of trust as very dependable components (hardware, firmware or software) that carry out a small set of critical security functions; because nothing checks them, they must be secure by design. In PKI the root of trust is the root CA certificate; in devices it is hardware such as a TPM (Trusted Platform Module), an HSM (hardware security module) or a secure enclave's boot ROM.

**How it works:**
1. Something is trusted from the start: a root CA certificate placed in the trust store, or immutable code and keys built into a chip.
2. That root vouches for the next element: the root CA signs an intermediate CA; the boot ROM verifies the boot loader.
3. Each verified element vouches for the next, forming a chain of trust up to the thing in use (a web certificate, a running operating system).
4. A verifier walks the chain back until it reaches the root it already trusts.

**Why it matters:** every chain is only as trustworthy as its root. A stolen root CA key lets an attacker mint certificates everyone accepts; tampered root firmware lets malware load before any defense. That is why root CA keys are kept offline in HSMs and hardware roots are made unchangeable.

**Common confusions:** Root of trust is the anchor; chain of trust is the series of links built from it. The root is not verified by something higher, which is exactly why it must be protected and chosen carefully. A root CA is one kind of root of trust, not the only kind. Removing a root from the trust store distrusts everything beneath it.

**Scenario:** A clue says "a browser accepts a site's certificate because it chains up to a certificate already installed in the operating system's trusted store." That installed root CA certificate is the root of trust. Intermediate CA is the closest wrong answer and fails because intermediates are themselves verified by the root.

**Example:** hardware chain: `Boot ROM (root of trust) verifies boot loader, which verifies the OS kernel`; PKI chain: `Root CA (root of trust) signs issuing CA, which signs the server certificate`.

### Certificate signing request (CSR) generation

A certificate signing request is the message an applicant sends to a certificate authority (CA) to ask for a certificate. It contains the applicant's identity details and public key and is signed with the applicant's matching private key. The standard format is PKCS #10 (RFC 2986). The private key is generated by, and stays with, the requester.

**How it works:**
1. The requester generates a key pair on the system that will use the certificate.
2. The requester builds the request: subject name, public key, and optional attributes such as requested extensions (for example Subject Alternative Names).
3. The requester signs the request with the private key. This shows the requester actually holds the private key matching the public key, so nobody can request a certificate for someone else's key.
4. The CSR is sent to the CA (or RA, the registration authority).
5. The CA authenticates the requester and verifies the signature, then builds the certificate, adding its own issuer name, serial number and validity period, and signs it.
6. The requester installs the returned certificate beside the private key.
The common wrong order is letting the CA or a website generate the key pair and send back the private key, which exposes it.

**Why it matters:** the design keeps the private key from ever travelling. Only public information crosses the network, so intercepting a CSR gains an attacker nothing.

**Common confusions:** A CSR contains the PUBLIC key, never the private key. A CSR is not a certificate; it has no issuer signature and no validity dates. The CA can change or ignore requested fields. Renewal with a new key pair needs a new CSR. If the private key is lost after issuance, the certificate is useless and must be reissued.

**Scenario:** A clue says "an administrator needs a certificate for a new web server and must ensure the private key never leaves that server." The answer is to generate the key pair and CSR on the server and send only the CSR to the CA. Having the CA generate the keys and email a bundle is the wrong approach because the private key would be exposed in transit.

**Example:** the server creates `www.key` (kept, never copied) and `www.csr` (sent to the CA). The CSR decodes to `Subject: CN=www.example.org`, `Public Key: RSA 3072 bit`, `Signature: sha256WithRSAEncryption`.

### Wildcard certificates

A wildcard certificate has a name that starts with an asterisk label, such as `*.example.com`, and is valid for any single-level subdomain of that domain. One certificate and one key pair can then serve many hosts. It trades easier management for wider exposure if the key is stolen.

**Matching rules (RFC 9525, which replaced RFC 6125 in 2023):**
1. The asterisk must be the whole leftmost label, and it stands for exactly one label.
2. `*.example.com` matches `www.example.com`, `mail.example.com` and `shop.example.com`.
3. It does not match `a.b.example.com` (two levels) and does not match the bare `example.com`.
4. A wildcard in any other position (such as `www.*.example.com`), or as only part of a label (such as `w*.example.com`), makes the name invalid and it must be ignored.
To cover the bare domain as well, the certificate lists it as an extra Subject Alternative Name.

**Why it matters:** organizations with many subdomains save cost and effort, and new subdomains work without requesting new certificates. The risk is concentration: the same private key sits on every server that uses the certificate, so one compromised server exposes all subdomains, and revoking it disrupts all of them at once.

**Common confusions:** Wildcard vs SAN (Subject Alternative Name) certificate: a wildcard covers an open-ended set of one-level subdomains of ONE domain; a SAN certificate lists specific names, which can span different domains. A wildcard does not cover multiple levels.

**Scenario:** A clue says "a company keeps adding customer portals one level under portal.example.com (for example acme.portal.example.com) and wants one certificate to cover them all without reissuing." The answer is a wildcard certificate for `*.portal.example.com`. A SAN certificate is the closest wrong answer and fails because every new name would require reissuing it.

**Example:** `SAN: DNS:*.example.com, DNS:example.com` covers `www.example.com` and `example.com`, but a request for `dev.api.example.com` fails the name check.

### Subject Alternative Name (SAN) certificates

A SAN certificate uses the Subject Alternative Name extension to list every identity the certificate is valid for: DNS names, IP addresses, email addresses or URIs. RFC 5280 defines the extension as binding additional identities to the certificate's subject. One certificate can therefore cover several specific hosts, even in different domains.

**How it works:**
1. The requester lists all needed names in the certificate signing request.
2. The CA verifies the requester's right to each name before signing.
3. The issued certificate carries the list in its SAN extension.
4. A client compares the name it connected to with the SAN entries; a match on any one entry passes.
5. Adding or removing a name later means issuing a new certificate.

**Why it matters:** a single server or load balancer often answers for several names. A SAN certificate covers them with one key pair while naming each one explicitly, so nothing unexpected is covered.

**Common confusions:** Browsers match the name being visited against the SAN entries, so the names listed there are what count. SAN vs wildcard:

| | SAN certificate | Wildcard certificate |
|---|---|---|
| Covers | Exactly the listed names | Any one-level subdomain of one domain |
| Different domains | Yes | No |
| New host later | Reissue needed | Works automatically |
| Exposure if key stolen | The listed names | Every subdomain |

SAN here is unrelated to a storage area network.

**Scenario:** A clue says "one certificate must secure example.com, www.example.com and example.net, and nothing else." The answer is a SAN certificate. A wildcard is the closest wrong answer and fails because it cannot span two different domains or cover the bare domain by itself.

**Example:** `X509v3 Subject Alternative Name: DNS:example.com, DNS:www.example.com, DNS:example.net, IP Address:203.0.113.10`.
