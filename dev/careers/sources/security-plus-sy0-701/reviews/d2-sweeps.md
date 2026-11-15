# d2 sweeps: Domain 2.0 Threats, Vulnerabilities, and Mitigations (pass r3)

Reviewer for `cards/d2-cards.r2.json` (156 cards) and `knowledge/d2-knowledge.r2.md`. Output: `cards/d2-cards.r3.json` and `knowledge/d2-knowledge.r3.md`. Plan: `docs/plans/2026-11-15-card-sweeps.md`.

How it was done:
- Every one of the 156 cards was read in full in each sweep (term, definition, example, keyPoints), against the objective lines in the local `outline.md`.
- Sources were read this session (web pages fetched, or search results where a site refused a fetch; those are marked "search summary"). The per-card source list is at the end.
- Owner rule kept: nothing true and helpful was removed. Changes either fix what a source shows is wrong or imprecise, or add a sourced fact that helps understanding. All new text is in our own words (no copied sentences from any source).
- Every card change was applied to the same text in the chapter (the chapter repeats each card as definition, example and exam tip), so cards and chapter stay identical. One card line (the 2.4 briefing key points) has no copy in the chapter.
- Checks run on r3: valid JSON, 156 cards, every `obj` and `path` unchanged and in the same order, no em or en dashes, no HTML, and the own-words check (`dev/careers/verbatim.mjs` logic against `outline.md`) finds no run of 12+ copied words.
- `build-career.mjs` was not run (other reviewers run in parallel).

Totals: 30 cards changed (33 card edits) plus 1 chapter-only table fix. 156 cards checked in each of the 10 sweeps.

## Sweep 1: Facts
Checked each definition against primary or authoritative sources: MITRE ATT&CK (T1550.002, T1055.001), CWE (22, 367), OWASP (XSS, CSRF, SSRF and SQL injection cheat sheets), NIST CSRC glossary (threat actor, APT, zero-day attack), CISA alerts and guidance, the FBI IC3 BEC notice, the CIS guide to mis-, dis- and malinformation, the Verizon DBIR, and the Professor Messer SY0-701 pages for each topic.
Findings: the cards were accurate overall. Four needed a fix:

- **Nation-state (threat actor)** (card 3, keyPoints). Before: "trap: a well funded criminal gang after money is organized crime, not a nation-state" After: "trap: a well funded criminal gang after money is organized crime, not a nation-state; nuance: some governments also steal money through state hacking units (CISA notes North Korea uses cyber operations to raise revenue), so decide by who is behind the attack, not by the motive alone". Source: https://www.cisa.gov/topics/cyber-threats-and-advisories/nation-state-cyber-actors
- **Email (threat vector)** (card 26, definition). Before: "The most common attack vector: messages carrying phishing links, malicious attachments or fraudulent requests." After: "One of the most common attack vectors: messages carrying phishing links, malicious attachments or fraudulent requests. Breach studies rank phishing among the top three ways attackers first get in, alongside stolen credentials and exploited vulnerabilities.". Source: https://www.helpnetsecurity.com/2025/04/23/verizon-2025-data-breach-investigations-report-dbir/ ; https://www.verizon.com/business/resources/reports/dbir/
- **Bluetooth (unsecure network vector)** (card 39, definition). Before: "use weak pairing or have unpatched Bluetooth flaws." After: "use weak pairing or have unpatched Bluetooth flaws. Some flaws need no pairing at all.". Source: https://www.malwarebytes.com/blog/news/2017/09/blueborne-bluetooths-airborne-influenza (via search summary; armis.com refused the fetch)
- **Bluetooth (unsecure network vector)** (card 39, keyPoints). Before: "reduce risk by turning off discoverability and patching" After: "reduce risk by turning off discoverability and patching; BlueBorne (2017) needed no pairing and also reached devices that were not discoverable, so patching (or turning Bluetooth off) protects more than hiding the device". Source: https://www.malwarebytes.com/blog/news/2017/09/blueborne-bluetooths-airborne-influenza (via search summary; armis.com refused the fetch)
- **Credential replay (network attack)** (card 109, example). Before: "An attacker captures an NTLM hash from network traffic and uses it to authenticate to other servers (pass the hash)." After: "An attacker dumps an administrator's NTLM password hash from a compromised workstation's memory and uses it to sign in to other servers without ever cracking it (pass the hash).". Source: https://attack.mitre.org/techniques/T1550/002/ ; https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/replay-attacks-sy0-701/
- **Credential replay (network attack)** (card 109, keyPoints). Before: "differs from application replay of session tokens/cookies" After: "differs from application replay of session tokens/cookies; the reused data can come from network traffic (cleartext logins, captured authentication exchanges) or from a compromised host's memory". Source: https://attack.mitre.org/techniques/T1550/002/ ; https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/replay-attacks-sy0-701/

