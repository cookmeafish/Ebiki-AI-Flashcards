# Domain 4 (part 1): Securing resources, assets, vulnerabilities and monitoring
Checked as of 2026-11 for SY0-701.

## 4.1 Applying security techniques to computing resources
Depth asked: apply in a scenario. A good answer names the one technique that fits the device, its constraint and the goal, and says why the nearest alternative fits worse.

### Secure baseline life cycle (establish, deploy, maintain)
A secure baseline is the approved, documented set of security settings that every system of one type must meet, such as all Windows laptops or all edge routers. It solves inconsistency: without it, each system is built differently and nobody can say what "correct" looks like. It is a preventive, technical control that mainly protects integrity and confidentiality, and it is also the reference that detective tools compare against.

How it works, in order:
1. **Establish.** Pick a trusted starting point (a benchmark such as the CIS Benchmarks, a DISA STIG (Security Technical Implementation Guide) or the vendor's hardening guide), adjust it to what the business needs, test it on real workloads, then document and approve it. Reason: an untested baseline breaks applications and gets bypassed.
2. **Deploy.** Push the approved settings with central tools: Group Policy for Windows domains, mobile device management for phones, configuration management tools, or a hardened golden image. Reason: hand configuration drifts and misses machines.
3. **Maintain.** Review the baseline when software, threats or guidance change, scan systems for drift, and route every baseline change through change management. Reason: a baseline that never changes slowly becomes insecure.

The common wrong order is deploying first and documenting later, which leaves nothing approved to measure against. NIST defines a baseline configuration as a formally reviewed set of specifications fixed at a point in time and changed only through change control.

**Why it matters:** drift is how a fleet quietly loses its protection. One server with a re-enabled legacy protocol or a disabled host firewall is the one an attacker finds, and an auditor will ask for the documented standard.

**Common confusions:** A baseline is per system type, not one list for every device. A benchmark is published guidance; a baseline is your organization's approved version of it. Monitoring for drift does not replace the baseline; it depends on one existing.

**Scenario:** A scan shows 40 of 300 web servers allow an old TLS version that the build standard forbids. The answer is the maintain phase: detect drift and re-apply the baseline centrally, then find why it drifted. Re-establishing the baseline is the closest wrong answer, because the standard is fine; the servers stopped matching it.

Mini-example of a drift finding: `Rule: disable SMBv1 | Expected: Disabled | Found: Enabled | Host: FS-07 | Status: Fail`.

### Hardening workstations and servers
Hardening means shrinking a system's attack surface: fewer services, fewer accounts with power, fewer ways in. For workstations and servers it is a mix of preventive technical controls applied at the host layer, protecting all three legs of the CIA triad (confidentiality, integrity, availability).

Steps that apply to both, with the reason for each:
1. **Patch the operating system and applications on a schedule.** Most exploited flaws already have a fix.
2. **Remove unneeded software, roles and services.** Code that is not installed cannot be exploited.
3. **Change defaults and disable unused accounts.** Default credentials are public knowledge.
4. **Apply least privilege.** Users work as standard users; administrators use separate admin accounts, ideally with multifactor authentication (MFA).
5. **Turn on a host firewall and endpoint protection** (antivirus or endpoint detection and response, EDR).
6. **Encrypt disks** on laptops that can be lost, and **enable logging** so events reach central monitoring.

Differences by target: a workstation's main risks are the user (phishing, downloads) and theft, so standard-user rights, browser controls and full-disk encryption matter most. A server's main risk is exposure to many clients and its valuable data, so minimal roles, strict and audited administrator access, and network restrictions matter most.

**Why it matters:** a single workstation running with local admin rights lets one malicious attachment install software and steal credentials that reach servers.

**Common confusions:** Hardening is not the same as patching; patching is one hardening step. Disabling a service is stronger than blocking its port with a firewall, because the code is gone, not only hidden. Endpoint protection detects; hardening prevents.

**Scenario:** A file server also runs a print spooler and a web console nobody uses. The answer is to remove or disable those services as part of hardening. A host firewall rule blocking them is the closest wrong answer: it helps, but the vulnerable code still runs and could be reached from an allowed path.

### Hardening switches and routers (network infrastructure devices)
Switches and routers move every packet, so a compromised one can redirect, copy or drop traffic for many hosts. Hardening them is a preventive technical control on the network layer that protects confidentiality and integrity of traffic and availability of the network.

Steps, with reasons:
1. **Change default usernames and passwords**, and use central authentication (RADIUS or TACACS+) for administrators. Defaults are published in manuals.
2. **Use encrypted management.** Replace Telnet with Secure Shell (SSH), HTTP consoles with HTTPS, and Simple Network Management Protocol (SNMP) versions 1 and 2c with SNMPv3, which adds authentication and encryption. Plaintext management exposes passwords and community strings on the wire.
3. **Restrict who can manage the device**: management only from a dedicated management network or jump host, enforced with access control lists (ACLs).
4. **Update firmware** from the vendor. Network operating systems have exploitable flaws like any other software.
5. **Disable unused ports and services.** On switches, shut unused ports and use port security or IEEE 802.1X so only known devices connect. On routers, disable unused interfaces and services and filter traffic with ACLs.
6. **Back up configurations and log to a central server.** Recovery and evidence both need them.

Router specifics: it sits at a boundary between networks, so ACLs that filter traffic and protect the management plane matter most. Switch specifics: it controls which device gets onto a segment, so port-level controls matter most.

**Why it matters:** an attacker with control of a core switch can mirror traffic to their own port and read every unencrypted session in the building.

**Common confusions:** Changing the SNMP port number does not secure SNMP; moving to SNMPv3 does. Port security (limits devices by hardware address) is weaker than 802.1X (authenticates the device or user), because hardware addresses can be spoofed.

**Scenario:** An audit finds switches managed with Telnet and SNMPv2c using the community string "public". The fix is SSH plus SNMPv3 and a new strong configuration. Simply changing the community string is the closest wrong answer, because SNMPv2c still sends it in clear text.

### Hardening cloud infrastructure
Hardening cloud infrastructure means securing the parts of a cloud service that the customer controls: identities and their permissions, network rules, storage settings, logging, and the workloads running there. Under the shared responsibility model the provider secures the physical data center and its own platform, while the customer remains responsible for configuration, identities and data. These are mostly preventive technical and managerial controls.

Steps, with reasons:
1. **Lock down identity first.** Least-privilege roles, MFA (multifactor authentication) on every administrator, no long-lived access keys where short-lived credentials are possible. In the cloud, identity is the main perimeter.
2. **Close storage to the public by default.** A publicly readable storage bucket is one of the most common cloud breaches.
3. **Tighten network security groups and firewall rules.** Allow only the ports and sources needed; never leave management ports open to the internet.
4. **Turn on logging and monitoring** of the control plane (who changed what) and of workloads, sent to a place attackers cannot erase.
5. **Harden the workloads** (virtual machines, containers) like any server: patch, minimal images, endpoint protection.
6. **Use policy and posture tools** that flag misconfiguration continuously, because cloud settings change quickly through code and consoles.

**Why it matters:** cloud misconfiguration can expose millions of records with no exploit at all, only a wrong checkbox, and the customer carries that liability, not the provider.

**Common confusions:** Moving to the cloud does not transfer responsibility for configuration. Encryption at rest that the provider turns on by default does not help if the bucket is readable by anyone, because the service decrypts data for any authorized reader. A cloud security group is a firewall rule set, not an identity control.

**Scenario:** A developer opened a database's management port to "any source" for testing and forgot. The answer is a tighter security group allowing only the admin network, plus a posture check that alerts on such rules. Rotating the database password is the closest wrong answer: it limits one attack, but the service stays exposed to the internet.

### Hardening mobile devices (hardening target)
Hardening phones and tablets reduces the ways a lost, stolen or compromised device can expose company data. Because these devices travel, connect to untrusted networks and mix personal and work use, hardening relies on central enforcement through mobile device management (MDM). These are mainly preventive technical controls, with remote wipe as a corrective one.

Steps, with reasons:
1. **Require a strong screen lock and device encryption.** A lost phone without them is an open file cabinet.
2. **Keep the operating system and apps updated.** Update timing depends on the manufacturer and, for some phones, the carrier, so older models may stop getting fixes; MDM can block devices below a minimum version.
3. **Control app sources.** Allow only the official store or an enterprise catalog, and vet apps. Sideloaded apps are a common malware path.
4. **Separate work data from personal data** with containerization or a work profile, so work data can be wiped without touching personal photos.
5. **Block rooted or jailbroken devices.** Rooting removes the operating system's built-in restrictions.
6. **Enable remote lock, locate and wipe** for loss or theft.

NIST SP 800-124 Rev. 2 advises treating every mobile device as untrusted until it is secured and continuously monitored.

**Why it matters:** phones hold email, multifactor tokens and saved sessions. One unencrypted, unmanaged phone can give an attacker the keys to cloud accounts.

**Common confusions:** MDM is the tool; hardening is the result it enforces. Remote wipe is corrective, not preventive. Containerization protects company data on a personal device; it does not protect the personal side.

**Scenario:** Sales staff lose phones often, and the company must make sure the data on them cannot be read. The answer is enforced encryption and screen locks through MDM with remote wipe. Remote wipe alone is the closest wrong answer, because a thief may keep the phone offline so the wipe command never arrives, while encryption protects data either way.

### Hardening ICS/SCADA (industrial control systems)
Industrial control systems (ICS), including supervisory control and data acquisition (SCADA) systems, run physical processes such as power, water, pipelines and factory lines. Their first priorities are safety and availability, many run old software and protocols without authentication, and they often cannot be rebooted or patched on short notice. Hardening therefore leans on network architecture and access control rather than frequent patching.

Steps, with reasons:
1. **Segment the control network from the business network**, with tightly filtered conduits or, for the most critical systems, an air gap. Most ICS attacks arrive through the business network.
2. **Strictly control remote access**: no direct vendor connections; use a monitored jump host with MFA (multifactor authentication). Unmanaged remote access is a frequent entry point.
3. **Plan patching** in maintenance windows after vendor approval and testing, because an untested patch can stop production or affect safety.
4. **Remove unneeded services and change defaults** on engineering workstations and controllers.
5. **Monitor passively** for unusual commands, since active scanning can disrupt fragile devices.
6. **Keep an accurate asset inventory**; you cannot isolate what you do not know is there.

NIST SP 800-82 Rev. 3 covers operational technology (OT) security and stresses that these systems differ from ordinary IT in safety and timing needs.

**Why it matters:** an ICS compromise can cause physical damage, outages for whole communities, environmental harm or injury, not only data loss.

**Common confusions:** "Cannot patch" does not mean "nothing to do"; segmentation and monitoring are the answer. Availability outranks confidentiality here, the reverse of many IT systems. A vulnerability scan that is routine in IT can crash a controller, so passive monitoring is preferred.

**Scenario:** A water utility's controllers run a vendor-locked operating system that cannot be updated for a year. The answer is to place them in an isolated segment with strictly filtered access and monitoring. Installing an endpoint security agent is the closest wrong answer: the vendor often does not support third-party software on the controller, and it could disturb timing.

### Hardening embedded systems, RTOS and IoT devices
These three targets share one problem: you often cannot install security software or get timely updates. An embedded system is a computer built into a device for one job (a printer, a medical pump, a car controller). A real-time operating system (RTOS) guarantees responses within strict time limits, so it is used where timing is safety critical. Internet of Things (IoT) devices are network-connected everyday devices such as cameras, sensors and smart speakers, frequently shipped with weak defaults.

Steps, with reasons:
1. **Change default credentials immediately.** Botnets such as Mirai spread by logging in with factory passwords.
2. **Apply firmware updates when the vendor offers them**, and prefer vendors with a published support period and update process.
3. **Disable unused features and remote services** (for example cloud access or Telnet on a camera).
4. **Isolate them on their own network segment** with only the traffic they need. This is the main control when updates are rare.
5. **Inventory them**, because embedded and IoT devices are often missing from asset lists.
6. **For an RTOS, test any change for timing effects** before deployment. Added software can break the timing guarantee the system exists for.

NIST SP 800-213 lists device capabilities organizations should require from IoT devices, such as a way to update software and to change configuration securely.

**Why it matters:** these devices sit on internal networks with little monitoring. A compromised camera can be a foothold into the office network or a source of attack traffic against others.

**Common confusions:** An RTOS is defined by deterministic timing, not by being small. IoT and embedded overlap: most IoT devices are embedded systems, but not every embedded system is networked. Segmentation does not fix the device; it limits what a compromise can reach.

**Scenario:** A hospital has infusion pumps on the main network whose firmware has a known flaw and no update for months. The answer is to segment them with tightly limited traffic. Replacing the firmware with an unofficial build is the closest wrong answer, because it can void certification and safety approval.

### Hardening targets compared (workstations, servers, network devices, cloud, ICS, embedded, RTOS, IoT)
All hardening targets share the same core moves: patch, change defaults, remove what is not needed, least privilege, logging. What separates them is the constraint that decides the main control. Use this table to pick the decisive control for a device in a scenario.

| Target | Decisive constraint | Main control in a scenario |
|---|---|---|
| Workstation | A user clicks things; laptops get lost | Standard user rights, endpoint protection, disk encryption |
| Server | Many clients reach it; holds valuable data | Minimal roles and services, strict admin access |
| Switch | Controls who joins a segment | Encrypted management, unused ports shut, 802.1X |
| Router | Sits at a network boundary | ACLs (access control lists), encrypted and restricted management |
| Cloud infrastructure | Customer owns configuration and identity | Least-privilege identity, no public storage, logging |
| Mobile device | Travels, mixes personal and work use | MDM: encryption, lock, containerization, wipe |
| ICS (industrial control systems)/SCADA | Safety and uptime first, hard to patch | Segmentation or air gap, strict remote access |
| Embedded system | Limited resources, vendor-only firmware | Isolation, default credentials changed |
| RTOS | Strict timing guarantees | Isolation, careful vendor-tested updates |
| IoT device | Weak defaults, short vendor support | Default passwords changed, own segment |

Abbreviations: ACL means access control list, MDM means mobile device management, ICS/SCADA means industrial control systems and supervisory control and data acquisition, RTOS means real-time operating system, IoT means Internet of Things.

**Why it matters:** good security work means choosing the control that respects the constraint. Recommending "install an agent" on a controller or "patch weekly" on a safety system shows the constraint was missed.

**Common confusions:** Segmentation appears in several rows; it is the answer whenever the device itself cannot be fixed. Encryption at rest is decisive for portable devices, much less for a server in a locked room.

**Scenario:** The clue "cannot be patched, supports a physical process, must not go down" points to ICS segmentation. The clue "cheap camera, default admin password, vendor stopped updates" points to changing credentials and isolating the IoT device. Mixing them up, for example air-gapping a camera when its password is still "admin", leaves the easier attack open.

### Choosing a computing-resource technique (decision path)
Use this path when a scenario describes a device or system and asks for the best technique. Start from the goal or constraint, not from the tool you like.

1. **"Many systems of one type must be configured the same way and kept that way"**: a secure baseline, deployed centrally (Group Policy, MDM, configuration management) and checked for drift.
2. **"The device cannot be patched or cannot run security software"** (ICS, embedded, RTOS (real-time operating system), old IoT): segmentation and strict access control. Do not choose an endpoint agent.
3. **"Phones and tablets with company data, some personal"**: mobile device management (MDM) with containerization; the deployment model decides how much control is acceptable.
4. **"Wireless coverage leaks outside or has dead zones"**: a site survey and heat map, then adjust placement and power.
5. **"Shared Wi-Fi passphrase, need per-user logins and records"**: WPA3-Enterprise with 802.1X and a RADIUS (Remote Authentication Dial-In User Service) server.
6. **"Captured handshakes, offline passphrase guessing"**: WPA3-Personal with Simultaneous Authentication of Equals (SAE).
7. **"Injection through a form or API"**: server-side input validation plus parameterized queries; output encoding for cross-site scripting.
8. **"Session cookie stolen by script or sent over HTTP"**: cookie attributes HttpOnly and Secure, with SameSite.
9. **"Flaws should be found before code runs"**: static code analysis in the build pipeline.
10. **"Users must trust that software came from us unchanged"**: code signing.
11. **"Untrusted file or code must run without touching real systems"**: sandboxing.
12. **"Need to know when a hardened system changes or is attacked"**: monitoring. In this objective monitoring means continuously collecting and reviewing logs and events from these resources; see `### Monitoring computing resources (systems, applications, infrastructure)`.

When NOT to use: do not pick a sandbox to protect production data (it isolates execution, it does not encrypt), code signing to prove code is safe (it proves origin and integrity only), or segmentation when a patch is available and approved (fix the flaw itself).

**Why it matters:** most real situations contain one decisive constraint. Naming it first prevents choosing a true but secondary control.

**Scenario:** "Contractors bring their own laptops to a plant floor network that controls machinery." The decisive clue is the control network, so the answer is segmentation keeping contractor devices off the ICS segment, not a stronger Wi-Fi password.

### Wireless site surveys (installation considerations)
A wireless site survey studies how radio signals behave in a specific building before and after access points are installed. It answers where to place access points, which channels and power levels to use, and what interferes, and it can reveal rogue or unknown access points. It is a planning activity that supports availability (coverage and performance) and confidentiality (limiting signal outside the intended area).

How it works:
1. **Predictive survey (planning):** software models coverage from floor plans and wall materials before hardware exists. Reason: cheap first design.
2. **Passive survey:** a survey device listens without joining a network, recording access points, signal strength, noise and channel use. Reason: shows the real radio environment, including neighbors and rogue devices.
3. **Active survey:** the device joins the network and measures real performance such as throughput, retries and loss. Reason: confirms users actually get service, not only signal.
4. **Adjust and repeat:** move access points, change channels or power, and survey again after renovations, new tenants or complaints.

NIST SP 800-153 recommends regular wireless security assessments, at least yearly overall and more often unless continuous wireless monitoring already covers the gaps, including searching for rogue access points.

**Why it matters:** a poorly planned network leaks signal to the parking lot, where an attacker can work unseen, or leaves dead zones that push staff to set up their own unauthorized access points.

**Common confusions:** A site survey is the activity; a heat map is one of its outputs. A survey is not a penetration test of the wireless network, though it can find rogue devices. A survey is not one and done; buildings and neighbors change.

**Scenario:** After a neighbor moved in, users report slow Wi-Fi near one wall. The answer is a new site survey to find channel interference and adjust channels. Raising transmit power is the closest wrong answer: it can worsen interference and push signal further outside the building.

### Wireless heat maps
A wireless heat map is a floor plan colored by measured signal strength, built from site survey data. Strong coverage, weak coverage and dead zones show up at a glance, and so does signal spilling outside the walls. It is a planning and verification tool that supports availability and helps limit exposure of the wireless network to outsiders.

How it is made:
1. Import a floor plan into the survey tool and set its scale. Reason: positions must match real distances.
2. Walk the area taking measurements (passive or active), or model them predictively.
3. The tool colors each spot by received signal strength, often with extra layers for noise, signal-to-noise ratio and channel overlap. Reason: strong signal alone does not mean good service if noise is high.
4. Use the map to move access points, change power, or add units, then measure again.

**Why it matters:** the map is evidence. It shows management why an access point must move, and it shows where an outsider in the car park could still connect to the network.

**Common confusions:** A wireless heat map is not a security information and event management (SIEM) dashboard or a risk heat map; it shows radio signal. A heat map shows signal, not who is connected. Strong signal outside the building is a security finding even when users inside are happy.

**Scenario:** Management wants proof of whether the guest Wi-Fi can be reached from the street. The answer is a heat map from a site survey that includes the area outside. A list of connected clients from the controller is the closest wrong answer: it shows who connected, not where the signal reaches.

Mini-example of a survey note: `Zone: north lot | Signal: -62 dBm (usable) | Source AP: AP-3F-02 | Action: reduce power, re-aim antenna`.

### Mobile device management (MDM)
Mobile device management (MDM) is a central system that enrolls phones and tablets and enforces security policy on them: passcodes, encryption, allowed apps, network settings, operating system versions, and remote lock or wipe. It solves the problem of many devices living outside the office where nobody can configure them by hand. It is a technical control that is preventive (policy), detective (compliance reporting) and corrective (wipe). Broader suites are called enterprise mobility management (EMM), which adds app and content management.

How it works:
1. **Enroll** the device (company devices often at first power-on; personal devices by installing a profile or app). Reason: no enrollment, no control.
2. **Push policy**: screen lock, encryption, minimum operating system version, Wi-Fi and VPN profiles, certificate deployment.
3. **Manage apps**: allow lists or block lists, a company app catalog, silent install of required apps.
4. **Separate data** with containerization or a work profile, so company data stays in a managed space.
5. **Check compliance continuously** and block noncompliant devices from email or apps (often together with conditional access).
6. **Respond** to loss or departure: remote lock, locate, full wipe for company devices, selective (work-only) wipe for personal ones.

Mobile application management (MAM) is a lighter option that manages only company apps, without enrolling the whole device. NIST SP 800-124 Rev. 2 notes that for bring your own device programs, MAM can ease users' privacy concerns.

**Why it matters:** without MDM, a company cannot prove that devices holding customer data are encrypted, cannot remove access when an employee leaves, and cannot react to a lost phone.

**Common confusions:** MDM works with every deployment model; what changes is how much control the owner accepts. A full wipe on an employee-owned phone deletes personal data and creates legal and trust problems, so selective wipe is used there. MDM is not antivirus; mobile threat defense tools add malware and network threat detection.

**Scenario:** An employee resigns and keeps her personal phone, which holds company email. The answer is a selective wipe of the work container through MDM. A full device wipe is the closest wrong answer: it removes her personal data from a device the company does not own.

### Mobile deployment models: BYOD vs COPE vs CYOD
Deployment models decide who owns a mobile device, who chooses it and how much the company may control it. The choice trades user freedom and cost against company control and privacy. This objective covers bring your own device (BYOD), choose your own device (CYOD) and corporate-owned personally enabled (COPE).

| Model | Owner | Who picks the device | Personal use | Company control |
|---|---|---|---|---|
| BYOD | Employee | Employee | Yes, it is their phone | Lowest; usually only a work container or managed apps |
| COPE | Company | Company | Allowed within limits | Full; the device and its data belong to the company |
| CYOD | Company in the common usage (NIST describes an employee-bought variant) | Employee, from an approved list | Usually allowed | High when company owned |

How each plays out:
- **BYOD** saves hardware cost but brings many device types, unknown history (possibly rooted), and privacy conflicts when the company wants to monitor or wipe. Control usually comes from containerization or mobile application management.
- **COPE** gives the company full ownership, so it can wipe and enforce anything, while letting staff use it personally, which raises privacy expectations that must be explained.
- **CYOD** gives users a choice from a short list of models the company can support and secure. Two usages exist. In the common industry and certification usage, the company buys and owns the device the employee picked. NIST SP 800-124 Rev. 2 instead describes a CYOD device as bought by the employee for personal use from the company's approved list, with ownership staying with the employee. When a situation states who pays or owns, follow it; otherwise assume company owned, user chooses. The fixed part of both usages is the approved list.

**Why it matters:** the model decides what the company may legally and practically do after loss, theft or departure, and how much risk unknown devices bring.

**Common confusions:** "Choose" in CYOD is about selection from an approved list; it does not by itself say who owns the device. COPE allows personal use; corporate-owned business-only devices (sometimes called COBO) do not. BYOD does not mean no security; it means lighter, separated control.

**Scenario:** A firm wants employees to pick between three phone models, pays for them and wants full remote wipe. The answer is CYOD. COPE is the closest wrong answer, because in COPE the company picks the single model; the clue "pick between three" is the CYOD signal.

### Mobile connection methods: cellular and Wi-Fi
Mobile devices reach networks mainly through the carrier's cellular network and through Wi-Fi. Each path has its own risks, and both often bypass the company's own network controls. Securing them uses technical controls pushed through mobile device management (MDM): VPN profiles, network restrictions and encryption requirements.

**Cellular** (4G, 5G): traffic goes from the phone to the carrier, not through the company network, so corporate web filters, data loss prevention and monitoring do not see it unless the device uses a VPN or cloud security service. The radio link is normally encrypted, but NIST SP 800-187 notes that LTE (4G) leaves encryption of user traffic over the air as an operator option, and that the phone indicator meant to show an unencrypted connection is not widely implemented, so users usually cannot tell. Related threats: fake (rogue) base stations, which can also push a phone down to older, weaker 2G service; SIM swapping, where an attacker talks the carrier into moving the victim's phone number to the attacker's SIM card and then receives the victim's text-message codes (CISA advises a PIN and MFA on the carrier account); and location tracking by the carrier or by anyone with access to its data.

**Wi-Fi**: public or unknown networks expose devices to eavesdropping, rogue access points, evil twins (fake networks copying a trusted name) and on-path attacks. Controls: join only WPA3 or WPA2 protected networks where possible, use a VPN on untrusted networks, verify captive portals, and let MDM restrict auto-joining open networks.

How to secure them, in order:
1. Decide what must be protected (company apps and data).
2. Enforce an always-on or per-app VPN for untrusted paths.
3. Restrict risky settings (auto-join open Wi-Fi, hotspot sharing) through MDM.
4. Monitor through a cloud security service when traffic never touches the office.

**Why it matters:** a sales team working from airports and cellular data may never pass the company firewall, so controls that only live at the office do not protect them.

**Common confusions:** Cellular encryption protects the radio link only; data still travels unencrypted across the carrier and the internet unless the application or a VPN encrypts it. A strong Wi-Fi password does not stop an evil twin that copies the network name; certificate-based server checks and VPNs do.

**Scenario:** Remote staff upload files over hotel Wi-Fi and phone hotspots, and the company must inspect that traffic. The answer is an always-on VPN or cloud security service enforced by MDM. Requiring WPA3 on the office network is the closest wrong answer, because the traffic never reaches the office network.

### Bluetooth (mobile connection method)
Bluetooth is a short-range wireless link for headsets, watches, keyboards, cars and file transfer. Short range reduces but does not remove the risk: attackers nearby, or with directional antennas, can try to pair, track or exploit devices. Controls are technical (configuration through mobile device management, MDM) and administrative (pairing rules).

Known attacks, as NIST SP 800-121 Rev. 2 describes them:
- **Bluejacking**: sending unsolicited messages to a nearby device. The message itself does no harm, but it can lure the user into a harmful response, like spam or phishing.
- **Bluesnarfing**: forcing a connection to read data from the device (contacts, messages, device identifiers) through a flaw, first seen in older devices.
- **Bluebugging**: taking control of the device's commands without the user knowing (calls, messages, eavesdropping), also through old firmware flaws.

Controls, with reasons:
1. **Keep Bluetooth off or non-discoverable unless pairing.** NIST advises devices stay undiscoverable except when pairing; discoverable devices are easier to find and attack.
2. **Pair only in private places and confirm codes** on both screens. Pairing is when keys are created.
3. **Remove old pairings** and refuse unknown requests.
4. **Patch firmware and the operating system**, since the classic attacks exploited old firmware.
5. **Use MDM** to restrict Bluetooth file transfer on company devices.

**Why it matters:** an exploited Bluetooth stack can expose contacts, messages and sometimes full device control, with no network connection at all, so network security tools never see it.

**Common confusions:** Bluejacking sends; bluesnarfing steals. Low energy Bluetooth adds privacy features such as changing random addresses, which reduce tracking but do not stop every attack.

**Scenario:** Executives complain about strange contact cards appearing on their phones at a conference. The answer is bluejacking, controlled by making devices non-discoverable. Bluesnarfing is the closest wrong answer, because nothing was taken from the phones; messages were pushed to them.

### Wi-Fi Protected Access 3 (WPA3)
Wi-Fi Protected Access 3 (WPA3) is the current Wi-Fi security certification and the default answer for new wireless networks. It fixes the main weakness of WPA2-Personal: a captured connection handshake let an attacker guess the passphrase offline. It is a preventive technical control at the data link layer protecting confidentiality and integrity of wireless traffic. The Wi-Fi Alliance requires WPA3 support in newly certified Wi-Fi devices.

#### WPA3-Personal and Simultaneous Authentication of Equals (SAE)
How a WPA3-Personal connection works:
1. **SAE exchange.** Client and access point run Simultaneous Authentication of Equals (SAE, also called Dragonfly), proving both know the passphrase and agreeing on a fresh, strong secret, without sending anything an eavesdropper can use to test password guesses. Reason: WPA2-PSK derived the key straight from the passphrase, so a recorded handshake allowed unlimited offline guessing.
2. **4-way handshake.** The usual handshake still runs after SAE and creates the session keys. Common wrong idea: SAE replaces the 4-way handshake. It replaces how the starting secret is made.
3. **Protected traffic** with at least AES-CCMP-128, and protected management frames (PMF) required.

Results: offline dictionary attacks stop working (an attacker must guess live, one try per exchange), and SAE gives forward secrecy, so learning the passphrase later does not decrypt recorded old sessions. In the 6 GHz band (Wi-Fi 6E and Wi-Fi 7) SAE must use the hash-to-element method, because the older hunting-and-pecking method can leak timing and cache side-channel information that lets an attacker run a dictionary attack on the passphrase.

#### WPA3-Enterprise, transition mode and newer bands
- **WPA3-Enterprise** uses 802.1X with a RADIUS (Remote Authentication Dial-In User Service) server for per-user logins. An optional 192-bit mode uses AES-GCMP-256 and stronger suites for high-security networks.
- **Transition mode** lets WPA2 and WPA3 clients share one network name. WPA2 clients still get only WPA2 protection, and downgrade attacks are possible, so vendors advise using it only during migration.
- **6 GHz band (Wi-Fi 6E and Wi-Fi 7):** WPA2 and unencrypted open networks are not allowed; networks must use WPA3 or Enhanced Open, with PMF mandatory.
- **Wi-Fi 7:** vendor deployment guides list GCMP (Galois/Counter Mode Protocol)-256 with the extended SAE key management (SAE-EXT-KEY) for WPA3-Personal, and GCMP-256 for WPA3-Enterprise, as what Wi-Fi 7 features need; CCMP-128 is still accepted so older clients can join. Study materials often shorten WPA3 to "uses GCMP"; the precise statement is CCMP-128 as the minimum, GCMP-256 in the 192-bit mode, and GCMP-256 for Wi-Fi 7 operation.

**Why it matters:** a weak WPA2 passphrase on a busy network can be cracked from one recorded handshake, giving the attacker access to the internal network.

**Common confusions:** WPA3-Personal still uses a shared passphrase; it just protects it far better. For per-user identity you still need enterprise mode. Enhanced Open (Opportunistic Wireless Encryption) encrypts open networks without a password but does not authenticate the network.

**Scenario:** An attacker records handshakes in the car park to crack the passphrase later. The answer is WPA3-Personal with SAE. A longer WPA2 passphrase is the closest wrong answer: it slows guessing but still allows offline attempts.

### Protected management frames (PMF, IEEE 802.11w)
Protected management frames (PMF), defined in IEEE 802.11w, add cryptographic integrity protection to certain Wi-Fi management frames, such as deauthentication and disassociation messages, so outsiders cannot forge or replay them. The Wi-Fi Alliance says PMF protects unicast management action frames against eavesdropping and forging, and multicast ones against forging. It is a preventive technical control that protects availability and integrity of the wireless connection.

How it works:
1. Client and access point first complete a WPA2 or WPA3 handshake (personal or 802.1X). Reason: PMF uses the keys that handshake creates.
2. Protected management frames then carry an integrity check based on those keys.
3. A forged or replayed frame fails the check and the receiver drops it, so a fake "disconnect" no longer kicks the client off.
4. PMF can be set to required, or optional so older clients without it can still join.

A classic open network has no keys, so PMF cannot protect it. PMF is mandatory for WPA3-only networks and for the 6 GHz band (in WPA3 transition mode it is offered but not forced on WPA2 clients), and the Wi-Fi Alliance requires PMF support in all newly certified devices.

**Why it matters:** forged deauthentication frames are a cheap denial-of-service attack and a common first step of an evil twin attack: knock clients off, then let them reconnect to the attacker's copy of the network.

**Common confusions:** PMF does not encrypt user data; data protection comes from CCMP (Counter Mode with CBC-MAC Protocol) or GCMP (Galois/Counter Mode Protocol). PMF does not stop radio jamming, which is a physical-layer attack. PMF as defined in 802.11w protects only some management frames; frames sent before the handshake, such as probe exchanges, and classic beacons are not covered by it.

**Scenario:** Laptops keep disconnecting every few minutes, and a wireless monitor shows a flood of deauthentication frames from an unknown source. The answer is to require PMF (or move to WPA3, which requires it). Changing the network passphrase is the closest wrong answer, because forged deauthentication frames never needed the passphrase.

Mini-example of the attack in a wireless intrusion log: `Alert: deauth flood | Frames: 4,200 in 60 s | Spoofed source: AP BSSID 3C:...:21 | Clients affected: 37`.

### AAA and RADIUS in enterprise Wi-Fi
AAA stands for authentication (who are you), authorization (what may you do) and accounting (what did you do, recorded). Remote Authentication Dial-In User Service (RADIUS) is the common AAA protocol behind enterprise Wi-Fi, VPNs and network switches. It replaces a shared Wi-Fi passphrase with per-user or per-device credentials checked by a central server, a technical preventive control with a detective accounting record.

How it works in enterprise Wi-Fi:
1. The client connects; the access point acts as the network access server, the RADIUS client, and blocks normal traffic.
2. The user's credentials travel inside an Extensible Authentication Protocol (EAP) exchange through the access point to the RADIUS server.
3. The RADIUS server checks them, usually against a directory such as Active Directory, and answers Access-Accept, Access-Reject or Access-Challenge (asking for another input).
4. On accept, the server can also send authorization details, such as which VLAN (virtual LAN) the user belongs in.
5. The access point sends accounting records (start, stop, data used) to the server.

RADIUS runs over UDP; the assigned ports are 1812 for authentication and 1813 for accounting, and early deployments used 1645 and 1646 (see the Reference chapter for port tables). The access point and server share a secret that is never sent. RADIUS hides only the user password field, using a calculation over that shared secret; the rest of the packet is readable.

**Why it matters:** with per-user credentials, one departing employee's access can be removed in the directory without changing the Wi-Fi passphrase for hundreds of people, and accounting shows who was connected when.

**Common confusions:** RADIUS is the server protocol; 802.1X is the port-based access framework; EAP carries the login method. RADIUS does not encrypt the whole conversation. TACACS+ is the other AAA protocol, used mostly for administrator access to network devices.

**Scenario:** A company must stop using one shared Wi-Fi passphrase and record which user connected and when. The answer is WPA3-Enterprise (or WPA2-Enterprise) with 802.1X and a RADIUS server. A stronger WPA3-Personal passphrase is the closest wrong answer, because it still gives everyone the same credential and no per-user record.

### RADIUS vs TACACS+ for Wi-Fi access and device administration
Remote Authentication Dial-In User Service (RADIUS) and Terminal Access Controller Access-Control System Plus (TACACS+) both centralize authentication, authorization and accounting (AAA). They differ in transport, how much they protect and how they split the AAA functions, which decides where each is used.

| Feature | RADIUS | TACACS+ |
|---|---|---|
| Transport and port | UDP, 1812 authentication, 1813 accounting | TCP, port 49 |
| What is protected | Only the user password field is hidden | The whole packet body is obfuscated |
| AAA functions | Authentication and authorization combined | Separate authentication, authorization and accounting |
| Typical use | Network access: Wi-Fi, VPN, 802.1X | Administrator access to routers and switches, with per-command authorization |
| Standard | Open IETF standard | RFC 8907 documents it; originated at Cisco |

RFC 8907 points out that TACACS+ body protection is obfuscation, not real encryption: it gives no meaningful integrity, privacy or replay protection by modern standards, so it should run only on a secured, private network or inside a secure transport. Study material often says TACACS+ "encrypts the entire payload"; read that as "protects the whole body, more than RADIUS does".

**Why it matters:** choosing per-command authorization for network administrators (who may run which command, logged) is a strong control against insider mistakes and stolen admin accounts.

**Common confusions:** Neither protocol replaces MFA (multifactor authentication). RADIUS is not obsolete; it remains the standard for network access. Both rely on a shared secret, which should be long and unique per client.

**Scenario:** Network engineers must be limited to read-only commands on core routers, and every command logged. The answer is TACACS+, because it authorizes each command separately. RADIUS is the closest wrong answer: it can assign a privilege level at login but does not authorize individual commands.

### Wireless cryptographic protocols (CCMP, GCMP, legacy WEP and TKIP)
Wireless cryptographic protocols encrypt Wi-Fi traffic and check it was not altered. They protect the data itself, while authentication protocols prove who is connecting. Both work at the data link layer, protecting confidentiality and integrity.

The protocols, from current to broken:
- **CCMP** (Counter Mode with Cipher Block Chaining Message Authentication Code Protocol) uses the Advanced Encryption Standard (AES) with a 128-bit key. It is the WPA2 protocol and the minimum for WPA3-Personal.
- **GCMP-256** (Galois/Counter Mode Protocol with a 256-bit AES key) is used by the WPA3-Enterprise 192-bit mode and, according to vendor guides, by WPA3 in both personal and enterprise modes for Wi-Fi 7 operation; CCMP-128 stays allowed there so older clients can still join.
- **TKIP** (Temporal Key Integrity Protocol) was a temporary fix for WEP (Wired Equivalent Privacy) on old hardware. It is legacy and broken, and WPA3 does not allow it.
- **WEP** (Wired Equivalent Privacy) is legacy and broken: its protection can be defeated from captured traffic. It must never be used.

How to read a setting: the security mode (WPA2, WPA3) decides the handshake and rules; the cipher (CCMP or GCMP) does the encryption; personal or enterprise decides the authentication. A network shown as "WPA2-PSK (TKIP)" is using a broken cipher even though the mode says WPA2.

**Why it matters:** an old access point or client that falls back to TKIP lowers the whole network's protection, and auditors treat WEP or TKIP as a finding to fix immediately.

**Common confusions:** "WPA3 uses GCMP" is the study-guide shortcut; WPA3-Personal on pre-Wi-Fi 7 gear typically runs CCMP-128; GCMP-256 is required in the 192-bit enterprise mode, and vendor guides list it for Wi-Fi 7 operation. AES is the cipher; CCMP and GCMP are the ways it is used for Wi-Fi. A cryptographic protocol does not prove identity.

**Scenario:** An inventory finds old barcode scanners that support only TKIP, keeping the warehouse network in a mixed mode. The answer is to replace the scanners (or isolate them on a separate, restricted network while replacing them) and disable TKIP. Strengthening the passphrase is the closest wrong answer, because the weakness is the cipher, not the password.

### Wireless authentication protocols (IEEE 802.1X and EAP methods)
Authentication protocols prove who or what is joining a wireless network. In enterprise Wi-Fi, IEEE 802.1X is the port-based access control framework: the access point keeps the "port" closed until an authentication server says yes. The Extensible Authentication Protocol (EAP) carries the actual login method between the client (supplicant), the access point (authenticator) and the RADIUS server (authentication server). It is a preventive technical control for identity, the "authentication" leg of AAA (authentication, authorization and accounting).

How it works:
1. The client associates; the access point allows only EAP traffic.
2. The client and RADIUS server agree on an EAP method.
3. Most methods first build a Transport Layer Security (TLS) tunnel, authenticated by the server's certificate, so the client can confirm it is talking to the real server. Reason: without checking the server, clients can hand credentials to an evil twin.
4. The client proves its identity, with a certificate or a password method inside the tunnel.
5. On success, keys are derived and the WPA2 or WPA3 4-way handshake protects the session.

The methods:
- **EAP-TLS**: both sides present certificates (mutual certificate authentication). Strongest of the common methods; needs a public key infrastructure to issue client certificates.
- **PEAP** (Protected EAP): server certificate only; the client logs in inside the tunnel, commonly with a password method (MS-CHAPv2).
- **EAP-TTLS** (Tunneled TLS): server certificate, client certificate optional; the tunnel can carry older methods such as PAP, CHAP, MS-CHAPv2 or another EAP method.
- **EAP-FAST** (Flexible Authentication via Secure Tunneling): designed so a tunnel can be built from a Protected Access Credential (PAC), a shared secret the server issued earlier, rather than requiring certificates.

**Why it matters:** password-based methods protect only as well as the client checks the server certificate. Misconfigured clients that skip that check are a common way credentials leak to fake access points.

**Common confusions:** 802.1X is the framework, EAP is the carrier, RADIUS is the server protocol; three different layers of the same login. PEAP does not mean "no certificates"; the server still needs one. EAP-TLS is about certificates on both sides, not about TLS alone.

**Scenario:** A company wants Wi-Fi logins that cannot be phished with a fake access point and needs no passwords at all. The answer is EAP-TLS with client certificates. PEAP is the closest wrong answer, because it still relies on user passwords inside the tunnel.

### EAP-TLS vs PEAP vs EAP-TTLS vs EAP-FAST (wireless EAP methods compared)
All four methods carry an enterprise Wi-Fi login between the client and the RADIUS (Remote Authentication Dial-In User Service) server inside an IEEE 802.1X exchange. The Extensible Authentication Protocol (EAP) methods differ mainly in what credentials each side needs.

| Method | Server proves itself with | Client proves itself with | Decisive feature |
|---|---|---|---|
| EAP-TLS | Certificate | Certificate | Mutual certificates, no passwords; strongest, needs client certificates |
| PEAP | Certificate | Usually a password (MS-CHAPv2) inside the TLS tunnel | Common in Windows domains; password-based |
| EAP-TTLS | Certificate | Client certificate optional; older methods (PAP, CHAP, MS-CHAPv2, EAP) inside the tunnel | Flexible, carries legacy password methods safely |
| EAP-FAST | A Protected Access Credential (PAC) or certificates | Password or other method inside the tunnel | Tunnel can be built from a PAC instead of certificates |

Abbreviations: TLS means Transport Layer Security, PEAP means Protected EAP, TTLS means Tunneled TLS, FAST means Flexible Authentication via Secure Tunneling, PAP and CHAP are old password protocols, MS-CHAPv2 is Microsoft's challenge-handshake version 2.

How to pick: no passwords and highest assurance points to EAP-TLS; existing password directory and server certificate only points to PEAP or EAP-TTLS; a need to carry an old password method in a tunnel points to EAP-TTLS; a tunnel without a certificate infrastructure points to EAP-FAST.

**Why it matters:** the method decides whether stolen passwords can reach the network and how much certificate infrastructure the company must run.

**Common confusions:** All these methods sit under 802.1X and use a RADIUS server; none replaces them.

**Scenario:** Clue: "devices already receive certificates from our internal certificate authority; we want to remove Wi-Fi passwords". Answer: EAP-TLS. PEAP is the closest wrong answer because its client side is still a password.

### Choosing wireless security settings (decision path)
Use this path when a wireless scenario asks for the best setting. Each line goes from the constraint to the setting, then names when not to use it.

1. **Small office, no directory server, one passphrase is acceptable**: WPA3-Personal (SAE). Not for organizations that need per-user identity or accounting.
2. **Need per-user logins, revocation of one person, accounting**: WPA3-Enterprise with IEEE 802.1X and RADIUS (Remote Authentication Dial-In User Service). Not where no directory or RADIUS server can be run; then WPA3-Personal with a strong passphrase.
3. **Devices already have certificates, want no passwords**: EAP-TLS (Extensible Authentication Protocol with Transport Layer Security). Not where client certificates cannot be issued or managed.
4. **Password directory exists, certificates only on the server**: PEAP (Protected EAP) or EAP-TTLS, with clients set to validate the server certificate. Never without that validation.
5. **High-security network (government, defense)**: WPA3-Enterprise 192-bit mode, which uses GCMP-256 (Galois/Counter Mode Protocol with a 256-bit key).
6. **Mixed old and new clients during migration**: WPA3 transition mode, temporarily, with a date to turn it off. Not as a permanent setting, because WPA2 clients stay at WPA2 strength.
7. **Guest network without a password, but traffic should not be readable by other guests**: Enhanced Open (Opportunistic Wireless Encryption). It encrypts but does not authenticate the network.
8. **Deauthentication attacks or evil twin risk**: require protected management frames (PMF).
9. **Hardware supports only WEP (Wired Equivalent Privacy) or TKIP (Temporal Key Integrity Protocol)**: replace or isolate it. Never enable WEP or TKIP to keep it working.
10. **Signal leaks outside or dead zones**: site survey and heat map, then adjust placement and power. Settings alone do not fix coverage.

**Why it matters:** a wireless requirement usually contains one decisive clue (shared passphrase, certificates, legacy devices, guests). Matching the clue to the line above avoids a technically true but weaker answer.

**Common confusions:** Transition mode is a migration aid, not a security level. WPA3 does not by itself give per-user logins; enterprise mode does.

**Scenario:** A clinic with a directory server wants staff Wi-Fi tied to each employee's account and guest Wi-Fi with no password. The answer is WPA3-Enterprise with 802.1X and RADIUS for staff and Enhanced Open for guests. WPA3-Personal for both is the closest wrong answer, because staff would share one credential.

### Input validation
Input validation checks every piece of data an application receives (type, length, format, range and allowed characters) and rejects or normalizes anything that does not fit before the application uses it. It is a preventive technical control in the application layer. OWASP describes two levels: syntactic validation (the value has the right form, such as a date that looks like a date) and semantic validation (the value makes sense, such as an end date after the start date).

How to do it, with reasons:
1. **Validate on the server**, always. Browser checks give quick feedback but anyone can bypass them with a proxy or script.
2. **Use allow lists**: define what is acceptable and reject everything else. Deny lists of "bad" strings miss new tricks and encodings.
3. **Check length first and anchor patterns to the whole value**, and avoid regular expressions that backtrack heavily, which attackers can abuse to freeze the server (regular expression denial of service).
4. **Validate as early as possible**, at the point data enters.
5. **For file uploads**, do not trust the file name or declared type; check content and size and store files safely.
6. **Add the specific defenses**: parameterized queries (prepared statements) for databases and context-aware output encoding for HTML. OWASP names these as the primary defenses against SQL injection and cross-site scripting; validation supports them.

**Why it matters:** injection flaws let an attacker read or change a whole database or run script in other users' browsers, through nothing more than a crafted form field.

**Common confusions:** Input validation is the usual first defense named for "stop injection through user input", but in real code it works together with parameterized queries and output encoding, which are the primary fixes. Validation is not sanitization: validation decides yes or no, sanitization changes the input. Client-side validation is a usability feature, not a security control.

**Scenario:** A search box passes `' OR '1'='1` into a database query and returns every customer. The answer is server-side input validation with parameterized queries. Client-side JavaScript validation is the closest wrong answer, because the attacker can send the request directly and skip the browser.

Mini-example of an allow-list rule: `order_id: digits only, length 6 to 10; quantity: integer 1 to 99; country: one of the 2-letter codes in the stored list`.

### Secure cookies (Secure, HttpOnly and SameSite attributes)
A cookie is a small value a website stores in the browser and sends back with later requests; session cookies prove a user is logged in. Secure cookies are cookies set with protective attributes so they are not sent over unencrypted connections, not readable by page scripts and not sent with forged cross-site requests. This is a preventive technical control at the application layer, protecting confidentiality of session tokens and integrity of user actions.

The attributes, with what each stops:
- **Secure**: the browser sends the cookie only over HTTPS. Stops capture over plain HTTP.
- **HttpOnly**: page JavaScript cannot read the cookie. Limits session theft through cross-site scripting (XSS).
- **SameSite**: controls sending with cross-site requests. `Strict` sends it only for requests from the same site; `Lax` also sends it when the user follows a link from another site; `None` always sends it and must be combined with Secure. Chromium-based browsers treat a cookie with no SameSite value as Lax. SameSite helps against cross-site request forgery (CSRF).
- **Domain and Path**: limit where the cookie goes. Leaving out Domain sends it only to the exact host that set it. Path is not a security boundary.
- **Prefixes**: a name starting `__Host-` must be Secure, have no Domain and use Path=/, so another subdomain cannot plant it.
- **Expires or Max-Age**: without them the cookie is a session cookie; short lifetimes limit how long a stolen token works.

How to apply: set every session cookie with Secure, HttpOnly and SameSite (Lax or Strict), keep secrets out of cookie values, and rotate the session identifier at login.

**Why it matters:** a stolen session cookie lets an attacker act as the user without knowing the password or passing MFA (multifactor authentication).

**Common confusions:** HttpOnly does not encrypt the cookie and does not stop XSS itself; it only stops scripts from reading that cookie. The Secure attribute does not make the cookie value secret on the device. SameSite reduces CSRF but is not a full replacement for anti-CSRF tokens on sensitive actions.

**Scenario:** A penetration test shows an XSS flaw could read the session identifier through `document.cookie`. The quickest cookie fix is the HttpOnly attribute, while the XSS flaw itself is fixed with output encoding. The Secure attribute is the closest wrong answer: it stops sending over HTTP but scripts on the HTTPS page could still read the cookie.

Mini-example: `Set-Cookie: __Host-sid=7f3a9c; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=1800`.

### Static code analysis (static application security testing, SAST)
Static code analysis, also called static application security testing (SAST), examines source code, bytecode or binaries without running the program, looking for patterns that lead to vulnerabilities: injection risks, unsafe functions, buffer overflows, hard-coded secrets. It is a preventive and detective technical control in the development process, and it serves objective 4.1 (a secure coding technique) and 4.3 (a way to identify vulnerabilities). NIST's Secure Software Development Framework (SP 800-218) asks teams to review or analyze code, by people, tools or both, and to record and triage what they find.

How it fits into development:
1. **Run it early and often**: in the developer's editor and automatically in the build pipeline. Reason: a flaw fixed while writing code costs far less than one found in production.
2. **Tune the rules** to the language and framework. Reason: untuned tools flood teams with findings.
3. **Triage results**: confirm, fix, or mark as false positive with a reason. Reason: SAST produces many false positives.
4. **Gate the build** on serious findings so new high-risk flaws cannot be merged.
5. **Combine with other tests**, because SAST cannot see the running environment.

Strengths: scales to large code bases, points to the exact file and line, catches well-known flaw types reliably, runs before anything is deployed. Weaknesses, as OWASP summarizes them: many false positives, trouble with authentication, access control and misuse of cryptography, blind to configuration that is not in the code, and difficulty proving a flagged issue is really exploitable. It may also need code that compiles.

**Why it matters:** each vulnerability shipped to customers can become an emergency patch, a breach and a reputation cost. Finding it at the line where it was written is the cheapest point.

**Common confusions:** Static means the code is not executed; dynamic analysis (DAST) tests the running application. SAST does not find a misconfigured web server or a weak TLS setting in production. A clean SAST report is not proof of secure software.

**Scenario:** A team wants to catch SQL injection in new code before it is merged, with the exact line shown to the developer. The answer is static code analysis in the build pipeline. Dynamic testing of the staging site is the closest wrong answer: it finds the flaw later and cannot point to the line.

Mini-example of a finding: `Rule: SQL built from string concatenation | File: orders/search.py line 88 | Severity: High | Fix: use a parameterized query`.

### Code signing
Code signing is a digital signature applied to software (installers, drivers, scripts, mobile apps, updates) with the publisher's private key, backed by a certificate from a trusted certificate authority. When the code is installed or run, the system checks the signature with the public key. It proves two things: who published the code (authenticity) and that it has not changed since signing (integrity). It is a technical control that supports software supply chain security; NIST's code signing white paper describes it as assurance that software is authentic and untampered through development, build and distribution.

How it works:
1. The developer builds and approves the release (ideally with authorized approvers).
2. A hash of the code is signed with the private signing key, held in a protected system such as a hardware security module (HSM). Reason: anyone holding that key can sign malware as you.
3. The signature and certificate travel with the code.
4. The user's system hashes the code, checks the signature with the public key, and checks that the certificate chains to a trusted root and has not been revoked.
5. If anything changed, or the certificate is untrusted or revoked, the system warns or blocks.

Main risks NIST names: theft of the private signing key, certificates issued to the wrong party, signing malicious code through weak process or an insider, and weak cryptography. Defenses: protect keys in an HSM, audit key use, separate duties for approval, and check revocation.

**Why it matters:** operating systems and app stores increasingly refuse unsigned code, and a stolen signing key turns a trusted brand into a malware delivery channel.

**Common confusions:** A valid signature does not mean the code is safe or bug free; it means it came from the signer unchanged. Code signing is not encryption; the code stays readable. A hash alone shows integrity only if you trust where the hash came from; the signature adds who.

**Scenario:** Customers must be sure a downloaded update really comes from the vendor and was not altered on a mirror site. The answer is code signing. Publishing a checksum on the same mirror is the closest wrong answer, because an attacker who alters the file can alter the checksum next to it.

### Sandboxing
Sandboxing runs code or opens a file in an isolated, tightly limited environment so it cannot reach the rest of the system, other applications or the network beyond what is explicitly allowed. NIST glossary entries describe a sandbox as a restricted execution space that keeps untrusted software from touching resources it was not granted. It is a preventive technical control that contains damage, protecting the integrity and confidentiality of everything outside the sandbox.

Where it is used and how:
1. **Browsers**: each site or tab runs in a restricted process, so a malicious page cannot read files or other tabs.
2. **Mobile operating systems**: each app is confined to its own storage and permissions.
3. **Malware analysis and email security**: suspicious attachments are detonated in a disposable virtual machine that records what they do.
4. **Testing**: new or untrusted code runs in an isolated copy before reaching production.
5. **Isolation technologies**: virtual machines, containers and operating system features that limit what a process may access.

Typical steps for analysis: send the file into the sandbox, let it run with no access to real data, watch its behavior (files written, processes started, network calls), then destroy the sandbox and use the findings (block, alert, or release).

**Why it matters:** sandboxing turns "this unknown file might be malware" from a gamble into a contained test, and in browsers it limits a single bad website to a single tab.

**Common confusions:** A sandbox isolates execution; it does not encrypt data or prove where code came from (that is code signing). Some malware detects sandboxes and stays quiet, so a clean result is not proof of safety. A sandbox is different from a honeypot, which is a decoy meant to attract attackers.

**Scenario:** A security team must examine an unknown executable from a phishing email to learn what it contacts, without risk to production. The answer is a sandbox. Scanning it with antivirus is the closest wrong answer: a signature scan says only whether it is already known, not what it does.

## 4.2 Managing hardware, software and data assets securely
Depth asked: explain. A good answer says what each life-cycle stage requires and the security consequence of skipping it.

### Acquisition and procurement process (secure purchasing)
Acquisition, or procurement, is how an organization buys hardware, software and services. A secure process builds security in before money is spent: requirements are checked, suppliers are vetted, and every new asset enters management from day one. It is a managerial (administrative) control that reduces supply chain risk and prevents unmanaged "shadow IT". NIST SP 800-161 Rev. 1 covers cybersecurity supply chain risk management, the discipline behind it.

How it works, in order:
1. **Define security requirements** in the request: supported versions, update period, encryption, logging, compliance needs. Reason: requirements added after purchase are expensive or impossible.
2. **Use approved vendors and channels.** Reason: grey-market hardware may be counterfeit or tampered with.
3. **Assess the supplier**: security questionnaire, certifications, how they disclose and fix vulnerabilities, and whether they provide a software bill of materials (SBOM).
4. **Review the contract**: support period, right to audit, breach notification, data handling.
5. **Receive and record**: tag the asset, add it to inventory with owner and classification before it is deployed.

**Why it matters:** a device bought outside the process is unpatched, unmonitored and unknown to security. A cloud service bought with a credit card can hold customer data with no contract protection at all.

**Common confusions:** Procurement security is not only about price or legal terms; the support period decides whether the asset can be kept secure. Shadow IT is not always malicious; it is usually staff solving a problem fast, which a quick, clear procurement path prevents.

**Scenario:** A department buys cheap network cameras online that have no update policy, and they appear on the network unregistered. The control that would have prevented this is a secure procurement process with approved vendors and security requirements. A network scan is the closest wrong answer: it finds the cameras afterwards but does not stop insecure purchases.

### Asset ownership and classification (assignment and accounting)
Assignment and accounting mean recording every asset against a named owner and a classification. Ownership answers who is accountable; classification answers how carefully it must be protected. Both are managerial controls, and they decide which technical controls apply.

**Ownership:** a specific person or role (often a business manager, not IT) is accountable for the asset's security, approves who gets access, decides how it is used and accepts risks for it. IT may operate the system as custodian, but the owner decides. Unowned assets tend to go unpatched, unreviewed and forgotten.

**Classification:** the owner labels the asset or its data by sensitivity and importance, for example public, internal, confidential and restricted. The label drives handling rules: who may access it, whether it must be encrypted, how it may be shared, how it is backed up and how it must be destroyed at end of life. Data classification schemes are treated in depth in objective 3.3.

How it works:
1. Record the owner when the asset is acquired or created.
2. The owner assigns a classification using the company scheme.
3. Controls follow from the label (encryption, access reviews, disposal method).
4. Review owners and labels when people change roles or data changes.

**Why it matters:** in an incident, the first questions are "whose is this and how sensitive is it?" Without answers, response slows and the wrong disposal method may leak regulated data.

**Common confusions:** Owner and custodian are different: the custodian (often IT) runs and protects it day to day, the owner is accountable. Classification belongs to the data, and the device inherits the highest level of what it stores.

**Scenario:** A file server holds HR records, but nobody can say who approves access and the folders are open to all staff. The fix starts with assigning an owner who classifies the data as confidential and approves access. Running a vulnerability scan is the closest wrong answer, because the gap is accountability and classification, not a software flaw.

### Asset inventory (asset tracking)
An asset inventory is the maintained record of what the organization should have: hardware, software, cloud services and data stores, each with details such as asset tag, serial number, owner, location, classification, configuration, installed software and status. It is the base of asset tracking and a managerial control with technical tooling (configuration management databases, endpoint management). The CIS Controls put inventory of enterprise assets first, because every other control needs to know what exists.

How to keep it useful:
1. **Record at entry**: new assets are added at procurement or deployment, never "later".
2. **Record enough detail** to act: owner, location, classification, operating system and version, installed software, network identifiers.
3. **Update on change**: moves, reassignments, upgrades, loss, retirement.
4. **Reconcile regularly** against discovery (enumeration), management tools and purchase records. Reason: inventories decay quickly without reconciliation.
5. **Include software and cloud**: licensed software, SaaS (software as a service) subscriptions and cloud resources, not only boxes with serial numbers.

NIST SP 1800-5 (IT asset management) treats a reliable inventory as the basis for knowing what is installed, where, and whether it complies with policy.

**Why it matters:** patching, vulnerability scanning, incident response, licensing and audits all start from the inventory. A server missing from it is never scanned and never patched, which makes it the attacker's favorite.

**Common confusions:** An inventory records what should be there; it can be wrong. Enumeration discovers what is actually there. A purchase ledger is not an inventory, because it says nothing about where an asset is or how it is configured today.

**Scenario:** During an incident, responders cannot tell who owns a compromised laptop or what software it runs. The missing control is an accurate asset inventory. Endpoint logs are the closest wrong answer: they show what happened, but not ownership or the expected configuration.

Mini-example of an inventory record: `Tag: LT-04417 | Serial: 5CG12... | Owner: Finance manager | Location: Branch 2 | Class: Confidential | OS: Windows 11 23H2 | Status: In use`.

### Asset enumeration (active discovery)
Enumeration is actively discovering and listing the assets that really exist, by scanning networks, querying directories, cloud accounts and management tools, or reading agents' reports. It answers "what is actually out there?", including devices and software the inventory does not know about. It is a detective technical control that feeds asset tracking. CIS describes the goal as finding unauthorized or unmanaged assets so they can be removed or brought under management.

How it works:
1. **Network discovery**: scan address ranges for live hosts and open services, and read sources such as DHCP leases and switch tables.
2. **Directory and management queries**: list computers in the directory, devices in mobile device management, endpoints reporting to agents.
3. **Cloud API queries**: list virtual machines, storage, functions and accounts in each cloud subscription, which network scans often cannot see.
4. **Software discovery**: agents or credentialed scans list installed applications and versions.
5. **Compare with the inventory**: every difference is either a stale record to fix or an unknown asset to investigate.

**Why it matters:** rogue access points, forgotten test servers and personal devices on the corporate network are found by enumeration, not by reading the inventory.

**Common confusions:** Enumeration in asset management means discovery of your own assets; attackers also "enumerate" during reconnaissance, with the same tools for a different purpose. A single scan is a snapshot; enumeration must repeat, because devices come and go. Enumeration is not vulnerability scanning, although the same scanner may do both.

**Scenario:** A monthly discovery scan finds 30 more laptops on the network than the inventory lists. That finding came from enumeration. Inventory is the closest wrong answer, because the inventory is the list that was wrong.

### Asset inventory vs enumeration vs vulnerability scanning
These three activities are often run by the same tools, so scenarios mix them up. The decisive question is whether the activity records, discovers or checks for flaws.

| Activity | Question it answers | Output | Typical trigger in a scenario |
|---|---|---|---|
| Inventory | What should we have, and who owns it? | Maintained records: owner, location, classification, configuration | "No one knows who owns this server" |
| Enumeration | What is actually connected or running? | A discovered list compared to the inventory | "More devices on the network than recorded" |
| Vulnerability scan | Which known weaknesses do these assets have? | Findings with severity, mapped to CVE identifiers | "Which servers lack the patch?" |

How they connect: the inventory sets the scope; enumeration keeps the inventory honest; vulnerability scanning checks the assets in scope. A gap in the first two means the third misses systems. CVE means Common Vulnerabilities and Exposures.

**Why it matters:** an organization that scans only what its inventory lists will report a clean result while unlisted servers stay vulnerable.

**Common confusions:** Enumeration and vulnerability scanning can run in one tool session, but they answer different questions. An inventory spreadsheet updated by hand is still an inventory, just a weak one.

**Scenario:** After a merger, the security team must find every server the acquired company runs before scanning them. The first step is enumeration (discovery) feeding the inventory. Starting with a vulnerability scan of the old inventory's address list is the closest wrong answer, because it covers only servers already known.

### Disposal and decommissioning (secure asset retirement)
Disposal, or decommissioning, is retiring an asset so that no data on it can be recovered, it no longer appears as active, and any data the organization must keep has been preserved elsewhere. It is the last stage of the asset life cycle and combines managerial controls (policy, approvals, records) with technical ones (sanitization, destruction). This objective breaks it into sanitization, destruction, certification and data retention.

How it works, in order:
1. **Check retention and legal holds**: data that must be kept is copied to approved storage first. Reason: wiping data under a legal hold can break the law.
2. **Remove the asset from service**: revoke its accounts, certificates and network access, and remove it from monitoring scopes deliberately.
3. **Choose the sanitization method** by data sensitivity and media type: clear, purge or destroy, following NIST SP 800-88 Rev. 2.
4. **Sanitize or destroy**, in house or through a vetted vendor.
5. **Verify** the result (tool completion and errors, or inspection of destroyed remnants).
6. **Document**: a certificate of sanitization or destruction, tied to the asset's inventory record, which is then closed.

The common wrong order is wiping first and checking retention afterwards.

**Why it matters:** drives, phones, copiers and network devices sold or recycled with data still on them are a well-known source of breaches, and regulators treat that as a failure to protect data.

**Common confusions:** Disposal includes devices people forget hold data: printers and copiers with internal drives, network devices with configurations and keys, phones, and cloud storage. Deleting files and emptying the recycle bin is not disposal; the data is still on the media.

**Scenario:** A company returns leased laptops to the leasing firm. The answer is sanitization that keeps the laptops usable (purge, for example cryptographic erase), with a certificate for each. Physical destruction is the closest wrong answer, because the laptops are not the company's to destroy and must go back working.

### Sanitization of media (clear and purge)
Sanitization makes data on storage media infeasible to recover for a chosen level of effort. NIST SP 800-88 Rev. 2 (September 2025, which replaced the 2014 Rev. 1) defines three methods: clear, purge and destroy. In everyday and certification usage, "sanitization" usually means the methods that can leave media reusable (clear and purge), while "destruction" means destroy. It is a technical control protecting confidentiality at end of life.

The two reusable methods:
- **Clear**: uses the device's normal read and write interface, for example overwriting all user-addressable space with non-sensitive data, or a factory reset when overwriting is not supported. It defends against simple, non-invasive recovery through the same interface a user has, and usually leaves the media fully usable.
- **Purge**: physical or logical techniques that defeat recovery even by state-of-the-art laboratory methods while potentially leaving the media reusable. Logical purge uses the drive's dedicated sanitize commands (overwrite, block erase, cryptographic erase) that reach areas normal writes cannot. Physical purge has historically meant degaussing magnetic media. NIST points to current standards such as IEEE 2883 for the right technique per media type, and says to move up to purge or destroy when clear does not give enough assurance.

Media matters:
1. **Hard drives (magnetic)**: overwriting works for clear; degaussing can purge but often makes the drive unusable, and many degaussers are too weak for modern high-coercivity drives.
2. **SSDs and flash**: overwriting is unreliable because of spare cells and wear leveling; use the drive's sanitize command or cryptographic erase. Degaussing does nothing to flash.
3. **Cloud and virtual storage**: you never touch the hardware, so cryptographic erase may be the only purge option.

**Why it matters:** choosing a method that does not suit the media (degaussing an SSD, overwriting flash) can complete "successfully" while leaving data recoverable.

**Common confusions:** Quick format and file deletion are not sanitization. Multiple overwrite passes on SSDs add little protection. Factory reset counts as clear only when the user interface can no longer reach the old data.

**Scenario:** A batch of SSDs from finance laptops will be reused in the training lab. The answer is purge with the drives' built-in sanitize or cryptographic erase command. Degaussing is the closest wrong answer, because it has no effect on flash memory.

### Cryptographic erase (CE)
Cryptographic erase (CE) sanitizes media whose data was encrypted from the start by destroying (sanitizing) the encryption keys, so the remaining ciphertext can no longer be decrypted. NIST SP 800-88 Rev. 2 classes it as a purge technique and notes it can sanitize with high assurance much faster than other techniques. It is a technical control protecting confidentiality.

How it works:
1. The drive (a self-encrypting drive) or the storage system encrypts all data with a media encryption key from day one.
2. To sanitize, the key, or the key that wraps it, is destroyed or replaced through a sanitize command or key management action.
3. Without the key, the stored ciphertext is unreadable; the media can be reused with a new key.

Conditions that must hold, or CE is not enough:
- **All sensitive data was encrypted from the start.** NIST, citing ISO/IEC 27040, says CE assumes no sensitive data was ever stored in plaintext on the media.
- **Every copy of the key is destroyed**, including backups and escrow copies the organization does not intend to keep.
- **The cryptography is strong**: at least 128-bit security strength and good key generation; US federal agencies must use FIPS 140 validated modules.

**Why it matters:** CE turns hours of overwriting into seconds, works on SSDs where overwriting fails, and is often the only way to purge data held in cloud services you cannot physically reach.

**Common confusions:** Deleting a file on an encrypted drive is not CE; the key still exists. CE does not remove the ciphertext; it makes it useless. Losing a key accidentally is a data loss event, not a sanitization method.

**Scenario:** A company leaving a cloud storage provider must purge its data but cannot touch the provider's disks. The answer is cryptographic erase: destroy the customer-managed keys that protected the data. Requesting a certificate of destruction for the provider's drives is the closest wrong answer, because those disks are shared and still in service.

### Destruction of storage media
Destruction physically ruins storage media so the data cannot be recovered even in a laboratory and the media can never store data again. NIST SP 800-88 Rev. 2 calls this the destroy method and says it suits all paper and most digital media, but not logical or virtual storage. It is a physical control protecting confidentiality, chosen for the most sensitive data and for media that failed or cannot be sanitized.

The destroy techniques NIST names:
- **Disintegrate**: break or decompose the media into particles so little or nothing is recognizable.
- **Incinerate**: burn it to ash.
- **Melt**: liquefy it with extreme heat.
- **Pulverize**: grind or crush it into powder or dust.
- **Shred**: cut or tear it into small particles.

Warnings from the same guidance:
1. Bending, cutting, drilling a hole or shooting a drive only partly damages it; parts of the platters or chips may still be readable in a laboratory, so it does not count as destroy.
2. As data density rises, shredding and pulverizing can leave readable fragments; NIST advises them only for the lowest-sensitivity data.
3. Degaussing is not an approved destroy technique; it is considered under purge.
4. Destruction is often the only option when a drive is broken, obsolete or its interface is no longer supported, so purge commands cannot run.

How to run it: collect media under chain of custody, destroy on site or through a vetted vendor (watching or verifying), inspect remnants against the required particle size, and keep the certificate.

**Why it matters:** a single readable fragment of a drive holding health or payment records can trigger breach notification duties and fines.

**Common confusions:** Destruction is not sanitization with extra steps; it trades reuse for certainty. A drilled drive "looks" destroyed but may not be. Paper and optical discs are media too.

**Scenario:** Failed drives from a database of medical records cannot be powered on, so no erase command can run. The answer is destruction (disintegration or incineration by a certified vendor) with a certificate. Drilling holes is the closest wrong answer, because remaining platter areas may still be recoverable.

### Certification of sanitization and destruction
Certification is documented proof that a specific piece of media was sanitized or destroyed: what it was, how it was done, with which tool, how it was checked and by whom. NIST SP 800-88 Rev. 2 calls it a certificate of sanitization and says one should be completed for each sanitized device, on paper or electronically. Disposal vendors issue a certificate of destruction for the same purpose. It is a managerial control that provides evidence for audits, compliance and legal defense.

What a complete certificate records, per the NIST list:
- Manufacturer, model, serial number and any organizational property or media number.
- Media type and where it came from (which user or computer).
- Optionally, the data's confidentiality category before sanitization.
- Method (clear, purge or destroy) and technique (for example overwrite, block erase, cryptographic erase, shred).
- Tool used, including its version.
- Verification method.
- Name, title, date, location, contact details and signature of the person who verified and validated.

How it fits the process:
1. Sanitize or destroy the media.
2. Verify: for tools, check completion status and errors; for destruction, inspect the remnants.
3. Validate: decide the result meets the required level, or repeat with a stronger method.
4. Complete the certificate and link it to the asset's inventory record, then close the record.

Bar codes and tracking applications can record details automatically, which matters when many devices are processed or physical access is awkward.

**Why it matters:** if a regulator or customer asks whether a retired drive held their data, the certificate is the only proof that it was handled correctly, and it ties the vendor contractually to what was done.

**Common confusions:** Certification does not sanitize anything; it documents. A vendor's general statement that "all drives are destroyed" is weaker than a per-device certificate with serial numbers. Verification (did the tool finish without error?) and validation (is the result good enough for this data?) are separate checks.

**Scenario:** An auditor asks for proof that 200 drives sent to a recycler last year were destroyed. The answer is the per-device certificates of destruction matched to inventory serial numbers. The purchase order for the recycling service is the closest wrong answer: it proves a service was bought, not what happened to each drive.

### Data retention at disposal (retention periods and legal holds)
Data retention means keeping data for the period that law, regulation, contracts or policy require, and disposing of it securely once that period ends. At disposal time, retention is the check that stops an organization from destroying records it must keep, and it also limits keeping data longer than needed. It is a managerial control that protects availability of required records and reduces confidentiality risk.

How it works at decommissioning:
1. **Look up the retention schedule** for each data type on the asset (financial records, logs, contracts, personal data).
2. **Check for legal holds.** When litigation or an investigation is pending or reasonably expected, a legal hold orders that related records be preserved, overriding normal deletion schedules for that data only.
3. **Preserve what must be kept** in approved, protected storage, with its integrity intact and its owner recorded.
4. **Sanitize or destroy the rest**, then document.
5. **Release holds in writing** when legal counsel ends them, so normal schedules resume.

Logs are a special case: NIST SP 800-92 notes retention rules may require keeping log copies longer than the systems that produce them can, which is why archiving exists.

**Why it matters:** destroying data under a legal hold can be treated as destroying evidence, with legal sanctions. Keeping everything forever is also a risk: every extra year of personal data held is more to lose in a breach and more to produce in discovery.

**Common confusions:** Retention is not backup; a backup is a recovery copy, while retention is a legal or business duty with a defined end. A legal hold does not stop disposal of unrelated data. "Keep it just in case" is not a retention policy.

**Scenario:** IT plans to wipe a decommissioned email server, but the legal team issued a hold for a former executive's mailbox last month. The answer is to preserve that mailbox under the hold before sanitizing the server. Wiping now and relying on backups is the closest wrong answer, because backups may rotate out and are not managed as held records.

### Clear vs purge vs destroy (media sanitization methods compared)
NIST SP 800-88 Rev. 2 defines three sanitization methods. They differ by how much recovery effort they defeat and whether the media survives. The right choice depends on data sensitivity, media type and whether the device will be reused inside or outside the organization.

| Method | Defeats | Typical techniques | Media reusable? | When to choose |
|---|---|---|---|---|
| Clear | Simple recovery through the normal user interface | Overwrite with standard writes, factory reset | Yes | Low-sensitivity data, reuse inside the organization, media where overwriting is reliable |
| Purge | Recovery even with state-of-the-art laboratory methods | Drive sanitize commands: block erase, overwrite, cryptographic erase; degaussing for magnetic media | Often yes (degaussing may ruin the drive) | Sensitive data, reuse or resale outside the organization, SSDs, cloud storage (cryptographic erase) |
| Destroy | Laboratory recovery, and the media can never store data again | Disintegrate, incinerate, melt, pulverize, shred | No | Highest sensitivity, failed or obsolete media, paper |

Decision cues:
1. Is the media broken or its interface unsupported? Destroy.
2. Will it leave the organization's control? Purge at least.
3. Is it flash or SSD? Use the drive's sanitize command or cryptographic erase; avoid relying on overwriting, never degauss.
4. Is it cloud or virtual storage? Cryptographic erase is often the only purge option, and destroy is not possible.
5. After any method: verify, validate, certify.

**Why it matters:** the method has to match both data and media. NIST gives the example that degaussing an SSD can finish without error while sanitizing nothing.

**Common confusions:** In everyday usage "sanitization" often means clear or purge, and "destruction" means destroy, but NIST uses sanitization for all three. Degaussing is purge (for suitable magnetic media), not destroy. Clear on a magnetic drive is not the same as clear on flash, because flash hides data in spare cells.

**Scenario:** Old magnetic hard drives with internal-only data will be reused by the same department. Clear (overwrite) is sufficient. Destroy is the closest wrong answer, since it throws away usable drives for data that does not require that level.

## 4.3 Vulnerability management activities
Depth asked: explain. A good answer places each activity in the cycle (identify, analyze, respond, validate, report) and explains what it adds that the others cannot.

### Vulnerability management life cycle (identify, analyze, respond, validate, report)
Vulnerability management is the continuous program of finding weaknesses in systems and software, deciding which matter, fixing or reducing them, confirming the fix, and reporting progress. It is a mix of managerial controls (process, deadlines, exceptions) and technical ones (scanners, patch tools), and it mainly prevents compromise of confidentiality, integrity and availability by closing known holes before attackers use them.

The cycle, with the reason for each step:
1. **Identify**: discover vulnerabilities through scans, application testing, threat feeds, penetration tests, disclosure programs and audits. Reason: no single source finds everything.
2. **Analyze**: confirm findings (remove false positives), score them, classify them, and prioritize them using severity, exploitation, exposure and business impact. Reason: there is never time to fix everything at once.
3. **Respond and remediate**: patch, or reduce risk with segmentation or compensating controls, transfer financial risk with insurance, or formally accept it with a time-limited exception. Reason: each finding needs a decided outcome, not a forgotten ticket.
4. **Validate**: rescan, verify and audit to prove the fix worked and broke nothing. Reason: patches fail silently.
5. **Report**: share status, trends and exceptions with the right audiences. Reason: leadership sets risk tolerance and budgets from it.

Then it repeats, because new vulnerabilities appear daily. NIST SP 800-40 Rev. 4 frames patching as preventive maintenance and recommends planned scenarios: routine patching, emergency patching, emergency mitigation, and handling unpatchable assets.

**Why it matters:** most breaches exploit known vulnerabilities for which a fix existed. A working cycle turns "we had the patch" into "we applied it in time".

**Common confusions:** Vulnerability management is broader than patch management; patching is one response. Scanning is not the program; it is only the identify step. A finding is not closed when the ticket is closed; it is closed when validation shows it gone.

**Scenario:** A company scans monthly but the same critical findings appear month after month. The weak stage is response and validation (owners, deadlines, rescans), not identification. Buying a second scanner is the closest wrong answer, because finding more does not fix what is already found.

### Vulnerability scan (identification method)
A vulnerability scan uses an automated tool to check systems, applications and network devices for known weaknesses: missing patches, vulnerable software versions, misconfigurations, weak protocols and exposed services. The scanner compares what it observes with a database of known vulnerabilities (usually mapped to CVE (Common Vulnerabilities and Exposures) identifiers) and reports findings with a severity. It is a detective technical control. NIST SP 800-115 describes scanners as a fast way to measure exposure to known, surface-level vulnerabilities.

Ways to scan, and what each sees:
1. **Non-credentialed**: from the network only, judging by open ports, service banners and responses. Shows the outsider's view.
2. **Credentialed**: logs in to each host and reads installed software, patch levels and settings. Sees far more, with fewer false positives.
3. **Agent-based**: a small agent on each host reports continuously, useful for laptops that are rarely on the office network.
4. **Internal vs external**: from inside the network (what an intruder or insider could reach) or from the internet (what anyone can reach).

How to run a program, in order: define scope from the inventory; get approval and schedule (scans can load fragile systems); update the scanner's vulnerability data; scan; confirm the credentials worked on every host; analyze and prioritize; remediate; rescan.

**Why it matters:** scanning is the broad, repeatable way to know where known holes exist across thousands of systems, which is the first input to every remediation decision.

**Common confusions:** A scan identifies; it does not exploit (that is penetration testing). Scanners have their own severity labels and methods, so "high" in one tool may not match another; CVSS (Common Vulnerability Scoring System) gives a common scale. A scan of only inventoried systems misses unknown ones.

**Scenario:** An organization needs a weekly, broad view of missing patches on 5,000 servers. The answer is credentialed vulnerability scanning. A penetration test is the closest wrong answer: it is deep and manual, covers a limited scope and is too slow and costly to run weekly on everything.

Mini-example of a finding: `Host: 10.2.4.18 | Finding: OpenSSH version with known flaw | CVE-2024-6387 | CVSS 8.1 | Detection: credentialed, package version | Fix: update package`.

### Credentialed vs non-credentialed vulnerability scans
A credentialed scan logs in to each host with an account and reads its installed software, patch levels and settings directly. A non-credentialed scan works only from the network, inferring from open ports, service banners and responses what an outside attacker would see. Both are detective technical controls; mature programs run both because they answer different questions.

| Feature | Credentialed | Non-credentialed |
|---|---|---|
| View | Inside the host | Outside, over the network |
| Depth | Sees missing patches, local software, configuration | Sees exposed services and network weaknesses |
| Accuracy | Fewer false positives, reads real versions | More guesses from banners, more false positives and negatives |
| Needs | A scanning account with enough rights (often administrator) | Only network reachability |
| Risk | The account is powerful and must be guarded | Low; nothing logs in |

How to run credentialed scans safely:
1. Create a dedicated scanning account, used only by the scanner, with the rights the checks need. NIST SP 800-115 notes network scanners can use administrator-level credentials to pull vulnerability details from hosts.
2. Store the password in a vault and rotate it; alert on any use outside scan windows.
3. **Check that authentication succeeded on every host.** A report from a failed login can look clean because almost nothing was checked.
4. Keep scanner vulnerability data current.

**Why it matters:** a non-credentialed scan of a patched-looking web server may miss an outdated library deep on the host; a credentialed scan sees it. Conversely, only an outside scan shows exactly what the internet can reach.

**Common confusions:** Credentialed does not mean intrusive or exploiting; it means logged in to read. A clean non-credentialed result does not prove the host is patched. Agent-based scanning gives a credentialed-style inside view without a network login.

**Scenario:** A scan of 300 servers reports almost no missing patches, yet the patch tool shows many pending. The likely cause is failed credentials, so the scan ran as non-credentialed. Assuming the servers are healthy is the closest wrong answer; the scan log will show authentication failures.

### Dynamic analysis (DAST) and fuzzing
Dynamic analysis, or dynamic application security testing (DAST), tests an application while it is running, from the outside, by sending requests and malicious inputs and watching the responses. It needs no source code. It is well suited to finding input and output handling problems, authentication and session weaknesses, and server misconfiguration. It is a detective technical control used in testing environments and, carefully, in production.

How it works:
1. **Crawl or import the application's pages and API definitions.** Reason: you can only test what you can reach.
2. **Send attack inputs**: injection strings, script payloads, oversized values, unexpected methods.
3. **Observe the responses**: errors, reflected scripts, data leaks, crashes, slow responses.
4. **Report findings** with the request that triggered them, then retest after the fix.

**Fuzzing** is a form of dynamic testing that feeds large numbers of unexpected, malformed or random inputs to a program and watches for crashes, hangs or odd behavior. Simple fuzzers throw random or known-dangerous values (zero, negative numbers, huge strings); format-aware fuzzers respect a protocol or file structure so more inputs get past the first checks; mutational and feedback-guided fuzzers change inputs based on what reached new code. OWASP notes fuzzing mostly finds implementation faults such as crashes, buffer overflows and denial-of-service conditions.

**Why it matters:** some flaws exist only at runtime: a server setting, a session that is not invalidated, a framework default. Static analysis cannot see them; DAST and fuzzing can.

**Common confusions:** DAST cannot point to the exact line of code; it shows the request and the symptom. Fuzzing is a technique inside dynamic testing, not a separate stage. Running aggressive DAST against production can corrupt data or cause outages, so test environments are preferred.

**Scenario:** A team wants to know whether its deployed web application leaks session tokens in error pages and whether the server is misconfigured. The answer is dynamic analysis of the running application. Static code analysis is the closest wrong answer, because server configuration and runtime behavior are not in the source code.

Mini-example of a fuzzing result: `Input: 70,000-byte value in field "zip" | Result: worker process crash, HTTP 502 | Likely cause: unchecked length | Action: add length validation, retest`.

### Package monitoring (software composition analysis and SBOM)
Package monitoring tracks the third-party libraries, packages and components an application uses, and alerts when one gains a known vulnerability, is abandoned, or is suspected of being tampered with. Modern applications are mostly third-party code, so this is how the software supply chain is watched. Tools for it are often called software composition analysis (SCA). It is a detective technical control, with preventive policy (which packages may be used).

How it works:
1. **Build a component list**, ideally a software bill of materials (SBOM): an inventory of every component and version in a product, including components of components. CISA describes the SBOM as a nested, ingredient-style inventory of software.
2. **Match components to vulnerability data** (CVE records, advisories) continuously, not only at build time. Reason: a library safe today may get a critical CVE tomorrow.
3. **Check reachability and impact**: is the vulnerable function used? A Vulnerability Exploitability eXchange (VEX) statement from the supplier can say whether a product is actually affected.
4. **Update or replace** the component, rebuild, and redeploy.
5. **Control sources**: pull packages only from trusted registries, pin versions, and verify signatures or hashes, to resist typosquatting and poisoned updates.

**Why it matters:** when a widely used library gets a critical flaw (the Log4j case, CVE-2021-44228, scored CVSS (Common Vulnerability Scoring System) 10.0), organizations with an SBOM can answer "are we affected and where?" within hours, while others search for weeks.

**Common confusions:** Package monitoring looks at your dependencies, not the code your team wrote (that is static analysis). An SBOM is the list; package monitoring is the ongoing checking of that list. A dependency may be vulnerable but not exploitable in your use; that still needs a recorded decision.

**Scenario:** After a critical flaw is announced in a popular logging library, management asks which internal applications include it. The fastest answer comes from package monitoring backed by SBOMs. A network vulnerability scan is the closest wrong answer: it may miss libraries bundled inside applications and cannot list every place they are used.

### SAST vs DAST vs package monitoring (application security testing compared)
These three application security methods look at different things, so a strong program uses all three. Static analysis (SAST) reads your own code without running it; dynamic analysis (DAST) attacks the running application; package monitoring watches third-party components. In objective 4.3 static analysis means the same thing as static code analysis in 4.1; the full treatment is in `### Static code analysis (static application security testing, SAST)`.

| Method | Looks at | Runs the app? | Finds best | Cannot find | Points to the line? |
|---|---|---|---|---|---|
| SAST (static) | Source code or binaries you wrote | No | Injection patterns, unsafe functions, hard-coded secrets, early in development | Runtime and configuration problems | Yes |
| DAST (dynamic), including fuzzing | The running application from outside | Yes | Input handling, authentication flaws, server misconfiguration, crashes | Code paths it never reaches; exact code location | No |
| Package monitoring (SCA) | Third-party libraries and their versions | No | Known vulnerable or abandoned components, supply chain issues | Flaws in your own code | Points to the component |

When each fits in the development life cycle: SAST while writing and building; package monitoring at build time and continuously afterwards; DAST in testing and staging, and periodically on production with care.

**Why it matters:** each method misses what the others catch. Relying on one creates a blind spot attackers can find.

**Common confusions:** Fuzzing is dynamic. Code review by a person is manual static analysis. A penetration test of an application is broader and human-led; DAST is automated.

**Scenario:** Clue: "find vulnerable open-source libraries in our builds". Answer: package monitoring (SCA with an SBOM (software bill of materials)). Clue: "find flaws in the running web app without source code". Answer: DAST. Clue: "catch a hard-coded password before merge". Answer: SAST. Picking DAST for the first clue is the common slip, because DAST does not list component versions.

### Threat feeds (threat intelligence feeds, STIX and TAXII)
A threat feed is a continuous stream of threat intelligence: new vulnerabilities and exploits, malicious IP addresses, domains, URLs and file hashes (indicators of compromise), and attacker techniques. In vulnerability management, feeds tell you which weaknesses attackers are using now, so you can identify and prioritize faster. This objective groups feed sources as open-source intelligence (OSINT), proprietary or third-party, information-sharing organizations, and the dark web. Feeds support detective controls (blocking, alerting) and managerial decisions (priorities).

How feeds are used:
1. **Choose sources relevant** to your sector, technologies and region. Reason: irrelevant data creates noise.
2. **Ingest automatically** into tools (SIEM, firewall, endpoint protection, vulnerability management). Standard formats help: STIX (Structured Threat Information Expression) describes the intelligence; TAXII (Trusted Automated Exchange of Intelligence Information) transports it over HTTPS. Current versions are STIX 2.1 and TAXII 2.1.
3. **Score and age indicators**: an IP address used by an attacker last year may belong to someone innocent now.
4. **Act**: block indicators, hunt for them in logs, raise priority of vulnerabilities being exploited.
5. **Share back** what you see, where agreements allow.

**Why it matters:** a medium-severity vulnerability that a feed reports as actively exploited against your industry can be more urgent than a critical one nobody is using.

**Common confusions:** STIX is the language, TAXII is the transport; TAXII is designed to carry STIX. A feed is not the same as threat hunting; hunting uses the feed. More feeds is not better if nobody acts on them.

**Scenario:** A company wants indicators shared by partners to load automatically into its security tools in a standard format. The answer is STIX content exchanged over TAXII. Emailing spreadsheets of indicators is the closest wrong answer, because it is slow, manual and error-prone.

### Open-source intelligence (OSINT) threat feeds
Open-source intelligence (OSINT) is intelligence gathered from publicly available sources: security researchers' blogs, vendor and government advisories, public vulnerability databases, mailing lists, social media, code repositories and news. As a threat feed it is free or low cost, and it is often the first place new vulnerabilities and campaigns appear. It supports identification and prioritization in vulnerability management.

How to use OSINT well:
1. **Pick reliable sources first**: government advisories (such as CISA alerts and the Known Exploited Vulnerabilities catalog), vendor security advisories, and the CVE (Common Vulnerabilities and Exposures) and NVD (National Vulnerability Database) records.
2. **Verify before acting**: OSINT quality varies; rumors and wrong attributions spread fast.
3. **Correlate with your inventory**: does the affected product exist in your environment, and where?
4. **Automate where possible**: many public feeds publish in machine-readable formats.
5. **Record the source and date** of each item, so decisions can be traced later.

OSINT is also used by attackers for reconnaissance: staff names, email formats, technologies listed in job adverts and exposed documents. Defenders should look at their own public footprint the same way.

**Why it matters:** OSINT gives even small organizations without a budget for commercial intelligence early warning of exploited vulnerabilities.

**Common confusions:** "Open source" here means openly available information, not open-source software. OSINT is not automatically trustworthy because it is public. Free does not mean low value: government advisories are among the most authoritative sources.

**Scenario:** A small company with no intelligence budget wants to know which newly published vulnerabilities are being exploited. The answer is OSINT such as the CISA Known Exploited Vulnerabilities catalog and vendor advisories. A paid proprietary feed is the closest wrong answer given the stated constraint (no budget), even though it might add curation.

### Proprietary and information-sharing threat feeds (ISACs)
Two feed types in this objective come from outside public sources. A proprietary or third-party feed is commercial intelligence sold by a security vendor, usually curated, enriched with context and delivered ready to load into tools. An information-sharing organization is a group, often within one industry or sector, whose members share what they see with each other; the best-known form is the Information Sharing and Analysis Center (ISAC). Both feed the identify and prioritize steps of vulnerability management.

**Proprietary/third-party feeds**: paid, often faster and better filtered than open sources, and may include the vendor's own research (malware analysis, attacker tracking) not published elsewhere. They still need tuning to your environment, and quality differs by vendor.

**Information-sharing organizations**: ISACs are typically nonprofit groups formed by owners and operators of critical infrastructure to share physical and cyber threat information and ways to reduce it. They date back to a 1998 US presidential directive (PDD-63) that asked each critical sector to set up its own sharing body. Many run around-the-clock alerting, and they share with each other through the National Council of ISACs. Government programs (for example those run by CISA) also share with industry.

How to use them:
1. Join the ISAC for your sector; agree on handling rules (who may see what).
2. Load machine-readable indicators (often STIX (Structured Threat Information Expression) over TAXII (Trusted Automated Exchange of Intelligence Information)) into your tools.
3. Contribute your own sightings, anonymized where needed. Reason: sharing works only if members give as well as take.
4. Review commercial feeds periodically for value against cost.

**Why it matters:** attackers often hit several organizations in one sector with the same method. A sector ISAC can warn a hospital or bank days before the campaign reaches it, with context that fits its systems.

**Common confusions:** An ISAC is not a commercial vendor; membership may cost money, but the intelligence comes from members. A proprietary feed is not automatically better than open sources; it is curated and supported. "Third-party" here means a vendor outside your organization, not an attacker.

**Scenario:** A regional bank wants early warning of fraud and intrusion campaigns targeting other banks, shared by its peers. The answer is the financial sector's ISAC. A general commercial feed is the closest wrong answer, because it lacks the peer-reported, sector-specific detail the bank asked for.

### Dark web monitoring (threat feed)
The dark web is the part of the internet reachable only with special software, most commonly Tor, where sites run as onion services whose server location stays hidden. Criminal markets and forums there trade stolen credentials, leaked data, malware, and access to compromised companies. Dark web monitoring watches those places for mentions of your organization, its domains, employee credentials, customer data or network access for sale. It is a detective control giving early warning of breaches.

How it works:
1. **Define what to watch**: company names, domains, executive names, IP ranges, product names, card ranges.
2. **Collect** through specialized services or analysts with safe, controlled access. Reason: browsing criminal forums directly carries legal and malware risks.
3. **Validate**: a lot of posted "data" is recycled, fake or exaggerated.
4. **Act**: force password resets for exposed accounts, revoke tokens, investigate how access was obtained, and notify where law requires.

**Why it matters:** stolen credentials often appear for sale before the victim notices any intrusion. Finding them first turns a future breach into a password reset.

**Common confusions:** The dark web is not the same as the deep web (any content not indexed by search engines, such as webmail inboxes). Monitoring does not remove data from the dark web; it tells you it is there so you can respond. Information found there is hard to verify and should not be trusted on its own.

**Scenario:** A monitoring service reports a forum post offering remote access to "a regional logistics firm" with your VPN gateway's name. The right response is to treat it as a likely compromise: reset affected credentials, check VPN logs and investigate. Ignoring it because the source is a criminal forum is the closest wrong answer; unverified does not mean false.

### OSINT vs proprietary vs ISAC vs dark web threat feeds
This objective names four threat feed sources for vulnerability management. They differ in cost, who produces the intelligence and what it is best at. OSINT means open-source intelligence; ISAC means Information Sharing and Analysis Center.

| Source | Who produces it | Cost | Best at | Main caution |
|---|---|---|---|---|
| OSINT | Public: governments, vendors, researchers, news | Free or low | Broad early warning, authoritative advisories | Quality varies; verify |
| Proprietary/third-party | A commercial security vendor | Paid | Curated, enriched, ready for tools, vendor research | Cost; still needs tuning |
| Information-sharing organization (ISAC, government programs) | Peers in the same sector, plus partners | Membership | Sector-specific, peer-observed campaigns | Must share back; handling rules |
| Dark web | Monitoring of criminal forums and markets, usually by a service | Usually paid | Leaked credentials, stolen data, access for sale | Hard to verify; risky to access directly |

How they combine: OSINT and proprietary feeds tell you what vulnerabilities and tools attackers are using; ISACs tell you what is hitting organizations like yours; dark web monitoring tells you whether your own data or access is already for sale.

**Why it matters:** picking the right source for the question saves money and time. A question about "our leaked passwords" is never answered by a vulnerability advisory.

**Common confusions:** OSINT is a source type, not a quality level. Dark web monitoring is a feed source, not a penetration test. Feeds identify threats and vulnerabilities to look at; they do not scan your systems.

**Scenario:** Clue: "employee passwords for our domain are being sold". Answer: dark web monitoring. Clue: "peers in our sector see a new ransomware campaign". Answer: information-sharing organization. Clue: "free government list of exploited vulnerabilities". Answer: OSINT. Clue: "curated, paid feed loaded into our SIEM (security information and event management)". Answer: proprietary.

### Penetration testing as vulnerability identification
A penetration test is an authorized, simulated attack in which testers actively try to exploit vulnerabilities, chain them together and show what a real attacker could achieve, such as reaching sensitive data or administrator control. In vulnerability management it finds what scanners miss: logic flaws, chained weaknesses and real exploitability. It is a detective control carried out under strict administrative rules. The full topic of test types and rules of engagement belongs to objective 5.5; this section covers its role in identifying vulnerabilities.

How it works, in order:
1. **Authorization and rules of engagement**: written permission, scope, dates, allowed techniques, contacts and what to do if testers find signs of a real attacker. NIST SP 800-115 includes a rules of engagement template. Reason: without written authorization, testing is an attack.
2. **Reconnaissance and discovery** of targets in scope.
3. **Vulnerability identification**, often starting with scanning.
4. **Exploitation** to confirm real impact, and pivoting to see how far access spreads.
5. **Reporting** findings with evidence, impact and remediation advice.
6. **Retesting** after fixes.

Knowledge levels: known environment (testers get full information, formerly white box), partially known (some information, gray box), unknown environment (no inside information, black box).

**Why it matters:** a scanner may rate three findings as medium, while a tester shows that chaining them leads to full domain control. That changes priorities immediately.

**Common confusions:** A pen test exploits; a vulnerability scan only identifies. A pen test is a point-in-time sample of a defined scope, not continuous coverage. A red team exercise tests detection and response more broadly; a pen test focuses on finding exploitable weaknesses.

**Scenario:** Management wants proof of whether an attacker on the guest Wi-Fi could reach payroll data. The answer is a penetration test with that goal in scope. A vulnerability scan is the closest wrong answer: it lists weaknesses but does not show whether they can be chained to reach payroll.

### Vulnerability scan vs penetration test vs system/process audit
These three identification methods are often confused because all of them "find problems". The decisive difference is what each one examines and whether anything is exploited.

| Method | What it examines | Exploits? | Strength | Limit |
|---|---|---|---|---|
| Vulnerability scan | Known technical flaws on many systems | No | Broad, fast, repeatable, automated | Misses logic flaws and chained attacks; false positives |
| Penetration test | Whether weaknesses can really be used, and how far | Yes, with authorization | Shows real impact and attack chains | Narrow scope, point in time, costly |
| System/process audit | Systems and procedures against a policy, standard or regulation | No | Finds process gaps: missing approvals, absent reviews, undocumented exceptions | Depends on the standard chosen; may not test technical depth |

How they fit together: scans run continuously; penetration tests run periodically or after big changes; audits run on a schedule set by policy or regulation, and also check that the scanning and testing actually happen.

**Why it matters:** an organization can pass every scan and still fail an audit because nobody reviews firewall rules, or pass an audit while a pen tester walks to the domain controller. Each answers a different question.

**Common confusions:** An audit is not a scan with a report; it judges compliance with a standard. A credentialed scan is still a scan, not a pen test. A pen test report is not a compliance attestation.

**Scenario:** A regulator requires proof that access reviews are performed quarterly and documented. The answer is a process audit. A penetration test is the closest wrong answer, because it tests technical exploitability, not whether a procedure is followed.

### Responsible disclosure program (coordinated vulnerability disclosure)
A responsible disclosure program, also called a vulnerability disclosure program, gives outside researchers a clear, safe and legal way to report vulnerabilities they find in an organization's systems or products. The organization commits to receive, fix and communicate, and researchers agree to give it time before going public. Coordinated vulnerability disclosure (CVD) is the wider process of bringing reporter, vendor and others together so that fixes and public information are released together. It is a managerial control that adds an identification channel.

How it works:
1. **Publish a policy**: what is in scope, what testing is allowed, how to report, a promise not to take legal action against good-faith research, and expected response times. A `security.txt` file on the website (RFC 9116) tells researchers where to report.
2. **Receive and acknowledge** reports through a monitored channel.
3. **Triage**: confirm, rate severity, decide the fix.
4. **Remediate** and, for products, publish an advisory and request a CVE (Common Vulnerabilities and Exposures) identifier where it applies.
5. **Coordinate public disclosure** with the reporter and credit them if they wish.

CISA runs a coordination process for vulnerabilities affecting critical infrastructure and may publish after 45 days from its first contact attempt if a vendor does not respond or will not commit to a reasonable fix schedule.

**Why it matters:** without a channel, a researcher who finds a flaw may give up, post it publicly, or sell it. With one, the organization gets free early warning and time to fix.

**Common confusions:** Responsible disclosure does not have to pay rewards; a bug bounty is the rewarded variant. A disclosure program is not permission to test anything; scope rules still apply. Disclosure timing is coordinated, not secret forever.

**Scenario:** A researcher emails the support desk about a data leak, gets no answer, and threatens to publish. The missing control is a responsible disclosure program with a monitored reporting channel. Legal threats against the researcher are the closest wrong answer: they discourage reporting and do not fix the flaw.

Mini-example of a `security.txt` entry: `Contact: mailto:security@example.org` and `Policy:` followed by the web address of the disclosure policy page on example.org and `Expires: 2027-06-30T00:00:00Z`.

### Bug bounty program
A bug bounty program pays rewards to outside researchers who find and responsibly report vulnerabilities in an organization's systems or products, within a defined scope and set of rules. It is the rewarded form of a responsible disclosure program: same reporting and coordination, plus money or recognition. It is a managerial control that buys continuous, crowd-sourced identification.

How it works:
1. **Define scope**: which domains, apps and versions are in, which are out (for example third-party services or production databases), and which techniques are forbidden (denial of service, social engineering, physical access).
2. **Set rules and rewards**: payment tiers by severity, duplicate handling, how and when findings may be disclosed.
3. **Run intake and triage**, often through a bug bounty platform that verifies reports and handles payments.
4. **Fix and pay**: confirm the finding, remediate, reward the researcher, and update the program as systems change.

Testing outside the published scope is not authorized, even inside a bounty program, and can be treated as an attack.

**Why it matters:** a bounty gives an organization many testers with different skills at a cost tied to results, and it competes with the criminal market for the same findings.

**Common confusions:** A bug bounty is not a penetration test: a pen test is a contracted, scheduled engagement with defined testers; a bounty is open-ended and pays per valid finding. A bounty does not replace internal scanning or secure development; it catches what slips through. Paying for a report is not paying a ransom; extortion ("pay or I publish") is a separate, criminal matter.

**Scenario:** A software company wants continuous testing of its public web app by many independent researchers, paying only for valid findings. The answer is a bug bounty program. An annual penetration test is the closest wrong answer, because it is a single point in time and paid regardless of findings.

### System and process audit (vulnerability identification)
A system or process audit reviews systems, configurations and procedures against a defined standard: internal policy, an industry framework or a regulation. As a way to identify vulnerabilities, it finds gaps scanners cannot see: missing approvals, unreviewed firewall rules, undocumented exceptions, accounts nobody reviews, procedures that exist on paper but are not followed. It is a managerial (and sometimes technical) detective control, performed internally or by an independent external auditor.

How it works:
1. **Pick the standard and scope**: for example the company's patch policy, a benchmark, or a payment card requirement.
2. **Gather evidence**: configuration exports, logs, tickets, approval records, interviews, sampling.
3. **Compare evidence with the requirement**, control by control.
4. **Record findings** with their risk and owner.
5. **Track remediation** and re-audit.

Two flavors: a system audit checks how systems are configured (settings against a benchmark); a process audit checks how work is done (are vulnerability exceptions approved and reviewed, are patches applied within the policy's deadline).

**Why it matters:** many breaches happen through process failure, such as an exception that never expired or a server excluded from scans "temporarily" for years. Audits are how those surface.

**Common confusions:** An audit for identification (this section) and an audit for validation (checking that remediation followed policy) use the same skills at different points in the cycle. An audit is not a scan, even when it uses scan results as evidence. Passing an audit means meeting the chosen standard, which may be weaker than what the threat requires.

**Scenario:** Scans look good, but no one can show that critical vulnerabilities are fixed within the 15 days the policy requires. The answer is a process audit of remediation timelines against the policy. Another vulnerability scan is the closest wrong answer, because it shows current state, not whether the process met its deadlines.

### Confirmation of findings: false positives and false negatives
Confirmation checks whether a reported vulnerability really exists before effort is spent on it, and whether real problems were missed. It is the first analysis step, a mix of technical checks and analyst judgment. The two errors it deals with are false positives and false negatives.

| Result | Tool says | Reality | Effect |
|---|---|---|---|
| True positive | Vulnerable | Vulnerable | Correct: fix it |
| False positive | Vulnerable | Not vulnerable | Wasted effort, alert fatigue, lost trust in the tool |
| True negative | Not vulnerable | Not vulnerable | Correct: no action |
| False negative | Not vulnerable | Vulnerable | Most dangerous: the flaw stays and everyone believes it is fixed |

How to confirm:
1. **Check the evidence** the scanner used: a version string, a response, a file.
2. **Compare with the real state**: package version, applied patches, configuration. A common false positive is a vendor backport, where the fix is applied but the version number still looks old.
3. **Use a credentialed scan or a second tool** when the first was an outside guess.
4. **Test safely** where needed, or ask the system owner.
5. **Record the decision**, so the same false positive is suppressed with a reason, not ignored blindly.

Reducing false negatives: keep vulnerability data updated, scan with credentials, cover every asset in the inventory, and combine scans with penetration tests and other methods.

**Why it matters:** too many false positives make teams stop reading reports; a false negative leaves a hole open with a clean report attached.

**Common confusions:** A false positive is "reported but not real"; a false negative is "real but not reported". Tuning to remove false positives can create false negatives if done carelessly. A finding the business chooses not to fix is not a false positive; it is accepted risk, handled as an exception.

**Scenario:** A scanner flags a web server for a flaw fixed in version 2.4.60, reading 2.4.57 from the banner, but the vendor's package already includes the backported fix. That is a false positive, confirmed by checking the installed package's changelog. Treating it as a false negative is the classic mix-up: nothing was missed, something was wrongly reported.

### Common Vulnerabilities and Exposures (CVE identifiers)
Common Vulnerabilities and Exposures (CVE) is the public catalog that gives each publicly known vulnerability a unique identifier, so vendors, scanners, advisories and defenders all refer to the same flaw by the same name. The published SY0-701 acronym list expands it as Common Vulnerability Enumeration, but the program's official name is Common Vulnerabilities and Exposures; both refer to the same list. The CVE Program is run by MITRE with sponsorship from the US Cybersecurity and Infrastructure Security Agency (CISA). CVE is a naming system, not a control in itself; it supports identification and communication.

How it works:
1. A vulnerability is found and reported to a CVE Numbering Authority (CNA): a vendor, researcher organization, coordinator such as CISA, or MITRE.
2. The CNA assigns an ID in the format CVE, a year, then a number, for example `CVE-2024-6387`. Every record in the list is added by a CNA.
3. A CVE record is published describing the flaw and the affected product.
4. Others build on it: the US National Vulnerability Database (NVD) publishes CVSS scores for CVE records; CISA lists a CVE in its Known Exploited Vulnerabilities catalog when it is exploited in the wild.
5. Scanners and advisories map their findings to the CVE ID.

Example: CVE-2021-44228 is the Apache Log4j2 remote code execution flaw known as Log4Shell; the NVD scores it CVSS 3.1 base 10.0, Critical.

**Why it matters:** during an emergency, one shared identifier lets a security team ask every vendor, scanner and feed the same precise question: "are we affected by CVE-2021-44228?"

**Common confusions:** CVE is the identifier; it does not score severity (CVSS does) and does not describe weakness types (CWE does). Not every flaw has a CVE; internal misconfigurations usually do not. A CVE ID existing does not mean a patch exists.

**Scenario:** Two teams argue about whether the "logging bug" and the "Java JNDI flaw" are the same issue. The quickest way to settle it is to compare their CVE identifiers. Comparing CVSS scores is the closest wrong answer, because many different vulnerabilities share the same score.

### Common Vulnerability Scoring System (CVSS)
The Common Vulnerability Scoring System (CVSS) is an open standard, maintained by FIRST (Forum of Incident Response and Security Teams), that rates a vulnerability's severity from 0.0 to 10.0 from its characteristics. It gives everyone a common, comparable scale. It informs prioritization; it is not a control. Version 4.0 was published in November 2023; version 3.1 remains widely used.

How a CVSS v4.0 score is built:
1. **Base metrics** (properties of the flaw that do not change): attack vector (network, adjacent, local, physical), attack complexity, attack requirements (conditions such as a race or an on-path position), privileges required (none, low, high), user interaction, and impact on confidentiality, integrity and availability for the vulnerable system and for subsequent systems.
2. **Threat metrics**: change over time, mainly whether exploit code exists or attacks have been seen.
3. **Environmental metrics**: your own setting, such as mitigations in place and how important the affected system is.
4. **Supplemental metrics**: extra context that does not change the score.

Scores are labeled by what was used: CVSS-B (base only), CVSS-BT (base and threat), CVSS-BE (base and environmental), CVSS-BTE (all three). The qualitative ratings, the same in v3.x and v4.0: None 0.0, Low 0.1 to 3.9, Medium 4.0 to 6.9, High 7.0 to 8.9, Critical 9.0 to 10.0.

Mini-example of a v3.1 vector: `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H` = network reachable, low complexity, no privileges, no user action, scope changed, high impact on all three = 10.0 (the Log4Shell score).

**Why it matters:** a score lets teams sort thousands of findings and set deadlines by severity bands, and lets suppliers communicate urgency in one number.

**Common confusions:** A published score is usually base only; FIRST says CVSS is one input to vulnerability management, alongside factors such as regulation, affected customers and reputation. A high base score on an isolated test system can matter less than a medium score on an internet-facing payment server. CVSS is not a probability of attack.

**Scenario:** A team patches strictly by base score and leaves a 6.5 flaw on its internet-facing login portal while fixing a 9.0 on an offline lab machine. The better approach adds environmental and threat context. Raising the patch threshold to 9.0 and above only is the closest wrong answer, because it ignores exposure and exploitation.

### CVE vs CVSS vs CWE (identifier, score, weakness type)
Three similar acronyms answer three different questions about a vulnerability. CVE (Common Vulnerabilities and Exposures) names one specific flaw. CVSS (Common Vulnerability Scoring System) rates how severe it is. CWE (Common Weakness Enumeration) names the type of mistake behind it.

| | CVE | CVSS | CWE |
|---|---|---|---|
| Answers | Which flaw is this? | How severe is it? | What kind of weakness caused it? |
| Form | An identifier: `CVE-2021-44228` | A score from 0.0 to 10.0 plus a vector string | A category number and name, such as SQL injection |
| Maintained by | The CVE Program: operated by MITRE, sponsored by CISA | FIRST | MITRE, sponsored by CISA, with community partners |
| Used for | Tracking and talking about one flaw across tools | Sorting and setting deadlines | Classifying findings, finding root causes, training developers |
| Changes over time? | The ID stays fixed | Threat and environmental scores can change; the base score is stable | The type stays fixed |

How they appear together in a scanner finding: `CVE-2021-44228 | CVSS 10.0 Critical | weakness type: its CWE category`. One CVE has one or more CVSS scores (different versions or scorers) and maps to one or more CWE types. Many CVEs share the same CWE.

MITRE defines a weakness as a flaw in software or hardware that, under the right conditions, could lead to vulnerabilities. That is the difference in level: a CWE is a class of mistake, a CVE is one instance of a mistake in one product.

**Why it matters:** mixing them up causes real errors, such as asking "what is the CVE score" (CVE has none) or closing a finding because another one "has the same CVSS".

**Common confusions:** The published SY0-701 acronym list writes CVE as Common Vulnerability Enumeration; the program's name is Common Vulnerabilities and Exposures, and both mean the same list. The NVD (National Vulnerability Database) is not CVE; it is a US government database that adds scores and data to CVE records. CVSS measures severity, not risk to your organization.

**Scenario:** A report says "CVE-2024-6387, 8.1". The identifier is the CVE part; 8.1 is the CVSS base score (High). If a developer asks what kind of coding error it was, the answer is the CWE (here a race condition type). Saying the CVE "is rated by MITRE at 8.1" is the closest wrong answer, because CVE assigns names, not scores.

### Prioritizing vulnerabilities (severity, exploitation, exposure, asset value)
Prioritizing means ordering confirmed vulnerabilities for remediation, because no team can fix everything at once. Good prioritization combines how bad the flaw is with how likely it is to be used and what it would cost here. It is an analysis activity that turns scanner output into a work plan, a managerial control guided by risk tolerance.

Inputs, with what each adds:
1. **Severity (CVSS base score)**: how bad the flaw is in general.
2. **Active exploitation**: is it being used in real attacks? The CISA Known Exploited Vulnerabilities (KEV) catalog lists flaws confirmed as exploited in the wild, each with a due date for US federal agencies, and CISA advises every organization to use it as an input to prioritization.
3. **Likelihood of exploitation**: the Exploit Prediction Scoring System (EPSS) from FIRST estimates the probability, from 0 to 1, that a CVE (Common Vulnerabilities and Exposures) will be exploited in the wild in the next 30 days.
4. **Exposure**: internet-facing, reachable from the user network, or isolated.
5. **Asset value and data**: what the system does and holds; who depends on it.
6. **Existing controls**: a web application firewall rule, segmentation or disabled feature that already blocks the attack path.

How to apply: fix first what is exploited now on exposed, important systems; then high severity on exposed systems; then the rest by deadline bands set from risk tolerance. NIST SP 800-40 Rev. 4 warns that simple counts (how many vulnerabilities, what percentage patched) are not actionable; metrics should reflect the importance of each asset and vulnerability.

**Why it matters:** attackers use a small share of all published vulnerabilities. Spending a week on unexploitable criticals while an exploited medium sits on the VPN gateway is how organizations get breached with a "good" patch rate.

**Common confusions:** Highest score first is not the same as highest risk first. KEV says "is being exploited"; EPSS says "likely to be exploited"; CVSS says "how severe". Prioritizing does not mean low items are never fixed; they get longer deadlines.

**Scenario:** Two findings arrive: a CVSS 9.8 on an isolated lab server with no known exploit, and a CVSS 7.5 on the public VPN gateway that appears in the KEV catalog. The VPN gateway comes first. Choosing the 9.8 is the closest wrong answer; it follows the score and ignores exploitation and exposure.

### Vulnerability classification
Vulnerability classification groups findings by type and severity so that similar problems can be handled together and their root causes found. Types can be broad (missing patch, misconfiguration, weak or default credentials, insecure protocol, coding flaw, unsupported software) or precise (a CWE (Common Weakness Enumeration) category such as cross-site scripting). Severity bands usually follow CVSS (Common Vulnerability Scoring System) ratings. Classification is an analysis activity that supports prioritizing, assigning work and reporting.

How it works:
1. **Assign a type** to each confirmed finding, using the scanner's category and, for software flaws, its CWE mapping.
2. **Assign a severity band** (Critical, High, Medium, Low).
3. **Group by type, system owner and cause.** Reason: 400 findings may be one cause, such as a single outdated golden image.
4. **Route to the right team**: missing patches to operations, coding flaws to developers, misconfiguration to platform owners.
5. **Look for patterns**: a type that keeps returning points to a process problem (no baseline, no code review, no decommissioning).

**Why it matters:** fixing causes is cheaper than fixing instances. If half of all findings are "default configuration", a better baseline removes them for every future system too.

**Common confusions:** Classification is not prioritization: classification says what kind of problem it is, prioritization says what to fix first. Classifying a vulnerability is not classifying data (public, confidential), which is a different topic. A misconfiguration usually has no CVE (Common Vulnerabilities and Exposures) but is still a vulnerability to classify and fix.

**Scenario:** A quarterly report shows 1,200 findings. Classified by type, 700 are one outdated Java runtime installed by the standard server image. The right action is fixing the image and redeploying, not 700 separate tickets. Sorting only by CVSS score is the closest wrong answer, because it hides the shared cause.

Mini-example of a classified finding: `Type: Missing patch | Weakness: out-of-bounds write | Severity: High | Owner: Server team | Root cause: image built before the update`.

### Exposure factor (EF) in vulnerability analysis
Exposure factor (EF) is the share of an asset's value that would be lost if a specific threat succeeded, written as a percentage from 0% to 100%. It turns "how bad would it be" into a number for quantitative risk calculations. In vulnerability analysis it helps compare findings by expected loss, not only by technical severity. The full quantitative risk formulas belong to objective 5.2; this section covers how EF is used when analyzing vulnerabilities.

The formulas:
1. **Single loss expectancy (SLE) = asset value (AV) x exposure factor (EF).** The loss from one occurrence.
2. **Annualized loss expectancy (ALE) = SLE x annualized rate of occurrence (ARO).** The expected loss per year.

Worked example: a customer database is valued at 400,000. Exploiting a flaw would expose about half of it and force partial rebuild, so EF = 50%. SLE = 400,000 x 0.5 = 200,000. If such an event is expected once every four years, ARO = 0.25, so ALE = 200,000 x 0.25 = 50,000 per year. A fix costing 10,000 per year is clearly worth it; one costing 90,000 per year is not, unless other factors (law, safety) require it.

How to estimate EF: ask what portion of the asset is lost or must be replaced, and how much of its function stops. Ransomware encrypting everything with no backups is close to 100%; a flaw exposing one non-sensitive table might be 5%.

**Why it matters:** EF lets a security team explain to finance why one vulnerability deserves budget and another can wait, in money terms.

**Common confusions:** Exposure factor is not "how exposed to the internet a system is"; that is exposure, an environmental variable. EF is a percentage of value lost, not a probability; the probability side is ARO. EF is not part of the CVSS (Common Vulnerability Scoring System) score.

**Scenario:** A flood-style failure would destroy 30% of a 200,000 server room's equipment. EF is 30% and SLE is 60,000. Answering "ARO is 30%" is the closest wrong answer; ARO is how often per year it happens, not how much is lost.

### Environmental variables, organizational impact and risk tolerance
Three analysis inputs adjust a vulnerability's generic severity to one organization's reality. Environmental variables describe where the vulnerable system sits and what protects it. Industry or organizational impact is what exploitation would cost this particular business. Risk tolerance is how much risk leadership will accept, expressed here as fix deadlines and exception rules. Together they explain why the same CVE (Common Vulnerabilities and Exposures entry) is urgent in one place and minor in another.

**Environmental variables**: Is the system internet-facing, internal or isolated? What data does it hold? Do other controls already block the attack path (segmentation, a web application firewall, a disabled feature)? How many systems share the flaw? CVSS (Common Vulnerability Scoring System) has environmental metrics for exactly this, producing a score adjusted to your setting.

**Industry/organizational impact**: a hospital weighs patient safety and health-record rules; a bank weighs fraud and financial regulation; a factory weighs production stoppage and safety; an online shop weighs card data and downtime at peak season. Regulation, contracts, critical services and reputation all raise or lower impact.

**Risk tolerance**: set by leadership, it becomes policy such as "critical findings on internet-facing systems fixed in 7 days, high in 30, medium in 90", and decides who may approve an exception and for how long. It is the same concept as in risk management (objective 5.2), applied to remediation speed.

How to apply, in order: start from the base severity; adjust for environment; weigh organizational impact; then compare with the deadlines that tolerance sets.

**Why it matters:** applying one generic rule everywhere either wastes effort on low-risk systems or leaves the systems that could stop the business under-protected.

**Common confusions:** Risk tolerance is not risk appetite: appetite is the broad amount of risk the organization is willing to pursue, tolerance is the acceptable variation around it in practice. Environmental variables can lower a score as well as raise it. Organizational impact is about the business, not the technology.

**Scenario:** The same remote-code flaw exists on a public patient portal and on an isolated lab analyzer with no network path from users. The portal is fixed first: its environment (internet-facing) and organizational impact (health records) are far higher. Treating both alike because the CVSS base score is equal is the closest wrong answer.

### Patching (vulnerability remediation)
Patching applies the vendor's update that fixes the vulnerable code or setting. It is the most direct remediation, a corrective technical control that removes the flaw. NIST SP 800-40 Rev. 4 notes that installing a patch, update or upgrade is the only response that fully eliminates a vulnerability without removing functionality.

How it works, in order:
1. **Know what you have**: inventory and scan results show where the vulnerable software runs.
2. **Assess and prioritize** the patch against risk and deadlines.
3. **Test** on representative systems. NIST suggests phased rollouts where a small set of "canary" systems gets the patch first to reveal problems.
4. **Approve through change management**, with a rollback plan and a maintenance window where needed.
5. **Deploy**, automatically where possible, with a grace period after which installation is forced.
6. **Verify** installation and rescan.

The common wrong order is deploying everywhere first and testing afterwards, which turns one bad patch into an outage.

NIST's planning scenarios: **routine patching** (the regular cycle, often postponed and neglected because it lacks urgency), **emergency patching** (a severe or actively exploited flaw; same steps on a much faster schedule), **emergency mitigation** (temporary protection before a patch exists or when a patch is faulty, later replaced by the permanent fix), and **unpatchable assets** (long-term isolation and other mitigations).

Why patching sometimes waits: no patch exists yet, the software is past end of life, an outage window or testing is needed, or a vendor must certify updates for safety-regulated equipment.

**Why it matters:** attackers reverse-engineer patches to build exploits quickly, so the gap between patch release and installation is the window of highest risk.

**Common confusions:** A patch that is "deployed" is not necessarily installed; many need a reboot. Patching is not the same as upgrading, though an upgrade to a fixed version also remediates. Emergency patching still includes a quick test.

**Scenario:** A vendor releases a fix for a flaw being exploited against internet-facing mail servers. The answer is emergency patching: fast test on one server, then rapid rollout through an expedited change. Waiting for next month's routine cycle is the closest wrong answer, given active exploitation.

### Segmentation and compensating controls (vulnerability response)
When a flaw cannot be fixed now, two responses reduce the risk without removing it. Segmentation isolates the vulnerable system so attackers have fewer paths to it and a compromise cannot spread. A compensating control is an alternative safeguard that gives comparable protection when the normal control (usually the patch) cannot be applied. NIST glossary entries describe compensating controls as measures used in place of baseline controls that provide equivalent or comparable protection.

**Segmentation**, how it works:
1. Place the system in its own network segment (VLAN, firewall zone or microsegment).
2. Allow only the specific traffic it needs, from the specific systems that need it.
3. Block everything else and monitor the allowed paths.
Typical users: legacy servers, industrial control systems, medical devices and IoT devices.

**Compensating controls**, examples by problem:
- Unpatched web application flaw: a web application firewall (WAF) rule that blocks the attack pattern (virtual patching).
- Vulnerable service that cannot be updated: disable the vulnerable feature, restrict it to a jump host, or require a VPN.
- Unsupported operating system: application allow listing, removal of internet access, extra logging and alerting.

How to manage them: document why the normal fix is not possible, who approved the alternative, how it reduces the risk, and when it will be reviewed. NIST SP 800-40 Rev. 4 says emergency mitigations should be replaced by the permanent fix once available, and long-term alternatives re-evaluated periodically.

**Why it matters:** "we cannot patch it" is common in hospitals, factories and old business systems. These responses keep such systems usable without leaving them open.

**Common confusions:** Segmentation is itself often used as a compensating control; this objective names them as two responses. Neither removes the vulnerability: a rescan will still report it. A compensating control must address the same risk, not merely be another security tool.

**Scenario:** A laboratory instrument runs an unsupported operating system the vendor will not update for a year. The answer is segmentation with tightly filtered access (plus monitoring), documented as an exception. Buying cyber insurance is the closest wrong answer: it helps pay after an incident but does nothing to prevent one.

### Cybersecurity insurance (vulnerability response)
Cybersecurity insurance transfers part of the financial consequence of a security incident to an insurer. As a vulnerability response it does nothing to the flaw itself: it is risk transfer, a managerial control that softens the cost if the risk is realized. NIST SP 800-40 Rev. 4 lists buying cybersecurity insurance as an example of the transfer response, which shares some consequences with another party.

How it works:
1. **Apply**: the insurer asks about controls in place. Many require basics such as multifactor authentication, tested backups, endpoint protection and patching before they will offer cover or a reasonable price.
2. **Agree on cover**: what events are included (for example breach response costs, legal fees, notification, business interruption, data restoration), limits, the deductible and exclusions.
3. **Maintain the declared controls**: a claim can be reduced or refused if the organization misrepresented its security.
4. **Claim after an incident**, following the policy's notification rules and often using the insurer's approved response firms.

**Why it matters:** a serious breach can cost more than a mid-sized company holds in cash. Insurance keeps the business alive while it recovers, and the application process itself often forces overdue security improvements.

**Common confusions:** Insurance transfers financial impact, not responsibility: the organization remains accountable to customers and regulators. It does not reduce the likelihood of attack. Policies commonly exclude some events, so "we are insured" is not a blanket answer. In the risk vocabulary, insurance is transfer; patching and segmentation are mitigation; an exception is acceptance; removing the system is avoidance.

**Scenario:** A board accepts that a legacy billing system will stay vulnerable for two years, has isolated it, and now wants to limit the financial hit if it is breached anyway. The answer is cyber insurance. Calling insurance a compensating control is the closest wrong answer: it does not reduce the chance or technical impact of exploitation.

### Exceptions and exemptions (vulnerability response)
An exception or exemption is a formal, documented approval to leave a vulnerability unremediated, or to not follow a policy requirement, for a stated reason. Organizations often use the two words interchangeably, and where they differ the organization's own policy defines how. Either way it is risk acceptance, a managerial control, signed by someone with authority to accept that risk.

What a valid exception contains:
1. **The asset and the finding**, precisely.
2. **The business reason** the standard fix cannot be applied now (vendor certification, no patch exists, outage impact).
3. **Compensating controls** in place, such as segmentation or extra monitoring.
4. **The residual risk** and who accepts it (the asset owner or a risk committee, not the technician).
5. **An expiry date and review schedule.**
6. **A plan** to remove the need for it (replacement, vendor fix).

NIST SP 800-40 Rev. 4 advises tracking and monitoring all exceptions closely, reviewing them regularly to see whether the normal plan can now be applied, and creating a proper maintenance group for assets that cannot be patched, with planned mitigations, instead of leaving them as open-ended exceptions.

**Why it matters:** unmanaged exceptions pile up into a hidden inventory of permanently vulnerable systems. A documented, expiring exception keeps the decision visible and owned.

**Common confusions:** An undocumented unpatched server is not an exception; it is a failure of the process. An exception does not make the scanner stop reporting the finding, and it should not: the risk is still there. Accepting risk is a business decision made by the owner, not by the security team.

**Scenario:** A production line controller cannot be patched until the plant's annual shutdown in five months. The right handling is a time-limited exception approved by the asset owner, with segmentation and monitoring as compensating controls, reviewed at the shutdown. Marking the finding as a false positive is the closest wrong answer, because the vulnerability is real.

Mini-example of an exception record: `Asset: PLC-Line3 | Finding: CVE on controller firmware | Reason: vendor fix needs line shutdown | Controls: isolated VLAN, allow list of 2 engineering hosts, alerting | Approved by: Plant director | Expires: next shutdown, 14 April`.

### Patching vs segmentation vs compensating controls vs insurance vs exceptions
This objective names five responses to a confirmed vulnerability. Only one removes the flaw. The others reduce, transfer or accept the risk, and a rescan will still show the finding.

| Response | What it does | Risk treatment | Flaw still present? | Use when |
|---|---|---|---|---|
| Patching | Fixes the vulnerable code or setting | Mitigate (eliminates the flaw) | No | A tested fix exists and can be deployed |
| Segmentation | Isolates the system and limits paths to it | Mitigate (reduces likelihood and spread) | Yes | The system cannot be patched soon |
| Compensating controls | Alternative safeguard for the same risk, such as a WAF rule or disabled feature | Mitigate | Yes | The normal control is not possible or not yet available |
| Insurance | Shifts financial loss to an insurer | Transfer | Yes | Residual financial risk remains after other measures |
| Exceptions and exemptions | Formal, documented, time-limited acceptance | Accept | Yes | A business reason prevents remediation for now |

WAF means web application firewall. NIST SP 800-40 Rev. 4 names four risk responses (accept, mitigate, transfer, avoid); the one with no row in this table, avoid, means removing the attack surface altogether, for example uninstalling the software or decommissioning the system.

How they combine in practice: an unpatchable system usually gets segmentation plus compensating controls, recorded under an exception, with insurance covering what is left.

**Why it matters:** choosing a response is a business decision with a named owner. Knowing which options leave the flaw in place prevents false confidence.

**Common confusions:** An exception is not a fix. Insurance is not mitigation. Segmentation narrows access; it does not repair the system. "Do nothing" without documentation is none of the five.

**Scenario:** Clue: "vendor patch available, tested, no constraint": patch. Clue: "cannot be patched, must keep running": segmentation and compensating controls with an exception. Clue: "limit financial loss": insurance. Clue: "formally approved to remain unfixed until a date": exception.

### Validation of remediation (rescanning, audit, verification)
Validation of remediation proves that a fix actually worked and did not create new problems. It closes the loop before a finding is reported as resolved. This objective names three methods: rescanning, audit and verification. It is a detective activity that guards against the common assumption that a deployed patch is an installed, effective patch.

The three methods:
1. **Rescanning**: run the vulnerability scan again, with the same settings and credentials as the original, and confirm the finding is gone and no new ones appeared. It is the fastest, broadest check. Reason for same settings: a different scan may simply fail to look.
2. **Verification**: confirm directly that the fix is in place and effective: check the installed version or setting, confirm the service restarted, retest the exploit safely, or check that a compensating control really blocks the attack. NIST SP 800-40 Rev. 4 describes this step as making sure the response was implemented successfully, for patches by confirming installation took effect and for mitigations by confirming they work as intended.
3. **Audit**: review the records: change tickets, approvals, timestamps, evidence of testing, and whether the policy's deadline was met. It checks the process as well as the result, and supports compliance.

Order in practice: verify on the system, rescan to confirm at scale, audit to confirm the process and timing.

Why fixes fail silently: the patch needs a reboot that never happened; it installed on some machines only; it was rolled back; the vulnerable component exists in a second location; a firewall rule was added to the wrong interface.

**Why it matters:** a ticket closed without validation leaves the organization believing it is protected while the flaw remains, which is worse than knowing it is open.

**Common confusions:** Rescanning is automated and broad; verification is a direct, often manual, check of one fix; audit checks evidence and process. A clean rescan after an exception does not exist: the finding will still appear, correctly. Validation is not the same as reporting, which comes after.

**Scenario:** Administrators report a critical patch deployed to 500 servers. A rescan with the original settings still flags 60 of them, which had not been rebooted. That is validation by rescanning doing its job. Closing the tickets on the administrators' word is the closest wrong answer.

### Vulnerability reporting
Vulnerability reporting communicates what was found, how risky it is, what was done and what remains, to the people who must act or decide. It is the last step of the cycle and feeds the next one. It is a managerial control that creates accountability and supports compliance.

What good reports contain, by audience:
1. **System administrators and developers**: the affected hosts or code, the finding and its evidence, CVE (Common Vulnerabilities and Exposures) identifier and CVSS (Common Vulnerability Scoring System) score, the recommended fix, and the deadline.
2. **Security management**: counts by severity and age, overdue items, exceptions and their expiry, trends over time, coverage (what share of assets was scanned, with credentials).
3. **Executives and the board**: a short view of risk: are critical exposures shrinking, are deadlines met, what decisions or funding are needed.
4. **Auditors and regulators**: evidence that the process ran: scan schedules, remediation times against policy, approved exceptions.

Useful metrics: open critical and high findings on internet-facing systems, mean time to remediate by severity, percentage fixed within the policy deadline, number and age of exceptions, scan coverage. NIST SP 800-40 Rev. 4 warns against overly simple counts and asks for metrics that reflect the importance of each asset and vulnerability, tailored to each audience.

Handling: vulnerability reports describe exactly how to attack the organization, so they are sensitive, shared on a need-to-know basis and stored protected.

**Why it matters:** leadership cannot fund or prioritize what it cannot see. A clear trend ("overdue criticals doubled in the plant network") turns a technical backlog into a business decision.

**Common confusions:** A raw scanner export is not a report; it needs confirmation, context and priorities. Reporting is not the end of the work, because findings that remain feed the next cycle. More pages is not better; the right detail for the reader is.

**Scenario:** A CIO asks whether the patching program is improving. The right report shows trend metrics: percentage of critical findings fixed within deadline over the last four quarters and the count of overdue items. A 900-page list of every finding is the closest wrong answer, because it answers a different reader's question.

## 4.4 Security alerting and monitoring concepts and tools
Depth asked: explain. A good answer says what each monitoring activity or tool collects, what it tells you and which look-alike tool does a different job.

### Monitoring computing resources (systems, applications, infrastructure)
Monitoring is the continuous collection and review of data from computing resources so that failures, misuse and attacks are noticed quickly. This objective splits what is monitored into systems, applications and infrastructure. It is a detective control (technical, with operational procedures) that supports all three legs of the CIA triad: confidentiality, integrity and availability. Hardening tries to prevent; monitoring tells you when prevention failed or settings drifted.

What to watch in each area:
1. **Systems** (servers, workstations, other endpoints): logins and failed logins, privilege use, account and group changes, new processes and services, configuration changes, and resource use (CPU, memory, disk). A sudden change can mean failure or compromise.
2. **Applications**: availability, response times, error rates, and application logs of what users do inside the app: failed sign-ins, access to sensitive functions, unusual transactions, input errors that look like attacks.
3. **Infrastructure** (routers, switches, firewalls, wireless controllers, cloud and virtualization platforms): device health, interface status, traffic volumes and flows, configuration changes, and control-plane actions in the cloud (who created or changed what).

How monitoring works end to end: collect (agents, syslog, SNMP (Simple Network Management Protocol), flow data, APIs); send to a central place; normalize and correlate; alert on rules and thresholds; respond; report; archive.

A baseline of normal behavior is what makes monitoring useful: you can only spot "unusual" when you know usual.

**Why it matters:** the time an attacker stays unnoticed drives the damage. Monitoring across all three areas shortens that time and gives the evidence needed afterwards.

**Common confusions:** Monitoring is not only security: availability and performance data often give the first sign of an attack (a server at full CPU may be mining cryptocurrency). Application logs show actions inside the app that operating system logs never see. Collecting logs is not monitoring unless someone, or some rule, reviews them.

**Scenario:** A database server shows normal logins, but the application log shows one account exporting ten times its usual number of records at night. The source that revealed it is application monitoring. System monitoring is the closest wrong answer: the operating system saw nothing unusual.

### Log aggregation
Log aggregation collects logs from many sources (servers, endpoints, applications, firewalls, cloud services) into one central place, usually a log server or a security information and event management (SIEM) system. It solves three problems at once: analysts can search everything in one place, events from different systems can be correlated, and an attacker who takes over a host cannot quietly erase the copies already sent away. It is a detective technical control that also protects the integrity of evidence.

How it works:
1. **Generate**: each source records events. Decide what to log (authentication, privilege use, changes, errors, network connections).
2. **Transport**: agents or forwarders send logs centrally, often with syslog. Classic syslog is simple and was not built with security in mind; newer implementations add TCP for reliable delivery and encryption.
3. **Normalize**: convert fields into a common format, especially dates and times, so entries from different products can be compared. NIST SP 800-92 notes that time normalization is especially hard across time zones and unsynchronized clocks.
4. **Aggregate and reduce**: merge repeated entries into one with a count and drop unneeded data.
5. **Correlate**: find relationships between entries from one or many sources, by rule or by statistics.
6. **Store, rotate and archive** under protection, for as long as policy requires.

Accurate time is essential: all sources should synchronize clocks (Network Time Protocol), or the order of events across systems cannot be trusted.

**Why it matters:** an attack usually touches several systems. Each local log shows a harmless fragment; together they show the intrusion. Without central copies, the first thing a capable intruder deletes is the evidence.

**Common confusions:** Aggregation is collecting and combining; correlation is analysis that follows. A log server stores; a SIEM also correlates and alerts. In NIST's wording, "event aggregation" also means merging many similar entries into one counted entry; in this objective and in everyday usage "log aggregation" means centralizing logs.

**Scenario:** After a breach, the attacker cleared the local logs on the web server, yet investigators still reconstructed the attack. That was possible because of log aggregation to a central system. Local log rotation is the closest wrong answer: rotation manages file size on the host and would have been wiped with the rest.

Mini-example of a syslog line: `<86> Nov 14 02:13:07 web01 sshd[4121]: Failed password for root from 203.0.113.77 port 51122 ssh2`. The number in angle brackets encodes the message type (facility) and a severity from 0 (emergency) to 7 (debug).

### Alerting and alert tuning
Alerting automatically notifies people (or automation) when monitored data matches a rule or crosses a threshold that suggests a problem or an attack. Alert tuning adjusts those rules and thresholds so that real threats are caught and noise is cut. Both are detective technical activities, usually inside a SIEM (security information and event management), intrusion detection system or endpoint tool. No detection is perfectly accurate: NIST SP 800-94 defines a false positive as benign activity flagged as malicious and a false negative as malicious activity missed.

How alerting works:
1. **Define detections**: signature rules ("this known bad pattern"), thresholds ("more than 20 failed logins in 5 minutes"), correlation rules ("failed logins, then success, then new admin account"), and anomaly rules ("far from this user's normal").
2. **Assign severity** and a destination (queue, pager, ticket).
3. **Add context** automatically: asset owner, criticality, recent related alerts.
4. **Respond** by a documented procedure, then record the outcome.

How tuning works:
1. **Measure** which rules fire most and how many were real.
2. **Adjust** thresholds, add exclusions for known-good activity (the backup account, the vulnerability scanner), merge duplicates, or rewrite weak rules.
3. **Test** that true attacks still trigger.
4. **Review regularly.** NIST SP 800-94 advises periodic review of tuning, including allow and block lists, to keep entries accurate.

**Why it matters:** analysts who receive thousands of meaningless alerts stop reading them (alert fatigue), and the one real alert is missed. Tuning is what keeps a monitoring program believable.

**Common confusions:** Tuning is not turning alerts off; over-tuning creates false negatives, which are worse. Reducing false positives and reducing false negatives pull in opposite directions, so every change is a trade-off. Tuning is continuous, because networks, software and attackers change.

**Scenario:** An intrusion detection rule fires 3,000 times a day on the vulnerability scanner's own traffic, and analysts now ignore the whole rule. The answer is alert tuning: exclude the scanner's address for that rule and keep it active for everything else. Disabling the rule is the closest wrong answer, because real attacks of that type would then go unseen.

### Scanning, reporting and archiving (monitoring activities)
Three monitoring activities keep the picture current, understandable and available later. Scanning actively checks systems on a schedule. Reporting turns raw data into information for people. Archiving keeps older data safely for the long term. All are detective or supporting controls in a monitoring program.

**Scanning (as a monitoring activity)**: regular, automated checks for vulnerabilities, misconfigurations, drift from the baseline, open ports, and unauthorized or unknown devices. It differs from passive log collection because it goes and looks. Results feed alerts (a new critical finding) and reports (trend of open findings). In objective 4.3 a vulnerability scan is a way to identify flaws; here the point is that scanning runs continuously as part of monitoring.

**Reporting**: summaries for each audience: analysts need detail and timelines; managers need trends and workload; auditors need evidence that controls operate; executives need a few risk indicators. Reports are scheduled or on demand; dashboards give a near-real-time view of the same data.

**Archiving**: moving older logs and monitoring data to long-term, protected storage. NIST SP 800-92 distinguishes log retention (archiving on a regular basis as normal operations) from log preservation (keeping logs that would otherwise be discarded because they record activity of interest, typically for an incident or investigation). Archived data must stay unaltered, since unmodified originals support use as evidence, and must be findable and readable when needed. When the retention period ends, logs are destroyed according to policy.

How they connect: scan and collect, alert, respond, report, archive, then dispose when retention ends.

**Why it matters:** intrusions are often discovered months after they began. Without archived logs, nobody can tell when the attacker got in or what was taken. Without reporting, nobody outside the security team knows whether monitoring works.

**Common confusions:** Archiving is not backup: a backup restores systems, an archive keeps records for later reference and legal need. Log rotation (closing one file and starting another to keep sizes manageable) is not archiving, though rotated files are often what gets archived. A dashboard is a live view; a report is a point-in-time summary.

**Scenario:** A regulator requires one year of authentication logs, but the servers keep only 30 days locally. The answer is archiving logs centrally with protected long-term storage. Increasing local log file size is the closest wrong answer: it keeps more on a host an attacker could alter and still fails if the server is rebuilt.

### Quarantine (alert response)
Quarantine isolates a suspicious file, email, device or account so it cannot do harm or spread while it is examined. It is a corrective and containing response to an alert, performed by antivirus, endpoint detection and response (EDR), email security gateways, or network access control (NAC). It protects the integrity and availability of everything else while preserving the item for analysis.

Forms of quarantine:
1. **File quarantine**: antivirus moves a detected file into a protected store where it cannot run. NIST SP 800-83 describes quarantining as storing files containing malware in isolation for later disinfection or examination.
2. **Email quarantine**: a gateway holds suspicious messages instead of delivering them; an administrator or the user can review and release.
3. **Host isolation**: EDR or NAC cuts a device off from the network except for its link to the security tools, so responders can still investigate remotely.
4. **Network quarantine**: NAC places a noncompliant or infected device in a restricted VLAN (virtual LAN) with access only to remediation servers.

How it fits alert response, in order: alert, quick triage, quarantine to contain, investigate, remediate (clean, reimage, patch), validate that the fix worked, release or remove, then tune the alert if it was wrong.

**Why it matters:** quarantine buys time. Isolating one infected laptop in seconds can stop ransomware before it reaches file shares, at the cost of one user's downtime.

**Common confusions:** Quarantine is not deletion: the item is kept, which allows recovery from false positives and preserves evidence. Quarantine is containment, not eradication; the cause still has to be removed. Quarantine in alert response is different from a sandbox, which is where an unknown file is run on purpose to observe it.

**Scenario:** EDR flags a workstation encrypting files rapidly on a share. The best immediate action is to quarantine (network-isolate) that host. Deleting the user's account is the closest wrong answer: the malicious process keeps running on the machine with its existing sessions, and evidence may be lost.

### Security Content Automation Protocol (SCAP)
The Security Content Automation Protocol (SCAP) is a set of interoperable specifications from the US National Institute of Standards and Technology (NIST) for expressing, exchanging and processing security configuration and vulnerability information in machine-readable form. It lets different tools check systems the same way and report results in a common format. It is not a tool; it is the common language tools use for automated compliance and vulnerability checks.

The main components:
- **XCCDF** (Extensible Configuration Checklist Description Format): the language for writing checklists and benchmarks, and recording results.
- **OVAL** (Open Vulnerability and Assessment Language): the language describing how to test a system's state (is this patch installed, is this setting on).
- **OCIL** (Open Checklist Interactive Language): for checks that need a human answer.
- **CPE** (Common Platform Enumeration): standard names for products and platforms.
- **CCE** (Common Configuration Enumeration): identifiers for configuration settings.
- **CVE** (Common Vulnerabilities and Exposures): identifiers for vulnerabilities.
- **CVSS** (Common Vulnerability Scoring System): severity scores.
- **ARF** (Asset Reporting Format): a common format for results.

How it is used:
1. An authority publishes a benchmark as SCAP content (for example a hardening guide in XCCDF with OVAL checks).
2. A SCAP-capable scanner loads the content and evaluates each system.
3. The scanner reports pass or fail per rule in a standard format.
4. Results flow to dashboards, tickets and audits; failed rules show drift from the baseline.

The current release is SCAP 1.4 (NIST SP 800-126 Rev. 4, final in June 2026), which prefers CVSS v4.0 for new content while still supporting v3.1.

**Why it matters:** without a common format, each tool checks and names things differently and results cannot be compared. SCAP makes "are all 4,000 servers compliant with the baseline?" a repeatable, automated question.

**Common confusions:** SCAP is the protocol suite; a benchmark is the content; a scanner is the tool. SCAP does not fix anything; it measures. CVE and CVSS exist independently and are used by SCAP, not owned by it.

**Scenario:** An agency needs to check every server against a published hardening guide automatically, with results comparable across two different scanning products. The answer is SCAP content run by SCAP-validated tools. Manual checklists are the closest wrong answer: they measure the same thing but neither scale nor compare reliably.

### Security benchmarks (CIS Benchmarks and DISA STIGs)
A benchmark is a published set of recommended secure configuration settings for a specific operating system, application, cloud service or device. NIST SP 800-70 uses the term security configuration checklist and lists lockdown guide, hardening guide, security technical implementation guide (STIG) and benchmark as names for the same kind of document: instructions for configuring a product securely and for verifying that it is configured that way. Benchmarks are the content that baselines are built from and that monitoring checks against.

Common sources:
- **CIS Benchmarks**, from the Center for Internet Security: prescriptive configuration recommendations for more than 25 vendor product families, produced through a consensus process among security experts worldwide. They cover operating systems, cloud providers, network devices, server and desktop software and mobile devices.
- **DISA STIGs**, Security Technical Implementation Guides published by the US Defense Information Systems Agency, with recommended settings per product.
- **Vendor hardening guides** from the product's maker.
- The US National Checklist Program repository, which collects checklists from many sources.

How benchmarks are used:
1. **Select** the benchmark for the exact product and version.
2. **Tailor** it: some recommended settings break business functions, so exceptions are documented.
3. **Adopt** the tailored result as the organization's secure baseline.
4. **Deploy** the settings centrally.
5. **Check continuously**, often with tools that read the benchmark as SCAP (Security Content Automation Protocol) content, and report each rule as pass or fail.

**Why it matters:** a benchmark saves an organization from inventing hundreds of settings itself and gives auditors a recognized standard to measure against. Checklists also age: NIST notes they can become outdated as software is updated.

**Common confusions:** A benchmark is guidance published by an outside body; a baseline is your approved configuration, usually derived from a benchmark. A benchmark is content, SCAP is the format and protocol, and a scanner is the tool. Scoring 100% against a benchmark shows compliance with that document, not immunity to attack.

**Scenario:** A team must prove its Linux servers follow a recognized hardening standard and show which settings fail. The answer is assessing them against a published benchmark (for example a CIS Benchmark) with an automated compliance scan. A vulnerability scan for missing patches is the closest wrong answer: it finds known flaws, not whether hardening settings match the standard.

Mini-example of a benchmark check result: `Rule: Ensure SSH root login is disabled | Expected: PermitRootLogin no | Found: yes | Result: Fail`.

### Agent-based vs agentless monitoring
Monitoring tools collect data in two ways. Agent-based collection installs a small program on each system that gathers data locally and sends it in. Agentless collection gathers data remotely, over the network or through management interfaces and application programming interfaces (APIs), with nothing installed on the monitored system. The choice affects depth, coverage and upkeep for SIEM (security information and event management) collection, vulnerability scanning, endpoint protection and network access control.

| Feature | Agent-based | Agentless |
|---|---|---|
| Installed on the system | Yes | No |
| Depth of data | High: processes, files, local settings, real-time events | Lower: what remote queries, logs and flows expose |
| Works off the corporate network | Yes, reports when it reconnects or over the internet | Usually no; needs network reach to the system |
| Upkeep | Deploy, update and troubleshoot agents everywhere | Manage credentials and network access for remote collection |
| Load | Uses some resources on each host | Load falls on the network and the collector |
| Best for | Laptops, servers, anything needing deep or continuous visibility | Network devices, appliances, IoT, legacy and vendor-locked systems, cloud services through APIs |

How to choose: if the device can run software and needs deep, continuous monitoring, use an agent. If it cannot run an agent (a switch, a printer, a controller) or you may not install software on it, go agentless with syslog, Simple Network Management Protocol (SNMP), flow data, remote scans or APIs. Most organizations use both.

Network access control adds two agent terms: a persistent agent stays installed; a dissolvable agent runs once for a posture check and removes itself.

**Why it matters:** a monitoring plan that assumes agents everywhere leaves network gear and embedded devices invisible; one that avoids agents entirely misses what happens on roaming laptops.

**Common confusions:** Agentless does not mean "no access needed"; it usually needs credentials or an API key, which must be protected. An agent is not automatically more secure; it is more detailed, and itself needs patching. Credentialed scanning is agentless (it logs in remotely).

**Scenario:** Remote sales laptops are off the corporate network for weeks and must still report security events. The answer is agent-based monitoring. Agentless collection is the closest wrong answer, because the collector cannot reach laptops that are not on the network.

### Security information and event management (SIEM)
A security information and event management (SIEM) system collects logs and events from across the organization, normalizes them, correlates them to find suspicious patterns, raises alerts, and provides dashboards, reports and retention. NIST describes a SIEM tool as an application that gathers security data from system components and presents it as actionable information through a single interface. It is a detective technical control and the central workbench of a security operations center.

What a SIEM does, in order:
1. **Collect and aggregate** logs from endpoints, servers, network devices, security tools, applications and cloud services, by agents, syslog or APIs.
2. **Normalize**: parse different formats into common fields, with synchronized times.
3. **Enrich**: add asset owner, user identity, threat intelligence matches.
4. **Correlate**: link events across sources and time. One failed login is nothing; 200 failures across 50 accounts from one address followed by a success is a password spray.
5. **Alert** by severity, to analysts or automation.
6. **Visualize and report**: dashboards, trends, compliance reports.
7. **Retain** data for investigations and legal requirements.

Correlation across many sources is the defining feature. A SIEM needs tuning, good time synchronization and complete log sources to be useful.

**Why it matters:** attacks span systems. A phishing click (email gateway), a new process (endpoint) and a connection to a bad address (firewall) look unrelated in three consoles; a SIEM joins them into one incident.

**Common confusions:** A SIEM detects and informs; SOAR (security orchestration, automation and response) acts on alerts with playbooks. A log server stores logs; a SIEM analyzes them. A SIEM does not block traffic the way an intrusion prevention system does. NetFlow and SNMP (Simple Network Management Protocol) are data sources a SIEM can use, not competitors to it.

**Scenario:** An analyst needs one alert that ties a user's VPN login from abroad, a mass file download and a new mail-forwarding rule together. The tool is a SIEM. An intrusion detection system is the closest wrong answer: it watches network traffic for attack patterns and would not link identity, file and mailbox events.

Mini-example of a correlation rule: `IF 10+ failed logins for one account in 5 min AND then a successful login from the same source THEN alert "possible brute-force success", severity High`.

### Antivirus (monitoring tool)
Antivirus (also called anti-malware) software detects, blocks and removes malicious software on endpoints and servers and reports detections centrally. It is a preventive, detective and corrective technical control at the host. NIST SP 800-83 recommends centrally managed antivirus on every host for which suitable software exists.

How it detects:
1. **Signatures**: patterns of known malware. Fast and accurate for known threats, blind to new or modified ones until the signature arrives.
2. **Heuristics**: rules that flag code with suspicious traits (for example a program that unpacks itself and writes to startup locations), catching variants without an exact signature.
3. **Behavior monitoring**: watching what a program does when it runs (mass file encryption, injecting into other processes).
4. **Reputation and cloud lookups**: checking how common and trusted a file is.

What it does on detection: block execution, disinfect (remove the malware from a file) or quarantine the file (store it in isolation for later examination), then alert. Detections should flow to central monitoring such as a SIEM (security information and event management), where a burst of detections across machines is a signal of its own.

How to run it: deploy everywhere supported, keep signatures and the engine updated automatically, scan on access and on a schedule, prevent users from disabling it, and review alerts.

**Why it matters:** commodity malware is still the most common threat to ordinary users, and antivirus stops most of it cheaply. Its alerts are also an early warning that a phishing campaign is landing.

**Common confusions:** Antivirus focuses on malicious files and known bad behavior; endpoint detection and response (EDR) records detailed activity and supports investigation and response, catching attacks that use legitimate tools. Signature-based detection cannot catch a brand-new (zero-day) sample. Antivirus is not data loss prevention: it looks for malware, not for sensitive data leaving.

**Scenario:** A new ransomware variant with no existing signature runs on a laptop and is stopped only when it starts encrypting many files. The detection method that caught it is behavior monitoring (behavior-based detection). Signature-based detection is the closest wrong answer, because no signature existed yet.

### Data loss prevention (DLP) as a monitoring tool
Data loss prevention (DLP) finds sensitive information and watches where it goes, so it can alert on or block movement that breaks policy. A US government glossary describes DLP as a capability that detects and prevents unauthorized use and transmission of sensitive information by monitoring data in use on endpoints, in motion on networks and at rest in storage, using deep content inspection and the context of each transaction, managed centrally. In objective 4.4 the focus is DLP as a source of alerts; configuring DLP policies is covered in `### DLP policy configuration (enterprise capability)`.

The three data states it watches:
1. **Data in use**: on endpoints, as people work: copy to USB, print, paste into a web form, screenshot.
2. **Data in motion**: crossing the network: email, web uploads, file transfers, cloud sync.
3. **Data at rest**: stored on file shares, databases, laptops and cloud storage; DLP discovery scans find sensitive data sitting where it should not be.

How it recognizes sensitive data: pattern matching (card or national ID number formats, often with checksum validation), keywords and dictionaries, document fingerprints (hashes of known sensitive files or parts of them), classification labels, and context (who, to where, how much).

What it produces for monitoring: alerts such as "user uploaded 400 records containing card numbers to a personal cloud drive", which feed the SIEM (security information and event management) and incident response.

**Why it matters:** many breaches are data leaving by ordinary channels: an email to the wrong person, a personal cloud account, a departing employee's USB drive. Other tools see "a file moved"; DLP sees "customer card data moved".

**Common confusions:** DLP is about data, not malware; antivirus is about malware, not data. Encryption protects data from being read; DLP controls where it goes, and encrypted traffic can blind network DLP unless it is inspected or checked at the endpoint. DLP alerts need tuning like any others, because patterns match innocent numbers too.

**Scenario:** A monitoring team must be alerted when files containing patient identifiers are copied to removable drives. The tool is endpoint DLP (data in use). A SIEM alone is the closest wrong answer: it can show that a file was copied if that is logged, but it does not inspect the content to know it held patient identifiers.

### Simple Network Management Protocol (SNMP) traps
Simple Network Management Protocol (SNMP) is the standard way to monitor and manage network devices such as routers, switches, firewalls, printers and uninterruptible power supplies. An SNMP trap is an unsolicited message a device's SNMP agent pushes to the management station the moment a defined event happens, such as a link going down, a fan failing or a threshold being crossed. Traps are a detective monitoring feature for infrastructure, supporting availability and security alerting.

How SNMP monitoring works:
1. **Polling (pull)**: the management station asks each device for values at intervals (interface counters, CPU, temperature). Reason: steady measurement and trends. Weakness: an event between polls is seen late.
2. **Traps (push)**: the device sends a notification immediately when an event occurs, without being asked. Reason: speed.
3. **Inform messages**: like traps, but the receiver acknowledges them, so the sender knows they arrived.
4. The station turns traps into alerts, tickets or SIEM (security information and event management) events.

Polling goes to the device on UDP 161; traps go to the manager on UDP 162 (see the Reference chapter for port tables).

Versions matter for security:
- **SNMPv1 and SNMPv2c** use a community string, a shared word sent in clear text that acts like a password. Anyone who captures it can read device data, and with the write community can change settings. Treat both as legacy for security purposes.
- **SNMPv3** adds user-based security with three levels: no authentication and no privacy, authentication without privacy, and authentication with privacy (encryption). Use the authentication-with-privacy level.

**Why it matters:** an immediate trap for "core link down" or "power supply failed" can be the difference between a quick fix and an outage. Insecure SNMP, on the other hand, hands attackers a map of the network and sometimes the ability to reconfigure it.

**Common confusions:** A trap is device-initiated; a poll is manager-initiated. A trap is a small event notice, not a log stream (that is syslog) and not traffic data (that is NetFlow). Changing the default community string "public" is necessary on old devices but is not encryption.

**Scenario:** A switch must notify the monitoring station the instant an uplink fails, not at the next five-minute check. The answer is an SNMP trap. SNMP polling is the closest wrong answer, because it would notice only at the next poll.

Mini-example of a received trap: `Trap from 10.0.0.12 | linkDown | ifIndex 24 (uplink to core) | received 03:12:41`.

### NetFlow (and IPFIX flow records)
NetFlow is a protocol, originally from Cisco, in which routers, switches and firewalls summarize the traffic passing through them into flow records and export those records to a collector. A flow is a set of packets passing an observation point that share common properties, typically source and destination addresses, source and destination ports and protocol. NetFlow records who talked to whom, when, on which ports and how much, without the content. IP Flow Information Export (IPFIX) is the IETF standard that grew from NetFlow version 9. Flow data is a detective monitoring source for infrastructure.

How it works:
1. **Exporter**: a network device with NetFlow enabled watches packets at an observation point and builds flow records.
2. **Export**: when a flow ends or a timer expires, the record is sent to the collector, commonly over UDP. Busy devices may sample (record one packet in many) to save resources.
3. **Collector**: receives, stores and optionally aggregates the records.
4. **Analysis**: tools query the records to show top talkers, unusual destinations, traffic by protocol, and changes from the baseline.

What flow data is good for: building a baseline of normal traffic; spotting data exfiltration (a workstation sending 20 GB to an unfamiliar address overnight); detecting scanning, worm spread and denial-of-service traffic; confirming whether a compromised host talked to other internal systems; capacity planning.

**Why it matters:** full packet capture of a large network is too expensive to keep for long. Flow records are small enough to keep for months and still answer most "who talked to whom" questions, even when the traffic itself was encrypted.

**Common confusions:** NetFlow is metadata, not packet contents; it cannot show what was in the file that left. It is not a log of device events (syslog) and not device health alerts (SNMP traps). Sampling means small flows can be missed. A packet capture shows contents but for a short time and a small part of the network.

**Scenario:** An analyst must find which internal host sent a large volume of data to an outside address last Tuesday night; no packet capture exists. The answer is NetFlow records. SNMP is the closest wrong answer: interface counters would show that traffic volume rose on a link, but not which host talked to which address.

Mini-example of a flow record: `10.4.7.21:50233 -> 198.51.100.9:443 | TCP | start 01:02:11 | duration 3,412 s | 20.4 GB | 14.1 M packets`.

### Vulnerability scanners (monitoring tool)
A vulnerability scanner is the tool that automatically probes systems, network devices and applications for known vulnerabilities, missing patches and misconfigurations, and reports findings with severity ratings, usually mapped to CVE (Common Vulnerabilities and Exposures) identifiers and CVSS (Common Vulnerability Scoring System) scores. As a monitoring tool it runs on a schedule and feeds alerts and trend reports; the scanning activity itself and its analysis are covered in `### Vulnerability scan (identification method)`. It is a detective technical control.

What a scanner does, per NIST SP 800-115: identifies hosts and their attributes (operating system, applications, open ports) and then attempts to identify vulnerabilities, including outdated software versions, missing patches and misconfigurations, and can check compliance with security policy.

Types of scanners:
1. **Network (infrastructure) scanners**: hosts and network devices, with or without credentials.
2. **Web application scanners**: flaws in web applications (a dynamic testing tool).
3. **Cloud and container scanners**: images, configurations and cloud resources.
4. **Compliance scanners**: settings against a benchmark, often reading SCAP (Security Content Automation Protocol) content.

How it fits monitoring:
1. Scans run on a schedule (for example weekly) and after significant changes.
2. Plugin or vulnerability data updates before each run.
3. New critical findings create alerts or tickets.
4. Dashboards show trends: open findings by severity and age.
5. Results still need confirmation, because scanners produce false positives and their severity labels can differ between products.

**Why it matters:** new vulnerabilities are published every day, so a system that was clean last month may be exposed today without anything on it changing. Regular scanning is how monitoring notices.

**Common confusions:** A scanner identifies; it does not exploit (a penetration test does) and does not fix (patch management does). A scanner is not an intrusion detection system: it looks for weaknesses, not for attacks in progress. A port scanner lists open ports; a vulnerability scanner goes on to match what it finds against known flaws.

**Scenario:** Management wants a weekly view of which servers have newly published critical flaws. The tool is a vulnerability scanner on a schedule with updated plugins. A SIEM is the closest wrong answer: it analyzes events that happened, not which weaknesses exist.

### SIEM vs NetFlow vs SNMP traps vs syslog (monitoring data sources compared)
These monitoring terms are confused because all of them "send data to a central place". The decisive question is what kind of data each carries. SIEM means security information and event management; SNMP means Simple Network Management Protocol.

| Tool or source | What it carries | Who starts it | Answers | Does not show |
|---|---|---|---|---|
| Syslog | Log messages: events a system or device recorded | The device, continuously | What happened on this device, in its own words | Traffic volumes, relationships across devices |
| SNMP polling | Device values: counters, health, status | The manager, at intervals | How is this device doing now, and over time | Events between polls, traffic endpoints |
| SNMP trap | A short notice of one event | The device, immediately | Something just happened (link down, threshold crossed) | Detail beyond the event; traffic |
| NetFlow / IPFIX | Flow metadata: addresses, ports, protocol, times, bytes | The network device, as flows end | Who talked to whom, when and how much | Packet contents |
| Packet capture | Full packets, including contents | A sensor or analyst | Exactly what was sent | Long history (too large to keep) |
| SIEM | All of the above, combined | Collects from every source | What do these events mean together | Nothing by itself; it depends on its sources |

IPFIX means IP Flow Information Export, the standard form of flow export.

How to pick in a scenario: "immediate device fault notice" is a trap; "who sent 20 GB where" is NetFlow; "what did the server record at 02:13" is its log through syslog; "one alert from many sources" is the SIEM; "what was inside the transfer" needs packet capture.

**Why it matters:** choosing the wrong source wastes investigation time. Flow data cannot show file contents, and a trap cannot tell you who logged in.

**Common confusions:** A SIEM is an analysis platform, not a data type. NetFlow does not replace logs; it complements them. SNMP traps and syslog both push from the device, but a trap is a structured management event while syslog is a general log stream.

**Scenario:** Clue: "correlate firewall logs, endpoint alerts and directory events": SIEM. Clue: "baseline traffic volumes between sites without capturing content": NetFlow. Clue: "UPS on battery, notify now": SNMP trap.

### Antivirus vs EDR vs XDR vs SIEM vs DLP (detection tools compared)
Several tools raise security alerts from different vantage points. Knowing what each looks at decides the right one for a scenario. EDR means endpoint detection and response; XDR means extended detection and response; SIEM means security information and event management; DLP means data loss prevention.

| Tool | Looks at | Detects by | Can respond? | Decisive feature |
|---|---|---|---|---|
| Antivirus | Files and programs on one host | Signatures, heuristics, behavior | Blocks, disinfects, quarantines files | Malware focus; little investigation data |
| EDR | Detailed activity on endpoints (processes, network, logins, file and registry changes) | Behavior analysis over recorded telemetry | Isolate host, stop process, quarantine file | Records endpoint history for investigation |
| XDR | Endpoints plus email, identity, cloud apps, network | Correlation across those sources | Coordinated actions across products | One incident view across domains, from one vendor ecosystem |
| SIEM | Logs and events from any source | Correlation rules and analytics | Alerts; acts only through SOAR or integrations | Broadest collection, long retention, compliance reporting |
| DLP | Content of data in use, in motion, at rest | Patterns, fingerprints, labels, context | Block, encrypt, quarantine, alert | Knows what the data is |

SOAR means security orchestration, automation and response.

How they work together: antivirus and EDR protect each endpoint; XDR or the SIEM joins signals; DLP watches the data itself; all send alerts to the SIEM for a single queue and record.

**Why it matters:** buying or naming the wrong tool leaves the actual gap open: antivirus will not explain how an attacker moved between machines, and a SIEM will not stop a file from being copied to USB.

**Common confusions:** XDR is not just "a bigger EDR"; its point is correlation across endpoint, email, identity and cloud. SIEM and XDR overlap, but a SIEM takes any log source and keeps it long term, while XDR is tighter and more automated within its integrated products. DLP is the only one of the five whose subject is the data rather than the threat.

**Scenario:** Clue: "replay everything a compromised laptop did over the last month and isolate it": EDR. Clue: "block spreadsheets with card numbers going to personal email": DLP. Clue: "known malware file blocked at download": antivirus. Clue: "one incident joining a phishing email, a token theft and a cloud app login": XDR.

## 4.5 Modifying enterprise capabilities to enhance security
Depth asked: apply in a scenario. A good answer picks the capability that fits the problem, states the exact change to make (a rule, a record, a policy), and says why the nearest alternative would not solve it.

### Firewall rules (rule order, first match and implicit deny)
A firewall rule is one statement that allows or denies traffic based on conditions: source, destination, port or service, protocol and, on newer firewalls, application and user. The set of rules (the ruleset or policy) decides what crosses between networks or reaches a host. Firewalls are preventive technical controls, mostly at the network and transport layers, and tuning their rules is the most common way to "modify" this capability.

How rules are evaluated on a typical firewall:
1. A packet (or new connection) arrives.
2. The firewall compares it with rules from the top of the list down.
3. **The first rule that matches is applied**, and checking stops.
4. If nothing matches, the traffic is denied by the final implicit deny.

Consequences:
- **Order matters.** A specific rule must sit above a broader rule that would match the same traffic, or it never takes effect (a shadowed rule).
- **Deny by default.** NIST SP 800-41 Rev. 1 recommends blocking all inbound and outbound traffic that is not expressly permitted. Outbound (egress) filtering matters too; it limits what malware inside can reach.
- **Least privilege for traffic.** Each allow rule should name the narrowest source, destination and service that works; avoid "any".
- **Products differ.** NIST notes that rule handling varies by product, and that on firewalls that check rules in sequence, rules matching the most traffic should be as high as correct ordering allows, for performance.

Maintenance: review rules regularly, remove unused and temporary ones, document the business reason and owner of each, log denied and sensitive allowed traffic, and change rules only through change management.

**Why it matters:** one misplaced "allow any" above a deny silently opens a path for years. Most firewall failures are rule mistakes, not product flaws.

**Common confusions:** Implicit deny is automatic at the end; an explicit deny is a rule you write, often to log the traffic. A stateful firewall tracks connections, so the reply to an allowed request is permitted without a separate rule. Network address translation hides addresses but is not a security policy.

**Scenario:** A new rule denying the guest network access to the finance server never shows any hits, and guests can still reach it. The cause is a broader allow rule above it; the fix is moving the deny above that rule. Adding a second copy of the deny at the bottom is the closest wrong answer, because first match wins.

Mini-example ruleset: `1 allow tcp 10.1.0.0/16 -> 10.9.9.5 port 443` then `2 deny ip 10.50.0.0/24 -> 10.9.0.0/16 log` then `3 allow ip 10.50.0.0/24 -> any` then `(implicit) deny any any`. Swapping rules 2 and 3 would let the guest range reach 10.9.0.0/16.

### Access control lists (ACLs) on firewalls and routers
An access control list (ACL) is an ordered list of permit and deny entries applied to a router or firewall interface in a direction (inbound or outbound). Each entry matches packets by fields such as source and destination address, protocol and port. ACLs are the basic packet filter: a preventive technical control at the network and transport layers.

How an ACL works:
1. The ACL is attached to an interface and a direction.
2. Each packet crossing that interface in that direction is compared with the entries from the top down.
3. The first matching entry decides: permit or deny.
4. A packet that matches nothing is dropped by the implicit deny at the end.

Design rules:
- **Specific before general**, as with any first-match list.
- **Place filters close to where they help most**: filtering unwanted traffic near its source saves the network from carrying it.
- **Classic router ACLs are stateless**: each packet is judged alone, so return traffic needs its own entry. Stateful firewalls track connections instead; NIST describes stateful inspection as tracking connection state and blocking packets that do not fit it.
- **Protect the device itself**: an ACL limiting who may reach the management interface is a standard hardening step.

NIST SP 800-41 calls filtering inbound traffic ingress filtering and filtering outgoing traffic egress filtering.

**Why it matters:** ACLs are everywhere (routers, switches, cloud security groups and network ACLs). A wrong entry either blocks business traffic or silently exposes an internal network.

**Common confusions:** In this objective "access list" means a network packet filter, not a file permission list, which is also called an ACL. An ACL is a mechanism; a firewall rule is the same idea on a firewall, often with state and application awareness added. Stateless filtering cannot tell a reply from an unsolicited packet unless the entry accounts for it.

**Scenario:** An administrator adds `deny tcp any host 10.2.2.10 eq 23` at the end of an ACL that begins with `permit ip any any`. Telnet still works because the first entry matches everything. The fix is to place the deny above the broad permit. Applying the same ACL to another interface is the closest wrong answer; order, not location, is the fault.

### Ports and protocols in firewall policy
Firewalls filter by transport protocol (TCP, UDP, ICMP and others) and by port number, which identifies the service a connection is aimed at. Modifying this capability means allowing only the ports and protocols the business needs and blocking the rest, in both directions. It is a preventive technical control at the transport layer. Exact port numbers live in the Reference chapter's tables; this section covers how to reason about them.

How to decide what to allow:
1. **List the services** each zone must offer or use (for example a web server offers HTTPS; clients use DNS and HTTPS outbound).
2. **Allow the secure version's port and block the insecure one** (HTTPS in, plain HTTP redirected or blocked; SSH for management, Telnet blocked).
3. **Scope by source and destination**, not only by port: remote desktop to servers only from the admin jump host, never from the internet.
4. **Block management and file-sharing services at the internet edge** (remote desktop, SMB file sharing, database ports, SNMP).
5. **Filter outbound too**: let only mail servers send mail outbound; let clients resolve DNS only through the company resolvers.
6. **Log and review** what the rules allow.

Limits of port filtering: a port number is only a convention. Any service can run on any port, and malware often uses the HTTPS port because it is always open. A next-generation firewall (NGFW) identifies the actual application and user regardless of port, and can inspect content.

**Why it matters:** every open port is a reachable service that must be patched, configured and monitored. Internet-exposed remote desktop and file sharing are among the most common ways ransomware gets in.

**Common confusions:** Blocking a port does not make the service secure; it makes it unreachable from that side. Moving a service to an unusual port hides it from casual scans only. TCP is connection-oriented and UDP is not, which is why firewalls track UDP "state" by timers.

**Scenario:** Web servers in a public zone need to be reachable by customers, and administrators manage them from an internal subnet. The rule set is: allow HTTPS from any to the servers; allow SSH to the servers only from the admin subnet; deny everything else. Allowing SSH from any source "because it is encrypted" is the closest wrong answer: encryption does not stop password guessing or exploitation of the service.

### Screened subnet (formerly DMZ)
A screened subnet is a separate network zone placed between the internet and the internal network to hold systems that outsiders must reach, such as web servers, mail relays, public DNS servers, reverse proxies and VPN gateways. The older name is demilitarized zone (DMZ). Firewalls screen traffic on both sides, so the public can reach only those servers and a compromised public server cannot freely reach internal systems. It is a preventive architectural control (segmentation).

Two common designs:
1. **Three-legged (single firewall)**: one firewall with three interfaces: outside, screened subnet, inside. NIST describes a DMZ as an interface on a routing firewall where traffic between it and the protected side still passes through the firewall's policy.
2. **Back-to-back (two firewalls)**: an outer firewall between the internet and the screened subnet, an inner firewall between the screened subnet and the internal network. More isolation, and using different products means one flaw does not defeat both.

The traffic rules:
- Internet to screened subnet: only the published services.
- Internet to internal: denied.
- Screened subnet to internal: denied by default; allow only specific needed flows (for example the web server to one database port on one server).
- Internal to screened subnet: administration from defined hosts.

**Why it matters:** public servers are the systems most likely to be compromised. The screened subnet turns "attacker owns the web server" from "attacker is inside the network" into "attacker is in a small zone with almost no way out".

**Common confusions:** A screened subnet is not the internal network with a public address; it is a separate, filtered zone. It is not a guest network. Servers in it still need hardening and patching; the zone limits damage, it does not prevent compromise. An intranet server does not belong there.

**Scenario:** A company wants to publish a customer portal while keeping its database unreachable from the internet. The answer is to put the portal's web server in a screened subnet and allow only that server to reach the database port on the internal database. Placing the web server on the internal network with a port forward is the closest wrong answer: a compromise would land directly inside.

### IDS and IPS (intrusion detection and prevention systems)
An intrusion detection system (IDS) watches network traffic or host activity for signs of attack and alerts. An intrusion prevention system (IPS) does the same and can also stop the activity. The decisive difference is placement and action: an IDS typically observes a copy of traffic out of band and alerts; an IPS sits inline, so traffic passes through it and it can drop or reset malicious connections. An IDS is a detective control; an IPS is preventive as well.

How detection works (NIST SP 800-94):
1. **Signature-based**: compare activity with patterns of known threats. Very effective for known threats, largely ineffective against unknown ones, evasion techniques and many variants.
2. **Anomaly-based**: compare activity with a profile of normal behavior built over a training period, flagging significant deviations. Can catch previously unknown attacks, but produces more false positives and can absorb malicious activity into the baseline if it is present during training.
3. **Stateful protocol analysis**: compare activity with vendor-built profiles of how each protocol should behave, flagging unexpected command sequences.

Types by location: network-based (NIDS/NIPS) monitor traffic for a network segment; host-based (HIDS/HIPS) monitor one host's events, files and processes; wireless versions watch radio traffic.

Modifying the capability:
- Update signatures regularly.
- Tune rules to cut false positives without creating false negatives.
- Start an IPS in detection-only mode, review what would have been blocked, then enable blocking rule by rule. Reason: an inline false positive blocks legitimate business traffic.
- Decrypt or place sensors where traffic is readable, since encrypted traffic hides content from network sensors.

**Why it matters:** firewalls decide by address and port; an IPS looks at what the allowed traffic actually does, catching exploits aimed at permitted services.

**Common confusions:** A passive IDS cannot block by itself. An IPS false positive causes an outage; an IDS false positive causes only an alert. An IPS is not a firewall replacement; they complement each other.

**Scenario:** A company wants exploit attempts against its public web server stopped automatically, not only reported. The answer is an inline IPS (or enabling prevention mode). An IDS on a mirror port is the closest wrong answer: it would alert while the attack continues.

### IDS/IPS signatures and trends
Two things an administrator works with daily on an intrusion detection system (IDS) or intrusion prevention system (IPS) are signatures and trends. A signature is a pattern that corresponds to a known threat; the system compares observed events against its signature list. Trends are the patterns in detections over time, usually on dashboards, used to spot campaigns and to decide where to tune or strengthen defenses.

**Signatures**, how to manage them:
1. **Update often**: a signature exists only after a threat is known, so new attacks are missed until an update arrives.
2. **Enable what applies**: turn off signatures for software you do not run, to save processing and reduce noise.
3. **Tune noisy ones**: adjust thresholds or exclude known-good sources.
4. **Write custom signatures** for threats specific to your environment; NIST SP 800-83 notes a custom signature identifying infected hosts is often highly effective during an outbreak.
5. **Choose the action** per signature on an IPS: alert only, or block.

NIST SP 800-94 describes signature detection as the simplest method, very effective against known threats and largely ineffective against unknown ones, disguised ones and many variants. Anomaly-based detection, by comparing with a baseline of normal activity, can catch new attacks at the cost of more false positives.

**Trends**, what to look for:
- A signature that suddenly fires far more than usual (a new campaign or a new false positive).
- The same source probing many targets over days (slow reconnaissance).
- A rise in one attack type against one system (it may be newly exposed or vulnerable).
- Alerts moving from outside sources to inside sources (possible compromise spreading).
- Drops to zero (a sensor may be down or blind).

**Why it matters:** single alerts are easy to dismiss. A trend, such as login attacks against the VPN rising week after week, justifies action such as adding multifactor authentication or blocking a region.

**Common confusions:** A signature is not the same as an antivirus definition, though the idea is alike; IDS signatures match network or host activity. Signature-based detection misses zero-day attacks; anomaly detection may catch them. A trend is an analysis of many events, not a detection method.

**Scenario:** After a new exploit is announced, the IPS shows nothing even though attempts are likely. The first action is updating signatures (and, if none exists yet, writing a custom one or relying on anomaly detection). Lowering all alert thresholds is the closest wrong answer: it floods analysts without adding the missing pattern.

Mini-example of a signature in plain words: `alert tcp any -> web servers port 443: request contains "${jndi:" -> severity High, action drop`.

### Signature-based vs anomaly-based (behavior-based) detection
Detection tools, including intrusion detection and prevention systems (IDS/IPS), antivirus and endpoint tools, find threats in two basic ways. Signature-based detection matches known bad patterns. Anomaly-based detection, often called behavior-based, flags activity that departs from a learned baseline of normal.

| Feature | Signature-based | Anomaly-based (behavior-based) |
|---|---|---|
| Compares activity with | A list of patterns of known threats | A profile of normal activity built during a training period |
| Catches known attacks | Very well, with few false positives | Yes, if they look abnormal |
| Catches new (zero-day) attacks | No, until a signature exists | Possibly, because they deviate from normal |
| False positives | Lower | Higher: unusual but legitimate activity triggers alerts |
| Upkeep | Frequent signature updates | Building and refreshing baselines, tuning |
| Known weakness | Variants and evasion slip past | Malicious activity present during training becomes "normal" |

NIST SP 800-94 adds a third method, stateful protocol analysis, which compares traffic with vendor-defined profiles of how protocols should behave. Most products combine methods for accuracy.

How to choose in a scenario: "known malware or exploit" points to signatures; "never seen before", "unusual for this user or host" or "deviation from baseline" points to anomaly or behavior detection; "too many false alarms after deploying a baseline tool" points to tuning the anomaly profile.

**Why it matters:** an organization relying only on signatures is blind to new attacks; one relying only on anomalies drowns in alerts. Knowing the trade-off guides tuning and purchases.

**Common confusions:** Heuristic detection uses rules about suspicious traits; it sits between the two and is usually grouped with behavior-based methods. Anomaly detection does not need to know the attack, only what normal looks like. Signature updates do not help anomaly detection.

**Scenario:** A file server that normally sends a few megabytes a day begins sending gigabytes to an outside address using an allowed protocol; no known exploit is involved. The detection type that catches it is anomaly-based. Signature-based is the closest wrong answer, because there is no known pattern to match.

### Web filter deployment: agent-based vs centralized proxy
A web filter controls which websites and web content users can reach, blocking malicious and disallowed sites. It is a preventive technical control (with detective logging) at the application layer. The first design choice is where filtering happens: in an agent on each device, or at a central proxy that traffic passes through.

| Feature | Agent-based | Centralized proxy |
|---|---|---|
| Where it runs | Software on each device | A server or cloud service in the traffic path |
| Works off the corporate network | Yes, wherever the device goes | Only if traffic is routed to it (VPN or cloud proxy) |
| Management | Install and update on every device | One place to set policy and collect logs |
| Unmanaged devices (guests, IoT) | Not covered | Covered if their traffic passes through |
| HTTPS inspection | Can see at the endpoint | Needs TLS decryption with a trusted certificate on clients |

How a proxy works:
1. The client's web request goes to the proxy, either because the browser is configured to use it (explicit proxy) or because the network redirects traffic to it without client settings (transparent proxy).
2. The proxy checks the request against policy (URL, category, reputation, user or group).
3. If allowed, the proxy fetches the content for the client, may scan it and may cache it; if not, it returns a block page.
4. Every request is logged.

To inspect HTTPS, the proxy must decrypt Transport Layer Security (TLS): it presents its own certificate to the client, which must trust the organization's certificate authority. That has privacy implications, and sensitive categories such as banking and health are often exempted.

How an agent works: software on the device enforces the same policy locally and reports centrally. Microsoft's endpoint web content filtering, for example, blocks categories on managed devices whether users are on the company network or away.

**Why it matters:** with remote work, a filter that exists only at the office protects nobody at home. The deployment model decides who is actually covered.

**Common confusions:** A forward proxy filters users' outbound requests; a reverse proxy sits in front of servers and protects them. A proxy is not a firewall, although next-generation firewalls include web filtering. Agent-based filtering does not cover devices you cannot install software on.

**Scenario:** Remote laptops must be web filtered at home and in hotels, without sending all traffic back through the office. The answer is agent-based web filtering (or a cloud proxy enforced by an agent). An on-premises centralized proxy is the closest wrong answer, because home traffic never passes through it.

### Web filter techniques: URL scanning, categorization, block rules, reputation
Whatever the deployment, a web filter decides with four techniques, usually combined. URL scanning checks the requested address. Content categorization groups sites by type so policy can be set per category. Block rules are the explicit denials an administrator writes. Reputation scores a site by its history and traits. The published SY0-701 acronym list writes URL as Universal Resource Locator; the standard name is Uniform Resource Locator.

How each works:
1. **URL scanning**: the requested address (domain, path, parameters) is compared with lists of known malicious, phishing or disallowed addresses and may be analyzed for suspicious traits, such as look-alike domains. With HTTPS, a filter sees only the host name unless it decrypts the traffic or runs at the endpoint.
2. **Content categorization**: the vendor classifies sites into categories (for example gambling, adult content, social networking, streaming media, illegal software, newly registered domains). Policy then allows, blocks or only audits each category for each group of users. New sites may not be categorized yet, and miscategorized sites need a manual override or a dispute with the vendor.
3. **Block rules**: explicit denials for specific URLs, domains, categories or file types, optionally for specific users or groups, alongside allow rules for exceptions. Custom allow entries normally take precedence over category blocks.
4. **Reputation**: a risk score from a site's age, hosting history, past malware or spam and links to bad infrastructure. A low-reputation site can be blocked or warned about even though no list names it yet.

How to modify the capability: block malicious and high-risk categories for everyone; block newly registered and uncategorized domains where the business allows, or at least for high-risk users; add specific block rules for known bad sites from threat intelligence; document every exception; review reports for trends and for attempts to reach blocked content.

**Why it matters:** most malware delivery and credential theft starts with a web link. Static lists miss sites created an hour ago; reputation and category rules such as "newly registered" catch them.

**Common confusions:** Categorization is about what kind of site it is; reputation is about how trustworthy it is. A block rule is the policy action; scanning, categorization and reputation supply the facts it uses. A web filter inspects web requests, while DNS filtering stops name resolution for any application.

**Scenario:** Users are being sent to phishing pages on domains registered the same morning, which no blocklist contains yet. The setting to change is reputation filtering together with blocking the newly registered domains category. Adding each domain to a block rule is the closest wrong answer: it is always one step behind.

### Group Policy (Windows operating system security)
Group Policy is the Windows feature for central management of operating system, application and user settings. With Active Directory (AD), settings are stored in Group Policy Objects (GPOs) linked to sites, domains or organizational units (OUs), and every computer and user in that scope receives them. It is a preventive technical control and the main way Windows secure baselines are deployed and kept in place.

How it works:
1. An administrator creates a GPO with settings in two halves: computer configuration (applies to the machine, for example firewall rules) and user configuration (applies to whoever signs in).
2. The GPO is linked to a site, domain or OU (organizational unit).
3. Computer policy applies at startup and user policy at sign-in, then refreshes in the background, by default every 90 minutes with a random offset of up to 30 minutes. `gpupdate` forces a refresh.
4. **Processing order: local policy, then site, then domain, then OU** (parent OUs before child OUs). Later ones override earlier ones on conflict, so the container closest to the object wins.
5. Exceptions to inheritance: an **enforced** link stops lower containers from overriding it; **block inheritance** on an OU stops higher policies from applying, except enforced ones. Security filtering limits a GPO to certain groups.

Security settings commonly enforced: password and account lockout policy, restricted local administrator membership, host firewall rules, removable storage control, application control, screen lock, audit policy, disabling legacy protocols, and update settings.

**Why it matters:** one GPO change reaches thousands of machines in a couple of hours, which is how an organization closes a newly discovered weakness (for example disabling a legacy protocol) quickly and proves it stayed closed.

**Common confusions:** Group Policy is Windows and Active Directory; it is not the Windows version of SELinux. Group Policy distributes settings to many machines, while SELinux enforces mandatory access control on each Linux host. A GPO linked to the wrong OU simply does not apply; scope problems are the most common cause of "the policy is not working". Mobile device management, not Group Policy, is the usual tool for phones and for Windows devices that are not domain joined.

**Scenario:** After an incident involving infected USB drives, a company must block removable storage on all domain workstations within a day. The answer is a Group Policy Object linked to the workstations' OU. Configuring each machine's local policy is the closest wrong answer: it is slow, inconsistent and overridden by domain policy.

### SELinux (Security-Enhanced Linux)
Security-Enhanced Linux (SELinux) is a mandatory access control (MAC) system built into the Linux kernel. A central policy decides what every process may do with every file, port and other resource, on top of the normal Linux permissions. A confined process is limited to what the policy allows for its type, whatever its ordinary file permissions would permit. It is a preventive technical control at the operating system level that mainly limits the damage of a compromised service.

How it works:
1. **Everything gets a label** (a security context) stored with the file or attached to the process.
2. **The policy states which labels may interact**, and how. This is type enforcement: for example, the web server's process type may read files labeled as web content and bind to web ports, and little else.
3. **On each access, the kernel checks both** the ordinary permissions and the SELinux policy. Both must allow it.
4. **Denials are logged**, so administrators can see what was blocked.

The three modes:
- **Enforcing**: policy violations are blocked and logged.
- **Permissive**: nothing is blocked; violations are only logged. Used for testing and troubleshooting.
- **Disabled**: SELinux is off, with no protection.

The mode and the policy type are set in `/etc/selinux/config`. The common "targeted" policy confines specific services; a multi-level security policy confines all processes and enforces data levels. Wrong labels on files are a frequent cause of SELinux problems; tools such as `restorecon` reset them.

**Why it matters:** if a web server is exploited, ordinary permissions may still let the attacker read anything that account can. Under SELinux the hijacked process stays confined to its policy, so one flaw does not become control of the whole host.

**Common confusions:** SELinux is mandatory access control: users and file owners cannot loosen it, unlike discretionary permissions. Permissive mode does not protect; it only logs. Turning SELinux off to "fix" an application is a common mistake; the right fix is correcting labels or policy. SELinux is Linux, not Windows.

**Scenario:** An application fails after a move to a hardened Linux server, and the administrator wants to learn what the policy would block without breaking production testing. The answer is permissive mode temporarily, reading the denial logs, fixing labels or policy, then returning to enforcing. Setting SELinux to disabled is the closest wrong answer: it removes the protection and produces no denial records to learn from.

### Implementing secure protocols (protocol, port and transport selection)
Implementing secure protocols means replacing protocols that send data and passwords in clear text with versions that encrypt and authenticate, opening the right ports for them, and choosing how traffic is protected on its way. It is a preventive technical control for data in transit, protecting confidentiality and integrity. This objective splits it into protocol selection, port selection and transport method. Port numbers and the full insecure-to-secure table are in the Reference chapter.

1. **Protocol selection** (the real security decision): pick the version that encrypts and authenticates.
   - Remote administration: Secure Shell (SSH), not Telnet.
   - Web: HTTPS (HTTP over TLS), not HTTP.
   - File transfer: SFTP (over SSH) or FTPS (FTP over TLS), not FTP.
   - Directory: LDAPS (LDAP over TLS), not plain LDAP.
   - Mail retrieval and submission: IMAP, POP3 and SMTP submission over TLS. RFC 8314 recommends implicit TLS (the connection is encrypted from the first byte) in preference to upgrading with STARTTLS.
   - Device monitoring: SNMPv3, not SNMPv1 or v2c.
   - Legacy items to remove: SSL and early TLS versions, which are broken or deprecated; use current TLS.
2. **Port selection**: open the standard port of the secure protocol and close the insecure one. A port is where a service listens, not proof of what runs there: a nonstandard port is not security, and a secure-looking port can carry an insecure service.
3. **Transport method**: decide what wraps the traffic.
   - **TLS** protects one application's connection.
   - **A VPN tunnel** (IPsec or TLS based) protects everything between two sites or between a remote device and the network, including applications that cannot encrypt by themselves.
   - **Wireless encryption** (WPA3) protects the radio hop only.

How to carry out a change: inventory where insecure protocols are still used (scans and flow data show them); enable the secure version; move clients; block the insecure port at the firewall; monitor for stragglers.

**Why it matters:** anyone on the path can read a Telnet or FTP password. Removing clear-text protocols is one of the cheapest, highest-value changes, and a frequent audit finding.

**Common confusions:** SFTP and FTPS are different protocols: SFTP runs inside SSH, FTPS is FTP wrapped in TLS. Encrypting the transport (a VPN) does not fix an insecure protocol beyond the tunnel's endpoints. HTTPS proves the server's identity and encrypts the session; it does not prove the site is honest.

**Scenario:** A scan finds administrators managing switches with Telnet across the campus network. The answer is protocol selection: enable SSH, disable Telnet, and block its port. Putting Telnet on a different port is the closest wrong answer; the session is still clear text.

### DNS filtering
DNS filtering blocks access to malicious or disallowed destinations at the moment a device asks the Domain Name System (DNS) for a name's address. If the name is on a block list or in a blocked category, the filtering resolver refuses to answer, or answers with a safe address (a sinkhole or block page), so the connection never starts. It is a preventive technical control with useful detective logs. Services of this kind are often called protective DNS.

How it works:
1. A device (any application on it) asks the company's DNS resolver for a name.
2. The resolver checks the name against threat intelligence and policy categories.
3. Allowed names resolve normally; blocked names are refused, redirected or sinkholed, and the event is logged. CISA's protective DNS service, for example, blocks, redirects or sinkholes matching queries and alerts the affected agency.
4. Logs show which device asked for which bad name, pointing straight at infected machines.

Making it effective:
1. Point every device at the filtering resolver (through DHCP and device management).
2. Block outbound DNS to any other resolver at the firewall, so devices cannot simply choose a different one. The US National Security Agency (NSA) describes enterprise gateways blocking DNS requests that do not come from the enterprise resolver.
3. Deal with encrypted DNS; see `### Encrypted DNS (DoH and DoT) as a monitoring blind spot`.
4. Cover roaming devices with an agent or a cloud resolver.

**Why it matters:** malware almost always needs DNS to find its command server, and phishing needs it to reach the fake site. Blocking the lookup stops both for every application and protocol at once, with little cost or delay.

**Common confusions:** DNS filtering blocks by name; it cannot block a connection made directly to an IP address, and it cannot see or block one bad page on an otherwise good domain. A web filter inspects web requests (and full URLs when it can decrypt); DNS filtering covers all applications but only at domain level. DNS filtering is not DNSSEC, which proves DNS answers are authentic and does not judge whether a site is safe.

**Scenario:** Malware on several machines contacts its control server by domain name using different programs and ports. The control that blocks it most broadly is DNS filtering. A web proxy block rule is the closest wrong answer, because non-web programs and ports never pass through the proxy.

Mini-example of a filter log line: `02:41:09 | client 10.8.3.44 | query update-check.badexample.net | category: command and control | action: sinkholed`.

### Encrypted DNS (DoH and DoT) as a monitoring blind spot
DNS over HTTPS (DoH) and DNS over TLS (DoT) encrypt DNS lookups between a device and a resolver. That protects privacy and integrity of lookups on untrusted networks. Inside a company it can create a blind spot: when a browser, application or malware sends encrypted lookups to an outside resolver, they skip the company's DNS server, so DNS filtering and DNS logging never see them.

How the bypass happens, as the US National Security Agency (NSA) describes it:
1. A client has DoH enabled and set to a resolver the enterprise did not choose.
2. The lookup leaves as ordinary-looking HTTPS traffic on port 443, passing the gateway like any other web session.
3. The enterprise resolver is bypassed, so its blocking and monitoring do not apply, and the gateway usually cannot see the request inside the encryption.
4. DoT uses its own port, 853, so it is easier to spot and block than DoH.

What to do, per NSA guidance:
1. Have the enterprise DNS resolver support encrypted DNS, and use only that resolver, so the company keeps both privacy and control.
2. Block known external DoH resolvers and block port 853 outbound, so encrypted lookups cannot go elsewhere.
3. Disable or centrally configure DoH in browsers and operating systems through device management or Group Policy, pointing them at the enterprise resolver.
4. Keep blocking unencrypted DNS to outside resolvers as well.

For home, mobile and teleworking users without enterprise DNS controls, NSA notes DoH can be a good way to protect lookups.

**Why it matters:** an organization may believe DNS filtering covers every device while a browser default or a piece of malware quietly resolves names elsewhere. The control looks healthy and sees nothing.

**Common confusions:** Encrypted DNS is not bad in itself; unmanaged encrypted DNS to outside resolvers is the problem. DoH hides inside HTTPS on port 443, so it cannot be blocked by port; DoT can. Encrypted DNS hides the lookup, not the later connection: the destination IP address is still visible to firewalls and flow records.

**Scenario:** DNS filter logs show nothing from a laptop that is clearly reaching blocked gambling sites. The likely cause is the browser using DoH to an outside resolver. The fix is to manage the browser's DoH setting and block external DoH resolvers. Adding the sites to the DNS block list again is the closest wrong answer: the lookups never reach that list.

### Sender Policy Framework (SPF)
Sender Policy Framework (SPF) lets a domain owner publish, in DNS, which mail servers are allowed to send email using that domain. Receiving servers check whether the connecting server's IP address is on the list. It is a preventive technical control against forged sender domains, working at the mail transport (SMTP) level.

How it works:
1. The domain owner publishes one TXT record at the domain, starting `v=spf1`, listing allowed senders by mechanisms: specific IP ranges (`ip4`, `ip6`), the domain's own mail hosts (`mx`, `a`), and other domains' lists (`include`), ending with a default (`all`).
2. A mail server connects and states a sender in the SMTP envelope (the MAIL FROM address) and its own name (HELO).
3. The receiver looks up the SPF record of that envelope domain and compares the connecting IP address.
4. Results include pass, fail, softfail and neutral. With `-all`, anything not listed is a fail: an explicit statement that the host is not authorized. With `~all`, it is a softfail: the domain believes the host is not authorized but makes no strong statement, and RFC 7208 says receivers should not reject on softfail alone.

Limits to know:
- SPF checks the **envelope sender and HELO name, not the From address the user sees**. A phisher can pass SPF with their own domain in the envelope while showing your domain in the visible From line. DMARC (Domain-based Message Authentication, Reporting and Conformance) alignment closes that gap.
- **Forwarding breaks SPF**: a forwarded message arrives from the forwarder's IP address, which is not in the original domain's list.
- Evaluating a record may trigger at most 10 DNS-querying mechanisms; beyond that the check errors.
- What happens to failing mail is the receiver's local policy unless DMARC says otherwise.

**Why it matters:** without SPF, any server on the internet can send mail claiming your domain in the envelope and receivers have nothing to check it against.

**Common confusions:** SPF authorizes sending servers; it does not sign or encrypt messages. SPF alone does not stop display-name or visible From spoofing.

**Scenario:** A company starts sending invoices through a cloud mailing service and customers report them landing in spam with SPF failures. The fix is adding the service to the SPF record with an `include` mechanism. Publishing a DKIM (DomainKeys Identified Mail) key is the closest wrong answer: useful, but the reported failure is the sending server missing from SPF.

Mini-example: `example.org. TXT "v=spf1 ip4:192.0.2.0/24 include:_spf.mailvendor.example -all"`.

### DomainKeys Identified Mail (DKIM)
DomainKeys Identified Mail (DKIM) lets a sending domain attach a digital signature to each message. The receiver fetches the domain's public key from DNS and verifies that the signed parts of the message really came from a holder of that domain's private key and were not altered on the way. It is a technical control providing authenticity and integrity for email, at the message level.

How it works:
1. The domain owner generates a key pair, keeps the private key on the sending mail system, and publishes the public key in a DNS TXT record at `selector._domainkey.domain`. The selector is a label that allows several keys at once (for rotation or for different sending services).
2. For each outgoing message, the sender hashes the body and selected header fields and signs them with the private key. The From header field must be among the signed headers.
3. The signature goes into a `DKIM-Signature` header that names the signing domain (`d=`), the selector (`s=`), the signed headers (`h=`) and the body hash (`bh=`).
4. The receiver reads the header, looks up the public key in DNS, and verifies the signature.
5. Pass means the message was signed by that domain and the signed content is unchanged.

Properties to know:
- **DKIM survives simple forwarding**, because the signature travels with the message, unlike SPF (Sender Policy Framework), which depends on the connecting server. Mailing lists that modify the subject or body can break it.
- **The signing domain need not be the visible From domain.** DKIM alone proves "some domain signed this", which is why DMARC (Domain-based Message Authentication, Reporting and Conformance) adds alignment with the From domain.
- **It does not encrypt.** The message stays readable.

**Why it matters:** DKIM gives receivers cryptographic evidence that mail claiming to come from a domain was authorized by it and not tampered with, which is the basis for trusting or rejecting it.

**Common confusions:** DKIM signs; it does not encrypt (that is S/MIME (Secure/Multipurpose Internet Mail Extensions), PGP (Pretty Good Privacy) or transport TLS). The key lives in DNS, not in a certificate from a certificate authority. DKIM is applied by mail servers per domain, not by individual users.

**Scenario:** Legitimate mail from a company is forwarded by universities to alumni mailboxes and fails SPF there. The mechanism that still verifies after forwarding is DKIM. Tightening SPF to `-all` is the closest wrong answer: it would make more forwarded mail fail.

Mini-example: `DKIM-Signature: v=1; a=rsa-sha256; d=example.org; s=mail2026; h=from:to:subject:date; bh=...; b=...` with the key at `mail2026._domainkey.example.org`.

### DMARC (Domain-based Message Authentication, Reporting and Conformance)
A DNS-published policy, DMARC (Domain-based Message Authentication, Reporting and Conformance) tells receiving mail servers what the domain owner wants done with messages that fail authentication for that domain, and where to send reports. It ties SPF (Sender Policy Framework) and DKIM (DomainKeys Identified Mail) to the address users actually see, the From header. It is a preventive technical control against direct domain spoofing, with a detective reporting side. The current specification is RFC 9989 (May 2026), which replaced RFC 7489. The published SY0-701 acronym list writes it as Domain Message Authentication Reporting and Conformance.

How a receiver evaluates DMARC:
1. Take the domain in the visible From header (the author domain).
2. Look up the TXT record at `_dmarc.` plus that domain.
3. Check SPF and DKIM as usual.
4. Check **alignment**: the domain that passed SPF, or the domain that signed with DKIM, must match the From domain. Relaxed alignment accepts the same organizational domain (for example `mail.example.org` with `example.org`); strict alignment requires identical domains.
5. **DMARC passes if SPF passes and aligns, or DKIM passes and aligns.** One is enough.
6. If it fails, apply the domain's requested policy, and send reports to the listed addresses.

The policies (`p=`):
- `none`: take no special action; just report. Used to monitor.
- `quarantine`: treat failing mail as suspicious, typically the spam folder.
- `reject`: refuse failing mail.

Safe rollout order: publish `p=none` with a reporting address; read the aggregate reports to find every legitimate sender; fix their SPF and DKIM; move to `quarantine`; then to `reject`. The common wrong order is jumping to `reject` first, which blocks the company's own newsletters and invoices sent by third parties.

**Why it matters:** only a domain at an enforcing policy stops criminals from sending mail that shows the company's exact domain in the From line to customers and staff.

**Common confusions:** DMARC does not replace SPF and DKIM; it needs at least one of them to pass and align. DMARC protects the exact domain, not look-alike domains or display names. `p=none` gives visibility, not protection. DMARC does not encrypt anything.

**Scenario:** Spoofed emails show the company's real domain in the From line and reach customers, although SPF and DKIM records exist. The missing piece is a DMARC policy of quarantine or reject. Tightening the SPF record is the closest wrong answer: SPF checks the envelope domain, which the attacker sets to a domain of their own.

Mini-example: `_dmarc.example.org. TXT "v=DMARC1; p=reject; rua=mailto:dmarc-reports@example.org"`.

### SPF vs DKIM vs DMARC (email authentication compared)
Three DNS-based mechanisms let receivers judge whether mail really comes from the domain it claims. Each checks something different, and they are designed to work together. SPF is Sender Policy Framework, DKIM is DomainKeys Identified Mail, DMARC is Domain-based Message Authentication, Reporting and Conformance.

| | SPF | DKIM | DMARC |
|---|---|---|---|
| Question answered | Is this server allowed to send for the envelope domain? | Was this message signed by the domain, and unchanged? | Does a passing check match the visible From domain, and what if not? |
| Checks | Connecting IP address against a published list | A digital signature over headers and body | Alignment of SPF or DKIM with the From header, then policy |
| DNS record | TXT at the domain, `v=spf1 ...` | TXT public key at `selector._domainkey.domain` | TXT at `_dmarc.domain`, `v=DMARC1; p=...` |
| Identity it covers | Envelope sender (MAIL FROM) and HELO name | The signing domain in the signature | The From address the user sees |
| Survives forwarding? | Often not | Usually, unless the message is modified | Yes if DKIM still passes and aligns |
| Tells the receiver what to do? | No; local policy | No | Yes: none, quarantine or reject, plus reports |

How they combine on one message: the receiver checks SPF, checks DKIM, then DMARC asks whether either pass belongs to the From domain. If yes, DMARC passes. If no, the receiver applies the published policy and reports.

None of the three encrypts mail or hides its content, and none stops a look-alike domain (for example a swapped letter) that publishes its own valid records.

**Why it matters:** many organizations publish SPF and stop. Without DKIM, forwarded mail fails; without DMARC, nothing links either check to what the user sees, and receivers are left to guess.

**Common confusions:** "DKIM encrypts email" is false; it signs. "SPF checks the From address" is false; it checks the envelope. "DMARC is a third check" is misleading; it is a policy and alignment layer over the other two.

**Scenario:** Clue: "list which servers may send for our domain": SPF. Clue: "prove messages were not altered and came from our domain, using a key in DNS": DKIM. Clue: "tell receivers to reject mail that fails, and send us reports": DMARC.

### Email gateway (secure email gateway)
An email gateway, often called a secure email gateway (SEG), is a system that inbound and outbound mail passes through so it can be filtered before delivery. It blocks spam, phishing and malware, enforces the results of SPF (Sender Policy Framework), DKIM (DomainKeys Identified Mail) and DMARC (Domain-based Message Authentication, Reporting and Conformance) checks, and can apply data loss prevention (DLP) and encryption to outgoing mail. It is a preventive and detective technical control, deployed on premises or as a cloud service, in front of or integrated with the mail platform.

What it does to inbound mail, in order:
1. **Connection checks**: sender reputation and block lists; reject obvious junk early.
2. **Authentication checks**: SPF, DKIM and DMARC evaluation, applying the sender domain's policy.
3. **Content filtering**: spam scoring, phishing indicators, impersonation checks (display names resembling executives, look-alike domains).
4. **Attachment handling**: antivirus scanning, blocking risky file types, and detonating unknown attachments in a sandbox.
5. **Link handling**: rewriting URLs so they are checked again at the moment of click.
6. **Disposition**: deliver, tag with a warning banner, quarantine for review, or reject.

Outbound: scan for malware and spam from compromised accounts, apply DLP rules (block or encrypt messages containing sensitive data), add DKIM signatures, and enforce TLS to partner domains.

How to modify the capability: tighten policies for failing DMARC, add impersonation protection for executives, block macro-enabled attachments from outside, enable time-of-click link checking, tune quarantine and release rules, and feed gateway logs to the SIEM (security information and event management).

**Why it matters:** email is the most common way attackers reach users. A gateway removes most hostile mail before a person ever has to judge it.

**Common confusions:** SPF, DKIM and DMARC are DNS records that publish facts and policy; the gateway is the system that checks and enforces them along with much else. A gateway filters mail in transit; it does not protect a mailbox whose password was stolen. Gateway encryption protects mail between gateways, which differs from end-to-end message encryption.

**Scenario:** Users receive invoices with malicious attachments from newly created senders that pass SPF. The capability to adjust is the email gateway: sandbox attachments and block risky file types. Publishing a stricter DMARC record is the closest wrong answer, because DMARC protects the company's own domain from being spoofed, not inbound mail from attackers' own domains.

### Email encryption: S/MIME and PGP (end-to-end message protection)
Secure/Multipurpose Internet Mail Extensions (S/MIME) and Pretty Good Privacy (PGP, standardized as OpenPGP) protect the email message itself, from sender to recipient. They provide what server-side controls do not: encryption gives confidentiality of the content, and digital signatures give authentication of the sender, message integrity and non-repudiation. Both are technical controls using public key cryptography.

How they work:
1. **To encrypt**: the sender's client creates a one-time message key, encrypts the message with it, then locks that key with the recipient's public key. Only the recipient's private key can unlock it.
2. **To sign**: the sender's client hashes the message and signs the hash with the sender's private key. The recipient verifies with the sender's public key.
3. A message can be signed, encrypted, or both.

The difference is how public keys are trusted:
- **S/MIME** uses X.509 certificates issued by a certificate authority (CA); it is built into most corporate mail clients and suits organizations with a public key infrastructure.
- **PGP / OpenPGP** (GPG is a common implementation) lets users generate their own keys and vouch for each other's keys in a web of trust, with no central authority.

How this differs from transport and domain controls: TLS between mail servers protects each hop, but the message sits readable on every server along the way; NIST SP 800-177 notes that senders and receivers wanting mailbox-to-mailbox assurance may implement end-to-end, message-based protection. SPF (Sender Policy Framework), DKIM (DomainKeys Identified Mail) and DMARC (Domain-based Message Authentication, Reporting and Conformance) check that mail really comes from the claimed domain; they do not hide content.

**Why it matters:** contracts, health data and legal advice sent by email may pass through servers the sender does not control. End-to-end encryption keeps the content private even if a mail server or mailbox store is breached.

**Common confusions:** Encrypt with the recipient's public key; sign with your own private key. DKIM signs on behalf of a domain at the server; S/MIME and PGP sign on behalf of a person at the client. Encrypted mail cannot be scanned by gateways or DLP (data loss prevention) unless they hold keys.

**Scenario:** A law firm must ensure only the named recipient can read a message, even if mail servers along the way are compromised, and prove which lawyer sent it. The answer is S/MIME (or PGP) encryption and signing. Enforcing TLS between mail servers is the closest wrong answer: it protects each hop but leaves the message readable on the servers.

### File integrity monitoring (FIM)
File integrity monitoring (FIM) watches important files (operating system files, configuration files, application binaries, scripts, registry keys) for unauthorized change. It records a known-good baseline, usually cryptographic hashes plus attributes such as size, owner and permissions, then compares the current state with it and alerts on differences. It is a detective technical control protecting integrity. The published SY0-701 acronym list expands FIM as File Integrity Management.

How it works:
1. **Choose what to monitor**: files that should rarely change and matter if they do (system binaries, web content, security settings, startup scripts).
2. **Create the baseline** from a trusted state: hash each file and store the values safely, away from the monitored host.
3. **Monitor**: rescan on a schedule, or watch in near real time; compare hashes and attributes.
4. **Alert** on added, modified or deleted files, with who, when and which process where the tool can tell.
5. **Reconcile with change management**: expected changes (patches, approved releases) update the baseline; unexpected ones are investigated.

Examples: Tripwire is a well-known FIM product, and Windows System File Checker verifies protected system files. Compliance standards require it: PCI DSS v4 requirement 11.5.2 asks for a change-detection mechanism that alerts staff to unauthorized modification of critical files and performs comparisons at least weekly.

**Why it matters:** attackers change files to stay in: a web shell dropped in a web folder, a replaced system binary, an altered configuration. FIM can be the only control that notices a quiet change on a system that otherwise looks healthy.

**Common confusions:** FIM detects change; it does not prevent it and does not say whether a change is malicious. FIM without change management produces noise: every patch looks like an attack. Hashing is used here for integrity, not for hiding data. FIM differs from antivirus, which looks for known bad content rather than any change to known good content.

**Scenario:** A payment server must alert when anyone alters its application binaries or configuration outside approved changes. The answer is file integrity monitoring. Full-disk encryption is the closest wrong answer: it protects confidentiality of a stolen disk and does nothing to reveal a change made on the running system.

Mini-example of a FIM alert: `File: /var/www/app/login.php | Change: modified | Old hash: 9f2c... | New hash: 41ab... | By: www-data | Time: 03:14 | Approved change: none`.

### DLP policy configuration (enterprise capability)
As an enterprise capability, data loss prevention (DLP) is something you configure: policies that say which data is sensitive, where to look for it, under which conditions a rule applies and what happens then. It is a preventive and detective technical control protecting confidentiality. This section is about modifying DLP; what DLP watches and how it recognizes data is in `### Data loss prevention (DLP) as a monitoring tool`.

The parts of a DLP policy:
1. **What to protect**: sensitive information types (card numbers, national identifiers, health terms), document fingerprints, keywords, or classification and sensitivity labels. Vendor templates exist for common regulations.
2. **Where**: endpoints (USB, print, clipboard, upload), email, network or web traffic, cloud apps and storage, file shares.
3. **Conditions**: for example "contains 10 or more card numbers and the recipient is outside the organization".
4. **Actions**: audit only; warn the user with a policy tip; block but allow an override with a business justification; block outright; encrypt; quarantine a stored file; alert security.
5. **Scope and exceptions**: which users, groups or devices, and approved exceptions (the finance team sending to the payment processor).

How to roll out a change, in order:
1. Identify the business processes that legitimately move the data, with their owners.
2. Deploy the policy in simulation (audit-only) mode first. Reason: an untested blocking rule stops real work.
3. Review matches, fix false positives by refining conditions and exceptions.
4. Move to warnings (policy tips), which also teach users.
5. Enforce blocking, keep monitoring and tuning.

Deployment points: endpoint DLP (an agent sees data in use, even offline), network DLP (inspects traffic, limited by encryption unless it decrypts), email DLP (often in the mail gateway), cloud DLP (through the cloud service or an access broker).

**Why it matters:** well-tuned DLP stops the most common leaks, which are mistakes, and makes deliberate theft harder and visible. Badly tuned DLP blocks business and gets switched off.

**Common confusions:** DLP does not classify data by magic; labels and patterns must be defined and maintained. Blocking is not the only action; warn and justify often work better. DLP is not encryption or access control, though it can trigger encryption. Rights management travels with the document; DLP watches the channel.

**Scenario:** Staff sometimes email spreadsheets with customer card numbers to outside addresses by mistake. The change is a DLP rule on outbound email that detects card number patterns and blocks or encrypts the message, tested in audit mode first. Email authentication (DMARC) is the closest wrong answer: it concerns who may send as the domain, not what content leaves.

Mini-example of a rule: `IF content has >= 5 card numbers AND recipient is external THEN block, show policy tip, allow override with justification, alert security`.

### Network access control (NAC)
Network access control (NAC) decides whether a device may join the network, and which part of it, by checking who or what it is (identity) and what state it is in (posture or health) before and during the connection. NIST SP 800-41 Rev. 1 describes NAC as allowing access based on the user's credentials and the results of health checks on the user's computer. It is a preventive technical control at the point of connection: switch ports, wireless and VPN.

How it works:
1. **Detect**: a device connects to a switch port, Wi-Fi or VPN.
2. **Authenticate**: identity is checked, usually with IEEE 802.1X and a RADIUS (Remote Authentication Dial-In User Service) server, by user credentials or device certificate. Devices that cannot do 802.1X (printers, cameras) may be identified by hardware address, which is weaker because it can be copied.
3. **Assess posture**: is the operating system patched, is antivirus or endpoint protection running and current, is the disk encrypted, is the host firewall on, is the device managed?
4. **Decide**: compliant devices get the right VLAN and access rules for their role; noncompliant devices are denied or placed in a quarantine or remediation network with access only to update servers; guests go to an isolated guest network.
5. **Keep checking**: posture is rechecked during the session, and access changes if the device falls out of compliance.

How posture is collected:
- **Persistent agent**: installed software that checks continuously.
- **Dissolvable agent**: runs at connection time, reports, and removes itself; suits guests and personal devices.
- **Agentless**: the NAC system queries the device or the directory, or scans it from the network; less detail.

NIST notes that when credentials are acceptable but the device fails the health check, the user and device may get only limited access for remediation.

**Why it matters:** without NAC, anyone who can plug into a wall socket or learn the Wi-Fi password is on the internal network, and an unpatched contractor laptop can carry malware straight in.

**Common confusions:** 802.1X alone proves identity; NAC adds posture and placement. NAC is not a firewall: it decides admission and segment, not every packet afterwards. A remediation VLAN is quarantine for fixing, not punishment.

**Scenario:** A contractor plugs a personal laptop with outdated antivirus into an office socket. NAC with posture assessment places it in a remediation VLAN until it complies, or a guest network. Port security limited by hardware address is the closest wrong answer: it can restrict which devices connect but cannot check health, and addresses can be spoofed.

### Endpoint detection and response (EDR) and extended detection and response (XDR)
Endpoint detection and response (EDR) continuously records detailed activity on endpoints, detects threats by behavior, and gives responders the tools to investigate and act on the device. Extended detection and response (XDR) applies the same idea across more sources (endpoints plus email, identities, cloud applications and network) and correlates them into single incidents. Both are detective and corrective technical controls that assume some attacks will get past prevention.

How EDR works:
1. **Collect**: an agent records telemetry such as process starts, command lines, network connections, logins, file and registry changes, and memory activity. Microsoft describes its EDR as continuously collecting this behavioral telemetry and keeping it for months so analysts can go back to the start of an attack.
2. **Detect**: analytics flag suspicious behavior, including attacks that use legitimate tools and leave no malicious file.
3. **Group**: related alerts are combined into an incident.
4. **Investigate**: analysts search the recorded history and see the process tree and timeline.
5. **Respond**: isolate the device from the network, stop and quarantine a file or process, run a scan, block an indicator everywhere, or roll back changes where the product supports it.

What XDR adds: it joins signals from several security products so the whole attack is visible as one story (how it entered, what it touched), and it can act across them, for example removing a malicious attachment from every mailbox after it was detected on one endpoint, or automatically disabling a compromised account and isolating a device to disrupt an attack in progress.

How to modify the capability: deploy agents to every endpoint and server, enable blocking mode after a monitoring period, define automated response for high-confidence detections, integrate with the SIEM (security information and event management), and tune exclusions sparingly.

**Why it matters:** modern intrusions often use stolen credentials and built-in administration tools. Signature antivirus sees nothing wrong; EDR sees the unusual chain of actions, and lets one analyst contain a device in seconds.

**Common confusions:** EDR is endpoint only; XDR spans several domains. EDR is not just "better antivirus": its core is recorded telemetry and response. XDR is not a SIEM: XDR is tightly integrated detection and response across specific products, while a SIEM collects any log source and keeps it for long-term analysis and compliance.

**Scenario:** An attacker uses a stolen password and built-in scripting tools to move between workstations; no malware file is ever written. The capability that detects and contains this on the hosts is EDR. Signature-based antivirus is the closest wrong answer, because there is no malicious file to match.

### User behavior analytics (UBA and UEBA)
User behavior analytics (UBA) learns what normal activity looks like for each user and flags significant deviations that may mean a compromised account or an insider threat. When the same approach covers devices, servers, applications and IP addresses as well as people, it is called user and entity behavior analytics (UEBA). It is a detective technical control, usually a feature of a SIEM (security information and event management) or XDR (extended detection and response) platform, based on anomaly detection.

How it works:
1. **Collect** identity and activity data: sign-ins, locations, devices, resources accessed, data volumes, administrative actions.
2. **Build baselines** with machine learning: the user's own history, the behavior of their peer group (same team or role), and the organization as a whole.
3. **Compare** new activity against those baselines.
4. **Score risk**: one oddity is weak evidence; several together (new country, new device, unusual hour, mass download) raise the score.
5. **Alert or act** when the score passes a threshold: notify analysts, or trigger step-up authentication or account lockout through integrated tools.

What it catches that rules miss:
- A valid login used by the wrong person (stolen credentials).
- An employee collecting far more data than usual before leaving.
- A service account suddenly logging in interactively or reaching new systems.
- Slow misuse that never crosses any single fixed threshold.

**Why it matters:** attackers with valid credentials look legitimate to firewalls, antivirus and access controls. Behavior is what gives them away.

**Common confusions:** UBA is anomaly-based, not signature-based, so it needs a learning period and produces false positives when people legitimately change behavior (travel, new role). UBA watches users; UEBA adds entities such as hosts and applications. It detects; other tools block. It is not user activity recording for its own sake: the point is deviation from a baseline.

**Scenario:** An accountant who normally opens about 20 customer records a day, from the office in working hours, downloads 4,000 records at 2 a.m. from an unfamiliar country. The capability that flags this is user behavior analytics. A DLP (data loss prevention) rule is the closest wrong answer: it could catch the data leaving if a pattern matched, but only behavior analytics recognizes that the activity is abnormal for this user.

### Choosing an enterprise capability to modify (decision path)
Use this path when a scenario describes a problem and asks which enterprise capability to change. Each line gives the problem, the capability and exact change, and when not to use it.

1. **Unwanted traffic between networks or to a host**: firewall rule or ACL (access control list), most specific rule above broader ones. Not for inspecting content inside allowed traffic.
2. **Public servers must be reachable without exposing the inside**: screened subnet. Not for internal-only servers.
3. **Attacks inside allowed traffic must be stopped automatically**: inline IPS (intrusion prevention system) in prevention mode with current signatures. Use an IDS (intrusion detection system) when blocking risks an outage and alerting is enough.
4. **Users reach malicious or forbidden websites**: web filter; agent-based for roaming devices, proxy for on-network and unmanaged devices; add reputation and category rules. Not for non-web protocols.
5. **Malware or any application reaches bad domains**: DNS filtering, with other resolvers and unmanaged encrypted DNS blocked. Not for direct-to-IP connections or single bad pages.
6. **Windows settings must be enforced on many machines**: Group Policy. Not for Linux or unmanaged devices.
7. **A Linux service must be confined even if exploited**: SELinux in enforcing mode. Not as a substitute for patching.
8. **Passwords or data cross the network in clear text**: secure protocol selection (SSH, HTTPS, SFTP (SSH File Transfer Protocol), LDAPS (LDAP over TLS), SNMPv3), then block the old port.
9. **Mail spoofing our exact domain**: SPF (Sender Policy Framework) and DKIM (DomainKeys Identified Mail) with DMARC (Domain-based Message Authentication, Reporting and Conformance) at quarantine or reject. Not for look-alike domains.
10. **Malicious inbound mail, attachments and links**: email gateway filtering and sandboxing. **Only the recipient may read it**: S/MIME (Secure/Multipurpose Internet Mail Extensions) or PGP (Pretty Good Privacy).
11. **Critical files changed without approval**: file integrity monitoring.
12. **Sensitive data leaving by email, web, USB or cloud**: DLP (data loss prevention) policy, tested in audit mode first.
13. **Unknown or unhealthy devices joining the network**: NAC (network access control) with 802.1X and posture checks.
14. **Attacks on endpoints that leave no malware file; need to investigate and isolate**: EDR (endpoint detection and response); across email, identity and cloud too: XDR (extended detection and response).
15. **A valid account behaving abnormally**: user behavior analytics.

**Why it matters:** several capabilities could help in most scenarios. The best answer is the one acting at the point the problem occurs, with the least side effect.

**Scenario:** "Remote staff keep landing on phishing sites from links in chat apps and email, on home networks." The decisive clues are roaming devices and several applications, so the answer is agent-based web filtering or DNS filtering enforced on the device. A stricter office firewall is the closest wrong answer, because the traffic never crosses it.
