# d4a chapter (objectives 4.1 to 4.5): accuracy review 1 (r7 -> r8)

Reviewed: `knowledge/d4a-knowledge.r7.md`. Corrected pass: `knowledge/d4a-knowledge.r8.md`. Reviewer did not write the chapter.
Date: 2026-11-16.

How sources were read: the NIST publications and RFCs named below were downloaded by the reviewer in this review
(PDF to text, then each claim searched in the text). Web pages marked "fetched" were read through a page fetch.
Card comparison: `cards/d4a-cards.r5.json` and `cards/d4a-extras.r7.json`, every card of an objective read beside its sections.

## Sources read in this review

| Key | Title | URL |
|---|---|---|
| 124 | NIST SP 800-124 Rev. 2, mobile device security | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-124r2.pdf |
| 121 | NIST SP 800-121 Rev. 2, Bluetooth security | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-121r2.pdf |
| 153 | NIST SP 800-153, WLAN security guidelines | https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-153.pdf |
| 187 | NIST SP 800-187, LTE security | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-187.pdf |
| 97 | NIST SP 800-97, IEEE 802.11i robust security networks | https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-97.pdf |
| 88 | NIST SP 800-88 Rev. 2, media sanitization (September 2025) | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-88r2.pdf |
| 92 | NIST SP 800-92, log management | https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-92.pdf |
| WFA | Wi-Fi Alliance security page (fetched) | https://www.wi-fi.org/security |
| GLO | NIST glossary, CCMP (fetched) | https://csrc.nist.gov/glossary/term/ccmp |
| R2865 | RFC 2865 RADIUS | https://www.rfc-editor.org/rfc/rfc2865.txt |
| R8907 | RFC 8907 TACACS+ | https://www.rfc-editor.org/rfc/rfc8907.txt |
| R4851 | RFC 4851 EAP-FAST | https://www.rfc-editor.org/rfc/rfc4851.txt |
| R8110 | RFC 8110 Opportunistic Wireless Encryption | https://www.rfc-editor.org/rfc/rfc8110.txt |
| H2E | Vendor WPA3-Personal design page (search result text) | https://arubanetworking.hpe.com/techdocs/aos/wifi-design-deploy/security/modes/wpa3-personal/ |

(More rows are added per objective below.)

## 4.1 Result per section

| Section | Result | What changed (before -> after) and source |
|---|---|---|
| Secure baseline life cycle | PASS | Matches the baseline cards. |
| Hardening workstations and servers | FIXED | Doubled expansion "CIA (confidentiality, integrity, availability) triad (confidentiality, integrity, availability)" -> one expansion. |
| Hardening switches and routers | PASS | |
| Hardening cloud infrastructure | PASS | |
| Hardening mobile devices | PASS | "untrusted unless secured and continuously monitored": 124 section 3.1.7. |
| Hardening ICS/SCADA | PASS | |
| Hardening embedded systems, RTOS and IoT | PASS | |
| Hardening targets compared | FIXED | Rule wording "the exam and real work reward" -> "good security work means". |
| Choosing a computing-resource technique | FIXED | Rule wording "scenario questions hide one decisive clue" -> "most real situations contain one decisive constraint". |
| Wireless site surveys | PASS | Yearly overall, quarterly periodic unless continuous monitoring: 153 lines 188 to 189. |
| Wireless heat maps | PASS | |
| Mobile device management (MDM) | PASS | MAM and privacy: 124 line 1256. |
| Mobile deployment models: BYOD vs COPE vs CYOD | FIXED | SERIOUS. Table cell "Company in the usual exam meaning" and the sentence "use the exam meaning" removed (rule wording). Now states both usages plainly: common usage (company buys and owns, as the cards say) and 124 section 5.1.3.3 ("purchased by an employee for personal use but selected from a list", "Device ownership status: Employee"). The confusion line "Choose is about selection, not ownership" -> selection from an approved list, which does not by itself fix ownership. "Security+ lists" -> "This objective covers". |
| Mobile connection methods: cellular and Wi-Fi | PASS | Rogue (fake) base stations: 187 section 4.2. SIM swapping and the 4G no-encryption remark: see "Not verified". |
| Bluetooth | PASS | Bluejacking, bluesnarfing, bluebugging and "undiscoverable except when needed": 121 lines 2056 to 2083 and table item 18. |
| WPA3 (three headings) | FIXED | (1) "Wi-Fi 6E and Wi-Fi 7 require hash-to-element ... because hunting-and-pecking is open to dictionary attack" -> the rule is for the 6 GHz band, and the reason is timing side channels that leak information about the passphrase (H2E). (2) "if asked which cipher WPA3 uses, pick GCMP" (test-taking advice, and it contradicts the CCMP-128 minimum) -> the precise statement. WPA3 mandatory, PMF facts: WFA. |
| Protected management frames | FIXED | "mandatory ... for all newly certified Wi-Fi devices" -> the Wi-Fi Alliance requires PMF support in new certified devices (WFA: "PMF is required for all new certified devices"; a network can still set it optional). "beacons ... remain unprotected" narrowed to what 802.11w covers. |
| AAA and RADIUS in enterprise Wi-Fi | PASS | 1812, 1645: R2865. |
| RADIUS vs TACACS+ | FIXED | Rule wording "Exam material often says" -> "Study material often says". Obfuscation and "no meaningful integrity, privacy, or replay protection": R8907 lines 491 to 499 and 1808. |
| Wireless cryptographic protocols | PASS | CCMP expansion: GLO and 97; TKIP as the interim fix for existing hardware, CCMP the long-term solution: 97 lines 778 and 1904. |
| Wireless authentication protocols | PASS | PAC: R4851. |
| EAP methods compared | PASS | Same as the reference chapter's EAP table. |
| Choosing wireless security settings | FIXED | Rule wording "wireless questions usually contain one clue" -> "a wireless requirement usually contains one decisive clue". OWE encrypts without authentication: R8110. |
| Input validation | FIXED | Rule wording "On the exam, input validation is the usual answer" -> plain statement that it is the usual first defense and the primary fixes are parameterized queries and output encoding. |
| Secure cookies | PASS | Matches the card. |
| Static code analysis | PASS | |
| Code signing | PASS | |
| Sandboxing | PASS | |

