# d3 knowledge chapter r7: source notes (2026-11-15)

Chapter: `knowledge/d3-knowledge.r7.md` (Domain 3: Security Architecture, objectives 3.1 to 3.4). Started from
`knowledge/d3-knowledge.r6.md`, `cards/d3-cards.r7.json` (134 cards) and `cards/d3-extras.r2.json` (2 cards).
All sources below were read this session (PDFs converted to text locally and searched). Nothing in the chapter quotes
them: an 8-word overlap check against the local text copies and `outline.md` finds only proper names.

## Sources
| Key | Title | URL |
|---|---|---|
| 800-145 | NIST SP 800-145, The NIST Definition of Cloud Computing | https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-145.pdf |
| MS-SRM | Microsoft Learn, Shared responsibility in the cloud | https://learn.microsoft.com/en-us/azure/security/fundamentals/shared-responsibility |
| CSA | Cloud Security Alliance, Top Threats to Cloud Computing 2024 (landing page list) | https://cloudsecurityalliance.org/artifacts/top-threats-to-cloud-computing-2024 |
| MS-IAC | Microsoft Learn, What is infrastructure as code (IaC)? | https://learn.microsoft.com/en-us/devops/deliver/what-is-infrastructure-as-code |
| AWS-L | AWS Lambda documentation, Security in AWS Lambda (shared responsibility) | https://docs.aws.amazon.com/whitepapers/latest/security-overview-aws-lambda/the-shared-responsibility-model.html |
| 800-204 | NIST SP 800-204, Security Strategies for Microservices-based Application Systems | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-204.pdf |
| AIRGAP | NIST CSRC glossary, air gap (CNSSI 4009-2022) | https://csrc.nist.gov/glossary/term/air_gap |
| 800-82 | NIST SP 800-82r3, Guide to Operational Technology (OT) Security | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-82r3.pdf |
| 7426 | RFC 7426, SDN: Layers and Architecture Terminology | https://www.rfc-editor.org/rfc/rfc7426 |
| 800-190 | NIST SP 800-190, Application Container Security Guide | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-190.pdf |
| 800-125 | NIST SP 800-125, Guide to Security for Full Virtualization Technologies | https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-125.pdf |
| MIRAI | CISA alert, Heightened DDoS Threat Posed by Mirai and Other Botnets | https://www.cisa.gov/news-events/alerts/2016/10/14/heightened-ddos-threat-posed-mirai-and-other-botnets |
| 8259 | NISTIR 8259, Foundational Cybersecurity Activities for IoT Device Manufacturers | https://nvlpubs.nist.gov/nistpubs/ir/2020/NIST.IR.8259.pdf |
| 800-41 | NIST SP 800-41r1, Guidelines on Firewalls and Firewall Policy | https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-41r1.pdf |
| 800-94 | NIST SP 800-94, Guide to Intrusion Detection and Prevention Systems | https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-94.pdf |
| FAILSEC | NIST CSRC glossary, fail secure and fail safe (CNSSI 4009-2022) | https://csrc.nist.gov/glossary/term/fail_secure , https://csrc.nist.gov/glossary/term/fail_safe |
| AXIS | Axis, Fail-safe vs fail-secure (door locks) | https://newsroom.axis.com/blog/fail-safe-vs-fail-secure |
| BASTION | NIST CSRC glossary, bastion host (CNSSI 4009-2022) | https://csrc.nist.gov/glossary/term/bastion_host |
| MS-PAI | Microsoft Learn, Securing privileged access intermediaries (jump servers, VPN, RDP, SSH) | https://learn.microsoft.com/en-us/security/privileged-access-workstations/privileged-access-intermediaries |
| NGX-RP | NGINX docs, Reverse proxy | https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/ |
| NGX-LB | NGINX docs, HTTP load balancing (methods, weights, health, persistence) | https://docs.nginx.com/nginx/admin-guide/load-balancer/http-load-balancer/ |
| 8021X | Wikipedia, IEEE 802.1X (roles, port states, EAPOL, MAB), plus a web search summary | https://en.wikipedia.org/wiki/IEEE_802.1X |
| 3748 | RFC 3748, Extensible Authentication Protocol | https://www.rfc-editor.org/rfc/rfc3748 |
| 5216 | RFC 5216, EAP-TLS | https://www.rfc-editor.org/rfc/rfc5216 |
| 4851 | RFC 4851, EAP-FAST | https://www.rfc-editor.org/rfc/rfc4851 |
| MS-EAP | Microsoft Learn, EAP for network access in Windows (PEAP, EAP-TTLS, WPA3 192-bit) | https://learn.microsoft.com/en-us/windows-server/networking/technologies/extensible-authentication-protocol/network-access |
| OWASP-WAF | OWASP community, Web Application Firewall | https://community.owasp.org/Web_Application_Firewall |
| 800-77 | NIST SP 800-77r1, Guide to IPsec VPNs | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-77r1.pdf |
| 7568 | RFC 7568, Deprecating SSLv3 | https://www.rfc-editor.org/rfc/rfc7568 |
| 8996 | RFC 8996, Deprecating TLS 1.0 and TLS 1.1 (local text copy searched) | https://www.rfc-editor.org/rfc/rfc8996 |
| SASE | Cisco, What is SASE? (SD-WAN plus SWG, CASB, FWaaS, ZTNA), plus a web search summary for SSE | https://www.cisco.com/c/en_in/products/security/what-is-sase-secure-access-service-edge.html |
| WIPO | WIPO, Trade secrets | https://www.wipo.int/en/web/trade-secrets |
| GDPR44 | GDPR Art. 44, general principle for transfers | https://gdpr-info.eu/art-44-gdpr/ |
| EO | Executive Order 13526, sec. 1.2 classification levels | https://www.archives.gov/isoo/policy-documents/cnsi-eo.html |
| MS-CC | Microsoft Learn, Azure confidential computing overview (data in use, TEE) | https://learn.microsoft.com/en-us/azure/confidential-computing/overview |
| MS-RISK | Microsoft Learn, Entra ID Protection risk detections (impossible and atypical travel, anonymous IP) | https://learn.microsoft.com/en-us/entra/id-protection/concept-identity-protection-risks |
| OWASP-PW | OWASP Password Storage Cheat Sheet | https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html |
| 6151 | RFC 6151, security considerations for MD5 | https://www.rfc-editor.org/rfc/rfc6151 |
| SHA1 | NIST news, NIST retires SHA-1 | https://www.nist.gov/news-events/news/2022/12/nist-retires-sha-1-cryptographic-algorithm |
| MS-DDM | Microsoft Learn, Dynamic data masking | https://learn.microsoft.com/en-us/sql/relational-databases/security/dynamic-data-masking |
| PCI-TOK | PCI SSC, Information Supplement: PCI DSS Tokenization Guidelines | https://listings.pcisecuritystandards.org/documents/Tokenization_Guidelines_Info_Supplement.pdf |
| APPLE | Apple Pay security and privacy overview | https://support.apple.com/en-us/101554 |
| STEG | NIST CSRC glossary, steganography | https://csrc.nist.gov/glossary/term/steganography |
| MS-FC | Microsoft Learn, Failover clustering overview (nodes, heartbeat, quorum, active and passive) | https://learn.microsoft.com/en-us/windows-server/failover-clustering/failover-clustering-overview |
| 800-34 | NIST SP 800-34r1, Contingency Planning Guide (sites, COOP, exercises, backup types, RTO/RPO, UPS and generators) | https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-34r1.pdf |
| MS-AZ | Microsoft Learn, What are availability zones? | https://learn.microsoft.com/en-us/azure/reliability/availability-zones-overview |
| 800-160 | NIST SP 800-160 Vol. 2 Rev. 1, Developing Cyber-Resilient Systems (diversity, redundancy) | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-160v2r1.pdf |
| RANSOM | CISA #StopRansomware Guide (offline, encrypted, tested backups, golden images, IaC, multi-cloud backups) | https://www.cisa.gov/stopransomware/ransomware-guide |
| CISA-BK | CISA/US-CERT, Data Backup Options (3-2-1 rule) | https://www.cisa.gov/sites/default/files/publications/data_backup_options.pdf |
| PTEST | Risky Thinking glossary, parallel test, plus a web search summary of DR testing guides | https://www.riskythinking.com/glossary/parallel_test |
| NBU | NetBackup documentation, About incremental backups (differential vs cumulative incremental) | https://docs.cohesity.com/docs/netbackup/11.0/18716246-168258057-0/v41779991-168258057 |
| MS-DIFF | Microsoft Learn, Differential backups (SQL Server) | https://learn.microsoft.com/en-us/sql/relational-databases/backup-restore/differential-backups-sql-server |
| MS-SR | Microsoft Learn, Storage Replica overview (synchronous, asynchronous, not a backup) | https://learn.microsoft.com/en-us/windows-server/storage/storage-replica/storage-replica-overview |
| EXT4 | Linux kernel docs, ext4 journal (jbd2) | https://www.kernel.org/doc/html/latest/filesystems/ext4/journal.html |
| MS-TLOG | Microsoft Learn, The transaction log (SQL Server) | https://learn.microsoft.com/en-us/sql/relational-databases/logs/the-transaction-log-sql-server |
| UPS | Schneider Electric White Paper 1 v10, The Different Types of UPS Systems | https://download.se.com/doc/SPD_SADE-5TNM3Y_EN/WP1_V10_EN.pdf |
| CARDS | Reviewed course cards `cards/d3-cards.r7.json`, `cards/d3-extras.r2.json` and their earlier source notes `reviews/d3-sweeps.md` | local |

