# d4a knowledge chapter r7: source notes

Chapter: `knowledge/d4a-knowledge.r7.md` (objectives 4.1 to 4.5). Every source below was read in this writing session (web fetch, or the PDF or RFC text downloaded and searched). Wording in the chapter is our own.

## Sources

| Key | Title | URL |
|---|---|---|
| CARDS | Course cards d4a-cards.r4.json and d4a-extras.r6.json (reviewed; read in full) | local: cards/ |
| R4 | Earlier pass d4a-knowledge.r4.md and reviews/d4a-sweeps.md | local: knowledge/, reviews/ |
| WFA | Wi-Fi Alliance: Security (WPA3, PMF, Enhanced Open) | https://www.wi-fi.org/discover-wi-fi/security |
| CISCOWPA3 | Cisco WPA3 deployment guide (SAE, PMF, transition mode, 6 GHz, Wi-Fi 7, OWE) | https://www.cisco.com/c/en/us/products/collateral/wireless/catalyst-9100ax-access-points/wpa3-dep-guide-og.html |
| RFC2865 | RFC 2865 RADIUS | https://www.rfc-editor.org/rfc/rfc2865 |
| RFC8907 | RFC 8907 TACACS+ | https://www.rfc-editor.org/rfc/rfc8907 |
| RFC5216 | RFC 5216 EAP-TLS (and Microsoft Learn certificate requirements for PEAP and EAP, via search) | https://www.rfc-editor.org/rfc/rfc5216 |
| RFC5281 | RFC 5281 EAP-TTLS | https://www.rfc-editor.org/rfc/rfc5281 |
| RFC4851 | RFC 4851 EAP-FAST | https://www.rfc-editor.org/rfc/rfc4851 |
| OWASPIV | OWASP Input Validation Cheat Sheet | https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html |
| MDNCOOK | MDN: Using HTTP cookies | https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies |
| OWASPSAST | OWASP: Source Code Analysis Tools | https://community.owasp.org/Source_Code_Analysis_Tools |
| OWASPDAST | OWASP DevSecOps Guideline: Dynamic Application Security Testing | https://owasp.github.io/www-project-devsecops-guideline/latest/02b-Dynamic-Application-Security-Testing |
| OWASPFUZZ | OWASP: Fuzzing | https://community.owasp.org/Fuzzing |
| SSDF | NIST SP 800-218 Secure Software Development Framework | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-218.pdf |
| CODESIGN | NIST white paper: Security Considerations for Code Signing | https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.01262018.pdf |
| GLOSS | NIST CSRC glossary: baseline configuration, sandbox, compensating controls, DMZ, NAC, SIEM tool, DLP, information owner | https://csrc.nist.gov/glossary |
| SP128 | NIST SP 800-128 Security-Focused Configuration Management | https://csrc.nist.gov/pubs/sp/800/128/upd1/final |
| SP70 | NIST SP 800-70 Rev. 4 National Checklist Program | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-70r4.pdf |
| CIS | CIS Benchmarks overview; CIS Control 1 overview | https://www.cisecurity.org/cis-benchmarks |
| SP124 | NIST SP 800-124 Rev. 2 Managing the Security of Mobile Devices | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-124r2.pdf |
| SP121 | NIST SP 800-121 Rev. 2 Guide to Bluetooth Security | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-121r2-upd1.pdf |
| SP153 | NIST SP 800-153 Guidelines for Securing WLANs | https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-153.pdf |
| SURVEY | Web search summary on wireless site survey types and heat maps (vendor and encyclopedia pages; secondary) | search: wireless site survey passive active predictive heat map |
| SP82 | NIST SP 800-82 Rev. 3 Guide to OT Security | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-82r3.pdf |
| SP213 | NIST SP 800-213 IoT Device Cybersecurity Guidance | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-213.pdf |
| MIRAI | CISA alert: Heightened DDoS threat posed by Mirai and other botnets | https://www.cisa.gov/news-events/alerts/2016/10/14/heightened-ddos-threat-posed-mirai-and-other-botnets |
| LTE | USENIX WOOT 2016: LTE network can enforce no encryption (abstract) | https://www.usenix.org/conference/woot16/workshop-program/presentation/rupprecht |
| SP88 | NIST SP 800-88 Rev. 2 Guidelines for Media Sanitization (sections 3.1, 3.2, 4.4 to 4.6) | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-88r2.pdf |
| SP161 | NIST SP 800-161 Rev. 1 Cybersecurity Supply Chain Risk Management | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-161r1-upd1.pdf |
| SP1800_5 | NIST SP 1800-5 IT Asset Management | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.1800-5.pdf |
| HOLD | Web search summary on legal holds and retention schedules (university policies, e-discovery guides; secondary) | search: legal hold preservation duty retention schedule |
| SP92 | NIST SP 800-92 Guide to Computer Security Log Management | https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-92.pdf |
| SP40 | NIST SP 800-40 Rev. 4 Enterprise Patch Management Planning | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-40r4.pdf |
| SP115 | NIST SP 800-115 Technical Guide to Information Security Testing and Assessment | https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-115.pdf |
| CVSS4 | FIRST CVSS v4.0 specification | https://www.first.org/cvss/v4.0/specification-document |
| CVEOLD | CVE Program (archived site page: operator, sponsor, CNAs) | https://www.cve.org/Resources/Media/Archives/OldWebsite/index.html |
| NVDAPI | NVD API records for CVE-2021-44228 and CVE-2024-6387 (scores, vectors) | https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=CVE-2021-44228 |
| CWE | MITRE CWE: About | https://cwe.mitre.org/about/index.html |
| KEV | CISA Known Exploited Vulnerabilities catalog | https://www.cisa.gov/known-exploited-vulnerabilities-catalog |
| EPSS | FIRST EPSS | https://www.first.org/epss/ |
| SBOM | CISA: Software Bill of Materials | https://www.cisa.gov/sbom |
| STIX | OASIS CTI documentation: STIX and TAXII | https://oasis-open.github.io/cti-documentation/ |
| ISAC | National Council of ISACs: About ISACs | https://www.nationalisacs.org/about-isacs |
| TOR | Tor Project: onion services overview | https://community.torproject.org/onion-services/overview/ |
| CVD | CISA Coordinated Vulnerability Disclosure process | https://www.cisa.gov/coordinated-vulnerability-disclosure-process |
| RFC9116 | RFC 9116 security.txt | https://www.rfc-editor.org/rfc/rfc9116 |
| RISKQ | Web search summary on SLE, EF, ARO, ALE formulas (secondary; matches course cards) | search: exposure factor single loss expectancy |
| SCAP | NIST SCAP project page and SCAP 1.4 release page; SP 800-126 Rev. 3 | https://csrc.nist.gov/projects/security-content-automation-protocol |
| SP83 | NIST SP 800-83 Rev. 1 Malware Incident Prevention and Handling | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-83r1.pdf |
| RFC3411 | RFC 3411 SNMP architecture (security levels); IANA port registry (161, 162, 853, 1813) | https://www.rfc-editor.org/rfc/rfc3411 |
| RFC3954 | RFC 3954 NetFlow v9; RFC 7011 IPFIX | https://www.rfc-editor.org/rfc/rfc3954 |
| SP41 | NIST SP 800-41 Rev. 1 Guidelines on Firewalls and Firewall Policy | https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-41r1.pdf |
| SP94 | NIST SP 800-94 Guide to Intrusion Detection and Prevention Systems | https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-94.pdf |
| MSWCF | Microsoft Learn: Web content filtering in Defender for Endpoint | https://learn.microsoft.com/en-us/defender-endpoint/web-content-filtering |
| MSGP | Microsoft Learn: Group Policy overview; Group Policy processing | https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/group-policy/group-policy-processing |
| SELINUX | selinux(8) manual page | https://man7.org/linux/man-pages/man8/selinux.8.html |
| RFC8314 | RFC 8314 Cleartext considered obsolete: TLS for email submission and access | https://www.rfc-editor.org/rfc/rfc8314 |
| PDNS | CISA Protective DNS Resolver service | https://www.cisa.gov/resources-tools/services/protective-domain-name-system-resolver |
| NSADOH | NSA: Adopting Encrypted DNS in Enterprise Environments (January 2021) | https://cryptoid.com.br/wp-content/uploads/2021/02/CSI_ADOPTING_ENCRYPTED_DNS_U_OO_102904_21.pdf |
| RFC7208 | RFC 7208 SPF | https://www.rfc-editor.org/rfc/rfc7208 |
| RFC6376 | RFC 6376 DKIM | https://www.rfc-editor.org/rfc/rfc6376 |
| RFC9989 | RFC 9989 DMARC (May 2026) | https://www.rfc-editor.org/rfc/rfc9989 |
| SP177 | NIST SP 800-177 Rev. 1 Trustworthy Email | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-177r1.pdf |
| SMIME | RFC 8551 S/MIME 4.0; RFC 9580 OpenPGP (abstracts) | https://www.rfc-editor.org/rfc/rfc8551 |
| PCIFIM | Wazuh documentation: PCI DSS 11.5.2 and file integrity monitoring | https://documentation.wazuh.com/current/compliance/pci-dss/file-integrity-monitoring.html |
| FIMTOOLS | Microsoft Learn: sfc command; Open Source Tripwire readme | https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/sfc |
| MSDLP | Microsoft Learn: Learn about data loss prevention | https://learn.microsoft.com/en-us/purview/dlp-learn-about-dlp |
| MSEDR | Microsoft Learn: EDR capabilities overview; What is Microsoft Defender XDR | https://learn.microsoft.com/en-us/defender-endpoint/overview-endpoint-detection-response |
| MSUEBA | Microsoft Learn: UEBA in Microsoft Sentinel | https://learn.microsoft.com/en-us/azure/sentinel/identify-threats-with-entity-behavior-analytics |
| ATTACK | MITRE ATT&CK T1497 Virtualization/Sandbox Evasion | https://attack.mitre.org/techniques/T1497/ |

