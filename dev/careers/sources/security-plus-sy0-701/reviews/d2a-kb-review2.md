# d2a knowledge chapter: independent accuracy review 2

Reviewed: `knowledge/d2a-knowledge.r8.md` (objectives 2.1 to 2.3, 64 `###` sections). Output: `knowledge/d2a-knowledge.r9.md`
(r8 untouched). Date: 2026-11-16. A different reviewer from review 1. Cards compared: `cards/d2-cards.r5.json`,
`cards/d2-extras.r5.json` (not edited). Reference chapter compared: `knowledge/d0-knowledge.r9.md`.

Format after the pass: 64 `###` sections, largest 2,629 characters, total 126,208 characters, 68 headings, none repeated,
longest 109 characters, no em or en dashes, no links, no "http" text, no HTML, no question-and-answer blocks, the word
"exam" absent, line 1 is the title and line 2 is "Checked as of 2026-11 for SY0-701.".

How pages were read: fetched in this session and read either through the fetch tool, or (where the tool could not parse a
PDF or ran out of quota) downloaded and searched as text. Each row says which.

## Sources read in this review

| Key | Page | URL | How read |
|---|---|---|---|
| DBIR | 2025 Data Breach Investigations Report, full report | https://www.verizon.com/business/resources/reports/2025-dbir-data-breach-investigations-report.pdf | PDF text |
| DBIRX | Same study, executive summary | https://www.verizon.com/business/resources/reports/2025-dbir-executive-summary.pdf | PDF text |
| ARM | Discoverer's BlueBorne technical white paper (30 Nov 2017) | https://info.armis.com/rs/645-PDC-047/images/BlueBorne%20Technical%20White%20Paper_20171130.pdf | PDF text |
| VU24 | CERT/CC VU#240311 | https://www.kb.cert.org/vuls/id/240311 | fetch |
| SC4 | NIST SP 800-53 Rev. 5, control SC-4 | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf | PDF text |
| C120 | CWE-120 | https://cwe.mitre.org/data/definitions/120.html | fetch |
| C89 | CWE-89 | https://cwe.mitre.org/data/definitions/89.html | fetch |
| C367 | CWE-367 | https://cwe.mitre.org/data/definitions/367.html | page text |
| LOG | CISA advisory AA21-356A (Log4j) | https://www.cisa.gov/news-events/cybersecurity-advisories/aa21-356a | fetch |
| SBOM | CISA, SBOM | https://www.cisa.gov/sbom | fetch |
| T1566 | MITRE ATT&CK T1566 Phishing | https://attack.mitre.org/techniques/T1566/ | fetch |
| T1091 | MITRE ATT&CK T1091 | https://attack.mitre.org/techniques/T1091/ | fetch |
| T1078 | MITRE ATT&CK T1078.001 Default Accounts | https://attack.mitre.org/techniques/T1078/001/ | fetch |
| T1195 | MITRE ATT&CK T1195 Supply Chain Compromise | https://attack.mitre.org/techniques/T1195/ | fetch |
| STEG | MITRE ATT&CK T1027.003 Steganography | https://attack.mitre.org/techniques/T1027/003/ | fetch |
| T1200 | MITRE ATT&CK T1200 Hardware Additions | https://attack.mitre.org/techniques/T1200/ | fetch |
| T1189 | MITRE ATT&CK T1189 Drive-by Compromise | https://attack.mitre.org/techniques/T1189/ | page text |
| T1055 | MITRE ATT&CK T1055.001 | https://attack.mitre.org/techniques/T1055/001/ | page text |
| ZDI23 | Pwn2Own Vancouver 2023 day one results | https://www.zerodayinitiative.com/blog/2023/3/22/pwn2own-vancouver-2023-day-one-results | fetch |
| ZDI17 | Pwn2Own 2017 day three results | https://www.zerodayinitiative.com/blog/2017/3/17/the-results-pwn2own-2017-day-three | fetch |
| SW8K | SolarWinds Form 8-K, 14 Dec 2020 | https://www.sec.gov/Archives/edgar/data/1739942/000162828020017451/swi-20201214.htm | fetch |
| XSSP | OWASP XSS Prevention Cheat Sheet | https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html | fetch |
| DOMX | OWASP, DOM Based XSS | https://community.owasp.org/attacks/DOM_Based_XSS | page text |
| CWIFI | CISA, Securing Wireless Networks | https://www.cisa.gov/news-events/news/securing-wireless-networks | fetch |
| NROG | NIST glossary, rogue device | https://csrc.nist.gov/glossary/term/rogue_device | fetch |
| CEOL | Cisco end-of-life policy | https://www.cisco.com/c/en/us/products/eos-eol-policy.html | fetch |
| APEU | Apple, alternative app marketplaces in the EU | https://developer.apple.com/support/alternative-app-marketplace-in-the-eu/ | fetch |
| STA1 | NIST Mobile Threat Catalogue STA-1 | https://pages.nist.gov/mobile-threat-catalogue/stack-threats/STA-1.html | fetch |
| R8996 | RFC 8996 | https://www.rfc-editor.org/rfc/rfc8996.html | fetch |
| WFA | Wi-Fi Alliance, security | https://www.wi-fi.org/discover-wi-fi/security | fetch |
| WCRY | CISA alert on WannaCry indicators | https://www.cisa.gov/news-events/alerts/2017/05/12/indicators-associated-wannacry-ransomware | fetch |
| MIRAI | CISA alert on Mirai | https://www.cisa.gov/news-events/alerts/2016/10/14/heightened-ddos-threat-posed-mirai-and-other-botnets | page text |
| BEC | FBI IC3 PSA 240911 | https://www.ic3.gov/PSA/2024/PSA240911 | page text |
| KAS | CISA, Kaseya guidance | https://www.cisa.gov/news-events/news/kaseya-ransomware-attack-guidance-affected-msps-and-their-customers | page text |
| MSMAC | Microsoft Learn, internet macros blocked | https://learn.microsoft.com/en-us/microsoft-365-apps/security/internet-macros-blocked | fetch (full text) |
| MSLC | Microsoft Learn, Fixed Lifecycle Policy | https://learn.microsoft.com/en-us/lifecycle/policies/fixed | fetch (full text) |
| CINS | CISA, defining insider threats | https://www.cisa.gov/topics/physical-security/insider-threat-mitigation/defining-insider-threats | fetch |
| CNS | CISA, nation-state cyber actors | https://www.cisa.gov/topics/cyber-threats-and-advisories/nation-state-cyber-actors | page text |
| N193 | NIST SP 800-193 abstract | https://csrc.nist.gov/pubs/sp/800/193/final | page text |
| NZD | NIST glossary, zero day attack | https://csrc.nist.gov/glossary/term/zero_day_attack | page text |
| BADP | CISA, product security bad practices | https://www.cisa.gov/resources-tools/resources/product-security-bad-practices | page text |
| NCSC | UK National Cyber Security Centre, shadow IT guidance | https://www.ncsc.gov.uk/guidance/shadow-it | fetch |
| SWK | SecurityWeek report on the NSA cloud guidance (secondary) | https://www.securityweek.com/nsa-shares-guidance-mitigating-cloud-vulnerabilities/ | fetch |

