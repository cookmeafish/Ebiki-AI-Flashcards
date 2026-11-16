# d2b knowledge chapter: independent accuracy review 2

Reviewed: `knowledge/d2b-knowledge.r8.md` (objectives 2.4 and 2.5). Corrected pass: `knowledge/d2b-knowledge.r9.md`.
Date: 2026-11-16. This reviewer wrote neither the chapter nor review 1. r8 was not edited.

Result: all 78 `###` sections read again as a learner. Every change review 1 made was re-checked against a source read
this session: all confirmed, 0 reverted. 9 new edits in 7 sections (2 for one teaching fact fix that mattered, 3
precision fixes, 2 clarity fixes, 2 format or wording fixes). Format checks on r9:
first two lines correct, 78 sections, largest 2,887 characters, longest heading under 110, no duplicate titles, no
dashes, no links, no URL text, no HTML-like text, no "exam" wording, every named pointer title exists in r9, in
d2a-knowledge.r9.md or in d0-knowledge.r9.md, and no 8-word run shared with outline.md or with any source text
downloaded this session (list below).

## Sources read this session

Page text was fetched and searched for the exact passage. NIST PDFs were downloaded and their text extracted.

| Key | What was confirmed | URL |
|---|---|---|
| SP800-88r2 | September 2025. Clear: logical techniques, user-addressable locations, against simple non-invasive recovery. Purge: recovery infeasible with state-of-the-art laboratory techniques, media stays reusable. Destroy: disintegrate, incinerate, melt, pulverize, shred; "Pulverize and shred techniques ... should be avoided for anything but the lowest security categories of data". Cryptographic erase is a purge technique. Section 4.6: a certificate of sanitization should be completed; verification and validation | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-88r2.pdf and https://csrc.nist.gov/glossary/term/purge , /clear , /cryptographic_erase |
| SP800-53r5 | AC-6 Least Privilege, AC-7 Unsuccessful Logon Attempts (limit of consecutive invalid attempts, automatic action), AC-10 Concurrent Session Control (limit per account or account type), CM-2, CM-6, CM-7 Least Functionality (functions, ports, protocols, software, services), SI-4 System Monitoring (OSCAL catalog text) | https://raw.githubusercontent.com/usnistgov/oscal-content/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog-min.json |
| SP800-40r4 | April 2022. Maintenance groups; routine patching, emergency patching, emergency mitigation, unpatchable assets; "Delaying routine patching also makes emergency patching more difficult ... because of the need to first install previous patches that new patches depend upon" | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-40r4.pdf |
| SP800-94 | Host-based IDPS watches one host: its own network traffic, system logs, running processes, file access and modification, configuration changes; deploy with prevention capabilities disabled first, then tune | https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-94.pdf |
| NIST-IPS | Intrusion prevention system: "can detect an intrusive activity and also attempt to stop the activity" (SP 800-82r3) | https://csrc.nist.gov/glossary/term/intrusion_prevention_system |
| SP800-167 | File path very weak alone, filename and size not to be used alone, publisher trust assumption can be faulty, signature plus hash most accurate, test in monitoring mode | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-167.pdf |
| SP800-83r1 | File infector, boot sector, multipartite, macro and scripting viruses; malicious mobile code (JavaScript, VBScript); keystroke loggers | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-83r1.pdf |
| SP800-63B-4 | "no more than 100" consecutive failed attempts, by disabling that authenticator | https://pages.nist.gov/800-63-4/sp800-63b.html |
| CISA-UDP | DNS 28 to 54, NTP 556.9, memcached 10,000 to 51,000; CLDAP and SSDP listed | https://www.cisa.gov/news-events/alerts/2014/01/17/udp-based-amplification-attacks |
| BCP38 | RFC 2827, BCP 38, May 2000, ingress filtering against forged source addresses | https://www.rfc-editor.org/rfc/rfc2827.html |
| CISA-MIRAI | 62 default username and password pairs; lives in memory, reboot clears it; quick reinfection unless the password is changed | https://www.cisa.gov/news-events/alerts/2016/10/14/heightened-ddos-threat-posed-mirai-and-other-botnets |
| CISA-WCRY | Spreads through the MS17-010 SMBv1 flaw; "worm ... dropping WannaCry ransomware" | https://www.cisa.gov/news-events/alerts/2017/05/12/indicators-associated-wannacry-ransomware |
| CISA-POODLE | Forced use of SSL 3.0, byte by byte decryption, on-path position; "Both clients and servers need to support TLS_FALLBACK_SCSV" | https://www.cisa.gov/news-events/alerts/2014/10/17/ssl-30-protocol-vulnerability-and-poodle-attack |
| CISA-RW | Isolate first; power down only if unable to disconnect; offline, encrypted backups | https://www.cisa.gov/stopransomware/ransomware-guide |
| CISA-FAQ | "there is no guarantee that they will recover their files if they do [pay]" | https://www.cisa.gov/stopransomware/ransomware-faqs |
| CISA-ED1901 | Stolen credentials of an account that can change DNS records; valid certificates obtained, so no warnings; MFA on DNS accounts | https://www.cisa.gov/news-events/directives/ed-19-01-mitigate-dns-infrastructure-tampering |
| RFC8996 | March 2021, formally deprecates TLS 1.0 and 1.1 | https://www.rfc-editor.org/rfc/rfc8996.txt |
| RFC7507 | Server answers a fallback retry with a fatal inappropriate_fallback alert when it supports a higher version | https://www.rfc-editor.org/rfc/rfc7507.txt |
| RFC6797 | HSTS, bootstrap (first visit) weakness, pre-loaded list | https://www.rfc-editor.org/rfc/rfc6797.txt |
| RFC4033 | DNSSEC: origin authentication and integrity; not designed for confidentiality | https://www.rfc-editor.org/rfc/rfc4033.txt |
| ROGUE-CA | Rogue CA certificate from an MD5 collision, presented 30 December 2008, trusted by all common browsers | https://marc-stevens.nl/research/hashclash/rogue-ca/ |
| SHATTERED | 23 February 2017, two different PDFs with one SHA-1 value (the site now carries unrelated content around the project text) | https://shattered.io/ |
| WFA | WPA3 networks require Protected Management Frames | https://www.wi-fi.org/discover-wi-fi/security |
| MS-EXPLOIT | DEP stops execution of memory not allocated as executable; ASLR counters knowledge of the memory layout | https://learn.microsoft.com/en-us/defender-endpoint/exploit-protection-reference |
| MS-4740 | Event 4740, a user account was locked out, generated every time | https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-4740 |
| MS-1102 | Generated every time the Security audit log is cleared; "Typically you should not see this event" | https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-1102 |
| MS-FW | Windows Firewall default: block unsolicited inbound, allow outbound; domain, private and public profiles, public the strictest | https://learn.microsoft.com/en-us/windows/security/operating-system-security/network-security/windows-firewall/ |
| MS-BITLOCKER | Preboot authentication with a PIN or startup key before the system drive is readable | https://learn.microsoft.com/en-us/windows/security/operating-system-security/data-protection/bitlocker/countermeasures |
| MS-ISOLATE | Device isolation from the network to stop exfiltration and lateral movement | https://learn.microsoft.com/en-us/defender-endpoint/respond-machine-alerts |
| AWS-IMDS | IMDSv2 is session-oriented: a PUT request returns a token that every GET must carry; requests without it get 401 when tokens are required | https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configuring-instance-metadata-service.html |
| T1055.001 | DLL injection: write the DLL path into the target process (VirtualAllocEx, WriteProcessMemory), CreateRemoteThread, LoadLibrary | https://attack.mitre.org/techniques/T1055/001/ |
| T1550.002 | Pass the hash: authenticate without the cleartext password, lateral movement | https://attack.mitre.org/techniques/T1550/002/ |
| CISCO-ACL | Entries checked in order until a match; implicit deny at the end | https://www.cisco.com/c/en/us/support/docs/security/ios-firewall/23602-confaccesslists.html |
| CISCO-DAI | Dynamic ARP inspection validates ARP packets against the DHCP snooping binding database | https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-9/configuration_guide/sec/b_179_sec_9300_cg/configuring_dynamic_arp_inspection.html |
| OWASP | Cheat sheets for SQL injection (prepared statements first, manual escaping strongly discouraged, least privilege), CSRF (SameSite) and session management (HttpOnly, renew the ID on privilege change, absolute timeout): section titles confirmed | https://cheatsheetseries.owasp.org/ |
| BA-NOTICE | Search engine quotes of the regulator's penalty notice of 16 October 2020: "editing of a Javascript file on BA's website", cardholder data sent "to an external third-party domain (www.BAways.com) which was controlled by the Attacker", penalty of 20 million pounds. The notice PDF itself is a scanned image (no text could be extracted) at https://ico.org.uk/media2/migrated/2618421/ba-penalty-20201016.pdf | search result plus image-only PDF |
| KOREA-2013 | News search results: networks of broadcasters and banks went down around 14:00 local time on 20 March 2013; "ATMs temporarily froze"; trade press headline "Cyber attack takes down Korean ATMs, banks"; one report says the malware "included a logic bomb set for that date" | https://www.atmmarketplace.com/news/cyber-attack-takes-down-korean-atms-banks/ and search results (Dark Reading, Washington Times) |
| RFID-PRICE | Retail listings for handheld 125 kHz copiers: about 7 to 20 US dollars for basic units, up to about 60 for kits | marketplace search results only |
| LOCAL | d0-knowledge.r9.md, d2a-knowledge.r9.md, d2-cards.r5.json, d2-extras.r5.json, outline.md, reviews/d2b-kb-review1.md | local |

