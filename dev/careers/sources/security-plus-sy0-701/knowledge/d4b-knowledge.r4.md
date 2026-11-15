## 4.6 Given a scenario, implement and maintain identity and access management


**What the exam expects:** given a situation, pick the identity and access control that fits. Expect scenarios about a forgotten account, the right access model, the right SSO protocol, which factors make real MFA and which password setting stops a behavior.

### Provisioning/de-provisioning user accounts
Provisioning creates an account and grants what the role needs. De-provisioning disables and later removes it when the person leaves or changes role. Late de-provisioning leaves orphaned accounts an attacker or ex-employee can use. Best practice: drive both from the HR system, disable at once, delete after data and logs are kept.

### Permission assignments and implications
Grant rights to groups or roles, not to individuals. People who change jobs collect rights they no longer need (privilege creep). Every extra right enlarges what a stolen account can do, so review access regularly.

### Identity proofing
Checking that a person is who they claim before issuing credentials (government ID, a live selfie, known details). It happens once at enrollment or recovery; authentication then checks the credential at every login. NIST SP 800-63A defines identity assurance levels.

### Federation
A trust between separate organizations or domains: a user authenticates at their home identity provider (IdP) and a partner's service provider (SP) accepts that result. "Sign in with" a large provider on a third-party site is federation.

### Single sign-on (SSO)
Log in once, reach many systems. Convenient, but one stolen credential opens everything, so pair it with MFA.

- **Lightweight Directory Access Protocol (LDAP):** reads and updates a directory (for example Active Directory) of users, groups and devices arranged as a tree. TCP 389; LDAPS (over TLS) TCP 636. Apps bind to the directory to check credentials and group membership. A plain bind can send the password in cleartext, so protect it with LDAPS or StartTLS (RFC 4513).
- **Open Authorization (OAuth):** delegated authorization with access tokens. A user lets one app use limited parts of another service without sharing a password. OAuth alone is not authentication; OpenID Connect adds that layer on OAuth 2.0.
- **Security Assertions Markup Language (SAML):** XML assertions from IdP to SP carrying authentication and authorization, built mainly for browser-based enterprise SSO and federation; native mobile apps and APIs usually use OAuth 2.0 with OpenID Connect instead. The OASIS standard's own name is Security Assertion Markup Language (singular).

| | LDAP | OAuth | SAML |
|---|---|---|---|
| Purpose | Directory lookups and binds | Delegated authorization | Authentication and authorization assertions |
| Format | LDAP protocol messages | Tokens (often JSON) | XML |
| Typical use | Internal apps checking AD | Apps and APIs, mobile | Enterprise web SSO, federation |

**Federation vs SSO:** SSO is one login for many resources, usually inside one organization. Federation is trust across organizations. They often work together.

### Interoperability
Different vendors' identity systems working together through shared standards (SAML, OAuth, OpenID Connect, LDAP). Check protocol support before buying a service, or you end up with separate unmanaged accounts.