Could not be opened: the NSA "Mitigating Cloud Vulnerabilities" PDF (HTTP 403 from the fetch tool and from a plain
download), the NSA press page (403), the CISA alert that announces it (opens, but only links to the PDF), the discoverer's
BlueBorne web page (403, the white paper PDF above was readable instead). NIST glossary has no entry for "hacktivist" or
"script kiddie" (both 404). Not re-read by me because the fetch quota ran out: the Cisco 802.1X configuration guide, the
BOD 20-01 detail wording on legal action, MITRE T1027.017, NIST LPN-9 and LPN-14, the counterfeit switch report.

## 1. Review-1 fixes re-checked

| Review-1 fix | Verdict | Source |
|---|---|---|
| Phishing ranked third behind credential abuse (about 22 percent) and exploited vulnerabilities (about 20 percent); phishing figure removed | CONFIRMED. The report gives 22 and 20 and says vulnerability exploitation overtook phishing for second place. The report body also puts phishing "around 15%", so r7's original 15 was not wrong; one other passage gives 14, so leaving the number out is the safer wording and I kept it | DBIR |
| Human element "roughly 60 percent" attributed to "summaries" | CORRECTED (firmed up). The report itself states human involvement at 60 percent (61 the year before). r9 now states it as the study's finding | DBIR, DBIRX |
| Third parties about 30 percent, double the previous year | CONFIRMED (15 to 30 percent) | DBIRX |
| BlueBorne "reportedly" against non-discoverable devices | CORRECTED (firmed up, attributed). The discoverer's white paper says the attack needs neither discoverable mode nor pairing nor user authorization. CERT/CC is silent on it, so r9 says "according to the researchers who found the flaws" | ARM, VU24 |
| BlueBorne platforms and operating system updates | CONFIRMED (Windows, iOS up to 9.3.5, Android, Linux; patches for all four) | VU24, ARM |
| Rogue access point vs evil twin rewrite | CONFIRMED (evil twin impersonates an access point; rogue device is an unauthorized node on a network) | CWIFI, NROG |
| 802.1X "passes essentially only authentication frames", supplicant, authenticator, authentication server | NOT RE-READ (quota). Standard IEEE 802.1X behavior, left as review 1 wrote it | none this session |
| TOCTOU contest entry reworded; lock before the check | CONFIRMED (TOCTOU attack on a car gateway, prize included the car; locking must occur before the check) | ZDI23, C367 |
| Malicious update "may have had an affected version installed" | CONFIRMED (March to June 2020, build system compromise, fewer than 18,000 that may have had an installation) | SW8K |
| DOM-based XSS: server response unchanged, payload acts in the browser | CONFIRMED | DOMX |
| Content Security Policy as an added layer in both XSS sections | CONFIRMED (the page says it should not be the primary defense; framework protections, output encoding and HTML sanitization are primary; cookie attributes limit impact only) | XSSP |
| End-of-life labels differ by vendor | CONFIRMED (the vendor defines end of life as a process, end of sale as the date sales stop, and a separate last date of support) | CEOL |
| VM escape: both 2017 contest chains | CONFIRMED (browser heap overflow plus Windows kernel flaw plus hypervisor flaw; and Windows kernel flaw plus two hypervisor flaws) | ZDI17 |
| Cloud: prevalence ranking attributed as "widely reported" | CONFIRMED AS A SOFTENING, still not primary. One detail CORRECTED: r8 said shared tenancy flaws are "rare"; the secondary report read says shared tenancy AND supply chain are the two least prevalent and need the most sophistication. r9 says that | SWK (secondary) |
| Cryptographic: legacy labels, TLS 1.0 and 1.1 deprecated, TLS 1.2 minimum, SHA-1 in the handshake | CONFIRMED | R8996 |
| Side loading: iOS 17.4 or later, EU, notarized apps | CONFIRMED | APEU |
| Jailbreaking: built-in controls bypassed, hardware-backed attestation, patching | CONFIRMED | STA1 |
| Mirai "watch the Telnet ports for takeover attempts" | CONFIRMED (monitor 2323/TCP and 23/TCP) | MIRAI |
| Rule-wording and heading fixes (exam phrasing, seven headings shortened) | CONFIRMED by re-reading; no "exam" wording left, all headings 109 characters or fewer | chapter |

