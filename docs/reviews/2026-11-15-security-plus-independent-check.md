# Security+ SY0-701 cards: independent fact-check (2026-11-15)

This is an independent check of the r3 card pass (`dev/careers/sources/security-plus-sy0-701/cards/*-cards.r3.json`, 830 cards). The checker wrote none of these cards and edited no card file.

## Result

| Sample | Cards | CORRECT | MINOR | WRONG | WRONG rate | 95% upper bound |
|---|---|---|---|---|---|---|
| A: changed between r2 and r3 | 60 | 53 | 6 | 1 | 1.7% | 8.9% (exact binomial, 1 of 60) |
| B: unchanged, fixed rule | 58 | 54 | 4 | 0 | 0% | 5.2% (rule of three, 3/58) |
| Both | 118 | 107 | 10 | 1 | 0.8% | 4.6% (exact binomial, 1 of 118) |

- No sampled sentence was copied from a source: no run of 12 or more identical words on any page the checkers read.
- Every example is an instance of its concept.
- A 12-word n-gram scan against the vendor outline (`outline.md`) matched only one run: d3#58, a plain list of firewall type names (WAF, UTM, NGFW). That is a list of terms, not a copied sentence.

## Method

1. **Changed cards.** Each r3 card was matched to its r2 card by `obj` + `term`. A card counts as changed when its term, definition, example or keyPoints differ. 166 cards changed (d1 22, d2 30, d3 16, d4a 19, d4b 18, d5 61) and none were new. From each file, 10 were taken at evenly spaced positions in the changed list (index `floor(j * n / 10)`), 60 in all.
2. **Unchanged cards.** The six r3 files were joined in the order d1, d2, d3, d4a, d4b, d5, and every 13th card was taken starting at index 5. That gives 64 positions. The 6 already in sample A were dropped, leaving **58** (the rule cannot reach 60 in 830 cards without wrapping, so it was not extended).
3. **Checking.** Four checkers worked in parallel (A first and second halves, B first and second halves). Each verified every claim in the definition, example and keyPoints against pages fetched during the check: NIST SPs and the CSRC glossary, RFCs, vendor docs (Microsoft, Apple, AWS, Cisco, MDN), MITRE, OWASP, FIRST, CISA, ZDI, and Professor Messer's SY0-701 notes for how the exam frames each topic. The one WRONG verdict was confirmed again by the coordinator against the ZDI results pages.
4. **Verdicts.** CORRECT means every claim is true. MINOR means imprecise or misleading wording that is not false. WRONG means the card states something false.

## Fixes needed

1. **WRONG, d2#61 Race conditions.** In keyPoints, "at Pwn2Own 2023 a TOCTOU flaw reachable over Bluetooth gave researchers root on a Tesla Model 3's infotainment system" merges two different entries. On day one, Synacktiv's TOCTOU attack was against the Tesla **Gateway** and won the car. On day two, the infotainment root used a heap overflow and an out-of-bounds write. Fix: "real case: at Pwn2Own Vancouver 2023 Synacktiv used a TOCTOU attack against a Tesla Model 3's Gateway and won the car." Sources: https://www.zerodayinitiative.com/blog/2023/3/22/pwn2own-vancouver-2023-day-one-results and https://www.zerodayinitiative.com/blog/2023/3/23/pwn2own-vancouver-2023-day-two-results
2. **MINOR, d1#89 Key exchange.** "every session uses fresh (ephemeral) keys and has forward secrecy" overstates TLS 1.3. PSK-only resumption (psk_ke) has no forward secrecy. Say "every full handshake uses ephemeral (EC)DHE". Source: RFC 8446 §1.2.
3. **MINOR, d1#93 TPM.** "chip on the motherboard" leaves out firmware TPMs. "BitLocker stores its key in the TPM" should say the TPM **seals** the key and releases it only when the boot measurements match. Source: Microsoft's TPM overview.
4. **MINOR, d2#89 Ransomware.** Europol's figure was 200,000+ **victims** in 150+ countries, not "computers". Source: Europol statements as reported (phys.org, Global News; secondary).
5. **MINOR, d3#97 Hashing.** "collisions mean weak algorithms". Every hash has collisions in theory. A hash is weak when collisions can be **found** in practice (MD5, SHA-1). Source: NIST CSRC glossary, "hash function".
6. **MINOR, d3#123 Backups.** "frequency sets RPO" is backwards. RPO is the business requirement, and backup frequency is chosen to meet it.
7. **MINOR, d4a#28 Cellular.** "Traffic is encrypted between the phone and the tower" is stated as always true. In LTE, air-interface confidentiality is an operator option, so say "usually encrypted". Source: NIST SP 800-187.
8. **MINOR, d4a#38 Secure cookies.** "browsers use [Lax] when no value is set" applies only to Chromium-based browsers. Source: MDN, Set-Cookie.
9. **MINOR, d4a#54 Certification (media disposal).** SP 800-88 Rev. 1 §4.8 calls the record a "certificate of media disposition". "Certificate of Sanitization" is the title of the sample form in Appendix G. Rev. 2 (Sept 2025) was not read for this card, so check its wording before editing.
10. **MINOR, d4a#77 CVSS.** The 9.8 example score needs its version: "CVSS v3.1 base score of 9.8". The card also teaches v4.0, which scores the same vector differently.
11. **MINOR, d4b#41 Ephemeral credentials.** "AWS STS ... 15 minutes up to 12 hours" is AssumeRole only. GetSessionToken lasts up to 36 hours. Source: AWS STS API reference.