### Attestation
Confirming a claim with evidence. In SY0-701 identity management it means verifying a user's identity claims with extra details: a passport or driver's license, an in-person meeting, or questions drawn from credit history. It works alongside identity proofing when an account is created. Study material also uses two other senses: access attestation (managers periodically certify that each user's access is still needed, also called recertification) and device attestation (a TPM proves the device and its boot state are trusted).

### Access controls

| Model | Who decides | Clue words |
|---|---|---|
| Mandatory (MAC) | Administrators, through labels and clearances enforced by the OS | Secret, Top Secret, clearance, classification |
| Discretionary (DAC) | The resource owner | Owner, creator shares the file |
| Role-based (RBAC) | Access follows job role (groups) | Job title, department, new hire gets the role's rights |
| Rule-based | Admin-defined rules applied to everyone | Firewall ACL, condition for all users |
| Attribute-based (ABAC) | Policy over many attributes of user, resource, action and environment | Department AND device AND location AND time |

- **Time-of-day restrictions:** allow use only in set hours; a condition you can add to any model.
- **Least privilege:** only the minimum rights, only as long as needed. Admins use a normal account for daily work.

Trap: "RBAC" can mean role-based or rule-based. Read the full name in the question.

### Multifactor authentication
MFA needs two or more DIFFERENT factor types. Password plus PIN is still one factor.

**Implementations**
- **Biometrics:** fingerprint, face, iris, voice. Compare systems with false acceptance rate (FAR), false rejection rate (FRR) and the crossover error rate (CER). A stolen biometric cannot be changed.
- **Hard/soft authentication tokens:** generate one-time codes. Hard = a dedicated device (key fob). Soft = an authenticator app. TOTP changes with time (RFC 6238 recommends a 30-second step), HOTP with each use. SMS codes are weaker because of SIM swapping; NIST SP 800-63B-4 lists codes sent by SMS or voice call as a restricted authenticator.
- **Security keys:** USB or NFC devices using FIDO2 or U2F public key cryptography. Each credential is bound to the real site's domain, so a fake site gets nothing it can use: they resist phishing.

**Factors**
- **Something you know:** password, PIN, passphrase.
- **Something you have:** smart card, token, security key, phone.
- **Something you are:** biometrics.
- **Somewhere you are:** location by IP, GPS or network. It counts as a factor on SY0-701.

### Password concepts
**Password best practices**
- **Length:** minimum characters. The strongest single setting; passphrases make it easy.
- **Complexity:** mix of character types. Users fall into patterns, so length usually helps more.
- **Reuse:** blocked by password history; reuse across sites enables credential stuffing.
- **Expiration:** maximum password age, forces a change after a set time.
- **Age:** minimum password age, how long before a user may change again. It stops users changing several times in a row to cycle past the history.

| Setting | Stops |
|---|---|
| Expiration (maximum age) | One password being used forever |
| Age (minimum age) | Cycling past the history to reuse an old password |
| History (reuse) | Picking a recent password again |

Note: NIST SP 800-63B-4 (2025) requires at least 15 characters for a password used alone (8 when it is part of MFA), a check of new passwords against a blocklist of common or breached ones, no character-mix rules, and no forced periodic changes (only a change on evidence of compromise). The exam still expects you to know every setting above.

- **Password managers:** generate and store unique strong passwords in an encrypted vault behind one strong master credential plus MFA. NIST SP 800-63B-4 requires sites to allow password managers and autofill.
- **Passwordless:** no typed password: biometrics, security keys, passkeys, push approval. Usually FIDO2 based; still multifactor when it combines a device and a biometric or PIN. Synced passkeys copy the private key across a user's devices through a cloud account; device-bound ones, such as a hardware security key, never leave the device.

### Privileged access management tools
PAM tools protect admin and service accounts.
- **Just-in-time permissions:** elevated rights granted on request, for a limited time, then removed. No standing admin rights. Example: Microsoft Entra Privileged Identity Management, where a user activates an eligible admin role for a set time.
- **Password vaulting:** privileged passwords live in an audited vault, checked out when needed and often rotated afterward.
- **Ephemeral credentials:** temporary credentials made for one session or task that expire on their own (for example AWS STS AssumeRole credentials, valid from 15 minutes up to 12 hours; GetSessionToken credentials last up to 36 hours).

JIT gives an existing account rights for a while; ephemeral credentials are throwaway secrets themselves.

### Exam tips
- A file with a "Secret" label means MAC; an owner sharing a folder means DAC.
- OAuth = authorization with tokens; SAML = XML assertions for web SSO; LDAP = directory.
- "Users reuse old passwords despite history" points to minimum password age.

### Check yourself
1. A contractor's account worked weeks after the contract ended. What failed? **De-provisioning.**
2. Access depends on department, managed device, country and business hours together. Which model? **ABAC.**
3. A user enters a password and a PIN. Is this MFA? **No: both are something you know.**
4. A cloud app redirects users to the corporate IdP and receives an XML assertion. Which protocol? **SAML.**
5. Admins should have domain admin rights only for the hour they need them. Which PAM feature? **Just-in-time permissions.**

## 4.7 Explain the importance of automation and orchestration related to secure operations


**What the exam expects:** recognize tasks worth automating, the benefits, and the drawbacks. Automation is one task run by a script or tool; orchestration coordinates many automated steps across systems (for example a SOAR playbook).

### Use cases of automation and scripting
- **User provisioning:** accounts and access created, changed and removed from HR data.
- **Resource provisioning:** VMs, storage and cloud resources built from hardened templates and removed when finished.
- **Guard rails:** automatic limits that block or revert unsafe changes (no public storage buckets, no open management ports). AWS Control Tower first called these guardrails and now calls them controls.
- **Security groups:** group membership updated automatically as roles change; cloud security groups act as virtual firewalls.
- **Ticket creation:** alerts open tickets with the details already filled in.
- **Escalation:** issues routed to the next tier or on-call staff by severity or time unresolved.
- **Enabling/disabling services and access:** turn services, ports or accounts on and off by schedule or in response to a detection.
- **Continuous integration and testing:** every code change is built and tested, including security scans, in a pipeline.
- **Integrations and application programming interfaces (APIs):** APIs connect tools so one can trigger actions in another.

### Benefits
- **Efficiency/time saving:** tasks finish faster with less effort.
- **Enforcing baselines:** settings checked and restored so systems do not drift.
- **Standard infrastructure configurations:** identical builds from templates or code.
- **Scaling in a secure manner:** new systems arrive already secured.
- **Employee retention:** less tedious work, less burnout.
- **Reaction time:** responses in seconds, at any hour.
- **Workforce multiplier:** a small team does the work of a large one.

### Other considerations
- **Complexity:** many moving parts are hard to build, debug and change.
- **Cost:** tools, licenses, build and training time.
- **Single point of failure:** if the automation platform fails, everything depending on it stops; keep manual fallbacks.
- **Technical debt:** shortcuts and unmaintained scripts create rework and risks such as hard-coded secrets.
- **Ongoing supportability:** someone must maintain scripts as APIs, systems and staff change; document and version-control them.

| Benefits | Considerations |
|---|---|
| Speed, consistency, scale, fewer errors | Complexity, cost, failure of a central tool, debt, upkeep |

### Exam tips
- "Same settings on every server" = standard configurations; "settings put back after drift" = enforcing baselines.
- "Small team covers far more systems" = workforce multiplier.
- Complexity here is an automation drawback, not a password rule.

### Check yourself
1. A cloud policy stops anyone from making storage public. Which use case? **Guard rails.**
2. A playbook isolates an infected host seconds after an alert. Which benefit? **Reaction time.**
3. All workflows stop when the orchestration server fails. Which consideration? **Single point of failure.**
4. Old scripts with hard-coded paths break after a migration. Which consideration? **Technical debt.**

## 4.8 Explain appropriate incident response activities


**What the exam expects:** the phases in order and what belongs in each, how plans are trained and tested, and the forensic terms.

### Process
1. **Preparation:** IR plan, team and roles, communication plan, tools (jump kit, forensic software), training, baselines.
2. **Detection:** noticing a possible incident from SIEM, IDS/IPS, EDR alerts or user reports.
3. **Analysis:** confirming it is real, finding scope, impact and priority.
4. **Containment:** stopping the spread: isolate hosts, disable accounts, block addresses, while keeping evidence. Sandboxing also counts: isolate a sample to study it, or redirect an attacker into a sandbox to watch them (only with legal approval).
5. **Eradication:** removing the cause: malware, attacker accounts, backdoors; fixing the vulnerability.
6. **Recovery:** restoring from clean images and backups, then monitoring for return.
7. **Lessons learned:** a review soon after (the older NIST SP 800-61 Rev. 2 suggested within several days); improvements go back into preparation.

The phases loop in practice: while eradicating, responders often go back to detection and analysis to find more infected hosts.

The older NIST SP 800-61 Rev. 2 grouped these as preparation; detection and analysis; containment, eradication and recovery; post-incident activity. Rev. 3 (April 2025) replaced that lifecycle with the CSF 2.0 functions. The exam uses CompTIA's seven phases above.

| Phase | Key question |
|---|---|
| Containment | How do we stop it spreading? |
| Eradication | How do we remove it and close the hole? |
| Recovery | How do we get back to normal safely? |

### Training
Teach responders, management and staff their roles, procedures and tools before an incident.

### Testing
- **Tabletop exercise:** a discussion walk-through of a scenario around a table. No systems touched, cheap, good for roles and communication.
- **Simulation:** a hands-on exercise that acts out an incident (for example a harmless ransomware-like test program that responders must detect and contain). More realistic, more effort. NIST SP 800-84 calls tabletops discussion-based and has functional exercises where staff perform their duties in a simulated setting.

### Root cause analysis
Find the underlying cause, not the symptom, so it does not happen again. Methods include the five whys and cause-and-effect (fishbone) diagrams.

### Threat hunting
Proactive search for threats existing tools missed, started from a hypothesis or threat intelligence. It assumes an attacker may already be inside. Responding to alerts is reactive; hunting is proactive.

### Digital forensics
- **Legal hold:** an order, usually from legal counsel, to preserve data relevant to a case, an expected lawsuit, an investigation or an audit; it overrides normal deletion.
- **Chain of custody:** a record of everyone who handled the evidence, when and why. Gaps can make evidence unusable in court.
- **Acquisition:** collecting evidence in order of volatility (RFC 3227: CPU registers and cache; routing table, ARP cache, process table, kernel statistics and memory; temporary file systems; disk; remote logs and monitoring data; physical configuration and network topology; archival media), with bit-for-bit images and write blockers.
- **Reporting:** a written account of methods, timeline and findings that another examiner could repeat.
- **Preservation:** keeping evidence unchanged: hashes, write blockers, analysis on copies, originals locked away.
- **E-discovery:** the legal process of finding and handing over electronically stored information for a lawsuit.

| Term | Does |
|---|---|
| Legal hold | Stops data being deleted |
| Chain of custody | Proves who handled evidence and that it was not altered |
| E-discovery | Finds and produces data for the legal case |

### Exam tips
- Order traps: containment before eradication; eradication before recovery; lessons learned last.
- Capture memory before powering down a machine (memory is volatile).
- Tabletop = talk; simulation = do.

### Check yourself
1. Infected hosts were moved to an isolated VLAN. What is the next phase? **Eradication.**
2. Executives talk through a ransomware scenario in a meeting room. What test is this? **Tabletop exercise.**
3. Legal tells IT to stop auto-deleting a manager's mailbox. What is this? **Legal hold.**
4. A responder must collect evidence from a running server. What first? **Memory (RAM), by order of volatility.**
5. An analyst searches logs for a technique from a new threat report with no alert fired. What is this? **Threat hunting.**

## 4.9 Given a scenario, use data sources to support an investigation


**What the exam expects:** given a question an investigator needs answered, pick the source that holds the evidence.

### Log data
- **Firewall logs:** allowed and blocked traffic with source, destination, port, protocol and action. Good for scans and command-and-control traffic.
- **Application logs:** events inside one application: logins, errors, transactions.
- **Endpoint logs:** host activity from antivirus or EDR agents: processes, file changes, detections.
- **OS-specific security logs:** the operating system's own security events, such as the Windows Security event log or Linux authentication logs: logons, privilege use, account changes.
- **IPS/IDS logs:** traffic that matched a signature or anomaly; an IDS alerts, an IPS can also block.
- **Network logs:** switches, routers, wireless, DHCP, DNS and VPN events; help find which device had an address and where it connected.
- **Metadata:** data about data: email headers, file properties, photo location tags, connection details without content.

### Data sources
- **Vulnerability scans:** known weaknesses on each system; suggest how an attacker got in.
- **Automated reports:** scheduled or triggered summaries from tools such as a SIEM or scanner.
- **Dashboards:** live visual summaries for spotting spikes and anomalies.
- **Packet captures:** the actual packets, headers and payloads (Wireshark, tcpdump). The most detailed network evidence, but large and blind to encrypted payloads.

| Question | Best source |
|---|---|
| What exactly was sent? | Packet capture |
| Which ports and hosts talked, allowed or blocked? | Firewall logs |
| Which process ran on the laptop? | Endpoint logs |
| Who logged on to the server and when? | OS-specific security logs |
| Did the email really come from that server? | Metadata (email headers) |
| Which weakness was likely used? | Vulnerability scan |

### Exam tips
- Logs show that something happened; packet captures show the content.
- Correlate several sources on synchronized clocks to build a timeline; a SIEM does this.

### Check yourself
1. An analyst must see the contents of an unencrypted file transfer. **Packet capture.**
2. Who changed group membership on a Windows server? **OS-specific security logs.**
3. A spoofed email claims to be from the CEO. Where is the true origin? **Metadata: the email headers.**
4. A SOC wants to notice a sudden spike in outbound traffic at a glance. **Dashboard.**
