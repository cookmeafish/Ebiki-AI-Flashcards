# d3 knowledge chapter: second independent accuracy review (2026-11-16)

Reviewed: `knowledge/d3-knowledge.r8.md` (Domain 3, objectives 3.1 to 3.4, 100 sections). Corrected pass:
`knowledge/d3-knowledge.r9.md` (100 sections, 210,292 characters, largest section 3,005 characters, no heading over
110 characters, no duplicate titles, no dashes, links, "http" text, HTML or question-and-answer blocks; first two lines
unchanged). Reference chapter compared: `knowledge/d0-knowledge.r9.md`. Review 1 log read: `reviews/d3-kb-review1.md`.

Method: every section of r8 read in full once more as a learner would. Review 1's nine fixes and its "could not
verify" list were then checked against sources fetched again in this session (my own downloads, not the earlier
local copies; NIST PDFs converted to text and searched, RFC text files, vendor pages fetched). Cards were not edited.
Source addresses below are written without the scheme.

## Sources read this session
| Key | Source | Address |
|---|---|---|
| 800-77 | NIST SP 800-77r1, Guide to IPsec VPNs | nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-77r1.pdf |
| 800-34 | NIST SP 800-34r1, Contingency Planning Guide | nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-34r1.pdf |
| 800-41 | NIST SP 800-41r1, Guidelines on Firewalls and Firewall Policy | nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-41r1.pdf |
| 800-94 | NIST SP 800-94, Guide to IDPS | nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-94.pdf |
| 800-82 | NIST SP 800-82r3, Guide to OT Security | nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-82r3.pdf |
| 4301 | RFC 4301, Security Architecture for IP | rfc-editor.org/rfc/rfc4301.txt |
| 4303 | RFC 4303, ESP | rfc-editor.org/rfc/rfc4303.txt |
| 7296 | RFC 7296, IKEv2 | rfc-editor.org/rfc/rfc7296.txt |
| 9329 | RFC 9329, TCP Encapsulation of IKE and IPsec Packets | rfc-editor.org/rfc/rfc9329.txt |
| 3748 | RFC 3748, EAP | rfc-editor.org/rfc/rfc3748.txt |
| 3580 | RFC 3580, IEEE 802.1X RADIUS Usage Guidelines | rfc-editor.org/rfc/rfc3580.txt |
| 4851 / 5281 | RFC 4851 (EAP-FAST), RFC 5281 (EAP-TTLS) | rfc-editor.org/rfc/rfc4851.txt, rfc5281.txt |
| CISCO-1X | Cisco Catalyst 9300 guide, IEEE 802.1X port-based authentication (first half of the page) | cisco.com (same page as review 1) |
| MIRAI | CISA alert on Mirai and other botnets | cisa.gov/news-events/alerts/2016/10/14/heightened-ddos-threat-posed-mirai-and-other-botnets |
| CISA-RW | CISA StopRansomware Guide (web version) | cisa.gov/stopransomware/ransomware-guide |
| OWASP-PW | OWASP Password Storage Cheat Sheet (source file) | github.com/OWASP/CheatSheetSeries, cheatsheets/Password_Storage_Cheat_Sheet.md |
| EXT4 | Linux kernel documentation, ext4 | github.com/torvalds/linux, Documentation/admin-guide/ext4.rst |
| MS-DDM | Microsoft Learn, SQL Server dynamic data masking (source file) | github.com/MicrosoftDocs/sql-docs, dynamic-data-masking.md |
| MS-AZ | Microsoft Learn, Azure availability zones | learn.microsoft.com/en-us/azure/reliability/availability-zones-overview |
| MS-RISK | Microsoft Learn, Entra ID Protection risk detections | learn.microsoft.com/en-us/entra/id-protection/concept-identity-protection-risks |
| MS-SSE | Microsoft Learn, What is Global Secure Access | learn.microsoft.com/en-us/entra/global-secure-access/overview-what-is-global-secure-access |
| APPLE | Apple Support, Apple Pay security and privacy overview | support.apple.com/en-us/101554 |
| NGINX | NGINX documentation, HTTP load balancing | nginx.org/en/docs/http/load_balancing.html |
| GDPR | GDPR Article 44 text | gdpr-info.eu/art-44-gdpr |
| WIPO | WIPO, Trade secrets | wipo.int/en/web/trade-secrets |
| CSA | Cloud Security Alliance, Top Threats 2024 landing page | cloudsecurityalliance.org/artifacts/top-threats-to-cloud-computing-2024 |
| PCI (secondary) | Web search over several compliance pages quoting PCI DSS 6.4.2 | search results only; the PCI SSC document library returned its license page to every direct request |