Checked 156, changed 4.

## Sweep 2: Numbers and names
Checked ports (Telnet 23/2323, SMB 445, SSH 22, HTTPS 443, MS SQL 1433), years and incident facts (Stuxnet, Mirai and Dyn 2016, WannaCry 2017, SolarWinds 2020, Kaseya 2021, Log4j 2021, POODLE 2014, SHAttered 2017, F-Secure 2020, Target 2013), amplification factors, the birthday numbers (23 people about 50%, 64-bit hash about 2^32 tries), acronym expansions and standard numbers (802.11w, MS17-010, CVE-2021-44228, RFC 8996).
Confirmed unchanged: Mirai and Dyn (October 2016), Log4j (December 2021), POODLE (2014), SHAttered (2017, two PDFs with one SHA-1), 802.11w protected management frames required by WPA3 (Wi-Fi Alliance), birthday math, ACL port examples, the seven listed hardening techniques.

- **Default credentials (threat vector)** (card 41, keyPoints). Before: "Mirai is the classic example;" After: "Mirai is the classic example (it tried a built-in list of 62 common factory username and password pairs, mostly over Telnet on TCP 23 and 2323);". Source: https://www.cisa.gov/news-events/alerts/2016/10/14/heightened-ddos-threat-posed-mirai-and-other-botnets
- **Malicious update (application vulnerability)** (card 64, example). Before: "In 2020 attackers inserted a backdoor into SolarWinds Orion updates, which up to about 18,000 customers downloaded." After: "In 2020 attackers inserted a backdoor into SolarWinds Orion updates; the updates were digitally signed and fewer than 18,000 customers installed them (SolarWinds' own SEC filing).". Source: https://www.sec.gov/Archives/edgar/data/1739942/000162828020017451/swi-20201214.htm ; https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/malicious-updates-sy0-701/
- **Hardware provider (supply chain vulnerability)** (card 79, example). Before: "counterfeit Cisco Catalyst switches that" After: "counterfeit Cisco Catalyst 2960-X switches that". Source: https://www.helpnetsecurity.com/2020/07/15/counterfeit-cisco-switches/ (via search summary)
- **Ransomware (malware)** (card 89, example). Before: "WannaCry (2017) encrypted hundreds of thousands of computers worldwide and demanded Bitcoin payments." After: "WannaCry (May 2017) hit about 200,000 computers in more than 150 countries (Europol's estimate) and demanded about $300 in Bitcoin per computer.". Source: https://www.cisa.gov/news-events/alerts/2017/05/12/indicators-associated-wannacry-ransomware ; Europol estimate via news reports (search summary), e.g. https://globalnews.ca/news/3450067/wannacry-ransomware-threat-escalating-europol/
- **Worm (malware)** (card 91, example). Before: "WannaCry spread worm-style through an SMB vulnerability, jumping from computer to computer inside networks." After: "WannaCry spread worm-style through an SMBv1 vulnerability (the EternalBlue exploit, MS17-010, over TCP 445), jumping from computer to computer inside networks.". Source: https://www.cisa.gov/news-events/alerts/2017/05/12/indicators-associated-wannacry-ransomware
- **Amplified DDoS (network attack)** (card 104, keyPoints). Before: "UDP protocols are favored because they need no handshake" After: "UDP protocols are favored because they need no handshake; measured amplification factors (CISA): DNS about 28 to 54 times, NTP about 557 times, memcached up to about 51,000 times". Source: https://www.cisa.gov/news-events/alerts/2014/01/17/udp-based-amplification-attacks
- **Collision (cryptographic attack)** (card 120, example). Before: "MD5 collisions were used to forge certificates." After: "in 2008 researchers used an MD5 collision to forge a certificate that looked signed by a real certificate authority.". Source: https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/cryptographic-attacks-sy0-701/ ; https://shattered.io/

Checked 156, changed 7.