## Review 1's changes, re-checked

| Review 1 change | Verdict | Source |
|---|---|---|
| Birthday numbers (23 people 50.7%; 64-bit hash: about 40% at 2 to the 32nd, 50% at about 5.1 billion) | Confirmed by calculation: 0.5073; 0.3935; 5.06 billion | arithmetic |
| 2008 case is a rogue CA certificate carrying a real CA's signature | Confirmed | ROGUE-CA |
| 2018 airline case: an edited script sent card data to an attacker domain; 20 million pound penalty in 2020 | Confirmed (from quotes of the notice) | BA-NOTICE |
| PMF protects deauthentication and disassociation frames; mandatory in WPA3 | Confirmed | WFA |
| DEP and ASLR explanations | Confirmed | MS-EXPLOIT |
| IMDSv2 as an extra layer that needs a session token | Confirmed | AWS-IMDS |
| Event 4740 for the lockout itself | Confirmed; agrees with d0 r9 | MS-4740 |
| Logic bomb: "commonly described as a logic bomb", 14:00 local time | Confirmed | KOREA-2013 |
| RFID: the frequency alone does not make a card secure | Kept; vendor knowledge only, sensible softening | none primary |
| Environmental: researcher claim removed | Kept removed | n/a |
| Pointer titles | All resolve in r9, d2a r9 or d0 r9 | local |

