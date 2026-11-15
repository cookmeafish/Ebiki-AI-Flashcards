# d4a sweeps (Domain 4.0, objectives 4.1 to 4.5): pass r2 to r3

Reviewer files: `cards/d4a-cards.r3.json` (153 cards, same obj, path and order as r2) and `knowledge/d4a-knowledge.r3.md`.
Owner rule applied: nothing true and helpful was removed (a video course style notes such as "WPA3 uses GCMP" were kept); only what a source showed wrong or out of date was fixed, and missing facts were added, in our own words.
Checks run on the r3 files: JSON parses, 153 cards, same obj/path/keys per card, no em or en dashes, no HTML tags, and `dev/careers/verbatim.mjs` finds no run of 12+ words shared with the outline (objective titles allowed).

Totals: 153 cards checked in each of the 10 sweeps (1,530 card checks). 19 cards changed (25 field edits; some cards changed in more than one sweep, so the per-sweep counts add up to 24), plus the same fixes in the knowledge chapter (18 passages).

## Sweep 1: Facts
Checked every definition against primary sources (list in the per-card table below).
Checked 153, changed 3.
| Card | Before | After | Source |
|---|---|---|---|
| Input validation (#37) definition and keyPoints | "It is the main defense against injection attacks such as SQL injection and cross-site scripting." / "pair with parameterized queries" | A key defense against injection, working together with parameterized queries and output encoding, which OWASP names as the main fixes; keyPoints name both fixes and keep the exam note that input validation is the usual exam answer | https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html |
| AAA/RADIUS (#33) keyPoints | "it encrypts only the password, while TACACS+ (TCP 49) encrypts the whole payload" | RADIUS hides only the password; TACACS+ encrypts the whole message body, which RFC 8907 calls obfuscation and advises running over a secure transport | https://www.rfc-editor.org/rfc/rfc2865 , https://www.rfc-editor.org/rfc/rfc8907 |
| Sanitization (#52) definition | purge = "secure erase, cryptographic erase or degaussing" | purge = the drive's own sanitize commands such as block erase or cryptographic erase, or degaussing for magnetic media | https://csrc.nist.gov/pubs/sp/800/88/r2/final (PDF section 3.1.2) |

## Sweep 2: Numbers and names
Checked ports, versions, standard numbers, dates and acronym expansions on every card.
Checked 153, changed 8.
| Card | Before | After | Source |
|---|---|---|---|
| Sanitization (#52) | "NIST SP 800-88 names three methods" | Names Rev. 2 (September 2025), which replaced the 2014 Rev. 1 and keeps clear, purge, destroy; keyPoints add IEEE 2883 for per-media techniques and cryptographic erase as the possible only purge option for cloud storage | NIST SP 800-88 Rev. 2, sections 3.1 to 3.1.2 |
| Certification (#54) | certificate lists "media details, method, technique, tool, verification, who did it and when" | paper or electronic; manufacturer, model and serial number, media type, method and technique, tool and version, verification method, who and when | NIST SP 800-88 Rev. 2, section 4.6 and Appendix C |
| AAA/RADIUS (#33) | (no early ports) | early RADIUS used UDP 1645 and 1646 | RFC 2865 |
| CVSS (#77) | "v3.x ratings:" ; "adjusted with environmental metrics" | v3.x and v4.0 (November 2023) share the ratings; v4.0 metric groups Base, Threat, Environmental, Supplemental | https://www.first.org/cvss/v4.0/specification-document |
| CVE (#78) | "run by MITRE with US government sponsorship" | run by MITRE and sponsored by CISA | https://www.cve.org/Resources/Media/Archives/OldWebsite/index.html (CISA sponsor) ; news results on the CISA contract with MITRE found by web search (therecord.media, cybersecuritydive.com, 2025 to 2026) |
| SCAP (#110) | (no version) | current release SCAP 1.4 (2026), prefers CVSS v4.0; roles of XCCDF, OVAL, CPE, CCE | https://csrc.nist.gov/projects/security-content-automation-protocol/scap-releases/scap-1-4 |
| DMARC (#144) | (only RFC 7489 era facts) | RFC 9989 (May 2026) replaced RFC 7489, same _dmarc record, policies and alignment; reports moved to RFC 9990 and 9991 | https://www.rfc-editor.org/rfc/rfc7489 , https://www.rfc-editor.org/rfc/rfc9989 |
| FIM (#148) | "required by some standards such as PCI DSS" | PCI DSS v4 requirement 11.5.2: change detection on critical files, alerts on unauthorized change, comparisons at least weekly | https://documentation.wazuh.com/current/compliance/pci-dss/file-integrity-monitoring.html |

## Sweep 3: Examples
Checked that each example is concrete, realistic and an instance of its own concept (not a neighbour).
Checked 153, changed 0. Note: the Certification example uses "shredded drives"; kept because the card teaches the certificate, and the Destruction card now carries NIST's caution about shredding.

## Sweep 4: Key points
Checked each key point is true, useful for the exam and not padded.
Checked 153, changed 5.
| Card | Change | Source |
|---|---|---|
| Secure cookies (#38) | added SameSite values Strict, Lax (browser default when unset), None (needs Secure) | https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies |
| Authentication protocols (#35) | added EAP-FAST builds its tunnel from a Protected Access Credential (PAC) instead of certificates | https://www.rfc-editor.org/rfc/rfc4851 ; PEAP/TTLS server-only cert confirmed in https://www.rfc-editor.org/rfc/rfc5281 |
| SPF (#146) | "checks the envelope sender domain" became "envelope sender (MAIL FROM) domain and the HELO name"; "~all soft fail" gained "(receivers should not reject on that alone)" | https://www.rfc-editor.org/rfc/rfc7208 |
| SELinux (#137) | "permissive (logs only)" became "permissive (blocks nothing, only logs what would be denied)" | https://man7.org/linux/man-pages/man8/selinux.8.html |
| Rules (firewall) (#121) | added NIST note: rule handling varies by product, put the most-matched rules high where order allows, deny by default | https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-41r1.pdf |

## Sweep 5: Confusables
Checked look-alikes across all cards: IDS vs IPS, signature vs anomaly, SAST vs DAST, false positive vs negative, CVE vs CVSS, inventory vs enumeration, sanitization vs destruction, BYOD vs COPE vs CYOD, agent vs agentless, SPF vs DKIM vs DMARC, Group Policy vs SELinux, DNS filter vs web filter, cryptographic vs authentication protocol, SNMP trap vs poll, NetFlow vs packet capture, DLP monitoring (4.4) vs DLP capability (4.5), EDR vs XDR, compensating control vs exception.
Checked 153, changed 0 (all already told apart correctly and consistently; input validation vs parameterized queries was sharpened in sweep 1).

## Sweep 6: Coverage
Read every outline line of 4.0 to 4.5 against its card. Each line has exactly one card, and each card covers everything its line names (for example the Tools card names all nine tools, Activities names all six activities plus quarantine and alert tuning).
Checked 153, changed 0. Missing concepts are in "Proposed new cards" below.

## Sweep 7: Consistency
Checked that each fact reads the same on every card and in the chapter. Every card change above was mirrored in the knowledge chapter (WPA3, RADIUS/TACACS+, cryptographic and authentication protocols, input validation, cookies, sanitization, destruction, CVE, CVSS, SCAP, SELinux, DNS filtering, SPF, DMARC, FIM, firewall rules, exceptions).
Checked 153, changed 1 card: Cryptographic protocols (#34) gained the Wi-Fi 7 GCMP-256 fact so it agrees with the WPA3 card (source: Cisco WPA3 deployment guide, https://www.cisco.com/c/en/us/td/docs/wireless/controller/9800/technical-reference/wpa3-dg.pdf).

## Sweep 8: Clarity
Checked plain, fluff-free wording (TEACHING_STYLE_RULE), no em or en dashes, no HTML. Script check on r3: 0 dashes, 0 tags.
Checked 153, changed 0.

## Sweep 9: Exam fit
Checked wording against how SY0-701 expects each concept, and marked newer facts as additions next to the exam sense.
Checked 153, changed 4.
| Card | Change | Source |
|---|---|---|
| WPA3 (#32) | kept the study-guide note "WPA3 uses GCMP"; added that on Wi-Fi 7 gear WPA3 does use GCMP-256 (SAE-EXT-KEY) even in personal mode, that WPA3 and protected management frames are mandatory in 6 GHz where WPA2 is not allowed, and what transition mode does | Cisco WPA3 deployment guide (above); https://www.wi-fi.org/discover-wi-fi/security |
| DMARC (#144) | added CompTIA's acronym-list spelling (Domain Message Authentication Reporting and Conformance) | local acronyms.txt |
| FIM (#148) | added CompTIA's acronym-list expansion File Integrity Management | local acronyms.txt |
| Exceptions and exemptions (#89) | added NIST SP 800-40 Rev. 4 view: track exceptions closely, give unpatchable assets their own maintenance group | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-40r4.pdf (section 3.5.5) |

## Sweep 10: Final adversarial pass
Tried to prove each card wrong against the sources read this session.
Checked 153, changed 3.
| Card | Change | Source |
|---|---|---|
| Destruction (#53) | added: NIST Rev. 2 says shredding and pulverizing lose effect on dense media and suit only the lowest-sensitivity data; degaussing is not an approved destroy technique (the existing "drilling only partly damages" point was confirmed in Rev. 2 section 3.1.3) | NIST SP 800-88 Rev. 2 |
| Sanitization (#52) | the keyPoints claims (overwriting SSDs is weak because of spare cells; degaussing does nothing to SSDs) confirmed; cloud cryptographic-erase note added (counted in sweep 2) | NIST SP 800-88 Rev. 2 section 3.1.1 to 3.1.2 |
| DNS filtering (#142) | added: DNS over HTTPS on port 443 can skip the company resolver unseen; NSA advises using only the designated enterprise resolver and blocking other DoH and DoT (853) resolvers | NSA CSI "Adopting Encrypted DNS in Enterprise Environments" (Jan 2021), https://cryptoid.com.br/wp-content/uploads/2021/02/CSI_ADOPTING_ENCRYPTED_DNS_U_OO_102904_21.pdf (mirror of the NSA PDF; nsa.gov refused automated fetch) |

Also confirmed unchanged this sweep: RADIUS UDP 1812 (RFC 2865), SNMP 161/162 (RFC 3417), mail ports 465/587/993/995 (RFC 8314), DKIM selector._domainkey and "signs, does not encrypt" (RFC 6376), DMARC _dmarc, policies and alignment (RFC 7489/9989), SPF TXT record and -all/~all (RFC 7208), CVSS rating bands (FIRST v4.0), SCAP components (NIST), SELinux modes (man page), IDS signature vs anomaly and false negative definitions (NIST SP 800-94), credentialed vs non-credentialed scans and high false-positive rate of scanners (NIST SP 800-115), bluejacking and bluesnarfing (NIST SP 800-121 Rev. 2), SIEM and log time sync (NIST SP 800-92), ISACs (NIST SP 800-150), SAST, SBOM and vulnerability disclosure programs (NIST SP 800-218), sandboxing and file quarantine (NIST SP 800-83 Rev. 1), ICS segmentation (NIST SP 800-82 Rev. 3), DMZ and deny by default (NIST SP 800-41 Rev. 1), SLE = AV x EF and ALE = SLE x ARO (worked example, Wikipedia: Annualized loss expectancy).

## Proposed new cards
1. **Protected Management Frames (PMF, 802.11w).** Why: WPA3 makes PMF mandatory and it is what stops deauthentication-based attacks (evil twin setup, forced disconnects); the cards mention it only in passing. Source: https://www.wi-fi.org/discover-wi-fi/security ; Cisco WPA3 deployment guide.
2. **Cryptographic erase.** Why: the fastest purge method for SSDs, self-encrypting drives and the only practical purge for cloud storage; a frequent exam distractor next to degaussing and overwriting. Source: NIST SP 800-88 Rev. 2, section 3.2.
3. **Encrypted DNS (DoH/DoT) as a monitoring and filtering blind spot.** Why: explains why DNS filtering and SIEM DNS logs can miss malware and browsers; only a key point today. Source: NSA CSI "Adopting Encrypted DNS in Enterprise Environments".
4. **Credentialed vs non-credentialed scan.** Why: one of the most tested vulnerability-scan distinctions, now only a key point on two cards. Source: NIST SP 800-115 (vulnerability scanning section on scanners with and without host credentials).

## Unsure
- **Cards with no primary source read this session** (facts believed correct, cross-checked only against the outline and the other cards): #11 Cloud infrastructure, #16 IoT devices, #17 to #20 wireless installation, site surveys and heat maps, #45 to #47 assignment, ownership, classification, #55 Data retention, #57 Identification methods, #67 Dark web, #71 System/process audit, #76 Prioritize, #79 Vulnerability classification, #82 Industry/organizational impact, #83 Risk tolerance, #86 Insurance, #90 and #92 validation and audit, #94 Reporting, #100 Activities, #112 Agents/agentless, #115 DLP (monitoring), #128, #129, #132 to #134 web filter items, #149 DLP (capability), #150 NAC, #151 EDR/XDR, #152 UBA, plus the briefing cards #0, #1, #43, #95. A later pass should read a primary source for each.
- **Group Policy (#136):** the Microsoft Learn page read describes GPOs but did not state the site, domain and OU linking; the claim is standard and unchanged.
- **Exposure factor (#80):** formula confirmed only by a Wikipedia worked example, not a standards body.
- **CVE funding:** news read covers the CISA to MITRE contract through March 2026; nothing later was checked.
- **TACACS+ wording:** the exam teaches that TACACS+ encrypts the whole payload; RFC 8907 calls it obfuscation. Both are now on the card; the coordinator may want the same note on the 4.6 TACACS+ card if one exists.
- **WPA3 cipher:** the Wi-Fi Alliance specification PDFs need a login; cipher facts come from Cisco's deployment guide, not the spec itself.
- **SAST (#39) "cannot find runtime or configuration problems":** slightly broad (some SAST tools scan infrastructure-as-code); left unchanged as the exam sense.
- **Windows System File Checker as a FIM example (#148):** SFC verifies and repairs protected system files; it is a common study-guide example but not a full FIM product. Kept.

## Per-card sources
Every card also used the local outline for coverage. Named sources per card:

| # | Card | Named sources for its facts |
|---|---|---|
| 0 | SY0-701 Domain 4.0: Security Operations (28%) | CompTIA SY0-701 outline (local outline.md) |
| 1 | SY0-701 4.1: Given a scenario, apply common security techniques to computing resources | CompTIA SY0-701 outline (local outline.md) |
| 2 | Secure baselines | CompTIA SY0-701 outline (local outline.md); NIST SP 800-128 (security-focused configuration management) |
| 3 | Establish (secure baseline) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-128 (security-focused configuration management) |
| 4 | Deploy (secure baseline) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-128 (security-focused configuration management) |
| 5 | Maintain (secure baseline) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-128 (security-focused configuration management); NIST CSRC SCAP project page and SCAP 1.4 release page |
| 6 | Hardening targets | CompTIA SY0-701 outline (local outline.md); NIST SP 800-123 (server security); NIST SP 800-82 Rev. 3 (OT/ICS security) |
| 7 | Mobile devices (hardening target) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-124 Rev. 2 (mobile device management) |
| 8 | Workstations (hardening target) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-123 (server security) |
| 9 | Switches (hardening target) | CompTIA SY0-701 outline (local outline.md); RFC 3417 (SNMP transport, ports 161/162) |
| 10 | Routers (hardening target) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-41 Rev. 1 (firewalls) |
| 11 | Cloud infrastructure (hardening target) | CompTIA SY0-701 outline (local outline.md) |
| 12 | Servers (hardening target) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-123 (server security) |
| 13 | ICS/SCADA (hardening target) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-82 Rev. 3 (OT/ICS security) |
| 14 | Embedded systems (hardening target) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-82 Rev. 3 (OT/ICS security) |
| 15 | RTOS (hardening target) | CompTIA SY0-701 outline (local outline.md); CompTIA SY0-701 acronym list (local acronyms.txt) |
| 16 | IoT devices (hardening target) | CompTIA SY0-701 outline (local outline.md) |
| 17 | Wireless devices (secure installation) | CompTIA SY0-701 outline (local outline.md) |
| 18 | Installation considerations (wireless devices) | CompTIA SY0-701 outline (local outline.md) |
| 19 | Site surveys (wireless installation) | CompTIA SY0-701 outline (local outline.md) |
| 20 | Heat maps (wireless installation) | CompTIA SY0-701 outline (local outline.md) |
| 21 | Mobile solutions (securing computing resources) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-124 Rev. 2 (mobile device management) |
| 22 | Mobile device management (MDM) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-124 Rev. 2 (mobile device management) |
| 23 | Deployment models (mobile devices) | CompTIA SY0-701 outline (local outline.md); CompTIA SY0-701 acronym list (local acronyms.txt) |
| 24 | Bring your own device (BYOD) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-124 Rev. 2 (mobile device management) |
| 25 | Corporate-owned, personally enabled (COPE) | CompTIA SY0-701 outline (local outline.md); CompTIA SY0-701 acronym list (local acronyms.txt) |
| 26 | Choose your own device (CYOD) | CompTIA SY0-701 outline (local outline.md); CompTIA SY0-701 acronym list (local acronyms.txt) |
| 27 | Connection methods (mobile devices) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-124 Rev. 2 (mobile device management); NIST SP 800-121 Rev. 2 (Bluetooth security) |
| 28 | Cellular (mobile connection method) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-124 Rev. 2 (mobile device management) |
| 29 | Wi-Fi (mobile connection method) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-124 Rev. 2 (mobile device management) |
| 30 | Bluetooth (mobile connection method) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-121 Rev. 2 (Bluetooth security) |
| 31 | Wireless security settings | CompTIA SY0-701 outline (local outline.md); Wi-Fi Alliance security page (wi-fi.org/discover-wi-fi/security); Cisco Catalyst 9800 WPA3 deployment guide (cisco.com wpa3-dg.pdf) |
| 32 | Wi-Fi Protected Access 3 (WPA3) | CompTIA SY0-701 outline (local outline.md); Wi-Fi Alliance security page (wi-fi.org/discover-wi-fi/security); Cisco Catalyst 9800 WPA3 deployment guide (cisco.com wpa3-dg.pdf) |
| 33 | AAA/RADIUS (wireless security setting) | CompTIA SY0-701 outline (local outline.md); RFC 2865 (RADIUS); RFC 8907 (TACACS+) |
| 34 | Cryptographic protocols (wireless security setting) | CompTIA SY0-701 outline (local outline.md); Cisco Catalyst 9800 WPA3 deployment guide (cisco.com wpa3-dg.pdf); Wi-Fi Alliance security page (wi-fi.org/discover-wi-fi/security) |
| 35 | Authentication protocols (wireless security setting) | CompTIA SY0-701 outline (local outline.md); RFC 5281 (EAP-TTLS); RFC 4851 (EAP-FAST) |
| 36 | Application security (computing resource technique) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-218 SSDF (secure software development); OWASP Input Validation Cheat Sheet; MDN HTTP cookies guide |
| 37 | Input validation | CompTIA SY0-701 outline (local outline.md); OWASP Input Validation Cheat Sheet |
| 38 | Secure cookies | CompTIA SY0-701 outline (local outline.md); MDN HTTP cookies guide |
| 39 | Static code analysis (application security technique) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-218 SSDF (secure software development) |
| 40 | Code signing | CompTIA SY0-701 outline (local outline.md); NIST SP 800-218 SSDF (secure software development) |
| 41 | Sandboxing (computing resource technique) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-83 Rev. 1 (malware incident prevention and handling) |
| 42 | Monitoring (computing resource technique) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-92 (log management) |
| 43 | SY0-701 4.2: Explain the security implications of proper hardware, software, and data asset management | CompTIA SY0-701 outline (local outline.md) |
| 44 | Acquisition/procurement process (asset management) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-218 SSDF (secure software development) |
| 45 | Assignment/accounting (asset management) | CompTIA SY0-701 outline (local outline.md) |
| 46 | Ownership (asset assignment) | CompTIA SY0-701 outline (local outline.md) |
| 47 | Classification (asset assignment) | CompTIA SY0-701 outline (local outline.md) |
| 48 | Monitoring/asset tracking (asset management) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-128 (security-focused configuration management) |
| 49 | Inventory (asset tracking) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-128 (security-focused configuration management) |
| 50 | Enumeration (asset tracking) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-128 (security-focused configuration management); NIST SP 800-115 (technical testing and assessment) |
| 51 | Disposal/decommissioning (asset management) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-88 Rev. 2 (Sept 2025), sections 3.1, 4.6, Appendix C |
| 52 | Sanitization (media disposal) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-88 Rev. 2 (Sept 2025), sections 3.1, 4.6, Appendix C |
| 53 | Destruction (media disposal) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-88 Rev. 2 (Sept 2025), sections 3.1, 4.6, Appendix C |
| 54 | Certification (media disposal) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-88 Rev. 2 (Sept 2025), sections 3.1, 4.6, Appendix C |
| 55 | Data retention (asset disposal) | CompTIA SY0-701 outline (local outline.md) |
| 56 | SY0-701 4.3: Explain various activities associated with vulnerability management | CompTIA SY0-701 outline (local outline.md); FIRST CVSS v4.0 specification |
| 57 | Identification methods (vulnerability management) | CompTIA SY0-701 outline (local outline.md) |
| 58 | Vulnerability scan (identification method) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-115 (technical testing and assessment) |
| 59 | Application security (vulnerability identification method) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-218 SSDF (secure software development) |
| 60 | Static analysis (application security testing) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-218 SSDF (secure software development); NIST SP 800-115 (technical testing and assessment) |
| 61 | Dynamic analysis (application security testing) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-218 SSDF (secure software development); NIST SP 800-115 (technical testing and assessment) |
| 62 | Package monitoring (application security) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-218 SSDF (secure software development) |
| 63 | Threat feed (vulnerability identification) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-150 (threat information sharing) |
| 64 | Open-source intelligence (OSINT) (threat feed) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-150 (threat information sharing) |
| 65 | Proprietary/third-party threat feed | CompTIA SY0-701 outline (local outline.md); NIST SP 800-150 (threat information sharing) |
| 66 | Information-sharing organization (threat feed) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-150 (threat information sharing) |
| 67 | Dark web (threat feed) | CompTIA SY0-701 outline (local outline.md) |
| 68 | Penetration testing (vulnerability identification) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-115 (technical testing and assessment) |
| 69 | Responsible disclosure program | CompTIA SY0-701 outline (local outline.md); NIST SP 800-218 SSDF (secure software development) |
| 70 | Bug bounty program | CompTIA SY0-701 outline (local outline.md); NIST SP 800-218 SSDF (secure software development) |
| 71 | System/process audit (vulnerability identification) | CompTIA SY0-701 outline (local outline.md) |
| 72 | Analysis (vulnerability management) | CompTIA SY0-701 outline (local outline.md); FIRST CVSS v4.0 specification |
| 73 | Confirmation (vulnerability analysis) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-115 (technical testing and assessment) |
| 74 | False positive (vulnerability scan) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-115 (technical testing and assessment) |
| 75 | False negative (vulnerability scan) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-115 (technical testing and assessment) |
| 76 | Prioritize (vulnerability analysis) | CompTIA SY0-701 outline (local outline.md) |
| 77 | Common Vulnerability Scoring System (CVSS) | CompTIA SY0-701 outline (local outline.md); FIRST CVSS v4.0 specification |
| 78 | Common Vulnerability Enumeration (CVE) | CompTIA SY0-701 outline (local outline.md); CVE program archive page (cve.org) and news on the MITRE contract with CISA (therecord.media, 2025 to 2026); CompTIA SY0-701 acronym list (local acronyms.txt) |
| 79 | Vulnerability classification | CompTIA SY0-701 outline (local outline.md) |
| 80 | Exposure factor (vulnerability analysis) | CompTIA SY0-701 outline (local outline.md); Wikipedia: Annualized loss expectancy (worked SLE/ALE example) |
| 81 | Environmental variables (vulnerability analysis) | CompTIA SY0-701 outline (local outline.md); FIRST CVSS v4.0 specification |
| 82 | Industry/organizational impact (vulnerability analysis) | CompTIA SY0-701 outline (local outline.md) |
| 83 | Risk tolerance (vulnerability analysis) | CompTIA SY0-701 outline (local outline.md) |
| 84 | Vulnerability response and remediation | CompTIA SY0-701 outline (local outline.md); NIST SP 800-40 Rev. 4 (patch management) |
| 85 | Patching (vulnerability remediation) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-40 Rev. 4 (patch management) |
| 86 | Insurance (vulnerability remediation) | CompTIA SY0-701 outline (local outline.md) |
| 87 | Segmentation (vulnerability remediation) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-40 Rev. 4 (patch management); NIST SP 800-82 Rev. 3 (OT/ICS security) |
| 88 | Compensating controls (vulnerability remediation) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-40 Rev. 4 (patch management) |
| 89 | Exceptions and exemptions (vulnerability remediation) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-40 Rev. 4 (patch management) |
| 90 | Validation of remediation | CompTIA SY0-701 outline (local outline.md) |
| 91 | Rescanning (validation of remediation) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-115 (technical testing and assessment) |
| 92 | Audit (validation of remediation) | CompTIA SY0-701 outline (local outline.md) |
| 93 | Verification (validation of remediation) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-115 (technical testing and assessment) |
| 94 | Reporting (vulnerability management) | CompTIA SY0-701 outline (local outline.md) |
| 95 | SY0-701 4.4: Explain security alerting and monitoring concepts and tools | CompTIA SY0-701 outline (local outline.md) |
| 96 | Monitoring computing resources (alerting and monitoring) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-92 (log management) |
| 97 | Systems (monitored resource) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-92 (log management) |
| 98 | Applications (monitored resource) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-92 (log management) |
| 99 | Infrastructure (monitored resource) | CompTIA SY0-701 outline (local outline.md); RFC 3417 (SNMP transport, ports 161/162); RFC 7011 (IPFIX) |
| 100 | Activities (alerting and monitoring) | CompTIA SY0-701 outline (local outline.md) |
| 101 | Log aggregation | CompTIA SY0-701 outline (local outline.md); NIST SP 800-92 (log management) |
| 102 | Alerting (monitoring activity) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-92 (log management) |
| 103 | Scanning (monitoring activity) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-115 (technical testing and assessment) |
| 104 | Reporting (alerting and monitoring activity) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-92 (log management) |
| 105 | Archiving (log and monitoring data) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-92 (log management) |
| 106 | Alert response and remediation/validation | CompTIA SY0-701 outline (local outline.md); NIST SP 800-61 Rev. 3 (incident response); NIST SP 800-83 Rev. 1 (malware incident prevention and handling) |
| 107 | Quarantine (alert response) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-83 Rev. 1 (malware incident prevention and handling); NIST SP 800-61 Rev. 3 (incident response) |
| 108 | Alert tuning | CompTIA SY0-701 outline (local outline.md); NIST SP 800-94 (IDPS) |
| 109 | Tools (alerting and monitoring) | CompTIA SY0-701 outline (local outline.md); RFC 3417 (SNMP transport, ports 161/162); RFC 7011 (IPFIX); NIST CSRC SCAP project page and SCAP 1.4 release page |
| 110 | Security Content Automation Protocol (SCAP) | CompTIA SY0-701 outline (local outline.md); NIST CSRC SCAP project page and SCAP 1.4 release page |
| 111 | Benchmarks (security configuration) | CompTIA SY0-701 outline (local outline.md); NIST CSRC SCAP project page and SCAP 1.4 release page |
| 112 | Agents/agentless (monitoring tools) | CompTIA SY0-701 outline (local outline.md) |
| 113 | Security information and event management (SIEM) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-92 (log management) |
| 114 | Antivirus (monitoring tool) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-83 Rev. 1 (malware incident prevention and handling) |
| 115 | Data loss prevention (DLP) (monitoring tool) | CompTIA SY0-701 outline (local outline.md) |
| 116 | Simple Network Management Protocol (SNMP) traps | CompTIA SY0-701 outline (local outline.md); RFC 3417 (SNMP transport, ports 161/162) |
| 117 | NetFlow | CompTIA SY0-701 outline (local outline.md); RFC 7011 (IPFIX) |
| 118 | Vulnerability scanners (monitoring tool) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-115 (technical testing and assessment) |
| 119 | SY0-701 4.5: Given a scenario, modify enterprise capabilities to enhance security | CompTIA SY0-701 outline (local outline.md); RFC 9989 (DMARC, May 2026); RFC 7208 (SPF); RFC 6376 (DKIM) |
| 120 | Firewall (enterprise capability) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-41 Rev. 1 (firewalls) |
| 121 | Rules (firewall) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-41 Rev. 1 (firewalls) |
| 122 | Access lists (firewall) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-41 Rev. 1 (firewalls) |
| 123 | Ports/protocols (firewall) | CompTIA SY0-701 outline (local outline.md); RFC 8314 (mail ports, implicit TLS) |
| 124 | Screened subnets | CompTIA SY0-701 outline (local outline.md); NIST SP 800-41 Rev. 1 (firewalls) |
| 125 | IDS/IPS (enterprise capability) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-94 (IDPS) |
| 126 | Trends (IDS/IPS) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-94 (IDPS) |
| 127 | Signatures (IDS/IPS) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-94 (IDPS) |
| 128 | Web filter | CompTIA SY0-701 outline (local outline.md) |
| 129 | Agent-based (web filter) | CompTIA SY0-701 outline (local outline.md) |
| 130 | Centralized proxy (web filter) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-41 Rev. 1 (firewalls) |
| 131 | Universal Resource Locator (URL) scanning (web filter) | CompTIA SY0-701 outline (local outline.md); CompTIA SY0-701 acronym list (local acronyms.txt) |
| 132 | Content categorization (web filter) | CompTIA SY0-701 outline (local outline.md) |
| 133 | Block rules (web filter) | CompTIA SY0-701 outline (local outline.md) |
| 134 | Reputation (web filter) | CompTIA SY0-701 outline (local outline.md) |
| 135 | Operating system security (enterprise capability) | CompTIA SY0-701 outline (local outline.md); selinux(8) man page (man7.org); Microsoft Learn: Group Policy Objects |
| 136 | Group Policy | CompTIA SY0-701 outline (local outline.md); Microsoft Learn: Group Policy Objects |
| 137 | SELinux | CompTIA SY0-701 outline (local outline.md); selinux(8) man page (man7.org) |
| 138 | Implementation of secure protocols | CompTIA SY0-701 outline (local outline.md); NIST SP 800-41 Rev. 1 (firewalls) |
| 139 | Protocol selection (secure protocols) | CompTIA SY0-701 outline (local outline.md); RFC 8314 (mail ports, implicit TLS) |
| 140 | Port selection (secure protocols) | CompTIA SY0-701 outline (local outline.md); RFC 8314 (mail ports, implicit TLS) |
| 141 | Transport method (secure protocols) | CompTIA SY0-701 outline (local outline.md); NIST SP 800-41 Rev. 1 (firewalls) |
| 142 | DNS filtering | CompTIA SY0-701 outline (local outline.md); NSA CSI Adopting Encrypted DNS in Enterprise Environments (Jan 2021) |
| 143 | Email security (enterprise capability) | CompTIA SY0-701 outline (local outline.md); RFC 9989 (DMARC, May 2026); RFC 6376 (DKIM); RFC 7208 (SPF) |
| 144 | Domain-based Message Authentication Reporting and Conformance (DMARC) | CompTIA SY0-701 outline (local outline.md); RFC 7489 (DMARC, now obsolete); RFC 9989 (DMARC, May 2026); CompTIA SY0-701 acronym list (local acronyms.txt) |
| 145 | DomainKeys Identified Mail (DKIM) | CompTIA SY0-701 outline (local outline.md); RFC 6376 (DKIM) |
| 146 | Sender Policy Framework (SPF) | CompTIA SY0-701 outline (local outline.md); RFC 7208 (SPF) |
| 147 | Gateway (email security) | CompTIA SY0-701 outline (local outline.md); RFC 9989 (DMARC, May 2026); RFC 6376 (DKIM); RFC 7208 (SPF) |
| 148 | File integrity monitoring (FIM) | CompTIA SY0-701 outline (local outline.md); Wazuh PCI DSS mapping quoting requirement 11.5.2; CompTIA SY0-701 acronym list (local acronyms.txt) |
| 149 | DLP (enterprise capability) | CompTIA SY0-701 outline (local outline.md) |
| 150 | Network access control (NAC) | CompTIA SY0-701 outline (local outline.md) |
| 151 | EDR/XDR | CompTIA SY0-701 outline (local outline.md) |
| 152 | User behavior analytics (UBA) | CompTIA SY0-701 outline (local outline.md) |
