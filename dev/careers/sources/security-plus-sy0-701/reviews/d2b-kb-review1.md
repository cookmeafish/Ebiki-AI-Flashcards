# d2b knowledge chapter: independent accuracy review 1

Reviewed: `knowledge/d2b-knowledge.r7.md` (objectives 2.4 and 2.5). Corrected pass: `knowledge/d2b-knowledge.r8.md`.
Date: 2026-11-15/16. The reviewer did not write the chapter. r7 was not edited.

Result: 78 `###` sections checked. 60 PASS, 18 FIXED (9 fact or precision fixes, 4 rule fixes for exam wording, 5 pointer
or style fixes; several sections had more than one). No card was found to state a false fact; 3 cards are listed for a
closer look. Format checks on r8: longest heading under 110 characters, largest section 2,952 characters, no duplicate
titles, no em or en dashes, no links, no HTML, no "exam" wording, every named pointer title exists in r8, d2a r7 or d0 r7,
and no 8-word run shared with outline.md.

## Sources read this session

| Key | What was checked | URL |
|---|---|---|
| CISA-UDP | Amplification factors: DNS 28 to 54, NTP 556.9, memcached 10,000 to 51,000, CLDAP 56 to 70, SSDP 30.8; ingress filtering (BCP 38) | https://www.cisa.gov/news-events/alerts/2014/01/17/udp-based-amplification-attacks |
| CISA-MIRAI | 62 default credential pairs; routers, cameras, recorders; lives in memory, reboot clears it, quick reinfection unless password changed; 620 Gbps and 1.1 Tbps floods | https://www.cisa.gov/news-events/alerts/2016/10/14/heightened-ddos-threat-posed-mirai-and-other-botnets |
| ROGUE-CA | Rogue CA certificate from an MD5 collision, announced 30 December 2008, carrying a commercial CA's signature, CA = TRUE | https://marc-stevens.nl/research/hashclash/rogue-ca/ |
| CISA-WCRY | WannaCry, 12 May 2017, spreads through the MS17-010 SMBv1 flaw, TCP 445, self-propagating | https://www.cisa.gov/news-events/alerts/2017/05/12/indicators-associated-wannacry-ransomware |
| OWASP-SSRF | Metadata address 169.254.169.254, prefer allow lists, disable redirects, IMDSv2 as defense in depth | https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html |
| MS-4625 | Event 4625 is logged for any logon failure; logon type 3 is network | https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-4625 |
| MS-1102 | Event 1102, Security log cleared, records the account, should be investigated | https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-1102 |
| MS-EXPLOIT | DEP stops code running from memory not marked executable; ASLR randomizes the memory layout | https://learn.microsoft.com/en-us/defender-endpoint/exploit-protection-reference |
| WFA | PMF required in WPA3 | https://www.wi-fi.org/discover-wi-fi/security |
| CISCO-11W | 802.11w protects deauthentication, disassociation and robust action frames | https://www.cisco.com/c/en/us/td/docs/wireless/controller/technotes/5700/software/release/ios_xe_33/11rkw_DeploymentGuide/b_802point11rkw_deployment_guide_cisco_ios_xe_release33/b_802point11rkw_deployment_guide_cisco_ios_xe_release33_chapter_0100.html |
| SP800-63B | At most 100 consecutive failed attempts, enforced by disabling the authenticator; salted hashing; blocklist | https://pages.nist.gov/800-63-4/sp800-63b.html |
| NIST-HASH | Collision strength is half the output size | https://csrc.nist.gov/projects/hash-functions |
| RFC8996 | March 2021, deprecates TLS 1.0, TLS 1.1, DTLS 1.0; minimum TLS 1.2 | https://www.rfc-editor.org/rfc/rfc8996.html |
| RFC7507 | TLS_FALLBACK_SCSV: client marks a fallback retry, server answers inappropriate_fallback | https://www.rfc-editor.org/rfc/rfc7507.html |
| RFC6797 | HSTS rewrites http to https for known hosts; first-visit gap; preload lists | https://www.rfc-editor.org/rfc/rfc6797.html |
| RFC4033 | DNSSEC: origin authentication and integrity; no confidentiality; no DoS protection | https://www.rfc-editor.org/rfc/rfc4033.html |
| CISA-POODLE | 2014, forced fallback to SSL 3.0, byte by byte decryption, on-path is the usual position | https://www.cisa.gov/news-events/alerts/2014/10/17/ssl-30-protocol-vulnerability-and-poodle-attack |
| CISA-ED1901 | DNS record tampering through stolen account credentials (A, MX, NS), valid certificates obtained, MFA, certificate transparency monitoring | https://www.cisa.gov/news-events/directives/ed-19-01-mitigate-dns-infrastructure-tampering |
| SHATTERED | 2017, two PDFs with one SHA-1 hash | https://shattered.io/ |
| CISA-RW | Isolate first, power down only if unable to disconnect (volatile memory), offline encrypted tested backups, double extortion | https://www.cisa.gov/stopransomware/ransomware-guide |
| PCI-SEG | Segmentation is not a PCI DSS requirement but can reduce the systems in scope (PDF text read) | https://listings.pcisecuritystandards.org/documents/Guidance-PCI-DSS-Scoping-and-Segmentation_v1_1.pdf |
| SP800-167 | Path, filename and size weak alone; publisher signature plus hash most accurate (PDF text read) | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-167.pdf |
| SP800-88 | Rev. 2 dated September 2025; clear, purge, destroy, cryptographic erase (PDF text read) | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-88r2.pdf |
| SP800-83 | File infector, boot sector, multipartite, macro and scripting viruses; keystroke loggers (PDF text read) | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-83r1.pdf |
| T1056.001 | Software keylogging methods (hooks, hardware buffer, drivers) | https://attack.mitre.org/techniques/T1056/001/ |
| ICT-PROX | 125 kHz proximity cards unencrypted, site code and card number copied in seconds; default keys on some 13.56 MHz cards (vendor page) | https://ict.co/blog/the-125khz-proximity-card-dilemma |
| DARKSEOUL | 20 March 2013, 14:00 local time, three media organizations and four banks, wiper | https://blogs.cisco.com/security/thoughts-on-darkseoul-data-sharing-and-targeted-attackers |
| BA-SEARCH | 2018 airline case: search summary quoting the regulator's October 2020 penalty notice (script file edited, card data sent to an attacker domain, 20 million pound fine). Two direct regulator URLs returned 404. | search result only |
| LOCAL | d2-cards.r5.json, d2-extras.r5.json, d0-knowledge.r7.md, d2a-knowledge.r7.md, outline.md | local |