No review 1 fix was wrong.

## Changes in r9 (before -> after, why)

1. Hash collision attack, scenario: FIXED (teaching fact). Before: "an attacker distributes a malicious package with the same SHA-1 value as an approved one". That describes matching a file someone else already made, which is a second preimage, not a collision, and it contradicted the birthday section's own statement that second preimages are much harder. After: the supplier builds a harmless package and a malicious twin as a pair, gets the harmless one approved, then ships the twin. One sentence added to "Common confusions" saying the attacker builds both inputs. Source: ROGUE-CA and SHATTERED (both built pairs).
2. Decommissioning: FIXED (precision). "destroy (shred, disintegrate, incinerate ...)" -> "destroy (disintegrate, incinerate or melt ...; shredding or pulverizing dense modern media can leave recoverable pieces, so current NIST guidance keeps those two for the least sensitive data)". Source: SP800-88r2 section 3.1.
3. Account lockout: FIXED (precision). "an account is disabled after too many failed logins" -> "locked (blocked from signing in, usually for a set time or until an administrator unlocks it)". A disabled account is a different state from a locked one. Source: MS-4740, SP800-53r5 AC-7.
4. Downgrade attack: FIXED (precision). "TLS_FALLBACK_SCSV lets a server refuse a deliberate fallback" -> the client marks a retry with an older version, a server that supports something newer refuses it, both ends must support it. Source: RFC7507, CISA-POODLE.
5. Reflected and amplified DDoS: FIXED twice (clarity). "TCP floods rely on the handshake differently" -> TCP must finish a three-way handshake with the real address before any large reply. "often from a single source port" -> "from the abused service's own port (for example source port 53 for DNS or 123 for NTP)"; ports agree with d0 r9.
6. Ransomware: FIXED (wording to match the source). "Paying does not guarantee a working key or that stolen data is deleted" -> "Paying does not guarantee that files are recovered, and nothing forces the gang to delete the data it stole." Source: CISA-FAQ (first half quoted; the second half is a plain statement of fact, not a quoted claim).
7. Access control list, mini-example: FIXED (format). `<db-port>` looked like an HTML tag -> `DB-PORT` plus one line saying what it stands for.