## Sweep 3: Examples
Checked that every example is concrete, realistic and an instance of its own concept, not a neighbour's (for example, that the credential replay example is not session hijacking, that the watering hole example does not contact the victim, that the brand impersonation example does not rely on a misspelled domain).
All examples are instances of their concept. Two were made precise:

- **Managed service providers (MSPs) (supply chain vector)** (card 43, example). Before: "The 2021 Kaseya VSA attack used an MSP remote management tool to deliver ransomware to many downstream businesses." After: "In July 2021, attackers exploited a flaw in on-premises Kaseya VSA, a remote monitoring and management (RMM) tool that many MSPs use, and pushed ransomware through those MSPs to their downstream customers.". Source: https://www.cisa.gov/news-events/news/kaseya-ransomware-attack-guidance-affected-msps-and-their-customers
- **Virtual machine (VM) escape (virtualization vulnerability)** (card 74, example). Before: "At the Pwn2Own hacking contest, researchers ran code in a guest VM that broke out to the host by exploiting a flaw in the hypervisor's emulated hardware." After: "At Pwn2Own 2017, a team chained a browser bug and a Windows kernel bug inside a guest VM, then exploited a flaw in VMware Workstation's emulated graphics hardware to run code on the host.". Source: https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/virtualization-vulnerabilities-sy0-701/ ; https://www.zerodayinitiative.com/blog/2017/3/17/the-results-pwn2own-2017-day-three (via search summary)