## The writer's flagged items

| Item | Verdict | Note |
|---|---|---|
| 2008 MD5 forged certificate | Confirmed, wording tightened | It was a rogue CA certificate carrying a real commercial CA's signature (ROGUE-CA) |
| 2018 airline case | FIXED | r7 said users were "diverted to a fraudulent site"; the penalty notice describes an edited script that sent card data to an attacker domain |
| 802.11w and deauthentication | Confirmed, wording tightened | Protects deauthentication and disassociation frames (CISCO-11W); required in WPA3 (WFA) |
| PCI scope under segmentation | Confirmed | PCI-SEG |
| RFID cloning details | Confirmed, one softening | Fixed number, no encryption, site code and card number (ICT-PROX). 13.56 MHz alone is not proof of security: reworded |
| WannaCry over SMB | Confirmed | CISA-WCRY |
| DEP and ASLR | Confirmed, one line of explanation added | MS-EXPLOIT |
| USB hardware keyloggers | Kept | Only vendor pages describe the inline device; it is well established. The chapter does not say "USB", only a device between keyboard and computer |
| Birthday numbers | FIXED | 23 people gives 50.7%. A 64-bit hash at 2^32 tries gives 39%, not 50%; 50% needs about 5.1 billion |
| Token-based metadata access | FIXED (made specific) | OWASP names IMDSv2 as defense in depth, not a main defense |
| Windows event 4625 | Confirmed | MS-4625; lockout itself is event 4740 (added, matches the reference chapter) |
| Typed NIST URLs | Checked | 800-63B, 800-88r2, 800-167, 800-83r1 and the hash page were fetched and read. SP 800-53, 800-40, 800-94, 800-123, 800-41, 800-92, 800-128 and 800-137 were not re-read (see "Not verified") |
| "the 2.3 chapter section on XSS", "the Reference chapter" | FIXED | Replaced by exact titles from d2a r7 and d0 r7 (8 pointers) |

## Per section

Sections not listed below: PASS (facts checked against the sources above or the cards, teaching and rules fine).

