# Domain 3: Security Architecture
Checked as of 2026-11 for SY0-701.

## 3.1 How the way a system is built and hosted changes its security
Depth asked: compare and contrast. A good answer names who controls and patches each layer in a model, where that model adds or removes attack surface, and which listed consideration (cost, patching, availability and so on) makes one model a better fit than another.

### Cloud computing service and deployment models (IaaS, PaaS, SaaS)
Cloud computing is on-demand access, over a network, to a shared pool of computing resources that a provider can hand out and take back quickly with little human effort. It solves the problem of buying and running your own hardware for every workload. It sits in the architecture as a hosting choice, and its main security effect is that control and responsibility are split between provider and customer.

How the models divide control:
1. Infrastructure as a service (IaaS): the customer rents virtual machines, storage and networks and controls the operating system, storage and applications, plus some network pieces such as host firewalls. The provider runs the physical layer.
2. Platform as a service (PaaS): the customer deploys its own code onto a platform the provider runs. The customer controls the application and some hosting settings, not the operating system.
3. Software as a service (SaaS): the customer uses a finished application through a browser or an application programming interface (API). The customer controls only limited user settings, its data and who has access.

Deployment models: private (one organization uses it, on or off premises), community (several organizations with shared concerns such as the same regulations), public (open to anyone, on the provider's premises), hybrid (two or more of these kept distinct but linked so data and applications can move between them). The defining traits of cloud are self-service, broad network access, pooled multi-tenant resources, rapid elasticity and metered use.

**Why it matters:** misconfiguration is the leading cloud risk. In a 2024 industry ranking of cloud threats, poor configuration and weak change control came first, ahead of weak identity and access control and insecure interfaces and APIs. A public storage bucket leaks data no matter how well the provider runs its data centers.

**Common confusions:** Hybrid cloud mixes deployment types (for example private plus public), while multi-cloud means using more than one provider; a company can be both. Resource pooling means your workload shares hardware with other tenants, which is why isolation between tenants is a provider duty you cannot inspect directly.

**Scenario:** A team wants to run its own web code without patching any operating system, but it still needs to choose its runtime and scale settings. The fit is PaaS. IaaS is the closest wrong answer: it works, but the team would then own operating system patching, which the clue says it wants to avoid.

### Cloud responsibility matrix (shared responsibility model)
A responsibility matrix is a table that states, for each layer of a cloud service, whether the provider, the customer, or both are responsible for securing it. It solves the "I thought they did that" gap that causes many cloud breaches. It is a managerial tool backed by the contract, and it covers all three legs of confidentiality, integrity and availability.

How the split moves (a typical provider's matrix):
| Layer | On-premises | infrastructure as a service (IaaS) | platform as a service (PaaS) | software as a service (SaaS) |
|---|---|---|---|---|
| Data, configuration settings, identities and users | Customer | Customer | Customer | Customer |
| Client devices | Customer | Customer | Customer | Shared |
| Applications | Customer | Customer | Shared | Shared |
| Network controls | Customer | Customer | Shared | Provider |
| Operating system | Customer | Customer | Provider | Provider |
| Physical hosts, network and data center | Customer | Provider | Provider | Provider |

Read it from the bottom up: the provider always takes the physical layers once you leave on-premises, and the customer always keeps its data, its accounts, its access decisions and its configuration choices. The customer's share shrinks from IaaS to PaaS to SaaS, but it never reaches zero.

**Why it matters:** auditors and regulators hold the data owner accountable. If an administrator grants public read access to a storage container, the matrix shows the setting was the customer's job, so the breach and its fines are the customer's.

**Common confusions:** "The provider secures the cloud" is only half the story: the provider secures the cloud itself, while the customer secures what it puts in the cloud. Shared rows are not "nobody's": each party owns a named part, such as the provider patching the application platform while the customer secures its code and access rules. Encryption decisions about customer data stay with the customer even when the provider offers the encryption feature.

**Scenario:** A company on a SaaS email service discovers that a former employee still has a working account. Responsibility lies with the customer, because accounts and access are always the customer's. Blaming the provider is the closest wrong answer, since the provider runs the platform but does not decide who keeps access.

Worked example: an IaaS virtual machine runs an unpatched operating system and is compromised. Matrix row "Operating system, IaaS" reads Customer, so the patching failure was the customer's.

### Hybrid cloud considerations
A hybrid environment joins on-premises systems with one or more cloud environments so workloads and data can move between them. It solves needs like keeping some data in house while using cloud scale for the rest. Its security challenge is consistency: two or more environments must behave as one security domain.

What to plan, in order:
1. Identity first: one identity source or a federation between them, so a user disabled on-premises is disabled in the cloud too. Separate identity stores drift apart.
2. Consistent policy: the same configuration baselines, access rules and data classification labels on both sides.
3. Secure links: encrypt traffic between sites and clouds, usually with a site-to-site virtual private network (VPN) or a private dedicated circuit that is itself encrypted.
4. Unified visibility: send logs from every environment to one monitoring platform, because each environment has its own native tools and log formats.
5. Data placement: know which data may live where, which ties to data sovereignty (see `### Data sovereignty (laws that follow data location)`).

**Why it matters:** gaps appear at the seams. An attacker who finds a cloud workload with weaker rules than the on-premises network can pivot back through the trusted link.

**Common confusions:** Hybrid is about mixing environment types, not about having two providers (that is multi-cloud, see `### Multi-cloud systems (resilience)`). A hybrid design does not reduce responsibility: the on-premises half is still entirely yours.

**Scenario:** After moving half its servers to a cloud provider, a company finds that its intrusion alerts cover only the data center. The missing control is centralized logging and monitoring across both environments. Adding a second firewall at the data center is the closest wrong answer: it strengthens one side but leaves the cloud half unwatched.

### Third-party vendors in cloud architecture
Third-party vendors here are outside companies whose services become part of your system: the cloud provider, software as a service (SaaS) applications, managed service providers that administer your systems, and integrators. Using them solves skill and scale gaps, but it imports their weaknesses, so their security becomes part of your risk.

How to manage them:
1. Assess before signing: security questionnaires, independent audit reports and certifications.
2. Write security into the contract: right to audit, service level agreements (SLAs) for uptime and breach notification, data handling and return of data at exit.
3. Grant least privilege: vendor accounts get only the access their task needs, ideally time-limited.
4. Monitor and log vendor activity like any privileged access.
5. Plan the exit: how data comes back and how access is removed when the relationship ends.

**Why it matters:** a managed service provider with remote access to many customers is a single entry point to all of them, so one vendor compromise can spread to every client. Weak vendor reliance ranks among the leading cloud threats in industry surveys.

**Common confusions:** Outsourcing a task moves operational work, not accountability for your data. Vendor risk is not only about the main cloud provider; small SaaS add-ons that connect to your email or files carry the same risk. The full vendor management process (assessment methods, agreement types) belongs to objective 5.3.

**Scenario:** A managed service provider's remote management tool is abused to push ransomware to its clients. The control that would most limit the damage is least-privilege, monitored vendor access with strong authentication. Choosing a different cloud region is the closest wrong answer, since location does nothing about a trusted vendor's access path.

### Infrastructure as code (IaC)
Infrastructure as code means describing servers, networks, load balancers and their settings in version-controlled definition files, then letting tools build the environment from those files. It solves configuration drift: without it, each hand-built environment becomes a unique "snowflake" nobody can reproduce. It is a technical and operational practice that mainly protects integrity (known, reviewed configuration) and availability (fast rebuilds).

How it works:
1. Engineers write a definition file, preferably declarative: it states the desired end state (which servers, which ports open) rather than step-by-step commands.
2. The file goes through version control and review, like application code, so every change has an author and a history.
3. Automated scanning checks the file for risky settings (open storage, missing encryption, secrets) before deployment. Scanning after deployment is the common wrong order: the flaw is already live.
4. A pipeline deploys it. Deployment is idempotent: running it again produces the same environment whatever the starting state.
5. Changes are made by editing the file and redeploying, never by hand on the live system, so the file stays the truth.

**Why it matters:** recovery becomes fast and predictable, since a destroyed environment can be rebuilt from the files; ransomware guidance recommends keeping IaC templates versioned and a copy offline for this reason. The flip side is scale: one bad template line deploys the same hole to every environment at once.

**Common confusions:** IaC is not the same as containers; IaC builds the infrastructure, containers package applications that run on it. Secrets must never sit in the template files; they belong in a secrets manager that injects them at deploy time. A manual hotfix on a live server breaks IaC, because the next deployment silently undoes it or the environments drift apart.

**Scenario:** Test and production behave differently because administrators tuned production by hand over two years. The fix is to define both environments as code from one reviewed template. Taking more frequent snapshots is the closest wrong answer: snapshots preserve the drift instead of removing it.

Worked example of a template finding: a scanner flags `storage_bucket: public_read = true` in a pull request, and the change is blocked before any data is exposed.

### Serverless computing (function as a service, FaaS)
Serverless is a cloud model where the customer uploads code as small functions that run only when an event triggers them (a web request, a file upload, a queue message), and the provider runs and scales every server, operating system and runtime underneath. It removes server management from the customer. Security responsibility shifts almost entirely to the code, its permissions and its data.

How it works and where to secure it:
1. An event source (an application programming interface (API) gateway, a storage bucket, a message queue) triggers the function. Secure the event source, because anyone who can create events can run your code.
2. The function runs in a short-lived execution environment managed by the provider, then disappears. There is no long-running server to patch, but also little place for traditional agents.
3. The function acts with an identity and permissions. Give each function only the permissions its job needs; one over-permissioned function becomes a key to the whole account.
4. Validate every input inside the function, since events can carry attacker-controlled data.
5. Log every invocation to the provider's monitoring service, because there is no host log to collect.

**Why it matters:** costs follow use and scaling is automatic, but a single injection flaw combined with broad permissions can expose every resource the function can reach.

**Common confusions:** Serverless does not mean there are no servers; it means the customer never sees or manages them. Serverless is a hosting model, while microservices is a way to design an application; a microservice can run as serverless functions. In the shared responsibility split, serverless behaves like platform as a service (PaaS): the provider owns the operating system, the customer owns code, configuration, identities and data.

**Scenario:** An attacker exploits an input flaw in an image-resizing function and then reads every customer database in the account. The control that would have limited the damage is least-privilege permissions for the function. Patching the operating system is the closest wrong answer, because in serverless the provider owns the operating system.

### Microservices architecture (versus monolithic applications)
A microservices architecture builds one application from many small, loosely coupled services, each doing one business function and talking to the others over network application programming interfaces (APIs). A monolithic application packages all functions into one deployable unit instead. Microservices solve slow releases and all-or-nothing failures, at the price of many more network conversations to secure.

How it works:
1. Each service has its own small codebase and is deployed, scaled and updated on its own.
2. Services call each other over the network, so every call should be authenticated and authorized (service identities, mutual Transport Layer Security (TLS) or signed tokens).
3. An API gateway gives outside clients one entry point and handles authentication, routing and request filtering.
4. A service mesh can add encryption and access policy between services without changing each service's code.
5. Resilience features limit damage: a circuit breaker stops sending requests to a failing instance so the failure does not cascade, load balancing spreads work across instances, and rate limiting blocks floods.

**Why it matters:** one failing service no longer takes the whole application down, and teams ship faster. But every service and connection is a new attack surface, and network security, reliability and latency all matter because each transaction crosses the network.

**Common confusions:** Microservices are more resilient than a monolith but not more secure by default; the attack surface grows. Microservices describe application design; containers and serverless describe where the services run. A flaw in a monolith exposes everything at once, while a flaw in one microservice can be contained if service-to-service access is restricted.

**Scenario:** An online store's payment service crashes, and the catalog and search still work. The design that made this possible is microservices with failure isolation. Clustering is the closest wrong answer: a cluster keeps one service available by moving it between nodes, but it does not split an application into independent parts.

### Physical isolation and air-gapped networks
Physical isolation keeps networks or devices on entirely separate hardware, with no shared switches, cables or wireless links, so traffic simply has no path between them. An air gap is the extreme form: a system with no physical or automated logical connection to any other network, where data crosses only when a person carries it, usually on removable media. It is a technical preventive control that mainly protects confidentiality and integrity.

How it is used:
1. Decide what must never be reachable from outside (classified networks, safety systems, critical industrial controllers).
2. Build it on separate hardware with no routes, no wireless and no remote management links out.
3. Control the human crossing point instead: scan and log removable media, limit who may carry data in or out, and consider one-way transfer devices (data diodes) where data must only flow out.
4. Plan manual patching and updates, since nothing can download them.

**Why it matters:** it defeats remote network attacks completely, which is why safety systems in plants were historically designed stand-alone and air-gapped. But it is costly, slows updates, and creates false confidence: current guidance for industrial systems warns that air gaps alone are no longer enough as these systems get connected to business networks.

**Common confusions:** An air gap does not stop removable media or insiders. The best-known example is the Stuxnet worm, which is believed to have reached its isolated targets on infected USB drives. Physical isolation is stronger than logical segmentation because there is no shared device to misconfigure, but it is also less flexible and more expensive.

**Scenario:** A defense contractor must guarantee that a design network can never be reached from the internet, even if a firewall rule is wrong. The answer is an air-gapped network. A screened subnet is the closest wrong answer: it is still connected through firewalls, so one mistaken rule could open a path.

### Logical segmentation (VLANs, subnets and access control lists)
Logical segmentation divides one physical network into separate logical networks, using virtual LANs (VLANs), IP subnets, access control lists (ACLs) on routers and firewall rules, so devices sharing hardware cannot talk freely. It solves the cost and rigidity of separate hardware for every zone. It is a technical preventive control that limits lateral movement and shrinks the blast radius of a breach.

How it works:
1. Group systems by trust, function or sensitivity (users, servers, payment systems, guests, Internet of Things (IoT)).
2. Put each group in its own VLAN and subnet.
3. Route between groups only through a firewall or ACL that allows named flows and denies everything else (deny by default).
4. Monitor the boundaries, since traffic crossing them is where attacks show.

**Why it matters:** a malware infection on a guest laptop stays in the guest segment instead of reaching the payroll servers, and segmentation can shrink the scope of compliance audits such as those for card payment data.

**Common confusions:** Logical segmentation shares hardware, so a switch misconfiguration or a VLAN hopping attack can defeat it; physical isolation has no such shared point. A VLAN by itself separates traffic into its own broadcast domain but does not filter traffic between VLANs; the filtering happens where the VLANs are routed. Segmentation as a mitigation technique is covered again in objective 2.5.

**Scenario:** A hospital wants its infusion pumps unable to reach staff workstations but cannot afford a second cabling plant. The answer is logical segmentation: a dedicated VLAN for the pumps with firewall rules between it and the rest. An air gap is the closest wrong answer, since it needs separate hardware and would cut the pumps off from the systems that legitimately manage them.

Worked example of a boundary rule set: first rule, allow the pump subnet 10.20.0.0/24 to the pump manager at 10.5.1.10 on its management port; second rule, deny the pump subnet to anything else. The first matching rule wins, so the narrow allow sits above the broad deny.

### Software-defined networking (SDN): control, data and management planes
Software-defined networking separates the decision about where traffic should go from the act of forwarding it. Switches keep only forwarding, while a central controller decides and programs every device through software. It solves the problem of configuring many devices one by one, and it lets security policy be applied consistently and changed quickly.

The planes:
1. Data plane (forwarding plane): the switches move, drop or modify packets according to the tables they were given. This stays on each device.
2. Control plane: decides how traffic should be forwarded and pushes those decisions down. In SDN it moves from each switch to the central controller.
3. Management plane: monitors, configures and maintains devices with a network-wide view, on a slower timescale than the control plane.
Some models also name an application plane on top, where programs request network behavior.

How it helps security:
1. Policy is written once at the controller and applied everywhere, so devices do not drift.
2. The network can be reconfigured on demand, for example to isolate an infected device or copy its traffic to a monitoring tool within seconds.

**Why it matters:** faster containment and consistent rules. The cost is concentration: the controller becomes a high-value target and a possible single point of failure, so it needs strong access control, redundancy and its own segmented management network.

**Common confusions:** SDN is not the same as a software-defined wide area network (SD-WAN): SDN is a network design principle inside a site or data center, while SD-WAN applies software control to wide-area links between sites (see `### Software-defined wide area network (SD-WAN)`). Separating the planes does not remove the data plane; packets still flow through physical or virtual switches.

**Scenario:** A security team wants to quarantine any device that trips an alert, across 400 switches, within seconds and without logging in to each one. The architecture that enables this is SDN with a central controller. Logical segmentation alone is the closest wrong answer: it defines the zones, but changing them on 400 devices by hand is too slow.

### Physical isolation vs logical segmentation vs SDN (comparison)
These three network infrastructure options answer the same question, how to keep traffic apart, at different points on the cost, strength and flexibility scale. Software-defined networking (SDN) is included because it changes how segmentation is managed.

| Option | How separation is achieved | Strength | Flexibility and cost | Main weakness |
|---|---|---|---|---|
| Physical isolation (air gap at the extreme) | Separate hardware, no path | Strongest | Least flexible, highest cost | Removable media and insiders; manual updates |
| Logical segmentation | virtual LANs (VLANs), subnets, access control lists (ACLs), firewall rules on shared hardware | Good | Flexible, cheap | Misconfiguration, VLAN hopping |
| Software-defined networking | Central controller programs forwarding everywhere | Depends on the policy it pushes | Most agile, fast reconfiguration | Controller is a high-value target |

How to choose: when the requirement says "must never be reachable even if a rule is wrong", choose physical isolation. When the requirement is separation at low cost on existing switches, choose logical segmentation. When the requirement is central, automated and fast policy change across many devices, choose SDN.

**Why it matters:** picking the strongest option everywhere wastes money and slows operations, while picking the cheapest everywhere leaves critical systems one misconfiguration away from exposure.

**Common confusions:** SDN is not a fourth level of isolation strength; it is a way to manage segmentation centrally. The options combine well: a plant can air-gap its safety system, segment its office network with VLANs and manage its data center with SDN.

**Scenario:** A utility keeps its safety system on hardware with no connection at all, and puts its office printers in their own VLAN. The first is physical isolation and the second is logical segmentation. Calling both "segmentation" is the closest wrong answer, because only the second shares hardware.

### On-premises architecture
On-premises means the organization runs its systems on hardware it owns, in facilities it controls. It solves needs for full control over data location, hardware and configuration. Its security effect is total ownership: every layer of the responsibility matrix, from the building to the application, is the organization's job.

What the organization must provide itself:
1. Physical security: locks, badges, cameras, environmental controls.
2. Power and cooling, including backup power (see `### Uninterruptible power supply (UPS)` and `### Generators for backup power`).
3. Hardware lifecycle: buying, patching firmware, replacing equipment before it falls out of vendor support.
4. Staff with the skills to run and secure it all, around the clock if needed.
5. Its own disaster recovery site and backups.

**Why it matters:** control is high but so are capital cost and effort, and gaps are common where staff and budgets are thin: delayed patching, weak server-room security, no intrusion monitoring, outdated hardware and untested or onsite-only backups are typical unmet duties.

**Common confusions:** On-premises is not automatically more secure than cloud; it is more controllable. A private cloud can be on-premises, so "private" and "on-premises" are not synonyms. Scaling on-premises means buying hardware, which takes weeks, while cloud capacity arrives in minutes.

**Scenario:** A regulator requires that a defense agency keep full physical custody of certain servers, with its own staff holding the only keys. On-premises hosting fits. A public cloud region in the same country is the closest wrong answer, because the provider's staff, not the agency's, would control the physical hardware.

### Centralized vs decentralized architecture
A centralized architecture puts control, data or processing in one place (one data center, one identity server, one log store, one management console). A decentralized architecture spreads them across many sites or nodes that can work on their own. The choice trades easier control against resilience.

| Aspect | Centralized | Decentralized |
|---|---|---|
| Visibility and consistent policy | Easy: one place to watch and configure | Harder: many places to keep in line |
| Single point of failure | Yes, unless made redundant | Avoided: other nodes keep working |
| Attractiveness to attackers | High: one target holds everything | Lower per node, but more nodes to defend |
| Management effort | Lower | Higher |

How to decide:
1. Ask what happens if the central piece fails or is compromised. If the answer is "everything stops", add redundancy or decentralize that function.
2. Ask whether consistency matters more than survival. Security policy, logging and identity usually benefit from central control; customer-facing services usually benefit from being spread out.

**Why it matters:** a single central identity server that goes down can stop every login in the company, while a fully decentralized setup can drift into inconsistent rules nobody reviews.

**Common confusions:** Centralized management does not require centralized execution: a central console can manage policy pushed to decentralized nodes. Decentralized is not the same as distributed copies of one system for high availability; high availability keeps one service up, decentralization spreads authority.

**Scenario:** A retailer wants every store to keep selling when the head office link fails, while still getting security policies from headquarters. The fit is decentralized processing at the stores with centralized policy management. Moving all sales processing to one central data center is the closest wrong answer, since a link failure would stop every store.

### Containerization (containers and container images)
Containerization packages an application with its libraries and settings into an image, which a container engine (for example Docker) runs as an isolated process on a shared host operating system kernel. It solves "it worked on my machine" and slow deployment, because the same immutable image runs in test and production. Security-wise it gives software-level isolation that is real but weaker than a virtual machine's.

How isolation works and where it breaks:
1. Namespaces limit what a container can see (its own processes, file system view, network interfaces).
2. Control groups (cgroups) limit how much central processing unit (CPU) and memory it can use, so one container cannot starve others.
3. All containers on a host share one kernel. A kernel flaw, or a flaw in the container runtime that allows a container escape, can let one container reach others and the host.
4. Containers run with configurable privileges. A container run in privileged mode, or as root, can affect the host far more easily.

How to secure them:
1. Use images from trusted sources and scan them for known vulnerabilities and malware before use.
2. Keep secrets out of images; inject them at run time from the orchestrator's secret store, since anyone with the image can read whatever was baked in.
3. Run containers as non-privileged users, never in privileged mode without need, and never with Secure Shell (SSH) or remote shells inside; manage them through the runtime and orchestrator.
4. Prefer a minimal, container-specific host operating system, which has far less to attack than a general-purpose one.
5. Group containers of the same sensitivity on the same hosts, so a public web app does not share a kernel with an internal finance app.

**Why it matters:** containers start fast and scale well, but a carelessly configured host lets containers interact with each other and the host much more directly than VMs on a hypervisor could.

**Common confusions:** Containers do not each contain an operating system; they share the host kernel. Patching a running container is the wrong habit: you rebuild the image and redeploy, because containers are meant to be immutable. Isolation through namespaces is about visibility, while cgroups are about resource limits.

**Scenario:** A team must run a public web front end and an internal payroll engine as containers on shared infrastructure. The best practice is to place them on separate hosts by sensitivity. Simply putting them in separate namespaces on the same host is the closest wrong answer, because a kernel or runtime escape would still bridge them.

### Virtualization and hypervisors (Type 1, Type 2, VM escape, VM sprawl)
Virtualization runs several virtual machines (VMs), each with its own full guest operating system, on one physical host through a hypervisor that gives each VM virtual hardware. It solves wasted hardware and slow provisioning. Security-wise the hypervisor is the boundary between VMs, so it becomes a single point of security failure for every guest.

Two types:
1. Type 1 (bare metal, native): the hypervisor runs directly on the hardware with no host operating system. It is common for servers and presents a smaller target because the hypervisor is much simpler than a full operating system.
2. Type 2 (hosted): the hypervisor runs as an application on a normal host operating system (Windows, Linux, macOS). It is common on desktops. The host operating system and its other applications add complexity and vulnerabilities.

Main risks:
1. VM escape: an attacker breaks out of a guest to reach the hypervisor, other guests or the host. Compromising the hypervisor can mean control of every guest on it.
2. VM sprawl: VMs are so easy to create that forgotten, unpatched and unowned VMs pile up.
3. Resource reuse: memory or storage handed from one VM to another must be cleared so data does not leak between tenants.
4. Images and snapshots: they carry the same vulnerabilities as the live guest and can hold sensitive data, so they need patching, access control and inventory.

**Why it matters:** one hypervisor breach can expose dozens of servers at once, which is why hypervisors are patched promptly, management access is restricted and VMs are inventoried.

**Common confusions:** A VM has its own operating system and kernel; a container does not. Type 1 is not "more secure" in every case, but removing the host operating system usually shrinks the attack surface. A snapshot of a compromised VM keeps the compromise, which is useful for forensics but dangerous as a restore point.

**Scenario:** An audit finds 60 VMs with no owner, several running unsupported operating systems. The problem is VM sprawl, fixed by inventory, ownership and lifecycle rules. VM escape is the closest wrong answer: escape is an attack that breaks isolation, while these VMs are simply unmanaged.

### Containers vs virtual machines vs serverless (comparison)
These three compute models differ in what the customer manages and how strong the isolation boundary is. Serverless here means function as a service (FaaS).

| Model | What each unit contains | Isolation boundary | Customer patches | Typical security focus |
|---|---|---|---|---|
| Virtual machine | Full guest operating system plus apps | Hypervisor (strong) | Guest operating system and apps | Patch guests, protect hypervisor, prevent sprawl |
| Container | App plus libraries, shares host kernel | Kernel namespaces and cgroups (weaker) | Images (rebuild) and host | Trusted scanned images, no secrets in images, separate by sensitivity |
| Serverless function | Code only, event-triggered | Provider-managed environment | Nothing below the code | Least-privilege permissions, input validation, event source security |

How to choose: need a full operating system or legacy software, choose VMs. Need fast, portable, consistent deployments of modern apps, choose containers. Need event-driven code with no server management and pay-per-use cost, choose serverless.

**Why it matters:** confusing the isolation strength of these models leads to placing high-risk and sensitive workloads side by side on a shared kernel.

**Common confusions:** Containers often run inside VMs, so the models stack rather than exclude each other. Lighter is not the same as less secure by design; the question is whether the boundary matches the risk. Serverless still has a container or similar environment underneath, but the provider owns it.

**Scenario:** A legacy accounting program needs a specific old operating system and must be isolated from other tenants. A VM fits. A container is the closest wrong answer, since it shares the host kernel and cannot bring its own operating system.

### Internet of Things (IoT) devices
Internet of Things devices are everyday objects with network connections and sensors: cameras, thermostats, smart TVs, printers, wearables, building controls and home routers. They extend the network into the physical world. Their security problems come from cheap hardware, default settings and short or absent support lives.

Common weaknesses, in the order attackers exploit them:
1. Default or weak credentials that are never changed.
2. Exposed remote services (for example Telnet) left on.
3. Missing or slow firmware updates, sometimes none at all after a short support period.
4. Limited processing power that cannot run agents or strong encryption.
5. Large numbers of devices that nobody inventories.

How to secure them:
1. Inventory every device, since you cannot protect what you do not know exists.
2. Change default passwords before connecting.
3. Put IoT devices on their own network segment with only the flows they need.
4. Disable unneeded services such as Universal Plug and Play (UPnP) on routers.
5. Buy from vendors that publish how long they will ship updates and how to verify them.

**Why it matters:** in 2016 the Mirai botnet scanned the internet for devices accepting a short list of 62 factory default username and password pairs, enlisted hundreds of thousands of cameras, video recorders and routers, and used them for record-breaking denial-of-service attacks. The owners' devices also became attack tools.

**Common confusions:** IoT is broader than industrial control systems; IoT usually means consumer and building devices, while ICS controls industrial processes. Rebooting an infected device may clear memory-resident malware, but without a password change it is quickly reinfected.

**Scenario:** A company's lobby cameras are found sending traffic to an unknown overseas server. The best immediate control is to isolate them on their own segment and change their default credentials. Installing endpoint antivirus on them is the closest wrong answer, because these devices usually cannot run such agents.

### Industrial control systems (ICS) and supervisory control and data acquisition (SCADA)
Industrial control systems monitor and control physical processes such as power generation, water treatment, pipelines and manufacturing. Supervisory control and data acquisition (SCADA) is the ICS type that spans large geographic areas. Current guidance groups ICS under operational technology (OT): programmable systems that sense or change the physical world. Here a failure can hurt people, so the priorities differ from office IT.

How a SCADA system is built:
1. A control server at a control center collects data and issues supervisory commands.
2. Field sites hold programmable logic controllers (PLCs) or remote terminal units (RTUs) that read sensors and drive actuators (valves, pumps, breakers) locally.
3. Communications links (radio, phone lines, cable, satellite) connect field sites to the center.
4. Operators watch and adjust the process through human-machine interfaces (HMIs).
5. Separate safety systems bring the process to a safe state when limits are crossed.

Security priorities and constraints:
1. Safety comes first, then availability and integrity; confidentiality usually comes last, the reverse of the usual office order.
2. Systems run for 10 to 15 years, often on unsupported or proprietary operating systems; outages must be scheduled days or weeks ahead, so patching is slow or impossible.
3. Devices may lack encryption, logging or password protection, and security tools can disturb timing.

How to protect them: segment OT from business networks with a demilitarized zone (DMZ) between them so no traffic passes directly, use separate credentials for the OT side, allow firewall connections only between adjacent levels, monitor passively, and use air gaps or one-way gateways for the most critical parts.

**Why it matters:** attacks have physical results: outages, environmental damage, injury. Any security measure that harms safety is unacceptable.

**Common confusions:** SCADA is a type of ICS, not a synonym for all ICS. An inline intrusion prevention system that blocks a legitimate control message can itself cause an outage, so OT often favors passive monitoring.

**Scenario:** A water utility cannot patch its PLCs for a year because the vendor must certify each change. The right approach is compensating controls: strict segmentation, restricted remote access and passive monitoring. Patching them anyway is the closest wrong answer, because an untested change can stop the process.

### Real-time operating system (RTOS) and deterministic timing
A real-time operating system is built to respond to inputs within guaranteed, predictable time limits, so a result that arrives late counts as a failure even if it is correct. That predictability is called deterministic behavior. RTOSs run where delay is dangerous: vehicle braking and engine control, industrial controllers, medical devices, avionics and weapons systems.

How it differs from a general operating system:
1. Scheduling is built around deadlines, not around fairness or throughput.
2. The system is small and focused on one job, often with tight memory and processing limits.
3. Many general security features are missing or minimal, because anything that adds unpredictable delay (heavy scanning, frequent updates, complex authentication) can break timing.

How to protect an RTOS-based device:
1. Isolate it on its own network segment, or keep it off general networks entirely.
2. Limit and authenticate who can send it commands or new firmware.
3. Test any update thoroughly in a lab first, since a timing change can be unsafe.
4. Monitor from outside the device, because agents usually cannot run on it.

**Why it matters:** an attacker who can delay or alter a real-time control loop can cause physical harm, and the device itself usually cannot defend or even log much.

**Common confusions:** Real-time means predictable timing, not simply fast. An RTOS is often found inside embedded systems and industrial controllers, so the categories overlap; the defining keyword for an RTOS is deterministic timing.

**Scenario:** A car maker's braking controller must react within a fixed number of milliseconds every single time. The operating system that fits is an RTOS. A general-purpose operating system with antivirus is the closest wrong answer, because background scanning could delay the response past its deadline.

### Embedded systems (architecture model)
An embedded system is a computer built into a larger device to perform one dedicated function, usually running fixed firmware on limited hardware. Examples include printers, smart meters, traffic lights, medical infusion pumps, network appliances and car subsystems. They are everywhere, rarely visible as computers, and often outlive their software support.

Typical security limits:
1. Limited central processing unit (CPU), memory and sometimes battery power, so strong encryption, agents and logging may not fit.
2. Firmware updates may be rare, manual or unavailable, and some devices cannot be updated at all.
3. Long service lives, so devices keep running long after the vendor stops shipping fixes.
4. Physical exposure: devices in public places can be opened and probed.

How to protect them:
1. Inventory them like any other asset.
2. Segment them so they reach only what they need.
3. Change defaults, disable unused interfaces and services.
4. Monitor their network traffic for changes from the normal pattern.
5. When buying, ask how long updates will ship and how their authenticity can be verified.

**Why it matters:** a compromised printer or meter is a quiet foothold inside the network that few teams watch.

**Common confusions:** Embedded systems, Internet of Things (IoT) devices and real-time operating system (RTOS) devices overlap: an IoT camera is embedded, and an embedded controller may run an RTOS. Embedded describes the build (dedicated computer inside a device); IoT describes network-connected everyday devices; RTOS describes deterministic timing.

**Scenario:** A clinic's infusion pumps run vendor firmware that cannot be changed without recertification. The approach is compensating controls such as segmentation and monitoring. Installing an endpoint agent is the closest wrong answer, because the firmware cannot host one.

### Specialized systems compared: IoT vs ICS/SCADA vs RTOS vs embedded
These four categories are often confused because one device can belong to several. Each name stresses a different property.

| Category | What defines it | Typical examples | First protection |
|---|---|---|---|
| Internet of Things (IoT) | Everyday object with a network connection | Cameras, thermostats, smart TVs | Change defaults, own segment, inventory |
| Industrial control system (ICS)/supervisory control and data acquisition (SCADA) | Controls a physical industrial process; SCADA spans wide areas | Power grid, water plant, pipeline | Strict segmentation from business network, safety first |
| Real-time operating system (RTOS) | Deterministic, deadline-driven timing | Brakes, avionics, industrial controllers | Isolation, careful tested updates |
| Embedded system | Dedicated computer inside a device, fixed firmware | Printer, smart meter, infusion pump | Segment, monitor, verify firmware updates |

Shared traits: limited compute, slow or absent patching, long lives, and a need for compensating controls.

**Why it matters:** recognizing the category tells you the priority. For ICS it is safety and availability; for IoT it is default credentials and sheer numbers; for RTOS it is timing; for embedded it is firmware.

**Common confusions:** "Cannot be patched" points to all four, so the clue to pick between them is usually the second detail: physical process (ICS), deadline (RTOS), consumer gadget (IoT) or single-purpose firmware (embedded).

**Scenario:** A design brief describes a device that must answer within a fixed time window to keep a robotic arm safe. The keyword is the time guarantee, so the answer is RTOS. Embedded system is the closest wrong answer: the arm controller is embedded too, but the clue names the timing property.

### High availability as an architecture concept (redundancy and fault tolerance)
High availability (HA) is the design goal of keeping a service running and reachable nearly all the time, by building redundancy so that no single failed part causes an outage. It sits on the availability leg of the confidentiality, integrity and availability (CIA) triad. It is measured as the share of time the service is up, written in "nines" (the Reference chapter lists what each level means in downtime).

How HA is built, from the bottom up:
1. Find single points of failure: one power feed, one disk, one server, one link, one site.
2. Add redundancy at each layer: dual power supplies, redundant disks, several servers behind a load balancer or in a cluster, two network links, a second site.
3. Add automatic failover so a standby takes over without human action.
4. Monitor health continuously, since failover only works if failures are noticed.

**Why it matters:** downtime costs revenue and trust, and more nines cost more money. The choice of architecture model sets the ceiling: a single on-premises server cannot reach the availability of a service spread across several cloud zones.

**Common confusions:** Fault tolerance aims for zero interruption when a part fails, while high availability may allow a short pause during failover (see `### Fault tolerance vs high availability`). HA does not replace backups: corrupted or encrypted data is copied to every redundant system. The techniques (load balancing, clustering, sites) are covered in objective 3.4.

**Scenario:** A web shop wants to survive the loss of any one server without customers noticing more than a brief retry. The approach is high availability with several servers behind a load balancer. Nightly backups are the closest wrong answer: they protect data but do nothing to keep the shop online when a server dies.

### Architecture considerations: availability, resilience and ease of recovery
Three of the listed considerations describe how a model stays up and comes back. Availability is whether the system is up and usable when needed. Resilience is its ability to keep working, perhaps degraded, through failures and attacks and then bounce back. Ease of recovery is how quickly and simply it can be restored afterwards.

How models compare:
| Model | Availability | Resilience | Ease of recovery |
|---|---|---|---|
| Single on-premises server | Low: one failure stops it | Low | Slow: hardware and restore needed |
| Cloud across several zones or regions | High | High | Fast: redeploy or fail over |
| Microservices | High for the app as a whole | High: one service fails alone | Fast per service |
| Infrastructure as code | Depends on hosting | Medium | Fast: rebuild from templates |
| Legacy industrial control systems (ICS) | Designed for uptime with redundancy | High for faults, weak against attacks | Hard: long, risky restores |

How to reason about a scenario:
1. Identify the priority stated (must never go down, must come back fast, must keep partial service).
2. Pick the model or feature that delivers that property: redundancy for availability, independent parts and diversity for resilience, automation and tested backups for ease of recovery.

**Why it matters:** these properties define what customers experience during an incident, and they feed the recovery time objective (RTO) a business sets (see objective 5.2 for RTO and recovery point objective (RPO)).

**Common confusions:** Availability is the outcome, resilience is the capability that protects it. A system can be highly available yet hard to recover: industrial systems built with heavy redundancy can still take weeks to rebuild after a destructive attack, because redundancy does not stop malicious changes from spreading.

**Scenario:** A company wants its ordering app to keep taking orders even if its recommendation feature fails. The property is resilience, delivered by a microservices design. Ease of recovery is the closest wrong answer: it concerns how fast a failed system returns, not whether the rest keeps working meanwhile.

### Architecture considerations: cost, scalability, responsiveness and ease of deployment
Four of the listed considerations describe how a model grows, performs and launches, and what it costs. Cost covers upfront capital spending, ongoing operating spending, licenses, staff and the controls themselves. Scalability is the ability to add or remove capacity; elasticity is doing so automatically and quickly in both directions. Responsiveness is how fast the system answers requests and adapts to load. Ease of deployment is how quickly and simply it can be set up or changed.

How the models compare:
| Model | Cost pattern | Scalability | Responsiveness | Ease of deployment |
|---|---|---|---|---|
| On-premises | High upfront capital, staff | Slow: buy hardware (scale up or out) | Good locally, fixed ceiling | Slow, manual |
| Infrastructure as a service | Pay as you go | Fast, elastic | Good; region choice affects latency | Fast with templates |
| Serverless | Pay per execution | Automatic | Can add start-up delay on first call | Very fast |
| Containers | Efficient use of hosts | Fast scale out | Fast start | Fast, consistent images |
| industrial control systems (ICS) and embedded | High, long-lived | Very limited | Deterministic where needed | Slow, vendor-bound |

How to reason:
1. Scale up means a bigger machine; scale out means more machines. Cloud and containers favor scaling out.
2. Easy deployment also spreads mistakes fast, so pair automation with review and scanning.
3. Heavy security inspection (deep packet inspection, decryption) adds latency, so place it where responsiveness can afford it.
4. A control should not cost more than the loss it prevents.

**Why it matters:** these factors usually decide the purchase, so security has to fit inside them rather than fight them.

**Common confusions:** Scalability is about capacity; responsiveness is about speed of answer. Cloud is not always cheaper: steady, predictable loads can cost more on pay-as-you-go than on owned hardware. Elasticity includes scaling down, which saves money after a peak.

**Scenario:** An online ticket seller faces huge demand for an hour each week and almost none otherwise. The best fit is elastic cloud capacity that scales out and back automatically. Buying on-premises servers for peak load is the closest wrong answer: it meets the peak but wastes money all week.

### Architecture considerations: risk transference
In architecture choices, risk transference means shifting part of a risk's impact to another party, usually a cloud provider, an outsourcing partner or an insurer, through contracts, service level agreements and policies. Moving to a provider transfers some operational risk (power, hardware, physical security) because the provider now carries those duties.

How it works:
1. Identify the risk and who could carry its impact better (a provider with redundant data centers, an insurer).
2. Write the transfer into a contract: service levels, credits for missed uptime, breach notification duties, liability terms, insurance coverage.
3. Keep monitoring that the other party performs, since the contract is only as good as its enforcement.

**Why it matters:** transference can be cheaper than building the same protection yourself, but the organization still answers to customers and regulators. Accountability for the data never moves: if a provider loses your customers' records, your customers and regulators still hold you responsible.

**Common confusions:** Transference reduces the financial or operational impact on you; it does not make the risk disappear. Buying insurance is transference, not mitigation, because the attack is just as likely. The full set of risk responses (transfer, accept, avoid, mitigate) is objective 5.2 material.

**Scenario:** A company moves its data center to a cloud provider with contractual uptime guarantees and also buys cyber insurance. Both are risk transference. Risk avoidance is the closest wrong answer: avoidance would mean stopping the risky activity entirely, while here the company keeps running the same services.

### Patch availability vs inability to patch (compensating controls)
Two listed considerations deal with fixes. Patch availability asks whether the vendor releases security fixes at all, and how fast. Inability to patch describes systems where fixes may exist but cannot be applied, because of uptime demands, vendor certification, limited resources or fixed firmware. Both leave known weaknesses open, so both lead to compensating controls.

How to handle each:
1. Patch availability: check the vendor's support lifecycle before buying, track end-of-life dates, budget replacement before support ends, and prefer services (such as software as a service (SaaS)) where the provider patches for you.
2. Inability to patch: accept that the hole stays, then reduce exposure with compensating controls: network segmentation or isolation, strict access control, application allow lists, disabling unneeded services, and close monitoring of the device's traffic.
3. Document the exception and review it, because "temporary" unpatched systems tend to become permanent.

**Why it matters:** industrial systems, medical devices, embedded controllers and Internet of Things (IoT) devices often run for many years with no feasible patching, and unsupported operating systems are common in operational technology. Without compensating controls, one known exploit stays usable for the life of the device.

**Common confusions:** No patch exists (availability problem) is different from a patch exists but cannot be applied (inability problem); the controls overlap, but the root cause and the fix differ: the first is solved by replacing or changing vendors, the second by changing how the system is run. A compensating control does not fix the flaw; it lowers the chance or impact of exploiting it.

**Scenario:** A hospital's imaging system runs an operating system the vendor no longer supports, and the vendor will not certify an upgrade. The answer is compensating controls such as isolating it on its own segment and monitoring it. Installing the operating system vendor's newest patch anyway is the closest wrong answer: none exists for the unsupported version, and changes would void certification.

### Architecture considerations: power and compute constraints
Power covers how much electricity a design draws and how dependable its supply is. Compute covers the processing and memory available. Both limit which security functions can run and where, and both feed the cost and availability of a design.

How they shape security:
1. On-premises data centers must supply enough power and cooling, plus backup power, themselves. In the cloud, the provider carries the facility power duty.
2. Small battery-powered and embedded devices cannot run heavy security: strong encryption, endpoint agents, frequent scanning and detailed logging all cost cycles and battery life.
3. Constrained devices therefore lean on controls placed elsewhere: gateways that encrypt on their behalf, network monitoring, segmentation.
4. Cloud compute is elastic, so heavy inspection or encryption can scale with demand, at a price.

**Why it matters:** a design that ignores power or compute either fails under load or quietly drops security features to keep running.

**Common confusions:** Power here is a design constraint; power resilience equipment (UPS, generators) is objective 3.4 material, see `### Uninterruptible power supply (UPS)`. Compute limits are why "cannot run an agent" points to network-based controls, not to skipping security.

**Scenario:** A fleet of battery-powered field sensors cannot run strong encryption without draining their batteries in weeks. A suitable design sends their data through a nearby gateway that encrypts the link onward and monitors the sensors. Installing an endpoint protection agent on each sensor is the closest wrong answer, because the compute and power limit is the very problem.

### On-premises vs cloud vs hybrid hosting (comparison)
Where systems run decides who secures what and which considerations dominate. Software as a service (SaaS) and infrastructure as a service (IaaS) sit at opposite ends of the cloud range.

| Factor | On-premises | Cloud (IaaS to SaaS) | Hybrid |
|---|---|---|---|
| Who secures the physical layer | You | Provider | Both, by location |
| Control over data location | Full | Chosen by region, provider runs it | Mixed |
| Upfront cost | High | Low, pay as you go | Mixed |
| Scaling | Slow | Fast, elastic | Fast for the cloud half |
| Main security risk | Unmet duties (patching, physical, monitoring) | Customer misconfiguration and identity | Inconsistent policy at the seams |
| Risk transference | None | Some operational risk | Partial |

How to choose:
1. Strict custody or sovereignty rules, or very steady loads: on-premises.
2. Fast growth, elastic demand, limited staff: cloud, picking IaaS, platform as a service (PaaS) or SaaS by how much you want to manage.
3. Some data must stay in house while other workloads need scale: hybrid, with unified identity and monitoring.

**Why it matters:** the hosting decision fixes the shape of every later control, from who patches to where logs come from.

**Common confusions:** Hybrid is not multi-cloud (two or more providers). Cloud does not remove the need for backups, identity governance or configuration review; those stay with the customer in every model.

**Scenario:** A startup with three engineers needs email, file sharing and a customer database within a week. SaaS for email and files plus a managed database service fits best. Building an on-premises server room is the closest wrong answer, because it brings full responsibility the team cannot staff.

## 3.2 Securing enterprise infrastructure in practice
Depth asked: apply in a scenario. A good answer picks the device, where it sits, how it attaches to traffic and how it fails, or the secure connection method, and says why it beats the closest alternative for the stated need.

### Security zones and the screened subnet (DMZ)
A security zone is a group of systems with the same trust level and purpose, with policy-controlled boundaries between zones. Typical zones are untrusted (the internet), a screened subnet for public-facing servers, trusted internal networks, and more restricted zones for sensitive systems. Zones put least privilege into the network layout and limit how far an attacker can move.

How a screened subnet works:
1. Public-facing servers (web, mail relay, public Domain Name System (DNS)) sit in their own zone, the screened subnet, also called a demilitarized zone (DMZ).
2. A firewall (or two firewalls, one on each side) allows the internet to reach only the specific services in the screened subnet.
3. The screened subnet may reach only the named internal systems it needs (for example one database port), never the whole internal network.
4. The internal network may reach the screened subnet for management, and nothing from the internet reaches the internal network directly.
5. Deny by default: anything not explicitly allowed between zones is blocked.

**Why it matters:** when a public web server is compromised, which is likely over time, the attacker lands in a zone that cannot freely reach payroll or customer databases. Industrial guidance uses the same idea: a DMZ between business and plant networks so no traffic passes straight through.

**Common confusions:** Screened subnet is the name the SY0-701 objectives use for what is traditionally called a DMZ; the two terms mean the same zone. A zone is a policy idea; virtual LANs (VLANs) and subnets are how it is often built. Putting a database in the screened subnet "so the web server can reach it" is a classic mistake: the database belongs in an internal zone with a narrow allowed flow.

**Scenario:** A company is publishing a customer portal that reads from an internal order database. The design places the portal web server in the screened subnet and allows only its database query port to the internal database server. Putting the web server on the internal network behind one firewall rule is the closest wrong answer, since a compromised web server would then sit among every internal system.

Worked example rule set: internet to 203.0.113.10 port 443 allow; 203.0.113.10 to internal 10.1.5.20 database port allow; screened subnet to internal any deny; internet to internal any deny.

### Device placement for security appliances
Device placement is choosing where each security device sits so that it sees, and can act on, exactly the traffic it must control. Most controls belong at zone boundaries, where traffic changes trust level. Wrong placement makes a good device useless: it either never sees the attack or sees encrypted traffic it cannot read.

Placement rules, by device:
1. Firewall: at every boundary between zones, including between internal zones, not only at the internet edge.
2. Intrusion prevention system (IPS): inline where traffic must be stopped, usually right behind the edge firewall or between sensitive zones.
3. Intrusion detection system (IDS) sensor: on a tap or mirror port where the interesting traffic flows (screened subnet, data center core). Place it where traffic is decrypted, or use host-based detection, since network sensors cannot read encrypted payloads.
4. Web application firewall (WAF): directly in front of the web servers it protects.
5. Load balancer: in front of the server pool, often in the screened subnet.
6. Jump server: at the edge of the secure administrative zone, the only path in.
7. Proxy: forward proxy between users and the internet; reverse proxy in front of published servers.

**Why it matters:** a device placed where it cannot see the traffic gives false assurance, and an inline device in the wrong path becomes a bottleneck or outage point.

**Common confusions:** Placing an inline sensor on the more secure side of a firewall means it handles less traffic. Placing it on the less secure side protects the firewall too. Both are valid, and the stated goal decides. An IDS behind a TLS-terminating device sees plaintext; in front of it, the IDS sees only ciphertext.

**Scenario:** An IDS at the internet edge misses attacks on an internal web app because all traffic to it is encrypted until the load balancer decrypts it. The fix is to place the sensor after the load balancer, where traffic is decrypted, or add host-based detection on the servers. Buying a faster IDS is the closest wrong answer, since speed does not let it read encrypted payloads.

### Attack surface reduction in enterprise infrastructure
The attack surface is every point where an attacker could try to get in or get data out: open ports, running services, applications and their application programming interfaces (APIs), user and service accounts, devices, wireless access, remote access paths and third-party connections. A smaller surface means fewer things to defend and fewer paths to watch. Reduction is a preventive approach that cuts likelihood before any attack starts.

How to reduce it, in order:
1. Inventory what exists, including cloud services and Internet of Things (IoT) devices, since unknown assets cannot be reduced.
2. Remove what is not needed: unused services, ports, software, accounts and old test systems.
3. Harden what remains: secure configuration baselines, default credentials changed, unnecessary features disabled.
4. Restrict reach: segmentation and firewall rules so each exposed service is reachable only by those who need it.
5. Apply least privilege to accounts and service identities.
6. Re-check regularly, because every new app, API, device or vendor link adds surface.

**Why it matters:** many breaches start from something nobody remembered was exposed, such as a forgotten test server or an unused remote desktop port.

**Common confusions:** Attack surface is not the same as vulnerabilities: a fully patched but unneeded service is still surface that may break tomorrow. Adding security tools can also add surface, because each tool has its own interfaces and accounts. Cloud services, remote work and IoT all enlarge the surface.

**Scenario:** A scan shows a file server that also runs an old web admin page nobody uses. The best action is to disable the unneeded service. Writing an intrusion detection system (IDS) signature for attacks on that page is the closest wrong answer: it watches a door that should simply be closed.

### Connectivity in enterprise infrastructure
Connectivity is how sites, users, clouds and partners link together (internet links, private circuits, wireless, virtual private networks (VPNs), software-defined wide area networks (SD-WANs)) and how those links are protected and kept available. Every link is both a business need and part of the attack surface.

What to decide for each link:
1. Who and what may use it, and to reach which zones.
2. How it is protected in transit: encryption (Transport Layer Security (TLS), Internet Protocol Security (IPSec)) whenever it crosses a network you do not control, including leased lines run by third parties.
3. How it stays available: redundant links from different carriers or paths.
4. How it is monitored: flows and logs at both ends.
5. How partners connect: their own dedicated, restricted path, never a flat trust into the internal network.

**Why it matters:** a single unprotected or single-path link can be an eavesdropping point or a single point of failure for a whole branch.

**Common confusions:** A private circuit is not automatically confidential; many are shared carrier infrastructure, so encryption is still advised. More links mean more resilience but also more paths to secure.

**Scenario:** A branch office connects to headquarters over a single internet line and sends file traffic unencrypted. The two fixes are a site-to-site encrypted tunnel and a second link from a different provider. Adding a stronger firewall at the branch is the closest wrong answer: it does not encrypt the traffic in transit or remove the single point of failure.

### Fail-open vs fail-closed (failure modes)
A failure mode is how a security device behaves when it crashes, loses power or is overloaded. Fail-open lets traffic pass uninspected so the network keeps working. Fail-closed blocks all traffic so nothing unchecked gets through. The choice is a deliberate trade between availability and security (confidentiality and integrity).

| | Fail-open | Fail-closed |
|---|---|---|
| On failure | Traffic flows, unfiltered | Traffic stops |
| Favors | Availability | Confidentiality and integrity |
| Risk | Attacks pass during the failure | Outage until repaired |
| Typical use | Inline intrusion prevention system (IPS) on a revenue-critical link | Firewall in front of highly sensitive systems |

How to decide:
1. Ask what the link protects and what an outage costs.
2. If an hour of uninspected traffic is worse than an hour of downtime, choose fail-closed.
3. If downtime is worse, choose fail-open, and add monitoring so the failure is noticed fast.
4. Reduce how often the question arises with redundant devices (a high-availability pair) so one failure changes nothing.

**Why it matters:** a fail-closed IPS on a store's only payment link can stop all sales; a fail-open firewall in front of a classified network can expose it.

**Common confusions:** These are network device terms. For door locks the words differ: a fail-safe lock releases on power loss so people can get out (exits, stairwells), and a fail-secure lock stays locked (server rooms). A general system that fails secure keeps its secure state when it fails; one that fails safe protects people and property first.

**Scenario:** An inline IPS on a hospital's link to its records system crashes, and the requirement says clinicians must never lose access. The setting is fail-open, with an alert to staff. Fail-closed is the closest wrong answer: it protects the traffic but cuts off patient care.

### Active vs passive and inline vs tap/monitor (device attributes)
Device attributes describe how a security device relates to traffic. Active vs passive asks whether it can act on traffic (block, reset, alter) or only watch and report. Inline vs tap/monitor asks whether traffic flows through it or a copy is sent to it. Together they decide whether a device can stop an attack and whether it can cause an outage.

How each attachment works:
1. Inline: the device sits in the traffic path like a firewall, so every packet passes through it. It can drop, throttle or rewrite traffic. It adds latency and needs a failure mode.
2. Tap: a hardware network tap on the cable copies all traffic to the sensor. Installing it usually means brief downtime, and it must be bought separately.
3. Port mirror (SPAN, switched port analyzer): a switch copies traffic from chosen ports to a monitoring port. It is cheap and already present, but under heavy load or misconfiguration it may miss traffic, and switches often have few mirror ports.
4. A passive sensor can still try to end a Transmission Control Protocol (TCP) session by sending reset packets to both ends, but this often arrives too late and does not work for User Datagram Protocol (UDP) or ICMP.

The classic pairing: an intrusion prevention system (IPS) is active and inline; an intrusion detection system (IDS) is passive and on a tap or mirror.

**Why it matters:** only inline devices can reliably stop an attack in flight, but only passive devices are guaranteed never to break traffic. Sensitive environments such as plant networks often prefer passive monitoring for that reason.

**Common confusions:** Active usually requires inline, but an inline device can be set to monitor-only (passive behavior) during tuning, and many products are deployed that way first because new deployments produce many false positives. A mirror port is not a tap: the mirror is a switch feature that can drop copies, the tap is a dedicated device.

**Scenario:** A team wants to see every packet on a core link without any chance of disrupting it, and accepts that it cannot block. The fit is a passive sensor on a network tap. An inline IPS in monitor mode is the closest wrong answer: it still sits in the path, so its failure could still affect traffic.

### Jump server (jump box, bastion host)
A jump server is a hardened, closely monitored host that administrators connect to first, and from which they then reach systems in a protected zone. It makes administration flow through one controlled point instead of letting admin tools reach servers from any workstation. The broader term bastion host means a specially hardened system built to withstand attack at a network boundary.

How it works:
1. Admin workstations cannot reach the protected servers directly; firewall rules allow admin protocols only from the jump server.
2. Administrators authenticate to the jump server with multifactor authentication (MFA), ideally from dedicated admin workstations.
3. From the jump server they use secure protocols (Secure Shell (SSH) with keys, remote desktop through a gateway) to reach targets.
4. Sessions are logged and, where possible, recorded.
5. The jump server is patched rapidly, stripped of unneeded software and limited to named admin roles.

**Why it matters:** it shrinks the admin attack surface to one host that can be watched closely. The flip side is concentration: many sensitive sessions and credentials pass through it, so a compromised jump server hands over the keys to everything behind it.

**Common confusions:** A jump server is not a virtual private network (VPN): a VPN gives a device broad network access, while a jump server gives access to specific systems through one hardened host. Exposing the jump server's remote desktop port directly to the internet defeats the purpose; it should sit behind a gateway or VPN with MFA.

**Scenario:** Auditors require that every administrative connection to database servers come through one point that is logged. The answer is a jump server with session logging. Giving each administrator a VPN account is the closest wrong answer, because VPN users could then reach the databases from their own workstations without a single control point.

### Proxy server (forward proxy and reverse proxy)
A proxy server makes requests on behalf of others, so the two sides never connect directly. Because all traffic passes through it, it can filter, cache, log and hide addresses. Which side it serves decides its name: a forward proxy serves internal clients going out, a reverse proxy serves internal servers receiving requests from outside.

How each works:
1. Forward proxy: users' browsers send requests to the proxy, which fetches the content from the internet. It enforces URL and content filtering, caches pages, logs who went where and hides internal addresses. It can be explicit (configured in the browser) or transparent (traffic is redirected without client settings).
2. Reverse proxy: internet clients send requests to the proxy, which forwards them to backend servers and returns the responses. It hides the servers, can terminate Transport Layer Security (TLS), balance load across servers, cache content, and filter requests (a web application firewall is often built as a reverse proxy).
3. A full application proxy creates two separate connections, client to proxy and proxy to destination, so it can inspect content and even decrypt and re-encrypt it, at the cost of processing time.

**Why it matters:** forward proxies stop users from reaching malicious sites and give an audit trail; reverse proxies keep backend servers off the internet and centralize protection.

**Common confusions:** Forward protects the users, reverse protects the servers. A load balancer and a reverse proxy overlap heavily; a load balancer's main job is spreading load, while a reverse proxy's is fronting and protecting servers. A proxy that decrypts TLS sees sensitive data, so it must itself be secured and its use disclosed by policy.

**Scenario:** A company wants to block employees from known malware sites and log all web use. The answer is a forward proxy with URL filtering. A reverse proxy is the closest wrong answer: it sits in front of the company's own servers and does not see employees' outbound browsing.

### Intrusion detection system (IDS) and intrusion prevention system (IPS)
An intrusion detection system watches traffic or host activity for signs of attack and raises alerts. An intrusion prevention system does the same and can also stop the activity, so it is placed inline. Both are technical controls: IDS is detective, IPS is preventive as well. Network versions (NIDS, NIPS) watch traffic; host-based versions (HIDS, HIPS) watch one system.

How detection works:
1. Signature-based: compares activity with patterns of known attacks. Very effective against known threats, weak against new ones, variants and evasion. A renamed malware file can slip past a filename signature.
2. Anomaly-based (behavior-based): learns a profile of normal activity over a training period, then flags significant deviations. Good at new threats, but produces more false positives, and malicious activity seen during training can be learned as normal.
3. Stateful protocol analysis: compares activity with vendor profiles of how a protocol should behave in each state, catching misuse such as commands issued before login.
Most products combine methods.

Accuracy terms: a false positive flags benign activity as an attack; a false negative misses a real attack. Reducing one usually increases the other, and adjusting the system to improve accuracy is called tuning.

**Why it matters:** an IDS gives visibility; an IPS can stop attacks in seconds, but a false positive on an IPS blocks legitimate business traffic, which is why new IPS deployments start in alert-only mode.

**Common confusions:** IDS alerts, IPS blocks. Network sensors cannot inspect encrypted payloads unless placed where traffic is decrypted. An IPS needs a failure mode decision (see `### Fail-open vs fail-closed (failure modes)`).

**Scenario:** A team wants malicious packets dropped automatically before they reach web servers, accepting some tuning effort. The answer is an inline network IPS. A network IDS on a mirror port is the closest wrong answer: it can only alert, and its attempts to reset sessions often arrive too late.

Worked example of an alert line: `2026-11-03 14:02:11 ALERT sig=2010935 "SQL injection attempt" src=198.51.100.7 dst=10.1.5.20:443 action=blocked`. The action field shows an IPS; an IDS would log `action=alerted`. SQL means Structured Query Language.

### Load balancer (scheduling methods, persistence and health checks)
A load balancer spreads incoming requests across a pool of servers so no single server is overloaded, and it removes failed servers from the pool. It improves availability and responsiveness. It sits in front of the server pool, often in the screened subnet, and is a key high-availability building block.

How it works:
1. Clients connect to one virtual address owned by the load balancer.
2. A scheduling method picks a server: round robin (in turn), weighted round robin (more to stronger servers), least connections (the server with the fewest active connections), hash on the client address (the same client tends to reach the same server), or lowest response time.
3. Health checks probe each server; a server that fails is taken out of rotation and returned when it recovers.
4. Persistence (affinity, sticky sessions) keeps one user on the same server, using a cookie or a hash of the client address, when the application stores session state locally.
5. The load balancer can terminate Transport Layer Security (TLS) (offload) and inspect or cache content.

Configurations: active/active, where all nodes serve traffic, or active/passive, where a standby takes over if the active one fails. The load balancer itself should be redundant, or it becomes the single point of failure.

**Why it matters:** a server can fail or be patched without customers noticing, and sudden traffic peaks are absorbed.

**Common confusions:** Load balancing is not clustering: load-balanced servers are independent and unaware of each other, while cluster nodes cooperate as one system (see `### Load balancing vs clustering (high availability)`). Affinity helps applications but weakens balance, because a busy user stays pinned to one server.

**Scenario:** Users of a shopping site lose their carts whenever a request lands on a different server. The fix is session persistence (affinity) on the load balancer, or storing session state centrally. Switching from round robin to least connections is the closest wrong answer, since it still moves users between servers.

### Network sensors (collection points for monitoring)
A sensor is a device or software component placed at a chosen point in the network or on a host to collect traffic or event data and send it to an analysis system: an intrusion detection system (IDS), a security information and event management (SIEM) platform or a network detection tool. Sensors collect; a central system analyzes and correlates. Placement decides what the organization can see.

How to deploy sensors:
1. Map where the traffic of interest flows: internet edge, screened subnet, data center core, links between sensitive zones, cloud virtual networks.
2. Choose the attachment: tap or mirror port for passive collection, inline only when the sensor must also block.
3. Put sensors where traffic is readable, after decryption, or use host-based sensors (agents) on the endpoints.
4. Send sensor data over a separate management network, or at least a protected virtual LAN (VLAN), so attackers cannot tamper with it.
5. Do not give monitoring interfaces IP addresses, so they are hard to target; only the management interface is addressable.
6. Roll out a few sensors first with prevention off, tune false positives, then expand.

**Why it matters:** blind spots are where attackers live. A breach in a segment with no sensor may go unnoticed for months.

**Common confusions:** A sensor is not the analyzer; it feeds one. More sensors are not automatically better: duplicate feeds raise cost and noise without new visibility. Sensors in operational technology networks must be passive and low impact, since any disruption touches the physical process.

**Scenario:** After a breach, investigators find no network records for traffic between two internal server zones. The gap to close is a sensor on the link between those zones, feeding the SIEM. Adding another sensor at the internet edge is the closest wrong answer, because the attacker's movement never crossed the edge.

### Port security with IEEE 802.1X (port-based network access control)
IEEE 802.1X is a standard for port-based network access control: a device gets normal network access through a switch port or wireless association only after it authenticates. It stops unknown devices at the point of connection. It is a technical preventive control used on wired switches and in enterprise Wi-Fi (WPA2-Enterprise and WPA3-Enterprise).

The three roles:
1. Supplicant: the client device (its 802.1X software) asking for access.
2. Authenticator: the switch or wireless access point that controls the port and relays messages.
3. Authentication server: usually a RADIUS (Remote Authentication Dial-In User Service) server that checks credentials and decides.

How a connection proceeds:
1. The port starts unauthorized. Only authentication frames pass (Extensible Authentication Protocol over LAN, EAPOL), plus a few switch housekeeping protocols on some products; ordinary user traffic is dropped.
2. The authenticator asks the supplicant for its identity, or the supplicant starts the exchange.
3. The authenticator wraps the messages in RADIUS and passes them to the authentication server, which proposes an EAP method that the supplicant accepts or answers with one it supports.
4. The method runs (certificates, or a password inside a protected tunnel).
5. On success the server tells the authenticator to authorize the port, often with a virtual LAN (VLAN) or policy for that user; on failure the port stays closed. Logging off returns the port to unauthorized.

**Why it matters:** an attacker who plugs a laptop into a lobby wall jack gets nothing, and every network login is tied to an identity and logged.

**Common confusions:** 802.1X is the access control framework. The Extensible Authentication Protocol (EAP) carries the credentials inside it. RADIUS carries the conversation from the authenticator to the server. Devices that cannot run 802.1X (printers, sensors) are often admitted by media access control (MAC) Authentication Bypass, which uses the MAC address as the credential; it is weaker because MAC addresses are easy to spoof, as is simple switch MAC limiting.

**Scenario:** A company must stop visitors from connecting their own laptops to conference room network jacks, while staff laptops connect automatically. The answer is 802.1X on the switch ports with a RADIUS server. MAC address filtering is the closest wrong answer: a visitor could copy a permitted MAC address.

### Extensible Authentication Protocol (EAP) methods: EAP-TLS, PEAP, EAP-TTLS, EAP-FAST
The Extensible Authentication Protocol is an authentication framework, not a single method: it carries whichever authentication method two parties agree on, so new methods can be added without changing the devices that relay them. In 802.1X it runs between the supplicant and the authentication server, with the switch or access point passing messages through. EAP itself adds no encryption or integrity, so the method chosen decides how strong the login is.

The common methods:
| Method | Credentials | Certificates needed | Notes |
|---|---|---|---|
| EAP-TLS | Certificates on both sides | Server and client | Mutual certificate authentication; strongest; the only method allowed in WPA3-Enterprise 192-bit mode |
| PEAP (Protected EAP) | Usually a password inside a Transport Layer Security (TLS) tunnel | Server only | Inner method often EAP-MSCHAPv2 |
| EAP-TTLS (Tunneled TLS) | Password or other inner method inside a TLS tunnel | Server only | Inner method can be EAP or non-EAP (even PAP) |
| EAP-FAST | Credentials inside a tunnel set up with a Protected Access Credential (PAC) | Not needed on clients | The PAC is a shared secret the server issues; a certificate can still be used for the tunnel |

How the tunneled methods work:
1. The client and server build a TLS tunnel. The client must validate the server's certificate.
2. The weaker inner credential (a password) travels only inside that tunnel.
3. Keys derived from the exchange protect the wireless or wired session.

**Why it matters:** a client that skips server certificate validation can be tricked by a rogue access point and Remote Authentication Dial-In User Service (RADIUS) server into handing over its password. Certificate-based EAP-TLS removes passwords from the exchange entirely, at the cost of managing a certificate for every device.

**Common confusions:** EAP is a framework; EAP-TLS, PEAP and the others are methods. PEAP and EAP-TTLS need only a server certificate; EAP-TLS needs client certificates too. EAP-MSCHAPv2 used alone is weak, so it should only run as an inner method.

**Scenario:** A bank wants Wi-Fi logins with no passwords at all, and already issues device certificates from its own certificate authority. The method is EAP-TLS. PEAP is the closest wrong answer: it protects the password in a tunnel, but it still uses a password.

### Web application firewall (WAF)
A web application firewall inspects HTTP and HTTPS (HTTP over Transport Layer Security) conversations between clients and a web application and blocks application-layer attacks such as Structured Query Language (SQL) injection, cross-site scripting and malformed requests. It sits directly in front of the web servers, often as a reverse proxy, and works at Layer 7. It protects the application, not the whole network.

How it works:
1. Traffic to the web app passes through the WAF (as a network appliance, a cloud service or a server plugin).
2. TLS is terminated so the WAF can read requests.
3. Rules check requests and responses: known attack patterns, input lengths and characters, allowed methods and paths.
4. Matching requests are blocked or logged; clean requests go on to the server.
5. Rules are tuned to the specific application and updated as the application changes, which takes ongoing effort.

**Why it matters:** it can shield a vulnerable application while developers fix the code, and version 4 of the Payment Card Industry Data Security Standard (PCI DSS) requires an automated solution in front of public-facing web applications that keeps detecting and blocking web attacks, a job a WAF commonly does. The standard describes the function and does not say the product must be a WAF.

**Common confusions:** A WAF is not a network firewall: it does not filter all ports and protocols, only web traffic for the apps behind it. It is not a substitute for secure code; it lowers risk while flaws exist. A next-generation firewall can identify web applications, but a WAF understands one web application's requests in depth.

**Scenario:** A legacy order form is vulnerable to SQL injection, and the fix will take three months. The interim control is a WAF in front of the server with rules blocking injection patterns. An intrusion detection system (IDS) on a mirror port is the closest wrong answer, because it would only alert while the attacks succeed.

### Unified threat management (UTM)
A unified threat management appliance combines many security functions in one box: firewall, intrusion detection and prevention, malware scanning, content and URL filtering, spam filtering and virtual private network (VPN) termination. It solves the problem of buying and running many separate devices, which is why small and medium organizations favor it. It is usually placed at the network edge.

How it works:
1. All traffic through the edge passes the UTM.
2. Each enabled module inspects the traffic in turn: firewall rules, then intrusion signatures, malware scanning, URL categories and so on.
3. One console sets policy for every module, and one log shows the results.

Trade-offs:
1. Simpler management and lower cost than separate devices.
2. A single point of failure: if the box fails, every function fails with it, so a redundant pair is wise.
3. Performance drops as more modules are switched on, since one set of processors does every job.
4. The box must have every feature the organization needs; a missing one means adding another device anyway.
5. Many older UTM firewalls filter by ports and addresses (Layer 4) rather than identifying applications; current products often add application awareness.

**Why it matters:** for a small office it gives broad coverage that would otherwise be unaffordable, but sizing matters: an undersized UTM with everything on can slow the whole office.

**Common confusions:** UTM describes bundling; a next-generation firewall (NGFW) describes application awareness. Modern products blur the line, but the working distinction is that a UTM is the all-in-one box for smaller sites, and an NGFW is the application-aware firewall for larger networks. A UTM is not a web application firewall: its web filtering controls users' outbound browsing, not attacks on your own web apps.

**Scenario:** A ten-person accounting office wants firewall, antivirus scanning, spam filtering and VPN from one affordable device with one console. The answer is a UTM appliance. An NGFW plus separate mail and VPN appliances is the closest wrong answer: it may be stronger, but it fails the simplicity and budget clues.

### Next-generation firewall (NGFW)
A next-generation firewall identifies and controls traffic by application, and often by user, rather than only by port and address, and it usually includes intrusion prevention, URL filtering and Transport Layer Security (TLS) decryption. It solves the problem that many different applications now share the same ports, especially 443. It is also called a deep packet inspection firewall or a Layer 7 firewall. Some textbooks add the labels application layer gateway and stateful multilayer inspection firewall, so accept them as loose synonyms, but strictly an application layer gateway is a proxy-style firewall that breaks the connection in two.

How it works:
1. Stateful inspection tracks each connection's state, as any modern firewall does.
2. Deep packet inspection and protocol analysis look at payloads to recognize the application (a video service, a file-sharing tool, a remote access tool) whatever port it uses.
3. Policy is written in application and user terms: allow the sales group to use the customer relationship app, block personal file sharing for everyone.
4. Optional TLS decryption lets it inspect encrypted traffic, then re-encrypt it.
5. Built-in intrusion prevention and URL categories add threat blocking in the same pass.

**Why it matters:** a port-based rule "allow 443 out" lets malware, unsanctioned cloud storage and remote access tools through; an NGFW can tell them apart and block the ones that break policy.

**Common confusions:** An NGFW protects the whole network edge; a web application firewall protects specific web apps from attacks against them. Decrypting traffic is powerful but has privacy, legal and performance costs, so policies usually exempt categories such as banking and health sites. Being application-aware does not make an NGFW a full intrusion detection system (IDS)/intrusion prevention system (IPS) replacement in every case; dedicated systems usually detect more.

**Scenario:** A company must allow its video conferencing service but block a personal video streaming site, and both use Transmission Control Protocol (TCP) port 443. The answer is an NGFW with application identification. A Layer 4 stateful firewall is the closest wrong answer: it sees only addresses and the shared port, so it cannot tell the two apart.

### Layer 4 vs Layer 7 firewalls (stateless, stateful and application-aware)
Firewalls are often described by the highest network layer they understand. A Layer 4 firewall filters on transport information: source and destination IP address, port and protocol (Transmission Control Protocol (TCP) or User Datagram Protocol (UDP)). A Layer 7 firewall understands the application data itself and can allow or block specific applications, commands or content. Both are technical preventive controls placed at zone boundaries.

How the generations build on each other:
1. Stateless packet filter: checks each packet alone against rules (an access control list on a router is the classic example). It cannot tell whether a packet belongs to a real session, so spoofed or crafted packets can slip through.
2. Stateful inspection (Layer 4): keeps a state table of connections (addresses, ports, connection state) and lets a packet in only if it matches an expected state, for example a reply to a request that went out. For UDP, which has no connection setup, it tracks address and port pairs instead.
3. Application-aware (Layer 7): adds analysis of the application protocol. It can block an executable email attachment, stop a file-write command on a file transfer server, or spot a chat program hiding on the web port.
4. Application proxy: goes further by terminating the connection and opening its own to the destination, so the two hosts never talk directly.

**Why it matters:** Layer 4 rules are fast and simple but cannot see what an allowed port carries. Layer 7 inspection catches far more, at the cost of processing power, latency and the need to decrypt.

**Common confusions:** "Stateful" is about tracking connections, not about reading application content; a stateful firewall can still be purely Layer 4. Both kinds should follow deny by default: block everything not explicitly allowed, inbound and outbound.

**Scenario:** An attacker sends a TCP packet marked as part of an established session, hoping the firewall lets it in. A stateful firewall drops it because no matching session exists in its state table. A stateless packet filter is the closest wrong answer, since it judges each packet alone and may accept it.

Worked example, in plain words rather than any vendor's syntax: a Layer 4 stateful rule says "allow TCP from 10.1.0.0/16 to any address on port 443, and allow the replies that belong to those sessions". It says nothing about which web application is used. A Layer 7 rule says "allow the customer relationship application for the sales group".

### Firewall types compared: WAF vs NGFW vs UTM vs Layer 4 firewall
These four types are compared because the right choice depends on what each one actually understands. WAF means web application firewall, NGFW next-generation firewall, UTM unified threat management.

| Type | What it understands | Protects | Typical placement | Decisive clue in a scenario |
|---|---|---|---|---|
| WAF | HTTP and HTTPS (HTTP over Transport Layer Security, TLS) requests to one application | Specific web apps | In front of web servers, often as a reverse proxy | Structured Query Language (SQL) injection, cross-site scripting, protect the website |
| NGFW | Applications and users regardless of port, plus intrusion prevention system (IPS) and URL filtering | Whole network edge or internal boundaries | Edge and core of larger networks | Two apps on the same port, application-level policy |
| UTM | Many bundled functions, often port-based filtering | Small or medium site | Single edge device | One box, one console, small budget |
| Layer 4 (stateful) | Addresses, ports, protocol, connection state | Basic boundary control | Anywhere fast filtering is needed | Allow or block by port and address only |

How to pick:
1. Is the threat aimed at your own web application? WAF.
2. Must policy distinguish applications or users on shared ports, at scale? NGFW.
3. Small site needing many functions simply and cheaply? UTM.
4. Simple, high-speed filtering by address and port? Layer 4.

**Why it matters:** each type leaves gaps the others fill, so larger organizations layer them: an NGFW at the edge and a WAF in front of public web apps.

**Common confusions:** A UTM's web filter controls where users browse; it does not protect your web server from injection. An NGFW identifies web applications but is not tuned to one app's inputs like a WAF.

**Scenario:** A small online shop asks for one device that guards its office network and a separate control that stops injection attacks on its storefront. The answer is a UTM at the office edge and a WAF in front of the storefront. Choosing only a UTM is the closest wrong answer, because its filtering does not inspect attacks on the shop's own application.

### Network appliances compared: IDS, IPS, proxy, load balancer, jump server, sensor
Network appliances are dedicated devices (physical, virtual or cloud) that each do one infrastructure security job. They are compared because a requirement usually describes the job, and the skill is naming the device that does it. IDS means intrusion detection system, IPS intrusion prevention system.

| Appliance | Job | Attachment | Can block? | Decisive clue |
|---|---|---|---|---|
| IDS | Detect and alert on attacks | Tap or mirror (passive) | No | Alert only, mirror port, no impact on traffic |
| IPS | Detect and stop attacks | Inline (active) | Yes | Drop malicious traffic automatically |
| Forward proxy | Make outbound requests for users, filter and log | Between users and internet | Yes, by policy | Control and log employee web use |
| Reverse proxy | Front servers for inbound requests | Between internet and servers | Yes, by policy | Hide servers, terminate Transport Layer Security (TLS), publish apps |
| Load balancer | Spread requests, remove failed servers | In front of server pool | Not its purpose | Keep the site up as servers fail or traffic peaks |
| Jump server | Single hardened entry point for administration | Edge of admin zone | Controls access | All admin sessions through one logged host |
| Sensor | Collect data for analysis | Tap, mirror, inline or host | No (collects) | Visibility gap, feed the security information and event management (SIEM) |

**Why it matters:** the device that fits the stated job is usually the answer, and its attachment explains its risks: inline devices can block but can fail traffic, passive devices cannot block but cannot break anything.

**Common confusions:** A reverse proxy and a load balancer overlap; the clue is whether the goal is protection and publishing (proxy) or spreading load (load balancer). A jump server controls who reaches systems; a virtual private network (VPN) controls how a remote device joins a network.

**Scenario:** A team needs to see suspicious traffic in the server zone without any chance of blocking legitimate requests during an audit period. The answer is an IDS fed by a tap. An IPS is the closest wrong answer, because inline blocking is exactly what the clue rules out.

### Virtual private network (VPN): site-to-site, remote access, full tunnel and split tunnel
A virtual private network builds an encrypted tunnel across a network you do not trust, usually the internet, so a remote user or a whole remote site behaves as if it were on the private network. It protects data in transit (confidentiality and integrity) and authenticates the ends. It is often terminated on a dedicated VPN concentrator or on the edge firewall.

Two architectures:
1. Site-to-site (gateway-to-gateway): a VPN gateway at each site builds a tunnel between the two networks. Users notice nothing and need no client software. Only the stretch between the gateways is protected, not traffic inside each site.
2. Remote access (host-to-gateway): each user's device runs a VPN client (or a browser, for clientless Transport Layer Security (TLS) VPNs) and authenticates to the organization's gateway. It needs per-user credential management and users must sign in.

Full tunnel vs split tunnel:
1. Full tunnel: all of the device's traffic, including internet browsing, goes through the VPN, so the organization's firewall and proxy filter it. More protective, more bandwidth for the company.
2. Split tunnel: only traffic for the organization goes through the VPN; internet traffic goes straight out. Saves bandwidth, but a compromised device is talking to the internet and the internal network at the same time, and an attacker could ride its tunnel inward. Security guidance strongly discourages split tunneling for that reason.

**Why it matters:** VPNs made remote work and branch links possible over cheap internet links, but a VPN gateway exposed to the internet is a favorite target: attackers harvest credentials from unpatched VPN devices. Patch them quickly and require multifactor authentication (MFA).

**Common confusions:** A VPN grants broad network access once connected; zero trust network access (part of `### Secure access service edge (SASE) and security service edge (SSE)`) grants access per application instead. A site-to-site VPN does not protect data on the local networks at either end. The tunnel technology underneath is usually Internet Protocol Security (IPSec) or TLS.

**Scenario:** Security wants every byte of remote employees' web browsing inspected by the corporate proxy while they are connected. The setting is full tunnel. Split tunnel is the closest wrong answer, because it sends internet traffic directly out, bypassing the proxy.

### Secure remote access (VPN, remote desktop, SSH and jump servers)
Remote access lets users and administrators reach internal systems from outside the network. The methods are virtual private networks (VPNs), remote desktop through a gateway, Secure Shell (SSH) and jump servers, plus newer per-application access services. Each method is an internet-facing door, so each needs strong authentication, encryption and monitoring.

How to secure it:
1. Require multifactor authentication (MFA) for every remote session.
2. Use encrypted protocols only: SSH, not Telnet; remote desktop wrapped in a gateway or VPN; Transport Layer Security (TLS) for web access.
3. Never expose the remote desktop protocol (RDP) directly to the internet; it has limited protection against password spraying. Publish it through a remote desktop gateway, a VPN or a cloud bastion service.
4. For SSH, change defaults and use keys instead of passwords, storing and rotating keys securely.
5. Patch remote access devices rapidly; they are exposed to the internet and often neglected.
6. Log sessions and limit who can use each path, with time-limited access for vendors.

**Why it matters:** exposed remote access is one of the most common ways into networks. Attackers scan the whole internet for open remote desktop and VPN logins and try stolen or common passwords.

**Common confusions:** Remote access is a need; VPN is one way to meet it. A jump server is a remote access intermediary for administrators, not a replacement for authentication: it still needs MFA and logging. Encrypting a session does not authenticate the user well; both are required.

**Scenario:** A clinic's server shows thousands of failed remote desktop logins from many countries each night. The right fix is to close the RDP port to the internet and require staff to connect through a VPN or remote desktop gateway with MFA. A stronger password policy alone is the closest wrong answer: it slows guessing but leaves the service exposed.

### Tunneling with Transport Layer Security (TLS VPN, SSL VPN)
Tunneling wraps one protocol inside another so traffic can cross a network privately, usually with encryption. Transport Layer Security (TLS) is the protocol behind HTTPS (HTTP carried over TLS), and a TLS virtual private network (VPN) uses it to build the tunnel, usually over Transmission Control Protocol (TCP) port 443 (see the Reference chapter for port tables). Many products still call it an SSL VPN, though the old Secure Sockets Layer (SSL) protocols are retired.

How a TLS VPN works:
1. The user connects with a light VPN client or, for clientless access, a web browser.
2. A TLS handshake authenticates the gateway with its certificate and sets up session keys.
3. The user authenticates (ideally with multifactor authentication (MFA)).
4. Traffic for internal resources flows inside the encrypted TLS session; clientless modes publish specific web applications rather than full network access.

Version status:
1. SSL 2.0 and SSL 3.0: legacy and broken; SSL 3.0 is formally prohibited, and endpoints must refuse to negotiate it or fall back to it.
2. TLS 1.0 and TLS 1.1: deprecated, must not be used.
3. TLS 1.2 and TLS 1.3: current.

**Why it matters:** because it uses the web port, a TLS VPN passes through almost every firewall, hotel network and proxy, which makes it the usual choice for remote users. The same property makes it easy to misuse: malware and unsanctioned tools also tunnel over port 443.

**Common confusions:** "SSL VPN" is a marketing name; the protocol in use should be TLS 1.2 or 1.3. TLS protects one session between endpoints, while Internet Protocol Security (IPSec) protects IP packets at the network layer. TLS can also carry IPSec traffic as a fallback when networks block IPSec's own ports.

**Scenario:** Contractors must reach two internal web applications from unmanaged laptops, and installing software is not allowed. The answer is a clientless TLS VPN published through the browser. An IPSec remote access VPN is the closest wrong answer, because it needs a client installed and grants broader network access than the clue allows.

### Internet Protocol Security (IPSec): AH, ESP, tunnel mode, transport mode and IKE
Internet Protocol Security is a suite that protects IP traffic at the network layer, adding authentication, integrity, encryption and replay protection to every packet. Because it works below the applications, it protects all traffic between two points without changing the applications. It is the most common technology for site-to-site virtual private networks (VPNs).

The parts:
1. Internet Key Exchange (IKE, current version IKEv2): authenticates the two ends (certificates, pre-shared keys or Extensible Authentication Protocol (EAP)) and negotiates keys and security associations. It uses User Datagram Protocol (UDP) port 500, and moves to UDP port 4500 when a network address translation (NAT) device is detected, wrapping the traffic in UDP so it survives NAT.
2. Encapsulating Security Payload (ESP): encrypts the payload and protects its integrity; it can also run with integrity only.
3. Authentication Header (AH): integrity and authentication only, no encryption. It is optional to implement and often unavailable. The NIST guide to IPSec VPNs discourages AH and recommends ESP with null encryption (integrity only) when encryption is not wanted, so treat AH as a part of the suite to recognize, not one to deploy.
Both AH and ESP can reject replayed packets.

Two modes:
1. Tunnel mode: the whole original packet, header included, is encrypted and placed inside a new packet whose header names the two gateways. Observers cannot see who is really talking. Used for site-to-site and remote access.
2. Transport mode: only the payload is protected and the original IP header stays. Used host to host.

**Why it matters:** IPSec protects every application between two sites at once, including protocols that have no encryption of their own.

**Common confusions:** AH does not encrypt; ESP does. Tunnel mode hides the original addresses; transport mode does not. IKE is the key negotiation, not the data protection. Firewalls that block ESP or the IKE ports will silently stop IPSec VPNs.

**Scenario:** Two offices need all traffic between them encrypted, including an old inventory system that cannot use Transport Layer Security (TLS). The answer is a site-to-site IPSec VPN in tunnel mode with ESP. AH in tunnel mode is the closest wrong answer, because AH provides no confidentiality.

Worked example of a capture: `UDP 192.0.2.1:4500 > 198.51.100.9:4500 ESP spi=0x2a1f seq=118`. Port 4500 shows NAT traversal is in use, and the ESP sequence number is what the receiver checks to reject replayed packets.

### TLS VPN vs IPSec VPN (comparison)
Both build encrypted tunnels, so the useful contrast is where they work and what they protect. TLS means Transport Layer Security, IPSec means Internet Protocol Security, VPN means virtual private network.

| Factor | TLS VPN | IPSec VPN |
|---|---|---|
| Layer | Above the transport layer, one session at a time | Network layer, every IP packet |
| Typical use | Remote users, browser or light client | Site-to-site, full remote network access |
| Client | Browser (clientless) or light client | Client software or gateway device |
| Ports | Usually Transmission Control Protocol (TCP) 443, passes most firewalls | User Datagram Protocol (UDP) 500 and 4500 plus Encapsulating Security Payload (ESP); can be blocked |
| Access granularity | Often per application | Whole network ranges |
| Old versions to avoid | Secure Sockets Layer (SSL) 2.0 and 3.0, TLS 1.0 and 1.1 | Authentication Header used alone when confidentiality is needed |

How to choose:
1. Branch to headquarters, all traffic, no user interaction: IPSec site-to-site.
2. Remote user on hotel or guest networks, browser only, specific apps: TLS VPN.
3. Remote user needing full network access with a managed laptop: either, with IPSec common and TLS useful where IPSec ports are blocked.

**Why it matters:** picking the wrong one either fails on restricted networks or grants far more access than needed.

**Common confusions:** Both encrypt strongly when configured with current versions; neither is simply "more secure". Some IPSec clients fall back to TCP or TLS encapsulation when UDP is blocked.

**Scenario:** Sales staff on airport Wi-Fi cannot connect to the company VPN because the network blocks everything except web traffic. A TLS VPN over port 443 solves it. Switching the IPSec VPN to transport mode is the closest wrong answer, since the mode does not change which ports the network blocks.

### Software-defined wide area network (SD-WAN)
A software-defined wide area network connects sites and clouds over several kinds of links at once (broadband internet, cellular, private circuits such as Multiprotocol Label Switching (MPLS)) and uses central software to steer each kind of traffic over the best path in real time. It solves the cost and slowness of sending all branch traffic over expensive private circuits back to headquarters, especially now that many applications live in the cloud. It is a connectivity technology first.

How it works:
1. An SD-WAN device at each branch connects to several links.
2. A central controller pushes policy to all branch devices: which applications go over which links, and what quality each needs.
3. The devices measure link quality continuously and move traffic when a link degrades or fails.
4. Cloud-bound traffic can go straight to the internet from the branch instead of being backhauled through the data center.
5. Traffic between sites is usually carried in encrypted tunnels (often Internet Protocol Security (IPSec)) that the controller sets up.

**Why it matters:** branches get resilient, cheaper connectivity and better cloud performance. But sending traffic straight out from each branch means each branch now needs security inspection that headquarters used to provide.

**Common confusions:** SD-WAN is not a full security stack; it is smart connectivity with encrypted links. Adding cloud-delivered security to it is what makes secure access service edge (SASE). SD-WAN is also distinct from software-defined networking (SDN) inside a data center, though both use a central controller.

**Scenario:** A retailer's stores lose access to their cloud point-of-sale system whenever their single private circuit fails, and the circuit is costly. The answer is SD-WAN using broadband and cellular links with automatic path selection. A site-to-site virtual private network (VPN) over the same single circuit is the closest wrong answer, because it adds encryption but not path diversity.

### Secure access service edge (SASE) and security service edge (SSE)
Secure access service edge is a cloud-delivered architecture that combines software-defined wide area network (SD-WAN) networking with a set of security services, so every user, branch and device gets the same protection wherever it connects. The security half alone is called security service edge (SSE). It fits a world where users work from anywhere and applications live in the cloud, and it supports zero trust principles.

The usual building blocks:
1. SD-WAN for connectivity and path selection.
2. Secure web gateway (SWG): filters web traffic, URL categories and malware for users anywhere.
3. Cloud access security broker (CASB): gives visibility and control over the use of cloud applications.
4. Zero trust network access (ZTNA): grants access to specific private applications per user and per session after checking identity and device, instead of putting users on the whole network.
5. Firewall as a service (FWaaS): firewall policy delivered from the provider's cloud.

How it works for a user:
1. The user's device or branch connects to the nearest provider point of presence.
2. Identity and device posture are checked.
3. Policy is applied in the cloud: web filtering, application access, data controls.
4. Traffic goes to the permitted destination without backhauling through a head office.

**Why it matters:** one policy follows users everywhere, the organization runs fewer separate boxes, and access is limited to approved applications rather than the whole network. The trade-off is dependence on the provider and its availability.

**Common confusions:** SD-WAN alone does not provide SWG, CASB, ZTNA or FWaaS. SSE is SASE without the networking part. SASE is a model and a set of services, not a single appliance in your building.

**Scenario:** A company with no head office wants employees in many countries to get web filtering, cloud app control and private app access under one policy, without backhauling traffic. The answer is SASE. SD-WAN is the closest wrong answer: it improves the links but adds none of the security services.

### SD-WAN vs SASE vs traditional VPN (comparison)
These three are compared because each answers "how do remote people and sites connect securely" differently. SD-WAN means software-defined wide area network, SASE secure access service edge, VPN virtual private network.

| Factor | Traditional VPN | SD-WAN | SASE |
|---|---|---|---|
| Main purpose | Encrypted tunnel to the private network | Smart, resilient site connectivity | Connectivity plus cloud-delivered security for any user or site |
| Security services included | Encryption and authentication only | Encrypted tunnels, little else | secure web gateway (SWG), cloud access security broker (CASB), zero trust network access (ZTNA), firewall as a service (FWaaS) |
| Access granted | Usually broad network access | Site-to-site paths | Per application, per user (ZTNA) |
| Where inspection happens | At the head office firewall (if full tunnel) | Wherever you add it | In the provider's cloud |
| Best clue | Remote user or branch needs a secure tunnel | Several links, path selection, cloud apps from branches | Users anywhere, one policy, security from the cloud |

**Why it matters:** choosing SD-WAN where the need is security, or a VPN where the need is per-application access, leaves the stated problem unsolved.

**Common confusions:** SASE often replaces remote access VPNs with ZTNA but can still use encrypted tunnels underneath. SD-WAN and SASE both use central control, but only SASE bundles the security services.

**Scenario:** Branches already have SD-WAN, and the security team now wants the same web filtering and app controls for branch staff and home workers without new boxes at each branch. The next step is SASE, reached by adding security service edge (SSE) services. Another SD-WAN controller is the closest wrong answer, since the missing piece is security services, not connectivity.

### Selection of effective controls for enterprise infrastructure
Selecting effective controls means choosing, for a stated threat or need, the control that actually acts on that risk, delivered by the right category, placed where it sees the traffic, and layered with others so one failure does not leave the asset exposed. It is how every other part of this objective comes together in a scenario.

How to select, step by step:
1. Name the asset and the threat in the scenario (web app attacked, devices plugged in, admins reaching servers, data crossing the internet).
2. Name the control type the verb asks for: stop it beforehand (preventive), notice it (detective), repair or restore (corrective), discourage it (deterrent), compensate for something impossible (compensating), or instruct people (directive). Control categories and types are defined in objective 1.1.
3. Pick the category that can deliver it: technical, managerial, operational or physical.
4. Place it where it sees the traffic or the people involved (see `### Device placement for security appliances`).
5. Decide its attachment and failure mode, weighing performance and availability.
6. Layer it: add a detective control behind a preventive one, and a compensating control where the ideal one is impossible.
7. Check cost against the value protected and the business impact.

**Why it matters:** the right product in the wrong place, or a strong control that breaks a critical business flow, fails as surely as no control at all.

**Common confusions:** The most powerful control is not always the right answer; the one that matches the stated priority is. A compensating control is chosen because the primary control cannot be used, not because it is cheaper. Defense in depth means different kinds of controls in layers, not two copies of the same one.

**Scenario:** A plant's legacy controller cannot be patched, must never be blocked by a misfiring security device, and needs its traffic watched. The selection is segmentation (compensating, preventive) plus a passive intrusion detection system (IDS) on a tap (detective). An inline intrusion prevention system (IPS) in front of the controller is the closest wrong answer: it could block legitimate control traffic, which the clue forbids.

### Choosing an enterprise infrastructure control (decision path)
This decision path turns common scenario goals in this objective into a control and says when that control is the wrong pick. IPS means intrusion prevention system, IDS intrusion detection system, WAF web application firewall.

| Goal or constraint in the scenario | Choose | Do not choose it when |
|---|---|---|
| Unknown devices must not join wired or Wi-Fi networks | 802.1X with Extensible Authentication Protocol (EAP) and Remote Authentication Dial-In User Service (RADIUS) | Devices cannot run a supplicant (use segmentation or media access control (MAC) bypass with care) |
| Protect a website from injection and scripting attacks | WAF in front of the app | The threat is network-wide or not web traffic |
| Allow one app and block another on the same port | Next-generation firewall | Only simple address and port rules are needed |
| One cheap box with many functions for a small office | unified threat management (UTM) | Traffic volume is high or a single point of failure is unacceptable |
| Drop attacks automatically | Inline IPS | Any blocking of legitimate traffic is unacceptable (use IDS) |
| Watch traffic with zero impact | IDS or sensor on a tap | The requirement says the attack must be stopped |
| All admin access through one logged point | Jump server | Users, not admins, need general network access |
| Keep a service up when servers fail | Load balancer (redundant) | The application cannot share load across independent servers (consider clustering) |
| Device failure must not stop business | Fail-open | Unfiltered traffic is worse than downtime |
| Nothing unchecked may ever pass | Fail-closed | An outage would stop critical operations |
| Encrypt all traffic between two offices | Internet Protocol Security (IPSec) site-to-site virtual private network (VPN) | Users need browser-only access to a few apps |
| Remote users on restrictive networks, browser only | Transport Layer Security (TLS) VPN | Whole-network access between sites is required |
| Several cheap links, best path, cloud apps | software-defined wide area network (SD-WAN) | Security inspection is the missing piece |
| Users anywhere, one cloud-delivered security policy | secure access service edge (SASE) | The organization only needs to join two fixed sites |

**Why it matters:** scenarios usually hide one decisive constraint (budget, availability, browser only, cannot block). Finding it picks the control.

**Common confusions:** When two answers both work, the stated priority decides: availability points to fail-open, IDS and redundancy; confidentiality points to fail-closed, IPS and stricter access.

**Scenario:** A new branch has three cheap internet links, cloud-based applications and no on-site IT staff, and head office wants consistent security too. The best answer is SASE, which brings SD-WAN plus the security services. SD-WAN alone is the closest wrong answer, since the security requirement would stay unmet.

## 3.3 Protecting data: types, labels, states and methods
Depth asked: compare and contrast. A good answer tells data types (what the data is) from classifications (how sensitive it is), names the state data is in and the protection that fits it, and picks the protection method by whether the original must be recoverable.

### Regulated data (personal data, health data and cardholder data)
Regulated data is data whose handling is governed by law or by binding industry rules. The common kinds are personally identifiable information (PII), protected health information (PHI) and payment cardholder data. The rules set minimum controls, and mishandling brings fines, lawsuits and mandatory breach notifications.

Common regimes, by data kind:
1. PII: privacy laws such as the European Union's General Data Protection Regulation (GDPR) and many national and state laws. GDPR also limits transfers of personal data out of the EU to places that keep the same level of protection.
2. PHI: health privacy law such as the US Health Insurance Portability and Accountability Act (HIPAA).
3. Cardholder data: the Payment Card Industry Data Security Standard (PCI DSS), an industry contract standard rather than a law.
4. Public company financial reporting: laws such as the US Sarbanes-Oxley Act (SOX) (see `### Legal information and financial information (data types)`).

How to handle it:
1. Discover where regulated data lives (data inventories, discovery tools).
2. Map each data set to the rules that apply.
3. Apply the required controls: access restrictions, encryption, logging, retention limits, transfer limits.
4. Reduce scope where possible, for example by tokenizing card numbers so fewer systems hold them.
5. Be ready for audits and breach notification deadlines.

**Why it matters:** the same breach costs far more when the data is regulated, because penalties, notification and audits add to the incident cost.

**Common confusions:** Regulated is a data type (what rules apply), not a classification label (how sensitive the organization rates it), though regulated data usually gets a high label. One record can be regulated under several regimes at once. Compliance sets a minimum; it does not guarantee security.

**Scenario:** A clinic's appointment database holds patient names and diagnoses, and a breach is discovered. The data type is regulated data (PHI), which triggers legal notification duties. Calling it simply "confidential" is the closest wrong answer: that is a classification label, while the issue here is what kind of data it is and which rules apply.

### Trade secrets and intellectual property (data types)
Intellectual property (IP) is the umbrella for creations of the mind that a person or company owns: software code, designs, inventions, brands and written works, protected legally by copyright, trademarks and patents. A trade secret is a form of IP protected only by being kept secret: confidential business information with commercial value because it is not known, such as formulas, manufacturing processes, test data, source code, supplier and customer lists.

How trade secret protection works:
1. The information must have value because it is secret.
2. Only a limited group knows it.
3. The owner takes reasonable steps to keep it secret: confidentiality agreements (NDAs), need-to-know access, IT security controls, marked documents.
Lose any of these and legal protection can be lost.

How the other IP forms differ:
1. Patents are published in exchange for an exclusive right for a period, so the invention is public but protected.
2. Copyright protects the expression of a work (code, text), not the idea.
3. Trademarks protect brand names and marks.

**Why it matters:** IP theft is a leading motive for espionage, and a trade secret, once disclosed, may never be recoverable: a rival who learns it legitimately, by independent invention or reverse engineering, can use it freely.

**Common confusions:** Trade secrets are not registered and not published; patents are both. Security controls matter most for trade secrets because secrecy is the whole protection. A combination of public pieces can itself be a trade secret if the combination is kept secret.

**Scenario:** A beverage maker's recipe has never been patented, and only three employees under NDAs know it. The data type is a trade secret. A patent is the closest wrong answer, because a patent would have required publishing the recipe.

### Legal information and financial information (data types)
Legal information is data about legal matters: contracts, court filings, case files, settlement terms and communications with lawyers. Financial information is data about money: company accounts and forecasts, payroll, bank details and customer payment card data. Both are high-value targets with special handling duties.

Handling duties:
1. Legal information is often privileged (attorney-client communications) and confidential, and may fall under a legal hold, which forbids deleting or altering it while litigation is expected or under way.
2. Some legal records, such as many court filings, are public, so not all legal information is secret.
3. Financial information is a prime fraud target. Customer card data falls under Payment Card Industry Data Security Standard (PCI DSS), and public companies' financial reporting falls under laws such as the US Sarbanes-Oxley Act (SOX), which stress the integrity of financial records.
4. Both need strict access control, audit logging and retention rules.

**Why it matters:** destroying data under a legal hold can lead to court sanctions even if deletion was routine; altered financial records can mislead investors and regulators.

**Common confusions:** Financial information includes both internal company finances and customer payment data; the second is also regulated data. Integrity is often the leading concern for financial records, not only confidentiality. A legal hold overrides normal retention and deletion schedules.

**Scenario:** During a lawsuit, an administrator runs the usual 90-day email purge on the custodians' mailboxes. The problem is a violation of a legal hold on legal information. Calling it a data sovereignty issue is the closest wrong answer: sovereignty concerns which country's law governs data location, not preservation during litigation.

### Human-readable vs non-human-readable data
Human-readable data can be read directly by a person: documents, emails, spreadsheets, plain text. Non-human-readable data needs a machine or software to interpret it: barcodes, QR codes, images, binary files, compressed or encoded content and database files. Both can hold sensitive information, but they need different discovery and inspection.

How the difference affects protection:
1. Data loss prevention (DLP) and discovery tools find human-readable patterns (card numbers, national ID formats) easily.
2. Non-human-readable data must be decoded first: a QR code, an image of a document, a compressed archive or Base64-encoded text can carry the same card number past a simple pattern rule.
3. Optical character recognition, file type detection and decoding steps close the gap.

**Why it matters:** attackers and careless insiders move data in forms that simple filters cannot read, so a DLP policy built only for plain text leaves a hole.

**Common confusions:** Encoding is not encryption: Base64 or a QR code can be decoded by anyone with no key. Non-human-readable does not mean protected. Obfuscation that only changes format slows people, not software.

**Scenario:** An employee photographs a customer list and emails the image, and the DLP system that blocks card numbers in text does not trigger. The gap is non-human-readable data that the DLP cannot inspect without optical character recognition. Encryption of the email is the closest wrong answer, because the issue is detection of sensitive content, not confidentiality in transit.

### Data classification labels: public, private, sensitive, confidential, restricted, critical
A data classification is a label that says how sensitive or important data is and therefore how it must be handled: who may access it, whether it must be encrypted, how long it is kept and how it is destroyed. Each organization defines its own scheme; the data owner assigns the label and the label drives the controls.

Typical meanings of the listed labels:
| Label | Meaning | Main concern |
|---|---|---|
| Public | Meant for anyone; disclosure causes no harm (also called unclassified) | Integrity only (no defacement) |
| Private | Restricted access needing extra rights, sometimes a non-disclosure agreement (NDA); often personal information about staff or customers | Confidentiality |
| Sensitive | Harmful if disclosed, such as personally identifiable information (PII), protected health information (PHI) and intellectual property | Confidentiality |
| Confidential | Disclosure would seriously harm the organization or people; access needs specific approval | Confidentiality |
| Restricted | Tightest access, only named people, often with an NDA; severe damage if disclosed | Confidentiality |
| Critical | The organization cannot operate without it | Availability and integrity |

How labels are used:
1. The data owner assigns the label when data is created or acquired.
2. Users mark documents and systems so the label is visible.
3. Controls follow the label automatically where possible (encryption, data loss prevention (DLP) rules, access groups).
4. Labels are reviewed, since sensitivity changes over time.

Government schemes differ: in the US, classified information has three levels, top secret (exceptionally grave damage), secret (serious damage) and confidential (damage), and anything else is unclassified.

**Why it matters:** without labels, every file gets the same protection, which is either too weak for the crown jewels or too costly for everything else.

**Common confusions:** Critical is about availability and integrity, while most other labels are about confidentiality. Sensitive, confidential, private and restricted overlap, and some textbooks group private with classified and restricted, so check how the organization's own policy defines each label. A data type (regulated, trade secret) is not a label.

**Scenario:** A payroll database must be online on payday or salaries are not paid, and must not be wrong. The fitting label is critical. Confidential is the closest wrong answer: payroll is confidential too, but the clue stresses availability and correctness.

### Data types vs data classifications (comparison)
A data type says what the data is and which rules apply to it. A data classification says how sensitive or important the organization rates it and how it must be handled. The two lists are easy to mix because both are short sets of adjectives applied to the same records.

| | Data type | Data classification |
|---|---|---|
| Answers the question | What kind of data is this? | How carefully must we handle it? |
| Listed values | Regulated data, financial and legal information, intellectual property and trade secrets, plus the human-readable or non-human-readable form | Sensitive, confidential, public, restricted, private, critical |
| Who decides | Law, contract and the nature of the data | The organization's policy, applied by the data owner |
| What it drives | Which laws and standards apply | Which controls apply (access, encryption, retention) |

How they connect:
1. Identify the type first, because law may set a minimum handling level.
2. Assign a classification label at least as strict as the type requires.
3. Apply the controls the label calls for.

**Why it matters:** a customer list can be a trade secret (type) labelled confidential (classification); a press release is public (classification) but still intellectual property (type). Mixing the two leads to wrong controls or missed legal duties.

**Common confusions:** One record can have several types at once (a card payment record is financial and regulated) but normally carries one classification label. "Confidential" as a label is not the same as the US government classified level of the same name.

**Scenario:** A draft data policy lists "regulated, restricted, trade secret, critical" under the heading of classification labels. Only restricted and critical belong there. Picking regulated is the closest wrong answer: regulated describes the kind of data and the rules on it, not a sensitivity label.

### Data states: at rest, in transit and in use
Data is always in one of three states, and each state needs its own protection. Data at rest is stored. Data in transit (in motion) is moving across a network. Data in use is being processed in memory. A protection that covers one state does nothing for the others.

| State | Where it is | Main protections | Typical threat |
|---|---|---|---|
| At rest | Disks, databases, backups, removable media, cloud storage | Full-disk, volume, file or database encryption; access permissions | Stolen laptop, drive or backup tape; exposed storage bucket |
| In transit | Crossing wired, wireless or internet links | Transport Layer Security (TLS), Internet Protocol Security (IPSec), virtual private networks (VPNs), Secure Shell (SSH) | Sniffing and on-path interception |
| In use | Random access memory (RAM), central processing unit (CPU) caches and registers | Trusted execution environments (secure enclaves), memory protection, strict access limits | Memory scraping malware, a malicious administrator |

How to reason about a scenario:
1. Ask where the data is at the moment of the threat: on a disk, on a wire, or in a running process.
2. Pick the protection for that state.
3. Check the other two states, since data moves through all three in normal use.

**Why it matters:** a database encrypted on disk is still readable in memory while queries run, and still crosses the network in the clear unless the connection is also encrypted.

**Common confusions:** Backups and removable media are data at rest. Full-disk encryption protects a powered-off stolen device, not a running system an attacker has logged in to. Data in use is the hardest state to protect, because it normally must be decrypted to be processed.

**Scenario:** Malware on a point-of-sale terminal copies card numbers during the instant they are processed, even though the store encrypts its disks and its network links. The state attacked is data in use. Data at rest is the closest wrong answer: the disk encryption was in place and was not what failed.

### Data in use and trusted execution environments (secure enclaves)
Data in use is data held in memory while a program works on it. It is usually in plaintext at that moment, so anyone who can read the machine's memory, including malware or a privileged operator, can read it. Confidential computing closes this gap by doing the computation inside a hardware-based trusted execution environment (TEE), often called a secure enclave.

How a TEE protects data in use:
1. The processor creates an isolated area of memory that the operating system, the hypervisor and administrators cannot read or change.
2. Code and data are loaded into it, and data is decrypted only inside it.
3. Attestation proves to a remote party that the genuine hardware and the expected code are running before secrets are released to it.
4. Results leave the enclave encrypted or through a controlled interface.

**Why it matters:** it lets an organization process sensitive data on infrastructure it does not fully trust, such as a public cloud, because even the cloud operator cannot see the data while it is processed. Combined with encryption at rest and in transit, it covers all three states. It also protects cryptographic keys while they are used.

**Common confusions:** A secure enclave protects data during processing; a hardware security module or trusted platform module protects keys at rest and performs key operations (those are objective 1.4 material). Encryption at rest does not help once the data is loaded into memory. Phones use a similar idea: a payment wallet keeps its device-specific account number in a separate secure chip.

**Scenario:** A hospital wants to analyze patient records in a public cloud but must ensure that the provider's administrators cannot view the records even while the analysis runs. The answer is a trusted execution environment. Full-disk encryption is the closest wrong answer, because it protects stored data and not data in memory.

### Data sovereignty (laws that follow data location)
Data sovereignty is the principle that data is subject to the laws of the country or region where it is stored or collected. It is a legal concept, and it decides which government's rules on privacy, access and transfer apply. Some laws go further and require certain data to stay inside national or regional borders.

How it shapes architecture:
1. Find out which laws apply to each data set: where the people it describes live and where it will be stored and processed.
2. Choose storage and processing locations accordingly. Cloud customers can usually pick the country or region even though they cannot see the exact hardware.
3. Check every copy: backups, replicas, disaster recovery sites, logs and support access from abroad all count as locations.
4. Control transfers: under the EU's General Data Protection Regulation (GDPR), personal data may leave for another country only under set conditions, so that protection travels with the data.
5. Record the decisions for audits.

**Why it matters:** a backup replicated to a region in another country can break the law even if nobody ever reads it, and the cure (moving and re-architecting data) is expensive after the fact.

**Common confusions:** Sovereignty is about legal jurisdiction; geolocation is about physically locating a device, user or data. Geographic dispersion for resilience can conflict with sovereignty, so recovery sites are often chosen inside the same legal region. Encrypting data does not remove sovereignty duties.

**Scenario:** A German retailer's cloud provider offers cheaper disaster recovery in a region outside the EU. The concern that must be checked first is data sovereignty over customer personal data. Latency is the closest wrong answer: it matters for performance, but the legal restriction decides whether the option is allowed at all.

### Geolocation and geographic restrictions (geofencing)
Geolocation is working out where a device, user or piece of data physically is, using Global Positioning System (GPS), IP address ranges, Wi-Fi networks or mobile cell data. Geographic restrictions use that information as a control: access is allowed or blocked by country, region or a defined area, the last being called geofencing.

How they are used:
1. Location-based access policy: block sign-ins from countries where the organization has no staff, or require extra verification from unusual places.
2. Impossible travel detection: two sign-ins from places too far apart for the time between them suggest that someone else is using the credentials. Sign-ins from anonymizing services are flagged similarly.
3. Geofencing: a mobile device unlocks certain data or features only inside a set area, such as a hospital campus.
4. Data residency: restricting where data may be stored or accessed from supports data sovereignty compliance.

**Why it matters:** location is a cheap, useful signal that stops many automated attacks from abroad and helps meet legal duties about where data may go.

**Common confusions:** Geolocation finds the location, geographic restriction acts on it, and data sovereignty is the law about it. IP-based location is easy to fake with a virtual private network (VPN), a proxy or an anonymity network, so geographic restrictions should be one layer among others and never the only control. Blocking a country does not stop an attacker who rents a server inside an allowed country.

**Scenario:** An account signs in from Toronto and, twenty minutes later, from Singapore. The detection that flags this is impossible travel, based on geolocation. Geofencing is the closest wrong answer: it limits use to a defined area but is not the analysis that compares two sign-in locations over time.

### Data sovereignty vs geolocation vs geographic restrictions (comparison)
Three location terms appear in this objective and are easy to swap.

| Term | What it is | Kind of thing | Example |
|---|---|---|---|
| Data sovereignty | Data is governed by the laws of the place where it is stored or collected | Legal principle | Citizens' records must stay in the country |
| Geolocation | Determining physical location from Global Positioning System (GPS), IP address, Wi-Fi or cell data | Technique and data consideration | Knowing a sign-in came from another continent |
| Geographic restrictions (geofencing) | Allowing or blocking access based on location | Method to secure data | Blocking logins from countries with no staff |

How they chain together: sovereignty states the requirement, geolocation supplies the fact, and geographic restrictions enforce a rule based on that fact.

**Why it matters:** a compliance answer (which law applies) and a technical answer (which control blocks access) are different, and a requirement usually calls for only one of them.

**Common confusions:** Sovereignty is not a control you switch on; it is a constraint you must design for. Geolocation alone protects nothing until a policy uses it.

**Scenario:** A policy says "customer records of this country may be stored only in data centers inside its borders". The concept is data sovereignty. Geographic restrictions is the closest wrong answer: that term describes blocking or allowing access by location, while the clue is a legal rule about where data is stored.

### Encryption as a method to secure data
Encryption turns readable plaintext into unreadable ciphertext with an algorithm and a key, so only someone holding the right key can turn it back. It protects confidentiality and is the main protection for data at rest and in transit. It is reversible by design, which separates it from hashing.

How it is applied to data:
1. Choose the scope for data at rest: full disk or volume (protects a lost or stolen device), file or folder, database or single column (protects specific sensitive fields even from some administrators).
2. Choose transport encryption for data in transit: Transport Layer Security (TLS) for application sessions, Internet Protocol Security (IPSec) or a virtual private network (VPN) for whole links.
3. Symmetric encryption (one shared key, for example Advanced Encryption Standard (AES)) does the bulk work because it is fast; asymmetric encryption (a key pair, for example Rivest-Shamir-Adleman (RSA) or elliptic curve) exchanges keys and proves identity. Algorithm details belong to objective 1.4, and sizes are in the Reference chapter.
4. Manage the keys: generate them safely, store them apart from the data, limit who can use them, rotate them and back them up.

**Why it matters:** properly encrypted data that is stolen is useless to the thief, and many breach laws treat it more lightly. But the protection is only as good as the key handling: a key stored beside the data protects nothing, and a lost key means the data is gone for good.

**Common confusions:** Encryption is reversible with the key; hashing is not reversible at all. Encryption hides content but does not control who is allowed to hold the key, so it complements permissions rather than replacing them. Encrypting data at rest does not protect it in transit or in use.

**Scenario:** A laptop with customer contracts is stolen from a car. The control that makes the theft a hardware loss instead of a data breach is full-disk encryption. A strong login password is the closest wrong answer, because the thief can remove the drive and read it in another computer.

### Hashing as a method to secure data
Hashing runs data of any size through a one-way function that outputs a fixed-length value called a digest. The same input always gives the same digest, a tiny change in input gives a very different digest, and the original cannot be worked back from it. It protects integrity and is the right way to store passwords.

How it is used:
1. Integrity checking: compute a file's digest, compare it later or against the publisher's value; any change shows as a mismatch.
2. Password storage: store a digest of each password, never the password. At sign-in, hash what the user types and compare.
3. Add a salt: a unique random value per password, mixed in before hashing, so identical passwords give different digests and precomputed tables (rainbow tables) are useless.
4. Use a deliberately slow password hashing function with a tunable work factor (Argon2id, scrypt, bcrypt or PBKDF2), so each guess costs an attacker time. Settings are in the Reference chapter.
5. Optionally add a pepper: a secret value kept outside the database, so a stolen database alone is not enough.

**Why it matters:** if a password database leaks, salted slow hashes buy time and protect users with strong passwords; plain or fast unsalted hashes are cracked in bulk.

**Common confusions:** Hashing is not encryption: there is no key and no way back. Every hash function has collisions in theory, since outputs are fixed length; MD5 and SHA-1 are broken or retired because collisions can be found in practice, so they are legacy and must not be used for signatures. SHA-256 and the rest of the SHA-2 and SHA-3 families are current. A fast general hash such as SHA-256 alone is a poor password store; a purpose-built slow function is the right tool.

**Scenario:** A site must let users sign in without the company ever being able to read their passwords. The answer is salted hashing with a slow password hashing function. Encrypting the passwords is the closest wrong answer: encryption is reversible, so anyone with the key, including an attacker who steals it, can recover every password.

Worked example: the digest of the text "invoice-0042 total 310.00" changes completely if the total becomes 810.00, so the receiver who compares digests detects the edit, but cannot rebuild the invoice from the digest.

### Data masking as a method to secure data
Masking hides all or part of a data value by replacing characters with symbols or realistic fake values, so people and systems see only what they need. It limits exposure on screens, receipts, reports, support tools and test systems. It is a confidentiality control aimed at viewers, not at thieves of the underlying storage.

Two forms:
1. Dynamic masking: the stored data is unchanged, and a rule masks it in query results for users without the right to see it. A support agent sees `XXXX-XXXX-XXXX-4321`; a privileged role sees the full value.
2. Static masking: a copy of the data is permanently altered, for example a test database where names and numbers are replaced with fictional ones, so developers never handle real data.

How to apply it:
1. Decide which fields are sensitive and who truly needs the full value.
2. Define the mask per field (show last four digits, show first letter of an email, replace with a random number in a range).
3. Grant the unmask right to as few roles as possible.
4. Keep the other controls: permissions, auditing and encryption.

**Why it matters:** most staff need to confirm a value, not read it. Masking cuts the number of people who ever see full card or identity numbers, which shrinks insider risk and shoulder surfing.

**Common confusions:** Dynamic masking changes what is shown, not what is stored, so it does not protect the database if it is stolen. It is not a substitute for encryption or permissions: a user allowed to run free-form queries can infer masked values by testing guesses. Masking differs from tokenization, which replaces the stored value itself.

**Scenario:** Call center staff must verify a caller by the last four digits of a card but must never see the whole number. The answer is masking. Tokenization is the closest wrong answer: a token would hide the entire number, leaving nothing for the agent to match against.

### Tokenization of sensitive data (token vault)
Tokenization replaces a sensitive value, most often a payment card number, with a stand-in value, the token. The real value is kept in a secured token vault, and getting it back (de-tokenization) is possible only by asking the tokenization system, which authenticates the requester. Systems that hold only tokens hold nothing worth stealing.

How it works:
1. An application sends the card number to the tokenization system.
2. The system generates a token, typically a random value with no mathematical relationship to the card number, often in the same format so existing systems accept it.
3. The pairing is stored in the vault; the application stores only the token.
4. For a refund or repeat charge, an authorized system presents the token and the tokenization system uses or returns the real number.
5. The vault and tokenization system are isolated, access-controlled and logged, since they now hold everything.

Token kinds: a single-use token stands for one transaction; a multi-use token always maps the same card to the same token, which lets a merchant recognize a returning customer.

**Why it matters:** fewer systems touch real card numbers, so a merchant's Payment Card Industry Data Security Standard (PCI DSS) compliance effort shrinks and a breach of the merchant's systems yields useless tokens. Compliance duties do not vanish, and the tokenization system itself stays in scope.

**Common confusions:** A vault token is not derived from the data, so there is no key that decrypts it; this is the standard sense of the term. Card industry guidance also describes tokens made with cryptographic functions, and treats a reversible encrypted token as an encrypted card number. Mobile wallets pay with a device-specific account number that is reused, plus a security code that changes for every transaction; many textbooks call that token one-time, so a learner who says "one-time token" is repeating a common description and should not be marked wrong, though the precise picture is a reused device number plus a per-transaction code.

**Scenario:** An online shop wants to charge returning customers without ever storing their card numbers. The answer is tokenization with the payment processor holding the vault. Hashing the card numbers is the closest wrong answer: a hash cannot be turned back into a card number for charging.

### Obfuscation as a method to secure data (with steganography)
Obfuscation makes data or code hard to understand while keeping it usable, so a person or tool that gets hold of it cannot easily read or reverse-engineer it. It is an umbrella term: masking and tokenization are forms of data obfuscation, and steganography hides the very existence of data. It raises the attacker's effort but is not strong protection by itself.

Forms:
1. Code obfuscation: renaming variables to meaningless names, removing structure and adding confusing logic so software is hard to reverse-engineer. It protects intellectual property and slows tampering.
2. Data obfuscation: masking, tokenization, scrambling or substituting values so real data is not exposed.
3. Steganography: embedding data inside other data, such as an image or audio file, so that nobody notices a message exists.

**Why it matters:** obfuscation buys time and deters casual analysis; attackers use the same techniques to hide malware and to smuggle data out past inspection tools.

**Common confusions:** Obfuscation is not encryption: there is usually no key, and a determined analyst can undo it. Relying on it alone is security through obscurity. Steganography hides that a message exists, while encryption hides what a visible message says; the two can be combined. Encoding (such as Base64) is a format change, not a protection.

**Scenario:** A software vendor ships a mobile app and wants to make it harder for competitors to study its licensing logic. The answer is code obfuscation. Encryption of the app is the closest wrong answer as stated: the code must still run on the user's device, so it has to be readable by the device, and obfuscation is the technique that makes that readable code hard for people to follow.

### Data segmentation as a method to secure data
Data segmentation keeps data of different sensitivity in separate places: separate databases, storage accounts, network segments or systems, each with controls that match its sensitivity. A breach of one area then exposes only what lives there. It is a preventive design choice that limits impact rather than likelihood.

How to apply it:
1. Classify the data so you know what must be separated.
2. Move the most sensitive sets (cardholder data, health records, trade secrets) into their own stores.
3. Put those stores in their own network segments with deny-by-default rules and narrow allowed flows.
4. Give each segment its own access groups and, where it makes sense, its own encryption keys.
5. Monitor the segment boundaries closely.

**Why it matters:** the systems that store, process or reach card data define the scope of a card security audit, so isolating that data shrinks both the audit and the blast radius. The tokenization system itself is expected to sit in an isolated segment for the same reason.

**Common confusions:** Data segmentation is about where data is kept; network segmentation (objective 3.1) is the network technique often used to enforce it. Segmentation does not protect data from someone with legitimate access to the segment, so permissions and monitoring still apply inside it. Spreading copies of the same sensitive data across many segments defeats the purpose.

**Scenario:** A retailer's marketing database and its card payment database share one server, and a marketing web flaw exposed both. The design fix is segmentation: card data in its own isolated store and network segment. Stronger passwords on the shared server is the closest wrong answer, because the flaw bypassed login entirely.

### Permission restrictions as a method to secure data
Permission restrictions limit who can read, change or delete data, using file and folder permissions, access control lists (ACLs), database grants and role-based access. They put least privilege and need to know into practice. They are technical preventive controls that protect confidentiality and integrity.

How to apply them:
1. Start from deny: nobody has access until it is granted.
2. Grant access to roles or groups, not to individuals, and only the level needed (read rather than modify).
3. Separate duties, so the person who requests a change is not the one who approves it.
4. Review permissions on a schedule and when people change jobs, since rights pile up over time.
5. Log access to sensitive data and alert on unusual use.

**Why it matters:** most data exposure inside organizations comes from access that was too broad, such as a shared folder open to everyone.

**Common confusions:** Permissions are enforced by the operating system or application, so they do nothing when storage is stolen or read from outside that system; pair them with encryption. Masking controls what a permitted user sees, while permissions control whether they get in at all. Access control models (role-based, attribute-based and others) are objective 4.6 material.

**Scenario:** An intern can open the salary spreadsheet because the whole finance share is readable by all staff. The fix is permission restrictions following least privilege, with only the payroll group allowed. Encrypting the share is the closest wrong answer: every logged-in user allowed by the share would still have it decrypted for them.

Worked example of a file ACL: `payroll-2026.xlsx: GROUP payroll = read, write; GROUP hr-managers = read; everyone else = no access`.

### Encryption vs hashing vs masking vs tokenization vs obfuscation (comparison)
These five methods all make data unreadable to someone, so the differences decide which to use.

| Method | What it does | Can the original be recovered? | Uses a key? | Typical use |
|---|---|---|---|---|
| Encryption | Transforms data into ciphertext | Yes, with the key | Yes | Data at rest and in transit |
| Hashing | Produces a fixed-length one-way digest | No | No (a salt is not a key) | Password storage, integrity checks |
| Masking | Hides part or all of a value from the viewer | Stored original unchanged (dynamic), or gone from the copy (static) | No | Screens, receipts, test data |
| Tokenization | Replaces the value with a surrogate | Only through the token vault | No key for vault tokens | Card numbers, shrinking audit scope |
| Obfuscation | Makes data or code hard to understand | Often, with effort | Usually not | Code protection; umbrella for masking, tokenization, steganography |

How to choose:
1. Must the original come back, by anyone holding a secret? Encryption.
2. Must the original never come back, only be verified? Hashing.
3. Must most viewers see only part? Masking.
4. Must systems work with a stand-in while the real value lives elsewhere? Tokenization.
5. Must casual readers or reverse engineers be slowed? Obfuscation.

**Why it matters:** the wrong method fails quietly: encrypted passwords can be decrypted in bulk once the key leaks, and hashed card numbers cannot be charged.

**Common confusions:** Encoding is not on this list because it protects nothing. Salting belongs to hashing, not to encryption. Tokenization and masking can look alike on screen, but masking is a view of real data and a token is a different value entirely.

**Scenario:** A developer proposes storing passwords with strong encryption so that support staff can read them back to users who forget. The correct method is salted hashing, with a reset process instead of read-back. Encryption is the closest wrong answer, and the read-back feature is exactly why: reversible storage means one stolen key exposes every password.

### Choosing a method to secure data by goal
This section maps common data protection goals to the method that fits and says when that method is the wrong pick. TLS means Transport Layer Security.

| Goal in the scenario | Method | Not the answer when |
|---|---|---|
| Stolen laptop or backup must be unreadable | Encryption at rest | The system is running and the attacker is logged in |
| Data crossing the internet must be private | Encryption in transit (TLS, Internet Protocol Security (IPSec), virtual private network (VPN)) | The threat is on the endpoint itself |
| Data must be hidden even while processed in the cloud | Trusted execution environment | Only storage needs protecting |
| Store passwords | Salted, slow hashing | The original must be recovered |
| Prove a file was not altered | Hashing | Confidentiality is needed |
| Show only the last four digits | Masking | The stored value must be protected from theft |
| Merchant should never hold real card numbers | Tokenization | Staff need to see part of the number |
| Slow down reverse engineering of an app | Obfuscation | Strong confidentiality is required |
| Limit the damage of one breach | Segmentation | The attacker has valid access to the segment |
| Only payroll staff may open salary files | Permission restrictions | The disk itself may be stolen |
| No sign-ins from countries without staff | Geographic restrictions | The attacker can use a VPN (layer other controls) |
| Records must stay in the country | Design for data sovereignty (region choice) | The need is only to block foreign logins |

**Why it matters:** each method covers one goal well and others poorly, so real designs combine them: permissions plus encryption at rest plus TLS plus masking for viewers.

**Common confusions:** Two methods often both "protect" the data; the decisive clue is whether the original must be recoverable, by whom, and in which data state the threat occurs.

**Scenario:** A payment page must send card numbers to the processor safely, and the merchant's own database must keep nothing useful to a thief. The combination is TLS in transit and tokenization for storage. Encrypting the merchant's database is the closest wrong answer for the second need: the real numbers and the key would still be on the merchant's systems.

## 3.4 Why resilience and recovery matter in security architecture
Depth asked: explain. A good answer says what each technique keeps running or brings back, what it costs, what it does not cover, and how it ties to the recovery time objective (RTO, how long recovery may take) and the recovery point objective (RPO, how much data loss is acceptable). Exact definitions of those metrics are in the Reference chapter and objective 5.2.

### Load balancing vs clustering (high availability)
Load balancing and clustering are the two main ways to keep a service running when a server fails. A load balancer spreads requests over independent servers that do not know about each other. A cluster is a group of servers, called nodes, that cooperate as one logical system and take over each other's work. Both serve the availability leg of the confidentiality, integrity and availability triad.

| | Load balancing | Clustering |
|---|---|---|
| Servers | Independent, unaware of each other | Aware of each other, act as one system |
| What sits in front | A load balancer device or service | Cluster software; clients see one name |
| Failure detection | Health checks from the load balancer | Heartbeat signals between nodes |
| On failure | Failed server is dropped from the pool | Another node takes over the workload (failover) |
| Storage | Usually separate or stateless | Often shared between nodes |
| Typical use | Web and application front ends | Databases, file servers, virtual machine hosts |

How a failover cluster works:
1. Nodes exchange heartbeat signals, usually over a dedicated private network.
2. When a node stops answering, the remaining nodes take over its roles automatically.
3. A quorum, the minimum number of votes needed to operate, prevents a split cluster from running as two conflicting halves.
4. In active/active mode every node carries load; in active/passive mode standby nodes wait idle, which is simpler but leaves hardware unused.

**Why it matters:** stateless web servers scale best behind a load balancer, while a database needs clustering because two independent copies would disagree about the data.

**Common confusions:** Both terms use "active/active" and "active/passive", so the clue is whether the servers are independent (load balancing) or coordinate and share state (clustering). They are often combined: load-balanced web servers in front of a clustered database. Neither replaces backups, because corruption or ransomware reaches every node.

**Scenario:** Two database servers share one storage array, and when the first fails the second takes over its work within seconds. This is clustering. Load balancing is the closest wrong answer: it would spread requests over independent servers but would not move one server's role and shared data to another.

### Fault tolerance vs high availability
Fault tolerance is the ability of a system to keep working correctly while one or more of its parts fail, with no interruption at all. High availability is the wider goal of keeping a service up nearly all the time through redundancy and failover, which can include a short pause while a standby takes over. Both remove single points of failure; they differ in how much interruption is acceptable.

How they differ in practice:
1. Fault tolerant designs run duplicate components at the same time, so the surviving one simply continues: redundant power supplies, mirrored disks, lockstep servers. It costs the most.
2. Highly available designs detect a failure and switch: a cluster node takes over, a load balancer drops a dead server. A brief retry or reconnect is accepted.
3. Availability is measured as a percentage of uptime; the Reference chapter lists what each level of "nines" allows in yearly downtime.

**Why it matters:** safety and industrial systems are often built fault tolerant, because even momentary downtime may be unacceptable there, while most business services settle for high availability at lower cost.

**Common confusions:** Fault tolerance is about surviving component failure without interruption; it is not immunity to attack. Redundancy can be defeated by a malicious change that spreads to every copy. Neither one is a backup: deleting a file deletes it on every redundant disk.

**Scenario:** An air traffic display system must not blank out for even a second when a server dies. The requirement is fault tolerance. High availability is the closest wrong answer, because a failover pause of several seconds would break the stated requirement.

### Hot site, warm site and cold site (recovery site comparison)
A recovery site is an alternate location where operations resume when the main site is unusable. The three classic types differ in how ready they are, which sets both cost and recovery time.

| Site | What is in place | Data | Time to resume | Cost |
|---|---|---|---|---|
| Hot | Hardware, software, network, often staff, configured and running | Current or near current (replicated) | Minutes to hours | Highest of the three |
| Warm | Some or all hardware and connectivity, partly configured | Not current; restored from backups | Hours to days | Medium |
| Cold | Space, power, cooling and communications only | None; equipment and data brought in | Days to weeks | Lowest |

Related variants and a precision note: the NIST contingency planning guide defines a hot site by its ready hardware, infrastructure and support staff, with the latest backed-up data loaded, and reserves real-time data mirroring for a separate type, the mirrored site, a fully redundant twin that is the most expensive option with almost no downtime. Everyday usage folds replication into "hot site", so both descriptions are acceptable; a mobile site is a transportable unit fitted with equipment that can be delivered where needed.

How to choose:
1. Take the recovery time objective from the business impact analysis.
2. Pick the cheapest site type that meets it: very short RTO needs a hot or mirrored site, a long RTO allows a cold site.
3. Match the backup method: replication for hot, regular backups for warm, shipped backups for cold.
4. Test the site, since an untested site often lacks something essential.

**Why it matters:** paying for a hot site when the business can wait a week wastes money; relying on a cold site for a system that must be back in an hour guarantees failure.

**Common confusions:** A warm site has equipment but stale data; a cold site has neither equipment nor data. A hot site is not the same as load-balanced production: it waits (or runs in parallel) for a disaster. Whatever the type, the site should be far enough away not to share the same disaster.

**Scenario:** A manufacturer can tolerate five days of IT downtime and has a small budget. A cold site fits. A warm site is the closest wrong answer: it would recover faster, but the clue says the extra speed is not needed and money is short.

### Geographic dispersion of sites and backups
Geographic dispersion means placing data centers, recovery sites and backup copies far enough apart that one regional event, such as a hurricane, earthquake, flood or grid failure, cannot take them all out. It protects availability against disasters larger than a single building.

How to apply it:
1. List the regional hazards of the primary site.
2. Place the alternate site and at least one backup copy outside the area those hazards could affect.
3. Balance distance against latency: synchronous replication needs low delay and therefore shorter distances, while asynchronous replication works over long distances with a small risk of losing the latest changes.
4. Check legal limits: data sovereignty may require the distant site to stay inside the same country or region.
5. In the cloud, use the built-in layers: availability zones are separate data center groups within a region, each with independent power, cooling and networking, protecting against a local failure; a second region protects against a region-wide event.

**Why it matters:** many organizations have lost both primary and backup because the two sat in the same city, on the same power grid or in the same flood plain.

**Common confusions:** Two zones in one region survive a data center failure but not a regional disaster; that needs another region. Dispersion addresses disasters, not data corruption, which replicates everywhere. More distance is not always better, because of latency and sovereignty.

**Scenario:** A bank's primary and recovery data centers are 3 kilometers apart on the same river. The weakness is a lack of geographic dispersion. Upgrading the recovery site from warm to hot is the closest wrong answer: it would recover faster from a server failure but would flood along with the primary.

### Platform diversity (resilience through different technologies)
Platform diversity means using different operating systems, vendors, hardware or technologies for the same function, so that one vulnerability or bug cannot bring everything down at once. Resilience engineering calls this using heterogeneity to reduce common mode failures, especially attacks that exploit a shared weakness.

How it is applied:
1. Identify functions where one flaw would be catastrophic: firewalls, authentication, Domain Name System (DNS), backup servers, endpoint operating systems.
2. Use two different products or platforms for those functions, for example firewalls from two vendors in series, or backup servers on a different architecture from production.
3. Accept and plan for the cost: more skills, more patch streams, more monitoring tools that must understand each platform.

**Why it matters:** when a single operating system or security agent has a zero-day flaw or a faulty update, an organization running only that platform loses everything at the same moment; a diverse one keeps part of its service. Diversity and redundancy support each other: redundant copies of the same product share the same flaw, diverse ones do not.

**Common confusions:** Platform diversity is not redundancy: two identical servers are redundant but not diverse. It is not multi-cloud, though using two providers is one way to get it. Diversity raises management effort and enlarges the attack surface, so it is applied where a common failure would hurt most, not everywhere.

**Scenario:** A faulty update to one endpoint security product crashes every Windows server a company owns, including the backup servers. The design principle that would have limited the outage is platform diversity. Adding more servers of the same kind is the closest wrong answer, because the same update would have crashed them too.

### Multi-cloud systems (resilience)
A multi-cloud system uses services from more than one cloud provider, so an outage, security incident, price change or contract dispute at one provider does not stop the business. It is a resilience choice that also avoids lock-in to one vendor's platform.

How it is used:
1. Decide what must survive a provider failure: usually critical applications and backups.
2. Either run the workload on two providers, or keep backups and a recovery plan on a second provider.
3. Unify what would otherwise fragment: one identity source federated to all providers, one policy baseline, one place where logs from every provider are collected.
4. Use portable building blocks (containers, infrastructure as code) so workloads can move.
5. Protect and encrypt the links and data moving between providers.

**Why it matters:** even large providers have region-wide and service-wide outages, and a single compromised provider account can otherwise reach production and backups together. Ransomware guidance suggests considering backups in a second cloud for that reason.

**Common confusions:** Multi-cloud is several cloud providers; hybrid cloud is on-premises plus cloud. A company can be both. Multi-cloud increases complexity: each provider has its own permission model, tools and default settings, so misconfiguration risk rises unless policy is unified. Using two regions of one provider is geographic dispersion, not multi-cloud.

**Scenario:** A company's only cloud provider suffers an identity service outage, and nobody can reach the applications or the backups for a day. The strategy that reduces this risk is multi-cloud, at least for backups and critical services. A second region with the same provider is the closest wrong answer, because the failed identity service was shared by all regions.

### Continuity of operations (COOP)
Continuity of operations planning keeps an organization's essential functions running during and after a disruption, including when technology, buildings or staff are unavailable. It covers people, places and processes, not only IT. In US government usage a continuity of operations plan focuses on restoring mission essential functions at an alternate site and sustaining them for up to 30 days; other organizations usually call the equivalent a business continuity plan.

What a continuity plan contains:
1. The list of essential functions and their priorities.
2. Orders of succession and delegations of authority, so decisions continue when leaders are unreachable.
3. Alternate facilities and how staff get there or work remotely.
4. Alternate and manual processes: paper forms, phone orders, manual approvals, offline price lists.
5. Communications plans for staff, customers and authorities.
6. How and when to return to normal operations.

How it relates to other plans: the disaster recovery plan is the IT part, restoring systems and data, often at an alternate site. The continuity plan keeps the business working while that happens. Both draw their priorities from the business impact analysis (objective 5.2).

**Why it matters:** an organization that can restore servers in two days but cannot take an order or pay staff for those two days has an IT plan and no continuity plan.

**Common confusions:** Continuity of operations is about keeping essential functions going; disaster recovery is about restoring IT. A continuity plan does not try to keep everything running, only what is essential. Alternate manual processes are part of continuity even though they involve no technology.

**Scenario:** Ransomware takes a hospital's scheduling system offline, and staff switch to printed schedules and paper charts they rehearsed with. This is continuity of operations. Disaster recovery is the closest wrong answer: it describes the IT team restoring the system, not the staff keeping care going meanwhile.

### Capacity planning: people, technology and infrastructure
Capacity planning makes sure enough resources exist to handle normal load, peak load and the extra strain of an incident or disaster. For resilience it has three parts: people, technology and infrastructure. Too little causes outages; too much wastes money.

The three parts:
1. People: enough staff with the right skills, cross-trained so no task depends on one person, with named backups for key roles and a plan for surge staffing during incidents. A single administrator who alone knows a system is a single point of failure.
2. Technology: applications, servers and services sized for peak demand, not average, and able to scale up (bigger machines) or out (more machines). Cloud elasticity and spare capacity on standby help absorb surges and failures.
3. Infrastructure: the facilities and services underneath: network bandwidth, power, cooling, rack and floor space, and cloud quotas. Physical upgrades have long lead times, so they must be ordered well before they are needed.

How to do it:
1. Measure current use and trends.
2. Forecast growth and peaks, including the load a recovery site must carry after failover.
3. Add headroom so that losing one component still leaves enough.
4. Review after every incident and major change.

**Why it matters:** a recovery site sized for half the production load fails exactly when it is needed, and an incident response that depends on one exhausted engineer stalls.

**Common confusions:** Capacity planning is not only about servers; people are listed first for a reason. Technology is the computing layer, infrastructure is what it runs on and connects through. Elastic cloud capacity eases technology planning but still has quotas and costs.

**Scenario:** During a regional outage, a company fails over to its recovery site, which then collapses because every customer now uses it and its internet link is one tenth the size of the main site's. The failure is in infrastructure capacity planning. Technology capacity is the closest wrong answer: the servers coped, the bandwidth did not.

### Recovery testing: tabletop exercises and simulations
Recovery plans are only believed after they are tested. The two lower-risk test types are the tabletop exercise, a guided discussion, and the simulation, a realistic practice run in a controlled setting. Neither changes production.

Tabletop exercise:
1. Key people meet in a room or call.
2. A facilitator presents a scenario and asks questions as it unfolds.
3. Participants talk through their roles, decisions, coordination and communications, step by step.
4. Nothing is deployed or switched; gaps in roles, contact lists and procedures are written down and fixed.

Simulation:
1. People carry out their actual duties as if the event were real, but in a simulated or isolated environment: restoring a server from backup into a test network, activating the call tree, setting up equipment.
2. Results are timed and compared with the recovery objectives.
3. The term also covers simulated attacks, such as a fake phishing campaign that shows who clicks and whether filters catch it.
Some guidance calls hands-on tests of this kind functional exercises.

**Why it matters:** tabletops are cheap and find most planning gaps; simulations prove that people, tools and backups actually work. Plans that are never exercised usually fail on small things, such as an outdated phone number or a backup nobody can decrypt.

**Common confusions:** A tabletop is discussion only; if anyone touches a system, it is no longer a tabletop. A simulation is acted out but production is not switched over; an actual switch is a failover test. Testing is repeated on a schedule and after major changes, with lessons recorded.

**Scenario:** Management wants to check, in two hours and without touching any system, whether department heads know what to do if the data center burns. The answer is a tabletop exercise. A simulation is the closest wrong answer: it would have staff perform recovery actions, which costs more time and touches test systems.

### Recovery testing: parallel processing and failover tests
The two higher-realism test types put real workload on the recovery system. Parallel processing runs the recovery system alongside production. A failover test actually moves operations to the redundant system or site.

Parallel processing as a recovery test (NIST contingency guidance lists a parallel test among its methods, beside checklist, tabletop, simulation and full-interruption tests, without defining it in detail):
1. The recovery site or system is brought to operational readiness while the primary keeps running as normal.
2. It processes the same real work, or copies of it.
3. Its results are compared with production's; any mismatch shows what the recovery system gets wrong.
4. Production stays in charge throughout, so a problem found in the test does not hurt the business.
The same phrase also has a general computing meaning, which some textbooks use for this item: several processors or systems share the work at once, so when one fails it is removed and the rest carry on. Either meaning is a reasonable reading of the term.

Failover test:
1. Plan a window and a way back.
2. Switch operations to the standby system or alternate site, either by controlled switchover or by cutting the primary.
3. Run real work there and measure the time taken against the recovery time objective and the data lost against the recovery point objective.
4. Fail back to the primary and record what broke.

**Why it matters:** only a failover proves that the switch itself works, including routing, name resolution and permissions; it is also the one test that can cause a real outage if it goes wrong. The highest-impact systems are expected to include a failover to the alternate location in their exercises.

**Common confusions:** Parallel processing does not cut over; failover does. A parallel test proves the recovery system can do the work but not that the switchover mechanism works.

**Scenario:** For a week the recovery site processes copies of live transactions and the team compares its output with the main site's, with customers served by the main site throughout. This is parallel processing. A failover test is the closest wrong answer, because nothing was switched over.

### Recovery tests compared: tabletop vs simulation vs parallel processing vs failover
The four listed test types form a ladder from cheapest and safest to most realistic and riskiest.

| Test | What happens | Systems touched | Risk to production | What it proves |
|---|---|---|---|---|
| Tabletop exercise | People discuss a scenario | None | None | Roles, decisions and communications are understood |
| Simulation | People act out the response in a controlled environment | Test or isolated systems | Very low | People, procedures and backups work |
| Parallel processing | Recovery system runs real workload beside production | Recovery systems | Low | Recovery system produces correct results under real load |
| Failover | Operations are switched to the standby and back | Production and recovery | Highest | The switchover itself works within the time objective |

How to use the ladder: start with tabletops, move up as confidence grows, and run a real failover for the most critical systems on a schedule.

**Why it matters:** each level finds problems the level below cannot, and skipping straight to failover without the cheaper tests risks an avoidable outage.

**Common confusions:** "Without affecting production" rules out failover. "Discussion" means tabletop. "Compare results side by side" means parallel processing. "Practice realistically" means simulation.

**Scenario:** A team wants the strongest proof that its secondary data center can take over, and accepts a planned risk window on a Sunday. The answer is a failover test. Parallel processing is the closest wrong answer: it shows the secondary can do the work, but not that the cutover and the return work.

### Backups: onsite, offsite and the 3-2-1 rule
A backup is a separate copy of data or systems kept so they can be restored after loss, corruption, ransomware or disaster. Where the copies live decides which disasters they survive. Onsite copies sit at the same location as the original; offsite copies sit elsewhere, in another facility or in cloud storage.

The 3-2-1 rule:
1. Keep 3 copies of important data: the original and two backups.
2. Keep them on 2 different media types, so one kind of failure does not hit both.
3. Keep 1 copy offsite.
Ransomware practice adds a fourth idea: keep at least one copy offline or immutable (unchangeable for a set time), because ransomware looks for reachable backups and deletes or encrypts them first.

How onsite and offsite compare:
| | Onsite | Offsite |
|---|---|---|
| Restore speed | Fast | Slower (transfer or transport) |
| Survives fire, flood, theft at the site | No | Yes |
| Typical use | Everyday restores | Disaster recovery |

How to run backups well: choose a secure offsite location or provider, encrypt what leaves the building, label and track media, and test restores from both copies.

**Why it matters:** an organization with only onsite backups loses data and backups in the same fire; one with only offsite backups waits hours for every small restore.

**Common confusions:** Offsite is not the same as offline: a cloud copy that production credentials can delete is offsite but reachable by ransomware. A second disk in the same server is not a backup strategy. Backups are still needed alongside high availability, since redundant systems copy corruption faithfully.

**Scenario:** Ransomware encrypts a company's file servers and then its backup server, which was always connected to the same network with the same administrator account. The missing safeguard is an offline or immutable copy. More frequent backups is the closest wrong answer, since the newer backups would have been encrypted as well.

### Backup frequency and full, incremental and differential backups
Backup frequency is how often backups run. It decides how much data could be lost, so it is set to meet the recovery point objective (RPO): the point in time, before the outage, to which data must be recoverable. Backup types trade the time and space each backup takes against the effort of a restore.

The three types:
| Type | What it copies | Backup time and size | What a restore needs |
|---|---|---|---|
| Full | Everything selected | Slowest and largest | Only the last full backup |
| Incremental | What changed since the last backup of any type | Fastest and smallest | The last full plus every incremental since, in order |
| Differential | What changed since the last full backup | Grows each day until the next full | The last full plus only the latest differential |

How to set a schedule:
1. Take the RPO for each data set: an RPO of one hour needs backups, snapshots or replication at least hourly.
2. Choose a mix, for example a weekly full with nightly incrementals (small backups, longer restore) or nightly differentials (larger backups, simpler restore).
3. Take a new full backup regularly, because long incremental chains are fragile and differentials keep growing.
4. Check that the backup window and storage can hold the plan.

**Why it matters:** backing up nightly when the business can lose only ten minutes of orders leaves a gap nobody noticed until the outage; a broken link in an incremental chain can make later backups unusable.

**Common confusions:** Incremental compares with the last backup of any kind; differential compares with the last full. Frequency drives the RPO; restore speed drives the recovery time objective. Product names vary, and some tools call the differential type a cumulative incremental.

**Scenario:** A full backup runs Sunday and incrementals run Monday to Wednesday; the server dies Thursday morning. The restore needs Sunday's full plus Monday's, Tuesday's and Wednesday's incrementals in order. Sunday's full plus Wednesday's backup only is the closest wrong answer: that would be correct for differentials, not incrementals.

### Backup encryption and key handling
Backup encryption protects backup data so that a lost, stolen or copied backup cannot be read. Backups are data at rest, they leave the protected production environment, and they usually hold everything valuable in one place, which makes them a prime target.

How to do it:
1. Encrypt backups before or as they are written, and encrypt them in transit to offsite or cloud storage.
2. Keep the keys separate from the backups, in a key management system or secure escrow, never on the same media or server.
3. Make sure the keys themselves are backed up and reachable during a disaster, including when the primary site and its key server are gone.
4. Restrict and log access to both backups and keys.
5. Test a restore that includes retrieving the key.

**Why it matters:** an unencrypted backup tape lost in transit is a full data breach. An encrypted backup whose key was lost in the same disaster is useless, which turns a recoverable incident into permanent loss.

**Common confusions:** Encrypting backups protects confidentiality, not availability or integrity; it does not stop ransomware from deleting or re-encrypting them. Encryption in production does not mean the backup is encrypted, since backup software may read the data decrypted.

**Scenario:** A courier loses a box of backup tapes holding customer records. The control that prevents a reportable breach is backup encryption with keys stored elsewhere. Offsite storage is the closest wrong answer: the tapes were on their way offsite, and location does nothing once the media is in a stranger's hands.

### Snapshots (point-in-time rollback copies)
A snapshot is a point-in-time record of the state of a system, volume or virtual machine (VM), usually captured as the differences between that moment and now rather than as a full copy. Snapshots are quick to take and quick to roll back to, which makes them the standard safety net before risky changes.

How they are used:
1. Take a snapshot before patching, upgrading or reconfiguring.
2. If the change fails, revert to the snapshot in minutes.
3. If it succeeds, delete the snapshot, because old snapshots grow and slow the system.
4. For a VM, a snapshot can include disk, memory and device state, so the machine resumes exactly where it was.

**Why it matters:** fast rollback shortens recovery time for change-related failures, and a snapshot of a compromised machine preserves evidence for investigation.

**Common confusions:** A snapshot is not an independent backup: it normally lives on the same storage as the original and depends on it, so if that storage fails, both are lost. Snapshots copied to other storage or another region become real backups. A snapshot preserves whatever was there, including vulnerabilities and malware, so reverting to an old one brings back old flaws. Snapshots can also hold sensitive data and need the same access control as the live system.

**Scenario:** An administrator is about to apply a major database upgrade to a VM and wants a way back within minutes if it fails. The answer is a snapshot taken just before the change. A weekly full backup is the closest wrong answer: it exists, but restoring it takes far longer and loses up to a week of data.

### Backup recovery and restore testing
Recovery is the act of restoring data or systems from backups to a working, trusted state. A backup is proven only when a restore from it succeeds within the recovery time objective (RTO) and brings back data no older than the recovery point objective (RPO).

How a sound recovery runs:
1. Confirm the cause is contained, so restored systems are not reinfected.
2. Restore in priority order set by the business impact analysis, critical services first.
3. Use known-good sources: clean backups, golden images (preconfigured operating system and application templates) and infrastructure-as-code templates to rebuild systems.
4. Restore the last full backup, then the needed incrementals or the latest differential, then replay logs or journals to the chosen point.
5. Validate the result: data integrity, application function, security settings.
6. Take a fresh full backup of the recovered system.

How to test: restore sample files often, restore whole systems on a schedule, time the restores, and include retrieving encryption keys and credentials.

**Why it matters:** many organizations discover during a real incident that backups were incomplete, corrupt, too slow to restore or locked behind a lost key. Testing moves that discovery to a quiet day.

**Common confusions:** A successful backup job is not a successful restore. RTO measures time to restore service; RPO measures how much recent data is lost. Restoring onto different hardware can fail, which is why images and installers are kept and spare or compatible hardware is planned.

**Scenario:** A company's backup reports show green every night for two years, but after a failure the restore takes four days against an RTO of eight hours. The gap is the lack of restore testing. Increasing backup frequency is the closest wrong answer, because it improves the RPO and does nothing for restore time.

### Replication (synchronous and asynchronous)
Replication copies data continuously, or very frequently, to another system or site so that a near-current copy is always ready. It supports fast failover and very small data loss, and it is how hot sites stay current.

Two modes:
1. Synchronous: each write is sent to the second location and confirmed there before the application is told the write is done. Both copies are always identical, so a failover loses no data. It needs a fast, low-delay link, slows writes slightly and suits shorter distances.
2. Asynchronous: the write is confirmed locally at once and sent to the second location afterwards. It works over long distances and slow links with no drag on the application, but changes still in flight are lost if the source fails.

How it is used:
1. Pick the mode from the recovery point objective (RPO): zero data loss needs synchronous, a few seconds or minutes allows asynchronous.
2. Protect the replication link with encryption and authentication.
3. Monitor the lag between the copies.
4. Keep point-in-time backups as well.

**Why it matters:** replication gives the lowest data loss and fastest recovery of any technique, which is why critical databases and hot sites depend on it.

**Common confusions:** Replication is not a backup. It copies every change, including deletions, corruption and ransomware encryption, to the other side almost immediately, so both copies are damaged together. Only a point-in-time copy (backup or snapshot kept elsewhere) lets you go back to before the damage. Geographic distance and synchronous replication pull against each other because of latency.

**Scenario:** An employee deletes a shared folder by mistake, and within seconds it is gone from the replica at the recovery site too. The lesson is that replication does not replace point-in-time backups. Switching to synchronous replication is the closest wrong answer: it would only copy the deletion faster.

### Journaling (change logs for crash recovery)
Journaling records each change in a log, called a journal, before or as the change is applied to the main data. After a crash, the system replays or rolls back the journal to return to a consistent state, and with saved journals data can be rolled forward to a chosen point in time. File systems, databases and some backup and replication products use it.

How it works:
1. A change is first written to the journal (write-ahead logging).
2. The change is then applied to the main data.
3. If the system crashes between the two steps, recovery reads the journal at restart: completed changes are applied (rolled forward), and incomplete transactions are undone (rolled back).
4. For point-in-time recovery, the last full backup is restored and the saved journal or transaction log backups are replayed up to the wanted moment, for example one minute before a bad change.

**Why it matters:** without journaling, a power cut in the middle of a write can leave a file system or database half-updated and corrupt. With it, recovery is fast and consistent, and very little work is lost, which supports a small recovery point objective between backups.

**Common confusions:** Journaling is not a backup by itself: the journal usually sits on the same storage, so it protects against crashes, not against losing the disk. Some file systems journal only metadata by default, which keeps the structure consistent but can still leave recent file contents incomplete after a crash. The journal must be protected and kept, because a missing piece breaks the chain of changes. Journaling differs from replication, which copies changes to another place rather than logging them for replay.

**Scenario:** A database server loses power mid-transaction, and when it restarts it automatically completes the finished transactions and undoes the half-finished one. The feature at work is journaling (transaction logging). A snapshot is the closest wrong answer: it could return the database to an earlier moment but would lose every transaction since.

### Backups vs snapshots vs replication vs journaling (comparison)
These four keep copies or records of data, but they answer different failures. RPO means recovery point objective, the acceptable data loss.

| Technique | What it keeps | Independent of the original storage? | Lets you go back in time? | Best against |
|---|---|---|---|---|
| Backup (full, incremental, differential) | Point-in-time copies on separate media | Yes | Yes, to each backup | Loss, corruption, ransomware, site disaster (if offsite) |
| Snapshot | Point-in-time state, stored as differences | Usually no | Yes, to each snapshot | A bad change or patch; quick rollback |
| Replication | A continuously updated second copy | Yes | No (unless paired with snapshots) | Hardware or site failure, with near-zero RPO |
| Journaling | A log of every change | Usually no | Yes, by replaying to a chosen moment | Crashes mid-write; fine-grained recovery |

How they combine: replication for fast failover, backups for going back before corruption, snapshots for quick rollbacks around changes, journals to fill the gap between backups.

**Why it matters:** each technique alone leaves a hole. Replication without backups cannot undo a mistake; backups without replication mean hours of downtime; snapshots without backups die with the storage array.

**Common confusions:** "Near real-time copy" points to replication. "Roll back before the patch" points to a snapshot. "Rebuild to a point in time from logged changes" points to journaling. "Separate copy that survives the building" points to an offsite backup.

**Scenario:** A design must survive a data center fire with almost no data loss and also survive an administrator's accidental mass deletion. It needs replication to another site plus point-in-time backups. Replication to two sites is the closest wrong answer: it handles the fire but copies the deletion to both.

### Uninterruptible power supply (UPS)
An uninterruptible power supply is a battery-based device that keeps equipment running the moment utility power fails, for a short time, typically minutes. It bridges the gap until a generator starts or systems shut down cleanly, and it also smooths power problems such as surges, sags and brownouts. It is a physical control for availability.

Three designs:
1. Standby (offline): equipment normally runs straight from utility power. When power fails, a transfer switch moves the load to the battery and inverter, which only start at that moment, so there is a brief switchover. Common for single desktop computers.
2. Line-interactive: the inverter stays connected to the output, and automatic voltage regulation corrects low or high voltage without using the battery. Common for small groups of servers and network gear.
3. Online (double conversion): the load always runs through the rectifier and inverter, so when power fails nothing has to switch and there is no interruption at all. Common for data centers and critical equipment.

How it is used:
1. Size it for the load and the minutes of runtime needed.
2. Connect it to monitoring so servers shut down gracefully before the battery is empty.
3. Test and replace batteries on schedule.

**Why it matters:** even a power dip of a fraction of a second can crash servers and corrupt data in the middle of writes; a UPS turns that into a non-event.

**Common confusions:** A UPS provides short-term power only; long outages need a generator. In an online UPS the load is fed through the inverter all the time, with the battery supplying it when input power stops, which is why it is often described as always running from the battery side. A surge protector is not a UPS, since it has no stored energy.

**Scenario:** A server room has a generator that takes 30 seconds to start, and servers reboot every time the grid fails. The missing piece is a UPS to carry the load during those seconds. A second generator is the closest wrong answer, because any generator has a start-up delay.

### Generators for backup power
A generator is an engine, usually running on diesel, natural gas or propane, that produces electricity for long outages. It can run for hours or days, as long as fuel is supplied. It takes time to start and stabilize, so it works together with an uninterruptible power supply (UPS), which carries the load during the gap.

How the power chain works in an outage:
1. Utility power fails.
2. The UPS carries the load instantly from its batteries.
3. An automatic transfer switch detects the loss and starts the generator.
4. Once the generator output is stable, the load moves to it, and the UPS recharges.
5. When utility power returns and is stable, the load transfers back and the generator shuts down.

How to keep it dependable:
1. Size it for the critical load, including cooling, since servers without air conditioning overheat within minutes.
2. Keep fuel on site and hold refuelling contracts for long events.
3. Test it under real load on a schedule; generators that are only started idle often fail when loaded.
4. Add redundancy around it: dual power supplies in servers, separate feeds, and power distribution units (PDUs) that deliver power to racks.

**Why it matters:** regional outages after storms can last days, far beyond any battery. A generator is what keeps a data center, hospital or emergency service running through them.

**Common confusions:** A generator is long-term but not instant; a UPS is instant but short-term. They are partners, not alternatives. A generator covers loss of utility power, not failure of a single power supply inside a server, which is solved by dual power supplies.

**Scenario:** A storm cuts grid power to a data center for two days. What keeps it running for that long is the generator with a fuel supply. A larger UPS is the closest wrong answer: batteries sized for days are impractical, and UPS runtime is measured in minutes.

### UPS vs generator vs redundant power (comparison)
Power resilience uses three layers that cover different failures. UPS means uninterruptible power supply, PDU power distribution unit.

| Layer | What it covers | How fast | How long | Limits |
|---|---|---|---|---|
| UPS | Momentary dips and the first minutes of an outage | Instant (online type has no switchover) | Minutes | Battery capacity and battery ageing |
| Generator | Long utility outages | Seconds to minutes to start | Hours to days, while fuel lasts | Start-up delay, fuel, maintenance |
| Redundant power supplies, dual feeds and PDUs | Failure of one supply, circuit or feed | Instant | Indefinitely | Does nothing if all utility power is lost |

How to design: give critical equipment dual power supplies on separate circuits, put a UPS behind them and a generator behind the UPS, and test the whole chain together.

**Why it matters:** each layer alone leaves a gap: seconds without a UPS, hours without a generator, or a single failed power supply taking down a server.

**Common confusions:** "Bridges the gap" or "clean shutdown" means UPS. "Runs for days" means generator. "One power supply failed and the server stayed up" means redundant power supplies.

**Scenario:** A hospital needs its imaging servers to survive a one-second flicker, a six-hour outage and a single failed power cord. The answer is all three layers together. A generator alone is the closest wrong answer: it handles the six hours but not the flicker or the failed cord.

### Resilience and recovery techniques matched to the failure they cover
Objective 3.4 lists many techniques. Each exists because of a specific failure, and naming that failure is how to explain its importance. RTO means recovery time objective, RPO recovery point objective.

| Failure or need | Technique | What it does not cover |
|---|---|---|
| One server fails | Load balancing or clustering | Data corruption, site loss |
| The whole site is lost | Hot, warm or cold site, far enough away | Corruption that was replicated |
| A regional disaster | Geographic dispersion | Legal limits on where data may go |
| One product has a fatal flaw | Platform diversity | Extra cost and complexity |
| A cloud provider fails | Multi-cloud systems | Inconsistent policy between providers |
| Technology is unavailable for days | Continuity of operations with manual processes | Restoring the IT itself |
| Load exceeds resources | Capacity planning (people, technology, infrastructure) | Unforecast events |
| The plan may not work | Testing: tabletop, simulation, parallel processing, failover | Problems outside the tested scenario |
| Data is deleted, corrupted or encrypted | Backups, with an offline or immutable copy | Downtime while restoring |
| A change goes wrong | Snapshots | Storage failure |
| Near-zero data loss is required | Replication | Mistakes copied instantly |
| A crash interrupts writes | Journaling | Loss of the disk |
| Power flickers or fails | uninterruptible power supply (UPS), then generator | Fuel running out |

**Why it matters:** resilience is part of security because availability is one leg of the confidentiality, integrity and availability triad, and because attacks such as ransomware and denial of service aim directly at it. A short RTO is bought with redundancy and ready sites; a small RPO is bought with frequent backups, journaling and replication.

**Common confusions:** High availability keeps a service up through component failures. Disaster recovery brings it back after a major loss. Backups let you go back in time. Strong designs use all three.

**Scenario:** A firm has clustered servers, synchronous replication to a hot site and generators, and still loses a week of work to ransomware. The missing technique is point-in-time backups with an offline copy. A third replicated site is the closest wrong answer, since replication would carry the encrypted data there too.