## Sources per section
3.1
- Cloud computing service and deployment models: 800-145, CSA
- Cloud responsibility matrix: MS-SRM
- Hybrid cloud considerations: 800-145, MS-SRM, CARDS
- Third-party vendors in cloud architecture: CSA, MS-PAI, CARDS
- Infrastructure as code (IaC): MS-IAC, RANSOM, 800-190 (secrets outside images)
- Serverless computing: AWS-L, MS-SRM, CARDS
- Microservices architecture: 800-204
- Physical isolation and air-gapped networks: AIRGAP, 800-82, CARDS (Stuxnet, hedged as on the card)
- Logical segmentation: 800-82, 800-41 (deny by default), CARDS
- Software-defined networking (SDN): 800-82 (appendix E.1.4), 7426
- Physical isolation vs logical segmentation vs SDN: same as the three above
- On-premises architecture: MS-SRM, CARDS
- Centralized vs decentralized architecture: CARDS
- Containerization: 800-190
- Virtualization and hypervisors: 800-125
- Containers vs virtual machines vs serverless: 800-190, 800-125, AWS-L
- Internet of Things (IoT) devices: MIRAI, 8259
- Industrial control systems (ICS) and SCADA: 800-82
- Real-time operating system (RTOS): 800-82, CARDS
- Embedded systems: 800-82, 8259, CARDS
- Specialized systems compared: 800-82, MIRAI, CARDS
- High availability as an architecture concept: 800-34, MS-FC, CARDS
- Architecture considerations (availability, resilience, ease of recovery): 800-82, 800-160, CARDS
- Architecture considerations (cost, scalability, responsiveness, ease of deployment): 800-145, CARDS
- Architecture considerations: risk transference: MS-SRM, CARDS
- Patch availability vs inability to patch: 800-82, CARDS
- Architecture considerations: power and compute: 800-82, 800-34, CARDS
- On-premises vs cloud vs hybrid hosting: MS-SRM, 800-145, CSA

