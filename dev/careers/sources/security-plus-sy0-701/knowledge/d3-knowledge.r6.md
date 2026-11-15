# 3.0 Security Architecture

Domain 3.0 is 18% of the SY0-701 exam. It asks how the way a system is built and hosted changes its security, how to lay out a secure enterprise network, how to protect data in every state, and how to keep systems running and bring them back after failure. Questions are mostly "compare and contrast" and short scenarios: you pick the model, device, placement, method or site that fits a stated priority.

## 3.1 Compare and contrast security implications of different architecture models


**What the exam expects:** for each architecture model, know who controls and patches what, where the attack surface grows, and which models are hard or impossible to patch. Then weigh the listed considerations to pick a model for a scenario.

### Architecture and infrastructure concepts

#### Cloud
Computing delivered on demand by a provider. Service models: infrastructure as a service (IaaS), platform as a service (PaaS), software as a service (SaaS). Deployment models: public, private, community, hybrid. Misconfiguration is a leading cloud risk (the Cloud Security Alliance ranked it first in its 2024 top threats).

- **Responsibility matrix:** shows which tasks belong to the provider and which to the customer. The provider always secures the physical facilities and hardware; the customer always owns its data, user accounts and access decisions. The customer's share shrinks from IaaS (customer patches the guest OS and apps) to PaaS (customer secures app code and data) to SaaS (customer manages users, data and settings).
- **Hybrid considerations:** mixing on-premises and cloud (or several clouds) means keeping identity, policy, monitoring and logging consistent across environments, and encrypting data moving between them. Inconsistency is the main source of gaps.
- **Third-party vendors:** cloud providers, SaaS apps and managed service providers become part of your risk. Vet them, write security terms into contracts (right to audit, SLAs), and limit and log their access.

#### Infrastructure as code (IaC)
Infrastructure defined in template or script files and deployed automatically. Gains: identical, repeatable, version-controlled builds and fast rebuilds. Risks: one flawed template spreads the flaw everywhere, and secrets hard-coded in templates leak. Scan and review templates like code.

#### Serverless
Code runs as event-triggered functions (function as a service); the provider runs all servers and operating systems. The customer secures code, function permissions, inputs and data. No OS patching for the customer, but over-permissioned functions and insecure event sources are common flaws.

#### Microservices
An app split into small independent services that talk over APIs. More resilient and scalable than a monolith (one service can fail or scale alone), but every API must be authenticated, authorized and monitored.

#### Network infrastructure
- **Physical isolation:** separate hardware, no shared switches or cabling. **Air-gapped** is the extreme: no connection to any other network. It stops network attacks but not removable media or insiders, and updates are manual. Stuxnet is believed to have crossed an air gap on infected USB drives.
- **Logical segmentation:** separation on shared hardware with VLANs, subnets, ACLs and firewall rules. Cheaper and flexible; a misconfiguration or VLAN hopping can defeat it.
- **Software-defined networking (SDN):** splits the control plane (decides forwarding) from the data plane (forwards packets), with a management plane for configuration. A central controller programs devices, giving consistent, automated policy. Protect the controller: it is a high-value target.

#### On-premises
Your hardware in your building. Full control of data location, configuration and patching; full responsibility for security, power, cooling, staff and upfront cost; slower to scale.

#### Centralized vs. decentralized
Centralized: one point of control, easy visibility and consistent policy, but a single point of failure and an attractive target. Decentralized: spread across nodes or sites, resilient, but harder to manage consistently.

#### Containerization
Apps packaged with their dependencies and run on a container engine that shares the host OS kernel. Lighter and faster than VMs, but isolation is weaker: a kernel flaw or container escape can reach other containers. Isolation comes from namespaces (what a container can see) and control groups (how much CPU and memory it can use). Use trusted, scanned images and minimal privileges.

#### Virtualization
A hypervisor runs many VMs, each with its own OS. Type 1 runs on bare metal; Type 2 on a host OS. Risks: VM escape, VM sprawl (forgotten, unpatched VMs) and resource reuse. Keep the hypervisor patched.

#### IoT
Connected everyday devices (cameras, thermostats, wearables). Weak default credentials, little patching, limited CPU. In 2016 the Mirai botnet took over hundreds of thousands of cameras, video recorders and routers just by trying factory default logins. Change defaults and put them on their own segment.