2.4
- Virus (file infector, boot sector and macro malware): FIXED. "on the exam it means" -> "in the strict sense used in this objective it means". "an Universal" -> "a Universal". Kinds of virus confirmed (SP800-83).
- Logic bomb: FIXED. "reports describe a logic bomb keyed to that date" -> "the timed trigger is why the case is commonly described as a logic bomb" (DARKSEOUL confirms the time and targets, not the term).
- Physical brute force: FIXED (style). Sentence began with a lowercase acronym expansion.
- RFID badge cloning: FIXED. "13.56 MHz cards with cryptographic challenge-response" -> smart cards with encrypted challenge-response and default keys replaced, plus "the frequency alone does not make a card secure" (ICT-PROX).
- Environmental attacks: FIXED. Removed "Researchers have shown that access to a building management company's controllers could let an attacker heat up a data center" (not re-read by this reviewer) -> a plain statement of the mechanism.
- Reflected and amplified DDoS: PASS. Every factor matches CISA-UDP.
- Botnet and C2 beaconing: PASS (CISA-MIRAI).
- DNS attacks: PASS (CISA-ED1901, RFC4033).
- Wireless attacks: FIXED. "authenticate these frames" -> "add cryptographic protection to deauthentication and disassociation frames, so forged ones are rejected" (CISCO-11W, WFA).
- Malicious code delivered over the network: FIXED twice. "the exam uses it for attacks" -> "the objective lists it under network attacks". Airline case reworded as above (BA-SEARCH); now agrees with the card. Pointer -> `### Cross-site scripting (XSS) vulnerability`.
- Injection attacks: FIXED (pointer). -> `### Structured Query Language injection (SQLi) vulnerability` and `### Memory injection (process injection and DLL injection)`.
- Buffer overflow attack indicators: FIXED. DEP and ASLR each explained in a clause (MS-EXPLOIT); pointer -> `### Buffer overflow vulnerability`.
- Request forgery (CSRF, SSRF): FIXED. "(for example token-based metadata access)" -> "as an extra layer, ... version 2 of the Amazon Web Services instance metadata service, which demands a session token" (OWASP-SSRF). Lowercase sentence start fixed.
- Downgrade attack: PASS (RFC8996, RFC7507, RFC6797, CISA-POODLE).
- Hash collision attack: FIXED. 2008 case made exact (ROGUE-CA); pointer -> `### Hash functions: digest size and status (reference)`.
- Birthday attack: FIXED. "about a 50% collision chance after roughly 2 to the 32nd hashes (about 4.3 billion)" -> "expected to collide after roughly 2 to the 32nd hashes (about 4.3 billion gives close to a 40% chance, and about 5.1 billion gives 50%)". Arithmetic: 1 - e^(-0.5) = 0.393; sqrt(2 ln 2) x 2^32 = 5.06 billion.
- Downgrade vs collision vs birthday: FIXED. "attacks on the exam" -> "attacks in this objective".
- Password spraying, brute force, dictionary sections: PASS (SP800-63B, MS-4625).
- Account lockout as an attack indicator: FIXED (addition). Event 4740 named for the lockout itself, with a pointer to `### Windows security event IDs and logon types (reference)`.
- Missing logs: PASS (MS-1102).
- Comparison tables (DoS, account indicators, web attacks, host defenses): FIXED (style). Row labels capitalized.

2.5
- Segmentation: PASS (PCI-SEG).
- Access control list: FIXED (pointer) -> `### Remote access, file sharing and database ports (reference)`.
- Application allow list: PASS (SP800-167).
- Encryption as an enterprise mitigation; Encryption as a hardening step; Disabling ports and protocols: FIXED (pointers) -> exact reference titles.
- Decommissioning: PASS (SP800-88 Rev. 2).
- Installation of endpoint protection: FIXED (style). Lowercase sentence start.
- Default password changes: PASS (CISA-MIRAI).
- ACL vs permissions vs least privilege: FIXED. "Exam answers often hinge on scope" -> "The right answer depends on the scope asked for".

## Cards to look at (not edited)

- **Birthday (cryptographic attack)**, d2-cards.r5: "a 64-bit hash yields a collision after about 2^32 attempts" is right as an order of magnitude; if it is ever read as "50% at 2^32" it is off (39% there, 50% at about 5.1 billion). Not a contradiction with r8.
- **Logic bomb**, d2-cards.r5: "taking ATMs offline" in the 2013 case is not in the page read (DARKSEOUL). Needs its own source. The chapter leaves it out.
- **Monitoring**, d2-cards.r5: lists "IDS/IPS" under a control called "detective, not preventive". An IPS also prevents. The chapter says so.
- Agreeing with the writer's notes: the RFID price range ($10 to $60) rests on vendor pages only; the one read here says $30.

## Not verified by this reviewer

- NIST SP 800-53 (AC-6, AC-7, AC-10, CM-7, SI-4), SP 800-40, 800-94, 800-123, 800-41, 800-92, 800-128, 800-137, the Cisco ACL page, the Microsoft firewall, EDR, BitLocker and risk detection pages, the MITRE pages other than T1056.001, CIS and the OWASP SQL injection, CSRF and session pages were read by the writer and not re-read here. The claims drawn from them are standard and matched what this reviewer knows; none was changed.
- The 2018 airline case rests on a search summary that quotes the regulator's notice; both direct regulator URLs returned 404.
- "Paying does not guarantee a working key": the CISA guide page read does not say it. It is standard guidance and the card says the same; kept.
- Hardware keyloggers: no primary source page describes the inline device; kept as well established.
- The 8-word overlap check was run against outline.md only (0 hits), not against the web pages read.
