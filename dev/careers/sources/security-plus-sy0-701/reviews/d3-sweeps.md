# d3 (3.0 Security Architecture): 10 sweeps, 2026-11-15

Input: `cards/d3-cards.r2.json` (134 cards) and `knowledge/d3-knowledge.r2.md`.
Output: `cards/d3-cards.r3.json` (134 cards, same order, same `obj` and `path` on every card) and `knowledge/d3-knowledge.r3.md`. The r2 files are unchanged.

Rules followed: fix only what a source read this session shows is wrong or imprecise, add what is missing, keep every true and helpful detail (Professor Messer material included), all edits in our own words (no copied sentences; the outline 12-word check on the r3 files finds 0 runs).

Totals: 134 cards checked in each of the 10 sweeps (1,340 card checks). 16 cards changed (18 field edits). 16 matching edits in the knowledge chapter. 0 cards removed, 0 facts removed.

## Sources read this session
| Id | Source |
|---|---|
| CSA | Cloud Security Alliance, Top Threats to Cloud Computing 2024: https://cloudsecurityalliance.org/artifacts/top-threats-to-cloud-computing-2024 |
| STUX | Symantec, W32.Stuxnet Dossier v1.4: https://docs.broadcom.com/doc/security-response-w32-stuxnet-dossier-11-en |
| 800-190 | NIST SP 800-190, Application Container Security Guide: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-190.pdf |
| MIRAI | CISA alert, Heightened DDoS Threat Posed by Mirai and Other Botnets: https://www.cisa.gov/news-events/alerts/2016/10/14/heightened-ddos-threat-posed-mirai-and-other-botnets |
| 800-82 | NIST SP 800-82r3, Guide to OT Security: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-82r3.pdf and glossary https://csrc.nist.gov/glossary/term/supervisory_control_and_data_acquisition , https://csrc.nist.gov/glossary/term/remote_terminal_unit |
| 800-145 | NIST SP 800-145, The NIST Definition of Cloud Computing: https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-145.pdf |
| AXIS | Axis, Fail-safe vs fail-secure: https://newsroom.axis.com/blog/fail-safe-vs-fail-secure |
| 3748 | RFC 3748, EAP: https://www.rfc-editor.org/rfc/rfc3748 |
| 4851 | RFC 4851, EAP-FAST: https://www.rfc-editor.org/rfc/rfc4851 |
| M-FW | Professor Messer, Firewall Types (SY0-701 3.2): https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/firewall-types-sy0-701/ |
| 7568 | RFC 7568, Deprecating SSL 3.0: https://www.rfc-editor.org/rfc/rfc7568 |
| 8996 | RFC 8996, Deprecating TLS 1.0 and 1.1: https://www.rfc-editor.org/rfc/rfc8996 |
| 4301/2/3 | RFC 4301 (IPsec architecture), RFC 4302 (AH), RFC 4303 (ESP): https://www.rfc-editor.org/rfc/rfc4303 |
| 7296 | RFC 7296, IKEv2 (UDP 500 and 4500): https://www.rfc-editor.org/rfc/rfc7296 |
| SSE | Wikipedia, Secure access service edge (Gartner's 2021 SSE subset), plus a search summary of Gartner's SASE market definition: https://en.wikipedia.org/wiki/Secure_access_service_edge |
| EO | Executive Order 13526, sec. 1.2 classification levels: https://www.archives.gov/isoo/policy-documents/cnsi-eo.html |
| APPLE | Apple Pay security and privacy overview: https://support.apple.com/en-ie/101554 |
| PCI | PCI SSC, Tokenization Product Security Guidelines (2015): https://listings.pcisecuritystandards.org/documents/Tokenization_Product_Security_Guidelines.pdf |
| M-DATA | Professor Messer, Protecting Data and Data Types and Classifications (SY0-701 3.3): https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/protecting-data-sy0-701/ , https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/data-types-and-classifications-sy0-701/ |
| GDPR | GDPR Art. 44: https://gdpr-info.eu/art-44-gdpr/ |
| M-TEST | Professor Messer, Recovery Testing (SY0-701 3.4): https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/recovery-testing-sy0-701/ |
| M-PWR | Professor Messer, Power Resiliency (SY0-701 3.4): https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/power-resiliency-sy0-701/ |
| VERTIV | Vertiv, types of UPS systems (search-read summary of vendor pages, confirming the online load always runs from the inverter): https://www.vertiv.com/en-asia/insights/articles/educational-articles/what-are-the-different-types-of-ups-systems/ |
| CISA-BK | CISA/US-CERT, Data Backup Options (3-2-1 rule): https://www.cisa.gov/sites/default/files/publications/data_backup_options.pdf |

## Sweep 1: Facts
Checked every definition against the sources above. Checked 134, changed 5 cards (6 edits).
| Card | Before | After | Source |
|---|---|---|---|
| #12 Air-gapped network (example) | "yet Stuxnet reached them through infected USB drives" | "yet Stuxnet is believed to have crossed the gap on infected USB drives, which it used to reach machines never connected to any network" (the dossier says the first infection "may have been" a removable drive, so the claim is hedged) | STUX |
| #19 IoT (example) | "Thousands of IP cameras with default passwords..." | Hundreds of thousands of cameras, video recorders and home routers, taken over in 2016 with a short list of factory default logins | MIRAI |
| #20 ICS/SCADA (definition) | SCADA "using PLCs, sensors and HMIs" | adds the central control server and remote terminal units (RTUs) at field sites | 800-82 |
| #99 Tokenization (example) | "sends a one-time token instead of the real card number" | a device-specific token plus a code valid for one transaction, never the real card number | APPLE |
| #99 Tokenization (keyPoints) | (added) | notes that guides call wallet tokens one-time (M-DATA), that the device token is reused while the code changes (APPLE), and that PCI also describes cryptographic tokens while the exam sense is the vault token with no mathematical link | APPLE, PCI, M-DATA |
| #133 UPS (keyPoints) | "online (double-conversion, always on battery path)" | "the load always runs through the battery and inverter side, so there is no switchover gap" (keeps the exam framing, says why) | M-PWR, VERTIV |

Confirmed unchanged (examples of what was checked): cloud service and deployment models (800-145); container shared kernel and weaker isolation than VMs (800-190); ICS availability first, patching limits and compensating controls (800-82); EAP as a framework (3748); AH integrity and authentication without encryption, ESP confidentiality plus integrity (4302, 4303); 3-2-1 backups (CISA-BK); data sovereignty and transfer limits (GDPR); parallel processing in the CPU sense, kept as the exam sense with the parallel-test note (M-TEST); classifications as Messer groups them (M-DATA).

## Sweep 2: Numbers and names
Checked every port, version, standard number, acronym and percentage. Checked 134, changed 3.
| Card | Before | After | Source |
|---|---|---|---|
| #67 TLS (keyPoints) | "SSL is deprecated, TLS 1.2 and 1.3 are current" | SSL 3.0 must not be used (RFC 7568), TLS 1.0 and 1.1 deprecated (RFC 8996), TLS 1.2 and 1.3 current | 7568, 8996 |
| #68 IPSec (keyPoints) | "IKE negotiates keys" | adds IKE on UDP 500, or UDP 4500 through NAT, and that AH and ESP both offer anti-replay | 7296, 4302, 4303 |
| #80 Data classifications (keyPoints) | "government uses unclassified, confidential, secret, top secret" | the US has three classified levels (top secret, secret, confidential); anything else is unclassified | EO |

Confirmed: domain weight 18% (outline), TCP 443 for TLS VPNs, 802.1X roles and EAPoL, 99.999% example, IEEE/NIST names.

## Sweep 3: Examples
Checked each example is concrete and an instance of its own concept. Checked 134, changed 0 beyond the sweep 1 example fixes (#12, #19, #99, counted there). No example illustrated a neighbouring concept.

## Sweep 4: Key points
Checked each key point is true and useful. Checked 134, changed 4 (additions of missing, useful facts).
| Card | Before | After | Source |
|---|---|---|---|
| #3 Cloud | "misconfiguration (open storage buckets) is the top cloud risk" | "a leading cloud risk: the Cloud Security Alliance ranked misconfiguration and inadequate change control first in its 2024 top threats" (claim now has its source) | CSA |
| #17 Containerization | "isolate with namespaces" | adds what namespaces do and control groups (cgroups) for resource limits | 800-190 |
| #20 ICS/SCADA | (added) | NIST now groups ICS under operational technology (OT) | 800-82 |
| #60 UTM | (added) | many UTMs filter only at Layer 4 (ports), not by application | M-FW |

## Sweep 5: Confusables
Checked look-alike pairs across all cards and the chapter (IDS/IPS, active/passive, inline/tap, fail-open/fail-closed, WAF/NGFW/UTM, L4/L7, TLS/IPSec, SD-WAN/SASE, hybrid/multi-cloud, containers/VMs, patch availability/inability, encryption/hashing/masking/tokenization, sovereignty/geolocation, hot/warm/cold, load balancing/clustering, replication/backup, UPS/generator, tabletop/simulation/failover). All consistent. Checked 134, changed 2.
| Card | Before | After | Source |
|---|---|---|---|
| #45 Fail-closed | "do not confuse with door locks (fail-safe/fail-secure)" | says what each lock does: fail-safe unlocks on power loss for safe exit, fail-secure stays locked | AXIS |
| #70 SASE | (added) | the security half alone is security service edge (SSE) | SSE |

## Sweep 6: Coverage
Matched every card to its outline line by `obj` and `path`: 134 outline lines (domain, 4 objectives, 129 items), 134 cards, none missing or extra. Each overview card names every item under it; each item card covers its whole line (for example 3.1 Considerations names all 12 factors, 3.4 Backups all 7 sub-items). Checked 134, changed 1.
| Card | Before | After | Source |
|---|---|---|---|
| #121 Simulation | test of a disaster only | adds simulated attacks such as a fake phishing campaign, which the exam's recovery testing lesson includes | M-TEST |

## Sweep 7: Consistency
Checked the same fact is stated the same way on cards and in the chapter. Every card fix above was carried into the chapter (16 chapter edits: cloud misconfiguration, container namespaces and cgroups, Mirai, SCADA RTUs and OT, door lock contrast, EAP-FAST PAC, UTM Layer 4, NGFW names, TLS versions, IKE ports and anti-replay, SSE, US classification levels, tokenization note and phone wallets, phishing simulation, UPS types, Stuxnet). No contradictions found between cards (for example high availability in 3.1 and 3.4, segmentation in 3.1 and 3.3, risk transference vs 5.2). Checked 134, changed 0 more cards.

## Sweep 8: Clarity
Checked plain wording, no padding, no em or en dashes, no HTML in the r3 card file and chapter (scripted check: 0 dashes, 0 HTML tags). Checked 134, changed 2.
| Card | Before | After | Source |
|---|---|---|---|
| #57 EAP | "EAP-FAST uses a PAC instead of certificates" | "builds its tunnel with a shared secret called a protected access credential (PAC), so clients need no certificate" (spells out PAC; the RFC still has the server use TLS, so "instead of certificates" was too broad) | 4851 |
| #61 NGFW | "Also called an application layer gateway or Layer 7 firewall." | names all the study-guide aliases: application layer gateway, stateful multilayer inspection, deep packet inspection, Layer 7 firewall | M-FW |

## Sweep 9: Exam fit
Checked wording matches SY0-701 (screened subnet for DMZ, 802.1X and EAP as port security, WAF/UTM/NGFW/L4/L7, parallel processing as Messer teaches it, private/classified/restricted grouping, mobile tokenization as taught). Nothing from older exams found as current; deprecated protocols are marked (TLS card). Checked 134, changed 0 more.

## Sweep 10: Final adversarial pass
Tried to prove each card wrong, focusing on absolute words ("always", "never", "only", "top", "strongest"). Found and fixed in earlier sweeps: "top cloud risk" (#3), "one-time token" (#99), "instead of certificates" (#57), Stuxnet certainty (#12). Re-read the r3 file in full. Remaining absolutes are true in the exam sense (customer always owns its data; provider always secures the facility; hash cannot be reversed). Checked 134, changed 0 more.

## Per-card source notes (changed cards)
- #3 Cloud: CSA (ranking), 800-145 (models).
- #12 Air-gapped: STUX.
- #17 Containerization: 800-190.
- #19 IoT: MIRAI.
- #20 ICS/SCADA: 800-82 (RTUs, control server, OT, availability first).
- #45 Fail-closed: AXIS.
- #57 EAP: 3748, 4851.
- #60 UTM: M-FW.
- #61 NGFW: M-FW.
- #67 TLS: 7568, 8996.
- #68 IPSec: 4301, 4302, 4303, 7296.
- #70 SASE: SSE.
- #80 Data classifications: EO, M-DATA.
- #99 Tokenization: APPLE, PCI, M-DATA.
- #121 Simulation: M-TEST.
- #133 UPS: M-PWR, VERTIV.
Unchanged cards keep their facts; the sources above confirmed the checked items listed under sweeps 1 and 2.

## Proposed new cards
No outline line lacks a card. Concepts a learner needs that no 3.x line names:
1. **Full, incremental and differential backups.** Why: the Frequency card mentions them, and backup scenario questions rely on knowing which restores need which sets. Source: CISA-BK (backup options), Professor Messer Backups (SY0-701 3.4). Could live in the knowledge chapter only, since the coverage rule is one card per outline line.
2. **RTO and RPO.** Why: several 3.4 cards use them (frequency, recovery, hot site); they are defined in 5.2 (business impact analysis), so a cross-reference note may be enough. Source: NIST SP 800-34 (not read this session; check before adding).
3. **Fault tolerance vs high availability.** Why: the HA card contrasts them; a learner meets both terms. Source: 800-82 (SCADA described as fault-tolerant with redundancy).

## Unsure
- #85 Private: "Professor Messer groups private with classified and restricted" is confirmed by M-DATA; how each organization uses these labels still varies, as the card says.
- #99 Tokenization: Messer teaches mobile tokens as "one-time use"; Apple says the device account number is reused and only the per-transaction code is one-time. Both are now on the card; a question writer should not mark "one-time token" wrong.
- #70 SASE: the SSE note rests on Wikipedia plus a search summary of Gartner's market definition (Gartner's own pages refused automated reads).
- #133 UPS: Messer's "always runs from battery" is a simplification; vendor pages say the load always runs through the inverter, which the battery feeds on power loss. The card keeps both ideas.