#### Industrial control systems (ICS)/supervisory control and data acquisition (SCADA)
Control physical processes (power, water, manufacturing) using PLCs, sensors and HMIs; SCADA spans large areas, with a central control server talking to remote terminal units (RTUs) or PLCs at field sites. NIST now groups these under operational technology (OT). Availability and safety come first, systems are often legacy and rarely patched, and attacks have physical effects. Protect with strict segmentation or air gaps and tight access.

#### Real-time operating system (RTOS)
An OS that guarantees responses within fixed time limits (deterministic). Used in vehicles, industrial gear, medical and military devices. Security features that add delay are avoided, and patching is hard, so isolate it.

#### Embedded systems
Single-purpose computers inside devices (printers, smart meters, medical pumps). Limited resources and rare firmware updates; long service lives. Segment and monitor.

#### High availability
Designing for near-constant uptime with redundancy so no single failure causes an outage. More nines cost more. Covered in depth in 3.4.

### Considerations
| Consideration | What it means | Models that do well / poorly |
|---|---|---|
| Availability | Up and usable when needed | Multi-zone cloud, clustered systems do well; single on-premises server poorly |
| Resilience | Keeps working through failures and recovers | Microservices, distributed designs do well |
| Cost | Upfront and ongoing spend | Cloud: pay as you go; on-premises: high capital cost |
| Responsiveness | How fast the system reacts to requests and load | Elastic cloud, load balancing help; heavy inspection adds latency |
| Scalability | Add or remove capacity (elasticity = automatic) | Cloud, containers, serverless excel; on-premises needs purchases |
| Ease of deployment | How quickly and simply it is set up | IaC, containers, managed services |
| Risk transference | Shifting some risk impact to a provider or insurer | Cloud and outsourcing; accountability for data never transfers |
| Ease of recovery | How quickly it can be restored | IaC, snapshots, cloud; legacy ICS is hard |
| Patch availability | Does the vendor release fixes at all | End-of-life products get none |
| Inability to patch | Fixes exist but cannot be applied | ICS, RTOS, embedded, medical, IoT; need compensating controls |
| Power | Electrical demand and dependable supply | On-premises must supply and back up power; small devices are power-limited |
| Compute | Available processing and memory | Constrained devices cannot run heavy security; cloud compute is elastic |

### Look-alikes
| Pair | Difference |
|---|---|
| Containers vs. VMs | Containers share the host kernel; VMs each have a full OS on a hypervisor (stronger isolation) |
| Physical isolation vs. logical segmentation | Separate hardware vs. separation on shared hardware |
| Patch availability vs. inability to patch | No fix exists vs. a fix exists but cannot be applied |
| Hybrid cloud vs. multi-cloud | On-premises plus cloud vs. more than one cloud provider |
| Serverless vs. microservices | Hosting model (no servers to manage) vs. app design (small services over APIs); they can be combined |

### Exam tips
- "Cannot be patched" in a scenario points to compensating controls: segmentation, air gap, monitoring.
- In any cloud model the customer is responsible for its data and identities. An exposed storage bucket is a customer misconfiguration.
- SDN keywords: control plane, data plane, central controller, programmable.
- RTOS keyword: deterministic timing.

### Check yourself
1. A medical device's vendor forbids updates that would void certification. Best protection? **Put it on an isolated segment with monitoring (compensating controls for inability to patch).**
2. In a SaaS CRM, who manages user permissions? **The customer.**
3. Which model shares the host kernel and is lighter than a VM? **Containers.**
4. A team wants identical, version-controlled test and production environments. **Infrastructure as code.**
5. Which network separates the control plane from the data plane? **SDN.**

## 3.2 Given a scenario, apply security principles to secure enterprise infrastructure


**What the exam expects:** given a network scenario, choose the right device, where it goes, how it attaches and how it fails, and the right secure connection method.

### Infrastructure considerations

- **Device placement:** put controls where they see the traffic they must control, usually at zone boundaries. Firewalls between zones, IPS inline at the edge, IDS sensors where traffic of interest flows, a WAF in front of web servers.
- **Security zones:** groups of systems by trust (untrusted internet, screened subnet for public-facing servers, trusted internal network). Traffic between zones is filtered. CompTIA's term for the DMZ is screened subnet.
- **Attack surface:** every port, service, app, account, device and connection an attacker could use. Shrink it by hardening, removing what is unused, segmenting and least privilege.
- **Connectivity:** how sites, users and clouds link together, and how those links are encrypted and made redundant.

