# d4a chapter (objectives 4.1 to 4.5): accuracy review 2 (r8 -> r9)

Reviewed: `knowledge/d4a-knowledge.r8.md` and `reviews/d4a-kb-review1.md`. Corrected pass: `knowledge/d4a-knowledge.r9.md`.
Second, independent reviewer (did not write the chapter or review 1). Date: 2026-11-16.
This run was interrupted once by a usage limit. On resume, r9 was checked byte for byte against r8 (no partial edits had
been written), the edits were applied in one scripted pass that asserts each target sentence occurs exactly once, and the
format checks below were rerun on the finished file.

How sources were read: every source below was downloaded or fetched by this reviewer in this session (PDFs converted to
text and searched; RFCs and the NVD API as text; web pages fetched one by one). Nothing was taken from earlier downloads.

## Sources read in this review

| Key | Source |
|---|---|
| 124 | NIST SP 800-124 Rev. 2 (nvlpubs.nist.gov, SpecialPublications/NIST.SP.800-124r2.pdf), section 5.1.3 |
| 187 | NIST SP 800-187, LTE security (nvlpubs.nist.gov), sections 3.4, 4.2, 4.3, 5.3 |
| 40r4 | NIST SP 800-40 Rev. 4 (nvlpubs.nist.gov), risk responses and patching text |
| CMOB | CISA, Mobile Communications Best Practice Guidance, December 2024 (cisa.gov PDF) |
| CVD | CISA coordinated vulnerability disclosure process page (cisa.gov) |
| KEV | CISA KEV catalog page and BOD 22-01 page (cisa.gov) |
| MIRAI | CISA alert on Mirai and other botnets, October 2016 (cisa.gov) |
| EPSS | FIRST EPSS overview page (first.org/epss) |
| CVSS4 | FIRST CVSS v4.0 specification document (first.org), metric groups and version history |
| NVD | NVD API records for CVE-2024-6387 and CVE-2021-44228 (services.nvd.nist.gov) |
| GP | Microsoft Learn, Group Policy processing (windows-server/identity/ad-ds/manage/group-policy) |
| WPA3V | Controller maker's WPA3 deployment guide (cisco.com, wireless controller 9800 technical reference, wpa3-dg) |
| DRAG | Dragonblood research page on WPA3 SAE side channels (wpa3.mathyvanhoef.com) |
| R9110 | RFC 9110 section 3.7 (interception, also called transparent, proxy) |
| R8551 | RFC 8551 S/MIME 4.0 (X.509 certificates) |
| R4880 | RFC 4880 OpenPGP (trusted introducer signatures) |
| R9989 | RFC 9989 DMARC header (May 2026, obsoletes 7489 and 9091) |
| OIV | OWASP Input Validation Cheat Sheet (github, OWASP CheatSheetSeries) |
| OSAST | OWASP community page, source code analysis tools |
| OFUZZ | OWASP community page, fuzzing |
| CIS | CIS Benchmarks page (cisecurity.org) |
| OASIS | OASIS CTI documentation page (STIX and TAXII) |
| NCI | National Council of ISACs, about ISACs |
| WAZ | A FIM vendor's PCI DSS mapping page quoting requirement 11.5.2 (documentation.wazuh.com) |
| EDRV | Vendor ransomware rollback documentation (search results from several EDR vendors) |
| OUT | outline.md in this folder (penetration test knowledge levels) |

## 1. Review-1 changes re-checked

