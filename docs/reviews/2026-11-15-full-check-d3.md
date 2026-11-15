# Full independent check: Security+ domain 3 (d3), 2026-11-15

Part of [the card full-check plan](../plans/2026-11-15-card-full-check.md). Checker did not write or sweep these cards.

**Checked:** `dev/careers/sources/security-plus-sy0-701/cards/d3-cards.r3.json` (134 cards), `d3-extras.r2.json`
(2 extras; identical to r1), `knowledge/d3-knowledge.r3.md`.
**Written:** `cards/d3-cards.r4.json`, `knowledge/d3-knowledge.r4.md` (unchanged copy of r3: no chapter text needed a fix).
No extras file written (both extras correct).

## Totals
| Checked | Correct | Minor | Wrong | Fixed |
|---|---|---|---|---|
| 134 cards + 2 extras | 134 (132 cards + 2 extras) | 2 | 0 | 2 |

## Fixes
1. **#34 Inability to patch, example (MINOR, misleading).**
   - Before: "A certified medical device cannot be updated without losing its regulatory approval, so it is placed on an isolated network."
   - After: "A hospital imaging system may only run the software build its vendor has validated, and the vendor has not yet validated a new OS patch, so the hospital puts the device on an isolated network and monitors it."
   - Why: the FDA states manufacturers can always update a device for cybersecurity and it does not typically need to review changes made only to strengthen cybersecurity. The real blocker is the vendor's validation, which is what the chapter's own practice question (line 93) already says.
   - Source: FDA, "The FDA's Role in Medical Device Cybersecurity: Dispelling Myths and Understanding Facts", https://www.fda.gov/media/123052/download
2. **#109 Warm site, keyPoints (MINOR, unsupported claim).**
   - Before: "...; most common compromise"
   - After: "...; a middle ground when a hot site costs too much and a cold site is too slow"
   - Why: no primary source ranks warm sites as the most common; NIST describes them only as partially equipped sites between cold and hot.
   - Source: NIST SP 800-34 Rev. 1, section 3.4.3 alternate sites, https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-34r1.pdf

Both fixes pass the own-words check (no 12-word run shared with the outline, via `dev/careers/verbatim.mjs`) and have no dashes or HTML.

## Extras
- Full, incremental and differential backups: CORRECT (definitions and restore chains standard; NIST SP 800-34r1).
- Fault tolerance vs high availability: CORRECT (NIST glossary, fault tolerance).

## Knowledge chapter
Read in full against the cards. The UTM row ("many filter only at Layer 4") matches the exam course notes; the
medical device practice question already names the vendor as the blocker. No change.