## Sources per section

| Section | Source keys |
|---|---|
| Secure baseline life cycle (establish, deploy, maintain) | GLOSS SP128 SP70 CIS |
| Hardening workstations and servers | CARDS R4 |
| Hardening switches and routers (network infrastructure devices) | CARDS RFC3411 SP41 |
| Hardening cloud infrastructure | CARDS R4 |
| Hardening mobile devices (hardening target) | SP124 CARDS |
| Hardening ICS/SCADA (industrial control systems) | SP82 SP40 CARDS |
| Hardening embedded systems, RTOS and IoT devices | MIRAI SP213 CARDS |
| Hardening targets compared (workstations, servers, network devices, cloud, ICS, embedded, RTOS, IoT) | CARDS R4 |
| Choosing a computing-resource technique (decision path) | CARDS (routes to the sections below) |
| Wireless site surveys (installation considerations) | SP153 SURVEY CARDS |
| Wireless heat maps | SURVEY CARDS |
| Mobile device management (MDM) | SP124 CARDS |
| Mobile deployment models: BYOD vs COPE vs CYOD | SP124 CARDS |
| Mobile connection methods: cellular and Wi-Fi | LTE SP153 CARDS |
| Bluetooth (mobile connection method) | SP121 CARDS |
| Wi-Fi Protected Access 3 (WPA3) | WFA CISCOWPA3 CARDS |
| Protected management frames (PMF, IEEE 802.11w) | WFA CISCOWPA3 CARDS |
| AAA and RADIUS in enterprise Wi-Fi | RFC2865 RFC3411 CARDS |
| RADIUS vs TACACS+ for Wi-Fi access and device administration | RFC2865 RFC8907 CARDS |
| Wireless cryptographic protocols (CCMP, GCMP, legacy WEP and TKIP) | CISCOWPA3 WFA CARDS |
| Wireless authentication protocols (IEEE 802.1X and EAP methods) | RFC5216 RFC5281 RFC4851 CARDS |
| EAP-TLS vs PEAP vs EAP-TTLS vs EAP-FAST (wireless EAP methods compared) | RFC5216 RFC5281 RFC4851 |
| Choosing wireless security settings (decision path) | CISCOWPA3 WFA CARDS |
| Input validation | OWASPIV CARDS |
| Secure cookies (Secure, HttpOnly and SameSite attributes) | MDNCOOK CARDS |
| Static code analysis (static application security testing, SAST) | OWASPSAST SSDF CARDS |
| Code signing | CODESIGN CARDS |
| Sandboxing | GLOSS ATTACK CARDS |
| Acquisition and procurement process (secure purchasing) | SP161 SBOM CARDS |
| Asset ownership and classification (assignment and accounting) | GLOSS CARDS |
| Asset inventory (asset tracking) | CIS SP1800_5 CARDS |
| Asset enumeration (active discovery) | CIS CARDS |
| Asset inventory vs enumeration vs vulnerability scanning | CIS SP115 CARDS |
| Disposal and decommissioning (secure asset retirement) | SP88 HOLD CARDS |
| Sanitization of media (clear and purge) | SP88 CARDS |
| Cryptographic erase (CE) | SP88 CARDS |
| Destruction of storage media | SP88 CARDS |
| Certification of sanitization and destruction | SP88 CARDS |
| Data retention at disposal (retention periods and legal holds) | HOLD SP92 CARDS |
| Clear vs purge vs destroy (media sanitization methods compared) | SP88 |
| Vulnerability management life cycle (identify, analyze, respond, validate, report) | SP40 CARDS |
| Vulnerability scan (identification method) | SP115 NVDAPI CARDS |
| Credentialed vs non-credentialed vulnerability scans | SP115 CARDS |
| Dynamic analysis (DAST) and fuzzing | OWASPDAST OWASPFUZZ CARDS |
| Package monitoring (software composition analysis and SBOM) | SBOM NVDAPI CARDS |
| SAST vs DAST vs package monitoring (application security testing compared) | OWASPSAST OWASPDAST OWASPFUZZ SBOM |
| Threat feeds (threat intelligence feeds, STIX and TAXII) | STIX CARDS |
| Open-source intelligence (OSINT) threat feeds | KEV CVD CARDS |
| Proprietary and information-sharing threat feeds (ISACs) | ISAC STIX CARDS |
| Dark web monitoring (threat feed) | TOR CARDS |
| OSINT vs proprietary vs ISAC vs dark web threat feeds | ISAC TOR KEV CARDS |
| Penetration testing as vulnerability identification | SP115 CARDS |
| Vulnerability scan vs penetration test vs system/process audit | SP115 CARDS |
| Responsible disclosure program (coordinated vulnerability disclosure) | CVD RFC9116 CARDS |
| Bug bounty program | CARDS CVD |
| System and process audit (vulnerability identification) | CARDS R4 |
| Confirmation of findings: false positives and false negatives | SP94 SP115 CARDS |
| Common Vulnerabilities and Exposures (CVE identifiers) | CVEOLD NVDAPI KEV CARDS |
| Common Vulnerability Scoring System (CVSS) | CVSS4 NVDAPI CARDS |
| CVE vs CVSS vs CWE (identifier, score, weakness type) | CVEOLD CVSS4 CWE NVDAPI |
| Prioritizing vulnerabilities (severity, exploitation, exposure, asset value) | KEV EPSS SP40 CVSS4 CARDS |
| Vulnerability classification | CWE CARDS |
| Exposure factor (EF) in vulnerability analysis | RISKQ CARDS |
| Environmental variables, organizational impact and risk tolerance | CVSS4 CARDS |
| Patching (vulnerability remediation) | SP40 CARDS |
| Segmentation and compensating controls (vulnerability response) | GLOSS SP40 CARDS |
| Cybersecurity insurance (vulnerability response) | SP40 CARDS |
| Exceptions and exemptions (vulnerability response) | SP40 CARDS |
| Patching vs segmentation vs compensating controls vs insurance vs exceptions | SP40 CARDS |
| Validation of remediation (rescanning, audit, verification) | SP40 CARDS |
| Vulnerability reporting | SP40 CARDS |
| Monitoring computing resources (systems, applications, infrastructure) | SP92 CARDS |
| Log aggregation | SP92 CARDS |
| Alerting and alert tuning | SP94 CARDS |
| Scanning, reporting and archiving (monitoring activities) | SP92 CARDS |
| Quarantine (alert response) | SP83 SP41 CARDS |
| Security Content Automation Protocol (SCAP) | SCAP CARDS |
| Security benchmarks (CIS Benchmarks and DISA STIGs) | SP70 CIS SCAP CARDS |
| Agent-based vs agentless monitoring | CARDS R4 |
| Security information and event management (SIEM) | GLOSS SP92 CARDS |
| Antivirus (monitoring tool) | SP83 CARDS |
| Data loss prevention (DLP) as a monitoring tool | GLOSS MSDLP CARDS |
| Simple Network Management Protocol (SNMP) traps | RFC3411 CARDS |
| NetFlow (and IPFIX flow records) | RFC3954 CARDS |
| Vulnerability scanners (monitoring tool) | SP115 SCAP CARDS |
| SIEM vs NetFlow vs SNMP traps vs syslog (monitoring data sources compared) | SP92 RFC3411 RFC3954 |
| Antivirus vs EDR vs XDR vs SIEM vs DLP (detection tools compared) | SP83 MSEDR MSDLP GLOSS |
| Firewall rules (rule order, first match and implicit deny) | SP41 CARDS |
| Access control lists (ACLs) on firewalls and routers | SP41 CARDS |
| Ports and protocols in firewall policy | SP41 CARDS |
| Screened subnet (formerly DMZ) | GLOSS SP41 CARDS |
| IDS and IPS (intrusion detection and prevention systems) | SP94 SP83 CARDS |
| IDS/IPS signatures and trends | SP94 SP83 CARDS |
| Signature-based vs anomaly-based (behavior-based) detection | SP94 |
| Web filter deployment: agent-based vs centralized proxy | MSWCF CARDS |
| Web filter techniques: URL scanning, categorization, block rules, reputation | MSWCF CARDS |
| Group Policy (Windows operating system security) | MSGP CARDS |
| SELinux (Security-Enhanced Linux) | SELINUX CARDS |
| Implementing secure protocols (protocol, port and transport selection) | RFC8314 CARDS |
| DNS filtering | PDNS NSADOH CARDS |
| Encrypted DNS (DoH and DoT) as a monitoring blind spot | NSADOH RFC3411 CARDS |
| Sender Policy Framework (SPF) | RFC7208 CARDS |
| DomainKeys Identified Mail (DKIM) | RFC6376 CARDS |
| DMARC (Domain-based Message Authentication, Reporting and Conformance) | RFC9989 SP177 CARDS |
| SPF vs DKIM vs DMARC (email authentication compared) | RFC7208 RFC6376 RFC9989 |
| Email gateway (secure email gateway) | CARDS SP177 R4 |
| Email encryption: S/MIME and PGP (end-to-end message protection) | SMIME SP177 CARDS |
| File integrity monitoring (FIM) | PCIFIM FIMTOOLS CARDS |
| DLP policy configuration (enterprise capability) | MSDLP CARDS |
| Network access control (NAC) | SP41 GLOSS CARDS |
| Endpoint detection and response (EDR) and extended detection and response (XDR) | MSEDR CARDS |
| User behavior analytics (UBA and UEBA) | MSUEBA CARDS |
| Choosing an enterprise capability to modify (decision path) | CARDS (routes to the sections above) |