No review-1 fix had to be reverted. Three were corrected in the direction of the primary source (two firmed up, one detail fixed).

## 2. What I changed in r9 (9 edits)

| Section | Before | After | Why, source |
|---|---|---|---|
| Social engineering and its levers | "Summaries of a large 2025 breach study put a human element in roughly 60 percent of breaches." | "A large 2025 breach study found a human element in roughly 60 percent of breaches." | The study states 60 percent itself. DBIR |
| Bluetooth attack surface | "reportedly even when the device was not discoverable" | "and, according to the researchers who found the flaws, even when the device was not set to discoverable" | Primary statement from the discoverer. ARM |
| Default credentials | "watching the Telnet ports (listed in the Reference chapter)" | "watching Telnet traffic on TCP ports 23 and 2323 ... (the Reference chapter lists Telnet's standard port)" | The reference chapter lists only port 23, so the pointer sent the learner to a number that is not there. MIRAI, d0 r9 |
| Cloud-specific vulnerabilities | "The customer's side of the model is where most problems occur." | "Many of the most common problems sit on the customer's side of the model." | "Most" has no primary source (see the card note below) |
| Cloud-specific vulnerabilities | "shared tenancy flaws as rare and demanding high skill" | "shared tenancy and supply chain flaws as the least common, demanding the most attacker skill" | Matches what the readable report of the guidance says. SWK |
| Buffer overflow | "Defenses, in order of strength:" | "Defenses, from removing the root cause to added layers:" | No source ranks them by strength; CWE-120 rates randomization, canaries and execution prevention as defense in depth and safer functions as moderate. C120 |
| Buffer overflow | Scenario glued to the previous paragraph | Blank line added | Formatting |
| Race condition | "The two moments:" above a three-item list | "The two moments and the gap between them:" | Clarity for a beginner |
| Supply chain vulnerabilities | "could respond in days; others searched for weeks" | "could start fixing at once; the rest first had to find it" | The time spans are not in any source read. LOG says only that identification was hard and inventory came first |