3.2
- Security zones and the screened subnet: 800-82, 800-41, 800-94, CARDS
- Device placement for security appliances: 800-94, 800-41, OWASP-WAF
- Attack surface reduction: MS-PAI, CARDS
- Connectivity in enterprise infrastructure: 800-77, CARDS
- Fail-open vs fail-closed: FAILSEC, AXIS, 800-41 (HA pairs), CARDS
- Active vs passive and inline vs tap/monitor: 800-94
- Jump server: BASTION, MS-PAI
- Proxy server: 800-41, NGX-RP, OWASP-WAF
- IDS and IPS: 800-94
- Load balancer: NGX-LB, MS-FC, CARDS
- Network sensors: 800-94, 800-82
- Port security with IEEE 802.1X: 8021X, 3748, MS-EAP
- EAP methods: 3748, 5216, 4851, MS-EAP
- Web application firewall (WAF): OWASP-WAF, 800-41
- Unified threat management (UTM): 800-41, CARDS
- Next-generation firewall (NGFW): 800-41 (application firewalls, deep packet inspection), CARDS
- Layer 4 vs Layer 7 firewalls: 800-41
- Firewall types compared; Network appliances compared: the sources of the sections they summarize
- Virtual private network (VPN): 800-77, MS-PAI
- Secure remote access: MS-PAI
- Tunneling with TLS: 7568, 8996, 800-77, CARDS
- IPSec: 800-77
- TLS VPN vs IPSec VPN: 800-77, 7568, 8996
- SD-WAN: SASE, 800-77, CARDS
- SASE and SSE: SASE
- SD-WAN vs SASE vs traditional VPN: SASE, 800-77, MS-PAI
- Selection of effective controls; Choosing an enterprise infrastructure control: the sources of the sections above, 800-82, CARDS