## Per-card verdicts
| # | Obj | Term | Verdict | Notes / source checked |
|---|---|---|---|---|
| 0 | 3.0 | SY0-701 Domain 3.0: Security Architecture (18%) | CORRECT |  |
| 1 | 3.1 | SY0-701 3.1: Compare and contrast security implications of different architecture models | CORRECT |  |
| 2 | 3.1 | Architecture and infrastructure concepts (SY0-701 3.1) | CORRECT |  |
| 3 | 3.1 | Cloud (architecture model) | CORRECT | CSA Top Threats 2024 ranks misconfiguration and inadequate change control first: confirmed (cloudsecurityalliance.org press release, 2024-08-06). Service and deployment models match NIST SP 800-145. |
| 4 | 3.1 | Responsibility matrix (cloud shared responsibility) | CORRECT |  |
| 5 | 3.1 | Hybrid cloud considerations | CORRECT |  |
| 6 | 3.1 | Third-party vendors (cloud consideration) | CORRECT |  |
| 7 | 3.1 | Infrastructure as code (IaC) | CORRECT |  |
| 8 | 3.1 | Serverless architecture | CORRECT |  |
| 9 | 3.1 | Microservices architecture | CORRECT |  |
| 10 | 3.1 | Network infrastructure (architecture model) | CORRECT |  |
| 11 | 3.1 | Physical isolation (network infrastructure) | CORRECT |  |
| 12 | 3.1 | Air-gapped network | CORRECT | Stuxnet crossing the gap on USB media: matches public analyses; worded as "believed". |
| 13 | 3.1 | Logical segmentation (network infrastructure) | CORRECT |  |
| 14 | 3.1 | Software-defined networking (SDN) | CORRECT |  |
| 15 | 3.1 | On-premises architecture | CORRECT |  |
| 16 | 3.1 | Centralized vs. decentralized architecture | CORRECT |  |
| 17 | 3.1 | Containerization | CORRECT | Namespaces and cgroups roles correct (Linux kernel docs). |
| 18 | 3.1 | Virtualization | CORRECT |  |
| 19 | 3.1 | Internet of Things (IoT) | CORRECT | Mirai 2016: cameras, DVRs, routers, default credentials, DDoS, peak in the hundreds of thousands (Antonakakis et al., USENIX Security 2017). |
| 20 | 3.1 | Industrial control systems (ICS)/supervisory control and data acquisition (SCADA) | CORRECT | NIST SP 800-82r3 is titled Guide to Operational Technology (OT) Security: the OT grouping is right. |
| 21 | 3.1 | Real-time operating system (RTOS) | CORRECT |  |
| 22 | 3.1 | Embedded systems | CORRECT |  |
| 23 | 3.1 | High availability (architecture concept) | CORRECT |  |
| 24 | 3.1 | Architecture considerations (SY0-701 3.1) | CORRECT |  |
| 25 | 3.1 | Availability (architecture consideration) | CORRECT |  |
| 26 | 3.1 | Resilience (architecture consideration) | CORRECT |  |
| 27 | 3.1 | Cost (architecture consideration) | CORRECT |  |
| 28 | 3.1 | Responsiveness (architecture consideration) | CORRECT |  |
| 29 | 3.1 | Scalability (architecture consideration) | CORRECT |  |
| 30 | 3.1 | Ease of deployment (architecture consideration) | CORRECT |  |
| 31 | 3.1 | Risk transference (architecture consideration) | CORRECT | 5.2 risk strategies transfer, accept, avoid, mitigate: matches the SY0-701 objectives. |
| 32 | 3.1 | Ease of recovery (architecture consideration) | CORRECT |  |
| 33 | 3.1 | Patch availability (architecture consideration) | CORRECT |  |
| 34 | 3.1 | Inability to patch (architecture consideration) | MINOR |  |
| 35 | 3.1 | Power (architecture consideration) | CORRECT |  |
| 36 | 3.1 | Compute (architecture consideration) | CORRECT |  |
| 37 | 3.2 | SY0-701 3.2: Given a scenario, apply security principles to secure enterprise infrastructure | CORRECT |  |
| 38 | 3.2 | Infrastructure considerations (SY0-701 3.2) | CORRECT |  |
| 39 | 3.2 | Device placement (network security) | CORRECT |  |
| 40 | 3.2 | Security zones | CORRECT |  |
| 41 | 3.2 | Attack surface (infrastructure) | CORRECT |  |
| 42 | 3.2 | Connectivity (infrastructure consideration) | CORRECT |  |
| 43 | 3.2 | Failure modes (security device) | CORRECT |  |
| 44 | 3.2 | Fail-open | CORRECT |  |
| 45 | 3.2 | Fail-closed | CORRECT |  |
| 46 | 3.2 | Device attribute (network security device) | CORRECT |  |
| 47 | 3.2 | Active vs. passive (device attribute) | CORRECT |  |
| 48 | 3.2 | Inline vs. tap/monitor (device attribute) | CORRECT |  |
| 49 | 3.2 | Network appliances (security) | CORRECT |  |
| 50 | 3.2 | Jump server | CORRECT |  |
| 51 | 3.2 | Proxy server | CORRECT |  |
| 52 | 3.2 | Intrusion prevention system (IPS)/intrusion detection system (IDS) | CORRECT |  |
| 53 | 3.2 | Load balancer | CORRECT |  |
| 54 | 3.2 | Sensors (network appliance) | CORRECT |  |
| 55 | 3.2 | Port security (network access control) | CORRECT |  |
| 56 | 3.2 | 802.1X (port-based network access control) | CORRECT | 802.1X roles and EAPoL: IEEE 802.1X. |
| 57 | 3.2 | Extensible Authentication Protocol (EAP) | CORRECT | EAP methods and PAC for EAP-FAST: RFC 4851 (EAP-FAST), RFC 5216 (EAP-TLS). |
| 58 | 3.2 | Firewall types (SY0-701) | CORRECT |  |
| 59 | 3.2 | Web application firewall (WAF) | CORRECT | PCI DSS v4.0 req 6.4.2 calls for an automated solution such as a WAF on public-facing web apps: wording "required or recommended" holds. |
| 60 | 3.2 | Unified threat management (UTM) | CORRECT | "Many UTMs filter only at Layer 4" checked: a video course SY0-701 3.2 Firewall Types says many of these devices only operate at layer 4. Exam sense kept. |
| 61 | 3.2 | Next-generation firewall (NGFW) | CORRECT | Alternate names for NGFW match the the video course SY0-701 3.2 notes, attributed to study guides. |
| 62 | 3.2 | Layer 4 vs. Layer 7 firewall | CORRECT |  |
| 63 | 3.2 | Secure communication/access (SY0-701 3.2) | CORRECT |  |
| 64 | 3.2 | Virtual private network (VPN) | CORRECT |  |
| 65 | 3.2 | Remote access (secure communication) | CORRECT |  |
| 66 | 3.2 | Tunneling (secure communication) | CORRECT |  |
| 67 | 3.2 | Transport Layer Security (TLS) tunnel/VPN | CORRECT | RFC 7568 (SSL 3.0 must not be used) and RFC 8996 (TLS 1.0 and 1.1 deprecated): correct. |
| 68 | 3.2 | Internet protocol security (IPSec) | CORRECT | AH/ESP, tunnel vs transport, IKE UDP 500 and 4500 with NAT traversal (RFC 4301, 4302, 4303, 7296, 3948), anti-replay in both: correct. |
| 69 | 3.2 | Software-defined wide area network (SD-WAN) | CORRECT |  |
| 70 | 3.2 | Secure access service edge (SASE) | CORRECT | SASE components and SSE as the security half: Gartner definition. |
| 71 | 3.2 | Selection of effective controls (enterprise infrastructure) | CORRECT |  |
| 72 | 3.3 | SY0-701 3.3: Compare and contrast concepts and strategies to protect data | CORRECT |  |
| 73 | 3.3 | Data types (SY0-701 3.3) | CORRECT |  |
| 74 | 3.3 | Regulated data | CORRECT |  |
| 75 | 3.3 | Trade secret (data type) | CORRECT |  |
| 76 | 3.3 | Intellectual property (data type) | CORRECT |  |
| 77 | 3.3 | Legal information (data type) | CORRECT |  |
| 78 | 3.3 | Financial information (data type) | CORRECT |  |
| 79 | 3.3 | Human-readable vs. non-human-readable data | CORRECT |  |
| 80 | 3.3 | Data classifications (SY0-701 3.3) | CORRECT | SY0-701 classification list and the three US classified levels (Executive Order 13526): correct. |
| 81 | 3.3 | Sensitive (data classification) | CORRECT |  |
| 82 | 3.3 | Confidential (data classification) | CORRECT |  |
| 83 | 3.3 | Public (data classification) | CORRECT |  |
| 84 | 3.3 | Restricted (data classification) | CORRECT |  |
| 85 | 3.3 | Private (data classification) | CORRECT | the video course groups private, classified and restricted: matches his SY0-701 3.3 notes. |
| 86 | 3.3 | Critical (data classification) | CORRECT |  |
| 87 | 3.3 | General data considerations (SY0-701 3.3) | CORRECT |  |
| 88 | 3.3 | Data states (at rest, in transit, in use) | CORRECT |  |
| 89 | 3.3 | Data at rest | CORRECT |  |
| 90 | 3.3 | Data in transit | CORRECT |  |
| 91 | 3.3 | Data in use | CORRECT |  |
| 92 | 3.3 | Data sovereignty | CORRECT |  |
| 93 | 3.3 | Geolocation (data consideration) | CORRECT |  |
| 94 | 3.3 | Methods to secure data (SY0-701 3.3) | CORRECT |  |
| 95 | 3.3 | Geographic restrictions (method to secure data) | CORRECT |  |
| 96 | 3.3 | Encryption (method to secure data) | CORRECT |  |
| 97 | 3.3 | Hashing (method to secure data) | CORRECT |  |
| 98 | 3.3 | Masking (method to secure data) | CORRECT |  |
| 99 | 3.3 | Tokenization (method to secure data) | CORRECT | Apple Pay style device account number plus per-transaction dynamic code: matches Apple Pay security docs; PCI tokenization guidance note kept. |
| 100 | 3.3 | Obfuscation (method to secure data) | CORRECT |  |
| 101 | 3.3 | Segmentation (method to secure data) | CORRECT |  |
| 102 | 3.3 | Permission restrictions (method to secure data) | CORRECT |  |
| 103 | 3.4 | SY0-701 3.4: Explain the importance of resilience and recovery in security architecture | CORRECT |  |
| 104 | 3.4 | High availability (resilience) | CORRECT |  |
| 105 | 3.4 | Load balancing vs. clustering | CORRECT |  |
| 106 | 3.4 | Site considerations (disaster recovery) | CORRECT |  |
| 107 | 3.4 | Hot site (site consideration) | CORRECT |  |
| 108 | 3.4 | Cold site (site consideration) | CORRECT |  |
| 109 | 3.4 | Warm site (site consideration) | MINOR |  |
| 110 | 3.4 | Geographic dispersion (site consideration) | CORRECT |  |
| 111 | 3.4 | Platform diversity (resilience) | CORRECT |  |
| 112 | 3.4 | Multi-cloud systems (resilience) | CORRECT |  |
| 113 | 3.4 | Continuity of operations (COOP) | CORRECT |  |
| 114 | 3.4 | Capacity planning (resilience) | CORRECT |  |
| 115 | 3.4 | People (capacity planning) | CORRECT |  |
| 116 | 3.4 | Technology (capacity planning) | CORRECT |  |
| 117 | 3.4 | Infrastructure (capacity planning) | CORRECT |  |
| 118 | 3.4 | Testing (resilience and recovery) | CORRECT |  |
| 119 | 3.4 | Tabletop exercises | CORRECT |  |
| 120 | 3.4 | Fail over (recovery testing) | CORRECT |  |
| 121 | 3.4 | Simulation (recovery testing) | CORRECT |  |
| 122 | 3.4 | Parallel processing (recovery testing) | CORRECT | Parallel processing in the video course sense plus the parallel test sense, both named, per the career guide pitfall. |
| 123 | 3.4 | Backups (resilience and recovery) | CORRECT |  |
| 124 | 3.4 | Onsite vs. offsite backups | CORRECT |  |
| 125 | 3.4 | Frequency (backups) | CORRECT |  |
| 126 | 3.4 | Encryption (backups) | CORRECT |  |
| 127 | 3.4 | Snapshots (backups) | CORRECT |  |
| 128 | 3.4 | Recovery (backup) | CORRECT |  |
| 129 | 3.4 | Replication (backups) | CORRECT |  |
| 130 | 3.4 | Journaling (backups) | CORRECT |  |
| 131 | 3.4 | Power: generators and UPS (resilience) | CORRECT |  |
| 132 | 3.4 | Generators (power resilience) | CORRECT |  |
| 133 | 3.4 | Uninterruptible power supply (UPS) | CORRECT | UPS types and double conversion: correct. |

## Still weak (not wrong)
- #60 UTM: "many UTMs filter only at Layer 4" is the exam course's sense; current vendor UTMs (Sophos, Fortinet) also do application control. Kept, as the guide says to keep the exam sense first.
- Sources were checked from known standards and a few live pages this session (CSA 2024 report, FDA fact sheet, the video course 3.2 notes); the remaining standards (RFCs, NIST) were checked against their known contents, not each re-fetched.