#### Failure modes
| | Fail-open | Fail-closed |
|---|---|---|
| On failure | Traffic passes uninspected | All traffic blocked |
| Favors | Availability | Security (confidentiality, integrity) |
| Typical use | Inline IPS on a revenue-critical link | Firewall guarding highly sensitive systems |

Not the same as door locks: a fail-safe lock unlocks on power loss so people can get out, a fail-secure lock stays locked.

#### Device attribute
- **Active vs. passive:** active devices can act on traffic (block, reset); passive devices only observe and alert.
- **Inline vs. tap/monitor:** inline devices sit in the traffic path and can block, but add latency and need a failure mode. Tap/monitor devices get a copy of traffic (network tap or switch port mirror, also called SPAN) and cannot block.
- Classic pairing: IPS = active, inline. IDS = passive, tap/monitor.

#### Network appliances
- **Jump server:** a hardened, logged host that admins log into first to reach systems in a secure zone. Single controlled entry point for administration (also called jump box or bastion host).
- **Proxy server:** makes requests for clients. Forward proxy: users going out (URL filtering, caching, logging, hiding internal addresses). Reverse proxy: in front of internal servers for incoming requests (protection, load balancing, TLS offload). Can be explicit (configured on clients) or transparent.
- **Intrusion prevention system (IPS)/intrusion detection system (IDS):** detect attacks by signatures (known patterns; misses new attacks) or anomaly/behavior (finds new attacks; more false positives). IDS alerts; IPS blocks inline. Host-based versions (HIDS/HIPS) protect one system.
- **Load balancer:** spreads requests over a pool of servers and drops failed ones from the pool. Active/active (all serve) vs. active/passive (standby). Scheduling: round robin, weighted, least connections. Affinity keeps a user on one server. Can offload TLS.
- **Sensors:** collect traffic or event data at chosen points and send it to an IDS, SIEM or analysis platform. Placement decides visibility.

#### Port security
Protection of individual switch ports and wireless access point connections: only authenticated devices or users get access.
- **802.1X:** IEEE port-based network access control. The supplicant (client) authenticates through the authenticator (switch or access point) to the authentication server (usually RADIUS). Until it succeeds, only authentication traffic passes. Used on wired ports and WPA2/WPA3-Enterprise Wi-Fi.
- **Extensible Authentication Protocol (EAP):** the framework that carries the credentials inside 802.1X (EAP over LAN). Methods: EAP-TLS (certificates on both sides, strongest), PEAP and EAP-TTLS (server certificate, inner password protected in a TLS tunnel), EAP-FAST (builds its tunnel with a shared secret called a protected access credential, so clients need no certificate).
- Not part of this exam item, but common: switch MAC address limiting per port. It is weaker, since MACs are easy to spoof.

#### Firewall types
| Type | What it understands | Main use | Watch for |
|---|---|---|---|
| Web application firewall (WAF) | HTTP/HTTPS application traffic | Protect web apps from SQL injection, XSS; PCI DSS | Protects the app, not the whole network |
| Unified threat management (UTM) | Many functions in one box (firewall, IPS, antivirus, URL and spam filtering, VPN) | Small and medium sites | Single point of failure; slows when all features run; many filter only at Layer 4 |
| Next-generation firewall (NGFW) | Applications regardless of port, plus IPS, URL filtering, TLS inspection | Network edge in larger organizations | Also called application layer gateway, stateful multilayer inspection or deep packet inspection |
| Layer 4 | IP addresses, ports, TCP/UDP (often stateful) | Fast basic filtering | Cannot tell two apps on port 443 apart |
| Layer 7 | Application content | Granular app control | More processing |

### Secure communication/access
- **Virtual private network (VPN):** encrypted tunnel over an untrusted network. Site-to-site (network to network, often always-on between firewalls) or remote access (user to network). Full tunnel sends all traffic through the VPN; split tunnel sends only corporate traffic. Often terminated on a VPN concentrator.
- **Remote access:** VPN, remote desktop, SSH, jump servers. Require MFA, use encrypted protocols, never expose RDP directly to the internet, log sessions.
- **Tunneling:** wrapping one protocol in another, usually encrypted.
  - **Transport Layer Security (TLS):** a TLS VPN (often still called SSL VPN) usually runs over TCP 443, passes most firewalls, and works from a light client or a browser (clientless). SSL 3.0 must not be used and TLS 1.0 and 1.1 are deprecated; TLS 1.2 and 1.3 are current.
  - **Internet protocol security (IPSec):** secures IP at the network layer. Authentication Header (AH) gives integrity and authentication without encryption; Encapsulating Security Payload (ESP) adds encryption. Tunnel mode protects the whole original packet inside a new IP header (site-to-site); transport mode protects only the payload and keeps the original header. IKE negotiates the keys over UDP 500 (UDP 4500 through NAT). Both AH and ESP can reject replayed packets.