Checked 156, changed 2. (Card 109's example was fixed in sweep 1.)

## Sweep 4: Key points
Checked that each key point is true, useful for the exam and not padded. Added sourced points that help understanding (real cases, defenses, detection nuances). Nothing was removed.

- **Voice call (threat vector)** (card 31, keyPoints). Before: "also includes war dialing and call tampering;" After: "also includes war dialing (dialing number ranges to find systems and modems that answer), spam over internet telephony (SPIT, automated VoIP spam calls) and call tampering (disrupting or denying calls);". Source: https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/common-threat-vectors-sy0-701/
- **Misinformation/disinformation (social engineering)** (card 50, keyPoints). Before: "aimed at reputation, elections or public opinion" After: "aimed at reputation, elections or public opinion; a related term, malinformation, is true information used out of context to mislead or harm; typical campaign: fake accounts post the story, likes and shares amplify it, real users and then media repeat it". Source: https://essentialguide.docs.cisecurity.org/en/v1.41/bp/mdm_info.html ; https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/other-social-engineering-attacks-sy0-701/
- **Watering hole (social engineering attack)** (card 54, keyPoints). Before: "defense: patching, web filtering, layered endpoint protection" After: "defense: patching, web filtering, layered endpoint protection; real case (2017): attackers planted code on financial regulators' websites in Poland and Mexico and served it only to visitors coming from targeted banks' IP addresses". Source: https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/watering-hole-attacks-sy0-701/
- **Brand impersonation (social engineering)** (card 55, keyPoints). Before: "differs from typosquatting, which relies on a misspelled domain" After: "differs from typosquatting, which relies on a misspelled domain; fake brand sites can rank in search results and push prize pop-ups or downloads that install malware". Source: https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/other-social-engineering-attacks-sy0-701/
- **Race conditions (application vulnerability)** (card 61, keyPoints). Before: "fix with locking and atomic operations" After: "fix with locking and atomic operations; real case: at Pwn2Own 2023 a TOCTOU flaw reachable over Bluetooth gave researchers root on a Tesla Model 3's infotainment system". Source: https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/race-conditions-sy0-701/
- **Side loading (mobile device vulnerability)** (card 84, keyPoints). Before: "does not require jailbreaking; block with MDM" After: "does not require jailbreaking; block with MDM; since iOS 17.4, users in the EU may also install apps from approved alternative marketplaces, but Apple still notarizes those apps". Source: https://developer.apple.com/support/alternative-app-marketplace-in-the-eu/
- **Logic bomb (malware)** (card 96, keyPoints). Before: "defense: change management, code review, monitoring" After: "defense: change management, code review, monitoring of critical files, least privilege; real case: in March 2013 a logic bomb at South Korean banks and broadcasters wiped drives and boot records at a set time, taking ATMs offline". Source: https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/other-malware-types-sy0-701/
- **Radio frequency identification (RFID) cloning (physical attack)** (card 100, keyPoints). Before: "defenses: encrypted badges, MFA (badge plus PIN or biometric), shielded sleeves" After: "defenses: encrypted badges, MFA (badge plus PIN or biometric), shielded sleeves; cloners cost under about $50 and copy a card in seconds". Source: https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/physical-attacks-sy0-701/
- **Forgery (application attack)** (card 116, keyPoints). Before: "CSRF abuses the trust a site has in the user's browser;" After: "CSRF abuses the trust a site has in the user's browser, which adds the session cookie to the forged request by itself;". Source: https://community.owasp.org/attacks/csrf ; https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html
- **Forgery (application attack)** (card 116, keyPoints). Before: "XSS runs script, CSRF sends requests" After: "XSS runs script, CSRF sends requests; SSRF defenses: allow lists of permitted destinations, no raw user-supplied URLs, block internal addresses and cloud metadata endpoints". Source: https://community.owasp.org/attacks/csrf ; https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html
- **Directory traversal (application attack)** (card 117, keyPoints). Before: "defenses: input validation, least privilege file permissions, no direct user-controlled paths" After: "defenses: input validation, least privilege file permissions, no direct user-controlled paths; stripping ../ alone is easy to bypass (backslashes, double encoding), so resolve the full path first (canonicalize) and check it against an allow list". Source: https://cwe.mitre.org/data/definitions/22.html
- **Account lockout (indicator)** (card 126, keyPoints). Before: "attacker may also lock accounts on purpose as a DoS;" After: "attacker may also lock accounts on purpose as a DoS, or lock one and then call the help desk posing as the user to get a reset;". Source: https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/indicators-of-compromise-sy0-701/
- **Concurrent session usage (indicator)** (card 127, keyPoints). Before: "compare with impossible travel (logins too far apart in too little time)" After: "compare with impossible travel (logins too far apart in too little time); several sessions can be normal (phone plus laptop, service accounts), so check the IP addresses and times before concluding". Source: https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/indicators-of-compromise-sy0-701/
- **Segmentation (mitigation technique)** (card 136, keyPoints). Before: "segmentation controls traffic between zones, isolation cuts a system off completely" After: "segmentation controls traffic between zones, isolation cuts a system off completely; can be physical (separate hardware), logical (VLANs) or virtual (cloud and VM networks)". Source: https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/segmentation-and-access-control-sy0-701/
- **Access control list (ACL) (mitigation technique)** (card 138, keyPoints). Before: "Rules are processed in order, with an implicit deny at the end on most devices" After: "Rules are checked from the top and the first match wins, with an implicit deny at the end on most devices". Source: https://www.cisco.com/c/en/us/support/docs/security/ios-firewall/23602-confaccesslists.html
- **Application allow list (mitigation technique)** (card 140, keyPoints). Before: "harder to manage where software changes often" After: "harder to manage where software changes often; operating systems can identify approved apps by file hash, digital signature, file path or network zone". Source: https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/segmentation-and-access-control-sy0-701/

Checked 156, changed 15.

## Sweep 5: Confusables
Checked these pairs for correct and consistent separation across cards and the chapter's comparison tables: IDS vs IPS (HIDS vs HIPS), virus vs worm vs Trojan, spyware vs bloatware, TOC vs TOU, SQLi vs XSS, XSS vs CSRF, CSRF vs SSRF, side loading vs jailbreaking, EOL vs EOSL vs legacy, VM escape vs resource reuse, memory injection vs buffer overflow, amplified vs reflected, credential replay vs application replay, concurrent sessions vs impossible travel, collision vs birthday, spraying vs brute force, physical vs password brute force, segmentation vs isolation, allow list vs deny list, ACL vs permissions, misinformation vs disinformation, impersonation vs brand impersonation vs typosquatting, phishing vs vishing vs smishing, service disruption vs disruption/chaos, data exfiltration vs espionage.
All told apart correctly. One wording made consistent:

- **SY0-701 2.4: Given a scenario, analyze indicators of malicious activity** (card 87, keyPoints, card only: the chapter has no copy of this line). Before: "spraying uses one password on many accounts" After: "spraying tries one or a few common passwords on many accounts". Source: https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/password-attacks-sy0-701/ (matches cards 122 and 123)

Checked 156, changed 1.

## Sweep 6: Coverage
Compared every card with its outline line in `outline.md` (2.0 to 2.5). Every line has its card, and every card names everything its line lists: the six actor types, three attributes and ten motivations (2.1); the message-based, image, file, voice, removable, software (client-based vs agentless), unsupported, unsecure network (wireless, wired, Bluetooth), open ports, default credentials, supply chain (MSPs, vendors, suppliers) and ten human vectors (2.2); every vulnerability family and sub-item, including both race condition moments (2.3); nine malware types, three physical attacks, the network, application, cryptographic and password attacks, and the nine indicators (2.4); and every mitigation and the seven hardening techniques (2.5).
Checked 156, changed 0. Concepts a learner needs that no line covers are listed under "Proposed new cards".

## Sweep 7: Consistency
Checked that each fact repeated across cards and the chapter reads the same: Mirai (cards 41, 103, 154), WannaCry (89, 91), SolarWinds (42, 64), Log4j (77, 80), spraying (87, 122, 123, 126), TOC and TOU (61 to 63), buffer overflow 2.3 vs 2.4 (60, 113), supply chain 2.2 vs 2.3, encryption as mitigation vs hardening (143, 149), on-path and ARP indicators (102, 108), and that the chapter's sections, tables and "Check yourself" answers match the cards. The script applied every card fix to the chapter's matching text in the same step.
One chapter-only mismatch fixed:

- **Chapter table, Unskilled attacker row** (chapter only). Before: `| Unskilled attacker | External | Low |` After: `| Unskilled attacker | Usually external | Low |`. Source: https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/threat-actors-sy0-701/ (usually external, sometimes internal).

Checked 156, changed 0 cards, 1 chapter line.

## Sweep 8: Clarity
Checked each card for plain, fluff free wording that reads on the first pass (the teaching style rule), no em or en dashes and no HTML (machine check on the r3 JSON and chapter: none). Added key points were kept to short clauses in the cards' existing "term: fact; fact" style. All 38 Professor Messer "Watch" links in the chapter answer HTTP 200.
Checked 156, changed 0.

## Sweep 9: Exam fit
Checked that wording follows SY0-701 terms rather than older exams: unskilled attacker (formerly script kiddie), on-path (formerly man-in-the-middle), on-path browser, application allow list (formerly whitelisting), typosquatting (also URL hijacking), shadow IT as a threat actor, and that outdated items are labeled as outdated (WEP, early WPA, SSL 3.0, MD5, SHA-1, DES, RC4, Windows XP).
One change, to name exactly which protocol versions are now deprecated:

- **Downgrade (cryptographic attack)** (card 119, keyPoints). Before: "disable old protocols and ciphers (SSL, early TLS), HSTS against SSL stripping" After: "disable old protocols and ciphers (every SSL version, plus TLS 1.0 and 1.1, which RFC 8996 deprecated in 2021), TLS_FALLBACK_SCSV to refuse forced fallback, HSTS against SSL stripping". Source: https://www.rfc-editor.org/rfc/rfc8996.html ; https://www.cisa.gov/news-events/alerts/2014/10/17/ssl-30-protocol-vulnerability-and-poodle-attack

Checked 156, changed 1.

## Sweep 10: Final adversarial pass
Tried to prove each card wrong, looking for over-claims, absolutes and claims no source read this session supports. Results:
- Confirmed by a source read this session: the claims behind the changes above, plus SMS having no built-in sender authentication (the FCC has noted its caller ID framework does not yet cover texts), ACLs ending in an implicit deny (Cisco), dynamic ARP inspection dropping ARP replies that do not match DHCP snooping bindings (Cisco), EOL vs EOSL (Messer), keyloggers capturing input before encryption (Messer), Secure Boot against rootkits (Messer), DEP and ASLR against overflows (Messer), MD5 collision used for a forged CA-signed certificate in 2008 (Messer), financial gain as the dominant motive (DBIR: espionage about 17% of cases).
- Over-claims fixed earlier: "the most common attack vector" (card 26, sweep 1).
- Nothing left that a read source contradicts. Items supported only by search-result summaries (no page fetched) are listed under "Unsure".
Checked 156, changed 0 (new).

## Proposed new cards
The coverage test needs exactly one card per outline line, so these are proposals for the coordinator.
1. **Botnet and command and control (C2).** Named in cards 41, 103 and in the DDoS definitions but never defined; learners need to know what a bot, a botnet and a C2 server are to read DDoS and worm scenarios. Source: https://www.cisa.gov/news-events/alerts/2016/10/14/heightened-ddos-threat-posed-mirai-and-other-botnets ; https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/denial-of-service-sy0-701/
2. **Advanced persistent threat (APT).** Used in the nation-state, sophistication and Check yourself items; only explained in passing. NIST's definition (long-term foothold, adapts to defenders) is worth its own card. Source: https://csrc.nist.gov/glossary/term/advanced_persistent_threat
3. **Session hijacking (side jacking).** The replay card's example is session hijacking, and XSS steals session cookies; a card would separate it from credential replay. Source: https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/replay-attacks-sy0-701/
4. **Evil twin and rogue access point.** Named in the wireless vector and attack cards (10 mentions across the course) with no card of their own; frequent exam scenario. Source: https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/common-threat-vectors-sy0-701/ (check first whether a domain 4 card already covers them).
5. **Fileless malware.** Mentioned in the virus and memory injection cards; it explains why signature antivirus misses some attacks and why resource and process indicators matter. Source: https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/viruses-and-worms-sy0-701/
6. **Drive-by download.** A web delivery route with no click, not covered by any 2.2 line. Source: https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/an-overview-of-malware-sy0-701/

## Unsure
- **Call tampering (card 31).** Kept from r2. The Messer common threat vectors page read this session mentions vishing, spam over IP, war dialing and calls used for denial of service, but not the words "call tampering". Kept because it is widely taught for this line and is not shown wrong; the definition given ("disrupting or denying calls") is our own reading.
- **Pass the hash from network traffic.** Professor Messer's replay page describes pass the hash as replaying a hash captured from the network. MITRE (T1550.002) describes hashes obtained by credential access, typically dumped from a host. Card 109's example now uses a memory dump (true in both views) and its key points name both origins. A captured NetNTLM challenge-response cannot itself be passed as a hash (it is relayed or cracked instead); this is technical detail beyond the exam and not added.
- **Search-summary-only facts** (no page fetched; the summary cited the named reports): Target 2013 via Fazio Mechanical HVAC credentials (Senate Commerce kill chain report), Dyn October 2016 with Mirai as the primary source, British Airways 2018 payment page script (ICO findings), Stuxnet spread on USB drives, BlueBorne needing no pairing (Malwarebytes, Armis), F-Secure counterfeit Catalyst 2960-X switches, Pwn2Own 2017 VMware escape. All agree with the cards; a coordinator who wants page-level evidence should fetch those.
- **Hacktivist sophistication.** Card 5 says it "varies widely"; Messer rates hacktivists as often highly skilled. Not wrong, left as is.
- **WannaCry count.** "About 200,000" is Europol's early (May 2017) estimate; other sources give different totals. The card names it as Europol's estimate.

## Sources per card
Abbreviations: Messer = the Professor Messer SY0-701 video page for that topic (TA threat actors, TV common threat vectors, PH phishing, IMP impersonation, WH watering hole, OSE other social engineering, MI memory injections, RC race conditions, MU malicious updates, HW hardware, VV virtualization, CLOUD cloud-specific, MOB mobile, MAL malware overview, VW viruses and worms, SB spyware and bloatware, OM other malware types, PHY physical attacks, DOS denial of service, DNS, WL wireless, OP on-path, RP replay, MC malicious code, AA application attacks, CA cryptographic attacks, PW password attacks, IOC indicators of compromise, SEG segmentation and access control, MIT mitigation techniques, HARD hardening). Full URLs for the other sources are in the sweep entries above or here: NIST threat actor https://csrc.nist.gov/glossary/term/threat_actor ; NIST APT https://csrc.nist.gov/glossary/term/advanced_persistent_threat ; NIST zero-day attack https://csrc.nist.gov/glossary/term/zero_day_attack ; CISA soc-eng https://www.cisa.gov/news-events/news/avoiding-social-engineering-and-phishing-attacks ; CISA Log4j https://www.cisa.gov/news-events/news/apache-log4j-vulnerability-guidance ; FBI IC3 BEC https://www.ic3.gov/PSA/2024/PSA240911 ; MITRE T1055.001 https://attack.mitre.org/techniques/T1055/001/ ; CWE-367 https://cwe.mitre.org/data/definitions/367.html ; OWASP XSS https://community.owasp.org/attacks/xss ; OWASP SQLi https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html ; WFA WPA3 https://www.wi-fi.org/discover-wi-fi/security ; Cisco DAI https://www.cisco.com/c/en/us/support/docs/switches/lan-switch-software/222274-troubleshoot-dynamic-arp-inspection-dai.html (search summary).

| Card | Term | Sources |
|---|---|---|
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
