# d0 reference chapter (r7): source notes

Chapter: `knowledge/d0-knowledge.r7.md`. Every source below was fetched and read on 2026-11-15 (RFC text, NIST PDF text,
IANA CSV, vendor pages). Cards read: the latest pass per prefix at the time of writing (d1-cards.r4, d1-extras.r2,
d2-cards.r4, d2-extras.r5, d3-cards.r7, d3-extras.r2, d4a-cards.r4, d4a-extras.r6, d4b-cards.r4, d4b-extras.r2,
d5-cards.r4, d5-extras.r2). The later wording-only passes were not re-read.

## Sources

| Key | Title | URL |
|---|---|---|
| IANA-P | IANA Service Name and Transport Protocol Port Number Registry | https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.csv |
| IANA-N | IANA Assigned Internet Protocol Numbers | https://www.iana.org/assignments/protocol-numbers/protocol-numbers-1.csv |
| R1035 | RFC 1035 DNS (UDP and TCP 53) | https://www.rfc-editor.org/rfc/rfc1035 |
| R7766 | RFC 7766 DNS over TCP | https://www.rfc-editor.org/rfc/rfc7766 |
| R1350 | RFC 1350 TFTP (UDP 69) | https://www.rfc-editor.org/rfc/rfc1350 |
| R1918 | RFC 1918 private address space | https://www.rfc-editor.org/rfc/rfc1918 |
| R3927 | RFC 3927 IPv4 link-local 169.254/16 | https://www.rfc-editor.org/rfc/rfc3927 |
| R2131 | RFC 2131 DHCP (UDP 67/68) | https://www.rfc-editor.org/rfc/rfc2131 |
| R2637 | RFC 2637 PPTP (TCP 1723, GRE) | https://www.rfc-editor.org/rfc/rfc2637 |
| R2661 | RFC 2661 L2TP (UDP 1701) | https://www.rfc-editor.org/rfc/rfc2661 |
| R2865 | RFC 2865 RADIUS (UDP 1812, old 1645) | https://www.rfc-editor.org/rfc/rfc2865 |
| R8907 | RFC 8907 TACACS+ (TCP 49, body obfuscation) | https://www.rfc-editor.org/rfc/rfc8907 |
| R3261 | RFC 3261 SIP (5060, TLS 5061) | https://www.rfc-editor.org/rfc/rfc3261 |
| R3711 | RFC 3711 SRTP | https://www.rfc-editor.org/rfc/rfc3711 |
| R3417 | RFC 3417 SNMP transport (UDP 161/162) | https://www.rfc-editor.org/rfc/rfc3417 |
| R3414 | RFC 3414 SNMPv3 user-based security | https://www.rfc-editor.org/rfc/rfc3414 |
| R4120 | RFC 4120 Kerberos (port 88, 5 minute skew) | https://www.rfc-editor.org/rfc/rfc4120 |
| R4217 | RFC 4217 FTP over TLS (AUTH TLS) | https://www.rfc-editor.org/rfc/rfc4217 |
| R4253 | RFC 4253 SSH transport (TCP 22) | https://www.rfc-editor.org/rfc/rfc4253 |
| R4511 | RFC 4511 LDAP over TCP | https://www.rfc-editor.org/rfc/rfc4511 |
| R5425 | RFC 5425 syslog over TLS (TCP 6514) | https://www.rfc-editor.org/rfc/rfc5425 |
| R5426 | RFC 5426 syslog over UDP 514 | https://www.rfc-editor.org/rfc/rfc5426 |
| R5424 | RFC 5424 syslog severities and PRI | https://www.rfc-editor.org/rfc/rfc5424 |
| R5905 | RFC 5905 NTP (UDP 123) | https://www.rfc-editor.org/rfc/rfc5905 |
| R7011 | RFC 7011 IPFIX (4739) | https://www.rfc-editor.org/rfc/rfc7011 |
| R7296 | RFC 7296 IKEv2 (UDP 500, 4500) | https://www.rfc-editor.org/rfc/rfc7296 |
| R3948 | RFC 3948 UDP encapsulation of ESP | https://www.rfc-editor.org/rfc/rfc3948 |
| R4303 | RFC 4303 ESP | https://www.rfc-editor.org/rfc/rfc4303 |
| R7858 | RFC 7858 DNS over TLS (TCP 853) | https://www.rfc-editor.org/rfc/rfc7858 |
| R8484 | RFC 8484 DNS over HTTPS (443) | https://www.rfc-editor.org/rfc/rfc8484 |
| R4033 | RFC 4033 DNSSEC introduction | https://www.rfc-editor.org/rfc/rfc4033 |
| R8314 | RFC 8314 mail submission (465 implicit TLS, 587 STARTTLS) | https://www.rfc-editor.org/rfc/rfc8314 |
| R7208 | RFC 7208 SPF | https://www.rfc-editor.org/rfc/rfc7208 |
| R6376 | RFC 6376 DKIM | https://www.rfc-editor.org/rfc/rfc6376 |
| R7489 | RFC 7489 DMARC | https://www.rfc-editor.org/rfc/rfc7489 |
| R9114 | RFC 9114 HTTP/3 (QUIC, UDP) | https://www.rfc-editor.org/rfc/rfc9114 |
| R8446 | RFC 8446 TLS 1.3 (cipher suites, B.4) | https://www.rfc-editor.org/rfc/rfc8446 |
| R8996 | RFC 8996 deprecating TLS 1.0 and 1.1 | https://www.rfc-editor.org/rfc/rfc8996 |
| R7568 | RFC 7568 SSLv3 must not be used | https://www.rfc-editor.org/rfc/rfc7568 |
| R9325 | RFC 9325 TLS recommendations | https://www.rfc-editor.org/rfc/rfc9325 |
| R7465 | RFC 7465 prohibiting RC4 in TLS | https://www.rfc-editor.org/rfc/rfc7465 |
| R6151 | RFC 6151 MD5 security considerations | https://www.rfc-editor.org/rfc/rfc6151 |
| R1321 | RFC 1321 MD5 (128-bit digest) | https://www.rfc-editor.org/rfc/rfc1321 |
| R2104 | RFC 2104 HMAC | https://www.rfc-editor.org/rfc/rfc2104 |
| R8439 | RFC 8439 ChaCha20 and Poly1305 | https://www.rfc-editor.org/rfc/rfc8439 |
| R3058 | RFC 3058 IDEA (128-bit key, 64-bit block) | https://www.rfc-editor.org/rfc/rfc3058 |
| R7468 | RFC 7468 PEM textual encodings | https://www.rfc-editor.org/rfc/rfc7468 |
| R7292 | RFC 7292 PKCS #12 | https://www.rfc-editor.org/rfc/rfc7292 |
| R2986 | RFC 2986 PKCS #10 | https://www.rfc-editor.org/rfc/rfc2986 |
| R4226 | RFC 4226 HOTP (6 digits minimum) | https://www.rfc-editor.org/rfc/rfc4226 |
| R6238 | RFC 6238 TOTP (30 second step) | https://www.rfc-editor.org/rfc/rfc6238 |
| R5216 | RFC 5216 EAP-TLS | https://www.rfc-editor.org/rfc/rfc5216 |
| R5281 | RFC 5281 EAP-TTLS | https://www.rfc-editor.org/rfc/rfc5281 |
| R4851 | RFC 4851 EAP-FAST (PAC) | https://www.rfc-editor.org/rfc/rfc4851 |
| R3227 | RFC 3227 order of volatility | https://www.rfc-editor.org/rfc/rfc3227 |
| SP57 | NIST SP 800-57 Part 1 Rev 5, Tables 2 and 3 | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-57pt1r5.pdf |
| SP131 | NIST SP 800-131A Rev 2 (transitions) | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-131Ar2.pdf |
| SP67 | NIST SP 800-67 Rev 2 with withdrawal note (TDEA, 1 Jan 2024) | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-67r2.pdf |
| F197 | FIPS 197 AES | https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.197-upd1.pdf |
| F180 | FIPS 180-4 SHA-1 and SHA-2 | https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf |
| F202 | FIPS 202 SHA-3 | https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.202.pdf |
| F186 | FIPS 186-5 (DSA no longer approved for generation) | https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.186-5.pdf |
| IR8547 | NIST IR 8547 initial public draft (2030 / 2035) | https://nvlpubs.nist.gov/nistpubs/ir/2024/NIST.IR.8547.ipd.pdf |
| SP38A | NIST SP 800-38A block cipher modes | https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38a.pdf |
| SP38D | NIST SP 800-38D GCM (96-bit IV) | https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf |
| SP97 | NIST SP 800-97 IEEE 802.11i (WEP, TKIP, CCMP, 4-way handshake) | https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-97.pdf |
| SP34 | NIST SP 800-34 Rev 1 (RTO, RPO, MTD, backup types, sites) | https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-34r1.pdf |
| SP37 | NIST SP 800-37 Rev 2 RMF steps | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-37r2.pdf |
| SP61 | NIST SP 800-61 Rev 2 and Rev 3 | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-61r2.pdf |
| SP88 | NIST SP 800-88 Rev 2 | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-88r2.pdf |
| SP115 | NIST SP 800-115 (four pen test phases) | https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-115.pdf |
| SP63B | NIST SP 800-63B-4 passwords | https://pages.nist.gov/800-63-4/sp800-63b.html |
| CSF | NIST CSF 2.0 (CSWP 29) | https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.29.pdf |
| OWASP | OWASP Password Storage Cheat Sheet | https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html |
| CABF | CA/Browser Forum Baseline Requirements (validity schedule, SHA-1 sunset) | https://github.com/cabforum/servercert/blob/main/docs/BR.md |
| CVSS | FIRST CVSS v4.0 and v3.1 specifications | https://www.first.org/cvss/v4.0/specification-document |
| MSPORT | Microsoft: service overview and network port requirements for Windows | https://learn.microsoft.com/en-us/troubleshoot/windows-server/networking/service-overview-and-network-port-requirements |
| MSEV | Microsoft Learn auditing events 4624, 4625, 4672, 4720, 4740, 1102 | https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-4624 |
| MSDEP | Microsoft: deprecated Windows features (WEP and TKIP warning) | https://learn.microsoft.com/en-us/windows/whats-new/deprecated-features |
| MSVPN | Microsoft Tech Community: PPTP and L2TP deprecation | https://techcommunity.microsoft.com/t5/windows-server-news-and-best/pppt-and-l2tp-deprecation-a-new-era-of-secure-connectivity/m-p/4263956 |
| CISCO | Cisco WPA3 deployment guide | https://www.cisco.com/c/en/us/td/docs/wireless/controller/9800/technical-reference/wpa3-dg.html |
| WFA | Wi-Fi Alliance security page | https://www.wi-fi.org/discover-wi-fi/security |
| ZEBRA | Zebra WPA3-Enterprise guide (192-bit mode suites, RSA 3072) | https://docs.zebra.com/us/en/mobile-computers/software/wi-fi-7-android-devices-in-cisco-wlan-infrastructure/c-wifi7-security-recommendations-while-deploying-zebra-clients-in-wi-fi-7-network/r-6ghz-wpa3-enterprise.html |
| CERT | CERT/CC VU#723755 WPS PIN brute force | https://www.kb.cert.org/vuls/id/723755 |
| DELL | Dell PowerEdge RAID levels | https://www.dell.com/support/kbdoc/en-us/000128635 |
| INTEL | Intel RAID levels article | https://www.intel.com/content/www/us/en/support/articles/000008091/server-products/sasraid.html |
| IBM | IBM RAID technology paper | https://public.dhe.ibm.com/systems/support/system_x_pdf/raidwppr.pdf |
| CISA | CISA Data Backup Options (3-2-1) | https://www.cisa.gov/sites/default/files/publications/data_backup_options.pdf |
| RELIA | ReliaSoft MTBF and MTTF basics | https://help.reliasoft.com/articles/content/hotwire/issue94/relbasics94.htm |
| GDPR | GDPR articles 33 and 83 | https://gdpr-info.eu/art-33-gdpr/ |
| DQS | DQS: ISO/IEC 27001:2022 changes | https://www.dqsglobal.com/en-us/explore/blog/new-iso-27001-2022-key-changes |
| DRATA | Drata: SOC 2 Type 1 vs Type 2 | https://drata.com/learn/soc-2/type-1-vs-type-2 |
| PCI | PCI SSC: PCI DSS | https://www.pcisecuritystandards.org/standards/pci-dss/ |
| CIS | CIS Critical Security Controls list (18) | https://www.cisecurity.org/controls/cis-controls-list |
| RIPE | RIPEMD-160 home page | https://homes.esat.kuleuven.be/~bosselae/ripemd160.html |
| CARDS | Course cards (latest pass) and acronyms.txt | local |

