# Security+ SY0-701 extra cards: independent review (2026-11-15)

What this is: a second, independent check of the 23 extra cards in
`dev/careers/sources/security-plus-sy0-701/cards/*-extras.r1.json`. The reviewed set is in the `*-extras.r2.json` files.
The r1 files were not changed. Related: [career-mode-guide](../career-mode-guide.md).

How: each claim was checked against primary sources read during this review: RFCs 2104, 5280, 7643, 7858 and 8446,
OpenID Connect Core, NIST SP 800-34r1, 800-38A, 800-38D and 800-115, the NIST glossary, NIST SP 800-53 SI-13, MITRE
ATT&CK, CISA, Microsoft Learn, Cisco, the Wi-Fi Alliance, Tenable, GDPR Articles 37 and 38, and the Journal of
Accountancy. Each card was also checked for: an example that really shows the concept, the right objective and
category, CompTIA's own acronym expansion, no copied runs of 12+ words, no dashes and no HTML.

## Totals
- 23 cards: **11 CORRECT**, **12 MINOR**, **0 WRONG**.
- Same count, objectives and order. `build-career.mjs` prints `no problems` and uses the r2 files. The vitest run
  (`dev/careers` and `career.test.js`) passes: 30 tests.

## Per card

| # | File | Card | Verdict |
|---|---|---|---|
| 1 | d1 | HMAC | MINOR |
| 2 | d1 | Perfect forward secrecy | MINOR |
| 3 | d1 | SAN certificate | CORRECT |
| 4 | d1 | Registration authority | CORRECT |
| 5 | d1 | Initialization vector | MINOR |
| 6 | d2 | Drive-by download | MINOR |
| 7 | d2 | Botnet and C2 | CORRECT |
| 8 | d2 | Session hijacking | CORRECT |
| 9 | d2 | Evil twin and rogue AP | MINOR |
| 10 | d2 | Fileless malware | CORRECT |
| 11 | d3 | Full, incremental, differential backups | CORRECT |
| 12 | d3 | Fault tolerance vs high availability | CORRECT |
| 13 | d4a | Protected management frames | MINOR |
| 14 | d4a | Cryptographic erase | CORRECT (source added) |
| 15 | d4a | Credentialed vs non-credentialed scan | MINOR |
| 16 | d4a | Encrypted DNS (DoH, DoT) | CORRECT |
| 17 | d4b | OpenID Connect | MINOR |
| 18 | d4b | SCIM | MINOR (category only) |
| 19 | d4b | SOAR | CORRECT |
| 20 | d5 | Inherent vs residual risk | CORRECT |
| 21 | d5 | MTTF | MINOR |
| 22 | d5 | Data protection officer | MINOR |
| 23 | d5 | SOC reports | MINOR |

## Changes (before, after, source)

1. **HMAC**: keyPoint added (nothing removed).
   - Before: no mention of CompTIA's name for it.
   - After: "CompTIA's acronym list expands HMAC as hashed message authentication code; same thing".
   - Why: the course guide asks for both names when the vendor's differs from the standard one. The standard name is
     from https://www.rfc-editor.org/rfc/rfc2104; the CompTIA expansion is from the local acronym list.

2. **Perfect forward secrecy**
   - Category before: "1.4 Cryptographic solutions > Key exchange" (no such heading). After: "1.4 Cryptographic
     solutions > Encryption", where key exchange sits in the outline.
   - keyPoint before: "TLS 1.3 removed static RSA and static Diffie-Hellman, so all its key exchanges give forward
     secrecy".
   - After: "... so all its public-key key exchanges give forward secrecy; resuming with a pre-shared key alone,
     without a fresh (EC)DHE, does not".
   - Why: TLS 1.3's PSK-only mode gives up forward secrecy. https://www.rfc-editor.org/rfc/rfc8446 (sections 1.2
     and 2.2)