## Fixes applied (2026-11-15, at the coordinator's request)

**Fix 9 changed after reading SP 800-88 Rev. 2.** Rev. 2 (September 2025, section 4.6) itself calls the record a "certificate of sanitization": complete one for each sanitized device, keep it on paper or electronically. Its field list matches the card. The card was therefore right under the current revision. It now names Rev. 2 and section 4.6 so the wording traces to that revision. Source: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-88r2.pdf

**Applied in the r3 cards:**
- d2#61: the Pwn2Own case is now the Gateway TOCTOU win.
- d2#89: WannaCry hit more than 200,000 victims; the ransom doubled after three days.
- d3#97: every hash has collisions in theory; MD5 and SHA-1 are weak because collisions can be found in practice.
- d3#123: the RPO sets how often backups must run.
- d4a#28: cellular traffic is usually encrypted, and in 4G the carrier can turn this off.
- d4a#54: names Rev. 2, section 4.6, one certificate per sanitized device.
- d4a#77: the example is a v3.1 base score.
- d4b#41: AssumeRole lasts 15 minutes to 12 hours; GetSessionToken lasts up to 36 hours.
- d1#93: the definition now mentions a firmware TPM.

**Applied in the r3 knowledge chapters:**
- d2: the WannaCry example.
- d3: the backup frequency line now says frequency is chosen to meet the RPO.
- d4a: the Certification row names the Rev. 2 certificate.
- d4b: the STS durations.

**NOT applied** (the permission system refused these edits, and I did not work around it):
- d1#89 card keyPoints: "every full handshake" plus the PSK-only resumption caveat.
- d1#93 card example: "BitLocker seals its key to the TPM, which releases it only when the boot measurements match".
- d4a#38 card keyPoints: Lax is the default only in Chromium-based browsers (Chrome, Edge).
- d2 knowledge: the Pwn2Own exam tip still says "Bluetooth ... infotainment". This is the WRONG fact, so it matters most.
- d3 knowledge, "Key distinctions" line: still "MD5 and SHA-1 are weak because of collisions".
- Not attempted after the refusals: the d1 knowledge lines on TLS 1.3 forward secrecy and the TPM ("chip on one device's motherboard ... holds full-disk encryption keys"), and the d4a knowledge Secure cookies line ("Lax, which browsers use when no value is set").

**Checks:**
- All six r3 card files parse as JSON.
- No em or en dashes are in them.
- obj, path and card order are unchanged.
- `npx vitest run dev/careers/verbatim.test.js` passes (5 tests).
- `public/careers/security-plus-sy0-701.json` was not rebuilt, so it still has the old text.

## Per-card verdicts

Unless a row says otherwise, "Messer" means the matching Professor Messer SY0-701 page, https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/<topic>-sy0-701/.

### Sample A (changed, 60)