3.3
- Regulated data: GDPR44, PCI-TOK, CARDS (HIPAA, SOX named as on the cards)
- Trade secrets and intellectual property: WIPO
- Legal information and financial information: CARDS
- Human-readable vs non-human-readable data: CARDS
- Data classification labels: EO, CARDS
- Data types vs data classifications: CARDS
- Data states: MS-CC, 8259, CARDS
- Data in use and trusted execution environments: MS-CC, APPLE
- Data sovereignty: GDPR44, 800-145 (location chosen at region level), CISA-BK
- Geolocation and geographic restrictions: MS-RISK, CARDS
- Data sovereignty vs geolocation vs geographic restrictions: same as the two above
- Encryption as a method to secure data: CARDS, RANSOM
- Hashing as a method to secure data: OWASP-PW, 6151, SHA1
- Data masking: MS-DDM
- Tokenization: PCI-TOK, APPLE
- Obfuscation: STEG, CARDS
- Data segmentation: PCI-TOK, CARDS
- Permission restrictions: MS-DDM, CARDS
- Encryption vs hashing vs masking vs tokenization vs obfuscation; Choosing a method by goal: the sources above

3.4
- Load balancing vs clustering: MS-FC, NGX-LB
- Fault tolerance vs high availability: 800-82, CARDS (extras)
- Hot, warm and cold site: 800-34
- Geographic dispersion: 800-34, MS-AZ, MS-SR
- Platform diversity: 800-160
- Multi-cloud systems: RANSOM, CISA-BK, CARDS
- Continuity of operations (COOP): 800-34
- Capacity planning: 800-160 (surplus capacity), CARDS
- Recovery testing: tabletop and simulations: 800-34, CARDS
- Recovery testing: parallel processing and failover: PTEST, 800-34, CARDS
- Recovery tests compared: same as the two above
- Backups: onsite, offsite and 3-2-1: CISA-BK, RANSOM, 800-34
- Backup frequency and full, incremental, differential: 800-34, NBU, MS-DIFF
- Backup encryption and key handling: RANSOM, CARDS
- Snapshots: 800-125
- Backup recovery and restore testing: RANSOM, 800-34, MS-TLOG
- Replication: MS-SR
- Journaling: EXT4, MS-TLOG
- Backups vs snapshots vs replication vs journaling: the sources above
- UPS: UPS, 800-34
- Generators: 800-34, CARDS
- UPS vs generator vs redundant power; Resilience techniques matched to failures: the sources above

## Cards that look wrong or need a note
No card contradicts the chapter. Notes for reviewers:
- **Hot site (3.4):** the card says a hot site has current data kept by replication. SP 800-34 defines a hot site by
  ready hardware, infrastructure and staff, and reserves real-time data mirroring for a separate "mirrored site". The
  chapter keeps the card's meaning ("current or near current") and names the mirrored site as a variant.
- **IPSec (3.2):** the card presents AH as a normal part of the suite. SP 800-77r1 discourages AH (optional, often
  unavailable; ESP with null encryption preferred). The card is not wrong; the chapter adds the caution.
- **Continuity of operations (3.4):** the card treats COOP as general business continuity. SP 800-34 uses COOP for the
  US federal plan (essential functions at an alternate site, up to 30 days) and says other organizations use BCPs. The
  chapter gives both.
- **Tokenization (3.3):** unchanged from the earlier note: the device token is reused and the per-transaction code
  changes (APPLE); a grader should accept "one-time token" as taught.
- **WAF (3.2):** the card says "often required or recommended for PCI DSS". Only a search summary of PCI DSS v4
  requirement 6.4.2 was read (not the standard), so the chapter says card payment standards accept an automated web
  attack prevention solution, without a requirement number.

## Left uncertain or lightly sourced
- Stuxnet crossing an air gap on USB drives: kept hedged ("is believed"), from the card and the earlier pass's source;
  the dossier was not re-read this session.
- 802.1X details come from Wikipedia and a search summary, not the IEEE standard (paywalled).
- SSE as "the security half of SASE": Cisco page plus a search summary; no Gartner page was read.
- VLAN hopping, data loss prevention and optical character recognition, legal hold, HIPAA and SOX one-liners, PDUs and
  the scale-up/scale-out wording rest on the reviewed cards only.
- Mirai: the CISA alert gives 62 default credential pairs; the chapter says "about 60".
- "Parallel processing" as a recovery test has no primary standard definition; the chapter follows the card and gives
  the computing sense too.
- Cross references to other chapters use objective numbers (1.1, 1.4, 2.5, 4.6, 5.2, 5.3), not titles, because those
  r7 chapters did not exist yet. References to "the Reference chapter" match `d0-knowledge.r7.md` sections on ports,
  hash and cipher sizes, password hashing settings, availability percentages, backup types and recovery metrics.
- Exact numbers used in the chapter (TCP 443, UDP 500 and 4500, 30 days for COOP, 10 to 15 year OT lifetimes) were
  checked against 800-77, 800-34 and 800-82; a numbers reviewer should compare the ports with d0-reference.
