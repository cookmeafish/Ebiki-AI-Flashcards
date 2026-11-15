# Exam wording pass (2026-11-15)

Rule: course text never implies knowledge of what the real exam asks ("usual exam answers", "frequently tested", "trap", "look for X in the question"). Wording about the public objectives (verbs, listed items, domain weights) stays. Each change below is a new pass; older passes are untouched.

Scope: every live card and extras file was searched for exam, tested, test cue, trap, question, cue, favorite, usual answer, scenario and similar. Hits about real testing (change management tests, pen tests, restore tests), SNMP traps, attacker traps on the web, domain weights and "given a scenario" objective titles were judged fine and left. Two extras files needed a change (their key points are lists).

61 changes.

| File | Term | Field | Before | After |
|---|---|---|---|---|
| cards/d1-cards.r5.json | SY0-701 Domain 1.0: General Security Concepts (12%) | definition | It covers the building blocks the rest of the exam relies on: | It covers the building blocks the other domains rely on: |
| cards/d1-cards.r5.json | SY0-701 1.1: Compare and contrast various types of security controls | keyPoints | read the scenario for the control's intent | look at what the control is meant to achieve |
| cards/d1-cards.r5.json | Managerial control (control category) | keyPoints | policies and risk assessments are the usual exam answers | policies and risk assessments are typical examples |
| cards/d1-cards.r5.json | Operational control (control category) | keyPoints | the trap is confusing it with managerial | a common mix-up is confusing it with managerial |
| cards/d1-cards.r5.json | Physical control (control category) | keyPoints | depending on the question's framing | depending on whether you focus on the barrier or the person doing the work |
| cards/d1-cards.r5.json | Compensating control (control type) | keyPoints | look for 'cannot', 'unable to' or 'legacy' in the scenario | it usually comes up when a system cannot take the ideal control, such as legacy equipment |
| cards/d1-cards.r5.json | SY0-701 1.2: Summarize fundamental security concepts | keyPoints | Zero Trust components and physical sensors are frequently tested details; | Zero Trust components and physical sensors are detailed lists worth studying closely; |
| cards/d1-cards.r5.json | Policy Engine (Zero Trust) | keyPoints | the trap is choosing Policy Administrator or PEP when the question asks who decides | a common mix-up is naming the Policy Administrator or PEP as the part that decides |
| cards/d1-cards.r5.json | Encryption levels (data at rest) | keyPoints | Scope choice is the test; | The key choice is scope; |
| cards/d1-cards.r5.json | Volume encryption (encryption level) | keyPoints | trap: a partition | common mix-up: a partition |
| cards/d1-cards.r5.json | Tokenization (data obfuscation) | keyPoints | the exam case is vault-based tokens | the form to know first is vault-based tokens |
| cards/d1-cards.r5.json | Digital signatures | keyPoints | 'encrypt the hash with the private key' is the exam's simplified picture | 'encrypt the hash with the private key' is the common simplified picture |
| cards/d1-cards.r5.json | Certificates: Online Certificate Status Protocol (OCSP) | keyPoints | on the exam OCSP is still the real-time check | in the SY0-701 objectives OCSP is still the real-time check |
| cards/d2-cards.r5.json | SY0-701 Domain 2.0: Threats, Vulnerabilities, and Mitigations (22%) | keyPoints | 2.4 is a "given a scenario" objective, so expect performance-based log and symptom questions; many terms repeat across objectives (buffer overflow, brute force, supply chain, encryption), so read which context the question asks about | 2.4 is a "given a scenario" objective, so practice reading logs and symptoms; many terms repeat across objectives (buffer overflow, brute force, supply chain, encryption), so note which context a term is used in |
| cards/d2-cards.r5.json | Nation-state (threat actor) | keyPoints | trap: a well funded | common mix-up: a well funded |
| cards/d2-cards.r5.json | Attributes of threat actors | keyPoints | Three attributes on the exam: | The objectives list three attributes: |
| cards/d2-cards.r5.json | Threat actor motivations | keyPoints | Questions often give the behavior and ask the motive; | A good habit is to work back from the behavior to the motive; |
| cards/d2-cards.r5.json | SY0-701 2.2: Explain common threat vectors and attack surfaces | keyPoints | are heavily tested | are many similar terms that are easy to mix up |
| cards/d2-cards.r5.json | Time-of-check (TOC) (race condition) | keyPoints | trap: TOC itself | common mix-up: TOC itself |
| cards/d3-cards.r8.json | SY0-701 Domain 3.0: Security Architecture (18%) | definition | The exam domain about designing | The domain about designing |
| cards/d3-cards.r8.json | SY0-701 Domain 3.0: Security Architecture (18%) | keyPoints | mostly compare and contrast and scenario questions; tests trade-offs, not configuration syntax | its objectives are mostly "compare and contrast" and "given a scenario"; the focus is trade-offs, not configuration syntax |
| cards/d3-cards.r8.json | Architecture considerations (SY0-701 3.1) | keyPoints | exam scenarios name a priority (cost, uptime, patching) and ask which model fits it | in practice you start from the priority (cost, uptime, patching) and pick the model that fits it |
| cards/d3-cards.r8.json | Port security (network access control) | keyPoints | 802.1X with EAP is what the exam item lists | 802.1X with EAP is what the objective lists |
| cards/d3-cards.r8.json | Firewall types (SY0-701) | definition | The kinds of firewalls the exam compares: | The kinds of firewalls the objectives compare: |
| cards/d3-cards.r8.json | Tunneling (secure communication) | definition | The main secure tunneling protocols on the exam are TLS and IPSec. | The main secure tunneling protocols named in the objectives are TLS and IPSec. |
| cards/d3-cards.r8.json | Restricted (data classification) | keyPoints | so read how the question defines them | so check how each organization defines them |
| cards/d3-cards.r8.json | Tokenization (method to secure data) | keyPoints | while the exam sense is the vault token with no mathematical link | while the form to know first is the vault token with no mathematical link |
| cards/d4a-cards.r5.json | SY0-701 Domain 4.0: Security Operations (28%) | keyPoints | many questions are "given a scenario" (4.1, 4.5, 4.6, 4.9), so expect to pick the right tool or action | many objectives are "given a scenario" (4.1, 4.5, 4.6, 4.9), so practice picking the right tool or action |
| cards/d4a-cards.r5.json | Switches (hardening target) | keyPoints | are classic exam findings | are classic audit findings |
| cards/d4a-cards.r5.json | Choose your own device (CYOD) | keyPoints | trap: CYOD does not | common mix-up: CYOD does not |
| cards/d4a-cards.r5.json | Wi-Fi Protected Access 3 (WPA3) | keyPoints | study guides teach "WPA3 uses GCMP", so pick GCMP if asked; WPA3 is the best answer for new Wi-Fi | study guides simplify this to "WPA3 uses GCMP"; WPA3 is the best choice for new Wi-Fi |
| cards/d4a-cards.r5.json | Input validation | keyPoints | on the exam, input validation is the usual answer for stopping injection | in practice, input validation is the usual first defense against injection |
| cards/d4b-cards.r5.json | Mandatory access control (MAC) | keyPoints | Look for 'classification' or 'clearance' in the question | Classification labels and clearances are its telltale signs |
| cards/d4b-cards.r5.json | Discretionary access control (DAC) | keyPoints | Look for 'owner' or 'creator' in the question | An owner or creator setting access is its telltale sign |
| cards/d4b-cards.r5.json | Password best practices (policy settings) | keyPoints | Exam settings: length, complexity, reuse, expiration, age; | The objectives list these settings: length, complexity, reuse, expiration, age; |
| cards/d4b-cards.r5.json | Password best practices (policy settings) | keyPoints | Still know each setting for the exam | Still know each setting the objectives list |
| cards/d4b-cards.r5.json | Complexity (password best practice) | keyPoints | the exam still lists complexity as a policy setting | the objectives still list complexity as a policy setting |
| cards/d4b-cards.r5.json | Age (password best practice) | keyPoints | Classic exam trap: 'users keep reusing old passwords despite history' points to minimum age | A good way to spot it: users who keep cycling back to old passwords despite history need a minimum age |
| cards/d4b-cards.r5.json | Other considerations (automation and orchestration) | keyPoints | These are the 'cons' list on the exam | These are the 'cons' list in the objectives |
| cards/d4b-cards.r5.json | Incident response process (SY0-701) | keyPoints | The exam uses CompTIA's seven-phase list | The objectives use CompTIA's seven-phase list |
| cards/d4b-cards.r5.json | SY0-701 4.9: Given a scenario, use data sources to support an investigation | keyPoints | Match the question to the source that holds that evidence | Match what you need to find out to the source that holds that evidence |
| cards/d4b-cards.r5.json | Data sources (investigation, other than logs) | keyPoints | Pick the source that answers the question asked | Pick the source that holds what you need to know |
| cards/d5-cards.r5.json | Guidelines (security governance) | keyPoints | Trap: a document | Common mix-up: a document |
| cards/d5-cards.r5.json | Incident response (policy) | keyPoints | but the exam uses the seven-step list | but the objectives use the seven-step list |
| cards/d5-cards.r5.json | Onboarding/offboarding (procedure) | keyPoints | Timely deprovisioning is the main exam point; | Timely deprovisioning is the main point; |
| cards/d5-cards.r5.json | Owners (data and system roles) | keyPoints | Trap: the owner | Common mix-up: the owner |
| cards/d5-cards.r5.json | Risk assessment | definition | On the exam it is described by how often it is done: | The objectives describe it by how often it is done: |
| cards/d5-cards.r5.json | Qualitative risk analysis | keyPoints | Trap: anything with dollar figures | Common mix-up: anything with dollar figures |
| cards/d5-cards.r5.json | Annualized loss expectancy (ALE) | keyPoints | Trap: do not multiply | Common mistake: do not multiply |
| cards/d5-cards.r5.json | Risk threshold | keyPoints | Trap: appetite | Common mix-up: appetite |
| cards/d5-cards.r5.json | Risk appetite | definition | The exam lists three postures: | The objectives list three postures: |
| cards/d5-cards.r5.json | Transfer (risk strategy) | keyPoints | Trap: accountability | Common mix-up: accountability |
| cards/d5-cards.r5.json | Accept (risk strategy) | definition | The exam lists two forms: | The objectives list two forms: |
| cards/d5-cards.r5.json | Avoid (risk strategy) | keyPoints | Trap: paying another party | Common mix-up: paying another party |
| cards/d5-cards.r5.json | Recovery point objective (RPO) | keyPoints | Trap: RPO is not | Common mix-up: RPO is not |
| cards/d5-cards.r5.json | SY0-701 5.3: Explain the processes associated with third-party risk assessment and management | keyPoints | Supply chain attacks make vendor risk an exam favorite | Supply chain attacks make vendor risk a high priority |
| cards/d5-cards.r5.json | Service-level agreement (SLA) | keyPoints | Trap: the SLA | Common mix-up: the SLA |
| cards/d5-cards.r5.json | Due diligence/due care (compliance monitoring) | keyPoints | Trap: both are needed | Common mix-up: both are needed |
| cards/d5-cards.r5.json | Passive reconnaissance | keyPoints | Trap: a port scan | Common mix-up: a port scan |
| cards/d1-extras.r3.json | Registration authority (RA) | keyPoints[4] | Trap: the entity that signs a certificate is always the CA, never the RA | Common mix-up: the entity that signs a certificate is always the CA, never the RA |
| cards/d4a-extras.r7.json | Email encryption: S/MIME and PGP | keyPoints[4] | Exam cue: "only the recipient can read it" or "prove the sender of this one message" points to S/MIME or PGP | A good way to tell them apart: when only the recipient may read the message, or the sender of one message must be proven, S/MIME or PGP fits |