## 4.2 Result per section

| Section | Result | What changed (before -> after) and source |
|---|---|---|
| Acquisition and procurement process | PASS | |
| Asset ownership and classification | PASS | |
| Asset inventory | PASS | |
| Asset enumeration | PASS | |
| Asset inventory vs enumeration vs vulnerability scanning | PASS | |
| Disposal and decommissioning | FIXED | "Security+ lists its parts as" -> "This objective breaks it into". |
| Sanitization of media (clear and purge) | FIXED | "NIST says purge should be preferred to clear when possible": not in 88 Rev. 2 -> replaced by what section 3.1 says (consult current standards such as IEEE 2883; use purge or destroy when more assurance is needed). "In Security+ terms" reworded. Degaussing limits: 88 lines 674 to 683. |
| Cryptographic erase (CE) | PASS | 128 bits, no plaintext ever stored, high assurance much faster, logical storage: 88 lines 741, 766, 814, 817. |
| Destruction of storage media | PASS | Five techniques, drilling and bending, density warning, degaussing not destroy: 88 lines 713 to 733, 683. |
| Certification of sanitization and destruction | PASS | 88 Appendix C and line 1441. |
| Data retention at disposal | PASS | |
| Clear vs purge vs destroy | FIXED | "Security+ sanitization often means" reworded. SSD degauss example: 88 line 1388. |

## 4.3 Result per section