3. **Initialization vector**
   - Example before: "AES-GCM uses a new 96-bit IV for every message; if a device reused an IV with the same key, an
     attacker could compare the two ciphertexts and forge messages."
   - Example after: "AES-GCM normally uses a 96-bit IV, a new one for every message. If a device reused an IV with
     the same key, an attacker could work out the authentication key from the two messages and forge new ones."
   - Why: 96 bits is the recommended length, not the only one. A forgery comes from recovering the hash subkey, not
     just from comparing ciphertexts. https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf
     (section 5.2.1.1, section 8, Appendix A)
   - keyPoint before: "Often called a nonce (number used once)". After: "In GCM and CTR it is often called a nonce
     (number used once)".
   - keyPoint added: "CBC needs more than uniqueness: its IV must be unpredictable, for example random".
     https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38a.pdf (Appendix C). That URL was also
     added to the card's sources.

4. **Drive-by download**
   - Category before: "2.2 Threat vectors and attack surfaces > Web" (not an outline heading). After: "2.2 Threat
     vectors and attack surfaces > Vulnerable software".
   - Why: MITRE describes it as exploiting client software (the browser and its plugins).
     https://attack.mitre.org/techniques/T1189/

5. **Evil twin and rogue access point**
   - keyPoint before: "Defenses: WPA3 or 802.1X with server certificate checks, users heeding certificate warnings,
     VPN on public Wi-Fi".
   - After: "Defenses: 802.1X (WPA2 or WPA3 Enterprise) with server certificate checks, users heeding certificate
     warnings, VPN on public Wi-Fi; a shared Wi-Fi password does not stop a twin run by someone who knows it".
   - Why: WPA3-Personal does not stop a twin when the attacker knows the shared password (a café, an airport). Server
     certificate checks do stop it. https://attack.mitre.org/techniques/T1557/004/

6. **Protected management frames (802.11w)**
   - keyPoint before: "Protects the frames against forgery; it does not hide their contents". After: "Its job is
     integrity: a forged or replayed protected frame fails the check and is dropped".
   - Why: the sources disagree on whether unicast management frames are encrypted, so the card no longer makes a
     claim about it either way. Cisco: "802.11w does not encrypt the frames, however, it protects the management
     frames" (MIC, IGTK). https://www.cisco.com/c/en/us/support/docs/wireless-mobility/wireless-lan-wlan/212576-configure-802-11w-management-frame-prote.html
   - keyPoint before: "Needs a WPA2 or WPA3 network with a key or 802.1X; it cannot protect an open network".
   - After: "Needs the keys a WPA2 or WPA3 handshake creates (personal or 802.1X); a classic open network has no
     keys, so PMF cannot protect it".
   - Why: "Classic" keeps Enhanced Open (OWE) out of the claim, since an OWE network does create keys. Same Cisco
     source.
   - keyPoint before: "Mandatory for WPA3 and for new Wi-Fi certified devices". After: "Required for WPA3 networks and
     for all newly Wi-Fi certified devices". https://www.wi-fi.org/discover-wi-fi/security

7. **Credentialed vs non-credentialed scan**
   - keyPoint before: "Credentialed scans need a protected scanning account, ideally limited to what the scan
     requires".
   - After: "Credentialed scans need an account with enough rights to read the system, often administrator, so guard
     it closely: used only by the scanner, password vaulted".
   - Why: Tenable says more privilege gives more thorough results, so "limited" could lead a learner to scan with too
     few rights. https://docs.tenable.com/nessus/Content/Credentials.htm
   - Source before: tripwire.com article (403 to this check, so not verifiable). After: the Tenable page above. NIST
     SP 800-115 (section 4.3) is kept and confirms the credentialed and network-only scanning views.

