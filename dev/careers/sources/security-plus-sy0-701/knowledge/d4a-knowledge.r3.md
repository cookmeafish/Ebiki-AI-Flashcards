# 4.0 Security Operations

Security Operations is the largest Security+ SY0-701 domain (28% of the exam). It is about the daily work of running security: hardening systems and keeping them on a secure baseline, knowing what assets you own, finding and fixing vulnerabilities, monitoring and responding to alerts, and tuning enterprise tools such as firewalls, web filters, email authentication and endpoint protection. Objectives 4.6 to 4.9 (identity and access management, automation, incident response, investigation data sources) complete the domain.

Four of the nine objectives start with "Given a scenario" (4.1, 4.5, 4.6, 4.9). Expect questions that describe a situation and ask for the best technique, tool or setting, so focus on telling similar options apart.

## 4.1 Given a scenario, apply common security techniques to computing resources


What the exam expects: given a device or situation, pick the technique that secures it. Know the baseline life cycle, how hardening differs per device type, mobile ownership models, wireless settings and basic secure coding.

### Secure baselines
A secure baseline is the approved, documented set of security settings for one type of system. It gives every system of that type the same known-good starting point and lets you detect drift.

- **Establish:** decide the settings, usually starting from CIS Benchmarks, DISA STIGs or vendor guides, test them against business needs, document and approve them.
- **Deploy:** apply them consistently with central tools (Group Policy, MDM, configuration management, golden images), not by hand.
- **Maintain:** update the baseline as software, threats and guidance change, and scan regularly for systems that no longer match. Baseline changes go through change management.

### Hardening targets
Hardening reduces the attack surface: patch, change default credentials, disable unneeded services, ports and software, apply least privilege, and turn on logging. What differs is the constraint each target brings.

| Target | Main hardening focus | Typical constraint |
|---|---|---|
| Mobile devices | MDM policy, screen lock, encryption, updates, remote wipe | Updates depend on manufacturer and carrier |
| Workstations | Patching, no daily admin rights, EDR or antivirus, host firewall, disk encryption | Many users and installed apps |
| Switches | Change defaults, SSH and SNMPv3 for management, disable unused ports, 802.1X or port security, firmware | Plaintext management protocols left on |
| Routers | Defaults, encrypted management, ACLs, firmware, restrict management access | Boundary device, compromise affects many hosts |
| Cloud infrastructure | Least-privilege IAM, MFA for admins, no public storage, tight security groups, logging | Shared responsibility; misconfiguration is the top risk |
| Servers | Minimal roles and services, strict admin access, host firewall, monitoring | High-value target |
| ICS/SCADA | Segmentation or air gap, strict access, planned patching | Availability and safety first; legacy, hard to patch |
| Embedded systems | Firmware updates when available, change defaults, isolate | Few or no updates |
| RTOS | Isolate, careful vendor updates, limit access | Security tools must not disturb strict timing |
| IoT devices | Change default passwords, firmware updates, own network segment | Weak defaults, poor vendor support |

ICS means industrial control systems, SCADA means supervisory control and data acquisition, RTOS means real-time operating system, IoT means Internet of Things.

### Wireless devices
**Installation considerations** are the planning steps for access points.
- **Site surveys** examine the location: existing networks, interference, obstacles, channel use, and rogue access points. Done before installation and repeated over time.
- **Heat maps** show signal strength on a floor plan in colors, revealing dead zones and signal leaking outside the building, so placement and power can be adjusted.

### Mobile solutions
**Mobile device management (MDM)** centrally enrolls and controls phones and tablets: passcode and encryption policy, app control, containerization (work data kept apart from personal data), location tracking, remote lock and wipe.

**Deployment models**

| Model | Who owns it | Who chooses it | Personal use | Company control |
|---|---|---|---|---|
| BYOD (bring your own device) | Employee | Employee | Yes, it is personal | Lowest; usually only a work container |
| COPE (corporate-owned, personally enabled) | Company | Company | Allowed | Full |
| CYOD (choose your own device) | Company | Employee, from an approved list | Usually allowed | Full |

Trap: in CYOD the user chooses, but the company still owns the device.