## Cards to look at (chapter text kept consistent with the exam meaning; nothing in the chapter contradicts a card)

| Card | Note | Source |
|---|---|---|
| 4.1 Choose your own device (CYOD); 4.1 Deployment models | Cards say the company buys and owns a CYOD device. NIST SP 800-124 Rev. 2 section 5.1.3.3 describes CYOD as bought by the employee from an enterprise list, with ownership status "Employee". The chapter teaches the exam meaning (company owned) and states the NIST difference in one sentence, telling Ebi to follow the question if it says who pays. Suggest adding that nuance to the card key points, not changing the answer. | SP124 |
| 4.5 Rules (firewall) | Card and chapter agree. Note only: "first match wins" is the typical behavior; NIST SP 800-41 says rule handling varies by product. Already in the card. | SP41 |
| 4.1 AAA/RADIUS | Card says TACACS+ "encrypts the whole message body (RFC 8907 calls this obfuscation)". Consistent; the chapter stresses RFC 8907's statement that this is not real encryption. | RFC8907 |
| 4.1 WPA3 | Card says "study guides teach WPA3 uses GCMP, so pick GCMP". Kept in the chapter as an exam cue next to the exact rule (CCMP-128 minimum for WPA3-Personal before Wi-Fi 7; GCMP-256 for the 192-bit mode and Wi-Fi 7). | CISCOWPA3 |