- **Software-defined wide area network (SD-WAN):** a WAN that uses several links (broadband, cellular, MPLS) under central software control and picks the best path, built for cloud apps. It is about connectivity, not a full security stack.
- **Secure access service edge (SASE):** SD-WAN plus cloud-delivered security (secure web gateway, cloud access security broker, zero trust network access, firewall as a service), applied wherever the user connects. The security half alone is called security service edge (SSE).

| Pair | Difference |
|---|---|
| TLS vs. IPSec tunnel | TLS: usually port 443, app/session level, browser-friendly, common for remote users. IPSec: network layer, protects all IP traffic, common for site-to-site |
| SD-WAN vs. SASE | SD-WAN = smart connectivity. SASE = SD-WAN plus security services delivered from the cloud |
| IPS vs. IDS | Inline and blocks vs. tap and alerts |
| WAF vs. NGFW | Web app protection vs. whole-network application-aware edge firewall |
| Forward vs. reverse proxy | Protects users going out vs. protects servers taking requests in |

### Selection of effective controls
Choose controls by risk, business needs, environment and cost, and layer them (defense in depth). When the ideal control is impossible (an unpatchable system), pick compensating controls such as segmentation and monitoring. Weigh performance and availability impact: an inline device that fails closed can cause an outage.

### Exam tips
- "Must not interrupt traffic if the device fails" means fail-open. "Must never let unchecked traffic through" means fail-closed.
- "Only alerts" or "mirror port" means IDS. "Blocks" means IPS, inline.
- "Protect the website from SQL injection" means WAF.
- "Admins must reach the secure zone through one hardened host" means jump server.
- "Users anywhere, security from the cloud" means SASE.

### Check yourself
1. A switch must deny network access to unknown laptops plugged into wall jacks. **802.1X with EAP (RADIUS as authentication server).**
2. A firewall must allow one video app but block another, both on port 443. **NGFW (Layer 7).**
3. An IPS crashes and the store must keep selling. Which failure mode? **Fail-open.**
4. Contractors need browser-only access to internal web apps. **TLS VPN (clientless).**
5. Which IPSec protocol encrypts the payload? **ESP (AH does not encrypt).**

## 3.3 Compare and contrast concepts and strategies to protect data


**What the exam expects:** recognize data types and classification labels, the three data states and their protections, sovereignty vs. geolocation, and pick the right protection method.

### Data types
- **Regulated:** governed by law or industry rules: PII (GDPR and others), PHI (HIPAA), payment card data (PCI DSS). Mishandling brings fines.
- **Trade secret:** confidential business information valuable because it is secret (formulas, processes, customer lists). Protected by secrecy and NDAs; lost once disclosed.
- **Intellectual property:** creations owned by a person or company (code, designs, inventions, brands), protected legally by copyright, trademark and patent.
- **Legal information:** contracts, court documents, attorney-client communications. Often privileged; may be under legal hold.
- **Financial information:** company financial records, payroll, bank and card details. Target for fraud; often regulated.
- **Human- and non-human-readable:** text people can read vs. data that needs a machine (barcodes, QR codes, images, binary or encoded files). Both can hold sensitive data; the second is harder for simple DLP rules to inspect. Encoding is not encryption.

### Data classifications
Each organization defines its own scheme; the data owner assigns the label and the label drives the controls. Typical meanings:

| Label | Meaning |
|---|---|
| Public | Free to share, no harm if disclosed (unclassified) |
| Private | Restricted access needing extra rights, sometimes an NDA; often personal data (Some study guides group private, classified and restricted) |
| Sensitive | Harmful if disclosed (PII, PHI, intellectual property) |
| Confidential | Very sensitive; access needs specific approval |
| Restricted | Tightest; only named people, often with an NDA |
| Critical | Must always be available and correct for operations to continue |