## Sources per section

| Section | Keys |
|---|---|
| Secure versus insecure protocol pairs | IANA-P, R4253, R4217, R1350, R9114, R4511, MSPORT, R3417, R3414, R8314, R1035, R7858, R8484, R4033, R5426, R5425, R3261, R3711 |
| Network service ports | IANA-P, R4120, MSPORT, R2865, R8907, R2131, R1035, R7766, R5905, R3417, R5426, R5425, R7011, CARDS |
| Remote access, file sharing and database ports | IANA-P, MSPORT, CARDS (WannaCry, TCP 445) |
| VPN and tunneling ports | IANA-P, IANA-N, R7296, R3948, R4303, R2661, R2637, MSVPN, CARDS |
| Email ports and DNS records | IANA-P, R8314, R7208, R6376, R7489 |
| Private and special IP ranges | R1918, R3927 |
| Symmetric ciphers | F197, R8439, SP67, SP57, SP131, R7465, SP97, R3058 |
| Asymmetric algorithms | SP57 (Table 2), SP131, F186, IR8547, CARDS |
| Hash functions | R1321, R6151, F180, F202, SP57 (Table 3), SP131, CABF, RIPE, R2104, SP97 (checksum weakness), CARDS (2017 SHA-1 collision) |
| Password hashing | OWASP |
| Block cipher modes | SP38A, SP38D, CARDS |
| TLS and SSL versions | R7568, R8996, R9325, R8446, R7465, CARDS (POODLE) |
| Certificate file formats | R7468, R7292, R2986, CABF, CARDS |
| OTP and Kerberos timing | R4226, R6238, R4120 |
| Wi-Fi security generations | SP97, MSDEP, WFA, CISCO, CARDS |
| WPA2 and WPA3 modes | SP97, CISCO, WFA, ZEBRA, CARDS |
| EAP methods | R5216, R5281, R4851, CARDS |
| WPS PIN weakness | CERT |
| RAID at a glance; RAID capacity examples | DELL, INTEL, IBM, CARDS |
| RTO, RPO, MTD, MTTR, MTBF, MTTF | SP34, RELIA, CARDS |
| Recovery metrics worked numbers | CARDS (same figures), arithmetic |
| Availability percentages | arithmetic on 8,760 hours |
| Backup types | SP34, CISA, CARDS |
| Recovery site types | SP34 |
| Quantitative risk formulas | CARDS, arithmetic |
| CVSS ranges | CVSS |
| Log sources | CARDS (objective 4.9 cards) |
| Syslog severity | R5424, R5426, R5425 |
| Windows event IDs | MSEV |
| Order of volatility | R3227, CARDS |
| Frameworks compared | CSF, SP37, DQS, CIS, PCI, DRATA, GDPR, CVSS |
| CSF functions and RMF steps | CSF, SP37 |
| Process phases in order | SP61, SP115, SP88 |
| Compliance numbers | GDPR, DRATA, DQS, PCI |
| Password policy numbers | SP63B |
| Acronym sections | acronyms.txt, R4303, R2104, SP38A, SP67, CARDS |