Extra sources: NIST SP 800-40 Rev. 4 (https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-40r4.pdf), NIST SP 800-115
(https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-115.pdf), RFC 9116 (https://www.rfc-editor.org/rfc/rfc9116.txt).

| Section | Result | What changed (before -> after) and source |
|---|---|---|
| Vulnerability management life cycle | PASS | Four planning scenarios: 800-40r4 section 3.5 (routine patching, emergency patching, emergency mitigation, unpatchable assets). |
| Vulnerability scan | PASS | |
| Credentialed vs non-credentialed scans | PASS | Matches the extra card. |
| Dynamic analysis (DAST) and fuzzing | PASS | |
| Package monitoring (SCA and SBOM) | PASS | Typosquatting kept as common knowledge, see "Not verified". |
| SAST vs DAST vs package monitoring | PASS | |
| Threat feeds (STIX and TAXII) | FIXED | "Security+ groups feed sources as" -> "This objective groups". |
| OSINT threat feeds | PASS | |
| Proprietary and information-sharing threat feeds | FIXED | "Two Security+ feed types" -> "Two feed types in this objective". |
| Dark web monitoring | PASS | |
| OSINT vs proprietary vs ISAC vs dark web | FIXED | "Security+ lists four" -> "This objective names four". |
| Penetration testing as vulnerability identification | PASS | Rules of engagement template: 800-115 Appendix B. Knowledge levels match the card. |
| Scan vs penetration test vs audit | PASS | |
| Responsible disclosure program | FIXED | The mini-example held a full web address with the secure web scheme (the build refuses it) -> described in words. security.txt fields per RFC 9116. |
| Bug bounty program | PASS | |
| System and process audit | PASS | |
| Confirmation of findings | PASS | |
| CVE identifiers | FIXED | Named the certification body ("The CompTIA acronym list") -> "The published SY0-701 acronym list", and says both names mean the same list. |
| CVSS | PASS | Bands equal the reference chapter's table. |
| CVE vs CVSS vs CWE | FIXED | Same wording fix as CVE. |
| Prioritizing vulnerabilities | PASS | |
| Vulnerability classification | PASS | |
| Exposure factor (EF) | PASS | Arithmetic rechecked (200,000; 50,000; 60,000). |
| Environmental variables, impact, risk tolerance | PASS | |
| Patching | PASS | Canary assets, grace period, "only forms of risk response that can completely eliminate": 800-40r4 lines 374, 917 to 940. |
| Segmentation and compensating controls | FIXED | Rule wording "the exam lists them separately" -> "this objective names them as two responses". |
| Cybersecurity insurance | PASS | Transfer example: 800-40r4 line 358. |
| Exceptions and exemptions | PASS | |
| Patching vs segmentation vs ... | FIXED | "Security+ lists five" -> "This objective names five". Four risk responses: 800-40r4 lines 348 to 363. |
| Validation of remediation | FIXED | "Security+ lists three" -> "This objective names three". |
| Vulnerability reporting | PASS | |

## 4.4 Result per section

Extra sources: NIST SP 800-126 Rev. 4 and its annex 800-126A Rev. 4 (https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-126r4.pdf,
https://csrc.nist.gov/pubs/sp/800/126/r4/final fetched), NIST SP 800-94 (https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-94.pdf),
NIST SP 800-83 Rev. 1 (https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-83r1.pdf), RFC 5424, RFC 3954, RFC 7011, RFC 3416 (rfc-editor.org).

| Section | Result | What changed (before -> after) and source |
|---|---|---|
| Monitoring computing resources | FIXED | Doubled CIA expansion removed; "Security+ splits" -> "This objective splits". |
| Log aggregation | FIXED | "in Security+ usage" reworded. Time normalization, event aggregation: 800-92 lines 1105, 1179. The mini-example priority 86 = facility 10 x 8 + severity 6, consistent with RFC 5424; severities 0 to 7: RFC 5424 Table 2. |
| Alerting and alert tuning | PASS | False positive and negative: 800-94 lines 641, 896. |
| Scanning, reporting and archiving | PASS | Retention vs preservation: 800-92 lines 1129 to 1131. |
| Quarantine (alert response) | PASS | 800-83r1 lines 919 and 2052. |
| SCAP | PASS (checked twice) | "Current release SCAP 1.4, prefers CVSS v4.0, still supports v3.1" is RIGHT: SP 800-126 Rev. 4 became final on 2026-06-08 and says CVSS v4.0 is preferred for newly authored content (lines 577 to 579). A summary of the NIST releases page wrongly called 1.4 a draft; the reviewer briefly changed the sentence, then restored it after reading the final publication, adding the document and date. |
| Security benchmarks | PASS | |
| Agent-based vs agentless monitoring | PASS | Persistent and dissolvable agents: card-backed, see "Not verified". |
| SIEM | PASS | |
| Antivirus | FIXED | Scenario answer "behavior-based (heuristic) detection" mixed two methods that the same section lists separately -> "behavior monitoring (behavior-based detection)". Centrally managed antivirus: 800-83r1 line 936. |
| DLP as a monitoring tool | PASS | |
| SNMP traps | PASS | Ports equal the reference chapter. |
| NetFlow (and IPFIX) | PASS | |
| Vulnerability scanners | PASS | |
| SIEM vs NetFlow vs SNMP traps vs syslog | PASS | |
| Antivirus vs EDR vs XDR vs SIEM vs DLP | PASS | |

## 4.5 Result per section

Extra sources: NIST SP 800-41 Rev. 1 (https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-41r1.pdf), RFC 7208, RFC 6376,
RFC 9989, RFC 8314, RFC 7858, RFC 8484 (rfc-editor.org).

| Section | Result | What changed (before -> after) and source |
|---|---|---|
| Firewall rules | PASS | Matches the card and 800-41r1. |
| Access control lists (ACLs) | PASS | |
| Ports and protocols in firewall policy | PASS | No port numbers that differ from the reference chapter. |
| Screened subnet | PASS | |
| IDS and IPS | PASS | Three detection methods: 800-94. |
| IDS/IPS signatures and trends | PASS | |
| Signature-based vs anomaly-based detection | FIXED | Rule wording "grouped with behavior-based methods on the exam" -> without "on the exam". |
| Web filter deployment | PASS | Explicit and transparent proxy: card-backed, see "Not verified". |
| Web filter techniques | FIXED | "The objectives write URL as" -> "The published SY0-701 acronym list writes". |
| Group Policy | PASS | |
| SELinux | PASS | |
| Implementing secure protocols | FIXED | "Security+ splits it" -> "This objective splits it". Implicit TLS preference: RFC 8314. |
| DNS filtering | PASS | |
| Encrypted DNS (DoH and DoT) | PASS | Port 853: RFC 7858; equals the reference chapter. |
| SPF | PASS | Softfail is a weak statement: RFC 7208 sections 2.6.5 and 8.5; limit of 10: RFC 7208 line 937. |
| DKIM | PASS | |
| DMARC | FIXED | Named the certification body -> "The published SY0-701 acronym list". RFC 9989, May 2026, obsoletes RFC 7489: header of RFC 9989 read. |
| SPF vs DKIM vs DMARC | PASS | |
| Email gateway | PASS | |
| Email encryption: S/MIME and PGP | PASS | |
| File integrity monitoring (FIM) | FIXED | Same acronym-list wording fix. |
| DLP policy configuration | PASS | |
| Network access control (NAC) | PASS | Credentials plus health checks, limited access on failure: 800-41r1 lines 727 to 760. |
| EDR and XDR | PASS | |
| User behavior analytics | PASS | |
| Choosing an enterprise capability | PASS | |
| Patching vs segmentation vs ... (4.3, found on the last read) | FIXED | "names four risk responses (accept, mitigate, transfer, avoid); the fifth idea, avoid" contradicted itself -> "the one with no row in this table, avoid". |

## Comparison with the reference chapter (d0-knowledge.r8.md)

- Ports named in d4a (RADIUS 1812, 1813, 1645, 1646; TACACS+ 49; SNMP 161 and 162; DoT 853; HTTPS 443): all equal d0.
- Wi-Fi: CCMP-128 minimum, GCMP-256 in the 192-bit mode, SAE, PMF required, 6 GHz needs WPA3 or Enhanced Open: equal to d0. d4a adds Wi-Fi 7 (GCMP-256, SAE-EXT-KEY), which d0 does not state; it matches the cards.
- EAP table: equal to d0.
- CVSS bands: equal to d0.
- d4a states no key sizes, no radio standard table and no TLS certificate validity schedule, so nothing to reconcile there.

## Cards I believe are wrong

None is wrong against a source. One differs from a primary source and is worth a line on the card:
- "Choose your own device (CYOD)" and "Deployment models": the cards say the company owns the device. That is the common industry and
  certification usage, but NIST SP 800-124 Rev. 2 section 5.1.3.3 describes CYOD as employee purchased, ownership "Employee". The chapter
  now gives both; a learner who answers "employee owned, from an approved list" is following NIST and should not be marked wrong.

## Not verified against a primary source in this review (kept, all card-backed or common knowledge)

- SIM swapping as a cellular threat; "in 4G the network can choose not to encrypt, and devices did not warn" (SP 800-187 was searched; the
  rogue base station text was found, this sentence was not located by search terms).
- Wi-Fi 7 details (GCMP-256 for WPA3-Personal, SAE-EXT-KEY, CCMP-128 kept for older clients) and "WPA2 and open networks are not allowed in
  6 GHz": the Wi-Fi Alliance specification is not openly readable; the public security page confirms only that WPA3 is mandatory and PMF is
  required for new certified devices. Hash-to-element in 6 GHz rests on vendor and open-source documentation, not the specification text.
- Persistent and dissolvable NAC agents; explicit vs transparent proxy; EDR rollback; S/MIME certificate authority vs PGP web of trust; pen test
  knowledge levels; the name Log4Shell; typosquatting; Mirai and default passwords; CISA's 45 days; EPSS "next 30 days"; KEV due dates;
  STIX and TAXII 2.1; PDD-63 (1998); CIS "more than 25 vendor product families"; PCI DSS v4 requirement 11.5.2; Group Policy 90 minutes plus
  up to 30; CVE-2024-6387 score 8.1. All are widely documented and none contradicts a source read here, but the pages were not opened in this review.
- OWASP statements (input validation levels, SAST and DAST strengths) and the FIRST CVSS v4.0 metric names were not re-read.
- The 8-word overlap check against source pages and outline.md was not re-run; the edits in this pass are short rewordings in the reviewer's own words.

## Format checks on r8

115 `###`/`####` sections, none over 4,000 characters, no duplicate titles, no heading over 110 characters, no em or en dashes, no HTML,
no "http://" or "https://" text, no question-and-answer blocks, no "exam" wording left (remaining matches are "example" and "examine").

## Totals

Sections checked: 115 (all). Statements fixed: 34, of which 8 change a fact or a grading-relevant claim and 26 are rule wording
(test-related phrasing, naming the certification body, doubled expansions, one web address).