| Card | Term | Verdict | Claim at issue | Source |
|---|---|---|---|---|
| d1#21 | Gap analysis | CORRECT | | Messer gap-analysis |
| d1#28 | Policy Engine (Zero Trust) | CORRECT | | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-207.pdf |
| d1#31 | Subject/System (Zero Trust) | CORRECT | | NIST SP 800-207 |
| d1#44 | Microwave sensor | CORRECT | | Messer physical-security; https://www.sdmmag.com/articles/84870-back-to-basics-on-detector-technology |
| d1#63 | Restricted activities | CORRECT | | Messer technical-change-management |
| d1#89 | Key exchange | MINOR | TLS 1.3 forward secrecy for "every session" (PSK-only lacks it) | https://www.rfc-editor.org/rfc/rfc8446.html |
| d1#93 | TPM | MINOR | omits firmware TPM; "stores" vs seals the BitLocker key | https://learn.microsoft.com/en-us/windows/security/hardware-security/tpm/trusted-platform-module-overview |
| d1#101 | Hashing (cryptography) | CORRECT | | https://csrc.nist.gov/glossary/term/hash_function; OWASP Password Storage |
| d1#104 | Key stretching | CORRECT | | https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html |
| d1#109 | CRL | CORRECT | | https://cabforum.org/2023/07/14/ballot-sc063v4-make-ocsp-optional-require-crls-and-incentivize-automation/ |
| d2#3 | Nation-state | CORRECT | | https://www.cisa.gov/news-events/cybersecurity-advisories/aa20-106a |
| d2#39 | Bluetooth | CORRECT | | BlueBorne coverage (circleid, mobilesyrup; Armis page refused, secondary) |
| d2#50 | Misinformation/disinformation | CORRECT | | https://cisa.gov/mdm (via search); DHS OIG-22-58 |
| d2#61 | Race conditions | **WRONG** | Pwn2Own 2023 TOCTOU was against the Gateway, not infotainment over Bluetooth | ZDI day one and day two results |
| d2#79 | Hardware provider | CORRECT | | theregister.com 2020/07/15 (secondary; the F-Secure report itself was not read) |
| d2#89 | Ransomware | MINOR | "200,000 computers" should be victims | phys.org / Global News (secondary) |
| d2#100 | RFID cloning | CORRECT | | Messer physical-attacks |
| d2#116 | Forgery | CORRECT | | OWASP SSRF Prevention Cheat Sheet |
| d2#120 | Collision | CORRECT | | https://shattered.io/; https://marc-stevens.nl/research/hashclash/rogue-ca/ |
| d2#136 | Segmentation | CORRECT | | Messer segmentation-and-access-control |
| d3#3 | Cloud | CORRECT | | CSA Top Threats 2024 blog |
| d3#12 | Air-gapped network | CORRECT | | Kaspersky "What is Stuxnet" (hedged claim) |
| d3#19 | IoT | CORRECT | | https://www.cisa.gov/news-events/alerts/2016/10/14/heightened-ddos-threat-posed-mirai-and-other-botnets |
| d3#20 | ICS/SCADA | CORRECT | | https://csrc.nist.gov/pubs/sp/800/82/r3/final |
| d3#57 | EAP | CORRECT | | https://www.rfc-editor.org/rfc/rfc4851.html; Messer wireless-security-settings |
| d3#61 | NGFW | CORRECT | | Messer firewall-types |
| d3#67 | TLS tunnel/VPN | CORRECT | | RFC 7568, RFC 8996 |
| d3#70 | SASE | CORRECT | | Cisco "What is SASE" |
| d3#80 | Data classifications | CORRECT | | Messer data-types-and-classifications; EO 13526 |
| d3#121 | Simulation (recovery testing) | CORRECT | | Messer recovery-testing |
| d4a#32 | WPA3 | CORRECT | | Meraki WPA3 guide; https://www.wi-fi.org/discover-wi-fi/security |
| d4a#33 | AAA/RADIUS | CORRECT | | RFC 2865, 2866, 8907 |
| d4a#35 | Authentication protocols | CORRECT | | RFC 4851; Messer wireless-security-settings |
| d4a#38 | Secure cookies | MINOR | Lax default only in Chromium-based browsers | https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie |
| d4a#53 | Destruction (media disposal) | CORRECT | | https://csrc.nist.gov/pubs/sp/800/88/r2/final |
| d4a#77 | CVSS | MINOR | 9.8 example lacks "v3.1" | https://www.first.org/cvss/v4.0/specification-document |
| d4a#89 | Exceptions and exemptions | CORRECT | | NIST SP 800-40 Rev. 4 |
| d4a#121 | Rules (firewall) | CORRECT | | NIST SP 800-41 Rev. 1 |
| d4a#142 | DNS filtering | CORRECT | | Infoblox; Dark Reading on the NSA advisory (secondary; the NSA PDF returned 403) |
| d4a#146 | SPF | CORRECT | | https://www.rfc-editor.org/rfc/rfc7208.html |
| d4b#6 | LDAP | CORRECT | | RFC 4511; Messer identity-and-access-management |
| d4b#8 | SAML | CORRECT | | OASIS SAML 2.0 core (the outline's "Assertions" spelling was not confirmed) |
| d4b#30 | Password best practices | CORRECT | | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-63B-4.pdf |
| d4b#32 | Complexity | CORRECT | | NIST SP 800-63B-4 |
| d4b#36 | Password managers | CORRECT | | NIST SP 800-63B-4; Messer password-security |
| d4b#39 | JIT permissions | CORRECT | | Microsoft Entra PIM docs |
| d4b#41 | Ephemeral credentials | MINOR | 15 min to 12 h is AssumeRole only | AWS STS AssumeRole / GetSessionToken API reference |
| d4b#68 | Incident response process | CORRECT | | NIST SP 800-61 r2 and r3; Messer incident-response |
| d4b#75 | Lessons learned | CORRECT | | NIST SP 800-61 r2 |
| d4b#83 | Legal hold | CORRECT | | Messer digital-forensics |
| d5#3 | Policies | CORRECT | | Messer security-policies |
| d5#14 | Physical security standard | CORRECT | | Messer security-standards |
| d5#22 | Legal (external consideration) | CORRECT | | study-notes mirror (the Messer page returned 404; weaker source) |
| d5#31 | Government entities | CORRECT | | study-notes mirror (weaker source) |
| d5#42 | Recurring risk assessment | CORRECT | | Messer risk-management |
| d5#79 | Penetration testing (vendor) | CORRECT | | Messer third-party-risk-assessment |
| d5#93 | NDA | CORRECT | | NDA-type articles (secondary) |
| d5#116 | National privacy law | CORRECT | | CMS HIPAA covered entities; OPC PIPEDA brief |
| d5#147 | Phishing campaigns | CORRECT | | Messer security-awareness |
| d5#157 | Insider threat training | CORRECT | | Messer security-awareness ("multiple approvals" and "file monitoring" are standard practice, not on that page) |

