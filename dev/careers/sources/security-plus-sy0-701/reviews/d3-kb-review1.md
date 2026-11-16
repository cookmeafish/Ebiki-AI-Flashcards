# d3 knowledge chapter: independent accuracy review 1 (2026-11-16)

Reviewed: `knowledge/d3-knowledge.r7.md` (Domain 3, objectives 3.1 to 3.4, 100 sections). Corrected pass:
`knowledge/d3-knowledge.r8.md` (100 sections, 209,510 characters, largest section 3,006 characters, no heading over
110 characters, no duplicate titles inside the chapter or against the newest d0, d1, d2a, d2b, d4a, d4b and d5 chapters).
Cards compared: `cards/d3-cards.r8.json` (134 cards; it differs from r7 only in wording of 8 cards, no facts) and
`cards/d3-extras.r2.json` (2 cards). Reference chapter compared: `knowledge/d0-knowledge.r8.md`.

Method: every section read in full beside its cards; factual claims checked against the sources below, read this
session (NIST and RFC texts searched in local text copies of the published documents, web pages fetched). Mechanical
checks by script: section size, heading length, duplicate titles, dashes, links, HTML, question-and-answer blocks,
wording about the exam, acronyms expanded per section, 8-word overlap against `outline.md` and 15 source texts (only
proper names matched: "Payment Card Industry Data Security Standard", "intrusion detection system (IDS) and intrusion
prevention system", "Transport Layer Security (TLS), Internet Protocol Security (IPSec)").

## Sources read this session
| Key | Source | URL |
|---|---|---|
| 800-34 | NIST SP 800-34r1, Contingency Planning Guide | https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-34r1.pdf |
| 800-77 | NIST SP 800-77r1, Guide to IPsec VPNs | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-77r1.pdf |
| 800-82 | NIST SP 800-82r3, Guide to OT Security | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-82r3.pdf |
| 800-94 | NIST SP 800-94, Guide to IDPS | https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-94.pdf |
| 800-41 | NIST SP 800-41r1, Guidelines on Firewalls | https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-41r1.pdf |
| 800-125 | NIST SP 800-125, Full Virtualization Security | https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-125.pdf |
| 800-145 | NIST SP 800-145, Definition of Cloud Computing | https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-145.pdf |
| 800-160 | NIST SP 800-160 Vol. 2 Rev. 1 | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-160v2r1.pdf |
| 800-190 | NIST SP 800-190, Application Container Security | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-190.pdf |
| 800-204 | NIST SP 800-204, Microservices security | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-204.pdf |
| 7568 | RFC 7568, Deprecating SSLv3 | https://www.rfc-editor.org/rfc/rfc7568 |
| 8996 | RFC 8996, Deprecating TLS 1.0 and 1.1 | https://www.rfc-editor.org/rfc/rfc8996 |
| MS-SRM | Microsoft Learn, Shared responsibility in the cloud | https://learn.microsoft.com/en-us/azure/security/fundamentals/shared-responsibility |
| MS-EAP | Microsoft Learn, EAP for network access | https://learn.microsoft.com/en-us/windows-server/networking/technologies/extensible-authentication-protocol/network-access |
| MIRAI | CISA alert, Mirai and other botnets | https://www.cisa.gov/news-events/alerts/2016/10/14/heightened-ddos-threat-posed-mirai-and-other-botnets |
| CISCO-1X | Cisco Catalyst 9300 configuration guide, IEEE 802.1X port-based authentication | https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-9/configuration_guide/sec/b_179_sec_9300_cg/configuring_ieee_802_1x_port_based_authentication.html |
| PCI-TOK | PCI SSC, Tokenization Guidelines | https://listings.pcisecuritystandards.org/documents/Tokenization_Guidelines_Info_Supplement.pdf |
| PCI-642 | Qualys blog on PCI DSS 4.0.1 application requirements, plus a search over several compliance pages (secondary) | https://blog.qualys.com/product-tech/2026/08/27/pci-dss-4-0-1-application-requirements-youre-being-assessed-on-in-2026 |
| STUX | Symantec W32.Stuxnet Dossier (local copy from the earlier pass) | local text |
| CSA | Cloud Security Alliance, Top Threats 2024 landing page | https://cloudsecurityalliance.org/artifacts/top-threats-to-cloud-computing-2024 |
| EO | Executive Order 13526, sec. 1.2 | https://www.archives.gov/isoo/policy-documents/cnsi-eo.html |
| CISA-BK | CISA, Data Backup Options | https://www.cisa.gov/sites/default/files/publications/data_backup_options.pdf |
| UPS | Schneider Electric White Paper 1, UPS types | https://download.se.com/doc/SPD_SADE-5TNM3Y_EN/WP1_V10_EN.pdf |
| SSE | Web search over vendor glossaries quoting the analyst definition (secondary; the analyst's own page refused the fetch) | search results only |

## The writer's recheck list: verdicts
| Item | Verdict | Evidence |
|---|---|---|
| 802.1X details | Confirmed from vendor documentation, two wordings tightened | CISCO-1X: three roles, port starts unauthorized, EAPOL-logoff returns it to unauthorized, RADIUS can assign a VLAN, MAC authentication bypass uses the MAC address as identity. Before authentication the port passes EAPOL plus CDP and STP, so "only EAPOL" was softened; the server proposes a method (RFC 3748 Nak), so "picks" was reworded |
| SSE as the security half of SASE | Kept | Consistent across several vendor glossaries; analyst page not readable, so secondary only |
| Stuxnet and the air gap | Kept as hedged | STUX: the first infection "may have been introduced by removable drive"; removable drives covered the last hop to machines not on untrusted networks |
| PCI DSS web attack requirement | FIXED (see 3.2 WAF) | PCI-642: requirement 6.4.2 replaced 6.4.1 and has been mandatory since 31 March 2025; the standard names the function, not a WAF. Secondary sources only: the standard itself sits behind a license form |
| VLAN hopping, legal hold, HIPAA, SOX, DLP and OCR, PDUs | Kept | Well established and stated without numbers or dates; match the cards; no primary source read for these one-liners |
| "Parallel processing" as a recovery test | Kept, source line added | 800-34 appendix (quoting the SP 800-53 contingency testing control) lists "parallel" beside checklist, tabletop, simulation and full interrupt, with no definition |
| Hot site vs mirrored site | Precision note added | 800-34 sec. 3.4.3 and 5.1.4: hot site = equipment, infrastructure, staff, latest backed-up data loaded; mirrored site = real-time mirroring |
| IPsec AH discouraged | Strengthened | 800-77: "NIST discourages the use of AH"; its summary says AH should not be deployed, ESP with null encryption instead |
| COOP as a US federal term | Confirmed | 800-34: mission essential functions at an alternate site for up to 30 days |
| Tokenization: device token vs per-transaction code | Confirmed, exam wording removed | PCI-TOK: single-use and multi-use tokens, three generation methods, a reversible encrypted token is an encrypted card number |
| Split tunneling "strongly discouraged" | Confirmed | 800-77 sec. 7.2.6 uses those words |

## Facts fixed (9)
| # | Section | Before | After | Source |
|---|---|---|---|---|
| 1 | Web application firewall (WAF) | "card payment standards accept an automated web attack prevention solution" (optional sounding) | PCI DSS version 4 requires an automated solution in front of public-facing web applications that detects and blocks web attacks; a WAF commonly does it; the standard does not name the product | PCI-642 |
| 2 | Internet Protocol Security (IPSec) | AH "optional, often unavailable, guidance prefers ESP with null encryption" | Adds that the NIST IPsec guide discourages AH: recognize it, do not deploy it | 800-77 |
| 3 | Next-generation firewall (NGFW) | "Study materials also call it an application layer gateway, a stateful multilayer inspection firewall..." presented as plain synonyms | Deep packet inspection and Layer 7 firewall kept as names; the other two marked as loose textbook synonyms; an application layer gateway is strictly a proxy-style firewall | 800-41 sec. 2.1.3 and 2.1.4 (application firewalls and application-proxy gateways are different things) |
| 4 | Port security with IEEE 802.1X | Before authentication "only 802.1X authentication frames pass" | EAPOL plus a few switch housekeeping protocols on some products | CISCO-1X |
| 5 | Port security with IEEE 802.1X | The server "picks an EAP method" | The server proposes a method that the supplicant accepts or counters | RFC 3748 (Nak), CISCO-1X |
| 6 | Internet of Things (IoT) devices | Mirai used "about 60" default logins | 62 default username and password pairs | MIRAI |
| 7 | Layer 4 vs Layer 7 firewalls | Worked example in invented command syntax (`permit tcp ... established-return`) that looks like a real product's | The same two rules in plain words, labelled as not vendor syntax | 800-41 (stateful inspection) |
| 8 | IPSec worked example | "ESP with a sequence number shows replay protection" | The sequence number is what the receiver checks to reject replays | RFC 4303 (anti-replay is a receiver service) |
| 9 | Hot, warm and cold site | Hot site data "replicated", mirrored site only as a variant; hot cost "Highest" | Note giving the NIST definition of both; cost "Highest of the three" (mirrored is dearer, as d0 says) | 800-34 |

Also softened: UTM "many UTM firewalls filter by ports" now says many older ones do and current products often add
application awareness (800-41 describes UTM as a bundle, with no layer limit). TLS VPN layer cell "Session and
application level" now "Above the transport layer, one session at a time".

## Rule fixes
- Wording that implied knowledge of the exam, reworded in 20 places (lines of r7: 284, 394, 538, 558, 794, 799, 832,
  854, 948, 1092, 1166, 1171, 1189, 1268, 1340 twice, 1417, 1436, 1618, 1813). Examples: "The current exam name for
  the DMZ" -> "the name the SY0-701 objectives use"; "on the exam a UTM is" -> "the working distinction is"; "this is
  the exam sense" -> "the standard sense of the term"; "A question lists ..." -> "A draft data policy lists ...";
  "Questions mix the two lists on purpose" removed; "some courses teach" -> "some textbooks use".
- Acronyms: 114 first uses expanded inside the section where they appear (sections are read alone), in 49 sections.
- No dashes, links, HTML or question-and-answer blocks were found in r7; none in r8.

## Per section
PASS means facts checked or well established, cards consistent, teaching and rules fine (acronym expansions aside).

### 3.1
| Section | Result |
|---|---|
| Cloud computing service and deployment models | PASS (800-145, CSA order confirmed) |
| Cloud responsibility matrix | PASS (table matches MS-SRM row for row) |
| Hybrid cloud considerations | PASS |
| Third-party vendors in cloud architecture | PASS |
| Infrastructure as code (IaC) | PASS |
| Serverless computing | PASS |
| Microservices architecture | PASS (800-204) |
| Physical isolation and air-gapped networks | PASS (800-82, STUX) |
| Logical segmentation | PASS (VLAN hopping from cards only) |
| Software-defined networking (SDN) | PASS |
| Physical isolation vs logical segmentation vs SDN | PASS |
| On-premises architecture | PASS (MS-SRM unmet duties) |
| Centralized vs decentralized architecture | PASS |
| Containerization | PASS (800-190) |
| Virtualization and hypervisors | PASS (800-125) |
| Containers vs virtual machines vs serverless | FIXED (wording, fix list line 284) |
| Internet of Things (IoT) devices | FIXED (#6) |
| ICS and SCADA | PASS (800-82: 10 to 15 years, adjacent levels, DMZ, separate credentials) |
| RTOS | PASS |
| Embedded systems | PASS |
| Specialized systems compared | FIXED (scenario wording) |
| High availability as an architecture concept | PASS |
| Considerations: availability, resilience, ease of recovery | PASS |
| Considerations: cost, scalability, responsiveness, ease of deployment | PASS |
| Considerations: risk transference | PASS |
| Patch availability vs inability to patch | PASS |
| Considerations: power and compute | PASS |
| On-premises vs cloud vs hybrid hosting | PASS |

### 3.2
| Section | Result |
|---|---|
| Security zones and the screened subnet | FIXED (wording) |
| Device placement | FIXED (wording); placement either side of a firewall confirmed in 800-94 sec. 4.2.2 |
| Attack surface reduction | PASS |
| Connectivity | PASS |
| Fail-open vs fail-closed | PASS |
| Active vs passive, inline vs tap/monitor | PASS (800-94: tap downtime, spanning port limits, reset packets) |
| Jump server | PASS |
| Proxy server | PASS (800-41) |
| IDS and IPS | PASS |
| Load balancer | PASS |
| Network sensors | PASS (800-94 stealth mode) |
| Port security with IEEE 802.1X | FIXED (#4, #5) |
| EAP methods | PASS (MS-EAP: EAP-TLS the only method in WPA3-Enterprise 192-bit mode) |
| Web application firewall | FIXED (#1) |
| Unified threat management | FIXED (wording, softened Layer 4 claim) |
| Next-generation firewall | FIXED (#3) |
| Layer 4 vs Layer 7 firewalls | FIXED (#7) |
| Firewall types compared | FIXED (wording) |
| Network appliances compared | FIXED (wording) |
| VPN | PASS (800-77 split tunneling) |
| Secure remote access | PASS |
| Tunneling with TLS | PASS (7568, 8996; TCP 443 matches d0) |
| IPSec | FIXED (#2, #8); UDP 500 and 4500 match d0 and 800-77 |
| TLS VPN vs IPSec VPN | FIXED (wording, layer cell) |
| SD-WAN | PASS |
| SASE and SSE | PASS (secondary sources) |
| SD-WAN vs SASE vs traditional VPN | PASS |
| Selection of effective controls | PASS |
| Choosing an enterprise infrastructure control | PASS |

### 3.3
| Section | Result |
|---|---|
| Regulated data | FIXED (wording) |
| Trade secrets and intellectual property | PASS |
| Legal information and financial information | PASS (legal hold, SOX from cards and general knowledge) |
| Human-readable vs non-human-readable data | PASS |
| Data classification labels | FIXED (wording); EO levels confirmed |
| Data types vs data classifications | FIXED (wording, scenario recast) |
| Data states | PASS |
| Data in use and trusted execution environments | PASS |
| Data sovereignty | PASS |
| Geolocation and geographic restrictions | PASS |
| Sovereignty vs geolocation vs geographic restrictions | FIXED (wording) |
| Encryption | PASS |
| Hashing | PASS |
| Data masking | PASS |
| Tokenization | FIXED (wording; facts confirmed in PCI-TOK) |
| Obfuscation | PASS |
| Data segmentation | PASS |
| Permission restrictions | PASS |
| Encryption vs hashing vs masking vs tokenization vs obfuscation | PASS |
| Choosing a method to secure data by goal | FIXED (wording) |

### 3.4
| Section | Result |
|---|---|
| Load balancing vs clustering | PASS |
| Fault tolerance vs high availability | PASS |
| Hot, warm and cold site | FIXED (#9) |
| Geographic dispersion | PASS |
| Platform diversity | PASS (800-160) |
| Multi-cloud systems | PASS |
| Continuity of operations (COOP) | PASS (800-34, 30 days) |
| Capacity planning | PASS |
| Recovery testing: tabletop and simulations | PASS |
| Recovery testing: parallel processing and failover | FIXED (source line, wording); high-impact failover exercise confirmed in 800-34 sec. 3.5.3 |
| Recovery tests compared | PASS |
| Backups: onsite, offsite, 3-2-1 | PASS (CISA-BK) |
| Backup frequency; full, incremental, differential | PASS (800-34 sec. 5.1.2; matches d0) |
| Backup encryption and key handling | PASS |
| Snapshots | PASS |
| Backup recovery and restore testing | PASS |
| Replication | PASS |
| Journaling | PASS |
| Backups vs snapshots vs replication vs journaling | PASS |
| UPS | FIXED (wording); three designs confirmed in UPS |
| Generators | PASS |
| UPS vs generator vs redundant power | PASS |
| Resilience and recovery techniques matched to failures | PASS |

## Cards I believe are wrong or imprecise (not edited)
1. **Next-generation firewall (NGFW)**, definition: "Study guides also call it an application layer gateway, a
   stateful multilayer inspection firewall, a deep packet inspection firewall or a Layer 7 firewall." NIST SP 800-41
   treats an application-proxy gateway as a different technology from an application firewall, so "application layer
   gateway" is not a true synonym. The sentence also mirrors a list of alternative names found in third-party study
   material, which the course's own-words rule should catch. Suggest: keep "deep packet inspection" and "Layer 7".
2. **Web application firewall (WAF)**, key points: "often required or recommended for PCI DSS". Since 31 March 2025
   the standard requires an automated solution that detects and prevents web attacks on public-facing web
   applications; a WAF is the usual way but is not named as the only one. Suggest that wording.
3. **Internet protocol security (IPSec)**: presents AH as a normal part of the suite. Not wrong, but NIST SP 800-77r1
   discourages AH; a short "rarely used today" note would help.
4. **Hot site**: "data kept current (replication); often a mirror of production". NIST keeps real-time mirroring for
   the mirrored site. Acceptable as everyday usage; the chapter now carries both.
5. **Unified threat management (UTM)**, key points: "many UTMs filter only at Layer 4". True of older products only;
   no primary source supports it as a general statement.


## For the reference chapter reviewer (not my file)
- `d0-knowledge.r8.md` lists AH as "Current but optional". SP 800-77r1 goes further ("NIST discourages the use of
  AH"; summary: should not be implemented or deployed). d3 r8 says discouraged. Not a contradiction, but d0 could add it.
- All ports in d3 r8 match d0 r8: TLS VPN TCP 443, IKE UDP 500, NAT traversal UDP 4500. d3 gives no other port numbers.

## Could not verify from a primary source
- PCI DSS requirement 6.4.2 wording: secondary sources only (the standard needs a license acceptance).
- SSE definition: vendor glossaries only.
- IEEE 802.1X: vendor documentation and RFC 3748, not the IEEE standard.
- One-liners resting on cards and general knowledge: VLAN hopping, legal hold, HIPAA, SOX, DLP with optical character
  recognition, PDUs, scale up vs scale out, typical site recovery times ("minutes to hours", "days to weeks"; NIST
  gives only relative values), UPS runtime "minutes".
- Cloud provider behaviours taken from the writer's sources and not re-read: AWS Lambda responsibility split, Apple
  Pay device account number, Entra ID risk detections, Azure availability zones and confidential computing, SQL Server
  dynamic masking and transaction log, ext4 journal modes, Storage Replica modes, NGINX load balancing methods, GDPR
  Art. 44, WIPO trade secrets, OWASP password storage list, CISA ransomware guide lines on IaC templates and
  multi-cloud backups. They match what I know and nothing in the cards disagrees.
- The acronym expansions were inserted by script and spot-checked, not each read in place.