Note that "critical" is about availability and integrity, while the others are mostly about confidentiality. Government schemes differ: the US has three classified levels (top secret, secret, confidential), and anything else is unclassified.

### General data considerations
#### Data states
| State | Where | Protections | Typical threat |
|---|---|---|---|
| Data at rest | Disks, databases, backups, cloud storage | Full-disk, file, database encryption; permissions | Stolen laptop or drive |
| Data in transit (in motion) | Crossing networks | TLS, IPSec, VPN, SSH | Sniffing, on-path attacks |
| Data in use | RAM, CPU caches, registers | Secure enclaves, memory protection, access limits | RAM scraping on point-of-sale systems |

- **Data sovereignty:** data is subject to the laws of the country where it is stored or collected; some laws require it to stay in-country or in-region (GDPR transfer limits).
- **Geolocation:** finding where a device, user or data physically is (GPS, IP, Wi-Fi). Used for location-based access rules and impossible travel detection. IP location can be faked with a VPN.

### Methods to secure data
| Method | How it works | Reversible? | Typical use |
|---|---|---|---|
| Geographic restrictions | Allow or block by location (geofencing) | n/a | Block logins from countries with no staff |
| Encryption | Ciphertext with a key | Yes, with the key | Data at rest and in transit |
| Hashing | Fixed-length one-way digest | No | Password storage (with salt), integrity checks |
| Masking | Hide part of the value from view | Original stays elsewhere | ************4321 on receipts, test data |
| Tokenization | Swap in a random token, real value in a token vault | Only via the vault lookup | Card numbers, reduces PCI DSS scope |
| Obfuscation | Make data or code hard to understand | Depends | Code obfuscation; umbrella for masking, tokenization, steganography |
| Segmentation | Keep sensitive data in separate stores or segments | n/a | Isolate cardholder data |
| Permission restrictions | ACLs, file permissions, roles, least privilege | n/a | Only payroll reads salary data |

**Key distinctions:** encryption is reversible with a key; a hash cannot be reversed; a token has no mathematical link to the original (so it cannot be decrypted; PCI also describes tokens made by cryptographic functions, but the exam means the vault kind); a phone wallet pays with a device-specific token plus a one-transaction code, never the real card number; masking changes what is shown, not what is stored. Salting a hash defeats precomputed rainbow tables. Every hash has collisions in theory; MD5 and SHA-1 are weak because collisions can be found in practice.

### Exam tips
- "Store passwords" means salted hashing, never reversible encryption.
- "Merchant should never hold the real card number" means tokenization.
- "Show only the last four digits" means masking.
- "Data must stay in the EU" means data sovereignty.
- Data in use is the hardest state to protect.

### Check yourself
1. A POS terminal leaks card numbers from memory during processing. Which state? **Data in use.**
2. A breach of a merchant exposed only random values that map to cards in a provider's vault. Which method? **Tokenization.**
3. A company must keep citizens' records inside the country. Concept? **Data sovereignty.**
4. Which method lets you verify a file was not altered but cannot recover the file? **Hashing.**
5. Payroll data that must always be available for the business to run is labeled? **Critical.**

## 3.4 Explain the importance of resilience and recovery in security architecture


**What the exam expects:** explain why resilience matters and choose among HA techniques, recovery sites, test types, backup methods and power protections.

### High availability
Redundancy so one failure does not stop service.
- **Load balancing vs. clustering:** a load balancer is a front-end device that spreads requests over independent servers that do not know about each other. A cluster is a group of servers that cooperate as one logical system, aware of each other and often sharing storage, so one node takes over another's work. Both raise availability and capacity.

### Site considerations
| Site | Ready state | Recovery time | Cost |
|---|---|---|---|
| Hot | Fully equipped, current data (replicated) | Minutes to hours | Highest |
| Warm | Some hardware and connectivity, data not current | Hours to days | Medium |
| Cold | Space, power, connectivity only | Days to weeks | Lowest |

- **Geographic dispersion:** keep sites and backups far enough apart that one regional disaster cannot hit all of them; balance against latency and data sovereignty.

### Platform diversity
Different OSes, vendors or technologies for the same job, so one vulnerability or bug does not take everything down. Costs extra management and skills.

### Multi-cloud systems
Services from more than one cloud provider: survives one provider's outage and avoids lock-in, at the cost of more complex identity, policy and monitoring. Not the same as hybrid (on-premises plus cloud).

