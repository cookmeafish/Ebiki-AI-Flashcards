# d2a knowledge chapter: independent accuracy review 1

Reviewed: `knowledge/d2a-knowledge.r7.md` (objectives 2.1 to 2.3, 64 `###` sections). Output: `knowledge/d2a-knowledge.r8.md`
(r7 untouched). Date: 2026-11-15. Cards compared: `cards/d2-cards.r5.json` and `cards/d2-extras.r5.json` (every 2.1 to 2.3
card read beside its section). Every source below was fetched and read in this review session unless marked otherwise.

Format after the pass: 64 `###` sections, largest 2,633 characters, total 126,014 characters, no duplicate titles, every
heading at most 110 characters, no em or en dashes, no links, no HTML, the word "exam" no longer appears.

## Sources read in this review

| Key | Page | URL |
|---|---|---|
| ZDI17 | Zero Day Initiative, Pwn2Own 2017 day three results | https://www.zerodayinitiative.com/blog/2017/3/17/the-results-pwn2own-2017-day-three |
| ZDI23 | Zero Day Initiative, Pwn2Own Vancouver 2023 day one results | https://www.zerodayinitiative.com/blog/2023/3/22/pwn2own-vancouver-2023-day-one-results |
| MIRAI | CISA alert on Mirai and other botnets | https://www.cisa.gov/news-events/alerts/2016/10/14/heightened-ddos-threat-posed-mirai-and-other-botnets |
| SW8K | SolarWinds Form 8-K, 14 December 2020 | https://www.sec.gov/Archives/edgar/data/1739942/000162828020017451/swi-20201214.htm |
| XSSP | OWASP XSS Prevention Cheat Sheet | https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html |
| DOMX | OWASP community, DOM Based XSS | https://community.owasp.org/attacks/DOM_Based_XSS |
| CWIFI | CISA, Securing Wireless Networks | https://www.cisa.gov/news-events/news/securing-wireless-networks |
| NROG | NIST glossary, rogue device (SP 800-115) | https://csrc.nist.gov/glossary/term/rogue_device |
| VZ25 | Verizon news release, 2025 Data Breach Investigations Report | https://www.verizon.com/about/news/2025-data-breach-investigations-report |
| WCRY | CISA alert, indicators associated with WannaCry | https://www.cisa.gov/news-events/alerts/2017/05/12/indicators-associated-wannacry-ransomware |
| C1X | Cisco Catalyst 9300 guide, IEEE 802.1X port-based authentication | https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-9/configuration_guide/sec/b_179_sec_9300_cg/configuring_ieee_802_1x_port_based_authentication.html |
| CEOL | Cisco end-of-life policy | https://www.cisco.com/c/en/us/products/eos-eol-policy.html |
| STA1 | NIST Mobile Threat Catalogue STA-1 (rooting and jailbreaking) | https://pages.nist.gov/mobile-threat-catalogue/stack-threats/STA-1.html |
| BEC | FBI IC3 PSA 240911 | https://www.ic3.gov/PSA/2024/PSA240911 |
| WFA | Wi-Fi Alliance, security | https://www.wi-fi.org/discover-wi-fi/security |
| CINS | CISA, defining insider threats | https://www.cisa.gov/topics/physical-security/insider-threat-mitigation/defining-insider-threats |
| MSLC | Microsoft Learn, Fixed Lifecycle Policy | https://learn.microsoft.com/en-us/lifecycle/policies/fixed |
| CNS | CISA, nation-state cyber actors | https://www.cisa.gov/topics/cyber-threats-and-advisories/nation-state-cyber-actors |
| KAS | CISA, Kaseya guidance for MSPs and customers | https://www.cisa.gov/news-events/news/kaseya-ransomware-attack-guidance-affected-msps-and-their-customers |
| LPN9 | NIST Mobile Threat Catalogue LPN-9 (bluesnarfing) | https://pages.nist.gov/mobile-threat-catalogue/lan-pan-threats/LPN-9.html |
| LPN14 | NIST Mobile Threat Catalogue LPN-14 (bluejacking) | https://pages.nist.gov/mobile-threat-catalogue/lan-pan-threats/LPN-14.html |
| VU24 | CERT/CC VU#240311 (BlueBorne) | https://www.kb.cert.org/vuls/id/240311 |
| N193 | NIST SP 800-193 abstract | https://csrc.nist.gov/pubs/sp/800/193/final |
| APEU | Apple, alternative app marketplaces in the EU | https://developer.apple.com/support/alternative-app-marketplace-in-the-eu/ |
| MSMAC | Microsoft Learn, macros from the internet blocked by default | https://learn.microsoft.com/en-us/microsoft-365-apps/security/internet-macros-blocked |
| T1055 | MITRE ATT&CK T1055.001 DLL injection | https://attack.mitre.org/techniques/T1055/001/ |
| T1200 | MITRE ATT&CK T1200 Hardware Additions | https://attack.mitre.org/techniques/T1200/ |
| T1189 | MITRE ATT&CK T1189 Drive-by Compromise | https://attack.mitre.org/techniques/T1189/ |
| TSVG | MITRE ATT&CK T1027.017 SVG Smuggling | https://attack.mitre.org/techniques/T1027/017/ |
| R8996 | RFC 8996 | https://www.rfc-editor.org/rfc/rfc8996.html |
| NZD | NIST glossary, zero day attack | https://csrc.nist.gov/glossary/term/zero_day_attack |
| BADP | CISA, product security bad practices | https://www.cisa.gov/resources-tools/resources/product-security-bad-practices |
| SQLP | OWASP SQL Injection Prevention Cheat Sheet | https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html |
| FSEC | Help Net Security on the counterfeit switch report (secondary) | https://www.helpnetsecurity.com/2020/07/15/counterfeit-cisco-switches/ |
| BOD | CISA BOD 20-01 | https://www.cisa.gov/news-events/directives/bod-20-01-develop-and-publish-vulnerability-disclosure-policy |
| C367 | CWE-367 | https://cwe.mitre.org/data/definitions/367.html |
| SRCH | Web search summaries only (2025 breach study phishing and human element figures; NSA cloud guidance; CISA information disorder definitions) | (search results, secondary) |

