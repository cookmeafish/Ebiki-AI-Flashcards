# d0 reference chapter: accuracy review 1 (r7 -> r8)

Reviewed: `knowledge/d0-knowledge.r7.md`. Corrected pass: `knowledge/d0-knowledge.r8.md`. Reviewer did not write the chapter.
Date: 2026-11-15 to 2026-11-16.

How sources were read: the IANA port and protocol registries, NIST IR 8547 (final), SP 800-115, SP 800-38D,
SP 800-61r3, IAF MD 26, CERT VU#723755, RFC 1122, 4291, 3193 and 8110 and the pages marked "fetched" below were
downloaded by the reviewer in this review. The other RFC and NIST texts, the CA/Browser Forum Baseline Requirements,
OWASP, FIRST CVSS, SP 800-63B-4 and the Windows event pages were read from the writer's same-day downloads of the
official URLs (text searched for each claim), not downloaded a second time.

Format checks on r8: 48 sections, largest 2,578 characters, no duplicate titles, longest title 98 characters, no em or
en dashes, no links, no HTML, no question-and-answer blocks.

## Result per section

| Section | Result | What changed (before -> after) and source |
|---|---|---|
| Secure versus insecure protocol pairs | PASS | Every port and transport matches the IANA registry (https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.csv); AUTH TLS (RFC 4217), 465/587 (RFC 8314), 853 (RFC 7858), 6514 (RFC 5425). |
| Network service ports | FIXED | (1) "Kerberos is the Windows domain ticket protocol" -> "a ticket based network authentication protocol, the default in Windows domains" (RFC 4120 is not Windows only). (2) Kerberos password change 464 "UDP (Windows)" -> "UDP and TCP" (IANA kpasswd tcp and udp; https://learn.microsoft.com/en-us/troubleshoot/windows-server/networking/service-overview-and-network-port-requirements lists both). Rest verified: 1645 (RFC 2865), TACACS+ body obfuscation (RFC 8907), IPFIX 4739 udp, tcp, sctp (IANA). |
| Remote access, file sharing and database ports | FIXED | NetBIOS row "TCP and UDP registered" -> "In use: UDP 137 name, UDP 138 datagram, TCP 139 session" (same Microsoft port page). Other ports match IANA. |
| VPN and tunneling ports and IP protocol numbers | FIXED | (1) AH "Current" -> "Current but optional: IPsec products must support ESP and may support AH" (RFC 4301 section 3.2, https://www.rfc-editor.org/rfc/rfc4301). (2) L2TP and PPTP status reworded to what the vendor post says: deprecated for future Windows Server versions, still available; company name removed from the cell (https://techcommunity.microsoft.com/blog/windowsservernewsandbestpractices/pptp-and-l2tp-deprecation-a-new-era-of-secure-connectivity/4263956). Verified: L2TP has no confidentiality of its own (RFC 3193, https://www.rfc-editor.org/rfc/rfc3193); protocol numbers 1, 6, 17, 47, 50, 51, 58 (https://www.iana.org/assignments/protocol-numbers/protocol-numbers-1.csv). |
| Email ports and DNS mail authentication records | PASS | IANA, RFC 8314. |
| Private and special IP address ranges | FIXED | Loopback "Defined by: IPv4 and IPv6 standards" -> "RFC 1122 (IPv4) and RFC 4291 (IPv6)", both read (127/8 in RFC 1122 section 3.2.1.3; ::1 in RFC 4291 section 2.5.3). RFC 1918 and RFC 3927 ranges verified. |
| Symmetric ciphers | PASS | 3DES: SP 800-131A r2 "Three-key TDEA Encryption: Deprecated through 2023, Disallowed after 2023, Decryption: Legacy use"; SP 800-67r2 withdrawal date January 1, 2024. Strengths 80 and 112 from SP 800-57 Part 1 r5 Table 2. |
| Asymmetric algorithms and comparable key sizes | FIXED | Every cell of the strength table matches SP 800-57 Part 1 r5 Table 2 (80: 1024, 160 to 223; 112: 2048, 224 to 255; 128: 3072, 256 to 383; 192: 7680, 384 to 511; 256: 15360, 512+). SERIOUS: the chapter called IR 8547 a draft and tied "deprecated after 2030" to the 112-bit row only. IR 8547 became final on 27 October 2026 and deprecates ALL quantum-vulnerable public key algorithms after 2030 and disallows them after 2035, at every strength (https://nvlpubs.nist.gov/nistpubs/ir/2026/NIST.IR.8547.pdf, Tables 2 and 4, section 4.1). Row 112 status and the bullet rewritten. |
| Hash functions | FIXED | SHA-1 "public certificates must stop using it in 2026" -> the exact rule: CA/Browser Forum ballot SC097, all remaining SHA-1 signatures in certificates and CRLs end 2026-09-15 (Baseline Requirements 2.3.1, https://github.com/cabforum/servercert/blob/main/docs/BR.md). "disallowed for new signatures" -> "disallowed by NIST for creating digital signatures" (SP 800-131A r2). |
| Password hashing and key stretching settings | PASS | All five numbers match the OWASP Password Storage Cheat Sheet. |
| Block cipher modes | PASS | IV rules per SP 800-38A; 96-bit GCM IV per SP 800-38D section 5.2.1.1 (https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf). |
| TLS and SSL versions | PASS | RFC 7568, 8996, 9325, 8446 appendix B.4, 7465. |
| Certificate file formats and validity limits | FIXED | The validity schedule was right but compressed into one sentence; now a table keyed to the ISSUE date with "as of version 2.3.1, October 2026": 398 days before 2026-03-15, 200 days from 2026-03-15, 100 days from 2027-03-15, 47 days from 2029-03-15 (BR section 6.3.2). Other chapters can be compared against this table. |
| One-time password and Kerberos timing | PASS | RFC 4226 (6 digits minimum), RFC 6238 (30 seconds), RFC 4120 (5 minutes as the usual skew). |
| Wi-Fi security generations | FIXED | Removed the operating system vendor remark from the WPA row ("Windows warns on WEP and TKIP networks"). WEP key and IV sizes per SP 800-97; "WPA3 is mandatory for Wi-Fi CERTIFIED devices" per https://www.wi-fi.org/security (fetched). |
| WPA2 and WPA3 modes and handshakes | FIXED | 192-bit mode cell now names the P-384 curve; RSA minimum 3072 kept, now backed by two independent vendor references that agree (the writer's, plus https://www.lancom-systems.com/docs/LCOS/Refmanual/EN/topics/WPA3-Enterprise.html read in this review). OWE verified against RFC 8110. See "Not verified". |
| EAP methods | FIXED | LEAP row said "Not covered here / Appears on the acronym list" (not teaching content) -> "None / Password only, no TLS tunnel / Legacy; replace". See "Not verified". |
| Wi-Fi radio standards (NEW) | ADDED | Bands and channel widths for 802.11b, a, g, n, ac, ax and the 11 and 54 Mbps rates from the chip maker's support article "Different Wi-Fi Protocols and Data Rates" (https://www.intel.com/content/www/us/en/support/articles/000005725/wireless/legacy-intel-wireless-products.html). Top rates for n, ac and ax are given only as classes, because published figures depend on streams and channel width. |
| WPS PIN weakness | PASS | 8 digits, first half revealed, checksum digit, 10^4 + 10^3 = 11,000: https://www.kb.cert.org/vuls/id/723755 (fetched). |
| RAID at a glance | FIXED | RAID 6 minimum "4 (some controllers allow 3)" -> "4" (the exception could not be confirmed; the server maker's RAID paper gives four). Failures survived confirmed for RAID 5 and 6 by the SNIA dictionary entries (search result text). |
| RAID usable capacity examples | FIXED | "a common exam style calculation" removed (rule wording); the capacity rule is now stated in words. Arithmetic rechecked. |
| RTO, RPO, MTD, MTTR, MTBF, MTTF | FIXED | "Availability is roughly MTBF / (MTBF + MTTR)" -> named as inherent availability (NASA KSC reliability note, https://extapps.ksc.nasa.gov/Reliability/Documents/160727.1_Availability_What_is_it.pdf: inherent availability uses MTBF and MTTR only). |
| Recovery metrics worked numbers | PASS | Arithmetic rechecked (3,000 / 3,003 = 99.90%). Intro reworded. |
| Availability percentages | PASS | All eight cells recomputed. |
| Backup types | PASS | SP 800-34 r1 section 5.2.2; 3-2-1 per the CISA backup sheet. |
| Recovery site types | FIXED | Hot site "fully equipped and staffed" -> "hardware, infrastructure and support staff" (SP 800-34 r1 section 3.4.3 wording is "support personnel"). |
| Quantitative risk formulas | PASS | Standard formulas; match the d5 cards. Not in a primary source read here. |
| CVSS severity ranges | PASS | Identical bands in v3.1 Table 14 and v4.0 Table 22 (first.org). |
| Log sources | PASS | Matches the objective 4.9 cards; descriptive, no numbers. |
| Syslog severity | PASS | RFC 5424 Table 2; <165> is the RFC's own local4 Notice example. |
| Windows security event IDs and logon types | PASS | All six event IDs and logon types 2, 3, 4, 5, 7, 8, 10, 11 match Microsoft Learn. |
| Order of volatility | PASS | RFC 3227 section 2.1, same order. |
| Security frameworks compared | PASS | See "Not verified" for ISO counts. |
| NIST CSF 2.0 functions and RMF steps | FIXED | Rule wording "questions often ask to sequence" removed; added that CSF functions are not strict steps. |
| Process phases in order | FIXED | Rule wording "the tested fact" removed. SP 800-115 section 5.2 (four phases, reporting alongside), SP 800-61r3 (maps the old life cycle to CSF 2.0 functions), SP 800-88r2 (clear, purge, destroy) verified. |
| Compliance numbers | FIXED | SOC 2 Type 2 "typically 3 to 12 months" -> "across a review period (a span of months, not one date)": no AICPA text states a fixed length. ISO 27001:2013 row now gives the reason: IAF MD 26 sets 36 months from the last day of the publication month (https://iaf.nu/iaf_system/uploads/documents/IAF_MD_26_Transition_requirements_for_ISOIEC_27001-2022_09082022.pdf). GDPR numbers match articles 33 and 83. |
| Password policy numbers (SP 800-63B-4) | FIXED | "Maximum length allowed" -> "Maximum length the system should accept" (it is a SHOULD). 15, 8, 64, no composition rules, no periodic change, blocklist, 100 failures all verified. |
| One acronym, several meanings | FIXED | Removed the ESP and CTR/CTM rows (one meaning each; both stay in the next section); "PKI questions" -> "PKI work". |
| Acronym list expansions | FIXED | "the exam acronym list" -> "the published SY0-701 acronym list". |

Facts or statements fixed: 19 (plus one section added).

## Cards that look wrong
None. Cards checked against r8: password lengths (15 and 8), AES-128 = RSA-3072 = ECC 256, RSA-2048 about 112 bits,
RADIUS 1645, IKE 500 and 4500, PBKDF2 600,000, TOTP 30 seconds, GDPR 72 hours and 4%, SHA-1 collision 2017, order of
volatility, EAP-FAST and the availability formula all agree. Note only: a d3 or d4 wireless card says Wi-Fi 7 gear
uses GCMP-256 in personal mode; the chapter neither repeats nor contradicts this (could not be checked, see below).

## Not verified from a primary source
- WPA3 internals (192-bit mode suites, P-384, RSA 3072, transition mode PMF optional, 6 GHz rules): the Wi-Fi Alliance
  specification is behind a login. Two vendor references agree on the 192-bit details; the public Wi-Fi Alliance
  security page confirms only that WPA3 is mandatory for certified devices and requires PMF.
- ISO/IEC 27001:2022 Annex A count (93 = 37 + 8 + 14 + 34): iso.org refuses automated reads and the standard is paid.
  Kept on the strength of the writer's certification body source; the counts are widely published and consistent.
- SOC 2 Type 1 and Type 2 definitions: the AICPA page read names only the five categories. The definitions are standard.
- LEAP as a legacy, password only method: the vendor's own advisory page could not be opened. Kept minimal.
- RAID usable capacity (n minus 1, n minus 2): arithmetic from single and double parity, not quoted from a source.
- Availability formula: the NASA note confirms the two inputs; the ratio itself sits in a figure that did not extract.
- Wi-Fi 4 and Wi-Fi 5 as names for 802.11n and 802.11ac: common knowledge; the Wi-Fi Alliance page returned an error.
  Wi-Fi 6 = 802.11ax is in the source read.
- SLE, ARO, ALE formulas and the log source table: cards and common knowledge only.
- The 2017 SHA-1 collision and the DES withdrawal: common knowledge, matching the cards.