## Review 1's nine fixes, re-checked
| # | Fix | Verdict | Evidence |
|---|---|---|---|
| 1 | WAF and PCI DSS | Confirmed in substance, wording tightened; still secondary | Every page found quotes 6.4.2 the same way: an automated technical solution for public-facing web applications that "continually detects and prevents web-based attacks". r8 said "keeps detecting and blocking"; r9 says "continually detects and prevents" (pages disagree on whether an alert-only setting satisfies it, so "blocking" was too strong). No date is stated in the chapter |
| 2 | IPsec AH discouraged | Confirmed, strengthened | 800-77: "NIST discourages the use of AH in this publication"; AH "is not mandatory to implement and might not be available with all IPsec implementations"; summary bullet: AH "should not be implemented or deployed", ESP with null encryption or AES-GMAC instead. 4301: implementations "MUST support ESP and MAY support AH" |
| 3 | NGFW synonyms | Confirmed | 800-41 sec. 2.1.3: stateful protocol analysis is "referred to by some vendors as deep packet inspection"; sec. 2.1.4: "Application-proxy gateways are quite different than application firewalls" and create two separate connections. "Multilayer" does not appear in the guide at all |
| 4 | 802.1X traffic before authentication | Confirmed | CISCO-1X: before authentication only EAPOL, Cisco Discovery Protocol and Spanning Tree Protocol traffic pass |
| 5 | Server proposes the EAP method | Confirmed | 3748 sec. 5.3: the peer answers a Request for a method it will not use with a Nak naming the methods it wants |
| 6 | Mirai 62 default logins | Confirmed | MIRAI: "a short list of 62 common default usernames and passwords" |
| 7 | Layer 4 vs Layer 7 example in plain words | Confirmed (no fact involved) | 800-41 sec. 2.1.2 and 2.1.3 match the description |
| 8 | ESP sequence number and replay | Confirmed | 4303: anti-replay is a service the receiver may enable, based on the sequence number |
| 9 | Hot site vs mirrored site | CORRECTED | r8 said NIST "reserves real-time data mirroring for a separate type". 800-34 sec. 5.1.4 says of hot sites: "In many cases, hot site data and databases are updated concurrently with or soon after the primary data and databases are updated", and gives two continuously synchronized production systems as an example of a hot site. Sec. 3.4.3 lists the mirrored site as a "variation" with automated real-time mirroring, the most expensive choice. r9 states both. "Highest of the three" for hot-site cost is right (table 3-6: cold Low, warm Medium, hot Medium/High; d0 says the same) |

Also re-checked from review 1: split tunneling "strongly discouraged" (800-77 sec. 7.2.6, confirmed); COOP up to 30
days (800-34, confirmed); "parallel" listed beside checklist, tabletop, simulation and full interrupt (800-34 appendix,
confirmed); spanning port and tap limits (800-94 sec. 4.2.1, confirmed); OT lifetime "10 to 15 years", adjacent levels
and air gaps not enough (800-82, confirmed).

