# d2a knowledge chapter r7: source notes

Chapter: `knowledge/d2a-knowledge.r7.md` (objectives 2.1 to 2.3). Written 2026-11-15 from `knowledge/d2-knowledge.r4.md`
(2.1 to 2.3 parts), `cards/d2-cards.r4.json` and `cards/d2-extras.r5.json` (drive-by download). Every page below was
fetched and read in this writing session; facts are paraphrased, none quoted.

## Sources

| Key | Title | URL |
|---|---|---|
| N-TA | NIST glossary: threat actor | https://csrc.nist.gov/glossary/term/threat_actor |
| N-APT | NIST glossary: advanced persistent threat | https://csrc.nist.gov/glossary/term/advanced_persistent_threat |
| N-ZD | NIST glossary: zero day attack | https://csrc.nist.gov/glossary/term/zero_day_attack |
| N-AS | NIST glossary: attack surface | https://csrc.nist.gov/glossary/term/attack_surface |
| N-JB | NIST glossary: jailbreak (AI meaning only) | https://csrc.nist.gov/glossary/term/jailbreak |
| N-BJ | NIST Mobile Threat Catalogue LPN-14 (bluejacking) | https://pages.nist.gov/mobile-threat-catalogue/lan-pan-threats/LPN-14.html |
| N-BS | NIST Mobile Threat Catalogue LPN-9 (bluesnarfing) | https://pages.nist.gov/mobile-threat-catalogue/lan-pan-threats/LPN-9.html |
| N-MTC | NIST Mobile Threat Catalogue APP-25, STA-1, STA-0, EMM-5, STA-15 (search excerpts only, pages not opened) | https://pages.nist.gov/mobile-threat-catalogue/application-threats/APP-25.html |
| N-121 | NIST SP 800-121 Rev. 2 abstract (Bluetooth) | https://csrc.nist.gov/pubs/sp/800/121/r2/upd1/final |
| N-193 | NIST SP 800-193 abstract (platform firmware resiliency) | https://csrc.nist.gov/pubs/sp/800/193/final |
| N-SC4 | NIST SP 800-53 Rev. 5 SC-4 (information in shared system resources) | https://csf.tools/reference/nist-sp-800-53/r5/sc/sc-4/ |
| N-125 | NIST SP 800-125 / 800-125A (search excerpts: guest isolation, escape via configuration error) | https://nvlpubs.nist.gov/nistpubs/legacy/sp/nistspecialpublication800-125.pdf |
| N-154 | Draft NIST SP 800-154 (attack vector, search excerpt) | https://csrc.nist.gov/csrc/media/publications/sp/800-154/draft/documents/sp800_154_draft.pdf |
| C-NS | CISA: nation-state cyber actors | https://www.cisa.gov/topics/cyber-threats-and-advisories/nation-state-cyber-actors |
| C-INS | CISA: defining insider threats | https://www.cisa.gov/topics/physical-security/insider-threat-mitigation/defining-insider-threats |
| C-RW | CISA: ransomware 101 | https://www.cisa.gov/stopransomware/ransomware-101 |
| C-VDP | CISA BOD 20-01 (vulnerability disclosure policy) | https://www.cisa.gov/news-events/directives/bod-20-01-develop-and-publish-vulnerability-disclosure-policy |
| C-SE | CISA: avoiding social engineering and phishing attacks | https://www.cisa.gov/news-events/news/avoiding-social-engineering-and-phishing-attacks |
| C-MDM | CISA mis-, dis- and malinformation definitions (infographic set and advisory committee report, via search) | https://www.cisa.gov/sites/default/files/publications/disinformation_stops_with_you_infographic_set_508.pdf |
| C-KAS | CISA: Kaseya ransomware attack guidance for MSPs and customers | https://www.cisa.gov/news-events/news/kaseya-ransomware-attack-guidance-affected-msps-and-their-customers |
| C-MIR | CISA alert: heightened DDoS threat posed by Mirai | https://www.cisa.gov/news-events/alerts/2016/10/14/heightened-ddos-threat-posed-mirai-and-other-botnets |
| C-L4J | CISA: Apache Log4j vulnerability guidance | https://www.cisa.gov/news-events/news/apache-log4j-vulnerability-guidance |
| C-WC | CISA alert: indicators associated with WannaCry | https://www.cisa.gov/news-events/alerts/2017/05/12/indicators-associated-wannacry-ransomware |
| C-BAD | CISA: product security bad practices | https://www.cisa.gov/resources-tools/resources/product-security-bad-practices |
| C-SBOM | CISA: software bill of materials | https://www.cisa.gov/sbom |
| F-BEC | FBI IC3 PSA: business email compromise, the 55 billion dollar scam | https://www.ic3.gov/PSA/2024/PSA240911 |
| M-1566 | MITRE ATT&CK T1566 Phishing | https://attack.mitre.org/techniques/T1566/ |
| M-1566.3 | MITRE ATT&CK T1566.003 Spearphishing via Service | https://attack.mitre.org/techniques/T1566/003/ |
| M-1566.4 | MITRE ATT&CK T1566.004 Spearphishing Voice | https://attack.mitre.org/techniques/T1566/004/ |
| M-1189 | MITRE ATT&CK T1189 Drive-by Compromise | https://attack.mitre.org/techniques/T1189/ |
| M-1091 | MITRE ATT&CK T1091 Replication Through Removable Media | https://attack.mitre.org/techniques/T1091/ |
| M-1200 | MITRE ATT&CK T1200 Hardware Additions | https://attack.mitre.org/techniques/T1200/ |
| M-1078 | MITRE ATT&CK T1078.001 Default Accounts | https://attack.mitre.org/techniques/T1078/001/ |
| M-1195 | MITRE ATT&CK T1195 Supply Chain Compromise | https://attack.mitre.org/techniques/T1195/ |
| M-SVG | MITRE ATT&CK T1027.017 SVG Smuggling | https://attack.mitre.org/techniques/T1027/017/ |
| M-STEG | MITRE ATT&CK T1027.003 Steganography | https://attack.mitre.org/techniques/T1027/003/ |
| M-DOM | MITRE ATT&CK T1583.001 Acquire Infrastructure: Domains | https://attack.mitre.org/techniques/T1583/001/ |
| M-1204 | MITRE ATT&CK T1204.002 User Execution: Malicious File | https://attack.mitre.org/techniques/T1204/002/ |
| M-1055 | MITRE ATT&CK T1055 Process Injection | https://attack.mitre.org/techniques/T1055/ |
| M-DLL | MITRE ATT&CK T1055.001 DLL Injection | https://attack.mitre.org/techniques/T1055/001/ |
| W-367 | CWE-367 TOCTOU race condition | https://cwe.mitre.org/data/definitions/367.html |
| W-362 | CWE-362 race condition | https://cwe.mitre.org/data/definitions/362.html |
| W-120 | CWE-120 classic buffer overflow | https://cwe.mitre.org/data/definitions/120.html |
| W-89 | CWE-89 SQL injection | https://cwe.mitre.org/data/definitions/89.html |
| O-SQL | OWASP SQL Injection Prevention Cheat Sheet | https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html |
| O-XSS | OWASP community: cross-site scripting | https://community.owasp.org/attacks/xss |
| O-XSSP | OWASP XSS Prevention Cheat Sheet | https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html |
| O-CSRF | OWASP community: CSRF | https://community.owasp.org/attacks/csrf |
| O-A02 | OWASP Top 10 2021 A02 Cryptographic Failures | https://top10.owasp.org/2021/A02_2021-Cryptographic_Failures/index.html |
| O-A05 | OWASP Top 10 2021 A05 Security Misconfiguration | https://top10.owasp.org/2021/A05_2021-Security_Misconfiguration/index.html |
| R-8996 | RFC 8996: deprecating TLS 1.0 and TLS 1.1 | https://www.rfc-editor.org/rfc/rfc8996.html |
| MS-LC | Microsoft Learn: Fixed Lifecycle Policy | https://learn.microsoft.com/en-us/lifecycle/policies/fixed |
| MS-MAC | Microsoft Learn: macros from the internet are blocked by default in Office | https://learn.microsoft.com/en-us/microsoft-365-apps/security/internet-macros-blocked |
| A-EU | Apple developer support: alternative app marketplaces in the EU | https://developer.apple.com/support/alternative-app-marketplace-in-the-eu/ |
| WF | Wi-Fi Alliance: security | https://www.wi-fi.org/discover-wi-fi/security |
| SEC-SW | SolarWinds Form 8-K, 14 December 2020 | https://www.sec.gov/Archives/edgar/data/1739942/000162828020017451/swi-20201214.htm |
| Z-17 | Zero Day Initiative: Pwn2Own 2017 day three results | https://www.zerodayinitiative.com/blog/2017/3/17/the-results-pwn2own-2017-day-three |
| Z-23 | Zero Day Initiative: Pwn2Own Vancouver 2023 day one results (search excerpt, plus VicOne write-up) | https://www.zerodayinitiative.com/blog/2023/3/22/pwn2own-vancouver-2023-day-one-results |
| H-DBIR | Help Net Security summary of the Verizon 2025 DBIR (secondary) | https://www.helpnetsecurity.com/2025/04/23/verizon-2025-data-breach-investigations-report-dbir/ |
| H-CSC | Help Net Security: counterfeit Cisco switches (F-Secure report, secondary) | https://www.helpnetsecurity.com/2020/07/15/counterfeit-cisco-switches/ |
| MB-BB | Malwarebytes: BlueBorne (secondary) | https://www.malwarebytes.com/blog/news/2017/09/blueborne-bluetooths-airborne-influenza |
| I-SIT | IBM: what is shadow IT (secondary; no NIST or CISA definition found) | https://www.ibm.com/think/topics/shadow-it |
| P-HACK | Palo Alto Networks Cyberpedia: hacktivism (secondary; no NIST or CISA definition found) | https://www.paloaltonetworks.com/cyberpedia/hacktivism |
| S-NSA | NSA "Mitigating Cloud Vulnerabilities" (2020), read through search summaries of press coverage only | https://www.securityweek.com/nsa-shares-guidance-mitigating-cloud-vulnerabilities |
| S-SK | Script kiddie definitions (Kaspersky, TechTarget glossaries, search summaries) | https://encyclopedia.kaspersky.com/glossary/script-kiddie/ |
| S-1X | IEEE 802.1X roles and unauthorized port state (search summaries of secondary pages; the standard itself not read) | https://en.wikipedia.org/wiki/IEEE_802.1X |
| CARDS | Reviewed course cards d2-cards.r4.json, d2-extras.r5.json | (local) |