Could not be opened (HTTP 403): the NSA "Mitigating Cloud Vulnerabilities" PDF on media.defense.gov and the original
BlueBorne research page.

## Result per section

2.1
- Threat actor (threat source, adversary): PASS.
- Nation-state actor and APT: FIXED (rule). "although exam questions usually pair APT with nation-states" -> "in practice the label is most often applied to state-backed groups". Facts PASS against CNS (four states named, revenue point is about one state).
- Unskilled attacker: PASS (definition from vendor glossaries only, matches the card).
- Hacktivist: FIXED (rule). "answer from the clues given" -> "judge from the evidence at hand". Definition rests on vendor pages and the card.
- Insider threat: PASS against CINS (five types and their descriptions match).
- Organized crime: FIXED (rule). "on the exam a professional, profit-driven group points to organized crime" reworded to a plain definition.
- Shadow IT: PASS (vendor definition, matches the card).
- Threat actor attributes: FIXED (rule). Scenario "a question asks" -> "a reviewer asks".
- Comparing threat actors: FIXED (heading 127 -> 101 characters).
- Financial gain and blackmail: PASS.
- Data exfiltration and espionage: FIXED (rule). "When a question stresses ... choose" reworded.
- Service disruption, chaos and war: PASS.
- Beliefs, revenge and ethical hacking: PASS against BOD.
- Comparing motivations: FIXED (heading 159 -> 98 characters; "the motive the question emphasizes" reworded).