Most serious: none changes a number a learner would memorize wrongly. The largest are the two unsupported claims removed
(the "days versus weeks" response times and "most problems" on the customer side) and the port pointer that named a value
the reference chapter does not hold.

## 3. Previously unverified items, now checked

- Human element about 60 percent; credential abuse 22 percent; exploited vulnerabilities 20 percent; third parties 30 percent: VERIFIED from the report itself (DBIR, DBIRX).
- BlueBorne against non-discoverable, unpaired devices: VERIFIED from the discoverer's paper (ARM). It is the researchers' own claim; CERT/CC neither repeats nor disputes it.
- NIST SP 800-53 SC-4: VERIFIED. The control is about preventing unauthorized and unintended information transfer through shared system resources, and the discussion names object reuse and residual information protection. The chapter's sentence is a paraphrase, not a copy.
- CWE-120: VERIFIED (copy without checking size; C and C++; crash or code execution; memory-safe languages, randomized layout, canaries, execution prevention, bounded copy functions).
- CWE-89: VERIFIED (read, modify, delete, bypass login, run system commands; parameterized queries, least privilege, allow-list validation as secondary, minimal error messages, application firewall at moderate effectiveness). Note: CWE-89 treats careful escaping as valid where dynamic queries cannot be avoided, while the OWASP page review 1 read discourages it. The chapter's "discouraged as error-prone" follows OWASP and is acceptable.
- Log4j: VERIFIED (Java logging library, critical remote code execution flaw, disclosed 10 December 2021).
- SBOM: VERIFIED (a nested inventory of the components of software).
- MITRE T1566 (phishing is electronically delivered social engineering; spearphishing is targeted; callback phishing leading to remote management tools), T1091 (autorun, air-gapped networks, tampered media, phones over USB), T1078.001 (Guest, Administrator, cloud root, default service accounts, preset passwords on appliances), T1195 (build environments, update channels, counterfeit and tampered hardware), T1027.003 (payloads in image pixel data; stolen data hidden in images), T1200 (keystroke injection; the group that connected single-board computers and cheap laptops), T1189, T1055.001: all VERIFIED against the chapter's statements.
- Shadow IT: VERIFIED against a government definition (unknown assets used for business purposes, rarely malicious, discovery and broker tools, avoid heavy lockdowns). NCSC.
- Also re-verified: WannaCry (tens of thousands of infections, over 150 countries, patch 14 March 2017, outbreak 12 May 2017); Mirai (62 pairs, above 620 gigabits per second); BEC (55.5 billion dollars exposed loss, October 2013 to December 2023); Kaseya (on-premises product, MSPs and downstream customers, controls listed); Office macro blocking (Windows only, Mark of the Web, stated reason); fixed lifecycle phases; the five insider types; four named states and the revenue remark; firmware attack consequences; zero day definition; WPA3 mandatory for certified devices with protected management frames, Enhanced Open.