No card was found to be factually wrong.

## Facts carried from the reviewed cards without a fresh primary source this session

These are in the chapter because the reviewed cards state them and no source read this session contradicts them; a reviewer may want a primary source for each:
- Expansions of CCMP, GCMP, TKIP and WEP, and "TKIP was a temporary fix for WEP" (cards 4.1 cryptographic protocols).
- SIM swapping and fake base stations as cellular threats (card 4.1 Cellular).
- Evil twin, rogue access point and on-path risks on public Wi-Fi (card 4.1 Wi-Fi); SP 800-153 was read for rogue access points only.
- Persistent and dissolvable NAC agents (cards 4.4 Agents/agentless, 4.5 NAC); SP 800-41 was read for NAC health checks and limited access only.
- Explicit vs transparent proxy; TLS decryption at a proxy (card 4.5 Centralized proxy).
- EDR rollback of changes (card 4.5 EDR/XDR); Microsoft Learn was read for telemetry, isolation, stop and quarantine.
- S/MIME uses CA-issued certificates and PGP a web of trust (extras card 4.5); RFC 8551 and RFC 9580 abstracts were read for what each provides.
- Known, partially known and unknown environment test types (card 4.3 Penetration testing).
- The name "Log4Shell" for CVE-2021-44228 (NVD record read for product, score and vector).
- Typosquatting as a package-source risk in the package monitoring section (general knowledge, no source read).
- The CompTIA acronym-list spellings for CVE, FIM and DMARC (cards).

## Checks run on the chapter

- 113 `###` sections; largest 3,195 characters, smallest 1,720; none over 4,000 or under 1,500.
- No duplicate headings inside the chapter or against the other r7 chapters present on 2026-11-16 (one clash with d1 renamed); every heading at most 110 characters; cross-references in backticks resolve to headings in this chapter.
- No em or en dashes, no HTML tags, no links, ASCII only.
- No run of 8 or more words shared with outline.md (own script), and `dev/careers/verbatim.mjs` finds no 12-word run.
- Acronym first-use check per section for 90 acronyms (script); remaining flags are the SCAP component list, expanded in bold list items.
- Not checked here: 8-word overlap against the source pages themselves (paraphrased by hand; no automated comparison was run).