2.2
- Threat vector vs attack surface: PASS.
- Email as a threat vector: FIXED (fact). "phishing third ... at about 15 percent" -> phishing third, behind credential abuse (about 22 percent) and exploited vulnerabilities (about 20 percent). VZ25 gives 22 and 20 and no phishing figure; secondary summaries disagree on 15 or 16 for phishing, so the phishing number was removed.
- SMS and IM: FIXED (rule). "the exam pairs SMS with smishing" reworded.
- Image-based vector: FIXED (rule). "the question will hint" reworded. Facts PASS against TSVG.
- File-based vector: FIXED (rule). Facts PASS against MSMAC (Windows only, Mark of the Web, stated reason).
- Voice call vector: FIXED (rule wording).
- Removable device vector: PASS against T1200 (keystroke injection named there).
- Vulnerable software, client-based vs agentless: PASS against the cards. No primary source defines the pair; left at the cards' meaning.
- Drive-by download: PASS against T1189 (all four delivery routes, version check, internal network foothold).
- Unsupported systems: PASS against MSLC and BADP (support period stated at time of sale).
- Unsecure wireless networks: FIXED (fact, teaching). Before: "an evil twin is a rogue that imitates a legitimate network name" and "a rogue access point plugged into the internal network by anyone". After: a rogue access point is any unauthorized access point on the organization's network (attacker or employee) and its danger is the back door; an evil twin copies a legitimate network name to intercept users and needs no connection to the real network. Sources: CWIFI (evil twin impersonates a real access point), NROG (rogue device = unauthorized node on a network). WPA3 statements PASS against WFA. "VPN" expanded.
- Unsecure wired networks: FIXED (fact). "the switch blocks everything except authentication traffic" -> the port stays unauthorized and passes essentially only authentication frames; supplicant, authenticator and authentication server named. Source C1X (the vendor implementation also lets two switch housekeeping protocols through, hence "essentially"). The attack group example PASS against T1200.
- Bluetooth: FIXED (fact). BlueBorne now names the affected platforms and the fix (operating system updates), and "even when non-discoverable" is softened to "reportedly", because VU24 confirms an unauthenticated nearby attacker, the platforms, the year and patching, but is silent on discoverable mode and the research page could not be opened. Bluejacking and bluesnarfing PASS against LPN14 and LPN9.
- Open service ports: FIXED (small). "watch the Telnet ports" -> "watch the Telnet ports for takeover attempts" (MIRAI).
- Default credentials: PASS against MIRAI (62 pairs, above 620 gigabits per second, device types) and BADP.
- Supply chain vector: PASS against KAS (July 2021, on-premises product, every listed control) and VZ25 (third parties 30 percent, doubled).
- Social engineering and its levers: FIXED (fact softened). "found a human element in roughly 60 percent" -> "Summaries of a large 2025 breach study put ...": the figure appears only in secondary summaries read this session, not on VZ25.
- Phishing, spear phishing and whaling: PASS.
- Vishing: FIXED (rule wording).
- Smishing: FIXED (rule). "in the exam's naming" reworded.
- Misinformation and disinformation: FIXED (wording). The disinformation definition ran close to the agency's own sentence; rewritten in our own words, same meaning (SRCH).
- Impersonation and pretexting: FIXED (rule wording).
- Business email compromise: PASS against BEC (55.5 billion dollars, October 2013 to December 2023, the advice listed).
- Watering hole: PASS against T1189.
- Brand impersonation: PASS.
- Typosquatting: PASS.
- Comparing social engineering: FIXED (heading 125 -> 103 characters, BEC expanded in the first line; three "the question" phrasings reworded).
- Comparing web-based lures: FIXED (heading 123 -> 104 characters).
- Comparing threat vectors: FIXED (heading 121 -> 105 characters; rule wording).

2.3
- Memory injection: PASS against T1055 (path written into the target, remote thread, in-memory variants).
- Buffer overflow: PASS against BADP (memory-safe languages). The 0x41414141 example is plain ASCII arithmetic (0x41 = "A").
- Race condition (TOCTOU): FIXED (fact). "used a TOCTOU flaw in a car's gateway system to send it arbitrary messages and won the car" -> "demonstrated a TOCTOU attack against a car's gateway system and won the car". ZDI23 says nothing about arbitrary messages. Lock wording aligned with C367 (lock before the check).
- Malicious update: FIXED (fact precision). "may have installed the affected versions" -> "may have had an affected version installed", the filing's meaning (SW8K). March to June 2020 and the build system compromise PASS.
- OS-based vulnerabilities: PASS against WCRY (tens of thousands of infections, more than 150 countries, patch issued 14 March 2017, attack in May).
- SQL injection: PASS against SQLP and BADP. The web application firewall stopgap is not on the page read; it is common practice and labelled a stopgap.
- Cross-site scripting: FIXED (fact). DOM-based type now states that the server response is unchanged and the payload takes effect only in the browser (DOMX). Content Security Policy as an extra layer and cookie attributes PASS against XSSP.
- Firmware: PASS against N193.
- End-of-life and legacy hardware: FIXED (fact softened). Added that vendors label lifecycle stages differently, with one vendor's end-of-sale date, last date of support and "end-of-life process" as the example (CEOL), so the dates matter more than the label. The card's "EOL = no longer sold, EOSL = support ended" is kept as the course meaning.
- VM escape: FIXED (fact, card alignment). The chapter described only one 2017 contest entry and the card another; ZDI17 lists both (one team: browser flaw, guest kernel flaw, hypervisor flaw; the other: guest kernel flaw plus two hypervisor flaws). The chapter now gives both, so it no longer looks like a contradiction of the card.
- Resource reuse: PASS (control name matches NIST SP 800-53 SC-4 as cited by the writer; not re-read).
- Cloud-specific vulnerabilities: FIXED (fact softened). "ranked misconfiguration as the most common cloud vulnerability" -> the four classes stated as fact, the prevalence ranking attributed as "widely reported". The agency PDF returned 403; secondary summaries agree on the four classes, misconfiguration as most prevalent and shared tenancy as rare. "A provider's breach is rare" softened to "reported far less often".
- Supply chain vulnerabilities: PASS against FSEC (2020, found after a software update, built to bypass authentication).
- Cryptographic vulnerabilities: FIXED (teaching, legacy labels). MD5 and SHA-1 now labelled broken, SSL labelled obsolete, TLS expanded and labelled deprecated in the scenario, "plain MD5" -> "unsalted MD5". Facts PASS against R8996 (deprecation, TLS 1.2 minimum, SHA-1 in the handshake).
- Misconfiguration: PASS.
- Side loading: FIXED (fact precision). "Since iOS 17.4 ... Apple still requires those apps to be notarized" -> "On iOS 17.4 or later ... marketplaces, which distribute apps that Apple has notarized" (APEU).
- Jailbreaking and rooting: FIXED (fact softened). Dropped the untraced "verified boot and some security updates may stop working as designed"; now says built-in controls and store vetting are bypassed (STA1), bootloader unlocking limited to "some Android devices", and detection described through hardware-backed attestation plus patching (STA1).
- Zero-day: PASS against NZD.
- Comparing application vulnerabilities: FIXED (heading 116 -> 106 characters; rule wording).
- Comparing web vulnerabilities: FIXED (fact). Table row "Primary fix ... Output encoding, Content Security Policy" -> output encoding for the context, with Content Security Policy as an added layer (XSSP says it must not be the primary defense).
- Comparing platform vulnerabilities: FIXED (heading 127 -> 109 characters; scenario no longer says "the question stresses").