Everything else: PASS.

## Numbers against the reference chapter (d0-knowledge.r9.md)

Events 4625, 4740 and 1102, logon type 3 as network, the 100-attempt limit, TLS 1.0 and 1.1 deprecated in 2021, SSL 3.0 and POODLE, PMF required in WPA3, the half-length collision rule, MD5 and SHA-1 status, the SP 800-88 method names, DNS 53 and NTP 123: all agree. The chapter does not mention Windows logon type 8 or IPsec AH. One small difference, not an error in either: d0 lists "pulverize" among destroy techniques without the caution that SP 800-88r2 attaches to pulverize and shred; r9 of this chapter carries the caution.

## Cards flagged by review 1: verdicts (cards not edited)

- **Birthday (cryptographic attack)**: "a 64-bit hash yields a collision after about 2^32 attempts". CONFIRMED as correct in the usual sense (the birthday bound, square root of the output space). Exact figures: 39.3% at 2^32, 50% at 5.06 billion, expected first collision near 5.4 billion. Not wrong; only imprecise if read as "exactly 50%".
- **Logic bomb**: "taking ATMs offline" in March 2013. CONFIRMED by news reports (KOREA-2013), not by a primary technical source. "Logic bomb" for this case is how reporters described the timed wiper; vendor analyses call it a wiper. Acceptable.
- **Monitoring**: "Detective, not preventive; tools: SIEM, IDS/IPS, EDR". IMPRECISION CONFIRMED: NIST defines an IPS as a system that also attempts to stop the activity (NIST-IPS), and EDR can block. Monitoring as a control is detective; the tool list should say an IPS and EDR can also prevent. The chapter already says this.
- **RFID cloning price** ("roughly $10 to $60"): CONSISTENT with current retail listings (RFID-PRICE). No primary source for a price can exist; it is a market observation and may date.

No new card problems found.

## Still unverified

- The 2018 airline penalty notice: text seen only as search engine quotes; the regulator's PDF is an image scan.
- The March 2013 case: time, targets, ATMs and the "logic bomb" label rest on news reports and one vendor blog.
- RFID details (125 kHz fixed number, site code and card number, default keys on some smart cards, anti-passback): vendor knowledge only.
- Hardware keyloggers between keyboard and computer: well established, no primary source read.
- PCI scope reduction through segmentation and the CIS Benchmarks mention: not re-read by this reviewer (review 1 read the PCI guidance).
- Event 4625 and logon type 3: the Microsoft page was fetched but only the type name could be matched in its text; the facts agree with d0 r9 and with review 1's reading.
- "Nothing forces the gang to delete the data it stole": stated as plain fact, not found as a quote in the CISA pages read.
- The Wi-Fi Alliance page confirms PMF is required in WPA3; the list of frame types PMF protects was not re-read from IEEE or a vendor page this session (review 1 read a vendor page).