## Left uncertain or weakly sourced
- WPA3 details come from vendor guides (Cisco, Zebra) and the Wi-Fi Alliance overview page. The Wi-Fi Alliance WPA3
  specification PDF is behind a login and IEEE 802.11 is not free, so neither was read. The RSA 3072 minimum for the
  192-bit mode rests on the Zebra page alone.
- ISO/IEC 27001 facts come from a certification body (DQS) and SOC 2 from a vendor page: iso.org and the AICPA page
  could not be read. PCI DSS version numbers were left out because the PCI page read did not state one.
- RAID usable capacity (n minus 1, n minus 2) is arithmetic from single and double parity. The vendor pages give minimum
  disks and failures survived, not the formula. Intel says RAID 6 can start at 3 disks, Dell says 4: the chapter gives 4
  and notes the exception.
- Availability = MTBF / (MTBF + MTTR) follows the d5 card. The ReliaSoft page read gives MTBF + MTTR as the cycle but
  not the ratio itself.
- Loopback 127.0.0.0/8 and ::1, the L2TP "no encryption of its own" note, the PKCS #7 (.p7b) and DER rows are standard
  facts whose defining documents (RFC 1122, 4291, 3193, 2315, X.690) were not opened this session.
- Quantitative risk formulas (SLE, ALE) and the log source table rest on the reviewed cards only.
- NIST IR 8547 is still an initial public draft; the chapter calls it a draft plan.
- Recovery site ready times are relative (long, medium, short) because SP 800-34 gives no hours.
- LEAP is listed only as an acronym. No primary source on it was read, so no claim is made.
- The wireless topic has no 802.11 radio standards table (a, b, g, n, ac, ax and bands): no primary source for it
  could be read, so it was left out.

## Cards that look wrong
None found. Note for reviewers: the acronym list expands CVE, DES, ESP and HMAC differently from the standards; the
chapter lists both forms in its last section.