## New facts fixed in r9 (8)
| # | Section | Before (r8) | After (r9) | Source |
|---|---|---|---|---|
| 1 | Hot, warm and cold site | NIST "reserves real-time data mirroring" for the mirrored site (overstated; see fix 9 above) | NIST's own description of a hot site includes data updated at the same time as or soon after the primary; mirrored site named as a variation; hot data cell now "Latest backup loaded, often kept current by replication" | 800-34 sec. 3.4.3, 5.1.4 |
| 2 | Hot, warm and cold site | Resume times "Minutes to hours", "Hours to days", "Days to weeks" given as plain facts | Column headed "Rough time to resume"; a sentence says NIST gives only short, medium and long and the ranges are rules of thumb (now agrees with d0, which gives relative values only) | 800-34 table 3-6 |
| 3 | IPSec | AH "optional to implement and often unavailable" | Products must support ESP and may support AH; NIST SP 800-77 revision 1 discourages AH and says it should not be deployed (same wording as d0 r9) | 800-77, 4301 |
| 4 | IPSec | ESP and AH given no number; "firewalls that block ESP" left unexplained | ESP is IP protocol 50 and AH is IP protocol 51, not ports (agrees with d0 r9) | 4303 sec. 2 (value 50); d0 |
| 5 | IPSec | Tunnel mode: the whole original packet "is encrypted" (false for AH) | "is protected (encrypted when ESP is used)" | 800-77 sec. 3 |
| 6 | TLS VPN vs IPSec VPN | Old versions to avoid: "Authentication Header used alone when confidentiality is needed" (implied AH is otherwise fine) | "Authentication Header (discouraged; use ESP), and version 1 of Internet Key Exchange for new deployments" | 800-77: "IKEv1 should not be used for new deployments" |
| 7 | Unified threat management, and the firewall comparison table | "Many older UTM firewalls filter by ports and addresses (Layer 4)"; table cell "often port-based filtering" | A UTM is defined by bundling, not by a layer; some older or entry-level models filter mainly at Layer 4, current ones usually add application awareness; table cell "application awareness varies by product" | 800-41 sec. 2.1.8 describes a UTM only as a bundle of functions and says nothing about a layer |
| 8 | Regulated data | GDPR limits transfers "to places that keep the same level of protection" | Transfers allowed only under set conditions, so the protection is not weakened | GDPR Art. 44 |

Wording only: cloud threat "ranking ... came first" now "report ... lists first" (the CSA page gives the order but
does not itself call it a ranking); the NGFW sentence now says why the two extra labels are loose (NIST treats a
proxy gateway as a different technology); PCI wording as in fix 1.

## The five cards review 1 flagged: confirmed or refuted (cards not edited)
1. **Next-generation firewall, list of synonyms**: CONFIRMED imprecise. 800-41 supports "deep packet inspection" as a
   vendor name for application-layer inspection, but says application-proxy gateways are "quite different" from
   application firewalls, and never uses "stateful multilayer inspection". "Application layer gateway" is not a
   true synonym. The chapter accepts the labels as loose synonyms so a learner repeating the card is not marked wrong.
2. **Web application firewall, "often required or recommended for PCI DSS"**: CONFIRMED imprecise, from secondary
   sources only. All pages found quote requirement 6.4.2 as mandating an automated technical solution that continually
   detects and prevents web attacks on public-facing web applications; none says a WAF is the only way. The standard
   itself could not be opened (license page).
3. **IPsec card presents AH as a normal part of the suite**: CONFIRMED incomplete. 800-77r1 discourages AH and says it
   should not be implemented or deployed; RFC 4301 makes AH optional. The card is not false (AH is part of IPsec and
   gives integrity without encryption) but should say it is discouraged.
4. **Hot site, "data kept current (replication); often a mirror of production"**: REFUTED as an error. 800-34 sec.
   5.1.4 itself says hot site data is in many cases updated concurrently with the primary and gives two synchronized
   production systems as an example of a hot site. The card is acceptable; only the separate term "mirrored site"
   (a NIST variation) is missing from it.
5. **Unified threat management, "many UTMs filter only at Layer 4"**: CONFIRMED unsupported. 800-41 defines a UTM by
   its bundled functions with no layer limit; no primary source found for the claim. True of some older products only.

## Agreement with the reference chapter d0-knowledge.r9
- IPsec: d3 r9 and d0 r9 now say the same thing about AH (optional, discouraged by SP 800-77 revision 1, ESP with null
  encryption instead), ESP = IP protocol 50, AH = IP protocol 51, IKE on UDP 500, NAT traversal on UDP 4500 (7296
  confirms 500 and 4500). TLS VPN on TCP 443 in both.
- Recovery sites: both give cold, warm, hot and mirrored with mirrored the most expensive; d3's time ranges are now
  labelled rough, matching d0's relative values.
- Backup types: d3's full, incremental and differential table and its worked restore match d0 word for meaning
  (incremental = since the last backup of any type; differential = since the last full). 3-2-1 identical.
