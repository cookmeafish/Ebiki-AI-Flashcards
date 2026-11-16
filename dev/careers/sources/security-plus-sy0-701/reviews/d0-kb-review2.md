# d0 reference chapter: accuracy review 2 (r8 -> r9)

Reviewed: `knowledge/d0-knowledge.r8.md` and `reviews/d0-kb-review1.md`. Corrected pass: `knowledge/d0-knowledge.r9.md`.
Second, independent reviewer (did not write the chapter or review 1). Date: 2026-11-16.

How sources were read: every source below was downloaded by this reviewer in this session (the IANA registries, the
Baseline Requirements text, 37 RFCs and 14 NIST publications as full text and searched for each claim; web pages
fetched one by one). Nothing was taken from the writer's or the first reviewer's downloads.

Format checks on r9: first two lines correct, 49 headings, none repeated, longest 98 characters, largest section 2,577
characters, no em or en dashes, no links, no "http", no HTML, no question-and-answer blocks. r8 is unchanged.

## 1. Review-1 changes re-checked

| Review-1 change | Verdict | Source read this session |
|---|---|---|
| IR 8547 is FINAL, published 27 October 2026 | CONFIRMED | csrc.nist.gov/pubs/ir/8547/final (history "10/27/26: IR 8547 (Final)"); the draft page says "Obsoleted on October 27, 2026 by IR 8547"; PDF cover dated October 2026 (nvlpubs.nist.gov/nistpubs/ir/2026/NIST.IR.8547.pdf) |
| IR 8547 deprecates ALL quantum-vulnerable public key algorithms after 2030 and disallows them after 2035, at every strength | CONFIRMED | PDF section 4.1.1: "NIST will instead deprecate all quantum-vulnerable digital signature algorithms after 2030 and disallow their use ... after 2035"; section 4.1.2: "NIST will deprecate all quantum-vulnerable cryptography after 2030 and disallow its use ... after 2035". Tables 2 and 4 list ECDSA, EdDSA, RSA, finite field and elliptic curve DH and MQV. Deprecated and disallowed definitions match the chapter. Section 4.1.3 supports "symmetric at 128 bits or more stays". |
| Kerberos wording; kpasswd 464 UDP and TCP | CONFIRMED | IANA registry: kerberos 88 tcp and udp (RFC 4120); kpasswd 464 tcp and udp |
| NetBIOS row "in use: UDP 137, UDP 138, TCP 139" | CONFIRMED | IANA registers 137, 138, 139 on both transports (netbios-ns, netbios-dgm, netbios-ssn); the "in use" split is the usual one and matches the CISA WannaCry alert (UDP 137 and 138, TCP 139 and 445) |
| AH "optional: must support ESP, may support AH" | CONFIRMED, then extended (see section 2) | RFC 4301 line "IPsec implementations MUST support ESP and MAY support AH" |
| L2TP and PPTP deprecation wording | CONFIRMED | Vendor post (techcommunity.microsoft.com, October 2024): deprecated for future Windows Server versions, still available; replacements SSTP and IKEv2. RFC 3193 for L2TP needing IPsec. |
| Loopback RFC 1122 and RFC 4291 | CONFIRMED (accepted from review 1's own read; RFC 1918 and RFC 3927 ranges re-read here) | rfc-editor.org |
| SHA-1 date 15 September 2026 (CA/Browser Forum) | CONFIRMED, wording tightened (see section 2) | Baseline Requirements 2.3.1 (github.com/cabforum/servercert, docs/BR.md): ballot SC097 "Sunset all remaining use of SHA-1 signatures in Certificates and CRLs"; dates table "2026-09-15 ... Sunset all remaining use of SHA-1 in Certificates and CRLs"; section 7.1.3.2.1 "Prior to 2026-09-15, the CA SHALL revoke any unexpired Subordinate CA Certificate that contains RSASSA-PKCS1-v1_5 with SHA-1" |
| SHA-1 "disallowed by NIST for creating digital signatures" | CONFIRMED | SP 800-131A r2 section 9 (r3 is still a draft: csrc.nist.gov/pubs/sp/800/131/a/r3/ipd) |
| TLS certificate validity table (398, 200, 100, 47 days by issue date) and "version 2.3.1, October 2026" | CONFIRMED, every cell | BR.md header "Version 2.3.1", effective 2026-10-04; section 6.3.2: issued before 2026-03-15 max 398 days; 2026-03-15 to before 2027-03-15 max 200; 2027-03-15 to before 2029-03-15 max 100; on or after 2029-03-15 max 47 |
| WPA row: vendor remark removed | CONFIRMED (no fact involved) | |
| 192-bit mode: P-384 and RSA 3072 | PARTLY CONFIRMED, wording adjusted (see sections 2 and 4) | The Wi-Fi Alliance specification redirects to a sign-in page. Vendor references agree on P-384, RSA and DH of at least 3072 bits, GCMP-256 and three permitted TLS cipher suites. |
| LEAP row | KEPT | Not verifiable from a primary source (see section 4) |
| Wi-Fi radio standards table (new in r8) | CONFIRMED | Chip maker support article (intel.com, article 000005725): 802.11b 2.4 GHz 11 Mbps; 802.11a 5 GHz 54 Mbps; 802.11g 2.4 GHz 54 Mbps; 802.11n 2.4 or 5 GHz, 20 and 40 MHz, MIMO; 802.11ac 5 GHz, up to 160 MHz and multi-user MIMO in wave 2; 802.11ax 2.4 or 5 GHz, multi-user MIMO, named Wi-Fi 6 |
| RAID 6 minimum 4 disks | CONFIRMED | Server maker's RAID introduction (lenovopress.lenovo.com/lp0578): RAID 0 min 2, none; RAID 1 min 2, one; RAID 5 min 3, one, n minus 1; RAID 6 min 4, two, n minus 2; RAID 10 min 4, one per span, half. SNIA dictionary text for RAID 6 ("survive any two storage device failures") seen in search results only. |
| Inherent availability = MTBF / (MTBF + MTTR) | CONFIRMED as far as sources allow | NASA KSC note read: inherent availability uses MTBF and repair time only. The ratio itself is the standard definition (uptime over uptime plus downtime). |
| Hot site "hardware, infrastructure and support staff" | CONFIRMED | SP 800-34 r1 section 3.4.3 (cold, warm, hot, mirrored definitions read; "RTO must normally be shorter than the MTD" also read) |
| SP 800-115 four phases, reporting alongside; SP 800-61r3 old life cycle; SP 800-88r2 clear, purge, destroy | CONFIRMED | Texts read: SP 800-115 section 5.2.1 and "The reporting phase occurs simultaneously with the other three phases"; SP 800-61r3 Table 1; SP 800-88r2 (cryptographic erase is a purge technique; destroy list disintegrate, incinerate, pulverize, shred, melt) |
| SOC 2 Type 2 "a span of months" | KEPT | No AICPA text reachable (see section 4) |
| ISO/IEC 27001:2013 transition end 31 October 2025 | CONFIRMED | IAF MD 26: 36 months from the last day of the publication month; old certificates "expire or be withdrawn at the end of the transition period" |
| SP 800-63B-4 numbers | CONFIRMED, every row | pages.nist.gov/800-63-4/sp800-63b.html: 15 characters single factor, eight with MFA, SHOULD permit at least 64, SHALL NOT impose composition rules, SHALL NOT require periodic change, SHALL compare against a blocklist, no more than 100 consecutive failed attempts |
| Acronym table edits | CONFIRMED | acronyms.txt in this folder: CTM Counter Mode, CVE Common Vulnerability Enumeration, DES Digital Encryption Standard, ESP Encapsulated Security Payload, HMAC Hashed Message Authentication Code, MTTR Mean Time to Recover; outline.md 5.2 "Mean time to repair (MTTR)" |

Review-1 fixes: 19 re-checked, 19 confirmed, 0 reverted. Three of them were reworded further (AH, SHA-1, 192-bit mode).

## 2. New changes in r9 (13 edits)

| Section | Before -> after | Why and source |
|---|---|---|
| VPN and tunneling ports | AH status "Current but optional" -> "Optional and discouraged ... NIST's IPsec guide (SP 800-77 revision 1) discourages AH and recommends ESP with null encryption when only integrity is wanted"; the confusion line now also says so | SP 800-77r1 (nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-77r1.pdf): "NIST discourages the use of AH in this publication ... It is recommended that null encryption with the ESP ..." and "ESP with null encryption (ESP-NULL) or AES-GMAC should be used". MOST SERIOUS: other chapters compare their AH wording to this row. |
| Windows event IDs and logon types | Logon type 8 "Network with the password sent in clear text" -> "Network cleartext: the password reached the server's authentication package unhashed (for example basic authentication to a web server)" | The vendor's event 4624 page (learn.microsoft.com, event-4624): "The user's password was passed to the authentication package in its unhashed form ... The credentials don't traverse the network in plaintext". The old wording stated the opposite of the last sentence. |
| Network service ports | TACACS+ "Encrypts (the standard says obfuscates) the whole message body" -> "Hides the whole message body (often described as encrypting it; the standard, RFC 8907, calls it obfuscation and it is weak by modern measures)" | RFC 8907 section 4.5 "Data Obfuscation"; TCP 49 confirmed in the same RFC |
| Network service ports | RADIUS accounting row gains "Older gear used UDP 1646" | RFC 2866 (the authentication row already had 1645 from RFC 2865) |
| Hash functions | SHA-1 row: "end every remaining SHA-1 signature in public TLS certificates and CRLs" -> "end all remaining use of SHA-1 signatures in publicly trusted certificates and CRLs"; added "NIST plans to retire it for every use by the end of 2030" | BR 2.3.1 (the remaining uses are CA certificates, cross certificates and CRLs, not server certificates); NIST news item of December 2022 ("should be phased out by Dec. 31, 2030") and IR 8547 footnote 4 |
| Asymmetric algorithms | Added one sentence naming the replacements: ML-KEM, ML-DSA, SLH-DSA | IR 8547 Table 3 and section 4.1.2 |
| Wi-Fi security generations | WPA3 row: added "(vendor guides also list GCMP-256 for Wi-Fi 7 operation)" | Controller maker's WPA3 deployment guide (cisco.com, wpa3-dg): Wi-Fi 7 personal and enterprise use GCMP-256. Removes the gap review 1 noted against a wireless card. |
| WPA2 and WPA3 modes | Transition mode "PMF optional" -> "PMF is offered but not forced on WPA2 clients (SAE clients use it)" | Same vendor guide; "optional" alone read as if SAE clients could skip PMF |
| WPA2 and WPA3 modes | 192-bit mode "EAP-TLS only" -> "802.1X with EAP-TLS (certificates on server and client)" | The specification is not readable; vendor references list TLS cipher suites and document EAP-TLS. "Only" could not be supported from a primary source. |
| WPA2 and WPA3 modes | 6 GHz row gains "WPA2 is not permitted" | Same vendor guide: "WPA2 is not permitted in 6 GHz operation", "PMF is mandatory in 6 GHz" |
| EAP methods | EAP-TLS note "required for WPA3-Enterprise 192-bit" -> "the method used for WPA3-Enterprise 192-bit mode" | Same reason as above |
| CVSS severity ranges | Example identifier "CVE-2026-12345" (invented, may collide with a real record) -> "CVE-2021-44228 (the Log4Shell flaw)" with the format spelled out | Avoids teaching a made-up record number |
| VPN and tunneling ports | "Common confusion" -> "Common confusions" with the AH line | Follows from the AH fix |

## 3. Passed again with a primary source read this session (no change)

- Ports, every row of all five port tables, against the IANA registry CSV: 20, 21, 22, 23, 25, 49, 53, 67, 68, 69, 80,
  88, 110, 123, 137 to 139, 143, 161, 162, 389, 443, 445, 464, 465, 500, 514 (udp syslog), 587, 636, 853, 989, 990,
  993, 995, 1194, 1433, 1701, 1723, 1812, 1813, 2049, 3268, 3269, 3306, 3389, 4500, 4739 (udp, tcp, sctp), 5004, 5005,
  5060, 5061, 5432, 5985, 5986, 6514, 8080. IP protocol numbers 1, 6, 17, 47, 50, 51, 58 against the IANA protocol
  registry. Kerberos, NetBIOS, LDAP, SNMP, syslog, RADIUS and TACACS+ rows all match.
- RFCs read: 3227 (order of volatility, same seven lines), 5424 (severity table, 165 = local4 Notice), 4226, 6238,
  4120 (5 minute skew), 8446 (five suites, static RSA removed), 7465, 7568, 8996 (March 2021), 9325 (TLS 1.2 MUST,
  TLS 1.3 SHOULD), 8907, 2865, 2866, 4301, 4303, 2104, 8110, 4851, 1918, 3927, 5425, 5426, 4217, 7208, 6376, 7489,
  9114, 8439, 8314, 3193, 3948, 7296, 8484, 3711.
- NIST: SP 800-57 Part 1 r5 Table 2 (all five rows), SP 800-131A r2 (three-key TDEA, SHA-1), SP 800-67r2 withdrawal
  1 January 2024, FIPS 186-5 (DSA), FIPS 197 (10, 12, 14 rounds), FIPS 46-3 withdrawn 19 May 2005, SP 800-38A (IV
  rules), SP 800-38D (96-bit IV), SP 800-97 (WEP 40 or 104 bit key, 24-bit IV), CSF 2.0 (six functions), SP 800-37r2
  (seven steps).
- OWASP Password Storage Cheat Sheet (all five settings), CERT VU#723755 (8 digits, halves, checksum, 11,000, turn off
  the external registrar), FIRST CVSS 3.1 and 4.0 severity tables, GDPR articles 33 and 83 (EUR-Lex), CIS Controls
  (18), PCI DSS scope (PCI SSC page), Windows event titles 4624, 4625, 4672, 4720, 4740, 1102 and logon types 2, 3, 4,
  5, 7, 10, 11, WannaCry and SMBv1 on 445 (CISA alert), "WPA3 is mandatory for Wi-Fi CERTIFIED devices" and PMF
  required (wi-fi.org security page), OWE (RFC 8110 plus the vendor guide).