| Review-1 change | Verdict | Source read this session |
|---|---|---|
| CYOD: both usages stated (common usage company owned; NIST describes employee bought, ownership Employee) | CONFIRMED | 124 section 5.1.3.3: "A choose your own device (CYOD) device is purchased by an employee for personal use but selected from a list of devices provided by the enterprise"; "Device ownership status: Employee". COPE in 5.1.3.2: "Device ownership status: Organization". |
| WPA3 hash-to-element: the rule is for the 6 GHz band and the reason is side channels | CONFIRMED, reworded (see section 2) | WPA3V: Wi-Fi 6E and Wi-Fi 7 require hash-to-element, hunting and pecking cannot be used in a 6 GHz-only network, and it is "prone to brute force dictionary attacks". DRAG: timing and cache side channels in the Dragonfly handshake leak information used for dictionary attacks. Both are true, so the sentence now names the side channels AND the dictionary attack they enable. |
| "if asked which cipher WPA3 uses, pick GCMP" removed | CONFIRMED | WPA3V: WPA3-Personal 128-bit (CCMP) or GCMP-256; default enterprise CCMP-128; 192-bit mode GCMP-256 |
| PMF: Wi-Fi Alliance requires PMF support in new certified devices | CONFIRMED (accepted from review 1's read of wi-fi.org; WPA3V agrees PMF is mandatory in 6 GHz and Wi-Fi 7) | |
| Sanitization: purge preference sentence replaced | KEPT (review 1 read 800-88r2 in full; not re-downloaded here) | |
| Antivirus scenario: "behavior monitoring (behavior-based detection)" | CONFIRMED as consistent with the section's own list | |
| SCAP 1.4 final, CVSS v4.0 preferred | KEPT (review 1 read SP 800-126r4; not re-read) | |
| security.txt address described in words | CONFIRMED (no "http" text in r9) | |
| All "Security+ lists", "exam" and certification-body wording fixes | CONFIRMED (no matches left) | |

Review-1 fixes: none reverted; one (hash-to-element) reworded to be complete.

## 2. New changes in r9 (8 edits)

| Section | Before -> after | Why and source |
|---|---|---|
| Mobile connection methods | "in 4G the network can choose not to encrypt, and researchers showed that devices did not warn users" -> NIST SP 800-187 notes LTE leaves over-the-air encryption of user traffic as an operator option and the phone's ciphering indicator is not widely implemented, so users usually cannot tell | 187 section 3.4 ("is an operator option"; the ciphering indicator "is not widely implemented") and 5.3. "Researchers showed" had no source. MOST SERIOUS: it attributed a claim to unnamed research. |
| Mobile connection methods | "SIM swapping" named without explanation -> defined (the carrier is talked into moving the number to the attacker's SIM; the attacker then gets text-message codes; CISA advises a PIN and MFA on the carrier account). Fake base stations now also note the downgrade to 2G | CMOB (PIN for porting the number "a critical step in countering ... SIM-swapping"); 187 section 5.3 (rogue 2G base station downgrade) |
| WPA3 (intro) | "requires WPA3 support for Wi-Fi certified devices" -> "in newly certified Wi-Fi devices" | Agrees with the reference chapter d0 r9 ("required for new Wi-Fi certified devices") |
| WPA3-Personal and SAE | hash-to-element reason -> timing and cache side-channel leaks that let an attacker run a dictionary attack | WPA3V and DRAG (see section 1) |
| WPA3-Enterprise, transition mode and newer bands | Wi-Fi 7 stated flatly ("fully true on Wi-Fi 7 gear") -> "vendor deployment guides list" GCMP-256 with SAE-EXT-KEY (personal) and GCMP-256 (enterprise) for Wi-Fi 7 features, CCMP-128 still accepted for older clients | WPA3V; the Wi-Fi Alliance specification is behind a sign-in. Matches d0 r9's "vendor guides also list GCMP-256 for Wi-Fi 7 operation". |
| Protected management frames | "PMF is mandatory for WPA3 networks" -> "for WPA3-only networks ... (in WPA3 transition mode it is offered but not forced on WPA2 clients)" | Agrees with d0 r9's transition mode row; WPA3V |
| Wireless cryptographic protocols | GCMP-256 bullet and the "Common confusions" line: Wi-Fi 7 use stated as vendor-guide fact; "keeps CCMP-128 only so" (ambiguous "only") -> "CCMP-128 stays allowed there so older clients can still join" | WPA3V: "CCMP128 is allowed for backwards compatibility" |
| Dynamic analysis (DAST) and fuzzing | "OWASP describes DAST as especially good at ..." -> the same strengths stated without the attribution | The OWASP DAST page now returns 404; the attribution could not be checked. The strengths themselves are well established. The fuzzing sentence attributed to OWASP was CONFIRMED (OFUZZ: fuzzing finds "software implementation faults"; crashes, buffer overflows, DoS). |

## 3. Review-1 "not verified" items, checked now

| Item | Verdict | Source |
|---|---|---|
| 6 GHz: WPA2 and open not allowed; WPA3 or Enhanced Open; PMF mandatory | CONFIRMED (vendor) | WPA3V: "WPA2 is not permitted in 6 GHz operation", "PMF is mandatory in 6 GHz", OWE for open networks |
| Wi-Fi 7 GCMP-256, SAE-EXT-KEY, CCMP-128 for older clients | CONFIRMED (vendor), softened to "vendor guides" | WPA3V |
| Cellular encryption sentence | CORRECTED | 187 |
| SIM swapping | CONFIRMED, now defined | CMOB |
| Persistent vs dissolvable NAC agents | KEPT, not verified from a primary source | Only search-result text: one network vendor's posture documentation calls the dissolvable kind a "temporal" agent removed after assessment. Widely used terminology; card-backed. |
| Explicit vs transparent proxy | CONFIRMED | R9110 3.7: an interception proxy, "also commonly known as a transparent proxy", "is not chosen by the client" |
| EDR rollback "where the product supports it" | CONFIRMED (vendor) | EDRV: several EDR products document ransomware rollback; others do not, so "where supported" is right |
| S/MIME certificate authority vs PGP web of trust | CONFIRMED | R8551 (X.509 certificates, certification authorities); R4880 (signatures asserting a "trusted introducer") |
| Pen test knowledge levels | CONFIRMED | OUT lists known, partially known and unknown environment; white, gray, black box are the long-standing older names |
| CISA 45 days | CONFIRMED | CVD: "may disclose vulnerabilities as early as 45 days after the initial attempt to contact the vendor", when the vendor is unresponsive or will not set a reasonable timeframe |
| EPSS "probability 0 to 1, next 30 days" | CONFIRMED | EPSS |
| KEV due dates; CISA advice to all organizations | CONFIRMED | KEV: due dates for federal agencies (BOD 22-01: two weeks, or six months for CVE IDs before 2021); "Organizations should use the KEV catalog as an input to their vulnerability management prioritization framework". Note: the KEV page says BOD 26-04 (June 2026) now sets the federal timelines and carries forward the KEV criteria; the chapter states no timeline, so nothing changes. |
| PCI DSS v4 requirement 11.5.2 | CONFIRMED in substance (secondary) | WAZ quotes the requirement: change-detection mechanism, alert personnel to unauthorized modification of critical files, comparisons at least weekly. The PCI SSC document itself was not opened. |
| Group Policy 90 minutes plus up to 30; startup and sign-in | CONFIRMED | GP: "By default, a refresh occurs every 90 minutes. The system might add a random time of up to 30 minutes"; computer policy at start, user policy at logon; gpupdate triggers a refresh |
| CVE-2024-6387 = 8.1, race condition | CONFIRMED | NVD: CVSS 3.1 8.1 (AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:H), CWE-362 race condition |
| Log4Shell 10.0 and its vector | CONFIRMED | NVD: CVSS 3.1 10.0, CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H, exactly the chapter's vector |
| CVSS v4.0: published November 2023; Base, Threat, Environmental, Supplemental; attack requirements; vulnerable and subsequent systems; CVSS-B/BT/BE/BTE | CONFIRMED | CVSS4 (version history "2023-11-01 v1.0 Initial Publication") |
| Mirai and default passwords | CONFIRMED | MIRAI: a short list of 62 common default usernames and passwords |
| STIX 2.1 and TAXII 2.1; language vs transport over HTTPS | CONFIRMED | OASIS |
| ISACs: PDD-63 (1998), nonprofit, formed by critical infrastructure owners and operators | CONFIRMED | NCI (PDD-63 signed May 22, 1998) |
| CIS Benchmarks "more than 25 vendor product families", consensus | CONFIRMED | CIS |
| OWASP input validation (syntactic and semantic; allow lists; server side) | CONFIRMED | OIV |
| OWASP SAST strengths and weaknesses | CONFIRMED | OSAST: scales well, finds buffer overflows and SQL injection, points to file and line; trouble with authentication, access control and cryptography; many false positives; misses configuration; hard to prove a finding; needs compilable code |
| Patching is the only response that fully eliminates a vulnerability without removing functionality | CONFIRMED | 40r4: "the only forms of risk response that can completely eliminate the vulnerabilities without removing functionality"; four responses accept, mitigate, transfer, avoid |
| DMARC RFC 9989 (May 2026) replaced RFC 7489 | CONFIRMED | R9989 header (also obsoletes RFC 9091) |
| CVE Program run by MITRE, sponsored by CISA | KEPT | Search-result text only (2026 news: the CISA and MITRE contract was renegotiated in March 2026; CISA remains the sole federal sponsor). cve.org returned no readable text. |
| Typosquatting | KEPT as common knowledge | |

## 4. Agreement with the reference chapter (d0-knowledge.r9.md)

- Ports in d4a (RADIUS 1812, 1813, 1645, 1646; TACACS+ 49; SNMP 161 and 162; DoT 853; HTTPS 443): equal to d0 r9.
- WPA3: d4a now matches d0 r9 on every shared point: CCMP-128 minimum; GCMP-256 in the 192-bit mode; Wi-Fi 7 GCMP-256 as a
  vendor-guide statement; transition mode PMF offered but not forced on WPA2 clients; 6 GHz WPA3 or OWE, WPA2 not permitted,
  PMF mandatory; WPA3 required in new certified devices. d4a does not say EAP-TLS is "required" or "only" for 192-bit mode.
- TACACS+: d4a already calls the body protection obfuscation (RFC 8907), as d0 r9 now does.
- IPsec AH: d4a never mentions AH (only "IPsec or TLS based" VPN tunnels), so nothing contradicts d0's "optional and
  discouraged" row.
- Windows logon type 8: d4a never mentions logon types.
- CVSS bands and the Log4Shell example: equal to d0 r9 (d0 now also uses CVE-2021-44228 as its example).
- d0 itself: no error found in the rows d4a shares.

## 5. Learner read

All 115 sections read once more as a beginner would. Each stands alone, expands its acronyms, and has one answer per
scenario. No change was needed beyond section 2. The CYOD scenario ("the firm pays") stays consistent with the section's
own rule ("when a situation states who pays or owns, follow it").

## 6. Format checks on r9

First two lines correct. 115 `###`/`####` sections, largest 3,175 characters, no duplicate headings, longest heading 100
characters. No em or en dashes, no "http://" or "https://" text, no HTML, no question-and-answer blocks, no "exam" wording,
no course or instructor names. 8-word overlap with outline.md: 0. New sentences are the reviewer's own wording. r8 is unchanged.

## 7. Still not verified from a primary source

- Wi-Fi Alliance specification text (WPA3, Wi-Fi 7, 6 GHz rules): behind a sign-in; the chapter rests on one controller
  maker's deployment guide and says so ("vendor deployment guides").
- Persistent and dissolvable NAC agents (search-result text only).
- PCI DSS 11.5.2: the PCI SSC document was not opened; a vendor page quoting it was.
- CVE Program operator and sponsor in 2026: news results only.
- Microsoft's EDR keeping telemetry "for months": not re-read.
- Items review 1 read and this review did not re-read: SP 800-88r2 details, SP 800-126r4 (SCAP 1.4), SP 800-92, 800-94,
  800-83, 800-41r1, 800-115, RFC 7208, 6376, 8314, 7858, 2865, 8907, 4851, 8110, 9116.
- Cards were not re-read in this pass; review 1 found none wrong (one CYOD note, see review 1).