### Sample B (unchanged, 58)

| Card | Term | Verdict | Claim at issue | Source |
|---|---|---|---|---|
| d1#5 | Operational control | CORRECT | | Messer security-controls |
| d1#18 | Authenticating people (AAA) | CORRECT | | Messer authentication-authorization-and-accounting |
| d1#57 | Test results | CORRECT | | Messer change-management |
| d1#70 | Updating diagrams | CORRECT | | Messer technical-change-management |
| d1#83 | Volume encryption | CORRECT | | Messer encrypting-data; Microsoft BitLocker |
| d1#96 | Secure enclave | CORRECT | | https://support.apple.com/guide/security/secure-enclave-sec59b0b31ff/web |
| d2#6 | Insider threat | CORRECT | | CISA defining insider threats |
| d2#19 | Philosophical/political beliefs | CORRECT | | Messer threat-actors |
| d2#32 | Removable device | CORRECT | | Messer common-threat-vectors; CISA ICSA-10-201-01C |
| d2#45 | Suppliers | CORRECT | | Messer supply-chain-vulnerabilities |
| d2#58 | Application vulnerabilities | CORRECT | | Messer application-attacks (memory injection and malicious updates checked against the objective list only) |
| d2#71 | End-of-life | CORRECT | | Messer hardware-vulnerabilities |
| d2#84 | Side loading | CORRECT | | Messer mobile-device-vulnerabilities; Apple DMA page |
| d2#97 | Rootkit | CORRECT | | https://csrc.nist.gov/glossary/term/rootkit |
| d2#110 | Malicious code | CORRECT | | Messer malicious-code |
| d2#123 | Password spraying | CORRECT | | https://attack.mitre.org/techniques/T1110/003/ |
| d2#149 | Encryption (hardening) | CORRECT | | Messer hardening-techniques |
| d3#6 | Third-party vendors (cloud) | CORRECT | | Messer infrastructure-considerations |
| d3#32 | Ease of recovery | CORRECT | | Messer infrastructure-considerations |
| d3#45 | Fail-closed | CORRECT | | Messer intrusion-prevention |
| d3#58 | Firewall types | CORRECT | | Messer firewall-types |
| d3#71 | Selection of effective controls | CORRECT | | Messer infrastructure-considerations |
| d3#84 | Restricted (classification) | CORRECT | | Messer data-types-and-classifications |
| d3#97 | Hashing (secure data) | MINOR | "collisions mean weak algorithms" (should be practically findable collisions) | https://csrc.nist.gov/glossary/term/hash_function |
| d3#110 | Geographic dispersion | CORRECT | | Messer resiliency |
| d3#123 | Backups | MINOR | "frequency sets RPO" is backwards | Messer backups |
| d4a#2 | Secure baselines | CORRECT | | Messer secure-baselines (CIS Benchmarks mention is common practice, not on that page) |
| d4a#15 | RTOS | CORRECT | | Messer hardening-targets |
| d4a#28 | Cellular | MINOR | air-interface encryption is the operator's option | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-187.pdf |
| d4a#41 | Sandboxing | CORRECT | | https://csrc.nist.gov/glossary/term/sandbox |
| d4a#54 | Certification (media disposal) | MINOR | SP 800-88 Rev. 1 term is "certificate of media disposition" | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-88r1.pdf |
| d4a#67 | Dark web | CORRECT | | Messer threat-intelligence |
| d4a#80 | Exposure factor | CORRECT | | Messer risk-analysis |
| d4a#93 | Verification | CORRECT | | Messer vulnerability-remediation |
| d4a#106 | Alert response | CORRECT | | Messer security-monitoring |
| d4a#119 | Objective 4.5 | CORRECT | | Messer email-security, web-filtering |
| d4a#132 | Content categorization | CORRECT | | Messer web-filtering |
| d4a#145 | DKIM | CORRECT | | https://www.rfc-editor.org/rfc/rfc6376 |
| d4b#5 | SSO | CORRECT | | Messer identity-and-access-management (Kerberos as SSO from general knowledge) |
| d4b#18 | Least privilege | CORRECT | | https://csrc.nist.gov/glossary/term/least_privilege |
| d4b#31 | Length | CORRECT | | https://pages.nist.gov/800-63-4/sp800-63b.html |
| d4b#44 | User provisioning | CORRECT | | Messer scripting-and-automation |
| d4b#57 | Scaling securely | CORRECT | | Messer scripting-and-automation |
| d4b#70 | Detection | CORRECT | | Messer incident-response |
| d4b#96 | Network logs | CORRECT | | Messer log-data (DNS, DHCP and NetFlow details from general knowledge) |
| d5#6 | Business continuity | CORRECT | | Messer security-policies |
| d5#19 | Playbooks | CORRECT | | study-notes mirror (weaker source) |
| d5#32 | Centralized vs decentralized | CORRECT | | study-notes mirror (weaker source) |
| d5#45 | Risk analysis | CORRECT | | Messer risk-analysis |
| d5#58 | Risk threshold | CORRECT | | Messer risk-analysis |
| d5#71 | Risk reporting | CORRECT | | Messer risk-management-strategies |
| d5#84 | Vendor selection | CORRECT | | Messer third-party-risk-assessment |
| d5#97 | Rules of engagement | CORRECT | | Messer third-party-risk-assessment |
| d5#110 | Attestation and acknowledgement | CORRECT | | Messer compliance |
| d5#123 | Objective 5.5 | CORRECT | | Messer penetration-tests |
| d5#136 | Offensive (red team) | CORRECT | | Messer penetration-tests |
| d5#149 | Responding to reported messages | CORRECT | | Messer security-awareness |
| d5#162 | Hybrid/remote work | CORRECT | | Messer user-training |

## Limits

- Sample B has 58 cards, not 60, because of the fixed rule (see Method).
- Some verdicts rest on secondary sources because the primary page was refused or missing: BlueBorne (Armis), counterfeit Cisco (F-Secure), the NSA DNS advisory, WannaCry figures, and five governance cards backed by a study-notes mirror after Messer pages returned 404. The verdicts are probably right, but these sources are weaker.
- d4a#54 was checked against SP 800-88 Rev. 1. Rev. 2 (Sept 2025) replaces it and was not read for that card.
- The exact intervals are approximate to 0.1 percentage point.