## 4. The four cards review 1 flagged (cards not edited)

1. 2.3 Malicious update, "fewer than 18,000 customers installed them": CONFIRMED IMPRECISE. The filing says the company believes the number of customers that may have had an installation of an affected version is fewer than 18,000. It is an upper estimate of possible installs, not a count of installs. Suggested: "fewer than 18,000 customers may have installed them". Source SW8K.
2. 2.3 Cross-site scripting, "fix: output encoding, input validation, Content Security Policy" as equals: CONFIRMED IMPRECISE. OWASP says Content Security Policy is defense in depth and should not be the primary defense. Suggested: "fix: output encoding (main), input validation, Content Security Policy as an extra layer". Source XSSP.
3. 2.3 End-of-life, "EOL = no longer sold": CONFIRMED IMPRECISE as a universal definition. A major vendor defines end of life as the whole retirement process, with end of sale as the date sales stop and a separate last date of support. The card's meaning is a common usage and the chapter keeps it with a caveat. Source CEOL.
4. 2.3 Cloud-specific, "Most cloud breaches come from customer misconfiguration, not the provider": NOT CONFIRMED, and not refuted. No primary source could be read. The one government document that would support a nearby claim (misconfiguration is the most prevalent cloud vulnerability class) is unreadable from here and speaks of vulnerabilities, not of breach counts. Suggested: "Misconfiguration by the customer is the most commonly reported cloud weakness".

One more card observation: 2.2 Bluetooth states that BlueBorne "also reached devices that were not discoverable". That is supported by the discoverer's paper (ARM), so the card is acceptable.

## 5. Agreement with the reference chapter (d0-knowledge.r9.md)

- Telnet TCP 23: agrees. d0 does not list 2323, so r9 now states both ports itself.
- TLS 1.0 and 1.1 deprecated (RFC 8996), TLS 1.2 minimum: agrees.
- MD5 and SHA-1 broken, SSL obsolete: agrees.
- WEP and first-version WPA broken and legacy; WPA3 required for new certified devices with protected management frames; Enhanced Open encrypts open networks: agrees. d0 adds that Enhanced Open does not authenticate the network, which is consistent with this chapter's evil twin section.
- The two notes passed on from the d0 second review (IPsec AH discouraged; Windows logon type 8) do not touch this chapter: it mentions neither.
- Nothing in d0 r9 was found wrong from this chapter's side.

## 6. Learner read of every section

All 64 sections read once more. Each stands alone, expands its acronyms, has a real contrast and a scenario with one
answer. No course, instructor or training company names. No wording implying knowledge of what the real test asks.
Legacy items carry a legacy or broken label. Apart from the edits in part 2, no changes were needed.

## 7. Still unverified

- The NSA cloud guidance prevalence and sophistication ratings: primary document unreadable (403). The chapter attributes the ranking as "widely reported"; the four class names and the ordering rest on one secondary report read this session.
- "Breaches caused by a flaw on the provider's side are reported far less often than customer misconfiguration": no primary source; kept as a soft statement.
- Client-based vs agentless as software delivery terms: no primary definition exists. The chapter keeps the cards' meaning and says the terms are also used for scanners.
- Hacktivist and unskilled attacker definitions: NIST glossary has no entries; these are well established terms and the chapter's definitions are the ordinary ones.
- 802.1X pre-authentication wording, BOD 20-01 legal action wording, SVG smuggling page, bluejacking and bluesnarfing pages, the counterfeit switch report, and the web application firewall as a stopgap: read by review 1, not re-read by me (fetch quota). CWE-89 does list an application firewall at moderate effectiveness, which supports the stopgap wording.
- "Emulated graphics hardware" on the VM escape card: still not on the contest page.
- Overlap with sources was checked by eye only; the build's automated overlap check should be run on r9.