- RTO and RPO: d3's wording (RTO = how long recovery may take, RPO = how much data loss, set backup frequency from the
  RPO) agrees with d0. d3 does not define MTTR, MTBF, MTD or MTTF and points to the Reference chapter and objective
  5.2; nothing to reconcile.
- RAID: d3 names no RAID level (only "redundant disks" and "mirrored disks"); nothing to reconcile. d0's RAID table
  (RAID 0, 1, 5, 6, 10 minimum disks and failures survived) read and found standard.
- Power: d0 has no UPS or generator numbers; d3 gives none beyond "minutes" for a UPS and an example 30 second
  generator start in a scenario.
- 802.1X and EAP: d3 and d0 both say EAP-TLS is the method for WPA3-Enterprise 192-bit mode; RADIUS ports are only in
  d0.
- Nothing found wrong in d0 r9 in the parts compared.

## Review 1's "could not verify" list: status now
| Item | Status |
|---|---|
| IEEE 802.1X roles, VLAN assignment, logoff | Verified from IETF and vendor text: 3580 defines supplicant, authenticator and authentication server and RADIUS VLAN attributes; CISCO-1X confirms logoff and MAC authentication bypass. The IEEE standard itself was not read |
| EAP method table | Verified: 4851 (PAC holds a shared secret), 5281 (EAP-TTLS carries PAP, CHAP, MS-CHAP), 3748 (EAP is a framework) |
| SSE definition | Vendor documentation only (MS-SSE calls SSE an identity-aware, cloud-delivered network security category made of SWG, ZTNA and CASB). "SSE is SASE without the networking part" remains an industry-usage statement |
| OWASP password functions | Verified: Argon2id, scrypt, bcrypt, PBKDF2; pepper stored outside the database |
| ext4 journaling metadata by default | Verified: default mode data=ordered journals metadata only |
| SQL Server dynamic masking and inference | Verified: MS-DDM says masking does not stop a user with ad hoc query rights from inferring values |
| Azure availability zones | Verified: separate groups of datacenters in a region with independent power, cooling and networking; zones do not protect against a full-region outage |
| Entra risk detections | Verified: impossible or atypical travel and anonymous IP address detections as described |
| Apple Pay device account number | Verified: device account number in the Secure Element plus a transaction-specific dynamic security code |
| NGINX methods | Verified: round robin, least connected, IP hash, weights, health checks (lowest response time is a commercial feature; kept as a generic method) |
| GDPR Art. 44, WIPO trade secrets | Verified (three WIPO conditions; independent invention and reverse engineering) |
| CISA ransomware guide on IaC templates and multi-cloud backups | Verified from the web version of the guide |
| CSA 2024 order | Order verified from the landing page; that it is a ranking by survey is not stated on that page |

## Still unverified from a primary source
- PCI DSS requirement 6.4.2 exact text (secondary pages agree; the standard needs a license acceptance).
- The IEEE 802.1X standard text and the Wi-Fi Alliance text for WPA3-Enterprise 192-bit mode (vendor and IETF sources
  only; d0 says the same).
- SSE and SASE definitions (analyst terms; vendor documentation only).
- Well-established one-liners with no number or date, not opened this session: VLAN hopping, legal hold, HIPAA, SOX,
  DLP with optical character recognition, PDUs, scale up vs scale out, quorum and heartbeat in clusters, UPS runtime
  "minutes" and the three UPS designs (review 1 read the vendor white paper), Stuxnet and removable drives (review 1
  read the dossier), AWS Lambda responsibility split, Azure confidential computing, Storage Replica modes.
- Sources review 1 read that I did not reopen: SP 800-125, 800-145, 800-160, 800-190, 800-204, the Microsoft shared
  responsibility table, PCI tokenization guidelines, Executive Order 13526, CISA data backup options, RFC 7568 and
  8996 (downloaded, version status lines not re-read line by line; the chapter's statements are standard).

## Learner read (all 100 sections)
Every section stands alone with acronyms expanded, has one unambiguous scenario and a real contrast. No wording about
what the real exam asks, no course or instructor names, no legacy item left unlabelled (SSL 2.0 and 3.0, TLS 1.0 and
1.1, MD5, SHA-1, AH and IKE version 1 are all marked). No section needed a teaching rewrite.