**Connection methods**
- **Cellular:** the carrier network. Traffic skips corporate filtering and monitoring; location can be tracked.
- **Wi-Fi:** risk of rogue access points, evil twins and on-path attacks on untrusted networks. Use WPA3 or WPA2 encryption and a VPN on public networks.
- **Bluetooth:** short range, but open to unwanted pairing, bluejacking (unsolicited messages) and bluesnarfing (data theft). Turn it off or make it non-discoverable when not needed.

### Wireless security settings
- **WPA3 (Wi-Fi Protected Access 3):** personal mode uses Simultaneous Authentication of Equals (SAE) instead of the WPA2 pre-shared key handshake, which stops offline password guessing on captured handshakes and adds forward secrecy. Protected management frames are required. Personal mode still uses at least AES-CCMP-128; the optional enterprise 192-bit mode uses AES-GCMP-256. Wi-Fi 7 devices use GCMP-256 for WPA3 in both modes. In the 6 GHz band (Wi-Fi 6E and 7) WPA3 and protected management frames are mandatory and WPA2 is not allowed. Transition mode lets WPA2 and WPA3 clients share one network name, with WPA2 protection for the WPA2 clients.
- **AAA/RADIUS:** AAA is authentication, authorization and accounting. In enterprise Wi-Fi the access point forwards logins to a RADIUS server (UDP 1812 authentication, 1813 accounting), which checks them against a directory. Each user has their own credentials, so one account can be disabled without changing a shared passphrase. RADIUS hides only the password; TACACS+ (TCP 49) encrypts the whole message body (RFC 8907 calls this obfuscation and advises a secure transport). Early RADIUS used UDP 1645 and 1646.
- **Cryptographic protocols:** protect the data. WPA2 uses CCMP-128 (AES); WPA3-Personal requires at least CCMP-128; WPA3-Enterprise 192-bit mode uses GCMP-256, and Wi-Fi 7 uses GCMP-256 for all WPA3. WEP and TKIP are broken.
- **Authentication protocols:** prove identity. IEEE 802.1X is the port-based framework, EAP carries the method: EAP-TLS (certificates on client and server, strongest), PEAP and EAP-TTLS (a TLS tunnel around another login, server certificate only), EAP-FAST (Cisco; builds its tunnel from a shared secret called a Protected Access Credential instead of certificates).

### Application security
- **Input validation:** check type, length, format and allowed characters of every input on the server side, using allow lists. A key defense against SQL injection and cross-site scripting, together with parameterized queries and output encoding, which OWASP names as the main fixes for those two. On the exam, input validation is the usual answer for stopping injection.
- **Secure cookies:** cookie attributes Secure (HTTPS only), HttpOnly (scripts cannot read it) and SameSite (limits cross-site sending: Strict, Lax, which Chromium-based browsers use when no value is set, or None, which also needs Secure).
- **Static code analysis:** SAST examines code without running it to find flaws early; needs human review of false positives.
- **Code signing:** the publisher signs code with a private key backed by a CA certificate; users verify publisher and integrity. It does not prove the code is safe.

### Sandboxing
Runs code or files in an isolated environment so they cannot affect the real system. Used by browsers and mobile OSs, for testing, and for malware analysis.

### Monitoring
Continuous collection and review of logs and security events from computing resources. Hardening prevents; monitoring detects when prevention fails or configuration drifts.

### Exam tips
- "Shared passphrase, need per-user logins and accounting" points to WPA3-Enterprise with 802.1X and RADIUS.
- "Device cannot be patched" (ICS, embedded, old IoT) points to segmentation.
- Telnet, HTTP and SNMPv1/v2c on network gear are findings; replace with SSH, HTTPS and SNMPv3.
- "Which cipher mode does WPA3 use?" study guides teach GCMP, so pick GCMP.

### Check yourself
1. Employees pick a phone from three approved models, the company pays for and manages it. Which model? **CYOD.**
2. An attacker captured a Wi-Fi handshake and wants to guess the passphrase offline. Which standard prevents this? **WPA3, through SAE.**
3. A new office needs AP placement that avoids signal leaking into the street. What do you use? **A site survey and heat map.**
4. A login form passed `' OR 1=1` to the database. Which control was missing? **Input validation (with parameterized queries).**
5. Users must know an installer really came from the vendor and was not altered. What provides that? **Code signing.**

