# d2b knowledge chapter (r7): source notes

Chapter: `knowledge/d2b-knowledge.r7.md` (objectives 2.4 and 2.5). Written 2026-11-15. Every source below was fetched or
searched in the writing session unless marked "search summary" (only the search result summary was read) or "local copy"
(a PDF downloaded in an earlier pass of this course and re-read as text this session).

## Sources

| Key | Title | URL |
|---|---|---|
| CISA-UDP | CISA alert: UDP-based amplification attacks (amplification factors, spoofing, BCP 38) | https://www.cisa.gov/news-events/alerts/2014/01/17/udp-based-amplification-attacks |
| CISA-MIRAI | CISA alert: heightened DDoS threat posed by Mirai and other botnets | https://www.cisa.gov/news-events/alerts/2016/10/14/heightened-ddos-threat-posed-mirai-and-other-botnets |
| CISA-POODLE | CISA alert: SSL 3.0 protocol vulnerability and POODLE attack | https://www.cisa.gov/news-events/alerts/2014/10/17/ssl-30-protocol-vulnerability-and-poodle-attack |
| CISA-RW | CISA #StopRansomware guide | https://www.cisa.gov/stopransomware/ransomware-guide |
| CISA-ED1901 | CISA emergency directive 19-01: mitigate DNS infrastructure tampering | https://www.cisa.gov/news-events/directives/ed-19-01-mitigate-dns-infrastructure-tampering |
| T1486 | MITRE ATT&CK: data encrypted for impact | https://attack.mitre.org/techniques/T1486/ |
| T1014 | MITRE ATT&CK: rootkit | https://attack.mitre.org/techniques/T1014/ |
| T1542.003 | MITRE ATT&CK: bootkit | https://attack.mitre.org/techniques/T1542/003/ |
| T1056.001 | MITRE ATT&CK: keylogging | https://attack.mitre.org/techniques/T1056/001/ |
| T1546.003 | MITRE ATT&CK: WMI event subscription | https://attack.mitre.org/techniques/T1546/003/ |
| T1071 | MITRE ATT&CK: application layer protocol (C2) | https://attack.mitre.org/techniques/T1071/ |
| T1071.004 | MITRE ATT&CK: DNS as application layer protocol | https://attack.mitre.org/techniques/T1071/004/ |
| T1498.002 | MITRE ATT&CK: reflection amplification | https://attack.mitre.org/techniques/T1498/002/ |
| T1499 | MITRE ATT&CK: endpoint denial of service | https://attack.mitre.org/techniques/T1499/ |
| T1557.002 | MITRE ATT&CK: ARP cache poisoning | https://attack.mitre.org/techniques/T1557/002/ |
| T1557.004 | MITRE ATT&CK: evil twin | https://attack.mitre.org/techniques/T1557/004/ |
| T1550.002 | MITRE ATT&CK: pass the hash | https://attack.mitre.org/techniques/T1550/002/ |
| T1055.001 | MITRE ATT&CK: DLL injection | https://attack.mitre.org/techniques/T1055/001/ |
| T1068 | MITRE ATT&CK: exploitation for privilege escalation | https://attack.mitre.org/techniques/T1068/ |
| T1110.002 | MITRE ATT&CK: password cracking | https://attack.mitre.org/techniques/T1110/002/ |
| T1110.003 | MITRE ATT&CK: password spraying | https://attack.mitre.org/techniques/T1110/003/ |
| T1110.004 | MITRE ATT&CK: credential stuffing | https://attack.mitre.org/techniques/T1110/004/ |
| T1496 | MITRE ATT&CK: resource hijacking | https://attack.mitre.org/techniques/T1496/ |
| CWE-22 | MITRE CWE-22: path traversal | https://cwe.mitre.org/data/definitions/22.html |
| OWASP-SQLI | OWASP SQL injection prevention cheat sheet | https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html |
| OWASP-CSRF | OWASP CSRF prevention cheat sheet | https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html |
| OWASP-SSRF | OWASP SSRF prevention cheat sheet | https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html |
| OWASP-SESS | OWASP session management cheat sheet | https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html |
| RFC7507 | RFC 7507: TLS fallback SCSV | https://www.rfc-editor.org/rfc/rfc7507.html |
| RFC6797 | RFC 6797: HTTP Strict Transport Security | https://www.rfc-editor.org/rfc/rfc6797.html |
| RFC8996 | RFC 8996: deprecating TLS 1.0 and TLS 1.1 | https://www.rfc-editor.org/rfc/rfc8996.html |
| RFC4033 | RFC 4033: DNS security introduction and requirements | https://www.rfc-editor.org/rfc/rfc4033.html |
| SHATTERED | SHAttered: first practical SHA-1 collision | https://shattered.io/ |
| NIST-HASH | NIST hash functions project page (collision strength is half the output length) | https://csrc.nist.gov/projects/hash-functions |
| MD5-CA | 2008 rogue CA certificate from an MD5 collision (search summary of the researchers' page) | https://marc-stevens.nl/research/hashclash/rogue-ca/ |
| SP800-63B | NIST SP 800-63B-4: authentication (rate limiting, blocklists, salted hashing) | https://pages.nist.gov/800-63-4/sp800-63b.html |
| SP800-53 | NIST SP 800-53 Rev. 5 catalog (AC-6, AC-7, AC-10, CM-7, SI-4), local copy of the OSCAL JSON | https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final |
| SP800-167 | NIST SP 800-167: guide to application whitelisting (PDF text read) | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-167.pdf |
| SP800-40 | NIST SP 800-40 Rev. 4: enterprise patch management planning (PDF text read) | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-40r4.pdf |
| SP800-88 | NIST SP 800-88 Rev. 2: media sanitization (PDF text read) and glossary entries clear, purge, destroy | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-88r2.pdf |
| SP800-94 | NIST SP 800-94: intrusion detection and prevention systems (PDF text read) | https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-94.pdf |
| SP800-83 | NIST SP 800-83 Rev. 1: malware incident prevention and handling (local copy) | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-83r1.pdf |
| SP800-123 | NIST SP 800-123: general server security (local copy) | https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-123.pdf |
| SP800-41 | NIST SP 800-41 Rev. 1: firewalls and firewall policy (local copy) | https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-41r1.pdf |
| SP800-92 | NIST SP 800-92: log management (local copy) | https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-92.pdf |
| SP800-128 | NIST SP 800-128: security-focused configuration management (local copy) | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-128.pdf |
| SP800-137 | NIST SP 800-137: continuous monitoring (abstract page) | https://csrc.nist.gov/pubs/sp/800/137/final |
| NIST-GL | NIST glossary: worm, virus, Trojan horse, logic bomb, spyware, replay attack, least privilege, access control list, sandbox, baseline configuration, air gap, indicator, network access control | https://csrc.nist.gov/glossary |
| MS-1102 | Microsoft Learn: event 1102, the audit log was cleared | https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-1102 |
| MS-RISK | Microsoft Learn: Entra ID Protection risk detections (impossible travel, atypical travel, anomalous token, password spray) | https://learn.microsoft.com/en-us/entra/id-protection/concept-identity-protection-risks |
| MS-FW | Microsoft Learn: Windows Firewall overview | https://learn.microsoft.com/en-us/windows/security/operating-system-security/network-security/windows-firewall/ |
| MS-EDR | Microsoft Learn: endpoint detection and response overview | https://learn.microsoft.com/en-us/defender-endpoint/overview-endpoint-detection-response |
| MS-BL | Microsoft Learn: BitLocker overview | https://learn.microsoft.com/en-us/windows/security/operating-system-security/data-protection/bitlocker/ |
| CISCO-ACL | Cisco: configure and filter IP access lists | https://www.cisco.com/c/en/us/support/docs/security/ios-firewall/23602-confaccesslists.html |
| WFA | Wi-Fi Alliance: security (WPA3, protected management frames) | https://www.wi-fi.org/discover-wi-fi/security |
| PMF | 802.11w protected management frames (search summary: vendor documentation) | https://arubanetworking.hpe.com/techdocs/aos/wifi-design-deploy/security/features/pmf/ |
| CIS | CIS Benchmarks overview | https://www.cisecurity.org/cis-benchmarks |
| DOE-BLDG | US Department of Energy: challenges and opportunities to secure buildings from cyber threats (PDF text read) | https://www.energy.gov/eere/buildings/articles/challenges-and-opportunities-secure-buildings-cyber-threats |
| ICT-PROX | ICT: the 125 kHz proximity card dilemma (vendor page) | https://ict.co/blog/the-125khz-proximity-card-dilemma |
| DARKSEOUL | Cisco blog on the March 2013 South Korea wiper attack (trigger time, targets) | https://blogs.cisco.com/security/thoughts-on-darkseoul-data-sharing-and-targeted-attackers |
| BA-ICO | British Airways 2018 breach, ICO findings (search summary: users diverted to a fraudulent site) | https://natlawreview.com/article/ico-fines-british-airways-20-million-security-breach |
| PCI-SEG | PCI SSC guidance on scoping and segmentation (search summary) | https://listings.pcisecuritystandards.org/documents/Guidance-PCI-DSS-Scoping-and-Segmentation_v1_1.pdf |
| CARDS | Reviewed course cards: cards/d2-cards.r4.json (2.4, 2.5) and cards/d2-extras.r5.json | local |

## Sources per section

2.4
- Ransomware: T1486, CISA-RW, CARDS
- Trojan and remote access Trojan: NIST-GL, SP800-83, CARDS
- Worm: NIST-GL, SP800-83, CARDS (WannaCry and SMB from the card)
- Virus: NIST-GL, SP800-83, CARDS
- Fileless malware: T1546.003, MS-EDR, CARDS
- Spyware: NIST-GL, CARDS
- Keylogger: T1056.001, SP800-83, CARDS
- Logic bomb: NIST-GL, DARKSEOUL, CARDS
- Rootkit and bootkit: T1014, T1542.003, T1068, SP800-83, MS-BL
- Bloatware: CARDS, SP800-123
- Botnet and C2 beaconing: T1071, T1071.004, CISA-MIRAI, CARDS
- Malware comparison: the sections above
- Physical brute force: CARDS
- RFID badge cloning: ICT-PROX, CARDS
- Environmental attacks: DOE-BLDG, CARDS
- DoS and DDoS: T1499, T1498.002, CARDS
- Reflected and amplified DDoS; DoS vs DDoS comparison: CISA-UDP, T1498.002
- DNS attacks: CISA-ED1901, T1071.004, RFC4033, CISA-UDP, CARDS
- Wireless attacks: T1557.004, WFA, PMF, CARDS
- On-path attack: T1557.002, RFC6797, MS-RISK, CARDS
- Credential replay: T1550.002, MS-RISK, CARDS
- Malicious code over the network: SP800-83, BA-ICO, CARDS
- Injection attacks: OWASP-SQLI, T1055.001, CARDS
- Buffer overflow attack indicators: CARDS, T1068, T1499
- Replay attack and session hijacking: NIST-GL, OWASP-SESS, MS-RISK, CARDS
- Privilege escalation: T1068, CARDS
- Request forgery (CSRF, SSRF): OWASP-CSRF, OWASP-SSRF
- Directory traversal: CWE-22, CARDS
- Downgrade attack: RFC7507, RFC8996, RFC6797, CISA-POODLE
- Hash collision attack: SHATTERED, MD5-CA, NIST-HASH, CARDS
- Birthday attack; cryptographic comparison: NIST-HASH, CARDS (23 people and 2^32 are arithmetic checked by hand)
- Password spraying: T1110.003, MS-RISK
- Brute force password attack: T1110.002, SP800-63B
- Dictionary, rainbow table, credential stuffing; password comparison: T1110.002, T1110.004, SP800-63B, CARDS
- Indicators of compromise: NIST-GL, SP800-94, CARDS
- Account lockout: SP800-53 (AC-7), SP800-63B, T1110.003, CARDS
- Concurrent session usage: SP800-53 (AC-10), CARDS
- Impossible travel: MS-RISK
- Blocked content: T1071, CARDS
- Resource consumption: T1496, T1499, CARDS
- Resource inaccessibility: T1486, CISA-RW, CARDS
- Out-of-cycle logging: CARDS
- Missing logs: MS-1102, SP800-92, CARDS
- Published or documented: MS-RISK (leaked credentials), CISA-RW, CARDS
- Indicator comparisons, decision path, interception and web comparisons: the sections above

2.5
- Segmentation: SP800-40 (isolating vulnerable assets), DOE-BLDG, PCI-SEG, CARDS
- Access control list: NIST-GL, CISCO-ACL, SP800-41
- Permissions: NIST-GL, CARDS
- Application allow list; allow vs deny comparison: SP800-167
- Isolation; separation comparison: NIST-GL (sandbox, air gap), MS-EDR, SP800-40, SP800-83
- Patching: SP800-40
- Encryption as an enterprise mitigation: MS-BL, CARDS
- Monitoring: SP800-137, SP800-94, SP800-92, SP800-53 (SI-4)
- Least privilege: NIST-GL, SP800-53 (AC-6, CM-7)
- Configuration enforcement: NIST-GL (baseline configuration, NAC), SP800-128, CIS
- Decommissioning: SP800-88, NIST-GL, SP800-40
- Hardening overview: SP800-123, CIS
- Encryption as a hardening step: MS-BL
- Endpoint protection: MS-EDR, SP800-83
- Host-based firewall: MS-FW, SP800-41
- HIPS; host defense comparison: SP800-94, SP800-83
- Disabling ports and protocols: SP800-123, DOE-BLDG, SP800-53 (CM-7)
- Default password changes: CISA-MIRAI, DOE-BLDG
- Removal of unnecessary software: SP800-123, CARDS
- Upkeep comparison, decision path: the sections above

## Facts carried from the reviewed cards, not re-read on a primary page this session

- WannaCry (2017) spreading through an SMB flaw (card; CISA source in the earlier d2 sweep).
- DEP and ASLR as overflow protections; hardware keyloggers as USB adapters; SYSTEM-level service flaws (cards).
- 23 people and about 50% (birthday), 64-bit hash and about 2^32 (card; arithmetic).
- The 2008 MD5 forged certificate and the 2018 airline case rest on search summaries, not a fetched primary page.
- 802.11w details rest on a search summary of vendor documentation plus the Wi-Fi Alliance page.
- The boosted-antenna badge read and "cheap handheld cloners" rest on a vendor page and a search summary.

## Cards that look wrong or that the chapter words differently

- **Radio frequency identification (RFID) cloning** (d2-cards.r4): key point "cloners ... sell for roughly $10 to $60". Not
  wrong, but the only sources are vendor pages (one says $30, another under $20). The chapter says "cheap handheld
  cloners are widely sold" and gives no price.
- **Logic bomb** (d2-cards.r4): "taking ATMs offline" in the 2013 South Korea case. The page read this session confirms the
  set time (14:00 local, March 20, 2013), three media organizations and four banks, and destroyed drives, but does not
  mention ATMs. The chapter leaves ATMs out. Not a contradiction; the ATM detail needs its own source.
- **Downgrade** (d2-cards.r4): "disable ... every SSL version, plus TLS 1.0 and 1.1, which RFC 8996 deprecated in 2021" is
  right. Note for reviewers: RFC 8996 itself deprecates only TLS 1.0, TLS 1.1 and DTLS 1.0; SSL 3.0 was deprecated by
  RFC 7568. The chapter words it that way.
- **Account lockout** (d2-cards.r4): fine. The chapter adds that NIST caps consecutive failures at no more than 100
  (SP 800-63B-4) and that spraying and stuffing are built to avoid lockout, consistent with the card.
- **Monitoring** (d2-cards.r4): key point lists "IDS/IPS" under monitoring tools while calling monitoring "detective, not
  preventive". An IPS also prevents; the chapter says monitoring detects and names IPS and EDR blocking as prevention.
- **Virus** (d2-cards.r4): lists "fileless viruses" as a virus type. The chapter keeps fileless malware as its own
  section (it does not attach to host files) and notes it is often listed beside viruses, so the two do not conflict.
- No card in 2.4 or 2.5 was found to state a false fact.
