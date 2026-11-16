# Domain 2 (part 2): Indicators of attack and mitigations
Checked as of 2026-11 for SY0-701.

## 2.4 Reading the signs of an attack in a scenario

Depth: apply in a scenario. A good answer names the attack from the clues given (a log line, a symptom, a story), says which clue decided it, and rules out the closest look-alike; reciting a definition alone is not enough.

### Ransomware (crypto-ransomware, double extortion)

Ransomware is malware that encrypts a victim's files or whole systems, or locks them, and demands payment for the key. It attacks availability first, and when the gang also steals data before encrypting (double extortion), it attacks confidentiality too. Some groups skip encryption and only steal and threaten to publish.

How a typical attack unfolds:
1. Initial access, often a phishing attachment, a stolen remote access password or an unpatched internet-facing system, because the gang needs a foothold.
2. Spread inside the network with valid accounts, dumped credentials and admin file shares, so that as many machines as possible are hit at once.
3. Find and destroy backups and shadow copies, so the victim has no way back except paying.
4. Copy data out (for double extortion), then encrypt, rename files and drop ransom notes.
The common wrong idea is that encryption is the first step; it is the last, which is why early indicators (new admin accounts, shadow copy deletion, odd outbound transfers) matter.

Indicators: a burst of file writes with unusual new extensions, a ransom note in every folder, changed desktop wallpaper or login messages, backup and shadow copy deletion commands (vssadmin, wbadmin), and files that suddenly will not open (resource inaccessibility).

**Why it matters:** Operations stop until systems are restored, and stolen data adds breach costs and legal duties. Paying does not guarantee that files are recovered, and nothing forces the gang to delete the data it stole.

**Common confusions:** Ransomware is defined by its payload (encrypt or lock, then demand money), not by how it spreads. It may arrive by a Trojan and spread like a worm, so a scenario can show both. A missing file share with no ransom note and no encryption points to a denial-of-service (DoS) or an outage, not ransomware.

**Scenario:** At 2 a.m. a file server's change log shows 40,000 files renamed with a ".lockd" ending and a text file named "RESTORE_FILES.txt" in each folder. The answer is ransomware, decided by mass renaming plus a ransom note. Spyware is the closest wrong answer, but spyware hides and watches; it does not announce itself or make data unusable.

Mini-example of the best recovery path: offline, encrypted backups that are tested regularly, kept off the network so the malware cannot reach them, and isolating affected systems (disconnect first, power off only if you cannot disconnect, since powering off destroys memory evidence).

### Trojan and remote access Trojan (RAT)

A Trojan (Trojan horse) is a program that appears useful but carries a hidden harmful function. It does not copy itself; it depends on a person choosing to install or run it. A remote access Trojan (RAT) is a Trojan whose hidden function is a backdoor that lets the attacker control the machine remotely.

How it works:
1. The attacker disguises the code as something wanted: a free tool, a cracked game, a fake invoice viewer or a fake update.
2. The user runs it, often with their own rights, so it inherits whatever access that user has.
3. The hidden part installs other tools (keyloggers, rootkits, a backdoor that listens for commands) or calls out to a command and control (C2) server.

Indicators: a newly installed program the user remembers installing that now makes outbound connections it should not, a new listening port, an unknown startup entry, or antivirus flags on a recently downloaded installer.

**Why it matters:** One user's click becomes an attacker's foothold, and a RAT gives live hands-on control for data theft or later ransomware.

**Common confusions:** Disguise is the defining feature, not the damage done. A virus also needs the user to run something, but a virus copies itself into other files; a Trojan does not replicate. A worm needs no user at all. "Backdoor" is the capability; RAT is a Trojan that delivers it.

**Scenario:** A designer installs a "free font pack" from a forum. The fonts work, but the firewall log shows the machine connecting every 60 seconds to an unknown address on a high port. The answer is a Trojan (likely a RAT), because a wanted program hid an unwanted function. A worm is the closest wrong answer, but nothing spread to other machines and the user chose to install it.

### Worm (self-propagating malware)

A worm is a self-contained program that copies itself across networks to other systems with no host file and no user action. It usually exploits a network-reachable vulnerability or weak passwords, and its traffic can itself degrade availability.

How it spreads:
1. Scan for reachable systems running a vulnerable service.
2. Exploit the flaw (or guess a default password) to get code running there.
3. Copy itself and repeat from the new host, so the infection grows on its own.

Indicators: many hosts infected within minutes or hours, a sudden spike in scanning traffic on one service port across the network, and hosts that were never touched by a user getting infected.

**Why it matters:** A worm can cross a flat network faster than people can react, so patching, segmentation and blocking the exploited service decide how far it gets. WannaCry (2017) spread worm-style through a Windows file sharing (SMB) flaw and delivered ransomware.

**Common confusions:** The test is "does it spread by itself?" A virus needs a host file and someone to open it; a Trojan needs someone to install it. A worm can carry any payload, including ransomware, so "worm" describes spreading and "ransomware" describes the payload.

**Scenario:** On Monday morning, 300 servers in a branch office show the same unknown service, and none of their users logged in over the weekend. The answer is a worm, decided by fast spread with no user action. A virus is the closest wrong answer, but a virus would need files to be opened or programs to be run.

Mini-example of a log clue: a network monitor shows one internal host contacting 2,000 other internal addresses on the same port within five minutes, which is worm-like scanning, not normal client behavior.

### Virus (file infector, boot sector and macro malware)

A virus is malicious code that replicates by attaching itself to other programs, files or boot areas and runs only when its host is run or opened. It needs both a host and an action, usually a user's, to activate and spread.

Kinds of virus:
1. File infector: attaches to executable programs and runs when the program runs.
2. Boot sector: infects the boot record of a disk or removable media, so it runs at startup before the operating system.
3. Multipartite: combines file and boot sector infection.
4. Macro: uses an application's macro language to infect documents and templates.
5. Script: infects scripts run by a scripting engine.
Fileless malware is often listed beside viruses; see `### Fileless malware (living off the land)`.

Indicators: many documents or programs changing size or content after one file was opened, antivirus detections of the same family across many files, macros appearing in documents that never had them, and boot problems after a Universal Serial Bus (USB) drive was used.

**Why it matters:** Infected files travel through shares, email and removable drives, so one infected template can reach every document a team creates.

**Common confusions:** "Virus" is often used loosely for any malware, but in the strict sense used in this objective it means host-attached, user-triggered replication. If the code spreads across the network by itself, it is a worm. If it hides inside a wanted program and does not copy itself, it is a Trojan.

**Scenario:** After a shared budget spreadsheet is opened, every spreadsheet the finance team saves that afternoon contains the same unexpected macro. The answer is a (macro) virus, decided by copies attaching to other files when a file is opened. A worm is the closest wrong answer, but the spread happened only when people opened documents.

Defenses: anti-malware with current signatures, macros allowed only from trusted locations or signed publishers, and blocking autorun from removable media.

### Fileless malware (living off the land)

Fileless malware runs mainly in memory or through tools already on the system (PowerShell, Windows Management Instrumentation (WMI), the registry) instead of a program file on disk. Because there is little or no malicious file to scan, file-signature antivirus often misses it.

How it typically runs:
1. A trigger such as a document macro or an exploited browser starts a trusted built-in tool.
2. That tool downloads a script straight into memory and runs it, so nothing new is written to disk.
3. Persistence is stored in places that are not ordinary files: a registry value or a WMI event subscription that re-launches the command at startup or logon.
A common wrong belief is that a reboot cleans it: a reboot clears memory, but registry or WMI persistence brings it back.

Indicators: PowerShell started by Word or Excel, long encoded (Base64) command lines, odd parent and child process pairs, new WMI event filters or consumers, and script engines making outbound connections.

**Why it matters:** It bypasses defenses that only scan files and blends into admin activity, so detection depends on behavior monitoring.

**Common confusions:** Fileless describes WHERE the code lives (memory, registry, built-in tools), not what it does; it can carry ransomware or a remote access Trojan (RAT). It is not the same as a macro virus: the macro may start it, but a macro virus copies itself into other documents.

**Scenario:** An endpoint detection and response (EDR) alert shows Excel launching powershell.exe with a 3,000-character encoded command, and no new executable is on disk. The answer is fileless malware, decided by trusted tools running code from memory. A Trojan is the closest wrong answer, but no disguised program was installed.

Defenses: EDR with behavior and memory analysis, PowerShell logging and constrained modes, attack surface reduction rules, and restricting who can create WMI subscriptions remotely.

### Spyware (covert data collection)

Spyware is malicious code installed covertly that collects information about a user or organization (browsing, keystrokes, location, credentials, files) and reports it back to its operator. It attacks confidentiality and privacy, and it tries to stay unnoticed.

How it works:
1. It arrives bundled with free software, through a Trojan, a malicious browser extension or a drive-by download.
2. It watches activity in the background (browser history, form fields, screenshots, microphone or location on mobile).
3. It sends the data out periodically, often over normal web traffic so it blends in.

Indicators: an unfamiliar browser extension or toolbar, changed home page or search engine, regular small uploads to an unknown site, unexplained battery or data use on a phone, and new apps with excessive permissions.

**Why it matters:** Stolen credentials and business data feed fraud, account takeover and espionage, often for months before anyone notices.

**Common confusions:** A keylogger is a kind of spyware focused on keystrokes. Bloatware is unwanted but usually not malicious and does not secretly report your data. Adware shows ads; it becomes spyware when it tracks and reports behavior without consent.

**Scenario:** A sales laptop has a "coupon helper" extension nobody approved, and the proxy shows it posting every visited URL to a foreign domain every ten minutes. The answer is spyware, decided by covert collection and reporting. Bloatware is the closest wrong answer, but bloatware does not secretly send your activity to a third party.

### Keylogger (keystroke logger)

