# Full independent check: Security+ domain 2 cards (2026-11-15)

Part of [the card full check plan](../plans/2026-11-15-card-full-check.md). The reviewer did not write or sweep these cards.

**Checked:** `dev/careers/sources/security-plus-sy0-701/cards/d2-cards.r3.json` (156 cards), `d2-extras.r2.json` (5 extra cards) and `knowledge/d2-knowledge.r3.md` (the chapter, including its summary tables, traps and practice questions).
**Written:** `cards/d2-cards.r4.json`, `knowledge/d2-knowledge.r4.md`. Extras unchanged (no `d2-extras.r3.json`).

## Totals
| | Count |
|---|---|
| Cards checked | 156 (plus 5 extras) |
| Correct | 155 (plus 5 extras) |
| Minor | 1 |
| Wrong | 0 |
| Fixed | 1 |

## The fix
**Card 100, Radio frequency identification (RFID) cloning (2.4), keyPoints; same line in the chapter's exam tip.**
- Before: "cloners cost under about $50 and copy a card in seconds"
- After: "cheap handheld cloners for these unencrypted 125 kHz badges sell for roughly $10 to $60, while badges that use cryptographic authentication resist such simple copiers"
- Why MINOR: the price is right only for low frequency (125 kHz) fixed ID cards, and read as general it suggests every badge copies this cheaply; the "in seconds" timing had no source.
- Sources: retail listings for 125 kHz handheld duplicators (about $10 to $18, e.g. https://www.walmart.com/ip/270600002) and a pen-test LF cloner (Keysy, EUR 45 to 65, https://lab401.com/products/keysy-lf-rfid-emulator-duplicator); a vendor listing notes such tools do not handle encrypted or 13.56 MHz cards (https://vxb.com/products/portable-rfid-writer-and-card-duplicator-for-125kh).

## Claims verified against sources read during this check
Every card was read in full and checked against the SY0-701 objective lists (each listing card matches the objective's items and count: 6 actors, 3 attributes, 10 motivations, 3 message channels, 3 network types, 3 supply chain parties, 10 human vectors, 11 vulnerability categories, 9 malware types, 3 physical, 6 network, 6 application, 3 cryptographic, 2 password attacks, 9 indicators, 11 mitigations, 7 hardening techniques). The specific numbers and real cases were checked one by one:
- Amplification factors (card 104): DNS 28 to 54, NTP 556.9, memcached 10,000 to 51,000. https://www.cisa.gov/news-events/alerts/2014/01/17/udp-based-amplification-attacks
- Pwn2Own Vancouver 2023 Tesla Gateway TOCTOU, prize included a Model 3 (card 61). https://www.zerodayinitiative.com/blog/2023/3/22/pwn2own-vancouver-2023-day-one-results
- Mirai: list of 62 credentials, Telnet TCP 23 and 2323, 200,000 to 300,000 steady infections (cards 41, 103, extra 1). https://faculty.cc.gatech.edu/~mbailey/publications/usesec17_mirai.pdf
- SolarWinds: fewer than 18,000 customers may have installed the affected Orion versions (card 64). https://www.sec.gov/Archives/edgar/data/1739942/000162828020017451/swi-20201214.htm
- Counterfeit Cisco Catalyst 2960-X, built to bypass authentication, found when they failed after an upgrade (card 79). https://labs.withsecure.com/publications/the-fake-cisco and https://www.helpnetsecurity.com/2020/07/15/counterfeit-cisco-switches/
- Pwn2Own 2017 VM escape: Edge, Windows kernel, then VMware Workstation SVGA (virtual graphics) bugs (card 74). https://threatpost.com/vmware-patches-pwn2own-vm-escape-vulnerabilities/124629 and https://www.zerodayinitiative.com/blog/2017/3/17/the-results-pwn2own-2017-day-three
- WannaCry: Europol's 200,000 victims in 150 countries, $300 in Bitcoin doubling after three days (card 89). https://www.aljazeera.com/news/2017/5/14/ransomware-attack-hit-200000-victims-in-150-countries
- BlueBorne needed no pairing and no discoverable mode (card 39). https://www.malwarebytes.com/blog/news/2017/09/blueborne-bluetooths-airborne-influenza
- 2017 watering hole on the Polish KNF and Mexican CNBV sites, exploit served only to listed bank IP ranges (card 54). https://www.baesystems.com/en-uk/insight/lazarus---watering-hole-attacks and https://www.helpnetsecurity.com/2017/02/14/banks-watering-hole-attacks/
- Phishing among the top three initial access vectors (card 26): DBIR 2025 credential abuse 22%, exploitation 20%, phishing 16%; DBIR 2026 exploitation 31%, phishing 16%, credential abuse 13%. https://www.verizon.com/business/resources/reports/dbir/ (figures as reported by https://www.infosecurity-magazine.com/news/verizon-dbir-jump-vulnerability/ and https://www.scworld.com/news/verizon-dbir-2026-vulnerability-exploits-top-initial-access-as-patching-coverage-falls)
- March 2013 South Korea wiper with a timed trigger at 14:00, banks and broadcasters, ATMs disrupted (card 96). https://www.darkreading.com/cyberattacks-data-breaches/how-south-korean-bank-malware-spread
- Checked from standing knowledge of the primary texts, no conflict found: RFC 8996 (TLS 1.0 and 1.1 deprecated, 2021), RFC 7507 (TLS_FALLBACK_SCSV), POODLE (2014), SHAttered (2017), the 2008 MD5 rogue CA, MITRE T1055.001 (DLL injection), OWASP XSS types, 802.11w protected management frames required by WPA3, Kaseya VSA (July 2021), Target via its HVAC vendor (2013), the British Airways Magecart skimmer, CISA's malinformation definition, iOS 17.4 alternative marketplaces with notarization, EternalBlue MS17-010 over TCP 445.

## Extras and chapter
- The 5 extras (drive-by download, botnet and C2, session hijacking, evil twin and rogue AP, fileless malware) are CORRECT; their source links resolve.
- The chapter repeats the card text; its added tables, trap lists and 20 practice questions were read and are correct. Only the RFID exam tip changed, to match card 100.

## Still weak
- Some details rest on news coverage rather than the vendor's own report (WannaCry's $600 figure, the 2013 Korea ATM impact).
- The 2.2 email card cites "breach studies" without a year; true for DBIR 2025 and 2026, but the ranking can shift each year.

## Per-card verdicts
| # | Obj | Term | Verdict |
|---|---|---|---|
| 0 | 2.0 | SY0-701 Domain 2.0: Threats, Vulnerabilities, and Mitigations (22%) | CORRECT |
| 1 | 2.1 | SY0-701 2.1: Compare and contrast common threat actors and motivations | CORRECT |
| 2 | 2.1 | Threat actors (types of attackers) | CORRECT |
| 3 | 2.1 | Nation-state (threat actor) | CORRECT |
| 4 | 2.1 | Unskilled attacker (threat actor) | CORRECT |
| 5 | 2.1 | Hacktivist (threat actor) | CORRECT |
| 6 | 2.1 | Insider threat (threat actor) | CORRECT |
| 7 | 2.1 | Organized crime (threat actor) | CORRECT |
| 8 | 2.1 | Shadow IT (threat actor) | CORRECT |
| 9 | 2.1 | Attributes of threat actors | CORRECT |
| 10 | 2.1 | Internal vs external threat actor (attribute) | CORRECT |
| 11 | 2.1 | Resources/funding (threat actor attribute) | CORRECT |
| 12 | 2.1 | Level of sophistication/capability (threat actor attribute) | CORRECT |
| 13 | 2.1 | Threat actor motivations | CORRECT |
| 14 | 2.1 | Data exfiltration (attacker motivation) | CORRECT |
| 15 | 2.1 | Espionage (attacker motivation) | CORRECT |
| 16 | 2.1 | Service disruption (attacker motivation) | CORRECT |
| 17 | 2.1 | Blackmail (attacker motivation) | CORRECT |
| 18 | 2.1 | Financial gain (attacker motivation) | CORRECT |
| 19 | 2.1 | Philosophical/political beliefs (attacker motivation) | CORRECT |
| 20 | 2.1 | Ethical (attacker motivation) | CORRECT |
| 21 | 2.1 | Revenge (attacker motivation) | CORRECT |
| 22 | 2.1 | Disruption/chaos (attacker motivation) | CORRECT |
| 23 | 2.1 | War (attacker motivation) | CORRECT |
| 24 | 2.2 | SY0-701 2.2: Explain common threat vectors and attack surfaces | CORRECT |
| 25 | 2.2 | Message-based threat vectors | CORRECT |
| 26 | 2.2 | Email (threat vector) | CORRECT |
| 27 | 2.2 | Short Message Service (SMS) (threat vector) | CORRECT |
| 28 | 2.2 | Instant messaging (IM) (threat vector) | CORRECT |
| 29 | 2.2 | Image-based (threat vector) | CORRECT |
| 30 | 2.2 | File-based (threat vector) | CORRECT |
| 31 | 2.2 | Voice call (threat vector) | CORRECT |
| 32 | 2.2 | Removable device (threat vector) | CORRECT |
| 33 | 2.2 | Vulnerable software (threat vector) | CORRECT |
| 34 | 2.2 | Client-based vs. agentless software (vulnerable software vector) | CORRECT |
| 35 | 2.2 | Unsupported systems and applications (threat vector) | CORRECT |
| 36 | 2.2 | Unsecure networks (threat vector) | CORRECT |
| 37 | 2.2 | Wireless (unsecure network vector) | CORRECT |
| 38 | 2.2 | Wired (unsecure network vector) | CORRECT |
| 39 | 2.2 | Bluetooth (unsecure network vector) | CORRECT |
| 40 | 2.2 | Open service ports (threat vector) | CORRECT |
| 41 | 2.2 | Default credentials (threat vector) | CORRECT |
| 42 | 2.2 | Supply chain (threat vector) | CORRECT |
| 43 | 2.2 | Managed service providers (MSPs) (supply chain vector) | CORRECT |
| 44 | 2.2 | Vendors (supply chain vector) | CORRECT |
| 45 | 2.2 | Suppliers (supply chain vector) | CORRECT |
| 46 | 2.2 | Human vectors/social engineering | CORRECT |
| 47 | 2.2 | Phishing (social engineering) | CORRECT |
| 48 | 2.2 | Vishing (social engineering) | CORRECT |
| 49 | 2.2 | Smishing (social engineering) | CORRECT |
| 50 | 2.2 | Misinformation/disinformation (social engineering) | CORRECT |
| 51 | 2.2 | Impersonation (social engineering) | CORRECT |
| 52 | 2.2 | Business email compromise (BEC) (social engineering) | CORRECT |
| 53 | 2.2 | Pretexting (social engineering) | CORRECT |
| 54 | 2.2 | Watering hole (social engineering attack) | CORRECT |
| 55 | 2.2 | Brand impersonation (social engineering) | CORRECT |
| 56 | 2.2 | Typosquatting (social engineering) | CORRECT |
| 57 | 2.3 | SY0-701 2.3: Explain various types of vulnerabilities | CORRECT |
| 58 | 2.3 | Application vulnerabilities | CORRECT |
| 59 | 2.3 | Memory injection (application vulnerability) | CORRECT |
| 60 | 2.3 | Buffer overflow (application vulnerability) | CORRECT |
| 61 | 2.3 | Race conditions (application vulnerability) | CORRECT |
| 62 | 2.3 | Time-of-check (TOC) (race condition) | CORRECT |
| 63 | 2.3 | Time-of-use (TOU) (race condition) | CORRECT |
| 64 | 2.3 | Malicious update (application vulnerability) | CORRECT |
| 65 | 2.3 | Operating system (OS)-based vulnerabilities | CORRECT |
| 66 | 2.3 | Web-based vulnerabilities | CORRECT |
| 67 | 2.3 | Structured Query Language injection (SQLi) (web vulnerability) | CORRECT |
| 68 | 2.3 | Cross-site scripting (XSS) (web vulnerability) | CORRECT |
| 69 | 2.3 | Hardware vulnerabilities | CORRECT |
| 70 | 2.3 | Firmware (hardware vulnerability) | CORRECT |
| 71 | 2.3 | End-of-life (EOL) (hardware vulnerability) | CORRECT |
| 72 | 2.3 | Legacy (hardware vulnerability) | CORRECT |
| 73 | 2.3 | Virtualization vulnerabilities | CORRECT |
| 74 | 2.3 | Virtual machine (VM) escape (virtualization vulnerability) | CORRECT |
| 75 | 2.3 | Resource reuse (virtualization vulnerability) | CORRECT |
| 76 | 2.3 | Cloud-specific vulnerabilities | CORRECT |
| 77 | 2.3 | Supply chain vulnerabilities | CORRECT |
| 78 | 2.3 | Service provider (supply chain vulnerability) | CORRECT |
| 79 | 2.3 | Hardware provider (supply chain vulnerability) | CORRECT |
| 80 | 2.3 | Software provider (supply chain vulnerability) | CORRECT |
| 81 | 2.3 | Cryptographic vulnerabilities | CORRECT |
| 82 | 2.3 | Misconfiguration (vulnerability) | CORRECT |
| 83 | 2.3 | Mobile device vulnerabilities | CORRECT |
| 84 | 2.3 | Side loading (mobile device vulnerability) | CORRECT |
| 85 | 2.3 | Jailbreaking (mobile device vulnerability) | CORRECT |
| 86 | 2.3 | Zero-day (vulnerability) | CORRECT |
| 87 | 2.4 | SY0-701 2.4: Given a scenario, analyze indicators of malicious activity | CORRECT |
| 88 | 2.4 | Malware attacks | CORRECT |
| 89 | 2.4 | Ransomware (malware) | CORRECT |
| 90 | 2.4 | Trojan (malware) | CORRECT |
| 91 | 2.4 | Worm (malware) | CORRECT |
| 92 | 2.4 | Spyware (malware) | CORRECT |
| 93 | 2.4 | Bloatware (malware category) | CORRECT |
| 94 | 2.4 | Virus (malware) | CORRECT |
| 95 | 2.4 | Keylogger (malware) | CORRECT |
| 96 | 2.4 | Logic bomb (malware) | CORRECT |
| 97 | 2.4 | Rootkit (malware) | CORRECT |
| 98 | 2.4 | Physical attacks | CORRECT |
| 99 | 2.4 | Brute force (physical attack) | CORRECT |
| 100 | 2.4 | Radio frequency identification (RFID) cloning (physical attack) | MINOR (fixed) |
| 101 | 2.4 | Environmental (physical attack) | CORRECT |
| 102 | 2.4 | Network attacks | CORRECT |
| 103 | 2.4 | Distributed denial-of-service (DDoS) (network attack) | CORRECT |
| 104 | 2.4 | Amplified DDoS (network attack) | CORRECT |
| 105 | 2.4 | Reflected DDoS (network attack) | CORRECT |
| 106 | 2.4 | Domain Name System (DNS) attacks (network attack) | CORRECT |
| 107 | 2.4 | Wireless (network attack) | CORRECT |
| 108 | 2.4 | On-path attack (network attack) | CORRECT |
| 109 | 2.4 | Credential replay (network attack) | CORRECT |
| 110 | 2.4 | Malicious code (network attack) | CORRECT |
| 111 | 2.4 | Application attacks | CORRECT |
| 112 | 2.4 | Injection (application attack) | CORRECT |
| 113 | 2.4 | Buffer overflow (application attack) | CORRECT |
| 114 | 2.4 | Replay (application attack) | CORRECT |
| 115 | 2.4 | Privilege escalation (application attack) | CORRECT |
| 116 | 2.4 | Forgery (application attack) | CORRECT |
| 117 | 2.4 | Directory traversal (application attack) | CORRECT |
| 118 | 2.4 | Cryptographic attacks | CORRECT |
| 119 | 2.4 | Downgrade (cryptographic attack) | CORRECT |
| 120 | 2.4 | Collision (cryptographic attack) | CORRECT |
| 121 | 2.4 | Birthday (cryptographic attack) | CORRECT |
| 122 | 2.4 | Password attacks | CORRECT |
| 123 | 2.4 | Password spraying (password attack) | CORRECT |
| 124 | 2.4 | Brute force (password attack) | CORRECT |
| 125 | 2.4 | Indicators of malicious activity (indicators of compromise) | CORRECT |
| 126 | 2.4 | Account lockout (indicator) | CORRECT |
| 127 | 2.4 | Concurrent session usage (indicator) | CORRECT |
| 128 | 2.4 | Blocked content (indicator) | CORRECT |
| 129 | 2.4 | Impossible travel (indicator) | CORRECT |
| 130 | 2.4 | Resource consumption (indicator) | CORRECT |
| 131 | 2.4 | Resource inaccessibility (indicator) | CORRECT |
| 132 | 2.4 | Out-of-cycle logging (indicator) | CORRECT |
| 133 | 2.4 | Published/documented (indicator) | CORRECT |
| 134 | 2.4 | Missing logs (indicator) | CORRECT |
| 135 | 2.5 | SY0-701 2.5: Explain the purpose of mitigation techniques used to secure the enterprise | CORRECT |
| 136 | 2.5 | Segmentation (mitigation technique) | CORRECT |
| 137 | 2.5 | Access control (mitigation technique) | CORRECT |
| 138 | 2.5 | Access control list (ACL) (mitigation technique) | CORRECT |
| 139 | 2.5 | Permissions (mitigation technique) | CORRECT |
| 140 | 2.5 | Application allow list (mitigation technique) | CORRECT |
| 141 | 2.5 | Isolation (mitigation technique) | CORRECT |
| 142 | 2.5 | Patching (mitigation technique) | CORRECT |
| 143 | 2.5 | Encryption (mitigation technique) | CORRECT |
| 144 | 2.5 | Monitoring (mitigation technique) | CORRECT |
| 145 | 2.5 | Least privilege (mitigation technique) | CORRECT |
| 146 | 2.5 | Configuration enforcement (mitigation technique) | CORRECT |
| 147 | 2.5 | Decommissioning (mitigation technique) | CORRECT |
| 148 | 2.5 | Hardening techniques (mitigation) | CORRECT |
| 149 | 2.5 | Encryption (hardening technique) | CORRECT |
| 150 | 2.5 | Installation of endpoint protection (hardening technique) | CORRECT |
| 151 | 2.5 | Host-based firewall (hardening technique) | CORRECT |
| 152 | 2.5 | Host-based intrusion prevention system (HIPS) (hardening technique) | CORRECT |
| 153 | 2.5 | Disabling ports/protocols (hardening technique) | CORRECT |
| 154 | 2.5 | Default password changes (hardening technique) | CORRECT |
| 155 | 2.5 | Removal of unnecessary software (hardening technique) | CORRECT |
