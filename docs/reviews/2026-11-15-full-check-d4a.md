# Full independent check: Security+ d4a cards (2026-11-15)

Part of [the full check plan](../plans/2026-11-15-card-full-check.md). The reviewer did not write or sweep these cards.

**Checked:** `dev/careers/sources/security-plus-sy0-701/cards/d4a-cards.r3.json` (153 cards, objectives 4.0 to 4.5),
`cards/d4a-extras.r2.json` (4 extras), `knowledge/d4a-knowledge.r3.md`.
**Written:** `cards/d4a-cards.r4.json`, `cards/d4a-extras.r3.json`, `knowledge/d4a-knowledge.r4.md`.

## Totals

| | Checked | Correct | Minor | Wrong | Fixed |
|---|---|---|---|---|---|
| Cards | 153 | 152 | 1 | 0 | 1 |
| Extras | 4 | 3 | 1 | 0 | 1 |
| Chapter | 1 | | 1 passage (same fix as card 32) | 0 | 1 |

Same count, order, obj and path as r3 (checked by script). No em or en dashes, no HTML. All text in own words.

## Fixes

### Card 32, Wi-Fi Protected Access 3 (WPA3): MINOR
The card said SAE replaces the WPA2 "pre-shared key exchange" and "the PSK 4-way handshake". SAE replaces how the key
is derived from the passphrase; the 4-way handshake still runs after SAE, using the strong key SAE produced. A learner
could think WPA3 has no 4-way handshake.
- Before (definition): "In personal mode it replaces the WPA2 pre-shared key exchange with Simultaneous Authentication
  of Equals (SAE), which resists offline password guessing and gives forward secrecy"
- After: "In personal mode it no longer turns the passphrase straight into the key: Simultaneous Authentication of
  Equals (SAE) runs first and agrees a fresh, strong key, which resists offline password guessing and gives forward
  secrecy; the usual 4-way handshake then follows."
- Before (key point): "SAE (dragonfly handshake) replaces the PSK 4-way handshake guessing weakness"
- After: "SAE (dragonfly handshake) replaces the WPA2-PSK key derivation, not the 4-way handshake, which still runs
  after it; a captured handshake no longer lets an attacker guess the passphrase offline"
- Chapter 4.1 "Wireless security settings" got the same correction.
- Sources: Vanhoef and Ronen, Dragonblood (SAE negotiates the PMK, then the 4-way handshake derives the session key),
  https://dl.aircrack-ng.org/wiki-files/doc/additional_papers/dragonblood.pdf ; HPE Aruba WPA3-Personal guide,
  https://arubanetworking.hpe.com/techdocs/aos/wifi-design-deploy/security/modes/wpa3-personal/ ; RFC 7664
  (Dragonfly), https://www.rfc-editor.org/rfc/rfc7664

### Extra X0, Protected management frames (PMF, 802.11w): MINOR
The example said laptops ignore "unsigned" frames. PMF protects frames with an integrity check (a MIC, with BIP for
group frames), not a digital signature.
- Before: "the laptops ignore the unsigned frames and stay connected"
- After: "the laptops drop the forged frames because they fail the integrity check and stay connected"
- Source: Cisco 802.11w configuration guide (already cited on the card),
  https://www.cisco.com/c/en/us/support/docs/wireless-mobility/wireless-lan-wlan/212576-configure-802-11w-management-frame-prote.html
  ; Wi-Fi Alliance security page (PMF required for WPA3 and all new certified devices, confirming the rest of the card),
  https://www.wi-fi.org/discover-wi-fi/security