A keylogger records what a user types, to capture passwords, card numbers and messages. It can be software (hooking the operating system's keyboard functions or using a driver) or hardware (a small device between the keyboard and the computer, or a modified keyboard).

How software keyloggers work:
1. They hook the functions the operating system uses to handle keystrokes, or read the input buffer directly.
2. They store keystrokes and often screenshots or clipboard contents.
3. They send the log out by email, file upload or web request, or wait for the attacker to collect it.

Indicators: unknown processes calling keyboard-hook functions, an unexpected device plugged in between keyboard and PC, logins from strange places shortly after a user typed a password on a shared or public machine.

**Why it matters:** A keylogger captures the password before any encryption is applied, so HTTPS and encrypted disks do not protect what was typed. Multifactor authentication (MFA) limits the damage because the password alone is not enough.

**Common confusions:** A keylogger is spyware with one focus (input). It does not crack hashes; it captures the plaintext as typed. A hardware keylogger needs no software install and survives reimaging, so a physical inspection matters.

**Scenario:** Three guests who used a hotel business center PC report their webmail accounts were accessed the next day; IT finds a small adapter between the keyboard cable and the PC. The answer is a hardware keylogger, decided by the physical device and stolen typed credentials. An on-path attack is the closest wrong answer, but nothing intercepted network traffic; the capture happened at the keyboard.

### Logic bomb (trigger-based malicious code)

A logic bomb is code deliberately inserted into software that runs a harmful action only when a set condition occurs: a date and time, an event (an account being disabled), or a value in data. Until then it sits idle and looks like normal code.

How it works:
1. Someone with access, often an insider or a developer, hides the code in a script, scheduled job or application.
2. The code checks its condition each time it runs.
3. When the condition is met, it runs the payload: delete data, wipe disks, corrupt records.

Indicators: unexplained scheduled tasks or code paths that check dates or account status, destructive actions that start at an exact time across many systems, and damage that follows an employee's departure.

**Why it matters:** It is planted by someone trusted, so it bypasses perimeter defenses, and custom code has no antivirus signature. In March 2013, wiper malware hit South Korean banks and broadcasters at the same set time (reported as 14:00 local time), destroying data on many machines; the timed trigger is why the case is commonly described as a logic bomb.

**Common confusions:** The trigger is what makes it a logic bomb. A Trojan is defined by disguise, a virus by self-copying. A logic bomb can be delivered inside a Trojan, but if the question stresses "waits until a date or event," the answer is logic bomb.

**Scenario:** A week after a database administrator is fired, the payroll tables are erased at midnight by a script that checked whether his account was disabled. The answer is a logic bomb, decided by the condition-based trigger planted by an insider. A worm is the closest wrong answer, but nothing spread and the damage waited for a condition.

Defenses: code review and change management for scripts and jobs, separation of duties, least privilege, monitoring of critical files and scheduled tasks, and prompt but reviewed offboarding.

### Rootkit and bootkit (stealth malware)

A rootkit is a set of tools that hides itself and other malware by changing how the system reports files, processes, network connections and drivers. It usually keeps privileged (root or administrator) access. It can live in user space, in the kernel, in a hypervisor, in firmware, or in the boot process (a bootkit).

How it hides:
1. It gains high privilege, often by exploiting a flaw or abusing a vulnerable signed driver.
2. It intercepts the system calls that list processes, files and connections and removes its own entries from the answers.
3. Kernel, firmware and boot-level versions load before or beneath security tools, so those tools cannot see them.

Indicators: differences between what the running system reports and what an outside scan shows, unsigned or unexpected kernel drivers, security tools disabled or failing, boot configuration or boot sector changes, and network traffic from a host whose process list shows nothing responsible.

**Why it matters:** A rootkit makes every check on the infected machine untrustworthy, so cleanup usually means reimaging and, for firmware or boot level, reflashing or replacing hardware.

**Common confusions:** Stealth and privilege define a rootkit, not damage. A Trojan may install a rootkit; the Trojan is the delivery, the rootkit the hiding. Secure Boot and measured boot (with a Trusted Platform Module, TPM) help against bootkits; they do not remove a rootkit already in the running kernel.

**Scenario:** The firewall sees a server sending traffic to an unknown address, but Task Manager and netstat on that server show no process or connection responsible; a scan from boot media finds a hidden driver. The answer is a rootkit, decided by the system lying about its own state. Spyware is the closest wrong answer, but spyware does not normally subvert the operating system's own reporting.

Mini-example of the right check: scan from trusted media outside the running system, compare against a known-good baseline, and rebuild from a trusted image.

### Bloatware (preinstalled unwanted software)

Bloatware is software a device does not need that arrives preinstalled by the manufacturer or bundled with other software: trial programs, games, vendor utilities and updaters. It is usually not malicious, but it uses storage and memory and adds code that can contain vulnerabilities.

How it becomes a risk:
1. The device ships with extra programs, some running at startup or as services.
2. Those programs are rarely patched by the owner because nobody knows they are there.
3. A flaw in one (for example a vendor updater that runs with high privilege) gives attackers a way in.

Indicators: slow new devices, many startup items, unknown vendor services listening on ports, and vulnerability scans flagging software IT never installed.

**Why it matters:** Each unneeded program is extra attack surface to patch and track; removing it is cheap risk reduction.

**Common confusions:** Bloatware is unwanted, not secretly hostile; if a program covertly collects and sends data, it is spyware. The fix is removal of unnecessary software, a 2.5 hardening step; see `### Removal of unnecessary software (attack surface reduction)`.

**Scenario:** A batch of new laptops fails a vulnerability scan because of an outdated vendor support tool that runs as a service with system rights; users never use it. The answer is bloatware, decided by preinstalled unneeded software adding risk. Spyware is the closest wrong answer, but there is no sign of covert data collection.

### Botnet and command and control (C2) beaconing

A botnet is a group of compromised devices (bots) that an attacker controls remotely. The controller sends orders through a command and control (C2) channel, and the bots report back the same way. Botnets supply the volume for distributed denial-of-service (DDoS) attacks, spam, credential stuffing and further malware spread.

How it works:
1. Devices are infected, often internet of things (IoT) devices with default passwords, or PCs through malware.
2. Each bot "beacons": it checks in with the C2 server at regular intervals to get instructions.
3. C2 traffic hides inside common protocols (web, HTTPS, Domain Name System (DNS)) and sometimes legitimate cloud services so it blends in.
4. On command, bots act together: flood a target, send spam, try passwords.

Indicators: a host contacting the same unknown domain at regular intervals, DNS queries with long random-looking subdomains, outbound traffic from devices that should not talk to the internet (cameras, printers), and proxy blocks for known malicious domains.

**Why it matters:** Your devices can become someone else's weapon, causing reputational harm, bandwidth costs and a foothold for later attacks. Blocking the C2 domain or address cuts the bots off from orders.

**Common confusions:** The botnet is the network of controlled devices; the DDoS is one use of it. Beaconing is a C2 indicator, not an attack on its own. The Mirai botnet (2016) recruited cameras and routers by logging in with a short list of factory default credentials, then used them for record DDoS floods.

**Scenario:** A badge printer on the office network sends a small HTTPS request to the same foreign domain every 300 seconds, day and night. The answer is a bot beaconing to C2, decided by regular check-ins from a device that has no reason to talk outside. Data exfiltration is the closest wrong answer, but the requests are tiny and regular rather than large transfers.

Mini-example log line: `07:00:00 printer01 -> upd-check.example-cdn.top:443 512B` repeating every 5 minutes is classic beaconing.

### Virus vs worm vs Trojan vs rootkit vs logic bomb vs spyware (malware comparison)

The decisive question for each malware type is different: how it spreads, how it hides, or what wakes it up. Ransomware and spyware are defined by payload; virus and worm by spreading; Trojan by disguise; rootkit by stealth; logic bomb by trigger; bloatware by being unwanted preinstalled software.

| Type | Decisive feature | Spreads by itself? | Typical clue in a scenario |
|---|---|---|---|
| Virus | Attaches to a host file and runs when it is opened | No, needs a host and an action | Many files altered after one was opened |
| Worm | Self-contained, copies itself over the network | Yes | Fast spread across hosts, no user action |
| Trojan (remote access Trojan (RAT)) | Looks useful, hides a harmful function | No | User installed a wanted program that now calls out |
| Rootkit | Hides itself, keeps privileged access | No | System tools disagree with an outside view |
| Logic bomb | Waits for a date, event or condition | No | Damage at an exact time or after an account change |
| Ransomware | Encrypts or locks data, demands payment | Depends on delivery | Renamed files and ransom notes |
| Spyware / keylogger | Covertly collects and reports data | No | Regular uploads, stolen typed credentials |
| Fileless | Runs from memory and built-in tools | No | Office app spawns encoded PowerShell |
| Bloatware | Unneeded preinstalled software | No | Unused vendor tool flagged by scans |

**Why it matters:** The type tells you the first response. A worm calls for blocking the spreading service and patching; a Trojan for removing the program and checking what it installed; a rootkit for rebuilding from trusted media.

**Common confusions:** Real malware is often blended: a Trojan installs a rootkit, a worm delivers ransomware. Answer with the feature the question stresses. "No one clicked" means worm. "Looked legitimate" means Trojan. "Hidden from the operating system" means rootkit. "At a set time" means logic bomb.

**Scenario:** A question says malware "arrived inside a cracked video editor, then encrypted the user's documents." Two answers fit different parts: Trojan (delivery) and ransomware (payload). If the question asks what the user installed, choose Trojan; if it asks what attack the user suffered, choose ransomware.

### Physical brute force (forced entry)

Physical brute force is getting into a place or a device by force: breaking or prying doors, windows, locks, cabinets, cages or barriers, or ramming through them with a vehicle. It attacks the physical layer that every digital control depends on.

How it shows up:
1. The attacker picks the weakest physical point: a rear door, a fire exit, a ground-floor window, a wiring closet, an unlocked rack.
2. Force defeats the lock or barrier; speed matters more than stealth.
3. Once inside, the attacker steals hardware, plants devices or reaches consoles that trust anyone standing in front of them.

Indicators: damaged frames, broken locks or glass, forced cabinet doors, door-held-open or forced-door alarms from the access control system, and camera footage of entry outside a badge event.

**Why it matters:** Physical access can bypass network controls entirely: a stolen unencrypted drive or a device plugged into an open switch port undoes firewalls and passwords. That is why physical and cyber controls are designed together.

**Common confusions:** Physical brute force is not password brute force. If the clue is a door, a lock or a bollard, it is physical; if the clue is login attempts, it is the password attack, see `### Brute force password attack (online guessing and offline cracking)`. Tailgating (following someone through a door) is social engineering, not force.

**Scenario:** The access control system reports "door forced open" on the loading dock at 03:10 with no badge read, and a server cage lock is found cut. The answer is a physical brute force attack, decided by force with no credential used. Radio frequency identification (RFID) cloning is the closest wrong answer, but a cloned badge would produce a valid badge read, not a forced-door alarm.

Defenses: reinforced doors and frames, quality locks, bollards against vehicles, forced-door and held-door alarms, cameras and lighting, locked racks, and encrypted drives so stolen hardware yields no data.

### Radio frequency identification (RFID) badge cloning

RFID cloning is reading the data from a contactless access badge or key fob and writing it to a blank card so the copy opens the same doors. It works best against older low-frequency proximity cards (often 125 kHz) that send the same fixed number every time with no encryption or authentication.

How it works:
1. The attacker gets a reader close to the victim's badge (in a queue, an elevator, a crowded entrance), sometimes with a boosted antenna hidden in a bag.
2. The reader captures the card's site code and card number in seconds.
3. The attacker writes that data to a writable blank card or fob.
4. The access control system sees a valid, known badge and opens the door.

Indicators: a badge used at two locations at nearly the same time, a badge used at odd hours by someone known to be away, a door opening on a badge whose owner says they were elsewhere, and camera footage that does not match the badge holder.

**Why it matters:** The access log shows a legitimate employee entering, so the breach is hidden behind a trusted identity. Cheap handheld cloners are widely sold, which makes this a low-skill attack.

**Common confusions:** Cloning copies a credential; skimming or eavesdropping only captures data. Cloning is a physical attack because the result is physical entry. Smart cards that use encryption and mutual authentication (for example 13.56 MHz smart cards that use an encrypted challenge-response, with their factory default keys replaced) resist simple copiers, while plain proximity cards do not. The frequency alone does not make a card secure; the cryptography does.

**Scenario:** The badge log shows an engineer's badge opening the lab door at 22:40 while the engineer was on a flight, and no door was forced. The answer is RFID cloning, decided by a valid badge read without the real holder. Physical brute force is the closest wrong answer, but nothing was forced and the system logged a good credential.

Defenses: encrypted smart cards with authentication, badge plus personal identification number (PIN) or biometric (multifactor), RFID-shielding sleeves, anti-passback rules, and reviewing badge logs against cameras.

### Environmental attacks (power, cooling, building systems)

An environmental attack targets the conditions systems need to run: power, heating, ventilation and air conditioning (HVAC), humidity, fire suppression and other building controls. The goal is usually availability: overheat, flood or power down equipment, or trigger safety systems.

How it happens:
1. Building automation systems (HVAC, lighting, access control, power management) are increasingly networked and sometimes reachable from the internet or the corporate network.
2. They often run old firmware, unencrypted control protocols and default or hard-coded passwords.
3. An attacker who reaches the controller changes set points: turns off cooling in a data center, raises humidity, cuts power, or sets off sprinklers. Physical tampering (cutting power feeds, disabling generators) achieves the same.

Indicators: unexplained temperature or humidity alarms, HVAC or power settings changed outside maintenance windows, logins to building controllers from unusual places, and many servers shutting down for thermal reasons at once.

**Why it matters:** Equipment damage and outages can be as costly as a data breach, and an internet-exposed building system can also be a path into the enterprise network. An attacker who controls the cooling controller can overheat a data center without touching a single server.

**Common confusions:** Environmental attacks are listed with physical attacks because the effect is on the physical environment, even when the method is a network login. A natural disaster is an environmental threat, not an attack, unless someone caused it.

**Scenario:** Overnight, a colocation room's cooling set point is changed from 20 to 35 degrees Celsius through the building management web portal, and servers shut down on overheating. The answer is an environmental attack, decided by manipulating cooling to hurt availability. A distributed denial-of-service (DDoS) is the closest wrong answer, but no traffic flood occurred; the servers stopped because of heat.

Defenses: segment building systems away from corporate IT and the internet, change default passwords, require multifactor authentication (MFA) for remote access, monitor temperature and power independently, and keep backup power and redundant cooling.

### Denial-of-service (DoS) and distributed denial-of-service (DDoS)

A denial-of-service (DoS) attack makes a service unavailable to legitimate users by exhausting something it needs: bandwidth, connection tables, processor (CPU), memory or application threads. A distributed DoS (DDoS) does the same from many sources at once, usually a botnet. It attacks availability.

Main families:
1. Volumetric (network) floods: saturate the link with more traffic than it can carry, often using reflection and amplification.
2. Protocol or state exhaustion: fill connection tables, for example a SYN flood that leaves half-open connections.
3. Application or service exhaustion: send expensive requests (search queries, logins, large downloads) that tie up the server without needing much bandwidth.

Indicators: sudden traffic far above the baseline, many sources hitting one target, slow or failed connections for all users, full connection tables, servers crash-looping or repeatedly restarting, and upstream provider alerts.

**Why it matters:** Lost sales, missed service levels and sometimes a smokescreen for another intrusion happening at the same time.

**Common confusions:** DoS comes from one source and can be blocked by blocking that source; DDoS comes from many, so blocking single addresses fails. A slow website caused by a legitimate traffic spike (a product launch) is not an attack; compare against expected events. Ransomware also hurts availability, but by encrypting data, not by flooding.

**Scenario:** A ticket site goes down minutes after sales open; the logs show 80,000 different addresses each sending a few requests per second to the search page. The answer is a DDoS (application-layer), decided by many sources exhausting one service. A DoS is the closest wrong answer, but a single source would show one or a few addresses.

Defenses: upstream filtering by the internet provider or a DDoS scrubbing service, a content delivery network (CDN), rate limiting, SYN cookies, autoscaling, and a response plan with provider contacts ready.

### Reflected and amplified DDoS (reflection amplification)

In a reflected attack, the attacker sends requests to third-party servers (reflectors) with the victim's address forged as the source, so the replies go to the victim. In an amplified attack, the attacker picks requests whose replies are much larger than the requests, multiplying the traffic. Most large floods do both at once.

How it works:
1. The attacker finds open services that answer over User Datagram Protocol (UDP), which has no handshake, so the source address is not verified.
2. The attacker sends small queries with the victim's address forged as the sender (Internet Protocol (IP) spoofing).
3. Each reflector sends its reply, often many times larger, to the victim.
4. Thousands of reflectors together overwhelm the victim's link, while the attacker stays hidden behind them.

Commonly abused services include Domain Name System (DNS), the Network Time Protocol (NTP), memcached, the Connectionless Lightweight Directory Access Protocol (CLDAP) and the Simple Service Discovery Protocol (SSDP). Measured bandwidth amplification factors reported by the Cybersecurity and Infrastructure Security Agency (CISA) include DNS about 28 to 54 times, NTP about 557 times and memcached about 10,000 to 51,000 times.

Indicators: a flood of UDP replies (DNS answers, NTP responses) the victim never asked for, from many legitimate-looking servers, all sent from the abused service's own port (for example source port 53 for DNS or 123 for NTP).

**Why it matters:** A small botnet can produce a huge flood, and blocking the reflectors is hard because they are legitimate servers.

**Common confusions:** Reflected means "someone else sends it to you" (spoofed source); amplified means "the reply is bigger than the request." An attack can be reflected without amplification. Spoofing source addresses works for UDP because there is no handshake; Transmission Control Protocol (TCP) must complete a three-way handshake with the real address before a service sends any large reply, so it is far less useful for amplification.

**Scenario:** A company receives 200 Gbps of DNS responses from 15,000 open resolvers, though its own servers sent no DNS queries. The answer is a reflected and amplified distributed denial-of-service (DDoS), decided by unsolicited large replies from third parties. A direct DDoS from a botnet is the closest wrong answer, but here the traffic comes from legitimate resolvers answering forged queries.

Defenses: upstream filtering and remotely triggered blackholing with the provider, ingress filtering of spoofed sources by networks (BCP 38), rate limiting DNS responses, and not running open resolvers or exposed memcached yourself.

### DoS vs DDoS vs reflected vs amplified attacks (comparison)

These four names overlap: one flood can be distributed, reflected and amplified at once. The decisive feature differs for each, so read what the question stresses.

| Term | Decisive feature | Where traffic comes from |
|---|---|---|
| DoS | One source exhausts the target | The attacker's own system |
| Distributed denial-of-service (DDoS) | Many sources at once | A botnet or many reflectors |
| Reflected | Victim's address forged, third parties reply | Legitimate servers (reflectors) |
| Amplified | Replies larger than requests | Servers that send big answers to small queries |

**Why it matters:** The response differs. A single-source DoS can be blocked at the firewall; a DDoS needs upstream filtering or scrubbing; reflection is reduced by ingress filtering against spoofing and by closing open reflectors; amplification by limiting response sizes and rates on your own services.

**Common confusions:** "Reflected" says nothing about size, and "amplified" says nothing about spoofing, even though they are usually combined. A DDoS does not have to be reflected; a botnet flooding directly is still distributed.

**Scenario:** An attacker with one server sends forged 60-byte queries to 5,000 Network Time Protocol (NTP) servers, each returning a reply hundreds of times larger to the victim. The best full answer is a reflected, amplified DDoS: distributed because 5,000 servers send, reflected because the source is forged, amplified because replies are larger. Calling it a plain DoS fails because the traffic arrives from many sources.

### Domain Name System (DNS) attacks: poisoning, hijacking and tunneling

DNS attacks tamper with or abuse name resolution. They send users to the wrong server while the address bar still shows the right name, or they use DNS as a hidden channel. They attack integrity (wrong answers) and sometimes confidentiality (data smuggled out).

Main forms:
1. DNS cache poisoning (spoofing): false records are planted in a resolver's cache or a host's local hosts file, so lookups return the attacker's address.
2. Domain or DNS hijacking: the attacker takes over the domain's registration or the account that manages its DNS records and changes them (for example name server, web or mail records). With control of DNS, the attacker can even obtain valid certificates, so users see no warning.
3. DNS tunneling and DNS command and control (C2): data and commands are encoded in DNS queries and replies (long subdomains, TXT records), because DNS is allowed out of most networks.
4. DNS amplification: open resolvers used to reflect and amplify a distributed denial-of-service (DDoS).

Indicators: users reaching a phishing look-alike while typing the correct name, DNS records changed without a change ticket, new certificates issued for your domains that you did not request (seen in certificate transparency logs), and hosts sending many long, random-looking DNS queries.

**Why it matters:** Whoever controls name resolution controls where email and web traffic goes, so one change redirects every user.

**Common confusions:** Poisoning corrupts a cache; hijacking changes the authoritative records at their source. DNS Security Extensions (DNSSEC) sign records so resolvers can detect forged answers (origin authentication and integrity), but DNSSEC gives no confidentiality and no DoS protection, and it does not help if the attacker controls your registrar account.

**Scenario:** Overnight, a company's mail exchanger record points to an unknown provider, and the DNS hosting account shows a login from a new country. The answer is domain (DNS) hijacking, decided by changes at the authoritative source through a stolen account. Cache poisoning is the closest wrong answer, but poisoning affects one resolver's cache, not the records themselves.

Defenses: multifactor authentication (MFA) and registrar lock on DNS accounts, audits of public records, certificate transparency monitoring, DNSSEC, and filtering outbound DNS through company resolvers.

### Wireless attacks: deauthentication, jamming, evil twin and rogue access point

Wireless attacks target Wi-Fi itself. The four to know are deauthentication (forcing clients off), jamming (radio interference), a rogue access point (any unauthorized access point, AP) and an evil twin (a rogue AP that impersonates a real network name).

How each works:
1. Deauthentication: the attacker sends forged management frames telling clients to disconnect. Older networks did not protect management frames, so clients obeyed. Protected Management Frames (PMF, from IEEE 802.11w) add cryptographic protection to deauthentication and disassociation frames, so forged ones are rejected; PMF is mandatory in WPA3.
2. Jamming: strong radio noise on the Wi-Fi channels so nobody can communicate; a pure availability attack that no encryption setting prevents.
3. Rogue access point: an AP connected to the network without approval, sometimes an employee's home router, creating an unmanaged door.
4. Evil twin: the attacker broadcasts the same network name (SSID) with a stronger signal or after knocking clients off the real one, then captures logins on a fake portal and sits on-path.

Indicators: many clients disconnecting at once, two APs advertising the same SSID with different hardware addresses (BSSIDs) or security settings, captive portals asking for corporate passwords, and certificate warnings when joining the company network.

**Why it matters:** Wireless reaches outside the walls, so an attacker in the car park can deny service or harvest credentials.

**Common confusions:** A rogue AP is defined by being unauthorized; an evil twin by imitating a legitimate network. Deauthentication is often the first step of an evil twin attack. Jamming is noise, not frames, and no password setting stops it. A shared Wi-Fi password (WPA2 or WPA3 Personal) does not stop a twin run by someone who knows the password; 802.1X with server certificate checks does.

**Scenario:** At a conference, attendees keep dropping off "Expo-WiFi" and rejoin a network of the same name that asks them to sign in with their corporate email password. The answer is an evil twin, preceded by deauthentication. A rogue access point is the closest wrong answer; it is technically a rogue AP too, but imitating the real SSID to trick users is what makes it an evil twin.

Defenses: WPA3 with PMF, 802.1X (WPA2 or WPA3 Enterprise) with certificate validation, wireless intrusion prevention (WIPS) and site surveys, and a virtual private network (VPN) on untrusted networks.

### On-path attack (man-in-the-middle, ARP poisoning, SSL stripping)

An on-path attack (formerly man-in-the-middle, also adversary-in-the-middle) places the attacker between two parties so their traffic passes through the attacker, who can read, change or relay it. It attacks confidentiality and integrity.

How attackers get on-path:
1. Address Resolution Protocol (ARP) poisoning on a local network: forged ARP replies map the gateway's Internet Protocol (IP) address to the attacker's hardware (MAC) address. ARP has no authentication, so hosts accept the false mapping.
2. Rogue or evil twin Wi-Fi, or Domain Name System (DNS) manipulation, steering traffic to the attacker.
3. A malicious reverse proxy that relays a real login page and captures passwords and session tokens.
4. On-path browser (man-in-the-browser): malware inside the browser alters pages and transactions.
Once on-path, the attacker may try to downgrade HTTPS to HTTP (Secure Sockets Layer (SSL) stripping) or present fake certificates.

Indicators: one MAC address answering for several IP addresses, the gateway's MAC suddenly changing, bursts of unsolicited (gratuitous) ARP replies, certificate warnings, and sites that should be HTTPS loading as HTTP.

**Why it matters:** Passwords, session cookies and transactions can be stolen or altered while both ends think they are talking directly.

**Common confusions:** On-path is about position. Replay reuses captured data later and does not need to stay in the path. Session hijacking can follow from on-path interception. Encryption with proper certificate validation (Transport Layer Security (TLS)) makes an on-path position much less useful.

**Scenario:** On a coffee shop network, a laptop's ARP table lists the gateway 192.0.2.1 with the same MAC address as another customer's machine at 192.0.2.57. The answer is an on-path attack via ARP poisoning, decided by the gateway mapping to an attacker's MAC. An evil twin is the closest wrong answer, but the victim joined the real network; the redirection happened at ARP.

Mini-example: `arp -a` showing `192.0.2.1 aa-bb-cc-11-22-33` and `192.0.2.57 aa-bb-cc-11-22-33` (two IPs, one MAC) is the textbook clue.

Defenses: dynamic ARP inspection with Dynamic Host Configuration Protocol (DHCP) snooping on switches, TLS everywhere with HTTP Strict Transport Security (HSTS), certificate validation, virtual private network (VPN) on untrusted networks, and teaching users that certificate errors are a stop sign.

### Credential replay (pass the hash, pass the ticket, token replay)

Credential replay is capturing authentication material (a password hash, a Kerberos ticket, a session or refresh token, or a cleartext login) and presenting it again to log in as the victim, without knowing or cracking the password. It attacks authentication and leads to lateral movement.

How pass the hash works:
1. The attacker gets admin rights on one machine and dumps cached credentials from memory.
2. Windows NT LAN Manager (NTLM) authentication accepts the password hash as proof, so the hash itself works as the credential.
3. The attacker authenticates to other servers with that hash, moving laterally.
Pass the ticket does the same with stolen Kerberos tickets; token replay reuses a stolen cloud session or refresh token.

Indicators: network logons (NTLM, logon type 3) from a workstation to many servers without a matching interactive logon, an admin account used from a machine its owner never uses, and identity alerts for anomalous tokens used from unfamiliar locations or devices.

**Why it matters:** One compromised workstation becomes domain-wide access, and multifactor authentication (MFA) may not help when a token issued after MFA is replayed.

**Common confusions:** Credential replay is listed under network attacks; application replay (reusing a session cookie or transaction) is listed under application attacks. Cracking recovers the plaintext from a hash; pass the hash uses the hash as is. Credential stuffing uses real username and password pairs from other breaches, not captured hashes or tokens.

**Scenario:** Logs show the help desk admin account authenticating with NTLM from a marketing laptop to 25 servers in ten minutes, and that admin never signed in on the laptop interactively. The answer is credential replay (pass the hash), decided by a reused hash moving laterally. Brute force is the closest wrong answer, but there were no failed attempts; every logon succeeded first time.

Defenses: never use domain admin accounts on workstations, unique local admin passwords, no domain users as local admins on many machines, prefer Kerberos over NTLM, protect credentials in memory, and short token lifetimes with token binding where available.

### Malicious code delivered over the network (scripts, web skimmers, mobile code)

Malicious code is harmful code in any form (executables, scripts, macros, browser scripts, code injected into a website) that reaches a system over the network and runs there. It is a broad category: the objective lists it under network attacks, for cases where the delivery of hostile code is the point, rather than a specific malware family.

Common forms:
1. Malicious mobile code: script sent from a remote site and run in the user's browser or app without an explicit decision (JavaScript, VBScript).
2. Web skimming (Magecart-style): attackers alter a payment page or a third-party script it loads so card details typed by customers are copied to the attacker.
3. Malicious scripts in email or downloads (PowerShell, macros) that fetch further payloads.
4. Exploit code sent to a vulnerable network service.

Indicators: unexpected changes to scripts on a web server, a payment page loading a script from an unknown domain, browsers contacting odd domains during checkout, and endpoint alerts for script engines launching from email attachments.

**Why it matters:** One altered script on a checkout page can expose every customer who pays during the attack; in 2018 attackers edited a script file on an airline's website so that payment card details typed by customers were also sent to a look-alike domain the attackers controlled, and in 2020 the data protection regulator fined the airline 20 million pounds.

**Common confusions:** Malicious code is the umbrella; a virus, worm or Trojan is malicious code with a specific behavior. Cross-site scripting (XSS) is one way malicious script ends up running in a victim's browser; for the vulnerability itself, see `### Cross-site scripting (XSS) vulnerability`.

**Scenario:** A web store's checkout page starts loading `analytics-cdn.example.top/c.js`, which nobody added, and card fraud reports cluster on recent customers. The answer is malicious code (a web skimming script), decided by injected code on the page stealing input. Spyware is the closest wrong answer, but the code runs on the store's page in customers' browsers, not as installed software on a device.

Defenses: watching web content and third-party scripts for unapproved changes, application allow lists on endpoints, anti-malware with behavior monitoring, patching and input validation.

### Injection attacks: SQL, LDAP, XML, command and DLL injection

An injection attack gets attacker-supplied code run by a system. Most kinds hide code inside input that an application passes to an interpreter: a database for Structured Query Language (SQL) injection, a directory for Lightweight Directory Access Protocol (LDAP) injection, an Extensible Markup Language (XML) parser, or an operating system shell for command injection. Dynamic-link library (DLL) injection is different: it forces a running Windows process to load a malicious library.

How interpreter injection works:
1. The application builds a query or command by gluing user input into its own text.
2. The attacker's input contains syntax (a quote, a semicolon, a comment marker) that ends the intended part and starts new instructions.
3. The interpreter cannot tell data from code, so it runs the attacker's logic: read or change data, log in without a password, run admin functions or system commands.
The common wrong fix is escaping or filtering input by hand; the primary fix is parameterized queries (prepared statements) that keep code and data separate.

How DLL injection works: the attacker allocates memory in another process, writes the path of a malicious DLL there, and starts a remote thread that loads it, so the code runs inside a trusted process and inherits its access.

Indicators: input fields and web logs containing quotes, `OR 1=1`, `UNION SELECT`, `--` comments, semicolons followed by shell commands, or LDAP filter characters such as `*)(`; database errors shown to users; for DLL injection, endpoint detection and response (EDR) alerts for remote thread creation and unexpected unsigned DLLs in a process.

**Why it matters:** One injectable field can expose or alter an entire database or run commands on the server.

**Common confusions:** Injection attacks the server-side interpreter; cross-site scripting (XSS) puts script into pages that run in other users' browsers. Input validation helps, but parameterized queries are the main defense for SQL injection. For the underlying weakness, see `### Structured Query Language injection (SQLi) vulnerability` and `### Memory injection (process injection and DLL injection)`; objective 2.4 is about spotting the attack.

**Scenario:** A login log shows the username `admin'--` followed by a successful login with an empty password. The answer is SQL injection, decided by SQL syntax in an input field that changed the query. Brute force is the closest wrong answer, but there was one attempt, not many guesses.

Mini-example log line: `POST /login user=admin'-- pass= 200 OK` (the quote closes the string and `--` comments out the password check).

Defenses: parameterized queries, allow-list validation for values that cannot be parameters (column names, sort order), least privilege database accounts, a web application firewall (WAF) as a backstop, and EDR blocking injection behavior sequences.

### Buffer overflow attack indicators (memory corruption exploitation)

A buffer overflow attack sends more data than a program's fixed-size memory area (buffer) can hold, so the extra data overwrites neighboring memory. The goal is to crash the program (denial of service) or to overwrite control data so the program runs the attacker's code.

How the attack goes:
1. The attacker finds an input the program copies into a buffer without checking its length.
2. They send an oversized input, often padded with one repeated character.
3. The overflow overwrites a return address or pointer to redirect execution to attacker-chosen code.
4. Protections make step 3 harder: data execution prevention (DEP) refuses to run code from memory that was not marked executable, and address space layout randomization (ASLR) moves code and data to unpredictable addresses. Exploits chain extra tricks to get around them.

Indicators: an application or service that crashes or restarts repeatedly, crash dumps showing access violations, requests or packets with extremely long fields (thousands of the same character), and a crashed service followed by an unexpected new process or shell.

**Why it matters:** A remotely reachable overflow can give code execution with the service's privileges, which is a common path to full system compromise.

**Common confusions:** Objective 2.3 treats the overflow as a weakness in code (see `### Buffer overflow vulnerability`); here the clue is the attack in progress. Memory injection puts code into a running process's memory by other means; a buffer overflow gets there by overrunning a buffer. A denial-of-service (DoS) caused by a crash is still an overflow if the cause is oversized input.

**Scenario:** A file transfer service restarts every few minutes, and each crash follows a login request whose username field is 6,000 bytes of the letter A. The answer is a buffer overflow attack, decided by oversized input causing memory crashes. Structured Query Language (SQL) injection is the closest wrong answer, but there is no query syntax in the input, only length.

Mini-example: `USER AAAAAAAA...(6000 x A)` in a service log, followed by "service terminated unexpectedly."

Defenses: patching, bounds-checked input handling and memory-safe languages, DEP and ASLR, and exploit protection on endpoints.

### Replay attack and session hijacking (application replay)

A replay attack captures a valid message (a session token, cookie, signed request or transaction) and sends it again later to impersonate the user or repeat the action. Session hijacking is the common web case: the attacker steals the session identifier the server uses to recognize a logged-in user and takes over that session.

How session hijacking works:
1. The user logs in and the server issues a session token, usually in a cookie.
2. The attacker obtains it: sniffing unencrypted traffic, an on-path position, cross-site scripting (XSS) reading the cookie, malware in the browser, or guessing a weak token.
3. The attacker presents the token from their own browser and is treated as the user, with no password and no new multifactor authentication (MFA) prompt, because the login already happened.

Indicators: the same session used from two different Internet Protocol (IP) addresses or devices at once, a session continuing from a new country without a new login, sudden changes in user agent mid-session, and identity alerts for anomalous tokens.

**Why it matters:** Hijacked sessions bypass passwords and MFA, giving full access to the account until the session ends.

**Common confusions:** Replay reuses captured data; on-path is about sitting in the traffic flow live. Credential replay (pass the hash) is the network version; application replay targets sessions and transactions. Defenses that stop replay add freshness: one-time tokens, nonces, timestamps and short expiry.

**Scenario:** A shopper's account places an order from an unknown laptop in another city while the shopper is still browsing; logs show the same session ID on both devices and no new login. The answer is session hijacking (replay of a session token), decided by one session used from two places with no fresh authentication. Credential stuffing is the closest wrong answer, but that would produce new logins with a password, not a reused session.

Defenses: HTTPS everywhere, cookies marked Secure and HttpOnly with SameSite set, long random session IDs, a new session ID at login and privilege change, idle and absolute timeouts, and re-authentication for sensitive actions.

### Privilege escalation (vertical and horizontal)

Privilege escalation is gaining more access than an account was given. Vertical escalation moves up (standard user to administrator, root or SYSTEM); horizontal escalation moves sideways to another user's data or functions at the same level.

How vertical escalation usually happens:
1. The attacker has a foothold with low rights.
2. They exploit a flaw in the operating system, kernel, a driver or a service running with high rights, or abuse a misconfiguration (a writable service path, weak permissions, a setuid binary).
3. The exploited code runs with the higher privilege and the attacker creates admin accounts or dumps credentials.
Attackers also bring a legitimately signed but vulnerable driver to reach kernel mode (bring your own vulnerable driver).

Horizontal escalation usually comes from broken access control in an application, such as changing an account number in a URL to view someone else's records.

Indicators: a standard account suddenly running admin tools, new members of admin groups, a service account creating users, kernel driver loads that are unusual, and a user retrieving records that belong to other users.

**Why it matters:** Escalation turns a small compromise into control of the system or the domain.

**Common confusions:** Escalation is about rights gained, not about getting in. Least privilege limits the damage; patching removes many escalation flaws. Horizontal is still escalation even though the privilege level does not rise.

**Scenario:** A call center user's account adds itself to the local Administrators group two minutes after running an unknown tool that exploits a print service flaw. The answer is vertical privilege escalation, decided by a low-rights user obtaining admin rights through a flaw. Credential replay is the closest wrong answer, but the user did not reuse someone else's credentials.

Defenses: patching, least privilege, blocking known vulnerable drivers, application control, monitoring group membership changes, and object-level authorization checks in applications.

### Request forgery: cross-site request forgery (CSRF) and server-side request forgery (SSRF)

Request forgery tricks a trusted party into sending a request the attacker wants. In cross-site request forgery (CSRF), a malicious page makes a logged-in user's browser send an unwanted request to a site that trusts it. In server-side request forgery (SSRF), the attacker makes a server fetch a URL of the attacker's choosing, often reaching internal systems the attacker cannot reach directly.

How CSRF works:
1. The victim is logged in to a site; the browser holds its session cookie.
2. The victim opens an attacker's page or email, which silently submits a form or request to that site.
3. The browser automatically attaches the session cookie, so the site processes the request as the victim's.

How SSRF works:
1. The application takes a URL from the user (an image to import, a webhook, a preview link).
2. The attacker supplies an internal address instead, such as an admin page on localhost or a cloud metadata service (169.254.169.254).
3. The server fetches it from inside the network and may return secrets such as cloud credentials.

Indicators: CSRF shows as state-changing requests with a foreign referrer or no anti-forgery token; SSRF shows as the server making requests to internal addresses, loopback or metadata endpoints, often triggered by a user-supplied URL parameter.

**Why it matters:** CSRF can move money or change account settings in the victim's name; SSRF can expose internal services and cloud keys.

**Common confusions:** Cross-site scripting (XSS) runs attacker script in the browser; CSRF only sends a request and cannot read the response. A working XSS flaw defeats CSRF defenses, because script on the site can read the token. CSRF abuses the site's trust in the browser; SSRF abuses the internal network's trust in the server.

**Scenario:** A web app's "import image from URL" feature is given the cloud metadata address 169.254.169.254 as its URL and returns text containing access keys. The answer is SSRF, decided by the server fetching an internal address for the attacker. CSRF is the closest wrong answer, but no victim's browser was involved.

Defenses: CSRF: unpredictable anti-CSRF tokens on state-changing requests, SameSite cookies, never changing state with GET. SSRF: allow lists of destinations, no redirects, blocking internal and metadata addresses, network segmentation, and, as an extra layer, the cloud provider's hardened metadata service (for example version 2 of the Amazon Web Services instance metadata service, which demands a session token that a simple forged fetch does not carry).

### Directory traversal (path traversal, dot-dot-slash)

Directory traversal manipulates a file path supplied in input so the application reads or writes files outside the folder it should use. The classic tool is `../` (or `..\` on Windows), which moves up one directory level each time; an absolute path such as `/etc/passwd` can also escape the intended folder.

How it works:
1. The application builds a file path from user input, for example `/var/www/files/` plus a requested name.
2. The attacker supplies `../../../../etc/passwd` or an encoded form such as `%2e%2e%2f`.
3. The operating system resolves the dots, and the file outside the folder is returned or overwritten.
Removing `../` once is a common failed fix: attackers use backslashes, double encoding or nested sequences (`....//`) that become `../` after the filter.

Indicators: web logs with `../`, `..\`, `%2e%2e%2f` or `%252e` in parameters, requests for system files (passwd, win.ini, web.config), and error messages revealing full server paths.

**Why it matters:** Attackers can read configuration files with passwords, source code and keys, and sometimes write files that lead to code execution.

**Common confusions:** Traversal reaches files through paths; injection runs code through an interpreter. Traversal is an access control failure on the file system, so least privilege on the service account limits what it can read.

**Scenario:** A web log shows `GET /download?file=..%2f..%2f..%2fapp%2fconfig%2fsecrets.yml 200`. The answer is directory traversal, decided by encoded dot-dot-slash sequences escaping the download folder. Command injection is the closest wrong answer, but no shell command was sent, only a path.

Defenses: decode once, then canonicalize the path (resolve it fully) and check it is still inside the allowed folder; map file IDs to approved names instead of accepting paths; strict allow lists; least privilege for the service account; minimal error messages.

### Downgrade attack (protocol rollback, SSL stripping)

A downgrade attack forces two parties to use an older or weaker protocol version or cipher than both actually support, so the attacker can break or read the connection. It needs an on-path position to interfere with the negotiation.

How it works:
1. Client and server begin negotiating the highest version and strongest cipher both support.
2. The attacker interferes, for example by making the first attempt fail so the client retries with an older version, or by altering what is offered.
3. The connection settles on a weak, legacy option, such as the broken Secure Sockets Layer (SSL) 3.0, and the attacker exploits that weakness.
SSL stripping is a related on-path trick: the attacker keeps the victim on plain HTTP while talking HTTPS to the real site.

Indicators: connections negotiating legacy protocol versions or weak ciphers when both sides support modern ones, clients unexpectedly using HTTP for sites that are normally HTTPS, and certificate or security warnings on networks the user does not control.

**Why it matters:** A strong protocol gives no protection if an attacker can push the session down to a weak one. In 2014 the POODLE attack used a forced fallback to SSL 3.0 to decrypt secrets such as cookies one byte at a time.

**Common confusions:** A downgrade attack does not break modern cryptography; it avoids it. Disabling legacy versions is the real fix: SSL in every version is legacy and broken, and Transport Layer Security (TLS) 1.0 and 1.1 were formally deprecated by the Internet Engineering Task Force (IETF) in 2021, leaving TLS 1.2 as the minimum. TLS_FALLBACK_SCSV is a marker a client adds when it retries with an older version; a server that supports something newer then refuses the connection, so a forced fallback fails (both ends must support it). HTTP Strict Transport Security (HSTS) stops SSL stripping for sites the browser already knows, or for preloaded sites.

**Scenario:** On hotel Wi-Fi, a user's banking session loads as plain HTTP with no padlock, while the bank only serves HTTPS. The answer is SSL stripping, a downgrade-style on-path attack, decided by a secure session pushed to plaintext. A collision attack is the closest wrong answer, but nothing about hashes is involved.

Defenses: disable SSL and old TLS versions and weak ciphers on servers and clients, support TLS_FALLBACK_SCSV, deploy HSTS (and preload), and use a virtual private network (VPN) on untrusted networks.

### Hash collision attack

A collision is two different inputs that produce the same hash value. A collision attack deliberately builds such a pair so that something forged carries the same hash, and therefore the same signature or integrity check, as something legitimate. It attacks integrity and the trust built on digital signatures.

How it is used:
1. The attacker prepares two inputs, one harmless and one malicious, crafted to share a hash under a weak algorithm.
2. A trusted party signs or approves the harmless one, because a signature covers the hash.
3. The attacker swaps in the malicious one; its hash matches, so the signature still verifies.

Real cases: in 2008 researchers used an MD5 collision to build a rogue certificate authority certificate that carried a real commercial certificate authority's signature and that browsers would have trusted, and in 2017 researchers produced two different Portable Document Format (PDF) files with the same SHA-1 hash (SHAttered), using a huge but feasible amount of computing.

Indicators: signed files or certificates using MD5 or SHA-1, two different files reported with the same hash, and certificates you did not request appearing valid.

**Why it matters:** If an attacker can forge a collision, software signing, certificates and file integrity checks based on that hash can no longer be trusted.

**Common confusions:** The collision is the result (two inputs, one hash); the birthday attack is the probability shortcut that makes finding any collision cheaper than expected. Collisions do not reveal passwords; that is cracking. In a collision attack the attacker builds both inputs; forging a match for a file that someone else already made is a different and much harder problem (a second preimage). MD5 and SHA-1 are broken for collision resistance; use SHA-256 or stronger (SHA-2 or SHA-3 families). For digest sizes, see `### Hash functions: digest size and status (reference)`.

**Scenario:** An update server accepts any package whose SHA-1 hash is on a signed list. A supplier submits a harmless package that it built together with a malicious twin crafted to have the same SHA-1 value; the harmless one is approved and listed, and the supplier then ships the twin. The answer is a collision attack, decided by two different files, prepared as a pair, sharing one hash. A downgrade attack is the closest wrong answer, but no protocol negotiation was weakened.

### Birthday attack (birthday paradox)

A birthday attack uses the birthday paradox: when you look for any two items that match, rather than a match to one specific item, far fewer tries are needed. For a hash with n bits of output, a collision is expected after roughly 2 to the power n/2 attempts, the square root of the number of possible outputs. National Institute of Standards and Technology (NIST) rates a hash's collision resistance at half its output length for this reason.

How it works:
1. The attacker generates many variants of a harmless message and many of a malicious one (tiny invisible changes, extra spaces).
2. They hash all of them and look for any harmless and malicious pair with the same hash.
3. Because any pair counts, the search ends far sooner than matching one fixed hash would.

Worked example: in a room of 23 people there is about a 50% chance that two share a birthday, though there are 365 days. Likewise a 64-bit hash is expected to collide after roughly 2 to the 32nd hashes (about 4.3 billion gives close to a 40% chance, and about 5.1 billion gives 50%), not 2 to the 64th. A 256-bit hash pushes this to 2 to the 128th, which is out of reach.

**Why it matters:** It explains why short hashes fail sooner than their length suggests and why longer outputs (SHA-256 and above) are required for signatures.

**Common confusions:** Birthday is the method; collision is the outcome. Finding a second input that matches one given hash (a second preimage) is much harder than finding any colliding pair, which is why the birthday bound only applies to collisions. Salting passwords defends against precomputed tables, not against birthday attacks on signatures.

**Scenario:** A question says an attacker generated millions of slightly different contracts, hashed them with a 64-bit hash and found a pair with the same value. The answer is a birthday attack, decided by searching for any matching pair among many variants. Brute force is the closest wrong answer, but brute force targets one specific value and would need far more tries.

### Downgrade vs collision vs birthday attacks (cryptographic attack comparison)

The three cryptographic attacks in this objective break different things. A downgrade attack weakens the protocol choice; a collision breaks a hash's uniqueness; a birthday attack is the math that makes collisions affordable.

| Attack | What is attacked | Needs | Decisive clue | Main defense |
|---|---|---|---|---|
| Downgrade | Version or cipher negotiation | On-path position | Legacy protocol or HTTP where modern is supported | Disable legacy Transport Layer Security (TLS) and Secure Sockets Layer (SSL) versions, TLS_FALLBACK_SCSV, HTTP Strict Transport Security (HSTS) |
| Collision | Hash uniqueness (integrity, signatures) | A weak hash such as MD5 or SHA-1 | Two different files, one hash | SHA-256 or stronger |
| Birthday | Probability of any matching pair | Many generated variants | Search for any pair, not one target | Longer hash outputs |

**Why it matters:** The fix differs: configuration for downgrade, algorithm choice for collisions, output length for birthday.

**Common confusions:** None of these "break" strong modern encryption directly. A downgrade swaps in weak crypto; collisions exploit an already weak hash; the birthday bound is why output length matters.

**Scenario:** A team asks why their 128-bit hash gives only 64 bits of collision resistance. The answer points to the birthday attack: collisions take about the square root of the output space. Pointing to a downgrade attack fails because nothing about protocol negotiation is involved.

### Password spraying

Password spraying tries one or a few common passwords against many accounts, slowly, so that no single account crosses its lockout threshold. Attackers pick passwords that fit the organization's complexity rules (season plus year plus a symbol).

How it works:
1. Collect a list of usernames (email format, directory, public sources).
2. Try one likely password against every account.
3. Wait long enough to stay under lockout and detection thresholds, then try the next password.
4. Target services that accept passwords directly: webmail, single sign-on portals, remote access, virtual private network (VPN), cloud apps.

Indicators: authentication failures spread across many accounts, each with only one or two failures, from the same source or a small set of sources, within a short window; the same password pattern in failures; and occasional successes among them. Windows logs failed logons as event 4625; identity platforms flag spray patterns.

**Why it matters:** One weak password among thousands is enough for an attacker to get in, and spraying is designed to avoid the lockout alarms.

**Common confusions:** Spraying is few passwords, many accounts. Brute force is many passwords, one account (and triggers lockout online). Credential stuffing uses real username and password pairs leaked elsewhere, one known pair per account. Account lockout as an indicator usually points to brute force, because spraying avoids it.

**Scenario:** Sign-in logs show 1,800 accounts each failing once with `Autumn2026!` from one address range over 40 minutes, then the same accounts failing once with `Winter2026!` an hour later. The answer is password spraying, decided by one password per round across many accounts. Brute force is the closest wrong answer, but no single account received many guesses.

Defenses: multifactor authentication (MFA), especially on internet-facing logins, blocking common and breached passwords, smart lockout and risk-based sign-in, conditional access by device or location, and alerting on failures across many accounts.

### Brute force password attack (online guessing and offline cracking)

A brute force password attack tries a very large number of passwords until one works. Online brute force guesses against a live login; offline brute force (cracking) guesses against stolen password hashes on the attacker's own hardware, where no lockout applies.

How offline cracking works:
1. The attacker steals hashes: a database dump, credential dumping from a host, or device configuration files.
2. They hash candidate passwords (every combination, or words and rules) and compare with the stolen hashes, using graphics processors (GPUs) for billions of guesses per second against fast hashes.
3. Matches give plaintext passwords, which are then used anywhere the user reused them.

Online indicators: many failed logins against one account in a short time, account lockouts, and a single source hammering a login page or Secure Shell (SSH). Offline cracking leaves no failed logins at all; the clue is that hashes were stolen, then later successful logins from accounts whose hashes leaked.

**Why it matters:** Weak passwords fall fast offline, and stolen hashes stay useful until the passwords are changed.

**Common confusions:** Physical brute force is forcing doors; see `### Physical brute force (forced entry)`. Online brute force is stopped by rate limiting and lockout (National Institute of Standards and Technology (NIST) guidance caps consecutive failed attempts at no more than 100 before the authenticator is disabled, and allows lower limits); offline cracking is slowed only by strong storage: a unique salt per password and a deliberately slow password hashing scheme. Pass the hash needs no cracking at all.

**Scenario:** The virtual private network (VPN) log shows 9,400 failed logins for the account `jlee` from one address in 20 minutes, then a lockout. The answer is an online brute force attack, decided by many guesses against one account. Password spraying is the closest wrong answer, but spraying spreads few guesses across many accounts.

Defenses: multifactor authentication (MFA), rate limiting and lockout, long passwords and blocklists of common or breached passwords, salted slow hashing for storage, and resetting any account whose hash or password was exposed.

### Dictionary, rainbow table and credential stuffing attacks

These are smarter guessing methods than pure brute force. A dictionary attack tries likely words and known common passwords, often with rules (capital first letter, digits at the end). A rainbow table attack looks up stolen unsalted hashes in a precomputed table of hash to password pairs. Credential stuffing tries username and password pairs leaked from one breach against other sites, betting on password reuse.

How each works:
1. Dictionary: run a wordlist plus mutation rules online or offline; fast, but misses truly random passwords.
2. Rainbow table: precompute hashes for huge password sets once, then crack matching stolen hashes almost instantly; useless against salted hashes, because each salt changes the hash.
3. Credential stuffing: feed breach dumps to a login page, often through botnets or proxies so the attempts come from many addresses; each account gets one known pair.

Indicators: dictionary attacks look like brute force with real words; rainbow tables leave no trace on your systems (they work offline on stolen unsalted hashes); credential stuffing shows a burst of logins to many different accounts, each tried once or twice, with many different usernames, sometimes spread thinly over many addresses, and a higher than normal success rate.

**Why it matters:** Stuffing turns someone else's breach into your account takeovers; dictionary and rainbow attacks quickly recover weak or unsalted passwords.

**Common confusions:** Stuffing uses real pairs; spraying uses guessed common passwords. Rainbow tables beat unsalted hashes only; salt defeats them, and slow hashing slows dictionary cracking. None of these needs the password to be typed by the user, unlike a keylogger.

**Scenario:** A week after a popular forum leaked its user list, the company's customer portal sees 30,000 logins for 30,000 different emails from 4,000 residential addresses, with 2% succeeding. The answer is credential stuffing, decided by leaked pairs tried once per account with an unusually high success rate. Password spraying is the closest wrong answer, but spraying uses a few common passwords, not a different known password per account.

Defenses: multifactor authentication (MFA), unique passwords per site (password managers), checking new passwords against breach lists, bot and rate controls on logins, resetting accounts found in breach data, and salted slow hashing.

### Password spraying vs brute force vs dictionary vs credential stuffing (password attack comparison)

All four guess passwords, but the pattern of attempts differs. Read the log shape: how many accounts, how many guesses per account, and where the guesses come from.

| Attack | Accounts | Guesses per account | Passwords used | Classic clue |
|---|---|---|---|---|
| Spraying | Many | One or two per round | A few common ones | Many accounts, one failure each, same password |
| Brute force (online) | One or few | Very many | Every combination or huge lists | Thousands of failures, then lockout |
| Brute force (offline cracking) | Stolen hash file | Unlimited, no lockout | Every combination, words, rules | Hashes stolen earlier, no failed logins |
| Dictionary | Any | Many | Words and common passwords with rules | Real words in attempts |
| Rainbow table | Stolen unsalted hashes | Lookup, not guessing | Precomputed table | Works only on unsalted hashes |
| Credential stuffing | Many | One known pair each | Real pairs leaked elsewhere | Many usernames, higher success rate |

**Why it matters:** The best control differs. Lockout and rate limiting stop online brute force; multifactor authentication (MFA) and breach checks stop stuffing and spraying; salt and slow hashing defeat rainbow tables and slow cracking.

**Common confusions:** Lockouts point toward brute force, because spraying and stuffing are built to avoid them. "One password, many accounts" is spraying; "one account, many passwords" is brute force.

**Scenario:** Failures across 600 accounts, each with a different password that turns out to be that user's password on a shopping site breached last month. The answer is credential stuffing, because each account got its own real leaked password. Spraying fails because spraying tries the same few passwords everywhere.

### Indicators of compromise (IoC) and reading them together

An indicator is an observable sign that an attack may be coming, is under way, or has already succeeded. Indicators of compromise (IoCs) include technical artifacts (a malicious file hash, a command and control (C2) domain, an attacker Internet Protocol (IP) address) and behavioral signs (lockouts, impossible travel, log gaps). The SY0-701 list has nine: three about accounts (lockout, concurrent sessions, impossible travel), three about systems (blocked content, unusual resource use, resources that cannot be reached), two about logs (logging out of cycle, logs that are missing) and one from outside (the attack published or documented).

How to work from an indicator to a conclusion:
1. Compare with a baseline: an indicator is something unusual for this user, host or time.
2. Rule out benign causes (a virtual private network (VPN), travel, a scheduled job, a product launch).
3. Look for a second, independent indicator; two that agree are much stronger than one.
4. Map the combination to the most likely attack, then pick the first response.
A common wrong order is to act on one alert before checking the baseline, which wastes effort on false positives.

Groups to remember:
1. Account clues: lockouts, concurrent sessions, impossible travel.
2. System clues: resource consumption, resource inaccessibility, blocked content.
3. Log clues: missing logs, out-of-cycle logging.
4. Outside clues: your data or attack published or documented.

**Why it matters:** Early indicators let defenders act before data is stolen or encrypted; missing them means learning about a breach from outsiders.

**Common confusions:** An indicator is evidence, not proof; detection systems produce false positives (benign activity flagged) and false negatives (attacks missed), and tuning trades one against the other. IoCs from threat intelligence (hashes, domains) are checked against your logs; behavioral indicators are found by comparing with your own baseline.

**Scenario:** An analyst sees an admin account sign in from two countries 20 minutes apart and, an hour later, the security log on a server it touched has a two-hour gap. The answer is credential compromise followed by log tampering, decided by two independent indicators (impossible travel plus missing logs). Treating it as a VPN false positive fails because the log gap has no benign explanation.

### Account lockout as an attack indicator

Account lockout happens when an account is locked (blocked from signing in, usually for a set time or until an administrator unlocks it) after too many failed logins. Many lockouts, especially for users who did not mistype anything, suggest online password guessing; they can also be the goal of an attacker who wants to deny users access.

How to read it:
1. Check where the failed attempts came from (Internet Protocol (IP) addresses, devices, protocols).
2. Check how many accounts are affected and how many failures each has.
3. One account with thousands of failures from one source points to brute force; many accounts locked at once from one source may be a deliberate lockout denial-of-service (DoS).
4. A single locked executive account followed by a help desk call asking for a reset can be social engineering: lock the account, then impersonate the user to get a new password.

**Why it matters:** Lockout is a safety brake against guessing, but it also costs productivity, and attackers can turn it into a denial of service. Policies (National Institute of Standards and Technology (NIST) SP 800-53 AC-7) set the number of allowed failures and the lockout response; NIST identity guidance allows at most 100 consecutive failures before the authenticator is disabled and permits lower limits.

**Common confusions:** Lockouts point to brute force; password spraying and credential stuffing are designed to stay under the threshold, so their absence of lockouts is part of their signature. A lockout from an old saved password on a phone is a common benign cause.

**Scenario:** Twelve finance users report locked accounts at 08:05; the logs show each received 50 failed attempts from the same external address in five minutes. The answer is a brute force (or deliberate lockout) attack, decided by many failures per account from one source. Password spraying is the closest wrong answer, but spraying keeps each account to one or two failures.

Mini-example: Windows records each failed logon as event 4625; a burst of 4625 events for one account from one address, followed by the account being locked (event 4740), is the classic brute force pattern. See `### Windows security event IDs and logon types (reference)`.

### Concurrent session usage

Concurrent session usage is one account signed in more than once at the same time, from different devices or places, when that is not normal for the user. It suggests stolen credentials or a hijacked session being used alongside the real user.

How to read it:
1. List active sessions for the account with device, Internet Protocol (IP) address and start time.
2. Decide whether multiple sessions are normal for this user (phone plus laptop is common; two desktops in two cities is not).
3. Check whether the second session began with a fresh login (stolen password) or reused an existing session token (session hijacking).

**Why it matters:** The attacker works inside a real user's identity, so actions look legitimate unless sessions are compared. Organizations can limit concurrent sessions per account or account type (National Institute of Standards and Technology (NIST) SP 800-53 AC-10).

**Common confusions:** Concurrent sessions are about overlap in time. Impossible travel is about two logins that are too far apart for the time between them, even if the sessions do not overlap. Service accounts and shared devices often have legitimate concurrent sessions.

**Scenario:** A payroll clerk's account is active on her office PC and, at the same moment, on an unknown Linux machine connected through the remote access gateway. The answer is concurrent session usage indicating compromised credentials or a hijacked session. Impossible travel is the closest wrong answer, but the clue here is two sessions open at once, not the distance between logins.

Response: end all sessions, reset the password, revoke tokens, require multifactor authentication (MFA), and check what the second session did.

### Impossible travel

Impossible travel is two sign-ins for the same account from locations so far apart, in so little time, that no one could physically travel between them. It strongly suggests that someone else is using the credentials.

How identity tools judge it:
1. Geolocate each sign-in by Internet Protocol (IP) address.
2. Compute the distance and the time between them.
3. Compare with a realistic travel speed and with the user's history (some tools learn each user's normal locations first).

Indicators that make it stronger: the second location is new for the user, the sign-in came from an anonymizing service, or it was followed by unusual actions such as new inbox forwarding rules.

**Why it matters:** It often catches account takeover even when the password was correct and nothing failed.

**Common confusions:** Corporate VPNs, cloud proxies and mobile networks can place a user far from where they are, causing false positives. Concurrent sessions are two at once; impossible travel is two in sequence that cannot both be the same person.

**Scenario:** A user signs in from Lisbon at 09:00 and from Singapore at 09:25; she has never used a virtual private network (VPN) and is at her desk in Lisbon. The answer is impossible travel indicating compromised credentials. Concurrent session usage is the closest wrong answer, but the decisive clue is the distance in the time available.

Mini-example: `09:00 lisbon 203.0.113.10 success` then `09:25 singapore 198.51.100.7 success` for the same user is the textbook pattern.

### Blocked content as an indicator

Blocked content as an indicator means security controls are blocking something in a way that reveals an infection, or that legitimate security content is being blocked on a host. Two patterns matter.

How each looks:
1. Outbound blocks: the web proxy, Domain Name System (DNS) filter or firewall repeatedly blocks one host from reaching known malicious or command and control (C2) domains. The block worked, but the attempts show the host is infected.
2. Defensive content blocked on the host: the machine can no longer reach antivirus updates, security vendor sites or the patch server, while other sites work. Malware often edits the hosts file, proxy settings or firewall rules to protect itself.

**Why it matters:** Blocks are easy to dismiss as "the control did its job," but repeated blocks from one host mean the source is still compromised and needs cleanup.

**Common confusions:** Blocked content is about what is being blocked and why. Resource inaccessibility is about systems or files users cannot reach at all. A user blocked from a social media site by policy is normal, not an indicator.

**Scenario:** The DNS filter logs 900 blocked lookups in a day from one accounting PC to a domain on a threat intelligence feed, and the same PC has not downloaded antivirus signatures for a week. The answer is blocked content indicating malware on that PC, decided by repeated blocked C2 attempts plus blocked security updates. Resource consumption is the closest wrong answer, but nothing points to unusual processor (CPU), memory or bandwidth use.

Response: isolate the host, investigate and clean or reimage, and check for the same domain in other hosts' logs.

### Resource consumption as an indicator (CPU, memory, disk, bandwidth)

Unusual resource consumption is CPU, memory, disk or network use far above the normal baseline for a system or user. Its shape points to different causes.

How to read the shape:
1. Constant high CPU or graphics processor (GPU) on an idle machine or cloud instance, plus connections to mining pools: cryptomining (resource hijacking).
2. A large outbound transfer at an odd hour to an unknown destination: data exfiltration.
3. A flood of inbound connections or requests: denial of service.
4. Disk filling with new files or heavy write activity: ransomware encrypting, or staging data before exfiltration.
5. Memory growing in a service until it crashes: application exhaustion or a leak triggered by input.

**Why it matters:** Resource spikes cost money (cloud bills, bandwidth), slow services and often signal data loss in progress.

**Common confusions:** Resource consumption is about unusual use; resource inaccessibility is about things you cannot reach. Both can appear in the same incident (ransomware writes heavily, then files become unreadable). A spike during a planned backup or release is benign; compare with change records.

**Scenario:** A file server that normally sends 2 GB a night sends 60 GB to an unknown cloud storage address between 01:00 and 03:00. The answer is resource consumption indicating data exfiltration, decided by abnormal outbound volume at an odd time to an unknown destination. A distributed denial-of-service (DDoS) is the closest wrong answer, but a DDoS floods traffic toward the victim, not out of it.

Mini-example: a cloud virtual machine (VM) at 98% CPU for six days with connections to a mining pool port and no workload assigned is cryptojacking.

### Resource inaccessibility as an indicator

Resource inaccessibility means systems, services, accounts or files that should be available suddenly cannot be reached or opened. The cause can be encryption, a flood, deleted data, changed permissions or an attacker locking out administrators.

How to narrow the cause:
1. Files exist but will not open, with new extensions and ransom notes: ransomware.
2. The service is up but unreachable for everyone, with traffic far above normal: DoS or distributed denial-of-service (DDoS).
3. Admins cannot log in to their own systems, passwords or multifactor authentication (MFA) changed: account takeover locking defenders out.
4. Data or volumes missing: deletion or wiping, possibly a logic bomb.

**Why it matters:** Inaccessibility is often the moment an attack becomes visible to the business, so the response plan (isolate, preserve evidence, restore) needs to be ready before it happens.

**Common confusions:** Inaccessibility is the effect, not the attack; name the attack from the extra clues. Blocked content is a control blocking specific content; inaccessibility is legitimate users losing access to their own resources.

**Scenario:** On Monday morning, staff cannot open any file on the shared drive; every file ends in `.crypt9` and each folder has `HOW_TO_DECRYPT.html`. The answer is resource inaccessibility caused by ransomware, decided by unreadable renamed files with ransom notes. A DDoS is the closest wrong answer, but the drive is reachable; its contents are encrypted.

Response: isolate affected systems first (disconnect them from the network), keep evidence, then restore from offline backups that were tested beforehand.

### Out-of-cycle logging

Out-of-cycle logging is log activity at times or in patterns that do not match the organization's normal schedule: updates, configuration changes, backups, admin logins or job runs outside their planned windows. It suggests someone acting outside the change process, possibly an attacker.

How to check it:
1. Know the normal cycle: patch windows, maintenance windows, backup times, business hours for each team.
2. Compare the event's time and actor with change management records.
3. An unapproved change outside the window by an unusual account is a strong indicator; an approved emergency change is not.

**Why it matters:** Attackers often act when fewer people are watching (nights, weekends, holidays), and their changes have no matching ticket.

**Common confusions:** Out-of-cycle logging means logs that exist at the wrong time; missing logs means logs that should exist are gone. Both can appear together when an attacker acts at night and then clears the logs.

**Scenario:** A firewall rule allowing inbound remote desktop is added at 02:14 on a Sunday by a service account, and there is no change ticket; changes happen on Wednesday evenings. The answer is out-of-cycle logging indicating unauthorized change. Missing logs is the closest wrong answer, but here the log entry exists; its timing and lack of approval are the clue.

Mini-example: `Sun 02:14 fw01 rule-add permit any -> 10.0.5.20 remote-desktop by svc-backup` with no matching ticket, on a network where changes are made on Wednesday evenings, is out-of-cycle activity.

### Missing logs (log gaps and cleared logs)

Missing logs are gaps, deleted entries or whole logs cleared, where the system should have recorded activity. Attackers clear or alter logs to hide what they did, so a gap is evidence in itself.

How it shows up:
1. A time window with no entries on a system that is always busy.
2. A "log cleared" event: on Windows, event 1102 in the Security log records that the audit log was cleared, along with the account that did it.
3. Logging services stopped, log forwarding to the security information and event management (SIEM) interrupted, or audit policies changed to record less.
4. Log files shorter than expected or with modified timestamps.

**Why it matters:** Without logs, investigators cannot tell what was accessed or changed, which hurts response, legal reporting and recovery.

**Common confusions:** A gap can also come from a full disk, a crash or a misconfigured forwarder, so check for a benign cause. Missing logs is about absence; out-of-cycle logging is about unexpected timing. Clearing the Security log is rarely needed in normal operations, so event 1102 should always be investigated.

**Scenario:** A domain controller's Security log has no entries from 01:00 to 03:00, and event 1102 at 03:01 names an admin account that was on leave. The answer is missing logs indicating an attacker covering tracks. Out-of-cycle logging is the closest wrong answer, but the main clue is the deleted record, not unusual timing of normal activity.

Defenses: forward logs in near real time to a central SIEM or write-once storage the host cannot alter, alert on log clearing and logging service stops, and restrict who can manage audit policy.

### Published or documented attack indicators (leak sites and threat intelligence)

Published or documented indicators are signs of an attack that appear outside your organization: an attacker posting your stolen data, a ransomware gang listing you on its leak site, credentials for your domain appearing in breach dumps, or researchers and vendors publishing details and indicators of a campaign that affects you.

How it reaches you:
1. Attackers publish or sell data to pressure the victim or profit (double extortion leak sites, dark web markets).
2. Breach monitoring services or identity providers detect your users' credentials in dumps.
3. Threat intelligence feeds and vendor advisories publish IoCs (hashes, domains, Internet Protocol (IP) addresses) that you then search for in your own logs.
4. Journalists, customers or law enforcement contact you.

**Why it matters:** Sometimes this is the first sign of a breach, meaning internal detection failed; legal notification clocks may start once you know.

**Common confusions:** "Documented" also covers public descriptions of attacks (advisories, reports) that let you check whether you were hit. Published data proves a breach happened but not how; investigation still needs internal evidence.

**Scenario:** A security researcher emails that a forum is selling a database with 80,000 of your customers' records, including fields only your customer relationship management (CRM) system contains. The answer is a published or documented indicator, decided by your data appearing externally. Missing logs is the closest wrong answer; it may also be present, but the clue given is the external publication.

Response: verify the data, activate incident response, reset exposed credentials, search logs for related IoCs, and follow legal and contractual notification duties.

### Concurrent sessions vs impossible travel vs account lockout (account indicator comparison)

These three account indicators are easy to mix up. The decisive feature is overlap in time, distance against time, or failed attempts.

| Indicator | Decisive feature | Usually means | Common false positive |
|---|---|---|---|
| Concurrent session usage | Two or more sessions at the same moment | Stolen password or hijacked session in use | Phone plus laptop, service accounts |
| Impossible travel | Two logins too far apart for the time between | Credentials used by someone elsewhere | Virtual private network (VPN) or cloud proxy location |
| Account lockout | Too many failed logins | Online brute force, or deliberate lockout | Old saved password on a device |

**Why it matters:** The first two show a successful compromise in progress (act fast: end sessions, reset, require multifactor authentication (MFA)). Lockout shows guessing that has not necessarily succeeded.

**Common confusions:** Spraying and stuffing avoid lockout, so "no lockouts but many failures across accounts" points to spraying. Impossible travel needs two sign-ins; concurrent usage needs overlapping sessions.

**Scenario:** An account logs in from Oslo, logs out, and logs in from Santiago 15 minutes later; there was never more than one session. The answer is impossible travel. Concurrent session usage fails because the sessions did not overlap.

### Resource consumption vs resource inaccessibility vs blocked content (system indicator comparison)

These system indicators describe different symptoms. Name the indicator from the symptom, then name the attack from the extra clues.

| Indicator | Decisive feature | Likely attacks |
|---|---|---|
| Resource consumption | Unusual processor (CPU), memory, disk or bandwidth use | Cryptomining, exfiltration, denial-of-service (DoS), encryption in progress |
| Resource inaccessibility | Users cannot reach or open what they should | Ransomware, DoS, account takeover, wiping |
| Blocked content | Controls block malicious destinations, or security updates are blocked on a host | Malware calling out, malware protecting itself |

**Why it matters:** Each points to a different first move: find the process or flow (consumption), restore and isolate (inaccessibility), clean the host that keeps calling out (blocked content).

**Common confusions:** One incident can show all three in sequence: blocked command and control (C2) calls, then heavy disk writes, then unreadable files. Answer with the indicator the question describes.

**Scenario:** A laptop's antivirus cannot update and the proxy keeps blocking its requests to a known malicious domain, though CPU and disk are normal. The answer is blocked content. Resource consumption fails because usage is normal.

### Missing logs vs out-of-cycle logging (log indicator comparison)

Both log indicators point to activity someone does not want noticed, but the evidence differs: one is absence, the other is timing.

| Indicator | Decisive feature | Typical evidence |
|---|---|---|
| Missing logs | Records that should exist are gone | Gaps, a log-cleared event (Windows 1102), stopped logging service |
| Out-of-cycle logging | Records exist at unexpected times | Changes or admin actions outside windows, no change ticket |

**Why it matters:** Missing logs require central, tamper-resistant log storage to investigate at all; out-of-cycle activity is caught by comparing logs with change management.

**Common confusions:** An attacker can produce both: act at 3 a.m. (out-of-cycle) and then clear the log (missing). A maintenance job that ran late is out-of-cycle but approved; check the ticket before calling it an attack.

**Scenario:** Logs show an admin password reset at 23:50 on a holiday with no ticket, and the logs remain intact. The answer is out-of-cycle logging. Missing logs fails because nothing was deleted.

### Choosing the attack from the clues (2.4 decision path)

Use this path to turn a scenario's clues into an attack name and a first response. Start from the strongest technical clue, not the story around it.

1. Clue in input or a web log: quotes and `OR 1=1` or `UNION` mean Structured Query Language (SQL) injection; `../` or `%2e%2e%2f` means directory traversal; thousands of one character plus crashes mean buffer overflow; a URL parameter fetching internal or metadata addresses means server-side request forgery (SSRF); a forged state-changing request from another site means cross-site request forgery (CSRF).
2. Clue in authentication logs: many accounts with one failure each means spraying; one account with thousands means brute force; leaked pairs with a high success rate means credential stuffing; NT LAN Manager (NTLM) logons spreading from one workstation with no failures means pass the hash; one session used in two places means session hijacking.
3. Clue on the local network or Wi-Fi: one hardware (MAC) address for several network addresses means Address Resolution Protocol (ARP) poisoning (on-path); clients dropping and rejoining a same-named network means deauthentication plus evil twin; HTTP where HTTPS is expected means Secure Sockets Layer (SSL) stripping (downgrade).
4. Clue in traffic volume: many sources flooding one target means distributed denial-of-service (DDoS); unsolicited large User Datagram Protocol (UDP) replies means reflected and amplified DDoS; regular small check-ins means botnet command and control (C2) beaconing; large outbound at night means exfiltration.
5. Clue on hosts: renamed files and notes mean ransomware; spread with no user action means worm; wanted program with hidden function means Trojan; system tools hiding activity means rootkit; damage at a set time means logic bomb; Office spawning encoded PowerShell means fileless malware.
6. Clue in the building: forced door means physical brute force; valid badge without the holder means radio frequency identification (RFID) cloning; changed cooling or power settings means environmental attack.

When NOT to jump: do not name an attack from one weak indicator (a single impossible travel alert from a virtual private network (VPN) user); confirm with a second clue. Do not name the payload when the question asks for the delivery (Trojan vs ransomware), or the reverse.

First responses that fit most findings: isolate affected hosts, preserve logs and memory, reset or revoke exposed credentials and tokens, block the indicators (domains, addresses, hashes) everywhere, then patch or reconfigure the weakness used.

### On-path vs credential replay vs session hijacking vs application replay (interception comparison)

All four involve stolen or intercepted traffic, so scenarios blur them. The decisive feature is whether the attacker sits in the live path, reuses something later, and what is reused.

| Attack | Decisive feature | What the attacker uses | Typical clue |
|---|---|---|---|
| On-path | Sits between two parties in real time | The live traffic itself | One hardware (MAC) address for many network addresses, certificate warnings |
| Credential replay | Reuses captured authentication material to log in | Password hash, Kerberos ticket, token | NT LAN Manager (NTLM) logons spreading with no failures |
| Session hijacking | Takes over an existing logged-in session | Session cookie or token | Same session ID from two devices |
| Application replay | Resends a captured valid message or transaction | A request, a signed message | The same transaction processed twice |

**Why it matters:** Defenses differ. On-path is countered by encryption with certificate validation and switch protections; credential replay by limiting where privileged credentials are used and preferring Kerberos; hijacking by secure cookies, short sessions and a new ID at login; replay by nonces, timestamps and one-time tokens.

**Common confusions:** An on-path position is often HOW a token is stolen, and replay or hijacking is WHAT is done with it afterward. If the question describes the interception, answer on-path; if it describes the reuse, answer replay or hijacking.

**Scenario:** An attacker records a payment request on a poorly designed application programming interface (API) and sends it again an hour later, and the payment is made twice. The answer is a replay attack, because a captured valid message was resent. Session hijacking fails because no session was taken over; one transaction was repeated.

### Injection vs XSS vs CSRF vs SSRF vs directory traversal (web attack comparison)

Web application attacks are told apart by WHERE the attacker's input ends up and WHO acts on it.

| Attack | Where the input lands | Who is tricked | Decisive log clue |
|---|---|---|---|
| Structured Query Language (SQL) or command injection | A server-side interpreter (database, shell) | The server's interpreter | Quotes, `OR 1=1`, `;` with commands |
| Cross-site scripting (XSS) | A page that runs script in other users' browsers | Victims' browsers | Script tags or event handlers in input |
| Cross-site request forgery (CSRF) | A forged request sent by the victim's own browser | The site trusting the browser's cookie | State change with a foreign origin, no token |
| Server-side request forgery (SSRF) | A URL the server fetches | The server and internal network | Server requests to internal or metadata addresses |
| Directory traversal | A file path the server opens | The file system | `../` or encoded dots in parameters |

**Why it matters:** Each needs a different fix: parameterized queries, output encoding, anti-CSRF tokens, destination allow lists, path canonicalization.

**Common confusions:** XSS runs code in the browser; CSRF only sends a request and cannot read the reply. SSRF and CSRF are both "forgery," but one forges a server's request and the other a user's. Traversal reads files without running code; injection runs code.

**Scenario:** A comment field stores a script tag that sends every reader's cookie to an external site. The answer is XSS, because input ends up running in other users' browsers. SQL injection fails because nothing was sent to the database interpreter as code.

## 2.5 Why each enterprise mitigation is used

Depth: explain the purpose. A good answer says what each technique is for, which threat it reduces, and why another technique would not fit as well; naming the technique without its purpose earns little.

### Segmentation as an enterprise mitigation (network zones, VLANs, microsegmentation)

Segmentation divides a network into separate zones (using virtual LANs (VLANs), subnets, firewalls and routing rules, or cloud network controls) so systems with different roles or risk are separated and the traffic between zones is controlled. It is a preventive, technical control that mainly protects confidentiality and integrity by limiting where an attacker can go.

How it is done:
1. Group systems by role and sensitivity: users, servers, payment systems, building controls, guests.
2. Put each group in its own segment: physical (separate hardware), logical (VLANs and subnets) or virtual and cloud (virtual networks, security groups). Microsegmentation goes down to individual workloads.
3. Allow only the flows each group needs between segments, with a firewall or access control list (ACL) at each boundary, and deny the rest.
4. Monitor traffic crossing boundaries; anything outside the rules is a signal.
A common wrong step is creating VLANs but allowing all traffic between them, which looks segmented but stops nothing.

**Why it matters:** A breach in one zone stays in that zone, which limits lateral movement, ransomware spread and the scope of compliance audits (for example, keeping card systems separate so fewer systems are in scope for the payment card standard).

**Common confusions:** Segmentation allows controlled traffic; isolation cuts a system off or allows almost nothing. A VLAN alone is not a security boundary unless traffic between VLANs is filtered. Segmentation is also an answer for systems that cannot be patched: put them where few systems can reach them.

**Scenario:** A hospital wants infusion pumps that cannot be patched kept away from staff laptops, while still letting the pump management server talk to them. The answer is segmentation, decided by the need for controlled traffic between zones. Isolation (air gap) is the closest wrong answer, but the management server must still reach the pumps.

Mini-example rule set: allow `mgmt-server -> pumps management port`; deny `any -> pumps any`; log denies.

### Access control list (ACL) as a mitigation

An access control list (ACL) is a list of entries saying which subjects (users, groups, addresses) may access a resource and in what way. On network devices, an ACL filters traffic by source, destination, protocol and port; on file systems and applications, it lists which users or groups get which rights on an object. It is a preventive technical control.

How network ACLs are processed:
1. Entries are checked from top to bottom.
2. The first matching entry decides (permit or deny) and processing stops.
3. Anything that matches no entry hits the implicit deny at the end.
4. The ACL does nothing until it is applied to an interface in a direction (inbound or outbound).
Order mistakes are the classic error: a broad permit above a specific deny makes the deny unreachable.

**Why it matters:** ACLs enforce segmentation and least privilege at each boundary and on each resource, so only the intended flows and users reach sensitive systems.

**Common confusions:** The ACL is the list of rules; permissions are the individual rights inside it (read, write, execute). A stateless router ACL checks each packet alone; a stateful firewall tracks connections. Placing a simple source-only ACL far from the destination can block more than intended.

**Scenario:** Only the two application servers should reach the database subnet on its database port; everything else must be refused. The answer is an ACL on the database subnet's router or firewall interface, permitting those two sources on that port and relying on the implicit deny for the rest. Permissions on the database are the closest wrong answer, because they control what a logged-in user may do, not which hosts may connect.

Mini-example:
`10 permit tcp host 10.1.1.10 10.2.0.0/24 eq DB-PORT`
`20 permit tcp host 10.1.1.11 10.2.0.0/24 eq DB-PORT`
`(implicit) deny any any`
Here DB-PORT stands for the database's listening port number.
For standard port numbers, see `### Remote access, file sharing and database ports (reference)`.

### Permissions as a mitigation (file, share and object rights)

Permissions are the specific rights a user, group or service has on a resource: read, write, modify, execute, delete, change permissions, full control. Setting them carefully limits what each identity can do, which is how least privilege is applied to data and systems.

How good permission management works:
1. Grant rights to groups based on job role, not to individuals one by one.
2. Give the minimum right needed (read instead of modify, modify instead of full control).
3. Separate duties so no single person can both make and approve a sensitive change.
4. Review access regularly and remove rights people no longer need (permission creep).
5. Watch for inherited rights that give more access than intended.

**Why it matters:** Over-broad permissions turn one compromised account into access to everything; tight permissions contain insiders, malware and mistakes. Ransomware can only encrypt what the infected account can write.

**Common confusions:** Permissions are the rights; the access control list (ACL) is where they are listed per object. Least privilege is the principle; permissions are one way to apply it. Authentication proves who you are; permissions (authorization) decide what you may do.

**Scenario:** A ransomware infection on an intern's laptop encrypted the entire engineering share, because the "All staff" group had modify rights on it. The mitigation that would have limited the damage is tighter permissions (read-only for most staff, modify only for the engineering group). Encryption at rest is the closest wrong answer, because it protects data if storage is stolen, not from a logged-in account that is allowed to write.

### Application allow list (allowlisting, application control)

An application allow list lets only approved software run on a system; anything not on the list is blocked by default. It used to be called whitelisting. It is a preventive control that is very strong against unknown malware, because new malicious programs are not on the list.

How applications are identified (and the trade-offs):
1. Cryptographic hash: exact and reliable, but every update changes the hash, so the list must be updated with each patch.
2. Digital signature or publisher: survives updates and needs changes only for new vendors, but trusts everything the publisher signs, including old vulnerable versions.
3. File path: easy to manage, but weak alone, since anything placed in that folder runs; strong only if ordinary users cannot write there.
4. File name or size: too weak to use alone, since attackers can copy a name or match a size.
Combining publisher signature and hash usually gives the best accuracy.

Rollout steps: inventory what runs, build the list, run in audit (monitor-only) mode that logs what would be blocked, fix the list, then switch to enforcement.

**Why it matters:** It stops ransomware, Trojans and unauthorized tools from running at all, which is why fixed-purpose systems (kiosks, point of sale, servers, industrial controls) benefit most.

**Common confusions:** An allow list blocks everything not approved (default deny); a deny list (blocklist) blocks only known bad items and lets new malware through. Allow listing is harder to manage on general-purpose desktops where software changes often. It does not stop malicious use of approved tools (PowerShell) unless those are restricted too.

**Scenario:** A retail chain wants its checkout terminals to run only the point-of-sale application and its updater, so that any downloaded malware cannot execute. The answer is an application allow list. A deny list is the closest wrong answer, because it would only block malware already known to the list.

### Isolation as a mitigation (quarantine, sandbox, air gap)

Isolation separates a system, process or device so it cannot interact with others, or can do so only through tightly controlled means. It is used both to contain a threat (quarantine an infected host) and to protect something sensitive (an air-gapped system, a sandboxed application).

Forms of isolation:
1. Quarantine network: an infected or noncompliant device is moved to a segment with no access to company resources, except perhaps a remediation server.
2. Endpoint isolation: endpoint detection and response (EDR) cuts a host off the network except for its link to the security console, while investigators work.
3. Sandbox: untrusted code runs in a restricted environment with no access to files, network or other processes except what is allowed.
4. Air gap: no physical connection to other networks, with data moved only by controlled manual transfer.
5. Process and virtual machine isolation: each guest or process limited to its own resources.

**Why it matters:** Isolation stops spread during an incident and keeps the most sensitive systems beyond the reach of network attacks. Unpatchable systems are often isolated as their main protection.

**Common confusions:** Isolation is stronger than segmentation: segmentation allows defined traffic between zones, isolation allows none or nearly none. An air gap is not immune: removable media and insiders can still carry malware across.

**Scenario:** An EDR alert shows a laptop encrypting files on a share; the team must stop it from reaching anything else while keeping it powered on for evidence. The answer is isolation (network-isolate the endpoint). Segmentation is the closest wrong answer, because the laptop's segment would still allow traffic to other systems in it.

### Patching as a mitigation (patch management)

Patching applies vendor updates that fix security flaws in operating systems, applications, firmware and devices. Patch management is the ongoing process of finding, prioritizing, getting, testing, installing and verifying those updates across the organization. It is a preventive, corrective control against known vulnerabilities.

The process:
1. Keep an inventory of assets and software, so you know what needs patches.
2. Learn of new patches and vulnerabilities; prioritize by severity, exposure and whether the flaw is being exploited now.
3. Test where practical, so a patch does not break production.
4. Deploy in planned waves (maintenance groups), with an emergency path for actively exploited flaws.
5. Verify the patch installed and took effect.
Skipping routine patches makes emergencies harder, because new patches may need old ones installed first.

When a patch is not possible (end of life, no vendor fix yet, a system that must run nonstop): use temporary mitigations (disable the vulnerable feature, block the port), isolate or segment the system, or retire it.

**Why it matters:** Many breaches use known flaws with fixes already available; patching removes that easy path.

**Common confusions:** Patching does not protect against zero-days (no patch exists yet); compensating controls and monitoring cover that gap. Patching fixes code; hardening changes configuration. A patch installed but not verified may not have taken effect (a pending reboot).

**Scenario:** A vendor announces that a flaw in the company's virtual private network (VPN) appliance is being exploited worldwide, and a fix is out. The answer is emergency patching, decided by an actively exploited, fixable flaw on an exposed system. Configuration enforcement is the closest wrong answer, because the weakness is in the vendor's code, not in a drifted setting.

### Encryption as an enterprise mitigation (data at rest and in transit)

As an enterprise mitigation, encryption turns data into ciphertext that only holders of the right key can read, so stolen or intercepted data is useless to the thief. It protects confidentiality (and, with authenticated modes and signatures, integrity) for data at rest (disks, databases, backups, cloud storage) and in transit (Transport Layer Security (TLS), virtual private networks (VPNs), encrypted email).

How an organization applies it:
1. Classify data and decide where it must be encrypted: laptops, removable media, databases, backups, all traffic leaving trusted networks.
2. Pick strong, current algorithms and protocols (see `### Symmetric ciphers: block size, key size and status (reference)` and `### TLS and SSL versions and TLS 1.3 cipher suites (reference)`).
3. Manage keys: generate, store (ideally in hardware such as a Trusted Platform Module (TPM) or hardware security module), rotate, back up and revoke them. Encryption is only as strong as the protection of its keys.
4. Verify coverage: unencrypted devices or connections are findings to fix.

**Why it matters:** A lost laptop or a stolen backup becomes a non-event if the data is encrypted and the key was not taken with it. Encrypted traffic defeats eavesdropping on untrusted networks.

**Common confusions:** Encryption does not stop an authorized, logged-in account (or malware running as that account) from reading data; access control and least privilege handle that. Full disk encryption protects a powered-off device; once unlocked, files are readable. The 2.5 list names encryption twice: here as an organization-wide strategy, and under hardening as configuring it on each device; see `### Encryption as a hardening step (full disk encryption, encrypted protocols)`.

**Scenario:** A courier loses a box of backup tapes containing customer records. The mitigation that would have prevented a data breach is encryption of data at rest (encrypted backups with keys stored separately). Access control is the closest wrong answer, because permissions on the original server do not protect a tape in a stranger's hands.

### Monitoring as a mitigation (logs, SIEM, EDR, network monitoring)

Monitoring is continuously collecting and reviewing activity from systems, networks, applications and users to spot attacks, misuse and failing controls quickly. It is a detective control: it does not stop an attack by itself, but it shortens the time an attacker goes unnoticed and feeds response.

How it works:
1. Decide what to watch: authentication, admin actions, network flows, endpoint behavior, cloud activity, critical file changes.
2. Collect logs centrally (a security information and event management (SIEM) system), plus endpoint detection and response (EDR) and network intrusion detection.
3. Establish baselines of normal activity so anomalies stand out.
4. Write and tune alerts; balance false positives (benign activity flagged) against false negatives (attacks missed).
5. Route alerts to people and playbooks that act on them.
Collecting logs nobody reviews is the common failure.

**Why it matters:** Many indicators in objective 2.4 (impossible travel, missing logs, out-of-cycle changes, beaconing) are only visible to monitoring. Continuous monitoring also shows whether other controls still work as intended.

**Common confusions:** Monitoring detects; an intrusion prevention system (IPS) or EDR in blocking mode also prevents. A SIEM is a tool for monitoring, not the monitoring program itself. Logs must be protected (forwarded off the host) or attackers erase the evidence.

**Scenario:** An organization discovered a breach only when a customer complained, months after it began, because logs were stored locally and never reviewed. The missing mitigation is monitoring (central log collection with alerting and review). Patching is the closest wrong answer; it may also be needed, but it would not have revealed the activity.

### Least privilege as a mitigation

Least privilege means every user, process, service and system gets only the access needed for its task, for only as long as needed, and nothing more. It is a design principle applied through permissions, ACLs, role assignments and separate admin accounts.

How it is applied:
1. Define roles from job tasks and grant rights to roles, not to people one by one.
2. Give administrators separate admin accounts used only for admin work, never for email or browsing.
3. Run services and applications under accounts with only the rights they need (not SYSTEM, root or database admin).
4. Grant elevated rights just in time and remove them afterward where possible.
5. Review access regularly and on job changes, removing rights no longer needed.

**Why it matters:** When an account or process is compromised, the attacker gets only what that identity could do. It limits privilege escalation, lateral movement, insider misuse and ransomware's reach.

**Common confusions:** Least privilege is the principle; permissions and ACLs are the mechanisms. Least functionality (turning off unneeded features) is the matching idea for systems, applied through hardening.

**Scenario:** An attacker phished a marketing user and was able to install software and read the HR share, because every employee had local admin rights and broad share access. The mitigation is least privilege. Monitoring is the closest wrong answer; it would help detect the attacker but would not have limited what the stolen account could do.

### Configuration enforcement (secure baselines, drift control, posture checks)

Configuration enforcement keeps systems matching an approved secure baseline configuration and corrects or blocks systems that drift from it. A baseline is a documented, reviewed set of settings for a type of system that changes only through change control.

How it works:
1. Define a secure baseline per system type, often starting from vendor guides or consensus benchmarks (such as Center for Internet Security (CIS) Benchmarks).
2. Apply it automatically: group policy, mobile device management (MDM), configuration management tools, hardened images.
3. Monitor for drift: compare actual settings with the baseline on a schedule.
4. Remediate automatically or flag for change control.
5. Gate network access on compliance: network access control (NAC) checks a device's health (patches, antivirus, encryption) before allowing it on, sending noncompliant devices to remediation.

**Why it matters:** Secure settings decay over time through manual fixes, new software and emergencies. Enforcement keeps thousands of systems consistent and catches unauthorized changes, which may also be attacker activity.

**Common confusions:** Configuration enforcement keeps settings right over time; hardening is choosing and applying the secure settings in the first place. Patching updates code; configuration enforcement manages settings. NAC posture checks are one form of enforcement at the point of connection.

**Scenario:** An audit finds that a third of laptops have the host firewall disabled and Universal Serial Bus (USB) storage enabled, though the standard says otherwise; the company wants this corrected automatically and kept that way. The answer is configuration enforcement against a secure baseline. Decommissioning is the closest wrong answer, because the laptops are still in service.

Mini-example: a posture check reports `firewall: off, disk encryption: on, last patch: 45 days` and moves the laptop to a remediation virtual LAN (VLAN) until it complies.

### Decommissioning (secure retirement and media sanitization)

Decommissioning retires systems, devices and services securely: take them out of service, sanitize or destroy the data on their storage, and remove every reference to them (inventory, Domain Name System (DNS) records, firewall rules, accounts, certificates, monitoring). It prevents data leaks from discarded equipment and forgotten systems that keep running unpatched.

How it is done:
1. Confirm the system is no longer needed and that data is migrated or retained as required.
2. Remove it from service and from network paths, DNS, load balancers and firewall rules.
3. Disable or delete service accounts, keys and certificates tied to it.
4. Sanitize storage by the level needed: clear (overwrite through normal interfaces, against simple recovery), purge (techniques that defeat even laboratory recovery, such as device sanitize commands or cryptographic erase), or destroy (disintegrate, incinerate or melt so the media cannot be reused; shredding or pulverizing dense modern media can leave recoverable pieces, so current NIST guidance keeps those two for the least sensitive data).
5. Verify the sanitization and record it (a certificate of sanitization), then update the asset inventory.

**Why it matters:** Recycled drives and leased equipment returned with data are a common source of breaches, and "zombie" servers nobody owns are prime targets because nobody patches them.

**Common confusions:** Deleting files or quick formatting is not sanitization. Decommissioning is the end of life for a whole asset; removal of unnecessary software takes away programs from a system that stays in service. Cryptographic erase works by destroying the keys of data that was encrypted, which is why encrypting from day one makes retirement easier, especially for cloud storage where physical media cannot be reached.

**Scenario:** A company sells 200 old laptops to a reseller, and a buyer later recovers payroll spreadsheets from one of them. The missing mitigation is proper decommissioning with media sanitization. Patching is the closest wrong answer; it fixes software flaws, not data left on retired hardware.

### Hardening techniques overview (attack surface reduction)

Hardening is configuring a system so it has the smallest practical attack surface and its remaining features are as secure as possible. The 2.5 list names seven hardening techniques: encryption, installation of endpoint protection, a host-based firewall, a host-based intrusion prevention system (HIPS), default password changes, turning off unneeded ports and protocols, and removal of unnecessary software.

How a system is hardened:
1. Start from a secure baseline or benchmark for that operating system or device.
2. Patch the operating system and applications.
3. Remove or disable unneeded services, applications, protocols and sample content (least functionality).
4. Change default credentials and configure strong authentication and access controls.
5. Turn on protective software: host firewall, endpoint protection, HIPS, encryption.
6. Test, then keep it hardened through configuration enforcement, patching and log monitoring.
A common wrong order is putting the system on the network first and hardening it later, leaving a window when defaults are exposed.

**Why it matters:** Each unneeded feature or default setting is a door an attacker can try; hardening closes them before attackers find them.

**Common confusions:** Hardening is per system; segmentation and monitoring work across the enterprise. Hardening is one-time setup plus upkeep; configuration enforcement is the upkeep. Hardening reduces but does not remove risk, so detection still matters.

**Scenario:** A team is about to put a new web server on the internet with every default service running and the vendor's admin password. The answer is hardening (remove unneeded services, change the default password, enable the host firewall and endpoint protection) before exposure. Monitoring is the closest wrong answer, because it would only report the attack the defaults invite.

### Encryption as a hardening step (full disk encryption, encrypted protocols)

As a hardening step, encryption means configuring each device to encrypt its own storage and to use encrypted protocols for management and data. It protects the device's data if it is lost, stolen or improperly retired, and protects its connections from eavesdropping.

How it is applied to one system:
1. Turn on full disk (whole volume) encryption, ideally tied to a Trusted Platform Module (TPM) that checks the boot path has not been tampered with, optionally with a personal identification number (PIN) for preboot authentication.
2. Store recovery keys centrally so data is not lost if the device fails or the TPM refuses to release the key.
3. Encrypt removable media and sensitive file stores.
4. Replace plaintext management protocols with encrypted ones (Secure Shell (SSH) instead of Telnet, HTTPS instead of HTTP, secure file transfer instead of File Transfer Protocol (FTP)); see `### Secure versus insecure protocol pairs with default ports (reference)`.

**Why it matters:** Laptops and phones get lost; with full disk encryption the loss is a hardware cost, not a data breach. Encrypted management protocols keep admin passwords off the wire.

**Common confusions:** Disk encryption does not protect files while the device is unlocked and in use, or files copied elsewhere. A password-only disk unlock with no lockout is weaker than TPM plus PIN. The enterprise mitigation sets the policy for all data; this hardening step is the per-device configuration that carries it out.

**Scenario:** A field engineer's laptop is stolen from a car; it is BitLocker-encrypted with TPM and PIN. The hardening step that protects the data is full disk encryption. Host-based firewall is the closest wrong answer, because it protects against network attacks, not someone reading the stolen drive.

### Installation of endpoint protection (antivirus, anti-malware, EDR)

Endpoint protection is security software installed on each device (laptops, servers, phones) to prevent, detect and respond to threats there. It ranges from signature-based antivirus and anti-malware to endpoint detection and response (EDR), which records detailed behavior (processes, network connections, registry and file changes) and supports investigation and response.

How it works:
1. Prevention: block known malware by signature and reputation; block known bad behaviors (for example script engines launched by Office, credential theft from memory).
2. Detection: behavior analysis flags unknown malware and fileless attacks that signatures miss.
3. Investigation: EDR keeps a timeline of activity so analysts can see how an attack started.
4. Response: isolate the device, stop and quarantine files, run scans, collect evidence, often from a central console.

**Why it matters:** Endpoints are where users click and where malware runs; protection there stops many attacks and gives the visibility to answer "what happened on this machine."

**Common confusions:** Antivirus mainly matches known signatures; EDR adds behavior detection and response. EDR is not a full audit log of every event. A host-based intrusion prevention system (HIPS) is a related capability often included in endpoint suites, focused on blocking attacks on the host.

**Scenario:** A company's antivirus missed a fileless attack that ran entirely through PowerShell in memory; it wants to see process chains and isolate affected machines remotely. The answer is endpoint protection with EDR. A host-based firewall is the closest wrong answer, because it filters traffic but does not watch processes or investigate.

### Host-based firewall as a hardening step

A host-based firewall is software on an individual device that filters network traffic into and out of that device, by application, address, protocol and port. Because it travels with the device, it protects it on any network, including public Wi-Fi and inside a breached internal network.

How it is configured:
1. Default: block unsolicited inbound traffic and allow outbound unless a rule says otherwise (the usual default for desktop operating systems).
2. Allow only the inbound services the device really offers (a server's application port, management from admin subnets only).
3. Use network profiles: stricter rules on public networks than on the domain network.
4. Optionally restrict outbound traffic for servers so only expected connections leave.
5. Manage rules centrally so users cannot loosen them.

**Why it matters:** It adds a layer inside the network, blocking lateral movement between workstations that never need to talk to each other, and protects laptops away from the office.

**Common confusions:** A network firewall protects a segment at its boundary; a host-based firewall protects one device wherever it is. A host firewall filters traffic; it does not inspect behavior on the host (host-based intrusion prevention system (HIPS) or endpoint detection and response (EDR) do). Disabling the firewall to "fix" an application problem is a classic weakening of hardening.

**Scenario:** Workstations should never accept file sharing connections from other workstations, but the internal network is flat. The answer is a host-based firewall on each workstation blocking those inbound connections. A network firewall is the closest wrong answer, because the traffic between workstations never crosses a network firewall on a flat network.

### Host-based intrusion prevention system (HIPS)

A host-based intrusion prevention system (HIPS) is software on a single host that watches that host's activity (the processes it runs, its logs, its own network traffic, which files are opened or altered, and changes to its configuration) for signs of attack and acts to stop them, not only alert. It combines attack signatures with knowledge of expected behavior to catch known and some unknown attacks.

How it works:
1. Monitor host events against signatures (known attack patterns) and against normal behavior profiles (anomalies).
2. When an event matches, act: block the process or connection, prevent a file or registry change, terminate the action.
3. Log and alert so analysts can review, and tune rules to reduce false positives.
Deploying with prevention turned off first, then enabling it after tuning, avoids blocking legitimate work.

**Why it matters:** It stops attacks at the last point before damage: a process trying to overwrite system files, inject into another process or install a rootkit.

**Common confusions:** HIPS prevents; a host-based intrusion detection system (HIDS) only detects and alerts. HIPS works on one host; a network IPS inspects traffic for many hosts at a network point. Signature detection misses new attacks; anomaly detection catches more but raises more false positives.

**Scenario:** A server must automatically stop any process that tries to modify protected system binaries or load an unsigned kernel driver. The answer is HIPS. HIDS is the closest wrong answer, because it would only alert after the change.

### Disabling ports and protocols (least functionality)

Disabling ports and protocols means turning off every network service, listening port and protocol a system does not need, and replacing insecure protocols with secure ones. It also covers unused physical ports, such as switch ports in empty offices.

How it is done:
1. List what the system must offer (for a web server, the web service and secured management).
2. Scan the system to see what actually listens.
3. Stop and disable unneeded services, close their ports in the host firewall, and remove the software where possible.
4. Replace plaintext protocols with encrypted ones (see `### Secure versus insecure protocol pairs with default ports (reference)`).
5. Shut down or assign unused switch ports to an unused virtual LAN (VLAN).
6. Rescan to confirm, and keep it that way with configuration enforcement.

**Why it matters:** An open port with a forgotten service is an entry point; fewer listening services means fewer things to patch and attack. Insecure defaults such as open Telnet or File Transfer Protocol (FTP) services are a routine finding on networked devices.

**Common confusions:** Blocking a port at the firewall hides a service; disabling the service removes it, which is stronger. Disabling unneeded protocols is hardening; an access control list (ACL) controls who may reach the services that remain.

**Scenario:** A scan of a new file server shows Telnet, FTP and a web admin page listening, though administrators use Secure Shell (SSH) and nobody uses the web page. The answer is disabling ports and protocols (turn off Telnet, FTP and the web admin service). Default password changes is the closest wrong answer, because even with strong passwords the plaintext services still expose credentials and attack surface.

### Default password changes (default credential removal)

Default password changes means replacing factory-set or vendor-default passwords on devices, applications, databases and accounts with strong unique ones before the system goes into use, and renaming or disabling default accounts where possible.

How it is done:
1. Inventory every device and application with a login, including cameras, printers, routers, building controllers and appliances.
2. Change the default password at installation, before network connection.
3. Use a unique password per device, stored in a password manager or privileged access tool.
4. Disable or rename default admin and guest accounts, and remove hard-coded credentials where the vendor allows.
5. Scan regularly for devices still accepting default credentials.

**Why it matters:** Default passwords are published in manuals and online lists, so they take no skill to use. The Mirai botnet built itself from cameras and routers using a short list of default credentials, then launched record distributed denial-of-service (DDoS) attacks; rebooting removed the infection, but devices were reinfected quickly unless the default password was changed first.

**Common confusions:** This counters the default credentials threat vector from objective 2.2. A strong password policy does not help if the device never had its default changed. Changing the password but leaving the service exposed to the internet is only half the job.

**Scenario:** Internet Protocol (IP) cameras in a warehouse are found sending floods of traffic to an outside target; each still accepts its factory login. The hardening step that prevents this is default password changes (plus not exposing management to the internet). Removal of unnecessary software is the closest wrong answer, because the cameras' firmware is needed; the weak point is the credential.

### Removal of unnecessary software (attack surface reduction)

Removal of unnecessary software means uninstalling applications, services, features, sample content and preinstalled extras (bloatware) a system does not need for its role. Every installed program can contain vulnerabilities and needs patching, so fewer programs mean fewer risks.

How it is done:
1. Define what each system role needs.
2. Inventory installed software and compare against that list.
3. Uninstall extras, including vendor trial programs, toolbars, games and old runtimes; disable optional features (for example macros or plug-ins) that the role does not use.
4. Build new systems from a minimal, hardened image so extras never appear.
5. Check regularly for software that has crept back.

**Why it matters:** It reduces the patching workload and removes vulnerable code before attackers find it; bloatware with high-privilege updaters is a typical example.

**Common confusions:** Removal of software is different from disabling ports: removing the program also removes its vulnerabilities, while closing a port only hides a service from the network. An application allow list stops unapproved programs from running; removal takes them off the system entirely. Both can be used together.

**Scenario:** New laptops ship with a vendor support tool, two trial suites and a game, none needed for work, and the support tool has a known privilege escalation flaw. The answer is removal of unnecessary software. Patching is the closest wrong answer; patching the tool fixes this flaw, but removing it eliminates the tool and all its future flaws.

### Segmentation vs isolation vs air gap (separation comparison)

All three separate systems, but by different amounts. The decisive question is how much traffic is still allowed.

| Control | How much traffic remains | Typical use | Weak point |
|---|---|---|---|
| Segmentation | Defined, filtered flows between zones | Separate users, servers, payment systems, building controls | Rules too broad, or virtual LANs (VLANs) with no filtering between them |
| Isolation (quarantine, sandbox, endpoint detection and response (EDR) isolation) | None or almost none, often temporary | Contain an infected host, run untrusted code | Must be lifted carefully after cleanup |
| Air gap | No physical network connection at all | Highly sensitive or safety systems | Removable media and people bridge the gap |

**Why it matters:** Picking too little separation leaves lateral movement open; picking too much breaks business flows that must continue.

**Common confusions:** A virtual LAN (VLAN) is a segmentation tool, not isolation. Sandboxing is isolation of a process or application, not of a whole network. An air gap is an extreme form of isolation and still needs controls on media and maintenance laptops.

**Scenario:** A laboratory controller must never connect to any network, and updates are carried in on scanned, approved media. The answer is an air gap. Segmentation fails because it still allows defined network traffic.

### Application allow list vs deny list (blocklist) comparison

Both control what software may run, but from opposite defaults. The decisive feature is what happens to a program nobody has seen before.

| Approach | Default for unknown software | Strength | Cost |
|---|---|---|---|
| Allow list (allowlisting, application control) | Blocked | Stops new and unknown malware | Upkeep for every new app and update; hard on general desktops |
| Deny list (blocklist) | Allowed | Easy to run, few false blocks | Misses anything not yet listed |

**Why it matters:** For fixed-purpose systems (kiosks, point of sale, servers) the allow list gives far stronger protection for modest upkeep. For fast-changing desktops, organizations often combine reputation-based blocking, endpoint detection and response (EDR) and allow lists for high-risk groups.

**Common confusions:** Antivirus signatures work like a deny list of known bad code. An allow list based only on file name or path is weak; hash or publisher identification is stronger. Run an allow list in audit mode first to see what it would block.

**Scenario:** A security team wants to make sure a newly written piece of ransomware cannot run on the payroll servers, even before any vendor has a signature for it. The answer is an application allow list. A deny list fails because the new ransomware is not on any list yet.

### ACL vs permissions vs least privilege (access control comparison)

These three terms describe one idea at different levels: the principle, the list and the individual rights.

| Term | What it is | Example |
|---|---|---|
| Least privilege | The principle: minimum access needed, nothing more | Help desk can reset passwords but not change admin groups |
| Access control list (ACL) | The list of entries on a resource or interface saying who or what may access it | Router rule list; a folder's list of users and groups |
| Permissions | The specific rights granted in those entries | Read, write, modify, execute, full control |

**Why it matters:** The right answer depends on the scope asked for: "which principle" (least privilege), "which mechanism on the router" (ACL), "which setting stops interns editing files" (permissions).

**Common confusions:** A network ACL decides which traffic passes; file permissions decide what a logged-in user can do with a file. Least privilege is achieved through both, plus role design and separate admin accounts.

**Scenario:** A question asks which control lets the finance group read but not change a budget folder. The answer is permissions (read-only for finance), set in the folder's ACL. Least privilege is the reason, but the control being configured is the permission.

### HIPS vs HIDS vs host-based firewall vs endpoint protection (host defense comparison)

The four host defenses overlap in modern suites, but each has a decisive job.

| Control | Decisive job | Acts or only alerts? | Sees |
|---|---|---|---|
| Host-based firewall | Filters traffic in and out of one host | Acts (allow or block) | Addresses, ports, applications |
| Host-based intrusion detection system (HIDS) | Detects attack signs on one host | Alerts only | Logs, file changes, processes, host traffic |
| Host-based intrusion prevention system (HIPS) | Detects and stops attack activity on one host | Acts | Same as HIDS, plus can block actions |
| Endpoint protection (antivirus, endpoint detection and response (EDR)) | Prevents, detects and responds to malware and intrusions | Acts and supports investigation | Files, behavior, process timelines |

**Why it matters:** A question that says "block" points to HIPS or a firewall; "alert only" points to HIDS; "traffic by port" points to the firewall; "investigate and isolate the machine" points to EDR.

**Common confusions:** A host firewall does not look at what processes do once traffic is allowed. HIDS and HIPS use signatures (known patterns) and anomalies (deviations from normal). A network IPS protects many hosts from one network point; HIPS protects the host it runs on.

**Scenario:** An administrator wants an alert, but no blocking, when files in a server's system folder change, to avoid breaking an application during testing. The answer is HIDS (or HIPS in detect-only mode). HIPS with prevention on fails the requirement, because it would block the change.

### Hardening vs configuration enforcement vs patching (system upkeep comparison)

These three keep systems secure, but they change different things at different times.

| Control | What it changes | When |
|---|---|---|
| Hardening | Settings and installed features: remove extras, close ports, change defaults, enable protections | At build, before exposure, and when roles change |
| Configuration enforcement | Keeps settings matching the approved baseline; detects and fixes drift; may gate network access | Continuously |
| Patching | The vendor's code, fixing known flaws | On release, by priority, emergency for exploited flaws |

**Why it matters:** A fully patched system with default passwords is still exposed, and a hardened system drifts without enforcement. All three are needed.

**Common confusions:** A secure baseline is the output of hardening decisions and the input to configuration enforcement. Patching cannot fix a misconfiguration; configuration cannot fix a coding flaw (though disabling a vulnerable feature can mitigate it until a patch arrives).

**Scenario:** Months after a server was hardened, someone re-enabled remote desktop for convenience. The control that detects and reverses this is configuration enforcement. Hardening fails as the answer because it was already done; the problem is drift.

### Choosing a mitigation (2.5 decision path)

Start from the threat or the constraint in the scenario, pick the mitigation whose purpose matches it, and check the "not when" line before answering.

1. Attackers could move from one compromised area to others: segmentation. Not when the system must have no connectivity at all (use isolation or an air gap).
2. One host is infected or suspicious and must be contained now: isolation (quarantine or endpoint detection and response (EDR) network isolation). Not as a long-term design for systems that need to talk to others.
3. Only specific software should ever run (kiosks, point of sale, servers): application allow list. Not ideal alone on fast-changing developer desktops without good upkeep.
4. Known vulnerability with a vendor fix: patching. Not available for zero-days or end-of-life systems; use temporary mitigations, segmentation or isolation, or retire the system.
5. Data must stay confidential if stolen or intercepted: encryption at rest and in transit. Not a defense against a logged-in account that is allowed to read the data.
6. Need to spot attacks and misuse, or prove controls work: monitoring. Not a preventive control by itself.
7. Accounts and services have more rights than their tasks need: least privilege, applied through permissions and ACLs. Not a replacement for authentication strength (multifactor authentication (MFA)).
8. Which hosts or traffic may reach a resource: access control list (ACL) on the network path. Which users may do what to an object: permissions.
9. Settings keep drifting or devices join while noncompliant: configuration enforcement and network access control (NAC) posture checks.
10. Equipment or a service is being retired: decommissioning with sanitization and removal from Domain Name System (DNS), firewalls, accounts and inventory.
11. A new or exposed system: hardening (the seven techniques), each matched to its threat: default credentials to default password changes, open services to disabling ports and protocols, bloatware and extra code to removal of unnecessary software, network attacks on the device to a host-based firewall, malware to endpoint protection, host attack activity to host-based intrusion prevention system (HIPS), lost devices to encryption.

When NOT to stop at one answer: real defenses are layered. If a question asks for the BEST single control, pick the one that addresses the stated threat most directly, and reject controls that only detect when the question asks to prevent, or that prevent when the question asks to find out what happened.

Worked example: "Unpatchable industrial controllers must keep talking to one historian server but nothing else." Constraint: no patch, limited required traffic. Choice: segmentation with tight ACLs (and monitoring). Rejected: patching (impossible), air gap (breaks the historian link).