Totals: 64 sections checked, 26 PASS, 38 FIXED. Of the fixes, 14 are factual (corrected, tightened or softened), 7 are heading
lengths, and the rest are rule wording (exam-knowledge phrasing) or teaching clarity.

## Cards I believe are wrong or imprecise (cards not edited)

- 2.3 "Malicious update": "fewer than 18,000 customers installed them (SolarWinds' own SEC filing)". The filing says fewer than 18,000 customers "may have had an installation" of an affected version. The card states an upper estimate as a count of installs. Suggested: "fewer than 18,000 customers may have installed them".
- 2.3 "Cross-site scripting (XSS)": key points list "fix: output encoding, input validation, Content Security Policy" as equals. OWASP says Content Security Policy is defense in depth and should not be the primary defense. Imprecise, not false.
- 2.3 "End-of-life (EOL)": "EOL = no longer sold" is one common usage, but a major vendor uses end-of-life for the whole retirement process and separate end-of-sale and last-date-of-support dates. Imprecise as a universal definition.
- 2.3 "Cloud-specific vulnerabilities": "Most cloud breaches come from customer misconfiguration, not the provider" is a widely repeated claim that I could not trace to a primary source this session.

Cards the writer doubted that I found CORRECT:
- 2.3 "VM escape" (browser bug, Windows kernel bug, then a VMware Workstation flaw): matches one team's entry on ZDI17 (Edge heap overflow, kernel type confusion, Workstation uninitialized buffer). The detail "emulated graphics hardware" is not on that page and stays unverified.
- 2.2 "Default credentials" (62 pairs, "mostly over Telnet on TCP 23 and 2323"): MIRAI names 62 pairs and tells owners to monitor 23/TCP and 2323/TCP for takeover attempts using the Telnet protocol. "Mostly" is the card's own word, but the substance holds.

## Not verified this session

- NSA cloud guidance prevalence ratings: document not readable (403); chapter wording now attributes the ranking as reported.
- BlueBorne working against non-discoverable devices: research page not readable; chapter says "reportedly". The card states it as fact.
- 2025 breach study: human element (about 60 percent) and the phishing share come from secondary summaries; the publisher's release confirmed only 22, 20 and 30 percent.
- Client-based vs agentless, shadow IT, hacktivist and unskilled attacker definitions: no primary (NIST, CISA) definition exists; kept at the cards' meaning.
- NIST SP 800-53 SC-4, CWE-120, CWE-89, CISA ransomware and SBOM pages, Log4j guidance, MITRE T1566 family, T1091, T1078.001, T1195 and the steganography page were read by the writer and not re-read here; their claims in the chapter are standard and I found nothing that conflicts with what I did read.
- 8-word overlap was checked by eye against the pages read in this review only; the build's automated overlap checks should still be run on r8.