## 4.2 Explain the security implications of proper hardware, software, and data asset management


What the exam expects: the asset life cycle and why each stage matters to security. You cannot protect, patch or scan what you do not know you have, and data left on retired media is a breach waiting to happen.

### Acquisition/procurement process
Buy through a controlled process: approved vendors, security requirements checked before purchase, supply chain risk considered, and each new asset recorded the day it arrives. This also prevents shadow IT.

### Assignment/accounting
- **Ownership:** a named person or group is accountable for the asset, approves access and decides its use.
- **Classification:** a label for sensitivity and importance (for example public, internal, confidential, restricted) that decides which controls apply.

### Monitoring/asset tracking
- **Inventory:** the record of what you should have: tag, serial number, owner, location, configuration, software.
- **Enumeration:** active discovery of what is really there, by network scans or management agents. Comparing the two reveals missing, stolen or unauthorized assets.

### Disposal/decommissioning
| Item | What it means | Media reusable? |
|---|---|---|
| Sanitization | Make data unrecoverable: overwriting or factory reset (clear), secure erase, cryptographic erase or degaussing magnetic media (purge). NIST SP 800-88 methods (Rev. 2, September 2025, replaced the 2014 Rev. 1 with the same three methods): clear and purge can leave the media usable, destroy does not. For cloud storage, cryptographic erase may be the only purge option | Often yes (degaussing can ruin hard drives) |
| Destruction | Physically ruin the media: disintegrating, incinerating, melting, pulverizing, shredding (a drilled hole only partly destroys it; NIST Rev. 2 keeps shredding and pulverizing for low-sensitivity data only, because dense modern media can survive them, and does not count degaussing as destroy) | No |
| Certification | Documented proof of sanitization or destruction, such as a certificate of sanitization (NIST SP 800-88 Rev. 2: one per sanitized device, paper or electronic) or a certificate of destruction from a vendor | Not applicable |
| Data retention | Keep required data for its mandated period before disposal; legal holds override normal disposal | Not applicable |

Traps: deleting files or a quick format is not sanitization. Degaussing does not work on SSDs. Keeping data longer than required adds risk.

### Check yourself
1. A scan finds 30 more laptops on the network than the inventory lists. Which activity revealed them? **Enumeration.**
2. Old SSDs will be donated. Which approach fits: sanitization or destruction? **Sanitization (secure or cryptographic erase), since the drives will be reused.**
3. An auditor asks for proof that drives sent to a recycler were destroyed. What do you show? **A certificate of destruction (certification).**
4. Before wiping a finance server, what must be checked? **Data retention requirements and legal holds.**

## 4.3 Explain various activities associated with vulnerability management


What the exam expects: the cycle identify, analyze, respond, validate, report, and the vocabulary at each step.

### Identification methods
- **Vulnerability scan:** automated check for known flaws, missing patches and misconfigurations. Credentialed scans log in and see more; non-credentialed scans show the outsider view. Scans identify, they do not exploit.
- **Application security:**
  - **Static analysis (SAST):** code examined without running it; points to the exact line.
  - **Dynamic analysis (DAST):** the running app is tested; fuzzing sends malformed input; finds runtime problems.
  - **Package monitoring:** watches third-party libraries for new vulnerabilities (software supply chain, SBOM).
- **Threat feed:** intelligence about new threats and indicators.
  - **OSINT:** public, free sources; verify quality.
  - **Proprietary/third-party:** paid, curated vendor feeds.
  - **Information-sharing organization:** industry groups such as ISACs share what members see.
  - **Dark web:** monitoring criminal forums for leaked credentials and data.
- **Penetration testing:** authorized simulated attack that exploits weaknesses, under rules of engagement (known, partially known or unknown environment).
- **Responsible disclosure program:** a defined way for outsiders to report flaws so they are fixed before going public.
  - **Bug bounty program:** the same, with rewards, within a defined scope.