8. **Cryptographic erase**: no text change. Added the current NIST SP 800-88 Rev. 2 as a source
   (https://doi.org/10.6028/NIST.SP.800-88r2). The NIST glossary now cites it and still lists CE as a purge technique.

9. **OpenID Connect**
   - Definition before: "...a signed ID token (a JSON Web Token) saying who the user is and when and how they signed
     in."
   - After: "...saying who the user is, which app it was issued for and when it was issued. It can also say when and
     how the user signed in."
   - Why: iss, sub, aud, exp and iat are required. auth_time, acr and amr are optional or conditional.
     https://openid.net/specs/openid-connect-core-1_0.html (section 2)

10. **SCIM**
    - Category before: "4.6 Identity and access management > Provisioning and de-provisioning". After: "4.6 Identity
      and access management > Provisioning/de-provisioning user accounts" (the outline heading other cards use).
    - Content is unchanged; RFC 7643 confirms userName (required), emails, groups and active.
      https://www.rfc-editor.org/rfc/rfc7643

11. **Mean time to failure**
    - Example before: "A batch of SSDs has an MTTF of 1.5 million hours, so the team plans to replace drives before
      they reach the share of that life its policy sets."
    - Example after: "A data center runs 1,000 SSDs rated at an MTTF of 1.5 million hours. On average that is about
      one failed drive every 1,500 hours (roughly two months), so the team keeps spare drives on hand."
    - Why: a 1.5 million hour MTTF (about 171 years) is a fleet statistic, so replacing one drive at a share of it
      taught a wrong reading. The SI-13 idea (retire parts at a fraction of MTTF) stays in the keyPoints.
      https://csf.tools/reference/nist-sp-800-53/r5/si/si-13/
    - keyPoint added: "A fleet average, not a promise for one part: 1.5 million hours does not mean one drive lasts
      171 years". https://help.reliasoft.com/articles/content/hotwire/issue94/relbasics94.htm

12. **Data protection officer**
    - Definition before: "...or large-scale processing of sensitive data." After: "...or large-scale processing of
      sensitive or criminal conviction data."
    - keyPoint before: "Required under GDPR Article 37 for public bodies, large-scale systematic monitoring, or
      large-scale special category data".
    - After: "Required under GDPR Article 37 for public bodies (courts acting as courts excepted), large-scale
      systematic monitoring, or large-scale special category or criminal conviction data".
    - Source: https://gdpr-info.eu/art-37-gdpr/ (37(1)(a) and (c)). The Article 38 points were confirmed
      unchanged. https://gdpr-info.eu/art-38-gdpr/

13. **SOC reports**
    - Definition before: "SOC 2 covers security, availability, processing integrity, confidentiality and privacy;"
    - After: "SOC 2 covers one or more trust services categories (security, availability, processing integrity,
      confidentiality, privacy);"
    - Why: the AICPA and Journal of Accountancy wording lists these as alternatives joined by "or". A report need not
      cover all five. https://www.journalofaccountancy.com/newsletters/2016/jun/3-face-of-soc/
    - Category before: "5.5 Audits and assessments > External audits and assessments". After: "5.5 Audits and
      assessments > External" (the outline heading).

## Checked and left as is (CORRECT)
- **SAN**: RFC 5280 4.2.1.6 allows DNS, IP, email and URI names, and the CA must verify every name in it.
- **RA**: RFC 5280 calls it an optional system the CA hands some management work to; the RA does not sign.
- **Botnet**: the CISA alert says Mirai used 62 default credential pairs against routers, cameras and DVRs.
- **Session hijacking**: the OWASP URL now redirects to community.owasp.org (the URL on the card).
- **Fileless**: matches Microsoft's Type I, II and III examples (WMI, PowerShell, registry).
- **Backups**: matches SP 800-34r1 section 5.1.2 word for word in meaning (full, incremental, differential, mixes).
- **Fault tolerance vs HA**: SP 800-34r1 describes HA as 99.999 percent uptime or better.
- **DoH and DoT**: RFC 7858 says DoT uses port 853. DoH runs over HTTPS (443).
- **SOAR**: matches Microsoft Learn's definition of playbooks (automatic or on demand).
- **Inherent vs residual risk**: matches the NIST glossary (NISTIR 8286).

## Still weak
- The question of whether 802.11w encrypts unicast management frames was not settled: the IEEE standard was not
  read, and Cisco says it does not. The card now avoids the claim.
- Not confirmed from AICPA text: whether security is required in every SOC 2 report. The card's "one or more"
  wording is true either way.
