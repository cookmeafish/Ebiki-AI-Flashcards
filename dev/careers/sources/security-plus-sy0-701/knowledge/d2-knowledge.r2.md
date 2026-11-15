# 2.0 Threats, Vulnerabilities, and Mitigations

The second Security+ SY0-701 domain, worth about 22% of the exam. It covers who attacks and why (2.1), how they get in (2.2), the weaknesses they exploit (2.3), how to recognize attacks in progress (2.4) and how organizations reduce the risk (2.5).

**Exam focus:** Five objectives: 2.1 actors and motivations, 2.2 vectors and attack surfaces, 2.3 vulnerabilities, 2.4 indicators of malicious activity, 2.5 mitigations; 2.4 is a "given a scenario" objective, so expect performance-based log and symptom questions; many terms repeat across objectives (buffer overflow, brute force, supply chain, encryption), so read which context the question asks about.

## 2.1 Compare and contrast common threat actors and motivations


**What the exam expects:** Compare threat actors by type, attributes and motivation, and pick the most likely actor or motive from a short scenario.

### Threat actors

A threat actor is the person or group responsible for a security event. SY0-701 lists six: nation-state, unskilled attacker, hacktivist, insider threat, organized crime and shadow IT.

- **Example:** A ransomware gang, a disgruntled employee and a government hacking unit are all threat actors with very different skills and goals.
- **Exam tip:** Compare actors by attributes (internal/external, funding, sophistication) and motivation; insiders and shadow IT are internal, the rest usually external; highest capability: nation-states; lowest: unskilled attackers.

#### Nation-state

A government or government-sponsored group that attacks other countries, organizations or people. It has the most resources and sophistication and often runs long, stealthy campaigns called advanced persistent threats (APTs).

- **Example:** Stuxnet, the worm that damaged Iranian uranium centrifuges, is widely attributed to nation-states.
- **Exam tip:** Highest funding and capability; usual motives: espionage, data exfiltration, disruption, war; often linked to APTs that persist undetected for long periods; trap: a well funded criminal gang after money is organized crime, not a nation-state.

#### Unskilled attacker

An attacker with little technical skill who runs tools, scripts or exploits written by others. SY0-701 uses this term for what was once called a script kiddie.

- **Example:** A teenager downloads a ready-made DDoS tool and points it at a school website.
- **Exam tip:** Low sophistication and low funding, usually external; motives: notoriety, disruption, curiosity; can still do real damage with ready-made tools; old name: script kiddie.

#### Hacktivist

A hacker who attacks to promote a political, social or philosophical cause. Common methods are website defacement, DDoS and leaking documents.

- **Example:** A group defaces a company website with a protest message after the company announces a controversial policy.
- **Exam tip:** Motive: philosophical or political beliefs, not money; sophistication varies widely; usually external; Anonymous is the classic example.

#### Insider threat

A current or former employee, contractor or partner who misuses legitimate access to harm the organization, on purpose or by carelessness.

- **Example:** A system administrator who was passed over for promotion copies the customer database before resigning.
- **Exam tip:** Internal actor with existing access and knowledge, so perimeter controls do not stop them; motives: revenge, financial gain, being bribed; mitigations: least privilege, separation of duties, monitoring, offboarding.

#### Organized crime

Professional criminal groups that attack for profit. They are well funded, organized like businesses and often skilled.

- **Example:** A ransomware group encrypts a hospital network and demands payment in cryptocurrency.
- **Exam tip:** Motive: financial gain above all; high resources and sophistication; typical activities: ransomware, fraud, data theft for sale, extortion; tell apart from nation-state by the money motive.

#### Shadow IT

Employees or departments using hardware, software or cloud services without approval from the IT or security team. It is usually not malicious but creates unmanaged, unpatched and unmonitored risk.

- **Example:** The marketing team signs up for an unapproved file sharing service and uploads customer lists to it.
- **Exam tip:** Internal, usually not malicious; risk comes from systems IT does not know about, patch or secure; often driven by convenience or a slow approval process; fix with clear policy and approved alternatives.

### Attributes of actors

The characteristics used to compare threat actors: whether they are internal or external, how much resources and funding they have, and their level of sophistication or capability.

- **Example:** A nation-state is external, very well funded and highly capable; an unskilled attacker is external, poorly funded and low capability.
- **Exam tip:** Three attributes on the exam: internal/external, resources/funding, sophistication/capability; funding usually drives capability; used to predict what an actor can do and how persistent it will be.

#### Internal/external

Describes where the actor sits relative to the organization. Internal actors (insiders, shadow IT) already have access inside; external actors must first get in from outside.

- **Example:** An employee abusing database rights is internal; a criminal sending phishing emails from abroad is external.
- **Exam tip:** Internal actors bypass perimeter defenses and know the environment; external actors need an initial access vector; an external attacker using stolen credentials is still external.

#### Resources/funding

How much money, people, time and tooling a threat actor can spend on attacks. More resources allow custom tools, zero-day exploits and long campaigns.

- **Example:** A nation-state can buy or develop zero-day exploits; a lone hacktivist relies on free tools.
- **Exam tip:** Highest: nation-states and organized crime; lowest: unskilled attackers and many hacktivists; high funding enables persistence and APT-style operations.

#### Level of sophistication/capability

How technically skilled an actor is, from running others' scripts to writing custom malware and discovering zero-day vulnerabilities.

- **Example:** An APT group writes custom implants that evade antivirus, while an unskilled attacker uses a public exploit kit.
- **Exam tip:** Ranges from unskilled attacker (lowest) to nation-state (highest); often follows funding; sophisticated attacks are stealthy and persistent.

### Motivations

Why attackers attack. Money drives most of it (financial gain, often through blackmail). Others want secrets (espionage, data exfiltration), to stop a service (service disruption, disruption/chaos), to make a point (philosophical/political beliefs), to get even (revenge), or to help (ethical hacking); nations may attack as an act of war.

- **Example:** A hacktivist is motivated by beliefs, organized crime by money, an angry ex-employee by revenge.
- **Exam tip:** Questions often give the behavior and ask the motive; one actor can have several motives; match: money to organized crime, beliefs to hacktivists, espionage/war to nation-states, revenge to insiders.

#### Data exfiltration

Stealing data by moving it out of the organization without authorization, for sale, leverage or intelligence.

- **Example:** Attackers copy millions of customer records and credit card numbers and sell them on a dark web market.
- **Exam tip:** Exfiltration is the unauthorized transfer out; data can be sold, used for blackmail or espionage; detected by unusual outbound traffic volume (see resource consumption); mitigated by DLP and encryption.

#### Espionage

Spying to gain secret information, such as government intelligence or a competitor's trade secrets.

- **Example:** A foreign intelligence unit breaks into a defense contractor to steal aircraft designs.
- **Exam tip:** Typical of nation-states (and corporate competitors); stealth matters more than speed; differs from data exfiltration for profit by its intelligence goal.

#### Service disruption

Making a system or service unavailable to its users, attacking availability.

- **Example:** A DDoS attack takes an online bank offline during a holiday weekend.
- **Exam tip:** Targets availability in the CIA triad; methods: DDoS, ransomware, sabotage; used by hacktivists, nation-states and extortionists.

#### Blackmail

Forcing a victim to pay or act by threatening to release damaging information or keep harming them.

- **Example:** Attackers steal embarrassing executive emails and threaten to publish them unless paid.
- **Exam tip:** Closely tied to stolen data and double-extortion ransomware (encrypt plus threaten to leak); ultimately often financial.

#### Financial gain

Attacking to make money through ransom, fraud, theft or selling stolen data.

- **Example:** A criminal group runs business email compromise to trick finance staff into wiring money.
- **Exam tip:** The most common motive overall; the defining motive of organized crime; can also drive insiders.

#### Philosophical/political beliefs

Attacking to advance a cause, ideology or political position rather than for money.

- **Example:** A group leaks an energy company's internal documents to protest its environmental record.
- **Exam tip:** The defining motive of hacktivists; often public actions such as defacement, DDoS and leaks.

#### Ethical

Hacking with good intentions: finding weaknesses to get them fixed, with permission or through responsible disclosure.

- **Example:** A researcher finds a flaw in a web app through the vendor's bug bounty program and reports it.
- **Exam tip:** White-hat or authorized hacking: penetration testers, bug bounty hunters; goal is improving security; permission and disclosure separate it from malicious hacking.

#### Revenge

Attacking to get back at a person or organization for a perceived wrong.

- **Example:** A fired employee uses an account that was never disabled to delete project files.
- **Exam tip:** Typical of insider threats, especially disgruntled or terminated staff; mitigate with prompt offboarding and least privilege.

#### Disruption/chaos

Attacking simply to cause trouble, confusion or damage, with no financial or political goal.