- **System/process audit:** review against policy or standards; finds process gaps that scanners cannot.

### Analysis
- **Confirmation:** check findings are real.

| | Reported by tool | Actually present | Risk |
|---|---|---|---|
| False positive | Yes | No | Wasted effort, alert fatigue |
| False negative | No | Yes | Most dangerous: nothing gets fixed |

- **Prioritize:** fix highest real risk first: severity, active exploitation, exposure, asset value.
- **CVSS vs CVE:**

| | CVE | CVSS |
|---|---|---|
| What | Unique identifier for a known vulnerability | Severity score from 0.0 to 10.0 |
| Example | CVE-2021-44228 | 10.0 Critical |
| Who | Run by MITRE, sponsored by CISA (official name Common Vulnerabilities and Exposures; CompTIA's list writes Enumeration) | FIRST maintains the standard; NVD publishes scores |

CVSS v3.x and v4.0 (November 2023) ratings: None 0.0, Low 0.1 to 3.9, Medium 4.0 to 6.9, High 7.0 to 8.9, Critical 9.0 to 10.0.
- **Vulnerability classification:** grouping by type (injection, misconfiguration, missing patch) and severity to spot root causes.
- **Exposure factor:** percentage of asset value lost if the threat succeeds. SLE = asset value x EF.
- **Environmental variables:** internet-facing or isolated, data held, other controls in place. The same CVE can be urgent in one place and minor in another.
- **Industry/organizational impact:** regulation, critical services, safety and reputation for this specific organization.
- **Risk tolerance:** how much risk leadership accepts; here it sets remediation deadlines and whether exceptions are allowed. It is the same tolerance as in 5.2, applied to vulnerabilities.

### Vulnerability response and remediation
| Option | Effect | Flaw still there? |
|---|---|---|
| Patching | Fixes the root cause; test and use change management | No |
| Insurance | Transfers financial impact | Yes |
| Segmentation | Isolates the system, fewer attack paths | Yes |
| Compensating controls | Alternative safeguard such as a WAF rule or extra monitoring | Yes |
| Exceptions and exemptions | Formal, documented, time-limited risk acceptance (NIST SP 800-40 Rev. 4: track them closely and give unpatchable assets their own maintenance group) | Yes |

### Validation of remediation
- **Rescanning:** run the same scan again to confirm the finding is gone.
- **Audit:** review evidence and records that remediation followed policy.
- **Verification:** directly confirm the fix works, for example retesting the exploit.

### Reporting
Communicate findings, trends and progress (open criticals, time to remediate) at the right level for administrators, management and auditors.

### Check yourself
1. A scanner flags a flaw, but the server has a backported patch. What is this? **A false positive.**
2. A team says "CVE-2024-1234 has a 9.8." Which part is the identifier and which the score? **CVE is the identifier, 9.8 is the CVSS score.**
3. A legacy system cannot be patched for six months. Name two responses. **Segmentation or compensating controls, documented with an exception.**
4. How do you confirm a patch actually closed the finding? **Rescan (and verify).**
5. Outside researchers are paid for reporting flaws in scope. What program is this? **A bug bounty program.**

## 4.4 Explain security alerting and monitoring concepts and tools


What the exam expects: what gets monitored, what the monitoring activities are, and which tool fits which job.

### Monitoring computing resources
- **Systems:** servers and endpoints: availability, CPU, memory, disk, authentication logs, processes, configuration changes.
- **Applications:** availability, errors, response times, application logs, unusual user actions.
- **Infrastructure:** routers, switches, firewalls, wireless controllers, cloud and virtualization platforms.

### Activities
- **Log aggregation:** collect logs from many sources into one place (usually a SIEM) for search, correlation and tamper protection. Needs accurate time sync.
- **Alerting:** rules and thresholds notify staff about likely problems.
- **Scanning:** regular checks for vulnerabilities, rogue devices and baseline drift.
- **Reporting:** summaries, trends and compliance status for each audience.
- **Archiving:** long-term, protected storage of older data to meet retention rules and support late investigations.
- **Alert response and remediation/validation:** investigate, contain, fix, confirm.
  - **Quarantine:** isolate a file or host so it cannot spread harm.
  - **Alert tuning:** adjust rules to cut false positives without creating false negatives.

### Tools
| Tool | What it does | Tell it apart |
|---|---|---|
| SCAP (Security Content Automation Protocol) | NIST suite of standards (CVE, CVSS, CPE, CCE, XCCDF, OVAL; current release SCAP 1.4) so tools check configuration and vulnerabilities in a common format | The common language for automated checks |
| Benchmarks | Recommended secure settings, such as CIS Benchmarks and DISA STIGs | The content you check against |
| Agents/agentless | Agent: software on the host, detailed, works off network. Agentless: remote collection, nothing installed | Agent = more detail, more upkeep |
| SIEM | Aggregates and correlates logs, alerts, dashboards, retention | Correlation across many sources |
| Antivirus | Signature plus heuristic malware detection on endpoints | Malware focus, less investigation than EDR |
| DLP | Finds sensitive data in use, in motion and at rest; alerts or blocks | About data, not malware |
| SNMP traps | Device pushes an unsolicited alert to the manager (UDP 162; polling uses 161) | Push vs poll; use SNMPv3 |
| NetFlow | Flow metadata: who talked to whom, ports, bytes, times | Not packet contents |
| Vulnerability scanners | Find known flaws and misconfigurations | Identify, do not exploit |

### Check yourself
1. A switch must notify the management station the instant a link fails. Which tool? **SNMP traps.**
2. An analyst needs to see which host sent 20 GB to an outside IP overnight, without full packet capture. Which tool? **NetFlow.**
3. Analysts ignore alerts because 95% are false positives. What should happen? **Alert tuning.**
4. Network appliances cannot run software agents. How are they monitored? **Agentless (SNMP, syslog, APIs).**
5. Which tool correlates a phishing click, a new process and a bad IP connection into one alert? **SIEM.**

## 4.5 Given a scenario, modify enterprise capabilities to enhance security


What the exam expects: given a problem, choose and adjust the right enterprise control.

### Firewall
- **Rules:** source, destination, port, protocol, action. Processed top to bottom, first match wins, an implicit deny catches everything else. Put specific rules above general ones. NIST SP 800-41 adds that rule handling varies by product and recommends deny by default.
- **Access lists:** ordered permit and deny entries on a firewall or router interface, same first-match logic.
- **Ports/protocols:** allow only needed services (for example TCP 443) and block the rest (Telnet 23, RDP 3389 from the internet). Next-generation firewalls also identify the application, not just the port.
- **Screened subnets:** the zone formerly called a DMZ, holding public-facing servers so a compromise there cannot freely reach the internal network.

### IDS/IPS
An IDS detects and alerts (out of band); an IPS sits inline and can block.
- **Trends:** detection patterns over time on dashboards, used to spot campaigns and prioritize.
- **Signatures:** patterns of known attacks; accurate for known threats, blind to new ones, need updates. Anomaly or behavior detection compares against a baseline and can catch new attacks, with more false positives.

### Web filter
- **Agent-based:** software on each device; filtering works anywhere, including off network.
- **Centralized proxy:** traffic passes through one server for filtering and logging; covers only traffic routed through it; HTTPS inspection needs TLS decryption.
- **URL scanning:** checks the requested address against known bad lists and analysis. (CompTIA writes Universal Resource Locator; the standard name is Uniform.)
- **Content categorization:** allow or block whole categories such as gambling or malware.
- **Block rules:** explicit denials for URLs, categories, file types, users or groups.
- **Reputation:** scores sites by history and age, so new or unknown risky sites are caught.

### Operating system security
- **Group Policy:** Windows Active Directory central settings applied through GPOs (password rules, USB control, firewall). It pushes Windows settings across a domain; it is not the Windows version of SELinux, which enforces mandatory access control on each Linux host.
- **SELinux:** Linux mandatory access control; policy limits what each process can touch, even beyond file permissions. Modes: enforcing, permissive (blocks nothing, only logs what would be denied), disabled.

### Implementation of secure protocols
- **Protocol selection:** choose encrypted, authenticated versions.
- **Port selection:** use and open only the standard ports for those protocols.
- **Transport method:** TLS for one application connection, a VPN (IPsec or TLS) for everything between sites, strong wireless encryption on Wi-Fi.

| Insecure | Secure replacement | Secure port |
|---|---|---|
| Telnet (23) | SSH | 22 |
| HTTP (80) | HTTPS | 443 |
| FTP (20/21) | SFTP (over SSH) / FTPS | 22 / 989-990 |
| LDAP (389) | LDAPS | 636 |
| IMAP (143) | IMAPS | 993 |
| POP3 (110) | POP3S | 995 |
| SMTP (25) | SMTP with TLS for submission | 465 (implicit TLS) / 587 (STARTTLS) |
| SNMPv1/v2c | SNMPv3 | 161/162 |

### DNS filtering
Blocks malicious or disallowed domains at name resolution, so no connection starts. Works for all applications that use DNS. Weakness: direct IP connections or outside DNS servers, so block other DNS traffic too. Encrypted DNS (DNS over HTTPS on port 443) from browsers or malware can skip the company resolver unseen; NSA advises sending all DNS only to the designated enterprise resolver and blocking other DoH and DoT (port 853) resolvers.

### Email security
| Record | What it checks | How |
|---|---|---|
| SPF (Sender Policy Framework) | Is the sending server allowed to send for this domain? | DNS TXT record listing allowed servers or IPs; checks the envelope sender (MAIL FROM) domain and the HELO name |
| DKIM (DomainKeys Identified Mail) | Did the message come from this domain, unchanged? | Sender signs with a private key; public key in DNS at selector._domainkey |
| DMARC (Domain-based Message Authentication Reporting and Conformance) | What to do when checks fail, and who gets reports | DNS TXT record at _dmarc; policy none, quarantine or reject; passes when SPF or DKIM passes and aligns with the visible From domain |

- **Gateway:** a secure email gateway filters inbound and outbound mail for spam, phishing and malware, enforces SPF/DKIM/DMARC results, and can apply DLP and encryption.

Trap: DKIM signs, it does not encrypt. DMARC needs SPF or DKIM; it does not replace them. RFC 9989 (May 2026) replaced the original DMARC RFC 7489 without changing these basics; CompTIA's acronym list writes Domain Message Authentication Reporting and Conformance.

### File integrity monitoring
Compares hashes of important files against a known-good baseline and alerts on unauthorized changes (for example Tripwire, Windows System File Checker). PCI DSS v4 requirement 11.5.2 demands a change-detection tool that alerts on unauthorized changes to critical files and compares them at least weekly. CompTIA's acronym list expands FIM as File Integrity Management.

### DLP
Configured policies find sensitive data on endpoints, in network traffic, email and cloud services, and block, encrypt, quarantine or alert when it would leave improperly (for example blocking Confidential files to USB).

### Network access control (NAC)
Checks identity (often 802.1X) and posture (patches, antivirus, encryption) before granting network access. Noncompliant devices go to a quarantine or remediation network. Agents can be persistent, dissolvable or none (agentless).

### EDR/XDR
- **EDR:** records endpoint activity, detects by behavior, supports investigation and response (isolate host, kill process, roll back).
- **XDR:** correlates endpoints plus network, cloud, email and identity data for one broader view.

### User behavior analytics
Learns each user's normal pattern and flags big deviations, catching compromised accounts and insider threats. UEBA extends this to devices and other entities.

### Check yourself
1. Spoofed emails use the company domain in the From line. What stops receivers accepting them? **SPF and DKIM, enforced by a DMARC policy of quarantine or reject.**
2. A deny rule for the finance server never triggers. Why? **A broader allow rule sits above it; first match wins.**
3. Remote laptops must be web filtered at home without a VPN. Which option? **Agent-based web filtering.**
4. Malware connects to its server by domain name from many applications. Which control blocks it most broadly? **DNS filtering.**
5. A guest laptop without current antivirus plugs into the office network. What should place it in a remediation VLAN? **NAC with posture assessment.**