## Sources per section

2.1
- Threat actor (threat source, adversary): N-TA, N-APT, CARDS
- Nation-state actor and advanced persistent threat (APT): N-APT, C-NS, CARDS
- Unskilled attacker (script kiddie): S-SK, CARDS
- Hacktivist (hacktivism): P-HACK, CARDS
- Insider threat: C-INS, CARDS
- Organized crime: C-RW, F-BEC, CARDS
- Shadow IT: I-SIT, CARDS
- Threat actor attributes: CARDS, N-APT
- Comparing threat actors: the sections above
- Financial gain and blackmail: C-RW, CARDS
- Data exfiltration and espionage: C-INS, C-NS, M-STEG, CARDS
- Service disruption, disruption and chaos, and war: CARDS, C-NS
- Philosophical or political beliefs, revenge and ethical hacking: C-VDP, P-HACK, C-INS, CARDS
- Comparing motivations: the sections above

2.2
- Threat vector vs attack surface: N-AS, N-154, O-A05, CARDS
- Email as a threat vector: M-1566, C-SE, H-DBIR, CARDS
- SMS and IM as threat vectors: C-SE, M-1566.3, CARDS
- Image-based threat vector: M-SVG, M-STEG, CARDS
- File-based threat vector: M-1204, MS-MAC, CARDS
- Voice call threat vector: M-1566.4, C-SE, CARDS
- Removable device threat vector: M-1091, M-1200, CARDS
- Vulnerable software, client-based vs agentless: CARDS (no primary source defines this pair; kept to the cards' meaning), M-1189
- Drive-by download: M-1189, CARDS (extras)
- Unsupported systems and applications: MS-LC, C-BAD, CARDS
- Unsecure wireless networks: WF, CARDS (evil twin and rogue access point definitions from the reviewed extras card)
- Unsecure wired networks: M-1200, S-1X, CARDS
- Bluetooth attack surface: N-121, N-BJ, N-BS, MB-BB, CARDS
- Open service ports: O-A05, C-MIR, CARDS
- Default credentials: M-1078, C-MIR, C-BAD, CARDS
- Supply chain as a threat vector: M-1195, C-KAS, H-DBIR, CARDS
- Social engineering and the levers it pulls: C-SE, H-DBIR, CARDS
- Phishing, spear phishing and whaling: M-1566, C-SE, CARDS
- Vishing: C-SE, M-1566.4, CARDS
- Smishing: C-SE, CARDS
- Misinformation and disinformation: C-MDM, CARDS
- Impersonation and pretexting: C-SE, M-1566.4, CARDS
- Business email compromise: F-BEC, CARDS
- Watering hole attack: M-1189, CARDS
- Brand impersonation: M-DOM, C-SE, CARDS
- Typosquatting: M-DOM, CARDS
- The three 2.2 comparison sections: the sections above

2.3
- Memory injection: M-1055, M-DLL, CARDS
- Buffer overflow vulnerability: W-120, C-BAD, CARDS
- Race condition vulnerability (TOCTOU): W-367, W-362, Z-23, CARDS
- Malicious update: SEC-SW, M-1195, CARDS
- Operating system (OS)-based vulnerabilities: C-WC, MS-LC, N-MTC, CARDS
- SQL injection vulnerability: O-SQL, W-89, C-BAD, CARDS
- Cross-site scripting (XSS) vulnerability: O-XSS, O-XSSP, O-CSRF, CARDS
- Firmware vulnerabilities: N-193, M-1195, CARDS
- End-of-life (EOL) and legacy hardware: MS-LC, C-BAD, CARDS
- Virtual machine (VM) escape: N-125, Z-17, CARDS
- Resource reuse vulnerability: N-SC4, CARDS
- Cloud-specific vulnerabilities: S-NSA, O-A05, CARDS
- Supply chain vulnerabilities: H-CSC, C-L4J, C-SBOM, M-1195, CARDS
- Cryptographic vulnerabilities: O-A02, R-8996, CARDS
- Misconfiguration vulnerabilities: O-A05, CARDS
- Side loading on mobile devices: N-MTC, A-EU, CARDS
- Jailbreaking and rooting: N-MTC, N-JB, CARDS
- Zero-day vulnerability: N-ZD, Z-17, Z-23, CARDS
- The three 2.3 comparison sections: the sections above

## Weaker traces (for the reviewers to recheck first)
- Cloud: the "most common cloud vulnerability is misconfiguration; other classes are poor access control, shared tenancy,
  supply chain" statement rests on press summaries of the NSA document, not the document itself.
- 802.1X behavior (port blocks all but authentication traffic until the device is verified by a central server): secondary
  pages only.
- Jailbreaking steps ("unlocks the bootloader", "verified boot may stop working as designed") and MDM detection limits:
  NIST Mobile Threat Catalogue search excerpts only; the pages were not opened.
- DOM-based XSS mechanics: the OWASP page read names the type but does not explain it; the one-line explanation is
  standard but untraced this session.
- Evil twin and rogue access point definitions, WEP "broken", "EOL = no longer sold, EOSL = support ended", and the
  client-based vs agentless meaning: taken from the reviewed cards, no external page read this session.
- Shadow IT, hacktivist and script kiddie definitions: vendor pages (no NIST or CISA definition exists).
- Buffer overflow worked example (0x41414141 = "AAAA"): ASCII arithmetic, no page read.
- 2025 breach study figures (phishing about 15%, third parties about 30%, human element about 60%): secondary news
  summary of the report, not the report.

## Cards compared with what was read (none judged wrong; notes only)
- "Default credentials" card: says Mirai tried its 62 pairs "mostly over Telnet on TCP 23 and 2323". The CISA alert read
  gives the 62 pairs and advises monitoring 23/TCP and 2323/TCP but does not itself say Telnet was the infection
  method. The chapter states only what the alert says and leaves the port numbers to the Reference chapter.
- "Malicious update" card: "fewer than 18,000 customers installed them". The filing's wording is that fewer than 18,000
  "may have" installed the affected products; the chapter uses the cautious form. Not a contradiction.
- "VM escape" card: says the 2017 team chained "a browser bug and a Windows kernel bug" before the hypervisor flaw. The
  contest page read for day three lists a Windows kernel use-after-free plus two hypervisor bugs (an information leak
  and an uninitialized buffer) for the win it describes, with no browser bug; a different team's entry that week did
  start from a browser. The chapter follows the page read (one kernel flaw in the guest plus two hypervisor flaws).
  Worth a reviewer check of which entry the card means.
- "Bluetooth" card: says BlueBorne is fixed by patching; the secondary page read recommends turning Bluetooth off and
  does not mention patches. The chapter keeps both, patching per the card.
- "Cross-site scripting" card lists Content Security Policy as a fix; OWASP's cheat sheet calls it an extra layer, not
  the primary defense. The chapter says so; the card is not wrong, only less precise.