## Claims checked against sources read this session
- Objective structure, item names and the CompTIA acronym expansions (CVE "Enumeration", DMARC "Domain Message
  Authentication...", FIM "File Integrity Management", URL "Universal Resource Locator", COPE, CYOD): the local
  SY0-701 outline and acronym list (vendor files, gitignored). All 153 paths match the outline lines of 4.0 to 4.5.
- NIST SP 800-88 Rev. 2 (cards 51 to 54, extra X1, chapter): published September 2025, supersedes Rev. 1 (2014);
  clear, purge, destroy; IEEE 2883 for techniques; crypto erase may be the only purge for cloud storage; degaussing not
  an approved destroy technique and useless on SSDs; drilling and bending only partly damage; pulverize and shred only
  for the lowest categories as density rises; section 4.6 certificate of sanitization per device, paper or electronic,
  with the listed fields. https://csrc.nist.gov/pubs/sp/800/88/r2/final and
  https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-88r2.pdf
- NIST SP 800-40 Rev. 4 (card 89): exceptions tracked closely; maintenance groups for unpatchable assets rather than
  "exceptions" (sections 3.5.4, 3.5.5). https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-40r4.pdf
- DMARC (card 144, chapter): RFC 9989, May 2026, Standards Track, obsoletes RFC 7489 (and RFC 9091); aggregate
  reporting in RFC 9990, failure reporting in RFC 9991. https://www.rfc-editor.org/rfc/rfc9989.html
- SCAP 1.4 (card 110): final, SP 800-126 Rev. 4 published June 2026, CVSS v4.0 preferred, v3.1 supported.
  https://csrc.nist.gov/projects/security-content-automation-protocol/scap-releases/scap-1-4 and
  https://csrc.nist.gov/pubs/sp/800/126/r4/final
- TACACS+ (card 33): RFC 8907 calls its protection "obfuscation" and says sessions SHOULD use a secure transport.
  https://www.rfc-editor.org/rfc/rfc8907.txt
- CVE (card 78): CISA sponsors, MITRE still operates in 2026 (CISA contract extension and later reporting).
  https://therecord.media/cisa-extends-cve-program-contract-with-mitre and
  https://www.nextgov.com/cybersecurity/2026/08/cisa-cautions-against-rigid-rules-future-cyber-vulnerability-program/415282/
- WPA3 and Wi-Fi 7 (cards 32, 34): PMF required in WPA3 and for new certified devices (Wi-Fi Alliance); Wi-Fi 7 uses
  AKM 24 (SAE-EXT-KEY) with GCMP-256, CCMP-128 kept for compatibility, WPA2 not allowed at 6 GHz (secondary sources
  describing WPA3 spec v3.5; the Wi-Fi Alliance spec itself was not opened, see "Not verified").
- Everything else (ports, SNMP 161/162, RADIUS 1812/1813 and 1645/1646, FTPS 989/990, SMTP 465/587, SPF MAIL FROM and
  HELO, DKIM selector._domainkey, SameSite defaults, CVSS v3.x and v4.0 rating bands and v4.0 metric groups, EF and
  SLE, SELinux modes, Group Policy scope, OWASP primary defenses, NSA encrypted DNS guidance) agrees
  with the standards named on the cards; no conflicting source was found.

## Not verified
- The Wi-Fi Alliance WPA3 specification PDF itself was not opened; the Wi-Fi 7 GCMP-256 and 6 GHz claims rest on
  secondary sources that agree with each other and with the cards.
- PCI DSS v4 requirement 11.5.2 and NIST SP 800-41 ordering advice were checked from knowledge of the documents, not
  re-read this session.

## Per-card verdicts

| # | Obj | Term | Verdict |
|---|---|---|---|
| 0 | 4.0 | SY0-701 Domain 4.0: Security Operations (28%) | CORRECT |
| 1 | 4.1 | SY0-701 4.1: Given a scenario, apply common security techniques to computing resources | CORRECT |
| 2 | 4.1 | Secure baselines | CORRECT |
| 3 | 4.1 | Establish (secure baseline) | CORRECT |
| 4 | 4.1 | Deploy (secure baseline) | CORRECT |
| 5 | 4.1 | Maintain (secure baseline) | CORRECT |
| 6 | 4.1 | Hardening targets | CORRECT |
| 7 | 4.1 | Mobile devices (hardening target) | CORRECT |
| 8 | 4.1 | Workstations (hardening target) | CORRECT |
| 9 | 4.1 | Switches (hardening target) | CORRECT |
| 10 | 4.1 | Routers (hardening target) | CORRECT |
| 11 | 4.1 | Cloud infrastructure (hardening target) | CORRECT |
| 12 | 4.1 | Servers (hardening target) | CORRECT |
| 13 | 4.1 | ICS/SCADA (hardening target) | CORRECT |
| 14 | 4.1 | Embedded systems (hardening target) | CORRECT |
| 15 | 4.1 | RTOS (hardening target) | CORRECT |
| 16 | 4.1 | IoT devices (hardening target) | CORRECT |
| 17 | 4.1 | Wireless devices (secure installation) | CORRECT |
| 18 | 4.1 | Installation considerations (wireless devices) | CORRECT |
| 19 | 4.1 | Site surveys (wireless installation) | CORRECT |
| 20 | 4.1 | Heat maps (wireless installation) | CORRECT |
| 21 | 4.1 | Mobile solutions (securing computing resources) | CORRECT |
| 22 | 4.1 | Mobile device management (MDM) | CORRECT |
| 23 | 4.1 | Deployment models (mobile devices) | CORRECT |
| 24 | 4.1 | Bring your own device (BYOD) | CORRECT |
| 25 | 4.1 | Corporate-owned, personally enabled (COPE) | CORRECT |
| 26 | 4.1 | Choose your own device (CYOD) | CORRECT |
| 27 | 4.1 | Connection methods (mobile devices) | CORRECT |
| 28 | 4.1 | Cellular (mobile connection method) | CORRECT |
| 29 | 4.1 | Wi-Fi (mobile connection method) | CORRECT |
| 30 | 4.1 | Bluetooth (mobile connection method) | CORRECT |
| 31 | 4.1 | Wireless security settings | CORRECT |
| 32 | 4.1 | Wi-Fi Protected Access 3 (WPA3) | MINOR (fixed) |
| 33 | 4.1 | AAA/RADIUS (wireless security setting) | CORRECT |
| 34 | 4.1 | Cryptographic protocols (wireless security setting) | CORRECT |
| 35 | 4.1 | Authentication protocols (wireless security setting) | CORRECT |
| 36 | 4.1 | Application security (computing resource technique) | CORRECT |
| 37 | 4.1 | Input validation | CORRECT |
| 38 | 4.1 | Secure cookies | CORRECT |
| 39 | 4.1 | Static code analysis (application security technique) | CORRECT |
| 40 | 4.1 | Code signing | CORRECT |
| 41 | 4.1 | Sandboxing (computing resource technique) | CORRECT |
| 42 | 4.1 | Monitoring (computing resource technique) | CORRECT |
| 43 | 4.2 | SY0-701 4.2: Explain the security implications of proper hardware, software, and data asset management | CORRECT |
| 44 | 4.2 | Acquisition/procurement process (asset management) | CORRECT |
| 45 | 4.2 | Assignment/accounting (asset management) | CORRECT |
| 46 | 4.2 | Ownership (asset assignment) | CORRECT |
| 47 | 4.2 | Classification (asset assignment) | CORRECT |
| 48 | 4.2 | Monitoring/asset tracking (asset management) | CORRECT |
| 49 | 4.2 | Inventory (asset tracking) | CORRECT |
| 50 | 4.2 | Enumeration (asset tracking) | CORRECT |
| 51 | 4.2 | Disposal/decommissioning (asset management) | CORRECT |
| 52 | 4.2 | Sanitization (media disposal) | CORRECT |
| 53 | 4.2 | Destruction (media disposal) | CORRECT |
| 54 | 4.2 | Certification (media disposal) | CORRECT |
| 55 | 4.2 | Data retention (asset disposal) | CORRECT |
| 56 | 4.3 | SY0-701 4.3: Explain various activities associated with vulnerability management | CORRECT |
| 57 | 4.3 | Identification methods (vulnerability management) | CORRECT |
| 58 | 4.3 | Vulnerability scan (identification method) | CORRECT |
| 59 | 4.3 | Application security (vulnerability identification method) | CORRECT |
| 60 | 4.3 | Static analysis (application security testing) | CORRECT |
| 61 | 4.3 | Dynamic analysis (application security testing) | CORRECT |
| 62 | 4.3 | Package monitoring (application security) | CORRECT |
| 63 | 4.3 | Threat feed (vulnerability identification) | CORRECT |
| 64 | 4.3 | Open-source intelligence (OSINT) (threat feed) | CORRECT |
| 65 | 4.3 | Proprietary/third-party threat feed | CORRECT |
| 66 | 4.3 | Information-sharing organization (threat feed) | CORRECT |
| 67 | 4.3 | Dark web (threat feed) | CORRECT |
| 68 | 4.3 | Penetration testing (vulnerability identification) | CORRECT |
| 69 | 4.3 | Responsible disclosure program | CORRECT |
| 70 | 4.3 | Bug bounty program | CORRECT |
| 71 | 4.3 | System/process audit (vulnerability identification) | CORRECT |
| 72 | 4.3 | Analysis (vulnerability management) | CORRECT |
| 73 | 4.3 | Confirmation (vulnerability analysis) | CORRECT |
| 74 | 4.3 | False positive (vulnerability scan) | CORRECT |
| 75 | 4.3 | False negative (vulnerability scan) | CORRECT |
| 76 | 4.3 | Prioritize (vulnerability analysis) | CORRECT |
| 77 | 4.3 | Common Vulnerability Scoring System (CVSS) | CORRECT |
| 78 | 4.3 | Common Vulnerability Enumeration (CVE) | CORRECT |
| 79 | 4.3 | Vulnerability classification | CORRECT |
| 80 | 4.3 | Exposure factor (vulnerability analysis) | CORRECT |
| 81 | 4.3 | Environmental variables (vulnerability analysis) | CORRECT |
| 82 | 4.3 | Industry/organizational impact (vulnerability analysis) | CORRECT |
| 83 | 4.3 | Risk tolerance (vulnerability analysis) | CORRECT |
| 84 | 4.3 | Vulnerability response and remediation | CORRECT |
| 85 | 4.3 | Patching (vulnerability remediation) | CORRECT |
| 86 | 4.3 | Insurance (vulnerability remediation) | CORRECT |
| 87 | 4.3 | Segmentation (vulnerability remediation) | CORRECT |
| 88 | 4.3 | Compensating controls (vulnerability remediation) | CORRECT |
| 89 | 4.3 | Exceptions and exemptions (vulnerability remediation) | CORRECT |
| 90 | 4.3 | Validation of remediation | CORRECT |
| 91 | 4.3 | Rescanning (validation of remediation) | CORRECT |
| 92 | 4.3 | Audit (validation of remediation) | CORRECT |
| 93 | 4.3 | Verification (validation of remediation) | CORRECT |
| 94 | 4.3 | Reporting (vulnerability management) | CORRECT |
| 95 | 4.4 | SY0-701 4.4: Explain security alerting and monitoring concepts and tools | CORRECT |
| 96 | 4.4 | Monitoring computing resources (alerting and monitoring) | CORRECT |
| 97 | 4.4 | Systems (monitored resource) | CORRECT |
| 98 | 4.4 | Applications (monitored resource) | CORRECT |
| 99 | 4.4 | Infrastructure (monitored resource) | CORRECT |
| 100 | 4.4 | Activities (alerting and monitoring) | CORRECT |
| 101 | 4.4 | Log aggregation | CORRECT |
| 102 | 4.4 | Alerting (monitoring activity) | CORRECT |
| 103 | 4.4 | Scanning (monitoring activity) | CORRECT |
| 104 | 4.4 | Reporting (alerting and monitoring activity) | CORRECT |
| 105 | 4.4 | Archiving (log and monitoring data) | CORRECT |
| 106 | 4.4 | Alert response and remediation/validation | CORRECT |
| 107 | 4.4 | Quarantine (alert response) | CORRECT |
| 108 | 4.4 | Alert tuning | CORRECT |
| 109 | 4.4 | Tools (alerting and monitoring) | CORRECT |
| 110 | 4.4 | Security Content Automation Protocol (SCAP) | CORRECT |
| 111 | 4.4 | Benchmarks (security configuration) | CORRECT |
| 112 | 4.4 | Agents/agentless (monitoring tools) | CORRECT |
| 113 | 4.4 | Security information and event management (SIEM) | CORRECT |
| 114 | 4.4 | Antivirus (monitoring tool) | CORRECT |
| 115 | 4.4 | Data loss prevention (DLP) (monitoring tool) | CORRECT |
| 116 | 4.4 | Simple Network Management Protocol (SNMP) traps | CORRECT |
| 117 | 4.4 | NetFlow | CORRECT |
| 118 | 4.4 | Vulnerability scanners (monitoring tool) | CORRECT |
| 119 | 4.5 | SY0-701 4.5: Given a scenario, modify enterprise capabilities to enhance security | CORRECT |
| 120 | 4.5 | Firewall (enterprise capability) | CORRECT |
| 121 | 4.5 | Rules (firewall) | CORRECT |
| 122 | 4.5 | Access lists (firewall) | CORRECT |
| 123 | 4.5 | Ports/protocols (firewall) | CORRECT |
| 124 | 4.5 | Screened subnets | CORRECT |
| 125 | 4.5 | IDS/IPS (enterprise capability) | CORRECT |
| 126 | 4.5 | Trends (IDS/IPS) | CORRECT |
| 127 | 4.5 | Signatures (IDS/IPS) | CORRECT |
| 128 | 4.5 | Web filter | CORRECT |
| 129 | 4.5 | Agent-based (web filter) | CORRECT |
| 130 | 4.5 | Centralized proxy (web filter) | CORRECT |
| 131 | 4.5 | Universal Resource Locator (URL) scanning (web filter) | CORRECT |
| 132 | 4.5 | Content categorization (web filter) | CORRECT |
| 133 | 4.5 | Block rules (web filter) | CORRECT |
| 134 | 4.5 | Reputation (web filter) | CORRECT |
| 135 | 4.5 | Operating system security (enterprise capability) | CORRECT |
| 136 | 4.5 | Group Policy | CORRECT |
| 137 | 4.5 | SELinux | CORRECT |
| 138 | 4.5 | Implementation of secure protocols | CORRECT |
| 139 | 4.5 | Protocol selection (secure protocols) | CORRECT |
| 140 | 4.5 | Port selection (secure protocols) | CORRECT |
| 141 | 4.5 | Transport method (secure protocols) | CORRECT |
| 142 | 4.5 | DNS filtering | CORRECT |
| 143 | 4.5 | Email security (enterprise capability) | CORRECT |
| 144 | 4.5 | Domain-based Message Authentication Reporting and Conformance (DMARC) | CORRECT |
| 145 | 4.5 | DomainKeys Identified Mail (DKIM) | CORRECT |
| 146 | 4.5 | Sender Policy Framework (SPF) | CORRECT |
| 147 | 4.5 | Gateway (email security) | CORRECT |
| 148 | 4.5 | File integrity monitoring (FIM) | CORRECT |
| 149 | 4.5 | DLP (enterprise capability) | CORRECT |
| 150 | 4.5 | Network access control (NAC) | CORRECT |
| 151 | 4.5 | EDR/XDR | CORRECT |
| 152 | 4.5 | User behavior analytics (UBA) | CORRECT |

## Extras

| # | Obj | Term | Verdict |
|---|---|---|---|
| X0 | 4.1 | Protected management frames (PMF, 802.11w) | MINOR (fixed) |
| X1 | 4.2 | Cryptographic erase (CE) | CORRECT |
| X2 | 4.3 | Credentialed vs non-credentialed scan | CORRECT |
| X3 | 4.5 | Encrypted DNS (DoH and DoT) as a blind spot | CORRECT |