- Arithmetic rechecked: RAID capacity rows, recovery metric rows, availability table, ALE example, PBKDF2 example,
  syslog priority.

## 4. Still not verified from a primary source

- WPA3 internals. The Wi-Fi Alliance WPA3 specification and its generation naming guide redirect to a sign-in page.
  The 192-bit mode details (GCMP-256, SHA-384, P-384, RSA 3072, EAP-TLS), transition mode behaviour, the 6 GHz rules
  and the Wi-Fi 7 note rest on vendor documentation that agrees with itself. Wi-Fi 4 and Wi-Fi 5 as names for 802.11n
  and 802.11ac were seen only as search-result text quoting the Alliance guide.
- ISO/IEC 27001:2022 Annex A counts (93 = 37 + 8 + 14 + 34) and the ISO/IEC 27002 row. iso.org answers 403 and the
  standard is paid. Every secondary source found agrees (control numbering A.5.1 to A.5.37, A.6.1 to A.6.8, A.7.1 to
  A.7.14, A.8.1 to A.8.34). Kept.
- SOC 2 Type 1 and Type 2 definitions. The AICPA pages reachable name only the five categories; the definitions are
  in a paid guide. Kept as the standard, widely published meaning. Note: the AICPA page links an exposure draft of
  proposed 2027 SOC 2 criteria; nothing in the chapter depends on it.
- LEAP as legacy and password only; PEAP commonly carrying MSCHAPv2; WPA2-Personal deriving its key with PBKDF2 and
  HMAC-SHA1 (SP 800-97 points to the IEEE annex without naming the function). Well established, not read in a primary
  text here.
- The 2017 public SHA-1 collision (the NIST item says only "in recent years"), IDEA and RIPEMD-160 sizes, certificate
  file format table, SLE, ARO and ALE formulas, the log source table, the 3-2-1 rule: well established, no primary
  source opened.
- The availability ratio and MTBF, MTTF wording: standard definitions; the NASA note confirms the inputs only.
- RAID: a server maker's guide, not a standards body (the SNIA dictionary pages did not load).
- Cards were not re-read in this pass; review 1 found none wrong.

## 5. Notes for the other chapters

- Compare AH wording to the new d0 row (optional, discouraged by NIST, ESP with null encryption instead).
- Logon type 8 must not be described as a password crossing the network in clear text.
- TACACS+ "encrypts the whole payload" is acceptable shorthand, but the standard's own word is obfuscation.