### Continuity of operations
Keep essential functions running during disruption, including manual alternate processes (paper forms, phone orders). Part of business continuity; disaster recovery is the IT restoration piece.

### Capacity planning
Enough resources for normal and peak demand and for disruptions.
- **People:** enough staff, cross-trained, with backups for key roles.
- **Technology:** apps, servers and services that scale (up or out, cloud elasticity).
- **Infrastructure:** bandwidth, power, cooling, space, cloud resources; physical upgrades take time.

### Testing
| Test | What happens | Risk to production |
|---|---|---|
| Tabletop exercises | People talk through a scenario in a meeting | None |
| Simulation | Realistic practice of a disaster acted out in a controlled way (for example recovering systems in an isolated environment against the RTO), or a simulated attack such as a fake phishing campaign | Very low |
| Parallel processing | The recovery system runs alongside production on the same real workload and its results are compared with production's; nothing is switched over. Some courses teach the computing sense here instead (several CPUs share the work; a failed one is removed while the rest continue) | Low (production stays in charge) |
| Fail over | Actually switch to the redundant system or site, then back | Highest |

### Backups
Follow the 3-2-1 idea (three copies, two media types, one offsite) and keep at least one offline or immutable copy against ransomware.
- **Onsite/offsite:** onsite restores fast but dies with the building; offsite survives site disasters but restores slower. Use both.
- **Frequency:** how often backups run; it decides how much data can be lost, so it is chosen to meet the recovery point objective (RPO). Full, incremental and differential schedules balance time and storage.
- **Encryption:** backups hold everything, so encrypt them; keep the keys safe and separate, since a lost key means a useless backup.
- **Snapshots:** point-in-time copies, common for VMs and storage, quick to take and roll back. Often depend on the original storage, so they do not replace separate backups.
- **Recovery:** restoring to working state. Test restores regularly; a backup is only proven when a restore succeeds within the recovery time objective (RTO).
- **Replication:** continuous or frequent copying to another system or site for near-current data and fast failover. It copies deletions and corruption too, so keep point-in-time backups as well.
- **Journaling:** each change is written to a journal so data can be rebuilt to a consistent point after a crash or rolled to a chosen time.

### Power
- **Generators:** fuel-driven, run for hours or days as long as fuel lasts, but need time to start.
- **Uninterruptible power supply (UPS):** batteries give instant power for minutes, enough for a clean shutdown or for the generator to start; also filters surges and sags. Types: offline/standby (switches to battery when power fails), line-interactive (can boost low voltage during brownouts), online (double-conversion: the load always runs through the battery and inverter side, so there is no switchover gap).
- Add redundancy with dual power supplies, multiple feeds and PDUs.

### Look-alikes
| Pair | Difference |
|---|---|
| Load balancing vs. clustering | Independent servers behind a distributor vs. cooperating nodes acting as one |
| Hot vs. warm vs. cold | Ready now with current data vs. partly ready vs. empty shell |
| Replication vs. backup | Near-real-time copy (copies mistakes too) vs. point-in-time copy you can roll back to |
| Snapshot vs. full backup | Quick point-in-time image often tied to the original storage vs. independent complete copy |
| UPS vs. generator | Instant, short-term vs. delayed start, long-term |
| Multi-cloud vs. hybrid | Several cloud providers vs. on-premises plus cloud |
| Tabletop vs. failover | Discussion only vs. real switchover |

### Exam tips
- "Cheapest way to test the plan without touching systems" means tabletop.
- "Recover within minutes with current data" means hot site with replication.
- "Power for the seconds before the generator starts" means UPS.
- "Ransomware encrypted the replica too" shows why replication is not a backup.
- RPO ties to backup frequency; RTO ties to how fast recovery and site readiness are.

### Check yourself
1. Two database servers share storage and one takes over when the other fails. Load balancing or clustering? **Clustering.**
2. A firm can tolerate a week of downtime and has little budget. Which site? **Cold site.**
3. For a week the recovery site processes copies of the live transactions next to the main site, and the team compares both sets of results; nothing is switched over. Which testing item? **Parallel processing.**
4. An admin wants a quick rollback point before patching a VM. **Snapshot.**
5. What keeps servers running during a two-day grid outage? **Generator (with a UPS to bridge the start).**