- **Example:** An attacker floods a gaming server with traffic just to watch players get disconnected.
- **Exam tip:** Common with unskilled attackers seeking notoriety; differs from service disruption by having no further goal; differs from hacktivism by having no cause.

#### War

Cyber attacks used by one nation against another as part of armed conflict or military strategy, often against critical infrastructure.

- **Example:** Malware takes down parts of a country's power grid during a military conflict.
- **Exam tip:** Nation-state motive; targets: power, communications, government, military systems; cyberwarfare can accompany physical conflict.

### Comparison: threat actors at a glance

| Actor | Internal/external | Resources/funding | Sophistication | Typical motivation |
|---|---|---|---|---|
| Nation-state | External | Very high | Very high (APTs, zero-days) | Espionage, war, disruption, data exfiltration |
| Unskilled attacker | External | Low | Low (others' tools) | Notoriety, disruption/chaos |
| Hacktivist | Usually external | Low to medium | Varies | Philosophical/political beliefs |
| Insider threat | Internal | Uses existing access | Varies, but knows the environment | Revenge, financial gain |
| Organized crime | External | High | High | Financial gain, blackmail |
| Shadow IT | Internal | Department budget | Usually low | Convenience, not malice |

### Exam tips
- Read the motive first: money means organized crime, a cause means hacktivist, secrets or war mean nation-state, a grudge means insider.
- Shadow IT is a threat actor on SY0-701 even though it is usually not malicious.
- "Ethical" is a motivation: authorized hacking such as penetration tests and bug bounties.
- Disruption/chaos has no further goal; service disruption may serve another goal such as extortion or protest.

### Check yourself
1. A group with custom malware and zero-day exploits stays hidden in a ministry network for two years. Which actor? **Nation-state (APT), motivated by espionage.**
2. An accountant uses a personal cloud drive to sync work spreadsheets without IT approval. Which actor? **Shadow IT.**
3. A fired engineer's still-active VPN account is used to delete source code. Actor and motive? **Insider threat, revenge.**
4. Attackers encrypt a city's servers and demand Bitcoin. Actor and motive? **Organized crime, financial gain.**
5. Which attribute best separates an insider from other actors? **Internal: they already have legitimate access.**

## 2.2 Explain common threat vectors and attack surfaces


**What the exam expects:** Recognize the paths attackers use to get in (message, image, file, voice, removable media, software, networks, ports, default credentials, supply chain) and every listed social engineering technique, and know how each widens the attack surface.

### Message-based

Attacks delivered through messaging: email, Short Message Service (SMS) and instant messaging (IM). They carry malicious links, attachments or social engineering.

- **Example:** A fake package-delivery text asks the user to tap a link and pay a "redelivery fee".
- **Exam tip:** Three channels: email, SMS, IM; email-based is phishing, SMS-based is smishing; filtering and user training are the main defenses.

#### Email

The most common attack vector: messages carrying phishing links, malicious attachments or fraudulent requests.

- **Example:** An email that appears to come from IT asks users to "verify your password" on a fake login page.
- **Exam tip:** Defenses: spam and malware filtering, SPF, DKIM and DMARC, link rewriting, user training; vector for phishing and business email compromise.

#### Short Message Service (SMS)

Text messages to phones used to deliver malicious links or social engineering. Phishing by SMS is called smishing.

- **Example:** A text claims your bank account is locked and links to a fake bank site.
- **Exam tip:** SMS has no built-in sender authentication, so spoofing is easy; mobile screens hide full URLs; attack name: smishing.

#### Instant messaging (IM)

Chat platforms (workplace chat, consumer messengers, social media DMs) used to send malicious links, files or impersonation messages.

- **Example:** An attacker with a compromised colleague's chat account sends coworkers a "shared document" link that installs malware.
- **Exam tip:** Messages from known contacts are trusted more, which attackers exploit; may bypass email filtering; files and links in chat need scanning too.

### Image-based

Malicious content hidden in or delivered by image files, such as scripts embedded in SVG images or data concealed with steganography.

- **Example:** An SVG "image" attached to an email contains embedded JavaScript that redirects the viewer to a phishing page.
- **Exam tip:** SVG is XML and can carry HTML and JavaScript; steganography hides data inside images; images may slip past filters that trust picture formats.

### File-based

Malicious code delivered inside files such as executables, documents with macros, PDFs, scripts or compressed archives.

- **Example:** A Word document asks the user to "enable content", which runs a macro that downloads malware.
- **Exam tip:** Common carriers: Office macros, PDFs, ZIP/RAR archives, executables; defenses: attachment scanning, sandboxing, disabling macros, application allow lists.

### Voice call

Phone calls used to deceive victims into revealing information or taking actions. Phishing by voice is called vishing.

- **Example:** A caller claiming to be from the help desk asks an employee to read out the MFA code just sent to their phone.
- **Exam tip:** Attack name: vishing; caller ID is easily spoofed; also includes war dialing and call tampering; verify by calling back a known number.

### Removable device

USB drives and other removable media used to bring malware in or carry data out, including across air gaps.

- **Example:** An attacker drops USB sticks labeled "Salaries 2026" in the lobby; an employee plugs one in and malware runs.
- **Exam tip:** Can cross air-gapped networks (Stuxnet spread this way); some devices act as keyboards (USB keystroke injection); defenses: disable USB storage, device control policies, training.

### Vulnerable software

Software with flaws an attacker can exploit, on clients, servers or apps. Every installed program adds to the attack surface.

- **Example:** An unpatched browser plugin lets a malicious website run code on the visitor's computer.
- **Exam tip:** Patch and update; remove unneeded software to shrink the attack surface; scan for known vulnerabilities; contrast client-based (installed) vs agentless.

#### Client-based vs. agentless

Two ways vulnerable software reaches users. Client-based software is installed on each device, so a flaw or infected executable sits on every endpoint and every copy needs updates. Agentless software installs nothing locally: users connect to a central system (such as a web app) each time, so one compromised server can infect every client that connects.

- **Example:** A flawed desktop chat app must be patched on all 2,000 laptops (client-based); a hacked web portal serves malicious code to every employee who signs in (agentless).
- **Exam tip:** Client-based: risk spread across every endpoint, each copy must be updated; agentless: nothing to patch on the client, but one compromised central system reaches every user; the difference is where the code runs and where it gets fixed.

### Unsupported systems and applications

Systems or software past their support period that no longer get security patches, so new vulnerabilities stay open forever.

- **Example:** A factory still runs Windows XP on a control workstation, which receives no updates.
- **Exam tip:** No patches means known exploits keep working; related to end-of-life and legacy hardware (2.3); mitigate with upgrade, isolation or segmentation and compensating controls.

### Unsecure networks

Networks that let attackers listen in, connect without authorization or tamper with traffic: wireless, wired and Bluetooth.

- **Example:** A user joins open coffee-shop Wi-Fi where an attacker captures unencrypted traffic.
- **Exam tip:** Three types listed: wireless, wired, Bluetooth; fixes: strong encryption (WPA3), 802.1X network access control, disabling unused ports and pairing.

#### Wireless

Wi-Fi networks that are open, use weak encryption such as WEP, or allow rogue and evil twin access points.

- **Example:** An attacker sets up an evil twin access point named like the hotel Wi-Fi to capture guests' traffic.
- **Exam tip:** Weak or no encryption (open, WEP, old WPA) is the problem; use WPA3 and 802.1X; watch for rogue APs and evil twins.

#### Wired

Physical network ports and cabling that let anyone who plugs in reach the network when there is no port security or network access control.

- **Example:** A visitor plugs a laptop into an open Ethernet jack in a conference room and gets an IP address on the internal network.
- **Exam tip:** Physical access to a jack equals network access without 802.1X or port security; disable unused switch ports; monitor for unknown devices.

#### Bluetooth

Short-range wireless connections that can be abused when devices are discoverable, use weak pairing or have unpatched Bluetooth flaws.

- **Example:** An attacker in a train station exploits an unpatched phone's Bluetooth stack to take control of it (as with BlueBorne).
- **Exam tip:** Attacks: bluejacking (unsolicited messages), bluesnarfing (data theft); reduce risk by turning off discoverability and patching.

### Open service ports

Network ports listening for connections. Each open port is a service that can be attacked, so unneeded ones enlarge the attack surface.

- **Example:** A scan finds Telnet (port 23) open on a router; an attacker connects and tries default credentials.
- **Exam tip:** Every open port is a potential entry point; close or firewall unused services; find them with port scans (nmap); related mitigation: disabling ports/protocols.

### Default credentials

Factory-set usernames and passwords (such as admin/admin) that are publicly documented. Leaving them unchanged lets anyone log in.

- **Example:** The Mirai botnet took over hundreds of thousands of IoT cameras and routers by logging in with default passwords.
- **Exam tip:** Default passwords are published in manuals and online lists; change them at installation; Mirai is the classic example; mitigation: default password changes (2.5).

### Supply chain

Attacking an organization through the third parties it relies on: managed service providers (MSPs), vendors and suppliers.

- **Example:** Attackers compromise an IT management vendor and push malware to all its customers through a software update.
- **Exam tip:** Exploits trust in a third party; examples: SolarWinds Orion (2020), Target breach via an HVAC vendor (2013); mitigate with vendor risk assessment and least privilege for third parties; 2.3 lists supply chain as a vulnerability too.

#### Managed service providers (MSPs)

Companies that remotely manage customers' IT. Compromising one MSP can give an attacker access to every client it manages.

- **Example:** The 2021 Kaseya VSA attack used an MSP remote management tool to deliver ransomware to many downstream businesses.
- **Exam tip:** One breach, many victims; MSPs often hold privileged remote access; limit and monitor their access and require MFA.

#### Vendors

Third parties that provide products or services and may have network access or supply software, creating a path into the customer.

- **Example:** In the 2013 Target breach, attackers used credentials stolen from an HVAC vendor to enter Target's network.
- **Exam tip:** Vendor access must follow least privilege and be segmented; assess vendor security before onboarding; monitor vendor accounts.

#### Suppliers

Providers of hardware, components or materials. A tampered or counterfeit part can introduce a hidden weakness before the product even arrives.

- **Example:** Counterfeit network switches bought from an unauthorized reseller contain modified firmware.
- **Exam tip:** Risks: counterfeit or tampered hardware; buy from trusted, authorized sources; verify integrity on receipt.

### Human vectors/social engineering

Manipulating people into revealing information or performing actions that help an attacker, exploiting trust, urgency, authority or fear.

- **Example:** A caller posing as a senior manager pressures a new help desk worker to reset a password immediately.
- **Exam tip:** Messages that trick people: phishing (email), smishing (text), vishing (voice), business email compromise; pretending to be someone: impersonation, brand impersonation, pretexting; traps on the web: watering hole sites and typosquatted domains; false information: misinformation/disinformation; levers: authority, urgency, scarcity, familiarity, trust; best defense: security awareness training plus verification procedures.

#### Phishing

Fraudulent messages, usually email, that pretend to be from a trusted source to steal credentials, money or install malware. Spear phishing targets specific people; whaling targets executives.

- **Example:** An email that looks like a Microsoft 365 alert links to a fake sign-in page that captures passwords.
- **Exam tip:** Email channel; vishing is voice, smishing is SMS; spear phishing = targeted, whaling = high-level executives; signs: urgency, mismatched links and sender domains.

#### Vishing

Voice phishing: using phone calls or voicemail to trick people into giving information or taking action.

- **Example:** A caller spoofing the bank's number asks the victim to confirm their card PIN to "stop fraud".
- **Exam tip:** Vishing = voice; smishing = SMS; caller ID can be spoofed; AI voice cloning makes it more convincing; verify by calling a known number.

#### Smishing

SMS phishing: text messages that lure victims to malicious links or ask for personal information.

- **Example:** A text says "Your toll payment is overdue, pay now" with a link to a fake payment site.
- **Exam tip:** Smishing = SMS text; vishing = voice call; phishing = email; short links hide the real destination.

#### Misinformation/disinformation

False information spread to influence people. Misinformation is false but shared without intent to deceive; disinformation is created and spread deliberately to mislead.

- **Example:** A coordinated campaign of fake social media accounts spreads a false story that a company's product is dangerous.
- **Exam tip:** Key difference is intent: disinformation is deliberate, misinformation is not; spread via social media, bots, fake reviews; aimed at reputation, elections or public opinion.

#### Impersonation

Pretending to be someone else, such as IT support, an executive, a vendor or a delivery person, to gain trust or access.

- **Example:** An attacker in a high-visibility vest says he is from the electricity company and is let into the server room.
- **Exam tip:** Often uses authority or familiarity; usually part of pretexting; defense: verify identity through a separate known channel.

#### Business email compromise

An attack using a compromised or spoofed business email account, often an executive's or vendor's, to trick staff into wiring money or sending sensitive data.

- **Example:** A finance clerk gets an email from the CFO's real (hacked) mailbox asking to urgently change a supplier's bank details.
- **Exam tip:** Goal is usually financial fraud through wire transfers or invoice changes; may use a real compromised account, so the sender looks legitimate; defense: out-of-band verification of payment changes, MFA.

#### Pretexting

Creating a made-up scenario (a pretext) with a believable story to get the victim to give information or access.

- **Example:** A caller says, "Hi, I'm from your car insurer, we just need to confirm your address and date of birth for your claim."
- **Exam tip:** The invented story is the defining feature; often combined with impersonation; attacker may have done research to sound credible.

#### Watering hole

An attacker compromises a website that the target group is known to visit and infects it, then waits for the victims to come.

- **Example:** Attackers infect an industry association's website frequented by engineers at defense companies.
- **Exam tip:** Attacker does not contact the victim directly; targets a group via a trusted third-party site; defense: patching, web filtering, layered endpoint protection.

#### Brand impersonation

Pretending to be a well known company, using its logos, look and style in emails, ads or websites to fool people.

- **Example:** A fake "PayPal" email with the real logo says your account is limited and links to a fake login page.
- **Exam tip:** Copies trusted brands to lower suspicion; often in phishing and fake ads; differs from typosquatting, which relies on a misspelled domain.

#### Typosquatting

Registering domain names that are common misspellings of legitimate ones, so users who mistype land on the attacker's site. Also called URL hijacking.

- **Example:** An attacker registers "gooogle.com" or "micorsoft.com" to host a phishing page.
- **Exam tip:** Relies on typing mistakes or look-alike names; also known as URL hijacking; defenses: register common misspellings, DNS filtering, user care.

### Comparison: social engineering look-alikes

| Attack | Channel or method | Key clue |
|---|---|---|
| Phishing | Email | Fake message with link or attachment |
| Vishing | Voice call or voicemail | Caller asks for info or action |
| Smishing | SMS text | Text with a link |
| Business email compromise | Real or spoofed business mailbox | Request to wire money or change bank details |
| Pretexting | Any | Invented, believable story |
| Impersonation | Any | Pretending to be a specific person or role |
| Brand impersonation | Email, ads, websites | Real company logos and look |
| Typosquatting | Web domains | Misspelled domain (URL hijacking) |
| Watering hole | Compromised third-party website | Victim group's favorite site is infected |
| Misinformation/disinformation | Social media, news | False info; disinformation is deliberate |

### Vector vs attack surface
- **Threat vector**: the path or method used to get in (email, USB, open port).
- **Attack surface**: all the points that could be attacked. Shrink it by closing ports, removing software, changing defaults and disabling unused accounts.

### Exam tips
- Match the channel: email = phishing, voice = vishing, SMS = smishing.
- Spear phishing targets specific people; whaling targets executives.
- Default credentials and open service ports are the classic IoT problems (Mirai).
- Supply chain appears in 2.2 as a vector and in 2.3 as a vulnerability: same idea, different angle.

### Check yourself
1. Users get texts claiming a parcel is held and must pay a fee via a link. Which attack? **Smishing.**
2. An attacker registers "paypa1.com" to host a login page. Which technique? **Typosquatting (URL hijacking).**
3. Attackers infect a professional forum that a target company's engineers read daily. Which attack? **Watering hole.**
4. The CFO's real mailbox, taken over by attackers, asks accounts payable to change a supplier's bank account. Which attack? **Business email compromise.**
5. Which vector lets malware cross an air gap? **Removable device.**

## 2.3 Explain various types of vulnerabilities


**What the exam expects:** Explain each category of vulnerability and its examples, and tell look-alikes apart (SQLi vs XSS, TOC vs TOU, side loading vs jailbreaking).

### Application

Flaws in how software is written or updated that let attackers run code or change its behavior: memory injection, buffer overflow, race conditions and malicious updates.

- **Example:** A program that does not check input length lets an attacker overwrite memory and run code.
- **Exam tip:** Listed: memory injection, buffer overflow, race conditions (TOC/TOU), malicious update; fixes: secure coding, input validation, code review, patching.

#### Memory injection

Inserting malicious code into the memory of a running, often trusted, process so it runs with that process's rights. DLL injection is a common form.

- **Example:** Malware injects a DLL into a legitimate browser process so its activity looks like normal browser traffic.
- **Exam tip:** Code runs inside a legitimate process, helping it hide and evade detection; often fileless; DLL injection is the usual example; detected by EDR behavior monitoring.

#### Buffer overflow

A flaw where a program writes more data into a memory buffer than it can hold, overwriting nearby memory. Attackers use it to crash the program or run their own code.

- **Example:** A login field accepts 5,000 characters into a 64-byte buffer, overwriting the return address so the attacker's code runs.
- **Exam tip:** Cause: no bounds or input-length checking; result: crash (DoS) or code execution; defenses: input validation, safe functions, DEP and ASLR; as a 2.4 indicator it appears as crashes and odd long inputs.

#### Race conditions

A flaw where the result depends on the timing of two or more events, so an attacker can act in the gap between them. The classic form is time-of-check to time-of-use (TOCTOU).

- **Example:** Two simultaneous withdrawal requests both check the same balance before either deducts it, allowing the account to be overdrawn.
- **Exam tip:** Exploits the window between checking a condition and using the result; TOC = check moment, TOU = use moment; fix with locking and atomic operations.

##### Time-of-check (TOC)

The moment a program verifies something, such as a file's permissions or an account balance, before acting on it. The race condition exists if that result can change before it is used.

- **Example:** A program checks that a user may write to /tmp/report at 10:00:00.000.
- **Exam tip:** TOC is the CHECK; TOU is the USE that follows; vulnerability is the gap between them (TOCTOU); trap: TOC itself is not the attack, the change in the gap is.

##### Time-of-use (TOU)

The moment a program acts on the result of an earlier check. If the attacker changed things after the check, the program uses something it never verified.

- **Example:** After the permission check, the attacker swaps /tmp/report for a link to /etc/passwd, and the program writes to that file at time of use.
- **Exam tip:** TOU comes after TOC; the attacker strikes between the two; prevent by making check and use one atomic step or locking the resource.

#### Malicious update

A software update that has been tampered with to include malware, so trusted update channels deliver the attack.

- **Example:** In 2020 attackers inserted a backdoor into SolarWinds Orion updates, which up to about 18,000 customers downloaded.
- **Exam tip:** Abuses trust in vendor updates; ties to supply chain; defenses: verify digital signatures and hashes, test updates, monitor vendor advisories; even signed updates can be malicious if the vendor's build is compromised.

### Operating system (OS)-based

Weaknesses in the operating system itself, such as kernel flaws or privilege escalation bugs. The OS is a large, complex attack surface that touches everything on the system.

- **Example:** Microsoft Patch Tuesday regularly fixes Windows flaws that would let a normal user gain SYSTEM rights.
- **Exam tip:** Mitigate by patching quickly (test first), hardening and removing unneeded features; OS bugs can expose every application on the host.

### Web-based

Flaws in web applications, mainly from failing to validate input, that let attackers inject commands or scripts. SY0-701 lists SQL injection and cross-site scripting.

- **Example:** A search box that passes text straight into a database query lets an attacker dump the user table.
- **Exam tip:** Two listed: SQLi (attacks the database/server) and XSS (attacks other users' browsers); root cause: untrusted input not validated or encoded; OWASP Top 10 is the reference.

#### Structured Query Language injection (SQLi)

An attack where SQL code is inserted into an application's input so the database runs the attacker's commands, exposing or changing data.

- **Example:** Typing ' OR 1=1 -- into a login field makes the query return every row, logging the attacker in without a password.
- **Exam tip:** Targets the database behind the app; look for quote characters, OR 1=1, UNION SELECT in logs; fix: parameterized queries (prepared statements), input validation, least privilege for the DB account; XSS targets browsers instead.

#### Cross-site scripting (XSS)

A flaw where a site includes untrusted input in its pages without encoding it, so an attacker's script runs in other users' browsers. Types: reflected (non-persistent), stored (persistent) and DOM-based.

- **Example:** An attacker posts a comment containing a script tag on a forum; every visitor's browser runs it and sends their session cookie to the attacker.
- **Exam tip:** Script runs in the victim's browser, trusting the site; stored XSS is saved on the server, reflected XSS comes back in a crafted link; look for script tags in input; fix: output encoding, input validation, Content Security Policy.

### Hardware

Weaknesses in physical devices and their low-level software: firmware flaws and devices that are end-of-life or legacy.

- **Example:** A network printer's firmware has a known flaw the manufacturer never fixed.
- **Exam tip:** Listed: firmware, end-of-life, legacy; hardware is often hard or impossible to patch; isolate devices you cannot update.

#### Firmware

Flaws in the embedded software that controls hardware (BIOS/UEFI, device controllers). Only the manufacturer can fix it, and updates are often rare or ignored.

- **Example:** A flaw in a server's management controller firmware lets attackers take remote control below the operating system.
- **Exam tip:** Runs below the OS, so OS security tools may not see it; fix depends on the vendor releasing updates; keep firmware updated and verify its integrity (secure boot).

#### End-of-life

Hardware the manufacturer no longer sells. Support and patches may continue for a set time; once support ends (end of service life, EOSL), new flaws stay unfixed.

- **Example:** A router model reached end of life years ago and its support has now ended; a new remote-code flaw is found but no firmware fix is released.
- **Exam tip:** EOL = no longer sold, support may continue for a while; EOSL = support and patches have stopped; plan replacement before support ends; legacy hardware is often EOL too.

#### Legacy

Old hardware still in use, often because a critical system depends on it, that may be outdated, unsupported or unable to run modern security controls.

- **Example:** A hospital keeps a 20-year-old MRI controller running an old OS because replacing it costs millions.
- **Exam tip:** Often kept for business reasons; may be EOL too; mitigate with segmentation, isolation and compensating controls.

### Virtualization

Weaknesses in hypervisors and virtual machines that break the separation between VMs or between a VM and the host: VM escape and resource reuse.

- **Example:** A flaw in a hypervisor's virtual device driver lets code in one VM read another VM's memory.
- **Exam tip:** Listed: VM escape, resource reuse; the hypervisor is a high-value target because it controls every VM; patch hypervisors and limit VM sprawl.

#### Virtual machine (VM) escape

Breaking out of a virtual machine to reach the hypervisor or host, and from there other VMs. It is one of the most serious virtualization flaws.

- **Example:** At the Pwn2Own hacking contest, researchers ran code in a guest VM that broke out to the host by exploiting a flaw in the hypervisor's emulated hardware.
- **Exam tip:** Defeats VM isolation; attacker gains control of host and other guests; mitigate by patching hypervisors and limiting guest features.

#### Resource reuse

When memory, storage or other resources are reassigned from one VM to another without being fully cleared, so leftover data can be read by the new VM.

- **Example:** A new VM is given disk blocks that previously belonged to another customer and recovers fragments of their files.
- **Exam tip:** Risk from shared, overcommitted or reallocated resources; leaks data between tenants or VMs; hypervisor must wipe resources before reuse.

### Cloud-specific

Weaknesses that arise in cloud environments: misconfigured storage or permissions, insecure APIs, weak authentication, and confusion over the shared responsibility model.

- **Example:** A company leaves a cloud storage bucket publicly readable, exposing customer records to anyone with the URL.
- **Exam tip:** Most cloud breaches come from customer misconfiguration, not the provider; know the shared responsibility model; protect APIs and identities with MFA.

### Supply chain

Weaknesses introduced by the third parties an organization depends on: service providers, hardware providers and software providers.

- **Example:** A widely used open-source library contains a flaw, making every application that includes it vulnerable (as with Log4j in 2021).
- **Exam tip:** Trust in third parties extends the attack surface; listed: service, hardware and software providers; mitigate with vendor assessments, SBOMs, integrity checks; 2.2 lists supply chain as a vector too.

#### Service provider

Risk from external providers of services, such as cloud, payroll or IT support, that hold your data or access. Their weaknesses become yours.

- **Example:** A payroll processing company is breached, exposing every client's employee bank details.
- **Exam tip:** You cannot outsource accountability; assess providers and set security terms in contracts; limit what access and data they get.

#### Hardware provider

Risk that hardware is counterfeit, tampered with or built with flawed components before it reaches you.

- **Example:** In 2020, F-Secure found counterfeit Cisco Catalyst switches that were built to bypass Cisco's software authentication checks; they were found when they failed after an update.
- **Exam tip:** Buy from trusted, authorized sources; check device integrity and firmware; hard to detect after deployment.

#### Software provider

Risk that software you buy or include contains vulnerabilities, malicious code or compromised updates, including open-source components and libraries.

- **Example:** The Log4j flaw affected thousands of products that bundled the logging library without their users knowing.
- **Exam tip:** Includes third-party libraries and dependencies; track components with a software bill of materials (SBOM); verify code signatures; malicious update is a related 2.3 item.

### Cryptographic

Weaknesses in how cryptography is chosen or used: outdated algorithms, short keys, poor key management, weak random numbers or bad certificates.

- **Example:** A site still accepts SSL 3.0 and uses MD5 hashes, letting attackers break or forge protected data.
- **Exam tip:** Examples: weak algorithms (DES, RC4, MD5, SHA-1), short keys, exposed private keys, expired or self-signed certs; usually the implementation fails, not the math; ties to downgrade, collision and birthday attacks (2.4).

### Misconfiguration

Insecure settings on otherwise sound systems: open permissions, unnecessary services, default settings or accounts, or disabled security features.

- **Example:** A database server is exposed to the internet with no password because remote access was enabled for testing and never turned off.
- **Exam tip:** Among the most common causes of breaches, especially in the cloud; fixes: secure baselines, configuration management and enforcement, regular audits.

### Mobile device

Weaknesses in smartphones and tablets, especially from installing apps outside official stores (side loading) and removing built-in restrictions (jailbreaking or rooting).

- **Example:** An employee jailbreaks a company iPhone to install an unofficial app, which turns out to contain spyware.
- **Exam tip:** Listed: side loading, jailbreaking; both bypass the platform's security model; control with mobile device management (MDM) that detects and blocks them.

#### Side loading

Installing apps from outside the official app store, skipping the store's security review.

- **Example:** A user installs an Android APK downloaded from a forum to get a "free premium" version of an app; it contains malware.
- **Exam tip:** Bypasses app store vetting; easier on Android than iOS; does not require jailbreaking; block with MDM.

#### Jailbreaking

Removing the manufacturer's restrictions on a mobile device (on iOS; the Android equivalent is rooting) to gain full control and install anything.

- **Example:** A user jailbreaks an iPhone, which disables protections and lets any app reach system files.
- **Exam tip:** Jailbreaking = iOS, rooting = Android; gives root-level access and weakens the security model; side loading only installs outside apps, jailbreaking removes OS limits; MDM can detect it.

### Zero-day

A vulnerability unknown to the vendor or with no patch available yet, so defenders have had zero days to fix it. An exploit for it is a zero-day exploit.

- **Example:** Attackers exploit an unknown browser flaw for weeks before the vendor learns of it and releases a fix.
- **Exam tip:** No patch exists, so signature-based tools miss it; defenses: layered security, behavior-based detection, least privilege, rapid patching once released; valuable to nation-states.

### Comparison: commonly confused vulnerabilities

| Pair | How to tell them apart |
|---|---|
| SQLi vs XSS | SQLi attacks the database through the server; XSS runs script in other users' browsers |
| TOC vs TOU | TOC is when the check happens; TOU is when the checked thing is used; the attack lands in between |
| Side loading vs jailbreaking | Side loading installs apps from outside the store; jailbreaking (iOS) or rooting (Android) removes OS restrictions |
| End-of-life vs legacy | EOL: the vendor stops selling it and support ends later (EOSL); legacy: old but still in use, may or may not be EOL |
| VM escape vs resource reuse | Escape breaks out to the host; resource reuse leaks leftover data between VMs |
| Memory injection vs buffer overflow | Injection puts code into another process's memory; overflow writes past a buffer's end |
| Zero-day vs unpatched known flaw | Zero-day has no patch yet; a known flaw has a patch that was not applied |

### Exam tips
- Most cloud breaches are customer misconfigurations, not provider failures (shared responsibility model).
- Cryptographic vulnerabilities are usually about weak algorithms, short keys, bad key management or bad certificates, not broken math.
- Malicious updates and Log4j-style library flaws are supply chain problems; an SBOM helps track components.
- Hardware you cannot patch (firmware without updates, EOL, legacy) is mitigated with isolation, segmentation and compensating controls.

### Check yourself
1. A program checks a file's permissions, then an attacker swaps the file before the program writes to it. Which vulnerability? **Race condition (TOCTOU).**
2. A search field returns every customer when given ' OR 1=1 --. Which vulnerability? **SQL injection.**
3. A forum post steals visitors' session cookies when they view it. Which vulnerability? **Stored cross-site scripting.**
4. A new VM can read data left in memory by a previous tenant. Which vulnerability? **Resource reuse.**
5. Employees install apps on Android from websites instead of the Play Store. Which vulnerability? **Side loading.**

## 2.4 Given a scenario, analyze indicators of malicious activity


**What the exam expects:** Given symptoms, logs or a story, identify the attack type (malware, physical, network, application, cryptographic, password) and recognize the listed indicators of compromise. Expect performance-based questions.

### Malware attacks

Malicious software designed to harm systems or steal data. SY0-701 lists ransomware, Trojan, worm, spyware, bloatware, virus, keylogger, logic bomb and rootkit.

- **Example:** A user opens a fake invoice, a Trojan installs, and it later drops ransomware across the network.
- **Exam tip:** Tell apart: virus needs user action and a host file, worm spreads by itself over networks, Trojan disguises itself as legitimate, rootkit hides deep in the OS, logic bomb waits for a trigger; bloatware is unwanted preinstalled software, often not malicious.

#### Ransomware

Malware that encrypts the victim's files (or locks the system) and demands payment, usually in cryptocurrency, for the key. Many groups also steal data and threaten to leak it (double extortion).

- **Example:** WannaCry (2017) encrypted hundreds of thousands of computers worldwide and demanded Bitcoin payments.
- **Exam tip:** Indicators: files renamed with odd extensions, ransom notes, mass file changes; best recovery: tested offline backups; defenses: patching, EDR, least privilege; paying does not guarantee recovery.

#### Trojan

Malware disguised as legitimate or desirable software. It does not replicate itself; it relies on the user installing it, then opens access or runs harmful code.

- **Example:** A "free video converter" installs fine but also installs a remote access Trojan (RAT) giving the attacker control.
- **Exam tip:** Disguise is the defining feature; does not self-replicate (unlike worms and viruses); RAT = remote access Trojan, a backdoor; common source: pirated or free software.

#### Worm

Self-replicating malware that spreads across networks on its own by exploiting vulnerabilities, with no user action and no host file needed.

- **Example:** WannaCry spread worm-style through an SMB vulnerability, jumping from computer to computer inside networks.
- **Exam tip:** Spreads automatically without user action (virus needs a user and a host file); indicators: sudden network traffic spikes, many infected hosts quickly; defenses: patching, firewalls, segmentation.

#### Spyware

Malware that secretly watches the user and collects information such as browsing, keystrokes, location or credentials, and sends it to the attacker.

- **Example:** A free browser toolbar records every website visited and sells the data, while also capturing form entries.
- **Exam tip:** Purpose is surveillance and data theft; often bundled with free software or Trojans; keyloggers are a type of spyware; differs from bloatware, which is unwanted but not spying.

#### Bloatware

Unnecessary software preinstalled by the manufacturer or bundled with other apps. It uses storage and resources and can add vulnerabilities, even if it is not malicious.

- **Example:** A new laptop arrives with trial antivirus, games and a vendor updater that has a known security flaw.
- **Exam tip:** Usually not malicious, just unwanted; risk: wasted resources and extra attack surface; fix: uninstall it (removal of unnecessary software, 2.5).

#### Virus

Malware that attaches to a host file or program and spreads when the user runs or opens it. Types include program, boot sector, script, macro and fileless viruses.

- **Example:** A macro virus in a spreadsheet infects other documents each time an infected file is opened.
- **Exam tip:** Needs user action and a host to spread; a worm needs neither; fileless viruses live in memory and use tools like PowerShell; defense: antivirus/EDR with current signatures.

#### Keylogger

Malware (or a hardware device) that records keystrokes to capture passwords, card numbers and messages, then sends them to the attacker.

- **Example:** A keylogger on a hotel business center PC captures a guest's webmail password.
- **Exam tip:** Captures input before encryption, so HTTPS does not help; can be software or a USB hardware dongle; MFA limits the value of stolen passwords.

#### Logic bomb

Malicious code that waits until a specific condition is met, such as a date, an event or a user being removed, then runs its payload.

- **Example:** An administrator plants code that deletes the payroll database if his account is ever disabled.
- **Exam tip:** Defined by its trigger (time, event, condition); often planted by insiders; hard to detect with signatures because it is custom; defense: change management, code review, monitoring.

#### Rootkit

Malware that hides deep in the operating system, often in the kernel, to conceal itself and other malware while keeping privileged access.

- **Example:** A rootkit modifies the kernel so its files and processes do not show in Task Manager or antivirus scans.
- **Exam tip:** Main feature is stealth at the kernel level; normal tools may not see it; defenses: secure boot, UEFI, scanning from outside the OS, often reimaging the system.

### Physical attacks

Attacks on physical security: forcing entry (brute force), copying access badges (RFID cloning) and attacking the environment (power, heating, cooling).

- **Example:** An attacker clones a staff badge from a few centimeters away in a coffee line and walks into the office.
- **Exam tip:** Listed: brute force, RFID cloning, environmental; physical access often defeats digital controls; defenses: locks, guards, cameras, badge plus PIN, environmental monitoring.

#### Brute force

Using physical force to get in: breaking doors, windows, locks or barriers, or forcing open equipment.

- **Example:** An intruder pries open a rear fire door and kicks in the wiring closet door.
- **Exam tip:** Physical force, not password guessing (that is brute force under password attacks); indicators: damaged doors, broken locks, alarms; defenses: reinforced doors, bollards, alarms, cameras.

#### Radio frequency identification (RFID) cloning

Copying the data from an RFID access badge or key fob with a reader, then writing it to a blank card to impersonate the owner.

- **Example:** An attacker uses a hidden reader to capture an employee's badge ID in an elevator, then opens the server room with a clone.
- **Exam tip:** Many badges send a fixed ID without encryption, so they are easy to copy; indicator: badge used in two places at once or at odd hours; defenses: encrypted badges, MFA (badge plus PIN or biometric), shielded sleeves.

#### Environmental

Attacking the environment systems support: power, heating and cooling (HVAC), humidity or fire suppression, to cause outages or damage.

- **Example:** Attackers hack a data center's HVAC controls and turn off cooling, causing servers to overheat and shut down.
- **Exam tip:** Targets availability; HVAC and building systems are often networked and poorly secured; defenses: segment building systems, monitor temperature and power, backup power.

### Network attacks

Attacks against network traffic and services: DDoS (amplified, reflected), DNS attacks, wireless attacks, on-path, credential replay and malicious code.

- **Example:** An attacker poisons ARP tables on a LAN so all traffic passes through their laptop.
- **Exam tip:** Listed: DDoS, DNS attacks, wireless, on-path, credential replay, malicious code; look for traffic anomalies, unusual DNS answers, and ARP tables where one MAC address answers for several IP addresses or the gateway IP suddenly has a new MAC (ARP poisoning).

#### Distributed denial-of-service (DDoS)

Overwhelming a target with traffic or requests from many sources, often a botnet, so legitimate users cannot reach it. A DoS uses one source; a DDoS uses many.

- **Example:** The 2016 Mirai botnet of hacked IoT devices flooded DNS provider Dyn, knocking major websites offline.
- **Exam tip:** Attacks availability; DoS = one source, DDoS = many (botnet); variants: amplified and reflected; defenses: upstream filtering, scrubbing services, CDN, rate limiting.

##### Amplified

A DDoS that sends small requests to services that return much larger responses, multiplying the traffic the attacker generates. DNS, NTP and memcached are common amplifiers.

- **Example:** Attackers send tiny NTP "monlist" queries that each trigger a response hundreds of times larger, aimed at the victim.
- **Exam tip:** Amplified = small request, big response (traffic multiplied); usually combined with reflection (spoofed source IP); UDP protocols are favored because they need no handshake.

##### Reflected

A DDoS where the attacker spoofs the victim's IP as the source of requests to third-party servers, so those servers send their replies to the victim. It hides the attacker and spreads the traffic across many sources.

- **Example:** Attackers send DNS queries with the victim's IP as the source to thousands of open resolvers, which all answer the victim.
- **Exam tip:** Reflected = spoofed source makes others reply to the victim (hides the attacker); amplified = responses bigger than requests; most real attacks are both ("reflected amplification").

#### Domain Name System (DNS) attacks

Attacks that tamper with name resolution to send users to the wrong place: DNS poisoning or spoofing, domain hijacking, and abusing DNS for amplification or tunneling.

- **Example:** Attackers poison a resolver's cache so the bank's domain points to a phishing server, and users see the right URL but the wrong site.
- **Exam tip:** DNS poisoning = false records in cache or hosts file; domain hijacking = taking over the domain registration; defenses: DNSSEC, registrar locks and MFA, monitoring DNS changes.

#### Wireless

Attacks on Wi-Fi networks, such as deauthentication (kicking users off), jamming (radio interference), rogue access points and evil twins.

- **Example:** An attacker sends forged deauthentication frames so clients disconnect and reconnect to his evil twin access point.
- **Exam tip:** Deauth uses unprotected 802.11 management frames (802.11w protects them, required in WPA3); jamming is radio interference (DoS); evil twin mimics a legitimate SSID; rogue AP is unauthorized.

#### On-path

An attacker secretly sits between two parties, reading or changing their traffic. Formerly called man-in-the-middle; ARP poisoning is a common LAN technique and on-path browser (man-in-the-browser) is a malware variant.

- **Example:** ARP poisoning on a café network makes a victim's laptop send all its traffic through the attacker's machine.
- **Exam tip:** Old name: man-in-the-middle; indicators: one MAC address mapped to several IP addresses in ARP tables, the gateway IP showing a new MAC, certificate warnings; defenses: encryption (TLS), certificate validation, dynamic ARP inspection.

#### Credential replay

Capturing valid credentials, password hashes or authentication tokens and reusing them to log in as the victim, without needing to know the plaintext password.

- **Example:** An attacker captures an NTLM hash from network traffic and uses it to authenticate to other servers (pass the hash).
- **Exam tip:** Reuses captured authentication data; pass the hash is the classic example; defenses: encryption, MFA, timestamps and nonces, Kerberos instead of NTLM; differs from application replay of session tokens/cookies.

#### Malicious code

Harmful code in any form (executables, scripts, macros, injected website code) used to exploit systems over the network.

- **Example:** Attackers injected card-skimming JavaScript into an airline's payment page, stealing customers' card details (a Magecart attack).
- **Exam tip:** Broad category: scripts, executables, macros, injected web code; can arrive by email, web or worm; defenses: anti-malware, patching, application allow lists, input validation.

### Application attacks

Attacks against applications and their logic: injection, buffer overflow, replay, privilege escalation, forgery and directory traversal.

- **Example:** A web server log shows requests containing ../../ and SQL keywords against the login page.
- **Exam tip:** Listed: injection, buffer overflow, replay, privilege escalation, forgery, directory traversal; root causes: poor input validation and weak session handling; defenses: secure coding, WAF, patching.

#### Injection

Getting attacker-supplied code run by a system. Most kinds hide code in input that the application hands to an interpreter (a database for SQL, a directory for LDAP, an XML parser, an operating system shell for command injection). DLL injection is different: it makes a running process load a malicious library, so the code runs inside that process.

- **Example:** Logs show the input admin'; DROP TABLE users;-- submitted to a web form.
- **Exam tip:** Interpreter kinds (SQL, LDAP, XML, command): indicators are code fragments in input fields and logs (quotes, semicolons, OR 1=1), defenses are input validation, parameterized queries and least privilege; DLL injection (MITRE ATT&CK T1055.001): no interpreter, the attacker writes a library path into another process and starts a thread that loads it, seen as unexpected DLLs or remote threads in a process, caught by EDR.

#### Buffer overflow

An attack that sends more data than an input buffer can hold, to crash the application or run attacker code.

- **Example:** An application keeps crashing and logs show requests with thousands of "A" characters in a username field.
- **Exam tip:** Indicators: crashes or restarts, very long input strings, unexpected code execution; defenses: input validation, patching, DEP and ASLR; the 2.3 card covers the vulnerability itself.

#### Replay

Capturing a valid session token, cookie or transaction and sending it again to impersonate the user or repeat the action.

- **Example:** An attacker steals a session cookie over unencrypted Wi-Fi and uses it to take over the victim's logged-in session (session hijacking).
- **Exam tip:** Reuses captured session data; defenses: encryption (HTTPS), session timeouts, tokens tied to one use, nonces and timestamps; network credential replay is the 2.4 network version.

#### Privilege escalation

Gaining higher access than intended. Vertical escalation moves to a higher privilege level (user to admin); horizontal escalation accesses another user's resources at the same level.

- **Example:** A standard user exploits a flaw in a service running as SYSTEM to get administrator rights.
- **Exam tip:** Vertical = up a level; horizontal = sideways to another user; indicators: unexpected admin rights or new admin accounts; defenses: patching, least privilege, monitoring.

#### Forgery

Tricking a system into sending a request it should not. Cross-site request forgery (CSRF) makes a logged-in user's browser send unwanted requests; server-side request forgery (SSRF) makes a server request internal or external resources for the attacker.

- **Example:** A malicious page silently submits a funds-transfer form to the victim's bank while the victim is logged in (CSRF).
- **Exam tip:** CSRF abuses the trust a site has in the user's browser; SSRF abuses the server to reach internal systems; defenses: anti-CSRF tokens, same-site cookies, validating server-side URLs; XSS runs script, CSRF sends requests.

#### Directory traversal

Manipulating file paths in input (for example with ../) to read files outside the folder the application is supposed to serve.

- **Example:** A request for /download?file=../../../../etc/passwd returns the server's password file.
- **Exam tip:** Indicator: ../ or encoded %2e%2e%2f sequences in URLs or logs; defenses: input validation, least privilege file permissions, no direct user-controlled paths.

### Cryptographic attacks

Attacks that weaken or bypass encryption and hashing: downgrade, collision and birthday attacks.

- **Example:** An on-path attacker forces a browser and server to use an old, breakable protocol version.
- **Exam tip:** Listed: downgrade, collision, birthday; defenses: modern protocols and algorithms, disabling legacy options, longer hashes.

#### Downgrade

Forcing two systems to fall back to an older, weaker protocol or cipher that the attacker can break. SSL stripping, which turns HTTPS into HTTP, is a related on-path technique.

- **Example:** The POODLE attack (2014) forced connections to fall back to SSL 3.0, whose padding flaw let the attacker decrypt data such as session cookies.
- **Exam tip:** Requires an on-path position; defenses: disable old protocols and ciphers (SSL, early TLS), HSTS against SSL stripping.

#### Collision

Finding two different inputs that produce the same hash value, so a forged item can pass as legitimate.

- **Example:** Researchers created two different PDF files with the same SHA-1 hash (SHAttered, 2017); MD5 collisions were used to forge certificates.
- **Exam tip:** Breaks the integrity guarantee of hashing; MD5 and SHA-1 are vulnerable; use SHA-256 or stronger; the birthday attack is the math that makes collisions easier to find.

#### Birthday

An attack based on the birthday paradox: finding any two inputs with the same hash takes far fewer tries than finding a match for one specific hash (about the square root of the possible outputs).

- **Example:** In a room of 23 people there is about a 50% chance two share a birthday; similarly, a 64-bit hash yields a collision after about 2^32 attempts.
- **Exam tip:** Explains why collisions are easier than expected; defense: longer hash outputs (SHA-256 or more); collision = the result, birthday = the method that finds it.

### Password attacks

Attempts to guess or crack passwords. SY0-701 lists spraying (few passwords, many accounts) and brute force (many passwords against one account or hash).

- **Example:** Logs show failed logins for 500 different accounts, each tried with "Spring2026!".
- **Exam tip:** Spraying = one or a few common passwords across many accounts, avoids lockout; brute force = many guesses per account, triggers lockout online; offline brute force cracks stolen hashes; defenses: MFA, lockout, strong password policy, salted hashing.

#### Spraying

Trying one or a few common passwords against many accounts, staying under each account's lockout threshold.

- **Example:** An attacker tries "Welcome1" once against every account in a company's directory, then waits an hour and tries "Password123".
- **Exam tip:** Few passwords, many accounts; avoids account lockout; indicator: many accounts with one or two failures each from the same source; defenses: MFA, banning common passwords, monitoring.

#### Brute force

Trying every possible password combination, or a very large list, until one works. Online brute force targets a live login; offline brute force cracks a stolen password hash file.

- **Example:** An attacker steals a hash database and runs billions of guesses per second on GPUs to recover passwords.
- **Exam tip:** Online: slow and triggers account lockout; offline: no lockout, limited only by computing power; defenses: lockout, long passwords, salted slow hashes; physical brute force is forcing doors.

### Indicators

Signs that an attack is happening or has happened. Watch accounts (lockouts, the same user signed in twice at once, impossible travel between logins), systems (unusual resource consumption, resources suddenly inaccessible, security tools or updates being blocked), logs (missing logs, logging at odd times) and the outside world (your data published or documented online).

- **Example:** An analyst sees log files deleted for a two-hour window, plus an admin logged in from two countries at once.
- **Exam tip:** Indicators of compromise (IoCs) are evidence of an intrusion; combine several before concluding; know each indicator's likely cause.

#### Account lockout

Accounts getting locked after too many failed logins, which may mean someone is trying to guess passwords.

- **Example:** Several users call the help desk the same morning because their accounts are locked, though they did not mistype anything.
- **Exam tip:** Suggests brute force (spraying deliberately avoids lockout); attacker may also lock accounts on purpose as a DoS; check the source of failed attempts.

#### Concurrent session usage

One account logged in more than once at the same time from different places or devices, when that is not normal for the user.

- **Example:** A user's account shows active sessions on her office PC and on an unknown laptop at the same time.
- **Exam tip:** Suggests stolen credentials or session hijacking; compare with impossible travel (logins too far apart in too little time).

#### Blocked content

Content being blocked in a suspicious way. Malware often blocks antivirus updates and security websites so it can stay on the host. Security tools may also log repeated blocked downloads or connections from an infected host.

- **Example:** The web proxy logs repeated blocked connections from one PC to a known command-and-control domain.
- **Exam tip:** A host that suddenly cannot reach antivirus updates or security sites suggests malware protecting itself; repeated proxy blocks from one host suggest malware calling out.

#### Impossible travel

Logins for the same account from locations so far apart in so short a time that no one could physically travel between them.

- **Example:** A user logs in from Chicago at 9:00 and from Moscow at 9:20.
- **Exam tip:** Strong sign of compromised credentials; VPNs can cause false positives; differs from concurrent sessions: impossible travel is about time and distance between logins.

#### Resource consumption

Unusual use of CPU, memory, disk or network bandwidth, which can signal malware, cryptomining, data exfiltration or a DoS.

- **Example:** A file server sends 50 GB to an unknown external IP at 2 a.m.
- **Exam tip:** Spikes in outbound traffic suggest exfiltration; constant high CPU suggests cryptomining; compare to a baseline of normal use.

#### Resource inaccessibility

Systems, services or files that suddenly cannot be reached or opened.

- **Example:** Users cannot open shared files, which now have strange extensions and a ransom note in each folder.
- **Exam tip:** Can indicate ransomware (encrypted files), DoS, or an attacker locking out admins; differs from resource consumption, which is about unusual usage.

#### Out-of-cycle logging

Log activity at unexpected times or outside normal schedules, such as updates, backups or admin actions that should not be happening then.

- **Example:** Logs show an OS patch installed at 3 a.m. on a Sunday, though patching only happens on Tuesday nights.
- **Exam tip:** Activity outside the normal schedule or change window is suspicious; compare to change management records.

#### Published/documented

Evidence of an attack that is made public: the attacker publishing stolen data, or researchers or vendors documenting the attack and its indicators.

- **Example:** The company learns of its breach when its customer database appears for sale on a dark web forum.
- **Exam tip:** Sometimes the first a victim hears of a breach; threat intelligence feeds publish IoCs to check against your systems.

#### Missing logs

Gaps or deleted entries in log files, often a sign an attacker covered their tracks.

- **Example:** The security log on a domain controller has no entries between 1:00 and 3:00 a.m., and the log-clear event appears at 3:01.
- **Exam tip:** Attackers delete or alter logs to hide activity; defenses: send logs to a central SIEM or write-once storage, alert on log clearing.

### Comparison: malware look-alikes

| Malware | Spreads by itself? | Defining feature |
|---|---|---|
| Virus | No, needs a user and a host file | Attaches to files or programs |
| Worm | Yes, over the network | Self-replicating, exploits vulnerabilities |
| Trojan | No | Disguised as legitimate software |
| Ransomware | Depends on its delivery | Encrypts data and demands payment |
| Rootkit | No | Hides at the kernel level |
| Logic bomb | No | Waits for a trigger (date, event) |
| Spyware / keylogger | No | Watches and steals information |
| Bloatware | No | Unwanted preinstalled software, often not malicious |

### Comparison: other look-alikes

| Pair | Difference |
|---|---|
| Amplified vs reflected DDoS | Amplified: small request, large response; reflected: spoofed source makes third parties reply to the victim; often combined |
| Spraying vs brute force | Spraying: few passwords, many accounts, avoids lockout; brute force: many guesses, causes lockout online |
| Brute force (physical) vs brute force (password) | Physical forces doors and locks; password guesses credentials |
| Credential replay vs application replay | Network credential replay reuses captured hashes or credentials (pass the hash); application replay reuses session tokens or cookies |
| Collision vs birthday | Collision is two inputs with one hash; birthday is the probability method that finds collisions faster |
| Concurrent sessions vs impossible travel | Concurrent: logged in twice at once; impossible travel: two logins too far apart for the time between them |
| CSRF vs XSS | CSRF makes the browser send an unwanted request; XSS runs attacker script in the browser |

### Exam tips
- Look for the distinguishing clue in logs: ../ = directory traversal, quotes and OR 1=1 = SQL injection, thousands of repeated characters = buffer overflow, one MAC answering for several IPs (or a changed gateway MAC) in the ARP table = on-path.
- Many accounts with one failure each = spraying; one account with thousands of failures = brute force.
- Deleted log entries (missing logs) and activity outside change windows (out-of-cycle logging) suggest an attacker hiding.
- Deauthentication frames are a wireless attack; 802.11w (mandatory in WPA3) protects management frames.

### Check yourself
1. Malware spreads to 300 hosts in an hour with no one clicking anything. Which type? **Worm.**
2. A server's logs show "GET /images/../../../../etc/shadow". Which attack? **Directory traversal.**
3. An attacker sends small DNS queries spoofed with the victim's IP to open resolvers that send large replies. Which attack? **Reflected and amplified DDoS.**
4. One IP tries "Summer2026!" once each against 2,000 accounts. Which attack? **Password spraying.**
5. A login from Sydney ten minutes after one from London for the same user. Which indicator? **Impossible travel.**

## 2.5 Explain the purpose of mitigation techniques used to secure the enterprise


**What the exam expects:** Explain what each mitigation and hardening technique is for and match it to the threat it reduces.

### Segmentation

Dividing a network into separate zones (with VLANs, subnets, firewalls) so systems with different risk or roles are separated and traffic between them is controlled.

- **Example:** Point-of-sale terminals are placed on their own VLAN so a breach of office PCs cannot reach card systems.
- **Exam tip:** Limits lateral movement and contains breaches; improves performance and compliance (PCI DSS); segmentation controls traffic between zones, isolation cuts a system off completely.

### Access control

Controlling who or what can reach which resources and what they can do there, using access control lists and permissions.

- **Example:** Only HR staff can open the personnel folder; everyone else is denied.
- **Exam tip:** Listed: access control list (ACL), permissions; enforces least privilege; covers network and file system access.

#### Access control list (ACL)

A list of rules that allow or deny access to a resource. On network devices it filters traffic by IP, port and protocol; on file systems it lists which users or groups may access an object.

- **Example:** A router ACL blocks all inbound traffic to the database subnet except TCP 1433 from the application servers.
- **Exam tip:** Rules are processed in order, with an implicit deny at the end on most devices; used on firewalls, routers and file systems.

#### Permissions

The specific rights granted to a user or group on a resource, such as read, write, modify, execute or full control.

- **Example:** Interns get read-only access to the policy library so they cannot change documents.
- **Exam tip:** Grant the minimum needed (least privilege); assign to groups rather than individuals; review regularly to remove permission creep.

### Application allow list

A policy that lets only approved applications run; anything not on the list is blocked by default. Formerly called whitelisting.

- **Example:** A kiosk PC only allows the browser and the check-in app to run, so downloaded malware cannot execute.
- **Exam tip:** Default deny, very strong against unknown malware; deny list (blocklist) blocks only known bad apps; harder to manage where software changes often.

### Isolation

Separating a system, process or device completely so it cannot interact with others, either as protection or to contain a threat.

- **Example:** An infected laptop is moved to a quarantine network with no access to company resources; a browser runs untrusted pages in an isolated sandbox.
- **Exam tip:** Contains compromised systems and protects sensitive ones (air gap, sandbox, quarantine); stronger than segmentation, which allows controlled traffic.

### Patching

Applying vendor updates that fix security flaws in operating systems, applications and firmware.

- **Example:** IT deploys an emergency browser patch within 24 hours of a zero-day exploit being reported.
- **Exam tip:** Closes known vulnerabilities; test before production, but prioritize critical fixes; automate where possible; does not help against unpatched zero-days.

### Encryption

Encoding data so only authorized parties with the key can read it, protecting it at rest and in transit.

- **Example:** Full disk encryption keeps data safe when a laptop is stolen; TLS protects web traffic.
- **Exam tip:** Protects confidentiality even if data is stolen; at rest (disk, database) and in transit (TLS, VPN); key management is critical.

### Monitoring

Continuously watching systems, networks and logs to detect suspicious activity and respond quickly.

- **Example:** A SIEM alerts the security team when an admin account logs in from a new country.
- **Exam tip:** Detective, not preventive; tools: SIEM, IDS/IPS, EDR, log aggregation; needs a baseline to spot anomalies.

### Least privilege

Giving users, processes and systems only the minimum access needed to do their job, and nothing more.

- **Example:** A help desk technician can reset passwords but cannot change domain admin group membership.
- **Exam tip:** Limits damage from compromised accounts and insiders; reduces privilege escalation impact; review access regularly.

### Configuration enforcement

Making sure systems match an approved secure baseline configuration and correcting or blocking those that drift, often checked before devices are allowed on the network.

- **Example:** Network access control checks that a laptop has current antivirus and patches before letting it connect, sending it to remediation otherwise.
- **Exam tip:** Uses secure baselines and tools like group policy, MDM and posture assessment; detects and fixes configuration drift.

### Decommissioning

Retiring systems securely: removing them from service, wiping or destroying data and storage, and updating inventories and access.

- **Example:** Before old servers are recycled, their drives are wiped and shredded, and their DNS records and firewall rules are removed.
- **Exam tip:** Prevents data leaks from discarded hardware and forgotten systems still running; sanitize or destroy media; document the process.

### Hardening techniques

Steps that reduce a system's attack surface and strengthen its defenses: encryption, endpoint protection, host-based firewall, HIPS, disabling ports and protocols, changing default passwords and removing unnecessary software.

- **Example:** A new web server gets unused services removed, the admin password changed, a host firewall turned on and EDR installed before going live.
- **Exam tip:** Goal: smallest possible attack surface per system; use vendor or CIS benchmarks as baselines; seven listed techniques.

#### Encryption

Encrypting a system's storage and communications as part of hardening, such as full disk encryption, encrypted file systems and encrypted protocols.

- **Example:** Every company laptop is configured with BitLocker full disk encryption before being issued.
- **Exam tip:** Applied per device: full disk encryption, file encryption, encrypted protocols (SSH instead of Telnet); protects data if the device is lost.

#### Installation of endpoint protection

Installing security software such as antivirus, anti-malware or endpoint detection and response (EDR) on each device to detect and block threats.

- **Example:** An EDR agent spots a process encrypting many files rapidly and isolates the laptop automatically.
- **Exam tip:** EDR adds behavior detection and response beyond signature-based antivirus; covers servers, laptops and mobile devices.

#### Host-based firewall

A software firewall running on the individual device that controls traffic in and out of that host, regardless of the network it is on.

- **Example:** Windows Defender Firewall blocks inbound file sharing on a laptop when it connects to public Wi-Fi.
- **Exam tip:** Protects the device even off the corporate network; can be application-aware; complements network firewalls.

#### Host-based intrusion prevention system (HIPS)

Software on a host that watches system and network activity for attacks and actively blocks them, not just alerts.

- **Example:** HIPS stops a program that tries to modify system files and inject code into another process.
- **Exam tip:** Prevention (blocks), unlike HIDS which only detects and alerts; uses signatures and behavior; often built into endpoint protection suites.

#### Disabling ports/protocols

Turning off network ports, services and protocols that are not needed, so they cannot be attacked.

- **Example:** Telnet and FTP are disabled on a server, leaving only SSH (TCP 22) and HTTPS (TCP 443) open.
- **Exam tip:** Reduces the attack surface (open service ports are a 2.2 vector); also disable insecure protocols; includes disabling unused physical switch ports.

#### Default password changes

Replacing factory-set default passwords on devices, applications and accounts with strong unique ones at installation.

- **Example:** A new IP camera's admin/admin login is changed to a long unique password before it is mounted.
- **Exam tip:** Directly counters the default credentials vector (Mirai botnet); applies to routers, IoT, databases and apps; also rename or disable default accounts.

#### Removal of unnecessary software

Uninstalling applications, services and features a system does not need, since every program can contain vulnerabilities.

- **Example:** A new laptop has its preinstalled trial apps and games (bloatware) removed before being issued.
- **Exam tip:** Fewer programs means fewer vulnerabilities to patch; removes bloatware; part of building a minimal secure baseline.

### Comparison: commonly confused mitigations

| Pair | Difference |
|---|---|
| Segmentation vs isolation | Segmentation separates zones but allows controlled traffic; isolation cuts a system off (quarantine, sandbox, air gap) |
| Allow list vs deny list | Allow list runs only approved apps (default deny); deny list blocks known bad apps only |
| ACL vs permissions | An ACL is the list of allow/deny rules on a resource or device; permissions are the specific rights (read, write, execute) granted |
| HIPS vs HIDS | HIPS blocks attacks; HIDS only detects and alerts |
| Host-based vs network firewall | Host-based protects one device anywhere; network firewall protects a network segment |
| Encryption (mitigation) vs encryption (hardening) | The mitigation protects data at rest and in transit across the enterprise; the hardening step configures it on each device (full disk encryption, encrypted protocols) |

### Matching mitigations to threats
- Default credentials (2.2) → default password changes.
- Open service ports (2.2) → disabling ports/protocols.
- Bloatware (2.4) → removal of unnecessary software.
- Lateral movement after a breach → segmentation, least privilege.
- Unknown malware executables → application allow list, endpoint protection.
- Known vulnerabilities → patching.
- Data leaks from retired hardware → decommissioning.
- Configuration drift → configuration enforcement.

### Check yourself
1. A company must stop a compromised office PC from reaching payment terminals while still allowing some traffic. Which mitigation? **Segmentation.**
2. An infected laptop must be kept off all company resources until cleaned. Which mitigation? **Isolation (quarantine).**
3. Only approved software should run on point-of-sale systems. Which mitigation? **Application allow list.**
4. Laptops must have current patches and antivirus before joining the network. Which mitigation? **Configuration enforcement (posture assessment).**
5. Which hardening step counters the Mirai botnet technique? **Default password changes.**
